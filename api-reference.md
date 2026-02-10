# Trawling Traders API Reference

**Base URL:** `https://api.trawlingtraders.com`

Most routes use the `/v1/` prefix. Cedros Pay routes are merged at root with their own internal prefixes (`/paywall/v1/` for storefront, `/admin/` for admin). Authentication uses RS256 JWT tokens issued by the embedded cedros-login server.

---

## Authentication (Cedros Login)

Prefix: `/v1/auth`

### Core Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/register` | No | Register with email/password |
| POST | `/v1/auth/login` | No | Email/password login |
| POST | `/v1/auth/login/mfa` | No | Complete MFA challenge |
| POST | `/v1/auth/refresh` | No | Refresh access token |
| POST | `/v1/auth/logout` | Bearer | Logout current session |
| POST | `/v1/auth/logout-all` | Bearer | Logout all sessions |
| POST | `/v1/auth/forgot-password` | No | Request password reset email |
| POST | `/v1/auth/reset-password` | No | Reset password with token |
| POST | `/v1/auth/change-password` | Bearer | Change password (authenticated) |

### OAuth & Web3

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/google` | No | Google OAuth sign-in |
| POST | `/v1/auth/apple` | No | Apple sign-in |
| POST | `/v1/auth/solana/challenge` | No | Request Solana sign-in challenge |
| POST | `/v1/auth/solana` | No | Complete Solana wallet sign-in |

### WebAuthn (Passkeys)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/webauthn/register/options` | Bearer | Get registration options |
| POST | `/v1/auth/webauthn/register/verify` | Bearer | Verify registration |
| POST | `/v1/auth/webauthn/auth/options` | No | Get authentication options |
| POST | `/v1/auth/webauthn/auth/verify` | No | Verify authentication |

### Instant Links

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/instant-link` | No | Send magic login link |
| POST | `/v1/auth/instant-link/verify` | No | Verify magic link token |

### User Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/auth/user` | Bearer | Get current user profile |
| PATCH | `/v1/auth/me` | Bearer | Update profile |
| POST | `/v1/auth/send-verification` | Bearer | Send email verification |
| POST | `/v1/auth/verify-email` | No | Verify email with token |

### Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/auth/sessions` | Bearer | List active sessions |
| DELETE | `/v1/auth/sessions` | Bearer | Revoke sessions |

### MFA Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/mfa/setup` | Bearer | Begin TOTP setup |
| POST | `/v1/auth/mfa/enable` | Bearer | Enable MFA with verification code |
| POST | `/v1/auth/mfa/disable` | Bearer | Disable MFA |
| GET | `/v1/auth/mfa/status` | Bearer | Get MFA status |
| POST | `/v1/auth/mfa/verify` | No | Verify MFA code during login |
| POST | `/v1/auth/mfa/recovery` | No | Use recovery code |
| POST | `/v1/auth/mfa/recovery-codes/regenerate` | Bearer | Regenerate recovery codes |

### API Keys

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/auth/user/api-key` | Bearer | Get current API key |
| POST | `/v1/auth/user/api-key/regenerate` | Bearer | Regenerate API key |
| POST | `/v1/auth/api-key/validate` | No | Validate an API key |

### Credentials

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/auth/credentials` | Bearer | List auth credentials |
| PATCH | `/v1/auth/credentials/{credential_id}` | Bearer | Update credential |
| DELETE | `/v1/auth/credentials/{credential_id}` | Bearer | Remove credential |

### Organizations

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/auth/orgs` | Bearer | List user's organizations |
| POST | `/v1/auth/orgs` | Bearer | Create organization |
| GET | `/v1/auth/orgs/{org_id}` | Bearer | Get organization details |
| PATCH | `/v1/auth/orgs/{org_id}` | Bearer | Update organization |
| DELETE | `/v1/auth/orgs/{org_id}` | Bearer | Delete organization |
| POST | `/v1/auth/orgs/{org_id}/switch` | Bearer | Switch active organization |

### Organization Members

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/auth/orgs/{org_id}/members` | Bearer | List members |
| PATCH | `/v1/auth/orgs/{org_id}/members/{user_id}` | Bearer | Update member role |
| DELETE | `/v1/auth/orgs/{org_id}/members/{user_id}` | Bearer | Remove member |

