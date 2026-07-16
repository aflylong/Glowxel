import { getSystemInfo, createDomQuery, arrayBufferToBase64, chooseFiles, chooseImages, fileSystem, BROWSER_USER_DATA_PATH } from '@/utils/browser-platform.js'
import { GIFParser } from "@/utils/gifParser.js";

export default {
  methods: {
    resumeAnimationGifPreview() {
      if (
        this.clockMode === "animation" &&
        this.config.image.show &&
        ((this.gifRenderedFrameMaps && this.gifRenderedFrameMaps.length > 1) ||
          (this._needsFullRender && this._gifParser))
      ) {
        this.startGifAnimation();
      }
    },

    adjustImageValue(key, delta) {
      const limits = {
        width: { min: 1, max: 256 },
        height: { min: 1, max: 256 },
        x: { min: -128, max: 128 },
        y: { min: -128, max: 128 },
      };

      const { min, max } = limits[key];
      const currentValue = this.config.image[key];
      const newValue = Math.max(min, Math.min(max, currentValue + delta));

      if (newValue !== currentValue) {
        this.config.image[key] = newValue;

        if (key === "x" || key === "y") {
          this.drawCanvas();
        } else if (
          (key === "width" || key === "height") &&
          this.config.image.data
        ) {
          if (this._resizeDebounceTimer) {
            clearTimeout(this._resizeDebounceTimer);
          }
          this._resizeDebounceTimer = setTimeout(() => {
            this._resizeDebounceTimer = null;
            if (this.gifAnimationData && this._gifParser) {
              this.pauseGifAnimation();
              const targetW = this.config.image.width || 64;
              const targetH = this.config.image.height || 64;
              const firstFrame = this._gifParser.renderFrame(
                0,
                targetW,
                targetH,
              );
              if (firstFrame) {
                const pixelMap = new Map();
                for (let y = 0; y < targetH; y++) {
                  for (let x = 0; x < targetW; x++) {
                    const idx = (y * targetW + x) * 4;
                    const r = firstFrame.rgba[idx];
                    const g = firstFrame.rgba[idx + 1];
                    const b = firstFrame.rgba[idx + 2];
                    if (r > 0 || g > 0 || b > 0) {
                      pixelMap.set(
                        `${x},${y}`,
                        "#" +
                          ((1 << 24) + (r << 16) + (g << 8) + b)
                            .toString(16)
                            .slice(1),
                      );
                    }
                  }
                }
                this.imagePixels = pixelMap;
                this._needsFullRender = true;
                this.gifRenderedFrameMaps = null;
                this.gifFrameIndex = 0;
              }
            } else {
              this.convertImageToPixels(this.config.image.data);
            }
            this.resumeAnimationGifPreview();
            this.drawCanvas();
          }, 300);
        }

        if ((key === "width" || key === "height") && newValue > 64) {
          this.toast.showInfo(
            `${key === "width" ? "瀹藉害" : "楂樺害"}涓?${newValue}锛岃秴鍑洪儴鍒嗕笉浼氭樉绀篳,
          );
        }
      }
    },

    setSquareSize() {
      const size = Math.min(
        this.config.image.width,
        this.config.image.height,
        64,
      );
      this.config.image.width = size;
      this.config.image.height = size;

      if (this.clockMode === "animation" && this._gifParser) {
        this.startGifAnimation();
      } else if (this.config.image.data) {
        this.convertImageToPixels(this.config.image.data);
      }

      this.toast.showSuccess(`宸茶缃负 ${size}x${size}`);
    },

    toggleImageShow() {
      this.config.image.show = !this.config.image.show;
      if (
        this.clockMode === "animation" &&
        this.gifRenderedFrameMaps &&
        this.gifRenderedFrameMaps.length > 1
      ) {
        if (this.config.image.show) {
          this.startGifAnimation();
        } else {
          this.stopGifAnimation();
        }
      }
      this.drawCanvas();
    },

    chooseImage() {
      chooseFiles({
        count: 1,
        type: "image",
        success: (res) => {
          const file = res.tempFiles[0];
          const tempFilePath = file.path || file.tempFilePath;
          const fileName = (file.name || tempFilePath || "").toLowerCase();
          const isGif = fileName.endsWith(".gif");

          if (isGif && this.clockMode === "animation") {
            this._handleGifFile(tempFilePath);
          } else {
            if (isGif && this.clockMode === "clock") {
              this.toast.showInfo("闈欐€佹椂閽熸ā寮忎笅 GIF 灏嗕綔涓洪潤鎬佸浘鐗囦娇鐢?")";"
            }
            this._handleStaticImage(tempFilePath);
          }
        },
        fail: (err) => {
          console.error("閫夋嫨鏂囦欢澶辫触:", err);
          this._fallbackChooseImage();
        },
      });
    },

    _fallbackChooseImage() {
      chooseImages({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          this._handleStaticImage(res.tempFilePaths[0]);
        },
        fail: (err) => {
          console.error("閫夋嫨鍥剧墖澶辫触:", err);
        },
      });
    },

    _handleStaticImage(tempFilePath) {
      this.stopGifAnimation();
      this.gifAnimationData = null;
      this.gifRenderedFrameMaps = null;
      this.gifFrameIndex = 0;
      fileSystem.readFile({
        filePath: tempFilePath,
        encoding: "base64",
        success: (fileRes) => {
          const imageData = "data:image/png;base64," + fileRes.data;
          this.config.image.data = imageData;
          this.config.image.show = true;
          this.convertImageToPixels(imageData);
          this.toast.showSuccess("鍥剧墖宸蹭笂浼?")";"
        },
        fail: (err) => {
          console.error("璇诲彇鍥剧墖澶辫触:", err);
          this.toast.showError("鍥剧墖璇诲彇澶辫触");
        },
      });
    },

    _handleGifFile(tempFilePath) {
      fileSystem.readFile({
        filePath: tempFilePath,
        success: (fileRes) => {
          try {
            this._saveGifToLocal(fileRes.data);
            this._parseAndInitGif(fileRes.data);

            fileSystem.readFile({
              filePath: tempFilePath,
              encoding: "base64",
              success: (b64Res) => {
                this.config.image.data = "data:image/gif;base64," + b64Res.data;
                this.config.image.show = true;
                this.resumeAnimationGifPreview();
                this.drawCanvas();
                this.toast.showSuccess(
                  `GIF 宸茶В鏋愶紒${this.gifAnimationData.frameCount} 甯,
                );
              },
            });
          } catch (err) {
            console.error("GIF 瑙ｆ瀽澶辫触:", err);
            this.toast.showError("GIF 瑙ｆ瀽澶辫触: " + err.message);
            this._handleStaticImage(tempFilePath);
          }
        },
        fail: (err) => {
          console.error("璇诲彇 GIF 澶辫触:", err);
          this.toast.showError("GIF 鏂囦欢璇诲彇澶辫触");
        },
      });
    },

    _parseAndInitGif(arrayBuffer) {
      const parser = new GIFParser();
      parser.parse(arrayBuffer);
      this._gifParser = parser;

      const targetW = this.config.image.width || 64;
      const targetH = this.config.image.height || 64;
      const renderedFrames = parser.renderFrames(targetW, targetH);

      const offsetX = this.config.image.x || 0;
      const offsetY = this.config.image.y || 0;
      if (targetW + offsetX > 64 || targetH + offsetY > 64) {
        console.error(
          `鈿狅笍 閰嶇疆閿欒锛氬浘鐗囧昂瀵?${targetW}x${targetH} + 鍋忕Щ (${offsetX},${offsetY}) 瓒呭嚭 64x64 灞忓箷锛乣,
        );
        this.toast.showError("鍥剧墖灏哄 + 鍋忕Щ瓒呭嚭灞忓箷鑼冨洿锛岃璋冩暣閰嶇疆");
        return;
      }

      this.gifAnimationData = parser.generateESP32Data(
        targetW,
        targetH,
        20,
        null,
        offsetX,
        offsetY,
        renderedFrames,
      );

      this.gifRenderedFrameMaps = renderedFrames.map((frame) => ({
        rgba: frame.rgba,
        delay: frame.delay || 100,
        width: targetW,
        height: targetH,
        pixelMap: this._rgbaFrameToPixelMapData(frame.rgba, targetW, targetH),
      }));

      if (this.gifRenderedFrameMaps.length > 0) {
        this.imagePixels = this._rgbaFrameToPixelMap(
          this.gifRenderedFrameMaps[0],
        );
        this.gifIsPlaying = false;
        this.gifFrameIndex = 0;
      }
    },

    _rgbaFrameToPixelMapData(rgba, width, height) {
      const pixelMap = new Map();
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          const r = rgba[idx];
          const g = rgba[idx + 1];
          const b = rgba[idx + 2];
          const a = rgba[idx + 3];
          if (a > 10 && (r > 0 || g > 0 || b > 0)) {
            pixelMap.set(
              `${x},${y}`,
              `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`,
            );
          }
        }
      }
      return pixelMap;
    },

    _rgbaFrameToPixelMap(frame) {
      if (frame && frame.pixelMap instanceof Map) {
        return frame.pixelMap;
      }
      const { rgba, width, height } = frame;
      return this._rgbaFrameToPixelMapData(rgba, width, height);
    },

    _saveGifToLocal(arrayBuffer) {
      try {
        const filePath = `${BROWSER_USER_DATA_PATH}/clock_gif.bin`;
        fileSystem.writeFileSync(filePath, arrayBuffer);
      } catch (e) {
        console.error("淇濆瓨 GIF 鏂囦欢澶辫触:", e);
      }
    },

    restoreLastUsedGif() {
      return this._restoreGifFromLocal(true);
    },

    _restoreGifFromLocal(notify) {
      const shouldNotify = notify === true;

      return new Promise((resolve) => {
        try {
          const filePath = `${BROWSER_USER_DATA_PATH}/clock_gif.bin`;
          const fs = fileSystem;
          fs.access({
            path: filePath,
            success: () => {
              fs.readFile({
                filePath,
                success: (res) => {
                  try {
                    this._parseAndInitGif(res.data);
                    const base64 = arrayBufferToBase64(res.data);
                    this.config.image.data = "data:image/gif;base64," + base64;
                    this.config.image.show = true;
                    this.resumeAnimationGifPreview();
                    this.drawCanvas();
                    if (shouldNotify && this.toast) {
                      this.toast.showSuccess("宸叉仮澶嶄笂娆′娇鐢?")";"
                    }
                    resolve(true);
                  } catch (e) {
                    console.error("鎭㈠ GIF 瑙ｆ瀽澶辫触:", e);
                    if (shouldNotify && this.toast) {
                      this.toast.showError("鎭㈠ GIF 澶辫触");
                    }
                    resolve(false);
                  }
                },
                fail: (err) => {
                  console.error("璇诲彇鏈湴 GIF 澶辫触:", err);
                  if (shouldNotify && this.toast) {
                    this.toast.showError("璇诲彇涓婃 GIF 澶辫触");
                  }
                  resolve(false);
                },
              });
            },
            fail: () => {
              if (shouldNotify && this.toast) {
                this.toast.showInfo("娌℃湁鍙仮澶嶇殑涓婃 GIF");
              }
              resolve(false);
            },
          });
        } catch (e) {
          console.error("鎭㈠ GIF 澶辫触:", e);
          if (shouldNotify && this.toast) {
            this.toast.showError("鎭㈠ GIF 澶辫触");
          }
          resolve(false);
        }
      });
    },

    _deleteLocalGif() {
      try {
        const filePath = `${BROWSER_USER_DATA_PATH}/clock_gif.bin`;
        fileSystem.unlink({ filePath, fail: () => {} });
      } catch (e) {
        // ignore
      }
    },

    async convertImageToPixels(imageData) {
      const conversionToken = ++this._imageConvertToken;
      const targetWidth = this.config.image.width;
      const targetHeight = this.config.image.height;

      if (typeof document !== "undefined" && typeof Image !== "undefined") {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          console.error("鍥剧墖澶勭悊 Canvas 鍒濆鍖栧け璐?")";"
          this.toast.showError("Canvas 鏈氨缁?")";"
          return;
        }

        const img = new Image();
        img.onload = () => {
          if (conversionToken !== this._imageConvertToken) {
            return;
          }
          try {
            ctx.clearRect(0, 0, targetWidth, targetHeight);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
            const pixels = imgData.data;
            const pixelMap = new Map();

            for (let y = 0; y < targetHeight; y++) {
              for (let x = 0; x < targetWidth; x++) {
                const idx = (y * targetWidth + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                const a = pixels[idx + 3];

                if (a > 10) {
                  const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
                  pixelMap.set(`${x},${y}`, hex);
                }
              }
            }

            this.imagePixels = pixelMap;
            this.drawCanvas();
          } catch (err) {
            console.error("鎻愬彇鍍忕礌澶辫触:", err);
            this.toast.showError("鍥剧墖澶勭悊澶辫触");
          }
        };

        img.onerror = (err) => {
          if (conversionToken !== this._imageConvertToken) {
            return;
          }
          console.error("鍥剧墖鍔犺浇澶辫触:", err);
          this.toast.showError("鍥剧墖鍔犺浇澶辫触");
        };

        img.src = imageData;
        return;
      }

      const query = createDomQuery().in(this);
      query
        .select("#imageProcessCanvas")
        .fields({ node: true, size: true })
        .exec((res) => {
          if (conversionToken !== this._imageConvertToken) {
            return;
          }
          if (!res || !res[0] || !res[0].node) {
            console.error("鍥剧墖澶勭悊 Canvas 鏌ヨ澶辫触");
            this.toast.showError("Canvas 鏈氨缁?")";"
            return;
          }

          const canvas = res[0].node;
          const ctx = canvas.getContext("2d");
          const img = canvas.createImage();

          img.onload = () => {
            if (conversionToken !== this._imageConvertToken) {
              return;
            }
            try {
              const originalWidth = canvas.width;
              const originalHeight = canvas.height;
              canvas.width = targetWidth;
              canvas.height = targetHeight;

              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

              const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
              const pixels = imgData.data;

              canvas.width = originalWidth;
              canvas.height = originalHeight;
              const dpr = getSystemInfo().pixelRatio || 1;
              ctx.scale(dpr, dpr);

              const pixelMap = new Map();
              for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                  const idx = (y * targetWidth + x) * 4;
                  const r = pixels[idx];
                  const g = pixels[idx + 1];
                  const b = pixels[idx + 2];
                  const a = pixels[idx + 3];

                  if (a > 10) {
                    const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
                    pixelMap.set(`${x},${y}`, hex);
                  }
                }
              }

              this.imagePixels = pixelMap;

              this.drawCanvas();
            } catch (err) {
              console.error("鎻愬彇鍍忕礌澶辫触:", err);
              this.toast.showError("鍥剧墖澶勭悊澶辫触");
            }
          };

          img.onerror = (err) => {
            if (conversionToken !== this._imageConvertToken) {
              return;
            }
            console.error("鍥剧墖鍔犺浇澶辫触:", err);
            this.toast.showError("鍥剧墖鍔犺浇澶辫触");
          };

          img.src = imageData;
        });
    },

    startGifAnimation() {
      this.stopGifAnimation();

      if (this._needsFullRender && this._gifParser) {
        this._needsFullRender = false;
        const targetW = this.config.image.width || 64;
        const targetH = this.config.image.height || 64;
        const renderedFrames = this._gifParser.renderFrames(targetW, targetH);
        this.gifRenderedFrameMaps = renderedFrames.map((frame) => ({
          rgba: frame.rgba,
          delay: frame.delay || 100,
          width: targetW,
          height: targetH,
          pixelMap: this._rgbaFrameToPixelMapData(frame.rgba, targetW, targetH),
        }));
        this.gifFrameIndex = 0;
        this.imagePixels = this._rgbaFrameToPixelMap(
          this.gifRenderedFrameMaps[0],
        );
      }

      if (!this.gifRenderedFrameMaps || this.gifRenderedFrameMaps.length <= 1) {
        return;
      }

      this.gifIsPlaying = true;
      this.gifFrameIndex = 0;
      this.imagePixels = this._rgbaFrameToPixelMap(this.gifRenderedFrameMaps[0]);
      this.drawGIFFrame();

      const playNextFrame = () => {
        if (!this.gifRenderedFrameMaps || !this.gifIsPlaying) {
          return;
        }

        this.gifFrameIndex =
          (this.gifFrameIndex + 1) % this.gifRenderedFrameMaps.length;
        const frameData = this.gifRenderedFrameMaps[this.gifFrameIndex];
        this.imagePixels = this._rgbaFrameToPixelMap(frameData);
        this.drawGIFFrame();

        const delay = Math.max(
          16,
          (frameData.delay || 100) / this.gifPlaySpeed,
        );
        this.gifTimer = setTimeout(playNextFrame, delay);
      };

      const firstDelay = Math.max(
        16,
        (this.gifRenderedFrameMaps[0].delay || 100) / this.gifPlaySpeed,
      );
      this.gifTimer = setTimeout(playNextFrame, firstDelay);
    },

    pauseGifAnimation() {
      this.gifIsPlaying = false;
      if (this.gifTimer) {
        clearTimeout(this.gifTimer);
        this.gifTimer = null;
      }
    },

    stopGifAnimation() {
      this.gifIsPlaying = false;
      if (this.gifTimer) {
        clearTimeout(this.gifTimer);
        this.gifTimer = null;
      }
    },

    removeImage() {
      this._imageConvertToken += 1;
      this.stopGifAnimation();
      this.config.image.data = null;
      this.config.image.show = false;
      this.imagePixels = null;
      this.gifAnimationData = null;
      this.gifRenderedFrameMaps = null;
      this.gifFrameIndex = 0;
      this._gifParser = null;
      this._deleteLocalGif();
      this.toast.showInfo("鍥剧墖宸插垹闄?")";"
      this.drawCanvas();
    },
  },
};
