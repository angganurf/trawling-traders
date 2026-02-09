# Embedding cedros-login-server into an Axum Application

A practical guide for embedding `cedros-login-server` as a library into your existing Axum server. Covers pool sharing, config construction, route mounting, JWT extraction, and co-embedding with `cedros-pay`.

**Applies to**: cedros-login-server >= 0.0.14, Axum 0.8, SQLx 0.8

---

## Quick Start (5 minutes)

```toml
# Cargo.toml
[dependencies]
cedros-login-server = "0.0.14"
sqlx = { version = "0.8", features = ["postgres", "runtime-tokio", "migrate"] }
```

```rust
use std::sync::Arc;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let pool = sqlx::PgPool::connect(&std::env::var("DATABASE_URL")?).await?;

    // cedros-login auto-migrates when you pass it a pool
    let storage = cedros_login::Storage::postgres_with_pool(pool.clone()).await?;

    let config = cedros_login::Config {
        jwt: cedros_login::config::JwtConfig {
            secret: std::env::var("JWT_SECRET")?,
            ..Default::default()
        },
        cors: cedros_login::config::CorsConfig {
            disabled: true, // your host app manages CORS
            ..Default::default()
        },
        ..Default::default()
    };

    let router = cedros_login::router_with_storage(
        config,
        Arc::new(cedros_login::NoopCallback),
        storage,
    );

    let app = axum::Router::new()
        .nest("/auth", router)
        .layer(tower_http::cors::CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    axum::serve(listener, app).await?;
    Ok(())
}
```

That gives you `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/.well-known/jwks.json`, and all other cedros-login endpoints.

---

## Core Concepts

### Pool Sharing

cedros-login provides two Postgres constructors:

```rust
// Option A: cedros-login creates its own pool from a URL
let storage = Storage::postgres(&database_url, &config.database).await?;

// Option B: You pass an existing pool (recommended for embedding)
let storage = Storage::postgres_with_pool(pool.clone()).await?;
```

**Use Option B for embedding.** Both run migrations automatically via `sqlx::migrate!()` with `ignore_missing = true`, so cedros-login tolerates your app's migration entries in `_sqlx_migrations` (and vice versa).

Set `ignore_missing` on your own migrator too:

```rust
let mut migrator = sqlx::migrate!("./migrations");
migrator.ignore_missing = true; // tolerate cedros-login's entries
migrator.run(&pool).await?;
```

### Router Entrypoints

| Function | When to use |
|----------|------------|
| `router(config, callback)` | Standalone server (creates its own storage from `DATABASE_URL`) |
| `router_with_storage(config, callback, storage)` | Embedding (you provide the storage/pool) |

Both return an `axum::Router` you can `.nest()` or `.merge()` into your app.

### CORS

Disable cedros-login's internal CORS layer when embedding. Otherwise you get duplicate `Access-Control-*` headers:

```rust
config.cors = CorsConfig {
    disabled: true,
    allowed_origins: vec![],
};
```

Your host app should apply a single CORS layer at the top level.

---

## Config Reference

### Full Config struct

```rust
pub struct Config {
    pub server: ServerConfig,
    pub jwt: JwtConfig,
    pub email: EmailConfig,
    pub google: GoogleConfig,
    pub apple: AppleConfig,
    pub solana: SolanaConfig,
    pub webauthn: WebAuthnConfig,
    pub cors: CorsConfig,
    pub cookie: CookieConfig,
    pub webhook: WebhookConfig,
    pub rate_limit: RateLimitConfig,
    pub database: DatabaseConfig,
    pub notification: NotificationConfig,
    pub sso: SsoConfig,
    pub wallet: WalletConfig,
    pub privacy: PrivacyConfig,
}
```

All sub-structs implement `Default`. You only need to set what you're using.

### Fields that matter for embedding

#### ServerConfig

