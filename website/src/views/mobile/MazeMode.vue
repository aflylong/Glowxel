<!-- AUTO-CONVERTED FROM uniapp/pages/maze-mode/maze-mode.vue -->
<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">杩峰婕父</span>
      <div class="nav-right"></div>
    </div>

    <div class="canvas-section">
      <div class="preview-canvas-container" :style="previewCanvasBoxStyle">
        <PixelPreviewBoard
          v-if="previewCanvasReady && !shouldShowSendingSnapshot"
          :width="64"
          :height="64"
          :pixels="currentPreviewPixels"
          :zoom="previewZoom"
          :offset-x="previewOffset.x"
          :offset-y="previewOffset.y"
          :grid-visible="previewGridVisible"
          :is-dark-mode="true"
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
          :grid-visible="previewGridVisible"
          :is-dark-mode="true"
        />
      </div>
      <div class="preview-caption">
        <div class="preview-caption-info">
          <span class="preview-caption-title">棰勮鏁堟灉</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary"
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
        <!-- 棰滆壊璋冩暣 UI 宸查殣钘忥紙榛樿閰嶈壊宸插鐢級 -->
        <div v-if="false" class="maze-section">
          <div class="maze-section-head">
            <span class="maze-section-title">淇℃伅妗?</span>
          </div>
          <div class="form-row color-picker-row">
            <span class="form-label">鑳屾櫙棰滆壊</span>
            <ColorPanelPicker
              :value="config.panelBgColor"
              label="鑳屾櫙棰滆壊"
              :preset-colors="panelPresetColors"
              @change="handleColorChange('panelBgColor', $event)"
            />
          </div>
          <div class="form-row color-picker-row">
            <span class="form-label">杈规棰滆壊</span>
            <ColorPanelPicker
              :value="config.borderColor"
              label="杈规棰滆壊"
              :preset-colors="borderPresetColors"
              @change="handleColorChange('borderColor', $event)"
            />
          </div>
          <div class="form-row color-picker-row">
            <span class="form-label">鏃堕棿棰滆壊</span>
            <ColorPanelPicker
              :value="config.timeColor"
              label="鏃堕棿棰滆壊"
              :preset-colors="textPresetColors"
              @change="handleColorChange('timeColor', $event)"
            />
          </div>
          <div class="form-row color-picker-row">
            <span class="form-label">鏈堜唤/鏃ユ湡棰滆壊</span>
            <ColorPanelPicker
              :value="config.dateColor"
              label="鏈堜唤/鏃ユ湡棰滆壊"
              :preset-colors="textPresetColors"
              @change="handleColorChange('dateColor', $event)"
            />
          </div>
        </div>

        <div v-if="false" class="maze-section">
          <div class="maze-section-head">
            <span class="maze-section-title">鐢熸垚涓庡璺?</span>
          </div>
          <div class="form-row color-picker-row">
            <span class="form-label">鐢熸垚闃舵璺緞棰滆壊</span>
            <ColorPanelPicker
              :value="config.generationPathColor"
              label="鐢熸垚闃舵璺緞棰滆壊"
              :preset-colors="stagePresetColors"
              @change="handleColorChange('generationPathColor', $event)"
            />
          </div>
          <div class="form-row color-picker-row">
            <span class="form-label">瀵昏矾宸叉悳绱㈤鑹?</span>
            <ColorPanelPicker
              :value="config.searchVisitedColor"
              label="瀵昏矾宸叉悳绱㈤鑹?"
              :preset-colors="stagePresetColors"
              @change="handleColorChange('searchVisitedColor', $event)"
            />
          </div>
          <div class="form-row color-picker-row">
            <span class="form-label">瀵昏矾寰呮悳绱㈤鑹?</span>
            <ColorPanelPicker
              :value="config.searchFrontierColor"
              label="瀵昏矾寰呮悳绱㈤鑹?"
              :preset-colors="stagePresetColors"
              @change="handleColorChange('searchFrontierColor', $event)"
            />
          </div>
        </div>

        <div v-if="false" class="maze-section">
          <div class="maze-section-head">
            <span class="maze-section-title">瀹屾垚璺緞</span>
          </div>
          <div class="form-row color-picker-row">
            <span class="form-label">鏈€缁堣矾寰勮捣濮嬭壊</span>
            <ColorPanelPicker
              :value="config.solvedPathStartColor"
              label="鏈€缁堣矾寰勮捣濮嬭壊"
              :preset-colors="stagePresetColors"
              @change="handleColorChange('solvedPathStartColor', $event)"
            />
          </div>
          <div class="form-row color-picker-row">
            <span class="form-label">鏈€缁堣矾寰勭粨鏉熻壊</span>
            <ColorPanelPicker
              :value="config.solvedPathEndColor"
              label="鏈€缁堣矾寰勭粨鏉熻壊"
              :preset-colors="stagePresetColors"
              @change="handleColorChange('solvedPathEndColor', $event)"
            />
          </div>
        </div>
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
import { getSystemInfo, createDomQuery, navigateBack } from '@/utils/browser-platform.js'
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import statusBarMixin from "@/mixins/statusBar.js";
import deviceSendUxMixin from "@/mixins/deviceSendUxMixin.js";
import Icon from "@/components/uni/Icon.vue";
import Toast from "@/components/uni/Toast.vue";
import GlxInlineLoader from "@/components/uni/GlxInlineLoader.vue";
import PixelPreviewBoard from "@/components/uni/PixelPreviewBoard.vue";
import ColorPanelPicker from "@/components/uni/ColorPanelPicker.vue";
import { useDeviceStore } from "@/stores/device.js";
import { useToast } from "@/composables/useToast.js";
import { buildLedMatrixPreviewSequence } from "@/utils/ledMatrixShowcase.js";
import {
  cloneMazeModeConfig,
  createDefaultMazeModeConfig,
  createMazeModeConfig,
  readSavedMazeModeConfig,
  writeSavedMazeModeConfig,
} from "@/utils/mazeModeConfig.js";

