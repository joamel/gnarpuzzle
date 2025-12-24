import React, { useState, useEffect } from 'react';
import socket from '../utils/socket';
import './CustomRoom.css';

function CustomRoom({ onRoomCreated, onClose, onRoomJoined }) {
  const [roomName, setRoomName] = useState('');
  const [boardSize, setBoardSize] = useState('4x4');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Listen for socket responses
    const handleCustomRoomCreated = (data) => {
      console.log('Custom room created:', data);
      setIsCreating(false);
      
      // Auto-join the room with room info
      if (data.roomCode && onRoomJoined) {
        const username = localStorage.getItem('gnarp-username') || 'Anonym';
        setTimeout(() => {
          onRoomJoined(data.roomCode, username, data.roomInfo);
        }, 500);
      }
      onClose();
    };

    const handleCustomRoomError = (error) => {
      console.error('Custom room error:', error);
      setError(error.message);
      setIsCreating(false);
    };

    socket.on('custom-room-created', handleCustomRoomCreated);
    socket.on('custom-room-error', handleCustomRoomError);

    return () => {
      socket.off('custom-room-created', handleCustomRoomCreated);
      socket.off('custom-room-error', handleCustomRoomError);
    };
  }, [onRoomJoined, onClose]);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (roomName.trim().length < 3) {
      setError('Rumnamnet måste vara minst 3 tecken');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const roomData = {
        name: roomName.trim(),
        boardSize,
        description: description.trim() || `Ett ${boardSize} spelrum`,
        password: password.trim() || undefined,
        isPasswordProtected: !!password.trim()
      };

      console.log('🎄 EMITTING create-custom-room with data:', roomData);
      console.log('🔌 Socket connected?', socket.connected);
      console.log('🔌 Socket id:', socket.id);
      
      // Test socket connection first
      socket.emit('test-event', { test: 'data' });
      
      socket.emit('create-custom-room', roomData);
      
    } catch (error) {
      setError('Fel vid skapande av rum: ' + error.message);
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎄 Skapa nytt rum</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleCreateRoom} className="create-room-form">
          <div className="form-row">
            <label htmlFor="roomName">Rumnamn:</label>
            <input
              id="roomName"
              type="text"
              placeholder="T.ex. Familjerummet"
              value={roomName}
              onChange={(e) => {
                setRoomName(e.target.value);
                setError('');
              }}
              maxLength="20"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="boardSize">Spelplan:</label>
            <select
              id="boardSize"
              value={boardSize}
              onChange={(e) => setBoardSize(e.target.value)}
            >
              <option value="4x4">4x4 - Nybörjare</option>
              <option value="5x5">5x5 - Medel</option>
              <option value="6x6">6x6 - Expert</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="description">Beskrivning (valfritt):</label>
            <input
              id="description"
              type="text"
              placeholder="T.ex. För avancerade spelare"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength="50"
            />
          </div>

          <div className="form-row">
            <label htmlFor="password">Lösenord (valfritt):</label>
            <input
              id="password"
              type="text"
              placeholder="Lämna tomt för öppet rum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength="20"
            />
            <small className="form-help">Ange lösenord för privat rum</small>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Avbryt
            </button>
            <button type="submit" disabled={isCreating} className="create-button">
              {isCreating ? 'Skapar...' : '🎮 Skapa rum'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomRoom;