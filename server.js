const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");

const PORT = process.env.SOCKET_PORT || 4000;

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Socket.IO server running");
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room (swapId)
  socket.on("joinRoom", ({ swapId }) => {
    if (swapId) {
      socket.join(swapId);
      console.log(`Socket ${socket.id} joined room ${swapId}`);
    }
  });

  // Handle sending a message
  socket.on("chatMessage", ({ swapId, message }) => {
    if (swapId && message) {
      // Broadcast to everyone in the room (except sender)
      socket.to(swapId).emit("chatMessage", message);
      console.log(`Message in room ${swapId}:`, message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
}); 