import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from '../config/api';

export const queryKey = ["participants"];

export const useParticipantsQuery = (options) => {
	return useQuery({
		queryKey,
		queryFn: async () => {
			// Get participants for all rooms
			const rooms = ['room1', 'room2', 'room3', 'room4'];
			const promises = rooms.map(roomId => 
				fetch(`${API_BASE_URL}/participants/${roomId}`)
					.then(response => response.ok ? response.json() : Promise.reject(`Request failed for ${roomId}`))
			);
			
			const results = await Promise.all(promises);
			
			// Combine all room data into one object
			return results.reduce((acc, roomData) => ({ ...acc, ...roomData }), {});
		},
		...options,
	});
}