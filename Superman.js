// Game constants
const boardWidth = 360
const boardHeight = 640
let context
let uiContext
const homepage = document.getElementById("homepage")
let board = document.getElementById("board")
const ui = document.getElementById("ui")
const startBtn = document.getElementById("start-btn")
const restartBtn = document.getElementById("restart-btn")
const soundBtnPause = document.getElementById("sound-btn-pause")
const muteBtnPause = document.getElementById("mute-btn-pause")
const pauseOverlay = document.getElementById("pause-overlay")
const resumeBtn = document.getElementById("resume-btn")

// iOS performance detection and optimization flags
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
const isIOSDevice = isIOS || isSafari
const supportsOffscreenCanvas = typeof OffscreenCanvas !== "undefined"

// Performance optimization variables
let lastFrameTime = 0
let frameCount = 0
let averageFPS = 60
const TARGET_FPS = isIOSDevice ? 30 : 60
const FRAME_TIME = 1000 / TARGET_FPS

// Image preloading (keeping original mechanism as requested)
const powerUpImg = new Image()
const enemyImg = new Image()
let shieldActive = false
const shieldDuration = 5000
let shieldEndTime = 0
let powerUpArray = []
let lastPowerUpSpawn = 0
const powerUpSpawnInterval = 10000
let enemyArray = []
const enemySpawnInterval = 4000
let lastEnemySpawn = 0
const baseEnemySpeed = -4
const enemySpeedIncrease = -0.5
const maxEnemySpeed = -8
const MAX_DIFFICULTY_LEVEL = 5
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200

// Device detection
let isDesktop = false
let isMobile = false

// Optimized touch handling for iOS
let touchStartTime = 0
let touchStartY = 0
let isTouchActive = false
let lastTouchTime = 0
const TOUCH_THROTTLE = isIOSDevice ? 32 : 16 // Increased throttle for iOS
const touchPool = [] // Touch event pooling for iOS

// Superman
const SupermanWidth = 74.8
const SupermanHeight = 32.4
const SupermanX = boardWidth / 8
const SupermanY = boardHeight / 2
let SupermanImg

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

// Images (keeping original loading mechanism)
let topPipeImg
let bottomPipeImg
let newTopPipeImg
let newBottomPipeImg
let gameOverImg
let yourScoreImg
let highScoreImg
let collisionImg

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

// Sound elements (keeping original mechanism as requested)
const bgMusic = new Audio("./sounds/bg.mp3")
const flySound = new Audio("./sounds/fly.mp3")
const hitSound = new Audio("./sounds/hit.mp3")
let soundEnabled = true
let isPaused = false

// UI elements
const pauseBtn = document.getElementById("pause-btn")
const playBtn = document.getElementById("play-btn")
const soundBtnHome = document.getElementById("sound-btn-home")
const muteBtnHome = document.getElementById("mute-btn-home")
const soundBtnGameover = document.getElementById("sound-btn-gameover")
const muteBtnGameover = document.getElementById("mute-btn-gameover")

// Canvas optimization variables
const canvasImageData = null
let offscreenCanvas = null
let offscreenContext = null
let renderScale = 1

// iOS-specific rendering optimizations
const contextTransform = { scaleX: 1, scaleY: 1 }
let needsContextUpdate = true

// Device detection function
function detectDevice() {
  const userAgent = navigator.userAgent
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  isDesktop =
    screenWidth >= 769 && window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(hover: none)").matches

  isMobile = !isDesktop

  console.log(`Device detected: ${isDesktop ? "Desktop" : "Mobile"} (${screenWidth}x${screenHeight})`)
  if (isIOSDevice) {
    console.log("iOS device detected - applying performance optimizations")
  }
}

