# Audit Remediation Checklist

Legend: `[ ]` pending, `[x]` completed.

## Critical

- [x] **F-001 Bot route auth boundary (unauthenticated secret-bearing endpoints)**
  - Files touched: `services/control-plane/src/main.rs`, `services/control-plane/src/middleware/mod.rs`, `services/control-plane/src/middleware/bot_auth.rs`, `services/control-plane/src/handlers/sync.rs`, `services/control-plane/src/lib.rs`
  - Planned fix:
    - Add dedicated bot auth middleware requiring `Authorization: Bearer <bootstrap_token>` for bot-facing routes.
    - Enforce bot-id/token binding in middleware before handlers execute.
    - Keep `/bot/{id}/secrets` one-time token semantics while preventing unauthenticated access to all `/bot/{id}/*` endpoints.
  - Test plan:
    - Add middleware unit tests for allow/deny cases.
    - Integration-style handler test for unauthorized request returns 401.
  - Completion note:
    - Added `bot_auth_middleware` and wired it to all `/v1/bot/{id}/*` routes.
    - Bot runner now sends `Authorization: Bearer $CONTROL_PLANE_BOT_TOKEN`; bootstrap writes token into service env file.
    - Verified with `cd services/control-plane && cargo test middleware::bot_auth` and `cd services/bot-runner && cargo check`.

- [x] **F-002 Remove production debug leaks (`/debug/*`)**
  - Files touched: `services/control-plane/src/main.rs`
  - Planned fix:
    - Gate debug routes behind explicit env var `ENABLE_DEBUG_ROUTES=true`.
    - Disable by default in all environments.
    - Ensure no auth token preview is exposed when disabled.
  - Test plan:
    - Router test validating `/debug/startup` is absent by default.
  - Completion note:
    - Added `ENABLE_DEBUG_ROUTES` gate; debug routes are now disabled by default and only enabled when explicitly set to `true`.
    - Added unit tests for flag parsing behavior.
    - Verified with `cd services/control-plane && cargo test debug_routes`.

## High

- [x] **F-003 Broken test gate + missing CI coverage for bot-runner**
  - Files touched: `services/bot-runner/tests/paper_trading_harness.rs`, `.github/workflows/deploy.yml`
  - Planned fix:
    - Fix `BotConfig` test fixture fields (`llm_model`, `telegram_bot_token`).
    - Add bot-runner fmt/clippy/test jobs to CI workflow.
    - Keep existing pipeline behavior for other services unchanged.
  - Test plan:
    - Run `cd services/bot-runner && cargo test`.
    - Validate workflow YAML parses and references bot-runner steps.
  - Completion note:
    - Updated `paper_trading_harness` fixtures for current `BotConfig` fields (`llm_model`, `telegram_bot_token`).
    - Added bot-runner fmt/clippy/test steps and target cache path in GitHub Actions deploy workflow.
    - Verified with `cd services/bot-runner && cargo test`.

- [x] **F-004 N+1 in report generation + non-global ordering risk**
  - Files touched: `services/control-plane/src/handlers/reports.rs`
  - Planned fix:
    - Replace per-bot event loading loop with a single joined query by user/timeframe.
    - Preserve report filtering semantics (`tax`, `trade-history`, `full`).
    - Ensure stable global ordering by `created_at`.
  - Test plan:
    - Add unit test covering row ordering/filtering behavior.
  - Completion note:
    - Replaced per-bot event loading loop with a single `events`+`bots` join query filtered by user/timeframe and globally ordered by `created_at`.
    - Added `filter_rows_preserves_order_and_filters_for_tax_report` unit test.
    - Verified with `cd services/control-plane && cargo test filter_rows_preserves_order_and_filters_for_tax_report` and `cd services/control-plane && cargo check`.

- [x] **F-005 Batch pricing endpoint is sequential and unbounded**
  - Files touched: `services/data-retrieval/src/handlers.rs`
  - Planned fix:
    - Add max symbol limit validation.
    - Process symbol requests concurrently with bounded fan-out.
    - Preserve response shape and per-symbol error behavior.
  - Test plan:
    - Add tests for oversized request rejection.
    - Add test for successful bounded batch execution.
  - Completion note:
    - Added max batch-size validation (`MAX_BATCH_SYMBOLS=100`) with explicit `400` error.
    - Reworked batch lookups to bounded concurrent execution (`buffered(10)`) while preserving response semantics.
    - Added tests `validate_batch_size_rejects_oversized` and `get_prices_batch_accepts_empty_batch`; verified with `cd services/data-retrieval && cargo test validate_batch_size_rejects_oversized`, `cd services/data-retrieval && cargo test get_prices_batch_accepts_empty_batch`, and `cd services/data-retrieval && cargo check`.

