import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FRAMES_DIR = path.join(__dirname, 'frames-out');
const OUT_DIR = path.join(__dirname, 'stance-anchor-debug');

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

const SCALE = 3;
const GRID_COLS = 8;
const GAP = 8;
const LABEL_H = 14;
const TITLE_H = 18;

const COLORS = {
  bgA: [28, 28, 32, 255],
  bgB: [42, 42, 48, 255],
  bbox: [0, 255, 90, 255],
  foot: [255, 220, 0, 255],
  anchor: [255, 0, 0, 255],
  dirty: [255, 0, 255, 255],
};

function ensureEmptyDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function numericPngSort(a, b) {
  return Number.parseInt(a, 10) - Number.parseInt(b, 10);
}

function isVisiblePixel(data, channels, offset) {
  return data[offset + 3] >= 128;
}

function isSuspectPinkPurple(r, g, b, a) {
  if (a < 64) {
    return false;
  }
  const magentaScore = (r + b) / 2 - g;
  return r >= 120 && b >= 95 && g <= 150 && magentaScore >= 42 && Math.abs(r - b) <= 125;
}

function hasTransparentNeighbor(data, info, x, y) {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= info.width || ny < 0 || ny >= info.height) {
        return true;
      }
      const offset = (ny * info.width + nx) * info.channels;
      if (data[offset + 3] < 128) {
        return true;
      }
    }
  }
  return false;
}

function computeStats(data, info) {
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  let dirtyEdgeCount = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      if (!isVisiblePixel(data, info.channels, offset)) {
        continue;
      }
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (isSuspectPinkPurple(r, g, b, a) && hasTransparentNeighbor(data, info, x, y)) {
        dirtyEdgeCount += 1;
      }
    }
  }

  if (maxX < 0) {
    return null;
  }

  const bodyY0 = Math.floor(minY + (maxY - minY + 1) * 0.32);
  const bodyY1 = Math.floor(minY + (maxY - minY + 1) * 0.86);
  const xs = [];
  for (let y = bodyY0; y <= bodyY1; y += 1) {
    const rowXs = [];
    for (let x = minX; x <= maxX; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      if (!isVisiblePixel(data, info.channels, offset)) {
        continue;
      }
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];
      if (isSuspectPinkPurple(r, g, b, a) && hasTransparentNeighbor(data, info, x, y)) {
        continue;
      }
      rowXs.push(x);
    }
    if (rowXs.length < 2) {
      continue;
    }
    rowXs.sort((a, b) => a - b);
    const start = Math.floor(rowXs.length * 0.2);
    const end = Math.ceil(rowXs.length * 0.8);
    for (let i = start; i < end; i += 1) {
      xs.push(rowXs[i]);
    }
  }
  xs.sort((a, b) => a - b);
  const anchorX = xs.length ? xs[Math.floor(xs.length / 2)] : Math.round((minX + maxX) / 2);

  return {
    minX,
    minY,
    maxX,
    maxY,
    footY: maxY,
    anchorX,
    dirtyEdgeCount,
  };
}

function setPixel(buf, width, x, y, color) {
  if (x < 0 || x >= width || y < 0) {
    return;
  }
  const offset = (y * width + x) * 4;
  if (offset < 0 || offset + 3 >= buf.length) {
    return;
  }
  buf[offset] = color[0];
  buf[offset + 1] = color[1];
  buf[offset + 2] = color[2];
  buf[offset + 3] = color[3];
}

function drawLine(buf, width, x0, y0, x1, y1, color) {
  if (x0 === x1) {
    const start = Math.min(y0, y1);
    const end = Math.max(y0, y1);
    for (let y = start; y <= end; y += 1) {
      setPixel(buf, width, x0, y, color);
    }
    return;
  }
  if (y0 === y1) {
    const start = Math.min(x0, x1);
    const end = Math.max(x0, x1);
    for (let x = start; x <= end; x += 1) {
      setPixel(buf, width, x, y0, color);
    }
  }
}

function drawRect(buf, width, x0, y0, x1, y1, color) {
  drawLine(buf, width, x0, y0, x1, y0, color);
  drawLine(buf, width, x0, y1, x1, y1, color);
  drawLine(buf, width, x0, y0, x0, y1, color);
  drawLine(buf, width, x1, y0, x1, y1, color);
}

function drawCross(buf, width, x, y, color) {
  drawLine(buf, width, x - 4, y, x + 4, y, color);
  drawLine(buf, width, x, y - 4, x, y + 4, color);
}

