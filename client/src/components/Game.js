import React from "react";
import Box from "@mui/material/Box";
import Board from "./Board";
// import style from "./Game.css";
// import io from "socket.io-client";
import { useEffect, useState } from "react";
import socket from "../utils/Socket";
// import { io } from "socket.io-client";
// import { findWords } from "../utils/helper";
// const socket = io.connect("http://localhost:3001");

function Game({ roomCode, users, username }) {
	const user = users && users.filter((user) => user.username === username)[0];

	//initialize socket state
	const [room, setRoom] = useState(roomCode);
	// const [roomUsers, setRoomUsers] = useState(users);
	const [currentUser, setCurrentUser] = useState(user);
	const [showChooseLetter, setShowChooseLetter] = useState(false);
	const [showEndRound, setShowEndRound] = useState(false);
	const [boardDisabled, setBoardDisabled] = useState(false);

	// initialize game state
	const [gameOver, setGameOver] = useState(false);
	const [round, setRound] = useState(0);
	const [words, setWords] = useState([]);
	const [points, setPoints] = useState(0);
	const [turn, setTurn] = useState([]);
	const dim = 3;
	const [board, setBoard] = useState(
		[...Array(dim)].map((e) => Array(dim).fill(""))
	);
	const [tempChoice, setTempChoice] = useState([null, null]);
	const [currentLetter, setCurrentLetter] = useState("");

	const totalRounds = dim*dim;

	// runs once on component mount
	useEffect(() => {
		setBoardDisabled(true);
		socket.emit("initGameState", {
			gameOver: false,
			round: 1,
			//Funkar inte då alla spelare startar matchen ist för att lobbyägaren gör det..
			// turn: Math.floor(Math.random() * users.length), //Random player starts
			turn: 1,
			currentLetter: "",
		});
	}, []);

	useEffect(() => {
		socket.on("receiveLetter", (data) => {
			setCurrentLetter(data);
			setBoardDisabled(false);
		});
		return () => {
			socket.off('receiveLetter');
		};

	}, [setCurrentLetter]);

	useEffect(() => {
		socket.on("initGameState", ({ gameOver, round, turn, currentLetter }) => {
			setGameOver(gameOver);
			setRound(round);
			setTurn(turn);
			setCurrentLetter(currentLetter);
			if (turn === currentUser.player) setShowChooseLetter(true);
		});

		socket.on(
			"updateGameState",
			({ gameOver, round, words, points, turn, currentLetter }) => {
				gameOver && setGameOver(gameOver);
				round && setRound(round);
				words && setWords(words);
				points && setPoints(points);
				turn && setTurn(turn);
				currentLetter && setCurrentLetter(currentLetter);
				if (turn === currentUser.player && !gameOver) setShowChooseLetter(true);
			}
		);

		return () => {
			socket.off('initGameState');
			socket.off('updateGameState');
		};

		// socket.on('message', message => {
		//   setMessages(messages => [ ...messages, message ]);

		//   const chatBody = document.querySelector('.chat-body');
		//   chatBody.scrollTop = chatBody.scrollHeight;
		// });
	}, [currentUser.player]);

	const getNextTurn = (turn) => {
		const count = turn + 1 > users.length ? 0 : turn;
		const nextTurn = users[count].player;
		// socket.emit("nextPlayer", { nextTurn });
		return nextTurn;
	};

	/* const generateWords = () => {
		const words = findWords(board);
		setWords(words);
	};*/

	const checkGameOver = (round) => {
		if (round === totalRounds) {
			setShowChooseLetter(false);
			// generateWords();
			return true;
		}
		return false;
	};

	const endCurrentRound = () => {
		setTempChoice([null, null]);
		setShowEndRound(false);
		setBoardDisabled(true);
		socket.emit("updateGameState", {
			gameOver: checkGameOver(round),
			board,
			round: round + 1,
			turn: getNextTurn(turn),
			currentLetter,
		});
	};

	const playRound = (i, j) => {
		setShowEndRound(true);
		board[i][j] = currentLetter;
		if (tempChoice[0] !== null) {
			let k = tempChoice[0];
			let l = tempChoice[1];
			board[k][l] = "";
		}
		setTempChoice([i, j]);
		setBoard([...board]);
	};

	const sendLetter = () => {
		socket.emit("sendLetter", { currentLetter, room });
		setShowChooseLetter(false);
	};

	return (
		// 1. Spelare på tur får välja bokstav som skickas till servern
		// 2. servern skickar bokstaven till alla spelare
		// 3. spelarna väljer plats för bokstaven på boarden
		// 4. ny runda och väljande spelare byts till nästa spelare på tur

		<Box>
			<Board board={board} boardDisabled={boardDisabled} playRound={playRound} />
			{showEndRound && <button onClick={endCurrentRound}>Done</button>}
			{showChooseLetter && (
				<input
					placeholder="Choose Letter"
					onChange={(event) => {
						setCurrentLetter(event.target.value);
					}}
				/>
			)}
			{showChooseLetter && <button onClick={sendLetter}>Send Letter</button>}
			{!showChooseLetter && !gameOver && <p> Letter: {currentLetter} </p>}
			{gameOver && <p> GAME OVER! </p>}
			{words}
			<div>Final score {points}</div>
		</Box>
	);
}

export default Game;
