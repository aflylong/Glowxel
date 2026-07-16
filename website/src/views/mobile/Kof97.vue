<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">鎷崇殗 97</span>
      <div class="nav-right"></div>
    </div>

    <div class="canvas-section">
      <div class="preview-canvas-container" :style="previewCanvasBoxStyle">
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
        <div v-if="isLoading" class="preview-loading">姝ｅ湪鍔犺浇鍘熷鍍忕礌鏁版嵁...</div>
      </div>

      <div class="preview-caption glx-preview-panel">
        <div class="preview-caption-info glx-preview-panel__info">
          <span class="preview-caption-title">缃戦〉棰勮</span>
          <!-- <span class="preview-caption-sub">{{ statusText }}</span> -->
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending || isLoading || !isSceneReady }"
            @click="sendToDevice"
          >
            <Icon name="link" :size="36" color="#000000" />
            <span>鍙戦€?</span>
          </div>
        </div>
      </div>
    </div>
<!-- 
    <div data-scroll-view scroll-y class="content glx-scroll-region glx-page-shell__content">
      <div class="content-wrapper glx-scroll-stack">
        <div class="card glx-panel-card glx-editor-card">
          <div class="card-title-section glx-panel-head">
            <span class="glx-panel-title">璇存槑</span>
          </div>
          <p class="desc-text">
            褰撳墠缃戦〉绔姞杞藉師濮嬭鑹插抚鍍忕礌锛岄〉闈㈣В鍖呭熀鍑嗗抚鍜屽樊寮傚抚鍚庡啀鎸変笅闈㈢殑姣斾緥鎶曞奖鍒?64x64 棰勮閲屻€?
            杩欓噷涓嶄細鎶婃瘡涓€甯ф彁鍓嶅帇鎴愬悓涓€涓楂橈紝鏂逛究缁х画纭瑙掕壊澶у皬銆佽剼搴曚綅缃拰鍔ㄤ綔鑺傚銆?
          </p>
          <div class="scale-controls">
            <label class="scale-control">
              <span class="scale-control__label">P1 缂╂斁 {{ p1ScaleText }}</span>
              <input
                v-model.number="p1Scale"
                class="scale-control__range"
                type="range"
                :min="scaleMin"
                :max="scaleMax"
                :step="scaleStep"
              />
            </label>
            <label class="scale-control">
              <span class="scale-control__label">P2 缂╂斁 {{ p2ScaleText }}</span>
              <input
                v-model.number="p2Scale"
                class="scale-control__range"
                type="range"
                :min="scaleMin"
                :max="scaleMax"
                :step="scaleStep"
              />
            </label>
            <label class="scale-control">
              <span class="scale-control__label">瑙掕壊 Y {{ charY }}</span>
              <input
                v-model.number="charY"
                class="scale-control__range"
                type="range"
                :min="charYMin"
                :max="charYMax"
                step="1"
              />
            </label>
          </div>
        </div>
      </div>
    </div> -->

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
import { createDomQuery } from '@/utils/browser-platform.js'
import uniLifecycleAdapter from '@/mixins/uniLifecycleAdapter.js';
import statusBarMixin from '@/mixins/statusBar.js';
import deviceSendUxMixin from '@/mixins/deviceSendUxMixin.js';
import { useDeviceStore } from '@/stores/device.js';
import { useToast } from '@/composables/useToast.js';
import Icon from '@/components/uni/Icon.vue';
import Toast from '@/components/uni/Toast.vue';
import GlxInlineLoader from '@/components/uni/GlxInlineLoader.vue';
import PixelPreviewBoard from '@/components/uni/PixelPreviewBoard.vue';
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
  mixins: [uniLifecycleAdapter, statusBarMixin, deviceSendUxMixin],
  components: {
    Icon,
    Toast,
    GlxInlineLoader,
    PixelPreviewBoard,
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
    };
  },
  computed: {
    isSceneReady() {
      return !!this.sceneState && !!this.stances && Array.isArray(this.screenBackgroundPixels);
    },
    statusText() {
      if (this.isLoading) {
        return '姝ｅ湪鍔犺浇瑙掕壊鏁版嵁';
      }
      if (!this.sceneState) {
        return '棰勮鏈惎鍔?;
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
    handleBack() {
      try {
        this.$router.back();
      } catch (error) {
        window.history.back();
      }
    },
    initPreviewCanvas() {
      this.$nextTick(() => {
        setTimeout(() => {
          const query = createDomQuery().in(this);
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
        this.showSendSuccess('宸插簲鐢?);
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
.clock-editor-page {
  background-color: var(--bg-secondary);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.status-bar {
  width: 100%;
}

.canvas-section {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #000;
}

.preview-canvas-container {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
}

.preview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f2f2f2;
  font-size: 24rpx;
  background: rgba(0, 0, 0, 0.5);
}

.preview-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  padding: 10rpx 16rpx 12rpx;
  background: var(--bg-tertiary, #fafafa);
}

.preview-caption-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

.preview-caption-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-caption-sub {
  font-size: 22rpx;
  color: var(--text-secondary);
  word-break: break-all;
}

.preview-actions {
  display: flex;
  gap: 12rpx;
  flex-shrink: 0;
}

.content {
  flex: 1;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 16rpx 20rpx 0;
  background: var(--bg-tertiary);
}

.content-wrapper {
  padding: 0 0 calc(56rpx + var(--layout-bottom-offset, 0px));
}

.desc-text {
  font-size: 24rpx;
  line-height: 1.65;
  color: var(--text-secondary);
  padding: 12rpx 0;
}

.scale-controls {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  padding: 12rpx 0 4rpx;
}

.scale-control {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.scale-control__label {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.scale-control__range {
  width: 100%;
}
</style>