```rust
pub struct ServerConfig {
    pub host: String,                          // default: "0.0.0.0"
    pub port: u16,                             // default: 8080
    pub auth_base_path: String,                // default: "/auth"
    pub frontend_url: Option<String>,          // for email links
    pub bootstrap_admin_email: Option<String>, // auto-promotes this user to system admin
    pub trust_proxy: bool,                     // default: false
}
```

**`auth_base_path`**: Set to `""` when embedding with `.nest()` — your nest prefix replaces it. If left at `"/auth"`, routes double-prefix (e.g., `/auth/auth/login`).

**`bootstrap_admin_email`**: When a user with this email first accesses an admin endpoint and no system admins exist yet, they are auto-promoted to `is_system_admin = true`. The user must be registered and email-verified first. This is how you bootstrap admin access.

#### JwtConfig

```rust
pub struct JwtConfig {
    pub secret: String,                       // >= 32 chars, for HMAC operations
    pub rsa_private_key_pem: Option<String>,  // PKCS#1 PEM for RS256 signing
    pub issuer: String,                       // default: "cedros-login"
    pub audience: String,                     // default: "cedros-app"
    pub access_token_expiry: u64,             // default: 900 (15 min)
    pub refresh_token_expiry: u64,            // default: 604800 (7 days)
}
```

**`rsa_private_key_pem`**: If not set, an ephemeral 2048-bit RSA key is generated at startup. Tokens become invalid after restart. **Always set this in production.**

**`issuer` / `audience`**: Baked into every access token. Other services (like cedros-pay) must match these when validating.

#### CorsConfig

```rust
pub struct CorsConfig {
    pub allowed_origins: Vec<String>,
    pub disabled: bool,  // default: false — set to true when embedding
}
```

#### CookieConfig

```rust
pub struct CookieConfig {
    pub enabled: bool,                    // default: true
    pub domain: Option<String>,
    pub secure: bool,                     // default: false
    pub same_site: String,               // default: "lax"
    pub access_cookie_name: String,      // default: "cedros_access"
    pub refresh_cookie_name: String,     // default: "cedros_refresh"
    pub path_prefix: String,             // default: ""
}
```

Set `enabled: false` if your frontend uses `Authorization: Bearer` headers (typical for SPAs and mobile apps). Cookies are for same-origin server-rendered apps.

### Config construction patterns

**From environment** (reads `JWT_SECRET`, `DATABASE_URL`, etc.):
```rust
let config = Config::from_env()?;
```

**Manual construction** (recommended for embedding):
```rust
let config = Config {
    server: ServerConfig {
        auth_base_path: "".to_string(),
        bootstrap_admin_email: Some("admin@example.com".to_string()),
        ..Default::default()
    },
    jwt: JwtConfig {
        secret: std::env::var("JWT_SECRET")?,
        rsa_private_key_pem: std::env::var("JWT_RSA_PRIVATE_KEY").ok(),
        ..Default::default()
    },
    cors: CorsConfig { disabled: true, ..Default::default() },
    cookie: CookieConfig { enabled: false, ..Default::default() },
    google: GoogleConfig {
        client_id: std::env::var("GOOGLE_CLIENT_ID").ok(),
        client_secret: std::env::var("GOOGLE_CLIENT_SECRET").ok(),
        ..Default::default()
    },
    ..Default::default()
};
```

---

## JWT Contract

### Algorithm and keys

- **Signing algorithm**: RS256 (RSA + SHA-256)
- **Key size**: 2048-bit RSA
- **Key ID**: First 8 hex chars of SHA-256 of the modulus
- **JWKS endpoint**: `/.well-known/jwks.json` (relative to wherever you mount cedros-login)

