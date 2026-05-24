// 从 InventivetalentDev/minecraft-assets (镜像 Mojang 官方原版材质) 下载 16×16 方块/工具 PNG
// 路径: assets/minecraft/textures/block/<name>.png  和 assets/minecraft/textures/item/<name>.png
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'uniapp', 'static', 'minecraft', 'textures');
fs.mkdirSync(OUT_DIR, { recursive: true });

const CDN = 'https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.20.4';

const TARGETS = [
  // [输出名, 类型, 源文件名]
  ['oak_planks',        'block', 'oak_planks'],
  ['oak_log',           'block', 'oak_log'],
  ['stone',             'block', 'stone'],
  ['cobblestone',       'block', 'cobblestone'],
  // 矿石
  ['diamond_ore',       'block', 'diamond_ore'],
  ['gold_ore',          'block', 'gold_ore'],
  ['iron_ore',          'block', 'iron_ore'],
  ['redstone_ore',      'block', 'redstone_ore'],
  ['emerald_ore',       'block', 'emerald_ore'],
  ['lapis_ore',         'block', 'lapis_ore'],
  // 矿物块
  ['diamond_block',     'block', 'diamond_block'],
  ['gold_block',        'block', 'gold_block'],
  ['iron_block',        'block', 'iron_block'],
  ['emerald_block',     'block', 'emerald_block'],
  ['lapis_block',       'block', 'lapis_block'],
  ['redstone_block',    'block', 'redstone_block'],
  // 其他
  ['obsidian',          'block', 'obsidian'],
  ['glowstone',         'block', 'glowstone'],
  ['netherite_block',   'block', 'netherite_block'],
  ['quartz_block',      'block', 'quartz_block_side'],
  ['tnt_side',          'block', 'tnt_side'],
  // 镐子
  ['wooden_pickaxe',    'item', 'wooden_pickaxe'],
  ['stone_pickaxe',     'item', 'stone_pickaxe'],
  ['iron_pickaxe',      'item', 'iron_pickaxe'],
  ['diamond_pickaxe',   'item', 'diamond_pickaxe'],
  ['netherite_pickaxe', 'item', 'netherite_pickaxe'],
];

function dl(url, dest) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(dl(res.headers.location, dest));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return resolve({ ok: false, status: res.statusCode });
      }
      const bufs = [];
      res.on('data', (d) => bufs.push(d));
      res.on('end', () => {
        const buf = Buffer.concat(bufs);
        if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50) {
          return resolve({ ok: false, status: 'not-png' });
        }
        fs.writeFileSync(dest, buf);
        resolve({ ok: true, size: buf.length });
      });
    });
    req.on('error', (e) => resolve({ ok: false, err: e.message }));
    req.setTimeout(10000, () => { req.destroy(); resolve({ ok: false, err: 'timeout' }); });
  });
}

(async () => {
  let ok = 0, fail = 0;
  for (const [outName, type, src] of TARGETS) {
    const url = `${CDN}/assets/minecraft/textures/${type}/${src}.png`;
    const dest = path.join(OUT_DIR, `${outName}.png`);
    const r = await dl(url, dest);
    if (r.ok) {
      console.log(`✓ ${outName} <- ${url} (${r.size}B)`);
      ok++;
    } else {
      console.log(`✗ ${outName} <- ${url} | ${JSON.stringify(r)}`);
      fail++;
    }
  }
  // 还需要下载 Mojang Steve 默认皮肤
  const skinDest = path.join(__dirname, '..', 'uniapp', 'static', 'minecraft', '_steve_skin_64x64.png');
  const skinR = await dl('https://assets.mojang.com/SkinTemplates/steve.png', skinDest);
  if (skinR.ok) { console.log(`✓ _steve_skin_64x64 (${skinR.size}B)`); ok++; }
  else { console.log(`✗ steve skin: ${JSON.stringify(skinR)}`); fail++; }
  console.log(`\n总计: ${ok} 成功 / ${fail} 失败`);
})();
