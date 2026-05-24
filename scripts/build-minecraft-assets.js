/**
 * 把用户放�?uniapp/static/minecraft/ 下的两张 PNG 解码�?
 * 输出 uniapp/utils/minecraftAssets.js（Steve 像素数据 + 草地背景行像素）
 *
 * 输入�?
 *   - uniapp/static/minecraft/Steve_JE5.png       (480×1080 16-bit RGBA, 侧面 Steve)
 *   - uniapp/static/minecraft/ScreenShot_2026-05-21_191233_636.png  (1635×452, 草地背景)
 *
 * 输出�?
 *   - uniapp/utils/minecraftAssets.js
 *
 * 执行：node scripts/build-minecraft-assets.js
 */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// ========== 自写 PNG 解码（避免外部依赖） ==========
function decodePng(buffer) {
  if (buffer[0] !== 0x89 || buffer.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('Not a PNG');
  }
  let off = 8;
  let ihdr = null;
  const idatChunks = [];
  let plte = null;
  let trns = null;
  while (off < buffer.length) {
    const len = buffer.readUInt32BE(off);
    const type = buffer.toString('ascii', off + 4, off + 8);
    const data = buffer.slice(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      ihdr = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        interlace: data[12],
      };
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'PLTE') {
      plte = data;
    } else if (type === 'tRNS') {
      trns = data;
    } else if (type === 'IEND') {
      break;
    }
    off += 8 + len + 4;
  }
  if (!ihdr) throw new Error('No IHDR');

  const raw = zlib.inflateSync(Buffer.concat(idatChunks));

  const { width, height, bitDepth, colorType } = ihdr;
  // channels per pixel
  const channelMap = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
  const channels = channelMap[colorType];
  if (!channels) throw new Error('Unsupported colorType: ' + colorType);
  const bytesPerSample = bitDepth === 16 ? 2 : 1;
  if (bitDepth !== 1 && bitDepth !== 2 && bitDepth !== 4 && bitDepth !== 8 && bitDepth !== 16) {
    throw new Error('Only bitDepth 1/2/4/8/16 supported, got ' + bitDepth);
  }
  // colorType 3 (palette indexed) �?PLTE+tRNS；其它情况用 channels
  const isPalette = colorType === 3;
  const channelsPerPixel = isPalette ? 1 : channels;
  // 每像素位数（仅对 colorType 0/3 < 8 时打包）
  const bitsPerPixel = bitDepth * channelsPerPixel;
  const stride = Math.ceil(width * bitsPerPixel / 8);
  const bytesPerPixel = Math.max(1, Math.ceil(bitsPerPixel / 8));

  // unfilter
  const out = Buffer.alloc(height * stride);
  let inOff = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[inOff++];
    const rowStart = y * stride;
    for (let x = 0; x < stride; x++) {
      const left = x >= bytesPerPixel ? out[rowStart + x - bytesPerPixel] : 0;
      const up = y > 0 ? out[rowStart - stride + x] : 0;
      const upLeft = (y > 0 && x >= bytesPerPixel) ? out[rowStart - stride + x - bytesPerPixel] : 0;
      let recon = 0;
      const cur = raw[inOff++];
      switch (filterType) {
        case 0: recon = cur; break;
        case 1: recon = (cur + left) & 0xff; break;
        case 2: recon = (cur + up) & 0xff; break;
        case 3: recon = (cur + ((left + up) >> 1)) & 0xff; break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          let pred;
          if (pa <= pb && pa <= pc) pred = left;
          else if (pb <= pc) pred = up;
          else pred = upLeft;
          recon = (cur + pred) & 0xff;
          break;
        }
        default: throw new Error('Bad filter ' + filterType);
      }
      out[rowStart + x] = recon;
    }
  }

  // Convert to RGBA8 array
  const rgba = new Uint8Array(width * height * 4);

  // 调色板（colorType 3）准�?
  let palette = null;
  let paletteAlpha = null;
  if (isPalette) {
    if (!plte) throw new Error('PLTE missing for colorType 3');
    palette = plte;
    paletteAlpha = trns;
  }

  // 解打包像素：返回索引�?line �?取第 i 个像素�?
  function getPackedPixel(line, i) {
    if (bitDepth >= 8) {
      // 不打包：每像�?bytesPerPixel 字节
      return null; // 由调用方按通常路径
    }
    // bitDepth=1/2/4：MSB 优先
    const pixelsPerByte = 8 / bitDepth;
    const byteIdx = Math.floor(i / pixelsPerByte);
    const inByteIdx = i % pixelsPerByte;
    const shift = (pixelsPerByte - 1 - inByteIdx) * bitDepth;
    const mask = (1 << bitDepth) - 1;
    return (line[byteIdx] >> shift) & mask;
  }

  for (let y = 0; y < height; y++) {
    const rowStart = y * stride;
    for (let x = 0; x < width; x++) {
      let r, g, b, a;
      if (isPalette) {
        let idx;
        if (bitDepth >= 8) {
          idx = out[rowStart + x];
        } else {
          idx = getPackedPixel(out.subarray(rowStart, rowStart + stride), x);
        }
        r = palette[idx * 3];
        g = palette[idx * 3 + 1];
        b = palette[idx * 3 + 2];
        a = paletteAlpha && idx < paletteAlpha.length ? paletteAlpha[idx] : 255;
      } else if (colorType === 6) { // RGBA
        const srcOff = rowStart + x * bytesPerPixel;
        if (bitDepth === 16) {
          r = out[srcOff]; g = out[srcOff + 2]; b = out[srcOff + 4]; a = out[srcOff + 6];
        } else {
          r = out[srcOff]; g = out[srcOff + 1]; b = out[srcOff + 2]; a = out[srcOff + 3];
        }
      } else if (colorType === 2) { // RGB
        const srcOff = rowStart + x * bytesPerPixel;
        if (bitDepth === 16) {
          r = out[srcOff]; g = out[srcOff + 2]; b = out[srcOff + 4];
        } else {
          r = out[srcOff]; g = out[srcOff + 1]; b = out[srcOff + 2];
        }
        a = 255;
      } else if (colorType === 4) { // grayscale + alpha
        const srcOff = rowStart + x * bytesPerPixel;
        const gray = bitDepth === 16 ? out[srcOff] : out[srcOff];
        a = bitDepth === 16 ? out[srcOff + 2] : out[srcOff + 1];
        r = g = b = gray;
      } else if (colorType === 0) { // grayscale
        let gray;
        if (bitDepth >= 8) {
          gray = out[rowStart + x * bytesPerPixel];
        } else {
          const idx = getPackedPixel(out.subarray(rowStart, rowStart + stride), x);
          gray = Math.round(idx * 255 / ((1 << bitDepth) - 1));
        }
        r = g = b = gray; a = 255;
      } else {
        throw new Error('colorType ' + colorType + ' not implemented');
      }
      const dstOff = (y * width + x) * 4;
      rgba[dstOff] = r;
      rgba[dstOff + 1] = g;
      rgba[dstOff + 2] = b;
      rgba[dstOff + 3] = a;
    }
  }
  return { width, height, rgba };
}

