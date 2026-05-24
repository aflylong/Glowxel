/**
 * Minecraft 时钟预览渲染引擎（v3 - 用户敲定终版框架）
 *
 * 屏幕 64×64：
 *   y=0~58  天空 + 云（forest biome）
 *   y=59~63 草地（forest tile，5 行）
 *
 * Steve：背对屏幕，sprite 用 16×32 完整身体 + 4×12 独立右臂（即 Steve 视角的左臂，他是左撇子）
 *   按 config.steveScale (50~150) nearest-neighbor 缩放
 *   通过 X 平移走路；走路时手臂下垂；砸/搭瞬间手臂高举到方块底部
 *
 * 状态机：
 *   idle      默认在屏幕左下角休息
 *   walkTo    走到目标方块正下方（每帧平移 walkSpeed 像素）
 *   breakHit  挥镐砸方块（4 帧动画：举高 → 砸下 → 砸碎瞬间方块消失生成掉落物 → 提手）
 *   waitFall  等掉落物落地（受重力，垂直下落）
 *   pickup    掉落物从落地点向 Steve 平移 ~3 帧后消失
 *   buildHit  把手中方块举高放到目标位置（3 帧动画）
 *   全砸完后切到搭建相位（与摧毁顺序相反）
 *
 * 顺序：
 *   摧毁：从最左方块到最右方块（按 block.x 升序）
 *   搭建：从最右到最左（与摧毁相反）
 */

import {
  STEVE_W, STEVE_H, STEVE_BODY_PIXELS,
  STEVE_FRONT_PIXELS, STEVE_FRONT_ARM_PIXELS,
  STEVE_ARM_W, STEVE_ARM_H, STEVE_ARM_PIXELS,
  STEVE_ARM_ANCHOR_X, STEVE_ARM_ANCHOR_Y,
  STEVE_SIDE_W, STEVE_SIDE_H, STEVE_SIDE_PIXELS,
  STEVE_WALK_W, STEVE_WALK_H, STEVE_WALK_FRAMES,
  STEVE_SWING_ARM_W, STEVE_SWING_ARM_H,
  STEVE_SWING_ARM_SHOULDER_X, STEVE_SWING_ARM_SHOULDER_Y,
  STEVE_SWING_ARM_FRAMES, STEVE_SWING_ARM_HANDS,
  STEVE_SWING_FULL_W, STEVE_SWING_FULL_H,
  STEVE_SWING_FULL_BODY_OFFSET_X, STEVE_SWING_FULL_BODY_OFFSET_Y,
  STEVE_SWING_FULL_FRAMES,
  STEVE_SIDE_HOLD_W, STEVE_SIDE_HOLD_H, STEVE_SIDE_HOLD_FRAME,
  STEVE_SIDE_HOLD_HAND_X, STEVE_SIDE_HOLD_HAND_Y,
  STEVE_SIDE_SWING_W, STEVE_SIDE_SWING_H, STEVE_SIDE_SWING_FRAMES,
  BLOCK_SIZE, BLOCK_TEXTURES,
  PICKAXE_SIZE, PICKAXE_TEXTURES,
} from "./minecraftAssets.js";
import { drawBiomeSky, drawClouds } from "./terrariaBiome.js";
import { getSprite } from "./terrariaSprites.js";

const WIDTH = 64;
const HEIGHT = 64;
const GROUND_TOP_Y = HEIGHT - 5; // 59

// ============================================================
// 方块/镐子映射（UI id -> 纹理 key）
// ============================================================
const BLOCK_KEY_MAP = {
  oak: 'oak_planks',
  oak_log: 'oak_log',
  stone: 'stone',
  cobble: 'cobblestone',
  // 矿物块（"钻石"、"金块" 等期望的纹理）
  diamond: 'diamond_block',
  gold: 'gold_block',
  iron: 'iron_block',
  emerald: 'emerald_block',
  lapis: 'lapis_block',
  redstone: 'redstone_block',
  // 矿石（独立选项）
  diamond_ore: 'diamond_ore',
  gold_ore: 'gold_ore',
  iron_ore: 'iron_ore',
  redstone_ore: 'redstone_ore',
  emerald_ore: 'emerald_ore',
  lapis_ore: 'lapis_ore',
  // 其他
  obsidian: 'obsidian',
  glowstone: 'glowstone',
  netherite: 'netherite_block',
  quartz: 'quartz_block',
  tnt: 'tnt_side',
};
const BLOCK_IDS = Object.keys(BLOCK_KEY_MAP);

function getBlockMainColor(blockId) {
  const key = BLOCK_KEY_MAP[blockId] || 'stone';
  const tex = BLOCK_TEXTURES[key];
  if (!tex) return '#7F7F7F';
  return tex[1]?.[1] || tex[2]?.[2] || '#7F7F7F';
}

const PICKAXE_SPEED = { wood: 1, stone: 2, iron: 3, diamond: 4, netherite: 5 };
const PICKAXE_KEY_MAP = {
  wood: 'wooden_pickaxe', stone: 'stone_pickaxe', iron: 'iron_pickaxe',
  diamond: 'diamond_pickaxe', netherite: 'netherite_pickaxe',
};

// 3×5 数字字模
const DIGIT_FONT = {
  "0": [7, 5, 5, 5, 7], "1": [2, 6, 2, 2, 7], "2": [7, 1, 7, 4, 7],
  "3": [7, 1, 7, 1, 7], "4": [5, 5, 7, 1, 1], "5": [7, 4, 7, 1, 7],
  "6": [7, 4, 7, 5, 7], "7": [7, 1, 1, 1, 1], "8": [7, 5, 7, 5, 7],
  "9": [7, 5, 7, 1, 7], ":": [0, 1, 0, 1, 0],
};

// ============================================================
// 基础
// ============================================================

function setPx(map, x, y, color) {
  if (!color) return;
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  map.set(`${x},${y}`, color);
}

function blitSprite(map, rows, dstX, dstY, scale = 1, mirrorX = false) {
  const srcH = rows.length;
  const srcW = rows[0]?.length || 0;
  // 源枚举：每个源像素 (sx, sy) 占用 [round(sx*s), round((sx+1)*s)) 区间
  //         左右对称的源像素必然产生对称的目标占用宽度（差最多 1px，但相邻源像素互补）
  for (let sy = 0; sy < srcH; sy++) {
    const dy0 = Math.round(sy * scale);
    const dy1 = Math.max(dy0 + 1, Math.round((sy + 1) * scale));
    for (let sx = 0; sx < srcW; sx++) {
      const dx0 = Math.round(sx * scale);
      const dx1 = Math.max(dx0 + 1, Math.round((sx + 1) * scale));
      const srcSx = mirrorX ? srcW - 1 - sx : sx;
      const c = rows[sy][srcSx];
      if (!c) continue;
      for (let dy = dy0; dy < dy1; dy++) {
        for (let dx = dx0; dx < dx1; dx++) {
          setPx(map, dstX + dx, dstY + dy, c);
        }
      }
    }
  }
}

