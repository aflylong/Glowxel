<template>
  <div class="theme-mode-page glx-page-shell game-mode-page">
    <PcModeTopbar title="涓婚妯″紡" />

    <section class="theme-mode-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack theme-preview-card game-preview-card"
      >
        <div class="theme-preview-card__head">
          <div>
            <p class="theme-preview-card__eyebrow">Theme Clock</p>
            <h2 class="theme-preview-card__title">涓婚灞曠ず</h2>
          </div>
        </div>

        <div class="theme-preview-toolbar">
          <div class="theme-preview-toolbar__actions">
            <button
              type="button"
              class="glx-button glx-button--primary theme-send-button"
              :disabled="isSending"
              @click="handleSend"
            >
              {{ isSending ? "鍙戦€佷腑..." : "鍙戦€佸埌璁惧" }}
            </button>
            <button
              type="button"
              class="glx-button glx-button--ghost"
              @click="resetTheme"
            >
              鎭㈠榛樿涓婚
            </button>
          </div>
          <span
            class="glx-chip"
            :class="deviceStore.connected ? 'glx-chip--green' : 'glx-chip--yellow'"
          >
            {{ deviceStore.connected ? "宸茶繛鎺? : "鏈繛鎺? }}
          </span>
        </div>

        <div class="theme-preview-stage game-preview-stage">
          <div class="theme-preview-board">
            <img
              v-if="activePreviewImage.length > 0"
              :src="activePreviewImage"
              :alt="activePresetName"
              class="theme-preview-stage__image"
            />
            <ClockPixelCanvas v-else :frame="previewFrame" rounded />
            <DeviceSendingOverlay
              :visible="isSending"
              title="姝ｅ湪鍙戦€佷富棰樻ā寮?"
              description="鍙戦€佹湡闂撮攣瀹氬綋鍓嶄富棰樺揩鐓э紝绛夊緟璁惧瀹屾垚涓婚妯″紡浜嬪姟鎻愪氦銆?"
            >
              <img
                v-if="sendingPreviewImage.length > 0"
                :src="sendingPreviewImage"
                :alt="activePresetName"
                class="theme-preview-stage__image"
              />
              <div v-else class="theme-preview-sending">
                <ClockPixelCanvas :frame="sendingFrame" rounded />
              </div>
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="theme-summary-grid">
          <article class="theme-summary-card">
            <span class="theme-summary-card__label">閫変腑涓婚</span>
            <strong class="theme-summary-card__value">{{ activePresetName }}</strong>
            <span class="theme-summary-card__meta">{{ activePreset?.styleTag || "--" }}</span>
          </article>
          <article class="theme-summary-card">
            <span class="theme-summary-card__label">璁惧涓婚</span>
            <strong class="theme-summary-card__value">{{ currentDeviceThemeName }}</strong>
            <span class="theme-summary-card__meta">
              {{ activePreviewImage.length > 0 ? "涓婚璧勬簮鍥?" : "鏈湴鐢熸垚""" }}"
            </span>
          </article>
          <article class="theme-summary-card">
            <span class="theme-summary-card__label">椋庢牸</span>
            <strong class="theme-summary-card__value">
              {{ activePreset?.config.font || "--" }}
            </strong>
            <span class="theme-summary-card__meta">
              {{ activePreset?.config.hourFormat === 12 ? "12h" : "24h" }} / {{ activePreset?.accentColor || "--" }}
            </span>
          </article>
        </div>
      </article>

      <div class="theme-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">妯″紡閰嶇疆</h2>
            <span class="glx-section-meta">涓婚搴?/ 褰撳墠涓婚璇存槑</span>
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabItems" />
        </article>

        <article
          v-if="currentTab === 'themes'"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">涓婚搴?</h2>
            <span class="glx-section-meta">{{ presets.length }} 涓富棰?</span>
          </div>
          <ClockThemePresetGrid
            :presets="presets"
            :selected-theme-id="selectedThemeId"
            :current-theme-id="currentDeviceThemeId"
            @select-theme="applyTheme"
          />
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">褰撳墠涓婚璇存槑</h2>
            <span class="glx-section-meta">uniapp 瀵归綈</span>
          </div>
          <div v-if="activePreset" class="theme-copy">
            <strong>{{ activePreset.name }}</strong>
            <p>{{ activePreset.description }}</p>
            <p>褰撳墠缃戠珯绔娇鐢ㄤ笌 uniapp 涓€鑷寸殑 preset 閰嶇疆鍜屽瓧妯″搴︼紝涓诲樊寮傚彧鍓╄澶囧彂閫侀摼涓庣姸鎬佸洖鏄俱€?</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useDeviceStore } from "@/stores/device.js";
import { useFeedback } from "@/composables/useFeedback.js";
import DeviceSendingOverlay from "@/components/device/DeviceSendingOverlay.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import { renderDeviceClockFrame } from "@/utils/device-clock-core.js";
import {
  DEVICE_CLOCK_SEND_MODES,
  sendDeviceClockMode,
} from "@/utils/device-clock-protocol.js";
import ClockPixelCanvas from "./ClockPixelCanvas.vue";
import ClockThemePresetGrid from "./ClockThemePresetGrid.vue";
import {
  applyWebsiteClockThemePreset,
  findWebsiteClockThemePreset,
  getWebsiteClockThemePresets,
} from "@/utils/device-clock-presets.js";

