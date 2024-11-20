const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Stomp = require("stomp-client");
const room = require('./app/chat/controller/chatController');
const login = require('./app/chat/middleware/loginMiddleware');
Object.assign(global, { WebSocket: require('ws') });
let rooms = {};

const app = express();
app.use(express.json());
const gameRoutes = require('./app/game/routes/game');
app.use('/game', gameRoutes);
const server = http.createServer(app);

server.listen(8088, () => {
  console.log('Server listening on port 8088');
});