// ========== 工具：area-average 缩小�?(dstW, dstH)，alpha 加权 ==========
function resizeAreaAvg(src, srcW, srcH, dstW, dstH) {
  const out = new Uint8Array(dstW * dstH * 4);
  for (let dy = 0; dy < dstH; dy++) {
    const sy0 = (dy * srcH) / dstH;
    const sy1 = ((dy + 1) * srcH) / dstH;
    const iy0 = Math.floor(sy0);
    const iy1 = Math.min(srcH, Math.ceil(sy1));
    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = (dx * srcW) / dstW;
      const sx1 = ((dx + 1) * srcW) / dstW;
      const ix0 = Math.floor(sx0);
      const ix1 = Math.min(srcW, Math.ceil(sx1));
      let r = 0, g = 0, b = 0, a = 0, w = 0;
      for (let yy = iy0; yy < iy1; yy++) {
        for (let xx = ix0; xx < ix1; xx++) {
          const o = (yy * srcW + xx) * 4;
          const aa = src[o + 3] / 255;
          r += src[o] * aa;
          g += src[o + 1] * aa;
          b += src[o + 2] * aa;
          a += src[o + 3];
          w += aa;
        }
      }
      const dstOff = (dy * dstW + dx) * 4;
      if (w > 0.01) {
        out[dstOff]     = Math.round(r / w);
        out[dstOff + 1] = Math.round(g / w);
        out[dstOff + 2] = Math.round(b / w);
        out[dstOff + 3] = Math.round(a / ((iy1 - iy0) * (ix1 - ix0)));
      } else {
        out[dstOff] = 0; out[dstOff + 1] = 0; out[dstOff + 2] = 0; out[dstOff + 3] = 0;
      }
    }
  }
  return out;
}

// ========== 找出非透明 bounding box ==========
function findContentBox(rgba, w, h, alphaThreshold = 16) {
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = rgba[(y * w + x) * 4 + 3];
      if (a > alphaThreshold) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function cropRgba(rgba, w, h, box) {
  const out = new Uint8Array(box.w * box.h * 4);
  for (let y = 0; y < box.h; y++) {
    for (let x = 0; x < box.w; x++) {
      const so = ((y + box.y0) * w + (x + box.x0)) * 4;
      const dox = (y * box.w + x) * 4;
      out[dox] = rgba[so];
      out[dox + 1] = rgba[so + 1];
      out[dox + 2] = rgba[so + 2];
      out[dox + 3] = rgba[so + 3];
    }
  }
  return out;
}

// ========== RGBA 数组 -> 像素颜色字符串数组（一行一个，null 表示透明�?==========
function rgbaToPixelArray(rgba, w, h, alphaThreshold = 64) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      const a = rgba[o + 3];
      if (a < alphaThreshold) {
        row.push(null);
      } else {
        const r = rgba[o], g = rgba[o + 1], b = rgba[o + 2];
        row.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
      }
    }
    rows.push(row);
  }
  return rows;
}

// 染色 ASCII 预览�? �?@ �?. �?* 其他�?
function colorizedPreview(rows, w, h) {
  const lines = [];
  for (let y = 0; y < h; y++) {
    let line = '';
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      if (c === null) { line += ' '; continue; }
      const r = parseInt(c.slice(1, 3), 16), g = parseInt(c.slice(3, 5), 16), b = parseInt(c.slice(5, 7), 16);
      if (g > r && g > b) line += '#';
      else if (r > g && r > b && g < 150) line += '@';
      else if (b > g && b > r) line += '.';
      else line += '*';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

// ========== 主流�?==========
const STATIC_DIR = path.join(__dirname, '..', 'uniapp', 'static', 'minecraft');
const OUT_FILE = path.join(__dirname, '..', 'uniapp', 'utils', 'minecraftAssets.js');

// 1. 处理 Steve 正面 - 从官�?64×64 默认皮肤模板提取
//    官方坐标 (Y 向下)�?
//      头正�? (8,8) ~ (15,15)        8×8
//      头发覆盖�?第二�?: (40,8) ~ (47,15)
//      身体正面: (20,20) ~ (27,31)    8×12
//      右臂正面: (44,20) ~ (47,31)    4×12  (用作右臂)
//      右腿正面: (4,20) ~ (7,31)      4×12  (用作右腿)
//    左臂/左腿镜像右臂/右腿（默�?Steve 皮肤左右对称�?
//    输出最�?16×20 正面像素（从 64×64 取出后，把头压成 6 高，�?腿压�?14 高）
const skinBuf = fs.readFileSync(path.join(STATIC_DIR, '_steve_skin_64x64.png'));
const skinPng = decodePng(skinBuf);
console.log(`[Skin] decoded ${skinPng.width}×${skinPng.height}`);

function copyRegion(srcRgba, srcW, sx, sy, w, h) {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const so = ((sy + y) * srcW + (sx + x)) * 4;
      const dst = (y * w + x) * 4;
      out[dst]   = srcRgba[so];
      out[dst+1] = srcRgba[so+1];
      out[dst+2] = srcRgba[so+2];
      out[dst+3] = srcRgba[so+3];
    }
  }
  return out;
}

function blitInto(canvas, canvasW, dst, srcRgba, srcW, srcH, mirrorX = false) {
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const sx = mirrorX ? (srcW - 1 - x) : x;
      const so = (y * srcW + sx) * 4;
      const a = srcRgba[so + 3];
      if (a < 16) continue; // 透明
      const px = dst.x + x;
      const py = dst.y + y;
      const dstOff = (py * canvasW + px) * 4;
      canvas[dstOff]     = srcRgba[so];
      canvas[dstOff + 1] = srcRgba[so + 1];
      canvas[dstOff + 2] = srcRgba[so + 2];
      canvas[dstOff + 3] = 255;
    }
  }
}

// 取各部件
// 默认皮肤布局，正�?+ 背面坐标
//   头正�? (8,8)   头背�? (24,8)
//   身正�? (20,20) 身背�? (32,20)
//   右臂正面: (44,20) 右臂背面: (52,20)
//   右腿正面: (4,20)  右腿背面: (12,20)
// 正面部件
const headFront     = copyRegion(skinPng.rgba, skinPng.width, 8, 8, 8, 8);
const headFrontL2   = copyRegion(skinPng.rgba, skinPng.width, 40, 8, 8, 8);
const bodyFront     = copyRegion(skinPng.rgba, skinPng.width, 20, 20, 8, 12);
const armRFront     = copyRegion(skinPng.rgba, skinPng.width, 44, 20, 4, 12);
const legRFront     = copyRegion(skinPng.rgba, skinPng.width, 4, 20, 4, 12);

// 背面部件（用于砸/搭时�?
const headBack      = copyRegion(skinPng.rgba, skinPng.width, 24, 8, 8, 8);
const headBackL2    = copyRegion(skinPng.rgba, skinPng.width, 56, 8, 8, 8);
const bodyBack      = copyRegion(skinPng.rgba, skinPng.width, 32, 20, 8, 12);
const armRBack      = copyRegion(skinPng.rgba, skinPng.width, 52, 20, 4, 12);
const legRBack      = copyRegion(skinPng.rgba, skinPng.width, 12, 20, 4, 12);

// 兼容老代码引�?
const headBase   = headBack;
const headLayer2 = headBackL2;
const body       = bodyBack;
const armR       = armRBack;
const legR       = legRBack;

