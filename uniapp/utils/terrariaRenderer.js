// ============================================================
// Terraria 时钟主题主渲染 (优化版)
// 移植自 esp32-firmware/terraria-clock-preview.js renderPlayer
// 输入: config + animTimeSec → 输出: Map<"x,y", "#hex">
// ============================================================

import {
  getSprite, gridFrame, stripFrame, headFrame0, wholeSprite, isPlayerGridLayer,
  tintPixels, drawPixelsToMap, flipPixelsX, rotatePixels,
} from './terrariaSprites.js';
import { renderWings } from './terrariaWings.js';

const FRAME_W = 40;
const FRAME_H = 56;

const HOLD_FRAME_NUM = 3;
const LEG_FRAME_STAND = 0;
const LUNAR_BODY_IDS = [175, 176, 177, 190];

// 角色基色 (esp32 §C 默认色)
const DEFAULT_COLORS = {
  skinColor:       [255, 125, 90],
  eyeColor:        [105, 90, 75],
  hairColor:       [215, 90, 55],
  shirtColor:      [175, 165, 140],
  underShirtColor: [160, 180, 215],
  pantsColor:      [255, 230, 175],
  shoeColor:       [160, 105, 60],
};

// 4 职业 → 装备映射
export const CHARACTERS = {
  warrior:  { name: '战士',   armorSet: '耀斑',   armor: { head: 171, body: 177, legs: 112 }, wings: 29, weapons: [{ id: 4956, name: '天顶剑' }, { id: 3065, name: '星辉者' }], hasGuardian: false },
  ranger:   { name: '射手',   armorSet: '星旋',   armor: { head: 169, body: 175, legs: 110 }, wings: 30, weapons: [{ id: 3475, name: '星旋机枪' }, { id: 3540, name: '幻影弓' }], hasGuardian: false },
  mage:     { name: '法师',   armorSet: '星云',   armor: { head: 170, body: 176, legs: 111 }, wings: 31, weapons: [{ id: 3541, name: '最后的棱镜' }, { id: 3542, name: '星云烈焰' }], hasGuardian: false },
  summoner: { name: '召唤师', armorSet: '星尘',   armor: { head: 189, body: 190, legs: 130 }, wings: 32, weapons: [{ id: 3531, name: '星尘龙杖' }, { id: 5005, name: '帝皇之刃' }], hasGuardian: true },
};

// 武器属性
const WEAPON_PROPS = {
  4956: { useStyle: 1, ofs: { x: -5, y:  4 } },
  3065: { useStyle: 1, ofs: { x: -5, y:  4 } },
  3531: { useStyle: 1, ofs: { x: -5, y:  4 } },
  5005: { useStyle: 1, ofs: { x: -5, y:  4 } },
  3475: { useStyle: 5, ofs: { x:  4, y: -7 } },
  3540: { useStyle: 5, ofs: { x:  4, y: -7 } },
  3541: { useStyle: 5, ofs: { x: 22, y: -7 }, rotate: 90 },
  3542: { useStyle: 5, ofs: { x:  0, y:  0 }, hideWeapon: true, overlay: 'orb' },
};

// ============================================================
// 主渲染入口
// ============================================================

export function renderTerrariaScene(config, animTimeSec) {
  const pixels = new Map();
  const ch = CHARACTERS[config.characterId];
  if (!ch) return pixels;

  drawSky(pixels);
  drawClouds(pixels);
  drawGround(pixels);

  if (ch.hasGuardian) {
    drawGuardian(pixels, config, animTimeSec);
  }

  drawPlayer(pixels, config, ch, animTimeSec);
  return pixels;
}

// ============================================================
// 背景
// ============================================================
function drawSky(pixels) {
  for (let y = 0; y < 64; y++) {
    const t = y / 63;
    const r = Math.round(0x34 * (1 - t) + 0x65 * t);
    const g = Math.round(0x2C * (1 - t) + 0x89 * t);
    const b = Math.round(0xF3 * (1 - t) + 0xF9 * t);
    const hex = '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    for (let x = 0; x < 64; x++) {
      pixels.set(`${x},${y}`, hex);
    }
  }
}

