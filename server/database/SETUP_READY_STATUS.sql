-- ============================================
-- RUN THIS IN YOUR SUPABASE SQL EDITOR
-- ============================================
-- This script adds the ready status feature to room_members table

-- 1. Add is_ready column to room_members table
ALTER TABLE room_members 
ADD COLUMN IF NOT EXISTS is_ready BOOLEAN DEFAULT FALSE;

-- 2. Update existing rows to set is_ready to false
UPDATE room_members SET is_ready = FALSE WHERE is_ready IS NULL;

-- 3. Drop existing update policy if exists
DROP POLICY IF EXISTS "Users can update own ready status" ON room_members;

-- 4. Create policy to allow users to update their own ready status
CREATE POLICY "Users can update own ready status" ON room_members
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'room_members' AND column_name = 'is_ready';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
-- ✅ Ready status feature added successfully!
-- Next steps:
-- 1. Restart your Node.js server
-- 2. Test the ready button in the room lobby
-- 3. Verify all players can see each other's ready status
