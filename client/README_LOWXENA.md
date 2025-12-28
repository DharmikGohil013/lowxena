# LowXena Game Client

A modern gaming platform with Google OAuth authentication and stunning animations.

## ✨ Features

- 🎮 **Home Page** with animated background (stars, particles, gradients)
- 🔐 **Google OAuth Login** - Secure authentication
- 👤 **User Profiles** - Display name, email, and profile picture
- 🎨 **Beautiful UI** - Gradient effects, backdrop blur, smooth animations
- 📱 **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Google OAuth

**You need a Google Client ID to enable login!**

📖 **Quick Guide:** See [QUICK_START.md](./QUICK_START.md) (5 minutes)  
📚 **Full Guide:** See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) (detailed)

**TL;DR:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth Client ID
3. Add `http://localhost:5174` to authorized origins
4. Copy Client ID to `src/pages/Home.jsx` line 16

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:5174](http://localhost:5174)

## 📁 Project Structure

```
client/
├── src/
│   ├── pages/
│   │   ├── Home.jsx          # Landing page with login
│   │   ├── Home.css          # Home page styles
│   │   ├── Game.jsx          # Game page
│   │   └── Game.css          # Game page styles
│   ├── App.jsx               # Main app with routing
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles
├── public/
│   └── avatar.png            # Default avatar
└── package.json
```

## 🎯 Features Breakdown

### Home Page (`/`)
- **Background Animation**: Multi-layered with stars and particles
- **Play Button**: Bottom left - navigates to game
- **Profile Section**: Top right - shows login/user info

### Game Page (`/game`)
- Loads when user clicks Play button
- Shows game interface

## 🔐 Authentication

### Google OAuth Integration
- Uses `@react-oauth/google` library
- Secure JWT token-based authentication
- No password storage needed
- Profile picture automatically loaded

### How It Works
1. User clicks "Login"
2. Google popup opens
3. User signs in with Google account
4. App receives user info (name, email, picture)
5. Profile section displays user data

See [OAUTH_FLOW_EXPLAINED.md](./OAUTH_FLOW_EXPLAINED.md) for detailed flow.

## 🛠️ Technologies

- **React** 19.2.0 - UI framework
- **React Router DOM** - Navigation
- **@react-oauth/google** - Google authentication
- **Vite** - Build tool
- **CSS3** - Animations and styling

## 📝 Configuration

### Environment Variables (Optional)
Create `.env` file:
```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

See `.env.example` for template.

### Update Client ID
Edit `src/pages/Home.jsx`:
```javascript
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE";
```

## 🎨 Customization

### Google Login Button
Customize in `Home.jsx`:
```jsx
<GoogleLogin
  theme="filled_black"    // outline, filled_blue
  size="large"           // medium, small
  text="signin_with"     // signup_with, continue_with
  shape="rectangular"    // pill, circle
/>
```

### Styling
- Global styles: `src/index.css`
- Home page: `src/pages/Home.css`
- Game page: `src/pages/Game.css`

## 📚 Documentation

- [QUICK_START.md](./QUICK_START.md) - Fast setup (5 min)
- [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) - Detailed OAuth setup
- [OAUTH_FLOW_EXPLAINED.md](./OAUTH_FLOW_EXPLAINED.md) - How authentication works
- [HOME_PAGE.md](./HOME_PAGE.md) - Home page features

## 🚀 Deployment

### For Production:
1. Create production OAuth client in Google Cloud
2. Add production domain to authorized origins
3. Update Client ID with production credentials
4. Build: `npm run build`
5. Deploy `dist` folder

### Recommended Platforms:
- Vercel
- Netlify
- GitHub Pages
- Firebase Hosting

## 🐛 Troubleshooting

### Login button not working?
- Check if GOOGLE_CLIENT_ID is set correctly
- Verify URL is in authorized origins
- Check browser console for errors

### "redirect_uri_mismatch" error?
- Add current URL to authorized redirect URIs in Google Console
- Make sure to include protocol (http://)

### Profile picture not showing?
- Default avatar will be shown if Google picture fails
- First letter of name shown as backup

## 📦 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 👨‍💻 Creator

Created by **Dharmik Gohil**

## 📄 License

MIT

---

**Need Help?** Check the documentation files or open an issue!
