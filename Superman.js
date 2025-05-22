// Game constants - Dynamic based on screen size
let boardWidth = window.innerWidth;
let boardHeight = window.innerHeight;
let context;
let uiContext;
let homepage = document.getElementById("homepage");
let board = document.getElementById("board");
let ui = document.getElementById("ui");
let startBtn = document.getElementById("start-btn");
let restartBtn = document.getElementById("restart-btn");
let soundBtnPause = document.getElementById("sound-btn-pause");
let muteBtnPause = document.getElementById("mute-btn-pause");
let pauseOverlay = document.getElementById("pause-overlay");
let resumeBtn = document.getElementById("resume-btn");
let powerUpImg = new Image();
let enemyImg = new Image();
let shieldActive = false;
let shieldDuration = 5000; // 5 seconds
let shieldEndTime = 0;
let powerUpArray = [];
let lastPowerUpSpawn = 0;
let powerUpSpawnInterval = 10000; // 10 seconds
let enemyArray = [];
let enemySpawnInterval = 4000; // 4 seconds
let lastEnemySpawn = 0;

// Enemy parameters
let baseEnemySpeed = -4;
let enemySpeedIncrease = -0.5; // Speed increase per level
let maxEnemySpeed = -8;        // Maximum enemy speed

// Difficulty caps
const MAX_DIFFICULTY_LEVEL = 5;
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200; // How much faster pipes spawn per level

// Superman - Scale with screen size
let SupermanWidth = Math.max(40, boardWidth * 0.08);
let SupermanHeight = Math.max(30, SupermanWidth * 0.65);
let SupermanX = boardWidth / 8;
let SupermanY = boardHeight / 2;
let SupermanImg;

let Superman = {
    x: SupermanX,
    y: SupermanY,
    width: SupermanWidth,
    height: SupermanHeight,
};

// Pipes - Scale with screen size
let pipeArray = [];
let pipeWidth = Math.max(64, boardWidth * 0.15);
let pipeHeight = boardHeight * 0.8;
let pipeX = boardWidth;
let pipeY = 0;

// Difficulty parameters
let basePipeInterval = 1700;
let minPipeInterval = 900;
let maxPipeInterval = 1720;
let basePipeGap = boardHeight / 3.2;
let minPipeGap = Math.max(90, boardHeight * 0.15);
let baseVelocityX = -Math.max(2, boardWidth * 0.005);
let maxVelocityX = -Math.max(6, boardWidth * 0.015);
let levelSpeedIncrease = -0.5;
let baseObstacleChance = 0.1;
let obstacleIncreasePerLevel = 0.05;

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
let gravity = Math.max(0.4, boardHeight * 0.0006);
let gameOver = false;
let score = 0;
let highScore = parseInt(localStorage.getItem("supermanHighScore")) || 0;
let gameStarted = false;
let pipeInterval = null;
let animationFrameId = null;
let currentLevel = 0;
let lastLevelCheckpoint = 0;
let countdown = 3;
let isCountdownActive = false;
let lastPipeGap = { top: 0, bottom: 0 }; // Stores the Y-range of the pipe gap

// Level animation
let isLevelAnimating = false;
let levelAnimationStartTime = 0;
const levelAnimationDuration = 1000;

// Sound elements
let bgMusic = new Audio('./sound/bg.mp3');
let flySound = new Audio('./sound/fly.mp3');
let hitSound = new Audio('./sound/hit.mp3');
let soundEnabled = true;
let isPaused = false;

// UI elements
const pauseBtn = document.getElementById("pause-btn");
const playBtn = document.getElementById("play-btn");
const soundBtnHome = document.getElementById("sound-btn-home");
const muteBtnHome = document.getElementById("mute-btn-home");
const soundBtnGameover = document.getElementById("sound-btn-gameover");
const muteBtnGameover = document.getElementById("mute-btn-gameover");

