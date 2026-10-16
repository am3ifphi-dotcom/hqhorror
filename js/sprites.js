/**
 * Sprite Generation System
 * Creates high-quality pixel art sprites procedurally
 */
class SpriteGenerator {
    constructor() {
        this.cache = {};
        this.spriteSheets = {};
    }

    // Create an offscreen canvas
    createCanvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    // Draw a pixel with anti-aliasing disabled
    setPixel(ctx, x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    }

    // ========== CHARACTER SPRITES ==========
    
    /**
     * Generate the protagonist sprite sheet
     * A quiet girl with dark hair, school uniform
     * Animations: idle(8f), walk(8f), run(6f), fear(4f), back_walk(8f)
     */
    generateCharacterSheet() {
        const frameW = 48;
        const frameH = 64;
        const cols = 8;
        const rows = 5; // idle, walk, run, fear, back_walk
        const sheet = this.createCanvas(frameW * cols, frameH * rows);
        const ctx = sheet.getContext('2d');

        // Color palette for the character
        const colors = {
            hair: '#1a1a2e',
            hairHighlight: '#2d2d4a',
            skin: '#f0d5c0',
            skinShadow: '#d4b8a0',
            eye: '#2d1b1b',
            eyeWhite: '#e8e0d8',
            uniform: '#1a1a3a',
            uniformLight: '#2a2a5a',
            skirt: '#1a1a3a',
            skirtLight: '#252550',
            shoes: '#0a0a1a',
            ribbon: '#8b0000',
            outline: '#0a0a15'
        };

        // Draw each animation row
        for (let frame = 0; frame < cols; frame++) {
            // Row 0: Idle animation (breathing)
            this.drawCharacterIdle(ctx, frame * frameW, 0, frameW, frameH, frame, colors);
            // Row 1: Walk cycle
            this.drawCharacterWalk(ctx, frame * frameW, frameH, frameW, frameH, frame, colors);
            // Row 2: Run cycle
            this.drawCharacterRun(ctx, frame * frameW, frameH * 2, frameW, frameH, frame % 6, colors);
            // Row 3: Fear reaction
            this.drawCharacterFear(ctx, frame * frameW, frameH * 3, frameW, frameH, frame, colors);
            // Row 4: Walk from behind
            this.drawCharacterBackWalk(ctx, frame * frameW, frameH * 4, frameW, frameH, frame, colors);
        }

        this.spriteSheets.character = sheet;
        return sheet;
    }

    drawCharacterIdle(ctx, ox, oy, w, h, frame, c) {
        const breatheOffset = Math.sin(frame * Math.PI / 4) * 0.5;
        const hairSway = Math.sin(frame * Math.PI / 4 + 0.3) * 0.3;
        
        // Hair shadow on wall (subtle)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(ox + 18, oy + 10 + breatheOffset, 14, 16);
        
        // Hair (back layer)
        ctx.fillStyle = c.hair;
        ctx.fillRect(ox + 15, oy + 6 + breatheOffset, 18, 24);
        ctx.fillRect(ox + 13 + hairSway, oy + 10 + breatheOffset, 22, 18);
        // Long hair strands falling down
        ctx.fillRect(ox + 13 + hairSway, oy + 22 + breatheOffset, 6, 14);
        ctx.fillRect(ox + 29 + hairSway, oy + 22 + breatheOffset, 6, 14);
        
        // Head shape
        ctx.fillStyle = c.skin;
        ctx.fillRect(ox + 18, oy + 8 + breatheOffset, 12, 14);
        ctx.fillRect(ox + 17, oy + 9 + breatheOffset, 14, 12);
        // Ear
        ctx.fillRect(ox + 16, oy + 13 + breatheOffset, 2, 4, c.skinShadow);
        ctx.fillRect(ox + 30, oy + 13 + breatheOffset, 2, 4, c.skinShadow);
        
        // Hair (front layer)
        ctx.fillStyle = c.hair;
        ctx.fillRect(ox + 16, oy + 5 + breatheOffset, 16, 7);
        // Side hair
        ctx.fillRect(ox + 14 + hairSway, oy + 8 + breatheOffset, 5, 14);
        ctx.fillRect(ox + 29 + hairSway, oy + 8 + breatheOffset, 5, 14);
        
        // Bangs (detailed strands)
        ctx.fillStyle = c.hairHighlight;
        ctx.fillRect(ox + 18, oy + 7 + breatheOffset, 12, 4);
        ctx.fillStyle = c.hair;
        ctx.fillRect(ox + 19, oy + 10 + breatheOffset, 3, 3);
        ctx.fillRect(ox + 23, oy + 10 + breatheOffset, 2, 2);
        ctx.fillRect(ox + 26, oy + 10 + breatheOffset, 3, 3);
        
        // Eyes (subtle blink on frame 6-7)
        if (frame < 6) {
            // Eye whites
            ctx.fillStyle = c.eyeWhite;
            ctx.fillRect(ox + 20, oy + 14 + breatheOffset, 3, 2);
            ctx.fillRect(ox + 26, oy + 14 + breatheOffset, 3, 2);
            // Iris
            ctx.fillStyle = c.eye;
            ctx.fillRect(ox + 21, oy + 14 + breatheOffset, 2, 2);
            ctx.fillRect(ox + 27, oy + 14 + breatheOffset, 2, 2);
            // Eye highlight
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(ox + 20, oy + 14 + breatheOffset, 1, 1);
            ctx.fillRect(ox + 26, oy + 14 + breatheOffset, 1, 1);
        } else {
            // Blink (closed eyes)
            ctx.fillStyle = c.skinShadow;
            ctx.fillRect(ox + 20, oy + 15 + breatheOffset, 3, 1);
            ctx.fillRect(ox + 26, oy + 15 + breatheOffset, 3, 1);
        }
        
        // Nose
        ctx.fillStyle = c.skinShadow;
        ctx.fillRect(ox + 24, oy + 17 + breatheOffset, 1, 1);
        
        // Mouth
        ctx.fillStyle = c.skinShadow;
        ctx.fillRect(ox + 23, oy + 19 + breatheOffset, 2, 1);
        
        // Ribbon/bow
        ctx.fillStyle = c.ribbon;
        ctx.fillRect(ox + 17, oy + 6 + breatheOffset, 4, 3);
        ctx.fillRect(ox + 15, oy + 5 + breatheOffset, 3, 2);
        ctx.fillRect(ox + 20, oy + 5 + breatheOffset, 3, 2);
        ctx.fillStyle = '#aa2222';
        ctx.fillRect(ox + 18, oy + 6 + breatheOffset, 2, 2);
        
        // Neck
        ctx.fillStyle = c.skin;
        ctx.fillRect(ox + 22, oy + 22 + breatheOffset, 4, 3);
        ctx.fillStyle = c.skinShadow;
        ctx.fillRect(ox + 22, oy + 23 + breatheOffset, 4, 1);
        
        // Body/Uniform top
        ctx.fillStyle = c.uniform;
        ctx.fillRect(ox + 18, oy + 24 + breatheOffset, 12, 12);
        // Collar
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox + 20, oy + 24 + breatheOffset, 8, 2);
        ctx.fillStyle = c.uniformLight;
        ctx.fillRect(ox + 19, oy + 24 + breatheOffset, 10, 4);
        // Uniform details
        ctx.fillStyle = c.uniform;
        ctx.fillRect(ox + 20, oy + 26 + breatheOffset, 8, 10);
        
