// Telegram Mini App Game: Krushka - Knight Rider
// A pixel-art endless runner with 5 themed levels

// ==================== DEVICE DETECTION ====================
function isMobileDevice() {
    // Check if it's a mobile device by user agent
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Also check screen size - if width <= 768 and height > width, it's mobile
    const isMobileSize = window.innerWidth <= 768 && window.innerHeight > window.innerWidth;
    
    // For large screens (desktop), always use horizontal mode
    const isLargeScreen = window.innerWidth > 768;
    
    // Mobile only if mobile UA AND (small screen OR portrait orientation)
    return isMobileUA && (isMobileSize || (!isLargeScreen && window.innerHeight > window.innerWidth));
}

function getOptimalCanvasSize() {
    const isMobile = isMobileDevice();
    const screenWidth = window.innerWidth || 1920;
    const screenHeight = window.innerHeight || 1080;
    
    // Mobile: vertical mode
    if (isMobile) {
        return { width: 400, height: 800 };
    }
    
    // Desktop/Large screens: horizontal mode (landscape)
    // Base size for 1920x1080, scale up for 4K
    const baseWidth = 800;
    const baseHeight = 450;
    
    // For 4K and larger monitors, increase base size
    if (screenWidth >= 2560) {
        // 4K and above: use larger base size
        const scale = Math.min(screenWidth / 2560, screenHeight / 1440);
        return {
            width: Math.floor(baseWidth * Math.min(scale, 1.5)), // Max 1.5x for very large screens
            height: Math.floor(baseHeight * Math.min(scale, 1.5))
        };
    }
    
    // Standard desktop: horizontal mode
    return { width: baseWidth, height: baseHeight };
}

// ==================== CONFIGURATION ====================
// Get initial size (will be recalculated on resize)
const initialSize = getOptimalCanvasSize();
const CONFIG = {
    // Will be set based on device and screen size
    CANVAS_WIDTH: initialSize.width || 800,
    CANVAS_HEIGHT: initialSize.height || 450,
    GRAVITY: 0.8,
    JUMP_STRENGTH_MIN: -15,
    JUMP_STRENGTH_MAX: -28,
    JUMP_CHARGE_RATE: 0.02, // How fast jump power charges per frame (at 60fps, takes ~0.8 seconds to max)
    JUMP_CHARGE_DIRECTION: 1, // 1 for increasing, -1 for decreasing
    // Ground and player sizes (will be recalculated if needed)
    GROUND_Y: isMobileDevice() ? 700 : 350,
    PLAYER_WIDTH: isMobileDevice() ? 35 : 40,
    PLAYER_HEIGHT: isMobileDevice() ? 45 : 50,
    PLAYER_START_X: isMobileDevice() ? 30 : 100,
    BASE_SPEED: 3.3, // Increased by 10% (3 * 1.1 = 3.3)
    OBSTACLE_WIDTH: isMobileDevice() ? 35 : 40,
    OBSTACLE_HEIGHT: isMobileDevice() ? 35 : 40,
    PIT_WIDTH: isMobileDevice() ? 70 : 80,
    PIT_HEIGHT: isMobileDevice() ? 90 : 100,
    GROUND_TEXTURE_SIZE: 20, // Size of ground texture pattern
    AI_JUMP_DISTANCE_PIT: 180, // Distance before pit to jump (AI) - need more distance for pits
    AI_JUMP_DISTANCE_FIRE: 120, // Distance before fire to jump (AI) - less distance for fires
    AI_JUMP_CHARGE_MIN: 0.4, // Minimum jump charge for AI
    AI_JUMP_CHARGE_MAX: 0.9, // Maximum jump charge for AI
};

// ==================== LEVEL CONFIGURATIONS ====================
const LEVELS = [
    {
        name: 'Morning',
        skyColor: '#87CEEB',
        skyColor2: '#E0F6FF',
        groundColor: '#8B7355',
        speed: CONFIG.BASE_SPEED,
        spawnRate: 0.008,
        targetDistance: 2000,
        backgroundImage: 'assets/background_morning.png'
    },
    {
        name: 'Day',
        skyColor: '#4A90E2',
        skyColor2: '#87CEEB',
        groundColor: '#9B7D5F',
        speed: CONFIG.BASE_SPEED * 1.2,
        spawnRate: 0.01,
        targetDistance: 2500,
        backgroundImage: 'assets/background_day.png'
    },
    {
        name: 'Sunrise',
        skyColor: '#FF6B35',
        skyColor2: '#FFB347',
        groundColor: '#A0826D',
        speed: CONFIG.BASE_SPEED * 1.4,
        spawnRate: 0.012,
        targetDistance: 3000,
        backgroundImage: 'assets/background_sunrise.png'
    },
    {
        name: 'Sunset',
        skyColor: '#8B0000',
        skyColor2: '#FF4500',
        groundColor: '#8B6F47',
        speed: CONFIG.BASE_SPEED * 1.6,
        spawnRate: 0.015,
        targetDistance: 3500,
        backgroundImage: 'assets/background_sunset.png'
    },
    {
        name: 'Night',
        skyColor: '#191970',
        skyColor2: '#4B0082',
        groundColor: '#5C4A37',
        speed: CONFIG.BASE_SPEED * 1.8,
        spawnRate: 0.018,
        targetDistance: 4000,
        backgroundImage: 'assets/background_night.png'
    },
    {
        name: 'Midnight',
        skyColor: '#000033',
        skyColor2: '#1a0033',
        groundColor: '#4a3a2a',
        speed: CONFIG.BASE_SPEED * 1.98, // +10% from Night
        spawnRate: 0.0216, // +20% from Night (0.018 * 1.2)
        targetDistance: 4500,
        backgroundImage: 'assets/background_midnight.png'
    },
    {
        name: 'Dawn',
        skyColor: '#2d1b3d',
        skyColor2: '#4a2c5a',
        groundColor: '#3d2e1f',
        speed: CONFIG.BASE_SPEED * 2.178, // +10% from Midnight
        spawnRate: 0.02592, // +20% from Midnight (0.0216 * 1.2)
        targetDistance: 5000,
        backgroundImage: 'assets/background_dawn.png'
    },
    {
        name: 'Storm',
        skyColor: '#1a1a2e',
        skyColor2: '#16213e',
        groundColor: '#2d2416',
        speed: CONFIG.BASE_SPEED * 2.3958, // +10% from Dawn
        spawnRate: 0.031104, // +20% from Dawn (0.02592 * 1.2)
        targetDistance: 5500,
        backgroundImage: 'assets/background_storm.png'
    }
];

// ==================== GAME STATES ====================
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver',
    ALL_COMPLETE: 'allComplete',
    WHEEL_OF_FORTUNE: 'wheelOfFortune'
};

// ==================== POINTS SYSTEM ====================
const POINTS_MANAGER = {
    STORAGE_KEY: 'krushka_points',
    POINTS_PER_8_LEVELS: 100,
    WHEEL_COST: 100,
    
    getPoints() {
        try {
            const points = localStorage.getItem(this.STORAGE_KEY);
            return points ? parseInt(points, 10) : 0;
        } catch (e) {
            console.error('Error reading points from localStorage:', e);
            return 0;
        }
    },
    
    setPoints(points) {
        try {
            localStorage.setItem(this.STORAGE_KEY, points.toString());
        } catch (e) {
            console.error('Error saving points to localStorage:', e);
        }
    },
    
    addPoints(amount) {
        const current = this.getPoints();
        const newTotal = current + amount;
        this.setPoints(newTotal);
        return newTotal;
    },
    
    spendPoints(amount) {
        const current = this.getPoints();
        if (current >= amount) {
            const newTotal = current - amount;
            this.setPoints(newTotal);
            return true;
        }
        return false;
    }
};

// ==================== WHEEL OF FORTUNE CONFIG ====================
const WHEEL_CONFIG = {
    SQUARES_COUNT: 12,
    SQUARE_WIDTH: 150, // Increased from 120
    SQUARE_HEIGHT: 150, // Increased from 120
    SPIN_DURATION: 5000, // 5 seconds for slower, smoother animation
    PRIZE_DELAY: 3000, // 3 seconds delay before showing prize image (pause after spin stops)
    PRIZE_FADE_DURATION: 1000, // 1 second for prize image fade-in
    BASE_URL: 'https://arenapsgm.ru/',
    
    // Images for each square (1-12)
    IMAGES: [
        'https://static.tildacdn.com/stor3537-3737-4635-a535-643336663233/19172606.jpg',
        'https://static.tildacdn.com/stor3030-6230-4230-a566-333630376238/19090300.jpg',
        'https://static.tildacdn.com/stor3430-6238-4430-b162-633431303163/31905856.jpg',
        'https://static.tildacdn.com/stor6161-3266-4064-a139-363037313830/32528681.jpg',
        'https://static.tildacdn.com/stor3737-6265-4465-b361-313430376663/92682172.png',
        'https://static.tildacdn.com/stor3236-3239-4638-b963-343266613133/29471824.jpg',
        'https://static.tildacdn.com/stor6461-3137-4562-b838-633463303430/33211320.jpg',
        'https://static.tildacdn.com/stor6639-3432-4936-b663-646134313133/45101323.jpg',
        'https://static.tildacdn.com/stor3665-3334-4431-b362-363031396236/47965198.jpg',
        'https://static.tildacdn.com/stor6433-6238-4664-a230-363232376530/54414205.jpg',
        'https://static.tildacdn.com/stor3135-3231-4134-a664-613431653335/87815301.jpg',
        'https://static.tildacdn.com/stor6438-3539-4564-b335-303262343733/39602838.jpg'
    ],
    
    // Links for each number (1-12), currently all same URL
    getLink(number) {
        return this.BASE_URL;
    },
    
    // Get image URL for square number (1-12)
    getImage(number) {
        return this.IMAGES[number - 1] || null;
    }
};

// ==================== PLAYER CLASS ====================
class Player {
    constructor() {
        // Position player based on device type
        if (isMobileDevice()) {
            this.x = 30; // Close to left edge on mobile
        } else {
            this.x = CONFIG.CANVAS_WIDTH / 2 - CONFIG.PLAYER_WIDTH / 2; // Centered on desktop
        }
        this.y = CONFIG.GROUND_Y;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.velocityY = 0;
        this.isJumping = false;
        this.onGround = true;
        this.image = null;
        this.jumpCharging = false;
        this.jumpChargePower = 0; // 0 to 1, where 1 is max jump
        this.jumpChargeDirection = 1; // 1 for increasing, -1 for decreasing
        this.loadImage();
    }

    loadImage() {
        this.image = new Image();
        this.image.src = 'assets/knight.png';
        this.image.onerror = () => {
            // Image not found, will use drawn sprite
            this.image = null;
        };
    }

    startJumpCharge() {
        if (this.onGround && !this.isJumping) {
            this.jumpCharging = true;
            this.jumpChargePower = 0;
            this.jumpChargeDirection = 1; // Start increasing
        }
    }

    updateJumpCharge() {
        if (this.jumpCharging && this.onGround && !this.isJumping) {
            // Update charge power based on direction
            this.jumpChargePower += CONFIG.JUMP_CHARGE_RATE * this.jumpChargeDirection;
            
            // Reverse direction when reaching limits
            if (this.jumpChargePower >= 1) {
                this.jumpChargePower = 1;
                this.jumpChargeDirection = -1; // Start decreasing
            } else if (this.jumpChargePower <= 0) {
                this.jumpChargePower = 0;
                this.jumpChargeDirection = 1; // Start increasing
            }
        } else if (!this.jumpCharging) {
            // Reset charge if not charging
            this.jumpChargePower = 0;
            this.jumpChargeDirection = 1;
        }
    }

    releaseJump() {
        // Always allow jump if on ground, even if not charging
        if (this.onGround && !this.isJumping) {
            // Use current charge power (even if small, it will affect jump height)
            const jumpPower = Math.max(0, Math.min(1, this.jumpChargePower));
            
            // Calculate jump strength based on charge (0 = min, 1 = max)
            // If no charge (quick tap), use minimum; if full charge, use maximum
            const jumpStrength = CONFIG.JUMP_STRENGTH_MIN + 
                                (CONFIG.JUMP_STRENGTH_MAX - CONFIG.JUMP_STRENGTH_MIN) * jumpPower;
            
            this.velocityY = jumpStrength;
            this.isJumping = true;
            this.onGround = false;
            this.jumpCharging = false;
            this.jumpChargePower = 0;
            this.jumpChargeDirection = 1;
        } else if (this.jumpCharging) {
            // Cancel charging if not on ground
            this.jumpCharging = false;
            this.jumpChargePower = 0;
            this.jumpChargeDirection = 1;
        }
    }