// ============================================================
// 背景
// ============================================================
function drawBackground(map) {
  drawBiomeSky(map, "forest");
  drawClouds(map);
  drawForestGround(map);
}

function drawForestGround(map) {
  const tiles = [getSprite("biome_forest_0"), getSprite("biome_forest_1"), getSprite("biome_forest_2")];
  if (tiles.some((t) => !t)) return;
  const blockSize = 5;
  const groundY = HEIGHT - blockSize;
  let x = 0, idx = 0;
  while (x < WIDTH) {
    drawTileScaled(map, tiles[idx % 3], x, groundY, blockSize);
    x += blockSize;
    idx++;
  }

  // 伪 3D：地面顶部加亮顶面带 + 右侧每 5 列加 1px 暗侧面阴影
  // 顶面带：取每列底部已画的草色，调亮后画在 groundY-1 行
  for (let xx = 0; xx < WIDTH; xx++) {
    const top = map.get(`${xx},${groundY}`);
    if (top) {
      const lit = shadeHex(top, 1.25);
      // 在草地最上方加 1 行顶面亮带（盖在 groundY-1 行，原来是天空那行）
      // 注意：会把天空 1 行覆盖掉，伪 3D 立体感
      map.set(`${xx},${groundY - 1}`, lit);
    }
  }
  // 右侧暗阴影：每 5 列 +4 那一列每行画暗色
  for (let xx = 4; xx < WIDTH; xx += 5) {
    for (let yy = groundY; yy < HEIGHT; yy++) {
      const c = map.get(`${xx},${yy}`);
      if (c) map.set(`${xx},${yy}`, shadeHex(c, 0.7));
    }
  }
}
function drawTileScaled(map, tile, ox, oy, size) {
  if (!tile) return;
  const sx = size / tile.w, sy = size / tile.h;
  for (const [x, y, r, g, b, a] of tile.pixels) {
    if (a < 5) continue;
    const px = ox + Math.round(x * sx);
    const py = oy + Math.round(y * sy);
    if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) continue;
    const hex = "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
    map.set(`${px},${py}`, hex);
  }
}

// ============================================================
// Steve（永远背对屏幕）
// 走路：左/右腿前后错位 1px
// 工作臂 = sprite 列 12~15 那条（也就是源数据的"右臂"）
// ============================================================

// Steve 背面渲染（用于砸/搭）
function drawSteveBack(map, dstX, dstY, scale) {
  blitSprite(map, STEVE_BODY_PIXELS, dstX, dstY, scale, false);
  applySteveFake3D(map, dstX, dstY, scale, STEVE_BODY_PIXELS);
}

// 把 sprite 强制水平对称化（中线右半镜像盖到左半）
// 用于 idle 正面 Steve 让左右臂、五官在任意非整数缩放下都对称
function mirrorHalfHorizontal(rows) {
  const h = rows.length;
  if (!h) return rows;
  const w = rows[0].length;
  const half = Math.floor(w / 2);
  const out = rows.map(row => row.slice());
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < half; x++) {
      // 用右半镜像（右半 = w-1-x）覆盖左半 x
      out[y][x] = out[y][w - 1 - x];
    }
  }
  return out;
}

let _STEVE_FRONT_SYM = null;
function getSteveFrontSymmetric() {
  if (!_STEVE_FRONT_SYM) _STEVE_FRONT_SYM = mirrorHalfHorizontal(STEVE_FRONT_PIXELS);
  return _STEVE_FRONT_SYM;
}

// Steve 正面渲染（用于 idle）—— 用强制对称版数据 + 顶面亮带
function drawSteveFront(map, dstX, dstY, scale) {
  const sym = getSteveFrontSymmetric();
  blitSprite(map, sym, dstX, dstY, scale, false);
  applySteveFake3D(map, dstX, dstY, scale, sym);
}

// 给已画好的 Steve sprite 加顶面亮带（伪 3D）
// 用源像素枚举确保和 blitSprite 一致，左右对称源像素 → 左右对称亮带
function applySteveFake3D(map, dstX, dstY, scale, srcRows) {
  const srcH = srcRows.length;
  const srcW = srcRows[0]?.length || 0;
  for (let sx = 0; sx < srcW; sx++) {
    // 找该源列最上面的非 null sy
    let topSy = -1;
    for (let sy = 0; sy < srcH; sy++) {
      if (srcRows[sy]?.[sx]) { topSy = sy; break; }
    }
    if (topSy <= 0) continue;
    const c = srcRows[topSy][sx];
    if (!c) continue;
    const lit = shadeHex(c, 1.25);
    // 该源列在屏幕上的目标 dx 区间
    const dx0 = Math.round(sx * scale);
    const dx1 = Math.max(dx0 + 1, Math.round((sx + 1) * scale));
    // 该源像素在屏幕上的顶部目标 dy
    const topDy = Math.round(topSy * scale);
    if (topDy <= 0) continue;
    for (let dx = dx0; dx < dx1; dx++) {
      map.set(`${dstX + dx},${dstY + topDy - 1}`, lit);
    }
  }
}

// Steve 侧面渲染（用于走路），mirrorX = true 时朝左走
// walkFrame 0~3：腿前后摆动
function drawSteveSide(map, dstX, dstY, scale, mirrorX, walkFrame) {
  drawSteveSideXY(map, dstX, dstY, scale, scale, mirrorX, walkFrame);
}

// 侧身 X/Y 独立缩放（X 用 wScale 调宽，Y 用 hScale 调高）
function drawSteveSideXY(map, dstX, dstY, wScale, hScale, mirrorX, walkFrame) {
  // 头+身+大腿根（行 0~23）整体不动
  const upperBody = STEVE_SIDE_PIXELS.slice(0, 24);
  blitSpriteXY(map, upperBody, dstX, dstY, wScale, hScale, mirrorX);
  // 膝盖以下（行 24~31）摆动 ±2px
  const lowerLegs = STEVE_SIDE_PIXELS.slice(24, 32);
  let xOff = 0;
  if (walkFrame === 1) xOff = 2;
  else if (walkFrame === 3) xOff = -2;
  const legY = dstY + Math.round(24 * hScale);
  blitSpriteXY(map, lowerLegs, dstX + Math.round(xOff * wScale), legY, wScale, hScale, mirrorX);
}

// blitSprite 的 X/Y 独立缩放版
function blitSpriteXY(map, rows, dstX, dstY, wScale, hScale, mirrorX) {
  const srcH = rows.length;
  const srcW = rows[0]?.length || 0;
  const dstW = Math.round(srcW * wScale);
  const dstH = Math.round(srcH * hScale);
  for (let dy = 0; dy < dstH; dy++) {
    const sy = Math.min(srcH - 1, Math.floor(dy / hScale));
    for (let dx = 0; dx < dstW; dx++) {
      let sx = Math.min(srcW - 1, Math.floor(dx / wScale));
      if (mirrorX) sx = srcW - 1 - sx;
      const c = rows[sy][sx];
      if (c) setPx(map, dstX + dx, dstY + dy, c);
    }
  }
}

