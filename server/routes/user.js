import express from 'express';
import { 
  getProfile, 
  updateProfile, 
  getAvatars,
  getUserStats,
  updateUserStats
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/user/avatars
 * @desc    Get available avatar options
 * @access  Public
 */
router.get('/avatars', getAvatars);

// All other user routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/user/profile
 * @desc    Get user profile with stats
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
