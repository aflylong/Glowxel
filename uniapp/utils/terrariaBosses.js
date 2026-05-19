// ============================================================
// Boss 渲染 v3 — 跟板载完全一致
//   数据源: uniapp/static/terraria/bosses_compact.js
//           (build-boss-firmware.js v5 生成, 跟 firmware sprites_bosses.h 同源)
//   数据格式: base + delta(set + clear), 都已预渲染到 64×64 屏幕坐标
//   渲染算法 = 板载 drawSpriteAnimFrame 的 JS 翻译
// ============================================================

let _cache = null;
function getBossesCompact() {
  if (_cache !== null) return _cache;
  try {
    _cache = require('../static/terraria/bosses_compact.js');
  } catch (e) {
    console.error('[terrariaBosses] 加载 bosses_compact.js 失败', e);
    _cache = {};
  }
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

// ============ drawBoss — 跟板载 drawSpriteAnimFrame 算法严格一致 ============
//
// 入参:
//   targetMap: Map<"x,y", "#hex">  目标像素表
//   slug: boss key
//   animTimeSec: 动画时间秒
//   bgPainter(x, y) → "#hex"  背景色查询函数 (用于 clear 段擦回)
//
// 注意:
//   - 板载像素已是屏幕绝对坐标 (0..63), 不再走 scale/center
//   - 跟板载 drawSpriteAnimFrame 一样: 先画 base, 再 clear (画背景), 再 set
export function drawBoss(targetMap, slug, animTimeSec, bgPainter) {
  if (!slug) return;
  const dec = decodeBoss(slug);
  if (!dec) return;

  const tick = (animTimeSec || 0) * 60;
  const frameCount = Math.max(1, dec.frameCount);
  const frameIdx = Math.floor(tick / 9) % frameCount;

  // 1) 画 base
  for (const px of dec.base.set) {
    if (px.x < 0 || px.x >= 64 || px.y < 0 || px.y >= 64) continue;
    const hex = '#' + ((px.r << 16) | (px.g << 8) | px.b).toString(16).padStart(6, '0');
    targetMap.set(`${px.x},${px.y}`, hex);
  }

  // 2) 画 delta (frame > 0)
  if (frameIdx > 0 && frameIdx - 1 < dec.deltas.length) {
    const delta = dec.deltas[frameIdx - 1];
    // 2a. clear: 重画背景色
    if (typeof bgPainter === 'function') {
      for (const px of delta.clear) {
        if (px.x < 0 || px.x >= 64 || px.y < 0 || px.y >= 64) continue;
        const hex = bgPainter(px.x, px.y);
        if (hex) targetMap.set(`${px.x},${px.y}`, hex);
        else targetMap.delete(`${px.x},${px.y}`);
      }
    } else {
      // 没有背景查询就直接删 (避免残留)
      for (const px of delta.clear) {
        targetMap.delete(`${px.x},${px.y}`);
      }
    }
    // 2b. set: 画新像素
    for (const px of delta.set) {
      if (px.x < 0 || px.x >= 64 || px.y < 0 || px.y >= 64) continue;
      const hex = '#' + ((px.r << 16) | (px.g << 8) | px.b).toString(16).padStart(6, '0');
      targetMap.set(`${px.x},${px.y}`, hex);
    }
  }
}