// 旧：背面 walk（保留以备需要时切回）
function drawSteveBackWalk(map, dstX, dstY, scale, walkFrame) {
  if (walkFrame === 0 || walkFrame === 2) {
    blitSprite(map, STEVE_BODY_PIXELS, dstX, dstY, scale, false);
    return;
  }
  const headBody = STEVE_BODY_PIXELS.slice(0, 20);
  blitSprite(map, headBody, dstX, dstY, scale, false);
  const legsRow = STEVE_BODY_PIXELS.slice(20, 32);
  const leftXOff = walkFrame === 1 ? 1 : -1;
  const rightXOff = -leftXOff;
  const legY = dstY + Math.round(20 * scale);
  const leftLeg = legsRow.map((row) => row.slice(0, 8).concat([null, null, null, null, null, null, null, null]));
  blitSprite(map, leftLeg, dstX + Math.round(leftXOff * scale), legY, scale, false);
  const rightLeg = legsRow.map((row) => [null, null, null, null, null, null, null, null].concat(row.slice(8, 16)));
  blitSprite(map, rightLeg, dstX + Math.round(rightXOff * scale), legY, scale, false);
}

// 计算工作臂手部末端坐标（不画，仅算位置）
function computeWorkArmHand(shoulderX, shoulderY, scale, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const ax = 0, ay = 0;
  const handLx = (2 - ax) * scale;
  const handLy = (STEVE_ARM_H - 1 - ay) * scale;
  return {
    handX: Math.round(shoulderX + handLx * cos - handLy * sin),
    handY: Math.round(shoulderY + handLx * sin + handLy * cos),
  };
}

// 工作臂（屏幕右侧那条）旋转绘制；用 forward mapping + 2x supersample
// 旋转锚点：肩膀内侧顶角 (sx=0, sy=0)（贴身体的那个点）
// angleDeg = 0 → 自然下垂；-90 → 平举；-110 → 举过头顶前伸
// 返回手部末端屏幕坐标 (用于贴手持物)
function drawSteveWorkArm(map, shoulderX, shoulderY, scale, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  // 锚点 = 肩膀内侧顶角（贴身体那一格）
  const ax = 0;
  const ay = 0;
  const SS = 1;  // 不做 supersample，让旋转后的臂占像素数和左臂一致
  for (let sy = 0; sy < STEVE_ARM_H; sy++) {
    for (let sx = 0; sx < STEVE_ARM_W; sx++) {
      const c = STEVE_ARM_PIXELS[sy]?.[sx];
      if (!c) continue;
      for (let suy = 0; suy < SS; suy++) {
        for (let sux = 0; sux < SS; sux++) {
          const lx = (sx + (sux + 0.5) / SS - ax) * scale;
          const ly = (sy + (suy + 0.5) / SS - ay) * scale;
          const rx = lx * cos - ly * sin;
          const ry = lx * sin + ly * cos;
          setPx(map, Math.round(shoulderX + rx), Math.round(shoulderY + ry), c);
        }
      }
    }
  }
  // 手部末端 (sprite (2, 11) = 臂中下方手腕中心)
  const handLx = (2 - ax) * scale;
  const handLy = (STEVE_ARM_H - 1 - ay) * scale;
  return {
    handX: Math.round(shoulderX + handLx * cos - handLy * sin),
    handY: Math.round(shoulderY + handLx * sin + handLy * cos),
  };
}

// ============================================================
// 方块/镐子/打火石 绘制
// ============================================================

// =========================================================================
// 背身简化镐子 sprite（用户自定义，3 宽 × 7 高）
// 'h' = 镐头（按镐子类型取真实纹理的镐头主色）
// 'c' = 柄（统一棕色 #8a5a2e / 暗 #5a3818）
// '.' = 透明
// =========================================================================
const VERTICAL_PICKAXE_LAYOUT = {
  w: 3,
  h: 7,
  rows: [".c.", "hhh", ".h.", ".c.", ".c.", ".c.", ".c."],
};

// 按镐子类型取镐头主色（从 pickaxe 16×16 纹理中心取色）
function getPickaxeHeadColor(pickType) {
  const key = PICKAXE_KEY_MAP[pickType] || 'iron_pickaxe';
  const tex = PICKAXE_TEXTURES[key];
  if (!tex) return '#c1c1c1';
  // 取 sprite (4, 3) 一带的镐头中心色
  return tex[3]?.[7] || tex[3]?.[6] || '#c1c1c1';
}

// 生成竖直镐子像素数据（每次按当前 pickType 即时填充镐头色）
function getVerticalPickaxePixels(pickType) {
  const headColor = getPickaxeHeadColor(pickType);
  const handleColor = '#8a5a2e';
  return VERTICAL_PICKAXE_LAYOUT.rows.map((row) =>
    [...row].map((ch) => {
      if (ch === 'h') return headColor;
      if (ch === 'c') return handleColor;
      return null;
    })
  );
}
function shadeHex(hex, factor) {
  if (!hex) return null;
  const r = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(1, 3), 16) * factor)));
  const g = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(3, 5), 16) * factor)));
  const b = Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(5, 7), 16) * factor)));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function drawBlockFlat(map, x, y, blockId, scale = 1) {
  const key = BLOCK_KEY_MAP[blockId] || 'stone';
  const tex = BLOCK_TEXTURES[key];
  if (!tex) return;
  const dstSize = Math.max(1, Math.round(BLOCK_SIZE * scale));
  for (let dy = 0; dy < dstSize; dy++) {
    const sy = Math.min(BLOCK_SIZE - 1, Math.floor(dy / scale));
    for (let dx = 0; dx < dstSize; dx++) {
      const sx = Math.min(BLOCK_SIZE - 1, Math.floor(dx / scale));
      const c = tex[sy]?.[sx];
      if (c) setPx(map, x + dx, y + dy, c);
    }
  }
}

// 模式 B：4×5（顶部加一行高光顶面带）
function drawBlockTopBand(map, x, y, blockId, scale = 1) {
  const key = BLOCK_KEY_MAP[blockId] || 'stone';
  const tex = BLOCK_TEXTURES[key];
  if (!tex) return;
  const dstSize = Math.max(1, Math.round(BLOCK_SIZE * scale));
  // 顶面亮带 1 行（用顶面纹理或派生亮色）
  // 顶面色取最上一行的平均，调亮 1.2 倍
  const topRow = tex[0] || [];
  for (let dx = 0; dx < dstSize; dx++) {
    const sx = Math.min(BLOCK_SIZE - 1, Math.floor(dx / scale));
    const c = shadeHex(topRow[sx], 1.3);
    if (c) setPx(map, x + dx, y, c);
  }
  // 正面 4×4
  for (let dy = 0; dy < dstSize; dy++) {
    const sy = Math.min(BLOCK_SIZE - 1, Math.floor(dy / scale));
    for (let dx = 0; dx < dstSize; dx++) {
      const sx = Math.min(BLOCK_SIZE - 1, Math.floor(dx / scale));
      const c = tex[sy]?.[sx];
      if (c) setPx(map, x + dx, y + 1 + dy, c);
    }
  }
}

