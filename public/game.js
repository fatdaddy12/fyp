let cards = ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king'];
let suit = ['diamonds', 'hearts', 'spades', 'clubs'];
let imageStore = document.getElementById('scale-image');
let slowInternet = false;

//Monitor Network Connection https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
let connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
let type = connection.effectiveType;

console.log(`Connection type: ${type}`);

if (type != '4g') {
    slowInternet = true;
} else {
    requestAnimationFrame(draw);
}

function updateConnectionStatus() {
    console.log("Connection type changed from " + type + " to " + connection.effectiveType);
    type = connection.effectiveType;

    if (type != '4g') {
        canvas.style.display = "none";
        noCanvas.style.display = "block";
        slowInternet = true;
    } else {
        canvas.style.display = "block";
        noCanvas.style.display = "none";
        slowInternet = false;
        draw();
    }
}

connection.addEventListener('change', updateConnectionStatus);

let imageResolution = '';                                       //Background Image changes with Screen Size - Text size, resolution, orientation, 1280x720 base Size?

if (type == '4g') {
    console.log('Fast Speed')
    imageResolution = '_high';
} else {
    console.log('Slow speed');
    imageResolution = '_low';
}

let imgDisplay = `assets/image${imageResolution}.jpg`;
imageStore.src = imgDisplay;

//Monitor Screen Stuff https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation
let orientation = screen.orientation;
let width = window.innerWidth;
let height = window.innerHeight;

console.log(orientation);
console.log(`Resolution of screen: ${width}x${height}`);

window.addEventListener('resize', resizeGame);

//Battery Monitor https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API
let battery = navigator.getBattery();
console.log(battery);

/*battery.addEventListener('levelchange', () => { //Temp
    updateLevelInfo();
  });
  function updateLevelInfo(){
    console.log("Battery level: "
                + battery.level * 100 + "%");
  };*/

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
var player = 0;

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
//ctx.font = "48px serif";

var cardHeight = 100;
var cardWidth = 65;

standBtn.addEventListener('click', stand);
hitBtn.addEventListener('click', hit);

//Functions
function card(img, x, y) {

    /*let originX = canvas.width / 2;
    let originY = canvas.height / 2;

    let distanceX = originX - x;
    let distanceY = originY - y;

    let steps = 100;
    let progress = 0;

    let travelX = distanceX / steps * progress;
    let travelY = distanceY / steps * progress;

    if (progress < steps) {
        progress += 1;
        x += distanceX;
        y += distanceY;
    }

    ctx.drawImage(img, originX, originY, (65 * multiplierX), (100 * multiplierX));*/

    ctx.drawImage(img, x, y, (65 * multiplierX), (100 * multiplierX));
    

    //ctx.beginPath();
    //ctx.rect(x, y, (65 * multiplierX), (100 * multiplierX));
    //ctx.strokeStyle = "rgb(0, 0, 0)";
    //ctx.stroke();
    //ctx.closePath();    

    //x += 1;
    //y += 1;
}

//requestAnimationFrame(draw);

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (p1cards.length != 0) {
        var x = 0;
        var y = 0;
        var x2 = 0;
        var y2 = 0;
    
        if (player == 0) {
            x = 5;
            y = canvas.height / 2;
            x2 = 5;
            y2 = 5;
        } else {
            x = 5;
            y = 5;
            x2 = 5;
            y2 = canvas.height / 2;
        }

        var i = 0;

        if (type == '4g') {
            p1cards.forEach(function(item) {
                var img = new Image();
                if (i == 0 && player == 1) {
                    img.src = `/assets/Card_back.svg`;
                } else {
                    img.src = `/assets/${item.resultNum}_of_${item.resultSuit}.svg`;
                };
                
                card(img, x, y);
                x += ((cardWidth * multiplierX) + 5);
                i++;
                //y += 5;
    
                //makeCard(item.resultNum, item.resultSuit);
            });
    
            var i2 = 0;
    
            p2cards.forEach(function(item) {
                var img = new Image();
                if (i2 == 0 && player == 0) {
                    img.src = `/assets/Card_back.svg`;
                } else {
                    img.src = `/assets/${item.resultNum}_of_${item.resultSuit}.svg`;
                };
                
                card(img, x2, y2);
                x2 += ((cardWidth * multiplierX) + 5);
                i2++;
                //y += 5;
            });
        }

    }

    if (slowInternet == false) {
        requestAnimationFrame(draw);
    };
    
};

function stand() {
    socket.emit('stand', roomName);
    hitBtn.disabled = true;
    standBtn.disabled = true;
};

function hit() {
    socket.emit('hit', roomName);
    hitBtn.disabled = true;
    standBtn.disabled = true;
    playerTxt.textContent = 'Waiting for other player!'
};

