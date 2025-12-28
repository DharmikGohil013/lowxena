# LowXena Backend Server

Node.js/Express backend with Supabase PostgreSQL for LowXena game.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your Supabase credentials

# Run development server
npm run dev
```

Server runs at: **http://localhost:3000**

## 📁 Project Structure

```
server/
├── config/
│   └── supabase.js          # Supabase configuration
├── controllers/
│   ├── authController.js    # Authentication
│   ├── userController.js    # User management
│   └── gameController.js    # Game logic
├── middleware/
│   ├── auth.js             # JWT verification
│   └── errorHandler.js     # Error handling
├── routes/
│   ├── auth.js            # Auth routes
│   ├── user.js            # User routes
│   └── game.js            # Game routes
├── database/
│   └── schema.sql         # PostgreSQL schema
├── index.js               # Main server
└── package.json           # Dependencies
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout
- `POST /api/auth/verify` - Verify token

### User
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `GET /api/user/stats` - Get statistics
- `POST /api/user/stats` - Update statistics

### Game
- `GET /api/game/leaderboard` - Get leaderboard
- `POST /api/game/score` - Save score
- `GET /api/game/history` - Get game history
- `GET /api/game/settings` - Get game settings

## 🔧 Environment Variables

Create `.env` file:

```env
PORT=3000
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5174
```

## 🗄️ Database Setup

1. Create Supabase project
2. Copy `database/schema.sql`
3. Run in Supabase SQL Editor
4. Tables will be created automatically

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Detailed setup guide
- **[FRONTEND_INTEGRATION.md](./FRONTEND_INTEGRATION.md)** - Connect to frontend

## 🛠️ Scripts

```bash
npm start        # Start production server
npm run dev      # Start development server (auto-reload)
```

## 🏗️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **Supabase** - Database & Auth
- **PostgreSQL** - Database
- **JWT** - Authentication
- **CORS** - Cross-origin requests

## 🔐 Security

- Row Level Security (RLS) enabled
- JWT token authentication
- Environment variables for secrets
- Input validation with express-validator
- CORS protection

## 🐛 Troubleshooting

**Server won't start?**
- Check `.env` file exists
- Verify Supabase credentials
- Ensure port 3000 is available

**Database errors?**
- Run `schema.sql` in Supabase
- Check Supabase connection
- Verify table names

**CORS errors?**
- Update `CLIENT_URL` in `.env`
- Check CORS configuration

## 📦 Dependencies

```json
{
  "@supabase/supabase-js": "^2.39.0",
  "express": "^4.18.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "jsonwebtoken": "^9.0.2",
  "express-validator": "^7.0.1",
  "morgan": "^1.10.0"
}
```

## 🚀 Deployment

### Recommended Platforms:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS EC2

### Deploy Steps:
1. Push to GitHub
2. Connect to hosting platform
3. Set environment variables
4. Deploy!

## 👨‍💻 Author

Created by **Dharmik Gohil**

## 📄 License

MIT

---

**Need help?** Check the documentation files or create an issue.
