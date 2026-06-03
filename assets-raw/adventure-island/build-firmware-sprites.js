#!/usr/bin/env node
// Generate optimized Adventure Island firmware sprites.
//
// Source data stays shared with website/src/utils/adventureIslandSprites.js.
// Firmware output uses fmt=8: [pos_lo,pos_hi,palette_idx], where pos = y*w + x.
// Before writing, this script decodes old and new data and verifies every
// sprite currently exposed by index.h is still present and pixel-identical.

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'website/src/utils/adventureIslandSprites.js');
const OUT_DIR = path.join(ROOT, 'esp32-firmware/include/theme_assets/adventure_island');
const INDEX = path.join(OUT_DIR, 'index.h');

const GROUPS = [
  { file: 'sprites_higgins.h', label: 'higgins', prefixes: ['higgins.'] },
  { file: 'sprites_enemies.h', label: 'enemies', prefixes: ['enemy.'] },
  { file: 'sprites_obstacles.h', label: 'obstacles', prefixes: ['obstacle.'] },
  { file: 'sprites_items.h', label: 'items', prefixes: ['item.', 'fruit.'] },
  { file: 'sprites_digits.h', label: 'digits', prefixes: ['hud.digit.'] },
  { file: 'sprites_bg.h', label: 'bg', prefixes: ['bg.'] },
];

function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

function writeTextIfChanged(file, text) {
  if (fs.existsSync(file)) {
    const oldText = readText(file);
    if (oldText === text) {
      return false;
    }
  }
  fs.writeFileSync(file, text, 'utf8');
  return true;
}

function hexByte(n) {
  return '0x' + n.toString(16).padStart(2, '0');
}

