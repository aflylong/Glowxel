// 给 views/mobile/*.vue 注入 uniLifecycleAdapter mixin
// 让 onLoad / onReady / onShow / onHide / onUnload 在 web 端正常触发
//
// 策略: 找到 mixins: [...] 数组, 在最前面加 uniLifecycleAdapter
//       如果没有 mixins 字段, 在 export default { ... 里加 mixins: [uniLifecycleAdapter]
//       同时在顶部 import uniLifecycleAdapter from '@/mixins/uniLifecycleAdapter.js'

import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('src/views/mobile');
const IMPORT_LINE = `import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";\n`;

let touched = 0;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.vue')) continue;
  const p = path.join(dir, f);
  let src = fs.readFileSync(p, 'utf8');
  if (src.includes('uniLifecycleAdapter')) {
    console.log('skip (already injected):', f);
    continue;
  }

  // 1. 加 import (在第一个 import 之前)
  const firstImportIdx = src.search(/^import\s/m);
  if (firstImportIdx === -1) {
    console.warn('skip (no import found):', f);
    continue;
  }
  src = src.slice(0, firstImportIdx) + IMPORT_LINE + src.slice(firstImportIdx);

  // 2. 找 mixins 数组并在前面加; 如果没有 mixins 在 export default { 后加
  const mixinsRe = /(mixins:\s*\[)/;
  if (mixinsRe.test(src)) {
    src = src.replace(mixinsRe, '$1uniLifecycleAdapter, ');
  } else {
    // 找 "export default {"
    src = src.replace(
      /(export default\s*\{\s*)/,
      '$1\n  mixins: [uniLifecycleAdapter],\n  '
    );
  }

  fs.writeFileSync(p, src, 'utf8');
  console.log('injected:', f);
  touched++;
}
console.log(`\ntotal: ${touched} files`);
