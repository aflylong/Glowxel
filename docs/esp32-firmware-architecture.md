# ESP32 板载程序架构(快速上手)

> 一句话:**uniapp / website 通过 WebSocket 发命令 → 板载用一套统一"事务流程"接收 → 切到对应模式渲染 → 刷到 64×64 LED 矩阵**。

新增任何一个新模式,只要改 6 个固定位置就行。读完这篇文档你能 30 分钟搞定一个新模式接入。

---

## 1. 整体分层

```
   ┌─ 应用层(uniapp/website)
   │   ws.startXxx(config) → runModeTransaction({mode, params})
   │
   ↓ WebSocket(JSON tx_begin / tx_commit)
   │
   ┌─ 通讯层(websocket_handler.cpp)
   │   handleJsonCommand   — 按 cmd 字段分发
   │   handleBinaryFrame   — 二进制分片
   │
   ↓
   │
   ┌─ 命令总线(runtime_command_bus.cpp)
   │   beginWebSocketTransaction        — 解析 tx_begin
   │     └─ buildPreparedWebSocketTransaction(mode, params)
   │          └─ prepareXxxTransaction(params)            ← 你的解析点 ★
   │   commitWebSocketTransaction       — 解析 tx_commit
   │     └─ executeCommand(preparedCommand)
   │          └─ executeBusinessModeSwitch                ← 你的落地点 ★
   │
   ↓
   │
   ┌─ 模式协调(runtime_mode_coordinator.cpp)
   │   switchToMode                 — 各模式的"激活"入口
   │   deactivateRuntimeContent     — 各模式的"清场"入口
   │   restoreCurrentModeFrame      — 重启后状态恢复
   │
   ↓
   │
   ┌─ 渲染层
   │   - DisplayManager(基础像素 / 时钟 / loading)
   │   - 各效果模块: maze_effect / snake_effect / 
   │     terraria_clock_effect / tetris_effect / eyes_effect ...
   │     接口规范:applyConfig / update / render / isActive / deactivate
   │
   ↓
   │
   ┌─ 主循环(main.cpp::loop)
   │   按 currentMode + currentBusinessModeTag 派发 update + render
   │
   ↓
   ┌─ 硬件层
   │   ESP32 HUB75 LED Matrix DMA (64×64)
```

---

## 2. WebSocket 命令的"事务"流程(★ 必看)

每个会改变设备状态的命令都走"两阶段事务",**永远不要再加新流程**。

### 2.1 客户端

```js
// uniapp/utils/webSocket.js  或  website/src/utils/deviceWebSocket.js
async startSnake(config) {
  return this.runModeTransaction({
    mode: "snake",
    params: { speed, snakeWidth, snakeColor: hexToRgb(...), ... }
  });
}
```

`runModeTransaction(options)` 内部会:
1. 生成 txId
2. 发 `{cmd:"tx_begin", txId, mode, params, hasBinary, binarySize}` JSON
3. 等 `{status:"accepted", txId}` 响应
4. (有二进制) 分片发二进制
5. 发 `{cmd:"tx_commit", txId}`
6. 等 `{status:"final_ok"|"final_error", txId}`

**整个客户端只有一条路径**,新模式不要绕开。

### 2.2 板载

```cpp
// websocket_handler.cpp::handleJsonCommand
if (cmd == "tx_begin") {
  RuntimeCommandBus::beginWebSocketTransaction(client, doc, response, ...);
}
if (cmd == "tx_commit") {
  RuntimeCommandBus::commitWebSocketTransaction(client, doc, response);
}
```

`beginWebSocketTransaction` 做的事:
1. 检查 doc 字段 `txId/mode/params/hasBinary/binarySize`
2. 调 `buildPreparedWebSocketTransaction(mode, params, reason)` 解析 params 并把结果写入 `gWebSocketTransactionSession.preparedCommand`
3. 检查二进制类型(有的话)
4. 进 LOADING 屏(必要时)
5. 回 `tx_accepted`

`commitWebSocketTransaction` 做的事:
1. 校验 txId 一致
2. 把 `preparedCommand` 通过 `executeCommand()` 派发
3. 最终走到 `executeBusinessModeSwitch` 完成模式切换 + 持久化
4. 回 `tx_final_ok`

---

## 3. 模式标识(★ 必看)

板载的"模式"是 **二级结构**:

```
DeviceMode currentMode             顶层模式枚举(MODE_CLOCK / MODE_ANIMATION / MODE_THEME / ...)
String     currentBusinessModeTag   业务模式标签字符串(在 mode_tags.h 里定义)
```

举例:

| 业务标签 (currentBusinessModeTag) | 顶层模式 (currentMode) | 说明 |
|---|---|---|
| `clock` | `MODE_CLOCK` | 静态时钟 |
| `theme` | `MODE_THEME` | 主题时钟(原生)|
| `canvas` | `MODE_CANVAS` | 画板 |
| `animation` | `MODE_ANIMATION` | 帧动画 |
| `gif_player` | `MODE_ANIMATION` | GIF 播放 |
| `maze` | `MODE_ANIMATION` | 迷宫 |
| `snake` | `MODE_ANIMATION` | 贪吃蛇 |
| `tetris` | `MODE_ANIMATION` | 俄罗斯方块 |
| `tetris_clock` | `MODE_ANIMATION` | 方块时钟 |
| `terraria_clock` | `MODE_ANIMATION` | 泰拉瑞亚时钟 |
| `eyes` | `MODE_ANIMATION` | 眼睛 |
| `text_display` | `MODE_ANIMATION` | 跑马灯 |
| `planet_screensaver` | `MODE_ANIMATION` | 行星屏保 |
| `breath_effect` / `rhythm_effect` / `ambient_effect` / `led_matrix_showcase` | `MODE_ANIMATION` | 各种环境光效果 |

**每个新模式只需要新加一个 `currentBusinessModeTag`,顶层 mode 选 `MODE_ANIMATION`**(除了真静态时钟/主题/画板)。

`mode_tags.h` 是真值源:

```cpp
namespace ModeTags {
  inline constexpr const char* CLOCK          = "clock";
  inline constexpr const char* MAZE           = "maze";
  inline constexpr const char* SNAKE          = "snake";
  inline constexpr const char* TERRARIA_CLOCK = "terraria_clock";
  // ...
}
```

---

## 4. 持久化(NVS)

每个有状态的模式各自一个 namespace,**不要混用**:

```cpp
// config_manager.cpp
preferences.begin("clock", ...);     // 静态时钟
preferences.begin("anim", ...);      // 动画
preferences.begin("theme", ...);     // 主题
preferences.begin("maze", ...);      // 迷宫
preferences.begin("snake", ...);     // 贪吃蛇
preferences.begin("terraria", ...);  // 泰拉瑞亚
preferences.begin("device", ...);    // 设备参数(亮度/旋转/夜间模式)
```

每个 namespace 内部都用 `putBytes("config", &configStruct, sizeof(configStruct))` 一刀切的二进制存储,**靠 `sizeof` 比对做版本兼容**(struct 加字段就让旧数据失效,fallback 到默认值)。

