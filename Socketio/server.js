const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const connectedUsers = new Map();

const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const getOnlineUsers = () => Array.from(connectedUsers.entries()).map(([id, name]) => ({ id, name }));
const emitPresence = () => {
  io.emit("online-count", connectedUsers.size);
  io.emit("online-users", getOnlineUsers());
};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.emit("system-message", {
    text: "Connected to chat server",
    time: getTime(),
  });

  socket.emit("online-users", getOnlineUsers());

  socket.on("join-chat", (username) => {
    const safeName = typeof username === "string" && username.trim() ? username.trim().slice(0, 20) : `Guest-${socket.id.slice(0, 4)}`;

    connectedUsers.set(socket.id, safeName);

    io.emit("system-message", {
      text: `${safeName} joined the chat`,
      time: getTime(),
    });

    emitPresence();
  });

  socket.on("send-message", (text) => {
    const sender = connectedUsers.get(socket.id) || `Guest-${socket.id.slice(0, 4)}`;
    const safeText = typeof text === "string" ? text.trim() : "";

    if (!safeText) {
      return;
    }

    io.emit("receive-message", {
      id: `${socket.id}-${Date.now()}`,
      senderId: socket.id,
      sender,
      text: safeText.slice(0, 500),
      time: getTime(),
    });
  });

  socket.on("typing", (isTyping) => {
    const sender = connectedUsers.get(socket.id);

    if (!sender) {
      return;
    }

    socket.broadcast.emit("user-typing", {
      id: socket.id,
      name: sender,
      isTyping: Boolean(isTyping),
    });
  });

  socket.on("disconnect", () => {
    const user = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);

    if (user) {
      io.emit("system-message", {
        text: `${user} left the chat`,
        time: getTime(),
      });

      socket.broadcast.emit("user-typing", {
        id: socket.id,
        name: user,
        isTyping: false,
      });
    }

    emitPresence();
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
<<<<<<< HEAD
});
=======
});
>>>>>>> d69a9698c1effa409589252315a41022e1bda660
