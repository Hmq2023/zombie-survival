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

        // 创建丧尸模型（增强细节版）
        const group = new THREE.Group();

        const skinColor = template.color;
        const darkSkin = new THREE.Color(skinColor).multiplyScalar(0.7).getHex();
        const lightSkin = new THREE.Color(skinColor).lerp(new THREE.Color(0x88aa88), 0.3).getHex();

        // ===== 身体（驼背姿态）=====
        const bodyGeo = new THREE.CylinderGeometry(0.28, 0.35, 1.15, 8);
        const bodyMat = new THREE.MeshLambertMaterial({ color: skinColor });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0.9, 0.08);
        body.rotation.x = 0.15; // 驼背前倾
        body.castShadow = true;
        group.add(body);

        // 胸腔肋骨轮廓
        const ribGeo = new THREE.TorusGeometry(0.32, 0.03, 4, 8, Math.PI);
        const ribMat = new THREE.MeshLambertMaterial({ color: darkSkin });
        for (let i = 0; i < 3; i++) {
            const rib = new THREE.Mesh(ribGeo, ribMat);
            rib.position.set(0, 1.15 - i * 0.18, 0.12);
            rib.rotation.y = Math.PI / 2;
            rib.rotation.x = 0.15;
            group.add(rib);
        }

        // 破烂衣物（挂在身上的布片）
        const clothGeo = new THREE.PlaneGeometry(0.25, 0.4);
        const clothMat = new THREE.MeshLambertMaterial({
            color: 0x444433, side: THREE.DoubleSide
        });
        const cloth1 = new THREE.Mesh(clothGeo, clothMat);
        cloth1.position.set(-0.15, 0.95, 0.25);
        cloth1.rotation.set(0.2, 0.3, -0.4);
        group.add(cloth1);

        const cloth2 = new THREE.Mesh(
            new THREE.PlaneGeometry(0.2, 0.35), clothMat
        );
        cloth2.position.set(0.18, 0.85, 0.22);
        cloth2.rotation.set(0.1, -0.2, 0.3);
        group.add(cloth2);

        // ===== 头部 =====
        // 头骨（略微扁平，不对称）
        const headGeo = new THREE.SphereGeometry(0.25, 10, 10);
        headGeo.scale(1, 1.1, 0.95);
        const headMat = new THREE.MeshLambertMaterial({ color: lightSkin });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.set(0, 1.72, 0.12);
        head.rotation.x = -0.2; // 头前倾
        head.castShadow = true;
        group.add(head);

        // 下颚（微张嘴巴）
        const jawGeo = new THREE.SphereGeometry(0.15, 8, 4, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.4);
        const jawMat = new THREE.MeshLambertMaterial({ color: darkSkin });
        const jaw = new THREE.Mesh(jawGeo, jawMat);
        jaw.position.set(0, 1.58, 0.18);
        jaw.rotation.x = 0.5;
        group.add(jaw);

        // 牙齿
        const toothGeo = new THREE.BoxGeometry(0.03, 0.04, 0.02);
        const toothMat = new THREE.MeshLambertMaterial({ color: 0xcccc99 });
        for (let i = -2; i <= 2; i++) {
            const tooth = new THREE.Mesh(toothGeo, toothMat);
            tooth.position.set(i * 0.04, 1.62, 0.25);
            group.add(tooth);
        }

        // 眼睛（发光瞳孔）
        const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.1, 1.76, 0.3);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.1, 1.76, 0.3);
        group.add(rightEye);

        // 眼眶凹陷
        const socketGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const socketMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        const leftSocket = new THREE.Mesh(socketGeo, socketMat);
        leftSocket.position.set(-0.1, 1.76, 0.27);
        group.add(leftSocket);

        const rightSocket = new THREE.Mesh(socketGeo, socketMat);
        rightSocket.position.set(0.1, 1.76, 0.27);
        group.add(rightSocket);

        // 头部伤口（暴露的骨骼）
        const woundGeo = new THREE.SphereGeometry(0.06, 6, 6);
        const woundMat = new THREE.MeshLambertMaterial({ color: 0x880000 });
        const wound = new THREE.Mesh(woundGeo, woundMat);
        wound.position.set(0.15, 1.85, 0.1);
        group.add(wound);

        // ===== 手臂（前伸抓挠姿态）=====
        const armGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.85, 6);
        const armMat = new THREE.MeshLambertMaterial({ color: skinColor });

        // 左臂 - 前伸
        const leftArm = new THREE.Group();
        const leftArmMesh = new THREE.Mesh(armGeo, armMat);
        leftArmMesh.position.y = -0.35;
        leftArm.add(leftArmMesh);
        leftArm.position.set(-0.4, 1.2, 0.15);
        leftArm.rotation.set(-1.0, 0, 0.4); // 前伸+下垂
        group.add(leftArm);

        // 右臂 - 前伸
        const rightArm = new THREE.Group();
        const rightArmMesh = new THREE.Mesh(armGeo, armMat);
        rightArmMesh.position.y = -0.35;
        rightArm.add(rightArmMesh);
        rightArm.position.set(0.4, 1.2, 0.15);
        rightArm.rotation.set(-1.0, 0, -0.4);
        group.add(rightArm);

        // 手掌（爪子）
        const handGeo = new THREE.SphereGeometry(0.08, 6, 6);
        handGeo.scale(1, 0.6, 1.3);
        const handMat = new THREE.MeshLambertMaterial({ color: darkSkin });
        const leftHand = new THREE.Mesh(handGeo, handMat);
        leftHand.position.set(-0.4, 0.65, 0.5);
        group.add(leftHand);

        const rightHand = new THREE.Mesh(handGeo, handMat);
        rightHand.position.set(0.4, 0.65, 0.5);
        group.add(rightHand);

        // 手指（尖锐指甲）
        const fingerGeo = new THREE.CylinderGeometry(0.015, 0.008, 0.12, 4);
        const fingerMat = new THREE.MeshLambertMaterial({ color: 0x333322 });
        for (let i = -1; i <= 1; i++) {
            const lf = new THREE.Mesh(fingerGeo, fingerMat);
            lf.position.set(-0.4 + i * 0.03, 0.58, 0.58);
            lf.rotation.x = -0.5;
            group.add(lf);

            const rf = new THREE.Mesh(fingerGeo, fingerMat);
            rf.position.set(0.4 + i * 0.03, 0.58, 0.58);
            rf.rotation.x = -0.5;
            group.add(rf);
        }

        // ===== 腿部 =====
        const legGeo = new THREE.CylinderGeometry(0.09, 0.11, 0.7, 6);
        const legMat = new THREE.MeshLambertMaterial({ color: darkSkin });

        const leftLeg = new THREE.Mesh(legGeo, legMat);
        leftLeg.position.set(-0.15, 0.35, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, legMat);
        rightLeg.position.set(0.15, 0.35, 0);
        group.add(rightLeg);

        // 膝盖伤口
        const kneeWoundGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const kneeWound = new THREE.Mesh(kneeWoundGeo, woundMat);
        kneeWound.position.set(-0.15, 0.5, 0.08);
        group.add(kneeWound);

        // 脚部（赤脚）
        const footGeo = new THREE.BoxGeometry(0.1, 0.06, 0.18);
        const footMat = new THREE.MeshLambertMaterial({ color: darkSkin });
        const leftFoot = new THREE.Mesh(footGeo, footMat);
        leftFoot.position.set(-0.15, 0.03, 0.04);
        group.add(leftFoot);

        const rightFoot = new THREE.Mesh(footGeo, footMat);
        rightFoot.position.set(0.15, 0.03, 0.04);
        group.add(rightFoot);

        // ===== 血迹斑点 =====
        const bloodGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const bloodMat = new THREE.MeshLambertMaterial({ color: 0x660000 });
        const bloodPositions = [
            [0.2, 1.1, 0.25], [-0.15, 0.8, 0.28], [0.1, 0.6, 0.2]
        ];
        bloodPositions.forEach(p => {
            const blood = new THREE.Mesh(bloodGeo, bloodMat);
            blood.position.set(...p);
            blood.scale.set(1, 0.3, 1); // 扁平血迹
            group.add(blood);
        });

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

        // 建筑碰撞（丧尸可通过门口）
        City.resolveZombieCollision(pos, 0.4, z.state === 'chase');
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

        // 向玩家移动（允许通过门口）
        const dir = new THREE.Vector3().subVectors(playerPos, z.mesh.position);
        dir.y = 0;
        dir.normalize();

        // 追击时加速
        const chaseSpeed = z.speed * 1.1;
        z.mesh.position.x += dir.x * chaseSpeed * dt;
        z.mesh.position.z += dir.z * chaseSpeed * dt;
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // 追击时随机发出咆哮声
        if (Math.random() < 0.005) {
            Audio.playZombieGrowl();
        }
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

    // 行走动画（增强版）
    animate(z, dt) {
        const t = z.animTimer;
        const children = z.mesh.children;

        if (z.state === 'wander' || z.state === 'chase') {
            const bobAmount = z.state === 'chase' ? 0.1 : 0.05;
            const bobSpeed = z.state === 'chase' ? 8 : 4;
            z.mesh.position.y = Math.sin(t * bobSpeed) * bobAmount;

            // 手臂摆动（children索引: 左臂=约第9个, 右臂=约第10个）
            const armSwing = z.state === 'chase' ? 0.4 : 0.2;
            const armSpeed = z.state === 'chase' ? 6 : 3;
            // 左臂
            if (children[9]) {
                children[9].rotation.x = -1.0 + Math.sin(t * armSpeed) * armSwing;
            }
            // 右臂
            if (children[10]) {
                children[10].rotation.x = -1.0 + Math.sin(t * armSpeed + Math.PI) * armSwing;
            }

            // 腿部微摆
            const legSwing = z.state === 'chase' ? 0.3 : 0.15;
            if (children[16]) children[16].rotation.x = Math.sin(t * armSpeed) * legSwing;
            if (children[17]) children[17].rotation.x = Math.sin(t * armSpeed + Math.PI) * legSwing;

            // 身体轻微左右摇晃
            z.mesh.rotation.z = Math.sin(t * 2) * 0.05;
        }

        // 眼睛发光脉冲（children索引: 左眼=5, 右眼=6）
        if (children[5] && children[5].material) {
            const glow = 0.7 + Math.sin(t * 3) * 0.3;
            children[5].material.color.setRGB(glow, 0.1, 0);
            if (children[6]) children[6].material.color.setRGB(glow, 0.1, 0);
        }

        // 追击时头部微颤
        if (z.state === 'chase' && children[3]) {
            children[3].rotation.z = Math.sin(t * 10) * 0.08;
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
