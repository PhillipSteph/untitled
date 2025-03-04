import * as THREE from 'https://unpkg.com/three@0.155.0/build/three.module.js';

const canvas = document.getElementById('canvas');
const renderer = new THREE.WebGLRenderer({ canvas });
const cwidth = 1400;
const cheight = 900;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, cwidth / cheight, 0.1, 1000);

let score = 0;
let scoreCounter = 0;
let mouseX = 0;
let mouseY = 0;
let isMovingToMouse = false;
let speedfactor = 0.05;
let speed = 0.035 + 0.3*speedfactor;
let stepupscore = 10000;
let scorebetween = 0;

renderer.setSize(cwidth, cheight);

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
    this.mesh.rotation.x += 0.01;
    this.mesh.rotation.y += 0.01;
  }
  move(dx, dy, dz) {
    this.mesh.position.set(this.mesh.position.x + dx, this.mesh.position.y + dy, this.mesh.position.z + dz);
  }
  isCompletelyInside(sphere) {
    const distance = this.mesh.position.distanceTo(sphere.position);
    return distance + this.radius <= sphere.geometry.parameters.radius;
  }
}

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  w: false,
  s: false,
  a: false,
  d: false
};
const material = new THREE.MeshBasicMaterial({ color: 0x0000ff, wireframe: true });
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
  balls.forEach(ball => ball.move(dx, -dy, dz));
}

window.addEventListener('wheel', (e) => {
  camera.position.z += e.deltaY * 0.01; // Adjust zoom speed as needed
  camera.position.z = Math.max(1, camera.position.z); // Prevent zooming too close
  console.log("cameraZ: "+camera.position.z)
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
      ball.move(direction.x * speed * 0.5, direction.y * speed * 0.5, direction.z * speed * 0.5);
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
          ball.move(direction.x * speedFactor, direction.y * speedFactor, direction.z * speedFactor);

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

function update() {
  ballcounter++;
  disappearcounter++;

  // Store rotation
  const rotationX = sphere.rotation.x;
  const rotationY = sphere.rotation.y;
  const rotationZ = sphere.rotation.z;

  // Smoothly adjust radius
  radius += (targetRadius - radius) / 10;
  geometry = new THREE.SphereGeometry(radius, 16, 16);
  sphere.geometry = geometry;

  // Reapply rotation
  sphere.rotation.set(rotationX, rotationY, rotationZ);

  balls.forEach((ball, index) => {
    if (ball.isCompletelyInside(sphere) && ball.radius < sphere.geometry.parameters.radius) {
      scene.remove(ball.mesh);
      balls.splice(index, 1);
      if(ball.type === "shrink"){
        increaseradius( - (ball.radius / 30));
        enemycounter--;
      } else {
        increaseradius(ball.radius / 30);
      }
    }
  });

  forcegravityonballs();
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
      console.log(enemycounter);
    }
  }

  if (ballcounter >= 20 && balls.length <= 200) {
    let x = sphere.position.x + (Math.random() * 40 * radius - 20 * radius);
    let y = sphere.position.y + (Math.random() * 40 * radius - 20 * radius);
    let z = sphere.position.z;
    ballcounter = 0;
    balls.push(new Ball(x, y, z, getrandomradius(radius), getrandomcolor()));
  }

  balls.forEach(ball => ball.update());

  let dx = 0, dy = 0, dz = 0;

  if (isMovingToMouse) {
    let diffX = mouseX - cwidth / 2;
    let diffY = mouseY - cheight / 2;
    let distance = Math.sqrt(diffX * diffX + diffY * diffY);
    if (distance > 1) {
      dx = -(diffX / distance) * speed;
      dy = -(diffY / distance) * speed;
    }
  }

  if (keys.ArrowUp || keys.w) dy += speed;
  if (keys.ArrowDown || keys.s) dy -= speed;
  if (keys.ArrowLeft || keys.a) dx += speed;
  if (keys.ArrowRight || keys.d) dx -= speed;
  if (keys.a && keys.s && keys.d && keys.w && keys.ArrowUp){
    for( let i = 0;i<100;i++){
      let x = sphere.position.x + (Math.random() * 40 * radius - 20 * radius);
      let y = sphere.position.y + (Math.random() * 40 * radius - 20 * radius);
      let z = sphere.position.z;
      balls.push(new Ball(x, y, z, getrandomradius(radius), getrandomcolor()));
    }
  }
    if (keys.a && keys.s && keys.d && keys.w && keys.ArrowDown) makeFPSGreatAgain();

        const magnitude = Math.sqrt(dx * dx + dy * dy);
  if (magnitude > 0) {
    dx /= magnitude;
    dy /= magnitude;
  }

  for(let i = Math.abs(score)/1000;i>0;i--){
    if(score>scoreCounter) scoreCounter++;
    else if(score<scoreCounter) scoreCounter--;
    document.getElementById("score").innerText = scoreCounter+" pt"
  }
  moveallballs(dx * speed, dy * speed, dz);

  if(targetCameraZ > camera.position.z || targetCameraZ < camera.position.z){
    camera.position.z+=((targetCameraZ-camera.position.z)/100)
  }

  // Add rotation back
  sphere.rotation.x += 0.01;
  sphere.rotation.y += 0.01;
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
gameLoop();
