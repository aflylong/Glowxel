# 冒险岛主题开发总结
<!-- Hudson's Adventure Island (高桥名人の冒険島) -->

> 一份从 0 到 1 把一个**横版动作游戏主题**搬到 64×64 LED 矩阵的全流程笔记。覆盖素材采集、像素切割、状态机移植、网页预览、板载渲染。**这套流程同样适用于其他横版/动作类原版游戏主题**。

---

## 1. 主题选型 (Why Adventure Island)

### 1.1 选型标准

| 维度 | 标准 | 冒险岛符合 |
|---|---|---|
| 像素风原生 | 资产已经是 8×8 / 16×16 倍数 | ✅ NES 原版 8×8 tile |
| 动画局部 | 主体角色 + 少量小敌人,不要满屏特效 | ✅ 主角 + 4-5 种小怪 |
| 状态可枚举 | 角色行为状态 ≤ 10 种 | ✅ run/jump/throw/skateboard/stumble |
| 公共素材 | spriters-resource / vgmaps 等有切片 | ✅ |
| 玩法可循环 | 横版无尽奔跑 = 屏保级渲染 | ✅ 不需要关卡 |
| 64×64 适配 | 视野能塞下角色 + 一个障碍 + HUD | ✅ |

### 1.2 选型陷阱

- **❌ 选了不对**: 实时 RPG 主题 (UI 复杂, 玩法不能展示)
- **❌ 选了不对**: 街霸/格斗游戏 (角色尺寸大于 64×64 一半, 没场景空间)
- **✅ 选对了**: 红白机横版动作 (角色 16×32, 留出 48px 给场景滚动)

> 注: 数码宝贝一代 V-Pet 主题原本也在选型清单, 47 个彩色 sprite 都已采集. 主题本身适合, 但当时素材处理没跟上 (上色/对齐/拼合方案没定好), 被迫先放下. 后续重做这种"展示型"主题时, 重点把第 3 节切割流程跟用户对齐再开工.

---

## 2. 素材采集

### 2.1 资源站清单

| 站点 | 内容 | URL |
|---|---|---|
| Spriters Resource | 各平台精灵图 | spriters-resource.com |
| VGMaps | 完整游戏地图 (背景循环用) | vgmaps.com |
| StrategyWiki | 玩法/敌人/道具说明 | strategywiki.org |
| nesworld.com 手册 | 官方原始道具效果 | nesworld.com/manuals |
| archive.org | 原版 ROM (CHR 提取兜底) | archive.org |

### 2.2 必采清单 (一个游戏主题最少 5 类)

| 类别 | 数量参考 | 原因 |
|---|---|---|
| 角色全帧 (跑/跳/攻击) | 8-15 帧 | 状态切换主体 |
| 敌人 (各 2 帧) | 3-5 种 × 2 = 8-12 帧 | 多样性 |
| 障碍 (静止 + 动画) | 2-3 种 | 跳跃挑战 |
| 道具 (从蛋/盒子掉出) | 3-5 种 | 状态触发 |
| 数字字体 | 0-9 共 10 张 | HUD 时间 |
| 背景 tile | 1-2 张 (横向循环) | 场景滚动 |

### 2.3 采集后必须立刻验证

- 把每类原始 PNG 在桌面先看一眼, 确认**尺寸、颜色、透明背景**
- 整张 sprite sheet 的话**记下背景色 hex**, 后面切割要用
- **不要立刻动手切**, 先和需求方对齐"我们要哪些 sprite", 别整张转换

---

## 3. 像素切割 (从拼合 sheet 到独立 PNG)

### 3.1 切割三大原则

1. **背景色检测 + flood fill 4-连通**, 不要写死 `(8, 8) grid`. 红白机原版有 8×8 也有 16×16 也有 24×16 混在一张, 写死必死
2. **每个连通块**输出**保留原始尺寸**(宽高带在文件名里, 如 `01_24x16.png`)
3. **背景色**: NES 透明色一般是 `rgb(147, 187, 236)` 浅蓝, 但很多 sheet 用了别的颜色覆盖, 先肉眼确认

### 3.2 工具脚本骨架