// Optimized canvas scaling for iOS
function updateCanvasSize() {
  detectDevice()

  const container = document.querySelector(".game-container")
  const containerRect = container.getBoundingClientRect()

  if (isMobile) {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // iOS optimization: limit device pixel ratio
    const dpr = isIOSDevice ? Math.min(window.devicePixelRatio || 1, 2) : window.devicePixelRatio || 1
    renderScale = dpr

    // Set canvas size with optimized scaling
    board.width = viewportWidth * dpr
    board.height = viewportHeight * dpr
    ui.width = viewportWidth * dpr
    ui.height = viewportHeight * dpr

    // Calculate scale factors
    const scaleX = (viewportWidth * dpr) / boardWidth
    const scaleY = (viewportHeight * dpr) / boardHeight

    // Store transform for optimized rendering
    contextTransform.scaleX = scaleX
    contextTransform.scaleY = scaleY
    needsContextUpdate = true

    // Set CSS size
    board.style.width = "100vw"
    board.style.height = "100vh"
    ui.style.width = "100vw"
    ui.style.height = "100vh"

    // iOS optimization: set transform once
    if (isIOSDevice) {
      board.style.transform = "translate3d(0, 0, 0)"
      ui.style.transform = "translate3d(0, 0, 0)"
    }
  } else {
    // Desktop handling
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    board.width = containerWidth
    board.height = containerHeight
    ui.width = containerWidth
    ui.height = containerHeight

    const scaleX = containerWidth / boardWidth
    const scaleY = containerHeight / boardHeight

    contextTransform.scaleX = scaleX
    contextTransform.scaleY = scaleY
    needsContextUpdate = true

    board.style.width = "100%"
    board.style.height = "100%"
    ui.style.width = "100%"
    ui.style.height = "100%"
  }

  // Initialize offscreen canvas for iOS optimization
  if (isIOSDevice && supportsOffscreenCanvas && !offscreenCanvas) {
    try {
      offscreenCanvas = new OffscreenCanvas(boardWidth, boardHeight)
      offscreenContext = offscreenCanvas.getContext("2d")
      if (offscreenContext) {
        offscreenContext.imageSmoothingEnabled = false
      }
    } catch (e) {
      console.log("OffscreenCanvas not supported, using regular canvas")
    }
  }
}

// Optimized context setup for iOS
function setupCanvasContext(ctx) {
  if (isIOSDevice) {
    // iOS optimizations
    ctx.imageSmoothingEnabled = false
    ctx.webkitImageSmoothingEnabled = false
    ctx.mozImageSmoothingEnabled = false
    ctx.msImageSmoothingEnabled = false
  }
}

window.onload = () => {
  board = document.getElementById("board")
  board.height = boardHeight
  board.width = boardWidth
  context = board.getContext("2d")
  setupCanvasContext(context)

  const uiCanvas = document.getElementById("ui")
  uiCanvas.height = boardHeight
  uiCanvas.width = boardWidth
  uiContext = uiCanvas.getContext("2d")
  setupCanvasContext(uiContext)

  detectDevice()
  updateCanvasSize()

  // Debounced resize handling for iOS
  let resizeTimeout
  const handleResize = () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(
      () => {
        updateCanvasSize()
        needsContextUpdate = true
      },
      isIOSDevice ? 300 : 150,
    )
  }

  window.addEventListener("resize", handleResize)
  window.addEventListener("orientationchange", () => {
    setTimeout(
      () => {
        updateCanvasSize()
        needsContextUpdate = true
      },
      isIOSDevice ? 500 : 300,
    )
  })

  // Load images (keeping original mechanism)
  powerUpImg.src = "./images/powerups.png"
  enemyImg.src = "./images/enemy.png"
  SupermanImg = new Image()
  SupermanImg.src = "./images/superman1.png"
  topPipeImg = new Image()
  topPipeImg.src = "./images/toppipe.png"
  bottomPipeImg = new Image()
  bottomPipeImg.src = "./images/bottompipe.png"
  newTopPipeImg = new Image()
  newTopPipeImg.src = "./images/pipe11.png"
  newBottomPipeImg = new Image()
  newBottomPipeImg.src = "./images/pipe1.png"
  gameOverImg = new Image()
  gameOverImg.src = "./images/gameover.png"
  highScoreImg = new Image()
  highScoreImg.src = "./images/highscore.png"
  collisionImg = new Image()
  collisionImg.src = "./images/collision.png"

  // Initialize sound (keeping original mechanism)
  bgMusic.loop = true
  updateSoundDisplay()

  setupEventListeners()
  showHomepage()

  // iOS-specific touch prevention
  if (isMobile) {
    const touchOptions = { passive: false }

    document.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault()
      },
      touchOptions,
    )

    document.addEventListener(
      "touchstart",
      (e) => {
        const now = Date.now()
        if (now - lastTouchTime < TOUCH_THROTTLE) {
          e.preventDefault()
          return
        }
        lastTouchTime = now
        e.preventDefault()
      },
      touchOptions,
    )

    // iOS specific gesture prevention
    if (isIOSDevice) {
      document.addEventListener("gesturestart", (e) => e.preventDefault(), touchOptions)
      document.addEventListener("gesturechange", (e) => e.preventDefault(), touchOptions)
      document.addEventListener("gestureend", (e) => e.preventDefault(), touchOptions)
    }
  }
}

