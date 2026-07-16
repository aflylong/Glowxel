export const BROWSER_USER_DATA_PATH = "browser-user-data";

const fileStore = new Map();
let fileSeq = 0;
let routerRef = null;

export function setRouter(router) {
  routerRef = router;
}

export function setStorage(key, value) {
  const storedValue = typeof value === "string" ? value : JSON.stringify(value);
  localStorage.setItem(key, storedValue);
}

export function getStorage(key) {
  const raw = localStorage.getItem(key);
  if (raw == null) return "";
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function removeStorage(key) {
  localStorage.removeItem(key);
}

export function clearStorage() {
  localStorage.clear();
}

export function getSystemInfo() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  return {
    windowWidth: width,
    windowHeight: height,
    screenWidth: window.screen?.width || width,
    screenHeight: window.screen?.height || height,
    pixelRatio: window.devicePixelRatio || 1,
    statusBarHeight: 0,
    safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
    platform: isAndroid ? "android" : isIOS ? "ios" : "web",
    system: ua,
    model: "web",
    brand: "web",
  };
}

export function base64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    u8[i] = bin.charCodeAt(i);
  }
  return u8.buffer;
}

export function arrayBufferToBase64(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < u8.length; i += 1) {
    bin += String.fromCharCode(u8[i]);
  }
  return btoa(bin);
}

export function httpRequest(opts = {}) {
  if (!opts.url) {
    const err = { errMsg: "request:fail url required" };
    if (opts.fail) opts.fail(err);
    if (opts.complete) opts.complete(err);
    return Promise.reject(err);
  }

  const method = (opts.method || "GET").toUpperCase();
  const headers = { ...(opts.header || {}) };
  let body;

  if (method !== "GET" && method !== "HEAD" && opts.data != null) {
    if (
      typeof opts.data === "string" ||
      opts.data instanceof FormData ||
      opts.data instanceof ArrayBuffer ||
      opts.data instanceof Blob
    ) {
      body = opts.data;
    } else {
      body = JSON.stringify(opts.data);
      if (!headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
      }
    }
  }

  const controller = new AbortController();
  const timeoutMs = opts.timeout || 60000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(opts.url, {
    method,
    headers,
    body,
    signal: controller.signal,
    mode: "cors",
    credentials: "omit",
  })
    .then(async (resp) => {
      clearTimeout(timer);
      const responseHeaders = {};
      resp.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data;
      const dataType = (opts.dataType || "json").toLowerCase();
      if (opts.responseType === "arraybuffer") {
        data = await resp.arrayBuffer();
      } else if (dataType === "json") {
        try {
          data = await resp.json();
        } catch {
          data = await resp.text().catch(() => "");
        }
      } else {
        data = await resp.text();
      }

      const result = {
        data,
        statusCode: resp.status,
        header: responseHeaders,
        errMsg: "request:ok",
      };
      if (opts.success) opts.success(result);
      if (opts.complete) opts.complete(result);
      return result;
    })
    .catch((err) => {
      clearTimeout(timer);
      const result = { errMsg: `request:fail ${err.message || err.name || "unknown"}` };
      if (opts.fail) opts.fail(result);
      if (opts.complete) opts.complete(result);
      throw result;
    });
}

function createTempFilePath(file) {
  fileSeq += 1;
  const tempPath = `browser-file://${Date.now()}-${fileSeq}`;
  fileStore.set(tempPath, file);
  return tempPath;
}

