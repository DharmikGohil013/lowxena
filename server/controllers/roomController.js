import { Room, User } from '../models/index.js';
import * as roomNames from '../utils/roomNames.js';

export const createRoom = async (req, res) => {
  try {
    const { maxPoints, maxPlayers, isPrivate, roomCode } = req.body;
    const userId = req.user.id;

    if (!maxPoints || !maxPlayers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (maxPoints < 10 || maxPoints > 40) {
      return res.status(400).json({ error: 'Max points must be between 10 and 40' });
    }

    if (maxPlayers < 2 || maxPlayers > 7) {
      return res.status(400).json({ error: 'Max players must be between 2 and 7' });
    }

    const existingMembership = await Room.findOne({ 'members.user_id': userId });
    if (existingMembership) {
      return res.status(400).json({ error: 'You are already in a room' });
    }

    const existingRooms = await Room.find().select('room_name');
    const existingNames = existingRooms.map(room => room.room_name);
    const roomName = roomNames.generateUniqueRoomName(existingNames);

    const room = new Room({
      room_name: roomName,
      room_code: isPrivate ? roomCode : null,
      host_id: userId,
      max_players: maxPlayers,
      max_points: maxPoints,
      is_private: isPrivate,
      status: 'waiting',
      members: [{
        user_id: userId,
        is_host: true,
        is_ready: false
      }]
    });

    await room.save();

    res.status(201).json({ 
      message: 'Room created successfully',
      roomId: room._id,
      roomName: room.room_name,
      roomCode: room.room_code
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'waiting' }).sort({ created_at: -1 });

    const hostIds = rooms.map(r => r.host_id);
    const hosts = await User.find({ id: { $in: hostIds } }).select('id name avatar_url');
    const hostMap = {};
    hosts.forEach(h => { hostMap[h.id] = h; });

    const formattedRooms = rooms.map(room => ({
      id: room._id,
      roomName: room.room_name,
      roomCode: room.room_code,
      hostId: room.host_id,
      hostName: hostMap[room.host_id]?.name || 'Unknown',
      maxPlayers: room.max_players,
      currentPlayers: room.members.length,
      maxPoints: room.max_points,
      isPrivate: room.is_private,
      status: room.status,
      createdAt: room.created_at
    }));

    res.json(formattedRooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
};

export const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const memberIds = room.members.map(m => m.user_id);
    const users = await User.find({ id: { $in: memberIds } }).select('id name avatar_url');
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u; });

    const players = room.members.map(member => {
      const user = userMap[member.user_id] || {};
      return {
        id: member.user_id,
        name: user.name || 'Guest',
        avatarUrl: user.avatar_url || '',
        isHost: member.is_host,
        isReady: member.is_ready || false
      };
    });

    res.json({
      id: room._id,
      roomName: room.room_name,
      roomCode: room.room_code,
      hostId: room.host_id,
      maxPlayers: room.max_players,
      maxPoints: room.max_points,
      isPrivate: room.is_private,
      status: room.status,
      players
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code } = req.body;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Cannot join a game already in progress' });
    }

    if (room.is_private && room.room_code !== code) {
      return res.status(403).json({ error: 'Invalid room code' });
    }

    if (room.members.find(m => m.user_id === userId)) {
      return res.json({ message: 'Already in room' });
    }

    const otherRoom = await Room.findOne({ 'members.user_id': userId });
    if (otherRoom) {
      return res.status(400).json({ error: 'You are already in another room. Leave it first.' });
    }

    if (room.members.length >= room.max_players) {
      return res.status(400).json({ error: 'Room is full' });
    }

    room.members.push({
      user_id: userId,
      is_host: false,
      is_ready: false
    });

    await room.save();

    res.json({ message: 'Successfully joined room' });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const memberIndex = room.members.findIndex(m => m.user_id === userId);
    if (memberIndex === -1) {
      return res.status(404).json({ error: 'You are not in this room' });
    }

    const wasHost = room.members[memberIndex].is_host;
    room.members.splice(memberIndex, 1);

    if (room.members.length === 0) {
      await Room.findByIdAndDelete(roomId);
    } else {
      if (wasHost) {
        room.members[0].is_host = true;
        room.host_id = room.members[0].user_id;
      }
      await room.save();
    }

    res.json({ message: 'Successfully left room' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
};

export const startGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.host_id !== userId) {
      return res.status(403).json({ error: 'Only the host can start the game' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started or finished' });
    }

    if (room.members.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start' });
    }

    room.status = 'playing';
    await room.save();

    res.json({ message: 'Game started successfully' });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
};

export const kickPlayer = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.host_id !== userId) {
      return res.status(403).json({ error: 'Only the host can kick players' });
    }

    if (playerId === userId) {
      return res.status(400).json({ error: 'Cannot kick yourself' });
    }

    const memberIndex = room.members.findIndex(m => m.user_id === playerId);
    if (memberIndex !== -1) {
      room.members.splice(memberIndex, 1);
      await room.save();
    }

    res.json({ message: 'Player kicked successfully' });
  } catch (error) {
    console.error('Error kicking player:', error);
    res.status(500).json({ error: 'Failed to kick player' });
  }
};

export const checkUserRoom = async (req, res) => {
  try {
    const userId = req.user.id;

    const room = await Room.findOne({ 'members.user_id': userId });

    if (room) {
      res.json({
        inRoom: true,
        roomId: room._id,
        roomName: room.room_name,
        status: room.status
      });
    } else {
      res.json({ inRoom: false });
    }
  } catch (error) {
    console.error('Error checking user room:', error);
    res.status(500).json({ error: 'Failed to check user room' });
  }
};

export const toggleReady = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Not in this room' });
    }

    const member = room.members.find(m => m.user_id === userId);
    if (!member) {
      return res.status(404).json({ error: 'Not in this room' });
    }

    member.is_ready = !member.is_ready;
    await room.save();

    res.json({ 
      message: 'Ready status updated',
      isReady: member.is_ready
    });
  } catch (error) {
    console.error('Error toggling ready status:', error);
    res.status(500).json({ error: 'Failed to toggle ready status' });
  }
};

export const endGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.host_id !== userId) {
      return res.status(403).json({ error: 'Only the host can end the game' });
    }

    room.status = 'waiting';
    room.game_state = undefined;
    room.members.forEach(m => m.is_ready = false);
    
    await room.save();

    res.json({ message: 'Game ended, room reset to lobby' });
  } catch (error) {
    console.error('Error ending game:', error);
    res.status(500).json({ error: 'Failed to end game' });
  }
};
