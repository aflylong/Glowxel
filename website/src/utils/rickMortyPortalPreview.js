// 浼犻€侀棬(鐟炲厠鍜岃帿杩富棰?妯″紡鐨勬湰鍦伴瑙堟ā鍧椼€?
// 璁捐鍘熷垯:
// 1. 瀹屽叏澶嶇敤 planetScreensaverPreview.js 閲屽凡缁忓仛濂界殑 portal 娓叉煋绠＄嚎,
//    浣嗗彧鏆撮湶缁欎紶閫侀棬椤?棰滆壊 / 澶у皬 / 浣嶇疆"杩欏嚑涓湡姝ｈ兘璋冪殑瀛楁銆?"
// 2. 涓嶆毚闇?seed / colorSeed / direction / speed 鈥斺€?浼犻€侀棬鍥哄畾 60s 鍛ㄦ湡銆?
//    鍥哄畾璋冭壊鏉裤€佸浐瀹氭柟鍚?杩欎簺鍙傛暟瀵圭敤鎴锋病鏈夋剰涔夈€?
// 3. 瀛楁鍚嶄弗鏍兼寜 docs/闈炲鎺ヤ緷璧栧叏閲忓弬鏁版槧灏勮〃.md + WS 鍛戒护 set_rick_morty_portal:
//    preset / size / portalX / portalY / font / showSeconds / time
//
// 娓叉煋灞備緷璧?
//   buildPlanetScreensaverPreviewFrame    鈥?澶嶇敤鍚屼竴甯ф覆鏌撳嚱鏁?
//   PLANET_REFERENCE_DEFAULT_COLOR_SEED  鈥?portal 璧板浐瀹氳皟鑹叉澘鐨?seed 閿?
//
// 瑙掕壊鍙犲姞宸茬Щ闄?(Pocket Mortys 鍍忕礌瑙掕壊瀹為檯鏁堟灉涓嶄匠, 鏆傛椂鍙仛绾紶閫侀棬)

import {
  PLANET_REFERENCE_DEFAULT_COLOR_SEED,
  PLANET_PREVIEW_PLAYBACK_INTERVAL_MS,
  buildPlanetScreensaverPreviewFrame,
  buildPlanetScreensaverPreviewSequence,
} from "./planetScreensaverPreview.js";

export const PORTAL_PAGE_STORAGE_KEY = "rick_morty_portal_page_state";

// 涓夌 canon 棰滆壊鍙樹綋 鈥斺€?鏉ユ簮:鍔ㄧ敾姝ｅ墽
//   缁胯壊:Rick C-137 鐨勬爣鍑嗕紶閫侀棬(鍏ㄥ墽)
//   钃濊壊:Rick 鏃╂湡鍘熷瀷鏋?S3E1 The Rickshank Rickdemption 闂洖)
//   榛勮壊:閭伓鑾开鐨勪紶閫侀棬(S5E10 澶х粨灞€)
export const PORTAL_COLOR_OPTIONS = Object.freeze([
  { id: "portal_green", label: "缁胯壊" },
  { id: "portal_blue", label: "钃濊壊" },
  { id: "portal_yellow", label: "榛勮壊" },
]);

