# 拳皇 97 (KOF '97) 主题开发总结
<!-- The King of Fighters '97 选人界面 + 像素电视机外壳 -->

> 一份从 0 到 1 把**格斗游戏选人界面**搬到 64×64 LED 矩阵的全流程笔记。覆盖素材采集、sprite sheet 切割、差异帧动画、网页预览、电视机壳布局、板载移植。**这套流程同样适用于其他选人/角色展示型像素游戏主题** (拳皇系列 / 街霸系列 / SNK / Capcom 经典格斗)。

---

## 1. 主题选型 (Why KOF97)

### 1.1 选型标准

| 维度 | 标准 | KOF97 符合 |
|---|---|---|
| 像素风原生 | NeoGeo 原生像素 | ✅ |
| 主题独特 | "选人界面动态屏保" 不是常见时钟 | ✅ |
| 角色丰富 | 14 个可选角色 (含 Boss Orochi) | ✅ |
| 装饰加分 | 80 年代像素电视机外壳 | ✅ |
| 公共素材 | spriters-resource / fightersgeneration 都有 | ✅ |
| 板载预算 | 资产 < 100 KB Flash | ✅ |

### 1.2 视觉构成

```
64×64 屏幕
├─ 上半 (y=4..46, 56×43 = 屏幕区)
│   ├─ 头像区 7×2 = 14 格 (5×4 像素 + 1px 选中边框)
│   └─ 中间 stance 待机动画 (P1 左 / P2 右)
└─ 下半 (y=47..63 = 电视壳)
    ├─ 底座 + 光驱缝
    ├─ 老式 LED 绿时间显示 (HH:MM, 3×5 字体)
    ├─ 4 个 LED 灯
    └─ 底脚
```

### 1.3 选型陷阱

- ❌ **以为 Orochi (大蛇) 是普通可选角色**: 街机版 Orochi 是 unused graphics, 没有标准选人头像 (PS1 版才把他做成可选)
- ❌ **以为所有角色 sprite 帧数一致**: 实际 Goro 是 5 帧, Orochi 是 14 帧, 其它 6 帧
- ❌ **以为 sprite sheet 帧间分隔色统一**: 实际有 #000000 / #470047 / #480048 / #580058 / #a700a7 等深紫族多种
- ❌ **以为可以保留全分辨率渲染**: 板载 Flash 占用会爆 (1.15 MB), 必须定档压缩

### 1.4 角色清单 (14 个最终)

| key | 文件名 | stance 帧数 | 备注 |
|---|---|---|---|
| kyo | `kyo.png` | 6 | 草薙京, 主角 |
| iori | `Iori.png` | 6 | 八神庵 |
| terry | `Terry.png` | 6 | Terry Bogard |
| andy | `Andy.png` | 6 | Andy Bogard |
| benimaru | `Benimaru.png` | 6 | 二阶堂红丸 |
| mai | `Mai.png` | 6 | 不知火舞 |
| ryo | `Ryo.png` | 6 | Ryo Sakazaki |
| goro | `Goro.png` | **5** | 大门五郎 (注意特例) |
| chang | `chang.png` | 6 | 张巨汉 |
| choi | `Choi.png` | 6 | 蔡宝奇 (像素少, 注意保护) |
| shermie | `Shermie.png` | 6 | Shermie |
| yashiro | `Yashiro.png` | 6 | 八汁色 |
| chizuru | `Chizuru.png` | 6 | 神乐千鹤 |
| orochi | `Orochi.png` | **14** | 大蛇 (boss, 14 帧呼吸+变身) |

---

## 2. 素材采集

### 2.1 资源站清单

| 站点 | 用途 | URL |
|---|---|---|
| Spriters Resource | NeoGeo 完整 sprite sheet | spriters-resource.com/neo_geo_ngcd/thekingoffighters97 |
| Fightersgeneration | 选人界面截图 + 头像 | fightersgeneration.com/games/kof97selectf.jpg |
| TCRF | unused graphics 信息 (Orochi) | tcrf.net/The_King_of_Fighters_'97_(Neo_Geo) |
| Cdromance | KOF97 4M Orochi Team unlocked | cdromance.org/.../the-king-of-fighters-97-4m-orochi-team-unlocked |

### 2.2 必采清单

