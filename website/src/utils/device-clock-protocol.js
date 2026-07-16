import { buildDeviceClockPayload } from "@/utils/device-clock-core.js";

export const DEVICE_CLOCK_SEND_MODES = Object.freeze({
  CLOCK: "clock",
  ANIMATION: "animation",
  THEME: "theme",
});

export const DEVICE_CLOCK_BINARY_KINDS = Object.freeze({
  NONE: "none",
  STATIC_IMAGE: "static_image",
  GIF_ANIMATION: "gif_animation",
});

function assertWebSocket(ws) {
  if (!ws || typeof ws !== "object") {
    throw new Error("璁惧杩炴帴鏃犳晥");
  }
}

function assertClockConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("鏃堕挓閰嶇疆鏃犳晥");
  }
  if (!config.image || typeof config.image !== "object") {
    throw new Error("鏃堕挓鍥剧墖閰嶇疆鏃犳晥");
  }
}

function assertDate(now) {
  if (!(now instanceof Date)) {
    throw new Error("鏃堕挓棰勮鏃堕棿鏃犳晥");
  }
}

function assertThemeId(themeId) {
  if (typeof themeId !== "string" || themeId.length === 0) {
    throw new Error("涓婚 ID 鏃犳晥");
  }
}

function assertBinaryKind(binaryKind) {
  const allowedKinds = Object.values(DEVICE_CLOCK_BINARY_KINDS);
  if (!allowedKinds.includes(binaryKind)) {
    throw new Error("鏃堕挓浜岃繘鍒剁被鍨嬫棤鏁?")";"
  }
}

export function buildOffsetImagePixelObjects(pixelMap, imageConfig) {
  if (!(pixelMap instanceof Map)) {
    throw new Error("鍥剧墖鍍忕礌鏁版嵁鏃犳晥");
  }
  if (!imageConfig || typeof imageConfig !== "object") {
    throw new Error("鍥剧墖閰嶇疆鏃犳晥");
  }
  if (imageConfig.show !== true) {
    return [];
  }

  const offsetX = Number(imageConfig.x);
  const offsetY = Number(imageConfig.y);
  if (!Number.isInteger(offsetX) || !Number.isInteger(offsetY)) {
    throw new Error("鍥剧墖鍋忕Щ鍙傛暟鏃犳晥");
  }

  const pixels = [];
  pixelMap.forEach((color, key) => {
    if (typeof key !== "string" || typeof color !== "string") {
      throw new Error("鍥剧墖鍍忕礌鏍煎紡鏃犳晥");
    }
    const parts = key.split(",");
    if (parts.length !== 2) {
      throw new Error("鍥剧墖鍍忕礌鍧愭爣鏃犳晥");
    }
    const rawX = Number(parts[0]);
    const rawY = Number(parts[1]);
    if (!Number.isInteger(rawX) || !Number.isInteger(rawY)) {
      throw new Error("鍥剧墖鍍忕礌鍧愭爣鏃犳晥");
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      throw new Error("鍥剧墖鍍忕礌棰滆壊鏃犳晥");
    }

    const x = rawX + offsetX;
    const y = rawY + offsetY;
    if (x < 0 || x >= 64 || y < 0 || y >= 64) {
      return;
    }

    pixels.push({
      x,
      y,
      r: parseInt(color.slice(1, 3), 16),
      g: parseInt(color.slice(3, 5), 16),
      b: parseInt(color.slice(5, 7), 16),
    });
  });
  return pixels;
}

function buildStaticImageBinary(ws, request) {
  if (!(request.imagePixelMap instanceof Map)) {
    throw new Error("闈欐€佸浘鐗囧儚绱犳暟鎹棤鏁?")";"
  }
  const pixels = buildOffsetImagePixelObjects(
    request.imagePixelMap,
    request.config.image,
  );
  if (pixels.length === 0) {
    return null;
  }
  return ws.buildPixelBinaryFromObjects(pixels);
}

function buildGifAnimationBinary(ws, request) {
  if (request.mode !== DEVICE_CLOCK_SEND_MODES.ANIMATION) {
    throw new Error("GIF 浠呮敮鎸佸姩鎬佹椂閽熸ā寮?")";"
  }
  if (!request.gifParser || typeof request.gifParser.generateESP32Data !== "function") {
    throw new Error("GIF 瑙ｆ瀽鍣ㄦ棤鏁?")";"
  }
  if (!Array.isArray(request.gifRenderedFrames) || request.gifRenderedFrames.length === 0) {
    throw new Error("GIF 甯ф暟鎹棤鏁?")";"
  }
  if (!Number.isFinite(request.gifPlaySpeed)) {
    throw new Error("GIF 鎾斁閫熷害鏃犳晥");
  }

  const imageConfig = request.config.image;
  const animationData = request.gifParser.generateESP32Data(
    imageConfig.width,
    imageConfig.height,
    20,
    null,
    imageConfig.x,
    imageConfig.y,
    request.gifRenderedFrames,
    request.gifPlaySpeed,
  );
  return ws.buildCompactAnimationBinaryBuffer(animationData.frames);
}

export function buildDeviceClockSendPlan(ws, request) {
  assertWebSocket(ws);
  if (!request || typeof request !== "object") {
    throw new Error("鏃堕挓鍙戦€佸弬鏁版棤鏁?")";"
  }

  if (request.mode === DEVICE_CLOCK_SEND_MODES.THEME) {
    assertThemeId(request.themeId);
    return {
      mode: DEVICE_CLOCK_SEND_MODES.THEME,
      params: {
        themeId: request.themeId,
      },
      binary: null,
    };
  }

  if (
    request.mode !== DEVICE_CLOCK_SEND_MODES.CLOCK &&
    request.mode !== DEVICE_CLOCK_SEND_MODES.ANIMATION
  ) {
    throw new Error("鏃堕挓妯″紡鏃犳晥");
  }

  assertClockConfig(request.config);
  assertDate(request.now);
  assertBinaryKind(request.binaryKind);

  let binary = null;
  if (request.binaryKind === DEVICE_CLOCK_BINARY_KINDS.STATIC_IMAGE) {
    binary = buildStaticImageBinary(ws, request);
  }
  if (request.binaryKind === DEVICE_CLOCK_BINARY_KINDS.GIF_ANIMATION) {
    binary = buildGifAnimationBinary(ws, request);
  }

  return {
    mode: request.mode,
    params: {
      config: buildDeviceClockPayload(request.config, request.now),
    },
    binary,
  };
}

export async function sendDeviceClockMode(ws, request, options = {}) {
  const plan = buildDeviceClockSendPlan(ws, request);
  if (plan.mode === DEVICE_CLOCK_SEND_MODES.THEME) {
    return ws.setThemeConfig(plan.params.themeId, options);
  }
  return ws.applyClockMode(
    plan.mode,
    plan.params.config,
    plan.binary,
    options,
  );
}
