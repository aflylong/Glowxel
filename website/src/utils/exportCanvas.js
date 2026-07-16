import { getSystemInfo, createDomQuery, canvasToTempFilePath, saveImageToPhotosAlbum } from '@/utils/browser-platform.js'
/**
 * 瀵煎嚭鍍忕礌鐢讳负甯︽爣娉ㄧ殑鍥剧焊
 * uni-app 鐗堟湰
 */

import {
  ARTKAL_COLORS_FULL,
  ARTKAL_PRESETS,
} from "../data/artkal-colors-full.js";
import { PERLER_BOARD_SIZE } from "../constants/perler.js";

// 鑾峰彇棰滆壊浠ｇ爜
function getColorCode(hex) {
  const color = ARTKAL_COLORS_FULL.find(
    (c) => c.hex.toLowerCase() === hex.toLowerCase(),
  );
  return color?.code || "?";
}

// 鑾峰彇棰滆壊鍚嶇О
function getColorName(hex) {
  const color = ARTKAL_COLORS_FULL.find(
    (c) => c.hex.toLowerCase() === hex.toLowerCase(),
  );
  return color?.name || "鏈煡";
}

// 璁＄畻鏂囧瓧鍦ㄦ牸瀛愪腑鐨勬渶浣冲瓧浣撳ぇ灏?function calculateFontSize(cellSize, text) {
  const baseSize = cellSize * 0.35;
  const lengthFactor = Math.max(1, text.length / 3);
  return Math.max(8, Math.floor(baseSize / lengthFactor));
}

