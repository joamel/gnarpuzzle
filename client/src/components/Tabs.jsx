import React, { useState, useEffect } from 'react';
import './Tabs.css';
import useSocketQuery from '../api/useSocketQuery';
import { useChatMutation } from '../api/chat-mutation';
import { useParticipantsMutation } from '../api/participants-mutation';
import { useParticipantsLeaveMutation } from '../api/participants-leave-mutation';
import { useChatQuery } from '../api/chat-query';
import { useParticipantsQuery } from '../api/participants-query';
import Game from './Game';
import Room from './Room';
import Chat from './Chat';
import Logo from './Logo';
import Header from './Header';
import CustomRoom from './CustomRoom';
import socket from '../utils/socket';

const Tabs = () => {
  const [activeTab, setActiveTab] = useState(null);
  const [username, setUsername] = useState(() => localStorage.getItem('gnarp-username') || "");
  const [hasJoined, setHasJoined] = useState(() => localStorage.getItem('gnarp-hasJoined') === 'true');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(true);
  const [customRooms, setCustomRooms] = useState([]);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  // Validera server-state vid uppstart
  useEffect(() => {
    if (hasJoined && username) {
      console.log('=== VALIDATING SERVER STATE ON STARTUP ===');
      
      // Sätt en timeout som säkerhet ifall servern inte svarar
      const fallbackTimeout = setTimeout(() => {
        console.log('Timeout reached, assuming cleanup is done');
        setIsReconnecting(false);
      }, 2000);
      
      // Lyssna på bekräftelse från servern
      const handleCleanupComplete = () => {
        console.log('Server cleanup completed');
        clearTimeout(fallbackTimeout);
        setIsReconnecting(false);
        socket.off('cleanupComplete', handleCleanupComplete);
      };
      
      socket.on('cleanupComplete', handleCleanupComplete);
      
      // Rensa eventuell gammal state på servern
      console.log('Sending cleanup request to server');
      socket.emit('clientReconnected', { username });

    } else {
      setIsReconnecting(false);
    }
  }, [hasJoined, username]);

  const handleLogout = () => {
    const confirmed = window.confirm('Är du säker på att du vill logga ut? Detta kommer att avsluta ditt spel om det pågår.');
    if (confirmed) {
      // Om användaren är i ett rum, skicka leaveRoom-event
      if (currentRoom) {
        console.log(`=== SENDING LEAVE ROOM EVENT (LOGOUT) ===`);
        console.log(`Room: ${currentRoom}, Username: ${username}`);
        socket.emit('leaveRoom', { room: currentRoom, username });
      }

      // Rensa localStorage
      localStorage.removeItem('gnarp-hasJoined');
      localStorage.removeItem('gnarp-username');
      // Ladda om sidan för att gå tillbaka till start
      window.location.reload();
    }
  };

  const handleLeaveRoom = () => {
    const confirmed = window.confirm('Är du säker på att du vill lämna rummet? Detta kommer att avsluta ditt spel om det pågår.');
    if (confirmed) {
      // Skicka socket-event för att meddela backend
      console.log(`=== SENDING LEAVE ROOM EVENT ===`);
      console.log(`Room: ${currentRoom}, Username: ${username}`);
      socket.emit('leaveRoom', { room: currentRoom, username });

      // Lämna rummet via API
      participantsLeaveMutation.mutate({ roomId: currentRoom, username });
      // Återgå till rumslista
      setCurrentRoom(null);
      setActiveTab(null);
    }
  };

  const handleRoomCreated = (roomData) => {
    setCustomRooms(prev => [...prev, roomData]);
    setShowCreateRoomModal(false);
  };

  const handleJoinCustomRoom = (roomCode) => {
    setCurrentRoom(roomCode);
    participantsMutation.mutate({ roomId: roomCode, username });
  };

  const { data: participants } = useParticipantsQuery('room1');
  const participantsMutation = useParticipantsMutation();
  const participantsLeaveMutation = useParticipantsLeaveMutation();
  const roomId = "room1";

  // Visa loading medan vi validerar server-state
  if (isReconnecting) {
    return (
      <div className="login-container">
        <div className="login-welcome">
          <div className="welcome-logo">
            <Logo size="large" />
          </div>
          <p>Återansluter till servern...</p>
        </div>
      </div>
    );
  }

  // Visa lobby/namninput om användaren inte har joinat än
  if (!hasJoined) {
    return (
      <div className="login-container">
        <div className="login-welcome">
          <div className="welcome-logo">
            <Logo size="large" />
          </div>
        </div>
        <div className="login-card">
          <form className="login-form" onSubmit={(e) => {
            e.preventDefault();
            if (username.trim()) {
              localStorage.setItem('gnarp-username', username);
              localStorage.setItem('gnarp-hasJoined', 'true');
              setHasJoined(true);
            }
          }}>
            <div className="form-group">
              <label htmlFor="username">Användarnamn</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Ange ditt namn"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Lösenord</label>
              <input
                id="password"
                type="password"
                placeholder="(Valfritt för nu)"
                disabled
              />
            </div>
            <button
              type="submit"
              disabled={!username.trim()}
              className="login-button"
            >
              Logga in
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (currentRoom) {
    // Visa aktuellt rum med lämna-knapp
    return (
      <div className="room-layout">
        <Header
          username={username}
          onLogout={handleLogout}
          showRoomBackButton={true}
          onBackToRooms={handleLeaveRoom}
        />
        <div className="content-wrapper">
          <div className="game-section">
            {currentRoom === "room1" && <Room username={username} users={participants?.["room1"] ?? []} roomId="room1" showChat={false} />}
            {currentRoom === "room2" && <Room username={username} users={participants?.["room2"] ?? []} roomId="room2" showChat={false} />}
            {currentRoom === "room3" && <Room username={username} users={participants?.["room3"] ?? []} roomId="room3" showChat={false} />}
          </div>
          <div className="chat-sidebar">
            <Chat username={username} roomId={currentRoom} />
          </div>
        </div>
      </div>
    );
  }

  // Visa rumslista när inte i något rum
  return (
    <>
      <Header username={username} onLogout={handleLogout} />
      <div className="room-selection">
        <h2>Välj rum att gå med i:</h2>
        
        {/* Publika rum på samma rad */}
        <div className="room-buttons">
          <button className="room-button"
            onClick={() => {
              console.log('Room1 button clicked', { roomId: 'room1', username });
              setActiveTab("room1");
              setCurrentRoom('room1');
              participantsMutation.mutate({ roomId: 'room1', username });
            }}
          >
            🎄 Rum 1 (4x4)
          </button>
          <button className="room-button"
            onClick={() => {
              console.log('Room2 button clicked', { roomId: 'room2', username });
              setActiveTab("room2");
              setCurrentRoom('room2');
              participantsMutation.mutate({ roomId: 'room2', username });
            }}
          >
            🎅 Rum 2 (5x5)
          </button>
          <button className="room-button"
            onClick={() => {
              console.log('Room3 button clicked', { roomId: 'room3', username });
              setActiveTab("room3");
              setCurrentRoom('room3');
              participantsMutation.mutate({ roomId: 'room3', username });
            }}
          >
            🎁 Rum 3 (6x6)
          </button>
        </div>
        
        {/* Privata rum sektion */}
        <div className="private-rooms-section">
          <h3>🔒 Privata rum</h3>
          <button className="create-room-button" onClick={() => setShowCreateRoomModal(true)}>
            + Skapa nytt rum
          </button>
          
          {customRooms.length > 0 && (
            <div className="custom-rooms-list">
              {customRooms.map((room) => (
                <button
                  key={room.code}
                  className="custom-room-button"
                  onClick={() => handleJoinCustomRoom(room.code)}
                >
                  🏠 {room.name} ({room.boardSize})
                  <span className="room-code">#{room.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Room Modal */}
      {showCreateRoomModal && (
        <CustomRoom onRoomCreated={handleRoomCreated} onClose={() => setShowCreateRoomModal(false)} />
      )}
    </>
  );
}

export default Tabs;