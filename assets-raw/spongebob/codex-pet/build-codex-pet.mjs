import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(import.meta.dirname, "../../..");
const SOURCE_PATH = path.join(ROOT_DIR, "website/public/spongebob/character-frame-pixels.json");
const OUTPUT_DIR = path.join(ROOT_DIR, "assets-raw/spongebob/codex-pet");
const OUTPUT_PATH = path.join(OUTPUT_DIR, "codex-pet-frames.json");
const PANEL_W = 64;
const PANEL_H = 64;
const OUTLINE_COLOR = "#173047";
const FRAME_MS = 180;
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

const POSES = Object.freeze({
  spongebobIdle: { character: "spongebob", action: "ldle" },
  patrickIdle: { character: "patrick", action: "ldle" },
  spongebobThink: { character: "spongebob", action: "beingdumb" },
  patrickThink: { character: "patrick", action: "beingdumb" },
  spongebobWork: { character: "spongebob", action: "walk" },
  patrickWork: { character: "patrick", action: "walk" },
  spongebobJump: { character: "spongebob", action: "jump" },
  patrickJump: { character: "patrick", action: "jump" },
  spongebobCheer: { character: "spongebob", action: "cheering" },
  patrickCheer: { character: "patrick", action: "cheering" },
  spongebobFail: { character: "spongebob", action: "fail" },
  patrickFail: { character: "patrick", action: "fail" },
  patrickScared: { character: "patrick", action: "scared" },
  spongebobSleep: { character: "spongebob", action: "sleeping" },
  patrickSleep: { character: "patrick", action: "sleeping" },
  spongebobDanceA: { character: "spongebob", action: "dance" },
  spongebobDanceC: { character: "spongebob", action: "dance3" },
  spongebobDanceB: { character: "spongebob", action: "dance4" },
  spongebobDanceD: { character: "spongebob", action: "dance5" },
  patrickDanceA: { character: "patrick", action: "dance1" },
  patrickDanceC: { character: "patrick", action: "dance2" },
  patrickDanceD: { character: "patrick", action: "dance3" },
  patrickDanceB: { character: "patrick", action: "dance4" },
  patrickDrink: { character: "patrick", action: "drink" },
});

