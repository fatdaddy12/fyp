let cards = ['ace', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'jack', 'queen', 'king'];
let suit = ['diamonds', 'hearts', 'spades', 'clubs'];

//Monitor Network Connection https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
let connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
let type = null;
if (connection) {
    type = connection.effectiveType;
    connection.addEventListener('change', updateConnectionStatus);
}

let images = [];

let connTxt = document.getElementById('networkSpeed');
console.log(connection);
//console.log(`Connection type: ${type}`);
connTxt.textContent += type;

//if (type == '4g') {
//    loadImages();
//}

console.log(images);

function loadImages() {
    cards.forEach(function(itemCard) {
        suit.forEach(function(itemSuit) {
            let image = new Image();
            image.src = `/assets/cards/${itemCard}_of_${itemSuit}.svg`
            images.push(image);
        })
    });

    let imageBack = new Image();
    imageBack.src = '/assets/cards/Card_back.svg';
    images.push(imageBack);
}

function updateConnectionStatus() {
    console.log(connection);
    console.log("Connection type changed from " + type + " to " + connection.effectiveType);
    type = connection.effectiveType;

    connTxt.textContent = `Network Speed: ${type}`;

    //if (type == '4g' && !images.length) {
    //    loadImages();
    //}
}

let imageResolution = '';

if (type == '4g') {
    console.log('Fast Speed')
} else {
    console.log('Slow speed');
}

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
    //console.log(`${width}x${height}, MultplierX: ${multiplierX}, MultiplierY: ${multiplierY}, Orientation: ${orientation}`)

    //canvas.height = (desiredY * multiplierX) * 0.7
    //canvas.width = (desiredX * multiplierX) * 0.7

    renderer.setSize( width * 0.7, height * 0.7 );
};

//Battery Monitor https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API
let batteryCharging = true;
let batteryLevel = 100;

let batteryLevelTxt = document.getElementById('batteryLevel');
let batteryChargingTxt = document.getElementById('batteryCharging');

if ("getBattery" in navigator) {
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
}

function updateLevelInfo(){
    console.log("Battery level: "+ battery.level * 100 + "%");
  };

//Chat button
const chatBtn = document.getElementById('chat-hide');
const chatWindow = document.getElementById('chat');
chatBtn.addEventListener('click', showChat);

var chatVisible = false;

function showChat() {
    if (chatVisible == false) {
        chatWindow.style.display = "block";
        chatVisible = true;
    } else {
        chatWindow.style.display = "none";
        chatVisible = false;
    }
}

//Game Initialisation
const roomCode = document.getElementById('roomCode');
const lobby = document.getElementById('lobby');
const p1Name = document.getElementById('player1');
const p2Name = document.getElementById('player2');
const standBtn = document.getElementById('stand');
const hitBtn = document.getElementById('hit');
//const bgCanvas = document.getElementById('bgCanvas');
//const canvas = document.getElementById('gameCanvas');
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

let rejoinForm = document.getElementById('reconnectDiv');
let rejoinBtn = document.getElementById('reconnectBtn');
let rejoinRoom = localStorage.getItem('rejoinRoom');
let rejoinId = localStorage.getItem('rejoinId');
if (rejoinRoom && rejoinId) {
    console.log(`Previous game found ${rejoinRoom} ${rejoinId}`);
    socket.emit('rejoin check', rejoinRoom, rejoinId);
    //rejoinForm.style.display = 'block';
};

rejoinBtn.addEventListener('click', function() {
    socket.emit('rejoin', rejoinRoom, usernameTxt.value);
})

socket.on('rejoin valid', () => {
    rejoinForm.style.display = 'block';
})

socket.on("save", (socketId) => {
    localStorage.setItem('rejoinId', socketId);
});

playerTxt.textContent = `Player ${currentTurn} Turn`
scoreTxt.textContent = `Your Total: ${p1score}`;

console.log(`Multiplier X: ${multiplierX}`);
console.log(`Multiplier Y: ${multiplierY}`);

//canvas.height = (desiredY * multiplierX) * 0.7
//canvas.width = (desiredX * multiplierX) * 0.7

//console.log(`Canvas Height: ${canvas.height}`);
//console.log(`Canvas Width: ${canvas.width}`);

var cardHeight = 100;
var cardWidth = 65;

standBtn.addEventListener('click', stand);
hitBtn.addEventListener('click', hit);

//const ctx = canvas.getContext('2d');

function card(img, x, y) {
    ctx.drawImage(img, x, y, (65 * multiplierX), (100 * multiplierX));
}