function setupEventListeners() {
  // Enhanced button setup
  setupButton(startBtn, startGame)
  setupButton(restartBtn, restartGame)
  setupButton(pauseBtn, pauseGame)
  setupButton(playBtn, resumeGame)
  setupButton(resumeBtn, resumeGame)
  setupButton(soundBtnHome, toggleSound)
  setupButton(muteBtnHome, toggleSound)
  setupButton(soundBtnGameover, toggleSound)
  setupButton(muteBtnGameover, toggleSound)
  setupButton(soundBtnPause, toggleSound)
  setupButton(muteBtnPause, toggleSound)

  document.addEventListener("keydown", handleKeyPress)

  if (isMobile) {
    const touchOptions = { passive: false }

    board.addEventListener("touchstart", handleGameTouchStart, touchOptions)
    board.addEventListener("touchend", handleGameTouchEnd, touchOptions)
    board.addEventListener("touchmove", (e) => e.preventDefault(), touchOptions)

    const gameContainer = document.querySelector(".game-container")
    gameContainer.addEventListener("touchstart", handleContainerTouch, touchOptions)
    document.addEventListener("touchstart", handleGlobalTouch, touchOptions)
  } else {
    board.addEventListener("click", handleDesktopClick)
    document.addEventListener("click", handleDesktopGlobalClick)
  }
}

// Optimized button setup for iOS
function setupButton(button, callback) {
  if (!button) return

  button.removeEventListener("click", callback)
  button.removeEventListener("touchend", handleButtonTouch)

  function handleButtonTouch(e) {
    e.preventDefault()
    e.stopPropagation()

    // iOS optimization: immediate visual feedback
    button.classList.add("button-active")

    // Use requestAnimationFrame for smoother iOS performance
    requestAnimationFrame(() => {
      setTimeout(
        () => {
          button.classList.remove("button-active")
          callback()
        },
        isIOSDevice ? 50 : 100,
      )
    })
  }

  button.addEventListener("click", (e) => {
    e.preventDefault()
    e.stopPropagation()
    callback()
  })

  if (isMobile) {
    const touchOptions = { passive: false }

    button.addEventListener(
      "touchstart",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        button.classList.add("button-active")
      },
      touchOptions,
    )

    button.addEventListener("touchend", handleButtonTouch, touchOptions)

    button.addEventListener(
      "touchcancel",
      (e) => {
        e.preventDefault()
        button.classList.remove("button-active")
      },
      touchOptions,
    )
  }
}

// Optimized touch handlers for iOS
function handleGameTouchStart(e) {
  if (!isMobile) return

  e.preventDefault()
  e.stopPropagation()

  if (!gameStarted || gameOver || isPaused || isCountdownActive) return

  const now = Date.now()
  if (now - lastTouchTime < TOUCH_THROTTLE) return
  lastTouchTime = now

  isTouchActive = true
  touchStartTime = now
  touchStartY = e.touches[0].clientY

  velocityY = -6
  if (soundEnabled) {
    flySound.currentTime = 0
    flySound.play().catch(() => {})
  }
}

function handleGameTouchEnd(e) {
  if (!isMobile) return
  e.preventDefault()
  e.stopPropagation()
  isTouchActive = false
}

