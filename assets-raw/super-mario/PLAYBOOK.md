# SMB 屏保整体玩法 + 渲染规划

> 目标：把 57 个 sprite 串成"屏保级横版动作"，每条规则都能对回 NES 原版 / Java / C++ 源码。下面所有数值都是**60fps 等价**（板载会按比例缩 30fps）。

---

## 1. 屏保设定（跟冒险岛/Kof97 一致）

```
画布: 64×64 LED
fps:  网页 30 / 板载 ~25
方向: 自动右跑（mario.vx = 5 px/帧, NES 原版速度）
死亡: 不存在 — 撞敌 = 受伤无敌闪烁，掉坑 = 重置位置
循环: 镜头横向滚动到关底就 reset, 边跑边自动随机抽签出元素
HUD:  顶部一行时间 (#xxxxxx 颜色待定, 类似 KOF97)
```

---

## 2. 主角状态机

```
  PlayerStatus    ∈ { SMALL, SUPER, FIRE }
  PlayerMotion   ∈ { IDLE, WALKING, JUMPING, FALLING }
  PlayerInjury    ∈ 0..8     // InjuryTimer (受伤无敌帧数, NES 原版 8)
  StarTimer       ∈ 0..35    // StarInvincibleTimer (NES 原版 $23 = 35)
  facingRight     ∈ bool     // 屏保里恒为 true（向右跑）
```

### 2.1 当前帧 sprite 选择

```
form = SMALL | SUPER | FIRE         (size 16×16 / 16×32 / 16×32)
dir  = right                          (向左走帧不用，但镜像备用)

if (jumping || falling)  → mario_<form>_right_jump
else if (walking)        → 4 帧循环: idle → walk1 → walk2 → walk3 → idle...
                            每 5 帧切一次（来自 MarioForm.java animate(5)）
else                      → mario_<form>_right_idle
```

### 2.2 受伤无敌渲染（撞敌后 8 帧）

```
if (InjuryTimer > 0) {
  show_sprite = (InjuryTimer & 1) ? render() : skip();   // 隔帧闪
  InjuryTimer--;
}
```

### 2.3 ★ 星星无敌调色板循环（NES 原版精确算法）

```
// 4 套调色板替换 mario 的"帽红 / 衣红 / 裤蓝"
PALETTES = [
  { hat: 0xE40000, body: 0xE40000, leg: 0x0000A8 },  // 0: 原色
  { hat: 0xFFFFFF, body: 0xFFFFFF, leg: 0x00A800 },  // 1: 白衣绿裤 (Luigi)
  { hat: 0xFC8800, body: 0xFC8800, leg: 0xE40000 },  // 2: 橙红
  { hat: 0x00B8FC, body: 0x00B8FC, leg: 0x0000A8 },  // 3: 蓝
];

if (StarTimer > 0) {
  shift = (StarTimer > 8) ? 1 : 3;   // > 8 快闪每 2 帧, ≤ 8 慢闪每 8 帧
  idx   = (frameCounter >> shift) & 3;
  apply_palette(PALETTES[idx]);
} else {
  apply_palette(PALETTES[0]);
}
```

### 2.4 状态升级降级

| 触发 | small → | super → | fire → |
|---|---|---|---|
| 吃 super_mushroom | super | (留 super) | (留 fire) |
| 吃 fire_flower | super | fire | (留 fire) |
| 吃 oneup_mushroom | (生命+1，无形态变化) | 同 | 同 |
| 吃 star | StarTimer = 35 (无形态变化) | 同 | 同 |
| 撞敌（横向） | injuryTimer=8 但**不死**(屏保) | super → small | fire → super |
| 掉坑 | resetX | resetX | resetX |

---

## 3. 敌人状态机

```
EnemyType  ∈ { GOOMBA, KOOPA, PARATROOPA, PIRANHA }
EnemyState ∈ { WALK, DEAD, SHELL }   // SHELL 仅 KOOPA
deadTimer  ∈ 0..30                   // 死亡渲染倒计时, 30帧后移除（Java 是 1500ms）
```

