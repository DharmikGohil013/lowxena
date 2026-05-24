import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { gameAPI, authAPI } from '../services/api'
import Loader from '../components/Loader'
import { 
  Search, Zap, Plus, RefreshCw, Users, Lock, Globe, ArrowLeft,
  AlertTriangle, Crown, Hash, X, Trophy, LogIn
} from 'lucide-react'
import './RoomList.css'

function RoomList() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingRooms, setFetchingRooms] = useState(true)
  const [filter, setFilter] = useState('all') // all, public, private
  const [statusFilter, setStatusFilter] = useState('all') // all, waiting, playing
  const [sortBy, setSortBy] = useState('newest') // newest, players_high, players_low, points_high, points_low
  const [searchQuery, setSearchQuery] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomCode, setRoomCode] = useState('')
  const [joiningRoomId, setJoiningRoomId] = useState(null) // Track which room is being joined

  useEffect(() => {
    fetchRooms()
    const interval = setInterval(fetchRooms, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [rooms, filter, statusFilter, sortBy, searchQuery])

  const fetchRooms = async () => {
    try {
      const response = await gameAPI.getRooms()
      setRooms(Array.isArray(response) ? response : [])
    } catch (error) {
      console.error('Error fetching rooms:', error)
      setRooms([])
    } finally {
      setFetchingRooms(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...rooms]

    // Filter by type (public/private)
    if (filter === 'public') {
      filtered = filtered.filter(room => !room.isPrivate)
    } else if (filter === 'private') {
      filtered = filtered.filter(room => room.isPrivate)
    }

    // Filter by status (waiting/playing)
    if (statusFilter === 'waiting') {
      filtered = filtered.filter(room => room.status === 'waiting')
    } else if (statusFilter === 'playing') {
      filtered = filtered.filter(room => room.status === 'playing')
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(room => 
        room.roomName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (room.hostName && room.hostName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Sort rooms
    if (sortBy === 'newest') {
      filtered.sort((a, b) => b.id - a.id)
    } else if (sortBy === 'players_high') {
      filtered.sort((a, b) => (b.currentPlayers || 0) - (a.currentPlayers || 0))
    } else if (sortBy === 'players_low') {
      filtered.sort((a, b) => (a.currentPlayers || 0) - (b.currentPlayers || 0))
    } else if (sortBy === 'points_high') {
      filtered.sort((a, b) => (b.maxPoints || 0) - (a.maxPoints || 0))
    } else if (sortBy === 'points_low') {
      filtered.sort((a, b) => (a.maxPoints || 0) - (b.maxPoints || 0))
    }

    setFilteredRooms(filtered)
  }

  const handleQuickJoin = async () => {
    const joinableRoom = rooms.find(
      room => !room.isPrivate && room.status === 'waiting' && (room.currentPlayers < room.maxPlayers)
    );

    if (joinableRoom) {
      joinRoom(joinableRoom.id, joinableRoom.roomName);
    } else {
      alert("No open public rooms waiting for players were found. Take the lead and host one!");
    }
  };

  const handleJoinRoom = (room) => {
    if (room.isPrivate) {
      setSelectedRoom(room)
      setShowJoinModal(true)
    } else {
      joinRoom(room.id, room.roomName)
    }
  }

  const joinRoom = async (roomId, roomName, code = null) => {
    setLoading(true)
    setJoiningRoomId(roomId) // Set the room being joined
    try {
      await gameAPI.joinRoom(roomId, code)
      const roomSlug = roomName ? roomName.toLowerCase().replace(/\s+/g, '-') : roomId;
      navigate(`/room/${roomSlug}`)
    } catch (error) {
      console.error('Error joining room:', error)
      alert(error.error || 'Failed to join room')
    } finally {
      setLoading(false)
      setJoiningRoomId(null) // Clear joining state
      setShowJoinModal(false)
      setRoomCode('')
    }
  }

  const handleJoinWithCode = () => {
    if (!roomCode || roomCode.length !== 6) {
      alert('Please enter a valid 6-digit room code')
      return
    }
    joinRoom(selectedRoom.id, selectedRoom.roomName, roomCode)
  }

  return (
    <div className="room-list-container">
      <video
        className="video-background"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/background.jpg"
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Decorative background suits */}
      <div className="rl-deco-suits">
        <span className="rl-suit rl-suit-1">♠</span>
        <span className="rl-suit rl-suit-2">♥</span>
        <span className="rl-suit rl-suit-3">♦</span>
        <span className="rl-suit rl-suit-4">♣</span>
      </div>

      <div className="room-list-content">
        <header className="room-list-header">
          <Link className="back-btn" to="/">
            <ArrowLeft size={18} />
            Back
          </Link>
          
          <div className="header-title">
            <Search size={24} />
            <h1>Find a Room</h1>
          </div>
          
          <div className="header-actions">
            <button className="quick-join-header-btn" onClick={handleQuickJoin}>
              <Zap size={16} />
              Quick Join
            </button>
            <button className="host-match-header-btn" onClick={() => navigate('/', { state: { openCreateRoom: true } })}>
              <Plus size={16} />
              Host Match
            </button>
            <button className="refresh-btn" onClick={fetchRooms}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </header>

        {/* Live Statistics Dashboard Grid */}
        <div className="lobby-stats-grid">
          <div className="lobby-stat-card players-online">
            <div className="stat-glow"></div>
            <div className="stat-icon">
              <Users size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Players Online</span>
              <h2 className="stat-value">{rooms.reduce((acc, r) => acc + (r.currentPlayers || 0), 0)}</h2>
            </div>
            <div className="stat-badge online">LIVE</div>
          </div>

          <div className="lobby-stat-card open-lobbies">
            <div className="stat-glow"></div>
            <div className="stat-icon">
              <Hash size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Open Lobbies</span>
              <h2 className="stat-value">{rooms.filter(r => r.status === 'waiting').length}</h2>
            </div>
            <div className="stat-badge waiting">WAITING</div>
          </div>

          <div className="lobby-stat-card private-rooms">
            <div className="stat-glow"></div>
            <div className="stat-icon">
              <Lock size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Private Rooms</span>
              <h2 className="stat-value">{rooms.filter(r => r.isPrivate).length}</h2>
            </div>
            <div className="stat-badge private">SECURE</div>
          </div>

          <div className="lobby-stat-card match-rate">
            <div className="stat-glow"></div>
            <div className="stat-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Match Start Rate</span>
              <h2 className="stat-value">
                {rooms.length > 0 ? Math.round((rooms.filter(r => r.status === 'playing').length / rooms.length) * 100) : 0}%
              </h2>
            </div>
            <div className="stat-badge playing">ACTIVE</div>
          </div>
        </div>

        <div className="filters-section">
          <div className="filters-top-row">
            <div className="search-bar">
              <Search size={20} />
              <input 
                type="text"
                placeholder="Search by room name or host..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="sort-selector-wrapper">
              <label htmlFor="room-sort">Sort By</label>
              <select 
                id="room-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-dropdown"
              >
                <option value="newest">Recently Created</option>
                <option value="players_high">Players: High to Low</option>
                <option value="players_low">Players: Low to High</option>
                <option value="points_high">Points: High to Low</option>
                <option value="points_low">Points: Low to High</option>
              </select>
            </div>
          </div>

          <div className="filters-bottom-row">
            <div className="filter-group">
              <span className="filter-group-label">Visibility</span>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All ({rooms.length})
                </button>
                <button 
                  className={`filter-btn ${filter === 'public' ? 'active' : ''}`}
                  onClick={() => setFilter('public')}
                >
                  <Globe size={14} />
                  Public ({rooms.filter(r => !r.isPrivate).length})
                </button>
                <button 
                  className={`filter-btn ${filter === 'private' ? 'active' : ''}`}
                  onClick={() => setFilter('private')}
                >
                  <Lock size={14} />
                  Private ({rooms.filter(r => r.isPrivate).length})
                </button>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-group-label">Status</span>
              <div className="filter-buttons">
                <button 
                  className={`filter-btn status-all ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All Statuses
                </button>
                <button 
                  className={`filter-btn status-waiting ${statusFilter === 'waiting' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('waiting')}
                >
                  <span className="status-dot pulsing"></span>
                  Waiting ({rooms.filter(r => r.status === 'waiting').length})
                </button>
                <button 
                  className={`filter-btn status-playing ${statusFilter === 'playing' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('playing')}
                >
                  <span className="status-dot playing"></span>
                  In-Game ({rooms.filter(r => r.status === 'playing').length})
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rooms-grid">
          {fetchingRooms ? (
            <div className="loading-rooms">
              <div className="spinner-large"></div>
              <h3>Loading rooms...</h3>
              <p>Please wait while we fetch available rooms</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="no-rooms-card">
              <div className="no-rooms-content">
                <h3>Lobby Radar Scanning...</h3>
                <p>No active rooms match your current filters. Take the lead by hosting a custom match, practice against advanced AI, or clear your filters to find other decks!</p>
                
                <div className="no-rooms-actions">
                  <button 
                    className="create-room-direct-btn"
                    onClick={() => navigate('/', { state: { openCreateRoom: true } })}
                  >
                    <Plus size={18} />
                    Host Custom Match
                  </button>
                  
                  <button 
                    className="practice-mode-direct-btn"
                    onClick={() => navigate('/practice')}
                  >
                    <Zap size={18} />
                    Play vs AI (Practice)
                  </button>
                  
                  {(filter !== 'all' || statusFilter !== 'all' || searchQuery !== '') && (
                    <button 
                      className="reset-filters-btn"
                      onClick={() => {
                        setFilter('all');
                        setStatusFilter('all');
                        setSearchQuery('');
                        setSortBy('newest');
                      }}
                    >
                      <RefreshCw size={16} />
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            filteredRooms.map(room => {
              const seatsArray = Array.from({ length: room.maxPlayers }, (_, i) => i < room.currentPlayers);
              return (
                <div key={room.id} className={`room-card card-status-${room.status} ${room.isPrivate ? 'card-private' : 'card-public'}`}>
                  <div className="card-shine"></div>
                  <div className="room-card-suit-watermark">
                    {room.isPrivate ? '♠' : room.status === 'playing' ? '♥' : '♣'}
                  </div>
                  
                  <div className="room-header">
                    <div className="room-name">
                      {room.isPrivate && <span className="lock-icon">
                      <Lock size={14} className="lock-icon" />
                      </span>}
                      <h3>{room.roomName}</h3>
                    </div>
                    <div className={`room-status ${room.status}`}>
                      {room.status === 'waiting' ? (
                        <><span className="status-dot pulsing"></span> Waiting</>
                      ) : (
                        <><span className="status-dot playing"></span> Playing</>
                      )}
                    </div>
                  </div>

                  <div className="room-info">
                    {/* Visual Seats Grid */}
                    <div className="info-item seats-info-item">
                      <span className="label">Occupied Seats</span>
                      <div className="seats-visualizer">
                        {seatsArray.map((occupied, idx) => (
                          <span 
                            key={idx} 
                            className={`seat-dot ${occupied ? 'occupied' : 'vacant'}`}
                            title={occupied ? "Occupied Slot" : "Empty Slot"}
                          ></span>
                        ))}
                        <span className="seats-text">{room.currentPlayers} / {room.maxPlayers}</span>
                      </div>
                    </div>

                    <div className="info-item">
                      <span className="label">Points to Win</span>
                      <span className="value game-chip-pts">
                        <Trophy size={12} style={{marginRight: '4px', display:'inline', verticalAlign:'-1px'}} />
                        {room.maxPoints} pts
                      </span>
                    </div>

                    <div className="info-item host-info-item">
                      <span className="label">Lobby Host</span>
                      <span className="value host-name-badge">
                        <Crown size={12} style={{marginRight: '4px', display:'inline', verticalAlign:'-1px'}} />
                        {room.hostName || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <button 
                    className="join-room-btn"
                    onClick={() => handleJoinRoom(room)}
                    disabled={room.currentPlayers >= room.maxPlayers || room.status === 'playing'}
                  >
                    {room.currentPlayers >= room.maxPlayers ? (
                      'Room Full'
                    ) : room.status === 'playing' ? (
                      'Game Started'
                    ) : room.isPrivate ? (
                      <>
                        <Lock size={14} style={{marginRight: '6px', display: 'inline-block', verticalAlign: 'middle'}} />
                        Join with Code
                      </>
                    ) : (
                      <>
                        <LogIn size={14} style={{marginRight: '6px', display: 'inline-block', verticalAlign: 'middle'}} />
                        Join Room
                      </>
                    )}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Join Private Room Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="join-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowJoinModal(false)}>
              <X size={24} />
            </div>
            <h2>Enter Room Code</h2>
            <p>This room is private. Enter the 6-digit code to join.</p>
            
            <input
              type="text"
              className="code-input"
              placeholder="000000"
              maxLength="6"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            />

            <button 
              className="submit-code-btn"
              onClick={handleJoinWithCode}
              disabled={loading || roomCode.length !== 6}
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        </div>
      )}

      {/* Show loader when joining a room */}
      {joiningRoomId && (
        <Loader message="Joining room... Please wait!" />
      )}
    </div>
  )
}

export default RoomList
