# Design: Terraria 时钟主题 — 板载实现 (esp32-firmware)

## 背景

uniapp 端 (terraria-clock-uniapp spec) 已经把"4 职业 + 武器 + 翅膀 + 守卫 + 森林背景 + 时钟草膨胀边框"渲染调好,资产压成 8 个 .js 文件 / 328 KB。

本期任务: 把这套渲染**搬到 ESP32 板载**, 让设备真正能显示 Terraria 主题。

## 核心约束 (用户确认)

1. **完全独立模式, 不污染现有 theme/clock 等模块**
2. **走 MODE_ANIMATION + businessModeTag = "terraria_clock"** (跟 maze/snake 一致, 不新增 DeviceMode 枚举)
3. **NVS 独立 namespace** ("terraria")
4. **时钟字段独立, 不复用现有 ClockConfig** (terraria 时钟有独有的草膨胀边框)
5. **sprite 资产编进 firmware (PROGMEM)** — 不走 LittleFS, 不走 OTA 上传
6. **uniapp 只发参数, 板载自己渲染** — 跟 maze/snake 模式同样的数据流

## 数据流

```
小程序 (terraria-clock.vue)
  选择 4 职业 / 武器 / 角色位置 / 守卫位置 / 时钟字体颜色
  ↓ 点"发送"
uniapp/utils/webSocket.js
  调用 applyTerrariaClockMode(config)
  → runModeTransaction({ mode: "terraria_clock", params: {...} })
  ↓ WebSocket 文本帧
ESP32 websocket_handler.cpp
  分发到 handleTerrariaCommand()
  ↓
websocket_command_handlers_terraria.cpp
  解析参数 → 创建 RuntimeCommand (type: TERRARIA_CONFIG)
  → enqueue 到 RuntimeCommandBus
  ↓
runtime_command_bus.cpp executeTerrariaConfig()
  保存配置到 NVS
  → switchToTargetMode(MODE_ANIMATION, "terraria_clock")
  ↓
runtime_mode_coordinator.cpp
  TerrariaClockEffect::applyConfig(cfg)
  → TerrariaClockEffect::isActive() = true
  ↓
main.cpp 主循环
  if (currentMode == MODE_ANIMATION && businessModeTag == "terraria_clock")
    TerrariaClockEffect::update()  // 推进动画 tick
    TerrariaClockEffect::render()  // 实际画到 LED 矩阵
```

## 文件清单 (总览)

### 新建

| 文件 | 用途 | 估计大小 |
|---|---|---|
| `include/terraria_mode_types.h` | TerrariaModeConfig 结构定义 | ~1 KB |
| `include/terraria_clock_effect.h` | 渲染器对外 API | ~0.5 KB |
| `src/terraria_clock_effect.cpp` | 渲染器实现 (16 step 合成 + 翅膀 + 守卫 + 时钟) | ~30 KB |
| `src/websocket_command_handlers_terraria.cpp` | WS 命令处理 | ~5 KB |
| `include/theme_assets/terraria/index.h` | sprite 主索引 | ~1 KB |
| `include/theme_assets/terraria/sprites_armor_heads.h` | 4 头甲像素 | ~12 KB |
| `include/theme_assets/terraria/sprites_armor_bodies.h` | 4 胸甲 6 网格位 | ~30 KB |
| `include/theme_assets/terraria/sprites_armor_legs.h` | 4 腿甲 | ~7 KB |
| `include/theme_assets/terraria/sprites_wings.h` | 4 翅膀 base + 3 deltas | ~110 KB |
| `include/theme_assets/terraria/sprites_weapons.h` | 8 武器 | ~50 KB |
| `include/theme_assets/terraria/sprites_player_layers.h` | 13 角色 sv=0 层 | ~14 KB |
| `include/theme_assets/terraria/sprites_guardian.h` | 守卫 base + 7 deltas | ~110 KB |
| `include/theme_assets/terraria/sprites_misc.h` | 草地 + 法师特效 | ~36 KB |
| `uniapp/tools/build-firmware-sprites.js` | sprite 转换脚本 | ~5 KB |

