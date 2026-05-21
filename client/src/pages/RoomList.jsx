import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameAPI, authAPI } from '../services/api'
import Loader from '../components/Loader'
import './RoomList.css'

function RoomList() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingRooms, setFetchingRooms] = useState(true)
  const [filter, setFilter] = useState('all') // all, public, private
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
  }, [rooms, filter, searchQuery])

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
    let filtered = rooms

    // Filter by type
    if (filter === 'public') {
      filtered = filtered.filter(room => !room.isPrivate)
    } else if (filter === 'private') {
      filtered = filtered.filter(room => room.isPrivate)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(room => 
        room.roomName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredRooms(filtered)
  }

  const handleJoinRoom = (room) => {
    if (room.isPrivate) {
      setSelectedRoom(room)
      setShowJoinModal(true)
    } else {
      joinRoom(room.id)
    }
  }

  const joinRoom = async (roomId, code = null) => {
    setLoading(true)
    setJoiningRoomId(roomId) // Set the room being joined
    try {
      await gameAPI.joinRoom(roomId, code)
      navigate(`/room/${roomId}`)
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
    joinRoom(selectedRoom.id, roomCode)
  }

  return (
    <div className="room-list-container">
      <video 
        className="video-background" 
        autoPlay 
        loop 
        muted 
        playsInline
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
          <button className="back-btn" onClick={() => navigate('/')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"></path>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back
          </button>
          <div className="header-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <h1>Find a Room</h1>
          </div>
          <div className="header-actions">
            <button className="refresh-btn" onClick={fetchRooms}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              Refresh
            </button>
          </div>
        </header>

        <div className="filters-section">
          <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input 
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Rooms ({rooms.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'public' ? 'active' : ''}`}
              onClick={() => setFilter('public')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              Public ({rooms.filter(r => !r.isPrivate).length})
            </button>
            <button 
              className={`filter-btn ${filter === 'private' ? 'active' : ''}`}
              onClick={() => setFilter('private')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Private ({rooms.filter(r => r.isPrivate).length})
            </button>
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
              <div className="no-rooms-glow"></div>
              <div className="no-rooms-content">
                <div className="no-rooms-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                  </svg>
                </div>
                <h3>No Active Lobbies</h3>
                <p>There are currently no active rooms matching your filters. Take the lead and host a custom match for players to join!</p>
                <button 
                  className="create-room-direct-btn"
                  onClick={() => navigate('/', { state: { openCreateRoom: true } })}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  Create Custom Room
                </button>
              </div>
            </div>
          ) : (
            filteredRooms.map(room => (
              <div key={room.id} className="room-card">
                <div className="card-shine"></div>
                <div className="room-card-suit-watermark">
                  {room.isPrivate ? '♠' : '♣'}
                </div>
                
                <div className="room-header">
                  <div className="room-name">
                    {room.isPrivate && <span className="lock-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
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
                  <div className="info-item">
                    <span className="label">Players</span>
                    <span className="value">{room.currentPlayers} / {room.maxPlayers}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Points to Win</span>
                    <span className="value">{room.maxPoints} pts</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Lobby Host</span>
                    <span className="value">{room.hostName || 'Unknown'}</span>
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px', display: 'inline-block', verticalAlign: 'middle'}}>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                      Join with Code
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '6px', display: 'inline-block', verticalAlign: 'middle'}}>
                        <path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      </svg>
                      Join Room
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Join Private Room Modal */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="join-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowJoinModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
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
