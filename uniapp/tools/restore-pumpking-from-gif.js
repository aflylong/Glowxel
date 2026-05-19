#!/usr/bin/env node
// ============================================================
// 从 Pumpking.gif 恢复南瓜王全部帧
//
// 输入: uniapp/static/terraria/Pumpking.gif (45 帧, 170×187)
// 输出: 更新 uniapp/static/terraria/bosses_compact.js 里 pumpking entry
//        其他 32 个 boss 完全不动
// ============================================================

const fs = require('fs');
const path = require('path');
const { parseGIF, decompressFrames } = require('gifuct-js');

const GIF_FILE = path.resolve(__dirname, '../static/terraria/Pumpking.gif');
const COMPACT_FILE = path.resolve(__dirname, '../static/terraria/bosses_compact.js');

const SLUG = 'pumpking';
const PARAMS = { scale: 30, x: 32, y: 41 };  // 跟实验区源一致, 不行再调

// ============ GIF → RGBA 帧列表 ============

function decodeGifFrames(gifPath) {
  const buf = fs.readFileSync(gifPath);
  const gif = parseGIF(buf);
  const rawFrames = decompressFrames(gif, true);
  const W = gif.lsd.width;
  const H = gif.lsd.height;

  // gifuct 返回每帧 patch (局部 dims), 需自己合成全画布(支持 disposal)
  const canvas = new Uint8Array(W * H * 4);  // 全透明初始
  const out = [];

  // 检测白色背景: 第 0 帧白色像素数 / 总像素数 > 30% 视为白底
  const f0 = rawFrames[0].patch;
  let whiteCount = 0;
  for (let i = 0; i < f0.length; i += 4) {
    if (f0[i] > 240 && f0[i+1] > 240 && f0[i+2] > 240 && f0[i+3] > 0) whiteCount++;
  }
  const dropWhite = whiteCount > (W * H * 0.3);
  if (dropWhite) {
    console.log(`  [bg detect] 第 0 帧白色像素 ${whiteCount}, 自动剔除白色背景`);
  }

  for (let i = 0; i < rawFrames.length; i++) {
    const f = rawFrames[i];
    const { width: pw, height: ph, top, left } = f.dims;
    const patch = f.patch;

    // disposal:
    //   0: no disposal (默认, 保留)
    //   1: don't dispose (保留)
    //   2: restore to background (清空到背景, 我们用全透明)
    //   3: restore to previous (恢复到上一帧, 简化为不恢复)
    if (i > 0 && rawFrames[i - 1].disposalType === 2) {
      const prev = rawFrames[i - 1].dims;
      for (let y = prev.top; y < prev.top + prev.height; y++) {
        for (let x = prev.left; x < prev.left + prev.width; x++) {
          const idx = (y * W + x) * 4;
          canvas[idx] = 0; canvas[idx+1] = 0; canvas[idx+2] = 0; canvas[idx+3] = 0;
        }
      }
    }

    // 把 patch 应用到 canvas (只覆盖非透明像素, 自动剔除白色背景)
    for (let yy = 0; yy < ph; yy++) {
      for (let xx = 0; xx < pw; xx++) {
        const pi = (yy * pw + xx) * 4;
        const a = patch[pi + 3];
        if (a === 0) continue;
        // 白色背景剔除
        if (dropWhite && patch[pi] > 240 && patch[pi+1] > 240 && patch[pi+2] > 240) continue;
        const ci = ((yy + top) * W + (xx + left)) * 4;
        canvas[ci] = patch[pi];
        canvas[ci+1] = patch[pi+1];
        canvas[ci+2] = patch[pi+2];
        canvas[ci+3] = a;
      }
    }

    // 抽出当前 canvas 的非透明像素
    const framePixels = [];
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        if (canvas[idx + 3] >= 5) {
          framePixels.push([x, y, canvas[idx], canvas[idx+1], canvas[idx+2], canvas[idx+3]]);
        }
      }
    }
    out.push(framePixels);
  }

  return { width: W, height: H, frames: out };
}

// ============ 缩放到 64×64 ============

function renderFrameTo64(framePixels, frameSize, params) {
  const [fw, fh] = frameSize;
  const scale = params.scale / 100;
  const centerX = params.x;
  const centerY = params.y;
  const bossCx = fw / 2;
  const bossCy = fh / 2;

  const screenMap = new Map();
  for (const px of framePixels) {
    const [x, y, r, g, b, a] = px;
    if (a < 5) continue;
    const sx = Math.round(centerX + (x - bossCx) * scale);
    const sy = Math.round(centerY + (y - bossCy) * scale);
    if (sx < 0 || sx >= 64 || sy < 0 || sy >= 64) continue;
    screenMap.set(sx * 64 + sy, { x: sx, y: sy, r, g, b });
  }
  return Array.from(screenMap.values());
}