// Handle resize and initialize responsive dimensions
function handleResize() {
    boardWidth = window.innerWidth;
    boardHeight = window.innerHeight;
    
    // Update Superman dimensions
    SupermanWidth = Math.max(40, boardWidth * 0.08);
    SupermanHeight = Math.max(30, SupermanWidth * 0.65);
    SupermanX = boardWidth / 8;
    SupermanY = boardHeight / 2;
    
    // Update Superman object
    Superman.x = SupermanX;
    Superman.y = SupermanY;
    Superman.width = SupermanWidth;
    Superman.height = SupermanHeight;
    
    // Update pipe dimensions
    pipeWidth = Math.max(64, boardWidth * 0.15);
    pipeHeight = boardHeight * 0.8;
    pipeX = boardWidth;
    
    // Update game physics
    basePipeGap = boardHeight / 3.2;
    minPipeGap = Math.max(90, boardHeight * 0.15);
    baseVelocityX = -Math.max(2, boardWidth * 0.005);
    maxVelocityX = -Math.max(6, boardWidth * 0.015);
    gravity = Math.max(0.4, boardHeight * 0.0006);
    
    // Update canvas dimensions
    if (board && ui) {
        board.width = boardWidth;
        board.height = boardHeight;
        ui.width = boardWidth;
        ui.height = boardHeight;
    }
}

window.addEventListener('resize', handleResize);

window.onload = function () {
    // Initialize responsive dimensions
    handleResize();

    // Set up canvases with full screen dimensions
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    board.style.width = boardWidth + 'px';
    board.style.height = boardHeight + 'px';
    context = board.getContext("2d");

    // Set up UI canvas
    let uiCanvas = document.getElementById("ui");
    uiCanvas.height = boardHeight;
    uiCanvas.width = boardWidth;
    uiCanvas.style.width = boardWidth + 'px';
    uiCanvas.style.height = boardHeight + 'px';
    uiContext = uiCanvas.getContext("2d");

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

    // Event listeners
    startBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", restartGame);
    document.addEventListener("keydown", handleKeyPress);
    pauseBtn.addEventListener("click", pauseGame);
    playBtn.addEventListener("click", resumeGame);
    soundBtnHome.addEventListener("click", toggleSound);
    muteBtnHome.addEventListener("click", toggleSound);
    soundBtnGameover.addEventListener("click", toggleSound);
    muteBtnGameover.addEventListener("click", toggleSound);
    resumeBtn.addEventListener("click", resumeGame);
    soundBtnPause.addEventListener("click", toggleSound);
    muteBtnPause.addEventListener("click", toggleSound);
    document.addEventListener("touchstart", handleTouch);

    showHomepage();
};

function toggleSound() {
    soundEnabled = !soundEnabled;
    
    // Update only relevant controls based on current screen
    if (gameOver) {
        soundBtnGameover.style.display = soundEnabled ? "block" : "none";
        muteBtnGameover.style.display = soundEnabled ? "none" : "block";
    } else if (isPaused) {
        soundBtnPause.style.display = soundEnabled ? "block" : "none";
        muteBtnPause.style.display = soundEnabled ? "none" : "block";
    } else if (!gameStarted) {
        soundBtnHome.style.display = soundEnabled ? "block" : "none";
        muteBtnHome.style.display = soundEnabled ? "none" : "block";
    }

    if (soundEnabled) bgMusic.play();
    else bgMusic.pause();
}

function updateSoundDisplay() {
    const showSound = soundEnabled;
    soundBtnHome.style.display = showSound ? "block" : "none";
    muteBtnHome.style.display = showSound ? "none" : "block";
    soundBtnGameover.style.display = showSound ? "block" : "none";
    muteBtnGameover.style.display = showSound ? "none" : "block";
}

function pauseGame() {
    if (!gameStarted || gameOver) return;

    isPaused = true;
    pauseOverlay.style.display = "flex";
    pauseBtn.style.display = "none";
    playBtn.style.display = "block";
    soundBtnPause.style.display = "flex";
    bgMusic.pause();
    cancelAnimationFrame(animationFrameId);
    clearInterval(pipeInterval);
}

function resumeGame() {
    isPaused = false;
    pauseOverlay.style.display = "none";
    pauseBtn.style.display = "block";
    playBtn.style.display = "none";
    if (soundEnabled) bgMusic.play();
    pipeInterval = setDynamicPipeInterval();
    cancelAnimationFrame(animationFrameId);
    requestAnimationFrame(update);
}

