// Game constants with responsive scaling
const baseWidth = 360
const baseHeight = 640
let boardWidth = baseWidth
let boardHeight = baseHeight
let scale = 1
let dpr = 1

let context
let uiContext
const homepage = document.getElementById("homepage")
const board = document.getElementById("board")
const ui = document.getElementById("ui")
const gameTouchArea = document.getElementById("game-touch-area")

// Button references
const startBtn = document.getElementById("start-btn")
const restartBtn = document.getElementById("restart-btn")
const soundBtnPause = document.getElementById("sound-btn-pause")
const muteBtnPause = document.getElementById("mute-btn-pause")
const pauseOverlay = document.getElementById("pause-overlay")
const resumeBtn = document.getElementById("resume-btn")

// Game objects and arrays
let powerUpArray = []
let lastPowerUpSpawn = 0
const powerUpSpawnInterval = 10000
let enemyArray = []
const enemySpawnInterval = 4000
let lastEnemySpawn = 0

// Game state flags
let shieldActive = false
const shieldDuration = 5000
let shieldEndTime = 0

// Enemy parameters
const baseEnemySpeed = -4
const enemySpeedIncrease = -0.5
const maxEnemySpeed = -8

// Difficulty caps
const MAX_DIFFICULTY_LEVEL = 5
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200

// Superman
const SupermanWidth = 74.8
const SupermanHeight = 32.4
const SupermanX = boardWidth / 8
const SupermanY = boardHeight / 2

const Superman = {
  x: SupermanX,
  y: SupermanY,
  width: SupermanWidth,
  height: SupermanHeight,
}

// Pipes
let pipeArray = []
const pipeWidth = 64
const pipeHeight = 512
const pipeX = boardWidth
const pipeY = 0

// Difficulty parameters
const basePipeInterval = 1700
const minPipeInterval = 900
const maxPipeInterval = 1720
const basePipeGap = boardHeight / 3.2
const minPipeGap = 90
const baseVelocityX = -2
const maxVelocityX = -6
const levelSpeedIncrease = -0.5
const baseObstacleChance = 0.1
const obstacleIncreasePerLevel = 0.05

// Game variables
let velocityX = baseVelocityX
let velocityY = 0
const gravity = 0.4
let gameOver = false
let score = 0
let highScore = Number.parseInt(localStorage.getItem("supermanHighScore")) || 0
let gameStarted = false
let pipeInterval = null
let animationFrameId = null
let currentLevel = 0
let lastLevelCheckpoint = 0
let countdown = 3
let isCountdownActive = false
let lastPipeGap = { top: 0, bottom: 0 }

// Level animation
let isLevelAnimating = false
let levelAnimationStartTime = 0
const levelAnimationDuration = 1000

// Sound elements (using placeholder audio)
let soundEnabled = true
let isPaused = false

// Images - restore proper image loading
const SupermanImg = new Image()
const powerUpImg = new Image()
const enemyImg = new Image()
const topPipeImg = new Image()
const bottomPipeImg = new Image()
const newTopPipeImg = new Image()
const newBottomPipeImg = new Image()
const gameOverImg = new Image()
const yourScoreImg = new Image()
const highScoreImg = new Image()
const collisionImg = new Image()

// Sound elements
const bgMusic = new Audio("./sounds/bg.mp3")
const flySound = new Audio("./sounds/fly.mp3")
const hitSound = new Audio("./sounds/hit.mp3")

// UI elements
const pauseBtn = document.getElementById("pause-btn")
const playBtn = document.getElementById("play-btn")
const soundBtnHome = document.getElementById("sound-btn-home")
const muteBtnHome = document.getElementById("mute-btn-home")
const soundBtnGameover = document.getElementById("sound-btn-gameover")
const muteBtnGameover = document.getElementById("mute-btn-gameover")

// Touch handling flags
const touchHandled = false
let lastTouchTime = 0

