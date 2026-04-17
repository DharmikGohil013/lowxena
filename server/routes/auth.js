import express from 'express';
import { body } from 'express-validator';
import { 
  googleLogin, 
  guestLogin,
  refreshToken, 
  logout,
  verifyToken 
} from '../controllers/authController.js';
import { verifyGoogleToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/google
 * @desc    Login with Google OAuth
 * @access  Public
 */
router.post('/google', 
  body('token').notEmpty().withMessage('Token is required'),
  verifyGoogleToken,
  googleLogin
);

/**
 * @route   POST /api/auth/guest
 * @desc    Login as guest
 * @access  Public
 */
router.post('/guest', guestLogin);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token
 * @access  Public
 */
router.get('/verify', verifyToken);

export default router;
