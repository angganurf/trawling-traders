# Trawling Traders - Full Codebase Audit Report

**Date:** 2026-02-18
**Scope:** Entire monorepo (147 files, ~33K LOC)
**Build Status:** All Rust crates compile. All 28 tests pass. TypeScript packages typecheck clean.
**Clippy:** 38 warnings (bot-runner), 0 warnings (control-plane, data-retrieval). redis v0.25.4 future-incompat warning.

---

## 1. Executive Summary

### Top 10 Issues (Ranked by Risk)

| # | Severity | Issue | Area |
|---|----------|-------|------|
| 1 | **Critical** | Persona enum mismatch: DB `quant_lite` vs TS `quant-lite` | Types / API |
| 2 | **High** | Encryption silently returns empty string on failure | Control-plane |
| 3 | **High** | Histogram memory leak — unbounded Vec grows forever | Control-plane |
| 4 | **High** | Bootstrap tokens stored/compared in plaintext (no hash) | Security |
| 5 | **High** | Spawned provisioning tasks silently swallow panics | Control-plane |
| 6 | **Medium** | No pagination on bot list / metrics / events endpoints | Performance |
| 7 | **Medium** | LLM API keys stored in AsyncStorage (not SecureStore) | Mobile |
| 8 | **Medium** | Missing `llmModel` field in BotConfig response mapping | API Client |
| 9 | **Medium** | Kline processing stub in data-retrieval does nothing | Data-retrieval |
| 10 | **Medium** | CI deploy condition allows running with zero successful builds | CI/CD |

### Biggest Performance Opportunities

1. **Add pagination** to `list_bots`, metrics, events, chat — currently unbounded SELECT *
2. **Fix histogram memory leak** — Vec<f64> grows forever, never cleaned
3. **Pyth health check** makes a real API call every time — should use cached health tracking like CoinGecko
4. **Rate limiter cleanup** runs on every request with modular check — could use a background task instead

### Highest-Risk Bugs

1. **Persona enum mismatch** — frontend sends `quant-lite`, backend stores `quant_lite`, API returns `quant_lite`, frontend comparison breaks
2. **Encryption failures swallowed** — `unwrap_or_default()` on encrypt stores empty string in DB, corrupting API keys silently

### Quick Wins (< 1 hour each)

1. Fix persona type to use `quant_lite` everywhere (types package + mobile)
2. Replace `unwrap_or_default()` with proper error propagation on encrypt calls
3. Add `LIMIT` clause to bot list query
4. Cap histogram Vec at 10K entries with ring-buffer semantics
5. Remove dead `_error` parameter from `update_bot_status`
6. Remove dead `AnimationPresets` and deprecated animation functions in mobile
7. Add `llmModel` field to BotConfig type and mapper

---

## 2. Findings Table

### F-001: Persona Enum Underscore/Hyphen Mismatch

| Field | Value |
|-------|-------|
| **ID** | F-001 |
| **Category** | Bug |
| **Severity** | Critical |
| **Confidence** | High |
| **Location** | `packages/types/src/index.ts:5`, `services/control-plane/src/models/mod.rs:12-18`, `migrations/001_initial_schema.sql:23` |
| **Description** | Database defines `persona` enum as `('beginner', 'tweaker', 'quant_lite')` with underscore. Rust model uses `#[sqlx(rename_all = "snake_case")]` → serializes to `quant_lite`. TypeScript type declares `'quant-lite'` (hyphen). Mobile UI sends `quant-lite` in CreateBotRequest. API returns `quant_lite`. TypeScript strict comparison against `quant-lite` will never match for this variant. |
| **Impact** | Users selecting "Quant Analyst" persona may see broken UI state, missing config, or silent fallback to wrong persona. Any `=== 'quant-lite'` check in frontend fails. |
| **Recommended fix** | Change `packages/types/src/index.ts` and all mobile references from `quant-lite` to `quant_lite`. |
| **Test plan** | Create a bot with quant_lite persona, verify roundtrip: create → API response → UI display. |
| **Effort** | S |