        // Arms
        const armSway = Math.sin(frame * Math.PI / 4) * 0.3;
        ctx.fillStyle = c.uniform;
        ctx.fillRect(ox + 14, oy + 25 + breatheOffset + armSway, 4, 11);
        ctx.fillRect(ox + 30, oy + 25 + breatheOffset - armSway, 4, 11);
        // Hands
        ctx.fillStyle = c.skin;
        ctx.fillRect(ox + 14, oy + 35 + breatheOffset + armSway, 4, 3);
        ctx.fillRect(ox + 30, oy + 35 + breatheOffset - armSway, 4, 3);
        
        // Skirt
        ctx.fillStyle = c.skirt;
        ctx.fillRect(ox + 16, oy + 36 + breatheOffset, 16, 10);
        ctx.fillStyle = c.skirtLight;
        ctx.fillRect(ox + 17, oy + 36 + breatheOffset, 14, 2);
        // Skirt folds
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(ox + 20, oy + 37 + breatheOffset, 1, 8);
        ctx.fillRect(ox + 25, oy + 37 + breatheOffset, 1, 8);
        
        // Legs
        ctx.fillStyle = c.skin;
        ctx.fillRect(ox + 19, oy + 46 + breatheOffset, 4, 12);
        ctx.fillRect(ox + 25, oy + 46 + breatheOffset, 4, 12);
        // Socks
        ctx.fillStyle = '#e8e0d8';
        ctx.fillRect(ox + 19, oy + 50 + breatheOffset, 4, 8);
        ctx.fillRect(ox + 25, oy + 50 + breatheOffset, 4, 8);
        
