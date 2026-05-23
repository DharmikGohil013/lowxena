import axios from 'axios';

// If running in browser over HTTPS and VITE_API_URL is insecure HTTP, force /api to use the proxy
let rawApiUrl = import.meta.env.VITE_API_URL || '';
if (typeof rawApiUrl === 'string') rawApiUrl = rawApiUrl.replace(/^["']|["']$/g, '');
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const API_BASE_URL = (isHttps && rawApiUrl && rawApiUrl.includes('http://')) 
  ? '/api' 
  : (rawApiUrl || '/api');

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s timeout — triggers latency UI
});

// Add token to requests if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Attach request start time for latency tracking
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Normalize all error responses into a predictable shape
apiClient.interceptors.response.use(
  (response) => {
    // Attach latency to response for optional UI use
    if (response.config?.metadata?.startTime) {
      response.latencyMs = Date.now() - response.config.metadata.startTime;
    }
    return response;
  },
  (error) => {
    const normalized = {
      success: false,
      message: 'An unexpected error occurred',
      code: 'ERR_UNKNOWN',
      status: 0,
    };

    if (error.response) {
      // Server responded with an error status
      const data = error.response.data || {};
      normalized.message = data.error || data.message || error.response.statusText || normalized.message;
      normalized.code = data.code || `ERR_HTTP_${error.response.status}`;
      normalized.status = error.response.status;

      // Handle token expiration or invalidity (401 or 403)
      const isAuthError = normalized.status === 401 || normalized.status === 403;
      const isTokenExpired = normalized.message.toLowerCase().includes('token expired') || 
                            normalized.message.toLowerCase().includes('expired token') ||
                            normalized.message.toLowerCase().includes('invalid token') ||
                            normalized.message.toLowerCase().includes('token is required');

      if (isAuthError && isTokenExpired) {
        // Clear auth tokens from storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        
        // Gracefully redirect to the home page with a token expired flag
        if (typeof window !== 'undefined' && !window.location.search.includes('expired=true')) {
          window.location.href = '/?expired=true';
        }
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      normalized.message = 'Request timed out. Please check your connection.';
      normalized.code = 'ERR_TIMEOUT';
      normalized.status = 408;
    } else if (!navigator.onLine) {
      normalized.message = 'You are offline. Please check your internet connection.';
      normalized.code = 'ERR_OFFLINE';
      normalized.status = 0;
    } else {
      normalized.message = 'Network error. Server may be unreachable.';
      normalized.code = 'ERR_NETWORK';
      normalized.status = 0;
    }

    return Promise.reject(normalized);
  }
);

// Auth API
export const authAPI = {
  // Send Google credential to backend
  googleLogin: async (credential) => {
    const response = await apiClient.post('/auth/google', { token: credential });
    return response.data;
  },

  // Guest login
  guestLogin: async (name) => {
    const response = await apiClient.post('/auth/guest', { name });
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  },

  // Get current user data
  getCurrentUser: () => {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

// User API
export const userAPI = {
  // Get user profile with stats and rank
  getProfile: async () => {
    const response = await apiClient.get('/user/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (updates) => {
    const response = await apiClient.put(`/user/profile`, updates);
    return response.data;
  },

  // Get user stats
  getStats: async () => {
    const response = await apiClient.get('/user/stats');
    return response.data;
  },

  // Update user stats after a game
  updateStats: async (gameResult) => {
    const response = await apiClient.post('/user/stats', gameResult);
    return response.data;
  },

  // Get available avatars
  getAvatars: async () => {
    const response = await apiClient.get('/user/avatars');
    return response.data;
  },
};

// Game API
export const gameAPI = {
  // Get leaderboard with user position
  getLeaderboard: async (limit = 20) => {
    const response = await apiClient.get(`/game/leaderboard?limit=${limit}`);
    return response.data;
  },

  // Save game score
  saveScore: async (scoreData) => {
    const response = await apiClient.post('/game/score', scoreData);
    return response.data;
  },

  // Save multiplayer results for all players
  saveMultiplayerResults: async (data) => {
    const response = await apiClient.post('/game/multiplayer-results', data);
    return response.data;
  },

  // Get game history
  getHistory: async (limit = 10) => {
    const response = await apiClient.get(`/game/history?limit=${limit}`);
    return response.data;
  },

  // Create room
  createRoom: async (config) => {
    const response = await apiClient.post('/game/create-room', config);
    return response.data;
  },

  // Get all available rooms
  getRooms: async () => {
    const response = await apiClient.get('/game/rooms');
    return response.data;
  },

  // Get room details
  getRoomDetails: async (roomId) => {
    const response = await apiClient.get(`/game/room/${roomId}`);
    return response.data;
  },

  // Join room
  joinRoom: async (roomId, code = null) => {
    const response = await apiClient.post(`/game/join-room/${roomId}`, { code });
    return response.data;
  },

  // Leave room
  leaveRoom: async (roomId) => {
    const response = await apiClient.post(`/game/leave-room/${roomId}`);
    return response.data;
  },

  // Start game in room
  startGame: async (roomId) => {
    const response = await apiClient.post(`/game/start-game/${roomId}`);
    return response.data;
  },

  // End game and reset room to lobby
  endGame: async (roomId) => {
    const response = await apiClient.post(`/game/end-game/${roomId}`);
    return response.data;
  },

  // Kick player from room
  kickPlayer: async (roomId, playerId) => {
    const response = await apiClient.post(`/game/kick-player/${roomId}`, { playerId });
    return response.data;
  },

  // Check if user is in any room
  checkUserRoom: async () => {
    const response = await apiClient.get('/game/check-room');
    return response.data;
  },

  // Toggle ready status
  toggleReady: async (roomId) => {
    const response = await apiClient.post(`/game/toggle-ready/${roomId}`);
    return response.data;
  },

  // Update game state
  updateGameState: async (roomId, gameState) => {
    const response = await apiClient.put(`/game/state/${roomId}`, gameState);
    return response.data;
  },

  // Get game state
  getGameState: async (roomId) => {
    const response = await apiClient.get(`/game/state/${roomId}`);
    return response.data;
  },
};

export default apiClient;