//requestAnimationFrame(draw);

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

socket.on('rejoined', (p1score, p2score, currentRoom, id) => {
    localStorage.setItem('rejoinId', id);
    p1cards = p1score;
    p2cards = p2score;
    roomName = currentRoom.roomName;

    countingScore = 0;
    p1cards.forEach(element => countingScore += element.value)
    scoreTxt.textContent = `Your Total: ${countingScore}`;

    usernameForm.style.display = "none";
    joinForm.style.display = "none";
    roomForm.style.display = "none";
    rejoinForm.style.display = "none";

    showGame();
    //clearBoard();
    redrawCards(p1score, p2score);

    //drawCards();

    if (batteryLevel > 65 || batteryCharging == true) {
        //animateCard(currentTurn);
    } 
});

socket.on('turn', () => {
    hitBtn.disabled = false;
    standBtn.disabled = false;
    playerTxt.textContent = 'Your Turn!'
    //getImage(currentTurn);
});

let countingScore = 0;

socket.on('new card', (card, currentTurn) => {
    console.log(card);
    //getImage(card);
    if (host == true) {
        if (currentTurn == 1) {
            p1cards.push(card);
        } else {
            p2cards.push(card);
        }
    } else {
        if (currentTurn == 1) {
            p2cards.push(card);
        } else {
            p1cards.push(card);
        }
    }

    countingScore = 0;
    p1cards.forEach(element => countingScore += element.value)
    scoreTxt.textContent = `Your Total: ${countingScore}`;

    drawCards(card, currentTurn);
})

function getImage(card) {
    let img = new Image();
    img.src = `/assets/${card.resultNum}_of_${card.resultSuit}.svg`
    images.push(img);
}

function showResults() {
    startBtn.disabled = true;
    hitBtn.disabled = true;
    standBtn.disabled = true;
    controls.style.display = "none";
    p1cards = [];
    p2cards = [];

    resultsScreen.style.display = "block";

    p2Name.textContent = 'Waiting for other player...'

    console.log('Removing from local storage');
    localStorage.removeItem('rejoinRoom');
    localStorage.removeItem('rejoinId');
    inGame = false;
};

resultsBtn.addEventListener('click', () => {
    showStartMenu();
    noCanvas.style.display = "none";
    //canvas.style.display = "none";

    resultsScreen.style.display = "none";

    usernameTxt.value = '';
    roomTxt.value = '';

    joinTxt.value = '';

    countingScore = 0;
})

function showLobby() {
    roomForm.style.display = "none";
    joinForm.style.display = "none";
    usernameForm.style.display = "none";
    lobby.style.display = "block";
    startBtn.disabled = true;
    hitBtn.disabled = true;
    standBtn.disabled = true;
}

function showStartMenu() {
    usernameForm.style.display = "block";
    roomForm.style.display = "block";
    joinForm.style.display = "block";
    lobby.style.display = "none";
    roomForm.style.display = "block";
    joinForm.style.display = "block";
    p2Name.textContent = 'Waiting for other player...'
}

function showGame() {
    clearBoard();
    lobby.style.display = "none";
    noCanvas.style.display = "block";

    lobby.style.display = "none";
    roomCode.style.display = "none";
    
    controls.style.display = "block";
    startBtn.style.display = "none";
}

//==================================================== Room Section ====================================================
let inGame = false;

socket.on('room created', (roomName) => {
    roomCode.style.display = "block";
    roomCode.textContent = `Room Code: ${roomName}`;
    showLobby();
    startBtn.style.display = "block";
    p1Name.textContent = `${username}`;
});

socket.on('room joined', (roomName, player1) => {
    roomCode.style.display = "block";
    roomCode.textContent = `Room Code: ${roomName}`;
    showLobby();
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
    console.log('host closed')
    alert('Host closed the lobby!');
    console.log('its hould have alerted');
    showStartMenu();
    lobby.style.display = "none";
    p1Name.textContent = 'You shouldnt see this';
    p2Name.textContent = 'Waiting for other player...'
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
    showGame();

    localStorage.setItem('rejoinRoom', roomName);
    console.log(`Set room in local storage ${roomName}`);
    inGame = true;
});

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

var usernameForm = document.getElementById('usernameForm');

usernameForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (usernameTxt.value) {
        username = usernameTxt.value;
        localStorage.setItem('username', username);
    }
})

