use axum::{
    extract::{Extension, State},
    http::StatusCode,
    Json,
};
use chrono::{DateTime, Duration, Utc};
use serde_json::{json, Value};
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    config,
    middleware::AuthContext,
    models::{EmailCsvReportRequest, EmailCsvReportResponse, Event, EventType},
    AppState,
};

fn csv_escape(value: &str) -> String {
    let mut escaped = value.replace('"', "\"\"");
    if escaped.contains(',') || escaped.contains('\n') || escaped.contains('"') {
        escaped = format!("\"{}\"", escaped);
    }
    escaped
}

fn normalize_report_kind(value: &str) -> Option<&'static str> {
    match value {
        "tax" => Some("tax"),
        "trade-history" => Some("trade-history"),
        "full" => Some("full"),
        _ => None,
    }
}

fn cutoff_for_timeframe(timeframe: &str) -> Option<Option<DateTime<Utc>>> {
    match timeframe {
        "30d" => Some(Some(Utc::now() - Duration::days(30))),
        "90d" => Some(Some(Utc::now() - Duration::days(90))),
        "1y" => Some(Some(Utc::now() - Duration::days(365))),
        "all" => Some(None),
        _ => None,
    }
}

fn should_include_event(report_kind: &str, event_type: EventType) -> bool {
    match report_kind {
        "tax" | "trade-history" => {
            event_type == EventType::TradeOpened || event_type == EventType::TradeClosed
        }
        _ => true,
    }
}

fn build_report_csv(
    rows: &[(String, Event)],
    report_kind: &str,
    timeframe: &str,
    recipient_email: &str,
) -> String {
    let generated_at = Utc::now().to_rfc3339();
    let mut csv = String::new();
    csv.push_str("meta_key,meta_value\n");
    csv.push_str(&format!("report_kind,{}\n", csv_escape(report_kind)));
    csv.push_str(&format!("timeframe,{}\n", csv_escape(timeframe)));
    csv.push_str(&format!(
        "recipient_email,{}\n",
        csv_escape(recipient_email)
    ));
    csv.push_str(&format!("generated_at,{}\n", csv_escape(&generated_at)));
    csv.push('\n');

    csv.push_str("timestamp,bot_name,event_type,message\n");
    for (bot_name, event) in rows {
        csv.push_str(&format!(
            "{},{},{},{}\n",
            csv_escape(&event.created_at.to_rfc3339()),
            csv_escape(bot_name),
            csv_escape(&format!("{:?}", event.event_type)),
            csv_escape(&event.message)
        ));
    }

    csv
}

async fn resolve_recipient_email(
    state: &AppState,
    auth: &AuthContext,
    user_id: Uuid,
) -> Result<String, (StatusCode, String)> {
    if let Some(email) = auth.email.clone() {
        return Ok(email);
    }

    let from_db: Option<String> = sqlx::query_scalar("SELECT email FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_optional(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .flatten();

    from_db.ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            "No user email available to deliver report".to_string(),
        )
    })
}