// 侧面（右侧）部件 - 用于走路时朝向移动方�?
//   头侧面取中间 4 列（皮肤�?8×8，向中线�?4 列），保持全�?4 宽一�?
const headRight   = copyRegion(skinPng.rgba, skinPng.width, 2, 8, 4, 8);  // (2,8) 取中�?4 �?
const headRight2  = copyRegion(skinPng.rgba, skinPng.width, 34, 8, 4, 8); // 第二层中�?4 �?
const bodyRight   = copyRegion(skinPng.rgba, skinPng.width, 16, 20, 4, 12);
const armRSide    = copyRegion(skinPng.rgba, skinPng.width, 40, 20, 4, 12);
const legRSide    = copyRegion(skinPng.rgba, skinPng.width, 0, 20, 4, 12);

// �?无右臂的身体"�?16×32 画布（右臂作为独立可挥动 sprite 单出�?
// 布局：列 0~3 左臂 / �?4~11 �?身体 / �?12~15 留给右臂渲染时贴
// �?0~7 �?/ �?8~19 身躯+�?/ �?20~31 双腿
const FULL_W = 16, FULL_H = 32;

// 工具：拼一个完�?16×32 sprite
//   includeRightArm=true: 双臂都贴齐（idle 静态用�?
//   includeRightArm=false: 留空右臂区域（背面挥动用，由 drawSteveWorkArm 独立画）
function buildFullSprite(headA, headB, bodyP, armRPart, legRPart, includeRightArm) {
  const canvas = new Uint8Array(FULL_W * FULL_H * 4);
  blitInto(canvas, FULL_W, { x: 4, y: 0 }, headA, 8, 8);
  blitInto(canvas, FULL_W, { x: 4, y: 0 }, headB, 8, 8);
  blitInto(canvas, FULL_W, { x: 4, y: 8 }, bodyP, 8, 12);
  blitInto(canvas, FULL_W, { x: 0, y: 8 }, armRPart, 4, 12, true); // 左臂 = 镜像右臂
  if (includeRightArm) {
    blitInto(canvas, FULL_W, { x: 12, y: 8 }, armRPart, 4, 12, false); // 右臂
  }
  blitInto(canvas, FULL_W, { x: 8, y: 20 }, legRPart, 4, 12);
  blitInto(canvas, FULL_W, { x: 4, y: 20 }, legRPart, 4, 12, true);
  return canvas;
}

// 背面（挥动版，无右臂留空�?
const backCanvas = buildFullSprite(headBack, headBackL2, bodyBack, armRBack, legRBack, false);
// 正面（静态版，双臂齐全）
const frontCanvas = buildFullSprite(headFront, headFrontL2, bodyFront, armRFront, legRFront, true);

const stevePixels = rgbaToPixelArray(backCanvas, FULL_W, FULL_H, 96);
const armPixels = rgbaToPixelArray(armRBack, 4, 12, 96);
const steveFrontPixels = rgbaToPixelArray(frontCanvas, FULL_W, FULL_H, 96);
const armFrontPixels = rgbaToPixelArray(armRFront, 4, 12, 96);

// 侧面 Steve 拼图：宽 8 (�?�?腿宽 4，臂叠在身体�?，高 32
// 布局：列 0~3 �?�?�?+ �?4~7 同列叠加（侧�?= �?8×8 占满 8 宽）
// 实际上侧面应该是 8 宽（�?8×8），身体侧面�?4 宽，臂在身体侧面贴一�?
//   方案：侧面画�?8×32�?
//     �?0~7   头侧�?8×8（占�?8 列）
//     �?8~19  身体侧面 4 �?+ 臂侧�?4 宽合�?= 整体 8 列（其中只有部分非空�?
//              用：身体在列 2~5，臂叠在 2~5（在前面的臂会盖住身体）
//     �?20~31 腿侧�?4 宽，居中�?2~5
// 侧面 Steve 拼图�? �?× 32 �?- �?�?�?臂统一 4 �?
const SIDE_W = 4, SIDE_H = 32;
const sideCanvas = new Uint8Array(SIDE_W * SIDE_H * 4);
// 头侧面（4×8�?
blitInto(sideCanvas, SIDE_W, { x: 0, y: 0 }, headRight, 4, 8);
blitInto(sideCanvas, SIDE_W, { x: 0, y: 0 }, headRight2, 4, 8); // 头第二层
// 身体侧面�?×12�?
blitInto(sideCanvas, SIDE_W, { x: 0, y: 8 }, bodyRight, 4, 12);
// 臂侧面（4×12）覆盖在身体上（前臂遮身�?
blitInto(sideCanvas, SIDE_W, { x: 0, y: 8 }, armRSide, 4, 12);
// 腿侧面（4×12�?
blitInto(sideCanvas, SIDE_W, { x: 0, y: 20 }, legRSide, 4, 12);

const steveSidePixels = rgbaToPixelArray(sideCanvas, SIDE_W, SIDE_H, 96);

// =========================================================================
// 侧身挥砸动画�? �?12×32 sprite（侧身朝右版本，朝左�?mirrorX 渲染�?
//   左侧 4 �?= Steve 侧身身体（头/�?腿）
//   右侧 8 �?= 手臂+镐子伸出区域
// =========================================================================

// 工具：hex �?rgba
function hexToRgbaHere(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255,
  ];
}

const SWING_SIDE_W = 12, SWING_SIDE_H = 32;

// 在侧身画布画身体（头/�?腿，不含臂）
function drawSideBody(canvas, w, anchorX) {
  // �?4×8 �?(anchorX, 0)
  for (let sy = 0; sy < 8; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = headRight[so + 3];
      if (a >= 16) {
        setCanvasPixel(canvas, w, anchorX + sx, sy, [headRight[so], headRight[so+1], headRight[so+2], 255]);
      }
      const so2 = (sy * 4 + sx) * 4;
      const a2 = headRight2[so2 + 3];
      if (a2 >= 16) {
        setCanvasPixel(canvas, w, anchorX + sx, sy, [headRight2[so2], headRight2[so2+1], headRight2[so2+2], 255]);
      }
    }
  }
  // 身体 4×12 �?(anchorX, 8)
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = bodyRight[so + 3];
      if (a >= 16) {
        setCanvasPixel(canvas, w, anchorX + sx, 8 + sy, [bodyRight[so], bodyRight[so+1], bodyRight[so+2], 255]);
      }
    }
  }
  // �?4×12 �?(anchorX, 20)
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = legRSide[so + 3];
      if (a >= 16) {
        setCanvasPixel(canvas, w, anchorX + sx, 20 + sy, [legRSide[so], legRSide[so+1], legRSide[so+2], 255]);
      }
    }
  }
}