var roomForm = document.getElementById('createForm');
var usernameTxt = document.getElementById('usernameId');
var roomTxt = document.getElementById('createGameId');
var startBtn = document.getElementById('startBtn');
var leaveLobbyBtn = document.getElementById('leaveLobbyBtn');

var joinForm = document.getElementById('joinForm');
var joinTxt = document.getElementById('joinGameId');

let roomName = '';
let username = '';

let host = false;

const controls = document.getElementById('controls');

roomForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (roomTxt.value) {
        roomName = roomTxt.value;
        socket.emit("create room", {username, roomName});
        host = true;
    }
});

joinForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (joinTxt.value) {
        roomName = joinTxt.value;
        socket.emit("join room", {username, roomName});
        host = false;
        p2Name.textContent = username;
    };
});

startBtn.addEventListener('click', function(e) {
    socket.emit('start game', roomName);
});

leaveLobbyBtn.addEventListener('click', function(e) {
    socket.emit('leave lobby', roomName);
    showStartMenu();
});

// Text Based Test
let cardContainer = document.getElementById('cardTest');
let topCards = document.getElementById('topCards');
let bottomCards = document.getElementById('bottomCards');

function clearBoard() {
    while (topCards.firstChild) {
        topCards.removeChild(topCards.lastChild);
    };

    while (bottomCards.firstChild) {
        bottomCards.removeChild(bottomCards.lastChild);
    };
}

function drawCards(card, currentTurn) {
    let newCard = null;

    if (type == '4g') {
        newCard = makeCardImg(card.resultSuit, card.resultNum);
    } else {
        newCard = makeCardText(card.resultSuit, card.resultNum);
    }

    if (batteryLevel > 65 || batteryCharging == true) {
        newCard.classList.add('latestCard');
    } 

    if (host == true) {
        if (currentTurn == 1) {
            bottomCards.appendChild(newCard);
        } else {
            if (!topCards.children.length) {
                newCard = makeBlankCard();
                topCards.appendChild(newCard);
            }
            topCards.appendChild(newCard);
        }
    } else {
        if (currentTurn == 1) {
            if (!topCards.children.length) {
                newCard = makeBlankCard();
                topCards.appendChild(newCard);
            } else {
                topCards.appendChild(newCard);
            }
        } else {
            bottomCards.appendChild(newCard);
        }
    }
};

function redrawCards(p1cards, p2cards) {
    p1cards.forEach(function(item) {
        if (type == '4g') {
            newCard = makeCardImg(item.resultSuit, item.resultNum);
        } else {
            newCard = makeCardText(item.resultSuit, item.resultNum);
        }
        bottomCards.appendChild(newCard);
    });

    p2cards.forEach(function(item) {
        if (type == '4g') {
            newCard = makeCardImg(item.resultSuit, item.resultNum);
        } else {
            newCard = makeCardText(item.resultSuit, item.resultNum);
        }
        topCards.appendChild(newCard);
    })
    
}

function makeBlankCard() {
    if (!type == '4g') {
        const newDiv = document.createElement("div");
        newDiv.setAttribute("id", "cardBack");
        return newDiv;
    } else {
        return makeBlankCardImg();
    }
}

function makeCardText(suit, num) {
    const cardDiv = document.createElement('div');
    cardDiv.setAttribute('id', 'card');

    const cardContainerDiv = document.createElement('div');
    cardContainerDiv.setAttribute('id', 'cardContainer');

    const cardFrontDiv = document.createElement('div');
    cardFrontDiv.setAttribute('id', 'cardFrontText');

    const cardBackDiv = document.createElement('div');
    cardBackDiv.setAttribute('id', 'cardBackText');

    const newCardValue = document.createElement("p");
    const newCardSuit = document.createElement("p");

    newCardValue.setAttribute("id", "cardValue");
    newCardSuit.setAttribute("id", "cardValue");

    let suitTxt = '';
    if (suit == 'diamonds') {
        suitTxt = '♦'; 
    } else if (suit == 'spades') {
        suitTxt = '♠';
    } else if (suit == 'clubs') {
        suitTxt = '♣';
    } else if (suit == 'hearts') {
        suitTxt = '♥';
    } else {
        suitTxt = '';
    };

    let numTxt = '';
    if (num == 'jack') {
        numTxt = 'J';
    } else if (num == 'queen') {
        numTxt = 'Q';
    } else if (num == 'king') {
        numTxt = 'K';
    } else if (num == 'ace') {
        numTxt = 'A';
    } else {
        numTxt = ''
    };

    let parsed = parseInt(num);

    if (!isNaN(parsed)) {
        newCardValue.textContent = num;
    } else {
        newCardValue.textContent = numTxt;
    };
    
    newCardSuit.textContent = suitTxt;

    cardFrontDiv.appendChild(newCardValue);
    cardFrontDiv.appendChild(newCardSuit);

    cardContainerDiv.appendChild(cardFrontDiv);
    cardContainerDiv.appendChild(cardBackDiv);

    cardDiv.appendChild(cardContainerDiv);
    cardDiv.setAttribute('class', suit);

    return cardDiv;
};

