// ============================================================
// Boss 渲染 v3 — 跟板载完全一致
//   数据源: uniapp/static/terraria/bosses_compact.js
//           (build-boss-firmware.js v5 生成, 跟 firmware sprites_bosses.h 同源)
//   数据格式: base + delta(set + clear), 都已预渲染到 64×64 屏幕坐标
//   渲染算法 = 板载 drawSpriteAnimFrame 的 JS 翻译
// ============================================================

import BOSSES_COMPACT_RAW from '../assets/static/terraria/bosses_compact.js';

let _cache = null;
function getBossesCompact() {
  if (_cache !== null) return _cache;
  _cache = BOSSES_COMPACT_RAW || {};
  return _cache;
}

function _b64ToU8(b64) {
  if (typeof uni !== 'undefined' && uni.base64ToArrayBuffer) {
    return new Uint8Array(uni.base64ToArrayBuffer(b64));
  }
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

// 解码缓存: slug → { base: {set: [{x,y,r,g,b}], clear: [{x,y}]}, deltas: [...] }
const _decodedCache = new Map();
function decodeBoss(slug) {
  if (_decodedCache.has(slug)) return _decodedCache.get(slug);
  const all = getBossesCompact();
  const raw = all[slug];
  if (!raw) { _decodedCache.set(slug, null); return null; }

  function decodeSet(b, n) {
    if (!b || n === 0) return [];
    const u8 = _b64ToU8(b);
    const out = [];
    for (let i = 0; i < n; i++) {
      const o = i * 5;
      out.push({ x: u8[o], y: u8[o+1], r: u8[o+2], g: u8[o+3], b: u8[o+4] });
    }
    return out;
  }
  function decodeClear(b, n) {
    if (!b || n === 0) return [];
    const u8 = _b64ToU8(b);
    const out = [];
    for (let i = 0; i < n; i++) {
      out.push({ x: u8[i*2], y: u8[i*2+1] });
    }
    return out;
  }

  const decoded = {
    idx: raw.idx,
    biome: raw.biome,
    nameZh: raw.nameZh,
    x: raw.x, y: raw.y, scale: raw.scale,
    frameCount: raw.frameCount,
    base: { set: decodeSet(raw.base.s, raw.base.sN), clear: [] },
    deltas: (raw.deltas || []).map(d => ({
      set: decodeSet(d.s, d.sN),
      clear: decodeClear(d.c, d.cN),
    })),
  };
  _decodedCache.set(slug, decoded);
  return decoded;
}

// ============ 公共 API ============

export function getBossCatalog() {
  const all = getBossesCompact();
  const byBiome = {};
  for (const slug of Object.keys(all)) {
    const meta = all[slug];
    const biome = meta.biome || 'forest';
    if (!byBiome[biome]) byBiome[biome] = [];
    byBiome[biome].push({ slug, nameZh: meta.nameZh, idx: meta.idx });
  }
  return byBiome;
}

export function getBossesForBiome(biome) {
  return getBossCatalog()[biome] || [];
}

export function getBossInfo(slug) {
  const all = getBossesCompact();
  return all[slug] || null;
}

// ============ 颜色滤除 (针对特定 boss 的资产脏边) ============
//   queen_slime sprite 在转换时残留了一圈 #5A5A5E (90,90,94) / #69696D (105,105,109)
//   的灰色描边伪影 — 不是游戏原本的颜色, 是缩放抗锯齿副产物, 直接当透明丢掉
function shouldDropPixel(slug, r, g, b) {
  if (slug === 'queen_slime') {
    if (r >= 85 && r <= 95 && g >= 85 && g <= 95 && b >= 88 && b <= 98) return true;   // #5A5A5E
    if (r >= 100 && r <= 110 && g >= 100 && g <= 110 && b >= 104 && b <= 114) return true; // #69696D
  }
  return false;
}

// ============ Boss 后处理动效 ============
// 静态 boss 在反编译源码里其实有 AI 行为, 但用整体晃动会很丑.
// 改用"亮度脉冲"模拟发光体的呼吸感, 只在关键 boss 用细微位移
//
// 返回 { dx, dy, brightness, eyePulse, eyeColorMatch }
//   brightness: 整体亮度倍数 (0.7..1.1)
//   eyePulse: 0..1, 用于"眼部/发光像素"额外加亮 (基于色彩匹配)
//   eyeColorMatch: (r,g,b) → bool, 判断像素是否为该 boss 的发光像素
function getBossDynamicFx(slug, animTimeSec) {
  const t = animTimeSec || 0;
  // 慢呼吸 0..1 (周期 2s)
  const breathSlow = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 2.0);
  // 中速呼吸 (周期 1.2s)
  const breathMid = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 1.2);
  // 快闪烁 (周期 0.8s)
  const flashFast = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 0.8);
  // 晶体闪烁 (周期 1.5s)
  const breathCrystal = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 / 1.5);

  switch (slug) {
    case 'eater_of_worlds':
      // 完全静态, 不加效果
      return { dx: 0, dy: 0, brightness: 1.0, eyePulse: 0, eyeColorMatch: null };
    case 'destroyer':
      // 机械蠕虫: 红眼像素脉冲 (机械红 RGB ≈ FF3333), 不位移
      return {
        dx: 0,
        dy: 0,
        brightness: 1.0,
        eyePulse: flashFast,
        eyeColorMatch: (r, g, b) => r > 180 && g < 100 && b < 100,
      };
    case 'skeletron':
      // 完全静态, 不加效果
      return { dx: 0, dy: 0, brightness: 1.0, eyePulse: 0, eyeColorMatch: null };
    case 'golem':
      // 眼部红橙脉冲 (跟之前一致)
      return {
        dx: 0, dy: 0, brightness: 1.0,
        eyePulse: breathMid,
        eyeColorMatch: (r, g, b) => r > 200 && g > 60 && g < 200 && b < 80,
      };
    case 'solar_pillar':
      // 红橙能量柱: 整体亮度 0.85..1.05
      return { dx: 0, dy: 0, brightness: 0.85 + 0.20 * breathSlow, eyePulse: 0, eyeColorMatch: null };
    case 'nebula_pillar':
      // 紫粉星云柱
      return { dx: 0, dy: 0, brightness: 0.85 + 0.20 * breathSlow, eyePulse: 0, eyeColorMatch: null };
    case 'stardust_pillar':
      // 蓝白星辰柱
      return { dx: 0, dy: 0, brightness: 0.85 + 0.20 * breathSlow, eyePulse: 0, eyeColorMatch: null };
    case 'vortex_pillar':
      // 绿涡能柱
      return { dx: 0, dy: 0, brightness: 0.85 + 0.20 * breathSlow, eyePulse: 0, eyeColorMatch: null };
    default:
      return { dx: 0, dy: 0, brightness: 1.0, eyePulse: 0, eyeColorMatch: null };
  }
}