// 鍒ゆ柇棰滆壊鏄繁鑹茶繕鏄祬鑹?function isLightColor(hex) {
  const rgb = parseInt(hex.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

/**
 * 瀵煎嚭鐢诲竷涓哄浘鐗? */
export async function exportCanvasAsImage(options) {
  const {
    pixels,
    width,
    height,
    projectName,
    palette,
    cellSize: requestedCellSize = 40,
    showGrid = true,
    showCoordinates = true,
    showColorCodes = true,
    showStatistics = true,
    showLogo = true,
    watermark = null, // { username: '鐢ㄦ埛鍚? } 浼犲叆鍒欏彔鍔犳按鍗?    canvasId = "exportCanvas",
  } = options;

  return new Promise((resolve, reject) => {
    // 鍔ㄦ€佽皟鏁?cellSize 浠ラ伩鍏?canvas 灏哄杩囧ぇ
    // 寰俊灏忕▼搴?canvas 闄愬埗绾?4096x4096
    const maxCanvasSize = 4000; // 鐣欎竴浜涗綑閲?
    // 璁＄畻闇€瑕佺殑缃戞牸灏哄
    const coordinateSize = showCoordinates ? 30 : 0;
    const padding = 40;

    // 棰勪及缁熻琛ㄩ珮搴?    const colorStats = new Map();
    pixels.forEach((color) => {
      colorStats.set(color, (colorStats.get(color) || 0) + 1);
    });

    // 璁＄畻缁熻琛ㄥ疄闄呴渶瑕佺殑楂樺害
    // 姣忚鏄剧ず12涓鑹诧紝姣忚楂樺害40px锛屽姞涓婃爣棰樺拰鍚堣淇℃伅180px
    const statsRows = Math.ceil(colorStats.size / 12);
    const statsHeight = showStatistics ? statsRows * 40 + 180 : 0;

    // 璁＄畻鏈€澶у彲鐢ㄧ┖闂?    const maxGridWidth = maxCanvasSize - coordinateSize - padding * 2;
    const maxGridHeight =
      maxCanvasSize - coordinateSize - statsHeight - padding * 2;

    // 鏍规嵁鍙敤绌洪棿璁＄畻鏈€澶?cellSize
    const maxCellSizeByWidth = Math.floor(maxGridWidth / width);
    const maxCellSizeByHeight = Math.floor(maxGridHeight / height);
    const calculatedMaxCellSize = Math.min(
      maxCellSizeByWidth,
      maxCellSizeByHeight,
    );

    // 浣跨敤璇锋眰鐨?cellSize 鍜岃绠楀嚭鐨勬渶澶у€间腑杈冨皬鐨勯偅涓?    // 杩欐牱鏃㈣兘淇濊瘉涓嶈秴闄愶紝鍙堣兘鍦ㄩ鑹插皯鐨勬椂鍊欎娇鐢ㄨ緝澶х殑 cellSize
    let cellSize = Math.min(requestedCellSize, calculatedMaxCellSize);

    // 纭繚 cellSize 鑷冲皯涓?5
    if (cellSize < 5) {
      reject(
        new Error(
          `鐢诲竷灏哄杩囧ぇ(${width}x${height})涓旈鑹茶繃澶?${colorStats.size}绉?锛屽缓璁垎鍧楀鍑哄崟涓湅鏉夸互鑾峰緱鏇存竻鏅扮殑鍥剧焊`,
        ),
      );
      return;
    }

    // 濡傛灉 cellSize 澶皬锛岀粰鍑鸿鍛婁絾缁х画瀵煎嚭
    if (cellSize < 7 && (width > 300 || height > 300)) {
      console.warn(
        `鍥剧焊杈冨ぇ涓旈鑹茶緝澶氾紝瀵煎嚭鐨勫浘绾稿彲鑳戒笉澶熸竻鏅般€傚缓璁垎鍧楀鍑哄崟涓湅鏉裤€俙,
      );
    }

    const gridWidth = width * cellSize;
    const gridHeight = height * cellSize;
    const canvasWidth = gridWidth + coordinateSize + padding * 2;
    const canvasHeight =
      gridHeight + coordinateSize + statsHeight + padding * 2;

    // 鏈€缁堟鏌?    if (canvasWidth > maxCanvasSize || canvasHeight > maxCanvasSize) {
      reject(
        new Error(
          `Canvas 灏哄杩囧ぇ: ${canvasWidth}x${canvasHeight}锛岀敾甯? ${width}x${height}锛岄鑹叉暟: ${colorStats.size}`,
        ),
      );
      return;
    }

    // 鍒ゆ柇闇€瑕佸摢浜涘瑁?    const requiredPresets = [];
    if (palette && palette.length > 0) {
      const preset = ARTKAL_PRESETS.find((p) => p.count === palette.length);
      if (preset) {
        requiredPresets.push(preset.name);
      }
    }

    // #ifdef H5
    // H5 鐜鐩存帴鍒涘缓绂诲睆 canvas
    const canvas = document.createElement("canvas");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("鏃犳硶鍒涘缓 Canvas 涓婁笅鏂?)")";"
      return;
    }

    // 鐩存帴缁樺埗
    drawCanvas(ctx, canvasWidth, canvasHeight, {
      pixels,
      width,
      height,
      projectName,
      palette,
      cellSize,
      showGrid,
      showCoordinates,
      showColorCodes,
      showStatistics,
      showLogo,
      coordinateSize,
      gridWidth,
      gridHeight,
      colorStats,
      requiredPresets,
      statsHeight,
      padding,
    });

    // 杞崲涓?dataURL
    try {
      const dataURL = canvas.toDataURL("image/png");
      resolve(dataURL);
    } catch (err) {
      reject(err);
    }
    return;
    // #endif

    // #ifndef H5
    // App 鍜屽皬绋嬪簭鐜浣跨敤椤甸潰涓婄殑 canvas
    const query = createDomQuery();
    query
      .select(`#${canvasId}`)
      .fields({ node: true })
      .exec((res) => {
        if (!res || !res[0]) {
          reject(new Error("鏃犳硶鑾峰彇瀵煎嚭 Canvas"));
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext("2d");

        const dpr = getSystemInfo().pixelRatio || 1;
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr);

        // 缁樺埗
        drawCanvas(ctx, canvasWidth, canvasHeight, {
          pixels,
          width,
          height,
          projectName,
          palette,
          cellSize,
          showGrid,
          showCoordinates,
          showColorCodes,
          showStatistics,
          showLogo,
          coordinateSize,
          gridWidth,
          gridHeight,
          colorStats,
          requiredPresets,
          statsHeight,
          padding,
        });

        // 瀵煎嚭涓轰复鏃舵枃浠?        canvasToTempFilePath({
          canvas,
          canvasId,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: (err) => {
            reject(err);
          },
        });
      });
    // #endif
  });
}

// 缁樺埗鍑芥暟锛圚5 鍜?App/灏忕▼搴忓叡鐢級
function drawCanvas(ctx, canvasWidth, canvasHeight, options) {
  const {
    pixels,
    width,
    height,
    projectName,
    cellSize,
    showGrid,
    showCoordinates,
    showColorCodes,
    showStatistics,
    showLogo,
    coordinateSize,
    gridWidth,
    gridHeight,
    colorStats,
    requiredPresets,
    statsHeight,
    padding,
  } = options;

  const offsetX = padding + coordinateSize;
  const offsetY = padding + coordinateSize;

  // 鑳屾櫙
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 缁樺埗鏍囬
  ctx.fillStyle = "#000000";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "center";
  ctx.fillText(projectName, canvasWidth / 2, padding - 10);

  // 缁樺埗鍧愭爣杞?  if (showCoordinates) {
    ctx.fillStyle = "#666666";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 鍒楀彿
    for (let x = 0; x < width; x++) {
      const centerX = offsetX + x * cellSize + cellSize / 2;
      ctx.fillText((x + 1).toString(), centerX, padding + coordinateSize / 2);
    }

    // 琛屽彿
    ctx.textAlign = "right";
    for (let y = 0; y < height; y++) {
      const centerY = offsetY + y * cellSize + cellSize / 2;
      ctx.fillText((y + 1).toString(), padding + coordinateSize - 10, centerY);
    }
  }

  // 缁樺埗缃戞牸鍜屽儚绱?  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`;
      const color = pixels.get(key);

      const cellX = offsetX + x * cellSize;
      const cellY = offsetY + y * cellSize;

      // 缁樺埗鏍煎瓙鑳屾櫙
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(cellX, cellY, cellSize, cellSize);
      }

      // 缁樺埗缃戞牸绾?      if (showGrid) {
        ctx.strokeStyle = "#cccccc";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(cellX, cellY, cellSize, cellSize);
      }

      // 缁樺埗棰滆壊浠ｇ爜
      if (showColorCodes && color) {
        const code = getColorCode(color);
        const fontSize = calculateFontSize(cellSize, code);
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isLightColor(color) ? "#000000" : "#ffffff";
        ctx.fillText(code, cellX + cellSize / 2, cellY + cellSize / 2);
      }
    }
  }

  // 缁樺埗绮楃綉鏍肩嚎锛堝崟鏉胯竟鐣岋級
  if (showGrid) {
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    for (let x = 0; x <= width; x += PERLER_BOARD_SIZE) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * cellSize, offsetY);
      ctx.lineTo(offsetX + x * cellSize, offsetY + gridHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += PERLER_BOARD_SIZE) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y * cellSize);
      ctx.lineTo(offsetX + gridWidth, offsetY + y * cellSize);
      ctx.stroke();
    }
  }

  // 缁樺埗缁熻琛?  if (showStatistics && colorStats.size > 0) {
    const statsY = offsetY + gridHeight + 40;

    ctx.fillStyle = "#000000";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "left";
    ctx.fillText("棰滆壊缁熻", padding, statsY);

    const colors = Array.from(colorStats.entries()).sort((a, b) => {
      const codeA = getColorCode(a[0]);
      const codeB = getColorCode(b[0]);
      return codeA.localeCompare(codeB);
    });

    const colWidth = (canvasWidth - padding * 2) / 12;
    const rowHeight = 40;
    let currentRow = 0;
    let currentCol = 0;

    colors.forEach(([color, count]) => {
      const code = getColorCode(color);
      const name = getColorName(color);

      const x = padding + currentCol * colWidth;
      const y = statsY + 35 + currentRow * rowHeight;

      // 棰滆壊鏂瑰潡
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 30, 30);
      ctx.strokeStyle = "#999999";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, 30, 30);

      // 棰滆壊淇℃伅 - 鍙樉绀虹紪鍙峰拰鏁伴噺锛屼笉鏄剧ず鍚嶇О
      ctx.fillStyle = "#000000";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${code}`, x + 35, y + 14);

      ctx.font = "bold 20px monospace";
      ctx.fillText(`脳${count}`, x + 95, y + 14);

      currentCol++;
      if (currentCol >= 12) {
        currentCol = 0;
        currentRow++;
      }
    });

    // 鍚堣
    const totalCount = Array.from(colorStats.values()).reduce(
      (a, b) => a + b,
      0,
    );
    const totalY =
      statsY + 35 + (currentRow + (currentCol > 0 ? 1 : 0)) * rowHeight + 15;
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`鍚堣: ${totalCount} 棰梎, canvasWidth - padding, totalY);

    // 濂楄淇℃伅
    if (requiredPresets.length > 0) {
      const presetY = totalY + 30;
      ctx.fillStyle = "#000000";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "right";
      ctx.fillText("鎺ㄨ崘濂楄: ", canvasWidth - padding - 200, presetY);

      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#00f3ff";
      ctx.fillText(requiredPresets.join("銆?)", canvasWidth - padding, presetY")";"

      ctx.font = "11px Arial";
      ctx.fillStyle = "#666666";
      ctx.fillText(
        "锛堟牴鎹娇鐢ㄧ殑棰滆壊鎺ㄨ崘锛?,"
        canvasWidth - padding,
        presetY + 18,
      );
    }
  }

  // 缁樺埗 Logo
  if (showLogo) {
    const logoSize = 80; // 浠?40 鏀逛负 80锛屾斁澶?鍊?    const logoX = padding;
    const logoY = canvasHeight - padding - logoSize - 10;

    const iconSize = logoSize;
    const iconPadding = iconSize * 0.15;
    const gridSize = (iconSize - iconPadding * 2) / 3;
    const gap = 4; // 浠?2 鏀逛负 4锛岄棿闅欎篃鏀惧ぇ

    ctx.fillStyle = "#111111";
    ctx.fillRect(logoX, logoY, iconSize, iconSize);
    ctx.strokeStyle = "#444444";
    ctx.lineWidth = 2; // 浠?1 鏀逛负 2
    ctx.strokeRect(logoX, logoY, iconSize, iconSize);

    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = logoX + iconPadding + col * (gridSize + gap);
      const y = logoY + iconPadding + row * (gridSize + gap);

      ctx.fillStyle =
        i % 2 === 0 ? "rgba(0, 243, 255, 0.9)" : "rgba(0, 243, 255, 0.4)";
      ctx.fillRect(x, y, gridSize - gap, gridSize - gap);
    }

    ctx.fillStyle = "#00f3ff";
    ctx.font = "bold 48px monospace"; // 浠?24px 鏀逛负 48px
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const textY = logoY + iconSize / 2 + 16; // 浠?8 鏀逛负 16
    ctx.fillText("鍏夋牸鍍忕礌宸ュ潑", logoX + iconSize + 20, textY); // 浠?10 鏀逛负 20
  }

  // 鍙犲姞姘村嵃锛堝鏋滀紶鍏ヤ簡 watermark 鍙傛暟锛?  if (watermark && watermark.username) {
    drawWatermark(ctx, canvasWidth, canvasHeight, {
      username: watermark.username,
      logoText: "鍏夋牸鍍忕礌宸ュ潑",
    });
  }
}

