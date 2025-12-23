import React, { useState } from 'react';
import './CustomRoom.css';

function CustomRoom({ onJoinCustomRoom, onCreateCustomRoom }) {
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (roomCode.trim().length < 3) {
      setError('Rumskoden måste vara minst 3 tecken');
      return;
    }
    setError('');
    onJoinCustomRoom(roomCode.trim().toUpperCase());
  };

  const handleCreateRoom = () => {
    setIsCreating(true);
    // Generate a random 6-character room code
    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    onCreateCustomRoom(generatedCode);
  };

  return (
    <div className="custom-room-container">
      <div className="custom-room-card">
        <h2>🎄 Anpassade Spelrum</h2>
        
        <div className="room-options">
          <div className="join-room-section">
            <h3>📝 Gå med i rum</h3>
            <form onSubmit={handleJoinRoom}>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Ange rumskod (t.ex. ABC123)"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value);
                    setError('');
                  }}
                  maxLength="10"
                  className="room-input"
                />
                <button type="submit" className="join-button">
                  Gå med
                </button>
              </div>
              {error && <p className="error-message">{error}</p>}
            </form>
          </div>

          <div className="divider">
            <span>eller</span>
          </div>

          <div className="create-room-section">
            <h3>🏠 Skapa nytt rum</h3>
            <p>Skapa ett privat spelrum och få en unik rumskod att dela</p>
            <button 
              onClick={handleCreateRoom}
              disabled={isCreating}
              className="create-button"
            >
              {isCreating ? 'Skapar rum...' : '🎮 Skapa rum'}
            </button>
          </div>
        </div>

        <div className="room-info">
          <h4>💡 Tips</h4>
          <ul>
            <li>Rumskoder är inte skiftlägeskänsliga</li>
            <li>Privata rum raderas när alla spelare lämnar</li>
            <li>Dela rumskoden med vänner för att spela tillsammans</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CustomRoom;