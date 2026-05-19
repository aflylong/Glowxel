#!/usr/bin/env node
// ============================================================
// 从实验区 boss_*.json 恢复 3 个 boss 全部帧 (eye_of_cthulhu / moon_lord / the_twins)
//
// 输入: D:\project\Pokemon\terraria-clock-preview\terraria-sprites\boss_*.json
//        每帧 = [[x, y, r, g, b, a], ...] (已解码像素)
// 输出: 更新 uniapp/static/terraria/bosses_compact.js 里这 3 个 boss 的 entry
//        其他 30 个 boss 完全不动
//
// 处理:
//   1. 缩放到 64×64 屏幕坐标 (x/y 用当前 BOSS_PARAMS, scale=27/100)
//   2. 全部帧保留 (不限制帧数)
//   3. 用 base + delta(set+clear) 压缩
// ============================================================

const fs = require('fs');
const path = require('path');

const SRC_DIR = 'D:/project/Pokemon/terraria-clock-preview/terraria-sprites';
const COMPACT_FILE = path.resolve(__dirname, '../static/terraria/bosses_compact.js');

// 跟当前 build-boss-firmware.js 一致
const BOSS_PARAMS = {
  eye_of_cthulhu: { scale: 27, x: 53, y: 22 },
  moon_lord:      { scale: 49, x: 32, y: 26 },  // 实验区源 170×163, scale 补偿到 49 (旧 GIF 源 400×0.21 ≈ 84 屏宽)
  the_twins:      { scale: 25, x: 53, y: 32 },
};

const BOSS_FILE = {
  eye_of_cthulhu: 'boss_eye_of_cthulhu.json',
  moon_lord:      'boss_moon_lord.json',
  the_twins:      'boss_the_twins.json',
};

// ============ 渲染单帧到 64×64 ============

function renderFrameTo64(framePixels, frameSize, params) {
  // framePixels: [[x, y, r, g, b, a], ...] 是 frameSize 内的像素 (xy 局部坐标)
  // 输出: [{x, y, r, g, b}] 在 64×64 上的位置
  const [fw, fh] = frameSize;
  const scale = params.scale / 100;
  const centerX = params.x;
  const centerY = params.y;
  const bossCx = fw / 2;
  const bossCy = fh / 2;

  const screenMap = new Map();  // key=px*64+py, 后写覆盖前
  for (const px of framePixels) {
    const [x, y, r, g, b, a] = px;
    if (a < 5) continue;  // 透明像素跳过
    const sx = Math.round(centerX + (x - bossCx) * scale);
    const sy = Math.round(centerY + (y - bossCy) * scale);
    if (sx < 0 || sx >= 64 || sy < 0 || sy >= 64) continue;
    screenMap.set(sx * 64 + sy, { x: sx, y: sy, r, g, b });
  }
  return Array.from(screenMap.values());
}

// ============ 算 base + delta(set+clear) ============

function computeDelta(basePixels, framePixels) {
  const baseMap = new Map();
  for (const p of basePixels) baseMap.set(p.x * 64 + p.y, (p.r << 16) | (p.g << 8) | p.b);
  const set = [];
  const seen = new Set();
  for (const p of framePixels) {
    const k = p.x * 64 + p.y;
    seen.add(k);
    if (baseMap.get(k) !== ((p.r << 16) | (p.g << 8) | p.b)) set.push(p);
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

function buildBossEntry(slug, sourceJson, params, oldEntry) {
  const fc = sourceJson.frame_count;
  const fs2 = sourceJson.frame_size;
  console.log(`  [${slug}] 源帧数: ${fc}, frame_size: [${fs2[0]},${fs2[1]}]`);

  // 渲染所有帧到 64×64
  const allFrames = [];
  for (let f = 0; f < fc; f++) {
    const rendered = renderFrameTo64(sourceJson.frames[f], fs2, params);
    allFrames.push(rendered);
  }
  if (allFrames[0].length === 0) {
    console.warn(`  [${slug}] base 帧 0 像素, 跳过`);
    return oldEntry;
  }

  // base = 帧 0 全像素, delta[i] = (set, clear) 相对 base
  const basePixels = allFrames[0];
  const baseSet = packSet(basePixels);

  const deltas = [];
  let totalSet = 0, totalClear = 0;
  for (let f = 1; f < fc; f++) {
    const { set, clear } = computeDelta(basePixels, allFrames[f]);
    const setPacked = packSet(set);
    const clearPacked = packClear(clear);
    deltas.push({
      s: setPacked.b, sN: setPacked.n,
      c: clearPacked.b, cN: clearPacked.n,
    });
    totalSet += set.length;
    totalClear += clear.length;
  }

  console.log(`  [${slug}] base=${basePixels.length}px, ${fc-1} deltas (${totalSet} set + ${totalClear} clear)`);

  // 合并到 entry — 保留旧 entry 的 idx/biome/nameZh/x/y/scale
  return {
    idx: oldEntry.idx,
    biome: oldEntry.biome,
    nameZh: oldEntry.nameZh,
    x: oldEntry.x,
    y: oldEntry.y,
    scale: oldEntry.scale,
    frameCount: fc,
    base: { s: baseSet.b, sN: baseSet.n },
    deltas,
  };
}

function main() {
  console.log('[restore-3-bosses] 从实验区 boss_*.json 恢复 3 个 boss 全部帧');
  console.log('  COMPACT_FILE:', COMPACT_FILE);

  // 读当前 compact (不动其他 30 个 boss)
  const compact = require(COMPACT_FILE);

  for (const slug of Object.keys(BOSS_PARAMS)) {
    const srcFile = path.join(SRC_DIR, BOSS_FILE[slug]);
    if (!fs.existsSync(srcFile)) {
      console.warn(`  [skip] ${slug}: 实验区没有 ${BOSS_FILE[slug]}`);
      continue;
    }
    const sourceJson = require(srcFile);
    const oldEntry = compact[slug];
    if (!oldEntry) {
      console.warn(`  [skip] ${slug}: compact 里没有这个 entry`);
      continue;
    }
    compact[slug] = buildBossEntry(slug, sourceJson, BOSS_PARAMS[slug], oldEntry);
  }

  // 写回, 保留原文件结构
  const out = `// 33 boss compact 数据 (3 个 boss 已恢复全帧动画)\nmodule.exports = ${JSON.stringify(compact)};\n`;
  fs.writeFileSync(COMPACT_FILE, out);

  const newSize = fs.statSync(COMPACT_FILE).size;
  console.log(`\n[done] bosses_compact.js: ${(newSize/1024).toFixed(1)} KB`);
}

main();
