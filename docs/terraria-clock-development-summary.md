# 泰拉瑞亚时钟主题开发总结

> 时间:2025 年 11 月  
> 范围:从 Terraria 1.4.5.6 反编译 / 资产提取到 ESP32 板载渲染 + uniapp 端预览的完整链路

这是一次"用反编译游戏资产 + 自实现像素合成"的端到端项目。这份文档把过程中可复用的方法论沉淀下来,后续再做类似项目(比如真做 Pokemon / Kamen Rider 主题)直接套。

---

## 1. 总体路线(从 0 到能在屏上跑)

```
   ┌── 阶段 1: 拿到游戏资产
   │   反编译 + 资产解包 → 14998 张 PNG + 1688 个 .cs 源码
   │
   ↓
   ┌── 阶段 2: 理解游戏渲染
   │   读源码 ➜ 角色 16 step 合成顺序 / 网格切片规则 / 翅膀挂载点 / 守卫帧组织
   │   写 HTML/JS 调试页(参考实现)边写边验证
   │
   ↓
   ┌── 阶段 3: 资产精简 + 转换
   │   PNG → 自定义紧凑像素格式
   │   多帧动画 → base + delta 差异帧
   │   反复压缩多次:4.2 MB → 1.32 MB → 477 KB → 328 KB
   │
   ↓
   ┌── 阶段 4: uniapp 端预览
   │   实现 sprite 加载 / 角色合成 / 翅膀动画 / 守卫 idle / 时钟边框
   │   发送的是参数,不是像素
   │
   ↓
   ┌── 阶段 5: ESP32 板载实现
   │   资产编进 firmware (PROGMEM)
   │   板载用同一套渲染算法独立实现
   │   uniapp 通过 WS 只发参数,板载自渲染
```

---

## 2. 阶段 1:反编译 / 资产提取

### 2.1 工具链(都收在 `Pokemon\terraria-clock-preview\terraria-glowxel-1456\`)
- **ilspycmd** —— .NET 反编译命令行(产出 `_src_1456/*.cs`)
- **TConvert-1.0.2.1.exe** —— Terraria XNB 资产解包(产出 `_extract_1456/*.png`)
- **官方 Steam Terraria.exe** —— 反编译源(必须本机有正版 / depots 拿)

### 2.2 命令模板
```bash
# 1) 反编译 .NET dll → C# 源码
ilspycmd Terraria.exe -o ./_src_1456 --project

# 2) 解包 XNB → PNG
TConvert-1.0.2.1.exe extract ./Terraria-v1.4.5.6/Content ./_extract_1456
```

### 2.3 关键产出(给后续阶段用)
- `_src_1456/Terraria/Player.cs::DrawPlayer*` 系列 —— **角色合成 16 step 的顺序**(决定哪一层先画哪一层后画)
- `_extract_1456/Images/Armor_Head_*.png` / `Armor_Body_*.png` / `Armor_Legs_*.png` —— **装备 sprite 网格**(9×4 切片)
- `_extract_1456/Images/Wings_*.png` —— **翅膀动画**(3 帧)
- `_extract_1456/Images/Item_*.png` —— **武器**
- `_src_1456/Terraria/Items.cs` —— **武器属性**(useStyle / 持握偏移 / 旋转角度)

