<!-- AUTO-CONVERTED FROM uniapp/pages/planet-screensaver/planet-screensaver.vue -->
<template>
  <div class="planet-page glx-page-shell">
    

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">星球屏保</span>
      <div class="nav-right"></div>
    </div>

    <div class="canvas-section">
      <div class="preview-canvas-container" :style="previewCanvasBoxStyle">
        <PixelCanvas
          v-if="previewCanvasReady && !shouldShowSendingSnapshot"
          :width="64"
          :height="64"
          :pixels="currentPreviewPixels"
          :refresh-token="previewRefreshTick"
          :zoom="previewZoom"
          :offset-x="previewOffset.x"
          :offset-y="previewOffset.y"
          :canvas-width="previewContainerSize.width"
          :canvas-height="previewContainerSize.height"
          :grid-visible="true"
          :is-dark-mode="true"
          :touch-enabled="false"
          canvas-id="planetPreviewCanvas"
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
          <span class="preview-title">预览效果</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending }"
            @click="handleSend"
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
        <div v-show="currentTab === 0" class="tab-panel glx-tab-panel">
          <div class="card glx-panel-card glx-editor-card">
            <div class="card-title-section glx-panel-head">
              <span class="glx-panel-title">星球类型</span>
            </div>
            <div class="preset-grid">
              <div
                v-for="preset in presetOptions"
                :key="preset.id"
                class="glx-feature-option glx-feature-option--scene"
                :class="{ active: isPresetOptionActive(preset.id) }"
                @click="handlePresetSelect(preset.id)"
              >
                <span class="glx-feature-option__label">{{
                  preset.label
                }}</span>
              </div>
            </div>

            <div v-if="isPortalPreset" class="option-stack portal-color-stack">
              <span class="form-label">传送门颜色</span>
              <div class="option-row option-row-triple">
                <div
                  v-for="option in portalColorOptions"
                  :key="option.id"
                  class="option-btn glx-feature-option"
                  :class="{ active: config.preset === option.id }"
                  @click="handlePortalColorSelect(option.id)"
                >
                  <span class="glx-feature-option__label">{{
                    option.label
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card glx-panel-card glx-editor-card">
            <div class="card-title-section glx-panel-head">
              <span class="glx-panel-title">参数</span>
            </div>

            <div
              v-if="showRandomColorAction || showRandomPlanetAction"
              class="bottom-action-row"
              :class="{
                'bottom-action-row--single':
                  !showRandomColorAction || !showRandomPlanetAction,
              }"
            >
              <div
                v-if="showRandomColorAction"
                class="action-btn-sm glx-secondary-action"
                :class="{ disabled: isSending }"
                @click="handleRandomColor"
              >
                <Icon name="palette" :size="32" color="var(--nb-ink)" />
                <span>随机颜色</span>
              </div>
              <div
                v-if="showRandomPlanetAction"
                class="action-btn-sm glx-secondary-action"
                :class="{ disabled: isSending }"
                @click="handleRandomPlanet"
              >
                <Icon name="refresh" :size="32" color="var(--nb-ink)" />
                <span>{{ randomPlanetActionLabel }}</span>
              </div>
            </div>

            <div class="form-row">
              <span class="form-label">水平位置 {{ config.planetX }}</span>
              <GlxStepper
                :value="config.planetX"
                :min="0"
                :max="63"
                :step="1"
                @change="handlePlanetXChange"
              />
            </div>

            <div class="form-row">
              <span class="form-label">垂直位置 {{ config.planetY }}</span>
              <GlxStepper
                :value="config.planetY"
                :min="0"
                :max="63"
                :step="1"
                @change="handlePlanetYChange"
              />
            </div>

            <div class="bottom-action-row">
              <div
                class="action-btn-sm glx-secondary-action"
                :class="{ disabled: isSending }"
                @click="handlePlanetCenter"
              >
                <Icon name="target" :size="32" color="var(--nb-ink)" />
                <span>快速居中</span>
              </div>
            </div>

            <div class="option-stack">
              <span class="form-label">{{ sizeSectionLabel }}</span>
              <div class="option-row option-row-triple">
                <div
                  v-for="option in displaySizeOptions"
                  :key="option.id"
                  class="option-btn glx-feature-option"
                  :class="{ active: config.size === option.id }"
                  @click="handleSizeSelect(option.id)"
                >
                  <span class="glx-feature-option__label">{{
                    option.label
                  }}</span>
                </div>
              </div>
            </div>

            <div v-if="!isPortalPreset" class="option-stack">
              <span class="form-label">自转方向</span>
              <div class="option-row option-row-double">
                <div
                  v-for="option in directionOptions"
                  :key="option.id"
                  class="option-btn glx-feature-option"
                  :class="{ active: config.direction === option.id }"
                  @click="handleDirectionSelect(option.id)"
                >
                  <span class="glx-feature-option__label">{{
                    option.label
                  }}</span>
                </div>
              </div>
            </div>

            <div class="form-row">
              <span class="form-label">转速 {{ config.speed }}</span>
              <GlxStepper
                :value="config.speed"
                :min="PLANET_PREVIEW_MIN_SPEED"
                :max="PLANET_PREVIEW_MAX_SPEED"
                :step="1"
                @change="handleSpeedChange"
              />
            </div>
          </div>
        </div>

        <div v-show="currentTab === 1" class="tab-panel glx-tab-panel">
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
        </div>

        <div v-show="currentTab === 2" class="tab-panel glx-tab-panel">
          <ClockFontPanel
            :font-options="timeFontOptions"
            :selected-font="clockConfig.font"
            :show-seconds="clockConfig.showSeconds"
            :hour-format="24"
            :show-hour-format="false"
            @select-font="handleTimeFontChange"
          />
        </div>
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

    <Toast ref="toastRef" @show="handleToastShow" @hide="handleToastHide" />
  </div>
</template>

<script>
import statusBarMixin from "@/mixins/statusBar.js";
import deviceSendUxMixin from "@/mixins/deviceSendUxMixin.js";
import Icon from "@/components/uni/Icon.vue";
import Toast from "@/components/uni/Toast.vue";
import GlxInlineLoader from "@/components/uni/GlxInlineLoader.vue";
import PixelCanvas from "@/components/uni/PixelCanvas.vue";
import PixelPreviewBoard from "@/components/uni/PixelPreviewBoard.vue";
import GlxStepper from "@/components/uni/GlxStepper.vue";
import ClockFontPanel from "@/components/uni/clock-editor/ClockFontPanel.vue";
import ClockTextSettingsCard from "@/components/uni/clock-editor/ClockTextSettingsCard.vue";
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
  PLANET_REFERENCE_DEFAULT_COLOR_SEED,
  PLANET_SCREEN_PRESETS,
  PLANET_PREVIEW_MIN_SPEED,
  PLANET_PREVIEW_MAX_SPEED,
  PLANET_PREVIEW_PLAYBACK_INTERVAL_MS,
  PLANET_SIZE_OPTIONS,
  PLANET_DIRECTION_OPTIONS,
  createDefaultPlanetPreviewConfig,
  createRandomPlanetPreviewSeed,
  createRandomPlanetColorSeed,
  getPlanetPreviewCycleDuration,
  buildPlanetScreensaverPreviewFrame,
  buildPlanetScreensaverPreviewSequence,
} from "@/utils/planetScreensaverPreview.js";

