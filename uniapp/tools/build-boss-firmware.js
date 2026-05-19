#!/usr/bin/env node
// ============================================================
// Boss 板载资产生成脚本 v5 (uniapp + 板载完全一致版)
// ============================================================
// 数据流:
//   uniapp/static/terraria/bosses/{slug}.js  ← 原始数据源 (parts[] 格式)
//             ↓ build-boss-firmware.js
//             ├──→ esp32-firmware/.../sprites_bosses.h  (PROGMEM C++)
//             └──→ uniapp/static/terraria/bosses_compact.js (单文件 module)
//
// 压缩格式 (跟 wings/guardian 一致):
//   每 boss 预渲染到 64×64 屏幕坐标
//   base (frame 0 全像素)  + delta[1..frameCount-1] (相对 base 的 set+clear)
//   set 段: [x, y, r, g, b] (5 byte/px) — 跟 base 不同的位置
//   clear 段: [x, y]        (2 byte/px) — base 有但这一帧没有的位置 (擦回背景)
//
// 修复: 此前 v2 只有 set 段, part 移动后旧位置不擦 → 重影。
//       v5 加 clear 段, 渲染时 clear 像素重画背景色, 完全消除残留。
//
// 渲染端 (uniapp/板载) 必须用同样的 set+clear 算法。
// ============================================================

const fs = require('fs');
const path = require('path');

const BOSSES_DIR = path.resolve(__dirname, '../static/terraria/bosses');
const OUT_FW   = path.resolve(__dirname, '../../esp32-firmware/include/theme_assets/terraria/sprites_bosses.h');
const OUT_JS   = path.resolve(__dirname, '../static/terraria/bosses_compact.js');

// per-boss 最终显示参数 (已调好不再改动)
const BOSS_PARAMS = {
  king_slime:        { scale: 27, x: 53, y: 41 },
  eye_of_cthulhu:    { scale: 27, x: 53, y: 22 },
  eater_of_worlds:   { scale: 27, x: 48, y: 49 },
  brain_of_cthulhu:  { scale: 27, x: 32, y: 27 },
  queen_bee:         { scale: 25, x: 52, y: 32 },
  skeletron:         { scale: 38, x: 32, y: 48 },
  deerclops:         { scale: 25, x: 53, y: 31 },
  wall_of_flesh:     { scale: 36, x: 63, y: 33 },
  queen_slime:       { scale: 25, x: 32, y: 35 },
  the_twins:         { scale: 25, x: 53, y: 32 },
  destroyer:         { scale: 27, x: 48, y: 49 },
  skeletron_prime:   { scale: 50, x: 32, y: 36 },
  plantera:          { scale: 27, x: 32, y: 48 },
  golem:             { scale: 30, x: 32, y: 32 },
  duke_fishron:      { scale: 28, x: 60, y: 34 },
  empress_of_light:  { scale: 25, x: 32, y: 35 },
  lunatic_cultist:   { scale: 28, x: 49, y: 50 },
  martian_saucer:    { scale: 27, x: 32, y: 23 },
  moon_lord:         { scale: 21, x: 32, y: 26 },
  pumpking:          { scale: 30, x: 32, y: 41 },
  mourning_wood:     { scale: 30, x: 32, y: 31 },
  ice_queen:         { scale: 27, x: 32, y: 28 },
  santa_nk1:         { scale: 30, x: 55, y: 35 },
  everscream:        { scale: 30, x: 32, y: 30 },
  solar_pillar:      { scale: 17, x: 32, y: 23 },
  nebula_pillar:     { scale: 17, x: 32, y: 23 },
  stardust_pillar:   { scale: 17, x: 32, y: 23 },
  vortex_pillar:     { scale: 17, x: 32, y: 23 },
  flying_dutchman:   { scale: 19, x: 53, y: 7 },
  mothron:           { scale: 28, x: 51, y: 32 },
  betsy:             { scale: 30, x: 54, y: 27 },
  dark_mage:         { scale: 25, x: 48, y: 35 },
  ogre:              { scale: 25, x: 54, y: 35 },
};

