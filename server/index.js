const express = require("express");

const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const port = 3001;
const bodyParser = require("body-parser");

const { getPossibleWords, getPoints } = require("./utils/helper");

const formatMessage = require("./utils/messages");
const {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
	getNextPlayerInRoom,
	getCurrentChooser,
	updateBoard,
} = require("./utils/users");

const app = express();
app.use(cors());
app.use(express.json());
require("dotenv/config");



const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"],
	},
});

// Routes
app.get("/", (req, res) => {
	res.send("We are home");
});

// In-memory storage for chat messages (for demonstration purposes)
let chatMessages = {};
let participants = {};
let roomGameStates = {};

// Endpoint to get chat messages for a specific roomId
app.get('/chat/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.json(chatMessages[roomId]);
  console.log(`get /chat/:id`);
  console.log(chatMessages[roomId]);
});

// Endpoint to get all chat messages
app.get('/chat', (req, res) => {
	res.json(chatMessages);
  });

// Endpoint to get all chat messages
app.get('/participants', (req, res) => {
	res.json(participants);
  });

// Endpoint to send a chat message
app.post('/chat', (req, res) => {
	console.log(`post /chat`);
	console.log(req.body);
  const { roomId, ...body } = req.body;

  // Save the message to in-memory storage
  if (!chatMessages[roomId]) {
    chatMessages[roomId] = [];
  }
  chatMessages[roomId].push(body);
  console.log('chatMessages' + chatMessages[roomId])
  // Emit the message to all clients listening on the 'chatMessage' event
  io.to(roomId).emit('chatMessage', body);

  res.status(200).json({ status: 'success' });
});

// Endpoint to add participant
app.post('/participants', (req, res) => {
	console.log(`post /participant`);
	console.log(req.body);
  const { roomId, username } = req.body;

  // Save the participant to in-memory storage
  if (!participants[roomId]) {
    participants[roomId] = [];
  }
  
  // Remove any existing instances of this username first (handles reconnections)
  participants[roomId] = participants[roomId].filter(user => user !== username);
  // Then add the user once
  participants[roomId].push(username);
  console.log('participants updated:', participants[roomId]);
  // Emit the participants to all clients listening on the 'participants' event
  io.to(roomId).emit('participants', participants[roomId]);

  res.status(200).json({ status: 'success' });
});

// Endpoint to remove participant
app.delete('/participants/:roomId/:username', (req, res) => {
	console.log(`delete /participant`);
	console.log(req.params);
  const { roomId, username } = req.params;

  if (participants[roomId]) {
    // Remove all instances of the username
    participants[roomId] = participants[roomId].filter(user => user !== username);
    console.log('participants after removal:', participants[roomId]);
    
    // Send leave message to chat
    if (!chatMessages[roomId]) {
      chatMessages[roomId] = [];
    }
    const leaveMessage = {
      username: 'System',
      message: `${username} lämnade rummet`,
      timestamp: new Date().toISOString()
    };
    chatMessages[roomId].push(leaveMessage);
    io.to(roomId).emit('chatMessage', leaveMessage);
    
    // Emit updated participants list
    io.to(roomId).emit('participants', participants[roomId]);
  }

  res.status(200).json({ status: 'success' });
});

const botName = "ChatCord Bot";

let emitsReceived = 0;

