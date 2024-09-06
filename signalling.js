const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid"); // To generate unique IDs

const port = 9000;
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
      const clientId = uuidv4();
      const room = data.room;
      if (!rooms[room]) {
        rooms[room] = []; // Create room if it doesn't exist
      }
      rooms[room].push(ws); // Add client to the room
      ws.room = room; // Track which room the client belongs to
      ws.send(
        JSON.stringify({
          username: data.name,
          userId: clientId,
          roomId: data.room,
        })
      );
      console.log(`Client joined room: ${room} ${data.name} ${clientId}`);
    }

    // Broadcast a message to everyone in the room except the sender
    if (data.type === "broadcast") {
      const room = data.room;

      if (rooms[room]) {
        rooms[room].forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            if (data.msgType === "offer") {
              console.log("got an offer on server");
              client.send(JSON.stringify({ msgType: "offer", msg: data.msg }));
            }

            if (data.msgType === "candidate") {
              console.log("got a candidate on server");
              client.send(
                JSON.stringify({ msgType: "candidate", msg: data.msg })
              );
            }

            if (data.msgType == "answer") {
              console.log("answer", data.msg);
              console.log("got an answer on server");
              client.send(JSON.stringify({ msgType: "answer", msg: data.msg }));
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
