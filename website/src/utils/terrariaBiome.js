// ============================================================
// Terraria 9 个非 forest 地形的草地块 + 天空渐变色 + 装饰云
// 数据: uniapp/static/terraria/sprites_tiles.js (9 biome × 3 块 16x16, base64 还没用 — 预留)
// 注: 现存的 sprites_tiles.js 是 JSON 数组形式 (旧 build 脚本输出), 需在这里读 pixels 字段
// ============================================================

import SPRITES_TILES_RAW from '../assets/static/terraria/sprites_tiles.js';

let _tilesCache = null;
function getTiles() {
  if (_tilesCache !== null) return _tilesCache;
  _tilesCache = SPRITES_TILES_RAW || {};
  return _tilesCache;
}

// 9 个地形天空 (top, bottom) RGB 渐变色 — 基于游戏视觉
export const BIOME_SKY = {
  forest:     { top: [0x34, 0x2C, 0xF3], bottom: [0x65, 0x89, 0xF9] },  // 蓝天 (跟现状一致)
  corruption: { top: [0x2A, 0x1E, 0x3E], bottom: [0x70, 0x5C, 0x8E] },  // 紫
  crimson:    { top: [0x4A, 0x14, 0x14], bottom: [0xA0, 0x40, 0x3C] },  // 暗红
  jungle:     { top: [0x2C, 0x6E, 0x4F], bottom: [0x63, 0xAA, 0x70] },  // 翠绿
  snow:       { top: [0xA0, 0xC0, 0xEC], bottom: [0xDC, 0xE6, 0xF8] },  // 浅蓝白
  dungeon:    { top: [0x14, 0x16, 0x33], bottom: [0x3A, 0x3D, 0x66] },  // 暗紫蓝(夜)
  underworld: { top: [0x6E, 0x14, 0x0A], bottom: [0xCE, 0x3A, 0x14] },  // 火红
  hallow:     { top: [0xE0, 0x9A, 0xD2], bottom: [0xB8, 0xCC, 0xF0] },  // 粉蓝
  ocean:      { top: [0x35, 0x6B, 0xC4], bottom: [0x6B, 0xB6, 0xE0] },  // 海蓝
  temple:     { top: [0x4A, 0x32, 0x18], bottom: [0x9F, 0x6E, 0x40] },  // 神庙土黄
};

export const BIOME_LIST = [
  { id: 'forest',     name: '森林' },
  { id: 'corruption', name: '腐化' },
  { id: 'crimson',    name: '猩红' },
  { id: 'jungle',     name: '丛林' },
  { id: 'snow',       name: '雪原' },
  { id: 'dungeon',    name: '地牢' },
  { id: 'underworld', name: '地狱' },
  { id: 'hallow',     name: '神圣' },
  { id: 'ocean',      name: '海洋' },
  { id: 'temple',     name: '神庙' },
];

// 画地形天空渐变到 64x64 pixels Map
export function drawBiomeSky(targetMap, biome) {
  const sky = BIOME_SKY[biome] || BIOME_SKY.forest;
  const top = sky.top;
  const bot = sky.bottom;
  for (let y = 0; y < 64; y++) {
    const t = y / 63;
    const r = Math.round(top[0] * (1 - t) + bot[0] * t);
    const g = Math.round(top[1] * (1 - t) + bot[1] * t);
    const b = Math.round(top[2] * (1 - t) + bot[2] * t);
    const hex = '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    for (let x = 0; x < 64; x++) {
      targetMap.set(`${x},${y}`, hex);
    }
  }
}

// 3 朵手画云 (跟原 forest 一致)
const CLOUD_SHAPES = [
  ['..####....', '.######...', '##########', '.########.'],
  ['.####.',     '######',     '.####.'                  ],
  ['...####...', '.########.', '##########', '..######..'],
];
const CLOUD_POS = [[4, 6], [26, 14], [44, 4]];
const CLOUD_COLOR = '#e8f0ff';

export function drawClouds(targetMap) {
  for (let i = 0; i < 3; i++) {
    const [ox, oy] = CLOUD_POS[i];
    const shape = CLOUD_SHAPES[i];
    for (let row = 0; row < shape.length; row++) {
      const line = shape[row];
      for (let col = 0; col < line.length; col++) {
        if (line[col] === '#') {
          const px = ox + col;
          const py = oy + row;
          if (px >= 0 && px < 64 && py >= 0 && py < 64) {
            targetMap.set(`${px},${py}`, CLOUD_COLOR);
          }
        }
      }
    }
  }
}

// 画地形草地 (5 行高, 64 列, 缩放 16×16 → 5×5 + 循环)
//   forest 用现存的 misc.js 草地 sprite (跟 terrariaSprites.js 兼容)
//   其他 9 个 biome 用 sprites_tiles.js 数据
export function drawBiomeGround(targetMap, biome) {
  if (biome === 'forest') {
    // 让外部用 terrariaSprites 现有的 biome_forest_X.png 路径
    // 这里返回 false 表示"调用方应该走 forest 老路径"
    return false;
  }
  const tiles = getTiles();
  const blocks = [
    tiles[`biome_${biome}_0`],
    tiles[`biome_${biome}_1`],
    tiles[`biome_${biome}_2`],
  ];
  if (!blocks[0]) return false;

  const blockSize = 5;
  const groundY = 64 - blockSize;  // 59
  const sky = BIOME_SKY[biome] || BIOME_SKY.forest;
  const fallback = '#' + (
    (sky.bottom[0] << 16) | (sky.bottom[1] << 8) | sky.bottom[2]
  ).toString(16).padStart(6, '0');

  // 把每个 block 的像素索引化
  const cached = blocks.map((b) => {
    const map = new Map();
    if (b && b.pixels) {
      for (const p of b.pixels) {
        map.set(`${p[0]},${p[1]}`, [p[2], p[3], p[4]]);
      }
    }
    return { w: b.w, h: b.h, map };
  });

  // 反向采样: 对每个 5×5 块, 从 16×16 sprite 取 nearest 像素
  for (let x = 0; x < 64; x += blockSize) {
    const cache = cached[(x / blockSize) % 3 | 0];
    for (let dy = 0; dy < blockSize; dy++) {
      const py = groundY + dy;
      const ty = Math.min(cache.h - 1, Math.round(dy * cache.h / blockSize));
      for (let dx = 0; dx < blockSize; dx++) {
        const px_x = x + dx;
        if (px_x >= 64) break;
        const tx = Math.min(cache.w - 1, Math.round(dx * cache.w / blockSize));
        const c = cache.map.get(`${tx},${ty}`);
        if (c) {
          const hex = '#' + (
            (c[0] << 16) | (c[1] << 8) | c[2]
          ).toString(16).padStart(6, '0');
          targetMap.set(`${px_x},${py}`, hex);
        } else {
          targetMap.set(`${px_x},${py}`, fallback);
        }
      }
    }
  }
  return true;
}
