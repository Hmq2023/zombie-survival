// zombie.js - 丧尸AI系统
const Zombie = {
    zombies: [],
    totalCount: 0,
    maxZombies: 25,

    // 丧尸模板
    types: {
        normal: { hp: 50, speed: 2.5, damage: 10, color: 0x4a7a4a, scale: 1 },
        elite: { hp: 100, speed: 3.5, damage: 15, color: 0x2a5a2a, scale: 1.2 }
    },

    init(scene) {
        this.zombies = [];
        this.totalCount = 0;
        this.scene = scene;
    },

    // 生成所有丧尸
    spawnAll(scene) {
        this.scene = scene;
        for (let i = 0; i < this.maxZombies; i++) {
            const type = Math.random() < 0.2 ? 'elite' : 'normal';
            this.spawn(scene, type);
        }
        this.totalCount = this.zombies.length;
        return this.totalCount;
    },

    // 生成单个丧尸
    spawn(scene, type = 'normal') {
        const template = this.types[type];
        const pos = City.getRandomWalkablePos();

        // 确保不在玩家附近生成
        const distToPlayer = Math.sqrt(pos.x * pos.x + pos.z * pos.z);
        if (distToPlayer < 20) {
            // 重新找位置
            return this.spawn(scene, type);
        }

        // 创建丧尸模型（简单几何体组合）
        const group = new THREE.Group();

        // 身体（圆柱体）
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.2, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: template.color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        body.castShadow = true;
        group.add(body);

        // 头部（球体）
        const headGeo = new THREE.SphereGeometry(0.25, 8, 8);
        const headMat = new THREE.MeshLambertMaterial({ color: 0x6a9a6a });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        head.castShadow = true;
        group.add(head);

        // 手臂
        const armGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.8, 6);
        const armMat = new THREE.MeshLambertMaterial({ color: template.color });
        const leftArm = new THREE.Mesh(armGeo, armMat);
        leftArm.position.set(-0.45, 1.1, 0);
        leftArm.rotation.z = 0.3;
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, armMat);
        rightArm.position.set(0.45, 1.1, 0);
        rightArm.rotation.z = -0.3;
        group.add(rightArm);

        // 腿
        const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 6);
        const legMat = new THREE.MeshLambertMaterial({ color: 0x3a5a3a });
        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.15, 0.35, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.15, 0.35, 0);
        group.add(rightLeg);

        group.position.set(pos.x, 0, pos.z);
        group.scale.setScalar(template.scale);
        scene.add(group);

        const zombie = {
            mesh: group,
            type: type,
            hp: template.hp,
            maxHp: template.hp,
            speed: template.speed,
            damage: template.damage,
            state: 'wander',        // wander, chase, attack, dead
            wanderTarget: new THREE.Vector3(pos.x, 0, pos.z),
            wanderTimer: 0,
            attackCooldown: 0,
            detectionRange: 18,
            attackRange: 2.0,
            animTimer: Math.random() * 10,
            isAlive: true
        };

        this.zombies.push(zombie);
        return zombie;
    },

    // 更新所有丧尸
    update(dt, playerPos) {
        for (const z of this.zombies) {
            if (!z.isAlive) continue;
            this.updateSingle(z, dt, playerPos);
        }
    },

    // 更新单个丧尸
    updateSingle(z, dt, playerPos) {
        const pos = z.mesh.position;
        const distToPlayer = pos.distanceTo(playerPos);

        z.animTimer += dt;
        z.attackCooldown = Math.max(0, z.attackCooldown - dt);

        // 状态机
        switch (z.state) {
            case 'wander':
                this.wander(z, dt, distToPlayer);
                break;
            case 'chase':
                this.chase(z, dt, playerPos, distToPlayer);
                break;
            case 'attack':
                this.attack(z, dt, playerPos, distToPlayer);
                break;
        }

        // 动画：行走时摆动
        this.animate(z, dt);

        // 建筑碰撞
        City.resolveCollision(pos, 0.4);
    },

    // 游荡行为
    wander(z, dt, distToPlayer) {
        // 发现玩家则切换到追击
        if (distToPlayer < z.detectionRange) {
            z.state = 'chase';
            return;
        }

        z.wanderTimer -= dt;
        if (z.wanderTimer <= 0) {
            // 选择新的游荡目标
            const angle = Math.random() * Math.PI * 2;
            const dist = 3 + Math.random() * 8;
            z.wanderTarget.set(
                z.mesh.position.x + Math.cos(angle) * dist,
                0,
                z.mesh.position.z + Math.sin(angle) * dist
            );
            // 限制在城市内
            const half = City.citySize / 2 - 2;
            z.wanderTarget.x = Math.max(-half, Math.min(half, z.wanderTarget.x));
            z.wanderTarget.z = Math.max(-half, Math.min(half, z.wanderTarget.z));
            z.wanderTimer = 3 + Math.random() * 5;
        }

        // 向目标移动
        const dir = new THREE.Vector3().subVectors(z.wanderTarget, z.mesh.position);
        dir.y = 0;
        if (dir.length() > 0.5) {
            dir.normalize();
            z.mesh.position.x += dir.x * z.speed * 0.4 * dt;
            z.mesh.position.z += dir.z * z.speed * 0.4 * dt;
            z.mesh.rotation.y = Math.atan2(dir.x, dir.z);
        }
    },

    // 追击行为
    chase(z, dt, playerPos, distToPlayer) {
        if (distToPlayer > z.detectionRange * 1.5) {
            z.state = 'wander';
            return;
        }

        if (distToPlayer <= z.attackRange) {
            z.state = 'attack';
            return;
        }

        // 向玩家移动
        const dir = new THREE.Vector3().subVectors(playerPos, z.mesh.position);
        dir.y = 0;
        dir.normalize();
        z.mesh.position.x += dir.x * z.speed * dt;
        z.mesh.position.z += dir.z * z.speed * dt;
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);
    },

    // 攻击行为
    attack(z, dt, playerPos, distToPlayer) {
        if (distToPlayer > z.attackRange * 1.5) {
            z.state = 'chase';
            return;
        }

        // 面向玩家
        const dir = new THREE.Vector3().subVectors(playerPos, z.mesh.position);
        dir.y = 0;
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // 攻击冷却
        if (z.attackCooldown <= 0) {
            z.attackCooldown = 1.0; // 1秒攻击间隔
            return z.damage; // 返回伤害值
        }
        return 0;
    },

    // 行走动画
    animate(z, dt) {
        if (z.state === 'wander' || z.state === 'chase') {
            const bobAmount = z.state === 'chase' ? 0.1 : 0.05;
            const bobSpeed = z.state === 'chase' ? 8 : 4;
            z.mesh.position.y = Math.sin(z.animTimer * bobSpeed) * bobAmount;
        }
    },

    // 丧尸受伤
    takeDamage(zombie, damage) {
        if (!zombie.isAlive) return false;

        zombie.hp -= damage;
        if (zombie.hp <= 0) {
            zombie.hp = 0;
            zombie.isAlive = false;
            zombie.state = 'dead';
            this.totalCount--;

            // 死亡动画：倒下
            this.playDeathAnimation(zombie);
            return true; // 被击杀
        }

        // 受击变红
        zombie.mesh.children.forEach(child => {
            if (child.material) {
                const origColor = child.material.color.getHex();
                child.material.color.setHex(0xff0000);
                setTimeout(() => child.material.color.setHex(origColor), 100);
            }
        });

        // 被击中后转为追击
        zombie.state = 'chase';
        return false;
    },

    // 死亡动画
    playDeathAnimation(zombie) {
        const mesh = zombie.mesh;
        let angle = 0;
        const fallInterval = setInterval(() => {
            angle += 0.1;
            mesh.rotation.x = angle;
            mesh.position.y -= 0.02;
            if (angle >= Math.PI / 2) {
                clearInterval(fallInterval);
                // 延迟移除
                setTimeout(() => {
                    if (mesh.parent) {
                        mesh.parent.remove(mesh);
                    }
                }, 2000);
            }
        }, 16);
    },

    // 获取准星下的丧尸
    getZombieAtRay(origin, direction, maxDist) {
        const raycaster = new THREE.Raycaster(origin, direction, 0, maxDist);
        let closest = null;
        let closestDist = maxDist;

        for (const z of this.zombies) {
            if (!z.isAlive) continue;
            const hits = raycaster.intersectObjects(z.mesh.children, true);
            if (hits.length > 0 && hits[0].distance < closestDist) {
                closestDist = hits[0].distance;
                closest = { zombie: z, distance: hits[0].distance, point: hits[0].point };
            }
        }
        return closest;
    },

    // 获取最近的丧尸（用于范围检测）
    getZombiesInRange(pos, range) {
        return this.zombies.filter(z => {
            if (!z.isAlive) return false;
            return z.mesh.position.distanceTo(pos) <= range;
        });
    },

    // 重置
    reset(scene) {
        for (const z of this.zombies) {
            if (z.mesh.parent) {
                z.mesh.parent.remove(z.mesh);
            }
        }
        this.zombies = [];
        this.totalCount = 0;
    }
};
