import { useMutation } from "@tanstack/react-query";
import { queryClient } from "./query-client";
import { queryKey } from "./participants-query";

const path = "http://localhost:3001/participants"

export const useParticipantsMutation = () => {
	return useMutation({
		onMutate: (participant) => {

			// Prevent any in-flight request from overwriting the optimistic update.
			queryClient.cancelQueries({ queryKey })
			// Perform an optimistic update - participants is an object with roomId keys
			queryClient.setQueryData(queryKey, (old) => {
				const oldData = old || {};
				const { roomId, username } = participant;
				return {
					...oldData,
					[roomId]: [...(oldData[roomId] || []), username]
				};
			});
		},
		mutationFn: async (body) => {

          const response = await fetch(path, {
            method: "POST",
            headers: { ["Content-Type"]: "application/json" },
            body: JSON.stringify(body)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
		},
		onSuccess: (data) => {

		},
		onError: (error) => {
			console.error('Mutation failed:', error);
		},
		onSettled: () => {

			// Refetch to get fresh data from the server.
			queryClient.invalidateQueries({ queryKey });
		}
	})
}