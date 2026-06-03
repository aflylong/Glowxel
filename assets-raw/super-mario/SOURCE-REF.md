# SMB 素材源 + sprite 坐标速查 (★ 完整版 v2)

> **运行**: `node extract-sprites.js` → 切出 57 个 PNG 到 `organized/`，并生成 `overview.png` 预览图

---

## 1. 资源文件来源（两套混合）

| 来源 | 项目 | 用途 |
|---|---|---|
| `source-ref/` | github.com/ahmetcandiroglu/Super-Mario-Bros (Java) | mario 30 帧 + 砖块/管道/基础道具 |
| `source-ref-3/` | github.com/Gold872/Super-Mario-Bros (C++ SDL2) | 食人花/星星/coin 多帧/fireball/飞甲龟/碎砖 |

**为什么两套**：ahmetcandiroglu 的 mario-forms.png 切出来的 mario 像素干净标准；它没有食人花/星星/paratroopa/coin 多帧；Gold872 这些都有，但 mario sheet 网格混乱，用 ahmetcandiroglu 那套更稳。

---

## 2. ahmetcandiroglu/sprite.png (240×240, 5 列 × 5 行 × 48×48 网格)

| 对象 | x | y | w | h | 输出文件 |
|---|---|---|---|---|---|
| 普通砖 | 0 | 0 | 48 | 48 | `tiles/ordinary_brick.png` |
| ?砖 (问号) | 48 | 0 | 48 | 48 | `tiles/surprise_brick.png` |
| 管道 | 96 | 0 | 96 | 96 | `tiles/pipe.png` |
| 终点旗杆 | 192 | 0 | 48 | 48 | `tiles/end_flag.png` |
| ?砖暗 (用过) | 0 | 48 | 48 | 48 | `tiles/used_brick.png` |
| 地砖 | 48 | 48 | 48 | 48 | `tiles/ground_brick.png` |
| 大蘑菇 | 48 | 192 | 48 | 48 | `items/super_mushroom.png` |
| 1up 蘑菇 | 96 | 192 | 48 | 48 | `items/oneup_mushroom.png` |
| 火花 | 144 | 192 | 48 | 48 | `items/fire_flower.png` |

---

## 3. ahmetcandiroglu/mario-forms.png (384×480, mario 三态 × 左右 × 5 帧)

每形态 5 帧动画 (idle + walk1-3 + jump), 上下排列 i=0..4.

| 形态 | 朝向 | col | w | h | 起始 x | 5 帧 y |
|---|---|---|---|---|---|---|
| 小 (form=0) | 左 | 1 | 52 | 48 | 0 | 0/48/96/144/192 |
| 小 | 右 | 2 | 52 | 48 | 52 | 0/48/96/144/192 |
| 大 (form=1) | 左 | 4 | 48 | 96 | 144 | 0/96/192/288/384 |
| 大 | 右 | 5 | 48 | 96 | 192 | 0/96/192/288/384 |
| 火 (form=2) | 左 | 7 | 48 | 96 | 288 | 0/96/192/288/384 |
| 火 | 右 | 8 | 48 | 96 | 336 | 0/96/192/288/384 |

**5 帧顺序**: i=0 idle, i=1..3 walking, i=4 jumping.

---

## 4. Gold872/EnemySpriteSheet.png (562×242, 15 行 × 35 列, 16×16 cell, pad=1)

公式: `x = 1 + col * 16, y = 1 + row * 16`，其中 `col = id % 35, row = floor(id / 35)`。
飞甲/食人花高 32 取两 cell。

| ID | 对象 | 高(cell) | 输出文件 |
|---|---|---|---|
| 38 | 乌龟 koopa walk 1 | 2 | `enemies/koopa_walk1.png` |
| 39 | 乌龟 koopa walk 2 | 2 | `enemies/koopa_walk2.png` |
| 40 | 飞甲龟 paratroopa 1 | 2 | `enemies/paratroopa_walk1.png` |
| 41 | 飞甲龟 paratroopa 2 | 2 | `enemies/paratroopa_walk2.png` |
| 44 | 食人花 piranha (开) | 2 | `enemies/piranha_open.png` |
| 45 | 食人花 piranha (闭) | 2 | `enemies/piranha_close.png` |
| 70 | 板栗仔 goomba 1 | 1 | `enemies/goomba_walk1.png` |
| 71 | 板栗仔 goomba 2 | 1 | `enemies/goomba_walk2.png` |
| 72 | 板栗仔死亡 | 1 | `enemies/goomba_dead.png` |
| 77 | 乌龟壳 | 1 | `enemies/koopa_shell.png` |

---

## 5. Gold872/BlockTileSheet.png (817×375, 22 行 × 48 列)

| ID | 对象 | 输出文件 |
|---|---|---|
| 291 | 砖块碎裂 debris | `effects/debris.png` |
| 656 | 金币第 1 帧 | `items/coin_anim1.png` |
| 657 | 金币第 2 帧 | `items/coin_anim2.png` |
| 658 | 金币第 3 帧 | `items/coin_anim3.png` |
| 659 | 金币第 4 帧 | `items/coin_anim4.png` |
| 672 | 星星 star | `items/star.png` |

---

## 6. Gold872/PlayerSpriteSheet.png (403×266, 16 行 × 25 列)

| ID | 对象 | 输出文件 |
|---|---|---|
| 246 | fireball 飞行 | `effects/fireball_fly.png` |
| 247 | fireball 爆炸 | `effects/fireball_blast.png` |

