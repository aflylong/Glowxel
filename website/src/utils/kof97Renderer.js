/**
 * KOF '97 选人界面 + 电视机外壳 渲染器
 * 输入: state + animTimeSec → 输出 Map<"x,y", "#hex">
 *
 * ⚠️ 唯一改值入口: 下方 TV_CONFIG 常量
 *    所有 JSON 字段都映射成 TV_CONFIG.xxx, 其它地方不再有硬编码数值
 */

import { KOF_HEADS } from './kof97Sprites.js';
import { KOF_STANCES } from './kof97Stances.js';

const SCREEN_W = 64;
const SCREEN_H = 64;

// =============================================================
// ⚠️ 调试页 JSON ↔ 代码 的唯一映射表
// 改这里 = 同步 JSON. 字段名跟 tv-frame-debug.html 完全对应
// =============================================================
const TV_CONFIG = {
  // 屏幕区
  sx0: 4, sy0: 4, scrw: 56, scrh: 43,
  bg: '#0a3870',

  // 电视壳颜色 (街机黑红预设)
  tvBlack: '#1a1a1a',
  tvDark: '#0a0a0a',
  tvEdge: '#000000',
  tvLight: '#c00808',

  // 圆角削角像素 (左上 / 右上 / 左下 / 右下 各 N 个像素抠成 TV_DARK)
  corner: 1,

  // 颈部梯形 (屏幕下方过渡)
  neckOn: false,
  neckStartHalf: 3,
  neckRows: 3,

  // 底座
  baseOn: true,
  baseTop: 50,
  baseBot: 57,
  baseLeft: 12,
  baseRightInset: 12,
  slotY0: 52,
  slotY1: 56,

  // LED 灯
  ledOn: true,
  ledY: 60,
  led1x: 18, led1c: '#dcb41e',
  led2x: 22, led2c: '#8c8c91',
  led3x: 26, led3c: '#b41e1e',
  led4x: 46, led4c: '#50c83c',

  // 时间显示 (3×5 字体, HH:MM)
  timeOn: true,
  timeColor: '#00ff66',
  timeX: 23,
  timeY: 52,

  // 底脚
  footOn: true,
  footTop: 62,
  footBot: 63,
  footLx0: 8,
  footLx1: 16,
};

// 屏幕区方便引用 (drawScreen 也要用)
const SX0 = TV_CONFIG.sx0;
const SY0 = TV_CONFIG.sy0;
const SCRW = TV_CONFIG.scrw;
const SCRH = TV_CONFIG.scrh;

// 角色 stance 显示配置 (定档常量, 不再可调)
// 数据已经是终态压缩尺寸 (24×28), 渲染 1:1 不缩放
const KOF_CHAR_CONFIG = {
  charXLeft: 14,           // P1 脚的中心 x
  charXRight: 40,          // P2 脚的中心 x
  charY: 40,               // 脚的基线 y
  charFrameInterval: 6,    // 每 6 帧 (200ms) 切一次 stance
  p1Mirror: true,          // P1 镜像 (朝右), P2 不镜像 (朝左)
  p2Mirror: false,
};

// =============================================================
// 色板
// =============================================================
const C = {
  // 电视壳
  TV_BLACK: '#061220',
  TV_DARK: '#0c1626',
  TV_EDGE: '#19222b',
  TV_LIGHT: '#3c4650',
  LED_YEL: '#dcb41e',
  LED_GRAY: '#8c8c91',
  LED_RED: '#b41e1e',
  LED_GRN: '#50c83c',

  // 屏幕背景: KOF 经典深蓝 (单色, 不渐变)
  BG_BLUE: '#0a3870',

  // 老式 LED 绿 (时间显示)
  TIME_GRN: '#577f67',

  // 选中框 (KOF 经典 P1 红 / P2 蓝)
  HL_ORANGE: '#e80000',
  HL_BLUE: '#3870ff',

  // 头像边框白色
  PANEL: '#f0f0f0',

  // 13 个角色 key (跟 kof97Sprites.js 顺序一致) + orochi 共 14 个
  CHAR_KEYS: [
    'kyo', 'iori', 'terry', 'andy', 'benimaru',
    'mai', 'ryo', 'goro', 'chang', 'choi',
    'shermie', 'yashiro', 'chizuru', 'orochi',
  ],
};