function bytesToCArray(bytes) {
  if (bytes.length === 0) {
    return '  0';
  }
  const lines = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = [];
    const end = Math.min(i + 16, bytes.length);
    for (let j = i; j < end; j++) {
      chunk.push(hexByte(bytes[j]));
    }
    let line = '  ' + chunk.join(', ');
    if (end < bytes.length) {
      line += ',';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

function parseHexColor(hex) {
  if (typeof hex !== 'string') {
    throw new Error(`color is not string: ${hex}`);
  }
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (m === null) {
    throw new Error(`invalid color: ${hex}`);
  }
  const v = parseInt(m[1], 16);
  return [(v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff];
}

function colorKey(rgb) {
  return `${rgb[0]},${rgb[1]},${rgb[2]}`;
}

function symbolBaseFromKey(key) {
  const parts = key.split('.');
  if (parts[0] === 'fruit') {
    return `Item_fruit_${parts[1]}`;
  }
  if (parts[0] === 'hud' && parts[1] === 'digit') {
    return `Digit_${parts[2]}`;
  }
  const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  return first + '_' + parts.slice(1).join('_');
}

function spriteSymbolFromKey(key) {
  return 'k' + symbolBaseFromKey(key);
}

function pixelSymbolFromKey(key) {
  return spriteSymbolFromKey(key) + 'Pixels';
}

function parseIndexMappings() {
  const text = readText(INDEX);
  const mappings = [];
  const re = /strcmp\(key,\s*"([^"]+)"\)\s*==\s*0\)\s*return\s*&([A-Za-z0-9_]+)/g;
  let match = re.exec(text);
  while (match !== null) {
    mappings.push({ key: match[1], symbol: match[2] });
    match = re.exec(text);
  }
  if (mappings.length === 0) {
    throw new Error('index.h has no sprite key mappings');
  }
  return mappings;
}

function groupForKey(key) {
  for (const group of GROUPS) {
    for (const prefix of group.prefixes) {
      if (key.startsWith(prefix)) {
        return group;
      }
    }
  }
  throw new Error(`no firmware group for key: ${key}`);
}

function parseOldHeader(file) {
  const text = readText(file);
  const arrays = new Map();
  const arrayRe = /static const uint8_t\s+([A-Za-z0-9_]+)\[\]\s+PROGMEM\s*=\s*\{([\s\S]*?)\};/g;
  let arrayMatch = arrayRe.exec(text);
  while (arrayMatch !== null) {
    const bytes = [];
    const byteRe = /0x([0-9a-fA-F]{2})/g;
    let byteMatch = byteRe.exec(arrayMatch[2]);
    while (byteMatch !== null) {
      bytes.push(parseInt(byteMatch[1], 16));
      byteMatch = byteRe.exec(arrayMatch[2]);
    }
    arrays.set(arrayMatch[1], bytes);
    arrayMatch = arrayRe.exec(text);
  }

  const sprites = new Map();
  const spriteRe = /static const AISprite\s+([A-Za-z0-9_]+)\s+PROGMEM\s*=\s*\{\s*\.w\s*=\s*(\d+),\s*\.h\s*=\s*(\d+),\s*\.pixelCount\s*=\s*(\d+),\s*\.pixels\s*=\s*([A-Za-z0-9_]+),\s*\.fmt\s*=\s*(\d+),\s*\};/g;
  let spriteMatch = spriteRe.exec(text);
  while (spriteMatch !== null) {
    const symbol = spriteMatch[1];
    const pixelSymbol = spriteMatch[5];
    if (!arrays.has(pixelSymbol)) {
      throw new Error(`${file}: missing pixel array ${pixelSymbol}`);
    }
    sprites.set(symbol, {
      w: Number(spriteMatch[2]),
      h: Number(spriteMatch[3]),
      pixelCount: Number(spriteMatch[4]),
      pixels: arrays.get(pixelSymbol),
      fmt: Number(spriteMatch[6]),
    });
    spriteMatch = spriteRe.exec(text);
  }
  return sprites;
}

function parseOldSprites() {
  const all = new Map();
  for (const group of GROUPS) {
    const sprites = parseOldHeader(path.join(OUT_DIR, group.file));
    for (const entry of sprites.entries()) {
      all.set(entry[0], entry[1]);
    }
  }
  return all;
}

function parseExistingPalette() {
  const file = path.join(OUT_DIR, 'sprites_palette.h');
  if (!fs.existsSync(file)) {
    return [];
  }
  const text = readText(file);
  const paletteMatch = /static const uint8_t\s+kAIPalette\[\]\s+PROGMEM\s*=\s*\{([\s\S]*?)\};/.exec(text);
  if (paletteMatch === null) {
    return [];
  }
  const bytes = [];
  const byteRe = /0x([0-9a-fA-F]{2})/g;
  let byteMatch = byteRe.exec(paletteMatch[1]);
  while (byteMatch !== null) {
    bytes.push(parseInt(byteMatch[1], 16));
    byteMatch = byteRe.exec(paletteMatch[1]);
  }
  if (bytes.length % 3 !== 0) {
    throw new Error(`${file}: palette byte length ${bytes.length} is not divisible by 3`);
  }
  const colors = [];
  for (let i = 0; i < bytes.length; i += 3) {
    colors.push([bytes[i], bytes[i + 1], bytes[i + 2]]);
  }
  return colors;
}

function decodeFirmwareSprite(sprite, palette, label) {
  if (sprite.fmt === 5) {
    const expected = sprite.pixelCount * 5;
    if (sprite.pixels.length !== expected) {
      throw new Error(`${label}: fmt5 byte length ${sprite.pixels.length} != ${expected}`);
    }
    const pixels = [];
    for (let i = 0; i < sprite.pixels.length; i += 5) {
      pixels.push({
        x: sprite.pixels[i],
        y: sprite.pixels[i + 1],
        r: sprite.pixels[i + 2],
        g: sprite.pixels[i + 3],
        b: sprite.pixels[i + 4],
      });
    }
    return pixels;
  }
  if (sprite.fmt === 8) {
    return decodeNewSprite(sprite, palette, label);
  }
  throw new Error(`${label}: unsupported existing fmt ${sprite.fmt}`);
}

function decodeNewSprite(sprite, palette, label) {
  if (sprite.fmt !== 8) {
    throw new Error(`${label}: new fmt must be 8, got ${sprite.fmt}`);
  }
  const expected = sprite.pixelCount * 3;
  if (sprite.pixels.length !== expected) {
    throw new Error(`${label}: new byte length ${sprite.pixels.length} != ${expected}`);
  }
  const pixels = [];
  for (let i = 0; i < sprite.pixels.length; i += 3) {
    const pos = sprite.pixels[i] | (sprite.pixels[i + 1] << 8);
    const idx = sprite.pixels[i + 2];
    const color = palette[idx];
    if (color === undefined) {
      throw new Error(`${label}: palette index out of bounds ${idx}`);
    }
    pixels.push({
      x: pos % sprite.w,
      y: Math.floor(pos / sprite.w),
      r: color[0],
      g: color[1],
      b: color[2],
    });
  }
  return pixels;
}

function assertSamePixels(label, oldSprite, oldPalette, newSprite, newPalette) {
  if (oldSprite.w !== newSprite.w) {
    throw new Error(`${label}: width mismatch ${oldSprite.w} != ${newSprite.w}`);
  }
  if (oldSprite.h !== newSprite.h) {
    throw new Error(`${label}: height mismatch ${oldSprite.h} != ${newSprite.h}`);
  }
  if (oldSprite.pixelCount !== newSprite.pixelCount) {
    throw new Error(`${label}: pixelCount mismatch ${oldSprite.pixelCount} != ${newSprite.pixelCount}`);
  }
  const oldPixels = decodeFirmwareSprite(oldSprite, oldPalette, label);
  const newPixels = decodeNewSprite(newSprite, newPalette, label);
  for (let i = 0; i < oldPixels.length; i++) {
    const a = oldPixels[i];
    const b = newPixels[i];
    if (a.x !== b.x || a.y !== b.y || a.r !== b.r || a.g !== b.g || a.b !== b.b) {
      throw new Error(`${label}: pixel mismatch at ${i}`);
    }
  }
}

function spriteFromSource(key, srcSprite, paletteIndexByColor) {
  if (typeof srcSprite.w !== 'number') {
    throw new Error(`${key}: missing numeric w`);
  }
  if (typeof srcSprite.h !== 'number') {
    throw new Error(`${key}: missing numeric h`);
  }
  if (!Array.isArray(srcSprite.p)) {
    throw new Error(`${key}: missing pixel array p`);
  }
  if (srcSprite.p.length !== srcSprite.w * srcSprite.h) {
    throw new Error(`${key}: p length mismatch`);
  }

  const bytes = [];
  let count = 0;
  for (let pos = 0; pos < srcSprite.p.length; pos++) {
    const hex = srcSprite.p[pos];
    if (hex === null) {
      continue;
    }
    const rgb = parseHexColor(hex);
    const idx = paletteIndexByColor.get(colorKey(rgb));
    if (idx === undefined) {
      throw new Error(`${key}: palette missing ${hex}`);
    }
    bytes.push(pos & 0xff, (pos >> 8) & 0xff, idx);
    count++;
  }
  return {
    w: srcSprite.w,
    h: srcSprite.h,
    pixelCount: count,
    pixels: bytes,
    fmt: 8,
  };
}

function collectPalette(keys, sprites) {
  const colors = [];
  const indexByColor = new Map();
  for (const key of keys) {
    const sprite = sprites[key];
    if (sprite === undefined) {
      throw new Error(`source missing sprite ${key}`);
    }
    for (const hex of sprite.p) {
      if (hex === null) {
        continue;
      }
      const rgb = parseHexColor(hex);
      const keyText = colorKey(rgb);
      if (!indexByColor.has(keyText)) {
        if (colors.length >= 256) {
          throw new Error('Adventure Island palette exceeds fmt=8 limit');
        }
        indexByColor.set(keyText, colors.length);
        colors.push(rgb);
      }
    }
  }
  return { colors, indexByColor };
}

function buildPaletteHeader(palette) {
  const bytes = [];
  for (const color of palette) {
    bytes.push(color[0], color[1], color[2]);
  }
  return `// Generated by assets-raw/adventure-island/build-firmware-sprites.js
// Do not edit by hand.
#pragma once

#include <Arduino.h>
#include <pgmspace.h>

static const uint16_t kAIPaletteColorCount = ${palette.length};
static const uint8_t kAIPalette[] PROGMEM = {
${bytesToCArray(bytes)}
};
`;
}

function buildSpriteHeader(group, entries) {
  let out = `// Generated by assets-raw/adventure-island/build-firmware-sprites.js
// Do not edit by hand; rerun the generator after sprite changes.
// Source: website/src/utils/adventureIslandSprites.js (group: ${group.label})
#pragma once

#include <Arduino.h>
#include <pgmspace.h>
#include "adventure_island_sprite_types.h"

`;
  for (const entry of entries) {
    const base = symbolBaseFromKey(entry.key);
    const pixelSymbol = pixelSymbolFromKey(entry.key);
    out += `// ${base} ("${entry.key}"): ${entry.sprite.w}x${entry.sprite.h}, ${entry.sprite.pixelCount} pixels, fmt=8
static const uint8_t ${pixelSymbol}[] PROGMEM = {
${bytesToCArray(entry.sprite.pixels)}
};
static const AISprite ${entry.symbol} PROGMEM = {
  .w = ${entry.sprite.w}, .h = ${entry.sprite.h}, .pixelCount = ${entry.sprite.pixelCount},
  .pixels = ${pixelSymbol}, .fmt = 8,
};

`;
  }
  return out;
}

function buildIndexHeader(mappings) {
  let out = `// Adventure Island sprite main index
// Do not edit by hand; generated by build-firmware-sprites.js.
#pragma once

#include "adventure_island_sprite_types.h"
#include "sprites_palette.h"
#include "sprites_higgins.h"
#include "sprites_enemies.h"
#include "sprites_obstacles.h"
#include "sprites_items.h"
#include "sprites_digits.h"
#include "sprites_bg.h"

namespace AISprites {

inline const AISprite* getByKey(const char* key) {
`;
  for (const mapping of mappings) {
    out += `  if (strcmp(key, "${mapping.key}") == 0) return &${mapping.symbol};
`;
  }
  out += `  return nullptr;
}

inline const AISprite* getDigit(uint8_t n) {
  if (n > 9) return nullptr;
  switch (n) {
    case 0: return &kDigit_0;
    case 1: return &kDigit_1;
    case 2: return &kDigit_2;
    case 3: return &kDigit_3;
    case 4: return &kDigit_4;
    case 5: return &kDigit_5;
    case 6: return &kDigit_6;
    case 7: return &kDigit_7;
    case 8: return &kDigit_8;
    case 9: return &kDigit_9;
  }
  return nullptr;
}

}  // namespace AISprites
`;
  return out;
}

async function main() {
  const mappings = parseIndexMappings();
  const keys = mappings.map((m) => m.key);
  const source = await import(pathToFileURL(SRC).href);
  if (source.SPRITES === undefined) {
    throw new Error('source module missing SPRITES export');
  }

  const paletteInfo = collectPalette(keys, source.SPRITES);
  const oldSprites = parseOldSprites();
  const existingPalette = parseExistingPalette();
  const grouped = new Map();
  const newSpritesBySymbol = new Map();
  for (const group of GROUPS) {
    grouped.set(group.file, []);
  }

  for (const mapping of mappings) {
    const expectedSymbol = spriteSymbolFromKey(mapping.key);
    if (mapping.symbol !== expectedSymbol) {
      throw new Error(`${mapping.key}: index symbol ${mapping.symbol} != generated symbol ${expectedSymbol}`);
    }
    if (!oldSprites.has(mapping.symbol)) {
      throw new Error(`${mapping.key}: old firmware sprite ${mapping.symbol} is missing`);
    }
    const srcSprite = source.SPRITES[mapping.key];
    if (srcSprite === undefined) {
      throw new Error(`${mapping.key}: source sprite missing`);
    }
    const newSprite = spriteFromSource(mapping.key, srcSprite, paletteInfo.indexByColor);
    assertSamePixels(mapping.key, oldSprites.get(mapping.symbol), existingPalette, newSprite, paletteInfo.colors);
    newSpritesBySymbol.set(mapping.symbol, newSprite);
    grouped.get(groupForKey(mapping.key).file).push({
      key: mapping.key,
      symbol: mapping.symbol,
      sprite: newSprite,
    });
  }

  let oldPayload = 0;
  let oldUsesPalette = false;
  let newPayload = paletteInfo.colors.length * 3;
  for (const mapping of mappings) {
    const oldSprite = oldSprites.get(mapping.symbol);
    if (oldSprite.fmt === 8) {
      oldUsesPalette = true;
    }
    oldPayload += oldSprite.pixels.length;
    newPayload += newSpritesBySymbol.get(mapping.symbol).pixels.length;
  }
  if (oldUsesPalette) {
    oldPayload += existingPalette.length * 3;
  }

  const outputs = new Map();
  outputs.set(path.join(OUT_DIR, 'sprites_palette.h'), buildPaletteHeader(paletteInfo.colors));
  for (const group of GROUPS) {
    outputs.set(path.join(OUT_DIR, group.file), buildSpriteHeader(group, grouped.get(group.file)));
  }
  outputs.set(INDEX, buildIndexHeader(mappings));

  for (const item of outputs.entries()) {
    const file = item[0];
    const text = item[1];
    if (fs.existsSync(file)) {
      const oldSize = fs.statSync(file).size;
      if (text.length < oldSize * 0.5 && path.basename(file) !== 'sprites_palette.h') {
        throw new Error(`${file}: generated text is smaller than 50% of current file; refusing to overwrite`);
      }
    }
  }

  let changed = 0;
  for (const item of outputs.entries()) {
    if (writeTextIfChanged(item[0], item[1])) {
      changed++;
    }
  }

  console.log(`[adventure-island] sprites=${mappings.length}, palette=${paletteInfo.colors.length}`);
  console.log(`[adventure-island] payload old=${oldPayload} bytes, new=${newPayload} bytes, saved=${oldPayload - newPayload} bytes`);
  console.log(`[adventure-island] files changed=${changed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
