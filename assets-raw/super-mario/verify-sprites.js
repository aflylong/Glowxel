/**
 * 把 superMarioSprites.js 里的所有 sprite 重画回 PNG 拼成 16x 放大预览图
 * 验证转换正确性
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const SPRITES_FILE = path.join(__dirname, '..', '..', 'website', 'src', 'utils', 'superMarioSprites.js');

// 读 SPRITES (转 JSON 再 parse)
const code = fs.readFileSync(SPRITES_FILE, 'utf-8');
const match = code.match(/export const SPRITES = ({[\s\S]+});/);
if (!match) throw new Error('找不到 SPRITES export');
const SPRITES = JSON.parse(match[1]);

const SCALE = 8;
const COLS = 8;
const PAD = 8;
const CELL_W = 16 * SCALE + PAD * 2;
const CELL_H = 32 * SCALE + PAD * 2 + 18; // 留 label

const keys = Object.keys(SPRITES);
const totalRows = Math.ceil(keys.length / COLS);
const canvasW = COLS * CELL_W + 16;
const canvasH = totalRows * CELL_H + 16;

// 把每个 sprite 转 PNG buffer
const composites = [];
for (let i = 0; i < keys.length; i++) {
  const key = keys[i];
  const sp = SPRITES[key];

  // 把 p[] 转成 RGBA buffer (sp.w × sp.h)
  const buf = Buffer.alloc(sp.w * sp.h * 4);
  for (let y = 0; y < sp.h; y++) {
    for (let x = 0; x < sp.w; x++) {
      const c = sp.p[y * sp.w + x];
      const offset = (y * sp.w + x) * 4;
      if (c === null) {
        buf[offset] = 60;
        buf[offset + 1] = 60;
        buf[offset + 2] = 60;
        buf[offset + 3] = 255; // 灰底显示透明
      } else {
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        buf[offset] = r;
        buf[offset + 1] = g;
        buf[offset + 2] = b;
        buf[offset + 3] = 255;
      }
    }
  }

  const upscaled = await sharp(buf, { raw: { width: sp.w, height: sp.h, channels: 4 } })
    .resize(sp.w * SCALE, sp.h * SCALE, { kernel: 'nearest' })
    .png()
    .toBuffer();

  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const left = 8 + c * CELL_W + Math.floor((CELL_W - sp.w * SCALE) / 2);
  const top = 8 + r * CELL_H + Math.floor((CELL_H - 18 - sp.h * SCALE) / 2);
  composites.push({ input: upscaled, left, top });
}

await sharp({
  create: {
    width: canvasW,
    height: canvasH,
    channels: 4,
    background: { r: 30, g: 30, b: 30, alpha: 1 },
  },
})
  .composite(composites)
  .png()
  .toFile(path.join(__dirname, 'verify-overview.png'));

console.log(`✓ verify-overview.png (${canvasW}×${canvasH}, ${keys.length} 个 sprite)`);
console.log('  所有 sprite 已 8x 放大 + 透明区域用灰色显示');
