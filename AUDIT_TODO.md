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

- [ ] **F-002 Remove production debug leaks (`/debug/*`)**
  - Files touched: `services/control-plane/src/main.rs`
  - Planned fix:
    - Gate debug routes behind explicit env var `ENABLE_DEBUG_ROUTES=true`.
    - Disable by default in all environments.
    - Ensure no auth token preview is exposed when disabled.
  - Test plan:
    - Router test validating `/debug/startup` is absent by default.

## High

- [ ] **F-003 Broken test gate + missing CI coverage for bot-runner**
  - Files touched: `services/bot-runner/tests/paper_trading_harness.rs`, `.github/workflows/deploy.yml`
  - Planned fix:
    - Fix `BotConfig` test fixture fields (`llm_model`, `telegram_bot_token`).
    - Add bot-runner fmt/clippy/test jobs to CI workflow.
    - Keep existing pipeline behavior for other services unchanged.
  - Test plan:
    - Run `cd services/bot-runner && cargo test`.
    - Validate workflow YAML parses and references bot-runner steps.

- [ ] **F-004 N+1 in report generation + non-global ordering risk**
  - Files touched: `services/control-plane/src/handlers/reports.rs`
  - Planned fix:
    - Replace per-bot event loading loop with a single joined query by user/timeframe.
    - Preserve report filtering semantics (`tax`, `trade-history`, `full`).
    - Ensure stable global ordering by `created_at`.
  - Test plan:
    - Add unit test covering row ordering/filtering behavior.

- [ ] **F-005 Batch pricing endpoint is sequential and unbounded**
  - Files touched: `services/data-retrieval/src/handlers.rs`
  - Planned fix:
    - Add max symbol limit validation.
    - Process symbol requests concurrently with bounded fan-out.
    - Preserve response shape and per-symbol error behavior.
  - Test plan:
    - Add tests for oversized request rejection.
    - Add test for successful bounded batch execution.

## Medium

- [ ] **F-006 Missing explicit upstream timeouts/client reuse in chat/report handlers**
  - Files touched: `services/control-plane/src/lib.rs`, `services/control-plane/src/main.rs`, `services/control-plane/src/handlers/chat.rs`, `services/control-plane/src/handlers/reports.rs`
  - Planned fix:
    - Add shared `reqwest::Client` to app state with explicit timeout.
    - Replace ad hoc `reqwest::Client::new()` calls in handlers.
    - Preserve payload and error mapping semantics.
  - Test plan:
    - Compile checks and existing handler tests.

- [ ] **F-007 Runtime panic footguns (`unwrap`/`expect`)**
  - Files touched: `services/control-plane/src/webhook.rs`, `services/control-plane/src/provisioning.rs`, `services/control-plane/src/handlers/bots.rs`
  - Planned fix:
    - Replace runtime `expect`/`unwrap` with explicit error propagation/fallback handling.
    - Keep response codes/messages stable where possible.
    - Add defensive handling for serialization/encryption edge cases.
  - Test plan:
    - Existing test suite + new targeted unit tests for error branches.

- [ ] **F-008 Dead router path divergence (`lib.rs::app` unused)**
  - Files touched: `services/control-plane/src/lib.rs`
  - Planned fix:
    - Remove unused `app(...)` router builder to avoid drift.
    - Keep only the `main.rs` router composition as source of truth.
    - Ensure public exports remain intact.
  - Test plan:
    - `cd services/control-plane && cargo check`.

- [ ] **F-009 Duplicate API client implementation drift (`index.ts` vs `client.ts`)**
  - Files touched: `packages/api-client/src/client.ts`, `packages/api-client/src/index.ts` (if needed)
  - Planned fix:
    - Make `client.ts` a thin re-export of canonical `index.ts` implementation.
    - Remove duplicate logic to avoid behavioral divergence.
    - Preserve import compatibility for existing consumers.
  - Test plan:
    - `cd packages/api-client && npm run build`.
    - `cd apps/mobile && npm run --silent tsc --noEmit` (if available).

## Low

- [ ] **F-010 Root lint/typecheck scripts are non-runnable**
  - Files touched: `package.json`
  - Planned fix:
    - Make root scripts workspace-aware and runnable in repo context.
    - Avoid introducing broad lint config churn.
    - Ensure commands fail only on real project issues.
  - Test plan:
    - Run `npm run lint` and `npm run typecheck` from repo root.

- [ ] **F-011 Over-broad dead_code allowances in bot-runner**
  - Files touched: `services/bot-runner/src/main.rs`, `services/bot-runner/src/lib.rs`
  - Planned fix:
    - Remove crate-level `#![allow(dead_code)]`.
    - Add localized `#[allow(dead_code)]` only where intentionally needed.
    - Keep build warning-clean where practical.
  - Test plan:
    - `cd services/bot-runner && cargo check`.

- [ ] **F-012 `with_retry` zero-attempt panic edge case**
  - Files touched: `services/control-plane/src/provisioning.rs`
  - Planned fix:
    - Validate `max_attempts >= 1` before loop.
    - Return explicit error instead of panicking when invalid config passed.
    - Add unit test for invalid retry config.
  - Test plan:
    - New unit test + `cd services/control-plane && cargo test provisioning`.