const PLANET_TIME_FONT_OPTIONS = getClockFontOptions();
const PLANET_TIME_FONT_IDS = new Set(
  PLANET_TIME_FONT_OPTIONS.map((item) => item.id),
);
const PLANET_PAGE_STORAGE_KEY = "planet_screensaver_page_state";
const PLANET_FIXED_PALETTE_COLOR_SEED = PLANET_REFERENCE_DEFAULT_COLOR_SEED;
const PLANET_PORTAL_COLOR_OPTIONS = Object.freeze([
  { id: "portal_green", label: "绿色" },
  { id: "portal_blue", label: "蓝色" },
  { id: "portal_yellow", label: "黄色" },
]);
const PLANET_DISPLAY_PRESETS = Object.freeze(
  // 传送门已升级为独立模式 (rick_morty_portal),星球屏保里不再展示这 3 个 preset。
  PLANET_SCREEN_PRESETS.filter(
    (preset) =>
      preset.id !== "portal_green" &&
      preset.id !== "portal_blue" &&
      preset.id !== "portal_yellow",
  ),
);
const PLANET_TIME_COLOR_OPTIONS = Object.freeze([
  { name: "青色", hex: "#64c8ff" },
  { name: "绿色", hex: "#00ff9d" },
  { name: "黄色", hex: "#ffdc00" },
  { name: "橙色", hex: "#ffa500" },
  { name: "红色", hex: "#ff6464" },
  { name: "紫色", hex: "#c864ff" },
  { name: "白色", hex: "#ffffff" },
]);

