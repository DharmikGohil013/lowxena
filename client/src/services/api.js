import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
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
  // Get user profile
  getProfile: async (userId) => {
    try {
      const response = await apiClient.get(`/user/profile/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    try {
      const response = await apiClient.put(`/user/profile`, updates);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user stats
  getStats: async (userId) => {
    try {
      const response = await apiClient.get(`/user/stats/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

// Game API
export const gameAPI = {
  // Get leaderboard
  getLeaderboard: async (limit = 10) => {
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

  // Get game history
  getHistory: async (userId, limit = 10) => {
    try {
      const response = await apiClient.get(`/game/history/${userId}?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default apiClient;
