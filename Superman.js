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

// iOS performance optimizations
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
const isIOSDevice = isIOS || isSafari

// Image preloading with iOS optimization
const powerUpImg = new Image()
const enemyImg = new Image()
let shieldActive = false
const shieldDuration = 5000 // 5 seconds
let shieldEndTime = 0
let powerUpArray = []
let lastPowerUpSpawn = 0
const powerUpSpawnInterval = 10000 // 10 seconds
let enemyArray = []
const enemySpawnInterval = 4000 // 4 seconds
let lastEnemySpawn = 0
const baseEnemySpeed = -4
const enemySpeedIncrease = -0.5
const maxEnemySpeed = -8
const MAX_DIFFICULTY_LEVEL = 5
const PIPE_INTERVAL_REDUCTION_PER_LEVEL = 200

// Device detection
let isDesktop = false
let isMobile = false

// Touch handling variables - iOS optimized
let touchStartTime = 0
let touchStartY = 0
let isTouchActive = false
let lastTouchTime = 0
const TOUCH_THROTTLE = isIOSDevice ? 16 : 8 // Throttle touch events on iOS

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

// Images with iOS optimization
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

// Sound elements with iOS optimization
let bgMusic, flySound, hitSound
let soundEnabled = true
let isPaused = false
const audioContext = null
let audioInitialized = false

// UI elements
const pauseBtn = document.getElementById("pause-btn")
const playBtn = document.getElementById("play-btn")
const soundBtnHome = document.getElementById("sound-btn-home")
const muteBtnHome = document.getElementById("mute-btn-home")
const soundBtnGameover = document.getElementById("sound-btn-gameover")
const muteBtnGameover = document.getElementById("mute-btn-gameover")

// Performance monitoring for iOS
let frameCount = 0
let lastFrameTime = 0
let averageFPS = 60

// Device detection function
function detectDevice() {
  const userAgent = navigator.userAgent
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  // Check for desktop: large screen + fine pointer + no touch primary input
  isDesktop =
    screenWidth >= 769 && window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(hover: none)").matches

  isMobile = !isDesktop

  console.log(`Device detected: ${isDesktop ? "Desktop" : "Mobile"} (${screenWidth}x${screenHeight})`)
  if (isIOSDevice) {
    console.log("iOS device detected - applying performance optimizations")
  }
}

// iOS-optimized canvas scaling
function updateCanvasSize() {
  detectDevice()

  const container = document.querySelector(".game-container")
  const containerRect = container.getBoundingClientRect()

  if (isMobile) {
    // Mobile: Full viewport with iOS optimization
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Use device pixel ratio for iOS optimization
    const dpr = isIOSDevice ? Math.min(window.devicePixelRatio, 2) : window.devicePixelRatio || 1

    board.width = viewportWidth * dpr
    board.height = viewportHeight * dpr
    ui.width = viewportWidth * dpr
    ui.height = viewportHeight * dpr

    // Scale context for high DPI but limit on iOS
    const scaleX = (viewportWidth * dpr) / boardWidth
    const scaleY = (viewportHeight * dpr) / boardHeight

    window.gameScaleX = scaleX
    window.gameScaleY = scaleY

    board.style.width = "100vw"
    board.style.height = "100vh"
    ui.style.width = "100vw"
    ui.style.height = "100vh"

    // iOS optimization: set CSS transform once
    if (isIOSDevice) {
      board.style.transform = "translateZ(0)"
      ui.style.transform = "translateZ(0)"
    }
  } else {
    // Desktop: Fixed container size
    const containerWidth = containerRect.width
    const containerHeight = containerRect.height

    board.width = containerWidth
    board.height = containerHeight
    ui.width = containerWidth
    ui.height = containerHeight

    const scaleX = containerWidth / boardWidth
    const scaleY = containerHeight / boardHeight

    window.gameScaleX = scaleX
    window.gameScaleY = scaleY

    board.style.width = "100%"
    board.style.height = "100%"
    ui.style.width = "100%"
    ui.style.height = "100%"
  }
}

// iOS-optimized audio initialization
function initializeAudio() {
  if (audioInitialized) return

  try {
    // Create audio elements with iOS optimization
    const bgMusic = new Audio("./sounds/bg.mp3")
    const flySound = new Audio("./sounds/fly.mp3")
    const hitSound = new Audio("./sounds/hit.mp3")
    bgMusic.loop = true
    bgMusic.volume = 0.3
    flySound.volume = 0.5
    hitSound.volume = 0.7

    // iOS specific audio setup
    if (isIOSDevice) {
      bgMusic.preload = "none"
      flySound.preload = "none"
      hitSound.preload = "none"
    }

    audioInitialized = true
  } catch (error) {
    console.warn("Audio initialization failed:", error)
    soundEnabled = false
  }
}

