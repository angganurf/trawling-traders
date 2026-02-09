-- Migration: Bot chat history for app-facing LLM conversations

CREATE TABLE IF NOT EXISTS bot_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_chat_messages_bot_created_at
    ON bot_chat_messages(bot_id, created_at);
