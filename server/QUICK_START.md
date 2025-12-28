# ⚡ QUICK START - Backend Server

Get your backend running in 5 minutes!

---

## 🎯 Quick Steps

### 1️⃣ Create Supabase Project
👉 Go to: https://supabase.com/dashboard

- Click "New Project"
- Name: `lowxena`
- Set database password
- Click "Create"

### 2️⃣ Run Database Schema
1. Open Supabase → **SQL Editor**
2. Copy all from `server/database/schema.sql`
3. Paste and click **Run**

### 3️⃣ Get API Keys
Go to **Settings** → **API** and copy:
- Project URL
- anon public key
- service_role key

### 4️⃣ Setup Backend
```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and paste your Supabase credentials.

### 5️⃣ Start Server
```bash
npm run dev
```

### 6️⃣ Test It
Open: http://localhost:3000

Should see:
```json
{
  "success": true,
  "message": "LowXena API Server is running! 🚀"
}
```

---

## ✅ You're Done!

API is running at: **http://localhost:3000**

### Available Endpoints:
- POST `/api/auth/google` - Google login
- GET `/api/user/profile` - User profile
- GET `/api/game/leaderboard` - Leaderboard
- POST `/api/game/score` - Save score

---

## 📚 Full Documentation
See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

---

**Next:** Connect your frontend to the backend! 🚀
