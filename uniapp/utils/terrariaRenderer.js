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
import { drawBiomeSky, drawClouds as drawBiomeClouds, drawBiomeGround } from './terrariaBiome.js';
import { drawBoss } from './terrariaBosses.js';

const FRAME_W = 40;
const FRAME_H = 56;
// 预缩放后单层尺寸 (40*0.27=11, 56*0.27≈15)
const SCALED_FRAME_W = 11;
const SCALED_FRAME_H = 15;

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

// 10 套装 → 装备映射
export const CHARACTERS = {
  warrior:    { name: '战士',     armorSet: '耀斑',   armor: { head: 171, body: 177, legs: 112 }, wings: 29, weapons: [{ id: 4956, name: '天顶剑' }, { id: 757, name: '泰拉刃' }], hasGuardian: false },
  ranger:     { name: '射手',     armorSet: '星旋',   armor: { head: 169, body: 175, legs: 110 }, wings: 30, weapons: [{ id: 3475, name: '星旋机枪' }, { id: 3540, name: '幻影弓' }], hasGuardian: false },
  mage:       { name: '法师',     armorSet: '星云',   armor: { head: 170, body: 176, legs: 111 }, wings: 31, weapons: [{ id: 3541, name: '最后的棱镜' }, { id: 3542, name: '星云烈焰' }], hasGuardian: false },
  summoner:   { name: '召唤师',   armorSet: '星尘',   armor: { head: 189, body: 190, legs: 130 }, wings: 32, weapons: [{ id: 3531, name: '星尘龙杖' }, { id: 5005, name: '泰拉棱镜' }], hasGuardian: true },
  beetle:     { name: '甲虫战士', armorSet: '甲虫',   armor: { head: 157, body: 105, legs: 98 },  wings: 24, weapons: [{ id: 757, name: '泰拉刃' }, { id: 1122, name: '占有斧' }], hasGuardian: false },
  spectre:    { name: '幽灵法师', armorSet: '幽灵',   armor: { head: 101, body: 66, legs: 55 },   wings: 11, weapons: [{ id: 1931, name: '暴风雪法杖' }, { id: 3541, name: '最后的棱镜' }], hasGuardian: false },
  spooky:     { name: '万圣召唤', armorSet: '阴森',   armor: { head: 134, body: 95, legs: 79 },   wings: 21, weapons: [{ id: 3531, name: '星尘龙杖' }, { id: 1931, name: '暴风雪法杖' }], hasGuardian: false },
  frost:      { name: '冰霜混合', armorSet: '冰霜',   armor: { head: 46, body: 27, legs: 26 },    wings: 10, weapons: [{ id: 1947, name: '北极' }, { id: 1931, name: '暴风雪法杖' }], hasGuardian: false },
  hallowed:   { name: '神圣战士', armorSet: '神圣',   armor: { head: 41, body: 24, legs: 23 },    wings: 26, weapons: [{ id: 757, name: '泰拉刃' }, { id: 3827, name: '飞龙' }], hasGuardian: false },
  chlorophyte:{ name: '叶绿射手', armorSet: '叶绿',   armor: { head: 78, body: 51, legs: 47 },    wings: 27, weapons: [{ id: 4923, name: '星光' }, { id: 4952, name: '棱彩光辉' }], hasGuardian: false },
  // 新增 4 套 boss 关联
  crystal:    { name: '水晶忍者', armorSet: '凝胶',   armor: { head: 261, body: 230, legs: 213 }, wings: 49, weapons: [{ id: 2880, name: '波涌之刃' }, { id: 757, name: '泰拉刃' }], hasGuardian: false },
  bee:        { name: '蜜蜂套',   armorSet: '蜜蜂',   armor: { head: 160, body: 168, legs: 103 }, wings: 6,  weapons: [{ id: 1121, name: '蜂枪' }, { id: 121, name: '烈焰巨剑' }], hasGuardian: false },
  pirate:     { name: '海盗',     armorSet: '海盗',   armor: { head: 68, body: 45, legs: 41 },    wings: 14, weapons: [{ id: 3852, name: '魔典法杖' }, { id: 757, name: '泰拉刃' }], hasGuardian: false },
  molten:     { name: '熔岩战士', armorSet: '熔岩',   armor: { head: 9, body: 9, legs: 9 },       wings: 1,  weapons: [{ id: 121, name: '烈焰巨剑' }, { id: 757, name: '泰拉刃' }], hasGuardian: false },
  // 新手 (无盔甲)
  novice:     { name: '新手',     armorSet: '无',     armor: { head: 0, body: 0, legs: 0 },       wings: 0,  weapons: [{ id: 3507, name: '铜短剑' }, { id: 24, name: '木剑' }], hasGuardian: false },
};