function handleGlobalTouch(e) {
  if (!isMobile) return
  if (e.target.closest(".game-control")) return

  e.preventDefault()

  if (isCountdownActive) return

  const now = Date.now()
  if (now - lastTouchTime < TOUCH_THROTTLE) return
  lastTouchTime = now

  if (!gameStarted && !gameOver) {
    startGame()
    return
  }

  if (isPaused) {
    resumeGame()
    return
  }
}

function handleContainerTouch(e) {
  if (!isMobile) return
  if (e.target.closest(".game-control")) return
  if (e.target.closest(".pause-overlay")) return
  if (gameOver) return

  e.preventDefault()
  e.stopPropagation()

  const now = Date.now()
  if (now - lastTouchTime < TOUCH_THROTTLE) return
  lastTouchTime = now

  if (gameStarted && !gameOver && !isPaused && !isCountdownActive) {
    velocityY = -6
    if (soundEnabled) {
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    }
  }
}

function handleDesktopClick(e) {
  if (!isDesktop) return
  e.preventDefault()
  e.stopPropagation()

  if (gameStarted && !gameOver && !isPaused && !isCountdownActive) {
    velocityY = -6
    if (soundEnabled) {
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    }
  }
}

function handleDesktopGlobalClick(e) {
  if (!isDesktop) return
  if (e.target.closest(".game-control")) return
  if (e.target.closest(".pause-overlay")) return
  if (isCountdownActive) return

  if (!gameStarted && !gameOver) {
    startGame()
    return
  }

  if (isPaused) {
    resumeGame()
    return
  }
}

function toggleSound() {
  soundEnabled = !soundEnabled

  // Batch DOM updates for iOS performance
  requestAnimationFrame(() => {
    if (gameOver) {
      soundBtnGameover.style.display = soundEnabled ? "block" : "none"
      muteBtnGameover.style.display = soundEnabled ? "none" : "block"
    } else if (isPaused) {
      soundBtnPause.style.display = soundEnabled ? "block" : "none"
      muteBtnPause.style.display = soundEnabled ? "none" : "block"
    } else if (!gameStarted) {
      soundBtnHome.style.display = soundEnabled ? "block" : "none"
      muteBtnHome.style.display = soundEnabled ? "none" : "block"
    }
  })

  if (soundEnabled) bgMusic.play().catch(() => {})
  else bgMusic.pause()
}

function updateSoundDisplay() {
  const showSound = soundEnabled
  // Batch DOM updates
  requestAnimationFrame(() => {
    soundBtnHome.style.display = showSound ? "block" : "none"
    muteBtnHome.style.display = showSound ? "none" : "block"
    soundBtnGameover.style.display = showSound ? "block" : "none"
    muteBtnGameover.style.display = showSound ? "none" : "block"
  })
}

function pauseGame() {
  if (!gameStarted || gameOver) return

  isPaused = true

  // Batch DOM updates for iOS performance
  requestAnimationFrame(() => {
    pauseOverlay.style.display = "flex"
    pauseBtn.style.display = "none"
    playBtn.style.display = "block"
    soundBtnPause.style.display = soundEnabled ? "flex" : "none"
    muteBtnPause.style.display = soundEnabled ? "none" : "flex"
  })

  bgMusic.pause()
  cancelAnimationFrame(animationFrameId)
  clearInterval(pipeInterval)
}

function resumeGame() {
  isPaused = false

  // Batch DOM updates
  requestAnimationFrame(() => {
    pauseOverlay.style.display = "none"
    pauseBtn.style.display = "block"
    playBtn.style.display = "none"
  })

  if (soundEnabled) bgMusic.play().catch(() => {})
  pipeInterval = setDynamicPipeInterval()
  cancelAnimationFrame(animationFrameId)
  requestAnimationFrame(update)
}