### 2.4 经验教训
1. **不要直接搬 PNG 进固件**。PNG 是压缩格式,板上没 PNG decoder。
2. **官方资产体积巨大**(原始 1.45 GB),先在 PC 端反编译/解包,**编译产物 (PNG)** 才进项目处理。
3. **反编译产物只是参考资料**,不要 commit 进主仓库,放独立的实验区(我们放在 `D:\project\Pokemon\terraria-clock-preview\`)。

---

## 3. 阶段 2:读源码理解渲染

### 3.1 角色 16 step 合成(关键发现)

`Player.cs::DrawPlayer_xx_*` 系列函数定义了角色逐层叠加顺序:

```
1.  后臂皮肤(layer 5)        — 染 SKIN
2.  后臂内衬(layer 8 子集)
3.  后臂上衣袖(layer 13 子集)
4.  后臂装甲(armor body grid 1)
5.  后肩装甲(armor body grid 2)
6.  翅膀(挂载在角色 sprite 中心 + (-9, +9))
7.  腿/裤皮肤(layer 10)
8.  裤子(layer 11)
9.  鞋子(layer 12)
10. 护腿装甲(armor legs)
11. 躯干皮肤(layer 3)
12. 躯干内衬(layer 4)
13. 躯干上衣(layer 6)
14. 躯干装甲(armor body grid 0)
15. 头/眼/眼珠(layer 0/1/2,眼白不染色)
16. 头甲(持械时下移 2px)
17. 头发(Lunar 全包式头甲跳过)
18. 武器(useStyle=1 摆动 / useStyle=5 水平,有的旋转 90°)
19. 前臂皮肤 + 内衬 + 上衣袖 + 前臂装甲(grid 3) + 前肩装甲(grid 4)
20. 武器光团(法师 NebulaBlaze 3542 用 dust_242)
```

**踩过的坑**:不是简单"前面画背、后面画身",身体被前臂 / 后臂分开两次画,且每张装甲 sprite 是 9×4 网格不是单帧。

### 3.2 装备 sprite 网格(关键发现)

`Armor_Body_*.png` 是 6 段网格图(高度方向),每段 56px:

```
gridIndex 0: 躯干主体(包括前臂装甲)
gridIndex 1: 后臂装甲
gridIndex 2: 后肩装甲
gridIndex 3: 前臂装甲
gridIndex 4: 前肩装甲
gridIndex 5: 持械时后臂(我们没用,跟 grid 1 重叠)
```

### 3.3 翅膀挂载点(关键发现)

```
翅膀中心 = 角色 sprite 中心 + (-9 * dir, +9)
```

`-9` 是源码里 `num2 - 9`(num2 = 0,因为方向 dir=1)。

### 3.4 守卫(召唤师专属)

NPC 623 (Stardust Guardian) 是 8 帧 idle 循环,每帧 9 tick = 0.15s,垂直方向加 1.5px sin 波浮动。

---

## 4. 阶段 3:资产格式与压缩(★ 重点)

### 4.1 容量约束

ESP32 app0 分区上限 3.875 MB,主代码占 1.4 MB,剩 ≈ 2.4 MB。

我们目标:**总资产压到 < 500 KB**。

### 4.2 演进过程

| 阶段 | 大小 | 措施 |
|---|---|---|
| 原始 PNG | 4.2 MB | 啥也没做 |
| 散 .js 文件 | 4.2 MB / 46 个文件 | 直接写 JSON 数组 |
| 合并 .js | 1.32 MB / 8 个文件 | 一类资产一个文件 |
| 紧凑像素格式 | 477 KB | base64 / 5 字节每像素 |
| **+ 差异帧** | **328 KB** | base 帧 + 多个 delta 帧 |

### 4.3 紧凑像素格式

**fmt 5(小图,坐标 < 256)**:
```
每像素 5 字节: [x:1, y:1, r:1, g:1, b:1]
```

**fmt 7(大图,坐标 ≥ 256)**:
```
每像素 7 字节: [x_lo:1, x_hi:1, y_lo:1, y_hi:1, r:1, g:1, b:1]
```

**只存非透明像素**,sprite 大部分是透明的,稀疏率 70%-90%。

### 4.4 差异帧(适用于动画 sprite)

```
   base 帧 = 帧 0 全部像素
   delta 帧[N] = 帧 N 与帧 0 不同的像素
```

翅膀 / 守卫这种"局部小幅运动"差异帧特别省。例:8 帧守卫 sprite 全帧 ≈ 80 KB,base + 7 个 delta ≈ 16 KB。

### 4.5 板载侧渲染差异帧

```cpp
void drawSpriteAnimFrame(display, anim, frameIndex, ...) {
  // 1) 永远先画 base
  drawPixelsRange(display, anim->base.pixels, anim->base.pixelCount, ...);
  // 2) 再画当前帧的 delta(覆盖)
  if (frameIndex > 0) {
    drawPixelsRange(display, anim->deltas[frameIndex - 1].pixels, ...);
  }
}
```

---

## 5. 阶段 4:uniapp 端预览

### 5.1 模块拆分

```
uniapp/utils/
  terrariaSprites.js       — sprite 加载 / 切片 / 着色
  terrariaWings.js         — 翅膀动画
  terrariaRenderer.js      — 主渲染(13 step 合成)
  clockTerrariaBorder.js   — 草膨胀边框算法
```

每个模块都是 ES module + 纯函数,**不依赖 Vue**,方便单元测试。

### 5.2 微信小程序的限制(踩坑)

- **不能 require .json**。必须用 `module.exports = ...` 的 .js 包装。
- **不能 fetch 本地资源**。资产必须打包到 `static/` 目录通过 `require()` 同步加载。
- 加载脚本:`uniapp/tools/build-terraria-sprites.js`(Node 直接产出 .js 而不是 .json)

### 5.3 Vue 页面布局规则

- **功能配置页禁止用原生 `<slider>`**(项目硬约束)
- 用 `setting-item-row` + `control-btn (+/-)` 模式
- 字体 / 时间样式选择跟其他时钟模式共用 `ClockFontPanel` 组件

### 5.4 客户端只发参数,不发像素(★ 大原则)

```js
// 错(发像素 → 板上没事干 + 流量大)
await ws.sendImageData(rendered64x64Pixels);

// 对(发参数 → 板上自渲染)
await ws.startTerrariaClock({
  character: "warrior", weaponId: 4956,
  playerX: 32, playerY: 43, playerScale: 60,
  ...
});
```

---

## 6. 阶段 5:ESP32 板载实现

### 6.1 模块拆分(对应 §3.1 的 16 step)

```
esp32-firmware/
  include/
    terraria_mode_types.h               — TerrariaModeConfig 结构 + TerrariaCharacter 枚举
    terraria_clock_effect.h             — Effect 公共接口
    theme_assets/terraria/
      terraria_sprite_types.h           — TerrariaSprite / TerrariaSpriteAnim / TerrariaFrameBlock 类型
      sprites_armor_heads.h             — 4 个头甲(189/171/169/170)
      sprites_armor_bodies.h            — 4 个胸甲(190/177/175/176)
      sprites_armor_legs.h              — 4 个腿甲(130/112/110/111)
      sprites_wings.h                   — 4 个翅膀(29/30/31/32)+ delta 差异帧
      sprites_weapons.h                 — 8 把武器(4956/3065/3531/5005/3475/3540/3541/3542)
      sprites_player_layers.h           — 14 个 player layer(头/眼/躯干/腿/...)
      sprites_summon_guardian.h         — Stardust Guardian 8 帧 + delta
      sprites_misc.h                    — biome_forest / dust_242
      index.h                           — 公共导出
  src/
    terraria_clock_effect.cpp           — 渲染主体
```

### 6.2 PROGMEM 资产读取

```cpp
struct TerrariaSprite {
  uint16_t w, h;
  uint16_t pixelCount;
  uint8_t fmt;                  // 5 或 7
  const uint8_t* pixels;        // PROGMEM 指针
};

// 读单像素
uint8_t r = pgm_read_byte(p);
```

### 6.3 渲染状态(全部 static 全局)

```cpp
namespace {
  uint32_t s_animStartMs = 0;
  float s_animTimeSec = 0.0f;
  TerrariaModeConfig s_config = {};
  bool s_active = false;
  uint8_t s_clockMask[64 * 64];  // 用于草膨胀边框算法
}
```

**为什么 static 全局**:避免堆分配,避免渲染时碎片化。

### 6.4 草膨胀边框算法

```
1. 把字像素栅格化到 64×64 mask(rasterizeClockTextToMask)
2. 算 mask 的 bounding box,扩 PAD=2 圈
3. 对每个非 mask 像素,算到 mask 的"切比雪夫距离"(max(|dx|,|dy|))
4. 距离 = 1 → 画 clockBgInner(深绿)
   距离 = 2 → 画 clockBgOuter(亮绿)
5. 字本体最后用 clockTextColor 覆盖
```

跟泰拉瑞亚 Logo 草地边框视觉一致。

---

## 7. WS 协议接入(★ 这次踩的最大坑)

### 7.1 错误的接入方式(走了 2 小时弯路)

最初我在 `websocket_command_handlers_mode_switch.cpp` 加了 `fillTerrariaModeCommand`,挂在 `set_mode` 直接命令的分支里。

**结果**:uniapp 走 `runModeTransaction → tx_begin` 路径根本不会进 `set_mode` 分支,板载报 `mode unsupported`。

### 7.2 正确的接入方式

**所有现代模式都走事务流程**(maze / snake / tetris / theme 都是这样):

```cpp
// runtime_command_bus.cpp::buildPreparedWebSocketTransaction
} else if (mode == ModeTags::TERRARIA_CLOCK) {
  prepared = prepareTerrariaTransaction(params, reason);
}
```

加一个 `prepareTerrariaTransaction(params, reason)` 函数,跟 `prepareSnakeTransaction` 一模一样的模式:

1. 检查所有必需字段
2. 提取并校验数值
3. 写入 `gWebSocketTransactionSession.preparedCommand`
4. 返回 true/false + reason

后续 `tx_commit` 时框架会自动:
1. 调 `executeCommand(preparedCommand)`
2. 派发到 `executeBusinessModeSwitch`
3. 在那里我们写好 TERRARIA_CLOCK 分支:applyConfig + switchToMode + saveTerrariaConfig

### 7.3 这次踩的具体雷

| 错 | 对 |
|---|---|
| 在 mode_switch.cpp 加 `fillTerrariaModeCommand` | 在 runtime_command_bus.cpp 加 `prepareTerrariaTransaction` |
| 在 doc 顶层读 character/weaponId 等 | 在 doc["params"] 下读(框架已拆好,prepare 函数收的是 JsonObject params) |
| 自己加 `parseHexColorRgb` helper | 复用 `isHexColorText` + 加一个 `parseHexColorString` |

### 7.4 字段映射表(★ 项目硬约束:1:1 一致,不允许 fallback)

| uniapp(`config.terraria` + `config.*`) | WS params 字段 | 板载 `TerrariaModeConfig` |
|---|---|---|
| `terraria.characterId` | `character`(字符串 warrior/ranger/mage/summoner) | `character`(枚举 0-3) |
| `terraria.weaponId` | `weaponId`(int) | `weaponId`(uint16_t) |
| `terraria.playerX/Y` | `playerX/Y`(int 0-63) | `playerX/Y`(uint8_t) |
| `terraria.playerScale` | `playerScale`(int 20-200) | `playerScale`(uint8_t) |
| `terraria.guardianX/Y` | `guardianX/Y`(int -32 ~ 32) | `guardianX/Y`(int8_t) |
| `terraria.wingSpeedPct` | `wingSpeed`(int 0-200) | `wingSpeed`(uint8_t) |
| `font` | `fontId`(字符串 lcd_6x8 等) | `fontId`(枚举) |
| `time.fontSize` | `fontScale`(int 1-3) | `fontScale`(uint8_t) |
| `time.x/y` | `clockX/Y`(int 0-63) | `clockX/Y`(uint8_t) |
| `hourFormat` | `hourFormat`(int 12/24) | `hourFormat`(uint8_t) |
| `showSeconds` | `showSeconds`(bool) | `showSeconds`(bool) |
| `time.color` | `clockTextColor`(`#rrggbb`) | `clockTextColor[3]` |
| `terraria.clockBgInner` | `clockBgInner`(`#rrggbb`) | `clockBgInner[3]` |
| `terraria.clockBgOuter` | `clockBgOuter`(`#rrggbb`) | `clockBgOuter[3]` |

