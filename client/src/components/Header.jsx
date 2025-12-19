import React from 'react';
import Logo from './Logo';
import './Header.css';

const Header = ({ username, onLogout, showRoomBackButton = false, onBackToRooms = null }) => {
    return (
        <header className="app-header">
            <div className="header-left">
                {showRoomBackButton ? (
                <button className="back-button" onClick={onBackToRooms}>
                    ← Tillbaka till lobbyn
                </button>
                ) : (
                    <Logo size="small" showText={false} />
                )}
            </div>
            
            <div className="header-center">
                <Logo size="medium" showText={true} />
            </div>
            
            <div className="header-right">
                <div className="user-info">
                    <span className="username-display">👤 {username}</span>
                    <button className="logout-button" onClick={onLogout}>
                        Logga ut
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;