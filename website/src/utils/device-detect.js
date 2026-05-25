// 设备类型检测
// 返回 'mobile' | 'pc'
//
// 检测策略 (按优先级):
// 1. URL 强制 ?force=mobile / ?force=pc (调试用)
// 2. UA 关键字: 含 Mobile/iPhone/iPad/Android/HarmonyOS 视为 mobile
// 3. 屏幕宽度 ≤ 768 视为 mobile
//
// 注: ipad 高分屏 UA 可能像 mac, 用 navigator.maxTouchPoints 兜底

const MOBILE_UA_PATTERN = /Mobile|iPhone|iPad|iPod|Android|HarmonyOS|Windows Phone|webOS|BlackBerry/i;

function getForcedDeviceType() {
  if (typeof window === 'undefined') return null;
  const sp = new URLSearchParams(window.location.search);
  const f = sp.get('force');
  if (f === 'mobile' || f === 'pc') return f;
  // localStorage 也可强制 (在 console 里 localStorage.setItem('glx_device_type', 'mobile'))
  try {
    const stored = localStorage.getItem('glx_device_type');
    if (stored === 'mobile' || stored === 'pc') return stored;
  } catch { /* ignore */ }
  return null;
}

export function isMobileDevice() {
  if (typeof window === 'undefined') return false;
  const forced = getForcedDeviceType();
  if (forced) return forced === 'mobile';

  const ua = navigator.userAgent || '';
  if (MOBILE_UA_PATTERN.test(ua)) return true;

  // iPad iOS 13+ 默认 UA 像 mac, 用 maxTouchPoints 检测
  if (navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)) {
    return true;
  }

  // 屏幕宽度小于 768 视为移动端 (PC 浏览器拖窄窗口也走移动版)
  if (window.innerWidth <= 768) return true;

  return false;
}

export function getDeviceType() {
  return isMobileDevice() ? 'mobile' : 'pc';
}