### 修改

| 文件 | 改动 |
|---|---|
| `include/mode_tags.h` | 加 `TERRARIA_CLOCK = "terraria_clock"` |
| `include/config_manager.h` | 加 `TerrariaModeConfig terrariaConfig` + load/save 函数 |
| `src/config_manager.cpp` | 实现 `loadTerrariaConfig() / saveTerrariaConfig()` + 默认值 |
| `include/runtime_command_bus.h` | 加 `TERRARIA_CONFIG` 枚举 + `terrariaConfig` 字段 |
| `src/runtime_command_bus.cpp` | 加 `executeTerrariaConfig()` + 派发逻辑 |
| `src/runtime_mode_coordinator.cpp` | businessModeTag == TERRARIA_CLOCK 分支调用 TerrariaClockEffect |
| `src/runtime_status_builder.cpp` | 状态查询返回 terraria 配置 |
| `src/websocket_handler.cpp` | 注册 handleTerrariaCommand |
| `include/websocket_command_handlers.h` | 声明 handleTerrariaCommand |
| `src/websocket_command_handlers_mode_switch.cpp` | mode == "terraria_clock" 分支 |
| `src/main.cpp` | 主循环 dispatch 调 TerrariaClockEffect::update + render |
| `uniapp/utils/webSocket.js` | 加 `applyTerrariaClockMode(config)` |
| `uniapp/pages/clock-editor/terraria-clock.vue` | sendToDevice 调用新 API |

不动:
- `theme_renderer.cpp` (跟 terraria 没关系)
- 现有时钟/字体相关 (terraria 有独立的)

## 模块设计

### 1. TerrariaModeConfig (`include/terraria_mode_types.h`)

```cpp
#ifndef TERRARIA_MODE_TYPES_H
#define TERRARIA_MODE_TYPES_H

#include <Arduino.h>

enum TerrariaCharacter : uint8_t {
  TERRARIA_CHAR_WARRIOR  = 0,  // 耀斑 Solar Flare
  TERRARIA_CHAR_RANGER   = 1,  // 星旋 Vortex
  TERRARIA_CHAR_MAGE     = 2,  // 星云 Nebula
  TERRARIA_CHAR_SUMMONER = 3,  // 星尘 Stardust
};

struct TerrariaModeConfig {
  // 角色 + 武器
  uint8_t character;        // TerrariaCharacter
  uint16_t weaponId;        // 来自固定 8 个 ID, 见 weapon_id_for_character()

  // 角色姿态
  uint8_t playerX;          // 0..63
  uint8_t playerY;          // 0..63
  uint8_t playerScale;      // 20..200 (百分比)

  // 召唤师守卫位置 (仅 character=SUMMONER 用)
  int8_t guardianX;         // -32..32
  int8_t guardianY;         // -32..32

  // 翅膀动画速度
  uint8_t wingSpeed;        // 0..200 (百分比, 50 = 默认)

  // 时钟设置 (terraria 独有)
  uint8_t fontId;           // ClockFontId (复用 clock_font_renderer.h 的字体表)
  uint8_t fontScale;        // 1..3
  uint8_t clockX;           // 0..63 (时钟中心)
  uint8_t clockY;           // 0..63
  uint8_t hourFormat;       // 12 or 24
  bool showSeconds;

  // 草膨胀边框 3 色
  uint8_t clockTextColor[3]; // RGB 字本体色 (默认 #d9cd82)
  uint8_t clockBgInner[3];   // RGB 内圈色 (默认 #63971f)
  uint8_t clockBgOuter[3];   // RGB 外圈色 (默认 #8FD71D)
};

#endif
```

**默认值** (在 `config_manager.cpp` 里):
- character = WARRIOR, weaponId = 4956 (天顶剑)
- playerX=32, playerY=43, playerScale=60
- guardianX=-29, guardianY=-6
- wingSpeed=50
- fontId=CLOCK_FONT_LCD_6X8, fontScale=1, clockX=32, clockY=6
- hourFormat=24, showSeconds=false
- clockTextColor=#d9cd82, clockBgInner=#63971f, clockBgOuter=#8FD71D

