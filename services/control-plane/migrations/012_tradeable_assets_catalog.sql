CREATE TABLE IF NOT EXISTS tradeable_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_focus asset_focus NOT NULL,
    symbol VARCHAR(32) NOT NULL,
    name VARCHAR(128) NOT NULL,
    token_address VARCHAR(128) NOT NULL UNIQUE,
    decimals INTEGER NOT NULL CHECK (decimals >= 0 AND decimals <= 18),
    custodian VARCHAR(128) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tradeable_assets_focus_active
    ON tradeable_assets(asset_focus, is_active);

INSERT INTO tradeable_assets (asset_focus, symbol, name, token_address, decimals, custodian)
VALUES
    -- Tokenized Stocks
    ('tokenized_equities', 'NVDAr', 'NVIDIA', 'ALTP6gug9wv5mFtx2tSU1YYZ1NrEc2chDdMPoJA8f8pu', 9, 'Remora Markets'),
    ('tokenized_equities', 'TSLAr', 'Tesla', 'FJug3z58gssSTDhVNkTse5fP8GRZzuidf9SRtfB2RhDe', 9, 'Remora Markets'),
    ('tokenized_equities', 'CRCLr', 'Circle', '5fKr9joRHpioriGmMgRVFdmZge8EVUTbrWyxDVdSrcuG', 9, 'Remora Markets'),
    ('tokenized_equities', 'SPYr', 'SP500', 'AVw2QGVkXJPRPRjLAceXVoLqU5DVtJ53mdgMXp14yGit', 9, 'Remora Markets'),
    ('tokenized_equities', 'MSTRr', 'Strategy', 'B8GKqTDGYc7F6udTHjYeazZ4dFCRkrwK2mBQNS4igqTv', 9, 'Remora Markets'),
    ('tokenized_equities', 'ABTx', 'Abbot', 'XsHtf5RpxsQ7jeJ9ivNewouZKJHbPxhPoEy6yYvULr7', 8, 'xStocks'),

    -- Tokenized Metals
    ('tokenized_metals', 'GLDr', 'Gold', 'AEv6xLECJ2KKmwFGX85mHb9S2c2BQE7dqE5midyrXHBb', 9, 'Remora Markets'),
    ('tokenized_metals', 'GOLD', 'Gold', 'GoLDppdjB1vDTPSGxyMJFqdnj134yH6Prg9eqsGDiw6A', 6, 'ORO Finance'),
    ('tokenized_metals', 'SLVr', 'Silver', '7C56WnJ94iEP7YeH2iKiYpvsS5zkcpP9rJBBEBoUGdzj', 9, 'Remora Markets'),
    ('tokenized_metals', 'PPLTr', 'Platinum', 'EtTQ2QRyf33bd6B2uk7nm1nkinrdGKza66EGdjEY4s7o', 9, 'Remora Markets'),
    ('tokenized_metals', 'PALLr', 'Palladium', '9eS6ZsnqNJGGKWq8LqZ95YJLZ219oDuJ1qjsLoKcQkmQ', 9, 'Remora Markets'),
    ('tokenized_metals', 'CPERr', 'Copper', 'C3VLBJB2FhEb47s1WEgroyn3BnSYXaezqtBuu5WNmUGw', 9, 'Remora Markets'),

    -- Crypto Majors
    ('majors', 'BTC', 'Bitcoin', 'zBTCug3er3tLyffELcvDNrKkCymbPWysGcWihESYfLg', 8, 'Zeus Bridge'),
    ('majors', 'BTC', 'Bitcoin', '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', 8, 'Portal Bridge'),
    ('majors', 'BTC', 'Bitcoin', 'cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij', 8, 'Coinbase'),
    ('majors', 'ETH', 'Ethereum', '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', 8, 'Portal Bridge'),
    ('majors', 'SOL', 'Solana', 'So11111111111111111111111111111111111111112', 9, 'Self Custody'),

    -- Meme Coins
    ('memes', 'BONK', 'Bonk', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 5, 'Self Custody'),
    ('memes', 'ORE', 'Ore', 'oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp', 11, 'Self Custody'),
    ('memes', 'SPX6900', 'SPX6900', 'J3NKxxXZcnNiMjKw9hYb2K4LUxgwB6t1FtPtQVsv3KFr', 8, 'Self Custody')
ON CONFLICT (token_address) DO UPDATE
SET
    asset_focus = EXCLUDED.asset_focus,
    symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    decimals = EXCLUDED.decimals,
    custodian = EXCLUDED.custodian,
    is_active = TRUE,
    updated_at = NOW();