const STATES = Object.freeze([
  {
    id: "idle",
    name: "待机",
    description: "Codex 空闲时的基础呼吸感，两个角色都慢速待机。",
    loops: true,
    sequence: [
      step(POSES.spongebobIdle, POSES.patrickIdle, 2),
      step(POSES.spongebobIdle, POSES.patrickIdle, 2),
    ],
  },
  {
    id: "thinking",
    name: "思考",
    description: "Codex 正在分析时，海绵宝宝发呆，派大星跟着慢半拍。",
    loops: true,
    sequence: [
      step(POSES.spongebobThink, POSES.patrickIdle, 1),
      step(POSES.spongebobThink, POSES.patrickThink, 1),
      step(POSES.spongebobIdle, POSES.patrickThink, 1),
      step(POSES.spongebobIdle, POSES.patrickIdle, 2),
    ],
  },
  {
    id: "working",
    name: "执行中",
    description: "Codex 正在跑任务时，两边交替走动，形成忙碌节奏。",
    loops: true,
    sequence: [
      step(POSES.spongebobWork, POSES.patrickIdle, 1),
      step(POSES.spongebobWork, POSES.patrickWork, 1),
      step(POSES.spongebobIdle, POSES.patrickWork, 1),
      step(POSES.spongebobWork, POSES.patrickWork, 1),
    ],
  },
  {
    id: "dance",
    name: "舞蹈",
    description: "完整舞蹈系列状态。海绵宝宝使用 dance/dance3/dance4/dance5，派大星使用 dance1/dance2/dance3/dance4，明确避开派大星 dance5。",
    loops: true,
    sequence: [
      step(POSES.spongebobIdle, POSES.patrickIdle, 2),
      step(POSES.spongebobDanceA, POSES.patrickDanceA, 1),
      step(POSES.spongebobDanceC, POSES.patrickDanceC, 1),
      step(POSES.spongebobDanceB, POSES.patrickDanceD, 1),
      step(POSES.spongebobDanceD, POSES.patrickDanceB, 1),
      step(POSES.spongebobCheer, POSES.patrickCheer, 1),
    ],
  },
  {
    id: "fail",
    name: "失败",
    description: "明确保留 fail 动作。任务失败或报错时播放，结束后建议回到 idle。",
    loops: false,
    sequence: [
      step(POSES.spongebobIdle, POSES.patrickIdle, 1),
      step(POSES.spongebobFail, POSES.patrickFail, 2),
      step(POSES.spongebobFail, POSES.patrickScared, 1),
      hold(POSES.spongebobFail, POSES.patrickFail, 8),
      hold(POSES.spongebobIdle, POSES.patrickIdle, 4),
    ],
  },
  {
    id: "success",
    name: "完成",
    description: "任务成功时播放一次欢呼，之后应回到 idle。",
    loops: false,
    sequence: [
      step(POSES.spongebobIdle, POSES.patrickIdle, 2),
      step(POSES.spongebobCheer, POSES.patrickCheer, 2),
      step(POSES.spongebobJump, POSES.patrickJump, 1),
      step(POSES.spongebobCheer, POSES.patrickCheer, 1),
      hold(POSES.spongebobIdle, POSES.patrickIdle, 6),
    ],
  },
  {
    id: "error",
    name: "出错",
    description: "任务失败或需要注意时，海绵宝宝失败，派大星受惊。",
    loops: false,
    sequence: [
      step(POSES.spongebobIdle, POSES.patrickIdle, 1),
      step(POSES.spongebobFail, POSES.patrickScared, 2),
      hold(POSES.spongebobFail, POSES.patrickScared, 6),
      hold(POSES.spongebobIdle, POSES.patrickIdle, 4),
    ],
  },
  {
    id: "sleeping",
    name: "睡眠",
    description: "长时间不操作或夜间使用，睡眠动作播完后停在最终帧。",
    loops: false,
    sequence: [
      step(POSES.spongebobIdle, POSES.patrickIdle, 2),
      step(POSES.spongebobSleep, POSES.patrickSleep, 1),
      hold(POSES.spongebobSleep, POSES.patrickSleep, 12),
    ],
  },
  {
    id: "celebrate",
    name: "庆祝",
    description: "连续完成大任务时的双人舞蹈，已避开派大星 dance5。",
    loops: false,
    sequence: [
      step(POSES.spongebobDanceA, POSES.patrickDanceA, 1),
      step(POSES.spongebobDanceB, POSES.patrickDanceB, 1),
      step(POSES.spongebobCheer, POSES.patrickCheer, 1),
      hold(POSES.spongebobIdle, POSES.patrickIdle, 5),
    ],
  },
  {
    id: "random",
    name: "随机小动作",
    description: "空闲间隔里偶尔触发的短动作，播放后回到 idle 停顿。",
    loops: false,
    sequence: [
      hold(POSES.spongebobIdle, POSES.patrickIdle, 4),
      step(POSES.spongebobJump, POSES.patrickIdle, 1),
      hold(POSES.spongebobIdle, POSES.patrickIdle, 3),
      step(POSES.spongebobIdle, POSES.patrickDrink, 1),
      hold(POSES.spongebobIdle, POSES.patrickIdle, 5),
    ],
  },
]);

function step(left, right, passes) {
  return { left, right, passes, mode: "step" };
}

function hold(left, right, frames) {
  return { left, right, frames, mode: "hold" };
}

function readSource() {
  return JSON.parse(fs.readFileSync(SOURCE_PATH, "utf8"));
}

function getFrames(data, pose) {
  const character = data.characters[pose.character];
  if (!character) {
    throw new Error(`missing character: ${pose.character}`);
  }
  const action = character.actions[pose.action];
  if (!action) {
    throw new Error(`missing action: ${pose.character}/${pose.action}`);
  }
  return action.frames;
}

function getFrameMetrics(frame, transparent) {
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
  return {
    anchorX: samples.length > 0 ? samples[Math.floor(samples.length / 2)] : Math.round((minX + maxX) / 2),
    footY: maxY,
  };
}

function softenColor(color) {
  const rgb = parseHex(color);
  if (rgb.r <= 24 && rgb.g <= 24 && rgb.b <= 24) {
    return OUTLINE_COLOR;
  }
  return color;
}

function parseHex(color) {
  return {
    r: Number.parseInt(color.slice(1, 3), 16),
    g: Number.parseInt(color.slice(3, 5), 16),
    b: Number.parseInt(color.slice(5, 7), 16),
  };
}

