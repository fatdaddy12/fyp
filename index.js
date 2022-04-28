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
        console.log('Player 2 wins');
        return 'Player 2 is the winner!';
    } else if (currentRoom.p2status == 'bust') {
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
};

function send_card(room, card) {
    io.to(room).emit("new card", card);
};

function find_room(id) {
    let room = users.find(item => item.id == id);
    if (room) {
        return room;
    } else {
        return null;
    };
};

let roomNames = [];

function get_room(roomName) {
    return rooms.find(item => item.roomName == roomName);
}

function get_host(roomName) {
    return get_room(roomName).p1.id;
}

function create_room(username, roomName, socket) {
    if (!roomNames.includes(roomName)) {
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
};

function init_game(roomName) {
    io.to(roomName).emit('start game');

    let p1card = draw_card();
    let p2card = draw_card();

    let currentRoom = get_room(roomName);

    send_card(roomName, p1card);
    send_card(roomName, p2card);

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
            io.to(roomName).emit('game end', determine_winner(roomName));
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
            io.to(roomName).emit('game end', determine_winner(roomName));
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

    console.log(currentRoom);
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
        io.to(roomName).emit('game end', determine_winner(roomName));
    } else {
        if (currentRoom.turn == 1) {
            io.to(currentRoom.p1.id).emit('turn');
        } else if ( currentRoom.turn == 2) {
            io.to(currentRoom.p2.id).emit('turn');
        }
    }

    console.log(currentRoom);
};

io.on('connection', (socket) => {
    socket.on("create room", ({username, roomName}) => {
/*         if (!rooms.includes(roomName)) {
            const user = {                                              //User objcet created on room join
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
        } else {
            io.to(socket.id).emit("already exists");
            
            console.log('room not created');
        } */

        create_room(username, roomName, socket);
    });

    socket.on("join room", ({username, roomName}) => { // add IF Room Exists
/*         let playersInRoom = io.of("/").adapter.rooms.get(roomName).size;
        if (playersInRoom < 2) {
            const user = {                                                  //User Object Created on room join
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

        //cb(messages[roomName]); */

        join_room(username, roomName, socket);
    });

    socket.on('start game', (roomName) => {
/*         io.to(roomName).emit('start game');

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
        io.to(host.id).emit("turn"); */

        init_game(roomName);
    });

    socket.on('hit', (roomName) => {
/*         console.log(`HIT: The room you are emitting from is ${room}`);
        var currentTurn = turn.find(item => item.room == room);

        let usersInRoom = [];
        users.forEach(function(item) {
            if (item.room == room) {
                usersInRoom.push(item);
            };
        });

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
            } else {
                io.to(usersInRoom[currentTurn.turn].id).emit('turn');
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
            } else {
                io.to(usersInRoom[currentTurn.turn].id).emit('turn');
            };

            if (score.find(item => item.room == room).p1status == 'playing') {
                turn.find(item => item.room == room).turn = 0;
            };
        }

        var p1score = score.find(item => item.room == room).player1
        var p2score = score.find(item => item.room == room).player2

        io.to(room).emit('hitted', p1score, p2score, currentTurn.turn); */

        hit(roomName);
    });

    socket.on('stand', (roomName) => {
/*         console.log(`STAND: The room you are emitting from is ${room}`);
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

        console.log(score.find(item => item.room == room)); */

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
    })

    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`);
        console.log( socket.client.conn.server.clientsCount + " users connected");

        let room = find_room(socket.id);
        if (room) {
            io.to(room.room).emit('logoff', socket.id);
        }
    });
});

server.listen(3000, "0.0.0.0", () => {
    console.log('Listening on *:3000');
});