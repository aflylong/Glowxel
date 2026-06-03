/**
 * 把 organized/ 里 57 个 PNG 转成 website/src/utils/superMarioSprites.js
 *
 * 规则:
 *   1. ahmetcandiroglu 切的图是 48×48 / 48×96 (3x 放大) 且有 alpha 通道
 *      → 取每个 3×3 块的中心像素, alpha=0 视为透明
 *   2. Gold872 切的图是 16×16 / 16×32 原始, 但 RGB 24 位无 alpha
 *      → 把 NES 透明色 (27,89,153) 和 (147,187,236) 视为透明
 *
 * 输出:
 *   key 格式: 'mario.small.right.idle'  / 'enemy.goomba.0' / 'item.star' / 'tile.pipe' 等
 *   value:    { w, h, p: [null|'#rrggbb', ...] }  (按行优先)
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ORG_DIR = path.join(__dirname, 'organized');
const OUT_FILE = path.join(__dirname, '..', '..', 'website', 'src', 'utils', 'superMarioSprites.js');

// Gold872 sheet 的两个 NES 透明色
const NES_TRANSPARENT = new Set(['27,89,153', '147,187,236']);

/**
 * 读 PNG, 输出 16×16 (或 16×32) 像素表
 * @param {string} filePath PNG 路径
 * @param {boolean} downscale3x 是否 3x 缩小 (ahmetcandiroglu 那批)
 * @param {'left'|'right'|null} cropSide 小 mario 52×48 → 48×48 时切掉哪侧 4 像素
 * @returns {{w, h, p: (string|null)[]}}
 */
async function loadSprite(filePath, downscale3x, cropSide = null) {
  let img = sharp(filePath);
  // 小 mario 特例: 52×48 → 切掉一侧 4 像素 → 48×48 才能 3x
  if (cropSide === 'right') {
    img = img.extract({ left: 0, top: 0, width: 48, height: 48 });
  } else if (cropSide === 'left') {
    img = img.extract({ left: 4, top: 0, width: 48, height: 48 });
  }
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const C = info.channels;

  const outW = downscale3x ? W / 3 : W;
  const outH = downscale3x ? H / 3 : H;
  if (downscale3x && (W % 3 !== 0 || H % 3 !== 0)) {
    throw new Error(`${filePath}: ${W}×${H} 不能 3x 缩小`);
  }

  const pixels = [];
  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      // 取像素位置: 3x 缩小取中心, 否则直接
      const sx = downscale3x ? ox * 3 + 1 : ox;
      const sy = downscale3x ? oy * 3 + 1 : oy;
      const i = (sy * W + sx) * C;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = C === 4 ? data[i + 3] : 255;

      let isTransparent = false;
      if (a === 0) {
        isTransparent = true;
      } else if (C === 3 && NES_TRANSPARENT.has(`${r},${g},${b}`)) {
        isTransparent = true;
      }

      if (isTransparent) {
        pixels.push(null);
      } else {
        const hex = '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
        pixels.push(hex);
      }
    }
  }

  return { w: outW, h: outH, p: pixels };
}

// ============ 输入清单 ============
// [输入相对路径, 输出 key, 是否 3x 缩小]
const SPRITES = [];

// ── Mario 30 帧 (ahmetcandiroglu, 3x 缩小) ──
// 小 mario 是 52×48 (NES 原版宽度 17, 渲染 51 = 17×3 + 1像素余量, 这里多输出 1 像素 = 4 像素余宽)
//   right 朝向: 多余 4 像素在最右边, 切掉
//   left  朝向: 多余 4 像素在最左边, 切掉
// 大 mario / 火 mario 都是 48×96, 不需要切
const FORMS = ['small', 'super', 'fire'];
const DIRS = ['left', 'right'];
const FRAMES = ['idle', 'walk1', 'walk2', 'walk3', 'jump'];
for (const form of FORMS) {
  for (const dir of DIRS) {
    for (const fr of FRAMES) {
      const cropSide = form === 'small' ? dir : null;
      SPRITES.push([
        `mario/mario_${form}_${dir}_${fr}.png`,
        `mario.${form}.${dir}.${fr}`,
        true,
        cropSide,
      ]);
    }
  }
}

