import React, { useState, useEffect } from 'react';
import socket from '../utils/socket';
import Board from './Board';
import './GameOverModal.css';

const GameOverModal = ({ words, points, leaderboard, username, users }) => {
  const [activeTab, setActiveTab] = useState('myResults');
  const [opponentData, setOpponentData] = useState({});
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  // Lyssna på opponents data från servern
  useEffect(() => {
    socket.on('allPlayerResults', (allResults) => {
      setOpponentData(allResults);
      // Sätt currentPlayerIndex till användarens position
      const playerNames = Object.keys(allResults);
      const userIndex = playerNames.indexOf(username);
      setCurrentPlayerIndex(userIndex >= 0 ? userIndex : 0);
    });

    // Be om alla spelares resultat när modalen öppnas
    socket.emit('requestAllResults', { room: 'room1' });

    return () => {
      socket.off('allPlayerResults');
    };
  }, [username]);

  const tabs = [
    { id: 'myResults', label: 'Resultat & Topplista' },
    { id: 'compare', label: 'Jämför Spelare' }
  ];

  const renderMyResults = () => (
    <div className="results-container">
      {/* Topplista */}
        <div>
            <h3 className="section-title">Topplista:</h3>
            <div className="leaderboard-grid">
            {leaderboard.map((player, index) => (
                <React.Fragment key={player.username}>
                <div className={`leaderboard-cell position ${player.username === username ? 'current-user' : 'other-user'}`}>
                    {index + 1}.
                </div>
                <div className={`leaderboard-cell name ${player.username === username ? 'current-user' : 'other-user'}`}>
                    {player.username}{player.username === username && ' (Du)'}
                </div>
                <div className={`leaderboard-cell points ${player.username === username ? 'current-user' : 'other-user'}`}>
                    {player.points} p
                </div>
                <div className={`leaderboard-cell crown ${player.username === username ? 'current-user' : 'other-user'}`}>
                    {index === 0 && '👑'}
                </div>
                </React.Fragment>
            ))}
        </div>
    </div>
    <div>
        <h3 className="section-title">Dina ord ({words ? words.length : 0} st):</h3>
        <div className="words-container">
            {Array.isArray(words) && words.length > 0 ? (
            <div className="words-grid">
                {words.map((word, index) => (
                    <span key={index} className="word-badge">
                        {word}
                    </span>
                ))}
            </div>
            ) : (
                <p className="no-words-message">Inga ord hittades</p>
            )}
            </div>
                <div className="total-points">
                    Din totala poäng: {points}
                </div>
            </div>
    </div>
    );

    const renderPlayerComparison = () => {
        const playerNames = Object.keys(opponentData);
        if (playerNames.length === 0) {
        return (
            <p className="loading-message">
                Laddar spelardata...
            </p>
        );
        }

        const currentPlayerName = playerNames[currentPlayerIndex];
        const currentData = opponentData[currentPlayerName];

        if (!currentData) return null;

        return (
            <div>
                {/* Navigation */}
                <div className="player-navigation">
                <button 
                    onClick={() => setCurrentPlayerIndex(prev => prev > 0 ? prev - 1 : playerNames.length - 1)}
                    className="nav-button"
                >
                    ◀
                </button>
                
                <div className={`player-info ${currentPlayerName === username ? 'current-user' : ''}`}>
                    {currentPlayerName} {currentPlayerName === username && '(Du)'}
                    <div className="player-counter">
                        {currentPlayerIndex + 1} / {playerNames.length}
                    </div>
                </div>                <button 
                    onClick={() => setCurrentPlayerIndex(prev => prev < playerNames.length - 1 ? prev + 1 : 0)}
                    className="nav-button"
                >
                    ▶
                </button>
                </div>

                {/* Player Content */}
                <div className={`player-content ${currentPlayerName === username ? 'current-user' : 'other-user'}`}>
                    <h4 className="player-points">
                        {currentData.points} poäng
                    </h4>
                    
                    {/* Spelplan */}
                    {currentData.board && (
                        <div className="board-section">
                        <strong className="board-title">Spelplan:</strong>
                        <Board 
                            board={currentData.board} 
                            boardDisabled={true} 
                            playRound={() => {}} 
                        />
                        </div>
                    )}
                    
                    {/* Ord */}
                    <div className="words-section">
                        <strong className="section-title">Ord ({currentData.words ? currentData.words.length : 0} st):</strong>
                        {currentData.words && currentData.words.length > 0 ? (
                        <div className="words-grid">
                            {currentData.words.map((word, index) => (
                            <span key={index} className="word-badge">
                                {word}
                            </span>
                            ))}
                        </div>
                        ) : (
                        <p className="no-words-message">Inga ord hittades</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="game-over-modal">
            <h2>GAME OVER!</h2>
            
            {/* Tab Navigation */}
            <div className="tab-navigation">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'myResults' && renderMyResults()}
                {activeTab === 'compare' && renderPlayerComparison()}
            </div>
        </div>
    );
};

export default GameOverModal;