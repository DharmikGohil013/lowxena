# Google OAuth Setup Guide for LowXena

## 📋 Prerequisites
- A Google account
- Access to Google Cloud Console

## 🚀 Step-by-Step Setup Instructions

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `LowXena` (or your preferred name)
5. Click **"Create"**

### Step 2: Enable Google+ API
1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"** or **"Google Identity"**
3. Click on it and press **"Enable"**

### Step 3: Configure OAuth Consent Screen
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: LowXena
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. On "Scopes" page, click **"Save and Continue"** (default scopes are fine)
7. On "Test users" page, add your email as a test user
8. Click **"Save and Continue"**

### Step 4: Create OAuth Client ID
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Select Application type: **"Web application"**
4. Enter name: `LowXena Web Client`
5. Add **Authorized JavaScript origins**:
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost:3000
   ```
6. Add **Authorized redirect URIs**:
   ```
   http://localhost:5173
   http://localhost:5174
   http://localhost:3000
   ```
7. Click **"Create"**
8. **Copy the Client ID** - you'll need this!

### Step 5: Configure Your Application

1. Open `client/src/pages/Home.jsx`
2. Find this line:
   ```javascript
   const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";
   ```
3. Replace `YOUR_GOOGLE_CLIENT_ID_HERE` with your actual Client ID
4. Save the file

Example:
```javascript
const GOOGLE_CLIENT_ID = "123456789-abcdefghijklmnop.apps.googleusercontent.com";
```

### Step 6: Test the Login
1. Start your development server:
   ```bash
   cd client
   npm run dev
   ```
2. Open the app in your browser
3. Click the "Login" button in the top right
4. Click "Sign in with Google"
5. Select your Google account
6. Grant permissions

## 🎯 What Gets Stored

After successful Google login, the app receives:
- **name**: User's full name
- **email**: User's email address
- **picture**: User's profile picture URL
- **sub**: Google User ID (unique identifier)

## 🔒 Security Notes

- Never commit your Client ID to public repositories
- For production, create a separate OAuth client
- Use environment variables for sensitive data
- Add your production domain to authorized origins

## 📝 Environment Variables (Optional but Recommended)

Create a `.env` file in the client directory:
```env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id_here
```

Then update `Home.jsx`:
```javascript
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
```

## 🌐 For Production Deployment

When deploying to production:
1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth client
3. Add your production URLs to:
   - Authorized JavaScript origins: `https://yourdomain.com`
   - Authorized redirect URIs: `https://yourdomain.com`
4. Update the Client ID in your production environment variables

## 🛠️ Troubleshooting

### Error: "redirect_uri_mismatch"
- Ensure your current URL is listed in Authorized redirect URIs
- Check for typos in the URLs
- Make sure to include the protocol (http:// or https://)

### Error: "popup_closed_by_user"
- User closed the popup - this is normal
- No action needed

### Error: "access_denied"
- User denied permission
- Check OAuth consent screen configuration
- Ensure user is added as a test user (for external apps)

### Login button not appearing
- Check browser console for errors
- Verify GOOGLE_CLIENT_ID is set correctly
- Ensure @react-oauth/google is installed

## 📦 Required Packages

Already installed in your project:
```json
{
  "@react-oauth/google": "latest"
}
```

## 🎨 Customization

The Google Login button can be customized with these props:
```jsx
<GoogleLogin
  theme="filled_black"  // or "outline", "filled_blue"
  size="large"          // or "medium", "small"
  text="signin_with"    // or "signup_with", "continue_with", "signin"
  shape="rectangular"   // or "pill", "circle", "square"
  logo_alignment="left" // or "center"
/>
```

---

Need help? Check the [official documentation](https://developers.google.com/identity/oauth2/web/guides/overview)
