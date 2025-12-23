// API configuration that automatically detects environment

// Use localhost for development, production URL for deployed environment  
export const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001'
  : import.meta.env.VITE_API_URL || 'https://gnarp-backend.onrender.com';

export const SOCKET_URL = import.meta.env.DEV
  ? 'http://localhost:3001' 
  : import.meta.env.VITE_SOCKET_URL || 'https://gnarp-backend.onrender.com';

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔧 Development API Configuration:');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('SOCKET_URL:', SOCKET_URL);
} else {
  console.log('🚀 Production API Configuration:');
  console.log('API_BASE_URL:', API_BASE_URL);
  console.log('SOCKET_URL:', SOCKET_URL);
  console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
}