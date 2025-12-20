import { useQuery } from "@tanstack/react-query";

export const queryKey = ["participants"];

export const useParticipantsQuery = (options) => {
	return useQuery({
		queryKey,
		queryFn: async () => {
			// Get participants for all rooms
			const rooms = ['room1', 'room2', 'room3', 'room4'];
			const promises = rooms.map(roomId => 
				fetch(`${import.meta.env.VITE_API_URL}/participants/${roomId}`)
					.then(response => response.ok ? response.json() : Promise.reject(`Request failed for ${roomId}`))
			);
			
			const results = await Promise.all(promises);
			
			// Combine all room data into one object
			return results.reduce((acc, roomData) => ({ ...acc, ...roomData }), {});
		},
		...options,
	});
}