### Access token claims

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "sid": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "org_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "role": "admin",
  "is_system_admin": true,
  "iat": 1770565102,
  "exp": 1770566002,
  "iss": "cedros-login",
  "aud": "cedros-app"
}
```

| Claim | Type | Required | Description |
|-------|------|----------|-------------|
| `sub` | UUID | Yes | User ID |
| `sid` | UUID | Yes | Session ID (for token revocation) |
| `org_id` | UUID | No | Active organization ID |
| `role` | String | No | User's role in active org (`"owner"`, `"admin"`, `"member"`) |
| `is_system_admin` | Boolean | No | `true` if user is a system-wide administrator |
| `iat` | Unix timestamp | Yes | Issued at |
| `exp` | Unix timestamp | Yes | Expiration (default: 15 minutes from `iat`) |
| `iss` | String | Yes | Issuer (default: `"cedros-login"`) |
| `aud` | String | Yes | Audience (default: `"cedros-app"`) |

### Refresh tokens

Refresh tokens are **opaque random strings** (44 alphanumeric chars, ~262 bits entropy). They are NOT JWTs. The server stores HMAC-SHA256 hashes and compares them on refresh.

### Validating tokens in your own middleware

Extract `JwtService` from the same config before passing it to cedros-login:

```rust
use cedros_login::services::JwtService;

// Build JwtService from the same config
let jwt_service = JwtService::try_new(&config.jwt)?;

// Later, in your auth middleware:
let claims = jwt_service.validate_access_token(&token)?;
// claims.sub = user ID (Uuid)
// claims.org_id = active org (Option<Uuid>)
// claims.is_system_admin = admin flag (Option<bool>)
```

`validate_access_token` checks:
1. RS256 signature against the private key's public component
2. `exp` not in the past
3. `iss` matches configured issuer
4. `aud` matches configured audience

Returns `AppError::TokenExpired` for expired tokens or `AppError::InvalidToken` for everything else.

### Validating tokens from an external service

If your service is separate (not in the same process), fetch the JWKS and validate with any RS256-capable JWT library:

```
GET http://your-host/auth/.well-known/jwks.json

{
  "keys": [{
    "kty": "RSA",
    "alg": "RS256",
    "kid": "a1b2c3d4",
    "use": "sig",
    "n": "<base64url-encoded modulus>",
    "e": "AQAB"
  }]
}
```

**Important**: Match `iss` against your configured `jwt.issuer` and `aud` against `jwt.audience`. If you changed these from defaults, every consumer must know.

---

## Extracting JwtService for Your App

This is the most important pattern for embedding. You need `JwtService` in your own `AppState` to validate tokens on your own routes:

```rust
pub struct LoginIntegration {
    pub router: axum::Router,
    pub jwt_service: JwtService,
}

pub async fn embed_login(pool: sqlx::PgPool) -> anyhow::Result<LoginIntegration> {
    let config = cedros_login::Config {
        server: cedros_login::config::ServerConfig {
            auth_base_path: "".to_string(),
            ..Default::default()
        },
        jwt: cedros_login::config::JwtConfig {
            secret: std::env::var("JWT_SECRET")?,
            rsa_private_key_pem: std::env::var("JWT_RSA_PRIVATE_KEY").ok(),
            ..Default::default()
        },
        cors: cedros_login::config::CorsConfig {
            disabled: true,
            ..Default::default()
        },
        ..Default::default()
    };

    // Extract JwtService BEFORE passing config to router
    let jwt_service = JwtService::try_new(&config.jwt)?;

    let storage = cedros_login::Storage::postgres_with_pool(pool).await?;
    let router = cedros_login::router_with_storage(
        config,
        Arc::new(cedros_login::NoopCallback),
        storage,
    );

    Ok(LoginIntegration { router, jwt_service })
}
```

Then in your app state:

```rust
pub struct AppState {
    pub db: PgPool,
    pub jwt_service: JwtService,
}

// Auth middleware for your own routes
async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut req: axum::http::Request<axum::body::Body>,
    next: axum::middleware::Next,
) -> Result<axum::response::Response, StatusCode> {
    let token = req.headers()
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = state.jwt_service
        .validate_access_token(token)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(claims);
    Ok(next.run(req).await)
}
```

---

## AuthCallback (lifecycle hooks)

cedros-login calls your callback on auth events. Implement `AuthCallback` to sync user data, trigger webhooks, or enrich token responses:

```rust
use cedros_login::{AuthCallback, AuthCallbackPayload, AppError};
use async_trait::async_trait;
use serde_json::Value;