### 3.1 各类敌人行为

| 敌人 | 速度 | 出现位置 | 死亡渲染 | 备注 |
|---|---|---|---|---|
| GOOMBA | 1.5 px/帧 向左走 | 地面 | 切 `goomba_dead.png` 0.5 秒后消失 | 2 帧走路 |
| KOOPA | 1.5 px/帧 向左走 | 地面 | 第一次踩 → SHELL 状态(`koopa_shell.png`)，第二次撞 → 移除 | 2 帧走路 |
| PARATROOPA | 上下浮动 ±4 px (周期 60 帧) + 向左飘 1 px/帧 | 空中 | 踩一下 → 退化为 KOOPA | 飞甲龟，2 帧扇翅 |
| PIRANHA | 不移动，从管道顶往上冒，再缩回 | 永远绑定一根管道 | 不死（只能避开） | 周期 120 帧：60 帧伸出 / 60 帧缩回，期间 2 帧开闭循环 |

### 3.2 敌人死亡分支（来自 MapManager.checkBottomCollisions/checkFireballContact）

```
if mario.vy > 0 && mario.bottomBox ∩ enemy.topBox:
   → 踩死
   → mario.vy = -10  (反弹, NES 原版 MARIO_BOUNCE = 3.5)
   → enemy.state = DEAD, deadTimer = 30
   → +100 分

if fireball ∩ enemy:
   → 烧死
   → enemy.state = DEAD (倒着翻转动画), deadTimer = 30
   → fireball 消失
   → +100 分

if star_active && mario ∩ enemy:
   → 星星撞死
   → enemy.state = DEAD (空翻), deadTimer = 30
   → mario 不受伤
   → +200 分

if mario.sideBox ∩ enemy.sideBox && !star_active && injuryTimer == 0:
   → 受伤
   → mario 降级 (fire→super→small)
   → injuryTimer = 8
   → 不消除敌人
```

**渲染规则**：
- GOOMBA 死后 → 直接切 `goomba_dead.png`（被压扁的扁圆）
- KOOPA 第一次踩 → 切 `koopa_shell.png`，速度归零，stay; 屏保里**不再拿来当弹射子弹用**
- 烧死/星星撞死 → 用 walk1 翻转 180° + dyOffY 上抛 -2 px/帧（仿冒险岛蜗牛被斧头打的死亡轨迹）

### 3.3 PIRANHA 特殊（必须绑管道）

```
piranhaState: { x, pipeY: pipe 顶 y, t: 0..120 }
每帧:
  if t < 60: 渲染高度 = (t / 60) * 16   (从管道里冒出，0→16px)
  else:      渲染高度 = ((120-t) / 60) * 16  (缩回, 16→0px)
  spriteFrame = (t >> 3) & 1 ? piranha_open : piranha_close   // 每 8 帧切开闭
  t++; if t == 120: t = 0  (循环)
mario.x 与 pipe 距离 < 24 时 piranha 缩回管道（NES 原版机制）
```

---

## 4. 砖块 / 道具 状态机

### 4.1 砖块类型

| 类型 | breakable | 顶到反应 | 渲染 sprite |
|---|---|---|---|
| ordinary_brick | 仅 super/fire 可破 | 小 mario 顶 → 弹砖动画(向上 4px 0.2s); super/fire 顶 → 4 帧碎裂飞溅 | `ordinary_brick.png` |
| surprise_brick | 不破，固定 | 顶第一次 → 抽签出道具 + 切 `used_brick.png`; 之后顶不再出 | `surprise_brick.png` → `used_brick.png` |
| used_brick | 不破，固定 | 顶 → 弹一下不出东西 | `used_brick.png` |
| ground_brick | 不破，固定 | 不能顶（地面） | `ground_brick.png` |
| pipe (16×32) | 不破，固定 | 不能顶（侧面挡路） | `pipe.png` 上半 + 下半（96×96 切一半） |