```js
// smart-slice.js (节选, 实际见 git 历史)
const BG_COLOR = [27, 89, 153];   // 深蓝, sheet 背景
const SECONDARY = [147, 187, 236]; // NES 透明, 也要清

function isBg(r, g, b) {
  return (r === BG_COLOR[0] && g === BG_COLOR[1] && b === BG_COLOR[2]) ||
         (r === SECONDARY[0] && g === SECONDARY[1] && b === SECONDARY[2]);
}

function floodFillRegions(image) {
  const visited = new Set();
  const regions = [];
  for (let y = 0; y < image.h; y++) {
    for (let x = 0; x < image.w; x++) {
      if (visited.has(`${x},${y}`)) continue;
      const [r, g, b] = pixelAt(image, x, y);
      if (isBg(r, g, b)) continue;
      const region = bfs(image, x, y, visited, isBg);
      if (region.bbox.w > 4 && region.bbox.h > 4) regions.push(region);
    }
  }
  return regions;
}
```

### 3.3 切完必做的事

- **逐编号肉眼对照**: 跑个 `make-preview.js` 拼成网格图, 4-8 倍放大, 确认每个编号是什么
- **建立 `_index.json`**: `[{id: 01, sprite: 'snail.0', desc: '蜗牛站立'}, ...]`
- **跟需求方"指认"**: 不要自己脑补 "01 应该是蜗牛", 让用户看图说"01 是蜗牛"

### 3.4 数字字体特殊处理

数字常常**带描边和阴影**, 切完要清理:
- 数字主体 = 白色 `#ffffff`
- 阴影 = 灰色 `#aaaaaa` (转换时要替换成主题色, 比如冒险岛红 `#a40000`)
- 黑色像素 = sheet 背景, 一律丢弃

---

## 4. 转换流水线 (PNG → JS → ESP32 PROGMEM)

### 4.1 三阶段

```
原始 PNG (organized/)
    │
    │  png-to-pixels.js
    ▼
adventureIslandSprites.js
    {
      'higgins.run.0': { w: 16, h: 32, p: ['#ff0000', null, ...] }
    }
    │
    ├── 复制到 website/src/utils/  (网页预览引用)
    │
    │  build-firmware-sprites.js
    ▼
esp32-firmware/include/theme_assets/.../sprites_*.h
    static const uint8_t kHiggins_run_0Pixels[] PROGMEM = { 0x00, 0x00, ... };
    static const AISprite kHiggins_run_0 PROGMEM = { ... };
```

### 4.2 中间格式 (JS) 的优势

```js
// 网页直接用, 板载也按相同格式打包
{
  w: 16, h: 32,
  p: ['#ff0000', null, '#00ff00', ...]   // 长度 = w*h, null = 透明
}
```

- 网页 `setPx(pixels, x, y, hex)` 直接画
- 板载 `[x,y,r,g,b]` 5 字节/像素 PROGMEM
- **不存全帧 RGBA32**: 透明 90%+ 的 sprite 全帧太浪费

### 4.3 板载 PROGMEM 格式 (fmt=5)

```cpp
struct AISprite {
  uint16_t w;
  uint16_t h;
  uint16_t pixelCount;
  const uint8_t* pixels;   // 5 字节/像素: [x:1, y:1, r:1, g:1, b:1]
  uint8_t fmt;             // 5 (我们这套主题没用 fmt=7)
};
```

冒险岛全部 sprite 加起来约 **460 KB Flash**, 远低于 500 KB 主题预算。

### 4.4 流水线必须自动化

```bash
# 改一张 PNG 后:
cd assets-raw/adventure-island
node png-to-pixels.js          # 生成 adventureIslandSprites.js + 自动复制到 website/
node build-firmware-sprites.js # 生成板载 sprites_*.h
cd ../../esp32-firmware
pio run -e esp32dev             # 编译验证
```

**不要**:
- 手改 .h 文件
- 改 .js 输出后忘记复制到 website
- 不跑 build-firmware 直接编译板载

---

## 5. 网页预览先行 (调参不上板)

### 5.1 为什么先做网页

