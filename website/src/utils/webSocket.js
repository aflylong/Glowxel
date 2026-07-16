import { getSystemInfo, httpRequest, getNetworkType, connectSocket } from '@/utils/browser-platform.js'
/**
 * WebSocket 閫氳宸ュ叿绫?
 * 鐢ㄤ簬涓?ESP32 LED 鐭╅樀鏉胯繘琛?WebSocket 閫氳
 */

const COMMAND_TIMEOUT_MS = 15000;
const COMMAND_FINAL_TIMEOUT_MS = 45000;
const CONNECT_TIMEOUT_MS = 30000;
const HTTP_RUNTIME_PRECHECK_TIMEOUT_MS = 4000;
const AUTO_RECONNECT_DELAY_MS = 1500;
const AUTO_RECONNECT_MAX_ATTEMPTS = 3;
const ACCEPTED_MESSAGE = "accepted";
const TRANSACTION_ACCEPTED_STATUS = "accepted";
const TRANSACTION_FINAL_OK_STATUS = "final_ok";
const TRANSACTION_FINAL_ERROR_STATUS = "final_error";
const TRANSACTION_ACCEPTED_TIMEOUT_MS = 8000;
const TRANSACTION_FINAL_TIMEOUT_MS = 90000;
const STATIC_PIXEL_BINARY_CHUNK_SIZE = 320;
const STATIC_PIXEL_BINARY_CHUNK_DELAY_MS = 200;
const COMPACT_ANIMATION_BINARY_CHUNK_SIZE = 1000;
const COMPACT_ANIMATION_BINARY_CHUNK_DELAY_MS = 80;
const WS_DEBUG_VERBOSE = false;
const WS_DEBUG_KEY_LABELS = new Set([
  "connect start",
  "connect timeout fired",
  "closeSocketTask",
  "task onOpen",
  "task onClose",
  "task onError",
  "connectSocket fail callback",
  "schedule reconnect",
  "skip reconnect: limit reached",
  "reconnect attempt failed",
]);
const DEFERRED_RENDER_TRANSACTION_MODES = new Set([
  "planet_screensaver",
  "rick_morty_portal",
]);

function shouldAbortUnfinishedTransaction(mode, binaryPayload) {
  if (binaryPayload !== null) {
    return true;
  }
  return !DEFERRED_RENDER_TRANSACTION_MODES.has(mode);
}

function normalizeHexColor(value) {
  if (typeof value !== "string") {
    throw new Error("棰滆壊鍊兼棤鏁?")";"
  }
  const body = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(body)) {
    throw new Error("棰滆壊鍊兼棤鏁?")";"
  }
  return `#${body.toLowerCase()}`;
}

function hexToRgb(value) {
  const normalized = normalizeHexColor(value);
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function normalizeRgbColor(value) {
  if (!value || typeof value !== "object") {
    throw new Error("棰滆壊鍊兼棤鏁?")";"
  }

  const { r, g, b } = value;
  if (
    !Number.isInteger(r) ||
    !Number.isInteger(g) ||
    !Number.isInteger(b) ||
    r < 0 ||
    r > 255 ||
    g < 0 ||
    g > 255 ||
    b < 0 ||
    b > 255
  ) {
    throw new Error("棰滆壊鍊兼棤鏁?")";"
  }

  return { r, g, b };
}

function isErrorResponse(message) {
  return !!(message && (message.error || message.status === "error"));
}

function isRuntimeStatusPayload(message) {
  return !!(
    message &&
    message.status === "ok" &&
    typeof message.ip === "string" &&
    typeof message.width === "number" &&
    typeof message.height === "number" &&
    typeof message.brightness === "number" &&
    typeof message.mode === "string" &&
    typeof message.businessMode === "string" &&
    typeof message.effectMode === "string"
  );
}

function isAcceptedResponse(message) {
  return !!(
    message &&
    message.status === "ok" &&
    message.message === ACCEPTED_MESSAGE
  );
}

function isTransactionAcceptedResponse(message) {
  return !!(
    message &&
    message.status === TRANSACTION_ACCEPTED_STATUS
  );
}

function isTransactionFinalErrorResponse(message) {
  return !!(
    message &&
    message.status === TRANSACTION_FINAL_ERROR_STATUS
  );
}

function isTransactionFinalResponse(message) {
  return !!(
    message &&
    (
      message.status === TRANSACTION_FINAL_OK_STATUS ||
      message.status === TRANSACTION_FINAL_ERROR_STATUS
    )
  );
}

function buildTransactionError(message, fallbackReason) {
  const error = new Error(fallbackReason);

  if (message && typeof message === "object") {
    if (typeof message.reason === "string" && message.reason.length > 0) {
      error.message = message.reason;
    }
    error.transactionResponse = message;
    if (isTransactionFinalResponse(message)) {
      error.transactionFinalReceived = true;
    }
  }

  return error;
}

function normalizeBinaryPayload(data) {
  if (data instanceof ArrayBuffer) {
    return data;
  }

  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }

  throw new Error("浜岃繘鍒舵暟鎹棤鏁?")";"
}

function buildPixelBinaryBufferFromObjects(pixels) {
  if (!Array.isArray(pixels)) {
    throw new Error("鍍忕礌鏁版嵁鏍煎紡鏃犳晥");
  }

  const buffer = new Uint8Array(pixels.length * 5);
  for (let index = 0; index < pixels.length; index += 1) {
    const pixel = pixels[index];
    if (!pixel || typeof pixel !== "object") {
      throw new Error(`绗?${index + 1} 涓儚绱犳牸寮忔棤鏁坄);
    }

    const values = [pixel.x, pixel.y, pixel.r, pixel.g, pixel.b];
    for (let channelIndex = 0; channelIndex < values.length; channelIndex += 1) {
      const value = Number(values[channelIndex]);
      if (!Number.isInteger(value) || value < 0 || value > 255) {
        throw new Error(`绗?${index + 1} 涓儚绱犳暟鎹棤鏁坄);
      }
      buffer[index * 5 + channelIndex] = value;
    }
  }

  return buffer.buffer;
}

function buildPixelBinaryBufferFromPackedPixels(pixelData, width = 64, height = 64) {
  if (!Array.isArray(pixelData) || pixelData.length % 5 !== 0) {
    throw new Error("鍍忕礌鏁版嵁鏍煎紡鏃犳晥");
  }

  const offsetX = Math.floor((64 - width) / 2);
  const offsetY = Math.floor((64 - height) / 2);
  const buffer = new Uint8Array(pixelData.length);

  for (let index = 0; index < pixelData.length; index += 5) {
    const x = Number(pixelData[index]);
    const y = Number(pixelData[index + 1]);
    const r = Number(pixelData[index + 2]);
    const g = Number(pixelData[index + 3]);
    const b = Number(pixelData[index + 4]);

    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      !Number.isInteger(r) ||
      !Number.isInteger(g) ||
      !Number.isInteger(b)
    ) {
      throw new Error("鍍忕礌鏁版嵁鏍煎紡鏃犳晥");
    }

    buffer[index] = x + offsetX;
    buffer[index + 1] = y + offsetY;
    buffer[index + 2] = r;
    buffer[index + 3] = g;
    buffer[index + 4] = b;
  }

  return buffer.buffer;
}

