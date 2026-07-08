// effects.js - 屏幕特效系统（FPS级别视觉反馈）
const Effects = {
    // DOM元素
    vignetteEl: null,
    healthPulseEl: null,
    rainOverlayEl: null,
    hitMarkerEl: null,

    // 状态
    damageFlashIntensity: 0,
    healthPulseIntensity: 0,
    hitMarkerTimer: 0,
    killStreakTimer: 0,
    killStreakCount: 0,

    // 屏幕震动
    shakeIntensity: 0,
    shakeDecay: 5,

    init() {
        this.createElements();
    },

    createElements() {
        // 暗角效果
        this.vignetteEl = document.getElementById('vignette');

        // 低血量脉冲
        this.healthPulseEl = document.getElementById('health-pulse');

        // 雨天遮罩
        this.rainOverlayEl = document.getElementById('rain-overlay');

        // 命中标记
        this.hitMarkerEl = document.getElementById('hit-marker');
    },

    update(dt) {
        this.updateDamageFlash(dt);
        this.updateHealthPulse(dt);
        this.updateRainOverlay(dt);
        this.updateHitMarker(dt);
        this.updateScreenShake(dt);
    },

    // ========== 受伤闪红 ==========
    triggerDamageFlash(intensity) {
        this.damageFlashIntensity = Math.min(1, intensity);
    },

    updateDamageFlash(dt) {
        if (this.damageFlashIntensity > 0) {
            this.damageFlashIntensity = Math.max(0, this.damageFlashIntensity - dt * 3);
            if (this.vignetteEl) {
                const alpha = this.damageFlashIntensity * 0.6;
                this.vignetteEl.style.boxShadow = `inset 0 0 80px rgba(255, 0, 0, ${alpha})`;
                this.vignetteEl.style.opacity = '1';
            }
        } else if (this.vignetteEl) {
            // 恢复正常暗角
            this.vignetteEl.style.boxShadow = 'inset 0 0 120px rgba(0, 0, 0, 0.5)';
            this.vignetteEl.style.opacity = '1';
        }
    },

    // ========== 低血量脉冲 ==========
    updateHealthPulse(dt) {
        if (!this.healthPulseEl) return;

        const hp = Survival.hp;
        const maxHp = Survival.maxHp;
        const ratio = hp / maxHp;

        if (ratio < 0.3) {
            // 低血量：红色脉冲
            const pulse = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
            const intensity = (0.3 - ratio) / 0.3;
            const alpha = pulse * intensity * 0.3;
            this.healthPulseEl.style.background = `radial-gradient(ellipse at center, transparent 40%, rgba(180, 0, 0, ${alpha}) 100%)`;
            this.healthPulseEl.style.opacity = '1';
        } else if (ratio < 0.6) {
            // 中等血量：轻微红色
            const alpha = (0.6 - ratio) / 0.3 * 0.08;
            this.healthPulseEl.style.background = `radial-gradient(ellipse at center, transparent 50%, rgba(150, 50, 0, ${alpha}) 100%)`;
            this.healthPulseEl.style.opacity = '1';
        } else {
            this.healthPulseEl.style.opacity = '0';
        }
    },

    // ========== 雨天屏幕水滴 ==========
    updateRainOverlay(dt) {
        if (!this.rainOverlayEl) return;
        const isRainy = Weather.weather === 'rainy';
        this.rainOverlayEl.style.opacity = isRainy ? '1' : '0';
    },

    // ========== 命中标记 ==========
    showHitMarker(isKill, isHeadshot) {
        this.hitMarkerTimer = 0.3;
        if (this.hitMarkerEl) {
            this.hitMarkerEl.style.opacity = '1';
            if (isHeadshot) {
                this.hitMarkerEl.innerHTML = '✕';
                this.hitMarkerEl.style.color = '#ff0';
                this.hitMarkerEl.style.fontSize = '32px';
            } else if (isKill) {
                this.hitMarkerEl.innerHTML = '✕';
                this.hitMarkerEl.style.color = '#f44';
                this.hitMarkerEl.style.fontSize = '28px';
            } else {
                this.hitMarkerEl.innerHTML = '✕';
                this.hitMarkerEl.style.color = '#fff';
                this.hitMarkerEl.style.fontSize = '24px';
            }
        }

        // 连杀计数
        if (isKill) {
            const now = Date.now();
            if (now - this.killStreakTimer < 3000) {
                this.killStreakCount++;
            } else {
                this.killStreakCount = 1;
            }
            this.killStreakTimer = now;
        }
    },

    updateHitMarker(dt) {
        if (this.hitMarkerTimer > 0) {
            this.hitMarkerTimer -= dt;
            if (this.hitMarkerTimer <= 0) {
                if (this.hitMarkerEl) {
                    this.hitMarkerEl.style.opacity = '0';
                }
            }
        }

        // 连杀提示超时
        if (Date.now() - this.killStreakTimer > 3000) {
            this.killStreakCount = 0;
        }
    },

    // ========== 屏幕震动 ==========
    triggerScreenShake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    },

    updateScreenShake(dt) {
        if (this.shakeIntensity > 0.01) {
            const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 10;
            const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 10;
            document.body.style.transform = `translate(${shakeX}px, ${shakeY}px)`;
            this.shakeIntensity *= Math.pow(0.01, dt); // 快速衰减
        } else {
            this.shakeIntensity = 0;
            document.body.style.transform = '';
        }
    },

    // ========== 武器后坐力视觉 ==========
    triggerRecoil(intensity) {
        // 轻微屏幕震动模拟后坐力
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity * 0.3);
    },

    // 重置
    reset() {
        this.damageFlashIntensity = 0;
        this.healthPulseIntensity = 0;
        this.hitMarkerTimer = 0;
        this.killStreakCount = 0;
        this.shakeIntensity = 0;
        if (this.vignetteEl) this.vignetteEl.style.boxShadow = 'inset 0 0 120px rgba(0, 0, 0, 0.5)';
        if (this.healthPulseEl) this.healthPulseEl.style.opacity = '0';
        if (this.rainOverlayEl) this.rainOverlayEl.style.opacity = '0';
        if (this.hitMarkerEl) this.hitMarkerEl.style.opacity = '0';
        document.body.style.transform = '';
    }
};