板载调试一次循环:
1. 改 cpp
2. pio build (10-30s)
3. pio upload (15-60s)
4. 真机看效果
5. 不对 → 回 1

每次改一个数值要 1-2 分钟。**几十个数值要调几十次就是几小时**。

网页改 → Vite HMR → 立即看, 每次循环 < 2 秒。**先把网页跑通, 板载就是直译**。

### 5.2 网页 renderer 设计

```js
// adventureIslandRenderer.js
export function renderAdventureIslandScene(sceneState, layoutOpts) {
  const pixels = new Map();   // "x,y" → "#hex"
  drawBackground(pixels, sceneState.scrollX, layoutOpts.bgYOffset);
  for (const e of sceneState.entities) drawEntity(pixels, e, ...);
  for (const a of sceneState.axes) drawAxe(pixels, a, ...);
  drawCharacter(pixels, sceneState.character, ...);
  drawFairy(pixels, sceneState.character, ...);
  drawClock(pixels, layoutOpts);    // ★ 时钟最顶层
  return pixels;
}
```

**返回 `Map<"x,y", "#hex">`**, 网页用 `<PixelPreviewBoard>` 组件直接渲染——这是项目通用预览模式。

### 5.3 状态机分离

```
sceneState (永久状态, tickScene 推进):
  - frame, scrollX
  - character: { type, hasAxe, jumping, jumpY, jumpV, throwT, fairyT, stumbleT }
  - entities: [{ type, sub, x, dying, dyOffX, dyOffY, ... }]
  - axes: [...]
  - spawnCooldown, eggCooldown, eggSeq, firstAxeSpawned

layoutOpts (布局参数, 滑块 → renderer):
  - bgYOffset, charX, groundY, jumpHeight
  - obstacleScale, itemScale
  - clockX/Y, fairyOffsetX/Y
  - crowYOffset, fruitAirY
  - ...
```

**调试期网页全部参数挂滑块**, 拨到满意为止。**生产板载这些值写死成常量**, 不再让用户调。

### 5.4 调试期 vs 生产期

| 阶段 | 网页参数 | 板载 |
|---|---|---|
| 调试 | 30+ 滑块, 全可调 | 暂不接入 |
| 验收 | 用户拍板每个值 | 截下来写常量 |
| 生产 | 滑块全删, 隐藏 | 用调好的常量, 用户只看不调 |

### 5.5 网页文件最少清单

```
website/src/
  views/mobile/AdventureIsland.vue      // 入口页面 + 预览 + 滑块
  utils/adventureIslandRenderer.js       // 状态机 + 渲染
  utils/adventureIslandSprites.js        // PNG → JS 输出 (auto-gen)
  router/index.js                        // 加路由 /adventure-island
  App.vue                                // isDevicePath 白名单加 adventure-
```

`AdventureIsland.vue` **照抄** TerrariaClock.vue 结构, 改 import 和 sendToDevice 即可。

---

## 6. 状态机 / 玩法逻辑

### 6.1 角色状态枚举

```
type:
  'run'        默认
  'skateboard' 踩滑板

ch.jumping       是否在跳跃中 (布尔)
ch.throwT        投掷动画剩余帧 (uint8)
ch.fairyT        无敌剩余帧 (uint16, 30 秒 = 900)
ch.stumbleT      磕到动画剩余帧 (uint8, 24)
ch.hasAxe        是否持斧 (布尔)
```

### 6.2 sprite 选择优先级 (从最高到最低)

```
1. ch.stumbleT > 0           → higgins.stumble       (磕到 sprite)
2. ch.throwT > 0 && !滑板    → higgins.throw.3      (投掷只显示 frame3)
3. type === 'skateboard'
   3a. jumping               → higgins.skateboard_land.0
   3b. landing > 0           → higgins.skateboard_land.0
   3c. else                  → higgins.skateboard.{0/1} 循环
4. jumping (普通跳跃)         → higgins.throw.2     (脸朝前)
5. else (跑步)                → higgins.run.{0/1/2} 循环
```

**关键点**:
- 投掷不切 `type`, 用 `throwT` 单独控制 → 滑板持斧扔斧子时仍然显示滑板 sprite
- 滑板跳跃**全程**用 land.0, 不切上升/下降两帧 (用户偏好)
- 普通跳跃用 `throw.2`, 不是 `jump.0` (用户指认)

