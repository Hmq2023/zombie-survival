// survival.js - 生存系统（血量、饥饿、治疗）
const Survival = {
    hp: 100,
    maxHp: 100,
    hunger: 100,
    maxHunger: 100,

    // 饥饿掉血阈值
    hungerWarningThreshold: 30,
    hungerDamageRate: 2,      // 每秒掉血（饥饿<30）
    starvationDamageRate: 5,  // 每秒掉血（饥饿=0）
    hungerDecayRate: 0.1,     // 饥饿值每秒下降

    // 物品栏
    medkits: 0,
    foods: 0,

    // 治疗效果
    medkitHeal: 30,
    foodRestore: 25,

    // 治疗冷却
    useCooldown: 0,

    init() {
        this.hp = this.maxHp;
        this.hunger = this.maxHunger;
        this.medkits = 0;
        this.foods = 0;
        this.useCooldown = 0;
    },

    update(dt) {
        // 饥饿值持续下降
        this.hunger = Math.max(0, this.hunger - this.hungerDecayRate * dt);

        // 饥饿掉血
        if (this.hunger <= 0) {
            this.takeDamage(this.starvationDamageRate * dt, 'starvation');
        } else if (this.hunger < this.hungerWarningThreshold) {
            this.takeDamage(this.hungerDamageRate * dt, 'hunger');
        }

        // 使用冷却
        this.useCooldown = Math.max(0, this.useCooldown - dt);

        // 更新HUD
        this.updateHUD();
    },

    // 受到伤害
    takeDamage(amount, source = 'unknown') {
        if (!Player.isAlive) return;

        this.hp = Math.max(0, this.hp - amount);

        if (source !== 'hunger' && source !== 'starvation') {
            Combat.showDamageOverlay();
            // 屏幕特效
            if (typeof Effects !== 'undefined') {
                Effects.triggerDamageFlash(Math.min(1, amount / 30));
                Effects.triggerScreenShake(Math.min(0.5, amount / 40));
            }
        }

        if (this.hp <= 0) {
            this.die();
        }
    },

    // 死亡
    die() {
        this.hp = 0;
        Player.die();
        Game.onPlayerDeath();
    },

    // 使用医疗包
    useMedkit() {
        if (this.useCooldown > 0) return false;
        if (this.medkits <= 0) return false;
        if (this.hp >= this.maxHp) return false;

        this.medkits--;
        this.hp = Math.min(this.maxHp, this.hp + this.medkitHeal);
        this.useCooldown = 1.0;
        return true;
    },

    // 使用食物
    useFood() {
        if (this.useCooldown > 0) return false;
        if (this.foods <= 0) return false;
        if (this.hunger >= this.maxHunger) return false;

        this.foods--;
        this.hunger = Math.min(this.maxHunger, this.hunger + this.foodRestore);
        this.useCooldown = 1.0;
        return true;
    },

    // 添加医疗包
    addMedkit(count) {
        this.medkits += count;
    },

    // 添加食物
    addFood(count) {
        this.foods += count;
    },

    // 更新HUD显示
    updateHUD() {
        const hpBar = document.getElementById('hp-bar');
        const hpText = document.getElementById('hp-text');
        const hungerBar = document.getElementById('hunger-bar');
        const hungerText = document.getElementById('hunger-text');
        const medkitCount = document.getElementById('medkit-count');
        const foodCount = document.getElementById('food-count');

        if (hpBar) hpBar.style.width = (this.hp / this.maxHp * 100) + '%';
        if (hpText) hpText.textContent = Math.ceil(this.hp);
        if (hungerBar) hungerBar.style.width = (this.hunger / this.maxHunger * 100) + '%';
        if (hungerText) hungerText.textContent = Math.ceil(this.hunger);
        if (medkitCount) medkitCount.textContent = `医疗包: ${this.medkits}`;
        if (foodCount) foodCount.textContent = `食物: ${this.foods}`;

        // 饥饿警告颜色
        if (hungerBar) {
            if (this.hunger < this.hungerWarningThreshold) {
                hungerBar.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
            } else {
                hungerBar.style.background = 'linear-gradient(90deg, #ff8800, #ffaa00)';
            }
        }

        // 低血量警告
        if (hpBar) {
            if (this.hp < 30) {
                hpBar.style.background = 'linear-gradient(90deg, #ff0000, #ff2222)';
            } else {
                hpBar.style.background = 'linear-gradient(90deg, #ff0000, #ff4444)';
            }
        }
    },

    reset() {
        this.hp = this.maxHp;
        this.hunger = this.maxHunger;
        this.medkits = 0;
        this.foods = 0;
        this.useCooldown = 0;
    }
};