function pickFiles(opts, accept, multiple) {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.top = "-9999px";
    input.style.opacity = "0";

    let focusTimer = null;
    const cleanup = () => {
      input.removeEventListener("change", handleChange);
      window.removeEventListener("focus", handleFocus);
      if (focusTimer) {
        window.clearTimeout(focusTimer);
        focusTimer = null;
      }
      if (input.parentNode) {
        input.parentNode.removeChild(input);
      }
    };

    const handleChange = () => {
      const selectedFiles = Array.from(input.files || []);
      cleanup();
      if (selectedFiles.length === 0) {
        const err = { errMsg: "chooseFile:fail cancel" };
        if (opts.fail) opts.fail(err);
        if (opts.complete) opts.complete(err);
        reject(err);
        return;
      }

      const count = Number.isInteger(opts.count) ? Math.max(1, opts.count) : 1;
      const tempFiles = selectedFiles.slice(0, count).map((file) => {
        const path = createTempFilePath(file);
        return {
          path,
          tempFilePath: path,
          name: file.name,
          size: file.size,
          type: file.type,
          file,
        };
      });
      const result = {
        tempFiles,
        tempFilePaths: tempFiles.map((item) => item.path),
        errMsg: "chooseFile:ok",
      };
      if (opts.success) opts.success(result);
      if (opts.complete) opts.complete(result);
      resolve(result);
    };

    const handleFocus = () => {
      if (focusTimer) {
        window.clearTimeout(focusTimer);
      }
      focusTimer = window.setTimeout(() => {
        if (!input.files || input.files.length === 0) {
          cleanup();
        }
      }, 800);
    };

    input.addEventListener("change", handleChange);
    window.addEventListener("focus", handleFocus);
    document.body.appendChild(input);
    input.click();
  });
}

export function chooseFiles(opts = {}) {
  const accept = opts.type === "image" ? "image/*,.gif" : "";
  const count = Number.isInteger(opts.count) ? opts.count : 1;
  return pickFiles({ ...opts, count }, accept, count > 1);
}

export function chooseImages(opts = {}) {
  const count = Number.isInteger(opts.count) ? opts.count : 1;
  return pickFiles({ ...opts, count }, "image/*,.gif", count > 1);
}

export const fileSystem = {
  readFile(opts = {}) {
    let file = fileStore.get(opts.filePath);
    if (file == null) {
      const stored = localStorage.getItem(`browser-fs:${opts.filePath}`);
      if (stored) {
        try {
          file = base64ToArrayBuffer(stored);
          fileStore.set(opts.filePath, file);
        } catch {
          localStorage.removeItem(`browser-fs:${opts.filePath}`);
        }
      }
    }

    if (file == null) {
      const err = { errMsg: "readFile:fail file not found" };
      if (opts.fail) opts.fail(err);
      if (opts.complete) opts.complete(err);
      return;
    }

    if (!(file instanceof Blob)) {
      let data = file;
      if (opts.encoding === "base64") {
        const bytes = file instanceof Uint8Array ? file : new Uint8Array(file);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 1) {
          binary += String.fromCharCode(bytes[i]);
        }
        data = btoa(binary);
      }
      const result = { data, errMsg: "readFile:ok" };
      if (opts.success) opts.success(result);
      if (opts.complete) opts.complete(result);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      let data = reader.result;
      if (opts.encoding === "base64" && typeof data === "string") {
        const commaIndex = data.indexOf(",");
        data = commaIndex >= 0 ? data.slice(commaIndex + 1) : data;
      }
      const result = { data, errMsg: "readFile:ok" };
      if (opts.success) opts.success(result);
      if (opts.complete) opts.complete(result);
    };
    reader.onerror = () => {
      const err = { errMsg: "readFile:fail" };
      if (opts.fail) opts.fail(err);
      if (opts.complete) opts.complete(err);
    };

    if (opts.encoding === "base64") {
      reader.readAsDataURL(file);
      return;
    }
    reader.readAsArrayBuffer(file);
  },

  writeFileSync(filePath, data) {
    fileStore.set(filePath, data);
    localStorage.setItem(`browser-fs:${filePath}`, arrayBufferToBase64(data));
  },

  access(opts = {}) {
    const filePath = opts.path || opts.filePath;
    if (fileStore.has(filePath) || localStorage.getItem(`browser-fs:${filePath}`) != null) {
      const result = { errMsg: "access:ok" };
      if (opts.success) opts.success(result);
      if (opts.complete) opts.complete(result);
      return;
    }
    const err = { errMsg: "access:fail file not found" };
    if (opts.fail) opts.fail(err);
    if (opts.complete) opts.complete(err);
  },

  unlink(opts = {}) {
    const filePath = opts.filePath || opts.path;
    fileStore.delete(filePath);
    localStorage.removeItem(`browser-fs:${filePath}`);
    const result = { errMsg: "unlink:ok" };
    if (opts.success) opts.success(result);
    if (opts.complete) opts.complete(result);
  },
};