// Listen to connections
io.on("connection", (socket) => {
	console.log(`User connected: ${socket.id}`);

	socket.on("joinRoom", ({ username, room }) => {
		console.log(`${username} joined room ${room}`);
		const user = userJoin(socket.id, username, room);
		socket.join(user.room);

		// Lägg till join-meddelande i chat-historiken
		const joinMessage = {
			sender: botName,
			message: `${user.username} has joined the room`,
			sentTime: new Date().toISOString(),
			roomId: user.room
		};

		// Spara meddelandet i chat-historiken
		if (!chatMessages[user.room]) {
			chatMessages[user.room] = [];
		}
		chatMessages[user.room].push(joinMessage);

		// Welcome current user
		socket.emit(
			"chatMessage",
			formatMessage(botName, "Welcome to Gnarp puzzle!")
		);

		// Broadcast when a user connects - skicka även till alla i rummet inklusive sig själv
		io.to(user.room).emit('chatMessage', joinMessage);

		// Send users and room info
		io.to(user.room).emit("roomUsers", {
			// room: user.room,
			users: getRoomUsers(user.room),
		});

		// Listen for chatMessage
		socket.on("chatMessage", (msg) => {
			const user = getCurrentUser(socket.id);
			console.log(user.room);
			io.to(user.room).emit(
				"receiveMessage",
				formatMessage(user.username, msg.message)
			);
		});
	});

	socket.on("sendMessage", (data) => {
		console.log(data)
		socket.to(data.room).emit("receiveMessage", data);
	});

	socket.on("initGameState", (gameState) => {
		const user = getCurrentUser(socket.id);

		if (user) {
			// Initialize server's turn tracking for this room
			if (!roomGameStates[user.room]) {
				const roomUsers = getRoomUsers(user.room);
				roomGameStates[user.room] = {
					playersReady: new Set(),
					gameState: gameState, // Save complete gameState including turnOrder
					playerBoards: {},
					originalParticipants: roomUsers.map(u => u.username), // Keep track of original participants
					round: 1
				};
			} else {
				// If room already exists, update gameState
				roomGameStates[user.room].gameState = gameState;
			}
			
			const roomUsers = getRoomUsers(user.room);
			console.log(`Game initialized in room ${user.room}, starting turn: ${gameState.turn}`);
			console.log('Room users at init:', roomUsers.map((u, index) => `${u.username} (Player ${index + 1})`));
			
			io.to(user.room).emit("roomUsers", {
				room: user.room,
				users: roomUsers,
			});
			io.to(user.room).emit("initGameState", gameState);
		}
	});

	socket.on("playerDone", (gameData) => {
		const user = getCurrentUser(socket.id);
		if (!user) return;
		
		console.log(`Player ${user.username} is done in room ${user.room}`);
		
		// Initialize room game state if not exists
		if (!roomGameStates[user.room]) {
			const roomUsers = getRoomUsers(user.room);
			roomGameStates[user.room] = {
				playersReady: new Set(),
				gameState: null,
				playerBoards: {},
				originalParticipants: roomUsers.map(u => u.username), // Keep track of original participants
				round: 1
			};
		}
		
		// Mark player as ready and store their individual board
		roomGameStates[user.room].playersReady.add(user.username);
		roomGameStates[user.room].playerBoards[user.username] = {
			board: gameData.board,
			socketId: socket.id
		};
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
		
		// If all players ready, proceed to next round
		if (readyCount === roomUsers.length) {
			// Ensure we have a gameState object with correct turn
			if (!roomGameStates[user.room].gameState) {
				const currentRoomUsers = getRoomUsers(user.room);
				roomGameStates[user.room].gameState = {
					turn: currentRoomUsers[0]?.username, // Start with first player
					turnOrder: currentRoomUsers.map(u => u.username),
					currentTurnIndex: 0
				};
			}
			
			// Only update gameOver and round, PRESERVE everything else (especially turn)
			roomGameStates[user.room].gameState.gameOver = gameData.gameOver;
			roomGameStates[user.room].gameState.round = gameData.round || 1;
			
			let gameState = roomGameStates[user.room].gameState;
			
			if (gameState.gameOver) {
				// Calculate results for each player individually using their own boards
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
						board: roomGameStates[user.room].playerBoards[username].board
					};
				});
				
				// Save all player data for later requests
				roomGameStates[user.room].allPlayerData = allPlayerData;
				
				// Send all player data to each player for comparison
				Object.entries(playerResults).forEach(([username, result]) => {
					io.to(result.socketId).emit("allPlayerResults", allPlayerData);
				});
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
				
				// Save old turn value for comparison
				const previousTurn = gameState.turn;
				
				// Update gameState with correct next turn - update directly on server
				roomGameStates[user.room].gameState.turnOrder = currentTurnOrder;
				roomGameStates[user.room].gameState.turn = nextPlayer; 
				roomGameStates[user.room].gameState.currentTurnIndex = nextPlayerIndex;
				

				
				const updatedGameState = roomGameStates[user.room].gameState;
				

				
				// Send updated game state to all players in room
				io.to(user.room).emit("nextRound", updatedGameState);
			}
		}
	});

	socket.on("sendLetter", (data) => {
		const user = getCurrentUser(socket.id);
		console.log(data);
		io.to(user.room).emit("receiveLetter", data.currentLetter);
	});

	socket.on("startGame", (data) => {
		console.log('Starting game for room:', data.roomId);
		// Notify all players in the room that the game is starting
		io.to(data.roomId).emit("gameStarted", {
			roomId: data.roomId,
			startedBy: data.username
		});
	});

	socket.on("requestAllResults", (data) => {
		const user = getCurrentUser(socket.id);
		if (!user || !roomGameStates[user.room]) return;
		
		// Check if game is over and results exist
		const gameState = roomGameStates[user.room];
		if (gameState.allPlayerData) {
			socket.emit("allPlayerResults", gameState.allPlayerData);
		}
	});

	// Handle when player leaves room
	socket.on("leaveRoom", ({ room, username }) => {
		console.log(`=== LEAVE ROOM EVENT RECEIVED ===`);
		console.log(`${username} is leaving room ${room}`);
		console.log(`Socket ID: ${socket.id}`);
		
		// Check if there's an ongoing game
		if (roomGameStates[room] && roomGameStates[room].gameState && !roomGameStates[room].gameState.gameOver) {
			console.log(`Game in progress in ${room}, player ${username} leaving`);
			
			const gameState = roomGameStates[room].gameState;
			
			// Recreate turnOrder from scratch with remaining players (exclude leaving player)
			const remainingUsers = getRoomUsers(room).filter(u => u.username !== username);
			const newTurnOrder = remainingUsers.map(u => u.username);
			
			// Choose next player - either next in order or first player
			let nextPlayerIndex = 0;
			if (gameState.turnOrder && gameState.turn) {
				// Hitta vem som skulle vara nästa efter nuvarande spelare
				const currentPlayerIndex = gameState.turnOrder.indexOf(gameState.turn);
				const nextInOldOrder = (currentPlayerIndex + 1) % gameState.turnOrder.length;
				const nextPlayerName = gameState.turnOrder[nextInOldOrder];
				
				// Om den spelaren fortfarande finns, använd den, annars första spelaren
				const indexInNewOrder = newTurnOrder.indexOf(nextPlayerName);
				nextPlayerIndex = indexInNewOrder !== -1 ? indexInNewOrder : 0;
			}
			
			// Uppdatera gameState med ny turnOrder
			gameState.turnOrder = newTurnOrder;
			gameState.currentTurnIndex = nextPlayerIndex;
			const nextPlayer = gameState.turnOrder[gameState.currentTurnIndex];
			
			console.log(`New turnOrder:`, gameState.turnOrder);
			console.log(`New currentTurnIndex: ${gameState.currentTurnIndex}, next player: ${nextPlayer}`)
			
			// Ta bort spelarens data från gameState
			if (roomGameStates[room].playerData && roomGameStates[room].playerData[username]) {
				delete roomGameStates[room].playerData[username];
			}
			
			// Check how many players remain in the game (after removal)
			const remainingPlayersInGame = gameState.turnOrder ? gameState.turnOrder.length : 0;
			
			console.log(`Player ${username} left. Players remaining in game: ${remainingPlayersInGame}`);
			console.log('Remaining turnOrder:', gameState.turnOrder);
			console.log('Original turnOrder before removal had length:', gameState.turnOrder ? gameState.turnOrder.length + 1 : 'unknown');
			
			if (remainingPlayersInGame === 1) {
				// Only one player left in game - give them the win
				const winner = gameState.turnOrder[0];
				console.log(`WALKOVER VICTORY: ${winner} wins by walkover!`);
				
				// Mark game as over
				gameState.gameOver = true;
				roomGameStates[room].gameState = gameState;
				
				// Add chat message for walkover
				const walkoverMessage = {
					username: "System",
					message: `🏆 ${username} left the game. Congratulations ${winner} on the win!`,
					timestamp: new Date().toISOString()
				};
				io.to(room).emit("message", walkoverMessage);
				
				// Create leaderboard with all original participants (dimmed for walkover)
				const originalParticipants = roomGameStates[room].originalParticipants || [];
				const winnerPoints = 10;
				const leaderboard = originalParticipants.map(participant => ({
					username: participant,
					points: participant === winner ? winnerPoints : 0, // Winner gets 10, others get 0
					walkover: true,
					winner: participant === winner
				})).sort((a, b) => b.points - a.points); // Sort by points (10 > 0)
				
				// Send game results to winner with walkover victory
				const winnerUser = getRoomUsers(room).find(u => u.username === winner);
				if (winnerUser) {
					console.log(`Sending walkover victory to ${winner}`);
					io.to(winnerUser.id).emit("gameResults", {
						...gameState,
						gameOver: true, // Ensure game is marked as over
						words: ["Walkover Victory"],
						points: winnerPoints, // Winner gets 10 points
						leaderboard: leaderboard,
						isPersonal: true,
						walkover: true,
						originalParticipants: originalParticipants
					});
				}
				
				// Don't send playerLeft for walkover - game is over, send gameOver instead
				io.to(room).emit("gameOver", { 
					winner: winner,
					reason: "walkover",
					leftPlayer: username
				});
			} else if (remainingPlayersInGame > 1) {
				// More players remain - continue game with updated turn order
				// Use nextPlayer that we already calculated
				const currentPlayer = nextPlayer;
				
				// Check if the leaving player was the one choosing letter
				const wasChoosingLetter = gameState.turn === username;
				
				// Update gameState with new turn
				gameState.turn = currentPlayer;
				
				// IMPORTANT: Save the updated gameState
				roomGameStates[room].gameState = gameState;
				
				// Add chat message for when game continues
				const continueMessage = {
					username: "System",
					message: `⚠️ ${username} left the game. Game continues with remaining players. ${currentPlayer} is now on turn.`,
					timestamp: new Date().toISOString()
				};
				io.to(room).emit("message", continueMessage);
				
				console.log(`Player left, forcing turn update. New turn: ${currentPlayer}`);
				
				// Kontrollera att currentPlayer inte är undefined/null
				if (!currentPlayer) {
					console.error(`ERROR: currentPlayer is ${currentPlayer}! turnOrder:`, gameState.turnOrder, 'currentTurnIndex:', gameState.currentTurnIndex);
					return;
				}
				
				// Send directly to each user individually to ensure delivery
				const roomUsers = getRoomUsers(room);
				roomUsers.forEach(user => {
					io.to(user.id).emit("forceUpdateTurn", {
						turn: currentPlayer,
						round: gameState.round || 1,
						currentLetter: gameState.currentLetter || "",
						gameOver: gameState.gameOver || false
					});
				});
				

			} else {
				// Something went wrong with turn order - end game safely
				console.log(`ERROR: Invalid remaining players count: ${remainingPlayersInGame}, ending game`);
				
				const errorMessage = {
					username: "System",
					message: `❌ Game ended due to technical error.`,
					timestamp: new Date().toISOString()
				};
				io.to(room).emit("message", errorMessage);
				
				// Mark game as over
				gameState.gameOver = true;
			}
		}
		
		// Remove user from the room
		const user = getCurrentUser(socket.id);
		if (user) {
			userLeave(socket.id);
			socket.leave(room);
		}
	});

	// Runs when client disconnects
	socket.on("disconnect", () => {
		const user = userLeave(socket.id);

		if (user) {
			io.to(user.room).emit(
				"receiveMessage",
				formatMessage(botName, `${user.username} has left the chat`)
			);

			// Send users and room info
			io.to(user.room).emit("roomUsers", {
				room: user.room,
				users: getRoomUsers(user.room),
			});
		}
	});
});

//How do we start listening to the server
server.listen(port, () => {
	console.log(`Server is listening on port ${port}`);
});