---

## 8. 沟通教训(给未来的我)

### 8.1 不要写过多 spec

用户需要的是**能跑的代码**,不是 spec 文档。早期写了 4 篇 spec,被骂"文档这么麻烦吗"。

→ **直接动手,边做边记**。文档放在最后总结。

### 8.2 不要让用户下载文件

转换脚本要**自己写 Node.js 直接产出到目标位置**,不要让用户手动下载/复制。

→ "你他妈的自己到处呀 怎么老是要我下载 你行不行啊"

### 8.3 不要往现有模式里融

"我们这跟 theme 有鸡毛关系啊"——每个新模式必须**独立 effect / 独立 config / 独立 NVS namespace / 独立 vue 页**。

→ 看 maze / snake 怎么做的,模仿。

### 8.4 不要瞎想字段

AGENTS.md 硬约束:
- 仅用源码里给出的字段名
- 不允许 `a || b` 兜底
- 字段缺失先问用户
- 接口参数变更先给"参数映射表"

→ 这次坑就在我没核对清楚就加了 `fillTerrariaModeCommand`,字段都是对的,但接入点错了。

### 8.5 卡住要立刻反馈

调试 sprite 加载时多次卡了几分钟没回复,被骂"你卡住了吗"。

→ 长时间任务要**主动汇报进度**,不要等到完成再说。

---

## 9. 复盘:还能更好的地方

### 9.1 资产可以再压
- 当前 328 KB,理论可以做调色板 + 索引压到 200 KB 内
- 但本期已经够用,不再优化

### 9.2 翅膀可以做光晕
- 源码里有 `WingShader` 但效果在 64×64 上看不清
- 决定不做,留给将来

