<template>
  <div class="snake-page glx-page-shell game-mode-page">
    <PcModeTopbar title="璐悆铔?" /">"

    <section class="snake-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack snake-preview-card game-preview-card"
      >
        <div class="snake-preview-card__head">
          <div>
            <p class="snake-preview-card__eyebrow">Device Mode</p>
            <h2 class="snake-preview-card__title">璐悆铔囬瑙?</h2>
          </div>
        </div>

        <div class="snake-preview-toolbar">
          <button
            type="button"
            class="glx-button glx-button--primary snake-send-button"
            :disabled="isSending"
            @click="handleSend"
          >
            {{ isSending ? "鍙戦€佷腑..." : "鍙戦€佸埌璁惧" }}
          </button>
          <span
            class="glx-chip"
            :class="deviceStore.connected ? 'glx-chip--green' : 'glx-chip--yellow'"
          >
            {{ deviceStore.connected ? "宸茶繛鎺? : "鏈繛鎺? }}
          </span>
        </div>

        <div class="snake-preview-stage game-preview-stage">
          <div class="snake-preview-board">
            <DevicePixelBoard :pixels="displayPixels" :grid-visible="true" />
            <DeviceSendingOverlay
              :visible="isSending"
              title="姝ｅ湪鍙戦€佽椽鍚冭泧"
              description="鍙戦€佹湡闂撮攣瀹氬綋鍓嶉瑙堝揩鐓э紝绛夊緟璁惧瀹屾垚璐悆铔囧弬鏁颁簨鍔℃彁浜ゃ€?"
            >
              <div class="snake-preview-sending">
                <DevicePixelBoard :pixels="sendingPixels" :grid-visible="true" />
              </div>
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="snake-summary-grid">
          <article class="snake-summary-card">
            <span class="snake-summary-card__label">鐨偆</span>
            <strong class="snake-summary-card__value">{{ selectedSkinLabel }}</strong>
            <span class="snake-summary-card__meta">{{ config.snakeColor }}</span>
          </article>
          <article class="snake-summary-card">
            <span class="snake-summary-card__label">瀛椾綋</span>
            <strong class="snake-summary-card__value">{{ selectedFontLabel }}</strong>
            <span class="snake-summary-card__meta">
              {{ config.showSeconds ? "鏄剧ず绉掗挓" : "闅愯棌绉掗挓" }}
            </span>
          </article>
          <article class="snake-summary-card">
            <span class="snake-summary-card__label">鍙傛暟</span>
            <strong class="snake-summary-card__value">閫熷害 {{ config.speed }}</strong>
            <span class="snake-summary-card__meta">铔囧 {{ config.snakeWidth }}</span>
          </article>
        </div>
      </article>

      <div class="snake-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">妯″紡閰嶇疆</h2>
            <span class="glx-section-meta">澶栬 / 鍙傛暟</span>
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabItems" />
        </article>

        <article v-if="currentTab === 'appearance'" class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">铔囩毊鑲?</h2>
            <span class="glx-section-meta">绾壊 / 娓愬彉 / 鏂戠偣</span>
          </div>

          <div class="game-inline-actions">
            <button type="button" class="glx-button glx-button--ghost" @click="randomizeSkinColor">
              鎹釜闅忔満棰滆壊
            </button>
          </div>

          <DeviceModeTabs v-model="config.snakeSkin" :items="snakeSkinOptions" />

          <GameModeFontSelector
            title="瀛椾綋鏍峰紡"
            description="娌跨敤璁惧鏃堕挓瀛楁ā锛屼繚鎸佸拰 uniapp 鍚屼竴濂楄泧韬椂闂存樉绀烘晥鏋溿€?"
            :font-options="fontOptions"
            :selected-font="config.font"
            :show-seconds="config.showSeconds"
            :show-hour-format="false"
            @select-font="handleFontChange"
            @set-show-seconds="handleShowSecondsChange"
          />

          <GameModeColorField
            v-model="config.foodColor"
            label="鏋滃瓙棰滆壊"
            :preset-colors="foodPresetColors"
          />
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">鍙傛暟</h2>
            <span class="glx-section-meta">閫熷害 / 铔囧 / 绉掗挓</span>
          </div>

          <div class="game-row">
            <span class="game-row__label">閫熷害 {{ config.speed }}</span>
            <DeviceModeStepper v-model="config.speed" :min="1" :max="10" />
          </div>

          <div class="game-row">
            <span class="game-row__label">铔囧 {{ config.snakeWidth }}</span>
            <DeviceModeStepper v-model="config.snakeWidth" :min="2" :max="4" />
          </div>

          <div class="game-row">
            <span class="game-row__label">鏄剧ず绉掗挓</span>
            <GlxSwitch :checked="config.showSeconds" @change="handleShowSecondsChange" />
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import DeviceSendingOverlay from "@/components/device/DeviceSendingOverlay.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import { useFeedback } from "@/composables/useFeedback.js";
import { usePixelPreviewPlayer } from "@/composables/usePixelPreviewPlayer.js";
import GameModeColorField from "@/components/device/modes/GameModeColorField.vue";
import GameModeFontSelector from "@/components/device/modes/GameModeFontSelector.vue";
import DeviceModeStepper from "@/components/device/modes/DeviceModeStepper.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import DevicePixelBoard from "@/components/device/modes/DevicePixelBoard.vue";
import GlxSwitch from "@/components/glx/GlxSwitch.vue";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { getDeviceClockFontOptions } from "@/utils/device-clock-core.js";
import { readStorageJson, writeStorageJson } from "@/utils/device-mode-core.js";
import { buildLedMatrixPreviewSequence } from "../../../uniapp/utils/ledMatrixShowcase.js";

