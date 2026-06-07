<template>
  <div class="water-page glx-page-shell game-mode-page">
    <PcModeTopbar title="水世界" />
    <section class="water-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack water-preview-card game-preview-card"
      >
        <div class="water-preview-card__head">
          <div>
            <p class="water-preview-card__eyebrow">Device Mode</p>
            <h2 class="water-preview-card__title">水世界预览</h2>
          </div>
        </div>

        <div class="water-preview-toolbar">
          <button
            type="button"
            class="glx-button glx-button--primary water-send-button"
            :disabled="isSending"
            @click="handleSend"
          >
            {{ isSending ? "发送中..." : "发送到设备" }}
          </button>
          <span
            class="glx-chip"
            :class="deviceStore.connected ? 'glx-chip--green' : 'glx-chip--yellow'"
          >
            {{ deviceStore.connected ? "已连接" : "未连接" }}
          </span>
        </div>

        <div class="water-preview-stage game-preview-stage">
          <div class="water-preview-board">
            <DevicePixelBoard :pixels="currentPreviewPixels" :grid-visible="false" />
            <DeviceSendingOverlay
              :visible="isSending"
              title="正在发送水世界"
              description="发送期间锁定当前预览快照，等待设备完成水世界场景与时钟配置事务提交。"
            >
              <div class="water-preview-sending">
                <DevicePixelBoard :pixels="sendingPixels" :grid-visible="false" />
              </div>
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="water-summary-grid">
          <article class="water-summary-card">
            <span class="water-summary-card__label">场景</span>
            <strong class="water-summary-card__value">{{ selectedPresetLabel }}</strong>
            <span class="water-summary-card__meta">{{ colorThemeLabel }}</span>
          </article>
          <article class="water-summary-card">
            <span class="water-summary-card__label">时间</span>
            <strong class="water-summary-card__value">
              {{ clockConfig.showSeconds ? "显示秒钟" : "隐藏秒钟" }}
            </strong>
            <span class="water-summary-card__meta">
              字号 {{ clockConfig.time.fontSize }} / {{ clockConfig.hourFormat }} 小时制
            </span>
          </article>
          <article class="water-summary-card">
            <span class="water-summary-card__label">字体</span>
            <strong class="water-summary-card__value">{{ selectedFontLabel }}</strong>
            <span class="water-summary-card__meta">{{ clockConfig.time.color }}</span>
          </article>
        </div>
      </article>

      <div class="water-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">模式配置</h2>
            <span class="glx-section-meta">场景 / 时间 / 字体</span>
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabItems" />
        </article>

        <template v-if="currentTab === 'scene'">
          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">路线</h2>
              <span class="glx-section-meta">{{ WATER_WORLD_OPTIONS.length }} 个水域</span>
            </div>
            <DeviceModeTabs
              v-model="config.preset"
              :items="WATER_WORLD_OPTIONS.map((item) => ({ value: item.preset, label: item.label }))"
            />
          </article>

          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">海水颜色</h2>
              <span class="glx-section-meta">随机海色也会一起缓存</span>
            </div>
            <div class="game-inline-actions">
              <button type="button" class="glx-button glx-button--ghost" @click="randomizeColorTheme">随机海色</button>
            </div>
            <div class="color-theme-grid">
              <button
                v-for="theme in WATER_WORLD_COLOR_THEME_OPTIONS"
                :key="theme.id"
                type="button"
                class="color-theme-card"
                :class="{ 'is-active': colorThemeId === theme.id }"
                @click="colorThemeId = theme.id"
              >
                <div class="color-theme-swatches">
                  <span
                    v-for="swatch in theme.swatches"
                    :key="`${theme.id}-${swatch}`"
                    class="color-theme-dot"
                    :style="{ backgroundColor: swatch }"
                  ></span>
                </div>
                <strong>{{ theme.label }}</strong>
              </button>
            </div>
          </article>
        </template>

        <article v-else-if="currentTab === 'time'" class="glx-section-card glx-section-card--stack">
          <ClockTextSettingsSection
            title="时间显示"
            description="时间层字段继续沿用时钟配置合同，位置、字号、颜色和对齐与 uniapp 同源。"
            :section="timeSection"
            :preset-colors="presetColors"
            :show-font-size="true"
            :show-seconds-control="true"
            :show-seconds="clockConfig.showSeconds"
            :min-font-size="1"
            :max-font-size="3"
            @toggle="toggleTimeShow"
            @toggle-seconds="toggleShowSeconds"
            @adjust="handleTimeAdjust"
            @set-align="handleTimeAlign"
            @update-color="handleTimeColor"
          />
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <GameModeFontSelector
            title="字体样式"
            description="水世界时钟覆盖和站内其它时钟页保持同一套字模与小时制切换。"
            :font-options="fontOptions"
            :selected-font="clockConfig.font"
            :show-seconds="clockConfig.showSeconds"
            :hour-format="clockConfig.hourFormat"
            :show-hour-format="true"
            @select-font="clockConfig.font = $event"
            @set-show-seconds="handleShowSecondsChange"
            @set-hour-format="setHourFormat"
          />
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import ClockTextSettingsSection from "@/components/device/clock/ClockTextSettingsSection.vue";
import DeviceSendingOverlay from "@/components/device/DeviceSendingOverlay.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import DevicePixelBoard from "@/components/device/modes/DevicePixelBoard.vue";
import GameModeFontSelector from "@/components/device/modes/GameModeFontSelector.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import { useFeedback } from "@/composables/useFeedback.js";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { buildDeviceClockPayload, getDeviceClockFontOptions } from "@/utils/device-clock-core.js";
import {
  drawClockTextToPixels,
  getClockTextHeight,
  getClockTextWidth,
  getCurrentTimeText,
} from "@/utils/clockCanvas.js";
import {
  buildWaterWorldSendPlan,
  createDefaultWaterWorldClockConfig,
  createDefaultWaterWorldConfig,
  normalizeWaterWorldClockConfig,
  normalizeWaterWorldConfig,
  WATER_WORLD_CLOCK_CONFIG_KEY,
  WATER_WORLD_CONFIG_KEY,
  WATER_WORLD_OPTIONS,
  WATER_WORLD_PRESET_COLORS,
} from "@/utils/device-mode-water-world.js";
import { readStorageJson, writeStorageJson } from "@/utils/device-mode-core.js";
import {
  buildWaterWorldColorThemePayload,
  createWaterWorldPreviewState,
  DEFAULT_WATER_WORLD_COLOR_THEME_ID,
  renderWaterWorldPreviewState,
  stepWaterWorldPreviewState,
  WATER_WORLD_COLOR_THEME_OPTIONS,
} from "@/utils/waterWorldPreview.js";