### 9.3 真机性能没测
- 当前 30 fps 假设,但角色合成 + 翅膀 + 守卫 + 时钟边框,每帧约 800 像素绘制
- 真机如果掉到 < 20 fps 要做 dirty rect

---

## 10. 踩坑实录(★ 给未来的我必读)

每一个坑都浪费了实打实的开发时间。下次做主题时钟前,先把这一节看一遍。

### 10.1 接错 WebSocket 接入点(浪费 ≈ 2 小时)

**症状**:uniapp 点发送 → `Error: mode unsupported`

**原因**:把 terraria 接到了 `websocket_command_handlers_mode_switch.cpp::fillTerrariaModeCommand`,挂在老的 `set_mode` 直接命令分支上。但 uniapp `runModeTransaction` 走的是 `tx_begin / tx_commit` 事务路径,根本不进 `set_mode` 分支。

**修复**:删掉 mode_switch.cpp 里的接入,改在 `runtime_command_bus.cpp::buildPreparedWebSocketTransaction` 加 `prepareTerrariaTransaction(params, reason)`(跟 prepareSnake 同模板)。

**教训**:
- **现代模式全部走事务流程**,不要看 `set_mode` 那条老路径
- 接入点选错会编译过,运行时才报 `mode unsupported` —— 不容易发现
- 加新模式前先看 maze / snake 是怎么接的,**模仿就行**

### 10.2 prepare 函数收的是 `params` 不是 `doc`(浪费 ≈ 30 分钟)

**症状**:fillTerrariaModeCommand 里 `doc.containsKey("character")` 永远 false

**原因**:tx_begin 把字段塞在 `doc["params"]` 下,而老的 set_mode 是塞在 doc 顶层。框架已经把 params 拆出来传给 prepare 函数了。

**对的写法**:
```cpp
bool prepareTerrariaTransaction(JsonObject params, const char*& reason) {
  if (!params.containsKey("character")) ...  // ← params, 不是 doc
}
```

### 10.3 时钟字 align=center 的 y 语义不一致(浪费 ≈ 30 分钟)

**症状**:真机时钟"顶部少一行,底部多一行",位置整体偏上

**原因**:

| 端 | align=center 的 (x, y) 含义 |
|---|---|
| uniapp `drawClockTextToPixels` | x 是水平中心,**y 是字串顶部** |
| 我写的 `rasterizeClockTextToMask`(错版) | x 和 y **都当中心**,startY = y - textHeight/2 |

uniapp 默认 `time.y = 6` 表示字顶在第 6 行;板载错版理解成"字中心在第 6 行" → 字向上偏移 4px。

**修复**:`rasterizeClockTextToMask` 里 align=1/2 时**只调 x,y 不动**。

**教训**:
- 跨端的"对齐语义"必须**先去看现有客户端实现**,然后照抄
- 项目里 `(x, y)` 在所有时钟字函数里统一是"字串顶部锚点",别瞎想
- 写文档明确这个约定(已加到 `esp32-firmware-architecture.md` §5.11.K)

### 10.4 翅膀一动屏幕全闪(浪费 ≈ 1 小时)

**症状**:翅膀只有 1 帧切换,但整屏 4096 像素都在闪

**原因**:`render()` 每帧都把背景 + 草地 + 角色 + 时钟全部 `display->drawPixelRGB888()` 重画一遍

**修复**:加 16 KB 双缓冲 + dirty diff(见 §5.10):
1. 所有底层 draw 改成写 `s_renderBuffer[64][64]` (RGB565)
2. render 时算"动态状态指纹",不变直接 return
3. 变化时重建 buffer + 跟 `s_lastFrame` 比对 + 仅推差异像素

**教训**:
- LED 矩阵显示**只刷变化像素**,不刷重复像素
- 即使是"画一样的颜色",`display->drawPixel` 也会触发 DMA 刷新 → 视觉抖动
- **每个动态模式都要花 16 KB SRAM 做双缓冲**,不省这个

### 10.4.1 屏幕循环错位 1 行 — 重复造轮子绕过 presentOffscreenFrame(浪费 ≈ 1.5 小时)

**症状**:画面整体看起来对,但**顶部那行内容跑到了屏幕最底下一行**;像把 64 行画面循环左移了 1 行(其实是上移)。

**怀疑过的方向(全错)**:
- 草地缩放铺设 → 改 `(dy*16+8)/5` 各种边界 case → ❌ 不对
- 16×16 sprite 反向采样 vs 正向采样 → ❌ 不对
- LED panel 物理 row offset → ❌ 别的模式正常
- setRotation → ❌ displayRotation = 0
- RGB565 byte swap → ❌ 公式正确

**真正原因**:

我自己写了 16 KB 双缓冲 + dirty diff:
```cpp
uint16_t s_renderBuffer[64][64];   // 8 KB
uint16_t s_lastFrame[64][64];      // 8 KB
void flushFrameToDisplay(MatrixPanel_I2S_DMA* display) {
  for (y..) for (x..)
    if (renderBuffer != lastFrame)
      display->drawPixel(x, y, c);  // ← 直接戳硬件 DMA buffer
}
```

但是项目**默认开了双缓冲**(`mxconfig.double_buff = true`)。在双缓冲模式下,`drawPixel` 写到的是"后台 buffer",**必须 `flipDMABuffer()` 才会切到前台显示**。我没调 flip。结果:
- 第 N 帧:写后台 buffer → LED 还显示前台旧内容
- 第 N+1 帧:其他模块某处可能调了 flip → 切换 → 显示出"上一帧的画面 + 这一帧没画完的部分",**视觉上像循环错位 1 行**

**修复**:扔掉自己的 dirty diff,直接走项目已有的统一管线:
```cpp
void flushFrameToDisplay() {
  DisplayManager::presentOffscreenFrame(&s_renderBuffer[0][0]);
}
```

