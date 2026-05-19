// ============================================================
// Terraria 翅膀渲染 — 支持全部 42 种翅膀
// 从 wings.js 读取 frameCount, 按实际帧数循环动画
// ============================================================

import { getSprite, stripFrame, drawPixelsToMap } from './terrariaSprites.js';

const BODY_FRAME_W = 40;
const BODY_FRAME_H = 56;

// 翅膀名称表 (用于 UI 选择列表) — 源自 ArmorIDs.cs Wing class
export const WING_LIST = [
  { id: 1,  name: '恶魔之翼' },       // DemonWings
  { id: 2,  name: '天使之翼' },       // AngelWings
  { id: 3,  name: 'Red之翼' },        // RedsWings
  { id: 5,  name: '蝴蝶翅膀' },       // ButterflyWings
  { id: 6,  name: '仙女之翼' },       // FairyWings
  { id: 7,  name: '鸟妖翅膀' },       // HarpyWings
  { id: 8,  name: '骨翼' },           // BoneWings
  { id: 9,  name: '烈焰之翼' },       // FlameWings
  { id: 10, name: '冰冻翅膀' },       // FrozenWings
  { id: 11, name: '幽灵之翼' },       // SpectreWings
  { id: 12, name: '蒸汽朋克翅膀' },   // SteampunkWings
  { id: 13, name: '树叶翅膀' },       // LeafWings
  { id: 14, name: '蝙蝠翅膀' },       // BatWings
  { id: 15, name: '蜜蜂翅膀' },       // BeeWings
  { id: 16, name: 'D-Town之翼' },     // DTownsWings
  { id: 17, name: 'Will之翼' },       // WillsWings
  { id: 18, name: 'Crowno之翼' },     // CrownosWings
  { id: 19, name: 'Cenx之翼' },       // CenxsWings
  { id: 20, name: '破损仙女翅膀' },   // TatteredFairyWings
  { id: 21, name: '阴森翅膀' },       // SpookyWings
  { id: 23, name: '节日翅膀' },       // FestiveWings
  { id: 24, name: '甲虫翅膀' },       // BeetleWings
  { id: 25, name: '鳍翼' },           // FinWings
  { id: 26, name: '猪龙鱼翅膀' },     // FishronWings
  { id: 27, name: '蛾翼' },           // MothronWings
  { id: 29, name: '耀斑之翼' },       // SolarWings
  { id: 30, name: '星旋加速器' },     // VortexBooster
  { id: 31, name: '星云斗篷' },       // NebulaMantle
  { id: 32, name: '星尘之翼' },       // StardustWings
  { id: 34, name: 'Jim之翼' },        // JimsWings
  { id: 35, name: 'Skiphs之爪' },     // SkiphssPaws
  { id: 36, name: 'Loki之翼' },       // LokisWings
  { id: 37, name: '花妖翅膀' },       // BetsyWings
  { id: 38, name: 'Arkhalis之翼' },   // ArkhalisWings
  { id: 39, name: 'Leinfors之翼' },   // LeinforsWings
  { id: 42, name: '美食蛮人之翼' },   // FoodBarbarianWings
  { id: 43, name: 'Grox之翼' },       // GroxTheGreatWings
  { id: 48, name: 'Chippy之翼' },     // ChippysWings
  { id: 49, name: 'Heroicis之翼' },   // HeroicisWings
  { id: 51, name: 'Luna之翼' },       // LunasWings
];

// 根据 sprite 的 frameCount + frameStart 循环
//   frameStart = 第一个动画帧 (默认0)
//   循环范围 [frameStart, frameCount-1]
function getWingFrameByTime(animTimeSec, wingSpeed, frameCount, frameStart) {
  const t = animTimeSec * 60 * wingSpeed;
  const animFrames = frameCount - frameStart;
  if (animFrames <= 0) return frameStart;
  return frameStart + (Math.floor(t / 5) % animFrames);
}

// 翅膀挂载位置 (commonWingPosPreFloor)
//   = position + (W/2, H + 7 - bodyFrame.H/2)
//   在 buf 局部 = (BODY_FRAME_W/2, BODY_FRAME_H/2 + 7)
//   翅膀 sprite 中心 = 这个挂载点 + (offset_x, offset_y) * dir
function getCommonWingPos() {
  return {
    x: BODY_FRAME_W / 2,
    y: BODY_FRAME_H / 2 + 7,
  };
}

// 翅膀位置微调 (esp32 调试页里的 num1/num2)
//   普通翅膀都用 (0, 0), 翼骨在 sprite 左侧伸出
const WING_OFFSET = { num2: 0, num1: 0 };

