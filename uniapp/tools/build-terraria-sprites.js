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

// 把 perFrame 数据转成 base + deltas
//   每个 delta 包含两段:
//     set:   该帧"出现/变色"的像素 (跟 base 不同, 渲染时覆盖)
//     clear: 该帧"消失"的像素     (base 有但该帧没有, 渲染时擦回背景)
//   解决重影: 老格式 delta 只有 set, 翅膀挥动后旧位置不擦 → 残留
function packFrameDeltas(perFrame) {
  const base = perFrame.framesPixels[0];
  const baseMap = new Map();
  for (const [x, y, r, g, b] of base) {
    baseMap.set(x + ',' + y, (r << 16) | (g << 8) | b);
  }
  const deltas = [];
  for (let i = 1; i < perFrame.framesPixels.length; i++) {
    const f = perFrame.framesPixels[i];
    const seen = new Set();
    const set = [];
    for (const [x, y, r, g, b, a] of f) {
      const key = x + ',' + y;
      seen.add(key);
      const baseColor = baseMap.get(key);
      const thisColor = (r << 16) | (g << 8) | b;
      if (baseColor !== thisColor) {
        set.push([x, y, r, g, b, a]);
      }
    }
    // clear 段: base 有但这一帧没有
    const clear = [];
    for (const [x, y] of base) {
      const key = x + ',' + y;
      if (!seen.has(key)) clear.push([x, y]);
    }
    deltas.push({ set, clear });
  }
  const result = {
    w: perFrame.w,
    h: perFrame.h,
    frameCount: perFrame.frameCount,
    base,
    deltas,  // 现在是 [{set, clear}, ...]
  };
  if (perFrame.frameStart != null) result.frameStart = perFrame.frameStart;
  return result;
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

function packClearPixels(pixels) {
  // clear 段每像素 2 字节 (x, y) - 小 sprite 用 8bit, 大 sprite 用 16bit
  // 跟 set 段同 fmt 共用
  return null;  // 实际编码在 compressSprite 里走
}

function packClearPixelsFmt(pixels, fmt) {
  const n = pixels.length;
  const stride = fmt === 7 ? 4 : 2;  // fmt=7: x16,y16 = 4; fmt=5: x8,y8 = 2
  const buf = Buffer.alloc(n * stride);
  for (let i = 0; i < n; i++) {
    const [x, y] = pixels[i];
    const o = i * stride;
    if (fmt === 7) {
      buf[o] = x & 0xff;
      buf[o + 1] = (x >> 8) & 0xff;
      buf[o + 2] = y & 0xff;
      buf[o + 3] = (y >> 8) & 0xff;
    } else {
      buf[o] = x & 0xff;
      buf[o + 1] = y & 0xff;
    }
  }
  return { n, b: buf.toString('base64') };
}

function compressSprite(sprite) {
  if (!sprite) return null;
  // 多帧差异 sprite (新格式: deltas = [{set, clear}, ...])
  if (Array.isArray(sprite.base) && Array.isArray(sprite.deltas)) {
    const allSetCoords = [...sprite.base, ...sprite.deltas.flatMap(d => d.set || d)];
    const allClearCoords = sprite.deltas.flatMap(d => d.clear || []);
    const fmt = (maxXY(allSetCoords) > 255 || maxXY(allClearCoords) > 255) ? 7 : 5;
    const result = {
      w: sprite.w, h: sprite.h, frameCount: sprite.frameCount, fmt,
      base: packPixels(sprite.base, fmt),
      deltas: sprite.deltas.map(d => {
        // 兼容旧数据 (d 是数组就是老 set-only 格式)
        if (Array.isArray(d)) {
          return { ...packPixels(d, fmt), cN: 0, cB: '' };
        }
        const setPacked = packPixels(d.set || [], fmt);
        const clearPacked = packClearPixelsFmt(d.clear || [], fmt);
        return {
          n: setPacked.n, b: setPacked.b,
          cN: clearPacked.n, cB: clearPacked.b,
        };
      }),
    };
    if (sprite.frameStart != null) result.frameStart = sprite.frameStart;
    return result;
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
  // 安全检查:如果 obj 里所有 sprite 都没解出像素 (PNG 缺失),
  // 不要覆盖现有 .js 文件 — 防止 build 脚本意外破坏已生成数据
  let hasAnyData = false;
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      // 单帧: 有 pixels 数组
      if (Array.isArray(v.pixels) && v.pixels.length > 0) {
        hasAnyData = true;
        break;
      }
      // 多帧 (extractPerFrame 原始格式): framesPixels[]
      if (Array.isArray(v.framesPixels) && v.framesPixels.some(f => f.length > 0)) {
        hasAnyData = true;
        break;
      }
      // 多帧差异 (packFrameDeltas 返回): base + deltas
      if (Array.isArray(v.base) && v.base.length > 0) {
        hasAnyData = true;
        break;
      }
    }
  }
  if (!hasAnyData) {
    console.log(`  [skip] ${filename}: 全部 sprite 数据为空 (PNG 缺失?), 保留已有文件`);
    return;
  }
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
  console.log('[1/8] armor_heads (11 头甲 frame 0)');
  const armorHeads = {};
  for (const id of [169, 170, 171, 189, 157, 101, 156, 134, 46, 41, 78]) {
    armorHeads['armor_head_' + id] = extractFrame('Armor_Head_' + id, 0, 56);
  }
  writeBundle('armor_heads.js', armorHeads);

  // 2. armor_bodies.js (6 网格位)
  console.log('[2/8] armor_bodies (11 胸甲 6 网格位)');
  const GRID_POSITIONS = [
    ['torso', [0, 0]], ['back_arm', [5, 2]], ['back_shoulder', [1, 1]],
    ['front_arm', [5, 0]], ['front_shoulder', [0, 1]], ['back_arm_holding', [5, 3]],
  ];
  const armorBodies = {};
  for (const id of [175, 176, 177, 190, 105, 66, 95, 27, 24, 51]) {
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
  console.log('[3/8] armor_legs (10 腿甲 frame 0)');
  const armorLegs = {};
  for (const id of [110, 111, 112, 130, 98, 55, 79, 26, 23, 47]) {
    armorLegs['armor_legs_' + id] = extractFrame('Armor_Legs_' + id, 0, 56);
  }
  writeBundle('armor_legs.js', armorLegs);

  // 4. wings.js (差异帧!)
  console.log('[4/8] wings (按源码 Player.WingFrame 帧定义)');
  const wings = {};
  // 每个翅膀的 [总帧数, 切PNG用的总帧数, 起始动画帧]
  // sliceFrames 用于按 PNG 高度切片 (PNG.h / sliceFrames = 每帧高度)
  // animFrames 是动画循环用的帧数 (有些 PNG 有空白帧, 不全用)
  // frameStart 是动画起始帧 (有些翅膀第0帧是折叠态不参与循环)
  // 数据来源: Terraria/Player.cs::WingFrame() + 实测 PNG 尺寸
  const WING_FRAMES = {
    1:  [4, 4, 0], 2:  [4, 4, 0], 3:  [4, 4, 0], 5:  [4, 4, 0], 6:  [4, 4, 0],
    7:  [4, 4, 0], 8:  [4, 4, 0], 9:  [4, 4, 0], 10: [4, 4, 0], 11: [4, 4, 0],
    12: [4, 4, 0],     // Steampunk 108x240/4=60
    13: [4, 4, 0], 14: [4, 4, 0], 15: [4, 4, 0], 16: [4, 4, 0], 17: [4, 4, 0],
    18: [4, 4, 0], 19: [4, 4, 0], 20: [4, 4, 0], 21: [4, 4, 0], 23: [4, 4, 0],
    24: [4, 4, 0], 25: [4, 4, 0], 26: [4, 4, 0], 27: [4, 4, 0], 29: [4, 4, 0],
    30: [4, 4, 1],     // Vortex: 1-3
    31: [4, 4, 0], 32: [4, 4, 0],
    34: [6, 6, 0],     // Jim's
    35: [4, 4, 0], 36: [4, 4, 0], 37: [4, 4, 0], 38: [4, 4, 0],
    39: [6, 6, 0],     // Leinfors
    42: [4, 4, 0], 46: [4, 4, 0],
    43: [7, 7, 1],     // Grox: PNG 80x420/7=60, 用 1-6
    48: [8, 8, 0],     // Chippy: 90x512/8=64
    49: [11, 11, 0],   // Heroicis: 120x1034/11=94
    50: [11, 10, 0],   // Kazzymodus: PNG 11帧, 实际有像素 10 帧
    51: [8, 6, 2],     // Luna: 86x248/8=31, 用 2-7
  };
  for (const [idStr, params] of Object.entries(WING_FRAMES)) {
    const id = parseInt(idStr);
    const [sliceFrames, animFrames, frameStart] = params;
    const png = loadPng('Wings_' + id);
    if (!png) continue;
    const fh = Math.floor(png.height / sliceFrames);
    // takeFrames 从 frameStart 开始取 (跳过空白折叠帧, 第 0 个取出来的就是 base)
    const frames = [];
    for (let i = 0; i < animFrames; i++) frames.push(frameStart + i);
    const perFrame = extractPerFrame('Wings_' + id, fh, frames);
    if (perFrame) {
      // frameCount 改成实际取的帧数 (这里就是 animFrames), frameStart 重置为 0 (因为已经从 frameStart 开始取了)
      perFrame.frameCount = animFrames;
      perFrame.frameStart = 0;
      wings['wings_' + id] = packFrameDeltas(perFrame);
    }
  }
  writeBundle('wings.js', wings);

  // 5. weapons.js
  console.log('[5/8] weapons (16 武器整张)');
  const weapons = {};
  for (const id of [3065, 3475, 3531, 3540, 3541, 3542, 4956, 5005, 757, 1258, 1569, 1571, 3018, 3827, 4923, 4952]) {
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

  // 8. misc.js (跳过如果PNG缺失, 保留已有数据)
  console.log('[8/8] misc (3 草地 + 法师特效)');
  const misc = {};
  let miscHasData = false;
  for (const n of ['biome_forest_0', 'biome_forest_1', 'biome_forest_2', 'dust_242_f0', 'extra_171']) {
    const s = extractWhole(n);
    misc[n] = s;
    if (s) miscHasData = true;
  }
  if (miscHasData) {
    writeBundle('misc.js', misc);
  } else {
    console.log('  [skip] misc 全部缺失, 保留已有 misc.js');
  }

  // 总结
  console.log('');
  const files = fs.readdirSync(OUT_DIR).filter(f => f.endsWith('.js'));
  let total = 0;
  for (const f of files) total += fs.statSync(path.join(OUT_DIR, f)).size;
  console.log(`[done] ${files.length} 文件 / ${(total / 1024).toFixed(1)} KB`);
}

main();
