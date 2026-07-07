// weapon.js - 武器系统
const Weapon = {
    // 武器定义
    definitions: {
        pistol: {
            name: '手枪',
            damage: 20,
            fireRate: 0.3,      // 射击间隔(秒)
            magSize: 12,
            reloadTime: 1.2,
            spread: 0.02,       // 散布
            range: 50,
            headMult: 2.0,
            critChance: 0.1,
            critMult: 1.5,
            color: 0x888888
        },
        rifle: {
            name: '步枪',
            damage: 40,
            fireRate: 0.15,
            magSize: 30,
            reloadTime: 2.0,
            spread: 0.03,
            range: 80,
            headMult: 2.5,
            critChance: 0.08,
            critMult: 1.5,
            color: 0x665544
        },
        shotgun: {
            name: '霰弹枪',
            damage: 80,
            fireRate: 0.8,
            magSize: 6,
            reloadTime: 2.5,
            spread: 0.08,
            range: 20,
            pellets: 8,          // 霰弹弹丸数
            headMult: 1.5,
            critChance: 0.05,
            critMult: 2.0,
            color: 0x443322
        }
    },

    // 玩家武器栏（最多3把）
    slots: [null, null, null],
    currentSlot: 0,
    currentWeapon: null,

    // 弹药
    ammo: {
        pistol: 0,
        rifle: 0,
        shotgun: 0
    },

    // 射击状态
    fireTimer: 0,
    isReloading: false,
    reloadTimer: 0,
    isFiring: false,

    // 枪口闪光
    muzzleFlash: null,
    muzzleFlashTimer: 0,

    init(scene) {
        this.scene = scene;
        this.slots = [null, null, null];
        this.currentSlot = 0;
        this.currentWeapon = null;
        this.ammo = { pistol: 0, rifle: 0, shotgun: 0 };
        this.fireTimer = 0;
        this.isReloading = false;
        this.reloadTimer = 0;

        // 创建枪口闪光
        const flashGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
        this.muzzleFlash.visible = false;
        scene.add(this.muzzleFlash);
    },

    // 拾取武器
    pickup(weaponType) {
        // 检查是否已有该类型武器
        for (let i = 0; i < 3; i++) {
            if (this.slots[i] === weaponType) {
                // 已有，补充弹药
                this.addAmmo(weaponType, this.definitions[weaponType].magSize);
                return true;
            }
        }

        // 找空槽位
        for (let i = 0; i < 3; i++) {
            if (this.slots[i] === null) {
                this.slots[i] = weaponType;
                this.ammo[weaponType] = this.definitions[weaponType].magSize;
                if (this.currentWeapon === null) {
                    this.switchWeapon(i);
                }
                return true;
            }
        }

        // 替换当前武器
        const oldWeapon = this.slots[this.currentSlot];
        this.slots[this.currentSlot] = weaponType;
        this.ammo[weaponType] = this.definitions[weaponType].magSize;
        this.currentWeapon = weaponType;
        return true;
    },

    // 添加弹药
    addAmmo(weaponType, amount) {
        if (this.definitions[weaponType]) {
            this.ammo[weaponType] += amount;
        }
    },

    // 切换武器
    switchWeapon(slot) {
        if (slot < 0 || slot >= 3) return;
        if (this.slots[slot] === null) return;
        if (this.isReloading) return;

        this.currentSlot = slot;
        this.currentWeapon = this.slots[slot];
        this.fireTimer = 0;
        this.isReloading = false;
        this.reloadTimer = 0;
    },

    // 更新
    update(dt) {
        this.fireTimer = Math.max(0, this.fireTimer - dt);

        // 换弹计时
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                this.finishReload();
            }
        }

        // 枪口闪光
        if (this.muzzleFlashTimer > 0) {
            this.muzzleFlashTimer -= dt;
            if (this.muzzleFlashTimer <= 0) {
                this.muzzleFlash.visible = false;
            }
        }
    },

    // 射击
    fire(camera) {
        if (!this.currentWeapon) return null;
        if (this.isReloading) return null;
        if (this.fireTimer > 0) return null;

        const def = this.definitions[this.currentWeapon];
        if (this.ammo[this.currentWeapon] <= 0) {
            // 自动换弹
            this.startReload();
            return null;
        }

        this.ammo[this.currentWeapon]--;
        this.fireTimer = def.fireRate;

        // 枪口闪光效果
        this.showMuzzleFlash(camera);

        // 计算射击方向（带散布）
        const direction = new THREE.Vector3(0, 0, -1);
        direction.applyQuaternion(camera.quaternion);

        if (def.pellets) {
            // 霰弹枪：多弹丸
            const hits = [];
            for (let i = 0; i < def.pellets; i++) {
                const spreadDir = direction.clone();
                spreadDir.x += (Math.random() - 0.5) * def.spread;
                spreadDir.y += (Math.random() - 0.5) * def.spread;
                spreadDir.z += (Math.random() - 0.5) * def.spread;
                spreadDir.normalize();

                const hit = Zombie.getZombieAtRay(camera.position.clone(), spreadDir, def.range);
                if (hit) hits.push(hit);
            }
            return { type: 'shotgun', hits: hits, def: def };
        } else {
            // 单发武器
            const spreadDir = direction.clone();
            spreadDir.x += (Math.random() - 0.5) * def.spread;
            spreadDir.y += (Math.random() - 0.5) * def.spread;
            spreadDir.normalize();

            const hit = Zombie.getZombieAtRay(camera.position.clone(), spreadDir, def.range);
            return { type: 'single', hit: hit, def: def };
        }
    },

    // 开始换弹
    startReload() {
        if (!this.currentWeapon) return;
        if (this.isReloading) return;

        const def = this.definitions[this.currentWeapon];
        if (this.ammo[this.currentWeapon] >= def.magSize) return;

        this.isReloading = true;
        this.reloadTimer = def.reloadTime;
    },

    // 完成换弹
    finishReload() {
        this.isReloading = false;
        if (this.currentWeapon) {
            const def = this.definitions[this.currentWeapon];
            this.ammo[this.currentWeapon] = def.magSize;
        }
    },

    // 枪口闪光
    showMuzzleFlash(camera) {
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        this.muzzleFlash.position.copy(camera.position).add(forward.multiplyScalar(1.5));
        this.muzzleFlash.visible = true;
        this.muzzleFlashTimer = 0.05;
    },

    // 获取当前弹药信息
    getAmmoInfo() {
        if (!this.currentWeapon) return { current: 0, max: 0 };
        const def = this.definitions[this.currentWeapon];
        return {
            current: this.ammo[this.currentWeapon],
            max: def.magSize
        };
    },

    // 获取武器名
    getCurrentName() {
        if (!this.currentWeapon) return '无武器';
        return this.definitions[this.currentWeapon].name;
    },

    // 检查是否有武器
    hasWeapon() {
        return this.currentWeapon !== null;
    },

    // 重置
    reset() {
        this.slots = [null, null, null];
        this.currentSlot = 0;
        this.currentWeapon = null;
        this.ammo = { pistol: 0, rifle: 0, shotgun: 0 };
        this.fireTimer = 0;
        this.isReloading = false;
        this.reloadTimer = 0;
    }
};
