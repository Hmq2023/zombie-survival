// game.js - 游戏状态管理
const Game = {
    state: 'menu',     // menu, playing, victory, defeat
    startTime: 0,
    elapsedTime: 0,
    pickupCount: 0,

    init() {
        this.state = 'menu';
        this.pickupCount = 0;
    },

    // 开始游戏
    start() {
        this.state = 'playing';
        this.startTime = Date.now();
        this.pickupCount = 0;

        // 隐藏菜单，显示HUD
        document.getElementById('start-menu').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('game-over').style.display = 'none';

        // 请求指针锁定
        document.body.requestPointerLock();

        // 播放环境音
        Audio.playAmbient();
    },

    // 更新游戏状态
    update(dt) {
        if (this.state !== 'playing') return;

        this.elapsedTime = (Date.now() - this.startTime) / 1000;

        // 更新丧尸计数
        this.updateZombieCount();

        // 检查胜利条件
        if (Zombie.totalCount <= 0) {
            this.onVictory();
        }
    },

    // 更新丧尸计数显示
    updateZombieCount() {
        const countEl = document.getElementById('zombie-count');
        if (countEl) {
            countEl.textContent = `剩余丧尸: ${Zombie.totalCount}`;
            if (Zombie.totalCount <= 5) {
                countEl.style.color = '#ffaa00';
            }
        }
    },

    // 更新楼层指示器
    updateFloorIndicator() {
        const indicator = document.getElementById('floor-indicator');
        const floorText = document.getElementById('floor-text');
        const buildingName = document.getElementById('building-name');
        if (!indicator) return;

        const info = City.currentFloorInfo;
        if (info.inBuilding && info.totalFloors > 1) {
            indicator.style.display = 'block';
            const floorNames = ['1F', '2F', '3F', '4F', '5F'];
            floorText.textContent = floorNames[info.floor] || (info.floor + 1) + 'F';
            const typeNames = {
                hospital: '医院', school: '学校', mall: '商场',
                police: '警察局', shop: '商店', restaurant: '餐厅',
                bar: '酒楼', tower: '大厦'
            };
            buildingName.textContent = typeNames[info.buildingType] || '';
        } else if (info.inBuilding) {
            indicator.style.display = 'block';
            floorText.textContent = '1F';
            const typeNames = {
                hospital: '医院', school: '学校', mall: '商场',
                police: '警察局', shop: '商店', restaurant: '餐厅',
                bar: '酒楼', tower: '大厦'
            };
            buildingName.textContent = typeNames[info.buildingType] || '';
        } else {
            indicator.style.display = 'none';
        }
    },

    // 更新手电筒HUD
    updateFlashlightHUD() {
        const el = document.getElementById('flashlight-state');
        if (!el) return;
        if (Player.flashlightOn) {
            el.textContent = '🔦 ON';
            el.style.color = '#ffdd88';
        } else {
            el.textContent = '🔦 OFF';
            el.style.color = '#666';
        }
    },

    // 更新天气/时间HUD
    updateWeatherHUD() {
        const timeEl = document.getElementById('game-time');
        const weatherEl = document.getElementById('weather-icon');
        if (!timeEl || !weatherEl) return;

        timeEl.textContent = Weather.getTimeString();
        weatherEl.textContent = Weather.getWeatherName();

        // 夜晚时时间文字变暗
        if (Weather.isNight()) {
            timeEl.style.color = '#8899bb';
            timeEl.style.textShadow = '0 0 8px #4466aa, 2px 2px 4px #000';
        } else {
            timeEl.style.color = '#ffddaa';
            timeEl.style.textShadow = '0 0 8px #ffaa44, 2px 2px 4px #000';
        }

        // 雨天时天气文字变蓝
        if (Weather.weather === 'rainy') {
            weatherEl.style.color = '#88aacc';
        } else if (Weather.weather === 'cloudy') {
            weatherEl.style.color = '#999';
        } else {
            weatherEl.style.color = '#ffdd88';
        }
    },

    // 更新武器HUD
    updateWeaponHUD() {
        const nameEl = document.getElementById('weapon-name');
        const ammoEl = document.getElementById('ammo-count');
        const slots = [
            document.getElementById('slot-1'),
            document.getElementById('slot-2'),
            document.getElementById('slot-3')
        ];

        if (nameEl) nameEl.textContent = Weapon.getCurrentName();

        const ammoInfo = Weapon.getAmmoInfo();
        if (ammoEl) {
            if (Weapon.isReloading) {
                ammoEl.textContent = '换弹中...';
            } else {
                ammoEl.textContent = `${ammoInfo.current} / ${ammoInfo.max}`;
            }
        }

        // 更新武器槽位
        for (let i = 0; i < 3; i++) {
            if (slots[i]) {
                const w = Weapon.slots[i];
                slots[i].textContent = w ? `${i + 1}: ${Weapon.definitions[w].name}` : `${i + 1}: 空`;
                slots[i].className = 'slot' + (i === Weapon.currentSlot ? ' active' : '');
            }
        }
    },

    // 检测拾取提示
    updatePickupHint() {
        const hint = document.getElementById('pickup-hint');
        if (!hint) return;

        const nearbyItem = Items.getNearbyItem(Player.position);
        if (nearbyItem && Weapon.hasWeapon()) {
            hint.textContent = `按 E 拾取 [${nearbyItem.def.label}]`;
            hint.style.display = 'block';
        } else if (nearbyItem && !Weapon.hasWeapon()) {
            hint.textContent = `按 E 拾取 [${nearbyItem.def.label}]`;
            hint.style.display = 'block';
        } else {
            hint.style.display = 'none';
        }
    },

    // 玩家拾取物品
    onPickup() {
        const nearbyItem = Items.getNearbyItem(Player.position);
        if (nearbyItem) {
            const success = Items.pickup(nearbyItem);
            if (success) {
                this.pickupCount++;
            }
        }
    },

    // 胜利
    onVictory() {
        this.state = 'victory';
        document.exitPointerLock();

        const endScreen = document.getElementById('game-over');
        endScreen.className = 'victory';
        endScreen.style.display = 'flex';

        document.getElementById('end-title').textContent = '胜利！城市已清理！';
        document.getElementById('end-stats').innerHTML = `
            击杀丧尸: ${Combat.killCount}<br>
            爆头次数: ${Combat.headshotCount}<br>
            总伤害: ${Combat.totalDamageDealt}<br>
            拾取物品: ${this.pickupCount}<br>
            存活时间: ${this.formatTime(this.elapsedTime)}
        `;
    },

    // 玩家死亡
    onPlayerDeath() {
        this.state = 'defeat';
        document.exitPointerLock();

        const endScreen = document.getElementById('game-over');
        endScreen.className = 'defeat';
        endScreen.style.display = 'flex';

        document.getElementById('end-title').textContent = '你已阵亡...';
        document.getElementById('end-stats').innerHTML = `
            击杀丧尸: ${Combat.killCount}<br>
            剩余丧尸: ${Zombie.totalCount}<br>
            爆头次数: ${Combat.headshotCount}<br>
            总伤害: ${Combat.totalDamageDealt}<br>
            拾取物品: ${this.pickupCount}<br>
            存活时间: ${this.formatTime(this.elapsedTime)}
        `;
    },

    // 格式化时间
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}分${s}秒`;
    },

    // 重新开始
    restart(scene) {
        // 重置所有系统
        Survival.reset();
        Weapon.reset();
        Zombie.reset(scene);
        Items.reset();
        Combat.reset();
        Player.reset();
        Weather.reset();
        Environment.reset();
        Effects.reset();
        Minimap.reset();

        this.state = 'playing';
        this.startTime = Date.now();
        this.pickupCount = 0;

        // 重新生成
        Zombie.spawnAll(scene);
        Items.spawnAll(scene);

        // 更新UI
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('hud').style.display = 'block';

        document.body.requestPointerLock();
    }
};
