import * as THREE from '/three.js';
import * as WebGL from '/WebGL.js'
let fov = 75;
let nearClippingPlane = 0.1;
let farClippingPane = 1000;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(fov, 16/9, nearClippingPlane, farClippingPane);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( 1280, 720 );
document.body.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0xffffff } );
const cube = new THREE.Mesh(geometry, material);

const cardGeometry = new THREE.PlaneGeometry(0.65, 1);
const cardMaterial = new THREE.MeshBasicMaterial( {color: 0xffffff, side: THREE.DoubleSide } );
const cardModel = new THREE.Mesh(cardGeometry, cardMaterial);

const texture = new THREE.TextureLoader().load('/assets/cards/1B.svg');
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

if (WebGL.isWebGLAvailable()) {
    animate();
}