const BOSS_BIOME = {
  king_slime: 'forest', eye_of_cthulhu: 'corruption', eater_of_worlds: 'corruption',
  brain_of_cthulhu: 'crimson', queen_bee: 'jungle', skeletron: 'dungeon',
  deerclops: 'snow', wall_of_flesh: 'underworld', queen_slime: 'hallow',
  the_twins: 'forest', destroyer: 'forest', skeletron_prime: 'forest',
  plantera: 'jungle', golem: 'temple', duke_fishron: 'ocean',
  empress_of_light: 'hallow', lunatic_cultist: 'dungeon', martian_saucer: 'forest',
  moon_lord: 'forest', pumpking: 'forest', mourning_wood: 'forest',
  ice_queen: 'snow', santa_nk1: 'snow', everscream: 'snow',
  solar_pillar: 'forest', nebula_pillar: 'forest', stardust_pillar: 'forest',
  vortex_pillar: 'forest', flying_dutchman: 'forest', mothron: 'forest',
  betsy: 'forest', dark_mage: 'dungeon', ogre: 'forest',
};

const BOSS_NAME_ZH = {
  king_slime: '史莱姆王', eye_of_cthulhu: '克苏鲁之眼', eater_of_worlds: '世界吞噬者',
  brain_of_cthulhu: '克苏鲁之脑', queen_bee: '蜂王', skeletron: '骷髅王',
  deerclops: '巨鹿', wall_of_flesh: '血肉墙', queen_slime: '史莱姆女皇',
  the_twins: '双子魔眼', destroyer: '毁灭者', skeletron_prime: '机械骷髅王',
  plantera: '世纪之花', golem: '石巨人', duke_fishron: '猪龙鱼公爵',
  empress_of_light: '光之女皇', lunatic_cultist: '拜月教邪教徒', martian_saucer: '火星飞碟',
  moon_lord: '月亮领主', pumpking: '南瓜王', mourning_wood: '悼木',
  ice_queen: '冰雪女王', santa_nk1: '圣诞坦克', everscream: '常青尖叫',
  solar_pillar: '日耀柱', nebula_pillar: '星辰柱', stardust_pillar: '星云柱',
  vortex_pillar: '涡能柱', flying_dutchman: '飞行荷兰人', mothron: '蛾怪',
  betsy: '贝齐', dark_mage: '黑暗法师', ogre: '食人魔',
};

// ============ 解码原始 boss .js (跟 uniapp _decodeFrame 一致) ============

function applyToGrid(u8, n, fmt, fw, fh, grid) {
  if (fmt === 4) {
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const x = u8[o] | (u8[o + 1] << 8);
      const y = u8[o + 2];
      const pi = u8[o + 3];
      if (x >= 0 && x < fw && y >= 0 && y < fh) grid[y * fw + x] = pi;
    }
  } else {
    for (let i = 0; i < n; i++) {
      const o = i * 5;
      const x = u8[o] | (u8[o + 1] << 8);
      const y = u8[o + 2] | (u8[o + 3] << 8);
      const pi = u8[o + 4];
      if (x >= 0 && x < fw && y >= 0 && y < fh) grid[y * fw + x] = pi;
    }
  }
}

function decodePartFrame(part, frameIdx) {
  const { fw, fh, fmt, base, deltas } = part;
  const baseGrid = new Uint8Array(fw * fh).fill(255);
  if (base && base.b) applyToGrid(Buffer.from(base.b, 'base64'), base.n, fmt, fw, fh, baseGrid);
  if (frameIdx === 0) return baseGrid;
  const grid = new Uint8Array(baseGrid);
  if (deltas && frameIdx - 1 < deltas.length) {
    const d = deltas[frameIdx - 1];
    applyToGrid(Buffer.from(d.b, 'base64'), d.n, fmt, fw, fh, grid);
  }
  return grid;
}

