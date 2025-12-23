const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv/config");

// Route imports
const chatRoutes = require('./routes/chat');
const participantsRoutes = require('./routes/participants');
const customRoomsRoutes = require('./routes/customRooms');

// Socket handler imports
const {
	handleJoinRoom,
	handleSendMessage,
	handleSendLetter,
	handlePlayerDone,
	handleRequestAllResults,
	handleStartGame,
	handleInitGameState,
	handleNextRound,
	handleRequestResults,
	handleLeaveRoom,
	handleDisconnect,
	handleClientReconnected
} = require('./utils/socketHandlers');

const port = process.env.PORT || 3001;

const app = express();

// Debug logging
console.log('🔧 Environment Configuration:');
console.log('PORT:', port);
console.log('CLIENT_URL:', process.env.CLIENT_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

// CORS configuration with multiple allowed origins
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173", // Development
  "https://gnarp-frontend.onrender.com", // Production frontend
  "https://gnarpuzzle.onrender.com", // Alternative production URL
  "https://gnarpuzzle-vite.onrender.com" // Another possible URL
].filter(Boolean); // Remove undefined values

console.log('🌐 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST"],
		credentials: true
	},
});

// Middleware to pass io instance to routes
app.use((req, res, next) => {
	req.io = io;
	next();
});

// Routes
app.get("/", (req, res) => {
	res.send("GnarPuzzle Server - Running!");
});

// Mount route modules
app.use('/chat', chatRoutes.router);
app.use('/participants', participantsRoutes.router);
app.use('/custom-rooms', customRoomsRoutes.router);

let emitsReceived = 0;

// Socket.IO connection handling
io.on("connection", (socket) => {
	console.log(`User connected: ${socket.id}`);

  	// Register all socket event handlers
	handleJoinRoom(socket, io);
	handleSendMessage(socket, io);
	handleSendLetter(socket, io);
	handlePlayerDone(socket, io);
	handleRequestAllResults(socket, io);
	handleStartGame(socket, io);
	handleInitGameState(socket, io);
	handleNextRound(socket, io);
	handleRequestResults(socket, io);
	handleLeaveRoom(socket, io);
	handleDisconnect(socket, io);
	handleClientReconnected(socket, io);
});

server.listen(port, () => {
	console.log(`🚀 GnarPuzzle server running on port ${port}`);
	console.log(`📡 Socket.IO enabled`);
	console.log(`🎮 Game state management active`);
});