window.onload = () => {
  board = document.getElementById("board")
  board.height = boardHeight
  board.width = boardWidth
  context = board.getContext("2d")

  // iOS optimization: disable antialiasing for better performance
  if (isIOSDevice) {
    context.imageSmoothingEnabled = false
    context.webkitImageSmoothingEnabled = false
  }

  const uiCanvas = document.getElementById("ui")
  uiCanvas.height = boardHeight
  uiCanvas.width = boardWidth
  uiContext = uiCanvas.getContext("2d")

  // iOS optimization: disable antialiasing for UI canvas too
  if (isIOSDevice) {
    uiContext.imageSmoothingEnabled = false
    uiContext.webkitImageSmoothingEnabled = false
  }

  // Detect device and update canvas size
  detectDevice()
  updateCanvasSize()

  // Add event listeners for responsive updates with debouncing
  let resizeTimeout
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(updateCanvasSize, isIOSDevice ? 200 : 100)
  })

  window.addEventListener("orientationchange", () => {
    setTimeout(updateCanvasSize, isIOSDevice ? 300 : 200)
  })

  // Load images with iOS optimization
  const imagePromises = []

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

  // iOS optimization: set image rendering
  if (isIOSDevice) {
    ;[
      powerUpImg,
      enemyImg,
      SupermanImg,
      topPipeImg,
      bottomPipeImg,
      newTopPipeImg,
      newBottomPipeImg,
      gameOverImg,
      highScoreImg,
      collisionImg,
    ].forEach((img) => {
      img.style.imageRendering = "-webkit-optimize-contrast"
    })
  }

  // Initialize audio
  initializeAudio()
  updateSoundDisplay()

  // Setup event listeners
  setupEventListeners()
  showHomepage()

  // Prevent default touch behaviors on mobile with iOS optimization
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
        // iOS optimization: throttle touch events
        const now = Date.now()
        if (now - lastTouchTime < TOUCH_THROTTLE) return
        lastTouchTime = now

        e.preventDefault()
      },
      touchOptions,
    )

    // iOS specific: prevent zoom
    document.addEventListener(
      "gesturestart",
      (e) => {
        e.preventDefault()
      },
      touchOptions,
    )
  }
}

function setupEventListeners() {
  // Enhanced button setup with better touch handling
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

  // Keyboard controls (desktop)
  document.addEventListener("keydown", handleKeyPress)

  if (isMobile) {
    // Mobile touch controls with iOS optimization
    const touchOptions = { passive: false }

    board.addEventListener("touchstart", handleGameTouchStart, touchOptions)
    board.addEventListener("touchend", handleGameTouchEnd, touchOptions)
    board.addEventListener(
      "touchmove",
      (e) => {
        e.preventDefault()
      },
      touchOptions,
    )

    const gameContainer = document.querySelector(".game-container")
    gameContainer.addEventListener("touchstart", handleContainerTouch, touchOptions)
    document.addEventListener("touchstart", handleGlobalTouch, touchOptions)
  } else {
    // Desktop mouse controls
    board.addEventListener("click", handleDesktopClick)
    document.addEventListener("click", handleDesktopGlobalClick)
  }
}

