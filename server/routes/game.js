import express from 'express';
import { 
  getLeaderboard,
  saveGameScore,
  getGameHistory,
  getGameSettings
} from '../controllers/gameController.js';
import {
  createRoom,
  getRooms,
  getRoomDetails,
  joinRoom,
  leaveRoom,
  startGame,
  kickPlayer
} from '../controllers/roomController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/game/leaderboard
 * @desc    Get game leaderboard
 * @access  Public
 */
router.get('/leaderboard', getLeaderboard);

/**
 * @route   GET /api/game/settings
 * @desc    Get game settings
 * @access  Public
 */
router.get('/settings', getGameSettings);

/**
 * @route   GET /api/game/rooms
 * @desc    Get all available rooms
 * @access  Public
 */
router.get('/rooms', getRooms);

// Protected routes
router.use(authenticateToken);

/**
 * @route   POST /api/game/score
 * @desc    Save game score
 * @access  Private
 */
router.post('/score', saveGameScore);

/**
 * @route   GET /api/game/history
 * @desc    Get user game history
 * @access  Private
 */
router.get('/history', getGameHistory);

/**
 * @route   POST /api/game/create-room
 * @desc    Create a new game room
 * @access  Private
 */
router.post('/create-room', createRoom);

/**
 * @route   GET /api/game/room/:roomId
 * @desc    Get room details with players
 * @access  Private
 */
router.get('/room/:roomId', getRoomDetails);

/**
 * @route   POST /api/game/join-room/:roomId
 * @desc    Join a game room
 * @access  Private
 */
router.post('/join-room/:roomId', joinRoom);

/**
 * @route   POST /api/game/leave-room/:roomId
 * @desc    Leave a game room
 * @access  Private
 */
router.post('/leave-room/:roomId', leaveRoom);

/**
 * @route   POST /api/game/start-game/:roomId
 * @desc    Start game in room (host only)
 * @access  Private
 */
router.post('/start-game/:roomId', startGame);

/**
 * @route   POST /api/game/kick-player/:roomId
 * @desc    Kick player from room (host only)
 * @access  Private
 */
router.post('/kick-player/:roomId', kickPlayer);

export default router;
