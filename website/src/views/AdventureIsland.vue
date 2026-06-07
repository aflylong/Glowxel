<!-- 冒险岛 1 代 主题预览 (定档无参数模式) -->
<template>
  <div class="adventure-page glx-page-shell game-mode-page">
    <PcModeTopbar title="冒险岛 1 代" />

    <section class="adventure-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack adventure-preview-card game-preview-card"
      >
        <div class="adventure-preview-card__head">
          <div>
            <p class="adventure-preview-card__eyebrow">Device Mode</p>
            <h2 class="adventure-preview-card__title">冒险岛预览</h2>
          </div>
        </div>

        <div class="adventure-preview-toolbar">
          <div class="adventure-preview-toolbar__actions">
            <button
              type="button"
              class="glx-button glx-button--primary adventure-send-button"
              :disabled="isSending"
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

        <div class="adventure-preview-stage game-preview-stage">
          <div
            class="preview-canvas-container adventure-preview-board"
            :style="previewCanvasBoxStyle"
          >
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
        </div>

        <div class="adventure-summary-grid">
          <article class="adventure-summary-card">
            <span class="adventure-summary-card__label">角色状态</span>
            <strong class="adventure-summary-card__value">{{ statusText || "--" }}</strong>
            <span class="adventure-summary-card__meta">静态预览沿用板载布局常量</span>
          </article>
          <article class="adventure-summary-card">
            <span class="adventure-summary-card__label">画布尺寸</span>
            <strong class="adventure-summary-card__value">64 x 64</strong>
            <span class="adventure-summary-card__meta">像素预览与设备模式一致</span>
          </article>
        </div>
      </article>

      <div class="adventure-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">模式配置</h2>
            <span class="glx-section-meta">说明 / 状态</span>
          </div>
          <DeviceModeTabs v-model="activeTab" :items="tabItems" />
        </article>

        <article
          v-if="activeTab === 'intro'"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">模式说明</h2>
            <span class="glx-section-meta">固定主题屏保</span>
          </div>

          <div class="adventure-note-grid">
            <div class="adventure-note-card">
              <strong>主题内容</strong>
              <p>高桥名人冒险岛主题，主角会踩滑板、跳跃、投斧子并自动奔跑。</p>
            </div>
            <div class="adventure-note-card">
              <strong>场景元素</strong>
              <p>随机生成蜗牛、乌鸦、野猪、蛇、石头、火堆、蛋和水果。</p>
            </div>
          </div>
        </article>

        <article v-else class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">当前状态</h2>
            <span class="glx-section-meta">预览摘要</span>
          </div>

          <div class="glx-kv-grid">
            <div class="glx-kv-card">
              <span class="glx-kv-card__label">角色状态</span>
              <strong class="glx-kv-card__value">{{ statusText || "--" }}</strong>
            </div>
            <div class="glx-kv-card">
              <span class="glx-kv-card__label">连接状态</span>
              <strong class="glx-kv-card__value">{{
                deviceStore && deviceStore.connected ? "已连接" : "未连接"
              }}</strong>
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
  renderAdventureIslandScene,
  createInitialState,
  tickScene,
} from '@/utils/adventureIslandRenderer.js';

export default {
  name: 'AdventureIsland',
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
      previewPixels: new Map(),
      previewTick: 0,
      previewCanvasReady: false,
      previewZoom: 4,
      previewOffset: { x: 16, y: 16 },
      previewContainerSize: { width: 320, height: 320 },
      animHandle: null,
      activeTab: 'intro',
      tabItems: [
        { value: 'intro', label: '说明' },
        { value: 'status', label: '状态' },
      ],
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
  beforeUnmount() {
    this.stopLoop();
  },
  beforeDestroy() {
    this.stopLoop();
  },
  methods: {
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
      this.previewTick += 1;
    },
    stopLoop() {
      if (this.animHandle) {
        clearTimeout(this.animHandle);
        this.animHandle = null;
      }
    },
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
.adventure-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.adventure-layout {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.adventure-preview-card {
  gap: 16px;
}

.adventure-preview-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.adventure-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.adventure-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.adventure-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.adventure-preview-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.adventure-send-button {
  min-width: 188px;
  min-height: 48px;
}

.adventure-preview-stage {
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

.adventure-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.adventure-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.adventure-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.adventure-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  line-height: 1.35;
  color: #000000;
}

.adventure-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.adventure-note-grid {
  display: grid;
  gap: 12px;
}

.adventure-note-card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.adventure-note-card strong {
  font-size: 14px;
  font-weight: 900;
  color: #000000;
}

.adventure-note-card p {
  margin: 0;
  color: var(--glx-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 920px) {
  .adventure-layout,
  .adventure-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .adventure-preview-toolbar__actions {
    width: 100%;
  }

  .adventure-send-button {
    min-width: 0;
    flex: 1 1 auto;
  }
}
</style>