export const PORTAL_SIZE_OPTIONS = Object.freeze([
  { id: "small"", label: "灏?" },"
  { id: "medium"", label: "涓?" },"
  { id: "large"", label: "澶?" },"
]);

export const PORTAL_TIME_COLOR_OPTIONS = Object.freeze([
  { name: "闈掕壊", hex: "#64c8ff" },
  { name: "缁胯壊", hex: "#00ff9d" },
  { name: "榛勮壊", hex: "#ffdc00" },
  { name: "姗欒壊", hex: "#ffa500" },
  { name: "绾㈣壊", hex: "#ff6464" },
  { name: "绱壊", hex: "#c864ff" },
  { name: "鐧借壊", hex: "#ffffff" },
]);

export const PORTAL_PREVIEW_PLAYBACK_INTERVAL_MS = PLANET_PREVIEW_PLAYBACK_INTERVAL_MS;

const PORTAL_PRESET_IDS = PORTAL_COLOR_OPTIONS.map((item) => item.id);
const PORTAL_SIZE_IDS = PORTAL_SIZE_OPTIONS.map((item) => item.id);
export const PORTAL_ROTATE_INTERVAL_OPTIONS = Object.freeze([
  { value: 60, label: "1鍒嗛挓" },
  { value: 300, label: "5鍒嗛挓" },
  { value: 600, label: "10鍒嗛挓" },
  { value: 1800, label: "30鍒嗛挓" },
  { value: 3600, label: "60鍒嗛挓" },
]);
const PORTAL_ROTATE_INTERVAL_VALUES = PORTAL_ROTATE_INTERVAL_OPTIONS.map((item) => item.value);

export function isPortalRotateIntervalValue(value) {
  return PORTAL_ROTATE_INTERVAL_VALUES.includes(Number(value));
}

export function createDefaultPortalPreviewConfig() {
  return {
    preset: "portal_green",
    size: "medium",
    portalX: 32,
    portalY: 32,
    autoRotate: {
      enabled: false,
      interval: 300,
    },
  };
}

export function createDefaultPortalClockConfig() {
  return {
    font: "minimal_3x5",
    showSeconds: false,
    time: {
      show: true,
      fontSize: 1,
      x: 32,
      y: 2,
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
    if (state.config.autoRotate && typeof state.config.autoRotate === "object") {
      if (
        state.config.autoRotate.enabled === true ||
        state.config.autoRotate.enabled === false
      ) {
        config.autoRotate.enabled = state.config.autoRotate.enabled;
      }
      const interval = Number(state.config.autoRotate.interval);
      if (PORTAL_ROTATE_INTERVAL_VALUES.includes(interval)) {
        config.autoRotate.interval = interval;
      }
    }
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

// 鎶婁紶閫侀棬椤?config 缈昏瘧鎴?planet 娓叉煋鍙敤鐨?config銆?
// portalX/Y -> planetX/Y, 鍏朵粬缁村害閮界敤鍥哄畾鍊奸攣浣?
//   colorSeed = PLANET_REFERENCE_DEFAULT_COLOR_SEED (浼犻€侀棬鍥哄畾璋冭壊鏉跨殑 seed 閿?
//   direction = "right"
//   speed = 3
//   seed = 0 (portal 娓叉煋涓嶇敤鑳屾櫙鏄熺┖ seed)
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

function resolvePortalRotateSlotAt(nowMs, intervalSeconds) {
  const slotDurationMs = intervalSeconds * 1000;
  return Math.floor(nowMs / slotDurationMs);
}

function hashPortalRotateSlot(slot) {
  let value = (slot ^ 0x6d2b79f5) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b) >>> 0;
  value ^= value >>> 16;
  return value >>> 0;
}

export function resolvePortalPresetForPreview(config, nowMs = Date.now()) {
  if (config.autoRotate.enabled !== true) {
    return config.preset;
  }
  const interval = Number(config.autoRotate.interval);
  if (!isPortalRotateIntervalValue(interval)) {
    throw new Error("invalid portal autoRotate interval");
  }
  const slot = resolvePortalRotateSlotAt(nowMs, interval);
  const index = hashPortalRotateSlot(slot) % PORTAL_PRESET_IDS.length;
  return PORTAL_PRESET_IDS[index];
}

export function buildPortalSendPayload(config, clockConfig) {
  if (!isPortalRotateIntervalValue(config.autoRotate.interval)) {
    throw new Error("invalid portal autoRotate interval");
  }
  return {
    preset: config.preset,
    size: config.size,
    portalX: clampInt(config.portalX, 0, 63, 32),
    portalY: clampInt(config.portalY, 0, 63, 32),
    autoRotate: {
      enabled: config.autoRotate.enabled === true,
      interval: Number(config.autoRotate.interval),
    },
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
