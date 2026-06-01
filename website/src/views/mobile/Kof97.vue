<!-- KOF '97 选人界面 + 像素电视机外壳预览 (定档无参数模式) -->
<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">拳皇 97</span>
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
      </div>
      <div class="preview-caption glx-preview-panel">
        <div class="preview-caption-info glx-preview-panel__info">
          <span class="preview-caption-title">模拟预览</span>
          <span class="preview-caption-sub">{{ statusText }}</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending }"
            @click="sendToDevice"
          >
            <Icon name="link" :size="36" color="#000000" />
            <span>发送</span>
          </div>
        </div>
      </div>
    </div>

    <div data-scroll-view scroll-y class="content glx-scroll-region glx-page-shell__content">
      <div class="content-wrapper glx-scroll-stack">
        <div class="card glx-panel-card glx-editor-card">
          <div class="card-title-section glx-panel-head">
            <span class="glx-panel-title">说明</span>
          </div>
          <p style="font-size: 24rpx; line-height: 1.6; padding: 12rpx 0;">
            上半 = 头像区 7×2 (14 个角色) + 屏幕中部 stance 待机动画。<br>
            下半 = 像素电视壳 + 老式绿色时间显示。<br>
            P1 在左侧 (镜像朝右), P2 在右侧 (默认朝左)。<br>
            每 5 秒随机切换 P1/P2。点"发送"上板。
          </p>
        </div>
      </div>
    </div>

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
import statusBarMixin from '@/mixins/statusBar.js';
import deviceSendUxMixin from '@/mixins/deviceSendUxMixin.js';
import { useDeviceStore } from '@/stores/device.js';
import { useToast } from '@/composables/useToast.js';
import Icon from '@/components/uni/Icon.vue';
import Toast from '@/components/uni/Toast.vue';
import GlxInlineLoader from '@/components/uni/GlxInlineLoader.vue';
import PixelPreviewBoard from '@/components/uni/PixelPreviewBoard.vue';
import { renderKof97Scene, createInitialState, tickScene } from '@/utils/kof97Renderer.js';

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
      previewPixels: new Map(),
      previewTick: 0,
      previewCanvasReady: false,
      previewZoom: 4,
      previewOffset: { x: 16, y: 16 },
      previewContainerSize: { width: 320, height: 320 },
      animHandle: null,
    };
  },
  computed: {
    statusText() {
      if (!this.sceneState) return '';
      return `P1: ${this.sceneState.selectP1}  P2: ${this.sceneState.selectP2}`;
    },
    previewCanvasBoxStyle() {
      return { height: `${this.previewContainerSize.height}px` };
    },
  },
  mounted() {
    this.deviceStore = useDeviceStore();
    this.deviceStore.init();
    this.toast = useToast();

    this.$nextTick(() => {
      if (this.$refs.toastRef) this.toast.setToastInstance(this.$refs.toastRef);
      this.sceneState = createInitialState();
      this.previewCanvasReady = true;
      this.startLoop();
      this.initPreviewCanvas();
    });
  },
  beforeUnmount() { this.stopLoop(); },
  beforeDestroy() { this.stopLoop(); },
  methods: {
    handleBack() {
      try { this.$router.back(); } catch (e) { window.history.back(); }
    },
    initPreviewCanvas() {
      this.$nextTick(() => {
        setTimeout(() => {
          const query = uni.createSelectorQuery().in(this);
          query.select('.preview-canvas-container').boundingClientRect((data) => {
            if (data && data.width > 0) {
              this.previewContainerSize = { width: data.width, height: data.width };
              const fitZoom = Math.max(2, Math.floor((data.width * 0.96) / 64));
              this.previewZoom = fitZoom;
              this.previewOffset = {
                x: (data.width - 64 * fitZoom) / 2,
                y: (data.width - 64 * fitZoom) / 2,
              };
            }
          }).exec();
        }, 80);
      });
    },
    startLoop() {
      const FPS = 30;
      const tick = () => {
        if (!this.sceneState) return;
        tickScene(this.sceneState);
        this.previewPixels = renderKof97Scene(this.sceneState);
        this.previewTick++;
        this.animHandle = setTimeout(tick, 1000 / FPS);
      };
      tick();
    },
    stopLoop() {
      if (this.animHandle) { clearTimeout(this.animHandle); this.animHandle = null; }
    },

    // 发送到设备 - 无参数模式, 板载用预设值跑
    async sendToDevice() {
      if (!this.guardBeforeSend(this.deviceStore.connected)) return;
      this.beginSendUi();
      try {
        const ws = this.deviceStore.getWebSocket();
        if (typeof ws.startKof97 === 'function') {
          await ws.startKof97();
          this.showSendSuccess('已应用');
        } else {
          if (this.toast) this.toast.showInfo('板载暂未上线, 当前仅本地预览');
        }
      } catch (err) {
        console.error('[kof97] 发送失败', err);
        this.showSendFailure(err);
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
.status-bar { width: 100%; }
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
.preview-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 16rpx 12rpx;
  background: var(--bg-tertiary, #fafafa);
}
.preview-caption-info { display: flex; flex-direction: column; gap: 4rpx; }
.preview-caption-title { font-size: 24rpx; font-weight: 700; color: var(--text-primary); }
.preview-caption-sub { font-size: 22rpx; color: var(--text-secondary); }
.preview-actions { display: flex; gap: 12rpx; }

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
</style>
