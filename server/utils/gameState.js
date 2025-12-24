// Game state management
let roomGameStates = {};
// Simple timer management
let roomTimers = {};
let placementTimers = {}; // Individual timers for placement phase

const LETTER_SELECTION_TIMEOUT = 15000; // 15 seconds for letter selection
const LETTER_PLACEMENT_TIMEOUT = 15000; // 15 seconds for letter placement

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
        // Clear any active timer
        clearTurnTimer(roomId);
        delete roomGameStates[roomId];
        console.log(`Cleared game state for room ${roomId}`);
    }
};

const getAllGameStates = () => roomGameStates;

// Simple timer functions
const startTurnTimer = (roomId, io, currentPlayer) => {
    clearTurnTimer(roomId);

    const gameStateData = getGameState(roomId);
    if (!gameStateData || !gameStateData.gameState || gameStateData.gameState.gameOver) {
        return;
    }

    const timeoutSeconds = Math.floor(LETTER_SELECTION_TIMEOUT / 1000);
    console.log(`Starting ${timeoutSeconds}s timer for ${currentPlayer} in room ${roomId}`);

    let timeLeft = timeoutSeconds;

    const countdownInterval = setInterval(() => {
        timeLeft--;

        // Send timer to all players in room
        io.to(roomId).emit('turnTimer', {
            timeLeft: timeLeft,
            currentPlayer: currentPlayer,
            isWarning: timeLeft <= 5,
            showNumbers: timeLeft <= 5
        });

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    const mainTimeout = setTimeout(() => {
        clearInterval(countdownInterval);
        console.log(`Timer timeout for ${currentPlayer} in room ${roomId}`);
        // Move to next player
        advanceToNextPlayer(roomId, io);
    }, LETTER_SELECTION_TIMEOUT);

    roomTimers[roomId] = {
        timeout: mainTimeout,
        countdownInterval: countdownInterval,
        player: currentPlayer
    };
};

const clearTurnTimer = (roomId) => {
    if (roomTimers[roomId]) {
        clearTimeout(roomTimers[roomId].timeout);
        clearInterval(roomTimers[roomId].countdownInterval);
        delete roomTimers[roomId];
        console.log(`Cleared timer for room ${roomId}`);
    }
};

const startPlacementTimers = (roomId, io) => {
    // Clear any existing placement timers
    clearPlacementTimers(roomId);

    const gameStateData = getGameState(roomId);
    if (!gameStateData) return;

    // Get active room users from the users module
    const { getRoomUsers } = require('./users');
    const activePlayers = getRoomUsers(roomId);

    console.log(`Starting placement timers for all players in room ${roomId}`);

    activePlayers.forEach(user => {
        const username = user.username;
        const playerKey = `${roomId}:${username}`;

        let timeLeft = Math.floor(LETTER_PLACEMENT_TIMEOUT / 1000); // Convert ms to seconds
        console.log(`⏰ Starting ${timeLeft}-second timer for ${username}`);

        // Send initial timer state
        const { getCurrentUser } = require('./users');
        const initialTargetSocket = [...io.sockets.sockets.values()].find(socket => {
            const socketUser = getCurrentUser(socket.id);
            return socketUser && socketUser.username === username && socketUser.room === roomId;
        });

        if (initialTargetSocket) {
            initialTargetSocket.emit('placementTimer', {
                timeLeft: timeLeft,
                player: username,
                isWarning: timeLeft <= 5,
                showNumbers: timeLeft <= 5
            });
        }

        // Start countdown
        const countdownInterval = setInterval(() => {
            timeLeft--;
            const currentTime = timeLeft;

            // Find target socket for this specific player
            const targetSocket = [...io.sockets.sockets.values()].find(socket => {
                const socketUser = getCurrentUser(socket.id);
                return socketUser && socketUser.username === username && socketUser.room === roomId;
            });

            if (targetSocket) {
                targetSocket.emit('placementTimer', {
                    timeLeft: currentTime,
                    player: username,
                    isWarning: currentTime <= 5,
                    showNumbers: currentTime <= 5
                });
                console.log(`⏰💀 ${username}: ${currentTime} seconds left`);
            }

            // Stop countdown at 0 but don't trigger auto-place here
            if (currentTime <= 0) {
                // Send final update with timeLeft: 0 to hide timer on client
                if (targetSocket) {
                    targetSocket.emit('placementTimer', {
                        timeLeft: 0,
                        player: username,
                        isWarning: false,
                        showNumbers: false
                    });
                }
                console.log(`⏰💀 Countdown finished for ${username} (auto-place handled by timeout)`);
                clearInterval(countdownInterval);
            }
        }, 1000);

        // Main timeout for auto-placement
        const mainTimeout = setTimeout(() => {
            console.log(`💀 TIMEOUT for ${username} - triggering auto-place`);
            clearInterval(countdownInterval);
            autoPlaceForPlayer(roomId, io, username);
        }, LETTER_PLACEMENT_TIMEOUT);

        placementTimers[playerKey] = {
            timeout: mainTimeout,
            countdownInterval: countdownInterval,
            username: username
        };

        console.log(`⏰ Started placement timer for ${username} in room ${roomId} (key: ${playerKey})`);
    });

    console.log(`🎮 Total placement timers started: ${activePlayers.length} for room ${roomId}`);
    console.log(`🔧 Active placement timers:`, Object.keys(placementTimers).filter(key => key.startsWith(`${roomId}:`)));
};

const clearPlacementTimers = (roomId) => {
    console.log(`🧹 CLEARING ALL placement timers for room ${roomId}`);
    const timersBeforeClearing = Object.keys(placementTimers).filter(key => key.startsWith(`${roomId}:`));
    console.log(`🎯 About to clear ${timersBeforeClearing.length} timers:`, timersBeforeClearing);

    Object.keys(placementTimers).forEach(playerKey => {
        if (playerKey.startsWith(`${roomId}:`)) {
            const timer = placementTimers[playerKey];
            clearTimeout(timer.timeout);
            clearInterval(timer.countdownInterval);
            console.log(`🗑️💀  Cleared timer for ${playerKey}`);
            delete placementTimers[playerKey];
        }
    });
    console.log(`✅ Cleared ALL placement timers for room ${roomId}`);
};

const clearPlayerPlacementTimer = (roomId, username) => {
    const playerKey = `${roomId}:${username}`;
    console.log(`🔥 CLEARING placement timer for ${username} in room ${roomId}`);

    if (placementTimers[playerKey]) {
        clearTimeout(placementTimers[playerKey].timeout);
        clearInterval(placementTimers[playerKey].countdownInterval);
        delete placementTimers[playerKey];
        console.log(`✅ Successfully cleared placement timer for ${username} in room ${roomId}`);
    } else {
        console.log(`❌💀  No placement timer found for ${username} in room ${roomId} (key: ${playerKey})`);
    }

    // Log remaining timers for this room
    const remainingTimers = Object.keys(placementTimers).filter(key => key.startsWith(`${roomId}:`));
    console.log(`🔧 Remaining placement timers for room ${roomId}:`, remainingTimers);
    console.log(`📊 Total active timers: ${remainingTimers.length}`);
};

const autoPlaceForPlayer = (roomId, io, username) => {
    console.log(`🎲 AUTO-PLACING letter for ${username} in room ${roomId}`);

    // Remove this player's placement timer to avoid double-triggering
    const playerKey = `${roomId}:${username}`;
    if (placementTimers[playerKey]) {
        clearTimeout(placementTimers[playerKey].timeout);
        clearInterval(placementTimers[playerKey].countdownInterval);
        delete placementTimers[playerKey];
        console.log(`🗑️💀 Removed timer for ${username} to prevent double-trigger`);
    }

    const { getCurrentUser } = require('./users');
    const targetSocket = [...io.sockets.sockets.values()].find(socket => {
        const socketUser = getCurrentUser(socket.id);
        return socketUser && socketUser.username === username && socketUser.room === roomId;
    });

    if (!targetSocket) {
        console.log(`❌ No socket found for ${username} in room ${roomId}`);
        return;
    }

    const gameStateData = getGameState(roomId);
    if (!gameStateData || !gameStateData.gameState) {
        console.log(`❌ No game state found for room ${roomId}`);
        return;
    }

    const currentLetter = gameStateData.gameState.currentLetter;
    if (!currentLetter) {
        console.log(`❌ No current letter set for room ${roomId}`);
        return;
    }

    console.log(`🔍 Auto-placing letter: "${currentLetter}"`);

    // Get board size from game state (sent from client)
    let boardSize = gameStateData.gameState.boardSize || 4; // Default to 4x4
    console.log(`📐 Using board size: ${boardSize}x${boardSize}`);

    // Try to get the current player's existing board if they have one
    let currentBoard = null;
    console.log(`🔍 Checking for existing board for ${username}`);
    console.log(`🔍 Available playerBoards:`, Object.keys(gameStateData.playerBoards || {}));

    if (gameStateData.playerBoards && gameStateData.playerBoards[username]) {
        currentBoard = gameStateData.playerBoards[username];
        console.log(`📋 Found existing board for ${username}:`, currentBoard);
        console.log(`📋 Board type:`, typeof currentBoard, `Array:`, Array.isArray(currentBoard));
    } else {
        console.log(`❌💀  No existing board found for ${username}`);
    }

    // Create new board or use existing one
    const autoBoard = currentBoard ?
        currentBoard.map(row => [...row]) : // Copy existing board
        Array(boardSize).fill(null).map(() => Array(boardSize).fill("")); // Create new empty board

    console.log(`📋 Working with board:`, autoBoard);

    // Check if player has already placed the current letter
    let existingLetterPosition = null;
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (autoBoard[i][j] === currentLetter) {
                existingLetterPosition = [i, j];
                console.log(`✅ Found existing letter "${currentLetter}" at position [${i}, ${j}]`);
                break;
            }
        }
        if (existingLetterPosition) break;
    }

    // If letter is already placed, use that position for auto-placement
    if (existingLetterPosition) {
        console.log(`✅ Using existing placement of "${currentLetter}" at [${existingLetterPosition[0]}, ${existingLetterPosition[1]}]`);

        // Send the existing board with the already placed letter
        console.log(`📤 Sending autoPlaceLetter event to ${username} (using existing placement)`);
        targetSocket.emit('autoPlaceLetter', {
            board: autoBoard,
            position: existingLetterPosition,
            letter: currentLetter,
            username: username
        });

        // Directly trigger playerDone on server
        setTimeout(() => {
            const gameData = {
                board: autoBoard,
                round: gameStateData.gameState.round || 1,
                currentLetter: currentLetter,
                gameOver: false,
                username: username
            };

            console.log(`🤖 Auto-triggering playerDone server-side for ${username} (existing placement)`);
            targetSocket.emit('playerDone', gameData);
        }, 200);

        return; // Exit early since we're using existing placement
    }

    // Find all empty positions (only if letter not already placed)
    const emptyPositions = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = autoBoard[i][j];
            console.log(`🔍 Cell [${i},${j}]:`, cell, `type:`, typeof cell, `empty:`, (!cell || cell === ""));
            if (!cell || cell === "") {
                emptyPositions.push([i, j]);
            }
        }
    }

    if (emptyPositions.length === 0) {
        console.log(`❌ No empty positions found on board for ${username}`);
        return;
    }

    // Pick a random empty position
    const randomIndex = Math.floor(Math.random() * emptyPositions.length);
    const position = emptyPositions[randomIndex];

    // Place the letter at the random empty position
    autoBoard[position[0]][position[1]] = currentLetter;
    
    // Update player's board in game state
    if (!gameStateData.playerBoards) {
        gameStateData.playerBoards = {};
    }
    gameStateData.playerBoards[username] = autoBoard;

    console.log(`✅ Auto-placed "${currentLetter}" at empty position [${position[0]}, ${position[1]}]`);
    console.log(`📊 Empty positions available: ${emptyPositions.length}/${boardSize * boardSize}`);
    console.log(`📋 Final auto board:`, autoBoard);

    // Send the auto-placed board directly to this player
    console.log(`📤 Sending autoPlaceLetter event to ${username}`);
    targetSocket.emit('autoPlaceLetter', {
        board: autoBoard,
        position: position,
        letter: currentLetter,
        username: username
    });

    // Create gameData for server-side playerDone trigger
    const gameData = {
        gameOver: false, // Will be determined server-side
        board: autoBoard,
        round: gameStateData.gameState.round || 1,
        currentLetter: currentLetter,
        username: username
    };

    console.log(`🎲 Auto-triggering playerDone server-side for ${username}`);

    // Directly trigger playerDone on server instead of relying on client
    setTimeout(() => {
        console.log(`🤖 Auto-triggering playerDone server-side for ${username}`);
        
        // Simulate playerDone event directly on the server
        targetSocket.emit('playerDone', gameData);
    }, 200); // Short delay to ensure UI updates
};