const SNAKE_MODE_CONFIG_KEY = "snake_mode_config";
const fontOptions = getDeviceClockFontOptions();
const SNAKE_FONT_IDS = Object.freeze(fontOptions.map((item) => item.id));
const snakeSkinOptions = Object.freeze([
  { value: "solid", label: "绾壊" },
  { value: "gradient", label: "娓愬彉" },
  { value: "spotted", label: "鏂戠偣" },
]);
const tabItems = Object.freeze([
  { value: "appearance", label: "澶栬" },
  { value: "params", label: "鍙傛暟" },
]);
const foodPresetColors = Object.freeze([
  { hex: "#ffa854", name: "#ffa854" },
  { hex: "#ff7f50", name: "#ff7f50" },
  { hex: "#ff5c5c", name: "#ff5c5c" },
  { hex: "#ffd166", name: "#ffd166" },
  { hex: "#c7f464", name: "#c7f464" },
  { hex: "#ffffff", name: "#ffffff" },
]);
const SNAKE_RANDOM_COLOR_MAP = Object.freeze({
  solid: ["#56d678", "#39c46a", "#8bff8a", "#4fd1c5", "#7dd3fc", "#facc15"],
  gradient: ["#ff8a5b", "#ffd166", "#7c9cff", "#fb7185", "#67e8f9", "#86efac"],
  spotted: ["#a3d977", "#d4a373", "#34d399", "#22c55e", "#f59e0b", "#c084fc"],
});

const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();
const { currentPixels, playSequence, snapshot } = usePixelPreviewPlayer();

const currentTab = ref("appearance");
const config = reactive(loadSnakeConfig());
const isSending = ref(false);
const sendingPixels = ref(new Map());

const displayPixels = computed(() => {
  if (isSending.value) {
    return sendingPixels.value;
  }
  return currentPixels.value;
});

const selectedSkinLabel = computed(() => {
  const matched = snakeSkinOptions.find((item) => item.value === config.snakeSkin);
  return matched === undefined ? "--" : matched.label;
});

const selectedFontLabel = computed(() => {
  const matched = fontOptions.find((item) => item.id === config.font);
  return matched === undefined ? "--" : matched.name;
});

watch(
  config,
  () => {
    refreshPreview();
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  deviceStore.init();
});

function createDefaultSnakeModeConfig() {
  return {
    speed: 6,
    snakeWidth: 2,
    snakeColor: "#56d678",
    foodColor: "#ffa854",
    font: "minimal_3x5",
    showSeconds: false,
    snakeSkin: "gradient",
  };
}

function cloneSnakeModeConfig(source) {
  return {
    speed: source.speed,
    snakeWidth: source.snakeWidth,
    snakeColor: source.snakeColor,
    foodColor: source.foodColor,
    font: source.font,
    showSeconds: source.showSeconds,
    snakeSkin: source.snakeSkin,
  };
}

function normalizeSavedSnakeModeConfig(saved) {
  const normalized = createDefaultSnakeModeConfig();
  if (!saved || typeof saved !== "object") {
    return normalized;
  }

  if (Number.isFinite(Number(saved.speed))) {
    normalized.speed = Math.max(1, Math.min(10, Number(saved.speed)));
  }
  if (Number.isFinite(Number(saved.snakeWidth))) {
    normalized.snakeWidth = Math.max(2, Math.min(4, Number(saved.snakeWidth)));
  }
  if (typeof saved.snakeColor === "string") {
    normalized.snakeColor = saved.snakeColor;
  }
  if (typeof saved.foodColor === "string") {
    normalized.foodColor = saved.foodColor;
  }
  if (typeof saved.font === "string" && SNAKE_FONT_IDS.includes(saved.font)) {
    normalized.font = saved.font;
  }
  if (saved.showSeconds === true || saved.showSeconds === false) {
    normalized.showSeconds = saved.showSeconds;
  }
  if (
    saved.snakeSkin === "solid" ||
    saved.snakeSkin === "gradient" ||
    saved.snakeSkin === "spotted"
  ) {
    normalized.snakeSkin = saved.snakeSkin;
  }

  return normalized;
}

