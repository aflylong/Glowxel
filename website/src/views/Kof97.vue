<template>
  <div class="kof-page glx-page-shell game-mode-page">
    <PcModeTopbar title="拳皇 97" />

    <section class="kof-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack kof-preview-card game-preview-card"
      >
        <div class="kof-preview-card__head">
          <div>
            <p class="kof-preview-card__eyebrow">Device Mode</p>
            <h2 class="kof-preview-card__title">拳皇 97 预览</h2>
          </div>
        </div>

        <div class="kof-preview-toolbar">
          <div class="kof-preview-toolbar__actions">
            <button
              type="button"
              class="glx-button glx-button--primary kof-send-button"
              :disabled="isSending || isLoading || !isSceneReady"
              @click="sendToDevice"
            >
              {{ isSending ? "发送中..." : "发送到设备" }}
            </button>
          </div>
          <span
            class="glx-chip"
            :class="deviceStore && deviceStore.connected ? 'glx-chip--green' : 'glx-chip--yellow'"
          >
            {{ deviceStore && deviceStore.connected ? "已连接" : "未连接" }}
          </span>
        </div>

        <div class="kof-preview-stage game-preview-stage">
          <div class="preview-canvas-container kof-preview-board" :style="previewCanvasBoxStyle">
            <PixelPreviewBoard
              v-if="previewCanvasReady"
              :width="64"
              :height="64"
              :pixels="previewPixels"
              :refresh-token="previewTick"
              :zoom="previewZoom"
              :offset-x="previewOffset.x"
              :offset-y="previewOffset.y"
              :grid-visible="true"
              :is-dark-mode="true"
            />
            <div v-if="isLoading" class="kof-preview-loading">正在加载原始像素数据...</div>
          </div>
        </div>

        <div class="kof-summary-grid">
          <article class="kof-summary-card">
            <span class="kof-summary-card__label">场景状态</span>
            <strong class="kof-summary-card__value">{{ statusText }}</strong>
            <span class="kof-summary-card__meta">预览使用网页端还原的角色像素帧</span>
          </article>
          <article class="kof-summary-card">
            <span class="kof-summary-card__label">当前缩放</span>
            <strong class="kof-summary-card__value">P1 {{ p1ScaleText }} / P2 {{ p2ScaleText }}</strong>
            <span class="kof-summary-card__meta">角色基线 Y：{{ charY }}</span>
          </article>
          <article class="kof-summary-card">
            <span class="kof-summary-card__label">加载状态</span>
            <strong class="kof-summary-card__value">{{ isLoading ? "加载中" : "已就绪" }}</strong>
            <span class="kof-summary-card__meta">{{ isSceneReady ? "可以发送到设备" : "等待场景准备完成" }}</span>
          </article>
        </div>
      </article>

      <div class="kof-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">模式配置</h2>
            <span class="glx-section-meta">调节 / 状态</span>
          </div>
          <DeviceModeTabs v-model="activeTab" :items="tabItems" />
        </article>

        <article
          v-if="activeTab === 'controls'"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">角色调节</h2>
            <span class="glx-section-meta">P1 / P2 缩放与基线位置</span>
          </div>

          <div class="kof-control-stack">
            <label class="kof-control">
              <span class="kof-control__label">P1 缩放 {{ p1ScaleText }}</span>
              <input
                v-model.number="p1Scale"
                class="kof-control__range"
                type="range"
                :min="scaleMin"
                :max="scaleMax"
                :step="scaleStep"
              />
            </label>

            <label class="kof-control">
              <span class="kof-control__label">P2 缩放 {{ p2ScaleText }}</span>
              <input
                v-model.number="p2Scale"
                class="kof-control__range"
                type="range"
                :min="scaleMin"
                :max="scaleMax"
                :step="scaleStep"
              />
            </label>

            <label class="kof-control">
              <span class="kof-control__label">角色 Y {{ charY }}</span>
              <input
                v-model.number="charY"
                class="kof-control__range"
                type="range"
                :min="charYMin"
                :max="charYMax"
                step="1"
              />
            </label>
          </div>
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">当前状态</h2>
            <span class="glx-section-meta">加载 / 角色 / 场景</span>
          </div>

          <div class="glx-kv-grid">
            <div class="glx-kv-card">
              <span class="glx-kv-card__label">状态摘要</span>
              <strong class="glx-kv-card__value">{{ statusText }}</strong>
            </div>
            <div class="glx-kv-card">
              <span class="glx-kv-card__label">连接状态</span>
              <strong class="glx-kv-card__value">{{
                deviceStore && deviceStore.connected ? "已连接" : "未连接"
              }}</strong>
            </div>
            <div class="glx-kv-card">
              <span class="glx-kv-card__label">背景像素</span>
              <strong class="glx-kv-card__value">{{
                Array.isArray(screenBackgroundPixels) ? screenBackgroundPixels.length : 0
              }}</strong>
            </div>
            <div class="glx-kv-card">
              <span class="glx-kv-card__label">角色资源</span>
              <strong class="glx-kv-card__value">{{ stances ? "已加载" : "未加载" }}</strong>
            </div>
          </div>
        </article>
      </div>
    </section>

    <div v-if="isSending" class="glx-device-sending-overlay" @touchmove.stop.prevent>
      <div class="glx-device-sending-card">
        <GlxInlineLoader class="glx-device-sending-spinner" variant="chase" size="lg" />
        <span class="glx-device-sending-title">{{ sendOverlayTitle }}</span>
        <span class="glx-device-sending-tip">{{ sendOverlayTip }}</span>
      </div>
    </div>

    <Toast ref="toastRef" @show="handleToastShow" @hide="handleToastHide" />
  </div>
