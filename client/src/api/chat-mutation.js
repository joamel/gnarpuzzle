import { useMutation } from "@tanstack/react-query";
import { queryClient } from "./query-client";
import { queryKey } from "./chat-query";
import socket from "../utils/socket";
import { API_BASE_URL } from '../config/api';

const path = `${API_BASE_URL}/chat`

export const useChatMutation = () => {
	// const queryKey = ['chatMessage']; // Replace with the actual query key used for fetching chat messages

  return useMutation({
    onMutate: (chatMessage) => {
			// Prevent any in-flight request from overwriting the optimistic update.
			queryClient.cancelQueries({ queryKey })
			// Perform an optimistic update.
			queryClient.setQueryData(queryKey, (old) => ([...(old ?? []), chatMessage]));
    },
		mutationFn: sendChatMessage,
				// Optional: onSuccess and onError callbacks
		onSuccess: () => {

		},
		onError: (error, variables, context) => {
      console.error('Error sending message:', error);
      // Rollback optimistic update if mutation fails
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKey, context.previousMessages);
      }
    },
		onSettled: () => {
			// Refetch to get fresh data from the server.
			queryClient.invalidateQueries(queryKey);
		}
	})
}

async function sendChatMessage(body) {
	const response = await fetch(path, {
	  method: 'POST',
	  headers: { "Content-Type": "application/json" },
	  body: JSON.stringify(body),
	});
  
	// if (!response.ok) {
	//   throw new Error('Network response was not ok');
	// }
  
	// return response.json();
  }