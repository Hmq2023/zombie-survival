// main.js - 游戏主入口
(function () {
    'use strict';

    // Three.js 核心
    let scene, camera, renderer;
    let clock;

    // 灯光引用
    let ambientLight, sunLight, hemisphereLight;

    // 鼠标状态
    let mouseDown = false;

    // 初始化
    function init() {
        // 场景
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a1a2e);
        scene.fog = new THREE.Fog(0x1a1a2e, 30, 120);

        // 相机
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);

        // 渲染器
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        // 时钟
        clock = new THREE.Clock();

        // 灯光（创建后交给Weather管理）
        setupLights();

        // 初始化子系统
        City.generate(scene);
        Player.init(camera);
        Zombie.init(scene);
        Weapon.init(scene);
        Items.init(scene);
        Combat.init();
        Survival.init();
        Game.init();

        // 天气系统（必须在City生成之后，因为它会创建天空球）
        Weather.init(scene, {
            ambient: ambientLight,
            sun: sunLight,
            hemisphere: hemisphereLight
        });

        // 环境增强（大气粒子、火焰、植被、街道设施）
        Environment.init(scene);

        // 屏幕特效
        Effects.init();

        // 生成游戏对象
        Zombie.spawnAll(scene);
        Items.spawnAll(scene);

        // 火光点光源
        addFireLights();

        // 事件绑定
        setupEvents();

        // 开始渲染
        animate();
    }

    // 设置灯光
    function setupLights() {
        // 环境光
        ambientLight = new THREE.AmbientLight(0x404050, 0.4);
        scene.add(ambientLight);

        // 方向光（太阳/月亮）
        sunLight = new THREE.DirectionalLight(0x8888cc, 0.6);
        sunLight.position.set(50, 80, 30);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 200;
        sunLight.shadow.camera.left = -80;
        sunLight.shadow.camera.right = 80;
        sunLight.shadow.camera.top = 80;
        sunLight.shadow.camera.bottom = -80;
        scene.add(sunLight);

        // 半球光
        hemisphereLight = new THREE.HemisphereLight(0x444466, 0x222211, 0.3);
        scene.add(hemisphereLight);
    }

    // 火光点光源
    function addFireLights() {
        const fireColors = [0xff6600, 0xff4400, 0xff8800];
        for (let i = 0; i < 5; i++) {
            const fire = new THREE.PointLight(fireColors[i % 3], 0.8, 15);
            const pos = City.getRandomWalkablePos();
            fire.position.set(pos.x, 2, pos.z);
            scene.add(fire);
        }
    }

    // 事件绑定
    function setupEvents() {
        // 开始按钮
        document.getElementById('start-btn').addEventListener('click', () => {
            Game.start();
        });

        // 重新开始按钮
        document.getElementById('restart-btn').addEventListener('click', () => {
            Game.restart(scene);
        });

        // 鼠标按下/抬起
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) mouseDown = true;
        });
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) mouseDown = false;
        });

        // 窗口大小变化
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // 指针锁定变化时显示提示
        document.addEventListener('pointerlockchange', () => {
            if (!document.pointerLockElement && Game.state === 'playing') {
                // 指针解锁时暂停（点击重新锁定）
            }
        });

        // 点击画布重新锁定指针
        renderer.domElement.addEventListener('click', () => {
            if (Game.state === 'playing' && !document.pointerLockElement) {
                document.body.requestPointerLock();
            }
        });
    }

    // 游戏循环
    function animate() {
        requestAnimationFrame(animate);

        const dt = Math.min(clock.getDelta(), 0.05); // 限制最大dt防止跳帧

        if (Game.state === 'playing' && Player.isLocked) {
            // 更新玩家
            Player.update(dt);

            // 更新丧尸
            Zombie.update(dt, Player.position);

            // 更新物品
            Items.update(dt);

            // 更新武器
            Weapon.update(dt);

            // 更新生存
            Survival.update(dt);

            // 更新天气
            Weather.update(dt, Player.position);

            // 更新环境特效
            Environment.update(dt, Player.position);

            // 更新屏幕特效
            Effects.update(dt);

            // 更新游戏状态
            Game.update(dt);

            // 处理射击
            if (mouseDown && Weapon.hasWeapon() && !Weapon.isReloading) {
                const shotResult = Weapon.fire(camera);
                if (shotResult) {
                    Combat.processShot(shotResult);
                }
            }

            // 处理换弹
            if (Player.consumeReload()) {
                Weapon.startReload();
            }

            // 处理拾取
            if (Player.consumeInteract()) {
                Game.onPickup();
            }

            // 处理使用医疗包
            if (Player.consumeUseMedkit()) {
                Survival.useMedkit();
            }

            // 处理使用食物
            if (Player.consumeUseFood()) {
                Survival.useFood();
            }

            // 丧尸攻击玩家
            const zombieDamage = Combat.processZombieAttacks(dt);
            if (zombieDamage > 0) {
                Survival.takeDamage(zombieDamage, 'zombie');
            }

            // 更新HUD
            Game.updateWeaponHUD();
            Game.updatePickupHint();
            Game.updateFloorIndicator();
            Game.updateWeatherHUD();
        }

        renderer.render(scene, camera);
    }

    // 启动
    init();
})();