// ============ 渲染单帧到 64×64 (对齐 uniapp drawBoss; 不调 orbit) ============

function renderBossFrame(bossData, frameIdx, slug, params) {
  const scale = params.scale / 100;
  const centerX = params.x;
  const centerY = params.y;
  if (!bossData.parts || bossData.parts.length === 0) return [];

  const FLIP_FORCE = { duke_fishron: true };
  const flipX = !!FLIP_FORCE[slug];

  let bbMinX = Infinity, bbMaxX = -Infinity, bbMinY = Infinity, bbMaxY = -Infinity;
  for (const p of bossData.parts) {
    const dx = p.dx || 0, dy = p.dy || 0;
    if (dx < bbMinX) bbMinX = dx;
    if (dx + p.fw > bbMaxX) bbMaxX = dx + p.fw;
    if (dy < bbMinY) bbMinY = dy;
    if (dy + p.fh > bbMaxY) bbMaxY = dy + p.fh;
  }
  const bossCx = (bbMinX + bbMaxX) / 2;
  const bossCy = (bbMinY + bbMaxY) / 2;

  // 屏幕坐标 → 颜色 (key = x*64+y)
  const screenMap = new Map();

  for (const p of bossData.parts) {
    const totalFrames = p.frames || 1;
    const partFrameIdx = Math.min(frameIdx, totalFrames - 1);
    const pal = (p.pal || []).map(h => [
      parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16),
    ]);
    const grid = decodePartFrame(p, partFrameIdx);
    const dx = p.dx || 0, dy = p.dy || 0;
    const partDx = flipX ? -(dx + p.fw) + 2 * bossCx : dx;
    const partOX = centerX + (partDx - bossCx) * scale;
    const partOY = centerY + (dy - bossCy) * scale;

    for (let y = 0; y < p.fh; y++) {
      for (let x = 0; x < p.fw; x++) {
        const idx = grid[y * p.fw + x];
        if (idx === 255) continue;
        const drawX = flipX ? (p.fw - 1 - x) : x;
        const px = Math.round(partOX + drawX * scale);
        const py = Math.round(partOY + y * scale);
        if (px < 0 || px >= 64 || py < 0 || py >= 64) continue;
        const c = pal[idx];
        if (!c) continue;
        screenMap.set(px * 64 + py, { x: px, y: py, r: c[0], g: c[1], b: c[2] });
      }
    }
  }
  return Array.from(screenMap.values());
}

// ============ 计算 set + clear 段 ============

function computeDelta(basePixels, framePixels) {
  const baseMap = new Map();   // key = x*64+y → "rgb"
  for (const p of basePixels) baseMap.set(p.x * 64 + p.y, ((p.r << 16) | (p.g << 8) | p.b));

  const set = [];
  const seen = new Set();
  for (const p of framePixels) {
    const key = p.x * 64 + p.y;
    seen.add(key);
    const baseColor = baseMap.get(key);
    const cur = (p.r << 16) | (p.g << 8) | p.b;
    if (baseColor !== cur) set.push(p);
  }
  // clear: base 有但 frame_i 没有
  const clear = [];
  for (const p of basePixels) {
    const key = p.x * 64 + p.y;
    if (!seen.has(key)) clear.push({ x: p.x, y: p.y });
  }
  return { set, clear };
}

// ============ 字节缓冲工具 ============

function setPixelsToBuffer(pixels) {
  const buf = Buffer.alloc(pixels.length * 5);
  for (let i = 0; i < pixels.length; i++) {
    buf[i*5] = pixels[i].x; buf[i*5+1] = pixels[i].y;
    buf[i*5+2] = pixels[i].r; buf[i*5+3] = pixels[i].g; buf[i*5+4] = pixels[i].b;
  }
  return buf;
}

