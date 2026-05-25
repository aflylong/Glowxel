// uni API 兼容层 (Web 版)
// 把 uniapp 代码里常用的 uni.* API 映射到浏览器 API
// 让 uniapp 的 store/utils/components/mixins 能尽量原样在 web 跑
//
// 用法: 在 main.js 顶部 import './utils/uni-shim.js'  → 全局挂 window.uni
// 也可以按需 import 单个函数

const uni = {
  // ===== 存储 =====
  setStorageSync(key, value) {
    try {
      const v = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, v);
    } catch (e) {
      console.warn('[uni-shim] setStorageSync failed', key, e);
    }
  },
  getStorageSync(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw == null) return '';
      // uniapp 的 getStorageSync 可以存对象也可以存字符串, 用户自己处理
      // 我们尝试 JSON.parse, 失败就返回原字符串
      try { return JSON.parse(raw); } catch { return raw; }
    } catch (e) {
      console.warn('[uni-shim] getStorageSync failed', key, e);
      return '';
    }
  },
  removeStorageSync(key) {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  },
  clearStorageSync() {
    try { localStorage.clear(); } catch (e) { /* ignore */ }
  },

  // ===== 系统信息 =====
  getSystemInfoSync() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    return {
      windowWidth: w,
      windowHeight: h,
      screenWidth: window.screen?.width || w,
      screenHeight: window.screen?.height || h,
      pixelRatio: window.devicePixelRatio || 1,
      statusBarHeight: 0,        // web 没状态栏
      safeAreaInsets: { top: 0, bottom: 0, left: 0, right: 0 },
      platform: isAndroid ? 'android' : isIOS ? 'ios' : 'web',
      system: ua,
      model: 'web',
      brand: 'web',
    };
  },

  // ===== Base64 / ArrayBuffer 互转 =====
  base64ToArrayBuffer(b64) {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8.buffer;
  },
  arrayBufferToBase64(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
    return btoa(bin);
  },

  // ===== 路由 (映射到 vue-router, 由 main.js 注入 router 实例) =====
  // uni.navigateTo({ url: '/pages/xxx/xxx?id=1' })
  // 我们解析路径 + query 后用 vue-router 跳
  _router: null,
  _routerPathMap: null,        // 可选: 自定义 uniapp 路径 → website 路径映射
  _setRouter(router, pathMap = null) {
    this._router = router;
    this._routerPathMap = pathMap;
  },
  _resolveUniPath(uniPath) {
    // 默认: 去掉 /pages 前缀, 取 /xxx-name 段, 再加查询
    // uniapp: /pages/maze-mode/maze-mode?ip=xxx
    // website: /maze-mode?ip=xxx
    const [pathPart, queryPart] = uniPath.split('?');
    if (this._routerPathMap && this._routerPathMap[pathPart]) {
      const mapped = this._routerPathMap[pathPart];
      return queryPart ? `${mapped}?${queryPart}` : mapped;
    }
    // 通用规则: /pages/<name>/<name> → /<name>
    const m = pathPart.match(/^\/pages\/([^/]+)\/[^/]+$/);
    if (m) return queryPart ? `/${m[1]}?${queryPart}` : `/${m[1]}`;
    // fallback 原样返回
    return uniPath;
  },
  navigateTo(opts) {
    if (!opts || !opts.url) return Promise.reject(new Error('navigateTo url required'));
    if (!this._router) {
      console.warn('[uni-shim] navigateTo: router not set, fallback to location');
      window.location.href = this._resolveUniPath(opts.url);
      return Promise.resolve();
    }
    const target = this._resolveUniPath(opts.url);
    return this._router.push(target).then(
      () => { opts.success && opts.success(); opts.complete && opts.complete(); },
      (err) => { opts.fail && opts.fail(err); opts.complete && opts.complete(); throw err; }
    );
  },
  redirectTo(opts) {
    if (!opts || !opts.url) return Promise.reject(new Error('redirectTo url required'));
    if (!this._router) {
      window.location.replace(this._resolveUniPath(opts.url));
      return Promise.resolve();
    }
    return this._router.replace(this._resolveUniPath(opts.url));
  },
  navigateBack(opts = {}) {
    const delta = opts.delta || 1;
    if (this._router) {
      this._router.go(-delta);
    } else {
      window.history.go(-delta);
    }
    if (opts.success) opts.success();
    if (opts.complete) opts.complete();
    return Promise.resolve();
  },
  switchTab(opts) {
    // web 没 tabBar, 当成 redirectTo
    return this.redirectTo(opts);
  },
  reLaunch(opts) {
    return this.redirectTo(opts);
  },

  // ===== 提示 (没 toast 实例就 fallback 到 console) =====
  showToast(opts) {
    if (!opts) return;
    const title = opts.title || '';
    if (typeof window !== 'undefined' && window.__glx_toast__) {
      window.__glx_toast__.show(title, opts.icon === 'error' ? 'error' : 'info', opts.duration || 1500);
    } else {
      console.log('[toast]', title);
    }
  },
  hideToast() {
    if (typeof window !== 'undefined' && window.__glx_toast__) {
      window.__glx_toast__.hide();
    }
  },
  showLoading(opts) {
    this.showToast({ title: opts?.title || '加载中', icon: 'loading' });
  },
  hideLoading() { this.hideToast(); },
  showModal(opts) {
    return new Promise((resolve) => {
      const ok = window.confirm(opts?.content || '');
      const result = { confirm: ok, cancel: !ok };
      if (ok && opts?.success) opts.success(result);
      if (opts?.complete) opts.complete(result);
      resolve(result);
    });
  },

  // ===== Selector Query (Canvas 用) =====
  // uni 在 web 下其实也是用 querySelector, 我们直接走 DOM
  createSelectorQuery() {
    return new SelectorQueryShim();
  },

  // ===== Socket =====
  // uni.connectSocket({url, success, fail}) → 返回 SocketTask
  // 我们包装浏览器 WebSocket
  connectSocket(opts) {
    if (!opts || !opts.url) {
      if (opts?.fail) opts.fail({ errMsg: 'connectSocket url required' });
      return null;
    }
    let ws;
    try {
      ws = new WebSocket(opts.url);
    } catch (e) {
      if (opts.fail) opts.fail({ errMsg: e.message || 'connectSocket failed' });
      if (opts.complete) opts.complete();
      return null;
    }
    if (opts.success) opts.success();
    if (opts.complete) opts.complete();
    return new SocketTaskShim(ws);
  },

  // ===== 剪贴板 =====
  setClipboardData(opts) {
    if (!opts) return;
    const data = opts.data || '';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(data).then(
        () => { opts.success && opts.success(); opts.complete && opts.complete(); },
        (err) => { opts.fail && opts.fail(err); opts.complete && opts.complete(); },
      );
    } else {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = data;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); opts.success && opts.success(); }
      catch (err) { opts.fail && opts.fail(err); }
      finally { document.body.removeChild(ta); opts.complete && opts.complete(); }
    }
  },

  // ===== 占位 (web 没的就空函数) =====
  vibrateShort() {},
  vibrateLong() {},
  setNavigationBarTitle(opts) {
    if (opts?.title) document.title = opts.title;
  },
  getNetworkType(opts) {
    const type = navigator.onLine ? 'wifi' : 'none';
    if (opts?.success) opts.success({ networkType: type });
    return Promise.resolve({ networkType: type });
  },
};