### 6.3 实体生成节奏 (autoEvents)

```
每 spawnInterval 帧 (5 秒) 抽签一次:
  - 水果   25%   (空中, 跳起来才能吃)
  - 障碍   25%   (rock 50% / fire 50%)
  - 敌人   30%   (snail/crow/boar/snake 各 1/4)
  - 蛋     20%   (受 eggCooldown 50秒额外限制)

约束:
  - 右侧 40px 内有同类实体 → 跳过这次抽签
  - 空中类 (水果 + 乌鸦) 和地面类 (障碍 + 地面敌人 + 蛋) 分开计算 busy
  - 死亡中的敌人 (e.dying) 不算 busy
```

**开局规则**: 第一个蛋必出**斧头** (`firstAxeSpawned` 标志), 让玩家有武器再开始扔斧逻辑。

**蛋顺序**:
- 没斧 → 永远是斧
- 有斧 + 普通跑 → 滑板 / 仙女交替
- 有斧 + 已踩滑板 → 只出仙女 (避免重复)

### 6.4 自动 AI (无玩家输入)

板载没人按按钮, 状态全部自动推进:

| 触发 | 条件 | 动作 |
|---|---|---|
| 跳跃避障 | 障碍/没斧地面敌/吃水果, 进入 `triggerStart..triggerEnd` 距离 | triggerJump |
| 站着扔斧 | 有斧 + 地面敌进入 `[throwLo, throwHi]`, 不在跳 | triggerThrow(0) |
| 跳起扔斧 | 有斧 + 乌鸦进入 `[crowJumpDist±range]` | triggerJump → 在最高点扔 |
| 滑板撞石 | 15% 概率不跳, 让石头撞上来 | 弹起 + stumble + 滑板掉 |
| 仙女撞东西 | 仙女期间撞敌/障 | 对方消失, 仙女继续 |

#### 起跳提前距离公式

```
jumpV0 = jumpHeight / 4
jumpFrames = ceil(jumpV0 / 0.5) * 2          // 跳完总帧数
reachDist = jumpFrames × totalSpeed × reachFactor

reachFactor:
  普通跑 = 0.5
  滑板   = 0.6   (滑板下整体 2 倍速, 但跳跃物理不变, 起跳要稍提前)

triggerStart = reachDist - 4
triggerEnd   = reachDist + 4
```

只有当障碍物距离角色在 `[triggerStart, triggerEnd]` 范围内时才起跳, 否则跳早/晚都会失败.

### 6.5 蛋的 4 阶段

```
rolling   蛋滚动接近角色
   │ 撞到角色
   ▼
flying    被踢出去, 8 帧抛物线 (vx=1.6, 高度 16)
   │ 落地
   ▼
cracking  蛋碎动画 4 帧
   │
   ▼
item      变成静止道具 (axe/fairy/skateboard)
   │ 被角色再次撞到
   ▼
拾取      hasAxe=true / fairyT=900 / type='skateboard'
```

**坐标处理**: flying 阶段 `e.x += totalSpeed + flyVx` 抵消默认场景滚, 让蛋实际向右移动. 其它阶段跟场景一起左滚.

### 6.6 敌人死亡动画

```
斧子命中 → e.dying = true, 给定初速度
  - 蜗牛: dyVx = +1.5, dyVy = -2.5  (向右 + 跳)
  - 乌鸦: dyVx = +1.5, dyVy = -2.0  (天上掉, 跳得低)
  - 蛇   : dyVx = -1.5, dyVy = -2.5  (向左 + 跳)
  - 野猪: dyVx = -1.5, dyVy = -2.5

每帧:
  dyOffX += dyVx
  dyOffY += dyVy
  dyVy   += 0.7        (重力)
  e.x     不再 -= totalSpeed   (脱离场景滚)

离屏:
  dyOffY > 64 (穿过地面)  或  e.x + dyOffX 越屏  → splice 移除
```

死亡 sprite:
- snail/crow → 上下翻 dead 帧 (`enemy.snail.dead`, `enemy.crow.dead`, 是单独的图)
- snake/boar → 用 `enemy.X.0` (不翻)

