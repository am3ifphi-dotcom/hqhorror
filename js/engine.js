/**
 * Game Engine - Core rendering, input, camera, game loop
 */
class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.fxCanvas = null;
        this.fxCtx = null;
        this.width = 0;
        this.height = 0;
        this.scale = 1;
        this.internalWidth = 800;
        this.internalHeight = 450;
        this.running = false;
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        
        // Camera
        this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, smoothing: 0.08 };
        
        // Input
        this.keys = {};
        this.keyPressed = {}; // Single-frame key presses
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.clicked = false;
        
        // Game state
        this.state = 'loading'; // loading, title, playing, dialogue, horror_event, credits
        this.game = null;
        
        // Performance
        this.renderBuffer = null;
        this.renderCtx = null;
    }

    async init() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.fxCanvas = document.getElementById('fx-canvas');
        this.fxCtx = this.fxCanvas.getContext('2d');
        
        // Offscreen render buffer
        this.renderBuffer = document.createElement('canvas');
        this.renderBuffer.width = this.internalWidth;
        this.renderBuffer.height = this.internalHeight;
        this.renderCtx = this.renderBuffer.getContext('2d');
        this.renderCtx.imageSmoothingEnabled = false;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Input handlers
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));
        window.addEventListener('click', (e) => this.onClick(e));
        
        // Touch support
        window.addEventListener('touchstart', (e) => this.onTouchStart(e));
        window.addEventListener('touchend', (e) => this.onTouchEnd(e));
        window.addEventListener('touchmove', (e) => this.onTouchMove(e));
    }

    resize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        this.canvas.width = w;
        this.canvas.height = h;
        this.fxCanvas.width = w;
        this.fxCanvas.height = h;
        
        // Calculate scale to fit internal resolution
        this.scale = Math.min(w / this.internalWidth, h / this.internalHeight);
        this.width = w;
        this.height = h;
        
        this.ctx.imageSmoothingEnabled = false;
    }

    onKeyDown(e) {
        this.keys[e.code] = true;
        this.keyPressed[e.code] = true; // Track single press
        if (this.game) this.game.onKeyDown(e);
    }

    onKeyUp(e) {
        this.keys[e.code] = false;
    }

    onMouseMove(e) {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    onMouseDown(e) {
        this.mouseDown = true;
    }

    onMouseUp(e) {
        this.mouseDown = false;
    }

    onClick(e) {
        this.clicked = true;
        if (this.game) this.game.onClick(e);
    }

    onTouchStart(e) {
        if (e.touches.length > 0) {
            this.mouseX = e.touches[0].clientX;
            this.mouseY = e.touches[0].clientY;
            this.mouseDown = true;
            this.clicked = true;
        }
    }

    onTouchEnd(e) {
        this.mouseDown = false;
    }

    onTouchMove(e) {
        if (e.touches.length > 0) {
            this.mouseX = e.touches[0].clientX;
            this.mouseY = e.touches[0].clientY;
        }
    }

    isKeyDown(code) {
        return !!this.keys[code];
    }

    isKeyPressed(code) {
        return !!this.keyPressed[code];
    }

    // Get mouse position in game coordinates
    getGameMousePos() {
        const offsetX = (this.width - this.internalWidth * this.scale) / 2;
        const offsetY = (this.height - this.internalHeight * this.scale) / 2;
        return {
            x: (this.mouseX - offsetX) / this.scale,
            y: (this.mouseY - offsetY) / this.scale
        };
    }

    // Update camera to follow target
    updateCamera(targetX, targetY, levelWidth, levelHeight) {
        this.camera.targetX = targetX - this.internalWidth / 2;
        this.camera.targetY = targetY - this.internalHeight / 2;
        
        // Clamp camera to level bounds
        this.camera.targetX = Math.max(0, Math.min(this.camera.targetX, levelWidth - this.internalWidth));
        this.camera.targetY = Math.max(0, Math.min(this.camera.targetY, levelHeight - this.internalHeight));
        
        // Smooth follow
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
        this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothing;
    }

    // Apply screen shake from effects
    getShakeOffset() {
        return {
            x: effects.screenShake.x,
            y: effects.screenShake.y
        };
    }

    // Clear the render buffer
    clearRenderBuffer(color = '#000') {
        this.renderCtx.fillStyle = color;
        this.renderCtx.fillRect(0, 0, this.internalWidth, this.internalHeight);
    }

    // Draw scaled to screen
    renderToScreen() {
        const shake = this.getShakeOffset();
        const offsetX = (this.width - this.internalWidth * this.scale) / 2;
        const offsetY = (this.height - this.internalHeight * this.scale) / 2;
        
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.drawImage(
            this.renderBuffer,
            offsetX + shake.x * this.scale,
            offsetY + shake.y * this.scale,
            this.internalWidth * this.scale,
            this.internalHeight * this.scale
        );
    }

    // Main game loop
    start(game) {
        this.game = game;
        this.running = true;
        this.lastTime = performance.now();
        this.loop();
    }

    loop() {
        if (!this.running) return;
        
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05); // Cap delta time
        this.lastTime = now;
        
        // FPS counter
        this.frameCount++;
        
        // Update
        if (this.game) {
            this.game.update(dt);
        }
        
        // Render
        this.game && this.game.render(this.renderCtx, this.camera);
        
        // Post-processing on FX canvas
        this.fxCtx.clearRect(0, 0, this.width, this.height);
        
        // Scale to screen
        this.renderToScreen();
        
        // Reset single-frame inputs
        this.clicked = false;
        this.keyPressed = {};
        
        requestAnimationFrame(() => this.loop());
    }

    stop() {
        this.running = false;
    }
}

const engine = new GameEngine();
