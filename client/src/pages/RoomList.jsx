import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { gameAPI, authAPI } from '../services/api'
import './RoomList.css'

function RoomList() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, public, private
  const [searchQuery, setSearchQuery] = useState('')
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [roomCode, setRoomCode] = useState('')

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
      if (response.success && response.rooms) {
        setRooms(response.rooms)
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const applyFilters = () => {
    let filtered = rooms

    // Filter by type
    if (filter === 'public') {
      filtered = filtered.filter(room => !room.is_private)
    } else if (filter === 'private') {
      filtered = filtered.filter(room => room.is_private)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(room => 
        room.room_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredRooms(filtered)
  }

  const handleJoinRoom = (room) => {
    if (room.is_private) {
      setSelectedRoom(room)
      setShowJoinModal(true)
    } else {
      joinRoom(room.id)
    }
  }

  const joinRoom = async (roomId, code = null) => {
    setLoading(true)
    try {
      const response = await gameAPI.joinRoom(roomId, code)
      if (response.success) {
        navigate(`/room/${roomId}`)
      } else {
        alert(response.message || 'Failed to join room')
      }
    } catch (error) {
      console.error('Error joining room:', error)
      alert('Failed to join room')
    } finally {
      setLoading(false)
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

      <div className="room-list-content">
        <header className="room-list-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Back
          </button>
          <h1>🎮 Find a Room</h1>
          <div className="header-actions">
            <button className="refresh-btn" onClick={fetchRooms}>
              🔄 Refresh
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
              🌐 Public ({rooms.filter(r => !r.is_private).length})
            </button>
            <button 
              className={`filter-btn ${filter === 'private' ? 'active' : ''}`}
              onClick={() => setFilter('private')}
            >
              🔒 Private ({rooms.filter(r => r.is_private).length})
            </button>
          </div>
        </div>

        <div className="rooms-grid">
          {filteredRooms.length === 0 ? (
            <div className="no-rooms">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
              <h3>No rooms found</h3>
              <p>Try adjusting your filters or create a new room</p>
            </div>
          ) : (
            filteredRooms.map(room => (
              <div key={room.id} className="room-card">
                <div className="room-header">
                  <div className="room-name">
                    {room.is_private && <span className="lock-icon">🔒</span>}
                    <h3>{room.room_name}</h3>
                  </div>
                  <div className={`room-status ${room.status}`}>
                    {room.status === 'waiting' ? '⏳ Waiting' : '🎮 Playing'}
                  </div>
                </div>

                <div className="room-info">
                  <div className="info-item">
                    <span className="label">Players:</span>
                    <span className="value">{room.current_players}/{room.max_players}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Max Points:</span>
                    <span className="value">{room.max_points}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Host:</span>
                    <span className="value">{room.host_name || 'Unknown'}</span>
                  </div>
                </div>

                <button 
                  className="join-room-btn"
                  onClick={() => handleJoinRoom(room)}
                  disabled={room.current_players >= room.max_players || room.status === 'playing'}
                >
                  {room.current_players >= room.max_players ? 'Room Full' : 
                   room.status === 'playing' ? 'Game Started' : 
                   room.is_private ? '🔐 Join with Code' : '✓ Join Room'}
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
            <h2>🔒 Enter Room Code</h2>
            <p>This is a private room. Please enter the 6-digit code to join.</p>
            
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
    </div>
  )
}

export default RoomList
