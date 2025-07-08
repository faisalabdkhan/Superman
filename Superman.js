// Game constants with responsive scaling
let baseWidth = 360;
let baseHeight = 640;
let boardWidth = baseWidth;
let boardHeight = baseHeight;
let scale = 1;
let dpr = 1;

let context;
let uiContext;
let homepage = document.getElementById("homepage");
let board = document.getElementById("board");
let ui = document.getElementById("ui");

// Button references
let startBtn = document.getElementById("start-btn");
let restartBtn = document.getElementById("restart-btn");
let soundBtnPause = document.getElementById("sound-btn-pause");
let muteBtnPause = document.getElementById("mute-btn-pause");
let pauseOverlay = document.getElementById("pause-overlay");
let resumeBtn = document.getElementById("resume-btn");

// Game objects and arrays
let powerUpImg = new Image();
let enemyImg = new Image();
let shieldActive = false;
let shieldDuration = 5000;
let shieldEndTime = 0;
let powerUpArray = [];
let lastPowerUpSpawn = 0;
let powerUpSpawnInterval = 10000;
let enemyArray = [];
let enemySpawnInterval = 4000;
let lastEnemySpawn = 0;

// Enemy parameters
let baseEnemySpeed = -4;
let enemySpeedIncrease = -0.5;
let maxEnemySpeed = -8;

// Difficulty caps
const MAX_DIFFICULTY_LEVEL = 5;
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200;

// Superman
let SupermanWidth = 74.8;
let SupermanHeight = 32.4;
let SupermanX = boardWidth / 8;
let SupermanY = boardHeight / 2;
let SupermanImg;

let Superman = {
    x: SupermanX,
    y: SupermanY,
    width: SupermanWidth,
    height: SupermanHeight,
};

// Pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

// Difficulty parameters
let basePipeInterval = 1700;
let minPipeInterval = 900;
let maxPipeInterval = 1720;
let basePipeGap = boardHeight / 3.2;
let minPipeGap = 90;
let baseVelocityX = -2;
let maxVelocityX = -6;
let levelSpeedIncrease = -0.5;
let baseObstacleChance = 0.1;
let obstacleIncreasePerLevel = 0.05;

// Images
let topPipeImg = new Image();
let bottomPipeImg = new Image();
let newTopPipeImg = new Image();
let newBottomPipeImg = new Image();
let gameOverImg = new Image();
let yourScoreImg = new Image();
let highScoreImg = new Image();
let collisionImg = new Image();

// Game variables
let velocityX = baseVelocityX;
let velocityY = 0;
let gravity = 0.4;
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
let lastPipeGap = { top: 0, bottom: 0 };

// Level animation
let isLevelAnimating = false;
let levelAnimationStartTime = 0;
const levelAnimationDuration = 1000;

// Sound elements
let bgMusic = new Audio('./sounds/bg.mp3');
let flySound = new Audio('./sounds/fly.mp3');
let hitSound = new Audio('./sounds/hit.mp3');
let soundEnabled = true;
let isPaused = false;

// UI elements
const pauseBtn = document.getElementById("pause-btn");
const playBtn = document.getElementById("play-btn");
const soundBtnHome = document.getElementById("sound-btn-home");
const muteBtnHome = document.getElementById("mute-btn-home");
const soundBtnGameover = document.getElementById("sound-btn-gameover");
const muteBtnGameover = document.getElementById("mute-btn-gameover");

// Touch handling flags
let touchHandled = false;
let lastTouchTime = 0;

// Canvas setup with proper scaling
function setupCanvas() {
    dpr = window.devicePixelRatio || 1;
    
    const gameContainer = document.querySelector('.game-container');
    const containerRect = gameContainer.getBoundingClientRect();
    
    scale = Math.min(
        containerRect.width / baseWidth,
        containerRect.height / baseHeight
    );
    
    boardWidth = baseWidth;
    boardHeight = baseHeight;
    
    board.style.width = containerRect.width + 'px';
    board.style.height = containerRect.height + 'px';
    ui.style.width = containerRect.width + 'px';
    ui.style.height = containerRect.height + 'px';
    
    board.width = baseWidth * dpr;
    board.height = baseHeight * dpr;
    ui.width = baseWidth * dpr;
    ui.height = baseHeight * dpr;
    
    context = board.getContext("2d");
    uiContext = ui.getContext("2d");
    
    context.scale(dpr, dpr);
    uiContext.scale(dpr, dpr);
    
    context.imageSmoothingEnabled = false;
    uiContext.imageSmoothingEnabled = false;
}

