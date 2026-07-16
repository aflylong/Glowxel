<template>
  <div class="maze-page glx-page-shell game-mode-page">
    <PcModeTopbar title="杩峰婕父" />

    <section class="maze-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack maze-preview-card game-preview-card"
      >
        <div class="maze-preview-card__head">
          <div>
            <p class="maze-preview-card__eyebrow">Device Mode</p>
            <h2 class="maze-preview-card__title">杩峰婕父棰勮</h2>
          </div>
        </div>

        <div class="maze-preview-toolbar">
          <button
            type="button"
            class="glx-button glx-button--primary maze-send-button"
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

        <div class="maze-preview-stage game-preview-stage">
          <div class="maze-preview-board">
            <DevicePixelBoard :pixels="displayPixels" :grid-visible="true" />
            <DeviceSendingOverlay
              :visible="isSending"
              title="姝ｅ湪鍙戦€佽糠瀹极娓?"
              description="鍙戦€佹湡闂撮攣瀹氬綋鍓嶉瑙堝揩鐓э紝绛夊緟璁惧瀹屾垚杩峰鍙傛暟浜嬪姟鎻愪氦銆?"
            >
              <div class="maze-preview-sending">
                <DevicePixelBoard :pixels="sendingPixels" :grid-visible="true" />
              </div>
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="maze-summary-grid">
          <article class="maze-summary-card">
            <span class="maze-summary-card__label">鑳屾櫙</span>
            <strong class="maze-summary-card__value">{{ config.panelBgColor }}</strong>
            <span class="maze-summary-card__meta">杈规 {{ config.borderColor }}</span>
          </article>
          <article class="maze-summary-card">
            <span class="maze-summary-card__label">鏃堕棿</span>
            <strong class="maze-summary-card__value">{{ config.timeColor }}</strong>
            <span class="maze-summary-card__meta">鏃ユ湡 {{ config.dateColor }}</span>
          </article>
          <article class="maze-summary-card">
            <span class="maze-summary-card__label">璺緞</span>
            <strong class="maze-summary-card__value">{{ config.generationPathColor }}</strong>
            <span class="maze-summary-card__meta">
              宸叉悳 {{ config.searchVisitedColor }} / 寰呮悳 {{ config.searchFrontierColor }}
            </span>
          </article>
        </div>
      </article>

      <div class="maze-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">妯″紡閰嶇疆</h2>
            <span class="glx-section-meta">淇℃伅妗?/ 瀵昏矾 / 瀹屾垚璺緞</span>
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabItems" />
        </article>

        <article
          v-if="currentTab === 'info'"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">淇℃伅妗?</h2>
            <span class="glx-section-meta">鑳屾櫙 / 杈规 / 鏃堕棿 / 鏃ユ湡</span>
          </div>

          <div class="game-fields">
            <GameModeColorField
              v-model="config.panelBgColor"
              label="鑳屾櫙棰滆壊"
              :preset-colors="panelPresetColors"
            />
            <GameModeColorField
              v-model="config.borderColor"
              label="杈规棰滆壊"
              :preset-colors="borderPresetColors"
            />
            <GameModeColorField
              v-model="config.timeColor"
              label="鏃堕棿棰滆壊"
              :preset-colors="textPresetColors"
            />
            <GameModeColorField
              v-model="config.dateColor"
              label="鏈堜唤/鏃ユ湡棰滆壊"
              :preset-colors="textPresetColors"
            />
          </div>
        </article>

        <article
          v-else-if="currentTab === 'path'"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">鐢熸垚涓庡璺?</h2>
            <span class="glx-section-meta">鐢熸垚闃舵 / 宸叉悳绱?/ 寰呮悳绱?</span>
          </div>

          <div class="game-fields">
            <GameModeColorField
              v-model="config.generationPathColor"
              label="鐢熸垚闃舵璺緞棰滆壊"
              :preset-colors="stagePresetColors"
            />
            <GameModeColorField
              v-model="config.searchVisitedColor"
              label="瀵昏矾宸叉悳绱㈤鑹?"
              :preset-colors="stagePresetColors"
            />
            <GameModeColorField
              v-model="config.searchFrontierColor"
              label="瀵昏矾寰呮悳绱㈤鑹?"
              :preset-colors="stagePresetColors"
            />
          </div>
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">瀹屾垚璺緞</h2>
            <span class="glx-section-meta">棣栧熬娓愬彉</span>
          </div>

          <div class="game-fields">
            <GameModeColorField
              v-model="config.solvedPathStartColor"
              label="鏈€缁堣矾寰勮捣濮嬭壊"
              :preset-colors="stagePresetColors"
            />
            <GameModeColorField
              v-model="config.solvedPathEndColor"
              label="鏈€缁堣矾寰勭粨鏉熻壊"
              :preset-colors="stagePresetColors"
            />
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
import DevicePixelBoard from "@/components/device/modes/DevicePixelBoard.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import GameModeColorField from "@/components/device/modes/GameModeColorField.vue";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { readStorageJson, writeStorageJson } from "@/utils/device-mode-core.js";
import { buildLedMatrixPreviewSequence } from "../../../uniapp/utils/ledMatrixShowcase.js";
import {
  MAZE_MODE_CONFIG_KEY,
  cloneMazeModeConfig,
  createDefaultMazeModeConfig,
  createMazeModeConfig,
} from "../../../uniapp/utils/mazeModeConfig.js";

