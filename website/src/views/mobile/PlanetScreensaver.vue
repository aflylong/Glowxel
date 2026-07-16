<!-- AUTO-CONVERTED FROM uniapp/pages/planet-screensaver/planet-screensaver.vue -->
<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">鏄熺悆灞忎繚</span>
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
        />
        <PixelCanvas
          v-else-if="previewCanvasReady && shouldShowSendingSnapshot"
          :width="64"
          :height="64"
          :pixels="sendingPreviewPixels"
          :refresh-token="sendingPreviewTick"
          :zoom="previewZoom"
          :offset-x="previewOffset.x"
          :offset-y="previewOffset.y"
          :canvas-width="previewContainerSize.width"
          :canvas-height="previewContainerSize.height"
          :grid-visible="true"
          :is-dark-mode="true"
          :touch-enabled="false"
        />
      </div>
      <div class="preview-caption">
        <div class="preview-caption-info">
          <span class="preview-caption-title">棰勮鏁堟灉</span>
          <span
            class="send-mode-badge"
            :class="sendModeBadgeClass"
          >{{ sendModeBadgeText }}</span>
          <span class="send-mode-hint">{{ sendModeHint }}</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary"
            :class="{ disabled: isSending }"
            @click="handleSend"
          >
            <Icon name="link" :size="36" color="#000000" />
            <span>{{ sendButtonText }}</span>
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
              <span class="glx-panel-title">鏄熺悆绫诲瀷</span>
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
              <span class="form-label">浼犻€侀棬棰滆壊</span>
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
              <span class="glx-panel-title">鍙傛暟</span>
            </div>

            <div
              v-if="showRandomColorAction || showRandomPlanetAction"
              class="bottom-action-row"
              :class="{
                'bottom-action-row--single':
                  !showRandomColorAction || !showRandomPlanetAction,
              }""
            >
              <div
                v-if="showRandomColorAction"
                class="action-btn-sm glx-secondary-action"
                :class="{ disabled: isSending }"
                @click="handleRandomColor"
              >
                <Icon name="palette" :size="32" color="var(--nb-ink)" />
                <span>闅忔満棰滆壊</span>
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
              <span class="form-label">姘村钩浣嶇疆 {{ config.planetX }}</span>
              <GlxStepper
                :value="config.planetX"
                :min="0"
                :max="63"
                :step="1"
                @change="handlePlanetXChange"
              />
            </div>

            <div class="form-row">
              <span class="form-label">鍨傜洿浣嶇疆 {{ config.planetY }}</span>
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
                <span>蹇€熷眳涓?</span>
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
              <span class="form-label">鑷浆鏂瑰悜</span>
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
              <span class="form-label">杞€?{{ config.speed }}</span>
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
            title="鏃堕棿鏄剧ず"
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

        <div v-show="currentTab === 3" class="tab-panel glx-tab-panel">
          <div class="card glx-panel-card glx-editor-card">
            <div class="card-title-section glx-panel-head">
              <span class="glx-panel-title">杞挱</span>
            </div>

            <div class="form-row">
              <span class="form-label">鑷姩杞挱</span>
              <div class="option-row option-row-double auto-rotate-switch">
                <div
                  class="option-btn glx-feature-option"
                  :class="{ active: autoRotate.enabled }"
                  @click="setAutoRotateEnabled(true)"
                >
                  <span class="glx-feature-option__label">寮€鍚?</span>
                </div>
                <div
                  class="option-btn glx-feature-option"
                  :class="{ active: !autoRotate.enabled }"
                  @click="setAutoRotateEnabled(false)"
                >
                  <span class="glx-feature-option__label">鍏抽棴</span>
                </div>
              </div>
            </div>

            <div class="option-stack">
              <span class="form-label">闅忔満鍐呭</span>
              <div class="option-row option-row-double">
                <div
                  class="option-btn glx-feature-option"
                  :class="{ active: autoRotate.randomPlanet }"
                  @click="toggleAutoRotateRandomPlanet"
                >
                  <span class="glx-feature-option__label">闅忔満鍦板舰</span>
                </div>
                <div
                  class="option-btn glx-feature-option"
                  :class="{ active: autoRotate.randomColor }"
                  @click="toggleAutoRotateRandomColor"
                >
                  <span class="glx-feature-option__label">闅忔満棰滆壊</span>
                </div>
              </div>
            </div>

            <div class="option-stack">
              <span class="form-label">鍒囨崲鏃堕暱</span>
              <div class="option-row option-row-double">
                <div
                  v-for="option in autoRotateIntervalOptions"
                  :key="option.value"
                  class="option-btn glx-feature-option"
                  :class="{ active: autoRotate.interval === option.value }"
                  @click="setAutoRotateInterval(option.value)"
                >
                  <span class="glx-feature-option__label">{{
                    option.label
                  }}</span>
                </div>
              </div>
            </div>
          </div>
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
import { getStorage, setStorage, getSystemInfo, createDomQuery, navigateBack } from '@/utils/browser-platform.js'
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import statusBarMixin from "@/mixins/statusBar.js";
import deviceSendUxMixin from "@/mixins/deviceSendUxMixin.js";
import Icon from "@/components/uni/Icon.vue";
import Toast from "@/components/uni/Toast.vue";
import GlxInlineLoader from "@/components/uni/GlxInlineLoader.vue";
import PixelCanvas from "@/components/uni/PixelCanvas.vue";
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
  PLANET_DEFAULT_COLOR_SEED,
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
  { id: "portal_green", label: "缁胯壊" },
  { id: "portal_blue", label: "钃濊壊" },
  { id: "portal_yellow", label: "榛勮壊" },
]);
const PLANET_DISPLAY_PRESETS = Object.freeze(
  // 浼犻€侀棬宸插崌绾т负鐙珛妯″紡 (rick_morty_portal),鏄熺悆灞忎繚閲屼笉鍐嶅睍绀鸿繖 3 涓?preset銆?
  PLANET_SCREEN_PRESETS.filter(
    (preset) =>
      preset.id !== "portal_green" &&
      preset.id !== "portal_blue" &&
      preset.id !== "portal_yellow",
  ),
);
const PLANET_TIME_COLOR_OPTIONS = Object.freeze([
  { name: "闈掕壊", hex: "#64c8ff" },
  { name: "缁胯壊", hex: "#00ff9d" },
  { name: "榛勮壊", hex: "#ffdc00" },
  { name: "姗欒壊", hex: "#ffa500" },
  { name: "绾㈣壊", hex: "#ff6464" },
  { name: "绱壊", hex: "#c864ff" },
  { name: "鐧借壊", hex: "#ffffff" },
]);

