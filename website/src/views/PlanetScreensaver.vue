<template>
  <div class="glx-page-shell game-mode-page">
    <section class="game-mode-layout">
      <article class="glx-section-card glx-section-card--stack game-preview-card">
        <div class="game-preview-card__head">
          <div>
            <h1 class="game-page-title">星球屏保</h1>
            <p class="game-page-meta">
              这里复刻星球屏保页的本地预览、位置/大小/方向/转速控制，以及时间字体与发送链。页面刷新后会恢复上次的星球与时间参数。
            </p>
          </div>
          <span class="glx-chip" :class="deviceStore.connected ? 'glx-chip--green' : 'glx-chip--yellow'">
            {{ deviceStore.connected ? "已连接" : "未连接" }}
          </span>
        </div>

        <div class="game-preview-stage">
          <DevicePixelBoard :pixels="currentPixels" :grid-visible="true" />
        </div>

        <div class="game-preview-actions">
          <button type="button" class="glx-button glx-button--primary" @click="handleSend">发送到设备</button>
          <button type="button" class="glx-button glx-button--ghost" @click="randomPlanet">随机星球</button>
          <button type="button" class="glx-button glx-button--ghost" @click="randomColor">随机颜色</button>
        </div>
      </article>

      <div class="game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">分组</h2>
            <span class="glx-section-meta">行星 / 时间 / 字体</span>
          </div>
          <DeviceModeTabs v-model="activeTab" :items="tabItems" />
        </article>

        <article v-if="activeTab === 'planet'" class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">星球类型</h2>
            <span class="glx-section-meta">{{ PLANET_SCREEN_PRESETS.length }} 个预设</span>
          </div>
          <div class="planet-grid">
            <button
              v-for="preset in PLANET_SCREEN_PRESETS"
              :key="preset.id"
              type="button"
              class="planet-grid__item"
              :class="{ 'is-active': config.preset === preset.id }"
              @click="config.preset = preset.id"
            >
              <strong>{{ preset.label }}</strong>
              <span>{{ preset.id }}</span>
            </button>
          </div>

          <div class="game-row">
            <span class="game-row__label">水平位置</span>
            <DeviceModeStepper v-model="config.planetX" :min="0" :max="63" />
          </div>

          <div class="game-row">
            <span class="game-row__label">垂直位置</span>
            <DeviceModeStepper v-model="config.planetY" :min="0" :max="63" />
          </div>

          <div class="game-row">
            <span class="game-row__label">转速</span>
            <DeviceModeStepper
              v-model="config.speed"
              :min="PLANET_PREVIEW_MIN_SPEED"
              :max="PLANET_PREVIEW_MAX_SPEED"
            />
          </div>

          <div class="game-block">
            <span class="game-row__label">大小</span>
            <DeviceModeTabs v-model="config.size" :items="PLANET_SIZE_OPTIONS.map((item) => ({ value: item.id, label: item.label }))" />
          </div>

          <div class="game-block">
            <span class="game-row__label">方向</span>
            <DeviceModeTabs v-model="config.direction" :items="PLANET_DIRECTION_OPTIONS.map((item) => ({ value: item.id, label: item.label }))" />
          </div>
        </article>

        <article v-else-if="activeTab === 'time'" class="glx-section-card glx-section-card--stack">
          <ClockTextSettingsSection
            title="时间显示"
            description="时间层单独控制显示、字号、位置、对齐与颜色。"
            :section="clockConfig.time"
            :preset-colors="PLANET_TIME_COLOR_OPTIONS.map((item) => ({ name: item.label, hex: item.value }))"
            :show-font-size="true"
            :show-seconds-control="true"
            :show-seconds="clockConfig.showSeconds"
            @toggle="clockConfig.time.show = !clockConfig.time.show"
            @toggle-seconds="clockConfig.showSeconds = !clockConfig.showSeconds"
            @adjust="adjustTime"
            @set-align="clockConfig.time.align = $event"
            @update-color="clockConfig.time.color = $event"
          />
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <ClockFontSelector
            :font-options="fontOptions"
            :selected-font="clockConfig.font"
            :show-seconds="clockConfig.showSeconds"
            :hour-format="24"
            @select-font="clockConfig.font = $event"
            @set-show-seconds="clockConfig.showSeconds = $event"
            @set-hour-format="() => {}"
          />
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useFeedback } from "@/composables/useFeedback.js";
import { usePixelPreviewPlayer } from "@/composables/usePixelPreviewPlayer.js";
import ClockFontSelector from "@/components/device/clock/ClockFontSelector.vue";
import ClockTextSettingsSection from "@/components/device/clock/ClockTextSettingsSection.vue";
import DeviceModeStepper from "@/components/device/modes/DeviceModeStepper.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import DevicePixelBoard from "@/components/device/modes/DevicePixelBoard.vue";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { getDeviceClockFontOptions } from "@/utils/device-clock-core.js";
import {
  PLANET_DIRECTION_OPTIONS,
  PLANET_PAGE_STORAGE_KEY,
  PLANET_PREVIEW_MAX_SPEED,
  PLANET_PREVIEW_MIN_SPEED,
  PLANET_SCREEN_PRESETS,
  PLANET_SIZE_OPTIONS,
  PLANET_TIME_COLOR_OPTIONS,
  buildPlanetPreviewPixels,
  buildPlanetScreensaverPreviewSequence,
  createDefaultPlanetClockConfig,
  createDefaultPlanetPreviewConfig,
  createRandomPlanetColorSeed,
  createRandomPlanetPreviewSeed,
  normalizePlanetPageState,
} from "@/utils/device-mode-planet.js";
import { hexToRgb, readStorageJson, writeStorageJson } from "@/utils/device-mode-core.js";