// Canvas setup with proper scaling
function setupCanvas() {
  dpr = window.devicePixelRatio || 1

  const gameContainer = document.querySelector(".game-container")
  const containerRect = gameContainer.getBoundingClientRect()

  scale = Math.min(containerRect.width / baseWidth, containerRect.height / baseHeight)

  boardWidth = baseWidth
  boardHeight = baseHeight

  board.style.width = containerRect.width + "px"
  board.style.height = containerRect.height + "px"
  ui.style.width = containerRect.width + "px"
  ui.style.height = containerRect.height + "px"

  board.width = baseWidth * dpr
  board.height = baseHeight * dpr
  ui.width = baseWidth * dpr
  ui.height = baseHeight * dpr

  context = board.getContext("2d")
  uiContext = ui.getContext("2d")

  context.scale(dpr, dpr)
  uiContext.scale(dpr, dpr)

  context.imageSmoothingEnabled = false
  uiContext.imageSmoothingEnabled = false
}

// Enhanced resize handler
function handleResize() {
  clearTimeout(window.resizeTimeout)
  window.resizeTimeout = setTimeout(() => {
    setupCanvas()

    if (gameStarted && !gameOver && !isPaused) {
      requestAnimationFrame(update)
    } else if (!gameStarted) {
      showHomepage()
    }
  }, 100)
}

// Enhanced button event handling with better touch support
function setupButtonEvents() {
  function addButtonEventListener(element, handler) {
    if (!element) return

    // Remove existing listeners
    element.removeEventListener("click", handler)
    element.removeEventListener("touchend", handler)

    // Add click listener
    element.addEventListener(
      "click",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        handler(e)
      },
      { passive: false },
    )

    // Add touch listener with better handling
    element.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault()
        e.stopPropagation()

        // Add visual feedback
        element.classList.add("pressed")
        setTimeout(() => element.classList.remove("pressed"), 100)

        handler(e)
      },
      { passive: false },
    )

    // Prevent context menu
    element.addEventListener("contextmenu", (e) => {
      e.preventDefault()
    })

    // Add touch start for immediate visual feedback
    element.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault()
        element.style.transform = element.style.transform.replace("scale(0.95)", "") + " scale(0.95)"
      },
      { passive: false },
    )

    // Reset on touch cancel
    element.addEventListener("touchcancel", (e) => {
      element.style.transform = element.style.transform.replace(" scale(0.95)", "")
    })
  }

  // Setup all button event listeners
  addButtonEventListener(startBtn, startGame)
  addButtonEventListener(restartBtn, restartGame)
  addButtonEventListener(soundBtnHome, toggleSound)
  addButtonEventListener(muteBtnHome, toggleSound)
  addButtonEventListener(pauseBtn, pauseGame)
  addButtonEventListener(playBtn, resumeGame)
  addButtonEventListener(soundBtnGameover, toggleSound)
  addButtonEventListener(muteBtnGameover, toggleSound)
  addButtonEventListener(resumeBtn, resumeGame)
  addButtonEventListener(soundBtnPause, toggleSound)
  addButtonEventListener(muteBtnPause, toggleSound)
}

// Enhanced game touch handling - only for gameplay jumps
function setupGameTouchEvents() {
  // Touch events for game area (jumping during gameplay)
  gameTouchArea.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault()
      handleGameTouch(e)
    },
    { passive: false },
  )

  gameTouchArea.addEventListener(
    "click",
    (e) => {
      e.preventDefault()
      handleGameTouch(e)
    },
    { passive: false },
  )

  // Keyboard events
  document.addEventListener("keydown", handleKeyPress)
}

function handleGameTouch(e) {
  const currentTime = Date.now()

  // Prevent double-tap issues
  if (currentTime - lastTouchTime < 150) {
    return
  }
  lastTouchTime = currentTime

  // Only handle touch if game is actively running
  if (gameStarted && !gameOver && !isPaused && !isCountdownActive) {
    jump()
  }
}

