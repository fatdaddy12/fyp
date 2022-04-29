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
};

function get_users_in_room(roomName) {
    let usersInRoom = [];

    let currentRoom = rooms.find(item => item.roomName == roomName);

    usersInRoom.push(currentRoom.p1);
    usersInRoom.push(currentRoom.p2);

    io.to(roomName).emit("update users", usersInRoom);
};

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
};

function get_total_score(cards) {
    var totalScore = 0;

    cards.forEach(element => totalScore += element.value);

    return totalScore;
};

function determine_winner(roomName) {
    let currentRoom = get_room(roomName);
    var totalScore1 = get_total_score(currentRoom.p1cards);
    var totalScore2 = get_total_score(currentRoom.p2cards);

    if (currentRoom.p1status == 'bust') {
        return currentRoom.p2;
    } else if (currentRoom.p2status == 'bust') {
        return currentRoom.p1;
    } else if (totalScore1 <= 21 && totalScore1 > totalScore2) { //player1 is under or equal to 21 and score is higher than p2
        return currentRoom.p1;
    } else if (totalScore2 <= 21 && totalScore2 > totalScore1) { //player 2 under or equal to 21 and higher than p1
        return currentRoom.p2;
    } else if (totalScore1 == totalScore2) { //If their score is equal
        return 'draw';
    };
};

function send_card(room, card) {
    io.to(room).emit("new card", card);
};

function find_room(id) {
    let room = rooms.find(item => item.p1.id == id);
    if (!room) {
        room = rooms.find(item => item.p2.id == id);
    }

    return room;
};

let roomNames = [];

function get_room(roomName) {
    return rooms.find(item => item.roomName == roomName);
}

function get_host(roomName) {
    return get_room(roomName).p1.id;
}

function create_room(username, roomName, socket) {
    if (!io.of("/").adapter.rooms.get(roomName)) {
        const user = {
            username: username,
            id: socket.id
        };

        const room = {
            roomName: roomName,
            p1: user,
            p2: null,
            p1cards: [],
            p2cards: [],
            p1status: 'playing',
            p2status: 'playing',
            p1connection: 'connected',
            p2connection: 'none',
            gameStatus: 'lobby',
            turn: 1
        };

        users.push(user);
        hosts.push(user); //remove
        roomNames.push(roomName);
        rooms.push(room);
        socket.join(roomName);
        io.to(roomName).emit("room created", roomName);
        get_users_in_room(roomName);
    } else {
        io.to(socket.id).emit("already exists");
    };
};

function join_room(username, roomName, socket) {
    if (io.of("/").adapter.rooms.get(roomName)) { 
        const playersInRoom = io.of("/").adapter.rooms.get(roomName).size;

        if (playersInRoom < 2) {
            const user = {
                username: username,
                id: socket.id
            };

            let joiningRoom = get_room(roomName);

            joiningRoom.p2 = user;
            joiningRoom.p2connection = 'connected'

            users.push(user);
            joiners.push(user); //remove
            socket.join(roomName);
            io.to(roomName).emit("room joined", roomName);
            io.to(joiningRoom.p1.id).emit("ready to begin")
            get_users_in_room(roomName);
        } else {
            io.to(socket.id).emit("session full");
        }
    } else {
        io.to(socket.id).emit("doesnt exist");
    }

};

function init_game(roomName) {
    io.to(roomName).emit('start game');

    let p1card = draw_card();
    let p2card = draw_card();

    let currentRoom = get_room(roomName);

    send_card(roomName, p1card);
    send_card(roomName, p2card);

    currentRoom.gameStatus = 'playing';
    currentRoom.p1cards.push(p1card);
    currentRoom.p2cards.push(p2card);

    var p1score = currentRoom.p1cards;
    var p2score = currentRoom.p2cards;

    let currentTurn = currentRoom.turn;

    io.to(roomName).emit('hitted', p1score, p2score, currentTurn);

    let host = get_host(roomName);
    io.to(host).emit("turn");
};

