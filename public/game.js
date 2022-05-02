let cards = ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king'];
let suit = ['diamonds', 'hearts', 'spades', 'clubs'];
let imageStore = document.getElementById('scale-image');
let slowInternet = false;

//Monitor Network Connection https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
let connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
let type = connection.effectiveType;

let connTxt = document.getElementById('networkSpeed');

console.log(`Connection type: ${type}`);
connTxt.textContent += type;

//if (type != '4g') {
//    slowInternet = true;
//} else {
//    requestAnimationFrame(draw);
//}

function updateConnectionStatus() {
    console.log("Connection type changed from " + type + " to " + connection.effectiveType);
    type = connection.effectiveType;

    connTxt.textContent = `Network Speed: ${type}`;

    if (type != '4g') {
        //canvas.style.display = "none";
        //noCanvas.style.display = "block";
        slowInternet = true;
    } else {
        //canvas.style.display = "block";
        //noCanvas.style.display = "none";
        slowInternet = false;
        //draw();
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

let resolutionTxt = document.getElementById('resolution');
let orientationTxt = document.getElementById('orientation');
resolutionTxt.textContent = `Resolution of screen: ${width}x${height}`
orientationTxt.textContent = `Orientation: ${orientation.type}, ${orientation.angle}`

console.log(orientation);
console.log(`Resolution of screen: ${width}x${height}`);

window.addEventListener('resize', resizeGame);

function resizeGame() {
    width = window.innerWidth;
    height = window.innerHeight;
    orientation = screen.orientation;
    multiplierX = width / desiredX;
    multiplierY = height / desiredY;

    resolutionTxt.textContent = `Resolution of screen: ${width}x${height}`
    orientationTxt.textContent = `Orientation: ${orientation.type}, ${orientation.angle}`
    console.log(`${width}x${height}, MultplierX: ${multiplierX}, MultiplierY: ${multiplierY}, Orientation: ${orientation}`)

    canvas.height = (desiredY * multiplierX) * 0.7
    canvas.width = (desiredX * multiplierX) * 0.7
};

//Battery Monitor https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API
let batteryCharging = true;
let batteryLevel = 100;

let batteryLevelTxt = document.getElementById('batteryLevel');
let batteryChargingTxt = document.getElementById('batteryCharging');

navigator.getBattery().then(function(battery) {
    console.log(battery);
    batteryCharging = battery.charging;
    batteryLevel = battery.level * 100;

    batteryLevelTxt.textContent = `Battery Level: ${batteryLevel}%`;
    batteryChargingTxt.textContent = `Battery Charging: ${batteryCharging}`;

    console.log(`Battery Charging: ${batteryCharging}`);
    console.log(`Battery Level: ${batteryLevel}%`);

    battery.addEventListener('chargingchange', function() {
        batteryCharging = battery.charging;
        batteryChargingTxt.textContent = `Battery Charging: ${batteryCharging}`;
    })

    battery.addEventListener('levelchange', function() {
        batteryLevel = battery.level;
        batteryLevelTxt.textContent = `Battery Level: ${batteryLevel}%`;
    })
})

function updateLevelInfo(){
    console.log("Battery level: "
                + battery.level * 100 + "%");
  };

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
const lobby = document.getElementById('lobby');
//const playerList = document.getElementById('playerList');
const p1Name = document.getElementById('player1');
const p2Name = document.getElementById('player2');
const standBtn = document.getElementById('stand');
const hitBtn = document.getElementById('hit');
const bgCanvas = document.getElementById('bgCanvas');
const canvas = document.getElementById('gameCanvas');
const noCanvas = document.getElementById('gameText');
const cardImg = document.getElementById('card');
const resultsScreen = document.getElementById('results');
const resultsTxt = document.getElementById('gameResult');
const resultsBtn = document.getElementById('endGame');
const desiredX = 1280;
const desiredY = 720;
var multiplierX = width / desiredX;
var multiplierY = height / desiredY;

const playerTxt = document.getElementById('turn');
const scoreTxt = document.getElementById('score');
var p1score = 0;
var p1cards = [];
var p2score = 0;
var p2cards = [];
let currentTurn = 1;
//var player = 1;

let rejoinForm = document.getElementById('reconnectDiv');
let rejoinRoom = localStorage.getItem('room');
if (rejoinRoom) {
    console.log(`Retrieved from local storage: ${rejoinRoom}`);
    rejoinForm.style.display = 'block';
};

playerTxt.textContent = `Player ${currentTurn} Turn`
scoreTxt.textContent = `Your Total: ${p1score}`;

console.log(`Multiplier X: ${multiplierX}`);
console.log(`Multiplier Y: ${multiplierY}`);

canvas.height = (desiredY * multiplierX) * 0.7
canvas.width = (desiredX * multiplierX) * 0.7

console.log(`Canvas Height: ${canvas.height}`);
console.log(`Canvas Width: ${canvas.width}`);

var cardHeight = 100;
var cardWidth = 65;

standBtn.addEventListener('click', stand);
hitBtn.addEventListener('click', hit);

const ctx = canvas.getContext('2d');

function card(img, x, y) {
    ctx.drawImage(img, x, y, (65 * multiplierX), (100 * multiplierX));
}

//requestAnimationFrame(draw);

let images = [];

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (p1cards.length != 0) {
        var x = 0;
        var y = 0;
        var x2 = 0;
        var y2 = 0;
    

        x = 5;
        y = canvas.height / 2;
        x2 = 5;
        y2 = 5;

        let i = 0;
        let i2 = 0;

        if (type == '4g') {
            p1cards.forEach(function(item) {
                let img = images.find(image => image.src.includes(`/assets/${item.resultNum}_of_${item.resultSuit}.svg`));

                card(img, x, y);
                x += ((cardWidth * multiplierX) + 5);
                i++;
            });
    
            p2cards.forEach(function(item) {
                let img = images.find(image => image.src.includes(`/assets/${item.resultNum}_of_${item.resultSuit}.svg`));
                
                card(img, x2, y2);
                x2 += ((cardWidth * multiplierX) + 5);
                i2++;
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

socket.on('hitted', (p1score, p2score, currentTurn) => {
    p1cards = p1score;
    p2cards = p2score;

    var countingScore = 0;

    p1cards.forEach(element => countingScore += element.value)

    drawCards();

    if (batteryLevel > 65 || batteryCharging == true) {
        animateCard(currentTurn);
    }
    
    scoreTxt.textContent = `Your Total: ${countingScore}`;
});

socket.on('turn', () => {
    hitBtn.disabled = false;
    standBtn.disabled = false;
    playerTxt.textContent = 'Your Turn!'
    //getImage(currentTurn);
});

socket.on('new card', (card) => {
    //console.log(card);
    getImage(card);
})

function getImage(card) { //it does this even if the canvas isnt displaying
    let img = new Image();
    img.src = `/assets/${card.resultNum}_of_${card.resultSuit}.svg`
    images.push(img);
}

socket.on('winner', () => {
    //roomCode.style.display = "block";
    resultsTxt.textContent = `You win ${username}!!!`;
    showResults();
});

socket.on('loser', () => {
    resultsTxt.textContent = `You lose ${username}!!!`;
    showResults();
});

socket.on('draw', () => {
    resultsTxt.textContent = `It's a draw!`;
    showResults();
});

function showResults() {
    startBtn.disabled = true;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    controls.style.display = "none";

    resultsScreen.style.display = "block";

    p2Name.textContent = 'Waiting for other player...'

    console.log('Removing from local storage');
    localStorage.removeItem('room');
};

resultsBtn.addEventListener('click', () => {
    show_start_menu();
    noCanvas.style.display = "none";
    canvas.style.display = "none";

    resultsScreen.style.display = "none";

    usernameTxt.value = '';
    roomTxt.value = '';

    joinUserTxt.value = '';
    joinTxt.value = '';
})

function show_lobby() {
    lobby.style.display = "block";
}

function show_start_menu() {
    roomForm.style.display = "block";
    joinForm.style.display = "block";
}

//==================================================== Room Section ====================================================
socket.on('room created', (roomName) => {
    roomCode.style.display = "block";
    roomCode.textContent = `Room Code: ${roomName}`;
    lobby.style.display = "block";

    //canvas.style.display = "block";
    //controls.style.display = "block";
    roomForm.style.display = "none";
    joinForm.style.display = "none";
    startBtn.style.display = "block";
    p1Name.textContent = `${username}`;
});

socket.on('room joined', (roomName, player1) => {
    roomCode.style.display = "block";
    roomCode.textContent = `Room Code: ${roomName}`;
    lobby.style.display = "block";

    //canvas.style.display = "block";
    //controls.style.display = "block";
    roomForm.style.display = "none";
    joinForm.style.display = "none";
    p1Name.textContent = `${player1}`
});

socket.on('already exists', () => {
    alert("A room already exists with this ID!");
});

socket.on('doesnt exist', () => {
    alert("No room exists with this ID!");
});

socket.on('session full', () => {
    alert("This room is full!");
});

socket.on('ready to begin', (username) => {
    startBtn.disabled = false;
    p2Name.textContent = `${username}`
});

socket.on('player left lobby', () => {
    startBtn.disabled = true;
    p2Name.textContent = 'Waiting for other player...'
})

socket.on('host left lobby', () => {
    show_start_menu();
    p1Name.textContent = 'You shouldnt see this';
})

socket.on('player left game', () => {
    console.log('Player left');
});

socket.on('host left game', () => {
    console.log('Host left');
});

socket.on('start game', (roomName) => {
    //if (slowInternet == false) {
    //    canvas.style.display = "block";
    //} else {
        noCanvas.style.display = "block";
    //}

    lobby.style.display = "none";
    roomCode.style.display = "none";
    
    controls.style.display = "block";
    startBtn.style.display = "none";

    localStorage.setItem('room', roomName);
    console.log(`Set room in local storage ${roomName}`);
});

var roomTxt = document.getElementById('gameid');
var roomForm = document.getElementById('createForm');
var usernameTxt = document.getElementById('usernameid');
var startBtn = document.getElementById('startBtn');

var joinForm = document.getElementById('joinForm');
var joinTxt = document.getElementById('joinGameId');
var joinUserTxt = document.getElementById('joinUsernameId');

let roomName = '';
let username = '';

const controls = document.getElementById('controls');

roomForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (roomTxt.value) {
        username = usernameTxt.value;
        roomName = roomTxt.value;
        socket.emit("create room", {username, roomName});
    }
});

joinForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (joinTxt.value) {
        username = joinUserTxt.value;
        roomName = joinTxt.value;
        socket.emit("join room", {username, roomName});

        p2Name.textContent = username;

        //canvas.style.display = "block";
        //controls.style.display = "block";
        //roomForm.style.display = "none";
        //joinForm.style.display = "none";
    };
});

startBtn.addEventListener('click', function(e) {
    socket.emit('start game', roomName);
});

// Text Based Test
let cardContainer = document.getElementById('cardTest');
let topCards = document.getElementById('topCards');
let bottomCards = document.getElementById('bottomCards');

//suit.forEach(element => makeCard2(element));

function drawCards() {
    while (topCards.firstChild) {
        topCards.removeChild(topCards.lastChild);
    };

    while (bottomCards.firstChild) {
        bottomCards.removeChild(bottomCards.lastChild);
    };

    let i1 = 0;

    p1cards.forEach(function(item) {
        let newCard = makeCardText(item.resultSuit, item.resultNum);
        //let newCardImg = makeCardImg(item.resultSuit, item.resultNum); //rm
        bottomCards.appendChild(newCard);

    });

    let i2 = 0;

    p2cards.forEach(function(item) {
        let newCard = makeCardText(item.resultSuit, item.resultNum);
        //let newCardImg = makeCardImg(item.resultSuit, item.resultNum); //rm

        topCards.appendChild(newCard);

    });
};

function makeCardText(suit, num) {
    const newDiv = document.createElement("div");
    const newCardValue = document.createElement("p");
    const newCardSuit = document.createElement("p");

    newDiv.setAttribute("id", "card");
    newCardValue.setAttribute("id", "cardValue");
    newCardSuit.setAttribute("id", "cardValue");

    let suitTxt = '';
    if (suit == 'diamond') {
        suitTxt = '♦'; 
    } else if (suit == 'spades') {
        suitTxt = '♠';
    } else if (suit == 'clubs') {
        suitTxt = '♣';
    } else {
        suitTxt = '♥'
    };

    let numTxt = '';
    if (num == 'jack') {
        numTxt = 'J';
    } else if (num == 'queen') {
        numTxt = 'Q';
    } else if (num == 'king') {
        numTxt = 'K';
    } else {
        numTxt = 'A';
    };

    newDiv.setAttribute("class", suit); //♠ ♣ ♥ ♦

    let parsed = parseInt(num);

    if (!isNaN(parsed)) {
        newCardValue.textContent = num;
    } else {
        newCardValue.textContent = numTxt;
    };
    
    newCardSuit.textContent = suitTxt;

    newDiv.appendChild(newCardValue);
    newDiv.appendChild(newCardSuit);

    return newDiv;
};

function makeCardImg(suit, num) {
    //const newImg = document.createElement('img');
    let img = images.find(image => image.src.includes(`/assets/${num}_of_${suit}.svg`));

    return img;
}

function animateCard(passedTurn) {
    console.log(`Last turn was ${passedTurn}`);
    
    if (passedTurn == 1) {
        bottomCards.children[bottomCards.children.length - 1].classList.toggle('latestCard');
    } else {
        topCards.children[topCards.children.length - 1].classList.toggle('latestCard');
    }

};