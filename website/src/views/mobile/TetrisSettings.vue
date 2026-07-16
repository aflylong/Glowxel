<!-- AUTO-CONVERTED FROM uniapp/pages/tetris-settings/tetris-settings.vue -->
<template>
  <div class="tetris-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">淇勭綏鏂柟鍧楀睆淇?</span>
      <div class="nav-right"></div>
    </div>

    <div class="canvas-section">
      <div class="preview-canvas-container" :style="previewCanvasBoxStyle">
        <PixelCanvas
          v-if="previewCanvasReady && !shouldShowSendingSnapshot"
          :width="64"
          :height="64"
          :pixels="currentPreviewPixels"
          :zoom="previewZoom"
          :offset-x="previewOffset.x"
          :offset-y="previewOffset.y"
          :canvas-width="previewContainerSize.width"
          :canvas-height="previewContainerSize.height"
          :grid-visible="true"
          :is-dark-mode="true"
          :touch-enabled="false"
          canvas-id="tetrisScreensaverPreviewCanvas"
        />
        <PixelPreviewBoard
          v-else-if="previewCanvasReady && shouldShowSendingSnapshot"
          :width="64"
          :height="64"
          :pixels="sendingPreviewPixels"
          :refresh-token="sendingPreviewTick"
          :zoom="previewZoom"
          :offset-x="previewOffset.x"
          :offset-y="previewOffset.y"
          :grid-visible="true"
          :is-dark-mode="true"
        />
      </div>
      <div class="preview-caption glx-preview-panel">
        <div class="preview-caption-info glx-preview-panel__info">
          <span class="preview-caption-title">棰勮鏁堟灉</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending }"
            @click="saveAndApply"
          >
            <Icon name="link" :size="36" color="#000000" />
            <span>鍙戦€?</span>
          </div>
        </div>
      </div>
    </div>

    <div data-scroll-view
      scroll-y
      class="content glx-scroll-region glx-page-shell__content"
      :style="{ height: contentHeight }"
    >
      <div class="content-wrapper glx-scroll-stack">
        <div v-show="currentTab === 1">
          <div class="card glx-panel-card glx-editor-card tetris-section-card">
            <div class="card-title-section glx-panel-head">
              <span class="card-title glx-panel-title">妯″紡</span>
            </div>
            <div class="option-row option-row-double">
              <div
                class="option-btn glx-feature-option"
                :class="{ active: config.clearMode }"
                @click="config.clearMode = true"
              >
                <span>娑堥櫎妯″紡</span>
              </div>
              <div
                class="option-btn glx-feature-option"
                :class="{ active: !config.clearMode }"
                @click="config.clearMode = false"
              >
                <span>婊″睆妯″紡</span>
              </div>
            </div>
          </div>

          <div class="card glx-panel-card glx-editor-card tetris-section-card">
            <div class="card-title-section glx-panel-head">
              <span class="card-title glx-panel-title">鏂瑰潡澶у皬</span>
            </div>
            <div class="option-row option-row-triple">
              <div
                class="option-btn glx-feature-option"
                :class="{ active: config.cellSize === 1 }"
                @click="config.cellSize = 1"
              >
                <span>灏?(1px)</span>
              </div>
              <div
                class="option-btn glx-feature-option"
                :class="{ active: config.cellSize === 2 }"
                @click="config.cellSize = 2"
              >
                <span>涓?(2px)</span>
              </div>
              <div
                class="option-btn glx-feature-option"
                :class="{ active: config.cellSize === 3 }"
                @click="config.cellSize = 3"
              >
                <span>澶?(3px)</span>
              </div>
            </div>
          </div>

          <div class="card glx-panel-card glx-editor-card tetris-section-card">
            <div class="card-title-section glx-panel-head">
              <span class="card-title glx-panel-title">涓嬭惤閫熷害</span>
            </div>
            <div class="option-row option-row-triple">
              <div
                class="option-btn glx-feature-option"
                :class="{ active: config.speed === 'slow' }"
                @click="config.speed = 'slow'"
              >
                <span>鎱?</span>
              </div>
              <div
                class="option-btn glx-feature-option"
                :class="{ active: config.speed === 'normal' }"
                @click="config.speed = 'normal'"
              >
                <span>涓?</span>
              </div>
              <div
                class="option-btn glx-feature-option"
                :class="{ active: config.speed === 'fast' }"
                @click="config.speed = 'fast'"
              >
                <span>蹇?</span>
              </div>
            </div>
          </div>

          <div class="card glx-panel-card glx-editor-card tetris-section-card">
            <div class="card-title-section glx-panel-head">
              <span class="card-title glx-panel-title">鏃堕棿鏄剧ず</span>
            </div>
            <div class="option-row option-row-double">
              <div
                class="option-btn glx-feature-option"
                :class="{ active: config.showClock }"
                @click="config.showClock = true"
              >
                <span>鏄剧ず鏃堕棿</span>
              </div>
              <div
                class="option-btn glx-feature-option"
                :class="{ active: !config.showClock }"
                @click="config.showClock = false"
              >
                <span>闅愯棌鏃堕棿</span>
              </div>
            </div>
          </div>

        </div>

        <ClockTextSettingsCard
          v-show="currentTab === 2"
          icon-name="time"
          title="鏃堕棿鏄剧ず"
          :section="effectiveTimeSection"
          :preset-colors="presetColors"
          :show-font-size="true"
          :show-seconds-control="true"
          :show-seconds="clockConfig.showSeconds"
          :min-font-size="1"
          :max-font-size="3"
          :show-toggle="false"
          @toggle-seconds="toggleShowSeconds"
          @adjust="handleTimeAdjust"
          @update-color="handleTimeColor"
          @set-align="handleTimeAlign"
        />

        <ClockFontPanel
          v-show="currentTab === 3"
          :font-options="fontOptions"
          :selected-font="clockConfig.font"
          :show-seconds="clockConfig.showSeconds"
          :hour-format="clockConfig.hourFormat"
          @select-font="selectFont"
          @set-hour-format="setHourFormat"
        />
      </div>
    </div>

    <div class="bottom-tabs">
      <div
        v-for="tab in tabDefinitions"
        :key="tab.index"
        class="bottom-tab-item"
        :class="{ active: currentTab === tab.index }"
        @click="currentTab = tab.index"
      >
        <Icon
          :name="tab.icon"
          :size="36"
          :color="currentTab === tab.index ? '#000000' : '#666666'"
        />
        <span class="bottom-tab-text">{{ tab.label }}</span>
      </div>
    </div>

    <div
      v-if="isSending"
      class="glx-device-sending-overlay"
      @touchmove.stop.prevent
    >
      <div class="glx-device-sending-card">
        <GlxInlineLoader
          class="glx-device-sending-spinner"
          variant="chase"
          size="lg"
        />
        <span class="glx-device-sending-title">{{ sendOverlayTitle }}</span>
        <span class="glx-device-sending-tip">{{ sendOverlayTip }}</span>
      </div>
    </div>

    <Toast
      ref="toastRef"
      @show="handleToastShow"
      @hide="handleToastHide"
    />
  </div>
