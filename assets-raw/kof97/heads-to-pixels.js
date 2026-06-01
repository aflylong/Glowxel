// 把 13 张 KOF 头像缩到 5×4 像素 + 输出 JS 数据
const sharp = require('../node_modules/sharp');
const fs = require('fs');
const path = require('path');

const CHARS = [
  ['kyo',      'kyo.png'],
  ['iori',     'Iori.png'],
  ['terry',    'Terry.png'],
  ['andy',     'Andy.png'],
  ['benimaru', 'Benimaru.png'],
  ['mai',      'Mai.png'],
  ['ryo',      'Ryo.png'],
  ['goro',     'Goro.png'],
  ['chang',    'Chang.png'],
  ['choi',     'Choi.png'],
  ['shermie',  'Shermie.png'],
  ['yashiro',  'Yashiro.png'],
  ['chizuru',  'Chizuru.png'],
  ['orochi',   'Orochi.png'],
];

const OUT_DIR = path.join(__dirname, 'heads-5x4');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

(async () => {
  const result = {};
  for (const [key, file] of CHARS) {
    const src = path.join(__dirname, file);
    if (!fs.existsSync(src)) {
      console.log(`MISSING ${file}`);
      continue;
    }
    
    // 缩到 5×4 像素 (含透明度)
    const { data, info } = await sharp(src)
      .resize(5, 4, { kernel: 'nearest' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // 转成 JS 像素数组 (hex 或 null)
    const pixels = [];
    for (let i = 0; i < 5 * 4; i++) {
      const r = data[i*4], g = data[i*4+1], b = data[i*4+2], a = data[i*4+3];
      if (a < 64) pixels.push(null);
      else pixels.push('#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join(''));
    }
    
    result[key] = { w: 5, h: 4, p: pixels };
    
    // 也输出预览 PNG 放大 16x
    await sharp(src)
      .resize(5, 4, { kernel: 'nearest' })
      .resize(80, 64, { kernel: 'nearest' })
      .png()
      .toFile(path.join(OUT_DIR, `${key}-x16.png`));
    
    console.log(`OK  ${key.padEnd(10)} ${pixels.filter(p=>p).length}/20 non-null pixels`);
  }
  
  // 拼总览图: 13 个 5×4 头像放大 16×, 横排
  const composites = [];
  for (let i = 0; i < CHARS.length; i++) {
    const key = CHARS[i][0];
    const fp = path.join(OUT_DIR, `${key}-x16.png`);
    if (fs.existsSync(fp)) {
      composites.push({ input: fp, top: 4, left: 4 + i * 90 });
    }
  }
  await sharp({ create: { width: 90 * CHARS.length + 8, height: 80, channels: 4, background: { r: 50, g: 50, b: 50, alpha: 1 } } })
    .composite(composites).png().toFile(path.join(__dirname, 'heads-overview.png'));
  
  // 写 JS 数据文件
  const js = `// 自动生成 - KOF '97 13 个角色头像 (5×4 像素)
// 不要手编辑
export const KOF_HEADS = ${JSON.stringify(result, null, 0)};
`;
  const out = path.join(__dirname, 'kof97Sprites.js');
  fs.writeFileSync(out, js);
  console.log(`\nWrote ${out}`);
  console.log(`Wrote heads-overview.png`);
})();