// 武器属性
const WEAPON_PROPS = {
  4956: { useStyle: 1, ofs: { x: -5, y:  4 } },   // 天顶剑
  3531: { useStyle: 1, ofs: { x: -5, y:  4 } },   // 星尘龙杖
  5005: { useStyle: 1, ofs: { x: -5, y:  4 } },   // 泰拉棱镜
  3475: { useStyle: 5, ofs: { x:  4, y: -7 } },   // 星旋机枪
  3540: { useStyle: 5, ofs: { x:  4, y: -7 } },   // 幻影弓
  3541: { useStyle: 5, ofs: { x: 22, y: -7 }, rotate: 90 },   // 最后的棱镜
  3542: { useStyle: 5, ofs: { x:  0, y:  0 }, hideWeapon: true, overlay: 'orb' },   // 星云烈焰 (4px 光团)
  757:  { useStyle: 1, ofs: { x: -5, y:  4 } },   // 泰拉刃
  1122: { useStyle: 1, ofs: { x: -5, y:  4 } },   // 占有斧
  1931: { useStyle: 5, ofs: { x: 18, y: -14 } },   // 暴风雪法杖
  1947: { useStyle: 5, ofs: { x:  4, y: -7 } },   // 北极
  3827: { useStyle: 1, ofs: { x: -12, y: 14 } },   // 飞龙
  4923: { useStyle: 1, ofs: { x: -5, y:  4 } },   // 星光
  4952: { useStyle: 5, ofs: { x: 22, y: -7 }, rotate: 90 },   // 棱彩光辉
  24:   { useStyle: 1, ofs: { x: -5, y:  4 } },   // 木剑
  3507: { useStyle: 1, ofs: { x: -5, y:  4 } },   // 铜短剑
  2880: { useStyle: 1, ofs: { x: -5, y:  4 } },   // 波涌之刃
  1121: { useStyle: 5, ofs: { x:  4, y: -7 } },   // 蜂枪
  121:  { useStyle: 1, ofs: { x: -5, y:  4 } },   // 烈焰巨剑
  3852: { useStyle: 1, ofs: { x: -5, y:  4 } },   // 魔典法杖
};

// 获取武器默认偏移 (供 UI 切换武器时读取)
export function getWeaponOfs(weaponId) {
  const wp = WEAPON_PROPS[weaponId];
  return wp ? { x: wp.ofs.x, y: wp.ofs.y, rotate: wp.rotate || 0 } : { x: -5, y: 4, rotate: 0 };
}

// ============================================================
// 主渲染入口
// ============================================================