</template>

<script>
import { getStorage, setStorage, getSystemInfo, createDomQuery, navigateBack } from '@/utils/browser-platform.js'
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import { useDeviceStore } from "@/stores/device.js";
import { useToast } from "@/composables/useToast.js";
import statusBarMixin from "@/mixins/statusBar.js";
import deviceSendUxMixin from "@/mixins/deviceSendUxMixin.js";
import Icon from "@/components/uni/Icon.vue";
import Toast from "@/components/uni/Toast.vue";
import GlxInlineLoader from "@/components/uni/GlxInlineLoader.vue";
import PixelCanvas from "@/components/uni/PixelCanvas.vue";
import PixelPreviewBoard from "@/components/uni/PixelPreviewBoard.vue";
import ClockFontPanel from "@/components/uni/clock-editor/ClockFontPanel.vue";
import ClockTextSettingsCard from "@/components/uni/clock-editor/ClockTextSettingsCard.vue";
import {
  createTetrisScreensaverPreviewState,
  renderTetrisScreensaverPreviewState,
  stepTetrisScreensaverPreviewState,
} from "@/utils/tetrisScreensaverPreview.js";
import {
  getClockFontOptions,
  getClockTextWidth,
  getCurrentTimeText,
} from "@/utils/clockCanvas.js";

const TETRIS_SPEED_OPTIONS = {
  slow: 300,
  normal: 150,
  fast: 80,
};
const TETRIS_ALL_PIECES = Object.freeze([0, 1, 2, 3, 4, 5, 6]);
const TETRIS_CONFIG_STORAGE_KEY = "tetris_config";
const TETRIS_OVERLAY_CLOCK_CONFIG_STORAGE_KEY = "tetris_overlay_clock_config";

function cloneAllTetrisPieces() {
  return TETRIS_ALL_PIECES.slice();
}

function createDefaultConfig() {
  return {
    clearMode: true,
    cellSize: 2,
    speed: "normal",
    showClock: true,
    pieces: cloneAllTetrisPieces(),
  };
}