function createDefaultPlanetClockConfig() {
  return {
    font: "classic_5x7",
    showSeconds: false,
    time: {
      show: true,
      fontSize: 1,
      x: 32,
      y: 5,
      color: "#ffffff",
      align: "center",
    },
  };
}

function normalizeHexColor(value, fallback = "#ffffff") {
  if (typeof value !== "string") {
    return fallback;
  }
  const body = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(body)) {
    return fallback;
  }
  return `#${body.toLowerCase()}`;
}

function normalizePlanetPageState(saved) {
  const config = createDefaultPlanetPreviewConfig();
  const clockConfig = createDefaultPlanetClockConfig();
  const state = saved && typeof saved === "object" ? saved : {};

  if (typeof state.config === "object" && state.config !== null) {
    if (PLANET_SCREEN_PRESETS.some((item) => item.id === state.config.preset)) {
      config.preset = state.config.preset;
    }
    if (PLANET_SIZE_OPTIONS.some((item) => item.id === state.config.size)) {
      config.size = state.config.size;
    }
    if (
      PLANET_DIRECTION_OPTIONS.some(
        (item) => item.id === state.config.direction,
      )
    ) {
      config.direction = state.config.direction;
    }
    const planetX = Number(state.config.planetX);
    if (Number.isFinite(planetX)) {
      config.planetX = Math.max(0, Math.min(63, Math.round(planetX)));
    }
    const planetY = Number(state.config.planetY);
    if (Number.isFinite(planetY)) {
      config.planetY = Math.max(0, Math.min(63, Math.round(planetY)));
    }

    const speed = Number(state.config.speed);
    if (Number.isFinite(speed)) {
      config.speed = Math.max(
        PLANET_PREVIEW_MIN_SPEED,
        Math.min(PLANET_PREVIEW_MAX_SPEED, Math.round(speed)),
      );
    }

    const seed = Number(state.config.seed);
    if (Number.isFinite(seed) && seed >= 0) {
      config.seed = Math.round(seed);
    }

    const colorSeed = Number(state.config.colorSeed);
    if (Number.isFinite(colorSeed) && colorSeed >= 0) {
      config.colorSeed = Math.round(colorSeed);
    }
  }

  if (typeof state.clockConfig === "object" && state.clockConfig !== null) {
    if (PLANET_TIME_FONT_IDS.has(state.clockConfig.font)) {
      clockConfig.font = state.clockConfig.font;
    }
    if (
      state.clockConfig.showSeconds === true ||
      state.clockConfig.showSeconds === false
    ) {
      clockConfig.showSeconds = state.clockConfig.showSeconds;
    }

    if (
      typeof state.clockConfig.time === "object" &&
      state.clockConfig.time !== null
    ) {
      const time = state.clockConfig.time;
      if (time.show === true || time.show === false) {
        clockConfig.time.show = time.show;
      }

      const fontSize = Number(time.fontSize);
      if (Number.isFinite(fontSize)) {
        clockConfig.time.fontSize = Math.max(
          1,
          Math.min(3, Math.round(fontSize)),
        );
      }

      const x = Number(time.x);
      if (Number.isFinite(x)) {
        clockConfig.time.x = Math.max(0, Math.min(63, Math.round(x)));
      }

      const y = Number(time.y);
      if (Number.isFinite(y)) {
        clockConfig.time.y = Math.max(0, Math.min(63, Math.round(y)));
      }

      clockConfig.time.color = normalizeHexColor(
        time.color,
        clockConfig.time.color,
      );
      if (
        time.align === "left" ||
        time.align === "center" ||
        time.align === "right"
      ) {
        clockConfig.time.align = time.align;
      }
    }
  }

  return {
    config,
    clockConfig,
  };
}

function isPortalPresetValue(preset) {
  return (
    preset === "portal_green" ||
    preset === "portal_blue" ||
    preset === "portal_yellow"
  );
}

function isFixedPalettePresetValue(preset) {
  return isPortalPresetValue(preset);
}