function startGame() {
  gameOver = false
  gameStarted = true
  score = 0
  currentLevel = 0
  lastLevelCheckpoint = 0
  velocityX = baseVelocityX
  velocityY = 0
  Superman.y = SupermanY
  pipeArray = []
  isLevelAnimating = false
  powerUpArray = []
  enemyArray = []
  shieldActive = false

  // Batch DOM updates for iOS performance
  requestAnimationFrame(() => {
    homepage.style.display = "none"
    board.style.display = "block"
    ui.style.display = "block"
    startBtn.style.display = "none"
    restartBtn.style.display = "none"
    pauseBtn.style.display = "none"
    soundBtnHome.style.display = "none"
    muteBtnHome.style.display = "none"
    soundBtnGameover.style.display = "none"
    muteBtnGameover.style.display = "none"
  })

  isCountdownActive = true
  countdown = 3
  animateCountdown()
}

// Optimized countdown animation for iOS
function animateCountdown() {
  if (!isCountdownActive) return

  // iOS optimization: use single transform instead of save/restore
  if (needsContextUpdate) {
    context.setTransform(contextTransform.scaleX, 0, 0, contextTransform.scaleY, 0, 0)
    uiContext.setTransform(contextTransform.scaleX, 0, 0, contextTransform.scaleY, 0, 0)
    needsContextUpdate = false
  }

  context.clearRect(0, 0, boardWidth, boardHeight)
  uiContext.clearRect(0, 0, boardWidth, boardHeight)

  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  const fontSize = 100 + 50 * (countdown - Math.floor(countdown))
  const alpha = 1 - (countdown - Math.floor(countdown))

  uiContext.fillStyle = `rgba(255, 215, 0, ${alpha})`
  uiContext.font = `bold ${fontSize}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(Math.ceil(countdown).toString(), boardWidth / 2, boardHeight / 2)

  countdown -= isIOSDevice ? 0.025 : 0.016

  if (countdown <= 0) {
    isCountdownActive = false
    gameStarted = true

    requestAnimationFrame(() => {
      pauseBtn.style.display = "block"
    })

    if (soundEnabled) bgMusic.play().catch(() => {})
    pipeInterval = setDynamicPipeInterval()
    requestAnimationFrame(update)
  } else {
    requestAnimationFrame(animateCountdown)
  }
}

// Highly optimized update function for iOS
function update() {
  if (!gameStarted || gameOver || isPaused || isCountdownActive) return

  const now = performance.now()

  // Frame rate limiting for iOS
  if (isIOSDevice && now - lastFrameTime < FRAME_TIME) {
    animationFrameId = requestAnimationFrame(update)
    return
  }

  // Performance monitoring
  if (lastFrameTime > 0) {
    const deltaTime = now - lastFrameTime
    frameCount++
    if (frameCount % 60 === 0) {
      averageFPS = 1000 / (deltaTime || 16.67)
    }
  }
  lastFrameTime = now

  animationFrameId = requestAnimationFrame(update)

  // iOS optimization: use single transform
  if (needsContextUpdate) {
    context.setTransform(contextTransform.scaleX, 0, 0, contextTransform.scaleY, 0, 0)
    uiContext.setTransform(contextTransform.scaleX, 0, 0, contextTransform.scaleY, 0, 0)
    needsContextUpdate = false
  }

  context.clearRect(0, 0, boardWidth, boardHeight)
  uiContext.clearRect(0, 0, boardWidth, boardHeight)

  currentLevel = Math.floor(score / 15)
  if (currentLevel > lastLevelCheckpoint && !isLevelAnimating) {
    isLevelAnimating = true
    levelAnimationStartTime = Date.now()
    updateDifficulty()
  }

  // Simplified UI for iOS performance
  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
  uiContext.fillRect(0, 0, boardWidth, 50)
  uiContext.fillStyle = "#FFD700"
  uiContext.font = "16px Arial"
  uiContext.textAlign = "center"
  uiContext.fillText(`HIGH: ${highScore}`, boardWidth / 2 - 140, 30)
  uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, 30)

  // Superman physics (keeping original logic)
  velocityY += gravity
  Superman.y = Math.max(Superman.y + velocityY, 0)
  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  if (Superman.y > board.height) endGame()

  // Optimized pipe handling
  for (let i = 0; i < pipeArray.length; i++) {
    const pipe = pipeArray[i]
    pipe.x += velocityX
    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height)

    if (!pipe.passed && Superman.x > pipe.x + pipe.width) {
      score += 0.5
      pipe.passed = true
    }

    if (detectCollision(Superman, pipe)) {
      drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height)
      endGame(pipe)
    }
  }

  // Efficient array cleanup
  while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift()
  }

  if (currentLevel !== lastLevelCheckpoint) {
    lastLevelCheckpoint = currentLevel
    if (pipeInterval) clearInterval(pipeInterval)
    pipeInterval = setDynamicPipeInterval()
  }

  // Score display
  uiContext.fillStyle = "#FFD700"
  uiContext.font = "bold 45px 'Arial Black'"
  uiContext.textAlign = "center"
  uiContext.fillText(Math.floor(score), boardWidth / 2, 100)

  // Simplified level animation for iOS
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

  // Shield handling (keeping original logic)
  if (shieldActive && Date.now() > shieldEndTime) {
    shieldActive = false
  }

  if (shieldActive) {
    const timeLeft = shieldEndTime - Date.now()
    const isFlashing = timeLeft < 1000 && Math.floor(Date.now() / 100) % 2 === 0
    const shieldSize = 50

    if (!isFlashing) {
      context.drawImage(
        powerUpImg,
        Superman.x - (shieldSize - Superman.width) / 2,
        Superman.y - (shieldSize - Superman.height) / 2,
        shieldSize,
        shieldSize,
      )
    } else {
      context.globalAlpha = 0.5
      context.drawImage(
        powerUpImg,
        Superman.x - (shieldSize - Superman.width) / 2,
        Superman.y - (shieldSize - Superman.height) / 2,
        shieldSize,
        shieldSize,
      )
      context.globalAlpha = 1.0
    }
  }

  // Optimized powerup and enemy handling
  for (let i = powerUpArray.length - 1; i >= 0; i--) {
    const p = powerUpArray[i]
    p.x += velocityX
    context.drawImage(p.img, p.x, p.y, p.width, p.height)

    if (detectCollision(Superman, p)) {
      shieldActive = true
      shieldEndTime = Date.now() + shieldDuration
      powerUpArray.splice(i, 1)
    } else if (p.x < -p.width) {
      powerUpArray.splice(i, 1)
    }
  }

  for (let i = enemyArray.length - 1; i >= 0; i--) {
    const e = enemyArray[i]
    e.x += e.speed
    context.drawImage(e.img, e.x, e.y, e.width, e.height)

    if (!shieldActive && detectCollision(Superman, e)) {
      drawCollisionEffect(Superman.x, Superman.y, Superman.width, Superman.height)
      endGame()
    } else if (e.x < -e.width) {
      enemyArray.splice(i, 1)
    }
  }

  const currentTime = Date.now()

  if (currentTime - lastPowerUpSpawn > powerUpSpawnInterval) {
    spawnPowerUp()
    lastPowerUpSpawn = currentTime
  }

  if (currentTime - lastEnemySpawn > enemySpawnInterval) {
    spawnEnemy()
    lastEnemySpawn = currentTime
  }
}

// Keep all other functions unchanged (maintaining original physics logic)
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

  const topPipeType = Math.random() < obstacleChance ? "obstacle" : "normal"
  const bottomPipeType = Math.random() < obstacleChance ? "obstacle" : "normal"

  const topImg = topPipeType === "obstacle" ? newTopPipeImg : topPipeImg
  const bottomImg = bottomPipeType === "obstacle" ? newBottomPipeImg : bottomPipeImg

  pipeArray.push({
    img: topImg,
    x: pipeX,
    y: randomPipeY,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  })

  pipeArray.push({
    img: bottomImg,
    x: pipeX,
    y: randomPipeY + pipeHeight + currentGap,
    width: pipeWidth,
    height: pipeHeight,
    passed: false,
  })
}

function setDynamicPipeInterval() {
  const effectiveLevel = Math.min(currentLevel, MAX_DIFFICULTY_LEVEL)
  let interval = basePipeInterval - effectiveLevel * PIPE_INTERVAL_REDUCTION_PER_LEVEL
  interval = Math.max(interval, minPipeInterval)
  return setInterval(placePipes, interval)
}

function handleKeyPress(e) {
  if (e.code === "KeyM") toggleSound()
  if (isCountdownActive) return
  if (e.code === "KeyP" && !gameOver) {
    if (isPaused) resumeGame()
    else pauseGame()
  }
  if (!gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
    startGame()
    return
  }

  if (gameStarted && !gameOver && (e.code === "Space" || e.code === "ArrowUp")) {
    velocityY = -6
    if (soundEnabled) {
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    }
  }

  if (gameOver && e.code === "Enter") restartGame()
}

function restartGame() {
  if (pipeInterval) {
    clearInterval(pipeInterval)
    pipeInterval = null
  }

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }

  gameOver = false
  gameStarted = false
  score = 0
  currentLevel = 0
  lastLevelCheckpoint = 0
  velocityX = baseVelocityX
  velocityY = 0
  Superman.y = SupermanY
  pipeArray = []
  isLevelAnimating = false
  shieldActive = false
  powerUpArray = []
  enemyArray = []

  context.clearRect(0, 0, board.width, board.height)
  uiContext.clearRect(0, 0, board.width, board.height)

  if (soundEnabled) bgMusic.play().catch(() => {})
  showHomepage()
}

function endGame() {
  gameOver = true

  if (score > highScore) {
    highScore = score
    localStorage.setItem("supermanHighScore", highScore)
  }

  // Batch DOM updates for iOS performance
  requestAnimationFrame(() => {
    pauseBtn.style.display = "none"
    board.style.display = "block"
    homepage.style.display = "none"
    ui.style.display = "block"
    restartBtn.style.display = "block"
    soundBtnGameover.style.display = soundEnabled ? "block" : "none"
    muteBtnGameover.style.display = soundEnabled ? "none" : "block"
  })

  uiContext.clearRect(0, 0, board.width, board.height)
  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
  uiContext.fillRect(0, 0, boardWidth, boardHeight)

  const centerX = boardWidth / 2
  uiContext.drawImage(gameOverImg, centerX - 225, 95, 450, 200)
  uiContext.fillStyle = "#FFD700"
  uiContext.font = "bold 45px 'Arial Black'"
  uiContext.textAlign = "center"
  uiContext.fillText(Math.floor(score), centerX, 100)
  uiContext.drawImage(highScoreImg, centerX - 110, 280, 150, 80)
  uiContext.fillText(highScore, centerX + 75, 330)

  if (pipeInterval) clearInterval(pipeInterval)
  bgMusic.pause()

  if (soundEnabled) {
    hitSound.currentTime = 0
    hitSound.play().catch(() => {})
  }
}

function spawnPowerUp() {
  powerUpArray.push({
    img: powerUpImg,
    x: boardWidth,
    y: Math.random() * (boardHeight - 40),
    width: 40,
    height: 40,
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
    img: enemyImg,
    x: boardWidth,
    y: y,
    width: 60,
    height: enemyHeight,
    speed: speed,
  })
}

function detectCollision(a, b) {
  if (shieldActive) return false
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function drawCollisionEffect(x, y, width, height) {
  const scale = 1
  const collisionW = width * scale
  const collisionH = height * scale
  const collisionX = x + (width - collisionW) / 2
  const collisionY = y + (height - collisionH) / 2
  context.drawImage(collisionImg, collisionX, collisionY, collisionW, collisionH)
}

function showHomepage() {
  // Batch DOM updates for iOS performance
  requestAnimationFrame(() => {
    homepage.style.display = "block"
    board.style.display = "none"
    ui.style.display = "none"
    startBtn.style.display = "block"
    restartBtn.style.display = "none"
    pauseBtn.style.display = "none"
    playBtn.style.display = "none"
    soundBtnHome.style.display = soundEnabled ? "block" : "none"
    muteBtnHome.style.display = soundEnabled ? "none" : "block"
    soundBtnGameover.style.display = "none"
    muteBtnGameover.style.display = "none"
  })

  gameOver = false
  gameStarted = false
  pipeArray = []
  score = 0
  Superman.y = SupermanY
  pauseOverlay.style.display = "none"
}
