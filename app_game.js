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
    origin: 'http://localhost:8088',
    methods: ['GET', 'POST']
  }
});

server.listen(6666, () => {
  console.log('Server listening on port 6666');
});