const users = [];
let count = 0;

// Join user to chat
function userJoin(id, username, room) {
	const user = {
		id,
		username,
		player: getRoomUsers(room).length + 1,
		room,
		board: [],
	};

	users.push(user);

	return user;
}

// Get current user
function getCurrentUser(id) {
	return users.find((user) => user.id === id);
}

// User leaves chat
function userLeave(id) {
	const index = users.findIndex((user) => user.id === id);

	if (index !== -1) {
		return users.splice(index, 1)[0];
	}
}

// Get room users
function getRoomUsers(room) {
	// console.log("getRoomUsers");
	return users.filter((user) => user.room === room);
}

// Get user in room from player prop 
function getNextPlayerInRoom(room, player) {
	const roomUsers = getRoomUsers(room);
	// console.log("getRoomUsers");
	return roomUsers.filter((user) => user.player === player);
}

function getCurrentChooser(room) {
	const chooser = users[count];
	count = count + 1 > users.length() ? 0 : count++;
	return chooser;
}

function updateBoard(id, board) {
	const user = users.find((user) => user.id === id);
	user.board = board;
}

module.exports = {
	userJoin,
	getCurrentUser,
	userLeave,
	getRoomUsers,
	getNextPlayerInRoom,
	getCurrentChooser,
	updateBoard,
};