    update() {
        // Update jump charge if charging (only reset if not charging)
        this.updateJumpCharge();
        
        // Apply gravity
        this.velocityY += CONFIG.GRAVITY;
        this.y += this.velocityY;

        // Ground collision
        if (this.y >= CONFIG.GROUND_Y) {
            this.y = CONFIG.GROUND_Y;
            this.velocityY = 0;
            this.isJumping = false;
            this.onGround = true;
            // Don't reset charging here - let it continue if space is still pressed
            // Only reset if player is not charging
            if (!this.jumpCharging) {
                this.jumpChargePower = 0;
                this.jumpChargeDirection = 1;
            }
        }
    }

    draw(ctx) {
        if (this.image && this.image.complete) {
            ctx.drawImage(this.image, this.x, this.y - this.height, this.width, this.height);
        } else {
            // Draw simple knight sprite (pixel-art style)
            ctx.fillStyle = '#2C3E50';
            // Body
            ctx.fillRect(this.x + 10, this.y - this.height + 20, 20, 20);
            // Head
            ctx.fillStyle = '#FFDBAC';
            ctx.fillRect(this.x + 12, this.y - this.height + 5, 16, 16);
            // Helmet
            ctx.fillStyle = '#34495E';
            ctx.fillRect(this.x + 10, this.y - this.height, 20, 10);
            // Horse body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x, this.y - 20, 40, 20);
            // Legs
            ctx.fillRect(this.x + 5, this.y - 5, 8, 5);
            ctx.fillRect(this.x + 27, this.y - 5, 8, 5);
        }
    }

    getBounds() {
        return {
            x: this.x,
            y: this.y - this.height,
            width: this.width,
            height: this.height
        };
    }
}

// ==================== OBSTACLE CLASS ====================
class Obstacle {
    constructor(x, type, level) {
        this.x = x;
        this.type = type; // 'pit' or 'fire'
        this.level = level;
        
        if (type === 'pit') {
            this.width = CONFIG.PIT_WIDTH;
            this.height = CONFIG.PIT_HEIGHT;
            // Pit starts at ground level and goes down
            this.y = CONFIG.GROUND_Y;
        } else {
            this.width = CONFIG.OBSTACLE_WIDTH;
            this.height = CONFIG.OBSTACLE_HEIGHT;
            this.y = CONFIG.GROUND_Y - this.height;
        }
        
        this.image = null;
        this.loadImage();
    }

    loadImage() {
        this.image = new Image();
        if (this.type === 'pit') {
            this.image.src = 'assets/pit.png';
        } else {
            this.image.src = 'assets/fire.png';
        }
        this.image.onerror = () => {
            this.image = null;
        };
    }

    update(speed) {
        this.x -= speed;
    }