pub struct MyCallback { /* your deps */ }

#[async_trait]
impl AuthCallback for MyCallback {
    /// Called after successful login. Return value is included in the auth response as `callback_data`.
    async fn on_authenticated(&self, payload: &AuthCallbackPayload) -> Result<Value, AppError> {
        // payload.user.id, payload.method, payload.is_new_user, payload.session_id
        Ok(serde_json::json!({}))
    }

    /// Called after successful registration.
    async fn on_registered(&self, payload: &AuthCallbackPayload) -> Result<Value, AppError> {
        // Create your app's user profile, send welcome email, etc.
        Ok(serde_json::json!({}))
    }

    /// Called on logout.
    async fn on_logout(&self, user_id: &str) -> Result<(), AppError> {
        Ok(())
    }
}
```

Use `NoopCallback` if you don't need lifecycle hooks.

---

## Error Responses

All errors follow this JSON structure:

```json
{
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid credentials",
  "details": null
}
```

### Error codes and HTTP status mapping

| Code | HTTP Status | When |
|------|-------------|------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password (deliberately generic to prevent user enumeration) |
| `INVALID_TOKEN` | 401 | Token malformed, signature invalid, session revoked, or session not found |
| `TOKEN_EXPIRED` | 401 | Token signature valid but `exp` is in the past — client should refresh |
| `INVALID_SIGNATURE` | 401 | Solana wallet signature verification failed |
| `UNAUTHORIZED` | 401 | Generic unauthorized (custom message in `message` field) |
| `FORBIDDEN` | 403 | Authenticated but insufficient permissions |
| `STEP_UP_REQUIRED` | 403 | Sensitive operation requires re-authentication |
| `EMAIL_EXISTS` | 409 | Registration with an already-taken email |
| `WALLET_EXISTS` | 409 | Wallet address already linked to another account |
| `VALIDATION_ERROR` | 400 | Bad input (check `message` for details) |
| `CHALLENGE_EXPIRED` | 400 | WebAuthn or nonce challenge timed out |
| `ACCOUNT_LOCKED` | 429 | Too many failed login attempts (message includes retry time) |
| `RATE_LIMITED` | 429 | General rate limit exceeded |
| `NOT_FOUND` | 404 | Resource not found |
| `SERVER_ERROR` | 500 | Internal error (details logged server-side, never exposed to client) |
| `SERVICE_UNAVAILABLE` | 503 | Dependency unavailable |

### Distinguishing `INVALID_TOKEN` vs `TOKEN_EXPIRED`

This matters for client-side token refresh logic:

- **`TOKEN_EXPIRED`**: The token was validly signed but has expired. Call `/auth/refresh` with the refresh token to get a new access token.
- **`INVALID_TOKEN`**: The token is corrupt, has an invalid signature, or the session was revoked. Do NOT attempt refresh — redirect to login.

### Deliberately generic errors

Login returns `INVALID_CREDENTIALS` for all of these cases (to prevent user enumeration):
- Email not found
- Password wrong
- No password set (OAuth-only account)
- Email not yet verified

The server performs dummy password hashing even when the email doesn't exist, preventing timing-based enumeration.

### Interpreting 500 errors

`SERVER_ERROR` responses always return `"Internal server error"` — the actual cause is logged server-side at `debug` level. Set `RUST_LOG=cedros_login=debug` to see full error details including database errors, config issues, and stack traces. Never expose these to clients.

---

## Co-Embedding with cedros-pay

### Architecture

```
┌──────────────────────────────────────────────────┐
│  Your Axum Server                                │
│                                                  │
│  ┌────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Your Routes│  │ cedros-login│  │ cedros-pay│  │
│  │ /v1/...    │  │ /auth/...   │  │ /paywall/ │  │
│  └─────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
│        └────────────┬───┴────────────────┘       │
│                     │                            │
│             ┌───────▼────────┐                   │
│             │ Shared PgPool  │                   │
│             └────────────────┘                   │
└──────────────────────────────────────────────────┘
```

All three share one `PgPool` and one `_sqlx_migrations` table. Each migrator uses `ignore_missing = true`.

### cedros-pay JWT validation

cedros-pay validates admin JWTs by fetching the JWKS from your embedded cedros-login instance:

```
cedros-pay admin_middleware
  → Extracts Bearer token from Authorization header
  → Fetches JWKS from {cedros_login.base_url}/.well-known/jwks.json
  → Validates RS256 signature
  → Checks: exp not expired, iss matches (if configured), aud matches (if configured)
  → Checks: is_system_admin == true (returns 403 if false, 401 if missing)