// =============================================================
// 工具
// =============================================================
function setPx(pixels, x, y, hex) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H) return;
  if (!hex) return;
  pixels.set(`${x},${y}`, hex);
}
function fillRect(pixels, x0, y0, x1, y1, hex) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) setPx(pixels, x, y, hex);
}
function drawRectBorder(pixels, x0, y0, x1, y1, hex) {
  for (let x = x0; x <= x1; x++) { setPx(pixels, x, y0, hex); setPx(pixels, x, y1, hex); }
  for (let y = y0; y <= y1; y++) { setPx(pixels, x0, y, hex); setPx(pixels, x1, y, hex); }
}

// =============================================================
// 1. 屏幕内容: 选人界面
// =============================================================
function drawScreen(pixels, state) {
  // 1.1 屏幕背景 - KOF 经典深蓝纯色
  fillRect(pixels, SX0, SY0, SX0 + SCRW - 1, SY0 + SCRH - 1, TV_CONFIG.bg);

  // 1.2 头像区
  drawPortraits(pixels, state);

  // 1.3 角色 stance (屏幕中部, P1 左 P2 右)
  drawCharacters(pixels, state);
}

// =============================================================
// 屏幕中部角色 stance: P1 在左 (镜像翻面朝右) / P2 在右 (默认朝左)
// charY 是"基线 y" (脚踩这一行), 角色从 charY 往上画, 这样 P1/P2 高矮不一样脚也对齐
// =============================================================
function drawCharacters(pixels, state) {
  const cfg = KOF_CHAR_CONFIG;
  const p1Key = C.CHAR_KEYS[state.selectP1];
  const p2Key = C.CHAR_KEYS[state.selectP2];
  const fIdx = state.charFrame || 0;

  // P1 左侧
  const p1Data = KOF_STANCES[p1Key];
  if (p1Data) {
    drawStanceFrame(pixels, SX0 + cfg.charXLeft, SY0 + cfg.charY, p1Data, fIdx, cfg.p1Mirror);
  }
  // P2 右侧
  const p2Data = KOF_STANCES[p2Key];
  if (p2Data) {
    drawStanceFrame(pixels, SX0 + cfg.charXRight, SY0 + cfg.charY, p2Data, fIdx, cfg.p2Mirror);
  }
}

// 把差异帧角色画到指定位置 (1:1 渲染, 不缩放)
// frameData = { w, h, base: [...], deltas: [{idx:color,...}, ...] }
// footX = "脚中心 x", footY = "脚的基线 y"
function drawStanceFrame(pixels, footX, footY, frameData, frameIdx, mirror) {
  const { w, h, base, deltas } = frameData;
  const totalFrames = 1 + deltas.length;
  const fIdx = frameIdx % totalFrames;

  // 构建当前帧的像素数组: base 副本上叠加 delta
  const cur = base.slice();
  if (fIdx > 0) {
    const d = deltas[fIdx - 1];
    for (const k in d) cur[k] = d[k];
  }

  // 左上角: 水平 footX 居中 / 底行落在 footY
  const leftX = footX - Math.floor(w / 2);
  const topY = footY - h + 1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = cur[y * w + x];
      if (!px) continue;
      const drawX = mirror ? (w - 1 - x) : x;
      setPx(pixels, leftX + drawX, topY + y, px);
    }
  }
}