function jump() {
  velocityY = -6
  if (soundEnabled) {
    flySound.currentTime = 0
    flySound.play().catch(() => {})
  }
}

// Initialize game
window.addEventListener("load", () => {
  setupCanvas()
  setupButtonEvents()
  setupGameTouchEvents()

  // Load all game images
  SupermanImg.src = "./images/superman1.png"
  powerUpImg.src = "./images/powerups.png"
  enemyImg.src = "./images/enemy.png"
  topPipeImg.src = "./images/toppipe.png"
  bottomPipeImg.src = "./images/bottompipe.png"
  newTopPipeImg.src = "./images/pipe11.png"
  newBottomPipeImg.src = "./images/pipe1.png"
  gameOverImg.src = "./images/gameover.png"
  yourScoreImg.src = "./images/yourscore.png"
  highScoreImg.src = "./images/highscore.png"
  collisionImg.src = "./images/collision.png"

  // Initialize sound
  bgMusic.loop = true

  // Initialize sound display
  updateSoundDisplay()

  // Resize handlers
  window.addEventListener("resize", handleResize)
  window.addEventListener("orientationchange", () => {
    setTimeout(handleResize, 100)
  })

  // Initial setup
  showHomepage()
})

function toggleSound() {
  soundEnabled = !soundEnabled
  updateSoundDisplay()

  if (soundEnabled && gameStarted && !gameOver && !isPaused) {
    bgMusic.play().catch(() => {})
  } else {
    bgMusic.pause()
  }
}

function updateSoundDisplay() {
  const showSound = soundEnabled

  // Home screen sound buttons
  soundBtnHome.style.display = showSound ? "block" : "none"
  muteBtnHome.style.display = showSound ? "none" : "block"

  // Game over sound buttons
  soundBtnGameover.style.display = showSound ? "block" : "none"
  muteBtnGameover.style.display = showSound ? "none" : "block"

  // Pause overlay sound buttons
  soundBtnPause.style.display = showSound ? "block" : "none"
  muteBtnPause.style.display = showSound ? "none" : "block"
}

function pauseGame() {
  if (!gameStarted || gameOver || isCountdownActive) return

  isPaused = true
  pauseOverlay.style.display = "flex"
  pauseBtn.style.display = "none"
  playBtn.style.display = "none"
  gameTouchArea.classList.remove("active")

  cancelAnimationFrame(animationFrameId)
  clearInterval(pipeInterval)

  console.log("Game paused")
}

function resumeGame() {
  if (!gameStarted || gameOver) return

  isPaused = false
  pauseOverlay.style.display = "none"
  pauseBtn.style.display = "block"
  playBtn.style.display = "none"
  gameTouchArea.classList.add("active")

  pipeInterval = setDynamicPipeInterval()
  requestAnimationFrame(update)

  console.log("Game resumed")
}

function startGame() {
  // Reset all game variables
  gameOver = false
  gameStarted = false // Will be set to true after countdown
  isPaused = false
  score = 0
  currentLevel = 0
  lastLevelCheckpoint = 0
  velocityX = baseVelocityX
  velocityY = 0
  Superman.y = SupermanY
  pipeArray = []
  powerUpArray = []
  enemyArray = []
  isLevelAnimating = false
  shieldActive = false

  // Update UI
  document.querySelector(".homepage-container").style.display = "none"
  board.style.display = "block"
  ui.style.display = "block"
  startBtn.style.display = "none"
  restartBtn.style.display = "none"
  pauseBtn.style.display = "none" // Hidden during countdown
  playBtn.style.display = "none"
  soundBtnHome.style.display = "none"
  muteBtnHome.style.display = "none"
  soundBtnGameover.style.display = "none"
  muteBtnGameover.style.display = "none"
  pauseOverlay.style.display = "none"
  gameTouchArea.classList.remove("active") // Disabled during countdown

  // Start countdown
  isCountdownActive = true
  countdown = 3
  animateCountdown()
}