死亡敌人**不参与**: AI 触发 / 角色碰撞 / right zone 判定 / 再被斧打.

### 6.7 滑板碰石头 (磕到)

```
起跳触发那帧:
  if (ch.type=='skateboard' && e.sub==='rock' && !e.failChecked):
    e.failChecked = true
    if random() < 0.15:
      // 不跳, 让石头继续来
    else:
      triggerJump()

碰撞那帧:
  if (e.sub==='rock' && ch.type==='skateboard' && ch.jumpY < 4):
    // 磕到!
    ch.type      = 'run'         (滑板掉)
    ch.stumbleT  = 24            (stumble 帧持续 24 帧)
    ch.jumping   = true
    ch.jumpY     = 12            (被弹起到障碍物高度)
    ch.jumpV     = 0             (然后自由落体)
    splice 石头
```

`ch.jumpY < 4` 是关键: 跳起来过石头时 X 重叠**不算撞**, 必须贴地才算. 防止"跳起来正好 X 重叠就误判磕到"的 bug.

---

## 7. 板载移植

### 7.1 目录结构

```
include/
  adventure_island_effect.h          // namespace 接口
  theme_assets/adventure_island/
    adventure_island_sprite_types.h  // AISprite struct 定义
    index.h                          // namespace AISprites + getByKey()
    sprites_higgins.h                // 14 角色 sprite (PROGMEM)
    sprites_enemies.h                // 8 敌人 + 2 dead = 10
    sprites_obstacles.h              // 5 障碍
    sprites_items.h                  // 13 道具
    sprites_digits.h                 // 10 数字
    sprites_bg.h                     // 1 背景

src/
  adventure_island_effect.cpp        // 状态机 + 渲染主体 (~700 行)
```

### 7.2 6 步接入清单 (照搬泰拉瑞亚)

| # | 文件 | 改动 |
|---|---|---|
| 1 | `mode_tags.h` | 加 `ADVENTURE_ISLAND = "adventure_island"` |
| 2 | effect.h/.cpp | namespace + applyConfig/update/render/isActive/deactivate |
| 3 | `runtime_command_bus.cpp` | `prepareAdventureIslandTransaction` + dispatch + executeBusinessModeSwitch 三处 |
| 4 | `runtime_mode_coordinator.cpp` | shouldClearScreen + switchToMode + deactivate + isRecoverable 四处 |
| 5 | `config_manager.cpp` | `isStaticallyRecoverableBusinessModeTag` 白名单 |
| 6 | `main.cpp` | 主循环 dispatch 加 `if (currentBusinessModeTag == ADVENTURE_ISLAND)` 分支 |
| 7 | `webSocket.js` | `startAdventureIsland(options)` 走 runModeTransaction |
| 8 | Vue 入口 | `sendToDevice` override 调新 API |

**特点**: 这个主题**没有可调参数**(用户端只点"发送"), 所以:
- 没有 `AdventureIslandConfig` struct
- 没有 NVS load/save
- 没有 RuntimeCommand 字段
- prepare 函数直接通过

### 7.3 无参数模式的 prepareXxx 模板

```cpp
bool prepareAdventureIslandTransaction(JsonObject /*params*/, const char*& reason) {
  resetPreparedCommand(gWebSocketTransactionSession.preparedCommand);
  RuntimeCommandBus::RuntimeCommand& command = gWebSocketTransactionSession.preparedCommand;
  command.type = RuntimeCommandBus::RuntimeCommandType::MODE_SWITCH;
  command.targetMode = MODE_ANIMATION;
  command.businessModeTag = ModeTags::ADVENTURE_ISLAND;
  command.successMessage = "adventure island started";
  reason = nullptr;
  return true;
}
```

### 7.4 无参数模式的 executeBusinessModeSwitch 分支