function renderFrameCell(data, info, stats) {
  const width = info.width * SCALE;
  const height = LABEL_H + info.height * SCALE;
  const buf = Buffer.alloc(width * height * 4);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const checker = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
      setPixel(buf, width, x, y, checker ? COLORS.bgA : COLORS.bgB);
    }
  }

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const offset = (y * info.width + x) * info.channels;
      const targetX0 = x * SCALE;
      const targetY0 = LABEL_H + y * SCALE;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const a = data[offset + 3];
      if (a < 128) {
        continue;
      }
      const color = isSuspectPinkPurple(r, g, b, a) && hasTransparentNeighbor(data, info, x, y)
        ? COLORS.dirty
        : [r, g, b, 255];
      for (let dy = 0; dy < SCALE; dy += 1) {
        for (let dx = 0; dx < SCALE; dx += 1) {
          setPixel(buf, width, targetX0 + dx, targetY0 + dy, color);
        }
      }
    }
  }

  if (stats) {
    drawRect(
      buf,
      width,
      stats.minX * SCALE,
      LABEL_H + stats.minY * SCALE,
      (stats.maxX + 1) * SCALE - 1,
      LABEL_H + (stats.maxY + 1) * SCALE - 1,
      COLORS.bbox
    );
    drawLine(
      buf,
      width,
      0,
      LABEL_H + stats.footY * SCALE,
      width - 1,
      LABEL_H + stats.footY * SCALE,
      COLORS.foot
    );
    drawCross(buf, width, stats.anchorX * SCALE, LABEL_H + stats.footY * SCALE, COLORS.anchor);
  }

  return { buf, width, height };
}

function svgLabel(text, width, height, align = 'left') {
  const x = align === 'center' ? width / 2 : 2;
  const anchor = align === 'center' ? 'middle' : 'start';
  return Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#111"/>
      <text x="${x}" y="${height - 4}" fill="#fff" font-size="10" font-family="monospace" text-anchor="${anchor}">${text}</text>
    </svg>`
  );
}

async function renderCharacter(key, dirName) {
  const dir = path.join(FRAMES_DIR, dirName);
  const files = fs.readdirSync(dir).filter((file) => /^\d+\.png$/i.test(file)).sort(numericPngSort);
  const frames = [];

  for (const file of files) {
    const { data, info } = await sharp(path.join(dir, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const stats = computeStats(data, info);
    if (!stats) {
      continue;
    }
    const cell = renderFrameCell(data, info, stats);
    frames.push({ file, stats, cell });
  }

  const cellW = Math.max(...frames.map((frame) => frame.cell.width));
  const cellH = Math.max(...frames.map((frame) => frame.cell.height));
  const cols = Math.min(GRID_COLS, frames.length);
  const rows = Math.ceil(frames.length / cols);
  const width = cols * cellW + Math.max(0, cols - 1) * GAP;
  const height = TITLE_H + rows * cellH + Math.max(0, rows - 1) * GAP;
  const composites = [
    {
      input: svgLabel(`${key}  bbox=green foot=yellow anchor=red dirty-pink=magenta`, width, TITLE_H, 'center'),
      left: 0,
      top: 0,
    },
  ];

  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = col * (cellW + GAP);
    const top = TITLE_H + row * (cellH + GAP);
    const label = svgLabel(`${frame.file} ax=${frame.stats.anchorX} d=${frame.stats.dirtyEdgeCount}`, frame.cell.width, LABEL_H);
    composites.push({
      input: frame.cell.buf,
      raw: { width: frame.cell.width, height: frame.cell.height, channels: 4 },
      left,
      top,
    });
    composites.push({ input: label, left, top });
  }

  const outPath = path.join(OUT_DIR, `${key}.png`);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 20, g: 20, b: 24, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  const anchors = frames.map((frame) => frame.stats.anchorX);
  return {
    key,
    frames: frames.length,
    anchorMin: Math.min(...anchors),
    anchorMax: Math.max(...anchors),
    dirty: frames.reduce((sum, frame) => sum + frame.stats.dirtyEdgeCount, 0),
  };
}

async function main() {
  ensureEmptyDir(OUT_DIR);
  const summary = [];

  for (const [key, dirName] of Object.entries(CHAR_DIRS)) {
    const item = await renderCharacter(key, dirName);
    summary.push(item);
    console.log(
      `${key.padEnd(10)} frames=${String(item.frames).padStart(3)} anchor=${item.anchorMin}-${item.anchorMax} dirty=${item.dirty}`
    );
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`\nDebug dir: ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