### Organization Invites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/auth/orgs/{org_id}/invites` | Bearer | List pending invites |
| POST | `/v1/auth/orgs/{org_id}/invites` | Bearer | Send invite |
| DELETE | `/v1/auth/orgs/{org_id}/invites/{invite_id}` | Bearer | Cancel invite |
| POST | `/v1/auth/orgs/{org_id}/invites/{invite_id}/resend` | Bearer | Resend invite |
| POST | `/v1/auth/invites/accept` | Bearer | Accept invite |

### Wallet Management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/wallet/enroll` | Bearer | Enroll custodial wallet |
| GET | `/v1/auth/wallet/material` | Bearer | Get wallet key material |
| GET | `/v1/auth/wallet/status` | Bearer | Get wallet status |
| POST | `/v1/auth/wallet/lock` | Bearer | Lock wallet |
| POST | `/v1/auth/wallet/unlock` | Bearer | Unlock wallet |
| POST | `/v1/auth/wallet/sign` | Bearer | Sign transaction |
| POST | `/v1/auth/wallet/recover` | Bearer | Start wallet recovery |
| POST | `/v1/auth/wallet/rotate-user-secret` | Bearer | Rotate encryption secret |

### Authorization

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/authorize` | Bearer | Check authorization |
| POST | `/v1/auth/permissions` | Bearer | List effective permissions |

### Discovery & Metadata

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/auth/health` | No | Health check |
| GET | `/v1/auth/discovery` | No | Auth provider discovery |
| GET | `/v1/auth/.well-known/jwks.json` | No | JWKS public keys |
| GET | `/v1/auth/openapi.json` | No | OpenAPI spec |

### Auth Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/auth/admin/users` | Admin | List all users |
| GET | `/v1/auth/admin/users/stats` | Admin | User statistics |
| GET | `/v1/auth/admin/users/{user_id}` | Admin | Get user details |
| PATCH | `/v1/auth/admin/users/{user_id}` | Admin | Update user |
| DELETE | `/v1/auth/admin/users/{user_id}` | Admin | Delete user |
| PATCH | `/v1/auth/admin/users/{user_id}/system-admin` | Admin | Toggle system admin |
| GET | `/v1/auth/admin/audit` | Admin | System audit log |
| GET | `/v1/auth/admin/deposits` | Admin | List deposits |
| GET | `/v1/auth/admin/deposits/in-privacy-period` | Admin | Deposits in privacy period |
| GET | `/v1/auth/admin/withdrawals/pending` | Admin | Pending withdrawals |
| GET | `/v1/auth/admin/settings` | Admin | Get system settings |
| PATCH | `/v1/auth/admin/settings` | Admin | Update system settings |

---

## Payments & Subscriptions (Cedros Pay)

Cedros Pay is merged at the API root with no `route_prefix`. Routes use these internal prefixes:

| Prefix | Routes |
|--------|--------|
| `/paywall/v1` | Paywall, products, collections, FAQs, chat |
| `/paywall/v1/subscription` | Subscription routes |
| `/stripe` | Stripe redirects (success, cancel) |
| `/webhook` | Stripe webhook |
| `/admin` | All admin routes (config, dashboard, webhooks, AI, chat) |
| _(none)_ | Health, discovery, metrics |

### Paywall

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/paywall/v1/quote` | No | Get payment quote |
| GET | `/paywall/v1/quote` | No | Get payment quote (GET) |
| POST | `/paywall/v1/verify` | No | Verify payment |
| POST | `/paywall/v1/gasless-transaction` | No | Submit gasless transaction |
| GET | `/paywall/v1/derive-token-account` | No | Derive Solana token account |
| GET | `/paywall/v1/blockhash` | No | Get current blockhash |
| POST | `/paywall/v1/stripe-session` | No | Create one-time Stripe session |
| POST | `/paywall/v1/stripe-session/verify` | No | Verify Stripe session |
| POST | `/paywall/v1/x402-transaction/verify` | No | Verify X402 transaction |
| POST | `/paywall/v1/credits/authorize` | Bearer | Authorize credits payment |
| POST | `/paywall/v1/credits/hold` | Bearer | Create credits hold |
| GET | `/paywall/v1/purchases` | Bearer | List purchases |
| POST | `/paywall/v1/nonce` | No | Generate payment nonce |
| GET | `/paywall/v1/shop` | No | Shop configuration |

### Cart

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/paywall/v1/cart/quote` | No | Get cart quote |
| POST | `/paywall/v1/cart/checkout` | No | Cart checkout |
| GET | `/paywall/v1/cart/{cartId}` | No | Get cart |
| POST | `/paywall/v1/cart/{cartId}/verify` | No | Verify cart payment |
| GET | `/paywall/v1/cart/{cartId}/inventory-status` | No | Check cart inventory |
| POST | `/paywall/v1/cart/{cartId}/credits/authorize` | Bearer | Authorize credits for cart |
| POST | `/paywall/v1/cart/{cartId}/credits/hold` | Bearer | Create credits hold for cart |