```cpp
if (command.businessModeTag == ModeTags::ADVENTURE_ISLAND) {
  RuntimeModeCoordinator::deactivateRuntimeContent();
  if (shouldClearScreenBeforeBusinessModeEntry(command.businessModeTag)) {
    DisplayManager::clearScreen();
  }
  if (!RuntimeModeCoordinator::switchToMode(MODE_ANIMATION, command.businessModeTag, true, true)) {
    setErrorResponse(response, "mode activation failed");
    return false;
  }
  // 不需要保存 NVS, 因为没可变配置
  response["message"] = command.successMessage;
  return true;
}
```

### 7.5 渲染主体模板 (照架构文档 §5.10)

```cpp
namespace {
  bool s_active = false;
  SceneState s_state = {};
  uint32_t s_lastTickMs = 0;

  inline void putPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
    if (x<0||x>=64||y<0||y>=64) return;
    int by = (y + 1) % 64;     // ★ 行偏移补偿 (架构文档 §6.8)
    DisplayManager::animationBuffer[by][x] = MatrixPanel_I2S_DMA::color565(r, g, b);
  }

  void buildFrame() {
    drawBackground();
    drawEntities();
    drawAxes();
    drawCharacter();
    drawFairy();
    drawClock();   // ★ 时钟最顶层
  }
}

namespace AdventureIslandEffect {
  void update() {
    if (!s_active) return;
    uint32_t now = millis();
    if (now - s_lastTickMs < 33) return;   // 30fps 节流
    s_lastTickMs = now;
    tickScene();
  }
  
  void render() {
    if (!s_active) return;
    if (DisplayManager::dma_display == nullptr) return;
    buildFrame();
    DisplayManager::presentOffscreenFrame(&DisplayManager::animationBuffer[0][0]);
  }
}
```

### 7.6 板载实际帧率不是 30fps

理论 `if (now - lastTickMs < 33)` = 30fps. 但实际 ESP32 主 loop 单圈 ≈ 50ms (WiFi tick + WebSocket cleanup + DMA flush 等), 实际帧率约 **20fps**.

**后果**: 网页用 `spawnInterval=150` (5s @ 30fps), 板载同样 150 实际是 7.5s.

**解决**: 板载常量按实际帧率倒推, 不能跟网页 1:1.

```cpp
constexpr uint16_t kSpawnInterval = 100;   // 板载 ≈ 5 秒
```

### 7.7 字段差异速记表

| 类型 | 网页 | 板载 |
|---|---|---|
| 角色 type | `'run'` / `'skateboard'` | `0` / `1` |
| 敌人 sub | `'snail'` / `'crow'` / ... | `ES_SNAIL` / `ES_CROW` / ... 枚举 |
| 障碍 sub | `'rock'` / `'fire'` | `OS_ROCK` / `OS_FIRE` |
| 蛋 sub | `'axe'` / `'fairy'` / `'skateboard'` | `EGG_AXE` / `EGG_FAIRY` / `EGG_SKATEBOARD` |
| 蛋 stage | `'rolling'` / `'flying'` / `'cracking'` / `'item'` | `STG_ROLLING` / ... |
| 实体集合 | `state.entities[]` 动态数组 | `Entity entities[16]` 固定数组 |
| 实体添加 | `push` | `entities[entityCount++]`, 检查上限 |
| 实体移除 | `splice(i, 1)` | swap-with-last + entityCount-- |

---

## 8. 性能与资源

### 8.1 Flash 占用

```
sprites_higgins.h    166 KB  (14 角色帧)
sprites_enemies.h     76 KB  (10 敌人含 2 dead)
sprites_items.h       65 KB  (13 道具)
sprites_obstacles.h   41 KB  (5 障碍)
sprites_bg.h         118 KB  (1 张 48×82 背景)
sprites_digits.h      16 KB  (10 数字)
其他                   5 KB
─────────────────────────────
总计                ≈ 487 KB  (低于 500 KB 主题预算)
```

**注**: 这是 .h 文件大小 (含 `0x` 前缀和逗号), **真实 PROGMEM 占用 ≈ 1/6 ≈ 80 KB**. 全主题总 Flash 增量约 **600 KB** (含代码).

### 8.2 RAM 占用