// ============ SelectorQuery Shim ============
// uniapp: query.select('#id').fields({ node, size }).exec(cb)
//   small program 模式下 res[0].node = 真实 canvas DOM
// web: 直接 document.querySelector
class SelectorQueryShim {
  constructor() { this._tasks = []; this._scope = null; }
  in(_vm) { return this; }
  select(selector) {
    return new SelectorTaskShim(selector, false, this);
  }
  selectAll(selector) {
    return new SelectorTaskShim(selector, true, this);
  }
}

class SelectorTaskShim {
  constructor(selector, all, query) {
    this.selector = selector;
    this.all = all;
    this.query = query;
    this._fields = null;
    this._mode = null;
    this._scope = null;
  }
  fields(spec) { this._fields = spec; this._mode = 'fields'; this.query._tasks.push(this); return this.query; }
  boundingClientRect(cb) {
    this._mode = 'rect';
    this._cb = cb;
    this.query._tasks.push(this);
    return this.query;
  }
  size() {
    this._mode = 'size';
    this.query._tasks.push(this);
    return this.query;
  }
}

SelectorQueryShim.prototype.exec = function (cb) {
  // 把所有 task 同步收集结果
  const results = this._tasks.map((task) => {
    const els = task.all
      ? Array.from(document.querySelectorAll(task.selector))
      : (document.querySelector(task.selector) ? [document.querySelector(task.selector)] : []);
    if (els.length === 0) {
      // boundingClientRect 单选返回 null, 多选返回 []
      const empty = task.all ? [] : null;
      if (task._mode === 'rect' && task._cb) task._cb(empty);
      return empty;
    }
    if (task._mode === 'fields') {
      const result = els.map((el) => {
        const out = {};
        const spec = task._fields || {};
        if (spec.node) out.node = el;
        if (spec.size) {
          const r = el.getBoundingClientRect();
          out.width = r.width; out.height = r.height;
        }
        if (spec.rect) {
          const r = el.getBoundingClientRect();
          out.left = r.left; out.top = r.top; out.right = r.right; out.bottom = r.bottom;
          out.width = r.width; out.height = r.height;
        }
        return out;
      });
      return task.all ? result : result[0];
    }
    if (task._mode === 'rect') {
      const result = els.map((el) => {
        const r = el.getBoundingClientRect();
        return {
          left: r.left, top: r.top, right: r.right, bottom: r.bottom,
          width: r.width, height: r.height,
        };
      });
      const out = task.all ? result : result[0];
      if (task._cb) task._cb(out);
      return out;
    }
    return null;
  });
  if (cb) cb(results);
};

