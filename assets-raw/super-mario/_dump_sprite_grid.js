// 把 sprite.png 全部 5x5 网格切出, 拼成预览图标记编号
import sharp from 'sharp';
const SCALE = 4;
const CELL = 48;
const ROWS = 5, COLS = 5;
const composites = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    const buf = await sharp('source-ref/src/media/sprite.png')
      .extract({ left: c * CELL, top: r * CELL, width: CELL, height: CELL })
      .resize(CELL * SCALE, CELL * SCALE, { kernel: 'nearest' })
      .png().toBuffer();
    composites.push({
      input: buf,
      left: 8 + c * (CELL * SCALE + 12),
      top: 8 + r * (CELL * SCALE + 24),
    });
  }
}
const W = 8 + COLS * (CELL * SCALE + 12);
const H = 8 + ROWS * (CELL * SCALE + 24);
await sharp({ create: { width: W, height: H, channels: 4, background: { r: 30, g: 30, b: 30, alpha: 1 } } })
  .composite(composites).png()
  .toFile('_sprite_grid.png');
console.log(`✓ _sprite_grid.png  ${W}×${H}  5×5 = 25 个 cell, 每个左上角对应 (col=0..4, row=0..4)`);
