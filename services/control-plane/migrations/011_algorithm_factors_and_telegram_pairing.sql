-- Migration: 011_algorithm_factors_and_telegram_pairing.sql
-- Purpose:
-- 1) Store weighted algorithm-factor configuration for bot versions
-- 2) Store Telegram pairing metadata in OpenClaw config

ALTER TABLE config_versions
ADD COLUMN IF NOT EXISTS algorithm_factors JSONB;

ALTER TABLE bot_openclaw_config
ADD COLUMN IF NOT EXISTS telegram_user_id TEXT;

ALTER TABLE bot_openclaw_config
ADD COLUMN IF NOT EXISTS encrypted_telegram_pairing_code TEXT;

COMMENT ON COLUMN config_versions.algorithm_factors IS
'Optional weighted algorithm factors for linear model style strategy builder.';

COMMENT ON COLUMN bot_openclaw_config.telegram_user_id IS
'Telegram user id linked to this bot (non-secret).';

COMMENT ON COLUMN bot_openclaw_config.encrypted_telegram_pairing_code IS
'AES-256-GCM encrypted Telegram pairing code shared during setup.';
