// PC 版设备页面 + 旧 device 组件全部从 stores/device.js 改成 stores/deviceLegacy.js
// 1) deviceLegacy.js 里把 defineStore('device', ...) 改成 ('deviceLegacy', ...)
//    并 export useDeviceLegacyStore (避免跟 mobile 端 useDeviceStore 冲突)
// 2) PC 版 views/X.vue (排除 mobile/) + components/device/** 把 import 路径
//    "@/stores/device.js" → "@/stores/deviceLegacy.js"
//    useDeviceStore → useDeviceLegacyStore

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('src');

// ============ Step 1: deviceLegacy.js 改 storeId + 命名 ============
{
  const p = path.join(ROOT, 'stores', 'deviceLegacy.js');
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/defineStore\(\s*['"]device['"]/g, "defineStore('deviceLegacy'");
  c = c.replace(/export\s+const\s+useDeviceStore\s*=/g, 'export const useDeviceLegacyStore =');
  fs.writeFileSync(p, c, 'utf8');
  console.log('[deviceLegacy.js] storeId + export name updated');
}

// ============ Step 2: PC 版页面 + 旧 device 组件改引用 ============
function walk(dir, list = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // 跳过 mobile/ 子目录 (那里是移动版, 用新 device store)
      if (path.basename(p) === 'mobile') continue;
      walk(p, list);
    } else if (/\.vue$|\.js$/.test(e.name)) {
      list.push(p);
    }
  }
  return list;
}

const targets = [
  ...walk(path.join(ROOT, 'views')),
  ...(fs.existsSync(path.join(ROOT, 'components', 'device')) ? walk(path.join(ROOT, 'components', 'device')) : []),
];

let touched = 0;
for (const f of targets) {
  let c = fs.readFileSync(f, 'utf8');
  const orig = c;
  c = c.replace(/from\s+(["'])@\/stores\/device\.js\1/g, 'from $1@/stores/deviceLegacy.js$1');
  c = c.replace(/useDeviceStore/g, 'useDeviceLegacyStore');
  if (c !== orig) {
    fs.writeFileSync(f, c, 'utf8');
    console.log('updated:', path.relative(ROOT, f));
    touched++;
  }
}
console.log(`\ntotal: ${touched} files updated`);
