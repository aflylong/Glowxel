<template>
  <div class="spirit-page glx-page-shell game-mode-page">
    <PcModeTopbar title="妗岄潰瀹犵墿" />

    <section class="spirit-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack spirit-preview-card game-preview-card"
      >
        <div class="spirit-preview-card__head">
          <div>
            <p class="spirit-preview-card__eyebrow">Device Mode</p>
            <h2 class="spirit-preview-card__title">妗岄潰瀹犵墿棰勮</h2>
          </div>
        </div>

        <div class="spirit-preview-toolbar">
          <button
            type="button"
            class="glx-button glx-button--primary spirit-send-button"
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

        <div class="spirit-preview-stage game-preview-stage">
          <div class="spirit-preview-board">
            <DevicePixelBoard :pixels="previewPixels" :grid-visible="true" />
            <DeviceSendingOverlay
              :visible="isSending"
              title="姝ｅ湪鍙戦€佹闈㈠疇鐗?"
              description="鍙戦€佹湡闂撮攣瀹氬綋鍓嶉瑙堝揩鐓э紝绛夊緟璁惧瀹屾垚妗岄潰瀹犵墿閰嶇疆浜嬪姟鎻愪氦銆?"
            >
              <div class="spirit-preview-sending">
                <DevicePixelBoard :pixels="sendingPixels" :grid-visible="true" />
              </div>
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="spirit-summary-grid">
          <article class="spirit-summary-card">
            <span class="spirit-summary-card__label">琛ㄦ儏</span>
            <strong class="spirit-summary-card__value">{{ selectedExpressionLabel }}</strong>
            <span class="spirit-summary-card__meta">{{ expressionModeLabel }}</span>
          </article>
          <article class="spirit-summary-card">
            <span class="spirit-summary-card__label">鏃堕棿</span>
            <strong class="spirit-summary-card__value">
              {{ eyesConfig.time.showSeconds ? "鏄剧ず绉掗挓" : "闅愯棌绉掗挓" }}
            </strong>
            <span class="spirit-summary-card__meta">
              {{ eyesConfig.style.timeColor }} / 瀛楀彿 {{ eyesConfig.time.fontSize }}
            </span>
          </article>
          <article class="spirit-summary-card">
            <span class="spirit-summary-card__label">瀛椾綋</span>
            <strong class="spirit-summary-card__value">{{ selectedFontLabel }}</strong>
            <span class="spirit-summary-card__meta">
              鐪肩潧 {{ eyesConfig.style.eyeColor }}
            </span>
          </article>
        </div>
      </article>

      <div class="spirit-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">妯″紡閰嶇疆</h2>
            <span class="glx-section-meta">琛ㄦ儏 / 鏃堕棿 / 瀛椾綋</span>
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabItems" />
        </article>

        <template v-if="currentTab === 'expression'">
          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">琛ㄦ儏妯″紡</h2>
              <span class="glx-section-meta">鑷姩 / 鎵嬪姩</span>
            </div>
            <DeviceModeTabs v-model="expressionMode" :items="EXPRESSION_MODE_OPTIONS" />
          </article>

          <article v-if="expressionMode === 'manual'" class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">鎸囧畾琛ㄦ儏</h2>
              <span class="glx-section-meta">{{ EXPRESSION_OPTIONS.length }} 涓〃鎯?</span>
            </div>
            <div class="expression-grid">
              <button
                v-for="item in EXPRESSION_OPTIONS"
                :key="item.value"
                type="button"
                class="expression-card"
                :class="{ 'is-active': selectedExpression === item.value }"
                @click="selectedExpression = item.value"
              >
                {{ item.label }}
              </button>
            </div>
          </article>

          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">鑷姩鑺傚</h2>
              <span class="glx-section-meta">浠呰嚜鍔ㄦā寮忕敓鏁?</span>
            </div>
            <DeviceModeTabs
              v-model="eyesConfig.behavior.expressionRhythm"
              :items="EXPRESSION_RHYTHM_OPTIONS"
            />
          </article>

          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">棰滆壊</h2>
              <span class="glx-section-meta">鐪肩潧 / 鏃堕棿</span>
            </div>
            <div class="game-fields">
              <GameModeColorField
                v-model="eyesConfig.style.eyeColor"
                label="鐪肩潧棰滆壊"
                :preset-colors="colorOptions"
              />
              <GameModeColorField
                v-model="eyesConfig.style.timeColor"
                label="鏃堕棿棰滆壊"
                :preset-colors="colorOptions"
              />
            </div>
          </article>

          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">鍙傛暟璋冩暣</h2>
              <span class="glx-section-meta">鐪ㄧ溂 / 娓歌蛋 / 鐏靛姩骞呭害</span>
            </div>
            <div class="game-row">
              <span class="game-row__label">鐪ㄧ溂姝ラ {{ blinkLevel }}</span>
              <DeviceModeStepper v-model="blinkLevel" :min="1" :max="10" />
            </div>
            <div class="game-row">
              <span class="game-row__label">娓歌蛋姝ラ {{ lookLevel }}</span>
              <DeviceModeStepper v-model="lookLevel" :min="1" :max="10" />
            </div>
            <div class="game-row">
              <span class="game-row__label">鐏靛姩骞呭害 {{ eyesConfig.behavior.idleMove }}</span>
              <DeviceModeStepper v-model="eyesConfig.behavior.idleMove" :min="1" :max="10" />
            </div>
          </article>

          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">浜掑姩棰勮</h2>
              <span class="glx-section-meta">鍙奖鍝嶆湰鍦伴瑙?</span>
            </div>
            <div class="game-inline-actions">
              <button type="button" class="glx-button glx-button--ghost" @click="triggerPreviewAction('blink')">鐪ㄧ溂</button>
              <button type="button" class="glx-button glx-button--ghost" @click="triggerPreviewAction('look_left')">鐪嬪乏</button>
              <button type="button" class="glx-button glx-button--ghost" @click="triggerPreviewAction('look_center')">鐪嬩腑</button>
              <button type="button" class="glx-button glx-button--ghost" @click="triggerPreviewAction('look_right')">鐪嬪彸</button>
            </div>
          </article>
        </template>

        <article v-else-if="currentTab === 'time'" class="glx-section-card glx-section-card--stack">
          <ClockTextSettingsSection
            title="鏃堕棿鏄剧ず"
            description="妗岄潰瀹犵墿鐨勬椂闂村竷灞€銆侀鑹插拰瀵归綈鐩存帴瀵归綈 uniapp 褰撳墠璇箟銆?"
            :section="timeSection"
            :preset-colors="colorOptions"
            :show-font-size="true"
            :show-seconds-control="true"
            :show-seconds="eyesConfig.time.showSeconds"
            :min-font-size="1"
            :max-font-size="3"
            @toggle="toggleTimeShow"
            @toggle-seconds="toggleTimeSeconds"
            @adjust="handleTimeAdjust"
            @set-align="handleTimeAlign"
            @update-color="handleTimeColor"
          />
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <GameModeFontSelector
            title="瀛椾綋鏍峰紡"
            description="淇濈暀妗岄潰瀹犵墿鑷繁鐨勬椂闂村瓧妯¤缃紝鍜屽彂閫?payload 鍏辩敤鍚屼竴瀛楁銆?"
            :font-options="EYES_TIME_FONT_OPTIONS"
            :selected-font="eyesConfig.time.font"
            :show-seconds="eyesConfig.time.showSeconds"
            :hour-format="24"
            :show-hour-format="false"
            @select-font="eyesConfig.time.font = $event"
            @set-show-seconds="handleShowSecondsChange"
          />
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import DeviceSendingOverlay from "@/components/device/DeviceSendingOverlay.vue";
import ClockTextSettingsSection from "@/components/device/clock/ClockTextSettingsSection.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import DeviceModeStepper from "@/components/device/modes/DeviceModeStepper.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import DevicePixelBoard from "@/components/device/modes/DevicePixelBoard.vue";
import GameModeColorField from "@/components/device/modes/GameModeColorField.vue";
import GameModeFontSelector from "@/components/device/modes/GameModeFontSelector.vue";
import { useFeedback } from "@/composables/useFeedback.js";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { readStorageJson, writeStorageJson } from "@/utils/device-mode-core.js";
import {
  buildEyesConfigPayload,
  buildSpiritPreviewPixels,
  createDefaultLocalPreviewState,
  createSpiritPreviewRuntime,
  EYES_CONFIG_STORAGE_KEY,
  EYES_EXPRESSION_STORAGE_KEY,
  EYES_LOCAL_PREVIEW_STORAGE_KEY,
  EYES_PRESET_COLORS,
  EYES_TIME_FONT_OPTIONS,
  EXPRESSION_MODE_OPTIONS,
  EXPRESSION_OPTIONS,
  EXPRESSION_RHYTHM_OPTIONS,
  normalizeEyesConfig,
  normalizeLocalPreview,
  normalizeSpiritTimeLayout,
  triggerSpiritPreviewAction,
  stepSpiritPreview,
  createDefaultEyesConfig,
} from "@/utils/device-mode-spirit.js";