| 类别 | 数量 | 数据形式 |
|---|---|---|
| 选人头像 (88×108 PNG) | 13 张 | 用户从 fightersgeneration 选人界面手动切 |
| Orochi 头像 (14×14 PNG) | 1 张 | 单独搞到 (非街机源) |
| 角色 sprite sheet (各 6/5/14 帧) | 14 张 | NeoGeo 反编译 / spriters 站 |

### 2.3 关键经验

- **必须先肉眼确认背景色**: KOF sheet 背景是 `(255,0,255)` 纯粉
- **必须先肉眼确认分隔色**: 有 5 种以上 (黑 + 4 种深紫), 不能只针对一种写死
- **不要相信"35 个角色都有头像"**: 街机版 Orochi 没有, 隐藏角色要独立处理

---

## 3. Sprite Sheet 切割 (`cut-frames.js`)

### 3.1 困难

每张 sheet 布局都不一样:
- 帧数: 14 角色 6 帧, Goro 5 帧, Orochi 14 帧
- 帧宽度: 同一 sheet 各帧宽度都不同 (如 Joe 6 帧分别 63/63/63/63/79/79)
- 分隔色: 黑 / `#480048` / `#580058` / `#a700a7` 等多种
- 边框: 部分 sheet 左右带额外黑边

### 3.2 解法 - 多色心 + 90% 阈值

```js
// 分隔色族 (容差 25)
const SEP_COLORS = [
  [0, 0, 0],
  [0x4b, 0x00, 0x4b],   // 75,0,75
  [0x58, 0x00, 0x58],   // 88,0,88 (Joe)
  [0xa7, 0x00, 0xa7],   // 167,0,167 (Joe 中段)
  [0xb4, 0x00, 0xb4],   // 180,0,180
];

// 列里 ≥ 90% 像素接近 SEP_COLORS 中任一个 = 分隔列
function isSepCol(rawData, info, x, tol = 25) {
  let sepCnt = 0, total = 0;
  for (...) {
    if (matched) sepCnt++;
    total++;
  }
  return total > 0 && sepCnt / total >= 0.9;
}
```

90% 阈值是关键 - 严格的"100% 是分隔色"会被角色像素侵入失败 (chang 第 3 个分隔有 1 个角色像素侵入).

### 3.3 切割流程

```
1. 扫描"近分隔色"列 → sepCols
2. 合并相邻列成"段" → sepSegs
3. 剥掉左/右边界段 (左/右黑边框) → usableSegs
4. usableSegs 长度 == frameCount-1 → 切;否则人工处理
5. 切出每帧 PNG 到 frames-out/<角色>/<i>.png
```

### 3.4 排坑日志

| 角色 | 失败原因 | 解决 |
|---|---|---|
| Goro | 找到 4 段而期望 5 | **Goro 是 5 帧不是 6**, 改 frameCount |
| Iori | 0 段 (容差 8 抓不住) | 容差放到 25, 加 `(176,0,176)` 色心 |
| chang | 0 段 (分隔被角色侵入) | 90% 阈值放宽 |
| Joe | 0 段 (`#580058` 不在色族) | 加 `[0x58,0,0x58]` 和 `[0xa7,0,0xa7]` |
| kyo | 0 段 (复合色族) | 同上, 容差扩到 25 + 多色心 |
| Orochi | 0 段 + 14 帧 | 同上 + 改 frameCount=14 |

---

## 4. 头像处理 (5×4 像素)

### 4.1 头像规格

每个角色头像缩到 **5×4 像素 + 1px 边框** = 单元 7×6, 7×2=14 格塞入屏幕区. 选中角色边框颜色变化:
- P1 选中: 红 `#e80000`
- P2 选中: 蓝 `#3870ff`
- 默认: 白 `#f0f0f0`

### 4.2 生成脚本 `heads-to-pixels.js`

```js
const CHARS = [
  ['kyo',      'kyo.png'],
  ['iori',     'Iori.png'],
  // ...
  ['orochi',   'Orochi.png'],
];

// sharp nearest 缩到 5×4 + 输出 JS 像素数组
const { data } = await sharp(src)
  .resize(5, 4, { kernel: 'nearest' })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
```

输出 `kof97Sprites.js` (`KOF_HEADS = {key: {w, h, p}}`) + 拼图 `heads-overview.png` 给用户人工确认.

---

## 5. Stance 帧处理 (`build-stance-data.js`)

### 5.1 整体流程

