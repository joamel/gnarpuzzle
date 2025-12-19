import React, { useState, useEffect } from 'react';
import Game from './Game';
import Chat from './Chat';
import socket from '../utils/socket';
import './Room.css';

const Room = (props) => {
  const { username, users: initialUsers, roomId = 'room1' } = props;
  const [gameStarted, setGameStarted] = useState(false);
  const [users, setUsers] = useState(initialUsers || []);

  const handleLogout = () => {
    const confirmed = window.confirm('Är du säker på att du vill logga ut? Detta kommer att avsluta ditt spel om det pågår.');
    if (confirmed) {
      // Lämna rummet och rensa localStorage
      socket.emit("leaveRoom", { room: roomId, username });
      localStorage.removeItem('gnarp-hasJoined');
      localStorage.removeItem('gnarp-username');
      // Ladda om sidan för att gå tillbaka till start
      window.location.reload();
    }
  };

  // Anslut till rummet och lyssna på socket events
  useEffect(() => {
    // Anslut till rummet på servern
    socket.emit('joinRoom', { username, room: roomId });

    // Registrera deltagaren via API också
    fetch('http://localhost:3001/participants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, username }),
    })
    .then(response => response.json())
    .catch(error => console.error('Error registering participant:', error));

    const handleGameStarted = (data) => {
      setGameStarted(true);
    };

    const handleParticipants = (participantsList) => {
      setUsers(participantsList || []);
    };

    // Lyssna på gameStarted event från servern
    socket.on('gameStarted', handleGameStarted);
    // Lyssna på participants uppdateringar
    socket.on('participants', handleParticipants);
    
    return () => {
      socket.off('gameStarted', handleGameStarted);
      socket.off('participants', handleParticipants);
    };
  }, [username]);


  if (gameStarted) {
    // Transform users array to the format Game expects
    const gameUsers = Array.isArray(users) ? users.map((username, index) => ({
      username,
      player: index + 1
    })) : [];
    return <Game roomCode={roomId} users={gameUsers} username={username} />;
  }

  const isLoading = !Array.isArray(users);

  return (
    <div className="room-container">
      <div className="game-body">
        {/* Här kan du lägga till mer info om rummet eller spelet */}
        {isLoading ? (
          <p className="loading-text">Laddar deltagarlista...</p>
        ) : (
          <>
            <p className="participant-count">Antal deltagare: {users.length}</p>
            {users.length > 1 && (
              <button 
                className="start-game-button"
                onClick={() => {
                  // Skicka socket event för att starta spel för alla
                  socket.emit('startGame', {
                    roomId: roomId,
                    username: username
                  });
                }}
              >
                Starta spel
              </button>
            )}
          </>
        )}
      </div>
      <Chat username={username} roomId={roomId} />
    </div>
  );
};

export default Room;
