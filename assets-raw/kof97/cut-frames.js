/**
 * Stage 1: cut full-size KOF97 frames from juese strips.
 *
 * Input:
 *   assets-raw/kof97/juese/<Character>/<number>.png
 *
 * Output:
 *   assets-raw/kof97/frames-out/<Character>/<globalIndex>.png
 *   assets-raw/kof97/frames-out-report.json
 *
 * Rules:
 *   1. Keep original frame pixels and original strip height.
 *   2. Split only by black / dark-purple separator columns.
 *   3. Remove pink background by turning it transparent.
 *   4. Do not crop bbox, do not resize, do not recenter here.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const IN_DIR = path.join(__dirname, 'juese');
const OUT_DIR = path.join(__dirname, 'frames-out');
const REPORT_FILE = path.join(__dirname, 'frames-out-report.json');

const MAX_SEPARATOR_GAP = 1;
const SEP_MATCH_RATIO = 0.9;
const SEP_TOLERANCE = 24;
const BLACK_TOLERANCE = 18;
const TOP_BLACK_ROW_MATCH_RATIO = 0.9;
const TOP_BLACK_ROW_BLACK_RATIO = 0.98;

const SEP_COLORS = [
  [0x00, 0x00, 0x00],
  [0x08, 0x08, 0x08],
  [0x4b, 0x00, 0x4b],
  [0x58, 0x00, 0x58],
  [0x70, 0x00, 0x70],
  [0xa7, 0x00, 0xa7],
  [0xb4, 0x00, 0xb4],
];

const PINK_CENTERS = [
  [0xff, 0x00, 0xff],
  [0xc8, 0x00, 0xc8],
  [0xb7, 0x00, 0xb7],
  [0xa7, 0x00, 0xa7],
  [0x70, 0x00, 0x70],
  [0x58, 0x00, 0x58],
  [0x4b, 0x00, 0x4b],
  [0xdc, 0x14, 0xae],
  [0xe8, 0x55, 0xae],
];

function ensureEmptyDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function compareNumericFile(a, b) {
  return Number.parseInt(a, 10) - Number.parseInt(b, 10);
}

function colorNear(r, g, b, [cr, cg, cb], tolerance) {
  return (
    Math.abs(r - cr) <= tolerance &&
    Math.abs(g - cg) <= tolerance &&
    Math.abs(b - cb) <= tolerance
  );
}

function isSeparatorPixel(r, g, b, a) {
  if (a === 0) {
    return true;
  }
  return SEP_COLORS.some((color) => colorNear(r, g, b, color, SEP_TOLERANCE));
}

function isNearBlack(r, g, b) {
  return r <= BLACK_TOLERANCE && g <= BLACK_TOLERANCE && b <= BLACK_TOLERANCE;
}

function isPink(r, g, b) {
  if (r < 50 || b < 50) return false;
  if (g >= r - 30) return false;
  if (g >= b - 30) return false;
  if (Math.abs(r - b) > 80) return false;
  return true;
}

function pinkDist(r, g, b) {
  let min = Number.POSITIVE_INFINITY;
  for (const [pr, pg, pb] of PINK_CENTERS) {
    const d = Math.sqrt((r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2);
    if (d < min) {
      min = d;
    }
  }
  return min;
}

function isPinkCombined(r, g, b) {
  return isPink(r, g, b) || pinkDist(r, g, b) <= 40;
}

function findSeparatorColumns(rawData, info) {
  const cols = [];
  const { width, height, channels } = info;

  for (let x = 0; x < width; x += 1) {
    let matched = 0;
    for (let y = 0; y < height; y += 1) {
      const i = (y * width + x) * channels;
      const r = rawData[i];
      const g = rawData[i + 1];
      const b = rawData[i + 2];
      const a = channels === 4 ? rawData[i + 3] : 255;
      if (isSeparatorPixel(r, g, b, a)) {
        matched += 1;
      }
    }
    if (matched / height >= SEP_MATCH_RATIO) {
      cols.push(x);
    }
  }

  return cols;
}

function mergeColumns(cols) {
  if (cols.length === 0) {
    return [];
  }

  const segments = [];
  let start = cols[0];
  let end = cols[0];

  for (let i = 1; i < cols.length; i += 1) {
    const gap = cols[i] - end - 1;
    if (gap <= MAX_SEPARATOR_GAP) {
      end = cols[i];
      continue;
    }
    segments.push([start, end]);
    start = cols[i];
    end = cols[i];
  }

  segments.push([start, end]);
  return segments;
}

function isBoundarySegment([start, end], width) {
  return start === 0 || end === width - 1;
}

function buildFrameBoxes(separatorSegments, width) {
  const internalSegments = separatorSegments.filter((segment) => !isBoundarySegment(segment, width));
  const leftBound =
    separatorSegments.length > 0 && separatorSegments[0][0] === 0
      ? separatorSegments[0][1] + 1
      : 0;
  const lastSegment = separatorSegments[separatorSegments.length - 1];
  const rightBound =
    lastSegment && lastSegment[1] === width - 1
      ? lastSegment[0] - 1
      : width - 1;

  const rawBoxes = [];
  let prev = leftBound;
  for (const [start, end] of internalSegments) {
    if (start - 1 >= prev) {
      rawBoxes.push([prev, start - 1]);
    }
    prev = end + 1;
  }
  if (rightBound >= prev) {
    rawBoxes.push([prev, rightBound]);
  }

  const kept = rawBoxes.filter(([left, right]) => right >= left);
  const dropped = rawBoxes.filter(([left, right]) => right < left);

  if (kept.length === 0) {
    return {
      rawBoxes,
      keptBoxes: [[0, width - 1]],
      droppedBoxes: rawBoxes,
      fallbackSingleFrame: true,
    };
  }

  return {
    rawBoxes,
    keptBoxes: kept,
    droppedBoxes: dropped,
    fallbackSingleFrame: internalSegments.length === 0,
  };
}

async function analyzeStrip(filePath) {
  const image = sharp(filePath);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const separatorColumns = findSeparatorColumns(data, info);
  const separatorSegments = mergeColumns(separatorColumns);
  const boxes = buildFrameBoxes(separatorSegments, info.width);

  return {
    width: info.width,
    height: info.height,
    channels: info.channels,
    separatorSegments,
    ...boxes,
  };
}

function buildFrameMetadata(boxes, sourceHeight, globalFrameStart) {
  return boxes.map(([left, right], index) => ({
    index,
    globalIndex: globalFrameStart + index,
    left,
    right,
    width: right - left + 1,
    height: sourceHeight,
  }));
}

async function cutAndClearPink(filePath, frame) {
  const { data, info } = await sharp(filePath)
    .extract({ left: frame.left, top: 0, width: frame.width, height: frame.height })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(frame.width * frame.height * 4);

  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      const srcIndex = (y * frame.width + x) * info.channels;
      const dstIndex = (y * frame.width + x) * 4;
      const r = data[srcIndex];
      const g = data[srcIndex + 1];
      const b = data[srcIndex + 2];
      const a = info.channels === 4 ? data[srcIndex + 3] : 255;

      if (a === 0 || isPinkCombined(r, g, b)) {
        out[dstIndex] = 0;
        out[dstIndex + 1] = 0;
        out[dstIndex + 2] = 0;
        out[dstIndex + 3] = 0;
        continue;
      }

      out[dstIndex] = r;
      out[dstIndex + 1] = g;
      out[dstIndex + 2] = b;
      out[dstIndex + 3] = a;
    }
  }

  // Some strips keep a full-width black block above the sprite body.
  // Clear only the contiguous top rows that are almost entirely black background,
  // while preserving frame height and original sprite positioning.
  for (let y = 0; y < frame.height; y += 1) {
    let opaque = 0;
    let blackOpaque = 0;

    for (let x = 0; x < frame.width; x += 1) {
      const dstIndex = (y * frame.width + x) * 4;
      const r = out[dstIndex];
      const g = out[dstIndex + 1];
      const b = out[dstIndex + 2];
      const a = out[dstIndex + 3];

      if (a === 0) {
        continue;
      }

      opaque += 1;
      if (isNearBlack(r, g, b)) {
        blackOpaque += 1;
      }
    }

    const isTransparentRow = opaque === 0;
    const isTopBlackBackground =
      opaque / frame.width >= TOP_BLACK_ROW_MATCH_RATIO &&
      blackOpaque / Math.max(opaque, 1) >= TOP_BLACK_ROW_BLACK_RATIO;

    if (!isTransparentRow && !isTopBlackBackground) {
      break;
    }

    if (isTopBlackBackground) {
      for (let x = 0; x < frame.width; x += 1) {
        const dstIndex = (y * frame.width + x) * 4;
        out[dstIndex] = 0;
        out[dstIndex + 1] = 0;
        out[dstIndex + 2] = 0;
        out[dstIndex + 3] = 0;
      }
    }
  }

  return {
    data: out,
    info: {
      width: frame.width,
      height: frame.height,
      channels: 4,
    },
  };
}

function summarizeWarnings(analysis) {
  const warnings = [];
  if (analysis.fallbackSingleFrame) {
    warnings.push('single-frame/no-internal-separator');
  }
  if (analysis.droppedBoxes.length > 0) {
    warnings.push(`dropped-invalid:${analysis.droppedBoxes.length}`);
  }
  return warnings;
}

async function main() {
  if (!fs.existsSync(IN_DIR)) {
    throw new Error(`Input directory not found: ${IN_DIR}`);
  }

  ensureEmptyDir(OUT_DIR);

  const report = {
    generatedAt: new Date().toISOString(),
    inputDir: IN_DIR,
    outputDir: OUT_DIR,
    mode: 'cut-fullsize-transparent',
    settings: {
      maxSeparatorGap: MAX_SEPARATOR_GAP,
      separatorMatchRatio: SEP_MATCH_RATIO,
      separatorTolerance: SEP_TOLERANCE,
      separatorColors: SEP_COLORS,
      pinkCenters: PINK_CENTERS,
    },
    characters: [],
  };

  const characterDirs = fs
    .readdirSync(IN_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  for (const character of characterDirs) {
    const charInDir = path.join(IN_DIR, character);
    const charOutDir = path.join(OUT_DIR, character);
    ensureDir(charOutDir);

    const strips = fs
      .readdirSync(charInDir)
      .filter((file) => /^\d+\.png$/i.test(file))
      .sort(compareNumericFile);

    const charReport = {
      character,
      stripCount: strips.length,
      totalFrames: 0,
      strips: [],
    };

    for (const stripFile of strips) {
      const filePath = path.join(charInDir, stripFile);
      const analysis = await analyzeStrip(filePath);
      const frameInfos = buildFrameMetadata(
        analysis.keptBoxes,
        analysis.height,
        charReport.totalFrames
      );

      for (const frame of frameInfos) {
        const cut = await cutAndClearPink(filePath, frame);
        const outPath = path.join(charOutDir, `${frame.globalIndex}.png`);
        await sharp(cut.data, { raw: cut.info }).png().toFile(outPath);
      }

      charReport.totalFrames += frameInfos.length;
      charReport.strips.push({
        source: stripFile,
        sourceWidth: analysis.width,
        sourceHeight: analysis.height,
        frameCount: frameInfos.length,
        frameWidths: frameInfos.map((frame) => frame.width),
        frames: frameInfos,
        warnings: summarizeWarnings(analysis),
      });
    }

    report.characters.push(charReport);
    console.log(
      `${character.padEnd(9)} strips=${String(charReport.stripCount).padStart(2)} frames=${String(
        charReport.totalFrames
      ).padStart(3)}`
    );
  }

  fs.writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nFrames out: ${OUT_DIR}`);
  console.log(`Report: ${REPORT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
