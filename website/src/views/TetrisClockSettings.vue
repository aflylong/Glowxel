<template>
  <div class="tetris-clock-page glx-page-shell game-mode-page">
    <PcModeTopbar title="淇勭綏鏂柟鍧楁椂閽?" /">"

    <section class="tetris-clock-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack tetris-clock-preview-card game-preview-card"
      >
        <div class="tetris-clock-preview-card__head">
          <div>
            <p class="tetris-clock-preview-card__eyebrow">Device Mode</p>
            <h2 class="tetris-clock-preview-card__title">淇勭綏鏂柟鍧楁椂閽熼瑙?</h2>
          </div>
        </div>

        <div class="tetris-clock-preview-toolbar">
          <button
            type="button"
            class="glx-button glx-button--primary tetris-clock-send-button"
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

        <div class="tetris-clock-preview-stage game-preview-stage">
          <div class="tetris-clock-preview-board">
            <DevicePixelBoard :pixels="displayPixels" :grid-visible="true" />
            <DeviceSendingOverlay
              :visible="isSending"
              title="姝ｅ湪鍙戦€佷縿缃楁柉鏂瑰潡鏃堕挓"
              description="鍙戦€佹湡闂撮攣瀹氬綋鍓嶉瑙堝揩鐓э紝绛夊緟璁惧瀹屾垚鏂瑰潡鏃堕挓浜嬪姟鎻愪氦銆?"
            >
              <div class="tetris-clock-preview-sending">
                <DevicePixelBoard :pixels="sendingPixels" :grid-visible="true" />
              </div>
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="tetris-clock-summary-grid">
          <article class="tetris-clock-summary-card">
            <span class="tetris-clock-summary-card__label">閫熷害</span>
            <strong class="tetris-clock-summary-card__value">{{ selectedSpeedLabel }}</strong>
            <span class="tetris-clock-summary-card__meta">{{ TETRIS_SPEED_OPTIONS[config.speed] }} ms</span>
          </article>
          <article class="tetris-clock-summary-card">
            <span class="tetris-clock-summary-card__label">鍒跺紡</span>
            <strong class="tetris-clock-summary-card__value">{{ selectedHourFormatLabel }}</strong>
            <span class="tetris-clock-summary-card__meta">鍙戦€佸瓧娈典繚鎸佸綋鍓嶆椂閽熻涔?</span>
          </article>
          <article class="tetris-clock-summary-card">
            <span class="tetris-clock-summary-card__label">棰勮</span>
            <strong class="tetris-clock-summary-card__value">鍍忕礌甯у悓姝?</strong>
            <span class="tetris-clock-summary-card__meta">缃戠珯涓庤澶囦娇鐢ㄥ悓缁勯厤缃?</span>
          </article>
        </div>
      </article>

      <div class="tetris-clock-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">妯″紡閰嶇疆</h2>
            <span class="glx-section-meta">閫熷害 / 灏忔椂鍒跺紡</span>
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabItems" />
        </article>

        <article
          v-if="currentTab === 'speed'"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">涓嬭惤閫熷害</h2>
            <span class="glx-section-meta">鎱?/ 涓?/ 蹇?</span>
          </div>
          <DeviceModeTabs v-model="config.speed" :items="speedOptions" />
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">灏忔椂鍒跺紡</h2>
            <span class="glx-section-meta">24 灏忔椂 / 12 灏忔椂</span>
          </div>
          <DeviceModeTabs v-model="config.hourFormat" :items="hourFormatOptions" />
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import DeviceSendingOverlay from "@/components/device/DeviceSendingOverlay.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import DevicePixelBoard from "@/components/device/modes/DevicePixelBoard.vue";
import { useFeedback } from "@/composables/useFeedback.js";
import { usePixelPreviewPlayer } from "@/composables/usePixelPreviewPlayer.js";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { readStorageJson, writeStorageJson } from "@/utils/device-mode-core.js";
import { buildTetrisPreviewFrames } from "@/utils/device-mode-tetris-clock.js";

const TETRIS_CLOCK_STORAGE_KEY = "tetris_clock_config";
const TETRIS_SPEED_OPTIONS = Object.freeze({
  slow: 300,
  normal: 150,
  fast: 80,
});