function hit(roomName) {
    console.log(`HIT: The room you are emitting from is ${roomName}`);
    let currentRoom = get_room(roomName);
    let currentTurn = currentRoom.turn;

    if (currentTurn == 1) { //If player 1 turn
        var totalScore = get_total_score(currentRoom.p1cards);
        let card = draw_card(totalScore);
        send_card(roomName, card);
        currentRoom.p1cards.push(card);

        //Are they bust?
        totalScore = get_total_score(currentRoom.p1cards);
        if (totalScore > 21) {
            currentRoom.p1status = 'bust';
            //io.to(roomName).emit('game end', determine_winner(roomName));
            end_game(roomName);
        }

        if (currentRoom.p2status == 'playing') {
            currentRoom.turn ++;
            io.to(currentRoom.p2.id).emit('turn');
        } else {
            io.to(currentRoom.p1.id).emit('turn');
        }
        
    } else if (currentTurn == 2) { //If player 2 turn
        var totalScore = get_total_score(currentRoom.p2cards);
        let card = draw_card(totalScore)
        send_card(roomName, card);
        currentRoom.p2cards.push(card);

        //Are they bust?
        totalScore = get_total_score(currentRoom.p2cards);
        if (totalScore > 21) {
            console.log('P2 bust');
            currentRoom.p2status = 'bust';
            //io.to(roomName).emit('game end', determine_winner(roomName));
            end_game(roomName);
        }

        if (currentRoom.p1status == 'playing') {
            currentRoom.turn = 1;
            io.to(currentRoom.p1.id).emit('turn');
        } else {
            io.to(currentRoom.p2.id).emit('turn');
        }
    }

    let p1score = currentRoom.p1cards;
    let p2score = currentRoom.p2cards;

    io.to(roomName).emit('hitted', p1score, p2score, currentTurn);

    //console.log(currentRoom);
};

function stand(roomName) {
    console.log(`STAND: The room you are emitting from is ${roomName}`);
    let currentRoom = get_room(roomName);
    let currentTurn = currentRoom.turn;

    if (currentTurn == 1) { // and if stnad
        if (currentRoom.p2status == 'playing') {
            currentRoom.turn ++;
        };

        currentRoom.p1status = 'stand';
    } else if (currentTurn == 2) {
        if (currentRoom.p1status == 'playing') {
            currentRoom.turn = 1;
        };

        currentRoom.p2status = 'stand';
    };

    //io.to(roomName).emit('stood');

    if (currentRoom.p1status == 'stand' && currentRoom.p2status == 'stand') {
        //io.to(roomName).emit('game end', determine_winner(roomName));
        end_game(roomName);
    } else {
        if (currentRoom.turn == 1) {
            io.to(currentRoom.p1.id).emit('turn');
        } else if ( currentRoom.turn == 2) {
            io.to(currentRoom.p2.id).emit('turn');
        }
    }

    //console.log(currentRoom);
};

function end_game(roomName) {
    let winner = determine_winner(roomName);
    let currentRoom = get_room(roomName);

    let p1 = currentRoom.p1.id;
    let p2 = currentRoom.p2.id;

    if (p1 == winner.id) {
        io.to(p1).emit('winner');
        io.to(p2).emit('loser');
    } else if (p2 == winner.id) {
        io.to(p2).emit('winner');
        io.to(p1).emit('loser');
    } else {
        io.to(roomName).emit('draw');
    }
    //io.to(roomName).emit('game end', determine_winner(roomName));

    io.socketsLeave(roomName);

    let currentRoomIndex = rooms.findIndex(item => item.roomName == roomName);
    rooms.splice(currentRoomIndex);

    console.log('Rooms Array');
    console.log(rooms);
    console.log('Rooms in server');
    console.log(io.of("/").adapter.rooms.get(roomName));
}

io.on('connection', (socket) => {
    socket.on("create room", ({username, roomName}) => {
        create_room(username, roomName, socket);
    });

    socket.on("join room", ({username, roomName}) => { // add IF Room Exists
        join_room(username, roomName, socket);
    });

    socket.on('start game', (roomName) => {
        init_game(roomName);
    });

    socket.on('hit', (roomName) => {
        hit(roomName);
    });

    socket.on('stand', (roomName) => {
        stand(roomName);
    });

    players.push(socket);
    
    console.log(`${socket.id} connected`);
    console.log( socket.client.conn.server.clientsCount + " users connected");
    io.emit('logon', socket.id);

    socket.on('chat message', (msg, username) => {
        io.emit('chat message', msg, username)
      });

    socket.on('connect', () => {
        io.emit('logon', socket.id);

        let room = find_room(socket.id);

        if (room) {
            socket.join(room.roomName);
            io.to(socket.id).emit('start game');
        }
    });

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
        console.log( socket.client.conn.server.clientsCount + " users connected");

        let room = find_room(socket.id);
        if (room) {
            io.to(room.roomName).emit('logoff', socket.id);
        }
    });
});

server.listen(3000, () => {
    console.log('Listening on *:3000');
});