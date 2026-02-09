# Embedding cedros-login + cedros-pay into an Axum App

A practical guide for integrating both Cedros packages into a single Axum server with a shared PostgreSQL database. Based on real production integration experience.

**Applies to**: cedros-pay >= 1.1.8, cedros-login >= 0.0.4, Axum 0.8, SQLx 0.8

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Your Axum Server (host app)                        │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Your Routes  │  │ cedros-login │  │ cedros-pay│ │
│  │ /v1/...      │  │ /v1/auth/... │  │ /paywall/ │ │
│  └──────┬───────┘  └──────┬───────┘  └─────┬─────┘ │
│         │                 │                │        │
│         └────────────┬────┴────────────────┘        │
│                      │                              │
│              ┌───────▼────────┐                     │
│              │ Shared PgPool  │                     │
│              │ (single DB)    │                     │
│              └────────────────┘                     │
└─────────────────────────────────────────────────────┘
```

All three systems share one `sqlx::PgPool` and one `_sqlx_migrations` table. Each package's migrator uses `ignore_missing = true` to tolerate the others' entries.

---

## Step 1: Database and Migrations

### Migration ordering

Each package manages its own migrations. The host app runs first (it owns the database), then each embedded package auto-migrates on startup.

```rust
// main.rs — Run YOUR migrations first
let db = sqlx::PgPool::connect(&database_url).await?;

let mut migrator = sqlx::migrate!("./migrations");
migrator.ignore_missing = true;  // Tolerate cedros-login + cedros-pay entries
migrator.run(&db).await?;
```

**Critical**: Set `ignore_missing = true` on your own migrator too. All three migrators share `_sqlx_migrations` — each will see entries it doesn't recognize.

### What each package creates

| Package | Tables created | Auto-migrates? |
|---------|---------------|----------------|
| Your app | Your tables | You run it manually |
| cedros-login | `users`, `sessions`, `refresh_tokens`, etc. | Yes, via `Storage::postgres_with_pool()` |
| cedros-pay | `products`, `payments`, `subscriptions`, `config_entries`, etc. | Yes, via `router_with_pool()` (v1.1.8+) |

Both cedros packages auto-migrate when you pass them a pool. You don't need to call their migrators separately.

---

## Step 2: Embed cedros-login

cedros-login provides authentication (email/password, Google OAuth, Solana wallet) and issues JWTs. You embed it for two reasons:

1. Auth endpoints for your frontend (`/v1/auth/login`, `/v1/auth/register`, etc.)
2. A `JwtService` your auth middleware uses to validate tokens on your own routes

### Build the integration

```rust
// cedros/login/mod.rs
use cedros_login::services::JwtService;

pub struct LoginIntegration {
    pub router: axum::Router,
    pub jwt_service: JwtService,
}