```
frames-out/<角色>/<i>.png (粉背景, 各帧尺寸不一)
    │
    │ 1. trimAlpha (剔粉色 + 计算 bbox)
    ▼
{ data, x0, y0, x1, y1 }
    │
    │ 2. scaleAndCenter (缩到 20×23, 脚底+水平居中)
    ▼
20×23 RGBA buffer
    │
    │ 3. fillPinkWithNeighbors (8 邻居补色 2 轮)
    ▼
20×23 干净 buffer
    │
    │ 4. base + delta 压缩
    ▼
KOF_STANCES[key] = { w:20, h:23, base, deltas }
```

### 5.2 粉色去除 - 4 道防线

**问题**: 缩放采样会让原图边缘的粉色"渗"出来, 单一过滤抓不干净.

```
1. 多色心 + 距离判定 (粉色族 9 个色心 + 距离阈值 40)
   isPinkCombined(r,g,b)

2. 删除时 RGB 也清零 (不只是 alpha=0)
   防止 sharp 缩放采样时把原粉色"渗"出来

3. 缩后 2 轮 8 邻居补色
   残留粉色 → 用周围 8 邻居非粉色平均值替换
   重复 2 轮处理嵌套粉色

4. 最终输出兜底: 还是粉色 → null
```

**关键约束**: 粉色判定**必须保留红色** (R 高 G 低 B 低), 蓝色 (R 低 G 低 B 高) 不被误删.

```js
function isPink(r, g, b) {
  if (r < 50 || b < 50) return false;       // ← 排除红色 (蓝低) / 蓝色 (红低)
  if (g >= r - 30) return false;             // 绿要明显比红低
  if (g >= b - 30) return false;             // 绿要明显比蓝低
  if (Math.abs(r - b) > 80) return false;    // 红蓝差太大不是粉
  return true;
}
```

### 5.3 脚底对齐 (★ 核心)

**问题**: 同一角色各帧 bbox 不同 (呼吸抬肩 1px), 不同角色 bbox 也不同 (kyo 高 / shermie 矮), 直接画会"错位" + "脚不在同一行".

**解法 - 双层对齐**:

**层 1**: build 阶段每帧贴到 `maxW × maxH` 画布 + 底对齐:

```js
const W = maxW, H = maxH;
const canvas = Buffer.alloc(W * H * 4);
const ox = Math.floor((W - c.w) / 2);   // 水平居中
const oy = H - c.h;                      // 底对齐 (脚踩画布底)
```

**层 2**: 渲染时 `dx = footX` 指**脚的中心 x**, 不是左上角:

```js
// 左上角: 水平 footX 居中 / 底行落在 footY
const leftX = footX - Math.floor(w / 2);
const topY = footY - h + 1;
```

这样不管角色画布 37 宽还是 96 宽, **脚永远在 footX 那一列, 同一基线 footY 上**.

### 5.4 差异帧 (Delta Frames)

### 5.4.1 设计

```js
KOF_STANCES.kyo = {
  w: 20, h: 23,
  base: [460 个 hex 或 null],     // 第 0 帧 = 关键帧
  deltas: [
    {idx_string: color_or_null, ...},   // 第 1 帧 vs base 的差异
    ...   // 共 5 个 delta (5/13 角色除外)
  ],
}
```

### 5.4.2 渲染重建

```js
const cur = base.slice();
if (frameIdx > 0) {
  for (const k in deltas[frameIdx - 1]) cur[k] = deltas[frameIdx - 1][k];
}
// cur 现在是当前帧完整像素
```

**好处**:
- 数据量减 50% 左右
- **缺漏自补**: 某帧某像素被误剔, base 兜底
- 帧间对齐完美 (因为缩放和 bbox 都基于第 0 帧)

### 5.5 终态压缩尺寸 (★ 关键决策)

**初版**保留全分辨率 (60-110 宽 × 100-130 高), 板载 Flash 占用 **1.15 MB** 爆预算.

**最终决策**: 直接缩到 **20×23**:

```js
const TARGET_W = 20;
const TARGET_H = 23;
```

理由: 实际屏上显示就是这么大 (网页 charScale=20% 时屏上约 22×26), 保留全分辨率纯属冗余.

| 方案 | Flash | 优劣 |
|---|---|---|
| 全分辨率 + delta | 1152 KB | ❌ 远超预算 |
| 全分辨率 + 独立全帧 | 1414 KB | ❌ 更大 |
| 24×27 全帧 | 155 KB | 略大 |
| **20×23 base+delta (最终)** | **52 KB** | ✅ 远低于预算, 显示等同屏上效果 |

---