---

## 5. 加一个新模式的 6 个步骤

举例:加一个 `my_new_clock` 模式,要做:

### 5.1 `include/mode_tags.h` 加常量

```cpp
inline constexpr const char* MY_NEW_CLOCK = "my_new_clock";
```

### 5.2 `include/my_new_clock_types.h`(新文件)定义 config struct

```cpp
struct MyNewClockConfig {
  uint8_t param1;
  uint8_t param2;
  uint8_t color[3];
};
```

### 5.3 `include/my_new_clock_effect.h` + `src/my_new_clock_effect.cpp`(新文件)实现渲染

约定接口:

```cpp
namespace MyNewClockEffect {
  void init();
  void deactivate();
  void applyConfig(const MyNewClockConfig& config);
  void update();   // 每帧推进动画状态,不画屏
  void render();   // 实际画到 display
  bool isActive();
}
```

**渲染层必须遵守"双缓冲 + dirty diff"模式,不准每帧全屏重刷**。模板见 §5.10。

### 5.4 `include/config_manager.h` + `src/config_manager.cpp`

```cpp
// 头文件
static MyNewClockConfig myNewClockConfig;
static void loadMyNewClockConfig();
static void saveMyNewClockConfig();

// cpp 加默认值 + load/save 实现 + init() 里调 loadMyNewClockConfig()
```

### 5.5 `include/runtime_command_bus.h` 在 `RuntimeCommand` 里加字段

```cpp
struct RuntimeCommand {
  // ... 已有字段
  MyNewClockConfig myNewClockConfig;  // 新增
};
```

### 5.6 `src/runtime_command_bus.cpp` 三处改动 ★

**(a) 加 `prepareMyNewClockTransaction` 函数**(模仿 `prepareSnakeTransaction`):

```cpp
bool prepareMyNewClockTransaction(JsonObject params, const char*& reason) {
  if (!params.containsKey("param1") || ...) {
    reason = "my_new_clock fields missing";
    return false;
  }
  // 校验 + 提取
  resetPreparedCommand(gWebSocketTransactionSession.preparedCommand);
  RuntimeCommandBus::RuntimeCommand& command = gWebSocketTransactionSession.preparedCommand;
  command.type = RuntimeCommandBus::RuntimeCommandType::MODE_SWITCH;
  command.targetMode = MODE_ANIMATION;
  command.businessModeTag = ModeTags::MY_NEW_CLOCK;
  command.successMessage = "my new clock started";
  command.myNewClockConfig.param1 = ...;
  reason = nullptr;
  return true;
}
```

**(b) `buildPreparedWebSocketTransaction` 加 dispatch 分支**:

```cpp
} else if (mode == ModeTags::MY_NEW_CLOCK) {
  prepared = prepareMyNewClockTransaction(params, reason);
}
```

**(c) `executeBusinessModeSwitch` 加落地分支**(模仿 TERRARIA_CLOCK 的写法):

```cpp
if (command.businessModeTag == ModeTags::MY_NEW_CLOCK) {
  const MyNewClockConfig previousConfig = ConfigManager::myNewClockConfig;
  // 切场前清屏 / 关掉旧模块
  RuntimeModeCoordinator::deactivateRuntimeContent();
  // 应用新配置
  ConfigManager::myNewClockConfig = command.myNewClockConfig;
  if (!RuntimeModeCoordinator::switchToMode(...)) {
    ConfigManager::myNewClockConfig = previousConfig;  // 回滚
    setErrorResponse(response, "...");
    return false;
  }
  ConfigManager::saveMyNewClockConfig();
  response["message"] = command.successMessage;
  return true;
}
```

### 5.7 `src/runtime_mode_coordinator.cpp` 三处接入

```cpp
// 1) shouldClearScreenBeforeBusinessModeEntryInternal 加白名单
businessModeTag == ModeTags::MY_NEW_CLOCK ||

// 2) switchToMode 加激活分支
if (businessModeTag == ModeTags::MY_NEW_CLOCK) {
  MyNewClockEffect::applyConfig(ConfigManager::myNewClockConfig);
  if (!MyNewClockEffect::isActive()) return false;
  MyNewClockEffect::render();
  return true;
}

// 3) deactivateRuntimeContent 加清场
MyNewClockEffect::deactivate();

// 4) isRecoverableBusinessModeTag 加白名单(供重启状态恢复)
businessModeTag == ModeTags::MY_NEW_CLOCK ||
```

### 5.7.1 `src/config_manager.cpp::isStaticallyRecoverableBusinessModeTag` 加白名单 ★

**这一步极易遗漏**。`isRecoverableBusinessModeTag`(coordinator)和 `isStaticallyRecoverableBusinessModeTag`(config_manager)是**两个不同函数**,前者管"重启时分发到哪个 effect",后者管"启动加载 NVS 时承认这个 tag",**必须都加**:

```cpp
// config_manager.cpp
bool isStaticallyRecoverableBusinessModeTag(const String& businessModeTag) {
  return ... ||
         businessModeTag == ModeTags::MY_NEW_CLOCK ||  // ← 加这一行
         ...;
}
```

**漏掉的症状**:模式发送、显示都正常,但**重启后回到默认 clock 模式**(因为 NVS 里 `bizMode` 字段被 sanitize 函数视为非法 → fallback CLOCK)。NVS 数据其实已经存了,但加载时被丢。

调试方法:重启后串口看一行 `[ConfigManager] bizMode loaded: clock`(被替换成 clock 就是这个问题)。

### 5.8 `src/main.cpp::loop` 加主循环 dispatch

```cpp
} else if (DisplayManager::currentBusinessModeTag == ModeTags::MY_NEW_CLOCK &&
           MyNewClockEffect::isActive()) {
  MyNewClockEffect::update();
  MyNewClockEffect::render();
}
```

### 5.9 客户端加 API

```js
// uniapp/utils/webSocket.js
async startMyNewClock(config) {
  return this.runModeTransaction({
    mode: "my_new_clock",
    params: { param1: config.param1, ... }  // 字段名跟板载完全一致
  });
}
```

**就完了**。所有部分都跟 `maze` / `snake` / `terraria_clock` 同模板,不要发明新机制。

---

### 5.10 渲染层模板 ★ —— 双缓冲 + dirty diff(防闪烁)

**绝对禁止每帧整屏 `display->drawPixel()` 全画一遍**。LED 矩阵双缓冲模式下,直接 drawPixel 没 flipDMABuffer 会导致**整屏循环移位 1 行**(顶部那行变成屏幕最底部那行)。

**最重要的红线:不要重新发明 dirty diff 和 flipDMABuffer 逻辑,项目已经有了**。

直接用 `DisplayManager::presentOffscreenFrame(uint16_t* buffer)`,内部实现:
- dirty diff(对比 `liveFrameBuffer`,只推差异像素,自动跳过未变像素)
- 单缓冲模式:无操作(drawPixel 直接生效)
- 双缓冲模式:推送后调 `flipDMABuffer()`(切换前后台 DMA buffer)

#### 标准模板(看 `terraria_clock_effect.cpp` 实操)