// �?0：手臂高举（手腕在头顶上方）
function buildSideSwing_0() {
  const cv = new Uint8Array(SWING_SIDE_W * SWING_SIDE_H * 4);
  drawSideBody(cv, SWING_SIDE_W, 0);
  // 镐子 5×7 竖直，柄底在 y=8（肩高），头�?y=2（头顶上方）
  const head = hexToRgbaHere('#dbdbdb');
  const headDark = hexToRgbaHere('#494949');
  const handle = hexToRgbaHere('#5a3818');
  const handleDark = hexToRgbaHere('#3a2810');
  const cx = 6;
  const topY = 2;
  // 镐头朝上
  setCanvasPixel(cv, SWING_SIDE_W, cx - 1, topY, head);
  setCanvasPixel(cv, SWING_SIDE_W, cx,     topY, head);
  setCanvasPixel(cv, SWING_SIDE_W, cx + 1, topY, head);
  setCanvasPixel(cv, SWING_SIDE_W, cx - 2, topY + 1, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, cx - 1, topY + 1, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, cx,     topY + 1, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, cx + 1, topY + 1, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, cx + 2, topY + 1, headDark);
  // �?
  for (let i = 0; i < 5; i++) {
    setCanvasPixel(cv, SWING_SIDE_W, cx, topY + 2 + i, i === 2 ? handleDark : handle);
  }
  // 手臂垂直向上：sy=0 是手腕（皮肤色），sy=11 是肩（袖子色�?
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const srcSy = 11 - sy; // 翻转
      const so = (srcSy * 4 + sx) * 4;
      const a = armRSide[so + 3];
      if (a < 16) continue;
      const c = [armRSide[so], armRSide[so+1], armRSide[so+2], 255];
      // 贴到 x=4..7（紧贴身体右侧），y=-3..8 �?截断
      const dy = sy - 3;
      if (dy < 0) continue;
      setCanvasPixel(cv, SWING_SIDE_W, 4 + sx, dy, c);
    }
  }
  return cv;
}

// �?1：手臂水平前伸（手腕在身�?8 像素处）
function buildSideSwing_1() {
  const cv = new Uint8Array(SWING_SIDE_W * SWING_SIDE_H * 4);
  drawSideBody(cv, SWING_SIDE_W, 0);
  // 镐子在身前最远端，镐头朝前（横向�?
  // 简化：直接画一个水平镐�?7×3，柄从手腕往身体方向延伸
  const head = hexToRgbaHere('#dbdbdb');
  const headDark = hexToRgbaHere('#494949');
  const handle = hexToRgbaHere('#5a3818');
  // 水平镐子右端是镐头，左端是柄根（接近手腕�?
  // 镐头位置：x=10~11，y=8~10
  setCanvasPixel(cv, SWING_SIDE_W, 11, 8, head);
  setCanvasPixel(cv, SWING_SIDE_W, 10, 8, head);
  setCanvasPixel(cv, SWING_SIDE_W, 11, 9, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, 10, 9, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, 11, 10, head);
  setCanvasPixel(cv, SWING_SIDE_W, 10, 10, head);
  // 柄横向从 x=4 �?x=10
  for (let x = 4; x < 10; x++) {
    setCanvasPixel(cv, SWING_SIDE_W, x, 9, handle);
  }
  // 手臂水平：肩�?(4, 8)，手腕在 (8, 8) �?用源数据转置
  // �?(sx, sy) 4×12 �?屏幕 (sy, 3-sx) �?12 �?4 �?
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = armRSide[so + 3];
      if (a < 16) continue;
      const c = [armRSide[so], armRSide[so+1], armRSide[so+2], 255];
      // �?sy=0 落在屏幕 x=4，手�?sy=11 落在 x=15（截�?11�?
      const dx = 4 + sy;
      const dy = 7 + (3 - sx); // �?sx=2 中线落在 y=8（肩高）
      setCanvasPixel(cv, SWING_SIDE_W, dx, dy, c);
    }
  }
  return cv;
}

// �?2：手臂砸到底（手腕在腰下�?
function buildSideSwing_2() {
  const cv = new Uint8Array(SWING_SIDE_W * SWING_SIDE_H * 4);
  drawSideBody(cv, SWING_SIDE_W, 0);
  // 镐子在身体右下方，镐头朝�?
  // 简化镐子：5 �?7 高，柄底�?y=24（腰下方），头在 y=18
  // 但镐头朝下时方向变了，用倒置�?
  const head = hexToRgbaHere('#dbdbdb');
  const headDark = hexToRgbaHere('#494949');
  const handle = hexToRgbaHere('#5a3818');
  const cx = 7;
  const headBottomY = 24;
  // 镐头朝下（倒置�?
  setCanvasPixel(cv, SWING_SIDE_W, cx - 1, headBottomY, head);
  setCanvasPixel(cv, SWING_SIDE_W, cx,     headBottomY, head);
  setCanvasPixel(cv, SWING_SIDE_W, cx + 1, headBottomY, head);
  setCanvasPixel(cv, SWING_SIDE_W, cx - 2, headBottomY - 1, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, cx - 1, headBottomY - 1, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, cx,     headBottomY - 1, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, cx + 1, headBottomY - 1, headDark);
  setCanvasPixel(cv, SWING_SIDE_W, cx + 2, headBottomY - 1, headDark);
  // 柄向上延伸到手腕高度
  for (let i = 2; i < 7; i++) {
    setCanvasPixel(cv, SWING_SIDE_W, cx, headBottomY - i, i === 4 ? hexToRgbaHere('#3a2810') : handle);
  }
  // 手臂垂直向下：肩�?y=8，手腕在 y=19
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = armRSide[so + 3];
      if (a < 16) continue;
      const c = [armRSide[so], armRSide[so+1], armRSide[so+2], 255];
      setCanvasPixel(cv, SWING_SIDE_W, 4 + sx, 8 + sy, c);
    }
  }
  return cv;
}

const sideSwingFramesRaw = [
  buildSideSwing_0(),
  buildSideSwing_1(),
  buildSideSwing_2(),
];
const sideSwingFrames = sideSwingFramesRaw.map(cv =>
  rgbaToPixelArray(cv, SWING_SIDE_W, SWING_SIDE_H, 96)
);

// debug 持镐/持方块用：侧身 + 水平手臂（不画镐子，让渲染层自己贴）
function buildSideHoldFrame() {
  const cv = new Uint8Array(SWING_SIDE_W * SWING_SIDE_H * 4);
  drawSideBody(cv, SWING_SIDE_W, 0);
  // 手臂水平前伸：肩 (4, 8)，手腕末端 (11, 8)
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = armRSide[so + 3];
      if (a < 16) continue;
      const c = [armRSide[so], armRSide[so+1], armRSide[so+2], 255];
      const dx = 4 + sy;
      const dy = 7 + (3 - sx);
      setCanvasPixel(cv, SWING_SIDE_W, dx, dy, c);
    }
  }
  return cv;
}
const sideHoldFrame = rgbaToPixelArray(buildSideHoldFrame(), SWING_SIDE_W, SWING_SIDE_H, 96);
// 手部位置（手腕末端 sprite 内坐标，用于贴镐子/方块）
const SIDE_HOLD_HAND_X = 11;
const SIDE_HOLD_HAND_Y = 9; // 手腕中线

console.log('[Steve] 侧身挥砸 3 �?(12×32):');
sideSwingFrames.forEach((f, i) => {
  console.log(`-- frame ${i} --`);
  console.log(colorizedPreview(f, SWING_SIDE_W, SWING_SIDE_H));
});

// =========================================================================
// 走路 4 帧动画：6 �?× 32 高（中间 4 列是身体，左�?1 列给臂前后摆�?
// frame 0: 静止（双臂下垂、双腿并拢）
// frame 1: 左腿前迈 + 右臂前甩
// frame 2: 静止
// frame 3: 右腿前迈 + 左臂前甩
// =========================================================================
const WALK_W = 6, WALK_H = 32;