## 6. 网页预览 (`kof97Renderer.js`)

### 6.1 渲染流程

```
renderKof97Scene(state)
  │
  ├─ drawScreen (屏幕区)
  │     ├─ 屏幕背景 (深蓝 #0a3870)
  │     ├─ drawPortraits (7×2 头像, 选中色变化)
  │     └─ drawCharacters (P1 + P2 stance)
  │
  └─ drawTvFrame (电视壳)
        ├─ 上下左右黑边
        ├─ 屏幕边框 (1px 内描边)
        ├─ 圆角削角
        ├─ 颈部梯形 (默认关闭)
        ├─ 底座 + 光驱缝 + 底沿黑边
        ├─ 时间显示 (3×5 字体, #00ff66)
        ├─ LED × 4
        └─ 底脚 × 2
```

### 6.2 唯一改值入口: `TV_CONFIG`

电视壳全部参数集中在顶部 `TV_CONFIG` 对象, 改这里 = 同步调试页 JSON.

```js
const TV_CONFIG = {
  // 屏幕区
  sx0: 4, sy0: 4, scrw: 56, scrh: 43,
  bg: '#0a3870',

  // 电视壳颜色 (街机黑红预设)
  tvBlack: '#1a1a1a', tvDark: '#0a0a0a',
  tvEdge: '#000000',  tvLight: '#c00808',

  corner: 1,
  neckOn: false, neckStartHalf: 3, neckRows: 3,

  baseOn: true,
  baseTop: 50, baseBot: 57, baseLeft: 12, baseRightInset: 12,
  slotY0: 52, slotY1: 56,

  ledOn: true, ledY: 60,
  led1x: 18, led1c: '#dcb41e',
  led2x: 22, led2c: '#8c8c91',
  led3x: 26, led3c: '#b41e1e',
  led4x: 46, led4c: '#50c83c',

  timeOn: true, timeColor: '#00ff66',
  timeX: 23, timeY: 52,

  footOn: true, footTop: 62, footBot: 63, footLx0: 8, footLx1: 16,
};
```

### 6.3 角色 stance 配置 (定档常量)

定档之后所有参数都写死, **不再可调**:

```js
const KOF_CHAR_CONFIG = {
  charXLeft: 14,           // P1 脚的中心 x
  charXRight: 40,          // P2 脚的中心 x
  charY: 40,               // 脚的基线 y
  charFrameInterval: 6,    // 每 6 帧切一次 stance (200ms)
  p1Mirror: true,          // P1 朝右
  p2Mirror: false,         // P2 朝左
};
```

### 6.4 状态机

```js
state = {
  frame, phase, selectP1, selectP2, selectTimer,
  timeText,                    // HH:MM 字符串
  charFrame, charTimer,        // stance 推进
}

tickScene(state):
  - frame++, charTimer++, selectTimer++
  - 每 30 帧刷 timeText
  - charTimer >= 6 → charFrame++ (stance 推进)
  - selectTimer >= 150 (5 秒) → 随机切 P1/P2 (避免重复, 14 个)
```

### 6.5 时间字体 (3×5)

`FONT_3x5` 常量定义 0-9 + `:` 字模. `12:34` 总宽 = 3+1+3+1+1+1+3+1+3 = 16 像素. 64 全宽居中起点 = (64-16)/2 = 24, 调到 23 略偏左**贴底座中心**.

### 6.6 调试页 (`tv-frame-debug.html`)

**纯前端 file:// 打开**, 双击即可, 无需启动服务器.

调试页**只调电视壳**:
- 控件 (sx0/sy0/scrw/scrh + 4 颜色 + 圆角 + 颈部 + 底座 + LED + 时间 + 底脚)
- 任何控件改动 → 立即重画 + 实时更新底部 JSON
- 10 个一键应用的电视壳预设主题 (深蓝黑 / 米白 / GB灰 / 红木 / **街机黑红** / 黄机壳 / FC灰白 / 洋红 / 军绿 / 冰蓝)

调好的 JSON 直接同步到 `kof97Renderer.js TV_CONFIG`.

---

## 7. 客户端入口页 (`Kof97.vue`)

### 7.1 文件结构 (照抄 PlanetScreensaver 模板)