### 4.2 砖块碎裂渲染（仅 ordinary 被 super 顶到）

```
碎块 4 个, 起始位置: 砖中心 ±8 px, ±0 px
每个碎块物理: vx = ±2, vy = -6, gy = 0.5
渲染: 4 帧 debris.png 都用同一张, 旋转每 4 帧切一次（屏保不需要旋转动画的话直接画静态 8×8 块）
持续 30 帧后移除
```

### 4.3 ?砖抽签（surprise_brick 被顶第一次）

```
prize_table:
  小 mario:  super_mushroom (100%)
  super:     fire_flower (60%) | coin (40%)
  fire:      coin (70%) | oneup_mushroom (30%)

抽出 prize 后:
  - 砖切换为 used_brick
  - prize 从砖顶冒出: y -= 16 px (0.5s 内分多帧上移)
  - 冒完后:
      mushroom/oneup_mushroom: vx = 2 (向右走), vy = 0, 受重力, 落地继续走, 撞墙反向
      fire_flower: 不动 (固定原位 0.3s 后等 mario 来吃)
      coin: 直接 vy = -6 上升, 顶到一定高度自动消失 + 加 1 金币 (不需要接触)
```

### 4.4 道具效果（来自 §2.4 表）

```
super_mushroom.onTouch: small→super, +125 分
fire_flower.onTouch:    super→fire (small→super), +150 分
oneup_mushroom.onTouch: 生命+1, +200 分 (屏保里只是冒"1UP"floatey 文字)
coin: 不需要接触, prize.reveal 时直接 +1 金币 +100 分
star.onTouch:            StarTimer = 35, +0 分（屏保里直接撞）
```

---

## 5. Fireball（fire mario 投火球）

```
触发: fire mario 每隔 60 帧自动投一次（屏保里不再有按键，定时投）
位置: mario.x + 12 (前方), mario.y + 4
速度: vx = 10 (NES 原版), vy = 0 起初
重力: gy = 0.5, 落地反弹 vy = -4 (PROJECTILE_BOUNCE)
寿命: 60 帧后消失（撞砖/撞敌/出屏 提前消失）
渲染: 飞行 = fireball_fly.png (按 frame & 1 切左右镜像 → 旋转动画)
       撞 = fireball_blast.png 显示 6 帧后消失
```

---

## 6. 整场景 tick 循环（屏保运行核心）

```js
function tickScene(state, params) {
  state.frame++;

  // ── 1. 镜头滚动 ──
  state.scrollX += SCROLL_SPEED;  // 0.5 ~ 1 px/帧

  // ── 2. mario 物理 ──
  applyGravity(mario);
  applyHorizontalSpeed(mario, AUTO_RIGHT_SPEED);
  collideTilesH(mario);   // 碰墙就停 / 碰管道也停
  collideTilesV(mario);   // 落地置 falling=false; 顶到砖块触发 reveal()

  // ── 3. 敌人物理 + 行为 ──
  for (each enemy) {
    if enemy.state == DEAD:
      enemy.deadTimer--; if enemy.deadTimer == 0: remove
      continue
    if enemy is PARATROOPA:
      enemy.y += sin(frame / 10) * 0.4  // 上下浮动
    enemy.x += enemy.vx
    applyGravity(enemy)
    collideTilesH(enemy) → 碰墙反向
    collideTilesV(enemy) → 落地停
  }

  // ── 4. piranha 周期 ──
  for (each piranha): piranha.t = (piranha.t + 1) % 120

  // ── 5. fireball 物理 ──
  for (each fireball) {
    fireball.x += fireball.vx
    applyGravity(fireball); if 落地: fireball.vy = -4
    fireball.life--; if fireball.life == 0 || 出屏: remove
  }

  // ── 6. 碰撞解析（顺序很重要！） ──
  checkBottomCollisions()  // 踩敌
  checkTopCollisions()     // 顶砖
  checkSideCollisions()    // 撞敌（受伤判定）
  checkPrizeCollision()    // 道具被吃
  checkFireballContact()   // 火球烧敌

  // ── 7. timer 倒计时 ──
  if (mario.injuryTimer > 0) mario.injuryTimer--;
  if (mario.starTimer > 0)   mario.starTimer--;

  // ── 8. fire mario 自动投火 ──
  if (mario.form == FIRE && state.frame % 60 == 0) spawnFireball();

  // ── 9. 出生器（spawner，复刻冒险岛 spawnInterval 抽签） ──
  if (--state.spawnCooldown <= 0) {
    抽签:
      30% 出 GOOMBA
      20% 出 KOOPA
      10% 出 PARATROOPA
      15% 出 ?砖（顶上有道具）
      10% 出 ordinary_brick 排列
      10% 出 pipe + piranha
       5% 出 coin 排列（地面拾取）
    state.spawnCooldown = 90 + random(60);  // 3~5 秒一次
  }

  // ── 10. 出屏对象清理 ──
  filter out scrollX 之外 32px 的对象
}
```

