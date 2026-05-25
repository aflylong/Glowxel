<!-- AUTO-CONVERTED FROM uniapp/pages/led-matrix/led-matrix.vue -->
<template>
  <div class="led-matrix-page glx-page-shell">
    

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">像素场景集</span>
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
          :grid-visible="previewGridVisible"
          :is-dark-mode="true"
          :touch-enabled="false"
          canvas-id="ledMatrixPreviewCanvas"
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
      <div class="preview-caption glx-preview-panel">
        <div class="preview-caption-info glx-preview-panel__info">
          <span class="preview-title">预览效果</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending }"
            @click="saveAndApply"
          >
            <Icon name="link" :size="36" color="var(--nb-ink)" />
            <span>发送</span>
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
        <div class="tab-panel glx-tab-panel">
          <div class="card glx-panel-card glx-editor-card">
            <div class="card-title-section glx-panel-head">
              <span class="card-title glx-panel-title">场景选择</span>
            </div>
            <div class="demo-grid">
              <div
                v-for="item in demos"
                :key="item.id"
                class="glx-feature-option glx-feature-option--scene"
                :class="{ active: selectedDemoId === item.id }"
                @click="handleDemoSelect(item.id)"
              >
                <span class="glx-feature-option__label">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="tab-panel glx-tab-panel">
          <div class="card glx-panel-card glx-editor-card">
            <div class="card-title-section glx-panel-head">
              <span class="card-title glx-panel-title">参数</span>
            </div>
            <div v-if="showSpeedControl" class="form-row">
              <span class="form-label">速度 {{ speed }}</span>
              <GlxStepper :value="speed" :min="1" :max="10" :step="1" @change="handleSpeedChange" />
            </div>
            <div v-if="showDensityControl" class="form-row">
              <span class="form-label">密度 {{ density }}</span>
              <GlxSlider :value="density" :min="10" :max="100" :step="1" @change="handleDensityChange" />
            </div>
            <div v-if="showIntensityControl" class="form-row">
              <span class="form-label">强度 {{ intensity }}</span>
              <GlxSlider :value="intensity" :min="10" :max="100" :step="1" @change="handleIntensityChange" />
            </div>
            <div v-if="showColorControl" class="form-row color-picker-row">
              <span class="form-label">颜色</span>
              <ColorPanelPicker
                :value="color"
                label="雨滴颜色"
                :preset-colors="rainPresetColors"
                @change="handleRainColorChange"
              />
            </div>
            <div v-if="!hasParameterControl" class="empty-state-text">
              这个场景没有可调参数，直接预览后发送即可。
            </div>
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
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import statusBarMixin from "@/mixins/statusBar.js";
import deviceSendUxMixin from "@/mixins/deviceSendUxMixin.js";
import Icon from "@/components/uni/Icon.vue";
import Toast from "@/components/uni/Toast.vue";
import GlxInlineLoader from "@/components/uni/GlxInlineLoader.vue";
import PixelCanvas from "@/components/uni/PixelCanvas.vue";
import PixelPreviewBoard from "@/components/uni/PixelPreviewBoard.vue";
import GlxSlider from "@/components/uni/GlxSlider.vue";
import GlxStepper from "@/components/uni/GlxStepper.vue";
import ColorPanelPicker from "@/components/uni/ColorPanelPicker.vue";
import { useDeviceStore } from "@/stores/device.js";
import { useToast } from "@/composables/useToast.js";
import {
  buildLedMatrixPreviewSequence,
  buildLedMatrixSendPlan,
  getLedMatrixDemoItems,
} from "@/utils/ledMatrixShowcase.js";

const LED_MATRIX_CONFIG_KEY = "led_matrix_showcase_config";

