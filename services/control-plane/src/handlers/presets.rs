//! Presets CRUD — reusable persona/risk profiles for bot creation.

use axum::{extract::State, http::StatusCode, Extension, Json};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::info;
use uuid::Uuid;

use crate::{middleware::AdminContext, AppState};

// ---------------------------------------------------------------------------
// Models (handler-local to avoid bloating models/mod.rs)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Preset {
    pub id: Uuid,
    pub name: String,
    pub preset_type: String,
    pub max_position: sqlx::types::BigDecimal,
    pub max_daily_loss: sqlx::types::BigDecimal,
    pub version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePresetRequest {
    pub name: String,
    pub preset_type: Option<String>,
    pub max_position: Option<f64>,
    pub max_daily_loss: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePresetRequest {
    pub name: Option<String>,
    pub preset_type: Option<String>,
    pub max_position: Option<f64>,
    pub max_daily_loss: Option<f64>,
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/// GET /v1/admin/presets — list all presets ordered by name.
pub async fn list_presets(
    State(state): State<Arc<AppState>>,
    Extension(admin): Extension<AdminContext>,
) -> Result<Json<Vec<Preset>>, (StatusCode, String)> {
    info!("Admin {} listing presets", admin.admin_id);

    let presets: Vec<Preset> = sqlx::query_as("SELECT * FROM presets ORDER BY name")
        .fetch_all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(presets))
}

/// POST /v1/admin/presets — create a preset (name must be unique).
pub async fn create_preset(
    State(state): State<Arc<AppState>>,
    Extension(admin): Extension<AdminContext>,
    Json(req): Json<CreatePresetRequest>,
) -> Result<(StatusCode, Json<Preset>), (StatusCode, String)> {
    info!("Admin {} creating preset '{}'", admin.admin_id, req.name);

    if req.name.is_empty() {
        return Err((StatusCode::BAD_REQUEST, "name is required".to_string()));
    }

    let preset: Preset = sqlx::query_as(
        r#"
        INSERT INTO presets (name, preset_type, max_position, max_daily_loss)
        VALUES ($1, $2, $3, $4)
        RETURNING *
        "#,
    )
    .bind(&req.name)
    .bind(req.preset_type.as_deref().unwrap_or("persona"))
    .bind(req.max_position.unwrap_or(0.08))
    .bind(req.max_daily_loss.unwrap_or(0.02))
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        if e.to_string().contains("unique") || e.to_string().contains("duplicate") {
            (
                StatusCode::CONFLICT,
                format!("Preset '{}' already exists", req.name),
            )
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
        }
    })?;

    Ok((StatusCode::CREATED, Json(preset)))
}

/// PATCH /v1/admin/presets/{id} — update a preset (bumps version).
pub async fn update_preset(
    State(state): State<Arc<AppState>>,
    Extension(admin): Extension<AdminContext>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
    Json(req): Json<UpdatePresetRequest>,
) -> Result<Json<Preset>, (StatusCode, String)> {
    info!("Admin {} updating preset {}", admin.admin_id, id);

    let preset: Preset = sqlx::query_as(
        r#"
        UPDATE presets SET
            name           = COALESCE($1, name),
            preset_type    = COALESCE($2, preset_type),
            max_position   = COALESCE($3, max_position),
            max_daily_loss = COALESCE($4, max_daily_loss),
            version        = version + 1,
            updated_at     = NOW()
        WHERE id = $5
        RETURNING *
        "#,
    )
    .bind(req.name.as_deref())
    .bind(req.preset_type.as_deref())
    .bind(req.max_position)
    .bind(req.max_daily_loss)
    .bind(id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| match e {
        sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "Preset not found".to_string()),
        _ => (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()),
    })?;

    Ok(Json(preset))
}

/// DELETE /v1/admin/presets/{id}
pub async fn delete_preset(
    State(state): State<Arc<AppState>>,
    Extension(admin): Extension<AdminContext>,
    axum::extract::Path(id): axum::extract::Path<Uuid>,
) -> Result<StatusCode, (StatusCode, String)> {
    info!("Admin {} deleting preset {}", admin.admin_id, id);

    let result = sqlx::query("DELETE FROM presets WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Preset not found".to_string()));
    }

    Ok(StatusCode::NO_CONTENT)
}
