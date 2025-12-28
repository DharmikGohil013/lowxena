import { supabase } from '../config/supabase.js';

/**
 * Get leaderboard
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const { data: leaderboard, error } = await supabase
      .from('leaderboard')
      .select(`
        *,
        users:user_id (name, avatar_url)
      `)
      .order('score', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      leaderboard: leaderboard.map((entry, index) => ({
        rank: parseInt(offset) + index + 1,
        user_id: entry.user_id,
        name: entry.users.name,
        avatar_url: entry.users.avatar_url,
        score: entry.score,
        level: entry.level,
        date: entry.created_at
      }))
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
};

/**
 * Save game score
 */
export const saveGameScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { score, level, duration } = req.body;

    if (!score || !level) {
      return res.status(400).json({
        success: false,
        message: 'Score and level are required'
      });
    }

    // Save to game history
    const { data: gameHistory, error: historyError } = await supabase
      .from('game_history')
      .insert([{
        user_id: userId,
        score: score,
        level: level,
        duration: duration || 0
      }])
      .select()
      .single();

    if (historyError) throw historyError;

    // Update or insert leaderboard
    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (!existingEntry || score > existingEntry.score) {
      const { error: leaderboardError } = await supabase
        .from('leaderboard')
        .upsert({
          user_id: userId,
          score: score,
          level: level
        });

      if (leaderboardError) throw leaderboardError;
    }

    // Update user stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (stats) {
      await supabase
        .from('user_stats')
        .update({
          total_games: stats.total_games + 1,
          highest_score: Math.max(stats.highest_score, score),
          total_playtime: stats.total_playtime + (duration || 0)
        })
        .eq('user_id', userId);
    }

    res.json({
      success: true,
      message: 'Score saved successfully',
      gameHistory: gameHistory
    });

  } catch (error) {
    console.error('Save score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save score',
      error: error.message
    });
  }
};

/**
 * Get game history
 */
export const getGameHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const { data: history, error } = await supabase
      .from('game_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      history: history
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game history',
      error: error.message
    });
  }
};

/**
 * Get game settings
 */
export const getGameSettings = async (req, res) => {
  try {
    const { data: settings, error } = await supabase
      .from('game_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const defaultSettings = {
      difficulty: 'normal',
      sound_enabled: true,
      music_enabled: true,
      max_players: 100,
      game_version: '1.0.0'
    };

    res.json({
      success: true,
      settings: settings || defaultSettings
    });

  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game settings',
      error: error.message
    });
  }
};

export default { getLeaderboard, saveGameScore, getGameHistory, getGameSettings };