// 主入口: 把翅膀画到 targetMap (64×64 屏空间)
//   wingId: 29/30/31/32
//   playerCenterX/Y: 角色 sprite 在 64×64 屏上的中心点(缩放后)
//   playerScale: 缩放比例 (0..1)
//   direction: ±1 (本期固定 1, 朝右)
//   animTimeSec: 累计动画时间(秒)
//   wingSpeed: 0..2.0 (滑块控制), 默认 0.5
export function renderWings(targetMap, wingId, playerCenterX, playerCenterY, playerScale, direction, animTimeSec, wingSpeed = 0.5) {
  if (!wingId) return;

  const sprite = getSprite('wings_' + wingId);
  if (!sprite) return;

  const fh = sprite.h;
  const frameCount = sprite.frameCount || 4;
  // frameStart 默认 1 (跳过帧0=折叠态), 数据里有 frameStart 字段就用源码定义的值
  const frameStart = sprite.frameStart != null ? sprite.frameStart : 1;
  const frameIdx = getWingFrameByTime(animTimeSec, wingSpeed, frameCount, frameStart);
  const safeFrame = Math.max(0, Math.min(frameCount - 1, frameIdx));

  // 切第 safeFrame 帧
  const framePixels = stripFrame(sprite, safeFrame, fh);

  // 翅膀挂载点 (在角色 sprite 局部坐标系)
  const common = getCommonWingPos();
  const ofs = WING_OFFSET;
  const localCx = common.x + (ofs.num2 - 9) * direction;  // 翅膀中心相对角色 sprite 中心
  const localCy = common.y + (ofs.num1 + 2);

  // 翅膀中心在 64 屏上的坐标
  //   = 角色中心 + (翅膀局部中心 - 角色 sprite 中心) * scale
  const dx = (localCx - BODY_FRAME_W / 2) * playerScale;
  const dy = (localCy - BODY_FRAME_H / 2) * playerScale;
  const wingCx = playerCenterX + dx;
  const wingCy = playerCenterY + dy;

  // 把 framePixels (sprite.w × fh) 画到屏上, 中心对齐 wingCx/wingCy
  drawPixelsToMap(targetMap, framePixels, wingCx, wingCy, 1.0, sprite.w, fh);

  // === 特效叠加层 ===
  if (wingId === 29) {
    // Solar 火焰发光层 (暖橙叠加, 简化为脉冲透明)
    drawSolarGlow(targetMap, framePixels, wingCx, wingCy, playerScale, sprite.w, fh, animTimeSec);
  } else if (wingId === 31) {
    // Nebula 4 个旋转副本(粉色脉冲)
    drawNebulaExtra(targetMap, framePixels, wingCx, wingCy, playerScale, sprite.w, fh, animTimeSec);
  } else if (wingId === 32) {
    // Stardust 蓝白发光层
    drawStardustGlow(targetMap, framePixels, wingCx, wingCy, playerScale, sprite.w, fh, animTimeSec);
  }
}

// Solar 29: 暖橙脉冲叠加(简化: 脉冲偏移多画一层)
function drawSolarGlow(targetMap, pixels, cx, cy, scale, w, h, t) {
  const pulse = Math.sin(t * 4) * 1.0;
  const tinted = pixels.map(([x, y, r, g, b, a]) => {
    return [x, y, Math.min(255, Math.round(r + 80)), Math.min(255, Math.round(g + 40)), b, Math.round(a * 0.4)];
  });
  drawPixelsToMap(targetMap, tinted, cx + pulse, cy, 1.0, w, h);
}

// Nebula 31: 4 个十字方向偏移副本
function drawNebulaExtra(targetMap, pixels, cx, cy, scale, w, h, t) {
  const radius = (Math.cos(t * Math.PI * 2 / 1) * 0.5 + 0.5) * 1.5;
  const dimmed = pixels.map(([x, y, r, g, b, a]) => [x, y, r, g, b, Math.round(a * 0.5)]);
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    const ox = Math.cos(angle) * radius;
    const oy = Math.sin(angle) * radius;
    drawPixelsToMap(targetMap, dimmed, cx + ox, cy + oy, 1.0, w, h);
  }
}

// Stardust 32: 蓝白叠加
function drawStardustGlow(targetMap, pixels, cx, cy, scale, w, h, t) {
  const pulse = Math.sin(t * 3) * 0.5;
  const tinted = pixels.map(([x, y, r, g, b, a]) => {
    return [x, y, Math.min(255, r + 50), Math.min(255, g + 50), Math.min(255, b + 80), Math.round(a * 0.4)];
  });
  drawPixelsToMap(targetMap, tinted, cx + pulse, cy, 1.0, w, h);
}