function animateCountdown() {
  if (!isCountdownActive) return

  context.clearRect(0, 0, boardWidth, boardHeight)
  uiContext.clearRect(0, 0, boardWidth, boardHeight)

  // Draw Superman with actual image instead of rectangle
  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  // Draw countdown
  const fontSize = 100 + 50 * (countdown - Math.floor(countdown))
  const alpha = 1 - (countdown - Math.floor(countdown))

  uiContext.fillStyle = `rgba(255, 215, 0, ${alpha})`
  uiContext.font = `bold ${fontSize}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(Math.ceil(countdown).toString(), boardWidth / 2, boardHeight / 2)

  countdown -= 0.016

  if (countdown <= 0) {
    isCountdownActive = false
    gameStarted = true
    pauseBtn.style.display = "block"
    gameTouchArea.classList.add("active")

    pipeInterval = setDynamicPipeInterval()
    requestAnimationFrame(update)

    console.log("Game started!")
  } else {
    requestAnimationFrame(animateCountdown)
  }
}

function update() {
  if (!gameStarted || gameOver || isPaused || isCountdownActive) return
  animationFrameId = requestAnimationFrame(update)

  context.clearRect(0, 0, boardWidth, boardHeight)
  uiContext.clearRect(0, 0, boardWidth, boardHeight)

  // Update level
  currentLevel = Math.floor(score / 15)
  if (currentLevel > lastLevelCheckpoint && !isLevelAnimating) {
    isLevelAnimating = true
    levelAnimationStartTime = Date.now()
    updateDifficulty()
  }

  // Draw UI background
  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
  uiContext.fillRect(0, 0, boardWidth, 50)
  uiContext.fillStyle = "#FFD700"
  uiContext.font = "16px Arial"
  uiContext.textAlign = "left"
  uiContext.fillText(`HIGH: ${highScore}`, 10, 30)
  uiContext.textAlign = "center"
  uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, 30)

  // Superman physics
  velocityY += gravity
  Superman.y = Math.max(Superman.y + velocityY, 0)

  // Draw Superman with actual image
  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  // Check if Superman hits ground
  if (Superman.y > boardHeight) {
    endGame()
    return
  }

  // Handle pipes
  for (let i = 0; i < pipeArray.length; i++) {
    const pipe = pipeArray[i]
    pipe.x += velocityX

    // Draw pipe with actual images
    const pipeImg = pipe.isObstacle
      ? pipe.y < 0
        ? newTopPipeImg
        : newBottomPipeImg
      : pipe.y < 0
        ? topPipeImg
        : bottomPipeImg
    context.drawImage(pipeImg, pipe.x, pipe.y, pipe.width, pipe.height)

    if (!pipe.passed && Superman.x > pipe.x + pipe.width) {
      score += 0.5
      pipe.passed = true
    }

    if (detectCollision(Superman, pipe)) {
      endGame()
      return
    }
  }

  // Remove off-screen pipes
  while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift()
  }

  // Update difficulty
  if (currentLevel !== lastLevelCheckpoint) {
    lastLevelCheckpoint = currentLevel
    if (pipeInterval) clearInterval(pipeInterval)
    pipeInterval = setDynamicPipeInterval()
  }

  // Draw score
  uiContext.fillStyle = "#FFD700"
  uiContext.font = "bold 45px Arial"
  uiContext.textAlign = "center"
  uiContext.fillText(Math.floor(score), boardWidth / 2, 100)

  // Level animation
  if (isLevelAnimating) {
    const elapsed = Date.now() - levelAnimationStartTime
    const progress = Math.min(elapsed / levelAnimationDuration, 1)
    uiContext.save()
    uiContext.textAlign = "center"
    uiContext.fillStyle = `rgba(255, 215, 0, ${1 - progress})`
    uiContext.font = `bold ${40 + 20 * (1 - progress)}px Arial`
    uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, boardHeight / 2)
    uiContext.restore()
    if (progress >= 1) isLevelAnimating = false
  }

  // Handle shield
  if (shieldActive && Date.now() > shieldEndTime) {
    shieldActive = false
  }

  // Handle power-ups and enemies (simplified for demo)
  handlePowerUps()
  handleEnemies()
}

function handlePowerUps() {
  const now = Date.now()
  if (now - lastPowerUpSpawn > powerUpSpawnInterval) {
    spawnPowerUp()
    lastPowerUpSpawn = now
  }

  for (let i = powerUpArray.length - 1; i >= 0; i--) {
    const p = powerUpArray[i]
    p.x += velocityX

    // Draw power-up with actual image
    context.drawImage(powerUpImg, p.x, p.y, p.width, p.height)

    if (detectCollision(Superman, p)) {
      shieldActive = true
      shieldEndTime = Date.now() + shieldDuration
      powerUpArray.splice(i, 1)
    }

    if (p.x < -p.width) powerUpArray.splice(i, 1)
  }
}

function handleEnemies() {
  const now = Date.now()
  if (now - lastEnemySpawn > enemySpawnInterval) {
    spawnEnemy()
    lastEnemySpawn = now
  }

  for (let i = enemyArray.length - 1; i >= 0; i--) {
    const e = enemyArray[i]
    e.x += e.speed

    // Draw enemy with actual image
    context.drawImage(enemyImg, e.x, e.y, e.width, e.height)

    if (!shieldActive && detectCollision(Superman, e)) {
      endGame()
      return
    }

    if (e.x < -e.width) enemyArray.splice(i, 1)
  }
}

function updateDifficulty() {
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  velocityX = baseVelocityX + levelSpeedIncrease * effectiveLevel
  velocityX = Math.max(maxVelocityX, velocityX)
}

function placePipes() {
  if (gameOver || !gameStarted) return

  const currentGap = basePipeGap
  const minPipeY = -pipeHeight + 50
  const maxPipeY = 0 - currentGap - 150
  const randomPipeY = Math.random() * (maxPipeY - minPipeY) + minPipeY

  const gapTopY = randomPipeY + pipeHeight
  const gapBottomY = gapTopY + basePipeGap
  lastPipeGap = { top: gapTopY, bottom: gapBottomY }

  let obstacleChance = baseObstacleChance + currentLevel * obstacleIncreasePerLevel
  obstacleChance = Math.min(obstacleChance, 0.75)

  const topPipeIsObstacle = Math.random() < obstacleChance
  const bottomPipeIsObstacle = Math.random() < obstacleChance

  pipeArray.push({
    x: pipeX,
    y: randomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
    isObstacle: topPipeIsObstacle,
  })

  pipeArray.push({
    x: pipeX,
    y: randomPipeY + pipeHeight + currentGap,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
    isObstacle: bottomPipeIsObstacle,
  })
}

function setDynamicPipeInterval() {
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  let interval = basePipeInterval - effectiveLevel * PIPE_INTERVAL_REDUCTION_PER_LEVEL
  interval = Math.max(interval, minPipeInterval)
  return setInterval(placePipes, interval)
}

function handleKeyPress(e) {
  if (e.code === "KeyM") {
    toggleSound()
    return
  }

  if (isCountdownActive) return

  if (e.code === "KeyP" && !gameOver) {
    if (isPaused) resumeGame()
    else pauseGame()
    return
  }

  if (gameStarted && !gameOver && !isPaused && (e.code === "Space" || e.code === "ArrowUp")) {
    jump()
  }
}

function restartGame() {
  // Clean up intervals and animations
  if (pipeInterval) {
    clearInterval(pipeInterval)
    pipeInterval = null
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  // Reset all game state
  gameOver = false
  gameStarted = false
  isPaused = false
  score = 0
  currentLevel = 0
  lastLevelCheckpoint = 0
  velocityX = baseVelocityX
  velocityY = 0
  Superman.y = SupermanY
  pipeArray = []
  powerUpArray = []
  enemyArray = []
  isLevelAnimating = false
  shieldActive = false
  isCountdownActive = false

  // Clear canvases
  context.clearRect(0, 0, boardWidth, boardHeight)
  uiContext.clearRect(0, 0, boardWidth, boardHeight)

  // Show homepage
  showHomepage()

  console.log("Game restarted")
}

function endGame() {
  gameOver = true
  gameTouchArea.classList.remove("active")

  if (score > highScore) {
    highScore = score
    localStorage.setItem("supermanHighScore", highScore)
  }

  // Update UI for game over
  pauseBtn.style.display = "none"
  playBtn.style.display = "none"
  board.style.display = "block"
  document.querySelector(".homepage-container").style.display = "none"

  ui.style.display = "block"
  restartBtn.style.display = "block"

  // Clear UI and draw game over screen
  uiContext.clearRect(0, 0, boardWidth, boardHeight)

  // Semi-transparent overlay
  uiContext.fillStyle = "rgba(0, 0, 0, 0.7)"
  uiContext.fillRect(0, 0, boardWidth, boardHeight)

  const centerX = boardWidth / 2

  // Draw game over image
  context.drawImage(gameOverImg, centerX - 225, 95, 450, 200)

  // Draw high score image
  context.drawImage(highScoreImg, centerX - 110, 280, 150, 80)

  // Final score
  // uiContext.fillStyle = "#FFD700";
  // uiContext.font = "bold 36px Arial";
  // uiContext.fillText(`Score: ${Math.floor(score)}`, centerX, 280);

  // // High score
  // uiContext.fillText(`High Score: ${highScore}`, centerX, 330);

  // Show sound controls
  soundBtnGameover.style.display = soundEnabled ? "block" : "none"
  muteBtnGameover.style.display = soundEnabled ? "none" : "block"

  // Clean up intervals
  if (pipeInterval) clearInterval(pipeInterval)

  console.log("Game ended. Final score:", Math.floor(score))
}

function spawnPowerUp() {
  powerUpArray.push({
    x: boardWidth,
    y: Math.random() * (boardHeight - 40),
    width: 30,
    height: 30,
  })
}

function spawnEnemy() {
  const enemyHeight = 40
  let y
  let tries = 0

  do {
    y = Math.random() * (boardHeight - enemyHeight)
    tries++
  } while (lastPipeGap && y + enemyHeight > lastPipeGap.top && y < lastPipeGap.bottom && tries < 10)

  let speed = baseEnemySpeed + enemySpeedIncrease * currentLevel
  speed = Math.max(maxEnemySpeed, speed)
  speed += Math.random() - 0.5

  enemyArray.push({
    x: boardWidth,
    y: y,
    width: 50,
    height: enemyHeight,
    speed: speed,
  })
}

function detectCollision(a, b) {
  if (shieldActive) return false

  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function showHomepage() {
  // Show homepage elements
  document.querySelector(".homepage-container").style.display = "flex"
  board.style.display = "none"
  ui.style.display = "none"

  // Show/hide appropriate buttons
  startBtn.style.display = "block"
  restartBtn.style.display = "none"
  pauseBtn.style.display = "none"
  playBtn.style.display = "none"
  pauseOverlay.style.display = "none"
  gameTouchArea.classList.remove("active")

  // Show sound controls for home screen
  soundBtnHome.style.display = soundEnabled ? "block" : "none"
  muteBtnHome.style.display = soundEnabled ? "none" : "block"
  soundBtnGameover.style.display = "none"
  muteBtnGameover.style.display = "none"

  // Reset game state
  gameOver = false
  gameStarted = false
  isPaused = false
  pipeArray = []
  score = 0
  Superman.y = SupermanY

  console.log("Showing homepage")
}

function drawCollisionEffect(x, y, width, height) {
  const scale = 1
  const collisionW = width * scale
  const collisionH = height * scale
  const collisionX = x + (width - collisionW) / 2
  const collisionY = y + (height - collisionH) / 2
  context.drawImage(collisionImg, collisionX, collisionY, collisionW, collisionH)
}
