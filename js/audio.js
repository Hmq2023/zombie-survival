// audio.js - 音效系统（Web Audio API 程序化生成）
const Audio = {
    ctx: null,
    masterGain: null,
    initialized: false,
    muted: false,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.ctx.destination);
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    },

    // 确保AudioContext已激活（需要用户交互后才能播放）
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // ========== 枪声 ==========
    playGunshot(weaponType) {
        if (!this.initialized || this.muted) return;
        this.resume();

        switch (weaponType) {
            case 'pistol': this.playPistolShot(); break;
            case 'rifle': this.playRifleShot(); break;
            case 'shotgun': this.playShotgunShot(); break;
            case 'smg': this.playSMGShot(); break;
            case 'sniper': this.playSniperShot(); break;
        }
    },

    playPistolShot() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // 爆发音（短促的噪声）
        const noise = this.createNoise(0.08);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        noise.connect(noiseGain).connect(this.masterGain);

        // 低频脉冲
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.1);
    },

    playRifleShot() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const noise = this.createNoise(0.12);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        noise.connect(noiseGain).connect(this.masterGain);

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.25, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
    },

    playShotgunShot() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // 重型爆发
        const noise = this.createNoise(0.2);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.7, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        noise.connect(noiseGain).connect(this.masterGain);

        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.4, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.25);
    },

    playSMGShot() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const noise = this.createNoise(0.05);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        noise.connect(noiseGain).connect(this.masterGain);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.2, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.06);
    },

    playSniperShot() {
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // 重低音 + 回响
        const noise = this.createNoise(0.3);
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        noise.connect(noiseGain).connect(this.masterGain);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.4);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.4);
    },

    // ========== 换弹音效 ==========
    playReload() {
        if (!this.initialized || this.muted) return;
        this.resume();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // 金属碰撞声
        const noise = this.createNoise(0.15);
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 3000;
        bandpass.Q.value = 2;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(bandpass).connect(gain).connect(this.masterGain);

        // 卡嗒声
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now + 0.1);
        osc.frequency.setValueAtTime(1200, now + 0.12);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.15, now + 0.1);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(oscGain).connect(this.masterGain);
        osc.start(now + 0.1);
        osc.stop(now + 0.15);
    },

    // ========== 脚步声 ==========
    footstepTimer: 0,
    playFootstep(speed) {
        if (!this.initialized || this.muted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const interval = speed > 5 ? 0.25 : 0.4;

        if (now - this.footstepTimer < interval) return;
        this.footstepTimer = now;

        // 脚步声（轻柔的噪声）
        const noise = this.createNoise(0.06);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800 + Math.random() * 400;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08 + Math.random() * 0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        noise.connect(filter).connect(gain).connect(this.masterGain);
    },

    // ========== 丧尸音效 ==========
    playZombieGrowl() {
        if (!this.initialized || this.muted) return;
        this.resume();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80 + Math.random() * 40, now);
        osc.frequency.linearRampToValueAtTime(60 + Math.random() * 30, now + 0.4);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.4);
    },

    // ========== 受伤音效 ==========
    playHurt() {
        if (!this.initialized || this.muted) return;
        this.resume();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const noise = this.createNoise(0.15);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 3;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        noise.connect(filter).connect(gain).connect(this.masterGain);
    },

    // ========== 拾取音效 ==========
    playPickup() {
        if (!this.initialized || this.muted) return;
        this.resume();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(900, now + 0.1);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain).connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.15);
    },

    // ========== 击杀音效 ==========
    playKill() {
        if (!this.initialized || this.muted) return;
        this.resume();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // 击杀确认音
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(800, now);
        osc1.frequency.setValueAtTime(1000, now + 0.05);
        const gain1 = ctx.createGain();
        gain1.gain.setValueAtTime(0.2, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1).connect(this.masterGain);
        osc1.start(now);
        osc1.stop(now + 0.15);
    },

    // ========== 环境音 ==========
    ambientSource: null,
    playAmbient() {
        if (!this.initialized || this.muted) return;
        this.resume();
        // 低频环境嗡嗡声
        const ctx = this.ctx;
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 40;
        const gain = ctx.createGain();
        gain.gain.value = 0.02;
        osc.connect(gain).connect(this.masterGain);
        osc.start();
        this.ambientSource = { osc, gain };
    },

    stopAmbient() {
        if (this.ambientSource) {
            this.ambientSource.osc.stop();
            this.ambientSource = null;
        }
    },

    // ========== 工具方法 ==========
    createNoise(duration) {
        const ctx = this.ctx;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.start();
        return source;
    },

    // 静音切换
    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : 0.5;
        }
    },

    reset() {
        this.stopAmbient();
        this.footstepTimer = 0;
    }
};
