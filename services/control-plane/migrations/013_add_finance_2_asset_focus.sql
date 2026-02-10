DO $$
BEGIN
    ALTER TYPE asset_focus ADD VALUE IF NOT EXISTS 'finance_2';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO tradeable_assets (asset_focus, symbol, name, token_address, decimals, custodian)
VALUES
    ('finance_2', 'JUP', 'Jupiter', 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', 6, 'Self Custody'),
    ('finance_2', 'JTO', 'Jito', 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', 9, 'Self Custody'),
    ('finance_2', 'PYTH', 'Pyth Network', 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', 6, 'Self Custody')
ON CONFLICT (token_address) DO UPDATE
SET
    asset_focus = EXCLUDED.asset_focus,
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    decimals = EXCLUDED.decimals,
    custodian = EXCLUDED.custodian,
    is_active = TRUE,
    updated_at = NOW();
