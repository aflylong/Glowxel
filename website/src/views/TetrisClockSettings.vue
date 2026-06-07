<template>
  <div class="tetris-clock-page glx-page-shell game-mode-page">
    <PcModeTopbar title="俄罗斯方块时钟" />

    <section class="tetris-clock-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack tetris-clock-preview-card game-preview-card"
      >
        <div class="tetris-clock-preview-card__head">
          <div>
            <p class="tetris-clock-preview-card__eyebrow">Device Mode</p>
            <h2 class="tetris-clock-preview-card__title">俄罗斯方块时钟预览</h2>
          </div>
        </div>

        <div class="tetris-clock-preview-toolbar">
          <button
            type="button"
            class="glx-button glx-button--primary tetris-clock-send-button"
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

        <div class="tetris-clock-preview-stage game-preview-stage">
          <div class="tetris-clock-preview-board">
            <DevicePixelBoard :pixels="displayPixels" :grid-visible="true" />
            <DeviceSendingOverlay
              :visible="isSending"
              title="正在发送俄罗斯方块时钟"
              description="发送期间锁定当前预览快照，等待设备完成方块时钟事务提交。"
            >
              <div class="tetris-clock-preview-sending">
                <DevicePixelBoard :pixels="sendingPixels" :grid-visible="true" />
              </div>
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="tetris-clock-summary-grid">
          <article class="tetris-clock-summary-card">
            <span class="tetris-clock-summary-card__label">速度</span>
            <strong class="tetris-clock-summary-card__value">{{ selectedSpeedLabel }}</strong>
            <span class="tetris-clock-summary-card__meta">{{ TETRIS_SPEED_OPTIONS[config.speed] }} ms</span>
          </article>
          <article class="tetris-clock-summary-card">
            <span class="tetris-clock-summary-card__label">制式</span>
            <strong class="tetris-clock-summary-card__value">{{ selectedHourFormatLabel }}</strong>
            <span class="tetris-clock-summary-card__meta">发送字段保持当前时钟语义</span>
          </article>
          <article class="tetris-clock-summary-card">
            <span class="tetris-clock-summary-card__label">预览</span>
            <strong class="tetris-clock-summary-card__value">像素帧同步</strong>
            <span class="tetris-clock-summary-card__meta">网站与设备使用同组配置</span>
          </article>
        </div>
      </article>

      <div class="tetris-clock-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">模式配置</h2>
            <span class="glx-section-meta">速度 / 小时制式</span>
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabItems" />
        </article>

        <article
          v-if="currentTab === 'speed'"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">下落速度</h2>
            <span class="glx-section-meta">慢 / 中 / 快</span>
          </div>
          <DeviceModeTabs v-model="config.speed" :items="speedOptions" />
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">小时制式</h2>
            <span class="glx-section-meta">24 小时 / 12 小时</span>
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
  { value: "slow", label: "慢" },
  { value: "normal", label: "中" },
  { value: "fast", label: "快" },
]);

const hourFormatOptions = Object.freeze([
  { value: 24, label: "24 小时" },
  { value: 12, label: "12 小时" },
]);
const tabItems = Object.freeze([
  { value: "speed", label: "速度" },
  { value: "format", label: "小时制式" },
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
    feedback.warning("设备未连接", "请先返回设备控制页建立连接。");
    return;
  }

  isSending.value = true;
  sendingPixels.value = snapshot();
  feedback.showBlocking("发送俄罗斯方块时钟", "正在把当前俄罗斯方块时钟发送到设备。");
  try {
    const payload = {
      speed: TETRIS_SPEED_OPTIONS[config.speed],
      hourFormat: config.hourFormat,
    };
    writeStorageJson(TETRIS_CLOCK_STORAGE_KEY, config);
    await deviceStore.startTetrisClock(payload);
    feedback.success("发送成功", "俄罗斯方块时钟已发送到设备。");
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("发送失败", error.message);
    } else {
      feedback.error("发送失败", "俄罗斯方块时钟发送失败。");
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
