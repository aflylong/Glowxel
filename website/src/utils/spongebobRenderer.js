import { drawClockTextToPixels } from "./clockCanvas.js";
import { applyTerrariaClockBorder } from "./clockTerrariaBorder.js";

const PANEL_W = 64;
const PANEL_H = 64;
const CHARACTER_DATA_PATH = `${import.meta.env.BASE_URL}spongebob/character-frame-pixels.json`;
const BG1_IMAGE_PATH = `${import.meta.env.BASE_URL}spongebob/bg1.png`;
const FRAME_METRICS = new WeakMap();
const CLOCK_TEXT_COLOR = "#ffe800";
const CLOCK_INNER_COLOR = "#5a8cbd";
const CLOCK_OUTER_COLOR = "#21428c";

const BG2_ROW_COLORS = Object.freeze([
  "#72FDD6", "#74FDD7", "#7BFED7", "#7CFDD7", "#7DFED6", "#7CFED5", "#80FED6", "#84FED6",
  "#83FED6", "#80FDD4", "#7EFDD5", "#7BFDD5", "#79FDD6", "#74FDD5", "#70FED6", "#6DFDD7",
  "#6DFDD9", "#6BFDD9", "#6AFBD9", "#68F9DA", "#67F8DA", "#65F7D9", "#64F7DA", "#64F7D9",
  "#63F5D8", "#64F6D9", "#62F5D9", "#5EF3D8", "#57F0D7", "#4FEEDB", "#48EBDC", "#3EE8DD",
  "#36E4DE", "#33E1DD", "#30E0DC", "#2FE0DE", "#2CDDDB", "#2DDFDE", "#28DBDA", "#26DBDB",
  "#26DBDC", "#24D9DC", "#22D7DB", "#22D6DD", "#23D5DF", "#24D4E0", "#24D5E0", "#23D4DF",
  "#22D4DE", "#20D2E1", "#20D1E2", "#20D0E0", "#21D0E0", "#22D0DE", "#26D2DD", "#25D2DA",
  "#23D0D9", "#21CDD6", "#1ECAD4", "#1DC6D0", "#1DC3CE", "#1DC0D0", "#1BBED1", "#1BBBD0",
]);

export const SPONGEBOB_PROGRAMS = Object.freeze([
  { id: "duo", name: "Dual Show" },
  { id: "dance", name: "Dance Mix" },
  { id: "sleep", name: "Sleep Hold" },
  { id: "pet", name: "Pet Actions" },
]);

const PROGRAM_SEGMENTS = Object.freeze({
  duo: [
    makeSegment("Idle Intro", makeLane("spongebob", ["ldle"], 2, "loop"), makeLane("patrick", ["ldle"], 2, "loop"), "next"),
    makeSegment(
      "Walk Sync",
      makeLane("spongebob", ["walk"], 1, "loop"),
      makeLane("patrick", ["walk"], 1, "loop"),
      "next",
    ),
    makeSegment(
      "Comic Beats",
      makeLane("spongebob", ["beingdumb", "buttstomp", "miss", "fail"], 1, "loop"),
      makeLane("patrick", ["beingdumb", "buttstomp", "miss", "fail", "scared"], 1, "loop"),
      "next",
    ),
    makeSegment(
      "Drink Break",
      makeLane("spongebob", ["cheering"], 0, "loop"),
      makeLane("patrick", ["drink"], 1, "loop"),
      "next",
    ),
    makeSegment(
      "Dance Finale",
      makeLane("spongebob", ["dance", "dance3", "dance4", "dance5"], 1, "loop"),
      makeLane("patrick", ["dance1", "dance2", "dance3", "dance4"], 1, "loop"),
      "next",
    ),
    makeSegment(
      "Cheer Close",
      makeLane("spongebob", ["cheering"], 1, "loop"),
      makeLane("patrick", ["cheering"], 1, "loop"),
      "next",
    ),
    makeSegment("Idle Loop", makeLane("spongebob", ["ldle"], 2, "loop"), makeLane("patrick", ["ldle"], 2, "loop"), "next"),
  ],
  dance: [
    makeSegment("Ready", makeLane("spongebob", ["ldle"], 1, "loop"), makeLane("patrick", ["ldle"], 1, "loop"), "next"),
    makeSegment(
      "Warm Up",
      makeLane("spongebob", ["walk"], 1, "loop"),
      makeLane("patrick", ["walk"], 1, "loop"),
      "next",
    ),
    makeSegment(
      "Dance Set A",
      makeLane("spongebob", ["dance", "dance3"], 1, "loop"),
      makeLane("patrick", ["dance1", "dance2", "dance3"], 1, "loop"),
      "next",
    ),
    makeSegment(
      "Dance Set B",
      makeLane("spongebob", ["dance4", "dance5"], 1, "loop"),
      makeLane("patrick", ["dance4"], 1, "loop"),
      "next",
    ),
    makeSegment("Cheer", makeLane("spongebob", ["cheering"], 1, "loop"), makeLane("patrick", ["cheering"], 1, "loop"), "next"),
  ],
  sleep: [
    makeSegment(
      "Settle Down",
      makeLane("spongebob", ["walk", "ldle"], 1, "loop"),
      makeLane("patrick", ["walk", "ldle"], 1, "loop"),
      "next",
    ),
    makeSegment(
      "Fade Out",
      makeLane("spongebob", ["miss", "fail"], 1, "loop"),
      makeLane("patrick", ["scared", "miss", "fail"], 1, "loop"),
      "next",
    ),
    makeSegment(
      "Sleep",
      makeLane("spongebob", ["sleeping"], 1, "hold"),
      makeLane("patrick", ["sleeping"], 1, "hold"),
      "hold",
    ),
  ],
});

