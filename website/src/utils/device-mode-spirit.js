import { clamp, setPixel } from "@/utils/device-mode-core.js";
import {
  DEVICE_CLOCK_FONTS,
  drawClockTextToMap,
  getClockTextHeight,
  getClockTextWidth,
  getCurrentTimeText,
} from "@/utils/device-mode-clock.js";

export const EYES_CONFIG_STORAGE_KEY = "eyes_config";
export const EYES_EXPRESSION_STORAGE_KEY = "eyes_expression";
export const EYES_LOCAL_PREVIEW_STORAGE_KEY = "eyes_local_preview";

export const EXPRESSION_MODE_OPTIONS = Object.freeze([
  { value: "auto", label: "自动" },
  { value: "manual", label: "手动" },
]);

export const EXPRESSION_RHYTHM_OPTIONS = Object.freeze([
  { label: "慢速", value: "slow" },
  { label: "标准", value: "standard" },
  { label: "活泼", value: "lively" },
]);

export const EXPRESSION_OPTIONS = Object.freeze([
  { label: "正常", value: "Normal" },
  { label: "生气", value: "Angry" },
  { label: "偷笑", value: "Glee" },
  { label: "开心", value: "Happy" },
  { label: "爱心", value: "Heart" },
  { label: "难过", value: "Sad" },
  { label: "担忧", value: "Worried" },
  { label: "专注", value: "Focused" },
  { label: "不耐烦", value: "Annoyed" },
  { label: "惊讶", value: "Surprised" },
  { label: "怀疑", value: "Skeptic" },
  { label: "挫败", value: "Frustrated" },
  { label: "无语", value: "Unimpressed" },
  { label: "困倦", value: "Sleepy" },
  { label: "警觉", value: "Suspicious" },
  { label: "眯眼", value: "Squint" },
  { label: "愤怒", value: "Furious" },
  { label: "受惊", value: "Scared" },
  { label: "惊叹", value: "Awe" },
  { label: "兴奋", value: "Excited" },
  { label: "坚定", value: "Determined" },
  { label: "迷糊", value: "Confused" },
]);

export const EYES_TIME_FONT_OPTIONS = DEVICE_CLOCK_FONTS;

export const EYES_PRESET_COLORS = Object.freeze([
  { label: "蓝色", value: "#64c8ff" },
  { label: "青色", value: "#9bdcff" },
  { label: "绿色", value: "#78ffb6" },
  { label: "黄色", value: "#ffe08a" },
  { label: "粉色", value: "#ff8fc9" },
  { label: "白色", value: "#ffffff" },
]);

const HEART_EXPRESSION_VALUE = "Heart";
const HEART_EYE_COLOR = "#ff6fb3";
const BLINK_DURATION_MS = 150;
const REFERENCE_EYE_SIZE = 20;
const PREVIEW_ALLOWED_BASE_WEIGHT = 10;
const PREVIEW_EXPRESSION_JITTER_MIN = 90;
const PREVIEW_EXPRESSION_JITTER_MAX = 110;

const PREVIEW_TIME_OF_DAY_POOLS = Object.freeze({
  deepNight: ["Sleepy", "Squint", "Normal", "Worried", "Unimpressed"],
  earlyMorning: ["Sleepy", "Confused", "Normal", "Happy", "Determined"],
  morning: ["Normal", "Focused", "Happy", "Determined", "Glee"],
  noon: ["Focused", "Normal", "Sleepy", "Unimpressed", "Frustrated"],
  afternoon: ["Focused", "Determined", "Happy", "Skeptic", "Suspicious"],
  evening: ["Happy", "Glee", "Awe", "Excited", "Normal"],
  night: ["Sleepy", "Normal", "Unimpressed", "Worried", "Sad"],
});

const PREVIEW_SPECIAL_POOLS = Object.freeze({
  midnightWindow: ["Sleepy", "Normal", "Squint", "Unimpressed", "Worried"],
  wakeWindow: ["Sleepy", "Confused", "Normal", "Happy"],
});

const PREVIEW_SLEEPY_BIAS_POOL = Object.freeze([
  "Sleepy",
  "Squint",
  "Unimpressed",
  "Normal",
  "Worried",
]);

const PREVIEW_EXPRESSION_INTERVALS = Object.freeze({
  slow: {
    deepNight: 18000,
    earlyMorning: 16000,
    morning: 14000,
    noon: 15000,
    afternoon: 14000,
    evening: 15000,
    night: 17000,
  },
  standard: {
    deepNight: 14000,
    earlyMorning: 12000,
    morning: 9500,
    noon: 10500,
    afternoon: 9500,
    evening: 10500,
    night: 12500,
  },
  lively: {
    deepNight: 11000,
    earlyMorning: 9000,
    morning: 7000,
    noon: 8000,
    afternoon: 7000,
    evening: 8200,
    night: 9500,
  },
});

const PREVIEW_DEDUPE_PROFILES = Object.freeze({
  slow: {
    currentMultiplier: 0.68,
    historyPenalties: [0.72, 0.78, 0.84, 0.9],
  },
  standard: {
    currentMultiplier: 0.52,
    historyPenalties: [0.58, 0.66, 0.74, 0.82],
  },
  lively: {
    currentMultiplier: 0.36,
    historyPenalties: [0.42, 0.52, 0.62, 0.72],
  },
});

const PREVIEW_SEGMENT_DURATIONS = Object.freeze({
  slow: [70000, 120000],
  standard: [45000, 90000],
  lively: [28000, 55000],
});

const PREVIEW_CLUSTER_STAY_MULTIPLIER = Object.freeze({
  slow: 1.82,
  standard: 1.54,
  lively: 1.36,
});

const PREVIEW_CLUSTER_BASE_WEIGHTS = Object.freeze({
  calm: 1.34,
  warm: 1.14,
  sleepy: 1.02,
  low: 0.84,
  alert: 0.68,
  intense: 0.34,
});

const PREVIEW_EXPRESSION_CLUSTER_MAP = Object.freeze({
  Normal: "calm",
  Focused: "calm",
  Determined: "calm",
  Skeptic: "calm",
  Unimpressed: "calm",
  Happy: "warm",
  Glee: "warm",
  Awe: "warm",
  Sleepy: "sleepy",
  Confused: "sleepy",
  Squint: "sleepy",
  Worried: "low",
  Sad: "low",
  Frustrated: "low",
  Annoyed: "alert",
  Suspicious: "alert",
  Angry: "intense",
  Furious: "intense",
  Surprised: "intense",
  Scared: "intense",
  Excited: "intense",
  Heart: "intense",
});

const PREVIEW_EXPRESSION_MOUTH_CANDIDATES = Object.freeze({
  Normal: ["flat"],
  Focused: ["flat"],
  Determined: ["flat"],
  Skeptic: ["flat", "none"],
  Unimpressed: ["flat", "none"],
  Happy: ["softSmile", "flat"],
  Glee: ["softSmile", "flat"],
  Awe: ["softSmile", "triangle"],
  Sleepy: ["microOpen", "none"],
  Confused: ["microOpen", "flat"],
  Squint: ["none", "microOpen"],
  Worried: ["downArc", "flat"],
  Sad: ["downArc", "flat"],
  Frustrated: ["downArc", "none"],
  Annoyed: ["flat", "none"],
  Suspicious: ["none", "flat"],
  Angry: ["none"],
  Furious: ["none"],
  Surprised: ["triangle"],
  Scared: ["triangle", "none"],
  Excited: ["omega", "softSmile"],
  Heart: ["omega", "softSmile"],
});

