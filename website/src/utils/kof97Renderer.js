import { KOF_HEADS } from './kof97Sprites.js';

const SCREEN_W = 64;
const SCREEN_H = 64;
const TV_FRAME = {
  sx0: 4,
  sy0: 4,
  scrw: 56,
  scrh: 45,
  bg: '#0a3870',
  tvBlack: '#1a1a1a',
  tvDark: '#0a0a0a',
  tvEdge: '#000000',
  panel: '#f0f0f0',
  p1Highlight: '#e80000',
  p2Highlight: '#3870ff',
  timeColor: '#00ff66',
  baseTop: 51,
  baseBot: 58,
  baseLeft: 12,
  baseRightInset: 12,
  slotY0: 53,
  slotY1: 57,
  timeX: 31,
  timeY: 53,
  footTop: 63,
  footBot: 63,
  footLx0: 8,
  footLx1: 16,
  ledY: 61,
  led1x: 18,
  led2x: 22,
  led3x: 26,
  led4x: 45,
  charXLeft: 14,
  charXRight: 40,
  charY: 42,
};

export const KOF97_DEFAULT_CHAR_Y = TV_FRAME.charY;

export const KOF97_SCREEN_RECT = {
  x: TV_FRAME.sx0,
  y: TV_FRAME.sy0,
  width: TV_FRAME.scrw,
  height: TV_FRAME.scrh,
};

export const KOF_CHAR_KEYS = [
  'kyo',
  'iori',
  'terry',
  'andy',
  'benimaru',
  'mai',
  'ryo',
  'goro',
  'chang',
  'choi',
  'shermie',
  'yashiro',
  'chizuru',
  'orochi',
];

const EMPTY_STANCES = Object.freeze({});

const TV = {
  bg: TV_FRAME.bg,
  shellBlack: TV_FRAME.tvBlack,
  shellDark: TV_FRAME.tvDark,
  shellEdge: TV_FRAME.tvEdge,
  panel: TV_FRAME.panel,
  p1Highlight: TV_FRAME.p1Highlight,
  p2Highlight: TV_FRAME.p2Highlight,
  time: TV_FRAME.timeColor,
};

const CHARACTER_LAYOUT = {
  p1X: TV_FRAME.charXLeft,
  p2X: TV_FRAME.charXRight,
  footY: TV_FRAME.charY,
  charFrameInterval: 4,
  selectInterval: 1,
};

const FONT_3X5 = {
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '010', '010'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  ':': ['000', '010', '000', '010', '000'],
};

function setPixel(pixels, x, y, color) {
  if (x < 0 || x >= SCREEN_W || y < 0 || y >= SCREEN_H || !color) {
    return;
  }
  pixels.set(`${x},${y}`, color);
}

function fillRect(pixels, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      setPixel(pixels, x, y, color);
    }
  }
}

function drawRectBorder(pixels, x0, y0, x1, y1, color) {
  for (let x = x0; x <= x1; x += 1) {
    setPixel(pixels, x, y0, color);
    setPixel(pixels, x, y1, color);
  }
  for (let y = y0; y <= y1; y += 1) {
    setPixel(pixels, x0, y, color);
    setPixel(pixels, x1, y, color);
  }
}

function drawText3x5(pixels, text, x, y, color) {
  let cursorX = x;
  for (const char of text) {
    const glyph = FONT_3X5[char];
    if (!glyph) {
      continue;
    }
    if (char === ':') {
      for (let row = 0; row < glyph.length; row += 1) {
        if (glyph[row][1] === '1') {
          setPixel(pixels, cursorX, y + row, color);
        }
      }
      cursorX += 2;
      continue;
    }
    for (let row = 0; row < glyph.length; row += 1) {
      for (let col = 0; col < glyph[row].length; col += 1) {
        if (glyph[row][col] === '1') {
          setPixel(pixels, cursorX + col, y + row, color);
        }
      }
    }
    cursorX += glyph[0].length + 1;
  }
}

function rebuildFrame(frameData, frameIndex) {
  const { base, deltas } = frameData;
  const totalFrames = 1 + deltas.length;
  const safeFrameIndex = totalFrames > 0
    ? ((Math.max(0, frameIndex) % totalFrames) + totalFrames) % totalFrames
    : 0;
  const pixels = base.slice();
  if (safeFrameIndex === 0) {
    return pixels;
  }
  const delta = deltas[safeFrameIndex - 1];
  for (const key of Object.keys(delta)) {
    pixels[Number.parseInt(key, 10)] = delta[key];
  }
  return pixels;
}