```cpp
namespace {
  // 渲染缓冲 8 KB SRAM (RGB565)
  uint16_t s_renderBuffer[64][64] = {};   // 当前帧合成目标 (写到这里, 不直接画 display)
  bool s_lastFrameValid = false;

  inline void putPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
    if (x < 0 || x >= 64 || y < 0 || y >= 64) return;
    // ★ 必须用库的 color565, 跟 dma_display 期望的 RGB565 byte 顺序一致
    s_renderBuffer[y][x] = MatrixPanel_I2S_DMA::color565(r, g, b);
  }

  // 当前帧"动态状态指纹"(用于决定要不要重画)
  struct DynamicState {
    uint8_t animFrame;
    char    timeText[12];
    // ... 其他可能变化的输入
  };
  DynamicState s_lastDynamicState = {};

  bool dynamicStateChanged(const DynamicState& a, const DynamicState& b) {
    return a.animFrame != b.animFrame ||
           strcmp(a.timeText, b.timeText) != 0;
  }

  // 所有底层 draw 函数都用 putPixel 写 buffer, 绝不碰 display
  void drawSomething(...) {
    putPixel(x, y, r, g, b);
  }

  // 把整个场景画到 s_renderBuffer
  void buildFrame() {
    drawBackground();
    drawCharacter();
    drawAnimation();
    drawClock();
  }

  // ★ 推送: 直接走项目统一管线, 不要自己写 display->drawPixel 循环!
  void flushFrameToDisplay() {
    DisplayManager::presentOffscreenFrame(&s_renderBuffer[0][0]);
    s_lastFrameValid = true;
  }
}

namespace MyNewClockEffect {
  void render() {
    if (!s_active) return;
    auto* display = DisplayManager::dma_display;
    if (display == nullptr) return;

    // 1) 算动态状态, 没变直接 return (核心防闪烁逻辑)
    DynamicState now = computeDynamicState();
    if (s_lastFrameValid && !dynamicStateChanged(now, s_lastDynamicState)) {
      return;
    }

    // 2) 重建 buffer (写 SRAM, 不碰 display)
    buildFrame();

    // 3) 走 DisplayManager 管线推送
    flushFrameToDisplay();

    s_lastDynamicState = now;
  }

  void applyConfig(const Config& cfg) {
    s_config = cfg;
    s_active = true;
    // 配置变 → 强制下一帧重画
    s_lastFrameValid = false;
    memset(&s_lastDynamicState, 0, sizeof(s_lastDynamicState));
  }

  void deactivate() {
    s_active = false;
    s_lastFrameValid = false;
    memset(&s_lastDynamicState, 0, sizeof(s_lastDynamicState));
  }
}
```

#### 跟 maze / snake 的统一管线

| 模式 | 渲染 buffer 推送方式 |
|---|---|
| maze | `DisplayManager::presentOffscreenFrame(frameBuffer)` 或 `presentSolidRectUpdates`(脏区列表) |
| snake | `renderSnake(offscreen)` 写 buffer → `DisplayManager::presentOffscreenFrame(frameBuffer)` |
| tetris / tetris_clock | 自己写 dirty + 用 `display->drawPixel`(它的特殊场景,有 buffer 镜像在 backgroundBuffer) |
| **terraria_clock(我们)** | 写 `s_renderBuffer` → `DisplayManager::presentOffscreenFrame(&s_renderBuffer[0][0])` |

**主题时钟一律走第 4 种模式**,跟 snake 一样最简单。

#### 性能对比(以 terraria 为例)

| 场景 | 自己写 display->drawPixel | DisplayManager::presentOffscreenFrame |
|---|---|---|
| 配置发送/首帧 | 4096 像素 | ≤ 4096 像素(液 dirty diff) |
| 翅膀切帧 | 4096 像素(全屏闪) | ~30-60 像素(自动 dirty diff) |
| 守卫切帧 | 4096 像素(全屏闪) | ~40 像素 |
| 静止帧(buffer 不变) | 4096 像素(浪费) | **0 像素**(liveFrameBuffer 完全相同 → 跳过) |
| 双缓冲下整屏对齐 | ❌ 错位 1 行(没 flipDMABuffer) | ✅ 正确(内部已 flip) |

**资源代价**:每个动态模式 +8 KB SRAM 单缓冲(s_renderBuffer)。`liveFrameBuffer` 是 DisplayManager 全局已存在的,不重复占用。当前 RAM 用 36% / 220 KB 余量,够开 20+ 个独立模式。

#### 三大反模式(见过就一定要 review)

1. **❌ 自己写"渲染 buffer + 上次 buffer + diff 推送 display"**
   → 重复造轮子,且双缓冲模式下没 flipDMABuffer 会**错位 1 行**
   → 改用 `DisplayManager::presentOffscreenFrame()`

2. **❌ render() 直接 `display->drawPixel(x, y, color)` 整屏循环**
   → 会闪烁 + 双缓冲下错位
   → 必须先合成到 buffer 再 present

3. **❌ 自己实现 RGB565 转换公式**
   → 库内部如果有 byte swap 会不一致,某些颜色显示错误
   → 一律用 `MatrixPanel_I2S_DMA::color565(r, g, b)`

---

## 5.11 主题时钟模式专项指南 ★

主题时钟(Terraria / Pokemon / Kamen Rider 这类)有别于纯算法模式(maze / snake)。多了**资产**、**多帧动画**、**复杂角色合成**、**装饰边框**等额外维度。这一节专门讲这类的开发要点。

### A. 设计阶段必须先做的事

#### A1. 资产清单 + 容量估算

**先盘点要哪些资产,估算占多大**,再下手。

主题时钟典型资产:
| 类别 | 数量 | 单张大小 | 小计 |
|---|---|---|---|
| 背景 / 地砖 | 3-5 张 | 5×5 ~ 16×16 | < 5 KB |
| 角色基础层(头/眼/躯干/腿/臂) | 14-20 层 | 40×56 网格 | 30-60 KB |
| 装备 / 套装 | 4 套 × 3 件 | 40×56 网格 | 60-120 KB |
| 翅膀 / 配件(差异帧动画) | 4 个 × 3 帧 | base + 2 delta | 30-60 KB |
| 召唤物 / 宠物(差异帧) | 1 个 × 8 帧 | base + 7 delta | 20-40 KB |
| 武器 / 道具 | 5-10 个 | 16×16 ~ 40×40 | 10-30 KB |
| 特效素材(光团/粒子) | 2-5 个 | 8×8 ~ 16×16 | < 5 KB |
| **合计目标** | | | **< 500 KB** |

**硬性指标**:总资产 ≤ 500 KB(留出 1 MB 给未来其他模式)。超了要砍内容或加压缩。

#### A2. 配置字段 (Config Struct) 提前定型

设计阶段就要确定 17 个左右字段(像 `TerrariaModeConfig` 那样),包括:
- 角色相关:character / weaponId / playerX/Y/Scale
- 配件相关:wingSpeed / 召唤物位置 / 配件状态
- 时钟相关:fontId / fontScale / clockX/Y / hourFormat / showSeconds
- 颜色相关:clockTextColor / 装饰色