```html
<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar">...</div>
    <div class="navbar glx-topbar">...</div>
    <div class="canvas-section">
      <PixelPreviewBoard ... />
      <div class="preview-caption">
        <div class="preview-actions">
          <div class="action-btn-sm primary" @click="sendToDevice">
            <Icon name="link" /> <span>发送</span>
          </div>
        </div>
      </div>
    </div>
    <div class="content glx-scroll-region">
      <div class="card glx-panel-card glx-editor-card">
        <!-- 说明 -->
      </div>
    </div>
  </div>
</template>
```

### 7.2 必走 mixins

```js
mixins: [
  uniLifecycleAdapter,
  statusBarMixin,
  deviceSendUxMixin,    // 发送遮罩 / loading / toast
]
```

**注**: 不需要 clockPreviewMixin (不显示时钟单独控制) 也不需要 deviceSyncMixin (无参数模式).

### 7.3 sendToDevice 实现 (无参数)

```js
async sendToDevice() {
  if (!this.guardBeforeSend(this.deviceStore.connected)) return;
  this.beginSendUi();
  try {
    const ws = this.deviceStore.getWebSocket();
    await ws.startKof97();
    this.showSendSuccess('已应用');
  } catch (err) {
    this.showSendFailure(err);
  } finally {
    this.endSendUi();
  }
}
```

### 7.4 关键样式踩坑

- **不要在 scoped 里自定义 `.form-row`**: 会跟全局 `body.is-mobile-device .form-row` 冲突, GlxStepper 直接被压扁不显示
- 卡片用项目标准类: `card glx-panel-card glx-editor-card` + `card-title-section glx-panel-head` + `glx-panel-title`
- form-row 是 **block** 布局 (label 上面, stepper 下面), 不是 flex row

---

## 8. WebSocket 通道

### 8.1 客户端 (无参数模式模板)

```js
// website/src/utils/webSocket.js + uniapp/utils/webSocket.js
async startKof97(options = {}) {
  return this.runModeTransaction({
    mode: "kof97",
    params: {},
    acceptedTimeout: options.acceptedTimeout,
    finalTimeout: options.finalTimeout,
  });
}
```

### 8.2 板载 prepare (无参数模板)

```cpp
// runtime_command_bus.cpp
bool prepareKof97Transaction(JsonObject /*params*/, const char*& reason) {
  resetPreparedCommand(gWebSocketTransactionSession.preparedCommand);
  RuntimeCommandBus::RuntimeCommand& command = gWebSocketTransactionSession.preparedCommand;
  command.type = RuntimeCommandBus::RuntimeCommandType::MODE_SWITCH;
  command.targetMode = MODE_ANIMATION;
  command.businessModeTag = ModeTags::KOF97;
  command.successMessage = "kof97 started";
  reason = nullptr;
  return true;
}
```

---

## 9. 板载移植

### 9.1 目录结构

```
include/
  kof97_effect.h                       // namespace 接口
  theme_assets/kof97/
    kof97_sprite_types.h               // KofSprite + KofStanceSet struct 定义
    sprites_heads.h                    // 14 个 5×4 头像 (PROGMEM)
    sprites_stances.h                  // 14 角色 stance 帧, base+delta 已展开成独立全帧
    index.h                            // KofSprites 命名空间 + getHeadByIndex / getStanceFrame

src/
  kof97_effect.cpp                     // 状态机 + 渲染主体 (~400 行)
```

### 9.2 6 步接入清单 (照搬冒险岛模板)

| # | 文件 | 改动 |
|---|---|---|
| 1 | `mode_tags.h` | 加 `KOF97 = "kof97"` |
| 2 | effect.h/.cpp | namespace + applyConfig/update/render/isActive/deactivate |
| 3 | `runtime_command_bus.cpp` | `prepareKof97Transaction` + dispatch + executeBusinessModeSwitch 三处 |
| 4 | `runtime_mode_coordinator.cpp` | shouldClearScreen + switchToMode + deactivate + isRecoverable 四处 |
| 5 | `config_manager.cpp` | `isStaticallyRecoverableBusinessModeTag` 白名单 |
| 6 | `main.cpp` | 主循环 dispatch 加 `if (currentBusinessModeTag == KOF97)` 分支 |
| 7 | `webSocket.js` (×2) | `startKof97(options)` 走 runModeTransaction |
| 8 | `Kof97.vue` | sendToDevice override 调 `ws.startKof97()` |

### 9.3 资产格式

**fmt=5** (与冒险岛一致, 每像素 5 字节 `[x, y, r, g, b]`, 只存非空像素):

