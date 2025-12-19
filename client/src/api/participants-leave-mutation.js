import { useMutation } from "@tanstack/react-query";
import { queryClient } from "./query-client";
import { queryKey } from "./participants-query";

const path = "http://localhost:3001/participants"

export const useParticipantsLeaveMutation = () => {
	return useMutation({
		onMutate: (participant) => {

			// Prevent any in-flight request from overwriting the optimistic update.
			queryClient.cancelQueries({ queryKey })
			// Perform an optimistic update - remove user from participants
			queryClient.setQueryData(queryKey, (old) => {
				const oldData = old || {};
				const { roomId, username } = participant;
				return {
					...oldData,
					[roomId]: (oldData[roomId] || []).filter(user => user !== username)
				};
			});
		},
		mutationFn: async (body) => {

          const { roomId, username } = body;
          const response = await fetch(`${path}/${roomId}/${username}`, {
            method: "DELETE"
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
		},
		onSuccess: (data) => {

		},
		onError: (error) => {
			console.error('Leave mutation failed:', error);
		},
		onSettled: () => {

			// Refetch to get fresh data from the server.
			queryClient.invalidateQueries({ queryKey });
		}
	})
}