const CLOUD_SHAPES = [
  ['..####....', '.######...', '##########', '.########.'],
  ['.####.', '######', '.####.'],
  ['...####...', '.########.', '##########', '..######..'],
];
const CLOUD_POS = [{ x: 4, y: 6 }, { x: 26, y: 14 }, { x: 44, y: 4 }];

function drawClouds(pixels) {
  const cloudColor = '#e8f0ff';
  for (let i = 0; i < 3; i++) {
    const shape = CLOUD_SHAPES[i];
    const { x: ox, y: oy } = CLOUD_POS[i];
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === '#') {
          const px = ox + col, py = oy + row;
          if (px >= 0 && px < 64 && py >= 0 && py < 64) {
            pixels.set(`${px},${py}`, cloudColor);
          }
        }
      }
    }
  }
}

function drawGround(pixels) {
  const tiles = [
    getSprite('biome_forest_0'),
    getSprite('biome_forest_1'),
    getSprite('biome_forest_2'),
  ];
  if (tiles.some(t => !t)) return;

  const blockSize = 5;
  const groundY = 64 - blockSize;
  let x = 0, idx = 0;
  while (x < 64) {
    drawTileScaled(pixels, tiles[idx % 3], x, groundY, blockSize);
    x += blockSize;
    idx++;
  }
}

function drawTileScaled(targetMap, tile, ox, oy, size) {
  if (!tile) return;
  const sx = size / tile.w;
  const sy = size / tile.h;
  for (const [x, y, r, g, b, a] of tile.pixels) {
    if (a < 5) continue;
    const px = ox + Math.round(x * sx);
    const py = oy + Math.round(y * sy);
    if (px < 0 || px >= 64 || py < 0 || py >= 64) continue;
    const hex = '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    targetMap.set(`${px},${py}`, hex);
  }
}

// ============================================================
// 守卫 (前 8 帧 idle, 9 tick/帧)
// ============================================================
function drawGuardian(targetMap, config, animTimeSec) {
  const sprite = getSprite('projectile_623');
  if (!sprite) return;

  // 差异帧解码后 sprite = { w, h: 单帧高, frameCount, frames: [[...]...] }
  const NUM_FRAMES = sprite.frameCount || 8;
  const fh = sprite.h;

  const tick = animTimeSec * 60;
  const idleFrame = Math.floor(tick / 9) % NUM_FRAMES;
  const framePixels = stripFrame(sprite, idleFrame, fh);

  const playerScale = config.playerScale / 100;
  const cx = config.playerX + config.guardianX;
  const cy = config.playerY + config.guardianY;
  const bobY = Math.sin(tick / 72 * Math.PI * 2) * 1.5;

  drawPixelsToMap(targetMap, framePixels, cx, cy + bobY, playerScale, sprite.w, fh);
}