export default {
  mixins: [uniLifecycleAdapter, statusBarMixin, deviceSendUxMixin],
  components: {
    Icon,
    Toast,
    GlxInlineLoader,
    PixelCanvas,
    PixelPreviewBoard,
    GlxSlider,
    GlxStepper,
    ColorPanelPicker,
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
      previewFrameMaps: [],
      sendingPreviewPixels: new Map(),
      sendingPreviewTick: 0,
      previewFrameDelays: [],
      previewFrameIndex: 0,
      previewTimer: null,
      previewRefreshTimer: null,
      demos: getLedMatrixDemoItems(),
      selectedDemoId: "starfield",
      speed: 6,
      intensity: 72,
      density: 72,
      color: "#64c8ff",
      rainPresetColors: [
        { hex: "#64c8ff" },
        { hex: "#89dcff" },
        { hex: "#36cfff" },
        { hex: "#7fd8ff" },
        { hex: "#8ee7f2" },
        { hex: "#4f7fff" },
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
    selectedDemo() {
      const matched = this.demos.find((item) => item.id === this.selectedDemoId);
      return matched || null;
    },
    showSpeedControl() {
      if (!this.selectedDemo) {
        return true;
      }
      const speedEnabledIds = [
        "starfield",
        "digital_rain",
        "neon_tunnel",
        "boids",
        "falling_sand",
        "rain",
        "sparks",
        "reaction_diffusion",
      ];
      return speedEnabledIds.includes(this.selectedDemo.id);
    },
    showIntensityControl() {
      if (!this.selectedDemo) {
        return true;
      }
      const intensityEnabledIds = [
        "boids",
        "falling_sand",
        "sparks",
        "game_of_life",
        "julia_set",
        "reaction_diffusion",
        "wave_pattern",
        "watermelon_plasma",
      ];
      return intensityEnabledIds.includes(this.selectedDemo.id);
    },
    showDensityControl() {
      return this.selectedDemo && this.selectedDemo.id === "rain";
    },
    showColorControl() {
      return this.selectedDemo && this.selectedDemo.id === "rain";
    },
    hasParameterControl() {
      return this.showSpeedControl || this.showIntensityControl || this.showDensityControl || this.showColorControl;
    },
    previewCanvasBoxStyle() {
      const size = this.previewContainerSize && this.previewContainerSize.height
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
    selectedDemoId() {
      this.resetPreviewFrames();
      this.schedulePreviewRefresh();
    },
    speed() {
      this.schedulePreviewRefresh();
    },
    intensity() {
      this.schedulePreviewRefresh();
    },
    density() {
      this.schedulePreviewRefresh();
    },
    color() {
      this.schedulePreviewRefresh();
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
    handleBack() {
      uni.navigateBack();
    },
    initPreviewCanvas() {
      const systemInfo = uni.getSystemInfoSync();
      const statusBarHeight = systemInfo.statusBarHeight || 0;

      this.$nextTick(() => {
        setTimeout(() => {
          const query = uni.createSelectorQuery().in(this);
          query.select(".canvas-section").boundingClientRect((sectionRect) => {
            if (!sectionRect || !sectionRect.height) {
              return;
            }
            const nextHeight =
              systemInfo.windowHeight - statusBarHeight - 88 - sectionRect.height;
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
    frameToPixelMap(frame) {
      const map = new Map();
      if (!frame || !(frame.pixels instanceof Uint8Array)) {
        return map;
      }
      for (let index = 0; index < frame.pixels.length; index += 5) {
        const x = frame.pixels[index];
        const y = frame.pixels[index + 1];
        const r = frame.pixels[index + 2];
        const g = frame.pixels[index + 3];
        const b = frame.pixels[index + 4];
        map.set(`${x},${y}`, `rgb(${r}, ${g}, ${b})`);
      }
      return map;
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
      const previewSequence = buildLedMatrixPreviewSequence({
        demoId: this.selectedDemoId,
        speed: this.speed,
        intensity: this.intensity,
        density: this.density,
        color: this.color,
      });
      this.previewFrameMaps = Array.isArray(previewSequence.maps) ? previewSequence.maps : [];
      this.previewFrameDelays = Array.isArray(previewSequence.delays) ? previewSequence.delays : [];
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
    handleDemoSelect(demoId) {
      this.selectedDemoId = demoId;
    },
    handleSpeedChange(event) {
      this.speed = Number(event.detail.value);
    },
    handleIntensityChange(event) {
      this.intensity = Number(event.detail.value);
    },
    handleDensityChange(event) {
      this.density = Number(event.detail.value);
    },
    handleRainColorChange(value) {
      this.color = value;
    },
    loadSavedConfig() {
      const saved = uni.getStorageSync(LED_MATRIX_CONFIG_KEY);
      if (!saved || typeof saved !== "object") {
        return;
      }
      if (typeof saved.demoId === "string") {
        const exists = this.demos.some((item) => item.id === saved.demoId);
        if (exists) {
          this.selectedDemoId = saved.demoId;
        }
      }
      if (Number.isFinite(Number(saved.speed))) {
        this.speed = Number(saved.speed);
      }
      if (Number.isFinite(Number(saved.intensity))) {
        this.intensity = Number(saved.intensity);
      }
      if (Number.isFinite(Number(saved.density))) {
        this.density = Number(saved.density);
      }
      if (typeof saved.color === "string") {
        this.color = saved.color;
      }
    },
    saveConfig() {
      uni.setStorageSync(LED_MATRIX_CONFIG_KEY, {
        demoId: this.selectedDemoId,
        speed: this.speed,
        intensity: this.intensity,
        density: this.density,
        color: this.color,
      });
    },
    async saveAndApply() {
      if (!this.guardBeforeSend(this.deviceStore.connected)) {
        return;
      }

      const previousMode = this.deviceStore.deviceMode;
      let expectedMode = "led_matrix_showcase";
      this.beginSendUi();
      try {
        const ws = this.deviceStore.getWebSocket();
        const sendPlan = buildLedMatrixSendPlan({
          demoId: this.selectedDemoId,
          speed: this.speed,
          intensity: this.intensity,
          density: this.density,
          color: this.color,
        });
        if (sendPlan.type !== "command") {
          throw new Error("LED 演示集仅支持板载原生命令");
        }
        expectedMode = sendPlan.deviceMode;

        if (sendPlan.command.cmd === "set_ambient_effect") {
          await ws.setAmbientEffect(sendPlan.command);
        } else if (
          sendPlan.command.cmd === "set_mode" &&
          sendPlan.command.mode === "tetris"
        ) {
          await ws.startTetris({
            clearMode: sendPlan.command.clearMode,
            cellSize: sendPlan.command.cellSize,
            speed: sendPlan.command.speed,
            showClock: sendPlan.command.showClock,
            pieces: sendPlan.command.pieces,
          });
        } else {
          throw new Error("未支持的像素场景发送命令");
        }

        this.saveConfig();
        this.showSendSuccess();
      } catch (error) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode,
        });
        console.error("发送 LED Matrix 演示失败:", error);
        this.showSendFailure(error);
      } finally {
        this.endSendUi();
      }
    },
  },
};
</script>

<style scoped>
.led-matrix-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  overflow: hidden;
}

.status-bar {
  background-color: #1a1a1a;
}

.preview-title {
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

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.empty-state-text {
  margin-top: 12rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}

.card {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
}

.color-picker-row {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

</style>
