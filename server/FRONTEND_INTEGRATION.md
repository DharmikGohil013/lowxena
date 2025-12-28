# 🔌 Connect Frontend to Backend

Guide to integrate the React frontend with Supabase backend

---

## 📋 What You Need

1. ✅ Backend server running (port 3000)
2. ✅ Frontend running (port 5174)
3. ✅ Supabase project created
4. ✅ Google OAuth configured

---

## 🚀 Frontend Integration Steps

### Step 1: Install Supabase Client in Frontend

```bash
cd client
npm install @supabase/supabase-js axios
```

### Step 2: Create Supabase Config

Create `client/src/config/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 3: Create API Service

Create `client/src/services/api.js`:

```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  googleLogin: (token) => api.post('/auth/google', { token }),
  logout: () => api.post('/auth/logout'),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getStats: () => api.get('/user/stats'),
};

export const gameAPI = {
  getLeaderboard: (limit = 10) => api.get(`/game/leaderboard?limit=${limit}`),
  saveScore: (data) => api.post('/game/score', data),
  getHistory: () => api.get('/game/history'),
};

export default api;
```

### Step 4: Update Environment Variables

Create `client/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:3000/api
```

### Step 5: Update Home.jsx

Replace the Google login success handler:

```javascript
import { authAPI } from '../services/api';

const handleGoogleSuccess = async (credentialResponse) => {
  try {
    // Send Google token to backend
    const response = await authAPI.googleLogin(credentialResponse.credential);
    
    if (response.data.success) {
      const { user, session } = response.data;
      
      // Store user data
      setPlayerName(user.name);
      setPlayerEmail(user.email);
      setPlayerPicture(user.avatar_url);
      setIsLoggedIn(true);
      
      // Store session token
      if (session?.access_token) {
        localStorage.setItem('access_token', session.access_token);
      }
      
      setShowLoginModal(false);
      console.log('Login successful:', user);
    }
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed. Please try again.');
  }
};
```

### Step 6: Add Logout Handler

```javascript
const handleLogout = async () => {
  try {
    await authAPI.logout();
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setPlayerName('');
    setPlayerEmail('');
    setPlayerPicture('');
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

---

## 🎮 Using the API

### Get User Profile

```javascript
import { userAPI } from '../services/api';

const loadProfile = async () => {
  try {
    const response = await userAPI.getProfile();
    console.log('Profile:', response.data.user);
  } catch (error) {
    console.error('Error loading profile:', error);
  }
};
```

### Save Game Score

```javascript
import { gameAPI } from '../services/api';

const saveScore = async (score, level, duration) => {
  try {
    const response = await gameAPI.saveScore({
      score,
      level,
      duration
    });
    console.log('Score saved:', response.data);
  } catch (error) {
    console.error('Error saving score:', error);
  }
};
```

### Get Leaderboard

```javascript
import { gameAPI } from '../services/api';

const loadLeaderboard = async () => {
  try {
    const response = await gameAPI.getLeaderboard(10);
    console.log('Leaderboard:', response.data.leaderboard);
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
};
```

---

## 🔄 Complete Authentication Flow

```
1. User clicks "Login" → Google popup opens
2. User selects Google account
3. Google returns JWT token
4. Frontend sends token to backend: POST /api/auth/google
5. Backend verifies token with Google
6. Backend creates/updates user in database
7. Backend returns user data + session token
8. Frontend stores token in localStorage
9. Frontend uses token for authenticated requests
```

---

## 📝 Full Example Component

```javascript
import { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { authAPI, userAPI, gameAPI } from '../services/api';

function GameComponent() {
  const [user, setUser] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await authAPI.googleLogin(credentialResponse.credential);
      if (response.data.success) {
        setUser(response.data.user);
        localStorage.setItem('access_token', response.data.session.access_token);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const response = await gameAPI.getLeaderboard(10);
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSaveScore = async (score) => {
    try {
      await gameAPI.saveScore({ score, level: 1, duration: 120 });
      loadLeaderboard(); // Refresh leaderboard
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  return (
    <div>
      {!user ? (
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => console.log('Login Failed')}
        />
      ) : (
        <div>
          <h2>Welcome, {user.name}!</h2>
          <button onClick={() => handleSaveScore(1000)}>
            Save Test Score
          </button>
        </div>
      )}

      <div>
        <h3>Leaderboard</h3>
        {leaderboard.map((entry, index) => (
          <div key={index}>
            {entry.rank}. {entry.name} - {entry.score}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## ✅ Testing Checklist

### Backend Tests:
- [ ] Server running on port 3000
- [ ] Health check: http://localhost:3000
- [ ] Leaderboard: http://localhost:3000/api/game/leaderboard

### Frontend Tests:
- [ ] Google login works
- [ ] User data displayed
- [ ] Token stored in localStorage
- [ ] Profile loads from backend
- [ ] Score saves successfully
- [ ] Leaderboard displays

---

## 🐛 Common Issues

### CORS Error
**Problem:** "Access blocked by CORS policy"

**Solution:** Make sure backend `.env` has:
```env
CLIENT_URL=http://localhost:5174
```

### 401 Unauthorized
**Problem:** API returns 401

**Solution:** 
- Check if token is in localStorage
- Verify token hasn't expired
- Check Authorization header format

### Connection Refused
**Problem:** Cannot connect to backend

**Solution:**
- Ensure backend server is running
- Check `VITE_API_URL` in frontend `.env`
- Verify port 3000 is accessible

---

## 🚀 Production Deployment

### Update Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
```

**Frontend (.env.production):**
```env
VITE_API_URL=https://your-backend-api.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
```

---

## 📚 Next Steps

1. ✅ Test authentication flow
2. ✅ Implement game logic
3. ✅ Add leaderboard display
4. ✅ Add profile page
5. ✅ Deploy to production

---

**Happy Coding! 🎮**
