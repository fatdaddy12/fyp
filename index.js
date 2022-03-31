const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var cards = ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king']; //11 jack, 12 queen, 13 king
var suit = ['diamonds', 'hearts', 'spades', 'clubs'];

var players = [];
var turn = 0;

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

function next_turn() {
    io.to(players[turn].id).emit('turn');
}

io.on('connection', (socket) => {

    players.push(socket);
    //console.log(players);
    
    console.log(`${socket.id} connected`);
    console.log( socket.client.conn.server.clientsCount + " users connected");
    io.emit('logon', socket.id);

    if (players.length > 0) {
        io.to(players[turn].id).emit('turn');
    };

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg)
      });

    socket.on('hit', () => {
        turn++;
        if (turn > (players.length - 1)) {
            turn = 0;
        }
        var resultNum = cards[Math.floor(Math.random()*cards.length)];
        var resultSuit = suit[Math.floor(Math.random()*suit.length)];
        io.emit('hitted', resultNum, resultSuit);
        next_turn();
    })

    socket.on('connect', () => {
        io.emit('logon', socket.id);
    })

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
        console.log( socket.client.conn.server.clientsCount + " users connected");
        io.emit('logoff', socket.id);
    });
});

server.listen(3000, "0.0.0.0", () => {
    console.log('Listening on *:3000');
});