</template>

<script>
import uniLifecycleAdapter from '@/mixins/uniLifecycleAdapter.js';
import deviceSendUxMixin from '@/mixins/deviceSendUxMixin.js';
import { useDeviceStore } from '@/stores/device.js';
import { useToast } from '@/composables/useToast.js';
import Toast from '@/components/uni/Toast.vue';
import GlxInlineLoader from '@/components/uni/GlxInlineLoader.vue';
import PixelPreviewBoard from '@/components/uni/PixelPreviewBoard.vue';
import PcModeTopbar from '@/components/device/modes/PcModeTopbar.vue';
import DeviceModeTabs from '@/components/device/modes/DeviceModeTabs.vue';
import {
  assignRandomKofPair,
  KOF_CHAR_KEYS,
  KOF97_DEFAULT_CHAR_Y,
  KOF97_SCREEN_RECT,
  createInitialState,
  loadKof97CoverStances,
  refreshKof97Time,
  renderKof97Scene,
} from '@/utils/kof97Renderer.js';

const TIME_REFRESH_INTERVAL_MS = 1000;
const DEFAULT_PREVIEW_SCALE = 0.225;
const PREVIEW_SCALE_MIN = 0.1;
const PREVIEW_SCALE_MAX = 0.3;
const PREVIEW_SCALE_STEP = 0.005;
const CHAR_Y_MIN = 20;
const CHAR_Y_MAX = 48;
const KOF97_BG_PATH = `${import.meta.env.BASE_URL}kof97/bg.png`;

function toHexPart(value) {
  return value.toString(16).padStart(2, '0');
}

function rgbToHex(r, g, b) {
  return `#${toHexPart(r)}${toHexPart(g)}${toHexPart(b)}`;
}

function loadKof97ScreenBackgroundPixels() {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = KOF97_SCREEN_RECT.width;
      canvas.height = KOF97_SCREEN_RECT.height;
      const context = canvas.getContext('2d');
      if (context === null) {
        reject(new Error('Failed to create background canvas context'));
        return;
      }

      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = new Array(canvas.width * canvas.height);
      for (let index = 0; index < pixels.length; index += 1) {
        const offset = index * 4;
        const alpha = imageData.data[offset + 3];
        if (alpha === 0) {
          pixels[index] = null;
          continue;
        }
        pixels[index] = rgbToHex(
          imageData.data[offset],
          imageData.data[offset + 1],
          imageData.data[offset + 2]
        );
      }
      resolve(pixels);
    };
    image.onerror = () => {
      reject(new Error(`Failed to load KOF97 background image: ${KOF97_BG_PATH}`));
    };
    image.src = KOF97_BG_PATH;
  });
}

