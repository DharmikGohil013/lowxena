# Room & Matchmaking System

Complete implementation of the multiplayer room system for LowXena card game.

## Features

### 1. Custom Room Creation
- Configure max points (100-200)
- Set player count (2-8)
- Private/Public room toggle
- Auto-generated 6-digit room codes for private rooms
- Unique random room names (75,000+ combinations)

### 2. Room Browsing
- View all available rooms
- Filter by: All / Public / Private
- Search by room name
- Real-time updates (auto-refresh every 5 seconds)
- Display: room name, player count, max points, host name

### 3. Room Lobby
- Master (M) badge for host
- Member list with avatars
- Ready/Not Ready status indicators
- Kick player functionality (host only)
- Start game button (host only, requires 2+ players)
- Leave room at any time
- Host transfer on host leave
- Copy room code to clipboard

### 4. Database Schema
- `rooms` table: stores room configuration
- `room_members` table: tracks players in rooms
- Auto-cleanup on player leave
- Room deletion when last player leaves

## File Structure

### Frontend
```
client/src/
├── pages/
│   ├── Home.jsx              # Custom match modal, game mode selection
│   ├── Home.css             # Leaderboard & custom match styles
│   ├── RoomList.jsx         # Browse available rooms
│   ├── RoomList.css         # Room cards & filter styles
│   ├── RoomLobby.jsx        # Room waiting area
│   └── RoomLobby.css        # Player cards & lobby styles
├── utils/
│   └── roomNames.js         # Random room name generator (client)
├── services/
│   └── api.js               # API client with room methods
└── App.jsx                  # Routes: /rooms, /room/:roomId
```

### Backend
```
server/
├── controllers/
│   └── roomController.js    # Room CRUD operations
├── routes/
│   └── game.js             # Room API endpoints
├── database/
│   └── rooms_schema.sql    # Database schema for rooms
└── utils/
    └── roomNames.js        # Random room name generator (server)
```

## API Endpoints

### Public
- `GET /api/game/rooms` - Get all available rooms

### Protected (requires auth token)
- `POST /api/game/create-room` - Create new room
- `GET /api/game/room/:roomId` - Get room details with players
- `POST /api/game/join-room/:roomId` - Join a room
- `POST /api/game/leave-room/:roomId` - Leave a room
- `POST /api/game/start-game/:roomId` - Start game (host only)
- `POST /api/game/kick-player/:roomId` - Kick player (host only)

## Database Setup

Run the SQL schema to create required tables:

```bash
psql -U your_user -d your_database -f server/database/rooms_schema.sql
```

Tables created:
- `rooms` - Room configuration and status
- `room_members` - Player membership tracking

## Usage Flow

1. **Create Room**
   - Click "Create Custom Game" on home page
   - Configure settings with sliders
   - Toggle Private/Public
   - Click "Create Room"
   - Redirected to room lobby

2. **Find Room**
   - Click "Find Room" on home page
   - Browse available rooms
   - Use filters: All/Public/Private
   - Search by room name
   - Click "Join" on a room
   - Enter code if private

3. **Room Lobby**
   - Wait for players to join
   - Host can kick players
   - Members mark as ready
   - Host starts game when all ready
   - Anyone can leave room

4. **Game Start**
   - Host clicks "Start Game"
   - Validates 2+ players present
   - Updates room status to "playing"
   - Navigates to game page

## Room Name Generator

Generates unique room names with format: `[Adjective] [Noun] [Suffix]`

Examples:
- "Swift Dragon Arena"
- "Mystic Phoenix Citadel"
- "Blazing Thunder Fortress"

**Combinations**: 50 adjectives × 50 nouns × 30 suffixes = **75,000 unique names**

Includes fallback numbering for duplicates: "Swift Dragon Arena 2"

## Components

### RoomList Component
- Fetches rooms from API
- Auto-refreshes every 5 seconds
- Filter and search functionality
- Private room code modal
- Join room validation

### RoomLobby Component
- Real-time player list updates
- Master/Member role display
- Avatar support
- Ready status tracking
- Host controls (kick, start)
- Room settings panel

## Styling

All components use:
- Animated gradient backgrounds
- Glassmorphism effects
- Purple-pink-blue color scheme
- Responsive design (mobile-friendly)
- Smooth transitions and hover effects

## Security

- JWT authentication for all room operations
- Room code validation for private rooms
- Host-only actions (kick, start game)
- Prevents joining multiple rooms simultaneously
- Auto-cleanup on disconnect

## Future Enhancements

- WebSocket integration for real-time updates
- Chat system in room lobby
- Invite links for private rooms
- Room history and statistics
- Custom room themes/backgrounds
- Spectator mode
- Tournament brackets

## Testing

1. Create a room as user A
2. Join with user B
3. Test ready status
4. Test kick functionality
5. Test host transfer on leave
6. Test private room codes
7. Test search and filters

## Notes

- Rooms auto-delete when empty
- Host is transferred to next player when leaving
- Maximum 8 players per room
- Points range: 100-200
- Room codes are 6 digits
- Room names are guaranteed unique
