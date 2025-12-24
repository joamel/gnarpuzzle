import React from 'react';
import './Timer.css';

const Timer = ({ timeLeft, currentPlayer, isWarning, showNumbers, isMyTurn }) => {
    if (timeLeft <= 0) return null;

    // Calculate circle properties
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - timeLeft / 15); // Assume 15 second max

    // Determine color based on time left
    const getColor = () => {
        if (timeLeft <= 3) return '#ff4444'; // Red
        if (timeLeft <= 7) return '#ff8800'; // Orange
        return '#44aa44'; // Green
    };

    return (
        <div className={`timer-container ${isWarning ? 'timer-warning' : ''} ${isMyTurn ? 'timer-my-turn' : ''}`}>
            <div className="timer-circle">
                <svg width="100" height="100" className="timer-svg">
                    {/* Background circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke="#e0e0e0"
                        strokeWidth="6"
                        fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="50"
                        cy="50"
                        r={radius}
                        stroke={getColor()}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="timer-progress"
                    />
                </svg>
                
                {showNumbers && (
                    <div className="timer-text">
                        <span className="timer-number">{timeLeft}</span>
                    </div>
                )}
            </div>
            
            <div className="timer-label">
                {isMyTurn ? 'Din tur!' : `${currentPlayer}s tur`}
            </div>
        </div>
    );
};

export default Timer;