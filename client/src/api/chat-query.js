import { useQuery } from "@tanstack/react-query";
import socket from "../utils/socket";
import { useState } from "react";
import { API_BASE_URL } from '../config/api';

export const queryKey = ["chat"];
const path = `${API_BASE_URL}/chat/`

export const useChatQuery = (roomId) => {
	return useQuery({
		queryKey,
		queryFn: () => fetchChatMessages(roomId),
		onSettled: () => {
			socket.on('chatMessage', message => {
				// Use queryClient to update the query data with the new message
				queryClient.setQueryData([queryKey], old => {
					return Array.isArray(old) ? [...old, message] : [message];
				});
				});
		},
		// Optional: This function is called when the query unmounts
		onInvalidate: () => {
			socket.off('chatMessage');
		}
	});
}

async function fetchChatMessages(roomId) {
	const response = await fetch(path + roomId);
	// if timeout loop gör om
	if (!response.ok) {
		throw new Error('Network response was not ok');
		}
	// Parse the JSON response body
    const data = await response.json();

	return data;
}