const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log(`${socket.id} connected`);

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg)
      });

    socket.on('hit', () => {
        io.emit('hitted', (Math.random() * 10))
    })

    socket.on('connect', () => {
        io.emit('logon');
    })

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
        io.emit('logoff');
    });
});

server.listen(3000, () => {
    console.log('Listening on *:3000');
});