function resolveRoutePath(path) {
  const [pathPart, queryPart] = path.split("?");
  const routeMap = {
    "/pages/clock-editor/clock-editor": "/clock",
    "/pages/control/control": "/device-control",
    "/pages/device-flash/device-flash": "/device-flash",
    "/pages/ble-config/ble-config": "/ble-config",
  };
  let target = routeMap[pathPart];
  if (!target) {
    const match = pathPart.match(/^\/pages\/([^/]+)\/([^/]+)$/);
    target = match ? `/${match[2]}` : pathPart;
  }
  return queryPart ? `${target}?${queryPart}` : target;
}

export function navigateTo(opts = {}) {
  if (!opts.url) return Promise.reject(new Error("navigateTo url required"));
  const target = resolveRoutePath(opts.url);
  if (!routerRef) {
    window.location.href = target;
    return Promise.resolve();
  }
  return routerRef.push(target).then(
    () => {
      if (opts.success) opts.success();
      if (opts.complete) opts.complete();
    },
    (err) => {
      if (opts.fail) opts.fail(err);
      if (opts.complete) opts.complete();
      throw err;
    },
  );
}

export function navigateBack(opts = {}) {
  const delta = opts.delta || 1;
  if (routerRef) {
    routerRef.go(-delta);
  } else {
    window.history.go(-delta);
  }
  if (opts.success) opts.success();
  if (opts.complete) opts.complete();
  return Promise.resolve();
}

export function createDomQuery() {
  return new SelectorQuery();
}

class SelectorQuery {
  constructor() {
    this.tasks = [];
  }

  in() {
    return this;
  }

  select(selector) {
    return new SelectorTask(selector, false, this);
  }

  selectAll(selector) {
    return new SelectorTask(selector, true, this);
  }

  exec(cb) {
    const results = this.tasks.map((task) => task.run());
    if (cb) cb(results);
  }
}

class SelectorTask {
  constructor(selector, all, query) {
    this.selector = selector;
    this.all = all;
    this.query = query;
    this.mode = null;
    this.spec = null;
    this.cb = null;
  }

  fields(spec) {
    this.mode = "fields";
    this.spec = spec;
    this.query.tasks.push(this);
    return this.query;
  }

  boundingClientRect(cb) {
    this.mode = "rect";
    this.cb = cb;
    this.query.tasks.push(this);
    return this.query;
  }

  size() {
    this.mode = "size";
    this.query.tasks.push(this);
    return this.query;
  }

  run() {
    const elements = this.all
      ? Array.from(document.querySelectorAll(this.selector))
      : (document.querySelector(this.selector) ? [document.querySelector(this.selector)] : []);
    if (elements.length === 0) {
      const empty = this.all ? [] : null;
      if (this.mode === "rect" && this.cb) this.cb(empty);
      return empty;
    }

    if (this.mode === "fields") {
      const result = elements.map((el) => {
        const out = {};
        const spec = this.spec || {};
        if (spec.node) out.node = el;
        if (spec.size || spec.rect) {
          const rect = el.getBoundingClientRect();
          out.width = rect.width;
          out.height = rect.height;
          if (spec.rect) {
            out.left = rect.left;
            out.top = rect.top;
            out.right = rect.right;
            out.bottom = rect.bottom;
          }
        }
        return out;
      });
      return this.all ? result : result[0];
    }

    if (this.mode === "rect") {
      const result = elements.map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          top: rect.top,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        };
      });
      const out = this.all ? result : result[0];
      if (this.cb) this.cb(out);
      return out;
    }

    return null;
  }
}

function makeDeadSocketTask(payload) {
  return {
    onOpen() {},
    onMessage() {},
    onError(cb) {
      if (cb) cb(payload);
    },
    onClose(cb) {
      Promise.resolve().then(() => {
        if (cb) cb({ code: 1006, reason: payload?.errMsg || "" });
      });
    },
    send(opts = {}) {
      if (opts.fail) opts.fail({ errMsg: "socket not connected" });
      if (opts.complete) opts.complete();
    },
    close(opts = {}) {
      if (opts.success) opts.success();
      if (opts.complete) opts.complete();
    },
  };
}

