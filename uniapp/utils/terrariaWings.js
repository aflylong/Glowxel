// ============================================================
// Terraria 翅膀渲染 — 4 职业专属翅膀(29 Solar / 30 Vortex / 31 Nebula / 32 Stardust)
// 移植自 esp32-firmware/terraria-clock-preview.js renderWings
// 简化版: 只支持 4 个 Lunar 翅膀, 其它翅膀(Hoverboard/Empress 等)不做
// ============================================================

import { getSprite, stripFrame, drawPixelsToMap } from './terrariaSprites.js';

const BODY_FRAME_W = 40;
const BODY_FRAME_H = 56;
const NUM_FRAMES = 4;  // Lunar 翅膀 4 帧条带 (折叠 + 扇动 0/1/2)

// 强制扇动 (站立态也扇), 与 esp32 调试页保持一致
//   wingFrame 0→1→2→0 循环, 5 tick/帧 = 周期 15 tick (250ms)
//   wingTime = ANIM_TIME * WING_SPEED, 默认 WING_SPEED=0.5
function getWingFrameByTime(animTimeSec, wingSpeed) {
  const t = animTimeSec * 60 * wingSpeed;
  // Vortex Booster 30: 1 + counter/5, 帧 1,2,3
  // 实际跟普通翅膀视觉差别小, 这里统一用 0..2 循环
  return Math.floor(t / 5) % 3;
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

  // 差异帧解码后 sprite.h 已经是单帧高度
  // 兼容旧条带数据 (4 帧拼接) 也兼容新差异帧 (frames[])
  const fh = sprite.h;
  const frameIdx = getWingFrameByTime(animTimeSec, wingSpeed);
  const safeFrame = Math.max(0, Math.min(NUM_FRAMES - 1, frameIdx));

  // 切第 safeFrame 帧 (sprite.w 宽 × fh 高)
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
  drawPixelsToMap(targetMap, framePixels, wingCx, wingCy, playerScale, sprite.w, fh);

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
  const pulse = Math.sin(t * 4) * 1.0;  // ±1 像素抖动
  const tinted = pixels.map(([x, y, r, g, b, a]) => {
    return [x, y, Math.min(255, Math.round(r + 80)), Math.min(255, Math.round(g + 40)), b, Math.round(a * 0.4)];
  });
  drawPixelsToMap(targetMap, tinted, cx + pulse, cy, scale, w, h);
}

// Nebula 31: 4 个十字方向偏移副本
function drawNebulaExtra(targetMap, pixels, cx, cy, scale, w, h, t) {
  const radius = (Math.cos(t * Math.PI * 2 / 1) * 0.5 + 0.5) * 1.5;
  const dimmed = pixels.map(([x, y, r, g, b, a]) => [x, y, r, g, b, Math.round(a * 0.5)]);
  for (let i = 0; i < 4; i++) {
    const angle = i * Math.PI / 2;
    const ox = Math.cos(angle) * radius * scale;
    const oy = Math.sin(angle) * radius * scale;
    drawPixelsToMap(targetMap, dimmed, cx + ox, cy + oy, scale, w, h);
  }
}

// Stardust 32: 蓝白叠加
function drawStardustGlow(targetMap, pixels, cx, cy, scale, w, h, t) {
  const pulse = Math.sin(t * 3) * 0.5;
  const tinted = pixels.map(([x, y, r, g, b, a]) => {
    return [x, y, Math.min(255, r + 50), Math.min(255, g + 50), Math.min(255, b + 80), Math.round(a * 0.4)];
  });
  drawPixelsToMap(targetMap, tinted, cx + pulse, cy, scale, w, h);
}
