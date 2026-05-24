# 我的世界时钟主题开发总结

> 时间: 2026 年 5 月
> 范围: Mojang 64×64 默认皮肤 + InventivetalentDev 1.20.4 原版纹理 → uniapp 端 64×64 像素板预览
> 状态: uniapp 端开发中, ESP32 端尚未接入

参考 [terraria-clock-development-summary.md](./terraria-clock-development-summary.md) 的结构。本文档严格按代码事实写, 不臆造。

---

## 1. 屏幕布局 (64×64)

```
┌───────────────────────────────────┐
│          天空 + 云                 │  y = 0..58
│  forest biome 渐变 + 云图          │
│                                   │
│         12:34                     │  时间方块 y = 12..26 (3 行 × 5 行 = 15 像素高)
│         (3×5 数字字模, 每位        │  方块尺寸 = BLOCK_SIZE = 4
│          每像素 = 1 个方块,        │  字符宽 3, 冒号宽 1, 字符间距 1
│          字符之间间距 1px)         │
│                                   │
├───────────────────────────────────┤  y = 59 顶面亮带 (groundY - 1)
│         草地 forest tile           │  y = 59..63 (5 行)
└───────────────────────────────────┘
```

事实依据 (`minecraftClockPreview.js`):
- `WIDTH = 64`, `HEIGHT = 64`, `GROUND_TOP_Y = 59`
- `getTimeBlockPositions`: `startY = 12`, `charGap = 1`, 字符宽 3 (冒号 1)
- `drawForestGround`: 每 5px 一块草地 tile, 顶面带画在 `groundY - 1`, 每 5 列右侧 +4 那一列加 0.7× 暗色

---

## 2. 数据来源 (Mojang 64×64 皮肤布局)

`scripts/build-minecraft-assets.js` 从 `_steve_skin_64x64.png` 抽 sprite, UV 坐标 (Y 向下):

```
        正面          背面          外侧 (右臂用作走路侧身)
头     (8, 8) 8×8     (24, 8) 8×8    (2, 8) 4×8
头第二层(40, 8) 8×8    (56, 8) 8×8    (34, 8) 4×8
身体   (20, 20) 8×12   (32, 20) 8×12  (16, 20) 4×12
右臂   (44, 20) 4×12   (52, 20) 4×12  (40, 20) 4×12  ← armRSide
右腿   (4, 20) 4×12    (12, 20) 4×12  (0, 20) 4×12
```

变量名:
- `headFront` / `headFrontL2` / `bodyFront` / `armRFront` / `legRFront`  — 正面
- `headBack`  / `headBackL2`  / `bodyBack`  / `armRBack`  / `legRBack`   — 背面
- `headRight` / `headRight2`  / `bodyRight` / `armRSide`  / `legRSide`   — 侧面 (外侧)

**左臂/左腿不抽源数据**: Mojang 默认皮肤左右对称, 左臂 = 右臂 sprite 水平镜像 (`mirrorX=true`).

---

## 3. 派生 sprite (build 脚本输出)

