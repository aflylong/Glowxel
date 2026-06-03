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
| 板载预算 | 资产可控, 不影响主固件 | ✅ 当前 KOF97 约 260 KB 级别 |

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
- ❌ **以为所有角色 sprite 帧数一致**: 旧版曾经只保留 5/6/14 帧; 新版改为真实动作帧, 14 个角色共 622 帧
- ❌ **以为 sprite sheet 帧间分隔色统一**: 实际有 #000000 / #470047 / #480048 / #580058 / #a700a7 等深紫族多种
- ❌ **以为可以保留全分辨率渲染**: 板载 Flash 占用会爆 (1.15 MB), 必须定档压缩

### 1.4 角色清单 (14 个最终)

| key | 文件名 | stance 帧数 | 备注 |
|---|---|---|---|
| kyo | `kyo.png` | 49 | 草薙京, 主角 |
| iori | `Iori.png` | 60 | 八神庵 |
| terry | `Terry.png` | 46 | Terry Bogard |
| andy | `Andy.png` | 34 | Andy Bogard |
| benimaru | `Benimaru.png` | 53 | 二阶堂红丸 |
| mai | `Mai.png` | 50 | 不知火舞 |
| ryo | `Ryo.png` | 51 | Ryo Sakazaki |
| goro | `Goro.png` | 21 | 大门五郎 |
| chang | `chang.png` | 17 | 张巨汉 |
| choi | `Choi.png` | 19 | 蔡宝奇 (像素少, 注意保护) |
| shermie | `Shermie.png` | 50 | Shermie |
| yashiro | `Yashiro.png` | 62 | 八汁色 |
| chizuru | `Chizuru.png` | 50 | 神乐千鹤 |
| orochi | `Orochi.png` | 60 | 大蛇 (boss) |

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
    │ 1. cleanCutBackgroundPixels (清理切图边缘背景色 + 计算 bbox)
    ▼
{ data, minX, minY, maxX, maxY, anchorX, footY }
    │
    │ 2. packFrameOnCanvas (按 body anchor + foot line 对齐)
    ▼
每个角色自己的透明画布 (原始像素尺寸, 不是固定 20×23)
    │
    │ 3. buildBaseAndDeltas
    ▼