    draw(ctx, levelConfig) {
        if (this.type === 'pit') {
            // Draw pit - it's a hole in the ground, so draw it going down from GROUND_Y
            if (this.image && this.image.complete) {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            } else {
                // Draw pit as a dark hole in the ground
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = '#000';
                ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
                // Draw edges of the pit
                ctx.fillStyle = '#4a4a4a';
                ctx.fillRect(this.x, this.y, this.width, 3);
            }
        } else {
            // Draw fire
            if (this.image && this.image.complete) {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            } else {
                // Animated fire effect
                const time = Date.now() * 0.01;
                ctx.fillStyle = `hsl(${20 + Math.sin(time) * 10}, 100%, ${50 + Math.sin(time * 2) * 20}%)`;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                ctx.fillStyle = `hsl(${30 + Math.sin(time * 1.5) * 10}, 100%, ${60 + Math.sin(time * 3) * 15}%)`;
                ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);
            }
        }
    }

    getBounds() {
        if (this.type === 'pit') {
            // Pit collision: check if player is over the pit and below ground level
            return {
                x: this.x,
                y: this.y, // Start at ground level
                width: this.width,
                height: this.height // Goes down from ground
            };
        } else {
            return {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height
            };
        }
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

// ==================== GAME CLASS ====================
class Game {
    constructor(canvas) {
        if (!canvas) {
            console.error('Canvas element not found!');
            throw new Error('Canvas element not found!');
        }
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        if (!this.ctx) {
            console.error('Could not get 2d context from canvas!');
            throw new Error('Could not get 2d context from canvas!');
        }
        
        this.state = GAME_STATE.MENU;
        this.currentLevel = 0;
        this.score = 0; // Current level score
        this.totalScore = 0; // Total score across all levels
        this.distance = 0;
        this.lives = 3; // Player lives (reduced to 3)
        this.player = null;
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.frameCount = 0;
        this.animationId = null;
        this.backgroundImages = {};
        this.groundOffset = 0; // For moving ground texture
        this.demoMode = false; // CPU control mode
        this.isMobile = isMobileDevice();
        this.demoTimer = null; // Timer for auto-demo
        this.lastInteractionTime = Date.now(); // Track last user interaction
        this.lastObstacleX = -1000; // Track last obstacle position for spacing
        
        // Points system
        this.points = POINTS_MANAGER.getPoints();
        
        // Wheel of Fortune
        this.wheelSquares = [];
        this.wheelSpinning = false;
        this.wheelSpinStartTime = 0;
        this.wheelSpinOffset = 0;
        this.wheelSelectedSquare = null;
        this.wheelSelectedSquareIndex = null; // Index of selected square in shuffled array
        this.wheelTargetSquare = null; // Pre-selected square for spin
        this.wheelTargetSquareIndex = null; // Index in shuffled array
        this.wheelTotalRotations = 0; // Total rotations for current spin
        this.wheelConfetti = [];
        this.wheelShowResult = false;
        this.wheelShowPrizeImage = false; // Flag to show prize image with delay
        this.wheelPrizeImageAlpha = 0; // Alpha for smooth fade-in of prize image
        this.wheelPrizeImageStartTime = 0; // Timer for prize image delay
        this.wheelOriginalOrder = []; // Store original order of images
        this.allCompleteSpinButtonBounds = null; // Button bounds for ALL_COMPLETE screen
        this.allCompletePlayAgainButtonBounds = null; // Button bounds for ALL_COMPLETE screen
        this.arenapsgmLinkBounds = null; // Link bounds for arenapsgm.ru link in menu
        this.initWheelOfFortune();
        
        this.setupCanvas();
        this.setupTelegram();
        this.setupControls();
        this.loadBackgroundImages();
        this.start();
        
        // Log version for debugging
        console.log('Krushka Game v2.1 - Updated:', new Date().toISOString());
        console.log('Speed:', CONFIG.BASE_SPEED, 'Spawn Rate Multiplier: 2.5x');
        console.log('Canvas size:', CONFIG.CANVAS_WIDTH, 'x', CONFIG.CANVAS_HEIGHT);
        console.log('Is mobile:', this.isMobile);
        console.log('Initial state:', this.state);
        console.log('Points:', this.points);
    }
    
    initWheelOfFortune() {
        // Initialize wheel squares with numbers 1-12
        this.wheelSquares = [];
        this.wheelImages = {}; // Cache for loaded images
        this.wheelOriginalOrder = []; // Store original order of images
        
        for (let i = 1; i <= WHEEL_CONFIG.SQUARES_COUNT; i++) {
            this.wheelOriginalOrder.push({
                number: i,
                link: WHEEL_CONFIG.getLink(i),
                imageUrl: WHEEL_CONFIG.getImage(i)
            });
            
            // Preload images
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Allow cross-origin images
            img.src = WHEEL_CONFIG.getImage(i);
            img.onload = () => {
                this.wheelImages[i] = img;
            };
            img.onerror = () => {
                console.warn(`Failed to load image for square ${i}`);
            };
        }
        
        // Initial shuffle
        this.shuffleWheelSquares();
    }
    
    shuffleWheelSquares() {
        // Shuffle the order of squares before each spin
        const shuffled = [...this.wheelOriginalOrder];
        // Fisher-Yates shuffle algorithm
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        this.wheelSquares = shuffled;
    }

    setupCanvas() {
        const resize = () => {
            const container = document.getElementById('game-container');
            if (!container) {
                console.error('Game container not found!');
                return;
            }
            
            const containerWidth = container.clientWidth || window.innerWidth;
            const containerHeight = container.clientHeight || window.innerHeight;
            
            // Recalculate optimal size on resize (for window resizing and 4K support)
            const optimalSize = getOptimalCanvasSize();
            const canvasWidth = optimalSize.width;
            const canvasHeight = optimalSize.height;
            
            // Update CONFIG dynamically
            CONFIG.CANVAS_WIDTH = canvasWidth;
            CONFIG.CANVAS_HEIGHT = canvasHeight;
            
            // For mobile devices, use full screen
            if (this.isMobile) {
                this.canvas.width = canvasWidth;
                this.canvas.height = canvasHeight;
                this.canvas.style.width = '100vw';
                this.canvas.style.height = '100vh';
            } else {
                // For desktop, calculate scale to fit screen while maintaining aspect ratio
                const scaleX = containerWidth / canvasWidth;
                const scaleY = containerHeight / canvasHeight;
                const scale = Math.min(scaleX, scaleY) || 1;
                
                // For very large screens (4K+), use full scale but limit to reasonable size
                const maxScale = Math.min(scale, 1.5);
                
                this.canvas.width = canvasWidth;
                this.canvas.height = canvasHeight;
                
                // Scale to fit screen while maintaining aspect ratio
                const scaledWidth = canvasWidth * maxScale;
                const scaledHeight = canvasHeight * maxScale;
                
                this.canvas.style.width = scaledWidth + 'px';
                this.canvas.style.height = scaledHeight + 'px';
            }
        };
        
        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', () => {
            setTimeout(resize, 100); // Delay to allow orientation change
        });
    }

    setupTelegram() {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.ready();
            window.Telegram.WebApp.expand();
            
            // Use theme colors if available
            const theme = window.Telegram.WebApp.themeParams;
            if (theme.bg_color) {
                document.body.style.background = theme.bg_color;
            }
        }
    }

    setupControls() {
        // Track if space is currently pressed
        this.spacePressed = false;
        this.touchActive = false;

        // Make canvas focusable for keyboard events
        this.canvas.setAttribute('tabindex', '0');
        this.canvas.style.outline = 'none';

        // Keyboard - keydown (use window to catch all events)
        const keydownHandler = (e) => {
            // Reset demo timer on any key press
            this.resetDemoTimer();
            
            const isSpace = e.code === 'Space' || e.key === ' ' || e.keyCode === 32;
            if (isSpace && !this.spacePressed) {
                e.preventDefault();
                e.stopPropagation();
                this.spacePressed = true;
                this.handleJumpStart();
            }
        };

        // Keyboard - keyup
        const keyupHandler = (e) => {
            const isSpace = e.code === 'Space' || e.key === ' ' || e.keyCode === 32;
            if (isSpace) {
                e.preventDefault();
                e.stopPropagation();
                if (this.spacePressed) {
                    this.spacePressed = false;
                    this.handleJumpRelease();
                }
            }
        };

        // Add listeners to both window and document
        // Use capture phase to catch events early
        window.addEventListener('keydown', keydownHandler, true);
        window.addEventListener('keyup', keyupHandler, true);
        document.addEventListener('keydown', keydownHandler, true);
        document.addEventListener('keyup', keyupHandler, true);
        this.canvas.addEventListener('keydown', keydownHandler);
        this.canvas.addEventListener('keyup', keyupHandler);
        
        // Also add a simple test handler to debug
        const testHandler = (e) => {
            if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
                console.log('Space detected!', {
                    state: this.state,
                    hasPlayer: !!this.player,
                    playerOnGround: this.player?.onGround,
                    playerJumping: this.player?.isJumping
                });
            }
        };
        window.addEventListener('keydown', testHandler);
        
        // Helper function to check wheel button clicks
        const checkAllCompleteButtonClick = (clientX, clientY) => {
            if (this.state !== GAME_STATE.ALL_COMPLETE) return false;
            if (!this.canvas) return false;
            
            const rect = this.canvas.getBoundingClientRect();
            if (!rect || rect.width === 0 || rect.height === 0) return false;
            
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const scaleX = this.canvas.width / (rect.width || 1);
            const scaleY = this.canvas.height / (rect.height || 1);
            const canvasX = x * scaleX;
            const canvasY = y * scaleY;
            
            // Check Spin button
            if (this.allCompleteSpinButtonBounds) {
                const btn = this.allCompleteSpinButtonBounds;
                if (canvasX >= btn.x && canvasX <= btn.x + btn.width &&
                    canvasY >= btn.y && canvasY <= btn.y + btn.height) {
                    // Reset wheel state and go to wheel
                    this.wheelSpinning = false;
                    this.wheelShowResult = false;
                    this.wheelSelectedSquare = null;
                    this.wheelConfetti = [];
                    this.wheelSpinOffset = 0;
                    this.state = GAME_STATE.WHEEL_OF_FORTUNE;
                    return true;
                }
            }
            
            // Check Play Again button
            if (this.allCompletePlayAgainButtonBounds) {
                const btn = this.allCompletePlayAgainButtonBounds;
                if (canvasX >= btn.x && canvasX <= btn.x + btn.width &&
                    canvasY >= btn.y && canvasY <= btn.y + btn.height) {
                    this.state = GAME_STATE.MENU;
                    // Reset game state
                    this.currentLevel = 0;
                    this.score = 0;
                    this.totalScore = 0;
                    this.distance = 0;
                    this.obstacles = [];
                    this.lastSpawnTime = 0;
                    this.lastObstacleX = -1000;
                    return true;
                }
            }
            
            return false;
        };
        
        const checkWheelButtonClick = (clientX, clientY) => {
            if (this.state !== GAME_STATE.WHEEL_OF_FORTUNE) return false;
            if (!this.canvas) return false;
            
            const rect = this.canvas.getBoundingClientRect();
            if (!rect || rect.width === 0 || rect.height === 0) return false;
            
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const scaleX = this.canvas.width / (rect.width || 1);
            const scaleY = this.canvas.height / (rect.height || 1);
            const canvasX = x * scaleX;
            const canvasY = y * scaleY;
            
            // Check link button
            if (this.wheelLinkButtonBounds) {
                const btn = this.wheelLinkButtonBounds;
                if (canvasX >= btn.x && canvasX <= btn.x + btn.width &&
                    canvasY >= btn.y && canvasY <= btn.y + btn.height) {
                    window.open(btn.link, '_blank');
                    return true;
                }
            }
            
            // Check back button
            if (this.wheelBackButtonBounds) {
                const btn = this.wheelBackButtonBounds;
                if (canvasX >= btn.x && canvasX <= btn.x + btn.width &&
                    canvasY >= btn.y && canvasY <= btn.y + btn.height) {
                    this.state = GAME_STATE.MENU;
                    this.wheelShowResult = false;
                    this.wheelSelectedSquare = null;
                    this.wheelConfetti = [];
                    this.wheelSpinning = false;
                    this.wheelSpinOffset = 0;
                    // Update points from localStorage
                    this.points = POINTS_MANAGER.getPoints();
                    return true;
                }
            }
            
            // Check spin button
            if (this.wheelSpinButtonBounds && !this.wheelSpinning && !this.wheelShowResult) {
                const btn = this.wheelSpinButtonBounds;
                if (canvasX >= btn.x && canvasX <= btn.x + btn.width &&
                    canvasY >= btn.y && canvasY <= btn.y + btn.height) {
                    this.spinWheel();
                    return true;
                }
            }
            
            // Check Spin Again button
            if (this.wheelSpinAgainButtonBounds && !this.wheelSpinning) {
                const btn = this.wheelSpinAgainButtonBounds;
                if (canvasX >= btn.x && canvasX <= btn.x + btn.width &&
                    canvasY >= btn.y && canvasY <= btn.y + btn.height) {
                    // Reset wheel state and spin again
                    this.wheelShowResult = false;
                    this.wheelSelectedSquare = null;
                    this.wheelConfetti = [];
                    this.wheelShowPrizeImage = false;
                    this.wheelPrizeImageAlpha = 0;
                    this.spinWheel(); // Start new spin
                    return true;
                }
            }
            
            // Check Play Again button
            if (this.wheelPlayAgainButtonBounds && !this.wheelSpinning) {
                const btn = this.wheelPlayAgainButtonBounds;
                if (canvasX >= btn.x && canvasX <= btn.x + btn.width &&
                    canvasY >= btn.y && canvasY <= btn.y + btn.height) {
                    this.state = GAME_STATE.MENU;
                    this.wheelShowResult = false;
                    this.wheelSelectedSquare = null;
                    this.wheelConfetti = [];
                    this.wheelSpinning = false;
                    this.wheelSpinOffset = 0;
                    this.wheelShowPrizeImage = false;
                    this.wheelPrizeImageAlpha = 0;
                    this.points = POINTS_MANAGER.getPoints();
                    return true;
                }
            }
            
            return false;
        };

        // Helper function to check if coordinates are in pause button area
        const isInPauseArea = (clientX, clientY) => {
            if (this.state !== GAME_STATE.PLAYING) {
                return false;
            }
            if (!this.canvas) return false;
            
            // Calculate pause button bounds if not set yet (fallback)
            let pauseBounds = this.pauseButtonBounds;
            if (!pauseBounds) {
                const pauseAreaSize = this.isMobile ? 100 : 120;
                pauseBounds = {
                    x: CONFIG.CANVAS_WIDTH - pauseAreaSize,
                    y: 0,
                    width: pauseAreaSize,
                    height: pauseAreaSize
                };
            }
            
            const rect = this.canvas.getBoundingClientRect();
            if (!rect || rect.width === 0 || rect.height === 0) return false;
            
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            const scaleX = this.canvas.width / (rect.width || 1);
            const scaleY = this.canvas.height / (rect.height || 1);
            const canvasX = x * scaleX;
            const canvasY = y * scaleY;
            
            return canvasX >= pauseBounds.x &&
                   canvasX <= pauseBounds.x + pauseBounds.width &&
                   canvasY >= pauseBounds.y &&
                   canvasY <= pauseBounds.y + pauseBounds.height;
        };

        // Mouse/Touch - start
        this.canvas.addEventListener('mousedown', (e) => {
            // Handle wheel of fortune clicks
            if (checkWheelButtonClick(e.clientX, e.clientY)) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            // Handle pause/unpause on click during paused state (anywhere on screen)
            if (this.state === GAME_STATE.PAUSED) {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
                return;
            }
            
            // Check if click is in pause button area first
            if (isInPauseArea(e.clientX, e.clientY)) {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
                return;
            }
            
            e.preventDefault();
            this.focusCanvas();
            this.resetDemoTimer(); // Reset timer on interaction
            this.touchActive = true;
            this.handleJumpStart();
        });

        this.canvas.addEventListener('touchstart', (e) => {
            // Handle all complete screen touches
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                if (checkAllCompleteButtonClick(touch.clientX, touch.clientY)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }
            
            // Handle wheel of fortune touches
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                if (checkWheelButtonClick(touch.clientX, touch.clientY)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
            }
            
            // Handle arenapsgm.ru link touch on menu
            if (e.touches && e.touches.length > 0 && this.state === GAME_STATE.MENU && this.arenapsgmLinkBounds) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                const scaleX = this.canvas.width / rect.width;
                const scaleY = this.canvas.height / rect.height;
                const canvasX = x * scaleX;
                const canvasY = y * scaleY;
                
                const link = this.arenapsgmLinkBounds;
                if (canvasX >= link.x && canvasX <= link.x + link.width &&
                    canvasY >= link.y && canvasY <= link.y + link.height) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(link.link, '_blank');
                    return;
                }
            }
            
            // Handle pause/unpause on touch during paused state (anywhere on screen)
            if (this.state === GAME_STATE.PAUSED) {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
                return;
            }
            
            // Check if touch is in pause button area first
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                if (isInPauseArea(touch.clientX, touch.clientY)) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.togglePause();
                    return;
                }
            }
            
            e.preventDefault();
            this.focusCanvas();
            this.resetDemoTimer(); // Reset timer on interaction
            this.touchActive = true;
            this.handleJumpStart();
        });

        // Also focus on click
        this.canvas.addEventListener('click', (e) => {
            // Handle all complete screen clicks
            if (checkAllCompleteButtonClick(e.clientX, e.clientY)) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            // Handle wheel of fortune clicks
            if (checkWheelButtonClick(e.clientX, e.clientY)) {
                e.preventDefault();
                e.stopPropagation();
                return;
            }
            
            this.focusCanvas();
            // Reset demo timer on any click
            this.resetDemoTimer();
            
            // Get click coordinates
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Scale coordinates to canvas coordinates
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const canvasX = x * scaleX;
            const canvasY = y * scaleY;
            
            // Handle arenapsgm.ru link click on menu
            if (this.state === GAME_STATE.MENU && this.arenapsgmLinkBounds) {
                const link = this.arenapsgmLinkBounds;
                if (canvasX >= link.x && canvasX <= link.x + link.width &&
                    canvasY >= link.y && canvasY <= link.y + link.height) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(link.link, '_blank');
                    return;
                }
            }
            
            // Handle pause button click - entire top right corner is clickable
            if (this.state === GAME_STATE.PLAYING && this.pauseButtonBounds) {
                // Check if clicked in the top right corner area (larger clickable zone)
                if (canvasX >= this.pauseButtonBounds.x &&
                    canvasX <= this.pauseButtonBounds.x + this.pauseButtonBounds.width &&
                    canvasY >= this.pauseButtonBounds.y &&
                    canvasY <= this.pauseButtonBounds.y + this.pauseButtonBounds.height) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Pause button clicked!', canvasX, canvasY, this.pauseButtonBounds); // Debug log
                    this.togglePause();
                    return;
                }
            }
            
            // Handle pause/unpause on click during paused state (anywhere on screen)
            if (this.state === GAME_STATE.PAUSED) {
                e.preventDefault();
                e.stopPropagation();
                this.togglePause();
                return;
            }
        });

        // Mouse/Touch - end
        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.touchActive = false;
            this.handleJumpRelease();
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchActive = false;
            this.handleJumpRelease();
        });

        // Also handle mouse/touch leave
        this.canvas.addEventListener('mouseleave', () => {
            this.touchActive = false;
            this.handleJumpRelease();
        });

        this.canvas.addEventListener('touchcancel', () => {
            this.touchActive = false;
            this.handleJumpRelease();
        });
    }

    handleJumpStart() {
        if (this.state === GAME_STATE.PLAYING && this.player && !this.demoMode) {
            this.player.startJumpCharge();
        } else if (this.state === GAME_STATE.PLAYING && this.demoMode) {
            // Stop demo mode on click/tap
            this.stopDemo();
        } else if (this.state === GAME_STATE.MENU) {
            this.startLevel(false); // Normal mode
        } else if (this.state === GAME_STATE.LEVEL_COMPLETE) {
            this.nextLevel();
        } else if (this.state === GAME_STATE.GAME_OVER) {
            // Reload page to restart game
            window.location.reload();
        } else if (this.state === GAME_STATE.ALL_COMPLETE) {
            // Button clicks are handled by checkAllCompleteButtonClick
            // No automatic action needed here
        } else if (this.state === GAME_STATE.WHEEL_OF_FORTUNE) {
            // Wheel interactions handled in click handlers
        }
    }
    
    
    spinWheel() {
        if (this.wheelSpinning || this.points < POINTS_MANAGER.WHEEL_COST) return;
        
        // Spend points
        if (POINTS_MANAGER.spendPoints(POINTS_MANAGER.WHEEL_COST)) {
            this.points = POINTS_MANAGER.getPoints();
            
            // Shuffle squares before each spin
            this.shuffleWheelSquares();
            
            // Reset spin state
            this.wheelSpinning = true;
            this.wheelSpinStartTime = Date.now();
            this.wheelShowResult = false;
            this.wheelSelectedSquare = null;
            this.wheelConfetti = [];
            this.wheelSpinOffset = 0; // Start from beginning
            
            // Random number of rotations (at least 8 full rotations)
            const minRotations = 8;
            const maxRotations = 12;
            this.wheelTotalRotations = minRotations + Math.random() * (maxRotations - minRotations);
            
            // Randomly select which square will be the prize (after shuffling)
            this.wheelTargetSquareIndex = Math.floor(Math.random() * WHEEL_CONFIG.SQUARES_COUNT);
        }
    }
    
    updateWheelOfFortune() {
        if (this.wheelSpinning) {
            const elapsed = Date.now() - this.wheelSpinStartTime;
            const progress = Math.min(elapsed / WHEEL_CONFIG.SPIN_DURATION, 1);
            
            const totalWidth = WHEEL_CONFIG.SQUARES_COUNT * WHEEL_CONFIG.SQUARE_WIDTH;
            const centerX = CONFIG.CANVAS_WIDTH / 2;
            
            if (progress >= 1) {
                // Spin complete - stop randomly inside the selected square
                this.wheelSpinning = false;
                
                // Get the selected square from shuffled array
                const selectedSquare = this.wheelSquares[this.wheelTargetSquareIndex];
                this.wheelSelectedSquare = selectedSquare.number;
                this.wheelSelectedSquareIndex = this.wheelTargetSquareIndex; // Save index for later use
                this.wheelShowResult = true;
                
                // Calculate offset to stop randomly inside the selected square (not at center)
                const wheelStartX = CONFIG.CANVAS_WIDTH / 2 - totalWidth / 2;
                const selectedSquareX = wheelStartX + (this.wheelTargetSquareIndex * WHEEL_CONFIG.SQUARE_WIDTH);
                
                // Random position inside the square (leave some margin from edges)
                // Use 20% margin from each edge, so random position is in the middle 60% of the square
                const margin = WHEEL_CONFIG.SQUARE_WIDTH * 0.2;
                const randomOffsetInSquare = margin + Math.random() * (WHEEL_CONFIG.SQUARE_WIDTH - 2 * margin);
                
                // Position arrow at random point inside the square
                // Arrow is at centerX, so we need: selectedSquareX + randomOffsetInSquare - wheelSpinOffset = centerX
                // Therefore: wheelSpinOffset = selectedSquareX + randomOffsetInSquare - centerX
                this.wheelSpinOffset = selectedSquareX + randomOffsetInSquare - centerX;
                
                this.wheelShowPrizeImage = false;
                this.wheelPrizeImageAlpha = 0;
                this.wheelPrizeImageStartTime = Date.now(); // Start timer for prize image delay
                
                // Create confetti
                this.createConfetti();
            } else {
                // Smooth deceleration with ease-out-quart
                const easeOut = 1 - Math.pow(1 - progress, 4);
                
                // Calculate final position: total rotations + target square position
                const wheelStartX = CONFIG.CANVAS_WIDTH / 2 - totalWidth / 2;
                const selectedSquareX = wheelStartX + (this.wheelTargetSquareIndex * WHEEL_CONFIG.SQUARE_WIDTH);
                const targetOffset = selectedSquareX + (WHEEL_CONFIG.SQUARE_WIDTH / 2) - centerX;
                
                // Total distance = rotations + target offset
                const totalDistance = (this.wheelTotalRotations * totalWidth) + targetOffset;
                
                // Interpolate with smooth deceleration
                this.wheelSpinOffset = totalDistance * (1 - easeOut);
            }
        }
        
        // Handle prize image delay and fade-in
        if (this.wheelShowResult && this.wheelSelectedSquare && !this.wheelSpinning) {
            const timeSinceStop = Date.now() - (this.wheelPrizeImageStartTime || Date.now());
            
            if (timeSinceStop >= WHEEL_CONFIG.PRIZE_DELAY) {
                // Start showing prize image with fade-in
                this.wheelShowPrizeImage = true;
                const fadeProgress = Math.min(
                    (timeSinceStop - WHEEL_CONFIG.PRIZE_DELAY) / WHEEL_CONFIG.PRIZE_FADE_DURATION,
                    1
                );
                this.wheelPrizeImageAlpha = fadeProgress;
            }
        }
        
        // Update confetti
        this.updateConfetti();
    }
    
    createConfetti() {
        this.wheelConfetti = [];
        const count = 50;
        for (let i = 0; i < count; i++) {
            this.wheelConfetti.push({
                x: CONFIG.CANVAS_WIDTH / 2,
                y: CONFIG.CANVAS_HEIGHT / 2 - 100,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 2,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                size: Math.random() * 8 + 4,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                life: 1.0
            });
        }
    }
    
    updateConfetti() {
        for (let confetti of this.wheelConfetti) {
            confetti.x += confetti.vx;
            confetti.y += confetti.vy;
            confetti.vy += 0.3; // Gravity
            confetti.rotation += confetti.rotationSpeed;
            confetti.life -= 0.02;
        }
        this.wheelConfetti = this.wheelConfetti.filter(c => c.life > 0);
    }
    

    handleDemoStart() {
        if (this.state === GAME_STATE.MENU) {
            this.startLevel(true); // Demo mode
        }
    }

    handleJumpRelease() {
        if (this.state === GAME_STATE.PLAYING && this.player) {
            this.player.releaseJump();
        }
    }

    // Fallback: quick jump on space press (for testing)
    handleQuickJump() {
        if (this.state === GAME_STATE.PLAYING && this.player && this.player.onGround && !this.player.isJumping) {
            this.player.velocityY = CONFIG.JUMP_STRENGTH_MIN;
            this.player.isJumping = true;
            this.player.onGround = false;
        }
    }

    // Focus canvas when clicking on it to enable keyboard input
    focusCanvas() {
        try {
            if (this.canvas && document.activeElement !== this.canvas) {
                this.canvas.focus();
            }
        } catch (e) {
            // Ignore focus errors
        }
    }

    loadBackgroundImages() {
        LEVELS.forEach((level, index) => {
            const img = new Image();
            img.src = level.backgroundImage;
            this.backgroundImages[index] = img;
        });
    }

    start() {
        try {
        this.state = GAME_STATE.MENU;
            // Update points from localStorage
            this.points = POINTS_MANAGER.getPoints();
            
            // Ensure canvas is properly sized
            if (this.canvas && (this.canvas.width === 0 || this.canvas.height === 0)) {
                this.canvas.width = CONFIG.CANVAS_WIDTH || 800;
                this.canvas.height = CONFIG.CANVAS_HEIGHT || 450;
            }
            
        // Draw immediately to show menu
        this.draw();
        // Start game loop
        this.gameLoop();
        // Focus canvas after a short delay to enable keyboard input
        setTimeout(() => this.focusCanvas(), 100);
        // Start demo timer
        this.startDemoTimer();
        } catch (error) {
            console.error('Error in start():', error);
            // Try to show error on canvas
            if (this.ctx) {
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, 0, 800, 450);
                this.ctx.fillStyle = '#FF0000';
                this.ctx.font = '20px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Error: ' + error.message, 400, 225);
            }
        }
    }
    
    startDemoTimer() {
        // Clear any existing timer
        if (this.demoTimer) {
            clearTimeout(this.demoTimer);
        }
        
        // Reset interaction time
        this.lastInteractionTime = Date.now();
        
        // Start timer for 15 seconds
        this.demoTimer = setTimeout(() => {
            if (this.state === GAME_STATE.MENU) {
                // Auto-start demo mode after 15 seconds of inactivity
                this.handleDemoStart();
            }
        }, 15000); // 15 seconds
    }
    
    resetDemoTimer() {
        // Reset timer on any user interaction
        this.lastInteractionTime = Date.now();
        if (this.state === GAME_STATE.MENU) {
            this.startDemoTimer();
        }
    }

    startLevel(demoMode = false) {
        // Clear demo timer when starting game
        if (this.demoTimer) {
            clearTimeout(this.demoTimer);
            this.demoTimer = null;
        }
        
        this.state = GAME_STATE.PLAYING;
        this.currentLevel = 0;
        this.score = 0; // Reset level score
        this.totalScore = 0; // Reset total score
        this.distance = 0;
        this.lives = 3; // Reset lives to 3
        this.player = new Player();
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.frameCount = 0;
        this.demoMode = demoMode;
        this.lastObstacleX = -1000; // Reset obstacle tracking
    }

    nextLevel() {
        if (this.demoMode) {
            // In demo mode, always loop levels
            this.currentLevel++;
            if (this.currentLevel >= LEVELS.length) {
                this.currentLevel = 0; // Loop back to level 1
            }
            this.distance = 0;
            this.obstacles = [];
            this.lastSpawnTime = 0;
            this.lastObstacleX = -1000;
            this.player = new Player();
            this.state = GAME_STATE.PLAYING;
        } else {
            this.currentLevel++;
            if (this.currentLevel >= LEVELS.length) {
                this.state = GAME_STATE.ALL_COMPLETE;
            } else {
                this.distance = 0;
                this.obstacles = [];
                this.lastSpawnTime = 0;
                this.lastObstacleX = -1000;
                this.player = new Player();
                this.state = GAME_STATE.PLAYING;
            }
        }
    }

    restartLevel() {
        this.distance = 0;
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.lastObstacleX = -1000;
        this.player = new Player();
        this.state = GAME_STATE.PLAYING;
        // Keep demo mode and lives if it was active
    }

    restartGame() {
        this.currentLevel = 0;
        this.score = 0;
        this.distance = 0;
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.player = new Player();
        this.state = GAME_STATE.PLAYING;
        this.demoMode = false; // Reset demo mode
    }
    
    stopDemo() {
        // Stop demo and return to menu
        this.demoMode = false;
        this.state = GAME_STATE.MENU;
        // Update points from localStorage
        this.points = POINTS_MANAGER.getPoints();
        // Restart demo timer
        this.startDemoTimer();
    }
    
    togglePause() {
        if (this.state === GAME_STATE.PLAYING) {
            this.state = GAME_STATE.PAUSED;
        } else if (this.state === GAME_STATE.PAUSED) {
            this.state = GAME_STATE.PLAYING;
        }
    }
    
    vibrate() {
        // Vibrate on mobile devices when collision occurs
        if (this.isMobile && navigator.vibrate) {
            try {
                // Vibration pattern: short vibration for collision
                // Pattern: [vibrate, pause, vibrate] - 100ms vibrate, 50ms pause, 100ms vibrate
                navigator.vibrate([100, 50, 100]);
            } catch (e) {
                // Ignore vibration errors (some browsers may not support it)
                console.log('Vibration not supported or failed:', e);
            }
        }
    }

    spawnObstacle() {
        const levelConfig = LEVELS[this.currentLevel];
        const x = CONFIG.CANVAS_WIDTH;
        
        // Calculate minimum safe distance between obstacles
        // Player max jump distance is approximately 250-300px
        const minDistance = 280; // Minimum distance between obstacles
        const safeDistance = 320; // Safe distance for comfortable gameplay
        const fireSequenceDistance = 200; // Distance for fire sequences (jumpable)
        const doubleObstacleDistance = 150; // Distance for double obstacles (levels 4-5)
        const tripleObstacleDistance = 120; // Distance for triple obstacles (levels 4-5)
        
        // Check if we can spawn obstacle (enough distance from last one)
        const distanceFromLast = x - this.lastObstacleX;
        if (distanceFromLast < minDistance) {
            return; // Don't spawn if too close
        }
        
        // For levels 4 and 5, check for double/triple obstacles
        const isLevel4Or5 = this.currentLevel >= 3; // Level 4 (index 3) or Level 5 (index 4)
        let spawnMultiple = false;
        let obstacleCount = 1;
        
        if (isLevel4Or5) {
            const rand = Math.random();
            if (rand < 0.07) { // 7% chance for triple
                obstacleCount = 3;
                spawnMultiple = true;
            } else if (rand < 0.25) { // 18% chance for double (0.07 + 0.18 = 0.25)
                obstacleCount = 2;
                spawnMultiple = true;
            }
        }
        
        // Smart obstacle generation with fire sequences
        let type;
        const lastObstacle = this.obstacles.length > 0 ? this.obstacles[this.obstacles.length - 1] : null;
        const secondLastObstacle = this.obstacles.length > 1 ? this.obstacles[this.obstacles.length - 2] : null;
        const thirdLastObstacle = this.obstacles.length > 2 ? this.obstacles[this.obstacles.length - 3] : null;
        
        // Check if we're in a fire sequence pattern
        const inFireSequence = lastObstacle && secondLastObstacle && 
                               lastObstacle.type === 'fire' && secondLastObstacle.type === 'fire';
        
        // For multiple obstacles, alternate types
        if (spawnMultiple) {
            // Spawn multiple obstacles with alternating types
            let currentX = x;
            let lastType = lastObstacle ? lastObstacle.type : null;
            
            for (let i = 0; i < obstacleCount; i++) {
                const obstacleDistance = i === 0 ? 0 : 
                                       (i === 1 ? doubleObstacleDistance : tripleObstacleDistance);
                
                // Determine type - alternate between fire and pit
                if (lastType === null) {
                    // First obstacle in group - random
                    type = Math.random() < 0.5 ? 'fire' : 'pit';
                } else {
                    // Alternate from previous type
                    type = lastType === 'pit' ? 'fire' : 'pit';
                }
                
                const obstacle = new Obstacle(currentX, type, this.currentLevel);
                this.obstacles.push(obstacle);
                const obstacleWidth = type === 'pit' ? CONFIG.PIT_WIDTH : CONFIG.OBSTACLE_WIDTH;
                this.lastObstacleX = currentX + obstacleWidth;
                lastType = type;
                currentX = this.lastObstacleX + obstacleDistance;
            }
            return; // Done spawning multiple obstacles
        }
        
        // Single obstacle logic
        // 40% chance to create fire sequence, 30% chance for pit (more obstacles)
        if (!inFireSequence && Math.random() < 0.4 && distanceFromLast >= fireSequenceDistance) {
            // Start fire sequence
            type = 'fire';
        } else if (!inFireSequence && Math.random() < 0.3 && distanceFromLast >= minDistance) {
            // Add more pits
            type = 'pit';
        }
        // Continue fire sequence if we're in one
        else if (inFireSequence && distanceFromLast >= fireSequenceDistance) {
            type = 'fire'; // Continue sequence
        }
        // Check for problematic patterns - prevent 3+ of same type in a row (except fire sequences)
        else if (lastObstacle && secondLastObstacle && thirdLastObstacle) {
            // If last three were same type, force opposite
            if (lastObstacle.type === 'pit' && secondLastObstacle.type === 'pit' && thirdLastObstacle.type === 'pit') {
                type = 'fire'; // Force fire after 3 pits
            } else if (lastObstacle.type === 'fire' && secondLastObstacle.type === 'fire' && thirdLastObstacle.type === 'fire') {
                type = 'pit'; // Force pit after 3 fires (end sequence)
            } else if (lastObstacle.type === 'pit' && secondLastObstacle.type === 'pit') {
                type = 'fire'; // Avoid 3rd pit
            } else {
                // Alternate pattern
                type = lastObstacle.type === 'pit' ? 'fire' : 'pit';
            }
        }
        // Check for problematic patterns with 2 obstacles
        else if (lastObstacle && secondLastObstacle) {
            // If last two were pits, next must be fire (avoid 3 pits in a row)
            if (lastObstacle.type === 'pit' && secondLastObstacle.type === 'pit') {
                type = 'fire';
            }
            // If last two were fires (not in sequence), next must be pit
            else if (lastObstacle.type === 'fire' && secondLastObstacle.type === 'fire' && distanceFromLast < fireSequenceDistance) {
                type = 'pit';
            }
            // Alternate pattern
            else {
                type = lastObstacle.type === 'pit' ? 'fire' : 'pit';
            }
        }
        // If only one obstacle exists
        else if (lastObstacle) {
            // Prefer alternating pattern
            type = lastObstacle.type === 'pit' ? 'fire' : 'pit';
        }
        // First obstacle - random
        else {
            type = Math.random() < 0.5 ? 'pit' : 'fire';
        }
        
        // Ensure minimum distance between obstacles
        if (distanceFromLast < safeDistance && lastObstacle && !inFireSequence) {
            // If too close and not in fire sequence, skip this spawn
            return;
        }
        
        const obstacle = new Obstacle(x, type, this.currentLevel);
        this.obstacles.push(obstacle);
        this.lastObstacleX = x + (type === 'pit' ? CONFIG.PIT_WIDTH : CONFIG.OBSTACLE_WIDTH);
    }

    checkCollisions() {
        const playerBounds = this.player.getBounds();
        const playerBottomY = this.player.y; // Player's bottom Y coordinate
        
        for (let obstacle of this.obstacles) {
            if (obstacle.type === 'pit') {
                // For pits: check if player is over the pit and below ground level
                const pitBounds = obstacle.getBounds();
                const isOverPit = playerBounds.x < pitBounds.x + pitBounds.width &&
                                  playerBounds.x + playerBounds.width > pitBounds.x;
                
                if (isOverPit && playerBottomY >= CONFIG.GROUND_Y) {
                    // Player is over pit and on/below ground level - fell into pit
                    this.vibrate(); // Vibrate on mobile devices
                    this.loseLife();
                    return true;
                }
            } else {
                // For fires: standard rectangle collision
                const obstacleBounds = obstacle.getBounds();
                
                if (playerBounds.x < obstacleBounds.x + obstacleBounds.width &&
                    playerBounds.x + playerBounds.width > obstacleBounds.x &&
                    playerBounds.y < obstacleBounds.y + obstacleBounds.height &&
                    playerBounds.y + playerBounds.height > obstacleBounds.y) {
                    
                    // Collision detected
                    this.vibrate(); // Vibrate on mobile devices
                    this.loseLife();
                    return true;
                }
            }
        }
        
        return false;
    }
    
    loseLife() {
        this.lives--;
        
        if (this.lives <= 0) {
            // No lives left - show GAME OVER screen
            this.state = GAME_STATE.GAME_OVER;
        } else {
            // Still have lives - continue from current position
            // Small invincibility period - remove obstacle that caused collision
            // This prevents immediate death from same obstacle
            if (this.obstacles.length > 0) {
                // Remove the obstacle that caused collision
                const playerBounds = this.player.getBounds();
                const playerBottomY = this.player.y;
                
                const collidedObstacle = this.obstacles.find(obs => {
                    if (obs.type === 'pit') {
                        const pitBounds = obs.getBounds();
                        const isOverPit = playerBounds.x < pitBounds.x + pitBounds.width &&
                                         playerBounds.x + playerBounds.width > pitBounds.x;
                        return isOverPit && playerBottomY >= CONFIG.GROUND_Y;
                    } else {
                        const obsBounds = obs.getBounds();
                        return playerBounds.x < obsBounds.x + obsBounds.width &&
                               playerBounds.x + playerBounds.width > obsBounds.x &&
                               playerBounds.y < obsBounds.y + obsBounds.height &&
                               playerBounds.y + playerBounds.height > obsBounds.y;
                    }
                });
                
                if (collidedObstacle) {
                    const index = this.obstacles.indexOf(collidedObstacle);
                    if (index > -1) {
                        this.obstacles.splice(index, 1);
                    }
                }
                
                // ALWAYS update lastObstacleX to the rightmost remaining obstacle
                // CRITICAL: This ensures obstacles continue spawning after life loss
                if (this.obstacles.length > 0) {
                    const rightmostObstacle = this.obstacles.reduce((rightmost, obs) => {
                        const obsEndX = obs.x + (obs.type === 'pit' ? CONFIG.PIT_WIDTH : CONFIG.OBSTACLE_WIDTH);
                        return obsEndX > rightmost ? obsEndX : rightmost;
                    }, 0);
                    // Use the maximum of current lastObstacleX and rightmost obstacle
                    // This ensures spawning continues even if obstacle was removed
                    this.lastObstacleX = Math.max(this.lastObstacleX, rightmostObstacle);
                } else {
                    // No obstacles left - set to allow immediate spawning
                    // Reset to a position that allows new obstacles to spawn
                    this.lastObstacleX = Math.min(CONFIG.CANVAS_WIDTH - 300, Math.max(CONFIG.CANVAS_WIDTH - 500, this.lastObstacleX - 100));
                }
            } else {
                // No obstacles at all - reset to allow spawning immediately
                this.lastObstacleX = CONFIG.CANVAS_WIDTH - 300;
            }
        }
    }
    
    drawHeart(ctx, x, y, size) {
        // Draw a simple heart symbol (♥)
        ctx.save();
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('♥', x, y);
        ctx.restore();
    }

    updateAI() {
        if (!this.demoMode || !this.player || !this.player.onGround) return;
        
        // Find nearest obstacle
        let nearestObstacle = null;
        let nearestDistance = Infinity;
        
        for (let obstacle of this.obstacles) {
            const distance = obstacle.x - (this.player.x + this.player.width);
            if (distance > 0 && distance < nearestDistance) {
                nearestDistance = distance;
                nearestObstacle = obstacle;
            }
        }
        
        // Jump if obstacle is close enough
        if (nearestObstacle && nearestDistance > 0) {
            const obstacleType = nearestObstacle.type;
            const jumpDistance = obstacleType === 'pit' ? CONFIG.AI_JUMP_DISTANCE_PIT : CONFIG.AI_JUMP_DISTANCE_FIRE;
            
            if (nearestDistance < jumpDistance) {
                // Calculate jump strength based on obstacle type, distance, and level difficulty
                let jumpPower;
                
                if (obstacleType === 'pit') {
                    // For pits, use stronger jump based on distance - closer = stronger jump needed
                    const distanceRatio = Math.max(0, Math.min(1, nearestDistance / CONFIG.AI_JUMP_DISTANCE_PIT));
                    // Closer to pit = need stronger jump (inverse relationship)
                    jumpPower = CONFIG.AI_JUMP_CHARGE_MIN + 
                               (CONFIG.AI_JUMP_CHARGE_MAX - CONFIG.AI_JUMP_CHARGE_MIN) * (1 - distanceRatio * 0.5);
                } else {
                    // For fires, use moderate jump based on distance
                    const distanceRatio = Math.max(0, Math.min(1, nearestDistance / CONFIG.AI_JUMP_DISTANCE_FIRE));
                    jumpPower = CONFIG.AI_JUMP_CHARGE_MIN + 
                               (CONFIG.AI_JUMP_CHARGE_MAX - CONFIG.AI_JUMP_CHARGE_MIN) * (0.5 + distanceRatio * 0.3);
                }
                
                // Add some randomness for realism (5% variation)
                jumpPower += (Math.random() - 0.5) * 0.1;
                jumpPower = Math.max(CONFIG.AI_JUMP_CHARGE_MIN, Math.min(CONFIG.AI_JUMP_CHARGE_MAX, jumpPower));
                
                const jumpStrength = CONFIG.JUMP_STRENGTH_MIN + 
                                    (CONFIG.JUMP_STRENGTH_MAX - CONFIG.JUMP_STRENGTH_MIN) * jumpPower;
                
                if (this.player.onGround && !this.player.isJumping) {
                    this.player.velocityY = jumpStrength;
                    this.player.isJumping = true;
                    this.player.onGround = false;
                }
            }
        }
    }

    update() {
        // Don't update if paused
        if (this.state === GAME_STATE.PAUSED) {
            return;
        }
        
        // Update Wheel of Fortune
        if (this.state === GAME_STATE.WHEEL_OF_FORTUNE) {
            this.updateWheelOfFortune();
            return;
        }
        
        // Always update ground offset for smooth animation (even in menu)
        if (this.state === GAME_STATE.PLAYING) {
            const levelConfig = LEVELS[this.currentLevel];
            // In demo mode, slow down time slightly (0.9x speed for more realistic feel)
            const timeMultiplier = this.demoMode ? 0.9 : 1.0;
            const speed = levelConfig.speed * timeMultiplier;
            
            // Update player
            this.player.update();
            
            // AI control in demo mode
            if (this.demoMode) {
                this.updateAI();
            }

            // Update distance and score (slower in demo)
            this.distance += speed;
            this.score = Math.floor(this.distance / 10);

            // Update ground offset for animation
            this.groundOffset = (this.groundOffset + speed) % CONFIG.GROUND_TEXTURE_SIZE;

            // Spawn obstacles (much more obstacles for difficulty - increased even more)
            const baseSpawnRate = levelConfig.spawnRate * 2.5; // 150% more obstacles (2.5x)
            const spawnRate = this.demoMode ? baseSpawnRate * 0.85 : baseSpawnRate;
            if (Math.random() < spawnRate) {
                this.spawnObstacle();
            }

            // Update obstacles
            this.obstacles.forEach(obstacle => obstacle.update(speed));
            this.obstacles = this.obstacles.filter(obstacle => {
                if (obstacle.isOffScreen()) {
                    // Update last obstacle position when obstacle goes off screen
                    const obstacleEndX = obstacle.x + (obstacle.type === 'pit' ? CONFIG.PIT_WIDTH : CONFIG.OBSTACLE_WIDTH);
                    if (obstacleEndX < 0) {
                        this.lastObstacleX = Math.min(this.lastObstacleX, obstacleEndX);
                    }
                    return false;
                }
                return true;
            });

            // Check collisions (skip in demo mode to allow infinite play)
            if (!this.demoMode) {
                this.checkCollisions();
            }

            // Check level complete - use score instead of distance
            const targetScore = this.demoMode ? 102 : 50; // 102 for demo mode, 50 for normal mode
            if (this.score >= targetScore) {
                // Add current level score to total score
                this.totalScore += this.score;
                
                // Award 100 points for completing 8 levels (level index 7 = 8th level)
                if (!this.demoMode && this.currentLevel === 7) {
                    const newPoints = POINTS_MANAGER.addPoints(POINTS_MANAGER.POINTS_PER_8_LEVELS);
                    this.points = newPoints;
                    console.log(`Awarded ${POINTS_MANAGER.POINTS_PER_8_LEVELS} points! Total: ${newPoints}`);
                }
                
                if (this.demoMode) {
                    // In demo mode, automatically go to next level (looping)
                    this.nextLevel();
                } else {
                    this.state = GAME_STATE.LEVEL_COMPLETE;
                }
            }
        } else {
            // Animate ground in menu too (slower)
            this.groundOffset = (this.groundOffset + 1) % CONFIG.GROUND_TEXTURE_SIZE;
        }

        this.frameCount++;
    }

    drawBackground() {
        // Use level 0 (Morning) for menu, or current level for gameplay
        const levelIndex = (this.state === GAME_STATE.MENU) ? 0 : this.currentLevel;
        const levelConfig = LEVELS[levelIndex];
        
        if (!levelConfig) {
            // Fallback if level config is missing
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
            return;
        }
        
        // Draw sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.CANVAS_HEIGHT);
        gradient.addColorStop(0, levelConfig.skyColor);
        gradient.addColorStop(1, levelConfig.skyColor2);
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        // Draw stars for night level
        if (levelIndex === 4) {
            this.ctx.fillStyle = '#FFFFFF';
            for (let i = 0; i < 50; i++) {
                const x = (i * 37) % CONFIG.CANVAS_WIDTH;
                const y = (i * 73) % (CONFIG.CANVAS_HEIGHT / 2);
                const size = (i % 3) + 1;
                this.ctx.fillRect(x, y, size, size);
            }
        }

        // Try to draw background image if available
        const bgImage = this.backgroundImages[levelIndex];
        if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
            this.ctx.drawImage(bgImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        }
    }

    drawGround() {
        // Use level 0 (Morning) for menu, or current level for gameplay
        const levelIndex = (this.state === GAME_STATE.MENU) ? 0 : this.currentLevel;
        const levelConfig = LEVELS[levelIndex];
        
        if (!levelConfig) {
            // Fallback if level config is missing
            this.ctx.fillStyle = '#8B7355';
            this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y);
            return;
        }
        
        // Draw ground base color
        this.ctx.fillStyle = levelConfig.groundColor;
        this.ctx.fillRect(0, CONFIG.GROUND_Y, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y);
        
        // Draw animated ground texture/pattern (moving lines)
        this.ctx.fillStyle = '#6B5B47';
        const textureSize = CONFIG.GROUND_TEXTURE_SIZE;
        const startX = -this.groundOffset;
        
        for (let i = startX; i < CONFIG.CANVAS_WIDTH + textureSize; i += textureSize) {
            this.ctx.fillRect(i, CONFIG.GROUND_Y, 2, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y);
        }
        
        // Draw additional texture lines for depth
        this.ctx.fillStyle = '#5A4A37';
        for (let i = startX + textureSize / 2; i < CONFIG.CANVAS_WIDTH + textureSize; i += textureSize) {
            this.ctx.fillRect(i, CONFIG.GROUND_Y + 10, 1, CONFIG.CANVAS_HEIGHT - CONFIG.GROUND_Y - 10);
        }
    }

    drawUI() {
        const levelConfig = LEVELS[this.currentLevel];
        const edgeOffset = 40; // 40px offset from edge
        const uiY = this.isMobile ? 140 : 100; // Level position
        const uiY2 = this.isMobile ? 100 : 80; // Level name position (100px from top on mobile)
        const livesY = this.isMobile ? 160 : 130; // Lives position (moved down by 40px: was 120/90, now 160/130)
        const scoreY = this.isMobile ? 80 : 80; // Score position (80px from top on mobile)
        const pointsY = this.isMobile ? 60 : 60; // Points position
        
        // Level indicator (left side with 40px offset)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = this.isMobile ? 'bold 15px monospace' : 'bold 18px monospace'; // 15px for headers
        this.ctx.fillText(`Level: ${this.currentLevel + 1}/${LEVELS.length}`, edgeOffset, uiY);
        
        // Points (below LEVEL, left side)
        this.ctx.font = this.isMobile ? 'bold 13px monospace' : 'bold 16px monospace';
        const pointsText = `Points: ${this.points}`;
        this.ctx.fillStyle = '#FFD700'; // Gold color for points
        this.ctx.fillText(pointsText, edgeOffset, uiY2);
        this.ctx.fillStyle = '#FFFFFF'; // Reset to white
        
        this.ctx.font = this.isMobile ? '13px monospace' : '16px monospace'; // 13px for text
        this.ctx.fillText(levelConfig.name, edgeOffset, uiY2 + (this.isMobile ? 20 : 25));

        // Score (right side with 40px offset)
        this.ctx.font = this.isMobile ? 'bold 15px monospace' : 'bold 18px monospace'; // 15px for headers
        const scoreText = `Score: ${this.score}`;
        const scoreWidth = this.ctx.measureText(scoreText).width;
        const scoreX = CONFIG.CANVAS_WIDTH - scoreWidth - edgeOffset; // 40px from right edge
        this.ctx.fillText(scoreText, scoreX, uiY);
        
        // Pause button (under Score) - visible icon
        const pauseY = 100; // Visual Y position from top
        const pauseSize = this.isMobile ? 18 : 22;
        const pauseButtonX = CONFIG.CANVAS_WIDTH - 80 - pauseSize; // Visual X position from right
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(pauseButtonX, pauseY - pauseSize / 2, pauseSize / 3, pauseSize);
        this.ctx.fillRect(pauseButtonX + pauseSize / 2, pauseY - pauseSize / 2, pauseSize / 3, pauseSize);
        
        // ENTIRE TOP RIGHT CORNER is clickable for pause (200x200 zone)
        const pauseAreaSize = 200;
        this.pauseButtonBounds = {
            x: CONFIG.CANVAS_WIDTH - pauseAreaSize,
            y: 0,
            width: pauseAreaSize,
            height: pauseAreaSize
        };
        
        // Lives display (left side with 40px offset)
        this.ctx.font = this.isMobile ? '13px monospace' : '14px monospace'; // 13px for text
        const livesText = 'Lives:';
        const livesTextWidth = this.ctx.measureText(livesText).width;
        this.ctx.fillText(livesText, edgeOffset, livesY);
        
        // Hearts
        const heartSize = this.isMobile ? 12 : 14;
        const heartSpacing = heartSize + 4;
        const heartsStartX = edgeOffset + livesTextWidth + 8;
        
        for (let i = 0; i < 3; i++) {
            const heartX = heartsStartX + (i * heartSpacing);
            this.ctx.fillStyle = (i < this.lives) ? '#E74C3C' : '#555555';
            this.drawHeart(this.ctx, heartX, livesY - heartSize / 2, heartSize);
        }
        
        // Demo mode indicator
        if (this.demoMode) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 14px monospace';
            this.ctx.fillText('DEMO MODE', CONFIG.CANVAS_WIDTH / 2 - 60, uiY);
        }

        // Jump charge indicator (when charging) - centered at bottom
        if (this.player && this.player.jumpCharging && this.player.onGround) {
            const chargePercent = this.player.jumpChargePower;
            const barWidth = Math.min(300, CONFIG.CANVAS_WIDTH - 40); // Responsive width
            const barHeight = 18;
            const barX = CONFIG.CANVAS_WIDTH / 2 - barWidth / 2;
            const barY = CONFIG.CANVAS_HEIGHT - 50;

            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(barX - 5, barY - 5, barWidth + 10, barHeight + 10);

            // Charge bar background
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);

            // Charge bar fill (green to yellow to red)
            const hue = 120 - (chargePercent * 60); // Green (120) to Yellow (60) to Red (0)
            this.ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            this.ctx.fillRect(barX, barY, barWidth * chargePercent, barHeight);

            // Border
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(barX, barY, barWidth, barHeight);

            // Text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('JUMP POWER', CONFIG.CANVAS_WIDTH / 2, barY - 8);
            this.ctx.textAlign = 'left';
        }
    }

    drawMenu() {
        try {
            // Draw background first
            this.drawBackground();
            this.drawGround();
        } catch (error) {
            console.error('Error drawing menu background:', error);
        }

        const edgeOffset = 40; // 40px offset from edge
        const canvasWidth = CONFIG.CANVAS_WIDTH || this.canvas.width || 800;
        const canvasHeight = CONFIG.CANVAS_HEIGHT || this.canvas.height || 450;

        // Title with shadow for visibility (adjusted for vertical)
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Title shadow
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 36px monospace';
        this.ctx.fillText('Krushka', canvasWidth / 2 + 2, canvasHeight / 2 - 100 + 2);
        
        // Title
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Krushka', canvasWidth / 2, canvasHeight / 2 - 100);
        
        // Subtitle
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('Knight Rider', canvasWidth / 2 + 1, canvasHeight / 2 - 60 + 1);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Knight Rider', canvasWidth / 2, canvasHeight / 2 - 60);

        // Instructions (smaller for vertical)
        this.ctx.font = '14px monospace';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('Tap or Hold to Jump', canvasWidth / 2 + 1, canvasHeight / 2 - 20 + 1);
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillText('Tap or Hold to Jump', canvasWidth / 2, canvasHeight / 2 - 20);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('Avoid obstacles!', canvasWidth / 2 + 1, canvasHeight / 2 + 10 + 1);
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillText('Avoid obstacles!', canvasWidth / 2, canvasHeight / 2 + 10);

        // Points display in menu (top right, moved down by 20px and right by 25px)
        this.ctx.font = 'bold 16px monospace';
        const pointsText = `Points: ${this.points || 0}`;
        const pointsWidth = this.ctx.measureText(pointsText).width;
        const pointsX = canvasWidth - pointsWidth - edgeOffset + 25; // Moved right by 25px
        this.ctx.fillStyle = '#FFD700'; // Gold color for points
        this.ctx.fillText(pointsText, pointsX, 100); // Moved from 80 to 100 (20px lower)
        this.ctx.fillStyle = '#FFFFFF'; // Reset to white

        // Start button with border (smaller for vertical)
        const btnWidth = Math.min(250, canvasWidth - 40);
        const btnHeight = 45;
        const startY = canvasHeight / 2 + 50;
        
        // START GAME button
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(canvasWidth / 2 - btnWidth / 2 - 5, startY, btnWidth + 10, btnHeight + 10);
        this.ctx.fillStyle = '#27AE60';
        this.ctx.fillRect(canvasWidth / 2 - btnWidth / 2, startY + 5, btnWidth, btnHeight);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.fillText('START GAME', canvasWidth / 2, startY + 30);
        
        // Show "From the creators of arenapsgm.ru 2026" text
            this.ctx.font = '12px monospace';
            this.ctx.fillStyle = '#888888';
        this.ctx.textAlign = 'left';
        
        const textY = startY + btnHeight + 30;
        const textLine1 = 'From the creators of ';
        const linkText = 'arenapsgm.ru';
        const textLine2 = ' 2026';
        const fullText = textLine1 + linkText + textLine2;
        
        // Measure text widths
        const textLine1Width = this.ctx.measureText(textLine1).width;
        const linkTextWidth = this.ctx.measureText(linkText).width;
        const textLine2Width = this.ctx.measureText(textLine2).width;
        const fullTextWidth = this.ctx.measureText(fullText).width;
        
        // Calculate starting X position to center the full text
        const textStartX = canvasWidth / 2 - fullTextWidth / 2;
        
        // Draw text line 1
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText(textLine1, textStartX, textY);
        
        // Draw link text (same style as other text, but still clickable)
        const linkX = textStartX + textLine1Width;
        this.ctx.fillStyle = '#888888'; // Same color as other text
        this.ctx.fillText(linkText, linkX, textY);
        
        // Draw text line 2
        const linkTextHeight = 12; // Approximate text height
        const textLine2X = linkX + linkTextWidth;
        this.ctx.fillText(textLine2, textLine2X, textY);
        
        // Store link bounds for click detection
        this.arenapsgmLinkBounds = {
            x: linkX,
            y: textY - linkTextHeight,
            width: linkTextWidth,
            height: linkTextHeight + 5,
            link: 'https://t.me/APSGMbot/?startapp&addToHomeScreen'
        };

        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }

    drawLevelComplete() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 28px monospace';
        this.ctx.textAlign = 'center';
        
        if (this.currentLevel < LEVELS.length - 1) {
            this.ctx.fillText(`Level ${this.currentLevel + 1} Complete!`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 60);
            this.ctx.font = '20px monospace';
            this.ctx.fillText(`Score: ${this.score} / 50`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);
            this.ctx.font = '16px monospace';
            this.ctx.fillText('Tap for Next Level', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
        }

        this.ctx.textAlign = 'left';
    }

    drawGameOver() {
        // Add current level score to total before showing
        const finalTotalScore = this.totalScore + this.score;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = '#E74C3C';
        this.ctx.font = 'bold 36px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 60);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px monospace';
        this.ctx.fillText(`Final Score: ${finalTotalScore}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);
        this.ctx.font = '18px monospace';
        this.ctx.fillText('Tap to Restart', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);

        this.ctx.textAlign = 'left';
    }

    drawAllComplete() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = '#F39C12';
        this.ctx.font = 'bold 28px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Congratulations!', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 120);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '18px monospace';
        this.ctx.fillText(`You finished all ${LEVELS.length} levels!`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 80);
        this.ctx.font = '20px monospace';
        this.ctx.fillText(`Final Score: ${this.totalScore}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 40);
        
        // Draw buttons
        const buttonWidth = 250;
        const buttonHeight = 50;
        const buttonX = CONFIG.CANVAS_WIDTH / 2 - buttonWidth / 2;
        const buttonSpacing = 60;
        let currentButtonY = CONFIG.CANVAS_HEIGHT / 2;
        
        // Check if player has enough points for wheel
        this.points = POINTS_MANAGER.getPoints();
        const canSpin = this.points >= POINTS_MANAGER.WHEEL_COST;
        
        // 1. Spin button (if has enough points)
        if (canSpin) {
            this.ctx.fillStyle = '#27AE60';
            this.ctx.fillRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 18px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Spin (${POINTS_MANAGER.WHEEL_COST} points)`, CONFIG.CANVAS_WIDTH / 2, currentButtonY + 32);
            this.allCompleteSpinButtonBounds = { x: buttonX, y: currentButtonY, width: buttonWidth, height: buttonHeight };
            currentButtonY += buttonSpacing;
        } else {
            this.allCompleteSpinButtonBounds = null;
        }
        
        // 2. Play Again button
        this.ctx.fillStyle = '#3498DB';
        this.ctx.fillRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 18px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Play Again', CONFIG.CANVAS_WIDTH / 2, currentButtonY + 32);
        this.allCompletePlayAgainButtonBounds = { x: buttonX, y: currentButtonY, width: buttonWidth, height: buttonHeight };

        this.ctx.textAlign = 'left';
    }

    draw() {
        try {
            // Ensure canvas and context exist
            if (!this.canvas || !this.ctx) {
                console.error('Canvas or context not available');
                return;
            }
            
        // Ensure canvas has proper size
            const canvasWidth = CONFIG.CANVAS_WIDTH || 800;
            const canvasHeight = CONFIG.CANVAS_HEIGHT || 450;
            
        if (this.canvas.width === 0 || this.canvas.height === 0) {
                this.canvas.width = canvasWidth;
                this.canvas.height = canvasHeight;
        }
        
        // Clear canvas with a background color first
        this.ctx.fillStyle = '#87CEEB'; // Light blue fallback
            this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        if (this.state === GAME_STATE.MENU) {
            this.drawMenu();
        } else if (this.state === GAME_STATE.PLAYING) {
            this.drawBackground();
            this.drawGround();
                if (this.obstacles && this.obstacles.length > 0) {
            this.obstacles.forEach(obstacle => obstacle.draw(this.ctx, LEVELS[this.currentLevel]));
                }
                if (this.player) {
            this.player.draw(this.ctx);
                }
            this.drawUI();
        } else if (this.state === GAME_STATE.PAUSED) {
            // Draw game in background when paused
            this.drawBackground();
            this.drawGround();
                if (this.obstacles && this.obstacles.length > 0) {
            this.obstacles.forEach(obstacle => obstacle.draw(this.ctx, LEVELS[this.currentLevel]));
                }
                if (this.player) {
            this.player.draw(this.ctx);
                }
            this.drawUI();
            this.drawPauseScreen();
        } else if (this.state === GAME_STATE.LEVEL_COMPLETE) {
            this.drawBackground();
            this.drawGround();
                if (this.player) {
            this.player.draw(this.ctx);
                }
            this.drawLevelComplete();
        } else if (this.state === GAME_STATE.GAME_OVER) {
            this.drawBackground();
            this.drawGround();
                if (this.obstacles && this.obstacles.length > 0) {
                this.obstacles.forEach(obstacle => obstacle.draw(this.ctx, LEVELS[this.currentLevel]));
            }
            if (this.player) {
                this.player.draw(this.ctx);
            }
            this.drawGameOver();
        } else if (this.state === GAME_STATE.ALL_COMPLETE) {
            this.drawAllComplete();
            } else if (this.state === GAME_STATE.WHEEL_OF_FORTUNE) {
                this.drawWheelOfFortune();
            }
        } catch (error) {
            console.error('Error in draw():', error);
            // Draw error message
            if (this.ctx) {
                const canvasWidth = CONFIG.CANVAS_WIDTH || 800;
                const canvasHeight = CONFIG.CANVAS_HEIGHT || 450;
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                this.ctx.fillStyle = '#FF0000';
                this.ctx.font = '20px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Error: ' + error.message, canvasWidth / 2, canvasHeight / 2);
                console.error('Draw error details:', error.stack);
            }
        }
    }
    
    drawWheelOfFortune() {
        // Draw background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // Title (moved lower by 70px)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Wheel of Fortune', CONFIG.CANVAS_WIDTH / 2, 150);
        
        // Points display (moved lower by 70px)
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillText(`Your Points: ${this.points}`, CONFIG.CANVAS_WIDTH / 2, 190);
        
        // Draw wheel (horizontal strip)
        const wheelY = CONFIG.CANVAS_HEIGHT / 2 - 80;
        const wheelHeight = WHEEL_CONFIG.SQUARE_HEIGHT;
        const totalWidth = WHEEL_CONFIG.SQUARES_COUNT * WHEEL_CONFIG.SQUARE_WIDTH;
        const wheelStartX = CONFIG.CANVAS_WIDTH / 2 - totalWidth / 2;
        const centerX = CONFIG.CANVAS_WIDTH / 2;
        
        // Modern gradient background for wheel area
        const wheelBgGradient = this.ctx.createLinearGradient(0, wheelY - 20, 0, wheelY + wheelHeight + 20);
        wheelBgGradient.addColorStop(0, 'rgba(20, 20, 40, 0.3)');
        wheelBgGradient.addColorStop(0.5, 'rgba(30, 30, 50, 0.5)');
        wheelBgGradient.addColorStop(1, 'rgba(20, 20, 40, 0.3)');
        this.ctx.fillStyle = wheelBgGradient;
        this.ctx.fillRect(0, wheelY - 20, CONFIG.CANVAS_WIDTH, wheelHeight + 40);
        
        // Draw squares with wrap-around for infinite scroll
        // Draw multiple copies to ensure seamless scrolling
        const copies = 3; // Draw 3 copies of the wheel
        for (let copy = -1; copy <= copies; copy++) {
            for (let i = 0; i < WHEEL_CONFIG.SQUARES_COUNT; i++) {
                const square = this.wheelSquares[i];
                const squareX = wheelStartX + (i * WHEEL_CONFIG.SQUARE_WIDTH) + (copy * totalWidth) - this.wheelSpinOffset;
                
                // Only draw if on screen
                if (squareX + WHEEL_CONFIG.SQUARE_WIDTH < 0 || squareX > CONFIG.CANVAS_WIDTH) {
                    continue;
                }
                
                // Check if this square is selected (the one that stopped)
                const isSelected = this.wheelShowResult && i === this.wheelSelectedSquareIndex;
                const squareCenterX = squareX + WHEEL_CONFIG.SQUARE_WIDTH / 2;
                const distanceFromCenter = Math.abs(squareCenterX - centerX);
                
                // Modern color palette - gradient backgrounds
                const modernColors = [
                    ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'],
                    ['#4facfe', '#00f2fe'], ['#43e97b', '#38f9d7'],
                    ['#fa709a', '#fee140'], ['#30cfd0', '#330867'],
                    ['#a8edea', '#fed6e3'], ['#ff9a9e', '#fecfef'],
                    ['#ffecd2', '#fcb69f'], ['#ff8a80', '#ea4c89'],
                    ['#a1c4fd', '#c2e9fb'], ['#ffd89b', '#19547b']
                ];
                const [color1, color2] = modernColors[i];
                
                // Lens effect for selected square - save context
                this.ctx.save();
                
                if (isSelected && !this.wheelSpinning) {
                    // Create lens/magnifying glass effect
                    const lensSize = WHEEL_CONFIG.SQUARE_WIDTH * 1.5; // 1.5x magnification
                    const lensX = centerX - lensSize / 2;
                    const lensY = wheelY - (lensSize - wheelHeight) / 2;
                    
                    // Create clipping path for lens (circular)
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, wheelY + wheelHeight / 2, lensSize / 2, 0, Math.PI * 2);
                    this.ctx.clip();
                    
                    // Draw magnified image with lens distortion effect
                    const img = this.wheelImages[square.number];
                    if (img && img.complete && img.naturalWidth > 0) {
                        // Draw enlarged image
                        this.ctx.drawImage(
                            img,
                            lensX,
                            lensY,
                            lensSize,
                            lensSize
                        );
                    }
                    
                    // Lens glass effect - semi-transparent overlay with highlights
                    this.ctx.globalAlpha = 0.3;
                    const lensGradient = this.ctx.createRadialGradient(
                        centerX, wheelY + wheelHeight / 2, 0,
                        centerX, wheelY + wheelHeight / 2, lensSize / 2
                    );
                    lensGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
                    lensGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
                    lensGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
                    this.ctx.fillStyle = lensGradient;
                    this.ctx.fillRect(lensX, lensY, lensSize, lensSize);
                    
                    // Lens border/rim
                    this.ctx.globalAlpha = 1;
                    this.ctx.strokeStyle = '#FFD700';
                    this.ctx.lineWidth = 4;
                    this.ctx.shadowBlur = 20;
                    this.ctx.shadowColor = '#FFD700';
                    this.ctx.beginPath();
                    this.ctx.arc(centerX, wheelY + wheelHeight / 2, lensSize / 2, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                    this.ctx.restore();
                    
                    // Draw lens highlight reflection
                    this.ctx.save();
                    const highlightGradient = this.ctx.createRadialGradient(
                        centerX - lensSize / 4, wheelY + wheelHeight / 2 - lensSize / 4, 0,
                        centerX - lensSize / 4, wheelY + wheelHeight / 2 - lensSize / 4, lensSize / 3
                    );
                    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
                    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    this.ctx.fillStyle = highlightGradient;
                    this.ctx.beginPath();
                    this.ctx.arc(centerX - lensSize / 4, wheelY + wheelHeight / 2 - lensSize / 4, lensSize / 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                } else {
                    // Regular square drawing
                    // Modern gradient background
                    const squareGradient = this.ctx.createLinearGradient(
                        squareX, wheelY,
                        squareX + WHEEL_CONFIG.SQUARE_WIDTH, wheelY + wheelHeight
                    );
                    squareGradient.addColorStop(0, color1);
                    squareGradient.addColorStop(1, color2);
                    this.ctx.fillStyle = squareGradient;
                    
                    // Rounded corners effect (simulated with shadow)
                    this.ctx.shadowBlur = 20;
                    this.ctx.shadowColor = color1;
                    this.ctx.fillRect(squareX, wheelY, WHEEL_CONFIG.SQUARE_WIDTH, wheelHeight);
                    this.ctx.shadowBlur = 0;
                    
                    // Draw image if loaded
                    const img = this.wheelImages[square.number];
                    if (img && img.complete && img.naturalWidth > 0) {
                        // Draw image with padding and opacity
                        const padding = 6;
                        this.ctx.globalAlpha = 0.9;
                        this.ctx.drawImage(
                            img,
                            squareX + padding,
                            wheelY + padding,
                            WHEEL_CONFIG.SQUARE_WIDTH - (padding * 2),
                            wheelHeight - (padding * 2)
                        );
                        this.ctx.globalAlpha = 1;
                    } else {
                        // Fallback: show number if image not loaded
                        this.ctx.fillStyle = '#FFFFFF';
                        this.ctx.font = 'bold 24px monospace';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText(square.number.toString(), squareX + WHEEL_CONFIG.SQUARE_WIDTH / 2, wheelY + wheelHeight / 2);
                    }
                    
                    // Modern border with subtle glow
                    this.ctx.strokeStyle = '#FFFFFF';
                    this.ctx.lineWidth = 2;
                    this.ctx.shadowBlur = 8;
                    this.ctx.shadowColor = color1;
                    this.ctx.strokeRect(squareX, wheelY, WHEEL_CONFIG.SQUARE_WIDTH, wheelHeight);
                    this.ctx.shadowBlur = 0;
                }
                
                this.ctx.restore();
            }
        }
        
        this.ctx.textAlign = 'left';
        
        // Draw confetti
        this.drawConfetti();
        
        // Show selected square highlight when wheel stops (before prize image appears)
        if (this.wheelShowResult && this.wheelSelectedSquareIndex !== null && !this.wheelShowPrizeImage) {
            // Show message that wheel stopped
            const selectedSquare = this.wheelSquares[this.wheelSelectedSquareIndex];
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 28px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`You won square #${selectedSquare.number}!`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        }
        
        // Spin button or result
        if (this.wheelShowResult && this.wheelSelectedSquare !== null && this.wheelSelectedSquareIndex !== null) {
            // Show result with prize image and link button
            const selectedSquare = this.wheelSquares[this.wheelSelectedSquareIndex];
            
            // Draw prize image (only if delay has passed and fade-in is active)
            if (this.wheelShowPrizeImage && this.wheelPrizeImageAlpha > 0) {
                // Use the image from the selected square (from shuffled array)
                const prizeImg = this.wheelImages[selectedSquare.number];
                
                // Full screen prize image
                const prizeImageX = 0;
                const prizeImageY = 0;
                const prizeImageWidth = CONFIG.CANVAS_WIDTH;
                const prizeImageHeight = CONFIG.CANVAS_HEIGHT;
                
                // Save context for alpha
                this.ctx.save();
                this.ctx.globalAlpha = this.wheelPrizeImageAlpha;
                
                // Dark overlay background
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
                
                if (prizeImg && prizeImg.complete && prizeImg.naturalWidth > 0) {
                    // Calculate aspect ratio to maintain image proportions
                    const imgAspect = prizeImg.width / prizeImg.height;
                    const canvasAspect = CONFIG.CANVAS_WIDTH / CONFIG.CANVAS_HEIGHT;
                    
                    let drawWidth, drawHeight, drawX, drawY;
                    
                    if (imgAspect > canvasAspect) {
                        // Image is wider - fit to width
                        drawWidth = CONFIG.CANVAS_WIDTH;
                        drawHeight = CONFIG.CANVAS_WIDTH / imgAspect;
                        drawX = 0;
                        drawY = (CONFIG.CANVAS_HEIGHT - drawHeight) / 2;
                    } else {
                        // Image is taller - fit to height
                        drawWidth = CONFIG.CANVAS_HEIGHT * imgAspect;
                        drawHeight = CONFIG.CANVAS_HEIGHT;
                        drawX = (CONFIG.CANVAS_WIDTH - drawWidth) / 2;
                        drawY = 0;
                    }
                    
                    // Draw image with golden glow
                    this.ctx.shadowBlur = 50;
                    this.ctx.shadowColor = '#FFD700';
                    this.ctx.drawImage(
                        prizeImg,
                        drawX,
                        drawY,
                        drawWidth,
                        drawHeight
                    );
                    this.ctx.shadowBlur = 0;
                    
                    // Draw golden border around prize image
                    this.ctx.strokeStyle = '#FFD700';
                    this.ctx.lineWidth = 8;
                    this.ctx.shadowBlur = 20;
                    this.ctx.shadowColor = '#FFD700';
                    this.ctx.strokeRect(drawX, drawY, drawWidth, drawHeight);
                    this.ctx.shadowBlur = 0;
                } else {
                    // Fallback: show number if image not loaded
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.font = 'bold 72px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(`#${selectedSquare.number}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
                }
                
                this.ctx.restore();
            }
            
            // Win message and buttons (only show after prize image appears)
            if (this.wheelShowPrizeImage && this.wheelPrizeImageAlpha > 0.5) {
                // Win message (positioned at bottom)
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 28px monospace';
                this.ctx.textAlign = 'center';
                const messageY = CONFIG.CANVAS_HEIGHT - 180;
                this.ctx.fillText(`You won: ${selectedSquare.number}!`, CONFIG.CANVAS_WIDTH / 2, messageY);
                
                // Buttons (3 buttons under the image)
                const buttonWidth = 250;
                const buttonHeight = 50;
                const buttonX = CONFIG.CANVAS_WIDTH / 2 - buttonWidth / 2;
                const buttonSpacing = 60;
                let currentButtonY = messageY + 40;
                
                // 1. Open Link button
                this.ctx.fillStyle = '#27AE60';
                this.ctx.fillRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 18px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Open Link', CONFIG.CANVAS_WIDTH / 2, currentButtonY + 32);
                
                // Store button bounds for click detection
                this.wheelLinkButtonBounds = { x: buttonX, y: currentButtonY, width: buttonWidth, height: buttonHeight, link: selectedSquare.link };
                
                currentButtonY += buttonSpacing;
                
                // 2. Spin Again button (if has enough points)
                const canSpinAgain = this.points >= POINTS_MANAGER.WHEEL_COST;
                if (canSpinAgain) {
                    this.ctx.fillStyle = '#27AE60';
                    this.ctx.fillRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
                    this.ctx.strokeStyle = '#FFFFFF';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
                    
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = 'bold 18px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(`Spin Again (${POINTS_MANAGER.WHEEL_COST} points)`, CONFIG.CANVAS_WIDTH / 2, currentButtonY + 32);
                    this.wheelSpinAgainButtonBounds = { x: buttonX, y: currentButtonY, width: buttonWidth, height: buttonHeight };
                    currentButtonY += buttonSpacing;
                } else {
                    this.wheelSpinAgainButtonBounds = null;
                }
                
                // 3. Play Game Again button (return to main menu)
                this.ctx.fillStyle = '#E74C3C';
                this.ctx.fillRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(buttonX, currentButtonY, buttonWidth, buttonHeight);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = 'bold 18px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Play Game Again', CONFIG.CANVAS_WIDTH / 2, currentButtonY + 32);
                this.wheelBackButtonBounds = { x: buttonX, y: currentButtonY, width: buttonWidth, height: buttonHeight };
            } else {
                // Hide buttons until prize image appears
                this.wheelLinkButtonBounds = null;
                this.wheelBackButtonBounds = null;
                this.wheelSpinAgainButtonBounds = null;
            }
        } else {
            // Spin button (centered)
            const buttonWidth = 250;
            const buttonHeight = 50;
            const buttonX = CONFIG.CANVAS_WIDTH / 2 - buttonWidth / 2; // Centered
            const buttonY = CONFIG.CANVAS_HEIGHT / 2 + 100;
            
            const canSpin = this.points >= POINTS_MANAGER.WHEEL_COST && !this.wheelSpinning;
            this.ctx.fillStyle = canSpin ? '#27AE60' : '#7F8C8D';
            this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 18px monospace';
            this.ctx.textAlign = 'center';
            if (this.wheelSpinning) {
                this.ctx.fillText('Spinning...', CONFIG.CANVAS_WIDTH / 2, buttonY + 32);
            } else if (canSpin) {
                this.ctx.fillText(`Spin (${POINTS_MANAGER.WHEEL_COST} points)`, CONFIG.CANVAS_WIDTH / 2, buttonY + 32);
            } else {
                this.ctx.fillText(`Need ${POINTS_MANAGER.WHEEL_COST} points`, CONFIG.CANVAS_WIDTH / 2, buttonY + 32);
            }
            
            this.wheelSpinButtonBounds = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
            
            // Play Again button (centered, below Spin button)
            const playAgainButtonX = CONFIG.CANVAS_WIDTH / 2 - buttonWidth / 2; // Centered
            const playAgainButtonY = buttonY + buttonHeight + 20; // Below Spin button
            this.ctx.fillStyle = '#3498DB';
            this.ctx.fillRect(playAgainButtonX, playAgainButtonY, buttonWidth, buttonHeight);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(playAgainButtonX, playAgainButtonY, buttonWidth, buttonHeight);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 18px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Play Again', CONFIG.CANVAS_WIDTH / 2, playAgainButtonY + 32);
            
            this.wheelPlayAgainButtonBounds = { x: playAgainButtonX, y: playAgainButtonY, width: buttonWidth, height: buttonHeight };
        }
        
        this.ctx.textAlign = 'left';
    }
    
    drawConfetti() {
        for (let confetti of this.wheelConfetti) {
            this.ctx.save();
            this.ctx.translate(confetti.x, confetti.y);
            this.ctx.rotate(confetti.rotation);
            this.ctx.fillStyle = confetti.color;
            this.ctx.globalAlpha = confetti.life;
            this.ctx.fillRect(-confetti.size / 2, -confetti.size / 2, confetti.size, confetti.size);
            this.ctx.restore();
        }
    }
    
    drawPauseScreen() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        
        // Pause text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);
        
        this.ctx.font = '18px monospace';
        this.ctx.fillText('Tap to Resume', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
        
        this.ctx.textAlign = 'left';
    }

    gameLoop() {
        try {
            this.update();
            this.draw();
            this.animationId = requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('Error in game loop:', error);
        }
    }
}

// ==================== ORIENTATION LOCK ====================
// Lock orientation to portrait
function lockOrientation() {
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {
            // Lock failed, but continue anyway
        });
    } else if (screen.lockOrientation) {
        screen.lockOrientation('portrait');
    } else if (screen.mozLockOrientation) {
        screen.mozLockOrientation('portrait');
    } else if (screen.msLockOrientation) {
        screen.msLockOrientation('portrait');
    }
}

// Try to lock orientation on load
window.addEventListener('DOMContentLoaded', () => {
    lockOrientation();
    
    // Also try on orientation change
    window.addEventListener('orientationchange', () => {
        setTimeout(lockOrientation, 100);
    });
});

// ==================== INITIALIZE GAME ====================
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element with id "game-canvas" not found!');
        return;
    }
    
    console.log('Canvas found, initializing game...');
    try {
        const game = new Game(canvas);
        console.log('Game initialized successfully');
        // Store game instance globally for debugging
        window.game = game;
    } catch (error) {
        console.error('Error initializing game:', error);
        console.error('Error stack:', error.stack);
    }
});

