# Technical Design: 泰拉瑞亚时钟自动轮播

## Overview

在现有泰拉瑞亚时钟模式基础上，增加自动轮播引擎。uniapp 配置轮播策略后一次性下发到 ESP32，板载独立执行定时切换逻辑。支持两种模式：元素独立随机 和 组合轮播。

## Architecture

```
┌─────────────────────────────────────────────────┐
│  uniapp (terraria-clock.vue)                    │
│  ┌───────────────────────────────────────────┐  │
│  │  Tab "轮播" (Rotate_Config_Page)          │  │
│  │  - 模式切换: 元素随机 / 组合轮播          │  │
│  │  - 元素策略: 5行 × (fixed/random/seq)     │  │
│  │  - 组合列表: 收藏/删除                    │  │
│  │  - 间隔设置: 预设 + 自定义                │  │
│  └───────────────────────────────────────────┘  │
│                    │ sendToDevice()              │
│                    ▼                             │
│  startTerrariaClock({ ...config, autoRotate })   │
└─────────────────────────────────────────────────┘
                     │ WebSocket
                     ▼
┌─────────────────────────────────────────────────┐
│  ESP32 (terraria_clock_effect.cpp)              │
│  ┌───────────────────────────────────────────┐  │
│  │  Auto_Rotate_Engine (新模块)              │  │
│  │  - parseRotateConfig(): 解析 WS 参数      │  │
│  │  - tick(): 每帧检查是否到切换时间         │  │
│  │  - nextElement(): 按策略选下一个值        │  │
│  │  - applyRotation(): 修改 s_config 并重绘  │  │
│  │  - persist/restore: Flash 持久化          │  │
│  └───────────────────────────────────────────┘  │
│                    │                             │
│                    ▼                             │
│  buildFrame() → 用更新后的 s_config 渲染        │
└─────────────────────────────────────────────────┘
```

## Data Models

### 1. uniapp 侧 (terraria-clock.vue data)

```javascript
// config.terraria.autoRotate
autoRotate: {
  enabled: false,           // 总开关
  mode: 'element',          // 'element' | 'combo'
  interval: 60,             // 切换间隔(秒), 10~3600
  strategies: {
    armor:  'fixed',        // 'fixed' | 'random' | 'sequential'
    weapon: 'fixed',
    wing:   'fixed',
    biome:  'fixed',
    boss:   'fixed',
  },
  combos: [],               // Preset_Combo[], 最多20个
  comboStrategy: 'random',  // 组合轮播策略: 'random' | 'sequential'
}

// Preset_Combo 结构
{
  name: '耀斑战士',         // 显示名(自动取套装名)
  characterId: 'warrior',
  weaponId: 4956,
  wingId: 29,
  biome: 'forest',
  bossId: 'king_slime',
}
```

### 2. WS 协议扩展 (startTerrariaClock params)

```json
{
  "character": "warrior",
  "weaponId": 4956,
  ...现有字段不变...,
  "autoRotate": {
    "enabled": true,
    "mode": "element",
    "interval": 60,
    "strategies": {
      "armor": 1,
      "weapon": 1,
      "wing": 1,
      "biome": 0,
      "boss": 0
    },
    "combos": [
      { "char": 0, "weapon": 4956, "wing": 29, "biome": 0, "boss": 0 },
      { "char": 3, "weapon": 3531, "wing": 32, "biome": 3, "boss": 18 }
    ],
    "comboStrategy": 1
  }
}
```

策略值编码: 0=fixed, 1=random, 2=sequential

间隔值编码: 实际秒数 (30/60/300/600/1800/3600)，板载按真实时钟对齐切换时刻

### 3. 板载数据结构 (terraria_mode_types.h)