// ============ SocketTask Shim ============
// uniapp SocketTask: onOpen / onMessage / onError / onClose / send / close
//
// 关键: uniapp 风格里 connectSocket() 同步返回 task, 然后异步 onOpen() 注册回调.
// 但浏览器 WebSocket 的 open 事件可能在 onOpen 注册之前已经触发.
// 我们记录 _readyState 和 _firstError, 注册时如果已 OPEN 立即派发, 避免错过.
class SocketTaskShim {
  constructor(ws) {
    this.ws = ws;
    this._handlers = { open: [], message: [], error: [], close: [] };
    this._fired = { open: false, error: null, close: null };

    ws.addEventListener('open', () => {
      this._fired.open = true;
      this._fire('open', {});
    });
    ws.addEventListener('message', (ev) => {
      // uniapp message: { data: string | ArrayBuffer }
      this._fire('message', { data: ev.data });
    });
    ws.addEventListener('error', (ev) => {
      const payload = { errMsg: 'socket error' };
      this._fired.error = payload;
      this._fire('error', payload);
    });
    ws.addEventListener('close', (ev) => {
      const payload = { code: ev.code, reason: ev.reason };
      this._fired.close = payload;
      this._fire('close', payload);
    });
  }
  onOpen(cb) {
    this._handlers.open.push(cb);
    // 如果已经触发过 open, 立即派发 (避免 webSocket.js 注册晚了错过)
    if (this._fired.open) {
      try { cb({}); } catch (e) { console.error('[socket-shim] onOpen replay', e); }
    }
  }
  onMessage(cb) { this._handlers.message.push(cb); }
  onError(cb) {
    this._handlers.error.push(cb);
    if (this._fired.error) {
      try { cb(this._fired.error); } catch (e) { console.error('[socket-shim] onError replay', e); }
    }
  }
  onClose(cb) {
    this._handlers.close.push(cb);
    if (this._fired.close) {
      try { cb(this._fired.close); } catch (e) { console.error('[socket-shim] onClose replay', e); }
    }
  }
  _fire(type, payload) {
    for (const h of this._handlers[type] || []) {
      try { h(payload); } catch (e) { console.error('[socket-shim]', type, e); }
    }
  }
  send(opts) {
    if (!opts) return;
    try {
      this.ws.send(opts.data);
      if (opts.success) opts.success();
    } catch (e) {
      if (opts.fail) opts.fail({ errMsg: e.message });
    } finally {
      if (opts.complete) opts.complete();
    }
  }
  close(opts = {}) {
    try { this.ws.close(opts.code, opts.reason); }
    catch (e) { /* ignore */ }
    if (opts.success) opts.success();
    if (opts.complete) opts.complete();
  }
}

// ============ 全局挂载 ============
if (typeof window !== 'undefined' && !window.uni) {
  window.uni = uni;
}

export default uni;
export { uni };
