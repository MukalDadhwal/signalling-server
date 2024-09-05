const WebSocket = require("ws");

const port = 8000;
// Create a WebSocket server
const wss = new WebSocket.Server({ port: port });

// Create an object to store the rooms and their associated clients
const rooms = {};

// Handle new WebSocket connections
wss.on("connection", (ws) => {
  console.log("New client connected");

  // Assign a room to the client (the client should send a message specifying the room)
  ws.on("message", (message) => {
    const data = JSON.parse(message); // Expecting JSON data for room management

    if (data.type === "join") {
      const room = data.room;
      if (!rooms[room]) {
        rooms[room] = []; // Create room if it doesn't exist
      }
      rooms[room].push(ws); // Add client to the room
      ws.room = room; // Track which room the client belongs to
      console.log(`Client joined room: ${room}`);
    }

    // Broadcast a message to everyone in the room except the sender
    if (data.type === "broadcast") {
      console.log("broadcast received");

      const room = data.room;

      if (rooms[room]) {
        rooms[room].forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            // console.log(data.msg);
            // client.send(`Message from room ${room}: ${messageToSend}`);

            if (data.msg === "offer") {
              console.log("inside offer");
              client.send(
                JSON.stringify({ type: "offer", msg: "a offer for you" })
              );
            }

            if (data.msg === "candidate") {
              console.log("inside offer");
              client.send(
                JSON.stringify({ type: "candidate", msg: "a offer for you" })
              );
            }

            if (data.msg == "answer") {
              console.log("inside offer");
              client.send(
                JSON.stringify({ type: "answer", msg: "a offer for you" })
              );
            }
          }
        });
      }
    }
  });

  // Handle client disconnect
  ws.on("close", () => {
    const room = ws.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter((client) => client !== ws);
      console.log(`Client disconnected from room: ${room}`);
    }
  });
});

console.log("WebSocket server running on port", port);