### Refunds (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/paywall/v1/refunds/request` | Bearer | Request refund |
| POST | `/paywall/v1/refunds/approve` | Bearer | Approve refund |
| POST | `/paywall/v1/refunds/deny` | Bearer | Deny refund |
| POST | `/paywall/v1/refunds/pending` | Bearer | List pending refunds |
| GET | `/paywall/v1/refunds/{refundId}` | Bearer | Get refund details |

### Products (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/paywall/v1/products` | No | List products |
| GET | `/paywall/v1/products/{id}` | No | Get product |
| GET | `/paywall/v1/products/by-slug/{slug}` | No | Get product by slug |
| GET | `/paywall/v1/products.txt` | No | Products as plain text |
| POST | `/paywall/v1/coupons/validate` | No | Validate coupon code |

### Collections (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/paywall/v1/collections` | No | List collections |
| GET | `/paywall/v1/collections/{id}` | No | Get collection |

### FAQs (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/paywall/v1/faqs` | No | List public FAQs |

### Subscriptions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/paywall/v1/subscription/status?user_id=<id>&resource=<productId>` | Bearer | Get subscription status (both params required) |
| POST | `/paywall/v1/subscription/quote` | Bearer | Get subscription quote |
| POST | `/paywall/v1/subscription/stripe-session` | Bearer | Create Stripe checkout session |
| POST | `/paywall/v1/subscription/x402/activate` | Bearer | Activate via X402 payment |
| POST | `/paywall/v1/subscription/credits/activate` | Bearer | Activate via credits |
| POST | `/paywall/v1/subscription/cancel` | Bearer | Cancel subscription |
| POST | `/paywall/v1/subscription/portal` | Bearer | Get Stripe billing portal URL |
| POST | `/paywall/v1/subscription/change` | Bearer | Change subscription plan |
| POST | `/paywall/v1/subscription/reactivate` | Bearer | Reactivate cancelled subscription |

### Stripe Callbacks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stripe/success` | No | Stripe success redirect |
| GET | `/stripe/cancel` | No | Stripe cancel redirect |
| POST | `/webhook/stripe` | Stripe Sig | Stripe webhook receiver |
| GET | `/webhook/stripe` | No | Stripe webhook info |

### Discovery

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/.well-known/payment-options` | No | Payment options discovery |
| GET | `/.well-known/ai-discovery.json` | No | AI discovery manifest |
| GET | `/.well-known/ai-plugin.json` | No | AI plugin manifest |
| GET | `/.well-known/agent.json` | No | Agent manifest |
| GET | `/.well-known/mcp` | No | MCP discovery |
| GET | `/.well-known/skills.zip` | No | Skills archive |
| GET | `/resources/list` | No | Resource list |
| GET | `/openapi.json` | No | OpenAPI spec |
| GET | `/ai.txt` | No | AI instructions |
| GET | `/llms.txt` | No | LLM instructions |
| GET | `/llms-full.txt` | No | Full LLM instructions |
| GET | `/llms-admin.txt` | No | Admin LLM instructions |
| GET | `/skill.md` | No | Skill description (markdown) |
| GET | `/skill.json` | No | Skill description (JSON) |
| GET | `/skills/{skill_id}` | No | Get specific skill |
| GET | `/agent.md` | No | Agent description |
| GET | `/heartbeat.md` | No | Heartbeat (markdown) |
| GET | `/heartbeat.json` | No | Heartbeat (JSON) |

### Health / Metrics

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/cedros-health` | No | Pay service health |
| GET | `/metrics` | No | Prometheus metrics |

