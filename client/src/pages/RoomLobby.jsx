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
      const userData = JSON.parse(localStorage.getItem('userData'));
      console.log('User from localStorage:', userData);
      if (userData) {
        setCurrentUser(userData);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchRoomDetails = async () => {
    try {
      const response = await gameAPI.getRoomDetails(roomId);
      console.log('Room details response:', response);
      
      // Check if game has started and navigate all players to game page
      if (response.status === 'playing') {
        console.log('🎮 Game has started! Navigating to game page...');
        navigate(`/game?roomId=${roomId}`);
        return;
      }
      
      setRoomDetails(response);
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

  const handleToggleReady = async () => {
    if (!currentUser) return;
    
    try {
      console.log('🔄 Toggling ready status for room:', roomId);
      const response = await gameAPI.toggleReady(roomId);
      console.log('✅ Ready status updated:', response);
      // Refresh room details to show updated ready status
      await fetchRoomDetails();
    } catch (err) {
      console.error('❌ Error toggling ready:', err);
      alert('Failed to update ready status. Please refresh the page.');
    }
  };

  const handleStartGame = async () => {
    if (!isHost()) return;
    
    // Check minimum player count
    if (roomDetails?.players?.length < 2) {
      alert('Need at least 2 players to start the game');
      return;
    }
    
    // Check if all non-host players are ready
    const nonHostPlayers = roomDetails.players.filter(p => p.id !== roomDetails.hostId);
    const allReady = nonHostPlayers.every(p => p.isReady);
    
    if (!allReady && nonHostPlayers.length > 0) {
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
    const result = currentUser && roomDetails && currentUser.id === roomDetails.hostId;
    console.log('🔍 isHost check:', {
      currentUserId: currentUser?.id,
      currentUserIdType: typeof currentUser?.id,
      hostId: roomDetails?.hostId,
      hostIdType: typeof roomDetails?.hostId,
      areEqual: currentUser?.id === roomDetails?.hostId,
      isHost: result,
      currentUser: currentUser,
      roomDetails: roomDetails
    });
    return result;
  };

  const copyRoomCode = () => {
    if (roomDetails?.roomCode) {
      navigator.clipboard.writeText(roomDetails.roomCode);
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
            <h1>{roomDetails?.roomName}</h1>
            {roomDetails?.isPrivate && (
              <div className="room-code-display" onClick={copyRoomCode}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17a2 2 0 0 1-2-2c0-1.11.89-2 2-2a2 2 0 0 1 2 2 2 2 0 0 1-2 2m6 3V10H6v10h12m0-12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h1V6a5 5 0 0 1 5-5 5 5 0 0 1 5 5v2h1m-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z"/>
                </svg>
                Code: {roomDetails?.roomCode}
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
              <span className="setting-value">{roomDetails?.maxPoints}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Max Players:</span>
              <span className="setting-value">{roomDetails?.players?.length || 0} / {roomDetails?.maxPlayers}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Room Type:</span>
              <span className="setting-value">{roomDetails?.isPrivate ? 'Private' : 'Public'}</span>
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
            <h3>Players ({roomDetails?.players?.length || 0}/{roomDetails?.maxPlayers})</h3>
            <div className="players-list">
              {roomDetails?.players?.map((player) => {
                const isPlayerHost = player.id === roomDetails.hostId;
                const isCurrentPlayer = currentUser && player.id === currentUser.id;

                return (
                  <div 
                    key={player.id} 
                    className={`player-card ${isPlayerHost ? 'host-card' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}
                  >
                    <div className="player-avatar">
                      {player.avatarUrl ? (
                        <img src={player.avatarUrl} alt={player.name} />
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
                        <div className={`player-status ${player.isReady ? 'ready' : 'not-ready'}`}>
                          {player.isReady ? '✓ Ready' : 'Not Ready'}
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
            <>
              {roomDetails?.players?.length < 2 ? (
                <button 
                  className="start-game-btn disabled" 
                  disabled
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Waiting for Players...
                </button>
              ) : (() => {
                const nonHostPlayers = roomDetails.players.filter(p => p.id !== roomDetails.hostId);
                const allReady = nonHostPlayers.every(p => p.isReady);
                return allReady ? (
                  <button 
                    className="start-game-btn" 
                    onClick={handleStartGame}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    🎮 Start Game
                  </button>
                ) : (
                  <button 
                    className="start-game-btn disabled" 
                    disabled
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                    Waiting for Players to Ready...
                  </button>
                );
              })()}
            </>
          ) : (
            <>
              {(() => {
                const currentPlayerData = roomDetails?.players?.find(p => p.id === currentUser?.id);
                const isReady = currentPlayerData?.isReady || false;
                return (
                  <button 
                    className={`ready-btn ${isReady ? 'ready' : ''}`}
                    onClick={handleToggleReady}
                  >
                    {isReady ? (
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
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default RoomLobby;
