/**
 * Visual Effects System
 * Post-processing, particles, lighting, and atmospheric effects
 */
class EffectsSystem {
    constructor() {
        this.particles = [];
        this.fogParticles = [];
        this.dustParticles = [];
        this.lightSources = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };
        this.filmGrainIntensity = 0.06;
        this.vignetteIntensity = 0.7;
        this.chromaticAberration = 0;
        this.distortion = 0;
        this.distortionDecay = 0.95;
        this.flashOpacity = 0;
        this.time = 0;
        this.ambientFlicker = 0;
        this.noiseCanvas = null;
        this.darknessCanvas = null;
        this.darknessCtx = null;
        this.spriteSheets_ghost = null;
        this.bloodDrips = [];
    }

    init(w, h) {
        this.width = w;
        this.height = h;
        this.initNoise();
        this.initFog();
        this.initDust();
        
        // Separate canvas for darkness overlay
        this.darknessCanvas = document.createElement('canvas');
        this.darknessCanvas.width = w;
        this.darknessCanvas.height = h;
        this.darknessCtx = this.darknessCanvas.getContext('2d');
    }

    initNoise() {
        this.noiseCanvas = document.createElement('canvas');
        this.noiseCanvas.width = 256;
        this.noiseCanvas.height = 256;
        this.updateNoise();
    }

    updateNoise() {
        const ctx = this.noiseCanvas.getContext('2d');
        const imageData = ctx.createImageData(256, 256);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const v = Math.random() * 255;
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = 255;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    initFog() {
        for (let i = 0; i < 25; i++) {
            this.fogParticles.push({
                x: Math.random() * (this.width || 800),
                y: Math.random() * (this.height || 450),
                size: 100 + Math.random() * 250,
                speed: 0.15 + Math.random() * 0.4,
                opacity: 0.015 + Math.random() * 0.03,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    initDust() {
        for (let i = 0; i < 40; i++) {
            this.dustParticles.push({
                x: Math.random() * (this.width || 800),
                y: Math.random() * (this.height || 450),
                size: 1 + Math.random() * 2,
                speedX: (Math.random() - 0.5) * 0.2,
                speedY: -0.05 - Math.random() * 0.15,
                opacity: 0.1 + Math.random() * 0.2,
                phase: Math.random() * Math.PI * 2,
                life: Math.random()
            });
        }
    }

    addFlash(intensity = 1) {
        this.flashOpacity = intensity;
    }

    triggerScreenShake(intensity = 5) {
        this.screenShake.intensity = intensity;
    }

    triggerDistortion(intensity = 1) {
        this.distortion = intensity;
    }

    addBloodDrip(x, y) {
        this.bloodDrips.push({
            x, y, speed: 0.5 + Math.random() * 1.5,
            length: 3 + Math.random() * 8,
            life: 1
        });
    }

    update(dt) {
        this.time += dt;

        // Update fog
        for (const p of this.fogParticles) {
            p.x += p.speed;
            p.y += Math.sin(this.time * 0.3 + p.phase) * 0.15;
            if (p.x > this.width + p.size) {
                p.x = -p.size;
                p.y = Math.random() * this.height;
            }
        }

        // Update dust
        for (const p of this.dustParticles) {
            p.x += p.speedX + Math.sin(this.time + p.phase) * 0.1;
            p.y += p.speedY;
            if (p.y < -10) {
                p.x = Math.random() * this.width;
                p.y = this.height + 10;
                p.speedX = (Math.random() - 0.5) * 0.2;
                p.speedY = -0.05 - Math.random() * 0.15;
            }
        }

        // Update blood drips
        for (let i = this.bloodDrips.length - 1; i >= 0; i--) {
            const d = this.bloodDrips[i];
            d.y += d.speed;
            d.life -= 0.005;
            if (d.life <= 0 || d.y > this.height) {
                this.bloodDrips.splice(i, 1);
            }
        }

        // Update screen shake
        if (this.screenShake.intensity > 0.1) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * 2;
            this.screenShake.intensity *= this.screenShake.decay;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }

        // Decay distortion
        if (this.distortion > 0.01) {
            this.distortion *= this.distortionDecay;
        } else {
            this.distortion = 0;
        }

        // Flash decay
        if (this.flashOpacity > 0) {
            this.flashOpacity *= 0.88;
            if (this.flashOpacity < 0.01) this.flashOpacity = 0;
        }

        // Ambient flicker
        this.ambientFlicker = Math.sin(this.time * 3) * 0.015 +
                              Math.sin(this.time * 7.3) * 0.008 +
                              (Math.random() > 0.995 ? -0.08 : 0);

        // Update noise periodically
        if (Math.floor(this.time * 8) % 3 === 0) {
            this.updateNoise();
        }
    }

    // ========== FOG & DUST ==========

    drawFog(ctx, cameraX = 0) {
        ctx.save();
        for (const p of this.fogParticles) {
            const px = p.x - cameraX * 0.2;
            const gradient = ctx.createRadialGradient(px, p.y, 0, px, p.y, p.size);
            const flicker = 1 + Math.sin(this.time * 0.7 + p.phase) * 0.3;
            gradient.addColorStop(0, `rgba(60, 65, 80, ${p.opacity * flicker})`);
            gradient.addColorStop(0.5, `rgba(40, 45, 60, ${p.opacity * 0.4 * flicker})`);
            gradient.addColorStop(1, 'rgba(20, 25, 40, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(px - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
        ctx.restore();
    }

    drawDust(ctx, cameraX = 0) {
        ctx.save();
        for (const p of this.dustParticles) {
            const px = p.x - cameraX * 0.4;
            const alpha = p.opacity * (0.5 + Math.sin(this.time * 1.5 + p.phase) * 0.5);
            ctx.fillStyle = `rgba(180, 180, 190, ${alpha})`;
            ctx.beginPath();
            ctx.arc(px, p.y, p.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawBloodDrips(ctx) {
        ctx.save();
        for (const d of this.bloodDrips) {
            ctx.fillStyle = `rgba(100, 10, 10, ${d.life * 0.6})`;
            ctx.fillRect(d.x, d.y, 2, d.length);
        }
        ctx.restore();
    }

    // ========== DARKNESS / FLASHLIGHT ==========

    drawDarknessOverlay(playerScreenX, playerScreenY, lightRadius, lightAngle) {
        const dCtx = this.darknessCtx;
        const w = this.width;
        const h = this.height;

        // Clear darkness canvas
        dCtx.clearRect(0, 0, w, h);

        // Fill with darkness
        const darkness = 0.88 + this.ambientFlicker;
        dCtx.fillStyle = `rgba(0, 0, 0, ${Math.min(0.95, darkness)})`;
        dCtx.fillRect(0, 0, w, h);

        // Cut out flashlight area
        dCtx.save();
        dCtx.globalCompositeOperation = 'destination-out';

        const flicker = 1 + this.ambientFlicker * 3;
        const radius = lightRadius * flicker;
        const coneAngle = 0.5;

        // Flashlight cone
        dCtx.beginPath();
        dCtx.moveTo(playerScreenX, playerScreenY);
        dCtx.arc(playerScreenX, playerScreenY, radius, lightAngle - coneAngle, lightAngle + coneAngle);
        dCtx.closePath();

        const coneGrad = dCtx.createRadialGradient(
            playerScreenX, playerScreenY, 0,
            playerScreenX, playerScreenY, radius
        );
        coneGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        coneGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.7)');
        coneGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.3)');
        coneGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        dCtx.fillStyle = coneGrad;
        dCtx.fill();

        // Small ambient light around player
        const ambientGrad = dCtx.createRadialGradient(
            playerScreenX, playerScreenY, 0,
            playerScreenX, playerScreenY, 50
        );
        ambientGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        dCtx.fillStyle = ambientGrad;
        dCtx.beginPath();
        dCtx.arc(playerScreenX, playerScreenY, 50, 0, Math.PI * 2);
        dCtx.fill();

        dCtx.restore();

        // Add warm tint to flashlight area
        dCtx.save();
        dCtx.globalCompositeOperation = 'source-atop';
        const warmGrad = dCtx.createRadialGradient(
            playerScreenX, playerScreenY, 0,
            playerScreenX, playerScreenY, radius * 0.8
        );
        warmGrad.addColorStop(0, 'rgba(255, 240, 200, 0.05)');
        warmGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        dCtx.fillStyle = warmGrad;
        dCtx.fillRect(0, 0, w, h);
        dCtx.restore();
    }

    // ========== POST-PROCESSING ==========

    drawFilmGrain(ctx) {
        if (!this.noiseCanvas) return;
        ctx.save();
        ctx.globalAlpha = this.filmGrainIntensity;
        ctx.globalCompositeOperation = 'overlay';
        const ox = (Math.random() * 128) | 0;
        const oy = (Math.random() * 128) | 0;
        for (let y = -256; y < this.height + 256; y += 256) {
            for (let x = -256; x < this.width + 256; x += 256) {
                ctx.drawImage(this.noiseCanvas, x + ox, y + oy);
            }
        }
        ctx.restore();
    }

    drawVignette(ctx) {
        ctx.save();
        const cx = this.width / 2;
        const cy = this.height / 2;
        const radius = Math.max(this.width, this.height) * 0.65;

        const gradient = ctx.createRadialGradient(cx, cy, radius * 0.25, cx, cy, radius);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.4, `rgba(0, 0, 0, ${this.vignetteIntensity * 0.2})`);
        gradient.addColorStop(0.7, `rgba(0, 0, 0, ${this.vignetteIntensity * 0.5})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteIntensity})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    drawScanlines(ctx) {
        ctx.save();
        ctx.globalAlpha = 0.025;
        ctx.fillStyle = '#000';
        for (let y = 0; y < this.height; y += 3) {
            ctx.fillRect(0, y, this.width, 1);
        }
        ctx.restore();
    }

    drawFlash(ctx) {
        if (this.flashOpacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.flashOpacity;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    applyColorGrade(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        // Cold blue-ish horror tone
        ctx.fillStyle = 'rgb(210, 220, 240)';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();

        // Additional darken
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = 'rgba(200, 210, 230, 0.3)';
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    // Full post-processing pipeline
    applyPostProcessing(ctx, cameraX, playerScreenX, playerScreenY, lightRadius, lightAngle) {
        // 1. Draw fog (behind darkness)
        this.drawFog(ctx, cameraX);

        // 2. Draw dust
        this.drawDust(ctx, cameraX);

        // 3. Draw blood drips
        this.drawBloodDrips(ctx);

        // 4. Create and draw darkness overlay with flashlight
        this.drawDarknessOverlay(playerScreenX, playerScreenY, lightRadius, lightAngle);
        ctx.drawImage(this.darknessCanvas, 0, 0);

        // 5. Color grading
        this.applyColorGrade(ctx);

        // 6. Film grain
        this.drawFilmGrain(ctx);

        // 7. Vignette
        this.drawVignette(ctx);

        // 8. Scanlines
        this.drawScanlines(ctx);

        // 9. Screen flash
        this.drawFlash(ctx);
    }

    // Draw ghost entity
    drawGhostEntity(ctx, x, y, opacity = 0.3, scale = 1) {
        ctx.save();
        const breathe = Math.sin(this.time * 1.5) * 3;
        ctx.globalAlpha = opacity * (0.4 + Math.sin(this.time * 2) * 0.3);
        const wobble = Math.sin(this.time * 2) * 4;
        if (this.spriteSheets_ghost) {
            ctx.drawImage(
                this.spriteSheets_ghost,
                x - 32 * scale + wobble, y - 48 * scale + breathe,
                64 * scale, 96 * scale
            );
        }
        // Extra ghostly glow
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 50 * scale);
        glow.addColorStop(0, `rgba(150, 150, 180, ${opacity * 0.1})`);
        glow.addColorStop(1, 'rgba(150, 150, 180, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 50 * scale, y - 50 * scale, 100 * scale, 100 * scale);
        ctx.restore();
    }

    drawShadowEntity(ctx, x, y, opacity = 0.5, scale = 1) {
        ctx.save();
        const stretch = 1 + Math.sin(this.time * 1.5) * 0.1;
        const sway = Math.sin(this.time * 0.8) * 5;
        ctx.globalAlpha = opacity * (0.6 + Math.sin(this.time * 3) * 0.2);
        if (spriteGen.spriteSheets.shadow) {
            ctx.drawImage(
                spriteGen.spriteSheets.shadow,
                x - 40 * scale + sway, y - 60 * scale,
                80 * scale, 120 * scale * stretch
            );
        }
        ctx.restore();
    }
}

const effects = new EffectsSystem();