function buildMessageMatcher(expectedMessages) {
  const targets = Array.isArray(expectedMessages)
    ? expectedMessages
    : [expectedMessages];

  return (message) => {
    if (!message || typeof message !== "object") {
      return false;
    }
    if (isErrorResponse(message)) {
      return true;
    }
    if (typeof message.message !== "string") {
      return false;
    }
    return targets.includes(message.message);
  };
}

function normalizeCompactAnimationPixelBytes(pixels, totalPixels, frameIndex) {
  if (pixels instanceof Uint8Array) {
    if (pixels.length !== totalPixels * 5) {
      throw new Error(`绗?${frameIndex + 1} 甯у儚绱犻暱搴︿笉鍖归厤`);
    }
    return pixels;
  }

  if (ArrayBuffer.isView(pixels)) {
    const bytes = new Uint8Array(
      pixels.buffer,
      pixels.byteOffset,
      pixels.byteLength,
    );
    if (bytes.length !== totalPixels * 5) {
      throw new Error(`绗?${frameIndex + 1} 甯у儚绱犻暱搴︿笉鍖归厤`);
    }
    return bytes;
  }

  if (!Array.isArray(pixels) || pixels.length !== totalPixels) {
    throw new Error(`绗?${frameIndex + 1} 甯у儚绱犳暟閲忎笉鍖归厤`);
  }

  const bytes = new Uint8Array(totalPixels * 5);
  for (let pixelIndex = 0; pixelIndex < totalPixels; pixelIndex += 1) {
    const pixel = pixels[pixelIndex];
    if (!Array.isArray(pixel) || pixel.length < 5) {
      throw new Error(`绗?${frameIndex + 1} 甯х ${pixelIndex + 1} 涓儚绱犳牸寮忛敊璇痐);
    }

    const offset = pixelIndex * 5;
    for (let channelIndex = 0; channelIndex < 5; channelIndex += 1) {
      const value = Number(pixel[channelIndex]);
      if (!Number.isInteger(value) || value < 0 || value > 255) {
        throw new Error(
          `绗?${frameIndex + 1} 甯х ${pixelIndex + 1} 涓儚绱犳暟鎹棤鏁坄,
        );
      }
      bytes[offset + channelIndex] = value;
    }
  }

  return bytes;
}

function buildCompactAnimationBinaryBuffer(animationData) {
  if (!Array.isArray(animationData) || animationData.length === 0) {
    throw new Error("鍔ㄧ敾甯т笉鑳戒负绌?")";"
  }

  const normalizedFrames = animationData.map((frame, frameIndex) => {
    if (!Array.isArray(frame) || frame.length < 4) {
      throw new Error(`绗?${frameIndex + 1} 甯ф暟鎹牸寮忛敊璇痐);
    }

    const type = Number(frame[0]);
    const delay = Number(frame[1]);
    const totalPixels = Number(frame[2]);
    const pixels = frame[3];

    if (!Number.isInteger(type) || (type !== 0 && type !== 1)) {
      throw new Error(`绗?${frameIndex + 1} 甯х被鍨嬫棤鏁坄);
    }
    if (!Number.isFinite(delay) || delay < 0 || delay > 65535) {
      throw new Error(`绗?${frameIndex + 1} 甯у欢杩熸棤鏁坄);
    }
    if (!Number.isInteger(totalPixels) || totalPixels < 0 || totalPixels > 65535) {
      throw new Error(`绗?${frameIndex + 1} 甯у儚绱犳暟閲忔棤鏁坄);
    }

    return {
      type,
      delay: Math.round(delay),
      totalPixels,
      pixels: normalizeCompactAnimationPixelBytes(
        pixels,
        totalPixels,
        frameIndex,
      ),
    };
  });

  let totalBytes = 2;
  normalizedFrames.forEach((frame) => {
    totalBytes += 5 + frame.totalPixels * 5;
  });

  const buffer = new ArrayBuffer(totalBytes);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let offset = 0;
  view.setUint16(offset, normalizedFrames.length, true);
  offset += 2;

  normalizedFrames.forEach((frame) => {
    bytes[offset++] = frame.type;
    view.setUint16(offset, frame.delay, true);
    offset += 2;
    view.setUint16(offset, frame.totalPixels, true);
    offset += 2;
    bytes.set(frame.pixels, offset);
    offset += frame.pixels.length;
  });

  return buffer;
}

function isCompactAnimationBinaryPayload(mode, byteLength) {
  if (mode === "gif_player") {
    return true;
  }
  if (mode !== "animation") {
    return false;
  }
  return byteLength > 0 && byteLength % 5 === 2;
}

function resolveTransactionBinaryChunkProfile(mode, byteLength) {
  if (isCompactAnimationBinaryPayload(mode, byteLength)) {
    return {
      chunkSize: COMPACT_ANIMATION_BINARY_CHUNK_SIZE,
      delayMs: COMPACT_ANIMATION_BINARY_CHUNK_DELAY_MS,
    };
  }

  return {
    chunkSize: STATIC_PIXEL_BINARY_CHUNK_SIZE,
    delayMs: STATIC_PIXEL_BINARY_CHUNK_DELAY_MS,
  };
}

function getSetModeSuccessMessage(mode) {
  if (mode === "clock") {
    return "switched to static clock mode";
  }
  if (mode === "canvas") {
    return "switched to canvas mode";
  }
  if (mode === "animation") {
    return "switched to animation mode";
  }
  if (mode === "gif_player") {
    return "switched to gif player mode";
  }
  if (mode === "theme") {
    return "switched to theme mode";
  }
  if (mode === "transferring") {
    return "entered transferring mode";
  }
  if (mode === "text_display") {
    return "switched to text display mode";
  }
  if (mode === "breath_effect") {
    return "switched to breath effect mode";
  }
  if (mode === "rhythm_effect") {
    return "switched to rhythm effect mode";
  }
  if (mode === "ambient_effect") {
    return "switched to ambient effect mode";
  }
  if (mode === "led_matrix_showcase") {
    return "switched to led matrix showcase mode";
  }
  if (mode === "tetris") {
    return "tetris started";
  }
  if (mode === "tetris_clock") {
    return "tetris clock started";
  }
  if (mode === "maze") {
    return "maze mode started";
  }
  if (mode === "snake") {
    return "snake mode started";
  }
  if (mode === "planet_screensaver") {
    return "switched to planet screensaver mode";
  }
  if (mode === "rick_morty_portal") {
    return "switched to rick morty portal mode";
  }
  if (mode === "eyes") {
    return "switched to eyes mode";
  }
  return "";
}