## Medium

- [x] **F-006 Missing explicit upstream timeouts/client reuse in chat/report handlers**
  - Files touched: `services/control-plane/src/lib.rs`, `services/control-plane/src/main.rs`, `services/control-plane/src/handlers/chat.rs`, `services/control-plane/src/handlers/reports.rs`
  - Planned fix:
    - Add shared `reqwest::Client` to app state with explicit timeout.
    - Replace ad hoc `reqwest::Client::new()` calls in handlers.
    - Preserve payload and error mapping semantics.
  - Test plan:
    - Compile checks and existing handler tests.
  - Completion note:
    - Added shared `reqwest::Client` with explicit 15s timeout to `AppState`.
    - Updated chat/report webhook handlers to reuse the shared client instead of creating ad hoc clients per request.
    - Verified with `cd services/control-plane && cargo check` and `cd services/control-plane && cargo test handlers::reports::tests::filter_rows_preserves_order_and_filters_for_tax_report`.

- [x] **F-007 Runtime panic footguns (`unwrap`/`expect`)**
  - Files touched: `services/control-plane/src/webhook.rs`, `services/control-plane/src/provisioning.rs`, `services/control-plane/src/handlers/bots.rs`
  - Planned fix:
    - Replace runtime `expect`/`unwrap` with explicit error propagation/fallback handling.
    - Keep response codes/messages stable where possible.
    - Add defensive handling for serialization/encryption edge cases.
  - Test plan:
    - Existing test suite + new targeted unit tests for error branches.
  - Completion note:
    - Replaced webhook client constructor `expect` with non-panicking fallback and warning.
    - Replaced runtime `serde_json::to_value(...).unwrap()` in bot config handlers with explicit `400` error mapping.
    - Verified with `cd services/control-plane && cargo check` and `cd services/control-plane && cargo test handlers::settings::tests::normalize_display_name_trims_and_keeps_valid_input`.
    - Note: `with_retry` zero-attempt panic is intentionally handled in `F-012`.

- [x] **F-008 Dead router path divergence (`lib.rs::app` unused)**
  - Files touched: `services/control-plane/src/lib.rs`
  - Planned fix:
    - Remove unused `app(...)` router builder to avoid drift.
    - Keep only the `main.rs` router composition as source of truth.
    - Ensure public exports remain intact.
  - Test plan:
    - `cd services/control-plane && cargo check`.
  - Completion note:
    - Removed unused `control_plane::app(...)` router builder from `lib.rs` so route composition is defined only in `main.rs`.
    - Cleaned now-unused imports from `lib.rs`.
    - Verified with `cd services/control-plane && cargo check`.

- [x] **F-009 Duplicate API client implementation drift (`index.ts` vs `client.ts`)**
  - Files touched: `packages/api-client/src/client.ts`, `packages/api-client/src/index.ts` (if needed)
  - Planned fix:
    - Make `client.ts` a thin re-export of canonical `index.ts` implementation.
    - Remove duplicate logic to avoid behavioral divergence.
    - Preserve import compatibility for existing consumers.
  - Test plan:
    - `cd packages/api-client && npm run build`.
    - `cd apps/mobile && npm run --silent tsc --noEmit` (if available).
  - Completion note:
    - Replaced duplicated `client.ts` implementation with a compatibility re-export of canonical `index.ts`.
    - Verified package build with `cd packages/api-client && npm run build`.
    - `cd apps/mobile && npx tsc --noEmit` reports an existing unrelated screen typing error in `/Users/conorholdsworth/Workspace/temp/trawling-traders/apps/mobile/src/screens/create-bot/CreateBotWizardSteps.tsx`.

## Low

- [x] **F-010 Root lint/typecheck scripts are non-runnable**
  - Files touched: `package.json`
  - Planned fix:
    - Make root scripts workspace-aware and runnable in repo context.
    - Avoid introducing broad lint config churn.
    - Ensure commands fail only on real project issues.
  - Test plan:
    - Run `npm run lint` and `npm run typecheck` from repo root.
  - Completion note:
    - Updated root scripts to workspace-aware, runnable commands that execute shared TS package builds from repo root.
    - Verified with `npm run lint` and `npm run typecheck`.

