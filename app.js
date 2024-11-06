const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const amqplib = require('amqplib');
let channel;
const adminKey = "YOUR_ADMIN_KEY"; // replace with your actual key
const rooms = {}; // Structure to store rooms

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Setup rabbitMQ connection
async function setupRabbitMQ() {
  const connection = await amqplib.connect('amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertExchange('chatExchange', 'fanout', { durable: false });
}

setupRabbitMQ().catch(console.error);

function authenticateAdmin(req, res, next) {
  if (req.headers['x-adminkey'] !== adminKey) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

function authenticateUser(req, res, next) {
  const user = req.headers['x-login'];
  if (!user) {
    return res.status(403).json({ error: 'User not authenticated' });
  }
  req.user = user;
  next();
}

//Route for creating a room
app.post('/createRoom', authenticateAdmin, (req, res) => {
  const { users } = req.body;
  const roomId = `room_${Date.now()}`;
  rooms[roomId] = users;
  res.json({ roomId });
});

//Route for gettings all users in a room
app.get('/getUsers/:roomId', authenticateUser, (req, res) => {
  const roomId = req.params.roomId;
  const users = rooms[roomId];
  if (users) {
    res.json(users);
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

//Route for sending a message in a room
app.post('/send/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { content, user, timestamp } = req.body;

  if (!rooms[roomId] || !rooms[roomId].includes(user)) {
    return res.status(404).json({ error: 'Room not found or user not authorized' });
  }

  const message = { roomId, content, user, timestamp };
  io.to(roomId).emit('receiveMessage', message);

  // Publish to RabbitMQ
  if (channel) {
    channel.publish('chatExchange', '', Buffer.from(JSON.stringify(message)));
  }

  res.json({ success: true });
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

  socket.on('sendMessage', ({ roomId, message }) => {
    if (rooms[roomId]) {
      io.to(roomId).emit('receiveMessage', message);
    } else {
      socket.emit('error', 'Room does not exist');
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});