function expandPackedFrameData(frameData, palette) {
  const totalPixels = frameData.w * frameData.h;
  const base = new Array(totalPixels).fill(null);
  const packedBase = Array.isArray(frameData.base) ? frameData.base : [];
  for (let i = 0; i < packedBase.length; i += 2) {
    const pixelIndex = packedBase[i];
    const colorIndex = packedBase[i + 1];
    base[pixelIndex] = colorIndex >= 0 ? palette[colorIndex] ?? null : null;
  }

  const deltas = (Array.isArray(frameData.deltas) ? frameData.deltas : []).map((packedDelta) => {
    const delta = {};
    for (let i = 0; i < packedDelta.length; i += 2) {
      const pixelIndex = packedDelta[i];
      const colorIndex = packedDelta[i + 1];
      delta[pixelIndex] = colorIndex >= 0 ? palette[colorIndex] ?? null : null;
    }
    return delta;
  });

  return {
    w: frameData.w,
    h: frameData.h,
    base,
    deltas,
  };
}

export async function loadKof97Stances() {
  const response = await fetch(`${import.meta.env.BASE_URL}kof97/stances.json`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to load KOF97 stance data: ${response.status}`);
  }
  const payload = await response.json();
  const palette = Array.isArray(payload.palette) ? payload.palette : [];
  const characters = payload.characters ?? {};
  const stances = {};

  for (const [key, frameData] of Object.entries(characters)) {
    stances[key] = expandPackedFrameData(frameData, palette);
  }

  return stances;
}

function assertPositiveScale(scale, label) {
  if (!Number.isFinite(scale) || scale <= 0) {
    throw new Error(`${label} scale must be a positive number`);
  }
}

function drawKofTimeText(pixels, text, x, y) {
  const safeText = typeof text === 'string' ? text : '';
  const leftText = safeText.slice(0, 2);
  const rightText = safeText.slice(3, 5);
  const startX = x - 8;
  drawText3x5(pixels, leftText, startX, y, TV.p1Highlight);
  drawText3x5(pixels, ':', startX + 8, y, TV.time);
  drawText3x5(pixels, rightText, startX + 10, y, TV.p2Highlight);
}

function drawScreenBackground(pixels, backgroundPixels) {
  for (let y = 0; y < KOF97_SCREEN_RECT.height; y += 1) {
    for (let x = 0; x < KOF97_SCREEN_RECT.width; x += 1) {
      const color = backgroundPixels[y * KOF97_SCREEN_RECT.width + x];
      if (!color) {
        continue;
      }
      setPixel(pixels, KOF97_SCREEN_RECT.x + x, KOF97_SCREEN_RECT.y + y, color);
    }
  }
}

const CENTER_SAMPLE_POINTS = [
  [0.5, 0.5],
  [0.35, 0.35],
  [0.65, 0.35],
  [0.35, 0.65],
  [0.65, 0.65],
];
const DENSE_COVERAGE_THRESHOLD = 0.38;

function addColorCount(colorCounts, color) {
  const current = colorCounts.get(color);
  colorCounts.set(color, current === undefined ? 1 : current + 1);
}

function getDominantColor(colorCounts) {
  let bestColor = null;
  let bestCount = -1;
  for (const [color, count] of colorCounts.entries()) {
    if (count > bestCount) {
      bestColor = color;
      bestCount = count;
    }
  }
  return bestColor;
}

function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getFramePixel(framePixels, frameData, x, y) {
  return framePixels[y * frameData.w + x];
}

function sampleCenterArea(framePixels, frameData, sourceX0, sourceY0, sourceX1, sourceY1) {
  const colorCounts = new Map();
  const spanX = sourceX1 - sourceX0;
  const spanY = sourceY1 - sourceY0;

  for (const point of CENTER_SAMPLE_POINTS) {
    const x = clampInt(Math.floor(sourceX0 + spanX * point[0]), 0, frameData.w - 1);
    const y = clampInt(Math.floor(sourceY0 + spanY * point[1]), 0, frameData.h - 1);
    const color = getFramePixel(framePixels, frameData, x, y);
    if (color) {
      addColorCount(colorCounts, color);
    }
  }

  if (colorCounts.size === 0) {
    return null;
  }
  return getDominantColor(colorCounts);
}

function sampleDenseArea(framePixels, frameData, sourceX0, sourceY0, sourceX1, sourceY1) {
  const xStart = clampInt(Math.floor(sourceX0), 0, frameData.w - 1);
  const yStart = clampInt(Math.floor(sourceY0), 0, frameData.h - 1);
  const xEnd = clampInt(Math.ceil(sourceX1) - 1, 0, frameData.w - 1);
  const yEnd = clampInt(Math.ceil(sourceY1) - 1, 0, frameData.h - 1);
  const colorCounts = new Map();
  let sampleCount = 0;
  let opaqueCount = 0;

  for (let y = yStart; y <= yEnd; y += 1) {
    for (let x = xStart; x <= xEnd; x += 1) {
      sampleCount += 1;
      const color = getFramePixel(framePixels, frameData, x, y);
      if (color) {
        opaqueCount += 1;
        addColorCount(colorCounts, color);
      }
    }
  }

  if (sampleCount === 0 || opaqueCount / sampleCount < DENSE_COVERAGE_THRESHOLD) {
    return null;
  }
  return getDominantColor(colorCounts);
}

function collectNeighborColors(scaledPixels, width, height, x, y) {
  const colorCounts = new Map();
  const neighbors = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  for (const [dx, dy] of neighbors) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
      continue;
    }
    const color = scaledPixels[ny * width + nx];
    if (color) {
      addColorCount(colorCounts, color);
    }
  }

  return colorCounts;
}

function hasColorOnBothSides(scaledPixels, width, height, x, y, dx, dy) {
  const px = x - dx;
  const py = y - dy;
  const nx = x + dx;
  const ny = y + dy;
  if (px < 0 || px >= width || py < 0 || py >= height || nx < 0 || nx >= width || ny < 0 || ny >= height) {
    return false;
  }
  return !!scaledPixels[py * width + px] && !!scaledPixels[ny * width + nx];
}

function fillInternalPinholes(scaledPixels, width, height) {
  const nextPixels = scaledPixels.slice();

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (scaledPixels[index]) {
        continue;
      }

      const horizontal = hasColorOnBothSides(scaledPixels, width, height, x, y, 1, 0);
      const vertical = hasColorOnBothSides(scaledPixels, width, height, x, y, 0, 1);
      const diagonalA = hasColorOnBothSides(scaledPixels, width, height, x, y, 1, 1);
      const diagonalB = hasColorOnBothSides(scaledPixels, width, height, x, y, 1, -1);
      if (!(horizontal && vertical) && !(horizontal && (diagonalA || diagonalB)) && !(vertical && (diagonalA || diagonalB))) {
        continue;
      }

      const colorCounts = collectNeighborColors(scaledPixels, width, height, x, y);
      if (colorCounts.size > 0) {
        nextPixels[index] = getDominantColor(colorCounts);
      }
    }
  }

  return nextPixels;
}

function drawScaledStanceFrame(pixels, footX, footY, frameData, frameIndex, mirror, scale) {
  assertPositiveScale(scale, 'KOF97 stance');

  const framePixels = rebuildFrame(frameData, frameIndex);
  const scaledW = Math.max(1, Math.round(frameData.w * scale));
  const scaledH = Math.max(1, Math.round(frameData.h * scale));
  const leftX = footX - Math.floor(scaledW / 2);
  const topY = footY - scaledH + 1;
  const scaledPixels = new Array(scaledW * scaledH).fill(null);

  for (let y = 0; y < scaledH; y += 1) {
    const sourceY0 = (y * frameData.h) / scaledH;
    const sourceY1 = ((y + 1) * frameData.h) / scaledH;
    for (let x = 0; x < scaledW; x += 1) {
      let sourceX0 = (x * frameData.w) / scaledW;
      let sourceX1 = ((x + 1) * frameData.w) / scaledW;
      if (mirror) {
        const mirroredX0 = frameData.w - sourceX1;
        const mirroredX1 = frameData.w - sourceX0;
        sourceX0 = mirroredX0;
        sourceX1 = mirroredX1;
      }

      let color = sampleCenterArea(framePixels, frameData, sourceX0, sourceY0, sourceX1, sourceY1);
      if (!color) {
        color = sampleDenseArea(framePixels, frameData, sourceX0, sourceY0, sourceX1, sourceY1);
      }
      if (!color) {
        continue;
      }
      scaledPixels[y * scaledW + x] = color;
    }
  }

  const filledPixels = fillInternalPinholes(scaledPixels, scaledW, scaledH);
  for (let y = 0; y < scaledH; y += 1) {
    for (let x = 0; x < scaledW; x += 1) {
      const color = filledPixels[y * scaledW + x];
      if (color) {
        setPixel(pixels, leftX + x, topY + y, color);
      }
    }
  }
}

function drawSprite(pixels, dx, dy, sprite) {
  for (let y = 0; y < sprite.h; y += 1) {
    for (let x = 0; x < sprite.w; x += 1) {
      const color = sprite.p[y * sprite.w + x];
      if (!color) {
        continue;
      }
      setPixel(pixels, dx + x, dy + y, color);
    }
  }
}

function drawPortraits(pixels, state) {
  const portraitW = 4;
  const portraitH = 4;
  const border = 1;
  const cellW = portraitW + border * 2;
  const cellH = portraitH + border * 2;
  const gap = 1;
  const cols = 7;
  const rows = 2;
  const totalW = cols * cellW + (cols - 1) * gap;
  const totalH = rows * cellH + (rows - 1) * gap;
  const startX = TV_FRAME.sx0 + Math.floor((TV_FRAME.scrw - totalW) / 2);
  const startY = TV_FRAME.sy0 + 2;

  for (let index = 0; index < cols * rows; index += 1) {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const cellX = startX + col * (cellW + gap);
    const cellY = startY + row * (cellH + gap);

    let borderColor = TV.panel;
    if (index === state.selectP1) {
      borderColor = TV.p1Highlight;
    }
    if (index === state.selectP2) {
      borderColor = TV.p2Highlight;
    }

    drawRectBorder(pixels, cellX, cellY, cellX + cellW - 1, cellY + cellH - 1, borderColor);

    const charKey = KOF_CHAR_KEYS[index];
    const head = KOF_HEADS[charKey];
    if (head) {
      drawSprite(pixels, cellX + border, cellY + border, head);
    }
  }
}

function drawCharacters(pixels, state, renderOptions) {
  const p1Key = KOF_CHAR_KEYS[state.selectP1];
  const p2Key = KOF_CHAR_KEYS[state.selectP2];
  const stances = renderOptions.stances;
  const p1Data = stances[p1Key];
  const p2Data = stances[p2Key];
  const footY = Number.isFinite(renderOptions.charY) ? renderOptions.charY : KOF97_DEFAULT_CHAR_Y;

  if (p1Data) {
    drawScaledStanceFrame(
      pixels,
      TV_FRAME.sx0 + CHARACTER_LAYOUT.p1X,
      TV_FRAME.sy0 + footY,
      p1Data,
      state.charFrame,
      true,
      renderOptions.p1Scale
    );
  }
  if (p2Data) {
    drawScaledStanceFrame(
      pixels,
      TV_FRAME.sx0 + CHARACTER_LAYOUT.p2X,
      TV_FRAME.sy0 + footY,
      p2Data,
      state.charFrame,
      false,
      renderOptions.p2Scale
    );
  }
}

function drawScreenContent(pixels, state, renderOptions) {
  drawScreenBackground(pixels, renderOptions.backgroundPixels);
  drawPortraits(pixels, state);
  drawCharacters(pixels, state, renderOptions);
}

function drawTvFrame(pixels, state) {
  fillRect(pixels, 0, 0, SCREEN_W - 1, TV_FRAME.sy0 - 1, TV.shellBlack);
  fillRect(pixels, 0, TV_FRAME.sy0, TV_FRAME.sx0 - 1, TV_FRAME.sy0 + TV_FRAME.scrh - 1, TV.shellBlack);
  fillRect(
    pixels,
    TV_FRAME.sx0 + TV_FRAME.scrw,
    TV_FRAME.sy0,
    SCREEN_W - 1,
    TV_FRAME.sy0 + TV_FRAME.scrh - 1,
    TV.shellBlack
  );
  fillRect(
    pixels,
    0,
    TV_FRAME.sy0 + TV_FRAME.scrh,
    SCREEN_W - 1,
    SCREEN_H - 1,
    TV.shellBlack
  );

  drawRectBorder(
    pixels,
    TV_FRAME.sx0 - 1,
    TV_FRAME.sy0 - 1,
    TV_FRAME.sx0 + TV_FRAME.scrw,
    TV_FRAME.sy0 + TV_FRAME.scrh,
    TV.shellEdge
  );

  setPixel(pixels, 0, 0, TV.shellDark);
  setPixel(pixels, SCREEN_W - 1, 0, TV.shellDark);
  setPixel(pixels, 0, SCREEN_H - 1, TV.shellDark);
  setPixel(pixels, SCREEN_W - 1, SCREEN_H - 1, TV.shellDark);

  const baseRight = SCREEN_W - 1 - TV_FRAME.baseRightInset;
  fillRect(pixels, TV_FRAME.baseLeft, TV_FRAME.baseTop, baseRight, TV_FRAME.baseBot, TV.shellDark);
  fillRect(pixels, TV_FRAME.baseLeft, TV_FRAME.baseTop, baseRight, TV_FRAME.baseTop, TV.shellEdge);
  fillRect(pixels, TV_FRAME.baseLeft, TV_FRAME.baseTop + 1, TV_FRAME.baseLeft, TV_FRAME.baseBot, TV.shellEdge);
  fillRect(pixels, baseRight, TV_FRAME.baseTop + 1, baseRight, TV_FRAME.baseBot, TV.shellEdge);
  fillRect(pixels, TV_FRAME.baseLeft + 6, TV_FRAME.slotY0, baseRight - 6, TV_FRAME.slotY1, TV.shellBlack);
  if (TV_FRAME.baseBot + 1 < SCREEN_H) {
    fillRect(pixels, TV_FRAME.baseLeft, TV_FRAME.baseBot + 1, baseRight, TV_FRAME.baseBot + 1, TV.shellEdge);
  }
  fillRect(pixels, TV_FRAME.footLx0, TV_FRAME.footTop, TV_FRAME.footLx1, TV_FRAME.footBot, TV.shellDark);
  fillRect(
    pixels,
    SCREEN_W - 1 - TV_FRAME.footLx1,
    TV_FRAME.footTop,
    SCREEN_W - 1 - TV_FRAME.footLx0,
    TV_FRAME.footBot,
    TV.shellDark
  );
  fillRect(pixels, TV_FRAME.footLx0, TV_FRAME.footTop, TV_FRAME.footLx1, TV_FRAME.footTop, TV.shellEdge);
  fillRect(
    pixels,
    SCREEN_W - 1 - TV_FRAME.footLx1,
    TV_FRAME.footTop,
    SCREEN_W - 1 - TV_FRAME.footLx0,
    TV_FRAME.footTop,
    TV.shellEdge
  );

  setPixel(pixels, TV_FRAME.led1x, TV_FRAME.ledY, '#dcb41e');
  setPixel(pixels, TV_FRAME.led2x, TV_FRAME.ledY, '#8c8c91');
  setPixel(pixels, TV_FRAME.led3x, TV_FRAME.ledY, '#b41e1e');
  setPixel(pixels, TV_FRAME.led4x, TV_FRAME.ledY, '#50c83c');

  if (state.timeText) {
    drawKofTimeText(pixels, state.timeText, TV_FRAME.timeX, TV_FRAME.timeY);
  }
}

function formatTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function createInitialState() {
  return {
    frame: 0,
    selectP1: 0,
    selectP2: 5,
    selectTimer: 0,
    charFrame: 0,
    charTimer: 0,
    timeText: formatTime(),
  };
}

function getFrameCount(stances, key) {
  const data = stances[key];
  if (!data) {
    return 1;
  }
  return 1 + data.deltas.length;
}

export function tickScene(state, stances = EMPTY_STANCES) {
  state.frame += 1;
  state.selectTimer += 1;
  state.charTimer += 1;

  const p1Key = KOF_CHAR_KEYS[state.selectP1];
  const p2Key = KOF_CHAR_KEYS[state.selectP2];
  const totalFrames = Math.max(getFrameCount(stances, p1Key), getFrameCount(stances, p2Key));
  let cycleWrapped = false;

  if (state.frame % 30 === 0) {
    state.timeText = formatTime();
  }

  if (state.charTimer >= CHARACTER_LAYOUT.charFrameInterval) {
    state.charTimer = 0;
    state.charFrame += 1;
    if (state.charFrame >= totalFrames) {
      state.charFrame = 0;
      cycleWrapped = true;
    }
  }

  if (cycleWrapped && state.selectTimer >= CHARACTER_LAYOUT.selectInterval) {
    state.selectTimer = 0;
    let nextP1 = Math.floor(Math.random() * KOF_CHAR_KEYS.length);
    while (nextP1 === state.selectP1) {
      nextP1 = Math.floor(Math.random() * KOF_CHAR_KEYS.length);
    }
    let nextP2 = Math.floor(Math.random() * KOF_CHAR_KEYS.length);
    while (nextP2 === state.selectP2 || nextP2 === nextP1) {
      nextP2 = Math.floor(Math.random() * KOF_CHAR_KEYS.length);
    }
    state.selectP1 = nextP1;
    state.selectP2 = nextP2;
    state.charFrame = 0;
    state.charTimer = 0;
  }
}

export function renderKof97Scene(state, renderOptions = {}) {
  const pixels = new Map();
  drawScreenContent(pixels, state, renderOptions);
  drawTvFrame(pixels, state);
  return pixels;
}
