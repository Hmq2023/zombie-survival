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
            pellets: 8,
            headMult: 1.5,
            critChance: 0.05,
            critMult: 2.0,
            color: 0x443322
        },
        smg: {
            name: '冲锋枪',
            damage: 15,
            fireRate: 0.08,
            magSize: 35,
            reloadTime: 1.8,
            spread: 0.04,
            range: 40,
            headMult: 1.8,
            critChance: 0.06,
            critMult: 1.5,
            color: 0x555555
        },
        sniper: {
            name: '狙击枪',
            damage: 120,
            fireRate: 1.2,
            magSize: 5,
            reloadTime: 3.0,
            spread: 0.005,
            range: 150,
            headMult: 4.0,
            critChance: 0.15,
            critMult: 2.0,
            color: 0x445533
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
        shotgun: 0,
        smg: 0,
        sniper: 0
    },

    // 射击状态
    fireTimer: 0,
    isReloading: false,
    reloadTimer: 0,
    isFiring: false,

    // 枪口闪光
    muzzleFlash: null,
    muzzleFlashTimer: 0,

    // 第一人称武器模型
    viewmodel: null,
    viewmodelBob: 0,
    viewmodelRecoil: 0,

    init(scene) {
        this.scene = scene;
        this.slots = [null, null, null];
        this.currentSlot = 0;
        this.currentWeapon = null;
        this.ammo = { pistol: 0, rifle: 0, shotgun: 0, smg: 0, sniper: 0 };
        this.fireTimer = 0;
        this.isReloading = false;
        this.reloadTimer = 0;

        // 创建枪口闪光
        const flashGeo = new THREE.SphereGeometry(0.1, 6, 6);
        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.muzzleFlash = new THREE.Mesh(flashGeo, flashMat);
        this.muzzleFlash.visible = false;
        scene.add(this.muzzleFlash);

        // 创建第一人称武器模型组
        this.viewmodelGroup = new THREE.Group();
        this.viewmodelGroup.position.set(0.35, -0.3, -0.5);
        scene.add(this.viewmodelGroup);
    },

    // 创建武器视图模型
    createViewmodel(weaponType) {
        // 清除旧模型
        while (this.viewmodelGroup.children.length > 0) {
            this.viewmodelGroup.remove(this.viewmodelGroup.children[0]);
        }

        const gunMetal = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const gunBody = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const gunWood = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        const gunDark = new THREE.MeshLambertMaterial({ color: 0x222222 });

        switch (weaponType) {
            case 'pistol': {
                // 手枪
                const group = new THREE.Group();
                // 枪身
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.22), gunMetal);
                body.position.set(0, 0, -0.05);
                group.add(body);
                // 握把
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.06), gunDark);
                grip.position.set(0, -0.08, 0.04);
                grip.rotation.x = 0.2;
                group.add(grip);
                // 枪管
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6), gunMetal);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.01, -0.2);
                group.add(barrel);
                // 准星
                const sight = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.015), gunMetal);
                sight.position.set(0, 0.05, -0.15);
                group.add(sight);
                this.viewmodelGroup.add(group);
                this.viewmodel = group;
                break;
            }
            case 'rifle': {
                // 步枪
                const group = new THREE.Group();
                // 枪身
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.45), gunBody);
                body.position.set(0, 0, -0.1);
                group.add(body);
                // 枪托
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.07, 0.15), gunWood);
                stock.position.set(0, -0.01, 0.18);
                group.add(stock);
                // 弹匣
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.06), gunDark);
                mag.position.set(0, -0.08, -0.02);
                group.add(mag);
                // 枪管
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), gunMetal);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.01, -0.38);
                group.add(barrel);
                // 前握把
                const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.08), gunWood);
                foregrip.position.set(0, -0.03, -0.18);
                group.add(foregrip);
                // 瞄准镜
                const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 6), gunDark);
                scope.rotation.x = Math.PI / 2;
                scope.position.set(0, 0.05, -0.08);
                group.add(scope);
                this.viewmodelGroup.add(group);
                this.viewmodel = group;
                break;
            }
            case 'shotgun': {
                // 霰弹枪
                const group = new THREE.Group();
                // 枪身
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.4), gunBody);
                body.position.set(0, 0, -0.08);
                group.add(body);
                // 枪管（双管）
                const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), gunMetal);
                barrel1.rotation.x = Math.PI / 2;
                barrel1.position.set(-0.012, 0.02, -0.33);
                group.add(barrel1);
                const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 6), gunMetal);
                barrel2.rotation.x = Math.PI / 2;
                barrel2.position.set(0.012, 0.02, -0.33);
                group.add(barrel2);
                // 枪托
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.18), gunWood);
                stock.position.set(0, -0.01, 0.17);
                group.add(stock);
                // 护木
                const foregrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.1), gunWood);
                foregrip.position.set(0, -0.03, -0.15);
                group.add(foregrip);
                // 泵动部件
                const pump = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, 0.08), gunDark);
                pump.position.set(0, -0.01, -0.2);
                group.add(pump);
                this.viewmodelGroup.add(group);
                this.viewmodel = group;
                break;
            }
            case 'smg': {
                // 冲锋枪
                const group = new THREE.Group();
                // 枪身（紧凑）
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.055, 0.25), gunBody);
                body.position.set(0, 0, -0.05);
                group.add(body);
                // 弹匣（弯曲）
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.04), gunDark);
                mag.position.set(0, -0.08, 0.02);
                mag.rotation.x = 0.15;
                group.add(mag);
                // 枪管
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 6), gunMetal);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.005, -0.2);
                group.add(barrel);
                // 折叠枪托
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.12), gunMetal);
                stock.position.set(0, 0.01, 0.12);
                group.add(stock);
                // 握把
                const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.04), gunDark);
                grip.position.set(0, -0.06, 0.04);
                grip.rotation.x = 0.2;
                group.add(grip);
                this.viewmodelGroup.add(group);
                this.viewmodel = group;
                break;
            }
            case 'sniper': {
                // 狙击枪
                const group = new THREE.Group();
                // 枪身（修长）
                const body = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.55), gunBody);
                body.position.set(0, 0, -0.15);
                group.add(body);
                // 枪管（长）
                const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), gunMetal);
                barrel.rotation.x = Math.PI / 2;
                barrel.position.set(0, 0.01, -0.5);
                group.add(barrel);
                // 枪托
                const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.2), gunWood);
                stock.position.set(0, -0.01, 0.2);
                group.add(stock);
                // 瞄准镜（大）
                const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), gunDark);
                scope.rotation.x = Math.PI / 2;
                scope.position.set(0, 0.055, -0.1);
                group.add(scope);
                // 镜头
                const lens = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 6), new THREE.MeshBasicMaterial({ color: 0x4466aa }));
                lens.position.set(0, 0.055, -0.18);
                group.add(lens);
                // 弹匣
                const mag = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.05), gunDark);
                mag.position.set(0, -0.065, -0.05);
                group.add(mag);
                // 双脚架
                const bipod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 4), gunMetal);
                bipod1.position.set(-0.02, -0.05, -0.3);
                bipod1.rotation.z = 0.3;
                group.add(bipod1);
                const bipod2 = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 4), gunMetal);
                bipod2.position.set(0.02, -0.05, -0.3);
                bipod2.rotation.z = -0.3;
                group.add(bipod2);
                this.viewmodelGroup.add(group);
                this.viewmodel = group;
                break;
            }
        }
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
                this.createViewmodel(this.slots[this.currentSlot] || weaponType);
                return true;
            }
        }

        // 替换当前武器
        const oldWeapon = this.slots[this.currentSlot];
        this.slots[this.currentSlot] = weaponType;
        this.ammo[weaponType] = this.definitions[weaponType].magSize;
        this.currentWeapon = weaponType;
        this.createViewmodel(weaponType);
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

        // 更新视图模型
        if (this.currentWeapon) {
            this.createViewmodel(this.currentWeapon);
        }
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

        // 更新武器视图模型动画
        this.updateViewmodel(dt);
    },

    // 更新视图模型动画
    updateViewmodel(dt) {
        if (!this.viewmodel || !Player.camera) return;

        // 跟随相机
        const cam = Player.camera;
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);

        this.viewmodelGroup.position.copy(cam.position)
            .add(forward.multiplyScalar(-0.5))
            .add(right.multiplyScalar(0.35))
            .add(up.multiplyScalar(-0.3));
        this.viewmodelGroup.quaternion.copy(cam.quaternion);

        // 行走摆动
        const isMoving = Player.keys.forward || Player.keys.backward || Player.keys.left || Player.keys.right;
        const isSprinting = Player.isSprinting;

        if (isMoving) {
            const bobSpeed = isSprinting ? 12 : 8;
            const bobAmount = isSprinting ? 0.025 : 0.015;
            this.viewmodelBob += dt * bobSpeed;
            this.viewmodelGroup.position.x = 0.35 + Math.sin(this.viewmodelBob) * bobAmount;
            this.viewmodelGroup.position.y = -0.3 + Math.abs(Math.sin(this.viewmodelBob * 2)) * bobAmount * 0.5;
        } else {
            // 静止时轻微呼吸摆动
            this.viewmodelBob += dt * 2;
            this.viewmodelGroup.position.x = 0.35 + Math.sin(this.viewmodelBob * 0.5) * 0.003;
            this.viewmodelGroup.position.y = -0.3 + Math.sin(this.viewmodelBob * 0.7) * 0.002;
        }

        // 后坐力恢复
        if (this.viewmodelRecoil > 0) {
            this.viewmodelRecoil *= Math.pow(0.01, dt);
            if (this.viewmodelRecoil < 0.001) this.viewmodelRecoil = 0;
        }
        this.viewmodelGroup.position.z = -0.5 + this.viewmodelRecoil;

        // 换弹动画
        if (this.isReloading) {
            const progress = 1 - (this.reloadTimer / this.definitions[this.currentWeapon].reloadTime);
            if (progress < 0.3) {
                // 下移
                this.viewmodelGroup.rotation.x = progress / 0.3 * -0.3;
            } else if (progress < 0.7) {
                // 保持
                this.viewmodelGroup.rotation.x = -0.3;
            } else {
                // 回位
                this.viewmodelGroup.rotation.x = -0.3 * (1 - (progress - 0.7) / 0.3);
            }
        } else {
            this.viewmodelGroup.rotation.x *= Math.pow(0.001, dt);
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

        // 后坐力
        this.viewmodelRecoil = 0.05;

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
        this.viewmodelRecoil = 0;
        // 清除视图模型
        if (this.viewmodelGroup) {
            while (this.viewmodelGroup.children.length > 0) {
                this.viewmodelGroup.remove(this.viewmodelGroup.children[0]);
            }
        }
        this.viewmodel = null;
    }
};
