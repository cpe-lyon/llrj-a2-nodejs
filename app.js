const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Stomp = require("stomp-client");
const room = require('./utils/room');
const login = require('./utils/login');
Object.assign(global, { WebSocket: require('ws') });
let rooms = {};

const app = express();
app.use(express.json());
const gameRoutes = require('./routes/game');
app.use('/game', gameRoutes);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:8080',
    methods: ['GET', 'POST']
  }
});

const client = new Stomp('localhost', 61613, 'admin', 'password');

client.connect(function(sessionId) {
  console.log('Connected to ActiveMQ with session ID:', sessionId);
});


// Connection to ActiveMQ
// stompClient.activate();

/**
 * @param {{ roomId: string, content: string, user: string, timestamp: string }} msg
 */
function sendMessage(msg){
  io.to(msg.roomId).emit('receiveMessage', msg);
  const message = JSON.stringify(msg);
  client.publish(`/queue/game`, message, function(_err) {
    console.error("Could not send "+message)
  });
}

room.registerRoomHttpApi(app, rooms, {send: sendMessage})
login.registerTokenHttpApi(app);
login.registerTokenMiddleware(io);


io.on('connection', (socket) => {
  console.log('A user connected:', socket.login);

  socket.on('joinRoom', (roomId) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    } else {
      socket.emit('error', 'Room does not exist');
    }
  });
  
  socket.on('sendMessage', (message) => {
    const { roomId, content } = message;
    if (!rooms[roomId]) {
      socket.emit('error', 'Room does not exist');
    }
    const toSendMsg = {
      roomId,
      content,
      user: socket.login,
      timestamp: new Date().getTime()
    }
    sendMessage(toSendMsg);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

server.listen(4000, () => {
  console.log('Server listening on port 4000');
});
