import React from "react";
import Box from "@mui/material/Box";
import "./Game.css";
// import io from "socket.io-client";
import { useEffect, useState } from "react";
import socket from "../utils/socket";
import Board from "./Board.jsx";
import GameOverModal from "./GameOverModal.jsx";
// import { io } from "socket.io-client";
// import { findWords } from "../utils/helper";
// const socket = io.connect("http://localhost:3001");

function Game({ roomCode, users, username }) {
	const user = users && users.filter((user) => user.username === username)[0];


	//initialize socket state
	const [room, setRoom] = useState(roomCode);
	// const [roomUsers, setRoomUsers] = useState(users);
	const [currentUser, setCurrentUser] = useState(user);
	
	// Säkerställ att currentUser har rätt struktur
	useEffect(() => {
		if (user) {
			setCurrentUser(user);

		}
	}, [user]);
	const [showChooseLetter, setShowChooseLetter] = useState(false);
	const [showEndRound, setShowEndRound] = useState(false);
	const [boardDisabled, setBoardDisabled] = useState(false);

	// initialize game state
	const [gameOver, setGameOver] = useState(false);
	const [round, setRound] = useState(0);
	const [words, setWords] = useState([]);
	const [points, setPoints] = useState(0);
	const [leaderboard, setLeaderboard] = useState([]);
	const [turn, setTurn] = useState([]);
	const dim = 2;
	const [board, setBoard] = useState(
		[...Array(dim)].map((e) => Array(dim).fill(""))
	);
	const [tempChoice, setTempChoice] = useState([null, null]);
	const [currentLetter, setCurrentLetter] = useState("");

	const totalRounds = dim*dim;

	// runs once on component mount
	useEffect(() => {
		setBoardDisabled(true);
		// Bara Player 1 initierar spelet för att undvika konflikter
		if (currentUser && currentUser.player === 1) {
			const randomStartPlayerIndex = Math.floor(Math.random() * users.length);
			const randomStartPlayer = users[randomStartPlayerIndex].username; // Använd username istället för nummer
			
			// Skapa turnOrder med alla spelares användarnamn
			const turnOrder = users.map(user => user.username);

			socket.emit("initGameState", {
				gameOver: false,
				round: 1,
				turn: randomStartPlayer, // Slumpmässig startspelare (användarnamn)
				currentLetter: "",
				turnOrder: turnOrder, // Lägg till turnOrder
				currentTurnIndex: randomStartPlayerIndex // Index för vem som startar
			});
		} else {

		}
	}, []);

	useEffect(() => {
		socket.on("receiveLetter", (data) => {

			setCurrentLetter(data);
			// Alla spelare kan nu placera bokstaven
			setBoardDisabled(false);
			// Stäng av letter-väljaren
			setShowChooseLetter(false);
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
			
			console.log(`initGameState: turn=${turn} (type: ${typeof turn}), username=${username}, currentUser.player=${currentUser?.player}`);
			
			// Kolla både på username (nytt system) och currentUser.player (gammalt system)
			const shouldChoose = turn === username || (currentUser && turn === currentUser.player);
			console.log(`Should ${username} choose letter? ${shouldChoose} (turn matches username: ${turn === username}, turn matches player: ${currentUser && turn === currentUser.player})`);
			
			if (shouldChoose) {
				console.log(`${username} should choose letter (turn=${turn})`);
				setShowChooseLetter(true);
			} else {
				console.log(`${username} not choosing letter. turn:${turn}, username:${username}`);
				setShowChooseLetter(false);
			}
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
				
				console.log(`updateGameState received. Turn: ${turn}, Username: ${username}, GameOver: ${gameOver}`);
				
				// Kolla både currentUser.player och username för kompatibilitet
				if ((turn === currentUser?.player || turn === username) && !gameOver) {
					console.log(`${username} should choose letter after updateGameState`);
					setShowChooseLetter(true);
				} else {
					setShowChooseLetter(false);
				}
			}
		);

		// Lyssna på nextRound för att uppdatera spelstate när alla spelare är klara
		socket.on('nextRound', (newGameState) => {

			setRound(newGameState.round);
			setTurn(newGameState.turn);
			setCurrentLetter(""); // Rensa föregående bokstav
			setGameOver(newGameState.gameOver);
			if (newGameState.words) setWords(newGameState.words);
			if (newGameState.points) setPoints(newGameState.points);
			
			console.log(`nextRound: turn=${newGameState.turn} (type: ${typeof newGameState.turn}), username=${username}, currentUser.player=${currentUser?.player}`);
			
			// Bara spelaren vars tur det är kan välja bokstav (kolla både nytt och gammalt system)
			const shouldChoose = newGameState.turn === username || (currentUser && currentUser.player === newGameState.turn);
			
			if (shouldChoose) {
				console.log(`${username} should choose letter (nextRound turn=${newGameState.turn})`);
				setShowChooseLetter(true);
				setBoardDisabled(true); // Kan inte placera bokstäver än
			} else {
				console.log(`${username} waiting for letter (not their turn). turn=${newGameState.turn}, username=${username}`);
				setShowChooseLetter(false);
				setBoardDisabled(true); // Andra spelare väntar på bokstav
			}
			
			// Rensa Done-knappen för alla
			setShowEndRound(false);
		});

		// Lyssna på personliga spelresultat
		socket.on('gameResults', (results) => {

			setGameOver(true);
			setWords(results.words);
			setPoints(results.points);
			setLeaderboard(results.leaderboard);
		});

		// Lyssna på när någon lämnar under spelet (bara en spelare kvar)
		socket.on('playerLeft', (data) => {
			alert(`${data.username} lämnade spelet. Du vinner automatiskt!`);
			setGameOver(true);
			// Skapa en vinnar-leaderboard
			const winnerLeaderboard = [
				{ username: username, points: points || 0 }
			];
			setLeaderboard(winnerLeaderboard);
		});

		// Lyssna på forced turn update när spelare lämnar
		socket.on('forceUpdateTurn', (data) => {
			console.log(`Received forceUpdateTurn:`, data);
			setTurn(data.turn);
			setRound(data.round);
			setCurrentLetter(data.currentLetter);
			setGameOver(data.gameOver);
			
			// Om det är min tur, aktivera bokstavsval
			if (data.turn === username && !data.gameOver) {
				console.log(`${username} is now on turn, showing letter chooser`);
				setShowChooseLetter(true);
			} else {
				console.log(`${username} is NOT on turn (turn is: ${data.turn})`);
				setShowChooseLetter(false);
			}
		});

		return () => {
			socket.off('initGameState');
			socket.off('updateGameState');
			socket.off('nextRound');
			socket.off('gameResults');
			socket.off('playerLeft');
			socket.off('forceUpdateTurn');
		};

		// socket.on('message', message => {
		//   setMessages(messages => [ ...messages, message ]);

		//   const chatBody = document.querySelector('.chat-body');
		//   chatBody.scrollTop = chatBody.scrollHeight;
		// });
	}, [currentUser.player]);

	const getNextTurn = (turn) => {
		// turn är 1-indexerat (1, 2, 3, ...)
		// Gå till nästa spelare, loopa tillbaka till 1 om vi når slutet
		const nextTurn = (turn % users.length) + 1;

		return nextTurn;
	};

	// /* const generateWords = () => {
	// 	const words = findWords(board);
	// 	setWords(words);
	// };*/

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
		

		socket.emit("playerDone", {
			gameOver: checkGameOver(round),
			board,
			round: round + 1,
			// Låt servern bestämma nästa tur istället
			currentLetter,
		});
	};

	const playRound = (i, j) => {
		// Kontrollera att det finns en bokstav att placera
		if (!currentLetter) {

			return;
		}
		
		// Visa Done-knappen första gången man placerar en bokstav
		setShowEndRound(true);
		
		// Ta bort bokstaven från föregående position om det finns en
		if (tempChoice[0] !== null) {
			let k = tempChoice[0];
			let l = tempChoice[1];
			board[k][l] = "";
		}
		
		// Placera bokstaven på ny position
		board[i][j] = currentLetter;
		setTempChoice([i, j]);
		setBoard([...board]);
		
		// Låt spelaren fortsätta flytta bokstaven tills de trycker Done
		// setBoardDisabled(true); // Ta bort denna rad
	};

	const sendLetter = (letter = currentLetter) => {
		socket.emit("sendLetter", { currentLetter: letter, room });
		setShowChooseLetter(false);
	};

	return (
		<div className="game-container">
			<div className="game-info">
				<p><strong>Deltagare: {users.length} spelare</strong></p>
				<p><strong>Round: {round} / {totalRounds}</strong></p>
				{!gameOver && <p>Current Turn: {typeof turn === 'number' ? `Player ${turn}` : turn}</p>}
			</div>
			
			<Board board={board} boardDisabled={boardDisabled} playRound={playRound} />
			
			{showEndRound && (
				<button 
					onClick={endCurrentRound}
					className="done-button"
				>
					Done
				</button>
			)}
			
			{showChooseLetter && (
				<div className="alphabet-container">
					{Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ').map((letter) => (
						<button
							key={letter}
							className="alphabet-letter"
							onClick={() => {
								setCurrentLetter(letter);
								sendLetter(letter);
							}}
						>
							{letter}
						</button>
					))}
				</div>
			)}
			
			{!showChooseLetter && !gameOver && currentLetter && (
				<p className="current-letter-display">
					<strong>Current Letter: {currentLetter}</strong>
				</p>
			)}
			
			{gameOver && (
				<GameOverModal 
					words={words}
					points={points}
					leaderboard={leaderboard}
					username={username}
					users={users}
				/>
			)}
		</div>
	);
}

export default Game;
