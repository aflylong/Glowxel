/**
 * Preview-cut KOF97 juese action strips.
 *
 * Input:
 *   assets-raw/kof97/juese/<Character>/<number>.png
 *
 * Output:
 *   assets-raw/kof97/juese-frames-preview/<Character>/<strip>_compare.png
 *   assets-raw/kof97/juese-cut-report.json
 *
 * This script is intentionally compare-only. It does not touch frames-out,
 * website/src/utils, firmware generated headers, or write cut frame pngs.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const IN_DIR = path.join(__dirname, 'juese');
const OUT_DIR = path.join(__dirname, 'juese-frames-preview');
const REPORT_FILE = path.join(__dirname, 'juese-cut-report.json');

const MAX_SEPARATOR_GAP = 1;
const SEP_MATCH_RATIO = 0.9;
const SEP_TOLERANCE = 24;

const SEP_COLORS = [
  [0x00, 0x00, 0x00],
  [0x08, 0x08, 0x08],
  [0x4b, 0x00, 0x4b],
  [0x58, 0x00, 0x58],
  [0x70, 0x00, 0x70],
  [0xa7, 0x00, 0xa7],
  [0xb4, 0x00, 0xb4],
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
    fallbackSingleFrame: separatorSegments.filter((segment) => !isBoundarySegment(segment, width)).length === 0,
  };
}

async function analyzeStrip(filePath) {
  const image = sharp(filePath);
  const meta = await image.metadata();
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
    meta,
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

function titleSvg(text, boxWidth, labelHeight) {
  return Buffer.from(
    `<svg width="${boxWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#111"/>
      <text x="4" y="11" fill="#fff" font-size="10" font-family="monospace">${text}</text>
    </svg>`
  );
}

function sourceOverlaySvg(frameInfos, sourceWidth, sourceHeight) {
  const rects = frameInfos
    .map(
      (frame) => `
        <rect x="${frame.left + 0.5}" y="0.5" width="${Math.max(frame.width - 1, 1)}" height="${Math.max(
          sourceHeight - 1,
          1
        )}" fill="none" stroke="#00e5ff" stroke-width="1"/>
        <rect x="${frame.left + 1}" y="1" width="14" height="11" fill="rgba(0,0,0,0.72)"/>
        <text x="${frame.left + 3}" y="10" fill="#ffffff" font-size="9" font-family="monospace">${frame.index}</text>
      `
    )
    .join('');

  return Buffer.from(
    `<svg width="${sourceWidth}" height="${sourceHeight}" xmlns="http://www.w3.org/2000/svg">
      ${rects}
    </svg>`
  );
}

async function writeStripCompare(filePath, outDir, compareBase, frameInfos, sourceWidth, sourceHeight) {
  if (frameInfos.length === 0) {
    return null;
  }

  const padding = 8;
  const sectionGap = 8;
  const labelHeight = 14;
  const frameGap = 4;
  const bottomWidth =
    frameInfos.reduce((sum, frame) => sum + frame.width, 0) + frameGap * Math.max(0, frameInfos.length - 1);
  const bottomHeight = sourceHeight + labelHeight;
  const width = Math.max(sourceWidth, bottomWidth) + padding * 2;
  const height = padding + labelHeight + sourceHeight + sectionGap + labelHeight + bottomHeight + padding;

  const sourceLeft = Math.floor((width - sourceWidth) / 2);
  const bottomLeft = Math.floor((width - bottomWidth) / 2);
  const sourceTop = padding + labelHeight;
  const bottomTop = padding + labelHeight + sourceHeight + sectionGap + labelHeight;
  const composites = [
    {
      input: titleSvg('source strip', width - padding * 2, labelHeight),
      left: padding,
      top: padding,
    },
    {
      input: filePath,
      left: sourceLeft,
      top: sourceTop,
    },
    {
      input: sourceOverlaySvg(frameInfos, sourceWidth, sourceHeight),
      left: sourceLeft,
      top: sourceTop,
    },
    {
      input: titleSvg('cut preview', width - padding * 2, labelHeight),
      left: padding,
      top: padding + labelHeight + sourceHeight + sectionGap,
    },
  ];

  let currentLeft = bottomLeft;
  for (const frame of frameInfos) {
    const frameImage = await sharp(filePath)
      .extract({ left: frame.left, top: 0, width: frame.width, height: sourceHeight })
      .png()
      .toBuffer();
    const label = Buffer.from(
      `<svg width="${frame.width}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#111"/>
        <text x="2" y="9" fill="#fff" font-size="9" font-family="monospace">${frame.index}</text>
      </svg>`
    );
    composites.push({
      input: label,
      left: currentLeft,
      top: bottomTop,
    });
    composites.push({
      input: frameImage,
      left: currentLeft,
      top: bottomTop + labelHeight,
    });
    currentLeft += frame.width + frameGap;
  }

  const compareName = `${compareBase}_compare.png`;
  const comparePath = path.join(outDir, compareName);
  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 32, g: 32, b: 32, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(comparePath);

  return compareName;
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
    mode: 'compare-only',
    settings: {
      maxSeparatorGap: MAX_SEPARATOR_GAP,
      separatorMatchRatio: SEP_MATCH_RATIO,
      separatorTolerance: SEP_TOLERANCE,
      separatorColors: SEP_COLORS,
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
      const stripBase = path.basename(stripFile, path.extname(stripFile)).padStart(2, '0');
      const analysis = await analyzeStrip(filePath);
      const frameInfos = buildFrameMetadata(
        analysis.keptBoxes,
        analysis.height,
        charReport.totalFrames
      );
      const compareImage = await writeStripCompare(
        filePath,
        charOutDir,
        stripBase,
        frameInfos,
        analysis.width,
        analysis.height
      );
      const widths = frameInfos.map((frame) => frame.width);
      const warnings = summarizeWarnings(analysis);

      charReport.totalFrames += frameInfos.length;
      charReport.strips.push({
        source: stripFile,
        sourceWidth: analysis.width,
        sourceHeight: analysis.height,
        separatorSegmentCount: analysis.separatorSegments.length,
        internalSeparatorCount: analysis.separatorSegments.filter(
          (segment) => !isBoundarySegment(segment, analysis.width)
        ).length,
        rawFrameCount: analysis.rawBoxes.length,
        frameCount: frameInfos.length,
        droppedInvalidCount: analysis.droppedBoxes.length,
        frameWidths: widths,
        compareImage,
        frames: frameInfos,
        warnings,
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
  console.log(`\nPreview frames: ${OUT_DIR}`);
  console.log(`Report: ${REPORT_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
