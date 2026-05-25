// 传送门(瑞克和莫迪主题)模式的本地预览模块。
// 设计原则:
// 1. 完全复用 planetScreensaverPreview.js 里已经做好的 portal 渲染管线,
//    但只暴露给传送门页"颜色 / 大小 / 位置"这几个真正能调的字段。
// 2. 不暴露 seed / colorSeed / direction / speed —— 传送门固定 60s 周期、
//    固定调色板、固定方向,这些参数对用户没有意义。
// 3. 字段名严格按 docs/非外接依赖全量参数映射表.md + WS 命令 set_rick_morty_portal:
//    preset / size / portalX / portalY / font / showSeconds / time
//
// 渲染层依赖:
//   buildPlanetScreensaverPreviewFrame    — 复用同一帧渲染函数
//   PLANET_REFERENCE_DEFAULT_COLOR_SEED  — portal 走固定调色板的 seed 锁
//
// 角色叠加已移除 (Pocket Mortys 像素角色实际效果不佳, 暂时只做纯传送门)

import {
  PLANET_REFERENCE_DEFAULT_COLOR_SEED,
  PLANET_PREVIEW_PLAYBACK_INTERVAL_MS,
  buildPlanetScreensaverPreviewFrame,
  buildPlanetScreensaverPreviewSequence,
} from "./planetScreensaverPreview.js";

export const PORTAL_PAGE_STORAGE_KEY = "rick_morty_portal_page_state";

// 三种 canon 颜色变体 —— 来源:动画正剧
//   绿色:Rick C-137 的标准传送门(全剧)
//   蓝色:Rick 早期原型枪(S3E1 The Rickshank Rickdemption 闪回)
//   黄色:邪恶莫迪的传送门(S5E10 大结局)
export const PORTAL_COLOR_OPTIONS = Object.freeze([
  { id: "portal_green", label: "绿色" },
  { id: "portal_blue", label: "蓝色" },
  { id: "portal_yellow", label: "黄色" },
]);

export const PORTAL_SIZE_OPTIONS = Object.freeze([
  { id: "small", label: "小" },
  { id: "medium", label: "中" },
  { id: "large", label: "大" },
]);

export const PORTAL_TIME_COLOR_OPTIONS = Object.freeze([
  { name: "青色", hex: "#64c8ff" },
  { name: "绿色", hex: "#00ff9d" },
  { name: "黄色", hex: "#ffdc00" },
  { name: "橙色", hex: "#ffa500" },
  { name: "红色", hex: "#ff6464" },
  { name: "紫色", hex: "#c864ff" },
  { name: "白色", hex: "#ffffff" },
]);

export const PORTAL_PREVIEW_PLAYBACK_INTERVAL_MS = PLANET_PREVIEW_PLAYBACK_INTERVAL_MS;

const PORTAL_PRESET_IDS = PORTAL_COLOR_OPTIONS.map((item) => item.id);
const PORTAL_SIZE_IDS = PORTAL_SIZE_OPTIONS.map((item) => item.id);

export function createDefaultPortalPreviewConfig() {
  return {
    preset: "portal_green",
    size: "medium",
    portalX: 32,
    portalY: 32,
  };
}

export function createDefaultPortalClockConfig() {
  return {
    font: "classic_5x7",
    showSeconds: false,
    time: {
      show: true,
      fontSize: 1,
      x: 32,
      y: 5,
      color: "#ffffff",
      align: "center",
    },
  };
}

function clampInt(value, min, max, fallback) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  const rounded = Math.round(numericValue);
  if (rounded < min) {
    return min;
  }
  if (rounded > max) {
    return max;
  }
  return rounded;
}

function normalizeHexColor(value, fallback) {
  if (typeof value !== "string") {
    return fallback;
  }
  const body = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(body)) {
    return fallback;
  }
  return `#${body.toLowerCase()}`;
}

export function normalizePortalPageState(saved) {
  const config = createDefaultPortalPreviewConfig();
  const clockConfig = createDefaultPortalClockConfig();
  const state = saved && typeof saved === "object" ? saved : {};

  if (state.config && typeof state.config === "object") {
    if (PORTAL_PRESET_IDS.includes(state.config.preset)) {
      config.preset = state.config.preset;
    }
    if (PORTAL_SIZE_IDS.includes(state.config.size)) {
      config.size = state.config.size;
    }
    config.portalX = clampInt(state.config.portalX, 0, 63, config.portalX);
    config.portalY = clampInt(state.config.portalY, 0, 63, config.portalY);
  }

  if (state.clockConfig && typeof state.clockConfig === "object") {
    if (typeof state.clockConfig.font === "string" && state.clockConfig.font.length > 0) {
      clockConfig.font = state.clockConfig.font;
    }
    if (state.clockConfig.showSeconds === true || state.clockConfig.showSeconds === false) {
      clockConfig.showSeconds = state.clockConfig.showSeconds;
    }
    if (state.clockConfig.time && typeof state.clockConfig.time === "object") {
      const time = state.clockConfig.time;
      if (time.show === true || time.show === false) {
        clockConfig.time.show = time.show;
      }
      clockConfig.time.fontSize = clampInt(time.fontSize, 1, 3, clockConfig.time.fontSize);
      clockConfig.time.x = clampInt(time.x, 0, 63, clockConfig.time.x);
      clockConfig.time.y = clampInt(time.y, 0, 63, clockConfig.time.y);
      clockConfig.time.color = normalizeHexColor(time.color, clockConfig.time.color);
      if (time.align === "left" || time.align === "center" || time.align === "right") {
        clockConfig.time.align = time.align;
      }
    }
  }

  return { config, clockConfig };
}

// 把传送门页 config 翻译成 planet 渲染可用的 config。
// portalX/Y -> planetX/Y, 其他维度都用固定值锁住:
//   colorSeed = PLANET_REFERENCE_DEFAULT_COLOR_SEED (传送门固定调色板的 seed 锁)
//   direction = "right"
//   speed = 3
//   seed = 0 (portal 渲染不用背景星空 seed)
function toPortalPlanetConfig(config) {
  return {
    preset: config.preset,
    size: config.size,
    direction: "right",
    speed: 3,
    seed: 0,
    colorSeed: PLANET_REFERENCE_DEFAULT_COLOR_SEED,
    planetX: clampInt(config.portalX, 0, 63, 32),
    planetY: clampInt(config.portalY, 0, 63, 32),
  };
}

export function buildPortalPreviewFrame(config, progressValue) {
  return buildPlanetScreensaverPreviewFrame(
    toPortalPlanetConfig(config),
    progressValue,
  );
}

export function buildPortalPreviewSequence(config) {
  return buildPlanetScreensaverPreviewSequence(toPortalPlanetConfig(config));
}

export function buildPortalSendPayload(config, clockConfig) {
  return {
    preset: config.preset,
    size: config.size,
    portalX: clampInt(config.portalX, 0, 63, 32),
    portalY: clampInt(config.portalY, 0, 63, 32),
    font: clockConfig.font,
    showSeconds: clockConfig.showSeconds === true,
    time: {
      show: clockConfig.time.show === true,
      fontSize: clampInt(clockConfig.time.fontSize, 1, 3, 1),
      x: clampInt(clockConfig.time.x, 0, 63, 32),
      y: clampInt(clockConfig.time.y, 0, 63, 5),
      color: clockConfig.time.color,
    },
  };
}