**任何字段都要在 NVS 里能持久化**(struct 二进制 putBytes),不要中途加。中途加 → 旧 NVS 数据 size 不匹配 → 强制 fallback default。

#### A3. 客户端发的"是参数"还是"是像素"

**永远是参数**。

```js
// 错(板上没事干 + 流量大)
ws.sendImageData(rendered64x64Pixels);

// 对(板上自渲染)
ws.startTerrariaClock({character, weaponId, playerX, ...});
```

板载收到参数后**自己用 PROGMEM 资产合成**,这样:
- 流量小(< 200 字节 vs 12 KB)
- 板上有动画(WS 不发,板自动 tick)
- NVS 持久化容易(只存 17 个数字)

### B. 资产格式与压缩(★ 重点中的重点)

#### B1. PNG 不进固件,要转紧凑格式

ESP32 没 PNG decoder。资产必须转成"非透明像素列表"。

**fmt 5(小图,坐标 < 256)**:每像素 5 字节 `[x:1, y:1, r:1, g:1, b:1]`  
**fmt 7(大图,坐标 ≥ 256)**:每像素 7 字节 `[x_lo, x_hi, y_lo, y_hi, r, g, b]`

只存非透明像素,稀疏率 70%-90% → 比全帧 RGBA32 小 80% 以上。

转换脚本范式:`tools/build-firmware-sprites.js` (Node.js + pngjs)。

#### B2. 多帧动画必须用差异帧

**不要存全帧**。

```
base 帧 = 帧 0 全部像素 (最大)
delta 帧 N = 帧 N 与帧 0 不同的像素 (小)
```

适用对象:翅膀扇动、守卫 idle、光团呼吸。这种"局部小幅运动"差异帧能省 70-90%。

**不适用**:整个角色都在动的(那就老老实实存全帧)。

#### B3. 资产组织:按"类"合并不按"帧"分文件

错的:每帧一个文件,46 个文件
```
sprites/
  warrior_armor_head.h
  ranger_armor_head.h
  ...
```

对的:同类合并 1 个文件
```
sprites_armor_heads.h     // 4 个头甲
sprites_armor_bodies.h    // 4 个胸甲
sprites_wings.h           // 4 个翅膀(各自含 base + 2 delta)
```

文件数控制在 8-10 个,编译/链接时间可控,文件管理也方便。

#### B4. 大尺寸 sprite 缩放铺到屏幕用"反向采样"(★ 易踩坑)

如果要把 16×16 的 sprite 缩到 5×5 平铺当地砖,**不要用"sprite 像素遍历 + 算 px py"**,会出现"屏幕最下面空一行"的问题。

**错的**(正向采样):
```cpp
for (sprite 像素 (tx, ty)) {
  px = ox + round(tx * 5/16);
  py = oy + round(ty * 5/16);  // tx=14, ty=14 → py 算成 64, 边界丢弃
  putPixel(px, py, ...);
}
```

ty=14, ty=15 的源像素映射到 py >= 64 会被边界裁掉,导致目标 5×5 buffer 的最后一行采样不全 → 屏幕上"空一行"。

**对的**(反向采样,见 `terraria_clock_effect.cpp::buildFrame` 草地铺设):
```cpp
// 1) 先把 PROGMEM sprite 解到一个 16×16 RGB 临时表 (静态 buffer)
static uint8_t tileBuf[16][16][3];

// 2) 反向: 对目标 buffer 的每个像素, 从临时表取 nearest 源像素
for (int dy = 0; dy < 5; dy++) {
  int ty = (dy * 16 + 8) / 5;  // 中心采样, 永远在 [0, 16)
  if (ty >= 16) ty = 15;
  for (int dx = 0; dx < 5; dx++) {
    int tx = (dx * 16 + 8) / 5;
    if (tx >= 16) tx = 15;
    putPixel(ox + dx, oy + dy, tileBuf[ty][tx][0..2]);
  }
}
```

反向采样保证**目标的每个像素一定被填充**,绝不留空。代价是要先把 sprite 解到 RAM 临时表(64 × 64 sprite × 3 通道 = 12 KB),用 `static` 全局 + `kBufferLoaded` 标志只解一次。

### C. 渲染层架构(双层模式)

主题时钟典型渲染分层:
```
背景层(几乎不变)
  ├ 渐变天空 / 静态背景图
  ├ 地砖 / 草地循环
  └ 装饰云 / 山 / 树
角色合成层(配置变才变)
  ├ 装备 / 皮肤 / 头甲(多步合成,见 §C2)
  └ 头发 / 眼珠 / 装饰
配件动画层(每帧变)
  ├ 翅膀帧
  ├ 召唤物 / 宠物帧
  └ 光团 / 抖动 / 粒子
时钟层(每分钟变)
  ├ 字本体
  └ 装饰边框(膨胀 / 阴影 / 描边)
```

**全部画到 `s_renderBuffer`,不直接戳 display**。然后 §5.10 的 dirty diff 自动决定哪些像素要推。

#### C2. 角色合成的"step 顺序"(从源码读出来,不要瞎想)

主题时钟的角色合成往往**不是简单"前画后画"**,而是"前后臂分两次画 + 装备覆盖皮肤 + 头甲压头发"这种交错顺序。

获取办法:**反编译游戏源码**,找渲染主函数(Terraria 是 `Player.cs::DrawPlayer_*`)。

Terraria 16 step 实际就是这么读出来的,任何主题时钟都得**先把游戏内部的合成顺序梳理出来**再实现。

### D. 时钟集成

#### D1. 时钟字必须光栅化到 mask 才能做边框

直接 `drawClockText` 画到 display 没法加描边/膨胀边框。需要:

1. `clock_font_renderer.cpp::rasterizeClockTextToMask()` 把字写到 64×64 mask
2. 算 mask bbox
3. 对 bbox 内非 mask 像素算到 mask 的距离(切比雪夫 / 欧式)
4. 距离 1 → 内圈色,距离 2 → 外圈色
5. 字本体最后用主色覆盖

模板见 `terraria_clock_effect.cpp::drawClockWithBorder`。

#### D2. 字体 ID 跨端走字符串

uniapp 端用 `"lcd_6x8"` 字符串,板载端转成 `CLOCK_FONT_LCD_6X8` 枚举,WS 上发的就是字符串。

转换函数:`clockFontIdFromString(name, &id)`(已存在,直接用)。

不要用数字 ID,不直观。

### E. uniapp 端入口页

#### E1. 模板复用

新主题时钟入口页直接抄 `pages/clock-editor/terraria-clock.vue`,改:
- `clockMode` 字符串
- `data.config.<theme>` 默认值
- 第 3 个 Tab(角色/职业)的内容
- `sendToDevice()` 调对应的 `ws.startXxxClock()`

#### E2. 必走 mixins

```js
mixins: [
  statusBarMixin,        // 状态栏自适应
  clockPreviewMixin,     // 时钟时间文本(getTimeText 等)
  deviceSyncMixin,       // 默认 sendToDevice 实现 (但主题时钟必须 override!)
  deviceSendUxMixin,     // 发送遮罩 / loading / toast
]
```