class SocketTask {
  constructor(ws) {
    this.ws = ws;
    this.handlers = { open: [], message: [], error: [], close: [] };
    this.fired = { open: false, error: null, close: null };
    try {
      ws.binaryType = "arraybuffer";
    } catch {}

    ws.addEventListener("open", () => {
      this.fired.open = true;
      this.fire("open", {});
    });
    ws.addEventListener("message", (ev) => {
      this.fire("message", { data: ev.data });
    });
    ws.addEventListener("error", () => {
      const payload = { errMsg: "socket error" };
      this.fired.error = payload;
      this.fire("error", payload);
    });
    ws.addEventListener("close", (ev) => {
      const payload = { code: ev.code, reason: ev.reason };
      this.fired.close = payload;
      this.fire("close", payload);
    });
  }

  onOpen(cb) {
    this.handlers.open.push(cb);
    if (this.fired.open) cb({});
  }

  onMessage(cb) {
    this.handlers.message.push(cb);
  }

  onError(cb) {
    this.handlers.error.push(cb);
    if (this.fired.error) cb(this.fired.error);
  }

  onClose(cb) {
    this.handlers.close.push(cb);
    if (this.fired.close) cb(this.fired.close);
  }

  fire(type, payload) {
    for (const handler of this.handlers[type] || []) {
      handler(payload);
    }
  }

  send(opts = {}) {
    try {
      this.ws.send(opts.data);
      if (opts.success) opts.success();
    } catch (err) {
      if (opts.fail) opts.fail({ errMsg: err.message });
    } finally {
      if (opts.complete) opts.complete();
    }
  }

  close(opts = {}) {
    try {
      this.ws.close(opts.code, opts.reason);
    } catch {}
    if (opts.success) opts.success();
    if (opts.complete) opts.complete();
  }
}

export function connectSocket(opts = {}) {
  if (!opts.url) {
    const payload = { errMsg: "connectSocket url required" };
    if (opts.fail) opts.fail(payload);
    return makeDeadSocketTask(payload);
  }
  try {
    const ws = new WebSocket(opts.url);
    if (opts.success) opts.success();
    if (opts.complete) opts.complete();
    return new SocketTask(ws);
  } catch (err) {
    const payload = { errMsg: err.message || String(err) };
    if (opts.fail) opts.fail(payload);
    if (opts.complete) opts.complete();
    return makeDeadSocketTask(payload);
  }
}

export function getNetworkType(opts = {}) {
  const result = { networkType: navigator.onLine ? "wifi" : "none" };
  if (opts.success) opts.success(result);
  if (opts.complete) opts.complete(result);
  return Promise.resolve(result);
}

export function vibrateShort(opts = {}) {
  if (navigator.vibrate) navigator.vibrate(15);
  if (opts.success) opts.success();
  if (opts.complete) opts.complete();
}

export function canvasToTempFilePath(opts = {}) {
  const canvas = opts.canvas || (opts.canvasId ? document.getElementById(opts.canvasId) : null);
  if (!canvas || typeof canvas.toDataURL !== "function") {
    const err = { errMsg: "canvasToTempFilePath:fail canvas not found" };
    if (opts.fail) opts.fail(err);
    if (opts.complete) opts.complete(err);
    return;
  }
  try {
    const type = opts.fileType === "jpg" || opts.fileType === "jpeg" ? "image/jpeg" : "image/png";
    const quality = typeof opts.quality === "number" ? opts.quality : 0.92;
    const result = {
      tempFilePath: canvas.toDataURL(type, quality),
      errMsg: "canvasToTempFilePath:ok",
    };
    if (opts.success) opts.success(result);
    if (opts.complete) opts.complete(result);
  } catch (err) {
    const result = { errMsg: `canvasToTempFilePath:fail ${err.message || err}` };
    if (opts.fail) opts.fail(result);
    if (opts.complete) opts.complete(result);
  }
}

export function saveImageToPhotosAlbum(opts = {}) {
  try {
    const filePath = opts.filePath;
    if (typeof filePath !== "string" || filePath.length === 0) {
      throw new Error("filePath required");
    }
    const link = document.createElement("a");
    link.href = filePath;
    link.download = `glowxel-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    const result = { errMsg: "saveImageToPhotosAlbum:ok" };
    if (opts.success) opts.success(result);
    if (opts.complete) opts.complete(result);
  } catch (err) {
    const result = { errMsg: `saveImageToPhotosAlbum:fail ${err.message || err}` };
    if (opts.fail) opts.fail(result);
    if (opts.complete) opts.complete(result);
  }
}
