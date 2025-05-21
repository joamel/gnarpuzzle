import "../App.css";
// import io from "socket.io-client";
import { useEffect, useState } from "react";
import Game from "./Game";
import socket from "../utils/socket";
// import { userJoin } from "../utils/users";
// const socket = io.connect("http://localhost:3001");

function Lobby(props) {
	const { username, room } = props;
	// States
	// const [username, setUsername] = useState("");
	// const [user, setUser] = useState("");
	const [users, setUsers] = useState([]);
  // const [roomFull, setRoomFull] = useState(false);
	const [gameStarted, setGameStarted] = useState(false);
	const [message, setMessage] = useState("");
	const [messageReceived, setMessageReceived] = useState("");

	useEffect(() => {
		socket.on("receiveMessage", (data) => {
			setMessageReceived(data.text);
		});

		socket.on("roomUsers", (data) => {
			setUsers(data.users);

		});

		return () => {
			socket.off('receiveMessage');
			socket.off('roomUsers');
		};

	}, []);

	useEffect(() => {
		if (room !== "") {
			console.log(`${username} joins room`);
		 	// setUser(userJoin(socket.id, username, room));
			socket.emit("joinRoom", { username, room });
		}

		return () => {
			socket.off('joinRoom');
		};
	}, [room, username]);

	// useEffect(() => {
	// 	socket.on("gameStarted", () => {
	// 		setGameStarted(true);
	// 	});
	// });

	const startGame = () => {
		// console.log('room ',room)
		if (room !== "") {
			// console.log("startGame", users);
			// socket.emit("startGame", { users, room });
			setGameStarted(true);
		}
	};

	const sendChatMessage = () => {
		socket.emit("chatMessage", { message, room });
		setMessage("");
	};

	return (
		<div>
			<h1>Lobby</h1>
			<p>{`Room: ${room}`}</p>
			<ul>
				{users?.map((user) => {
						return <li key={user.id}>{user.username}</li>;
					})}
			</ul>
			<p>{`Message: ${messageReceived}`}</p>
			<input
				placeholder="Message..."
				value={message}
				onChange={(event) => {
					setMessage(event.target.value);
				}}
			/>
			<button onClick={sendChatMessage}>Send Message</button>
			{!gameStarted && <button onClick={startGame}>Start Game</button>}
			{gameStarted && <Game roomCode={room} users={users} username={username} />}
		</div>
	);
}

export default Lobby;