const MOUTH_PIXEL_PATTERNS = Object.freeze({
  flat: [
    [0, 0],
    [-1, 0],
    [1, 0],
  ],
  softSmile: [
    [-1, 0],
    [0, 1],
    [1, 0],
  ],
  downArc: [
    [-1, 0],
    [0, -1],
    [1, 0],
  ],
  triangle: [
    [0, -1],
    [-1, 0],
    [1, 0],
  ],
  omega: [
    [-1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
    [1, 0],
  ],
  microOpen: [
    [0, -1],
    [0, 0],
  ],
});

const PREVIEW_TRANSITION_WEIGHTS = Object.freeze({
  Normal: [
    ["Normal", 20],
    ["Happy", 20],
    ["Focused", 20],
    ["Surprised", 15],
    ["Skeptic", 15],
    ["Determined", 10],
  ],
  Happy: [
    ["Happy", 20],
    ["Glee", 25],
    ["Excited", 20],
    ["Normal", 15],
    ["Surprised", 10],
  ],
  Angry: [
    ["Angry", 20],
    ["Furious", 25],
    ["Annoyed", 20],
    ["Frustrated", 20],
    ["Normal", 10],
  ],
  Sleepy: [
    ["Sleepy", 30],
    ["Squint", 25],
    ["Unimpressed", 20],
    ["Worried", 15],
    ["Normal", 10],
  ],
  Focused: [
    ["Focused", 25],
    ["Determined", 25],
    ["Normal", 20],
    ["Skeptic", 15],
    ["Annoyed", 10],
  ],
  Sad: [
    ["Sad", 25],
    ["Worried", 25],
    ["Frustrated", 20],
    ["Normal", 15],
    ["Unimpressed", 10],
  ],
  Excited: [
    ["Excited", 20],
    ["Happy", 25],
    ["Surprised", 20],
    ["Glee", 20],
    ["Normal", 10],
  ],
  Surprised: [
    ["Surprised", 15],
    ["Awe", 25],
    ["Scared", 20],
    ["Excited", 15],
    ["Normal", 15],
    ["Happy", 10],
  ],
});

const PRESETS = Object.freeze({
  Normal: { offsetX: 0, offsetY: 0, height: 20, width: 20, slopeTop: 0, slopeBottom: 0, radiusTop: 4, radiusBottom: 4 },
  Angry: { offsetX: -2, offsetY: 0, height: 10, width: 20, slopeTop: 0.3, slopeBottom: 0, radiusTop: 1, radiusBottom: 6 },
  Glee: { offsetX: 0, offsetY: 0, height: 4, width: 20, slopeTop: 0, slopeBottom: 0, radiusTop: 4, radiusBottom: 0 },
  Happy: { offsetX: 0, offsetY: 0, height: 5, width: 20, slopeTop: 0, slopeBottom: 0, radiusTop: 5, radiusBottom: 0 },
  Sad: { offsetX: 0, offsetY: 0, height: 8, width: 20, slopeTop: -0.5, slopeBottom: 0, radiusTop: 1, radiusBottom: 5 },
  Worried: { offsetX: 0, offsetY: 0, height: 13, width: 20, slopeTop: -0.1, slopeBottom: 0, radiusTop: 3, radiusBottom: 5 },
  Focused: { offsetX: 0, offsetY: 0, height: 7, width: 20, slopeTop: 0.2, slopeBottom: 0, radiusTop: 2, radiusBottom: 1 },
  Annoyed: { offsetX: 0, offsetY: 0, height: 6, width: 20, slopeTop: 0, slopeBottom: 0, radiusTop: 0, radiusBottom: 5 },
  Surprised: { offsetX: -1, offsetY: 0, height: 23, width: 23, slopeTop: 0, slopeBottom: 0, radiusTop: 8, radiusBottom: 8 },
  Skeptic: { offsetX: 0, offsetY: -3, height: 13, width: 20, slopeTop: 0.3, slopeBottom: 0, radiusTop: 1, radiusBottom: 5 },
  Frustrated: { offsetX: 2, offsetY: -3, height: 6, width: 20, slopeTop: 0, slopeBottom: 0, radiusTop: 0, radiusBottom: 5 },
  Unimpressed: { offsetX: 2, offsetY: 0, height: 6, width: 20, slopeTop: 0, slopeBottom: 0, radiusTop: 1, radiusBottom: 5 },
  Sleepy: { offsetX: 0, offsetY: -1, height: 7, width: 20, slopeTop: -0.5, slopeBottom: 0, radiusTop: 2, radiusBottom: 1.5 },
  Suspicious: { offsetX: 0, offsetY: 0, height: 11, width: 20, slopeTop: 0, slopeBottom: 0, radiusTop: 4, radiusBottom: 2 },
  Squint: { offsetX: 3, offsetY: 0, height: 10, width: 10, slopeTop: 0, slopeBottom: 0, radiusTop: 3, radiusBottom: 3 },
  Furious: { offsetX: -1, offsetY: 0, height: 15, width: 20, slopeTop: 0.4, slopeBottom: 0, radiusTop: 1, radiusBottom: 4 },
  Scared: { offsetX: -2, offsetY: 0, height: 20, width: 20, slopeTop: -0.1, slopeBottom: 0, radiusTop: 6, radiusBottom: 4 },
  Awe: { offsetX: 1, offsetY: 0, height: 18, width: 23, slopeTop: -0.1, slopeBottom: 0.1, radiusTop: 6, radiusBottom: 6 },
  Excited: { offsetX: 0, offsetY: -2, height: 24, width: 22, slopeTop: 0.05, slopeBottom: -0.05, radiusTop: 7, radiusBottom: 7 },
  Determined: { offsetX: 0, offsetY: 0, height: 15, width: 20, slopeTop: 0.3, slopeBottom: 0, radiusTop: 2, radiusBottom: 2 },
  Confused: { offsetX: 0, offsetY: 0, height: 18, width: 20, slopeTop: -0.25, slopeBottom: 0.15, radiusTop: 5, radiusBottom: 5 },
});

const ALL_EXPRESSION_VALUES = EXPRESSION_OPTIONS.map((item) => item.value);

export function createDefaultEyesConfig() {
  return {
    layout: {
      eyeY: 24,
      eyeSpacing: 14,
      eyeWidth: 16,
      eyeHeight: 10,
      timeX: 32,
      timeY: 5,
    },
    behavior: {
      autoSwitch: true,
      blinkIntervalMs: 3200,
      lookIntervalMs: 4200,
      idleMove: 2,
      sleepyAfterMs: 45000,
      expressionRhythm: "standard",
    },
    interaction: {
      lookHoldMs: 1200,
      moodHoldMs: 1800,
    },
    time: {
      show: true,
      showSeconds: false,
      font: "classic_5x7",
      fontSize: 1,
      align: "center",
    },
    style: {
      eyeColor: "#9bdcff",
      timeColor: "#64c8ff",
    },
  };
}

export function createDefaultLocalPreviewState() {
  return {
    mouthEnabled: true,
    mouthOffsetX: 0,
    mouthOffsetY: 0,
  };
}

export function normalizeEyesConfig(saved) {
  const next = createDefaultEyesConfig();
  if (!saved || typeof saved !== "object") {
    return next;
  }
  if (saved.layout && typeof saved.layout === "object") {
    Object.assign(next.layout, saved.layout);
  }
  if (saved.behavior && typeof saved.behavior === "object") {
    Object.assign(next.behavior, saved.behavior);
  }
  if (saved.interaction && typeof saved.interaction === "object") {
    Object.assign(next.interaction, saved.interaction);
  }
  if (saved.time && typeof saved.time === "object") {
    Object.assign(next.time, saved.time);
  }
  if (saved.style && typeof saved.style === "object") {
    Object.assign(next.style, saved.style);
  }
  return next;
}

export function normalizeLocalPreview(saved) {
  const next = createDefaultLocalPreviewState();
  if (!saved || typeof saved !== "object") {
    return next;
  }
  if (saved.mouthEnabled === true || saved.mouthEnabled === false) {
    next.mouthEnabled = saved.mouthEnabled;
  }
  if (Number.isFinite(Number(saved.mouthOffsetX))) {
    next.mouthOffsetX = clamp(Math.round(Number(saved.mouthOffsetX)), -3, 3);
  }
  if (Number.isFinite(Number(saved.mouthOffsetY))) {
    next.mouthOffsetY = clamp(Math.round(Number(saved.mouthOffsetY)), -3, 3);
  }
  return next;
}

function randomFloat(minValue, maxValue) {
  return minValue + Math.random() * (maxValue - minValue);
}

function jitteredInterval(baseMs, minPercent, maxPercent) {
  return baseMs * randomFloat(minPercent, maxPercent) / 100;
}

function scaleHexChannel(hexPair, factor) {
  const channelValue = Number.parseInt(hexPair, 16);
  if (Number.isNaN(channelValue)) {
    return null;
  }
  return clamp(Math.round(channelValue * factor), 0, 255)
    .toString(16)
    .padStart(2, "0");
}

function scaleHexColor(hexColor, factor) {
  if (typeof hexColor !== "string" || !/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
    return hexColor;
  }
  const red = scaleHexChannel(hexColor.slice(1, 3), factor);
  const green = scaleHexChannel(hexColor.slice(3, 5), factor);
  const blue = scaleHexChannel(hexColor.slice(5, 7), factor);
  if (red === null || green === null || blue === null) {
    return hexColor;
  }
  return `#${red}${green}${blue}`;
}

function previewClusterForExpression(expression) {
  return PREVIEW_EXPRESSION_CLUSTER_MAP[expression] || "calm";
}

function previewMouthCandidatesForExpression(expression) {
  return PREVIEW_EXPRESSION_MOUTH_CANDIDATES[expression] || ["none"];
}

function previewPrimaryMouthForExpression(expression) {
  const candidates = previewMouthCandidatesForExpression(expression);
  return candidates.length > 0 ? candidates[0] : "none";
}

function previewSegmentDurationMs(expressionRhythm) {
  const bounds = PREVIEW_SEGMENT_DURATIONS[expressionRhythm];
  return Math.round(randomFloat(bounds[0], bounds[1]));
}

function previewExpressionPoolForCluster(pool, clusterKey) {
  return pool.filter((expression) => previewClusterForExpression(expression) === clusterKey);
}

function createPreviewClusterWeights(pool, currentCluster, expressionRhythm) {
  const weights = {};
  pool.forEach((expression) => {
    const clusterKey = previewClusterForExpression(expression);
    weights[clusterKey] = (weights[clusterKey] || 0) + PREVIEW_CLUSTER_BASE_WEIGHTS[clusterKey];
  });
  Object.keys(weights).forEach((clusterKey) => {
    if (clusterKey === currentCluster) {
      weights[clusterKey] *= PREVIEW_CLUSTER_STAY_MULTIPLIER[expressionRhythm];
    }
  });
  return weights;
}

function weightedObjectChoice(weightMap, fallbackValue) {
  const entries = Object.entries(weightMap).filter(([, value]) => value > 0);
  const totalWeight = entries.reduce((sum, [, value]) => sum + value, 0);
  if (totalWeight <= 0) {
    return fallbackValue;
  }
  let target = Math.random() * totalWeight;
  for (const [key, value] of entries) {
    target -= value;
    if (target <= 0) {
      return key;
    }
  }
  return fallbackValue;
}

function getPreviewTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 23 || hour < 6) {
    return "deepNight";
  }
  if (hour < 9) {
    return "earlyMorning";
  }
  if (hour < 12) {
    return "morning";
  }
  if (hour < 14) {
    return "noon";
  }
  if (hour < 18) {
    return "afternoon";
  }
  if (hour < 21) {
    return "evening";
  }
  return "night";
}