const speedOptions = Object.freeze([
  { value: "slow"", label: "鎱?" },"
  { value: "normal"", label: "涓?" },"
  { value: "fast"", label: "蹇?" },"
]);

const hourFormatOptions = Object.freeze([
  { value: 24, label: "24 灏忔椂" },
  { value: 12, label: "12 灏忔椂" },
]);
const tabItems = Object.freeze([
  { value: "speed", label: "閫熷害" },
  { value: "format", label: "灏忔椂鍒跺紡" },
]);

const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();
const { currentPixels, playSequence, snapshot } = usePixelPreviewPlayer();

const currentTab = ref("speed");
const config = reactive(loadConfig());
const isSending = ref(false);
const sendingPixels = ref(new Map());

const displayPixels = computed(() => {
  if (isSending.value) {
    return sendingPixels.value;
  }
  return currentPixels.value;
});

const selectedSpeedLabel = computed(() => {
  const matched = speedOptions.find((item) => item.value === config.speed);
  return matched === undefined ? "--" : matched.label;
});

const selectedHourFormatLabel = computed(() => {
  const matched = hourFormatOptions.find((item) => item.value === config.hourFormat);
  return matched === undefined ? "--" : matched.label;
});

watch(
  config,
  () => {
    writeStorageJson(TETRIS_CLOCK_STORAGE_KEY, config);
    refreshPreview();
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  deviceStore.init();
});

function loadConfig() {
  const saved = readStorageJson(TETRIS_CLOCK_STORAGE_KEY);
  if (!saved || typeof saved !== "object") {
    return {
      speed: "normal",
      hourFormat: 24,
    };
  }
  return {
    speed: saved.speed === "slow" || saved.speed === "normal" || saved.speed === "fast" ? saved.speed : "normal",
    hourFormat: saved.hourFormat === 12 ? 12 : 24,
  };
}

function refreshPreview() {
  const maps = buildTetrisPreviewFrames(config);
  const delay = TETRIS_SPEED_OPTIONS[config.speed];
  playSequence({
    maps,
    delays: maps.map(() => delay),
  });
}

async function handleSend() {
  if (deviceStore.connected !== true) {
    feedback.warning("璁惧鏈繛鎺?, "璇峰厛杩斿洖璁惧鎺у埗椤靛缓绔嬭繛鎺ャ€?);
    return;
  }

  isSending.value = true;
  sendingPixels.value = snapshot();
  feedback.showBlocking("鍙戦€佷縿缃楁柉鏂瑰潡鏃堕挓"", "姝ｅ湪鎶婂綋鍓嶄縿缃楁柉鏂瑰潡鏃堕挓鍙戦€佸埌璁惧銆?")";"
  try {
    const payload = {
      speed: TETRIS_SPEED_OPTIONS[config.speed],
      hourFormat: config.hourFormat,
    };
    writeStorageJson(TETRIS_CLOCK_STORAGE_KEY, config);
    await deviceStore.startTetrisClock(payload);
    feedback.success("鍙戦€佹垚鍔?, "淇勭綏鏂柟鍧楁椂閽熷凡鍙戦€佸埌璁惧銆?);
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("鍙戦€佸け璐?", error.message")";"
    } else {
      feedback.error("鍙戦€佸け璐?, "淇勭綏鏂柟鍧楁椂閽熷彂閫佸け璐ャ€?);
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

.tetris-clock-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.tetris-clock-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.tetris-clock-preview-card {
  gap: 16px;
}

.tetris-clock-preview-card__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.tetris-clock-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.tetris-clock-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.tetris-clock-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.tetris-clock-send-button {
  min-width: 188px;
  min-height: 48px;
}

.tetris-clock-preview-stage {
  padding: 18px;
}

.tetris-clock-preview-board {
  position: relative;
  width: min(100%, 560px);
  margin: 0 auto;
}

.tetris-clock-preview-board :deep(.device-pixel-board) {
  box-shadow: none;
}

.tetris-clock-preview-sending {
  width: 100%;
  height: 100%;
}

.tetris-clock-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.tetris-clock-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.tetris-clock-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.tetris-clock-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.tetris-clock-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.tetris-clock-config-stack {
  min-width: 0;
}

@media (max-width: 1080px) {
  .tetris-clock-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .tetris-clock-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