// ============================================================
// 角色 16 步合成
// ============================================================
function drawPlayer(targetMap, config, ch, animTimeSec) {
  const playerScale = config.playerScale / 100;
  const cx = config.playerX;
  const cy = config.playerY;

  const isHolding = !!config.weaponId;
  const bodyFrameIdx = isHolding ? HOLD_FRAME_NUM : 0;
  const usesCompositeArm = isHolding;
  const legFrameIdx = LEG_FRAME_STAND;

  const headId = ch.armor.head;
  const bodyId = ch.armor.body;
  const legsId = ch.armor.legs;

  const drawLayer = (pixelList) => {
    drawPixelsToMap(targetMap, pixelList, cx, cy, playerScale, FRAME_W, FRAME_H);
  };

  // ===== Step 1-2: 后臂皮肤 + 后臂内衬 + 后臂上衣袖 =====
  drawLayer(tintPixels(getSkinLayer(5, 'back_arm', usesCompositeArm), DEFAULT_COLORS.skinColor));
  if (bodyId >= 0) {
    drawLayer(tintPixels(getSkinLayer(8, 'back_arm', usesCompositeArm), DEFAULT_COLORS.underShirtColor));
    drawLayer(tintPixels(getSkinLayer(13, 'back_arm', usesCompositeArm), DEFAULT_COLORS.shirtColor));
  }

  // ===== Step 3-4: 后臂装甲 + 后肩装甲 =====
  drawLayer(getArmorBodyFrame(bodyId, 'back_arm'));
  drawLayer(getArmorBodyFrame(bodyId, 'back_shoulder'));

  // ===== Step 5: 翅膀 =====
  if (ch.wings) {
    renderWings(targetMap, ch.wings, cx, cy, playerScale, 1, animTimeSec, (config.wingSpeedPct || 50) / 100);
  }

  // ===== Step 6-8: 腿/裤皮肤 + 裤子 + 鞋子 =====
  drawLayer(tintPixels(getSkinLayer(10, null, false), DEFAULT_COLORS.skinColor));
  if (bodyId >= 0) {
    drawLayer(tintPixels(getSkinLayer(11, null, false), DEFAULT_COLORS.pantsColor));
    drawLayer(tintPixels(getSkinLayer(12, null, false), DEFAULT_COLORS.shoeColor));
  }

  // ===== Step 9: 护腿装甲 =====
  drawLayer(getArmorLegs(legsId));

  // ===== Step 10-12: 躯干皮肤 + 内衬 + 上衣 =====
  drawLayer(tintPixels(getSkinLayer(3, 'torso', usesCompositeArm), DEFAULT_COLORS.skinColor));
  if (bodyId >= 0) {
    drawLayer(tintPixels(getSkinLayer(4, 'torso', usesCompositeArm), DEFAULT_COLORS.underShirtColor));
    drawLayer(tintPixels(getSkinLayer(6, 'torso', usesCompositeArm), DEFAULT_COLORS.shirtColor));
  }

  // ===== Step 13: 躯干装甲 =====
  drawLayer(getArmorBodyFrame(bodyId, 'torso'));

  // ===== Step 14: 头/眼/眼珠 =====
  drawLayer(tintPixels(getSkinLayer(0, null, false), DEFAULT_COLORS.skinColor));
  drawLayer(getSkinLayer(1, null, false));
  drawLayer(tintPixels(getSkinLayer(2, null, false), DEFAULT_COLORS.eyeColor));

  // ===== Step 15: 头甲 =====
  if (headId >= 0) {
    const armor = getSprite('armor_head_' + headId);
    if (armor) {
      const frame = headFrame0(armor);
      const headOffY = isHolding ? 2 : 0;
      drawPixelsToMap(targetMap, frame, cx, cy + headOffY * playerScale, playerScale, FRAME_W, FRAME_H);
    }
  }

  // ===== Step 16: 头发 (Lunar 头甲全包式跳过, 当前 4 职业全是 Lunar) =====

  // ===== 武器 + 前臂 =====
  drawWeaponAndFrontArm(targetMap, config, ch, isHolding, bodyFrameIdx, usesCompositeArm, bodyId, animTimeSec);
}

// 取角色皮肤层 (优化版: 网格层用 gridName 索引, 条带层只有 frame 0)
function getSkinLayer(layer, gridName, useGrid) {
  const sprite = getSprite('player_0_' + layer);
  if (!sprite) return [];
  if (useGrid && gridName && isPlayerGridLayer(layer)) {
    return gridFrame(sprite, gridName, true);
  }
  // 条带层 frame 0 (优化版资产里直接是 40×56 整张, 不用切)
  if (!isPlayerGridLayer(layer)) {
    return wholeSprite(sprite);
  }
  // 网格层 fallback: 取 torso (frame 0)
  return gridFrame(sprite, 'torso', true);
}

// 取胸甲网格位
function getArmorBodyFrame(bodyId, gridName) {
  if (bodyId < 0) return [];
  const sprite = getSprite('armor_body_' + bodyId);
  if (!sprite) return [];
  return gridFrame(sprite, gridName, false);
}

// 取腿甲 frame 0
function getArmorLegs(legsId) {
  if (legsId < 0) return [];
  const sprite = getSprite('armor_legs_' + legsId);
  if (!sprite) return [];
  return wholeSprite(sprite);
}