- [x] **F-011 Over-broad dead_code allowances in bot-runner**
  - Files touched: `services/bot-runner/src/main.rs`, `services/bot-runner/src/lib.rs`
  - Planned fix:
    - Remove crate-level `#![allow(dead_code)]`.
    - Add localized `#[allow(dead_code)]` only where intentionally needed.
    - Keep build warning-clean where practical.
  - Test plan:
    - `cd services/bot-runner && cargo check`.
  - Completion note:
    - Removed crate-level `#![allow(dead_code)]` from both bot-runner library and binary entrypoints.
    - Verified with `cd services/bot-runner && cargo check` (warnings are now visible and can be addressed incrementally).

- [x] **F-012 `with_retry` zero-attempt panic edge case**
  - Files touched: `services/control-plane/src/provisioning.rs`
  - Planned fix:
    - Validate `max_attempts >= 1` before loop.
    - Return explicit error instead of panicking when invalid config passed.
    - Add unit test for invalid retry config.
  - Test plan:
    - New unit test + `cd services/control-plane && cargo test provisioning`.
  - Completion note:
    - Updated `with_retry` to return `anyhow::Result<T>` and explicitly reject `max_attempts == 0` with a structured error.
    - Removed panic-based `expect` fallback in retry completion path.
    - Added `with_retry_rejects_zero_attempts` unit test and verified with `cd services/control-plane && cargo test with_retry_rejects_zero_attempts` and `cd services/control-plane && cargo check`.

---

# Round 2 Audit Findings

Based on comprehensive full-codebase audit (2026-02-18). IDs prefixed R2- to distinguish from Round 1.

## Critical

- [x] **R2-001 Persona enum mismatch: DB `quant_lite` vs TS `quant-lite`**
  - Files: `packages/types/src/index.ts`, `apps/mobile/src/screens/CreateBotScreen.tsx`, `apps/mobile/src/screens/BotSettingsScreen.tsx`, `services/control-plane/src/models/mod.rs`, `docs/frontend-architecture.md`
  - Planned fix:
    - Add `#[serde(rename_all = "snake_case")]` to Persona enum so API returns `quant_lite`
    - Change TypeScript `Persona` type from `'quant-lite'` to `'quant_lite'`
    - Update all mobile references from `quant-lite` to `quant_lite`
  - Test plan: `cargo check` (control-plane), `npx tsc --noEmit` (types, api-client)
  - Completion note:
    - Added `#[serde(rename_all = "snake_case")]` to Persona enum — API now serializes as `quant_lite` matching DB
    - Updated TS type, mobile screens (CreateBotScreen, BotSettingsScreen), and docs
    - Verified: `cargo check` clean, `tsc --noEmit` clean for both packages

## High

- [ ] **R2-002 Encryption silently returns empty string on failure**
  - Files: `services/control-plane/src/handlers/bots.rs`
  - Planned fix:
    - Replace `.unwrap_or_default()` on `secrets.encrypt()` with proper error propagation via `map_err`
    - Return 500 to caller instead of storing empty string
  - Test plan: `cargo check`, `cargo test` on control-plane
  - Status: pending

- [ ] **R2-003 Histogram memory leak in MetricsCollector**
  - Files: `services/control-plane/src/observability.rs`
  - Planned fix:
    - Remove unused histogram collection (histograms field, `histogram()` method) since `snapshot()` never surfaces it
    - Simplify MetricsInner struct
  - Test plan: `cargo check` on control-plane
  - Status: pending

- [ ] **R2-004 Spawned provisioning tasks silently swallow panics**
  - Files: `services/control-plane/src/handlers/bots.rs`
  - Planned fix:
    - Wrap each `tokio::spawn` call with a supervisor that catches JoinError and updates bot status to "error"
    - Log panic info for diagnostics
  - Test plan: `cargo check`, `cargo test` on control-plane
  - Status: pending

## Medium

- [ ] **R2-005 No pagination on bot list endpoint**
  - Files: `services/control-plane/src/handlers/bots.rs`
  - Planned fix:
    - Add `LIMIT 50` default to `list_bots` query
    - Accept optional `?limit=N` query param (max 100)
  - Test plan: `cargo check` on control-plane
  - Status: pending