KOF_STANCES[key] = { w, h, base, deltas }
```

新版网页端**保留原始透明画布**，在预览时按 `DEFAULT_PREVIEW_SCALE = 0.225` 投影到 64×64；板载端才由 `build-firmware-sprites.js` 再做 22.5% 缩放和 PROGMEM 编码。这样网页可以继续调角色大小/脚底位置，板载则只拿最终尺寸，两个目标不混在一起。

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
  w, h,
  base: [w*h 个 hex 或 null],     // 第 0 帧 = 关键帧
  deltas: [
    {idx_string: color_or_null, ...},   // 第 1 帧 vs base 的差异
    ...   // 共 frameCount-1 个 delta
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

### 5.5 网页原始帧 vs 板载终态帧 (★ 关键决策)

**初版**把全分辨率数据也直接塞进板载, Flash 占用会爆。现在拆成两层:

- 网页端: 保留原始透明画布 + base/delta, 预览时按 22.5% 缩放, 方便继续调样式。
- 板载端: 生成时直接缩到 22.5% 后再编码, 不把原始大图放进固件。

```js
const DEFAULT_PREVIEW_SCALE = 0.225;  // Kof97.vue
const STANCE_SCALE = 0.225;           // build-firmware-sprites.js
```

理由: 64×64 屏上实际只显示缩小后的角色，板载保留原始大图没有视觉收益，只会浪费 Flash。

| 方案 | Flash | 优劣 |
|---|---|---|
| 原始帧全量放板载 | MB 级 | ❌ 没必要, 会挤爆固件空间 |
| 22.5% RGB 全帧 | ~546 KB | ✅ 展示正常, 但空间偏大 |
| 22.5% RGB 差分 | ~462 KB | ✅ 无抽帧, 但颜色重复浪费 |
| 22.5% 调色板 + 差分 | ~339 KB | ✅ 无损, 空间继续下降 |
| **22.5% 调色板 + packed pos 差分 (当前)** | **~265 KB stance payload** | ✅ 无抽帧, 展示像素一致, 当前方案 |

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

### 6.2 电视壳配置入口: `TV_FRAME`

电视壳全部参数集中在顶部 `TV_FRAME` 对象, 调试页 JSON 也按这些字段输出。网页和板载要保持一致时, 先在 `tv-frame-debug.html` 调好, 再同步到 `kof97Renderer.js` 和 `kof97_effect.cpp` 的同名常量。

```js
const TV_FRAME = {
  sx0: 4, sy0: 4, scrw: 56, scrh: 46,
  bg: '#0a3870',
  tvBlack: '#1a1a1a',
  tvDark: '#0a0a0a',
  tvEdge: '#000000',
  panel: '#f0f0f0',
  p1Highlight: '#e80000',
  p2Highlight: '#3870ff',
  timeColor: '#dcb41e',
  baseTop: 52,
  baseBot: 59,
  baseLeft: 13,
  baseRightInset: 14,
  slotY0: 54,
  slotY1: 58,
  timeX: 31,
  timeY: 54,
  footTop: 63,
  footBot: 63,
  footLx0: 8,
  footLx1: 16,
  ledY: 62,
  led1x: 18,
  led2x: 22,
  led3x: 26,
  led4x: 45,
  charXLeft: 14,
  charXRight: 40,
  charY: 43,
};
```

### 6.3 角色 stance 配置

当前网页端保留了调试控件:
- P1/P2 缩放默认 `0.225`, 范围 `0.1..0.3`, 步进 `0.005`
- 角色 Y 默认 `43`, 范围 `20..48`
- 板载端使用生成后的 22.5% 像素, 不再运行时缩放

```js
const CHARACTER_LAYOUT = {
  p1X: TV_FRAME.charXLeft,
  p2X: TV_FRAME.charXRight,
  footY: TV_FRAME.charY,
  charFrameInterval: 4,
  selectInterval: 1,
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
  - 取 P1/P2 当前角色 frameCount 的较大值作为 totalFrames
  - charTimer >= 4 → charFrame++ (stance 推进)
  - 短帧角色用 charFrame % 自己的 frameCount 循环
  - charFrame 播到 totalFrames 后才切换 P1/P2
```

这个逻辑是为了解决两个角色帧数不一致的问题: 帧少的一方会循环重播, 帧多的一方播完一轮后两边一起切换。

### 6.5 时间字体 (3×5)

`FONT_3x5` 常量定义 0-9 + `:` 字模。当前时间色是偏黄的 `#dcb41e`, 位置为 `timeX=31,timeY=54`, 由绘制函数按文本宽度做居中偏移。

### 6.6 调试页 (`tv-frame-debug.html`)

**纯前端 file:// 打开**, 双击即可, 无需启动服务器.

调试页**只调电视壳**:
- 控件 (sx0/sy0/scrw/scrh + 4 颜色 + 圆角 + 颈部 + 底座 + LED + 时间 + 底脚)
- 任何控件改动 → 立即重画 + 实时更新底部 JSON
- 10 个一键应用的电视壳预设主题 (深蓝黑 / 米白 / GB灰 / 红木 / **街机黑红** / 黄机壳 / FC灰白 / 洋红 / 军绿 / 冰蓝)

调好的 JSON 直接同步到 `kof97Renderer.js TV_FRAME` 和 `kof97_effect.cpp` 对应常量。

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
    sprites_bg.h                       // 电视屏幕背景图 (64×64 内屏实际像素)
    sprites_stances.h                  // 14 角色 stance 帧, 调色板 + packed pos 差分
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

头像仍然用 **fmt=5**: 每像素 5 字节 `[x, y, r, g, b]`, 只存非空像素。

stance 使用新版无损压缩格式:
- `fmt=7`: palette8 full, 每条 `[posLo,posHi,colorIndex8]`
- `fmt=8`: palette8 delta, 每条 `[packedPosLo,packedPosHi,colorIndex8]`
- `fmt=9`: palette16 full, 每条 `[posLo,posHi,colorIndexLo,colorIndexHi]`
- `fmt=10`: palette16 delta, 每条 `[packedPosLo,packedPosHi,colorIndexLo,colorIndexHi]`

delta 的 `packedPos` 高位 `0x8000` 表示 set, 未置位表示 clear; 低位是 `y*w+x`。palette8 用 3 字节/entry, palette16 用 4 字节/entry。这样没有抽帧, 也没有改最终显示像素, 只是把颜色从 RGB 重复存储改成“索引 + 每角色调色板”。

```cpp
struct KofSprite {
  uint8_t  w;
  uint8_t  h;
  uint16_t pixelCount;
  const uint8_t* pixels;
  uint8_t  fmt;     // 5 = head RGB, 7/8 = palette8 stance, 9/10 = palette16 stance
};

struct KofStanceSet {
  uint8_t frameCount;
  const KofSprite* const* frames;
  uint16_t paletteCount;
  const uint8_t* palette;
};
```

### 9.4 build-firmware-sprites.js (★ 关键决策)

**问题**: 新版动作帧涨到 622 帧, 如果全部按 RGB 全帧存, 数据量明显偏大。

**决策**: 板载使用“22.5% 终态缩放 + 每角色调色板 + packed position + 差分帧”。生成脚本会逐像素重建校验, 校验不通过就拒绝写出。

生成顺序:
1. 从 `website/src/utils/kof97Stances.js` 的原始透明画布重建每帧。
2. 按 `STANCE_SCALE = 0.225` 缩到板载终态尺寸。
3. 每角色收集 palette, 颜色数 <= 256 用 palette8, 否则用 palette16。
4. 第 0 帧写 full, 后续帧只写相对上一帧的 set/clear delta。
5. 用解码器重建每一帧并和缩放结果逐像素比对。

当前统计:

| 项 | 当前值 |
|---|---:|
| 角色数 | 14 |
| stance 总帧数 | 622 |
| fmt 分布 | fmt7=12, fmt8=488, fmt9=2, fmt10=120 |
| stance payload | 245,702 B |
| stance + palette 估算 | ~265,299 B |
| 头像 + stance 估算 | ~266,638 B (约 260.4 KB) |
| `sprites_stances.h` 文本大小 | 1,735,588 B |

### 9.5 渲染主体模板

```cpp
namespace {
  // 头像绘制 (5×4 直接用 fmt=5)
  void drawSpriteAt(const KofSprite* sprite, int dx, int dy, bool mirror);

  // stance 先按 fmt=7/8/9/10 重建到 StanceBuffer, 再绘制
  bool rebuildStanceFrame(uint8_t charIdx, uint8_t frameIdx, StanceBuffer& buffer);
  void drawStanceFrame(int footX, int footY, uint8_t charIdx, uint8_t frameIdx, bool mirror);
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

### 9.8 帧率与切换规则

当前网页和板载都使用:

```cpp
constexpr uint8_t  CHAR_FRAME_INTERVAL = 4;
constexpr uint16_t SELECT_INTERVAL     = 1;
```

角色切换不是按固定秒数, 而是等 P1/P2 当前组合里“帧数更多的一方”播完。帧数少的一方会用 `% frameCount` 循环重播, 直到较长动画播完才一起随机切换。这样 17 帧角色和 62 帧角色同屏时, 不会出现长角色动作被提前截断。

### 9.9 字段差异速记表

| 类型 | 网页 | 板载 |
|---|---|---|
| 角色 key | `'kyo'` / `'iori'` 字符串 | uint8_t 0..13 索引 |
| stance 帧 | 原始画布 base/delta, 预览时 22.5% 缩放 | PROGMEM palette full/delta, 渲染前重建到 StanceBuffer |
| 头像 | `KOF_HEADS[key]` 字符串查 | `KofSprites::getHeadByIndex(idx)` 数字查 |
| 时间字符串 | `state.timeText` (JS Date) | `s_state.timeText` (RTC + snprintf) |
| 镜像翻 | `pixels[(W-1-x)+y*W]` | `mirror ? (W-1-x) : x` |

---

## 10. 性能与资源

### 10.1 Flash 占用

```
sprites_stances.h    1,735,588 B 文本 / ~265 KB stance+palette payload
sprites_heads.h      14 头像 5×4, 约 1.3 KB payload
sprites_bg.h         电视屏幕背景, 约 7.5 KB 像素数据
其他 (types/index)    结构体/索引, 极小
─────────────────────────────────
板载 KOF97 资产估算 ≈ 270 KB 级别
```

注意: `.h` 文本大小不等于最终 Flash payload。C 数组源码因为 `0x12, ` 文本展开会显得很大, 真正进 PROGMEM 的是字节数组本身。

### 10.2 RAM 占用

```
SceneState s_state             ~32 字节
StanceBuffer                   64×64 opaque + 64×64 RGB565 ≈ 12 KB
PRNG s_prng                    4 字节
─────────────────────────────────
模式增量 ≈ 12 KB + 少量状态 (共用 DisplayManager::animationBuffer)
```

`StanceBuffer` 是这次换成差分帧后的必要运行时缓存: 每帧先从 palette full/delta 重建到 buffer, 再按脚中心和基线画到屏幕。好处是 Flash 省得多, RAM 成本在 ESP32 侧仍可接受。

### 10.3 渲染耗时估算 (单帧)

| 阶段 | 像素数 | 估时 |
|---|---|---|
| 屏幕背景 56×43 | 2408 | ~0.8 ms |
| 头像 14 格 × ~25 像素 | 350 | ~0.1 ms |
| stance 重建 × 2 | 取决于当前帧差分条目 | 通常很小 |
| 角色 stance × 2 | 角色实际缩放后像素 | ~0.1-0.3 ms |
| 电视壳 (黑边+底座+LED+底脚) | ~1500 | ~0.5 ms |
| 时间字 (3×5 × 5 字符) | ~80 | ~0.05 ms |
| presentOffscreenFrame | dirty diff + flip | ~1-2 ms |
| **合计** | | **仍是可控的毫秒级** |

剩余 30 ms / 帧给 WiFi/WebSocket/DMA, 完全够.

---

## 11. 泰拉瑞亚资源优化观察

这次已经实施第一阶段优化: **只优化 boss 动画 set 像素存储**, 不抽帧, 不改 WebSocket/API/协议。优化空间主要集中在 boss 动画:

| 文件 | 文本大小 |
|---|---:|
| `esp32-firmware/include/theme_assets/terraria/sprites_bosses.h` | 2,847,740 B (优化后) |
| `sprites_wings.h` | 178,914 B |
| `sprites_misc.h` | 149,497 B |
| `sprites_biomes.h` | 61,065 B |

`sprites_bosses.h` 是明显大头。它由 `uniapp/tools/build-bosses-firmware-from-compact.js` 从 `uniapp/static/terraria/bosses_compact.js` 生成, 当前 boss 专用格式是 `TerrariaSpriteAnim + TerrariaFrameBlock(setPixels + clearPixels)`:

- set 像素: `fmt=8/9`, 每像素 `[pos,paletteIndex]`, 其中 `fmt=8` 为 3 字节, `fmt=9` 为 4 字节。
- clear 像素: 每像素 `[x,y]`, 2 字节。
- 坐标已经预烘焙在 64×64 屏幕内, 所以 x/y 都是 8-bit, 不需要大坐标格式。

只读统计结果:

| 项 | 当前值 |
|---|---:|
| boss 数 | 33 |
| boss 总帧数 | 274 |
| set 像素 | 132,347 px / 661,735 B |
| clear 像素 | 14,781 px / 29,562 B |
| 优化前二进制 payload | 691,297 B |
| 优化后生成脚本实测 payload | 443.3 KB |
| 全局颜色数 | 3,151 |
| 单 boss 最大颜色数 | 927 (`pumpking`) |
| fmt 分布 | fmt8=32, fmt9=1 |

已完成:

1. **packed position**: `x,y` 合成 `pos=y*64+x`。
2. **每 boss 调色板索引**: 32 个 boss 用 palette8, `pumpking` 用 palette16。
3. **逐帧重建校验**: 生成脚本会把新编码解回旧 RGB888 像素, 对每个 boss 每帧逐像素比对, 通过后才覆盖 `sprites_bosses.h`。

后续可继续优化:

1. **set/clear 合并 delta 流**: 像 KOF97 一样用 packedPos 高位表示 set/clear, 少一组 clear 数组和部分结构开销。最终显示不变。
2. **RGB565 存储**: 对 LED 面板最终 `color565` 显示基本无差异, 但严格说不是 RGB888 源像素无损。若目标是“最终板载显示不变”可以考虑; 若目标是“源数据逐 RGB888 可还原”则先不做。

按现有统计粗估:

| 方案 | payload 粗估 | 影响展示 |
|---|---:|---|
| 优化前 RGB fmt=5 + clear | 691,297 B | 旧效果 |
| 当前 palette8/16 + packed pos | 443.3 KB | RGB888 逐帧校验一致 |
| packed pos + RGB565 | ~559 KB 级别 | 板载最终显示基本不变, 但非 RGB888 无损 |

如果后续继续动泰拉瑞亚, 仍必须先做覆盖验证:

1. 生成脚本先写到内存或临时文件, 不直接覆盖 `sprites_bosses.h`。
2. 校验 boss 数、frame 数、set/clear 总像素覆盖度不减少。
3. 用旧格式和新格式分别重建 64×64 帧, 对每个 boss 每帧逐像素比对。
4. 验证通过后再覆盖生成数据, 并同步 `terraria_sprite_types.h` / `terraria_clock_effect.cpp` 解码逻辑。

这个方向和 KOF97 一样: 不抽帧, 不牺牲动画完整性, 只改变板载存储方式。

---

## 12. 冒险岛资源优化记录

冒险岛已经完成一轮无损板载资源优化: **把每像素 RGB 重复存储改成全局调色板索引 + packed position**, 不抽帧, 不改 WebSocket/API/协议, 不改变最终显示像素。

当前板载 sprite 仍然只暴露 `index.h` 里已有的 53 个 key, 没有把网页端额外存在但板载未引用的资源顺手加进去。生成脚本会从 `index.h` 读取 key -> symbol 映射, 再从 `website/src/utils/adventureIslandSprites.js` 取同名源数据。

格式变化:

| 格式 | 每像素数据 | 用途 |
|---|---|---|
| `fmt=5` | `[x,y,r,g,b]` 5 字节 | 旧格式, 解码器仍保留兼容 |
| `fmt=8` | `[pos_lo,pos_hi,palette_idx]` 3 字节 | 当前冒险岛生成格式, `pos=y*w+x` |

实测结果:

| 项 | 优化前 | 优化后 |
|---|---:|---:|
| sprite 数 | 53 | 53 |
| 全局颜色数 | - | 12 |
| 像素 payload | 77,985 B | 46,827 B |
| 节省 | - | 31,158 B (约 40%) |

生成后主要头文件文本大小:

| 文件 | 优化后文本大小 |
|---|---:|
| `sprites_higgins.h` | 104,252 B |
| `sprites_bg.h` | 72,855 B |
| `sprites_enemies.h` | 47,634 B |
| `sprites_items.h` | 40,421 B |
| `sprites_obstacles.h` | 25,666 B |
| `sprites_digits.h` | 11,054 B |
| `sprites_palette.h` | 471 B |

校验策略:

1. 解析当前板载旧头文件中的 `AISprite` 和像素数组。
2. 从网页源 sprite 生成 `fmt=8` 新数据。
3. 用全局 palette 把新数据解回 `x/y/r/g/b`。
4. 对 `index.h` 暴露的每个 key 比较宽高、pixelCount、每个像素位置和 RGB。
5. 全部一致后才覆盖生成文件。

板载渲染侧只新增统一读取函数 `readSpritePixel()`: `drawSprite()` 的 1:1 路径、缩放 LUT 路径、背景缓存路径都通过它读取像素。这样背景 `bg.tile` 也能使用压缩格式, 不会出现角色正常但背景丢失的问题。

这套方案对展示没有影响: 颜色仍然按 RGB888 从 palette 还原, 坐标由 `pos` 还原, 只是存储时不再对每个像素重复写 3 个颜色字节。

---

## 13. 调试套路

### 13.1 网页调试 (优先)

打开 `http://localhost:5174/#/kof97`, 看 stance 切换 / 选人光标 / 时间.

**关键日志点**:
- 选人切换: `console.log('select P1=', state.selectP1, 'P2=', state.selectP2)`
- stance 帧推进: `console.log('charFrame=', state.charFrame)`
- 时间更新: `console.log('time=', state.timeText)`

### 13.2 调试页 (电视壳专用)

打开 `assets-raw/kof97/tv-frame-debug.html` (file://), 改控件实时看效果, 调好的 JSON 同步到 `TV_FRAME` 和板载常量。

### 13.3 板载真机调试

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

### 13.4 编译验证

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

## 14. 文件清单

### 14.1 资产层 (`assets-raw/kof97/`)

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
├── build-stance-data.js        stance → 原始透明画布 base+delta
├── build-firmware-sprites.js   22.5% stance → palette packed delta PROGMEM
├── tv-frame-debug.html         电视壳调试页
├── bg.png                      电视屏幕背景源图
├── bg-64x64.png                处理后的屏幕背景预览
└── kof97Stances.global.js      (auto-gen) 调试页用全局版
```

### 14.2 网页层 (`website/src/`)

```
views/mobile/Kof97.vue                  入口页 + 预览 + 发送按钮
utils/kof97Renderer.js                  渲染器 (TV_FRAME + CHARACTER_LAYOUT)
utils/kof97Sprites.js                   (auto-gen) 14 头像 5×4
utils/kof97Stances.js                   (auto-gen) 14 角色原始画布 stance
utils/webSocket.js                      startKof97 API
router/index.js                         加路由 /kof97
App.vue                                 isDevicePath 加 /kof 白名单
components/device/DeviceControlConsole.vue  加"拳皇 97"卡片
views/mobile/DeviceControl.vue          openKof97 跳转
public/kof97/bg.png                     网页端电视屏幕背景图
```

### 14.3 uniapp 层

```
uniapp/utils/webSocket.js               startKof97 API (单独加)
```

### 14.4 板载层 (`esp32-firmware/`)

```
include/
├── kof97_effect.h                      namespace 接口
├── mode_tags.h                         加 KOF97 常量
└── theme_assets/kof97/
    ├── kof97_sprite_types.h            KofSprite + KofStanceSet
    ├── sprites_heads.h                 14 头像 PROGMEM
    ├── sprites_bg.h                    电视屏幕背景 PROGMEM
    ├── sprites_stances.h               14 角色 palette/delta stance PROGMEM
    └── index.h                         KofSprites 命名空间

src/
├── kof97_effect.cpp                    渲染 + 状态机 (~400 行)
├── main.cpp                            主循环 dispatch 加 KOF97
├── runtime_command_bus.cpp             prepare + dispatch + execute 三处
├── runtime_mode_coordinator.cpp        switchTo + deactivate + 白名单 四处
└── config_manager.cpp                  isStaticallyRecoverableBusinessModeTag 白名单
```

---

## 15. 关键经验 / 教训

| 教训 | 描述 |
|---|---|
| **背景色 + 分隔色都要先肉眼确认** | KOF sheet 粉背景 + 多种深紫分隔, 不能写死单一色 |
| **每张 sheet 帧布局都不一样** | 新版按真实帧保留, 14 角色共 622 帧, 要用实际 frameCount 表驱动 |
| **粉色判定要严** | 太宽会误删红色衣服 / 蓝色装饰; 收紧到"红+蓝都高 + 红蓝差小 + 绿明显低" |
| **缩放采样会渗色** | 缩前粉色 RGB 一并清零 + 缩后 8 邻居补色, 双重防线 |
| **脚底对齐是核心** | build 时画布底对齐 + 渲染时 footX/footY 用脚中心+基线 |
| **网页和板载目标不同** | 网页保留原始画布方便调试; 板载只保留 22.5% 终态像素 |
| **base+delta 网页好处大** | 数据量下降 + 帧间像素自动对齐 |
| **板载要用可验证压缩** | palette + packed pos + delta 能在不抽帧、不改显示的前提下降低 Flash |
| **Terraria boss 也适合同类优化** | boss 动画已经是差分, 下一步应优先改存储格式, 不要先抽帧 |
| **冒险岛适合全局调色板索引** | 只有 12 个颜色, `fmt=8` 从 5 字节/像素降到 3 字节/像素, 显示不变 |
| **GlxStepper 不显示就是样式冲突** | scoped `.form-row` 跟全局冲突, 删自定义样式让全局接管 |
| **Orochi 街机版没头像** | tcrf.net 标记 unused graphics, PS1 版才加; 用户单独搞图 |

---

## 16. 流程速查

> 把这一节当 "下次做新主题时的开发顺序"

1. **选型** (§1): 像素风原生 + 角色多 + 装饰加分 + 板载预算可控
2. **素材采集** (§2): spriters / fightersgeneration / tcrf, 先肉眼确认背景色 + 分隔色
3. **切割** (§3): `cut-frames.js` 多色心 + 90% 阈值 + frameCount 表驱动
4. **头像** (§4): `heads-to-pixels.js` sharp nearest 缩到 5×4
5. **stance 数据** (§5): 清背景 → 原始画布对齐 → base+delta
6. **网页预览** (§6): TV_FRAME 集中管 + 调试页调电视壳 + 缩放/Y 滑块
7. **客户端入口** (§7): 照抄模板 + GlxStepper / GlxSwitch + sendToDevice
8. **WS 通道** (§8): webSocket.js (×2) + 板载 prepareXxxTransaction 无参数模板
9. **板载移植** (§9): 6 步接入 (mode_tags / effect / command_bus / coordinator / config_manager / main) + build-firmware-sprites.js 生成 palette/delta
10. **资源审计** (§11-§12): 大文件先做只读统计, 再决定是否改生成格式
11. **调试** (§13): 网页优先 / 调试页 / 板载串口

**核心原则**: 字段名网页/板载 1:1 (kyo/iori/.../orochi 索引 0..13), 不发明字段; 任何缺失先停下问用户, 不脑补.

---

> 最后更新: 2026-06
> 主要文件: `kof97Renderer.js` / `kof97Sprites.js` / `kof97Stances.js` / `Kof97.vue` / `kof97_effect.cpp` / `tv-frame-debug.html`
> 上一份关联文档: `docs/adventure-island-development-summary.md` (横版动作)
> 下一份关联文档: 后续主题时可参照 §16 速查

---

## 18. 素材转换与本地产物约定

KOF97 这套主题的素材流程分成两层:

1. `assets-raw/kof97/`
   只作为本地素材工位, 用来切帧、调锚点、预览电视壳、生成网页原始帧和板载头文件
2. 仓库正式产物
   只提交网页和固件真正需要的最终文件, 不提交大批中间 PNG / 调试预览 / 临时报告

当前转换链路:

1. `cut-frames.js`
   从角色原始 sheet 切出逐帧 PNG 到 `frames-out/`
2. `build-stance-data.js`
   把逐帧 PNG 对齐成网页端使用的原始透明画布 + base/delta
3. `build-firmware-sprites.js`
   把网页原始帧缩到板载终态尺寸, 再生成调色板 / packed position / delta 的固件头文件
4. `tv-frame-debug.html`
   只负责电视壳参数调试, 调好后手动同步到网页和板载常量

最终需要长期保留并提交的主要文件:

- `website/src/utils/kof97Stances.js`
- `website/public/kof97/bg.png`
- `website/public/kof97/stances.json`
- `esp32-firmware/include/theme_assets/kof97/sprites_stances.h`
- `esp32-firmware/include/theme_assets/kof97/sprites_bg.h`
- `esp32-firmware/include/theme_assets/kof97/kof97_sprite_types.h`
- `esp32-firmware/src/kof97_effect.cpp`

下面这些属于本地可再生产物, 文件很多, 不需要提交, 需要时删掉后可重新生成:

- `assets-raw/kof97/frames-out/`
- `assets-raw/kof97/juese-frames-preview/`
- `assets-raw/kof97/stance-anchor-debug/`
- `assets-raw/kof97/stance-data-preview/`
- `assets-raw/kof97/kof97Stances.global.js`
- `assets-raw/kof97/preview-stance-data.js`
- `assets-raw/kof97/frames-out-report.json`
- `assets-raw/kof97/juese-cut-report.json`
- `assets-raw/kof97/stance-build-report.json`

收尾规则:

- `assets-raw/` 默认不进正式提交
- 提交前优先保留脚本、原始素材、最终产物
- 逐帧 PNG、预览图、调试报告、临时平台目录都可以清理

---

## 17. 板载内存边界说明

这次 KOF97 / Adventure Island 资源优化里，真正踩到的不是 Flash，而是 **ESP32 的 `.dram0.bss` 运行时常驻内存**。

真实过程：

- 初始状态：链接失败，`.dram0.bss` 超出 **11776 bytes**
- 第一轮收缩后：还超 **512 bytes**
- 最终状态：成功编译通过
- 编译结果：`RAM 124192 / 327680 (37.9%)`，`Flash 2337129 / 4063232 (57.5%)`

这次说明了一个非常重要的边界：

- 资源文件变小，只代表 **Flash / PROGMEM** 可能下降
- 如果为了省 Flash 新增了“大块运行时缓冲”，**DRAM 反而可能暴涨**
- 对 ESP32 来说，`link error: .dram0.bss will not fit in region dram0_0_seg` 是硬失败，不是 warning

### 17.1 这次实际出问题的点

主要 DRAM 大头不是协议层，而是主题效果内部的静态缓存：

- `kof97_effect.cpp` 里的 `StanceBuffer`
- `adventure_island_effect.cpp` 里的背景缓存
- `adventure_island_effect.cpp` 里的缩放 LUT

所以以后做“资源优化”时，不能只看生成出来的 `.h` 文件大小，还要看：

1. 有没有新增 `static` 大数组
2. 有没有把稀疏像素先解码成稠密整屏/整图缓存
3. 有没有为了方便缩放、混合、重建而常驻一整块中间 buffer

### 17.2 以后必须遵守的优化原则

1. **先优化存储格式，再考虑运行时缓存**
   例如：palette、packed position、delta frame，这类优先级最高，因为它们主要省 Flash，不一定增加大块 DRAM。
2. **能按需解码，就不要全量展开**
   不要默认把 sprite、背景、动画帧先完整展开到 RGB888 大缓存里。
3. **能用 RGB565，就不要为了中间态保留 RGB888**
   最终板载显示本来就是 `color565`，中间缓存优先考虑 16-bit 形态。
4. **透明/占用标记优先用 bitmask，不要先上 1 byte / pixel**
   像这次 Adventure Island 的缩放 LUT，把逐像素 alpha 标记改成按行 bitmask，就拿回了最后的链接余量。
5. **真实资源上限要实测，不要用过大的保守值**
   这次 KOF97 的 stance 缓冲原来按 `64x64` 开，实际资源最大只需要覆盖 `35x57`。

### 17.3 每次做板载资源优化后的必做检查

每次修改以下任一类内容后，都必须重新编译检查：

- `esp32-firmware/include/theme_assets/*`
- `esp32-firmware/src/*_effect.cpp`
- 任何资源生成脚本
- 任何新增静态缓冲、LUT、背景缓存、差分重建缓存

检查步骤：

```bash
cd esp32-firmware
pio.cmd run
```

必须确认：

- 没有出现 `.dram0.bss will not fit in region dram0_0_seg`
- 没有出现 `region 'dram0_0_seg' overflowed`
- RAM 和 Flash 都在可接受范围内

建议标准：

- RAM 尽量控制在 **50% 以下**
- Flash 尽量控制在 **70% 以下**
- 如果某次优化让 DRAM 明显上升，就算 Flash 下降，也不能直接算“优化成功”

### 17.4 对后续主题的直接要求

后续 Terraria、冒险岛、其他板载主题都按同一条规则执行：

- **优先做无损存储压缩**
- **谨慎引入运行时缓存**
- **任何新增大缓冲都要先算大小，再编译验证**
- **不要只看资源文件大小下结论**

一句话总结：

> 对板载主题来说，Flash 边界和 DRAM 边界同样重要；省存储不能以挤爆运行时内存为代价。
