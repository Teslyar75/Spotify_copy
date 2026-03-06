-- ============================================
-- Spotify Clone — Recommendations Service
-- Отдельная БД (НЕ входит в основную)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE recommendations (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL,
    content_id   UUID NOT NULL,  -- id трека (track)
    score        FLOAT NOT NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id);
CREATE INDEX idx_recommendations_generated ON recommendations(generated_at DESC);
