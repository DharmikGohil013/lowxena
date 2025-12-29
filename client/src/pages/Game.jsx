import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { gameAPI } from '../services/api'
import Loader from '../components/Loader'
import './Game.css'

function Game() {
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const [roomDetails, setRoomDetails] = useState(null)
  const navigate = useNavigate()
  const roomId = searchParams.get('roomId')

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails()
    } else {
      setLoading(false)
    }
  }, [roomId])

  const fetchRoomDetails = async () => {
    try {
      const response = await gameAPI.getRoomDetails(roomId)
      console.log('Game room details:', response)
      setRoomDetails(response)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching room details:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return <Loader message="Loading Game..." />
  }

  return (
    <div className="game-container">
      <div className="stars"></div>
      <div className="content">
        <div className="logo-section">
          <img 
            src="/logo.png" 
            alt="LowXena Logo" 
            className="game-logo"
          />
          <h1 className="game-title">LowXena</h1>
        </div>
        
        <div className="game-info">
          {roomId ? (
            <div className="multiplayer-info">
              <h2>🎮 Multiplayer Game</h2>
              <div className="room-info-card">
                <h3>{roomDetails?.roomName}</h3>
                <div className="game-details">
                  <p><strong>Room Status:</strong> {roomDetails?.status}</p>
                  <p><strong>Max Points:</strong> {roomDetails?.maxPoints}</p>
                  <p><strong>Players:</strong> {roomDetails?.players?.length}/{roomDetails?.maxPlayers}</p>
                </div>
                
                <div className="players-in-game">
                  <h4>Players in Game:</h4>
                  <div className="player-list">
                    {roomDetails?.players?.map((player, index) => (
                      <div key={player.id} className="player-item">
                        <div className="player-avatar-small">
                          {player.avatarUrl ? (
                            <img src={player.avatarUrl} alt={player.name} />
                          ) : (
                            <div className="avatar-placeholder-small">
                              {player.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="player-name-small">
                          {player.name}
                          {player.isHost && <span className="host-badge-small">👑</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="temp-game-message">
                  <p>🚧 Game is under development</p>
                  <p>Multiplayer room is ready and working!</p>
                  <button 
                    className="back-to-lobby-btn"
                    onClick={() => navigate(`/room/${roomId}`)}
                  >
                    ← Back to Lobby
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p>Game is loading...</p>
          )}
        </div>
      </div>
      
      <footer className="creator-credit">
        <p>Created by Dharmik Gohil</p>
      </footer>
    </div>
  )
}

export default Game