`presentOffscreenFrame` 内部:
1. 跟 `liveFrameBuffer`(项目全局,8 KB)做 dirty diff
2. 仅推差异像素
3. 末尾调 `presentFrame()` → 单缓冲不动 / 双缓冲 `flipDMABuffer()`

**教训**:
- 看其他模式怎么画的(`snake_effect.cpp::render` → `DisplayManager::presentOffscreenFrame(frameBuffer)`)
- **不要在 effect 内部重新发明** dirty diff / "上一帧 buffer" / RGB565 转换 — 项目都有
- 双缓冲下直接 `display->drawPixel` 永远会出问题,除非自己手动 flipDMABuffer
- 节省 8 KB(s_lastFrame 不再需要)+ 不踩双缓冲的坑

**反模式签名**(以后看到这种写法立刻警觉):
```cpp
// ❌ 错
uint16_t s_renderBuffer[64][64];
uint16_t s_lastFrame[64][64];
display->drawPixel(...) inside loop

// ✅ 对
uint16_t s_renderBuffer[64][64];
DisplayManager::presentOffscreenFrame(&s_renderBuffer[0][0]);
```

### 10.4.2 屏底空一行 — panel 硬件 row offset(浪费 ≈ 2 小时反复猜测)

**症状**:terraria 草地最底一行(y=63)显示成天空蓝色,看起来"屏底空一行"。同样问题在 **tetris 屏保(cellSize 1/2/3 都有)** 和 **tetris_clock(顶部方块还没落下时屏底显示出顶部 1 行像素)** 都有。

**怀疑过的方向(全错)**:
- 草地 16→5 缩放采样错位 → ❌
- buildFrame 内部 y 坐标算错 → ❌
- 双缓冲 flipDMABuffer 没调 → ❌(切到 presentOffscreenFrame 还有问题)
- `s_renderBuffer` vs `animationBuffer` 内存布局差异 → ❌
- `setRotation` 配置错 → ❌
- 库的 RGB565 byte swap → ❌

**真正原因 — panel 硬件 row offset**:

这块 LED panel 在 DMA 推送时,**buffer 的 y=N 行实际显示到屏 y=(N-1) mod 64**。所有模式都受影响,但视觉上不容易察觉的模式(maze 内部纯算法、clock 文字小、纯色背景的 effects 等)看起来"没问题"。

**项目中早就有这个补偿的证据**:`maze_effect.cpp::resolveMazeDisplayOffsetY()` 在 wide 模式下返回 1,所有渲染坐标都 +1。这是项目惯例,不是 hack。

**修复**(已在 terraria / tetris / tetris_clock 三个模式各自补):

```cpp
// 每个 effect 在底层写 buffer 时都做 y+1 补偿
inline void putPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
  int by = (y + 1) % SCREEN_H;
  buffer[by][x] = MatrixPanel_I2S_DMA::color565(r, g, b);
}
```

**教训**:
- 这块 panel 的硬件 row offset 是**全局事实**,不是某个模式的 bug。新模式默认就要加补偿
- **诊断标记法 30 秒就能定位**,不要纸上推理 — 这次浪费的 2 小时 95% 是反复猜
- 修法只动当前模式,**不要全局改 DisplayManager**(其他模式可能已经手动补偿过,全局改会让它们整体下移再错位)

**诊断标记法 SOP**(后续新模式开发出现"位置异常"必走):

```cpp
// 在 buildFrame() 末尾插入临时诊断
for (int x = 0; x < SCREEN_W; x++) {
  putPixel(x, 0, 0, 255, 0);    // y=0 纯绿
  putPixel(x, 63, 255, 0, 0);   // y=63 纯红
}
```

烧板看屏幕:
- 顶绿、底红 → buffer 写入正确,问题不在渲染层
- 顶天空、底=62红、底=63绿 → 上移 1 行,加 (y+1) % 64 补偿
- 顶红、底绿 → 上下翻转
- 全屏黑 → flush 路径没生效

详见 `esp32-firmware-architecture.md` §6.8。

### 10.5 DRAM 不够用(浪费 ≈ 15 分钟)

**症状**:Linker 报 `region 'dram0_0_seg' overflowed by 4248 bytes`

**原因**:第一次双缓冲我用 RGB888 (24 KB) → 加上其他 BSS 超 DRAM 限。

**修复**:改 RGB565 (16 KB)。display 接口本身就是 RGB565,无视觉损失。

**教训**:
- ESP32 总 320 KB SRAM 实际可用更少(BSS / heap / lib / DMA 都占)
- 显存类全局 buffer 一律用 RGB565,**不要用 RGB888**
- 大 buffer 加之前先估算:当前 RAM 用量 + 你要加的

### 10.6 资产文件数太多(浪费 ≈ 1 小时压缩)

**症状**:46 个分散 .js sprite,uniapp 加载 + 微信小程序 require 路径乱

**原因**:每个 sprite 一个文件,头甲 4 个、胸甲 4 个、腿甲 4 个 ……

**修复**:**按"类"合并到 8 个文件**:
```
sprites_armor_heads.js
sprites_armor_bodies.js
sprites_armor_legs.js
sprites_wings.js
sprites_weapons.js
sprites_player_layers.js
sprites_summon_guardian.js
sprites_misc.js
```

**教训**:
- 资产文件数控制在 8-10 个内
- 微信小程序 `require()` 路径拼接很烦,文件少了好维护
- 编译/链接时间也短

### 10.7 微信小程序不能 require .json(浪费 ≈ 40 分钟)

**症状**:`module 'static/terraria/item_4956.json.js' is not defined`

**原因**:微信小程序 require 不支持 .json 后缀

**修复**:转换脚本输出 .js 文件,内容是 `module.exports = {...}`,不是 .json。

```js
// build-terraria-sprites.js
fs.writeFileSync(out, `module.exports = ${JSON.stringify(data)};`);
```

