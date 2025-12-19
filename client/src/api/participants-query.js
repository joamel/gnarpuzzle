import { useQuery } from "@tanstack/react-query";

export const queryKey = ["participants"];
const path = "http://localhost:3001/participants";

export const useParticipantsQuery = (options) => {
	return useQuery({
		queryKey,
		queryFn: () =>
			fetch(path)
				.then((response) => response.ok ? response.json() : Promise.reject("Request failed.")),
		...options,
	});
}