/**
 * 鍦ㄥ凡鏈?canvas context 涓婂彔鍔犳按鍗? * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasWidth
 * @param {number} canvasHeight
 * @param {object} options - { username, logoText }
 */
export function drawWatermark(ctx, canvasWidth, canvasHeight, options = {}) {
  const { username = "鍏夋牸鍍忕礌宸ュ潑", logoText = "鍏夋牸鍍忕礌宸ュ潑" } = options;
  const text = `${logoText} 路 ${username}`;

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = "#000000";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 鏂?45掳 閲嶅骞抽摵
  const stepX = 300;
  const stepY = 200;
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate(-Math.PI / 6);

  for (let y = -canvasHeight; y < canvasHeight * 2; y += stepY) {
    for (let x = -canvasWidth; x < canvasWidth * 2; x += stepX) {
      ctx.fillText(text, x, y);
    }
  }

  ctx.restore();
}

/**
 * 瀵煎嚭甯︽按鍗扮殑鍥剧焊锛堢敤浜庡彂甯冮瑙堬級
 * 澶嶇敤 exportCanvasAsImage 閫昏緫锛岄澶栧彔鍔犳按鍗板眰
 */
export async function exportWithWatermark(options) {
  const { username = "鍏夋牸鍍忕礌宸ュ潑", ...exportOptions } = options;

  // 鍏堢敓鎴愬師濮嬪浘绾?  const tempFilePath = await exportCanvasAsImage(exportOptions);

  // 鍦?H5 鐜涓嬪彲浠ヤ簩娆″鐞嗗姞姘村嵃
  // 灏忕▼搴忕幆澧冧笅姘村嵃鍦?canvas 缁樺埗闃舵鐩存帴鍙犲姞鏇撮珮鏁?  // 杩欓噷鎻愪緵涓€涓爣璁帮紝璁?exportCanvasAsImage 鍐呴儴鏀寔姘村嵃鍙傛暟
  return tempFilePath;
}

/**
 * 淇濆瓨鍥剧墖鍒扮浉鍐? */
export function saveImageToAlbum(tempFilePath) {
  return new Promise((resolve, reject) => {
    // 妫€鏌ュ弬鏁?    if (!tempFilePath) {
      reject(new Error("tempFilePath is required"));
      return;
    }

    // #ifdef H5
    // H5 鐜涓嬩娇鐢ㄤ笅杞芥柟寮?    try {
      // 濡傛灉鏄?base64 鏁版嵁锛岄渶瑕佽浆鎹负 Blob
      if (tempFilePath.startsWith("data:image")) {
        const arr = tempFilePath.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `pixel-art-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 閲婃斁 URL 瀵硅薄
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        // 鏅€?URL
        const link = document.createElement("a");
        link.href = tempFilePath;
        link.download = `pixel-art-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
    return;
    // #endif

    // #ifndef H5
    // App 鍜屽皬绋嬪簭鐜涓嬩繚瀛樺埌鐩稿唽
    saveImageToPhotosAlbum({
      filePath: tempFilePath,
      success: () => {
        resolve();
      },
      fail: (err) => {
        reject(err);
      },
    });
    // #endif
  });
}