function buildWalkFrame(frameIdx) {
  const cv = new Uint8Array(WALK_W * WALK_H * 4);
  // �?身放在中间列 1~4
  blitInto(cv, WALK_W, { x: 1, y: 0 }, headRight, 4, 8);
  blitInto(cv, WALK_W, { x: 1, y: 0 }, headRight2, 4, 8);
  blitInto(cv, WALK_W, { x: 1, y: 8 }, bodyRight, 4, 12);

  // 臂的位置：frame 0/2 默认贴身（列 1~4 内）；frame 1 右臂前移到列 0；frame 3 右臂后移到列 5
  // 注意：侧身视角只能看到一只前臂，不画后臂（后臂被身体遮）
  let armX = 1;
  if (frameIdx === 1) armX = 0;       // 前甩（向移动方向 = 屏幕�?前）
  else if (frameIdx === 3) armX = 2;  // 后甩
  blitInto(cv, WALK_W, { x: armX, y: 8 }, armRSide, 4, 12);

  // 腿：frame 0/2 双腿并拢居中（列 1~4�?
  // frame 1: 前腿 +1px X，后�?-1px X 模拟分腿
  // frame 3: 反过�?
  if (frameIdx === 0 || frameIdx === 2) {
    blitInto(cv, WALK_W, { x: 1, y: 20 }, legRSide, 4, 12);
  } else {
    // 双腿分开
    const legXFront = frameIdx === 1 ? 0 : 2;  // 前腿
    const legXBack  = frameIdx === 1 ? 2 : 0;  // 后腿
    // 后腿先画（被身体盖一半），前腿后�?
    blitInto(cv, WALK_W, { x: legXBack, y: 20 }, legRSide, 4, 12);
    blitInto(cv, WALK_W, { x: legXFront, y: 20 }, legRSide, 4, 12);
  }
  return rgbaToPixelArray(cv, WALK_W, WALK_H, 96);
}

const walkFrames = [0, 1, 2, 3].map(buildWalkFrame);
console.log('[Steve] 走路 4 �?(6×32):');
walkFrames.forEach((f, i) => {
  console.log(`-- frame ${i} --`);
  console.log(colorizedPreview(f, WALK_W, WALK_H));
});

// =========================================================================
// 挥手 5 帧动画——每帧的手臂 sprite 直接像素级排列（不实时旋转，零变形）
// 每帧也记�?手部坐标"用于贴镐�?方块
//
// 手臂源数据：armRBack 4×12（顶=肩，�?手腕�?
// 5 帧布局（每帧手臂大�?+ 手部相对画布位置）：
//   frame 0  arm_down       垂直向下     w=4 h=12   hand=(2, 12)  - 自然下垂
//   frame 1  arm_45down     斜下 45°    阶梯排列  hand 计算       - 砸下�?
//   frame 2  arm_horizontal 水平向前    w=12 h=4   hand=(12, 2)   - 水平
//   frame 3  arm_45up       斜上 45°    阶梯排列  hand 计算       - 举起�?
//   frame 4  arm_up         垂直向上    w=4 h=12   hand=(2, 0)    - 高举过头
//
// sprite 数据�?armRBack 复制，按帧布局贴到挥手画布
// =========================================================================

// �?armRBack 的某 1 个像素取出来（返�?rgba �?null�?
function getArmPixel(sx, sy) {
  if (sx < 0 || sx >= 4 || sy < 0 || sy >= 12) return null;
  const o = (sy * 4 + sx) * 4;
  const a = armRBack[o + 3];
  if (a < 16) return null;
  return [armRBack[o], armRBack[o + 1], armRBack[o + 2], 255];
}

// 工具：把单个像素写到画布
function setCanvasPixel(canvas, w, x, y, rgba) {
  if (!rgba) return;
  if (x < 0 || x >= w) return;
  const o = (y * w + x) * 4;
  canvas[o] = rgba[0];
  canvas[o + 1] = rgba[1];
  canvas[o + 2] = rgba[2];
  canvas[o + 3] = rgba[3];
}

// 挥手画布尺寸�?5×25（肩在中央，垂直臂上下都能放下）
const SWING_FRAME_W = 25, SWING_FRAME_H = 25;
const SWING_SHOULDER_LX = 12;
const SWING_SHOULDER_LY = 12;

// �?0: arm_down 垂直向下 - 肩在 (3,3)，臂�?(2,3)~(5,14)
function buildArmFrame_Down() {
  const cv = new Uint8Array(SWING_FRAME_W * SWING_FRAME_H * 4);
  // 直接 4×12 垂直�?
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const c = getArmPixel(sx, sy);
      setCanvasPixel(cv, SWING_FRAME_W, SWING_SHOULDER_LX - 1 + sx, SWING_SHOULDER_LY + sy, c);
    }
  }
  return { canvas: cv, hand: { x: SWING_SHOULDER_LX + 1, y: SWING_SHOULDER_LY + 11 } };
}

// �?4: arm_up 垂直向上 - 数据上下翻转后贴到肩部上�?
function buildArmFrame_Up() {
  const cv = new Uint8Array(SWING_FRAME_W * SWING_FRAME_H * 4);
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const c = getArmPixel(sx, 11 - sy); // 上下翻转
      setCanvasPixel(cv, SWING_FRAME_W, SWING_SHOULDER_LX - 1 + sx, SWING_SHOULDER_LY - 11 + sy, c);
    }
  }
  return { canvas: cv, hand: { x: SWING_SHOULDER_LX + 1, y: SWING_SHOULDER_LY - 11 } };
}

// �?5: arm_down_mid - 手臂垂直，整体上�?4px（手在腰部高度）
function buildArmFrame_DownMid() {
  const cv = new Uint8Array(SWING_FRAME_W * SWING_FRAME_H * 4);
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const c = getArmPixel(sx, sy);
      setCanvasPixel(cv, SWING_FRAME_W, SWING_SHOULDER_LX - 1 + sx, SWING_SHOULDER_LY - 4 + sy, c);
    }
  }
  return { canvas: cv, hand: { x: SWING_SHOULDER_LX + 1, y: SWING_SHOULDER_LY + 7 } };
}

// �?6: arm_up_mid - 手臂高举（上下翻转：手在上、肩在下�?
// 肩在 (SHOULDER_LX, SHOULDER_LY)，手腕往上方延伸
function buildArmFrame_UpMid() {
  const cv = new Uint8Array(SWING_FRAME_W * SWING_FRAME_H * 4);
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      // sy=0 是肩在源数据中、sy=11 是手腕；翻转�?sy=0 当手腕处�?
      const c = getArmPixel(sx, 11 - sy);
      // 写入位置：肩�?sy=11 落在 SHOULDER_LY，手�?sy=0 落在 SHOULDER_LY-11
      setCanvasPixel(cv, SWING_FRAME_W, SWING_SHOULDER_LX - 1 + sx, SWING_SHOULDER_LY - 11 + sy, c);
    }
  }
  return { canvas: cv, hand: { x: SWING_SHOULDER_LX + 1, y: SWING_SHOULDER_LY - 11 } };
}

// �?2: arm_horizontal 水平向前 - 4×12 转置�?12×4，贴到肩部右�?
// 像素映射 (sx, sy) -> 转置�?(sy, 3-sx) �?(12 �? 4 �?
function buildArmFrame_Horizontal() {
  const cv = new Uint8Array(SWING_FRAME_W * SWING_FRAME_H * 4);
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const c = getArmPixel(sx, sy);
      // 目标位置�?�?X + sy, �?Y - 1 + (3 - sx))
      // 让肩部那一�?(sx=2 sy=0) 落到 (�?X, �?Y + 1) 大致接肩
      setCanvasPixel(cv, SWING_FRAME_W, SWING_SHOULDER_LX + sy, SWING_SHOULDER_LY + (3 - sx), c);
    }
  }
  return { canvas: cv, hand: { x: SWING_SHOULDER_LX + 11, y: SWING_SHOULDER_LY + 1 } };
}

