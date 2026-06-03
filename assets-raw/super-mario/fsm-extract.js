/**
 * 从 FullScreenMario sprites.js 提取所有需要的 sprite, 输出 superMarioSprites.js
 *
 * FullScreenMario 编码格式 (PixelRendr):
 *   - paletteDefault[23 个 RGBA] (透明 0, 灰阶 1-4, 红/棕 5-11, 绿 12-14/21, 蓝 15-20, 粉 22)
 *   - digitsizeDefault = floor(log10(23))+1 = 2
 *   - sprite 字符串: "p[A,B,C,D]<像素串>" 其中 [A,B,C,D] 是局部 palette → 全局 idx
 *     - 局部 digitsize = floor(log10(4))+1 = 1, 即每像素 1 位数
 *   - "x<color><N>," = 重复 color N 次 (color 用当前 digitsize 位数)
 *   - 普通字符 = 直接读 digitsize 位作为 color
 *   - "filter": ["palette", {"06": "02", ...}] = 颜色替换 (Underworld/Castle/Star)
 *   - "same": ["路径"] = 引用别处的 sprite + 自己的 filter
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const FSM_DIR = path.join(__dirname, 'source-ref-fsm', 'Source', 'settings');
const OUT_FILE = path.join(__dirname, '..', '..', 'website', 'src', 'utils', 'superMarioSprites.js');

// ==================== 加载 sprites.js ====================
// 它是 `FullScreenMario.FullScreenMario.settings.sprites = {...};`
// 用 vm 跑一下取出对象
const spritesCode = fs.readFileSync(path.join(FSM_DIR, 'sprites.js'), 'utf-8');
const sandbox = { FullScreenMario: { FullScreenMario: { settings: {} } } };
const vm = await import('node:vm');
vm.createContext(sandbox);
vm.runInContext(spritesCode, sandbox);
const SETTINGS = sandbox.FullScreenMario.FullScreenMario.settings.sprites;
const PALETTE = SETTINGS.paletteDefault;
const FILTERS = SETTINGS.filters;
const LIBRARY = SETTINGS.library;

// ==================== PixelRendr 解码器 ====================
function digitSize(n) {
  return Math.floor(Math.log(n) / Math.LN10) + 1;
}
function makeDigit(n, size) {
  return String(n).padStart(size, '0');
}

const D_DEFAULT = digitSize(PALETTE.length); // = 2

/**
 * spriteUnravel: 把 "p[...]xN K," 等编码展开成"全局 palette idx"的纯数字串
 * 输出每个像素 D_DEFAULT 位
 */
function spriteUnravel(colors) {
  let paletteRef = {};
  // 默认全 palette: idx → 自身
  for (let i = 0; i < PALETTE.length; i++) {
    paletteRef[makeDigit(i, D_DEFAULT)] = makeDigit(i, D_DEFAULT);
  }
  let digitSizeNow = D_DEFAULT;
  let output = '';
  let loc = 0;
  const clength = colors.length;

  while (loc < clength) {
    const c = colors[loc];
    if (c === 'x') {
      // x<color><N>,
      loc++;
      const colorRef = colors.slice(loc, loc + digitSizeNow);
      loc += digitSizeNow;
      const commaIdx = colors.indexOf(',', loc);
      const rep = Number(colors.slice(loc, commaIdx));
      const mapped = paletteRef[colorRef];
      if (mapped === undefined) throw new Error(`unknown palette ref ${colorRef}`);
      const piece = makeDigit(mapped, D_DEFAULT);
      for (let i = 0; i < rep; i++) output += piece;
      loc = commaIdx + 1;
    } else if (c === 'p') {
      loc++;
      if (colors[loc] === '[') {
        const close = colors.indexOf(']', loc);
        const list = colors.slice(loc + 1, close).split(',');
        // 局部 palette: 局部 idx (0..N-1) → 全局 idx
        paletteRef = {};
        for (let i = 0; i < list.length; i++) {
          paletteRef[makeDigit(i, 1)] = makeDigit(Number(list[i]), digitSize(list.length));
        }
        digitSizeNow = digitSize(list.length); // = 1 if 4 colors
        loc = close + 1;
      } else {
        // 回到默认 palette
        paletteRef = {};
        for (let i = 0; i < PALETTE.length; i++) {
          paletteRef[makeDigit(i, D_DEFAULT)] = makeDigit(i, D_DEFAULT);
        }
        digitSizeNow = D_DEFAULT;
      }
    } else {
      // 普通像素
      const colorRef = colors.slice(loc, loc + digitSizeNow);
      loc += digitSizeNow;
      const mapped = paletteRef[colorRef];
      if (mapped === undefined) throw new Error(`unknown palette ref ${colorRef} at loc=${loc}`);
      output += makeDigit(mapped, D_DEFAULT);
    }
  }
  return output;
}

