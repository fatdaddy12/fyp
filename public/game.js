var cards = ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king'];
var suit = ['diamonds', 'hearts', 'spades', 'clubs'];
var imageStore = document.getElementById('scale-image');

//Monitor Network Connection https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
var type = connection.effectiveType;

console.log(`Connection type: ${type}`);

function updateConnectionStatus() {
    console.log("Connection type changed from " + type + " to " + connection.effectiveType);
    type = connection.effectiveType;

    if (type != '4g') {
        canvas.style.display = "none";
        noCanvas.style.display = "block";
    } else {
        canvas.style.display = "block";
        noCanvas.style.display = "none";
    }
}

connection.addEventListener('change', updateConnectionStatus);

let imageResolution = '';

if (type == '4g') {
    console.log('Fast Speed')
    imageResolution = '_high';
} else {
    console.log('Slow speed');
    imageResolution = '_low';
}

var imgDisplay = `assets/image${imageResolution}.jpg`;
imageStore.src = imgDisplay;

//Monitor Screen Stuff https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation
var orientation = screen.orientation;
var width = window.innerWidth;
var height = window.innerHeight;

console.log(orientation);
console.log(`Resolution of screen: ${width}x${height}`);

window.addEventListener('resize', resizeGame);

//Chat button
const chatBtn = document.getElementById('chat-hide');
const chatWindow = document.getElementById('chat');
chatBtn.addEventListener('click', showChat);

var showChat = false;

function showChat() {
    if (showChat == false) {
        chatWindow.style.display = "block";
        showChat = true;
    } else {
        chatWindow.style.display = "none";
        showChat = false;
    }
}

//Game Initialisation

const roomCode = document.getElementById('roomCode');
const playerList = document.getElementById('playerList');
const standBtn = document.getElementById('stand');
const hitBtn = document.getElementById('hit');
const canvas = document.getElementById('gameCanvas');
const noCanvas = document.getElementById('gameText');
const cardImg = document.getElementById('card');
const desiredX = 1280;
const desiredY = 720;
var multiplierX = width / desiredX;
var multiplierY = height / desiredY;

const playerTxt = document.getElementById('turn');
const scoreTxt = document.getElementById('score');
const drawTxt = document.getElementById('draw');
var p1score = 0;
var p1cards = [];
var p2score = 0;
var p2cards = [];
var currentTurn = 1;

playerTxt.textContent = `Player ${currentTurn} Turn`
scoreTxt.textContent = `Your Total: ${p1score}`;
drawTxt.textContent = 'You drew'

console.log(multiplierX);
console.log(multiplierY);

canvas.height = (desiredY * multiplierX) * 0.7
canvas.width = (desiredX * multiplierX) * 0.7

console.log(canvas.height);
console.log(canvas.width);

const ctx = canvas.getContext('2d');
ctx.font = "48px serif";

var cardHeight = 100;
var cardWidth = 65;


standBtn.addEventListener('click', stand)
hitBtn.addEventListener('click', hit)

//Functions
function card(img, x, y) {

    ctx.drawImage(img, x, y, (65 * multiplierX), (100 * multiplierX));

    //ctx.beginPath();
    //ctx.rect(x, y, (65 * multiplierX), (100 * multiplierX));
    //ctx.strokeStyle = "rgb(0, 0, 0)";
    //ctx.stroke();
    //ctx.closePath();    

    //x += 1;
    //y += 1;
}

requestAnimationFrame(draw);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (p1cards.length != 0) {

        //var img = new Image();
        //img.src = `/assets/${resultNum}_of_${resultSuit}.svg`
        //console.log(img.src);
    
        var x = 5;
        var y = 5; //fix this

        p1cards.forEach(function(item) {
            var img = new Image();
            img.src = `/assets/${item.resultNum}_of_${item.resultSuit}.svg`;
            card(img, x, y);
            x += 20;
            //y += 5;
        });

        var x2 = 5;
        var y2 = canvas.height / 2;

        p2cards.forEach(function(item) {
            var img = new Image();
            img.src = `/assets/${item.resultNum}_of_${item.resultSuit}.svg`;
            card(img, x2, y2);
            x2 += 20;
            //y += 5;
        });
    }

    requestAnimationFrame(draw);

}