function drawCard(resultNum, resultSuit) {
    drawTxt.textContent = `You drew ${resultNum} of ${resultSuit}`;
    p1cards.push([resultNum, resultSuit]);
};

function resizeGame() {
    width = window.innerWidth;
    height = window.innerHeight;
    orientation = window.orientation;
    multiplierX = width / desiredX;
    multiplierY = height / desiredY;

    console.log(`${width}x${height}, MultplierX: ${multiplierX}, MultiplierY: ${multiplierY}, Orientation: ${orientation}`)

    canvas.height = (desiredY * multiplierX) * 0.7
    canvas.width = (desiredX * multiplierX) * 0.7
};

socket.on('hitted', (p1score, p2score) => {
    //var item = document.createElement('li');
    //item.textContent = `${resultNum} of ${resultSuit}`;
    //messages.appendChild(item);
    //window.scrollTo(0, document.body.scrollHeight);

    //drawCard(resultNum, resultSuit);
    p1cards = p1score;
    p2cards = p2score;

    var countingScore = 0;

    if (player == 0) {
        p1cards.forEach(element => countingScore += element.value)
    } else {
        p2cards.forEach(element => countingScore += element.value)
    };
    
    drawCards();

    scoreTxt.textContent = `Your Total: ${countingScore}`;
});

socket.on('turn', () => {
    hitBtn.disabled = false;
    standBtn.disabled = false;
    playerTxt.textContent = 'Your Turn!'
});

socket.on('game end', (winner) => {
    roomCode.textContent += ` ${winner}`;
});

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
});

socket.on('room joined', (roomName) => {
    roomCode.style.display = "block";
    roomCode.textContent = `Room Code: ${roomName}`;
    playerList.style.display = "block";

    //canvas.style.display = "block";
    //controls.style.display = "block";
    roomForm.style.display = "none";
    joinForm.style.display = "none";
});

socket.on('update users', (usersInRoom) => {
    playerList.textContent = "Players: "
    usersInRoom.forEach(function(user) {
        playerList.textContent += `${user.username}, `;
    })
});

socket.on('already exists', () => {
    alert("Session already exists");
});

socket.on('session full', () => {
    alert("Session is full");
});

socket.on('ready to begin', () => {
    startBtn.disabled = false;
});

socket.on('start game', () => {
    if (slowInternet == false) {
        canvas.style.display = "block";
    } else {
        noCanvas.style.display = "block";
    }
    
    controls.style.display = "block";
    startBtn.style.display = "none";
});

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
        player = 1;

        //canvas.style.display = "block";
        //controls.style.display = "block";
        //roomForm.style.display = "none";
        //joinForm.style.display = "none";

    }
});

startBtn.addEventListener('click', function(e) {
    socket.emit('start game', roomName);
});

// Text Based Test
let cardContainer = document.getElementById('cardTest');
let textCardsP1 = document.getElementById('p1cards');
let textCardsP2 = document.getElementById('p2cards');

//suit.forEach(element => makeCard2(element));

function drawCards() {
    while (textCardsP1.firstChild) {
        textCardsP1.removeChild(textCardsP1.lastChild);
    };

    while (textCardsP2.firstChild) {
        textCardsP2.removeChild(textCardsP2.lastChild);
    };

    p1cards.forEach(function(item) {
        makeCard(item.resultSuit, item.resultNum, 1);
    });

    p2cards.forEach(function(item) {
        makeCard(item.resultSuit, item.resultNum, 2);
    });
}

function makeCard(suit, num, player) {
    const newDiv = document.createElement("div");
    const newCardValue = document.createElement("p");
    const newCardSuit = document.createElement("p");

    newDiv.setAttribute("id", "card");
    newCardValue.setAttribute("id", "cardValue");
    newCardSuit.setAttribute("id", "cardValue");

    newDiv.appendChild(newCardValue);
    newDiv.appendChild(newCardSuit);

    newCardValue.textContent = num;
    newCardSuit.textContent = suit;

    if (player == 1) {
        textCardsP1.appendChild(newDiv);
    } else if (player == 2) {
        textCardsP2.appendChild(newDiv);
    };
    
};

function makeCard2(suit) {
    cards.forEach((card) => {
        const newDiv = document.createElement("div");
        const newCardValue = document.createElement("p");
        const newCardSuit = document.createElement("p");
    
        newDiv.setAttribute("id", "card");
        newCardValue.setAttribute("id", "cardValue");
        newCardSuit.setAttribute("id", "cardValue");
    
        newDiv.appendChild(newCardValue);
        newDiv.appendChild(newCardSuit);
    
        newCardValue.textContent = card;
        newCardSuit.textContent = suit;
    
        cardContainer.appendChild(newDiv);
    });
};