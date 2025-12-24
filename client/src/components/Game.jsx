import React from "react";
import Box from "@mui/material/Box";
import "./Game.css";
// import io from "socket.io-client";
import { useEffect, useState } from "react";
import socket from "../utils/socket";
import Board from "./Board.jsx";
import GameResults from "./GameResults.jsx";
import Timer from "./Timer.jsx";
// import { io } from "socket.io-client";
// import { findWords } from "../utils/helper";
// const socket = io.connect("http://localhost:3001");

function Game({ roomCode, users, username, onGameEnd }) {
	const user = users && users.filter((user) => user.username === username)[0];

	// Get board size based on room
	const getBoardSize = (roomCode) => {
		const roomSizes = {
			'room1': 4, // 4x4
			'room2': 5, // 5x5  
			'room3': 6, // 6x6
			'room4': 4  // 4x4
		};
		// For custom rooms, default to 4x4
		return roomSizes[roomCode] || 4;
	};

	const dim = getBoardSize(roomCode);

	//initialize socket state
	const [room, setRoom] = useState(roomCode);
	const [currentUser, setCurrentUser] = useState(user);
	
	// Säkerställ att currentUser har rätt struktur
	useEffect(() => {
		if (user) {
			setCurrentUser(user);
		}
	}, [user]);
	
	const [showChooseLetter, setShowChooseLetter] = useState(false);
	const [showEndRound, setShowEndRound] = useState(false);
	const [showPlacementTimer, setShowPlacementTimer] = useState(false);
	const [placementTimerData, setPlacementTimerData] = useState({
		timeLeft: 0,
		currentPlayer: '',
		isWarning: false,
		showNumbers: false
	});
	const [boardDisabled, setBoardDisabled] = useState(false);

	// initialize game state
	const [gameOver, setGameOver] = useState(false);
	const [round, setRound] = useState(0);
	const [words, setWords] = useState([]);
	const [points, setPoints] = useState(0);
	const [leaderboard, setLeaderboard] = useState([]);
	const [turn, setTurn] = useState([]);
	const [allPlayerData, setAllPlayerData] = useState({});
	const [board, setBoard] = useState(
		[...Array(dim)].map((e) => Array(dim).fill(""))
	);
	const [tempChoice, setTempChoice] = useState([null, null]);
	const [currentLetter, setCurrentLetter] = useState("");

	// Timer state
	const [timerData, setTimerData] = useState({
		timeLeft: 0,
		currentPlayer: '',
		isWarning: false,
		showNumbers: false
	});

	const totalRounds = dim*dim;

	// runs once on component mount
	useEffect(() => {
		console.log('=== GAME COMPONENT MOUNTED ===');
		console.log('currentUser:', currentUser);
		console.log('users:', users);
		console.log('users detailed:', users.map((u, i) => `[${i}] ${u.username} (player: ${u.player})`));
		console.log('username:', username);
		
		setBoardDisabled(true);
		// Bara Player 1 initierar spelet för att undvika konflikter
		if (currentUser && currentUser.player === 1) {
			const randomStartPlayerIndex = Math.floor(Math.random() * users.length);
			const randomStartPlayer = users[randomStartPlayerIndex].username;
			
			// Skapa turnOrder med alla spelares användarnamn
			const turnOrder = users.map(user => user.username);

			socket.emit("initGameState", {
				gameOver: false,
				round: 1,
				turn: randomStartPlayer,
				currentLetter: "",
				turnOrder: turnOrder,
				currentTurnIndex: randomStartPlayerIndex,
				boardSize: dim // Send board size to server
			});
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

			// Uppdatera timer-data när spelet initieras
			setTimerData({
				timeLeft: 2,
				currentPlayer: turn,
				isWarning: false,
				showNumbers: false
			});
			
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
			console.log('=== NEXT ROUND EVENT RECEIVED ===');
			console.log('New game state:', newGameState);

			setRound(newGameState.round);
			setTurn(newGameState.turn);
			setCurrentLetter(""); // Rensa föregående bokstav
			setGameOver(newGameState.gameOver);
			if (newGameState.words) setWords(newGameState.words);
			if (newGameState.points) setPoints(newGameState.points);

			// Uppdatera timer-data för nästa tur
			setTimerData({
				timeLeft: 15,
				currentPlayer: newGameState.turn,
				phase: 'letterSelection',
				isWarning: false,
				showNumbers: false
			});
			
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
			
			// Rensa Done-knappen och placement timer för alla
			setShowEndRound(false);
			setShowPlacementTimer(false);
			setPlacementTimerData({
				timeLeft: 0,
				currentPlayer: '',
				isWarning: false,
				showNumbers: false
			});
		});

		// Listen for personal game results
		socket.on('gameResults', (results) => {
			setGameOver(true);
			setWords(results.words);
			setPoints(results.points);
			setLeaderboard(results.leaderboard);
		});

		// Listen for all player results for comparison
		socket.on('allPlayerResults', (playerData) => {
			setAllPlayerData(playerData);
		});

		// Listen when someone leaves during the game (only one player left)
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
			
			// Uppdatera timer-data när tur forceras (när spelare lämnar)
			setTimerData({
				timeLeft: 2,
				currentPlayer: data.turn,
				isWarning: false,
				showNumbers: false
			});
			
			// Om det är min tur, aktivera bokstavsval
			if (data.turn === username && !data.gameOver) {
				console.log(`${username} is now on turn, showing letter chooser`);
				setShowChooseLetter(true);
			} else {
				console.log(`${username} is NOT on turn (turn is: ${data.turn})`);
				setShowChooseLetter(false);
			}
		});

		// Lyssna på timer-uppdateringar för bokstavsval
		socket.on('turnTimer', (data) => {
			console.log('Turn timer update:', data);
			// Bara uppdatera timer under letter selection (inte under placement)
			if (!showPlacementTimer) {
				setTimerData({
					timeLeft: data.timeLeft,
					currentPlayer: data.currentPlayer,
					isWarning: data.isWarning,
					showNumbers: data.showNumbers
				});
			}
		});

		// Lyssna på placement timer-uppdateringar (individuella)
		socket.on('placementTimer', (data) => {
			console.log('Placement timer update:', data);
			// Bara uppdatera timern om vi faktiskt får timer-data
			if (data.timeLeft !== undefined && data.timeLeft > 0) {
				setShowPlacementTimer(true);
				setPlacementTimerData({
					timeLeft: data.timeLeft,
					currentPlayer: data.player || username,
					isWarning: data.isWarning,
					showNumbers: data.showNumbers
				});
			} else if (data.timeLeft === 0) {
				// Dölj timern när tiden är slut
				console.log('⏰ Placement timer reached 0, hiding timer');
				setShowPlacementTimer(false);
				setPlacementTimerData({
					timeLeft: 0,
					currentPlayer: '',
					isWarning: false,
					showNumbers: false
				});
			}
		});

		// Lyssna på automatisk bokstavsplacering
		socket.on('autoPlaceLetter', (data) => {
			console.log('🤖 CLIENT: Auto-placing letter due to timeout:', data);
			if (data.board && data.position && data.letter) {
				// Update the board with auto-placed letter
				console.log('📋 Current board before auto-place:', board);
				setBoard([...data.board]); // Create new array to force re-render
				setTempChoice([...data.position]); // Create new array
				setCurrentLetter(data.letter);
				setShowEndRound(true); // Show done button
				setShowPlacementTimer(false); // Dölj placement timer när auto-placement sker
				setPlacementTimerData({
					timeLeft: 0,
					currentPlayer: '',
					isWarning: false,
					showNumbers: false
				});
				setBoardDisabled(true); // Disable further interaction
				console.log(`✅ Letter "${data.letter}" auto-placed at [${data.position[0]}, ${data.position[1]}]`);
				console.log('📋 Board after auto-place:', data.board);
				console.log('🤖 Auto-placement complete, server will handle playerDone');
			} else {
				console.log('❌ Invalid data received for auto-place:', data);
			}
		});

		return () => {
			socket.off('initGameState');
			socket.off('updateGameState');
			socket.off('nextRound');
			socket.off('gameResults');
			socket.off('allPlayerResults');
			socket.off('playerLeft');
			socket.off('forceUpdateTurn');
			socket.off('turnTimer');
			socket.off('placementTimer');
			socket.off('autoPlaceLetter');
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
		console.log(`Checking game over: round=${round}, totalRounds=${totalRounds}`);
		
		if (round > totalRounds) {
			console.log('=== GAME OVER! All rounds completed ===');
			setShowChooseLetter(false);
			return true;
		}
		return false;
	};

	const endCurrentRound = () => {
		console.log('=== END CURRENT ROUND ===');
		console.log(`Round: ${round}, totalRounds: ${totalRounds}`);

		setTempChoice([null, null]);
		setShowEndRound(false);
		setShowPlacementTimer(false); // Dölj placement timer när spelaren är klar
		setPlacementTimerData({
			timeLeft: 0,
			currentPlayer: '',
			isWarning: false,
			showNumbers: false
		});
		setBoardDisabled(true);
		
		const newRound = round + 1;
		const isGameOver = checkGameOver(newRound);
		console.log(`Sending playerDone for round: ${newRound}, isGameOver: ${isGameOver}`);

		socket.emit("playerDone", {
			gameOver: isGameOver, // Skicka rätt info men låt servern validera
			board,
			round: newRound,
			currentLetter,
		});
	};

	const stopPlayerTimer = () => {
		// Clear timer display
		setTimerData({
			timeLeft: 0,
			currentPlayer: '',
			isWarning: false,
			showNumbers: false
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

		// Skicka uppdaterad board till servern så auto-placement kan se den
		socket.emit("updatePlayerBoard", {
			board: [...board], // Skicka kopia av boarden
			username: username,
			currentLetter: currentLetter
		});

		// Stop timer when letter is placed
		stopPlayerTimer();
		
		// Låt spelaren fortsätta flytta bokstaven tills de trycker Done
		// setBoardDisabled(true); // Ta bort denna rad
	};

	const sendLetter = (letter = currentLetter) => {
		socket.emit("sendLetter", { currentLetter: letter, room });
		setShowChooseLetter(false);
	};

	const closeResults = () => {
		console.log('=== CLOSE RESULTS CLICKED ===');
		console.log('onGameEnd prop exists:', typeof onGameEnd);
		// Signalera till Room att spelet ska avslutas
		if (onGameEnd) {
			console.log('Calling onGameEnd...');
			onGameEnd();
		} else {
			console.log('ERROR: onGameEnd prop not found!');
		}
	};

	return (
		<div className={`game-container ${gameOver ? 'game-with-results' : ''}`}>
			<div className="game-content">
				<div className="game-info-compact">
					<span><strong>{users.length} spelare</strong></span>
					<span><strong>Round {round}/{totalRounds}</strong></span>
					{!gameOver && <span><strong>Tur: {typeof turn === 'number' ? `Spelare ${turn}` : turn}</strong></span>}
				</div>

				{/* Timer enkelt placerad */}
				{!gameOver && (
					(timerData.timeLeft > 0 && !showPlacementTimer) || 
					(showPlacementTimer && placementTimerData.timeLeft > 0)
				) && (
					<Timer
						timeLeft={showPlacementTimer ? placementTimerData.timeLeft : timerData.timeLeft}
						currentPlayer={showPlacementTimer ? placementTimerData.currentPlayer : timerData.currentPlayer}
						isWarning={showPlacementTimer ? placementTimerData.isWarning : timerData.isWarning}
						showNumbers={showPlacementTimer ? placementTimerData.showNumbers : timerData.showNumbers}
						isMyTurn={(showPlacementTimer ? placementTimerData.currentPlayer : timerData.currentPlayer) === username}
					/>
				)}
				
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
			</div>
			
			{gameOver && (
				<GameResults 
					words={words}
					points={points}
					leaderboard={leaderboard}
					username={username}
					users={users}
					allPlayerData={allPlayerData}
					onClose={closeResults}
				/>
			)}
		</div>
	);
}

export default Game;