const deviceStore = useDeviceStore();
const feedback = useFeedback();
const presets = getWebsiteClockThemePresets();
const tabItems = Object.freeze([
  { value: "themes"", label: "涓婚搴?" },"
  { value: "about", label: "褰撳墠涓婚璇存槑" },
]);
const currentTab = ref("themes");
const selectedThemeId = ref(presets[0]?.id || "");
const previewNow = ref(new Date());
const isSending = ref(false);
const sendingPreviewImage = ref("");
const sendingFrame = ref(renderDeviceClockFrame());
let previewTimer = null;

const activePreset = computed(() => {
  return findWebsiteClockThemePreset(selectedThemeId.value);
});

const activePresetName = computed(() => {
  if (activePreset.value === null) {
    return "--";
  }
  return activePreset.value.name;
});

const activePreviewImage = computed(() => {
  if (activePreset.value === null) {
    return "";
  }
  if (typeof activePreset.value.previewImage !== "string") {
    return "";
  }
  return activePreset.value.previewImage;
});

const currentDeviceThemeId = computed(() => {
  if (!deviceStore.connected) {
    return "";
  }
  if (deviceStore.deviceMode !== "theme") {
    return "";
  }
  const savedThemeId = localStorage.getItem("clock_device_theme_id");
  if (typeof savedThemeId !== "string") {
    return "";
  }
  return savedThemeId;
});

const currentDeviceThemeName = computed(() => {
  if (currentDeviceThemeId.value.length === 0) {
    return "--";
  }
  const preset = findWebsiteClockThemePreset(currentDeviceThemeId.value);
  if (preset === null) {
    return currentDeviceThemeId.value;
  }
  return preset.name;
});

const previewFrame = computed(() => {
  if (!activePreset.value) {
    return renderDeviceClockFrame();
  }
  return renderDeviceClockFrame({
    config: activePreset.value.config,
    now: previewNow.value,
    themeId: activePreset.value.id,
  });
});

function applyTheme(themeId) {
  selectedThemeId.value = themeId;
  localStorage.setItem("clock_device_theme_id", themeId);
  localStorage.setItem(
    "clock_config_theme",
    JSON.stringify({
      config: applyWebsiteClockThemePreset(activePreset.value?.config || presets[0].config, themeId),
      themeId,
    }),
  );
}

function resetTheme() {
  if (presets[0]) {
    selectedThemeId.value = presets[0].id;
  }
}

function handleSend() {
  if (isSending.value) {
    return;
  }

  if (!deviceStore.connected) {
    feedback.warning("璁惧鏈繛鎺?, "鍏堝幓璁惧鎺у埗椤靛缓绔?WebSocket锛屽啀浠庤繖閲屽彂閫佷富棰樻ā寮忋€?);
    return;
  }

  if (activePreset.value === null) {
    feedback.error("鍙戦€佸け璐?, "璇峰厛閫夋嫨涓婚銆?);
    return;
  }

  isSending.value = true;
  sendingPreviewImage.value = activePreviewImage.value;
  sendingFrame.value = previewFrame.value;
  feedback.showBlocking("鍙戦€佷富棰?, "姝ｅ湪鎶婁富棰樻ā寮忓拰涓婚閰嶇疆鍙戦€佸埌璁惧銆?);
  sendDeviceClockMode(
    deviceStore.getWebSocket(),
    {
      mode: DEVICE_CLOCK_SEND_MODES.THEME,
      themeId: activePreset.value.id,
    },
  )
    .then(() => {
      localStorage.setItem("clock_device_theme_id", activePreset.value.id);
      feedback.success("鍙戦€佹垚鍔?, `${activePreset.value.name"} 宸茬粡鍙戦€佸埌璁惧銆俙")";"
    })
    .catch((error) => {
      if (error instanceof Error) {
        feedback.error("鍙戦€佸け璐?", error.message")";"
        return;
      }
      feedback.error("鍙戦€佸け璐?, "涓婚妯″紡鍙戦€佸け璐ャ€?);
    })
    .finally(() => {
      isSending.value = false;
      feedback.hideBlocking();
    });
}

onMounted(() => {
  deviceStore.init();
  const savedThemeId = localStorage.getItem("clock_device_theme_id");
  if (savedThemeId && presets.some((preset) => preset.id === savedThemeId)) {
    selectedThemeId.value = savedThemeId;
  }
  previewTimer = window.setInterval(() => {
    previewNow.value = new Date();
  }, 1000);
});

onBeforeUnmount(() => {
  if (previewTimer) {
    window.clearInterval(previewTimer);
    previewTimer = null;
  }
});
</script>

<style scoped>
.game-mode-page {
  gap: 24px;
}

.theme-mode-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.theme-mode-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.theme-preview-card {
  gap: 16px;
}

.theme-preview-card__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.theme-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.theme-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.theme-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.theme-preview-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.theme-send-button {
  min-width: 188px;
  min-height: 48px;
}

.theme-preview-stage {
  padding: 18px;
}

.theme-preview-board {
  position: relative;
  width: min(100%, 560px);
  margin: 0 auto;
}

.theme-preview-stage__image {
  width: 100%;
  aspect-ratio: 1;
  display: block;
  object-fit: contain;
  background: #000000;
  image-rendering: pixelated;
}

.theme-preview-sending {
  width: 100%;
  height: 100%;
}

.theme-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.theme-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.theme-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.theme-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.theme-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.theme-config-stack {
  min-width: 0;
}

.theme-copy {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-copy p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1080px) {
  .theme-mode-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .theme-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .theme-preview-toolbar__actions {
    width: 100%;
  }
}
</style>
