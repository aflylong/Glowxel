// ============================================================
// Terraria logo 椋庢牸鐨勬椂閽?鑽夎啫鑳€杈规""
// 绉绘鑷?esp32-firmware/terraria-clock-preview.js renderClock 鐨?PAD=2 鍒囨瘮闆か璺濈绠楁硶
// 杈撳叆: 瀛楀儚绱?mask Set<"x,y">, 杈撳嚭: Map<"x,y", "#hex"> 鍖呭惈瀛楁湰浣?+ 鍐呭湀 + 澶栧湀
// ============================================================

const PAD = 2;

// 鎶?瀛楀儚绱?mask + 瀛楄壊"杞垚"甯﹁崏鑶ㄨ儉杈规鐨勫儚绱?Map""
//   maskPixels: Set<"x,y"> 瀛楁湰浣撹鐩栫殑灞忓潗鏍?
//   textColor: '#d9cd82' (榛樿楹﹁壊)
//   innerColor: '#63971f' (璺濈 1 鍐呭湀)
//   outerColor: '#8FD71D' (璺濈 2 澶栧湀)
export function applyTerrariaClockBorder(maskPixels, textColor, innerColor, outerColor) {
  const result = new Map();
  if (!maskPixels || maskPixels.size === 0) return result;

  // 1) 鎵?mask 鐨?bbox, 鍔?PAD 鍦堜綔涓烘悳绱㈣寖鍥?
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

  // 2) 瀵硅寖鍥村唴姣忎釜闈?mask 鍍忕礌, 璁＄畻鍒版渶杩?mask 鐨勫垏姣旈洩澶窛绂?
  //    璺濈 1 = 鍐呭湀, 璺濈 2 = 澶栧湀, 澶т簬 2 涓嶇敾
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const key = `${x},${y}`;
      if (maskPixels.has(key)) {
        // mask 鍐?= 瀛楁湰浣? 鐢?textColor
        result.set(key, textColor);
        continue;
      }
      // 澶? 鎵炬渶杩?mask 璺濈
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
      // 璺濈 > 2 涓嶇敾 (鐣欑┖, 璁╄儗鏅€忓嚭)
    }
  }

  return result;
}