function stand() {
    console.log('Stand');
}

function hit() {
    //drawCard();
    socket.emit('hit', roomName);
    hitBtn.disabled = true;
    playerTxt.textContent = 'Waiting for other player!'
}

function drawCard(resultNum, resultSuit) {
    //var resultNum = cards[Math.floor(Math.random()*cards.length)];
    //var resultSuit = suit[Math.floor(Math.random()*suit.length)];
    drawTxt.textContent = `You drew ${resultNum} of ${resultSuit}`;
    //cardImg.src = `/assets/${resultNum}_of_${resultSuit}.svg`

    p1cards.push([resultNum, resultSuit]);
    //console.log(p1cards);

    //var img = new Image();
    //img.addEventListener('load', function() {
    //    card(img);
    //});
    //img.src = `/assets/${resultNum}_of_${resultSuit}.svg`
}

function resizeGame() {
    width = window.innerWidth;
    height = window.innerHeight;
    multiplierX = width / desiredX;
    multiplierY = height / desiredY;

    console.log(`${width} ${height} ${multiplierX} ${multiplierY}`)

    canvas.height = (desiredY * multiplierX) * 0.7
    canvas.width = (desiredX * multiplierX) * 0.7
}

socket.on('hitted', (p1score, p2score) => {
    //var item = document.createElement('li');
    //item.textContent = `${resultNum} of ${resultSuit}`;
    //messages.appendChild(item);
    //window.scrollTo(0, document.body.scrollHeight);

    //drawCard(resultNum, resultSuit);
    p1cards = p1score;
    p2cards = p2score;
})

socket.on('turn', () => {
    hitBtn.disabled = false;
    playerTxt.textContent = 'Your Turn!'
})

//==================================================== Room Section ====================================================
socket.on('room created', (roomName) => {
    roomCode.style.display = "block";
    roomCode.textContent = `Room Code: ${roomName}`;
    playerList.style.display = "block";

    //canvas.style.display = "block";
    //controls.style.display = "block";
    roomForm.style.display = "none";
    joinForm.style.display = "none";
    startBtn.style.display = "block";
})

socket.on('room joined', (roomName) => {
    roomCode.style.display = "block";
    roomCode.textContent = `Room Code: ${roomName}`;
    playerList.style.display = "block";

    //canvas.style.display = "block";
    //controls.style.display = "block";
    roomForm.style.display = "none";
    joinForm.style.display = "none";
})

socket.on('update users', (usersInRoom) => {
    playerList.textContent = "Players: "
    usersInRoom.forEach(function(user) {
        playerList.textContent += `${user.username}, `;
    })
})

socket.on('already exists', () => {
    alert("Session already exists");
})

socket.on('session full', () => {
    alert("Session is full");
})

socket.on('ready to begin', () => {
    startBtn.disabled = false;
})

socket.on('start game', () => {
    canvas.style.display = "block";
    controls.style.display = "block";
    startBtn.style.display = "none";
})

var roomTxt = document.getElementById('gameid');
var roomForm = document.getElementById('createForm');
var usernameTxt = document.getElementById('usernameid');
var startBtn = document.getElementById('startBtn');

var joinForm = document.getElementById('joinForm');
var joinTxt = document.getElementById('joinGameId');
var joinUserTxt = document.getElementById('joinUsernameId');

let roomName = '';

const controls = document.getElementById('controls');

roomForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (roomTxt.value) {
        let username = usernameTxt.value;
        roomName = roomTxt.value;
        //console.log(roomName);
        socket.emit("create room", {username, roomName});
    }
});

joinForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (joinTxt.value) {
        let username = joinUserTxt.value;
        roomName = joinTxt.value;
        socket.emit("join room", {username, roomName});

        //canvas.style.display = "block";
        //controls.style.display = "block";
        //roomForm.style.display = "none";
        //joinForm.style.display = "none";

    }
})

startBtn.addEventListener('click', function(e) {
    socket.emit('start game', roomName);
});