pub async fn full_router(pool: sqlx::PgPool) -> anyhow::Result<LoginIntegration> {
    let jwt_secret = std::env::var("JWT_SECRET")?;

    // RSA key for RS256 JWT signing. Both cedros-login AND cedros-pay's
    // CedrosLoginClient validate using the JWKS endpoint, which serves
    // the public key derived from this private key.
    let rsa_private_key_pem = std::env::var("JWT_RSA_PRIVATE_KEY").ok().or_else(|| {
        use rsa::pkcs1::EncodeRsaPrivateKey;
        tracing::warn!("JWT_RSA_PRIVATE_KEY not set - generating ephemeral key");
        let key = rsa::RsaPrivateKey::new(&mut rand::rngs::OsRng, 2048).ok()?;
        Some(key.to_pkcs1_pem(rsa::pkcs1::LineEnding::LF).ok()?.to_string())
    });

    let config = cedros_login::Config {
        server: cedros_login::config::ServerConfig {
            auth_base_path: "".to_string(), // nesting handles the prefix
            ..Default::default()
        },
        jwt: cedros_login::config::JwtConfig {
            secret: jwt_secret,
            rsa_private_key_pem,
            issuer: std::env::var("JWT_ISSUER")
                .unwrap_or_else(|_| cedros_login::config::default_issuer()),
            audience: std::env::var("JWT_AUDIENCE")
                .unwrap_or_else(|_| cedros_login::config::default_audience()),
            access_token_expiry: cedros_login::config::default_access_expiry(),
            refresh_token_expiry: cedros_login::config::default_refresh_expiry(),
        },
        cors: cedros_login::config::CorsConfig {
            allowed_origins: vec![],
            disabled: true, // Host app manages CORS
        },
        cookie: cedros_login::config::CookieConfig {
            enabled: false, // SDK uses Bearer tokens
            ..Default::default()
        },
        // Defaults for everything else
        database: Default::default(),
        email: Default::default(),
        google: Default::default(),
        apple: Default::default(),
        solana: Default::default(),
        webauthn: Default::default(),
        webhook: Default::default(),
        rate_limit: Default::default(),
        notification: Default::default(),
        sso: Default::default(),
        wallet: Default::default(),
        privacy: Default::default(),
    };

    // Extract JwtService BEFORE passing config to cedros-login
    let jwt_service = JwtService::try_new(&config.jwt)?;

    // This auto-migrates cedros-login tables
    let storage = cedros_login::Storage::postgres_with_pool(pool).await?;
    let callback = Arc::new(cedros_login::NoopCallback);
    let router = cedros_login::router_with_storage(config, callback, storage);

    Ok(LoginIntegration { router, jwt_service })
}
```

### Key: Extract the JwtService

The `JwtService` is what lets your auth middleware validate tokens issued by cedros-login. You need it in your `AppState`:

```rust
pub struct AppState {
    pub db: sqlx::PgPool,
    pub jwt_service: Option<JwtService>,
    // ...
}

// In main.rs
let login = cedros::login::full_router(db.clone()).await?;
let mut app_state = AppState::new(db.clone());
app_state.jwt_service = Some(login.jwt_service.clone());
```

---

## Step 3: Embed cedros-pay

cedros-pay provides payment processing (Solana x402, Stripe), product management, subscriptions, and an admin dashboard.

### Build the router

```rust
// cedros/pay.rs
pub async fn full_router(pool: sqlx::PgPool) -> anyhow::Result<axum::Router> {
    let database_url = std::env::var("DATABASE_URL")?;
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());

    let mut cfg = cedros_pay::config::Config::default();

    // Server config
    cfg.server.address = format!("0.0.0.0:{}", port);
    cfg.server.public_url = "https://api.yourapp.com".to_string();
    cfg.server.route_prefix = "".to_string();  // Let .merge() or .nest() handle prefixing
    cfg.server.cors_disabled = true;            // Host app manages CORS

    // Point product/coupon repos to our shared database
    cfg.paywall.postgres_url = Some(database_url.clone());
    cfg.coupons.postgres_url = Some(database_url);

    // Tell cedros-pay where cedros-login lives for JWT validation.
    // This must be reachable from the server process itself (localhost).
    cfg.cedros_login.enabled = true;
    cfg.cedros_login.base_url = format!("http://127.0.0.1:{}/v1/auth", port);

    // Create the cedros-pay store from our shared pool.
    // from_pool wraps PgPool → PostgresPool → PostgresStore in one call.
    let store = Arc::new(cedros_pay::storage::PostgresStore::from_pool(
        pool.clone(),
        cedros_pay::config::SchemaMapping::default(),
    ));

    // Build router — this auto-migrates cedros-pay tables (v1.1.8+)
    let router = cedros_pay::router_with_pool(&cfg, store, Some(pool)).await?;

    Ok(router)
}
```

### Config fields that matter for embedding

| Field | Value | Why |
|-------|-------|-----|
| `server.cors_disabled` | `true` | Your host app already has a CORS layer. cedros-pay's internal CORS would conflict. |
| `server.route_prefix` | `""` | You control prefixing via `.nest()` / `.merge()`. |
| `server.public_url` | Your domain | Used for Stripe redirect URLs. |
| `cedros_login.enabled` | `true` | Enables JWT validation for admin endpoints. |
| `cedros_login.base_url` | `http://127.0.0.1:{port}/v1/auth` | cedros-pay fetches JWKS from here. Must be reachable from the server process. |
| `paywall.postgres_url` | Your DB URL | Product and coupon repositories need this. |
| `coupons.postgres_url` | Your DB URL | Same as above. |

