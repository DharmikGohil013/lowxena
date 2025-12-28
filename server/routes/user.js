import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  getUserStats,
  updateUserStats
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', updateProfile);

/**
 * @route   GET /api/user/stats
 * @desc    Get user game statistics
 * @access  Private
 */
router.get('/stats', getUserStats);

/**
 * @route   POST /api/user/stats
 * @desc    Update user game statistics
 * @access  Private
 */
router.post('/stats', updateUserStats);

export default router;
