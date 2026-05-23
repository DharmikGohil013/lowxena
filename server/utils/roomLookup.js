import mongoose from 'mongoose';
import { Room } from '../models/index.js';

export const findRoomByIdOrSlug = async (roomIdOrSlug) => {
  try {
    if (!roomIdOrSlug) return null;
    
    // 1. Try finding by database ObjectId
    if (mongoose.isValidObjectId(roomIdOrSlug)) {
      try {
        const room = await Room.findById(roomIdOrSlug);
        if (room) return room;
      } catch (err) {
        console.error('Mongoose findById error:', err);
      }
    }
    
    // 2. Try finding by slugified room_name
    // Convert "thunder-shogun-fortress" -> "Thunder Shogun Fortress"
    const expectedRoomName = roomIdOrSlug
      .split('-')
      .map(word => {
        if (!word) return '';
        if (/^\d+$/.test(word)) return word;
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
      
    try {
      const room = await Room.findOne({ room_name: expectedRoomName });
      if (room) return room;
    } catch (err) {
      console.error('Mongoose findOne error:', err);
    }
    
    // 3. Fallback: Search all rooms and slugify their names to find a case-insensitive match
    try {
      const allRooms = await Room.find();
      const matchedRoom = allRooms.find(r => {
        if (!r.room_name) return false;
        const slug = r.room_name.toLowerCase().replace(/\s+/g, '-');
        return slug === roomIdOrSlug.toLowerCase();
      });
      if (matchedRoom) return matchedRoom;
    } catch (err) {
      console.error('Mongoose fallback search error:', err);
    }
    
    return null;
  } catch (globalError) {
    console.error('Global error in findRoomByIdOrSlug:', globalError);
    return null;
  }
};
