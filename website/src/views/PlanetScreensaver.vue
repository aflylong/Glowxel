<template>
  <div class="planet-page glx-page-shell game-mode-page">
    <PcModeTopbar title="星球屏保" />

    <section class="planet-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack planet-preview-card game-preview-card"
      >
        <div class="planet-preview-card__head">
          <div>
            <p class="planet-preview-card__eyebrow">Device Mode</p>
            <h2 class="planet-preview-card__title">星球屏保预览</h2>
          </div>
        </div>

        <div class="planet-preview-toolbar">
          <div class="planet-preview-toolbar__actions">
            <button
              type="button"
              class="glx-button glx-button--primary planet-send-button"
              :disabled="isSending"
              @click="handleSend"
            >
              {{ isSending ? "发送中..." : sendButtonText }}
            </button>
            <button
              v-if="showRandomPlanetAction"
              type="button"
              class="glx-button glx-button--ghost"
              :disabled="isSending"
              @click="handleRandomPlanet"
            >
              {{ randomPlanetActionLabel }}
            </button>
            <button
              v-if="showRandomColorAction"
              type="button"
              class="glx-button glx-button--ghost"
              :disabled="isSending"
              @click="handleRandomColor"
            >
              随机颜色
            </button>
          </div>
          <span
            class="glx-chip"
            :class="isAutoRotatePreviewActive ? 'glx-chip--green' : 'glx-chip--yellow'"
          >
            {{ sendModeBadgeText }}
          </span>
        </div>

        <div class="planet-preview-stage game-preview-stage">
          <div class="planet-preview-board">
            <DevicePixelBoard :pixels="currentPixels" :grid-visible="true" />
          </div>
        </div>

        <div class="planet-preview-note">
          {{ sendModeHint }}
        </div>

        <div class="planet-summary-grid">
          <article class="planet-summary-card">
            <span class="planet-summary-card__label">星球</span>
            <strong class="planet-summary-card__value">{{ selectedPresetLabel }}</strong>
            <span class="planet-summary-card__meta">{{ selectedSizeLabel }}</span>
          </article>
          <article class="planet-summary-card">
            <span class="planet-summary-card__label">布局</span>
            <strong class="planet-summary-card__value">{{ selectedDirectionLabel }}</strong>
            <span class="planet-summary-card__meta">
              X {{ config.planetX }} / Y {{ config.planetY }}
            </span>
          </article>
          <article class="planet-summary-card">
            <span class="planet-summary-card__label">轮播</span>
            <strong class="planet-summary-card__value">{{ autoRotateIntervalLabel }}</strong>
            <span class="planet-summary-card__meta">{{ autoRotateContentLabel }}</span>
          </article>
        </div>
      </article>

      <div class="planet-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">模式配置</h2>
            <span class="glx-section-meta">星球 / 时间 / 字体 / 轮播</span>
          </div>
          <DeviceModeTabs v-model="activeTab" :items="tabItems" />
        </article>

        <article
          v-if="activeTab === 'planet'"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">星球类型</h2>
            <span class="glx-section-meta">{{ presetOptions.length }} 个预设</span>
          </div>

          <div class="planet-grid">
            <button
              v-for="preset in presetOptions"
              :key="preset.id"
              type="button"
              class="planet-grid__item"
              :class="{ 'is-active': config.preset === preset.id }"
              @click="handlePresetSelect(preset.id)"
            >
              <strong>{{ preset.label }}</strong>
              <span>{{ preset.id }}</span>
            </button>
          </div>

          <div v-if="isPortalPreset" class="planet-block">
            <span class="game-row__label">传送门颜色</span>
            <DeviceModeTabs
              v-model="portalPresetValue"
              :items="portalColorOptions"
            />
          </div>

          <div class="game-row">
            <span class="game-row__label">水平位置</span>
            <DeviceModeStepper v-model="config.planetX" :min="0" :max="63" />
          </div>

          <div class="game-row">
            <span class="game-row__label">垂直位置</span>
            <DeviceModeStepper v-model="config.planetY" :min="0" :max="63" />
          </div>

          <div class="game-inline-actions">
            <button
              type="button"
              class="glx-button glx-button--ghost"
              @click="centerPlanet"
            >
              快速居中
            </button>
          </div>

          <div class="game-row">
            <span class="game-row__label">转速 {{ config.speed }}</span>
            <DeviceModeStepper
              v-model="config.speed"
              :min="PLANET_PREVIEW_MIN_SPEED"
              :max="PLANET_PREVIEW_MAX_SPEED"
            />
          </div>

          <div class="planet-block">
            <span class="game-row__label">{{ sizeSectionLabel }}</span>
            <DeviceModeTabs v-model="config.size" :items="sizeTabItems" />
          </div>

          <div v-if="!isPortalPreset" class="planet-block">
            <span class="game-row__label">自转方向</span>
            <DeviceModeTabs v-model="config.direction" :items="directionTabItems" />
          </div>
        </article>

        <article
          v-else-if="activeTab === 'time'"
          class="glx-section-card glx-section-card--stack"
        >
          <ClockTextSettingsSection
            title="时间显示"
            description="时间位置、字号、对齐与颜色保持和 mobile 同一套语义。"
            :section="clockConfig.time"
            :preset-colors="timeColorItems"
            :show-font-size="true"
            :show-seconds-control="true"
            :show-seconds="clockConfig.showSeconds"
            @toggle="clockConfig.time.show = !clockConfig.time.show"
            @toggle-seconds="clockConfig.showSeconds = !clockConfig.showSeconds"
            @adjust="adjustTime"
            @set-align="handleTimeAlign"
            @update-color="clockConfig.time.color = $event"
          />
        </article>

        <article v-else-if="activeTab === 'font'" class="glx-section-card glx-section-card--stack">
          <GameModeFontSelector
            title="字体样式"
            description="预览和发送共用当前时间字体配置。"
            :font-options="fontOptions"
            :selected-font="clockConfig.font"
            :show-seconds="clockConfig.showSeconds"
            :hour-format="24"
            :show-hour-format="false"
            @select-font="clockConfig.font = $event"
            @set-show-seconds="clockConfig.showSeconds = $event"
          />
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">自动轮播</h2>
            <span class="glx-section-meta">保持和 mobile 同一套随机轮播语义</span>
          </div>

          <div class="planet-block">
            <span class="game-row__label">自动轮播</span>
            <DeviceModeTabs v-model="autoRotateEnabledValue" :items="autoRotateSwitchItems" />
          </div>

          <div class="planet-block">
            <span class="game-row__label">随机内容</span>
            <div class="planet-toggle-grid">
              <button
                type="button"
                class="planet-toggle-card"
                :class="{ 'is-active': autoRotate.randomPlanet }"
                @click="toggleAutoRotateRandomPlanet"
              >
                随机星球
              </button>
              <button
                type="button"
                class="planet-toggle-card"
                :class="{ 'is-active': autoRotate.randomColor }"
                @click="toggleAutoRotateRandomColor"
              >
                随机颜色
              </button>
            </div>
          </div>

          <div class="planet-block">
            <span class="game-row__label">切换时长</span>
            <DeviceModeTabs v-model="autoRotate.interval" :items="autoRotateIntervalItems" />
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import ClockTextSettingsSection from "@/components/device/clock/ClockTextSettingsSection.vue";
import DeviceModeStepper from "@/components/device/modes/DeviceModeStepper.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import DevicePixelBoard from "@/components/device/modes/DevicePixelBoard.vue";
import GameModeFontSelector from "@/components/device/modes/GameModeFontSelector.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import { useFeedback } from "@/composables/useFeedback.js";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import {
  drawClockTextToPixels,
  getClockTextHeight,
  getClockTextWidth,
  getClockFontOptions,
  getCurrentTimeText,
  hexToRgb,
} from "@/utils/clockCanvas.js";
import { readStorageJson, writeStorageJson } from "@/utils/device-mode-core.js";
import {
  buildPlanetScreensaverPreviewFrame,
  createDefaultPlanetPreviewConfig,
  createRandomPlanetColorSeed,
  createRandomPlanetPreviewSeed,
  getPlanetPreviewCycleDuration,
  PLANET_DIRECTION_OPTIONS,
  PLANET_PREVIEW_MAX_SPEED,
  PLANET_PREVIEW_MIN_SPEED,
  PLANET_REFERENCE_DEFAULT_COLOR_SEED,
  PLANET_SCREEN_PRESETS,
  PLANET_SIZE_OPTIONS,
} from "@/utils/planetScreensaverPreview.js";