function getPreviewSpecialWindow(date = new Date()) {
  const hour = date.getHours();
  const minute = date.getMinutes();
  if (hour === 0 && minute < 10) {
    return "midnightWindow";
  }
  if (hour === 6 && minute < 30) {
    return "wakeWindow";
  }
  return null;
}

function getPreviewExpressionPool(now, eyesConfig, lastInteractionAt) {
  const currentDate = new Date(now);
  const specialWindow = getPreviewSpecialWindow(currentDate);
  if (specialWindow) {
    return PREVIEW_SPECIAL_POOLS[specialWindow];
  }
  if (now - lastInteractionAt >= eyesConfig.behavior.sleepyAfterMs) {
    return PREVIEW_SLEEPY_BIAS_POOL;
  }
  return PREVIEW_TIME_OF_DAY_POOLS[getPreviewTimeOfDay(currentDate)];
}

function resolvePreviewSeedExpression(candidateExpression, eyesConfig, now) {
  const pool = getPreviewExpressionPool(now, eyesConfig, now);
  if (pool.includes(candidateExpression)) {
    return candidateExpression;
  }
  if (pool.includes("Normal")) {
    return "Normal";
  }
  return pool.length > 0 ? pool[0] : "Normal";
}

function minPreviewExpressionInterval(timeOfDay, expressionRhythm) {
  return PREVIEW_EXPRESSION_INTERVALS[expressionRhythm][timeOfDay];
}

function createPreviewWeights(pool) {
  const weights = {};
  ALL_EXPRESSION_VALUES.forEach((value) => {
    weights[value] = 0;
  });
  pool.forEach((value) => {
    weights[value] = PREVIEW_ALLOWED_BASE_WEIGHT;
  });
  return weights;
}

function applyPreviewTransitionWeights(currentExpression, weights) {
  const transitions = PREVIEW_TRANSITION_WEIGHTS[currentExpression];
  if (!transitions) {
    return;
  }
  transitions.forEach(([expression, transitionWeight]) => {
    if (weights[expression] > 0) {
      weights[expression] = weights[expression] * 0.6 + transitionWeight * 0.4;
    }
  });
}

function pushPreviewHistory(runtime, expression) {
  runtime.history.push(expression);
  if (runtime.history.length > 5) {
    runtime.history.shift();
  }
}

function applyPreviewHistoryPenalties(runtime, weights, expressionRhythm) {
  const dedupeProfile = PREVIEW_DEDUPE_PROFILES[expressionRhythm];
  if (weights[runtime.expression] > 0) {
    weights[runtime.expression] *= dedupeProfile.currentMultiplier;
  }
  runtime.history
    .slice(0, -1)
    .slice(-4)
    .reverse()
    .forEach((expression, index) => {
      if (weights[expression] > 0) {
        weights[expression] *= dedupeProfile.historyPenalties[index];
      }
    });
}

function weightedPreviewChoice(weights, pool, fallbackExpression) {
  const entries = pool
    .map((expression) => [expression, weights[expression]])
    .filter(([, value]) => value > 0);
  const totalWeight = entries.reduce((sum, [, value]) => sum + value, 0);
  if (totalWeight <= 0) {
    if (pool.includes(fallbackExpression)) {
      return fallbackExpression;
    }
    return pool.length > 0 ? pool[0] : fallbackExpression;
  }
  let target = Math.random() * totalWeight;
  for (const [expression, value] of entries) {
    target -= value;
    if (target <= 0) {
      return expression;
    }
  }
  return fallbackExpression;
}

function normalizedLoopPhase(now, periodMs, phaseOffset) {
  if (!periodMs) {
    return 0;
  }
  let phase = (now % periodMs) / periodMs + phaseOffset;
  phase -= Math.floor(phase);
  return phase;
}

function trianglePulse(now, periodMs, phaseOffset) {
  const phase = normalizedLoopPhase(now, periodMs, phaseOffset);
  if (phase < 0.5) {
    return phase * 2;
  }
  return (1 - phase) * 2;
}

function pointInRectangle(px, py, x0, y0, x1, y1) {
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  return px >= left && px <= right && py >= top && py <= bottom;
}

function triangleSign(px, py, ax, ay, bx, by) {
  return (px - bx) * (ay - by) - (ax - bx) * (py - by);
}

function pointInTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const b1 = triangleSign(px, py, ax, ay, bx, by) < 0;
  const b2 = triangleSign(px, py, bx, by, cx, cy) < 0;
  const b3 = triangleSign(px, py, cx, cy, ax, ay) < 0;
  return b1 === b2 && b2 === b3;
}

function pointInQuarterEllipse(px, py, cx, cy, rx, ry, leftSide, topSide) {
  if (rx <= 0 || ry <= 0) {
    return false;
  }
  if (leftSide && px > cx) {
    return false;
  }
  if (!leftSide && px < cx) {
    return false;
  }
  if (topSide && py > cy) {
    return false;
  }
  if (!topSide && py < cy) {
    return false;
  }
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return dx * dx + dy * dy <= 1;
}

function setPreviewPixel(pixelMap, x, y, color) {
  if (x < 0 || x > 63 || y < 0 || y > 63) {
    return;
  }
  pixelMap.set(`${x},${y}`, color);
}

function previewLookHoldDurationMs(runtime, eyesConfig, expression = runtime.expression) {
  let minMs = 1400;
  let maxMs = 2800;
  if (eyesConfig.behavior.expressionRhythm === "slow") {
    minMs = 1800;
    maxMs = 3500;
  } else if (eyesConfig.behavior.expressionRhythm === "lively") {
    minMs = 1200;
    maxMs = 2200;
  }
  if (expression === "Sleepy" || expression === "Squint" || expression === "Confused") {
    minMs += 220;
    maxMs += 520;
  } else if (
    expression === "Excited" ||
    expression === HEART_EXPRESSION_VALUE ||
    expression === "Surprised" ||
    expression === "Scared"
  ) {
    minMs -= 120;
    maxMs -= 180;
  }
  return Math.round(randomFloat(minMs, maxMs));
}

function startPreviewSegment(runtime, expressionRhythm, clusterKey, now = Date.now()) {
  runtime.clusterKey = clusterKey;
  runtime.segmentStartAt = now;
  runtime.segmentDurationMs = previewSegmentDurationMs(expressionRhythm);
  runtime.segmentMouthShifted = false;
  runtime.mouthShiftAt = now + Math.round(runtime.segmentDurationMs * randomFloat(0.48, 0.76));
}

function chooseNextPreviewCluster(runtime, eyesConfig, expressionPool) {
  const clusterWeights = createPreviewClusterWeights(
    expressionPool,
    runtime.clusterKey,
    eyesConfig.behavior.expressionRhythm,
  );
  return weightedObjectChoice(clusterWeights, runtime.clusterKey);
}

function syncPreviewMouthForExpression(runtime, eyesConfig, now, forcePrimary = false) {
  const candidates = previewMouthCandidatesForExpression(runtime.expression);
  const primary = previewPrimaryMouthForExpression(runtime.expression);
  if (!eyesConfig.behavior.autoSwitch || forcePrimary) {
    if (runtime.mouthType !== primary) {
      runtime.mouthType = primary;
      runtime.lastMouthAt = now;
    }
    return;
  }
  if (!candidates.includes(runtime.mouthType)) {
    runtime.mouthType = primary;
    runtime.lastMouthAt = now;
  }
  if (runtime.segmentMouthShifted || runtime.mouthShiftAt === 0 || now < runtime.mouthShiftAt) {
    return;
  }
  if (candidates.length < 2 || runtime.mouthType !== primary) {
    runtime.segmentMouthShifted = true;
    return;
  }
  runtime.mouthType = candidates[1];
  runtime.lastMouthAt = now;
  runtime.segmentMouthShifted = true;
}

function scheduleNextBlink(runtime, eyesConfig) {
  let rhythmMultiplier = 1.45;
  if (eyesConfig.behavior.expressionRhythm === "slow") {
    rhythmMultiplier = 1.82;
  } else if (eyesConfig.behavior.expressionRhythm === "lively") {
    rhythmMultiplier = 1.24;
  }
  let expressionMultiplier = 1;
  if (runtime.expression === "Sleepy" || runtime.expression === "Squint" || runtime.expression === "Confused") {
    expressionMultiplier = 1.16;
  } else if (
    runtime.expression === "Excited" ||
    runtime.expression === HEART_EXPRESSION_VALUE ||
    runtime.expression === "Surprised"
  ) {
    expressionMultiplier = 0.92;
  }
  runtime.nextBlinkAfterMs = jitteredInterval(
    eyesConfig.behavior.blinkIntervalMs * rhythmMultiplier * expressionMultiplier,
    96,
    146,
  );
}

function scheduleNextLook(runtime, eyesConfig) {
  let rhythmMultiplier = 1.62;
  if (eyesConfig.behavior.expressionRhythm === "slow") {
    rhythmMultiplier = 2.06;
  } else if (eyesConfig.behavior.expressionRhythm === "lively") {
    rhythmMultiplier = 1.36;
  }
  let expressionMultiplier = 1;
  if (runtime.expression === "Sleepy" || runtime.expression === "Squint") {
    expressionMultiplier = 1.18;
  } else if (runtime.expression === "Excited" || runtime.expression === HEART_EXPRESSION_VALUE) {
    expressionMultiplier = 0.9;
  }
  runtime.nextLookAfterMs = jitteredInterval(
    eyesConfig.behavior.lookIntervalMs * rhythmMultiplier * expressionMultiplier,
    92,
    155,
  );
}

function scheduleNextExpression(runtime, eyesConfig) {
  runtime.nextExpressionAfterMs = jitteredInterval(
    minPreviewExpressionInterval(
      getPreviewTimeOfDay(new Date()),
      eyesConfig.behavior.expressionRhythm,
    ),
    PREVIEW_EXPRESSION_JITTER_MIN,
    PREVIEW_EXPRESSION_JITTER_MAX,
  );
}

function chooseNextPreviewExpression(runtime, eyesConfig, now = Date.now()) {
  const expressionPool = getPreviewExpressionPool(now, eyesConfig, runtime.lastInteractionAt);
  const segmentExpired = now - runtime.segmentStartAt >= runtime.segmentDurationMs;
  let clusterKey = runtime.clusterKey;
  let clusterPool = previewExpressionPoolForCluster(expressionPool, clusterKey);
  if (clusterPool.length === 0 || segmentExpired) {
    clusterKey = chooseNextPreviewCluster(runtime, eyesConfig, expressionPool);
    clusterPool = previewExpressionPoolForCluster(expressionPool, clusterKey);
    startPreviewSegment(runtime, eyesConfig.behavior.expressionRhythm, clusterKey, now);
  }
  if (clusterPool.length === 0) {
    clusterPool = expressionPool;
  }
  const weights = createPreviewWeights(clusterPool);
  applyPreviewTransitionWeights(runtime.expression, weights);
  applyPreviewHistoryPenalties(runtime, weights, eyesConfig.behavior.expressionRhythm);
  return weightedPreviewChoice(weights, clusterPool, runtime.expression);
}

function startPreviewBlink(runtime) {
  const now = Date.now();
  runtime.blinkActive = true;
  runtime.blinkStartAt = now;
  runtime.leftBlinkDelayMs = 0;
  runtime.rightBlinkDelayMs = 0;
  runtime.leftBlinkScale = 1;
  runtime.rightBlinkScale = 1;
  if (runtime.expression === HEART_EXPRESSION_VALUE) {
    return;
  }
  if (Math.random() < 0.42) {
    const skew = Math.floor(Math.random() * 37) - 18;
    if (skew > 0) {
      runtime.rightBlinkDelayMs = skew;
    } else if (skew < 0) {
      runtime.leftBlinkDelayMs = -skew;
    }
  }
  if (Math.random() < 0.35) {
    const baseScale = randomFloat(0.93, 1.0);
    runtime.leftBlinkScale = baseScale;
    runtime.rightBlinkScale = baseScale;
  }
}

