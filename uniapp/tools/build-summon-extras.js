#!/usr/bin/env node
// ============================================================
// 生成星尘龙(4段) + 帝皇飞剑 sprite 数据
// 输出: uniapp/static/terraria/summon_extras.js
//
// 星尘龙: Projectile_625(头) / 626(身1) / 627(身2) / 628(尾)
//   每个 32×66 = 2 帧(每帧 32×33), 用 base+delta
// 帝皇飞剑: Projectile_946, 94×30 单帧
// ============================================================

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const SRC_DIR = 'D:/project/Pokemon/terraria-clock-preview/terraria-glowxel-1456/_extract_1456';
const OUT_FILE = path.resolve(__dirname, '../static/terraria/summon_extras.js');
const SCALE = 0.27;  // 跟角色同 playerScale
const DRAGON_SCALE = 0.7;  // 星尘龙用更大 scale (原始 32×33 → 22×23, 在 64×64 上可见)
const BLADE_SCALE = 0.5;   // 帝皇飞剑 (原始 94×30 → 47×15, 太大; 用 0.5 → 47×15 还是大, 用 0.35)
const BLADE_SCALE_ACTUAL = 0.35;  // 94×30 → 33×11

function loadPng(name) {
  const p = path.join(SRC_DIR, name + '.png');
  if (!fs.existsSync(p)) { console.warn('[skip] 缺失:', name); return null; }
  return PNG.sync.read(fs.readFileSync(p));
}

function extractRect(png, sx, sy, sw, sh) {
  const out = [];
  for (let y = sy; y < Math.min(sy + sh, png.height); y++) {
    for (let x = sx; x < Math.min(sx + sw, png.width); x++) {
      const o = (y * png.width + x) * 4;
      if (png.data[o + 3] < 5) continue;
      out.push([x - sx, y - sy, png.data[o], png.data[o+1], png.data[o+2], png.data[o+3]]);
    }
  }
  return out;
}

function scalePixels(pixels, srcW, srcH) {
  const dstW = Math.max(1, Math.round(srcW * SCALE));
  const dstH = Math.max(1, Math.round(srcH * SCALE));
  // 反向采样
  const srcBuf = new Uint8Array(srcW * srcH * 4);
  for (const [x, y, r, g, b, a] of pixels) {
    if (x < srcW && y < srcH) {
      const i = (y * srcW + x) * 4;
      srcBuf[i] = r; srcBuf[i+1] = g; srcBuf[i+2] = b; srcBuf[i+3] = a;
    }
  }
  const out = [];
  for (let dy = 0; dy < dstH; dy++) {
    const sy = Math.min(srcH - 1, Math.round(dy / SCALE));
    for (let dx = 0; dx < dstW; dx++) {
      const sx = Math.min(srcW - 1, Math.round(dx / SCALE));
      const i = (sy * srcW + sx) * 4;
      if (srcBuf[i + 3] >= 5) {
        out.push([dx, dy, srcBuf[i], srcBuf[i+1], srcBuf[i+2], srcBuf[i+3]]);
      }
    }
  }
  return { pixels: out, w: dstW, h: dstH };
}

function packPixels(pixels) {
  const n = pixels.length;
  const buf = Buffer.alloc(n * 5);
  for (let i = 0; i < n; i++) {
    buf[i*5] = pixels[i][0]; buf[i*5+1] = pixels[i][1];
    buf[i*5+2] = pixels[i][2]; buf[i*5+3] = pixels[i][3]; buf[i*5+4] = pixels[i][4];
  }
  return { n, b: buf.toString('base64') };
}

function computeDelta(base, frame) {
  const bm = new Map();
  for (const p of base) bm.set(p[0]+','+p[1], (p[2]<<16)|(p[3]<<8)|p[4]);
  const set = [], seen = new Set();
  for (const p of frame) {
    const k = p[0]+','+p[1]; seen.add(k);
    if (bm.get(k) !== ((p[2]<<16)|(p[3]<<8)|p[4])) set.push(p);
  }
  const clear = [];
  for (const p of base) { if (!seen.has(p[0]+','+p[1])) clear.push(p); }
  return { set, clear };
}

function packClear(pixels) {
  const buf = Buffer.alloc(pixels.length * 2);
  for (let i = 0; i < pixels.length; i++) {
    buf[i*2] = pixels[i][0]; buf[i*2+1] = pixels[i][1];
  }
  return { n: pixels.length, b: buf.toString('base64') };
}

function main() {
  const result = {};

  // ===== 星尘龙: 4 段按实际像素 bbox 紧密拼接, 整体缩放 =====
  // 每段 32×33, 但实际像素只占一部分(头满, 身体底部 13px, 尾底部)
  // 先裁剪每段的 bbox, 再紧密拼接
  {
    const segIds = [625, 626, 627, 628];
    const frameH = 33;

    // 提取每段并裁剪到 bbox
    const segData = [];
    for (const id of segIds) {
      const png = loadPng('Projectile_' + id);
      if (!png) continue;
      const pixels = extractRect(png, 0, 0, png.width, frameH);
      // 算 bbox
      let minY = 999, maxY = 0;
      for (const [x, y] of pixels) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
      // 裁剪: y 坐标减去 minY
      const cropped = pixels.map(([x, y, r, g, b, a]) => [x, y - minY, r, g, b, a]);
      segData.push({ pixels: cropped, w: png.width, h: maxY - minY + 1 });
    }

    // 紧密拼接 (每段紧贴上一段底部)
    let totalH = 0;
    const compositePixels = [];
    for (const seg of segData) {
      for (const [x, y, r, g, b, a] of seg.pixels) {
        compositePixels.push([x, totalH + y, r, g, b, a]);
      }
      totalH += seg.h;
    }
    const totalW = 32;

    const scaled = scalePixels(compositePixels, totalW, totalH);
    const packed = packPixels(scaled.pixels);
    result['stardust_dragon'] = {
      w: scaled.w, h: scaled.h, fmt: 5, n: packed.n, b: packed.b,
    };
    console.log(`  stardust_dragon (bbox crop): ${scaled.w}x${scaled.h}, ${packed.n}px (src ${totalW}x${totalH})`);
  }

  // ===== 帝皇飞剑 (单帧, 94×30) =====
  const bladePng = loadPng('Projectile_946');
  if (bladePng) {
    const raw = extractRect(bladePng, 0, 0, bladePng.width, bladePng.height);
    const scaled = scalePixels(raw, bladePng.width, bladePng.height);
    const packed = packPixels(scaled.pixels);
    result['empress_blade'] = {
      w: scaled.w, h: scaled.h, fmt: 5, n: packed.n, b: packed.b,
    };
    console.log(`  empress_blade: ${scaled.w}x${scaled.h}, ${packed.n}px`);
  }

  // 写文件
  const content = `// 星尘龙(4段) + 帝皇飞剑 sprite 数据\n// Generated by build-summon-extras.js\nmodule.exports = ${JSON.stringify(result)};\n`;
  fs.writeFileSync(OUT_FILE, content);
  console.log(`\n[done] ${OUT_FILE}: ${(fs.statSync(OUT_FILE).size/1024).toFixed(1)} KB`);
}

main();