### Pay Admin - Config (Ed25519/JWT auth)

All admin routes are under `/admin/`. Auth uses Ed25519 signature (primary) or JWT with `is_system_admin` claim (fallback).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/config` | Admin | List config categories |
| POST | `/admin/config/batch` | Admin | Batch config update |
| POST | `/admin/config/validate` | Admin | Validate config |
| GET | `/admin/config/history` | Admin | Config change history |
| GET | `/admin/config/{category}` | Admin | Get config by category |
| PUT | `/admin/config/{category}` | Admin | Update config category |
| PATCH | `/admin/config/{category}` | Admin | Partial update config |

### Pay Admin - AI Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/config/ai` | Admin | Get AI config |
| PUT | `/admin/config/ai/api-key` | Admin | Set AI API key |
| DELETE | `/admin/config/ai/api-key/{provider}` | Admin | Remove AI API key |
| PUT | `/admin/config/ai/assignment` | Admin | Set AI task assignment |
| PUT | `/admin/config/ai/prompt` | Admin | Set AI prompt |

### Pay Admin - AI Assistant

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/ai/product-assistant` | Admin | AI product assistant |
| POST | `/admin/ai/related-products` | Admin | AI related products |
| POST | `/admin/ai/product-search` | Admin | AI product search |

### Pay Admin - Chat

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/chat` | Admin | Send chat message |
| GET | `/admin/chats` | Admin | List chat sessions |
| GET | `/admin/chats/{session_id}` | Admin | Get chat session |
| GET | `/admin/users/{user_id}/chats` | Admin | Get user's chats |

### Pay Admin - Webhooks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/webhooks` | Admin | List webhooks |
| GET | `/admin/webhooks/{id}` | Admin | Get webhook |
| POST | `/admin/webhooks/{id}/retry` | Admin | Retry webhook |
| DELETE | `/admin/webhooks/{id}` | Admin | Delete webhook |
| GET | `/admin/webhooks/dlq` | Admin | Dead letter queue |
| POST | `/admin/webhooks/dlq/{id}/retry` | Admin | Retry DLQ item |
| DELETE | `/admin/webhooks/dlq/{id}` | Admin | Delete DLQ item |