---

## 7. ★ NES 原版玩法常量（来自 SMBDIS.ASM 反汇编）

### 物理
```
gravity              = 0.5  (vy += 0.5/帧)
mario_walk_speed     = 5 px/帧 (自动跑场景)
mario_jump_initial_v = -10
goomba_speed         = 1.5
mushroom_walk_speed  = 2
fireball_speed       = 10
```

### 顶 ?砖块抽签 (Map.java + MapSystem.cpp)
```
prize 抽签:
  小 mario  → super mushroom (变大)
  大 mario  → fire flower    (变火)
  其他      → coin / 1up mushroom (稀有)
prize 从砖顶冒出: vy = -2 持续 300ms
```

### 踩敌人
```
player.vy > 0 && 头部碰到敌人:
  enemy.die()      (1500ms 后移除)
  player.vy = -10  (反弹)
横撞敌人:
  大 mario  → 变小  + InjuryTimer = 8 (无敌 8 帧)
  火 mario  → 变大
  小 mario  → 死亡 (我们屏保改成"伤害无敌闪烁")
```

### Mario 三态切换
```
吃 super mushroom: form 0(小,16×16) → form 1(大,16×32)
吃 fire flower:    form 1     → form 2(火,16×32, 红衣)
受伤:              form 2 → 1 → 0(死)
```

### ★ 星星无敌闪烁 (NES 原版精确算法)
**SMBDIS.ASM 出处**: `HandlePowerUpCollision` + `GameEngine` 主循环

```
吃星星: StarInvincibleTimer = $23 (35 单位)

PlayerColors 调色板 (4 字节 NES 颜色码):
  普通 mario:  $22 $16 $27 $18  (天空/红/桃/深红)
  普通 luigi:  $22 $30 $27 $19  (天空/白/桃/绿)
  火 mario:    $22 $37 $27 $16  (天空/奶白/桃/红)

每帧主循环 (GameEngine):
  ldy StarInvincibleTimer
  lda FrameCounter
  cpy #$08              ; timer > 8 时:
  bcs CycleTwo          ;   每 2 帧切一档调色板 (快闪)
  lsr / lsr             ; timer ≤ 8 时:
  CycleTwo: lsr         ;   每 8 帧切一档 (慢闪, 提示快结束)
  CyclePlayerPalette    ; 用 (FrameCounter >> n) & 3 选 4 套调色板之一
```

**翻译给我们的渲染器**:
```js
// 4 套调色板 - 把 mario 主色 (帽红/衣红/裤蓝) 替换成
const STAR_PALETTES = [
  { hat: 0xFF0000, body: 0xFF0000, leg: 0x0000FF }, // 0: 原色 (帽红衣红裤蓝)
  { hat: 0xFFFFFF, body: 0xFFFFFF, leg: 0x00FF00 }, // 1: 白衣绿裤 (Luigi 配色)
  { hat: 0xFF7F00, body: 0xFF7F00, leg: 0xFF0000 }, // 2: 橙红
  { hat: 0x00AAFF, body: 0x00AAFF, leg: 0x0000FF }, // 3: 蓝
];

function getStarPalette(starTimer, frameCounter) {
  if (starTimer <= 0) return STAR_PALETTES[0]; // 没星星 = 原色
  const shift = (starTimer > 8) ? 1 : 3;       // timer>8 快闪, ≤8 慢闪
  return STAR_PALETTES[(frameCounter >> shift) & 3];
}
```

**渲染时**: 把当前帧 PNG 像素数据里 `hat/body/leg` 三个非透明色按调色板做替换，背景透明色不动。所有 30 个 mario 帧共用这套替换逻辑，**不需要额外切素材**。

### 受伤无敌 (撞敌人后的短暂闪烁)
```
InjuryTimer = $08 (8 帧)
渲染: 每 2 帧显示 / 隐藏交替 (普通透明闪烁)
```

---

## 8. 文件清单 (organized/, 共 57 个 sprite)

```
mario/      30 个  small/super/fire × left/right × idle/walk1/walk2/walk3/jump
enemies/    10 个  goomba(走+死) koopa(走+壳) paratroopa(2) piranha(开闭)
items/       8 个  super_mushroom oneup_mushroom fire_flower star coin×4帧
tiles/       6 个  ordinary_brick surprise_brick used_brick ground_brick pipe end_flag
effects/     3 个  debris fireball_fly fireball_blast
```

---

## 9. 下一步开发流程

1. **网页转 JS 像素数据** → `website/src/utils/superMarioSprites.js`
2. **写 renderer** → `website/src/utils/superMarioRenderer.js` (参考 `adventureIslandRenderer.js`)
   - 实现星星无敌的调色板循环（§7）
   - 实现伤害无敌的隐藏闪烁
3. **写预览页** → `website/src/views/mobile/SuperMario.vue` (静态一帧 + 发送按钮，参考 KOF97)
4. **板载 PROGMEM 数据** → `esp32-firmware/include/theme_assets/super_mario/sprites_*.h`
5. **板载 effect** → `esp32-firmware/src/super_mario_effect.cpp/h` (参考 `adventure_island_effect.cpp`)
6. **6 处接入** + WebSocket `ws.startSuperMario()`
7. **完整开发文档** → `docs/super-mario-development-summary.md`

> 关联参考: 
> - `docs/adventure-island-development-summary.md` (整体流程模板)
> - `docs/kof97-development-summary.md` (无参数发送模板)
> - `docs/esp32-firmware-architecture.md` (板载架构)
