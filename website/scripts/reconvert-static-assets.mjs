// 重新从 uniapp/static/ 复制资产到 website/src/assets/static/
// 把 module.exports = ... → export default ...
// 用 Node 处理保证 UTF8 编码正确
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'd:/project/Glowxel/uniapp/static';
const DST = 'd:/project/Glowxel/website/src/assets/static';

function walk(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(dstDir, { recursive: true });
  for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const sp = path.join(srcDir, e.name);
    const dp = path.join(dstDir, e.name);
    if (e.isDirectory()) {
      walk(sp, dp);
    } else if (e.name.endsWith('.js')) {
      // 读, 改 module.exports → export default, 用 utf8 写
      let txt = fs.readFileSync(sp, 'utf8');
      // 去 BOM
      if (txt.charCodeAt(0) === 0xFEFF) txt = txt.slice(1);
      // 替换
      const newTxt = txt.replace(/module\.exports\s*=/g, 'export default');
      fs.writeFileSync(dp, newTxt, 'utf8');
      console.log(`copied + esm: ${path.relative(SRC, sp)}`);
    } else {
      // 非 JS 直接复制 (Buffer, 不动编码)
      fs.copyFileSync(sp, dp);
      console.log(`copied raw: ${path.relative(SRC, sp)}`);
    }
  }
}

walk(SRC, DST);
console.log('done');