// =============================================================
// 头像区 6×2
// =============================================================
function drawPortraits(pixels, state) {
  // 头像本身 4×4, 加 1px 边框 → 单元 6×6
  const portraitW = 4, portraitH = 4;
  const borderW = 1;
  const cellW = portraitW + borderW * 2;   // 6
  const cellH = portraitH + borderW * 2;   // 6
  const gap = 1;
  const cols = 7, rows = 2;     // 14 格 (含 Orochi)
  const totalW = cols * cellW + (cols - 1) * gap;   // 7*6 + 6 = 48
  const totalH = rows * cellH + (rows - 1) * gap;   // 2*6 + 1 = 13
  const startX = SX0 + Math.floor((SCRW - totalW) / 2);
  const startY = SY0 + 2;

  for (let i = 0; i < cols * rows; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cellX = startX + c * (cellW + gap);
    const cellY = startY + r * (cellH + gap);
    // 边框颜色: 默认白色; P1 选中橙, P2 选中蓝
    let borderColor = C.PANEL;   // 白色边框
    if (i === state.selectP1) borderColor = C.HL_ORANGE;
    if (i === state.selectP2) borderColor = C.HL_BLUE;
    // 画边框 (整个单元 6×6)
    drawRectBorder(pixels, cellX, cellY, cellX + cellW - 1, cellY + cellH - 1, borderColor);
    // 画头像内容 (单元内偏 1px) - 用真 sprite
    if (i < C.CHAR_KEYS.length) {
      const key = C.CHAR_KEYS[i];
      const head = KOF_HEADS[key];
      if (head) drawSpritePixels(pixels, cellX + borderW, cellY + borderW, head);
    }
  }
}

// 把 4×4 sprite 数据画到指定位置
function drawSpritePixels(pixels, dx, dy, sprite) {
  const { w, h, p } = sprite;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = p[y * w + x];
      if (!px) continue;
      setPx(pixels, dx + x, dy + y, px);
    }
  }
}

// =============================================================
// 3×5 像素数字字体 (用于电视壳上的时间显示)
// =============================================================
const FONT_3x5 = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  ':': ['000', '010', '000', '010', '000'],   // 1 列宽生效 (中间列亮)
};

function drawText3x5(pixels, text, x, y, hex) {
  let cx = x;
  for (const ch of text) {
    const g = FONT_3x5[ch];
    if (!g) continue;
    const w = g[0].length;
    // 冒号特殊: 实际只用中间 1 列
    if (ch === ':') {
      for (let row = 0; row < 5; row++) {
        if (g[row][1] === '1') setPx(pixels, cx, y + row, hex);
      }
      cx += 1 + 1;   // 1 列宽 + 1 间距
    } else {
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < w; col++) {
          if (g[row][col] === '1') setPx(pixels, cx + col, y + row, hex);
        }
      }
      cx += w + 1;
    }
  }
}