const advanceToNextPlayer = (roomId, io) => {
    const gameStateData = getGameState(roomId);
    if (!gameStateData || !gameStateData.gameState) {
        return;
    }

    const gameState = gameStateData.gameState;
    const currentTurnOrder = gameState.turnOrder || [];

    if (currentTurnOrder.length <= 1) {
        console.log('Not enough players to advance turn');
        return;
    }

    // Find current player index
    const currentPlayerIndex = currentTurnOrder.indexOf(gameState.turn);
    const nextPlayerIndex = (currentPlayerIndex + 1) % currentTurnOrder.length;
    const nextPlayer = currentTurnOrder[nextPlayerIndex];

    console.log(`⏰ ADVANCING TURN: ${gameState.turn} -> ${nextPlayer} (timeout)`);

    // Update game state with next player
    updateGameState(roomId, {
        ...gameState,
        turn: nextPlayer,
        currentTurnIndex: nextPlayerIndex
    });

    // Send forceUpdateTurn to all players
    const { emitForceUpdateTurn } = require('./socketEmitters');
    emitForceUpdateTurn(io, roomId, {
        turn: nextPlayer,
        round: gameState.round || 1,
        currentLetter: gameState.currentLetter || '',
        gameOver: false
    });

    // Start timer for next player
    startTurnTimer(roomId, io, nextPlayer);
};

module.exports = {
    initializeGameState,
    getGameState,
    updateGameState,
    updatePlayerData,
    removePlayerFromGame,
    clearGameState,
    getAllGameStates,
    startTurnTimer,
    clearTurnTimer,
    startPlacementTimers,
    clearPlacementTimers,
    clearPlayerPlacementTimer,
    advanceToNextPlayer
};