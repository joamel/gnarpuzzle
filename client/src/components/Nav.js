import React from 'react';
import '../App.css';
import { Link } from 'react-router-dom';

function Nav() {

  const navStyle = {
    color: 'red'
  };

  return (
    <nav>
        <h3>Logo</h3>
        <ul className="nav-links">
          <Link style={navStyle} to='/'>
            <li>Home</li>
          </Link>
          {/* <Link style={navStyle} to='/lobby'> */}
            <li>Join room</li>
          {/* </Link> */}
        </ul>
    </nav>
  );
}

export default Nav;