const savedState = normalizePlanetPageState(readStorageJson(PLANET_PAGE_STORAGE_KEY));
const config = reactive({ ...createDefaultPlanetPreviewConfig(), ...savedState.config });
const clockConfig = reactive({
  ...createDefaultPlanetClockConfig(),
  ...savedState.clockConfig,
  time: {
    ...createDefaultPlanetClockConfig().time,
    ...savedState.clockConfig.time,
  },
});
const activeTab = ref("planet");
const tabItems = Object.freeze([
  { value: "planet", label: "星球" },
  { value: "time", label: "时间" },
  { value: "font", label: "字体" },
]);
const fontOptions = getDeviceClockFontOptions();

const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();
const { currentPixels, playSequence } = usePixelPreviewPlayer();

const selectedPresetLabel = computed(() => {
  const matched = PLANET_SCREEN_PRESETS.find((item) => item.id === config.preset);
  return matched === undefined ? "--" : matched.label;
});

const selectedSizeLabel = computed(() => {
  const matched = PLANET_SIZE_OPTIONS.find((item) => item.id === config.size);
  return matched === undefined ? "--" : matched.label;
});

function refreshPreview() {
  const baseSequence = buildPlanetScreensaverPreviewSequence(config);
  playSequence({
    maps: baseSequence.maps.map((_, frameIndex) => {
      return buildPlanetPreviewPixels(config, clockConfig, frameIndex);
    }),
    delays: baseSequence.delays,
  });
}

function saveState() {
  writeStorageJson(PLANET_PAGE_STORAGE_KEY, {
    config: { ...config },
    clockConfig: {
      ...clockConfig,
      time: { ...clockConfig.time },
    },
  });
}

function adjustTime(fieldKey, delta, min, max) {
  const nextValue = Math.max(min, Math.min(max, clockConfig.time[fieldKey] + delta));
  clockConfig.time[fieldKey] = nextValue;
}

function randomPlanet() {
  config.seed = createRandomPlanetPreviewSeed();
}

function randomColor() {
  config.colorSeed = createRandomPlanetColorSeed();
}

async function handleSend() {
  if (!deviceStore.connected) {
    feedback.warning("设备未连接", "请先返回设备控制页建立连接。");
    return;
  }

  feedback.showBlocking("发送星球", `正在把 ${selectedPresetLabel.value} 发送到设备。`);
  try {
    await deviceStore.setPlanetScreensaver({
      preset: config.preset,
      size: config.size,
      direction: config.direction,
      speed: config.speed,
      seed: config.seed,
      colorSeed: config.colorSeed,
      planetX: config.planetX,
      planetY: config.planetY,
      font: clockConfig.font,
      showSeconds: clockConfig.showSeconds,
      time: {
        show: clockConfig.time.show,
        fontSize: clockConfig.time.fontSize,
        x: clockConfig.time.x,
        y: clockConfig.time.y,
        color: hexToRgb(clockConfig.time.color),
      },
      autoRotate: {
        enabled: false,
        randomPlanet: true,
        randomColor: true,
        interval: 60,
      },
    });
    feedback.success("发送成功", `${selectedPresetLabel.value} 已经发送到设备。`);
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("发送失败", error.message);
    } else {
      feedback.error("发送失败", "星球屏保发送失败。");
    }
  } finally {
    feedback.hideBlocking();
  }
}

watch(
  () => [
    config.preset,
    config.size,
    config.seed,
    config.colorSeed,
    config.planetX,
    config.planetY,
    config.direction,
    config.speed,
    clockConfig.font,
    clockConfig.showSeconds,
    clockConfig.time.show,
    clockConfig.time.fontSize,
    clockConfig.time.x,
    clockConfig.time.y,
    clockConfig.time.color,
    clockConfig.time.align,
  ],
  () => {
    saveState();
    refreshPreview();
  },
);

onMounted(() => {
  deviceStore.init();
  refreshPreview();
});
</script>

<style scoped>
.game-mode-page {
  gap: 24px;
}

.game-mode-layout {
  display: grid;
  grid-template-columns: minmax(320px, 0.92fr) minmax(0, 1.08fr);
  gap: 24px;
}

.game-preview-card {
  position: sticky;
  top: 88px;
  align-self: start;
}

.game-preview-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.game-page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
}

.game-page-meta {
  margin: 8px 0 0;
  color: var(--glx-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.game-preview-stage {
  position: relative;
  padding: 18px;
  border: 2px solid #000000;
  background: #000000;
}

.game-preview-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 10px;
}

.game-mode-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.game-block {
  display: grid;
  gap: 10px;
}

.planet-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.planet-grid__item {
  min-height: 88px;
  padding: 14px;
  display: grid;
  gap: 6px;
  border: 2px solid #000000;
  background: #ffffff;
  text-align: left;
  cursor: pointer;
}

.planet-grid__item.is-active {
  background: #ffd23f;
}

.planet-grid__item span {
  color: var(--glx-text-muted);
  font-size: 12px;
}

@media (max-width: 1080px) {
  .game-mode-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .game-preview-card {
    position: static;
  }
}

@media (max-width: 720px) {
  .planet-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .game-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
