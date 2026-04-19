import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
      normalized.message = data.message || error.response.statusText || normalized.message;
      normalized.code = data.code || `ERR_HTTP_${error.response.status}`;
      normalized.status = error.response.status;
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
    try {
      const response = await apiClient.post('/auth/google', { token: credential });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Guest login
  guestLogin: async (name) => {
    try {
      const response = await apiClient.post('/auth/guest', { name });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  },

  // Get current user data
  getCurrentUser: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
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
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user profile
  updateProfile: async (updates) => {
    try {
      const response = await apiClient.put(`/user/profile`, updates);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user stats
  getStats: async () => {
    try {
      const response = await apiClient.get('/user/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user stats after a game
  updateStats: async (gameResult) => {
    try {
      const response = await apiClient.post('/user/stats', gameResult);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get available avatars
  getAvatars: async () => {
    try {
      const response = await apiClient.get('/user/avatars');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Game API
export const gameAPI = {
  // Get leaderboard with user position
  getLeaderboard: async (limit = 20) => {
    try {
      const response = await apiClient.get(`/game/leaderboard?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Save game score
  saveScore: async (scoreData) => {
    try {
      const response = await apiClient.post('/game/score', scoreData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Save multiplayer results for all players
  saveMultiplayerResults: async (data) => {
    try {
      const response = await apiClient.post('/game/multiplayer-results', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get game history
  getHistory: async (limit = 10) => {
    try {
      const response = await apiClient.get(`/game/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create room
  createRoom: async (config) => {
    try {
      const response = await apiClient.post('/game/create-room', config);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all available rooms
  getRooms: async () => {
    try {
      const response = await apiClient.get('/game/rooms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get room details
  getRoomDetails: async (roomId) => {
    try {
      const response = await apiClient.get(`/game/room/${roomId}`);
      return response.data;
    } catch (error) {
      const err = error.response?.data || { message: error.message };
      err.status = error.response?.status;
      throw err;
    }
  },

  // Join room
  joinRoom: async (roomId, code = null) => {
    try {
      const response = await apiClient.post(`/game/join-room/${roomId}`, { code });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Leave room
  leaveRoom: async (roomId) => {
    try {
      const response = await apiClient.post(`/game/leave-room/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Start game in room
  startGame: async (roomId) => {
    try {
      const response = await apiClient.post(`/game/start-game/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // End game and reset room to lobby
  endGame: async (roomId) => {
    try {
      const response = await apiClient.post(`/game/end-game/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Kick player from room
  kickPlayer: async (roomId, playerId) => {
    try {
      const response = await apiClient.post(`/game/kick-player/${roomId}`, { playerId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check if user is in any room
  checkUserRoom: async () => {
    try {
      const response = await apiClient.get('/game/check-room');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Toggle ready status
  toggleReady: async (roomId) => {
    try {
      const response = await apiClient.post(`/game/toggle-ready/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update game state
  updateGameState: async (roomId, gameState) => {
    try {
      const response = await apiClient.put(`/game/state/${roomId}`, gameState);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get game state
  getGameState: async (roomId) => {
    try {
      const response = await apiClient.get(`/game/state/${roomId}`);
      return response.data;
    } catch (error) {
      const err = error.response?.data || { message: error.message };
      err.status = error.response?.status;
      throw err;
    }
  },
};

export default apiClient;