function clearPixelsToBuffer(pixels) {
  const buf = Buffer.alloc(pixels.length * 2);
  for (let i = 0; i < pixels.length; i++) {
    buf[i*2] = pixels[i].x; buf[i*2+1] = pixels[i].y;
  }
  return buf;
}

function bufferToCArray(buf) {
  if (buf.length === 0) return '  0';
  const lines = [];
  for (let i = 0; i < buf.length; i += 16) {
    const chunk = [];
    for (let j = 0; j < 16 && i + j < buf.length; j++) chunk.push('0x' + buf[i+j].toString(16).padStart(2, '0'));
    lines.push('  ' + chunk.join(', ') + (i + 16 < buf.length ? ',' : ''));
  }
  return lines.join('\n');
}

// ============ Main ============

function main() {
  const slugs = Object.keys(BOSS_PARAMS);
  console.log(`[build-boss v5] ${slugs.length} bosses, base+delta(set+clear) 双输出 (.h + .js)`);

  // ============ Firmware .h ============
  let fw = `// Generated by build-boss-firmware.js v5
// 33 boss 预渲染到 64×64 屏幕坐标; base + delta(set+clear) 差异帧
// 渲染算法跟 uniapp/utils/terrariaBosses.js 严格一致 (修重影)
#pragma once
#include <Arduino.h>
#include <pgmspace.h>
#include "terraria_sprite_types.h"

`;

  // ============ uniapp compact .js (跟 firmware 同源数据) ============
  // 输出 Map<bossIdx, { biome, nameZh, params, frameCount, base: {set, clear}, deltas: [{set, clear}], maxFrames }>
  // set/clear 用 base64 (省体积)
  const jsBosses = {};

  const entries = [];
  let totalSetBytes = 0;
  let totalClearBytes = 0;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const params = BOSS_PARAMS[slug];
    let bossData;
    try { bossData = require(path.join(BOSSES_DIR, slug + '.js')); }
    catch(e) { console.warn(`  [skip] ${slug}: 加载失败`); continue; }

    let maxFrames = 1;
    for (const p of (bossData.parts || [])) maxFrames = Math.max(maxFrames, p.frames || 1);
    const frameCount = Math.min(maxFrames, 8);

    // 渲染所有帧到 64×64 像素列表
    const allFrames = [];
    for (let f = 0; f < frameCount; f++) allFrames.push(renderBossFrame(bossData, f, slug, params));
    if (allFrames[0].length === 0) { console.warn(`  [skip] ${slug}: 0 px`); continue; }

    const basePixels = allFrames[0];
    const baseBuf = setPixelsToBuffer(basePixels);
    const varName = `Boss_${i}`;

    // ===== Firmware: base =====
    fw += `// [${i}] ${slug}: ${basePixels.length} base px, ${frameCount} frames\n`;
    fw += `static const uint8_t k${varName}BaseSet[] PROGMEM = {\n${bufferToCArray(baseBuf)}\n};\n`;

    // ===== uniapp .js 数据收集 =====
    const jsDeltas = [];

    // ===== deltas =====
    const deltaItems = [];
    for (let f = 1; f < frameCount; f++) {
      const { set, clear } = computeDelta(basePixels, allFrames[f]);
      const setBuf = setPixelsToBuffer(set);
      const clearBuf = clearPixelsToBuffer(clear);
      const setName = `k${varName}D${f-1}Set`;
      const clearName = `k${varName}D${f-1}Clear`;

      fw += setBuf.length > 0
        ? `static const uint8_t ${setName}[] PROGMEM = {\n${bufferToCArray(setBuf)}\n};\n`
        : `static const uint8_t ${setName}[] PROGMEM = {0};\n`;
      fw += clearBuf.length > 0
        ? `static const uint8_t ${clearName}[] PROGMEM = {\n${bufferToCArray(clearBuf)}\n};\n`
        : `static const uint8_t ${clearName}[] PROGMEM = {0};\n`;

      deltaItems.push({ setName, setN: set.length, clearName, clearN: clear.length });
      totalSetBytes += setBuf.length;
      totalClearBytes += clearBuf.length;

      jsDeltas.push({
        s: setBuf.toString('base64'), sN: set.length,
        c: clearBuf.toString('base64'), cN: clear.length,
      });
    }
    totalSetBytes += baseBuf.length;

    // ===== Firmware: 索引数组 + 包装 =====
    if (deltaItems.length > 0) {
      fw += `static const TerrariaFrameBlock k${varName}Deltas[] PROGMEM = {\n`;
      for (const d of deltaItems) {
        fw += `  { .setCount = ${d.setN}, .setPixels = ${d.setName}, .clearCount = ${d.clearN}, .clearPixels = ${d.clearName} },\n`;
      }
      fw += `};\n`;
      fw += `static const TerrariaSpriteAnim k${varName} PROGMEM = {\n`;
      fw += `  .w = 64, .h = 64, .frameCount = ${frameCount}, .frameStart = 0,\n`;
      fw += `  .base = { .setCount = ${basePixels.length}, .setPixels = k${varName}BaseSet, .clearCount = 0, .clearPixels = nullptr },\n`;
      fw += `  .deltas = k${varName}Deltas, .fmt = 5,\n`;
      fw += `};\n\n`;
    } else {
      fw += `static const TerrariaSpriteAnim k${varName} PROGMEM = {\n`;
      fw += `  .w = 64, .h = 64, .frameCount = 1, .frameStart = 0,\n`;
      fw += `  .base = { .setCount = ${basePixels.length}, .setPixels = k${varName}BaseSet, .clearCount = 0, .clearPixels = nullptr },\n`;
      fw += `  .deltas = nullptr, .fmt = 5,\n`;
      fw += `};\n\n`;
    }

    // ===== uniapp .js 收集 =====
    jsBosses[slug] = {
      idx: i,
      biome: BOSS_BIOME[slug] || 'forest',
      nameZh: BOSS_NAME_ZH[slug] || slug,
      x: params.x, y: params.y, scale: params.scale,
      frameCount,
      base: { s: baseBuf.toString('base64'), sN: basePixels.length },
      deltas: jsDeltas,
    };

    const totalDeltaSet = deltaItems.reduce((s, d) => s + d.setN, 0);
    const totalDeltaClear = deltaItems.reduce((s, d) => s + d.clearN, 0);
    entries.push({ idx: i, slug, varName });
    console.log(`  [${i}] ${slug}: base ${basePixels.length}px + ${totalDeltaSet} set + ${totalDeltaClear} clear (${frameCount}f)`);
  }

  // Getter
  fw += `inline const TerrariaSpriteAnim* getBossAnim(uint8_t i) {\n  switch(i) {\n`;
  for (const e of entries) fw += `    case ${e.idx}: return &k${e.varName};\n`;
  fw += `    default: return nullptr;\n  }\n}\nstatic constexpr uint8_t kBossCount = ${entries.length};\n`;

  fs.writeFileSync(OUT_FW, fw);
  const fwSize = fs.statSync(OUT_FW).size;
  const totalBin = totalSetBytes + totalClearBytes;
  console.log(`\n[firmware] ${(totalBin/1024).toFixed(1)} KB binary (set ${(totalSetBytes/1024).toFixed(1)} + clear ${(totalClearBytes/1024).toFixed(1)}), ${(fwSize/1024).toFixed(1)} KB .h`);

  // ============ uniapp compact .js ============
  const jsContent = `// Generated by build-boss-firmware.js v5
// 33 boss compact 数据 (跟 firmware sprites_bosses.h 同源)
// 数据格式: base+delta(set+clear), 渲染算法跟板载严格一致
module.exports = ${JSON.stringify(jsBosses)};
`;
  fs.writeFileSync(OUT_JS, jsContent);
  const jsSize = fs.statSync(OUT_JS).size;
  console.log(`[uniapp] bosses_compact.js ${(jsSize/1024).toFixed(1)} KB`);
}

main();
