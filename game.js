// Telegram Mini App Game: Krushka - Knight Rider
// A pixel-art endless runner with 5 themed levels

// ==================== CONFIGURATION ====================
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 450,
    GRAVITY: 0.8,
    JUMP_STRENGTH_MIN: -15,
    JUMP_STRENGTH_MAX: -28,
    JUMP_CHARGE_RATE: 0.015, // How fast jump power charges per frame (at 60fps, takes ~1.1 seconds to max)
    GROUND_Y: 350,
    PLAYER_WIDTH: 40,
    PLAYER_HEIGHT: 50,
    PLAYER_START_X: 100,
    BASE_SPEED: 3,
    OBSTACLE_WIDTH: 40,
    OBSTACLE_HEIGHT: 40,
    PIT_WIDTH: 80,
    PIT_HEIGHT: 100,
    GROUND_TEXTURE_SIZE: 20, // Size of ground texture pattern
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
    }
];

// ==================== GAME STATES ====================
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver',
    ALL_COMPLETE: 'allComplete'
};

// ==================== PLAYER CLASS ====================
class Player {
    constructor() {
        this.x = CONFIG.PLAYER_START_X;
        this.y = CONFIG.GROUND_Y;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.velocityY = 0;
        this.isJumping = false;
        this.onGround = true;
        this.image = null;
        this.jumpCharging = false;
        this.jumpChargePower = 0; // 0 to 1, where 1 is max jump
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
        }
    }

    updateJumpCharge() {
        if (this.jumpCharging && this.onGround && !this.isJumping) {
            this.jumpChargePower = Math.min(1, this.jumpChargePower + CONFIG.JUMP_CHARGE_RATE);
        } else if (!this.jumpCharging) {
            // Reset charge if not charging
            this.jumpChargePower = 0;
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
        } else if (this.jumpCharging) {
            // Cancel charging if not on ground
            this.jumpCharging = false;
            this.jumpChargePower = 0;
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
            return;
        }
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        if (!this.ctx) {
            console.error('Could not get 2d context from canvas!');
            return;
        }
        
        this.state = GAME_STATE.MENU;
        this.currentLevel = 0;
        this.score = 0;
        this.distance = 0;
        this.player = null;
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.frameCount = 0;
        this.animationId = null;
        this.backgroundImages = {};
        this.groundOffset = 0; // For moving ground texture
        
        this.setupCanvas();
        this.setupTelegram();
        this.setupControls();
        this.loadBackgroundImages();
        this.start();
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
            
            if (containerWidth === 0 || containerHeight === 0) {
                console.warn('Container has zero size, using window dimensions');
            }
            
            const scaleX = containerWidth / CONFIG.CANVAS_WIDTH;
            const scaleY = containerHeight / CONFIG.CANVAS_HEIGHT;
            const scale = Math.min(scaleX, scaleY) || 1;
            
            this.canvas.width = CONFIG.CANVAS_WIDTH;
            this.canvas.height = CONFIG.CANVAS_HEIGHT;
            this.canvas.style.width = (CONFIG.CANVAS_WIDTH * scale) + 'px';
            this.canvas.style.height = (CONFIG.CANVAS_HEIGHT * scale) + 'px';
        };
        
        resize();
        window.addEventListener('resize', resize);
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

        // Mouse/Touch - start
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.focusCanvas();
            this.touchActive = true;
            this.handleJumpStart();
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.focusCanvas();
            this.touchActive = true;
            this.handleJumpStart();
        });

        // Also focus on click
        this.canvas.addEventListener('click', () => {
            this.focusCanvas();
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
        if (this.state === GAME_STATE.PLAYING && this.player) {
            this.player.startJumpCharge();
        } else if (this.state === GAME_STATE.MENU) {
            this.startLevel();
        } else if (this.state === GAME_STATE.LEVEL_COMPLETE) {
            this.nextLevel();
        } else if (this.state === GAME_STATE.GAME_OVER) {
            this.restartLevel();
        } else if (this.state === GAME_STATE.ALL_COMPLETE) {
            this.restartGame();
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
        this.state = GAME_STATE.MENU;
        // Draw immediately to show menu
        this.draw();
        // Start game loop
        this.gameLoop();
        // Focus canvas after a short delay to enable keyboard input
        setTimeout(() => this.focusCanvas(), 100);
    }

    startLevel() {
        this.state = GAME_STATE.PLAYING;
        this.currentLevel = 0;
        this.score = 0;
        this.distance = 0;
        this.player = new Player();
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.frameCount = 0;
    }

    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel >= LEVELS.length) {
            this.state = GAME_STATE.ALL_COMPLETE;
        } else {
            this.distance = 0;
            this.obstacles = [];
            this.lastSpawnTime = 0;
            this.player = new Player();
            this.state = GAME_STATE.PLAYING;
        }
    }

    restartLevel() {
        this.distance = 0;
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.player = new Player();
        this.state = GAME_STATE.PLAYING;
    }

    restartGame() {
        this.currentLevel = 0;
        this.score = 0;
        this.distance = 0;
        this.obstacles = [];
        this.lastSpawnTime = 0;
        this.player = new Player();
        this.state = GAME_STATE.PLAYING;
    }

    spawnObstacle() {
        const levelConfig = LEVELS[this.currentLevel];
        const x = CONFIG.CANVAS_WIDTH;
        const type = Math.random() < 0.5 ? 'pit' : 'fire';
        this.obstacles.push(new Obstacle(x, type, this.currentLevel));
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
                    this.state = GAME_STATE.GAME_OVER;
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
                    this.state = GAME_STATE.GAME_OVER;
                    return true;
                }
            }
        }
        
        return false;
    }

    update() {
        // Always update ground offset for smooth animation (even in menu)
        if (this.state === GAME_STATE.PLAYING) {
            const levelConfig = LEVELS[this.currentLevel];
            const speed = levelConfig.speed;
            
            // Update player
            this.player.update();

            // Update distance and score
            this.distance += speed;
            this.score = Math.floor(this.distance / 10);

            // Update ground offset for animation
            this.groundOffset = (this.groundOffset + speed) % CONFIG.GROUND_TEXTURE_SIZE;

            // Spawn obstacles
            if (Math.random() < levelConfig.spawnRate) {
                this.spawnObstacle();
            }

            // Update obstacles
            this.obstacles.forEach(obstacle => obstacle.update(speed));
            this.obstacles = this.obstacles.filter(obstacle => !obstacle.isOffScreen());

            // Check collisions
            this.checkCollisions();

            // Check level complete
            if (this.distance >= levelConfig.targetDistance) {
                this.state = GAME_STATE.LEVEL_COMPLETE;
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
        
        // Level indicator
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px monospace';
        this.ctx.fillText(`Level: ${this.currentLevel + 1}/5`, 10, 30);
        this.ctx.fillText(levelConfig.name, 10, 55);

        // Score
        this.ctx.fillText(`Score: ${this.score}`, CONFIG.CANVAS_WIDTH - 150, 30);

        // Jump charge indicator (when charging)
        if (this.player && this.player.jumpCharging && this.player.onGround) {
            const chargePercent = this.player.jumpChargePower;
            const barWidth = 200;
            const barHeight = 20;
            const barX = CONFIG.CANVAS_WIDTH / 2 - barWidth / 2;
            const barY = CONFIG.CANVAS_HEIGHT - 60;

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
        // Draw background first
        this.drawBackground();
        this.drawGround();

        // Title with shadow for visibility
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // Title shadow
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 48px monospace';
        this.ctx.fillText('Krushka', CONFIG.CANVAS_WIDTH / 2 + 2, CONFIG.CANVAS_HEIGHT / 2 - 60 + 2);
        
        // Title
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Krushka', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 60);
        
        // Subtitle
        this.ctx.font = 'bold 24px monospace';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('Knight Rider', CONFIG.CANVAS_WIDTH / 2 + 1, CONFIG.CANVAS_HEIGHT / 2 - 20 + 1);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Knight Rider', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);

        // Instructions
        this.ctx.font = '18px monospace';
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('Press SPACE or Click to Jump', CONFIG.CANVAS_WIDTH / 2 + 1, CONFIG.CANVAS_HEIGHT / 2 + 20 + 1);
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillText('Press SPACE or Click to Jump', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
        
        this.ctx.fillStyle = '#000000';
        this.ctx.fillText('Avoid obstacles and complete 5 levels!', CONFIG.CANVAS_WIDTH / 2 + 1, CONFIG.CANVAS_HEIGHT / 2 + 50 + 1);
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillText('Avoid obstacles and complete 5 levels!', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 50);

        // Start button with border
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - 105, CONFIG.CANVAS_HEIGHT / 2 + 75, 210, 60);
        this.ctx.fillStyle = '#27AE60';
        this.ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - 100, CONFIG.CANVAS_HEIGHT / 2 + 80, 200, 50);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.fillText('START GAME', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 110);

        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }

    drawLevelComplete() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px monospace';
        this.ctx.textAlign = 'center';
        
        if (this.currentLevel < LEVELS.length - 1) {
            this.ctx.fillText(`Level ${this.currentLevel + 1} Complete!`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 40);
            this.ctx.font = '24px monospace';
            this.ctx.fillText(`Score: ${this.score}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
            this.ctx.fillText('Click or Press SPACE for Next Level', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);
        }

        this.ctx.textAlign = 'left';
    }

    drawGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = '#E74C3C';
        this.ctx.font = 'bold 36px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Game Over!', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 40);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px monospace';
        this.ctx.fillText(`Final Score: ${this.score}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        this.ctx.fillText('Click or Press SPACE to Restart', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 40);

        this.ctx.textAlign = 'left';
    }

    drawAllComplete() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        this.ctx.fillStyle = '#F39C12';
        this.ctx.font = 'bold 36px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Congratulations!', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 60);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px monospace';
        this.ctx.fillText('You finished all 5 levels!', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 20);
        this.ctx.fillText(`Final Score: ${this.score}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
        this.ctx.fillText('Click or Press SPACE to Restart', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 60);

        this.ctx.textAlign = 'left';
    }

    draw() {
        // Ensure canvas has proper size
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            this.canvas.width = CONFIG.CANVAS_WIDTH;
            this.canvas.height = CONFIG.CANVAS_HEIGHT;
        }
        
        // Clear canvas with a background color first
        this.ctx.fillStyle = '#87CEEB'; // Light blue fallback
        this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

        if (this.state === GAME_STATE.MENU) {
            this.drawMenu();
        } else if (this.state === GAME_STATE.PLAYING) {
            this.drawBackground();
            this.drawGround();
            this.obstacles.forEach(obstacle => obstacle.draw(this.ctx, LEVELS[this.currentLevel]));
            this.player.draw(this.ctx);
            this.drawUI();
        } else if (this.state === GAME_STATE.LEVEL_COMPLETE) {
            this.drawBackground();
            this.drawGround();
            this.player.draw(this.ctx);
            this.drawLevelComplete();
        } else if (this.state === GAME_STATE.GAME_OVER) {
            this.drawBackground();
            this.drawGround();
            this.obstacles.forEach(obstacle => obstacle.draw(this.ctx, LEVELS[this.currentLevel]));
            this.player.draw(this.ctx);
            this.drawGameOver();
        } else if (this.state === GAME_STATE.ALL_COMPLETE) {
            this.drawAllComplete();
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// ==================== INITIALIZE GAME ====================
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element with id "game-canvas" not found!');
        return;
    }
    
    try {
        const game = new Game(canvas);
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});

