// weather.js - 天气与昼夜循环系统
const Weather = {
    // 时间系统
    gameTime: 8,          // 当前游戏时间（小时，0-24）
    timeSpeed: 0.8,       // 游戏时间速度（1秒=多少游戏分钟）
    dayLength: 3,         // 一个完整昼夜的现实时间（分钟）

    // 天气状态
    weather: 'sunny',     // sunny, cloudy, rainy
    weatherTimer: 0,      // 天气变化计时器
    weatherDuration: 60,  // 当前天气持续时间（秒）
    transitionProgress: 1, // 过渡进度 0-1

    // 天气参数（当前/目标）
    current: {
        skyTop: new THREE.Color(0x1a1a2e),
        skyBottom: new THREE.Color(0x0a0a1a),
        ambientColor: new THREE.Color(0x404050),
        ambientIntensity: 0.4,
        sunColor: new THREE.Color(0x8888cc),
        sunIntensity: 0.6,
        fogColor: new THREE.Color(0x1a1a2e),
        fogNear: 30,
        fogFar: 120,
        rainIntensity: 0,
        moonVisible: true
    },

    target: {},

    // 雨滴系统
    rainDrops: [],
    rainGroup: null,
    maxRainDrops: 800,
    rainArea: 100,

    // 场景引用
    scene: null,
    ambientLight: null,
    sunLight: null,
    hemisphereLight: null,
    skyMesh: null,
    moonMesh: null,
    fog: null,

    // 初始化
    init(scene, lights) {
        this.scene = scene;
        this.ambientLight = lights.ambient;
        this.sunLight = lights.sun;
        this.hemisphereLight = lights.hemisphere;

        // 随机初始时间
        this.gameTime = 6 + Math.random() * 14; // 6:00-20:00

        // 随机初始天气
        const weathers = ['sunny', 'sunny', 'cloudy', 'rainy'];
        this.weather = weathers[Math.floor(Math.random() * weathers.length)];

        // 初始化天空球
        this.initSky();

        // 初始化雨滴
        this.initRain();

        // 计算初始目标
        this.updateTarget();

        // 立即应用（无过渡）
        this.copyTargetToCurrent();
        this.applyToScene();
    },

    // 初始化天空
    initSky() {
        // 天空球
        const skyGeo = new THREE.SphereGeometry(150, 16, 16);
        const skyMat = new THREE.MeshBasicMaterial({
            color: 0x0a0a1a,
            side: THREE.BackSide
        });
        this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.skyMesh);

        // 月亮
        const moonGeo = new THREE.SphereGeometry(5, 16, 16);
        const moonMat = new THREE.MeshBasicMaterial({ color: 0xccccdd });
        this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
        this.moonMesh.position.set(60, 90, -80);
        this.scene.add(this.moonMesh);

        // 太阳（初始不可见）
        const sunGeo = new THREE.SphereGeometry(8, 16, 16);
        const sunMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
        this.sunMesh.position.set(-60, 100, -80);
        this.scene.add(this.sunMesh);

        // 星星
        this.stars = [];
        const starGeo = new THREE.SphereGeometry(0.3, 4, 4);
        const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        for (let i = 0; i < 80; i++) {
            const star = new THREE.Mesh(starGeo, starMat);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.4;
            const r = 140;
            star.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi) + 20,
                r * Math.sin(phi) * Math.sin(theta)
            );
            star.visible = false;
            this.scene.add(star);
            this.stars.push(star);
        }
    },

    // 初始化雨滴粒子
    initRain() {
        this.rainGroup = new THREE.Group();
        this.rainDrops = [];

        const dropGeo = new THREE.BoxGeometry(0.02, 0.4, 0.02);
        const dropMat = new THREE.MeshBasicMaterial({
            color: 0x8899bb,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < this.maxRainDrops; i++) {
            const drop = new THREE.Mesh(dropGeo, dropMat.clone());
            drop.position.set(
                (Math.random() - 0.5) * this.rainArea,
                Math.random() * 30,
                (Math.random() - 0.5) * this.rainArea
            );
            drop.visible = false;
            this.rainGroup.add(drop);
            this.rainDrops.push({
                mesh: drop,
                speed: 12 + Math.random() * 8,
                splashTimer: 0
            });
        }

        this.scene.add(this.rainGroup);
    },

    // 更新
    update(dt, playerPos) {
        // 1. 更新时间
        this.gameTime += (this.timeSpeed * dt) / 60;
        if (this.gameTime >= 24) this.gameTime -= 24;

        // 2. 天气变化计时
        this.weatherTimer += dt;
        if (this.weatherTimer >= this.weatherDuration) {
            this.changeWeather();
        }

        // 3. 过渡
        if (this.transitionProgress < 1) {
            this.transitionProgress = Math.min(1, this.transitionProgress + dt * 0.3);
            this.lerpParams();
        }

        // 4. 根据时间调整天空颜色（在天气基础上）
        this.updateSkyByTime();

        // 5. 更新天体位置
        this.updateCelestialBodies();

        // 6. 更新雨滴
        this.updateRain(dt, playerPos);

        // 7. 应用到场景
        this.applyToScene();
    },

    // 天气变化
    changeWeather() {
        this.weatherTimer = 0;
        this.weatherDuration = 40 + Math.random() * 80; // 40-120秒

        // 随机选择新天气（加权）
        const hour = this.gameTime;
        let choices;
        if (hour >= 6 && hour <= 18) {
            // 白天：更可能晴天
            choices = ['sunny', 'sunny', 'sunny', 'cloudy', 'cloudy', 'rainy'];
        } else {
            // 夜晚：更可能阴天/雨天
            choices = ['sunny', 'cloudy', 'cloudy', 'rainy', 'rainy'];
        }

        let newWeather;
        do {
            newWeather = choices[Math.floor(Math.random() * choices.length)];
        } while (newWeather === this.weather && Math.random() < 0.7);

        this.weather = newWeather;
        this.transitionProgress = 0;
        this.updateTarget();
    },

    // 计算目标天气参数
    updateTarget() {
        const hour = this.gameTime;
        const isNight = hour < 6 || hour >= 20;
        const isDawn = hour >= 5 && hour < 7;
        const isDusk = hour >= 18 && hour < 20;

        // 基础时间颜色
        let skyTopR, skyTopG, skyTopB;
        let skyBotR, skyBotG, skyBotB;
        let ambientR, ambientG, ambientB;
        let sunR, sunG, sunB;

        if (hour >= 5 && hour < 7) {
            // 黎明
            const t = (hour - 5) / 2;
            skyTopR = 0.1 + t * 0.3; skyTopG = 0.1 + t * 0.2; skyTopB = 0.2 + t * 0.2;
            skyBotR = 0.3 + t * 0.3; skyBotG = 0.15 + t * 0.2; skyBotB = 0.1 + t * 0.1;
            ambientR = 0.3 + t * 0.2; ambientG = 0.2 + t * 0.15; ambientB = 0.2 + t * 0.1;
            sunR = 0.9; sunG = 0.5 + t * 0.3; sunB = 0.3 + t * 0.3;
        } else if (hour >= 7 && hour < 10) {
            // 上午
            const t = (hour - 7) / 3;
            skyTopR = 0.4 + t * 0.1; skyTopG = 0.3 + t * 0.2; skyTopB = 0.4 + t * 0.3;
            skyBotR = 0.6; skyBotG = 0.4 + t * 0.1; skyBotB = 0.2 + t * 0.2;
            ambientR = 0.5 + t * 0.1; ambientG = 0.4 + t * 0.1; ambientB = 0.3 + t * 0.1;
            sunR = 1.0; sunG = 0.8 + t * 0.1; sunB = 0.6 + t * 0.2;
        } else if (hour >= 10 && hour < 14) {
            // 正午
            skyTopR = 0.5; skyTopG = 0.5; skyTopB = 0.7;
            skyBotR = 0.6; skyBotG = 0.5; skyBotB = 0.4;
            ambientR = 0.6; ambientG = 0.5; ambientB = 0.4;
            sunR = 1.0; sunG = 0.9; sunB = 0.8;
        } else if (hour >= 14 && hour < 18) {
            // 下午
            const t = (hour - 14) / 4;
            skyTopR = 0.5 - t * 0.1; skyTopG = 0.5 - t * 0.1; skyTopB = 0.7 - t * 0.2;
            skyBotR = 0.6 - t * 0.1; skyBotG = 0.5 - t * 0.15; skyBotB = 0.4 - t * 0.1;
            ambientR = 0.6 - t * 0.1; ambientG = 0.5 - t * 0.1; ambientB = 0.4 - t * 0.1;
            sunR = 1.0; sunG = 0.9 - t * 0.2; sunB = 0.8 - t * 0.3;
        } else if (hour >= 18 && hour < 20) {
            // 黄昏
            const t = (hour - 18) / 2;
            skyTopR = 0.4 - t * 0.2; skyTopG = 0.3 - t * 0.15; skyTopB = 0.5 - t * 0.2;
            skyBotR = 0.5 - t * 0.1; skyBotG = 0.25 - t * 0.1; skyBotB = 0.15;
            ambientR = 0.5 - t * 0.2; ambientG = 0.3 - t * 0.1; ambientB = 0.25 - t * 0.05;
            sunR = 1.0; sunG = 0.5 - t * 0.3; sunB = 0.2;
        } else {
            // 夜晚
            skyTopR = 0.06; skyTopG = 0.06; skyTopB = 0.12;
            skyBotR = 0.04; skyBotG = 0.04; skyBotB = 0.08;
            ambientR = 0.15; ambientG = 0.15; ambientB = 0.2;
            sunR = 0.4; sunG = 0.4; sunB = 0.5; // 月光
        }

        // 天气修正
        const t = this.target;
        switch (this.weather) {
            case 'sunny':
                t.skyTop = new THREE.Color(skyTopR, skyTopG, skyTopB);
                t.skyBottom = new THREE.Color(skyBotR, skyBotG, skyBotB);
                t.ambientColor = new THREE.Color(ambientR, ambientG, ambientB);
                t.ambientIntensity = isNight ? 0.25 : 0.5;
                t.sunColor = new THREE.Color(sunR, sunG, sunB);
                t.sunIntensity = isNight ? 0.3 : 0.8;
                t.fogColor = new THREE.Color(skyTopR * 0.8, skyTopG * 0.8, skyTopB * 0.8);
                t.fogNear = 40;
                t.fogFar = 150;
                t.rainIntensity = 0;
                t.moonVisible = isNight;
                break;

            case 'cloudy':
                t.skyTop = new THREE.Color(skyTopR * 0.5, skyTopG * 0.5, skyTopB * 0.6);
                t.skyBottom = new THREE.Color(skyBotR * 0.4, skyBotG * 0.4, skyBotB * 0.4);
                t.ambientColor = new THREE.Color(ambientR * 0.7, ambientG * 0.7, ambientB * 0.7);
                t.ambientIntensity = isNight ? 0.2 : 0.4;
                t.sunColor = new THREE.Color(sunR * 0.7, sunG * 0.7, sunB * 0.7);
                t.sunIntensity = isNight ? 0.15 : 0.4;
                t.fogColor = new THREE.Color(
                    skyTopR * 0.4 + 0.1,
                    skyTopG * 0.4 + 0.1,
                    skyTopB * 0.4 + 0.1
                );
                t.fogNear = 25;
                t.fogFar = 100;
                t.rainIntensity = 0;
                t.moonVisible = false;
                break;

            case 'rainy':
                t.skyTop = new THREE.Color(0.08, 0.08, 0.12);
                t.skyBottom = new THREE.Color(0.06, 0.06, 0.08);
                t.ambientColor = new THREE.Color(0.15, 0.15, 0.2);
                t.ambientIntensity = 0.25;
                t.sunColor = new THREE.Color(0.3, 0.3, 0.4);
                t.sunIntensity = isNight ? 0.1 : 0.2;
                t.fogColor = new THREE.Color(0.08, 0.08, 0.1);
                t.fogNear = 15;
                t.fogFar = 70;
                t.rainIntensity = 0.5 + Math.random() * 0.5;
                t.moonVisible = false;
                break;
        }

        // 复制目标到当前的起始值
        if (this.transitionProgress >= 1) {
            this.copyTargetToCurrent();
        }
    },

    copyTargetToCurrent() {
        const c = this.current;
        const t = this.target;
        c.skyTop.copy(t.skyTop);
        c.skyBottom.copy(t.skyBottom);
        c.ambientColor.copy(t.ambientColor);
        c.ambientIntensity = t.ambientIntensity;
        c.sunColor.copy(t.sunColor);
        c.sunIntensity = t.sunIntensity;
        c.fogColor.copy(t.fogColor);
        c.fogNear = t.fogNear;
        c.fogFar = t.fogFar;
        c.rainIntensity = t.rainIntensity;
        c.moonVisible = t.moonVisible;
    },

    // 线性插值过渡
    lerpParams() {
        const t = this.transitionProgress;
        const c = this.current;
        const tgt = this.target;

        c.skyTop.lerp(tgt.skyTop, t * 0.05);
        c.skyBottom.lerp(tgt.skyBottom, t * 0.05);
        c.ambientColor.lerp(tgt.ambientColor, t * 0.05);
        c.ambientIntensity += (tgt.ambientIntensity - c.ambientIntensity) * t * 0.05;
        c.sunColor.lerp(tgt.sunColor, t * 0.05);
        c.sunIntensity += (tgt.sunIntensity - c.sunIntensity) * t * 0.05;
        c.fogColor.lerp(tgt.fogColor, t * 0.05);
        c.fogNear += (tgt.fogNear - c.fogNear) * t * 0.05;
        c.fogFar += (tgt.fogFar - c.fogFar) * t * 0.05;
        c.rainIntensity += (tgt.rainIntensity - c.rainIntensity) * t * 0.05;
    },

    // 根据时间微调天空
    updateSkyByTime() {
        // 已在 updateTarget 中处理
    },

    // 更新天体位置
    updateCelestialBodies() {
        const hour = this.gameTime;

        // 太阳位置（6点升起，18点落下）
        const sunAngle = ((hour - 6) / 12) * Math.PI;
        const sunY = Math.sin(sunAngle) * 100;
        const sunX = Math.cos(sunAngle) * 80;
        this.sunMesh.position.set(sunX, Math.max(-20, sunY), -80);
        this.sunMesh.visible = hour >= 5.5 && hour <= 18.5;

        // 太阳光照方向跟随太阳
        if (this.sunLight) {
            this.sunLight.position.set(sunX, Math.max(10, sunY), -30);
        }

        // 月亮位置（19点升起，5点落下）
        const moonAngle = ((hour - 19) / 10) * Math.PI;
        const moonY = Math.sin(moonAngle) * 100;
        const moonX = -Math.cos(moonAngle) * 80;
        this.moonMesh.position.set(moonX, Math.max(-20, moonY), -80);
        this.moonMesh.visible = this.current.moonVisible;

        // 星星可见性
        const starOpacity = (hour >= 20 || hour < 5) ? 1.0 :
            (hour >= 19 ? (hour - 19) : (hour < 6 ? 1 : 0));
        for (const star of this.stars) {
            star.visible = starOpacity > 0.3;
        }
    },

    // 更新雨滴
    updateRain(dt, playerPos) {
        const rainIntensity = this.current.rainIntensity;
        const activeCount = Math.floor(rainIntensity * this.maxRainDrops);

        for (let i = 0; i < this.maxRainDrops; i++) {
            const drop = this.rainDrops[i];

            if (i < activeCount) {
                drop.mesh.visible = true;

                // 下落
                drop.mesh.position.y -= drop.speed * dt;

                // 跟随玩家位置（保持雨滴在周围）
                const offsetX = drop.mesh.position.x - playerPos.x;
                const offsetZ = drop.mesh.position.z - playerPos.z;

                if (drop.mesh.position.y < 0) {
                    // 落地重置
                    drop.mesh.position.set(
                        playerPos.x + (Math.random() - 0.5) * this.rainArea,
                        20 + Math.random() * 10,
                        playerPos.z + (Math.random() - 0.5) * this.rainArea
                    );

                    // 溅水效果（简单闪烁）
                    drop.mesh.material.opacity = 1.0;
                }

                // 远离玩家的雨滴重置
                if (Math.abs(offsetX) > this.rainArea / 2 || Math.abs(offsetZ) > this.rainArea / 2) {
                    drop.mesh.position.set(
                        playerPos.x + (Math.random() - 0.5) * this.rainArea,
                        10 + Math.random() * 20,
                        playerPos.z + (Math.random() - 0.5) * this.rainArea
                    );
                }

                // 风偏移
                drop.mesh.position.x += 2 * dt;

                // 透明度变化
                drop.mesh.material.opacity = 0.3 + rainIntensity * 0.4;
            } else {
                drop.mesh.visible = false;
            }
        }
    },

    // 应用参数到场景
    applyToScene() {
        const c = this.current;

        // 天空颜色
        if (this.skyMesh) {
            this.skyMesh.material.color.copy(c.skyTop);
        }

        // 环境光
        if (this.ambientLight) {
            this.ambientLight.color.copy(c.ambientColor);
            this.ambientLight.intensity = c.ambientIntensity;
        }

        // 方向光
        if (this.sunLight) {
            this.sunLight.color.copy(c.sunColor);
            this.sunLight.intensity = c.sunIntensity;
        }

        // 半球光
        if (this.hemisphereLight) {
            this.hemisphereLight.color.copy(c.skyTop);
            this.hemisphereLight.groundColor.copy(c.fogColor);
            this.hemisphereLight.intensity = c.ambientIntensity * 0.6;
        }

        // 雾
        if (this.scene.fog) {
            this.scene.fog.color.copy(c.fogColor);
            this.scene.fog.near = c.fogNear;
            this.scene.fog.far = c.fogFar;
        }

        // 背景色
        this.scene.background = c.fogColor;
    },

    // 获取时间字符串
    getTimeString() {
        const hour = Math.floor(this.gameTime);
        const min = Math.floor((this.gameTime % 1) * 60);
        return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    },

    // 获取时间段名称
    getTimePeriod() {
        const h = this.gameTime;
        if (h >= 5 && h < 7) return '黎明';
        if (h >= 7 && h < 10) return '上午';
        if (h >= 10 && h < 14) return '正午';
        if (h >= 14 && h < 17) return '下午';
        if (h >= 17 && h < 19) return '黄昏';
        if (h >= 19 && h < 22) return '傍晚';
        return '深夜';
    },

    // 获取天气名称
    getWeatherName() {
        switch (this.weather) {
            case 'sunny': return '☀ 晴天';
            case 'cloudy': return '☁ 阴天';
            case 'rainy': return '🌧 雨天';
            default: return '';
        }
    },

    // 是否是夜晚
    isNight() {
        return this.gameTime < 6 || this.gameTime >= 20;
    },

    // 重置
    reset() {
        this.gameTime = 6 + Math.random() * 14;
        this.weather = 'sunny';
        this.weatherTimer = 0;
        this.transitionProgress = 1;

        // 清除雨滴
        for (const drop of this.rainDrops) {
            drop.mesh.visible = false;
        }
    }
};
