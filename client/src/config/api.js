// API configuration that automatically detects environment
const isDevelopment = import.meta.env.DEV;

// Use localhost for development, production URL for deployed environment  
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001'
  : import.meta.env.VITE_API_URL || 'https://gnarp-backend.onrender.com';

const SOCKET_URL = isDevelopment
  ? 'http://localhost:3001' 
  : import.meta.env.VITE_SOCKET_URL || 'https://gnarp-backend.onrender.com';

export { API_BASE_URL, SOCKET_URL };