const PLANET_PAGE_STORAGE_KEY = "planet_screensaver_page_state";
const PLANET_TIME_COLOR_OPTIONS = Object.freeze([
  { label: "青色", value: "#64c8ff" },
  { label: "绿色", value: "#00ff9d" },
  { label: "黄色", value: "#ffdc00" },
  { label: "橙色", value: "#ffa500" },
  { label: "红色", value: "#ff6464" },
  { label: "紫色", value: "#c864ff" },
  { label: "白色", value: "#ffffff" },
]);
const PLANET_PORTAL_COLOR_OPTIONS = Object.freeze([
  { id: "portal_green", label: "绿色" },
  { id: "portal_blue", label: "蓝色" },
  { id: "portal_yellow", label: "黄色" },
]);
const PLANET_AUTO_ROTATE_INTERVAL_OPTIONS = Object.freeze([
  { value: 30, label: "30 秒" },
  { value: 60, label: "1 分钟" },
  { value: 300, label: "5 分钟" },
  { value: 600, label: "10 分钟" },
]);
const PLANET_DISPLAY_PRESETS = Object.freeze(
  PLANET_SCREEN_PRESETS.filter(
    (preset) =>
      preset.id !== "portal_green" &&
      preset.id !== "portal_blue" &&
      preset.id !== "portal_yellow",
  ),
);

const tabItems = Object.freeze([
  { value: "planet", label: "星球" },
  { value: "time", label: "时间" },
  { value: "font", label: "字体" },
  { value: "rotate", label: "轮播" },
]);
const sizeTabItems = Object.freeze(
  PLANET_SIZE_OPTIONS.map((item) => ({ value: item.id, label: item.label })),
);
const directionTabItems = Object.freeze(
  PLANET_DIRECTION_OPTIONS.map((item) => ({ value: item.id, label: item.label })),
);
const portalColorOptions = Object.freeze(
  PLANET_PORTAL_COLOR_OPTIONS.map((item) => ({
    value: item.id,
    label: item.label,
  })),
);
const timeColorItems = Object.freeze(
  PLANET_TIME_COLOR_OPTIONS.map((item) => ({
    name: item.label,
    hex: item.value,
  })),
);
const autoRotateSwitchItems = Object.freeze([
  { value: "on", label: "开启" },
  { value: "off", label: "关闭" },
]);
const autoRotateIntervalItems = Object.freeze(
  PLANET_AUTO_ROTATE_INTERVAL_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
  })),
);

const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();
const fontOptions = getClockFontOptions();

const savedState = normalizePlanetPageState(readStorageJson(PLANET_PAGE_STORAGE_KEY));
const activeTab = ref("planet");
const isSending = ref(false);
const currentPixels = ref(new Map());
const previewTimerId = ref(null);
const autoRotateTimerId = ref(null);
const previewPlaybackStartedAt = ref(Date.now());

const config = reactive(savedState.config);
const clockConfig = reactive(savedState.clockConfig);
const autoRotate = reactive(savedState.autoRotate);

const presetOptions = PLANET_DISPLAY_PRESETS;

const selectedPresetLabel = computed(() => {
  const matched = PLANET_SCREEN_PRESETS.find((item) => item.id === config.preset);
  return matched ? matched.label : "--";
});

const selectedSizeLabel = computed(() => {
  const matched = PLANET_SIZE_OPTIONS.find((item) => item.id === config.size);
  return matched ? matched.label : "--";
});

const selectedDirectionLabel = computed(() => {
  const matched = PLANET_DIRECTION_OPTIONS.find((item) => item.id === config.direction);
  return matched ? matched.label : "--";
});

const isPortalPreset = computed(() => isPortalPresetValue(config.preset));
const isFixedPalettePreset = computed(() => isFixedPalettePresetValue(config.preset));

const sizeSectionLabel = computed(() => {
  return isPortalPreset.value ? "传送门大小" : "星球大小";
});

const showRandomColorAction = computed(() => !isFixedPalettePreset.value);
const showRandomPlanetAction = computed(() => !isPortalPreset.value);

const randomPlanetActionLabel = computed(() => {
  return isPortalPreset.value ? "随机纹理" : "随机星球";
});

const isAutoRotatePreviewActive = computed(() => {
  if (!autoRotate.enabled) {
    return false;
  }
  if (autoRotate.randomPlanet) {
    return true;
  }
  return autoRotate.randomColor;
});

