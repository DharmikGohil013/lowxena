# 🚀 SUPABASE BACKEND SETUP GUIDE

Complete guide to set up the LowXena backend with Supabase PostgreSQL

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Database Setup](#database-setup)
4. [Backend Configuration](#backend-configuration)
5. [Running the Server](#running-the-server)
6. [API Endpoints](#api-endpoints)
7. [Testing](#testing)

---

## 1️⃣ Prerequisites

### Required:
- Node.js (v18 or higher)
- npm or yarn
- Supabase account (free tier is fine)

---

## 2️⃣ Supabase Project Setup

### Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email

### Step 2: Create New Project
1. Click "New Project"
2. Fill in:
   - **Project name**: lowxena
   - **Database password**: (save this securely!)
   - **Region**: Choose closest to you
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### Step 3: Get API Credentials
1. Go to **Project Settings** (⚙️ icon)
2. Click **API** in sidebar
3. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - ⚠️ Keep secret!

---

## 3️⃣ Database Setup

### Step 1: Open SQL Editor
1. In Supabase Dashboard, click **SQL Editor**
2. Click **New Query**

### Step 2: Run Schema Creation
1. Copy entire content from `server/database/schema.sql`
2. Paste into SQL Editor
3. Click **Run** (or press Ctrl+Enter)
4. Wait for "Success" message

### Step 3: Verify Tables Created
1. Click **Table Editor** in sidebar
2. You should see these tables:
   - ✅ users
   - ✅ user_stats
   - ✅ game_history
   - ✅ leaderboard
   - ✅ game_settings

### Step 4: Enable Authentication
1. Go to **Authentication** in sidebar
2. Click **Providers**
3. Enable **Google** provider:
   - Add your Google Client ID
   - Add your Google Client Secret
4. Click **Save**

---

## 4️⃣ Backend Configuration

### Step 1: Install Dependencies
```bash
cd server
npm install
```

This installs:
- express - Web framework
- @supabase/supabase-js - Supabase client
- cors - CORS middleware
- dotenv - Environment variables
- jsonwebtoken - JWT handling
- morgan - Request logging

### Step 2: Create .env File
```bash
cp .env.example .env
```

### Step 3: Update .env File
Open `server/.env` and fill in:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Client URL (your frontend)
CLIENT_URL=http://localhost:5174
```

**How to get values:**
- `SUPABASE_URL` → Supabase Dashboard → Settings → API → Project URL
- `SUPABASE_ANON_KEY` → Supabase Dashboard → Settings → API → anon public
- `SUPABASE_SERVICE_ROLE_KEY` → Supabase Dashboard → Settings → API → service_role
- `JWT_SECRET` → Generate random string (32+ characters)

### Step 4: Verify Configuration
```bash
npm start
```

You should see:
```
╔═══════════════════════════════════════╗
║   🎮 LowXena Server Running! 🎮      ║
╠═══════════════════════════════════════╣
║  Port: 3000                           ║
║  Environment: development             ║
║  API: http://localhost:3000           ║
╚═══════════════════════════════════════╝
✅ Supabase connection successful!
```

---

## 5️⃣ Running the Server

### Development Mode (with auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Test Server is Running
Open browser: http://localhost:3000

You should see:
```json
{
  "success": true,
  "message": "LowXena API Server is running! 🚀",
  "version": "1.0.0",
  "timestamp": "2025-12-28T..."
}
```

---

## 6️⃣ API Endpoints

### Authentication Endpoints

#### POST /api/auth/google
Login with Google OAuth
```bash
curl -X POST http://localhost:3000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "token": "google-jwt-token-here"
  }'
```

#### POST /api/auth/refresh
Refresh access token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "refresh-token-here"
  }'
```

#### POST /api/auth/logout
Logout user
```bash
curl -X POST http://localhost:3000/api/auth/logout
```

### User Endpoints (Require Authentication)

#### GET /api/user/profile
Get user profile
```bash
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### PUT /api/user/profile
Update user profile
```bash
curl -X PUT http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Name"
  }'
```

#### GET /api/user/stats
Get user statistics
```bash
curl http://localhost:3000/api/user/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Game Endpoints

#### GET /api/game/leaderboard
Get leaderboard (public)
```bash
curl http://localhost:3000/api/game/leaderboard?limit=10
```

#### POST /api/game/score
Save game score (requires auth)
```bash
curl -X POST http://localhost:3000/api/game/score \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "score": 1000,
    "level": 5,
    "duration": 300
  }'
```

#### GET /api/game/history
Get game history (requires auth)
```bash
curl http://localhost:3000/api/game/history \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 7️⃣ Testing

### Test 1: Health Check
```bash
curl http://localhost:3000
```

Expected response:
```json
{
  "success": true,
  "message": "LowXena API Server is running! 🚀"
}
```

### Test 2: Get Leaderboard
```bash
curl http://localhost:3000/api/game/leaderboard
```

### Test 3: Google Login Flow
1. Get Google token from frontend
2. Send to `/api/auth/google`
3. Receive user data and session token
4. Use token for authenticated requests

---

## 🎯 Project Structure

```
server/
├── config/
│   └── supabase.js          # Supabase client setup
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   └── gameController.js    # Game operations
├── middleware/
│   ├── auth.js             # JWT verification
│   └── errorHandler.js     # Error handling
├── routes/
│   ├── auth.js            # Auth routes
│   ├── user.js            # User routes
│   └── game.js            # Game routes
├── database/
│   └── schema.sql         # Database schema
├── .env                   # Environment variables
├── .env.example          # Env template
├── .gitignore           # Git ignore
├── index.js             # Main server file
└── package.json         # Dependencies
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Keep `SUPABASE_SERVICE_ROLE_KEY` secret
- Use environment variables
- Enable Row Level Security (RLS)
- Validate all inputs
- Use HTTPS in production

### ❌ DON'T:
- Commit `.env` file
- Share service role key
- Disable RLS in production
- Trust client-side data

---

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"
- Check `.env` file exists
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Restart server after updating `.env`

### Error: "Connection refused"
- Check if server is running
- Verify port 3000 is not in use
- Check firewall settings

### Error: "Invalid token"
- Token might be expired
- Use refresh token to get new access token
- Check token format (should be JWT)

### Error: "Table does not exist"
- Run `schema.sql` in Supabase SQL Editor
- Check table names match exactly
- Verify database connection

### Database queries not working
- Enable RLS policies in Supabase
- Check user authentication
- Verify table permissions

---

## 🚀 Production Deployment

### Environment Variables
Update for production:
```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-prod-project.supabase.co
CLIENT_URL=https://yourdomain.com
```

### Recommended Hosting
- **Heroku**: Easy deployment
- **Railway**: Modern platform
- **Vercel**: Serverless functions
- **AWS EC2**: Full control
- **DigitalOcean**: Simple VPS

### Deploy Steps
1. Push code to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Deploy!

---

## 📚 Next Steps

1. ✅ Complete Google OAuth setup in frontend
2. ✅ Connect frontend to backend API
3. ✅ Test authentication flow
4. ✅ Implement game logic
5. ✅ Add more features

---

## 🆘 Need Help?

- **Supabase Docs**: https://supabase.com/docs
- **Express Docs**: https://expressjs.com
- **Node.js Docs**: https://nodejs.org/docs

---

**Created for LowXena Game**  
Backend powered by Supabase PostgreSQL 🐘
