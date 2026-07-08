// minimap.js - 小地图/指南针系统
const Minimap = {
    canvas: null,
    ctx: null,
    size: 160,
    scale: 0.7,
    visible: true,

    init() {
        this.canvas = document.getElementById('minimap-canvas');
        if (!this.canvas) return;
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.ctx = this.canvas.getContext('2d');
    },

    update(playerPos, playerRotation) {
        if (!this.ctx || !this.visible) return;

        const ctx = this.ctx;
        const s = this.size;
        const cx = s / 2;
        const cy = s / 2;
        const scale = this.scale;

        // 清除
        ctx.clearRect(0, 0, s, s);

        // 背景（圆形）
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, s / 2 - 2, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = 'rgba(10, 15, 20, 0.85)';
        ctx.fillRect(0, 0, s, s);

        // 坐标变换：以玩家为中心
        ctx.save();
        ctx.translate(cx, cy);

        // 绘制建筑
        this.drawBuildings(ctx, playerPos, scale);

        // 绘制物品
        this.drawItems(ctx, playerPos, scale);

        // 绘制丧尸
        this.drawZombies(ctx, playerPos, scale);

        ctx.restore();

        // 绘制玩家箭头（固定在中心）
        this.drawPlayerArrow(ctx, cx, cy, playerRotation);

        // 绘制指南针方向
        this.drawCompass(ctx, cx, cy, playerRotation);

        // 边框
        ctx.strokeStyle = 'rgba(255, 170, 68, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, s / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    },

    drawBuildings(ctx, playerPos, scale) {
        for (const b of City.buildings) {
            const bx = (b.centerX - playerPos.x) * scale;
            const bz = (b.centerZ - playerPos.z) * scale;
            const bw = b.width * scale;
            const bd = b.depth * scale;

            // 超出范围则跳过
            if (Math.abs(bx) > this.size / 2 + bw || Math.abs(bz) > this.size / 2 + bd) continue;

            if (b.enterable) {
                // 可进入建筑：根据类型着色
                const colors = {
                    shop: '#3366aa', restaurant: '#aa4433', bar: '#7744aa',
                    tower: '#556688', hospital: '#cc4444', school: '#44aa44',
                    mall: '#cc8800', police: '#3355aa'
                };
                ctx.fillStyle = colors[b.buildingType] || '#555';
            } else {
                ctx.fillStyle = '#2a2a2a';
            }

            ctx.fillRect(bx - bw / 2, bz - bd / 2, bw, bd);

            // 边框
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(bx - bw / 2, bz - bd / 2, bw, bd);

            // 多层建筑标记
            if (b.enterable && b.height > 5) {
                ctx.fillStyle = 'rgba(255,255,255,0.3)';
                ctx.font = '7px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('2F', bx, bz + 2);
            }
        }
    },

    drawItems(ctx, playerPos, scale) {
        for (const item of Items.items) {
            if (!item.isActive) continue;
            const ix = (item.position.x - playerPos.x) * scale;
            const iz = (item.position.z - playerPos.z) * scale;
            if (Math.abs(ix) > this.size / 2 || Math.abs(iz) > this.size / 2) continue;

            const colors = {
                weapon: '#ffcc00', ammo: '#ccaa44', medkit: '#ff4444', food: '#44cc44'
            };
            ctx.fillStyle = colors[item.def.type] || '#fff';
            ctx.beginPath();
            ctx.arc(ix, iz, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawZombies(ctx, playerPos, scale) {
        for (const z of Zombie.zombies) {
            if (!z.isAlive) continue;
            const zx = (z.mesh.position.x - playerPos.x) * scale;
            const zz = (z.mesh.position.z - playerPos.z) * scale;
            if (Math.abs(zx) > this.size / 2 || Math.abs(zz) > this.size / 2) continue;

            ctx.fillStyle = z.type === 'elite' ? '#ff2200' : '#ff4444';
            ctx.beginPath();
            ctx.arc(zx, zz, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawPlayerArrow(ctx, cx, cy, rotation) {
        ctx.save();
        ctx.translate(cx, cy);
        // 箭头指向玩家朝向（北=上）
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(-4, 4);
        ctx.lineTo(0, 2);
        ctx.lineTo(4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    },

    drawCompass(ctx, cx, cy, rotation) {
        const r = this.size / 2 - 12;
        ctx.save();
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 北（固定在上方）
        ctx.fillStyle = '#ff4444';
        ctx.fillText('N', cx, cy - r);

        // 其他方向
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText('S', cx, cy + r);
        ctx.fillText('E', cx + r, cy);
        ctx.fillText('W', cx - r, cy);

        ctx.restore();
    },

    toggle() {
        this.visible = !this.visible;
        if (this.canvas) {
            this.canvas.parentElement.style.display = this.visible ? 'block' : 'none';
        }
    },

    reset() {
        this.visible = true;
    }
};
