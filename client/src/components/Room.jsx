import React, { useState, useEffect } from 'react';
import Game from './Game';
import Chat from './Chat';
import Logo from './Logo';
import socket from '../utils/socket';
import { API_BASE_URL } from '../config/api';
import './Room.css';

const Room = (props) => {
  const { username, users: initialUsers, roomId = 'room1', showChat = true, isCustomRoom = false, customRoomCode = '' } = props;
  const [gameStarted, setGameStarted] = useState(false);
  const [users, setUsers] = useState(initialUsers || []);
  const [readyPlayers, setReadyPlayers] = useState(new Set());
  const [isReady, setIsReady] = useState(false);

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
    fetch(`${API_BASE_URL}/participants/${roomId}`, {
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

    const handlePlayerReady = (data) => {
      console.log('Player ready:', data);
      setReadyPlayers(prev => new Set([...prev, data.username]));
    };

    const handlePlayerNotReady = (data) => {
      console.log('Player not ready:', data);
      setReadyPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
    };

    // Lyssna på gameStarted event från servern
    socket.on('gameStarted', handleGameStarted);
    // Lyssna på participants uppdateringar
    socket.on('participants', handleParticipants);
    // Ready state events
    socket.on('playerReady', handlePlayerReady);
    socket.on('playerNotReady', handlePlayerNotReady);
    
    return () => {
      socket.off('gameStarted', handleGameStarted);
      socket.off('participants', handleParticipants);
      socket.off('playerReady', handlePlayerReady);
      socket.off('playerNotReady', handlePlayerNotReady);
    };
  }, [username]);

  const toggleReady = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    
    if (newReadyState) {
      socket.emit('playerReady', { roomId, username });
    } else {
      socket.emit('playerNotReady', { roomId, username });
    }
  };

  const allPlayersReady = users.length > 1 && users.every(user => readyPlayers.has(user));


  if (gameStarted) {
    // Transform users array to the format Game expects
    const gameUsers = Array.isArray(users) ? users.map((username, index) => ({
      username,
      player: index + 1
    })) : [];
    
    return (
      <div className="room-container">
        <div className="game-section">
          <Game roomCode={roomId} users={gameUsers} username={username} />
        </div>
        {showChat && (
          <div className="chat-section">
            <Chat username={username} roomId={roomId} />
          </div>
        )}
      </div>
    );
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
            {isCustomRoom && `🎄 Anpassat Rum: ${customRoomCode}`}
          </h1>
          <p className="room-description">
            {isCustomRoom 
              ? `Välkommen till ditt anpassade spelrum! Dela rumskoden "${customRoomCode}" med vänner för att bjuda in dem.`
              : 'Välkommen till spelrummet! Vänta på att fler spelare ansluter sig.'}
          </p>
          {isCustomRoom && (
            <div className="custom-room-info">
              <div className="room-code-display">
                <strong>Rumskod: {customRoomCode}</strong>
                <button 
                  className="copy-code-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(customRoomCode);
                    alert('Rumskod kopierad!');
                  }}
                >
                  📋 Kopiera
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="participants-section">
          <h3 className="participants-title">
            👥 Deltagare ({isLoading ? '...' : users.length})
            {isCustomRoom && <span className="max-participants">/8</span>}
          </h3>
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Laddar deltagarlista...</p>
            </div>
          ) : (
            <div className="participants-list">
              {users.map((user, index) => (
                <div key={index} className={`participant-card ${user === username ? 'current-user' : ''}`}>
                  <div className="participant-info">
                    <span className="participant-icon">
                      {user === username ? '👑' : '👤'}
                    </span>
                    <span className="participant-name">{user}</span>
                    <div className="participant-badges">
                      {user === username && <span className="you-badge">Du</span>}
                      <span className={`status-badge ${readyPlayers.has(user) ? 'ready' : 'not-ready'}`}>
                        {readyPlayers.has(user) ? '✅ Redo' : '⏳ Väntar'}
                      </span>
                    </div>
                  </div>
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
        
        {/* Ready section för alla spelare */}
        {users.length > 1 && (
          <div className="ready-section">
            <button 
              className={`ready-button ${isReady ? 'ready' : 'not-ready'}`}
              onClick={toggleReady}
            >
              {isReady ? '✅ Du är redo!' : '⏳ Markera som redo'}
            </button>
            <p className="ready-status">
              {readyPlayers.size}/{users.length} spelare redo
              {allPlayersReady && ' - Alla redo! 🎉'}
            </p>
          </div>
        )}
        
        {/* Start knapp (endast för första spelaren när alla är redo) */}
        {users.length > 1 && users[0] === username && allPlayersReady && (
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
      {showChat && (
        <div className="chat-section">
          <Chat username={username} roomId={roomId} />
        </div>
      )}
    </div>
  );
};

export default Room;