function createDefaultClockConfig() {
  return {
    font: "classic_5x7",
    showSeconds: false,
    hourFormat: 24,
    time: {
      show: true,
      fontSize: 1,
      x: 32,
      y: 2,
      color: "#ffffff",
      align: "center",
    },
    date: {
      show: false,
      fontSize: 1,
      x: 0,
      y: 0,
      color: "#787878",
      align: "left",
    },
    week: {
      show: false,
      x: 0,
      y: 0,
      color: "#646464",
      align: "left",
    },
    image: {
      show: false,
      x: 0,
      y: 0,
      width: 64,
      height: 64,
    },
  };
}

function normalizeSavedConfig(saved) {
  const base = createDefaultConfig();
  if (!saved || typeof saved !== "object") {
    return base;
  }

  const normalized = createDefaultConfig();
  if (typeof saved.clearMode === "boolean") {
    normalized.clearMode = saved.clearMode;
  }
  if (saved.cellSize === 1 || saved.cellSize === 2 || saved.cellSize === 3) {
    normalized.cellSize = saved.cellSize;
  }
  if (saved.speed === "slow" || saved.speed === "normal" || saved.speed === "fast") {
    normalized.speed = saved.speed;
  }
  if (typeof saved.showClock === "boolean") {
    normalized.showClock = saved.showClock;
  }
  return normalized;
}

