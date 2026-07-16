import { getStorage, setStorage } from '@/utils/browser-platform.js'
import { getClockFont, getClockTextWidth } from "@/utils/clockCanvas.js";
import {
  DEVICE_CLOCK_BINARY_KINDS,
  DEVICE_CLOCK_SEND_MODES,
  sendDeviceClockMode,
} from "@/utils/device-clock-protocol.js";

const CLOCK_DEVICE_THEME_ID_KEY = "clock_device_theme_id";

export default {
  methods: {
    getClockEditorStorageKey() {
      if (this.clockMode === "animation") {
        return "clock_config_animation";
      }
      if (this.clockMode === "theme") {
        return "clock_config_theme";
      }
      return "clock_config_static";
    },

    async startLoading() {
      if (this.loadingTimer) {
        clearInterval(this.loadingTimer);
        this.loadingTimer = null;
      }
      this.loadingActive = true;
    },

    async stopLoading() {
      this.loadingActive = false;
      if (this.loadingTimer) {
        clearInterval(this.loadingTimer);
        this.loadingTimer = null;
      }
    },

    saveConfig() {
      const isThemeMode = this.clockMode === "theme";
      const configToSave = {
        font: this.config.font,
        showSeconds: this.config.showSeconds,
        hourFormat: this.config.hourFormat,
        time: {
          show: this.config.time.show,
          fontSize: this.config.time.fontSize,
          x: this.config.time.x,
          y: this.config.time.y,
          color: this.config.time.color,
          align: this.config.time.align,
        },
        date: {
          show: this.config.date.show,
          fontSize: this.config.date.fontSize,
          x: this.config.date.x,
          y: this.config.date.y,
          color: this.config.date.color,
          align: this.config.date.align,
        },
        week: {
          show: this.config.week.show,
          x: this.config.week.x,
          y: this.config.week.y,
          color: this.config.week.color,
          align: this.config.week.align,
        },
        image: {
          show: isThemeMode ? false : this.config.image.show,
          x: isThemeMode ? 0 : this.config.image.x,
          y: isThemeMode ? 0 : this.config.image.y,
          width: isThemeMode ? 64 : this.config.image.width,
          height: isThemeMode ? 64 : this.config.image.height,
          data: null,
        },
      };

      const saveData = {
        config: configToSave,
        clockMode: this.clockMode,
        hasGif: !!(this.gifAnimationData && this._gifParser),
        imagePixels: isThemeMode
          ? null
          : this.imagePixels
            ? Array.from(this.imagePixels.entries())
            : null,
      };

      if (this.clockMode === "theme") {
        saveData.themeId = this.lastAppliedClockThemeId;
      }

      const storageKey = this.getClockEditorStorageKey();

      setStorage(storageKey, JSON.stringify(saveData));
    },

    loadConfig() {
      const storageKey = this.getClockEditorStorageKey();

      const saved = getStorage(storageKey);

      if (saved) {
        try {
          const savedData = JSON.parse(saved);

          if (savedData.config) {
            if (savedData.config.font !== undefined) {
              if (getClockFont(savedData.config.font)) {
                this.config.font = savedData.config.font;
              } else {
                console.warn("忽略无效时钟字体配置:", savedData.config.font);
              }
            }
            if (savedData.config.showSeconds !== undefined) {
              this.config.showSeconds = savedData.config.showSeconds;
            }
            if (savedData.config.hourFormat !== undefined) {
              this.config.hourFormat = savedData.config.hourFormat;
            }

            this.config.time = {
              ...this.config.time,
              ...savedData.config.time,
            };
            this.config.date = {
              ...this.config.date,
              ...savedData.config.date,
            };
            this.config.week = {
              ...this.config.week,
              ...savedData.config.week,
            };
            if (this.clockMode !== "theme") {
              this.config.image = {
                ...this.config.image,
                ...savedData.config.image,
              };
            }
          }

          if (
            this.clockMode === "theme" &&
            typeof savedData.themeId === "string"
          ) {
            this.lastAppliedClockThemeId = savedData.themeId;
          }

          this.imagePixels =
            this.clockMode === "theme"
              ? null
              : savedData.imagePixels && Array.isArray(savedData.imagePixels)
                ? new Map(savedData.imagePixels)
                : null;

          if (this.clockMode === "animation" && savedData.hasGif) {
            this.config.image.data = null;
            this.imagePixels = null;
            this.gifAnimationData = null;
            this.gifRenderedFrameMaps = null;
            this.gifFrameIndex = 0;
            this._gifParser = null;
            this.stopGifAnimation();
          } else {
            this.gifAnimationData = null;
            this.gifRenderedFrameMaps = null;
            this.gifFrameIndex = 0;
            this._gifParser = null;
            this.stopGifAnimation();
          }

          this.drawCanvas();
        } catch (e) {
          console.error("加载配置失败:", e);
        }
      } else {
        this.imagePixels = null;
        this.gifAnimationData = null;
        this.gifRenderedFrameMaps = null;
        this.gifFrameIndex = 0;
        this._gifParser = null;
        this.stopGifAnimation();
      }
    },

    buildClockConfigPayload() {
      const timeText = this.getTimeText();
      const dateText = this.getDateText();
      const weekText = this.getWeekText();

      const timeAlign = this.config.time.align;
      const timeSize = this.config.time.fontSize;
      let timeX = this.config.time.x;
      if (timeAlign === "center") {
        timeX =
          timeX -
          Math.floor(getClockTextWidth(timeText, this.config.font, timeSize) / 2);
      } else if (timeAlign === "right") {
        timeX = timeX - getClockTextWidth(timeText, this.config.font, timeSize);
      }

      const dateAlign = this.config.date.align;
      const dateSize = this.config.date.fontSize;
      let dateX = this.config.date.x;
      if (dateAlign === "center") {
        dateX =
          dateX -
          Math.floor(getClockTextWidth(dateText, this.config.font, dateSize) / 2);
      } else if (dateAlign === "right") {
        dateX = dateX - getClockTextWidth(dateText, this.config.font, dateSize);
      }

      const weekAlign = this.config.week.align;
      let weekX = this.config.week.x;
      if (weekAlign === "center") {
        weekX =
          weekX - Math.floor(getClockTextWidth(weekText, this.config.font, 1) / 2);
      } else if (weekAlign === "right") {
        weekX = weekX - getClockTextWidth(weekText, this.config.font, 1);
      }

      return {
        font: this.config.font,
        showSeconds: this.config.showSeconds,
        hourFormat: this.config.hourFormat,
        time: {
          show: this.config.time.show,
          fontSize: this.config.time.fontSize,
          x: timeX,
          y: this.config.time.y,
          color: this.hexToRgb(this.config.time.color),
        },
        date: {
          show: this.config.date.show,
          fontSize: this.config.date.fontSize,
          x: dateX,
          y: this.config.date.y,
          color: this.hexToRgb(this.config.date.color),
        },
        week: {
          show: this.config.week.show,
          x: weekX,
          y: this.config.week.y,
          color: this.hexToRgb(this.config.week.color),
        },
        image: {
          show: this.config.image.show,
          x: this.config.image.x,
          y: this.config.image.y,
          width: this.config.image.width,
          height: this.config.image.height,
        },
      };
    },

    async sendToDevice() {
      if (!this.guardBeforeSend(this.deviceStore.connected)) {
        return;
      }

      this.beginSendUi();
      const ws = this.deviceStore.getWebSocket();
      try {
        const hasGifAnimation =
          this.clockMode === "animation" &&
          this.gifAnimationData &&
          this.gifAnimationData.frameCount > 0 &&
          this._gifParser &&
          Array.isArray(this.gifRenderedFrameMaps) &&
          this.gifRenderedFrameMaps.length > 0;

        if (this.clockMode === "theme") {
          if (!this.lastAppliedClockThemeId) {
            throw new Error("请先选择主题");
          }

          await sendDeviceClockMode(ws, {
            mode: DEVICE_CLOCK_SEND_MODES.THEME,
            themeId: this.lastAppliedClockThemeId,
          });

          this.deviceThemeId = this.lastAppliedClockThemeId;
          setStorage(CLOCK_DEVICE_THEME_ID_KEY, this.deviceThemeId);
          this.saveConfig();
          this.showSendSuccess();
          return;
        }

        const sendRequest = {
          mode: this.clockMode,
          config: this.config,
          now: new Date(),
          binaryKind: DEVICE_CLOCK_BINARY_KINDS.NONE,
        };

        if (hasGifAnimation) {
          sendRequest.binaryKind = DEVICE_CLOCK_BINARY_KINDS.GIF_ANIMATION;
          sendRequest.gifParser = this._gifParser;
          sendRequest.gifRenderedFrames = this.gifRenderedFrameMaps;
          sendRequest.gifPlaySpeed = this.gifPlaySpeed;
        } else if (
          this.config.image.show === true &&
          this.imagePixels instanceof Map &&
          this.imagePixels.size > 0
        ) {
          sendRequest.binaryKind = DEVICE_CLOCK_BINARY_KINDS.STATIC_IMAGE;
          sendRequest.imagePixelMap = this.imagePixels;
        }

        await sendDeviceClockMode(ws, sendRequest);
        this.saveConfig();
        this.showSendSuccess();
      } catch (err) {
        console.error("发送失�?", err);
        this.showSendFailure(err);
      } finally {
        this.stopLoading().catch(() => {});
        this.endSendUi();
      }
    },

  },
};
