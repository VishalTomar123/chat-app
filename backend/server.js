require("dotenv").config();
const helmet = require("helmet");
const express = require("express");
const cors = require("cors");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const messageRoutes = require("./src/routes/messageRoutes");
const connectionRoutes =
require("./src/routes/connectionRoutes");

const {
  authLimiter,
  messageLimiter
} = require("./src/middleware/rateLimiter");

const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

app.use(cors());
// app.use(helmet());
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);
app.use(express.json());


const path = require("path");

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

app.get("/", (req, res) => {
  res.send("Chat App API Running");
});


app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageLimiter, messageRoutes);
app.use(
  "/api/connections",
  connectionRoutes
);

const PORT = process.env.PORT;

const http = require("http");
const { Server } = require("socket.io");
const db = require("./src/config/db");

const server = http.createServer(app);

const io = new Server(server, {
  
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.use((socket, next) => {

  try {

      const token = socket.handshake.auth.token;

      if (!token) {
          return socket.emit("unauthorized");;
      }

      const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
      );

      socket.user = decoded;

      next();

  } catch (err) {

      socket.emit("unauthorized");;

  }

});
const onlineUsers = {};

global.io = io;
global.onlineUsers = onlineUsers;

io.on("connection", (socket) => {

  // console.log("User Connected:", socket.id);
  
  // socket.on("join", (userId) => {
    
  //   onlineUsers[userId] = socket.id;
  //   io.emit("onlineUsers", Object.keys(onlineUsers));
  //   console.log("Online Users:", onlineUsers);

  // });

  const userId = socket.user.id;

  onlineUsers[userId] = socket.id;
 
  // For multiple device
  // onlineUsers[userId]=[ socket1, socket2
  //   ]

  io.emit( "onlineUsers", Object.keys(onlineUsers));

//   socket.on("deleteMessage", (data) => {

//     const receiverSocket =
//         onlineUsers[data.receiver_id];

//     if (receiverSocket) {

//         io.to(receiverSocket).emit(
//             "messageDeleted",
//             {
//                 messageId: data.messageId
//             }
//         );

//     }

// });

  // socket.on("sendMessage", (data) => {

  //   const receiverSocketId =
  //     onlineUsers[data.receiver_id];
  
  //   if (receiverSocketId) {
  
  //     io.to(receiverSocketId).emit(
  //       "receiveMessage",
  //       data
  //     );

  //     io.to(socket.id).emit(
  //       "messageDelivered",
  //       {
  //         tempId: data.tempId
  //       }
  //     );
  
  //   }
  
  // });
  socket.on("messageDelivered", async (data) => {

    await db.query(
        `
        UPDATE messages
        SET status='DELIVERED'
        WHERE id=?
        `,
        [data.messageId]
    );

    const senderSocket =
        onlineUsers[data.sender_id];

    if(senderSocket){

        io.to(senderSocket).emit(
            "messageDelivered",
            data
        );

    }

});

socket.on("typing", ({ receiver }) => {

  const receiverSocket =
      onlineUsers[receiver];

  if (receiverSocket) {

      io.to(receiverSocket).emit(
          "userTyping",
          socket.user.id
      );

  }

});

socket.on("disconnect", async () => {

  const userId = socket.user.id;

  delete onlineUsers[userId];

  await db.query(
      `
      UPDATE users
      SET last_seen = NOW()
      WHERE id=?
      `,
      [userId]
  );

  io.emit("onlineUsers", Object.keys(onlineUsers));

  // console.log("Disconnected", userId);

});

  // socket.on("disconnect", async () => {

  //   let disconnectedUserId = null;
  
  //   for (const userId in onlineUsers) {
  
  //     if (onlineUsers[userId] === socket.id) {
  
  //       disconnectedUserId = userId;
  
  //       delete onlineUsers[userId];
  
  //       break;
  //     }
  //   }
  
  //   if (disconnectedUserId) {
  
  //     await db.query(
  //       `
  //       UPDATE users
  //       SET last_seen = NOW()
  //       WHERE id = ?
  //       `,
  //       [disconnectedUserId]
  //     );
  
  //   }
  
  //   io.emit("onlineUsers", Object.keys(onlineUsers));
  
  //   console.log("User Disconnected");
  
  // });

  // socket.on("typing", (data) => {

  //   const receiverSocket =
  //     onlineUsers[data.receiver];
  
  //   if (receiverSocket) {
  
  //     io.to(receiverSocket).emit(
  //       "userTyping",
  //       data.sender
  //     );
  
  //   }
  
  // });

});

server.listen(PORT, () => {
  // console.log(`Server running on ${PORT}`);
});

const multer = require("multer");

app.use((err, req, res, next) => {

    if (err instanceof multer.MulterError) {

        return res.status(400).json({
            success: false,
            message: err.message,
        });

    }

    if (err) {

        return res.status(400).json({
            success: false,
            message: err.message,
        });

    }

    next();

});