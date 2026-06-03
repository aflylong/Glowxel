#!/usr/bin/env node
// ============================================================
// 从 bosses_compact.js 生成板载 sprites_bosses.h
//
// 输入: uniapp/static/terraria/bosses_compact.js
//        每 entry: { idx, biome, nameZh, x, y, scale, frameCount, base: {s,sN}, deltas: [{s,sN,c,cN}] }
// 输出: esp32-firmware/include/theme_assets/terraria/sprites_bosses.h
//        每 boss = palette + base.setPixels + delta[i].setPixels + delta[i].clearPixels + TerrariaFrameBlock[] + TerrariaSpriteAnim
//
// boss 专用压缩:
//   fmt=8: 每 set 像素 3 字节 [pos_lo,pos_hi,palette_idx8]
//   fmt=9: 每 set 像素 4 字节 [pos_lo,pos_hi,palette_idx_lo,palette_idx_hi]
//   clear 仍保持 2 字节 [x,y]
// ============================================================

const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../static/terraria/bosses_compact.js');
const OUT = path.resolve(__dirname, '../../esp32-firmware/include/theme_assets/terraria/sprites_bosses.h');

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

function colorKey(r, g, b) {
  return `${r},${g},${b}`;
}

function parseSetPixels(buf, label) {
  if (buf.length % 5 !== 0) {
    throw new Error(`${label}: set buffer length ${buf.length} is not divisible by 5`);
  }
  const pixels = [];
  for (let i = 0; i < buf.length; i += 5) {
    const x = buf[i];
    const y = buf[i + 1];
    if (x >= 64 || y >= 64) {
      throw new Error(`${label}: pixel out of 64x64 bounds (${x},${y})`);
    }
    pixels.push({
      x,
      y,
      r: buf[i + 2],
      g: buf[i + 3],
      b: buf[i + 4],
    });
  }
  return pixels;
}

function parseClearPixels(buf, label) {
  if (buf.length % 2 !== 0) {
    throw new Error(`${label}: clear buffer length ${buf.length} is not divisible by 2`);
  }
  const pixels = [];
  for (let i = 0; i < buf.length; i += 2) {
    const x = buf[i];
    const y = buf[i + 1];
    if (x >= 64 || y >= 64) {
      throw new Error(`${label}: clear pixel out of 64x64 bounds (${x},${y})`);
    }
    pixels.push({ x, y });
  }
  return pixels;
}

function buildPalette(setBuffers, label) {
  const colors = [];
  const indexByColor = new Map();
  for (const buf of setBuffers) {
    for (const p of parseSetPixels(buf, label)) {
      const key = colorKey(p.r, p.g, p.b);
      if (indexByColor.has(key)) {
        continue;
      }
      indexByColor.set(key, colors.length);
      colors.push([p.r, p.g, p.b]);
    }
  }
  return { colors, indexByColor };
}

function paletteToBuffer(colors) {
  const buf = Buffer.alloc(colors.length * 3);
  colors.forEach((color, i) => {
    buf[i * 3] = color[0];
    buf[i * 3 + 1] = color[1];
    buf[i * 3 + 2] = color[2];
  });
  return buf;
}

function encodeSetBuffer(buf, palette, usePalette16, label) {
  const pixels = parseSetPixels(buf, label);
  const stride = usePalette16 ? 4 : 3;
  const out = Buffer.alloc(pixels.length * stride);
  pixels.forEach((p, i) => {
    const pos = p.y * 64 + p.x;
    const idx = palette.indexByColor.get(colorKey(p.r, p.g, p.b));
    if (idx === undefined) {
      throw new Error(`${label}: palette missing color ${p.r},${p.g},${p.b}`);
    }
    const offset = i * stride;
    out[offset] = pos & 0xff;
    out[offset + 1] = (pos >> 8) & 0xff;
    if (usePalette16) {
      out[offset + 2] = idx & 0xff;
      out[offset + 3] = (idx >> 8) & 0xff;
    } else {
      if (idx > 255) {
        throw new Error(`${label}: palette8 index overflow ${idx}`);
      }
      out[offset + 2] = idx;
    }
  });
  return out;
}

function decodeSetBuffer(buf, colors, usePalette16, label) {
  const stride = usePalette16 ? 4 : 3;
  if (buf.length % stride !== 0) {
    throw new Error(`${label}: encoded set buffer length ${buf.length} is not divisible by ${stride}`);
  }
  const out = Buffer.alloc((buf.length / stride) * 5);
  for (let i = 0; i < buf.length; i += stride) {
    const pos = buf[i] | (buf[i + 1] << 8);
    const x = pos % 64;
    const y = Math.floor(pos / 64);
    const idx = usePalette16 ? (buf[i + 2] | (buf[i + 3] << 8)) : buf[i + 2];
    const color = colors[idx];
    if (!color) {
      throw new Error(`${label}: encoded color index out of bounds ${idx}`);
    }
    const outOffset = (i / stride) * 5;
    out[outOffset] = x;
    out[outOffset + 1] = y;
    out[outOffset + 2] = color[0];
    out[outOffset + 3] = color[1];
    out[outOffset + 4] = color[2];
  }
  return out;
}