        // Shoes
        ctx.fillStyle = c.shoes;
        ctx.fillRect(ox + 18, oy + 57 + breatheOffset, 6, 4);
        ctx.fillRect(ox + 25, oy + 57 + breatheOffset, 6, 4);
        ctx.fillStyle = '#151015';
        ctx.fillRect(ox + 18, oy + 57 + breatheOffset, 6, 1);
        ctx.fillRect(ox + 25, oy + 57 + breatheOffset, 6, 1);
    }

    drawCharacterWalk(ctx, ox, oy, w, h, frame, c) {
        const phase = frame / 8 * Math.PI * 2;
        const bobY = Math.abs(Math.sin(phase)) * -2;
        const legPhase = Math.sin(phase);
        const armPhase = Math.cos(phase);
        
        // Hair (back) - sways slightly
        const hairSway = Math.sin(phase + 0.5) * 1;
        this.drawPixelRect(ctx, ox + 16 + hairSway, oy + 6 + bobY, 16, 22, c.hair);
        this.drawPixelRect(ctx, ox + 14 + hairSway, oy + 10 + bobY, 20, 16, c.hair);
        
        // Head
        this.drawPixelRect(ctx, ox + 18, oy + 8 + bobY, 12, 14, c.skin);
        this.drawPixelRect(ctx, ox + 17, oy + 9 + bobY, 14, 12, c.skin);
        
        // Hair front
        this.drawPixelRect(ctx, ox + 17, oy + 6 + bobY, 14, 6, c.hair);
        this.drawPixelRect(ctx, ox + 15 + hairSway, oy + 8 + bobY, 4, 12, c.hair);
        this.drawPixelRect(ctx, ox + 29 + hairSway, oy + 8 + bobY, 4, 12, c.hair);
        
        // Bangs
        this.drawPixelRect(ctx, ox + 18, oy + 8 + bobY, 12, 3, c.hairHighlight);
        
        // Eyes
        this.drawPixelRect(ctx, ox + 20, oy + 14 + bobY, 3, 2, c.eyeWhite);
        this.drawPixelRect(ctx, ox + 25, oy + 14 + bobY, 3, 2, c.eyeWhite);
        this.drawPixelRect(ctx, ox + 21, oy + 14 + bobY, 2, 2, c.eye);
        this.drawPixelRect(ctx, ox + 26, oy + 14 + bobY, 2, 2, c.eye);
        
        // Mouth
        this.drawPixelRect(ctx, ox + 23, oy + 18 + bobY, 2, 1, c.skinShadow);
        
        // Ribbon
        this.drawPixelRect(ctx, ox + 18, oy + 7 + bobY, 3, 2, c.ribbon);
        
        // Body
        this.drawPixelRect(ctx, ox + 18, oy + 22 + bobY, 12, 14, c.uniform);
        this.drawPixelRect(ctx, ox + 20, oy + 22 + bobY, 8, 3, c.uniformLight);
        
        // Arms (swing opposite to legs)
        const armSwing = armPhase * 3;
        this.drawPixelRect(ctx, ox + 14, oy + 24 + bobY + armSwing, 4, 12, c.uniform);
        this.drawPixelRect(ctx, ox + 30, oy + 24 + bobY - armSwing, 4, 12, c.uniform);
        this.drawPixelRect(ctx, ox + 15, oy + 35 + bobY + armSwing, 3, 3, c.skin);
        this.drawPixelRect(ctx, ox + 30, oy + 35 + bobY - armSwing, 3, 3, c.skin);
        
        // Skirt (sways)
        const skirtSway = hairSway * 0.5;
        this.drawPixelRect(ctx, ox + 16 + skirtSway, oy + 36 + bobY, 16, 10, c.skirt);
        this.drawPixelRect(ctx, ox + 17 + skirtSway, oy + 36 + bobY, 14, 3, c.skirtLight);
        
        // Legs (walk cycle)
        const leg1Offset = legPhase * 3;
        const leg2Offset = -legPhase * 3;
        this.drawPixelRect(ctx, ox + 19, oy + 46 + bobY, 4, 10 + leg1Offset, c.skin);
        this.drawPixelRect(ctx, ox + 25, oy + 46 + bobY, 4, 10 + leg2Offset, c.skin);
        
        // Shoes
        this.drawPixelRect(ctx, ox + 18, oy + 55 + bobY + Math.max(0, leg1Offset), 5, 3, c.shoes);
        this.drawPixelRect(ctx, ox + 25, oy + 55 + bobY + Math.max(0, leg2Offset), 5, 3, c.shoes);
    }

    drawCharacterRun(ctx, ox, oy, w, h, frame, c) {
        const phase = frame / 6 * Math.PI * 2;
        const bobY = Math.abs(Math.sin(phase)) * -3;
        const legPhase = Math.sin(phase);
        
        // Hair (back) - flows more when running
        const hairFlow = Math.sin(phase + 0.5) * 2;
        this.drawPixelRect(ctx, ox + 14 + hairFlow, oy + 4 + bobY, 18, 24, c.hair);
        this.drawPixelRect(ctx, ox + 12 + hairFlow, oy + 8 + bobY, 22, 18, c.hair);
        
        // Head
        this.drawPixelRect(ctx, ox + 18, oy + 8 + bobY, 12, 14, c.skin);
        
        // Hair front
        this.drawPixelRect(ctx, ox + 17, oy + 6 + bobY, 14, 5, c.hair);
        
        // Wide scared eyes
        this.drawPixelRect(ctx, ox + 19, oy + 13 + bobY, 4, 3, c.eyeWhite);
        this.drawPixelRect(ctx, ox + 25, oy + 13 + bobY, 4, 3, c.eyeWhite);
        this.drawPixelRect(ctx, ox + 20, oy + 14 + bobY, 2, 2, c.eye);
        this.drawPixelRect(ctx, ox + 26, oy + 14 + bobY, 2, 2, c.eye);
        
        // Open mouth (scared)
        this.drawPixelRect(ctx, ox + 22, oy + 18 + bobY, 4, 2, '#2a1515');
        
        // Ribbon flowing
        this.drawPixelRect(ctx, ox + 16 + hairFlow, oy + 7 + bobY, 4, 2, c.ribbon);
        
        // Body (leaning forward)
        this.drawPixelRect(ctx, ox + 19, oy + 22 + bobY, 12, 13, c.uniform);
        
        // Arms (running motion)
        const armSwing = Math.cos(phase) * 5;
        this.drawPixelRect(ctx, ox + 15, oy + 23 + bobY + armSwing, 4, 10, c.uniform);
        this.drawPixelRect(ctx, ox + 30, oy + 23 + bobY - armSwing, 4, 10, c.uniform);
        this.drawPixelRect(ctx, ox + 15, oy + 32 + bobY + armSwing, 3, 3, c.skin);
        this.drawPixelRect(ctx, ox + 31, oy + 32 + bobY - armSwing, 3, 3, c.skin);
        
        // Skirt (flowing)
        this.drawPixelRect(ctx, ox + 15 + hairFlow * 0.7, oy + 35 + bobY, 17, 9, c.skirt);
        
        // Legs
        const leg1 = legPhase * 5;
        const leg2 = -legPhase * 5;
        this.drawPixelRect(ctx, ox + 20, oy + 44 + bobY, 4, 10 + Math.max(0, leg1), c.skin);
        this.drawPixelRect(ctx, ox + 25, oy + 44 + bobY, 4, 10 + Math.max(0, leg2), c.skin);
        
        // Shoes
        this.drawPixelRect(ctx, ox + 19, oy + 53 + bobY + Math.max(0, leg1), 5, 3, c.shoes);
        this.drawPixelRect(ctx, ox + 25, oy + 53 + bobY + Math.max(0, leg2), 5, 3, c.shoes);
    }

    drawCharacterFear(ctx, ox, oy, w, h, frame, c) {
        const tremble = (frame % 2 === 0) ? -1 : 1;
        const crouch = Math.min(frame, 2) * 2;
        
        // Hair (disheveled)
        this.drawPixelRect(ctx, ox + 14 + tremble, oy + 6 + crouch, 20, 24, c.hair);
        this.drawPixelRect(ctx, ox + 12 + tremble, oy + 10 + crouch, 24, 18, c.hair);
        
        // Head
        this.drawPixelRect(ctx, ox + 18 + tremble, oy + 8 + crouch, 12, 14, c.skin);
        
        // Hair front (messy)
        this.drawPixelRect(ctx, ox + 16 + tremble, oy + 6 + crouch, 16, 6, c.hair);
        this.drawPixelRect(ctx, ox + 14 + tremble, oy + 9 + crouch, 5, 8, c.hair);
        
        // Eyes (wide, terrified)
        this.drawPixelRect(ctx, ox + 19 + tremble, oy + 13 + crouch, 4, 4, c.eyeWhite);
        this.drawPixelRect(ctx, ox + 25 + tremble, oy + 13 + crouch, 4, 4, c.eyeWhite);
        // Small pupils (fear)
        this.drawPixelRect(ctx, ox + 21 + tremble, oy + 14 + crouch, 1, 1, c.eye);
        this.drawPixelRect(ctx, ox + 27 + tremble, oy + 14 + crouch, 1, 1, c.eye);
        
        // Mouth (open, gasping)
        this.drawPixelRect(ctx, ox + 22 + tremble, oy + 19 + crouch, 4, 3, '#1a0a0a');
        
        // Body (crouching)
        this.drawPixelRect(ctx, ox + 17 + tremble, oy + 24 + crouch, 14, 14, c.uniform);
        
        // Arms (raised defensively)
        this.drawPixelRect(ctx, ox + 12 + tremble, oy + 22 + crouch, 5, 10, c.uniform);
        this.drawPixelRect(ctx, ox + 31 + tremble, oy + 22 + crouch, 5, 10, c.uniform);
        this.drawPixelRect(ctx, ox + 12 + tremble, oy + 20 + crouch, 4, 4, c.skin);
        this.drawPixelRect(ctx, ox + 32 + tremble, oy + 20 + crouch, 4, 4, c.skin);
        
        // Skirt
        this.drawPixelRect(ctx, ox + 14 + tremble, oy + 38 + crouch, 20, 10, c.skirt);
        
        // Legs (bent)
        this.drawPixelRect(ctx, ox + 18 + tremble, oy + 48 + crouch, 5, 8, c.skin);
        this.drawPixelRect(ctx, ox + 25 + tremble, oy + 48 + crouch, 5, 8, c.skin);
        
        // Shoes
        this.drawPixelRect(ctx, ox + 17 + tremble, oy + 55 + crouch, 6, 3, c.shoes);
        this.drawPixelRect(ctx, ox + 25 + tremble, oy + 55 + crouch, 6, 3, c.shoes);
    }

    drawCharacterBackWalk(ctx, ox, oy, w, h, frame, c) {
        const phase = frame / 8 * Math.PI * 2;
        const bobY = Math.abs(Math.sin(phase)) * -1.5;
        const legPhase = Math.sin(phase);
        const hairSway = Math.sin(phase + 0.3) * 1.5;
        
        // Hair (back view - prominent)
        this.drawPixelRect(ctx, ox + 14 + hairSway, oy + 4 + bobY, 20, 28, c.hair);
        this.drawPixelRect(ctx, ox + 12 + hairSway, oy + 8 + bobY, 24, 20, c.hair);
        // Hair highlights
        this.drawPixelRect(ctx, ox + 18 + hairSway, oy + 6 + bobY, 4, 20, c.hairHighlight);
        this.drawPixelRect(ctx, ox + 26 + hairSway, oy + 8 + bobY, 3, 16, c.hairHighlight);
        
        // Head (back of head)
        this.drawPixelRect(ctx, ox + 18, oy + 8 + bobY, 12, 14, c.hair);
        
        // Body
        this.drawPixelRect(ctx, ox + 18, oy + 22 + bobY, 12, 14, c.uniform);
        
        // Arms
        const armSwing = Math.cos(phase) * 3;
        this.drawPixelRect(ctx, ox + 14, oy + 24 + bobY + armSwing, 4, 12, c.uniform);
        this.drawPixelRect(ctx, ox + 30, oy + 24 + bobY - armSwing, 4, 12, c.uniform);
        this.drawPixelRect(ctx, ox + 15, oy + 35 + bobY + armSwing, 3, 3, c.skin);
        this.drawPixelRect(ctx, ox + 30, oy + 35 + bobY - armSwing, 3, 3, c.skin);
        
        // Skirt
        this.drawPixelRect(ctx, ox + 16 + hairSway * 0.3, oy + 36 + bobY, 16, 10, c.skirt);
        
        // Legs
        const l1 = legPhase * 3;
        const l2 = -legPhase * 3;
        this.drawPixelRect(ctx, ox + 19, oy + 46 + bobY, 4, 10 + Math.max(0, l1), c.skin);
        this.drawPixelRect(ctx, ox + 25, oy + 46 + bobY, 4, 10 + Math.max(0, l2), c.skin);
        
        // Shoes
        this.drawPixelRect(ctx, ox + 18, oy + 55 + bobY + Math.max(0, l1), 5, 3, c.shoes);
        this.drawPixelRect(ctx, ox + 25, oy + 55 + bobY + Math.max(0, l2), 5, 3, c.shoes);
    }

    // ========== PORTRAIT (立ち絵) ==========
    
    generatePortrait(expression = 'neutral') {
        const w = 200;
        const h = 300;
        const canvas = this.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        const c = {
            hair: '#1a1a2e',
            hairHighlight: '#2d2d4a',
            hairShadow: '#0d0d1a',
            skin: '#f0d5c0',
            skinShadow: '#d4b8a0',
            skinHighlight: '#fae8d8',
            eye: '#2d1b1b',
            eyeWhite: '#e8e0d8',
            eyeHighlight: '#ffffff',
            uniform: '#1a1a3a',
            uniformLight: '#2a2a5a',
            skirt: '#1a1a3a',
            ribbon: '#8b0000',
            ribbonHighlight: '#aa2222',
            outline: '#0a0a15'
        };
        
        // Scale factor (portrait is larger)
        const s = 3;
        const cx = w / 2;
        const cy = h * 0.35;
        
        // Hair back
        ctx.fillStyle = c.hair;
        ctx.fillRect(cx - 45*s/3, cy - 10, 90*s/3, 120);
        ctx.fillRect(cx - 50*s/3, cy + 20, 100*s/3, 80);
        
        // Neck
        ctx.fillStyle = c.skin;
        ctx.fillRect(cx - 8, cy + 45, 16, 15);
        ctx.fillStyle = c.skinShadow;
        ctx.fillRect(cx - 6, cy + 50, 12, 5);
        
        // Shoulders/Uniform top
        ctx.fillStyle = c.uniform;
        ctx.fillRect(cx - 45, cy + 58, 90, 80);
        ctx.fillStyle = c.uniformLight;
        ctx.fillRect(cx - 20, cy + 58, 40, 8); // collar
        
        // Collar detail
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 15, cy + 58, 30, 4);
        
        // Head shape
        ctx.fillStyle = c.skin;
        ctx.fillRect(cx - 25, cy - 30, 50, 55);
        ctx.fillRect(cx - 22, cy - 35, 44, 65);
        
        // Face highlight
        ctx.fillStyle = c.skinHighlight;
        ctx.fillRect(cx - 15, cy - 20, 20, 25);
        
        // Face shadow
        ctx.fillStyle = c.skinShadow;
        ctx.fillRect(cx - 22, cy + 10, 44, 15);
        ctx.fillRect(cx - 25, cy - 5, 5, 30);
        ctx.fillRect(cx + 20, cy - 5, 5, 30);
        
        // Hair front
        ctx.fillStyle = c.hair;
        ctx.fillRect(cx - 28, cy - 40, 56, 20);
        ctx.fillRect(cx - 30, cy - 25, 12, 40);
        ctx.fillRect(cx + 18, cy - 25, 12, 40);
        
        // Bangs (detailed)
        ctx.fillStyle = c.hairHighlight;
        ctx.fillRect(cx - 20, cy - 35, 40, 10);
        // Individual bang strands
        for (let i = 0; i < 5; i++) {
            ctx.fillStyle = i % 2 === 0 ? c.hair : c.hairHighlight;
            ctx.fillRect(cx - 18 + i * 9, cy - 30, 7, 15 + (i % 2) * 3);
        }
        
        // Hair side strands
        ctx.fillStyle = c.hair;
        ctx.fillRect(cx - 32, cy - 15, 10, 70);
        ctx.fillRect(cx + 22, cy - 15, 10, 70);
        ctx.fillStyle = c.hairShadow;
        ctx.fillRect(cx - 32, cy - 15, 4, 70);
        ctx.fillRect(cx + 26, cy - 15, 4, 70);
        
        // Eyes
        if (expression === 'neutral' || expression === 'sad') {
            // Eye whites
            ctx.fillStyle = c.eyeWhite;
            ctx.fillRect(cx - 16, cy - 8, 12, 8);
            ctx.fillRect(cx + 4, cy - 8, 12, 8);
            
            // Iris
            ctx.fillStyle = c.eye;
            ctx.fillRect(cx - 13, cy - 7, 8, 7);
            ctx.fillRect(cx + 5, cy - 7, 8, 7);
            
            // Pupils
            ctx.fillStyle = '#000';
            ctx.fillRect(cx - 11, cy - 5, 4, 5);
            ctx.fillRect(cx + 7, cy - 5, 4, 5);
            
            // Eye highlights
            ctx.fillStyle = c.eyeHighlight;
            ctx.fillRect(cx - 14, cy - 8, 3, 3);
            ctx.fillRect(cx + 4, cy - 8, 3, 3);
            
            // Eyelids
            ctx.fillStyle = c.hair;
            ctx.fillRect(cx - 17, cy - 10, 14, 3);
            ctx.fillRect(cx + 3, cy - 10, 14, 3);
            
            if (expression === 'sad') {
                // Sad eyebrows
                ctx.fillStyle = c.hair;
                ctx.fillRect(cx - 15, cy - 14, 10, 2);
                ctx.fillRect(cx + 5, cy - 14, 10, 2);
                ctx.fillRect(cx - 17, cy - 13, 3, 2);
                ctx.fillRect(cx + 14, cy - 13, 3, 2);
            }
        } else if (expression === 'fear') {
            // Wide terrified eyes
            ctx.fillStyle = c.eyeWhite;
            ctx.fillRect(cx - 18, cy - 10, 14, 12);
            ctx.fillRect(cx + 4, cy - 10, 14, 12);
            
            // Small pupils (fear)
            ctx.fillStyle = c.eye;
            ctx.fillRect(cx - 13, cy - 5, 5, 5);
            ctx.fillRect(cx + 8, cy - 5, 5, 5);
            ctx.fillStyle = '#000';
            ctx.fillRect(cx - 12, cy - 4, 3, 3);
            ctx.fillRect(cx + 9, cy - 4, 3, 3);
            
            // Highlights
            ctx.fillStyle = c.eyeHighlight;
            ctx.fillRect(cx - 16, cy - 9, 3, 3);
            ctx.fillRect(cx + 6, cy - 9, 3, 3);
            
            // Raised eyebrows
            ctx.fillStyle = c.hair;
            ctx.fillRect(cx - 16, cy - 16, 12, 2);
            ctx.fillRect(cx + 4, cy - 16, 12, 2);
        }
        
        // Nose (subtle)
        ctx.fillStyle = c.skinShadow;
        ctx.fillRect(cx - 1, cy + 5, 3, 4);
        
        // Mouth
        if (expression === 'neutral') {
            ctx.fillStyle = c.skinShadow;
            ctx.fillRect(cx - 4, cy + 15, 8, 2);
        } else if (expression === 'fear') {
            ctx.fillStyle = '#1a0a0a';
            ctx.fillRect(cx - 5, cy + 14, 10, 5);
            ctx.fillStyle = '#3a1515';
            ctx.fillRect(cx - 4, cy + 15, 8, 3);
        } else if (expression === 'sad') {
            ctx.fillStyle = c.skinShadow;
            ctx.fillRect(cx - 4, cy + 16, 8, 2);
            ctx.fillRect(cx - 5, cy + 15, 2, 2);
            ctx.fillRect(cx + 3, cy + 15, 2, 2);
        }
        
        // Ribbon
        ctx.fillStyle = c.ribbon;
        ctx.fillRect(cx - 25, cy - 35, 12, 8);
        ctx.fillRect(cx - 28, cy - 38, 8, 5);
        ctx.fillRect(cx - 18, cy - 38, 8, 5);
        ctx.fillStyle = c.ribbonHighlight;
        ctx.fillRect(cx - 22, cy - 36, 4, 4);
        
        // Skirt hint at bottom
        ctx.fillStyle = c.skirt;
        ctx.fillRect(cx - 40, cy + 130, 80, 80);
        ctx.fillStyle = c.uniformLight;
        ctx.fillRect(cx - 38, cy + 130, 76, 5);
        
        this.spriteSheets[`portrait_${expression}`] = canvas;
        return canvas;
    }

    // ========== ENVIRONMENT TILES ==========
    
    generateEnvironmentTiles() {
        const tileSize = 48;
        const tiles = {};
        
        // Dark wooden floor
        tiles.floor = this.generateWoodFloor(tileSize);
        // Dark wall
        tiles.wall = this.generateDarkWall(tileSize);
        // Wall with wallpaper (peeling)
        tiles.wallDamaged = this.generateDamagedWall(tileSize);
        // Door
        tiles.door = this.generateDoor(tileSize * 2, tileSize * 3);
        // Window (dark, boarded up)
        tiles.window = this.generateBoardedWindow(tileSize * 2, tileSize * 2);
        // Tatami mat
        tiles.tatami = this.generateTatami(tileSize * 2, tileSize * 2);
        // Hallway floor
        tiles.hallFloor = this.generateHallFloor(tileSize);
        // Ceiling
        tiles.ceiling = this.generateCeiling(tileSize);
        
        this.spriteSheets.environment = tiles;
        return tiles;
    }

    generateWoodFloor(size) {
        const canvas = this.createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Base dark wood
        ctx.fillStyle = '#1a1510';
        ctx.fillRect(0, 0, size, size);
        
        // Wood planks
        const plankHeight = size / 4;
        for (let i = 0; i < 4; i++) {
            const y = i * plankHeight;
            const shade = 15 + Math.random() * 10;
            ctx.fillStyle = `rgb(${shade + 10}, ${shade + 5}, ${shade})`;
            ctx.fillRect(0, y + 1, size, plankHeight - 2);
            
            // Wood grain
            for (let g = 0; g < 5; g++) {
                const gx = Math.random() * size;
                const gy = y + 2 + Math.random() * (plankHeight - 4);
                ctx.fillStyle = `rgba(${shade + 20}, ${shade + 10}, ${shade}, 0.3)`;
                ctx.fillRect(gx, gy, 8 + Math.random() * 15, 1);
            }
            
            // Plank gap
            ctx.fillStyle = '#080605';
            ctx.fillRect(0, y, size, 1);
        }
        
        // Add some dirt/stains
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = `rgba(10, 8, 5, ${0.2 + Math.random() * 0.3})`;
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.fillRect(x, y, 3 + Math.random() * 6, 2 + Math.random() * 4);
        }
        
        return canvas;
    }

    generateDarkWall(size) {
        const canvas = this.createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Base wall color
        ctx.fillStyle = '#1a1a20';
        ctx.fillRect(0, 0, size, size);
        
        // Subtle wallpaper pattern
        for (let y = 0; y < size; y += 8) {
            for (let x = 0; x < size; x += 8) {
                if ((x + y) % 16 === 0) {
                    ctx.fillStyle = 'rgba(25, 25, 35, 0.5)';
                    ctx.fillRect(x, y, 6, 6);
                }
            }
        }
        
        // Stains and aging
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = `rgba(15, 12, 10, ${0.2 + Math.random() * 0.3})`;
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.beginPath();
            ctx.arc(x, y, 2 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Water damage streak
        ctx.fillStyle = 'rgba(20, 18, 15, 0.4)';
        const sx = Math.random() * size;
        ctx.fillRect(sx, 0, 2 + Math.random() * 3, size);
        
        return canvas;
    }

    generateDamagedWall(size) {
        const canvas = this.createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Base wall
        ctx.fillStyle = '#1a1a20';
        ctx.fillRect(0, 0, size, size);
        
        // Peeling wallpaper
        ctx.fillStyle = '#252530';
        ctx.fillRect(0, 0, size * 0.6, size);
        
        // Exposed wall underneath
        ctx.fillStyle = '#2a2520';
        ctx.fillRect(size * 0.6, size * 0.3, size * 0.35, size * 0.5);
        
        // Peel edge
        ctx.fillStyle = '#1a1a25';
        ctx.beginPath();
        ctx.moveTo(size * 0.58, size * 0.2);
        ctx.lineTo(size * 0.65, size * 0.3);
        ctx.lineTo(size * 0.62, size * 0.7);
        ctx.lineTo(size * 0.55, size * 0.8);
        ctx.fill();
        
        // Cracks
        ctx.strokeStyle = '#0a0a0a';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(size * 0.7, 0);
        ctx.lineTo(size * 0.65, size * 0.4);
        ctx.lineTo(size * 0.75, size * 0.7);
        ctx.lineTo(size * 0.7, size);
        ctx.stroke();
        
        return canvas;
    }

    generateDoor(w, h) {
        const canvas = this.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        // Door frame
        ctx.fillStyle = '#0d0a08';
        ctx.fillRect(0, 0, w, h);
        
        // Door panel
        ctx.fillStyle = '#1a1510';
        ctx.fillRect(4, 4, w - 8, h - 4);
        
        // Door panels (inset)
        ctx.fillStyle = '#15120d';
        ctx.fillRect(8, 8, w - 16, h * 0.4);
        ctx.fillRect(8, h * 0.5, w - 16, h * 0.45);
        
        // Handle
        ctx.fillStyle = '#3a3530';
        ctx.fillRect(w - 18, h * 0.5, 6, 12);
        ctx.fillStyle = '#4a4540';
        ctx.fillRect(w - 17, h * 0.5 + 1, 4, 10);
        
        // Keyhole
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(w - 15, h * 0.55, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(w - 16, h * 0.55, 2, 5);
        
        return canvas;
    }

    generateBoardedWindow(w, h) {
        const canvas = this.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        // Window frame
        ctx.fillStyle = '#151210';
        ctx.fillRect(0, 0, w, h);
        
        // Dark glass
        ctx.fillStyle = '#050508';
        ctx.fillRect(4, 4, w - 8, h - 8);
        
        // Moonlight reflection (very subtle)
        ctx.fillStyle = 'rgba(40, 50, 70, 0.1)';
        ctx.fillRect(w * 0.3, 4, w * 0.2, h - 8);
        
        // Boards across window
        ctx.fillStyle = '#1a1510';
        for (let i = 0; i < 3; i++) {
            const by = 8 + i * (h / 3);
            ctx.save();
            ctx.translate(w / 2, by);
            ctx.rotate((Math.random() - 0.5) * 0.05);
            ctx.fillRect(-w / 2 + 2, -4, w - 4, 10);
            ctx.restore();
        }
        
        // Nails
        ctx.fillStyle = '#333';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(8, 8 + i * (h / 3), 2, 2);
            ctx.fillRect(w - 10, 8 + i * (h / 3), 2, 2);
        }
        
        return canvas;
    }

    generateTatami(w, h) {
        const canvas = this.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        // Base tatami color (aged/dark)
        ctx.fillStyle = '#1a1a10';
        ctx.fillRect(0, 0, w, h);
        
        // Tatami weave pattern
        for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 4) {
                ctx.fillStyle = `rgb(${25 + Math.random() * 5}, ${25 + Math.random() * 5}, ${15 + Math.random() * 3})`;
                ctx.fillRect(x, y, 3, 1);
            }
        }
        
        // Border
        ctx.fillStyle = '#0a0a08';
        ctx.fillRect(0, 0, w, 2);
        ctx.fillRect(0, h - 2, w, 2);
        ctx.fillRect(0, 0, 2, h);
        ctx.fillRect(w - 2, 0, 2, h);
        
        // Center band
        ctx.fillStyle = '#15150d';
        ctx.fillRect(w / 2 - 3, 0, 6, h);
        
        return canvas;
    }

    generateHallFloor(size) {
        const canvas = this.createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        // Dark stone/concrete floor
        ctx.fillStyle = '#121215';
        ctx.fillRect(0, 0, size, size);
        
        // Tile pattern
        ctx.fillStyle = '#0a0a0d';
        ctx.fillRect(0, 0, size, 1);
        ctx.fillRect(0, 0, 1, size);
        
        // Variation
        for (let i = 0; i < 5; i++) {
            const shade = Math.random() * 5;
            ctx.fillStyle = `rgba(${15 + shade}, ${15 + shade}, ${18 + shade}, 0.3)`;
            ctx.fillRect(Math.random() * size, Math.random() * size, 4, 4);
        }
        
        return canvas;
    }

    generateCeiling(size) {
        const canvas = this.createCanvas(size, size);
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#0d0d10';
        ctx.fillRect(0, 0, size, size);
        
        // Ceiling panels
        ctx.fillStyle = '#080810';
        ctx.fillRect(0, size / 2 - 1, size, 2);
        ctx.fillRect(size / 2 - 1, 0, 2, size);
        
        return canvas;
    }

    // ========== HORROR ELEMENTS ==========
    
    generateGhostSprite() {
        const w = 64;
        const h = 96;
        const canvas = this.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        // Ghostly figure (very subtle)
        ctx.fillStyle = 'rgba(180, 180, 200, 0.05)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.3, 15, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Body
        ctx.fillStyle = 'rgba(150, 150, 170, 0.03)';
        ctx.fillRect(w / 2 - 12, h * 0.35, 24, 50);
        
        // Wispy bottom
        ctx.fillStyle = 'rgba(120, 120, 150, 0.02)';
        ctx.beginPath();
        ctx.moveTo(w / 2 - 15, h * 0.7);
        ctx.quadraticCurveTo(w / 2 - 5, h * 0.9, w / 2, h);
        ctx.quadraticCurveTo(w / 2 + 5, h * 0.9, w / 2 + 15, h * 0.7);
        ctx.fill();
        
        // Eyes (barely visible)
        ctx.fillStyle = 'rgba(200, 200, 220, 0.08)';
        ctx.fillRect(w / 2 - 8, h * 0.25, 4, 3);
        ctx.fillRect(w / 2 + 4, h * 0.25, 4, 3);
        
        this.spriteSheets.ghost = canvas;
        return canvas;
    }

    generateShadowSprite() {
        const w = 80;
        const h = 120;
        const canvas = this.createCanvas(w, h);
        const ctx = canvas.getContext('2d');
        
        // Dark shadow figure
        const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 50);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // Humanoid shape
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h * 0.15, 10, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(w / 2 - 8, h * 0.2, 16, 50);
        
        // Wispy edges
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + Math.random() * 0.2})`;
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 20;
            ctx.beginPath();
            ctx.arc(
                w / 2 + Math.cos(angle) * dist,
                h * 0.4 + Math.sin(angle) * dist,
                3 + Math.random() * 5,
                0, Math.PI * 2
            );
            ctx.fill();
        }
        
        this.spriteSheets.shadow = canvas;
        return canvas;
    }

    // ========== UTILITY ==========
    
    drawPixelRect(ctx, x, y, w, h, color) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    }

    // Pre-generate all sprites
    async generateAll(onProgress) {
        const steps = [
            ['キャラクター生成中...', () => this.generateCharacterSheet()],
            ['立ち絵生成中...', () => {
                this.generatePortrait('neutral');
                this.generatePortrait('fear');
                this.generatePortrait('sad');
            }],
            ['環境タイル生成中...', () => this.generateEnvironmentTiles()],
            ['ゴースト生成中...', () => this.generateGhostSprite()],
            ['シャドウ生成中...', () => this.generateShadowSprite()],
        ];

        for (let i = 0; i < steps.length; i++) {
            if (onProgress) onProgress(steps[i][0], (i + 1) / steps.length);
            steps[i][1]();
            // Yield to event loop
            await new Promise(r => setTimeout(r, 50));
        }

        return this.spriteSheets;
    }
}

const spriteGen = new SpriteGenerator();
