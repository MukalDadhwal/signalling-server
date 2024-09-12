const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid"); // To generate unique IDs
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.static(path.join(__dirname, "src")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const port = 9000;
// Create a WebSocket server
const wss = new WebSocket.Server({ server });

app.get("/join", (req, res) => {
  res.render("join");
});

app.post("/room", (req, res) => {
  var roomId = req.body.roomId;
  const username = req.body.username;
  const age = req.body.age;
  const gender = req.body.gender;

  if (!roomId) {
    roomId = req.body.genRoomId;
  }

  // ws.send(JSON.stringify({ type: "join", name: "prabsurat", room: "myroom" }));

  res.render("room", {
    roomId: roomId,
    username: username,
    age: age,
    gender: gender,
  });
});

// app.get("/room/:roomId", (req, res) => {
//   const roomId = req.params.roomId;

//   res.render("remote", { roomId: roomId });
// });

// Create an object to store the rooms and their associated clients
const rooms = {};

// Handle new WebSocket connections
wss.on("connection", (ws) => {
  console.log("New client connected");

  // Assign a room to the client (the client should send a message specifying the room)
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message); // Attempt to parse JSON

      // new user is joining the room
      if (data.type === "join") {
        const clientId = uuidv4();
        const room = data.room;
        if (!rooms[room]) {
          rooms[room] = []; // Create room if it doesn't exist
        }
        rooms[room].push({ wsClient: ws, userId: clientId }); // Add client to the room
        ws.room = room; // Track which room the client belongs to
        var randomNumber = Math.floor(Math.random() * 10) + 1;

        ws.send(
          JSON.stringify({
            userId: clientId,
            roomId: data.room,
            username: data.username,
            gender: data.gender,
            age: data.age,
            productivityScore: randomNumber,
          })
        );
        console.log(`Client joined room: ${room} ${data.name} ${clientId}`);
      }

      // Broadcast a message to everyone in the room except the sender
      if (data.type === "broadcast") {
        const room = data.room;

        if (rooms[room]) {
          rooms[room].forEach((client) => {
            if (
              client.wsClient !== ws &&
              client.wsClient.readyState === WebSocket.OPEN
            ) {
              if (data.msgType === "offer") {
                console.log("got an offer on server", data.msg);
                client.wsClient.send(
                  JSON.stringify({
                    msgType: "offer",
                    msg: data.msg,
                    roomId: room,
                    userId: client.userId,
                  })
                );
              }

              if (data.msgType === "candidate") {
                console.log("got a candidate on server");
                client.wsClient.send(
                  JSON.stringify({
                    msgType: "candidate",
                    roomId: room,
                    candidate: data.candidate,
                    sdpmid: data.sdpmid,
                    sdpmlineindex: data.sdpmlineindex,
                    userId: client.userId,
                  })
                );
              }

              if (data.msgType == "answer") {
                console.log("got an answer on server", data.msg);
                client.wsClient.send(
                  JSON.stringify({
                    msgType: "answer",
                    msg: data.msg,
                    roomId: room,
                    userId: client.userId,
                  })
                );
              }
            }
          });
        }
      }
    } catch (error) {
      console.error("Error parsing JSON:", error.message); // Handle any errors
    }
  });

  // Handle client disconnect
  ws.on("close", () => {
    const room = ws.room;
    if (room && rooms[room]) {
      delete rooms.room;
      console.log(`Client disconnected from room: ${room}`);
    }
  });
});

server.listen(port, () => {
  console.log("server is running on port", port);
});