### 2. Sprite 数据格式 (PROGMEM)

每个 sprite 用紧凑二进制 (每像素 5 字节: x, y, r, g, b) 存 PROGMEM。

#### 单帧 sprite (头甲/腿甲/武器/草地/特效)

```cpp
// 例: include/theme_assets/terraria/sprites_armor_heads.h
#pragma once
#include <Arduino.h>
#include <pgmspace.h>

struct TerrariaSprite {
  uint16_t w, h;
  uint16_t pixelCount;
  const uint8_t* pixels;  // 5 字节/像素 (x, y, r, g, b), 大尺寸用 fmt7
  uint8_t fmt;            // 5 或 7
};

// 用 const uint8_t[] PROGMEM 存数据
const uint8_t kArmorHead171Pixels[] PROGMEM = { 6,8,200,44,18, 7,8,200,44,18, ... };
const TerrariaSprite kArmorHead171 PROGMEM = { 40, 56, 1234, kArmorHead171Pixels, 5 };

// 4 头甲索引
extern const TerrariaSprite kArmorHeads[4];  // 169/170/171/189
```

#### 网格 sprite (胸甲 6 网格 / 角色 layer 5 网格)

```cpp
// 6 个网格位竖着拼成单 sprite, w=40 h=56*6=336
// uniapp 端按 _gridIndex 取对应位置
const uint8_t kArmorBody177Pixels[] PROGMEM = { ... };
const TerrariaSprite kArmorBody177 PROGMEM = { 40, 336, ..., 5 };
```

#### 多帧差异 sprite (翅膀 4 帧 / 守卫 8 帧)

```cpp
struct TerrariaFrameBlock {
  uint16_t pixelCount;
  const uint8_t* pixels;
};

struct TerrariaSpriteAnim {
  uint16_t w, h;
  uint8_t frameCount;     // 翅膀 4, 守卫 8
  TerrariaFrameBlock base;
  const TerrariaFrameBlock* deltas;  // frameCount-1 个
  uint8_t fmt;
};

const uint8_t kWings29BasePixels[] PROGMEM = { ... };
const uint8_t kWings29Delta1Pixels[] PROGMEM = { ... };
const uint8_t kWings29Delta2Pixels[] PROGMEM = { ... };
const uint8_t kWings29Delta3Pixels[] PROGMEM = { ... };

const TerrariaFrameBlock kWings29Deltas[] PROGMEM = {
  { 234, kWings29Delta1Pixels },
  { 245, kWings29Delta2Pixels },
  { 220, kWings29Delta3Pixels },
};

const TerrariaSpriteAnim kWings29 PROGMEM = {
  86, 62, 4,
  { 1234, kWings29BasePixels },
  kWings29Deltas,
  5,
};
```

### 3. 主索引 (`include/theme_assets/terraria/index.h`)

提供按"逻辑 sprite 名"快速查表的入口:

```cpp
#pragma once

#include "sprites_armor_heads.h"
#include "sprites_armor_bodies.h"
#include "sprites_armor_legs.h"
#include "sprites_wings.h"
#include "sprites_weapons.h"
#include "sprites_player_layers.h"
#include "sprites_guardian.h"
#include "sprites_misc.h"

namespace TerrariaSprites {
  // 按 ID 查 (内部用 switch 实现, 编译器优化成跳表)
  const TerrariaSprite* getArmorHead(uint16_t id);    // 169/170/171/189
  const TerrariaSprite* getArmorBody(uint16_t id);    // 175/176/177/190
  const TerrariaSprite* getArmorLegs(uint16_t id);    // 110/111/112/130
  const TerrariaSpriteAnim* getWings(uint16_t id);    // 29/30/31/32
  const TerrariaSprite* getWeapon(uint16_t id);       // 4956/3065/...
  const TerrariaSprite* getPlayerLayer(uint8_t layer); // 0..15
  const TerrariaSpriteAnim* getGuardian();            // projectile_623

  const TerrariaSprite* getBiomeForest(uint8_t idx);  // 0/1/2
  const TerrariaSprite* getDust242();
  const TerrariaSprite* getExtra171();

  // 网格位枚举 (跟 uniapp _gridIndex 对齐)
  enum GridPos {
    GRID_TORSO = 0,
    GRID_BACK_ARM = 1,
    GRID_BACK_SHOULDER = 2,
    GRID_FRONT_ARM = 3,
    GRID_FRONT_SHOULDER = 4,
    GRID_BACK_ARM_HOLDING = 5,  // 仅胸甲有
  };

  // 网格层 layer 标记 (uniapp _gridLayers)
  bool isPlayerGridLayer(uint8_t layer);  // [3,4,5,6,7,8,9,13]
}
```