| 导出常量 | 尺寸 | 来源 | 用途 |
|---|---|---|---|
| `STEVE_BODY_PIXELS` (FULL_W=16, FULL_H=32) | 16×32 | `buildFullSprite(headBack, headBackL2, bodyBack, armRBack, legRBack, includeRightArm=false)` | 背身基础身体 (右臂列 12..15 留空) |
| `STEVE_FRONT_PIXELS` | 16×32 | `buildFullSprite(headFront, …, includeRightArm=true)` | idle 正面 (双臂齐全) |
| `STEVE_ARM_PIXELS` | 4×12 | 直接复制 `armRBack` | 旧版独立挥手 sprite (兼容保留) |
| `STEVE_FRONT_ARM_PIXELS` | 4×12 | `armRFront` | idle 正面右臂 (兼容保留) |
| `STEVE_SIDE_PIXELS` (SIDE_W=4) | 4×32 | `headRight + headRight2 + bodyRight + armRSide + legRSide` 全部叠到 4 宽 | 走路侧身 (含臂) |
| `STEVE_WALK_FRAMES` (WALK_W=6, WALK_H=32) | 6×32 ×4 帧 | 同上 + 臂腿位置帧间偏移 (frame 1 臂前移、frame 3 臂后移) | 走路 4 帧 (实际渲染时 preview 用的是 `STEVE_SIDE_PIXELS` + `lowerLegs ±2px`, 这套 walkFrames 没在 preview 引用) |
| `STEVE_SWING_ARM_FRAMES` (SWING_FRAME_W=25, SWING_FRAME_H=25) | 25×25 ×7 帧 | 7 种臂姿: down / 45down / horizontal / 45up / up / down_mid / up_mid | 旧版挥手 (用在 `drawSteveWithItem`, BUILD_HIT 仍用) |
| `STEVE_SWING_ARM_HANDS` | 7 个 `{x,y}` | 每帧手部在 sprite 内的坐标 | 给镐子/方块定位手部 |
| `STEVE_SWING_FULL_FRAMES` (FULL_FRAME_W=22, FULL_FRAME_H=36) | 22×36 ×3 帧 | `buildSwingFullFrame('high'/'mid'/'down')`, 内含背身身体 + 镐子 + 右臂三段 | **背身挥砸完整动画** ⭐ 当前争议焦点 |
| `STEVE_SIDE_HOLD_FRAME` (SWING_SIDE_W=12, SWING_SIDE_H=32) | 12×32 | `buildSideHoldFrame()`: 侧身 + 水平前伸的手臂 | debug 静态模式 (持镐/持方块) |
| `STEVE_SIDE_SWING_FRAMES` | 12×32 ×3 帧 | 侧身挥砸 3 帧 (高举/水平/砸下) | 当前 preview 没用 |
| `BLOCK_TEXTURES` (BLOCK_SIZE=4) | 4×4 ×21 个 | `loadAndScale(textures/<name>.png, 4)` area-avg 缩小 | 时间方块 / 手持方块 |
| `PICKAXE_TEXTURES` (PICK_SIZE=16) | 16×16 ×5 个 | 直接复制 16×16 原版 (不预缩, 渲染时按缩放) | debug 持镐 / `drawPickaxe` |

---

## 4. 状态机 (5 阶段)

```
                 ┌──── currentMinute 变了 ────┐
                 ↓                              │
    ┌────────► IDLE ◄────────┐                  │
    │                        │ buildCharIdxList │
    │                        │ 全空             │
startBuildSequence            │                  │
    ↑                         │                  │
    │ breakCharIdxList 全空   │                  │
    │                         │                  │
WALK_TO_BUILD ◄── BUILD_HIT   WALK_TO_BREAK ──► BREAK_HIT
        ↑           │              ↑                │
        └──── 该字搭完 ────────────┘                │
                          ┌── 该字砸完 ─────────────┘
                          ↓
                  下一个 breakChar
```

- **IDLE**: 静态显示当前时间方块, 当 `currentMinute` 变化时调 `startBreakSequence`
- **WALK_TO_BREAK**: 走到要砸的字符正下方, 每帧调 `stepWalk` 平移 `walkSpeed` 像素
- **BREAK_HIT**: 挥镐砸方块, 持续 `Math.max(8, 24 - speed*3)` 帧, 在 `t≈0.5` 时把 `block.broken=true; block.visible=false`
- **WALK_TO_BUILD**: 砸完后从最右字符开始走过去搭
- **BUILD_HIT**: 4 帧, 在 `t≈0.5` 时把 `block.visible=true`

事实依据: `stepMinecraftClockState` switch 5 个 case.

### 4.1 数字处理顺序 (DIGIT_ORDERS)

每个数字 0-9 都独立标了 5 行×3 列共 15 格的 break/build 顺序 (base36 编码字符串):
```js
"0": { build: "acb809607405123", break: "123405607809acb" },
```
通过 `getBlockCellOrder(block, mode, charCenters)` 计算: `cellIdx = localRow*3 + localCol`, 取 `orderStr[cellIdx]` 作为优先级 (1-z = 实际顺序, 0 = 跳过).

---

## 5. 渲染流程 (`renderMinecraftClockFrame`)

每帧按这个顺序往 `Map<"x,y", "#hex">` 里写像素:

1. **背景**: `drawBiomeSky(forest)` + `drawClouds` + `drawForestGround`
2. **debug 模式短路**: 如果 `debugStatic=='pickaxe'/'block'`, 调 `drawDebugStatic` 后直接 return
3. **可见时间方块** (按 Y 降序排, 让上方方块的 fake3d 正面下沿覆盖下方方块的顶面带)
4. **Steve** (按相位):
   - **isWalking** (WALK_TO_BREAK/BUILD): 先画手中物 (`getVerticalPickaxePixels` 或 `drawBlock`) → 再画 `STEVE_SIDE_PIXELS` 盖一半
   - **isWorking-BREAK_HIT**: 画 `STEVE_SWING_FULL_FRAMES[seq[…]]`, seq=[0,1,2,1] 按 `frameDuration = max(2, 6-speed)` 切换
   - **isWorking-BUILD_HIT**: 调 `drawSteveWithItem(steveX, steveY, scale, armFrameIdx, 'block', state)` 用 25×25 旧版手臂 sprite + 贴方块
   - **idle**: `drawSteveFront` (强制水平对称 + 顶面亮带)

---

## 6. 挥砸的实现 (★ 当前争议焦点)

### 6.1 BREAK_HIT 用什么 sprite

```js
// minecraftClockPreview.js renderMinecraftClockFrame 内
if (state.phase === PHASES.BREAK_HIT) {
  const seq = [0, 1, 2, 1];                     // 高举 → 中位 → 砸下 → 中位 循环
  const sprite = STEVE_SWING_FULL_FRAMES[frameIdx];
  blitSpriteXY(map, sprite, swingX, swingY, scale, scale, false);
}
```

`STEVE_SWING_FULL_FRAMES` 是 22×36 大 sprite, 由 `buildSwingFullFrame(armState)` 在 build 时一次性绘出, 每一帧已经包含了:
1. **完整背身身体** (`drawSteveBackBody` 画 head + body + 左臂镜像 + 双腿)
2. **镐子** (`drawPickaxeAt` 画 5×7 竖直镐头朝上)
3. **右臂上臂 sy=0..5** 固定在 `(15+sx, shoulderY+sy)`
4. **右臂前臂 sy=6..11** 在 `(15+sx, forearmTopY + sy-6)`, forearmTopY 按帧变化 (high=12 / mid=14 / down=18)

### 6.2 右臂用什么纹理 — 关键事实

`buildSwingFullFrame` 当前用的是 `armRBack`, 即皮肤 UV (52, 20):

```js
// scripts/build-minecraft-assets.js:1037, 1047
for (let sy = 0; sy < 6; sy++) {              // 上臂
  for (let sx = 0; sx < 4; sx++) {
    const so = (sy * 4 + sx) * 4;             // ← sx 不镜像
    const c = [armRBack[so], armRBack[so+1], armRBack[so+2], 255];
    setCanvasPixel(cv, FULL_FRAME_W, 15 + sx, shoulderY + sy, c);
  }
}
```

而 `drawSteveBackBody` 画**左臂**时是这样:
```js
// scripts/build-minecraft-assets.js:942
for (let sy = 0; sy < 12; sy++) {
  for (let sx = 0; sx < 4; sx++) {
    const so = (sy * 4 + (3 - sx)) * 4;       // ← sx 镜像了
    const c = [armRBack[so], ...];
    setCanvasPixel(canvas, w, bodyAnchorX + sx, ...);  // 列 0..3
  }
}
```

观察:
- **左臂**: 用 `armRBack` 像素, **sx → 3-sx** (水平翻转), 画在身体左侧 (列 0..3)
- **挥砸右臂**: 用 `armRBack` 像素, **sx → sx** (不翻转), 画在身体右侧 (列 15..18)

### 6.3 用户反馈的问题

用户原话:
> 史蒂夫背身的时候手臂方向反了
> 不是说他的右手错了 而是右手应该是朝着里面也就是我们看不到的方向 我们看到的应该是背面
> 你这个手还是正面不是背面

我目前的解读 (待用户确认):
- Steve 背对屏幕站立, 我们应该看到他的整个**后面**
- 现在身体后背 (`bodyBack`) 是对的
- 但**右臂**那条独立画的, **看起来不像背面**, 而像"正面"或者"翻过来了"
- 用户已明确否定的修法:
  - ❌ 把右臂位置左右镜像到屏幕另一侧 (用户: "你左右镜像没用啊")
  - ❌ 把纹理换成外侧 armRSide (用户: "你这个手还是正面不是背面")

