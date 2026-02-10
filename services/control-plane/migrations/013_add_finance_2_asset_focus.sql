-- Add the enum value in its own transaction; it cannot be used until a subsequent transaction.
ALTER TYPE asset_focus ADD VALUE IF NOT EXISTS 'finance_2';
