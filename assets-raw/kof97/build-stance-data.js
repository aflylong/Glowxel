/**
 * Stage 2: build KOF97 stance data from full-size transparent frames.
 *
 * Input:
 *   assets-raw/kof97/frames-out/<Character>/<index>.png
 *
 * Output:
 *   website/src/utils/kof97Stances.js
 *   website/public/kof97/stances.json
 *   assets-raw/kof97/kof97Stances.global.js
 *   assets-raw/kof97/stance-build-report.json
 *
 * Rules:
 *   1. Keep source pixels at their original size.
 *   2. Clean edge-connected cut-background pixels before packing.
 *   3. Align each character by body anchor + foot line instead of full-frame center.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FRAMES_DIR = path.join(__dirname, 'frames-out');
const OUT = path.join(__dirname, '..', '..', 'website', 'src', 'utils', 'kof97Stances.js');
const PUBLIC_JSON_OUT = path.join(__dirname, '..', '..', 'website', 'public', 'kof97', 'stances.json');
const GLOBAL_OUT = path.join(__dirname, 'kof97Stances.global.js');
const REPORT_OUT = path.join(__dirname, 'stance-build-report.json');

const CHAR_DIRS = {
  kyo: 'Kyo',
  iori: 'Iori',
  terry: 'Terry',
  andy: 'Andy',
  benimaru: 'Benimaru',
  mai: 'mai',
  ryo: 'Ryo',
  goro: 'Goro',
  chang: 'Chang',
  choi: 'Choi',
  shermie: 'Shermie',
  yashiro: 'Yashiro',
  chizuru: 'Chizuru',
  orochi: 'orochi',
};

const EDGE_CUT_BACKGROUND_COLORS = new Set([
  '#bf0060',
  '#df156a',
]);

const CONFIRMED_FRAME_COUNTS = {
  choi: 19,
};

function parseExistingStances() {
  if (!fs.existsSync(OUT)) {
    return null;
  }

  const text = fs.readFileSync(OUT, 'utf8');
  const prefix = 'export const KOF_STANCES = ';
  const start = text.indexOf(prefix);
  const end = text.lastIndexOf(';');
  if (start === -1 || end === -1) {
    throw new Error(`Unable to parse existing stance file: ${OUT}`);
  }
  return JSON.parse(text.slice(start + prefix.length, end));
}

function validateCoverage(existing, next) {
  if (!existing) {
    return;
  }

  for (const [key, oldValue] of Object.entries(existing)) {
    if (!Object.hasOwn(next, key)) {
      throw new Error(`Refusing to overwrite ${OUT}: missing key "${key}" in next output`);
    }
    const oldFrames = 1 + oldValue.deltas.length;
    const nextFrames = 1 + next[key].deltas.length;
    if (nextFrames < oldFrames) {
      if (CONFIRMED_FRAME_COUNTS[key] === nextFrames) {
        continue;
      }
      throw new Error(
        `Refusing to overwrite ${OUT}: key "${key}" frame count shrank ${oldFrames} -> ${nextFrames}`
      );
    }
  }
}

function numericPngSort(a, b) {
  return Number.parseInt(a, 10) - Number.parseInt(b, 10);
}

function isVisibleAlpha(alpha) {
  return alpha >= 128;
}

function isLikelyCutBackground(r, g, b, a) {
  if (a < 64) {
    return false;
  }

  const color = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  const strongMagenta = r >= 210 && b >= 150 && g <= 125 && r - g >= 70 && b - g >= 45;
  const palePinkHalo = r >= 235 && g >= 105 && g <= 180 && b >= 130 && b <= 215;
  const strongPurple = r >= 175 && b >= 210 && g <= 120 && b - g >= 90;
  const deepPinkHalo = r >= 145 && r <= 225 && g <= 85 && b >= 75 && b <= 150 && r - g >= 70 && b - g >= 25;
  const mutedPinkHalo = r >= 130 && r <= 215 && g >= 45 && g <= 135 && b >= 75 && b <= 165 && r - g >= 35 && b - g >= 10;
  return EDGE_CUT_BACKGROUND_COLORS.has(color) || strongMagenta || palePinkHalo || strongPurple || deepPinkHalo || mutedPinkHalo;
}

function hasTransparentNeighbor(data, width, height, channels, x, y) {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        return true;
      }
      const offset = (ny * width + nx) * channels;
      if (!isVisibleAlpha(data[offset + 3])) {
        return true;
      }
    }
  }
  return false;
}

function cleanCutBackgroundPixels(data, info) {
  const clearIndexes = [];

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];
      if (!isLikelyCutBackground(r, g, b, a)) {
        continue;
      }
      if (!hasTransparentNeighbor(data, info.width, info.height, info.channels, x, y)) {
        continue;
      }
      clearIndexes.push(offset);
    }
  }

  for (const offset of clearIndexes) {
    data[offset + 3] = 0;
  }

  return clearIndexes.length;
}

function computeFrameMetrics(data, info) {
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let opaqueCount = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      if (!isVisibleAlpha(data[offset + 3])) {
        continue;
      }
      opaqueCount += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (opaqueCount === 0) {
    return {
      opaqueCount,
      minX: 0,
      minY: 0,
      maxX: -1,
      maxY: -1,
      anchorX: 0,
      footY: 0,
    };
  }

  const bodyY0 = Math.floor(minY + (maxY - minY + 1) * 0.28);
  const bodyY1 = Math.floor(minY + (maxY - minY + 1) * 0.82);
  const centerSamples = [];

  for (let y = bodyY0; y <= bodyY1; y += 1) {
    const rowXs = [];
    for (let x = minX; x <= maxX; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      if (isVisibleAlpha(data[offset + 3])) {
        rowXs.push(x);
      }
    }
    if (rowXs.length < 3) {
      continue;
    }
    rowXs.sort((a, b) => a - b);
    const start = Math.floor(rowXs.length * 0.35);
    const end = Math.ceil(rowXs.length * 0.65);
    for (let i = start; i < end; i += 1) {
      centerSamples.push(rowXs[i]);
    }
  }

  centerSamples.sort((a, b) => a - b);
  const anchorX = centerSamples.length > 0
    ? centerSamples[Math.floor(centerSamples.length / 2)]
    : Math.round((minX + maxX) / 2);

  return {
    opaqueCount,
    minX,
    minY,
    maxX,
    maxY,
    anchorX,
    footY: maxY,
  };
}

async function loadFrame(filePath) {
  const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cleanedPixels = cleanCutBackgroundPixels(data, info);
  const metrics = computeFrameMetrics(data, info);

  return {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
    cleanedPixels,
    ...metrics,
  };
}

function bufToPixelArray(buf, width, height) {
  const pixels = [];
  for (let i = 0; i < width * height; i += 1) {
    const r = buf[i * 4];
    const g = buf[i * 4 + 1];
    const b = buf[i * 4 + 2];
    const a = buf[i * 4 + 3];
    if (a < 128) {
      pixels.push(null);
      continue;
    }
    pixels.push(`#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`);
  }
  return pixels;
}

function packFrameOnCanvas(frame, canvasWidth, canvasHeight, targetAnchorX, targetFootY) {
  const buf = Buffer.alloc(canvasWidth * canvasHeight * 4);
  const offsetX = targetAnchorX - frame.anchorX;
  const offsetY = targetFootY - frame.footY;

  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      const sourceIndex = (y * frame.width + x) * frame.channels;
      if (!isVisibleAlpha(frame.data[sourceIndex + 3])) {
        continue;
      }
      const targetX = offsetX + x;
      const targetY = offsetY + y;
      if (targetX < 0 || targetX >= canvasWidth || targetY < 0 || targetY >= canvasHeight) {
        throw new Error(`Packed pixel out of canvas for ${frame.file}`);
      }
      const targetIndex = (targetY * canvasWidth + targetX) * 4;
      buf[targetIndex] = frame.data[sourceIndex];
      buf[targetIndex + 1] = frame.data[sourceIndex + 1];
      buf[targetIndex + 2] = frame.data[sourceIndex + 2];
      buf[targetIndex + 3] = frame.data[sourceIndex + 3];
    }
  }

  return buf;
}

function buildBaseAndDeltas(framesPx) {
  const base = framesPx[0];
  const deltas = [];
  for (let i = 1; i < framesPx.length; i += 1) {
    const current = framesPx[i];
    const delta = {};
    for (let j = 0; j < current.length; j += 1) {
      if (current[j] !== base[j]) {
        delta[j] = current[j];
      }
    }
    deltas.push(delta);
  }
  return { base, deltas };
}

function estimateFlashBytes(data) {
  const basePixels = data.base.filter((pixel) => pixel !== null).length;
  let deltaPixels = 0;
  for (const delta of data.deltas) {
    for (const key of Object.keys(delta)) {
      if (delta[key] !== null) {
        deltaPixels += 1;
      }
    }
  }
  return (basePixels + deltaPixels) * 5 + 16 * (1 + data.deltas.length);
}

function buildCompactPayload(generated) {
  const palette = [];
  const colorToIndex = new Map();

  function internColor(color) {
    if (color === null) {
      return -1;
    }
    const existing = colorToIndex.get(color);
    if (existing !== undefined) {
      return existing;
    }
    const nextIndex = palette.length;
    palette.push(color);
    colorToIndex.set(color, nextIndex);
    return nextIndex;
  }

  const characters = {};

  for (const [key, data] of Object.entries(generated)) {
    const basePairs = [];
    for (let index = 0; index < data.base.length; index += 1) {
      const color = data.base[index];
      if (color === null) {
        continue;
      }
      basePairs.push(index, internColor(color));
    }

    const deltaPairs = data.deltas.map((delta) => {
      const pairs = [];
      const entries = Object.entries(delta).sort((a, b) => Number.parseInt(a[0], 10) - Number.parseInt(b[0], 10));
      for (const [index, color] of entries) {
        pairs.push(Number.parseInt(index, 10), internColor(color));
      }
      return pairs;
    });

    characters[key] = {
      w: data.w,
      h: data.h,
      base: basePairs,
      deltas: deltaPairs,
    };
  }

  return {
    version: 1,
    palette,
    characters,
  };
}

async function main() {
  const existing = parseExistingStances();
  const generated = {};
  const report = {
    generatedAt: new Date().toISOString(),
    mode: 'fullsize-original-pixels',
    characters: [],
  };

  for (const [key, dirName] of Object.entries(CHAR_DIRS)) {
    const dir = path.join(FRAMES_DIR, dirName);
    if (!fs.existsSync(dir)) {
      console.log(`skip        ${key} (missing ${dirName})`);
      continue;
    }

    const files = fs.readdirSync(dir).filter((file) => /^\d+\.png$/i.test(file)).sort(numericPngSort);
    if (files.length === 0) {
      console.log(`skip        ${key} (empty ${dirName})`);
      continue;
    }

    const frames = [];
    for (const file of files) {
      const frame = await loadFrame(path.join(dir, file));
      if (frame.opaqueCount === 0) {
        continue;
      }
      frames.push({ file, ...frame });
    }

    if (frames.length === 0) {
      console.log(`skip        ${key} (no usable frame)`);
      continue;
    }

    const leftExtent = Math.max(...frames.map((frame) => frame.anchorX - frame.minX));
    const rightExtent = Math.max(...frames.map((frame) => frame.maxX - frame.anchorX));
    const topExtent = Math.max(...frames.map((frame) => frame.footY - frame.minY));
    const bottomExtent = Math.max(...frames.map((frame) => frame.maxY - frame.footY));
    const targetAnchorX = leftExtent;
    const targetFootY = topExtent;
    const canvasWidth = leftExtent + rightExtent + 1;
    const canvasHeight = topExtent + bottomExtent + 1;
    const framesPx = [];
    const frameReport = [];
    let cleanedTotal = 0;
    for (const frame of frames) {
      cleanedTotal += frame.cleanedPixels;
      const canvas = packFrameOnCanvas(frame, canvasWidth, canvasHeight, targetAnchorX, targetFootY);
      const pixels = bufToPixelArray(canvas, canvasWidth, canvasHeight);
      const outputOpaqueCount = pixels.filter((pixel) => pixel !== null).length;
      if (outputOpaqueCount === 0) {
        throw new Error(`Refusing to use empty packed frame: ${key}/${frame.file}`);
      }
      framesPx.push(pixels);
      frameReport.push({
        file: frame.file,
        sourceWidth: frame.width,
        sourceHeight: frame.height,
        opaqueCount: frame.opaqueCount,
        cleanedPixels: frame.cleanedPixels,
        bbox: [frame.minX, frame.minY, frame.maxX, frame.maxY],
        anchorX: frame.anchorX,
        footY: frame.footY,
        offsetX: targetAnchorX - frame.anchorX,
        offsetY: targetFootY - frame.footY,
        outputWidth: canvasWidth,
        outputHeight: canvasHeight,
        outputOpaqueCount,
      });
    }

    const { base, deltas } = buildBaseAndDeltas(framesPx);
    generated[key] = {
      w: canvasWidth,
      h: canvasHeight,
      base,
      deltas,
    };

    const basePixels = base.filter((pixel) => pixel !== null).length;
    const deltaAvg = Math.round(
      deltas.reduce((sum, delta) => sum + Object.keys(delta).length, 0) / Math.max(1, deltas.length)
    );
    const estBytes = estimateFlashBytes(generated[key]);
    report.characters.push({
      key,
      dirName,
      frameCount: framesPx.length,
      outputWidth: canvasWidth,
      outputHeight: canvasHeight,
      basePixels,
      deltaAvg,
      estBytes,
      cleanedPixels: cleanedTotal,
      targetAnchorX,
      targetFootY,
      frames: frameReport,
    });
    console.log(
      `${key.padEnd(10)} frames=${String(framesPx.length).padStart(3)} canvas=${canvasWidth}x${canvasHeight} base=${String(
        basePixels
      ).padStart(5)}px clean=${String(cleanedTotal).padStart(4)} est=${estBytes}B`
    );
  }

  if (existing) {
    for (const [key, value] of Object.entries(existing)) {
      if (!Object.hasOwn(generated, key)) {
        generated[key] = value;
        console.log(`preserve    ${key}`);
      }
    }
  }

  validateCoverage(existing, generated);

  const out = `// Auto-generated KOF '97 stance animation data (original pixels on transparent canvases)\n// Do not edit by hand.\nexport const KOF_STANCES = ${JSON.stringify(generated)};\n`;
  const compact = buildCompactPayload(generated);
  fs.mkdirSync(path.dirname(PUBLIC_JSON_OUT), { recursive: true });
  fs.writeFileSync(OUT, out);
  fs.writeFileSync(PUBLIC_JSON_OUT, `${JSON.stringify(compact)}\n`);
  fs.writeFileSync(
    GLOBAL_OUT,
    `// Auto-generated for local debug pages.\nwindow.KOF_STANCES = ${JSON.stringify(generated)};\n`
  );
  fs.writeFileSync(REPORT_OUT, `${JSON.stringify(report, null, 2)}\n`);

  let totalBytes = 0;
  for (const data of Object.values(generated)) {
    totalBytes += estimateFlashBytes(data);
  }
  console.log(`\nWrote ${OUT}`);
  console.log(`Wrote ${PUBLIC_JSON_OUT}`);
  console.log(`Wrote ${GLOBAL_OUT}`);
  console.log(`Wrote ${REPORT_OUT}`);
  console.log(`Estimated fmt5-style payload ${totalBytes} B = ${(totalBytes / 1024).toFixed(1)} KB`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