### F-002: Encryption Silently Returns Empty String on Failure

| Field | Value |
|-------|-------|
| **ID** | F-002 |
| **Category** | Bug / Security |
| **Severity** | High |
| **Confidence** | High |
| **Location** | `services/control-plane/src/handlers/bots.rs:381-386, 422-426, 428-431` |
| **Description** | When encrypting LLM API keys and Telegram tokens, the code uses `.unwrap_or_default()` which returns an empty string if encryption fails. This empty string is stored in the database, permanently losing the user's API key with no error returned to the caller. |
| **Impact** | User provides valid LLM API key → encryption fails (e.g., bad key length) → empty string stored → bot cannot use LLM → user gets no error feedback. |
| **Recommended fix** | Propagate the error: `.map_err(\|e\| (StatusCode::INTERNAL_SERVER_ERROR, format!("Encryption failed: {}", e)))?` |
| **Test plan** | Unit test: SecretsManager with invalid key → encrypt() → assert error returned, not empty string. |
| **Effort** | S |

### F-003: Histogram Memory Leak in MetricsCollector

| Field | Value |
|-------|-------|
| **ID** | F-003 |
| **Category** | Perf / Reliability |
| **Severity** | High |
| **Confidence** | High |
| **Location** | `services/control-plane/src/observability.rs:46-54` |
| **Description** | `MetricsCollector::histogram()` pushes to `Vec<f64>` with no cap or cleanup. The `snapshot()` method doesn't even include histograms in its output. Every request duration recording grows memory forever. |
| **Impact** | Slow memory growth proportional to request volume. Over days/weeks, could cause OOM. Histogram data is collected but never surfaced (double waste). |
| **Recommended fix** | Either (a) remove histogram collection entirely since it's unused in snapshot, or (b) implement a ring buffer with max 10K entries and include p50/p99 in snapshot. |
| **Test plan** | Record 100K histogram values, verify memory stays bounded. |
| **Effort** | S |

### F-004: Bootstrap Tokens Stored and Compared in Plaintext

| Field | Value |
|-------|-------|
| **ID** | F-004 |
| **Category** | Security |
| **Severity** | High |
| **Confidence** | High |
| **Location** | `services/control-plane/src/middleware/bot_auth.rs:46-58`, `services/control-plane/src/handlers/bots.rs:394,409` |
| **Description** | Bootstrap tokens (32 random bytes, hex-encoded) are stored in plaintext in the `bots.bootstrap_token` column and compared with `==` (not constant-time). A database leak exposes all active bot credentials. While tokens are single-use for secrets retrieval, they are reused for ongoing bot auth (heartbeats, config sync). |
| **Impact** | DB read access → full bot impersonation. Timing attack possible on comparison (theoretical, low practical risk). |
| **Recommended fix** | Store SHA-256 hash of token in DB. Compare hash on auth. Use constant-time comparison. |
| **Test plan** | Verify bot auth still works after migration. Verify raw token not recoverable from DB. |
| **Effort** | M |

### F-005: Spawned Provisioning Tasks Silently Swallow Panics

| Field | Value |
|-------|-------|
| **ID** | F-005 |
| **Category** | Reliability |
| **Severity** | High |
| **Confidence** | High |
| **Location** | `services/control-plane/src/handlers/bots.rs:478-489, 962-974, 987-989` |
| **Description** | `tokio::spawn(spawn_bot_droplet(...))`, `tokio::spawn(redeploy_bot_droplet(...))`, and `tokio::spawn(destroy_bot_droplet(...))` launch tasks without monitoring the JoinHandle. If the spawned task panics, the bot enters a permanent "provisioning" or "destroying" state with no notification. |
| **Impact** | Bot stuck in limbo state. User sees "provisioning" forever. Orphan cleanup task (every 10 min) is the only recovery, but it only handles the happy path of DO API failure, not Rust panics. |
| **Recommended fix** | Store the JoinHandle and spawn a monitoring task that updates bot status to "error" if the handle resolves with Err (panic). Or use `tokio::spawn` with `.abort_handle()` and a supervisor. |
| **Test plan** | Simulate a panic in spawn_bot_droplet, verify bot transitions to error state. |
| **Effort** | M |

