import React, { useState } from 'react';
import './Tabs.css';
import useSocketQuery from '../api/useSocketQuery';
import { useChatMutation } from '../api/chat-mutation';
import { useParticipantsMutation } from '../api/participants-mutation';
import { useParticipantsLeaveMutation } from '../api/participants-leave-mutation';
import { useChatQuery } from '../api/chat-query';
import { useParticipantsQuery } from '../api/participants-query';
import Game from './Game';
import Room from './Room';
import socket from '../utils/socket';

const Tabs = () => {
  const [activeTab, setActiveTab] = useState(null);
  const [username, setUsername] = useState(() => localStorage.getItem('gnarp-username') || "");
  const [hasJoined, setHasJoined] = useState(() => localStorage.getItem('gnarp-hasJoined') === 'true');
  const [currentRoom, setCurrentRoom] = useState(null);

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
  const { data: participants } = useParticipantsQuery('room1');
  const participantsMutation = useParticipantsMutation();
  const participantsLeaveMutation = useParticipantsLeaveMutation();
  const roomId = "room1";

  // Visa lobby/namninput om användaren inte har joinat än
  if (!hasJoined) {
    return (
      <div className="welcome-container">
        <h2>Välkommen till Gnarp!</h2>
        <label htmlFor="username-input">Ange ditt namn:</label>
        <input
          id="username-input"
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="username-input"
        />
        <button
          disabled={!username.trim()}
          onClick={() => {
            localStorage.setItem('gnarp-username', username);
            localStorage.setItem('gnarp-hasJoined', 'true');
            setHasJoined(true);
          }}
          className="join-button"
        >
          Gå vidare till rummet
        </button>
      </div>
    );
  }

  if (currentRoom) {
    // Visa aktuellt rum med lämna-knapp
    return (
      <>
        <div className="lobby-header">
          <div className="username-display">
            👤 {username}
            <button className="logout-button-small" onClick={handleLogout}>
              Logga ut
            </button>
          </div>
        </div>
        <div className="room-header">
          <div className="room-info">
            <h2>
              {currentRoom === 'room1' && '🏠 Rum 1'}
              {currentRoom === 'room2' && '🌟 Rum 2'}
              {currentRoom === 'room3' && '🚀 Rum 3'}
              {currentRoom === 'room4' && '💎 Rum 4'}
            </h2>
          </div>
          <div className="room-controls">
            <button className="leave-room-button" onClick={handleLeaveRoom}>
              ← Lämna rum
            </button>
          </div>
        </div>
        {currentRoom === "room1" && <Room username={username} users={participants?.["room1"] ?? []} roomId="room1" />}
        {currentRoom === "room2" && <Room username={username} users={participants?.["room2"] ?? []} roomId="room2" />}
        {currentRoom === "room3" && <Room username={username} users={participants?.["room3"] ?? []} roomId="room3" />}
        {currentRoom === "room4" && <Room username={username} users={participants?.["room4"] ?? []} roomId="room4" />}
      </>
    );
  }

  // Visa rumslista när inte i något rum
  return (
    <>
      <div className="lobby-header">
        <div className="username-display">
          👤 {username}
          <button className="logout-button-small" onClick={handleLogout}>
            Logga ut
          </button>
        </div>
      </div>
      <div className="room-selection">
        <h2>Välj rum att gå med i:</h2>
        <div className="room-buttons">
          <button className="room-button" 
            onClick={() => {
              console.log('Room1 button clicked', { roomId: 'room1', username });
              setActiveTab("room1");
              setCurrentRoom('room1');
              participantsMutation.mutate({ roomId: 'room1', username });
            }}
          >
            🏠 Rum 1
          </button>
          <button className="room-button" 
            onClick={() => {
              console.log('Room2 button clicked', { roomId: 'room2', username });
              setActiveTab("room2");
              setCurrentRoom('room2');
              participantsMutation.mutate({ roomId: 'room2', username });
            }}
          >
            🌟 Rum 2
          </button>
          <button className="room-button" 
            onClick={() => {
              console.log('Room3 button clicked', { roomId: 'room3', username });
              setActiveTab("room3");
              setCurrentRoom('room3');
              participantsMutation.mutate({ roomId: 'room3', username });
            }}
          >
            🚀 Rum 3
          </button>
          <button className="room-button" 
            onClick={() => {
              console.log('Room4 button clicked', { roomId: 'room4', username });
              setActiveTab("room4");
              setCurrentRoom('room4');
              participantsMutation.mutate({ roomId: 'room4', username });
            }}
          >
            💎 Rum 4
          </button>
        </div>
      </div>
    </>
  );
}

export default Tabs;