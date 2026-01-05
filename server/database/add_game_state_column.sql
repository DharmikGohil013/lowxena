-- Add game_state column to rooms table for game synchronization
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS game_state JSONB DEFAULT '{}'::jsonb;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_rooms_game_state ON rooms USING gin (game_state);

-- Add comment
COMMENT ON COLUMN rooms.game_state IS 'Stores current game state including turn info, countdown timestamp, and game progress';