// ============ base + delta(set+clear) ============
// 颜色容差: |Δr|+|Δg|+|Δb| <= COLOR_TOLERANCE 视为相同 (修 GIF 量化导致的伪差异)
const COLOR_TOLERANCE = 12;

function computeDelta(basePixels, framePixels) {
  const baseMap = new Map();
  for (const p of basePixels) baseMap.set(p.x * 64 + p.y, p);
  const set = [];
  const seen = new Set();
  for (const p of framePixels) {
    const k = p.x * 64 + p.y;
    seen.add(k);
    const bp = baseMap.get(k);
    if (!bp) {
      set.push(p);  // 新位置
    } else {
      const dr = Math.abs(bp.r - p.r);
      const dg = Math.abs(bp.g - p.g);
      const db = Math.abs(bp.b - p.b);
      if (dr + dg + db > COLOR_TOLERANCE) set.push(p);
    }
  }
  const clear = [];
  for (const p of basePixels) {
    if (!seen.has(p.x * 64 + p.y)) clear.push({ x: p.x, y: p.y });
  }
  return { set, clear };
}

function packSet(pixels) {
  const buf = Buffer.alloc(pixels.length * 5);
  for (let i = 0; i < pixels.length; i++) {
    buf[i*5]=pixels[i].x; buf[i*5+1]=pixels[i].y;
    buf[i*5+2]=pixels[i].r; buf[i*5+3]=pixels[i].g; buf[i*5+4]=pixels[i].b;
  }
  return { n: pixels.length, b: buf.toString('base64') };
}

function packClear(pixels) {
  const buf = Buffer.alloc(pixels.length * 2);
  for (let i = 0; i < pixels.length; i++) {
    buf[i*2]=pixels[i].x; buf[i*2+1]=pixels[i].y;
  }
  return { n: pixels.length, b: buf.toString('base64') };
}

// ============ Main ============

function main() {
  console.log('[restore-pumpking-from-gif]');
  console.log('  GIF:', GIF_FILE);
  console.log('  COMPACT:', COMPACT_FILE);

  const gif = decodeGifFrames(GIF_FILE);
  console.log(`  GIF: ${gif.width}×${gif.height}, ${gif.frames.length} frames`);

  // 渲染所有帧到 64×64
  const allFrames = [];
  for (const fp of gif.frames) {
    allFrames.push(renderFrameTo64(fp, [gif.width, gif.height], PARAMS));
  }
  if (allFrames[0].length === 0) {
    console.warn('  base 帧 0 像素, 退出');
    return;
  }

  const basePixels = allFrames[0];
  const baseSet = packSet(basePixels);

  const deltas = [];
  let totalSet = 0, totalClear = 0;
  for (let i = 1; i < allFrames.length; i++) {
    const { set, clear } = computeDelta(basePixels, allFrames[i]);
    const setPacked = packSet(set);
    const clearPacked = packClear(clear);
    deltas.push({
      s: setPacked.b, sN: setPacked.n,
      c: clearPacked.b, cN: clearPacked.n,
    });
    totalSet += set.length;
    totalClear += clear.length;
  }

  console.log(`  base=${basePixels.length}px, ${deltas.length} deltas (${totalSet} set + ${totalClear} clear)`);

  // 更新 compact
  const compact = require(COMPACT_FILE);
  const oldEntry = compact[SLUG];
  if (!oldEntry) {
    console.error('  compact 里没有 ' + SLUG);
    return;
  }
  compact[SLUG] = {
    idx: oldEntry.idx,
    biome: oldEntry.biome,
    nameZh: oldEntry.nameZh,
    x: oldEntry.x,
    y: oldEntry.y,
    scale: oldEntry.scale,
    frameCount: gif.frames.length,
    base: { s: baseSet.b, sN: baseSet.n },
    deltas,
  };

  const out = `// 33 boss compact 数据 (pumpking 已恢复全帧动画)\nmodule.exports = ${JSON.stringify(compact)};\n`;
  fs.writeFileSync(COMPACT_FILE, out);

  const newSize = fs.statSync(COMPACT_FILE).size;
  console.log(`\n[done] bosses_compact.js: ${(newSize/1024).toFixed(1)} KB`);
}

main();
