// 把 BlockTileSheet.png 几个关键 ID 切出来放大对比
import sharp from 'sharp';
const PAD = 1, CELL = 16, COLS = 48;

const items = [
  // [name, id, hCells]
  ['291 (debris)', 291, 1],
  ['656 (coin0)', 656, 1],
  ['657 (coin1)', 657, 1],
  ['658 (coin2)', 658, 1],
  ['659 (coin3)', 659, 1],
  ['672 (star)', 672, 1],
  // 试试附近的 ID 找出对的
  ['648', 648, 1],
  ['649', 649, 1],
  ['650', 650, 1],
  ['651', 651, 1],
  ['664', 664, 1],
  ['665', 665, 1],
  ['666', 666, 1],
  ['667', 667, 1],
  ['672', 672, 1],
  ['673', 673, 1],
  ['674', 674, 1],
  ['675', 675, 1],
  ['676', 676, 1],
  ['680', 680, 1],
  ['681', 681, 1],
  ['682', 682, 1],
  ['683', 683, 1],
  ['684', 684, 1],
];
const SCALE = 8;
const composites = [];
const W_CELL = 16 * SCALE + 16;
const H_CELL = 16 * SCALE + 24;
const COLS_GRID = 8;
for (let i = 0; i < items.length; i++) {
  const [name, id, h] = items[i];
  const col = id % COLS;
  const row = Math.floor(id / COLS);
  const buf = await sharp('source-ref-3/res/sprites/blocks/BlockTileSheet.png')
    .extract({ left: PAD + col * CELL, top: PAD + row * CELL, width: CELL, height: CELL * h })
    .resize(CELL * SCALE, CELL * SCALE * h, { kernel: 'nearest' })
    .png().toBuffer();
  const r = Math.floor(i / COLS_GRID);
  const c = i % COLS_GRID;
  composites.push({ input: buf, left: 8 + c * W_CELL, top: 8 + r * H_CELL });
}
const W = 8 + COLS_GRID * W_CELL;
const H = 8 + Math.ceil(items.length / COLS_GRID) * H_CELL;
await sharp({ create: { width: W, height: H, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 1 } } })
  .composite(composites).png()
  .toFile('_block_grid.png');
console.log('✓ _block_grid.png');