### 4. 渲染器 (`include/terraria_clock_effect.h`)

```cpp
#ifndef TERRARIA_CLOCK_EFFECT_H
#define TERRARIA_CLOCK_EFFECT_H

#include <Arduino.h>
#include <ESP32-HUB75-MatrixPanel-I2S-DMA.h>
#include "terraria_mode_types.h"

namespace TerrariaClockEffect {
  void init();
  void deactivate();
  void applyConfig(const TerrariaModeConfig& config);
  void update();   // 每帧调用, 推进 animTick
  void render();   // 实际画到 display
  bool isActive();
  const TerrariaModeConfig& getConfig();
  const char* getLastError();
}

#endif
```

`src/terraria_clock_effect.cpp` 内部实现要点:

#### 4.1 渲染流水线 (跟 uniapp renderer.js 一一对应)

```cpp
void render() {
  if (!s_active) return;
  auto* display = DisplayManager::getMatrix();

  // 1. 背景: 渐变天空 + 3 朵手画云 + 草地 (3 块循环)
  drawSky(display);
  drawClouds(display);
  drawGround(display);

  // 2. 召唤师守卫 (仅 SUMMONER, 在角色身后)
  if (s_config.character == TERRARIA_CHAR_SUMMONER) {
    drawGuardian(display);
  }

  // 3. 角色 16 step 合成
  drawPlayer(display);

  // 4. 时钟 (草膨胀边框)
  drawClockWithBorder(display);
}
```

#### 4.2 关键函数

```cpp
// 把 PROGMEM 像素列表的某一帧画到 display, 中心对齐
void drawSpritePixelsCentered(MatrixPanel_I2S_DMA* display,
                              const uint8_t* pixels, uint16_t pixelCount, uint8_t fmt,
                              uint16_t spriteW, uint16_t spriteH,
                              float centerX, float centerY, float scale,
                              const uint8_t tintColor[3] = nullptr);

// 多帧差异 sprite: base + delta 合成时机 = 每像素绘制时直接读 PROGMEM (不预合成)
//   先画 base 全部像素 -> 再画 delta 全部像素 (后者覆盖)
void drawSpriteAnimFrame(MatrixPanel_I2S_DMA* display,
                         const TerrariaSpriteAnim* anim,
                         uint8_t frameIndex,
                         float centerX, float centerY, float scale);

// 角色皮肤层着色 (lum × baseColor)
void drawSkinLayer(MatrixPanel_I2S_DMA* display,
                   uint8_t layer, GridPos gridPos, bool useGrid,
                   const uint8_t baseColor[3],
                   float cx, float cy, float scale);

// 16 step 角色合成 (照搬 uniapp renderTerrariaScene 中的 drawPlayer)
void drawPlayer(MatrixPanel_I2S_DMA* display);

// 守卫: 8 帧 idle, 9 tick/帧
void drawGuardian(MatrixPanel_I2S_DMA* display);

// 时钟: 调 clock_font_renderer 渲染字, 然后切比雪夫距离算法画 2 圈草膨胀边框
void drawClockWithBorder(MatrixPanel_I2S_DMA* display);
```

#### 4.3 动画 tick