function applySetToFrame(frame, buf, label) {
  for (const p of parseSetPixels(buf, label)) {
    frame[p.y * 64 + p.x] = colorKey(p.r, p.g, p.b);
  }
}

function applyClearToFrame(frame, buf, label) {
  for (const p of parseClearPixels(buf, label)) {
    frame[p.y * 64 + p.x] = null;
  }
}

function assertSameBuffer(label, a, b) {
  if (a.length !== b.length) {
    throw new Error(`${label}: buffer length mismatch ${a.length} != ${b.length}`);
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      throw new Error(`${label}: buffer mismatch at byte ${i}: ${a[i]} != ${b[i]}`);
    }
  }
}

function assertSameFrame(label, a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      const x = i % 64;
      const y = Math.floor(i / 64);
      throw new Error(`${label}: frame mismatch at (${x},${y}): ${a[i]} != ${b[i]}`);
    }
  }
}

function verifyBossFrames(e, encoded, palette, usePalette16) {
  const oldFrame = new Array(64 * 64).fill(null);
  const newFrame = new Array(64 * 64).fill(null);

  const decodedBase = decodeSetBuffer(encoded.base, palette.colors, usePalette16, `${e.slug} base`);
  assertSameBuffer(`${e.slug} base roundtrip`, Buffer.from(e.base.s, 'base64'), decodedBase);
  applySetToFrame(oldFrame, Buffer.from(e.base.s, 'base64'), `${e.slug} old base`);
  applySetToFrame(newFrame, decodedBase, `${e.slug} new base`);
  assertSameFrame(`${e.slug} frame 0`, oldFrame, newFrame);

  for (let f = 0; f < e.deltas.length; f++) {
    const d = e.deltas[f];
    const oldSet = Buffer.from(d.s, 'base64');
    const decodedSet = decodeSetBuffer(encoded.deltas[f].setBuf, palette.colors, usePalette16, `${e.slug} delta ${f}`);
    assertSameBuffer(`${e.slug} delta ${f} set roundtrip`, oldSet, decodedSet);

    if (d.cN > 0 && d.c) {
      const clearBuf = Buffer.from(d.c, 'base64');
      applyClearToFrame(oldFrame, clearBuf, `${e.slug} old delta ${f}`);
      applyClearToFrame(newFrame, clearBuf, `${e.slug} new delta ${f}`);
    }
    applySetToFrame(oldFrame, oldSet, `${e.slug} old delta ${f}`);
    applySetToFrame(newFrame, decodedSet, `${e.slug} new delta ${f}`);
    assertSameFrame(`${e.slug} frame ${f + 1}`, oldFrame, newFrame);
  }
}