function applyFx(r, g, b, fx, x, y) {
  let cr = r, cg = g, cb = b;
  // 1) 整体亮度
  if (fx.brightness !== 1.0) {
    cr = Math.max(0, Math.min(255, Math.round(cr * fx.brightness)));
    cg = Math.max(0, Math.min(255, Math.round(cg * fx.brightness)));
    cb = Math.max(0, Math.min(255, Math.round(cb * fx.brightness)));
  }
  // 2) 眼部/发光像素脉冲 (匹配像素额外加亮 30%)
  if (fx.eyePulse > 0 && fx.eyeColorMatch && fx.eyeColorMatch(r, g, b)) {
    const k = 1.0 + 0.3 * fx.eyePulse;
    cr = Math.min(255, Math.round(r * k));
    cg = Math.min(255, Math.round(g * k));
    cb = Math.min(255, Math.round(b * k));
  }
  // 3) 注入发光: 在指定区域的暗像素混入彩色 (按 eyePulse 强度混合)
  if (fx.injectGlow && fx.eyePulse > 0 && fx.injectGlow.match(r, g, b, x, y)) {
    const k = fx.eyePulse;  // 0..1 混合权重
    const [tr, tg, tb] = fx.injectGlow.color;
    cr = Math.round(cr * (1 - k) + tr * k);
    cg = Math.round(cg * (1 - k) + tg * k);
    cb = Math.round(cb * (1 - k) + tb * k);
  }
  return [cr, cg, cb];
}