### Config fields you usually leave as defaults

Stripe keys, x402 payment addresses, and subscription settings are managed at runtime through cedros-pay's admin dashboard (`/admin/config`), not in the embed config. The admin dashboard persists these to the `config_entries` table.

---

## Step 4: Mount Everything

```rust
// main.rs — build_router()
let router = Router::new()
    // Your app routes
    .nest("/v1", app_routes)
    .nest("/v1/admin", admin_routes)

    // cedros-pay — merge at root (it applies its own /paywall/v1 prefix)
    .merge(cedros_pay_router)

    // cedros-login — nest under your auth prefix
    .nest("/v1/auth", cedros_login_router)

    // Health checks (no auth)
    .nest("/v1", health_routes)

    // Host app manages CORS for everything
    .layer(cors)
    .layer(TraceLayer::new_for_http());
```

### Route layout after mounting

| Prefix | Source | Auth |
|--------|--------|------|
| `/v1/auth/login`, `/v1/auth/register`, ... | cedros-login | None (public) |
| `/v1/auth/.well-known/jwks.json` | cedros-login | None (public) |
| `/paywall/v1/products`, `/paywall/v1/quote`, ... | cedros-pay | API key / public |
| `/paywall/v1/subscription/status`, ... | cedros-pay | API key |
| `/admin/stats`, `/admin/products`, ... | cedros-pay | Ed25519 or JWT |
| `/admin/config/*` | cedros-pay | Ed25519 or JWT |
| `/admin/subscriptions/settings` | cedros-pay | Ed25519 or JWT |
| `/stripe/success`, `/stripe/cancel` | cedros-pay | None (redirects) |
| `/webhook/stripe` | cedros-pay | Stripe signature |
| `/v1/...` | Your app | Your auth middleware |

---

## Step 5: Admin Authentication (JWT Contract)

cedros-pay admin endpoints (`/admin/*`) support two auth methods, tried in order:

### Method 1: Ed25519 Signature (primary)

Headers required:
- `X-Signer`: Ed25519 public key (must be in `config.admin.public_keys`)
- `X-Message`: Nonce ID (single-use, obtained from the nonce endpoint)
- `X-Signature`: Ed25519 signature of the message

### Method 2: JWT Bearer Token (fallback)

Header: `Authorization: Bearer <jwt>`

cedros-pay validates the JWT by fetching the JWKS from your embedded cedros-login instance. This is the flow:

```
Frontend → Bearer token → cedros-pay admin_middleware
                              │
                              ├─ Extract token from Authorization header
                              ├─ Fetch JWKS from {cedros_login.base_url}/.well-known/jwks.json
                              ├─ Validate signature (RS256)
                              ├─ Check claims:
                              │   ├─ exp: not expired
                              │   ├─ iss: matches jwt_issuer (if configured)
                              │   ├─ aud: matches jwt_audience (if configured)
                              │   └─ is_system_admin: must be true
                              └─ Return 403 if valid but not admin, 401 if invalid
```

### JWT Claims Structure

```json
{
  "sub": "user-uuid",           // Required: User ID
  "sid": "session-uuid",        // Optional: Session ID
  "exp": 1770566002,            // Required: Expiration (Unix timestamp)
  "iat": 1770565102,            // Optional: Issued at
  "iss": "cedros-login",        // Optional: Validated if cedros_login.jwt_issuer is set
  "aud": "cedros-app",          // Optional: Validated if cedros_login.jwt_audience is set
  "is_system_admin": true,      // Required for admin access: must be true
  "org_id": "org-uuid",         // Optional: Organization ID
  "role": "admin"               // Optional: Role within org
}
```

### How to make a user an admin

The `is_system_admin` claim is set by cedros-login based on the user's record. Use cedros-login's admin API or database to set `is_system_admin = true` on the user record. cedros-pay only checks the claim -- it doesn't manage user records.

