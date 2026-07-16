<template>
  <div class="ambient-mode-page glx-page-shell game-mode-page">
    <PcModeTopbar title="鍍忕礌鍦烘櫙" />

    <section class="ambient-layout game-mode-layout">
      <article class="glx-section-card glx-section-card--stack ambient-preview-card game-preview-card">
        <div class="game-preview-card__head ambient-preview-card__head">
          <div>
            <p class="ambient-preview-card__eyebrow">Device Mode</p>
            <h2 class="ambient-preview-card__title">鍦烘櫙鏁堟灉棰勮</h2>
          </div>
          <span
            class="glx-chip"
            :class="deviceStore.connected ? 'glx-chip--green' : 'glx-chip--yellow'"
          >
            {{ deviceStore.connected ? "宸茶繛鎺? : "鏈繛鎺? }}
          </span>
        </div>

        <div class="ambient-preview-toolbar game-preview-actions">
          <button
            type="button"
            class="glx-button glx-button--primary ambient-send-button"
            :disabled="isSending"
            @click="saveAndApply"
          >
            {{ isSending ? "鍙戦€佷腑..." : "鍙戦€佸埌璁惧" }}
          </button>
        </div>

        <div class="ambient-preview-stage game-preview-stage">
          <div class="ambient-preview-board preview-canvas-container" :style="previewCanvasBoxStyle">
            <PixelCanvas
              v-if="previewCanvasReady && !shouldShowSendingSnapshot"
              :width="64"
              :height="64"
              :pixels="currentPreviewPixels"
              :zoom="previewZoom"
              :offset-x="previewOffset.x"
              :offset-y="previewOffset.y"
              :canvas-width="previewContainerSize.width"
              :canvas-height="previewContainerSize.height"
              :grid-visible="true"
              :is-dark-mode="true"
              :touch-enabled="false"
              canvas-id="ambientPreviewCanvas"
            />
            <PixelPreviewBoard
              v-else-if="previewCanvasReady && shouldShowSendingSnapshot"
              :width="64"
              :height="64"
              :pixels="sendingPreviewPixels"
              :refresh-token="sendingPreviewTick"
              :zoom="previewZoom"
              :offset-x="previewOffset.x"
              :offset-y="previewOffset.y"
              :grid-visible="true"
              :is-dark-mode="true"
            />
          </div>
        </div>

        <div class="ambient-summary-grid">
          <article class="ambient-summary-card">
            <span class="ambient-summary-card__label">鍦烘櫙</span>
            <strong class="ambient-summary-card__value">{{ currentPresetLabel }}</strong>
          </article>
          <article class="ambient-summary-card">
            <span class="ambient-summary-card__label">閫熷害</span>
            <strong class="ambient-summary-card__value">{{ config.speed }}</strong>
          </article>
          <article class="ambient-summary-card">
            <span class="ambient-summary-card__label">{{ isRainPreset ? "瀵嗗害" : "寮哄害" }}</span>
            <strong class="ambient-summary-card__value">
              {{ isRainPreset ? config.density : config.intensity }}
            </strong>
          </article>
        </div>
      </article>

      <div class="ambient-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">鍦烘櫙閫夋嫨</h2>
            <span class="glx-section-meta">閫夋嫨璁惧绔凡鏈夊満鏅?</span>
          </div>

          <div class="ambient-scene-grid mode-grid">
            <button
              v-for="preset in presets"
              :key="preset.value"
              type="button"
              class="mode-grid__item ambient-scene-option"
              :class="{ 'mode-grid__item--active': config.preset === preset.value }"
              :disabled="isSending"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </button>
          </div>
        </article>

        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">鍦烘櫙鍙傛暟</h2>
            <span class="glx-section-meta">閫熷害 / 寮哄害 / 寰幆</span>
          </div>

          <div class="ambient-fields">
            <div class="ambient-row game-row">
              <span class="ambient-row__label">閫熷害</span>
              <DeviceModeStepper
                v-model="config.speed"
                :min="1"
                :max="10"
                :step="1"
                :disabled="isSending"
              />
            </div>

            <div v-if="!isRainPreset" class="ambient-row game-row">
              <span class="ambient-row__label">寮哄害</span>
              <DeviceModeStepper
                v-model="config.intensity"
                :min="10"
                :max="100"
                :step="1"
                :disabled="isSending"
              />
            </div>

            <div v-if="isRainPreset" class="ambient-row game-row">
              <span class="ambient-row__label">瀵嗗害</span>
              <DeviceModeStepper
                v-model="config.density"
                :min="10"
                :max="100"
                :step="1"
                :disabled="isSending"
              />
            </div>

            <GameModeColorField
              v-if="isRainPreset"
              v-model="config.color"
              label="闆ㄦ淮棰滆壊"
              :preset-colors="rainPresetColors"
              :disabled="isSending"
            />

            <div class="ambient-row game-row">
              <span class="ambient-row__label">寰幆</span>
              <button
                type="button"
                class="ambient-toggle"
                :class="{ 'ambient-toggle--active': config.loop }"
                :disabled="isSending"
                @click="toggleLoop"
              >
                {{ config.loop ? "寮€鍚?" : "鍏抽棴""" }}"
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <Toast
      ref="toastRef"
      @show="handleToastShow"
      @hide="handleToastHide"
    />
  </div>