export default {
  mixins: [uniLifecycleAdapter, statusBarMixin, deviceSendUxMixin],
  components: {
    Icon,
    Toast,
    GlxInlineLoader,
    PixelCanvas,
    PixelPreviewBoard,
    ClockFontPanel,
    ClockTextSettingsCard,
  },
  data() {
    return {
      deviceStore: null,
      toast: null,
      contentHeight: "calc(100vh - 88rpx - 520rpx)",
      previewCanvasReady: false,
      previewZoom: 4,
      previewOffset: { x: 0, y: 0 },
      previewContainerSize: { width: 320, height: 320 },
      previewState: null,
      currentPreviewMap: new Map(),
      sendingPreviewPixels: new Map(),
      sendingPreviewTick: 0,
      previewTimer: null,
      previewRefreshTimer: null,
      config: createDefaultConfig(),
      clockConfig: createDefaultClockConfig(),
      fontOptions: getClockFontOptions(),
      currentTab: 1,
      tabDefinitions: [
        { index: 1, label: "灞忎繚", icon: "picture" },
        { index: 2, label: "鏃堕棿", icon: "time" },
        { index: 3, label: "瀛椾綋", icon: "text" },
      ],
      presetColors: [
        { name: "闈掕壊", hex: "#64c8ff" },
        { name: "缁胯壊", hex: "#00ff9d" },
        { name: "榛勮壊", hex: "#ffdc00" },
        { name: "姗欒壊", hex: "#ffa500" },
        { name: "绾㈣壊", hex: "#ff6464" },
        { name: "绱壊", hex: "#c864ff" },
        { name: "鐧借壊", hex: "#ffffff" },
      ],
    };
  },
  computed: {
    currentPreviewPixels() {
      return this.currentPreviewMap;
    },
    effectiveTimeSection() {
      return {
        ...this.clockConfig.time,
        show: this.config.showClock,
      };
    },
    previewCanvasBoxStyle() {
      return {
        height: `${this.previewContainerSize.height}px`,
      };
    },
  },
  watch: {
    config: {
      handler() {
        this.schedulePreviewRefresh();
      },
      deep: true,
    },
    clockConfig: {
      handler() {
        this.schedulePreviewRefresh();
      },
      deep: true,
    },
  },
  onLoad() {
    this.deviceStore = useDeviceStore();
    this.deviceStore.init();
    this.toast = useToast();
    const saved = getStorage(TETRIS_CONFIG_STORAGE_KEY);
    this.config = normalizeSavedConfig(saved);
    const savedClockConfig = getStorage(
      TETRIS_OVERLAY_CLOCK_CONFIG_STORAGE_KEY,
    );
    if (savedClockConfig && typeof savedClockConfig === "object") {
      this.clockConfig = savedClockConfig;
    }
  },
  onReady() {
    if (this.$refs.toastRef) {
      this.toast.setToastInstance(this.$refs.toastRef);
    }
    this.initPreviewCanvas();
  },
  onHide() {
    this.cleanupPreviewTimers();
  },
  onUnload() {
    this.cleanupPreviewTimers();
  },
  methods: {
    captureSendingPreview() {
      this.sendingPreviewPixels = new Map(this.currentPreviewPixels);
      this.sendingPreviewTick += 1;
    },
    clearSendingPreview() {
      this.sendingPreviewPixels = new Map();
      this.sendingPreviewTick += 1;
    },
    beginSendUi() {
      this.captureSendingPreview();
      deviceSendUxMixin.methods.beginSendUi.call(this);
    },
    endSendUi() {
      deviceSendUxMixin.methods.endSendUi.call(this);
    },
    handleBack() {
      navigateBack();
    },
    initPreviewCanvas() {
      const systemInfo = getSystemInfo();
      const statusBarHeight = systemInfo.statusBarHeight || 0;

      this.$nextTick(() => {
        setTimeout(() => {
          const query = createDomQuery().in(this);
          query.select(".canvas-section").boundingClientRect((sectionRect) => {
            if (!sectionRect || !sectionRect.height) {
              return;
            }
            const nextHeight =
              systemInfo.windowHeight -
              statusBarHeight -
              88 -
              sectionRect.height;
            this.contentHeight = `${Math.max(120, nextHeight)}px`;
          });
          query
            .select(".preview-canvas-container")
            .boundingClientRect((rect) => {
              if (!rect || !rect.width) {
                this.previewCanvasReady = true;
                this.schedulePreviewRefresh();
                return;
              }
              const fitZoom = Math.max(2, Math.floor((rect.width * 0.96) / 64));
              this.previewContainerSize = {
                width: rect.width,
                height: rect.width,
              };
              this.previewZoom = fitZoom;
              this.previewOffset = {
                x: (rect.width - 64 * fitZoom) / 2,
                y: (rect.width - 64 * fitZoom) / 2,
              };
              this.previewCanvasReady = true;
              this.schedulePreviewRefresh();
            })
            .exec();
        }, 80);
      });
    },
    schedulePreviewRefresh() {
      if (!this.previewCanvasReady) {
        return;
      }
      if (this.previewRefreshTimer) {
        clearTimeout(this.previewRefreshTimer);
        this.previewRefreshTimer = null;
      }
      this.previewRefreshTimer = setTimeout(() => {
        const previewConfig = {
          ...this.config,
          pieces: cloneAllTetrisPieces(),
        };
        this.previewState = createTetrisScreensaverPreviewState(
          previewConfig,
          this.buildEffectiveClockConfig(),
        );
        this.currentPreviewMap = renderTetrisScreensaverPreviewState(this.previewState);
        this.startPreviewPlayback();
      }, 80);
    },
    startPreviewPlayback() {
      this.stopPreviewPlayback();
      if (!this.previewState) {
        return;
      }
      const playNext = () => {
        const delay = Number.isFinite(this.previewState.frameDelay)
          ? this.previewState.frameDelay
          : 110;
        this.previewTimer = setTimeout(() => {
          if (!this.previewState) {
            return;
          }
          stepTetrisScreensaverPreviewState(this.previewState);
          this.currentPreviewMap = renderTetrisScreensaverPreviewState(this.previewState);
          playNext();
        }, delay);
      };
      playNext();
    },
    stopPreviewPlayback() {
      if (this.previewTimer) {
        clearTimeout(this.previewTimer);
        this.previewTimer = null;
      }
    },
    cleanupPreviewTimers() {
      this.stopPreviewPlayback();
      if (this.previewRefreshTimer) {
        clearTimeout(this.previewRefreshTimer);
        this.previewRefreshTimer = null;
      }
      this.previewState = null;
    },
    buildEffectiveClockConfig() {
      return {
        ...this.clockConfig,
        time: {
          ...this.clockConfig.time,
          show: this.config.showClock,
        },
      };
    },
    getTimeText(clockConfig = this.clockConfig) {
      return getCurrentTimeText(
        clockConfig.showSeconds,
        clockConfig.hourFormat,
      );
    },
    selectFont(fontId) {
      this.clockConfig.font = fontId;
    },
    toggleShowSeconds() {
      this.clockConfig.showSeconds = !this.clockConfig.showSeconds;
    },
    setHourFormat(hourFormat) {
      this.clockConfig.hourFormat = hourFormat;
    },
    handleTimeAdjust(key, delta, min, max) {
      const currentValue = this.clockConfig.time[key];
      const nextValue = Math.max(min, Math.min(max, currentValue + delta));
      if (nextValue !== currentValue) {
        this.clockConfig.time[key] = nextValue;
      }
    },
    handleTimeColor(color) {
      this.clockConfig.time.color = color;
    },
    handleTimeAlign(align) {
      this.clockConfig.time.align = align;
      if (align === "left") {
        this.clockConfig.time.x = 0;
      } else if (align === "center") {
        this.clockConfig.time.x = 32;
      } else if (align === "right") {
        this.clockConfig.time.x = 63;
      }
    },
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      };
    },
    buildTetrisClockPayload(clockConfig = this.buildEffectiveClockConfig()) {
      const timeText = this.getTimeText(clockConfig);
      let timeX = clockConfig.time.x;

      if (clockConfig.time.align === "center") {
        timeX =
          timeX -
          Math.floor(
            getClockTextWidth(
              timeText,
              clockConfig.font,
              clockConfig.time.fontSize,
            ) / 2,
          );
      } else if (clockConfig.time.align === "right") {
        timeX =
          timeX -
          getClockTextWidth(
            timeText,
            clockConfig.font,
            clockConfig.time.fontSize,
          );
      }

      return {
        font: clockConfig.font,
        showSeconds: clockConfig.showSeconds,
        hourFormat: clockConfig.hourFormat,
        time: {
          show: clockConfig.time.show,
          fontSize: clockConfig.time.fontSize,
          x: timeX,
          y: clockConfig.time.y,
          color: this.hexToRgb(clockConfig.time.color),
        },
        date: {
          show: clockConfig.date.show,
          fontSize: clockConfig.date.fontSize,
          x: clockConfig.date.x,
          y: clockConfig.date.y,
          color: this.hexToRgb(clockConfig.date.color),
        },
        week: {
          show: clockConfig.week.show,
          x: clockConfig.week.x,
          y: clockConfig.week.y,
          color: this.hexToRgb(clockConfig.week.color),
        },
        image: {
          show: clockConfig.image.show,
          x: clockConfig.image.x,
          y: clockConfig.image.y,
          width: clockConfig.image.width,
          height: clockConfig.image.height,
        },
      };
    },
    async saveAndApply() {
      if (!this.guardBeforeSend(this.deviceStore.connected)) {
        return;
      }

      const nextConfig = {
        clearMode: this.config.clearMode,
        cellSize: this.config.cellSize,
        speed: this.config.speed,
        showClock: this.config.showClock,
        pieces: cloneAllTetrisPieces(),
      };
      const nextClockConfig = this.buildEffectiveClockConfig();
      this.config = nextConfig;
      this.clockConfig = nextClockConfig;
      setStorage(TETRIS_CONFIG_STORAGE_KEY, nextConfig);
      setStorage(
        TETRIS_OVERLAY_CLOCK_CONFIG_STORAGE_KEY,
        nextClockConfig,
      );

      const previousMode = this.deviceStore.deviceMode;
      this.beginSendUi();
      try {
        const ws = this.deviceStore.getWebSocket();
        await ws.startTetris({
          config: this.buildTetrisClockPayload(nextClockConfig),
          clearMode: nextConfig.clearMode,
          cellSize: nextConfig.cellSize,
          speed: TETRIS_SPEED_OPTIONS[nextConfig.speed],
          showClock: nextConfig.showClock,
          pieces: nextConfig.pieces,
        });
        this.showSendSuccess("宸插簲鐢?")";"
      } catch (err) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode: "tetris",
        });
        console.error("鍙戦€佸け璐?", err);
        this.showSendFailure(err);
      } finally {
        this.endSendUi();
      }
    },
  },
};
</script>

