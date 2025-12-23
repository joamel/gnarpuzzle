// API configuration that automatically detects environment

// Use localhost for development, production URL for deployed environment  
export const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001'
  : import.meta.env.VITE_API_URL || 'https://gnarp-backend.onrender.com';

export const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:3001' 
  : import.meta.env.VITE_SOCKET_URL || 'https://gnarp-backend.onrender.com';