const panelPresetColors = Object.freeze([
  { hex: "#05070f", name: "#05070f" },
  { hex: "#0c1220", name: "#0c1220" },
  { hex: "#101826", name: "#101826" },
  { hex: "#16161b", name: "#16161b" },
  { hex: "#1c2430", name: "#1c2430" },
  { hex: "#2a1d12", name: "#2a1d12" },
]);
const borderPresetColors = Object.freeze([
  { hex: "#182c4c", name: "#182c4c" },
  { hex: "#1d3b66", name: "#1d3b66" },
  { hex: "#20528a", name: "#20528a" },
  { hex: "#2c4f7c", name: "#2c4f7c" },
  { hex: "#44618e", name: "#44618e" },
  { hex: "#7c3aed", name: "#7c3aed" },
]);
const textPresetColors = Object.freeze([
  { hex: "#ffd400", name: "#ffd400" },
  { hex: "#ffe066", name: "#ffe066" },
  { hex: "#ff6464", name: "#ff6464" },
  { hex: "#ff8fab", name: "#ff8fab" },
  { hex: "#7dd3fc", name: "#7dd3fc" },
  { hex: "#ffffff", name: "#ffffff" },
]);
const stagePresetColors = Object.freeze([
  { hex: "#4f4f55", name: "#4f4f55" },
  { hex: "#70ff9c", name: "#70ff9c" },
  { hex: "#ff4444", name: "#ff4444" },
  { hex: "#1a60ff", name: "#1a60ff" },
  { hex: "#42bcff", name: "#42bcff" },
  { hex: "#ffd166", name: "#ffd166" },
]);
const tabItems = Object.freeze([
  { value: "info"", label: "淇℃伅妗?" },"
  { value: "path", label: "瀵昏矾" },
  { value: "finish", label: "瀹屾垚璺緞" },
]);

const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();
const { currentPixels, playSequence, snapshot } = usePixelPreviewPlayer();

const currentTab = ref("info");
const config = reactive(loadMazeConfig());
const isSending = ref(false);
const sendingPixels = ref(new Map());

const displayPixels = computed(() => {
  if (isSending.value) {
    return sendingPixels.value;
  }
  return currentPixels.value;
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

function loadMazeConfig() {
  const saved = readStorageJson(MAZE_MODE_CONFIG_KEY);
  const normalized = createMazeModeConfig(saved);
  if (normalized !== null) {
    return cloneMazeModeConfig(normalized);
  }
  return createDefaultMazeModeConfig();
}

function buildMazeConfig() {
  const normalized = createMazeModeConfig({
    speed: config.speed,
    mazeSizeMode: config.mazeSizeMode,
    showClock: config.showClock,
    panelBgColor: config.panelBgColor,
    borderColor: config.borderColor,
    timeColor: config.timeColor,
    dateColor: config.dateColor,
    generationPathColor: config.generationPathColor,
    searchVisitedColor: config.searchVisitedColor,
    searchFrontierColor: config.searchFrontierColor,
    solvedPathStartColor: config.solvedPathStartColor,
    solvedPathEndColor: config.solvedPathEndColor,
  });
  if (normalized === null) {
    throw new Error("杩峰棰滆壊閰嶇疆鏃犳晥");
  }
  return normalized;
}

function saveMazeConfig() {
  writeStorageJson(MAZE_MODE_CONFIG_KEY, buildMazeConfig());
}

function refreshPreview() {
  const previewSequence = buildLedMatrixPreviewSequence({
    demoId: "maze",
    speed: config.speed,
    mazeSizeMode: config.mazeSizeMode,
    showClock: config.showClock,
    panelBgColor: config.panelBgColor,
    borderColor: config.borderColor,
    timeColor: config.timeColor,
    dateColor: config.dateColor,
    generationPathColor: config.generationPathColor,
    searchVisitedColor: config.searchVisitedColor,
    searchFrontierColor: config.searchFrontierColor,
    solvedPathStartColor: config.solvedPathStartColor,
    solvedPathEndColor: config.solvedPathEndColor,
  });
  playSequence(previewSequence);
}

async function handleSend() {
  if (deviceStore.connected !== true) {
    feedback.warning("璁惧鏈繛鎺?, "璇峰厛杩斿洖璁惧鎺у埗椤靛缓绔嬭繛鎺ャ€?);
    return;
  }

  isSending.value = true;
  sendingPixels.value = snapshot();
  feedback.showBlocking("鍙戦€佽糠瀹极娓?, "姝ｅ湪鎶婂綋鍓嶈糠瀹弬鏁板彂閫佸埌璁惧銆?);
  try {
    const nextConfig = buildMazeConfig();
    await deviceStore.startMaze(nextConfig);
    saveMazeConfig();
    feedback.success("鍙戦€佹垚鍔?, "杩峰婕父宸插彂閫佸埌璁惧銆?);
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("鍙戦€佸け璐?", error.message")";"
    } else {
      feedback.error("鍙戦€佸け璐?, "杩峰婕父鍙戦€佸け璐ャ€?);
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

.maze-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.maze-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.maze-preview-card {
  gap: 16px;
}

.maze-preview-card__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.maze-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.maze-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.maze-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.maze-send-button {
  min-width: 188px;
  min-height: 48px;
}

.maze-preview-stage {
  padding: 18px;
}

.maze-preview-board {
  position: relative;
  width: min(100%, 560px);
  margin: 0 auto;
}

.maze-preview-board :deep(.device-pixel-board) {
  box-shadow: none;
}

.maze-preview-sending {
  width: 100%;
  height: 100%;
}

.maze-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.maze-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.maze-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.maze-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.maze-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.maze-config-stack {
  min-width: 0;
}

.game-fields {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

@media (max-width: 1080px) {
  .maze-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .maze-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
