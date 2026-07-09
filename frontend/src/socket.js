import { io } from "socket.io-client";

// const socket = io("http://localhost:5000");
const socket = io(import.meta.env.VITE_SOCKET_URL,{
    auth:{
        token:localStorage.getItem("token")
    }
});
socket.on("connect", () => {
    console.log("✅ Socket Connected:", socket.id);
});

socket.on("connect_error", (err) => {
    console.log("❌ Socket Error:", err.message);
});

socket.on("disconnect", () => {
    console.log("❌ Socket Disconnected");
});

export default socket;