```cpp
namespace {
  uint32_t s_animStartMs = 0;
  uint32_t s_animTick = 0;  // 自激活后的 tick 数 (60 tick/秒)
  TerrariaModeConfig s_config = {};
  bool s_active = false;
  const char* s_lastError = nullptr;
}

void update() {
  if (!s_active) return;
  uint32_t now = millis();
  uint32_t elapsed = now - s_animStartMs;
  s_animTick = (uint32_t)(elapsed * 60 / 1000);  // 60 tick/秒
}

// render 内部用 s_animTick 推算翅膀帧 / 守卫帧 / 守卫浮动
//   翅膀: frame = (s_animTick * wingSpeed/100 / 5) % 3, base + delta[frame] 画
//   守卫 idle: frame = (s_animTick / 9) % 8
//   守卫浮动: bobY = sin(s_animTick / 72.0 * 2 * PI) * 1.5
```

#### 4.4 PROGMEM 像素读取宏

```cpp
// 读 PROGMEM 5 字节像素
#define READ_PIX5(p, i) \
  uint8_t x = pgm_read_byte((p) + (i) * 5 + 0); \
  uint8_t y = pgm_read_byte((p) + (i) * 5 + 1); \
  uint8_t r = pgm_read_byte((p) + (i) * 5 + 2); \
  uint8_t g = pgm_read_byte((p) + (i) * 5 + 3); \
  uint8_t b = pgm_read_byte((p) + (i) * 5 + 4);

// 读 PROGMEM 7 字节像素 (大坐标)
#define READ_PIX7(p, i) \
  uint16_t x = pgm_read_byte((p) + (i) * 7 + 0) | (pgm_read_byte((p) + (i) * 7 + 1) << 8); \
  uint16_t y = pgm_read_byte((p) + (i) * 7 + 2) | (pgm_read_byte((p) + (i) * 7 + 3) << 8); \
  uint8_t r = pgm_read_byte((p) + (i) * 7 + 4); \
  uint8_t g = pgm_read_byte((p) + (i) * 7 + 5); \
  uint8_t b = pgm_read_byte((p) + (i) * 7 + 6);
```

#### 4.5 草膨胀边框算法

跟 uniapp `clockTerrariaBorder.js` 一致:
- 算字 mask 像素的边界框 + PAD=2 圈
- 对每个非 mask 像素算到最近 mask 的切比雪夫距离 (max|dx|, |dy|)
- 距离=1 画内圈色, 距离=2 画外圈色
- 字本体覆盖最上层

时钟字像素生成: 调用现有 `clock_font_renderer.cpp::drawClockText()` 的内部循环, 但**不直接画到 display, 而是先收集到一个 `bool mask[64*64]` 数组**, 然后边框算法算完再统一 setPixel.

### 5. WS 命令处理

#### 5.1 mode_tags.h 加常量

```cpp
static constexpr const char* TERRARIA_CLOCK = "terraria_clock";
```

#### 5.2 RuntimeCommandBus 加 type + 字段

`include/runtime_command_bus.h`:
```cpp
enum class RuntimeCommandType : uint8_t {
  NONE = 0,
  MODE_SWITCH = 1,
  THEME_CONFIG = 2,
  // ...
  TERRARIA_CONFIG = 14,  // 新增 (用现有 enum 后面的空值)
};

struct RuntimeCommand {
  // ...
  TerrariaModeConfig terrariaConfig;
  // ...
};
```

`src/runtime_command_bus.cpp` 加:
```cpp
bool executeTerrariaConfig(
  const RuntimeCommand& command,
  StaticJsonDocument<768>& response
) {
  TerrariaModeConfig previousConfig = ConfigManager::terrariaConfig;
  RuntimeModeCoordinator::deactivateRuntimeContent();
  if (DisplayManager::currentMode != MODE_ANIMATION) {
    DisplayManager::clearScreen();
  }
  ConfigManager::terrariaConfig = command.terrariaConfig;

  if (!RuntimeModeCoordinator::switchToMode(
        DisplayManager::currentMode,
        MODE_ANIMATION,
        ModeTags::TERRARIA_CLOCK,
        true,
        activationError, sizeof(activationError)
      )) {
    ConfigManager::terrariaConfig = previousConfig;
    RuntimeModeCoordinator::restoreCurrentModeFrame();
    setErrorResponse(response, activationError);
    return true;
  }

  ConfigManager::saveTerrariaConfig();
  response["message"] = "terraria mode started";
  // 把当前 config 字段塞 response (跟 maze 一致, 给 client 确认)
  response["character"] = command.terrariaConfig.character;
  response["weaponId"] = command.terrariaConfig.weaponId;
  // ... 其他字段
  return true;
}
```

