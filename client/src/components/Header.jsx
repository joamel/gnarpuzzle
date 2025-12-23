import React, { useState } from 'react';
import Logo from './Logo';
import './Header.css';

const Header = ({ username, onLogout, showRoomBackButton = false, onBackToRooms = null }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    
    return (
        <>
            <div className="snowflakes" aria-hidden="true">
                <div className="snowflake">❅</div>
                <div className="snowflake">❆</div>
                <div className="snowflake">❅</div>
                <div className="snowflake">❆</div>
                <div className="snowflake">❅</div>
                <div className="snowflake">❆</div>
                <div className="snowflake">❅</div>
            </div>
            <header className="app-header christmas-header">
                <div className="header-left">
                    <span className="santa">🎅</span>
                    <Logo size="medium" showText={true} />
                </div>
                
                <div className="header-right">
                    <div className="user-dropdown">
                        <button 
                            className="username-display" 
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            👤 {username} ▼
                        </button>
                        {showDropdown && (
                            <div className="dropdown-menu">
                                <button className="logout-button" onClick={() => {
                                    setShowDropdown(false);
                                    onLogout();
                                }}>
                                    Logga ut
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            
            {/* Lobbyn-knapp under headern */}
            {showRoomBackButton && (
                <div className="sub-header">
                    <button className="lobby-button" onClick={onBackToRooms}>
                        ← Lobbyn 🚪
                    </button>
                </div>
            )}
        </>
    );
};

export default Header;