### Configuring issuer/audience validation

If you set `JWT_ISSUER` and `JWT_AUDIENCE` env vars for cedros-login, configure cedros-pay to match:

```rust
cfg.cedros_login.jwt_issuer = Some("cedros-login".to_string());   // Must match JWT iss
cfg.cedros_login.jwt_audience = Some("cedros-app".to_string());    // Must match JWT aud
```

If not set, cedros-pay skips issuer/audience validation (only checks expiry + `is_system_admin`).

### Error messages (v1.1.5+)

| Log message | Level | Meaning |
|-------------|-------|---------|
| `Admin request authenticated via Ed25519` | `DEBUG` | Success via signature |
| `Admin request authenticated via JWT` | `DEBUG` | Success via Bearer token |
| `JWT validation failed: {error}` | `WARN` | Token rejected -- check the error for details |
| `JWT user is not a system admin` | `WARN` | Token valid but `is_system_admin` is not `true` (returns 403) |
| `Admin Ed25519 auth failed: nonce invalid` | `WARN` | Ed25519 headers present but nonce expired/consumed (returns 401) |
| `Admin Ed25519 authentication failed: invalid signature` | `WARN` | Signature doesn't match any configured admin public key (returns 403) |
| `Admin authentication failed: no valid auth method` | `WARN` | No `X-Signature` headers AND no `Authorization: Bearer` header found (returns 401) |

**Note**: Success messages are `DEBUG` level. Set `RUST_LOG=cedros_pay::middleware=debug` to see them. Failure messages are always `WARN`.

If you see "no valid auth method" with no preceding "JWT validation failed" log, it means no Authorization header reached the server at all. This is a frontend/SDK issue, not a server issue.

---

## Common Pitfalls

### 1. Migration collision (fixed in v1.1.8)

**Symptom**: `migration failed: migration X was previously applied but is missing in the resolved migrations`

**Cause**: Package migrator sees host app entries in `_sqlx_migrations` and rejects them.

**Fix**: Use cedros-pay >= 1.1.8 and cedros-login >= 0.0.4 -- both set `ignore_missing = true`. Also set it on your own migrator.

### 2. Triple CORS layer

**Symptom**: CORS preflight fails or duplicate `Access-Control-*` headers.

**Cause**: Host app + cedros-login + cedros-pay each add their own CORS layer.

**Fix**: Set `cors_disabled = true` on both cedros configs. Let the host app manage CORS.

```rust
// cedros-pay
cfg.server.cors_disabled = true;

// cedros-login
config.cors.disabled = true;
```

### 3. cedros-pay can't validate JWTs

**Symptom**: 401 on all admin endpoints with `JWT validation failed: error fetching JWKS`.

**Cause**: `cedros_login.base_url` points to an unreachable URL, or cedros-login isn't mounted at that path.

**Fix**: Use `http://127.0.0.1:{port}/v1/auth` (localhost, not your public domain). Ensure cedros-login is mounted at `/v1/auth` (or whatever path you use).

### 4. Admin endpoints return 401 even with valid JWT

**Symptom**: `JWT user is not a system admin` in logs.

**Cause**: The user's JWT has `is_system_admin: false` or the claim is missing.

**Fix**: Mark the user as a system admin in cedros-login's database.

### 5. Products table doesn't exist

**Symptom**: `relation "products" does not exist` on startup.

**Cause**: cedros-pay < 1.1.7 didn't auto-migrate in the embedded library path (`router_with_pool`).

**Fix**: Use cedros-pay >= 1.1.7. The `router_with_pool()` and `build_services()` functions now run migrations automatically when a PG pool is provided.

### 6. Route params return 404

**Symptom**: Dynamic routes like `/admin/config/{category}` return 404.

**Cause**: cedros-pay < 1.1.4 used axum 0.7 `:param` syntax instead of axum 0.8 `{param}` syntax.

**Fix**: Use cedros-pay >= 1.1.4.

---

## Minimal Working Example