// Enhanced resize handler
function handleResize() {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(() => {
        setupCanvas();
        
        if (gameStarted && !gameOver && !isPaused) {
            requestAnimationFrame(update);
        } else if (!gameStarted) {
            showHomepage();
        }
    }, 100);
}

// Fixed button event handling
function setupButtonEvents() {
    function addUniversalEventListener(element, handler) {
        if (!element) return;
        element.removeEventListener('click', handler);
        element.removeEventListener('touchend', handler);
        element.addEventListener('click', handler, { passive: false });
        element.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            handler(e);
        }, { passive: false });
        element.addEventListener('contextmenu', function(e) {
            e.preventDefault();
        });
    }
    
    addUniversalEventListener(startBtn, function(e) {
        e.preventDefault(); e.stopPropagation(); startGame();
    });
    addUniversalEventListener(restartBtn, function(e) {
        e.preventDefault(); e.stopPropagation(); restartGame();
    });
    addUniversalEventListener(soundBtnHome, function(e) {
        e.preventDefault(); e.stopPropagation(); toggleSound();
    });
    addUniversalEventListener(muteBtnHome, function(e) {
        e.preventDefault(); e.stopPropagation(); toggleSound();
    });
    addUniversalEventListener(pauseBtn, function(e) {
        e.preventDefault(); e.stopPropagation(); pauseGame();
    });
    addUniversalEventListener(playBtn, function(e) {
        e.preventDefault(); e.stopPropagation(); resumeGame();
    });
    addUniversalEventListener(soundBtnGameover, function(e) {
        e.preventDefault(); e.stopPropagation(); toggleSound();
    });
    addUniversalEventListener(muteBtnGameover, function(e) {
        e.preventDefault(); e.stopPropagation(); toggleSound();
    });
    addUniversalEventListener(resumeBtn, function(e) {
        e.preventDefault(); e.stopPropagation(); resumeGame();
    });
    addUniversalEventListener(soundBtnPause, function(e) {
        e.preventDefault(); e.stopPropagation(); toggleSound();
    });
    addUniversalEventListener(muteBtnPause, function(e) {
        e.preventDefault(); e.stopPropagation(); toggleSound();
    });
}

// Fixed touch handling for game area (not buttons)
function setupGameTouchEvents() {
    const gameContainer = document.querySelector('.game-container');
    gameContainer.addEventListener('touchstart', function(e) {
        if (e.target.closest('.game-control')) return;
        e.preventDefault();
        handleGameTouch(e);
    }, { passive: false });
    gameContainer.addEventListener('click', function(e) {
        if (e.target.closest('.game-control')) return;
        handleGameTouch(e);
    });
}

function handleGameTouch(e) {
    const currentTime = Date.now();
    
    // Prevent double-tap issues
    if (currentTime - lastTouchTime < 200) {
        return;
    }
    lastTouchTime = currentTime;

    if (isCountdownActive) return;
    
    // Game touch logic
    if (!gameStarted && !gameOver) {
        startGame();
    } else if (gameOver) {
        restartGame();
    } else if (gameStarted && !gameOver && !isPaused) {
        jump();
    } else if (isPaused) {
        resumeGame();
    }
}

function jump() {
    velocityY = -6;
    if (soundEnabled) {
        flySound.currentTime = 0;
        flySound.play().catch(() => {});
    }
}

// Initialize game
window.addEventListener('load', function () {
    setupCanvas();
    setupButtonEvents();
    setupGameTouchEvents();
    
    // Load images
    powerUpImg.src = "./images/powerups.png";
    enemyImg.src = "./images/enemy.png";
    SupermanImg = new Image();
    SupermanImg.src = "./images/superman1.png";
    topPipeImg.src = "./images/toppipe.png";
    bottomPipeImg.src = "./images/bottompipe.png";
    newTopPipeImg.src = "./images/pipe11.png";
    newBottomPipeImg.src = "./images/pipe1.png";
    gameOverImg.src = "./images/gameover.png";
    highScoreImg.src = "./images/highscore.png";
    collisionImg.src = "./images/collision.png";

    // Initialize sound
    bgMusic.loop = true;
    updateSoundDisplay();
    
    // Keyboard events
    document.addEventListener("keydown", handleKeyPress);

    // Resize handlers
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 100);
    });

    // Initial setup
    showHomepage();
});

function toggleSound() {
    soundEnabled = !soundEnabled;
    
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

    if (soundEnabled) {
        bgMusic.play().catch(() => {});
    } else {
        bgMusic.pause();
    }
}