function makeLane(character, actions, passesNeeded, afterDone) {
  return { character, actions, passesNeeded, afterDone };
}

function makeSegment(label, left, right, afterComplete) {
  return { label, left, right, afterComplete };
}

function createLaneState(spec) {
  return {
    character: spec.character,
    actions: spec.actions.slice(),
    passesNeeded: spec.passesNeeded,
    afterDone: spec.afterDone,
    completedPasses: 0,
    actionIndex: 0,
    frameIndex: 0,
  };
}

function normalizeCustomActions(customActions) {
  if (!customActions || typeof customActions.leftAction !== "string" || typeof customActions.rightAction !== "string") {
    throw new Error("Missing custom pet actions");
  }
  return {
    leftAction: customActions.leftAction,
    rightAction: customActions.rightAction,
  };
}

function customActionsEqual(left, right) {
  return (
    left !== null &&
    right !== null &&
    left.leftAction === right.leftAction &&
    left.rightAction === right.rightAction
  );
}

function createPetSegments(customActions) {
  const actions = normalizeCustomActions(customActions);
  return [
    makeSegment(
      "Pet Action Sync",
      makeLane("spongebob", [actions.leftAction], 0, "loop"),
      makeLane("patrick", [actions.rightAction], 0, "loop"),
      "next",
    ),
  ];
}

function getProgramSegments(programId, customActions) {
  if (programId === "pet") {
    return createPetSegments(customActions);
  }
  const segments = PROGRAM_SEGMENTS[programId];
  if (!segments) {
    throw new Error(`Missing program: ${programId}`);
  }
  return segments;
}

function createProgramState(programId, customActions) {
  const segments = getProgramSegments(programId, customActions);
  const first = segments[0];
  return {
    programId,
    customActions: programId === "pet" ? normalizeCustomActions(customActions) : null,
    segmentIndex: 0,
    left: createLaneState(first.left),
    right: createLaneState(first.right),
  };
}

export function createInitialSpongeBobState(programId, customActions) {
  return createProgramState(programId, customActions);
}

function loadImagePixels(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) {
        reject(new Error(`Cannot read image pixels: ${url}`));
        return;
      }
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      resolve({
        width: canvas.width,
        height: canvas.height,
        pixels: imageData.data,
      });
    };
    image.onerror = () => reject(new Error(`Background image load failed: ${url}`));
    image.src = url;
  });
}

export async function loadSpongeBobAssets() {
  const characterResponse = await fetch(CHARACTER_DATA_PATH);
  if (!characterResponse.ok) {
    throw new Error(`Character data load failed: ${characterResponse.status}`);
  }
  const characterData = await characterResponse.json();
  const bg1Data = await loadImagePixels(BG1_IMAGE_PATH);
  validateAssets(characterData);
  return { characterData, bg1Data };
}