const autoRotateContentLabel = computed(() => {
  if (autoRotate.randomPlanet && autoRotate.randomColor) {
    return "随机星球 + 随机颜色";
  }
  if (autoRotate.randomPlanet) {
    return "随机星球";
  }
  if (autoRotate.randomColor) {
    return "随机颜色";
  }
  return "未选择随机内容";
});

const autoRotateIntervalLabel = computed(() => {
  const matched = PLANET_AUTO_ROTATE_INTERVAL_OPTIONS.find(
    (item) => item.value === autoRotate.interval,
  );
  return matched ? matched.label : "未设置";
});

const sendModeBadgeText = computed(() => {
  return isAutoRotatePreviewActive.value ? "随机已开启" : "随机已关闭";
});

const sendModeHint = computed(() => {
  if (isAutoRotatePreviewActive.value) {
    return `发送后设备按 ${autoRotateIntervalLabel.value} ${autoRotateContentLabel.value} 自动轮播`;
  }
  return "发送后设备使用当前固定星球配置";
});

const sendButtonText = computed(() => {
  return isAutoRotatePreviewActive.value ? "发送随机" : "发送固定";
});

const autoRotateEnabledValue = computed({
  get() {
    return autoRotate.enabled ? "on" : "off";
  },
  set(value) {
    autoRotate.enabled = value === "on";
    restartAutoRotateTimer();
  },
});

const portalPresetValue = computed({
  get() {
    return config.preset;
  },
  set(value) {
    handlePortalColorSelect(value);
  },
});

watch(
  () => [
    config.preset,
    config.size,
    config.direction,
    config.planetX,
    config.planetY,
    config.speed,
    config.seed,
    config.colorSeed,
    clockConfig.font,
    clockConfig.showSeconds,
    clockConfig.time.show,
    clockConfig.time.fontSize,
    clockConfig.time.x,
    clockConfig.time.y,
    clockConfig.time.color,
    clockConfig.time.align,
    autoRotate.enabled,
    autoRotate.randomPlanet,
    autoRotate.randomColor,
    autoRotate.interval,
  ],
  () => {
    persistState();
    refreshPreview();
    restartAutoRotateTimer();
  },
);

onMounted(() => {
  deviceStore.init();
  refreshPreview();
  startPreviewPlayback();
  startAutoRotateTimer();
});

onBeforeUnmount(() => {
  stopPreviewPlayback();
  stopAutoRotateTimer();
});

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

function normalizePlanetPageState(saved) {
  const state = saved && typeof saved === "object" ? saved : {};
  const configState = createDefaultPlanetPreviewConfig();
  const clockState = createDefaultPlanetClockConfig();
  const rotateState = createDefaultPlanetAutoRotateConfig();

  if (state.config && typeof state.config === "object") {
    if (PLANET_SCREEN_PRESETS.some((item) => item.id === state.config.preset)) {
      configState.preset = state.config.preset;
    }
    if (PLANET_SIZE_OPTIONS.some((item) => item.id === state.config.size)) {
      configState.size = state.config.size;
    }
    if (PLANET_DIRECTION_OPTIONS.some((item) => item.id === state.config.direction)) {
      configState.direction = state.config.direction;
    }
    if (Number.isFinite(Number(state.config.planetX))) {
      configState.planetX = clampBoardValue(state.config.planetX);
    }
    if (Number.isFinite(Number(state.config.planetY))) {
      configState.planetY = clampBoardValue(state.config.planetY);
    }
    if (Number.isFinite(Number(state.config.speed))) {
      configState.speed = clampSpeed(state.config.speed);
    }
    if (Number.isFinite(Number(state.config.seed))) {
      configState.seed = Math.round(Number(state.config.seed));
    }
    if (Number.isFinite(Number(state.config.colorSeed))) {
      configState.colorSeed = Math.round(Number(state.config.colorSeed));
    }
  }

  if (state.clockConfig && typeof state.clockConfig === "object") {
    if (typeof state.clockConfig.font === "string") {
      clockState.font = state.clockConfig.font;
    }
    if (
      state.clockConfig.showSeconds === true ||
      state.clockConfig.showSeconds === false
    ) {
      clockState.showSeconds = state.clockConfig.showSeconds;
    }
    if (state.clockConfig.time && typeof state.clockConfig.time === "object") {
      if (
        state.clockConfig.time.show === true ||
        state.clockConfig.time.show === false
      ) {
        clockState.time.show = state.clockConfig.time.show;
      }
      if (Number.isFinite(Number(state.clockConfig.time.fontSize))) {
        clockState.time.fontSize = clampFontSize(state.clockConfig.time.fontSize);
      }
      if (Number.isFinite(Number(state.clockConfig.time.x))) {
        clockState.time.x = clampBoardValue(state.clockConfig.time.x);
      }
      if (Number.isFinite(Number(state.clockConfig.time.y))) {
        clockState.time.y = clampBoardValue(state.clockConfig.time.y);
      }
      if (typeof state.clockConfig.time.color === "string") {
        clockState.time.color = state.clockConfig.time.color;
      }
      if (
        state.clockConfig.time.align === "left" ||
        state.clockConfig.time.align === "center" ||
        state.clockConfig.time.align === "right"
      ) {
        clockState.time.align = state.clockConfig.time.align;
      }
    }
  }

  if (state.autoRotate && typeof state.autoRotate === "object") {
    if (state.autoRotate.enabled === true || state.autoRotate.enabled === false) {
      rotateState.enabled = state.autoRotate.enabled;
    }
    if (
      state.autoRotate.randomPlanet === true ||
      state.autoRotate.randomPlanet === false
    ) {
      rotateState.randomPlanet = state.autoRotate.randomPlanet;
    }
    if (
      state.autoRotate.randomColor === true ||
      state.autoRotate.randomColor === false
    ) {
      rotateState.randomColor = state.autoRotate.randomColor;
    }
    if (
      PLANET_AUTO_ROTATE_INTERVAL_OPTIONS.some(
        (item) => item.value === state.autoRotate.interval,
      )
    ) {
      rotateState.interval = state.autoRotate.interval;
    }
  }

  return {
    config: configState,
    clockConfig: clockState,
    autoRotate: rotateState,
  };
}

