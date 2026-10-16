/**
 * Game Logic - Scenes, player, dialogue, horror events
 * 「影の囁き」- Whispers in the Shadow
 */

// ========== LEVEL DATA ==========
const LEVELS = {
    entrance: {
        name: '玄関',
        width: 1600,
        height: 450,
        bgColor: '#050508',
        floorY: 350,
        platforms: [
            { x: 0, y: 350, w: 1600, h: 100, type: 'floor' }
        ],
        objects: [
            { type: 'wall', x: 0, y: 50, w: 48, h: 300 },
            { type: 'wall', x: 1552, y: 50, w: 48, h: 300 },
            { type: 'door', x: 700, y: 160, w: 96, h: 192, leadsTo: 'hallway' },
            { type: 'window', x: 200, y: 100, w: 96, h: 96 },
            { type: 'window', x: 1200, y: 100, w: 96, h: 96 },
            { type: 'decoration', x: 400, y: 290, w: 60, h: 60, sprite: 'shelf' },
            { type: 'decoration', x: 1000, y: 310, w: 40, h: 40, sprite: 'box' },
        ],
        lightLevel: 0.3,
        ambient: 'wind',
        events: [
            { trigger: 'enter', type: 'dialogue', data: 'intro_1' },
            { trigger: 'approach_door', type: 'dialogue', data: 'door_1' },
        ]
    },
    hallway: {
        name: '廊下',
        width: 2400,
        height: 450,
        bgColor: '#030306',
        floorY: 350,
        platforms: [
            { x: 0, y: 350, w: 2400, h: 100, type: 'floor' }
        ],
        objects: [
            { type: 'wall_segment', x: 0, y: 50, w: 2400, h: 20, pattern: 'damaged' },
            { type: 'door', x: 400, y: 160, w: 96, h: 192, leadsTo: 'room1' },
            { type: 'door', x: 1200, y: 160, w: 96, h: 192, leadsTo: 'room2', locked: true },
            { type: 'door', x: 2000, y: 160, w: 96, h: 192, leadsTo: 'room3' },
            { type: 'decoration', x: 800, y: 120, w: 48, h: 48, sprite: 'painting' },
            { type: 'decoration', x: 1600, y: 120, w: 48, h: 48, sprite: 'painting' },
        ],
        lightLevel: 0.15,
        ambient: 'creak',
        entities: [
            { type: 'shadow', x: 1800, y: 200, active: false }
        ],
        events: [
            { trigger: 'enter', type: 'atmosphere', data: 'hallway_dark' },
            { trigger: 'reach_1000', type: 'whisper' },
            { trigger: 'reach_1800', type: 'shadow_appear' },
        ]
    },
    room1: {
        name: '和室',
        width: 960,
        height: 450,
        bgColor: '#060508',
        floorY: 350,
        platforms: [
            { x: 0, y: 350, w: 960, h: 100, type: 'tatami' }
        ],
        objects: [
            { type: 'wall', x: 0, y: 50, w: 960, h: 300, pattern: 'tatami_wall' },
            { type: 'door', x: 20, y: 160, w: 96, h: 192, leadsTo: 'hallway' },
            { type: 'decoration', x: 400, y: 250, w: 120, h: 100, sprite: 'altar' },
            { type: 'decoration', x: 700, y: 280, w: 60, h: 70, sprite: 'doll' },
        ],
        lightLevel: 0.2,
        ambient: 'silence',
        events: [
            { trigger: 'enter', type: 'dialogue', data: 'room1_enter' },
            { trigger: 'approach_doll', type: 'horror_event', data: 'doll_scare' },
            { trigger: 'approach_altar', type: 'dialogue', data: 'altar_note' },
        ]
    },
    room3: {
        name: '奥の部屋',
        width: 1200,
        height: 450,
        bgColor: '#040306',
        floorY: 350,
        platforms: [
            { x: 0, y: 350, w: 1200, h: 100, type: 'floor' }
        ],
        objects: [
            { type: 'wall', x: 0, y: 0, w: 1200, h: 450, pattern: 'dark_wall' },
            { type: 'door', x: 20, y: 160, w: 96, h: 192, leadsTo: 'hallway' },
            { type: 'window', x: 800, y: 80, w: 96, h: 96 },
            { type: 'decoration', x: 500, y: 260, w: 80, h: 90, sprite: 'mirror' },
            { type: 'decoration', x: 900, y: 290, w: 50, h: 60, sprite: 'chair' },
        ],
        lightLevel: 0.1,
        ambient: 'whispers',
        entities: [
            { type: 'ghost', x: 540, y: 180, active: false }
        ],
        events: [
            { trigger: 'enter', type: 'dialogue', data: 'room3_enter' },
            { trigger: 'approach_mirror', type: 'horror_event', data: 'mirror_event' },
        ]
    }
};