// 模式 C：5×5 等距 3D（顶面斜切 + 正面 + 侧面）
//  方块占用 5×5：
//   . T T T T          T = 顶面（亮）
//   T T T T S          S = 侧面（暗）
//   F F F F S          F = 正面纹理
//   F F F F S
//   F F F F S
function drawBlockFake3D(map, x, y, blockId, scale = 1) {
  const key = BLOCK_KEY_MAP[blockId] || 'stone';
  const tex = BLOCK_TEXTURES[key];
  if (!tex) return;
  const sz = Math.max(1, Math.round(BLOCK_SIZE * scale));
  const totalH = sz + 2; // +1 顶 +1 侧
  const totalW = sz + 1;

  // 顶面颜色（亮）
  const topColor = shadeHex(tex[0]?.[1] || '#888', 1.4);
  const sideColor = shadeHex(tex[0]?.[1] || '#888', 0.65);

  // 顶面菱形：行 0 是 (1, sz-1)，行 1 是 (0, sz-2)（向左下偏移）
  for (let i = 0; i < sz; i++) {
    setPx(map, x + 1 + i, y, topColor);              // 顶部边缘行
    setPx(map, x + i, y + 1, topColor);              // 顶面接正面交界
  }
  // 顶面右侧延伸（一个像素）
  setPx(map, x + sz, y + 1, shadeHex(topColor, 0.8));

  // 正面纹理
  for (let dy = 0; dy < sz; dy++) {
    const sy = Math.min(BLOCK_SIZE - 1, Math.floor(dy / scale));
    for (let dx = 0; dx < sz; dx++) {
      const sx = Math.min(BLOCK_SIZE - 1, Math.floor(dx / scale));
      const c = tex[sy]?.[sx];
      if (c) setPx(map, x + dx, y + 2 + dy, c);
    }
  }

  // 右侧侧面 1 列（行 2~ sz+1）
  for (let dy = 0; dy < sz; dy++) {
    setPx(map, x + sz, y + 2 + dy, sideColor);
  }
}

// 派发器
function drawBlock(map, x, y, blockId, scale = 1, mode = 'flat') {
  if (mode === 'topBand') return drawBlockTopBand(map, x, y, blockId, scale);
  if (mode === 'fake3d') return drawBlockFake3D(map, x, y, blockId, scale);
  return drawBlockFlat(map, x, y, blockId, scale);
}

// 镐子按 angle 旋转贴到屏幕（柄端绑在手部）
// sprite 是 16×16 原版（PICKAXE_SIZE = 16），根据 scale 缩放
// 标准 MC 镐子图：头在右上、柄在左下
function drawPickaxe(map, handX, handY, pickType, angleDeg, scale = 1) {
  const key = PICKAXE_KEY_MAP[pickType] || 'iron_pickaxe';
  const tex = PICKAXE_TEXTURES[key];
  if (!tex) return;
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  // 柄端锚点：sprite 左下角 (0, PICKAXE_SIZE-1)
  // 用户基于这个锚点调过 X/Y/Scale/Rotate，请勿擅自修改
  const ax = 0, ay = PICKAXE_SIZE - 1;
  const SS = 2;
  for (let sy = 0; sy < PICKAXE_SIZE; sy++) {
    for (let sx = 0; sx < PICKAXE_SIZE; sx++) {
      const c = tex[sy]?.[sx];
      if (!c) continue;
      for (let suy = 0; suy < SS; suy++) {
        for (let sux = 0; sux < SS; sux++) {
          const lx = (sx + (sux + 0.5) / SS - ax) * scale;
          const ly = (sy + (suy + 0.5) / SS - ay) * scale;
          const rx = lx * cos - ly * sin;
          const ry = lx * sin + ly * cos;
          setPx(map, Math.round(handX + rx), Math.round(handY + ry), c);
        }
      }
    }
  }
}

function drawFlintAndSteel(map, x, y) {
  setPx(map, x + 1, y, "#A0A0A0");
  setPx(map, x + 2, y, "#646464");
  setPx(map, x + 0, y + 1, "#646464");
  setPx(map, x + 1, y + 1, "#DBDBDB");
  setPx(map, x + 2, y + 1, "#A0A0A0");
  setPx(map, x + 0, y + 2, "#5A3818");
  setPx(map, x + 1, y + 2, "#8A5A2E");
}

// ============================================================
// 时间方块布局
// ============================================================