// �?1: arm_45down 斜下 45° - 12 个像素长�?对角阶梯"
// 每个�?sy（沿臂长方向）的 4 个像素（横切片）排在阶梯位置
// 对角方向：x += 1, y += 1 每行
function buildArmFrame_45Down() {
  const cv = new Uint8Array(SWING_FRAME_W * SWING_FRAME_H * 4);
  for (let sy = 0; sy < 12; sy++) {
    // 沿臂的对角偏�?
    const dx = sy;
    const dy = sy;
    // 横切�?4 个像素垂直于对角方向�?-1, 1), (0, 0), (1, -1)... 简化：横切片就是横�?4 像素
    for (let sx = 0; sx < 4; sx++) {
      const c = getArmPixel(sx, sy);
      // 横切片排�?(�?X + dx + sx - 2, �?Y + dy + sx - 2)
      // �?sx=2 (中线) 落在 (�?X + dx, �?Y + dy)
      setCanvasPixel(cv, SWING_FRAME_W,
        SWING_SHOULDER_LX + dx,
        SWING_SHOULDER_LY + dy + sx - 1,
        c);
    }
  }
  return { canvas: cv, hand: { x: SWING_SHOULDER_LX + 11, y: SWING_SHOULDER_LY + 12 } };
}

// �?3: arm_45up 斜上 45° - 同帧 1 �?dy 反向
function buildArmFrame_45Up() {
  const cv = new Uint8Array(SWING_FRAME_W * SWING_FRAME_H * 4);
  for (let sy = 0; sy < 12; sy++) {
    const dx = sy;
    const dy = -sy;
    for (let sx = 0; sx < 4; sx++) {
      const c = getArmPixel(sx, sy);
      setCanvasPixel(cv, SWING_FRAME_W,
        SWING_SHOULDER_LX + dx,
        SWING_SHOULDER_LY + dy + sx - 1,
        c);
    }
  }
  return { canvas: cv, hand: { x: SWING_SHOULDER_LX + 11, y: SWING_SHOULDER_LY - 12 } };
}

// =========================================================================
// 完整挥砸动画�? �?22×32 sprite，每帧包�?
//   背身 Steve 完整身体（头/�?双腿/左臂下垂�?
//   右臂 + 镐子在不同位置（高举→中位→砸到底→中位�?
//   手臂硬编码画在镐子柄上（覆盖柄中段）= 视觉�?手握"
// 序列：[0, 1, 2, 1] 循环
// =========================================================================

const FULL_FRAME_W = 22;
const FULL_FRAME_H = 36; // +4 让举高时镐头不被�?

// 镐头颜色（按镐子类型用脚本生成时�?iron 色，渲染时也可改色）
// 这里写死一组色：木/�?�?�?合金 5 �?
const PICK_HEAD_COLORS = {
  iron:      ['#dbdbdb', '#c1c1c1', '#494949'],   // �?�?�?
  wooden:    ['#bb8f5a', '#996e3f', '#5a3818'],
  stone:     ['#a0a0a0', '#7f7f7f', '#494949'],
  diamond:   ['#62dbe8', '#2bc7ac', '#0e3f36'],
  netherite: ['#5a4e4e', '#3d3535', '#1f1414'],
};

// 把一�?RGB 颜色（可能是 hex）转�?rgba 数组
function hexToRgba(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255,
  ];
}

// 在画布上画一�?5 �?× 7 高的镐子（镐头朝上、柄朝下�?
//   bottomY = 镐子柄底�?Y 坐标
//   centerX = 镐子中心 X
//   pickColors: [headLight, headMid, headDark]
function drawPickaxeAt(canvas, w, centerX, bottomY, pickColors) {
  const [hl, hm, hd] = pickColors.map(hexToRgba);
  const handle = hexToRgbaHere('#5a3818');
  const handleDark = hexToRgbaHere('#3a2810');

  // 5×7 布局�?
  //   y0  . T T T .       (镐头亮色 横向 3px)
  //   y1  T H H H T       (镐头中暗 横向 5px)
  //   y2  . . C . .       (�?
  //   y3  . . C . .
  //   y4  . . D . .       (柄底深色)
  //   y5  . . C . .
  //   y6  . . . . .
  // 锚点是柄�?(centerX, bottomY)
  const topY = bottomY - 6;
  const cx = centerX;

  // 镐头
  setCanvasPixel(canvas, w, cx - 1, topY, hl);
  setCanvasPixel(canvas, w, cx,     topY, hl);
  setCanvasPixel(canvas, w, cx + 1, topY, hl);
  setCanvasPixel(canvas, w, cx - 2, topY + 1, hm);
  setCanvasPixel(canvas, w, cx - 1, topY + 1, hm);
  setCanvasPixel(canvas, w, cx,     topY + 1, hm);
  setCanvasPixel(canvas, w, cx + 1, topY + 1, hm);
  setCanvasPixel(canvas, w, cx + 2, topY + 1, hm);

  // �?
  for (let i = 0; i < 5; i++) {
    setCanvasPixel(canvas, w, cx, topY + 2 + i, i === 2 ? handleDark : handle);
  }
}

// 画背�?Steve 身体（不含右臂）到画�?
//   bodyAnchorX, bodyAnchorY: Steve 16×32 身体的左上角在画布上的位�?
function drawSteveBackBody(canvas, w, bodyAnchorX, bodyAnchorY) {
  // �?
  for (let sy = 0; sy < 8; sy++) {
    for (let sx = 0; sx < 8; sx++) {
      const so = (sy * 8 + sx) * 4;
      const a = headBack[so + 3];
      if (a < 16) continue;
      const c = [headBack[so], headBack[so+1], headBack[so+2], 255];
      setCanvasPixel(canvas, w, bodyAnchorX + 4 + sx, bodyAnchorY + sy, c);
    }
  }
  // 身体
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 8; sx++) {
      const so = (sy * 8 + sx) * 4;
      const a = bodyBack[so + 3];
      if (a < 16) continue;
      const c = [bodyBack[so], bodyBack[so+1], bodyBack[so+2], 255];
      setCanvasPixel(canvas, w, bodyAnchorX + 4 + sx, bodyAnchorY + 8 + sy, c);
    }
  }
  // 左臂（镜像右臂）
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + (3 - sx)) * 4;
      const a = armRBack[so + 3];
      if (a < 16) continue;
      const c = [armRBack[so], armRBack[so+1], armRBack[so+2], 255];
      setCanvasPixel(canvas, w, bodyAnchorX + sx, bodyAnchorY + 8 + sy, c);
    }
  }
  // 双腿
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = legRBack[so + 3];
      if (a < 16) continue;
      const c = [legRBack[so], legRBack[so+1], legRBack[so+2], 255];
      // 右腿
      setCanvasPixel(canvas, w, bodyAnchorX + 8 + sx, bodyAnchorY + 20 + sy, c);
      // 左腿（镜像）
      setCanvasPixel(canvas, w, bodyAnchorX + 4 + (3 - sx), bodyAnchorY + 20 + sy, c);
    }
  }
}

