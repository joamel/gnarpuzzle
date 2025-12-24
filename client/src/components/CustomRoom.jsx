import React, { useState } from 'react';
import './CustomRoom.css';

function CustomRoom({ onRoomCreated, onClose }) {
  const [roomName, setRoomName] = useState('');
  const [boardSize, setBoardSize] = useState('4x4');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (roomName.trim().length < 3) {
      setError('Rumnamnet måste vara minst 3 tecken');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      // Generate a random 6-character room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const roomData = {
        code: roomCode,
        name: roomName.trim(),
        boardSize,
        description: description.trim() || `Ett ${boardSize} spelrum`
      };

      console.log('Creating room:', roomData);
      onRoomCreated(roomData);
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