// 武器 + 前臂层
function drawWeaponAndFrontArm(targetMap, config, ch, isHolding, bodyFrameIdx, usesCompositeArm, bodyId, animTimeSec) {
  const playerScale = config.playerScale / 100;
  const cx = config.playerX;
  const cy = config.playerY;
  const dir = 1;

  // 武器
  let pendingOrb = null;
  if (isHolding && config.weaponId) {
    drawWeapon(targetMap, config.weaponId, cx, cy, playerScale, dir);
    if (config.weaponId === 3542) pendingOrb = { id: 3542 };
  }

  const drawLayer = (pixelList) => {
    drawPixelsToMap(targetMap, pixelList, cx, cy, playerScale, FRAME_W, FRAME_H);
  };

  // 前臂层
  drawLayer(tintPixels(getSkinLayer(7, 'front_arm', usesCompositeArm), DEFAULT_COLORS.skinColor));
  if (bodyId >= 0) {
    drawLayer(tintPixels(getSkinLayer(8, 'front_arm', usesCompositeArm), DEFAULT_COLORS.underShirtColor));
    drawLayer(tintPixels(getSkinLayer(13, 'front_arm', usesCompositeArm), DEFAULT_COLORS.shirtColor));
  }
  drawLayer(getArmorBodyFrame(bodyId, 'front_arm'));
  if (usesCompositeArm) {
    drawLayer(getArmorBodyFrame(bodyId, 'front_shoulder'));
  }
  // 前手皮肤 (Lunar 胸甲是手套, 跳过)
  const isLunarBody = bodyId >= 0 && LUNAR_BODY_IDS.includes(bodyId);
  if (!isLunarBody) {
    drawLayer(tintPixels(getSkinLayer(9, 'front_arm', usesCompositeArm), DEFAULT_COLORS.skinColor));
  }

  // 烈焰光团 (在前臂之后)
  if (pendingOrb && pendingOrb.id === 3542) {
    drawWeaponOrb(targetMap, config, animTimeSec);
  }
}

// 画武器
function drawWeapon(targetMap, weaponId, playerCenterX, playerCenterY, playerScale, dir) {
  const wp = WEAPON_PROPS[weaponId];
  if (!wp || wp.hideWeapon) return;
  const sprite = getSprite('item_' + weaponId);
  if (!sprite) return;

  let pixels = sprite.pixels.slice();
  let wW = sprite.w;
  let wH = sprite.h;

  const handLocalX = (dir > 0 ? 26 : 14) + wp.ofs.x * dir;
  const handLocalY = 38 + wp.ofs.y;
  const handX = playerCenterX + (handLocalX - FRAME_W / 2) * playerScale;
  const handY = playerCenterY + (handLocalY - FRAME_H / 2) * playerScale;

  if (wp.useStyle === 5 && dir < 0) {
    pixels = flipPixelsX(pixels, wW);
  }

  if (wp.rotate) {
    const rotated = rotatePixels(pixels, wp.rotate, wW, wH);
    pixels = rotated.pixels;
    wW = rotated.w;
    wH = rotated.h;
  }

  let drawCx, drawCy;
  if (wp.useStyle === 5) {
    drawCx = handX;
    drawCy = handY;
  } else {
    drawCx = handX + wW / 2 * playerScale * dir;
    drawCy = handY - wH / 2 * playerScale;
  }

  drawPixelsToMap(targetMap, pixels, drawCx, drawCy, playerScale, wW, wH);
}

// 法师烈焰光团
function drawWeaponOrb(targetMap, config, animTimeSec) {
  const sprite = getSprite('dust_242_f0');
  if (!sprite) return;
  const playerScale = config.playerScale / 100;
  const cx = config.playerX;
  const cy = config.playerY;

  const handX = cx + (26 - FRAME_W / 2) * playerScale;
  const handY = cy + (38 - FRAME_H / 2) * playerScale;

  const t = animTimeSec * 60;
  const r = (t % 5 < 2.5) ? 0 : 1;
  drawPixelsToMap(targetMap, sprite.pixels, handX, handY + r, playerScale, sprite.w, sprite.h);
}
