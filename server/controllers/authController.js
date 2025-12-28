import { supabase, supabaseAdmin } from '../config/supabase.js';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';

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
    const { refreshToken } = req.body;

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) throw error;

    res.json({
      success: true,
      session: data.session
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
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

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
    const { token } = req.body;

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) throw error;

    res.json({
      success: true,
      valid: !!user,
      user: user
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      valid: false,
      message: 'Invalid token'
    });
  }
};

export default { googleLogin, refreshToken, logout, verifyToken };
