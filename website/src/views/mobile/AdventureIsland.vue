<!-- 冒险岛 1 代 主题预览 (定档无参数模式) -->
<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">冒险岛 1 代</span>
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
            高桥名人冒险岛主题。<br>
            主角踩滑板 / 跳跃 / 投斧子, 自动 AI 无尽奔跑屏保。<br>
            随机生成蜗牛 / 乌鸦 / 野猪 / 蛇 / 石头 / 火堆 / 蛋 / 水果。<br>
            点"发送"上板。
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
import {
  renderAdventureIslandScene,
  createInitialState,
  tickScene,
} from '@/utils/adventureIslandRenderer.js';

export default {
  name: 'AdventureIsland',
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
      const ch = this.sceneState?.character;
      if (!ch || !ch.type) return '';
      const parts = [`状态: ${ch.type}`];
      if (ch.hasAxe) parts.push('持斧');
      if (ch.fairyT > 0) parts.push(`无敌 ${Math.ceil(ch.fairyT / 30)}s`);
      return parts.join(' · ');
    },
    previewCanvasBoxStyle() {
      return { height: `${this.previewContainerSize.height}px` };
    },
  },
  mounted() {
    this.deviceStore = useDeviceStore();
    this.deviceStore.init?.();
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
        // 全部参数用 renderer 默认值, 不传 layoutOpts (定档无参数)
        tickScene(this.sceneState, {});
        this.previewPixels = renderAdventureIslandScene(this.sceneState, {});
        this.previewTick++;
        this.animHandle = setTimeout(tick, 1000 / FPS);
      };
      tick();
    },
    stopLoop() {
      if (this.animHandle) {
        clearTimeout(this.animHandle);
        this.animHandle = null;
      }
    },

    // 发送到设备 - 无参数模式, 板载用预设值跑
    async sendToDevice() {
      if (!this.guardBeforeSend(this.deviceStore.connected)) return;
      this.beginSendUi();
      const previousMode = this.deviceStore.deviceMode;
      try {
        const ws = this.deviceStore.getWebSocket();
        await ws.startAdventureIsland();
        this.showSendSuccess('已应用');
      } catch (err) {
        await this.deviceStore.rollbackBusinessMode?.(previousMode, {
          expectedMode: 'adventure_island',
        });
        console.error('[adventure-island] 发送失败', err);
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
