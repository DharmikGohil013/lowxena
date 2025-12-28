# 🚀 Quick Start - Google Login Setup

## ⚡ Fast Setup (5 minutes)

### 1️⃣ Get Your Google Client ID
👉 Go to: https://console.cloud.google.com/apis/credentials

**Quick steps:**
- Create project
- Create OAuth Client ID
- Add `http://localhost:5174` to authorized origins
- Copy the Client ID

### 2️⃣ Add Client ID to Your App
Open: `client/src/pages/Home.jsx`

Find and replace:
```javascript
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";
```

With your actual Client ID:
```javascript
const GOOGLE_CLIENT_ID = "123456789-xxxxx.apps.googleusercontent.com";
```

### 3️⃣ Done! Test It
```bash
npm run dev
```

Click Login → Sign in with Google ✅

---

## 📚 Full Documentation
See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed instructions.

## 🔧 What's Already Done
✅ Google OAuth library installed (`@react-oauth/google`)
✅ Login modal created with Google button
✅ User profile picture integration
✅ Logout functionality

## 🎯 What You Need to Do
1. Get Google Client ID from Google Cloud Console
2. Paste it in `Home.jsx` (line 16)
3. Test the login

That's it! 🎉
