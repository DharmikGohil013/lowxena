import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';

import { connectDB } from './config/db.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import gameRoutes from './routes/game.js';

import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();
const mongoose = require("mongoose");

// Connect MongoDB
connectDB();

// Connect Redis
connectRedis();
const app = express();
const PORT = process.env.PORT || 3000;

// Allowed Origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow all origins temporarily
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Root Route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'LowXena API Server is running! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    database: 'MongoDB Connected'
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

// Global Error Handler
app.use(errorHandler);

// Start Server
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

export default app;