**教训**:微信小程序兼容是项目硬要求,不是 web,**不要用 fetch / 不要用 .json import**

### 10.8 字段缺失没报错,默认值兜底(被骂)

**症状**:接口字段忘传,板载默认值兜底,但 uniapp 一看跟预期不一样

**修复**:AGENTS.md 硬约束:
- 仅用源码里给出的字段名
- **不允许 `a || b` 兜底**
- 字段缺失先 reject (`reason = "xxx fields missing"`)
- 接口参数变更先给"参数映射表(字段名 → 来源)"再实施

**教训**:出错快败比静默兜底好。错了立刻报,不要"看起来能跑"。

### 10.9 试图把 terraria 融到 theme 模式(被骂)

**症状**:最早想把 terraria 当成 theme 渲染器的一种新主题加进去,被用户骂"我们这跟 theme 有鸡毛关系啊"

**原因**:theme 模式有自己的字段约束(themeId、themeClockConfig),terraria 配置完全不一样(角色/武器/翅膀)

**修复**:terraria 完全独立 —— 独立 effect / 独立 NVS namespace `"terraria"` / 独立 config struct / 独立 vue 页

**教训**:
- 每个新模式独立设计,不要"复用现有架构"
- 看 maze / snake 怎么独立做的就行

### 10.10 Spec 写太多(被骂)

**症状**:想做事先写 4 篇 spec → 用户骂"文档这么麻烦吗"

**修复**:**先动手,边做边记**。文档放在最后总结(就是这份)。

**教训**:
- 简单事直接做
- 不知道怎么做的事,先去 Pokemon 实验区做 HTML 调试页验证
- spec 是给"未来的我"看的,不是"现在跑流程"

### 10.11 让用户下载文件(被骂)

**症状**:让用户手动从浏览器下载转换后的 sprite,然后挪到 uniapp/static/

**修复**:**自己写 Node.js 脚本直接产到目标路径**:
```js
// build-firmware-sprites.js
const out = path.join(__dirname, '../include/theme_assets/terraria/sprites_xxx.h');
fs.writeFileSync(out, ...);
```

**教训**:工具就是要做完整,不要让人插手中间步骤。

### 10.12 长时间任务不汇报进度(被骂)

**症状**:跑大任务(资产转换/编译)几分钟没回应 → "你卡住了吗"

**修复**:跑长任务前**先说一声**"我现在跑 X,大概 Y 秒,进度会刷出来"

**教训**:用户在等,看不到进度就觉得卡了

---

## 11. 资产位置速查

```
D:\project\Pokemon\terraria-clock-preview\
├── terraria-glowxel-1456\           # 反编译 + 解包资产(1.45 GB)
│   ├── _src_1456\                   # C# 反编译源码
│   │   └── Terraria.ID\ArmorIDs.cs  # 盔甲/翅膀 ID 常量(★ 关键参考)
│   ├── _extract_1456\               # PNG 资产
│   │   ├── Armor_Head_*.png         # 头甲 (根目录)
│   │   ├── Armor_Legs_*.png         # 腿甲 (根目录)
│   │   ├── Armor\Armor_*.png        # Body 胸甲 (Armor 子文件夹!)
│   │   ├── Wings_*.png              # 翅膀
│   │   └── Item_*.png               # 武器/物品
│   ├── _data\                       # 整理后的 JSON 元数据
│   ├── reports\                     # 资产分析报告
│   └── _wings_xnb\                  # XNB 原文件
├── glowxel-debug-scripts\           # 阶段性调试 Python(15 个)
├── glowxel-debug-images\            # 调试用 PNG(14 张)
├── specs-uniapp-archived\           # 已完成的 uniapp 阶段 spec
├── terraria-clock-preview.html      # 早期 HTML 调试页
├── terraria-clock-preview.js        # 早期渲染参考实现
└── terraria-designer.html           # 占位页

D:\project\Glowxel\                  # 主仓库(只保留产物)
├── uniapp\
│   ├── static\terraria\             # sprite bundle
│   │   ├── armor_heads.js           # 11 个头甲
│   │   ├── armor_bodies.js          # 10 个胸甲
│   │   ├── armor_legs.js            # 10 个腿甲
│   │   ├── wings.js                 # 42 个翅膀(1.2 MB)
│   │   ├── weapons.js               # 16 把武器
│   │   ├── player_layers.js         # 角色皮肤层
│   │   ├── summon_guardian.js        # 守卫 8 帧
│   │   ├── misc.js                  # 草地 + 特效
│   │   ├── sprites_tiles.js         # 地形瓦片
│   │   └── bosses\                  # 33 个 boss(按 slug 分文件)
│   │       ├── _index.js
│   │       ├── king_slime.js
│   │       └── ... (共 33 个)
│   ├── utils\
│   │   ├── terrariaRenderer.js      # 主渲染(CHARACTERS 定义 + 合成逻辑)
│   │   ├── terrariaWings.js         # 翅膀渲染 + WING_LIST
│   │   ├── terrariaBosses.js        # Boss 渲染
│   │   ├── terrariaBiome.js         # 地形/天空
│   │   ├── terrariaSprites.js       # Sprite 加载/解码
│   │   └── clockTerrariaBorder.js   # 草膨胀边框
│   ├── tools\build-terraria-sprites.js  # 资产转换脚本
│   └── pages\clock-editor\terraria-clock.vue  # 编辑页
├── esp32-firmware\
│   ├── terraria\_png\               # build 脚本的 PNG 输入源
│   ├── include\theme_assets\terraria\  # PROGMEM 资产(9 个 .h)
│   ├── include\terraria_clock_effect.h
│   ├── include\terraria_mode_types.h
│   ├── src\terraria_clock_effect.cpp
│   └── src\clock_font_renderer.cpp
├── _wings_preview\                  # 51 个翅膀 PNG 预览
├── _armor_preview\sets\             # 40 套盔甲组装预览 PNG
├── _boss_source\                    # 17 个 wiki GIF/WebP 原图
├── docs\
│   ├── esp32-firmware-architecture.md
│   └── terraria-clock-development-summary.md  # 本文档
└── .kiro\specs\terraria-clock-board\
    └── design.md
```