function blinkAmountForEye(runtime, now, isLeftEye) {
  if (!runtime.blinkActive) {
    return 0;
  }
  const delay = isLeftEye ? runtime.leftBlinkDelayMs : runtime.rightBlinkDelayMs;
  const scale = isLeftEye ? runtime.leftBlinkScale : runtime.rightBlinkScale;
  if (now < runtime.blinkStartAt + delay) {
    return 0;
  }
  const phase = (now - runtime.blinkStartAt - delay) / BLINK_DURATION_MS;
  if (phase < 0.5) {
    return clamp(phase * 2 * scale, 0, 1);
  }
  if (phase < 1) {
    return clamp((1 - (phase - 0.5) * 2) * scale, 0, 1);
  }
  return 0;
}

function chooseIdleLook(runtime, eyesConfig) {
  const activeExpression = runtime.expression;
  let amplitudeScale = 0.86;
  if (activeExpression === "Sleepy" || activeExpression === "Squint" || activeExpression === "Confused") {
    amplitudeScale = 0.58;
  } else if (activeExpression === "Excited" || activeExpression === "Surprised") {
    amplitudeScale = 0.96;
  } else if (activeExpression === "Skeptic" || activeExpression === "Suspicious") {
    amplitudeScale = 0.78;
  }
  const roll = Math.random() * 100;
  let baseX = 0;
  let baseY = 0;
  if (roll < 28) {
    baseX = randomFloat(-0.14, 0.14);
    baseY = randomFloat(-0.08, 0.08);
  } else if (roll < 56) {
    const side = Math.random() < 0.5 ? -1 : 1;
    baseX = side * randomFloat(0.22, 0.56);
    baseY = randomFloat(-0.12, 0.14);
  } else if (roll < 74) {
    baseX = randomFloat(-0.24, 0.24);
    baseY = randomFloat(-0.42, -0.16);
  } else if (roll < 86) {
    baseX = randomFloat(-0.18, 0.18);
    baseY = randomFloat(0.05, 0.22);
  } else {
    const side = Math.random() < 0.5 ? -1 : 1;
    baseX = side * randomFloat(0.18, 0.42);
    baseY = Math.random() < 0.5 ? randomFloat(-0.28, -0.08) : randomFloat(0.02, 0.16);
  }
  runtime.targetLookX = clamp(baseX * amplitudeScale, -0.64, 0.64);
  runtime.targetLookY = clamp(baseY * amplitudeScale, -0.48, 0.28);
  runtime.targetLeftLookOffsetX = 0;
  runtime.targetLeftLookOffsetY = 0;
  runtime.targetRightLookOffsetX = 0;
  runtime.targetRightLookOffsetY = 0;
  let asymmetryChance = 18;
  if (activeExpression === "Skeptic" || activeExpression === "Worried" || activeExpression === "Suspicious") {
    asymmetryChance = 28;
  }
  if (Math.random() * 100 >= asymmetryChance) {
    return;
  }
  const microX = randomFloat(-0.06, 0.06);
  const microY = randomFloat(-0.03, 0.03);
  const lagFactor = randomFloat(0.32, 0.62);
  const leftLead = Math.random() < 0.5;
  if (leftLead) {
    runtime.targetLeftLookOffsetX = microX;
    runtime.targetLeftLookOffsetY = microY;
    runtime.targetRightLookOffsetX = microX * lagFactor;
    runtime.targetRightLookOffsetY = microY * lagFactor;
    return;
  }
  runtime.targetLeftLookOffsetX = microX * lagFactor;
  runtime.targetLeftLookOffsetY = microY * lagFactor;
  runtime.targetRightLookOffsetX = microX;
  runtime.targetRightLookOffsetY = microY;
}

function updatePreviewRuntime(runtime, eyesConfig, selectedExpression, now) {
  if (!eyesConfig.behavior.autoSwitch) {
    runtime.expression = selectedExpression;
    runtime.clusterKey = previewClusterForExpression(selectedExpression);
    runtime.nextExpressionAfterMs = 0;
    syncPreviewMouthForExpression(runtime, eyesConfig, now, true);
  } else if (runtime.nextExpressionAfterMs === 0) {
    scheduleNextExpression(runtime, eyesConfig);
  }

  if (runtime.nextBlinkAfterMs === 0) {
    scheduleNextBlink(runtime, eyesConfig);
  }
  if (runtime.nextLookAfterMs === 0) {
    scheduleNextLook(runtime, eyesConfig);
  }

  if (runtime.blinkActive) {
    const totalBlinkMs = BLINK_DURATION_MS + Math.max(runtime.leftBlinkDelayMs, runtime.rightBlinkDelayMs);
    if (now - runtime.blinkStartAt >= totalBlinkMs) {
      runtime.blinkActive = false;
      runtime.lastBlinkAt = now;
      scheduleNextBlink(runtime, eyesConfig);
    }
  } else if (now - runtime.lastBlinkAt >= runtime.nextBlinkAfterMs) {
    if (now - runtime.lastExpressionAt < 1600) {
      runtime.lastBlinkAt = now;
      scheduleNextBlink(runtime, eyesConfig);
    } else {
      startPreviewBlink(runtime);
    }
  }

  if (runtime.actionExpireAt > 0 && now >= runtime.actionExpireAt) {
    runtime.actionExpireAt = 0;
    runtime.targetLookX = 0;
    runtime.targetLookY = 0;
    runtime.targetLeftLookOffsetX = 0;
    runtime.targetLeftLookOffsetY = 0;
    runtime.targetRightLookOffsetX = 0;
    runtime.targetRightLookOffsetY = 0;
  }

  if (
    eyesConfig.behavior.autoSwitch &&
    runtime.actionExpireAt === 0 &&
    now - runtime.lastExpressionAt >= runtime.nextExpressionAfterMs
  ) {
    const previousClusterKey = runtime.clusterKey;
    runtime.expression = chooseNextPreviewExpression(runtime, eyesConfig, now);
    runtime.clusterKey = previewClusterForExpression(runtime.expression);
    pushPreviewHistory(runtime, runtime.expression);
    runtime.lastExpressionAt = now;
    scheduleNextExpression(runtime, eyesConfig);
    syncPreviewMouthForExpression(runtime, eyesConfig, now, previousClusterKey !== runtime.clusterKey);
  }

  if (
    now - runtime.lastLookAt >= runtime.nextLookAfterMs &&
    runtime.actionExpireAt === 0
  ) {
    if (now - runtime.lastExpressionAt < 2200 || runtime.blinkActive) {
      runtime.lastLookAt = now;
      scheduleNextLook(runtime, eyesConfig);
    } else {
      runtime.lastLookAt = now;
      chooseIdleLook(runtime, eyesConfig);
      runtime.actionExpireAt = now + previewLookHoldDurationMs(runtime, eyesConfig);
      scheduleNextLook(runtime, eyesConfig);
    }
  }

  syncPreviewMouthForExpression(runtime, eyesConfig, now);

  const lookEase = runtime.actionExpireAt > 0 ? 0.16 : 0.1;
  runtime.lookX += (runtime.targetLookX - runtime.lookX) * lookEase;
  runtime.lookY += (runtime.targetLookY - runtime.lookY) * lookEase;
  runtime.leftLookOffsetX += (runtime.targetLeftLookOffsetX - runtime.leftLookOffsetX) * 0.12;
  runtime.leftLookOffsetY += (runtime.targetLeftLookOffsetY - runtime.leftLookOffsetY) * 0.12;
  runtime.rightLookOffsetX += (runtime.targetRightLookOffsetX - runtime.rightLookOffsetX) * 0.12;
  runtime.rightLookOffsetY += (runtime.targetRightLookOffsetY - runtime.rightLookOffsetY) * 0.12;
  runtime.mouthLookX += (runtime.lookX * 0.52 - runtime.mouthLookX) * 0.07;
  runtime.mouthLookY += (runtime.lookY * 0.18 - runtime.mouthLookY) * 0.05;
}

