//! Admin provisioning settings — read/write droplet region, size, and concurrency from platform_config.

use axum::{
    extract::{ConnectInfo, State},
    http::StatusCode,
    Extension, Json,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tracing::info;

use crate::{middleware::AdminContext, AppState};

#[derive(Debug, Serialize)]
pub struct ProvisioningSettings {
    pub regions: Vec<String>,
    pub droplet_sizes: Vec<String>,
    pub max_concurrent: i64,
}

#[derive(Debug, Deserialize)]
pub struct UpdateProvisioningSettings {
    pub regions: Option<Vec<String>>,
    pub droplet_sizes: Option<Vec<String>>,
    pub max_concurrent: Option<i64>,
}

/// Read a platform_config value, returning the given default if missing/empty.
async fn read_config(pool: &sqlx::PgPool, key: &str, default: &str) -> String {
    sqlx::query_scalar::<_, String>("SELECT value FROM platform_config WHERE key = $1")
        .bind(key)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| default.to_string())
}

/// GET /v1/admin/provisioning/settings
pub async fn get_provisioning_settings(
    State(state): State<Arc<AppState>>,
    Extension(admin): Extension<AdminContext>,
) -> Result<Json<ProvisioningSettings>, (StatusCode, String)> {
    info!("Admin {} reading provisioning settings", admin.admin_id);

    let regions_csv = read_config(&state.db, "droplet_region", "nyc3").await;
    let sizes_csv = read_config(&state.db, "droplet_size", "s-1vcpu-2gb").await;
    let max_str = read_config(&state.db, "max_concurrent_provisions", "3").await;

    Ok(Json(ProvisioningSettings {
        regions: regions_csv
            .split(',')
            .map(|s| s.trim().to_string())
            .collect(),
        droplet_sizes: sizes_csv.split(',').map(|s| s.trim().to_string()).collect(),
        max_concurrent: max_str.parse().unwrap_or(3),
    }))
}

/// PATCH /v1/admin/provisioning/settings
pub async fn update_provisioning_settings(
    State(state): State<Arc<AppState>>,
    Extension(admin): Extension<AdminContext>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Json(req): Json<UpdateProvisioningSettings>,
) -> Result<Json<ProvisioningSettings>, (StatusCode, String)> {
    info!("Admin {} updating provisioning settings", admin.admin_id);

    let pairs: Vec<(&str, String)> = [
        req.regions
            .as_ref()
            .map(|v| ("droplet_region", v.join(","))),
        req.droplet_sizes
            .as_ref()
            .map(|v| ("droplet_size", v.join(","))),
        req.max_concurrent
            .map(|v| ("max_concurrent_provisions", v.to_string())),
    ]
    .into_iter()
    .flatten()
    .collect();

    for (key, value) in &pairs {
        // Upsert into platform_config
        sqlx::query(
            r#"
            INSERT INTO platform_config (key, value, encrypted, category, updated_by)
            VALUES ($1, $2, false, 'provisioning', $3)
            ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW(), updated_by = $3
            "#,
        )
        .bind(key)
        .bind(value)
        .bind(&admin.admin_id)
        .execute(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        // Audit log
        let _ = sqlx::query(
            "INSERT INTO config_audit_log (config_key, new_value, changed_by, ip_address)
             VALUES ($1, $2, $3, $4)",
        )
        .bind(key)
        .bind(value)
        .bind(&admin.admin_id)
        .bind(addr.ip().to_string())
        .execute(&state.db)
        .await;
    }

    // Return updated settings
    get_provisioning_settings(State(state), Extension(admin)).await
}