// 画右臂（垂直 4×12，可指定整体顶端 Y 位置�?
//   armTopY = 手臂最上端在画布上�?Y
//   bodyAnchorX = Steve 身体左上�?X，右臂列 12~15
//   handOnTop = true 表示手举高（手腕在上，肩在下）；false 表示自然下垂（肩在上，手腕在下）
function drawSteveBackArm(canvas, w, bodyAnchorX, armTopY, handOnTop) {
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      // handOnTop=true 时上下翻转源数据：sy=0 取手�?11)，sy=11 取肩(0)
      const srcSy = handOnTop ? (11 - sy) : sy;
      const so = (srcSy * 4 + sx) * 4;
      const a = armRBack[so + 3];
      if (a < 16) continue;
      const c = [armRBack[so], armRBack[so+1], armRBack[so+2], 255];
      setCanvasPixel(canvas, w, bodyAnchorX + 12 + sx, armTopY + sy, c);
    }
  }
}

// 4 帧挥砸：每帧 (画布大小 22×36)
//   Steve 身体左上�?= (3, 4) �?身体�?(3,4)~(18,35)
//   右臂位置 + 镐子位置 按帧变化
//   每帧画的次序�?) 镐子 2) 手臂（盖在镐柄中段）= 看起来手�?
//
// �?0: 高举（手在头顶上方，镐头在最高处�?
//   armTop = 0      （手顶端伸出画布�?4 像素，但截到 0�?
//   pickBottom = 12 （镐子柄底在手位�?= 画布 y=12�?
// �?1: 中位
//   armTop = 4
//   pickBottom = 16
// �?2: 砸到�?
//   armTop = 8
//   pickBottom = 20
// �?3 = �?1
// 画整条手臂 4×12，由 handOnTop 决定方向：
//   handOnTop=true  → 手腕在上、肩在下（高举）
//   handOnTop=false → 肩在上、手腕在下（自然下垂）
// shoulderY = 肩部位置 Y（永远 = Steve 肩部 12）
// 手臂从肩向上/下延伸 11 像素
function drawFullArm(canvas, w, bodyAnchorX, shoulderY, handOnTop) {
  for (let sy = 0; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = armRBack[so + 3];
      if (a < 16) continue;
      const c = [armRBack[so], armRBack[so+1], armRBack[so+2], 255];
      // 自然下垂：sy=0 是肩 → 画在 shoulderY+0；sy=11 是手腕 → 画在 shoulderY+11
      // 高举：sy=0 是肩 → 画在 shoulderY；sy=11 是手腕 → 画在 shoulderY-11
      const dy = handOnTop ? (shoulderY - sy) : (shoulderY + sy);
      setCanvasPixel(canvas, w, bodyAnchorX + 12 + sx, dy, c);
    }
  }
}

function buildSwingFullFrame(armState) {
  // armState: 'high' = 举到肩平 / 'mid' = 中位 / 'down' = 砸下
  // 幅度小（手腕 Y 8~16），看起来像小幅举起再砸下
  const cv = new Uint8Array(FULL_FRAME_W * FULL_FRAME_H * 4);
  drawSteveBackBody(cv, FULL_FRAME_W, 3, 4);

  const shoulderY = 12;
  // 手腕 Y 位置：始终在肩下方（自然方向，肩在上手腕在下）
  let forearmTopY;
  if (armState === 'high') forearmTopY = 12;       // 前臂顶=12（紧贴肩底，前臂只露 6px 在 12~17）
  else if (armState === 'mid') forearmTopY = 14;   // 前臂下移 2px
  else forearmTopY = 18;                            // 自然下垂（前臂顶=18 紧贴上臂底 17）

  // 镐子位置：柄底贴前臂底端 + 1px
  const pickBottomY = forearmTopY + 6 + 1;
  const pickCenterX = 3 + 12 + 1;
  const pickColors = PICK_HEAD_COLORS.iron;
  drawPickaxeAt(cv, FULL_FRAME_W, pickCenterX, pickBottomY, pickColors);

  // 上臂 sy=0~5 永远固定贴在 shoulderY~shoulderY+5
  for (let sy = 0; sy < 6; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = armRBack[so + 3];
      if (a < 16) continue;
      const c = [armRBack[so], armRBack[so+1], armRBack[so+2], 255];
      setCanvasPixel(cv, FULL_FRAME_W, 15 + sx, shoulderY + sy, c);
    }
  }
  // 前臂 sy=6~11 贴在 forearmTopY~forearmTopY+5（举到肩平时会盖住部分上臂，肘弯曲感）
  for (let sy = 6; sy < 12; sy++) {
    for (let sx = 0; sx < 4; sx++) {
      const so = (sy * 4 + sx) * 4;
      const a = armRBack[so + 3];
      if (a < 16) continue;
      const c = [armRBack[so], armRBack[so+1], armRBack[so+2], 255];
      setCanvasPixel(cv, FULL_FRAME_W, 15 + sx, forearmTopY + (sy - 6), c);
    }
  }

  return cv;
}

// 3 帧：高举（到肩平）/ 中位 / 砸下（自然下垂）
const SWING_FULL_FRAMES_RAW = [
  buildSwingFullFrame('high'),
  buildSwingFullFrame('mid'),
  buildSwingFullFrame('down'),
];
const swingFullFrames = SWING_FULL_FRAMES_RAW.map(cv =>
  rgbaToPixelArray(cv, FULL_FRAME_W, FULL_FRAME_H, 96)
);

console.log('[Steve] 完整挥砸 3 �?(22×36):');
swingFullFrames.forEach((f, i) => {
  console.log(`-- frame ${i} --`);
  console.log(colorizedPreview(f, FULL_FRAME_W, FULL_FRAME_H));
});

// �?5 帧手臂数据保留兼容，但实际不再用
const armFramesData = [
  buildArmFrame_Down(),
  buildArmFrame_45Down(),
  buildArmFrame_Horizontal(),
  buildArmFrame_45Up(),
  buildArmFrame_Up(),
  buildArmFrame_DownMid(),
  buildArmFrame_UpMid(),
];
const armFramesPixels = armFramesData.map(d => rgbaToPixelArray(d.canvas, SWING_FRAME_W, SWING_FRAME_H, 96));
const armFramesHands = armFramesData.map(d => d.hand);

console.log('[Steve] 挥手 5 帧手�?sprite (18×18，肩�?3,3):');
armFramesPixels.forEach((f, i) => {
  console.log(`-- frame ${i} hand=(${armFramesHands[i].x},${armFramesHands[i].y}) --`);
  console.log(colorizedPreview(f, SWING_FRAME_W, SWING_FRAME_H));
});

console.log('[Steve] 16×32 身体（背面）:');
console.log(colorizedPreview(stevePixels, FULL_W, FULL_H));
console.log('\n[Steve] 8×32 身体（侧面）:');
console.log(colorizedPreview(steveSidePixels, SIDE_W, SIDE_H));

// 2. 草地用泰拉瑞�?forest，本脚本不再处理草地�?

// 3. 处理方块/镐子原版纹理 16×16 -> 缩放
const TEX_DIR = path.join(STATIC_DIR, 'textures');

