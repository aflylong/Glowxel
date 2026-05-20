// ============================================================
// Terraria sprite 加载 / 切片 / 着色 / 像素绘制 (优化版)
//
// 资产从 8 个合并 .js 文件加载, 每个文件 module.exports = { spriteName: {w,h,pixels}, ... }
// 像素已是"渲染最小切片", 不需要二次切片 (除了多帧条带按帧索引取)
// ============================================================

// 8 个合并资产 (每个对应 esp32 调试页 exportOptimized 产出的 .js)
const ARMOR_HEADS_RAW    = require('../static/terraria/armor_heads.js');
const ARMOR_BODIES_RAW   = require('../static/terraria/armor_bodies.js');
const ARMOR_LEGS_RAW     = require('../static/terraria/armor_legs.js');
const WINGS_RAW          = require('../static/terraria/wings.js');
const WEAPONS_RAW        = require('../static/terraria/weapons.js');
const PLAYER_LAYERS_RAW  = require('../static/terraria/player_layers.js');
const SUMMON_GUARDIAN_RAW = require('../static/terraria/summon_guardian.js');
const SUMMON_EXTRAS_RAW  = require('../static/terraria/summon_extras.js');
const MISC_RAW           = require('../static/terraria/misc.js');

// 启动时把 base64 压缩格式解码成 pixels 数组
//   sprite 格式: { w, h, n: pixelCount, fmt: 5|7, b: base64String }
//     fmt=5: 每像素 5 字节 (x8, y8, r, g, b)  — 小 sprite (40×56 等)
//     fmt=7: 每像素 7 字节 (x16, y16, r, g, b) — 大 sprite (守卫 108×736)
//   解码后: { w, h, pixels: [[x,y,r,g,b,255], ...] }
function _b64ToU8(b64) {
  // 小程序 / H5 通用: atob → Uint8Array
  if (typeof uni !== 'undefined' && uni.base64ToArrayBuffer) {
    return new Uint8Array(uni.base64ToArrayBuffer(b64));
  }
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function _decodeSpriteIfNeeded(v) {
  if (!v || typeof v !== 'object') return v;

  // 多帧差异 sprite: { w, h, frameCount, fmt, base: {n,b}, deltas: [{n,b,cN?,cB?},...] }
  // delta 现在带 clear 段 (cN/cB) — 解决移动后旧位置残留 (重影)
  if (v.base && Array.isArray(v.deltas)) {
    const basePixels = _decodePixelBlock(v.base, v.fmt);
    // 预合成每一帧:
    //   frame 0 = base
    //   frame N = (base 像素去掉 delta[N-1].clear) 再覆盖 delta[N-1].set
    const frames = [basePixels];
    for (const delta of v.deltas) {
      const map = new Map();
      // 1) 先放 base 像素
      for (const px of basePixels) map.set(px[0] + ',' + px[1], px);
      // 2) clear 段: 删掉 base 的旧像素 (frame_i 不再占的位置)
      if (delta.cN && delta.cB) {
        const cu8 = _b64ToU8(delta.cB);
        const cstride = (v.fmt === 7) ? 4 : 2;
        for (let i = 0; i < delta.cN; i++) {
          const o = i * cstride;
          let cx, cy;
          if (v.fmt === 7) {
            cx = cu8[o] | (cu8[o+1] << 8);
            cy = cu8[o+2] | (cu8[o+3] << 8);
          } else {
            cx = cu8[o]; cy = cu8[o+1];
          }
          map.delete(cx + ',' + cy);
        }
      }
      // 3) set 段: 覆盖 / 新增
      const setPixels = _decodePixelBlock({ n: delta.n, b: delta.b }, v.fmt);
      for (const px of setPixels) map.set(px[0] + ',' + px[1], px);
      frames.push(Array.from(map.values()));
    }
    const out = { w: v.w, h: v.h, frameCount: v.frameCount, frames };
    if (v.frameStart != null) out.frameStart = v.frameStart;
    return out;
  }

  // 单帧 sprite: { w, h, fmt, n, b } — 即使 n=0 (空 sprite) 也要返回 pixels: []
  if (v.fmt !== undefined && v.n !== undefined) {
    const pixels = v.n > 0 ? _decodePixelBlock({ n: v.n, b: v.b }, v.fmt) : [];
    return { w: v.w, h: v.h, pixels };
  }

  // 元信息字段
  return v;
}

function _decodePixelBlock(block, fmt) {
  const u8 = _b64ToU8(block.b);
  const n = block.n;
  const stride = fmt === 7 ? 7 : 5;
  const pixels = new Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * stride;
    if (fmt === 7) {
      const x = u8[o] | (u8[o+1] << 8);
      const y = u8[o+2] | (u8[o+3] << 8);
      pixels[i] = [x, y, u8[o+4], u8[o+5], u8[o+6], 255];
    } else {
      pixels[i] = [u8[o], u8[o+1], u8[o+2], u8[o+3], u8[o+4], 255];
    }
  }
  return pixels;
}

