import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gameAPI, authAPI } from '../services/api';
import Loader from '../components/Loader';
import { AvatarSVG, isAvatarSVG } from '../components/Avatars';
import { ArrowLeft, Copy, Play, Check, X, Crown, Award, Users, Lock, Globe, AlertTriangle } from 'lucide-react';
import './RoomLobby.css';

function RoomLobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomDetails, setRoomDetails] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leavingRoom, setLeavingRoom] = useState(false);
  const [togglingReady, setTogglingReady] = useState(false); // Track ready toggle loading
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
      
      // Check if game has started and navigate all players to game page
      if (response.status === 'playing') {
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
    setLeavingRoom(true);
    try {
      await gameAPI.leaveRoom(roomId);
      navigate('/rooms');
    } catch (err) {
      console.error('Error leaving room:', err);
      alert('Failed to leave room');
      setLeavingRoom(false);
    }
  };

  const handleToggleReady = async () => {
    if (!currentUser || togglingReady) return;
    
    setTogglingReady(true); // Start loading
    try {
      const response = await gameAPI.toggleReady(roomId);
      // Refresh room details to show updated ready status
      await fetchRoomDetails();
    } catch (err) {
      console.error('❌ Error toggling ready:', err);
      alert('Failed to update ready status. Please refresh the page.');
    } finally {
      setTogglingReady(false); // Stop loading
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
    return result;
  };

  const copyRoomCode = () => {
    if (roomDetails?.roomCode) {
      navigator.clipboard.writeText(roomDetails.roomCode);
      alert('Room code copied to clipboard!');
    }
  };

  const renderAvatar = (avatarUrl, name = '') => {
    if (isAvatarSVG(avatarUrl)) {
      return <AvatarSVG avatarId={avatarUrl} size={40} />;
    }
    if (avatarUrl) {
      return <img src={avatarUrl} alt={name} referrerPolicy="no-referrer" />;
    }
    return null;
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
          <source src="/background.mp4" type="video/mp4" />
        </video>
        {/* Decorative background suits */}
        <div className="rl-deco-suits">
          <span className="rl-suit rl-suit-1">♠</span>
          <span className="rl-suit rl-suit-2">♥</span>
          <span className="rl-suit rl-suit-3">♦</span>
          <span className="rl-suit rl-suit-4">♣</span>
        </div>
        <div className="loading-message">
          <div className="loading-card-spinner">
            <span className="card-spin-icon">♠</span>
          </div>
          Loading Room...
        </div>
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
          <source src="/background.mp4" type="video/mp4" />
        </video>
        {/* Decorative background suits */}
        <div className="rl-deco-suits">
          <span className="rl-suit rl-suit-1">♠</span>
          <span className="rl-suit rl-suit-2">♥</span>
          <span className="rl-suit rl-suit-3">♦</span>
          <span className="rl-suit rl-suit-4">♣</span>
        </div>
        <div className="error-message">
          <div className="error-icon-glow">
            <AlertTriangle size={48} className="error-alert-icon" />
          </div>
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
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Decorative background suits */}
      <div className="rl-deco-suits">
        <span className="rl-suit rl-suit-1">♠</span>
        <span className="rl-suit rl-suit-2">♥</span>
        <span className="rl-suit rl-suit-3">♦</span>
        <span className="rl-suit rl-suit-4">♣</span>
      </div>

      <div className="room-lobby-content">
        {/* Room Header */}
        <div className="room-lobby-header">
          <button className="back-btn" onClick={handleLeaveRoom} disabled={leavingRoom}>
            {leavingRoom ? (
              <>
                <span className="spinner"></span>
                Leaving...
              </>
            ) : (
              <>
                <ArrowLeft size={20} />
                Leave Room
              </>
            )}
          </button>
          <div className="room-title">
            <h1>{roomDetails?.roomName}</h1>
            {roomDetails?.roomCode && (
              <div className="room-code-keycard" onClick={copyRoomCode}>
                <span className="keycard-chip"></span>
                <span className="keycard-label">ACCESS KEY</span>
                <span className="keycard-value">{roomDetails.roomCode}</span>
                <Copy className="keycard-copy-icon" size={16} />
                <span className="copy-tooltip">Copy Access Key</span>
              </div>
            )}
          </div>
        </div>

        <div className="lobby-main">
          {/* Room Settings */}
          <div className="room-settings-panel">
            <h3>Room Settings</h3>
            <div className="setting-item">
              <span className="setting-label">
                <Award size={16} className="setting-icon-inline" />
                Max Points:
              </span>
              <span className="setting-value">{roomDetails?.maxPoints}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">
                <Users size={16} className="setting-icon-inline" />
                Max Players:
              </span>
              <span className="setting-value">{roomDetails?.players?.length || 0} / {roomDetails?.maxPlayers}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">
                {roomDetails?.isPrivate ? (
                  <Lock size={16} className="setting-icon-inline" />
                ) : (
                  <Globe size={16} className="setting-icon-inline" />
                )}
                Room Type:
              </span>
              <span className="setting-value">{roomDetails?.isPrivate ? 'Private' : 'Public'}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">
                <Play size={16} className="setting-icon-inline" />
                Status:
              </span>
              <span className={`setting-value status-${roomDetails?.status}`}>
                {roomDetails?.status === 'waiting' ? 'Waiting for Players' : 'In Game'}
              </span>
            </div>
          </div>

          {/* Players List */}
          <div className="players-panel">
            <h3>Players ({roomDetails?.players?.length || 0}/{roomDetails?.maxPlayers})</h3>
            <div className="players-list">
              {roomDetails?.players?.map((player, index) => {
                const isPlayerHost = player.id === roomDetails.hostId;
                const isCurrentPlayer = currentUser && player.id === currentUser.id;
                const suits = ['♠', '♥', '♦', '♣'];
                const suitWatermark = suits[index % 4];
                const watermarkClass = `suit-watermark watermark-${index % 4}`;

                return (
                  <div 
                    key={player.id} 
                    className={`player-card ${isPlayerHost ? 'host-card' : ''} ${isCurrentPlayer ? 'current-player' : ''}`}
                  >
                    <div className="card-shine"></div>
                    <div className={watermarkClass}>{suitWatermark}</div>

                    <div className="player-avatar">
                      {player.avatarUrl ? (
                        renderAvatar(player.avatarUrl, player.name)
                      ) : (
                        <div className="avatar-placeholder">
                          {player.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isPlayerHost && (
                        <div className="master-badge" title="Room Master">
                          <Crown size={14} className="crown-icon" />
                        </div>
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
                          {player.isReady ? (
                          <><Check size={12} /> Ready</>
                        ) : (
                          <><span className="stby-dot"></span> STBY</>
                        )}
                        </div>
                      )}
                    </div>
                    {isHost() && !isPlayerHost && (
                      <button 
                        className="kick-btn" 
                        onClick={() => handleKickPlayer(player.id)}
                        title="Kick Player"
                      >
                        <X size={16} />
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
                    <Play size={20} fill="currentColor" />
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
                    <Play size={20} fill="currentColor" />
                    Start Game
                  </button>
                ) : (
                  <button 
                    className="start-game-btn disabled" 
                    disabled
                  >
                    <Play size={20} fill="currentColor" />
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
                    className={`ready-btn ${isReady ? 'ready' : ''} ${togglingReady ? 'loading' : ''}`}
                    onClick={handleToggleReady}
                    disabled={togglingReady}
                  >
                    {togglingReady ? (
                      <>
                        <div className="btn-spinner"></div>
                        {isReady ? 'Updating...' : 'Getting Ready...'}
                      </>
                    ) : isReady ? (
                      <>
                        <Check size={20} />
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

      {/* Show loader when toggling ready status */}
      {togglingReady && (
        <Loader message={roomDetails?.players?.find(p => p.id === currentUser?.id)?.isReady ? "Unmarking ready..." : "Marking as ready..."} />
      )}
    </div>
  );
}

export default RoomLobby;
