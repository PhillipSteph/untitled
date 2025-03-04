import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
const cwidth = 1400;
const cheight = 900;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, cwidth / cheight, 0.1, 1000);
const keys = {
  ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
  w: false, s: false, a: false, d: false
};
const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
const gridSize = 1000;
const gridDivisions = 500;
const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x808080, 0x808080);

let lastTime = performance.now();
let frameCount = 0;
let fps = 60;
let maxfps = fps;
let score = 0;
let scoreCounter = 0;
let mouseX = 0;
let mouseY = 0;
let isMovingToMouse = false;
let speedfactor = 0.05;
let speed = 0.035 + 0.3*speedfactor;
let stepupscore = 10000;
let scorebetween = 0;
let radius = 1;
let targetRadius = radius; // Target radius for smooth animation
let geometry = new THREE.SphereGeometry(radius, 16, 16);
let sphere = new THREE.Mesh(geometry, material);
let balls = [];
  scene.add(sphere);
  camera.position.z = 9;
let targetCameraZ = camera.position.z;
let ballcounter = 0;
let disappearcounter = 0;
let enemycounter = 0;
let enemymaxcounter = 10;
  renderer.setSize(cwidth, cheight);
  gridHelper.position.set(0, 0, -3);
  gridHelper.rotation.x = Math.PI / 2;
  scene.add(gridHelper);

class Ball {
  constructor(x, y, z, ballradius, color, type = "normal") {
    this.geometry = new THREE.SphereGeometry(
      Math.abs(ballradius), // Ensure radius is positive
      Math.floor(Math.abs(ballradius) / radius * 8),
      Math.floor(Math.abs(ballradius) / radius * 8)
    );
    const material = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true
    });
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.position.set(x, y, z);
    this.radius = Math.abs(ballradius); // Ensure the radius is always positive
    this.color = color;
    this.type = type; // "normal" or "shrink"
    scene.add(this.mesh);
  }
  getmeshRotationX(){
    return this.mesh.rotation.x;
  }
  getmeshRotationY(){
    return this.mesh.rotation.y;
  }
  setmeshRotation(x,y){
      this.mesh.rotation.x = x;
      this.mesh.rotation.y = y;
  }
  update() {
    this.mesh.rotation.x += 0.01 * 60 / fps;
    this.mesh.rotation.y += 0.01 * 60 / fps;
  }
  move(dx, dy, dz) {
    this.mesh.position.set(this.mesh.position.x + dx, this.mesh.position.y + dy, this.mesh.position.z + dz);
  }
  isCompletelyInside(sphere) {
    const distance = this.mesh.position.distanceTo(sphere.position);
    return distance + this.radius <= sphere.geometry.parameters.radius;
  }
}
function increaseradius(increase) {
  // Set target radius for smooth animation
  targetRadius += increase;
  speed = 0.035 + 0.3 * targetRadius * speedfactor;
  let beforescore = score;
  score = Math.floor((targetRadius - 1) * 10000) + scorebetween;
  if(Math.floor(beforescore/stepupscore) === Math.floor(score/stepupscore) + 1 || Math.floor(beforescore/stepupscore) === Math.floor(score/stepupscore) - 1){
      targetCameraZ = 9 + (radius-1)*9
      stepupscore *= 2;
  }
}
function makeFPSGreatAgain(){
  let factor = radius;
  radius = 1;
  targetRadius = 1;
  scorebetween = score;
    let newballs = [];
    balls.forEach(ball => {
        // Scale the radius
        let newRadius = ball.radius / factor;
        let direction = ball.mesh.position.clone().sub(sphere.position).normalize();

        // Scale the distance from the main sphere
        let newPosition = sphere.position.clone().add(direction.multiplyScalar(ball.mesh.position.distanceTo(sphere.position) / factor));

        // Remove old ball and add a scaled-down version
        scene.remove(ball.mesh);
        ball.mesh.geometry.dispose();
        ball.mesh.material.dispose();
        newballs[balls.indexOf(ball)] = new Ball(newPosition.x, newPosition.y, newPosition.z, newRadius, ball.color, ball.type);
        newballs[balls.indexOf(ball)].setmeshRotation(ball.getmeshRotationX(),ball.getmeshRotationY());
    });
    balls = newballs;
    camera.position.z = 9;
    targetCameraZ = 9;
}

function moveallballs(dx, dy, dz) {
  balls.forEach(ball => ball.move(dx, dy, dz));
  gridHelper.position.x += dx;
  gridHelper.position.y += dy;
}