// ============ drawBoss — 跟板载 drawSpriteAnimFrame 算法严格一致 ============
//
// 入参:
//   targetMap: Map<"x,y", "#hex">  目标像素表
//   slug: boss key
//   animTimeSec: 动画时间秒
//   bgPainter(x, y) → "#hex"  背景色查询函数 (用于 clear 段擦回)
//   userPos: { bossX, bossY }  用户 UI 调节后的位置, 跟 sprite 烘焙坐标 dec.x/y 求差作整体偏移
//
// 注意:
//   - 板载像素已是屏幕绝对坐标 (0..63), 不再走 scale/center
//   - 跟板载 drawSpriteAnimFrame 一样: 先画 base, 再 clear (画背景), 再 set
//   - 静态 boss (frameCount=1) 走后处理 fx; 多帧 boss 用 sprite 自身动画
export function drawBoss(targetMap, slug, animTimeSec, bgPainter, userPos) {
  if (!slug) return;
  const dec = decodeBoss(slug);
  if (!dec) return;

  const tick = (animTimeSec || 0) * 60;
  const frameCount = Math.max(1, dec.frameCount);
  const frameIdx = Math.floor(tick / 9) % frameCount;

  // 后处理 fx 适用范围:
  //   静态 boss: 全部依赖 fx 加动效 (柱子/世界吞噬者等)
  //   多帧 boss: queen_slime 等少数也叠加 fx (晶体脉冲), 不影响 sprite 自身动画
  const fx = getBossDynamicFx(slug, animTimeSec || 0);
  const hasFx = (fx.brightness !== 1.0 || fx.eyePulse > 0 || fx.dx !== 0 || fx.dy !== 0 || fx.injectGlow);

  // 用户位置偏移 (UI 调 bossX/Y 跟 sprite 烘焙坐标的差)
  let userDx = 0, userDy = 0;
  if (userPos && typeof userPos.bossX === 'number' && typeof userPos.bossY === 'number') {
    userDx = userPos.bossX - dec.x;
    userDy = userPos.bossY - dec.y;
  }
  const totalDx = fx.dx + userDx;
  const totalDy = fx.dy + userDy;

  const writePixel = (x, y, r, g, b) => {
    if (shouldDropPixel(slug, r, g, b)) return;
    let cr = r, cg = g, cb = b;
    if (hasFx) [cr, cg, cb] = applyFx(r, g, b, fx, x, y);
    const px = x + totalDx, py = y + totalDy;
    if (px < 0 || px >= 64 || py < 0 || py >= 64) return;
    const hex = '#' + ((cr << 16) | (cg << 8) | cb).toString(16).padStart(6, '0');
    targetMap.set(`${px},${py}`, hex);
  };

  // 1) 画 base
  for (const px of dec.base.set) {
    writePixel(px.x, px.y, px.r, px.g, px.b);
  }

  // 2) 画 delta (frame > 0)
  if (frameIdx > 0 && frameIdx - 1 < dec.deltas.length) {
    const delta = dec.deltas[frameIdx - 1];
    if (typeof bgPainter === 'function') {
      for (const px of delta.clear) {
        const cx = px.x + totalDx, cy = px.y + totalDy;
        if (cx < 0 || cx >= 64 || cy < 0 || cy >= 64) continue;
        const hex = bgPainter(cx, cy);
        if (hex) targetMap.set(`${cx},${cy}`, hex);
        else targetMap.delete(`${cx},${cy}`);
      }
    } else {
      for (const px of delta.clear) {
        const cx = px.x + totalDx, cy = px.y + totalDy;
        targetMap.delete(`${cx},${cy}`);
      }
    }
    for (const px of delta.set) {
      writePixel(px.x, px.y, px.r, px.g, px.b);
    }
  }
}