// ========== DIALOGUE DATA ==========
const DIALOGUES = {
    intro_1: [
        { speaker: '', text: '......', pause: 1000 },
        { speaker: '', text: '気がつくと、私は見知らぬ場所に立っていた。', pause: 0 },
        { speaker: '', text: '冷たい空気が体を包み込む。', pause: 0 },
        { speaker: '???', text: '......ここは......？', pause: 0 },
        { speaker: '', text: '周囲を見渡すと、古い日本家屋の玄関のようだ。', pause: 0 },
        { speaker: '', text: '記憶が......思い出せない。', pause: 500 },
        { speaker: '', text: 'まずは、周囲を調べなければならない。', pause: 0 },
    ],
    door_1: [
        { speaker: '', text: '古い木製の扉......', pause: 0 },
        { speaker: '', text: '取手に手を伸ばす。冷たい。', pause: 500 },
        { speaker: '', text: '......開けてみるしかない。', pause: 0 },
    ],
    hallway_dark: [
        { speaker: '', text: '暗い廊下が奥へ続いている......', pause: 0 },
        { speaker: '', text: '懐中電灯の光だけが頼りだ。', pause: 0 },
    ],
    room1_enter: [
        { speaker: '', text: '和室だ。畳の匂いが......いや、それは違う。', pause: 500 },
        { speaker: '', text: '腐敗したような、甘い匂い。', pause: 0 },
        { speaker: '', text: '奥に何か......仏壇のようなものと、人形が見える。', pause: 0 },
    ],
    altar_note: [
        { speaker: '', text: '古い札が置かれている......', pause: 0 },
        { speaker: '', text: '「決して鏡を見るでない」', pause: 1000 },
        { speaker: '', text: '......何のことだろう。', pause: 0 },
    ],
    doll_scare: [
        { speaker: '', text: '......人形？', pause: 0 },
        { speaker: '', text: '......!', pause: 800 },
        { speaker: '', text: '......気のせいだろうか。今のところ。', pause: 0 },
    ],
    room3_enter: [
        { speaker: '', text: 'この部屋は......ひどく暗い。', pause: 0 },
        { speaker: '', text: '奥に鏡が見える......', pause: 500 },
        { speaker: '', text: '近づいて、確かめてみよう。', pause: 0 },
    ],
    mirror_event: [
        { speaker: '', text: '鏡に......', pause: 1000 },
        { speaker: '', text: '......私が、いない？', pause: 1500 },
        { speaker: '', text: '鏡には何も映っていない。', pause: 1000 },
        { speaker: '', text: '......嘘だ。よく見ると、奥に誰かが......', pause: 2000 },
        { speaker: '', text: '!!!!!', pause: 500 },
    ]
};

// ========== PLAYER ==========
class Player {
    constructor() {
        this.x = 200;
        this.y = 286;
        this.width = 32;
        this.height = 56;
        this.vx = 0;
        this.vy = 0;
        this.speed = 120;
        this.facingRight = true;
        this.onGround = true;
        this.state = 'idle'; // idle, walk, run, fear
        this.animFrame = 0;
        this.animTimer = 0;
        this.fearLevel = 0;
        this.footstepTimer = 0;
        this.flashlightAngle = 0;
        this.flashlightRadius = 180;
        this.breathTimer = 0;
    }

    update(dt, engine) {
        let moveX = 0;
        let isRunning = false;

        if (engine.isKeyDown('ArrowLeft') || engine.isKeyDown('KeyA')) {
            moveX = -1;
            this.facingRight = false;
        }
        if (engine.isKeyDown('ArrowRight') || engine.isKeyDown('KeyD')) {
            moveX = 1;
            this.facingRight = true;
        }
        if (engine.isKeyDown('ShiftLeft') || engine.isKeyDown('ShiftRight')) {
            isRunning = true;
        }

        const currentSpeed = isRunning ? this.speed * 1.5 : this.speed;
        this.vx = moveX * currentSpeed;

        this.x += this.vx * dt;

        // Flashlight follows mouse
        const mousePos = engine.getGameMousePos();
        const screenX = this.getScreenX(engine.camera);
        const screenY = this.getScreenY(engine.camera);
        this.flashlightAngle = Math.atan2(
            mousePos.y - screenY,
            mousePos.x - screenX
        );

        // Animation
        this.animTimer += dt;
        if (Math.abs(moveX) > 0) {
            this.state = isRunning ? 'run' : 'walk';
            const animSpeed = isRunning ? 0.1 : 0.14;
            if (this.animTimer >= animSpeed) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 8;
            }
        } else {
            this.state = 'idle';
            if (this.animTimer >= 0.2) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 8;
            }
        }

        // Fear decay
        if (this.fearLevel > 0) {
            this.fearLevel = Math.max(0, this.fearLevel - dt * 0.2);
        }

        // Footsteps
        if (this.state === 'walk' || this.state === 'run') {
            this.footstepTimer += dt;
            const stepInterval = isRunning ? 0.22 : 0.38;
            if (this.footstepTimer >= stepInterval) {
                this.footstepTimer = 0;
                audio.playFootstep();
            }
        }

        // Breathing when scared
        this.breathTimer += dt;
        if (this.fearLevel > 0.3 && this.breathTimer > 3.5 - this.fearLevel * 2) {
            this.breathTimer = 0;
            audio.playBreathing(this.fearLevel);
        }

        // Update flashlight radius based on fear
        this.flashlightRadius = 180 - this.fearLevel * 50;
    }

    getScreenX(camera) {
        return this.x - camera.x;
    }

    getScreenY(camera) {
        return this.y - camera.y;
    }

    draw(ctx, camera) {
        const sheet = spriteGen.spriteSheets.character;
        if (!sheet) return;

        const screenX = this.getScreenX(camera);
        const screenY = this.getScreenY(camera);

        // Determine sprite row
        let row = 0;
        switch (this.state) {
            case 'idle': row = 0; break;
            case 'walk': row = 1; break;
            case 'run': row = 2; break;
            case 'fear': row = 3; break;
        }

        const frameW = 48;
        const frameH = 64;
        const frame = this.animFrame;

        // Draw ground shadow
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(screenX + frameW / 2, screenY + frameH - 2, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        
        // Draw character with facing direction
        if (!this.facingRight) {
            ctx.translate(screenX + frameW / 2, screenY);
            ctx.scale(-1, 1);
            ctx.drawImage(
                sheet,
                frame * frameW, row * frameH, frameW, frameH,
                -frameW / 2, 0, frameW, frameH
            );
        } else {
            ctx.drawImage(
                sheet,
                frame * frameW, row * frameH, frameW, frameH,
                screenX, screenY, frameW, frameH
            );
        }

        // Fear visual effect - slight red tint when scared
        if (this.fearLevel > 0.3) {
            ctx.globalAlpha = this.fearLevel * 0.15;
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(screenX, screenY, frameW, frameH);
        }

        ctx.restore();
    }

    setFear(level) {
        this.fearLevel = Math.min(1, Math.max(0, level));
    }

    triggerFearReaction() {
        this.state = 'fear';
        this.animFrame = 0;
        this.fearLevel = 0.8;
    }
}