### Pay Admin - Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/stats` | Admin | Dashboard statistics |
| GET | `/admin/transactions` | Admin | List transactions |
| GET | `/admin/customers` | Admin | List customers |
| GET | `/admin/customers/{id}` | Admin | Get customer |
| POST | `/admin/customers` | Admin | Create customer |
| PUT | `/admin/customers/{id}` | Admin | Update customer |
| GET | `/admin/orders` | Admin | List orders |
| GET | `/admin/orders/{id}` | Admin | Get order details |
| POST | `/admin/orders/{id}/status` | Admin | Update order status |
| POST | `/admin/orders/{id}/fulfillments` | Admin | Create fulfillment |
| POST | `/admin/fulfillments/{id}/status` | Admin | Update fulfillment status |
| GET | `/admin/returns` | Admin | List returns |
| GET | `/admin/returns/{id}` | Admin | Get return |
| POST | `/admin/returns` | Admin | Create return |
| POST | `/admin/returns/{id}/status` | Admin | Update return status |
| GET | `/admin/disputes` | Admin | List disputes |
| POST | `/admin/disputes` | Admin | Create dispute |
| GET | `/admin/disputes/{id}` | Admin | Get dispute |
| POST | `/admin/disputes/{id}/status` | Admin | Update dispute status |
| GET | `/admin/products` | Admin | List products |
| GET | `/admin/products/{id}` | Admin | Get product |
| POST | `/admin/products` | Admin | Create product |
| PUT | `/admin/products/{id}` | Admin | Update product |
| DELETE | `/admin/products/{id}` | Admin | Delete product |
| GET | `/admin/products/{id}/inventory` | Admin | Get product inventory |
| POST | `/admin/products/{id}/inventory/adjust` | Admin | Adjust inventory |
| GET | `/admin/products/{id}/inventory/adjustments` | Admin | Inventory adjustment history |
| GET | `/admin/products/{id}/variations` | Admin | List variations |
| POST | `/admin/products/{id}/variations` | Admin | Create variation |
| POST | `/admin/products/{id}/variants/inventory` | Admin | Update variant inventory |
| GET | `/admin/collections` | Admin | List collections |
| POST | `/admin/collections` | Admin | Create collection |
| GET | `/admin/collections/{id}` | Admin | Get collection |
| PUT | `/admin/collections/{id}` | Admin | Update collection |
| DELETE | `/admin/collections/{id}` | Admin | Delete collection |
| GET | `/admin/coupons` | Admin | List coupons |
| POST | `/admin/coupons` | Admin | Create coupon |
| PUT | `/admin/coupons/{id}` | Admin | Update coupon |
| DELETE | `/admin/coupons/{id}` | Admin | Delete coupon |
| GET | `/admin/faqs` | Admin | List FAQs |
| POST | `/admin/faqs` | Admin | Create FAQ |
| GET | `/admin/faqs/{id}` | Admin | Get FAQ |
| PUT | `/admin/faqs/{id}` | Admin | Update FAQ |
| DELETE | `/admin/faqs/{id}` | Admin | Delete FAQ |
| GET | `/admin/gift-cards` | Admin | List gift cards |
| POST | `/admin/gift-cards` | Admin | Create gift card |
| GET | `/admin/gift-cards/{code}` | Admin | Get gift card |
| PUT | `/admin/gift-cards/{code}` | Admin | Update gift card |
| POST | `/admin/gift-cards/{code}/adjust` | Admin | Adjust gift card balance |
| GET | `/admin/shipping/profiles` | Admin | List shipping profiles |
| POST | `/admin/shipping/profiles` | Admin | Create shipping profile |
| GET | `/admin/shipping/profiles/{id}` | Admin | Get shipping profile |
| PUT | `/admin/shipping/profiles/{id}` | Admin | Update shipping profile |
| DELETE | `/admin/shipping/profiles/{id}` | Admin | Delete shipping profile |
| GET | `/admin/shipping/profiles/{id}/rates` | Admin | List shipping rates |
| POST | `/admin/shipping/profiles/{id}/rates` | Admin | Create shipping rate |
| PUT | `/admin/shipping/rates/{id}` | Admin | Update shipping rate |
| DELETE | `/admin/shipping/rates/{id}` | Admin | Delete shipping rate |
| GET | `/admin/taxes` | Admin | List tax rules |
| POST | `/admin/taxes` | Admin | Create tax rule |
| GET | `/admin/taxes/{id}` | Admin | Get tax rule |
| PUT | `/admin/taxes/{id}` | Admin | Update tax rule |
| DELETE | `/admin/taxes/{id}` | Admin | Delete tax rule |
| GET | `/admin/stripe/refunds` | Admin | List Stripe refunds |
| POST | `/admin/stripe/refunds/{id}/process` | Admin | Process Stripe refund |
| GET | `/admin/refunds` | Admin | List refunds |
| POST | `/admin/refunds/{id}/process` | Admin | Process refund |

---

## Trawling Traders (Custom Routes)

### User

Prefix: `/v1` | Requires: Bearer token

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/me` | Bearer | Get current user (id, email, timestamps) |

### Bots

Prefix: `/v1` | Requires: Bearer token + active subscription

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/bots` | Bearer | List all bots for authenticated user |
| POST | `/v1/bots` | Bearer | Create a new bot (max 4, requires subscription) |
| GET | `/v1/bots/{id}` | Bearer | Get bot details with current config |
| PATCH | `/v1/bots/{id}/config` | Bearer | Update bot configuration |
| POST | `/v1/bots/{id}/actions` | Bearer | Perform action: `pause`, `resume`, `redeploy`, `destroy` |
| GET | `/v1/bots/{id}/metrics` | Bearer | Get bot metrics (last 7 days, max 1000) |
| GET | `/v1/bots/{id}/events` | Bearer | Get bot event log (last 100 events) |

#### POST `/v1/bots` - Create Bot

