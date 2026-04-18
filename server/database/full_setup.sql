-- ============================================
-- LowXena FULL Database Setup
-- Run this in Supabase SQL Editor in ONE go
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP EXISTING TABLES (order matters for foreign keys)
-- ============================================
DROP TABLE IF EXISTS room_members CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS game_history CASCADE;
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS game_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    birthdate DATE,
    username VARCHAR(100),
    is_guest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- 2. USER STATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_stats (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    total_games INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    highest_score INTEGER DEFAULT 0,
    total_playtime INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- ============================================
-- 3. GAME HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS game_history (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    level INTEGER NOT NULL,
    duration INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON game_history(created_at DESC);

-- ============================================
-- 4. LEADERBOARD TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leaderboard (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    level INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);

-- ============================================
-- 5. GAME SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS game_settings (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    difficulty VARCHAR(50) DEFAULT 'normal',
    sound_enabled BOOLEAN DEFAULT TRUE,
    music_enabled BOOLEAN DEFAULT TRUE,
    max_players INTEGER DEFAULT 100,
    game_version VARCHAR(20) DEFAULT '1.0.0',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO game_settings (difficulty, sound_enabled, music_enabled, max_players, game_version)
VALUES ('normal', TRUE, TRUE, 100, '1.0.0')
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. ROOMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    room_name VARCHAR(255) NOT NULL,
    room_code VARCHAR(6) UNIQUE,
    host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_players INTEGER NOT NULL DEFAULT 8,
    max_points INTEGER NOT NULL DEFAULT 150,
    is_private BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    game_state JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_rooms_game_state ON rooms USING gin (game_state);

-- ============================================
-- 7. ROOM MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS room_members (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_host BOOLEAN DEFAULT FALSE,
    is_ready BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);

-- ============================================
-- 8. TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. ROW LEVEL SECURITY
-- ============================================

-- Disable RLS on all tables so the service_role key has full access
-- (Your server uses service_role key, not user JWTs)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (your server uses this key)
-- These policies allow the server to do everything it needs

-- Users table
DROP POLICY IF EXISTS "Service role full access on users" ON users;
CREATE POLICY "Service role full access on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- User stats
DROP POLICY IF EXISTS "Service role full access on user_stats" ON user_stats;
CREATE POLICY "Service role full access on user_stats" ON user_stats FOR ALL USING (true) WITH CHECK (true);

-- Game history
DROP POLICY IF EXISTS "Service role full access on game_history" ON game_history;
CREATE POLICY "Service role full access on game_history" ON game_history FOR ALL USING (true) WITH CHECK (true);

-- Leaderboard
DROP POLICY IF EXISTS "Service role full access on leaderboard" ON leaderboard;
CREATE POLICY "Service role full access on leaderboard" ON leaderboard FOR ALL USING (true) WITH CHECK (true);

-- Game settings
DROP POLICY IF EXISTS "Service role full access on game_settings" ON game_settings;
CREATE POLICY "Service role full access on game_settings" ON game_settings FOR ALL USING (true) WITH CHECK (true);

-- Rooms
DROP POLICY IF EXISTS "Service role full access on rooms" ON rooms;
CREATE POLICY "Service role full access on rooms" ON rooms FOR ALL USING (true) WITH CHECK (true);

-- Room members
DROP POLICY IF EXISTS "Service role full access on room_members" ON room_members;
CREATE POLICY "Service role full access on room_members" ON room_members FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- DONE! Restart your server now.
-- ============================================
