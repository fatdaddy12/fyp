var socket = io();

var form = document.getElementById('form');
var input = document.getElementById('input');

var hit = document.getElementById('hit');
var stand = document.getElementById('stand');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value);
        input.value = '';
    }
});

hit.addEventListener('click', function(e) {
    console.log('bruh');
    socket.emit('hit');
})

stand.addEventListener('click', function(e) {
    socket.emit('stand');
})

socket.on('logon', () => {
    var item = document.createElement('li');
    item.textContent = 'A user has connected.';
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
})

socket.on('logoff', () => {
    var item = document.createElement('li');
    item.textContent = 'A user has disconnected.';
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
})

socket.on('chat message', function(msg) {
    console.log("message sent");
    var item = document.createElement('li');
    item.textContent = `${msg}`;
    messages.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
});

socket.on('hitted', () => {
    console.log('hitted');
})