```cpp
// 轮播策略枚举
enum RotateStrategy : uint8_t {
  ROTATE_FIXED      = 0,
  ROTATE_RANDOM     = 1,
  ROTATE_SEQUENTIAL = 2,
};

// 轮播模式枚举
enum RotateMode : uint8_t {
  ROTATE_MODE_ELEMENT = 0,  // 元素独立随机
  ROTATE_MODE_COMBO   = 1,  // 组合轮播
};

// 收藏组合 (紧凑格式, 每个 8 字节)
struct RotateCombo {
  uint8_t  character;    // 0~14
  uint16_t weaponId;     // 武器ID
  uint8_t  wingId;       // 翅膀ID (0~49)
  uint8_t  biome;        // 0~9
  uint8_t  bossId;       // 0~32
  uint8_t  reserved[2];  // 对齐填充
};  // = 8 bytes

// 轮播配置 (总计 ~200 字节)
struct RotateConfig {
  bool enabled;                    // 总开关
  RotateMode mode;                 // element / combo
  uint16_t interval;               // 切换间隔(秒)
  RotateStrategy armorStrategy;
  RotateStrategy weaponStrategy;
  RotateStrategy wingStrategy;
  RotateStrategy biomeStrategy;
  RotateStrategy bossStrategy;
  RotateStrategy comboStrategy;    // 组合轮播策略
  uint8_t comboCount;              // 组合数量 (0~20)
  RotateCombo combos[20];          // 160 bytes
};  // 总计 ~172 bytes
```

### 4. 板载运行时状态

```cpp
struct RotateState {
  uint32_t lastRotateMs;           // 上次切换时间
  uint8_t  armorSeqIdx;            // 顺序模式当前索引
  uint8_t  biomeSeqIdx;
  uint8_t  bossSeqIdx;
  uint8_t  comboSeqIdx;
  uint8_t  lastArmorIdx;           // 随机模式上次值(避免连续重复)
  uint8_t  lastBossIdx;
};  // ~12 bytes
```

## Component Design

### 1. uniapp: 轮播配置 Tab

**位置**: 底部 tabs 新增第 5 个 tab "轮播" (icon: `refresh`)

**UI 结构**:
```
┌─────────────────────────────────┐
│  [总开关: 自动轮播]  ON/OFF     │
├─────────────────────────────────┤
│  模式: [元素随机] [组合轮播]    │
├─────────────────────────────────┤
│  (元素随机模式时显示)           │
│  盔甲  [固定 ▼] [随机 ▼] [顺序]│
│  武器  [固定 ▼] [随机 ▼] [顺序]│
│  翅膀  [固定 ▼] [随机 ▼] [顺序]│
│  地形  [固定 ▼] [随机 ▼] [顺序]│
│  Boss  [固定 ▼] [随机 ▼] [顺序]│
├─────────────────────────────────┤
│  (组合轮播模式时显示)           │
│  [+ 收藏当前配置]               │
│  ┌─ 耀斑战士 ──────── [删除] ┐ │
│  ├─ 星尘召唤 ──────── [删除] ┤ │
│  └─ 冰霜混合 ──────── [删除] ┘ │
│  切换方式: [随机] [顺序]        │
├─────────────────────────────────┤
│  切换间隔: [30秒] [1分] [5分]   │
│            [10分] [30分] [1小时] │
└─────────────────────────────────┘
```

### 2. 板载: Auto_Rotate_Engine

**文件**: `esp32-firmware/src/terraria_auto_rotate.cpp` + `.h`

**核心逻辑**:
```cpp
namespace TerrariaAutoRotate {
  void init();
  void applyConfig(const RotateConfig& cfg);
  void tick(uint32_t nowMs);  // 每帧调用, 检查是否到切换时间
  void saveToFlash();
  void loadFromFlash();
}
```

**tick() 流程**:
1. 检查 `enabled` 是否为 true
2. 获取当前 RTC 时间 (tm_hour, tm_min, tm_sec)
3. 根据 interval 判断是否到达切换时刻:
   - 30秒: tm_sec == 0 || tm_sec == 30
   - 1分钟: tm_sec == 0
   - 5分钟: tm_sec == 0 && tm_min % 5 == 0
   - 10分钟: tm_sec == 0 && tm_min % 10 == 0
   - 30分钟: tm_sec == 0 && tm_min % 30 == 0
   - 1小时: tm_sec == 0 && tm_min == 0