function startGame() {
    gameOver = false;
    gameStarted = true;
    score = 0;
    currentLevel = 0;
    lastLevelCheckpoint = 0;
    velocityX = baseVelocityX;
    velocityY = 0;
    Superman.y = SupermanY;
    pipeArray = [];
    isLevelAnimating = false;
    
    // Hide/show elements
    homepage.style.display = "none";
    board.style.display = "block";
    ui.style.display = "block";
    startBtn.style.display = "none";
    restartBtn.style.display = "none";
    pauseBtn.style.display = "none";
    soundBtnHome.style.display = "none";
    muteBtnHome.style.display = "none";

    // Start countdown
    isCountdownActive = true;
    countdown = 3;
    animateCountdown();
}

function animateCountdown() {
    if (!isCountdownActive) return;

    // Clear canvases
    context.clearRect(0, 0, boardWidth, boardHeight);
    uiContext.clearRect(0, 0, boardWidth, boardHeight);

    // Draw Superman
    context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height);

    // Animate countdown number
    const fontSize = Math.max(60, boardWidth * 0.25) + (50 * (countdown - Math.floor(countdown)));
    const alpha = 1 - (countdown - Math.floor(countdown));
    
    uiContext.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    uiContext.font = `bold ${fontSize}px Arial`;
    uiContext.textAlign = "center";
    uiContext.fillText(Math.ceil(countdown).toString(), boardWidth/2, boardHeight/2);

    countdown -= 0.016; // Decrement by ~1/60th of a second

    if (countdown <= 0) {
        isCountdownActive = false;
        gameStarted = true;
        pauseBtn.style.display = "block";

        if (soundEnabled) bgMusic.play();
        pipeInterval = setDynamicPipeInterval();
        requestAnimationFrame(update);
    } else {
        requestAnimationFrame(animateCountdown);
    }
}

