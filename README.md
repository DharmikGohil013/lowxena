# 🎮 LowXena Game
Style: modern flat design with 
bright pop-art colors — electric yellow, hot pink, cyan blue, and white.
A modern full-stack gaming platform with React frontend and Node.js backend powered by Supabase PostgreSQL.

## 🚀 Features

- 🔐 **Google OAuth Authentication** - Secure login
- 🎨 **Beautiful Animated UI** - Particles, stars, gradients
- 👤 **User Profiles** - Track stats and progress
- 🏆 **Leaderboard System** - Compete with players
- 💾 **PostgreSQL Database** - Powered by Supabase
- ⚡ **RESTful API** - 12 endpoints ready
- 📱 **Responsive Design** - Works everywhere

---

## 📁 Project Structure

```
lowxena/
├── client/              # React Frontend (Vite)
│   ├── src/
│   │   ├── pages/      # Home, Game pages
│   │   ├── assets/     # Images, icons
│   │   └── App.jsx     # Main component
│   └── 📚 5 Documentation files
│
└── server/             # Node.js Backend (Express)
    ├── config/         # Supabase setup
    ├── controllers/    # Business logic
    ├── middleware/     # Auth & errors
    ├── routes/         # API endpoints
    ├── database/       # SQL schema
    └── 📚 5 Documentation files
```

---

## ⚡ Quick Start

### Frontend Setup (Client)
```bash
cd client
npm install
npm run dev
```
Frontend runs at: **http://localhost:5174**

📖 **See:** [client/QUICK_START.md](client/QUICK_START.md)

### Backend Setup (Server)
```bash
cd server
npm install
cp .env.example .env
# Add Supabase credentials to .env
npm run dev
```
Backend runs at: **http://localhost:3000**

📖 **See:** [server/QUICK_START.md](server/QUICK_START.md)

---

## 🔑 Prerequisites

1. **Node.js** (v18+)
2. **Supabase Account** (free tier works)
3. **Google OAuth Client ID** (for login)

### Get Supabase Credentials:
1. Create project at [supabase.com](https://supabase.com)
2. Run [server/database/schema.sql](server/database/schema.sql) in SQL Editor
3. Get API keys from Settings → API

### Get Google OAuth:
1. Create project at [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth Client ID
3. Add `http://localhost:5174` to authorized origins

---

## 📚 Documentation

### Frontend Documentation:
- [client/QUICK_START.md](client/QUICK_START.md) - 5-minute setup
- [client/GOOGLE_OAUTH_SETUP.md](client/GOOGLE_OAUTH_SETUP.md) - Google login
- [client/OAUTH_FLOW_EXPLAINED.md](client/OAUTH_FLOW_EXPLAINED.md) - How it works
- [client/HOME_PAGE.md](client/HOME_PAGE.md) - Features
- [client/README.md](client/README.md) - Full docs

### Backend Documentation:
- [server/START_HERE.md](server/START_HERE.md) - **START HERE** ⭐
- [server/QUICK_START.md](server/QUICK_START.md) - 5-minute setup
- [server/SETUP_GUIDE.md](server/SETUP_GUIDE.md) - Detailed guide
- [server/FRONTEND_INTEGRATION.md](server/FRONTEND_INTEGRATION.md) - Connect
- [server/README.md](server/README.md) - Full docs

---

## 🎯 Tech Stack

### Frontend:
- **React** 19.2.0 - UI library
- **Vite** 7.2.4 - Build tool
- **React Router** - Navigation
- **@react-oauth/google** - Google login
- **CSS3** - Animations

### Backend:
- **Node.js** - Runtime
- **Express** 4.18.2 - Web framework
- **Supabase** - Database & auth
- **PostgreSQL** - Database
- **JWT** - Token auth
- **CORS** - Cross-origin

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/google` - Login with Google
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify` - Verify token

### User Management
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/stats` - Get statistics
- `POST /api/user/stats` - Update stats

### Game Operations
- `GET /api/game/leaderboard` - Top players
- `POST /api/game/score` - Save score
- `GET /api/game/history` - Game history
- `GET /api/game/settings` - Settings

---

## 🗄️ Database Schema

### Tables:
- **users** - User accounts & profiles
- **user_stats** - Game statistics
- **game_history** - All game sessions
- **leaderboard** - Top scores
- **game_settings** - Configuration

See: [server/database/schema.sql](server/database/schema.sql)

---

## 🚀 Deployment

### Frontend (Vercel/Netlify):
```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway):
```bash
cd server
# Set environment variables
# Deploy via Git
```

---

## 🔐 Security

- ✅ JWT authentication
- ✅ Google OAuth 2.0
- ✅ Row Level Security (RLS)
- ✅ Environment variables
- ✅ CORS protection
- ✅ Input validation
- ✅ Token expiration

---

## 🐛 Troubleshooting

### Frontend Issues:
- Check Google Client ID is set
- Verify Supabase URL is correct
- Clear browser cache
- Check console for errors

### Backend Issues:
- Verify .env file exists
- Check Supabase credentials
- Ensure port 3000 is available
- Run database schema

---

## 📦 Installation

### Clone Repository:
```bash
git clone https://github.com/yourusername/lowxena.git
cd lowxena
```

### Install All Dependencies:
```bash
# Install frontend
cd client && npm install

# Install backend
cd ../server && npm install
```

### Configure:
```bash
# Frontend
cd client
# Add Google Client ID to src/pages/Home.jsx

# Backend
cd server
cp .env.example .env
# Add Supabase credentials to .env
```

### Run:
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

---

## 🎮 How to Use

1. **Start both servers** (frontend & backend)
2. **Open** http://localhost:5174
3. **Click Login** in top right
4. **Sign in with Google**
5. **Click Play** to start game
6. **Your scores are saved** automatically!

---

## 👨‍💻 Author

**Dharmik Gohil**

---

## 📄 License

MIT

---

## 🆘 Support

- Frontend Issues: See [client/README.md](client/README.md)
- Backend Issues: See [server/README.md](server/README.md)
- Supabase: https://supabase.com/docs
- Google OAuth: https://developers.google.com/identity

---

## ✅ What's Included

### ✨ Frontend:
- ✅ Home page with animations
- ✅ Google OAuth login
- ✅ User profile display
- ✅ Responsive design
- ✅ Routing system

### ⚡ Backend:
- ✅ RESTful API (12 endpoints)
- ✅ User authentication
- ✅ Profile management
- ✅ Game statistics
- ✅ Leaderboard system
- ✅ PostgreSQL database

### 📚 Documentation:
- ✅ 10+ markdown guides
- ✅ Setup instructions
- ✅ API documentation
- ✅ Code examples
- ✅ Troubleshooting

---

## 🎯 Next Steps

1. ☐ Complete Supabase setup
2. ☐ Add Google OAuth credentials
3. ☐ Start both servers
4. ☐ Test login flow
5. ☐ Implement game logic
6. ☐ Deploy to production

---

**Made with ❤️ for LowXena Game**  
**Powered by React, Node.js, and Supabase**

🎮 **Happy Gaming!** 🎮
card-game
## License
All rights reserved.

This project and its source code are the exclusive property of
Xenaplay Studio. Unauthorized copying, modification, distribution,
or commercial use is strictly prohibited.