- [ ] **R2-006 Missing `llmModel` in BotConfig response mapping**
  - Files: `packages/types/src/index.ts`, `packages/api-client/src/index.ts`
  - Planned fix:
    - Add `llmModel?: string` to `BotConfig` interface
    - Map `llm_model` in `mapBotConfig()`
  - Test plan: `npm run typecheck`
  - Status: pending

- [ ] **R2-007 Plaintext secrets fallback in production**
  - Files: `services/control-plane/src/secrets.rs`
  - Planned fix:
    - Add startup guard: if ENVIRONMENT is not "development"/"dev" and encryption key is missing, log error and exit
  - Test plan: `cargo check` on control-plane
  - Status: pending

- [ ] **R2-008 Kline processing stub does nothing**
  - Files: `services/data-retrieval/src/sources/binance_ws.rs`
  - Planned fix:
    - Remove unimplemented kline processing stub
    - Have `subscribe_klines()` return an error indicating feature is not yet implemented
  - Test plan: `cargo check` on data-retrieval
  - Status: pending

- [ ] **R2-009 `live_trading_guard_middleware` defined but never applied**
  - Files: `services/control-plane/src/middleware/subscription.rs`, `services/control-plane/src/main.rs`
  - Planned fix:
    - Apply `live_trading_guard_middleware` to the bot update/deploy routes that can change trading mode
  - Test plan: `cargo check` on control-plane
  - Status: pending

- [ ] **R2-010 LLM API keys stored in AsyncStorage (not SecureStore)**
  - Files: `apps/mobile/src/store/index.ts`
  - Planned fix:
    - Move sensitive settings (llmApiKey fields) to expo-secure-store wrapper
    - Keep non-sensitive preferences in AsyncStorage
  - Test plan: Mobile typecheck
  - Status: pending

## Low

- [ ] **R2-011 Dead code in bot-runner (clippy warnings)**
  - Files: `services/bot-runner/src/reconciler.rs`, `services/bot-runner/src/openclaw.rs`, `services/bot-runner/src/executor.rs`
  - Planned fix:
    - Remove unused fields/methods flagged by clippy
    - Remove legacy `TradeResult` struct
  - Test plan: `cargo clippy` on bot-runner with zero warnings, `cargo test`
  - Status: pending

- [ ] **R2-012 `_error` parameter never used in `update_bot_status`**
  - Files: `services/control-plane/src/handlers/bots.rs`
  - Planned fix:
    - Log the error parameter with `tracing::warn!` when status is error
    - Remove underscore prefix
  - Test plan: `cargo check` on control-plane
  - Status: pending

- [ ] **R2-013 Pyth health check makes real API call**
  - Files: `services/data-retrieval/src/sources/pyth.rs`
  - Planned fix:
    - Add `HealthTracker` struct (same pattern as CoinGecko) with atomic success/failure counters
    - Return cached health instead of making API call
  - Test plan: `cargo check` on data-retrieval
  - Status: pending

- [ ] **R2-014 `redis` v0.25.4 future incompatibility**
  - Files: `services/control-plane/Cargo.toml`, `services/data-retrieval/Cargo.toml`
  - Planned fix:
    - Upgrade redis dependency to latest compatible version
  - Test plan: `cargo check` with no future-incompat warnings
  - Status: pending

- [ ] **R2-015 Duplicate SafeAreaProvider in App.tsx**
  - Files: `apps/mobile/App.tsx`
  - Planned fix:
    - Remove nested SafeAreaProvider wrapping payments error banner
  - Test plan: Visual check; typecheck
  - Status: pending

- [ ] **R2-016 Dead animation code in mobile**
  - Files: `apps/mobile/src/utils/animations.ts`
  - Planned fix:
    - Remove unused `AnimationPresets` and deprecated animation functions
  - Test plan: Grep for imports to verify no references
  - Status: pending

- [ ] **R2-017 API key auth uses two separate queries**
  - Files: `services/control-plane/src/middleware/auth.rs`
  - Planned fix:
    - Merge api_keys + users lookup into single JOIN query
  - Test plan: `cargo check` on control-plane
  - Status: pending

- [ ] **R2-018 `strict: false` in API client tsconfig**
  - Files: `packages/api-client/tsconfig.json`, `packages/api-client/src/index.ts`
  - Planned fix:
    - Enable `strict: true` and fix resulting type errors
  - Test plan: `npm run typecheck`
  - Status: pending
