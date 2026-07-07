// city.js - 城市废墟生成系统
const City = {
    buildings: [],       // 所有建筑碰撞体
    blockSize: 20,       // 街区大小
    gridSize: 8,         // 网格数量 (8x8)
    roadWidth: 6,        // 道路宽度
    citySize: 0,         // 城市总尺寸

    // 生成城市
    generate(scene) {
        this.buildings = [];
        this.citySize = this.gridSize * this.blockSize;

        // 地面
        const groundGeo = new THREE.PlaneGeometry(this.citySize + 40, this.citySize + 40);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        scene.add(ground);

        // 道路网格线
        this.createRoads(scene);

        // 生成建筑
        for (let gx = 0; gx < this.gridSize; gx++) {
            for (let gz = 0; gz < this.gridSize; gz++) {
                this.generateBlock(scene, gx, gz);
            }
        }

        // 添加一些废墟装饰
        this.addDebris(scene);

        return this.buildings;
    },

    // 创建道路
    createRoads(scene) {
        const roadMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const halfCity = this.citySize / 2;

        // 横向道路
        for (let i = 0; i <= this.gridSize; i++) {
            const z = -halfCity + i * this.blockSize;
            const roadGeo = new THREE.PlaneGeometry(this.citySize + 40, this.roadWidth);
            const road = new THREE.Mesh(roadGeo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(0, 0.01, z);
            scene.add(road);
        }

        // 纵向道路
        for (let i = 0; i <= this.gridSize; i++) {
            const x = -halfCity + i * this.blockSize;
            const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.citySize + 40);
            const road = new THREE.Mesh(roadGeo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(x, 0.01, 0);
            scene.add(road);
        }
    },

    // 生成一个街区的建筑
    generateBlock(scene, gx, gz) {
        const halfCity = this.citySize / 2;
        const blockX = -halfCity + gx * this.blockSize + this.blockSize / 2;
        const blockZ = -halfCity + gz * this.blockSize + this.blockSize / 2;
        const innerSize = this.blockSize - this.roadWidth;

        // 每个街区随机1-4栋建筑
        const numBuildings = 1 + Math.floor(Math.random() * 4);

        if (numBuildings === 1) {
            // 单栋大建筑
            this.createBuilding(scene, blockX, blockZ, innerSize * 0.8, innerSize * 0.8);
        } else {
            // 多栋小建筑
            const cols = Math.ceil(Math.sqrt(numBuildings));
            const rows = Math.ceil(numBuildings / cols);
            const subW = innerSize / cols - 1;
            const subD = innerSize / rows - 1;

            let count = 0;
            for (let r = 0; r < rows && count < numBuildings; r++) {
                for (let c = 0; c < cols && count < numBuildings; c++) {
                    const bx = blockX - innerSize / 2 + (c + 0.5) * (innerSize / cols);
                    const bz = blockZ - innerSize / 2 + (r + 0.5) * (innerSize / rows);
                    const w = subW * (0.6 + Math.random() * 0.4);
                    const d = subD * (0.6 + Math.random() * 0.4);
                    this.createBuilding(scene, bx, bz, w, d);
                    count++;
                }
            }
        }
    },

    // 创建单栋建筑
    createBuilding(scene, x, z, width, depth) {
        const height = 3 + Math.random() * 12;

        // 废墟效果：随机倾斜和损坏
        const isRuined = Math.random() < 0.3;
        const tiltX = isRuined ? (Math.random() - 0.5) * 0.15 : 0;
        const tiltZ = isRuined ? (Math.random() - 0.5) * 0.15 : 0;
        const actualHeight = isRuined ? height * (0.5 + Math.random() * 0.5) : height;

        // 建筑颜色：灰褐色系
        const colors = [0x4a4a4a, 0x3d3d3d, 0x555555, 0x4d4040, 0x3a3a44];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const geo = new THREE.BoxGeometry(width, actualHeight, depth);
        const mat = new THREE.MeshLambertMaterial({ color: color });
        const building = new THREE.Mesh(geo, mat);

        building.position.set(x, actualHeight / 2, z);
        building.rotation.x = tiltX;
        building.rotation.z = tiltZ;
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);

        // 碰撞体（使用未倾斜的AABB）
        this.buildings.push({
            mesh: building,
            minX: x - width / 2 - 0.5,
            maxX: x + width / 2 + 0.5,
            minZ: z - depth / 2 - 0.5,
            maxZ: z + depth / 2 + 0.5,
            height: actualHeight
        });

        // 窗户效果（在建筑侧面添加小方块）
        if (actualHeight > 4 && !isRuined) {
            this.addWindows(scene, x, z, width, depth, actualHeight);
        }
    },

    // 添加窗户
    addWindows(scene, bx, bz, width, depth, height) {
        const windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
        const windowSize = 0.6;
        const spacing = 2.5;

        for (let y = 2; y < height - 1; y += spacing) {
            // 前后两面
            for (let x = -width / 2 + 1; x < width / 2 - 0.5; x += spacing) {
                if (Math.random() < 0.7) {
                    const win = new THREE.Mesh(
                        new THREE.BoxGeometry(windowSize, windowSize, 0.1),
                        windowMat
                    );
                    win.position.set(bx + x, y, bz + depth / 2 + 0.05);
                    scene.add(win);

                    const win2 = win.clone();
                    win2.position.z = bz - depth / 2 - 0.05;
                    scene.add(win2);
                }
            }
        }
    },

    // 添加废墟碎片
    addDebris(scene) {
        const debrisMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        const halfCity = this.citySize / 2;

        for (let i = 0; i < 50; i++) {
            const size = 0.3 + Math.random() * 1.5;
            const geo = new THREE.BoxGeometry(size, size * 0.3, size);
            const debris = new THREE.Mesh(geo, debrisMat);
            debris.position.set(
                (Math.random() - 0.5) * this.citySize,
                size * 0.15,
                (Math.random() - 0.5) * this.citySize
            );
            debris.rotation.y = Math.random() * Math.PI;
            scene.add(debris);
        }

        // 倒塌的电线杆
        const poleMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        for (let i = 0; i < 8; i++) {
            const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 6, 6);
            const pole = new THREE.Mesh(poleGeo, poleMat);
            pole.position.set(
                (Math.random() - 0.5) * this.citySize,
                0.5,
                (Math.random() - 0.5) * this.citySize
            );
            pole.rotation.z = (Math.random() - 0.5) * 1.2;
            pole.rotation.x = (Math.random() - 0.5) * 0.3;
            scene.add(pole);
        }
    },

    // 检查位置是否在建筑内
    isInBuilding(x, z) {
        for (const b of this.buildings) {
            if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
                return true;
            }
        }
        return false;
    },

    // 获取随机可通行位置
    getRandomWalkablePos() {
        const halfCity = this.citySize / 2;
        let x, z;
        let attempts = 0;
        do {
            x = (Math.random() - 0.5) * this.citySize;
            z = (Math.random() - 0.5) * this.citySize;
            attempts++;
        } while (this.isInBuilding(x, z) && attempts < 100);
        return { x, z };
    },

    // 简单碰撞检测：移动时推开建筑
    resolveCollision(pos, radius) {
        for (const b of this.buildings) {
            // 扩展碰撞体
            const expandedMinX = b.minX - radius;
            const expandedMaxX = b.maxX + radius;
            const expandedMinZ = b.minZ - radius;
            const expandedMaxZ = b.maxZ + radius;

            if (pos.x > expandedMinX && pos.x < expandedMaxX &&
                pos.z > expandedMinZ && pos.z < expandedMaxZ) {

                // 找到最近的边推出去
                const dx1 = pos.x - expandedMinX;
                const dx2 = expandedMaxX - pos.x;
                const dz1 = pos.z - expandedMinZ;
                const dz2 = expandedMaxZ - pos.z;

                const minDist = Math.min(dx1, dx2, dz1, dz2);

                if (minDist === dx1) pos.x = expandedMinX;
                else if (minDist === dx2) pos.x = expandedMaxX;
                else if (minDist === dz1) pos.z = expandedMinZ;
                else pos.z = expandedMaxZ;
            }
        }
        return pos;
    }
};