```cpp
struct KofSprite {
  uint8_t  w;
  uint8_t  h;
  uint16_t pixelCount;
  const uint8_t* pixels;
  uint8_t  fmt;     // 5
};

struct KofStanceSet {
  uint8_t frameCount;
  const KofSprite* const* frames;
};
```

### 9.4 build-firmware-sprites.js (★ 关键决策)

**问题**: 网页 stance 用 base+delta, 板载也复刻太复杂.

**决策**: build 阶段**展开 base+delta 成独立全帧**, 板载只查表不重建.

```js
function rebuildFrame(base, deltas, frameIdx) {
  if (frameIdx === 0) return base.slice();
  const cur = base.slice();
  const d = deltas[frameIdx - 1];
  for (const k in d) cur[k] = d[k];
  return cur;
}

// 14 个角色 × (5/6/14 帧), 每帧 fmt=5 PROGMEM
```

代价: 数据量略大 (~63 KB vs base+delta ~30 KB), 但简化板载逻辑值得.

### 9.5 渲染主体模板

```cpp
namespace {
  // 头像绘制 (5×4 直接用 fmt=5)
  void drawSpriteAt(const KofSprite* sprite, int dx, int dy, bool mirror);

  // stance 绘制 (脚中心+基线对齐)
  void drawStanceFrame(int footX, int footY,
                       const KofSprite* sprite, bool mirror) {
    KofSprite copied;
    memcpy_P(&copied, sprite, sizeof(KofSprite));
    int leftX = footX - (copied.w / 2);
    int topY  = footY - copied.h + 1;
    drawSpriteAt(sprite, leftX, topY, mirror);
  }
}

void Kof97Effect::render() {
  if (!s_active) return;
  if (DisplayManager::dma_display == nullptr) return;
  drawScreen();      // 屏幕区: 头像 + stance
  drawTvFrame();     // 电视壳: 黑边 + 底座 + 时间 + LED + 底脚
  DisplayManager::presentOffscreenFrame(&DisplayManager::animationBuffer[0][0]);
}
```

### 9.6 putPixel 行偏移补偿 (★ 此 panel 必修)

```cpp
inline void putPixel(int x, int y, uint8_t r, uint8_t g, uint8_t b) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
  int by = (y + 1) % SCREEN_H;   // ★ 必须补偿
  DisplayManager::animationBuffer[by][x] =
      MatrixPanel_I2S_DMA::color565(r, g, b);
}
```

详见架构文档 §6.8.

### 9.7 时间字体板载实现

3×5 字体直接搬到 PROGMEM:

```cpp
const uint8_t kFontRows[11][5] PROGMEM = {
  {0b111, 0b101, 0b101, 0b101, 0b111},   // 0
  // ...
  {0b000, 0b010, 0b000, 0b010, 0b000},   // ':'
};

void drawText3x5(const char* text, int x, int y,
                 uint8_t r, uint8_t g, uint8_t b) {
  // 数字 3 列, 冒号 1 列 (中间列)
  // 每字符后 1 列间距
}
```

时间从板载 RTC 取:

```cpp
void refreshTimeText() {
  time_t now = time(nullptr);
  struct tm tmInfo;
  localtime_r(&now, &tmInfo);
  snprintf(s_state.timeText, sizeof(s_state.timeText),
           "%02d:%02d", tmInfo.tm_hour, tmInfo.tm_min);
}
```

### 9.8 板载帧率与 SELECT_INTERVAL 调整

跟冒险岛一样, 板载实际帧率 < 30fps, 网页 selectTimer=150 (5s @30fps) 板载同样 150 实际是 7.5s.

但 KOF97 切换间隔不敏感 (选人闪烁), 5-8 秒都能接受, 这里**没改 SELECT_INTERVAL=150**.

### 9.9 字段差异速记表

| 类型 | 网页 | 板载 |
|---|---|---|
| 角色 key | `'kyo'` / `'iori'` 字符串 | uint8_t 0..13 索引 |
| stance 帧 | `KOF_STANCES[key].base + deltas` 重建 | `KofSprites::getStanceFrame(idx, frameIdx)` 直接查 |
| 头像 | `KOF_HEADS[key]` 字符串查 | `KofSprites::getHeadByIndex(idx)` 数字查 |
| 时间字符串 | `state.timeText` (JS Date) | `s_state.timeText` (RTC + snprintf) |
| 镜像翻 | `pixels[(W-1-x)+y*W]` | `mirror ? (W-1-x) : x` |

---

