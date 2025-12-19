import React, { useState, useEffect } from 'react';
import { useChatMutation } from '../api/chat-mutation';
import { useChatQuery } from '../api/chat-query';
import socket from '../utils/socket';
import './Chat.css';

const Chat = ({ username, roomId = 'room1' }) => {
  const { data: initialChat } = useChatQuery(roomId);
  const [chat, setChat] = useState([]);
  const chatMutation = useChatMutation();

  // Uppdatera chat när initialChat ändras
  useEffect(() => {
    if (initialChat) {
      setChat(initialChat);
    }
  }, [initialChat]);

  // Lyssna på nya chatmeddelanden via socket
  useEffect(() => {
    const handleChatMessage = (message) => {
      setChat(prevChat => [...prevChat, message]);
    };

    socket.on('chatMessage', handleChatMessage);

    return () => {
      socket.off('chatMessage', handleChatMessage);
    };
  }, []);

  const handleSendMessage = () => {
    const sender = username;
    const message = document.getElementById("chat-message")?.value;
    const sentTime = new Date().toISOString();
    
    if (message && message.trim()) {
      chatMutation.mutate({ sender, message, sentTime, roomId });
      document.getElementById("chat-message").value = "";
    }
  };

  return (
    <div className='chat-container'>
      <h4 className='chat-title'>Chat</h4>
      
      {/* Chat messages */}
      <div className='chat-messages'>
        {chat && chat.length > 0 ? (
          chat.map((message, idx) => (
            <div key={idx} className={`chat-message ${message.username === 'System' ? 'system' : ''}`}>
              <div>
                <span className='chat-message-sender'>{message.sender || message.username}:</span> {message.message}
              </div>
              <div className='chat-message-timestamp'>
                {(message.sentTime || message.timestamp) && 
                  (message.sentTime || message.timestamp).split("T")[1].split(".")[0]}
              </div>
            </div>
          ))
        ) : (
          <p className='no-messages'>Inga meddelanden än...</p>
        )}
      </div>
      
      {/* Chat input */}
      <div>
        <p className='chat-user-info'>
          <strong>Chattar som: {username}</strong>
        </p>
        <textarea 
          id="chat-message" 
          rows={3} 
          placeholder="Skriv ett meddelande..."
          className='chat-input'
        />
        <button 
          className='chat-send-button'
          onClick={handleSendMessage}
        >
          Skicka
        </button>
      </div>
    </div>
  );
};

export default Chat;