// ========== MAIN GAME ==========
class Game {
    constructor() {
        this.player = new Player();
        this.currentLevel = null;
        this.currentLevelKey = 'entrance';
        this.dialogueQueue = [];
        this.currentDialogue = null;
        this.dialogueCharIndex = 0;
        this.dialogueTimer = 0;
        this.dialogueTypingSpeed = 0.04;
        this.dialogueComplete = false;
        this.triggeredEvents = new Set();
        this.horrorEventActive = false;
        this.horrorEventTimer = 0;
        this.transitionAlpha = 0;
        this.transitioning = false;
        this.transitionTarget = null;
        this.gameStarted = false;
        this.portraitExpression = 'neutral';
        this.titleAnimTimer = 0;
        this.interactPrompt = null;
        this.nearbyDoor = null;
        this.ambientEventTimer = 0;
    }

    async init() {
        // Generate all sprites
        await spriteGen.generateAll((text, progress) => {
            document.getElementById('loading-text').textContent = text;
            document.getElementById('loading-bar').style.width = (progress * 100) + '%';
        });

        // Init audio
        await audio.init();

        // Init effects
        effects.init(engine.internalWidth, engine.internalHeight);
        effects.spriteSheets_ghost = spriteGen.spriteSheets.ghost;

        // Hide loading, show title
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('title-screen').classList.remove('hidden');

        // Setup title screen
        this.setupTitleScreen();

        // Setup button handlers
        document.getElementById('btn-start').addEventListener('click', () => {
            audio.resume();
            audio.playUIClick();
            this.startGame();
        });
        document.getElementById('btn-credits').addEventListener('click', () => {
            audio.playUIClick();
            this.showCredits();
        });
        document.getElementById('btn-back').addEventListener('click', () => {
            audio.playUIClick();
            document.getElementById('credits-screen').classList.add('hidden');
            document.getElementById('title-screen').classList.remove('hidden');
        });

        // Start engine loop (for title screen effects)
        engine.start(this);
    }

