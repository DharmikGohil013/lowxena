import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import Loader from '../components/Loader'
import { authAPI, gameAPI, userAPI } from '../services/api'
import './Home.css'

// GOOGLE OAUTH SETUP INSTRUCTIONS:
// 1. Go to: https://console.cloud.google.com/
// 2. Create a new project or select existing one
// 3. Enable Google+ API
// 4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
// 5. Configure OAuth consent screen
// 6. Select "Web application" as Application type
// 7. Add Authorized JavaScript origins: http://localhost:5174
// 8. Add Authorized redirect URIs: http://localhost:5174
// 9. Copy the Client ID and paste it below
// 
// OPTION 1: Direct (Quick Start)
// Replace YOUR_GOOGLE_CLIENT_ID_HERE below with your actual Client ID

const GOOGLE_CLIENT_ID = "518498924842-oi9g8sm4f5st8p46nst3t2tk0nvofo6b.apps.googleusercontent.com";

// OPTION 2: Environment Variable (Recommended for Production)
// 1. Create .env file in client folder
// 2. Add: VITE_GOOGLE_CLIENT_ID=your_client_id_here
// 3. Uncomment the line below and comment out the line above:
// const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function Home() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
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
  const [saving, setSaving] = useState(false)
  const [showGameModeModal, setShowGameModeModal] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [userRank, setUserRank] = useState(null)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

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

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      try {
        const response = await gameAPI.getLeaderboard(5);
        if (response.success && response.leaderboard) {
          setLeaderboard(response.leaderboard);
          
          // If user is logged in, find their rank
          if (userId) {
            const fullLeaderboard = await gameAPI.getLeaderboard(1000);
            if (fullLeaderboard.success && fullLeaderboard.leaderboard) {
              const userIndex = fullLeaderboard.leaderboard.findIndex(
                player => player.id === userId
              );
              if (userIndex !== -1) {
                setUserRank({
                  rank: userIndex + 1,
                  ...fullLeaderboard.leaderboard[userIndex]
                });
              }
            }
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

  const handlePlay = () => {
    setShowGameModeModal(true)
  }

  const handleGameModeSelect = (mode) => {
    setShowGameModeModal(false)
    // Navigate to game with selected mode
    navigate('/game', { state: { mode } })
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
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.log('Login Failed');
    alert('Google login failed. Please try again.');
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsLoggedIn(false);
    setPlayerName('');
    setPlayerEmail('');
    setPlayerPicture('');
    setUserId('');
  }

  const handleProfileClick = () => {
    setProfileData({
      name: playerName,
      username: playerName,
      email: playerEmail,
      birthdate: '',
      avatar_url: playerPicture
    });
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
      const response = await userAPI.updateProfile(userId, profileData);
      
      if (response.success) {
        // Update local state
        setPlayerName(response.user.name || playerName);
        if (response.user.avatar_url) {
          setPlayerPicture(response.user.avatar_url);
        }
        
        // Update localStorage
        const userData = authAPI.getCurrentUser();
        const updatedUserData = { ...userData, ...response.user };
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        alert('Profile updated successfully!');
        setShowProfileModal(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
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
      </div>

      {/* Leaderboard Section - Top Left */}
      <div className="leaderboard-section">
        <div className="leaderboard-header">
          <h3>🏆 Leaderboard</h3>
        </div>
        <div className="leaderboard-content">
          {loadingLeaderboard ? (
            <div className="leaderboard-loading">Loading...</div>
          ) : (
            <>
              {leaderboard.map((player, index) => (
                <div key={player.id} className={`leaderboard-item ${player.id === userId ? 'current-user' : ''}`}>
                  <div className="rank">#{index + 1}</div>
                  <div className="player-info">
                    <img 
                      src={player.avatar_url || "/avatar.png"} 
                      alt={player.name}
                      className="player-avatar"
                      onError={(e) => e.target.src = "/avatar.png"}
                    />
                    <span className="player-name">{player.name || 'Anonymous'}</span>
                  </div>
                  <div className="score">{player.high_score || 0}</div>
                </div>
              ))}
              
              {userRank && userRank.rank > 5 && (
                <>
                  <div className="leaderboard-divider">...</div>
                  <div className="leaderboard-item current-user">
                    <div className="rank">#{userRank.rank}</div>
                    <div className="player-info">
                      <img 
                        src={playerPicture || "/avatar.png"} 
                        alt={playerName}
                        className="player-avatar"
                        onError={(e) => e.target.src = "/avatar.png"}
                      />
                      <span className="player-name">You</span>
                    </div>
                    <div className="score">{userRank.high_score || 0}</div>
                  </div>
                </>
              )}
              
              <button className="see-more-btn" onClick={() => navigate('/leaderboard')}>
                See More
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
            <img src={playerPicture || "/avatar.png"} alt="Profile" onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<span style="color: white; font-size: 24px; font-weight: bold;">${playerName.charAt(0).toUpperCase()}</span>`;
            }} />
          </div>
          <div className="profile-info" onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
            <span className="profile-name">{playerName}</span>
            <span className="profile-level">Level 1</span>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowProfileModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h2>Edit Profile</h2>
            <div className="profile-avatar-large">
              <img src={playerPicture || "/avatar.png"} alt="Profile" />
            </div>
            
            <div className="profile-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileInputChange}
                  placeholder="Enter your full name"
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
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  disabled
                  style={{ backgroundColor: '#2a2a2a', cursor: 'not-allowed' }}
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

              <div className="form-group">
                <label>Avatar URL</label>
                <input
                  type="text"
                  name="avatar_url"
                  value={profileData.avatar_url}
                  onChange={handleProfileInputChange}
                  placeholder="Enter avatar URL"
                />
              </div>

              <button 
                className="save-profile-btn" 
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
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
            <h2>Choose Game Mode</h2>
            <p>Select how you want to play</p>
            
            <div className="game-mode-options">
              <button 
                className="game-mode-btn create-custom"
                onClick={() => handleGameModeSelect('custom')}
              >
                <div className="mode-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </div>
                <h3>Create Custom Game</h3>
                <p>Set your own rules and invite friends</p>
              </button>

              <button 
                className="game-mode-btn join-bots"
                onClick={() => handleGameModeSelect('bots')}
              >
                <div className="mode-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h3>Join Fast with Bots</h3>
                <p>Practice with AI opponents</p>
              </button>

              <button 
                className="game-mode-btn fast-join"
                onClick={() => handleGameModeSelect('quick')}
              >
                <div className="mode-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <h3>Fast Join</h3>
                <p>Jump into a random game instantly</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-close" onClick={() => setShowLoginModal(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h2>Welcome to LowXena</h2>
            <p>Sign in with your Google account to start your gaming journey</p>
            
            <div className="google-login-container">
              {loading ? (
                <div style={{ position: 'relative', minHeight: '200px' }}>
                  <Loader message="Signing you in..." />
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Play Button - Bottom Left */}
      <div className="play-button-container">
        <button className="home-play-button" onClick={handlePlay}>
          <span className="play-icon">▶</span>
          <span className="play-text">PLAY</span>
          <div className="button-glow"></div>
        </button>
      </div>

      {/* Read Rules Button - Bottom Right */}
      <div className="rules-button-container">
        <button className="rules-button" onClick={() => navigate('/rules')}>
          <span className="rules-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              <line x1="10" y1="8" x2="16" y2="8"></line>
              <line x1="10" y1="12" x2="16" y2="12"></line>
              <line x1="10" y1="16" x2="14" y2="16"></line>
            </svg>
          </span>
          <span className="rules-text">READ RULES</span>
        </button>
      </div>

      {/* Game Title - Center (optional) */}
      <div className="game-title-center">
        <h1 className="title-text">LowXena</h1>
        <p className="subtitle-text">Where the Lowest Wins.</p>
      </div>
    </div>
    </GoogleOAuthProvider>
  )
}

export default Home
