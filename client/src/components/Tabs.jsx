import React, { useState } from 'react';
import useSocketQuery from '../api/useSocketQuery';


const Tabs = () => {
    const [users, setUsers] = useState([]);
  // Use the hook to subscribe to the "chatMessage" event
  const { data: message } = useSocketQuery('chatMessage');

  // Use the hook to subscribe to the "userJoined" event
  const { data: user } = useSocketQuery('joinRoom');

  return (
    <div>
      <h1>Chat</h1>
      {message && <p>New message: {message}</p>}
      {user && <p>User joined: {user}</p>}
    </div>
  );
};

export default Tabs;