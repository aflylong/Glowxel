<template>
  <view class="minecraft-page glx-page-shell">
    <!-- #ifdef MP-WEIXIN -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <!-- #endif -->

    <view class="navbar glx-topbar glx-page-shell__fixed">
      <view class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </view>
      <text class="nav-title glx-topbar__title">我的世界时钟</text>
      <view class="nav-right"></view>
    </view>

    <view class="canvas-section">
      <view class="preview-canvas-container" :style="previewCanvasBoxStyle">
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
      </view>
      <view class="preview-caption glx-preview-panel">
        <view class="preview-caption-info glx-preview-panel__info">
          <text class="preview-title">模拟预览</text>
        </view>
        <view class="preview-actions">
          <view
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending }"
            @click="sendToDevice"
          >
            <Icon name="link" :size="36" color="#000000" />
            <text>发送</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="content glx-scroll-region glx-page-shell__content"
      :style="{ height: contentHeight }"
    >
      <view class="content-wrapper glx-scroll-stack">
        <view class="settings-card">
          <view class="setting-item-row">
            <text class="setting-label">镐子类型</text>
            <view class="setting-control-buttons" style="gap:8rpx">
              <view
                v-for="pick in pickaxeOptions"
                :key="pick.id"
                class="weapon-btn"
                :class="{ active: config.pickaxe === pick.id }"
                style="padding:6rpx 16rpx"
                @click="config.pickaxe = pick.id"
              >
                <text>{{ pick.name }}</text>
              </view>
            </view>
          </view>

          <view class="setting-item-row">
            <text class="setting-label">方块风格</text>
            <view class="setting-control-buttons" style="gap:8rpx">
              <view
                v-for="style in blockStyleOptions"
                :key="style.id"
                class="weapon-btn"
                :class="{ active: config.blockStyle === style.id }"
                style="padding:6rpx 16rpx"
                @click="config.blockStyle = style.id"
              >
                <text>{{ style.name }}</text>
              </view>
            </view>
          </view>

          <view class="setting-item-row">
            <text class="setting-label">时间格式</text>
            <view class="setting-control-buttons" style="gap:8rpx">
              <view class="weapon-btn" :class="{ active: config.hourFormat === 24 }" style="padding:6rpx 16rpx" @click="config.hourFormat = 24"><text>24h</text></view>
              <view class="weapon-btn" :class="{ active: config.hourFormat === 12 }" style="padding:6rpx 16rpx" @click="config.hourFormat = 12"><text>12h</text></view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="isSending" class="glx-device-sending-overlay" @touchmove.stop.prevent>
      <view class="glx-device-sending-card">
        <GlxInlineLoader class="glx-device-sending-spinner" variant="chase" size="lg" />
        <text class="glx-device-sending-title">{{ sendOverlayTitle }}</text>
        <text class="glx-device-sending-tip">{{ sendOverlayTip }}</text>
      </view>
    </view>

    <Toast ref="toastRef" @show="handleToastShow" @hide="handleToastHide" />
  </view>
</template>

<script>
import { useDeviceStore } from "../../store/device.js";
import { useToast } from "../../composables/useToast.js";
import statusBarMixin from "../../mixins/statusBar.js";
import deviceSendUxMixin from "../../mixins/deviceSendUxMixin.js";
import Icon from "../../components/Icon.vue";
import Toast from "../../components/Toast.vue";
import GlxInlineLoader from "../../components/GlxInlineLoader.vue";
import PixelPreviewBoard from "../../components/PixelPreviewBoard.vue";