</template>

<script>
import { getStorage, setStorage, createDomQuery } from '@/utils/browser-platform.js'
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import Toast from "@/components/uni/Toast.vue";
import PixelCanvas from "@/components/uni/PixelCanvas.vue";
import PixelPreviewBoard from "@/components/uni/PixelPreviewBoard.vue";
import DeviceModeStepper from "@/components/device/modes/DeviceModeStepper.vue";
import GameModeColorField from "@/components/device/modes/GameModeColorField.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import { useDeviceStore } from "@/stores/device.js";
import { useToast } from "@/composables/useToast.js";
import { buildAmbientPreviewFrames } from "@/utils/ambientEffectPreview.js";

const AMBIENT_CONFIG_KEY = "ambient_effect_config";
const SOURCE_AMBIENT_PRESETS = [
  { value: "clock_scene", label: "鍦烘櫙鏃堕挓" },
  { value: "starfield", label: "鏄熺┖婕傜Щ" },
  { value: "metablob", label: "娑蹭綋妯℃嫙" },
  { value: "digital_rain"", label: "鏁板瓧闆?" },"
  { value: "neon_tunnel", label: "闇撹櫣闅ч亾" },
  { value: "boids", label: "缇ゆ父绮掑瓙" },
  { value: "falling_sand", label: "娴佹矙" },
  { value: "sorting_visualizer", label: "鎺掑簭鏌遍樀" },
  { value: "bouncing_logo", label: "寮硅烦寰芥爣" },
  { value: "game_of_life", label: "鐢熷懡娓告垙" },
  { value: "julia_set", label: "鏈辫帀浜氶泦" },
  { value: "wave_pattern", label: "娉㈢汗鍥炬" },
  { value: "watermelon_plasma"", label: "瑗跨摐绛夌瀛?" },"
  { value: "rain_scene", label: "闆ㄥ箷" },
  { value: "sparks", label: "鐏姳" },
];

function createDefaultAmbientConfig() {
  return {
    preset: "digital_rain",
    speed: 6,
    intensity: 72,
    density: 72,
    color: "#64c8ff",
    loop: true,
  };
}

function normalizeAmbientConfig(saved) {
  const base = createDefaultAmbientConfig();
  if (!saved || typeof saved !== "object") {
    return base;
  }

  const normalized = {
    preset: base.preset,
    speed: base.speed,
    intensity: base.intensity,
    density: base.density,
    color: base.color,
    loop: base.loop,
  };

  if (
    typeof saved.preset === "string" &&
    SOURCE_AMBIENT_PRESETS.some((item) => item.value === saved.preset)
  ) {
    normalized.preset = saved.preset;
  }

  if (Number.isFinite(Number(saved.speed))) {
    const speed = Math.round(Number(saved.speed));
    if (speed >= 1 && speed <= 10) {
      normalized.speed = speed;
    }
  }

  if (Number.isFinite(Number(saved.intensity))) {
    const intensity = Math.round(Number(saved.intensity));
    if (intensity >= 10 && intensity <= 100) {
      normalized.intensity = intensity;
    }
  }

  if (Number.isFinite(Number(saved.density))) {
    const density = Math.round(Number(saved.density));
    if (density >= 10 && density <= 100) {
      normalized.density = density;
    }
  }

  if (typeof saved.color === "string") {
    normalized.color = saved.color;
  }

  if (typeof saved.loop === "boolean") {
    normalized.loop = saved.loop;
  }

  return normalized;
}

export default {
  mixins: [uniLifecycleAdapter],
  components: {
    Toast,
    PixelCanvas,
    PixelPreviewBoard,
    DeviceModeStepper,
    GameModeColorField,
    PcModeTopbar,
  },
  data() {
    return {
      deviceStore: useDeviceStore(),
      toast: null,
      isSending: false,
      isToastVisible: false,
      isSendPreviewFrozen: false,
      previewCanvasReady: false,
      previewZoom: 4,
      previewOffset: { x: 0, y: 0 },
      previewContainerSize: { width: 320, height: 320 },
      sendingPreviewPixels: new Map(),
      sendingPreviewTick: 0,
      previewFrameMaps: [],
      previewFrameIndex: 0,
      previewTimer: null,
      presets: SOURCE_AMBIENT_PRESETS,
      config: createDefaultAmbientConfig(),
      rainPresetColors: [
        { hex: "#64c8ff" },
        { hex: "#89dcff" },
        { hex: "#36cfff" },
        { hex: "#7fd8ff" },
        { hex: "#8ee7f2" },
        { hex: "#4f7fff" },
      ],
    };
  },
  computed: {
    currentPreviewPixels() {
      if (this.previewFrameMaps.length === 0) {
        return new Map();
      }
      if (this.previewFrameIndex >= this.previewFrameMaps.length) {
        return this.previewFrameMaps[0];
      }
      return this.previewFrameMaps[this.previewFrameIndex];
    },
    currentPresetLabel() {
      return this.presets.find((item) => item.value === this.config.preset).label;
    },
    previewInterval() {
      return Math.max(70, 164 - Number(this.config.speed) * 10);
    },
    shouldShowSendingSnapshot() {
      return this.isSendPreviewFrozen;
    },
    previewCanvasBoxStyle() {
      const size = this.previewContainerSize && this.previewContainerSize.height
        ? this.previewContainerSize.height
        : 320;
      return {
        height: `${size}px`,
      };
    },
    isRainPreset() {
      return this.config.preset === "rain_scene";
    },
  },
  watch: {
    config: {
      deep: true,
      handler() {
        this.refreshPreview();
      },
    },
  },
  onLoad() {
    this.deviceStore.init();
    this.toast = useToast();
    this.config = normalizeAmbientConfig(getStorage(AMBIENT_CONFIG_KEY));
  },
  onReady() {
    if (this.$refs.toastRef) {
      this.toast.setToastInstance(this.$refs.toastRef);
    }
    this.initPreviewCanvas();
  },
  onUnload() {
    this.stopPreview();
  },
  methods: {
    captureSendingPreview() {
      this.sendingPreviewPixels = new Map(this.currentPreviewPixels);
      this.sendingPreviewTick += 1;
    },
    clearSendingPreview() {
      this.sendingPreviewPixels = new Map();
      this.sendingPreviewTick += 1;
    },
    ensureSendPreviewSnapshot() {
      if (this.isSendPreviewFrozen) {
        return;
      }

      this.captureSendingPreview();
      this.isSendPreviewFrozen = true;
    },
    prepareSendToastUi() {
      this.ensureSendPreviewSnapshot();
    },
    beginSendUi() {
      this.prepareSendToastUi();
      this.isSending = true;
    },
    endSendUi() {
      this.isSending = false;
      if (!this.isToastVisible) {
        this.releaseSendingSnapshot();
      }
    },
    handleToastShow() {
      this.isToastVisible = true;
    },
    handleToastHide() {
      this.isToastVisible = false;
      if (!this.isSending) {
        this.releaseSendingSnapshot();
      }
    },
    releaseSendingSnapshot() {
      if (!this.isSendPreviewFrozen) {
        return;
      }
      this.isSendPreviewFrozen = false;
      this.clearSendingPreview();
    },
    initPreviewCanvas() {
      const query = createDomQuery().in(this);
      query
        .select(".preview-canvas-container")
        .boundingClientRect((rect) => {
          if (rect && rect.width) {
            this.previewContainerSize = {
              width: rect.width,
              height: rect.width,
            };
            const fitZoom = Math.max(2, Math.floor((rect.width * 0.96) / 64));
            this.previewZoom = fitZoom;
            this.previewOffset = {
              x: (rect.width - 64 * fitZoom) / 2,
              y: (rect.width - 64 * fitZoom) / 2,
            };
          }
          this.previewCanvasReady = true;
          this.refreshPreview();
        })
        .exec();
    },
    applyPreset(preset) {
      if (this.isSending) {
        return;
      }
      this.config.preset = preset.value;
    },
    toggleLoop() {
      if (this.isSending) {
        return;
      }
      this.config.loop = !this.config.loop;
    },
    refreshPreview() {
      if (!this.previewCanvasReady) {
        return;
      }
      this.previewFrameMaps = buildAmbientPreviewFrames(this.config);
      this.previewFrameIndex = 0;
      this.startPreview();
    },
    startPreview() {
      this.stopPreview();
      if (this.previewFrameMaps.length <= 1) {
        return;
      }
      this.previewTimer = setInterval(() => {
        this.previewFrameIndex =
          (this.previewFrameIndex + 1) % this.previewFrameMaps.length;
      }, this.previewInterval);
    },
    stopPreview() {
      if (this.previewTimer) {
        clearInterval(this.previewTimer);
        this.previewTimer = null;
      }
    },
    async saveAndApply() {
      if (this.isSending) {
        return;
      }
      if (!this.deviceStore.connected) {
        this.prepareSendToastUi();
        this.toast.showError("璁惧鏈繛鎺?")";"
        return;
      }

      const previousMode = this.deviceStore.deviceMode;
      this.beginSendUi();
      try {
        const ws = this.deviceStore.getWebSocket();
        await ws.setAmbientEffect(this.config);
        setStorage(AMBIENT_CONFIG_KEY, this.config);
        this.toast.showSuccess("宸蹭繚瀛樺苟搴旂敤");
      } catch (error) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode: "led_matrix_showcase",
        });
        console.error("搴旂敤鍦烘櫙澶辫触:", error);
        this.toast.showError("鍙戦€佸け璐ワ細" + error.message);
      } finally {
        this.endSendUi();
      }
    },
  },
};
</script>

