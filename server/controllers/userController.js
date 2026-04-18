import { supabaseAdmin } from '../config/supabase.js';

// Valid SVG avatar IDs
const VALID_AVATARS = ['avatar-warrior', 'avatar-mage', 'avatar-rogue', 'avatar-knight', 'avatar-ranger'];

/**
 * Get user profile with stats
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // If user doesn't exist yet (e.g. in-memory fallback), auto-create
    let userData = user;
    if (error && error.code === 'PGRST116') {
      const storedUser = req.user; // from JWT middleware
      const newUser = {
        id: userId,
        name: storedUser.name || 'Player',
        email: storedUser.email || '',
        avatar_url: '',
        level: 1,
        experience: 0,
        coins: 0,
        birthdate: '',
        username: '',
        created_at: new Date().toISOString()
      };
      const { data: created } = await supabaseAdmin
        .from('users')
        .insert(newUser)
        .select()
        .single();
      userData = created || newUser;
    } else if (error) {
      throw error;
    }

    // Also fetch stats
    let { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Auto-create stats if missing
    if (!stats) {
      const newStats = {
        user_id: userId,
        total_games: 0,
        wins: 0,
        losses: 0,
        highest_score: 0,
        total_playtime: 0
      };
      const { data: created } = await supabaseAdmin
        .from('user_stats')
        .insert(newStats)
        .select()
        .single();
      stats = created || newStats;
    }

    // Get user rank
    const { data: allStats } = await supabaseAdmin
      .from('user_stats')
      .select('user_id, wins, highest_score, total_games')
      .order('wins', { ascending: false });

    let userRank = null;
    if (allStats) {
      const sorted = allStats
        .filter(s => s.total_games > 0)
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.highest_score !== a.highest_score) return b.highest_score - a.highest_score;
          return b.total_games - a.total_games;
        });
      const idx = sorted.findIndex(s => s.user_id === userId);
      userRank = idx !== -1 ? idx + 1 : null;
    }

    res.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        username: userData.username || '',
        avatar_url: userData.avatar_url,
        level: userData.level || 1,
        experience: userData.experience || 0,
        coins: userData.coins || 0,
        birthdate: userData.birthdate || '',
        created_at: userData.created_at,
        last_login: userData.last_login
      },
      stats: stats ? {
        total_games: stats.total_games || 0,
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        highest_score: stats.highest_score || 0,
        total_playtime: stats.total_playtime || 0,
        win_rate: stats.total_games > 0 ? Math.round((stats.wins / stats.total_games) * 100) : 0
      } : {
        total_games: 0,
        wins: 0,
        losses: 0,
        highest_score: 0,
        total_playtime: 0,
        win_rate: 0
      },
      rank: userRank
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
 * Update user profile (including avatar selection)
 */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, avatar_url, birthdate, username } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).slice(0, 50);
    if (username !== undefined) updateData.username = String(username).slice(0, 30);
    if (birthdate !== undefined) updateData.birthdate = birthdate || null;
    
    // avatar_url can be a predefined SVG ID or a URL
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url;
    }

    const { data: user, error } = await supabaseAdmin
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
 * Get available avatars
 */
export const getAvatars = async (req, res) => {
  res.json({
    success: true,
    avatars: VALID_AVATARS
  });
};

/**
 * Get user game statistics
 */
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: stats, error } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!stats) {
      // Create default stats
      const { data: newStats, error: insertError } = await supabaseAdmin
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
        stats: {
          ...newStats,
          win_rate: 0
        }
      });
    }

    res.json({
      success: true,
      stats: {
        ...stats,
        win_rate: stats.total_games > 0 ? Math.round((stats.wins / stats.total_games) * 100) : 0
      }
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
 * Update user game statistics after a game
 */
export const updateUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { won, score, duration } = req.body;

    // Get current stats
    let { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!stats) {
      // Create new stats entry
      const { data: newStats, error: insertError } = await supabaseAdmin
        .from('user_stats')
        .insert([{
          user_id: userId,
          total_games: 1,
          wins: won ? 1 : 0,
          losses: won ? 0 : 1,
          highest_score: score || 0,
          total_playtime: duration || 0
        }])
        .select()
        .single();
      
      if (insertError) throw insertError;
      stats = newStats;
    } else {
      // Update existing stats
      const { data: updated, error } = await supabaseAdmin
        .from('user_stats')
        .update({
          total_games: (stats.total_games || 0) + 1,
          wins: (stats.wins || 0) + (won ? 1 : 0),
          losses: (stats.losses || 0) + (won ? 0 : 1),
          highest_score: Math.max(stats.highest_score || 0, score || 0),
          total_playtime: (stats.total_playtime || 0) + (duration || 0)
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      stats = updated;
    }

    res.json({
      success: true,
      message: 'Stats updated successfully',
      stats: {
        ...stats,
        win_rate: stats.total_games > 0 ? Math.round((stats.wins / stats.total_games) * 100) : 0
      }
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

export default { getProfile, updateProfile, getAvatars, getUserStats, updateUserStats };