### F-006: No Pagination on List Endpoints

| Field | Value |
|-------|-------|
| **ID** | F-006 |
| **Category** | Perf |
| **Severity** | Medium |
| **Confidence** | High |
| **Location** | `services/control-plane/src/handlers/bots.rs:166-170` |
| **Description** | `list_bots()` runs `SELECT * FROM bots WHERE user_id = $1 ORDER BY created_at DESC` with no LIMIT. Same pattern in metrics, events, and chat endpoints. |
| **Impact** | With many bots or events, response payloads grow unbounded. Network and memory pressure. Currently mitigated by low bot counts (max 20 for Enterprise), but events/metrics can be unbounded. |
| **Recommended fix** | Add `LIMIT $2 OFFSET $3` with default 50, max 100. Accept `?limit=N&offset=M` query params. |
| **Test plan** | Create 100+ events, verify paginated response returns correct subset. |
| **Effort** | S |

### F-007: LLM API Keys in AsyncStorage (Mobile)

| Field | Value |
|-------|-------|
| **ID** | F-007 |
| **Category** | Security |
| **Severity** | Medium |
| **Confidence** | Medium |
| **Location** | `apps/mobile/src/store/index.ts` (SettingsStore with persist) |
| **Description** | User-provided LLM API keys are persisted via Zustand's `persist` middleware to AsyncStorage, which is not encrypted at rest on all devices. `expo-secure-store` is already a dependency and provides encrypted storage. |
| **Impact** | On rooted/jailbroken devices or via backup extraction, API keys could be exposed. Low practical risk on stock devices (both iOS and Android encrypt app data at rest). |
| **Recommended fix** | Store sensitive settings (llmApiKey, telegram tokens) in `expo-secure-store` instead of AsyncStorage. Keep non-sensitive preferences in AsyncStorage. |
| **Test plan** | Verify settings persist across app restarts using SecureStore. |
| **Effort** | M |

### F-008: Missing `llmModel` in BotConfig Response Mapping

| Field | Value |
|-------|-------|
| **ID** | F-008 |
| **Category** | Bug |
| **Severity** | Medium |
| **Confidence** | High |
| **Location** | `packages/api-client/src/index.ts:430-449`, `packages/types/src/index.ts:61-102` |
| **Description** | `CreateBotRequest` sends `llmModel` to the backend, but the `BotConfig` interface and `mapBotConfig()` function don't include it in the response mapping. The selected model is lost on roundtrip. |
| **Impact** | UI shows wrong/missing LLM model after bot creation. Settings screen may show default instead of user's selection. |
| **Recommended fix** | Add `llmModel?: string` to BotConfig interface. Map it in `mapBotConfig()`. |
| **Test plan** | Create bot with specific model, fetch config, verify model field present. |
| **Effort** | S |

### F-009: Kline Processing Stub Does Nothing

| Field | Value |
|-------|-------|
| **ID** | F-009 |
| **Category** | Dead Code |
| **Severity** | Medium |
| **Confidence** | High |
| **Location** | `services/data-retrieval/src/sources/binance_ws.rs:285-306` |
| **Description** | `process_kline()` checks if a candle is closed but has a TODO comment and returns Ok(()) without processing. Kline subscriptions are accepted but data is discarded. |
| **Impact** | Anyone subscribing to klines gets no data. Wastes WebSocket bandwidth. |
| **Recommended fix** | Either implement kline processing or remove the subscription endpoint with a clear error. |
| **Test plan** | Subscribe to klines, verify data is either processed or rejected. |
| **Effort** | M |

