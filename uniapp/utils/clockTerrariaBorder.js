// ============================================================
// Terraria logo 风格的时钟"草膨胀边框"
// 移植自 esp32-firmware/terraria-clock-preview.js renderClock 的 PAD=2 切比雪夫距离算法
// 输入: 字像素 mask Set<"x,y">, 输出: Map<"x,y", "#hex"> 包含字本体 + 内圈 + 外圈
// ============================================================

const PAD = 2;

// 把"字像素 mask + 字色"转成"带草膨胀边框的像素 Map"
//   maskPixels: Set<"x,y"> 字本体覆盖的屏坐标
//   textColor: '#d9cd82' (默认麦色)
//   innerColor: '#63971f' (距离 1 内圈)
//   outerColor: '#8FD71D' (距离 2 外圈)
export function applyTerrariaClockBorder(maskPixels, textColor, innerColor, outerColor) {
  const result = new Map();
  if (!maskPixels || maskPixels.size === 0) return result;

  // 1) 找 mask 的 bbox, 加 PAD 圈作为搜索范围
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const key of maskPixels) {
    const [x, y] = key.split(',').map(Number);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const x0 = Math.max(0, minX - PAD);
  const y0 = Math.max(0, minY - PAD);
  const x1 = Math.min(63, maxX + PAD);
  const y1 = Math.min(63, maxY + PAD);

  // 2) 对范围内每个非 mask 像素, 计算到最近 mask 的切比雪夫距离
  //    距离 1 = 内圈, 距离 2 = 外圈, 大于 2 不画
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const key = `${x},${y}`;
      if (maskPixels.has(key)) {
        // mask 内 = 字本体, 用 textColor
        result.set(key, textColor);
        continue;
      }
      // 外: 找最近 mask 距离
      let minD = 99;
      for (let dy = -PAD; dy <= PAD; dy++) {
        for (let dx = -PAD; dx <= PAD; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= 64 || ny < 0 || ny >= 64) continue;
          if (maskPixels.has(`${nx},${ny}`)) {
            const d = Math.max(Math.abs(dx), Math.abs(dy));
            if (d < minD) minD = d;
          }
        }
      }
      if (minD === 1) result.set(key, innerColor);
      else if (minD === 2) result.set(key, outerColor);
      // 距离 > 2 不画 (留空, 让背景透出)
    }
  }

  return result;
}
