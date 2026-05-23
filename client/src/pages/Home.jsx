import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { 
  Trophy, Medal, AlertTriangle, Gamepad2, DoorOpen, Info,
  LogIn, LogOut, User, BarChart2, Image as ImageIcon, X, Settings,
  Plus, Search, Zap, Bot, Crown, Globe, Lock, Copy, Check, Play,
  BookOpen, Users, Shield, Swords, TrendingUp, Star, Clock, Hash, Sparkles, Flame, Coins
} from 'lucide-react'
import Loader from '../components/Loader'
import { authAPI, gameAPI, userAPI } from '../services/api'
import { AvatarSVG, AVATAR_LIST, isAvatarSVG } from '../components/Avatars'
import './Home.css'

const GOOGLE_CLIENT_ID = "878079171404-6o87ieel3jiio8aeb0mfmu4a407gh02n.apps.googleusercontent.com";

const CARD_BACKS = [
  {
    id: 'default',
    name: 'Default Cyber',
    author: 'LowXena Team',
    path: '/card_back.png'
  },
  {
    id: 'cyber_raven_alpha',
    name: 'Cyber-Raven Alpha',
    author: 'Vapor-Net Syndicate',
    path: '/card_backs/cyber_raven_alpha.jpg'
  },
  {
    id: 'synth_raven',
    name: 'Synth-Raven',
    author: 'Vapor-Net Syndicate',
    path: '/card_backs/synth_raven.jpg'
  },
  {
    id: 'aetheria_systems',
    name: 'Aetheria Systems',
    author: 'Neon Regime Edition',
    path: '/card_backs/aetheria_systems.jpg'
  }
];

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
  const [playerCoins, setPlayerCoins] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showScorePopup, setShowScorePopup] = useState(false)
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: '',
    birthdate: '',
    avatar_url: ''
  })
  const [userStats, setUserStats] = useState(() => {
    try {
      const cached = localStorage.getItem('user_stats_cache')
      return cached ? JSON.parse(cached) : { total_games: 0, wins: 0, losses: 0, highest_score: 0, win_rate: 0, total_playtime: 0 }
    } catch {
      return { total_games: 0, wins: 0, losses: 0, highest_score: 0, win_rate: 0, total_playtime: 0 }
    }
  })
  const [userRankNum, setUserRankNum] = useState(() => {
    try {
      const cached = localStorage.getItem('user_rank_num_cache')
      return cached ? parseInt(cached) : null
    } catch {
      return null
    }
  })
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
  const [leaderboard, setLeaderboard] = useState(() => {
    try {
      const cached = localStorage.getItem('leaderboard_cache')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [currentUserRank, setCurrentUserRank] = useState(() => {
    try {
      const cached = localStorage.getItem('leaderboard_user_rank_cache')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [totalPlayers, setTotalPlayers] = useState(() => {
    try {
      return parseInt(localStorage.getItem('leaderboard_total_cache')) || 0
    } catch {
      return 0
    }
  })
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [leaderboardLimit, setLeaderboardLimit] = useState(5)
  const [showRoomWarning, setShowRoomWarning] = useState(false)
  const [currentRoomInfo, setCurrentRoomInfo] = useState(null)
  const [profileTab, setProfileTab] = useState('info') // 'info' | 'stats' | 'avatar'
  const [copiedCode, setCopiedCode] = useState(false)
  const [customSeed, setCustomSeed] = useState('')

  const handleCustomSeedChange = (e) => {
    const seed = e.target.value;
    setCustomSeed(seed);
    setProfileData(prev => ({
      ...prev,
      avatar_url: `avatar-adventurer-${seed}`
    }));
  };

  const handleRandomizeSeed = () => {
    const randomSeeds = ['Knight', 'Hero', 'Wizard', 'Shadow', 'Dragon', 'Ranger', 'Spectre', 'Rogue', 'Hunter', 'Paladin', 'Mage', 'Fighter', 'Warlock', 'Ninja', 'Felix', 'Aneka', 'Jack', 'Aria', 'Luna', 'Kiki', 'Leo', 'Buster', 'Finn', 'Max'];
    const randomSeed = randomSeeds[Math.floor(Math.random() * randomSeeds.length)] + Math.floor(Math.random() * 1000);
    setCustomSeed(randomSeed);
    setProfileData(prev => ({
      ...prev,
      avatar_url: `avatar-adventurer-${randomSeed}`
    }));
  };

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
          setPlayerCoins(userData.coins || 0);
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
      const cacheTime = localStorage.getItem('leaderboard_cache_time');
      const cacheAge = cacheTime ? Date.now() - parseInt(cacheTime) : Infinity;
      
      if (cacheAge < 60000 && leaderboard.length > 0) {
        return;
      }
      
      if (leaderboard.length === 0) {
        setLoadingLeaderboard(true);
      }
      
      try {
        const response = await gameAPI.getLeaderboard(100);
        if (response.success) {
          const list = response.leaderboard || [];
          const total = response.totalPlayers || 0;
          const uRank = response.currentUserRank || null;
          
          setLeaderboard(list);
          setTotalPlayers(total);
          setCurrentUserRank(uRank);
          
          localStorage.setItem('leaderboard_cache', JSON.stringify(list));
          localStorage.setItem('leaderboard_total_cache', total.toString());
          if (uRank) {
            localStorage.setItem('leaderboard_user_rank_cache', JSON.stringify(uRank));
          }
          localStorage.setItem('leaderboard_cache_time', Date.now().toString());
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
      
      const cacheTime = localStorage.getItem('user_profile_cache_time');
      const cacheAge = cacheTime ? Date.now() - parseInt(cacheTime) : Infinity;
      
      if (cacheAge < 60000 && userStats.total_games > 0) {
        return;
      }
      
      try {
        const response = await userAPI.getProfile();
        if (response.success) {
          if (response.stats) {
            setUserStats(response.stats);
            localStorage.setItem('user_stats_cache', JSON.stringify(response.stats));
          }
          if (response.rank) {
            setUserRankNum(response.rank);
            localStorage.setItem('user_rank_num_cache', response.rank.toString());
          }
          localStorage.setItem('user_profile_cache_time', Date.now().toString());
          
          if (response.user) {
            if (response.user.avatar_url) {
              setPlayerPicture(response.user.avatar_url);
            }
            if (response.user.coins !== undefined) {
              setPlayerCoins(response.user.coins);
              const currentCached = authAPI.getCurrentUser();
              if (currentCached) {
                currentCached.coins = response.user.coins;
                localStorage.setItem('userData', JSON.stringify(currentCached));
              }
            }
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
      
      // Navigate to room lobby using a friendly slug
      const roomSlug = response.roomName 
        ? response.roomName.toLowerCase().replace(/\s+/g, '-') 
        : response.roomId;
      navigate(`/room/${roomSlug}`)
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
        setPlayerCoins(response.user.coins || 0);
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
        setPlayerCoins(response.user.coins || 0);
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
    // Clear leaderboard and profile local caches
    localStorage.removeItem('user_stats_cache');
    localStorage.removeItem('user_rank_num_cache');
    localStorage.removeItem('user_profile_cache_time');
    localStorage.removeItem('leaderboard_cache');
    localStorage.removeItem('leaderboard_total_cache');
    localStorage.removeItem('leaderboard_user_rank_cache');
    localStorage.removeItem('leaderboard_cache_time');
    setUserStats({ total_games: 0, wins: 0, losses: 0, highest_score: 0, win_rate: 0, total_playtime: 0 });
    setUserRankNum(null);
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
      const roomSlug = currentRoomInfo.roomName 
        ? currentRoomInfo.roomName.toLowerCase().replace(/\s+/g, '-') 
        : currentRoomInfo.roomId;
      navigate(`/room/${roomSlug}`);
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
    
    // Set initial custom seed
    let initialCustomSeed = '';
    const initialAvatarUrl = playerPicture;
    if (initialAvatarUrl && initialAvatarUrl.startsWith('avatar-adventurer-')) {
      initialCustomSeed = initialAvatarUrl.replace('avatar-adventurer-', '');
    } else if (initialAvatarUrl && initialAvatarUrl.startsWith('avatar-')) {
      initialCustomSeed = initialAvatarUrl.replace('avatar-', '');
    } else {
      initialCustomSeed = playerName;
    }
    setCustomSeed(initialCustomSeed);
    
    // Fetch latest profile data from server
    try {
      const response = await userAPI.getProfile();
      if (response.success) {
        const finalAvatarUrl = response.user.avatar_url || playerPicture;
        setProfileData({
          name: response.user.name || playerName,
          username: response.user.username || '',
          email: response.user.email || playerEmail,
          birthdate: response.user.birthdate || '',
          avatar_url: finalAvatarUrl
        });
        
        let finalCustomSeed = '';
        if (finalAvatarUrl && finalAvatarUrl.startsWith('avatar-adventurer-')) {
          finalCustomSeed = finalAvatarUrl.replace('avatar-adventurer-', '');
        } else if (finalAvatarUrl && finalAvatarUrl.startsWith('avatar-')) {
          finalCustomSeed = finalAvatarUrl.replace('avatar-', '');
        } else {
          finalCustomSeed = response.user.name || playerName;
        }
        setCustomSeed(finalCustomSeed);
        
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
                leaderboard.slice(0, 2).map((player, index) => (
                  <div key={player.user_id || index} className={`leaderboard-item ${player.user_id === userId ? 'current-user' : ''}`}>
                    <div className={`rank rank-${index + 1}`}>
                      {index === 0 ? <Medal size={18} color="#000000" fill="#FFD700" style={{ filter: 'drop-shadow(1.5px 1.5px 0px rgba(0,0,0,0.2))' }} /> : index === 1 ? <Medal size={18} color="#000000" fill="#C0C0C0" style={{ filter: 'drop-shadow(1.5px 1.5px 0px rgba(0,0,0,0.2))' }} /> : index === 2 ? <Medal size={18} color="#000000" fill="#CD7F32" style={{ filter: 'drop-shadow(1.5px 1.5px 0px rgba(0,0,0,0.2))' }} /> : `#${player.rank}`}
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
              
              {/* Show current user position if not in top 2 */}
              {currentUserRank && currentUserRank.rank > 2 && isLoggedIn && (
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
              
              <button className="see-more-btn" onClick={() => { setLeaderboardLimit(5); setShowLeaderboardModal(true); }}>
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
            <LogIn size={24} />
          </div>
          <span className="login-text">Login</span>
        </div>
      ) : (
        <div 
          className="profile-section logged-in"
          onMouseEnter={() => setShowScorePopup(true)}
          onMouseLeave={() => setShowScorePopup(false)}
        >
          <div className="profile-avatar" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            {renderAvatar(playerPicture, 45, playerName)}
          </div>
          <div className="profile-info" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            <span className="profile-name">{playerName}</span>
            <div className="profile-details-row">
              <span className="profile-level">
                {userRankNum ? `Rank #${userRankNum}` : 'Unranked'} · {userStats.wins}W/{userStats.losses}L
              </span>
              <span className="profile-coins" title="Your Coins">
                <Coins size={12} className="coin-icon" />
                <span className="coin-value">{playerCoins.toLocaleString()}</span>
              </span>
            </div>
          </div>
          <button 
            className={`stats-toggle-btn ${showScorePopup ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowScorePopup(!showScorePopup);
            }}
            title="Quick Stats"
          >
            <TrendingUp size={14} />
          </button>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={16} />
          </button>

          {showScorePopup && (
            <div className="profile-score-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-suits-bg">♠ ♥ ♦ ♣</div>
              <div className="popup-header">
                <Crown size={16} className="popup-header-icon" />
                <span>Quick Stats</span>
              </div>
              <div className="popup-body">
                <div className="popup-stat-row popup-coin-row animate-pop">
                  <span className="popup-stat-label"><Coins size={14} className="coin-icon spinning-coin" /> Balance</span>
                  <span className="popup-stat-val val-coins">{playerCoins.toLocaleString()} <span className="coin-suffix">coins</span></span>
                </div>
                <div className="popup-stat-row">
                  <span className="popup-stat-label">Highest Score</span>
                  <span className="popup-stat-val val-score">{userStats.highest_score || 0}</span>
                </div>
                <div className="popup-stat-row">
                  <span className="popup-stat-label">Win Rate</span>
                  <span className="popup-stat-val val-winrate">{userStats.win_rate || 0}%</span>
                </div>
                <div className="popup-stat-row">
                  <span className="popup-stat-label">Total Games</span>
                  <span className="popup-stat-val">{userStats.total_games || 0}</span>
                </div>
                <div className="popup-stat-row">
                  <span className="popup-stat-label">Record</span>
                  <span className="popup-stat-val val-record">{userStats.wins || 0}W / {userStats.losses || 0}L</span>
                </div>
                <div className="popup-winrate-bar-wrap">
                  <div className="popup-winrate-bar">
                    <div className="popup-winrate-bar-fill" style={{ width: `${userStats.win_rate || 0}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="popup-footer" onClick={handleProfileClick}>
                <span>Full Profile & Edit →</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Profile Modal - Redesigned with Tabs */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal-v2" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowProfileModal(false)}>
              <X size={24} />
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
                <User size={16} />
                Edit Info
              </button>
              <button 
                className={`pm-tab ${profileTab === 'stats' ? 'active' : ''}`}
                onClick={() => setProfileTab('stats')}
              >
                <BarChart2 size={16} />
                Stats
              </button>
              <button 
                className={`pm-tab ${profileTab === 'avatar' ? 'active' : ''}`}
                onClick={() => setProfileTab('avatar')}
              >
                <ImageIcon size={16} />
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
                      style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#777777', border: '2.5px solid #000000', opacity: 0.85 }}
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
                        <Gamepad2 size={24} />
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value">{userStats.total_games}</span>
                        <span className="pm-sc-label">Total Games Played</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(16, 185, 129, 0.2)', color: '#34d399'}}>
                        <Star size={24} />
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value pm-wins">{userStats.wins}</span>
                        <span className="pm-sc-label">Victories</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(239, 68, 68, 0.2)', color: '#f87171'}}>
                        <X size={24} />
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value pm-losses">{userStats.losses}</span>
                        <span className="pm-sc-label">Defeats</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24'}}>
                        <TrendingUp size={24} />
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value pm-highscore">{userStats.highest_score}</span>
                        <span className="pm-sc-label">Highest Score</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(96, 165, 250, 0.2)', color: '#60a5fa'}}>
                        <BarChart2 size={24} />
                      </div>
                      <div className="pm-sc-info">
                        <span className="pm-sc-value pm-winrate">{userStats.win_rate}%</span>
                        <span className="pm-sc-label">Win Rate</span>
                      </div>
                    </div>

                    <div className="pm-stat-card">
                      <div className="pm-sc-icon" style={{background: 'rgba(244, 114, 182, 0.2)', color: '#f472b6'}}>
                        <Hash size={24} />
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
                  
                  <div className="pm-avatar-custom-section">
                    <div className="pm-avatar-divider">
                      <span>OR CREATE A CUSTOM ADVENTURER</span>
                    </div>
                    <div className="pm-custom-avatar-generator">
                      <div className="pm-custom-avatar-preview">
                        <AvatarSVG avatarId={`avatar-adventurer-${customSeed || 'Felix'}`} size={70} />
                      </div>
                      <div className="pm-custom-avatar-controls">
                        <span className="pm-custom-avatar-label">Adventurer Seed Name</span>
                        <div className="pm-custom-avatar-input-wrapper">
                          <input 
                            type="text" 
                            className="pm-custom-avatar-input"
                            placeholder="Type a name to generate..."
                            value={customSeed}
                            onChange={handleCustomSeedChange}
                          />
                          <button 
                            type="button" 
                            className="pm-custom-avatar-random-btn"
                            onClick={handleRandomizeSeed}
                          >
                            <Sparkles size={14} /> Random
                          </button>
                        </div>
                        <p className="pm-custom-avatar-hint">
                          Any name dynamically styles a completely unique custom adventurer look!
                        </p>
                      </div>
                    </div>
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
              <X size={20} />
            </div>
            <div className="modal-header">
              <div className="modal-title-icon">
                <Gamepad2 size={20} />
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
                  <Plus size={18} />
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
                  <Search size={18} />
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
                  <Bot size={18} />
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
                  <Zap size={18} />
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
              <X size={24} />
            </div>
            <div className="cm-scroll-body">
            <div className="cm-header">
              <div className="cm-header-icon">
                <Settings size={28} />
              </div>
              <h2>Room Configuration</h2>
              <p className="modal-subtitle">Set up your game preferences</p>
            </div>
            
            <div className="custom-match-form">
              {/* Max Points Selector */}
              <div className="form-group">
                <label>
                  <span className="label-icon">
                    <Clock size={18} />
                  </span>
                  Points to Win
                </label>
                <div className="custom-chips-grid">
                  {[10, 20, 30, 40].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      className={`chip-select-btn ${customMatchConfig.maxPoints === pts ? 'active' : ''} chip-${pts}`}
                      onClick={() => setCustomMatchConfig({ ...customMatchConfig, maxPoints: pts })}
                    >
                      <span className="chip-points">{pts}</span>
                      <span className="chip-label">
                        {pts === 10 && <><Zap size={13} /> <span>Blitz</span></>}
                        {pts === 20 && <><Flame size={13} /> <span>Quick</span></>}
                        {pts === 30 && <><Sparkles size={13} /> <span>Classic</span></>}
                        {pts === 40 && <><Trophy size={13} /> <span>Epic</span></>}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Number of Players Selector */}
              <div className="form-group">
                <label>
                  <span className="label-icon">
                    <Users size={18} />
                  </span>
                  Player Count
                </label>
                <div className="player-badges-row">
                  {[2, 3, 4, 5, 6, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`player-badge-btn ${customMatchConfig.numPlayers === num ? 'active' : ''} player-${num}`}
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
                    <Shield size={18} />
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
                      <Globe size={20} />
                    </div>
                    <div className="v-card-text">
                      <h4>Public Lobby</h4>
                      <p>Listed publicly. Anyone can join from search.</p>
                    </div>
                    <div className="v-card-check"><Check size={16} /></div>
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
                      <Lock size={20} />
                    </div>
                    <div className="v-card-text">
                      <h4>Private Room</h4>
                      <p>Hidden lobby. Require Room Code to enter.</p>
                    </div>
                    <div className="v-card-check"><Check size={16} /></div>
                  </button>
                </div>
              </div>

              {/* Room Code Panel */}
              {customMatchConfig.isPrivate && (
                <div className="form-group room-code-group">
                  <label>
                    <span className="label-icon">
                      <Hash size={18} />
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
                          <Check size={14} style={{color: '#34d399'}} />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
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
                    <div className="ticket-value">
                      <span className="ticket-value-item">
                        {customMatchConfig.maxPoints === 10 && <><Zap size={14} /> <span>Blitz</span></>}
                        {customMatchConfig.maxPoints === 20 && <><Flame size={14} /> <span>Quick</span></>}
                        {customMatchConfig.maxPoints === 30 && <><Sparkles size={14} /> <span>Classic</span></>}
                        {customMatchConfig.maxPoints === 40 && <><Trophy size={14} /> <span>Epic</span></>}
                      </span>
                      <span className="ticket-value-divider">•</span>
                      <span className="ticket-value-item">
                        <Users size={14} /> <span>{customMatchConfig.numPlayers === 2 ? 'Duel' : 
                         customMatchConfig.numPlayers <= 4 ? 'Standard' : 'Party'} ({customMatchConfig.numPlayers} Players)</span>
                      </span>
                      <span className="ticket-value-divider">•</span>
                      <span className="ticket-value-item">
                        {customMatchConfig.isPrivate ? <><Lock size={14} /> <span>Private</span></> : <><Globe size={14} /> <span>Public</span></>}
                      </span>
                    </div>
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
                    <Play size={20} />
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
              <X size={20} />
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
                      <User className="lm-input-icon" size={16} />
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
            <span className="hero-chip chip-users">
              <Users size={14} />
              2-7 Players
            </span>
            <span className="hero-chip chip-zap">
              <Zap size={14} />
              Quick Rounds
            </span>
            <span className="hero-chip chip-star">
              <Star size={14} />
              Free to Play
            </span>
          </div>
          <div className="hero-actions">
            <button className="hero-play-btn" onClick={handlePlay}>
              <span className="hero-btn-glow"></span>
              <span className="hero-play-icon"><Play size={18} fill="currentColor" /></span>
              <span>PLAY NOW</span>
            </button>
            <Link className="hero-rules-btn" to="/rules">
              <BookOpen size={18} />
              <span>RULES</span>
            </Link>
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
              <X size={24} />
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
              {leaderboard.slice(0, leaderboardLimit).map((player, index) => (
                <div key={player.user_id || index} className={`lb-modal-item ${player.user_id === userId ? 'current-user' : ''}`}>
                  <span className="lb-col-rank">
                    {index === 0 ? <Medal size={18} color="#000000" fill="#FFD700" style={{ filter: 'drop-shadow(1.5px 1.5px 0px rgba(0,0,0,0.2))' }} /> : index === 1 ? <Medal size={18} color="#000000" fill="#C0C0C0" style={{ filter: 'drop-shadow(1.5px 1.5px 0px rgba(0,0,0,0.2))' }} /> : index === 2 ? <Medal size={18} color="#000000" fill="#CD7F32" style={{ filter: 'drop-shadow(1.5px 1.5px 0px rgba(0,0,0,0.2))' }} /> : `#${player.rank}`}
                  </span>
                  <span className="lb-col-player">
                    <span className="lb-avatar-mini">{renderAvatar(player.avatar_url, 28, player.name)}</span>
                    <span className="lb-player-name-text">
                      {player.user_id === userId ? 'You' : (player.name || 'Anonymous')}
                    </span>
                  </span>
                  <span className="lb-col-stat">{player.wins}</span>
                  <span className="lb-col-stat">{player.win_rate}%</span>
                  <span className="lb-col-stat">{player.highest_score || 0}</span>
                </div>
              ))}
              
              {currentUserRank && currentUserRank.rank > leaderboardLimit && isLoggedIn && (
                <>
                  <div className="leaderboard-divider">···</div>
                  <div className="lb-modal-item current-user">
                    <span className="lb-col-rank">#{currentUserRank.rank}</span>
                    <span className="lb-col-player">
                      <span className="lb-avatar-mini">{renderAvatar(playerPicture, 28, playerName)}</span>
                      <span className="lb-player-name-text">You</span>
                    </span>
                    <span className="lb-col-stat">{currentUserRank.wins}</span>
                    <span className="lb-col-stat">{currentUserRank.win_rate}%</span>
                    <span className="lb-col-stat">{currentUserRank.highest_score || 0}</span>
                  </div>
                </>
              )}
            </div>

            {leaderboard.length > leaderboardLimit && (
              <button 
                className="lb-show-more-btn"
                onClick={() => {
                  if (leaderboardLimit === 5) {
                    setLeaderboardLimit(10);
                  } else {
                    setLeaderboardLimit(prev => Math.min(100, prev + 10));
                  }
                }}
              >
                Show More
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating About Button */}
      <div className="about-button-container">
        <Link className="home-about-btn" to="/about" title="About LowXena">
          <Info size={16} />
          <span>About</span>
        </Link>
      </div>

      {/* Footer */}
      <div className="home-footer">
        <span>made by <a href="https://dharmikgohil.art/" target="_blank" rel="noopener noreferrer">dharmikgohil.art</a></span>
      </div>
    </div>
    </GoogleOAuthProvider>
  )
}

export default Home