---

## 7. 渲染层（renderScene → pixels Map）

```js
function renderScene(state, layoutOpts) {
  const pixels = new Map();
  drawBackground(pixels, state.scrollX);  // 山/云/灌木循环背景
  drawTiles(pixels, state);               // 地面砖 + 砖块 + 管道
  drawEnemies(pixels, state);             // goomba/koopa/paratroopa/piranha
  drawPrizes(pixels, state);              // mushroom/coin/star/fire_flower 自由对象
  drawFireballs(pixels, state);
  drawDebris(pixels, state);
  drawMario(pixels, state);               // 最后画，叠在最上层
  drawHUD(pixels, state);                 // 时间 + 金币
  return pixels;
}
```

**关键渲染细节**：
1. `drawMario` 内部按 §2 状态机查表选 sprite，并应用 §2.3 调色板替换（如果 starTimer > 0）
2. `drawTiles` 注意 ordinary_brick 在被顶时 yOffset = sin(撞击 t) * -4（弹起动画 4 帧）
3. `drawEnemies` 死亡时翻转上下 + dyOff -= 2 每帧（被踩死除外，goomba 直接切 dead 帧）
4. `drawPrizes` 注意 mushroom 从砖顶冒出过程: 用 clip 实现"一格一格冒出来"
5. 整场景**不画完整地图**，只画 `mario.x ± 32` 范围内对象（屏保性能 + 64px 视野限制）

---

## 8. 板载移植（参考冒险岛 effect 实现）

```cpp
// super_mario_effect.cpp 主结构
class SuperMarioEffect : public Effect {
  PlayerState player;
  std::vector<Enemy> enemies;
  std::vector<Tile> tiles;
  std::vector<Prize> prizes;
  std::vector<Fireball> fireballs;
  uint32_t frame;
  uint32_t scrollX;

  void update() override {
    tickScene(*this);   // 同上 §6 逻辑, 整数化（避免 float）
  }

  void render(LedFb& fb) override {
    // 同 §7, drawMario 时查 PROGMEM 像素表
  }
};
```

PROGMEM 数据来自 `theme_assets/super_mario/sprites_*.h`：
- `sprites_mario.h` (30 帧 × 平均 60 个非透明像素 ≈ 7 KB)
- `sprites_enemies.h` (10 个 ≈ 1.5 KB)
- `sprites_items.h` (8 个 ≈ 1 KB)
- `sprites_tiles.h` (6 个 ≈ 1 KB)
- `sprites_effects.h` (3 个 ≈ 0.3 KB)
- 总计约 11 KB Flash（KOF97 用了 58 KB，预算够）