### 6.4 已有的尝试与失败 (请勿再试)

| 尝试 | 结果 |
|---|---|
| 把挥砸右臂的纹理从 `armRBack` 换成 `armRSide` (UV 40,20) | ❌ 用户说"还是正面" |
| 假设"右手扭到背后", 提议把挥砸臂从屏幕右侧镜像到左侧 | ❌ 用户说"我说了这是他背身的时候右臂正反不对你左右镜像没用啊" |
| 假设"挥砸时右手伸到身前应该看不到", 提议去掉挥砸臂只露镐头 | ❌ 用户说"我只是要你把这个右臂的前后顺序改一下" |

### 6.5 当前需要用户明确的事

请回答下列问题中**任意一个具体描述**:
1. **挥砸右臂应该用 `armRBack` 但 sx 镜像 (3-sx)** — 让上下臂的纹理朝向跟左臂一致?
2. **挥砸右臂应该用 `armRBack` 但 sy 翻转 (11-sy)** — 上下颠倒过来?
3. **挥砸右臂应该用 `armRFront` (UV 44,20)** — 表达"手心朝外"?
4. **其他 — 请描述屏幕上哪一块像素 (X, Y) 现在是什么颜色, 应该是什么颜色**

---

## 7. UI 配置项 (`minecraft-clock.vue` data.config)

```
pickaxe         "iron"        镐子类型 (wood/stone/iron/diamond/netherite)
blockStyle      "random"      方块风格 (random + 22 种具体 id)
hourFormat      24            时间格式 (12 / 24)

steveScale      80            Steve 缩放 % (50-150)
steveX/Y        0             Steve XY 偏移
walkSpeed       1.0           走路速度 px/帧

pickItemX/Y     4 / 1         手持镐子 XY 偏移 (相对手部)
pickItemScale   60            手持镐子缩放 %
pickItemRotate  90            手持镐子旋转 ° (debug 模式专用)

blockItemX/Y    0 / 0         手持方块 XY 偏移
blockItemScale  100           手持方块缩放
blockItemRotate 0             手持方块旋转

armPeakAngle    -110          砸/搭时手臂顶端角度 (旧版, drawSteveWorkArm 用)
armSwingAmp     30            砸/搭挥手摆动幅度
sideScale       100           侧身缩放 %
armOffsetX/Y    0             右臂肩膀 XY 偏移

blockRenderMode 'fake3d'      flat / topBand / fake3d

breakCharOrder  "leftToRight" 砸字符顺序
breakBlockOrder "topToBottom" 砸方块顺序
buildCharOrder  "rightToLeft" 搭字符顺序
buildBlockOrder "bottomToTop" 搭方块顺序

debugStatic     "off"         off / pickaxe / block
breakFacing     "back"        back (背身) / side (侧身)
```

---

## 8. 资源管线

```
                 ┌────────────────────────────────────┐
                 │ Mojang 官方 Steve 64×64 PNG         │
                 │ + InventivetalentDev 1.20.4 27 PNG │
                 └──────────────┬─────────────────────┘
                                │
       node scripts/dl-mc-textures.js (一次性, 已跑过)
                                │
                                ▼
                 ┌────────────────────────────────────┐
                 │ uniapp/static/minecraft/           │
                 │   _steve_skin_64x64.png            │
                 │   textures/<27 张方块/镐子>.png     │
                 └──────────────┬─────────────────────┘
                                │
       node scripts/build-minecraft-assets.js
                                │
                                ▼
                 ┌────────────────────────────────────┐
                 │ uniapp/utils/minecraftAssets.js   │
                 │   STEVE_* / BLOCK_TEXTURES /        │
                 │   PICKAXE_TEXTURES (39 个 export)   │
                 │   ≈ 99 KB                           │
                 └──────────────┬─────────────────────┘
                                │
                                ▼
                 ┌────────────────────────────────────┐
                 │ uniapp/utils/minecraftClockPreview │
                 │ uniapp/pages/minecraft-clock/      │
                 │   minecraft-clock.vue              │
                 └────────────────────────────────────┘
```