function validateAssets(characterData) {
  for (const character of ["spongebob", "patrick"]) {
    if (!characterData.characters[character]) {
      throw new Error(`Missing character data: ${character}`);
    }
  }
}

function getCharacter(data, character) {
  const item = data.characters[character];
  if (!item) {
    throw new Error(`Missing character: ${character}`);
  }
  return item;
}

export function getCharacterActionNames(data, character) {
  return Object.keys(getCharacter(data, character).actions);
}

function getAction(data, character, action) {
  const item = getCharacter(data, character);
  const actionData = item.actions[action];
  if (!actionData) {
    throw new Error(`Missing action: ${character}/${action}`);
  }
  return actionData;
}

function getLaneActionName(laneState) {
  return laneState.actions[laneState.actionIndex];
}

function getLaneFrames(data, laneState) {
  return getAction(data, laneState.character, getLaneActionName(laneState)).frames;
}

function getLaneFrame(data, laneState) {
  const frames = getLaneFrames(data, laneState);
  return frames[laneState.frameIndex];
}

function laneDone(laneState) {
  if (laneState.passesNeeded === 0) {
    return true;
  }
  return laneState.completedPasses >= laneState.passesNeeded;
}

function advanceLane(data, laneState) {
  if (laneDone(laneState) && laneState.afterDone === "hold") {
    return;
  }

  const frames = getLaneFrames(data, laneState);
  laneState.frameIndex += 1;
  if (laneState.frameIndex < frames.length) {
    return;
  }

  if (laneState.actionIndex + 1 < laneState.actions.length) {
    laneState.frameIndex = 0;
    laneState.actionIndex += 1;
    return;
  }

  laneState.completedPasses += 1;
  if (laneDone(laneState) && laneState.afterDone === "hold") {
    laneState.frameIndex = frames.length - 1;
    return;
  }

  laneState.actionIndex = 0;
  laneState.frameIndex = 0;
}

function loadSegment(state) {
  const segments = getProgramSegments(state.programId, state.customActions);
  const segment = segments[state.segmentIndex];
  state.left = createLaneState(segment.left);
  state.right = createLaneState(segment.right);
}

export function tickSpongeBobScene(data, state, programId, customActions) {
  if (state.programId !== programId) {
    return createProgramState(programId, customActions);
  }
  if (
    programId === "pet" &&
    !customActionsEqual(state.customActions, normalizeCustomActions(customActions))
  ) {
    return createProgramState(programId, customActions);
  }

  advanceLane(data, state.left);
  advanceLane(data, state.right);

  if (laneDone(state.left) && laneDone(state.right)) {
    const segments = getProgramSegments(state.programId, state.customActions);
    if (segments[state.segmentIndex].afterComplete === "hold") {
      return state;
    }
    state.segmentIndex += 1;
    if (state.segmentIndex >= segments.length) {
      state.segmentIndex = 0;
    }
    loadSegment(state);
  }

  return state;
}

