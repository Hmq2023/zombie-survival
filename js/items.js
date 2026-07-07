// items.js - 地面物品系统
const Items = {
    items: [],         // 地面物品列表
    scene: null,

    // 物品类型定义
    types: {
        pistol: {
            label: '手枪',
            color: 0xaaaaaa,
            size: [0.3, 0.15, 0.15],
            type: 'weapon',
            weaponType: 'pistol'
        },
        rifle: {
            label: '步枪',
            color: 0x887755,
            size: [0.6, 0.1, 0.1],
            type: 'weapon',
            weaponType: 'rifle'
        },
        shotgun: {
            label: '霰弹枪',
            color: 0x665544,
            size: [0.5, 0.12, 0.12],
            type: 'weapon',
            weaponType: 'shotgun'
        },
        ammo: {
            label: '弹药箱',
            color: 0xccaa44,
            size: [0.3, 0.2, 0.2],
            type: 'ammo'
        },
        medkit: {
            label: '医疗包',
            color: 0xff4444,
            size: [0.25, 0.15, 0.25],
            type: 'medkit'
        },
        food: {
            label: '食物',
            color: 0x88cc44,
            size: [0.2, 0.2, 0.2],
            type: 'food'
        }
    },

    init(scene) {
        this.scene = scene;
        this.items = [];
    },

    // 生成所有地面物品
    spawnAll(scene) {
        this.scene = scene;
        this.items = [];

        // 手枪 × 5
        this.spawnMultiple('pistol', 5);
        // 步枪 × 3
        this.spawnMultiple('rifle', 3);
        // 霰弹枪 × 2
        this.spawnMultiple('shotgun', 2);
        // 弹药箱 × 12
        this.spawnMultiple('ammo', 12);
        // 医疗包 × 8
        this.spawnMultiple('medkit', 8);
        // 食物 × 8
        this.spawnMultiple('food', 8);

        return this.items.length;
    },

    // 批量生成
    spawnMultiple(type, count) {
        for (let i = 0; i < count; i++) {
            this.spawnSingle(type);
        }
    },

    // 生成单个物品
    spawnSingle(type) {
        const def = this.types[type];
        const pos = City.getRandomWalkablePos();

        const group = new THREE.Group();

        // 物品本体
        const geo = new THREE.BoxGeometry(...def.size);
        const mat = new THREE.MeshLambertMaterial({ color: def.color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.y = 0.3;
        mesh.castShadow = true;
        group.add(mesh);

        // 发光指示器
        const glowGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: def.color,
            transparent: true,
            opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.y = 0.6;
        group.add(glow);

        group.position.set(pos.x, 0, pos.z);
        this.scene.add(group);

        const item = {
            mesh: group,
            glow: glow,
            type: type,
            def: def,
            position: group.position,
            animTimer: Math.random() * 10,
            isActive: true
        };

        this.items.push(item);
        return item;
    },

    // 更新物品动画
    update(dt) {
        for (const item of this.items) {
            if (!item.isActive) continue;

            item.animTimer += dt;

            // 浮动动画
            item.glow.position.y = 0.6 + Math.sin(item.animTimer * 3) * 0.1;

            // 旋转动画
            item.mesh.rotation.y += dt * 1.5;

            // 发光脉冲
            item.glow.material.opacity = 0.4 + Math.sin(item.animTimer * 4) * 0.2;
        }
    },

    // 检测玩家附近可拾取物品
    getNearbyItem(playerPos, range = 2.0) {
        let closest = null;
        let closestDist = range;

        for (const item of this.items) {
            if (!item.isActive) continue;
            const dist = playerPos.distanceTo(item.position);
            if (dist < closestDist) {
                closestDist = dist;
                closest = item;
            }
        }
        return closest;
    },

    // 拾取物品
    pickup(item) {
        if (!item || !item.isActive) return false;

        item.isActive = false;
        this.scene.remove(item.mesh);

        switch (item.def.type) {
            case 'weapon':
                return Weapon.pickup(item.def.weaponType);
            case 'ammo':
                // 随机给当前武器弹药
                if (Weapon.currentWeapon) {
                    Weapon.addAmmo(Weapon.currentWeapon, 10 + Math.floor(Math.random() * 20));
                } else {
                    // 没有武器就给手枪弹药
                    Weapon.addAmmo('pistol', 15);
                }
                return true;
            case 'medkit':
                Survival.addMedkit(1);
                return true;
            case 'food':
                Survival.addFood(1);
                return true;
        }
        return false;
    },

    // 重置
    reset() {
        for (const item of this.items) {
            if (item.mesh.parent) {
                item.mesh.parent.remove(item.mesh);
            }
        }
        this.items = [];
    }
};