function presetForEye(runtime, expression, isLeftEye, now) {
  const preset = { ...PRESETS[expression] };
  if (!isLeftEye) {
    return preset;
  }
  if (expression === "Worried") {
    preset.offsetY -= 1.5;
    preset.height += 3;
    preset.slopeTop -= 0.08;
  } else if (expression === "Annoyed") {
    preset.offsetY -= 2;
    preset.height += 4;
    preset.radiusBottom += 1.5;
  } else if (expression === "Skeptic") {
    preset.offsetY -= 1.5;
    preset.height += 2.5;
    preset.slopeTop += 0.05;
  } else if (expression === "Unimpressed") {
    preset.offsetY -= 2;
    preset.height += 5.5;
    preset.radiusBottom += 1.5;
  } else if (expression === "Sleepy") {
    preset.height -= 1.5;
    preset.offsetY -= 0.4;
  } else if (expression === "Suspicious") {
    preset.offsetY -= 1.8;
    preset.height += 2;
    preset.slopeTop += 0.12;
  } else if (expression === "Squint") {
    preset.offsetX = 1.2;
    preset.offsetY = -0.5;
    preset.width += 5;
    preset.height += 6;
  }
  if (expression === "Normal") {
    preset.height += trianglePulse(now, 2200, isLeftEye ? 0.18 : 0.62) * 1.3;
  } else if (expression === "Happy" || expression === "Glee") {
    preset.offsetY += trianglePulse(now, 1500, isLeftEye ? 0.24 : 0.52) * 0.7;
  }
  return preset;
}

function buildLookTransform(runtime, eyesConfig, isLeftEye) {
  const lookX = runtime.lookX + (isLeftEye ? runtime.leftLookOffsetX : runtime.rightLookOffsetX);
  const lookY = runtime.lookY + (isLeftEye ? runtime.leftLookOffsetY : runtime.rightLookOffsetY);
  const normalizedX = clamp(lookX, -1, 1);
  const normalizedY = clamp(lookY, -1, 1);
  const lookSquash = 1 - Math.abs(normalizedY) * 0.18;
  const sideBias = isLeftEye ? 1 + normalizedX * 0.16 : 1 - normalizedX * 0.16;
  const moveDirection = isLeftEye ? -1 : 1;
  return {
    moveX: eyesConfig.behavior.idleMove * 0.85 * normalizedX * moveDirection,
    moveY: eyesConfig.behavior.idleMove * 0.65 * normalizedY,
    scaleX: 1,
    scaleY: clamp(lookSquash * sideBias, 0.72, 1.22),
  };
}

function buildRasterEyeShape(eyesConfig, centerX, centerY, preset, transform, blinkAmount) {
  const scaleX = eyesConfig.layout.eyeWidth / REFERENCE_EYE_SIZE;
  const scaleY = eyesConfig.layout.eyeHeight / REFERENCE_EYE_SIZE;
  const radiusScale = Math.min(scaleX, scaleY);
  const shape = {
    centerX,
    centerY,
    offsetX: (preset.offsetX + transform.moveX) * scaleX,
    offsetY: (preset.offsetY - transform.moveY) * scaleY,
    width: preset.width * scaleX * transform.scaleX,
    height: preset.height * scaleY * transform.scaleY,
    slopeTop: preset.slopeTop,
    slopeBottom: preset.slopeBottom,
    radiusTop: preset.radiusTop * radiusScale,
    radiusBottom: preset.radiusBottom * radiusScale,
  };
  const blinkScale = 1 - blinkAmount;
  shape.height = clamp(shape.height * blinkScale, 1, 64);
  shape.deltaTop = (shape.height * shape.slopeTop) / 2;
  shape.deltaBottom = (shape.height * shape.slopeBottom) / 2;
  const totalHeight = shape.height + shape.deltaTop - shape.deltaBottom;
  if (totalHeight <= 1) {
    shape.radiusTop = 0;
    shape.radiusBottom = 0;
  } else if (
    shape.radiusBottom > 0 &&
    shape.radiusTop > 0 &&
    totalHeight - 1 < shape.radiusBottom + shape.radiusTop
  ) {
    const scaleDown = (totalHeight - 1) / (shape.radiusBottom + shape.radiusTop);
    shape.radiusTop *= scaleDown;
    shape.radiusBottom *= scaleDown;
  }
  shape.TLcY = centerY + shape.offsetY - shape.height / 2 + shape.radiusTop - shape.deltaTop;
  shape.TLcX = centerX + shape.offsetX - shape.width / 2 + shape.radiusTop;
  shape.TRcY = centerY + shape.offsetY - shape.height / 2 + shape.radiusTop + shape.deltaTop;
  shape.TRcX = centerX + shape.offsetX + shape.width / 2 - shape.radiusTop;
  shape.BLcY = centerY + shape.offsetY + shape.height / 2 - shape.radiusBottom - shape.deltaBottom;
  shape.BLcX = centerX + shape.offsetX - shape.width / 2 + shape.radiusBottom;
  shape.BRcY = centerY + shape.offsetY + shape.height / 2 - shape.radiusBottom + shape.deltaBottom;
  shape.BRcX = centerX + shape.offsetX + shape.width / 2 - shape.radiusBottom;
  shape.minCX = Math.min(shape.TLcX, shape.BLcX);
  shape.maxCX = Math.max(shape.TRcX, shape.BRcX);
  shape.minCY = Math.min(shape.TLcY, shape.TRcY);
  shape.maxCY = Math.max(shape.BLcY, shape.BRcY);
  shape.minX = centerX + shape.offsetX - shape.width / 2;
  shape.maxX = centerX + shape.offsetX + shape.width / 2;
  shape.minY = Math.min(shape.TLcY - shape.radiusTop, shape.TRcY - shape.radiusTop);
  shape.maxY = Math.max(shape.BLcY + shape.radiusBottom, shape.BRcY + shape.radiusBottom);
  return shape;
}

function containsShapePoint(shape, sampleX, sampleY) {
  if (pointInRectangle(sampleX, sampleY, shape.minCX, shape.minCY, shape.maxCX, shape.maxCY)) return true;
  if (pointInRectangle(sampleX, sampleY, shape.TRcX, shape.TRcY, shape.BRcX + shape.radiusBottom, shape.BRcY)) return true;
  if (pointInRectangle(sampleX, sampleY, shape.TLcX - shape.radiusTop, shape.TLcY, shape.BLcX, shape.BLcY)) return true;
  if (pointInRectangle(sampleX, sampleY, shape.TLcX, shape.TLcY - shape.radiusTop, shape.TRcX, shape.TRcY)) return true;
  if (pointInRectangle(sampleX, sampleY, shape.BLcX, shape.BLcY, shape.BRcX, shape.BRcY + shape.radiusBottom)) return true;
  if (
    shape.slopeTop > 0 &&
    pointInTriangle(
      sampleX,
      sampleY,
      shape.TLcX,
      shape.TLcY - shape.radiusTop,
      shape.TRcX,
      shape.TRcY - shape.radiusTop,
      shape.TRcX,
      shape.TLcY - shape.radiusTop,
    )
  ) return true;
  if (
    shape.slopeTop < 0 &&
    pointInTriangle(
      sampleX,
      sampleY,
      shape.TRcX,
      shape.TRcY - shape.radiusTop,
      shape.TLcX,
      shape.TLcY - shape.radiusTop,
      shape.TLcX,
      shape.TRcY - shape.radiusTop,
    )
  ) return true;
  if (
    shape.slopeBottom > 0 &&
    pointInTriangle(
      sampleX,
      sampleY,
      shape.BRcX + shape.radiusBottom,
      shape.BRcY + shape.radiusBottom,
      shape.BLcX - shape.radiusBottom,
      shape.BLcY + shape.radiusBottom,
      shape.BLcX - shape.radiusBottom,
      shape.BRcY + shape.radiusBottom,
    )
  ) return true;
  if (
    shape.slopeBottom < 0 &&
    pointInTriangle(
      sampleX,
      sampleY,
      shape.BLcX - shape.radiusBottom,
      shape.BLcY + shape.radiusBottom,
      shape.BRcX + shape.radiusBottom,
      shape.BRcY + shape.radiusBottom,
      shape.BRcX + shape.radiusBottom,
      shape.BLcY + shape.radiusBottom,
    )
  ) return true;
  if (shape.radiusTop > 0 && pointInQuarterEllipse(sampleX, sampleY, shape.TLcX, shape.TLcY, shape.radiusTop, shape.radiusTop, true, true)) return true;
  if (shape.radiusTop > 0 && pointInQuarterEllipse(sampleX, sampleY, shape.TRcX, shape.TRcY, shape.radiusTop, shape.radiusTop, false, true)) return true;
  if (shape.radiusBottom > 0 && pointInQuarterEllipse(sampleX, sampleY, shape.BLcX, shape.BLcY, shape.radiusBottom, shape.radiusBottom, true, false)) return true;
  if (shape.radiusBottom > 0 && pointInQuarterEllipse(sampleX, sampleY, shape.BRcX, shape.BRcY, shape.radiusBottom, shape.radiusBottom, false, false)) return true;
  return false;
}

