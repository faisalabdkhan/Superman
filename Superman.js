// game.js

const board = document.getElementById("game-canvas");
const context = board.getContext("2d");
const ui = document.getElementById("ui-canvas");
const uiContext = ui.getContext("2d");

const pauseBtn = document.getElementById("pause-button");
const restartBtn = document.getElementById("restart-button");
const homepage = document.getElementById("homepage");
const soundBtnGameover = document.getElementById("sound-on");
const muteBtnGameover = document.getElementById("sound-off");

let gameStarted = false;
let gameOver = false;
let isPaused = false;
let isCountdownActive = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("supermanHighScore")) || 0;
let currentLevel = 0;
let lastLevelCheckpoint = 0;
let velocityX = 3;
let velocityY = 0;
let baseVelocityX = 3;
let SupermanY = 150;
let pipeArray = [];
let shieldActive = false;
let powerUpArray = [];
let enemyArray = [];
let isLevelAnimating = false;
let pipeInterval = null;
let animationFrameId = null;
let boardWidth = board.width = window.innerWidth;
let boardHeight = board.height = window.innerHeight;
ui.width = boardWidth;
ui.height = boardHeight;

let soundEnabled = true;
const bgMusic = new Audio("assets/bg-music.mp3");
const flySound = new Audio("assets/fly.mp3");
const hitSound = new Audio("assets/hit.mp3");

const collisionImg = new Image();
collisionImg.src = "assets/collision.png";
const gameOverImg = new Image();
gameOverImg.src = "assets/game-over.png";
const highScoreImg = new Image();
highScoreImg.src = "assets/high-score.png";
const powerUpImg = new Image();
powerUpImg.src = "assets/power-up.png";
const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";

function handleKeyPress(e) {
  if (e.code === "KeyM") toggleSound();
  if (isCountdownActive) return;
  if (e.code === "KeyP" && !gameOver) {
    isPaused ? resumeGame() : pauseGame();
  }
  if (!gameStarted && !gameOver && ["Space", "ArrowUp"].includes(e.code)) {
    startGame();
    return;
  }
  if (gameStarted && !gameOver && ["Space", "ArrowUp"].includes(e.code)) {
    velocityY = -6;
    if (soundEnabled) {
      flySound.currentTime = 0;
      flySound.play();
    }
  }
  if (gameOver && e.code === "Enter") restartGame();
}

function handleTouch(e) {
  e.preventDefault();
  if (isCountdownActive) return;
  if (!gameStarted && !gameOver) return startGame();
  if (gameOver) return restartGame();
  if (gameStarted && !gameOver && !isPaused) {
    velocityY = -6;
    if (soundEnabled) {
      flySound.currentTime = 0;
      flySound.play();
    }
  }
  if (isPaused) resumeGame();
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  bgMusic[soundEnabled ? "play" : "pause"]();
}

function restartGame() {
  clearInterval(pipeInterval);
  cancelAnimationFrame(animationFrameId);
  gameOver = false;
  gameStarted = false;
  score = 0;
  currentLevel = 0;
  lastLevelCheckpoint = 0;
  velocityX = baseVelocityX;
  velocityY = 0;
  SupermanY = 150;
  pipeArray = [];
  powerUpArray = [];
  enemyArray = [];
  isLevelAnimating = false;
  shieldActive = false;
  context.clearRect(0, 0, board.width, board.height);
  uiContext.clearRect(0, 0, board.width, board.height);
  if (soundEnabled) bgMusic.play();
  showHomepage();
  document.getElementById("powerup-count").textContent = "Double Jumps: 0";
}

function endGame() {
  gameOver = true;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("supermanHighScore", highScore);
  }
  pauseBtn.style.display = "none";
  board.style.display = "block";
  homepage.style.display = "none";
  ui.style.display = "block";
  restartBtn.style.display = "block";
  uiContext.clearRect(0, 0, board.width, board.height);
  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)";
  uiContext.fillRect(0, 0, boardWidth, boardHeight);
  const centerX = boardWidth / 2;
  uiContext.drawImage(gameOverImg, centerX - 225, 95, 450, 200);
  uiContext.fillStyle = "#FFD700";
  uiContext.font = "bold 45px 'Arial Black'";
  uiContext.textAlign = "center";
  uiContext.fillText(Math.floor(score), centerX, 100);
  uiContext.drawImage(highScoreImg, centerX - 110, 280, 150, 80);
  uiContext.fillText(highScore, centerX + 75, 330);
  soundBtnGameover.style.display = soundEnabled ? "block" : "none";
  muteBtnGameover.style.display = soundEnabled ? "none" : "block";
  clearInterval(pipeInterval);
  bgMusic.pause();
  if (soundEnabled) {
    hitSound.currentTime = 0;
    hitSound.play();
  }
  document.getElementById("powerup-count").style.display = "none";
}

function spawnPowerUp() {
  powerUpArray.push({
    img: powerUpImg,
    x: boardWidth,
    y: Math.random() * (boardHeight - 40),
    width: 40,
    height: 40,
  });
}

function spawnEnemy() {
  let enemyHeight = 40;
  let y;
  let tries = 0;
  do {
    y = Math.random() * (boardHeight - enemyHeight);
    tries++;
  } while (tries < 10);

  let speed = 3 + Math.random();
  enemyArray.push({
    img: enemyImg,
    x: boardWidth,
    y,
    width: 60,
    height: enemyHeight,
    speed,
  });
}

function detectCollision(a, b) {
  if (shieldActive) return false;
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function drawCollisionEffect(x, y, width, height) {
  context.drawImage(collisionImg, x, y, width, height);
}

function showHomepage() {
  homepage.style.display = "flex";
  restartBtn.style.display = "none";
}

document.addEventListener("keydown", handleKeyPress);
document.addEventListener("touchstart", handleTouch, { passive: false });