### F-010: CI Deploy Runs with Zero Successful Builds

| Field | Value |
|-------|-------|
| **ID** | F-010 |
| **Category** | Reliability |
| **Severity** | Medium |
| **Confidence** | Medium |
| **Location** | `.github/workflows/deploy.yml:182-186` |
| **Description** | Deploy condition uses `always()` and allows both builds to be "skipped". The last condition requires at least one success, but with `always()` + `skipped`, the job could trigger with stale images. The `docker pull` inside the script guards against missing images, so actual impact is limited. |
| **Impact** | Deploy job runs unnecessarily when both builds are skipped. SSH connection made, docker login performed, but no images deployed. Wastes CI minutes and creates confusing logs. |
| **Recommended fix** | Change condition to require at least one `success` result, not `skipped`. |
| **Test plan** | Trigger workflow with both builds skipped, verify deploy job is skipped. |
| **Effort** | S |

### F-011: Dead Code in bot-runner (Clippy Warnings)

| Field | Value |
|-------|-------|
| **ID** | F-011 |
| **Category** | Cleanup |
| **Severity** | Low |
| **Confidence** | High |
| **Location** | `services/bot-runner/src/reconciler.rs:15,21,30-32,70,76`, `services/bot-runner/src/openclaw.rs:60,173,205` |
| **Description** | 38 clippy warnings for dead code: `ReconciliationResult.timestamp`, `BalanceMatch.{mint,symbol,amount_raw}`, `HoldingsReconciler.{reconciliation_interval,with_interval,is_due}`, `OpenClawClient.{with_url,version,gateway_url}`. Also legacy `TradeResult` struct in executor.rs. |
| **Impact** | Code noise, maintenance burden. No runtime impact. |
| **Recommended fix** | Remove unused fields/methods or add `#[cfg(test)]` if needed for tests. |
| **Test plan** | `cargo clippy` should pass with zero warnings. |
| **Effort** | S |

### F-012: `_error` Parameter Never Used in `update_bot_status`

| Field | Value |
|-------|-------|
| **ID** | F-012 |
| **Category** | Bug / Maintainability |
| **Severity** | Low |
| **Confidence** | High |
| **Location** | `services/control-plane/src/handlers/bots.rs:788-797` |
| **Description** | `update_bot_status(pool, bot_id, status, _error)` accepts an error string parameter but never stores or logs it. Callers pass error context that is silently discarded. |
| **Impact** | Error context lost. When a bot enters error state, there's no record of why. |
| **Recommended fix** | Either store error in a `bots.last_error` column or log it with `tracing::warn!`. |
| **Test plan** | Trigger provisioning failure, verify error message is logged/stored. |
| **Effort** | S |

### F-013: Plaintext Secrets Fallback in Dev Mode

| Field | Value |
|-------|-------|
| **ID** | F-013 |
| **Category** | Security |
| **Severity** | Medium |
| **Confidence** | High |
| **Location** | `services/control-plane/src/secrets.rs:70-77, 120-127` |
| **Description** | When `SECRETS_ENCRYPTION_KEY` is not set, `SecretsManager` stores and retrieves secrets as plaintext. This is intended for dev but could leak to production if the env var is accidentally missing. Only a `debug!` log on decrypt and `warn!` on encrypt. |
| **Impact** | If env var is missing in production: all API keys stored in plaintext in DB. |
| **Recommended fix** | Add a startup check: if `ENVIRONMENT != "development"` and encryption key is missing, refuse to start. |
| **Test plan** | Set ENVIRONMENT=production, omit SECRETS_ENCRYPTION_KEY, verify server refuses to start. |
| **Effort** | S |

### F-014: Pyth Health Check Makes Real API Call

