//! Cedros Pay integration - Full payment and subscription support
//!
//! Uses cedros-pay 1.1.8+ with SQLx 0.8 compatibility.
//! Stripe configuration is managed via cedros-pay's admin dashboard,
//! not environment variables.

use axum::Router;
use sqlx::PgPool;
use std::sync::Arc;

/// Build full Cedros Pay router
///
/// Mounted under /v1/pay/ for payment processing.
///
/// Stripe/X402 configuration is managed through cedros-pay's admin dashboard
/// at /v1/pay/admin/config. Server URL is derived from platform_config.
pub async fn full_router(pool: PgPool) -> anyhow::Result<Router> {
    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| {
        "postgres://postgres:postgres@localhost:5432/trawling_traders".to_string()
    });

    // Get control_plane_url from platform_config for server public URL
    let control_plane_url: Option<String> =
        sqlx::query_scalar("SELECT value FROM platform_config WHERE key = 'control_plane_url'")
            .fetch_optional(&pool)
            .await?;

    let public_url = control_plane_url
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "https://api.trawlingtraders.com".to_string());

    // Start with default config - Stripe/X402 settings come from cedros-pay admin dashboard
    let mut cfg = cedros_pay::config::Config::default();

    // Server config - derived from our platform settings
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    cfg.server.address = format!("0.0.0.0:{}", port);
    cfg.server.public_url = public_url;
    cfg.server.route_prefix = "".to_string(); // Empty - nesting at /v1/pay handles the prefix
    cfg.server.cors_disabled = true; // Host app manages CORS for all routes

    // Database URL required for product_source=postgres and coupon_source=postgres (both default)
    cfg.paywall.postgres_url = Some(database_url.clone());
    cfg.coupons.postgres_url = Some(database_url);

    // Cedros Login integration - allows cedros-pay to validate admin JWTs
    // by fetching JWKS from our embedded cedros-login instance
    let login_base = format!("http://127.0.0.1:{}/v1/auth", port);
    cfg.cedros_login.enabled = true;
    cfg.cedros_login.base_url = login_base;

    // Create PostgresStore from shared pool (single-step API from embedding guide)
    let store = Arc::new(cedros_pay::storage::PostgresStore::from_pool(
        pool.clone(),
        cedros_pay::config::SchemaMapping::default(),
    ));

    // WORKAROUND: cedros-login and cedros-pay share 13 migration version numbers
    // (20260123-20260202 range) with different SQL content. cedros-login runs first
    // and inserts its checksums; cedros-pay then fails with "previously applied but
    // has been modified". Fix: temporarily remove conflicting entries so cedros-pay
    // can re-apply them idempotently.
    // BUG: https://github.com/cedros-io — packages need non-overlapping version ranges.
    let conflicting: &[i64] = &[
        20260123000001, 20260124000001, 20260125000001, 20260126000001,
        20260127000001, 20260128000001, 20260130000001, 20260130000002,
        20260131000001, 20260201000001, 20260202000001, 20260202000002,
        20260202000003,
    ];
    // Save cedros-login's entries so we can restore them after cedros-pay migrates
    let saved_rows: Vec<(i64, Vec<u8>)> = sqlx::query_as(
        "SELECT version, checksum FROM _sqlx_migrations WHERE version = ANY($1)",
    )
    .bind(conflicting)
    .fetch_all(&pool)
    .await
    .unwrap_or_default();

    if !saved_rows.is_empty() {
        sqlx::query("DELETE FROM _sqlx_migrations WHERE version = ANY($1)")
            .bind(conflicting)
            .execute(&pool)
            .await?;
    }

    // Build Cedros Pay router with shared pool (runs auto-migrations).
    // cedros-pay v1.1.8+ uses ignore_missing so it tolerates foreign entries
    // in _sqlx_migrations from our app and cedros-login.
    let router_result = cedros_pay::router_with_pool(&cfg, store, Some(pool.clone()))
        .await
        .map_err(|e| anyhow::anyhow!("{}", e));

    // Restore cedros-login's entries for the conflicting versions so cedros-login
    // passes checksum validation on next restart.
    for (version, checksum) in &saved_rows {
        sqlx::query(
            "INSERT INTO _sqlx_migrations (version, description, installed_on, success, checksum, execution_time) \
             VALUES ($1, 'cedros-login-restored', NOW(), true, $2, 0) \
             ON CONFLICT (version) DO UPDATE SET checksum = $2",
        )
        .bind(version)
        .bind(checksum)
        .execute(&pool)
        .await
        .ok();
    }

    let router = router_result?;

    Ok(router)
}

/// Simple placeholder routes (used when full integration not configured)
pub fn placeholder_routes() -> Router {
    use axum::routing::get;

    Router::new()
        .route("/discovery", get(discovery))
        .route("/health", get(health))
}

/// AI Discovery manifest for payment skills
async fn discovery() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "skills": [
            {
                "id": "create_subscription",
                "name": "Create Subscription",
                "description": "Subscribe user to Trader Pro plan",
                "endpoint": "POST /v1/pay/subscription/stripe-session",
                "params": {
                    "resource": "trader-pro-monthly",
                    "interval": "month"
                }
            },
            {
                "id": "check_subscription",
                "name": "Check Subscription Status",
                "description": "Get user's current subscription status",
                "endpoint": "GET /v1/pay/subscription/status"
            }
        ],
        "status": "placeholder",
        "note": "Configure Stripe via /v1/pay/admin/config to enable payments"
    }))
}

/// Health check for payment service
async fn health() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "healthy",
        "service": "cedros-pay",
        "version": "1.1.4",
        "mode": "placeholder"
    }))
}
