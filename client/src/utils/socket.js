import io from "socket.io-client";
import { SOCKET_URL } from '../config/api';

const socket = io.connect(SOCKET_URL);
export default socket;