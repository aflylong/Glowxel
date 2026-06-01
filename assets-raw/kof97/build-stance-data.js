/**
 * 从 frames-out/<角色>/N.png 生成 stance 动画数据
 *
 * 设计:
 *   1. 直接缩到 TARGET_W × TARGET_H (终态压缩, 不保留全分辨率)
 *   2. 缩前剔粉色 + RGB 清零 (避免缩放采样污染)
 *   3. 缩后用 8 邻居补色 (清残粉)
 *   4. 各角色帧的"脚底中心"对齐到画布 (W/2, H-1)
 *   5. base = 帧 0, delta = 后续帧相对 base 的差异 (稀疏)
 *
 * 输出:
 *   website/src/utils/kof97Stances.js (ES module export)
 *   assets-raw/kof97/kof97Stances.global.js (window 全局, 给调试页用)
 *
 * 用法: node build-stance-data.js
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FRAMES_DIR = path.join(__dirname, 'frames-out');
const OUT = path.join(__dirname, '..', '..', 'website', 'src', 'utils', 'kof97Stances.js');

// 终态压缩尺寸 - 屏上实际显示就是这么大, 不留冗余
// 原图 60-110 宽 × 100-130 高, 之前 charScale=20% 时屏上约 22×26
const TARGET_W = 20;
const TARGET_H = 23;

const CHAR_KEYS = {
  kyo: 'kyo', iori: 'Iori', terry: 'Terry', andy: 'Andy',
  benimaru: 'Benimaru', mai: 'Mai', ryo: 'Ryo', goro: 'Goro',
  chang: 'chang', choi: 'Choi', shermie: 'Shermie',
  yashiro: 'Yashiro', chizuru: 'Chizuru',
  joe: 'Joe', yamazaki: 'Yamazaki', orochi: 'Orochi',
};

// ============================================================
// 粉色判定 - 多色心 + 距离阈值
// ============================================================
const PINK_CENTERS = [
  [0xff, 0x00, 0xff], [0xc8, 0x00, 0xc8], [0xb7, 0x00, 0xb7],
  [0xa7, 0x00, 0xa7], [0x70, 0x00, 0x70], [0x58, 0x00, 0x58],
  [0x4b, 0x00, 0x4b], [0xdc, 0x14, 0xae], [0xe8, 0x55, 0xae],
];

function isPink(r, g, b) {
  if (r < 50 || b < 50) return false;
  if (g >= r - 30) return false;
  if (g >= b - 30) return false;
  if (Math.abs(r - b) > 80) return false;
  return true;
}
function pinkDist(r, g, b) {
  let min = Infinity;
  for (const [pr, pg, pb] of PINK_CENTERS) {
    const d = Math.sqrt((r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2);
    if (d < min) min = d;
  }
  return min;
}
function isPinkCombined(r, g, b) {
  return isPink(r, g, b) || pinkDist(r, g, b) <= 40;
}

// ============================================================
// 读 PNG → RGBA buffer (粉色 → 透明), 同时算 bbox
// ============================================================
async function loadAndClean(filepath) {
  const img = sharp(filepath);
  const meta = await img.metadata();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const si = i * channels;
    const r = data[si], g = data[si + 1], b = data[si + 2];
    const a = channels === 4 ? data[si + 3] : 255;
    if (a === 0 || isPinkCombined(r, g, b)) {
      out[i * 4] = 0; out[i * 4 + 1] = 0; out[i * 4 + 2] = 0; out[i * 4 + 3] = 0;
    } else {
      out[i * 4] = r;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = b;
      out[i * 4 + 3] = 255;
    }
  }

  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = out[(y * width + x) * 4 + 3];
      if (a > 0) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { data: out, width, height, x0, y0, x1, y1 };
}

// ============================================================
// 把 bbox 内容缩放到 TARGET_W × TARGET_H, 保比例 + 脚底+水平居中
// 用 sharp nearest neighbor (像素感)
// ============================================================
async function scaleAndCenter(loaded) {
  const { data, width, height, x0, y0, x1, y1 } = loaded;
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;

  // 提取 bbox
  const cropBuf = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = ((y + y0) * width + (x + x0)) * 4;
      const di = (y * cw + x) * 4;
      cropBuf[di] = data[si];
      cropBuf[di + 1] = data[si + 1];
      cropBuf[di + 2] = data[si + 2];
      cropBuf[di + 3] = data[si + 3];
    }
  }

  // 缩放比例: 按等比保到 TARGET 内, 不超出
  const ratio = Math.min(TARGET_W / cw, TARGET_H / ch);
  const sw = Math.max(1, Math.floor(cw * ratio));
  const sh = Math.max(1, Math.floor(ch * ratio));

  const scaled = await sharp(cropBuf, { raw: { width: cw, height: ch, channels: 4 } })
    .resize(sw, sh, { kernel: 'nearest' })
    .raw()
    .toBuffer();

  // pad 到 TARGET_W × TARGET_H, 水平居中 + 底对齐 (脚踩 H-1 行)
  const out = Buffer.alloc(TARGET_W * TARGET_H * 4);
  const ox = Math.floor((TARGET_W - sw) / 2);
  const oy = TARGET_H - sh;
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const si = (y * sw + x) * 4;
      const di = ((y + oy) * TARGET_W + (x + ox)) * 4;
      out[di] = scaled[si];
      out[di + 1] = scaled[si + 1];
      out[di + 2] = scaled[si + 2];
      out[di + 3] = scaled[si + 3];
    }
  }
  return out;
}

// ============================================================
// 8 邻居补色 (粉色像素用周围非粉色平均值替换)
// ============================================================
function fillPinkWithNeighbors(buf, W, H) {
  let workBuf = buf;
  for (let pass = 0; pass < 2; pass++) {
    const out = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const r = workBuf[i * 4], g = workBuf[i * 4 + 1], b = workBuf[i * 4 + 2], a = workBuf[i * 4 + 3];
        if (a < 128 || !isPinkCombined(r, g, b)) {
          out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = a;
          continue;
        }
        let sR = 0, sG = 0, sB = 0, n = 0;
        for (let ddy = -1; ddy <= 1; ddy++) {
          for (let ddx = -1; ddx <= 1; ddx++) {
            if (ddx === 0 && ddy === 0) continue;
            const nx = x + ddx, ny = y + ddy;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            const ni = ny * W + nx;
            const nr = workBuf[ni * 4], ng = workBuf[ni * 4 + 1], nb = workBuf[ni * 4 + 2], na = workBuf[ni * 4 + 3];
            if (na < 128) continue;
            if (isPinkCombined(nr, ng, nb)) continue;
            sR += nr; sG += ng; sB += nb; n++;
          }
        }
        if (n > 0) {
          out[i * 4] = Math.round(sR / n);
          out[i * 4 + 1] = Math.round(sG / n);
          out[i * 4 + 2] = Math.round(sB / n);
          out[i * 4 + 3] = 255;
        } else {
          out[i * 4] = 0; out[i * 4 + 1] = 0; out[i * 4 + 2] = 0; out[i * 4 + 3] = 0;
        }
      }
    }
    workBuf = out;
  }
  return workBuf;
}

function bufToPixelArray(buf, W, H) {
  const arr = [];
  for (let i = 0; i < W * H; i++) {
    const r = buf[i * 4], g = buf[i * 4 + 1], b = buf[i * 4 + 2], a = buf[i * 4 + 3];
    if (a < 128) arr.push(null);
    else if (isPinkCombined(r, g, b)) arr.push(null);
    else arr.push('#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join(''));
  }
  return arr;
}

// ============================================================
// 主流程
// ============================================================
const result = {};

for (const [key, dirName] of Object.entries(CHAR_KEYS)) {
  const dir = path.join(FRAMES_DIR, dirName);
  if (!fs.existsSync(dir)) {
    console.log(`× 找不到 ${dirName}, 跳过`);
    continue;
  }
  const files = fs.readdirSync(dir).filter(f => /^\d+\.png$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
  if (files.length === 0) continue;

  // Step 1: 读所有帧 → 各自缩放后 pixel array
  const framesPx = [];
  for (const f of files) {
    const l = await loadAndClean(path.join(dir, f));
    if (!l) continue;
    let buf = await scaleAndCenter(l);
    buf = fillPinkWithNeighbors(buf, TARGET_W, TARGET_H);
    framesPx.push(bufToPixelArray(buf, TARGET_W, TARGET_H));
  }
  if (framesPx.length === 0) continue;

  // Step 2: base + delta
  const base = framesPx[0];
  const deltas = [];
  for (let i = 1; i < framesPx.length; i++) {
    const cur = framesPx[i];
    const delta = {};
    for (let j = 0; j < cur.length; j++) {
      if (cur[j] !== base[j]) delta[j] = cur[j];
    }
    deltas.push(delta);
  }

  result[key] = { w: TARGET_W, h: TARGET_H, base, deltas };
  const baseN = base.filter(p => p !== null).length;
  const deltaAvg = Math.round(deltas.reduce((s, d) => s + Object.keys(d).length, 0) / Math.max(1, deltas.length));
  const flashBytes = baseN * 5 + deltas.reduce((s, d) => s + Object.keys(d).filter(k => d[k] !== null).length, 0) * 5 + 16 * (1 + deltas.length);
  console.log(`✓ ${key.padEnd(10)} ${TARGET_W}×${TARGET_H}  base ${String(baseN).padStart(3)}px  delta×${deltas.length} 平均 ${deltaAvg}px  ≈ ${flashBytes} B`);
}

// 写文件
const out = `// 自动生成 - KOF '97 角色 stance 动画 (压缩到 ${TARGET_W}×${TARGET_H})
// 不要手编辑
export const KOF_STANCES = ${JSON.stringify(result)};
`;
fs.writeFileSync(OUT, out);
console.log(`\n写出 ${OUT}`);

const globalOut = path.join(__dirname, 'kof97Stances.global.js');
fs.writeFileSync(globalOut, `// 自动生成 - 给调试页 file:// 用 (普通 <script> 加载)
window.KOF_STANCES = ${JSON.stringify(result)};
`);
console.log(`写出 ${globalOut}`);

// 总占用
let total = 0;
for (const data of Object.values(result)) {
  const baseN = data.base.filter(p => p !== null).length;
  let deltaN = 0;
  for (const d of data.deltas) {
    for (const k in d) if (d[k] !== null) deltaN++;
  }
  total += (baseN + deltaN) * 5 + 16 * (1 + data.deltas.length);
}
console.log(`\n板载 PROGMEM 估算: ${total} 字节 = ${(total / 1024).toFixed(1)} KB`);
