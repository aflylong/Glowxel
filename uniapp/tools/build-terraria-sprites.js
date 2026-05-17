#!/usr/bin/env node
// ============================================================
// Terraria sprite 资产打包脚本
// 输入: ../esp32-firmware/terraria/_png/*.png
// 输出: ../uniapp/static/terraria/*.js (8 个合并文件)
//
// 单帧 sprite 格式: { w, h, fmt: 5|7, n, b: base64 }
// 多帧差异 sprite:  { w, h, frameCount, fmt, base: {n,b}, deltas: [{n,b}, ...] }
//
// 像素打包: fmt=5 每像素 5 字节 (x8, y8, r, g, b)
//          fmt=7 每像素 7 字节 (x16, y16, r, g, b) 用于 sprite 大于 256 的尺寸
// 不存 alpha (透明像素已过滤)
// ============================================================

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const PNG_DIR = path.resolve(__dirname, '../../esp32-firmware/terraria/_png');
const OUT_DIR = path.resolve(__dirname, '../static/terraria');

// ============ 工具 ============

function loadPng(name) {
  const p = path.join(PNG_DIR, name + '.png');
  if (!fs.existsSync(p)) {
    console.warn('[skip] 缺失 PNG:', name);
    return null;
  }
  const buf = fs.readFileSync(p);
  const png = PNG.sync.read(buf);
  return png; // { width, height, data: Buffer (RGBA) }
}

// 抽取 PNG 指定矩形的非透明像素
//   返回 [[x_local, y_local, r, g, b, a], ...]
function extractRect(png, sx, sy, sw, sh) {
  const out = [];
  const W = png.width, H = png.height;
  const x1 = Math.min(sx + sw, W);
  const y1 = Math.min(sy + sh, H);
  for (let y = sy; y < y1; y++) {
    for (let x = sx; x < x1; x++) {
      const o = (y * W + x) * 4;
      const a = png.data[o + 3];
      if (a < 5) continue;
      out.push([
        x - sx, y - sy,
        png.data[o], png.data[o + 1], png.data[o + 2], a,
      ]);
    }
  }
  return out;
}

// 整张 PNG 抽取
function extractWhole(name) {
  const png = loadPng(name);
  if (!png) return null;
  return {
    w: png.width, h: png.height,
    pixels: extractRect(png, 0, 0, png.width, png.height),
  };
}

// 抽取一帧 (条带模式: 每帧高度 frameH, 取第 frameIdx 帧)
function extractFrame(name, frameIdx, frameH = 56) {
  const png = loadPng(name);
  if (!png) return null;
  return {
    w: png.width, h: frameH,
    pixels: extractRect(png, 0, frameIdx * frameH, png.width, frameH),
  };
}

// 抽取网格 (col, row) 一格 = 40×56
function extractGrid(name, col, row) {
  const png = loadPng(name);
  if (!png) return null;
  return {
    w: 40, h: 56,
    pixels: extractRect(png, col * 40, row * 56, 40, 56),
  };
}

// 多帧 sprite: 抽指定的几个帧, 返回 framesPixels: [[],[]...] (每帧像素列表是局部坐标)
function extractPerFrame(name, frameH, takeFrames) {
  const png = loadPng(name);
  if (!png) return null;
  const framesPixels = takeFrames.map(srcFrame => {
    const ys = srcFrame * frameH;
    return extractRect(png, 0, ys, png.width, frameH);
  });
  return {
    w: png.width,
    h: frameH,
    frameCount: takeFrames.length,
    framesPixels,
  };
}

// 把 perFrame 数据转成 base + deltas (帧 0 = base, 帧 N = 跟 base 不同的像素)
function packFrameDeltas(perFrame) {
  const base = perFrame.framesPixels[0];
  const baseMap = new Map();
  for (const [x, y, r, g, b] of base) {
    baseMap.set(x + ',' + y, (r << 16) | (g << 8) | b);
  }
  const deltas = [];
  for (let i = 1; i < perFrame.framesPixels.length; i++) {
    const f = perFrame.framesPixels[i];
    const diff = [];
    for (const [x, y, r, g, b, a] of f) {
      const key = x + ',' + y;
      const baseColor = baseMap.get(key);
      const thisColor = (r << 16) | (g << 8) | b;
      if (baseColor !== thisColor) {
        diff.push([x, y, r, g, b, a]);
      }
    }
    deltas.push(diff);
  }
  return {
    w: perFrame.w,
    h: perFrame.h,
    frameCount: perFrame.frameCount,
    base,
    deltas,
  };
}

