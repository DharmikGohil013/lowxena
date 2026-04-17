import { supabaseAdmin } from '../config/supabase.js';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Login with Google OAuth
 */
export const googleLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, name, picture, sub } = req.googleUser;

    // Check if user exists (use admin client to bypass RLS)
    let { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let user;

    if (!existingUser) {
      // Create new user (use admin client to bypass RLS)
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('users')
        .insert([{
          email: email,
          name: name,
          avatar_url: picture,
          google_id: sub,
          level: 1,
          experience: 0,
          coins: 0,
          last_login: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      user = newUser;
    } else {
      // Update last login (use admin client to bypass RLS)
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          name: name,
          avatar_url: picture
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        level: user.level,
        experience: user.experience,
        coins: user.coins
      },
      token: token
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const oldToken = authHeader && authHeader.split(' ')[1];

    if (!oldToken) {
      return res.status(401).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Verify the old token (allow expired)
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET, { ignoreExpiration: true });

    // Issue a new token
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token: newToken
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
};

/**
 * Logout user
 */
export const logout = async (req, res) => {
  try {
    // Client-side token removal handles logout
    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

/**
 * Verify token
 */
export const verifyToken = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guest users aren't in the DB
    if (decoded.isGuest) {
      return res.json({
        success: true,
        valid: true,
        user: {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          avatar_url: '',
          level: 1,
          experience: 0,
          coins: 0,
          isGuest: true
        }
      });
    }

    // Fetch current user data
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        level: user.level,
        experience: user.experience,
        coins: user.coins
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Guest login - no database required
 */
export const guestLogin = async (req, res) => {
  try {
    const { name } = req.body;
    const guestId = `guest_${crypto.randomUUID()}`;
    const guestName = name && name.trim() ? name.trim().slice(0, 30) : `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
    const guestEmail = `${guestId}@guest.lowxena`;

    // Insert guest into users table so room joins/lookups work
    await supabaseAdmin
      .from('users')
      .insert([{
        id: guestId,
        email: guestEmail,
        name: guestName,
        avatar_url: '',
        level: 1,
        experience: 0,
        coins: 0,
        is_guest: true,
        last_login: new Date().toISOString()
      }]);

    const token = jwt.sign(
      {
        userId: guestId,
        email: guestEmail,
        name: guestName,
        isGuest: true
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Guest login successful',
      user: {
        id: guestId,
        email: guestEmail,
        name: guestName,
        avatar_url: '',
        level: 1,
        experience: 0,
        coins: 0,
        isGuest: true
      },
      token
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({
      success: false,
      message: 'Guest login failed',
      error: error.message
    });
  }
};

export default { googleLogin, guestLogin, refreshToken, logout, verifyToken };