// =============================================================
// 2. 电视壳 (覆盖屏幕外区域) - 全部读 TV_CONFIG, 没有硬编码
// =============================================================
function drawTvFrame(pixels, state) {
  const T = TV_CONFIG;

  // 上下黑边
  fillRect(pixels, 0, 0, SCREEN_W - 1, SY0 - 1, T.tvBlack);
  // 左右黑边 (屏幕区上下范围内)
  fillRect(pixels, 0, SY0, SX0 - 1, SY0 + SCRH - 1, T.tvBlack);
  fillRect(pixels, SX0 + SCRW, SY0, SCREEN_W - 1, SY0 + SCRH - 1, T.tvBlack);
  // 屏幕下方区域
  fillRect(pixels, 0, SY0 + SCRH, SCREEN_W - 1, SCREEN_H - 1, T.tvBlack);

  // 屏幕边框 (1px 内描边)
  drawRectBorder(pixels, SX0 - 1, SY0 - 1, SX0 + SCRW, SY0 + SCRH, T.tvEdge);

  // 圆角削角 (4 个角, 每个角 corner * corner 抠成 tvDark)
  const cn = T.corner;
  for (let i = 0; i < cn; i++) {
    for (let j = 0; j < cn - i; j++) {
      setPx(pixels, i, j, T.tvDark);
      setPx(pixels, SCREEN_W - 1 - i, j, T.tvDark);
      setPx(pixels, i, SCREEN_H - 1 - j, T.tvDark);
      setPx(pixels, SCREEN_W - 1 - i, SCREEN_H - 1 - j, T.tvDark);
    }
  }

  // 颈部梯形 (屏幕下方过渡)
  if (T.neckOn) {
    for (let r = 0; r < T.neckRows; r++) {
      const y = SY0 + SCRH + r;
      if (y >= SCREEN_H) break;
      const halfW = T.neckStartHalf + r;
      const cx = SCREEN_W / 2;
      fillRect(pixels, cx - halfW, y, cx + halfW - 1, y, T.tvDark);
    }
    // 颈部顶部高光
    fillRect(pixels, SCREEN_W / 2 - T.neckStartHalf, SY0 + SCRH,
             SCREEN_W / 2 + T.neckStartHalf - 1, SY0 + SCRH, T.tvEdge);
  }

  // 底座
  if (T.baseOn) {
    const bl = T.baseLeft;
    const br = SCREEN_W - 1 - T.baseRightInset;
    fillRect(pixels, bl, T.baseTop, br, T.baseBot, T.tvDark);
    fillRect(pixels, bl, T.baseTop, br, T.baseTop, T.tvEdge);  // 顶部高光
    fillRect(pixels, bl, T.baseTop + 1, bl, T.baseBot, T.tvEdge);
    fillRect(pixels, br, T.baseTop + 1, br, T.baseBot, T.tvEdge);
    // 中央光驱缝
    fillRect(pixels, bl + 6, T.slotY0, br - 6, T.slotY1, T.tvBlack);
    // 底座下沿黑边 (baseBot + 1 行)
    if (T.baseBot + 1 < SCREEN_H) {
      fillRect(pixels, bl, T.baseBot + 1, br, T.baseBot + 1, T.tvEdge);
    }
  }

  // 时间显示 (3×5 老式 LED 绿)
  if (T.timeOn && state && state.timeText) {
    drawText3x5(pixels, state.timeText, T.timeX, T.timeY, T.timeColor);
  }

  // LED 灯 (静态)
  if (T.ledOn) {
    setPx(pixels, T.led1x, T.ledY, T.led1c);
    setPx(pixels, T.led2x, T.ledY, T.led2c);
    setPx(pixels, T.led3x, T.ledY, T.led3c);
    setPx(pixels, T.led4x, T.ledY, T.led4c);
  }

  // 底脚
  if (T.footOn) {
    const lx0 = T.footLx0, lx1 = T.footLx1;
    fillRect(pixels, lx0, T.footTop, lx1, T.footBot, T.tvDark);
    fillRect(pixels, SCREEN_W - 1 - lx1, T.footTop, SCREEN_W - 1 - lx0, T.footBot, T.tvDark);
    fillRect(pixels, lx0, T.footTop, lx1, T.footTop, T.tvEdge);
    fillRect(pixels, SCREEN_W - 1 - lx1, T.footTop, SCREEN_W - 1 - lx0, T.footTop, T.tvEdge);
  }
}

// =============================================================
// 主渲染
// =============================================================
export function renderKof97Scene(state) {
  const pixels = new Map();
  // 1. 先画屏幕内容
  drawScreen(pixels, state);
  // 2. 再覆盖电视壳 (屏幕外的部分 + 时间)
  drawTvFrame(pixels, state);
  return pixels;
}

// =============================================================
// 状态机
// =============================================================
function fmtTime() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function createInitialState() {
  return {
    frame: 0,
    phase: 'select',  // select / locked
    selectP1: 0,      // 当前 P1 光标位置 (0..13)
    selectP2: 5,      // P2 光标位置
    selectTimer: 0,
    lockedP1: null,
    lockedP2: null,
    timeText: fmtTime(),
    charFrame: 0,     // stance 帧索引
    charTimer: 0,
  };
}

export function tickScene(state) {
  state.frame++;
  state.selectTimer++;
  state.charTimer++;

  // 每 30 帧 (1 秒) 刷新时间
  if (state.frame % 30 === 0) {
    state.timeText = fmtTime();
  }

  // stance 动画推进: 每 charFrameInterval 帧切一帧
  if (state.charTimer >= KOF_CHAR_CONFIG.charFrameInterval) {
    state.charTimer = 0;
    state.charFrame++;
  }

  // 选人光标动画: 每 150 帧 (5 秒) 随机切一次
  if (state.phase === 'select' && state.selectTimer >= 150) {
    state.selectTimer = 0;
    // 随机切一个新的位置 (避免和当前一样); 14 个角色 (13 + orochi)
    const N = 14;
    let nextP1 = Math.floor(Math.random() * N);
    while (nextP1 === state.selectP1) nextP1 = Math.floor(Math.random() * N);
    state.selectP1 = nextP1;
    // 调试: P2 锁同 P1, 看左右镜像是否对称
    state.selectP2 = nextP1;
  }
}