| Field | Value |
|-------|-------|
| **ID** | F-014 |
| **Category** | Perf |
| **Severity** | Low |
| **Confidence** | High |
| **Location** | `services/data-retrieval/src/sources/pyth.rs:272-290` |
| **Description** | Pyth's `health()` method makes a real API call for BTC price to check liveness, unlike CoinGecko which uses an efficient internal `HealthTracker` with atomic counters. |
| **Impact** | Every `/health` endpoint call triggers a Pyth API request. If health checks are frequent (e.g., every 30s from Docker), this wastes API quota. |
| **Recommended fix** | Add a `HealthTracker` to PythClient (same pattern as CoinGecko). |
| **Test plan** | Call `/health` 100 times, verify only cached results returned (no API calls). |
| **Effort** | S |

### F-015: `strict: false` in API Client TypeScript Config

| Field | Value |
|-------|-------|
| **ID** | F-015 |
| **Category** | Maintainability |
| **Severity** | Low |
| **Confidence** | High |
| **Location** | `packages/api-client/tsconfig.json:9-10` |
| **Description** | `strict: false` and `noImplicitAny: false` disable TypeScript's strongest safety checks. Combined with the persona mismatch (F-001) and missing llmModel (F-008), these bugs would have been caught at compile time with stricter settings. |
| **Impact** | Type errors not caught at build time. Runtime surprises. |
| **Recommended fix** | Enable `strict: true`. Fix resulting type errors (likely 10-20 issues). |
| **Test plan** | `npx tsc --noEmit` passes with strict mode. |
| **Effort** | M |

### F-016: `redis` v0.25.4 Future Incompatibility

| Field | Value |
|-------|-------|
| **ID** | F-016 |
| **Category** | Maintainability |
| **Severity** | Low |
| **Confidence** | High |
| **Location** | `services/control-plane/Cargo.toml`, `services/data-retrieval/Cargo.toml` |
| **Description** | Cargo reports: "redis v0.25.4 contains code that will be rejected by a future version of Rust." |
| **Impact** | Will break on future Rust edition upgrade. |
| **Recommended fix** | Upgrade redis crate to latest (0.26+). |
| **Test plan** | `cargo check` with no future-incompat warnings. |
| **Effort** | S |

### F-017: Duplicate SafeAreaProvider in App.tsx

| Field | Value |
|-------|-------|
| **ID** | F-017 |
| **Category** | Bug |
| **Severity** | Low |
| **Confidence** | High |
| **Location** | `apps/mobile/App.tsx:57,76` |
| **Description** | `SafeAreaProvider` is rendered twice: once inside `content` (line 57) wrapping the main app, and again at line 76 wrapping the payments error banner. Nested SafeAreaProviders can cause incorrect inset calculations. |
| **Impact** | The payments error banner may have incorrect safe area insets on devices with notches. |
| **Recommended fix** | Remove the inner SafeAreaProvider at line 76; it's already wrapped by the outer one. |
| **Test plan** | Check payments error banner positioning on iPhone with notch. |
| **Effort** | S |

### F-018: Dead Animation Code in Mobile

| Field | Value |
|-------|-------|
| **ID** | F-018 |
| **Category** | Cleanup |
| **Severity** | Low |
| **Confidence** | High |
| **Location** | `apps/mobile/src/utils/animations.ts:258-366` |
| **Description** | `AnimationPresets` object and several deprecated animation functions are defined but never imported or used. |
| **Impact** | Dead code. ~110 lines of unused code. |
| **Recommended fix** | Remove unused exports. |
| **Test plan** | Grep for imports; verify none reference removed functions. |
| **Effort** | S |

### F-019: API Key Validation — Two Separate Queries