function makeCardImg(suit, num) {
    const cardDiv = document.createElement('div');
    cardDiv.setAttribute('id', 'card');

    const cardContainerDiv = document.createElement('div');
    cardContainerDiv.setAttribute('id', 'cardContainer');

    const cardFrontDiv = document.createElement('div');
    cardFrontDiv.setAttribute('id', 'cardFront');

    const cardBackDiv = document.createElement('div');
    cardBackDiv.setAttribute('id', 'cardBack');

    const imgFront = new Image();
    imgFront.src = `/assets/cards/${num}_of_${suit}.svg`;
    imgFront.setAttribute('id', 'cardImg');

    const imgBack = new Image();
    imgBack.src = `/assets/cards/Card_back.svg`;
    imgBack.setAttribute('id', 'cardImg');

    cardFrontDiv.appendChild(imgFront);
    cardBackDiv.appendChild(imgBack);

    cardContainerDiv.appendChild(cardFrontDiv);
    cardContainerDiv.appendChild(cardBackDiv);

    cardDiv.appendChild(cardContainerDiv);

    return cardDiv;
}

function makeBlankCardImg() {
    const cardDiv = document.createElement('div');
    cardDiv.setAttribute('id', 'card');

    const cardContainerDiv = document.createElement('div');
    cardContainerDiv.setAttribute('id', 'cardContainer');

    const cardFrontDiv = document.createElement('div');
    cardFrontDiv.setAttribute('id', 'cardFront');

    const cardBackDiv = document.createElement('div');
    cardBackDiv.setAttribute('id', 'cardBack');

    const imgFront = new Image();
    imgFront.src = `/assets/cards/Card_back.svg`;
    imgFront.setAttribute('id', 'cardImg');

    const imgBack = new Image();
    imgBack.src = `/assets/cards/Card_back.svg`;
    imgBack.setAttribute('id', 'cardImg');

    cardFrontDiv.appendChild(imgFront);
    cardBackDiv.appendChild(imgBack);

    cardContainerDiv.appendChild(cardFrontDiv);
    cardContainerDiv.appendChild(cardBackDiv);

    cardDiv.appendChild(cardContainerDiv);

    return cardDiv;
}

//Go 3D when battery is good.
//Disconnect handling.

//===================================================================================================three.js====================================================================
let fov = 75;
let nearClippingPlane = 0.1;
let farClippingPane = 1000;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(fov, 16/9, nearClippingPlane, farClippingPane);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( 1280, 720 );
//document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
const cube = new THREE.Mesh(geometry, material);

const cardGeometry = new THREE.PlaneGeometry(0.65, 1);
const cardMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide } );
const cardModel = new THREE.Mesh(cardGeometry, cardMaterial);

//const texture = new THREE.TextureLoader().load('/assets/cards/Card_back.svg');
const texMat = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});

cardModel.position.set(0, 0, 0);

const Card2 = new THREE.Mesh(cardGeometry, texMat);
Card2.position.x = -4;
Card2.position.y = 2.5;

const axes = new THREE.AxesHelper(100);
scene.add(cardModel);
scene.add(Card2);
scene.add(axes);

//camera.position.y = 1;
//camera.position.x = 2;
camera.position.z = 5;

function createCard(x = 0, y = 0) {
    const card = new THREE.Mesh(cardGeometry, texMat);
    card.position.set(x, y, 0);
    scene.add(card);
}

function animate() {
    requestAnimationFrame( animate);
    cardModel.rotation.y += 0.01;
    Card2.rotation.y += 0.01;

    createCard(2, 3);

    renderer.render(scene, camera);
};

console.log(renderer.domElement.getContext('webgl2'))

if ((window.WebGLRenderingContext || window.WebGLRenderingContext) && (renderer.domElement.getContext('webgl') || renderer.domElement.getContext('experimental-webgl') || renderer.domElement.getContext('webgl2'))) {
    //animate();
}