/**
 * spriteApplyFilter: 颜色替换 ("06"→"02" 即把全局 palette idx 6 替换为 2)
 */
function spriteApplyFilter(unraveledStr, filterName) {
  if (!filterName) return unraveledStr;
  const f = FILTERS[filterName];
  if (!f || f[0] !== 'palette') return unraveledStr;
  const swap = f[1];
  // 按 D_DEFAULT 切片再替换
  const re = new RegExp(`.{${D_DEFAULT}}`, 'g');
  return unraveledStr.replace(re, (m) => swap[m] !== undefined ? makeDigit(Number(swap[m]), D_DEFAULT) : m);
}

/**
 * 把 unraveled idx 串转成像素表 (每像素 → null|"#rrggbb")
 */
function pixelsFromIdx(unraveledStr) {
  const re = new RegExp(`.{${D_DEFAULT}}`, 'g');
  const idxs = unraveledStr.match(re);
  return idxs.map((s) => {
    const idx = Number(s);
    const [r, g, b, a] = PALETTE[idx];
    if (a === 0) return null;
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
  });
}

// ==================== 路径解析 + same/filter 处理 ====================
function followPath(path) {
  let cur = LIBRARY;
  for (const k of path) {
    if (cur[k] === undefined) {
      throw new Error(`路径找不到: ${path.join('.')} (在 ${k})`);
    }
    cur = cur[k];
  }
  return cur;
}

/**
 * 递归解析 sprite. 输入可能是:
 *   - 字符串: 直接是 sprite 编码
 *   - ["same", path]: 同 path 的 sprite (递归)
 *   - ["filter", path, filterName]: path 的 sprite + filter
 *   - ["multiple", "vertical"|"horizontal", {top, middle, bottom}]: 拼接多 sprite (Pipe 用)
 */
function resolveSprite(node, ownFilter = null) {
  if (typeof node === 'string') {
    let unraveled = spriteUnravel(node);
    if (ownFilter) unraveled = spriteApplyFilter(unraveled, ownFilter);
    return unraveled; // 返回 unraveled idx 串
  }
  if (Array.isArray(node)) {
    const cmd = node[0];
    if (cmd === 'same') {
      const target = followPath(node[1]);
      return resolveSprite(target, ownFilter);
    }
    if (cmd === 'filter') {
      const target = followPath(node[1]);
      const filterName = node[2];
      // filter 应用到目标 sprite, 自身 ownFilter 也叠加 (但 FSM 似乎没有嵌套, 简化)
      return resolveSprite(target, filterName);
    }
    if (cmd === 'multiple') {
      // 由调用方专门处理 (返回原始结构)
      return { multiple: true, direction: node[1], parts: node[2] };
    }
    throw new Error(`未知命令: ${cmd}`);
  }
  throw new Error(`不能解析: ${typeof node}`);
}