function _decodeBundle(raw) {
  const out = {};
  for (const key of Object.keys(raw)) {
    out[key] = _decodeSpriteIfNeeded(raw[key]);
  }
  return out;
}

const ARMOR_HEADS    = _decodeBundle(ARMOR_HEADS_RAW);
const ARMOR_BODIES   = _decodeBundle(ARMOR_BODIES_RAW);
const ARMOR_LEGS     = _decodeBundle(ARMOR_LEGS_RAW);
const WINGS          = _decodeBundle(WINGS_RAW);
const WEAPONS        = _decodeBundle(WEAPONS_RAW);
const PLAYER_LAYERS  = _decodeBundle(PLAYER_LAYERS_RAW);
const SUMMON_GUARDIAN = _decodeBundle(SUMMON_GUARDIAN_RAW);
const SUMMON_EXTRAS  = _decodeBundle(SUMMON_EXTRAS_RAW);
const MISC           = _decodeBundle(MISC_RAW);

// 网格位映射 (armor_bodies.js / player_layers.js 内嵌的 _gridIndex)
const ARMOR_BODY_GRID_INDEX = ARMOR_BODIES._gridIndex || {
  torso: 0, back_arm: 1, back_shoulder: 2,
  front_arm: 3, front_shoulder: 4, back_arm_holding: 5,
};
const PLAYER_GRID_INDEX = PLAYER_LAYERS._gridIndex || {
  torso: 0, back_arm: 1, back_shoulder: 2,
  front_arm: 3, front_shoulder: 4,
};
const PLAYER_GRID_LAYERS = PLAYER_LAYERS._gridLayers || [3, 4, 5, 6, 7, 8, 9, 13];

// 通用 sprite getter (按名字索引到合并文件里)
//   armor_head_171 / armor_body_177 / armor_legs_112 / wings_29 / item_4956
//   player_0_3 / projectile_623 / biome_forest_0 / dust_242_f0 / extra_171
export function getSprite(name) {
  if (name.startsWith('armor_head_')) return ARMOR_HEADS[name];
  if (name.startsWith('armor_body_')) return ARMOR_BODIES[name];
  if (name.startsWith('armor_legs_')) return ARMOR_LEGS[name];
  if (name.startsWith('wings_'))      return WINGS[name];
  if (name.startsWith('item_'))       return WEAPONS[name];
  if (name.startsWith('player_0_'))   return PLAYER_LAYERS[name];
  if (name === 'projectile_623')      return SUMMON_GUARDIAN.projectile_623;
  if (name === 'stardust_dragon')    return SUMMON_EXTRAS.stardust_dragon;
  if (name === 'empress_blade')      return SUMMON_EXTRAS.empress_blade;
  return MISC[name] || null;  // biome_forest_*, dust_242_f0, extra_171
}

export function preloadAll() {
  // 合并文件已经在 require 时同步加载, 这里只做计数
  let count = 0;
  count += Object.keys(ARMOR_HEADS).filter(k => !k.startsWith('_')).length;
  count += Object.keys(ARMOR_BODIES).filter(k => !k.startsWith('_')).length;
  count += Object.keys(ARMOR_LEGS).length;
  count += Object.keys(WINGS).length;
  count += Object.keys(WEAPONS).length;
  count += Object.keys(PLAYER_LAYERS).filter(k => !k.startsWith('_')).length;
  count += 1;  // guardian
  count += Object.keys(MISC).length;
  return count;
}

// ============================================================
// 切片工具 — 优化版资产已是切好的, 但多帧条带还要按帧索引取
// ============================================================

const FRAME_W = 40;
const FRAME_H = 56;

// 从 sprite 中切出指定矩形的像素列表
function cropSprite(sprite, sx, sy, sw, sh) {
  if (!sprite || !sprite.pixels) return [];
  const out = [];
  for (const [x, y, r, g, b, a] of sprite.pixels) {
    if (x < sx || x >= sx + sw) continue;
    if (y < sy || y >= sy + sh) continue;
    out.push([x - sx, y - sy, r, g, b, a]);
  }
  return out;
}