function drawHeartEye(pixelMap, runtime, eyesConfig, centerX, centerY, blinkAmount) {
  const scaleX = eyesConfig.layout.eyeWidth / REFERENCE_EYE_SIZE;
  const scaleY = eyesConfig.layout.eyeHeight / REFERENCE_EYE_SIZE;
  const normalizedLookX = clamp(runtime.lookX, -1, 1);
  const normalizedLookY = clamp(runtime.lookY, -1, 1);
  const moveX = eyesConfig.behavior.idleMove * 0.85 * normalizedLookX;
  const moveY = eyesConfig.behavior.idleMove * 0.65 * normalizedLookY;
  const blinkScale = clamp(1 - blinkAmount * 0.9, 0.2, 1);
  const radiusX = Math.max(2.6, 9.1 * scaleX);
  const radiusY = Math.max(2.4, 8.7 * scaleY * blinkScale);
  const heartCenterX = centerX + moveX * scaleX;
  const heartCenterY = centerY - 0.7 * scaleY - moveY * scaleY;
  const startX = clamp(Math.floor(heartCenterX - radiusX) - 1, 0, 63);
  const endX = clamp(Math.ceil(heartCenterX + radiusX) + 1, 0, 63);
  const startY = clamp(Math.floor(heartCenterY - radiusY) - 1, 0, 63);
  const endY = clamp(Math.ceil(heartCenterY + radiusY) + 1, 0, 63);
  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const normalizedX = (x + 0.5 - heartCenterX) / radiusX;
      const normalizedY = (heartCenterY - (y + 0.5)) / radiusY;
      const equation =
        Math.pow(normalizedX * normalizedX + normalizedY * normalizedY - 1, 3) -
        normalizedX * normalizedX * normalizedY * normalizedY * normalizedY;
      if (equation <= 0) {
        pixelMap.set(`${x},${y}`, HEART_EYE_COLOR);
      }
    }
  }
}

function drawEye(pixelMap, runtime, eyesConfig, centerX, centerY, expression, isLeftEye, blinkAmount, now) {
  if (expression === HEART_EXPRESSION_VALUE) {
    drawHeartEye(pixelMap, runtime, eyesConfig, centerX, centerY, blinkAmount);
    return;
  }
  const preset = presetForEye(runtime, expression, isLeftEye, now);
  const transform = buildLookTransform(runtime, eyesConfig, isLeftEye);
  const shape = buildRasterEyeShape(eyesConfig, centerX, centerY, preset, transform, blinkAmount);
  const mirror = isLeftEye;
  const physicalMinX = mirror ? centerX * 2 - shape.maxX : shape.minX;
  const physicalMaxX = mirror ? centerX * 2 - shape.minX : shape.maxX;
  const startX = clamp(Math.floor(physicalMinX) - 1, 0, 63);
  const endX = clamp(Math.ceil(physicalMaxX) + 1, 0, 63);
  const startY = clamp(Math.floor(shape.minY) - 1, 0, 63);
  const endY = clamp(Math.ceil(shape.maxY) + 1, 0, 63);
  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      let sampleX = x + 0.5;
      const sampleY = y + 0.5;
      if (mirror) {
        sampleX = centerX * 2 - sampleX;
      }
      if (containsShapePoint(shape, sampleX, sampleY)) {
        pixelMap.set(`${x},${y}`, eyesConfig.style.eyeColor);
      }
    }
  }
}

function mouthTypeForExpression(runtime, eyesConfig, expression) {
  if (eyesConfig.behavior.autoSwitch) {
    return runtime.mouthType;
  }
  return previewPrimaryMouthForExpression(expression);
}

function drawPreviewMouth(pixelMap, runtime, eyesConfig, localPreview, expression) {
  if (!localPreview.mouthEnabled) {
    return;
  }
  const mouthType = mouthTypeForExpression(runtime, eyesConfig, expression);
  if (mouthType === "none") {
    return;
  }
  const mouthPattern = MOUTH_PIXEL_PATTERNS[mouthType];
  if (!mouthPattern) {
    return;
  }
  const mouthColorBase = expression === HEART_EXPRESSION_VALUE ? HEART_EYE_COLOR : eyesConfig.style.eyeColor;
  const mouthColor = scaleHexColor(mouthColorBase, 0.82);
  let followX = 0;
  if (runtime.mouthLookX > 0.36) {
    followX = 1;
  } else if (runtime.mouthLookX < -0.36) {
    followX = -1;
  }
  let followY = 0;
  if (runtime.mouthLookY > 0.28) {
    followY = 1;
  } else if (runtime.mouthLookY < -0.32) {
    followY = -1;
  }
  const baseX = clamp(32 + localPreview.mouthOffsetX + followX, 6, 57);
  const baseY = clamp(
    Math.round(
      eyesConfig.layout.eyeY +
      eyesConfig.layout.eyeHeight * 0.65 +
      3 +
      localPreview.mouthOffsetY +
      followY,
    ),
    10,
    50,
  );
  mouthPattern.forEach(([offsetX, offsetY]) => {
    setPreviewPixel(pixelMap, baseX + offsetX, baseY + offsetY, mouthColor);
  });
}

export function createSpiritPreviewRuntime(expression) {
  const now = Date.now();
  return {
    expression,
    clusterKey: previewClusterForExpression(expression),
    history: [expression],
    lookX: 0,
    lookY: 0,
    targetLookX: 0,
    targetLookY: 0,
    leftLookOffsetX: 0,
    leftLookOffsetY: 0,
    rightLookOffsetX: 0,
    rightLookOffsetY: 0,
    targetLeftLookOffsetX: 0,
    targetLeftLookOffsetY: 0,
    targetRightLookOffsetX: 0,
    targetRightLookOffsetY: 0,
    mouthLookX: 0,
    mouthLookY: 0,
    blinkActive: false,
    blinkStartAt: 0,
    leftBlinkDelayMs: 0,
    rightBlinkDelayMs: 0,
    leftBlinkScale: 1,
    rightBlinkScale: 1,
    lastBlinkAt: now,
    nextBlinkAfterMs: 0,
    lastLookAt: now,
    nextLookAfterMs: 0,
    lastExpressionAt: now,
    nextExpressionAfterMs: 0,
    segmentStartAt: now,
    segmentDurationMs: 0,
    mouthType: previewPrimaryMouthForExpression(expression),
    lastMouthAt: now,
    mouthShiftAt: 0,
    segmentMouthShifted: false,
    actionExpireAt: 0,
    lastInteractionAt: now,
  };
}

