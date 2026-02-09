# Mobile Vision Implementation Plan (Approved)

Date: 2026-02-09
Owner: trawling-traders

## Product Goal
Align the mobile app UX to the approved 4-screen vision:
- Home / Overview
- Individual Bot
- Bot Strategy Configuration
- Bot Behavior Configuration

And add full per-bot LLM conversation chat on Bot Detail.

## Approved Decisions
- Keep wallet and operational bot actions on Bot Detail.
- Implement full LLM conversation chat (not placeholder/event-log chat).

## Information Architecture

### Primary Mobile Routes
- HomeOverview
- BotDetail
- BotStrategyConfig
- BotBehaviorConfig

### Global Navigation
- Left menu: Home, Docs, Reports, Chat
- Profile menu: Profile, Billing, Settings, Log out

## Screen Specifications

### Home / Overview
- Top KPI strip:
  - Total Bots
  - Total Trades
  - Open Trades
  - Net P&L
- Bot cards:
  - Avatar (top-left)
  - Current P&L (top-right)
  - P&L history chart (interactive)
- Tap card -> BotDetail

### Bot Detail
- Header with bot identity + settings button
- Top chart and current P&L
- Sections:
  - Strategy (tap -> BotStrategyConfig)
  - Trade History
  - Chat History (full LLM conversation)
- Keep:
  - Wallet panel
  - Bot actions (pause/resume/redeploy/destroy)

### Strategy Configuration
- Strategy type + parameters
- Save/apply workflow

### Behavior Configuration
- Behavioral controls (risk tolerance, auto-trade behavior, guardrails, stop rules)
- Save/apply workflow

## Backend/API Work

### New Chat Capability
- Add DB table for per-bot chat messages.
- Add authenticated app-facing endpoints:
  - GET `/v1/bots/:id/chat/messages`
  - POST `/v1/bots/:id/chat/messages`
- On POST:
  - Persist user message.
  - Generate assistant response using bot LLM settings.
  - Persist assistant response.
  - Return both messages.

### Existing Endpoints to Reuse
- GET `/v1/bots`
- GET `/v1/bots/:id`
- PATCH `/v1/bots/:id/config`
- GET `/v1/bots/:id/metrics`
- GET `/v1/bots/:id/events`

## Technical Delivery Phases

### Phase 1: Navigation + Screen Split
- Introduce overview/detail/strategy/behavior route structure.
- Split current mixed settings UI into strategy and behavior screens.

### Phase 2: Home + Detail UX Alignment
- Add overview KPIs.
- Add chart-first bot cards.
- Add top chart + strategy/trade/chat sections on Bot Detail.

### Phase 3: Full Chat
- Add schema + control-plane handlers + routing.
- Extend shared types/api-client.
- Wire mobile chat thread + composer to backend.

### Phase 4: Hardening
- Loading/empty/error states for all new surfaces.
- Basic verification: typecheck/lint/build where available.

## Keep / Add / Simplify Summary

### Keep
- Auth + subscription gating
- Wallet panel
- Bot operational actions
- Offline banner/retry patterns

### Add
- Dedicated strategy + behavior screens
- KPI strip on overview
- Chart-first cards and detail chart
- Full LLM chat

### Simplify
- Reduce oversized mixed-responsibility screens
- Remove/merge unused duplicate abstractions after migration is stable

## Risks
- Chat response quality depends on configured provider/key health.
- Home aggregate KPIs may require additional backend derivation for efficiency later.
- Drawer/profile menu parity may be staged if navigation dependency migration is disruptive.

## Done Criteria
- User can complete:
  - Home -> BotDetail -> StrategyConfig
  - Home -> BotDetail -> BehaviorConfig
  - Home -> BotDetail chat round-trip with persisted conversation
- Overview KPIs and charts render from live data.
- Existing critical capabilities (wallet/actions/auth/subscription) remain functional.