function updateSoundDisplay() {
    const showSound = soundEnabled;
    soundBtnHome.style.display = showSound ? "block" : "none";
    muteBtnHome.style.display = showSound ? "none" : "block";
    soundBtnGameover.style.display = showSound ? "block" : "none";
    muteBtnGameover.style.display = showSound ? "none" : "block";
    soundBtnPause.style.display = showSound ? "block" : "none";
    muteBtnPause.style.display = showSound ? "none" : "block";
}

function pauseGame() {
    if (!gameStarted || gameOver) return;

    isPaused = true;
    pauseOverlay.style.display = "flex";
    pauseBtn.style.display = "none";
    playBtn.style.display = "none"; // Hide play button (since we're showing pause overlay)
    bgMusic.pause();
    cancelAnimationFrame(animationFrameId);
    clearInterval(pipeInterval);
}

function resumeGame() {
    if (!gameStarted || gameOver) return;

    isPaused = false;
    pauseOverlay.style.display = "none";
    pauseBtn.style.display = "block";
    playBtn.style.display = "none";
    if (soundEnabled) bgMusic.play().catch(() => {});
    pipeInterval = setDynamicPipeInterval();
    requestAnimationFrame(update);
}

function startGame() {
    gameOver = false;
    gameStarted = true;
    isPaused = false;
    score = 0;
    currentLevel = 0;
    lastLevelCheckpoint = 0;
    velocityX = baseVelocityX;
    velocityY = 0;
    Superman.y = SupermanY;
    pipeArray = [];
    powerUpArray = [];
    enemyArray = [];
    isLevelAnimating = false;
    
    document.querySelector('.homepage-container').style.display = "none";
    board.style.display = "block";
    ui.style.display = "block";
    startBtn.style.display = "none";
    restartBtn.style.display = "none";
    pauseBtn.style.display = "block"; // Show pause button
    playBtn.style.display = "none";   // Hide play button
    soundBtnHome.style.display = "none";
    muteBtnHome.style.display = "none";
    pauseOverlay.style.display = "none";

    isCountdownActive = true;
    countdown = 3;
    animateCountdown();
}

function animateCountdown() {
    if (!isCountdownActive) return;

    context.clearRect(0, 0, boardWidth, boardHeight);
    uiContext.clearRect(0, 0, boardWidth, boardHeight);

    context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height);

    const fontSize = 100 + (50 * (countdown - Math.floor(countdown)));
    const alpha = 1 - (countdown - Math.floor(countdown));
    
    uiContext.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    uiContext.font = `bold ${fontSize}px Arial`;
    uiContext.textAlign = "center";
    uiContext.fillText(Math.ceil(countdown).toString(), boardWidth/2, boardHeight/2);

    countdown -= 0.016;

    if (countdown <= 0) {
        isCountdownActive = false;
        gameStarted = true;
        pauseBtn.style.display = "block";

        if (soundEnabled) bgMusic.play().catch(() => {});
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

    // UI elements
    uiContext.fillStyle = "rgba(0, 0, 0, 0.5)";
    uiContext.fillRect(0, 0, boardWidth, 50);
    uiContext.fillStyle = "#FFD700";
    uiContext.font = "16px Arial";
    uiContext.textAlign = "center";
    uiContext.fillText(`HIGH: ${highScore}`, boardWidth / 2 - 140, 30);
    uiContext.textAlign = "center";
    uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, 30);

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

    // Score display
    uiContext.fillStyle = "#FFD700";
    uiContext.font = "bold 45px 'Arial Black'";
    uiContext.textAlign = "center";
    uiContext.fillText(Math.floor(score), boardWidth / 2, 100);

    // Level animation
    if (isLevelAnimating) {
        const elapsed = Date.now() - levelAnimationStartTime;
        const progress = Math.min(elapsed / levelAnimationDuration, 1);
        uiContext.save();
        uiContext.textAlign = "center";
        uiContext.fillStyle = `rgba(255, 215, 0, ${1 - progress})`;
        uiContext.font = `bold ${40 + (20 * (1 - progress))}px Arial`;
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

        const shieldSize = 50;

        if (!isFlashing) {
            context.drawImage(powerUpImg,
                Superman.x - (shieldSize - Superman.width) / 2,
                Superman.y - (shieldSize - Superman.height) / 2,
                shieldSize,
                shieldSize
            );
        } else {
            context.globalAlpha = 0.5;
            context.drawImage(powerUpImg,
                Superman.x - (shieldSize - Superman.width) / 2,
                Superman.y - (shieldSize - Superman.height) / 2,
                shieldSize,
                shieldSize
            );
            context.globalAlpha = 1.0;
        }

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
    lastPipeGap = { top: gapTopY, bottom: gapBottomY };

    let obstacleChance = baseObstacleChance + currentLevel * obstacleIncreasePerLevel;
    obstacleChance = Math.min(obstacleChance, 0.75);

    let topPipeType = Math.random() < obstacleChance ? "obstacle" : "normal";
    let bottomPipeType = Math.random() < obstacleChance ? "obstacle" : "normal";

    let topImg = topPipeType === "obstacle" ? newTopPipeImg : topPipeImg;
    let bottomImg = bottomPipeType === "obstacle" ? newBottomPipeImg : bottomPipeImg;

    pipeArray.push({
        img: topImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    });

    pipeArray.push({
        img: bottomImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + currentGap,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    });
}

