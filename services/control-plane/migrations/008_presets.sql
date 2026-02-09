-- Presets: reusable persona/risk profiles for bot creation
CREATE TABLE IF NOT EXISTS presets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    preset_type TEXT NOT NULL DEFAULT 'persona',
    max_position NUMERIC(5,4) NOT NULL DEFAULT 0.08,
    max_daily_loss NUMERIC(5,4) NOT NULL DEFAULT 0.02,
    version     INT NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
