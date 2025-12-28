# 🔐 Google OAuth Flow Explained

## How Google Login Works in Your App

```
┌─────────────────────────────────────────────────────────────────┐
│                     GOOGLE OAUTH FLOW                            │
└─────────────────────────────────────────────────────────────────┘

1. USER CLICKS "LOGIN"
   │
   ├─→ Your App shows login modal
   │
   └─→ User clicks "Sign in with Google" button

2. GOOGLE LOGIN POPUP
   │
   ├─→ Google opens authentication popup
   │
   ├─→ User selects Google account
   │
   └─→ User grants permissions

3. GOOGLE SENDS TOKEN
   │
   ├─→ Google returns JWT credential token
   │
   └─→ Token contains: name, email, picture, user ID

4. YOUR APP DECODES TOKEN
   │
   ├─→ App extracts user information
   │
   ├─→ Saves to state: playerName, playerEmail, playerPicture
   │
   └─→ Sets isLoggedIn = true

5. USER IS LOGGED IN
   │
   ├─→ Profile section shows user's photo and name
   │
   ├─→ User can click Play to start game
   │
   └─→ User can logout anytime
```

## What Happens in the Code

### 1. User Clicks Login
```javascript
handleLoginClick() → setShowLoginModal(true)
```

### 2. Google Login Component
```jsx
<GoogleLogin
  onSuccess={handleGoogleSuccess}  // Called when login succeeds
  onError={handleGoogleError}      // Called when login fails
/>
```

### 3. Success Handler
```javascript
handleGoogleSuccess(credentialResponse) {
  // 1. Get JWT token
  const token = credentialResponse.credential;
  
  // 2. Decode token to get user data
  const userData = decodeToken(token);
  
  // 3. Extract user info
  userData.name     → playerName
  userData.email    → playerEmail
  userData.picture  → playerPicture
  
  // 4. Update state
  setIsLoggedIn(true)
}
```

### 4. Display Profile
```jsx
{isLoggedIn && (
  <div className="profile-section">
    <img src={playerPicture} />
    <span>{playerName}</span>
  </div>
)}
```

## Security Features

### ✅ What's Secure
- **No password storage** - Google handles authentication
- **JWT tokens** - Cryptographically signed by Google
- **HTTPS only in production** - Encrypted communication
- **Short-lived tokens** - Automatically expire

### ⚠️ What You Should Know
- Tokens are validated on client-side only (sufficient for frontend apps)
- For backend APIs, verify tokens server-side
- Never expose Client Secret (we only use Client ID)

## Data Flow Diagram

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│   User   │────1───▶│ Your App │────2───▶│  Google  │
│          │         │          │         │  OAuth   │
└──────────┘         └──────────┘         └──────────┘
     ▲                    │                     │
     │                    │                     │
     │                    │        3. Token     │
     │                    │◀────────────────────┘
     │                    │
     │      4. Profile    │
     └────────────────────┘
```

### Step-by-Step:
1. **User clicks login** → App shows Google login button
2. **App requests auth** → Google shows account selection
3. **Google returns token** → Contains user information (JWT)
4. **App shows profile** → Decode token and display user data

## Common Scenarios

### ✅ Successful Login
```
User clicks login
  → Google popup opens
  → User selects account
  → Popup closes
  → Profile appears with user's photo and name
```

### ❌ Login Cancelled
```
User clicks login
  → Google popup opens
  → User closes popup
  → App shows error message
  → Login modal stays open
```

### 🔄 Logout
```
User clicks logout button
  → Clear user data
  → Show "Login" button again
  → User must re-authenticate next time
```

## Backend Integration (Optional)

If you need to verify the user on a backend server:

```javascript
// 1. Send token to your backend
fetch('/api/verify-google-token', {
  method: 'POST',
  body: JSON.stringify({ token: credentialResponse.credential })
})

// 2. Backend verifies token with Google
// 3. Backend creates session
// 4. Backend returns session token
```

This is **NOT required** for frontend-only authentication.

## Environment Variables

### Development
```env
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```

### Production
- Create separate OAuth client for production domain
- Use production Client ID
- Add production URL to authorized origins

---

For setup instructions, see [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)
