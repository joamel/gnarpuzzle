// Game state management
let roomGameStates = {};

const initializeGameState = (roomId, roomUsers, customState = null) => {
    if (!roomGameStates[roomId]) {
        if (customState) {
            // Use custom state structure (from handleInitGameState)
            roomGameStates[roomId] = customState;
        } else {
            // Default simple structure
            const turnOrder = roomUsers.map(user => user.username);
            roomGameStates[roomId] = {
                gameState: {
                    turn: turnOrder[0],
                    turnOrder: turnOrder,
                    currentTurnIndex: 0,
                    gameOver: false
                },
                playerData: {},
                playersReady: new Set(),
                originalParticipants: [...turnOrder]
            };
        }
        console.log(`Initialized game state for room ${roomId}:`, roomGameStates[roomId]);
    }
    return roomGameStates[roomId];
};

const getGameState = (roomId) => {
    return roomGameStates[roomId];
};

const updateGameState = (roomId, updates) => {
    if (roomGameStates[roomId]) {
        roomGameStates[roomId].gameState = { 
            ...roomGameStates[roomId].gameState, 
            ...updates 
        };
    }
};

const updatePlayerData = (roomId, playerData) => {
    if (roomGameStates[roomId]) {
        roomGameStates[roomId].playerData = { 
            ...roomGameStates[roomId].playerData, 
            ...playerData 
        };
    }
};

const removePlayerFromGame = (roomId, username) => {
    if (roomGameStates[roomId]) {
        // Remove from player data
        if (roomGameStates[roomId].playerData && roomGameStates[roomId].playerData[username]) {
            delete roomGameStates[roomId].playerData[username];
        }
        
        const gameState = roomGameStates[roomId].gameState;
        
        // Remove from turn order and recalculate
        if (gameState.turnOrder) {
            const remainingUsers = gameState.turnOrder.filter(u => u !== username);
            
        // Calculate next player
        let nextPlayerIndex = 0;
        if (gameState.turnOrder && gameState.turn) {
            const currentPlayerIndex = gameState.turnOrder.indexOf(gameState.turn);
            const nextInOldOrder = (currentPlayerIndex + 1) % gameState.turnOrder.length;
            const nextPlayerName = gameState.turnOrder[nextInOldOrder];
            
            const indexInNewOrder = remainingUsers.indexOf(nextPlayerName);
            nextPlayerIndex = indexInNewOrder !== -1 ? indexInNewOrder : 0;
        }
        
        // Update game state
        gameState.turnOrder = remainingUsers;
        gameState.currentTurnIndex = nextPlayerIndex;
        
        if (remainingUsers.length > 0) {
            gameState.turn = remainingUsers[nextPlayerIndex];
        }
        
        return {
            remainingPlayers: remainingUsers.length,
            nextPlayer: remainingUsers[nextPlayerIndex] || null
        };
        }
    }
    return { remainingPlayers: 0, nextPlayer: null };
};

const clearGameState = (roomId) => {
    if (roomGameStates[roomId]) {
        delete roomGameStates[roomId];
        console.log(`Cleared game state for room ${roomId}`);
    }
};

const getAllGameStates = () => roomGameStates;

module.exports = {
    initializeGameState,
    getGameState,
    updateGameState,
    updatePlayerData,
    removePlayerFromGame,
    clearGameState,
    getAllGameStates
};