dispatch 加 `case TERRARIA_CONFIG: return executeTerrariaConfig(...);`.

#### 5.3 WS handler

`src/websocket_command_handlers_terraria.cpp` (新建):

```cpp
bool WebSocketCommandHandlers::handleTerrariaCommand(
  AsyncWebSocketClient* client,
  JsonDocument& doc,
  StaticJsonDocument<768>& response,
  bool& responseSent
) {
  String cmd = doc["cmd"].as<String>();
  if (cmd != "set_terraria_config") return false;

  // 校验必需字段
  if (!doc.containsKey("character") || !doc.containsKey("weaponId") ||
      !doc.containsKey("playerX") || !doc.containsKey("playerY") ||
      !doc.containsKey("playerScale")) {
    setErrorResponse(response, "missing terraria config fields");
    return true;
  }

  RuntimeCommandBus::RuntimeCommand* command =
    RuntimeCommandBus::createCommand(...);
  command->type = TERRARIA_CONFIG;
  command->targetMode = MODE_ANIMATION;
  command->businessModeTag = ModeTags::TERRARIA_CLOCK;

  // 解析每个字段填入 command->terrariaConfig
  command->terrariaConfig.character = parseCharacter(doc["character"]);
  command->terrariaConfig.weaponId = doc["weaponId"];
  command->terrariaConfig.playerX = constrain(doc["playerX"], 0, 63);
  // ... 全部字段

  if (!RuntimeCommandBus::enqueue(command)) {
    RuntimeCommandBus::destroyCommand(command);
    setErrorResponse(response, "device busy");
    return true;
  }
  return wsSendAcceptedResponse(client, response, responseSent);
}
```

注册到 `websocket_handler.cpp` 的 handler 链:
```cpp
WebSocketCommandHandlers::handleClockCommand(client, doc, response) ||
WebSocketCommandHandlers::handleThemeCommand(client, doc, response, responseSent) ||
WebSocketCommandHandlers::handleTerrariaCommand(client, doc, response, responseSent) ||  // 新增
// ...
```

#### 5.4 mode_switch handler

加分支:
```cpp
} else if (mode == ModeTags::TERRARIA_CLOCK) {
  command->targetMode = MODE_ANIMATION;
  command->businessModeTag = ModeTags::TERRARIA_CLOCK;
  command->successMessage = "terraria mode started";
}
```

### 6. ConfigManager 改动

`include/config_manager.h`:
```cpp
#include "terraria_mode_types.h"

class ConfigManager {
public:
  // ...
  static void loadTerrariaConfig();
  static void saveTerrariaConfig();
  // ...
  static TerrariaModeConfig terrariaConfig;
};
```

`src/config_manager.cpp`:
```cpp
TerrariaModeConfig ConfigManager::terrariaConfig = {
  .character = TERRARIA_CHAR_WARRIOR,
  .weaponId = 4956,
  .playerX = 32, .playerY = 43, .playerScale = 60,
  .guardianX = -29, .guardianY = -6,
  .wingSpeed = 50,
  .fontId = CLOCK_FONT_LCD_6X8, .fontScale = 1,
  .clockX = 32, .clockY = 6,
  .hourFormat = 24, .showSeconds = false,
  .clockTextColor = {0x5A, 0x4A, 0x3A},
  .clockBgInner = {0x63, 0x97, 0x1F},
  .clockBgOuter = {0x8F, 0xD7, 0x1D},
};

void ConfigManager::loadTerrariaConfig() {
  preferences.begin("terraria", true);
  size_t configSize = preferences.getBytesLength("config");
  if (configSize == sizeof(TerrariaModeConfig)) {
    preferences.getBytes("config", &terrariaConfig, sizeof(TerrariaModeConfig));
  }
  // size 不对 = 默认值 (上面初始化的)
  preferences.end();
}

void ConfigManager::saveTerrariaConfig() {
  preferences.begin("terraria", false);
  preferences.putBytes("config", &terrariaConfig, sizeof(TerrariaModeConfig));
  preferences.end();
}
```

