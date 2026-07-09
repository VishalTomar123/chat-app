import { io } from "socket.io-client";

// const socket = io("http://localhost:5000");
const socket = io(import.meta.env.VITE_SOCKET_URL,{
    auth:{
        token:localStorage.getItem("token")
    }
});

export default socket;