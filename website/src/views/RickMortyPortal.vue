<!-- AUTO-CONVERTED FROM uniapp/pages/rick-morty-portal/rick-morty-portal.vue -->
<template>
  <div class="portal-page glx-page-shell game-mode-page">
    <PcModeTopbar title="传送门" />

    <section class="portal-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack portal-preview-card game-preview-card"
      >
        <div class="portal-preview-card__head">
          <div>
            <p class="portal-preview-card__eyebrow">Device Mode</p>
            <h2 class="portal-preview-card__title">传送门预览</h2>
          </div>
          <span
            class="portal-rotate-badge"
            :class="config.autoRotate.enabled ? 'portal-rotate-badge--on' : 'portal-rotate-badge--off'"
          >{{ autoRotateStatusText }}</span>
        </div>

        <div class="portal-preview-toolbar">
          <div class="portal-preview-toolbar__actions">
            <button
              type="button"
              class="glx-button glx-button--primary portal-send-button"
              :disabled="isSending"
              @click="handleSend"
            >
              {{ isSending ? "发送中..." : "发送到设备" }}
            </button>
          </div>
          <span
            class="glx-chip"
            :class="isDeviceConnected ? 'glx-chip--green' : 'glx-chip--yellow'"
          >
            {{ isDeviceConnected ? "已连接" : "未连接" }}
          </span>
        </div>

        <div class="portal-preview-stage game-preview-stage">
          <div class="preview-canvas-container portal-preview-board" :style="previewCanvasBoxStyle">
            <PixelPreviewBoard
              v-if="previewCanvasReady && !shouldShowSendingSnapshot"
              :width="64"
              :height="64"
              :pixels="currentPreviewPixels"
              :refresh-token="previewRefreshTick"
              :zoom="previewZoom"
              :offset-x="previewOffset.x"
              :offset-y="previewOffset.y"
              :grid-visible="true"
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
              :grid-visible="true"
              :is-dark-mode="true"
            />
          </div>
        </div>

        <div class="portal-summary-grid">
          <article class="portal-summary-card">
            <span class="portal-summary-card__label">主题颜色</span>
            <strong class="portal-summary-card__value">{{ selectedColorLabel }}</strong>
            <span class="portal-summary-card__meta">{{ config.preset }}</span>
          </article>
          <article class="portal-summary-card">
            <span class="portal-summary-card__label">传送门大小</span>
            <strong class="portal-summary-card__value">{{ selectedSizeLabel }}</strong>
            <span class="portal-summary-card__meta">{{ config.portalX }}, {{ config.portalY }}</span>
          </article>
          <article class="portal-summary-card">
            <span class="portal-summary-card__label">时间显示</span>
            <strong class="portal-summary-card__value">
              {{ clockConfig.time.show ? "已开启" : "已关闭" }}
            </strong>
            <span class="portal-summary-card__meta">{{ clockConfig.showSeconds ? "显示秒钟" : "隐藏秒钟" }}</span>
          </article>
          <article class="portal-summary-card portal-summary-card--rotate">
            <span class="portal-summary-card__label">随机轮播</span>
            <strong class="portal-summary-card__value">{{ autoRotateStatusText }}</strong>
            <span class="portal-summary-card__meta">{{ autoRotateIntervalLabel }}</span>
          </article>
        </div>
      </article>

      <div class="portal-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">模式配置</h2>
            <span class="glx-section-meta">传送门 / 时间</span>
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabItems" />
        </article>

        <template v-if="currentTab === 0">
          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">传送门颜色</h2>
              <span class="glx-section-meta">{{ colorOptions.length }} 个预设</span>
            </div>

            <div class="portal-option-grid">
              <button
                v-for="option in colorOptions"
                :key="option.id"
                type="button"
                class="portal-option-card"
                :class="{ 'is-active': config.preset === option.id }"
                @click="handleColorSelect(option.id)"
              >
                <strong>{{ option.label }}</strong>
              </button>
            </div>
            <span class="portal-rotate-note">
              {{ config.autoRotate.enabled ? `当前按 ${autoRotateIntervalLabel} 随机切换三种颜色` : "当前固定显示手动选择的颜色" }}
            </span>
          </article>

          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">参数</h2>
              <span class="glx-section-meta">位置 / 大小</span>
            </div>

            <div class="portal-setting-row">
              <span class="portal-setting-row__label">水平位置 {{ config.portalX }}</span>
              <GlxStepper
                :value="config.portalX"
                :min="0"
                :max="63"
                :step="1"
                @change="handlePortalXChange"
              />
            </div>

            <div class="portal-setting-row">
              <span class="portal-setting-row__label">垂直位置 {{ config.portalY }}</span>
              <GlxStepper
                :value="config.portalY"
                :min="0"
                :max="63"
                :step="1"
                @change="handlePortalYChange"
              />
            </div>

            <button
              type="button"
              class="glx-button glx-button--ghost portal-center-button"
              :disabled="isSending"
              @click="handlePortalCenter"
            >
              快速居中
            </button>

            <!-- <div class="portal-block">
              <span class="portal-block__label">传送门大小</span>
              <div class="portal-option-grid">
                <button
                  v-for="option in sizeOptions"
                  :key="option.id"
                  type="button"
                  class="portal-option-card"
                  :class="{ 'is-active': config.size === option.id }"
                  @click="handleSizeSelect(option.id)"
                >
                  <strong>{{ option.label }}</strong>
                </button>
              </div>
            </div> -->

            <div class="portal-block portal-rotate-panel">
              <div class="portal-rotate-panel__head">
                <span class="portal-block__label">随机轮播</span>
                <span
                  class="portal-rotate-badge"
                  :class="config.autoRotate.enabled ? 'portal-rotate-badge--on' : 'portal-rotate-badge--off'"
                >{{ autoRotateStatusText }}</span>
              </div>
              <div class="portal-option-grid portal-option-grid--double">
                <button
                  type="button"
                  class="portal-option-card"
                  :class="{ 'is-active': config.autoRotate.enabled }"
                  @click="setAutoRotateEnabled(true)"
                >
                  <strong>开启</strong>
                </button>
                <button
                  type="button"
                  class="portal-option-card"
                  :class="{ 'is-active': !config.autoRotate.enabled }"
                  @click="setAutoRotateEnabled(false)"
                >
                  <strong>关闭</strong>
                </button>
              </div>
              <div class="portal-option-grid portal-option-grid--intervals">
                <button
                  v-for="option in rotateIntervalOptions"
                  :key="option.value"
                  type="button"
                  class="portal-option-card"
                  :class="{ 'is-active': config.autoRotate.interval === option.value }"
                  @click="setAutoRotateInterval(option.value)"
                >
                  <strong>{{ option.label }}</strong>
                </button>
              </div>
            </div>
          </article>
        </template>

        <article
          v-else-if="currentTab === 1"
          class="glx-section-card glx-section-card--stack"
        >
          <ClockTextSettingsCard
            icon-name="time"
            title="时间显示"
            :section="clockConfig.time"
            :preset-colors="timeColorOptions"
            :show-font-size="true"
            :show-seconds-control="true"
            :show-seconds="clockConfig.showSeconds"
            :min-font-size="1"
            :max-font-size="3"
            @toggle="toggleTimeShow"
            @toggle-seconds="toggleTimeSeconds"
            @adjust="handleTimeAdjust"
            @update-color="handleTimeColor"
            @set-align="handleTimeAlign"
          />
        </article>

        <article v-else class="glx-section-card glx-section-card--stack portal-font-panel">
          <ClockFontPanel
            :font-options="timeFontOptions"
            :selected-font="clockConfig.font"
            :show-seconds="clockConfig.showSeconds"
            :hour-format="24"
            :show-hour-format="false"
            @select-font="handleTimeFontChange"
          />
        </article>
      </div>
    </section>

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

    <Toast ref="toastRef" @show="handleToastShow" @hide="handleToastHide" />
  </div>