<style scoped>
.tetris-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  overflow: hidden;
}

.status-bar {
  background-color: #1a1a1a;
}

.preview-caption-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.content {
  flex: 1;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: var(--bg-tertiary);
  padding: 16rpx 20rpx 0;
}

.content-wrapper {
  padding: 0 0 56rpx;
}

.tetris-section-card {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.option-row-double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.option-row-triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  box-sizing: border-box;
}

.option-btn.glx-feature-option.active {
  background: var(--nb-yellow) !important;
  border-color: var(--nb-ink) !important;
  color: var(--nb-ink) !important;
}

.option-btn.glx-feature-option.active text {
  color: var(--nb-ink) !important;
  font-weight: 900 !important;
}

.bottom-tabs {
  display: flex;
  flex-shrink: 0;
  padding: 2rpx 10rpx 0;
  padding-bottom: var(--layout-bottom-offset);
  background-color: var(--bg-elevated);
  border-top: 2rpx solid var(--nb-ink);
  gap: 2rpx;
}

.bottom-tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  min-height: 68rpx;
  padding: 2rpx 0;
  background-color: transparent;
}

.bottom-tab-item:active {
  background-color: transparent;
}

.bottom-tab-item.active {
  background-color: transparent;
}

.bottom-tab-item.active .bottom-tab-text {
  color: #000000;
  font-weight: 900;
  font-size: 22rpx;
}

.bottom-tab-text {
  font-size: 20rpx;
  color: var(--text-secondary);
}
</style>
