import React, { useState } from 'react';
import Board from './Board';
import './GameResults.css';

const GameResults = ({ words, points, leaderboard, username, users, walkover, allPlayerData }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  if (!leaderboard || leaderboard.length === 0) {
    return null;
  }

  const handlePlayerClick = (playerName) => {
    if (playerName !== username && allPlayerData && allPlayerData[playerName]) {
      setSelectedPlayer(selectedPlayer === playerName ? null : playerName);
    }
  };

  return (
    <div className="game-results-container">
      <div className="game-results-sidebar">
        <div className="results-header">
          <h2 className="results-title">🏆 Game Results</h2>
          {walkover && <span className="walkover-badge">Walkover</span>}
        </div>
        
        <div className="results-content">
          {/* Personal Score Section */}
          <div className="personal-score">
            <h3>Your Score</h3>
            <div className="score-display">
              <span className="points">{points}</span>
              <span className="points-label">points</span>
            </div>
            <div className="words-count">
              {words?.length || 0} words found
            </div>
          </div>

          {/* Leaderboard Section */}
          <div className="leaderboard-section">
            <h3>Final Ranking</h3>
            <div className="leaderboard">
              {leaderboard.map((player, index) => (
                <div 
                  key={player.username} 
                  className={`leaderboard-item ${player.username === username ? 'current-player' : 'clickable'} ${walkover ? 'walkover' : ''}`}
                  onClick={() => handlePlayerClick(player.username)}
                  title={player.username !== username ? 'Click to view board' : ''}
                >
                  <div className="rank">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <div className="player-info">
                    <span className="player-name">{player.username}</span>
                    {player.username === username && <span className="you-badge">You</span>}
                    {player.username !== username && allPlayerData && allPlayerData[player.username] && (
                      <span className="view-board-hint">👁️</span>
                    )}
                  </div>
                  <div className="player-points">{player.points}p</div>
                </div>
              ))}
            </div>
          </div>

          {/* Words Section */}
          {words && words.length > 0 && (
            <div className="words-section">
              <h3>Your Words</h3>
              <div className="words-grid">
                {words.map((word, index) => (
                  <span key={index} className="word-chip">{word}</span>
                ))}
              </div>
            </div>
          )}

          {walkover && (
            <div className="walkover-info">
              <p>🎉 You won by walkover!</p>
              <p>Other players left the game.</p>
            </div>
          )}
        </div>
        
        <div className="results-footer">
          <button 
            className="new-game-button"
            onClick={() => window.location.reload()}
          >
            🔄 New Game
          </button>
        </div>
      </div>

      {/* Player Board Viewer */}
      {selectedPlayer && allPlayerData && allPlayerData[selectedPlayer] && (
        <div className="player-board-viewer">
          <div className="board-viewer-header">
            <h3>{selectedPlayer}'s Board</h3>
            <button 
              className="close-board-btn"
              onClick={() => setSelectedPlayer(null)}
            >
              ✕
            </button>
          </div>
          <div className="board-viewer-content">
            <Board 
              board={allPlayerData[selectedPlayer].board} 
              disabled={true}
              currentLetter=""
            />
            <div className="player-stats">
              <div className="stat">
                <span className="stat-label">Words:</span>
                <span className="stat-value">{allPlayerData[selectedPlayer].words?.length || 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Points:</span>
                <span className="stat-value">{allPlayerData[selectedPlayer].points || 0}</span>
              </div>
            </div>
            <div className="player-words">
              <h4>Words found:</h4>
              <div className="words-grid">
                {(allPlayerData[selectedPlayer].words || []).map((word, index) => (
                  <span key={index} className="word-chip small">{word}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameResults;