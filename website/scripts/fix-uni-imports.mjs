// 修复 components/uni 下所有 vue 文件的相对 import 路径
// 不动文件编码 (用 Buffer 直接读写, 不经 PowerShell)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src/components/uni');

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.vue')) out.push(p);
  }
  return out;
}

const files = walk(root);
let changed = 0;

for (const f of files) {
  let src = fs.readFileSync(f, 'utf8');
  const orig = src;

  // ../composables/X.js → @/composables/X.js
  src = src.replace(/from\s+(["'])\.\.\/composables\/([^"']+)\1/g, 'from "@/composables/$2"');
  // ../../composables/X.js
  src = src.replace(/from\s+(["'])\.\.\/\.\.\/composables\/([^"']+)\1/g, 'from "@/composables/$2"');
  // ../../utils/X.js
  src = src.replace(/from\s+(["'])\.\.\/\.\.\/utils\/([^"']+)\1/g, 'from "@/utils/$2"');
  // ../utils/X.js (跨 clock-editor 子目录)
  src = src.replace(/from\s+(["'])\.\.\/utils\/([^"']+)\1/g, 'from "@/utils/$2"');
  // 同级 ./X.vue 不动
  // ../X.vue (clock-editor 子目录引父目录的) → @/components/uni/X.vue
  src = src.replace(/from\s+(["'])\.\.\/([A-Z][^"'/]*\.vue)\1/g, 'from "@/components/uni/$2"');

  if (src !== orig) {
    fs.writeFileSync(f, src, 'utf8');
    console.log(`fixed: ${path.relative(root, f)}`);
    changed++;
  }
}

console.log(`\ntotal: ${changed} files changed`);
