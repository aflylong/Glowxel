# PC 模式页面统一规范（泰拉瑞亚结构）

## 目标

`pc` 端所有“模式页面”统一使用 [TerrariaClock.vue](/D:/project/Glowxel/website/src/views/TerrariaClock.vue) 的页面骨架。

这份规范只约束 `pc` 端模式页面，不改 `mobile` 页面，不改外围入口页面。

## 适用范围

仅适用于 `website/src/views/` 下的 `pc` 模式页：

- `PlanetScreensaver.vue`
- `SnakeMode.vue`
- `WaterWorld.vue`
- `MazeMode.vue`
- `SpiritScreen.vue`
- `TetrisClockSettings.vue`
- `TetrisSettings.vue`

`TerrariaClock.vue` 作为唯一参考页面，不再额外发明第二套结构。

## 必须统一的页面骨架

所有 `pc` 模式页都必须和 `TerrariaClock.vue` 保持同一层级结构。

### 1. 页面根节点

根节点必须是页面专属根类 + `glx-page-shell` + `game-mode-page`。

参考结构：

```vue
<div class="xxx-page glx-page-shell game-mode-page">
```

要求：

- 每个页面保留自己的根类名，例如 `planet-page`、`snake-page`
- 不允许依赖全局覆盖去统一背景、间距、布局
- 页面背景样式写在当前页面 `scoped style` 内

### 2. 顶部栏

顶部栏必须完整照着泰拉瑞亚页面来。

参考结构：

```vue
<header class="glx-section-card xxx-topbar">
  <button type="button" class="xxx-topbar__back">
    返回图标
  </button>
  <h1 class="xxx-topbar__title">页面标题</h1>
  <div class="xxx-topbar__spacer"></div>
</header>
```

要求：

- 左侧必须是返回按钮
- 中间必须是标题
- 右侧必须保留占位，确保标题真正居中
- 不允许标题和返回按钮重叠
- 不允许把返回按钮塞进内容卡片里

### 3. 主体布局

主体必须是和泰拉瑞亚一样的左右两列布局。

参考结构：

```vue
<section class="xxx-layout game-mode-layout">
  <article class="glx-section-card glx-section-card--stack xxx-preview-card game-preview-card">
    左侧预览区
  </article>

  <div class="xxx-config-stack game-mode-stack">
    右侧配置区
  </div>
</section>
```

要求：

- 左侧固定为“预览区”
- 右侧固定为“配置区”
- `pc` 端不能再做一列排到底
- 外层只统一骨架，不改页面业务逻辑

### 4. 左侧预览区

左侧预览区必须保持和泰拉瑞亚同样的组织方式。

最低要求：

1. 顶部说明头部
2. 发送区或状态区
3. 预览舞台区
4. 摘要信息区

推荐结构：

```vue
<article class="glx-section-card glx-section-card--stack xxx-preview-card game-preview-card">
  <div class="xxx-preview-card__head">
    标题说明
  </div>

  <div class="xxx-preview-toolbar">
    发送按钮 / 状态标签
  </div>

  <div class="xxx-preview-stage game-preview-stage">
    预览内容
  </div>

  <div class="xxx-summary-grid">
    摘要卡片
  </div>
</article>
```

要求：

- 发送按钮保留在左侧预览区，不要丢
- 预览区域优先保证展示面积
- 摘要区保持卡片化，不要散着堆文本
- 业务控件可因页面不同而不同，但分区顺序不变

### 5. 右侧配置区

右侧配置区必须和泰拉瑞亚一样，先 `tabs`，再按当前分组显示配置卡片。

参考结构：

```vue
<div class="xxx-config-stack game-mode-stack">
  <article class="glx-section-card glx-section-card--stack">
    tabs 区
  </article>

  <article class="glx-section-card glx-section-card--stack">
    当前 tab 的配置内容
  </article>
</div>
```

要求：

- 第一张卡片固定是模式分组和 `tabs`
- 后面的配置按当前 tab 切换
- 不允许把 `tabs` 放到底部
- 不允许把所有配置混成一个长表单

## 允许保留的内容

以下内容保留各页面自己的业务实现：

- 预览组件
- 业务按钮
- `tabs` 的具体项
- `stepper`
- 颜色选择
- 字体设置
- 页面发送逻辑
- 本地状态存储逻辑

原则：

- 统一的是“外层结构”
- 保留的是“页面业务控件”

## 明确禁止

以下做法全部禁止：

- 全局 CSS 覆盖
- 公共壳兜底覆盖
- 为了省事硬写响应式补丁
- 只改一部分导致结构半统一
- 把 `mobile` 样式顺手改掉
- 把 `pc` 页面继续做成单列长页面
- 未经约定自行抽象新的公共结构层
- 自行发明和泰拉瑞亚不同的布局层次

## 改造步骤

每个页面按同一顺序处理：

1. 先把顶部栏改成泰拉瑞亚结构
2. 再把主体改成左右两列
3. 再把左侧预览区拆成“头部 / 发送状态 / 预览 / 摘要”
4. 再把右侧配置区改成“tabs 卡 + 当前配置卡”
5. 最后只在当前页面内补局部样式

## 执行顺序

后续页面按下面顺序逐个改：

1. `PlanetScreensaver.vue`
2. `SnakeMode.vue`
3. `WaterWorld.vue`
4. `MazeMode.vue`
5. `SpiritScreen.vue`
6. `TetrisClockSettings.vue`
7. `TetrisSettings.vue`

## 验收标准

页面完成后，必须同时满足：

- 大体结构和 `TerrariaClock.vue` 一模一样
- `pc` 端是左右两列，不是一列到底
- 左侧有完整预览区和发送区
- 右侧是 `tabs + 卡片配置`
- 页面样式只在本页生效
- `mobile` 页面原样不动
