<!-- 鍐掗櫓宀?1 浠?涓婚棰勮 (瀹氭。鏃犲弬鏁版ā寮? -->
<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">鍐掗櫓宀?1 浠?</span>
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
          <span class="preview-caption-title">妯℃嫙棰勮</span>
          <span class="preview-caption-sub">{{ statusText }}</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending }"
            @click="sendToDevice"
          >
            <Icon name="link" :size="36" color="#000000" />
            <span>鍙戦€?</span>
          </div>
        </div>
      </div>
    </div>

    <div data-scroll-view scroll-y class="content glx-scroll-region glx-page-shell__content">
      <div class="content-wrapper glx-scroll-stack">
        <div class="card glx-panel-card glx-editor-card">
          <div class="card-title-section glx-panel-head">
            <span class="glx-panel-title">璇存槑</span>
          </div>
          <p style="font-size: 24rpx; line-height: 1.6; padding: 12rpx 0;">
            楂樻ˉ鍚嶄汉鍐掗櫓宀涗富棰樸€?br>
            涓昏韪╂粦鏉?/ 璺宠穬 / 鎶曟枾瀛? 鑷姩 AI 鏃犲敖濂旇窇灞忎繚銆?br>
            闅忔満鐢熸垚铚楃墰 / 涔岄甫 / 閲庣尓 / 铔?/ 鐭冲ご / 鐏爢 / 铔?/ 姘存灉銆?br>
            鐐?鍙戦€?涓婃澘銆?
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
      const parts = [`鐘舵€? ${ch.type}`];
      if (ch.hasAxe) parts.push('鎸佹枾');
      if (ch.fairyT > 0) parts.push(`鏃犳晫 ${Math.ceil(ch.fairyT / 30)}s`);
      return parts.join(' 路 ');
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
          const query = createDomQuery().in(this);
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
      // 闈欐€佷竴甯? 璺戜竴娆?tick + render 鎷垮埌鐢婚潰, 涓嶅啀寰幆
      // 鏉胯浇甯搁噺 (璺?esp32-firmware/src/adventure_island_effect.cpp 涓€鑷?
      const layoutOpts = {
        bgYOffset: -12,
        charX: 6,
        groundY: 59,
        obstacleScale: 0.73,
        itemScale: 0.73,
        showClock: true,
        clockX: 13,
        clockY: 2,
        clockSpacing: 1,
        clockColonGap: 2,
        axeAnimSpeed: 3,
        crowYOffset: 36,
        fruitAirY: 36,
        fairyOffsetX: -14,
        fairyOffsetY: 41,
      };
      const tickOpts = {
        bgSpeed: 0.5,
        entSpeed: 0.6,
        jumpHeight: 21,
        autoMode: true,
        charX: 6,
        spawnInterval: 150,
        spawnJitter: 0,
        eggCooldownFrames: 1500,
        crowYOffset: 36,
        axeSpeed: 2,
        reachFactor: null,
        throwDist: 32,
        throwRange: 16,
        crowJumpDist: 40,
        crowJumpRange: 12,
      };
      tickScene(this.sceneState, tickOpts);
      this.previewPixels = renderAdventureIslandScene(this.sceneState, layoutOpts);
      this.previewTick++;
    },
    stopLoop() { /* 闈欐€佸抚鏃犲惊鐜? 涓嶉渶瑕?stop */ },
    stopLoop() {
      if (this.animHandle) {
        clearTimeout(this.animHandle);
        this.animHandle = null;
      }
    },

    // 鍙戦€佸埌璁惧 - 鏃犲弬鏁版ā寮? 鏉胯浇鐢ㄩ璁惧€艰窇
    async sendToDevice() {
      if (!this.guardBeforeSend(this.deviceStore.connected)) return;
      this.beginSendUi();
      const previousMode = this.deviceStore.deviceMode;
      try {
        const ws = this.deviceStore.getWebSocket();
        await ws.startAdventureIsland();
        this.showSendSuccess('宸插簲鐢?);
      } catch (err) {
        await this.deviceStore.rollbackBusinessMode?.(previousMode, {
          expectedMode: 'adventure_island',
        });
        console.error('[adventure-island] 鍙戦€佸け璐?, err);
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
