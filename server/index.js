import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import { testConnection } from './config/supabase.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import gameRoutes from './routes/game.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LowXena API Server is running! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/game', gameRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler (must be last)
app.use(errorHandler);

// Start server
async function start() {
  await testConnection();

  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🎮 LowXena Server Running! 🎮      ║
╠═══════════════════════════════════════╣
║  Port: ${PORT}                        ║
║  Environment: ${process.env.NODE_ENV || 'development'}           ║
║  API: http://localhost:${PORT}         ║
╚═══════════════════════════════════════╝
    `);
  });
}

start();

export default app;