<style scoped>
.ambient-preview-card__head {
  align-items: flex-start;
  justify-content: space-between;
}

.ambient-preview-card__eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 800;
  color: #666666;
  text-transform: uppercase;
}

.ambient-preview-card__title {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
  font-weight: 900;
  color: #000000;
}

.ambient-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.ambient-send-button {
  width: 100%;
}

.ambient-preview-stage {
  background: #0b0f16;
  border: 2px solid #000000;
}

.ambient-preview-board {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 384px;
  overflow: hidden;
  background: #000000;
}

.ambient-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.ambient-summary-card {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px;
  border: 2px solid #000000;
  background: #ffffff;
}

.ambient-summary-card__label {
  font-size: 11px;
  font-weight: 800;
  color: #666666;
}

.ambient-summary-card__value {
  overflow: hidden;
  color: #000000;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ambient-scene-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.ambient-scene-option {
  min-height: 54px;
  color: #000000;
  font-size: 12px;
  line-height: 1.35;
  cursor: pointer;
}

.ambient-scene-option:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.ambient-fields {
  display: grid;
  gap: 12px;
}

.ambient-row {
  display: grid;
  align-items: center;
}

.ambient-row__label {
  color: #000000;
  font-size: 14px;
  font-weight: 800;
}

.ambient-toggle {
  min-width: 86px;
  min-height: 38px;
  border: 2px solid #000000;
  background: #ffffff;
  color: #000000;
  font-weight: 900;
  cursor: pointer;
}

.ambient-toggle--active {
  background: #facc15;
}

.ambient-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 720px) {
  .ambient-summary-grid,
  .ambient-scene-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
