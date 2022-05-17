var socket = io();

var form = document.getElementById('chatForm');
var input = document.getElementById('input');
var messages = document.getElementById('messages');

form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', input.value, username, roomName);
        input.value = '';
    }
});

socket.on('room joined', (roomName) => {
    var item = document.createElement('li');
    item.textContent = `You have joined room: ${roomName}`;
    messages.appendChild(item);
    //window.scrollTo(0, document.body.scrollHeight);
})

socket.on('logoff', (id) => {
    var item = document.createElement('li');
    item.textContent = `User ${id} has disconnected.`;
    messages.appendChild(item);
    //window.scrollTo(0, document.body.scrollHeight);
})

socket.on('chat message', function(msg, username) {
    var item = document.createElement('li');
    item.textContent = `${username}: ${msg}`;
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
});