</template>

<script>
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import deviceSendUxMixin from "@/mixins/deviceSendUxMixin.js";
import Toast from "@/components/uni/Toast.vue";
import GlxInlineLoader from "@/components/uni/GlxInlineLoader.vue";
import PixelPreviewBoard from "@/components/uni/PixelPreviewBoard.vue";
import GlxStepper from "@/components/uni/GlxStepper.vue";
import ClockFontPanel from "@/components/uni/clock-editor/ClockFontPanel.vue";
import ClockTextSettingsCard from "@/components/uni/clock-editor/ClockTextSettingsCard.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import { useDeviceStore } from "@/stores/device.js";
import { useToast } from "@/composables/useToast.js";
import {
  drawClockTextToPixels,
  getClockFontOptions,
  getClockTextHeight,
  getClockTextWidth,
  getCurrentTimeText,
} from "@/utils/clockCanvas.js";
import {
  PORTAL_PAGE_STORAGE_KEY,
  PORTAL_COLOR_OPTIONS,
  PORTAL_SIZE_OPTIONS,
  PORTAL_TIME_COLOR_OPTIONS,
  PORTAL_ROTATE_INTERVAL_OPTIONS,
  PORTAL_PREVIEW_PLAYBACK_INTERVAL_MS,
  createDefaultPortalPreviewConfig,
  createDefaultPortalClockConfig,
  normalizePortalPageState,
  isPortalRotateIntervalValue,
  buildPortalPreviewFrame,
  buildPortalPreviewSequence,
  resolvePortalPresetForPreview,
} from "@/utils/rickMortyPortalPreview.js";

