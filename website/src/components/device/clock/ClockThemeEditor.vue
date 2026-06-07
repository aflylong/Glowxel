<template>
  <div class="theme-mode-page glx-page-shell game-mode-page">
    <PcModeTopbar title="主题模式" />

    <section class="theme-mode-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack theme-preview-card game-preview-card"
      >
        <div class="theme-preview-card__head">
          <div>
            <p class="theme-preview-card__eyebrow">Theme Clock</p>
            <h2 class="theme-preview-card__title">主题展示</h2>
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
              {{ isSending ? "发送中..." : "发送到设备" }}
            </button>
            <button
              type="button"
              class="glx-button glx-button--ghost"
              @click="resetTheme"
            >
              恢复默认主题
            </button>
          </div>
          <span
            class="glx-chip"
            :class="deviceStore.connected ? 'glx-chip--green' : 'glx-chip--yellow'"
          >
            {{ deviceStore.connected ? "已连接" : "未连接" }}
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
              title="正在发送主题模式"
              description="发送期间锁定当前主题快照，等待设备完成主题模式事务提交。"
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
            <span class="theme-summary-card__label">选中主题</span>
            <strong class="theme-summary-card__value">{{ activePresetName }}</strong>
            <span class="theme-summary-card__meta">{{ activePreset?.styleTag || "--" }}</span>
          </article>
          <article class="theme-summary-card">
            <span class="theme-summary-card__label">设备主题</span>
            <strong class="theme-summary-card__value">{{ currentDeviceThemeName }}</strong>
            <span class="theme-summary-card__meta">
              {{ activePreviewImage.length > 0 ? "主题资源图" : "本地生成" }}
            </span>
          </article>
          <article class="theme-summary-card">
            <span class="theme-summary-card__label">风格</span>
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
            <h2 class="glx-section-title">模式配置</h2>
            <span class="glx-section-meta">主题库 / 当前主题说明</span>
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabItems" />
        </article>

        <article
          v-if="currentTab === 'themes'"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">主题库</h2>
            <span class="glx-section-meta">{{ presets.length }} 个主题</span>
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
            <h2 class="glx-section-title">当前主题说明</h2>
            <span class="glx-section-meta">uniapp 对齐</span>
          </div>
          <div v-if="activePreset" class="theme-copy">
            <strong>{{ activePreset.name }}</strong>
            <p>{{ activePreset.description }}</p>
            <p>当前网站端使用与 uniapp 一致的 preset 配置和字模宽度，主差异只剩设备发送链与状态回显。</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { useFeedback } from "@/composables/useFeedback.js";
import DeviceSendingOverlay from "@/components/device/DeviceSendingOverlay.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import { buildDeviceClockPayload, renderDeviceClockFrame } from "@/utils/device-clock-core.js";
import ClockPixelCanvas from "./ClockPixelCanvas.vue";
import ClockThemePresetGrid from "./ClockThemePresetGrid.vue";
import {
  applyWebsiteClockThemePreset,
  findWebsiteClockThemePreset,
  getWebsiteClockThemePresets,
} from "@/utils/device-clock-presets.js";

const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();
const presets = getWebsiteClockThemePresets();
const tabItems = Object.freeze([
  { value: "themes", label: "主题库" },
  { value: "about", label: "当前主题说明" },
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
    feedback.warning("设备未连接", "先去设备控制页建立 WebSocket，再从这里发送主题模式。");
    return;
  }

  if (activePreset.value === null) {
    feedback.error("发送失败", "请先选择主题。");
    return;
  }

  isSending.value = true;
  sendingPreviewImage.value = activePreviewImage.value;
  sendingFrame.value = previewFrame.value;
  feedback.showBlocking("发送主题", "正在把主题模式和主题配置发送到设备。");
  deviceStore
    .applyThemeMode(
      buildDeviceClockPayload(activePreset.value.config, previewNow.value),
      activePreset.value.id,
    )
    .then(() => {
      feedback.success("发送成功", `${activePreset.value.name} 已经发送到设备。`);
    })
    .catch((error) => {
      if (error instanceof Error) {
        feedback.error("发送失败", error.message);
        return;
      }
      feedback.error("发送失败", "主题模式发送失败。");
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
