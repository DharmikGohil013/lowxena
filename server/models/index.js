import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  name: { type: String },
  username: { type: String },
  avatar_url: { type: String },
  google_id: { type: String },
  level: { type: Number, default: 1 },
  experience: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  birthdate: { type: String },
  is_guest: { type: Boolean, default: false },
  last_login: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const User = mongoose.model('User', userSchema);

const userStatSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  total_games: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  highest_score: { type: Number, default: 0 },
  total_playtime: { type: Number, default: 0 }
});

export const UserStat = mongoose.model('UserStat', userStatSchema);

const gameHistorySchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  score: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  duration: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const GameHistory = mongoose.model('GameHistory', gameHistorySchema);

const roomSchema = new mongoose.Schema({
  room_name: { type: String, required: true, unique: true },
  room_code: { type: String },
  host_id: { type: String, required: true },
  max_players: { type: Number, default: 7 },
  max_points: { type: Number, default: 40 },
  is_private: { type: Boolean, default: false },
  status: { type: String, default: 'waiting' },
  game_state: { type: mongoose.Schema.Types.Mixed },
  members: [{
    user_id: { type: String, required: true },
    is_host: { type: Boolean, default: false },
    is_ready: { type: Boolean, default: false }
  }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const Room = mongoose.model('Room', roomSchema);
