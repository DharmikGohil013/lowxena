import { supabaseAdmin } from '../config/supabase.js';
import * as roomNames from '../utils/roomNames.js';

// Create a new game room
export const createRoom = async (req, res) => {
  try {
    const { maxPoints, maxPlayers, isPrivate, roomCode } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!maxPoints || !maxPlayers) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (maxPoints < 100 || maxPoints > 200) {
      return res.status(400).json({ error: 'Max points must be between 100 and 200' });
    }

    if (maxPlayers < 2 || maxPlayers > 8) {
      return res.status(400).json({ error: 'Max players must be between 2 and 8' });
    }

    // Check if user is already in a room
    const { data: existingMembership } = await supabaseAdmin
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      return res.status(400).json({ error: 'You are already in a room' });
    }

    // Get existing room names to ensure uniqueness
    const { data: existingRooms } = await supabaseAdmin
      .from('rooms')
      .select('room_name');

    const existingNames = existingRooms?.map(room => room.room_name) || [];
    const roomName = roomNames.generateUniqueRoomName(existingNames);

    // Create room
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .insert({
        room_name: roomName,
        room_code: isPrivate ? roomCode : null,
        host_id: userId,
        max_players: maxPlayers,
        max_points: maxPoints,
        is_private: isPrivate,
        status: 'waiting'
      })
      .select()
      .single();

    if (roomError) throw roomError;

    // Add creator as first member
    const { error: memberError } = await supabaseAdmin
      .from('room_members')
      .insert({
        room_id: room.id,
        user_id: userId,
        is_host: true
      });

    if (memberError) throw memberError;

    res.status(201).json({ 
      message: 'Room created successfully',
      roomId: room.id,
      roomName: room.room_name,
      roomCode: room.room_code
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
};

// Get all available rooms
export const getRooms = async (req, res) => {
  try {
    // Get rooms with status 'waiting'
    const { data: rooms, error } = await supabaseAdmin
      .from('rooms')
      .select(`
        *,
        host:users!rooms_host_id_fkey(id, name, avatar_url),
        members:room_members(count)
      `)
      .eq('status', 'waiting')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format rooms data
    const formattedRooms = rooms.map(room => ({
      id: room.id,
      roomName: room.room_name,
      roomCode: room.room_code,
      hostId: room.host_id,
      hostName: room.host?.name || 'Unknown',
      maxPlayers: room.max_players,
      currentPlayers: room.members[0]?.count || 0,
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

// Get room details with players
export const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;

    // Get room details
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Get all members in the room
    const { data: members, error: membersError } = await supabaseAdmin
      .from('room_members')
      .select(`
        user:users(id, name, avatar_url),
        is_host
      `)
      .eq('room_id', roomId);

    if (membersError) throw membersError;

    // Format players data
    const players = members.map(member => ({
      id: member.user.id,
      name: member.user.name,
      avatar_url: member.user.avatar_url,
      isHost: member.is_host
    }));

    res.json({
      id: room.id,
      room_name: room.room_name,
      room_code: room.room_code,
      host_id: room.host_id,
      max_players: room.max_players,
      max_points: room.max_points,
      is_private: room.is_private,
      status: room.status,
      players
    });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
};

// Join a room
export const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { code } = req.body;
    const userId = req.user.id;

    // Get room details
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room is full
    const { count } = await supabaseAdmin
      .from('room_members')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    if (count >= room.max_players) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if room is private and code matches
    if (room.is_private && room.room_code !== code) {
      return res.status(403).json({ error: 'Invalid room code' });
    }

    // Check if already in this room
    const { data: existingMember } = await supabaseAdmin
      .from('room_members')
      .select('*')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (existingMember) {
      return res.json({ message: 'Already in room' });
    }

    // Check if user is in another room
    const { data: otherRoomMembership } = await supabaseAdmin
      .from('room_members')
      .select('room_id')
      .eq('user_id', userId)
      .single();

    if (otherRoomMembership) {
      return res.status(400).json({ error: 'You are already in another room' });
    }

    // Add user to room
    const { error: joinError } = await supabaseAdmin
      .from('room_members')
      .insert({
        room_id: roomId,
        user_id: userId,
        is_host: false
      });

    if (joinError) throw joinError;

    res.json({ message: 'Successfully joined room' });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
};

// Leave a room
export const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if user is in the room
    const { data: membership, error: memberError } = await supabaseAdmin
      .from('room_members')
      .select('is_host')
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return res.status(404).json({ error: 'You are not in this room' });
    }

    // Remove user from room
    const { error: deleteError } = await supabaseAdmin
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    // If user was host, delete room or transfer host
    if (membership.is_host) {
      // Check if there are other members
      const { data: remainingMembers } = await supabaseAdmin
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)
        .limit(1);

      if (!remainingMembers || remainingMembers.length === 0) {
        // Delete room if no members left
        await supabaseAdmin
          .from('rooms')
          .delete()
          .eq('id', roomId);
      } else {
        // Transfer host to first remaining member
        const newHostId = remainingMembers[0].user_id;
        
        await supabaseAdmin
          .from('room_members')
          .update({ is_host: true })
          .eq('room_id', roomId)
          .eq('user_id', newHostId);

        await supabaseAdmin
          .from('rooms')
          .update({ host_id: newHostId })
          .eq('id', roomId);
      }
    }

    res.json({ message: 'Successfully left room' });
  } catch (error) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: 'Failed to leave room' });
  }
};

// Start game in room
export const startGame = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // Check if user is the host
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('host_id, status')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.host_id !== userId) {
      return res.status(403).json({ error: 'Only the host can start the game' });
    }

    if (room.status !== 'waiting') {
      return res.status(400).json({ error: 'Game already started or finished' });
    }

    // Check if there are at least 2 players
    const { count } = await supabaseAdmin
      .from('room_members')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);

    if (count < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start' });
    }

    // Update room status
    const { error: updateError } = await supabaseAdmin
      .from('rooms')
      .update({ status: 'playing' })
      .eq('id', roomId);

    if (updateError) throw updateError;

    res.json({ message: 'Game started successfully' });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
};

// Kick player from room
export const kickPlayer = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { playerId } = req.body;
    const userId = req.user.id;

    // Check if user is the host
    const { data: room, error: roomError } = await supabaseAdmin
      .from('rooms')
      .select('host_id')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.host_id !== userId) {
      return res.status(403).json({ error: 'Only the host can kick players' });
    }

    if (playerId === userId) {
      return res.status(400).json({ error: 'Cannot kick yourself' });
    }

    // Remove player from room
    const { error: deleteError } = await supabaseAdmin
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', playerId);

    if (deleteError) throw deleteError;

    res.json({ message: 'Player kicked successfully' });
  } catch (error) {
    console.error('Error kicking player:', error);
    res.status(500).json({ error: 'Failed to kick player' });
  }
};