export function renderTerrariaScene(config, animTimeSec) {
  const pixels = new Map();
  const ch = CHARACTERS[config.characterId];
  if (!ch) return pixels;

  // 背景: biome 天空渐变 + 云 + 地面
  const biome = config.biome || 'forest';
  drawBiomeSky(pixels, biome);
  drawBiomeClouds(pixels);
  const handled = drawBiomeGround(pixels, biome);
  if (!handled) {
    drawGround(pixels);  // forest 走 sprite 草地
  }

  // 备份背景 (供 boss delta clear 段查询擦回)
  const bgSnapshot = new Map(pixels);

  // Boss (在角色后面)
  // 板载用 base+delta(set+clear), uniapp 渲染同款算法; 位置/缩放已预渲染到屏幕坐标
  // bgPainter: clear 段擦回背景色 (查 bgSnapshot)
  if (config.bossEnabled && config.bossId) {
    const bgPainter = (x, y) => bgSnapshot.get(`${x},${y}`) || null;
    drawBoss(pixels, config.bossId, animTimeSec, bgPainter);
  }

  // 召唤物:
  //   穿星尘套装(hasGuardian) → 星尘守卫(被动,永远显示)
  //   持星尘龙杖(3531) → 星尘龙(额外)
  //   持泰拉棱镜(5005) → 帝皇飞剑(额外)
  if (ch.hasGuardian) {
    drawGuardian(pixels, config, animTimeSec);
  }
  if (config.weaponId === 3531) {
    drawStardustDragon(pixels, config, animTimeSec);
  }
  if (config.weaponId === 5005) {
    drawEmpressBlade(pixels, config, animTimeSec);
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
// 星尘龙 (完整拼接 sprite, 持星尘龙杖 3531 时显示)
//   4 段已预拼接成一张 9×22 sprite, 在角色旁浮动
// ============================================================
function drawStardustDragon(targetMap, config, animTimeSec) {
  const sprite = getSprite('stardust_dragon');
  if (!sprite || !sprite.pixels) return;
  const cx = config.playerX + (config.dragonX || 8);
  const cy = config.playerY + (config.dragonY || 0);
  const tick = animTimeSec * 60;

  // 浮动: 缓慢上下 + 轻微左右
  const floatX = cx + Math.sin(tick * 0.02) * 2;
  const floatY = cy + Math.sin(tick * 0.03) * 2;

  // 旋转: 用 config.dragonAngle 控制基础角度 (度), 加轻微摆动
  const baseAngleDeg = config.dragonAngle || -90;
  const angle = (baseAngleDeg * Math.PI / 180) + Math.sin(tick * 0.04) * 0.2;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const sprCx = sprite.w / 2;
  const sprCy = sprite.h / 2;

  for (const px of sprite.pixels) {
    const [lx, ly, r, g, b, a] = px;
    if (a < 5) continue;
    const rx = lx - sprCx;
    const ry = ly - sprCy;
    const nx = rx * cosA - ry * sinA;
    const ny = rx * sinA + ry * cosA;
    const sx = Math.round(floatX + nx);
    const sy = Math.round(floatY + ny);
    if (sx < 0 || sx >= 64 || sy < 0 || sy >= 64) continue;
    const hex = '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
    targetMap.set(`${sx},${sy}`, hex);
  }
}

// ============================================================
// 帝皇飞剑 / 泰拉棱镜 (背后悬浮 + 彩虹变色, 持泰拉棱镜 5005 时显示)
//   飞剑在角色背后缓慢绕圈悬浮, 颜色随时间 hue 循环
// ============================================================
function drawEmpressBlade(targetMap, config, animTimeSec) {
  const sprite = getSprite('empress_blade');
  if (!sprite || !sprite.pixels) return;
  const cx = config.playerX;
  const cy = config.playerY;

  // 悬浮位置: 用 config.bladeX/Y 控制
  const floatX = cx + (config.bladeX || -12);
  const floatY = cy + (config.bladeY || -5) + Math.sin(animTimeSec * 2) * 2;

  // 轻微旋转 (用 config.bladeAngle 控制基础角度, 固定不摆动)
  const baseAngleDeg = config.bladeAngle || -45;
  const angle = (baseAngleDeg * Math.PI / 180);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // 彩虹变色: hue 随时间循环
  const hue = (animTimeSec * 60) % 360;  // 每 6 秒一圈

  const sprCx = sprite.w / 2;
  const sprCy = sprite.h / 2;

  for (const px of sprite.pixels) {
    const [lx, ly, r, g, b, a] = px;
    if (a < 5) continue;

    // 旋转
    const rx = lx - sprCx;
    const ry = ly - sprCy;
    const nx = rx * cosA - ry * sinA;
    const ny = rx * sinA + ry * cosA;
    const sx = Math.round(floatX + nx);
    const sy = Math.round(floatY + ny);
    if (sx < 0 || sx >= 64 || sy < 0 || sy >= 64) continue;

    // 彩虹着色: 用原像素亮度 × hue 色相
    const lum = (r + g + b) / (3 * 255);
    const hsl = hueToRgb(hue, 0.9, Math.max(0.3, lum));
    const hex = '#' + ((hsl[0] << 16) | (hsl[1] << 8) | hsl[2]).toString(16).padStart(6, '0');
    targetMap.set(`${sx},${sy}`, hex);
  }
}

// HSL → RGB (h: 0-360, s: 0-1, l: 0-1) → [r, g, b] 0-255
function hueToRgb(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r1, g1, b1;
  if (h < 60)       { r1 = c; g1 = x; b1 = 0; }
  else if (h < 120) { r1 = x; g1 = c; b1 = 0; }
  else if (h < 180) { r1 = 0; g1 = c; b1 = x; }
  else if (h < 240) { r1 = 0; g1 = x; b1 = c; }
  else if (h < 300) { r1 = x; g1 = 0; b1 = c; }
  else              { r1 = c; g1 = 0; b1 = x; }
  return [
    Math.round((r1 + m) * 255),
    Math.round((g1 + m) * 255),
    Math.round((b1 + m) * 255),
  ];
}

// ============================================================
// 角色 16 步合成
// ============================================================
function drawPlayer(targetMap, config, ch, animTimeSec) {
  const playerScale = config.playerScale / 100;
  const cx = config.playerX;
  const cy = config.playerY;

  const isHolding = !!config.weaponId && config.weaponId !== 5005;  // 5005 泰拉棱镜不手持
  const bodyFrameIdx = isHolding ? HOLD_FRAME_NUM : 0;
  const usesCompositeArm = isHolding;
  const legFrameIdx = LEG_FRAME_STAND;

  const headId = config.maskId ? config.maskId : ch.armor.head;  // 面具优先
  const bodyId = ch.armor.body;
  const legsId = ch.armor.legs;

  const drawLayer = (pixelList) => {
    drawPixelsToMap(targetMap, pixelList, cx, cy, 1.0, SCALED_FRAME_W, SCALED_FRAME_H);
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

  // ===== Step 5: 翅膀 (用 config.wingId, 独立于职业) =====
  const wingId = config.wingId != null ? config.wingId : ch.wings;
  if (wingId) {
    renderWings(targetMap, wingId, cx, cy, playerScale, 1, animTimeSec, (config.wingSpeedPct || 50) / 100);
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
      drawPixelsToMap(targetMap, frame, cx, cy + headOffY * playerScale, 1.0, SCALED_FRAME_W, SCALED_FRAME_H);
    }
  }

  // ===== Step 16: 头发 (没头甲 或 非全包式头甲时画) =====
  if (headId === 0) {
    // novice / 无头甲: 画头发 (layer 15, 直接用 hairColor 填色)
    const hairSprite = getSprite('player_0_15');
    if (hairSprite && hairSprite.pixels && hairSprite.pixels.length > 0) {
      // 头发像素极少, 手动放大: 每个像素扩展为 2×2 块
      const expanded = [];
      for (const [x, y, , , , a] of hairSprite.pixels) {
        expanded.push([x, y, ...DEFAULT_COLORS.hairColor, a]);
        expanded.push([x + 1, y, ...DEFAULT_COLORS.hairColor, a]);
        expanded.push([x, y + 1, ...DEFAULT_COLORS.hairColor, a]);
        expanded.push([x + 1, y + 1, ...DEFAULT_COLORS.hairColor, a]);
      }
      drawPixelsToMap(targetMap, expanded, cx, cy, 1.0, SCALED_FRAME_W, SCALED_FRAME_H);
    }
  }

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

  // 武器 (5005 泰拉棱镜不手持, 只在背后显示飞剑召唤物)
  let pendingOrb = null;
  if (isHolding && config.weaponId && config.weaponId !== 5005) {
    drawWeapon(targetMap, config.weaponId, cx, cy, playerScale, dir, config.weaponOfsX, config.weaponOfsY, config.weaponRotate);
    if (config.weaponId === 3542) pendingOrb = { id: 3542 };
  }

  const drawLayer = (pixelList) => {
    drawPixelsToMap(targetMap, pixelList, cx, cy, 1.0, SCALED_FRAME_W, SCALED_FRAME_H);
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
function drawWeapon(targetMap, weaponId, playerCenterX, playerCenterY, playerScale, dir, extraOfsX, extraOfsY, extraRotate) {
  const wp = WEAPON_PROPS[weaponId];
  if (!wp || wp.hideWeapon) return;
  const sprite = getSprite('item_' + weaponId);
  if (!sprite) return;

  let pixels = sprite.pixels.slice();
  let wW = sprite.w;
  let wH = sprite.h;

  // extraOfsX/Y 是绝对值, 直接替代 wp.ofs (调试时覆盖默认)
  const ofsX = extraOfsX != null ? extraOfsX : wp.ofs.x;
  const ofsY = extraOfsY != null ? extraOfsY : wp.ofs.y;
  const rotateDeg = extraRotate != null ? extraRotate : (wp.rotate || 0);
  const handLocalX = (dir > 0 ? 26 : 14) + ofsX * dir;
  const handLocalY = 38 + ofsY;
  const handX = playerCenterX + (handLocalX - FRAME_W / 2) * playerScale;
  const handY = playerCenterY + (handLocalY - FRAME_H / 2) * playerScale;

  if (wp.useStyle === 5 && dir < 0) {
    pixels = flipPixelsX(pixels, wW);
  }

  if (rotateDeg) {
    const rotated = rotatePixels(pixels, rotateDeg, wW, wH);
    pixels = rotated.pixels;
    wW = rotated.w;
    wH = rotated.h;
  }

  let drawCx, drawCy;
  if (wp.useStyle === 5) {
    drawCx = handX;
    drawCy = handY;
  } else {
    // wW/wH 是预缩放后实际尺寸, 不再乘 playerScale
    drawCx = handX + wW / 2 * dir;
    drawCy = handY - wH / 2;
  }

  drawPixelsToMap(targetMap, pixels, drawCx, drawCy, 1.0, wW, wH);
}

// 法师烈焰光团 (4 像素 + 白色闪烁)
function drawWeaponOrb(targetMap, config, animTimeSec) {
  const playerScale = config.playerScale / 100;
  const cx = config.playerX;
  const cy = config.playerY;

  // 手部位置
  const handX = Math.round(cx + (26 - FRAME_W / 2) * playerScale);
  const handY = Math.round(cy + (38 - FRAME_H / 2) * playerScale);

  const tick = animTimeSec * 60;

  // 4 个像素点 (2×2 方块), 粉紫色
  const colors = [
    [0xFF, 0x66, 0xCC],  // 粉
    [0xCC, 0x33, 0xFF],  // 紫
    [0xFF, 0x88, 0xDD],  // 浅粉
    [0xAA, 0x22, 0xEE],  // 深紫
  ];

  // 白色闪烁: 每隔几 tick 随机一个点变白
  const flashIdx = Math.floor(tick / 4) % 4;

  const offsets = [[0, 0], [1, 0], [0, 1], [1, 1]];
  for (let i = 0; i < 4; i++) {
    const px = handX + offsets[i][0];
    const py = handY + offsets[i][1];
    if (px < 0 || px >= 64 || py < 0 || py >= 64) continue;
    const c = (i === flashIdx) ? [0xFF, 0xFF, 0xFF] : colors[i];
    const hex = '#' + ((c[0] << 16) | (c[1] << 8) | c[2]).toString(16).padStart(6, '0');
    targetMap.set(`${px},${py}`, hex);
  }
}