export function triggerSpiritPreviewAction(runtime, action) {
  const now = Date.now();
  runtime.lastInteractionAt = now;
  if (action === "blink") {
    startPreviewBlink(runtime);
    return;
  }
  if (action === "look_left") {
    runtime.targetLookX = -1;
    runtime.targetLookY = 0;
  } else if (action === "look_center") {
    runtime.targetLookX = 0;
    runtime.targetLookY = 0;
  } else if (action === "look_right") {
    runtime.targetLookX = 1;
    runtime.targetLookY = 0;
  } else {
    return;
  }
  runtime.targetLeftLookOffsetX = 0;
  runtime.targetLeftLookOffsetY = 0;
  runtime.targetRightLookOffsetX = 0;
  runtime.targetRightLookOffsetY = 0;
  runtime.lastLookAt = now;
  runtime.actionExpireAt = now + 1800;
}

export function stepSpiritPreview(runtime, eyesConfig, selectedExpression) {
  const now = Date.now();
  if (runtime.segmentDurationMs === 0) {
    const seedExpression = eyesConfig.behavior.autoSwitch
      ? resolvePreviewSeedExpression(selectedExpression, eyesConfig, now)
      : selectedExpression;
    runtime.expression = seedExpression;
    runtime.clusterKey = previewClusterForExpression(seedExpression);
    runtime.history = [seedExpression];
    startPreviewSegment(runtime, eyesConfig.behavior.expressionRhythm, runtime.clusterKey, now);
    syncPreviewMouthForExpression(runtime, eyesConfig, now, true);
  }
  updatePreviewRuntime(runtime, eyesConfig, selectedExpression, now);
}

export function getSpiritTimePreviewText(eyesConfig) {
  return eyesConfig.time.showSeconds ? "12:34:56" : "12:34";
}

export function getSpiritTimeLayoutBounds(eyesConfig) {
  const textWidth = Math.max(
    0,
    Math.round(getClockTextWidth(getSpiritTimePreviewText(eyesConfig), eyesConfig.time.font, eyesConfig.time.fontSize)),
  );
  const textHeight = Math.max(0, Math.round(getClockTextHeight(eyesConfig.time.font, eyesConfig.time.fontSize)));
  const maxStartX = Math.max(0, 64 - textWidth);
  const maxTimeY = Math.max(0, 64 - textHeight);
  if (eyesConfig.time.align === "center") {
    const anchorOffset = Math.floor(textWidth / 2);
    return {
      minAnchorX: anchorOffset,
      maxAnchorX: maxStartX + anchorOffset,
      minTimeY: 0,
      maxTimeY,
      minStartX: 0,
      maxStartX,
    };
  }
  if (eyesConfig.time.align === "right") {
    return {
      minAnchorX: textWidth,
      maxAnchorX: maxStartX + textWidth,
      minTimeY: 0,
      maxTimeY,
      minStartX: 0,
      maxStartX,
    };
  }
  return {
    minAnchorX: 0,
    maxAnchorX: maxStartX,
    minTimeY: 0,
    maxTimeY,
    minStartX: 0,
    maxStartX,
  };
}

export function resolveSpiritTimeStartX(eyesConfig) {
  const bounds = getSpiritTimeLayoutBounds(eyesConfig);
  const textWidth = getClockTextWidth(
    getSpiritTimePreviewText(eyesConfig),
    eyesConfig.time.font,
    eyesConfig.time.fontSize,
  );
  const anchorX = Number(eyesConfig.layout.timeX);
  if (eyesConfig.time.align === "center") {
    return clamp(anchorX - Math.floor(textWidth / 2), bounds.minStartX, bounds.maxStartX);
  }
  if (eyesConfig.time.align === "right") {
    return clamp(anchorX - textWidth, bounds.minStartX, bounds.maxStartX);
  }
  return clamp(anchorX, bounds.minStartX, bounds.maxStartX);
}

export function normalizeSpiritTimeLayout(eyesConfig) {
  eyesConfig.time.fontSize = clamp(Number(eyesConfig.time.fontSize), 1, 3);
  if (
    eyesConfig.time.align !== "left" &&
    eyesConfig.time.align !== "center" &&
    eyesConfig.time.align !== "right"
  ) {
    eyesConfig.time.align = "center";
  }
  const bounds = getSpiritTimeLayoutBounds(eyesConfig);
  eyesConfig.layout.timeX = clamp(Number(eyesConfig.layout.timeX), bounds.minAnchorX, bounds.maxAnchorX);
  eyesConfig.layout.timeY = clamp(Number(eyesConfig.layout.timeY), bounds.minTimeY, bounds.maxTimeY);
  return eyesConfig;
}

export function buildEyesConfigPayload(eyesConfig) {
  const bounds = getSpiritTimeLayoutBounds(eyesConfig);
  return {
    layout: {
      eyeY: eyesConfig.layout.eyeY,
      eyeSpacing: eyesConfig.layout.eyeSpacing,
      eyeWidth: eyesConfig.layout.eyeWidth,
      eyeHeight: eyesConfig.layout.eyeHeight,
      timeX: resolveSpiritTimeStartX(eyesConfig),
      timeY: clamp(Number(eyesConfig.layout.timeY), bounds.minTimeY, bounds.maxTimeY),
    },
    behavior: {
      autoSwitch: eyesConfig.behavior.autoSwitch,
      blinkIntervalMs: eyesConfig.behavior.blinkIntervalMs,
      lookIntervalMs: eyesConfig.behavior.lookIntervalMs,
      idleMove: eyesConfig.behavior.idleMove,
      sleepyAfterMs: eyesConfig.behavior.sleepyAfterMs,
      expressionRhythm: eyesConfig.behavior.expressionRhythm,
    },
    interaction: {
      lookHoldMs: eyesConfig.interaction.lookHoldMs,
      moodHoldMs: eyesConfig.interaction.moodHoldMs,
    },
    time: {
      show: eyesConfig.time.show,
      showSeconds: eyesConfig.time.showSeconds,
      font: eyesConfig.time.font,
      fontSize: eyesConfig.time.fontSize,
    },
    style: {
      eyeColor: eyesConfig.style.eyeColor,
      timeColor: eyesConfig.style.timeColor,
    },
  };
}

export function buildSpiritPreviewPixels(eyesConfig, selectedExpression, localPreview, runtime) {
  const pixelMap = new Map();
  const now = Date.now();
  const expression = eyesConfig.behavior.autoSwitch ? runtime.expression : selectedExpression;
  if (!PRESETS[expression]) {
    throw new Error("未识别的桌面宠物表情");
  }

  if (eyesConfig.time.show) {
    drawClockTextToMap({
      map: pixelMap,
      text: getCurrentTimeText(eyesConfig.time.showSeconds, 24),
      x: eyesConfig.layout.timeX,
      y: eyesConfig.layout.timeY,
      color: eyesConfig.style.timeColor,
      fontId: eyesConfig.time.font,
      fontSize: eyesConfig.time.fontSize,
      align: eyesConfig.time.align,
    });
  }

  const totalWidth = eyesConfig.layout.eyeWidth * 2 + eyesConfig.layout.eyeSpacing;
  const leftCenterX = (64 - totalWidth) / 2 + eyesConfig.layout.eyeWidth / 2;
  const rightCenterX = leftCenterX + eyesConfig.layout.eyeWidth + eyesConfig.layout.eyeSpacing;
  const centerY = eyesConfig.layout.eyeY;
  const isHeartExpression = expression === HEART_EXPRESSION_VALUE;
  const leftBlinkAmount = blinkAmountForEye(runtime, now, true);
  const rightBlinkAmount = isHeartExpression ? leftBlinkAmount : blinkAmountForEye(runtime, now, false);

  drawEye(pixelMap, runtime, eyesConfig, leftCenterX, centerY, expression, true, leftBlinkAmount, now);
  drawEye(pixelMap, runtime, eyesConfig, rightCenterX, centerY, expression, false, rightBlinkAmount, now);
  drawPreviewMouth(pixelMap, runtime, eyesConfig, localPreview, expression);

  return pixelMap;
}