---

## 9. 实现顺序（下一步）

1. **PNG → JS 像素数据** → `website/src/utils/superMarioSprites.js`（57 个 sprite, 每个 `{w, h, pixels: [{x,y,c}]}`）
2. **写 renderer** → `website/src/utils/superMarioRenderer.js`（实现 §6 + §7）
3. **写预览页** → `website/src/views/mobile/SuperMario.vue`（静态一帧 + 发送按钮，参考 KOF97）
4. **测试网页** → 确认 §2~§5 玩法都对再上板载
5. **PNG → PROGMEM** → `esp32-firmware/include/theme_assets/super_mario/sprites_*.h`
6. **板载 effect** → `esp32-firmware/src/super_mario_effect.cpp/h` + 6 处接入
7. **WebSocket** → `ws.startSuperMario()`
8. **完整文档** → `docs/super-mario-development-summary.md`

---

## 10. 字段表（最重要 - AGENTS.md 第 4 条要求）

### state 顶层

| 字段 | 来源 | 说明 |
|---|---|---|
| `frame` | NES FrameCounter | 自增帧计数 |
| `scrollX` | 自定义 | 镜头水平位移（px）|
| `mario` | NES Player_* | 见下 |
| `enemies[]` | NES Enemy_* | 见下 |
| `tiles[]` | 地图静态 | 见下 |
| `prizes[]` | NES Prize | 见下 |
| `fireballs[]` | NES Fireball | 见下 |
| `debris[]` | OrdinaryBrick.animation | 砖碎飞溅 |
| `spawnCooldown` | 屏保 spawner | 距下次抽签的帧数 |

### state.mario

| 字段 | 来源 | 说明 |
|---|---|---|
| `x`, `y` | NES Player_X_Position / Player_Y_Position | px |
| `vx`, `vy` | NES Player_X_Speed / Player_Y_Speed | px/帧 |
| `form` | NES PlayerStatus (0/1/2) | SMALL/SUPER/FIRE |
| `motion` | NES Player_State (0/1/2/3) | IDLE/WALKING/JUMPING/FALLING |
| `injuryTimer` | NES InjuryTimer ($079e) | 0..8 |
| `starTimer` | NES StarInvincibleTimer ($079f) | 0..35 |
| `facingRight` | NES PlayerFacingDir | 屏保里恒为 true |

### state.enemies[i]

| 字段 | 来源 | 说明 |
|---|---|---|
| `type` | NES Enemy_ID | GOOMBA/KOOPA/PARATROOPA/PIRANHA |
| `x`, `y`, `vx`, `vy` | NES Enemy_*_Position/Speed | |
| `state` | NES Enemy_State | WALK/DEAD/SHELL |
| `deadTimer` | 屏保扩展 | 死后剩余渲染帧数 |
| `pipeT` | 屏保扩展 | 仅 PIRANHA: 0..120 |
| `pipeBindX` | 屏保扩展 | 仅 PIRANHA: 绑定的 pipe x 坐标 |

### state.tiles[i]

| 字段 | 来源 | 说明 |
|---|---|---|
| `type` | 地图 | ordinary/surprise/used/ground/pipe |
| `x`, `y` | 地图 | px |
| `bumpT` | OrdinaryBrick.animate | 0..4 顶击弹起动画计数 |
| `revealed` | SurpriseBrick.reveal | 是否已经出过道具 |

### state.prizes[i]

| 字段 | 来源 | 说明 |
|---|---|---|
| `type` | NES PowerUpType | super_mushroom/oneup_mushroom/fire_flower/star/coin |
| `x`, `y`, `vx`, `vy` | BoostItem 物理 | |
| `revealed` | BoostItem.revealed | 是否已经从砖里冒完 |
| `revealT` | 屏保扩展 | 0..16 冒出过程帧数 |

> **不发明新字段**：若实现时发现字段不够，先停下来更新此表再写代码。