function update() {
    if (!gameStarted || gameOver || isPaused || isCountdownActive) return;
    animationFrameId = requestAnimationFrame(update);
    
    context.clearRect(0, 0, boardWidth, boardHeight);
    uiContext.clearRect(0, 0, boardWidth, boardHeight);

    currentLevel = Math.floor(score / 15);
    if (currentLevel > lastLevelCheckpoint && !isLevelAnimating) {
        isLevelAnimating = true;
        levelAnimationStartTime = Date.now();
        updateDifficulty();
    }

    // UI elements - Scale with screen size
    uiContext.fillStyle = "rgba(0, 0, 0, 0.5)";
    uiContext.fillRect(0, 0, boardWidth, Math.max(50, boardHeight * 0.08));
    uiContext.fillStyle = "#FFD700";
    uiContext.font = `${Math.max(14, boardWidth * 0.04)}px Arial`;
    uiContext.textAlign = "center";
    uiContext.fillText(`HIGH: ${highScore}`, boardWidth / 2 - boardWidth * 0.3, Math.max(30, boardHeight * 0.05));
    uiContext.textAlign = "center";
    uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, Math.max(30, boardHeight * 0.05));

    // Superman physics
    velocityY += gravity;
    Superman.y = Math.max(Superman.y + velocityY, 0);
    context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height);

    if (Superman.y > boardHeight) endGame();

    // Pipe handling
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX;
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && Superman.x > pipe.x + pipe.width) {
            score += 0.5;
            pipe.passed = true;
        }

        if (detectCollision(Superman, pipe)) {
            // Draw collision image 1x the size of Superman, centered on Superman
            drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height);
            endGame(pipe);
        }
    }

    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift();
    }

    if (currentLevel !== lastLevelCheckpoint) {
        lastLevelCheckpoint = currentLevel;
        if (pipeInterval) clearInterval(pipeInterval);
        pipeInterval = setDynamicPipeInterval();
    }

    // Score display - Scale with screen size
    uiContext.fillStyle = "#FFD700";
    uiContext.font = `bold ${Math.max(30, boardWidth * 0.1)}px 'Arial Black'`;
    uiContext.textAlign = "center";
    uiContext.fillText(Math.floor(score), boardWidth / 2, Math.max(100, boardHeight * 0.15));

    // Level animation
    if (isLevelAnimating) {
        const elapsed = Date.now() - levelAnimationStartTime;
        const progress = Math.min(elapsed / levelAnimationDuration, 1);
        uiContext.save();
        uiContext.textAlign = "center";
        uiContext.fillStyle = `rgba(255, 215, 0, ${1 - progress})`;
        uiContext.font = `bold ${Math.max(30, boardWidth * 0.08) + (20 * (1 - progress))}px Arial`;
        uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, boardHeight / 2);
        uiContext.restore();
        if (progress >= 1) isLevelAnimating = false;
    }

    // Handle shield
    if (shieldActive && Date.now() > shieldEndTime) {
        shieldActive = false;
    }

    // Draw shield if active
    if (shieldActive) {
        const timeLeft = shieldEndTime - Date.now();
        const isFlashing = timeLeft < 1000 && Math.floor(Date.now() / 100) % 2 === 0;

        const shieldSize = Math.max(50, Superman.width * 1.5);

        if (!isFlashing) {
            context.drawImage(powerUpImg,
                Superman.x - (shieldSize - Superman.width) / 2,
                Superman.y - (shieldSize - Superman.height) / 2,
                shieldSize,
                shieldSize
            );
        } else {
            // Optional flash effect using lower opacity
            context.globalAlpha = 0.5;
            context.drawImage(powerUpImg,
                Superman.x - (shieldSize - Superman.width) / 2,
                Superman.y - (shieldSize - Superman.height) / 2,
                shieldSize,
                shieldSize
            );
            context.globalAlpha = 1.0; // Reset transparency
        }

        // Auto-disable shield
        if (timeLeft <= 0) {
            shieldActive = false;
        }
    }

    // Handle powerups
    for (let i = powerUpArray.length - 1; i >= 0; i--) {
        let p = powerUpArray[i];
        p.x += velocityX;
        context.drawImage(p.img, p.x, p.y, p.width, p.height);
        
        if (detectCollision(Superman, p)) {
            shieldActive = true;
            shieldEndTime = Date.now() + shieldDuration;
            powerUpArray.splice(i, 1);
        }
        
        if (p.x < -p.width) powerUpArray.splice(i, 1);
    }

    // Handle enemies
    for (let i = enemyArray.length - 1; i >= 0; i--) {
        let e = enemyArray[i];
        e.x += e.speed;
        context.drawImage(e.img, e.x, e.y, e.width, e.height);
        
        if (!shieldActive && detectCollision(Superman, e)) {
            // Draw collision image 1x the size of Superman, centered on Superman
            drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height);
            endGame();
        }
        
        if (e.x < -e.width) enemyArray.splice(i, 1);
    }

    const now = Date.now();

    if (now - lastPowerUpSpawn > powerUpSpawnInterval) {
        spawnPowerUp();
        lastPowerUpSpawn = now;
    }

    if (now - lastEnemySpawn > enemySpawnInterval) {
        spawnEnemy();
        lastEnemySpawn = now;
    }
}

function updateDifficulty() {
    // Cap level at MAX_DIFFICULTY_LEVEL for speed calculations
    const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL);
    velocityX = baseVelocityX + (levelSpeedIncrease * effectiveLevel);
    velocityX = Math.max(maxVelocityX, velocityX);
}

function placePipes() {
    if (gameOver || !gameStarted) return;
    
    const currentGap = basePipeGap;
    let minPipeY = -pipeHeight + 50;
    let maxPipeY = 0 - currentGap - 150;
    let randomPipeY = Math.random() * (maxPipeY - minPipeY) + minPipeY;

    let gapTopY = randomPipeY + pipeHeight;
    let gapBottomY = gapTopY + basePipeGap;
    lastPipeGap = { top: gapTopY, bottom: gapBottomY }; // Save the current gap

    let obstacleChance = baseObstacleChance + currentLevel * obstacleIncreasePerLevel;
    obstacleChance = Math.min(obstacleChance, 0.75);

    // Restore original pipe type logic
    let topPipeType = Math.random() < obstacleChance ? "obstacle" : "normal";
    let bottomPipeType = Math.random() < obstacleChance ? "obstacle" : "normal";

    let topImg = topPipeType === "obstacle" ? newTopPipeImg : topPipeImg;
    let bottomImg = bottomPipeType === "obstacle" ? newBottomPipeImg : bottomPipeImg;

    pipeArray.push({
        img: topImg,
        x: pipeX,
        y: randomPipeY,
