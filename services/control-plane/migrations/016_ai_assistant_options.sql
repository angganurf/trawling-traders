CREATE TABLE IF NOT EXISTS ai_assistant_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assistant_style persona NOT NULL UNIQUE,
    captain_name TEXT NOT NULL,
    personality_description TEXT NOT NULL,
    image_key TEXT NOT NULL,
    image_path TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO ai_assistant_options (
    assistant_style,
    captain_name,
    personality_description,
    image_key,
    image_path,
    sort_order
)
VALUES
    (
        'beginner',
        'Captain Current',
        'Calm and practical. Explains decisions clearly, protects downside first, and keeps the crew focused on disciplined entries.',
        'trader',
        '/assets/branding/tt-trader-captain.png',
        1
    ),
    (
        'tweaker',
        'Captain Helm',
        'Hands-on and tactical. Watches momentum shifts closely, adjusts quickly, and gives direct, execution-focused guidance.',
        'sea',
        '/assets/branding/tt-sea-captain.png',
        2
    ),
    (
        'quant_lite',
        'Rocky Reef',
        'Signal-driven and analytical. Tracks structure, validates with data, and avoids emotional overtrading during turbulence.',
        'rocky',
        '/assets/branding/tt-rocky-captain.png',
        3
    )
ON CONFLICT (assistant_style) DO UPDATE
SET
    captain_name = EXCLUDED.captain_name,
    personality_description = EXCLUDED.personality_description,
    image_key = EXCLUDED.image_key,
    image_path = EXCLUDED.image_path,
    sort_order = EXCLUDED.sort_order,
    is_active = TRUE,
    updated_at = NOW();
