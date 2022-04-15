const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var cards = ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king'];
var suit = ['diamonds', 'hearts', 'spades', 'clubs'];

var players = [];
var turn = [];

let users = [];
let hosts = [];
let joiners = [];
let rooms = [];
let score = [];

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/game', (req, res) => {
    res.sendFile(__dirname + '/game.html');
});

function next_turn() {
    //io.to(players[turn].id).emit('turn');

    //if turn  = 0
    turn.find([roomName])

    let host = hosts.find((item) => item.room == roomName);
    io.to(host.id).emit("turn")

    //else 
    let joiner = joiners.find((item) => item.room == roomName);
    io.to(joiner.id).emit("turn")
}

function get_users_in_room(users, roomName) {
    let usersInRoom = [];

    users.forEach(function(user) {
        if (user.room == roomName) {
            usersInRoom.push(user);
        }
    })

    io.to(roomName).emit("update users", usersInRoom);
}

function draw_card() {
    var resultNum = cards[Math.floor(Math.random()*cards.length)];
    var resultSuit = suit[Math.floor(Math.random()*suit.length)];

    var card = {
        resultNum: resultNum,
        resultSuit: resultSuit
    };

    return card;
}

//brainwave: store scores in array with room ID
io.on('connection', (socket) => {
    socket.on("create room", ({username, roomName}) => {
        if (!rooms.includes(roomName)) {
            const user = {
                username: username,
                id: socket.id,
                room: roomName
            };
    
            users.push(user);
            hosts.push(user);
            rooms.push(roomName);
    
            socket.join(roomName);
    
            io.to(roomName).emit("room created", roomName);
    
            get_users_in_room(users, roomName);

            //console.log('room created');
            //console.log(rooms);
            //cb(messages[roomName]);
        } else {
            io.to(socket.id).emit("already exists");
            
            console.log('room not created');
        }
    });

    socket.on("join room", ({username, roomName}) => {
        let playersInRoom = io.of("/").adapter.rooms.get(roomName).size;
        if (playersInRoom < 2) {
            const user = {
                username: username,
                id: socket.id,
                room: roomName
            };
    
            users.push(user);
            joiners.push(user);
    
            socket.join(roomName);
    
            //console.log(playersInRoom);
    
            io.to(roomName).emit("room joined", roomName);
    
            get_users_in_room(users, roomName);
    
            let host = hosts.find((item) => item.room == roomName);
            io.to(host.id).emit("ready to begin")
        } else {
            io.to(socket.id).emit("session full");
        }

        
        //cb(messages[roomName]);
    });

    socket.on('start game', (roomName) => {
        io.to(roomName).emit('start game');

        let newTurn = {
            room: roomName,
            turn: 0
        }

        turn.push(newTurn);

        newScore = {
            room: roomName,
            player1: [],
            player2: []
        };

        newScore.player1.push(draw_card());
        newScore.player1.push(draw_card());
        newScore.player2.push(draw_card());
        newScore.player2.push(draw_card());

        score.push(newScore);

        var p1score = score.find(item => item.room == roomName).player1
        var p2score = score.find(item => item.room == roomName).player2

        io.to(roomName).emit('hitted', p1score, p2score);

        console.log(score);

        let host = hosts.find((item) => item.room == roomName);
            io.to(host.id).emit("turn")

        //Each player starts with 2 cards
        //One card of other player revealed
    })

    socket.on('hit', (room) => {
        var currentTurn = turn.findIndex(item => item.room == room);

        if (turn[currentTurn].turn == 0) {
            score.find(item => item.room == room).player1.push(draw_card());
            turn[currentTurn].turn ++;
        } else {
            score.find(item => item.room == room).player2.push(draw_card());
            turn[currentTurn].turn = 0;
        }

        //console.log('update');
        //console.log(turn);

        //var resultNum = cards[Math.floor(Math.random()*cards.length)];
        //var resultSuit = suit[Math.floor(Math.random()*suit.length)];

        //score.find(item => item.room == room).player1.push(draw_card());

        var p1score = score.find(item => item.room == room).player1
        var p2score = score.find(item => item.room == room).player2
        console.log('Player 1');
        console.log(score.find(item => item.room == room).player1);
        console.log('Player 2');
        console.log(score.find(item => item.room == room).player2);

        io.to(room).emit('hitted', p1score, p2score);

        io.to(users[turn[currentTurn].turn].id).emit('turn');

        //next_turn();
    })

    players.push(socket);
    
    console.log(`${socket.id} connected`);
    console.log( socket.client.conn.server.clientsCount + " users connected");
    io.emit('logon', socket.id);

    //if (players.length > 0) {
    //    io.to(players[turn].id).emit('turn');
    //};

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg)
      });

    socket.on('connect', () => {
        io.emit('logon', socket.id);
    })

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
        console.log( socket.client.conn.server.clientsCount + " users connected");
        io.emit('logoff', socket.id);

        //temp
        //turn = 0;
        //next_turn();
    });
});

server.listen(3000, "0.0.0.0", () => {
    console.log('Listening on *:3000');
});