// ── Tiles + 基础道具 (ahmetcandiroglu, 3x 缩小) ──
const A_TILES = [
  ['tiles/ordinary_brick.png', 'tile.ordinary_brick'],
  ['tiles/surprise_brick.png', 'tile.surprise_brick'],
  ['tiles/used_brick.png', 'tile.used_brick'],
  ['tiles/ground_brick.png', 'tile.ground_brick'],
  ['tiles/pipe.png', 'tile.pipe'],
  ['tiles/end_flag.png', 'tile.end_flag'],
  ['items/super_mushroom.png', 'item.super_mushroom'],
  ['items/oneup_mushroom.png', 'item.oneup_mushroom'],
  ['items/fire_flower.png', 'item.fire_flower'],
];
for (const [src, key] of A_TILES) SPRITES.push([src, key, true, null]);

// ── 敌人 + 补全道具 + 特效 (Gold872, 不缩小) ──
const G_OBJECTS = [
  ['enemies/goomba_walk1.png', 'enemy.goomba.0'],
  ['enemies/goomba_walk2.png', 'enemy.goomba.1'],
  ['enemies/goomba_dead.png', 'enemy.goomba.dead'],
  ['enemies/koopa_walk1.png', 'enemy.koopa.0'],
  ['enemies/koopa_walk2.png', 'enemy.koopa.1'],
  ['enemies/koopa_shell.png', 'enemy.koopa.shell'],
  ['enemies/paratroopa_walk1.png', 'enemy.paratroopa.0'],
  ['enemies/paratroopa_walk2.png', 'enemy.paratroopa.1'],
  ['enemies/piranha_open.png', 'enemy.piranha.open'],
  ['enemies/piranha_close.png', 'enemy.piranha.close'],
  ['items/coin_anim1.png', 'item.coin.0'],
  ['items/coin_anim2.png', 'item.coin.1'],
  ['items/coin_anim3.png', 'item.coin.2'],
  ['items/coin_anim4.png', 'item.coin.3'],
  ['items/star.png', 'item.star'],
  ['effects/debris.png', 'effect.debris'],
  ['effects/fireball_fly.png', 'effect.fireball'],
  ['effects/fireball_blast.png', 'effect.fireball.blast'],
];
for (const [src, key] of G_OBJECTS) SPRITES.push([src, key, false, null]);

// ============ 主流程 ============
const out = {};
let totalPixels = 0;
let totalNonNull = 0;
console.log(`处理 ${SPRITES.length} 个 sprite...`);
for (const [relPath, key, scale3x, cropSide] of SPRITES) {
  const fullPath = path.join(ORG_DIR, relPath);
  const sprite = await loadSprite(fullPath, scale3x, cropSide);
  out[key] = sprite;
  const nonNull = sprite.p.filter((x) => x !== null).length;
  totalPixels += sprite.p.length;
  totalNonNull += nonNull;
  console.log(`  ${key.padEnd(28)} ${sprite.w}×${sprite.h}  非透明像素 ${nonNull}/${sprite.p.length}`);
}

// ============ 写出 JS ============
const banner = `// AUTO-GENERATED from assets-raw/super-mario/organized/
// 不要手动编辑 — 用 png-to-pixels.js 重新生成
// 格式: { w, h, p: [null|'#rrggbb', ...] } 按行优先
// 共 ${SPRITES.length} 个 sprite (mario 30 + enemies 10 + items 8 + tiles 6 + effects 3)

`;

const body = `export const SPRITES = ${JSON.stringify(out)};\n`;

fs.writeFileSync(OUT_FILE, banner + body);

const fileSize = fs.statSync(OUT_FILE).size;
console.log(`\n✓ 写出 ${OUT_FILE}`);
console.log(`  文件大小: ${(fileSize / 1024).toFixed(1)} KB`);
console.log(`  总像素: ${totalPixels} / 非透明: ${totalNonNull} (${((totalNonNull/totalPixels)*100).toFixed(1)}%)`);