## 10. 性能与资源

### 10.1 Flash 占用

```
sprites_stances.h    368 KB 源 / ~63 KB Flash (展开后 14 角色 × 6/5/14 帧)
sprites_heads.h       11 KB 源 / ~2 KB Flash (14 头像 5×4)
其他 (types/index)     3 KB 源 / 极小
─────────────────────────────────
板载实际 PROGMEM 增量 ≈ 65 KB Flash (远低于 500 KB 主题预算)
```

跟冒险岛 (487 KB 源 / ~80 KB Flash) 对比, KOF97 更小.

### 10.2 RAM 占用

```
SceneState s_state             ~32 字节 (frame/select*/charFrame/timer + timeText[8])
PRNG s_prng                    4 字节
─────────────────────────────────
模式增量 < 100 字节 (共用 DisplayManager::animationBuffer 8 KB)
```

### 10.3 渲染耗时估算 (单帧)

| 阶段 | 像素数 | 估时 |
|---|---|---|
| 屏幕背景 56×43 | 2408 | ~0.8 ms |
| 头像 14 格 × ~25 像素 | 350 | ~0.1 ms |
| 角色 stance × 2 (~150 像素/角色) | 300 | ~0.1 ms |
| 电视壳 (黑边+底座+LED+底脚) | ~1500 | ~0.5 ms |
| 时间字 (3×5 × 5 字符) | ~80 | ~0.05 ms |
| presentOffscreenFrame | dirty diff + flip | ~1-2 ms |
| **合计** | | **~3-4 ms** |

剩余 30 ms / 帧给 WiFi/WebSocket/DMA, 完全够.

---

## 11. 调试套路

### 11.1 网页调试 (优先)

打开 `http://localhost:5174/#/kof97`, 看 stance 切换 / 选人光标 / 时间.

**关键日志点**:
- 选人切换: `console.log('select P1=', state.selectP1, 'P2=', state.selectP2)`
- stance 帧推进: `console.log('charFrame=', state.charFrame)`
- 时间更新: `console.log('time=', state.timeText)`

### 11.2 调试页 (电视壳专用)