// ==================== 提取清单 ====================
// 每行: [输出 key, library 路径, 宽度(像素)]
// 高度 = 像素总数 / 宽度
const EXTRACT = [
  // ── Mario 小马 (16×16) ──
  // small 路径: Player.normal.normal.normal.<...>
  ['mario.small.right.idle',   ['Character', 'Player', 'normal', 'normal', 'normal', 'normal'],     16],
  ['mario.small.right.walk1',  ['Character', 'Player', 'normal', 'normal', 'normal', 'running', 'normal', 'normal'], 16],
  ['mario.small.right.walk2',  ['Character', 'Player', 'normal', 'normal', 'normal', 'running', 'normal', 'two'], 16],
  ['mario.small.right.walk3',  ['Character', 'Player', 'normal', 'normal', 'normal', 'running', 'normal', 'three'], 16],
  ['mario.small.right.jump',   ['Character', 'Player', 'normal', 'normal', 'jumping'],   16],
  ['mario.small.right.skid',   ['Character', 'Player', 'normal', 'normal', 'normal', 'running', 'skidding'], 16],

  // ── Mario 大马 (16×32) ──
  // large 路径: Player.normal.large.normal.<...>  (large 下面没有第二层 'normal', 直接 large.normal.normal)
  ['mario.super.right.idle',   ['Character', 'Player', 'normal', 'large', 'normal', 'normal'], 16],
  ['mario.super.right.walk1',  ['Character', 'Player', 'normal', 'large', 'normal', 'running', 'normal', 'normal'], 16],
  ['mario.super.right.walk2',  ['Character', 'Player', 'normal', 'large', 'normal', 'running', 'normal', 'two'], 16],
  ['mario.super.right.walk3',  ['Character', 'Player', 'normal', 'large', 'normal', 'running', 'normal', 'three'], 16],
  ['mario.super.right.jump',   ['Character', 'Player', 'normal', 'large', 'jumping'],   16],
  ['mario.super.right.skid',   ['Character', 'Player', 'normal', 'large', 'normal', 'running', 'skidding'], 16],
  ['mario.super.right.crouch', ['Character', 'Player', 'normal', 'large', 'normal', 'crouching'], 16],

  // ── Mario 火马 (16×32) ──
  // fiery 路径: Player.normal.fiery.normal.<...>
  ['mario.fire.right.idle',    ['Character', 'Player', 'normal', 'fiery', 'normal', 'normal'], 16],
  ['mario.fire.right.walk1',   ['Character', 'Player', 'normal', 'fiery', 'normal', 'running', 'normal', 'normal'], 16],
  ['mario.fire.right.walk2',   ['Character', 'Player', 'normal', 'fiery', 'normal', 'running', 'normal', 'two'], 16],
  ['mario.fire.right.walk3',   ['Character', 'Player', 'normal', 'fiery', 'normal', 'running', 'normal', 'three'], 16],
  ['mario.fire.right.jump',    ['Character', 'Player', 'normal', 'fiery', 'jumping', 'normal'], 16],
  ['mario.fire.right.skid',    ['Character', 'Player', 'normal', 'fiery', 'normal', 'running', 'skidding'], 16],
  ['mario.fire.right.crouch',  ['Character', 'Player', 'normal', 'fiery', 'normal', 'crouching'], 16],

  // ── 死亡帧 ──
  ['mario.dead',               ['Character', 'Player', 'dead'], 14], // 死亡帧 14 像素宽 (210/14=15)

  // ── 敌人 ──
  ['enemy.goomba.0',           ['Character', 'Goomba', 'normal'], 16],
  ['enemy.koopa.walk.0',       ['Character', 'Koopa', 'normal', 'normal', 'normal', 'normal'], 16],
  ['enemy.koopa.walk.1',       ['Character', 'Koopa', 'normal', 'normal', 'normal', 'two'], 16],
  ['enemy.koopa.fly.0',        ['Character', 'Koopa', 'normal', 'normal', 'flying', 'normal'], 16],
  ['enemy.koopa.fly.1',        ['Character', 'Koopa', 'normal', 'normal', 'flying', 'two'], 16],
  ['enemy.piranha.0',          ['Character', 'Piranha', 'normal', 'normal'], 16],
  ['enemy.piranha.1',          ['Character', 'Piranha', 'normal', 'two'], 16],
  ['enemy.shell',              ['Character', 'Shell', 'normal', 'normal', 'normal'], 16],

  // ── 道具 ──
  ['item.mushroom',            ['Character', 'Mushroom'], 16],
  ['item.oneup_mushroom',      ['Character', 'Mushroom1Up'], 16],
  ['item.fire_flower.0',       ['Character', 'FireFlower', 'normal', 'normal'], 16],
  ['item.fire_flower.1',       ['Character', 'FireFlower', 'normal', 'two'], 16],
  ['item.fire_flower.2',       ['Character', 'FireFlower', 'normal', 'three'], 16],
  ['item.fire_flower.3',       ['Character', 'FireFlower', 'normal', 'four'], 16],
  ['item.star.0',              ['Character', 'Star', 'normal'], 16],
  ['item.star.1',              ['Character', 'Star', 'two'], 16],
  ['item.star.2',              ['Character', 'Star', 'three'], 16],
  ['item.star.3',              ['Character', 'Star', 'four'], 16],
  // Coin 静止帧 + 动画旋转帧 (NES 原版 coin 是 10×14 像素)
  ['item.coin.0',              ['Character', 'Coin', 'normal', 'normal', 'normal'], 10],
  ['item.coin.1',              ['Character', 'Coin', 'normal', 'normal', 'two'], 10],
  ['item.coin.2',              ['Character', 'Coin', 'normal', 'normal', 'three'], 10],
  ['item.coin.anim.0',         ['Character', 'Coin', 'anim', 'normal'], 10],
  ['item.coin.anim.1',         ['Character', 'Coin', 'anim', 'anim2'], 10],
  ['item.coin.anim.2',         ['Character', 'Coin', 'anim', 'anim3'], 10],
  ['item.coin.anim.3',         ['Character', 'Coin', 'anim', 'anim4'], 10],

  // ── Tile ──
  ['tile.brick',               ['Solid', 'Brick', 'normal', 'normal'], 16],
  ['tile.block.0',             ['Solid', 'Block', 'normal', 'normal', 'normal'], 16],
  ['tile.block.1',             ['Solid', 'Block', 'normal', 'normal', 'two'], 16],
  ['tile.block.2',             ['Solid', 'Block', 'normal', 'normal', 'three'], 16],
  ['tile.block.used',          ['Solid', 'Block', 'normal', 'used'], 16],
  ['tile.floor',               ['Solid', 'Floor', 'normal'], 8, 8],   // FSM 存 8×32 (4 帧/纹理变体), 只取首 8×8 单 tile
  // Pipe 用 multiple top+middle 拼成完整管道 (NES 原版 32 宽)
  ['tile.pipe',                ['Solid', 'Pipe', 'normal'], 32],

  // ── 特效 ──
  ['effect.fireball.0',        ['Character', 'Fireball', 'normal'], 8],
  ['effect.fireball.1',        ['Character', 'Fireball', 'two'], 8],
  ['effect.fireball.2',        ['Character', 'Fireball', 'three'], 8],
  ['effect.fireball.3',        ['Character', 'Fireball', 'four'], 8],
  ['effect.brick_shard',       ['Character', 'BrickShard', 'normal'], 4, 4],  // FSM 存 4×16 (4 帧旋转), 屏保只取首 4×4 单帧
];