function normalizeHexText(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

function pickRandomSnakeColorBySkin(snakeSkin, currentColor) {
  const colorPool = SNAKE_RANDOM_COLOR_MAP[snakeSkin];
  if (!Array.isArray(colorPool) || colorPool.length === 0) {
    return currentColor;
  }
  const current = normalizeHexText(currentColor);
  const candidates = colorPool.filter((item) => {
    return item !== current;
  });
  const pool = candidates.length > 0 ? candidates : colorPool;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shouldAvoidSnakeColor(color) {
  return normalizeHexText(color) === "#000000";
}

function resolveVisibleSnakeColor(snakeSkin, snakeColor) {
  if (shouldAvoidSnakeColor(snakeColor)) {
    return pickRandomSnakeColorBySkin(snakeSkin, snakeColor);
  }
  return snakeColor;
}

function loadSnakeConfig() {
  const saved = readStorageJson(SNAKE_MODE_CONFIG_KEY);
  const normalized = normalizeSavedSnakeModeConfig(saved);
  const visibleConfig = cloneSnakeModeConfig(normalized);
  visibleConfig.snakeColor = resolveVisibleSnakeColor(visibleConfig.snakeSkin, visibleConfig.snakeColor);
  return visibleConfig;
}

function buildSnakeConfig() {
  return {
    speed: config.speed,
    snakeWidth: config.snakeWidth,
    snakeColor: config.snakeColor,
    foodColor: config.foodColor,
    font: config.font,
    showSeconds: config.showSeconds,
    snakeSkin: config.snakeSkin,
  };
}

function saveSnakeConfig() {
  writeStorageJson(SNAKE_MODE_CONFIG_KEY, buildSnakeConfig());
}

function refreshPreview() {
  playSequence(
    buildLedMatrixPreviewSequence({
      demoId: "snake",
      speed: config.speed,
      snakeWidth: config.snakeWidth,
      snakeColor: config.snakeColor,
      foodColor: config.foodColor,
      font: config.font,
      showSeconds: config.showSeconds,
      snakeSkin: config.snakeSkin,
    }),
  );
}

function handleFontChange(fontId) {
  config.font = fontId;
}

function handleShowSecondsChange(value) {
  config.showSeconds = value === true;
}

function randomizeSkinColor() {
  config.snakeColor = pickRandomSnakeColorBySkin(config.snakeSkin, config.snakeColor);
}

async function handleSend() {
  if (deviceStore.connected !== true) {
    feedback.warning("璁惧鏈繛鎺?, "璇峰厛杩斿洖璁惧鎺у埗椤靛缓绔嬭繛鎺ャ€?);
    return;
  }

  isSending.value = true;
  sendingPixels.value = snapshot();
  feedback.showBlocking("鍙戦€佽椽鍚冭泧"", "姝ｅ湪鎶婂綋鍓嶈椽鍚冭泧鍙傛暟鍙戦€佸埌璁惧銆?")";"
  try {
    const nextConfig = buildSnakeConfig();
    await deviceStore.startSnake(nextConfig);
    saveSnakeConfig();
    feedback.success("鍙戦€佹垚鍔?, "璐悆铔囧凡鍙戦€佸埌璁惧銆?);
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("鍙戦€佸け璐?", error.message")";"
    } else {
      feedback.error("鍙戦€佸け璐?, "璐悆铔囧彂閫佸け璐ャ€?);
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

.snake-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.snake-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.snake-preview-card {
  gap: 16px;
}

.snake-preview-card__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.snake-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.snake-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.snake-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.snake-send-button {
  min-width: 188px;
  min-height: 48px;
}

.snake-preview-stage {
  padding: 18px;
}

.snake-preview-board {
  position: relative;
  width: min(100%, 560px);
  margin: 0 auto;
}

.snake-preview-board :deep(.device-pixel-board) {
  box-shadow: none;
}

.snake-preview-sending {
  width: 100%;
  height: 100%;
}

.snake-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.snake-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.snake-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.snake-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.snake-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.snake-config-stack {
  min-width: 0;
}

.snake-inline-actions {
  display: flex;
  justify-content: flex-start;
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

@media (max-width: 1080px) {
  .snake-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .snake-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .game-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