主题时钟在 vue 内 **必须 override `sendToDevice` 方法**,因为 mixin 默认走 `applyClockMode`(只支持 clock/animation/theme),主题时钟要走自己的 `startXxxClock`。

#### E3. 控件规则(项目硬约束)

- **禁止用原生 `<slider>`**,功能配置页一律 `setting-item-row + control-btn (+/-)`
- 数值步进:位置 ±1,缩放 ±5,百分比 ±10
- 写完后样式自动符合 neubrutalism 风格(项目级 CSS 变量)

### F. 板载 WS 接入 — 一定要走"事务流程"

#### F1. 接入点(★ 易踩坑)

**正确**:`runtime_command_bus.cpp::buildPreparedWebSocketTransaction` + `prepareXxxTransaction`  
**错误**:`websocket_command_handlers_mode_switch.cpp::fillXxxModeCommand`(那是老的 `set_mode` 直接命令路径,uniapp 不走这条)

uniapp 走 `runModeTransaction → tx_begin / tx_commit`,**所有现代模式都走事务流程**。

#### F2. params 字段在 `doc["params"]` 下,不在顶层

```cpp
// 在 prepare* 函数里 (params 已经被框架拆出来了)
bool prepareXxxTransaction(JsonObject params, const char*& reason) {
  if (!params.containsKey("character")) {  // ← 用 params,不是 doc
    reason = "xxx fields missing";
    return false;
  }
  ...
}
```

#### F3. Hex 颜色解析复用现成 helper

不要自己写 `parseHexColorRgb`。仓库已有:
- `isHexColorText(str)` —— 校验 `#rrggbb` 格式
- `parseRequiredHexColorText(params, field, target, size)` —— 解析到字符串(maze 风格)
- `parseHexColorString(value, out[3])` —— 解析到 3 字节 RGB(terraria 风格)

### G. 配置持久化

#### G1. 一个模式一个 NVS namespace

```cpp
// config_manager.cpp
preferences.begin("terraria", ...);
preferences.begin("pokemon", ...);
```

不要混用,不要塞别人的 namespace。

#### G2. struct 二进制存储 + size 比对版本

```cpp
void loadXxxConfig() {
  preferences.begin("xxx", true);
  size_t configSize = preferences.getBytesLength("config");
  if (configSize == sizeof(XxxConfig)) {  // size 不匹配就不加载,fallback default
    preferences.getBytes("config", &xxxConfig, sizeof(XxxConfig));
  }
  preferences.end();
}
```

加字段就 size 不匹配 → 旧数据失效 → 用默认值。简单粗暴。

#### G3. 默认值跟客户端 1:1 对齐

`config_manager.cpp` 里的 struct 默认初始化,**必须跟 uniapp 页面 `data.config.terraria` 默认值完全一致**。否则首次进设备显示的跟首次打开页面预览的不一样。

### H. 性能考量

#### H1. 资产读取必须 PROGMEM

```cpp
const uint8_t kSpriteData[] PROGMEM = {...};

// 读
uint8_t r = pgm_read_byte(p);
```

不要用普通 `const uint8_t[]`,会进 SRAM。

#### H2. 计算量预算

每帧渲染 ≤ 5 ms,否则掉帧。Terraria 单帧大概:
- 背景 + 草地:~ 1500 像素 putPixel
- 角色 16 step:~ 1000 像素
- 翅膀 / 守卫:~ 200 像素
- 时钟 + 边框:~ 100 像素
- diff flush:平均 ~ 50 像素 drawPixel

总 ~ 3000 ops,ESP32 240 MHz 能跑 30+ fps。

如果加更复杂角色合成(光晕特效 / 残影),先在 PC 端估算 ops,**复杂特效在 64×64 上往往看不清,直接砍掉**。

#### H3. 不用 `String` / `std::string` 在热路径

`render()` 里只用 `char[]` + `snprintf`。`String` 会堆分配,30 fps 下会触发 GC 卡顿。

### I. 调试技巧

#### I1. 先在 HTML 调试页跑通

主题时钟太复杂,直接上板调试效率低。

