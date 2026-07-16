// ============================================================
// Terraria 9 涓潪 forest 鍦板舰鐨勮崏鍦板潡 + 澶╃┖娓愬彉鑹?+ 瑁呴グ浜?
// 鏁版嵁: uniapp/static/terraria/sprites_tiles.js (9 biome 脳 3 鍧?16x16, base64 杩樻病鐢?鈥?棰勭暀)
// 娉? 鐜板瓨鐨?sprites_tiles.js 鏄?JSON 鏁扮粍褰㈠紡 (鏃?build 鑴氭湰杈撳嚭), 闇€鍦ㄨ繖閲岃 pixels 瀛楁
// ============================================================

import SPRITES_TILES_RAW from '../assets/static/terraria/sprites_tiles.js';

let _tilesCache = null;
function getTiles() {
  if (_tilesCache !== null) return _tilesCache;
  _tilesCache = SPRITES_TILES_RAW || {};
  return _tilesCache;
}

// 9 涓湴褰㈠ぉ绌?(top, bottom) RGB 娓愬彉鑹?鈥?鍩轰簬娓告垙瑙嗚
export const BIOME_SKY = {
  forest:     { top: [0x34, 0x2C, 0xF3], bottom: [0x65, 0x89, 0xF9] },  // 钃濆ぉ (璺熺幇鐘朵竴鑷?
  corruption: { top: [0x2A, 0x1E, 0x3E], bottom: [0x70, 0x5C, 0x8E] },  // 绱?
  crimson:    { top: [0x4A, 0x14, 0x14], bottom: [0xA0, 0x40, 0x3C] },  // 鏆楃孩
  jungle:     { top: [0x2C, 0x6E, 0x4F], bottom: [0x63, 0xAA, 0x70] },  // 缈犵豢
  snow:       { top: [0xA0, 0xC0, 0xEC], bottom: [0xDC, 0xE6, 0xF8] },  // 娴呰摑鐧?
  dungeon:    { top: [0x14, 0x16, 0x33], bottom: [0x3A, 0x3D, 0x66] },  // 鏆楃传钃?澶?
  underworld: { top: [0x6E, 0x14, 0x0A], bottom: [0xCE, 0x3A, 0x14] },  // 鐏孩
  hallow:     { top: [0xE0, 0x9A, 0xD2], bottom: [0xB8, 0xCC, 0xF0] },  // 绮夎摑
  ocean:      { top: [0x35, 0x6B, 0xC4], bottom: [0x6B, 0xB6, 0xE0] },  // 娴疯摑
  temple:     { top: [0x4A, 0x32, 0x18], bottom: [0x9F, 0x6E, 0x40] },  // 绁炲簷鍦熼粍
};

export const BIOME_LIST = [
  { id: 'forest',     name: '妫灄' },
  { id: 'corruption', name: '鑵愬寲' },
  { id: 'crimson',    name: '鐚╃孩' },
  { id: 'jungle',     name: '涓涙灄' },
  { id: 'snow',       name: '闆師' },
  { id: 'dungeon',    name: '鍦扮墷' },
  { id: 'underworld', name: '鍦扮嫳' },
  { id: 'hallow',     name: '绁炲湥' },
  { id: 'ocean',      name: '娴锋磱' },
  { id: 'temple',     name: '绁炲簷' },
];

// 鐢诲湴褰㈠ぉ绌烘笎鍙樺埌 64x64 pixels Map
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

// 3 鏈垫墜鐢讳簯 (缁?cloud-editor.html 閲嶇敾, 浜?1 鍔犲ぇ鎴愪富浜? 浜?2/3 淇濈暀鍘熷皬浜?
const CLOUD_SHAPES = [
  [
    '............................................######.....',
    '....####..................................###....###...',
    '...#######...............................##........###.',
    '..#########.............................##..........###',
    '.###########.............................####.....###..',
    '##############.............................#########...',
    '.############..........................................',
    '..##########...........................................',
    '.......................................................',
    '.......................................................',
    '.........................####..........................',
    '......................####...##........................',
    '....................####......##.......................',
    '......................###....##........................',
    '........................#####..........................',
  ],
  ['.####.', '######', '.####.'],
  ['...####...', '.########.', '##########', '..######..'],
];
const CLOUD_POS = [[2, 3], [26, 14], [44, 4]];
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

// 鐢诲湴褰㈣崏鍦?(5 琛岄珮, 64 鍒? 缂╂斁 16脳16 鈫?5脳5 + 寰幆)
//   forest 鐢ㄧ幇瀛樼殑 misc.js 鑽夊湴 sprite (璺?terrariaSprites.js 鍏煎)
//   鍏朵粬 9 涓?biome 鐢?sprites_tiles.js 鏁版嵁
export function drawBiomeGround(targetMap, biome) {
  if (biome === 'forest') {
    // 璁╁閮ㄧ敤 terrariaSprites 鐜版湁鐨?biome_forest_X.png 璺緞
    // 杩欓噷杩斿洖 false 琛ㄧず"璋冪敤鏂瑰簲璇ヨ蛋 forest 鑰佽矾寰?"
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

  // 鎶婃瘡涓?block 鐨勫儚绱犵储寮曞寲
  const cached = blocks.map((b) => {
    const map = new Map();
    if (b && b.pixels) {
      for (const p of b.pixels) {
        map.set(`${p[0]},${p[1]}`, [p[2], p[3], p[4]]);
      }
    }
    return { w: b.w, h: b.h, map };
  });

  // 鍙嶅悜閲囨牱: 瀵规瘡涓?5脳5 鍧? 浠?16脳16 sprite 鍙?nearest 鍍忕礌
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
