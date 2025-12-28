import { supabase } from '../config/supabase.js';

/**
 * Get user profile
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        level: user.level,
        experience: user.experience,
        coins: user.coins,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, avatar_url, birthdate, username } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (avatar_url) updateData.avatar_url = avatar_url;
    if (birthdate) updateData.birthdate = birthdate;
    if (username) updateData.username = username;

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

/**
 * Get user game statistics
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: stats, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!stats) {
      // Create default stats
      const { data: newStats, error: insertError } = await supabase
        .from('user_stats')
        .insert([{
          user_id: userId,
          total_games: 0,
          wins: 0,
          losses: 0,
          highest_score: 0,
          total_playtime: 0
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      return res.json({
        success: true,
        stats: newStats
      });
    }

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};

/**
 * Update user game statistics
 */
export const updateUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { total_games, wins, losses, highest_score, total_playtime } = req.body;

    const { data: stats, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_games,
        wins,
        losses,
        highest_score,
        total_playtime
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Stats updated successfully',
      stats: stats
    });

  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stats',
      error: error.message
    });
  }
};

export default { getProfile, updateProfile, getUserStats, updateUserStats };
