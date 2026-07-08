// combat.js - 战斗与伤害计算系统
const Combat = {
    killCount: 0,
    totalDamageDealt: 0,
    headshotCount: 0,

    init() {
        this.killCount = 0;
        this.totalDamageDealt = 0;
        this.headshotCount = 0;
    },

    // 处理射击结果
    processShot(shotResult) {
        if (!shotResult) return;

        if (shotResult.type === 'shotgun') {
            // 霰弹枪多弹丸
            for (const hit of shotResult.hits) {
                this.processHit(hit, shotResult.def);
            }
        } else if (shotResult.type === 'single' && shotResult.hit) {
            this.processHit(shotResult.hit, shotResult.def);
        }
    },

    // 处理单次命中
    processHit(hit, weaponDef) {
        if (!hit) return;

        const zombie = hit.zombie;
        const hitPoint = hit.point;
        const zombiePos = zombie.mesh.position;

        // 判断命中部位
        const relY = hitPoint.y - zombiePos.y;
        let bodyPart = 'body';
        let bodyMult = 1.0;

        if (relY > 1.5) {
            // 头部
            bodyPart = 'head';
            bodyMult = weaponDef.headMult;
            this.headshotCount++;
        } else if (relY < 0.5) {
            // 腿部
            bodyPart = 'leg';
            bodyMult = 0.6;
        }

        // 暴击检测
        const isCrit = Math.random() < weaponDef.critChance;
        const critMult = isCrit ? weaponDef.critMult : 1.0;

        // 最终伤害 = 武器伤害 × 部位系数 × 暴击系数
        const finalDamage = Math.floor(weaponDef.damage * bodyMult * critMult);

        // 应用伤害
        const killed = Zombie.takeDamage(zombie, finalDamage);

        this.totalDamageDealt += finalDamage;

        // 显示伤害反馈
        this.showDamageFeedback(hitPoint, finalDamage, bodyPart, isCrit, killed);

        // 命中标记特效
        if (typeof Effects !== 'undefined') {
            Effects.showHitMarker(killed, bodyPart === 'head');
            Effects.triggerRecoil(0.1);
        }

        if (killed) {
            this.killCount++;
            this.showKillFeedback(zombie.type);
            Audio.playKill();
        }
    },

    // 丧尸攻击玩家（每帧检测）
    processZombieAttacks(dt) {
        if (!Player.isAlive) return 0;

        let totalDamage = 0;
        const playerPos = Player.position;
        const nearbyZombies = Zombie.getZombiesInRange(playerPos, 2.5);

        for (const z of nearbyZombies) {
            if (z.state === 'attack' && z.attackCooldown <= 0) {
                totalDamage += z.damage;
            }
        }

        return totalDamage;
    },

    // 显示伤害数字
    showDamageFeedback(position, damage, bodyPart, isCrit, killed) {
        const div = document.createElement('div');
        div.style.position = 'fixed';
        div.style.pointerEvents = 'none';
        div.style.zIndex = '20';
        div.style.fontFamily = 'Courier New, monospace';
        div.style.fontWeight = 'bold';
        div.style.fontSize = isCrit ? '28px' : '20px';
        div.style.textShadow = '2px 2px 4px #000';

        if (bodyPart === 'head') {
            div.style.color = '#ff0';
            div.textContent = `爆头 -${damage}`;
        } else if (isCrit) {
            div.style.color = '#ff8800';
            div.textContent = `暴击 -${damage}`;
        } else {
            div.style.color = '#fff';
            div.textContent = `-${damage}`;
        }

        if (killed) {
            div.style.color = '#f00';
            div.textContent += ' 击杀!';
        }

        // 随机偏移
        div.style.left = (50 + (Math.random() - 0.5) * 20) + '%';
        div.style.top = (40 + (Math.random() - 0.5) * 10) + '%';
        div.style.animation = 'fadeUp 1s forwards';

        document.body.appendChild(div);
        setTimeout(() => div.remove(), 1000);
    },

    // 显示击杀反馈
    showKillFeedback(zombieType) {
        const hint = document.getElementById('kill-feedback');
        if (!hint) return;

        const messages = {
            normal: '击杀丧尸!',
            elite: '击杀精英丧尸!'
        };
        hint.textContent = messages[zombieType] || '击杀!';
        hint.style.display = 'block';
        hint.style.animation = 'none';
        hint.offsetHeight; // 触发重绘
        hint.style.animation = 'fadeUp 1s forwards';

        setTimeout(() => {
            hint.style.display = 'none';
        }, 1000);
    },

    // 显示受伤遮罩
    showDamageOverlay() {
        const overlay = document.getElementById('damage-overlay');
        if (!overlay) return;
        overlay.style.display = 'block';
        overlay.style.animation = 'none';
        overlay.offsetHeight;
        overlay.style.animation = 'damageFlash 0.3s forwards';
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    },

    // 获取统计
    getStats() {
        return {
            kills: this.killCount,
            headshots: this.headshotCount,
            totalDamage: this.totalDamageDealt
        };
    },

    reset() {
        this.killCount = 0;
        this.totalDamageDealt = 0;
        this.headshotCount = 0;
    }
};
