import "./App.css";
// import io from "socket.io-client";
import { useEffect, useState } from "react";
import Lobby from "./components/Lobby";
import Nav from "./components/Nav";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material";
import { getTheme } from "./themes/theme.ts";

// import socket from "./utils/Socket";

// const socket = io.connect("http://localhost:3001");
let joinLobby = false;


function App() {
	// States
	const [username, setUsername] = useState("");
	const [users, setUsers] = useState("");
	const [room, setRoom] = useState("");
	const [message, setMessage] = useState("");
	const [messageReceived, setMessageReceived] = useState("");
	
	// const navigate = useNavigate();

	// useEffect(() => {
	// 	socket.on("receiveMessage", (data) => {
	// 		setMessageReceived(data.message);
	// 	});

	// 	socket.on("roomUsers", (_, users) => {
	// 		setUsers(users);
	// 	});
	// }, []);

	// useEffect(() => {
	// 	socket.on("roomUsers", (room, _) => {
	// 		setUsers(room);
	// 	});
	// }, [room]);

	// const joinRoom = (number) => {
	// 	setRoom(number);
	// 	if (room !== "") {
	// 		socket.emit("joinRoom", { username, room });
	// 		joinLobby = true;
	// 		// navigate('/lobby')
	// 	}
	// };

	// const sendChatMessage = () => {
	// 	socket.emit("chatMessage", { message, room });
	// };

	return (
		<ThemeProvider theme={getTheme}>
			<Router>
				{/* <div className="App"> */}
					{/* <Nav /> */}

				{/* </div> */}
				<Routes>
					<Route path="/" element={<Home setUsername={(username) => setUsername(username)} setRoom={(room) => setRoom(room)} />} />
					<Route path="/lobby" element={<Lobby username={username} room={room} />} />
				</Routes>
				
			</Router>
			{/* <div className="App">
				{joinLobby && <Lobby room={room} />}
			</div> */}
		</ThemeProvider>
	);
}

const Home = ({setUsername, setRoom}) => {
	const navigate = useNavigate();
	
	return (
		<div>
			<h1>Home Page</h1>
			<input
					placeholder="Choose username"
					onChange={(event) => {
						setUsername(event.target.value);
					}}
				/>
			<h2>Join Room</h2>
			<button onClick={() => {setRoom(1); navigate('/lobby')}}>Join Room 1</button>
			<button onClick={() => {setRoom(2); navigate('/lobby')}}>Join Room 2</button>
			<button onClick={() => {setRoom(3); navigate('/lobby')}}>Join Room 3</button>
		</div>
	);
};

export default App;