function clampBoardValue(value) {
  return Math.max(0, Math.min(63, Math.round(Number(value))));
}

function clampSpeed(value) {
  return Math.max(
    PLANET_PREVIEW_MIN_SPEED,
    Math.min(PLANET_PREVIEW_MAX_SPEED, Math.round(Number(value))),
  );
}

function clampFontSize(value) {
  return Math.max(1, Math.min(3, Math.round(Number(value))));
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

function persistState() {
  writeStorageJson(PLANET_PAGE_STORAGE_KEY, {
    config: {
      preset: config.preset,
      size: config.size,
      direction: config.direction,
      planetX: config.planetX,
      planetY: config.planetY,
      speed: config.speed,
      seed: config.seed,
      colorSeed: config.colorSeed,
    },
    clockConfig: {
      font: clockConfig.font,
      showSeconds: clockConfig.showSeconds,
      time: {
        show: clockConfig.time.show,
        fontSize: clockConfig.time.fontSize,
        x: clockConfig.time.x,
        y: clockConfig.time.y,
        color: clockConfig.time.color,
        align: clockConfig.time.align,
      },
    },
    autoRotate: {
      enabled: autoRotate.enabled,
      randomPlanet: autoRotate.randomPlanet,
      randomColor: autoRotate.randomColor,
      interval: autoRotate.interval,
    },
  });
}

function getPlanetTimeText() {
  return getCurrentTimeText(clockConfig.showSeconds, 24);
}

function resolveBoardTimePlacement(text = getPlanetTimeText()) {
  const fontSize = clampFontSize(clockConfig.time.fontSize);
  const width = getClockTextWidth(text, clockConfig.font, fontSize);
  const height = getClockTextHeight(clockConfig.font, fontSize);
  const maxX = Math.max(0, 64 - width);
  const maxY = Math.max(0, 64 - height);
  let x = Number(clockConfig.time.x);
  let y = Number(clockConfig.time.y);

  if (clockConfig.time.align === "center") {
    x -= Math.floor(width / 2);
  } else if (clockConfig.time.align === "right") {
    x -= width;
  }

  if (!Number.isFinite(x)) {
    x = 0;
  }
  if (!Number.isFinite(y)) {
    y = 0;
  }

  return {
    x: Math.max(0, Math.min(maxX, Math.round(x))),
    y: Math.max(0, Math.min(maxY, Math.round(y))),
    fontSize,
  };
}

function refreshPreview() {
  const progress = getCurrentPreviewProgress();
  currentPixels.value = buildPreviewFrame(progress);
}

function buildPreviewFrame(progress) {
  const frameMap = new Map(
    buildPlanetScreensaverPreviewFrame({ ...config }, progress),
  );
  if (clockConfig.time.show) {
    const text = getPlanetTimeText();
    const placement = resolveBoardTimePlacement(text);
    drawClockTextToPixels(
      text,
      placement.x,
      placement.y,
      clockConfig.time.color,
      frameMap,
      clockConfig.font,
      placement.fontSize,
      "left",
    );
  }
  return frameMap;
}

function getCurrentPreviewProgress() {
  const cycleDuration = getPlanetPreviewCycleDuration(config.speed);
  if (cycleDuration <= 0) {
    return 0;
  }
  const elapsed = Date.now() - previewPlaybackStartedAt.value;
  return (elapsed % cycleDuration) / cycleDuration;
}

function startPreviewPlayback(preservedProgress = 0) {
  stopPreviewPlayback();
  const cycleDuration = getPlanetPreviewCycleDuration(config.speed);
  previewPlaybackStartedAt.value = Date.now() - preservedProgress * cycleDuration;

  const tick = () => {
    refreshPreview();
    previewTimerId.value = window.setTimeout(tick, 120);
  };
  tick();
}

function stopPreviewPlayback() {
  if (previewTimerId.value !== null) {
    window.clearTimeout(previewTimerId.value);
    previewTimerId.value = null;
  }
}

function restartPreviewPlayback() {
  startPreviewPlayback(getCurrentPreviewProgress());
}

function applyAutoRotateStep() {
  if (!autoRotate.enabled) {
    return;
  }
  if (!autoRotate.randomPlanet && !autoRotate.randomColor) {
    return;
  }
  if (autoRotate.randomPlanet && !isPortalPreset.value) {
    config.seed = createRandomPlanetPreviewSeed();
  }
  if (autoRotate.randomColor && !isFixedPalettePreset.value) {
    config.colorSeed = createRandomPlanetColorSeed();
  }
}

function startAutoRotateTimer() {
  stopAutoRotateTimer();
  if (!autoRotate.enabled) {
    return;
  }
  const intervalMs = Math.max(1, Number(autoRotate.interval)) * 1000;
  autoRotateTimerId.value = window.setTimeout(() => {
    autoRotateTimerId.value = null;
    applyAutoRotateStep();
    startAutoRotateTimer();
  }, intervalMs);
}

function stopAutoRotateTimer() {
  if (autoRotateTimerId.value !== null) {
    window.clearTimeout(autoRotateTimerId.value);
    autoRotateTimerId.value = null;
  }
}

function restartAutoRotateTimer() {
  startAutoRotateTimer();
}

function disableAutoRotateForManualEdit() {
  if (!autoRotate.enabled) {
    return;
  }
  autoRotate.enabled = false;
  stopAutoRotateTimer();
}

function handlePresetSelect(presetId) {
  if (config.preset === presetId) {
    if (config.colorSeed !== PLANET_REFERENCE_DEFAULT_COLOR_SEED) {
      disableAutoRotateForManualEdit();
      config.colorSeed = PLANET_REFERENCE_DEFAULT_COLOR_SEED;
      restartPreviewPlayback();
    }
    return;
  }
  disableAutoRotateForManualEdit();
  config.preset = presetId;
  config.colorSeed = PLANET_REFERENCE_DEFAULT_COLOR_SEED;
  restartPreviewPlayback();
}

function handleRandomPlanet() {
  if (isPortalPreset.value) {
    return;
  }
  disableAutoRotateForManualEdit();
  config.seed = createRandomPlanetPreviewSeed();
  restartPreviewPlayback();
}

function handleRandomColor() {
  disableAutoRotateForManualEdit();
  config.colorSeed = createRandomPlanetColorSeed();
  restartPreviewPlayback();
}

function handlePortalColorSelect(presetId) {
  if (!isPortalPresetValue(presetId)) {
    return;
  }
  if (config.preset === presetId) {
    return;
  }
  disableAutoRotateForManualEdit();
  config.preset = presetId;
  config.colorSeed = PLANET_REFERENCE_DEFAULT_COLOR_SEED;
  restartPreviewPlayback();
}

function centerPlanet() {
  config.planetX = 32;
  config.planetY = 32;
}

function adjustTime(fieldKey, delta, min, max) {
  const nextValue = Math.max(
    min,
    Math.min(max, Number(clockConfig.time[fieldKey]) + delta),
  );
  clockConfig.time[fieldKey] = nextValue;
}

function handleTimeAlign(align) {
  clockConfig.time.align = align;
  if (align === "left") {
    clockConfig.time.x = 0;
  } else if (align === "center") {
    clockConfig.time.x = 32;
  } else {
    clockConfig.time.x = 63;
  }
}

function toggleAutoRotateRandomPlanet() {
  if (autoRotate.randomPlanet && !autoRotate.randomColor) {
    return;
  }
  autoRotate.randomPlanet = !autoRotate.randomPlanet;
}

function toggleAutoRotateRandomColor() {
  if (autoRotate.randomColor && !autoRotate.randomPlanet) {
    return;
  }
  autoRotate.randomColor = !autoRotate.randomColor;
}

function buildPlanetSendPayload() {
  const timeText = getPlanetTimeText();
  const placement = resolveBoardTimePlacement(timeText);
  return {
    preset: config.preset,
    size: config.size,
    direction: config.direction,
    planetX: config.planetX,
    planetY: config.planetY,
    speed: config.speed,
    seed: config.seed,
    colorSeed: isFixedPalettePreset.value
      ? PLANET_REFERENCE_DEFAULT_COLOR_SEED
      : config.colorSeed,
    font: clockConfig.font,
    showSeconds: clockConfig.showSeconds,
    time: {
      show: clockConfig.time.show,
      fontSize: placement.fontSize,
      x: placement.x,
      y: placement.y,
      color: hexToRgb(clockConfig.time.color),
    },
    autoRotate: {
      enabled: autoRotate.enabled,
      randomPlanet: autoRotate.randomPlanet,
      randomColor: autoRotate.randomColor,
      interval: autoRotate.interval,
    },
  };
}

async function handleSend() {
  if (deviceStore.connected !== true) {
    feedback.warning("设备未连接", "请先返回设备控制页建立连接。");
    return;
  }

  isSending.value = true;
  feedback.showBlocking(
    "发送星球屏保",
    `正在把 ${selectedPresetLabel.value} 发送到设备。`,
  );

  try {
    await deviceStore.setPlanetScreensaver(buildPlanetSendPayload());
    feedback.success("发送成功", `${selectedPresetLabel.value} 已发送到设备。`);
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("发送失败", error.message);
    } else {
      feedback.error("发送失败", "星球屏保发送失败。");
    }
  } finally {
    feedback.hideBlocking();
    isSending.value = false;
  }
}
</script>

