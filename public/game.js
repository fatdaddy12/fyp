var cards = []
var imageStore = document.getElementById('scale-image')

//Monitor Network Connection https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
var type = connection.effectiveType

console.log(`Connection type: ${type}`);

function updateConnectionStatus() {
    console.log("Connection type changed from " + type + " to " + connection.effectiveType);
    type = connection.effectiveType;
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
var width = window.screen.width;
var height = window.screen.height;

console.log(orientation);
console.log(`Resolution of screen: ${width}x${height}`);