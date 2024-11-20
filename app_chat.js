const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Stomp = require("stomp-client");
const room = require('./app/chat/controller/chatController');
const login = require('./app/chat/middleware/loginMiddleware');
Object.assign(global, { WebSocket: require('ws') });
let rooms = {'0': {users:new Set()}};

const app = express();
app.use(express.json());
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

/**
 * @param {{ roomId: string, content: string, user: string, timestamp: string }} msg
 */
function sendMessage(msg){
  if (''+msg.roomId === '0'){
    console.log("Sending to all")
    io.emit('receiveMessage', msg);
  } else {
    console.log("Sending to room "+msg.roomId)
    io.to(msg.roomId).emit('receiveMessage', msg);
  }

  const message = JSON.stringify(msg);
  try {
    client.publish(`/queue/game`, message, function (_err) {
      console.error("Could not send " + message)
    });
  }catch (e){
    console.error("ActiveMQ Err")
    console.error(e);
  }

}

room.registerRoomHttpApi(app, rooms, {send: sendMessage})
login.registerTokenHttpApi(app);
login.registerTokenMiddleware(io);


io.on('connection', (socket) => {
  console.log('A user connected:', socket.login);
  rooms['0'].users.add(socket.login);

  socket.on('joinRoom', (roomId) => {
    console.log(`User ${socket.id} joined room ${roomId}`);
    if (''+roomId === '0') return;
    if (rooms[roomId]) {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
    } else {
      socket.emit('error', 'Room does not exist');
    }
  });
  
  socket.on('sendMessage', (message) => {
    const { roomId, content } = message;
    if (''+roomId !== '0' && !rooms[roomId]) {
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
    rooms['0'].users.delete(socket.login);
  });
});

server.listen(4000, () => {
  console.log('Server listening on port 4000');
});