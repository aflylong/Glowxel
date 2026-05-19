#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const data = require('../static/terraria/summon_extras.js');
const OUT = path.resolve(__dirname, '../../esp32-firmware/include/theme_assets/terraria/sprites_summon_extras.h');

function bufC(buf) {
  const l = [];
  for (let i = 0; i < buf.length; i += 16) {
    const c = [];
    for (let j = 0; j < 16 && i + j < buf.length; j++) c.push('0x' + buf[i+j].toString(16).padStart(2, '0'));
    l.push('  ' + c.join(', ') + (i + 16 < buf.length ? ',' : ''));
  }
  return l.join('\n');
}

let h = `// Generated: summon_extras (stardust_dragon + empress_blade)
#pragma once
#include <Arduino.h>
#include <pgmspace.h>
#include "terraria_sprite_types.h"

`;

// stardust_dragon (单帧 sprite)
const dr = data.stardust_dragon;
const drBuf = Buffer.from(dr.b, 'base64');
h += `// stardust_dragon: ${dr.w}x${dr.h}, ${dr.n} px\n`;
h += `static const uint8_t kStardustDragonPixels[] PROGMEM = {\n${bufC(drBuf)}\n};\n`;
h += `static const TerrariaSprite kStardustDragon PROGMEM = {\n`;
h += `  .w = ${dr.w}, .h = ${dr.h}, .pixelCount = ${dr.n},\n`;
h += `  .pixels = kStardustDragonPixels, .fmt = 5,\n};\n\n`;

// empress_blade (单帧 sprite)
const eb = data.empress_blade;
const ebBuf = Buffer.from(eb.b, 'base64');
h += `// empress_blade: ${eb.w}x${eb.h}, ${eb.n} px\n`;
h += `static const uint8_t kEmpressBladePixels[] PROGMEM = {\n${bufC(ebBuf)}\n};\n`;
h += `static const TerrariaSprite kEmpressBlade PROGMEM = {\n`;
h += `  .w = ${eb.w}, .h = ${eb.h}, .pixelCount = ${eb.n},\n`;
h += `  .pixels = kEmpressBladePixels, .fmt = 5,\n};\n`;

fs.writeFileSync(OUT, h);
console.log(`[done] ${OUT}: ${(fs.statSync(OUT).size/1024).toFixed(1)} KB`);