```json
{
  "name": "My Trading Bot",
  "persona": "beginner|tweaker|quant_lite",
  "algorithm_mode": "trend|mean_reversion|breakout",
  "asset_focus": "majors|tokenized_equities|tokenized_metals|memes|custom",
  "strictness": "low|medium|high",
  "trading_mode": "paper|live",
  "risk_caps": {
    "max_position_size_percent": 5,
    "max_daily_loss_usd": 100,
    "max_drawdown_percent": 10,
    "max_trades_per_day": 10
  },
  "llm_provider": "openai",
  "llm_model": "gpt-4o",
  "llm_api_key": "sk-...",
  "custom_assets": ["SOL", "BTC"],
  "telegram_enabled": false,
  "telegram_bot_token": null
}
```

#### POST `/v1/bots/{id}/actions`

```json
{ "action": "pause|resume|redeploy|destroy" }
```

### OpenClaw Configuration

Prefix: `/v1` | Requires: Bearer token + active subscription

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/bots/{id}/openclaw-config` | Bearer | Get OpenClaw config (secrets masked) |
| POST | `/v1/bots/{id}/openclaw-config` | Bearer | Create/update OpenClaw config |

#### POST `/v1/bots/{id}/openclaw-config`

```json
{
  "llm_provider": "openai",
  "llm_model": "gpt-4o",
  "llm_api_key": "sk-...",
  "telegram_enabled": true,
  "telegram_bot_token": "123456:ABC..."
}
```

### Signal Simulation

Prefix: `/v1` | Requires: Bearer token + active subscription

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/simulate-signal` | Bearer | Dry-run signal generation from candle data |

### Bot Sync (Internal)

Prefix: `/v1/bot` | No auth (called by bot VPS instances)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/bot/{id}/register` | None | Bot registers on first boot |
| GET | `/v1/bot/{id}/config` | None | Bot polls for latest config |
| POST | `/v1/bot/{id}/config_ack` | None | Bot confirms config applied |
| POST | `/v1/bot/{id}/wallet` | None | Bot reports Solana wallet address |
| POST | `/v1/bot/{id}/heartbeat` | None | Status ping with optional metrics |
| POST | `/v1/bot/{id}/events` | None | Push event batch |
| POST | `/v1/bot/{id}/secrets` | Bootstrap | One-time secrets retrieval (bootstrap token) |

### Platform Admin

Prefix: `/v1/admin` | Requires: Bearer token + `is_system_admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/admin/config` | Admin | List all platform config entries |
| GET | `/v1/admin/config/{key}` | Admin | Get single config value |
| PATCH | `/v1/admin/config` | Admin | Update config entries |
| GET | `/v1/admin/config/audit` | Admin | Config change audit log |
| POST | `/v1/admin/config/test-webhook` | Admin | Test webhook connectivity |
| POST | `/v1/admin/config/sync-env` | Admin | Sync env vars to database |

#### PATCH `/v1/admin/config`

```json
{
  "updates": [
    { "key": "control_plane_url", "value": "https://api.trawlingtraders.com" },
    { "key": "digitalocean_token", "value": "dop_v1_..." }
  ]
}
```

---

## Health Checks

No authentication required.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/healthz` | Liveness probe (returns 200 OK) |
| GET | `/v1/readyz` | Readiness probe (checks DB connectivity) |
| GET | `/v1/health` | Detailed health with component status, version, uptime |

---

## Authentication

All authenticated endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are RS256 JWTs issued by `/v1/auth/login` (or other auth endpoints). Refresh via `/v1/auth/refresh`.

### JWT Claims

```json
{
  "sub": "uuid",
  "sid": "session-uuid",
  "is_system_admin": true,
  "org_id": "uuid (optional)",
  "role": "string (optional)",
  "iss": "cedros-login",
  "aud": "cedros-login",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Middleware Layers (app routes)

1. **Auth** - Validates JWT, extracts user context
2. **Rate Limit** - 100 requests per 60 seconds
3. **Subscription** - Verifies active subscription for bot operations

### Error Responses

All errors return appropriate HTTP status codes:

| Status | Meaning |
|--------|---------|
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (not owner, not admin, no subscription) |
| 404 | Not found |
| 429 | Rate limited |
| 500 | Internal server error |