const PORTAL_TIME_FONT_OPTIONS = getClockFontOptions();
const PORTAL_TIME_FONT_IDS = new Set(
  PORTAL_TIME_FONT_OPTIONS.map((item) => item.id),
);
const PORTAL_PRESET_IDS = new Set(PORTAL_COLOR_OPTIONS.map((item) => item.id));
const PORTAL_SIZE_IDS = new Set(PORTAL_SIZE_OPTIONS.map((item) => item.id));
// 传送门固定 60 秒生命周期(打开 → 旋涡 → 关闭),与板载渲染对齐
const PORTAL_CYCLE_DURATION_MS = 60000;
const PORTAL_PREVIEW_FRAME_COUNT = 48;

export default {
  mixins: [uniLifecycleAdapter, deviceSendUxMixin],
  components: {
    Toast,
    GlxInlineLoader,
    PixelPreviewBoard,
    GlxStepper,
    ClockFontPanel,
    ClockTextSettingsCard,
    PcModeTopbar,
    DeviceModeTabs,
  },
  data() {
    const config = createDefaultPortalPreviewConfig();
    return {
      deviceStore: null,
      toast: null,
      previewCanvasReady: false,
      previewZoom: 4,
      previewOffset: { x: 0, y: 0 },
      previewContainerSize: { width: 320, height: 320 },
      previewDisplayPixels: new Map(),
      previewRefreshTick: 0,
      sendingPreviewPixels: new Map(),
      sendingPreviewTick: 0,
      previewPlaybackStartedAt: 0,
      previewTimer: null,
      previewRefreshTimer: null,
      colorOptions: PORTAL_COLOR_OPTIONS,
      sizeOptions: PORTAL_SIZE_OPTIONS,
      rotateIntervalOptions: PORTAL_ROTATE_INTERVAL_OPTIONS,
      clockConfig: createDefaultPortalClockConfig(),
      timeFontOptions: PORTAL_TIME_FONT_OPTIONS,
      timeColorOptions: PORTAL_TIME_COLOR_OPTIONS,
      currentTab: 0,
      tabItems: [
        { value: 0, label: "传送门" },
        // { value: 1, label: "时间" },
        // { value: 2, label: "字体" },
      ],
      config,
    };
  },
  computed: {
    currentPreviewPixels() {
      return this.previewDisplayPixels;
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
    isDeviceConnected() {
      if (!this.deviceStore) {
        return false;
      }
      return this.deviceStore.isConnected;
    },
    selectedColorLabel() {
      const matched = this.colorOptions.find((item) => item.id === this.config.preset);
      return matched ? matched.label : "--";
    },
    selectedSizeLabel() {
      const matched = this.sizeOptions.find((item) => item.id === this.config.size);
      return matched ? matched.label : "--";
    },
    autoRotateStatusText() {
      return this.config.autoRotate.enabled ? "轮播已开启" : "轮播已关闭";
    },
    autoRotateIntervalLabel() {
      const matched = this.rotateIntervalOptions.find(
        (item) => item.value === this.config.autoRotate.interval,
      );
      return matched.label;
    },
  },
  watch: {
    config: {
      deep: true,
      handler() {
        this.persistLocalState();
      },
    },
    clockConfig: {
      deep: true,
      handler() {
        this.persistLocalState();
      },
    },
  },
  onLoad() {
    this.deviceStore = useDeviceStore();
    this.deviceStore.init();
    this.toast = useToast();
    const savedState = normalizePortalPageState(
      uni.getStorageSync(PORTAL_PAGE_STORAGE_KEY),
    );
    this.config = savedState.config;
    this.clockConfig = savedState.clockConfig;
  },
  onReady() {
    if (this.$refs.toastRef) {
      this.toast.setToastInstance(this.$refs.toastRef);
    }
    this.initPreviewCanvas();
  },
  async onShow() {
    if (this.previewCanvasReady) {
      this.startPreviewPlayback();
    }
    await this.syncConfigFromDeviceStatus();
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
    persistLocalState() {
      uni.setStorageSync(PORTAL_PAGE_STORAGE_KEY, {
        config: {
          preset: this.config.preset,
          size: this.config.size,
          portalX: this.config.portalX,
          portalY: this.config.portalY,
          autoRotate: {
            enabled: this.config.autoRotate.enabled,
            interval: this.config.autoRotate.interval,
          },
        },
        clockConfig: {
          font: this.clockConfig.font,
          showSeconds: this.clockConfig.showSeconds,
          time: {
            show: this.clockConfig.time.show,
            fontSize: this.clockConfig.time.fontSize,
            x: this.clockConfig.time.x,
            y: this.clockConfig.time.y,
            color: this.clockConfig.time.color,
            align: this.clockConfig.time.align,
          },
        },
      });
    },
    getPortalTimeText() {
      return getCurrentTimeText(this.clockConfig.showSeconds, 24);
    },
    getPortalTimeMetrics(text = this.getPortalTimeText()) {
      const fontSize = Math.max(
        1,
        Math.min(3, Number(this.clockConfig.time.fontSize) || 1),
      );
      return {
        fontSize,
        width: getClockTextWidth(text, this.clockConfig.font, fontSize),
        height: getClockTextHeight(this.clockConfig.font, fontSize),
      };
    },
    resolveAnchorTimeXFromBoardX(boardX, text = this.getPortalTimeText()) {
      const { width } = this.getPortalTimeMetrics(text);
      let anchorX = Number(boardX);
      if (!Number.isFinite(anchorX)) {
        return this.clockConfig.time.x;
      }
      if (this.clockConfig.time.align === "center") {
        anchorX += Math.floor(width / 2);
      } else if (this.clockConfig.time.align === "right") {
        anchorX += width;
      }
      if (anchorX < 0) {
        return 0;
      }
      if (anchorX > 63) {
        return 63;
      }
      return Math.round(anchorX);
    },
    rgbToHex(color) {
      if (!color || typeof color !== "object") {
        return "#ffffff";
      }
      const channels = ["r", "g", "b"].map((key) => {
        const value = Number(color[key]);
        const clamped = Number.isFinite(value)
          ? Math.max(0, Math.min(255, Math.round(value)))
          : 255;
        return clamped.toString(16).padStart(2, "0");
      });
      return `#${channels.join("")}`;
    },
    applyPortalStatus(status) {
      if (!status || typeof status !== "object") {
        return;
      }
      const {
        businessMode,
        preset,
        size,
        portalX: rawPortalX,
        portalY: rawPortalY,
        font,
        showSeconds,
        time,
        autoRotate,
      } = status;
      if (businessMode !== "rick_morty_portal") {
        return;
      }
      if (typeof preset !== "string" || typeof size !== "string") {
        return;
      }
      if (!time || typeof time !== "object") {
        return;
      }
      if (!time.color || typeof time.color !== "object") {
        return;
      }

      if (PORTAL_PRESET_IDS.has(preset)) {
        this.config.preset = preset;
      }
      if (PORTAL_SIZE_IDS.has(size)) {
        this.config.size = size;
      }
      const portalX = Number(rawPortalX);
      if (Number.isFinite(portalX)) {
        this.config.portalX = Math.max(0, Math.min(63, Math.round(portalX)));
      }
      const portalY = Number(rawPortalY);
      if (Number.isFinite(portalY)) {
        this.config.portalY = Math.max(0, Math.min(63, Math.round(portalY)));
      }
      if (autoRotate && typeof autoRotate === "object") {
        if (autoRotate.enabled === true || autoRotate.enabled === false) {
          this.config.autoRotate.enabled = autoRotate.enabled;
        }
        const interval = Number(autoRotate.interval);
        if (isPortalRotateIntervalValue(interval)) {
          this.config.autoRotate.interval = interval;
        }
      }

      if (PORTAL_TIME_FONT_IDS.has(font)) {
        this.clockConfig.font = font;
      }
      if (showSeconds === true || showSeconds === false) {
        this.clockConfig.showSeconds = showSeconds;
      }

      if (time.show === true || time.show === false) {
        this.clockConfig.time.show = time.show;
      }
      const fontSize = Number(time.fontSize);
      if (Number.isFinite(fontSize)) {
        this.clockConfig.time.fontSize = Math.max(
          1,
          Math.min(3, Math.round(fontSize)),
        );
      }
      const boardX = Number(time.x);
      if (Number.isFinite(boardX)) {
        this.clockConfig.time.x = this.resolveAnchorTimeXFromBoardX(
          boardX,
          this.getPortalTimeText(),
        );
      }
      const y = Number(time.y);
      if (Number.isFinite(y)) {
        this.clockConfig.time.y = Math.max(0, Math.min(63, Math.round(y)));
      }
      this.clockConfig.time.color = this.rgbToHex(time.color);

      if (this.previewCanvasReady) {
        this.schedulePreviewRefresh(this.getCurrentPreviewProgress());
      }
    },
    async syncConfigFromDeviceStatus() {
      if (!this.deviceStore || !this.deviceStore.connected) {
        return;
      }
      const status = await this.deviceStore.syncDeviceStatus();
      this.applyPortalStatus(status);
    },
    async handleSend() {
      if (!this.guardBeforeSend(this.isDeviceConnected)) {
        return;
      }

      const previousMode = this.deviceStore.deviceMode;
      this.beginSendUi();
      try {
        const ws = this.deviceStore.getWebSocket();
        await ws.setRickMortyPortal(this.buildPortalSendPayload());
        await this.syncConfigFromDeviceStatus();
        this.showSendSuccess();
      } catch (error) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode: "rick_morty_portal",
        });
        console.error("发送传送门失败:", error);
        this.showSendFailure(error);
      } finally {
        this.endSendUi();
      }
    },
    initPreviewCanvas() {
      this.$nextTick(() => {
        setTimeout(() => {
          const query = uni.createSelectorQuery().in(this);
          query
            .select(".preview-canvas-container")
            .boundingClientRect((data) => {
              if (!data || !data.width) {
                this.previewCanvasReady = true;
                this.startPreviewPlayback();
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
              this.startPreviewPlayback();
            })
            .exec();
        }, 80);
      });
    },
    renderPreviewFrame(progress) {
      const previewConfig = {
        ...this.config,
        preset: resolvePortalPresetForPreview(this.config),
      };
      const frameMap = buildPortalPreviewFrame(previewConfig, progress);
      if (frameMap && this.clockConfig.time.show) {
        const text = this.getPortalTimeText();
        const placement = this.resolveBoardTimePlacement(text);
        drawClockTextToPixels(
          text,
          placement.x,
          placement.y,
          this.clockConfig.time.color,
          frameMap,
          this.clockConfig.font,
          placement.fontSize,
          "left",
        );
      }
      if (frameMap) {
        this.previewDisplayPixels = frameMap;
        this.previewRefreshTick += 1;
      }
    },
    resolveBoardTimePlacement(text) {
      const { fontSize, width, height } = this.getPortalTimeMetrics(text);
      const maxX = Math.max(0, 64 - width);
      const maxY = Math.max(0, 64 - height);
      let x = Number(this.clockConfig.time.x);
      let y = Number(this.clockConfig.time.y);

      if (this.clockConfig.time.align === "center") {
        x -= Math.floor(width / 2);
      } else if (this.clockConfig.time.align === "right") {
        x -= width;
      }

      if (x < 0) {
        x = 0;
      }
      if (x > maxX) {
        x = maxX;
      }
      if (y < 0) {
        y = 0;
      }
      if (y > maxY) {
        y = maxY;
      }

      return {
        x,
        y,
        fontSize,
      };
    },
    getCurrentPreviewProgress() {
      if (!this.previewPlaybackStartedAt) {
        return 0;
      }
      const elapsed = Date.now() - this.previewPlaybackStartedAt;
      return (elapsed % PORTAL_CYCLE_DURATION_MS) / PORTAL_CYCLE_DURATION_MS;
    },
    refreshOverlayPreview() {
      if (!this.previewCanvasReady) {
        return;
      }
      this.renderPreviewFrame(this.getCurrentPreviewProgress());
    },
    schedulePreviewRefresh(preservedProgress = null) {
      if (this.previewRefreshTimer) {
        clearTimeout(this.previewRefreshTimer);
      }
      const nextProgress =
        typeof preservedProgress === "number"
          ? preservedProgress
          : this.getCurrentPreviewProgress();
      this.previewRefreshTimer = setTimeout(() => {
        this.previewRefreshTimer = null;
        this.startPreviewPlayback(nextProgress);
      }, 40);
    },
    handleColorSelect(presetId) {
      if (!PORTAL_PRESET_IDS.has(presetId)) {
        return;
      }
      if (this.config.preset === presetId) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.autoRotate.enabled = false;
      this.config.preset = presetId;
      this.schedulePreviewRefresh(progress);
    },
    handleSizeSelect(sizeId) {
      if (!PORTAL_SIZE_IDS.has(sizeId)) {
        return;
      }
      if (sizeId === this.config.size) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.size = sizeId;
      this.schedulePreviewRefresh(progress);
    },
    setAutoRotateEnabled(enabled) {
      if (this.config.autoRotate.enabled === enabled) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.autoRotate.enabled = enabled;
      this.schedulePreviewRefresh(progress);
    },
    setAutoRotateInterval(interval) {
      if (!isPortalRotateIntervalValue(interval)) {
        return;
      }
      if (this.config.autoRotate.interval === interval) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.autoRotate.interval = interval;
      this.schedulePreviewRefresh(progress);
    },
    handlePortalXChange(event) {
      const nextValue = Number(event && event.detail && event.detail.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }
      const portalX = Math.max(0, Math.min(63, Math.round(nextValue)));
      if (portalX === this.config.portalX) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.portalX = portalX;
      this.schedulePreviewRefresh(progress);
    },
    handlePortalYChange(event) {
      const nextValue = Number(event && event.detail && event.detail.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }
      const portalY = Math.max(0, Math.min(63, Math.round(nextValue)));
      if (portalY === this.config.portalY) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.portalY = portalY;
      this.schedulePreviewRefresh(progress);
    },
    handlePortalCenter() {
      if (this.config.portalX === 32 && this.config.portalY === 32) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.portalX = 32;
      this.config.portalY = 32;
      this.schedulePreviewRefresh(progress);
    },
    toggleTimeShow() {
      this.clockConfig.time.show = !this.clockConfig.time.show;
      this.refreshOverlayPreview();
    },
    handleTimeAdjust(key, delta, min, max) {
      if (this.clockConfig.time[key] === undefined) {
        return;
      }
      const safeMax = (key === "x" || key === "y") && max === 64 ? 63 : max;
      const currentValue = this.clockConfig.time[key];
      const nextValue = Math.max(min, Math.min(safeMax, currentValue + delta));
      if (nextValue === currentValue) {
        return;
      }
      this.clockConfig.time[key] = nextValue;
      this.refreshOverlayPreview();
    },
    handleTimeColor(color) {
      if (typeof color !== "string" || color.length === 0) {
        return;
      }
      this.clockConfig.time.color = color;
      this.refreshOverlayPreview();
    },
    handleTimeAlign(align) {
      if (align !== "left" && align !== "center" && align !== "right") {
        return;
      }
      this.clockConfig.time.align = align;
      if (align === "left") {
        this.clockConfig.time.x = 0;
      } else if (align === "center") {
        this.clockConfig.time.x = 32;
      } else {
        this.clockConfig.time.x = 63;
      }
      this.refreshOverlayPreview();
    },
    handleTimeFontChange(fontId) {
      if (!PORTAL_TIME_FONT_IDS.has(fontId)) {
        return;
      }
      this.clockConfig.font = fontId;
      this.refreshOverlayPreview();
    },
    toggleTimeSeconds() {
      this.clockConfig.showSeconds = !this.clockConfig.showSeconds;
      this.refreshOverlayPreview();
    },
    hexToRgb(hex) {
      if (typeof hex !== "string") {
        throw new Error("invalid portal time color");
      }
      const normalized = hex.trim().replace(/^#/, "");
      if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        throw new Error("invalid portal time color");
      }
      return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
      };
    },
    buildPortalSendPayload() {
      if (!PORTAL_TIME_FONT_IDS.has(this.clockConfig.font)) {
        throw new Error("invalid portal time font");
      }
      const timeText = this.getPortalTimeText();
      const timePlacement = this.resolveBoardTimePlacement(timeText);
      return {
        preset: this.config.preset,
        size: this.config.size,
        portalX: this.config.portalX,
        portalY: this.config.portalY,
        autoRotate: {
          enabled: this.config.autoRotate.enabled,
          interval: this.config.autoRotate.interval,
        },
        font: this.clockConfig.font,
        showSeconds: this.clockConfig.showSeconds,
        time: {
          show: this.clockConfig.time.show,
          fontSize: timePlacement.fontSize,
          x: timePlacement.x,
          y: timePlacement.y,
          color: this.hexToRgb(this.clockConfig.time.color),
        },
      };
    },
    startPreviewPlayback(preservedProgress = 0) {
      this.stopPreviewPlayback();
      if (!this.previewCanvasReady) {
        return;
      }

      this.previewPlaybackStartedAt =
        Date.now() - preservedProgress * PORTAL_CYCLE_DURATION_MS;

      const tick = () => {
        const progress = this.getCurrentPreviewProgress();
        this.renderPreviewFrame(progress);
        const frameInterval = PORTAL_CYCLE_DURATION_MS / PORTAL_PREVIEW_FRAME_COUNT;
        this.previewTimer = setTimeout(tick, Math.max(60, frameInterval));
      };
      tick();
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
  },
};
</script>