依赖另两个文件:
- `uniapp/utils/terrariaBiome.js` 借用 `drawBiomeSky` / `drawClouds` (forest biome)
- `uniapp/utils/terrariaSprites.js` 借用 `getSprite("biome_forest_0/1/2")` 草地 tile

---

## 9. 接 ESP32 板 (TODO)

参考 [terraria-clock-development-summary.md §6](./terraria-clock-development-summary.md#6-阶段-5esp32-板载实现) 流程:

1. 在 `runtime_command_bus.cpp::buildPreparedWebSocketTransaction` 加 `prepareMinecraftTransaction(params, reason)`
2. 在 `executeBusinessModeSwitch` 加 `MINECRAFT_CLOCK` 分支
3. 资产编进 `include/theme_assets/minecraft/sprites_*.h` (按 §10.6 控制文件数 < 10)
4. 板载 `minecraft_clock_effect.cpp` 走 `presentOffscreenFrame` (★ §10.4.1 的坑)
5. 字段 1:1 (★ AGENTS.md 硬约束, 不允许 `a || b` 兜底)

---

## 10. 已知地雷

### 10.1 19:48 之后的代码丢失

- 5/23 19:48 是 Kiro 本地历史最后一次快照
- 19:48 → 20:46 之间用户做了大量改动, 之后被误删/缩水
- 我们已用 19:48 那一份当基线恢复. 19:48 之后的改动需要重做

### 10.2 build 脚本顶部注释里有乱码

`scripts/build-minecraft-assets.js` 头几行注释 GBK / UTF-8 混编, 提到 "Steve_JE5.png 480×1080" 是过时信息. 当前实际只读 `_steve_skin_64x64.png` + 27 张原版纹理.

### 10.3 STEVE_WALK_FRAMES 没人用

build 输出了 4 帧走路 sprite, 但 preview 实际走路用的是 `STEVE_SIDE_PIXELS` + `lowerLegs ±2px` 自己拼. WALK_FRAMES 占 export 但没引用.

### 10.4 STEVE_SWING_ARM_FRAMES 是 7 帧不是 5 帧

build 实际生成 7 帧 (down/45down/horizontal/45up/up/down_mid/up_mid), 但 preview 注释还写 "0~4" 5 帧. BUILD_HIT 用 `seq=[4,3,4]` (up_mid / 45up / up_mid).

### 10.5 BREAK_HIT 镐子 Y 摆动只在 drawSteveWithItem 路径生效

`state.pickSwingY` 在 BREAK_HIT 状态机里被设了 [0,4,8,4,0], 但实际渲染用的是预画好的 `STEVE_SWING_FULL_FRAMES`, 镐子 Y 偏移**已经烘进 sprite 三帧里**了, `pickSwingY` 这个字段在当前路径下没被消费.

---

## 11. 沟通教训 (⚠️ 重要)

### 11.1 不要看到关键词就猜

用户说"右臂方向不对", 我先后猜了"位置错"、"挥到了背后"、"sprite 用了正面纹理"、"sx 没镜像", **每次都是猜**, 都被否定.

正确做法: **先打开代码读完整个挥砸流程, 把每个 sprite/UV/坐标列成表, 等用户在表上指**.

### 11.2 不要把 build 脚本和 preview 引擎拆开看

挥砸臂的纹理在 build 阶段就烘进 22×36 sprite 了, 改 preview 没用, 必须改 build 后重跑构建.

### 11.3 直接说事实, 不要"我以为"

错的回答模板: "我以为你的意思是 X, 那就 …"
对的回答模板: "代码里 X 文件 Y 行, sprite 来自 UV (52, 20), 取像素时 sx 不镜像. 你觉得应该 …?"

---

## 12. 快速回到状态

```bash
# 重新生成资源
cd D:\project\Glowxel
node scripts/build-minecraft-assets.js

# 输出
# uniapp/utils/minecraftAssets.js  ≈ 99 KB
```

打开 HBuilderX → 真机预览 → 进入 "我的世界时钟" 页面, debug=off 看动画, debug=pickaxe 看静态持镐.