export default {
  mixins: [statusBarMixin, deviceSendUxMixin],
  components: {
    Icon,
    Toast,
    GlxInlineLoader,
    PixelCanvas,
    PixelPreviewBoard,
    GlxStepper,
    ClockFontPanel,
    ClockTextSettingsCard,
  },
  data() {
    const config = createDefaultPlanetPreviewConfig();
    return {
      deviceStore: null,
      toast: null,
      PLANET_PREVIEW_MIN_SPEED,
      PLANET_PREVIEW_MAX_SPEED,
      contentHeight: "calc(100vh - 88rpx - 520rpx - 112rpx)",
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
      previewSequence: null,
      presetOptions: PLANET_DISPLAY_PRESETS,
      portalColorOptions: PLANET_PORTAL_COLOR_OPTIONS,
      sizeOptions: PLANET_SIZE_OPTIONS,
      directionOptions: PLANET_DIRECTION_OPTIONS,
      clockConfig: createDefaultPlanetClockConfig(),
      timeFontOptions: PLANET_TIME_FONT_OPTIONS,
      timeColorOptions: PLANET_TIME_COLOR_OPTIONS,
      currentTab: 0,
      tabDefinitions: [
        { index: 0, label: "星球", icon: "prompt" },
        { index: 1, label: "时间", icon: "time" },
        { index: 2, label: "字体", icon: "text" },
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
    isFixedPalettePreset() {
      return isFixedPalettePresetValue(this.config.preset);
    },
    isPortalPreset() {
      return isPortalPresetValue(this.config.preset);
    },
    displaySizeOptions() {
      return this.sizeOptions;
    },
    sizeSectionLabel() {
      if (this.isPortalPreset) {
        return "传送门大小";
      }
      return "星球大小";
    },
    showRandomColorAction() {
      return !this.isFixedPalettePreset;
    },
    showRandomPlanetAction() {
      return !isPortalPresetValue(this.config.preset);
    },
    randomPlanetActionLabel() {
      if (isPortalPresetValue(this.config.preset)) {
        return "随机纹理";
      }
      return "随机星球";
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
    const savedState = normalizePlanetPageState(
      uni.getStorageSync(PLANET_PAGE_STORAGE_KEY),
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
    handleBack() {
      uni.navigateBack();
    },
    persistLocalState() {
      uni.setStorageSync(PLANET_PAGE_STORAGE_KEY, {
        config: {
          preset: this.config.preset,
          size: this.config.size,
          direction: this.config.direction,
          planetX: this.config.planetX,
          planetY: this.config.planetY,
          speed: this.config.speed,
          seed: this.config.seed,
          colorSeed: this.config.colorSeed,
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
    getPlanetTimeText() {
      return getCurrentTimeText(this.clockConfig.showSeconds, 24);
    },
    getPlanetTimeMetrics(text = this.getPlanetTimeText()) {
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
    resolveAnchorTimeXFromBoardX(boardX, text = this.getPlanetTimeText()) {
      const { width } = this.getPlanetTimeMetrics(text);
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
    applyPlanetStatus(status) {
      if (!status || typeof status !== "object") {
        return;
      }
      const {
        businessMode,
        preset,
        size,
        direction,
        speed: rawSpeed,
        seed: rawSeed,
        colorSeed: rawColorSeed,
        planetX: rawPlanetX,
        planetY: rawPlanetY,
        font,
        showSeconds,
        time,
      } = status;
      if (businessMode !== "planet_screensaver") {
        return;
      }
      if (typeof preset !== "string" || typeof size !== "string") {
        return;
      }
      if (typeof direction !== "string" || !time || typeof time !== "object") {
        return;
      }
      if (!time.color || typeof time.color !== "object") {
        return;
      }

      if (PLANET_SCREEN_PRESETS.some((item) => item.id === preset)) {
        this.config.preset = preset;
      }
      if (PLANET_SIZE_OPTIONS.some((item) => item.id === size)) {
        this.config.size = size;
      }
      if (PLANET_DIRECTION_OPTIONS.some((item) => item.id === direction)) {
        this.config.direction = direction;
      }

      const speed = Number(rawSpeed);
      if (Number.isFinite(speed)) {
        this.config.speed = Math.max(
          PLANET_PREVIEW_MIN_SPEED,
          Math.min(PLANET_PREVIEW_MAX_SPEED, Math.round(speed)),
        );
      }

      const seed = Number(rawSeed);
      if (Number.isFinite(seed) && seed >= 0) {
        this.config.seed = Math.round(seed);
      }

      const colorSeed = Number(rawColorSeed);
      if (Number.isFinite(colorSeed) && colorSeed >= 0) {
        this.config.colorSeed = Math.round(colorSeed);
      }
      const planetX = Number(rawPlanetX);
      if (Number.isFinite(planetX)) {
        this.config.planetX = Math.max(0, Math.min(63, Math.round(planetX)));
      }
      const planetY = Number(rawPlanetY);
      if (Number.isFinite(planetY)) {
        this.config.planetY = Math.max(0, Math.min(63, Math.round(planetY)));
      }

      if (PLANET_TIME_FONT_IDS.has(font)) {
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
          this.getPlanetTimeText(),
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
      this.applyPlanetStatus(status);
    },
    async handleSend() {
      if (!this.guardBeforeSend(this.isDeviceConnected)) {
        return;
      }

      const previousMode = this.deviceStore.deviceMode;
      this.beginSendUi();
      try {
        const ws = this.deviceStore.getWebSocket();
        await ws.setPlanetScreensaver(this.buildPlanetSendPayload());
        await this.syncConfigFromDeviceStatus();
        this.showSendSuccess();
      } catch (error) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode: "planet_screensaver",
        });
        console.error("发送星球屏保失败:", error);
        this.showSendFailure(error);
      } finally {
        this.endSendUi();
      }
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
              systemInfo.windowHeight -
              statusBarHeight -
              88 -
              sectionRect.height;
            this.contentHeight = `${Math.max(120, nextHeight - 76)}px`;
          });
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
      let frameMap;
      if (this.previewSequence && this.previewSequence.maps && this.previewSequence.maps.length > 0) {
        // 根据 progress 选择对应帧
        const frameCount = this.previewSequence.maps.length;
        const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
        frameMap = this.previewSequence.maps[frameIndex];
        
        // 只有显示时钟时才复制frameMap，避免污染缓存
        if (this.clockConfig.time.show) {
          frameMap = new Map(frameMap);
          const text = this.getPlanetTimeText();
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
      } else {
        // 回退：实时渲染当前进度帧
        frameMap = buildPlanetScreensaverPreviewFrame(
          {
            ...this.config,
          },
          progress,
        );
        
        if (this.clockConfig.time.show) {
          const text = this.getPlanetTimeText();
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
      }
      
      this.previewDisplayPixels = frameMap;
    },
    resolveBoardTimePlacement(text) {
      const { fontSize, width, height } = this.getPlanetTimeMetrics(text);
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
      const cycleDuration = getPlanetPreviewCycleDuration(this.config.speed);
      if (cycleDuration <= 0) {
        return 0;
      }
      const elapsed = Date.now() - this.previewPlaybackStartedAt;
      return (elapsed % cycleDuration) / cycleDuration;
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
    isPresetOptionActive(presetId) {
      if (presetId === "portal_green") {
        return isPortalPresetValue(this.config.preset);
      }
      return this.config.preset === presetId;
    },
    handlePresetSelect(presetId) {
      if (
        presetId === "portal_green" &&
        isPortalPresetValue(this.config.preset)
      ) {
        return;
      }
      if (this.config.preset === presetId) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.preset = presetId;
      this.schedulePreviewRefresh(progress);
    },
    handlePortalColorSelect(presetId) {
      if (!isPortalPresetValue(presetId)) {
        return;
      }
      if (this.config.preset === presetId) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.preset = presetId;
      this.schedulePreviewRefresh(progress);
    },
    handleSizeSelect(sizeId) {
      if (sizeId === this.config.size) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.size = sizeId;
      this.schedulePreviewRefresh(progress);
    },
    handleRandomColor() {
      const progress = this.getCurrentPreviewProgress();
      this.config.colorSeed = createRandomPlanetColorSeed();
      this.schedulePreviewRefresh(progress);
    },
    handleRandomPlanet() {
      if (isPortalPresetValue(this.config.preset)) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.seed = createRandomPlanetPreviewSeed();
      this.schedulePreviewRefresh(progress);
    },
    handleDirectionSelect(directionId) {
      if (directionId === this.config.direction) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.direction = directionId;
      this.schedulePreviewRefresh(progress);
    },
    handleSpeedChange(event) {
      const nextValue = Number(event?.detail?.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }
      const speed = Math.min(
        PLANET_PREVIEW_MAX_SPEED,
        Math.max(PLANET_PREVIEW_MIN_SPEED, Math.round(nextValue)),
      );
      if (speed === this.config.speed) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.speed = speed;
      this.schedulePreviewRefresh(progress);
    },
    handlePlanetXChange(event) {
      const nextValue = Number(event?.detail?.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }
      const planetX = Math.max(0, Math.min(63, Math.round(nextValue)));
      if (planetX === this.config.planetX) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.planetX = planetX;
      this.schedulePreviewRefresh(progress);
    },
    handlePlanetYChange(event) {
      const nextValue = Number(event?.detail?.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }
      const planetY = Math.max(0, Math.min(63, Math.round(nextValue)));
      if (planetY === this.config.planetY) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.planetY = planetY;
      this.schedulePreviewRefresh(progress);
    },
    handlePlanetCenter() {
      if (this.config.planetX === 32 && this.config.planetY === 32) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.planetX = 32;
      this.config.planetY = 32;
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
      if (!PLANET_TIME_FONT_IDS.has(fontId)) {
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
        throw new Error("invalid planet time color");
      }
      const normalized = hex.trim().replace(/^#/, "");
      if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        throw new Error("invalid planet time color");
      }
      return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
      };
    },
    buildPlanetSendPayload() {
      if (!PLANET_TIME_FONT_IDS.has(this.clockConfig.font)) {
        throw new Error("invalid planet time font");
      }
      const timeText = this.getPlanetTimeText();
      const timePlacement = this.resolveBoardTimePlacement(timeText);
      const colorSeed = this.isFixedPalettePreset
        ? PLANET_FIXED_PALETTE_COLOR_SEED
        : this.config.colorSeed;
      return {
        preset: this.config.preset,
        size: this.config.size,
        direction: this.config.direction,
        planetX: this.config.planetX,
        planetY: this.config.planetY,
        speed: this.config.speed,
        seed: this.config.seed,
        colorSeed,
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
      
      const cycleDuration = getPlanetPreviewCycleDuration(this.config.speed);
      this.previewPlaybackStartedAt = Date.now() - preservedProgress * cycleDuration;
      
      // 实时渲染动画循环 (跟板载一致，每帧实时计算)
      const tick = () => {
        const progress = this.getCurrentPreviewProgress();
        const frameMap = buildPlanetScreensaverPreviewFrame(this.config, progress);
        
        if (frameMap && this.clockConfig.time.show) {
          const text = this.getPlanetTimeText();
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
        
        // 帧间隔跟板载一致: cycleDuration / 48帧
        const frameInterval = getPlanetPreviewCycleDuration(this.config.speed) / 48;
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
.planet-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  overflow: hidden;
}

.status-bar {
  background-color: #1a1a1a;
}

.content {
  flex: 1;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: var(--bg-tertiary);
  padding: 16rpx 20rpx 0;
}

.preview-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.card {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.tab-panel {
  padding-top: 0;
}

.option-stack {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 12rpx;
}

.option-row {
  display: grid;
  gap: 12rpx;
}

.option-row-double {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.option-row-triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.option-btn.glx-feature-option {
  min-height: 88rpx;
  padding: 10rpx 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: var(--nb-surface) !important;
  border: 2rpx solid var(--nb-ink) !important;
  box-shadow: var(--nb-shadow-soft) !important;
}

.option-btn.glx-feature-option.active {
  background: var(--nb-yellow) !important;
  border-color: var(--nb-ink) !important;
  box-shadow: var(--nb-shadow-soft) !important;
}

.option-btn.glx-feature-option .glx-feature-option__label {
  font-size: 24rpx;
  line-height: 1.2;
  font-weight: 800;
  color: var(--text-secondary) !important;
}

.option-btn.glx-feature-option.active .glx-feature-option__label {
  color: var(--nb-ink) !important;
  font-weight: 900 !important;
}

.glx-secondary-action {
  background: var(--nb-surface) !important;
  border-color: var(--nb-ink) !important;
}

.bottom-action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin: 12rpx 0;
}

.bottom-action-row--single {
  grid-template-columns: minmax(0, 1fr);
}

.bottom-action-row .action-btn-sm {
  width: 100% !important;
  min-width: 0 !important;
  height: 72rpx !important;
  padding: 0 12rpx !important;
}

.bottom-action-row .action-btn-sm text {
  font-size: 22rpx !important;
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

.form-row:last-child {
  margin-bottom: 0;
}
</style>