```

**Critical**: `cedros_login.base_url` must be reachable from the server process itself. Use `http://127.0.0.1:{port}/auth`, not your public domain.

### cedros-pay config for JWT matching

```rust
cfg.cedros_login.enabled = true;
cfg.cedros_login.base_url = format!("http://127.0.0.1:{}/auth", port);

// If you changed issuer/audience from defaults, tell cedros-pay:
cfg.cedros_login.jwt_issuer = Some("cedros-login".to_string());
cfg.cedros_login.jwt_audience = Some("cedros-app".to_string());
```

If `jwt_issuer` / `jwt_audience` are not set on cedros-pay, it skips those checks (only validates signature + expiry + `is_system_admin`).

### Full reference integration

```rust
use std::sync::Arc;
use cedros_login::services::JwtService;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter("info,cedros_login=debug,cedros_pay=debug")
        .init();

    let database_url = std::env::var("DATABASE_URL")?;
    let port: u16 = std::env::var("PORT").unwrap_or("3000".into()).parse()?;
    let pool = sqlx::PgPool::connect(&database_url).await?;

    // 1. Run YOUR migrations first
    let mut migrator = sqlx::migrate!("./migrations");
    migrator.ignore_missing = true;
    migrator.run(&pool).await?;

    // 2. Embed cedros-login
    let login_config = cedros_login::Config {
        server: cedros_login::config::ServerConfig {
            auth_base_path: "".to_string(),
            bootstrap_admin_email: Some("admin@example.com".to_string()),
            ..Default::default()
        },
        jwt: cedros_login::config::JwtConfig {
            secret: std::env::var("JWT_SECRET")?,
            rsa_private_key_pem: std::env::var("JWT_RSA_PRIVATE_KEY").ok(),
            ..Default::default()
        },
        cors: cedros_login::config::CorsConfig {
            disabled: true,
            ..Default::default()
        },
        cookie: cedros_login::config::CookieConfig {
            enabled: false,
            ..Default::default()
        },
        ..Default::default()
    };

    let jwt_service = JwtService::try_new(&login_config.jwt)?;
    let login_storage = cedros_login::Storage::postgres_with_pool(pool.clone()).await?;
    let login_router = cedros_login::router_with_storage(
        login_config,
        Arc::new(cedros_login::NoopCallback),
        login_storage,
    );

    // 3. Embed cedros-pay
    let mut pay_cfg = cedros_pay::config::Config::default();
    pay_cfg.server.cors_disabled = true;
    pay_cfg.server.route_prefix = "".to_string();
    pay_cfg.server.public_url = "https://api.yourapp.com".to_string();
    pay_cfg.paywall.postgres_url = Some(database_url.clone());
    pay_cfg.coupons.postgres_url = Some(database_url);
    pay_cfg.cedros_login.enabled = true;
    pay_cfg.cedros_login.base_url = format!("http://127.0.0.1:{}/auth", port);

    let cedros_pool = cedros_pay::storage::PostgresPool::from_pool(pool.clone());
    let store = Arc::new(cedros_pay::storage::PostgresStore::new(
        cedros_pool,
        cedros_pay::config::SchemaMapping::default(),
    ));
    let pay_router = cedros_pay::router_with_pool(&pay_cfg, store, Some(pool)).await?;

    // 4. Mount everything
    let app = axum::Router::new()
        .nest("/auth", login_router)       // cedros-login
        .merge(pay_router)                 // cedros-pay (applies its own prefix)
        .layer(tower_http::cors::CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    tracing::info!("listening on port {}", port);
    axum::serve(listener, app).await?;
    Ok(())
}
```