// ==================== 主流程 ====================
const SPRITES = {};
let succ = 0, fail = 0;
for (const [key, libPath, width, maxHeight] of EXTRACT) {
  try {
    const node = followPath(libPath);
    const result = resolveSprite(node);
    let pixels, height;

    if (result && result.multiple) {
      // multiple: top + middle (vertical) 拼成完整 sprite. 取 top + middle 各 1 节
      const topUnraveled = resolveSprite(result.parts.top);
      const midUnraveled = resolveSprite(result.parts.middle);
      const topPixels = pixelsFromIdx(topUnraveled);
      const midPixels = pixelsFromIdx(midUnraveled);
      // 只能拼 top + 1 节 middle (高度 = top高 + mid高)
      pixels = [...topPixels, ...midPixels];
      const topH = topPixels.length / width;
      const midH = midPixels.length / width;
      if (!Number.isInteger(topH) || !Number.isInteger(midH)) {
        throw new Error(`multiple top/mid 像素数 ${topPixels.length}/${midPixels.length} 不能被宽 ${width} 整除`);
      }
      height = topH + midH;
    } else {
      pixels = pixelsFromIdx(result);
      if (pixels.length % width !== 0) {
        throw new Error(`像素数 ${pixels.length} 不能被宽 ${width} 整除`);
      }
      height = pixels.length / width;
    }

    // 截断到指定高度 (供 floor / brick_shard 这种 多帧合一存储 的对象只取首帧)
    if (maxHeight && maxHeight < height) {
      pixels = pixels.slice(0, width * maxHeight);
      height = maxHeight;
    }

    SPRITES[key] = { w: width, h: height, p: pixels };
    const nonNull = pixels.filter((x) => x !== null).length;
    console.log(`  ✓ ${key.padEnd(28)} ${width}×${height}  非透明 ${nonNull}/${pixels.length}`);
    succ++;
  } catch (e) {
    console.log(`  ✗ ${key.padEnd(28)} ERROR: ${e.message}`);
    fail++;
  }
}

console.log(`\n成功 ${succ} / 失败 ${fail}`);

// ==================== 写出 JS ====================
if (succ > 0) {
  const banner = `// AUTO-GENERATED from FullScreenMario (jaggedsoft/FullScreenMario)
// 不要手动编辑 — 用 fsm-extract.js 重新生成
// 格式: { w, h, p: [null|'#rrggbb', ...] } 按行优先
// 来源: source-ref-fsm/Source/settings/sprites.js (PixelRendr 编码)
// 共 ${succ} 个 sprite

`;
  const body = `export const SPRITES = ${JSON.stringify(SPRITES)};\n`;
  fs.writeFileSync(OUT_FILE, banner + body);
  const fileSize = fs.statSync(OUT_FILE).size;
  console.log(`\n✓ 写出 ${OUT_FILE}  (${(fileSize / 1024).toFixed(1)} KB)`);
}