// 方块缩到 4×4（实际可摆放选项�?
const BLOCK_NAMES = [
  'oak_planks', 'oak_log', 'stone', 'cobblestone',
  // 矿物块（用户实际期望�?钻石/金块"看到的纹理）
  'diamond_block', 'gold_block', 'iron_block', 'emerald_block',
  'lapis_block', 'redstone_block',
  // 矿石（如果用户想要矿石外观也保留�?
  'diamond_ore', 'gold_ore', 'iron_ore', 'redstone_ore', 'emerald_ore', 'lapis_ore',
  // 其他装饰�?
  'obsidian', 'glowstone', 'netherite_block', 'quartz_block', 'tnt_side',
];
// 镐子保留 16×16 原版（前端按用户 UI 滑块自己缩，避免预缩糊掉细节�?
const PICKAXE_NAMES = ['wooden_pickaxe', 'stone_pickaxe', 'iron_pickaxe', 'diamond_pickaxe', 'netherite_pickaxe'];
const BLOCK_SIZE_OUT = 4;
const PICK_SIZE_OUT = 16;

function loadAndScale(filename, dstSize) {
  const buf = fs.readFileSync(path.join(TEX_DIR, filename));
  const png = decodePng(buf);
  const small = resizeAreaAvg(png.rgba, png.width, png.height, dstSize, dstSize);
  return rgbaToPixelArray(small, dstSize, dstSize, 32);
}

const blockTextures = {};
for (const name of BLOCK_NAMES) {
  blockTextures[name] = loadAndScale(`${name}.png`, BLOCK_SIZE_OUT);
  console.log(`[Block] ${name} -> ${BLOCK_SIZE_OUT}×${BLOCK_SIZE_OUT}`);
}

const pickaxeTextures = {};
for (const name of PICKAXE_NAMES) {
  pickaxeTextures[name] = loadAndScale(`${name}.png`, PICK_SIZE_OUT);
  console.log(`[Pickaxe] ${name} -> ${PICK_SIZE_OUT}×${PICK_SIZE_OUT}`);
}

// 输出 JS 文件
const stringify = (rows) =>
  '[\n' +
  rows.map((row) => '  [' + row.map((c) => (c === null ? 'null' : `"${c}"`)).join(', ') + ']').join(',\n') +
  '\n]';

const formatTextureMap = (map) => {
  return '{\n' + Object.entries(map).map(([k, v]) => `  ${k}: ${stringify(v).replace(/\n/g, '\n  ')}`).join(',\n') + '\n}';
};

const fileContent = `/**
 * Minecraft 时钟资源像素数据
 * �?scripts/build-minecraft-assets.js 自动生成，请勿手动编辑�?
 *
 * 来源�?
 *   - Mojang 官方 64×64 默认皮肤模板正面 -> Steve 16×32 身体 + 4×12 右臂 (1:1)
 *   - InventivetalentDev/minecraft-assets@1.20.4 原版纹理 -> 方块 4×4 / 镐子 7×7
 * 草地/天空/云：复用 terrariaBiome forest
 */

export const STEVE_W = ${FULL_W};
export const STEVE_H = ${FULL_H};
// 背面身体（含�?躯干/左臂/双腿，无右臂�?
export const STEVE_BODY_PIXELS = ${stringify(stevePixels)};

export const STEVE_ARM_W = 4;
export const STEVE_ARM_H = 12;
// 背面右臂（独立摆动用�?
export const STEVE_ARM_PIXELS = ${stringify(armPixels)};

// 正面身体（idle 看着我们时用�?
export const STEVE_FRONT_PIXELS = ${stringify(steveFrontPixels)};
// 正面右臂
export const STEVE_FRONT_ARM_PIXELS = ${stringify(armFrontPixels)};

// 右臂�?16×32 画布上的肩膀锚点（左上角像素位置�?
export const STEVE_ARM_ANCHOR_X = 12;
export const STEVE_ARM_ANCHOR_Y = 8;

// 侧面 Steve（朝右，向左走时镜像�?
export const STEVE_SIDE_W = ${SIDE_W};
export const STEVE_SIDE_H = ${SIDE_H};
export const STEVE_SIDE_PIXELS = ${stringify(steveSidePixels)};

// 走路 4 帧（侧身 6×32�?
export const STEVE_WALK_W = ${WALK_W};
export const STEVE_WALK_H = ${WALK_H};
export const STEVE_WALK_FRAMES = [
${walkFrames.map(f => stringify(f)).join(',\n')}
];

// 挥手 5 帧手�?sprite（独立绘制，不含身体）�?旧版兼容
export const STEVE_SWING_ARM_W = ${SWING_FRAME_W};
export const STEVE_SWING_ARM_H = ${SWING_FRAME_H};
// 肩部锚点（在 sprite 内）
export const STEVE_SWING_ARM_SHOULDER_X = ${SWING_SHOULDER_LX};
export const STEVE_SWING_ARM_SHOULDER_Y = ${SWING_SHOULDER_LY};
// 5 帧手�?sprite（垂直下/斜下 45/水平/斜上 45/垂直上）
export const STEVE_SWING_ARM_FRAMES = [
${armFramesPixels.map(f => stringify(f)).join(',\n')}
];
// 5 帧每帧的"手部"�?sprite 内坐�?
export const STEVE_SWING_ARM_HANDS = ${JSON.stringify(armFramesHands, null, 2)};

// 完整挥砸动画 sprite（每�?22×36 包含背身 Steve + 手臂 + 镐子�?
export const STEVE_SWING_FULL_W = ${FULL_FRAME_W};
export const STEVE_SWING_FULL_H = ${FULL_FRAME_H};
// Steve 身体在画布内的左上角（用于把整张�?sprite 对齐�?Steve 渲染坐标�?
export const STEVE_SWING_FULL_BODY_OFFSET_X = 3;
export const STEVE_SWING_FULL_BODY_OFFSET_Y = 4;
// 3 帧完整挥�?sprite，每�?22×36
export const STEVE_SWING_FULL_FRAMES = [
${swingFullFrames.map(f => stringify(f)).join(',\n')}
];

// 侧身举手 sprite（debug 持镐 / 持方块）
export const STEVE_SIDE_HOLD_W = ${SWING_SIDE_W};
export const STEVE_SIDE_HOLD_H = ${SWING_SIDE_H};
export const STEVE_SIDE_HOLD_FRAME = ${stringify(sideHoldFrame)};
export const STEVE_SIDE_HOLD_HAND_X = ${SIDE_HOLD_HAND_X};
export const STEVE_SIDE_HOLD_HAND_Y = ${SIDE_HOLD_HAND_Y};

// 侧身挥砸 3 帧 sprite（朝右版，朝左 mirror 渲染）
export const STEVE_SIDE_SWING_W = ${SWING_SIDE_W};
export const STEVE_SIDE_SWING_H = ${SWING_SIDE_H};
export const STEVE_SIDE_SWING_FRAMES = [
${sideSwingFrames.map(f => stringify(f)).join(',\n')}
];

// 方块纹理 4×4 (key = blockId)
export const BLOCK_SIZE = ${BLOCK_SIZE_OUT};
export const BLOCK_TEXTURES = ${formatTextureMap(blockTextures)};

// 镐子纹理 7×7 (key = pickaxe type)
export const PICKAXE_SIZE = ${PICK_SIZE_OUT};
export const PICKAXE_TEXTURES = ${formatTextureMap(pickaxeTextures)};
`;

fs.writeFileSync(OUT_FILE, fileContent, 'utf8');
console.log(`\n�?wrote ${OUT_FILE} (${fileContent.length} bytes)`);


