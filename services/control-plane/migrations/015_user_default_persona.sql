ALTER TABLE users
    ADD COLUMN IF NOT EXISTS default_persona persona;

UPDATE users
SET default_persona = CASE (get_byte(uuid_send(id), 15) % 3)
    WHEN 0 THEN 'beginner'::persona
    WHEN 1 THEN 'tweaker'::persona
    ELSE 'quant_lite'::persona
END
WHERE default_persona IS NULL;
