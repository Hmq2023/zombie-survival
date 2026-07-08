// environment.js - FPS级环境渲染增强系统
const Environment = {
    scene: null,
    playerPos: null,

    // 粒子系统
    dustParticles: null,
    smokeParticles: null,
    emberParticles: null,
    leafParticles: null,

    // 火焰效果
    fireSources: [],

    // 植被
    grassPatches: [],
    deadTrees: [],

    // 地面细节
    puddles: [],
    decals: [],

    // 街道设施
    streetProps: [],

    // 性能控制
    particleBudget: 1200,

    init(scene) {
        this.scene = scene;

        this.createAtmosphericParticles();
        this.createGroundDetails();
        this.createVegetation();
        this.createStreetProps();
        this.createFireSources();
        this.createAmbientSmoke();
    },

    // ========== 大气粒子 ==========
    createAtmosphericParticles() {
        // 灰尘粒子（空气中漂浮的颗粒）
        const dustCount = 400;
        const dustGeo = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustCount * 3);
        const dustSizes = new Float32Array(dustCount);
        const dustColors = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 120;
            dustPositions[i * 3 + 1] = 0.5 + Math.random() * 8;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
            dustSizes[i] = 0.05 + Math.random() * 0.15;
            // 灰色到棕色
            const brightness = 0.3 + Math.random() * 0.4;
            dustColors[i * 3] = brightness * (0.8 + Math.random() * 0.2);
            dustColors[i * 3 + 1] = brightness * (0.7 + Math.random() * 0.2);
            dustColors[i * 3 + 2] = brightness * (0.5 + Math.random() * 0.2);
        }

        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
        dustGeo.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));
        dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

        const dustMat = new THREE.PointsMaterial({
            size: 0.12,
            vertexColors: true,
            transparent: true,
            opacity: 0.4,
            depthWrite: false,
            sizeAttenuation: true
        });

        this.dustParticles = new THREE.Points(dustGeo, dustMat);
        this.scene.add(this.dustParticles);

        // 落叶粒子
        const leafCount = 60;
        this.leafParticles = [];
        const leafGeo = new THREE.PlaneGeometry(0.08, 0.06);
        const leafColors = [0x554422, 0x664422, 0x443311, 0x665533, 0x334411];

        for (let i = 0; i < leafCount; i++) {
            const leafMat = new THREE.MeshLambertMaterial({
                color: leafColors[Math.floor(Math.random() * leafColors.length)],
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(
                (Math.random() - 0.5) * 100,
                1 + Math.random() * 6,
                (Math.random() - 0.5) * 100
            );
            leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            this.scene.add(leaf);
            this.leafParticles.push({
                mesh: leaf,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.5,
                    -0.5 - Math.random() * 0.5,
                    (Math.random() - 0.5) * 0.5
                ),
                rotSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ),
                swayPhase: Math.random() * Math.PI * 2
            });
        }
    },

    // ========== 火焰和烟雾 ==========
    createFireSources() {
        // 在废墟中放置火焰桶
        const firePositions = [];
        for (let i = 0; i < 8; i++) {
            const pos = City.getRandomWalkablePos();
            firePositions.push(pos);
        }

        for (const pos of firePositions) {
            this.createFireBarrel(pos.x, pos.z);
        }
    },

    createFireBarrel(x, z) {
        // 油桶
        const barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        const barrelMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(x, 0.4, z);
        barrel.castShadow = true;
        this.scene.add(barrel);

        // 油桶上的锈迹
        const rustGeo = new THREE.BoxGeometry(0.15, 0.2, 0.02);
        const rustMat = new THREE.MeshLambertMaterial({ color: 0x663311 });
        for (let i = 0; i < 3; i++) {
            const rust = new THREE.Mesh(rustGeo, rustMat);
            const angle = Math.random() * Math.PI * 2;
            rust.position.set(
                x + Math.cos(angle) * 0.31,
                0.2 + Math.random() * 0.4,
                z + Math.sin(angle) * 0.31
            );
            rust.rotation.y = angle;
            this.scene.add(rust);
        }

        // 火焰粒子（用小面片模拟）
        const fireCount = 20;
        const fireGroup = new THREE.Group();
        const fireParticles = [];

        for (let i = 0; i < fireCount; i++) {
            const size = 0.1 + Math.random() * 0.2;
            const fireGeo = new THREE.PlaneGeometry(size, size * 1.5);
            const fireMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(
                    0.05 + Math.random() * 0.05, // 橙色到黄色
                    0.8 + Math.random() * 0.2,
                    0.4 + Math.random() * 0.3
                ),
                transparent: true,
                opacity: 0.7 + Math.random() * 0.3,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const fire = new THREE.Mesh(fireGeo, fireMat);
            fire.position.set(
                x + (Math.random() - 0.5) * 0.3,
                0.8 + Math.random() * 0.4,
                z + (Math.random() - 0.5) * 0.3
            );
            fireGroup.add(fire);
            fireParticles.push({
                mesh: fire,
                baseY: fire.position.y,
                speed: 1 + Math.random() * 2,
                phase: Math.random() * Math.PI * 2,
                size: size
            });
        }
        this.scene.add(fireGroup);

        // 火光点光源
        const fireLight = new THREE.PointLight(0xff6600, 1.5, 8);
        fireLight.position.set(x, 1.5, z);
        this.scene.add(fireLight);

        this.fireSources.push({
            group: fireGroup,
            particles: fireParticles,
            light: fireLight,
            x: x,
            z: z,
            timer: 0
        });
    },

    createAmbientSmoke() {
        // 远处的烟柱
        const smokeCount = 150;
        this.smokeParticles = [];

        for (let i = 0; i < smokeCount; i++) {
            const size = 0.3 + Math.random() * 0.8;
            const smokeGeo = new THREE.PlaneGeometry(size, size);
            const smokeMat = new THREE.MeshBasicMaterial({
                color: 0x222222,
                transparent: true,
                opacity: 0.15 + Math.random() * 0.15,
                side: THREE.DoubleSide,
                depthWrite: false
            });
            const smoke = new THREE.Mesh(smokeGeo, smokeMat);

            // 绑定到某个火焰源
            const sourceIdx = Math.floor(Math.random() * this.fireSources.length);
            const source = this.fireSources[sourceIdx];

            smoke.position.set(
                source.x + (Math.random() - 0.5) * 2,
                2 + Math.random() * 5,
                source.z + (Math.random() - 0.5) * 2
            );
            this.scene.add(smoke);
            this.smokeParticles.push({
                mesh: smoke,
                baseX: smoke.position.x,
                baseZ: smoke.position.z,
                speed: 0.3 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                riseSpeed: 0.5 + Math.random() * 0.5,
                maxY: 6 + Math.random() * 4,
                sourceIdx: sourceIdx
            });
        }
    },

    // ========== 地面细节 ==========
    createGroundDetails() {
        // 水坑（雨天会反光）
        this.createPuddles();

        // 地面裂缝（更多细节）
        this.createDetailedCracks();

        // 路面油污
        this.createOilStains();

        // 落叶堆
        this.createLeafPiles();
    },

    createPuddles() {
        const puddleMat = new THREE.MeshLambertMaterial({
            color: 0x223344,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });

        for (let i = 0; i < 12; i++) {
            const size = 1 + Math.random() * 2.5;
            const puddleGeo = new THREE.CircleGeometry(size, 8);
            const puddle = new THREE.Mesh(puddleGeo, puddleMat.clone());
            const pos = City.getRandomWalkablePos();
            puddle.rotation.x = -Math.PI / 2;
            puddle.position.set(pos.x, 0.015, pos.z);
            this.scene.add(puddle);
            this.puddles.push({
                mesh: puddle,
                baseOpacity: 0.2 + Math.random() * 0.2
            });
        }
    },

    createDetailedCracks() {
        const crackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        const crackMat2 = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

        for (let i = 0; i < 30; i++) {
            // 主裂缝
            const len = 0.5 + Math.random() * 3;
            const crackGeo = new THREE.PlaneGeometry(len, 0.03 + Math.random() * 0.05);
            const crack = new THREE.Mesh(crackGeo, Math.random() < 0.5 ? crackMat : crackMat2);
            crack.rotation.x = -Math.PI / 2;
            crack.rotation.z = Math.random() * Math.PI;
            const pos = City.getRandomWalkablePos();
            crack.position.set(pos.x, 0.019, pos.z);
            this.scene.add(crack);

            // 分支裂缝
            if (Math.random() < 0.5) {
                const branchLen = len * 0.4;
                const branchGeo = new THREE.PlaneGeometry(branchLen, 0.02);
                const branch = new THREE.Mesh(branchGeo, crackMat);
                branch.rotation.x = -Math.PI / 2;
                branch.rotation.z = crack.rotation.z + (Math.random() - 0.5) * 1.5;
                branch.position.set(
                    pos.x + (Math.random() - 0.5) * len * 0.3,
                    0.019,
                    pos.z + (Math.random() - 0.5) * len * 0.3
                );
                this.scene.add(branch);
            }
        }
    },

    createOilStains() {
        const oilMat = new THREE.MeshLambertMaterial({
            color: 0x0a0a08,
            transparent: true,
            opacity: 0.5
        });

        for (let i = 0; i < 8; i++) {
            const size = 0.5 + Math.random() * 1.5;
            const oilGeo = new THREE.CircleGeometry(size, 6);
            const oil = new THREE.Mesh(oilGeo, oilMat);
            const pos = City.getRandomWalkablePos();
            oil.rotation.x = -Math.PI / 2;
            oil.position.set(pos.x, 0.016, pos.z);
            this.scene.add(oil);
        }
    },

    createLeafPiles() {
        const leafColors = [0x443311, 0x554422, 0x334411, 0x664422];

        for (let i = 0; i < 15; i++) {
            const pile = new THREE.Group();
            const pos = City.getRandomWalkablePos();

            // 堆状落叶
            for (let j = 0; j < 8; j++) {
                const leafGeo = new THREE.BoxGeometry(
                    0.1 + Math.random() * 0.15,
                    0.02,
                    0.08 + Math.random() * 0.1
                );
                const leafMat = new THREE.MeshLambertMaterial({
                    color: leafColors[Math.floor(Math.random() * leafColors.length)]
                });
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.set(
                    (Math.random() - 0.5) * 0.8,
                    0.01 + Math.random() * 0.05,
                    (Math.random() - 0.5) * 0.8
                );
                leaf.rotation.set(
                    (Math.random() - 0.5) * 0.5,
                    Math.random() * Math.PI,
                    (Math.random() - 0.5) * 0.5
                );
                pile.add(leaf);
            }

            pile.position.set(pos.x, 0, pos.z);
            this.scene.add(pile);
        }
    },

    // ========== 植被 ==========
    createVegetation() {
        this.createDeadTrees();
        this.createGrassPatches();
        this.createBushes();
        this.createIvy();
    },

    createDeadTrees() {
        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        const branchMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });

        for (let i = 0; i < 10; i++) {
            const tree = new THREE.Group();
            const pos = City.getRandomWalkablePos();
            const height = 4 + Math.random() * 5;

            // 树干
            const trunkGeo = new THREE.CylinderGeometry(0.08, 0.15, height, 6);
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = height / 2;
            trunk.castShadow = true;
            tree.add(trunk);

            // 树枝
            const numBranches = 3 + Math.floor(Math.random() * 4);
            for (let b = 0; b < numBranches; b++) {
                const branchLen = 1 + Math.random() * 2;
                const branchGeo = new THREE.CylinderGeometry(0.02, 0.04, branchLen, 4);
                const branch = new THREE.Mesh(branchGeo, branchMat);
                const angle = Math.random() * Math.PI * 2;
                const heightAt = height * 0.4 + Math.random() * height * 0.5;
                branch.position.set(
                    Math.cos(angle) * 0.3,
                    heightAt,
                    Math.sin(angle) * 0.3
                );
                branch.rotation.set(
                    (Math.random() - 0.5) * 0.8,
                    angle,
                    0.5 + Math.random() * 0.8
                );
                tree.add(branch);

                // 小树枝
                if (Math.random() < 0.5) {
                    const twigGeo = new THREE.CylinderGeometry(0.01, 0.02, branchLen * 0.4, 3);
                    const twig = new THREE.Mesh(twigGeo, branchMat);
                    twig.position.copy(branch.position);
                    twig.position.y += 0.3;
                    twig.rotation.set(
                        branch.rotation.x + (Math.random() - 0.5) * 0.5,
                        branch.rotation.y + 0.5,
                        branch.rotation.z + 0.3
                    );
                    tree.add(twig);
                }
            }

            // 树根
            for (let r = 0; r < 3; r++) {
                const rootGeo = new THREE.CylinderGeometry(0.03, 0.06, 0.5, 4);
                const root = new THREE.Mesh(rootGeo, trunkMat);
                const rAngle = (r / 3) * Math.PI * 2;
                root.position.set(
                    Math.cos(rAngle) * 0.2,
                    0.15,
                    Math.sin(rAngle) * 0.2
                );
                root.rotation.z = Math.cos(rAngle) * 0.8;
                root.rotation.x = Math.sin(rAngle) * 0.8;
                tree.add(root);
            }

            tree.position.set(pos.x, 0, pos.z);
            tree.rotation.y = Math.random() * Math.PI * 2;
            // 轻微倾斜（风吹）
            tree.rotation.z = (Math.random() - 0.5) * 0.1;
            this.scene.add(tree);
            this.deadTrees.push(tree);
        }
    },

    createGrassPatches() {
        const grassColors = [0x2a4a1a, 0x3a5a2a, 0x1a3a0a, 0x4a6a3a];

        for (let i = 0; i < 25; i++) {
            const patch = new THREE.Group();
            const pos = City.getRandomWalkablePos();
            const bladeCount = 5 + Math.floor(Math.random() * 10);

            for (let b = 0; b < bladeCount; b++) {
                const height = 0.2 + Math.random() * 0.4;
                const bladeGeo = new THREE.PlaneGeometry(0.03, height);
                const bladeMat = new THREE.MeshLambertMaterial({
                    color: grassColors[Math.floor(Math.random() * grassColors.length)],
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.9
                });
                const blade = new THREE.Mesh(bladeGeo, bladeMat);
                blade.position.set(
                    (Math.random() - 0.5) * 0.6,
                    height / 2,
                    (Math.random() - 0.5) * 0.6
                );
                blade.rotation.y = Math.random() * Math.PI;
                blade.rotation.z = (Math.random() - 0.5) * 0.3;
                patch.add(blade);
            }

            patch.position.set(pos.x, 0, pos.z);
            this.scene.add(patch);
            this.grassPatches.push(patch);
        }
    },

    createBushes() {
        const bushColors = [0x1a3a0a, 0x2a4a1a, 0x0a2a00, 0x3a5a2a];

        for (let i = 0; i < 12; i++) {
            const bush = new THREE.Group();
            const pos = City.getRandomWalkablePos();

            // 灌木丛由多个球体组成
            const numSpheres = 3 + Math.floor(Math.random() * 4);
            for (let s = 0; s < numSpheres; s++) {
                const radius = 0.2 + Math.random() * 0.3;
                const bushGeo = new THREE.SphereGeometry(radius, 6, 6);
                const bushMat = new THREE.MeshLambertMaterial({
                    color: bushColors[Math.floor(Math.random() * bushColors.length)]
                });
                const sphere = new THREE.Mesh(bushGeo, bushMat);
                sphere.position.set(
                    (Math.random() - 0.5) * 0.5,
                    radius * 0.7,
                    (Math.random() - 0.5) * 0.5
                );
                sphere.scale.y = 0.6 + Math.random() * 0.3;
                sphere.castShadow = true;
                bush.add(sphere);
            }

            bush.position.set(pos.x, 0, pos.z);
            this.scene.add(bush);
        }
    },

    createIvy() {
        const ivyMat = new THREE.MeshLambertMaterial({
            color: 0x1a3a0a,
            side: THREE.DoubleSide
        });

        // 在部分建筑上爬藤蔓
        for (let i = 0; i < 15; i++) {
            const pos = City.getRandomWalkablePos();
            // 检查是否靠近建筑
            let nearBuilding = null;
            for (const b of City.buildings) {
                const dist = Math.abs(pos.x - b.centerX) + Math.abs(pos.z - b.centerZ);
                if (dist < 10) {
                    nearBuilding = b;
                    break;
                }
            }
            if (!nearBuilding) continue;

            // 在建筑墙面生成藤蔓
            const ivyHeight = 1 + Math.random() * 3;
            const ivyWidth = 0.5 + Math.random() * 1.5;
            const ivyGeo = new THREE.PlaneGeometry(ivyWidth, ivyHeight);
            const ivy = new THREE.Mesh(ivyGeo, ivyMat);

            // 贴在建筑外墙
            const side = Math.floor(Math.random() * 4);
            const hw = nearBuilding.width / 2;
            const hd = nearBuilding.depth / 2;
            switch (side) {
                case 0: ivy.position.set(nearBuilding.centerX + (Math.random() - 0.5) * hw, ivyHeight / 2, nearBuilding.centerZ + hd + 0.08); break;
                case 1: ivy.position.set(nearBuilding.centerX + (Math.random() - 0.5) * hw, ivyHeight / 2, nearBuilding.centerZ - hd - 0.08); ivy.rotation.y = Math.PI; break;
                case 2: ivy.position.set(nearBuilding.centerX + hw + 0.08, ivyHeight / 2, nearBuilding.centerZ + (Math.random() - 0.5) * hd); ivy.rotation.y = Math.PI / 2; break;
                case 3: ivy.position.set(nearBuilding.centerX - hw - 0.08, ivyHeight / 2, nearBuilding.centerZ + (Math.random() - 0.5) * hd); ivy.rotation.y = -Math.PI / 2; break;
            }
            this.scene.add(ivy);
        }
    },

    // ========== 街道设施 ==========
    createStreetProps() {
        this.createBenches();
        this.createTrafficLights();
        this.createHydrants();
        this.createNewspaperStands();
        this.createFences();
    },

    createBenches() {
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        const metalMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

        for (let i = 0; i < 6; i++) {
            const pos = City.getRandomWalkablePos();
            const bench = new THREE.Group();

            // 座面
            const seatGeo = new THREE.BoxGeometry(1.5, 0.05, 0.4);
            const seat = new THREE.Mesh(seatGeo, woodMat);
            seat.position.y = 0.45;
            bench.add(seat);

            // 靠背
            const backGeo = new THREE.BoxGeometry(1.5, 0.4, 0.04);
            const back = new THREE.Mesh(backGeo, woodMat);
            back.position.set(0, 0.7, -0.18);
            bench.add(back);

            // 扶手/腿
            const legGeo = new THREE.BoxGeometry(0.06, 0.45, 0.4);
            const leg1 = new THREE.Mesh(legGeo, metalMat);
            leg1.position.set(-0.6, 0.225, 0);
            bench.add(leg1);
            const leg2 = new THREE.Mesh(legGeo, metalMat);
            leg2.position.set(0.6, 0.225, 0);
            bench.add(leg2);

            bench.position.set(pos.x, 0, pos.z);
            bench.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(bench);
        }
    },

    createTrafficLights() {
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const boxMat = new THREE.MeshLambertMaterial({ color: 0x222222 });

        for (let i = 0; i < 4; i++) {
            const pos = City.getRandomWalkablePos();
            const light = new THREE.Group();

            // 灯杆
            const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 5, 6);
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.y = 2.5;
            pole.castShadow = true;
            light.add(pole);

            // 灯箱
            const boxGeo = new THREE.BoxGeometry(0.3, 0.8, 0.2);
            const box = new THREE.Mesh(boxGeo, boxMat);
            box.position.set(0, 4.5, 0);
            light.add(box);

            // 红灯
            const redGeo = new THREE.SphereGeometry(0.08, 6, 6);
            const redMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const red = new THREE.Mesh(redGeo, redMat);
            red.position.set(0, 4.75, 0.11);
            light.add(red);

            // 绿灯
            const greenMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const green = new THREE.Mesh(redGeo.clone(), greenMat);
            green.position.set(0, 4.25, 0.11);
            light.add(green);

            light.position.set(pos.x, 0, pos.z);
            this.scene.add(light);
        }
    },

    createHydrants() {
        const hydrantMat = new THREE.MeshLambertMaterial({ color: 0xcc2222 });

        for (let i = 0; i < 8; i++) {
            const pos = City.getRandomWalkablePos();
            const hydrant = new THREE.Group();

            // 主体
            const bodyGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 8);
            const body = new THREE.Mesh(bodyGeo, hydrantMat);
            body.position.y = 0.25;
            hydrant.add(body);

            // 顶部
            const topGeo = new THREE.CylinderGeometry(0.16, 0.12, 0.1, 8);
            const top = new THREE.Mesh(topGeo, hydrantMat);
            top.position.y = 0.55;
            hydrant.add(top);

            // 接口
            const nozzleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6);
            const nozzle = new THREE.Mesh(nozzleGeo, hydrantMat);
            nozzle.position.set(0.12, 0.35, 0);
            nozzle.rotation.z = Math.PI / 2;
            hydrant.add(nozzle);

            hydrant.position.set(pos.x, 0, pos.z);
            this.scene.add(hydrant);
        }
    },

    createNewspaperStands() {
        const standMat = new THREE.MeshLambertMaterial({ color: 0x556677 });

        for (let i = 0; i < 5; i++) {
            const pos = City.getRandomWalkablePos();
            const stand = new THREE.Group();

            const bodyGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
            const body = new THREE.Mesh(bodyGeo, standMat);
            body.position.y = 0.5;
            stand.add(body);

            // 玻璃面
            const glassGeo = new THREE.BoxGeometry(0.55, 0.6, 0.02);
            const glassMat = new THREE.MeshLambertMaterial({
                color: 0x88aacc, transparent: true, opacity: 0.4
            });
            const glass = new THREE.Mesh(glassGeo, glassMat);
            glass.position.set(0, 0.6, 0.21);
            stand.add(glass);

            // 报纸
            const paperGeo = new THREE.BoxGeometry(0.3, 0.4, 0.02);
            const paperMat = new THREE.MeshLambertMaterial({ color: 0xeeeedd });
            const paper = new THREE.Mesh(paperGeo, paperMat);
            paper.position.set(0, 0.6, 0.22);
            stand.add(paper);

            stand.position.set(pos.x, 0, pos.z);
            stand.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(stand);
        }
    },

    createFences() {
        const fenceMat = new THREE.MeshLambertMaterial({ color: 0x444444 });

        for (let i = 0; i < 6; i++) {
            const pos = City.getRandomWalkablePos();
            const fence = new THREE.Group();
            const segments = 3 + Math.floor(Math.random() * 5);

            for (let s = 0; s < segments; s++) {
                // 栏杆柱
                const postGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 4);
                const post = new THREE.Mesh(postGeo, fenceMat);
                post.position.set(s * 0.5, 0.4, 0);
                fence.add(post);

                // 横杆
                if (s < segments - 1) {
                    const railGeo = new THREE.BoxGeometry(0.5, 0.03, 0.03);
                    const rail1 = new THREE.Mesh(railGeo, fenceMat);
                    rail1.position.set(s * 0.5 + 0.25, 0.6, 0);
                    fence.add(rail1);
                    const rail2 = new THREE.Mesh(railGeo, fenceMat);
                    rail2.position.set(s * 0.5 + 0.25, 0.3, 0);
                    fence.add(rail2);
                }
            }

            fence.position.set(pos.x, 0, pos.z);
            fence.rotation.y = Math.random() * Math.PI * 2;
            this.scene.add(fence);
        }
    },

    // ========== 更新循环 ==========
    update(dt, playerPos) {
        this.playerPos = playerPos;

        this.updateDustParticles(dt, playerPos);
        this.updateLeaves(dt);
        this.updateFires(dt);
        this.updateSmoke(dt);
        this.updatePuddles(dt);
    },

    updateDustParticles(dt, playerPos) {
        if (!this.dustParticles) return;
        const positions = this.dustParticles.geometry.attributes.position.array;

        for (let i = 0; i < positions.length; i += 3) {
            // 缓慢漂浮
            positions[i] += Math.sin(Date.now() * 0.001 + i) * 0.01;
            positions[i + 1] += Math.sin(Date.now() * 0.0015 + i * 0.5) * 0.005;
            positions[i + 2] += Math.cos(Date.now() * 0.001 + i) * 0.01;

            // 保持在玩家附近
            const dx = positions[i] - playerPos.x;
            const dz = positions[i + 2] - playerPos.z;
            if (Math.abs(dx) > 60) positions[i] = playerPos.x + (Math.random() - 0.5) * 100;
            if (Math.abs(dz) > 60) positions[i + 2] = playerPos.z + (Math.random() - 0.5) * 100;
            if (positions[i + 1] < 0.3) positions[i + 1] = 0.5 + Math.random() * 5;
            if (positions[i + 1] > 10) positions[i + 1] = 0.5;
        }
        this.dustParticles.geometry.attributes.position.needsUpdate = true;
    },

    updateLeaves(dt) {
        const time = Date.now() * 0.001;
        for (const leaf of this.leafParticles) {
            const m = leaf.mesh;
            // 下落 + 摇摆
            m.position.x += (leaf.velocity.x + Math.sin(time + leaf.swayPhase) * 0.3) * dt;
            m.position.y += leaf.velocity.y * dt;
            m.position.z += (leaf.velocity.z + Math.cos(time * 0.7 + leaf.swayPhase) * 0.3) * dt;

            // 旋转
            m.rotation.x += leaf.rotSpeed.x * dt;
            m.rotation.y += leaf.rotSpeed.y * dt;
            m.rotation.z += leaf.rotSpeed.z * dt;

            // 落地重置
            if (m.position.y < 0.1) {
                m.position.set(
                    this.playerPos.x + (Math.random() - 0.5) * 80,
                    5 + Math.random() * 5,
                    this.playerPos.z + (Math.random() - 0.5) * 80
                );
            }
        }
    },

    updateFires(dt) {
        const time = Date.now() * 0.001;
        for (const fire of this.fireSources) {
            fire.timer += dt;

            // 火焰粒子跳动
            for (const p of fire.particles) {
                const t = time * p.speed + p.phase;
                p.mesh.position.y = p.baseY + Math.sin(t * 3) * 0.1 + Math.sin(t * 7) * 0.05;
                p.mesh.position.x = fire.x + Math.sin(t * 2) * 0.1;
                p.mesh.position.z = fire.z + Math.cos(t * 2.5) * 0.1;

                // 大小变化
                const scale = 0.8 + Math.sin(t * 5) * 0.3;
                p.mesh.scale.set(scale, scale * 1.2, 1);

                // 朝向相机
                if (this.playerPos) {
                    p.mesh.lookAt(this.playerPos.x, p.mesh.position.y, this.playerPos.z);
                }

                // 颜色闪烁（橙→黄→红）
                const hue = 0.05 + Math.sin(t * 4) * 0.03;
                const light = 0.4 + Math.sin(t * 6) * 0.15;
                p.mesh.material.color.setHSL(hue, 0.9, light);
            }

            // 火光闪烁
            fire.light.intensity = 1.2 + Math.sin(time * 8 + fire.x) * 0.5;
            fire.light.color.setHSL(
                0.06 + Math.sin(time * 5) * 0.02,
                0.8,
                0.5
            );
        }
    },

    updateSmoke(dt) {
        const time = Date.now() * 0.001;
        for (const smoke of this.smokeParticles) {
            const m = smoke.mesh;
            // 上升
            m.position.y += smoke.riseSpeed * dt;
            // 水平漂移
            m.position.x = smoke.baseX + Math.sin(time * smoke.speed + smoke.phase) * 1.5;
            m.position.z = smoke.baseZ + Math.cos(time * smoke.speed * 0.7 + smoke.phase) * 1.5;

            // 扩散变淡
            const progress = (m.position.y - 2) / (smoke.maxY - 2);
            m.material.opacity = Math.max(0, 0.2 * (1 - progress));
            const scale = 1 + progress * 2;
            m.scale.set(scale, scale, 1);

            // 到达最大高度后重置
            if (m.position.y > smoke.maxY) {
                const source = this.fireSources[smoke.sourceIdx];
                if (source) {
                    m.position.set(
                        source.x + (Math.random() - 0.5) * 1,
                        2,
                        source.z + (Math.random() - 0.5) * 1
                    );
                }
            }

            // 始终朝向相机
            if (this.playerPos) {
                m.lookAt(this.playerPos.x, m.position.y, this.playerPos.z);
            }
        }
    },

    updatePuddles(dt) {
        // 雨天时水坑更明显
        const isRainy = Weather.weather === 'rainy';
        for (const puddle of this.puddles) {
            const targetOpacity = isRainy ? puddle.baseOpacity + 0.3 : puddle.baseOpacity;
            puddle.mesh.material.opacity += (targetOpacity - puddle.mesh.material.opacity) * dt * 2;

            // 雨天水坑涟漪效果（通过缩放模拟）
            if (isRainy) {
                const scale = 1 + Math.sin(Date.now() * 0.005 + puddle.mesh.id) * 0.02;
                puddle.mesh.scale.set(scale, scale, 1);
            }
        }
    },

    // 重置
    reset() {
        // 粒子会自动跟随玩家，无需重置
    }
};
