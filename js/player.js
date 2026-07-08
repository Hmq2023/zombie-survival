// player.js - 玩家控制系统
const Player = {
    scene: null,
    camera: null,
    position: new THREE.Vector3(0, 1.7, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    euler: new THREE.Euler(0, 0, 0, 'YXZ'),
    direction: new THREE.Vector3(),

    // 移动参数
    moveSpeed: 8,
    sprintMultiplier: 1.6,
    jumpForce: 8,
    gravity: -20,
    groundY: 1.7,      // 站立时眼睛高度
    isGrounded: true,
    isSprinting: false,

    // 鼠标
    mouseSensitivity: 0.002,
    isLocked: false,

    // 状态
    isAlive: true,
    currentFloor: 0,

    // 手电筒
    flashlight: null,
    flashlightOn: true,
    flashlightBattery: 100,

    // 输入状态
    keys: {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        sprint: false,
        interact: false,
        useMedkit: false,
        useFood: false,
        reload: false
    },

    init(camera, scene) {
        this.scene = scene;
        this.camera = camera;
        this.camera.position.copy(this.position);

        // 手电筒（聚光灯）
        this.flashlight = new THREE.SpotLight(0xffeedd, 2, 30, Math.PI / 6, 0.4, 1);
        this.flashlight.position.copy(this.position);
        this.flashlight.castShadow = true;
        this.flashlight.shadow.mapSize.width = 512;
        this.flashlight.shadow.mapSize.height = 512;
        scene.add(this.flashlight);
        scene.add(this.flashlight.target);

        // 键盘事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Pointer Lock
        document.addEventListener('pointerlockchange', () => {
            this.isLocked = document.pointerLockElement !== null;
        });
    },

    // 手电筒开关
    toggleFlashlight() {
        this.flashlightOn = !this.flashlightOn;
        if (this.flashlight) {
            this.flashlight.visible = this.flashlightOn;
        }
    },

    onKeyDown(e) {
        if (!this.isAlive) return;
        switch (e.code) {
            case 'KeyW': this.keys.forward = true; break;
            case 'KeyS': this.keys.backward = true; break;
            case 'KeyA': this.keys.left = true; break;
            case 'KeyD': this.keys.right = true; break;
            case 'Space': this.keys.jump = true; break;
            case 'ShiftLeft': this.keys.sprint = true; break;
            case 'KeyE': this.keys.interact = true; break;
            case 'KeyQ': this.keys.useMedkit = true; break;
            case 'KeyF': this.keys.useFood = true; break;
            case 'KeyR': this.keys.reload = true; break;
            case 'KeyT': this.toggleFlashlight(); break;
            case 'KeyM': Minimap.toggle(); break;
            case 'KeyN': Audio.toggleMute(); break;
            case 'Digit1': Weapon.switchWeapon(0); break;
            case 'Digit2': Weapon.switchWeapon(1); break;
            case 'Digit3': Weapon.switchWeapon(2); break;
        }
    },

    onKeyUp(e) {
        switch (e.code) {
            case 'KeyW': this.keys.forward = false; break;
            case 'KeyS': this.keys.backward = false; break;
            case 'KeyA': this.keys.left = false; break;
            case 'KeyD': this.keys.right = false; break;
            case 'Space': this.keys.jump = false; break;
            case 'ShiftLeft': this.keys.sprint = false; break;
            case 'KeyE': this.keys.interact = false; break;
            case 'KeyQ': this.keys.useMedkit = false; break;
            case 'KeyF': this.keys.useFood = false; break;
            case 'KeyR': this.keys.reload = false; break;
        }
    },

    onMouseMove(e) {
        if (!this.isLocked || !this.isAlive) return;

        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= e.movementX * this.mouseSensitivity;
        this.euler.x -= e.movementY * this.mouseSensitivity;
        this.euler.x = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.euler.x));
        this.camera.quaternion.setFromEuler(this.euler);
    },

    update(dt) {
        if (!this.isAlive) return;

        this.isSprinting = this.keys.sprint;
        const speed = this.moveSpeed * (this.isSprinting ? this.sprintMultiplier : 1);

        // 计算移动方向
        this.direction.set(0, 0, 0);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
        forward.y = 0;
        forward.normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
        right.y = 0;
        right.normalize();

        if (this.keys.forward) this.direction.add(forward);
        if (this.keys.backward) this.direction.sub(forward);
        if (this.keys.left) this.direction.sub(right);
        if (this.keys.right) this.direction.add(right);

        if (this.direction.length() > 0) {
            this.direction.normalize();
        }

        // 水平移动
        this.velocity.x = this.direction.x * speed;
        this.velocity.z = this.direction.z * speed;

        // 跳跃和重力
        if (this.keys.jump && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
        }
        this.velocity.y += this.gravity * dt;

        // 更新位置
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        this.position.z += this.velocity.z * dt;

        // 楼梯地面检测（多层建筑）
        const stairGround = City.getStairGroundY(this.position);
        let effectiveGround = Math.max(this.groundY, stairGround);

        // 楼层地面：防止从上层掉落
        const floorInfo = City.getPlayerFloor(this.position);
        this.currentFloor = floorInfo.floor;
        if (floorInfo.inBuilding && floorInfo.floor > 0) {
            const floorGround = floorInfo.floorY + 1.7;
            effectiveGround = Math.max(effectiveGround, floorGround);
        }

        // 地面检测
        if (this.position.y <= effectiveGround) {
            this.position.y = effectiveGround;
            this.velocity.y = 0;
            this.isGrounded = true;
        }

        // 建筑碰撞
        City.resolveCollision(this.position, 0.5);

        // 城市边界
        const half = City.citySize / 2 + 10;
        this.position.x = Math.max(-half, Math.min(half, this.position.x));
        this.position.z = Math.max(-half, Math.min(half, this.position.z));

        // 更新相机
        this.camera.position.copy(this.position);

        // 更新手电筒位置和方向
        if (this.flashlight && this.flashlightOn) {
            this.flashlight.position.copy(this.position);
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
            this.flashlight.target.position.copy(this.position).add(forward.multiplyScalar(10));
        }

        // 脚步声
        if (this.isGrounded && (this.keys.forward || this.keys.backward || this.keys.left || this.keys.right)) {
            Audio.playFootstep(this.isSprinting ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed);
        }
    },

    // 处理交互输入（每帧检测，需要单次触发的逻辑）
    consumeInteract() {
        if (this.keys.interact) {
            this.keys.interact = false;
            return true;
        }
        return false;
    },

    consumeUseMedkit() {
        if (this.keys.useMedkit) {
            this.keys.useMedkit = false;
            return true;
        }
        return false;
    },

    consumeUseFood() {
        if (this.keys.useFood) {
            this.keys.useFood = false;
            return true;
        }
        return false;
    },

    consumeReload() {
        if (this.keys.reload) {
            this.keys.reload = false;
            return true;
        }
        return false;
    },

    die() {
        this.isAlive = false;
    },

    reset() {
        this.isAlive = true;
        this.position.set(0, 1.7, 0);
        this.velocity.set(0, 0, 0);
        this.euler.set(0, 0, 0);
        this.camera.quaternion.setFromEuler(this.euler);
        this.camera.position.copy(this.position);
        this.flashlightOn = true;
        this.flashlightBattery = 100;
        if (this.flashlight) this.flashlight.visible = true;
    }
};
