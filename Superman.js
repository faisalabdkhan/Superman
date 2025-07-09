// Game constants
const boardWidth = 360;
const boardHeight = 640;
let context;
let uiContext;
const homepage = document.getElementById("homepage");
let board = document.getElementById("board");
const ui = document.getElementById("ui");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");
const soundBtnPause = document.getElementById("sound-btn-pause");
const muteBtnPause = document.getElementById("mute-btn-pause");
const pauseOverlay = document.getElementById("pause-overlay");
const resumeBtn = document.getElementById("resume-btn");
const powerUpImg = new Image();
const enemyImg = new Image();
let shieldActive = false;
const shieldDuration = 5000; // 5 seconds
let shieldEndTime = 0;
let powerUpArray = [];
let lastPowerUpSpawn = 0;
const powerUpSpawnInterval = 10000; // 10 seconds
let enemyArray = [];
const enemySpawnInterval = 4000; // 4 seconds
let lastEnemySpawn = 0;
const baseEnemySpeed = -4;
const enemySpeedIncrease = -0.5;
const maxEnemySpeed = -8;
const MAX_DIFFICULTY_LEVEL = 5;
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200;

// Device detection
let isDesktop = false;
let isMobile = false;

// Superman
const SupermanWidth = 74.8;
const SupermanHeight = 32.4;
const SupermanX = boardWidth / 8;
const SupermanY = boardHeight / 2;
let SupermanImg;

const Superman = {
  x: SupermanX,
  y: SupermanY,
  width: SupermanWidth,
  height: SupermanHeight
};

// Pipes
let pipeArray = [];
const pipeWidth = 64;
const pipeHeight = 512;
const pipeX = boardWidth;
const pipeY = 0;

// Difficulty parameters
const basePipeInterval = 1700;
const minPipeInterval = 900;
const maxPipeInterval = 1720;
const basePipeGap = boardHeight / 3.2;
const minPipeGap = 90;
const baseVelocityX = -2;
const maxVelocityX = -6;
const levelSpeedIncrease = -0.5;
const baseObstacleChance = 0.1;
const obstacleIncreasePerLevel = 0.05;

// Images
let topPipeImg;
let bottomPipeImg;
let newTopPipeImg;
let newBottomPipeImg;
let gameOverImg;
let yourScoreImg;
let highScoreImg;
let collisionImg;

// Game variables
let velocityX = baseVelocityX;
let velocityY = 0;
const gravity = 0.4;
let gameOver = false;
let score = 0;
let highScore = Number.parseInt(localStorage.getItem("supermanHighScore")) || 0;
let gameStarted = false;
let pipeInterval = null;
let animationFrameId = null;
let currentLevel = 0;
let lastLevelCheckpoint = 0;
let countdown = 3;
let isCountdownActive = false;
let lastPipeGap = { top: 0, bottom: 0 };

// Sound elements
const bgMusic = new Audio("./sounds/bg.mp3");
const flySound = new Audio("./sounds/fly.mp3");
const hitSound = new Audio("./sounds/hit.mp3");
let soundEnabled = true;
let isPaused = false;

// UI elements
const pauseBtn = document.getElementById("pause-btn");
const playBtn = document.getElementById("play-btn");
const soundBtnHome = document.getElementById("sound-btn-home");
const muteBtnHome = document.getElementById("mute-btn-home");
const soundBtnGameover = document.getElementById("sound-btn-gameover");
const muteBtnGameover = document.getElementById("mute-btn-gameover");

// Initialize game
window.onload = () => {
  board = document.getElementById("board");
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d", { alpha: false });
  board.style.willChange = 'transform';
  board.style.transform = 'translateZ(0)';

  const uiCanvas = document.getElementById("ui");
  uiCanvas.height = boardHeight;
  uiCanvas.width = boardWidth;
  uiContext = uiCanvas.getContext("2d", { alpha: false });
  uiCanvas.style.willChange = 'transform';
  uiCanvas.style.transform = 'translateZ(0)';

  detectDevice();
  updateCanvasSize();

  // Load images
  powerUpImg.src = "./images/powerups.png";
  enemyImg.src = "./images/enemy.png";
  SupermanImg = new Image();
  SupermanImg.src = "./images/superman1.png";
  topPipeImg = new Image();
  topPipeImg.src = "./images/toppipe.png";
  bottomPipeImg = new Image();
  bottomPipeImg.src = "./images/bottompipe.png";
  newTopPipeImg = new Image();
  newTopPipeImg.src = "./images/pipe11.png";
  newBottomPipeImg = new Image();
  newBottomPipeImg.src = "./images/pipe1.png";
  gameOverImg = new Image();
  gameOverImg.src = "./images/gameover.png";
  highScoreImg = new Image();
  highScoreImg.src = "./images/highscore.png";
  collisionImg = new Image();
  collisionImg.src = "./images/collision.png";

  // Initialize sound
  bgMusic.loop = true;
  updateSoundDisplay();

  // Setup event listeners
  setupEventListeners();
  showHomepage();

  // iOS specific optimizations
  if (isMobile) {
    document.addEventListener("touchmove", (e) => {
      e.preventDefault();
    }, { passive: false });

    document.addEventListener("touchstart", (e) => {
      e.preventDefault();
    }, { passive: false });
  }
};

// ... rest of your existing JavaScript functions with these optimizations:

// 1. In update() function, reduce the number of draw calls
// 2. Use requestAnimationFrame efficiently
// 3. Optimize collision detection
// 4. Simplify physics calculations
// 5. Add frame skipping for very slow devices

function detectCollision(a, b) {
  if (shieldActive) return false;
  
  // Simple AABB collision with early exits
  if (a.x + a.width < b.x) return false;
  if (a.x > b.x + b.width) return false;
  if (a.y + a.height < b.y) return false;
  if (a.y > b.y + b.height) return false;
  
  return true;
}

function update() {
  if (!gameStarted || gameOver || isPaused || isCountdownActive) {
    return;
  }

  // Use timestamp for consistent animation
  animationFrameId = requestAnimationFrame(update);

  // Clear canvases efficiently
  context.clearRect(0, 0, boardWidth, boardHeight);
  uiContext.clearRect(0, 0, boardWidth, boardHeight);

  // Batch drawing operations
  context.save();
  uiContext.save();

  // ... rest of your update logic

  context.restore();
  uiContext.restore();
}

// Add frame skipping for slow devices
let lastFrameTime = 0;
const targetFPS = 60;
const frameTime = 1000 / targetFPS;

function optimizedUpdate(timestamp) {
  if (!gameStarted || gameOver || isPaused || isCountdownActive) return;

  if (timestamp - lastFrameTime >= frameTime) {
    lastFrameTime = timestamp;
    update();
  }
  animationFrameId = requestAnimationFrame(optimizedUpdate);
}

// Replace your existing update call with:
// animationFrameId = requestAnimationFrame(optimizedUpdate);