```rust
use std::sync::Arc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().init();

    let database_url = std::env::var("DATABASE_URL")?;
    let pool = sqlx::PgPool::connect(&database_url).await?;

    // 1. Run YOUR migrations (ignore_missing for shared _sqlx_migrations)
    let mut migrator = sqlx::migrate!("./migrations");
    migrator.ignore_missing = true;
    migrator.run(&pool).await?;

    // 2. Embed cedros-login (auto-migrates its tables)
    let jwt_secret = std::env::var("JWT_SECRET")?;
    let login_config = cedros_login::Config {
        jwt: cedros_login::config::JwtConfig {
            secret: jwt_secret,
            ..Default::default()
        },
        cors: cedros_login::config::CorsConfig {
            disabled: true,
            ..Default::default()
        },
        ..Default::default()
    };
    // Extract JwtService for your own auth middleware (validates tokens on your routes)
    let _jwt_service = cedros_login::services::JwtService::try_new(&login_config.jwt)?;
    let storage = cedros_login::Storage::postgres_with_pool(pool.clone()).await?;
    let login_router = cedros_login::router_with_storage(
        login_config,
        Arc::new(cedros_login::NoopCallback),
        storage,
    );

    // 3. Embed cedros-pay (auto-migrates its tables)
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let mut pay_cfg = cedros_pay::config::Config::default();
    pay_cfg.server.cors_disabled = true;
    pay_cfg.server.public_url = "https://api.yourapp.com".to_string();
    pay_cfg.paywall.postgres_url = Some(database_url.clone());
    pay_cfg.coupons.postgres_url = Some(database_url);
    pay_cfg.cedros_login.enabled = true;
    pay_cfg.cedros_login.base_url = format!("http://127.0.0.1:{}/auth", port);

    let store = Arc::new(cedros_pay::storage::PostgresStore::from_pool(
        pool.clone(),
        cedros_pay::config::SchemaMapping::default(),
    ));
    let pay_router = cedros_pay::router_with_pool(&pay_cfg, store, Some(pool)).await?;

    // 4. Mount everything
    let app = axum::Router::new()
        .merge(pay_router)              // cedros-pay applies its own /paywall/v1 prefix
        .nest("/auth", login_router)    // cedros-login under /auth
        .layer(tower_http::cors::CorsLayer::permissive()); // Single CORS layer

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    tracing::info!("Server listening on port {}", port);
    axum::serve(listener, app).await?;

    Ok(())
}
```

### Required environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | HMAC secret for cedros-login |
| `JWT_RSA_PRIVATE_KEY` | Recommended | RSA private key (PEM) for RS256 JWTs. Without this, an ephemeral key is generated and tokens are invalid after restart. |
| `JWT_ISSUER` | No | JWT `iss` claim (default: `"cedros-login"`) |
| `JWT_AUDIENCE` | No | JWT `aud` claim (default: `"cedros-app"`) |
| `PORT` | No | Server port (default: `3000`) |

### Optional: Background workers

cedros-pay has background workers for webhook delivery, subscription expiry, and cleanup. These are NOT spawned automatically in library mode:

```rust
let services = cedros_pay::build_services(&pay_cfg, store, Some(pool)).await?;
let workers = cedros_pay::spawn_workers(
    &pay_cfg,
    services.store.clone(),
    services.notifier.clone(),
)?;

// On shutdown:
workers.shutdown().await;
```

---

## Version Compatibility Matrix

| Issue | Fixed in | Symptom |
|-------|----------|---------|
| Migration collision (`ignore_missing`) | cedros-pay 1.1.8 | `migration X was previously applied but is missing` |
| Auto-migration in embedded path | cedros-pay 1.1.7 | `relation "products" does not exist` |
| `/admin/subscriptions/settings` wired | cedros-pay 1.1.6 | 404 on subscription settings |
| JWT error logging | cedros-pay 1.1.5 | Silent 401s with no diagnostic info |
| Route param syntax (axum 0.8) | cedros-pay 1.1.4 | 404 on dynamic routes |
| CORS disable option | cedros-pay 1.1.3 | Duplicate CORS headers |