// ============ 像素打包 (5 字节 / 7 字节, base64) ============

function maxXY(pixels) {
  let m = 0;
  for (const [x, y] of pixels) {
    if (x > m) m = x;
    if (y > m) m = y;
  }
  return m;
}

function packPixels(pixels, fmt) {
  const n = pixels.length;
  const stride = fmt === 7 ? 7 : 5;
  const buf = Buffer.alloc(n * stride);
  for (let i = 0; i < n; i++) {
    const [x, y, r, g, b] = pixels[i];
    const o = i * stride;
    if (fmt === 7) {
      buf[o] = x & 0xff;
      buf[o + 1] = (x >> 8) & 0xff;
      buf[o + 2] = y & 0xff;
      buf[o + 3] = (y >> 8) & 0xff;
      buf[o + 4] = r;
      buf[o + 5] = g;
      buf[o + 6] = b;
    } else {
      buf[o] = x & 0xff;
      buf[o + 1] = y & 0xff;
      buf[o + 2] = r;
      buf[o + 3] = g;
      buf[o + 4] = b;
    }
  }
  return { n, b: buf.toString('base64') };
}

function compressSprite(sprite) {
  if (!sprite) return null;
  // 多帧差异 sprite
  if (Array.isArray(sprite.base) && Array.isArray(sprite.deltas)) {
    const allCoords = [...sprite.base, ...sprite.deltas.flat()];
    const fmt = maxXY(allCoords) > 255 ? 7 : 5;
    return {
      w: sprite.w, h: sprite.h, frameCount: sprite.frameCount, fmt,
      base: packPixels(sprite.base, fmt),
      deltas: sprite.deltas.map(d => packPixels(d, fmt)),
    };
  }
  // 单帧 sprite
  if (Array.isArray(sprite.pixels)) {
    const fmt = maxXY(sprite.pixels) > 255 ? 7 : 5;
    const packed = packPixels(sprite.pixels, fmt);
    return { w: sprite.w, h: sprite.h, fmt, n: packed.n, b: packed.b };
  }
  return sprite;
}

function writeBundle(filename, obj) {
  const compressed = {};
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (v && typeof v === 'object' && (v.pixels || v.base)) {
      compressed[key] = compressSprite(v);
    } else {
      compressed[key] = v;  // 元信息字段 (_gridIndex 等)
    }
  }
  const json = JSON.stringify(compressed);
  const content = 'module.exports = ' + json + ';\n';
  const out = path.join(OUT_DIR, filename);
  fs.writeFileSync(out, content);
  console.log(`  ${filename}: ${(content.length / 1024).toFixed(1)} KB`);
}

// ============ 主流程 ============

