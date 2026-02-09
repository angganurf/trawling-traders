use axum::{
    extract::{Extension, State},
    http::StatusCode,
    Json,
};
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::{
    middleware::AuthContext,
    models::{
        DocsArticleResponse, DocsArticleRow, DocsCategoryResponse, DocsCategoryRow,
        GetDocsResponse, TrackDocsEventRequest, TrackDocsEventResponse,
    },
    AppState,
};

fn parse_article_content(content: &serde_json::Value) -> Vec<String> {
    content
        .as_array()
        .map(|items| {
            items
                .iter()
                .filter_map(|item| item.as_str().map(|line| line.to_string()))
                .collect()
        })
        .unwrap_or_default()
}

fn validate_track_request(req: &TrackDocsEventRequest) -> Result<(), (StatusCode, String)> {
    let event_type = req.event_type.as_str();
    if event_type != "category_opened" && event_type != "article_opened" && event_type != "search" {
        return Err((
            StatusCode::BAD_REQUEST,
            "Invalid event_type. Expected one of: category_opened, article_opened, search"
                .to_string(),
        ));
    }

    if req.results_count.is_some_and(|count| count < 0) {
        return Err((
            StatusCode::BAD_REQUEST,
            "results_count must be zero or greater".to_string(),
        ));
    }

    Ok(())
}

pub async fn get_docs(
    State(state): State<Arc<AppState>>,
) -> Result<Json<GetDocsResponse>, (StatusCode, String)> {
    let categories: Vec<DocsCategoryRow> = sqlx::query_as(
        "SELECT id, title, description, sort_order FROM docs_categories ORDER BY sort_order, title",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let article_rows: Vec<DocsArticleRow> = sqlx::query_as(
        "SELECT id, category_id, title, summary, content, sort_order \
         FROM docs_articles \
         ORDER BY category_id, sort_order, title",
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let mut articles_by_category: HashMap<String, Vec<DocsArticleResponse>> = HashMap::new();
    for article in article_rows {
        articles_by_category
            .entry(article.category_id)
            .or_default()
            .push(DocsArticleResponse {
                id: article.id,
                title: article.title,
                summary: article.summary,
                content: parse_article_content(&article.content),
            });
    }

    let payload = categories
        .into_iter()
        .map(|category| DocsCategoryResponse {
            id: category.id.clone(),
            title: category.title,
            description: category.description,
            articles: articles_by_category
                .remove(&category.id)
                .unwrap_or_default(),
        })
        .collect();

    Ok(Json(GetDocsResponse {
        categories: payload,
    }))
}

pub async fn track_docs_event(
    State(state): State<Arc<AppState>>,
    Extension(auth): Extension<AuthContext>,
    Json(req): Json<TrackDocsEventRequest>,
) -> Result<Json<TrackDocsEventResponse>, (StatusCode, String)> {
    validate_track_request(&req)?;

    let user_id = Uuid::parse_str(&auth.user_id)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid user ID".to_string()))?;
    let query = req
        .query
        .map(|q| q.trim().to_string())
        .filter(|q| !q.is_empty());

    sqlx::query(
        "INSERT INTO docs_analytics_events \
         (user_id, event_type, category_id, article_id, query, results_count) \
         VALUES ($1, $2, $3, $4, $5, $6)",
    )
    .bind(user_id)
    .bind(req.event_type)
    .bind(req.category_id)
    .bind(req.article_id)
    .bind(query)
    .bind(req.results_count)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(TrackDocsEventResponse { success: true }))
}

#[cfg(test)]
mod tests {
    use super::validate_track_request;
    use crate::models::TrackDocsEventRequest;

    #[test]
    fn validate_track_request_accepts_known_event() {
        let req = TrackDocsEventRequest {
            event_type: "search".to_string(),
            category_id: None,
            article_id: None,
            query: Some("risk".to_string()),
            results_count: Some(2),
        };
        assert!(validate_track_request(&req).is_ok());
    }

    #[test]
    fn validate_track_request_rejects_negative_count() {
        let req = TrackDocsEventRequest {
            event_type: "search".to_string(),
            category_id: None,
            article_id: None,
            query: Some("risk".to_string()),
            results_count: Some(-1),
        };
        assert!(validate_track_request(&req).is_err());
    }
}