打开 `assets-raw/kof97/tv-frame-debug.html` (file://), 改控件实时看效果, 调好的 JSON 同步到 `TV_CONFIG`.

### 11.3 板载真机调试

**串口诊断标记** (架构文档 §6.8):

```cpp
void update() {
  if (!s_active) return;
  uint32_t now = millis();
  if (s_lastTickMs == 0) s_lastTickMs = now;
  if (now - s_lastTickMs < 33) return;
  s_lastTickMs = now;
  tickScene();
  if ((s_state.frame % 30) == 0) {
    Serial.printf("[KOF] frame=%lu p1=%u p2=%u cf=%u\n",
      s_state.frame, s_state.selectP1, s_state.selectP2, s_state.charFrame);
  }
}
```

### 11.4 编译验证

```
cd esp32-firmware
pio run -e esp32dev
# 看 RAM/Flash 用量, 确认在预算内
```

成功标准:
- RAM ≤ 50%
- Flash ≤ 70%
- 无 link error

---

## 12. 文件清单

### 12.1 资产层 (`assets-raw/kof97/`)

```
assets-raw/kof97/
├── preview.jpg                 用户参考图
├── *.png (14 头像 + Orochi)    头像源图 (88×108 + 14×14)
├── heads-overview.png          14 头像放大预览
├── heads-5x4/                  14 头像各自放大 16x 单图
├── raw/                        sprite sheet 原图 (切完会被删)
├── frames-out/                 切好的 stance 帧 PNG
├── heads-to-pixels.js          头像 → 5×4 像素数据
├── cut-frames.js               sprite sheet 切帧
├── build-stance-data.js        stance → 20×23 base+delta
├── build-firmware-sprites.js   stance → PROGMEM .h
├── tv-frame-debug.html         电视壳调试页
└── kof97Stances.global.js      (auto-gen) 调试页用全局版
```

### 12.2 网页层 (`website/src/`)

```
views/mobile/Kof97.vue                  入口页 + 预览 + 发送按钮
utils/kof97Renderer.js                  渲染器 (TV_CONFIG + KOF_CHAR_CONFIG)
utils/kof97Sprites.js                   (auto-gen) 14 头像 5×4
utils/kof97Stances.js                   (auto-gen) 15 角色 stance 20×23
utils/webSocket.js                      startKof97 API
router/index.js                         加路由 /kof97
App.vue                                 isDevicePath 加 /kof 白名单
components/device/DeviceControlConsole.vue  加"拳皇 97"卡片
views/mobile/DeviceControl.vue          openKof97 跳转
```

### 12.3 uniapp 层

```
uniapp/utils/webSocket.js               startKof97 API (单独加)
```

### 12.4 板载层 (`esp32-firmware/`)

```
include/
├── kof97_effect.h                      namespace 接口
├── mode_tags.h                         加 KOF97 常量
└── theme_assets/kof97/
    ├── kof97_sprite_types.h            KofSprite + KofStanceSet
    ├── sprites_heads.h                 14 头像 PROGMEM
    ├── sprites_stances.h               14 角色 stance PROGMEM
    └── index.h                         KofSprites 命名空间

src/
├── kof97_effect.cpp                    渲染 + 状态机 (~400 行)
├── main.cpp                            主循环 dispatch 加 KOF97
├── runtime_command_bus.cpp             prepare + dispatch + execute 三处
├── runtime_mode_coordinator.cpp        switchTo + deactivate + 白名单 四处
└── config_manager.cpp                  isStaticallyRecoverableBusinessModeTag 白名单
```

---

## 13. 关键经验 / 教训

| 教训 | 描述 |
|---|---|
| **背景色 + 分隔色都要先肉眼确认** | KOF sheet 粉背景 + 多种深紫分隔, 不能写死单一色 |
| **每张 sheet 帧布局都不一样** | Goro 5 帧 / Orochi 14 帧 / Joe 6 帧不等宽, 要 frameCount 表驱动 |
| **粉色判定要严** | 太宽会误删红色衣服 / 蓝色装饰; 收紧到"红+蓝都高 + 红蓝差小 + 绿明显低" |
| **缩放采样会渗色** | 缩前粉色 RGB 一并清零 + 缩后 8 邻居补色, 双重防线 |
| **脚底对齐是核心** | build 时画布底对齐 + 渲染时 footX/footY 用脚中心+基线 |
| **数据要终态压缩** | 全分辨率 1.15 MB 板载放不下; 屏上实际显示 20×23 就够了 |
| **base+delta 网页好处大** | 数据量减半 + 缺漏自补 + 帧间像素自动对齐 |
| **板载用展开后全帧** | 牺牲数据量换板载逻辑简洁 (60 KB vs 30 KB 都很小, 没差) |
| **GlxStepper 不显示就是样式冲突** | scoped `.form-row` 跟全局冲突, 删自定义样式让全局接管 |
| **Orochi 街机版没头像** | tcrf.net 标记 unused graphics, PS1 版才加; 用户单独搞图 |

---

## 14. 流程速查

> 把这一节当 "下次做新主题时的开发顺序"

1. **选型** (§1): 像素风原生 + 角色多 + 装饰加分 + 板载预算 < 100 KB
2. **素材采集** (§2): spriters / fightersgeneration / tcrf, 先肉眼确认背景色 + 分隔色
3. **切割** (§3): `cut-frames.js` 多色心 + 90% 阈值 + frameCount 表驱动
4. **头像** (§4): `heads-to-pixels.js` sharp nearest 缩到 5×4
5. **stance 数据** (§5): trim → 缩到终态 (20×23) → 8 邻居补色 → base+delta
6. **网页预览** (§6): TV_CONFIG 集中管 + 调试页调电视壳 + 定档常量
7. **客户端入口** (§7): 照抄模板 + GlxStepper / GlxSwitch + sendToDevice
8. **WS 通道** (§8): webSocket.js (×2) + 板载 prepareXxxTransaction 无参数模板
9. **板载移植** (§9): 6 步接入 (mode_tags / effect / command_bus / coordinator / config_manager / main) + build-firmware-sprites.js 展开 base+delta
10. **调试** (§11): 网页优先 / 调试页 / 板载串口

**核心原则**: 字段名网页/板载 1:1 (kyo/iori/.../orochi 索引 0..13), 不发明字段; 任何缺失先停下问用户, 不脑补.

---

> 最后更新: 2026-06
> 主要文件: `kof97Renderer.js` / `kof97Sprites.js` / `kof97Stances.js` / `Kof97.vue` / `kof97_effect.cpp` / `tv-frame-debug.html`
> 上一份关联文档: `docs/adventure-island-development-summary.md` (横版动作)
> 下一份关联文档: 后续主题时可参照 §14 速查
