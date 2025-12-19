const express = require('express');
const router = express.Router();

// In-memory storage for participants
let participants = {};

// Get participants for a specific roomId
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params;
  console.log(`GET /participants/${roomId}`);
  
  if (!participants[roomId]) {
    participants[roomId] = [];
  }
  
  res.status(200).json({ [roomId]: participants[roomId] });
});

// Add participant to room
router.post('/:roomId', (req, res) => {
  console.log(`POST /participants`);
  console.log(req.params);
  console.log(req.body);
  
  const { roomId } = req.params;
  const { username } = req.body;
  
  if (!participants[roomId]) {
    participants[roomId] = [];
  }
  
  // Add username if not already present
  if (!participants[roomId].includes(username)) {
    participants[roomId].push(username);
  }
  
  // Emit the participants to all clients listening on the 'participants' event
  if (req.io) {
    req.io.to(roomId).emit('participants', participants[roomId]);
  }
  
  res.status(200).json({ status: 'success' });
});

// Remove participant from room
router.delete('/:roomId/:username', (req, res) => {
  console.log(`DELETE /participants`);
  console.log(req.params);
  
  const { roomId, username } = req.params;
  
  if (participants[roomId]) {
    // Remove all instances of the username
    participants[roomId] = participants[roomId].filter(user => user !== username);
    console.log('participants after removal:', participants[roomId]);
    
    // Send leave message to chat
    const leaveMessage = {
      username: 'System',
      message: `${username} lämnade rummet`,
      timestamp: new Date().toISOString()
    };
    
    if (req.io) {
      req.io.to(roomId).emit('chatMessage', leaveMessage);
      
      // Check if room is now empty and clear chat if so
      if (participants[roomId].length === 0) {
        console.log(`Room ${roomId} is now empty, clearing chat history`);
        // Import and use chat clearing function
        const { clearChat } = require('./chat');
        clearChat(roomId);
        req.io.to(roomId).emit('chatCleared');
      }
      
      // Emit updated participants list
      req.io.to(roomId).emit('participants', participants[roomId]);
    }
  }
  
  res.status(200).json({ status: 'success' });
});

// Get participants storage reference for other modules
const getParticipantsStorage = () => participants;

// Check if room is empty
const isRoomEmpty = (roomId) => {
  return !participants[roomId] || participants[roomId].length === 0;
};

module.exports = {
  router,
  getParticipantsStorage,
  isRoomEmpty
};