export default {
  mixins: [statusBarMixin, deviceSendUxMixin],
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
      contentHeight: "calc(100vh - 88rpx - 520rpx)",
      previewCanvasReady: false,
      previewZoom: 4,
      previewOffset: { x: 16, y: 16 },
      previewContainerSize: { width: 320, height: 320 },
      previewPixels: new Map(),
      previewTick: 0,
      previewTimer: null,

      config: {
        pickaxe: "iron",
        blockStyle: "random",
        hourFormat: 24,
      },

      pickaxeOptions: [
        { id: "wood", name: "木镐" },
        { id: "stone", name: "石镐" },
        { id: "iron", name: "铁镐" },
        { id: "diamond", name: "钻石镐" },
        { id: "netherite", name: "下界合金镐" },
      ],

      blockStyleOptions: [
        { id: "random", name: "随机" },
        { id: "oak", name: "橡木" },
        { id: "stone", name: "石头" },
        { id: "diamond", name: "钻石" },
        { id: "gold", name: "金块" },
        { id: "emerald", name: "绿宝石" },
      ],
    };
  },
  computed: {
    previewCanvasBoxStyle() {
      const size = this.previewContainerSize?.height || 320;
      return { height: `${size}px` };
    },
  },
  onLoad() {
    this.deviceStore = useDeviceStore();
    this.deviceStore.init();
    this.toast = useToast();

    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const headerHeight = 56;
    this.contentHeight = `${systemInfo.windowHeight - statusBarHeight - headerHeight - 360}px`;
  },
  onReady() {
    if (this.$refs.toastRef) {
      this.toast.setToastInstance(this.$refs.toastRef);
    }
    this.initPreviewCanvas();
  },
  onHide() {
    this.stopPreview();
  },
  onUnload() {
    this.stopPreview();
  },
  methods: {
    handleBack() {
      uni.navigateBack();
    },
    initPreviewCanvas() {
      const systemInfo = uni.getSystemInfoSync();
      this.$nextTick(() => {
        setTimeout(() => {
          const query = uni.createSelectorQuery().in(this);
          query
            .select(".preview-canvas-container")
            .boundingClientRect((data) => {
              if (!data || !data.width) {
                this.previewCanvasReady = true;
                return;
              }
              const fitZoom = Math.max(2, Math.floor((data.width * 0.96) / 64));
              this.previewContainerSize = {
                width: data.width,
                height: data.width,
              };
              this.previewZoom = fitZoom;
              this.previewOffset = {
                x: (data.width - 64 * fitZoom) / 2,
                y: (data.width - 64 * fitZoom) / 2,
              };
              this.previewCanvasReady = true;
              this.startPreview();
            })
            .exec();
        }, 80);
      });
    },
    startPreview() {
      // TODO: 启动 Minecraft 时钟预览动画循环
      this.renderStaticPreview();
    },
    stopPreview() {
      if (this.previewTimer) {
        clearTimeout(this.previewTimer);
        this.previewTimer = null;
      }
    },
    renderStaticPreview() {
      // TODO: 渲染静态预览帧（背景 + Steve + 时间方块）
      const map = new Map();
      // 临时：画一个绿色地面示意
      for (let x = 0; x < 64; x++) {
        for (let y = 46; y < 48; y++) {
          map.set(`${x},${y}`, "#7cbd6b"); // 草地
        }
        for (let y = 48; y < 56; y++) {
          map.set(`${x},${y}`, "#866043"); // 泥土
        }
        for (let y = 56; y < 64; y++) {
          map.set(`${x},${y}`, "#7f7f7f"); // 石头
        }
      }
      // 天空
      for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 46; y++) {
          const t = y / 45;
          const r = Math.round(135 + t * 30);
          const g = Math.round(206 + t * 20);
          const b = Math.round(250 - t * 10);
          map.set(`${x},${y}`, `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`);
        }
      }
      this.previewPixels = map;
      this.previewTick++;
    },
    async sendToDevice() {
      if (!this.guardBeforeSend(this.deviceStore.connected)) return;
      // TODO: 实现发送到设备
      this.toast.showInfo("Minecraft 时钟开发中，暂不支持发送");
    },
  },
};
</script>

<style scoped>
.minecraft-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  overflow: hidden;
}

.status-bar {
  background-color: #1a1a1a;
}

.preview-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.content {
  flex: 1;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: var(--bg-tertiary);
  padding: 16rpx 20rpx 0;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 26rpx;
  padding-bottom: calc(44rpx + env(safe-area-inset-bottom));
}

.settings-card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.setting-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72rpx;
}

.setting-label {
  font-size: 26rpx;
  color: var(--text-primary);
  font-weight: 600;
}

.setting-control-buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.weapon-btn {
  border: 2rpx solid var(--border-secondary);
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
  background: var(--bg-secondary);
  transition: all 0.15s;
}

.weapon-btn.active {
  border-color: var(--nb-ink);
  background: var(--nb-ink);
}

.weapon-btn.active text {
  color: #ffffff;
}

.weapon-btn text {
  font-size: 22rpx;
  color: var(--text-secondary);
}
</style>
