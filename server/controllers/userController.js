import { User, UserStat } from '../models/index.js';

const VALID_AVATARS = [
  'avatar-adventurer-Felix',
  'avatar-adventurer-Aneka',
  'avatar-adventurer-Jack',
  'avatar-adventurer-Aria',
  'avatar-adventurer-Max',
  'avatar-adventurer-Luna',
  'avatar-adventurer-Kiki',
  'avatar-adventurer-Leo',
  'avatar-adventurer-Buster',
  'avatar-adventurer-Finn'
];

/**
 * Get user profile with stats
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    let user = await User.findOne({ id: userId });

    if (!user) {
      const storedUser = req.user;
      user = new User({
        id: userId,
        name: storedUser.name || 'Player',
        email: storedUser.email || '',
        avatar_url: '',
        level: 1,
        experience: 0,
        coins: 0,
        birthdate: '',
        username: ''
      });
      await user.save();
    }

    let stats = await UserStat.findOne({ user_id: userId });

    if (!stats) {
      stats = new UserStat({
        user_id: userId,
        total_games: 0,
        wins: 0,
        losses: 0,
        highest_score: 0,
        total_playtime: 0
      });
      await stats.save();
    }

    const allStats = await UserStat.find({ total_games: { $gt: 0 } }).sort({ wins: -1, highest_score: -1, total_games: -1 });
    let userRank = null;
    const idx = allStats.findIndex(s => s.user_id === userId);
    if (idx !== -1) userRank = idx + 1;

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username || '',
        avatar_url: user.avatar_url,
        level: user.level || 1,
        experience: user.experience || 0,
        coins: user.coins || 0,
        birthdate: user.birthdate || '',
        created_at: user.created_at,
        last_login: user.last_login
      },
      stats: {
        total_games: stats.total_games || 0,
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        highest_score: stats.highest_score || 0,
        total_playtime: stats.total_playtime || 0,
        win_rate: stats.total_games > 0 ? Math.round((stats.wins / stats.total_games) * 100) : 0
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
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

    const user = await User.findOneAndUpdate({ id: userId }, updateData, { new: true });

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

    let stats = await UserStat.findOne({ user_id: userId });

    if (!stats) {
      stats = await UserStat.create({
        user_id: userId,
        total_games: 0,
        wins: 0,
        losses: 0,
        highest_score: 0,
        total_playtime: 0
      });
    }

    res.json({
      success: true,
      stats: {
        total_games: stats.total_games,
        wins: stats.wins,
        losses: stats.losses,
        highest_score: stats.highest_score,
        total_playtime: stats.total_playtime,
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

    let stats = await UserStat.findOne({ user_id: userId });

    if (!stats) {
      stats = new UserStat({
        user_id: userId,
        total_games: 1,
        wins: won ? 1 : 0,
        losses: won ? 0 : 1,
        highest_score: score || 0,
        total_playtime: duration || 0
      });
      await stats.save();
    } else {
      stats.total_games += 1;
      stats.wins += won ? 1 : 0;
      stats.losses += won ? 0 : 1;
      stats.highest_score = Math.max(stats.highest_score, score || 0);
      stats.total_playtime += (duration || 0);
      await stats.save();
    }

    res.json({
      success: true,
      message: 'Stats updated successfully',
      stats: {
        total_games: stats.total_games,
        wins: stats.wins,
        losses: stats.losses,
        highest_score: stats.highest_score,
        total_playtime: stats.total_playtime,
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