const tabItems = Object.freeze([
  { value: "expression", label: "琛ㄦ儏" },
  { value: "time", label: "鏃堕棿" },
  { value: "font", label: "瀛椾綋" },
]);

const colorOptions = EYES_PRESET_COLORS.map((item) => ({
  name: item.label,
  hex: item.value,
}));

const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();

const currentTab = ref("expression");
const eyesConfig = reactive(loadEyesConfig());
const selectedExpression = ref(loadSelectedExpression());
const localPreview = reactive(loadLocalPreview());
const runtime = ref(createSpiritPreviewRuntime(selectedExpression.value));
const previewPixels = ref(new Map());
const isSending = ref(false);
const sendingPixels = ref(new Map());
const blinkLevel = ref(levelFromInterval(eyesConfig.behavior.blinkIntervalMs));
const lookLevel = ref(levelFromInterval(eyesConfig.behavior.lookIntervalMs));

let previewTimerId = null;

const expressionMode = computed({
  get() {
    return eyesConfig.behavior.autoSwitch ? "auto" : "manual";
  },
  set(value) {
    eyesConfig.behavior.autoSwitch = value === "auto";
    refreshPreview();
  },
});

const timeSection = computed(() => {
  return {
    show: eyesConfig.time.show,
    fontSize: eyesConfig.time.fontSize,
    x: eyesConfig.layout.timeX,
    y: eyesConfig.layout.timeY,
    color: eyesConfig.style.timeColor,
    align: eyesConfig.time.align,
  };
});