const PLANET_AUTO_ROTATE_INTERVAL_OPTIONS = Object.freeze([
  { value: 30, label: "30绉?" },"
  { value: 60, label: "1鍒嗛挓" },
  { value: 300, label: "5鍒嗛挓" },
  { value: 600, label: "10鍒嗛挓" },
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

function createDefaultPlanetAutoRotateConfig() {
  return {
    enabled: false,
    randomPlanet: true,
    randomColor: false,
    interval: 60,
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

function normalizePlanetAutoRotateConfig(saved) {
  const config = createDefaultPlanetAutoRotateConfig();
  if (!saved || typeof saved !== "object") {
    return config;
  }

  if (saved.enabled === true || saved.enabled === false) {
    config.enabled = saved.enabled;
  }
  if (saved.randomPlanet === true || saved.randomPlanet === false) {
    config.randomPlanet = saved.randomPlanet;
  }
  if (saved.randomColor === true || saved.randomColor === false) {
    config.randomColor = saved.randomColor;
  }
  if (
    PLANET_AUTO_ROTATE_INTERVAL_OPTIONS.some(
      (item) => item.value === saved.interval,
    )
  ) {
    config.interval = saved.interval;
  }

  return config;
}

function normalizePlanetPageState(saved) {
  const config = createDefaultPlanetPreviewConfig();
  const clockConfig = createDefaultPlanetClockConfig();
  const autoRotate = normalizePlanetAutoRotateConfig(
    saved && typeof saved === "object" ? saved.autoRotate : null,
  );
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
    autoRotate,
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
  return preset === "earth" || isPortalPresetValue(preset);
}

export default {
  mixins: [uniLifecycleAdapter, statusBarMixin, deviceSendUxMixin],
  components: {
    Icon,
    Toast,
    GlxInlineLoader,
    PixelCanvas,
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
        { index: 0, label: "鏄熺悆", icon: "prompt" },
        { index: 1, label: "鏃堕棿", icon: "time" },
        { index: 2, label: "瀛椾綋", icon: "text" },
        { index: 3, label: "杞挱", icon: "refresh" },
      ],
      config,
      autoRotate: createDefaultPlanetAutoRotateConfig(),
      autoRotateIntervalOptions: PLANET_AUTO_ROTATE_INTERVAL_OPTIONS,
      autoRotateTimer: null,
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
        return "浼犻€侀棬澶у皬";
      }
      return "鏄熺悆澶у皬";
    },
    showRandomColorAction() {
      return !this.isFixedPalettePreset;
    },
    showRandomPlanetAction() {
      return !isPortalPresetValue(this.config.preset);
    },
    randomPlanetActionLabel() {
      if (isPortalPresetValue(this.config.preset)) {
        return "闅忔満绾圭悊";
      }
      return "闅忔満鏄熺悆";
    },
    isAutoRotatePreviewActive() {
      if (!this.autoRotate.enabled) {
        return false;
      }
      if (this.autoRotate.randomPlanet) {
        return true;
      }
      return this.autoRotate.randomColor;
    },
    autoRotateContentLabel() {
      if (this.autoRotate.randomPlanet && this.autoRotate.randomColor) {
        return "闅忔満鍦板舰 + 闅忔満棰滆壊";
      }
      if (this.autoRotate.randomPlanet) {
        return "闅忔満鍦板舰";
      }
      if (this.autoRotate.randomColor) {
        return "闅忔満棰滆壊";
      }
      return "鏈€夋嫨闅忔満鍐呭";
    },
    autoRotateIntervalLabel() {
      const option = PLANET_AUTO_ROTATE_INTERVAL_OPTIONS.find(
        (item) => item.value === this.autoRotate.interval,
      );
      if (option) {
        return option.label;
      }
      return "鏈缃?";"
    },
    sendModeBadgeText() {
      if (this.isAutoRotatePreviewActive) {
        return "闅忔満宸插紑鍚?";"
      }
      return "闅忔満宸插叧闂?";"
    },
    sendModeBadgeClass() {
      if (this.isAutoRotatePreviewActive) {
        return "send-mode-badge--preview-random";
      }
      return "send-mode-badge--fixed";
    },
    sendModeHint() {
      if (this.isAutoRotatePreviewActive) {
        return `鍙戦€佸悗璁惧鎸?${this.autoRotateIntervalLabel} ${this.autoRotateContentLabel} 鑷姩杞挱`;
      }
      return "鍙戦€佸悗璁惧浣跨敤褰撳墠鍥哄畾鏄熺悆閰嶇疆";
    },
    sendButtonText() {
      if (this.isAutoRotatePreviewActive) {
        return "鍙戦€侀殢鏈?";"
      }
      return "鍙戦€佸浐瀹?";"
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
    autoRotate: {
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
      getStorage(PLANET_PAGE_STORAGE_KEY),
    );
    this.config = savedState.config;
    this.clockConfig = savedState.clockConfig;
    this.autoRotate = savedState.autoRotate;
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
      this.startAutoRotateTimer();
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
      navigateBack();
    },
    disableAutoRotateForManualEdit() {
      if (!this.autoRotate.enabled) {
        return;
      }
      this.autoRotate.enabled = false;
      this.stopAutoRotateTimer();
    },
    persistLocalState() {
      setStorage(PLANET_PAGE_STORAGE_KEY, {
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
        autoRotate: {
          enabled: this.autoRotate.enabled,
          randomPlanet: this.autoRotate.randomPlanet,
          randomColor: this.autoRotate.randomColor,
          interval: this.autoRotate.interval,
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
        autoRotate,
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

      if (autoRotate && typeof autoRotate === "object") {
        if (autoRotate.enabled === true || autoRotate.enabled === false) {
          this.autoRotate.enabled = autoRotate.enabled;
        }
        if (autoRotate.randomPlanet === true || autoRotate.randomPlanet === false) {
          this.autoRotate.randomPlanet = autoRotate.randomPlanet;
        }
        if (autoRotate.randomColor === true || autoRotate.randomColor === false) {
          this.autoRotate.randomColor = autoRotate.randomColor;
        }
        const autoRotateInterval = Number(autoRotate.interval);
        if (
          PLANET_AUTO_ROTATE_INTERVAL_OPTIONS.some(
            (item) => item.value === autoRotateInterval,
          )
        ) {
          this.autoRotate.interval = autoRotateInterval;
        }
        this.restartAutoRotateTimer();
      }

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
        this.deviceStore.applyResolvedBusinessMode("planet_screensaver");
        this.showSendSuccess();
      } catch (error) {
        this.deviceStore.applyResolvedBusinessMode(previousMode);
        console.error("鍙戦€佹槦鐞冨睆淇濆け璐?", error);
        this.showSendFailure(error);
      } finally {
        this.endSendUi();
      }
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
            this.contentHeight = `${Math.max(120, nextHeight - 76)}px`;
          });
          query
            .select(".preview-canvas-container")
            .boundingClientRect((data) => {
              if (!data || !data.width) {
                this.previewCanvasReady = true;
                this.startPreviewPlayback();
                this.startAutoRotateTimer();
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
              this.startAutoRotateTimer();
            })
            .exec();
        }, 80);
      });
    },
    renderPreviewFrame(progress) {
      let frameMap;
      if (this.previewSequence && this.previewSequence.maps && this.previewSequence.maps.length > 0) {
        // 鏍规嵁 progress 閫夋嫨瀵瑰簲甯?
        const frameCount = this.previewSequence.maps.length;
        const frameIndex = Math.min(frameCount - 1, Math.floor(progress * frameCount));
        frameMap = this.previewSequence.maps[frameIndex];
        
        // 鍙湁鏄剧ず鏃堕挓鏃舵墠澶嶅埗frameMap锛岄伩鍏嶆薄鏌撶紦瀛?
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
        // 鍥為€€锛氬疄鏃舵覆鏌撳綋鍓嶈繘搴﹀抚
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
        if (this.config.colorSeed !== PLANET_DEFAULT_COLOR_SEED) {
          const progress = this.getCurrentPreviewProgress();
          this.disableAutoRotateForManualEdit();
          this.config.colorSeed = PLANET_DEFAULT_COLOR_SEED;
          this.schedulePreviewRefresh(progress);
        }
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.disableAutoRotateForManualEdit();
      this.config.preset = presetId;
      this.config.colorSeed = PLANET_DEFAULT_COLOR_SEED;
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
      this.disableAutoRotateForManualEdit();
      this.config.preset = presetId;
      this.config.colorSeed = PLANET_FIXED_PALETTE_COLOR_SEED;
      this.schedulePreviewRefresh(progress);
    },
    handleSizeSelect(sizeId) {
      if (sizeId === this.config.size) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.disableAutoRotateForManualEdit();
      this.config.size = sizeId;
      this.schedulePreviewRefresh(progress);
    },
    handleRandomColor() {
      const progress = this.getCurrentPreviewProgress();
      this.disableAutoRotateForManualEdit();
      this.config.colorSeed = createRandomPlanetColorSeed();
      this.schedulePreviewRefresh(progress);
    },
    handleRandomPlanet() {
      if (isPortalPresetValue(this.config.preset)) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.disableAutoRotateForManualEdit();
      this.config.seed = createRandomPlanetPreviewSeed();
      this.schedulePreviewRefresh(progress);
    },
    applyAutoRotateStep() {
      if (!this.autoRotate.enabled) {
        return;
      }
      if (!this.autoRotate.randomPlanet && !this.autoRotate.randomColor) {
        return;
      }

      const progress = this.getCurrentPreviewProgress();
      if (this.autoRotate.randomPlanet && !isPortalPresetValue(this.config.preset)) {
        this.config.seed = createRandomPlanetPreviewSeed();
      }
      if (this.autoRotate.randomColor && !this.isFixedPalettePreset) {
        this.config.colorSeed = createRandomPlanetColorSeed();
      }
      this.schedulePreviewRefresh(progress);
    },
    restartAutoRotateTimer() {
      this.stopAutoRotateTimer();
      this.startAutoRotateTimer();
    },
    startAutoRotateTimer() {
      this.stopAutoRotateTimer();
      if (!this.autoRotate.enabled) {
        return;
      }
      const intervalMs = Math.max(1, this.autoRotate.interval) * 1000;
      this.autoRotateTimer = setTimeout(() => {
        this.autoRotateTimer = null;
        this.applyAutoRotateStep();
        this.startAutoRotateTimer();
      }, intervalMs);
    },
    stopAutoRotateTimer() {
      if (this.autoRotateTimer) {
        clearTimeout(this.autoRotateTimer);
        this.autoRotateTimer = null;
      }
    },
    setAutoRotateEnabled(enabled) {
      if (this.autoRotate.enabled === enabled) {
        return;
      }
      this.autoRotate.enabled = enabled;
      this.restartAutoRotateTimer();
    },
    toggleAutoRotateRandomPlanet() {
      if (this.autoRotate.randomPlanet && !this.autoRotate.randomColor) {
        return;
      }
      this.autoRotate.randomPlanet = !this.autoRotate.randomPlanet;
    },
    toggleAutoRotateRandomColor() {
      if (this.autoRotate.randomColor && !this.autoRotate.randomPlanet) {
        return;
      }
      this.autoRotate.randomColor = !this.autoRotate.randomColor;
    },
    setAutoRotateInterval(interval) {
      if (
        !PLANET_AUTO_ROTATE_INTERVAL_OPTIONS.some(
          (item) => item.value === interval,
        )
      ) {
        return;
      }
      if (this.autoRotate.interval === interval) {
        return;
      }
      this.autoRotate.interval = interval;
      this.restartAutoRotateTimer();
    },
    handleDirectionSelect(directionId) {
      if (directionId === this.config.direction) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.disableAutoRotateForManualEdit();
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
      this.disableAutoRotateForManualEdit();
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
      this.disableAutoRotateForManualEdit();
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
      this.disableAutoRotateForManualEdit();
      this.config.planetY = planetY;
      this.schedulePreviewRefresh(progress);
    },
    handlePlanetCenter() {
      if (this.config.planetX === 32 && this.config.planetY === 32) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.disableAutoRotateForManualEdit();
      this.config.planetX = 32;
      this.config.planetY = 32;
      this.schedulePreviewRefresh(progress);
    },
    toggleTimeShow() {
      this.disableAutoRotateForManualEdit();
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
      this.disableAutoRotateForManualEdit();
      this.clockConfig.time[key] = nextValue;
      this.refreshOverlayPreview();
    },
    handleTimeColor(color) {
      if (typeof color !== "string" || color.length === 0) {
        return;
      }
      this.disableAutoRotateForManualEdit();
      this.clockConfig.time.color = color;
      this.refreshOverlayPreview();
    },
    handleTimeAlign(align) {
      if (align !== "left" && align !== "center" && align !== "right") {
        return;
      }
      this.disableAutoRotateForManualEdit();
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
      this.disableAutoRotateForManualEdit();
      this.clockConfig.font = fontId;
      this.refreshOverlayPreview();
    },
    toggleTimeSeconds() {
      this.disableAutoRotateForManualEdit();
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
        autoRotate: {
          enabled: this.autoRotate.enabled,
          randomPlanet: this.autoRotate.randomPlanet,
          randomColor: this.autoRotate.randomColor,
          interval: this.autoRotate.interval,
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
      
      // 瀹炴椂娓叉煋鍔ㄧ敾寰幆 (璺熸澘杞戒竴鑷达紝姣忓抚瀹炴椂璁＄畻)
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
        
        // 甯ч棿闅旇窡鏉胯浇涓€鑷? cycleDuration / 48甯?
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
      this.stopAutoRotateTimer();
      if (this.previewRefreshTimer) {
        clearTimeout(this.previewRefreshTimer);
        this.previewRefreshTimer = null;
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
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.preview-caption-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.send-mode-badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  min-height: 32rpx;
  padding: 0 12rpx;
  border: 2rpx solid var(--nb-ink);
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 900;
  line-height: 1.2;
  color: var(--nb-ink);
  box-shadow: 3rpx 3rpx 0 rgba(0, 0, 0, 0.35);
}

.send-mode-badge--fixed {
  background: var(--nb-yellow);
}

.send-mode-badge--preview-random {
  background: #7fffd4;
}

.send-mode-hint {
  display: block;
  font-size: 20rpx;
  line-height: 1.35;
  color: var(--text-secondary);
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
