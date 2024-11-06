const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('@stomp/stompjs');
const WebSocket = require('ws');
const ADMIN_KEY = 'votre_cle_admin';
let rooms = {};

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Setup STOMP for ActiveMQ connection
const stompClient = new Client({
  brokerURL: 'ws://localhost:61614/stomp',
  connectHeaders: {
    login: 'admin',
    passcode: 'admin'
  },
  debug: function (str) {
    console.log('STOMP: ' + str);
  },
  reconnectDelay: 5000,
  heartbeatIncoming: 4000,
  heartbeatOutgoing: 4000
});

// Connection to ActiveMQ
stompClient.activate();

// Route for creating a room
app.post('/createRoom', (req, res) => {
  const adminKey = req.headers['x-adminkey'];
  if (adminKey !== ADMIN_KEY) {
    return res.status(403).send('Unauthorized');
  } 
  
  const { users } = req.body;
  const roomId = `room_${Date.now()}`;
  rooms[roomId] = { users, messages: [] };

  res.status(200).json({ roomId });
});

// Route for gettings all users in a room
app.get('/getUsers/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const userLogin = req.headers['x-login'];

  if (!rooms[roomId]) {
    return res.status(404).send('Room not found');
  }
  if (!rooms[roomId].users.includes(userLogin)) {
    return res.status(403).send('Unauthorized');
  }
    
  res.status(200).json(rooms[roomId].users);
});

// Route for sending a message in a room
app.post('/send/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const { content, user } = req.body;
  const userLogin = req.headers['x-login'];
  const adminKey = req.headers['x-adminkey'];

  if (!rooms[roomId]) {
    return res.status(404).send('Room not found');
  }
  if (adminKey !== ADMIN_KEY && !rooms[roomId].users.includes(userLogin)) {
    return res.status(403).send('Unauthorized');
  }

  const message = { roomId, content, user, timestamp: new Date().toISOString() };
  rooms[roomId].messages.push(message);

  // Send message to ActiveMQ
  stompClient.publish({
    destination: `/topic/${roomId}`,
    body: JSON.stringify(message)
  });

  res.status(200).json({ roomId });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    } else {
      socket.emit('error', 'Room does not exist');
    }
  });
  
  socket.on('sendMessage', (message) => {
    const { roomId } = message;
    if (!rooms[roomId]) {
      socket.emit('error', 'Room does not exist');
    }

    io.to(roomId).emit('receiveMessage', message);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(4000, () => {
  console.log('Server listening on port 4000');
});