4. 如果到达切换时刻且跟上次切换不是同一时刻:
   - mode=element: 对每个非 fixed 的元素执行 nextElement()
   - mode=combo: 从 combos[] 取下一个组合
5. 修改 `s_config` 对应字段
6. 触发 `s_lastFrameValid = false` 强制重绘
7. 记录本次切换的时间戳(防止同一秒重复触发)

**nextElement() 逻辑**:
- random: `esp_random() % count`, 如果跟上次相同则 +1
- sequential: `(currentIdx + 1) % count`
- 推荐搭配: armor 变化时, 如果 weapon/wing 也是 random, 从 kCharSets[newArmor] 的推荐列表取

### 3. WS 协议解析

**位置**: `runtime_command_bus.cpp` 的 startTerrariaClock handler

**新增解析**:
```cpp
if (params.containsKey("autoRotate")) {
  JsonObject ar = params["autoRotate"];
  rotateConfig.enabled = ar["enabled"] | false;
  rotateConfig.mode = ar["mode"] | 0;
  rotateConfig.interval = ar["interval"] | 60;
  // ... 解析 strategies 和 combos
}
```

### 4. Flash 持久化

**位置**: `config_manager.cpp`

**存储**: 使用 Preferences 库, namespace "terraria_rotate"
- key "cfg": RotateConfig 结构体二进制 (~172 bytes)
- 设备重启时 loadFromFlash() 恢复

## Memory Budget

| 组件 | RAM | Flash |
|------|-----|-------|
| RotateConfig 结构 | 172 B | 0 |
| RotateState 运行时 | 12 B | 0 |
| 代码 (.text) | 0 | ~2 KB |
| Preferences 缓冲 | ~200 B | 172 B |
| **总计** | **~384 B** | **~2.2 KB** |

远低于 2KB RAM 限制。

## Sequence Diagram

```
用户操作                    uniapp                      ESP32
  │                          │                           │
  ├─ 配置轮播策略 ──────────►│                           │
  │                          │                           │
  ├─ 点击"发送" ────────────►│                           │
  │                          ├─ startTerrariaClock ─────►│
  │                          │   (含 autoRotate 字段)    │
  │                          │                           ├─ parseRotateConfig()
  │                          │                           ├─ saveToFlash()
  │                          │◄─ success ────────────────┤
  │                          │                           │
  │  (断开连接)              │                           │
  │                          │                           ├─ tick() 每帧检查
  │                          │                           │   interval 到达?
  │                          │                           │     ├─ nextElement()
  │                          │                           │     ├─ 修改 s_config
  │                          │                           │     └─ 重绘 buildFrame()
  │                          │                           │
  │  (设备重启)              │                           │
  │                          │                           ├─ loadFromFlash()
  │                          │                           ├─ 恢复轮播状态
  │                          │                           └─ 继续 tick()
```

## File Changes Summary

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `uniapp/pages/clock-editor/terraria-clock.vue` | 修改 | 新增轮播 Tab UI + data + methods |
| `esp32-firmware/include/terraria_mode_types.h` | 修改 | 新增 RotateConfig/RotateCombo/RotateState 结构 |
| `esp32-firmware/src/terraria_auto_rotate.cpp` | 新建 | 轮播引擎实现 |
| `esp32-firmware/include/terraria_auto_rotate.h` | 新建 | 轮播引擎头文件 |
| `esp32-firmware/src/terraria_clock_effect.cpp` | 修改 | render() 前调用 AutoRotate::tick() |
| `esp32-firmware/src/runtime_command_bus.cpp` | 修改 | 解析 autoRotate WS 参数 |
| `esp32-firmware/src/config_manager.cpp` | 修改 | 持久化 RotateConfig |