| Field | Value |
|-------|-------|
| **ID** | F-019 |
| **Category** | Security / Perf |
| **Severity** | Low |
| **Confidence** | Medium |
| **Location** | `services/control-plane/src/middleware/auth.rs:88-113` |
| **Description** | API key auth performs two queries: (1) lookup key by prefix+hash in `api_keys`, (2) lookup admin flag in `users`. These could race if the key is deleted between queries. Also doubles DB load per authenticated request. |
| **Impact** | Theoretical race condition. 2x DB queries per API-key-auth request. |
| **Recommended fix** | Use a single JOIN query: `SELECT u.is_admin FROM api_keys k JOIN users u ON k.user_id = u.id WHERE k.key_prefix = $1 AND k.key_hash = $2`. |
| **Test plan** | Auth with API key, verify single query in DB logs. |
| **Effort** | S |

### F-020: `live_trading_guard_middleware` Defined but Never Applied

| Field | Value |
|-------|-------|
| **ID** | F-020 |
| **Category** | Dead Code / Security |
| **Severity** | Medium |
| **Confidence** | High |
| **Location** | `services/control-plane/src/middleware/subscription.rs:175-191` |
| **Description** | `live_trading_guard_middleware` is defined to prevent live trading on Free tier, but is never applied to any route in the router setup. |
| **Impact** | Free-tier users may be able to enable live trading mode on their bots without this guard. |
| **Recommended fix** | Either apply the middleware to relevant routes or remove it if the check is handled elsewhere. |
| **Test plan** | Try to enable live trading as a free-tier user; verify it's blocked. |
| **Effort** | S |

---

## 3. Proposed Patch Set

### Patch 1: Dead Code Removal & Dependency Cleanup

**Files touched:** 6 | **Risk:** None | **Estimated LOC:** ~80 removed

1. Remove dead fields/methods in `bot-runner/src/reconciler.rs` (F-011)
2. Remove unused `_error` param or wire it up in `control-plane/src/handlers/bots.rs` (F-012)
3. Remove dead `AnimationPresets` and deprecated functions in `mobile/src/utils/animations.ts` (F-018)
4. Remove or implement `live_trading_guard_middleware` (F-020)
5. Remove unused histogram collection from `observability.rs` or cap it (F-003)
6. Upgrade `redis` crate to fix future-incompat warning (F-016)

### Patch 2: Bug Fixes

**Files touched:** 5 | **Risk:** Low | **Estimated LOC:** ~40 changed

1. Fix persona type: `quant-lite` → `quant_lite` in `packages/types/src/index.ts` and all mobile references (F-001)
2. Fix encryption error swallowing: replace `unwrap_or_default()` with `?` operator (F-002)
3. Add `llmModel` to BotConfig interface and response mapper (F-008)
4. Remove duplicate SafeAreaProvider (F-017)
5. Add startup guard: refuse to start in production without encryption key (F-013)

### Patch 3: Performance Improvements

**Files touched:** 4 | **Risk:** Low | **Estimated LOC:** ~30 changed

1. Add `LIMIT 50` default to `list_bots` query with optional pagination params (F-006)
2. Add HealthTracker to PythClient instead of real API calls on `/health` (F-014)
3. Merge API key auth into single JOIN query (F-019)

### Patch 4: Security Hardening

**Files touched:** 3 | **Risk:** Medium (requires migration) | **Estimated LOC:** ~60 changed

1. Hash bootstrap tokens before storage; compare hashes on auth (F-004)
2. Move LLM API keys from AsyncStorage to expo-secure-store (F-007)
3. Add JoinHandle monitoring for spawned provisioning tasks (F-005)

---

## Appendix: Build & Test Results

```
# Control-plane
cargo check: OK (0 warnings)
cargo clippy: OK (0 warnings, redis future-incompat note)

# Bot-runner
cargo check: OK (30 warnings — dead code)
cargo clippy: OK (38 warnings — dead code + 1 suggestion)
cargo test: 28/28 passed (13 unit + 15 integration)

# Data-retrieval
cargo check: OK (0 warnings, redis future-incompat note)

# TypeScript packages
packages/types: tsc --noEmit OK
packages/api-client: tsc --noEmit OK
```