function setDynamicPipeInterval() {
    const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL);
    let interval = basePipeInterval - (effectiveLevel * PIPE_INTERVAL_REDUCTION_PER_LEVEL);
    interval = Math.max(interval, minPipeInterval);
    return setInterval(placePipes, interval);
}

function handleKeyPress(e) {
    if (e.code === "KeyM") toggleSound();
    if (isCountdownActive) return;
    if (e.code === "KeyP" && !gameOver) {
        if (isPaused) resumeGame();
        else pauseGame();
    }
    if (!gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
        startGame();
        return;
    }

    if (gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
        jump();
    }

    if (gameOver && e.code === "Enter") restartGame();
}

function restartGame() {
    if (pipeInterval) {
        clearInterval(pipeInterval);
        pipeInterval = null;
    }

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    gameOver = false;
    gameStarted = false;
    isPaused = false;
    score = 0;
    currentLevel = 0;
    lastLevelCheckpoint = 0;
    velocityX = baseVelocityX;
    velocityY = 0;
    Superman.y = SupermanY;
    pipeArray = [];
    isLevelAnimating = false;
    shieldActive = false;
    powerUpArray = [];
    enemyArray = [];

    context.clearRect(0, 0, boardWidth, boardHeight);
    uiContext.clearRect(0, 0, boardWidth, boardHeight);

    if (soundEnabled) bgMusic.play().catch(() => {});
    showHomepage();
}

function endGame() {
    gameOver = true;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem("supermanHighScore", highScore);
    }

    pauseBtn.style.display = "none";
    playBtn.style.display = "none";
    board.style.display = "block";
    document.querySelector('.homepage-container').style.display = "none";
    
    ui.style.display = "block";
    restartBtn.style.display = "block";
    
    uiContext.clearRect(0, 0, boardWidth, boardHeight);
    
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

    if (pipeInterval) clearInterval(pipeInterval);
    bgMusic.pause();
    
    if (soundEnabled) {
        hitSound.currentTime = 0;
        hitSound.play().catch(() => {});
    }
}

function spawnPowerUp() {
    powerUpArray.push({
        img: powerUpImg,
        x: boardWidth,
        y: Math.random() * (boardHeight - 40),
        width: 40,
        height: 40
    });
}

function spawnEnemy() {
    let enemyHeight = 40;
    let y;
    let tries = 0;

    do {
        y = Math.random() * (boardHeight - enemyHeight);
        tries++;
    } while (
        lastPipeGap &&
        y + enemyHeight > lastPipeGap.top &&
        y < lastPipeGap.bottom &&
        tries < 10
    );

    let speed = baseEnemySpeed + (enemySpeedIncrease * currentLevel);
    speed = Math.max(maxEnemySpeed, speed);
    speed += (Math.random() - 0.5);

    enemyArray.push({
        img: enemyImg,
        x: boardWidth,
        y: y,
        width: 60,
        height: enemyHeight,
        speed: speed
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
    let scale = 1;
    let collisionW = width * scale;
    let collisionH = height * scale;
    let collisionX = x + (width - collisionW) / 2;
    let collisionY = y + (height - collisionH) / 2;
    context.drawImage(collisionImg, collisionX, collisionY, collisionW, collisionH);
}

function showHomepage() {
    document.querySelector('.homepage-container').style.display = "flex";
    board.style.display = "none";
    ui.style.display = "none";
    
    startBtn.style.display = "block";
    restartBtn.style.display = "none";
    pauseBtn.style.display = "none";
    playBtn.style.display = "none";
    pauseOverlay.style.display = "none";
    
    soundBtnHome.style.display = soundEnabled ? "block" : "none";
    muteBtnHome.style.display = soundEnabled ? "none" : "block";
    soundBtnGameover.style.display = "none";
    muteBtnGameover.style.display = "none";
    
    gameOver = false;
    gameStarted = false;
    isPaused = false;
    pipeArray = [];
    score = 0;
    Superman.y = SupermanY;
}
