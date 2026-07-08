// city.js - 城市废墟生成系统（增强版：可进入建筑 + 室内细节）
const City = {
    buildings: [],
    blockSize: 20,
    gridSize: 8,
    roadWidth: 6,
    citySize: 0,

    // 建筑类型定义
    buildingTypes: [
        { id: 'shop', name: '商店', weight: 20 },
        { id: 'restaurant', name: '餐厅', weight: 15 },
        { id: 'bar', name: '酒楼', weight: 12 },
        { id: 'tower', name: '大厦', weight: 15 },
        { id: 'hospital', name: '医院', weight: 10 },
        { id: 'school', name: '学校', weight: 10 },
        { id: 'mall', name: '商场', weight: 10 },
        { id: 'police', name: '警察局', weight: 8 }
    ],

    // 当前楼层追踪（供player.js查询）
    currentFloorInfo: { floor: 0, totalFloors: 0, inBuilding: false, buildingType: '' },

    // 室内材质
    mat: {},

    // 预创建材质
    initMaterials() {
        this.mat = {
            interiorWall: new THREE.MeshLambertMaterial({ color: 0x3d3530, side: THREE.DoubleSide }),
            floor: new THREE.MeshLambertMaterial({ color: 0x2a2520, side: THREE.DoubleSide }),
            ceiling: new THREE.MeshLambertMaterial({ color: 0x333025, side: THREE.DoubleSide }),
            doorFrame: new THREE.MeshLambertMaterial({ color: 0x22201a }),
            wood: new THREE.MeshLambertMaterial({ color: 0x554433 }),
            metal: new THREE.MeshLambertMaterial({ color: 0x666666 }),
            glass: new THREE.MeshLambertMaterial({ color: 0x1a2a3a, transparent: true, opacity: 0.5 }),
            blood: new THREE.MeshLambertMaterial({ color: 0x440000, side: THREE.DoubleSide }),
            cloth: new THREE.MeshLambertMaterial({ color: 0x3a2a1a, side: THREE.DoubleSide }),
            bottle: new THREE.MeshLambertMaterial({ color: 0x225522 }),
            screen: new THREE.MeshBasicMaterial({ color: 0x003311 }),
            lampShade: new THREE.MeshLambertMaterial({ color: 0x665533, side: THREE.DoubleSide }),
            // 医院
            hospitalWall: new THREE.MeshLambertMaterial({ color: 0xdddde8, side: THREE.DoubleSide }),
            hospitalFloor: new THREE.MeshLambertMaterial({ color: 0x88aa88, side: THREE.DoubleSide }),
            hospitalBed: new THREE.MeshLambertMaterial({ color: 0xcccccc }),
            medicalEquip: new THREE.MeshLambertMaterial({ color: 0x99aacc }),
            redCross: new THREE.MeshBasicMaterial({ color: 0xff2222 }),
            // 学校
            schoolWall: new THREE.MeshLambertMaterial({ color: 0xe8e0d0, side: THREE.DoubleSide }),
            schoolFloor: new THREE.MeshLambertMaterial({ color: 0xaa9977, side: THREE.DoubleSide }),
            chalkboard: new THREE.MeshLambertMaterial({ color: 0x1a3a1a }),
            deskWood: new THREE.MeshLambertMaterial({ color: 0x8a7a5a }),
            // 商场
            mallFloor: new THREE.MeshLambertMaterial({ color: 0x999088, side: THREE.DoubleSide }),
            mallWall: new THREE.MeshLambertMaterial({ color: 0xc0b8a8, side: THREE.DoubleSide }),
            neonSign: new THREE.MeshBasicMaterial({ color: 0xff44aa }),
            tileFloor: new THREE.MeshLambertMaterial({ color: 0xbbaa99, side: THREE.DoubleSide }),
            // 警察局
            policeWall: new THREE.MeshLambertMaterial({ color: 0x8899aa, side: THREE.DoubleSide }),
            policeFloor: new THREE.MeshLambertMaterial({ color: 0x667788, side: THREE.DoubleSide }),
            jailBar: new THREE.MeshLambertMaterial({ color: 0x555555 }),
            // 楼梯
            stairStep: new THREE.MeshLambertMaterial({ color: 0x555550 }),
            stairRail: new THREE.MeshLambertMaterial({ color: 0x666666 }),
        };
    },

    // ========== 主生成 ==========
    generate(scene) {
        this.buildings = [];
        this.citySize = this.gridSize * this.blockSize;
        this.initMaterials();

        // 地面
        const groundGeo = new THREE.PlaneGeometry(this.citySize + 40, this.citySize + 40);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        scene.add(ground);

        this.createRoads(scene);

        for (let gx = 0; gx < this.gridSize; gx++) {
            for (let gz = 0; gz < this.gridSize; gz++) {
                this.generateBlock(scene, gx, gz);
            }
        }

        this.addStreetLamps(scene);
        this.addGarbage(scene);
        this.addDebris(scene);

        return this.buildings;
    },

    // ========== 道路 ==========
    createRoads(scene) {
        const roadMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        const lineMat = new THREE.MeshLambertMaterial({ color: 0x555533 });
        const halfCity = this.citySize / 2;

        for (let i = 0; i <= this.gridSize; i++) {
            const z = -halfCity + i * this.blockSize;
            const roadGeo = new THREE.PlaneGeometry(this.citySize + 40, this.roadWidth);
            const road = new THREE.Mesh(roadGeo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(0, 0.01, z);
            scene.add(road);

            // 路面标线
            const lineGeo = new THREE.PlaneGeometry(this.citySize + 40, 0.15);
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.015, z);
            scene.add(line);
        }

        for (let i = 0; i <= this.gridSize; i++) {
            const x = -halfCity + i * this.blockSize;
            const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.citySize + 40);
            const road = new THREE.Mesh(roadGeo, roadMat);
            road.rotation.x = -Math.PI / 2;
            road.position.set(x, 0.01, 0);
            scene.add(road);

            const lineGeo = new THREE.PlaneGeometry(0.15, this.citySize + 40);
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(x, 0.015, 0);
            scene.add(line);
        }
    },

    // ========== 街区生成 ==========
    generateBlock(scene, gx, gz) {
        const halfCity = this.citySize / 2;
        const blockX = -halfCity + gx * this.blockSize + this.blockSize / 2;
        const blockZ = -halfCity + gz * this.blockSize + this.blockSize / 2;
        const innerSize = this.blockSize - this.roadWidth;

        const numBuildings = 1 + Math.floor(Math.random() * 4);

        if (numBuildings === 1) {
            const isEnterable = Math.random() < 0.5;
            const type = this.pickBuildingType();
            this.createBuilding(scene, blockX, blockZ, innerSize * 0.8, innerSize * 0.8, isEnterable, type);
        } else {
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
                    const isEnterable = Math.random() < 0.5;
                    const type = this.pickBuildingType();
                    this.createBuilding(scene, bx, bz, w, d, isEnterable, type);
                    count++;
                }
            }
        }
    },

    // 随机选择建筑类型
    pickBuildingType() {
        const total = this.buildingTypes.reduce((s, t) => s + t.weight, 0);
        let r = Math.random() * total;
        for (const t of this.buildingTypes) {
            r -= t.weight;
            if (r <= 0) return t.id;
        }
        return 'shop';
    },

    // ========== 创建建筑 ==========
    createBuilding(scene, x, z, width, depth, isEnterable, buildingType) {
        const height = 3 + Math.random() * 12;
        const isRuined = Math.random() < 0.3;
        const tiltX = isRuined ? (Math.random() - 0.5) * 0.15 : 0;
        const tiltZ = isRuined ? (Math.random() - 0.5) * 0.15 : 0;
        const actualHeight = isRuined ? height * (0.5 + Math.random() * 0.5) : height;

        // 过小的建筑不做成可进入
        if (width < 5 || depth < 5) isEnterable = false;

        const colors = [0x4a4a4a, 0x3d3d3d, 0x555555, 0x4d4040, 0x3a3a44];
        const color = colors[Math.floor(Math.random() * colors.length)];

        if (isEnterable && !isRuined) {
            this.createEnterableBuilding(scene, x, z, width, depth, actualHeight, buildingType);
        } else {
            this.createSolidBuilding(scene, x, z, width, depth, actualHeight, color, tiltX, tiltZ, isRuined);
        }
    },

    // ========== 实心建筑（不可进入）==========
    createSolidBuilding(scene, x, z, width, depth, height, color, tiltX, tiltZ, isRuined) {
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshLambertMaterial({ color: color });
        const building = new THREE.Mesh(geo, mat);
        building.position.set(x, height / 2, z);
        building.rotation.x = tiltX;
        building.rotation.z = tiltZ;
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);

        this.buildings.push({
            mesh: building,
            minX: x - width / 2 - 0.5,
            maxX: x + width / 2 + 0.5,
            minZ: z - depth / 2 - 0.5,
            maxZ: z + depth / 2 + 0.5,
            height: height,
            enterable: false
        });

        if (height > 4 && !isRuined) {
            this.addWindows(scene, x, z, width, depth, height);
        }
    },

    // ========== 可进入建筑 ==========
    createEnterableBuilding(scene, x, z, width, depth, height, buildingType) {
        const exteriorColor = {
            shop: 0x55504a, restaurant: 0x4a4040, bar: 0x3a3540, tower: 0x4a4a55,
            hospital: 0xccccdd, school: 0xddccaa, mall: 0xaa9988, police: 0x7788aa
        }[buildingType] || 0x55504a;

        // 外壳（实心，稍后会被挖空的感觉）
        const shellGeo = new THREE.BoxGeometry(width, height, depth);
        const shellMat = new THREE.MeshLambertMaterial({
            color: exteriorColor,
            side: THREE.BackSide
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        shell.position.set(x, height / 2, z);
        shell.castShadow = true;
        shell.receiveShadow = true;
        scene.add(shell);

        // 门廊（入口标记）
        const entranceDir = Math.floor(Math.random() * 4);
        this.createDoorFrame(scene, x, z, width, depth, height, entranceDir);

        // 窗户
        this.addWindows(scene, x, z, width, depth, height, entranceDir);

        // 品牌标识
        this.addBuildingSign(scene, x, z, width, depth, height, buildingType, entranceDir);

        // 内部楼层 + 布局
        const buildingData = {
            mesh: shell,
            minX: x - width / 2,
            maxX: x + width / 2,
            minZ: z - depth / 2,
            maxZ: z + depth / 2,
            height: height,
            enterable: true,
            wallSegments: [],
            upperWallSegments: null,
            doorDir: entranceDir,
            centerX: x,
            centerZ: z,
            width: width,
            depth: depth,
            buildingType: buildingType
        };
        buildingData.wallSegments = this.buildInterior(scene, x, z, width, depth, height, buildingType, entranceDir, buildingData);
        this.buildings.push(buildingData);
    },

    // ========== 门框 ==========
    createDoorFrame(scene, x, z, width, depth, height, dir) {
        const doorW = 2.0, doorH = 2.4;
        const frameMat = this.mat.doorFrame;
        const postGeo = new THREE.BoxGeometry(0.15, doorH, 0.15);
        const topGeo = new THREE.BoxGeometry(doorW + 0.3, 0.15, 0.15);

        const positions = this.getDoorWallPos(x, z, width, depth, dir);

        // 门柱
        const leftPost = new THREE.Mesh(postGeo, frameMat);
        leftPost.position.set(positions.left[0], doorH / 2, positions.left[1]);
        leftPost.castShadow = true;
        scene.add(leftPost);

        const rightPost = new THREE.Mesh(postGeo, frameMat);
        rightPost.position.set(positions.right[0], doorH / 2, positions.right[1]);
        rightPost.castShadow = true;
        scene.add(rightPost);

        // 门楣
        const topBeam = new THREE.Mesh(topGeo, frameMat);
        topBeam.position.set(positions.top[0], doorH, positions.top[1]);
        scene.add(topBeam);

        // 地面门槛标记
        const stepGeo = new THREE.BoxGeometry(doorW, 0.08, 0.4);
        const stepMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const step = new THREE.Mesh(stepGeo, stepMat);
        step.position.set(positions.step[0], 0.04, positions.step[1]);
        scene.add(step);
    },

    // 获取门墙位置
    getDoorWallPos(x, z, width, depth, dir) {
        switch (dir) {
            case 0: return { // 前面（+Z）
                left: [x - 1, z + depth / 2], right: [x + 1, z + depth / 2],
                top: [x, z + depth / 2], step: [x, z + depth / 2 - 0.1]
            };
            case 1: return { // 后面（-Z）
                left: [x - 1, z - depth / 2], right: [x + 1, z - depth / 2],
                top: [x, z - depth / 2], step: [x, z - depth / 2 + 0.1]
            };
            case 2: return { // 右面（+X）
                left: [x + width / 2, z - 1], right: [x + width / 2, z + 1],
                top: [x + width / 2, z], step: [x + width / 2 - 0.1, z]
            };
            case 3: return { // 左面（-X）
                left: [x - width / 2, z - 1], right: [x - width / 2, z + 1],
                top: [x - width / 2, z], step: [x - width / 2 + 0.1, z]
            };
        }
    },

    // ========== 窗户 ==========
    addWindows(scene, bx, bz, width, depth, height, entranceDir) {
        const windowMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
        const glowMat = new THREE.MeshBasicMaterial({ color: 0x0a0a15 });
        const windowSize = 0.6;
        const spacing = 2.5;

        for (let y = 2; y < height - 1; y += spacing) {
            for (let x = -width / 2 + 1; x < width / 2 - 0.5; x += spacing) {
                if (Math.random() < 0.7) {
                    // 前面
                    if (entranceDir !== 0 || Math.abs(x) > 1.5) {
                        const win = new THREE.Mesh(
                            new THREE.BoxGeometry(windowSize, windowSize, 0.1),
                            Math.random() < 0.3 ? windowMat : glowMat
                        );
                        win.position.set(bx + x, y, bz + depth / 2 + 0.05);
                        scene.add(win);
                    }
                    // 后面
                    if (entranceDir !== 1 || Math.abs(x) > 1.5) {
                        const win2 = new THREE.Mesh(
                            new THREE.BoxGeometry(windowSize, windowSize, 0.1),
                            Math.random() < 0.3 ? windowMat : glowMat
                        );
                        win2.position.set(bx + x, y, bz - depth / 2 - 0.05);
                        scene.add(win2);
                    }
                }
            }
            for (let z = -depth / 2 + 1; z < depth / 2 - 0.5; z += spacing) {
                if (Math.random() < 0.7) {
                    // 右面
                    if (entranceDir !== 2 || Math.abs(z) > 1.5) {
                        const win3 = new THREE.Mesh(
                            new THREE.BoxGeometry(0.1, windowSize, windowSize),
                            Math.random() < 0.3 ? windowMat : glowMat
                        );
                        win3.position.set(bx + width / 2 + 0.05, y, bz + z);
                        scene.add(win3);
                    }
                    // 左面
                    if (entranceDir !== 3 || Math.abs(z) > 1.5) {
                        const win4 = new THREE.Mesh(
                            new THREE.BoxGeometry(0.1, windowSize, windowSize),
                            Math.random() < 0.3 ? windowMat : glowMat
                        );
                        win4.position.set(bx - width / 2 - 0.05, y, bz + z);
                        scene.add(win4);
                    }
                }
            }
        }
    },

    // ========== 品牌标识 ==========
    addBuildingSign(scene, x, z, width, depth, height, type, dir) {
        const signColors = {
            shop: 0x2277aa, restaurant: 0xaa3322, bar: 0x9944aa, tower: 0x446688,
            hospital: 0xee4444, school: 0x44aa44, mall: 0xee8800, police: 0x3344aa
        };
        const signNames = {
            shop: '商店', restaurant: '餐厅', bar: '酒楼', tower: '大厦',
            hospital: '医院', school: '学校', mall: '商场', police: '警察局'
        };

        const signGeo = new THREE.BoxGeometry(3, 0.8, 0.1);
        const signMat = new THREE.MeshBasicMaterial({ color: signColors[type] });
        const sign = new THREE.Mesh(signGeo, signMat);

        const pos = this.getSignPosition(x, z, width, depth, dir);
        sign.position.set(pos[0], height * 0.65, pos[1]);
        scene.add(sign);
    },

    getSignPosition(x, z, width, depth, dir) {
        switch (dir) {
            case 0: return [x, z + depth / 2 + 0.15];
            case 1: return [x, z - depth / 2 - 0.15];
            case 2: return [x + width / 2 + 0.15, z];
            case 3: return [x - width / 2 - 0.15, z];
        }
    },

    // ========== 室内布局 ==========
    buildInterior(scene, x, z, width, depth, height, type, doorDir, buildingData) {
        const wallSegments = [];
        const interiorH = Math.min(height, 3.2);
        const t = this.mat;

        // 1. 内墙壁（带门洞）
        const hw = width / 2, hd = depth / 2;
        const doorHW = 1.0; // 门半宽

        // 四面墙的碰撞段
        // 前墙 (+Z)
        if (doorDir === 0) {
            wallSegments.push({ x1: x - hw, z1: z + hd, x2: x - doorHW, z2: z + hd });
            wallSegments.push({ x1: x + doorHW, z1: z + hd, x2: x + hw, z2: z + hd });
            this.addWallMesh(scene, x - (hw + doorHW) / 2, z + hd, hw - doorHW, 0.12, interiorH, 'z');
            this.addWallMesh(scene, x + (hw + doorHW) / 2, z + hd, hw - doorHW, 0.12, interiorH, 'z');
        } else {
            wallSegments.push({ x1: x - hw, z1: z + hd, x2: x + hw, z2: z + hd });
            this.addWallMesh(scene, x, z + hd, width, 0.12, interiorH, 'z');
        }
        // 后墙 (-Z)
        if (doorDir === 1) {
            wallSegments.push({ x1: x - hw, z1: z - hd, x2: x - doorHW, z2: z - hd });
            wallSegments.push({ x1: x + doorHW, z1: z - hd, x2: x + hw, z2: z - hd });
            this.addWallMesh(scene, x - (hw + doorHW) / 2, z - hd, hw - doorHW, 0.12, interiorH, 'z');
            this.addWallMesh(scene, x + (hw + doorHW) / 2, z - hd, hw - doorHW, 0.12, interiorH, 'z');
        } else {
            wallSegments.push({ x1: x - hw, z1: z - hd, x2: x + hw, z2: z - hd });
            this.addWallMesh(scene, x, z - hd, width, 0.12, interiorH, 'z');
        }
        // 右墙 (+X)
        if (doorDir === 2) {
            wallSegments.push({ x1: x + hw, z1: z - hd, x2: x + hw, z2: z - doorHW });
            wallSegments.push({ x1: x + hw, z1: z + doorHW, x2: x + hw, z2: z + hd });
            this.addWallMesh(scene, x + hw, z - (hd + doorHW) / 2, 0.12, hd - doorHW, interiorH, 'x');
            this.addWallMesh(scene, x + hw, z + (hd + doorHW) / 2, 0.12, hd - doorHW, interiorH, 'x');
        } else {
            wallSegments.push({ x1: x + hw, z1: z - hd, x2: x + hw, z2: z + hd });
            this.addWallMesh(scene, x + hw, z, 0.12, depth, interiorH, 'x');
        }
        // 左墙 (-X)
        if (doorDir === 3) {
            wallSegments.push({ x1: x - hw, z1: z - hd, x2: x - hw, z2: z - doorHW });
            wallSegments.push({ x1: x - hw, z1: z + doorHW, x2: x - hw, z2: z + hd });
            this.addWallMesh(scene, x - hw, z - (hd + doorHW) / 2, 0.12, hd - doorHW, interiorH, 'x');
            this.addWallMesh(scene, x - hw, z + (hd + doorHW) / 2, 0.12, hd - doorHW, interiorH, 'x');
        } else {
            wallSegments.push({ x1: x - hw, z1: z - hd, x2: x - hw, z2: z + hd });
            this.addWallMesh(scene, x - hw, z, 0.12, depth, interiorH, 'x');
        }

        // 2. 地板
        const floorGeo = new THREE.PlaneGeometry(width - 0.24, depth - 0.24);
        const floor = new THREE.Mesh(floorGeo, this.mat.floor);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(x, 0.01, z);
        floor.receiveShadow = true;
        scene.add(floor);

        // 3. 天花板
        const ceilGeo = new THREE.PlaneGeometry(width - 0.24, depth - 0.24);
        const ceil = new THREE.Mesh(ceilGeo, this.mat.ceiling);
        ceil.rotation.x = Math.PI / 2;
        ceil.position.set(x, interiorH, z);
        scene.add(ceil);

        // 4. 根据类型布置室内
        switch (type) {
            case 'shop': this.layoutShop(scene, x, z, width, depth, interiorH); break;
            case 'restaurant': this.layoutRestaurant(scene, x, z, width, depth, interiorH); break;
            case 'bar': this.layoutBar(scene, x, z, width, depth, interiorH); break;
            case 'tower': this.layoutTower(scene, x, z, width, depth, interiorH); break;
            case 'hospital': this.layoutHospital(scene, x, z, width, depth, interiorH); break;
            case 'school': this.layoutSchool(scene, x, z, width, depth, interiorH); break;
            case 'mall': this.layoutMall(scene, x, z, width, depth, interiorH); break;
            case 'police': this.layoutPolice(scene, x, z, width, depth, interiorH); break;
        }

        // 4.5 多层建筑：生成楼层和楼梯
        const floorHeight = 3.2;
        const totalFloors = Math.max(1, Math.floor(height / floorHeight));
        if (totalFloors > 1) {
            this.buildMultiFloor(scene, x, z, width, depth, height, totalFloors, floorHeight, type, doorDir, buildingData);
        }

        // 5. 通用氛围装饰
        this.addInteriorDecor(scene, x, z, width, depth, interiorH);

        // 6. 室内灯光
        this.addInteriorLights(scene, x, z, width, depth, interiorH, type);

        return wallSegments;
    },

    // 内墙壁网格
    addWallMesh(scene, cx, cz, w, d, h, axis) {
        const geo = axis === 'z'
            ? new THREE.BoxGeometry(w, h, d)
            : new THREE.BoxGeometry(d, h, w);
        const wall = new THREE.Mesh(geo, this.mat.interiorWall);
        wall.position.set(cx, h / 2, cz);
        wall.castShadow = true;
        wall.receiveShadow = true;
        scene.add(wall);
    },

    // ========== 商店布局 ==========
    layoutShop(scene, x, z, width, depth, h) {
        const hw = width / 2, hd = depth / 2;

        // 收银台（靠近入口）
        const counterGeo = new THREE.BoxGeometry(2, 1.0, 0.8);
        const counter = new THREE.Mesh(counterGeo, this.mat.wood);
        counter.position.set(x + 1, 0.5, z + hd - 2);
        counter.castShadow = true;
        scene.add(counter);

        // 收银机
        const regGeo = new THREE.BoxGeometry(0.4, 0.3, 0.3);
        const reg = new THREE.Mesh(regGeo, this.mat.metal);
        reg.position.set(x + 1, 1.15, z + hd - 2);
        scene.add(reg);

        // 货架
        const shelfMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        const shelfPositions = [
            [x - hw + 1.5, z], [x - hw + 1.5, z - 3],
            [x + hw - 1.5, z], [x + hw - 1.5, z - 3]
        ];
        const boxColors = [0x884422, 0x225588, 0x448822, 0x882244, 0x888822];

        for (const sp of shelfPositions) {
            if (sp[0] > x - hw + 0.5 && sp[0] < x + hw - 0.5 &&
                sp[1] > z - hd + 0.5 && sp[1] < z + hd - 0.5) {
                // 货架主体
                const shelfGeo = new THREE.BoxGeometry(0.8, 2.0, 1.5);
                const shelf = new THREE.Mesh(shelfGeo, shelfMat);
                shelf.position.set(sp[0], 1.0, sp[1]);
                shelf.castShadow = true;
                scene.add(shelf);

                // 货架上的商品
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 2; col++) {
                        if (Math.random() < 0.6) {
                            const itemGeo = new THREE.BoxGeometry(0.25, 0.2, 0.25);
                            const itemMat = new THREE.MeshLambertMaterial({
                                color: boxColors[Math.floor(Math.random() * boxColors.length)]
                            });
                            const item = new THREE.Mesh(itemGeo, itemMat);
                            item.position.set(
                                sp[0] + (col - 0.5) * 0.3,
                                0.4 + row * 0.65,
                                sp[1] + (Math.random() - 0.5) * 0.8
                            );
                            item.rotation.y = Math.random() * Math.PI;
                            scene.add(item);
                        }
                    }
                }
            }
        }

        // 冰柜
        const fridgeGeo = new THREE.BoxGeometry(1.5, 1.8, 0.8);
        const fridgeMat = new THREE.MeshLambertMaterial({ color: 0x888899 });
        const fridge = new THREE.Mesh(fridgeGeo, fridgeMat);
        fridge.position.set(x + hw - 1.2, 0.9, z + hd - 1.5);
        fridge.castShadow = true;
        scene.add(fridge);
    },

    // ========== 餐厅布局 ==========
    layoutRestaurant(scene, x, z, width, depth, h) {
        const hw = width / 2, hd = depth / 2;
        const tableMat = new THREE.MeshLambertMaterial({ color: 0x5a3a2a });
        const chairMat = new THREE.MeshLambertMaterial({ color: 0x4a3020 });
        const clothMat = new THREE.MeshLambertMaterial({ color: 0x882222, side: THREE.DoubleSide });

        // 餐桌（带桌布）
        const tablePositions = [
            [x - 2, z + 1], [x + 2, z + 1],
            [x - 2, z - 2], [x + 2, z - 2],
            [x, z - 1]
        ];

        for (const tp of tablePositions) {
            if (tp[0] > x - hw + 1 && tp[0] < x + hw - 1 &&
                tp[1] > z - hd + 1 && tp[1] < z + hd - 1) {
                // 桌腿
                const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.7, 6);
                const legPositions = [[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]];
                for (const lp of legPositions) {
                    const leg = new THREE.Mesh(legGeo, tableMat);
                    leg.position.set(tp[0] + lp[0], 0.35, tp[1] + lp[1]);
                    scene.add(leg);
                }
                // 桌面
                const topGeo = new THREE.BoxGeometry(1.2, 0.06, 1.0);
                const top = new THREE.Mesh(topGeo, tableMat);
                top.position.set(tp[0], 0.73, tp[1]);
                top.castShadow = true;
                scene.add(top);
                // 桌布
                const clothGeo = new THREE.PlaneGeometry(1.0, 0.8);
                const cloth = new THREE.Mesh(clothGeo, clothMat);
                cloth.rotation.x = -Math.PI / 2;
                cloth.position.set(tp[0] + 0.1, 0.77, tp[1]);
                scene.add(cloth);

                // 椅子（每桌2-4把）
                const numChairs = 2 + Math.floor(Math.random() * 3);
                for (let i = 0; i < numChairs; i++) {
                    const angle = (i / numChairs) * Math.PI * 2;
                    const cx = tp[0] + Math.cos(angle) * 0.9;
                    const cz = tp[1] + Math.sin(angle) * 0.9;
                    this.addChair(scene, cx, cz, chairMat, angle + Math.PI);
                }
            }
        }

        // 厨房区域（后面）
        const kitchenZ = z - hd + 2;
        // 厨房台面
        const counterGeo = new THREE.BoxGeometry(width - 2, 0.9, 0.7);
        const counterMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const counter = new THREE.Mesh(counterGeo, counterMat);
        counter.position.set(x, 0.45, kitchenZ);
        counter.castShadow = true;
        scene.add(counter);

        // 灶台
        for (let i = 0; i < 3; i++) {
            const stoveGeo = new THREE.BoxGeometry(0.6, 0.1, 0.6);
            const stoveMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            const stove = new THREE.Mesh(stoveGeo, stoveMat);
            stove.position.set(x - 2 + i * 2, 0.96, kitchenZ);
            scene.add(stove);
        }

        // 柜台上的盘子
        for (let i = 0; i < 5; i++) {
            const plateGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.03, 8);
            const plateMat = new THREE.MeshLambertMaterial({ color: 0xccccaa });
            const plate = new THREE.Mesh(plateGeo, plateMat);
            plate.position.set(x - 3 + i * 1.5, 0.97, kitchenZ + 0.3);
            scene.add(plate);
        }
    },

    addChair(scene, x, z, mat, rotation) {
        const chair = new THREE.Group();
        // 座面
        const seatGeo = new THREE.BoxGeometry(0.4, 0.04, 0.4);
        const seat = new THREE.Mesh(seatGeo, mat);
        seat.position.y = 0.45;
        chair.add(seat);
        // 靠背
        const backGeo = new THREE.BoxGeometry(0.4, 0.5, 0.04);
        const back = new THREE.Mesh(backGeo, mat);
        back.position.set(0, 0.7, -0.18);
        chair.add(back);
        // 腿
        const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 4);
        for (const lx of [-0.15, 0.15]) {
            for (const lz of [-0.15, 0.15]) {
                const leg = new THREE.Mesh(legGeo, mat);
                leg.position.set(lx, 0.225, lz);
                chair.add(leg);
            }
        }
        chair.position.set(x, 0, z);
        chair.rotation.y = rotation;
        scene.add(chair);
    },

    // ========== 酒楼布局 ==========
    layoutBar(scene, x, z, width, depth, h) {
        const hw = width / 2, hd = depth / 2;
        const barMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        const metalMat = this.mat.metal;

        // 吧台（L型）
        const barLen = Math.min(width - 3, 8);
        const barGeo = new THREE.BoxGeometry(barLen, 1.1, 0.7);
        const bar = new THREE.Mesh(barGeo, barMat);
        bar.position.set(x, 0.55, z + hd - 2.5);
        bar.castShadow = true;
        scene.add(bar);

        // 吧台面板
        const panelGeo = new THREE.BoxGeometry(barLen, 0.05, 0.75);
        const panelMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(x, 1.12, z + hd - 2.5);
        scene.add(panel);

        // 吧台后面的酒柜
        const cabinetGeo = new THREE.BoxGeometry(barLen, 2.5, 0.4);
        const cabinetMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });
        const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
        cabinet.position.set(x, 1.25, z + hd - 1.2);
        scene.add(cabinet);

        // 酒瓶
        const bottleColors = [0x225522, 0x552222, 0x222255, 0x555522, 0x442244];
        for (let i = 0; i < 8; i++) {
            const bGeo = new THREE.CylinderGeometry(0.04, 0.06, 0.3, 6);
            const bMat = new THREE.MeshLambertMaterial({
                color: bottleColors[Math.floor(Math.random() * bottleColors.length)]
            });
            const bottle = new THREE.Mesh(bGeo, bMat);
            bottle.position.set(x - barLen / 2 + 0.5 + i * (barLen / 9), 2.6, z + hd - 1.2);
            scene.add(bottle);
        }

        // 吧台高脚凳
        for (let i = 0; i < Math.floor(barLen / 1.2); i++) {
            const stoolX = x - barLen / 2 + 0.8 + i * 1.2;
            this.addBarStool(scene, stoolX, z + hd - 3.5, metalMat);
        }

        // 卡座（沿墙）
        const boothMat = new THREE.MeshLambertMaterial({ color: 0x551111 });
        const boothPositions = [
            [x - hw + 1.5, z - 1], [x - hw + 1.5, z - 3.5],
            [x + hw - 1.5, z - 1], [x + hw - 1.5, z - 3.5]
        ];
        for (const bp of boothPositions) {
            if (bp[0] > x - hw + 0.8 && bp[0] < x + hw - 0.8 &&
                bp[1] > z - hd + 0.8 && bp[1] < z + hd - 0.8) {
                // 卡座靠背
                const backGeo = new THREE.BoxGeometry(0.5, 1.0, 1.2);
                const back = new THREE.Mesh(backGeo, boothMat);
                back.position.set(bp[0], 0.5, bp[1]);
                scene.add(back);
                // 小桌
                const tblGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
                const tbl = new THREE.Mesh(tblGeo, barMat);
                tbl.position.set(bp[0] + 0.7, 0.35, bp[1]);
                scene.add(tbl);
            }
        }

        // 舞台区域
        const stageGeo = new THREE.BoxGeometry(3, 0.3, 2);
        const stageMat = new THREE.MeshLambertMaterial({ color: 0x2a2020 });
        const stage = new THREE.Mesh(stageGeo, stageMat);
        stage.position.set(x, 0.15, z - hd + 2);
        scene.add(stage);

        // 舞台灯光（彩色）
        const stageColors = [0xff0044, 0x4400ff, 0xff4400];
        for (let i = 0; i < 3; i++) {
            const light = new THREE.PointLight(stageColors[i], 0.5, 8);
            light.position.set(x - 1 + i, h - 0.5, z - hd + 2);
            scene.add(light);
        }
    },

    addBarStool(scene, x, z, mat) {
        // 座面
        const seatGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 8);
        const seat = new THREE.Mesh(seatGeo, mat);
        seat.position.set(x, 0.8, z);
        scene.add(seat);
        // 杆
        const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6);
        const pole = new THREE.Mesh(poleGeo, mat);
        pole.position.set(x, 0.4, z);
        scene.add(pole);
        // 底座
        const baseGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 8);
        const base = new THREE.Mesh(baseGeo, mat);
        base.position.set(x, 0.02, z);
        scene.add(base);
    },

    // ========== 大厦布局 ==========
    layoutTower(scene, x, z, width, depth, h) {
        const hw = width / 2, hd = depth / 2;
        const deskMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        const chairMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        // 办公桌网格
        const deskSpacing = 3.0;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                const deskX = x + dx * deskSpacing;
                const deskZ = z + dz * deskSpacing;
                if (deskX > x - hw + 1 && deskX < x + hw - 1 &&
                    deskZ > z - hd + 1 && deskZ < z + hd - 1) {
                    // 桌面
                    const topGeo = new THREE.BoxGeometry(1.2, 0.05, 0.7);
                    const top = new THREE.Mesh(topGeo, deskMat);
                    top.position.set(deskX, 0.75, deskZ);
                    top.castShadow = true;
                    scene.add(top);
                    // 桌腿
                    const legGeo = new THREE.BoxGeometry(0.05, 0.75, 0.05);
                    for (const lx of [-0.55, 0.55]) {
                        for (const lz of [-0.3, 0.3]) {
                            const leg = new THREE.Mesh(legGeo, deskMat);
                            leg.position.set(deskX + lx, 0.375, deskZ + lz);
                            scene.add(leg);
                        }
                    }
                    // 电脑显示器
                    if (Math.random() < 0.7) {
                        const monGeo = new THREE.BoxGeometry(0.5, 0.35, 0.03);
                        const mon = new THREE.Mesh(monGeo, this.mat.screen);
                        mon.position.set(deskX, 1.1, deskZ - 0.15);
                        scene.add(mon);
                        // 底座
                        const standGeo = new THREE.BoxGeometry(0.15, 0.15, 0.1);
                        const stand = new THREE.Mesh(standGeo, deskMat);
                        stand.position.set(deskX, 0.82, deskZ - 0.15);
                        scene.add(stand);
                    }
                    // 办公椅
                    this.addChair(scene, deskX, deskZ + 0.7, chairMat, 0);
                }
            }
        }

        // 大型会议桌（中央）
        if (width > 8 && depth > 8) {
            const confGeo = new THREE.BoxGeometry(3, 0.08, 1.5);
            const confMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
            const conf = new THREE.Mesh(confGeo, confMat);
            conf.position.set(x, 0.75, z);
            conf.castShadow = true;
            scene.add(conf);
        }
    },

    // ========== 通用室内装饰 ==========
    addInteriorDecor(scene, x, z, width, depth, h) {
        const hw = width / 2, hd = depth / 2;

        // 翻倒的椅子/杂物
        for (let i = 0; i < 2; i++) {
            const debrisGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const debrisMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
            const debris = new THREE.Mesh(debrisGeo, debrisMat);
            debris.position.set(
                x + (Math.random() - 0.5) * (width - 2),
                0.15,
                z + (Math.random() - 0.5) * (depth - 2)
            );
            debris.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
            scene.add(debris);
        }

        // 血迹
        for (let i = 0; i < 3; i++) {
            const bloodGeo = new THREE.CircleGeometry(0.2 + Math.random() * 0.3, 8);
            const blood = new THREE.Mesh(bloodGeo, this.mat.blood);
            blood.rotation.x = -Math.PI / 2;
            blood.position.set(
                x + (Math.random() - 0.5) * (width - 2),
                0.02,
                z + (Math.random() - 0.5) * (depth - 2)
            );
            scene.add(blood);
        }

        // 碎玻璃
        const glassMat = new THREE.MeshLambertMaterial({
            color: 0x88aacc, transparent: true, opacity: 0.3
        });
        for (let i = 0; i < 4; i++) {
            const shardGeo = new THREE.PlaneGeometry(0.15, 0.1);
            const shard = new THREE.Mesh(shardGeo, glassMat);
            shard.rotation.x = -Math.PI / 2;
            shard.rotation.z = Math.random() * Math.PI;
            shard.position.set(
                x + (Math.random() - 0.5) * (width - 1),
                0.015,
                z + (Math.random() - 0.5) * (depth - 1)
            );
            scene.add(shard);
        }
    },

    // ========== 室内灯光 ==========
    addInteriorLights(scene, x, z, width, depth, h, type) {
        const lightColors = {
            shop: 0xffe8cc,
            restaurant: 0xffddaa,
            bar: 0xcc88ff,
            tower: 0xccddff
        };
        const color = lightColors[type];
        const numLights = Math.max(1, Math.floor(width * depth / 25));

        for (let i = 0; i < numLights; i++) {
            const lx = x + (Math.random() - 0.5) * (width - 2);
            const lz = z + (Math.random() - 0.5) * (depth - 2);

            // 点光源
            const light = new THREE.PointLight(color, 0.4, 8);
            light.position.set(lx, h - 0.3, lz);
            scene.add(light);

            // 灯具模型
            this.addCeilingLamp(scene, lx, lz, h);
        }
    },

    addCeilingLamp(scene, x, z, h) {
        // 灯罩
        const shadeGeo = new THREE.CylinderGeometry(0.2, 0.3, 0.15, 8, 1, true);
        const shade = new THREE.Mesh(shadeGeo, this.mat.lampShade);
        shade.position.set(x, h - 0.15, z);
        scene.add(shade);
        // 灯泡
        const bulbGeo = new THREE.SphereGeometry(0.06, 6, 6);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffeecc });
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(x, h - 0.25, z);
        scene.add(bulb);
        // 电线
        const wireGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4);
        const wireMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        const wire = new THREE.Mesh(wireGeo, wireMat);
        wire.position.set(x, h - 0.05, z);
        scene.add(wire);
    },

    // ========== 多层建筑系统 ==========
    buildMultiFloor(scene, x, z, width, depth, totalHeight, numFloors, floorHeight, type, doorDir, buildingData) {
        const hw = width / 2, hd = depth / 2;
        const openingW = 2.5;

        // 上层楼的碰撞墙段（后墙和右墙有楼梯开口）
        buildingData.upperWallSegments = [
            { x1: x - hw, z1: z + hd, x2: x + hw, z2: z + hd },           // 前墙
            { x1: x - hw, z1: z - hd, x2: x - hw, z2: z + hd },           // 左墙
            { x1: x - hw, z1: z - hd, x2: x - hw + (hw * 2 - openingW) / 2, z2: z - hd },  // 后墙左段
            { x1: x + hw - openingW / 2, z1: z - hd, x2: x + hw, z2: z - hd },              // 后墙右段
            { x1: x + hw, z1: z - hd, x2: x + hw, z2: z - hd + openingW },                  // 右墙下段
            { x1: x + hw, z1: z - hd + openingW, x2: x + hw, z2: z + hd },                   // 右墙上段
        ];

        for (let f = 1; f < numFloors; f++) {
            const floorY = f * floorHeight;

            // 楼层地板
            const floorGeo = new THREE.PlaneGeometry(width - 0.3, depth - 0.3);
            let floorMat = this.mat.floor;
            if (type === 'hospital') floorMat = this.mat.hospitalFloor;
            else if (type === 'school') floorMat = this.mat.schoolFloor;
            else if (type === 'mall') floorMat = this.mat.mallFloor;
            else if (type === 'police') floorMat = this.mat.policeFloor;

            const floorMesh = new THREE.Mesh(floorGeo, floorMat);
            floorMesh.rotation.x = -Math.PI / 2;
            floorMesh.position.set(x, floorY, z);
            floorMesh.receiveShadow = true;
            scene.add(floorMesh);

            // 楼层天花板
            const ceilGeo = new THREE.PlaneGeometry(width - 0.3, depth - 0.3);
            const ceil = new THREE.Mesh(ceilGeo, this.mat.ceiling);
            ceil.rotation.x = Math.PI / 2;
            ceil.position.set(x, floorY + floorHeight, z);
            scene.add(ceil);

            // 每层的内墙壁（带楼梯洞口）
            this.addFloorWalls(scene, x, z, width, depth, floorY, floorHeight, doorDir);
        }

        // 楼梯（放在建筑角落）
        this.buildStaircase(scene, x, z, width, depth, numFloors, floorHeight);
    },

    addFloorWalls(scene, x, z, width, depth, floorY, floorHeight, doorDir) {
        const hw = width / 2, hd = depth / 2;
        const t = this.mat.interiorWall;
        const openingW = 2.5; // 楼梯通道宽度

        // 后墙 (-Z)：在右角留开口
        const backLeft = hw - openingW / 2;
        if (backLeft > 0.5) {
            const geo = new THREE.BoxGeometry(backLeft, floorHeight, 0.12);
            const wall = new THREE.Mesh(geo, t);
            wall.position.set(x - (hw + openingW / 2) / 2, floorY + floorHeight / 2, z - hd);
            scene.add(wall);
        }

        // 右墙 (+X)：在后角留开口
        const rightRemain = hd - openingW / 2;
        if (rightRemain > 0.5) {
            const geo = new THREE.BoxGeometry(0.12, floorHeight, rightRemain);
            const wall = new THREE.Mesh(geo, t);
            wall.position.set(x + hw, floorY + floorHeight / 2, z - (hd + openingW / 2) / 2);
            scene.add(wall);
        }

        // 前墙 (+Z)：完整
        const frontGeo = new THREE.BoxGeometry(width, floorHeight, 0.12);
        const frontWall = new THREE.Mesh(frontGeo, t);
        frontWall.position.set(x, floorY + floorHeight / 2, z + hd);
        scene.add(frontWall);

        // 左墙 (-X)：完整
        const leftGeo = new THREE.BoxGeometry(0.12, floorHeight, depth);
        const leftWall = new THREE.Mesh(leftGeo, t);
        leftWall.position.set(x - hw, floorY + floorHeight / 2, z);
        scene.add(leftWall);
    },

    buildStaircase(scene, x, z, width, depth, numFloors, floorHeight) {
        const hw = width / 2, hd = depth / 2;
        const stairW = 1.8;
        const stairD = 2.5;
        const stepsPerFloor = 10;
        const stepH = floorHeight / stepsPerFloor;
        const stepD = stairD / stepsPerFloor;

        // 楼梯放在建筑右后角
        const stairX = x + hw - stairW / 2 - 0.3;
        const stairZ = z - hd + stairD / 2 + 0.3;

        for (let f = 0; f < numFloors - 1; f++) {
            const baseY = f * floorHeight;

            // 楼梯方向交替（来回走）
            const dir = (f % 2 === 0) ? 1 : -1;

            for (let s = 0; s < stepsPerFloor; s++) {
                const stepY = baseY + s * stepH + stepH / 2;
                const stepZOffset = dir > 0
                    ? s * stepD - stairD / 2
                    : stairD / 2 - s * stepD;

                const stepGeo = new THREE.BoxGeometry(stairW, stepH, stepD);
                const step = new THREE.Mesh(stepGeo, this.mat.stairStep);
                step.position.set(stairX, stepY + stepH / 2, stairZ + stepZOffset);
                step.castShadow = true;
                step.receiveShadow = true;
                scene.add(step);
            }

            // 楼梯扶手
            const railGeo = new THREE.BoxGeometry(0.05, floorHeight, stairD);
            const rail1 = new THREE.Mesh(railGeo, this.mat.stairRail);
            rail1.position.set(stairX - stairW / 2, baseY + floorHeight / 2, stairZ);
            scene.add(rail1);
            const rail2 = new THREE.Mesh(railGeo, this.mat.stairRail);
            rail2.position.set(stairX + stairW / 2, baseY + floorHeight / 2, stairZ);
            scene.add(rail2);

            // 楼层平台（楼梯转角处）
            const platGeo = new THREE.BoxGeometry(stairW, 0.1, stairD);
            const plat = new THREE.Mesh(platGeo, this.mat.stairStep);
            plat.position.set(stairX, baseY + floorHeight, stairZ);
            scene.add(plat);
        }
    },

    // 查询玩家所在楼层（供player.js调用）
    getPlayerFloor(playerPos) {
        const floorHeight = 3.2;
        const eyeH = 1.7;
        for (const b of this.buildings) {
            if (!b.enterable) continue;
            if (playerPos.x > b.minX && playerPos.x < b.maxX &&
                playerPos.z > b.minZ && playerPos.z < b.maxZ) {
                const totalFloors = Math.max(1, Math.floor(b.height / floorHeight));
                const feetY = playerPos.y - eyeH;
                const floor = Math.floor(feetY / floorHeight);
                const clampedFloor = Math.max(0, Math.min(floor, totalFloors - 1));
                this.currentFloorInfo = {
                    floor: clampedFloor,
                    totalFloors: totalFloors,
                    inBuilding: true,
                    buildingType: b.buildingType || '',
                    floorY: clampedFloor * floorHeight
                };
                return this.currentFloorInfo;
            }
        }
        this.currentFloorInfo = { floor: 0, totalFloors: 0, inBuilding: false, buildingType: '', floorY: 0 };
        return this.currentFloorInfo;
    },

    // 获取楼梯区域的地面高度（供player.js调用）
    getStairGroundY(playerPos) {
        const floorHeight = 3.2;
        const eyeH = 1.7;

        for (const b of this.buildings) {
            if (!b.enterable) continue;
            if (playerPos.x > b.minX && playerPos.x < b.maxX &&
                playerPos.z > b.minZ && playerPos.z < b.maxZ) {

                const hw = b.width / 2, hd = b.depth / 2;
                const numFloors = Math.max(1, Math.floor(b.height / floorHeight));

                // 楼梯位置（右后角）
                const stairW = 1.8, stairD = 2.5;
                const stairX = b.centerX + hw - stairW / 2 - 0.3;
                const stairZ = b.centerZ - hd + stairD / 2 + 0.3;

                const inStairX = Math.abs(playerPos.x - stairX) < stairW / 2 + 0.4;
                const inStairZ = Math.abs(playerPos.z - stairZ) < stairD / 2 + 0.4;

                if (inStairX && inStairZ) {
                    // 楼梯区域：根据Z位置插值计算地面高度
                    const relZ = (playerPos.z - (stairZ - stairD / 2)) / stairD;
                    const feetY = playerPos.y - eyeH;

                    // 确定当前所在的楼层段
                    const currentFloor = Math.floor(feetY / floorHeight);
                    const clampedFloor = Math.max(0, Math.min(currentFloor, numFloors - 2));

                    // 楼梯方向交替
                    const dir = (clampedFloor % 2 === 0) ? 1 : -1;
                    const t = dir > 0 ? relZ : (1 - relZ);
                    const stairGround = clampedFloor * floorHeight + Math.max(0, Math.min(1, t)) * floorHeight;

                    return stairGround + eyeH;
                }

                // 非楼梯区域：检查是否在某层楼板上行走
                const feetY = playerPos.y - eyeH;
                for (let f = 1; f < numFloors; f++) {
                    const floorY = f * floorHeight;
                    // 在楼层附近（楼梯平台区域）
                    if (feetY > floorY - 0.8 && feetY < floorY + 0.8) {
                        // 检查是否靠近楼梯平台
                        if (Math.abs(playerPos.x - stairX) < stairW + 1 &&
                            Math.abs(playerPos.z - stairZ) < stairD + 1) {
                            return floorY + eyeH;
                        }
                    }
                }

                break;
            }
        }
        return eyeH; // 默认地面
    },

    // ========== 医院布局 ==========
    layoutHospital(scene, x, z, width, depth, h) {
        const hw = width / 2, hd = depth / 2;
        const t = this.mat;

        // --- 前台/挂号处 ---
        const deskGeo = new THREE.BoxGeometry(3, 1.1, 0.8);
        const desk = new THREE.Mesh(deskGeo, t.hospitalBed);
        desk.position.set(x, 0.55, z + hd - 2);
        desk.castShadow = true;
        scene.add(desk);

        // 前台电脑
        const monGeo = new THREE.BoxGeometry(0.4, 0.3, 0.03);
        const mon = new THREE.Mesh(monGeo, t.screen);
        mon.position.set(x, 1.25, z + hd - 2);
        scene.add(mon);

        // 红十字标识
        const crossGeo = new THREE.BoxGeometry(0.6, 0.6, 0.05);
        const cross = new THREE.Mesh(crossGeo, t.redCross);
        cross.position.set(x, 2.5, z + hd - 0.1);
        scene.add(cross);
        const crossBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.06), t.redCross);
        crossBar1.position.set(x, 2.5, z + hd - 0.07);
        scene.add(crossBar1);
        const crossBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.06), t.redCross);
        crossBar2.position.set(x, 2.5, z + hd - 0.07);
        scene.add(crossBar2);

        // --- 病房区域（左侧）---
        const wardX = x - hw + 3;
        for (let i = 0; i < 3; i++) {
            const bedZ = z - 2 + i * 2.5;
            if (bedZ > z - hd + 1 && bedZ < z + hd - 1) {
                // 病床
                const bedGeo = new THREE.BoxGeometry(1.8, 0.5, 0.9);
                const bed = new THREE.Mesh(bedGeo, t.hospitalBed);
                bed.position.set(wardX, 0.25, bedZ);
                bed.castShadow = true;
                scene.add(bed);

                // 床垫
                const mattressGeo = new THREE.BoxGeometry(1.7, 0.12, 0.8);
                const mattressMat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
                const mattress = new THREE.Mesh(mattressGeo, mattressMat);
                mattress.position.set(wardX, 0.56, bedZ);
                scene.add(mattress);

                // 枕头
                const pillowGeo = new THREE.BoxGeometry(0.3, 0.1, 0.3);
                const pillow = new THREE.Mesh(pillowGeo, t.hospitalBed);
                pillow.position.set(wardX - 0.6, 0.67, bedZ);
                scene.add(pillow);

                // 床头柜
                const cabinetGeo = new THREE.BoxGeometry(0.5, 0.6, 0.4);
                const cabinet = new THREE.Mesh(cabinetGeo, t.metal);
                cabinet.position.set(wardX + 1.2, 0.3, bedZ);
                scene.add(cabinet);

                // 输液架
                const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 2, 6);
                const pole = new THREE.Mesh(poleGeo, t.metal);
                pole.position.set(wardX + 0.8, 1, bedZ + 0.5);
                scene.add(pole);
                const hookGeo = new THREE.SphereGeometry(0.04, 6, 6);
                const hook = new THREE.Mesh(hookGeo, t.metal);
                hook.position.set(wardX + 0.8, 2, bedZ + 0.5);
                scene.add(hook);
            }
        }

        // --- 手术台区域（右侧）---
        const surgX = x + hw - 2.5;
        const surgZ = z;
        // 手术灯
        const lampGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.15, 8);
        const lampMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const lamp = new THREE.Mesh(lampGeo, lampMat);
        lamp.position.set(surgX, h - 0.2, surgZ);
        scene.add(lamp);
        const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 4), t.metal);
        lampArm.position.set(surgX, h - 0.95, surgZ);
        scene.add(lampArm);
        // 手术台
        const tableGeo = new THREE.BoxGeometry(2, 0.8, 0.8);
        const table = new THREE.Mesh(tableGeo, t.hospitalBed);
        table.position.set(surgX, 0.4, surgZ);
        scene.add(table);
        // 手术灯点光源
        const surgLight = new THREE.PointLight(0xffffff, 0.6, 6);
        surgLight.position.set(surgX, h - 0.5, surgZ);
        scene.add(surgLight);

        // --- 药柜（后墙）---
        const cabinetGeo = new THREE.BoxGeometry(width - 4, 2, 0.5);
        const cabinetMat = new THREE.MeshLambertMaterial({ color: 0x888899 });
        const medCabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
        medCabinet.position.set(x, 1, z - hd + 0.5);
        scene.add(medCabinet);

        // 药瓶
        for (let i = 0; i < 10; i++) {
            const bottleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 6);
            const bottleColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff];
            const bottleMat = new THREE.MeshLambertMaterial({
                color: bottleColors[Math.floor(Math.random() * bottleColors.length)]
            });
            const bottle = new THREE.Mesh(bottleGeo, bottleMat);
            bottle.position.set(x - hw / 2 + 1 + i * 1.2, 2.1, z - hd + 0.5);
            scene.add(bottle);
        }
    },

    // ========== 学校布局 ==========
    layoutSchool(scene, x, z, width, depth, h) {
        const hw = width / 2, hd = depth / 2;
        const t = this.mat;

        // --- 讲台 ---
        const podiumGeo = new THREE.BoxGeometry(2, 0.3, 1.2);
        const podium = new THREE.Mesh(podiumGeo, t.deskWood);
        podium.position.set(x, 0.15, z + hd - 2);
        scene.add(podium);

        // 讲桌
        const lecternGeo = new THREE.BoxGeometry(0.6, 1.0, 0.4);
        const lectern = new THREE.Mesh(lecternGeo, t.deskWood);
        lectern.position.set(x, 0.5, z + hd - 2);
        scene.add(lectern);

        // 黑板
        const boardGeo = new THREE.BoxGeometry(width - 3, 1.5, 0.08);
        const board = new THREE.Mesh(boardGeo, t.chalkboard);
        board.position.set(x, 1.8, z + hd - 0.1);
        scene.add(board);

        // 黑板边框
        const frameGeo = new THREE.BoxGeometry(width - 2.5, 1.7, 0.05);
        const frameMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.set(x, 1.8, z + hd - 0.14);
        scene.add(frame);

        // --- 课桌椅（整齐排列）---
        const rows = Math.floor((depth - 5) / 2.2);
        const cols = Math.min(4, Math.floor((width - 3) / 2.2));
        const startX = x - (cols - 1) * 1.1;
        const startZ = z + hd - 4;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const deskX = startX + c * 2.2;
                const deskZ = startZ - r * 2.2;
                if (deskZ > z - hd + 1 && deskZ < z + hd - 1) {
                    // 课桌
                    const dGeo = new THREE.BoxGeometry(0.8, 0.05, 0.5);
                    const desk = new THREE.Mesh(dGeo, t.deskWood);
                    desk.position.set(deskX, 0.72, deskZ);
                    desk.castShadow = true;
                    scene.add(desk);
                    // 桌腿
                    for (const lx of [-0.35, 0.35]) {
                        for (const lz of [-0.2, 0.2]) {
                            const legGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.72, 4);
                            const leg = new THREE.Mesh(legGeo, t.deskWood);
                            leg.position.set(deskX + lx, 0.36, deskZ + lz);
                            scene.add(leg);
                        }
                    }
                    // 椅子
                    this.addChair(scene, deskX + 0.6, deskZ, t.deskWood, Math.PI);
                }
            }
        }

        // --- 书架（后墙）---
        const shelfGeo = new THREE.BoxGeometry(width - 3, 2, 0.5);
        const shelfMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        const shelf = new THREE.Mesh(shelfGeo, shelfMat);
        shelf.position.set(x, 1, z - hd + 0.5);
        scene.add(shelf);

        // 书本
        const bookColors = [0xcc3333, 0x3333cc, 0x33cc33, 0xcccc33, 0xcc33cc, 0x33cccc];
        for (let i = 0; i < 15; i++) {
            const bookGeo = new THREE.BoxGeometry(0.08, 0.2 + Math.random() * 0.1, 0.15);
            const bookMat = new THREE.MeshLambertMaterial({
                color: bookColors[Math.floor(Math.random() * bookColors.length)]
            });
            const book = new THREE.Mesh(bookGeo, bookMat);
            book.position.set(x - hw / 2 + 1 + i * 0.9, 2.1, z - hd + 0.5);
            scene.add(book);
        }

        // --- 地球仪 ---
        const globeGeo = new THREE.SphereGeometry(0.25, 12, 12);
        const globeMat = new THREE.MeshLambertMaterial({ color: 0x4477aa });
        const globe = new THREE.Mesh(globeGeo, globeMat);
        globe.position.set(x + hw - 2, 1.2, z + hd - 2);
        scene.add(globe);
        const standGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.5, 6);
        const stand = new THREE.Mesh(standGeo, t.metal);
        stand.position.set(x + hw - 2, 0.75, z + hd - 2);
        scene.add(stand);
    },

    // ========== 商场布局 ==========
    layoutMall(scene, x, z, width, depth, h) {
        const hw = width / 2, hd = depth / 2;
        const t = this.mat;

        // --- 中央走道 ---
        const aisleGeo = new THREE.PlaneGeometry(1.5, depth - 2);
        const aisle = new THREE.Mesh(aisleGeo, t.tileFloor);
        aisle.rotation.x = -Math.PI / 2;
        aisle.position.set(x, 0.02, z);
        scene.add(aisle);

        // --- 左侧店铺 ---
        const shopWidth = (width - 4) / 2 - 1;
        for (let i = 0; i < 3; i++) {
            const shopZ = z - hd + 2.5 + i * 3.5;
            if (shopZ > z - hd + 1 && shopZ < z + hd - 2) {
                const shopX = x - hw + shopWidth / 2 + 0.5;

                // 店铺隔墙
                const wallGeo = new THREE.BoxGeometry(0.1, 2.5, 3);
                const wall = new THREE.Mesh(wallGeo, t.mallWall);
                wall.position.set(shopX + shopWidth / 2, 1.25, shopZ);
                scene.add(wall);

                // 店铺招牌（霓虹灯效果）
                const signColors = [0xff44aa, 0x44aaff, 0xaaff44, 0xffaa44];
                const signGeo = new THREE.BoxGeometry(shopWidth * 0.8, 0.4, 0.05);
                const signMat = new THREE.MeshBasicMaterial({
                    color: signColors[i % signColors.length]
                });
                const sign = new THREE.Mesh(signGeo, signMat);
                sign.position.set(shopX, 2.3, shopZ + 1.5);
                scene.add(sign);

                // 店铺货架
                for (let s = 0; s < 2; s++) {
                    const shelfGeo = new THREE.BoxGeometry(0.6, 1.8, 1.2);
                    const shelf = new THREE.Mesh(shelfGeo, t.wood);
                    shelf.position.set(shopX - 1 + s * 1.5, 0.9, shopZ);
                    shelf.castShadow = true;
                    scene.add(shelf);

                    // 商品
                    for (let row = 0; row < 3; row++) {
                        if (Math.random() < 0.6) {
                            const itemGeo = new THREE.BoxGeometry(0.2, 0.15, 0.2);
                            const itemColors = [0xff6644, 0x44ff66, 0x4466ff, 0xffff44];
                            const itemMat = new THREE.MeshLambertMaterial({
                                color: itemColors[Math.floor(Math.random() * itemColors.length)]
                            });
                            const item = new THREE.Mesh(itemGeo, itemMat);
                            item.position.set(
                                shopX - 1 + s * 1.5,
                                0.3 + row * 0.55,
                                shopZ + (Math.random() - 0.5) * 0.8
                            );
                            scene.add(item);
                        }
                    }
                }

                // 收银台
                const regGeo = new THREE.BoxGeometry(0.8, 0.9, 0.5);
                const reg = new THREE.Mesh(regGeo, t.metal);
                reg.position.set(shopX + shopWidth / 2 - 0.5, 0.45, shopZ + 1);
                scene.add(reg);
            }
        }

        // --- 右侧店铺 ---
        for (let i = 0; i < 3; i++) {
            const shopZ = z - hd + 2.5 + i * 3.5;
            if (shopZ > z - hd + 1 && shopZ < z + hd - 2) {
                const shopX = x + hw - shopWidth / 2 - 0.5;

                const wallGeo = new THREE.BoxGeometry(0.1, 2.5, 3);
                const wall = new THREE.Mesh(wallGeo, t.mallWall);
                wall.position.set(shopX - shopWidth / 2, 1.25, shopZ);
                scene.add(wall);

                const signColors = [0xff8844, 0x8844ff, 0x44ff88, 0xff4488];
                const signGeo = new THREE.BoxGeometry(shopWidth * 0.8, 0.4, 0.05);
                const signMat = new THREE.MeshBasicMaterial({
                    color: signColors[i % signColors.length]
                });
                const sign = new THREE.Mesh(signGeo, signMat);
                sign.position.set(shopX, 2.3, shopZ + 1.5);
                scene.add(sign);

                // 服装展示（衣架）
                for (let r = 0; r < 2; r++) {
                    const rackGeo = new THREE.BoxGeometry(1.5, 0.04, 0.04);
                    const rack = new THREE.Mesh(rackGeo, t.metal);
                    rack.position.set(shopX - 0.5 + r * 1.2, 1.5, shopZ);
                    scene.add(rack);

                    // 衣架杆
                    const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 4);
                    const pole = new THREE.Mesh(poleGeo, t.metal);
                    pole.position.set(shopX - 0.5 + r * 1.2, 0.75, shopZ);
                    scene.add(pole);

                    // 衣物
                    const clothColors = [0x334455, 0x554433, 0x445533, 0x553344];
                    for (let c = 0; c < 4; c++) {
                        const clothGeo = new THREE.BoxGeometry(0.3, 0.5, 0.08);
                        const clothMat = new THREE.MeshLambertMaterial({
                            color: clothColors[Math.floor(Math.random() * clothColors.length)]
                        });
                        const cloth = new THREE.Mesh(clothGeo, clothMat);
                        cloth.position.set(shopX - 1 + r * 1.2 + c * 0.35, 1.2, shopZ);
                        scene.add(cloth);
                    }
                }
            }
        }

        // --- 中央展示台 ---
        const displayGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 12);
        const displayMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.position.set(x, 0.3, z);
        scene.add(display);

        // 展示灯
        const spotLight = new THREE.PointLight(0xffeedd, 0.5, 8);
        spotLight.position.set(x, h - 0.5, z);
        scene.add(spotLight);
    },

    // ========== 警察局布局 ==========
    layoutPolice(scene, x, z, width, depth, h) {
        const hw = width / 2, hd = depth / 2;
        const t = this.mat;

        // --- 接待前台 ---
        const frontGeo = new THREE.BoxGeometry(3.5, 1.1, 0.8);
        const front = new THREE.Mesh(frontGeo, t.deskWood);
        front.position.set(x, 0.55, z + hd - 2);
        front.castShadow = true;
        scene.add(front);

        // 电脑
        const monGeo = new THREE.BoxGeometry(0.4, 0.3, 0.03);
        const mon = new THREE.Mesh(monGeo, t.screen);
        mon.position.set(x, 1.25, z + hd - 2);
        scene.add(mon);

        // 警徽标识
        const badgeGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.05, 8);
        const badgeMat = new THREE.MeshLambertMaterial({ color: 0xccaa44 });
        const badge = new THREE.Mesh(badgeGeo, badgeMat);
        badge.rotation.x = Math.PI / 2;
        badge.position.set(x, 2.2, z + hd - 0.1);
        scene.add(badge);

        // --- 武器柜（右侧）---
        const rackX = x + hw - 1.5;
        const rackGeo = new THREE.BoxGeometry(1.5, 2, 0.5);
        const rackMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const rack = new THREE.Mesh(rackGeo, rackMat);
        rack.position.set(rackX, 1, z);
        scene.add(rack);

        // 枪架上的枪
        for (let i = 0; i < 4; i++) {
            const gunGeo = new THREE.BoxGeometry(0.6, 0.06, 0.06);
            const gunMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
            const gun = new THREE.Mesh(gunGeo, gunMat);
            gun.position.set(rackX, 0.5 + i * 0.4, z);
            scene.add(gun);
        }

        // --- 审讯室（左侧小房间）---
        const roomX = x - hw + 2.5;
        const roomZ = z;
        // 隔墙
        const roomWallGeo = new THREE.BoxGeometry(0.1, 2.8, 4);
        const roomWall = new THREE.Mesh(roomWallGeo, t.policeWall);
        roomWall.position.set(roomX + 2, 1.4, roomZ);
        scene.add(roomWall);

        // 审讯桌
        const interroGeo = new THREE.BoxGeometry(1.5, 0.05, 1);
        const interro = new THREE.Mesh(interroGeo, t.deskWood);
        interro.position.set(roomX, 0.75, roomZ);
        scene.add(interro);

        // 审讯椅
        this.addChair(scene, roomX, roomZ + 0.8, t.metal, Math.PI);
        this.addChair(scene, roomX, roomZ - 0.8, t.metal, 0);

        // 单面镜（玻璃）
        const mirrorGeo = new THREE.BoxGeometry(0.05, 1.5, 2);
        const mirrorMat = new THREE.MeshLambertMaterial({
            color: 0x889999, transparent: true, opacity: 0.4
        });
        const mirror = new THREE.Mesh(mirrorGeo, mirrorMat);
        mirror.position.set(roomX + 2.5, 1.4, roomZ);
        scene.add(mirror);

        // --- 监牢（后方）---
        const jailZ = z - hd + 2;
        for (let i = 0; i < 2; i++) {
            const cellX = x - 2 + i * 4;
            // 铁栏
            for (let b = 0; b < 5; b++) {
                const barGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.8, 6);
                const bar = new THREE.Mesh(barGeo, t.jailBar);
                bar.position.set(cellX - 1 + b * 0.5, 1.4, jailZ + 1.5);
                scene.add(bar);
            }
            // 顶部横杆
            const topBarGeo = new THREE.BoxGeometry(2.2, 0.05, 0.05);
            const topBar = new THREE.Mesh(topBarGeo, t.jailBar);
            topBar.position.set(cellX, 2.8, jailZ + 1.5);
            scene.add(topBar);

            // 铁床
            const bedGeo = new THREE.BoxGeometry(1.5, 0.4, 0.7);
            const bed = new THREE.Mesh(bedGeo, t.metal);
            bed.position.set(cellX, 0.2, jailZ);
            scene.add(bed);
        }

        // --- 公告板 ---
        const boardGeo = new THREE.BoxGeometry(2, 1.5, 0.05);
        const boardMat = new THREE.MeshLambertMaterial({ color: 0xaa9966 });
        const board = new THREE.Mesh(boardGeo, boardMat);
        board.position.set(x + 1, 1.8, z + hd - 0.1);
        scene.add(board);

        // 通缉令纸张
        for (let i = 0; i < 4; i++) {
            const paperGeo = new THREE.BoxGeometry(0.4, 0.5, 0.01);
            const paperMat = new THREE.MeshLambertMaterial({ color: 0xeeeedd });
            const paper = new THREE.Mesh(paperGeo, paperMat);
            paper.position.set(
                x + 0.3 + (i % 2) * 0.5,
                1.6 + Math.floor(i / 2) * 0.6,
                z + hd - 0.07
            );
            paper.rotation.z = (Math.random() - 0.5) * 0.3;
            scene.add(paper);
        }
    },

    // ========== 街灯 ==========
    addStreetLamps(scene) {
        const halfCity = this.citySize / 2;
        const lampMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        for (let i = 0; i <= this.gridSize; i++) {
            for (let j = 0; j <= this.gridSize; j++) {
                if (Math.random() < 0.6) {
                    const lx = -halfCity + i * this.blockSize + this.roadWidth / 2 + 0.5;
                    const lz = -halfCity + j * this.blockSize + this.roadWidth / 2 + 0.5;

                    // 灯杆
                    const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4, 6);
                    const pole = new THREE.Mesh(poleGeo, lampMat);
                    pole.position.set(lx, 2, lz);
                    pole.castShadow = true;
                    scene.add(pole);

                    // 灯臂
                    const armGeo = new THREE.BoxGeometry(1.2, 0.06, 0.06);
                    const arm = new THREE.Mesh(armGeo, lampMat);
                    arm.position.set(lx + 0.5, 3.9, lz);
                    scene.add(arm);

                    // 灯头
                    const headGeo = new THREE.BoxGeometry(0.4, 0.15, 0.25);
                    const headMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
                    const head = new THREE.Mesh(headGeo, headMat);
                    head.position.set(lx + 1, 3.85, lz);
                    scene.add(head);

                    // 灯光
                    if (Math.random() < 0.7) {
                        const light = new THREE.PointLight(0xffaa66, 0.6, 12);
                        light.position.set(lx + 1, 3.7, lz);
                        scene.add(light);
                    }

                    // 底座
                    const baseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.3, 6);
                    const base = new THREE.Mesh(baseGeo, lampMat);
                    base.position.set(lx, 0.15, lz);
                    scene.add(base);
                }
            }
        }
    },

    // ========== 垃圾和环境 ==========
    addGarbage(scene) {
        const halfCity = this.citySize / 2;
        const garbageColors = [0x444433, 0x334433, 0x443333, 0x333344];

        // 垃圾桶
        const binMat = new THREE.MeshLambertMaterial({ color: 0x336633 });
        for (let i = 0; i < 15; i++) {
            const bx = (Math.random() - 0.5) * this.citySize;
            const bz = (Math.random() - 0.5) * this.citySize;
            if (!this.isInBuilding(bx, bz)) {
                const binGeo = new THREE.CylinderGeometry(0.25, 0.3, 0.7, 8);
                const bin = new THREE.Mesh(binGeo, binMat);
                bin.position.set(bx, 0.35, bz);
                scene.add(bin);
                // 溢出的垃圾
                for (let j = 0; j < 3; j++) {
                    const trashGeo = new THREE.BoxGeometry(0.15, 0.05, 0.1);
                    const trashMat = new THREE.MeshLambertMaterial({
                        color: garbageColors[Math.floor(Math.random() * garbageColors.length)]
                    });
                    const trash = new THREE.Mesh(trashGeo, trashMat);
                    trash.position.set(
                        bx + (Math.random() - 0.5) * 0.5,
                        0.03,
                        bz + (Math.random() - 0.5) * 0.5
                    );
                    trash.rotation.y = Math.random() * Math.PI;
                    scene.add(trash);
                }
            }
        }

        // 路面裂缝
        const crackMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
        for (let i = 0; i < 20; i++) {
            const crackGeo = new THREE.PlaneGeometry(
                0.5 + Math.random() * 2,
                0.05 + Math.random() * 0.1
            );
            const crack = new THREE.Mesh(crackGeo, crackMat);
            crack.rotation.x = -Math.PI / 2;
            crack.rotation.z = Math.random() * Math.PI;
            crack.position.set(
                (Math.random() - 0.5) * this.citySize,
                0.018,
                (Math.random() - 0.5) * this.citySize
            );
            scene.add(crack);
        }

        // 井盖
        const coverMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
        for (let i = 0; i < 6; i++) {
            const coverGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12);
            const cover = new THREE.Mesh(coverGeo, coverMat);
            cover.position.set(
                (Math.random() - 0.5) * this.citySize,
                0.025,
                (Math.random() - 0.5) * this.citySize
            );
            scene.add(cover);
        }

        // 报废汽车
        this.addAbandonedCars(scene);
    },

    addAbandonedCars(scene) {
        const carColors = [0x664433, 0x334466, 0x443333, 0x445544, 0x555555];
        const carMat2 = new THREE.MeshLambertMaterial({ color: 0x222222 }); // 轮胎
        const glassMat = new THREE.MeshLambertMaterial({ color: 0x2a3a4a, transparent: true, opacity: 0.5 });

        for (let i = 0; i < 8; i++) {
            const cx = (Math.random() - 0.5) * (this.citySize - 10);
            const cz = (Math.random() - 0.5) * (this.citySize - 10);
            if (this.isInBuilding(cx, cz)) continue;

            const car = new THREE.Group();
            const carColor = carColors[Math.floor(Math.random() * carColors.length)];
            const carMat = new THREE.MeshLambertMaterial({ color: carColor });

            // 车身
            const bodyGeo = new THREE.BoxGeometry(2, 0.6, 1.2);
            const body = new THREE.Mesh(bodyGeo, carMat);
            body.position.y = 0.5;
            body.castShadow = true;
            car.add(body);

            // 车顶
            const roofGeo = new THREE.BoxGeometry(1.2, 0.5, 1.1);
            const roof = new THREE.Mesh(roofGeo, carMat);
            roof.position.set(-0.1, 1.05, 0);
            car.add(roof);

            // 挡风玻璃
            const windshieldGeo = new THREE.PlaneGeometry(1.1, 0.45);
            const windshield = new THREE.Mesh(windshieldGeo, glassMat);
            windshield.position.set(0.5, 1.0, 0);
            windshield.rotation.y = Math.PI / 2;
            car.add(windshield);

            // 轮胎
            const tireGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 8);
            const tirePositions = [[-0.6, 0.25, 0.65], [0.6, 0.25, 0.65], [-0.6, 0.25, -0.65], [0.6, 0.25, -0.65]];
            for (const tp of tirePositions) {
                const tire = new THREE.Mesh(tireGeo, carMat2);
                tire.rotation.x = Math.PI / 2;
                tire.position.set(...tp);
                car.add(tire);
            }

            // 随机损坏
            car.rotation.y = Math.random() * Math.PI * 2;
            if (Math.random() < 0.4) {
                car.rotation.z = (Math.random() - 0.5) * 0.3;
            }

            car.position.set(cx, 0, cz);
            scene.add(car);
        }
    },

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

        // 路障
        const barrierMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        for (let i = 0; i < 5; i++) {
            const barrierGeo = new THREE.BoxGeometry(2, 0.8, 0.15);
            const barrier = new THREE.Mesh(barrierGeo, barrierMat);
            barrier.position.set(
                (Math.random() - 0.5) * this.citySize,
                0.4,
                (Math.random() - 0.5) * this.citySize
            );
            barrier.rotation.y = Math.random() * Math.PI;
            scene.add(barrier);
        }
    },

    // ========== 碰撞检测 ==========
    isInBuilding(x, z) {
        for (const b of this.buildings) {
            if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
                return true;
            }
        }
        return false;
    },

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

    resolveCollision(pos, radius) {
        for (const b of this.buildings) {
            if (b.enterable) {
                // 可进入建筑：检查墙壁碰撞
                if (pos.x > b.minX - radius && pos.x < b.maxX + radius &&
                    pos.z > b.minZ - radius && pos.z < b.maxZ + radius) {
                    // 根据楼层选择碰撞段
                    const feetY = pos.y - 1.7;
                    const floorHeight = 3.2;
                    const currentFloor = Math.floor(feetY / floorHeight);
                    if (currentFloor > 0 && b.upperWallSegments) {
                        this.resolveWallCollisionSegments(pos, radius, b.upperWallSegments);
                    } else {
                        this.resolveWallCollision(pos, radius, b);
                    }
                }
            } else {
                // 实心建筑：AABB碰撞
                const expandedMinX = b.minX - radius;
                const expandedMaxX = b.maxX + radius;
                const expandedMinZ = b.minZ - radius;
                const expandedMaxZ = b.maxZ + radius;

                if (pos.x > expandedMinX && pos.x < expandedMaxX &&
                    pos.z > expandedMinZ && pos.z < expandedMaxZ) {
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
        }
        return pos;
    },

    resolveWallCollision(pos, radius, building) {
        if (!building.wallSegments) return;
        this.resolveWallCollisionSegments(pos, radius, building.wallSegments);
    },

    resolveWallCollisionSegments(pos, radius, wallSegments) {
        for (const wall of wallSegments) {
            const wallDx = wall.x2 - wall.x1;
            const wallDz = wall.z2 - wall.z1;
            const wallLen = Math.sqrt(wallDx * wallDx + wallDz * wallDz);

            if (wallLen < 0.001) continue;

            const nx = -wallDz / wallLen; // 墙壁法线
            const nz = wallDx / wallLen;

            // 玩家相对于墙起点的位置
            const relX = pos.x - wall.x1;
            const relZ = pos.z - wall.z1;

            // 沿墙方向的投影（0-1之间表示在墙段范围内）
            const t = (relX * wallDx + relZ * wallDz) / (wallLen * wallLen);

            if (t >= -0.05 && t <= 1.05) {
                // 到墙壁的垂直距离
                const dist = relX * nx + relZ * nz;

                if (Math.abs(dist) < radius) {
                    // 碰撞！推出去
                    const penetration = radius - Math.abs(dist);
                    const pushDir = dist >= 0 ? 1 : -1;
                    pos.x += nx * penetration * pushDir;
                    pos.z += nz * penetration * pushDir;
                }
            } else {
                // 检查墙端点
                const endX = t < 0 ? 0 : wallDx;
                const endZ = t < 0 ? 0 : wallDz;
                const dx = pos.x - (wall.x1 + endX);
                const dz = pos.z - (wall.z1 + endZ);
                const dist = Math.sqrt(dx * dx + dz * dz);

                if (dist < radius && dist > 0.001) {
                    const penetration = radius - dist;
                    pos.x += (dx / dist) * penetration;
                    pos.z += (dz / dist) * penetration;
                }
            }
        }
    }
};