function makeEmptyFrame() {
  const pixels = [];
  for (let y = 0; y < PANEL_H; y += 1) {
    const rowColor = BG2_ROW_COLORS[y];
    for (let x = 0; x < PANEL_W; x += 1) {
      pixels.push(rowColor);
    }
  }
  return pixels;
}

function setPixel(pixels, x, y, color) {
  if (x < 0 || y < 0 || x >= PANEL_W || y >= PANEL_H) {
    return;
  }
  pixels[y * PANEL_W + x] = color;
}

function drawScaledPixel(pixels, x, y, scale, color) {
  const size = Math.max(1, Math.round(scale));
  for (let yy = 0; yy < size; yy += 1) {
    for (let xx = 0; xx < size; xx += 1) {
      setPixel(pixels, x + xx, y + yy, color);
    }
  }
}

function drawCharacter(pixels, data, pose, frameIndex, anchorX) {
  const frames = getFrames(data, pose);
  const frame = frames[Math.min(frameIndex, frames.length - 1)];
  const metrics = getFrameMetrics(frame, data.transparent);
  const scale = 0.55;
  const floorY = 53;
  for (let sy = 0; sy < frame.h; sy += 1) {
    for (let sx = 0; sx < frame.w; sx += 1) {
      const colorIndex = frame.p[sy * frame.w + sx];
      if (colorIndex === data.transparent) {
        continue;
      }
      const dx = Math.round(anchorX + (sx - metrics.anchorX) * scale);
      const dy = Math.round(floorY + (sy - metrics.footY) * scale);
      drawScaledPixel(pixels, dx, dy, scale, softenColor(data.palette[colorIndex]));
    }
  }
}

function renderFrame(data, leftPose, leftFrameIndex, rightPose, rightFrameIndex) {
  const pixels = makeEmptyFrame();
  drawCharacter(pixels, data, leftPose, leftFrameIndex, 18);
  drawCharacter(pixels, data, rightPose, rightFrameIndex, 46);
  return pixels;
}

function buildStepFrames(data, item) {
  const leftFrames = getFrames(data, item.left);
  const rightFrames = getFrames(data, item.right);
  const frameCount = Math.max(leftFrames.length, rightFrames.length) * item.passes;
  const frames = [];
  for (let i = 0; i < frameCount; i += 1) {
    frames.push(renderFrame(
      data,
      item.left,
      i % leftFrames.length,
      item.right,
      i % rightFrames.length,
    ));
  }
  return frames;
}

function buildHoldFrames(data, item) {
  const leftFrames = getFrames(data, item.left);
  const rightFrames = getFrames(data, item.right);
  const leftIndex = leftFrames.length - 1;
  const rightIndex = rightFrames.length - 1;
  const frames = [];
  for (let i = 0; i < item.frames; i += 1) {
    frames.push(renderFrame(data, item.left, leftIndex, item.right, rightIndex));
  }
  return frames;
}

function buildState(data, state) {
  const frames = [];
  for (const item of state.sequence) {
    if (item.mode === "step") {
      frames.push(...buildStepFrames(data, item));
      continue;
    }
    if (item.mode === "hold") {
      frames.push(...buildHoldFrames(data, item));
      continue;
    }
    throw new Error(`unknown item mode: ${item.mode}`);
  }
  return {
    id: state.id,
    name: state.name,
    description: state.description,
    loops: state.loops,
    frameMs: FRAME_MS,
    frameCount: frames.length,
    frames: frames.map((pixels, index) => ({
      index,
      pixels,
    })),
  };
}

function buildPackage(data) {
  const states = STATES.map((state) => buildState(data, state));
  return {
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT_DIR, SOURCE_PATH).replaceAll("\\", "/"),
    width: PANEL_W,
    height: PANEL_H,
    outlineColor: OUTLINE_COLOR,
    frameMs: FRAME_MS,
    behavior: {
      idle: "loop",
      thinking: "loop while Codex is reasoning",
      working: "loop while tool/code work is running",
      dance: "loop while explicit dance mode is active",
      fail: "play once then idle",
      success: "play once then idle",
      error: "play once then idle",
      sleeping: "play once then hold final frame",
      celebrate: "play once then idle",
      random: "play once between idle pauses",
    },
    states,
  };
}

const data = readSource();
const output = buildPackage(data);
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(output)}\n`, "utf8");
for (const state of output.states) {
  console.log(`${state.id}: ${state.frameCount} frames`);
}
console.log(`wrote ${OUTPUT_PATH}`);