window.addEventListener('wheel', (e) => {
  camera.position.z += e.deltaY * 0.01; // Adjust zoom speed as needed
  camera.position.z = Math.max(1, camera.position.z); // Prevent zooming too close
});

window.addEventListener('keydown', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
  }
});

window.addEventListener('keyup', (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
});
window.addEventListener('mousedown', (event) => {
  if (event.button === 0) { // Left click
    isMovingToMouse = true;
  }
});

window.addEventListener('mouseup', (event) => {
  if (event.button === 0) { // Left click released
    isMovingToMouse = false;
  }
});
window.addEventListener('mousemove', (event) => {
  // Get pixel coordinates relative to the canvas
  const rect = canvas.getBoundingClientRect();
  mouseX = event.clientX - rect.left;
  mouseY = event.clientY - rect.top;
});
function calculateFPS() {
  let now = performance.now();
  frameCount++;

  if (now - lastTime >= 1000) { // Every 1 second
    fps = frameCount;
    frameCount = 0;
    lastTime = now;
  }

  requestAnimationFrame(calculateFPS);
}
function getrandomcolor() {
  var r = Math.random()*10;
  if(r>5) return 0xFF0000
  return 0xFFFFFF
}

function getrandomradius(radius) {
  return (radius * 0.3 - Math.random() * radius * 0.25);
}

function getcolorofbiggest(ball, nearestBall) {
    if(ball.radius>nearestBall.radius) return ball.color;
    return nearestBall.color;
}

function forcegravityonballs() {
  const toRemove = new Set();
  const toAdd = [];

  balls.forEach((ball, index) => {
    if (toRemove.has(ball)) return;

    if (ball.type === "shrink") {
      // Move shrink balls toward the sphere (player)
      let direction = sphere.position.clone().sub(ball.mesh.position).normalize();
      ball.move(direction.x * speed * 0.5 * 60 / fps, direction.y * speed * 0.5 * 60 / fps, direction.z * speed * 0.5 * 60 / fps);
    } else {
      const nearestBall = getnearestball(ball);

      if (nearestBall && !toRemove.has(nearestBall)) {
        let direction = nearestBall.mesh.position.clone().sub(ball.mesh.position);
        let distance = direction.length();
        let spheredirection = sphere.position.clone().sub(ball.mesh.position);
        let spheredistance = spheredirection.length();
        let spherenearer = false;
        if (spheredistance - radius + nearestBall.radius <= distance) {
          direction = spheredirection;
          distance = spheredistance;
          spherenearer = true;
        }

        if (distance > 0) {
          direction.normalize();
          let speedFactor = 1 / (distance * 1000);

          if (ball.color === nearestBall.color && !spherenearer) {
            direction.x = -direction.x;
            direction.y = -direction.y;
          }
          if (spherenearer) {
            direction.x *= 3;
            direction.y *= 3;
          }
          ball.move(direction.x * speedFactor * 60 / fps, direction.y * speedFactor * 60 / fps, direction.z * speedFactor * 60 / fps);

          if (distance < (ball.radius + nearestBall.radius) / 2 && !spherenearer && nearestBall.type === "normal") {
            toRemove.add(ball);
            toRemove.add(nearestBall);
            let newRadius = (ball.radius + nearestBall.radius);
            if (newRadius >= radius * 0.7) newRadius = radius * 0.7;
            let newPosition = ball.mesh.position.clone().add(nearestBall.mesh.position).multiplyScalar(0.5);
            let newBall = new Ball(newPosition.x, newPosition.y, newPosition.z, newRadius, getcolorofbiggest(ball,nearestBall));
            toAdd.push(newBall);
          }
        }
      }
    }
  });

  toRemove.forEach(ball => {
    scene.remove(ball.mesh);
    balls.splice(balls.indexOf(ball), 1);
  });

  balls.push(...toAdd);
}

function getnearestball(targetBall) {
  let nearestBall = null;
  let minDistance = Infinity;

  balls.forEach(ball => {
    if (ball !== targetBall) { // Avoid comparing the ball to itself
      const distance = ball.mesh.position.distanceTo(targetBall.mesh.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearestBall = ball;
      }
    }
  });

  return nearestBall;
}

function checkIfBallIsInsideSphere() {
  balls.forEach((ball, index) => {
    if (ball.isCompletelyInside(sphere) && ball.radius < sphere.geometry.parameters.radius) {
      scene.remove(ball.mesh);
      balls.splice(index, 1);
      if(ball.type === "shrink"){
        increaseradius( - (ball.radius / 20));
        enemycounter--;
      } else {
        increaseradius(ball.radius / 20);
      }
    }
  });
}

