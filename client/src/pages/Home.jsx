import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { 
  Trophy, Medal, AlertTriangle, Gamepad2, DoorOpen
} from 'lucide-react'
import Loader from '../components/Loader'
import { authAPI, gameAPI, userAPI } from '../services/api'
import { AvatarSVG, AVATAR_LIST, isAvatarSVG } from '../components/Avatars'
import './Home.css'

const GOOGLE_CLIENT_ID = "878079171404-6o87ieel3jiio8aeb0mfmu4a407gh02n.apps.googleusercontent.com";
function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [loginError, setLoginError] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [playerEmail, setPlayerEmail] = useState('')
  const [playerPicture, setPlayerPicture] = useState('')
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    birthdate: '',
    avatar_url: ''
  })
  const [userStats, setUserStats] = useState({
    total_games: 0, wins: 0, losses: 0, highest_score: 0, win_rate: 0, total_playtime: 0
  })
  const [userRankNum, setUserRankNum] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showGameModeModal, setShowGameModeModal] = useState(false)
  const [showCustomMatchModal, setShowCustomMatchModal] = useState(false)
  const [customMatchConfig, setCustomMatchConfig] = useState({
    maxPoints: 40,
    numPlayers: 4,
    isPrivate: false,
    roomCode: ''
  })
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [currentUserRank, setCurrentUserRank] = useState(null)
  const [totalPlayers, setTotalPlayers] = useState(0)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [showRoomWarning, setShowRoomWarning] = useState(false)
  const [currentRoomInfo, setCurrentRoomInfo] = useState(null)
  const [profileTab, setProfileTab] = useState('info') // 'info' | 'stats' | 'avatar'
  const [copiedCode, setCopiedCode] = useState(false)

  // Check for existing token on mount (auto-login)
  useEffect(() => {
    const checkAuth = () => {
      if (authAPI.isAuthenticated()) {
        const userData = authAPI.getCurrentUser();
        if (userData) {
          setPlayerName(userData.name || '');
          setPlayerEmail(userData.email || '');
          setPlayerPicture(userData.avatar_url || '');
          setUserId(userData.id || '');
          setIsLoggedIn(true);
        }
      }
    };
    checkAuth();
  }, []);

  // Check for session expiration flag in URL
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('expired=true')) {
      setShowLoginModal(true);
      setLoginError('Your session has expired. Please login again to continue playing.');
      // Clean up the URL search parameter so it doesn't show up again if the user refreshes
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check if user is in any room
  useEffect(() => {
    const checkUserRoom = async () => {
      if (!isLoggedIn) return;
      
      try {
        const response = await gameAPI.checkUserRoom();
        if (response.inRoom) {
          setCurrentRoomInfo(response);
          setShowRoomWarning(true);
        }
      } catch (error) {
        console.error('Error checking user room:', error);
      }
    };

    checkUserRoom();
  }, [isLoggedIn]);

  // Auto-open custom match modal if navigated from RoomList with openCreateRoom state
  useEffect(() => {
    if (location.state?.openCreateRoom) {
      setShowCustomMatchModal(true)
      // Clean up the location state so it doesn't reopen on subsequent refreshes
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location, navigate])

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const response = await gameAPI.getLeaderboard(10);
        if (response.success) {
          setLeaderboard(response.leaderboard || []);
          setTotalPlayers(response.totalPlayers || 0);
          if (response.currentUserRank) {
            setCurrentUserRank(response.currentUserRank);
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoadingLeaderboard(false);
      }
    };

    fetchLeaderboard();
  }, [userId]);

  // Fetch user profile & stats when logged in
  useEffect(() => {
    const fetchProfileAndStats = async () => {
      if (!isLoggedIn) return;
      try {
        const response = await userAPI.getProfile();
        if (response.success) {
          if (response.stats) setUserStats(response.stats);
          if (response.rank) setUserRankNum(response.rank);
          if (response.user?.avatar_url) {
            setPlayerPicture(response.user.avatar_url);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfileAndStats();
  }, [isLoggedIn]);

  const handlePlay = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    setShowGameModeModal(true)
  }

  const handleGameModeSelect = (mode) => {
    setShowGameModeModal(false)
    
    if (mode === 'custom') {
      setShowCustomMatchModal(true)
    } else if (mode === 'find') {
      navigate('/rooms')
    } else if (mode === 'bots') {
      navigate('/practice')
    } else if (mode === 'quick') {
      navigate('/quickmatch')
    } else {
      // Navigate to game with selected mode
      navigate('/game', { state: { mode } })
    }
  }

  const generateRoomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  const handleCustomMatchSubmit = async () => {
    const config = { ...customMatchConfig }
    
    if (config.isPrivate && !config.roomCode) {
      config.roomCode = generateRoomCode()
    } else if (!config.isPrivate) {
      config.roomCode = ''
    }
    
    setCustomMatchConfig(config)
    setCreatingRoom(true)
    
    try {
      // Create room via API
      const response = await gameAPI.createRoom({
        maxPoints: config.maxPoints,
        maxPlayers: config.numPlayers,
        isPrivate: config.isPrivate,
        roomCode: config.roomCode
      })
      
      // Navigate to room lobby
      navigate(`/room/${response.roomId}`)
    } catch (err) {
      console.error('Error creating room:', err)
      alert('Failed to create room. Please try again.')
      setCreatingRoom(false)
    }
  }

  const handlePrivateToggle = () => {
    const newIsPrivate = !customMatchConfig.isPrivate
    setCustomMatchConfig({
      ...customMatchConfig,
      isPrivate: newIsPrivate,
      roomCode: newIsPrivate ? generateRoomCode() : ''
    })
  }

  const handleLoginClick = () => {
    setShowLoginModal(true)
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      // Send Google credential to backend
      const response = await authAPI.googleLogin(credentialResponse.credential);
      
      console.log('Backend response:', response);
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      // Store user data in localStorage
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
        
        // Update state with user data from backend
        setPlayerName(response.user.name || '');
        setPlayerEmail(response.user.email || '');
        setPlayerPicture(response.user.avatar_url || '');
        setUserId(response.user.id || '');
        setIsLoggedIn(true);
        setShowLoginModal(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(error?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setLoginError('');
    try {
      const response = await authAPI.guestLogin(guestName);
      
      if (response.token) {
        localStorage.setItem('authToken', response.token);
      }
      
      if (response.user) {
        localStorage.setItem('userData', JSON.stringify(response.user));
        setPlayerName(response.user.name || '');
        setPlayerEmail(response.user.email || '');
        setPlayerPicture(response.user.avatar_url || '');
        setUserId(response.user.id || '');
        setIsLoggedIn(true);
        setShowLoginModal(false);
        setLoginError('');
      }
    } catch (error) {
      console.error('Guest login error:', error);
      setLoginError(error?.message || 'Guest login failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.log('Login Failed');
    setLoginError('Google login failed. Try guest login instead.');
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsLoggedIn(false);
    setPlayerName('');
    setPlayerEmail('');
    setPlayerPicture('');
    setUserId('');
  }

  const handleLeaveCurrentRoom = async () => {
    if (!currentRoomInfo || !currentRoomInfo.roomId) return;
    
    try {
      await gameAPI.leaveRoom(currentRoomInfo.roomId);
      setShowRoomWarning(false);
      setCurrentRoomInfo(null);
      alert('You have left the room');
    } catch (error) {
      console.error('Error leaving room:', error);
      alert('Failed to leave room');
    }
  };

  const handleGoToRoom = () => {
    if (currentRoomInfo && currentRoomInfo.roomId) {
      setShowRoomWarning(false);
      navigate(`/room/${currentRoomInfo.roomId}`);
    }
  };

  const handleProfileClick = async () => {
    setProfileData({
      name: playerName,
      username: playerName,
      email: playerEmail,
      birthdate: '',
      avatar_url: playerPicture
    });
    setProfileTab('info');
    
    // Fetch latest profile data from server
    try {
      const response = await userAPI.getProfile();
      if (response.success) {
        setProfileData({
          name: response.user.name || playerName,
          username: response.user.username || '',
          email: response.user.email || playerEmail,
          birthdate: response.user.birthdate || '',
          avatar_url: response.user.avatar_url || playerPicture
        });
        if (response.stats) setUserStats(response.stats);
        if (response.rank) setUserRankNum(response.rank);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
    
    setShowProfileModal(true);
  }

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await userAPI.updateProfile({
        name: profileData.name,
        username: profileData.username,
        birthdate: profileData.birthdate,
        avatar_url: profileData.avatar_url
      });
      
      if (response.success) {
        setPlayerName(response.user.name || playerName);
        setPlayerPicture(response.user.avatar_url || playerPicture);
        
        // Update localStorage
        const userData = authAPI.getCurrentUser();
        const updatedUserData = { ...userData, ...response.user };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        setShowProfileModal(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const handleAvatarSelect = (avatarId) => {
    setProfileData(prev => ({ ...prev, avatar_url: avatarId }));
  }

  // Render avatar (handles both SVG ID and URL)
  const renderAvatar = (avatarUrl, size = 40, fallbackName = '') => {
    if (isAvatarSVG(avatarUrl)) {
      return <AvatarSVG avatarId={avatarUrl} size={size} />;
    }
    if (avatarUrl) {
      return (
        <>
          <img 
            src={avatarUrl} 
            alt="avatar" 
            style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
            referrerPolicy="no-referrer"
            onError={(e) => {
              // Hide the broken image and show fallback letter
              e.target.style.display = 'none';
              if (e.target.nextElementSibling) {
                e.target.nextElementSibling.style.display = 'inline';
              }
            }}
          />
          <span style={{display: 'none', color: 'white', fontSize: `${size/2.5}px`, fontWeight: 'bold'}}>
            {(fallbackName || '?').charAt(0).toUpperCase()}
          </span>
        </>
      );
    }
    return (
      <span style={{color: 'white', fontSize: `${size/2.5}px`, fontWeight: 'bold'}}>
        {(fallbackName || '?').charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <div className="home-container">
      {/* Video Background */}
      <video 
        className="video-background" 
        autoPlay 
        loop 
        muted 
        playsInline
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      
      {/* Animated background */}
      <div className="animated-bg">
        <div className="stars"></div>
        <div className="particles"></div>
        <div className="gradient-overlay"></div>
        <div className="mesh-overlay"></div>
        {/* Floating glow orbs */}
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
        <div className="glow-orb glow-orb-3"></div>
        {/* Floating card suits */}
        <div className="floating-suits">
          <span className="float-suit fs-1">♠</span>
          <span className="float-suit fs-2">♥</span>
          <span className="float-suit fs-3">♦</span>
          <span className="float-suit fs-4">♣</span>
          <span className="float-suit fs-5">♠</span>
          <span className="float-suit fs-6">♥</span>
          <span className="float-suit fs-7">♦</span>
          <span className="float-suit fs-8">♣</span>
          <span className="float-suit fs-9">♠</span>
          <span className="float-suit fs-10">♣</span>
        </div>
        <div className="vignette-overlay"></div>
      </div>

      {/* Leaderboard Section - Top Left */}
      <div className="leaderboard-section">
        <div className="leaderboard-header">
          <h3><Trophy size={18} style={{display:'inline', verticalAlign:'-3px', marginRight:'4px'}} /> Leaderboard</h3>
        </div>
        <div className="leaderboard-content">
          {loadingLeaderboard ? (
            <div className="leaderboard-loading">Loading...</div>
          ) : (
            <>
              {leaderboard.length === 0 ? (
                <div className="leaderboard-empty">No players yet. Be the first!</div>
              ) : (
                leaderboard.slice(0, 5).map((player, index) => (
                  <div key={player.user_id || index} className={`leaderboard-item ${player.user_id === userId ? 'current-user' : ''}`}>
                    <div className={`rank rank-${index + 1}`}>
                      {index === 0 ? <Medal size={18} style={{color:'#FFD700'}} /> : index === 1 ? <Medal size={18} style={{color:'#C0C0C0'}} /> : index === 2 ? <Medal size={18} style={{color:'#CD7F32'}} /> : `#${player.rank}`}
                    </div>
                    <div className="player-info">
                      <div className="player-avatar-wrap">
                        {renderAvatar(player.avatar_url, 35, player.name)}
                      </div>
                      <span className="player-name">{player.user_id === userId ? 'You' : (player.name || 'Anonymous')}</span>
                    </div>
                    <div className="lb-stats">
                      <span className="wins-count">{player.wins}W</span>
                      <span className="score-count">{player.win_rate}%</span>
                    </div>
                  </div>
                ))
              )}
              
              {/* Show current user position if not in top 5 */}
              {currentUserRank && currentUserRank.rank > 5 && isLoggedIn && (
                <>
                  <div className="leaderboard-divider">···</div>
                  <div className="leaderboard-item current-user">
                    <div className="rank">#{currentUserRank.rank}</div>
                    <div className="player-info">
                      <div className="player-avatar-wrap">
                        {renderAvatar(playerPicture, 35, playerName)}
                      </div>
                      <span className="player-name">You</span>
                    </div>
                    <div className="lb-stats">
                      <span className="wins-count">{currentUserRank.wins}W</span>
                      <span className="score-count">{currentUserRank.win_rate}%</span>
                    </div>
                  </div>
                </>
              )}
              
              <button className="see-more-btn" onClick={() => setShowLeaderboardModal(true)}>
                View Full Leaderboard ({totalPlayers} players)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Profile Section - Top Right */}
      {!isLoggedIn ? (
        <div className="profile-section login-prompt" onClick={handleLoginClick}>
          <div className="login-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"/>
            </svg>
          </div>
          <span className="login-text">Login</span>
        </div>
      ) : (
        <div className="profile-section logged-in">
          <div className="profile-avatar" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            {renderAvatar(playerPicture, 45, playerName)}
          </div>
          <div className="profile-info" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            <span className="profile-name">{playerName}</span>
            <span className="profile-level">
              {userRankNum ? `Rank #${userRankNum}` : 'Unranked'} · {userStats.wins}W/{userStats.losses}L
            </span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      )}

      {/* Profile Modal - Redesigned with Tabs */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowProfileModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            
            {/* Profile Header */}
            <div className="pm-header">
              <div className="pm-avatar-display">
                {renderAvatar(profileData.avatar_url, 90, profileData.name)}
              </div>
              <div className="pm-header-info">
                <h2>{profileData.name || 'Player'}</h2>
                <span className="pm-rank-badge">
                  {userRankNum ? <><Trophy size={14} style={{display:'inline', verticalAlign:'-2px'}} /> Rank #{userRankNum}</> : <><Gamepad2 size={14} style={{display:'inline', verticalAlign:'-2px'}} /> Unranked</>}
                </span>
                <span className="pm-join-date">
                  Joined {new Date(profileData.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="pm-stats-bar">
              <div className="pm-stat-item">
                <span className="pm-stat-value">{userStats.total_games}</span>
                <span className="pm-stat-label">Games</span>
              </div>
              <div className="pm-stat-divider"></div>
              <div className="pm-stat-item">
                <span className="pm-stat-value pm-wins">{userStats.wins}</span>
                <span className="pm-stat-label">Wins</span>
              </div>
              <div className="pm-stat-divider"></div>
              <div className="pm-stat-item">
                <span className="pm-stat-value pm-losses">{userStats.losses}</span>
                <span className="pm-stat-label">Losses</span>
              </div>
              <div className="pm-stat-divider"></div>
              <div className="pm-stat-item">
                <span className="pm-stat-value pm-winrate">{userStats.win_rate}%</span>
                <span className="pm-stat-label">Win Rate</span>
              </div>
              <div className="pm-stat-divider"></div>
              <div className="pm-stat-item">
                <span className="pm-stat-value pm-highscore">{userStats.highest_score}</span>
                <span className="pm-stat-label">High Score</span>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="pm-tabs">
              <button 
                className={`pm-tab ${profileTab === 'info' ? 'active' : ''}`}
                onClick={() => setProfileTab('info')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Edit Info
              </button>
              <button 
                className={`pm-tab ${profileTab === 'stats' ? 'active' : ''}`}
                onClick={() => setProfileTab('stats')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 20V10M12 20V4M6 20v-6"></path>
                </svg>
                Stats
              </button>
              <button 
                className={`pm-tab ${profileTab === 'avatar' ? 'active' : ''}`}
                onClick={() => setProfileTab('avatar')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="10" r="3"></circle>
                  <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path>
                </svg>
                Avatar
              </button>
            </div>

            {/* Tab Content */}
            <div className="pm-tab-content">
              {/* Edit Info Tab */}
              {profileTab === 'info' && (
                <div className="pm-info-tab">
                  <div className="form-group">
                    <label>Display Name</label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileInputChange}
                      placeholder="Enter your name"
                      maxLength={50}
                    />
                  </div>
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={profileData.username}
                      onChange={handleProfileInputChange}
                      placeholder="Enter username"
                      maxLength={30}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      style={{ backgroundColor: '#1a1a2e', cursor: 'not-allowed', opacity: 0.6 }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Birthdate</label>
                    <input
                      type="date"
                      name="birthdate"
                      value={profileData.birthdate}
                      onChange={handleProfileInputChange}
                    />
                  </div>
                  <button 
                    className="save-profile-btn" 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}

              {/* Stats Tab */}
              {profileTab === 'stats' && (
                <div className="pm-stats-tab">
                  <div className="pm-stats-grid">
                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa'}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="6" width="20" height="12" rx="3"></rect>
                          <circle cx="8" cy="12" r="2"></circle>
                          <circle cx="16" cy="12" r="2"></circle>
                        </svg>
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value">{userStats.total_games}</span>
                        <span className="pm-sc-label">Total Games Played</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(16, 185, 129, 0.2)', color: '#34d399'}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
                        </svg>
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value pm-wins">{userStats.wins}</span>
                        <span className="pm-sc-label">Victories</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#f87171'}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value pm-losses">{userStats.losses}</span>
                        <span className="pm-sc-label">Defeats</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24'}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                          <polyline points="17 6 23 6 23 12"></polyline>
                        </svg>
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value pm-highscore">{userStats.highest_score}</span>
                        <span className="pm-sc-label">Highest Score</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa'}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 20V10M12 20V4M6 20v-6"></path>
                        </svg>
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value pm-winrate">{userStats.win_rate}%</span>
                        <span className="pm-sc-label">Win Rate</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(244, 114, 182, 0.2)', color: '#f472b6'}}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9l6 6 6-6"></path>
                        </svg>
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value">{userRankNum || '—'}</span>
                        <span className="pm-sc-label">Global Rank</span>
                      </div>
                    </div>
                  </div>

                  {/* Win Rate Bar */}
                  {userStats.total_games > 0 && (
                    <div className="pm-winrate-bar-wrap">
                      <div className="pm-winrate-header">
                        <span>Win/Loss Ratio</span>
                        <span>{userStats.wins}W - {userStats.losses}L</span>
                      </div>
                      <div className="pm-winrate-bar">
                        <div className="pm-winrate-fill" style={{ width: `${userStats.win_rate}%` }}></div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Avatar Tab */}
              {profileTab === 'avatar' && (
                <div className="pm-avatar-tab">
                  <p className="pm-avatar-hint">Choose your avatar</p>
                  <div className="pm-avatar-grid">
                    {AVATAR_LIST.map(avatar => (
                      <div 
                        key={avatar.id}
                        className={`pm-avatar-option ${profileData.avatar_url === avatar.id ? 'selected' : ''}`}
                        onClick={() => handleAvatarSelect(avatar.id)}
                        style={{ '--avatar-color': avatar.color }}
                      >
                        <AvatarSVG avatarId={avatar.id} size={70} />
                        <span className="pm-avatar-name">{avatar.name}</span>
                        {profileData.avatar_url === avatar.id && (
                          <div className="pm-avatar-check">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    className="save-profile-btn" 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Avatar'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Game Mode Selection Modal */}
      {showGameModeModal && (
        <div className="modal-overlay" onClick={() => setShowGameModeModal(false)}>
          <div className="game-mode-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowGameModeModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <div className="modal-header">
              <div className="modal-title-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="6" width="20" height="12" rx="3"></rect>
                  <circle cx="8" cy="12" r="2"></circle>
                  <circle cx="16" cy="12" r="2"></circle>
                  <path d="M8 10v4M6 12h4M14 11h4M14 13h4"></path>
                </svg>
              </div>
              <h2>Select Game Mode</h2>
              <p className="modal-subtitle">Choose your preferred way to play LowXena</p>
            </div>
            
            <div className="game-mode-grid">
              <button 
                className="game-mode-card create-custom"
                onClick={() => handleGameModeSelect('custom')}
              >
                <div className="card-glow"></div>
                <div className="card-shine"></div>
                <div className="card-suit-watermark">♠</div>
                <div className="mode-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"></path>
                    <rect x="3" y="3" width="18" height="18" rx="3"></rect>
                  </svg>
                </div>
                <h3>Create Room</h3>
                <p>Set up a private game with custom rules and invite players</p>
                <div className="card-badge">Multiplayer</div>
              </button>

              <button 
                className="game-mode-card find-room"
                onClick={() => handleGameModeSelect('find')}
              >
                <div className="card-glow"></div>
                <div className="card-shine"></div>
                <div className="card-suit-watermark">♦</div>
                <div className="mode-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
                    <path d="M8 11h6M11 8v6"></path>
                  </svg>
                </div>
                <h3>Browse Rooms</h3>
                <p>Find and join open games from available lobbies</p>
                <div className="card-badge">Casual</div>
              </button>

              <button 
                className="game-mode-card join-bots"
                onClick={() => handleGameModeSelect('bots')}
              >
                <div className="card-glow"></div>
                <div className="card-shine"></div>
                <div className="card-suit-watermark">♣</div>
                <div className="mode-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="8" width="16" height="12" rx="2"></rect>
                    <path d="M9 8V6a3 3 0 0 1 6 0v2"></path>
                    <circle cx="9" cy="14" r="1.5" fill="currentColor"></circle>
                    <circle cx="15" cy="14" r="1.5" fill="currentColor"></circle>
                    <path d="M10 17h4"></path>
                  </svg>
                </div>
                <h3>Practice Mode</h3>
                <p>Train against computer opponents to improve your strategy</p>
                <div className="card-badge">Single Player</div>
              </button>

              <button 
                className="game-mode-card fast-join"
                onClick={() => handleGameModeSelect('quick')}
              >
                <div className="card-glow"></div>
                <div className="card-shine"></div>
                <div className="card-suit-watermark">♥</div>
                <div className="mode-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <h3>Quick Match</h3>
                <p>Get matched with players instantly and start playing</p>
                <div className="card-badge">Ranked</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Match Configuration Modal */}
      {showCustomMatchModal && (
        <div className="modal-overlay" onClick={() => setShowCustomMatchModal(false)}>
          <div className="custom-match-modal" onClick={(e) => e.stopPropagation()}>
            {/* Decorative background suits */}
            <div className="cm-deco-suits">
              <span className="cm-suit cm-suit-1">♠</span>
              <span className="cm-suit cm-suit-2">♥</span>
              <span className="cm-suit cm-suit-3">♦</span>
              <span className="cm-suit cm-suit-4">♣</span>
            </div>
            
            <div className="modal-close" onClick={() => setShowCustomMatchModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <div className="cm-scroll-body">
            <div className="cm-header">
              <div className="cm-header-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              <h2>Room Configuration</h2>
              <p className="modal-subtitle">Set up your game preferences</p>
            </div>
            
            <div className="custom-match-form">
              {/* Max Points Selector */}
              <div className="form-group">
                <label>
                  <span className="label-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M12 8v4l3 3"></path>
                    </svg>
                  </span>
                  Points to Win
                </label>
                <div className="custom-chips-grid">
                  {[10, 20, 30, 40].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      className={`chip-select-btn ${customMatchConfig.maxPoints === pts ? 'active' : ''}`}
                      onClick={() => setCustomMatchConfig({ ...customMatchConfig, maxPoints: pts })}
                    >
                      <span className="chip-points">{pts}</span>
                      <span className="chip-label">
                        {pts === 10 ? '⚡ Blitz' : pts === 20 ? '🔥 Quick' : pts === 30 ? '♠ Classic' : '🏆 Epic'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Players Selector */}
              <div className="form-group">
                <label>
                  <span className="label-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="9" cy="7" r="4"></circle>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                  </span>
                  Player Count
                </label>
                <div className="player-badges-row">
                  {[2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`player-badge-btn ${customMatchConfig.numPlayers === num ? 'active' : ''}`}
                      onClick={() => setCustomMatchConfig({ ...customMatchConfig, numPlayers: num })}
                    >
                      <span className="player-badge-num">{num}</span>
                      <span className="player-badge-label">
                        {num === 2 ? 'Duel' : num <= 4 ? 'Standard' : 'Party'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Room Visibility Segment Cards */}
              <div className="form-group">
                <label>
                  <span className="label-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  Room Visibility
                </label>
                <div className="visibility-cards-container">
                  <button
                    type="button"
                    className={`visibility-card-btn ${!customMatchConfig.isPrivate ? 'active' : ''}`}
                    onClick={() => setCustomMatchConfig({
                      ...customMatchConfig,
                      isPrivate: false,
                      roomCode: ''
                    })}
                  >
                    <div className="v-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                    </div>
                    <div className="v-card-text">
                      <h4>Public Lobby</h4>
                      <p>Listed publicly. Anyone can join from search.</p>
                    </div>
                    <div className="v-card-check">✓</div>
                  </button>

                  <button
                    type="button"
                    className={`visibility-card-btn ${customMatchConfig.isPrivate ? 'active' : ''}`}
                    onClick={() => {
                      const code = customMatchConfig.roomCode || generateRoomCode();
                      setCustomMatchConfig({
                        ...customMatchConfig,
                        isPrivate: true,
                        roomCode: code
                      });
                    }}
                  >
                    <div className="v-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                    <div className="v-card-text">
                      <h4>Private Room</h4>
                      <p>Hidden lobby. Require Room Code to enter.</p>
                    </div>
                    <div className="v-card-check">✓</div>
                  </button>
                </div>
              </div>

              {/* Room Code Panel */}
              {customMatchConfig.isPrivate && (
                <div className="form-group room-code-group">
                  <label>
                    <span className="label-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                        <path d="M7 15h0M2 9.5h20"></path>
                      </svg>
                    </span>
                    Room Code
                  </label>
                  <div className="room-code-display">
                    <span className="code">{customMatchConfig.roomCode}</span>
                    <button 
                      className={`copy-btn ${copiedCode ? 'copied' : ''}`}
                      onClick={() => {
                        navigator.clipboard.writeText(customMatchConfig.roomCode);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      type="button"
                    >
                      {copiedCode ? (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{color: '#34d399'}}>
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="room-code-hint">Share this code with players so they can join your private room</p>
                </div>
              )}
              {/* Dynamic Room Summary Card */}
              <div className="room-summary-ticket">
                <div className="ticket-glow"></div>
                <div className="ticket-content">
                  <div className="ticket-main">
                    <span className="ticket-title">LOBBY PREVIEW</span>
                    <span className="ticket-value">
                      {customMatchConfig.maxPoints === 10 ? '⚡ Blitz' : 
                       customMatchConfig.maxPoints === 20 ? '🔥 Quick' : 
                       customMatchConfig.maxPoints === 30 ? '♠ Classic' : '🏆 Epic'}
                      {' • '}
                      {customMatchConfig.numPlayers === 2 ? '👥 Duel' : 
                       customMatchConfig.numPlayers <= 4 ? '👥 Standard' : '👥 Party'} ({customMatchConfig.numPlayers} Players)
                      {' • '}
                      {customMatchConfig.isPrivate ? '🔒 Private' : '🌐 Public'}
                    </span>
                  </div>
                  <div className="ticket-suits">♣ ♦ ♥ ♠</div>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                className="start-game-btn" 
                onClick={handleCustomMatchSubmit}
                disabled={creatingRoom}
              >
                {creatingRoom ? (
                  <>
                    <span className="spinner"></span>
                    Creating room...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Create Room
                  </>
                )}
              </button>
            </div>
            </div>{/* end cm-scroll-body */}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => { setShowLoginModal(false); setLoginError(''); }}>
          <div className="login-modal-v2" onClick={(e) => e.stopPropagation()}>
            {/* Decorative suits */}
            <div className="lm-deco-suits">
              <span className="lm-suit lm-suit-1">♠</span>
              <span className="lm-suit lm-suit-2">♥</span>
              <span className="lm-suit lm-suit-3">♦</span>
              <span className="lm-suit lm-suit-4">♣</span>
            </div>
            
            <div className="modal-close" onClick={() => { setShowLoginModal(false); setLoginError(''); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>

            {/* Header */}
            <div className="lm-header">
              <div className="lm-icon-wrap">
                <Gamepad2 size={28} />
              </div>
              <h2>Welcome to LowXena</h2>
              <p>Sign in to start your gaming journey</p>
            </div>
            
            {loginError && (
              <div className="login-error">
                <span><AlertTriangle size={14} /></span> {loginError}
              </div>
            )}
            
            <div className="lm-body">
              {loading ? (
                <div style={{ position: 'relative', minHeight: '200px' }}>
                  <Loader message="Signing you in..." />
                </div>
              ) : (
                <>
                  {/* Google Login Section */}
                  <div className="lm-google-section">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      useOneTap
                      theme="filled_black"
                      size="large"
                      text="signin_with"
                      shape="rectangular"
                      logo_alignment="left"
                      width="340"
                    />
                  </div>
                  
                  <div className="lm-divider">
                    <div className="lm-divider-line"></div>
                    <span>or</span>
                    <div className="lm-divider-line"></div>
                  </div>
                  
                  {/* Guest Login Section */}
                  <div className="lm-guest-section">
                    <div className="lm-input-wrap">
                      <svg className="lm-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <input
                        type="text"
                        className="lm-guest-input"
                        placeholder="Enter your name (optional)"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        maxLength={30}
                        onKeyDown={(e) => e.key === 'Enter' && handleGuestLogin()}
                      />
                    </div>
                    <button className="lm-guest-btn" onClick={handleGuestLogin}>
                      <span className="lm-btn-glow"></span>
                      <Gamepad2 size={18} /> 
                      <span>Play as Guest</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Centered */}
      <div className="hero-section">
        <div className="hero-glow-orb"></div>
        <div className="hero-card">
          <h1 className="hero-title">LowXena</h1>
          <p className="hero-tagline">Where the Lowest Wins.</p>
          <div className="hero-chips">
            <span className="hero-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              2-7 Players
            </span>
            <span className="hero-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              Quick Rounds
            </span>
            <span className="hero-chip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>
              Free to Play
            </span>
          </div>
          <div className="hero-actions">
            <button className="hero-play-btn" onClick={handlePlay}>
              <span className="hero-btn-glow"></span>
              <span className="hero-play-icon">▶</span>
              <span>PLAY NOW</span>
            </button>
            <button className="hero-rules-btn" onClick={() => navigate('/rules')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <span>RULES</span>
            </button>
          </div>
        </div>
      </div>

      {/* Room Warning Modal */}
      {showRoomWarning && currentRoomInfo && (
        <div className="modal-overlay" onClick={() => setShowRoomWarning(false)}>
          <div className="modal-content room-warning-modal" onClick={(e) => e.stopPropagation()}>
            <button className="room-warning-close" onClick={() => setShowRoomWarning(false)}>✕</button>
            
            <div className="room-warning-icon">
              <AlertTriangle size={32} />
            </div>
            
            <h2 className="room-warning-title">Already in a Room</h2>
            
            <p className="room-warning-room-name">{currentRoomInfo.roomName}</p>
            
            <div className="room-warning-status-row">
              <span className={`room-warning-badge ${currentRoomInfo.status}`}>
                {currentRoomInfo.status === 'waiting' ? 'Waiting' : 'In Game'}
              </span>
            </div>
            
            <div className="room-warning-actions">
              <button 
                className="btn-go-to-room" 
                onClick={handleGoToRoom}
              >
                <Gamepad2 size={18} /> Go to Room
              </button>
              <button 
                className="btn-leave-room" 
                onClick={handleLeaveCurrentRoom}
              >
                <DoorOpen size={18} /> Leave Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Leaderboard Modal */}
      {showLeaderboardModal && (
        <div className="modal-overlay" onClick={() => setShowLeaderboardModal(false)}>
          <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowLeaderboardModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h2><Trophy size={20} style={{display:'inline', verticalAlign:'-3px', marginRight:'6px'}} /> Full Leaderboard</h2>
            <p className="lb-modal-subtitle">{totalPlayers} total players</p>
            
            <div className="lb-modal-header-row">
              <span className="lb-col-rank">Rank</span>
              <span className="lb-col-player">Player</span>
              <span className="lb-col-stat">Wins</span>
              <span className="lb-col-stat">Rate</span>
              <span className="lb-col-stat">Score</span>
            </div>

            <div className="lb-modal-list">
              {leaderboard.map((player, index) => (
                <div key={player.user_id || index} className={`lb-modal-item ${player.user_id === userId ? 'current-user' : ''}`}>
                  <span className="lb-col-rank">
                    {index === 0 ? <Medal size={18} style={{color:'#FFD700'}} /> : index === 1 ? <Medal size={18} style={{color:'#C0C0C0'}} /> : index === 2 ? <Medal size={18} style={{color:'#CD7F32'}} /> : `#${player.rank}`}
                  </span>
                  <span className="lb-col-player">
                    <span className="lb-avatar-mini">{renderAvatar(player.avatar_url, 28, player.name)}</span>
                    {player.user_id === userId ? 'You' : (player.name || 'Anonymous')}
                  </span>
                  <span className="lb-col-stat">{player.wins}</span>
                  <span className="lb-col-stat">{player.win_rate}%</span>
                  <span className="lb-col-stat">{player.highest_score || 0}</span>
                </div>
              ))}
              
              {currentUserRank && currentUserRank.rank > leaderboard.length && isLoggedIn && (
                <>
                  <div className="leaderboard-divider">···</div>
                  <div className="lb-modal-item current-user">
                    <span className="lb-col-rank">#{currentUserRank.rank}</span>
                    <span className="lb-col-player">
                      <span className="lb-avatar-mini">{renderAvatar(playerPicture, 28, playerName)}</span>
                      You
                    </span>
                    <span className="lb-col-stat">{currentUserRank.wins}</span>
                    <span className="lb-col-stat">{currentUserRank.win_rate}%</span>
                    <span className="lb-col-stat">{currentUserRank.highest_score || 0}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="home-footer">
        <span>made by <a href="https://dharmikgohil.art/" target="_blank" rel="noopener noreferrer">dharmikgohil.art</a></span>
      </div>
    </div>
    </GoogleOAuthProvider>
  )
}

export default Home
