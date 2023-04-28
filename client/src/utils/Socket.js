import io from "socket.io-client";
const socket = io.connect("http://localhost:3001");
// const socket = io.connect("https://gnarpuzzle.adaptable.app");
export default socket;