<style scoped>
.game-mode-page {
  gap: 24px;
}

.planet-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.planet-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.planet-preview-card {
  gap: 18px;
}

.planet-preview-card__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.planet-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.planet-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.planet-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.planet-preview-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.planet-send-button {
  min-width: 196px;
  min-height: 50px;
}

.planet-preview-stage {
  padding: 20px;
  min-height: 420px;
  display: flex;
  align-items: center;
}

.planet-preview-board {
  width: min(100%, 620px);
  margin: 0 auto;
}

.planet-preview-board :deep(.device-pixel-board) {
  box-shadow: none;
}

.planet-preview-note {
  padding: 12px 14px;
  border: 2px solid #000000;
  background: #ffffff;
  font-size: 13px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.planet-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.planet-summary-card {
  display: grid;
  gap: 6px;
  min-height: 112px;
  padding: 16px;
  border: 2px solid #000000;
  background: #ffffff;
}

.planet-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.planet-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.planet-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.planet-config-stack {
  min-width: 0;
  display: grid;
  gap: 18px;
}

.game-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.game-row__label {
  font-size: 14px;
  font-weight: 800;
}

.game-inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.planet-block {
  display: grid;
  gap: 10px;
}

.planet-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.planet-grid__item,
.planet-toggle-card {
  min-height: 92px;
  padding: 14px;
  display: grid;
  gap: 6px;
  border: 2px solid #000000;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.planet-grid__item.is-active,
.planet-toggle-card.is-active {
  background: #ffd23f;
}

.planet-grid__item span {
  font-size: 12px;
  color: var(--glx-text-muted);
}

.planet-toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (max-width: 1180px) {
  .planet-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .planet-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .planet-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .planet-grid,
  .planet-toggle-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .game-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