    setupTitleScreen() {
        const titleCanvas = document.getElementById('title-canvas');
        const ctx = titleCanvas.getContext('2d');
        titleCanvas.width = window.innerWidth;
        titleCanvas.height = window.innerHeight;

        // Animate title background
        const animateTitle = () => {
            this.titleAnimTimer += 0.016;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, titleCanvas.width, titleCanvas.height);

            // Subtle moving fog
            for (let i = 0; i < 5; i++) {
                const x = (this.titleAnimTimer * 20 + i * 200) % (titleCanvas.width + 400) - 200;
                const y = titleCanvas.height * 0.6 + Math.sin(this.titleAnimTimer + i) * 30;
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, 200);
                gradient.addColorStop(0, 'rgba(30, 20, 40, 0.15)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, titleCanvas.width, titleCanvas.height);
            }

            // Film grain on title
            if (Math.random() > 0.5) {
                ctx.fillStyle = `rgba(255, 255, 255, ${0.01 + Math.random() * 0.02})`;
                for (let i = 0; i < 50; i++) {
                    ctx.fillRect(
                        Math.random() * titleCanvas.width,
                        Math.random() * titleCanvas.height,
                        1, 1
                    );
                }
            }

            if (document.getElementById('title-screen').classList.contains('hidden')) return;
            requestAnimationFrame(animateTitle);
        };
        animateTitle();
    }

    startGame() {
        document.getElementById('title-screen').classList.add('hidden');
        this.gameStarted = true;
        engine.state = 'playing';
        
        // Load first level
        this.loadLevel('entrance');
        
        // Start ambient
        audio.playAmbientDrone();
        audio.scheduleCreaks();
    }

    showCredits() {
        document.getElementById('title-screen').classList.add('hidden');
        document.getElementById('credits-screen').classList.remove('hidden');

        const creditsList = document.getElementById('credits-list');
        creditsList.innerHTML = `
            <div class="credit-item">
                <div class="asset-name">Creepster Font</div>
                <div class="asset-source">Google Fonts (OFL License) - https://fonts.google.com/specimen/Creepster</div>
                <div>作者: Font Diner, Jr.</div>
            </div>
            <div class="credit-item">
                <div class="asset-name">Nosifer Font</div>
                <div class="asset-source">Google Fonts (OFL License) - https://fonts.google.com/specimen/Nosifer</div>
                <div>作者: Typographic</div>
            </div>
            <div class="credit-item">
                <div class="asset-name">Metal Mania Font</div>
                <div class="asset-source">Google Fonts (OFL License) - https://fonts.google.com/specimen/Metal+Mania</div>
                <div>作者: Open Window</div>
            </div>
            <div class="credit-item">
                <div class="asset-name">Light Masks ( flashlight effects )</div>
                <div class="asset-source">Kenney (CC0) - https://github.com/shorepine/kenney</div>
                <div>作者: Kenney.nl</div>
            </div>
            <div class="credit-item">
                <div class="asset-name">Sound Effects Library</div>
                <div class="asset-source">github.com/JimLynchCodes/Game-Sound-Effects (Royalty Free)</div>
                <div>Various authors</div>
            </div>
            <div class="credit-item">
                <div class="asset-name">UI Tile Assets (Reference)</div>
                <div class="asset-source">Kenney - UI Pack Pixel Adventure (CC0)</div>
                <div>作者: Kenney.nl</div>
            </div>
            <div class="credit-item">
                <div class="asset-name">Character Sprites, Portraits, Environment Tiles, Effects</div>
                <div class="asset-source">自作 (Procedurally generated via Canvas API)</div>
                <div>Generated programmatically for this project</div>
            </div>
            <div class="credit-item">
                <div class="asset-name">Audio (Procedural)</div>
                <div class="asset-source">Web Audio API - Procedurally generated ambient sounds, horror effects</div>
                <div>Generated at runtime using oscillators and noise</div>
            </div>
        `;
    }

    loadLevel(key) {
        const levelData = LEVELS[key];
        if (!levelData) return;

        this.currentLevelKey = key;
        this.currentLevel = JSON.parse(JSON.stringify(levelData));
        this.currentLevel.objects = levelData.objects;
        this.currentLevel.events = levelData.events;
        this.currentLevel.entities = levelData.entities ? JSON.parse(JSON.stringify(levelData.entities)) : [];
        
        // Show level name
        this.currentLevel._showName = true;
        this.currentLevel._nameAlpha = 1.0;

        // Reset player position
        this.player.x = 200;
        this.player.y = levelData.floorY - 64;
        
        // Reset camera immediately
        engine.camera.x = 0;
        engine.camera.y = 0;
        engine.camera.targetX = 0;
        engine.camera.targetY = 0;
        
        // Trigger enter events
        setTimeout(() => this.triggerEvent('enter'), 500);
    }

    triggerEvent(triggerName) {
        if (!this.currentLevel || !this.currentLevel.events) return;
        
        for (const event of this.currentLevel.events) {
            if (event.trigger === triggerName && !this.triggeredEvents.has(this.currentLevelKey + '_' + triggerName)) {
                this.triggeredEvents.add(this.currentLevelKey + '_' + triggerName);
                this.executeEvent(event);
            }
        }
    }

    executeEvent(event) {
        switch (event.type) {
            case 'dialogue':
                this.startDialogue(event.data);
                break;
            case 'atmosphere':
                // Change atmosphere
                effects.vignetteIntensity = 0.8;
                effects.filmGrainIntensity = 0.08;
                break;
            case 'whisper':
                audio.playWhisper();
                this.player.setFear(0.3);
                break;
            case 'shadow_appear':
                if (this.currentLevel.entities) {
                    const shadow = this.currentLevel.entities.find(e => e.type === 'shadow');
                    if (shadow) {
                        shadow.active = true;
                        audio.playHorrorSting();
                        effects.triggerScreenShake(3);
                        effects.triggerDistortion(0.5);
                        this.player.setFear(0.6);
                    }
                }
                break;
            case 'horror_event':
                this.startHorrorEvent(event.data);
                break;
        }
    }

    startDialogue(dialogueKey) {
        const lines = DIALOGUES[dialogueKey];
        if (!lines) return;

        engine.state = 'dialogue';
        this.dialogueQueue = [...lines];
        this.advanceDialogue();
        
        document.getElementById('dialogue-overlay').classList.remove('hidden');
        
        // Set portrait
        this.updatePortrait();
    }

    advanceDialogue() {
        if (this.dialogueQueue.length === 0) {
            this.endDialogue();
            return;
        }

        this.currentDialogue = this.dialogueQueue.shift();
        this.dialogueCharIndex = 0;
        this.dialogueComplete = false;
        this.dialogueTimer = 0;

        document.getElementById('speaker-name').textContent = this.currentDialogue.speaker || '';
        document.getElementById('dialogue-text').textContent = '';
        document.getElementById('dialogue-indicator').style.opacity = '0';
        
        this.updatePortrait();
    }

    updateDialogue(dt) {
        if (!this.currentDialogue || this.dialogueComplete) return;

        this.dialogueTimer += dt;
        if (this.dialogueTimer >= this.dialogueTypingSpeed) {
            this.dialogueTimer = 0;
            this.dialogueCharIndex++;
            
            const text = this.currentDialogue.text;
            document.getElementById('dialogue-text').textContent = text.substring(0, this.dialogueCharIndex);
            
            if (this.dialogueCharIndex >= text.length) {
                this.dialogueComplete = true;
                document.getElementById('dialogue-indicator').style.opacity = '1';
                
                // Auto-advance after pause
                if (this.currentDialogue.pause > 0) {
                    setTimeout(() => {
                        if (this.dialogueComplete) {
                            this.advanceDialogue();
                        }
                    }, this.currentDialogue.pause);
                }
            }
        }
    }

    endDialogue() {
        engine.state = 'playing';
        this.currentDialogue = null;
        document.getElementById('dialogue-overlay').classList.add('hidden');
    }

    updatePortrait() {
        const portraitCanvas = document.getElementById('portrait-canvas');
        const ctx = portraitCanvas.getContext('2d');
        portraitCanvas.width = 200;
        portraitCanvas.height = 300;
        
        let expression = 'neutral';
        if (this.player.fearLevel > 0.5) expression = 'fear';
        else if (this.currentDialogue && this.currentDialogue.text.includes('!')) expression = 'fear';
        
        const portrait = spriteGen.spriteSheets[`portrait_${expression}`];
        if (portrait) {
            ctx.clearRect(0, 0, 200, 300);
            ctx.drawImage(portrait, 0, 0);
        }
        this.portraitExpression = expression;
    }

    startHorrorEvent(eventKey) {
        this.horrorEventActive = true;
        this.horrorEventTimer = 0;
        engine.state = 'horror_event';

        switch (eventKey) {
            case 'doll_scare':
                // Doll head turns
                audio.playHorrorSting();
                effects.addFlash(0.8);
                effects.triggerScreenShake(8);
                effects.triggerDistortion(1);
                this.player.triggerFearReaction();
                setTimeout(() => {
                    this.horrorEventActive = false;
                    engine.state = 'playing';
                    // Show scared dialogue
                    this.startDialogue('doll_scare');
                }, 2000);
                break;

            case 'mirror_event':
                // Mirror shows something wrong
                audio.playHorrorSting();
                effects.addFlash(0.5);
                effects.triggerScreenShake(5);
                effects.chromaticAberration = 5;
                effects.vignetteIntensity = 0.9;
                this.player.triggerFearReaction();
                
                // Start dialogue after brief delay
                setTimeout(() => {
                    this.startDialogue('mirror_event');
                }, 1500);

                // Ghost appears in mirror after dialogue
                setTimeout(() => {
                    if (this.currentLevel.entities) {
                        const ghost = this.currentLevel.entities.find(e => e.type === 'ghost');
                        if (ghost) ghost.active = true;
                    }
                    audio.playHorrorSting();
                    effects.addFlash(1);
                    effects.triggerScreenShake(15);
                    effects.triggerDistortion(2);
                    this.player.setFear(1);
                    
                    // Game ending sequence
                    setTimeout(() => {
                        this.triggerEnding();
                    }, 3000);
                }, 8000);
                break;
        }
    }

    triggerEnding() {
        // Fade to black with final message
        this.transitioning = true;
        this.transitionAlpha = 0;
        
        const fadeInterval = setInterval(() => {
            this.transitionAlpha += 0.02;
            if (this.transitionAlpha >= 1) {
                clearInterval(fadeInterval);
                // Show ending text
                this.showEnding();
            }
        }, 50);
    }

    showEnding() {
        document.getElementById('dialogue-overlay').classList.remove('hidden');
        document.getElementById('portrait-container').style.display = 'none';
        document.getElementById('speaker-name').textContent = '';
        document.getElementById('dialogue-text').textContent = '';
        document.getElementById('dialogue-indicator').style.opacity = '0';
        
        const endingLines = [
            '......私は、ここにずっといたのだろうか。',
            'それとも、ここから出られなかったのだろうか。',
            '',
            '鏡の中の「何か」が、私を呼んでいる。',
            '',
            '― 影の囁き ―',
            '',
            '- END -'
        ];

        let lineIndex = 0;
        const showLine = () => {
            if (lineIndex >= endingLines.length) return;
            const text = endingLines[lineIndex];
            document.getElementById('dialogue-text').textContent = text;
            lineIndex++;
            setTimeout(showLine, 2000);
        };
        showLine();
    }

    // ========== INTERACTION ==========
    
    checkInteractions() {
        if (!this.currentLevel) return;
        
        this.nearbyDoor = null;
        this.interactPrompt = null;
        
        for (const obj of this.currentLevel.objects) {
            if (obj.type === 'door') {
                const dx = this.player.x - obj.x;
                const dy = this.player.y - obj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 80) {
                    this.nearbyDoor = obj;
                    this.interactPrompt = { x: obj.x + obj.w / 2, y: obj.y - 20, text: '[E] 開ける' };
                    
                    if (engine.isKeyPressed('KeyE') || engine.isKeyPressed('Enter') || engine.isKeyPressed('Space')) {
                        if (obj.locked) {
                            // Locked door feedback
                            audio.playDoorSound();
                            effects.triggerScreenShake(2);
                        } else {
                            this.enterDoor(obj);
                        }
                    }
                }
            }
            
            // Check for approach events
            if (obj.type === 'decoration') {
                const dx = this.player.x - obj.x;
                const dy = this.player.y - obj.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 60) {
                    if (obj.sprite === 'doll') {
                        this.triggerEvent('approach_doll');
                    } else if (obj.sprite === 'altar') {
                        this.triggerEvent('approach_altar');
                    } else if (obj.sprite === 'mirror') {
                        this.triggerEvent('approach_mirror');
                    }
                }
            }
        }

        // Position-based triggers
        if (this.player.x > 1000 && this.currentLevelKey === 'hallway') {
            this.triggerEvent('reach_1000');
        }
        if (this.player.x > 1800 && this.currentLevelKey === 'hallway') {
            this.triggerEvent('reach_1800');
        }
    }

    enterDoor(door) {
        audio.playDoorSound();
        this.transitioning = true;
        this.transitionAlpha = 0;
        this.transitionTarget = door.leadsTo;
    }

    // ========== UPDATE ==========
    
    update(dt) {
        effects.update(dt);

        if (!this.gameStarted) return;
        if (engine.state === 'dialogue') {
            this.updateDialogue(dt);
            return;
        }
        if (engine.state === 'horror_event') {
            this.horrorEventTimer += dt;
            if (effects.chromaticAberration > 0) {
                effects.chromaticAberration *= 0.98;
            }
            return;
        }
        if (engine.state !== 'playing') return;

        // Update player
        this.player.update(dt, engine);

        // Clamp player to level bounds
        if (this.currentLevel) {
            this.player.x = Math.max(60, Math.min(this.player.x, this.currentLevel.width - 60));
            this.player.y = this.currentLevel.floorY - 64; // Fixed Y position
        }

        // Camera follow
        if (this.currentLevel) {
            engine.updateCamera(
                this.player.x + 24,
                this.player.y + 32,
                this.currentLevel.width,
                this.currentLevel.height
            );
        }

        // Check interactions
        this.checkInteractions();

        // Handle transition
        if (this.transitioning) {
            this.transitionAlpha += dt * 2;
            if (this.transitionAlpha >= 1 && this.transitionTarget) {
                this.loadLevel(this.transitionTarget);
                this.transitionTarget = null;
            }
            if (this.transitionAlpha >= 2) {
                this.transitioning = false;
                this.transitionAlpha = 0;
            }
        }

        // Random ambient events to build tension
        this.ambientEventTimer += dt;
        if (this.ambientEventTimer > 8 + Math.random() * 15) {
            this.ambientEventTimer = 0;
            const roll = Math.random();
            if (roll < 0.3) {
                // Whisper from the darkness
                audio.playWhisper();
                this.player.setFear(this.player.fearLevel + 0.05);
            } else if (roll < 0.5) {
                // Distant creak
                audio.playCreakSound();
            } else if (roll < 0.6) {
                // Brief light flicker
                effects.ambientFlicker = -0.15;
            } else if (roll < 0.7) {
                // Heartbeat
                if (this.player.fearLevel > 0.2) {
                    audio.playHeartbeat(this.player.fearLevel);
                }
            }
        }
    }

    // ========== RENDER ==========
    
    render(ctx, camera) {
        if (!this.gameStarted) return;

        engine.clearRenderBuffer(this.currentLevel ? this.currentLevel.bgColor : '#000');

        // Get player screen position for lighting
        const playerSX = this.player.getScreenX(engine.camera) + 24;
        const playerSY = this.player.getScreenY(engine.camera) + 20;

        if (this.currentLevel) {
            this.renderLevel(ctx, camera);
        }

        // Draw entities (behind player for some, in front for others)
        this.renderEntities(ctx, camera);

        // Draw player
        this.player.draw(ctx, engine.camera);

        // Apply full post-processing pipeline (fog, darkness, etc.)
        effects.applyPostProcessing(
            ctx,
            engine.camera.x,
            playerSX,
            playerSY,
            this.player.flashlightRadius,
            this.player.flashlightAngle
        );

        // Draw interaction prompt (on top of everything)
        if (this.interactPrompt && engine.state === 'playing') {
            this.drawInteractionPrompt(ctx, camera);
        }

        // Transition fade
        if (this.transitioning) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, this.transitionAlpha > 1 ? 2 - this.transitionAlpha : this.transitionAlpha);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, engine.internalWidth, engine.internalHeight);
            ctx.restore();
        }

        // Horror event overlay
        if (this.horrorEventActive) {
            this.renderHorrorOverlay(ctx);
        }

        // Level name display
        if (this.currentLevel && this.currentLevel._showName) {
            ctx.save();
            ctx.globalAlpha = this.currentLevel._nameAlpha || 0;
            ctx.fillStyle = '#888';
            ctx.font = '14px "Courier New", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.currentLevel.name, engine.internalWidth / 2, 30);
            ctx.restore();
            
            if (this.currentLevel._nameAlpha > 0) {
                this.currentLevel._nameAlpha -= 0.005;
            }
        }

        // HUD - Fear indicator (subtle)
        if (this.player.fearLevel > 0.1 && engine.state === 'playing') {
            this.drawFearIndicator(ctx);
        }

        // Draw flashlight cursor indicator
        if (engine.state === 'playing') {
            this.drawCursor(ctx);
        }
    }

    drawCursor(ctx) {
        const mousePos = engine.getGameMousePos();
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#ffeeaa';
        ctx.lineWidth = 1;
        
        // Small crosshair
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        
        // Dot
        ctx.fillStyle = '#ffeeaa';
        ctx.globalAlpha = 0.6 + Math.sin(effects.time * 3) * 0.2;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawFearIndicator(ctx) {
        ctx.save();
        ctx.globalAlpha = this.player.fearLevel * 0.3;
        // Red edge pulse
        const pulse = Math.sin(effects.time * 4) * 0.5 + 0.5;
        const gradient = ctx.createRadialGradient(
            engine.internalWidth / 2, engine.internalHeight / 2,
            engine.internalWidth * 0.3,
            engine.internalWidth / 2, engine.internalHeight / 2,
            engine.internalWidth * 0.6
        );
        gradient.addColorStop(0, 'rgba(80, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(100, 0, 0, ${pulse * this.player.fearLevel * 0.4})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, engine.internalWidth, engine.internalHeight);
        ctx.restore();
    }

    renderLevel(ctx, camera) {
        const level = this.currentLevel;
        const cam = engine.camera;

        // Draw ceiling
        const ceilingTile = spriteGen.spriteSheets.environment.ceiling;
        if (ceilingTile) {
            const startX = Math.floor(cam.x / 48) * 48;
            for (let x = startX - 48; x < startX + engine.internalWidth + 96; x += 48) {
                ctx.drawImage(ceilingTile, x - cam.x, -cam.y);
            }
        }

        // Draw back wall with parallax
        this.drawBackWall(ctx, cam);

        // Draw floor
        for (const platform of level.platforms) {
            const tileSet = platform.type === 'tatami' ? 
                spriteGen.spriteSheets.environment.tatami :
                spriteGen.spriteSheets.environment.floor;
            
            if (tileSet) {
                const startX = Math.floor(cam.x / 48) * 48;
                for (let x = startX - 48; x < cam.x + engine.internalWidth + 96; x += 48) {
                    const drawX = x - cam.x;
                    if (drawX > -48 && drawX < engine.internalWidth + 48) {
                        ctx.drawImage(tileSet, drawX, platform.y - cam.y);
                    }
                }
            }
        }

        // Draw walls and objects (sorted by Y for depth)
        const drawables = level.objects.filter(obj => {
            const screenX = obj.x - cam.x;
            return screenX + obj.w > -100 && screenX < engine.internalWidth + 100;
        });
        
        // Draw walls first (background)
        for (const obj of drawables) {
            if (obj.type === 'wall' || obj.type === 'wall_segment') {
                const screenX = obj.x - cam.x;
                const screenY = obj.y - cam.y;
                this.drawWall(ctx, screenX, screenY, obj.w, obj.h, obj.pattern);
            }
        }
        
        // Then objects
        for (const obj of drawables) {
            const screenX = obj.x - cam.x;
            const screenY = obj.y - cam.y;
            
            switch (obj.type) {
                case 'door':
                    this.drawDoor(ctx, screenX, screenY, obj);
                    break;
                case 'window':
                    this.drawWindow(ctx, screenX, screenY, obj.w, obj.h);
                    break;
                case 'decoration':
                    this.drawDecoration(ctx, screenX, screenY, obj);
                    break;
            }
        }

        // Draw atmospheric elements
        this.drawAtmosphere(ctx, cam);
    }

    drawBackWall(ctx, cam) {
        // Draw main back wall (solid, no parallax for stability)
        const wallTile = spriteGen.spriteSheets.environment.wall;
        if (!wallTile) return;
        
        const startX = Math.floor(cam.x / 48) * 48;
        
        for (let x = startX - 48; x < cam.x + engine.internalWidth + 96; x += 48) {
            const drawX = x - cam.x;
            if (drawX > -48 && drawX < engine.internalWidth + 48) {
                // Draw wall from top to floor
                for (let y = 0; y < 350; y += 48) {
                    ctx.drawImage(wallTile, drawX, y - cam.y);
                }
            }
        }
        
        // Add dark gradient at top (ceiling shadow)
        ctx.save();
        const topGrad = ctx.createLinearGradient(0, -cam.y, 0, 80 - cam.y);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, -cam.y, engine.internalWidth, 80);
        ctx.restore();
        
        // Add baseboard along the bottom of the wall
        ctx.save();
        ctx.fillStyle = '#0a0808';
        ctx.fillRect(0, 340 - cam.y, engine.internalWidth, 10);
        ctx.fillStyle = '#0d0a0a';
        ctx.fillRect(0, 338 - cam.y, engine.internalWidth, 3);
        ctx.restore();
    }

    drawAtmosphere(ctx, cam) {
        // Cobwebs in corners (decorative)
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 0.5;
        
        // Draw cobweb pattern in visible areas
        for (let x = 0; x < engine.internalWidth; x += 200) {
            if (Math.sin(x * 0.01 + cam.x * 0.001) > 0.5) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.quadraticCurveTo(x + 20, 15, x + 40, 0);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(x + 20, 0);
                ctx.lineTo(x + 20, 20);
                ctx.stroke();
            }
        }
        ctx.restore();

        // Floor edge shadow
        const floorY = this.currentLevel ? this.currentLevel.floorY - cam.y : 350;
        ctx.save();
        const shadowGrad = ctx.createLinearGradient(0, floorY - 5, 0, floorY + 15);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowGrad.addColorStop(0.3, 'rgba(0, 0, 0, 0.3)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, floorY - 5, engine.internalWidth, 20);
        ctx.restore();
    }

    drawWall(ctx, x, y, w, h, pattern) {
        const tileW = 48;
        const tileH = 48;
        const wallTile = pattern === 'damaged' ? 
            spriteGen.spriteSheets.environment.wallDamaged :
            spriteGen.spriteSheets.environment.wall;
        
        if (wallTile) {
            const startX = Math.floor(x / tileW) * tileW;
            const endX = x + w;
            const endY = y + h;
            
            for (let tx = startX; tx < endX; tx += tileW) {
                for (let ty = y; ty < endY; ty += tileH) {
                    ctx.drawImage(wallTile, tx, ty);
                }
            }
        }
    }

    drawDoor(ctx, x, y, doorObj) {
        const door = spriteGen.spriteSheets.environment.door;
        if (door) {
            ctx.drawImage(door, x, y, doorObj.w, doorObj.h);
            
            // Highlight if nearby
            if (doorObj === this.nearbyDoor) {
                ctx.save();
                ctx.globalAlpha = 0.2 + Math.sin(effects.time * 3) * 0.1;
                ctx.strokeStyle = '#886644';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - 2, y - 2, doorObj.w + 4, doorObj.h + 4);
                ctx.restore();
            }
        }
    }

    drawWindow(ctx, x, y, w, h) {
        const windowSprite = spriteGen.spriteSheets.environment.window;
        if (windowSprite) {
            ctx.drawImage(windowSprite, x, y, w, h);
        }
    }

    drawDecoration(ctx, x, y, obj) {
        switch (obj.sprite) {
            case 'shelf':
                // Draw a dark shelf
                ctx.fillStyle = '#1a1510';
                ctx.fillRect(x, y, obj.w, obj.h);
                ctx.fillStyle = '#151210';
                ctx.fillRect(x + 2, y + 2, obj.w - 4, obj.h * 0.3);
                ctx.fillRect(x + 2, y + obj.h * 0.4, obj.w - 4, obj.h * 0.3);
                ctx.fillRect(x + 2, y + obj.h * 0.7, obj.w - 4, obj.h * 0.25);
                break;
            case 'box':
                ctx.fillStyle = '#1a1815';
                ctx.fillRect(x, y, obj.w, obj.h);
                ctx.fillStyle = '#151310';
                ctx.fillRect(x + 2, y + 2, obj.w - 4, 3);
                break;
            case 'painting':
                // Dark painting on wall
                ctx.fillStyle = '#0a0a08';
                ctx.fillRect(x - 2, y - 2, obj.w + 4, obj.h + 4);
                ctx.fillStyle = '#151215';
                ctx.fillRect(x, y, obj.w, obj.h);
                // Something barely visible in painting
                ctx.fillStyle = `rgba(30, 20, 25, ${0.5 + Math.sin(effects.time) * 0.2})`;
                ctx.fillRect(x + 10, y + 10, 15, 20);
                break;
            case 'altar':
                // Buddhist altar
                ctx.fillStyle = '#1a1510';
                ctx.fillRect(x, y, obj.w, obj.h);
                ctx.fillStyle = '#252015';
                ctx.fillRect(x + 10, y + 10, obj.w - 20, obj.h - 30);
                // Incense
                ctx.fillStyle = '#3a3020';
                ctx.fillRect(x + obj.w / 2 - 1, y - 20, 2, 20);
                // Smoke particle
                ctx.fillStyle = `rgba(80, 80, 90, ${0.2 + Math.sin(effects.time * 2) * 0.1})`;
                ctx.beginPath();
                ctx.arc(x + obj.w / 2 + Math.sin(effects.time) * 5, y - 25 - Math.sin(effects.time * 0.5) * 10, 4, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'doll':
                // Creepy doll
                ctx.fillStyle = '#2a2020';
                ctx.fillRect(x + 15, y, 30, 50); // Body
                ctx.fillStyle = '#f0d0b0';
                ctx.fillRect(x + 20, y - 15, 20, 18); // Head
                // Eyes (follow player slightly)
                const lookX = Math.sign(this.player.x - (obj.x + obj.w / 2)) * 2;
                ctx.fillStyle = '#000';
                ctx.fillRect(x + 24 + lookX, y - 10, 4, 4);
                ctx.fillRect(x + 32 + lookX, y - 10, 4, 4);
                // Mouth (eerie smile)
                ctx.fillStyle = '#3a0000';
                ctx.fillRect(x + 25, y - 3, 10, 2);
                break;
            case 'mirror':
                // Dark mirror
                ctx.fillStyle = '#0a0a15';
                ctx.fillRect(x - 3, y - 3, obj.w + 6, obj.h + 6);
                ctx.fillStyle = '#050510';
                ctx.fillRect(x, y, obj.w, obj.h);
                // Reflection (distorted)
                const mirrorGlow = Math.sin(effects.time * 0.5) * 0.05;
                ctx.fillStyle = `rgba(20, 20, 40, ${0.3 + mirrorGlow})`;
                ctx.fillRect(x + 5, y + 5, obj.w - 10, obj.h - 10);
                // Ghostly figure in mirror (when active)
                const ghost = this.currentLevel.entities && this.currentLevel.entities.find(e => e.type === 'ghost' && e.active);
                if (ghost) {
                    ctx.save();
                    ctx.globalAlpha = 0.3 + Math.sin(effects.time * 3) * 0.2;
                    ctx.fillStyle = 'rgba(150, 150, 170, 0.4)';
                    ctx.beginPath();
                    ctx.ellipse(x + obj.w / 2, y + obj.h * 0.4, 8, 15, 0, 0, Math.PI * 2);
                    ctx.fill();
                    // Eyes in mirror
                    ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
                    ctx.fillRect(x + obj.w / 2 - 6, y + obj.h * 0.3, 3, 3);
                    ctx.fillRect(x + obj.w / 2 + 3, y + obj.h * 0.3, 3, 3);
                    ctx.restore();
                }
                break;
            case 'chair':
                ctx.fillStyle = '#15120d';
                ctx.fillRect(x, y + 20, obj.w, obj.h - 20);
                ctx.fillRect(x, y, obj.w, 25);
                ctx.fillRect(x - 3, y + 20, 5, obj.h);
                break;
        }
    }

    renderEntities(ctx, camera) {
        if (!this.currentLevel.entities) return;
        
        for (const entity of this.currentLevel.entities) {
            if (!entity.active) continue;
            
            const screenX = entity.x - camera.x;
            const screenY = entity.y - camera.y;
            
            switch (entity.type) {
                case 'ghost':
                    effects.drawGhostEntity(ctx, screenX, screenY, 0.4 + Math.sin(effects.time) * 0.2);
                    break;
                case 'shadow':
                    effects.drawShadowEntity(ctx, screenX, screenY, 0.5);
                    break;
            }
        }
    }

    drawInteractionPrompt(ctx, camera) {
        ctx.save();
        ctx.globalAlpha = 0.7 + Math.sin(effects.time * 3) * 0.3;
        ctx.fillStyle = '#aaa';
        ctx.font = '12px "Courier New", monospace';
        ctx.textAlign = 'center';
        const promptX = this.interactPrompt.x - camera.x;
        const promptY = this.interactPrompt.y - camera.y;
        ctx.fillText(this.interactPrompt.text, promptX, promptY);
        ctx.restore();
    }

    renderHorrorOverlay(ctx) {
        // Red flash overlay
        if (this.horrorEventTimer < 0.5) {
            ctx.save();
            ctx.globalAlpha = (0.5 - this.horrorEventTimer) * 0.3;
            ctx.fillStyle = '#440000';
            ctx.fillRect(0, 0, engine.internalWidth, engine.internalHeight);
            ctx.restore();
        }

        // Occasional flash frames
        if (Math.random() > 0.95) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, engine.internalWidth, engine.internalHeight);
            ctx.restore();
        }
    }

    // ========== INPUT HANDLERS ==========
    
    onKeyDown(e) {
        if (engine.state === 'dialogue') {
            if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
                if (!this.dialogueComplete) {
                    // Fast-forward text
                    this.dialogueCharIndex = this.currentDialogue.text.length;
                    document.getElementById('dialogue-text').textContent = this.currentDialogue.text;
                    this.dialogueComplete = true;
                    document.getElementById('dialogue-indicator').style.opacity = '1';
                } else {
                    this.advanceDialogue();
                }
                audio.playUIClick();
            }
        }
    }

    onClick(e) {
        if (engine.state === 'dialogue') {
            if (!this.dialogueComplete) {
                this.dialogueCharIndex = this.currentDialogue.text.length;
                document.getElementById('dialogue-text').textContent = this.currentDialogue.text;
                this.dialogueComplete = true;
                document.getElementById('dialogue-indicator').style.opacity = '1';
            } else {
                this.advanceDialogue();
            }
            audio.playUIClick();
        }
    }
}