function setupButton(button, callback) {
  if (!button) return

  // Remove existing event listeners to avoid duplicates
  button.removeEventListener("click", callback)
  button.removeEventListener("touchend", handleButtonTouch)

  // Enhanced touch handling for buttons with iOS optimization
  function handleButtonTouch(e) {
    e.preventDefault()
    e.stopPropagation()

    button.classList.add("button-active")

    // Faster feedback on iOS
    const delay = isIOSDevice ? 50 : 100
    setTimeout(() => {
      button.classList.remove("button-active")
      callback()
    }, delay)
  }

  // Add both mouse and touch events
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

// iOS-optimized touch handlers
function handleGameTouchStart(e) {
  if (!isMobile) return

  e.preventDefault()
  e.stopPropagation()

  if (!gameStarted || gameOver || isPaused || isCountdownActive) return

  // iOS optimization: throttle touch events
  const now = Date.now()
  if (now - lastTouchTime < TOUCH_THROTTLE) return
  lastTouchTime = now

  isTouchActive = true
  touchStartTime = now
  touchStartY = e.touches[0].clientY

  velocityY = -6
  if (soundEnabled && audioInitialized) {
    try {
      flySound.currentTime = 0
      flySound.play().catch(() => {})
    } catch (error) {
      // Ignore audio errors on iOS
    }
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

  // iOS optimization: throttle touch events
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

  // iOS optimization: throttle touch events
  const now = Date.now()
  if (now - lastTouchTime < TOUCH_THROTTLE) return
  lastTouchTime = now

  if (gameStarted && !gameOver && !isPaused && !isCountdownActive) {
    velocityY = -6
    if (soundEnabled && audioInitialized) {
      try {
        flySound.currentTime = 0
        flySound.play().catch(() => {})
      } catch (error) {
        // Ignore audio errors on iOS
      }
    }
  }
}

// Desktop mouse handlers
function handleDesktopClick(e) {
  if (!isDesktop) return

  e.preventDefault()
  e.stopPropagation()

  if (gameStarted && !gameOver && !isPaused && !isCountdownActive) {
    velocityY = -6
    if (soundEnabled && audioInitialized) {
      try {
        flySound.currentTime = 0
        flySound.play().catch(() => {})
      } catch (error) {
        // Ignore audio errors
      }
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

  if (soundEnabled && audioInitialized) {
    try {
      bgMusic.play().catch(() => {})
    } catch (error) {
      // Ignore audio errors on iOS
    }
  } else if (audioInitialized) {
    try {
      bgMusic.pause()
    } catch (error) {
      // Ignore audio errors on iOS
    }
  }
}

function updateSoundDisplay() {
  const showSound = soundEnabled
  soundBtnHome.style.display = showSound ? "block" : "none"
  muteBtnHome.style.display = showSound ? "none" : "block"
  soundBtnGameover.style.display = showSound ? "block" : "none"
  muteBtnGameover.style.display = showSound ? "none" : "block"
}

function pauseGame() {
  if (!gameStarted || gameOver) return

  isPaused = true
  pauseOverlay.style.display = "flex"
  pauseBtn.style.display = "none"
  playBtn.style.display = "block"
  soundBtnPause.style.display = soundEnabled ? "flex" : "none"
  muteBtnPause.style.display = soundEnabled ? "none" : "flex"

  if (audioInitialized) {
    try {
      bgMusic.pause()
    } catch (error) {
      // Ignore audio errors
    }
  }

  cancelAnimationFrame(animationFrameId)
  clearInterval(pipeInterval)
}

function resumeGame() {
  isPaused = false
  pauseOverlay.style.display = "none"
  pauseBtn.style.display = "block"
  playBtn.style.display = "none"

  if (soundEnabled && audioInitialized) {
    try {
      bgMusic.play().catch(() => {})
    } catch (error) {
      // Ignore audio errors
    }
  }

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

  // Hide/show elements
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

  // Initialize audio on first user interaction (iOS requirement)
  if (!audioInitialized) {
    initializeAudio()
  }

  // Start countdown
  isCountdownActive = true
  countdown = 3
  animateCountdown()
}

function animateCountdown() {
  if (!isCountdownActive) return

  const scaleX = window.gameScaleX || 1
  const scaleY = window.gameScaleY || 1

  // iOS optimization: avoid save/restore if possible
  if (isIOSDevice) {
    context.setTransform(scaleX, 0, 0, scaleY, 0, 0)
    uiContext.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  } else {
    context.save()
    context.scale(scaleX, scaleY)
    uiContext.save()
    uiContext.scale(scaleX, scaleY)
  }

  // Clear canvases
  context.clearRect(0, 0, boardWidth, boardHeight)
  uiContext.clearRect(0, 0, boardWidth, boardHeight)

  // Draw Superman
  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  // Animate countdown number
  const fontSize = 100 + 50 * (countdown - Math.floor(countdown))
  const alpha = 1 - (countdown - Math.floor(countdown))

  uiContext.fillStyle = `rgba(255, 215, 0, ${alpha})`
  uiContext.font = `bold ${fontSize}px Arial`
  uiContext.textAlign = "center"
  uiContext.fillText(Math.ceil(countdown).toString(), boardWidth / 2, boardHeight / 2)

  countdown -= isIOSDevice ? 0.02 : 0.016 // Slightly slower on iOS

  if (!isIOSDevice) {
    context.restore()
    uiContext.restore()
  }

  if (countdown <= 0) {
    isCountdownActive = false
    gameStarted = true
    pauseBtn.style.display = "block"

    if (soundEnabled && audioInitialized) {
      try {
        bgMusic.play().catch(() => {})
      } catch (error) {
        // Ignore audio errors
      }
    }

    pipeInterval = setDynamicPipeInterval()
    requestAnimationFrame(update)
  } else {
    requestAnimationFrame(animateCountdown)
  }
}

// iOS-optimized update function
function update() {
  if (!gameStarted || gameOver || isPaused || isCountdownActive) return

  // Performance monitoring for iOS
  const now = performance.now()
  if (lastFrameTime > 0) {
    const deltaTime = now - lastFrameTime
    frameCount++
    if (frameCount % 60 === 0) {
      averageFPS = 1000 / (deltaTime || 16.67)
      // Adjust quality based on FPS on iOS
      if (isIOSDevice && averageFPS < 30) {
        context.imageSmoothingEnabled = false
        uiContext.imageSmoothingEnabled = false
      }
    }
  }
  lastFrameTime = now

  animationFrameId = requestAnimationFrame(update)

  // Scale context to match viewport - iOS optimization
  const scaleX = window.gameScaleX || 1
  const scaleY = window.gameScaleY || 1

  if (isIOSDevice) {
    // iOS: Use setTransform instead of save/restore for better performance
    context.setTransform(scaleX, 0, 0, scaleY, 0, 0)
    uiContext.setTransform(scaleX, 0, 0, scaleY, 0, 0)
  } else {
    context.save()
    context.scale(scaleX, scaleY)
    uiContext.save()
    uiContext.scale(scaleX, scaleY)
  }

  context.clearRect(0, 0, boardWidth, boardHeight)
  uiContext.clearRect(0, 0, boardWidth, boardHeight)

  currentLevel = Math.floor(score / 15)
  if (currentLevel > lastLevelCheckpoint && !isLevelAnimating) {
    isLevelAnimating = true
    levelAnimationStartTime = Date.now()
    updateDifficulty()
  }

  // UI elements - simplified for iOS
  uiContext.fillStyle = "rgba(0, 0, 0, 0.5)"
  uiContext.fillRect(0, 0, boardWidth, 50)
  uiContext.fillStyle = "#FFD700"
  uiContext.font = "16px Arial"
  uiContext.textAlign = "center"
  uiContext.fillText(`HIGH: ${highScore}`, boardWidth / 2 - 140, 30)
  uiContext.textAlign = "center"
  uiContext.fillText(`LEVEL ${currentLevel}`, boardWidth / 2, 30)

  // Superman physics
  velocityY += gravity
  Superman.y = Math.max(Superman.y + velocityY, 0)
  context.drawImage(SupermanImg, Superman.x, Superman.y, Superman.width, Superman.height)

  if (Superman.y > board.height) endGame()

  // Pipe handling - optimized for iOS
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

  // Clean up pipes - more efficient
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

  // Level animation - simplified for iOS
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

  // Draw shield if active - optimized
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

    if (timeLeft <= 0) {
      shieldActive = false
    }
  }

  // Handle powerups - optimized loop
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

  // Handle enemies - optimized loop
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

  if (!isIOSDevice) {
    context.restore()
    uiContext.restore()
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
    if (soundEnabled && audioInitialized) {
      try {
        flySound.currentTime = 0
        flySound.play().catch(() => {})
      } catch (error) {
        // Ignore audio errors
      }
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

  if (soundEnabled && audioInitialized) {
    try {
      bgMusic.play().catch(() => {})
    } catch (error) {
      // Ignore audio errors
    }
  }

  showHomepage()
}

function endGame() {
  gameOver = true

  if (score > highScore) {
    highScore = score
    localStorage.setItem("supermanHighScore", highScore)
  }

  pauseBtn.style.display = "none"
  board.style.display = "block"
  homepage.style.display = "none"
  ui.style.display = "block"
  restartBtn.style.display = "block"

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

  soundBtnGameover.style.display = soundEnabled ? "block" : "none"
  muteBtnGameover.style.display = soundEnabled ? "none" : "block"

  if (pipeInterval) clearInterval(pipeInterval)

  if (audioInitialized) {
    try {
      bgMusic.pause()
      if (soundEnabled) {
        hitSound.currentTime = 0
        hitSound.play().catch(() => {})
      }
    } catch (error) {
      // Ignore audio errors
    }
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

  gameOver = false
  gameStarted = false
  pipeArray = []
  score = 0
  Superman.y = SupermanY
  pauseOverlay.style.display = "none"
}
