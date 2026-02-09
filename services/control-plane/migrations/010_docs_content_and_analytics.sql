-- Migration: Managed docs content + docs analytics tracking

CREATE TABLE IF NOT EXISTS docs_categories (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS docs_articles (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES docs_categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content JSONB NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS docs_analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('category_opened', 'article_opened', 'search')),
    category_id TEXT REFERENCES docs_categories(id) ON DELETE SET NULL,
    article_id TEXT REFERENCES docs_articles(id) ON DELETE SET NULL,
    query TEXT,
    results_count INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_articles_category_sort
    ON docs_articles(category_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_docs_analytics_user_created
    ON docs_analytics_events(user_id, created_at DESC);

INSERT INTO docs_categories (id, title, description, sort_order)
VALUES
    ('setup', 'Set Up', 'Everything needed to launch your first bot safely.', 1),
    ('optimization', 'Optimization', 'Tune strategy quality, execution behavior, and monitoring loops.', 2),
    ('support', 'Support', 'Troubleshooting, billing, and account-level operational help.', 3)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();

INSERT INTO docs_articles (id, category_id, title, summary, content, sort_order)
VALUES
    ('get-started', 'setup', 'Get Started', 'Create your account, fund your wallet, and launch your first bot.',
     '["Create your account and complete onboarding so your workspace is initialized.", "Create your first bot from the Home screen and choose a starter strategy.", "Before enabling live trading, review behavior settings for limits and stop conditions."]'::jsonb, 1),
    ('choose-ai-provider', 'setup', 'Choose Your AI Provider', 'Compare providers and select the one that matches your latency and cost goals.',
     '["Pick a provider based on your priorities: speed, cost, or reasoning depth.", "For active intraday strategies, lower latency typically matters more than long-form output.", "Use strategy and behavior settings together so model decisions remain bounded by your risk rules."]'::jsonb, 2),
    ('connect-telegram', 'setup', 'Connect to Telegram', 'Send bot notifications and reports directly to your Telegram channel.',
     '["Generate a Telegram bot token and add your bot to the destination channel.", "Paste the token and channel ID into your bot behavior configuration.", "Run a test alert first to verify delivery before relying on production notifications."]'::jsonb, 3),
    ('improve-signal-quality', 'optimization', 'Improve Signal Quality', 'Reduce noisy entries with better filters and event validation.',
     '["Start with fewer markets and stricter entry criteria to reduce false positives.", "Adjust event filters and confidence thresholds before increasing trade volume.", "Review historical trades weekly and remove rules that create repeated low-quality entries."]'::jsonb, 1),
    ('risk-controls', 'optimization', 'Risk Controls', 'Set hard constraints so AI decisions stay inside your risk envelope.',
     '["Define max position size, daily loss limits, and stop conditions in behavior settings.", "Treat limits as hard controls, not suggestions, and keep them active in all market conditions.", "When testing changes, alter one major setting at a time so impact is measurable."]'::jsonb, 2),
    ('read-pnl-history', 'optimization', 'Read P&L History', 'Use chart trends and event timing to evaluate strategy health.',
     '["Check whether gains come from a consistent pattern or a small number of outlier trades.", "Compare drawdown periods against behavior or strategy changes to find regressions.", "Use reports exports to keep an external audit trail for deeper analysis."]'::jsonb, 3),
    ('troubleshoot-execution', 'support', 'Troubleshoot Trade Execution', 'Diagnose common causes of missed, delayed, or failed orders.',
     '["Check bot event history for rejected signals or guardrail-triggered blocks.", "Confirm API credentials and provider status before changing strategy parameters.", "If failures repeat, lower complexity and validate with one market and tighter controls."]'::jsonb, 1),
    ('billing-and-subscriptions', 'support', 'Billing and Subscriptions', 'Understand plan limits, invoice exports, and renewal timing.',
     '["Use the profile menu to view billing settings and update subscription preferences.", "Track usage against your plan to avoid interruption during high-volume periods.", "Export invoices regularly if your finance workflow requires monthly reconciliation."]'::jsonb, 2),
    ('contact-support', 'support', 'Contact Support', 'What to include so support can resolve issues quickly.',
     '["Include bot name, timestamp, and a short timeline of what happened.", "Attach relevant report exports or event snippets that show the failure clearly.", "For urgent issues, pause affected bots first, then share details with support."]'::jsonb, 3)
ON CONFLICT (id) DO UPDATE
SET category_id = EXCLUDED.category_id,
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    content = EXCLUDED.content,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