// armor_bodies / player_layers 网格位取 (按 gridName 索引)
// 预缩放后每段高度 = sprite.h / 网格段数 (armor_body 6段, player_layer 5段)
//   spriteName 例: 'armor_body_177', 'player_0_3'
//   gridName 例: 'torso', 'front_arm', 'back_arm_holding' 等
export function gridFrame(sprite, gridName, isPlayerLayer) {
  if (!sprite) return [];
  const idx = isPlayerLayer ? PLAYER_GRID_INDEX[gridName] : ARMOR_BODY_GRID_INDEX[gridName];
  if (idx === undefined) return [];
  const numSegs = isPlayerLayer ? 5 : 6;
  const segH = Math.round(sprite.h / numSegs);
  return cropSprite(sprite, 0, idx * segH, sprite.w, segH);
}

// 多帧条带取第 N 帧
//   兼容两种数据形态:
//   1. 帧已预合成: sprite.frames[i] = [[x,y,r,g,b,a]...] (差异帧解码后)
//   2. 旧条带格式: sprite.pixels 是整个条带, 按 frameH 切片
export function stripFrame(sprite, frameIndex, frameH = FRAME_H) {
  if (!sprite) return [];
  if (Array.isArray(sprite.frames)) {
    return sprite.frames[frameIndex % sprite.frames.length] || [];
  }
  return cropSprite(sprite, 0, frameIndex * frameH, sprite.w, frameH);
}

// 头甲条带: 取整张 (优化版资产已切到 frame 0 = 40×56, 直接整张返回)
export function headFrame0(sprite) {
  if (!sprite || !sprite.pixels) return [];
  return sprite.pixels.slice();
}

// 整张 sprite 像素 (武器/草地/特效 用整张)
export function wholeSprite(sprite) {
  if (!sprite || !sprite.pixels) return [];
  return sprite.pixels.slice();
}

// 判断某个 player layer 是不是网格层 (逻辑同 esp32 调试页)
export function isPlayerGridLayer(layer) {
  return PLAYER_GRID_LAYERS.includes(layer);
}

// ============================================================
// 着色: PNG 灰度 mask x baseColor
// ============================================================

export function tintPixels(pixelList, baseColor) {
  if (!baseColor) return pixelList;
  const [r0, g0, b0] = baseColor;
  return pixelList.map(([x, y, r, g, b, a]) => {
    const lum = (r + g + b) / (3 * 255);
    return [x, y, Math.round(r0 * lum), Math.round(g0 * lum), Math.round(b0 * lum), a];
  });
}

// ============================================================
// 把局部像素列表画到目标 Map<"x,y", "#hex">
// 数据已预缩放: 像素 x/y 是缩放后坐标; spriteW/H 应该传缩放后尺寸
// scale 参数仅作向后兼容, 内部不使用
// ============================================================

export function drawPixelsToMap(targetMap, pixelList, centerX, centerY, scale, spriteW, spriteH) {
  if (!pixelList || pixelList.length === 0) return;
  // 自动从像素推 sprite 实际尺寸 (兼容旧调用没传 spriteW/H)
  let w = spriteW;
  let h = spriteH;
  if (w == null || h == null) {
    let maxX = 0, maxY = 0;
    for (const [x, y] of pixelList) {
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    w = w == null ? maxX + 1 : w;
    h = h == null ? maxY + 1 : h;
  }
  const ox = centerX - w / 2;
  const oy = centerY - h / 2;
  for (const [x, y, r, g, b, a] of pixelList) {
    if (a < 5) continue;
    const px = Math.round(ox + x);
    const px = Math.round(ox + x);
    const py = Math.round(oy + y);
    if (px < 0 || px >= 64 || py < 0 || py >= 64) continue;
    const hex = '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    targetMap.set(`${px},${py}`, hex);
  }
}

// 翻转 (direction=-1 镜像)
export function flipPixelsX(pixelList, spriteW = FRAME_W) {
  return pixelList.map(([x, y, r, g, b, a]) => [spriteW - 1 - x, y, r, g, b, a]);
}

// 旋转像素列表 (绕 sprite 中心), 支持任意角度
export function rotatePixels(pixelList, degrees, spriteW = FRAME_W, spriteH = FRAME_H) {
  const rad = degrees * Math.PI / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const cx = spriteW / 2;
  const cy = spriteH / 2;

  const rotated = pixelList.map(([x, y, r, g, b, a]) => {
    const dx = x - cx;
    const dy = y - cy;
    return [dx * cos - dy * sin, dx * sin + dy * cos, r, g, b, a];
  });

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of rotated) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const shifted = rotated.map(([x, y, r, g, b, a]) => [
    Math.round(x - minX),
    Math.round(y - minY),
    r, g, b, a,
  ]);

  return {
    pixels: shifted,
    w: Math.ceil(maxX - minX) + 1,
    h: Math.ceil(maxY - minY) + 1,
  };
}
