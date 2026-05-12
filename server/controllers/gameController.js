import { supabaseAdmin } from '../config/supabase.js';

/**
 * Get leaderboard with current user position
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    // Get auth token to find current user (optional)
    let currentUserId = null;
    try {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (token) {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
          currentUserId = decoded.userId;
        }
      }
    } catch (e) { /* ignore auth errors for public endpoint */ }

    // Get all user stats sorted by wins first, then highest_score
    const { data: allStats, error: statsError } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .order('wins', { ascending: false });

    if (statsError) throw statsError;

    // Get users info for all stats entries
    const userIds = (allStats || []).map(s => s.user_id);
    let usersMap = {};
    
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, name, avatar_url, level');
      
      if (users) {
        users.forEach(u => { usersMap[u.id] = u; });
      }
    }

    // Build ranked leaderboard from user_stats
    const rankedList = (allStats || [])
      .filter(s => s.total_games > 0)
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.highest_score !== a.highest_score) return b.highest_score - a.highest_score;
        return b.total_games - a.total_games;
      })
      .map((entry, index) => {
        const user = usersMap[entry.user_id] || {};
        return {
          rank: index + 1,
          user_id: entry.user_id,
          name: user.name || 'Unknown',
          avatar_url: user.avatar_url || '',
          level: user.level || 1,
          wins: entry.wins || 0,
          losses: entry.losses || 0,
          total_games: entry.total_games || 0,
          highest_score: entry.highest_score || 0,
          win_rate: entry.total_games > 0 ? Math.round((entry.wins / entry.total_games) * 100) : 0
        };
      });

    // Paginated top list
    const topList = rankedList.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    // Find current user's position
    let currentUserRank = null;
    if (currentUserId) {
      const userIndex = rankedList.findIndex(e => e.user_id === currentUserId);
      if (userIndex !== -1) {
        currentUserRank = rankedList[userIndex];
      } else {
        // User has no stats yet - show them at the bottom
        const user = usersMap[currentUserId];
        currentUserRank = {
          rank: rankedList.length + 1,
          user_id: currentUserId,
          name: user?.name || 'You',
          avatar_url: user?.avatar_url || '',
          level: user?.level || 1,
          wins: 0,
          losses: 0,
          total_games: 0,
          highest_score: 0,
          win_rate: 0
        };
      }
    }

    res.json({
      success: true,
      leaderboard: topList,
      totalPlayers: rankedList.length,
      currentUserRank: currentUserRank
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

    if (score === undefined || score === null || !level) {
      return res.status(400).json({
        success: false,
        message: 'Score and level are required'
      });
    }

    // Save to game history
    const { data: gameHistory, error: historyError } = await supabaseAdmin
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
    const { data: existingEntry, error: fetchError } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    if (!existingEntry || score > existingEntry.score) {
      const { error: leaderboardError } = await supabaseAdmin
        .from('leaderboard')
        .upsert({
          user_id: userId,
          score: score,
          level: level
        });

      if (leaderboardError) throw leaderboardError;
    }

    // Update user stats
    const { data: stats } = await supabaseAdmin
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (stats) {
      await supabaseAdmin
        .from('user_stats')
        .update({
          total_games: stats.total_games + 1,
          highest_score: Math.max(stats.highest_score, score),
          total_playtime: stats.total_playtime + (duration || 0)
        })
        .eq('user_id', userId);
    } else {
      // Create new stats entry if none exists
      await supabaseAdmin
        .from('user_stats')
        .insert([{
          user_id: userId,
          total_games: 1,
          wins: 0,
          losses: 0,
          highest_score: score || 0,
          total_playtime: duration || 0
        }]);
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
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const { data: history, error } = await supabaseAdmin
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
    const { data: settings, error } = await supabaseAdmin
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

/**
 * Update game state
 */
export const updateGameState = async (req, res) => {
  try {
    const { roomId } = req.params;
    const gameState = req.body;

    // Store game state in rooms table metadata
    const { error } = await supabaseAdmin
      .from('rooms')
      .update({
        game_state: gameState,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Game state updated successfully'
    });

  } catch (error) {
    console.error('Update game state error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update game state',
      error: error.message
    });
  }
};

/**
 * Get game state
 */
export const getGameState = async (req, res) => {
  try {
    const { roomId } = req.params;

    const { data: room, error } = await supabaseAdmin
      .from('rooms')
      .select('game_state')
      .eq('id', roomId)
      .single();

    if (error) throw error;

    res.json({
      success: true,
      gameState: room.game_state || {}
    });

  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch game state',
      error: error.message
    });
  }
};

/**
 * Save multiplayer game results for all players.
 * Uses atomic DB operations to prevent race conditions
 * when multiple players submit results simultaneously.
 */
export const saveMultiplayerResults = async (req, res) => {
  try {
    const { players, totalRounds } = req.body;
    // players: [{ id, score, isWinner }]

    if (!players || !Array.isArray(players)) {
      return res.status(400).json({ success: false, message: 'Players array required' });
    }

    const errors = [];

    for (const player of players) {
      try {
        // Save to game history (append-only, no race risk)
        await supabaseAdmin
          .from('game_history')
          .insert([{
            user_id: player.id,
            score: player.score || 0,
            level: totalRounds || 1,
            duration: 0
          }]);

        // Try atomic RPC first (if the SQL function exists)
        const { error: rpcError } = await supabaseAdmin.rpc('update_user_stats_atomic', {
          p_user_id: player.id,
          p_won: !!player.isWinner,
          p_score: player.score || 0,
          p_duration: 0
        });

        if (rpcError) {
          // Fallback to upsert-based approach (still safer than read-modify-write)
          const { data: stats } = await supabaseAdmin
            .from('user_stats')
            .select('*')
            .eq('user_id', player.id)
            .single();

          if (stats) {
            const updates = {
              total_games: stats.total_games + 1,
              highest_score: Math.max(stats.highest_score || 0, player.score || 0),
            };
            if (player.isWinner) {
              updates.wins = (stats.wins || 0) + 1;
            } else {
              updates.losses = (stats.losses || 0) + 1;
            }
            await supabaseAdmin
              .from('user_stats')
              .update(updates)
              .eq('user_id', player.id);
          } else {
            await supabaseAdmin
              .from('user_stats')
              .insert([{
                user_id: player.id,
                total_games: 1,
                highest_score: player.score || 0,
                wins: player.isWinner ? 1 : 0,
                losses: player.isWinner ? 0 : 1,
                total_playtime: 0
              }]);
          }
        }
      } catch (e) {
        console.error(`Error saving results for player ${player.id}:`, e);
        errors.push(player.id);
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({
        success: true,
        message: `Results saved with ${errors.length} partial failures`,
        failedPlayers: errors
      });
    }

    res.json({ success: true, message: 'Multiplayer results saved' });
  } catch (error) {
    console.error('Save multiplayer results error:', error);
    res.status(500).json({ success: false, message: 'Failed to save results' });
  }
};

export default { getLeaderboard, saveGameScore, saveMultiplayerResults, getGameHistory, getGameSettings, updateGameState, getGameState };
