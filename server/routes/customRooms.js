const express = require('express');
const router = express.Router();

// Store custom rooms in memory (in production, use a database)
const customRooms = new Map();

// Create a new custom room
router.post('/create', (req, res) => {
  try {
    const { roomCode, createdBy } = req.body;
    
    if (!roomCode || roomCode.length < 3) {
      return res.status(400).json({ 
        error: 'Rumskoden måste vara minst 3 tecken' 
      });
    }

    // Check if room already exists
    if (customRooms.has(roomCode.toUpperCase())) {
      return res.status(409).json({ 
        error: 'En rum med denna kod finns redan' 
      });
    }

    // Create new room
    const newRoom = {
      code: roomCode.toUpperCase(),
      createdBy: createdBy || 'Anonym',
      createdAt: new Date(),
      participants: [],
      isActive: true,
      maxParticipants: 8 // Limit for custom rooms
    };

    customRooms.set(roomCode.toUpperCase(), newRoom);

    console.log(`🏠 Custom room created: ${roomCode.toUpperCase()} by ${createdBy}`);

    res.status(201).json({
      success: true,
      roomCode: roomCode.toUpperCase(),
      message: 'Rummet har skapats!'
    });

  } catch (error) {
    console.error('Error creating custom room:', error);
    res.status(500).json({ 
      error: 'Fel vid skapande av rum' 
    });
  }
});

// Join a custom room
router.post('/join', (req, res) => {
  try {
    const { roomCode, username } = req.body;
    
    if (!roomCode || !username) {
      return res.status(400).json({ 
        error: 'Rumskod och användarnamn krävs' 
      });
    }

    const room = customRooms.get(roomCode.toUpperCase());
    
    if (!room) {
      return res.status(404).json({ 
        error: 'Rummet finns inte eller har upphört' 
      });
    }

    if (!room.isActive) {
      return res.status(403).json({ 
        error: 'Rummet är inte aktivt' 
      });
    }

    if (room.participants.length >= room.maxParticipants) {
      return res.status(403).json({ 
        error: 'Rummet är fullt' 
      });
    }

    // Check if user already in room
    const existingParticipant = room.participants.find(p => p.username === username);
    if (existingParticipant) {
      return res.status(409).json({ 
        error: 'Du är redan i detta rum' 
      });
    }

    // Add participant to room
    room.participants.push({
      username,
      joinedAt: new Date(),
      socketId: null // Will be updated when socket connects
    });

    console.log(`👤 ${username} joined custom room: ${roomCode.toUpperCase()}`);

    res.json({
      success: true,
      roomCode: roomCode.toUpperCase(),
      participants: room.participants.length,
      message: `Välkommen till rummet ${roomCode.toUpperCase()}!`
    });

  } catch (error) {
    console.error('Error joining custom room:', error);
    res.status(500).json({ 
      error: 'Fel vid anslutning till rum' 
    });
  }
});

// Get custom room info
router.get('/:roomCode', (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = customRooms.get(roomCode.toUpperCase());
    
    if (!room) {
      return res.status(404).json({ 
        error: 'Rummet finns inte' 
      });
    }

    res.json({
      roomCode: room.code,
      participants: room.participants.map(p => ({
        username: p.username,
        joinedAt: p.joinedAt
      })),
      participantCount: room.participants.length,
      maxParticipants: room.maxParticipants,
      isActive: room.isActive,
      createdAt: room.createdAt
    });

  } catch (error) {
    console.error('Error getting custom room info:', error);
    res.status(500).json({ 
      error: 'Fel vid hämtning av rumsinformation' 
    });
  }
});

// Leave custom room
router.delete('/leave', (req, res) => {
  try {
    const { roomCode, username } = req.body;
    
    if (!roomCode || !username) {
      return res.status(400).json({ 
        error: 'Rumskod och användarnamn krävs' 
      });
    }

    const room = customRooms.get(roomCode.toUpperCase());
    
    if (!room) {
      return res.status(404).json({ 
        error: 'Rummet finns inte' 
      });
    }

    // Remove participant from room
    const initialCount = room.participants.length;
    room.participants = room.participants.filter(p => p.username !== username);

    if (room.participants.length === initialCount) {
      return res.status(404).json({ 
        error: 'Du var inte i detta rum' 
      });
    }

    // If room is empty, mark as inactive
    if (room.participants.length === 0) {
      room.isActive = false;
      console.log(`🏠 Custom room ${roomCode.toUpperCase()} is now empty and inactive`);
    }

    console.log(`👋 ${username} left custom room: ${roomCode.toUpperCase()}`);

    res.json({
      success: true,
      message: 'Du har lämnat rummet',
      remainingParticipants: room.participants.length
    });

  } catch (error) {
    console.error('Error leaving custom room:', error);
    res.status(500).json({ 
      error: 'Fel vid utträde från rum' 
    });
  }
});

// Get all active custom rooms (for admin purposes)
router.get('/', (req, res) => {
  try {
    const activeRooms = Array.from(customRooms.values())
      .filter(room => room.isActive)
      .map(room => ({
        roomCode: room.code,
        participantCount: room.participants.length,
        maxParticipants: room.maxParticipants,
        createdAt: room.createdAt
      }));

    res.json({
      activeRooms: activeRooms.length,
      rooms: activeRooms
    });

  } catch (error) {
    console.error('Error getting custom rooms list:', error);
    res.status(500).json({ 
      error: 'Fel vid hämtning av rumslista' 
    });
  }
});

// Cleanup inactive rooms (run periodically)
const cleanupInactiveRooms = () => {
  const now = new Date();
  const maxInactiveTime = 24 * 60 * 60 * 1000; // 24 hours

  for (const [roomCode, room] of customRooms.entries()) {
    if (!room.isActive && (now - room.createdAt) > maxInactiveTime) {
      customRooms.delete(roomCode);
      console.log(`🧹 Cleaned up inactive room: ${roomCode}`);
    }
  }
};

// Run cleanup every hour
setInterval(cleanupInactiveRooms, 60 * 60 * 1000);

// Export the router and rooms map for use in socket handlers
module.exports = {
  router,
  customRooms
};