```
SceneState         ≈ 800 字节 (16 entity × ~50 字节 + 角色 + 全局)
s_bgRgb 静态 LUT    11.5 KB   (背景 RGB888 稠密表, 一次性填充)
drawSprite LUT       4 KB    (32x32 RGBA, 缩放专用)
─────────────────────────────────
总增量            ≈ 16 KB  (配合 DisplayManager::animationBuffer 8KB 共用)
```

整个主题 RAM 增量约 1.8% (320 KB 总), 可控.

### 8.3 渲染耗时估算 (单帧)

| 阶段 | 像素数 | 估时 |
|---|---|---|
| 背景 64×64 | ≈ 4096 | ~1.5 ms |
| 实体 (5 个 ≤16×24) | ≈ 600 | ~0.3 ms |
| 角色 16×32 | ≈ 200 | ~0.1 ms |
| HUD (4 数字 + 冒号) | ≈ 100 | ~0.05 ms |
| presentOffscreenFrame | dirty diff + flip | ~1-2 ms |
| **合计** | | **~3-5 ms** |

剩余 28 ms / 帧给 WiFi/WebSocket/DMA, 完全够.

---

## 9. 调试套路

### 9.1 网页调试 (优先)

打开 `http://localhost:5174/#/adventure-island`, 滑块拨, 立即看效果.

**关键日志点**:
- 进入磕到流程: `console.log('stumble! e.x=', e.x, 'jumpY=', ch.jumpY)`
- 蛋 stage 切换: `console.log('egg stage:', oldStage, '→', newStage)`
- 实体生成抽签: `console.log('spawn r=', r, '→', spawnedType)`

### 9.2 板载真机调试

**串口诊断标记** (架构文档 §6.8):

```cpp
void buildFrame() {
  // ... 正常渲染 ...
  // ===== DEBUG =====
  for (int x = 0; x < 64; x++) {
    putPixel(x, 0, 0, 255, 0);    // 顶绿
    putPixel(x, 63, 255, 0, 0);   // 底红
  }
}
```

烧上去看屏幕边缘颜色, 验证 `(y+1) % 64` 行偏移有没有补偿对.

**串口打印帧率**:

```cpp
void update() {
  static uint32_t lastDbg = 0;
  static uint32_t frameCount = 0;
  uint32_t now = millis();
  if (now - s_lastTickMs < 33) return;
  s_lastTickMs = now;
  frameCount++;
  if (now - lastDbg > 1000) {
    Serial.printf("[AI] fps=%lu entities=%u axes=%u\n",
                  frameCount, s_state.entityCount, s_state.axeCount);
    frameCount = 0;
    lastDbg = now;
  }
  tickScene();
}
```

### 9.3 三大常见 bug

| 现象 | 原因 | 修法 |
|---|---|---|
| 屏底空一行 / 整体上移 | 没加 `(y+1) % 64` 补偿 | putPixel 内部加 (§6.8) |
| 滑板碰石头必磕到 | 碰撞段没检查 jumpY | `&& ch.jumpY < 4` |
| 滑板穿石头不消失 | dying 字段忘加 | 命中后标记 `e.dying=true` |
| 长跑后背景停滚 | scrollX float 累加溢出 | `scrollX = fmodf(scrollX, bgW)` |
| 同屏双斧 | triggerThrow 没检查 axeCount | `if (axeCount >= 1) return` |

---

## 10. 文件清单速查

### 10.1 新增/修改文件 (开发完整)

| 路径 | 作用 |
|---|---|
| `assets-raw/adventure-island/` | (开发流水线, 完成后可删) |
| ↳ `organized/*.png` | 切好分类的 PNG 源 |
| ↳ `png-to-pixels.js` | PNG → JS 像素数据 |
| ↳ `build-firmware-sprites.js` | JS → ESP32 PROGMEM |
| ↳ `make-dead-sprites.js` | 生成翻转 sprite |
| `website/src/utils/adventureIslandSprites.js` | 网页用的 sprite 数据 (auto-gen) |
| `website/src/utils/adventureIslandRenderer.js` | 状态机 + 渲染 |
| `website/src/views/mobile/AdventureIsland.vue` | 入口页 + 预览 |
| `website/src/router/index.js` | 加路由 |
| `website/src/utils/webSocket.js` | startAdventureIsland API |
| `website/src/components/device/DeviceControlConsole.vue` | 模式入口卡片 |
| `website/src/views/mobile/DeviceControl.vue` | navigateTo 跳转 |
| `website/src/App.vue` | isDevicePath 白名单 |
| `esp32-firmware/include/adventure_island_effect.h` | namespace 接口 |
| `esp32-firmware/include/theme_assets/adventure_island/*.h` | 8 个 PROGMEM 资产 |
| `esp32-firmware/src/adventure_island_effect.cpp` | 板载状态机 + 渲染 |
| `esp32-firmware/include/mode_tags.h` | ADVENTURE_ISLAND 常量 |
| `esp32-firmware/src/mode_tags.h` 引用方 6 个 | 各处接入 |

