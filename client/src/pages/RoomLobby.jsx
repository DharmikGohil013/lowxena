import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI, authAPI } from '../services/api';
import './RoomLobby.css';

function RoomLobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomDetails, setRoomDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playerReadyStates, setPlayerReadyStates] = useState({});

  useEffect(() => {
    fetchCurrentUser();
    fetchRoomDetails();
    
    const interval = setInterval(() => {
      fetchRoomDetails();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [roomId]);

  const fetchCurrentUser = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        const response = await authAPI.getProfile(userData.id);
        setCurrentUser(response.data);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const response = await gameAPI.getRoomDetails(roomId);
      setRoomDetails(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching room details:', err);
      setError('Failed to load room details');
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await gameAPI.leaveRoom(roomId);
      navigate('/rooms');
    } catch (err) {
      console.error('Error leaving room:', err);
      alert('Failed to leave room');
    }
  };

  const handleToggleReady = () => {
    if (!currentUser) return;
    
    setPlayerReadyStates(prev => ({
      ...prev,
      [currentUser.id]: !prev[currentUser.id]
    }));
  };

  const handleStartGame = async () => {
    if (!isHost()) return;
    
    // Check if all players are ready
    const allReady = roomDetails.players.every(player => 
      player.id === currentUser.id || playerReadyStates[player.id]
    );
    
    if (!allReady) {
      alert('All players must be ready before starting the game');
      return;
    }
    
    try {
      await gameAPI.startGame(roomId);
      navigate(`/game?roomId=${roomId}`);
    } catch (err) {
      console.error('Error starting game:', err);
      alert('Failed to start game');
    }
  };

  const handleKickPlayer = async (playerId) => {
    if (!isHost()) return;
    
    try {
      await gameAPI.kickPlayer(roomId, playerId);
      fetchRoomDetails();
    } catch (err) {
      console.error('Error kicking player:', err);
      alert('Failed to kick player');
    }
  };

  const isHost = () => {
    return currentUser && roomDetails && currentUser.id === roomDetails.host_id;
  };

  const copyRoomCode = () => {
    if (roomDetails?.room_code) {
      navigator.clipboard.writeText(roomDetails.room_code);
      alert('Room code copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="room-lobby-container">
        <video
          className="video-background"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="https://cdn.pixabay.com/video/2024/11/27/243011_large.mp4" type="video/mp4" />
        </video>
        <div className="loading-message">Loading room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="room-lobby-container">
        <video
          className="video-background"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="https://cdn.pixabay.com/video/2024/11/27/243011_large.mp4" type="video/mp4" />
        </video>
        <div className="error-message">
          <h2>{error}</h2>
          <button onClick={() => navigate('/rooms')}>Back to Rooms</button>
        </div>
      </div>
    );
  }

  return (
    <div className="room-lobby-container">
      <video
        className="video-background"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="https://cdn.pixabay.com/video/2024/11/27/243011_large.mp4" type="video/mp4" />
      </video>

      <div className="room-lobby-content">
        {/* Room Header */}
        <div className="room-lobby-header">
          <button className="back-btn" onClick={handleLeaveRoom}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Leave Room
          </button>
          <div className="room-title">
            <h1>{roomDetails?.room_name}</h1>
            {roomDetails?.is_private && (
              <div className="room-code-display" onClick={copyRoomCode}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17a2 2 0 0 1-2-2c0-1.11.89-2 2-2a2 2 0 0 1 2 2 2 2 0 0 1-2 2m6 3V10H6v10h12m0-12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z"/>
                </svg>
                Code: {roomDetails?.room_code}
                <span className="copy-hint">Click to copy</span>
              </div>
            )}
          </div>
        </div>

        <div className="lobby-main">
          {/* Room Settings */}
          <div className="room-settings-panel">
            <h3>Room Settings</h3>
            <div className="setting-item">
              <span className="setting-label">Max Points:</span>
              <span className="setting-value">{roomDetails?.max_points}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Max Players:</span>
              <span className="setting-value">{roomDetails?.players?.length || 0} / {roomDetails?.max_players}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Room Type:</span>
              <span className="setting-value">{roomDetails?.is_private ? 'Private' : 'Public'}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Status:</span>
              <span className={`setting-value status-${roomDetails?.status}`}>
                {roomDetails?.status === 'waiting' ? 'Waiting for Players' : 'In Game'}
              </span>
            </div>
          </div>

          {/* Players List */}
          <div className="players-panel">
            <h3>Players ({roomDetails?.players?.length || 0}/{roomDetails?.max_players})</h3>
            <div className="players-list">
              {roomDetails?.players?.map((player) => {
                const isPlayerHost = player.id === roomDetails.host_id;
                const isReady = playerReadyStates[player.id];
                const isCurrentPlayer = currentUser && player.id === currentUser.id;

                return (
                  <div 
                    key={player.id} 
                    className={`player-card ${isPlayerHost ? 'host-card' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}
                  >
                    <div className="player-avatar">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {player.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isPlayerHost && (
                        <div className="master-badge">M</div>
                      )}
                    </div>
                    <div className="player-info">
                      <div className="player-name">
                        {player.name}
                        {isCurrentPlayer && <span className="you-label">(You)</span>}
                      </div>
                      <div className="player-role">
                        {isPlayerHost ? 'Master' : 'Member'}
                      </div>
                      {!isPlayerHost && (
                        <div className={`player-status ${isReady ? 'ready' : 'not-ready'}`}>
                          {isReady ? '✓ Ready' : 'Not Ready'}
                        </div>
                      )}
                    </div>
                    {isHost() && !isPlayerHost && (
                      <button 
                        className="kick-btn" 
                        onClick={() => handleKickPlayer(player.id)}
                        title="Kick Player"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="lobby-actions">
          {isHost() ? (
            <button 
              className="start-game-btn" 
              onClick={handleStartGame}
              disabled={roomDetails?.players?.length < 2}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
              Start Game
            </button>
          ) : (
            <button 
              className={`ready-btn ${playerReadyStates[currentUser?.id] ? 'ready' : ''}`}
              onClick={handleToggleReady}
            >
              {playerReadyStates[currentUser?.id] ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Ready
                </>
              ) : (
                'Mark as Ready'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomLobby;
