const express = require("express");

const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT1 = process.env.PORT1 || 3001
const bodyParser = require('body-parser');

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
require("dotenv/config");



const server = http.createServer(app);
const io = new Server(server, {
	// avoid CORS-errors
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
})
// .listen(server);

//ROUTES
app.get('/', (req,res) => {
    res.send('We are home');
})

const botName = "ChatCord Bot";

// Listen to connections
io.on("connection", (socket) => {
	// console.log(`User connected: ${socket.id}`);

	socket.on("joinRoom", ({ username, room }) => {
		console.log(`${username} joined room ${room}`);
		const user = userJoin(socket.id, username, room);
		socket.join(user.room);

		// Welcome current user
		socket.emit(
			"receiveMessage",
			formatMessage(botName, "Welcome to Gnarp puzzle!")
		);

		// Broadcast when a user connects
		socket.broadcast
			.to(user.room)
			.emit(
				"receiveMessage",
				formatMessage(botName, `${user.username} has joined the chat`)
			);

		// Send users and room info
		io.to(user.room).emit("roomUsers", {
			// room: user.room,
			users: getRoomUsers(user.room),
		});

		// // Send current user info
		// io.to(user.room).emit("currentUser", { user });

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

	socket.on("whoClicked", () => {
		const user = getCurrentUser(socket.id);
		console.log("User clicking button", user);
		if (user) io.to(user.room).emit("currentUser", { user });
	});

	// socket.on("nextPlayer", (player) => {
	// 	const user = getCurrentUser(socket.id);
	// 	const nextPlayer = getNextPlayerInRoom(user.room, player);
	// 	console.log("next player", nextPlayer.username);
	// 	if (user)
	// 		io.to(nextPlayer.id).emit("nextPlayer", { showChooseLetter: true });
	// });

	socket.on("sendMessage", (data) => {
		// send to everyone but me
		// socket.broadcast.emit("receive_message", data);
		// send to a specific room
		socket.to(data.room).emit("receiveMessage", data);
	});

	socket.on("initGameState", (gameState) => {
		const user = getCurrentUser(socket.id);

		if (user) {
			io.to(user.room).emit("roomUsers", {
				room: user.room,
				users: getRoomUsers(user.room),
			});
			// io.to(user.room).emit("currentUser", { user });
			io.to(user.room).emit("initGameState", gameState);
		}
	});

	socket.on("updateGameState", (gameState) => {
		const user = getCurrentUser(socket.id);
		if (user) {
			// io.to(user.room).emit("currentUser", { user });
			io.to(user.room).emit("updateGameState", gameState);
		}
	});

	socket.on("sendLetter", (data) => {
		console.log("data", data);
		socket.to(data.room).emit("receiveLetter", data.currentLetter);
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
server.listen(3001);