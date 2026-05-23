import { User, UserStat, GameHistory, Room } from '../models/index.js';
import { findRoomByIdOrSlug } from '../utils/roomLookup.js';
export const getLeaderboard = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

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
    } catch (e) {}

    const allStats = await UserStat.find().sort({ wins: -1, highest_score: -1 });

    const userIds = allStats.map(s => s.user_id);
    const users = await User.find({ id: { $in: userIds } }).select('id name avatar_url level');
    const usersMap = {};
    users.forEach(u => { usersMap[u.id] = u; });

    const rankedList = allStats
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

    const topList = rankedList.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    let currentUserRank = null;
    if (currentUserId) {
      const userIndex = rankedList.findIndex(e => e.user_id === currentUserId);
      if (userIndex !== -1) {
        currentUserRank = rankedList[userIndex];
      } else {
        const user = await User.findOne({ id: currentUserId });
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

    const gameHistory = new GameHistory({
      user_id: userId,
      score: score,
      level: level,
      duration: duration || 0
    });
    await gameHistory.save();

    let stats = await UserStat.findOne({ user_id: userId });
    if (stats) {
      stats.total_games += 1;
      stats.highest_score = Math.max(stats.highest_score, score);
      stats.total_playtime += (duration || 0);
      await stats.save();
    } else {
      await UserStat.create({
        user_id: userId,
        total_games: 1,
        wins: 0,
        losses: 0,
        highest_score: score || 0,
        total_playtime: duration || 0
      });
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

export const getGameHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const history = await GameHistory.find({ user_id: userId })
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit);

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

export const getGameSettings = async (req, res) => {
  try {
    const defaultSettings = {
      difficulty: 'normal',
      sound_enabled: true,
      music_enabled: true,
      max_players: 100,
      game_version: '1.0.0'
    };

    res.json({
      success: true,
      settings: defaultSettings
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

export const updateGameState = async (req, res) => {
  try {
    const { roomId } = req.params;
    const gameState = req.body;

    const room = await findRoomByIdOrSlug(roomId);
    if (!room) throw new Error('Room not found');

    await Room.findByIdAndUpdate(room._id, {
      game_state: gameState,
    });

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

export const getGameState = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await findRoomByIdOrSlug(roomId);

    if (!room) throw new Error('Room not found');

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

export const saveMultiplayerResults = async (req, res) => {
  try {
    const { players, totalRounds } = req.body;

    if (!players || !Array.isArray(players)) {
      return res.status(400).json({ success: false, message: 'Players array required' });
    }

    const errors = [];

    for (const player of players) {
      try {
        await GameHistory.create({
          user_id: player.id,
          score: player.score || 0,
          level: totalRounds || 1,
          duration: 0
        });

        let stats = await UserStat.findOne({ user_id: player.id });

        if (stats) {
          stats.total_games += 1;
          stats.highest_score = Math.max(stats.highest_score || 0, player.score || 0);
          if (player.isWinner) {
            stats.wins += 1;
          } else {
            stats.losses += 1;
          }
          await stats.save();
        } else {
          await UserStat.create({
            user_id: player.id,
            total_games: 1,
            highest_score: player.score || 0,
            wins: player.isWinner ? 1 : 0,
            losses: player.isWinner ? 0 : 1,
            total_playtime: 0
          });
        }

        // Award multiplayer coins (20 base + 50 win bonus)
        const coinsEarned = 20 + (player.isWinner ? 50 : 0);
        const user = await User.findOne({ id: player.id });
        if (user) {
          user.coins = (user.coins || 0) + coinsEarned;
          await user.save();
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