---

## 12. 阶段 6: 第二代深度扩展(33 Boss + 42 翅膀 + 10 套装)

> 时间: 2025 年 5 月  
> 目标: 让泰拉瑞亚时钟从"4 职业看腻"变成"33 boss + 10 套装 + 42 翅膀自由搭配"

### 12.1 Boss 系统(33 个)

**架构**: 按 slug 懒加载(一个 boss 一个 .js 文件),避免一次性加载全部 boss 数据导致内存爆炸。

```
uniapp/static/terraria/bosses/
  _index.js              — 33 个 boss 的索引(slug/nameZh/biome)
  king_slime.js          — 每个 boss 独立编码(palette+delta 或 webp 静态)
  eye_of_cthulhu.js
  ... (共 33 个)
```

**Boss 渲染特性**:
- `terrariaBosses.js` 支持: palette+delta 编码 / 多组件拼接 / flipX / orbit 动画 / 静态拼接
- 每个 boss 独立 X/Y/scale, 用户可单独调节位置
- Boss 尺寸不限制,用户自行调缩放

**33 个 Boss 完整列表**:

| # | slug | 中文名 | 渲染方式 |
|---|---|---|---|
| 1 | king_slime | 史莱姆王 | webp静态 |
| 2 | eye_of_cthulhu | 克苏鲁之眼 | 多帧动画 |
| 3 | eater_of_worlds | 世界吞噬者 | 静态拼接(间距44px) |
| 4 | brain_of_cthulhu | 克苏鲁之脑 | 本体动画 |
| 5 | queen_bee | 蜂王 | 4帧飞行循环 |
| 6 | skeletron | 骷髅王 | 静态(放弃动画) |
| 7 | deerclops | 巨鹿 | GIF转码 |
| 8 | wall_of_flesh | 血肉墙 | 多组件拼接 |
| 9 | queen_slime | 史莱姆女皇 | webp主体+Extra_185翅膀4帧 |
| 10 | the_twins | 双子魔眼 | 多组件 |
| 11 | destroyer | 毁灭者 | 静态拼接(间距40px) |
| 12 | skeletron_prime | 机械骷髅王 | 多组件 |
| 13 | plantera | 世纪之花 | 本体动画 |
| 14 | golem | 石巨人 | webp静态 |
| 15 | duke_fishron | 猪龙鱼公爵 | flipX强制翻转 |
| 16 | empress_of_light | 光之女皇 | 多组件 |
| 17 | lunatic_cultist | 拜月教邪教徒 | 动画 |
| 18 | martian_saucer | 火星飞碟 | 多组件 |
| 19 | moon_lord | 月亮领主 | 多组件拼接 |
| 20 | pumpking | 南瓜王 | 多组件 |
| 21 | mourning_wood | 悼木 | GIF转码 |
| 22 | ice_queen | 冰雪女王 | GIF转码 |
| 23 | santa_nk1 | 圣诞坦克 | GIF转码 |
| 24 | everscream | 常青尖叫怪 | GIF转码 |
| 25-28 | solar/nebula/stardust/vortex_pillar | 四柱 | 动画 |
| 29 | flying_dutchman | 飞行荷兰人 | 多组件 |
| 30 | mothron | 蛾怪 | GIF转码 |
| 31 | betsy | 双足翼龙 | GIF转码 |
| 32 | dark_mage | 暗黑法师 | spritesheet切割 |
| 33 | ogre | 食人魔 | spritesheet切割 |

**踩坑记录**:
- 史莱姆女皇的 shader 着色(亮度→LUT 采样)在 64×64 上不够准确,最终用 webp 原图保色
- 骷髅王 spritesheet(760×456)定位切割失败,用户放弃
- 毁灭者/世界吞噬者做动画效果像"抽搐",最终改为静态拼接

### 12.2 地形系统(9 种天空 + 草地)

```
uniapp/utils/terrariaBiome.js
```

| biome | 天空渐变 | 草地 |
|---|---|---|
| forest | 蓝→浅蓝 | 绿草5行铺满 |
| corruption | 紫黑 | 紫色腐化 |
| crimson | 暗红 | 红色猩红 |
| hallow | 粉蓝渐变 | 彩色神圣 |
| desert | 橙黄 | 沙土 |
| snow | 灰蓝 | 白雪 |
| jungle | 深绿 | 丛林绿 |
| mushroom | 深蓝 | 蘑菇蓝 |
| underworld | 暗红渐变 | 灰岩(地狱) |

Boss 按 biome 分组显示(切换地形后显示对应 boss 列表)。

### 12.3 翅膀系统(42 种,独立可选)

**文件**:
- `uniapp/static/terraria/wings.js` — 42 个翅膀 sprite 数据(base + delta 差异帧)
- `uniapp/utils/terrariaWings.js` — 渲染逻辑 + WING_LIST 名称表
- 翅膀选择独立于盔甲,用户可自由搭配

**帧数分布**:
- 4 帧: 大多数标准翅膀(1-3, 5-21, 23-27, 29-32, 35-38, 46)
- 6 帧: Wings 34 (Jim), Wings 39 (Leinfors)  
- 7 帧: Wings 43 (Grox)
- 8 帧: Wings 48 (Chippy), Wings 51 (Luna)
- 11 帧: Wings 49 (Heroicis), Wings 50 (Kazzymodus)

**排除的翅膀**: 4(Jetpack) / 22(Hoverboard) / 28(Lazure平台) / 33(Yoraiz0r) / 41(Safeman) / 45(长尾彩虹) / 47(ChickenBones)
— 要么是脚底装备不是翅膀,要么造型不适合 64×64 显示。

