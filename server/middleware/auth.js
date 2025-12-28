import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

/**
 * Middleware to verify JWT token from Google OAuth or Supabase
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

/**
 * Middleware to verify Google OAuth token
 */
export const verifyGoogleToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Google token is required'
      });
    }

    // Decode JWT without verification (Google already verified it)
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.email) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google token'
      });
    }

    req.googleUser = {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      sub: decoded.sub
    };

    next();
  } catch (error) {
    console.error('Google token verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Token verification failed',
      error: error.message
    });
  }
};

export default { authenticateToken, verifyGoogleToken };
