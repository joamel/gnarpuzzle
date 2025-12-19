const express = require('express');
const router = express.Router();

// In-memory storage for chat messages
let chatMessages = {};

// Get chat messages for a specific roomId
router.get('/:roomId', (req, res) => {
  const { roomId } = req.params;
  console.log(`GET /chat/${roomId}`);
  
  if (!chatMessages[roomId]) {
    chatMessages[roomId] = [];
  }
  
  res.status(200).json(chatMessages[roomId]);
});

// Post new chat message
router.post('/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { sender, message, sentTime } = req.body;
  
  console.log(`POST /chat/${roomId}`, { sender, message, sentTime });
  
  if (!chatMessages[roomId]) {
    chatMessages[roomId] = [];
  }
  
  const chatMessage = {
    username: sender,
    message,
    timestamp: sentTime
  };
  
  chatMessages[roomId].push(chatMessage);
  
  // Emit to all clients in the room via io (passed from main file)
  if (req.io) {
    req.io.to(roomId).emit('chatMessage', chatMessage);
  }
  
  res.status(200).json({ status: 'success' });
});

// Clear chat for a room (used when room becomes empty)
const clearChat = (roomId) => {
  console.log(`Clearing chat for room ${roomId}`);
  chatMessages[roomId] = [];
};

// Get chat storage reference for other modules
const getChatStorage = () => chatMessages;

module.exports = {
  router,
  clearChat,
  getChatStorage
};