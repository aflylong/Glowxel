/**
 * 切 SMB 完整素材 - 两个来源
 *
 * 来源 1: source-ref/src/media/  (ahmetcandiroglu/Super-Mario-Bros)
 *   - mario-forms.png  384×480  3 态 × 左右 × 5 帧
 *   - sprite.png       240×240  砖块/管道/敌人/道具 (5×5 网格 × 48×48)
 *
 * 来源 2: source-ref-3/res/sprites/  (Gold872/Super-Mario-Bros)
 *   - characters/EnemySpriteSheet.png  562×242  15行×35列  cell 16×16  pad 1
 *   - blocks/BlockTileSheet.png         817×375  22行×48列  同上
 *   - characters/PlayerSpriteSheet.png  403×266  16行×25列  同上 (只用来取 fireball 投掷物)
 *
 * 输出: organized/<分类>/<名称>.png + overview.png
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const A_DIR = path.join(__dirname, 'source-ref', 'src', 'media');
const G_DIR = path.join(__dirname, 'source-ref-3', 'res', 'sprites');
const OUT_DIR = path.join(__dirname, 'organized');

const A_SPRITE = path.join(A_DIR, 'sprite.png');
const A_MARIO = path.join(A_DIR, 'mario-forms.png');
const G_ENEMY = path.join(G_DIR, 'characters', 'EnemySpriteSheet.png');
const G_BLOCK = path.join(G_DIR, 'blocks', 'BlockTileSheet.png');
const G_PLAYER = path.join(G_DIR, 'characters', 'PlayerSpriteSheet.png');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
for (const sub of ['mario', 'enemies', 'items', 'tiles', 'effects']) {
  const d = path.join(OUT_DIR, sub);
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

async function crop(src, x, y, w, h, out) {
  await sharp(src).extract({ left: x, top: y, width: w, height: h }).toFile(out);
}

// ============ Mario 30 帧 (ahmetcandiroglu/mario-forms.png) ============
// 来自 SOURCE-REF.md §3, 之前已经确认是对的版本
console.log('=== Mario 30 帧 (mario-forms.png) ===');
const MARIO_FORMS = [
  ['small_left',  1, 52, 48],
  ['small_right', 2, 52, 48],
  ['super_left',  4, 48, 96],
  ['super_right', 5, 48, 96],
  ['fire_left',   7, 48, 96],
  ['fire_right',  8, 48, 96],
];
const FRAME_NAMES = ['idle', 'walk1', 'walk2', 'walk3', 'jump'];
for (const [formName, col, w, h] of MARIO_FORMS) {
  for (let i = 0; i < 5; i++) {
    const x = (col - 1) * w;
    const y = i * h;
    const out = path.join(OUT_DIR, 'mario', `mario_${formName}_${FRAME_NAMES[i]}.png`);
    await crop(A_MARIO, x, y, w, h, out);
    console.log(`  ✓ mario/mario_${formName}_${FRAME_NAMES[i]}.png  (${x},${y},${w}×${h})`);
  }
}

// ============ 砖块/管道/基础道具 (ahmetcandiroglu/sprite.png) ============
// 来自 SOURCE-REF.md §2
console.log('\n=== Tiles + 基础道具 (sprite.png) ===');
const A_OBJECTS = [
  // [name, x, y, w, h, category]
  ['ordinary_brick',   0,   0,   48, 48, 'tiles'],
  ['surprise_brick',   48,  0,   48, 48, 'tiles'],
  ['pipe',             96,  0,   96, 96, 'tiles'],
  ['end_flag',         192, 0,   48, 48, 'tiles'],
  ['used_brick',       0,   48,  48, 48, 'tiles'],
  ['ground_brick',     48,  48,  48, 48, 'tiles'],
  ['super_mushroom',   48,  192, 48, 48, 'items'],
  ['oneup_mushroom',   96,  192, 48, 48, 'items'],
  ['fire_flower',      144, 192, 48, 48, 'items'],
];
for (const [name, x, y, w, h, cat] of A_OBJECTS) {
  const out = path.join(OUT_DIR, cat, `${name}.png`);
  await crop(A_SPRITE, x, y, w, h, out);
  console.log(`  ✓ ${cat}/${name}.png  (${x},${y},${w}×${h})`);
}

// ============ 敌人 (Gold872/EnemySpriteSheet.png) ============
// 16×16 网格, pad 1 起始, 35 列  →  x=1+col*16, y=1+row*16
// id 已经用户确认 (38=koopa, 40=paratroopa, 44=piranha, 70=goomba)
console.log('\n=== Enemies (EnemySpriteSheet.png) ===');
async function gridCrop(src, cols, id, hCells, wCells, out) {
  const col = id % cols;
  const row = Math.floor(id / cols);
  await crop(src, 1 + col * 16, 1 + row * 16, 16 * wCells, 16 * hCells, out);
}
const G_ENEMIES = [
  // [name, id, h_cells]
  ['goomba_walk1', 70, 1],
  ['goomba_walk2', 71, 1],
  ['goomba_dead',  72, 1],
  ['koopa_walk1',  38, 2],
  ['koopa_walk2',  39, 2],
  ['koopa_shell',  77, 1],
  ['paratroopa_walk1', 40, 2],
  ['paratroopa_walk2', 41, 2],
  ['piranha_open',  44, 2],
  ['piranha_close', 45, 2],
];
for (const [name, id, h] of G_ENEMIES) {
  const out = path.join(OUT_DIR, 'enemies', `${name}.png`);
  await gridCrop(G_ENEMY, 35, id, h, 1, out);
  console.log(`  ✓ enemies/${name}.png  (id=${id})`);
}

// ============ 道具补全 (Gold872/BlockTileSheet.png) ============
// 22行×48列, cell 16×16 pad 1
// id 656-659 = coin 4 帧旋转, 672 = star, 291 = brick debris
console.log('\n=== Items 补全 (BlockTileSheet.png) ===');
const G_BLOCK_OBJECTS = [
  ['coin_anim1', 656, 'items', 1],
  ['coin_anim2', 657, 'items', 1],
  ['coin_anim3', 658, 'items', 1],
  ['coin_anim4', 659, 'items', 1],
  ['star',       672, 'items', 1],
  ['debris',     291, 'effects', 1],
];
for (const [name, id, cat, h] of G_BLOCK_OBJECTS) {
  const out = path.join(OUT_DIR, cat, `${name}.png`);
  await gridCrop(G_BLOCK, 48, id, h, 1, out);
  console.log(`  ✓ ${cat}/${name}.png  (id=${id})`);
}

// ============ Fireball 投掷物 (Gold872/PlayerSpriteSheet.png) ============
// id 246/247: 16 列 × 16 行, 跟其他一样 (但 PlayerSheet 是 25 列)
console.log('\n=== Fireball (PlayerSpriteSheet.png) ===');
await gridCrop(G_PLAYER, 25, 246, 1, 1, path.join(OUT_DIR, 'effects', 'fireball_fly.png'));
console.log(`  ✓ effects/fireball_fly.png  (id=246)`);
await gridCrop(G_PLAYER, 25, 247, 1, 1, path.join(OUT_DIR, 'effects', 'fireball_blast.png'));
console.log(`  ✓ effects/fireball_blast.png  (id=247)`);

// ============ 拼接 overview ============
console.log('\n=== 拼接 overview ===');
const allFiles = [];
for (const sub of ['mario', 'enemies', 'items', 'tiles', 'effects']) {
  const d = path.join(OUT_DIR, sub);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter(f => f.endsWith('.png')).sort();
  for (const f of files) {
    allFiles.push({ category: sub, file: f, path: path.join(d, f) });
  }
}

const COLS = 8;
const CELL_W = 110;
const CELL_H = 130;
const totalRows = Math.ceil(allFiles.length / COLS);
const canvasW = COLS * CELL_W + 16;
const canvasH = totalRows * CELL_H + 16;

const composites = [];
for (let i = 0; i < allFiles.length; i++) {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  const meta = await sharp(allFiles[i].path).metadata();
  // Mario 是 48-52×48-96, Gold872 是 16×16/32 → 统一放大到 ~96 显示
  const scale = meta.width <= 32 ? 4 : Math.max(1, Math.floor(96 / Math.max(meta.width, meta.height)));
  const sw = meta.width * scale;
  const sh = meta.height * scale;
  const upscaled = await sharp(allFiles[i].path)
    .resize(sw, sh, { kernel: 'nearest' })
    .png()
    .toBuffer();
  const left = 8 + c * CELL_W + Math.floor((CELL_W - sw) / 2);
  const top = 8 + r * CELL_H + Math.floor((CELL_H - sh) / 2);
  composites.push({ input: upscaled, left, top });
}

await sharp({
  create: {
    width: canvasW,
    height: canvasH,
    channels: 4,
    background: { r: 60, g: 60, b: 60, alpha: 1 },
  },
})
  .composite(composites)
  .png()
  .toFile(path.join(__dirname, 'overview.png'));

console.log(`✓ overview.png (${canvasW}×${canvasH}, ${allFiles.length} 个 sprite)`);
console.log('\n=== 清单 ===');
for (const f of allFiles) console.log(`  ${f.category}/${f.file}`);