const selectedExpressionLabel = computed(() => {
  const matched = EXPRESSION_OPTIONS.find(
    (item) => item.value === selectedExpression.value,
  );
  return matched === undefined ? "--" : matched.label;
});

const expressionModeLabel = computed(() => {
  return expressionMode.value === "auto" ? "鑷姩妯″紡" : "鎵嬪姩妯″紡";
});

const selectedFontLabel = computed(() => {
  const matched = EYES_TIME_FONT_OPTIONS.find(
    (item) => item.id === eyesConfig.time.font,
  );
  return matched === undefined ? "--" : matched.name;
});

watch(
  eyesConfig,
  () => {
    blinkLevel.value = levelFromInterval(eyesConfig.behavior.blinkIntervalMs);
    lookLevel.value = levelFromInterval(eyesConfig.behavior.lookIntervalMs);
    persistSpiritState();
    refreshPreview();
  },
  { deep: true },
);

watch(selectedExpression, () => {
  persistSpiritState();
  refreshPreview();
});

watch(
  localPreview,
  () => {
    persistSpiritState();
    refreshPreview();
  },
  { deep: true },
);

watch(blinkLevel, (value) => {
  eyesConfig.behavior.blinkIntervalMs = intervalFromLevel(value);
});

watch(lookLevel, (value) => {
  eyesConfig.behavior.lookIntervalMs = intervalFromLevel(value) + 500;
});

onMounted(() => {
  deviceStore.init();
  startPreviewLoop();
  refreshPreview();
});

onBeforeUnmount(() => {
  stopPreviewLoop();
});

function loadEyesConfig() {
  return normalizeEyesConfig(readStorageJson(EYES_CONFIG_STORAGE_KEY) || createDefaultEyesConfig());
}

function loadSelectedExpression() {
  const saved = localStorage.getItem(EYES_EXPRESSION_STORAGE_KEY);
  if (EXPRESSION_OPTIONS.some((item) => item.value === saved)) {
    return saved;
  }
  return "Normal";
}

function loadLocalPreview() {
  const saved = readStorageJson(EYES_LOCAL_PREVIEW_STORAGE_KEY);
  if (saved) {
    return normalizeLocalPreview(saved);
  }
  return createDefaultLocalPreviewState();
}

function persistSpiritState() {
  writeStorageJson(EYES_CONFIG_STORAGE_KEY, eyesConfig);
  writeStorageJson(EYES_LOCAL_PREVIEW_STORAGE_KEY, localPreview);
  localStorage.setItem(EYES_EXPRESSION_STORAGE_KEY, selectedExpression.value);
}

function levelFromInterval(intervalMs) {
  const safe = Number.isFinite(Number(intervalMs)) ? Number(intervalMs) : 3200;
  return Math.max(1, Math.min(10, Math.round((5600 - safe) / 400)));
}

function intervalFromLevel(level) {
  return 5600 - Math.max(1, Math.min(10, Number(level))) * 400;
}

function startPreviewLoop() {
  stopPreviewLoop();
  previewTimerId = window.setInterval(() => {
    stepSpiritPreview(runtime.value, eyesConfig, selectedExpression.value);
    refreshPreview();
  }, 33);
}

