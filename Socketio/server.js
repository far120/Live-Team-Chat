const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || "")
//   .split(",")
//   .map((origin) => origin.trim())
//   .filter(Boolean);

// const isLocalOrigin = (origin) => {
//   try {
//     const parsedOrigin = new URL(origin);
//     return parsedOrigin.hostname === "localhost" || parsedOrigin.hostname === "127.0.0.1";
//   } catch (_error) {
//     return false;
//   }
// };

// const matchesWildcardOrigin = (origin, pattern) => {
//   if (!pattern.includes("*")) {
//     return origin === pattern;
//   }

//   try {
//     const originUrl = new URL(origin);
//     const patternUrl = new URL(pattern.replace("*.", "placeholder."));

//     if (originUrl.protocol !== patternUrl.protocol) {
//       return false;
//     }

//     const baseDomain = patternUrl.hostname.replace(/^placeholder\./, "");
//     return originUrl.hostname === baseDomain || originUrl.hostname.endsWith(`.${baseDomain}`);
//   } catch (_error) {
//     return false;
//   }
// };

// const isAllowedOrigin = (origin) => {
//   if (!origin || allowedOrigins.length === 0) {
//     return true;
//   }

//   if (allowedOrigins.some((pattern) => matchesWildcardOrigin(origin, pattern))) {
//     return true;
//   }

//   if (process.env.NODE_ENV !== "production" && isLocalOrigin(origin)) {
//     return true;
//   }

//   return false;
// };



// const io = new Server(server, {
//   cors: {
//     origin: (origin, callback) => {
//       if (isAllowedOrigin(origin)) {
//         callback(null, true);
//         return;
//       }

//       callback(new Error("Origin not allowed by CORS"));
//     },
//     methods: ["GET", "POST"],
//   },
// });


const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// app.get("/", (_req, res) => {
//   res.send("Socket.IO server is running");
// });

// app.get("/health", (_req, res) => {
//   res.status(200).json({ ok: true });
// });

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
  console.log("Server running on port " + PORT);
})

// server.listen(PORT, () => {
//   if (allowedOrigins.length) {
//     console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
//   } else {
//     console.log("Allowed origins: all (development mode)");
//   }
//   console.log(`Server running on port ${PORT}`);
// });