async fn load_user_bots(
    state: &AppState,
    user_id: Uuid,
) -> Result<Vec<(Uuid, String)>, (StatusCode, String)> {
    sqlx::query_as::<_, (Uuid, String)>("SELECT id, name FROM bots WHERE user_id = $1")
        .bind(user_id)
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

async fn load_events_for_bot(
    state: &AppState,
    bot_id: Uuid,
    cutoff: Option<DateTime<Utc>>,
) -> Result<Vec<Event>, (StatusCode, String)> {
    let query = if cutoff.is_some() {
        "SELECT * FROM events WHERE bot_id = $1 AND created_at >= $2 ORDER BY created_at ASC"
    } else {
        "SELECT * FROM events WHERE bot_id = $1 ORDER BY created_at ASC"
    };

    if let Some(cutoff_time) = cutoff {
        sqlx::query_as::<_, Event>(query)
            .bind(bot_id)
            .bind(cutoff_time)
            .fetch_all(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    } else {
        sqlx::query_as::<_, Event>(query)
            .bind(bot_id)
            .fetch_all(&state.db)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
    }
}

async fn collect_report_rows(
    state: &AppState,
    bots: &[(Uuid, String)],
    cutoff: Option<DateTime<Utc>>,
    report_kind: &str,
) -> Result<Vec<(String, Event)>, (StatusCode, String)> {
    let mut report_rows: Vec<(String, Event)> = Vec::new();

    for (bot_id, bot_name) in bots {
        let events = load_events_for_bot(state, *bot_id, cutoff).await?;
        let filtered = events
            .into_iter()
            .filter(|event| should_include_event(report_kind, event.event_type));
        report_rows.extend(filtered.map(|event| (bot_name.clone(), event)));
    }

    Ok(report_rows)
}

async fn resolve_webhook_url(state: &AppState) -> Result<String, (StatusCode, String)> {
    let webhook_url_from_db =
        config::get_config_decrypted(&state.db, &state.secrets, config::keys::EMAIL_WEBHOOK_URL)
            .await;

    webhook_url_from_db
        .filter(|url| !url.trim().is_empty())
        .or_else(|| std::env::var("EMAIL_ALERT_WEBHOOK").ok())
        .ok_or_else(|| {
            (
                StatusCode::SERVICE_UNAVAILABLE,
                "Email webhook is not configured".to_string(),
            )
        })
}

async fn post_email_webhook(
    webhook_url: &str,
    payload: &Value,
) -> Result<(), (StatusCode, String)> {
    let response = reqwest::Client::new()
        .post(webhook_url)
        .json(payload)
        .send()
        .await
        .map_err(|e| {
            (
                StatusCode::BAD_GATEWAY,
                format!("Failed to call email webhook: {e}"),
            )
        })?;

    if response.status().is_success() {
        return Ok(());
    }

    let status = response.status();
    let response_body = response
        .text()
        .await
        .unwrap_or_else(|_| "unknown webhook error".to_string());

    Err((
        StatusCode::BAD_GATEWAY,
        format!("Email webhook failed ({status}): {response_body}"),
    ))
}

fn build_email_payload(
    recipient_email: &str,
    report_kind: &str,
    timeframe: &str,
    rows_included: usize,
    csv_content: String,
) -> Value {
    let file_name = format!(
        "trawling-traders-{}-{}.csv",
        report_kind,
        Utc::now().format("%Y%m%d-%H%M%S")
    );

    let subject = format!("Your requested {} report (CSV)", report_kind);
    let body = format!(
        "Attached/embedded CSV report for {} over {}. Rows: {}",
        report_kind, timeframe, rows_included
    );

    json!({
        "to": recipient_email,
        "subject": subject,
        "body": body,
        "csv_filename": file_name,
        "csv_content": csv_content,
    })
}

pub async fn request_email_csv_report(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<EmailCsvReportRequest>,
) -> Result<Json<EmailCsvReportResponse>, (StatusCode, String)> {
    let user_id = Uuid::parse_str(&auth.user_id)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid user ID".to_string()))?;

    let report_kind = normalize_report_kind(&req.report_kind).ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            "Invalid report kind. Expected one of: tax, trade-history, full".to_string(),
        )
    })?;

    let cutoff = cutoff_for_timeframe(&req.timeframe).ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            "Invalid timeframe. Expected one of: 30d, 90d, 1y, all".to_string(),
        )
    })?;

    let recipient_email = resolve_recipient_email(&state, &auth, user_id).await?;
    let bots = load_user_bots(&state, user_id).await?;
    if bots.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "No bots found. Create a bot before requesting reports.".to_string(),
        ));
    }

    let report_rows = collect_report_rows(&state, &bots, cutoff, report_kind).await?;
    let csv_content = build_report_csv(&report_rows, report_kind, &req.timeframe, &recipient_email);

    let payload = build_email_payload(
        &recipient_email,
        report_kind,
        &req.timeframe,
        report_rows.len(),
        csv_content,
    );

    let webhook_url = resolve_webhook_url(&state).await?;
    post_email_webhook(&webhook_url, &payload).await?;

    Ok(Json(EmailCsvReportResponse {
        success: true,
        message: format!(
            "Report requested. A CSV will be emailed to {}.",
            recipient_email
        ),
        delivered_to: recipient_email,
        rows_included: report_rows.len() as i64,
    }))
}