class WebSocket {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.host = "";
    this.port = 80;
    this.connectionState = "idle";

    this.onMessageCallbacks = [];
    this.onConnectCallback = null;
    this.onDisconnectCallback = null;
    this.onErrorCallback = null;

    this._socketIdSeed = 0;
    this._currentSocketId = 0;
    this._connectPromise = null;
    this._connectKey = "";
    this._closeMetaBySocketId = new Map();
    this._messageWaiters = new Set();
    this._jsonCommandQueue = Promise.resolve();
    this._transactionIdSeed = 0;
    this._debugGlobalSocketHooksBound = false;
    this._reconnectTimer = null;
    this._reconnectAttemptCount = 0;
  }

  _debugTimestamp() {
    return new Date().toISOString();
  }

  _debugLog(socketId, label, detail = null) {
    if (typeof window === 'undefined' || !window.__glx_ws_debug__) {
      return;
    }
    try {
      console.log('[ws]', `#${socketId}`, label, detail || '');
    } catch (e) {
      /* ignore */
    }
  }

  _summarizeSocketEventPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return payload;
    }

    const summary = {};
    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (typeof value === "string") {
        summary[key] =
          value.length > 160 ? `${value.slice(0, 160)}...` : value;
        if (key === "data") {
          summary.dataLength = value.length;
        }
        return;
      }
      summary[key] = value;
    });
    return summary;
  }

  _ensureGlobalSocketDebugHooks() {
    if (!WS_DEBUG_VERBOSE || this._debugGlobalSocketHooksBound) {
      return;
    }

    this._debugGlobalSocketHooksBound = true;

    this._debugLog(this._currentSocketId, "global socket debug hooks unavailable in browser");
  }

  normalizeHostInput(host) {
    if (typeof host !== "string") {
      return "";
    }

    let normalized = host.trim();
    normalized = normalized.replace(/^wss?:\/\//i, "");
    normalized = normalized.replace(/^https?:\/\//i, "");
    normalized = normalized.replace(/\/+$/, "");

    const slashIndex = normalized.indexOf("/");
    if (slashIndex >= 0) {
      normalized = normalized.slice(0, slashIndex);
    }

    return normalized;
  }

  _emitError(err) {
    if (this.onErrorCallback) {
      this.onErrorCallback(err);
    }
  }

  probeRuntimeStatus(
    host,
    port = 80,
    timeout = HTTP_RUNTIME_PRECHECK_TIMEOUT_MS,
  ) {
    const normalizedHost = this.normalizeHostInput(host);
    if (!normalizedHost) {
      return Promise.reject(new Error("璁惧 IP 鍦板潃鏃犳晥"));
    }

    const url = `http://${normalizedHost}:${port}/status?ts=${Date.now()}`;
    return new Promise((resolve, reject) => {
      httpRequest({
        url,
        method: "GET",
        timeout,
        success: (res) => {
          if (
            typeof res.statusCode !== "number" ||
            res.statusCode < 200 ||
            res.statusCode >= 300
          ) {
            reject(
              new Error(`璁惧杩愯鎬?HTTP 涓嶅彲鐢紙${res.statusCode || "unknown"}锛塦),
            );
            return;
          }

          let data = res.data;
          if (typeof data === "string") {
            try {
              data = JSON.parse(data);
            } catch (err) {
              reject(new Error("璁惧杩愯鎬佺姸鎬佸搷搴斾笉鏄湁鏁?JSON"));
              return;
            }
          }

          if (!isRuntimeStatusPayload(data)) {
            reject(new Error("璁惧杩愯鎬佺姸鎬佸搷搴旀棤鏁?)")";"
            return;
          }

          resolve(data);
        },
        fail: (err) => {
          const errMsg =
            err && typeof err.errMsg === "string" ? err.errMsg : "";
          if (errMsg.includes("timeout")) {
            reject(new Error("璁惧杩愯鎬?HTTP 棰勬瓒呮椂"));
            return;
          }
          reject(new Error("璁惧杩愯鎬佷笉鍙揪锛岃纭璁惧宸茶仈缃戝苟杩涘叆杩愯鎬?)")";"
        },
      });
    });
  }

  _clearReconnectTimer() {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
  }

  _scheduleReconnect(reason = null) {
    if (!this.host || !this.port) {
      return;
    }
    if (this.connected || this.connectionState === "connecting" || this._connectPromise) {
      return;
    }
    if (this._reconnectAttemptCount >= AUTO_RECONNECT_MAX_ATTEMPTS) {
      this._debugLog(this._currentSocketId, "skip reconnect: limit reached", {
        attempts: this._reconnectAttemptCount,
        reason,
      });
      return;
    }

    this._clearReconnectTimer();
    const socketId = this._currentSocketId;
    this._reconnectAttemptCount += 1;
    this._debugLog(socketId, "schedule reconnect", reason);
    this._reconnectTimer = setTimeout(() => {
      this._reconnectTimer = null;
      if (!this.host || !this.port) {
        return;
      }
      if (this.connected || this.connectionState === "connecting" || this._connectPromise) {
        return;
      }

      this.connect(this.host, this.port, { autoReconnect: true }).catch((err) => {
        this._debugLog(this._currentSocketId, "reconnect attempt failed", {
          message: err && err.message ? err.message : err,
        });
      });
    }, AUTO_RECONNECT_DELAY_MS);
  }

  _registerCloseMeta(socketId, meta) {
    this._closeMetaBySocketId.set(socketId, meta);
  }

  _consumeCloseMeta(socketId) {
    const meta = this._closeMetaBySocketId.get(socketId) || null;
    if (meta) {
      this._closeMetaBySocketId.delete(socketId);
    }
    return meta;
  }

  _closeSocketTask(socketTask, socketId, meta) {
    if (!socketTask) {
      return;
    }

    this._debugLog(socketId, "closeSocketTask", meta || {});
    this._registerCloseMeta(socketId, meta);
    socketTask.close({
      success: () => {},
      fail: (err) => {
        this._debugLog(
          socketId,
          "closeSocketTask fail",
          this._summarizeSocketEventPayload(err),
        );
      },
    });
  }

  _setDisconnectedState(nextState = "idle") {
    this.connected = false;
    this.connectionState = nextState;
  }

  _addMessageWaiter(waiter) {
    this._messageWaiters.add(waiter);
  }

  _removeMessageWaiter(waiter) {
    this._messageWaiters.delete(waiter);
  }

  _rejectMessageWaitersForSocket(socketId, err) {
    Array.from(this._messageWaiters).forEach((waiter) => {
      if (!waiter || waiter.socketId !== socketId) {
        return;
      }
      this._removeMessageWaiter(waiter);
      waiter.reject(err);
    });
  }

  _enqueueJsonCommand(task) {
    const queuedTask = this._jsonCommandQueue
      .catch(() => {})
      .then(() => {
        if (!this.connected || !this.socket) {
          throw new Error("鏈繛鎺ュ埌璁惧");
        }
        return task();
      });

    this._jsonCommandQueue = queuedTask.catch(() => {});
    return queuedTask;
  }

  _createTransactionId() {
    this._transactionIdSeed += 1;
    return `tx-${Date.now()}-${this._transactionIdSeed}`;
  }

  _createMessageWaiter(matcher, timeout) {
    if (!this.connected || !this.socket) {
      return {
        promise: Promise.reject(new Error("鏈繛鎺ュ埌璁惧")),
        reject: () => {},
      };
    }

    let finishReject = null;
    const promise = new Promise((resolve, reject) => {
      let done = false;
      let timer = null;

      const finishResolve = (message) => {
        if (done) {
          return;
        }
        done = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        this.offMessage(handler);
        this._removeMessageWaiter(waiter);
        resolve(message);
      };

      finishReject = (err) => {
        if (done) {
          return;
        }
        done = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        this.offMessage(handler);
        this._removeMessageWaiter(waiter);
        reject(err);
      };

      const handler = (message) => {
        if (!matcher(message)) {
          return;
        }
        if (message && (message.error || message.status === "error")) {
          finishReject(
            new Error(message.error || message.message || "璁惧杩斿洖閿欒"),
          );
          return;
        }
        finishResolve(message);
      };

      this.onMessage(handler);
      const waiter = {
        socketId: this._currentSocketId,
        reject: (err) => finishReject(err),
      };
      this._addMessageWaiter(waiter);

      timer = setTimeout(() => {
        finishReject(new Error("绛夊緟鍥炲瓒呮椂"));
      }, timeout);
    });

    return {
      promise,
      reject: (err) => {
        if (finishReject) {
          finishReject(err);
        }
      },
    };
  }

  _createTransactionWaiter(txId, matcher, timeout) {
    return this._createMessageWaiter(
      (message) =>
        !!(
          message &&
          message.txId === txId &&
          matcher(message)
        ),
      timeout,
    );
  }

  async _sendBinaryChunks(mode, payload) {
    const bytes = new Uint8Array(payload);
    const profile = resolveTransactionBinaryChunkProfile(mode, bytes.byteLength);
    for (
      let offset = 0;
      offset < bytes.byteLength;
      offset += profile.chunkSize
    ) {
      const end = Math.min(offset + profile.chunkSize, bytes.byteLength);
      await this.sendBinary(bytes.slice(offset, end));
      if (end < bytes.byteLength) {
        await new Promise((resolve) => setTimeout(resolve, profile.delayMs));
      }
    }
  }

  async _sendTransactionAbort(txId) {
    if (!this.connected || !this.socket) {
      return;
    }

    try {
      await this.send({
        cmd: "tx_abort",
        txId,
      });
    } catch (err) {
      console.warn("浜嬪姟涓鎸囦护鍙戦€佸け璐?", err);
    }
  }

  async runModeTransaction(options = {}) {
    if (!options || typeof options !== "object") {
      throw new Error("浜嬪姟鍙傛暟鏃犳晥");
    }

    const { mode } = options;
    if (typeof mode !== "string" || mode.length === 0) {
      throw new Error("浜嬪姟妯″紡鏃犳晥");
    }

    const hasParams = Object.prototype.hasOwnProperty.call(options, "params");
    let params = {};
    if (hasParams) {
      if (
        !options.params ||
        typeof options.params !== "object" ||
        Array.isArray(options.params)
      ) {
        throw new Error("浜嬪姟鍙傛暟瀵硅薄鏃犳晥");
      }
      params = options.params;
    }
    const binaryPayload =
      typeof options.binary === "undefined" || options.binary === null
        ? null
        : normalizeBinaryPayload(options.binary);
    const txId = this._createTransactionId();
    const acceptedTimeout =
      Number.isInteger(options.acceptedTimeout) && options.acceptedTimeout > 0
        ? options.acceptedTimeout
        : TRANSACTION_ACCEPTED_TIMEOUT_MS;
    const finalTimeout =
      Number.isInteger(options.finalTimeout) && options.finalTimeout > 0
        ? options.finalTimeout
        : TRANSACTION_FINAL_TIMEOUT_MS;

    return this._enqueueJsonCommand(async () => {
      let accepted = false;
      const acceptedWaiter = this._createTransactionWaiter(
        txId,
        (message) =>
          isTransactionAcceptedResponse(message) ||
          isTransactionFinalErrorResponse(message),
        acceptedTimeout,
      );
      const finalWaiter = this._createTransactionWaiter(
        txId,
        (message) => isTransactionFinalResponse(message),
        finalTimeout,
      );

      try {
        await this.send({
          cmd: "tx_begin",
          txId,
          mode,
          params,
          hasBinary: binaryPayload !== null,
          binarySize: binaryPayload ? binaryPayload.byteLength : 0,
        });

        const acceptedResponse = await acceptedWaiter.promise;
        if (!isTransactionAcceptedResponse(acceptedResponse)) {
          throw buildTransactionError(acceptedResponse, "浜嬪姟鏈璁惧鎺ュ彈");
        }

        accepted = true;
        if (binaryPayload) {
          await this._sendBinaryChunks(mode, binaryPayload);
        }

        await this.send({
          cmd: "tx_commit",
          txId,
        });

        const finalResponse = await finalWaiter.promise;
        if (!finalResponse || typeof finalResponse !== "object") {
          throw new Error("璁惧浜嬪姟鍝嶅簲鏃犳晥");
        }

        if (finalResponse.status === TRANSACTION_FINAL_ERROR_STATUS) {
          throw buildTransactionError(finalResponse, "璁惧浜嬪姟鎵ц澶辫触");
        }

        return finalResponse;
      } catch (err) {
        acceptedWaiter.reject(err);
        finalWaiter.reject(err);
        if (
          accepted &&
          !err.transactionFinalReceived &&
          shouldAbortUnfinishedTransaction(mode, binaryPayload)
        ) {
          await this._sendTransactionAbort(txId);
        }
        throw err;
      }
    });
  }

  /**
   * 杩炴帴鍒?ESP32
   * @param {string} host - IP 鍦板潃
   * @param {number} port - 绔彛鍙凤紝榛樿 80
   */
  connect(host, port = 80, options = {}) {
    this._ensureGlobalSocketDebugHooks();
    this._clearReconnectTimer();
    if (!options.autoReconnect) {
      this._reconnectAttemptCount = 0;
    }
    const connectTimeoutMs =
      Number.isInteger(options.connectTimeoutMs) && options.connectTimeoutMs > 0
        ? options.connectTimeoutMs
        : CONNECT_TIMEOUT_MS;
    const normalizedHost = this.normalizeHostInput(host);
    if (!normalizedHost) {
      const err = new Error("璁惧 IP 鍦板潃鏃犳晥");
      this._emitError(err);
      return Promise.reject(err);
    }

    const connectKey = `${normalizedHost}:${port}`;
    if (
      this.connected &&
      this.connectionState === "open" &&
      this.host === normalizedHost &&
      this.port === port
    ) {
      return Promise.resolve();
    }

    if (
      this.connectionState === "connecting" &&
      this._connectPromise &&
      this._connectKey === connectKey
    ) {
      return this._connectPromise;
    }

    const previousSocket = this.socket;
    const previousSocketId = this._currentSocketId;
    if (previousSocket) {
      this._debugLog(previousSocketId, "closing previous socket before connect");
      this._closeSocketTask(previousSocket, previousSocketId, {
        suppressReconnect: true,
      });
    }

    this.host = normalizedHost;
    this.port = port;
    this._connectKey = connectKey;
    this._setDisconnectedState("connecting");

    const socketId = ++this._socketIdSeed;
    this._currentSocketId = socketId;

    this._connectPromise = new Promise((resolve, reject) => {
      let settled = false;
      let connectTimeoutTimer = null;
      let closingAfterConnectTimeout = false;
      let hasOpened = false;

      const finishResolve = () => {
        if (settled) {
          return;
        }
        settled = true;
        if (connectTimeoutTimer) {
          clearTimeout(connectTimeoutTimer);
          connectTimeoutTimer = null;
        }
        resolve();
      };

      const finishReject = (err) => {
        if (settled) {
          return;
        }
        settled = true;
        if (connectTimeoutTimer) {
          clearTimeout(connectTimeoutTimer);
          connectTimeoutTimer = null;
        }
        reject(err);
      };

      const hostWithPort = normalizedHost.includes(":")
        ? normalizedHost
        : `${normalizedHost}:${port}`;
      const url = `ws://${hostWithPort}/ws`;
      console.log('[ws] connect 鈫?, url);
      this._debugLog(socketId, "connect start", {
        url,
        host: normalizedHost,
        port,
        connectKey,
        previousSocketId,
        hasPreviousSocket: !!previousSocket,
      });

      if (WS_DEBUG_VERBOSE) {
        try {
          if (typeof getSystemInfo === "function") {
            const systemInfo = getSystemInfo();
            this._debugLog(socketId, "system info", {
              platform: systemInfo.platform,
              hostSDKVersion: systemInfo.hostSDKVersion,
              SDKVersion: systemInfo.SDKVersion,
              brand: systemInfo.brand,
              model: systemInfo.model,
            });
          }
        } catch (err) {
          this._debugLog(socketId, "getSystemInfoSync failed", err);
        }

        if (typeof getNetworkType === "function") {
          getNetworkType({
            success: (res) => {
              this._debugLog(
                socketId,
                "network type",
                this._summarizeSocketEventPayload(res),
              );
            },
            fail: (err) => {
              this._debugLog(
                socketId,
                "getNetworkType fail",
                this._summarizeSocketEventPayload(err),
              );
            },
          });
        }
      }

      const socketTask = connectSocket({
        url,
        success: () => {
          this._debugLog(socketId, "connectSocket success callback");
        },
        fail: (err) => {
          if (socketId !== this._currentSocketId) {
            return;
          }
          this._debugLog(
            socketId,
            "connectSocket fail callback",
            this._summarizeSocketEventPayload(err),
          );
          console.error("WebSocket 鍒涘缓澶辫触:", err);
          this._setDisconnectedState("idle");
          this._emitError(err);
          finishReject(err);
        },
      });

      this.socket = socketTask;
      this._debugLog(socketId, "socketTask assigned");

      connectTimeoutTimer = setTimeout(() => {
        if (socketId !== this._currentSocketId) {
          return;
        }
        this._debugLog(socketId, "connect timeout fired", {
          currentSocketId: this._currentSocketId,
          hasSocket: this.socket === socketTask,
        });
        const err = new Error("WebSocket 杩炴帴瓒呮椂");
        console.error(err.message);
        this._setDisconnectedState("idle");
        this._emitError(err);
        closingAfterConnectTimeout = true;
        finishReject(err);
        this._closeSocketTask(socketTask, socketId, {
          timeout: true,
        });
      }, connectTimeoutMs);

      socketTask.onOpen(() => {
        if (socketId !== this._currentSocketId) {
          return;
        }
        console.log('[ws] open');
        this._debugLog(socketId, "task onOpen");
        hasOpened = true;
        this.connected = true;
        this.connectionState = "open";
        this._reconnectAttemptCount = 0;
        if (this.onConnectCallback) {
          this.onConnectCallback();
        }
        finishResolve();
      });

      socketTask.onMessage((res) => {
        if (socketId !== this._currentSocketId) {
          return;
        }
        this._debugLog(
          socketId,
          "task onMessage",
          this._summarizeSocketEventPayload(res),
        );
        try {
          const data = JSON.parse(res.data);
          const callbacks = this.onMessageCallbacks.slice();
          callbacks.forEach((callback) => {
            if (callback) {
              callback(data);
            }
          });
        } catch (err) {
          console.error("JSON 瑙ｆ瀽澶辫触:", err);
        }
      });

      socketTask.onClose((event) => {
        const closeMeta = this._consumeCloseMeta(socketId);
        if (socketId !== this._currentSocketId) {
          return;
        }
        console.log('[ws] close', { code: event?.code, reason: event?.reason, hasOpened });
        this._debugLog(
          socketId,
          "task onClose",
          this._summarizeSocketEventPayload(event),
        );

        const closeCode =
          event && typeof event.code !== "undefined" ? event.code : "unknown";
        const closeReason =
          event && typeof event.reason === "string" ? event.reason : "";
        if (this.socket === socketTask) {
          this.socket = null;
        }
        this._rejectMessageWaitersForSocket(
          socketId,
          new Error("WebSocket 杩炴帴宸插叧闂?),"
        );
        this._setDisconnectedState("idle");

        if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
        }

        if (!settled) {
          finishReject(
            new Error(closingAfterConnectTimeout ? "WebSocket 杩炴帴瓒呮椂" : "WebSocket 杩炴帴宸插叧闂?),"
          );
          return;
        }

        if (hasOpened && (!closeMeta || !closeMeta.suppressReconnect)) {
          this._scheduleReconnect({
            stage: "connected",
            code: closeCode,
            reason: closeReason,
          });
        }
      });

      socketTask.onError((err) => {
        if (socketId !== this._currentSocketId) {
          return;
        }
        console.error('[ws] error', err);
        this._debugLog(
          socketId,
          "task onError",
          this._summarizeSocketEventPayload(err),
        );
        if (closingAfterConnectTimeout) {
          this._debugLog(socketId, "ignore task onError after connect timeout");
          return;
        }
        console.error("WebSocket 閿欒:", err);
        const socketError =
          err instanceof Error
            ? err
            : new Error(
                err && typeof err.errMsg === "string"
                  ? err.errMsg
                  : "WebSocket 閿欒",
              );
        this._rejectMessageWaitersForSocket(socketId, socketError);
        this._emitError(socketError);
      });
    });

    return this._connectPromise.finally(() => {
      if (this._connectPromise && this._connectKey === connectKey) {
        this._connectPromise = null;
      }
    });
  }

  /**
   * 鍙戦€佸懡浠?
   * @param {object} data - 鍛戒护鏁版嵁
   */
  send(data) {
    if (!this.connected || !this.socket) {
      const err = new Error("鏈繛鎺ュ埌璁惧");
      console.error(err.message);
      return Promise.reject(err);
    }

    return new Promise((resolve, reject) => {
      this.socket.send({
        data: JSON.stringify(data),
        success: () => {
          resolve();
        },
        fail: (err) => {
          console.error("鍙戦€佸け璐?", err);
          reject(err);
        },
      });
    });
  }

  sendBinary(data) {
    if (!this.connected || !this.socket) {
      const err = new Error("鏈繛鎺ュ埌璁惧");
      console.error(err.message);
      return Promise.reject(err);
    }

    let payload = null;
    if (data instanceof ArrayBuffer) {
      payload = data;
    } else if (ArrayBuffer.isView(data)) {
      payload = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }

    if (!payload) {
      return Promise.reject(new Error("浜岃繘鍒舵暟鎹棤鏁?)")";"
    }

    return new Promise((resolve, reject) => {
      this.socket.send({
        data: payload,
        success: resolve,
        fail: (err) => {
          console.error("浜岃繘鍒跺彂閫佸け璐?", err);
          reject(err);
        },
      });
    });
  }

  /**
   * 鏂紑杩炴帴
   */
  disconnect() {
    this._clearReconnectTimer();
    if (!this.socket) {
      this._setDisconnectedState("idle");
      return;
    }

    const socketTask = this.socket;
    const socketId = this._currentSocketId;
    this._setDisconnectedState("closing");
    this._closeSocketTask(socketTask, socketId, {
      suppressReconnect: true,
      logClose: "WebSocket 宸插叧闂?,"
    });
  }

  onMessage(callback) {
    if (!this.onMessageCallbacks.includes(callback)) {
      this.onMessageCallbacks.push(callback);
    }
  }

  offMessage(callback) {
    const index = this.onMessageCallbacks.indexOf(callback);
    if (index >= 0) {
      this.onMessageCallbacks.splice(index, 1);
    }
  }

  onConnect(callback) {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback) {
    this.onDisconnectCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  async ping() {
    return this.send({ cmd: "ping" });
  }

  // ========== HTTP 杩愯鏃舵帴鍙?(璺?PC deviceLegacy 鍗忚瀵归綈) ==========
  // /clear-wifi GET, /get GET, /set POST x-www-form-urlencoded
  // 杩欎簺鏄洿鎺ユ墦璁惧 HTTP 绔偣鑰屼笉鏄?ws, 鐢ㄤ簬璁惧鍙傛暟璇诲啓 + 娓呯┖ WiFi 閰嶇疆.
  async requestRuntimeJson(pathname, init = {}) {
    const normalizedHost = this.normalizeHostInput(this.host);
    if (normalizedHost.length === 0) {
      throw new Error("璁惧 IP 鍦板潃鏃犳晥");
    }
    const protocol = this.secure === true ? "https" : "http";
    const url = `${protocol}://${normalizedHost}:${this.port}${pathname}`;
    const response = await fetch(url, init);
    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); }
    catch (error) { throw new Error("璁惧杩斿洖鐨勪笉鏄湁鏁?JSON"); }
    if (!response.ok) {
      if (data && typeof data.error === "string" && data.error.length > 0) {
        throw new Error(data.error);
      }
      throw new Error("璁惧璇锋眰澶辫触");
    }
    if (data && typeof data.error === "string" && data.error.length > 0) {
      throw new Error(data.error);
    }
    return data;
  }

  async clearWifiConfig() {
    return this.requestRuntimeJson("/clear-wifi", { method: "GET" });
  }

  async getDeviceParams() {
    return this.requestRuntimeJson("/get", { method: "GET" });
  }

  async setDeviceParam(key, value) {
    const body = new URLSearchParams();
    body.set(key, String(value));
    return this.requestRuntimeJson("/set", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: body.toString(),
    });
  }

  waitForMessage(matcher, timeout = COMMAND_TIMEOUT_MS) {
    return this._createMessageWaiter(matcher, timeout).promise;
  }

  sendAndWait(data, timeout = COMMAND_TIMEOUT_MS, matcher = null, options = {}) {
    const requiresAccepted = options.requiresAccepted === true;
    const waitForFinal = options.waitForFinal !== false;
    const acceptedTimeout =
      Number.isInteger(options.acceptedTimeout) && options.acceptedTimeout > 0
        ? options.acceptedTimeout
        : timeout;
    const finalTimeout =
      Number.isInteger(options.finalTimeout) && options.finalTimeout > 0
        ? options.finalTimeout
        : timeout;
    const baseFinalMatcher =
      typeof matcher === "function"
        ? matcher
        : (message) => {
            if (!message || typeof message !== "object") {
              return false;
            }
            return (
              message.status === "ok" ||
              message.status === "success" ||
              message.status === "error"
            );
          };
    const finalMatcher = (message) => {
      if (requiresAccepted && isAcceptedResponse(message)) {
        return false;
      }
      return baseFinalMatcher(message);
    };

    return this._enqueueJsonCommand(async () => {
      const acceptedWaiter = requiresAccepted
        ? this._createMessageWaiter(
            (message) => isAcceptedResponse(message) || isErrorResponse(message),
            acceptedTimeout,
          )
        : null;
      const finalWaiter = waitForFinal
        ? this._createMessageWaiter(finalMatcher, finalTimeout)
        : null;
      try {
        await this.send(data);
        if (acceptedWaiter) {
          await acceptedWaiter.promise;
        }
        if (finalWaiter) {
          return await finalWaiter.promise;
        }
        return {
          status: "ok",
          message: ACCEPTED_MESSAGE,
        };
      } catch (err) {
        if (acceptedWaiter) {
          acceptedWaiter.reject(err);
        }
        if (finalWaiter) {
          finalWaiter.reject(err);
        }
        throw err;
      }
    });
  }

  async getStatus(timeout = COMMAND_TIMEOUT_MS) {
    return this.sendAndWait(
      { cmd: "status" },
      timeout,
      (response) => {
        if (!response || typeof response !== "object") {
          return false;
        }
        if (response.error || response.status === "error") {
          return true;
        }
        return (
          response.status === "ok" &&
          typeof response.ip === "string" &&
          typeof response.width === "number" &&
          typeof response.height === "number" &&
          typeof response.brightness === "number" &&
          typeof response.mode === "string" &&
          typeof response.businessMode === "string" &&
          typeof response.effectMode === "string"
        );
      },
    );
  }

  async getInfo() {
    return this.sendAndWait(
      { cmd: "get_info" },
      8000,
      (response) => {
        if (!response || typeof response !== "object") {
          return false;
        }
        if (isErrorResponse(response)) {
          return true;
        }
        return (
          response.status === "ok" &&
          typeof response.firmware_version === "string" &&
          typeof response.ip === "string"
        );
      },
    );
  }

  waitForCommand(data, expectedMessages, timeout = COMMAND_TIMEOUT_MS) {
    return this.sendAndWait(
      data,
      timeout,
      buildMessageMatcher(expectedMessages),
    );
  }

  waitForAcceptedCommand(data, timeout = COMMAND_TIMEOUT_MS) {
    return this.sendAndWait(data, timeout, null, {
      requiresAccepted: true,
      waitForFinal: false,
    });
  }

  // 鏂板寮傛妯″紡/鏁堟灉鍛戒护鏃讹紝浼樺厛璧?accepted + 鏈€缁堢粨鏋滀袱闃舵銆?
  waitForCommandWithAccepted(
    data,
    expectedMessages,
    timeout = COMMAND_TIMEOUT_MS,
    finalTimeout = COMMAND_FINAL_TIMEOUT_MS,
  ) {
    return this.sendAndWait(data, timeout, buildMessageMatcher(expectedMessages), {
      requiresAccepted: true,
      waitForFinal: true,
      finalTimeout,
    });
  }

  async setMode(mode, options = {}) {
    const expectedMessage = getSetModeSuccessMessage(mode);
    if (!expectedMessage) {
      throw new Error(`鏈敮鎸佺殑妯″紡鍒囨崲纭锛?{mode}`);
    }
    if (options.waitForFinal === false) {
      return this.waitForAcceptedCommand({ cmd: "set_mode", mode }, 8000);
    }
    return this.waitForCommandWithAccepted(
      { cmd: "set_mode", mode },
      expectedMessage,
      8000,
      COMMAND_FINAL_TIMEOUT_MS,
    );
  }

  async setClockConfig(clockMode, config) {
    return this.waitForCommand(
      { cmd: "set_clock_config", clockMode, config },
      "clock config updated",
      8000,
    );
  }

  async applyClockMode(mode, config, binary = null, options = {}) {
    if (mode !== "clock" && mode !== "animation") {
      throw new Error(`鏈敮鎸佺殑鏃堕挓浜嬪姟妯″紡锛?{mode}`);
    }

    return this.runModeTransaction({
      mode,
      params: { config },
      binary,
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async applyThemeMode(themeId, options = {}) {
    return this.setThemeConfig(themeId, options);
  }

  async ensureCanvasMode(options = {}) {
    return this.runModeTransaction({
      mode: "canvas",
      params: {},
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async setThemeConfig(themeId, options = {}) {
    return this.runModeTransaction({
      mode: "theme",
      params: {
        themeId,
      },
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async setEyesConfig(config) {
    return this.runModeTransaction({
      mode: "eyes",
      params: { config },
    });
  }

  async setAmbientEffect(config, options = {}) {
    const isWaterWorldPreset =
      config.preset === "surface" ||
      config.preset === "current" ||
      config.preset === "caustics";
    const params =
      config.preset === "rain_scene"
        ? {
            preset: config.preset,
            speed: config.speed,
            density: config.density,
            color: hexToRgb(config.color),
            loop: config.loop,
          }
        : isWaterWorldPreset
          ? {
              preset: config.preset,
              speed: config.speed,
              loop: config.loop,
            }
        : {
            preset: config.preset,
            speed: config.speed,
            intensity: config.intensity,
            loop: config.loop,
          };

    // 姘翠笘鐣屽彲閫夐€忎紶 colorTheme 瀛楁锛堟澘杞界敤 4 涓昏壊娲剧敓 palette / 褰╄櫣娴佽浆锛?
    if (isWaterWorldPreset && config.colorTheme) {
      params.colorTheme = config.colorTheme;
    }

    if (options.clockConfig) {
      params.config = options.clockConfig;
    }

    return this.runModeTransaction({
      mode: "led_matrix_showcase",
      params,
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async startMaze(config, options = {}) {
    return this.runModeTransaction({
      mode: "maze",
      params: {
        speed: config.speed,
        mazeSizeMode: config.mazeSizeMode,
        showClock: config.showClock,
        panelBgColor: normalizeHexColor(config.panelBgColor),
        borderColor: normalizeHexColor(config.borderColor),
        timeColor: normalizeHexColor(config.timeColor),
        dateColor: normalizeHexColor(config.dateColor),
        generationPathColor: normalizeHexColor(config.generationPathColor),
        searchVisitedColor: normalizeHexColor(config.searchVisitedColor),
        searchFrontierColor: normalizeHexColor(config.searchFrontierColor),
        solvedPathStartColor: normalizeHexColor(config.solvedPathStartColor),
        solvedPathEndColor: normalizeHexColor(config.solvedPathEndColor),
      },
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async startSnake(config, options = {}) {
    return this.runModeTransaction({
      mode: "snake",
      params: {
        speed: config.speed,
        snakeWidth: config.snakeWidth,
        snakeColor: hexToRgb(config.snakeColor),
        foodColor: hexToRgb(config.foodColor),
        font: config.font,
        showSeconds: config.showSeconds,
        snakeSkin: config.snakeSkin,
      },
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async startTetris(config, options = {}) {
    const params = {
      clearMode: config.clearMode,
      cellSize: config.cellSize,
      speed: config.speed,
      showClock: config.showClock,
      pieces: config.pieces,
    };
    if (
      Object.prototype.hasOwnProperty.call(config, "config") &&
      config.config &&
      typeof config.config === "object" &&
      !Array.isArray(config.config)
    ) {
      params.config = config.config;
    }

    return this.runModeTransaction({
      mode: "tetris",
      params,
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async startTetrisClock(config, options = {}) {
    return this.runModeTransaction({
      mode: "tetris_clock",
      params: {
        cellSize: 2,
        speed: config.speed,
        hourFormat: config.hourFormat,
      },
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async startTerrariaClock(config, options = {}) {
    const params = {
      character: config.character,
      weaponId: config.weaponId,
      playerX: config.playerX,
      playerY: config.playerY,
      playerScale: config.playerScale,
      guardianX: config.guardianX,
      guardianY: config.guardianY,
      guardianScale: config.guardianScale,
      wingId: config.wingId,
      wingSpeed: config.wingSpeed,
      biome: config.biome,
      bossEnabled: config.bossEnabled,
      bossId: config.bossId,
      bossX: config.bossX,
      bossY: config.bossY,
      bossScale: config.bossScale,
      fontId: config.fontId,
      fontScale: config.fontScale,
      clockX: config.clockX,
      clockY: config.clockY,
      hourFormat: config.hourFormat,
      showSeconds: config.showSeconds,
      clockTextColor: normalizeHexColor(config.clockTextColor),
      clockBgInner: normalizeHexColor(config.clockBgInner),
      clockBgOuter: normalizeHexColor(config.clockBgOuter),
    };
    // 鍙€夊瓧娈碉細鏉胯浇渚?containsKey 鍒ゆ柇锛堝悜鍚庡吋瀹癸級
    if (config.maskId !== undefined) params.maskId = config.maskId;
    if (config.dragonX !== undefined) params.dragonX = config.dragonX;
    if (config.dragonY !== undefined) params.dragonY = config.dragonY;
    if (config.dragonAngle !== undefined) params.dragonAngle = config.dragonAngle;
    if (config.bladeX !== undefined) params.bladeX = config.bladeX;
    if (config.bladeY !== undefined) params.bladeY = config.bladeY;
    if (config.bladeAngle !== undefined) params.bladeAngle = config.bladeAngle;
    // 鑷姩杞挱閰嶇疆锛堝彲閫夛紝寮€鍚椂鎵嶄紶锛?
    if (config.autoRotate) {
      params.autoRotate = config.autoRotate;
    }
    return this.runModeTransaction({
      mode: "terraria_clock",
      params,
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async startAdventureIsland(options = {}) {
    // 鍐掗櫓宀涗富棰? 娌℃湁鍙皟鍙傛暟, 鏉胯浇鐢ㄧ紪璇戞湡甯搁噺鑷姩寰幆娓叉煋
    return this.runModeTransaction({
      mode: "adventure_island",
      params: {},
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async startKof97(options = {}) {
    // KOF '97 涓婚: 娌℃湁鍙皟鍙傛暟, 鏉胯浇鐢ㄧ紪璇戞湡甯搁噺鑷姩寰幆娓叉煋
    return this.runModeTransaction({
      mode: "kof97",
      params: {},
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async setPlanetScreensaver(config, options = {}) {
    return this.runModeTransaction({
      mode: "planet_screensaver",
      params: {
        preset: config.preset,
        size: config.size,
        direction: config.direction,
        speed: config.speed,
        seed: config.seed,
        colorSeed: config.colorSeed,
        planetX: config.planetX,
        planetY: config.planetY,
        font: config.font,
        showSeconds: config.showSeconds,
        time: config.time,
        autoRotate: config.autoRotate,
      },
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async setRickMortyPortal(config, options = {}) {
    return this.runModeTransaction({
      mode: "rick_morty_portal",
      params: {
        preset: config.preset,
        size: config.size,
        portalX: config.portalX,
        portalY: config.portalY,
        autoRotate: config.autoRotate,
        font: config.font,
        showSeconds: config.showSeconds,
        time: config.time,
      },
      acceptedTimeout: options.acceptedTimeout,
      finalTimeout: options.finalTimeout,
    });
  }

  async setGifAnimation(animationData) {
    if (animationData == null) {
      return this.waitForCommand(
        {
          cmd: "set_gif_animation",
          animationData,
        },
        "animation cleared",
        10000,
      );
    }

    const binaryPayload = buildCompactAnimationBinaryBuffer(animationData);
    return this.runModeTransaction({
      mode: "gif_player",
      params: {},
      binary: binaryPayload,
      finalTimeout: TRANSACTION_FINAL_TIMEOUT_MS,
    });
  }

  async eyesInteract(action) {
    return this.waitForCommandWithAccepted(
      { cmd: "eyes_interact", action },
      "eyes action applied",
      8000,
      COMMAND_FINAL_TIMEOUT_MS,
    );
  }

  async startLoading() {
    return this.waitForCommand(
      { cmd: "start_loading" },
      "loading started",
      8000,
    );
  }

  async stopLoading() {
    return this.waitForCommand(
      { cmd: "stop_loading" },
      "loading stopped",
      8000,
    );
  }

  async highlightRow(row) {
    const expectedMessage = row >= 0 ? "row highlighted" : "highlight cleared";
    return this.waitForCommandWithAccepted(
      { cmd: "highlight_row", row },
      expectedMessage,
      8000,
      8000,
    );
  }

  async highlightColor(color) {
    if (color === null) {
      return this.waitForCommandWithAccepted(
        { cmd: "highlight_color", color: null },
        "highlight cleared",
        8000,
        8000,
      );
    }

    return this.waitForCommandWithAccepted(
      {
        cmd: "highlight_color",
        color: normalizeRgbColor(color),
      },
      "color highlighted",
      8000,
      8000,
    );
  }

  async otaCheck() {
    return this.sendAndWait(
      { cmd: "ota_check" },
      8000,
      (response) => {
        if (!response || typeof response !== "object") {
          return false;
        }
        if (isErrorResponse(response)) {
          return true;
        }
        return (
          response.status === "ok" &&
          typeof response.firmware_version === "string" &&
          typeof response.has_update === "boolean"
        );
      },
    );
  }

  async otaUpdate() {
    return this.waitForCommand(
      { cmd: "ota_update" },
      "starting update",
      8000,
    );
  }

  async clear() {
    return this.send({ cmd: "clear" });
  }

  async setBrightness(value) {
    return this.send({ cmd: "brightness", value });
  }

  async showImage(pixels, width, height) {
    const sparseData = [];
    let idx = 0;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const r = pixels[idx++];
        const g = pixels[idx++];
        const b = pixels[idx++];
        sparseData.push(x, y, r, g, b);
      }
    }

    return this.runModeTransaction({
      mode: "canvas",
      params: {},
      binary:
        sparseData.length > 0
          ? buildPixelBinaryBufferFromPackedPixels(sparseData, width, height)
          : new ArrayBuffer(0),
      finalTimeout: TRANSACTION_FINAL_TIMEOUT_MS,
    });
  }

  async showSparseImage(sparsePixels, width = 64, height = 64) {
    return this.runModeTransaction({
      mode: "canvas",
      params: {},
      binary:
        sparsePixels.length > 0
          ? buildPixelBinaryBufferFromPackedPixels(sparsePixels, width, height)
          : new ArrayBuffer(0),
      finalTimeout: TRANSACTION_FINAL_TIMEOUT_MS,
    });
  }

  buildPixelBinaryFromObjects(pixels) {
    return buildPixelBinaryBufferFromObjects(pixels);
  }

  buildPixelBinaryFromPackedPixels(pixelData, width = 64, height = 64) {
    return buildPixelBinaryBufferFromPackedPixels(pixelData, width, height);
  }

  buildCompactAnimationBinaryBuffer(animationData) {
    return buildCompactAnimationBinaryBuffer(animationData);
  }
}

export default WebSocket;
// 璁?PC 绔殑 deviceLegacy.js 涔熻兘鐢ㄥ悓涓€涓?ws 瀹炵幇 (璺?mobile 鍚屾簮, 涓嶅啀缁存姢鍙屼唤)
export { WebSocket as DeviceWebSocket };