export default {
  mixins: [uniLifecycleAdapter, statusBarMixin, deviceSendUxMixin],
  components: {
    Icon,
    Toast,
    GlxInlineLoader,
    PixelPreviewBoard,
    ColorPanelPicker,
  },
  data() {
    const defaultConfig = createDefaultMazeModeConfig();
    return {
      deviceStore: null,
      toast: null,
      contentHeight: "calc(100vh - 88rpx - 520rpx)",
      previewCanvasReady: false,
      previewZoom: 4,
      previewOffset: { x: 0, y: 0 },
      previewContainerSize: { width: 320, height: 320 },
      previewFrameMaps: [],
      sendingPreviewPixels: new Map(),
      sendingPreviewTick: 0,
      previewFrameDelays: [],
      previewFrameIndex: 0,
      previewTimer: null,
      previewRefreshTimer: null,
      config: cloneMazeModeConfig(defaultConfig),
      panelPresetColors: [
        { hex: "#05070f" },
        { hex: "#0c1220" },
        { hex: "#101826" },
        { hex: "#16161b" },
        { hex: "#1c2430" },
        { hex: "#2a1d12" },
      ],
      borderPresetColors: [
        { hex: "#182c4c" },
        { hex: "#1d3b66" },
        { hex: "#20528a" },
        { hex: "#2c4f7c" },
        { hex: "#44618e" },
        { hex: "#7c3aed" },
      ],
      textPresetColors: [
        { hex: "#ffd400" },
        { hex: "#ffe066" },
        { hex: "#ff6464" },
        { hex: "#ff8fab" },
        { hex: "#7dd3fc" },
        { hex: "#ffffff" },
      ],
      stagePresetColors: [
        { hex: "#4f4f55" },
        { hex: "#70ff9c" },
        { hex: "#ff4444" },
        { hex: "#1a60ff" },
        { hex: "#42bcff" },
        { hex: "#ffd166" },
      ],
    };
  },
  computed: {
    currentPreviewPixels() {
      if (this.previewFrameMaps.length === 0) {
        return new Map();
      }
      if (this.previewFrameIndex >= this.previewFrameMaps.length) {
        return this.previewFrameMaps[0];
      }
      return this.previewFrameMaps[this.previewFrameIndex];
    },
    previewCanvasBoxStyle() {
      const size =
        this.previewContainerSize && this.previewContainerSize.height
          ? this.previewContainerSize.height
          : 320;
      return {
        height: `${size}px`,
      };
    },
    previewGridVisible() {
      return true;
    },
  },
  watch: {
    config: {
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
    this.loadSavedConfig();
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
    applyConfig(config) {
      const nextConfig = createMazeModeConfig(config);
      if (!nextConfig) {
        return;
      }
      this.config = cloneMazeModeConfig(nextConfig);
    },
    buildCurrentConfig() {
      return createMazeModeConfig(this.config);
    },
    handleBack() {
      navigateBack();
    },
    handleColorChange(field, value) {
      this.config = {
        ...this.config,
        [field]: value,
      };
    },
    loadSavedConfig() {
      const savedConfig = readSavedMazeModeConfig();
      if (savedConfig) {
        this.applyConfig(savedConfig);
        return;
      }
      this.applyConfig(createDefaultMazeModeConfig());
    },
    saveConfig() {
      const currentConfig = this.buildCurrentConfig();
      if (!currentConfig) {
        throw new Error("杩峰棰滆壊閰嶇疆鏃犳晥");
      }
      this.config = writeSavedMazeModeConfig(currentConfig);
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
            .boundingClientRect((data) => {
              if (!data || !data.width) {
                this.previewCanvasReady = true;
                this.schedulePreviewRefresh();
                return;
              }
              const fitZoom = Math.max(2, Math.floor((data.width * 0.96) / 64));
              this.previewContainerSize = {
                width: data.width,
                height: data.width,
              };
              this.previewZoom = fitZoom;
              this.previewOffset = {
                x: (data.width - 64 * fitZoom) / 2,
                y: (data.width - 64 * fitZoom) / 2,
              };
              this.previewCanvasReady = true;
              this.schedulePreviewRefresh();
            })
            .exec();
        }, 80);
      });
    },
    resetPreviewFrames() {
      this.stopPreviewPlayback();
      this.previewFrameMaps = [];
      this.previewFrameDelays = [];
      this.previewFrameIndex = 0;
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
        this.refreshPreviewFrames();
      }, 100);
    },
    refreshPreviewFrames() {
      const currentConfig = this.buildCurrentConfig();
      if (!currentConfig) {
        this.resetPreviewFrames();
        return;
      }
      const previewSequence = buildLedMatrixPreviewSequence({
        demoId: "maze",
        speed: currentConfig.speed,
        mazeSizeMode: currentConfig.mazeSizeMode,
        showClock: currentConfig.showClock,
        panelBgColor: currentConfig.panelBgColor,
        borderColor: currentConfig.borderColor,
        timeColor: currentConfig.timeColor,
        dateColor: currentConfig.dateColor,
        generationPathColor: currentConfig.generationPathColor,
        searchVisitedColor: currentConfig.searchVisitedColor,
        searchFrontierColor: currentConfig.searchFrontierColor,
        solvedPathStartColor: currentConfig.solvedPathStartColor,
        solvedPathEndColor: currentConfig.solvedPathEndColor,
      });
      this.previewFrameMaps = Array.isArray(previewSequence.maps)
        ? previewSequence.maps
        : [];
      this.previewFrameDelays = Array.isArray(previewSequence.delays)
        ? previewSequence.delays
        : [];
      this.previewFrameIndex = 0;
      this.startPreviewPlayback();
    },
    startPreviewPlayback() {
      this.stopPreviewPlayback();
      if (this.previewFrameMaps.length <= 1) {
        return;
      }
      const playNext = () => {
        const currentDelay = this.previewFrameDelays[this.previewFrameIndex];
        const delay = typeof currentDelay === "number" ? currentDelay : 120;
        this.previewTimer = setTimeout(() => {
          if (this.previewFrameMaps.length === 0) {
            return;
          }
          this.previewFrameIndex =
            this.previewFrameIndex + 1 >= this.previewFrameMaps.length
              ? 0
              : this.previewFrameIndex + 1;
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
    },
    async saveAndApply() {
      if (!this.guardBeforeSend(this.deviceStore.connected)) {
        return;
      }

      const previousMode = this.deviceStore.deviceMode;
      this.beginSendUi();
      try {
        const currentConfig = this.buildCurrentConfig();
        if (!currentConfig) {
          throw new Error("杩峰棰滆壊閰嶇疆鏃犳晥");
        }
        const ws = this.deviceStore.getWebSocket();
        await ws.startMaze(currentConfig);
        this.saveConfig();
        this.showSendSuccess();
      } catch (error) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode: "maze",
        });
        console.error("鍙戦€佽糠瀹极娓稿け璐?", error);
        this.showSendFailure(error);
      } finally {
        this.endSendUi();
      }
    },
  },
};
</script>