function stopPreviewLoop() {
  if (previewTimerId !== null) {
    window.clearInterval(previewTimerId);
    previewTimerId = null;
  }
}

function refreshPreview() {
  const cloned = JSON.parse(JSON.stringify(eyesConfig));
  normalizeSpiritTimeLayout(cloned);
  previewPixels.value = buildSpiritPreviewPixels(
    cloned,
    selectedExpression.value,
    localPreview,
    runtime.value,
  );
}

function triggerPreviewAction(action) {
  triggerSpiritPreviewAction(runtime.value, action);
  refreshPreview();
}

function toggleTimeShow() {
  eyesConfig.time.show = !eyesConfig.time.show;
}

function toggleTimeSeconds() {
  eyesConfig.time.showSeconds = !eyesConfig.time.showSeconds;
}

function handleShowSecondsChange(value) {
  eyesConfig.time.showSeconds = value === true;
}

function handleTimeAdjust(fieldKey, delta, min, max) {
  if (fieldKey === "fontSize") {
    const nextValue = Math.max(min, Math.min(max, eyesConfig.time.fontSize + delta));
    eyesConfig.time.fontSize = nextValue;
    return;
  }
  if (fieldKey === "x") {
    eyesConfig.layout.timeX = Math.max(min, Math.min(max, eyesConfig.layout.timeX + delta));
    return;
  }
  eyesConfig.layout.timeY = Math.max(min, Math.min(max, eyesConfig.layout.timeY + delta));
}

function handleTimeAlign(align) {
  eyesConfig.time.align = align;
  if (align === "left") {
    eyesConfig.layout.timeX = 0;
  } else if (align === "center") {
    eyesConfig.layout.timeX = 32;
  } else {
    eyesConfig.layout.timeX = 63;
  }
}

function handleTimeColor(color) {
  eyesConfig.style.timeColor = color;
}

async function handleSend() {
  if (deviceStore.connected !== true) {
    feedback.warning("璁惧鏈繛鎺?, "璇峰厛杩斿洖璁惧鎺у埗椤靛缓绔嬭繛鎺ャ€?);
    return;
  }

  isSending.value = true;
  sendingPixels.value = new Map(previewPixels.value);
  feedback.showBlocking("鍙戦€佹闈㈠疇鐗?, "姝ｅ湪鎶婂綋鍓嶆闈㈠疇鐗╅厤缃彂閫佸埌璁惧銆?);
  try {
    const nextConfig = JSON.parse(JSON.stringify(eyesConfig));
    normalizeSpiritTimeLayout(nextConfig);
    await deviceStore.setEyesConfig(buildEyesConfigPayload(nextConfig));
    if (!nextConfig.behavior.autoSwitch) {
      const ws = deviceStore.getWebSocket();
      await ws.eyesInteract(`set_expression:${selectedExpression.value}`);
    }
    persistSpiritState();
    feedback.success("鍙戦€佹垚鍔?, "妗岄潰瀹犵墿宸插彂閫佸埌璁惧銆?);
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("鍙戦€佸け璐?", error.message")";"
    } else {
      feedback.error("鍙戦€佸け璐?, "妗岄潰瀹犵墿鍙戦€佸け璐ャ€?);
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

.spirit-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.spirit-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.spirit-preview-card {
  gap: 18px;
}

.spirit-preview-card__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.spirit-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.spirit-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.spirit-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.spirit-send-button {
  min-width: 196px;
  min-height: 50px;
}

.spirit-preview-stage {
  padding: 20px;
  min-height: 420px;
  display: flex;
  align-items: center;
}

.spirit-preview-board {
  position: relative;
  width: min(100%, 620px);
  margin: 0 auto;
}

.spirit-preview-board :deep(.device-pixel-board) {
  box-shadow: none;
}

.spirit-preview-sending {
  width: 100%;
  height: 100%;
}

.spirit-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.spirit-summary-card {
  display: grid;
  gap: 6px;
  min-height: 112px;
  padding: 16px;
  border: 2px solid #000000;
  background: #ffffff;
}

.spirit-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.spirit-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.spirit-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.spirit-config-stack {
  min-width: 0;
  display: grid;
  gap: 18px;
}

.game-fields {
  display: grid;
  gap: 18px;
}

.game-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

.expression-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.expression-card {
  min-height: 48px;
  border: 2px solid #000000;
  background: #ffffff;
  font-weight: 700;
  cursor: pointer;
}

.expression-card.is-active {
  background: #ffd23f;
}

@media (max-width: 1080px) {
  .spirit-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .spirit-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .expression-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .game-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
