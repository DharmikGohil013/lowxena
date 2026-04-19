-- ============================================
-- Race Condition Prevention for Multiplayer
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Atomic stat update function (prevents read-modify-write races)
CREATE OR REPLACE FUNCTION update_user_stats_atomic(
  p_user_id UUID,
  p_won BOOLEAN,
  p_score INTEGER DEFAULT 0,
  p_duration INTEGER DEFAULT 0
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_stats (user_id, total_games, wins, losses, highest_score, total_playtime)
  VALUES (
    p_user_id,
    1,
    CASE WHEN p_won THEN 1 ELSE 0 END,
    CASE WHEN p_won THEN 0 ELSE 1 END,
    p_score,
    p_duration
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_games = user_stats.total_games + 1,
    wins = user_stats.wins + CASE WHEN p_won THEN 1 ELSE 0 END,
    losses = user_stats.losses + CASE WHEN p_won THEN 0 ELSE 1 END,
    highest_score = GREATEST(user_stats.highest_score, p_score),
    total_playtime = user_stats.total_playtime + p_duration;
END;
$$ LANGUAGE plpgsql;

-- 2. Atomic leaderboard upsert
CREATE OR REPLACE FUNCTION upsert_leaderboard_atomic(
  p_user_id UUID,
  p_score INTEGER,
  p_level INTEGER
)
RETURNS void AS $$
BEGIN
  INSERT INTO leaderboard (user_id, score, level)
  VALUES (p_user_id, p_score, p_level)
  ON CONFLICT (user_id)
  DO UPDATE SET
    score = GREATEST(leaderboard.score, p_score),
    level = GREATEST(leaderboard.level, p_level);
END;
$$ LANGUAGE plpgsql;

-- 3. Prevent duplicate room membership
ALTER TABLE room_members
  ADD CONSTRAINT unique_user_per_room UNIQUE (room_id, user_id);

-- 4. Prevent user from being in multiple rooms simultaneously
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_room_per_user
  ON room_members (user_id)
  WHERE true; -- Only one row per user_id allowed

-- 5. Add advisory lock for game state updates
-- Use this in application code: SELECT pg_advisory_xact_lock(hashtext(room_id::text))
-- before updating game_state to prevent concurrent overwrites.
