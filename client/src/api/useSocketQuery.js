// useSocketQuery.js
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import socket from '../utils/socket'; // Import the socket instance
import { queryClient } from "./query-client";

const useSocketQuery = (eventName, config) => {
  console.log('HELLO!', eventName, config)

  useEffect(() => {
    const handleEvent = (data) => {
      queryClient.setQueryData(eventName, data);
    };
    // console.log(handleEvent)
    // Subscribe to the specified event
    // console.log(eventName)
    socket.on(eventName, handleEvent);

    // Unsubscribe from the event when the component unmounts or the eventName changes
    return () => {
      socket.off(eventName, handleEvent);
    };
  }, [eventName, queryClient]);

  return useQuery({
    queryKey: eventName,
    queryFn: (data) => console.log("HAHAHHA"), //socket.emit(eventName, data),
    ...config,
    // Disable automatic refetching for this query
    enabled: false,
    initialData: null,
  });
};

export default useSocketQuery;
