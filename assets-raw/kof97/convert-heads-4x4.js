/**
 * 一次性脚本: 把 KOF_HEADS 从 5×4 转成 4×4
 *
 * 策略: 对每个头像在 5 列中扫描"非空像素最多的 4 列连续窗口"
 *       (在 [0..1, 1..4] 两个 4 列窗口里选总像素数多的一个)
 *
 * 输入/输出: website/src/utils/kof97Sprites.js (覆盖原文件)
 *           assets-raw/kof97/kof97Sprites.js   (副本)
 *
 * 用法: node convert-heads-4x4.js
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const SPRITES_JS = path.join(__dirname, '..', '..', 'website', 'src', 'utils', 'kof97Sprites.js');

// 加载现有 5×4 数据
async function loadSprites() {
  const fileUrl = url.pathToFileURL(SPRITES_JS).href + '?t=' + Date.now();
  const mod = await import(fileUrl);
  return mod.KOF_HEADS;
}

// 5×4 → 4×4: 选最佳 4 列窗口
function convert5x4To4x4(head) {
  const { w, h, p } = head;
  if (w !== 5 || h !== 4) {
    console.log(`  ⚠ 尺寸不是 5×4: ${w}×${h}, 跳过`);
    return head;
  }

  // 4 个 4 列窗口: [0..3], [1..4]
  // 评估每个窗口的"非空像素总数"
  let bestStart = 0, bestCount = -1;
  for (let start = 0; start <= w - 4; start++) {
    let count = 0;
    for (let y = 0; y < h; y++) {
      for (let dx = 0; dx < 4; dx++) {
        if (p[y * w + start + dx] !== null) count++;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestStart = start;
    }
  }

  // 提取 4×4
  const newP = [];
  for (let y = 0; y < 4; y++) {
    for (let dx = 0; dx < 4; dx++) {
      newP.push(p[y * w + bestStart + dx]);
    }
  }
  return { w: 4, h: 4, p: newP };
}

const KOF_HEADS = await loadSprites();

const result = {};
let total5x4 = 0, total4x4 = 0;
for (const [key, head] of Object.entries(KOF_HEADS)) {
  const before = head.p.filter(p => p !== null).length;
  const newHead = convert5x4To4x4(head);
  const after = newHead.p.filter(p => p !== null).length;
  result[key] = newHead;
  total5x4 += before;
  total4x4 += after;
  console.log(`✓ ${key.padEnd(10)} ${before}/${head.w * head.h} → ${after}/16`);
}

console.log(`\n总像素 ${total5x4} → ${total4x4} (-${total5x4 - total4x4})`);

// 写文件
const js = `// 自动生成 - KOF '97 14 个角色头像 (4×4 像素)
// 不要手编辑
export const KOF_HEADS = ${JSON.stringify(result, null, 0)};
`;
fs.writeFileSync(SPRITES_JS, js);
console.log(`\n写出 ${SPRITES_JS}`);
