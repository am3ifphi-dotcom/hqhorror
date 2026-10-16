/**
 * Audio System - Horror atmosphere and sound effects
 * Uses Web Audio API for procedural sound generation
 */
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.ambientNodes = [];
        this.initialized = false;
        this.sfxBuffers = {};
        this.bgmGain = null;
        this.sfxGain = null;
        this.ambientGain = null;
    }

    async init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.ctx.destination);

            // Create gain nodes for different channels
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = 0.3;
            this.bgmGain.connect(this.masterGain);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.value = 0.6;
            this.sfxGain.connect(this.masterGain);

            this.ambientGain = this.ctx.createGain();
            this.ambientGain.gain.value = 0.25;
            this.ambientGain.connect(this.masterGain);

            // Reverb for atmosphere
            this.reverbNode = this.ctx.createConvolver();
            this.reverbGain = this.ctx.createGain();
            this.reverbGain.gain.value = 0.3;
            await this.createReverb();
            this.reverbNode.connect(this.reverbGain);
            this.reverbGain.connect(this.masterGain);

            this.initialized = true;
        } catch (e) {
            console.warn('Audio initialization failed:', e);
        }
    }

    async createReverb() {
        const rate = this.ctx.sampleRate;
        const length = rate * 3;
        const impulse = this.ctx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
            }
        }
        this.reverbNode.buffer = impulse;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Generate procedural horror ambient drone
    playAmbientDrone() {
        if (!this.initialized) return;

        // Deep bass drone
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 40;
        const gain1 = this.ctx.createGain();
        gain1.gain.value = 0.15;
        
        // LFO for subtle movement
        const lfo1 = this.ctx.createOscillator();
        lfo1.type = 'sine';
        lfo1.frequency.value = 0.1;
        const lfoGain1 = this.ctx.createGain();
        lfoGain1.gain.value = 5;
        lfo1.connect(lfoGain1);
        lfoGain1.connect(osc1.frequency);
        
        osc1.connect(gain1);
        gain1.connect(this.ambientGain);
        gain1.connect(this.reverbNode);
        osc1.start();
        lfo1.start();

        // Creepy high-frequency whine
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 3200;
        const gain2 = this.ctx.createGain();
        gain2.gain.value = 0.02;
        
        const lfo2 = this.ctx.createOscillator();
        lfo2.type = 'sine';
        lfo2.frequency.value = 0.05;
        const lfoGain2 = this.ctx.createGain();
        lfoGain2.gain.value = 200;
        lfo2.connect(lfoGain2);
        lfoGain2.connect(osc2.frequency);
        
        osc2.connect(gain2);
        gain2.connect(this.ambientGain);
        gain2.connect(this.reverbNode);
        osc2.start();
        lfo2.start();

        // Wind-like noise
        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = (Math.random() * 2 - 1);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuffer;
        noise.loop = true;
        
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 400;
        noiseFilter.Q.value = 0.5;
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.08;
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ambientGain);
        noiseGain.connect(this.reverbNode);
        noise.start();

        // Modulate wind
        const windLfo = this.ctx.createOscillator();
        windLfo.type = 'sine';
        windLfo.frequency.value = 0.07;
        const windLfoGain = this.ctx.createGain();
        windLfoGain.gain.value = 300;
        windLfo.connect(windLfoGain);
        windLfoGain.connect(noiseFilter.frequency);
        windLfo.start();

        this.ambientNodes = [
            { osc: osc1, gain: gain1, lfo: lfo1 },
            { osc: osc2, gain: gain2, lfo: lfo2 },
            { noise, noiseGain, windLfo }
        ];
    }

    // Play random creaking sounds
    scheduleCreaks() {
        if (!this.initialized) return;
        
        const playCreak = () => {
            this.playCreakSound();
            const nextTime = 5000 + Math.random() * 15000;
            setTimeout(playCreak, nextTime);
        };
        setTimeout(playCreak, 3000 + Math.random() * 5000);
    }

    playCreakSound() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80 + Math.random() * 60, now);
        osc.frequency.exponentialRampToValueAtTime(
            40 + Math.random() * 30, now + 0.3 + Math.random() * 0.4
        );
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 200 + Math.random() * 300;
        filter.Q.value = 8 + Math.random() * 10;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06 + Math.random() * 0.04, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + Math.random() * 0.5);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        gain.connect(this.reverbNode);
        
        osc.start(now);
        osc.stop(now + 1.2);
    }

    // Footstep sound
    playFootstep() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        
        // Generate noise burst for footstep
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
        }
        
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300 + Math.random() * 200;
        filter.Q.value = 1;
        
        const gain = this.ctx.createGain();
        gain.gain.value = 0.15 + Math.random() * 0.05;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        gain.connect(this.reverbNode);
        source.start(now);
    }

    // Heartbeat sound
    playHeartbeat(intensity = 1) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        
        const beat = (time, vol) => {
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(60, time);
            osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
            
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(vol * 0.3 * intensity, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
            
            osc.connect(gain);
            gain.connect(this.sfxGain);
            gain.connect(this.reverbNode);
            osc.start(time);
            osc.stop(time + 0.25);
        };
        
        beat(now, 1);
        beat(now + 0.25, 0.7);
    }

    // Horror sting / jump scare sound
    playHorrorSting() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        
        // Dissonant chord
        const freqs = [110, 117, 156, 233, 311];
        freqs.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
            osc.frequency.value = freq;
            
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
            gain.gain.setValueAtTime(0.08, now + 0.8);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 2000;
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);
            gain.connect(this.reverbNode);
            osc.start(now);
            osc.stop(now + 3);
        });

        // Noise burst
        const bufferSize = this.ctx.sampleRate * 0.5;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.value = 0.15;
        noise.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(now);
    }

    // Whisper sound
    playWhisper() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const env = Math.sin(Math.PI * i / bufferSize);
            data[i] = (Math.random() * 2 - 1) * env * 0.3;
        }
        
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        
        const filter1 = this.ctx.createBiquadFilter();
        filter1.type = 'bandpass';
        filter1.frequency.value = 800 + Math.random() * 400;
        filter1.Q.value = 3;
        
        const filter2 = this.ctx.createBiquadFilter();
        filter2.type = 'highpass';
        filter2.frequency.value = 500;
        
        const gain = this.ctx.createGain();
        gain.gain.value = 0.12;
        
        // Panning
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = Math.random() * 2 - 1;
        
        source.connect(filter1);
        filter1.connect(filter2);
        filter2.connect(gain);
        gain.connect(panner);
        panner.connect(this.sfxGain);
        panner.connect(this.reverbNode);
        source.start(now);
    }

    // Door sound
    playDoorSound() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        
        // Low thud
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        gain.connect(this.reverbNode);
        osc.start(now);
        osc.stop(now + 0.6);
        
        // Creak after
        setTimeout(() => this.playCreakSound(), 200);
    }

    // Breathing sound
    playBreathing(fearLevel = 0) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        
        const duration = 2 + (1 - fearLevel) * 1;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.ctx.sampleRate;
            const breathCycle = Math.sin(2 * Math.PI * t / duration);
            const noise = (Math.random() * 2 - 1);
            data[i] = noise * Math.max(0, breathCycle) * 0.2;
        }
        
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 600 + fearLevel * 400;
        filter.Q.value = 2;
        
        const gain = this.ctx.createGain();
        gain.gain.value = 0.08 + fearLevel * 0.1;
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        gain.connect(this.reverbNode);
        source.start(now);
    }

    // UI click
    playUIClick() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 800;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    setMasterVolume(v) {
        if (this.masterGain) this.masterGain.gain.value = v;
    }

    setAmbientVolume(v) {
        if (this.ambientGain) this.ambientGain.gain.value = v;
    }
}

// Global audio instance
const audio = new AudioSystem();