<style scoped>
.portal-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.portal-layout {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.portal-preview-card {
  gap: 16px;
}

.portal-preview-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.portal-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.portal-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.portal-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.portal-preview-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.portal-send-button {
  min-width: 188px;
  min-height: 48px;
}

.portal-preview-stage {
  padding: 18px;
}

.portal-preview-board {
  width: min(100%, 560px);
  margin: 0 auto;
  border: 2px solid #000000;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 52%),
    #000000;
}

.portal-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.portal-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.portal-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.portal-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  line-height: 1.3;
  color: #000000;
}

.portal-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.portal-config-stack {
  min-width: 0;
}

.portal-option-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.portal-option-grid--double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.portal-option-grid--intervals {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.portal-option-card {
  min-height: 54px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000000;
  background: #ffffff;
  text-align: center;
  cursor: pointer;
}

.portal-option-card.is-active {
  background: #ffd23f;
}

.portal-option-card strong {
  font-size: 15px;
  line-height: 1.15;
  font-weight: 900;
  color: #000000;
}

.portal-setting-row {
  display: grid;
  grid-template-columns: minmax(140px, auto) minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.portal-setting-row__label,
.portal-block__label {
  font-size: 14px;
  font-weight: 800;
  color: #000000;
}

.portal-center-button {
  justify-self: start;
}

.portal-block {
  display: grid;
  gap: 12px;
}

.portal-rotate-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.portal-rotate-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 4px 10px;
  border: 2px solid #000000;
  background: #ffffff;
  color: var(--glx-text-muted);
  font-size: 12px;
  line-height: 1;
  font-weight: 900;
  box-shadow: 3px 3px 0 #000000;
}

.portal-rotate-badge--on {
  background: #ffd23f;
  color: #000000;
}

.portal-rotate-note {
  display: block;
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.portal-font-panel :deep(.glx-panel-card),
.portal-font-panel :deep(.glx-editor-card) {
  background: transparent;
  border: 0;
  box-shadow: none;
}

@media (max-width: 1180px) {
  .portal-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 920px) {
  .portal-layout,
  .portal-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .portal-option-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .portal-option-grid--intervals {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .portal-preview-toolbar__actions {
    width: 100%;
  }

  .portal-send-button {
    min-width: 0;
    flex: 1 1 auto;
  }

  .portal-option-grid,
  .portal-setting-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .portal-option-grid--double,
  .portal-option-grid--intervals {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
