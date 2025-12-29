# Ready Status Feature - Setup Instructions

## Problem
The ready button can't be clicked and the play button doesn't show when players are ready.

## Solution

### Step 1: Run SQL Migration in Supabase
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste the contents of `/server/database/SETUP_READY_STATUS.sql`
5. Click "Run" to execute the SQL

### Step 2: Restart Your Server
1. Stop your Node.js server (Ctrl+C in the terminal)
2. Restart it:
   ```bash
   cd server
   npm start
   ```

### Step 3: Test the Feature
1. Create a room as Player A
2. Join the room as Player B in another browser/incognito
3. Player B should see "Mark as Ready" button (clickable)
4. Click it - button should change to "Ready" (green)
5. Player A should see Player B's status change to "✓ Ready"
6. Player A should now see "🎮 Start Game" button (enabled)

### Step 4: Verify in Console
Open browser console (F12) and check for these logs:
- `🔄 Toggling ready status for room: [room-id]`
- `✅ Ready status updated: { isReady: true }`

### Troubleshooting

**If ready button still doesn't work:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check console for errors
3. Verify SQL was run: Check Supabase Table Editor → room_members table → should have `is_ready` column

**If play button doesn't show:**
1. Check browser console for `isHost check:` log
2. Verify all non-host players have `isReady: true`
3. Make sure at least 2 players are in the room

**If errors appear:**
- "Failed to update ready status" → Server needs restart
- "Not in this room" → Rejoin the room
- "Failed to check user room" → Check JWT token in localStorage

## What Changed

### Backend:
- Added `is_ready` column to `room_members` table
- Created `toggleReady` endpoint: `POST /api/game/toggle-ready/:roomId`
- Updated `getRoomDetails` to include `isReady` status for each player
- Added RLS policy for users to update their own ready status

### Frontend:
- Removed local state for ready status
- Ready status now syncs with database (updates every 3 seconds)
- All players can see each other's ready status in real-time
- Start Game button only enables when all non-host players are ready
- Added detailed console logging for debugging

## Files Modified:
- `/server/database/SETUP_READY_STATUS.sql` (NEW)
- `/server/controllers/roomController.js`
- `/server/routes/game.js`
- `/client/src/services/api.js`
- `/client/src/pages/RoomLobby.jsx`
- `/client/src/pages/RoomLobby.css`
