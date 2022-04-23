const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const internal = require('stream');
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

function draw_card(totalScore = 0) {
    var resultNum = cards[Math.floor(Math.random()*cards.length)];
    var resultSuit = suit[Math.floor(Math.random()*suit.length)];
    var value = 0;

    //console.log(totalScore);

    if (resultNum == 'ace' && totalScore < 10) {
        value = 11; //Unless it would take them over 21
    } else if (resultNum == 'ace' && totalScore >= 10) {
        value = 1;
    } else if (resultNum == 'jack' || resultNum == 'queen' || resultNum == 'king') {
        value = 10;
    } else {
        value = resultNum;
    }

    var card = {
        resultNum: resultNum,
        resultSuit: resultSuit,
        value: value
    };

    return card;
}

function get_total_score(cards) {
    var totalScore = 0;

    cards.forEach(element => totalScore += element.value);

    return totalScore;
}

function determine_winner(room) {
    var totalScore1 = get_total_score(score.find(item => item.room == room).player1)
    var totalScore2 = get_total_score(score.find(item => item.room == room).player2)

    if (score.find(item => item.room == room).p1status == 'bust') {
        console.log('Player 2 wins');
        return 'Player 2 is the winner!';
    } else if (score.find(item => item.room == room).p2status == 'bust') {
        console.log('Player 1 wins');
        return 'Player 1 is the winner!';
    } else if (totalScore1 <= 21 && totalScore1 > totalScore2) { //player1 is under or equal to 21 and score is higher than p2
        console.log('Player 1 wins');
        return 'Player 1 is the winner!';
    } else if (totalScore2 <= 21 && totalScore2 > totalScore1) { //player 2 under or equal to 21 and higher than p1
        console.log('Player 2 wins');
        return 'Player 2 is the winner!';
    } else if (totalScore1 == totalScore2) { //If their score is equal
        console.log('Draw!')
        return "It's a draw!";
    };
}

function send_card(room, card) {
    io.to(room).emit("new card", card);
}

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

    socket.on("join room", ({username, roomName}) => { // add IF Room Exists
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
            player2: [],
            p1status: 'playing',
            p2status: 'playing'
        };

        let p1card = draw_card();
        let p2card = draw_card();

        send_card(roomName, p1card);
        send_card(roomName, p2card);

        newScore.player1.push(p1card);
        newScore.player2.push(p2card);

        score.push(newScore);

        var p1score = score.find(item => item.room == roomName).player1
        var p2score = score.find(item => item.room == roomName).player2

        io.to(roomName).emit('hitted', p1score, p2score, 0);

        let host = hosts.find((item) => item.room == roomName);
        io.to(host.id).emit("turn");

    });

    socket.on('hit', (room) => {
        console.log(`HIT: The room you are emitting from is ${room}`);
        var currentTurn = turn.find(item => item.room == room);

        //console.log(currentTurn);

        //If either player Bust = Other player wins
        //If Both Stand = highest score wins
        //If Both Stand and Equal = Draw

        if (currentTurn.turn == 0) { //If player 1 turn
            var totalScore = get_total_score(score.find(item => item.room == room).player1);
            let card = draw_card(totalScore)
            send_card(room, card);
            score.find(item => item.room == room).player1.push(card);

            //Are they bust?
            totalScore = get_total_score(score.find(item => item.room == room).player1);
            if (totalScore > 21) {
                console.log('P1 bust');
                score.find(item => item.room == room).p1status = 'bust';
                io.to(room).emit('game end', determine_winner(room));
            }

            if (score.find(item => item.room == room).p2status == 'playing') {
                turn.find(item => item.room == room).turn ++;
            }
            
        } else if (currentTurn.turn == 1) { //If player 2 turn
            var totalScore = get_total_score(score.find(item => item.room == room).player2);
            let card = draw_card(totalScore)
            send_card(room, card);
            score.find(item => item.room == room).player2.push(card);

            //Are they bust?
            totalScore = get_total_score(score.find(item => item.room == room).player2);
            if (totalScore > 21) {
                console.log('P2 bust');
                score.find(item => item.room == room).p2status = 'bust';
                io.to(room).emit('game end', determine_winner(room));
            };

            if (score.find(item => item.room == room).p1status == 'playing') {
                turn.find(item => item.room == room).turn = 0;
            }
        }

        var p1score = score.find(item => item.room == room).player1
        var p2score = score.find(item => item.room == room).player2

        io.to(room).emit('hitted', p1score, p2score, currentTurn.turn);

        let usersInRoom = [];
        users.forEach(function(item) {
            if (item.room == room) {
                usersInRoom.push(item);
            };
        });

        console.log(usersInRoom[currentTurn.turn]);
        console.log(currentTurn);
        io.to(usersInRoom[currentTurn.turn].id).emit('turn', currentTurn.turn);
    });

    socket.on('stand', (room) => {
        console.log(`STAND: The room you are emitting from is ${room}`);
        var currentTurn = turn.find(item => item.room == room);

        if (currentTurn.turn == 0) { // and if stnad
            if (score.find(item => item.room == room).p2status == 'playing') {
                turn.find(item => item.room == room).turn ++;
            };

            score.find(item => item.room == room).p1status = 'stand';
        } else if (currentTurn.turn == 1) {
            if (score.find(item => item.room == room).p1status == 'playing') {
                turn.find(item => item.room == room).turn = 0;
            };

            score.find(item => item.room == room).p2status = 'stand';
        };

        io.to(room).emit('stood');

        let usersInRoom = [];
        users.forEach(function(item) {
            if (item.room == room) {
                usersInRoom.push(item);
            };
        });

        if (score.find(item => item.room == room).p1status == 'stand' && score.find(item => item.room == room).p2status == 'stand') {
            //determine_winner(room);
            io.to(room).emit('game end', determine_winner(room));
        } else {
            io.to(usersInRoom[currentTurn.turn].id).emit('turn');
        }

        console.log(score.find(item => item.room == room));
    });

    players.push(socket);
    
    console.log(`${socket.id} connected`);
    console.log( socket.client.conn.server.clientsCount + " users connected");
    io.emit('logon', socket.id);

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