const WATER_WORLD_THEME_KEY = "water_world_preview_theme_id";

const tabItems = Object.freeze([
  { value: "scene", label: "场景" },
  { value: "time", label: "时间" },
  { value: "font", label: "字体" },
]);

const presetColors = WATER_WORLD_PRESET_COLORS.map((item) => ({
  name: item.label,
  hex: item.value,
}));

const fontOptions = getDeviceClockFontOptions();
const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();

const currentTab = ref("scene");
const config = reactive(loadWaterConfig());
const clockConfig = reactive(loadWaterClockConfig());
const colorThemeId = ref(loadColorThemeId());
const previewState = ref(createWaterWorldPreviewState(config, colorThemeId.value));
const currentPreviewPixels = ref(new Map());
const isSending = ref(false);
const sendingPixels = ref(new Map());
let previewTimerId = null;

const timeSection = computed(() => {
  return {
    show: clockConfig.time.show,
    fontSize: clockConfig.time.fontSize,
    x: clockConfig.time.x,
    y: clockConfig.time.y,
    color: clockConfig.time.color,
    align: clockConfig.time.align,
  };
});

const selectedPresetLabel = computed(() => {
  const matched = WATER_WORLD_OPTIONS.find((item) => item.preset === config.preset);
  return matched === undefined ? "--" : matched.label;
});