`init()` 里加 `loadTerrariaConfig()`. `resetToDefault()` 里恢复默认.

### 7. main.cpp 主循环

加分支:
```cpp
} else if (DisplayManager::currentMode == MODE_ANIMATION) {
  if (DisplayManager::currentBusinessModeTag == ModeTags::MAZE && ...) {
    // 现有 maze
  } else if (DisplayManager::currentBusinessModeTag == ModeTags::SNAKE && ...) {
    // 现有 snake
  } else if (DisplayManager::currentBusinessModeTag == ModeTags::TERRARIA_CLOCK &&
             TerrariaClockEffect::isActive()) {
    TerrariaClockEffect::update();
    TerrariaClockEffect::render();
  } else if (...) {
    // 其他
  }
}
```

### 8. 转换脚本 `uniapp/tools/build-firmware-sprites.js`

输入: `uniapp/static/terraria/*.js` (8 个 base64 压缩文件)
输出: `esp32-firmware/include/theme_assets/terraria/sprites_*.h`

伪代码:
```js
// 读 8 个 .js
// 解码每个 sprite: base64 -> Uint8Array (5 或 7 字节/像素)
// 输出每个 sprite 一个 const uint8_t[] PROGMEM = { 字节序列 };
// 输出 wrapper struct const TerrariaSprite kArmorHead171 PROGMEM = { w, h, n, ptr, fmt };
// 输出索引 kArmorHeads[] / kWings[] / ... 用于 getXxx() 函数 switch 跳表
```

直接 Node 跑, 一次性产出.

## 资源占用估算

### Firmware 增大

| 资产 | base64 大小 | 解码后二进制 | 字符串化 PROGMEM |
|---|---|---|---|
| armor_heads | 11 KB | ~8 KB | ~12 KB (含 `0x` 前缀和逗号) |
| armor_bodies | 27 KB | ~20 KB | ~30 KB |
| armor_legs | 6 KB | ~4 KB | ~7 KB |
| wings | 99 KB | ~74 KB | ~110 KB |
| weapons | 44 KB | ~33 KB | ~50 KB |
| player_layers | 13 KB | ~10 KB | ~14 KB |
| guardian | 98 KB | ~74 KB | ~110 KB |
| misc | 32 KB | ~24 KB | ~36 KB |
| **合计** | **329 KB** | **~247 KB** | **~370 KB** |

C 字面量数组 PROGMEM 写法每个字节大概 ~5 字符 (`0x33,`), 编译器优化后实际占 flash ~247 KB.

firmware.bin 当前 1.44 MB → 加完后约 **1.69 MB**, 距离 app0 上限 3.875 MB 还有 2.18 MB 余量.

### 渲染逻辑代码

`terraria_clock_effect.cpp` ~30 KB 源码 → 编译后 ~50-80 KB 二进制.

### RAM 占用

- 1 个 `bool mask[64*64] = 4 KB` (时钟边框临时)
- TerrariaModeConfig 结构 ~30 字节
- 无大缓冲, 全部直接 PROGMEM → display

**RAM 增量约 5 KB, ESP32 SRAM 余量充足**.

## 性能估算

每帧渲染像素操作:
- 背景: 64*64 = 4096 setPixel (天空) + ~15 云像素 + ~50 草地像素
- 角色 16 step: 每 step 平均 200 像素 × 16 = 3200 setPixel
- 翅膀 base+delta: ~1500 像素
- 守卫: ~600 像素 (仅 SUMMONER)
- 时钟字: ~30 像素 + 边框 ~80 像素

**单帧总 setPixel ~10000 次**.

