-- Rooms table to store game room information
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_name VARCHAR(255) NOT NULL,
  room_code VARCHAR(6) UNIQUE,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  max_players INTEGER NOT NULL DEFAULT 8,
  max_points INTEGER NOT NULL DEFAULT 150,
  is_private BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room members table to track players in each room
CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_host BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_room_code ON rooms(room_code);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on rooms tables
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;

-- Rooms policies - Anyone can read waiting rooms
CREATE POLICY "Anyone can read waiting rooms" ON rooms
    FOR SELECT USING (status = 'waiting');

-- Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms" ON rooms
    FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Host can update their own rooms
CREATE POLICY "Host can update own rooms" ON rooms
    FOR UPDATE USING (auth.uid() = host_id);

-- Host can delete their own rooms
CREATE POLICY "Host can delete own rooms" ON rooms
    FOR DELETE USING (auth.uid() = host_id);

-- Room members policies - Anyone can read room members
CREATE POLICY "Anyone can read room members" ON room_members
    FOR SELECT USING (true);

-- Authenticated users can join rooms
CREATE POLICY "Users can join rooms" ON room_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave rooms (delete their membership)
CREATE POLICY "Users can leave rooms" ON room_members
    FOR DELETE USING (auth.uid() = user_id);

-- Host can kick players (delete other memberships)
CREATE POLICY "Host can kick players" ON room_members
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM rooms
            WHERE rooms.id = room_members.room_id
            AND rooms.host_id = auth.uid()
        )
    );
