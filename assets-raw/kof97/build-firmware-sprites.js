/**
 * 生成 KOF97 板载 PROGMEM 资产
 *
 * 输入: website/src/utils/kof97Stances.js + kof97Sprites.js
 * 输出:
 *   esp32-firmware/include/theme_assets/kof97/kof97_sprite_types.h
 *   esp32-firmware/include/theme_assets/kof97/sprites_stances.h
 *   esp32-firmware/include/theme_assets/kof97/sprites_heads.h
 *   esp32-firmware/include/theme_assets/kof97/index.h
 *
 * 数据格式 (与冒险岛一致, fmt=5):
 *   每像素 5 字节: [x, y, r, g, b]
 *   只存非空像素
 *
 * stance 处理: base + delta 在 build 阶段展开成独立全帧
 *   板载只需查 stance[charKey][frameIdx], 不需要运行时合成
 *
 * 用法: node build-firmware-sprites.js
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const STANCES_JS = path.join(__dirname, '..', '..', 'website', 'src', 'utils', 'kof97Stances.js');
const SPRITES_JS = path.join(__dirname, '..', '..', 'website', 'src', 'utils', 'kof97Sprites.js');
const OUT_DIR = path.join(__dirname, '..', '..', 'esp32-firmware', 'include', 'theme_assets', 'kof97');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// 14 个角色 + Joe 备用 (跟 kof97Renderer.js CHAR_KEYS 一致, 顺序也一致)
const CHAR_KEYS = [
  'kyo', 'iori', 'terry', 'andy', 'benimaru',
  'mai', 'ryo', 'goro', 'chang', 'choi',
  'shermie', 'yashiro', 'chizuru', 'orochi',
];

// 加载 ES module 输出的 KOF_STANCES / KOF_HEADS
async function loadModule(filepath, exportName) {
  const fileUrl = url.pathToFileURL(filepath).href;
  const mod = await import(fileUrl);
  return mod[exportName];
}

const KOF_STANCES = await loadModule(STANCES_JS, 'KOF_STANCES');
const KOF_HEADS = await loadModule(SPRITES_JS, 'KOF_HEADS');
const STANCE_SCALE = 0.225;
const CENTER_SAMPLE_POINTS = [
  [0.5, 0.5],
  [0.35, 0.35],
  [0.65, 0.35],
  [0.35, 0.65],
  [0.65, 0.65],
];
const DENSE_COVERAGE_THRESHOLD = 0.38;

// hex (#rrggbb 或 null) → [r, g, b] 或 null
function parseHex(s) {
  if (!s) return null;
  const r = parseInt(s.slice(1, 3), 16);
  const g = parseInt(s.slice(3, 5), 16);
  const b = parseInt(s.slice(5, 7), 16);
  return [r, g, b];
}

// pixel array (W*H 个 hex/null) → 非空像素列表 [{x,y,r,g,b}, ...]
function arrayToFmt5(pixels, W, H) {
  const out = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = pixels[y * W + x];
      if (!px) continue;
      const rgb = parseHex(px);
      if (!rgb) continue;
      out.push({ x, y, r: rgb[0], g: rgb[1], b: rgb[2] });
    }
  }
  return out;
}

function buildPalette(scaledFrames) {
  const colors = [];
  const indexByColor = new Map();
  for (const frame of scaledFrames) {
    for (const color of frame.pixels) {
      if (color === null || indexByColor.has(color)) {
        continue;
      }
      indexByColor.set(color, colors.length);
      colors.push(color);
    }
  }
  return { colors, indexByColor };
}

function arrayToPaletteFull(pixels, W, H, indexByColor) {
  const out = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const color = pixels[y * W + x];
      if (color === null) {
        continue;
      }
      const index = indexByColor.get(color);
      if (index === undefined) {
        throw new Error(`palette missing color ${color}`);
      }
      out.push({ pos: y * W + x, index });
    }
  }
  return out;
}

function arrayToPaletteDelta(prevPixels, pixels, W, H, indexByColor) {
  if (prevPixels.length !== pixels.length) {
    throw new Error(`palette delta input length mismatch: ${prevPixels.length} != ${pixels.length}`);
  }
  const out = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const index = y * W + x;
      const prev = prevPixels[index];
      const next = pixels[index];
      if (prev === next) {
        continue;
      }
      if (next === null) {
        out.push({ pos: y * W + x, op: 0, index: 0 });
        continue;
      }
      const colorIndex = indexByColor.get(next);
      if (colorIndex === undefined) {
        throw new Error(`palette missing delta color ${next}`);
      }
      out.push({ pos: y * W + x, op: 1, index: colorIndex });
    }
  }
  return out;
}

function applyPaletteFullToPixels(target, entries, W, H, palette) {
  target.fill(null);
  for (const p of entries) {
    if (p.pos >= W * H) {
      throw new Error(`palette full pixel out of bounds: ${p.pos} for ${W}x${H}`);
    }
    const color = palette[p.index];
    if (color === undefined) {
      throw new Error(`palette full color index out of bounds: ${p.index}`);
    }
    target[p.pos] = color;
  }
}

function applyPaletteDeltaToPixels(target, entries, W, H, palette) {
  for (const p of entries) {
    if (p.pos >= W * H) {
      throw new Error(`palette delta pixel out of bounds: ${p.pos} for ${W}x${H}`);
    }
    if (p.op === 0) {
      target[p.pos] = null;
      continue;
    }
    if (p.op !== 1) {
      throw new Error(`invalid palette delta op: ${p.op}`);
    }
    const color = palette[p.index];
    if (color === undefined) {
      throw new Error(`palette delta color index out of bounds: ${p.index}`);
    }
    target[p.pos] = color;
  }
}

function assertSamePixels(label, actual, expected) {
  if (actual.length !== expected.length) {
    throw new Error(`${label}: length mismatch ${actual.length} != ${expected.length}`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new Error(`${label}: pixel ${i} mismatch ${actual[i]} != ${expected[i]}`);
    }
  }
}

function verifyEncodedFrames(key, scaledFrames, encodedFrames, palette = null) {
  if (scaledFrames.length !== encodedFrames.length) {
    throw new Error(`${key}: encoded frame count mismatch`);
  }
  if (scaledFrames.length === 0) {
    throw new Error(`${key}: no stance frames`);
  }
  const W = scaledFrames[0].w;
  const H = scaledFrames[0].h;
  const reconstructed = new Array(W * H).fill(null);

  for (let i = 0; i < scaledFrames.length; i++) {
    if (scaledFrames[i].w !== W || scaledFrames[i].h !== H) {
      throw new Error(`${key}: frame ${i} size changed inside one stance`);
    }
    const encoded = encodedFrames[i];
    if (encoded.fmt === 7 || encoded.fmt === 9) {
      applyPaletteFullToPixels(reconstructed, encoded.entries, W, H, palette);
    } else if (encoded.fmt === 8 || encoded.fmt === 10) {
      applyPaletteDeltaToPixels(reconstructed, encoded.entries, W, H, palette);
    } else {
      throw new Error(`${key}: unsupported encoded fmt ${encoded.fmt}`);
    }
    assertSamePixels(`${key} frame ${i}`, reconstructed, scaledFrames[i].pixels);
  }
}

function rebuildFrame(base, deltas, frameIdx) {
  if (frameIdx === 0) return base.slice();
  const cur = base.slice();
  const d = deltas[frameIdx - 1];
  for (const k in d) cur[k] = d[k];
  return cur;
}

function addColorCount(colorCounts, color) {
  const current = colorCounts.get(color);
  colorCounts.set(color, current === undefined ? 1 : current + 1);
}

function getDominantColor(colorCounts) {
  let bestColor = null;
  let bestCount = -1;
  for (const [color, count] of colorCounts.entries()) {
    if (count > bestCount) {
      bestColor = color;
      bestCount = count;
    }
  }
  return bestColor;
}

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getFramePixel(framePixels, frameData, x, y) {
  return framePixels[y * frameData.w + x];
}

function sampleCenterArea(framePixels, frameData, sourceX0, sourceY0, sourceX1, sourceY1) {
  const colorCounts = new Map();
  const spanX = sourceX1 - sourceX0;
  const spanY = sourceY1 - sourceY0;

  for (const point of CENTER_SAMPLE_POINTS) {
    const x = clampInt(Math.floor(sourceX0 + spanX * point[0]), 0, frameData.w - 1);
    const y = clampInt(Math.floor(sourceY0 + spanY * point[1]), 0, frameData.h - 1);
    const color = getFramePixel(framePixels, frameData, x, y);
    if (color) {
      addColorCount(colorCounts, color);
    }
  }

  if (colorCounts.size === 0) {
    return null;
  }
  return getDominantColor(colorCounts);
}

function sampleDenseArea(framePixels, frameData, sourceX0, sourceY0, sourceX1, sourceY1) {
  const xStart = clampInt(Math.floor(sourceX0), 0, frameData.w - 1);
  const yStart = clampInt(Math.floor(sourceY0), 0, frameData.h - 1);
  const xEnd = clampInt(Math.ceil(sourceX1) - 1, 0, frameData.w - 1);
  const yEnd = clampInt(Math.ceil(sourceY1) - 1, 0, frameData.h - 1);
  const colorCounts = new Map();
  let sampleCount = 0;
  let opaqueCount = 0;

  for (let y = yStart; y <= yEnd; y++) {
    for (let x = xStart; x <= xEnd; x++) {
      sampleCount += 1;
      const color = getFramePixel(framePixels, frameData, x, y);
      if (color) {
        opaqueCount += 1;
        addColorCount(colorCounts, color);
      }
    }
  }

  if (sampleCount === 0 || opaqueCount / sampleCount < DENSE_COVERAGE_THRESHOLD) {
    return null;
  }
  return getDominantColor(colorCounts);
}

function collectNeighborColors(scaledPixels, width, height, x, y) {
  const colorCounts = new Map();
  const neighbors = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  for (const [dx, dy] of neighbors) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
      continue;
    }
    const color = scaledPixels[ny * width + nx];
    if (color) {
      addColorCount(colorCounts, color);
    }
  }

  return colorCounts;
}

function hasColorOnBothSides(scaledPixels, width, height, x, y, dx, dy) {
  const px = x - dx;
  const py = y - dy;
  const nx = x + dx;
  const ny = y + dy;
  if (px < 0 || px >= width || py < 0 || py >= height || nx < 0 || nx >= width || ny < 0 || ny >= height) {
    return false;
  }
  return !!scaledPixels[py * width + px] && !!scaledPixels[ny * width + nx];
}

function fillInternalPinholes(scaledPixels, width, height) {
  const nextPixels = scaledPixels.slice();

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      if (scaledPixels[index]) {
        continue;
      }

      const horizontal = hasColorOnBothSides(scaledPixels, width, height, x, y, 1, 0);
      const vertical = hasColorOnBothSides(scaledPixels, width, height, x, y, 0, 1);
      const diagonalA = hasColorOnBothSides(scaledPixels, width, height, x, y, 1, 1);
      const diagonalB = hasColorOnBothSides(scaledPixels, width, height, x, y, 1, -1);
      if (!(horizontal && vertical) && !(horizontal && (diagonalA || diagonalB)) && !(vertical && (diagonalA || diagonalB))) {
        continue;
      }

      const colorCounts = collectNeighborColors(scaledPixels, width, height, x, y);
      if (colorCounts.size > 0) {
        nextPixels[index] = getDominantColor(colorCounts);
      }
    }
  }

  return nextPixels;
}

function scaleFramePixels(frameData, framePixels, scale) {
  const scaledW = Math.max(1, Math.round(frameData.w * scale));
  const scaledH = Math.max(1, Math.round(frameData.h * scale));
  const scaledPixels = new Array(scaledW * scaledH).fill(null);

  for (let y = 0; y < scaledH; y++) {
    const sourceY0 = (y * frameData.h) / scaledH;
    const sourceY1 = ((y + 1) * frameData.h) / scaledH;
    for (let x = 0; x < scaledW; x++) {
      const sourceX0 = (x * frameData.w) / scaledW;
      const sourceX1 = ((x + 1) * frameData.w) / scaledW;

      let color = sampleCenterArea(framePixels, frameData, sourceX0, sourceY0, sourceX1, sourceY1);
      if (!color) {
        color = sampleDenseArea(framePixels, frameData, sourceX0, sourceY0, sourceX1, sourceY1);
      }
      if (!color) {
        continue;
      }
      scaledPixels[y * scaledW + x] = color;
    }
  }

  return {
    w: scaledW,
    h: scaledH,
    pixels: fillInternalPinholes(scaledPixels, scaledW, scaledH),
  };
}

// fmt5 字节数组 → C 字节字面量 (16 字节/行)
function fmt5BytesToC(fmt5List) {
  const bytes = [];
  for (const p of fmt5List) {
    bytes.push(p.x, p.y, p.r, p.g, p.b);
  }
  if (bytes.length === 0) return '  // (empty)';
  const lines = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    lines.push('  ' + chunk.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '));
  }
  return lines.join(',\n');
}

function paletteBytesToC(colors) {
  const bytes = [];
  for (const color of colors) {
    const rgb = parseHex(color);
    if (rgb === null) {
      throw new Error(`invalid palette color ${color}`);
    }
    bytes.push(rgb[0], rgb[1], rgb[2]);
  }
  if (bytes.length === 0) return '  // (empty)';
  const lines = [];
  for (let i = 0; i < bytes.length; i += 18) {
    const chunk = bytes.slice(i, i + 18);
    lines.push('  ' + chunk.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '));
  }
  return lines.join(',\n');
}

function paletteFrameBytesToC(entries, fmt) {
  const bytes = [];
  for (const p of entries) {
    const packedPos = fmt === 8 || fmt === 10
      ? (p.pos | (p.op ? 0x8000 : 0))
      : p.pos;
    if (fmt === 7) {
      bytes.push(packedPos & 0xff, (packedPos >> 8) & 0xff, p.index);
    } else if (fmt === 8) {
      bytes.push(packedPos & 0xff, (packedPos >> 8) & 0xff, p.index);
    } else if (fmt === 9) {
      bytes.push(packedPos & 0xff, (packedPos >> 8) & 0xff, p.index & 0xff, (p.index >> 8) & 0xff);
    } else if (fmt === 10) {
      bytes.push(packedPos & 0xff, (packedPos >> 8) & 0xff, p.index & 0xff, (p.index >> 8) & 0xff);
    } else {
      throw new Error(`unsupported palette fmt ${fmt}`);
    }
  }
  if (bytes.length === 0) return '  // (empty)';
  const lines = [];
  for (let i = 0; i < bytes.length; i += 20) {
    const chunk = bytes.slice(i, i + 20);
    lines.push('  ' + chunk.map(b => '0x' + b.toString(16).padStart(2, '0')).join(', '));
  }
  return lines.join(',\n');
}

function encodedFrameEntryBytes(fmt) {
  if (fmt === 7) return 3;
  if (fmt === 8) return 3;
  if (fmt === 9) return 4;
  if (fmt === 10) return 4;
  throw new Error(`unsupported encoded fmt ${fmt}`);
}

// ============================================================
// 1. 类型定义
// ============================================================
const typesH = `// KOF97 sprite 类型定义
// Generated by assets-raw/kof97/build-firmware-sprites.js
// 不要手改; 改 sprite 请重跑脚本
#pragma once

#include <Arduino.h>
#include <pgmspace.h>

struct KofSprite {
  uint8_t  w;
  uint8_t  h;
  uint16_t pixelCount;
  const uint8_t* pixels;
  uint8_t  fmt;     // 5 = head RGB, 7/8 = palette8 stance, 9/10 = palette16 stance
};

// 一个角色的 stance 动画: 多帧 sprite 数组
struct KofStanceSet {
  uint8_t frameCount;
  const KofSprite* const* frames;
  uint16_t paletteCount;
  const uint8_t* palette;
};
`;
fs.writeFileSync(path.join(OUT_DIR, 'kof97_sprite_types.h'), typesH);

// ============================================================
// 2. 头像 (5×4) - 14 个
// ============================================================
let totalHeadBytes = 0;
const headDecls = [];
const headRegistryRows = [];
let headsBody = `// KOF97 头像 sprite (5×4 像素, 14 个角色)
// Generated by build-firmware-sprites.js
#pragma once

#include "kof97_sprite_types.h"

`;

for (const key of CHAR_KEYS) {
  const data = KOF_HEADS[key];
  if (!data) {
    console.log(`× 头像缺失: ${key}, 跳过`);
    continue;
  }
  const fmt5 = arrayToFmt5(data.p, data.w, data.h);
  totalHeadBytes += fmt5.length * 5 + 16;
  const varName = `kHead_${key}`;
  headsBody += `// ${key}: ${data.w}×${data.h}, ${fmt5.length} pixels
static const uint8_t ${varName}Pixels[] PROGMEM = {
${fmt5BytesToC(fmt5)}
};
static const KofSprite ${varName} PROGMEM = {
  .w = ${data.w}, .h = ${data.h}, .pixelCount = ${fmt5.length},
  .pixels = ${varName}Pixels, .fmt = 5,
};

`;
  headDecls.push(varName);
  headRegistryRows.push(`  if (strcmp(key, "${key}") == 0) return &${varName};`);
}

fs.writeFileSync(path.join(OUT_DIR, 'sprites_heads.h'), headsBody);
console.log(`✓ sprites_heads.h: ${headDecls.length} 个头像, ≈ ${totalHeadBytes} B`);

// ============================================================
// 3. Stance 帧 - 14 个角色, 使用新版全帧数据预缩放后生成板载资源
// ============================================================
let totalStanceBytes = 0;
let totalFullStanceBytes = 0;
const stanceSetsRegistry = [];
const stanceFrameCounts = {};
let stancesBody = `// KOF97 stance 帧 sprite (展开 base + delta 后的独立全帧)
// Generated by build-firmware-sprites.js
#pragma once

#include "kof97_sprite_types.h"

`;

for (const key of CHAR_KEYS) {
  const data = KOF_STANCES[key];
  if (!data) {
    console.log(`× stance 缺失: ${key}, 跳过`);
    continue;
  }
  const { w, h, base, deltas } = data;
  const totalFrames = 1 + deltas.length;
  stanceFrameCounts[key] = totalFrames;
  const frameVars = [];
  const scaledFrames = [];
  const encodedFrames = [];

  for (let i = 0; i < totalFrames; i++) {
    const fullFramePixels = rebuildFrame(base, deltas, i);
    const scaledFrame = scaleFramePixels({ w, h }, fullFramePixels, STANCE_SCALE);
    if (i > 0) {
      const firstFrame = scaledFrames[0];
      if (scaledFrame.w !== firstFrame.w || scaledFrame.h !== firstFrame.h) {
        throw new Error(`${key}: scaled frame ${i} size changed from ${firstFrame.w}x${firstFrame.h} to ${scaledFrame.w}x${scaledFrame.h}`);
      }
    }
    scaledFrames.push(scaledFrame);
  }

  const palette = buildPalette(scaledFrames);
  const usePalette16 = palette.colors.length > 256;
  const fullFmt = usePalette16 ? 9 : 7;
  const deltaFmt = usePalette16 ? 10 : 8;
  totalStanceBytes += palette.colors.length * 3;
  stancesBody += `// ${key} palette: ${palette.colors.length} colors, ${usePalette16 ? '16-bit' : '8-bit'} indexes
static const uint8_t kStance_${key}Palette[] PROGMEM = {
${paletteBytesToC(palette.colors)}
};

`;

  for (let i = 0; i < totalFrames; i++) {
    const scaledFrame = scaledFrames[i];
    const fmt5 = arrayToFmt5(scaledFrame.pixels, scaledFrame.w, scaledFrame.h);
    totalFullStanceBytes += fmt5.length * 5 + 16;
    if (i === 0) {
      encodedFrames.push({
        fmt: fullFmt,
        entries: arrayToPaletteFull(scaledFrame.pixels, scaledFrame.w, scaledFrame.h, palette.indexByColor),
      });
    } else {
      encodedFrames.push({
        fmt: deltaFmt,
        entries: arrayToPaletteDelta(scaledFrames[i - 1].pixels, scaledFrame.pixels, scaledFrame.w, scaledFrame.h, palette.indexByColor),
      });
    }
  }
  verifyEncodedFrames(key, scaledFrames, encodedFrames, palette.colors);

  for (let i = 0; i < totalFrames; i++) {
    const scaledFrame = scaledFrames[i];
    const encodedFrame = encodedFrames[i];
    const frameByteCount = encodedFrame.entries.length * encodedFrameEntryBytes(encodedFrame.fmt);
    const pixelLiteral = paletteFrameBytesToC(encodedFrame.entries, encodedFrame.fmt);
    totalStanceBytes += frameByteCount + 16;
    const varName = `kStance_${key}_${i}`;
    stancesBody += `// ${key} frame ${i}: ${scaledFrame.w}x${scaledFrame.h}, fmt=${encodedFrame.fmt}, entries=${encodedFrame.entries.length}, bytes=${frameByteCount}
static const uint8_t ${varName}Pixels[] PROGMEM = {
${pixelLiteral}
};
static const KofSprite ${varName} PROGMEM = {
  .w = ${scaledFrame.w}, .h = ${scaledFrame.h}, .pixelCount = ${encodedFrame.entries.length},
  .pixels = ${varName}Pixels, .fmt = ${encodedFrame.fmt},
};

`;
    frameVars.push(varName);
  }
  // 该角色的 frame 指针数组
  stancesBody += `static const KofSprite* const kStance_${key}_Frames[] PROGMEM = {
  ${frameVars.map(v => '&' + v).join(',\n  ')}
};
static const KofStanceSet kStance_${key} PROGMEM = {
  .frameCount = ${totalFrames},
  .frames = kStance_${key}_Frames,
  .paletteCount = ${palette.colors.length},
  .palette = kStance_${key}Palette,
};

`;
  stanceSetsRegistry.push({ key, totalFrames, varName: `kStance_${key}` });
}

fs.writeFileSync(path.join(OUT_DIR, 'sprites_stances.h'), stancesBody);
console.log(`✓ sprites_stances.h: ${stanceSetsRegistry.length} 个角色, ≈ ${totalStanceBytes} B`);

// ============================================================
// 4. 主索引 (路由 + 角色清单数组)
// ============================================================
const indexH = `// KOF97 sprite 主索引
// Generated by build-firmware-sprites.js
#pragma once

#include <string.h>
#include "kof97_sprite_types.h"
#include "sprites_heads.h"
#include "sprites_stances.h"

namespace KofSprites {

// 角色 key 列表 (跟 website/src/utils/kof97Renderer.js CHAR_KEYS 顺序一致)
inline const char* charKey(uint8_t idx) {
  static const char* const kKeys[] = {
${CHAR_KEYS.map(k => `    "${k}"`).join(',\n')}
  };
  if (idx >= ${CHAR_KEYS.length}) return nullptr;
  return kKeys[idx];
}

inline uint8_t charCount() {
  return ${CHAR_KEYS.length};
}

// 用 idx 0..13 取头像
inline const KofSprite* getHeadByIndex(uint8_t idx) {
  switch (idx) {
${CHAR_KEYS.map((k, i) => `    case ${i}: return &kHead_${k};`).join('\n')}
    default: return nullptr;
  }
}

// 用 idx 0..13 取 stance 集合
inline const KofStanceSet* getStanceSetByIndex(uint8_t idx) {
  switch (idx) {
${CHAR_KEYS.map((k, i) => `    case ${i}: return &kStance_${k};`).join('\n')}
    default: return nullptr;
  }
}

// 取某角色的某一帧 sprite
inline const KofSprite* getStanceFrame(uint8_t charIdx, uint8_t frameIdx) {
  const KofStanceSet* set = getStanceSetByIndex(charIdx);
  if (set == nullptr) return nullptr;
  KofStanceSet copied;
  memcpy_P(&copied, set, sizeof(KofStanceSet));
  if (frameIdx >= copied.frameCount) return nullptr;
  KofSprite* p = nullptr;
  memcpy_P(&p, &copied.frames[frameIdx], sizeof(KofSprite*));
  return p;
}

}  // namespace KofSprites
`;
fs.writeFileSync(path.join(OUT_DIR, 'index.h'), indexH);
console.log(`✓ index.h`);

const totalKB = (totalHeadBytes + totalStanceBytes) / 1024;
console.log(`\n板载 PROGMEM 总占用估算: ${totalHeadBytes + totalStanceBytes} B = ${totalKB.toFixed(1)} KB`);
