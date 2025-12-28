import express from 'express';
import { 
  getLeaderboard,
  saveGameScore,
  getGameHistory,
  getGameSettings
} from '../controllers/gameController.js';
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

export default router;