function main() {
  const compact = require(SRC);
  const slugs = Object.keys(compact);
  console.log(`[build-bosses-firmware-from-compact] ${slugs.length} bosses, src=${SRC}`);

  let header = `// Generated by uniapp/tools/build-bosses-firmware-from-compact.js
// 不要手改; 由 bosses_compact.js 转换生成 (uniapp + 板载 同源数据)
// 数据格式: boss 专用 palette packed setPixels + 原 clearPixels
#pragma once

#include <Arduino.h>
#include <pgmspace.h>
#include "terraria_sprite_types.h"

`;

  // 按 idx 排序
  const sorted = slugs.map(s => ({slug: s, ...compact[s]})).sort((a, b) => a.idx - b.idx);

  let totalSetBytes = 0, totalClearBytes = 0, totalPaletteBytes = 0;
  let oldSetBytes = 0, oldClearBytes = 0;
  const entries = [];

  for (const e of sorted) {
    const i = e.idx;
    const slug = e.slug;
    const varName = `Boss_${i}`;
    const allSetBuffers = [
      Buffer.from(e.base.s, 'base64'),
      ...e.deltas.map(d => Buffer.from(d.s, 'base64')),
    ];
    const palette = buildPalette(allSetBuffers, slug);
    const usePalette16 = palette.colors.length > 256;
    const fmt = usePalette16 ? 9 : 8;
    const paletteName = `k${varName}Palette`;
    const paletteBuf = paletteToBuffer(palette.colors);

    // ===== base =====
    const baseBuf = Buffer.from(e.base.s, 'base64');
    const baseEncoded = encodeSetBuffer(baseBuf, palette, usePalette16, `${slug} base`);
    const encoded = { base: baseEncoded, deltas: [] };
    header += `// [${i}] ${slug} (${e.nameZh}): ${e.base.sN} base px, ${e.frameCount} frames, palette ${palette.colors.length}, fmt=${fmt}\n`;
    header += `static const uint8_t ${paletteName}[] PROGMEM = {\n${bufferToCArray(paletteBuf)}\n};\n`;
    header += `static const uint8_t k${varName}BaseSet[] PROGMEM = {\n${bufferToCArray(baseEncoded)}\n};\n`;
    totalPaletteBytes += paletteBuf.length;
    totalSetBytes += baseEncoded.length;
    oldSetBytes += baseBuf.length;

    // ===== deltas (set + clear) =====
    const deltaItems = [];
    for (let f = 0; f < e.deltas.length; f++) {
      const d = e.deltas[f];
      const setBuf = Buffer.from(d.s, 'base64');
      const setEncoded = encodeSetBuffer(setBuf, palette, usePalette16, `${slug} delta ${f}`);
      const setName = `k${varName}D${f}Set`;
      header += setEncoded.length > 0
        ? `static const uint8_t ${setName}[] PROGMEM = {\n${bufferToCArray(setEncoded)}\n};\n`
        : `static const uint8_t ${setName}[] PROGMEM = {0};\n`;
      totalSetBytes += setEncoded.length;
      oldSetBytes += setBuf.length;
      encoded.deltas.push({ setBuf: setEncoded });

      // clear (cN/cB; 没有就当 0)
      let clearName = 'nullptr';
      let clearN = 0;
      if (d.cN > 0 && d.c) {
        const clearBuf = Buffer.from(d.c, 'base64');
        clearName = `k${varName}D${f}Clear`;
        header += `static const uint8_t ${clearName}[] PROGMEM = {\n${bufferToCArray(clearBuf)}\n};\n`;
        totalClearBytes += clearBuf.length;
        oldClearBytes += clearBuf.length;
        clearN = d.cN;
      }
      deltaItems.push({ setName, setN: d.sN, clearName, clearN });
    }

    verifyBossFrames(e, encoded, palette, usePalette16);

    if (deltaItems.length > 0) {
      header += `static const TerrariaFrameBlock k${varName}Deltas[] PROGMEM = {\n`;
      for (const d of deltaItems) {
        header += `  { .setCount = ${d.setN}, .setPixels = ${d.setName}, .clearCount = ${d.clearN}, .clearPixels = ${d.clearName} },\n`;
      }
      header += `};\n`;
      header += `static const TerrariaSpriteAnim k${varName} PROGMEM = {\n`;
      header += `  .w = 64, .h = 64, .frameCount = ${e.frameCount}, .frameStart = 0,\n`;
      header += `  .base = { .setCount = ${e.base.sN}, .setPixels = k${varName}BaseSet, .clearCount = 0, .clearPixels = nullptr },\n`;
      header += `  .deltas = k${varName}Deltas, .fmt = ${fmt},\n`;
      header += `};\n\n`;
    } else {
      // 单帧 boss (frameCount=1, 没 deltas)
      header += `static const TerrariaSpriteAnim k${varName} PROGMEM = {\n`;
      header += `  .w = 64, .h = 64, .frameCount = 1, .frameStart = 0,\n`;
      header += `  .base = { .setCount = ${e.base.sN}, .setPixels = k${varName}BaseSet, .clearCount = 0, .clearPixels = nullptr },\n`;
      header += `  .deltas = nullptr, .fmt = ${fmt},\n`;
      header += `};\n\n`;
    }

    entries.push({ idx: i, slug, varName, paletteName, paletteCount: palette.colors.length });
    console.log(`  [${i}] ${slug}: ${e.frameCount}f, base ${e.base.sN}px, ${e.deltas.length} deltas, palette ${palette.colors.length}, fmt=${fmt}`);
  }

  // Getter
  header += `inline const TerrariaSpriteAnim* getBossAnim(uint8_t i) {\n  switch(i) {\n`;
  for (const e of entries) header += `    case ${e.idx}: return &k${e.varName};\n`;
  header += `    default: return nullptr;\n  }\n}\nstatic constexpr uint8_t kBossCount = ${entries.length};\n`;
  header += `inline const uint8_t* getBossPalette(uint8_t i) {\n  switch(i) {\n`;
  for (const e of entries) header += `    case ${e.idx}: return ${e.paletteName};\n`;
  header += `    default: return nullptr;\n  }\n}\n`;
  header += `inline uint16_t getBossPaletteCount(uint8_t i) {\n  switch(i) {\n`;
  for (const e of entries) header += `    case ${e.idx}: return ${e.paletteCount};\n`;
  header += `    default: return 0;\n  }\n}\n`;

  const newTotalBin = totalPaletteBytes + totalSetBytes + totalClearBytes;
  const oldTotalBin = oldSetBytes + oldClearBytes;
  if (newTotalBin <= 0 || newTotalBin >= oldTotalBin) {
    throw new Error(`Refusing to overwrite ${OUT}: optimized payload ${newTotalBin} is not smaller than old ${oldTotalBin}`);
  }

  fs.writeFileSync(OUT, header);
  const fileSize = fs.statSync(OUT).size;
  console.log(`\n[done] old ${(oldTotalBin/1024).toFixed(1)} KB -> new ${(newTotalBin/1024).toFixed(1)} KB binary`);
  console.log(`       palette ${(totalPaletteBytes/1024).toFixed(1)} + set ${(totalSetBytes/1024).toFixed(1)} + clear ${(totalClearBytes/1024).toFixed(1)} KB`);
  console.log(`       sprites_bosses.h: ${(fileSize/1024).toFixed(1)} KB`);
}

main();
