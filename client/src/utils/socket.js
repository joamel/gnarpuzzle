import io from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

const socket = io.connect(SOCKET_URL);
export default socket;