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
let users = [];
let rooms = [];

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

function draw_card(totalScore = 0) {
    var resultNum = cards[Math.floor(Math.random()*cards.length)];
    var resultSuit = suit[Math.floor(Math.random()*suit.length)];
    var value = 0;

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

    console.log(card);

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
    } else if (totalScore1 <= 21 && totalScore1 > totalScore2) {
        return currentRoom.p1;
    } else if (totalScore2 <= 21 && totalScore2 > totalScore1) {
        return currentRoom.p2;
    } else if (totalScore1 == totalScore2) {
        return 'draw';
    };
};

function send_card(room, card, currentTurn) {
    io.to(room.roomName).emit("new card", card, currentTurn);
    //io.to(room).emit("new card", card);
};

function find_room(id) {
    let room = rooms.find(item => item.p1.id == id);
    if (!room && rooms.find(item => item.p2)) {
        room = rooms.find(item => item.p2.id == id);
        if (!room) {
            return null;
        }
    }

    return room;
};

let roomNames = [];

function get_room(roomName) {
    return rooms.find(item => item.roomName == roomName);
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
        roomNames.push(roomName);
        rooms.push(room);
        socket.join(roomName);
        io.to(roomName).emit("room created", roomName);
        //get_users_in_room(roomName);
    } else {
        io.to(socket.id).emit("already exists");
    };
};

function join_room(username, roomName, socket) {
    let room = get_room(roomName);
    if (room) { 

        if (!room.p2) {
            const user = {
                username: username,
                id: socket.id
            };

            let joiningRoom = get_room(roomName);

            joiningRoom.p2 = user;
            joiningRoom.p2connection = 'connected'

            users.push(user);
            //joiners.push(user); //remove
            socket.join(roomName);
            io.to(roomName).emit("room joined", roomName, joiningRoom.p1.username);
            io.to(joiningRoom.p1.id).emit("ready to begin", username);
            //get_users_in_room(roomName);
        } else {
            io.to(socket.id).emit("session full");
        }
        
    } else {
        io.to(socket.id).emit("doesnt exist");
    }

};

function init_game(roomName) {
    io.to(roomName).emit('start game', roomName);
    let currentRoom = get_room(roomName);

    let p1card = draw_card();
    let p2card = draw_card();

    while (p1card == p2card) {
        p2card = draw_card();
    }

    send_card(currentRoom, p1card, 1);
    send_card(currentRoom, p2card, 2);

    currentRoom.gameStatus = 'playing';
    currentRoom.p1cards.push(p1card);
    currentRoom.p2cards.push(p2card);

    //io.to(roomName).emit('hitted', p1score, p2score, currentTurn);

    io.to(currentRoom.p1.id).emit("save", currentRoom.p1.id);
    io.to(currentRoom.p2.id).emit("save", currentRoom.p2.id);

    io.to(currentRoom.p1.id).emit("turn");

    console.log(rooms);
};

function send_cards(p1score, p2score, currentRoom, player, id, host, currentTurn) {
    if (player == 1){
        io.to(currentRoom.p1.id).emit('rejoined', p1score, p2score, currentRoom, id, host, currentTurn);
    } else {
        io.to(currentRoom.p2.id).emit('rejoined', p2score, p1score, currentRoom, id, host, currentTurn);
    }
}

