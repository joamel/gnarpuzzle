import React, { useState, useEffect, useRef } from 'react';
import { useChatMutation } from '../api/chat-mutation';
import { useChatQuery } from '../api/chat-query';
import socket from '../utils/socket';
import './Chat.css';

const Chat = ({ username, roomId = 'room1' }) => {
  const { data: initialChat } = useChatQuery(roomId);
  const [chat, setChat] = useState([]);
  const chatMutation = useChatMutation();
  const chatMessagesRef = useRef(null);

  // Uppdatera chat när initialChat ändras
  useEffect(() => {
    if (initialChat) {
      setChat(initialChat);
    }
  }, [initialChat]);

  // Auto-scroll to bottom when chat updates
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  // Scroll to bottom when chat changes
  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  // Lyssna på nya chatmeddelanden via socket
  useEffect(() => {
    const handleChatMessage = (message) => {
      setChat(prevChat => [...prevChat, message]);
    };

    const handleChatCleared = () => {
      setChat([]);
    };

    socket.on('chatMessage', handleChatMessage);
    socket.on('chatCleared', handleChatCleared);

    return () => {
      socket.off('chatMessage', handleChatMessage);
      socket.off('chatCleared', handleChatCleared);
    };
  }, []);

  const handleSendMessage = () => {
    const sender = username;
    const message = document.getElementById("chat-message")?.value;
    const sentTime = new Date().toISOString();
    
    if (message && message.trim()) {
      chatMutation.mutate({ sender, message, sentTime, roomId });
      document.getElementById("chat-message").value = "";
      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className='chat-container'>
      <div className='chat-header'>
        <h4 className='chat-title'>💬 Chat</h4>
      </div>
      
      {/* Chat messages */}
      <div className='chat-messages' ref={chatMessagesRef}>
        {chat && chat.length > 0 ? (
          chat.map((message, idx) => (
            <div key={idx} className={`chat-message ${
              message.username === 'System' ? 'system' : 
              (message.sender || message.username) === username ? 'own' : 'other'
            }`}>
              <div className='message-bubble'>
                <div className='message-content'>
                  {message.username !== 'System' && (
                    <span className='message-sender'>{message.sender || message.username}</span>
                  )}
                  <div className='message-text'>{message.message}</div>
                </div>
                <div className='message-timestamp'>
                  {(message.sentTime || message.timestamp) && 
                    new Date(message.sentTime || message.timestamp).toLocaleTimeString('sv-SE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className='no-messages'>
            <span>💭 Inga meddelanden än...</span>
          </div>
        )}
      </div>
      
      {/* Chat input */}
      <div className='chat-input-section'>
        <div className='input-container'>
          <textarea 
            id="chat-message" 
            rows={2} 
            placeholder="Skriv ett meddelande..."
            className='chat-input'
            onKeyPress={handleKeyPress}
          />
          <button 
            className='chat-send-button'
            onClick={handleSendMessage}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;