流程:
1. 在 Pokemon 实验区(`D:\project\Pokemon\<theme>-clock-preview\`)写 HTML+JS 调试页
2. Canvas 上跑通角色合成 + 动画
3. 资产格式跑通(< 500 KB)
4. 整体迁移到 uniapp(`utils/<theme>*.js`)
5. uniapp 端预览跑通
6. 资产再转 PROGMEM 到 esp32
7. 板载渲染基本就是把 uniapp 的 JS 翻译成 C++

**反过来不行**——直接上板调试找原因要花 10 倍时间。

#### I2. tx_final_error 看 reason 字段

```js
// 客户端
catch (err) {
  console.error(err);  // err.transactionResponse.reason 就是板载返回的拒绝原因
}
```

常见 reason:
- `"mode unsupported"` → `buildPreparedWebSocketTransaction` 没加 dispatch 分支
- `"xxx fields missing"` → 客户端发的字段名跟板载 prepare 函数里的不一致
- `"xxx config invalid"` → 数值范围不对(playerX 必须 0-63 这种)
- `"xxx color invalid"` → hex 颜色不是 `#rrggbb` 格式
- `"mode activation failed"` → switchToMode 调用了但 effect.isActive() = false

#### I3. 真机看动画 — 用串口

板载在 `effect.cpp::update()` 末尾加:
```cpp
if (millis() - s_lastDebug > 1000) {
  Serial.printf("[T] frame=%d wing=%d\n", s_frameCount, s_wingFrame);
  s_lastDebug = millis();
}
```

每秒打一行,看动画 tick 是不是按预期推进。

### J. 总检查清单(主题时钟开发完成前 review)

- [ ] 资产 < 500 KB(跑 `tools/build-firmware-sprites.js` 看输出)
- [ ] PROGMEM 资产用 `pgm_read_byte` 读
- [ ] Config struct ≤ 80 字节(典型主题时钟)
- [ ] uniapp `data.config.<theme>` 默认值跟板载 `Config.cpp` 一致
- [ ] 客户端发字符串字段(character / fontId)板载用 strcmp / 转换函数
- [ ] 客户端发 hex 颜色,板载用 `parseHexColorString` 解析
- [ ] **render() 用 `DisplayManager::presentOffscreenFrame()` 推送**(不要自己写 dirty diff + drawPixel,详见 §5.10)
- [ ] **`putPixel` / RGB565 转换用 `MatrixPanel_I2S_DMA::color565(r, g, b)`**(不要自己写 `((r&0xF8)<<8)|...`)
- [ ] **`putPixel` 内部加 panel 硬件 row offset 补偿**:`int by = (y + 1) % SCREEN_H;`(详见 §6.8)
- [ ] 静止帧 render() 必须能 0 像素更新(测试:`isActive()=true && config 不变 → 屏不闪`)
- [ ] mode_tags.h 加常量
- [ ] runtime_command_bus.cpp 三处接入(prepare / dispatch / executeBusinessModeSwitch)
- [ ] runtime_mode_coordinator.cpp 四处接入(deactivate / switchTo / shouldClear / isRecoverable)
- [ ] **`config_manager.cpp::isStaticallyRecoverableBusinessModeTag` 加白名单**(否则重启回不到该模式)
- [ ] main.cpp 主循环 dispatch 加分支
- [ ] config_manager.cpp 加 NVS load/save + 默认值
- [ ] uniapp `webSocket.js` 加 `startXxxClock(config)`
- [ ] uniapp `xxx-clock.vue` override `sendToDevice` 调用新 API
- [ ] **时钟字坐标对齐:(x, y) 中 y 永远是字串顶部行,align=center/right 只调 x**(跟 uniapp `drawClockTextToPixels` 一致,见 §K)
- [ ] **大 sprite 缩放铺设用反向采样**(避免最后一行空,见 §B4)
- [ ] PlatformIO 编译过(RAM ≤ 50%, Flash ≤ 80%)
- [ ] 真机烧录测试 → 动画不闪 + 时钟跳转正常 + 设备重启后能恢复

### K. 时钟字坐标对齐约定(★ 跨端一致)

时钟字的 `(x, y)` 在整个项目统一定义为**字串顶部锚点**:

```
align == "left"   →  (x, y) 是字串左上角
align == "center" →  x 是水平中心,  y 仍是字串顶部行
align == "right"  →  x 是字串右边界,  y 仍是字串顶部行
```

**y 永远不参与 align 计算**——center/right 只调 x。

uniapp 端实现:`utils/clockCanvas.js::drawClockTextToPixels`  
板载 mask 实现:`clock_font_renderer.cpp::rasterizeClockTextToMask`

uniapp 默认 `time.y = 6` → 字顶在第 6 行,字尾在第 6 + height 行。**板载默认值必须 1:1 对齐**,否则两端预览跟实际显示错位。

> 别再写 `startY = y - textHeight / 2` 这种"把 y 当中心"的逻辑。错过一次了。

---

## 6. 显示渲染管线深入(★ 必读)

这一节是**最容易踩坑的区域**。每次有新模式加进来,90% 的"显示异常 / 闪烁 / 错位 / 颜色不对"问题都是不理解这套管线导致的。

### 6.1 三个层次

```
        [你的 effect.cpp]
              │
              │  写入                  
              ▼                       
   ┌───────────────────────────┐
   │   s_renderBuffer[64][64]  │  ← uint16_t RGB565 单缓冲, 8 KB SRAM
   │   (你的本地合成 buffer)     │     在你的 effect 内部, 不共享
   └───────────────────────────┘
              │
              │  presentOffscreenFrame
              ▼                       
   ┌───────────────────────────┐
   │  DisplayManager::         │
   │   liveFrameBuffer[64][64] │  ← 项目全局, 记录"上次实际推到 display 的内容"
   │   (镜像缓存)               │
   └───────────────────────────┘
              │  diff (跳过相同像素) 
              │  drawPixel(只推差异)  
              ▼                       
   ┌───────────────────────────┐
   │   dma_display (硬件)       │  ← MatrixPanel_I2S_DMA + DMA buffer
   │   单缓冲 / 双缓冲           │     双缓冲下需要 flipDMABuffer
   └───────────────────────────┘
              │
              ▼
       [LED 物理像素]
```

### 6.2 不同模式选不同的接入方式

| 模式特性 | 选哪个 API | 例子 |
|---|---|---|
| 整帧合成、需要 dirty diff、屏幕状态完全由参数决定 | `DisplayManager::presentOffscreenFrame(buffer)` | snake / 主题时钟 |
| 局部脏区更新(矩形列表) | `DisplayManager::presentSolidRectUpdates(updates, count)` | maze(可选优化路径) |
| 经典 GFX 直接画 + 自己管 backgroundBuffer | `display->drawPixel(x, y, color)` + `backgroundBuffer[y][x] = color` | tetris / tetris_clock |
| 极简:每帧整屏推 | `display->drawPixelRGB888(x, y, r, g, b)` 内层循环 | ❌ 不要这样,主题时钟严禁 |

### 6.3 `DisplayManager::presentOffscreenFrame()` 内部都做什么

```cpp
// 输入: targetBuffer = uint16_t[64*64] 一维 RGB565
void presentOffscreenFrame(const uint16_t* targetBuffer) {
  // 1) 遍历 64x64
  for (y in 0..63) for (x in 0..63):
    nextColor = targetBuffer[y*64 + x]
    // 2) 跟 liveFrameBuffer (上次推到 display 的) 对比
    if (liveFrameValid && liveFrameBuffer[y][x] == nextColor):
      continue  // 一样就跳过, 不刷
    // 3) 不一样 → 推到 dma_display
    dma_display->drawPixel(x, y, nextColor)
    changed = true
  
  // 4) 同步 liveFrameBuffer
  memcpy(liveFrameBuffer, targetBuffer, ...)
  liveFrameValid = true
  
  // 5) 双缓冲必须 flipDMABuffer (单缓冲跳过)
  if (changed) presentFrame()  // 内部根据 doubleBufferEnabled 决定 flipDMABuffer
}
```

**关键点 4 / 5**:`liveFrameBuffer` 同步 + `flipDMABuffer` 调用,**这俩都是你自己写直接 drawPixel 时漏掉的**。

### 6.4 双缓冲模式下的 flipDMABuffer 陷阱

ESP32 HUB75 库支持单缓冲和双缓冲两种模式:
- **单缓冲**:`drawPixel` 直接写到 DMA 当前 buffer,LED 立即刷新
- **双缓冲**:`drawPixel` 写到"后台 buffer",必须 `flipDMABuffer()` 才能切到前台显示

项目默认开**双缓冲**(看 `display_manager.cpp::initializeDmaDisplay`,`mxconfig.double_buff = doubleBuffered`)。

所以**直接 `display->drawPixel` 不调 flipDMABuffer 的后果**:
- 写入的内容在后台 buffer
- LED 还显示前台 buffer 的旧内容
- 下次 `presentFrame()` 触发 flip 时,前台变后台,**这时新内容跟旧内容相差 1 帧**
- 视觉上像"画面循环移位 1 行"或"半帧脏数据"

`presentOffscreenFrame` 内部 `presentFrame()` → `flipDMABuffer()`,**正确管理**这个状态机。所以一定要走管线。

### 6.5 RGB565 byte 顺序

`MatrixPanel_I2S_DMA::color565(r, g, b)` 内部:

```cpp
// 库实现 (Adafruit_GFX 标准)
return ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3);
```

**看起来跟自己写的一样,为什么必须用库的?**

因为:
1. ESP32 HUB75 库可能在初始化阶段调用 `setRGBSwap()` 或 `swapBytes`,自己写的位运算不会跟着变
2. 设备配置 `swapBlueGreen / swapBlueRed` 改了 GPIO 映射后,库的 color565 通过其他途径补偿;自己写的位运算不会跟着补偿
3. 库内部如果改了实现(版本升级),自己写的不跟随

**唯一规则:RGB565 一律用 `MatrixPanel_I2S_DMA::color565(r, g, b)`,绝不自己写。**

### 6.6 主题时钟最简流程(背下来)

```cpp
// effect.h
namespace MyClockEffect {
  void init();
  void deactivate();
  void applyConfig(const Config& c);
  void update();
  void render();
  bool isActive();
}

// effect.cpp
namespace {
  uint16_t s_renderBuffer[64][64] = {};   // ★ 8 KB
  bool s_lastFrameValid = false;
  Config s_config = {};
  bool s_active = false;

  inline void putPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
    if (x < 0 || x >= 64 || y < 0 || y >= 64) return;
    s_renderBuffer[y][x] = MatrixPanel_I2S_DMA::color565(r, g, b);
    // ★ 用库的 color565
  }

  // 所有底层 draw 都用 putPixel, 不要碰 display
  void drawXxx(...) { putPixel(...); }

  void buildFrame() { drawBg(); drawCharacter(); ...; drawClock(); }
}

namespace MyClockEffect {
  void render() {
    if (!s_active) return;
    if (DisplayManager::dma_display == nullptr) return;
    // 1. 算动态状态指纹, 没变 return
    // 2. buildFrame() 写 s_renderBuffer
    buildFrame();
    // 3. ★ 走管线, 不要自己写 drawPixel 循环
    DisplayManager::presentOffscreenFrame(&s_renderBuffer[0][0]);
    s_lastFrameValid = true;
  }
}
```

### 6.7 验证清单 — 烧板前自查

- [ ] 任何"画到屏幕"的代码,grep `effect.cpp` 看有没有 `display->drawPixel` 或 `dma_display->drawPixel` —— **应该 0 处**(全部走 `putPixel`)
- [ ] grep `(r & 0xF8) << 8` 看有没有自己写的 RGB565 转换 —— **应该 0 处**(全部走 `color565`)
- [ ] grep `s_lastFrame` 或类似"上次帧"buffer —— **应该 0 处**(`liveFrameBuffer` 由 `DisplayManager` 全局管理)
- [ ] grep `flipDMABuffer` —— **应该 0 处**(`presentOffscreenFrame` 内部已处理)
- [ ] render() 末尾必须有且只有 `DisplayManager::presentOffscreenFrame(&s_renderBuffer[0][0]);`

### 6.8 硬件 row offset 补偿(★ 此 panel 必修)

**这是这块 panel 的硬件特性,所有新模式都要处理。**

#### 现象

直接 `display->drawPixel(x, y, color)` 或写到 `frameBuffer[y][x]` 后 `presentOffscreenFrame`,**buffer y=N 的内容实际显示到屏幕 y=(N-1) mod 64**。视觉表现:
- "屏幕底部空一行"(y=63 显示成了 y=62 的内容,y=63 显示了 y=0 的内容看起来像底部色不对)
- "整个画面循环上移 1 行"
- 俄罗斯方块时钟:"顶部方块还没落下时,屏底已经显示出顶部那一行像素"
- terraria:"草地最底一行变成天空蓝色"

**已经验证有这个偏移的模式**:terraria_clock / tetris (屏保) / tetris_clock。

**已存在的补偿**:`maze_effect.cpp::resolveMazeDisplayOffsetY()` 在 wide 模式下返回 1,内部所有渲染坐标 +1 抵消(项目惯例的鼻祖)。

#### 标准补偿模板

新加任何模式的 effect.cpp,在底层 putPixel / 写 buffer 的位置一律加 y+1 补偿:

```cpp
inline void putPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
  // ★ 硬件 row offset 补偿: panel buffer y=N → 屏 y=(N-1) mod 64
  //   反向写到 (y+1) % 64 让显示位置回到屏 y=N
  int by = (y + 1) % SCREEN_H;
  s_renderBuffer[by][x] = MatrixPanel_I2S_DMA::color565(r, g, b);
}
```

如果用 `display->drawPixel(x, y, color)` 直接画(像 tetris 屏保那样),也要补偿:
```cpp
int screenY = (y + 1) % 64;
display->drawPixel(x, screenY, color);
```

#### 为什么不全局补偿(在 DisplayManager 里)

**别动**。理由:
- 现有模式 (clock / theme / canvas / animation / led_matrix_showcase / eyes / breath / rhythm / ambient / planet_screensaver / 等) 已经稳定运行,可能内部用了**手动补偿 / 用户没看出来 / panel 的 brightness 模式让偏移看不出来**等多种情形
- 全局加 +1 偏移会**让所有现有模式同时下移 1 行**,出现新的视觉问题
- 项目惯例:**每个新模式自己补偿**(参考 maze 的 `resolveMazeDisplayOffsetY`)

#### 检测方法 — 诊断标记法(永远不要纸上猜)

新模式调出第一帧后,在 buildFrame() 末尾插入临时诊断:
```cpp
for (int x = 0; x < SCREEN_W; x++) {
  putPixel(x, 0, 0, 255, 0);    // y=0 纯绿
  putPixel(x, 63, 255, 0, 0);   // y=63 纯红
}
```

烧板看现象:

| 现象 | 结论 |
|---|---|
| 屏 y=0 绿、y=63 红 | ✅ 没偏移,不需要补偿 |
| 屏 y=0 天空色、y=62 红、y=63 绿 | ⚠️ 整体上移 1 行 → 在 putPixel 里加 `(y+1) % 64` |
| 屏 y=0 红、y=63 绿 | 上下翻转 → setRotation 配置问题 |
| 全屏黑 | flush 路径根本没生效 |

**烧板验证 30 秒,纸上推理 1 小时**。这次因为没第一时间上诊断标记,浪费了 1.5 小时反复猜测。

#### 已采用补偿的位置(给后续维护者参考)

| 文件 | 函数 | 补偿方式 |
|---|---|---|
| `terraria_clock_effect.cpp` | `putPixel` | buffer y+1 |
| `tetris_effect.cpp` | `render()` 内的 `display->drawPixel` 两处 | screenY = (py+1) % 64 |
| `tetris_clock_effect.cpp` | `paintBlockShapeToBuffer` | screenY = (py+1) % 64 |
| `maze_effect.cpp` | `resolveMazeDisplayOffsetY()` | wide 模式返回 1,所有坐标 +offsetY |

---

## 7. 资源约束(★ 必读)

### 7.1 Flash(代码 + 资产)
- 总 4 MB,app0 分区上限 ≈ 3.875 MB
- 当前固件 ≈ 1.65 MB(42.5%),余量 ≈ 2.2 MB
- **大资产打 PROGMEM**(`const uint8_t arr[] PROGMEM = {...}`),不要进 SRAM
- **不用 LittleFS / SPIFFS**(没必要,资产编译进固件就行)

### 7.2 RAM
- 总 320 KB,当前用 36% (~120 KB),余量 ≈ 200 KB
- **没有 PSRAM**
- 大缓冲优先用 `static` 全局 + 单例模式,避免堆碎片
- DMA 显存已占 16 KB(64×64×3 字节)
- DisplayManager 自身另有 `liveFrameBuffer`(8 KB)+ `backgroundBuffer`(8 KB)+ `animationBuffer`(8 KB)+ `canvasBuffer`(12 KB)

**主题时钟单缓冲约定**:每个动态模式 +8 KB(`s_renderBuffer`),20+ 个并存没问题。

### 7.3 DRAM 溢出怎么办

ESP32 总 SRAM 320 KB,但实际可用 DRAM 约 240 KB(扣除 IRAM / DMA / 系统),所以"看起来 RAM 还多"不一定能加新静态 buffer。

链接报 `region 'dram0_0_seg' overflowed by N bytes` 时:
1. 全局 buffer 改 RGB565(每像素 2 字节)而不是 RGB888(3 字节)
2. 大临时表(>1 KB)放进函数 `static` 而不是文件级 `static`(只在第一次进入时分配)
3. 不可避的大 buffer 标 `EXT_RAM_BSS_ATTR`(如果板子有 PSRAM,但当前板子没有)
4. 实在不行删功能

### 7.4 资产格式建议(参考 terraria 的方案)
- 像素稀疏 → 不存全帧,存"非透明像素列表"`(x, y, r, g, b)` 5字节/像素
- 多帧动画 → 存"base 帧 + delta 帧"差异格式
- 颜色种类少 → 调色板+索引

---

## 8. 调试套路

### 8.1 编译
```powershell
cd esp32-firmware
pio run -e esp32dev
```

### 8.2 上传 + 串口监视
```powershell
pio run -e esp32dev -t upload
pio device monitor -e esp32dev -b 115200
```

### 8.3 看 WebSocket 帧
- 在 chrome devtools / 微信开发者工具的 Network 面板能看到 ws 帧
- 板载这边在 `websocket_handler.cpp::handleJsonCommand` 入口加 `Serial.println(doc.as<String>())` 打印收到的 JSON

### 8.4 模式切换失败
- 看 tx_final_error 的 `reason` 字段:
  - `"mode unsupported"` → buildPreparedWebSocketTransaction 没加 dispatch 分支(5.6.b)
  - `"xxx fields missing"` → 客户端 startXxx 发的字段名跟 prepareXxx 中校验的不一致
  - `"xxx config invalid"` → 数值范围超界
  - `"xxx color invalid"` → hex 颜色格式不对(必须 `#rrggbb`)
  - `"mode activation failed"` → switchToMode 调到 effect.applyConfig 但 isActive() 返回 false

### 8.5 显示异常 — 上诊断标记(画面错位 / 闪烁 / 空行 时必用)

如果你在猜"画面看起来上移 1 行""底部空一行""颜色不对"等显示异常,**不要纸上推理超过 10 分钟**。直接在 buildFrame() 末尾加诊断标记:

```cpp
void buildFrame() {
  // ... 你的所有渲染步骤 ...

  // ===== DEBUG: 诊断标记 =====
  for (int x = 0; x < SCREEN_W; x++) {
    putPixel(x, 0, 0, 255, 0);    // y=0  纯绿
    putPixel(x, 63, 255, 0, 0);   // y=63 纯红
    putPixel(0, x, 0, 0, 255);    // x=0  纯蓝(注意这里 x 当 y 用)
    putPixel(63, x, 255, 255, 0); // x=63 纯黄
  }
}
```

烧上去看屏幕的 4 条边界线分别是什么颜色 + 什么位置:

| 现象 | 诊断结论 |
|---|---|
| 顶绿、底红、左蓝、右黄 | ✅ buffer 完美,问题不在 buildFrame 内部 |
| 顶红、底绿(上下翻) | 整体 y 反转(setRotation 错或别的) |
| 第 1 行绿、第 64 行红没显示 | flush 漏掉最后一行 |
| 第 0 行黑、第 1 行绿、第 62 行红、第 63 行黑 | 整体下移 1 行 |
| 顶黄、底蓝(x/y 互换) | rotation = 1 / 3 (90 / 270 度旋转) |
| 颜色不对 (绿变红等) | RGB565 byte swap 或 swapBlueRed 配置错 |

**确诊后立刻删掉诊断标记,做精准修复**。诊断 30 秒,猜 1 小时。
  - `"xxx fields missing"` → params 字段名不对(检查 prepare 函数和客户端 startXxx 是否字段名完全一致)
  - `"mode activation failed"` → switchToMode 调用了 isActive() 但模块没起来

---

## 9. 涉及文件速查表

| 关注点 | 文件 |
|---|---|
| 客户端模式 API | `uniapp/utils/webSocket.js` / `website/src/utils/deviceWebSocket.js` |
| 客户端模式入口页面 | `uniapp/pages/<mode-name>/*.vue` 或 `uniapp/pages/clock-editor/*.vue` |
| WS 命令分发 | `esp32-firmware/src/websocket_handler.cpp` |
| 事务核心 | `esp32-firmware/src/runtime_command_bus.cpp` |
| 模式协调 | `esp32-firmware/src/runtime_mode_coordinator.cpp` |
| 主循环 dispatch | `esp32-firmware/src/main.cpp::loop` |
| 配置持久化 | `esp32-firmware/src/config_manager.cpp` |
| 模式标签 | `esp32-firmware/include/mode_tags.h` |
| 显示底层 | `esp32-firmware/src/display_manager.cpp` |

---

## 10. 红线(踩了一定挨骂)

1. **不要再发明新流程**。所有模式必须走 `runModeTransaction → tx_begin → tx_commit`,不要走 `set_mode` 直接命令(那是老接口)。
2. **字段名 client 和 board 必须 1:1 一致**。不允许写 `a || b` 这种兜底。字段缺失先 reject。
3. **不要往现有模式里塞新模式的逻辑**(典型:不要把 terraria 塞 theme,不要把 snake 塞 maze)。每个模式独立 effect.cpp / config / NVS namespace。
4. **大资产必须 PROGMEM**,不要让 `const uint8_t[]` 进 SRAM。
5. **不要用 `String` 在热路径**。它会堆分配,板上跑 30 fps 渲染时会卡。
6. **加新模式必须改齐 6+ 个文件**(见 §5),少一个就完整链路断了。**特别注意 `config_manager.cpp::isStaticallyRecoverableBusinessModeTag` 的白名单**(漏了重启不恢复)。
7. **render() 必须走 `DisplayManager::presentOffscreenFrame()` 管线**(见 §5.10)。直接 `display->drawPixel...` 整屏画 = 屏幕循环错位 1 行(双缓冲下没 flipDMABuffer)+ 闪烁。状态没变就 return,变了就走管线推。
8. **RGB565 转换一律用 `MatrixPanel_I2S_DMA::color565()`**,不要自己实现位运算。库可能内部 byte swap,不一致会导致颜色错。
9. **新模式必须在 putPixel 内部加 `(y + 1) % SCREEN_H` 行偏移补偿**(见 §6.8)。这块 panel 的硬件特性 — 不补偿就"屏底空一行"。烧板前用诊断标记法验证,**绝不纸上猜**。