### Route layout

| Path | Package | Auth |
|------|---------|------|
| `/auth/login` | cedros-login | Public |
| `/auth/register` | cedros-login | Public |
| `/auth/refresh` | cedros-login | Refresh token |
| `/auth/me` | cedros-login | Bearer JWT |
| `/auth/.well-known/jwks.json` | cedros-login | Public |
| `/auth/health` | cedros-login | Public |
| `/paywall/v1/products` | cedros-pay | API key |
| `/paywall/v1/quote` | cedros-pay | API key |
| `/admin/stats` | cedros-pay | Bearer JWT (`is_system_admin`) or Ed25519 |
| `/admin/products` | cedros-pay | Bearer JWT (`is_system_admin`) or Ed25519 |
| `/admin/config/*` | cedros-pay | Bearer JWT (`is_system_admin`) or Ed25519 |

### How to make a user admin

Set `bootstrap_admin_email` in cedros-login config. When a user with that email first accesses an admin endpoint (and no system admins exist yet), they are auto-promoted to `is_system_admin = true`. The user must be registered and email-verified first. All subsequent JWTs for that user include the claim, granting access to cedros-pay admin endpoints.

Alternatively, update the user record directly:
```sql
UPDATE users SET is_system_admin = true WHERE email = 'admin@example.com';
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | >= 32 char secret for HMAC operations |
| `JWT_RSA_PRIVATE_KEY` | Recommended | ephemeral | PKCS#1 PEM private key for RS256 signing. Without this, tokens are invalid after restart. |
| `JWT_ISSUER` | No | `"cedros-login"` | JWT `iss` claim |
| `JWT_AUDIENCE` | No | `"cedros-app"` | JWT `aud` claim |
| `GOOGLE_CLIENT_ID` | For Google auth | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For Google auth | — | Google OAuth client secret |
| `RUST_LOG` | No | — | Set `cedros_login=debug` for detailed error logging |

---

## Troubleshooting

### Migration collision

**Symptom**: `migration X was previously applied but is missing in the resolved migrations`

**Fix**: All migrators sharing a database must set `ignore_missing = true`. cedros-login >= 0.0.14 does this. Ensure your app's migrator does too.

### CORS preflight failures

**Symptom**: 403 on OPTIONS requests or duplicate `Access-Control-*` headers.

**Fix**: Set `cors.disabled = true` in cedros-login config. Apply one CORS layer in your host app.

### "Internal server error" with no details

**Fix**: Set `RUST_LOG=cedros_login=debug`. Internal errors are logged at debug level with full details but never exposed to clients.

### cedros-pay admin endpoints return 401

**Check in order**:
1. Is `Authorization: Bearer <token>` reaching the server? (Check browser DevTools network tab)
2. Is `cedros_login.base_url` reachable from the server? (`curl http://127.0.0.1:3000/auth/.well-known/jwks.json`)
3. Do `jwt_issuer`/`jwt_audience` on cedros-pay match cedros-login's config?
4. Is the user `is_system_admin`? (`SELECT is_system_admin FROM users WHERE email = '...'`)

### Token expired vs invalid

If your frontend gets `TOKEN_EXPIRED` — call `/auth/refresh`. If it gets `INVALID_TOKEN` — redirect to login. Don't retry refresh on `INVALID_TOKEN`; the session may have been revoked.

---

## Version Compatibility

| Feature | Minimum version |
|---------|----------------|
| Idempotent migrations (safe re-run) | cedros-login-server 0.0.14 |
| `ignore_missing` on migrator | cedros-login-server 0.0.13 |
| Auto-provision default org | cedros-login-server 0.0.12 |
| `Storage::postgres_with_pool()` | cedros-login-server 0.0.4 |
| `CorsConfig { disabled: true }` | cedros-login-server 0.0.3 |
