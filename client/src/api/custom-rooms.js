import { API_BASE_URL } from '../config/api';

// Create a new custom room
export const createCustomRoom = async (roomCode, createdBy) => {
  try {
    const response = await fetch(`${API_BASE_URL}/custom-rooms/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        createdBy
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Fel vid skapande av rum');
    }

    return data;
  } catch (error) {
    console.error('Error creating custom room:', error);
    throw error;
  }
};

// Join a custom room
export const joinCustomRoom = async (roomCode, username) => {
  try {
    const response = await fetch(`${API_BASE_URL}/custom-rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        username
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Fel vid anslutning till rum');
    }

    return data;
  } catch (error) {
    console.error('Error joining custom room:', error);
    throw error;
  }
};

// Get custom room information
export const getCustomRoomInfo = async (roomCode) => {
  try {
    const response = await fetch(`${API_BASE_URL}/custom-rooms/${roomCode}`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Rummet finns inte');
    }

    return data;
  } catch (error) {
    console.error('Error getting custom room info:', error);
    throw error;
  }
};

// Leave a custom room
export const leaveCustomRoom = async (roomCode, username) => {
  try {
    const response = await fetch(`${API_BASE_URL}/custom-rooms/leave`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomCode,
        username
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Fel vid utträde från rum');
    }

    return data;
  } catch (error) {
    console.error('Error leaving custom room:', error);
    throw error;
  }
};

// Get all active custom rooms
export const getActiveCustomRooms = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/custom-rooms`);
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Fel vid hämtning av rumslista');
    }

    return data;
  } catch (error) {
    console.error('Error getting active custom rooms:', error);
    throw error;
  }
};