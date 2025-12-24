import React, { useState } from 'react';
import socket from '../utils/socket';
import './CustomRoom.css';

function JoinRoomModal({ roomCode, onClose, onJoined }) {
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = (e) => {
    e.preventDefault();
    setIsJoining(true);
    setError('');

    const username = localStorage.getItem('gnarp-username') || 'Anonym';
    
    // Join the room directly via socket
    socket.emit('joinRoom', {
      username: username,
      room: roomCode.toUpperCase(),
      password: password.trim() || undefined
    });

    // Call the callback
    if (onJoined) {
      onJoined(roomCode.toUpperCase(), username);
    }

    setIsJoining(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔐 Anslut till privat rum</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleJoinRoom} className="create-room-form">
          <div className="form-row">
            <label>Rumskod:</label>
            <input
              type="text"
              value={roomCode}
              readOnly
              style={{ background: 'rgba(255,255,255,0.1)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-row">
            <label htmlFor="password">Lösenord:</label>
            <input
              id="password"
              type="password"
              placeholder="Ange rumets lösenord"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              maxLength="20"
              required
              autoFocus
            />
            <small className="form-help">Detta är ett privat rum som kräver lösenord</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Avbryt
            </button>
            <button type="submit" disabled={isJoining} className="create-button">
              {isJoining ? 'Ansluter...' : '🎮 Anslut'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default JoinRoomModal;