// Socket event emitters - centralized place for all socket emissions

const emitChatMessage = (io, roomId, message) => {
    io.to(roomId).emit('chatMessage', message);
};

const emitChatCleared = (io, roomId) => {
    io.to(roomId).emit('chatCleared');
};

const emitParticipants = (io, roomId, participantsList) => {
    io.to(roomId).emit('participants', participantsList);
};

const emitRoomUsers = (io, roomId, users) => {
    io.to(roomId).emit('roomUsers', { users });
};

const emitMessage = (io, roomId, message) => {
    io.to(roomId).emit('message', message);
};

const emitReceiveMessage = (io, roomId, formattedMessage) => {
    io.to(roomId).emit('receiveMessage', formattedMessage);
};

const emitGameState = (io, roomId, gameState) => {
    io.to(roomId).emit('gameState', gameState);
};

const emitGameResults = (io, socketId, results) => {
    io.to(socketId).emit('gameResults', results);
};

const emitAllPlayerResults = (io, roomId, allPlayerData) => {
    io.to(roomId).emit('allPlayerResults', allPlayerData);
};

const emitGameOver = (io, roomId, gameOverData) => {
    io.to(roomId).emit('gameOver', gameOverData);
};

const emitPlayerLeft = (io, roomId, playerData) => {
    io.to(roomId).emit('playerLeft', playerData);
};

const emitNextRound = (io, roomId, nextRoundData) => {
    io.to(roomId).emit('nextRound', nextRoundData);
};

module.exports = {
    emitChatMessage,
    emitChatCleared,
    emitParticipants,
    emitRoomUsers,
    emitMessage,
    emitReceiveMessage,
    emitGameState,
    emitGameResults,
    emitAllPlayerResults,
    emitGameOver,
    emitPlayerLeft,
    emitNextRound
};