function spawnEnemyIfPossible() {
  if (disappearcounter > 60 && balls.length >= 20 && enemycounter < enemymaxcounter) {
    // Find the ball furthest away from the camera
    let maxDistance = -Infinity;
    let ballToRemoveIndex = -1;

    balls.forEach((ball, index) => {
      let distance = ball.mesh.position.distanceTo(camera.position);
      if (distance > maxDistance) {
        maxDistance = distance;
        ballToRemoveIndex = index;
      }
    });

    if (ballToRemoveIndex !== -1) {
      let ballToRemove = balls[ballToRemoveIndex];

      // Remove the ball from the scene
      scene.remove(ballToRemove.mesh);

      // Replace it with a "shrink" ball
      balls[ballToRemoveIndex] = new Ball(
        ballToRemove.mesh.position.x,
        ballToRemove.mesh.position.y,
        0,
        ballToRemove.radius,
        0xFFA500,
        "shrink"
      );

      disappearcounter = 0;
      enemycounter++;
    }
  }
}

function spawnNewBallIfPossible() {
  if (ballcounter >= 20 && balls.length <= 200) {
    let x = sphere.position.x + (Math.random() * 40 * radius - 20 * radius);
    let y = sphere.position.y + (Math.random() * 40 * radius - 20 * radius);
    let z = sphere.position.z;
    ballcounter = 0;
    balls.push(new Ball(x, y, z, getrandomradius(radius), getrandomcolor()));
  }
}

function checkDebugInputs() {
  if (keys.a && keys.s && keys.d && keys.w && keys.ArrowUp){
    for( let i = 0;i<100;i++){
      let x = sphere.position.x + (Math.random() * 40 * radius - 20 * radius);
      let y = sphere.position.y + (Math.random() * 40 * radius - 20 * radius);
      let z = sphere.position.z;
      balls.push(new Ball(x, y, z, getrandomradius(radius), getrandomcolor()));
    }
  }
  if (keys.a && keys.s && keys.d && keys.w && keys.ArrowDown) makeFPSGreatAgain();
}

function updateSphere() {
  radius += (targetRadius - radius) / 10;
  geometry = new THREE.SphereGeometry(radius, 16, 16);
  sphere.geometry = geometry;
  sphere.rotation.set(sphere.rotation.x, sphere.rotation.y, sphere.rotation.z);
  sphere.rotation.x += 0.01 * 60 / fps;
  sphere.rotation.y += 0.01 * 60 / fps;
}

function handleMovement() {
  let dx = 0, dy = 0, dz = 0;

  if (isMovingToMouse) {
    let diffX = mouseX - cwidth / 2;
    let diffY = mouseY - cheight / 2;
    let distance = Math.sqrt(diffX * diffX + diffY * diffY);
    if (distance > 1) {
      dx = -(diffX / distance) * speed;
      dy = (diffY / distance) * speed;
    }
  }

  if (keys.ArrowUp || keys.w) dy -= speed;
  if (keys.ArrowDown || keys.s) dy += speed;
  if (keys.ArrowLeft || keys.a) dx += speed;
  if (keys.ArrowRight || keys.d) dx -= speed;

  let magnitude = Math.sqrt(dx * dx + dy * dy);
  if (magnitude > 0) {
    dx /= magnitude;
    dy /= magnitude;
  }

  moveallballs(dx * speed * 60 / fps, dy * speed * 60 / fps, dz);
}

function update() {
  ballcounter++;
  disappearcounter++;
  updateSphere();
  checkIfBallIsInsideSphere();
  forcegravityonballs();
  spawnEnemyIfPossible();
  spawnNewBallIfPossible();
  checkDebugInputs();
  handleMovement();

  balls.forEach(ball => ball.update());

  if(fps>maxfps) maxfps = fps;

  for(let i = Math.abs(score)/1000;i>0;i--){
    if(score>scoreCounter)      scoreCounter++;
    else if(score<scoreCounter) scoreCounter--;
    document.getElementById("score").innerText = scoreCounter + " pt";
  }

  if(targetCameraZ > camera.position.z || targetCameraZ < camera.position.z){
    camera.position.z+=((targetCameraZ-camera.position.z)/100)
  }
}

function redraw() {
  renderer.render(scene, camera);
}
function gameLoop() {
  update();
  redraw();
  requestAnimationFrame(gameLoop);
}
// Start the game loop
calculateFPS();
gameLoop();