function hit(roomName, id) {
    console.log(`HIT: The room you are emitting from is ${roomName}`);
    let currentRoom = get_room(roomName);
    if (currentRoom) {
        let currentTurn = currentRoom.turn;

        if (currentTurn == 1) { //If player 1 turn
            var totalScore = get_total_score(currentRoom.p1cards);
            let card = draw_card(totalScore);
            while ((currentRoom.p1cards.find(item => item.resultNum == card.resultNum && item.resultSuit == card.resultSuit)) || (currentRoom.p2cards.find(item => item.resultNum == card.resultNum && item.resultSuit == card.resultSuit))) {
                console.log('repeat card');
                card = draw_card(totalScore);
            }
            send_card(currentRoom, card, currentTurn);
            currentRoom.p1cards.push(card);
    
            //Are they bust?
            totalScore = get_total_score(currentRoom.p1cards);
            if (totalScore > 21) {
                currentRoom.p1status = 'bust';
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
            while ((currentRoom.p1cards.find(item => item.resultNum == card.resultNum && item.resultSuit == card.resultSuit)) || (currentRoom.p2cards.find(item => item.resultNum == card.resultNum && item.resultSuit == card.resultSuit))) {
                console.log('repeat card');
                card = draw_card(totalScore);
            }
            send_card(currentRoom, card, currentTurn);
            currentRoom.p2cards.push(card);
    
            //Are they bust?
            totalScore = get_total_score(currentRoom.p2cards);
            if (totalScore > 21) {
                console.log('P2 bust');
                currentRoom.p2status = 'bust';
                end_game(roomName);
            }
    
            if (currentRoom.p1status == 'playing') {
                currentRoom.turn = 1;
                io.to(currentRoom.p1.id).emit('turn');
            } else {
                io.to(currentRoom.p2.id).emit('turn');
            }
        }
    } else {
        io.to(id).emit('no longer exists');
    }
};

function stand(roomName) {
    console.log(`STAND: The room you are emitting from is ${roomName}`);
    let currentRoom = get_room(roomName);
    let currentTurn = currentRoom.turn;

    if (currentTurn == 1) {
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

    if (currentRoom.p1status == 'stand' && currentRoom.p2status == 'stand') {
        end_game(roomName);
    } else {
        if (currentRoom.turn == 1) {
            io.to(currentRoom.p1.id).emit('turn');
        } else if ( currentRoom.turn == 2) {
            io.to(currentRoom.p2.id).emit('turn');
        }
    }

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

    io.socketsLeave(roomName);

    let currentRoomIndex = rooms.findIndex(item => item.roomName == roomName);
    rooms.splice(currentRoomIndex);

    console.log('Rooms Array');
    console.log(rooms);
}

io.on('connection', (socket) => {                           //Local Storage store game ID, on reconnect, connect to it.
    socket.on("create room", ({username, roomName}) => {
        create_room(username, roomName, socket);
    });

    socket.on("join room", ({username, roomName}) => {
        join_room(username, roomName, socket);
    });

    socket.on('start game', (roomName) => {
        init_game(roomName);
    });

    socket.on('hit', (roomName) => {
        hit(roomName, socket.id);
    });

    socket.on('stand', (roomName) => {
        stand(roomName);
    });

    socket.on('leave lobby', (roomName) => {
        let currentRoomIndex = rooms.findIndex(item => item.roomName == roomName);
        let room = get_room(roomName);

        console.log(rooms);

        if (room.p1.id) {
            if (socket.id == room.p1.id) {
                console.log(`${room.roomName}: Player 1 left while in lobby, closing room.`)
                if (room.p2) {
                    io.to(room.p2.id).emit("host left lobby");
                }
                io.socketsLeave(room.roomName);
                rooms.splice(currentRoomIndex);
            } else {
                console.log(`${room.roomName}: Player 2 left while in lobby.`)
                room.p2 = null;
                room.p2connection = 'none';
                io.to(room.p1.id).emit("player left lobby");
            }
        }

        console.log(rooms);

    });

    players.push(socket);
    
    console.log(`${socket.id} connected`);
    console.log( socket.client.conn.server.clientsCount + " users connected");
    io.emit('logon', socket.id);

    socket.on('chat message', (msg, username, roomName) => {
        io.to(roomName).emit('chat message', msg, username)
      });

    socket.on('connect', () => {
        io.emit('logon', socket.id);
    });

    socket.on('rejoin check', (rejoinRoom, rejoinId) => {
        let room = get_room(rejoinRoom);
        if (room) {
            if ((room.p1 && (room.p1.id == rejoinId && room.p1connection == 'disconnected')) || (room.p2 && (room.p2.id == rejoinId && room.p2connection == 'disconnected'))) {
                console.log(`${room.roomName}: Rejoin request valid!`);
                io.to(socket.id).emit('rejoin valid');
            }
        }

        console.log(rooms);

    });

    socket.on('disconnect', () => { //This has a timeout unless the user closes tab.
        console.log(`${socket.id} disconnected`);
        console.log( socket.client.conn.server.clientsCount + " users connected");

        console.log(rooms);

        let room = find_room(socket.id);
        if (room) {

            let currentRoomIndex = rooms.findIndex(item => item.roomName == room.roomName);
            if (room.gameStatus == 'lobby') {

                if (socket.id == room.p1.id) {
                    console.log(`${room.roomName}: Player 1 left while in lobby, closing room.`)
                    io.to(room.roomName).emit("host left lobby");
                    io.socketsLeave(room.roomName);
                    rooms.splice(currentRoomIndex);
                } else if (socket.id == room.p2.id) {
                    console.log(`${room.roomName}: Player 2 left while in lobby.`)
                    room.p2 = null;
                    room.p2connection = 'none';
                    io.to(room.p1.id).emit("player left lobby");
                }

            } else if (room.gameStatus == 'playing') {

                if (socket.id == room.p2.id) {
                    console.log(`${room.roomName}: Player 2 disconnected while in game.`)
                    room.p2connection = 'disconnected';
                    io.to(room.roomName).emit('logoff', socket.id);
                    io.to(room.p1.id).emit("player left game");
                } else if (socket.id == room.p1.id) {
                    console.log(`${room.roomName}: Player 1 disconnected while in game.`)
                    room.p1connection = 'disconnected';
                    io.to(room.p2.id).emit("host left game");
                }
                
            }

            if (room.p1connection == 'disconnected' && room.p2connection == 'disconnected') {
                console.log(`${room.roomName}: Both players disconnected, so closing room.`)
                rooms.splice(currentRoomIndex);
            }
        }

        console.log(rooms);
    });

    socket.on('rejoin', (roomName, username) => {
        console.log(`${roomName}: User attempting rejoin`)

        console.log(rooms);

        let room = get_room(roomName);
        if (room) {
            socket.join(roomName);
            console.log(`${roomName}: Room found!`)

            const user = {
                username: username,
                id: socket.id
            };

            if (room.p1connection == 'disconnected') {
                room.p1 = user;
                room.p1connection = 'connected';

                let host = true;

                if (room.turn == 1) {
                    io.to(room.p1.id).emit('turn');  
                }

                send_cards(room.p1cards, room.p2cards, room, 1, socket.id, host, room.currentTurn);
                console.log(`${roomName}: Player 1 rejoined as ${username}`)
                
            } else if (room.p2connection == 'disconnected') {
                room.p2 = user;
                room.p2connection = 'connected';

                let host = false;
                
                if (room.turn == 2) {
                    io.to(room.p2.id).emit('turn');
                }

                send_cards(room.p1cards, room.p2cards, room, 2, socket.id, host, room.currentTurn);
                console.log(`${roomName}: Player 2 rejoined as ${username}`)
            }

        } else {
            io.to(socket.id).emit('rejoin failed');
            console.log(`${roomName}: Rejoin failed`)
        }

        console.log(rooms);
    })
});

server.listen(3000, () => {
    console.log('Listening on *:3000');
});