**特殊翅膀(未来扩展)**:
- Wings_40 (Ghostar): 需要源码查组装方式(多帧复杂翅膀)
- Wings_44 (彩虹/光之女皇): 需要渐变处理

**动画逻辑**:
```js
// 跳过帧0(折叠态),从帧1开始循环
function getWingFrameByTime(animTimeSec, wingSpeed, frameCount) {
  const animFrames = frameCount - 1;
  return 1 + (Math.floor(animTimeSec * 60 * wingSpeed / 5) % animFrames);
}
```

**Lunar 翅膀特效**:
- 29 Solar: 暖橙脉冲叠加层
- 31 Nebula: 4 方向偏移副本(粉色脉冲)
- 32 Stardust: 蓝白发光叠加层

### 12.4 盔甲套装扩展(4 → 10 套)

**新增 6 套中后期盔甲**, 从源码 `ArmorIDs.cs` 查证 Head/Body/Legs ID:

| 套装 | ID (head/body/legs) | 翅膀 | 武器 | 游戏阶段 |
|---|---|---|---|---|
| 耀斑 | 171/177/112 | 29 耀斑之翼 | 天顶剑/星辉者 | 终局·战士 |
| 星旋 | 169/175/110 | 30 星旋加速器 | 星旋机枪/幻影弓 | 终局·射手 |
| 星云 | 170/176/111 | 31 星云斗篷 | 最后的棱镜/星云烈焰 | 终局·法师 |
| 星尘 | 189/190/130 | 32 星尘之翼 | 星尘龙杖/帝皇之刃 | 终局·召唤 |
| **甲虫** | 157/105/98 | 24 甲虫翅膀 | 泰拉刃/占有斧 | 中后期·战 |
| **幽灵** | 101/66/55 | 11 幽灵之翼 | 暴风雪法杖/棱镜 | 中后期·法 |
| **阴森** | 134/95/79 | 21 阴森翅膀 | 暴风雪法杖/星尘龙杖 | 中后期·召唤 |
| **冰霜** | 46/27/26 | 10 冰冻翅膀 | 北极/暴风雪法杖 | 中期·混合 |
| **神圣** | 41/24/23 | 26 猪龙鱼翅膀 | 泰拉刃/充能攻击 | 中期·战 |
| **叶绿** | 78/51/47 | 27 蛾翼 | 永夜刃/棱镜 | 中期·射 |

**Body 文件发现**: 解包目录中 body armor PNG 不叫 `Armor_Body_X.png`, 而是在 `Armor/Armor_X.png` 子文件夹里。build 脚本已做重命名拷贝处理。

### 12.5 武器扩展(8 → 16 把)

新增武器(从源码 `ItemID.cs` 确认 ID):

| ID | 名称 | 类型 | useStyle | 套装关联 |
|---|---|---|---|---|
| 757 | 泰拉刃 | 近战 | 1(摆动) | 甲虫/神圣 |
| 1258 | 占有斧 | 近战 | 1 | 甲虫 |
| 1569 | 暴风雪法杖 | 魔法 | 5(水平) | 幽灵/冰霜 |
| 1571 | 暴风雪法杖 | 近战 | 1 | 阴森 |
| 3018 | 北极 | 远程 | 5 | 冰霜 |
| 3827 | 充能攻击 | 近战 | 1 | 神圣 |
| 4923 | 永夜刃 | 近战 | 1 | 叶绿 |
| 4952 | 棱镜 | 魔法 | 5(旋转90°) | 叶绿 |

### 12.6 Build 脚本更新

`uniapp/tools/build-terraria-sprites.js` 已更新:
- 头甲: 4 → 11 个
- 胸甲: 4 → 10 个
- 腿甲: 4 → 10 个
- 翅膀: 4 → 42 个(自动检测帧数)
- 武器: 8 → 16 个
- misc.js 加了空数据保护(PNG 缺失时不覆盖已有数据)

**运行方式**:
```bash
cd uniapp
node tools/build-terraria-sprites.js
```

**前置条件**: 
- PNG 文件放在 `esp32-firmware/terraria/_png/` 目录
- 需要 pngjs 依赖(`uniapp/node_modules/pngjs`)

### 12.7 UI 变化(terraria-clock.vue)

角色 Tab 新增:
- **翅膀选择网格**(42 个按钮, 独立于盔甲选择)
- **翅膀速度调节**(±10% 步进, 范围 0~200%)
- 职业选择从 4 个扩展到 10 个
- 切换职业自动同步对应翅膀(可手动覆盖)

### 12.8 per-boss 位置记忆

每个 boss 独立保存 `{x, y, scale}`:
```js
config.terraria.bossOverrides = {
  king_slime: { x: 53, y: 41, scale: 27 },
  eye_of_cthulhu: { x: 53, y: 22, scale: 27 },
  // ... 33 个
}
```
切换 boss 时从这里加载,调整时写回。

---

## 13. 下次做类似项目的建议

如果未来要做 Pokemon / Kamen Rider / 其他游戏主题:

0. **先把 §10 踩坑实录看一遍**。20 分钟,能省后面 5+ 小时
1. **先去 Pokemon 实验区先做 HTML 调试页**(Pokemon 实验区已有 `pokemon-preview.html` / `kamen-rider-preview.html` 模板)
2. 在那边把渲染算法跑通 + 资产转换跑通
3. 资产压到目标大小(< 500 KB)
4. 一次性挪到 Glowxel 主仓库(uniapp + esp32-firmware 同步)
5. 走标准模式接入流程(见 `esp32-firmware-architecture.md` §5)
6. 主题时钟特殊点参考 `esp32-firmware-architecture.md` §5.11(资产/合成/对齐/性能/调试)
7. 测,迭代,完成

**永远先在实验区跑通,再进主仓库**。Glowxel 是产品代码,不是实验场。