const colorThemeLabel = computed(() => {
  const matched = WATER_WORLD_COLOR_THEME_OPTIONS.find(
    (item) => item.id === colorThemeId.value,
  );
  return matched === undefined ? "--" : matched.label;
});

const selectedFontLabel = computed(() => {
  const matched = fontOptions.find((item) => item.id === clockConfig.font);
  return matched === undefined ? "--" : matched.name;
});

watch(
  config,
  () => {
    persistState();
    rebuildPreview();
  },
  { deep: true },
);

watch(
  clockConfig,
  () => {
    persistState();
    rebuildPreview();
  },
  { deep: true },
);

watch(colorThemeId, () => {
  persistState();
  rebuildPreview();
});

onMounted(() => {
  deviceStore.init();
  rebuildPreview();
  startPreviewLoop();
});

onBeforeUnmount(() => {
  stopPreviewLoop();
});

function loadWaterConfig() {
  return normalizeWaterWorldConfig(readStorageJson(WATER_WORLD_CONFIG_KEY) || createDefaultWaterWorldConfig());
}

function loadWaterClockConfig() {
  return normalizeWaterWorldClockConfig(readStorageJson(WATER_WORLD_CLOCK_CONFIG_KEY) || createDefaultWaterWorldClockConfig());
}

function loadColorThemeId() {
  const saved = localStorage.getItem(WATER_WORLD_THEME_KEY);
  if (WATER_WORLD_COLOR_THEME_OPTIONS.some((item) => item.id === saved)) {
    return saved;
  }
  return DEFAULT_WATER_WORLD_COLOR_THEME_ID;
}

function persistState() {
  writeStorageJson(WATER_WORLD_CONFIG_KEY, config);
  writeStorageJson(WATER_WORLD_CLOCK_CONFIG_KEY, clockConfig);
  localStorage.setItem(WATER_WORLD_THEME_KEY, colorThemeId.value);
}

function rebuildPreview() {
  previewState.value = createWaterWorldPreviewState(config, colorThemeId.value);
  currentPreviewPixels.value = buildPreviewPixels();
}

function startPreviewLoop() {
  stopPreviewLoop();
  const playNextFrame = () => {
    if (!previewState.value) {
      return;
    }
    stepWaterWorldPreviewState(previewState.value);
    currentPreviewPixels.value = buildPreviewPixels();
    previewTimerId = window.setTimeout(
      playNextFrame,
      Math.max(40, Number(previewState.value.frameDelay) || 120),
    );
  };
  previewTimerId = window.setTimeout(playNextFrame, 120);
}

function stopPreviewLoop() {
  if (previewTimerId !== null) {
    window.clearTimeout(previewTimerId);
    previewTimerId = null;
  }
}

function buildEffectiveClockConfig() {
  return {
    ...clockConfig,
    time: {
      ...clockConfig.time,
      show: true,
    },
  };
}

function buildPreviewPixels() {
  if (!previewState.value) {
    return new Map();
  }
  const pixels = new Map(renderWaterWorldPreviewState(previewState.value));
  const effectiveClockConfig = buildEffectiveClockConfig();
  const timeText = getCurrentTimeText(
    effectiveClockConfig.showSeconds,
    effectiveClockConfig.hourFormat,
  );
  const placement = resolveWaterWorldTimePlacement(
    timeText,
    effectiveClockConfig,
  );

  drawClockTextToPixels(
    timeText,
    placement.x,
    placement.y,
    effectiveClockConfig.time.color,
    pixels,
    effectiveClockConfig.font,
    placement.fontSize,
    "left",
  );
  return pixels;
}

