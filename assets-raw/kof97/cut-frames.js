/**
 * 切割 raw/ 下能识别"整列纯黑分隔"的 sprite sheet
 * 规则:
 *   - 找所有"整列纯黑"的列
 *   - 去掉边界列 (x=0 / x=W-1)
 *   - 剩下应该 = frameCount - 1, 否则跳过
 * 输出: frames-out/<角色>/0.png ... 5.png (每帧带粉色背景, 后续再去背景)
 *
 * 用法: node cut-frames.js
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, 'raw');
const OUT_DIR = path.join(__dirname, 'frames-out');

function frameCount(name) {
  const n = name.toLowerCase();
  if (n.startsWith('orochi')) return 14;
  if (n.startsWith('goro')) return 5;
  return 6;
}

// 整列是否都是分隔色 (容差 25)
// 分隔色族: KOF97 sheet 上的分隔通常是 黑 + 中等深紫 + 浅紫
const SEP_COLORS = [
  [0, 0, 0],
  [0x4b, 0x00, 0x4b],   // 75,0,75
  [0x58, 0x00, 0x58],   // 88,0,88 (Joe)
  [0xa7, 0x00, 0xa7],   // 167,0,167 (Joe)
  [0xb4, 0x00, 0xb4],   // 180,0,180
];
function isSepCol(rawData, info, x, tol = 25) {
  const { width, height, channels } = info;
  // 允许列里 >= 90% 像素是分隔色 (有些角色像素会侵入分隔列)
  let sepCnt = 0, total = 0;
  for (let y = 0; y < height; y++) {
    const i = (y * width + x) * channels;
    const r = rawData[i], g = rawData[i + 1], b = rawData[i + 2];
    const a = channels === 4 ? rawData[i + 3] : 255;
    if (a === 0) return false;
    total++;
    const matched = SEP_COLORS.some(c => Math.abs(r - c[0]) <= tol && Math.abs(g - c[1]) <= tol && Math.abs(b - c[2]) <= tol);
    if (matched) sepCnt++;
  }
  return total > 0 && sepCnt / total >= 0.9;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.png')).sort();

console.log('=== 自动切割 (仅纯黑分隔) ===\n');
const succ = [], fail = [];

for (const f of files) {
  const name = f.replace(/\.png$/i, '');
  const filepath = path.join(RAW_DIR, f);
  const img = sharp(filepath);
  const meta = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const totalW = meta.width;
  const frames = frameCount(f);

  // 找全部分隔列 (按规则可能是黑 / #480048 / #b700b7 等)
  let sepCols = [];
  for (let x = 0; x < totalW; x++) {
    if (isSepCol(data, info, x)) sepCols.push(x);
  }

  // 合并相邻列成"段" (每段 = 1 条分隔), 取段中点
  const merged = [];
  if (sepCols.length > 0) {
    let s = sepCols[0], e = sepCols[0];
    for (let i = 1; i < sepCols.length; i++) {
      if (sepCols[i] === e + 1) e = sepCols[i];
      else { merged.push(Math.round((s + e) / 2)); s = e = sepCols[i]; }
    }
    merged.push(Math.round((s + e) / 2));
  }
  // merged = 每条分隔的中点 x

  let blackCols = merged;

  // 剥掉左右边框
  if (blackCols[0] === 0) blackCols.shift();
  if (blackCols[blackCols.length - 1] === totalW - 1) blackCols.pop();

  // 重新算 sepCols 段, 用于切帧时跳过整段
  const sepSegs = [];
  if (sepCols.length > 0) {
    let s = sepCols[0], e = sepCols[0];
    for (let i = 1; i < sepCols.length; i++) {
      if (sepCols[i] === e + 1) e = sepCols[i];
      else { sepSegs.push([s, e]); s = e = sepCols[i]; }
    }
    sepSegs.push([s, e]);
  }
  // 剥掉左右边界段
  let usableSegs = sepSegs.slice();
  if (usableSegs.length > 0 && usableSegs[0][0] === 0) usableSegs.shift();
  if (usableSegs.length > 0 && usableSegs[usableSegs.length - 1][1] === totalW - 1) usableSegs.pop();

  if (usableSegs.length !== frames - 1) {
    console.log(`✗ ${f.padEnd(16)} 内部分隔段 ${usableSegs.length} != ${frames - 1}, 跳过 (段: ${usableSegs.map(s => `[${s[0]}..${s[1]}]`).join(',')})`);
    fail.push({ file: f, reason: `usableSegs=${usableSegs.length}, expected=${frames - 1}` });
    continue;
  }

  // 帧 box: 跳过每个分隔段
  let leftBound = (sepSegs.length > 0 && sepSegs[0][0] === 0) ? sepSegs[0][1] + 1 : 0;
  let rightBound = (sepSegs.length > 0 && sepSegs[sepSegs.length - 1][1] === totalW - 1) ? sepSegs[sepSegs.length - 1][0] - 1 : totalW - 1;
  const boxes = [];
  let prev = leftBound;
  for (const [s, e] of usableSegs) {
    boxes.push([prev, s - 1]);
    prev = e + 1;
  }
  boxes.push([prev, rightBound]);

  const outDir = path.join(OUT_DIR, name);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (let i = 0; i < boxes.length; i++) {
    const [x0, x1] = boxes[i];
    const w = x1 - x0 + 1;
    await sharp(filepath)
      .extract({ left: x0, top: 0, width: w, height: meta.height })
      .toFile(path.join(outDir, `${i}.png`));
  }

  console.log(`✓ ${f.padEnd(16)} ${boxes.length} 帧, x=${boxes.map(([a, b]) => `${a}..${b}`).join(',')}`);
  succ.push(f);
}

console.log(`\n=== 总结: 成功 ${succ.length} / 失败 ${fail.length} ===`);
if (fail.length > 0) {
  console.log('失败列表 (需手动处理):');
  for (const { file, reason } of fail) console.log(`  ${file}: ${reason}`);
}