function getTimeText(hourFormat) {
  const now = new Date();
  let h = now.getHours();
  if (hourFormat === 12) {
    h = h % 12;
    if (h === 0) h = 12;
  }
  return `${String(h).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getTimeBlockPositions(timeText) {
  const positions = [];
  const blockSize = BLOCK_SIZE;
  const charGap = 1;

  let totalW = 0;
  for (let i = 0; i < timeText.length; i++) {
    const charW = timeText[i] === ":" ? 1 : 3;
    totalW += charW * blockSize;
    if (i < timeText.length - 1) totalW += charGap;
  }

  const startX = Math.floor((WIDTH - totalW) / 2);
  const startY = 12;

  // 同时记录每个字符的水平中心 X（用于 Steve 站位）
  const charCenters = [];
  let cursorX = startX;
  for (let i = 0; i < timeText.length; i++) {
    const ch = timeText[i];
    const rows = DIGIT_FONT[ch];
    const charW = ch === ":" ? 1 : 3;
    const charPixelW = charW * blockSize;
    const centerX = cursorX + Math.round(charPixelW / 2);
    charCenters.push({ ch, centerX, leftX: cursorX, rightX: cursorX + charPixelW });

    if (rows) {
      for (let row = 0; row < rows.length; row++) {
        const bits = rows[row];
        for (let col = 0; col < charW; col++) {
          const mask = 1 << (charW - 1 - col);
          if (bits & mask) {
            positions.push({
              x: cursorX + col * blockSize,
              y: startY + row * blockSize,
              charIdx: i,
            });
          }
        }
      }
    }
    cursorX += charPixelW + charGap;
  }

  return { positions, charCenters };
}

function pickBlockId(style) {
  if (style !== "random" && BLOCK_KEY_MAP[style]) return style;
  return BLOCK_IDS[Math.floor(Math.random() * BLOCK_IDS.length)];
}

// ============================================================
// 状态机
// ============================================================

const PHASES = {
  IDLE: 'idle',
  WALK_TO_BREAK: 'walkToBreak',
  BREAK_HIT: 'breakHit',
  WALK_TO_BUILD: 'walkToBuild',
  BUILD_HIT: 'buildHit',
};

function createMinecraftClockState(config) {
  const safe = {
    pickaxe: config?.pickaxe || "iron",
    blockStyle: config?.blockStyle || "random",
    hourFormat: config?.hourFormat || 24,
    steveScale: typeof config?.steveScale === "number" ? config.steveScale : 100,
    steveX: typeof config?.steveX === "number" ? config.steveX : 0,
    steveY: typeof config?.steveY === "number" ? config.steveY : 0,
    walkSpeed: typeof config?.walkSpeed === "number" ? config.walkSpeed : 1.0,
    // 镐子手持调整（默认全 0 / 100，原始素材直贴）
    pickItemX: typeof config?.pickItemX === "number" ? config.pickItemX : 0,
    pickItemY: typeof config?.pickItemY === "number" ? config.pickItemY : 0,
    pickItemScale: typeof config?.pickItemScale === "number" ? config.pickItemScale : 100,
    pickItemRotate: typeof config?.pickItemRotate === "number" ? config.pickItemRotate : 0,
    // 右臂肩膀位置 X/Y 偏移（用户调）
    armOffsetX: typeof config?.armOffsetX === "number" ? config.armOffsetX : 0,
    armOffsetY: typeof config?.armOffsetY === "number" ? config.armOffsetY : 0,
    // 方块手持调整
    blockItemX: typeof config?.blockItemX === "number" ? config.blockItemX : 0,
    blockItemY: typeof config?.blockItemY === "number" ? config.blockItemY : 0,
    blockItemScale: typeof config?.blockItemScale === "number" ? config.blockItemScale : 100,
    blockItemRotate: typeof config?.blockItemRotate === "number" ? config.blockItemRotate : 0,
    // 砸/搭时手臂顶端角度（默认 -110° 举过头顶前伸）
    armPeakAngle: typeof config?.armPeakAngle === "number" ? config.armPeakAngle : -110,
    // 砸/搭挥手摆动幅度（度）
    armSwingAmp: typeof config?.armSwingAmp === "number" ? config.armSwingAmp : 30,
    // 侧身缩放（独立于主 steveScale，默认 75% 让 4×32 源数据 → 3×24 屏幕）
    sideScale: typeof config?.sideScale === "number" ? config.sideScale : 75,
    // 方块渲染模式：'flat' | 'topBand' | 'fake3d'
    blockRenderMode: config?.blockRenderMode || 'flat',
    // 砸/搭顺序
    breakCharOrder: config?.breakCharOrder || 'leftToRight',  // 'leftToRight' | 'rightToLeft'
    breakBlockOrder: config?.breakBlockOrder || 'topToBottom', // 'topToBottom' | 'bottomToTop'
    buildCharOrder: config?.buildCharOrder || 'rightToLeft',
    buildBlockOrder: config?.buildBlockOrder || 'bottomToTop',
    // 调试静态模式：'off' | 'pickaxe' | 'block'
    debugStatic: config?.debugStatic || 'off',
    // 摧毁朝向：'side' 侧身挥砸 / 'back' 背身挥砸（默认背身保留）
    breakFacing: config?.breakFacing || 'back',
  };

  const timeText = getTimeText(safe.hourFormat);
  const { positions, charCenters } = getTimeBlockPositions(timeText);
  const blocks = positions.map((pos) => ({
    ...pos,
    blockId: pickBlockId(safe.blockStyle),
    visible: true,
    broken: false,
  }));

  return {
    config: safe,
    timeText,
    blocks,
    charCenters,                     // 字符中心 X 列表
    phase: PHASES.IDLE,
    phaseFrame: 0,
    lastMinute: new Date().getMinutes(),
    charIdx: 0,                      // 当前要处理的字符下标
    blocksOfChar: [],                // 当前字符内剩余要砸/搭的方块（按行 y 升序）
    blockSubIdx: 0,                  // blocksOfChar 里的下一个
    steveScreenX: 2 + safe.steveX,
    walkTargetX: null,
    armAngle: 0,
    walkLeg: 0,
    walkLegTick: 0,
    facingLeft: false,
    buildQueue: null,
    buildCharIdxList: [],            // 搭建顺序（字符下标）
  };
}

// Steve 站到字符正下方时的 X
// 让 Steve 身体中心（背面 16/2=8，按 scale）对齐字符中心
function getStandXForCharCenter(state, centerX) {
  const scale = state.config.steveScale / 100;
  return centerX - Math.round(STEVE_W * scale / 2);
}

function getSteveDisplayHeight(state) {
  return Math.round(STEVE_H * (state.config.steveScale / 100));
}

// 取该字符下未砸的方块（按用户自定义顺序，缺失则降级到顶→底/底→顶）
function getCharBlocks(state, charIdx) {
  const list = state.blocks.filter((b) => b.charIdx === charIdx && !b.broken);
  // 优先使用 DIGIT_ORDERS 自定义顺序
  list.sort((a, b) => {
    const oa = getBlockCellOrder(a, 'break', state.charCenters);
    const ob = getBlockCellOrder(b, 'break', state.charCenters);
    if (oa !== ob) return oa - ob;
    // 同优先级（或 999 表示顺序里没标）→ 按用户的 toggle 兜底
    if (state.config.breakBlockOrder === 'bottomToTop') {
      return b.y - a.y || a.x - b.x;
    }
    return a.y - b.y || a.x - b.x;
  });
  return list;
}

// 取该字符下未搭的方块（按用户自定义搭建顺序）
function getCharBuildBlocks(state, charIdx) {
  const list = state.buildQueue.filter((b) => b.charIdx === charIdx && !b.visible);
  list.sort((a, b) => {
    const oa = getBlockCellOrder(a, 'build', state.charCenters);
    const ob = getBlockCellOrder(b, 'build', state.charCenters);
    if (oa !== ob) return oa - ob;
    if (state.config.buildBlockOrder === 'topToBottom') {
      return a.y - b.y || a.x - b.x;
    }
    return b.y - a.y || a.x - b.x;
  });
  return list;
}

// ============================================================
// 自定义数字处理顺序（用户在 tools/digit-order-editor.html 里标好后导入）
// 字符串 15 位，对应字符 5 行×3 列 row-major：第 i 位 = (row=floor(i/3), col=i%3)
// 字符值 base36：'0'=空/不参与该顺序，'1'-'z'=1~35 的处理时机
// ============================================================
const DIGIT_ORDERS = {
  "0": { build: "acb809607405123", break: "123405607809acb" },
  "1": { build: "080760050040123", break: "010230040050678" },
  "2": { build: "ba9008567400321", break: "1230047658009ab" },
  "3": { build: "ba9008765004123", break: "1230045670089ab" },
  "4": { build: "809607543002001", break: "105206347008009" },
  "5": { build: "9ab800765004123", break: "321400567008ba9" },
  "6": { build: "abc900687405123", break: "321400567809cba" },
  "7": { build: "765004003002001", break: "123004005006007" },
  "8": { build: "cdba09786504321", break: "12340567890abcd" },
  "9": { build: "bca908765004123", break: "123405678009cba" },
};

// 给方块算它在所在字符的 cellIdx (row*3 + col) 和该字符的 char 值
function getBlockCellOrder(block, mode /* 'build' | 'break' */, charCenters) {
  const charInfo = charCenters[block.charIdx];
  if (!charInfo) return 999;
  const charDef = DIGIT_ORDERS[charInfo.ch];
  if (!charDef) return 999;
  const startY = 12; // 与 getTimeBlockPositions 里 startY 一致
  const localCol = Math.round((block.x - charInfo.leftX) / BLOCK_SIZE);
  const localRow = Math.round((block.y - startY) / BLOCK_SIZE);
  const cellIdx = localRow * 3 + localCol;
  const orderStr = mode === 'build' ? charDef.build : charDef.break;
  if (cellIdx < 0 || cellIdx >= orderStr.length) return 999;
  const ch = orderStr[cellIdx];
  if (ch === '0') return 999;
  return parseInt(ch, 36);
}

function startBreakSequence(state) {
  // 重新生成方块（基于当前时间）
  const newText = getTimeText(state.config.hourFormat);
  const { positions, charCenters } = getTimeBlockPositions(newText);
  state.blocks = positions.map((pos) => ({
    ...pos,
    blockId: pickBlockId(state.config.blockStyle),
    visible: true,
    broken: false,
  }));
  state.charCenters = charCenters;
  state.timeText = newText;
  // 按配置的字符顺序找第一个有方块的字符
  const charIdxs = state.config.breakCharOrder === 'rightToLeft'
    ? Array.from({ length: charCenters.length }, (_, i) => charCenters.length - 1 - i)
    : Array.from({ length: charCenters.length }, (_, i) => i);
  state.charIdx = -1;
  state.breakCharIdxList = [];
  for (const i of charIdxs) {
    if (state.blocks.some((b) => b.charIdx === i)) {
      state.breakCharIdxList.push(i);
    }
  }
  if (state.breakCharIdxList.length === 0) {
    state.phase = PHASES.IDLE;
    return;
  }
  state.charIdx = state.breakCharIdxList.shift();
  state.phase = PHASES.WALK_TO_BREAK;
  state.phaseFrame = 0;
  state.walkTargetX = getStandXForCharCenter(state, charCenters[state.charIdx].centerX);
}

function startBuildSequence(state) {
  const newText = getTimeText(state.config.hourFormat);
  const { positions, charCenters } = getTimeBlockPositions(newText);
  state.timeText = newText;
  state.charCenters = charCenters;
  state.buildQueue = positions.map((pos) => ({
    ...pos,
    blockId: pickBlockId(state.config.blockStyle),
    visible: false,
  }));
  // 搭建按配置的字符顺序
  state.buildCharIdxList = [];
  const buildOrder = state.config.buildCharOrder === 'leftToRight'
    ? Array.from({ length: charCenters.length }, (_, i) => i)
    : Array.from({ length: charCenters.length }, (_, i) => charCenters.length - 1 - i);
  for (const i of buildOrder) {
    if (state.buildQueue.some((b) => b.charIdx === i)) {
      state.buildCharIdxList.push(i);
    }
  }
  if (state.buildCharIdxList.length === 0) {
    state.phase = PHASES.IDLE;
    return;
  }
  state.charIdx = state.buildCharIdxList.shift();
  state.blocks = state.buildQueue;
  state.phase = PHASES.WALK_TO_BUILD;
  state.phaseFrame = 0;
  state.walkTargetX = getStandXForCharCenter(state, charCenters[state.charIdx].centerX);
}

function stepWalk(state) {
  const dx = state.walkTargetX - state.steveScreenX;
  const speed = state.config.walkSpeed;
  // 记录朝向（移动方向）：dx > 0 朝右，dx < 0 朝左
  if (Math.abs(dx) > 0.01) {
    state.facingLeft = dx < 0;
  }
  if (Math.abs(dx) <= speed) {
    state.steveScreenX = state.walkTargetX;
    return true; // 到达
  }
  state.steveScreenX += Math.sign(dx) * speed;
  // 更新走路腿动画
  state.walkLegTick++;
  if (state.walkLegTick >= 4) {
    state.walkLegTick = 0;
    state.walkLeg = (state.walkLeg + 1) % 4;
  }
  return false;
}

function stepMinecraftClockState(state) {
  state.phaseFrame++;
  const currentMinute = new Date().getMinutes();

  switch (state.phase) {
    case PHASES.IDLE:
      state.armFrameIdx = 0;
      state.walkLeg = 0;
      if (currentMinute !== state.lastMinute) {
        state.lastMinute = currentMinute;
        startBreakSequence(state);
      }
      break;

    case PHASES.WALK_TO_BREAK:
      state.armFrameIdx = 0;
      if (stepWalk(state)) {
        // 到达字符下方，准备开始砸该字符所有方块
        state.blocksOfChar = getCharBlocks(state, state.charIdx);
        state.blockSubIdx = 0;
        if (state.blocksOfChar.length === 0) {
          // 该字符没方块（不应发生，跳到下一字符）
          gotoNextBreakChar(state);
        } else {
          state.phase = PHASES.BREAK_HIT;
          state.phaseFrame = 0;
        }
      }
      break;

    case PHASES.BREAK_HIT: {
      const speed = PICKAXE_SPEED[state.config.pickaxe] || 3;
      const totalFrames = Math.max(8, 24 - speed * 3);
      // 手臂固定在 frame 6（垂直举高 - 手在头顶高度）不变
      state.armFrameIdx = 6;
      // 镐子 Y 偏移 5 帧动画（高→中→砸下→中→高）
      const seq = [0, 4, 8, 4, 0];
      const stepLen = totalFrames / seq.length;
      const stepIdx = Math.min(seq.length - 1, Math.floor(state.phaseFrame / stepLen));
      state.pickSwingY = seq[stepIdx];

      // 在 t≈0.5（镐子砸到底）时摧毁方块
      if (state.phaseFrame === Math.floor(totalFrames / 2)) {
        const block = state.blocksOfChar[state.blockSubIdx];
        if (block && !block.broken) {
          block.broken = true;
          block.visible = false;
        }
      }

      if (state.phaseFrame >= totalFrames) {
        state.blockSubIdx++;
        if (state.blockSubIdx < state.blocksOfChar.length) {
          state.phaseFrame = 0;
        } else {
          gotoNextBreakChar(state);
        }
      }
      break;
    }

    case PHASES.WALK_TO_BUILD:
      state.armFrameIdx = 0;
      if (stepWalk(state)) {
        // 该字符的方块按用户自定义搭建顺序
        state.blocksOfChar = getCharBuildBlocks(state, state.charIdx);
        state.blockSubIdx = 0;
        if (state.blocksOfChar.length === 0) {
          gotoNextBuildChar(state);
        } else {
          state.phase = PHASES.BUILD_HIT;
          state.phaseFrame = 0;
        }
      }
      break;

    case PHASES.BUILD_HIT: {
      const totalFrames = 4;
      // 搭建：手举高 → 放下 → 收起，用 frame 4(高举)→3(斜上)→4(回高举) 表达
      const seq = [4, 3, 4];
      const stepLen = totalFrames / seq.length;
      const stepIdx = Math.min(seq.length - 1, Math.floor(state.phaseFrame / stepLen));
      state.armFrameIdx = seq[stepIdx];

      if (state.phaseFrame === Math.floor(totalFrames / 2)) {
        const block = state.blocksOfChar[state.blockSubIdx];
        if (block) block.visible = true;
      }

      if (state.phaseFrame >= totalFrames) {
        state.blockSubIdx++;
        if (state.blockSubIdx < state.blocksOfChar.length) {
          state.phaseFrame = 0;
        } else {
          gotoNextBuildChar(state);
        }
      }
      break;
    }
  }
}

function gotoNextBreakChar(state) {
  if (state.breakCharIdxList.length === 0) {
    // 全砸完，进入搭建
    startBuildSequence(state);
    return;
  }
  state.charIdx = state.breakCharIdxList.shift();
  state.phase = PHASES.WALK_TO_BREAK;
  state.phaseFrame = 0;
  state.walkTargetX = getStandXForCharCenter(state, state.charCenters[state.charIdx].centerX);
}

function gotoNextBuildChar(state) {
  if (state.buildCharIdxList.length === 0) {
    state.phase = PHASES.IDLE;
    state.phaseFrame = 0;
    state.buildQueue = null;
    return;
  }
  state.charIdx = state.buildCharIdxList.shift();
  state.phase = PHASES.WALK_TO_BUILD;
  state.phaseFrame = 0;
  state.walkTargetX = getStandXForCharCenter(state, state.charCenters[state.charIdx].centerX);
}

// ============================================================
// 渲染
// ============================================================

// ============================================================
// 统一画"Steve 背身 + 右臂 + 手持物"的辅助函数
// debug 模式和正式 BREAK_HIT/BUILD_HIT 都用同一套逻辑，
// 保证用户在 debug 模式调好的 X/Y/Scale/Rotate 在正式动画中表现一致
// ============================================================
// 用 5 帧预渲染手臂 sprite（不实时旋转）+ 镐子/方块贴在手部
// armFrameIdx: 0~4 ， 0=自然下垂 1=斜下 2=水平 3=斜上 4=高举
function drawSteveWithItem(map, steveX, steveY, scale, armFrameIdx, itemKind, state) {
  drawSteveBack(map, steveX, steveY, scale);

  // 右臂帧贴到背身画布上：
  // STEVE_BODY_PIXELS 是 16×32，右臂位置在列 12~15 行 8~19
  // 挥手 sprite 是 25×25，肩部锚点在 (12, 12)
  // 把肩部锚点对齐 STEVE_BODY (12, 8)
  const armSprite = STEVE_SWING_ARM_FRAMES[armFrameIdx] || STEVE_SWING_ARM_FRAMES[0];
  const armHand = STEVE_SWING_ARM_HANDS[armFrameIdx] || STEVE_SWING_ARM_HANDS[0];
  // 挥手 sprite 在 Steve 身上的偏移（让肩部 (12,12) 对齐 sprite 内 (12, 8)）
  const armSpriteX = steveX + Math.round((12 - STEVE_SWING_ARM_SHOULDER_X) * scale);
  const armSpriteY = steveY + Math.round((8 - STEVE_SWING_ARM_SHOULDER_Y) * scale);
  blitSprite(map, armSprite, armSpriteX, armSpriteY, scale, false);

  // 计算手部屏幕坐标（用于贴镐子）
  const handScreenX = armSpriteX + Math.round(armHand.x * scale);
  const handScreenY = armSpriteY + Math.round(armHand.y * scale);

  if (itemKind === 'pickaxe') {
    const itemScale = (state.config.pickItemScale / 100) * 2; // ×2 让 3×7 镐子放大成 6×14
    const lox = state.config.pickItemX;
    const loy = state.config.pickItemY;
    const itemX = handScreenX + Math.round(lox);
    const itemY = handScreenY + Math.round(loy);
    // 永远用 3×7 简化竖直镐子（debug 持镐 + BREAK_HIT 都用同一套）
    const pixels = getVerticalPickaxePixels(state.config.pickaxe);
    const anchorX = 1;
    const anchorY = 3;
    // BREAK_HIT 时镐子有 Y 摆动；其他阶段 swingY=0
    const swingY = (state.phase === PHASES.BREAK_HIT) ? (state.pickSwingY || 0) : 0;
    const dstX = itemX - Math.round(anchorX * itemScale);
    const dstY = itemY - Math.round(anchorY * itemScale) + Math.round(swingY * itemScale);
    blitSprite(map, pixels, dstX, dstY, itemScale, false);
  } else if (itemKind === 'block') {
    const itemScale = state.config.blockItemScale / 100;
    const lox = state.config.blockItemX;
    const loy = state.config.blockItemY;
    const itemX = handScreenX + Math.round(lox);
    const itemY = handScreenY + Math.round(loy);
    const blkSize = Math.max(1, Math.round(BLOCK_SIZE * itemScale));
    drawBlock(map, itemX - Math.floor(blkSize / 2), itemY - Math.floor(blkSize / 2),
      getCurrentBlockId(state), itemScale, state.config.blockRenderMode);
  }
}

// 镐子绕"sprite 中心 (8,8)" 旋转贴到指定坐标
function drawPickaxeAtCenter(map, cx, cy, pickType, angleDeg, scale) {
  const tex = PICKAXE_TEXTURES[PICKAXE_KEY_MAP[pickType] || 'iron_pickaxe'];
  if (!tex) return;
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const ax = 8, ay = 8;
  const SS = 2;
  for (let sy = 0; sy < 16; sy++) {
    for (let sx = 0; sx < 16; sx++) {
      const c = tex[sy]?.[sx];
      if (!c) continue;
      for (let suy = 0; suy < SS; suy++) {
        for (let sux = 0; sux < SS; sux++) {
          const lx = (sx + (sux + 0.5) / SS - ax) * scale;
          const ly = (sy + (suy + 0.5) / SS - ay) * scale;
          const rx = lx * cos - ly * sin;
          const ry = lx * sin + ly * cos;
          setPx(map, Math.round(cx + rx), Math.round(cy + ry), c);
        }
      }
    }
  }
}

// 取当前要搭的方块 id（搭建阶段用 buildQueue[targetIdx]，否则用 blockStyle）
function getCurrentBlockId(state) {
  if (state.phase === PHASES.BUILD_HIT && state.buildQueue && state.targetIdx < state.buildQueue.length) {
    return state.buildQueue[state.targetIdx]?.blockId || 'stone';
  }
  if (state.config.blockStyle === 'random') return 'diamond';
  return state.config.blockStyle;
}

// ============================================================
// 调试静态渲染：复用 drawSteveWithItem，让用户调好的参数等同 BREAK_HIT 表现
// ============================================================
function drawDebugStatic(map, state, mode) {
  const scale = state.config.steveScale / 100;
  // 侧身举手姿势（包含侧身身体 + 水平前伸的手臂）
  const sprite = STEVE_SIDE_HOLD_FRAME;
  const sideW = Math.round(STEVE_SIDE_HOLD_W * scale);
  const sideH = Math.round(STEVE_SIDE_HOLD_H * scale);
  // 居中
  const sideX = Math.round((WIDTH - sideW) / 2 + state.config.steveX);
  const sideY = GROUND_TOP_Y - sideH + state.config.steveY;
  blitSpriteXY(map, sprite, sideX, sideY, scale, scale, false);

  // 手腕末端屏幕坐标（手部位置）
  const handScreenX = sideX + Math.round(STEVE_SIDE_HOLD_HAND_X * scale);
  const handScreenY = sideY + Math.round(STEVE_SIDE_HOLD_HAND_Y * scale);

  // 贴镐子 / 方块
  if (mode === 'pickaxe') {
    const itemScale = state.config.pickItemScale / 100;
    const lox = state.config.pickItemX;
    const loy = state.config.pickItemY;
    const itemX = handScreenX + lox;
    const itemY = handScreenY + loy;
    drawPickaxeAtCenter(map, itemX, itemY, state.config.pickaxe,
      state.config.pickItemRotate, itemScale);
  } else if (mode === 'block') {
    const blockId = state.config.blockStyle === 'random' ? 'diamond' : state.config.blockStyle;
    const itemScale = state.config.blockItemScale / 100;
    const lox = state.config.blockItemX;
    const loy = state.config.blockItemY;
    const itemX = handScreenX + lox;
    const itemY = handScreenY + loy;
    const blkSize = Math.max(1, Math.round(BLOCK_SIZE * itemScale));
    drawBlock(map, itemX - Math.floor(blkSize / 2), itemY - Math.floor(blkSize / 2),
      blockId, itemScale, state.config.blockRenderMode);
  }

  // 后画手腕色块（4×4 皮肤色），覆盖镐子柄/方块下沿，看起来"手握住"
  // 取手臂源数据 sy=10~11（手腕段）的色
  const wristColor = STEVE_ARM_PIXELS[10]?.[1] || '#aa7d66';
  const wristSize = Math.max(1, Math.round(3 * scale));
  for (let dy = 0; dy < wristSize; dy++) {
    for (let dx = 0; dx < wristSize; dx++) {
      setPx(map, handScreenX + dx - Math.floor(wristSize / 2),
                 handScreenY + dy - Math.floor(wristSize / 2), wristColor);
    }
  }
}

function renderMinecraftClockFrame(state) {
  const map = new Map();

  // 1. 背景
  drawBackground(map);

  // 调试静态模式：跳过状态机动画，直接显示静态 Steve + 手持物
  const debugMode = state.config.debugStatic;
  if (debugMode === 'pickaxe' || debugMode === 'block') {
    drawDebugStatic(map, state, debugMode);
    return map;
  }

  // 2. 时间方块（按 Y 降序画：底部先画，上方方块的正面下沿才能覆盖下方方块的顶面带，
  //    形成 fake3d 堆叠正确的视觉层级）
  const blockMode = state.config.blockRenderMode || 'flat';
  const visibleBlocks = state.blocks.filter((b) => b.visible).sort((a, b) => b.y - a.y || a.x - b.x);
  for (const b of visibleBlocks) {
    drawBlock(map, b.x, b.y, b.blockId, 1, blockMode);
  }

  // 3. Steve
  const scale = state.config.steveScale / 100;
  const steveX = Math.round(state.steveScreenX);
  const steveY = GROUND_TOP_Y - getSteveDisplayHeight(state) + state.config.steveY;
  state.cy = steveY + Math.round(STEVE_H * scale * 0.3);

  const isWalking = (state.phase === PHASES.WALK_TO_BREAK || state.phase === PHASES.WALK_TO_BUILD);
  const isWorking = (state.phase === PHASES.BREAK_HIT || state.phase === PHASES.BUILD_HIT);

  if (isWalking) {
    // 走路：先画手中物 → 再画身体盖住一半（局部遮挡，看起来手在身后捏着）
    const sScale = state.config.sideScale / 100;
    const heightScale = scale;
    const sideW = Math.round(STEVE_SIDE_W * sScale);
    const sideH = Math.round(STEVE_SIDE_H * heightScale);
    const sideSteveX = Math.round(state.steveScreenX) + Math.round((STEVE_W * scale - sideW) / 2);
    const sideSteveY = GROUND_TOP_Y - sideH + state.config.steveY;

    // 物品锚点：腰部高度，紧贴身体外侧（朝左走 = 左走时身体左外侧 = sx=0；朝右走 = sx=3）
    const handLocalX = state.facingLeft ? 0 : 3;
    const handLocalY = 19;
    const handScreenX = sideSteveX + Math.round(handLocalX * sScale);
    const handScreenY = sideSteveY + Math.round(handLocalY * heightScale);

    // 1. 先画物品（会被身体盖一半）
    if (state.phase === PHASES.WALK_TO_BREAK) {
      // 走路捏镐子：用 3×7 竖直版（与 BREAK_HIT 一致）
      const itemScale = (state.config.pickItemScale / 100) * 2;
      const pixels = getVerticalPickaxePixels(state.config.pickaxe);
      const anchorX = 1, anchorY = 3;
      const dstX = handScreenX - Math.round(anchorX * itemScale);
      const dstY = handScreenY - Math.round(anchorY * itemScale);
      blitSprite(map, pixels, dstX, dstY, itemScale, false);
    } else {
      const blockId = getCurrentBlockId(state);
      const itemScale = state.config.blockItemScale / 100;
      const blkSize = Math.max(1, Math.round(BLOCK_SIZE * itemScale));
      if (blockId === 'tnt') {
        drawFlintAndSteel(map, handScreenX - 1, handScreenY - 1);
      } else {
        drawBlock(map, handScreenX - Math.floor(blkSize / 2), handScreenY - Math.floor(blkSize / 2),
          blockId, itemScale, state.config.blockRenderMode);
      }
    }

    // 2. 后画身体（盖住物品被遮一半）
    blitSpriteXY(map, STEVE_SIDE_PIXELS, sideSteveX, sideSteveY, sScale, heightScale, state.facingLeft);
  } else if (isWorking) {
    if (state.phase === PHASES.BREAK_HIT) {
      // 背身挥砸：用完整 22×36 sprite
      const seq = [0, 1, 2, 1];
      const speed = PICKAXE_SPEED[state.config.pickaxe] || 3;
      const frameDuration = Math.max(2, 6 - speed);
      const frameIdx = seq[Math.floor(state.phaseFrame / frameDuration) % seq.length];
      const sprite = STEVE_SWING_FULL_FRAMES[frameIdx];
      const swingX = steveX - Math.round(STEVE_SWING_FULL_BODY_OFFSET_X * scale);
      const swingY = steveY - Math.round(STEVE_SWING_FULL_BODY_OFFSET_Y * scale);
      blitSpriteXY(map, sprite, swingX, swingY, scale, scale, false);
    } else {
      // BUILD_HIT 仍用 drawSteveWithItem
      drawSteveWithItem(map, steveX, steveY, scale, state.armFrameIdx || 6, 'block', state);
    }
  } else {
    // idle：正面看着我们，双臂自然下垂（用 sprite 自带的左右臂）
    drawSteveFront(map, steveX, steveY, scale);
  }

  return map;
}

export {
  createMinecraftClockState,
  stepMinecraftClockState,
  renderMinecraftClockFrame,
  PICKAXE_SPEED,
  BLOCK_IDS,
  BLOCK_TEXTURES,
};