<style scoped>
.clock-editor-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  overflow: hidden;
}

.status-bar {
  background-color: #1a1a1a;
}

.canvas-section {
  display: flex;
  flex-direction: column;
  background: #000;
}

.preview-canvas-container {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000000;
}

.canvas-placeholder {
  width: 100%;
  height: 100%;
  background: #000000;
}

.preview-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  padding: 10rpx 16rpx 12rpx;
  background: var(--bg-tertiary);
}

.preview-caption-info {
  flex: 1;
  min-width: 0;
}

.preview-caption-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.action-btn-sm {
  width: auto;
  min-width: 118rpx;
  height: 64rpx;
  padding: 0 18rpx;
  gap: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--nb-ink);
  background-color: var(--bg-tertiary);
}

.action-btn-sm.primary {
  background-color: var(--nb-yellow);
  border-color: var(--nb-ink);
}

.action-btn-sm text {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.action-btn-sm.primary text {
  color: #000000;
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
  display: flex;
  flex-direction: column;
  gap: 26rpx;
  padding-bottom: calc(44rpx + env(safe-area-inset-bottom));
}

.maze-section {
  display: flex;
  flex-direction: column;
}

.maze-section-head {
  display: flex;
  align-items: center;
  margin-bottom: 6rpx;
}

.maze-section-title {
  color: var(--nb-ink);
  font-size: 24rpx;
  line-height: 1.15;
  font-weight: 800;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.color-picker-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
</style>