ESP32 240 MHz, drawPixelRGB888 ~1 µs → 每帧 ~10 ms.

刷新间隔目标 60 ms (~16 FPS), 翅膀 250 ms 周期可见 4 帧, 守卫 idle 1.2 秒可见 8 帧, 视觉流畅.

## 边界 / 风险

1. **PROGMEM 大数组编译时间**: 247 KB 的字面量数组 PlatformIO 编译可能慢 30-60 秒. 接受.
2. **网格 sprite 切片**: 板载渲染要从大网格中按 (col, row) 取像素. PROGMEM 顺序遍历 + 范围过滤即可, 不预切.
3. **着色性能**: 角色皮肤层每像素要算 `lum * baseColor`, 浮点除法慢. 用整数定点近似 `(r+g+b)*baseColor[c]/(3*255)` -> 用 `(r+g+b) >> 1.5` 等位移加速.
4. **守卫差异帧**: base 8 帧合成时, 每帧 = base + delta. 渲染顺序: 先画 base 整张, 再画当前 delta 整张 (delta 像素覆盖 base). 但 delta 通常不"删除"像素只"修改" — 我们 uniapp 端是这样做的, 板载保持一致.
5. **小程序到板载默认值兼容**: 用户第一次进入 terraria 模式时 NVS 没数据, 走结构内默认值, 跟 uniapp `data.config.terraria` 对齐.

## 验收

1. uniapp 切换到 terraria_clock 模式 → 板子 ACK 成功
2. 板子真实显示: 战士 + 天顶剑 + Solar 翅膀扇动 + 时钟 (lcd_6x8 字体 + 草膨胀边框)
3. 切换 4 职业, 板子立即更新对应套装
4. 召唤师额外显示星尘守卫 idle 浮动
5. 法师切到 NebulaBlaze 武器时, 手部光团特效 (这部分如果板载实现复杂可暂砍)
6. 调角色位置 / 守卫位置滑块, 板子实时更新
7. 调时钟字体 / 颜色, 板子立即生效
8. 重启板子后, terraria 配置从 NVS 恢复

## 不做 (本期范围外)

- ❌ 法师棱镜光束 / Empress 翅膀彩虹特效 (太复杂, 后期可加)
- ❌ 翅膀特殊形态 (Hoverboard / Lazure / Jim 等) — 我们只用 4 个 Lunar 翅膀, 简化版即可
- ❌ Stardust Glow / Nebula Extra / Solar Glow 翅膀脉冲发光层 (uniapp 端实际未呈现, 板载本期同步省略)
- ❌ 多群系背景 / 坐骑 / 性别切换 — 跟 uniapp 一样, 已删
- ❌ 板载升级时的 PROGMEM 数据热替换 — 改 sprite 必须重编 firmware

## 做 (本期范围内 - 特效细化)

- ✅ **法师 NebulaBlaze (3542) 手部光团**: 把武器图隐藏, 手部位置画 `dust_242_f0` sprite + 1px 抖动 (uniapp 已实现, 板载照搬)

## 实施顺序 (待 tasks.md 拆细)

1. 写 sprite 转换脚本 `build-firmware-sprites.js`, 跑一次产出 8 个 .h 文件
2. 加 `mode_tags.h` 常量 + `terraria_mode_types.h` + ConfigManager
3. 加 RuntimeCommandBus type + executeTerrariaConfig
4. 加 WS handler `websocket_command_handlers_terraria.cpp` + 注册到 chain
5. 加 mode_switch 分支
6. 加 mode_coordinator 分支 + main.cpp dispatch
7. 写 `terraria_clock_effect.cpp` 渲染器骨架 (空实现, 让 build 先通)
8. 实现 drawSky / drawClouds / drawGround
9. 实现 drawPlayer 16 step + 翅膀 + 武器
10. 实现 drawGuardian
11. 实现 drawClockWithBorder (草膨胀)
12. uniapp 端 webSocket.js 加 applyTerrariaClockMode
13. uniapp 端 sendToDevice 改成发新命令
14. 真机联调
