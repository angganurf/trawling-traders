//! Admin endpoint for listing all bots with owner info, pagination, and filtering.

use axum::{extract::State, http::StatusCode, Extension, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::info;

use crate::{middleware::AdminContext, AppState};

#[derive(Debug, Deserialize)]
pub struct AdminBotsQuery {
    pub page: Option<i64>,
    pub limit: Option<i64>,
    pub status: Option<String>,
    pub user_id: Option<uuid::Uuid>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AdminBotEntry {
    pub id: uuid::Uuid,
    pub user_id: uuid::Uuid,
    pub name: String,
    pub status: String,
    pub persona: String,
    pub droplet_id: Option<i64>,
    pub region: String,
    pub ip_address: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub last_heartbeat_at: Option<chrono::DateTime<chrono::Utc>>,
    pub owner_email: Option<String>,
    pub total: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct AdminBotsResponse {
    pub bots: Vec<AdminBotItem>,
    pub total: i64,
    pub page: i64,
    pub limit: i64,
}

#[derive(Debug, Serialize)]
pub struct AdminBotItem {
    pub id: uuid::Uuid,
    pub user_id: uuid::Uuid,
    pub name: String,
    pub status: String,
    pub persona: String,
    pub droplet_id: Option<i64>,
    pub region: String,
    pub ip_address: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub last_heartbeat_at: Option<chrono::DateTime<chrono::Utc>>,
    pub owner_email: Option<String>,
}

/// GET /v1/admin/bots — list all bots with owner email, pagination, and optional filters.
pub async fn list_admin_bots(
    State(state): State<Arc<AppState>>,
    Extension(admin): Extension<AdminContext>,
    axum::extract::Query(params): axum::extract::Query<AdminBotsQuery>,
) -> Result<Json<AdminBotsResponse>, (StatusCode, String)> {
    info!("Admin {} listing bots", admin.admin_id);

    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(50).clamp(1, 100);
    let offset = (page - 1) * limit;

    let rows: Vec<AdminBotEntry> = sqlx::query_as(
        r#"
        SELECT
            b.id, b.user_id, b.name, b.status::text AS status,
            b.persona::text AS persona, b.droplet_id, b.region,
            b.ip_address, b.created_at, b.updated_at, b.last_heartbeat_at,
            u.email AS owner_email,
            COUNT(*) OVER() AS total
        FROM bots b
        LEFT JOIN users u ON u.id = b.user_id
        WHERE ($1::text IS NULL OR b.status::text = $1)
          AND ($2::uuid IS NULL OR b.user_id = $2)
        ORDER BY b.created_at DESC
        LIMIT $3 OFFSET $4
        "#,
    )
    .bind(params.status.as_deref())
    .bind(params.user_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let total = rows.first().and_then(|r| r.total).unwrap_or(0);

    let bots = rows
        .into_iter()
        .map(|r| AdminBotItem {
            id: r.id,
            user_id: r.user_id,
            name: r.name,
            status: r.status,
            persona: r.persona,
            droplet_id: r.droplet_id,
            region: r.region,
            ip_address: r.ip_address,
            created_at: r.created_at,
            updated_at: r.updated_at,
            last_heartbeat_at: r.last_heartbeat_at,
            owner_email: r.owner_email,
        })
        .collect();

    Ok(Json(AdminBotsResponse {
        bots,
        total,
        page,
        limit,
    }))
}
