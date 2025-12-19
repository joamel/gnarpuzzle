import React, { useState, useEffect } from 'react';
import Game from './Game';
import Chat from './Chat';
import Logo from './Logo';
import socket from '../utils/socket';
import './Room.css';

const Room = (props) => {
  const { username, users: initialUsers, roomId = 'room1', showChat = true } = props;
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
    fetch(`http://localhost:3001/participants/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, username }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .catch(error => console.error('Error registering participant:', error));

    const handleGameStarted = (data) => {
      console.log('=== GAME STARTED EVENT RECEIVED ===');
      console.log('Data:', data);
      console.log('Setting gameStarted to true');
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
      <div className="room-content">
        <div className="room-welcome">
          <Logo size="small" showText={false} />
          <h1 className="room-title">
            {roomId === 'room1' && '🏠 Rum 1'}
            {roomId === 'room2' && '🌟 Rum 2'}
            {roomId === 'room3' && '🚀 Rum 3'}
            {roomId === 'room4' && '💎 Rum 4'}
          </h1>
          <p className="room-description">Välkommen till spelrummet! Vänta på att fler spelare ansluter sig.</p>
        </div>
        
        <div className="participants-section">
          <h3 className="participants-title">👥 Deltagare ({isLoading ? '...' : users.length})</h3>
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Laddar deltagarlista...</p>
            </div>
          ) : (
            <div className="participants-list">
              {users.map((user, index) => (
                <div key={index} className={`participant-card ${user === username ? 'current-user' : ''}`}>
                  <span className="participant-icon">👤</span>
                  <span className="participant-name">{user}</span>
                  {user === username && <span className="you-badge">Du</span>}
                </div>
              ))}
              {users.length === 1 && (
                <div className="waiting-message">
                  <p>🕰️ Väntar på fler spelare att ansluta...</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {users.length > 1 && users[0] === username && (
          <div className="game-start-section">
            <button 
              className="start-game-button"
              onClick={() => {
                console.log('=== START GAME BUTTON CLICKED ===');
                console.log('Emitting startGame event:', { roomId, username });
                socket.emit('startGame', {
                  roomId: roomId,
                  username: username
                });
              }}
            >
              🎮 Starta spel ({users.length} spelare)
            </button>
            <p className="start-game-hint">Alla spelare är redo att börja spela!</p>
          </div>
        )}
        {users.length > 1 && users[0] !== username && (
          <div className="game-start-section">
            <p className="waiting-for-start">Väntar på att {users[0]} startar spelet...</p>
          </div>
        )}
      </div>
      {showChat && <Chat username={username} roomId={roomId} />}
    </div>
  );
};

export default Room;