function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log('[build] 输入:', PNG_DIR);
  console.log('[build] 输出:', OUT_DIR);
  console.log('');

  // 1. armor_heads.js
  console.log('[1/8] armor_heads (4 头甲 frame 0)');
  const armorHeads = {};
  for (const id of [169, 170, 171, 189]) {
    armorHeads['armor_head_' + id] = extractFrame('Armor_Head_' + id, 0, 56);
  }
  writeBundle('armor_heads.js', armorHeads);

  // 2. armor_bodies.js (6 网格位)
  console.log('[2/8] armor_bodies (4 胸甲 6 网格位)');
  const GRID_POSITIONS = [
    ['torso', [0, 0]], ['back_arm', [5, 2]], ['back_shoulder', [1, 1]],
    ['front_arm', [5, 0]], ['front_shoulder', [0, 1]], ['back_arm_holding', [5, 3]],
  ];
  const armorBodies = {};
  for (const id of [175, 176, 177, 190]) {
    const allPixels = [];
    for (let i = 0; i < GRID_POSITIONS.length; i++) {
      const [, [col, row]] = GRID_POSITIONS[i];
      const sub = extractGrid('Armor_Body_' + id, col, row);
      if (!sub) continue;
      for (const [x, y, r, g, b, a] of sub.pixels) {
        allPixels.push([x, i * 56 + y, r, g, b, a]);
      }
    }
    armorBodies['armor_body_' + id] = { w: 40, h: 56 * GRID_POSITIONS.length, pixels: allPixels };
  }
  armorBodies._gridIndex = {
    torso: 0, back_arm: 1, back_shoulder: 2,
    front_arm: 3, front_shoulder: 4, back_arm_holding: 5,
  };
  writeBundle('armor_bodies.js', armorBodies);

  // 3. armor_legs.js
  console.log('[3/8] armor_legs (4 腿甲 frame 0)');
  const armorLegs = {};
  for (const id of [110, 111, 112, 130]) {
    armorLegs['armor_legs_' + id] = extractFrame('Armor_Legs_' + id, 0, 56);
  }
  writeBundle('armor_legs.js', armorLegs);

  // 4. wings.js (差异帧!)
  console.log('[4/8] wings (4 翅膀 × 4 帧, base + 3 deltas)');
  const wings = {};
  for (const id of [29, 30, 31, 32]) {
    const png = loadPng('Wings_' + id);
    if (!png) continue;
    const fh = Math.floor(png.height / 4);
    const perFrame = extractPerFrame('Wings_' + id, fh, [0, 1, 2, 3]);
    if (perFrame) wings['wings_' + id] = packFrameDeltas(perFrame);
  }
  writeBundle('wings.js', wings);

  // 5. weapons.js
  console.log('[5/8] weapons (8 武器整张)');
  const weapons = {};
  for (const id of [3065, 3475, 3531, 3540, 3541, 3542, 4956, 5005]) {
    weapons['item_' + id] = extractWhole('Item_' + id);
  }
  writeBundle('weapons.js', weapons);

  // 6. player_layers.js
  console.log('[6/8] player_layers (13 角色 sv=0 层)');
  const PLAYER_GRID_POSITIONS = [
    ['torso', [0, 0]], ['back_arm', [5, 2]], ['back_shoulder', [1, 1]],
    ['front_arm', [5, 0]], ['front_shoulder', [0, 1]],
  ];
  const PLAYER_GRID_LAYERS = [3, 4, 5, 6, 7, 8, 9, 13];
  const PLAYER_STRIP_LAYERS = [0, 1, 2, 10, 11, 12, 15];
  const playerLayers = {};
  for (const layer of PLAYER_GRID_LAYERS) {
    const allPixels = [];
    for (let i = 0; i < PLAYER_GRID_POSITIONS.length; i++) {
      const [, [col, row]] = PLAYER_GRID_POSITIONS[i];
      const sub = extractGrid('Player_0_' + layer, col, row);
      if (!sub) continue;
      for (const [x, y, r, g, b, a] of sub.pixels) {
        allPixels.push([x, i * 56 + y, r, g, b, a]);
      }
    }
    playerLayers['player_0_' + layer] = { w: 40, h: 56 * PLAYER_GRID_POSITIONS.length, pixels: allPixels };
  }
  for (const layer of PLAYER_STRIP_LAYERS) {
    playerLayers['player_0_' + layer] = extractFrame('Player_0_' + layer, 0, 56);
  }
  playerLayers._gridIndex = {
    torso: 0, back_arm: 1, back_shoulder: 2, front_arm: 3, front_shoulder: 4,
  };
  playerLayers._gridLayers = PLAYER_GRID_LAYERS;
  writeBundle('player_layers.js', playerLayers);

  // 7. summon_guardian.js (差异帧!)
  console.log('[7/8] summon_guardian (守卫 8 帧 idle, base + 7 deltas)');
  // Projectile_623 是 108×1748 = 19 帧, 每帧高度 = 92
  const guardianPerFrame = extractPerFrame('Projectile_623', 92, [0, 1, 2, 3, 4, 5, 6, 7]);
  if (guardianPerFrame) {
    const sg = { projectile_623: packFrameDeltas(guardianPerFrame) };
    writeBundle('summon_guardian.js', sg);
  }

  // 8. misc.js
  console.log('[8/8] misc (3 草地 + 法师特效)');
  const misc = {};
  for (const n of ['biome_forest_0', 'biome_forest_1', 'biome_forest_2', 'dust_242_f0', 'extra_171']) {
    misc[n] = extractWhole(n);
  }
  writeBundle('misc.js', misc);

  // 总结
  console.log('');
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.js'));
  let total = 0;
  for (const f of files) total += fs.statSync(path.join(OUT_DIR, f)).size;
  console.log(`[done] ${files.length} 文件 / ${(total / 1024).toFixed(1)} KB`);
}

main();
