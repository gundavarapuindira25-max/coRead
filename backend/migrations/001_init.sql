-- CoRead Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    name        VARCHAR(255) NOT NULL,
    avatar_url  TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Books
CREATE TABLE IF NOT EXISTS books (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_book_id VARCHAR(255) UNIQUE,
    title          VARCHAR(500) NOT NULL,
    author         VARCHAR(500) NOT NULL,
    cover_url      TEXT,
    description    TEXT,
    total_chapters INTEGER DEFAULT 20,
    created_at     TIMESTAMP DEFAULT NOW()
);

-- Clubs
CREATE TABLE IF NOT EXISTS clubs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(255) NOT NULL,
    book_id      UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    created_by   UUID NOT NULL REFERENCES users(id),
    next_session TIMESTAMP,
    created_at   TIMESTAMP DEFAULT NOW()
);

-- Club Memberships
CREATE TABLE IF NOT EXISTS club_memberships (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id   UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin  BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(club_id, user_id)
);

-- User Reading Progress
CREATE TABLE IF NOT EXISTS user_progress (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id        UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    chapters_read  INTEGER DEFAULT 0,
    updated_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, club_id)
);

-- Highlights
CREATE TABLE IF NOT EXISTS highlights (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id     UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    page_number INTEGER,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Highlight Likes
CREATE TABLE IF NOT EXISTS highlight_likes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    highlight_id UUID NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    UNIQUE(user_id, highlight_id)
);

-- Discussion Messages
CREATE TABLE IF NOT EXISTS messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id    UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_memberships_user     ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_club     ON club_memberships(club_id);
CREATE INDEX IF NOT EXISTS idx_messages_club_time   ON messages(club_id, created_at);
CREATE INDEX IF NOT EXISTS idx_highlights_club      ON highlights(club_id);
CREATE INDEX IF NOT EXISTS idx_progress_club        ON user_progress(club_id);
