-- Add is_ready column to room_members table
ALTER TABLE room_members 
ADD COLUMN IF NOT EXISTS is_ready BOOLEAN DEFAULT FALSE;

-- Update existing rows to set is_ready to false
UPDATE room_members SET is_ready = FALSE WHERE is_ready IS NULL;

-- Add policy to allow users to update their own ready status
DROP POLICY IF EXISTS "Users can update own ready status" ON room_members;
CREATE POLICY "Users can update own ready status" ON room_members
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