function resolveWaterWorldTimePlacement(timeText, nextClockConfig) {
  const fontSize = Math.max(
    1,
    Math.min(3, Number(nextClockConfig.time.fontSize) || 1),
  );
  const width = getClockTextWidth(timeText, nextClockConfig.font, fontSize);
  const height = getClockTextHeight(nextClockConfig.font, fontSize);
  const maxX = Math.max(0, 64 - width);
  const maxY = Math.max(0, 64 - height);
  let x = Number(nextClockConfig.time.x);
  let y = Number(nextClockConfig.time.y);

  if (nextClockConfig.time.align === "center") {
    x -= Math.floor(width / 2);
  } else if (nextClockConfig.time.align === "right") {
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

function randomizeColorTheme() {
  const options = WATER_WORLD_COLOR_THEME_OPTIONS.filter(
    (item) => item.id !== colorThemeId.value,
  );
  const pool =
    options.length > 0 ? options : WATER_WORLD_COLOR_THEME_OPTIONS;
  const nextTheme = pool[Math.floor(Math.random() * pool.length)];
  colorThemeId.value = nextTheme.id;
}

function toggleTimeShow() {
  clockConfig.time.show = !clockConfig.time.show;
}

function toggleShowSeconds() {
  clockConfig.showSeconds = !clockConfig.showSeconds;
}

function handleShowSecondsChange(value) {
  clockConfig.showSeconds = value === true;
}

function setHourFormat(value) {
  if (value === 12 || value === 24) {
    clockConfig.hourFormat = value;
  }
}

function handleTimeAdjust(fieldKey, delta, min, max) {
  const nextValue = Math.max(min, Math.min(max, clockConfig.time[fieldKey] + delta));
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

function handleTimeColor(color) {
  clockConfig.time.color = color;
}

async function handleSend() {
  if (deviceStore.connected !== true) {
    feedback.warning("设备未连接", "请先返回设备控制页建立连接。");
    return;
  }

  isSending.value = true;
  sendingPixels.value = new Map(currentPreviewPixels.value);
  feedback.showBlocking("发送水世界", "正在把当前水世界配置发送到设备。");
  try {
    const sendPlan = buildWaterWorldSendPlan(config.preset);
    sendPlan.command.colorTheme = buildWaterWorldColorThemePayload(
      colorThemeId.value,
    );
    await deviceStore.setAmbientEffect(
      sendPlan.command,
      {
        clockConfig: buildDeviceClockPayload(
          buildEffectiveClockConfig(),
          new Date(),
        ),
      },
    );
    persistState();
    feedback.success("发送成功", "水世界已发送到设备。");
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("发送失败", error.message);
    } else {
      feedback.error("发送失败", "水世界发送失败。");
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

.water-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.water-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.water-preview-card {
  gap: 18px;
}

.water-preview-card__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.water-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.water-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.water-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.water-send-button {
  min-width: 196px;
  min-height: 50px;
}

.water-preview-stage {
  padding: 20px;
  min-height: 420px;
  display: flex;
  align-items: center;
}

.water-preview-board {
  position: relative;
  width: min(100%, 620px);
  margin: 0 auto;
}

.water-preview-board :deep(.device-pixel-board) {
  box-shadow: none;
}

.water-preview-sending {
  width: 100%;
  height: 100%;
}

.water-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.water-summary-card {
  display: grid;
  gap: 6px;
  min-height: 112px;
  padding: 16px;
  border: 2px solid #000000;
  background: #ffffff;
}

.water-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.water-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.water-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.water-config-stack {
  min-width: 0;
  display: grid;
  gap: 18px;
}

.game-inline-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
}

.color-theme-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.color-theme-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 108px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
}

.color-theme-card.is-active {
  background: #ffd23f;
}

.color-theme-swatches {
  display: flex;
  gap: 8px;
}

.color-theme-dot {
  width: 18px;
  height: 18px;
  border: 2px solid #000000;
}

@media (max-width: 1080px) {
  .water-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .water-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .color-theme-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
