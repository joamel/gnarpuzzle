const {
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./users');
const formatMessage = require('./messages');
const { 
    emitChatMessage,
    emitRoomUsers,
    emitReceiveMessage,
    emitGameState,
    emitGameResults,
    emitAllPlayerResults,
    emitGameOver,
    emitPlayerLeft,
    emitForceUpdateTurn,
    emitNextRound
} = require('./socketEmitters');
const { 
    initializeGameState,
    getGameState,
    updateGameState,
    updatePlayerData,
    removePlayerFromGame,
    clearGameState,
    startTurnTimer,
    clearTurnTimer,
    advanceToNextPlayer,
    startPlacementTimers,
    clearPlacementTimers,
    clearPlayerPlacementTimer
} = require('./gameState');
const { getChatStorage, clearChat } = require('../routes/chat');
const { getParticipantsStorage, isRoomEmpty } = require('../routes/participants');

const botName = "Chat Bot";

// Ready state storage per room
const roomReadyStates = new Map(); // roomId -> Set of ready usernames

const handleJoinRoom = (socket, io) => {
    socket.on("joinRoom", ({ username, room }) => {
        console.log(`${username} joined room ${room}`);
        const { userJoin } = require('./users');
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        // Add join message to chat history
        const chatMessages = getChatStorage();
        const joinMessage = {
            sender: botName,
            message: `${user.username} has joined the room`,
            sentTime: new Date().toISOString(),
            roomId: user.room
        };

        if (!chatMessages[user.room]) {
            chatMessages[user.room] = [];
        }
        chatMessages[user.room].push(joinMessage);

        // Welcome current user
        socket.emit(
            "chatMessage",
            formatMessage(botName, "Welcome to Gnarp puzzle!")
        );

        // Broadcast join message to all in room
        emitChatMessage(io, user.room, joinMessage);

        // Send users and room info
        emitRoomUsers(io, user.room, getRoomUsers(user.room));

        // Listen for chatMessage
        socket.on("chatMessage", (msg) => {
            const user = getCurrentUser(socket.id);
            console.log(user.room);
            emitReceiveMessage(io, user.room, formatMessage(user.username, msg.message));
        });
    });
};

const handleSendMessage = (socket, io) => {
    socket.on("sendMessage", (data) => {
        console.log(data);
        socket.to(data.room).emit("receiveMessage", data);
    });
};

const handleInitGameState = (socket, io) => {
    socket.on("initGameState", (gameState) => {
        const user = getCurrentUser(socket.id);

        if (user) {
            // Initialize server's turn tracking for this room using the old logic
            let gameStateStorage = getGameState(user.room);
            
            if (!gameStateStorage) {
                const roomUsers = getRoomUsers(user.room);
                // Create the game state structure like the old code did
                initializeGameState(user.room, roomUsers, {
                    playersReady: new Set(),
                    gameState: gameState, // Save complete gameState including turnOrder
                    playerBoards: {},
                    playersGameOver: new Set(), // Initialize playersGameOver tracking
                    originalParticipants: roomUsers.map(u => u.username),
                    round: 1
                });
            } else {
                // If room already exists, update gameState and reset game over tracking
                // But preserve currentLetter if it exists
                const existingCurrentLetter = gameStateStorage.gameState?.currentLetter;
                const updatedGameState = { ...gameState };

                // Keep existing currentLetter if we have one and incoming one is empty
                if (existingCurrentLetter && !gameState.currentLetter) {
                    updatedGameState.currentLetter = existingCurrentLetter;
                    console.log(`🔄 Preserving existing currentLetter: "${existingCurrentLetter}"`);
                }

                updateGameState(user.room, updatedGameState);
                const { getAllGameStates } = require('./gameState');
                let roomGameStates = getAllGameStates();
                if (roomGameStates[user.room]) {
                    roomGameStates[user.room].playersGameOver = new Set(); // Reset for new game
                }
            }
            
            const roomUsers = getRoomUsers(user.room);
            console.log(`Game initialized in room ${user.room}, starting turn: ${gameState.turn}`);
            console.log('Room users at init:', roomUsers.map((u, index) => `${u.username} (Player ${index + 1})`));
            
            emitRoomUsers(io, user.room, roomUsers);
            io.to(user.room).emit("initGameState", gameState);

            // Start timer for current player
            startTurnTimer(user.room, io, gameState.turn);
        }
    });
};

const handleNextRound = (socket, io) => {
    socket.on("nextRound", (data) => {
        const user = getCurrentUser(socket.id);
        if (user) {
            console.log(`Next round data for room ${user.room}:`, data);
        
        const gameStateData = getGameState(user.room);
        if (gameStateData) {
            updatePlayerData(user.room, { [data.username]: data });
            const allPlayersSubmitted = getRoomUsers(user.room).every(roomUser => 
                gameStateData.playerData[roomUser.username]
            );
            
            if (allPlayersSubmitted) {
                console.log('All players have submitted their data. Sending results to all players.');
                gameStateData.allPlayerData = gameStateData.playerData;
                emitAllPlayerResults(io, user.room, gameStateData.allPlayerData);
            }
        }
        
        emitNextRound(io, user.room, data);
        }
    });
};

const handleRequestResults = (socket, io) => {
    socket.on("requestResults", () => {
        const user = getCurrentUser(socket.id);
        if (!user) return;
        
        const gameStateData = getGameState(user.room);
        if (gameStateData && gameStateData.allPlayerData) {
            emitAllPlayerResults(io, user.room, gameStateData.allPlayerData);
        }
    });
};

const handleLeaveRoom = (socket, io) => {
    socket.on("leaveRoom", ({ room, username }) => {
        console.log(`=== LEAVE ROOM EVENT RECEIVED ===`);
        console.log(`${username} is leaving room ${room}`);
        console.log(`Socket ID: ${socket.id}`);
        
        const gameStateData = getGameState(room);
        
        // Check if there's an ongoing game
        if (gameStateData && gameStateData.gameState && !gameStateData.gameState.gameOver) {
            console.log(`Game in progress in ${room}, player ${username} leaving`);
            
            // Clear timer when player leaves
            clearTurnTimer(room);
            
            const result = removePlayerFromGame(room, username);
            
            console.log(`New turnOrder:`, gameStateData.gameState.turnOrder);
            console.log(`New currentTurnIndex: ${gameStateData.gameState.currentTurnIndex}, next player: ${result.nextPlayer}`);
            console.log(`Player ${username} left. Players remaining in game: ${result.remainingPlayers}`);
        
            if (result.remainingPlayers === 1) {
                // Walkover victory
                const winner = result.nextPlayer || gameStateData.gameState.turnOrder[0];
                console.log(`WALKOVER VICTORY: ${winner} wins by walkover!`);
                
                updateGameState(room, { gameOver: true });
                
                const walkoverMessage = {
                    username: "System",
                    message: `🏆 ${username} left the game. Congratulations ${winner} on the win!`,
                    timestamp: new Date().toISOString()
                };
                emitChatMessage(io, room, walkoverMessage);
                
                // Create leaderboard
                const originalParticipants = gameStateData.originalParticipants || [];
                const winnerPoints = 10;
                const leaderboard = originalParticipants.map(participant => ({
                    username: participant,
                    points: participant === winner ? winnerPoints : 0,
                    walkover: true,
                    winner: participant === winner
                })).sort((a, b) => b.points - a.points);
                
                // Send walkover victory to winner
                const winnerUser = getRoomUsers(room).find(u => u.username === winner);
                if (winnerUser) {
                console.log(`Sending walkover victory to ${winner}`);
                emitGameResults(io, winnerUser.id, {
                    ...gameStateData.gameState,
                    gameOver: true,
                    words: ["Walkover Victory"],
                    points: winnerPoints,
                    leaderboard: leaderboard,
                    isPersonal: true,
                    walkover: true,
                    originalParticipants: originalParticipants
                });
                }
                
                emitGameOver(io, room, { 
                winner: winner,
                reason: "walkover",
                leftPlayer: username
                });
            } else if (result.remainingPlayers > 1) {
                // Continue game with updated turn order
                const continueMessage = {
                    username: "System",
                    message: `${username} left the game. ${result.nextPlayer}'s turn continues.`,
                    timestamp: new Date().toISOString()
                };
                emitChatMessage(io, room, continueMessage);
                
                emitPlayerLeft(io, room, {
                    leftPlayer: username,
                    nextPlayer: result.nextPlayer,
                    turnOrder: gameStateData.gameState.turnOrder,
                    gameOver: false
                });

                // Send forceUpdateTurn with timer data
                emitForceUpdateTurn(io, room, {
                    turn: result.nextPlayer,
                    round: gameStateData.gameState.round || 1,
                    currentLetter: gameStateData.gameState.currentLetter || '',
                    gameOver: false
                });

                // Start timer for next player
                startTurnTimer(room, io, result.nextPlayer);
            } else {
                // No players left, end game
                updateGameState(room, { gameOver: true });
                emitGameOver(io, room, { 
                    winner: null,
                    reason: "all_left",
                    leftPlayer: username
                });
            }
        }
        
        // Remove user from the room
        const user = getCurrentUser(socket.id);
        if (user) {
            userLeave(socket.id);
            socket.leave(room);
        
            // Check if room is completely empty
            const remainingSocketUsers = getRoomUsers(room);
            const participants = getParticipantsStorage();
            const remainingParticipants = participants[room] || [];
            
            if (remainingSocketUsers.length === 0 && remainingParticipants.length === 0) {
                console.log(`Room ${room} is completely empty, clearing chat history`);
                clearChat(room);
                clearGameState(room);
                clearRoomReadyState(room);
            }
        }
    });
};

const handlePlayerDone = (socket, io) => {
    socket.on("playerDone", (gameData) => {
        const user = getCurrentUser(socket.id);
        if (!user) return;
        
        console.log(`Player ${user.username} is done in room ${user.room}`);
        
        // Clear this player's placement timer
        clearPlayerPlacementTimer(user.room, user.username);
        
        // Access roomGameStates directly like in original code
        const { getAllGameStates } = require('./gameState');
        let roomGameStates = getAllGameStates();
        
        // Initialize room game state if not exists using original logic
        if (!roomGameStates[user.room]) {
            const roomUsers = getRoomUsers(user.room);
            roomGameStates[user.room] = {
                playersReady: new Set(),
                gameState: null,
                playerBoards: {},
                playersGameOver: new Set(), // Initialize playersGameOver tracking
                originalParticipants: roomUsers.map(u => u.username),
                round: 1
            };
        }
        
        // Mark player as ready and store their individual board
        roomGameStates[user.room].playersReady.add(user.username);
        roomGameStates[user.room].playerBoards[user.username] = {
            board: gameData.board,
            socketId: socket.id
        };
        
        console.log(`=== BOARD STORED ===`);
        console.log(`Player: ${user.username}`);
        console.log(`Board:`, gameData.board);
        console.log(`Total playerBoards:`, Object.keys(roomGameStates[user.room].playerBoards));
        
        // IMPORTANT: Only update certain parts, preserve turn and turnOrder!
        if (!roomGameStates[user.room].gameState) {
            roomGameStates[user.room].gameState = gameData;
        } else {
            // Preserve turn and turnOrder, only update board and other client data
            Object.assign(roomGameStates[user.room].gameState, {
                board: gameData.board,
                round: gameData.round,
                currentLetter: gameData.currentLetter,
                gameOver: gameData.gameOver
            });
        }
        
        const roomUsers = getRoomUsers(user.room);
        const readyCount = roomGameStates[user.room].playersReady.size;
        
        console.log(`${readyCount}/${roomUsers.length} players ready in room ${user.room}`);
        console.log('Players ready:', Array.from(roomGameStates[user.room].playersReady));
        
        // If all players ready, proceed to next round
        if (readyCount === roomUsers.length) {
            console.log('🧹 All players are ready - clearing all placement timers');
            // Clear all placement timers when everyone is done
            clearPlacementTimers(user.room);
            
            // Ensure we have a gameState object with correct turn
            if (!roomGameStates[user.room].gameState) {
                const currentRoomUsers = getRoomUsers(user.room);
                roomGameStates[user.room].gameState = {
                    turn: currentRoomUsers[0]?.username,
                    turnOrder: currentRoomUsers.map(u => u.username),
                    currentTurnIndex: 0
                };
            }
            
            // Only update gameOver and round, PRESERVE everything else (especially turn)
            roomGameStates[user.room].gameState.gameOver = gameData.gameOver;
            roomGameStates[user.room].gameState.round = gameData.round || 1;
            
            let gameState = roomGameStates[user.room].gameState;
            
            console.log(`=== PLAYER DONE PROCESSING ===`);
            console.log(`Player: ${user.username}`);
            console.log(`gameData.gameOver: ${gameData.gameOver}`);
            console.log(`gameState.gameOver: ${gameState.gameOver}`);
            console.log(`Room: ${user.room}`);
            console.log(`Players ready: ${roomGameStates[user.room].playersReady.size}/${roomUsers.length}`);
            
            if (gameState.gameOver) {
                console.log(`=== GAME IS OVER - CALCULATING RESULTS ===`);
                console.log(`Room: ${user.room}`);
                console.log(`PlayerBoards:`, Object.keys(roomGameStates[user.room].playerBoards || {}));
                
                // Calculate results for each player individually using their own boards
                const { getPossibleWords, getPoints } = require('./helper');
                const playerResults = {};
                const playerBoards = roomGameStates[user.room].playerBoards;
                
                // Calculate results for each player's individual board
                Object.entries(playerBoards).forEach(([username, playerData]) => {
                    console.log(`Calculating results for ${username}`);
                    const possibleWords = getPossibleWords(playerData.board);
                    const [correctWords, points] = getPoints(possibleWords);
                    let totalScore = points.reduce((a, b) => a + b, 0);
                    
                    playerResults[username] = {
                        words: correctWords,
                        points: totalScore,
                        socketId: playerData.socketId
                    };
                    
                    console.log(`${username}: ${totalScore} points, words: ${correctWords.length}`);
                });
                
                // Create leaderboard
                const leaderboard = Object.entries(playerResults)
                    .map(([username, result]) => ({
                        username,
                        points: result.points
                    }))
                    .sort((a, b) => b.points - a.points);
                
                console.log('Final leaderboard:', leaderboard);
                
                // Send personalized results to each player
                Object.entries(playerResults).forEach(([username, result]) => {
                    io.to(result.socketId).emit("gameResults", {
                        ...gameState,
                        words: result.words,
                        points: result.points,
                        leaderboard: leaderboard,
                        isPersonal: true,
                        originalParticipants: roomGameStates[user.room].originalParticipants || []
                    });
                });
                
                // Prepare all player data for comparison
                const allPlayerData = {};
                Object.entries(playerResults).forEach(([username, result]) => {
                    allPlayerData[username] = {
                        words: result.words,
                        points: result.points,
                        board: playerBoards[username].board
                    };
                });
                
                // Send all player data for comparison
                emitAllPlayerResults(io, user.room, allPlayerData);
                return; // Exit early since game is over
            } else {
                // Regular round progression
                // Reset ready state for next round
                roomGameStates[user.room].playersReady.clear();
                
                // ROBUST: Always create turnOrder from current users in room
                const currentRoomUsers = getRoomUsers(user.room);
                const currentTurnOrder = currentRoomUsers.map(u => u.username);
                
                // Find who should get next turn based on who had previous turn
                let nextPlayerIndex = 0; // Default to first player
                if (gameState.turn) {
                    const currentPlayerIndex = currentTurnOrder.indexOf(gameState.turn);
                    if (currentPlayerIndex !== -1) {
                        // Next player in order
                        nextPlayerIndex = (currentPlayerIndex + 1) % currentTurnOrder.length;
                    }
                }
                
                const nextPlayer = currentTurnOrder[nextPlayerIndex];
                
                console.log(`Next player: ${nextPlayer} (index ${nextPlayerIndex})`);
                
                // Update gameState with correct next turn - update directly on server
                roomGameStates[user.room].gameState.turnOrder = currentTurnOrder;
                roomGameStates[user.room].gameState.turn = nextPlayer; 
                roomGameStates[user.room].gameState.currentTurnIndex = nextPlayerIndex;
                
                const updatedGameState = roomGameStates[user.room].gameState;
                
                console.log('=== SENDING NEXT ROUND EVENT ===');
                console.log('Updated game state:', updatedGameState);
                console.log('Sending to room:', user.room);
                
                // Send updated game state to all players in room
                io.to(user.room).emit("nextRound", updatedGameState);
                
                // Start timer for next player's turn
                startTurnTimer(user.room, io, nextPlayer);
            }
        }
    });
};

const handleRequestAllResults = (socket, io) => {
    socket.on("requestAllResults", (data) => {
        const user = getCurrentUser(socket.id);
        if (!user) return;
        
        const gameState = getGameState(user.room);
        if (gameState && gameState.allPlayerData) {
            socket.emit("allPlayerResults", gameState.allPlayerData);
        }
    });
};

const handleSendLetter = (socket, io) => {
    socket.on("sendLetter", (data) => {
        const user = getCurrentUser(socket.id);
        console.log('Send letter data:', data);
        
        // Clear turn timer when letter is selected
        clearTurnTimer(user.room);
        
        // Update game state with current letter
        updateGameState(user.room, { currentLetter: data.currentLetter });
        
        io.to(user.room).emit("receiveLetter", data.currentLetter);
        
        // Start placement timers for all players
        startPlacementTimers(user.room, io);
    });
};

const handleUpdatePlayerBoard = (socket, io) => {
    socket.on("updatePlayerBoard", (data) => {
        const user = getCurrentUser(socket.id);
        if (!user) return;

        console.log(`📋 Updating board for ${user.username} in room ${user.room}`);
        
        // Store the updated board state
        const gameStateData = getGameState(user.room);
        if (gameStateData) {
            if (!gameStateData.playerBoards) {
                gameStateData.playerBoards = {};
            }
            gameStateData.playerBoards[user.username] = data.board;
            console.log(`📋 Stored board for ${user.username}:`, data.board);
        }
    });
};

const handleStartGame = (socket, io) => {
    socket.on("startGame", (data) => {
        console.log('Starting game for room:', data.roomId);
        // Notify all players in the room that the game is starting
        io.to(data.roomId).emit("gameStarted", {
            roomId: data.roomId,
            startedBy: data.username
        });
    });
};

const handleClientReconnected = (socket, io) => {
    socket.on("clientReconnected", ({ username }) => {
        console.log(`=== CLIENT RECONNECTED: ${username} ===`);
        
        // Hitta och ta bort användaren från alla rum
        const roomsToCheck = ['room1', 'room2', 'room3', 'room4'];
        
        roomsToCheck.forEach(roomId => {
            // Ta bort från participants
            const participantsStorage = getParticipantsStorage();
            if (participantsStorage[roomId]) {
                const initialCount = participantsStorage[roomId].length;
                participantsStorage[roomId] = participantsStorage[roomId].filter(p => p !== username);
                const afterCount = participantsStorage[roomId].length;
                
                if (initialCount !== afterCount) {
                    console.log(`Removed ${username} from ${roomId} participants (${initialCount} -> ${afterCount})`);
                    // Meddela andra i rummet
                    io.to(roomId).emit('participants', participantsStorage[roomId]);
                }
            }
            
            // Ta bort från user state
            const roomUsers = getRoomUsers(roomId);
            roomUsers.forEach(user => {
                if (user.username === username) {
                    userLeave(user.id);
                    console.log(`Removed user ${username} from room ${roomId} user state`);
                }
            });
            
            // Ta bort från game state om det finns
            const gameStateData = getGameState(roomId);
            if (gameStateData && gameStateData.gameState && gameStateData.gameState.turnOrder) {
                if (gameStateData.gameState.turnOrder.includes(username)) {
                    removePlayerFromGame(roomId, username);
                    console.log(`Removed ${username} from ${roomId} game state`);
                }
            }
        });
        
        console.log(`Cleanup completed for ${username}`);
        socket.emit('cleanupComplete');
    });
};

const handleDisconnect = (socket, io) => {
    socket.on("disconnect", () => {
        const user = userLeave(socket.id);

        if (user) {
            emitReceiveMessage(io, user.room, formatMessage(botName, `${user.username} has left the chat`));
            emitRoomUsers(io, user.room, getRoomUsers(user.room));
        }
    });
};

// Ready state handlers
const handlePlayerReady = (socket, io) => {
    socket.on('playerReady', ({ roomId, username }) => {
        console.log(`Player ${username} is ready in room ${roomId}`);
        
        if (!roomReadyStates.has(roomId)) {
            roomReadyStates.set(roomId, new Set());
        }
        
        roomReadyStates.get(roomId).add(username);
        
        // Notify all players in room
        io.to(roomId).emit('playerReady', { username });
        
        // Check if all players are ready
        const participants = getParticipantsStorage()[roomId] || [];
        const readyPlayers = roomReadyStates.get(roomId);
        
        if (participants.length > 1 && participants.every(player => readyPlayers.has(player))) {
            console.log(`All players ready in room ${roomId}`);
            io.to(roomId).emit('allPlayersReady');
        }
    });
};

const handlePlayerNotReady = (socket, io) => {
    socket.on('playerNotReady', ({ roomId, username }) => {
        console.log(`Player ${username} is not ready in room ${roomId}`);
        
        if (roomReadyStates.has(roomId)) {
            roomReadyStates.get(roomId).delete(username);
        }
        
        // Notify all players in room
        io.to(roomId).emit('playerNotReady', { username });
    });
};

// Clear ready state when room becomes empty
const clearRoomReadyState = (roomId) => {
    if (roomReadyStates.has(roomId)) {
        roomReadyStates.delete(roomId);
        console.log(`Cleared ready state for room ${roomId}`);
    }
};

// Handle custom room creation
const handleCreateCustomRoom = (socket, io) => {
    console.log('🎄 handleCreateCustomRoom registered for socket:', socket.id);
    
    // Send existing custom rooms to new client
    const existingRooms = Object.values(global.customRooms || {});
    console.log('🏠 Sending existing custom rooms to new client:', existingRooms.length, 'rooms');
    socket.emit('existing-custom-rooms', existingRooms);
    
    socket.on('test-event', (data) => {
        console.log('🧪 TEST EVENT RECEIVED:', data);
        socket.emit('test-response', { message: 'Test successful!' });
    });
    
    socket.on('get-room-info', (roomCode) => {
        console.log('📋 GET ROOM INFO REQUEST for:', roomCode);
        const roomInfo = global.customRooms?.[roomCode];
        if (roomInfo) {
            socket.emit('room-info', { roomCode, roomInfo });
        } else {
            socket.emit('room-info', { 
                roomCode, 
                roomInfo: { 
                    name: `Rum ${roomCode}`, 
                    description: 'Standard spelrum' 
                } 
            });
        }
    });
    
    socket.on('create-custom-room', (roomData) => {
        console.log('🎄 CREATE CUSTOM ROOM EVENT RECEIVED:', roomData);
        try {
            const { name, boardSize, description, password } = roomData;
            
            // Generate unique room code
            const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // Store room info (you might want to use a more persistent storage in production)
            const roomInfo = {
                code: roomCode,
                name: name,
                description: description,
                boardSize: boardSize,
                password: password,
                isPasswordProtected: !!password,
                createdAt: new Date()
            };
            
            // Store in global rooms object (add this if not exists)
            global.customRooms = global.customRooms || {};
            global.customRooms[roomCode] = roomInfo;
            
            console.log(`🏠 Custom room created: ${roomCode} - ${name}`);
            
            // Broadcast new room to all clients
            io.emit('new-custom-room', roomInfo);
            
            socket.emit('custom-room-created', { 
                roomCode,
                roomInfo,
                message: 'Rum skapat! Du joins automatiskt...',
                autoJoin: true
            });

        } catch (error) {
            console.error('Error creating custom room:', error);
            socket.emit('custom-room-error', { message: 'Fel vid skapande av rum' });
        }
    });
};

module.exports = {
    handleJoinRoom,
    handleSendMessage,
    handleSendLetter,
    handleUpdatePlayerBoard,
    handlePlayerDone,
    handleRequestAllResults,
    handleStartGame,
    handleInitGameState,
    handleNextRound,
    handleRequestResults,
    handleLeaveRoom,
    handleDisconnect,
    handleClientReconnected,
    handlePlayerReady,
    handlePlayerNotReady,
    handleCreateCustomRoom,
    clearRoomReadyState
};