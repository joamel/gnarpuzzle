// import { useMutation } from "@tanstack/react-query";
// import { queryClient } from "./query-client";
// import { queryKey } from "./chat-query";

// const path = "/api/chat"

// export const useChatMutation = () => {
// 	return useMutation({
// 		onMutate: (chatMessage) => {
// 			// Prevent any in-flight request from overwriting the optimistic update.
// 			queryClient.cancelQueries({ queryKey })
// 			// Perform an optimistic update.
// 			queryClient.setQueryData(queryKey, (old) => ([...(old ?? []), chatMessage]));
// 		},
// 		mutationFn: async (body) => {
//           await fetch(path, {
//             method: "POST",
//             headers: { ["Content-Type"]: "application/json" },
//             body: JSON.stringify(body)
//           });
// 		},
// 		onSettled: () => {
// 			// Refetch to get fresh data from the server.
// 			queryClient.invalidateQueries({ queryKey });
// 		}
// 	})
// }