// ========== MOBILE CONTROLS ==========
class MobileControls {
    constructor() {
        this.leftPressed = false;
        this.rightPressed = false;
        this.actionPressed = false;
        this.container = null;
    }

    create() {
        this.container = document.createElement('div');
        this.container.id = 'mobile-controls';
        this.container.innerHTML = `
            <div class="mobile-dpad">
                <button class="mobile-btn" id="btn-left">◀</button>
                <button class="mobile-btn" id="btn-right">▶</button>
            </div>
            <div class="mobile-action">
                <button class="mobile-btn action-btn" id="btn-action">E</button>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #mobile-controls {
                display: none;
                position: fixed;
                bottom: 20px;
                left: 0;
                right: 0;
                z-index: 300;
                padding: 0 20px;
                justify-content: space-between;
                align-items: flex-end;
                pointer-events: none;
            }
            .mobile-dpad {
                display: flex;
                gap: 10px;
                pointer-events: all;
            }
            .mobile-action {
                pointer-events: all;
            }
            .mobile-btn {
                width: 60px;
                height: 60px;
                border: 2px solid rgba(139, 0, 0, 0.5);
                background: rgba(20, 10, 15, 0.7);
                color: rgba(200, 100, 100, 0.8);
                border-radius: 50%;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                touch-action: none;
                user-select: none;
            }
            .mobile-btn:active, .mobile-btn.active {
                background: rgba(139, 0, 0, 0.4);
                border-color: rgba(255, 0, 0, 0.7);
            }
            .action-btn {
                width: 70px;
                height: 70px;
                font-family: 'Creepster', cursive;
            }
            @media (max-width: 768px) {
                #mobile-controls { display: flex !important; }
            }
            @media (pointer: coarse) {
                #mobile-controls { display: flex !important; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.container);

        // Touch handlers
        const setupButton = (id, onPress, onRelease) => {
            const btn = document.getElementById(id);
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); btn.classList.add('active'); onPress(); });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); btn.classList.remove('active'); onRelease(); });
            btn.addEventListener('touchcancel', (e) => { btn.classList.remove('active'); onRelease(); });
        };

        setupButton('btn-left', () => { engine.keys['ArrowLeft'] = true; }, () => { engine.keys['ArrowLeft'] = false; });
        setupButton('btn-right', () => { engine.keys['ArrowRight'] = true; }, () => { engine.keys['ArrowRight'] = false; });
        setupButton('btn-action', () => { engine.keys['KeyE'] = true; }, () => { engine.keys['KeyE'] = false; });
    }
}

// ========== INITIALIZATION ==========
window.addEventListener('load', async () => {
    await engine.init();
    const game = new Game();
    const mobileControls = new MobileControls();
    mobileControls.create();
    await game.init();
});