### 10.2 关键常量速查

| 名称 | 值 | 含义 |
|---|---|---|
| `kCharX` | 6 | 角色固定 X |
| `kGroundY` | 59 | 地面顶部 Y |
| `kBgYOffset` | -12 | 背景 Y 偏移 |
| `kJumpHeight` | 21 | 跳跃高度 |
| `kBgSpeed` | 0.5 | 背景滚动 px/帧 |
| `kEntSpeed` | 0.6 | 实体相对速度 px/帧 |
| `kSkateboardBoost` | 2.0 | 滑板加速倍率 |
| `kObstacleScale` | 0.73 | 障碍物缩放 |
| `kItemScale` | 0.73 | 道具/飞行斧缩放 |
| `kSpawnInterval` | 网页 150 / 板载 100 | 主生成间隔帧 |
| `kEggCooldownFrames` | 1500 | 蛋之间最小帧数 |
| `kCrowYOffset` | 36 | 乌鸦距地高度 |
| `kFruitAirY` | 36 | 水果空中高度 |
| `kFairyOffsetX` | -14 | 仙女水平相对角色 |
| `kFairyOffsetY` | 41 | 仙女距地高度 |
| `fairyT` 初始 | 900 | 仙女 30 秒 @ 30fps |
| `kThrowDist` / `kThrowRange` | 32 / 16 | 扔斧距离中心 ± 容差 |
| `kCrowJumpDist` / `kCrowJumpRange` | 40 / 12 | 乌鸦先跳的中心 ± 容差 |
| `kStumbleFrames` / `kStumbleHoist` | 24 / 12 | 磕到帧数 / 弹起高度 |
| `kAxeSpeed` / `kAxeAnimSpeed` | 2 / 3 | 斧子飞 / 旋转切帧 |
| 抽签权重 | 25 / 25 / 30 / 20 | 水果 / 障碍 / 敌人 / 蛋 |

---

## 11. 总结: 一份"动作类游戏主题"开发模板

凡是新加这种**横版动作 + 状态机驱动**的主题, 重复以下步骤即可:

1. **选型核对** (§1.1): 主题尺寸/状态/玩法循环都符合 64×64 标准
2. **采集素材** (§2): 至少 5 类 (角色/敌人/障碍/道具/数字), 边采边对照需求
3. **切割 + 整理** (§3): 背景色 flood fill, 用户指认每张图用途, 建 organized/ 目录
4. **流水线** (§4): PNG → JS → PROGMEM, 全自动化, 不手改输出
5. **网页预览** (§5): 先把状态机和渲染在网页跑通, 全参数挂滑块, 用户拍板每个值
6. **状态机/AI** (§6): 自动 spawn / 跳跃 / 投掷 / 死亡动画, 不需要用户输入也能循环
7. **板载移植** (§7): 6 步接入 (mode_tags / effect / command_bus / coordinator / config_manager / main), 字段名跟网页 1:1
8. **常量 vs 滑块** (§5.4): 调试期网页全可调, 验收后板载写死, 用户只看不调
9. **资源把关** (§8): Flash < 500 KB / RAM < 20 KB / 单帧 < 5 ms
10. **调试套路** (§9): 网页优先, 板载用诊断标记 + 串口 fps

**核心原则**: 字段名网页/板载 1:1, 不发明字段; 任何缺失先停下问用户, 不脑补; 每个状态机分支都对照网页 reference 翻译, 不省略.