function getFrameMetrics(frame, transparent) {
  if (FRAME_METRICS.has(frame)) {
    return FRAME_METRICS.get(frame);
  }

  let minX = frame.w;
  let minY = frame.h;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < frame.h; y += 1) {
    for (let x = 0; x < frame.w; x += 1) {
      if (frame.p[y * frame.w + x] === transparent) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  const bodyY0 = Math.floor(minY + (maxY - minY + 1) * 0.28);
  const bodyY1 = Math.floor(minY + (maxY - minY + 1) * 0.82);
  const samples = [];

  for (let y = bodyY0; y <= bodyY1; y += 1) {
    const row = [];
    for (let x = minX; x <= maxX; x += 1) {
      if (frame.p[y * frame.w + x] !== transparent) {
        row.push(x);
      }
    }
    if (row.length < 3) {
      continue;
    }
    const start = Math.floor(row.length * 0.35);
    const end = Math.ceil(row.length * 0.65);
    for (let i = start; i < end; i += 1) {
      samples.push(row[i]);
    }
  }

  samples.sort((a, b) => a - b);
  const metrics = {
    anchorX: samples.length > 0 ? samples[Math.floor(samples.length / 2)] : Math.round((minX + maxX) / 2),
    footY: maxY,
  };
  FRAME_METRICS.set(frame, metrics);
  return metrics;
}

function setPixel(pixels, x, y, color) {
  if (x < 0 || y < 0 || x >= PANEL_W || y >= PANEL_H) {
    return;
  }
  pixels.set(`${x},${y}`, color);
}

function drawScaledSourcePixel(pixels, x, y, scale, color) {
  const size = Math.max(1, Math.round(scale));
  for (let yy = 0; yy < size; yy += 1) {
    for (let xx = 0; xx < size; xx += 1) {
      setPixel(pixels, x + xx, y + yy, color);
    }
  }
}

function drawCharacter(pixels, data, frame, anchorX, floorY, scale) {
  const metrics = getFrameMetrics(frame, data.transparent);
  const palette = data.palette;

  for (let sy = 0; sy < frame.h; sy += 1) {
    for (let sx = 0; sx < frame.w; sx += 1) {
      const colorIndex = frame.p[sy * frame.w + sx];
      if (colorIndex === data.transparent) {
        continue;
      }
      const dx = Math.round(anchorX + (sx - metrics.anchorX) * scale);
      const dy = Math.round(floorY + (sy - metrics.footY) * scale);
      drawScaledSourcePixel(pixels, dx, dy, scale, palette[colorIndex]);
    }
  }
}

function drawBg1Image(pixels, bg1Data, config) {
  const scale = config.bg1Scale;
  for (let y = 0; y < PANEL_H; y += 1) {
    const sourceY = Math.floor((y - config.bg1Y) / scale);
    if (sourceY < 0 || sourceY >= bg1Data.height) {
      continue;
    }
    for (let x = 0; x < PANEL_W; x += 1) {
      const sourceX = Math.floor((x - config.bg1X) / scale);
      if (sourceX < 0 || sourceX >= bg1Data.width) {
        continue;
      }
      const offset = (sourceY * bg1Data.width + sourceX) * 4;
      const alpha = bg1Data.pixels[offset + 3];
      if (alpha === 0) {
        continue;
      }
      const red = bg1Data.pixels[offset];
      const green = bg1Data.pixels[offset + 1];
      const blue = bg1Data.pixels[offset + 2];
      const color =
        `#${red.toString(16).padStart(2, "0")}` +
        `${green.toString(16).padStart(2, "0")}` +
        `${blue.toString(16).padStart(2, "0")}`;
      pixels.set(`${x},${y}`, color);
    }
  }
}

function drawBackground(pixels, bg1Data, config) {
  for (let y = 0; y < PANEL_H; y += 1) {
    const rowColor = BG2_ROW_COLORS[y];
    for (let x = 0; x < PANEL_W; x += 1) {
      pixels.set(`${x},${y}`, rowColor);
    }
  }
  drawBg1Image(pixels, bg1Data, config);
}

function drawTerrariaStyleClock(pixels, config) {
  const maskPixels = new Map();
  drawClockTextToPixels(
    config.timeText,
    config.timeX,
    config.timeY,
    CLOCK_TEXT_COLOR,
    maskPixels,
    config.timeFontId,
    config.timeFontScale,
    config.timeAlign,
  );
  const borderedClock = applyTerrariaClockBorder(
    new Set(maskPixels.keys()),
    CLOCK_TEXT_COLOR,
    CLOCK_INNER_COLOR,
    CLOCK_OUTER_COLOR,
  );
  borderedClock.forEach((color, key) => pixels.set(key, color));
}

export function getSpongeBobStatus(data, state) {
  const segments = getProgramSegments(state.programId, state.customActions);
  const segment = segments[state.segmentIndex];
  return {
    segment: segment.label,
    left: `${state.left.character}/${getLaneActionName(state.left)}/${getLaneFrame(data, state.left).name}`,
    right: `${state.right.character}/${getLaneActionName(state.right)}/${getLaneFrame(data, state.right).name}`,
  };
}

export function renderSpongeBobScene(assets, state, config) {
  const { characterData, bg1Data } = assets;
  const pixels = new Map();
  drawBackground(pixels, bg1Data, config);
  drawCharacter(
    pixels,
    characterData,
    getLaneFrame(characterData, state.left),
    config.spongebobX,
    config.spongebobY,
    config.spongebobScale,
  );
  drawCharacter(
    pixels,
    characterData,
    getLaneFrame(characterData, state.right),
    config.patrickX,
    config.patrickY,
    config.patrickScale,
  );

  if (config.showTime) {
    drawTerrariaStyleClock(pixels, config);
  }

  return pixels;
}