export default {
  name: 'Kof97',
  mixins: [uniLifecycleAdapter, deviceSendUxMixin],
  components: {
    Toast,
    GlxInlineLoader,
    PixelPreviewBoard,
    PcModeTopbar,
    DeviceModeTabs,
  },
  data() {
    return {
      deviceStore: null,
      toast: null,
      sceneState: null,
      stances: null,
      screenBackgroundPixels: null,
      previewPixels: new Map(),
      previewTick: 0,
      previewCanvasReady: false,
      previewZoom: 4,
      previewOffset: { x: 16, y: 16 },
      previewContainerSize: { width: 320, height: 320 },
      timeHandle: null,
      isLoading: true,
      p1Scale: DEFAULT_PREVIEW_SCALE,
      p2Scale: DEFAULT_PREVIEW_SCALE,
      charY: KOF97_DEFAULT_CHAR_Y,
      scaleMin: PREVIEW_SCALE_MIN,
      scaleMax: PREVIEW_SCALE_MAX,
      scaleStep: PREVIEW_SCALE_STEP,
      charYMin: CHAR_Y_MIN,
      charYMax: CHAR_Y_MAX,
      activeTab: 'controls',
      tabItems: [
        { value: 'controls', label: '调节' },
        { value: 'status', label: '状态' },
      ],
    };
  },
  computed: {
    isSceneReady() {
      return !!this.sceneState && !!this.stances && Array.isArray(this.screenBackgroundPixels);
    },
    statusText() {
      if (this.isLoading) {
        return '正在加载角色数据';
      }
      if (!this.sceneState) {
        return '预览未启动';
      }
      const p1Key = KOF_CHAR_KEYS[this.sceneState.selectP1] || '-';
      const p2Key = KOF_CHAR_KEYS[this.sceneState.selectP2] || '-';
      return `P1: ${p1Key} ${this.p1ScaleText}  P2: ${p2Key} ${this.p2ScaleText}  Y: ${this.charY}`;
    },
    p1ScaleText() {
      return `${Math.round(this.p1Scale * 1000) / 10}%`;
    },
    p2ScaleText() {
      return `${Math.round(this.p2Scale * 1000) / 10}%`;
    },
    previewCanvasBoxStyle() {
      return { height: `${this.previewContainerSize.height}px` };
    },
  },
  watch: {
    p1Scale() {
      this.renderPreview();
    },
    p2Scale() {
      this.renderPreview();
    },
    charY() {
      this.renderPreview();
    },
  },
  async mounted() {
    this.deviceStore = useDeviceStore();
    this.deviceStore.init?.();
    this.toast = useToast();

    this.$nextTick(async () => {
      if (this.$refs.toastRef) {
        this.toast.setToastInstance(this.$refs.toastRef);
      }
      this.sceneState = createInitialState();
      assignRandomKofPair(this.sceneState);
      this.previewCanvasReady = true;
      this.initPreviewCanvas();

      try {
        const selectedCharKeys = [
          KOF_CHAR_KEYS[this.sceneState.selectP1],
          KOF_CHAR_KEYS[this.sceneState.selectP2],
        ];
        const [stances, screenBackgroundPixels] = await Promise.all([
          loadKof97CoverStances(selectedCharKeys),
          loadKof97ScreenBackgroundPixels(),
        ]);
        this.stances = stances;
        this.screenBackgroundPixels = screenBackgroundPixels;
        this.renderPreview();
        this.startClock();
      } catch (error) {
        console.error('[kof97] load failed', error);
        this.showSendFailure(error);
      } finally {
        this.isLoading = false;
      }
    });
  },
  beforeUnmount() {
    this.stopClock();
  },
  beforeDestroy() {
    this.stopClock();
  },
  methods: {
    initPreviewCanvas() {
      this.$nextTick(() => {
        setTimeout(() => {
          const query = uni.createSelectorQuery().in(this);
          query
            .select('.preview-canvas-container')
            .boundingClientRect((data) => {
              if (data && data.width > 0) {
                this.previewContainerSize = { width: data.width, height: data.width };
                const fitZoom = Math.max(2, Math.floor((data.width * 0.96) / 64));
                this.previewZoom = fitZoom;
                this.previewOffset = {
                  x: (data.width - 64 * fitZoom) / 2,
                  y: (data.width - 64 * fitZoom) / 2,
                };
              }
            })
            .exec();
        }, 80);
      });
    },
    renderPreview() {
      if (!this.sceneState || !this.stances || !Array.isArray(this.screenBackgroundPixels)) {
        return;
      }
      this.previewPixels = renderKof97Scene(this.sceneState, {
        stances: this.stances,
        backgroundPixels: this.screenBackgroundPixels,
        charY: this.charY,
        p1Scale: this.p1Scale,
        p2Scale: this.p2Scale,
      });
      this.previewTick += 1;
    },
    startClock() {
      this.stopClock();
      this.timeHandle = setInterval(() => {
        if (!this.sceneState) {
          return;
        }
        refreshKof97Time(this.sceneState);
        this.renderPreview();
      }, TIME_REFRESH_INTERVAL_MS);
    },
    stopClock() {
      if (this.timeHandle) {
        clearInterval(this.timeHandle);
        this.timeHandle = null;
      }
    },
    async sendToDevice() {
      if (!this.isSceneReady) {
        return;
      }
      if (!this.guardBeforeSend(this.deviceStore.connected)) {
        return;
      }
      this.beginSendUi();
      try {
        const ws = this.deviceStore.getWebSocket();
        await ws.startKof97();
        this.showSendSuccess('已应用');
      } catch (error) {
        console.error('[kof97] send failed', error);
        this.showSendFailure(error);
      } finally {
        this.endSendUi();
      }
    },
  },
};
</script>

<style scoped>
.kof-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.kof-layout {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.kof-preview-card {
  gap: 16px;
}

.kof-preview-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.kof-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.kof-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.kof-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.kof-preview-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.kof-send-button {
  min-width: 188px;
  min-height: 48px;
}

.kof-preview-stage {
  padding: 18px;
}

.preview-canvas-container {
  width: min(100%, 560px);
  position: relative;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid #000000;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 52%),
    #000000;
}

.kof-preview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f2f2f2;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.5);
}

.kof-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.kof-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.kof-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.kof-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  line-height: 1.35;
  color: #000000;
}

.kof-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.kof-control-stack {
  display: grid;
  gap: 18px;
}

.kof-control {
  display: grid;
  gap: 10px;
}

.kof-control__label {
  font-size: 14px;
  font-weight: 800;
  color: #000000;
}

.kof-control__range {
  width: 100%;
}

@media (max-width: 920px) {
  .kof-layout,
  .kof-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .kof-preview-toolbar__actions {
    width: 100%;
  }

  .kof-send-button {
    min-width: 0;
    flex: 1 1 auto;
  }
}
</style>
