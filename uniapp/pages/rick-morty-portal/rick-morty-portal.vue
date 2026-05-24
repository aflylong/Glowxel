<template>
  <view class="portal-page glx-page-shell">
    <!-- #ifdef MP-WEIXIN -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    <!-- #endif -->

    <view class="navbar glx-topbar glx-page-shell__fixed">
      <view class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </view>
      <text class="nav-title glx-topbar__title">传送门</text>
      <view class="nav-right"></view>
    </view>

    <view class="canvas-section">
      <view class="preview-canvas-container" :style="previewCanvasBoxStyle">
        <PixelCanvas
          v-if="previewCanvasReady && !shouldShowSendingSnapshot"
          :width="64"
          :height="64"
          :pixels="currentPreviewPixels"
          :refresh-token="previewRefreshTick"
          :zoom="previewZoom"
          :offset-x="previewOffset.x"
          :offset-y="previewOffset.y"
          :canvas-width="previewContainerSize.width"
          :canvas-height="previewContainerSize.height"
          :grid-visible="true"
          :is-dark-mode="true"
          :touch-enabled="false"
          canvas-id="rickMortyPortalPreviewCanvas"
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
      </view>
      <view class="preview-caption glx-preview-panel">
        <view class="preview-caption-info glx-preview-panel__info">
          <text class="preview-title">预览效果</text>
        </view>
        <view class="preview-actions">
          <view
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending }"
            @click="handleSend"
          >
            <Icon name="link" :size="36" color="var(--nb-ink)" />
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
        <view v-show="currentTab === 0" class="tab-panel glx-tab-panel">
          <view class="card glx-panel-card glx-editor-card">
            <view class="card-title-section glx-panel-head">
              <text class="glx-panel-title">传送门颜色</text>
            </view>
            <view class="option-row option-row-triple">
              <view
                v-for="option in colorOptions"
                :key="option.id"
                class="option-btn glx-feature-option"
                :class="{ active: config.preset === option.id }"
                @click="handleColorSelect(option.id)"
              >
                <text class="glx-feature-option__label">{{
                  option.label
                }}</text>
              </view>
            </view>
          </view>

          <view class="card glx-panel-card glx-editor-card">
            <view class="card-title-section glx-panel-head">
              <text class="glx-panel-title">参数</text>
            </view>

            <view class="form-row">
              <text class="form-label">水平位置 {{ config.portalX }}</text>
              <GlxStepper
                :value="config.portalX"
                :min="0"
                :max="63"
                :step="1"
                @change="handlePortalXChange"
              />
            </view>

            <view class="form-row">
              <text class="form-label">垂直位置 {{ config.portalY }}</text>
              <GlxStepper
                :value="config.portalY"
                :min="0"
                :max="63"
                :step="1"
                @change="handlePortalYChange"
              />
            </view>

            <view class="bottom-action-row bottom-action-row--single">
              <view
                class="action-btn-sm glx-secondary-action"
                :class="{ disabled: isSending }"
                @click="handlePortalCenter"
              >
                <Icon name="target" :size="32" color="var(--nb-ink)" />
                <text>快速居中</text>
              </view>
            </view>

            <view class="option-stack">
              <text class="form-label">传送门大小</text>
              <view class="option-row option-row-triple">
                <view
                  v-for="option in sizeOptions"
                  :key="option.id"
                  class="option-btn glx-feature-option"
                  :class="{ active: config.size === option.id }"
                  @click="handleSizeSelect(option.id)"
                >
                  <text class="glx-feature-option__label">{{
                    option.label
                  }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <view v-show="currentTab === 1" class="tab-panel glx-tab-panel">
          <view class="card glx-panel-card glx-editor-card">
            <view class="card-title-section glx-panel-head">
              <text class="glx-panel-title">角色叠加(uniapp 调试)</text>
            </view>

            <view class="form-row">
              <text class="form-label">显示角色</text>
              <view class="setting-control-buttons" style="gap:8rpx">
                <view
                  class="option-btn glx-feature-option"
                  :class="{ active: character.show }"
                  style="padding:6rpx 16rpx"
                  @click="toggleCharacterShow"
                >
                  <text class="glx-feature-option__label">显示</text>
                </view>
                <view
                  class="option-btn glx-feature-option"
                  :class="{ active: !character.show }"
                  style="padding:6rpx 16rpx"
                  @click="toggleCharacterShow"
                >
                  <text class="glx-feature-option__label">隐藏</text>
                </view>
              </view>
            </view>

            <view v-if="character.show" class="option-stack">
              <text class="form-label">选择角色</text>
              <view class="option-row option-row-quad">
                <view
                  v-for="opt in characterOptions"
                  :key="opt.id"
                  class="option-btn glx-feature-option"
                  :class="{ active: character.id === opt.id }"
                  @click="handleCharacterSelect(opt.id)"
                >
                  <text class="glx-feature-option__label">{{ opt.label }}</text>
                </view>
              </view>
            </view>

            <view v-if="character.show" class="form-row">
              <text class="form-label">高度 {{ character.height }}px</text>
              <GlxStepper
                :value="characterHeightIndex"
                :min="0"
                :max="characterHeights.length - 1"
                :step="1"
                @change="handleCharacterHeightStepperChange"
              />
            </view>

            <view v-if="character.show" class="form-row">
              <text class="form-label">水平位置 {{ character.anchorX }}</text>
              <GlxStepper
                :value="character.anchorX"
                :min="0"
                :max="63"
                :step="1"
                @change="handleCharacterAnchorXChange"
              />
            </view>

            <view v-if="character.show" class="form-row">
              <text class="form-label">垂直位置 {{ character.anchorY }}</text>
              <GlxStepper
                :value="character.anchorY"
                :min="0"
                :max="63"
                :step="1"
                @change="handleCharacterAnchorYChange"
              />
            </view>

            <view class="form-row" style="display:block;padding:8rpx 0 0">
              <text style="font-size:24rpx;color:#888;line-height:1.4;display:block">
                这是 uniapp 端的调试预览,板载传送门暂未接入角色。调好尺寸/位置之后再决定怎么板载化。
              </text>
            </view>
          </view>
        </view>

        <view v-show="currentTab === 2" class="tab-panel glx-tab-panel">
          <ClockTextSettingsCard
            icon-name="time"
            title="时间显示"
            :section="clockConfig.time"
            :preset-colors="timeColorOptions"
            :show-font-size="true"
            :show-seconds-control="true"
            :show-seconds="clockConfig.showSeconds"
            :min-font-size="1"
            :max-font-size="3"
            @toggle="toggleTimeShow"
            @toggle-seconds="toggleTimeSeconds"
            @adjust="handleTimeAdjust"
            @update-color="handleTimeColor"
            @set-align="handleTimeAlign"
          />
        </view>

        <view v-show="currentTab === 3" class="tab-panel glx-tab-panel">
          <ClockFontPanel
            :font-options="timeFontOptions"
            :selected-font="clockConfig.font"
            :show-seconds="clockConfig.showSeconds"
            :hour-format="24"
            :show-hour-format="false"
            @select-font="handleTimeFontChange"
          />
        </view>
      </view>
    </scroll-view>

    <view class="bottom-tabs">
      <view
        v-for="tab in tabDefinitions"
        :key="tab.index"
        class="bottom-tab-item"
        :class="{ active: currentTab === tab.index }"
        @click="currentTab = tab.index"
      >
        <Icon
          :name="tab.icon"
          :size="36"
          :color="currentTab === tab.index ? '#000000' : '#666666'"
        />
        <text class="bottom-tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <view
      v-if="isSending"
      class="glx-device-sending-overlay"
      @touchmove.stop.prevent
    >
      <view class="glx-device-sending-card">
        <GlxInlineLoader
          class="glx-device-sending-spinner"
          variant="chase"
          size="lg"
        />
        <text class="glx-device-sending-title">{{ sendOverlayTitle }}</text>
        <text class="glx-device-sending-tip">{{ sendOverlayTip }}</text>
      </view>
    </view>

    <Toast ref="toastRef" @show="handleToastShow" @hide="handleToastHide" />
  </view>
</template>

<script>
import statusBarMixin from "../../mixins/statusBar.js";
import deviceSendUxMixin from "../../mixins/deviceSendUxMixin.js";
import Icon from "../../components/Icon.vue";
import Toast from "../../components/Toast.vue";
import GlxInlineLoader from "../../components/GlxInlineLoader.vue";
import PixelCanvas from "../../components/PixelCanvas.vue";
import PixelPreviewBoard from "../../components/PixelPreviewBoard.vue";
import GlxStepper from "../../components/GlxStepper.vue";
import ClockFontPanel from "../../components/clock-editor/ClockFontPanel.vue";
import ClockTextSettingsCard from "../../components/clock-editor/ClockTextSettingsCard.vue";
import { useDeviceStore } from "../../store/device.js";
import { useToast } from "../../composables/useToast.js";
import {
  drawClockTextToPixels,
  getClockFontOptions,
  getClockTextHeight,
  getClockTextWidth,
  getCurrentTimeText,
} from "../../utils/clockCanvas.js";
import {
  PORTAL_PAGE_STORAGE_KEY,
  PORTAL_COLOR_OPTIONS,
  PORTAL_SIZE_OPTIONS,
  PORTAL_TIME_COLOR_OPTIONS,
  PORTAL_PREVIEW_PLAYBACK_INTERVAL_MS,
  createDefaultPortalPreviewConfig,
  createDefaultPortalClockConfig,
  normalizePortalPageState,
  buildPortalPreviewFrame,
  buildPortalPreviewSequence,
  getPortalCharacterOptions,
  getPortalCharacterHeightLevels,
} from "../../utils/rickMortyPortalPreview.js";

const PORTAL_TIME_FONT_OPTIONS = getClockFontOptions();
const PORTAL_TIME_FONT_IDS = new Set(
  PORTAL_TIME_FONT_OPTIONS.map((item) => item.id),
);
const PORTAL_PRESET_IDS = new Set(PORTAL_COLOR_OPTIONS.map((item) => item.id));
const PORTAL_SIZE_IDS = new Set(PORTAL_SIZE_OPTIONS.map((item) => item.id));
const PORTAL_CHARACTER_OPTIONS = getPortalCharacterOptions();
const PORTAL_CHARACTER_IDS = new Set(PORTAL_CHARACTER_OPTIONS.map((item) => item.id));
const PORTAL_CHARACTER_HEIGHTS = getPortalCharacterHeightLevels();
const PORTAL_CHARACTER_DEFAULT_HEIGHT = PORTAL_CHARACTER_HEIGHTS.includes(24)
  ? 24
  : (PORTAL_CHARACTER_HEIGHTS[Math.floor(PORTAL_CHARACTER_HEIGHTS.length / 2)] || 24);
// 传送门固定 60 秒生命周期(打开 → 旋涡 → 关闭),与板载渲染对齐
const PORTAL_CYCLE_DURATION_MS = 60000;
const PORTAL_PREVIEW_FRAME_COUNT = 48;

export default {
  mixins: [statusBarMixin, deviceSendUxMixin],
  components: {
    Icon,
    Toast,
    GlxInlineLoader,
    PixelCanvas,
    PixelPreviewBoard,
    GlxStepper,
    ClockFontPanel,
    ClockTextSettingsCard,
  },
  data() {
    const config = createDefaultPortalPreviewConfig();
    return {
      deviceStore: null,
      toast: null,
      contentHeight: "calc(100vh - 88rpx - 520rpx - 112rpx)",
      previewCanvasReady: false,
      previewZoom: 4,
      previewOffset: { x: 0, y: 0 },
      previewContainerSize: { width: 320, height: 320 },
      previewDisplayPixels: new Map(),
      previewRefreshTick: 0,
      sendingPreviewPixels: new Map(),
      sendingPreviewTick: 0,
      previewPlaybackStartedAt: 0,
      previewTimer: null,
      previewRefreshTimer: null,
      colorOptions: PORTAL_COLOR_OPTIONS,
      sizeOptions: PORTAL_SIZE_OPTIONS,
      clockConfig: createDefaultPortalClockConfig(),
      timeFontOptions: PORTAL_TIME_FONT_OPTIONS,
      timeColorOptions: PORTAL_TIME_COLOR_OPTIONS,
      // 角色调试 (uniapp 调试用, 板载未接入)
      characterOptions: PORTAL_CHARACTER_OPTIONS,
      characterHeights: PORTAL_CHARACTER_HEIGHTS,
      character: {
        show: PORTAL_CHARACTER_OPTIONS.length > 0,
        id: PORTAL_CHARACTER_OPTIONS.length > 0 ? PORTAL_CHARACTER_OPTIONS[0].id : "",
        height: PORTAL_CHARACTER_DEFAULT_HEIGHT,
        anchorX: 32, // 脚底中心 X
        anchorY: 60, // 脚底 Y (近底部)
      },
      currentTab: 0,
      tabDefinitions: [
        { index: 0, label: "传送门", icon: "refresh" },
        { index: 1, label: "角色", icon: "user" },
        { index: 2, label: "时间", icon: "time" },
        { index: 3, label: "字体", icon: "text" },
      ],
      config,
    };
  },
  computed: {
    currentPreviewPixels() {
      return this.previewDisplayPixels;
    },
    previewCanvasBoxStyle() {
      const size =
        this.previewContainerSize && this.previewContainerSize.height
          ? this.previewContainerSize.height
          : 320;
      return {
        height: `${size}px`,
      };
    },
    isDeviceConnected() {
      if (!this.deviceStore) {
        return false;
      }
      return this.deviceStore.isConnected;
    },
    characterHeightIndex() {
      const idx = this.characterHeights.indexOf(this.character.height);
      return idx >= 0 ? idx : 0;
    },
  },
  watch: {
    config: {
      deep: true,
      handler() {
        this.persistLocalState();
      },
    },
    clockConfig: {
      deep: true,
      handler() {
        this.persistLocalState();
      },
    },
    character: {
      deep: true,
      handler() {
        this.persistLocalState();
        if (this.previewCanvasReady) {
          this.refreshOverlayPreview();
        }
      },
    },
  },
  onLoad() {
    this.deviceStore = useDeviceStore();
    this.deviceStore.init();
    this.toast = useToast();
    const savedState = normalizePortalPageState(
      uni.getStorageSync(PORTAL_PAGE_STORAGE_KEY),
    );
    this.config = savedState.config;
    this.clockConfig = savedState.clockConfig;
    // 恢复角色调试值(仅 uniapp 用,板载不知道这个字段)
    const rawSaved = uni.getStorageSync(PORTAL_PAGE_STORAGE_KEY);
    if (rawSaved && typeof rawSaved === "object" && rawSaved.character && typeof rawSaved.character === "object") {
      const c = rawSaved.character;
      if (c.show === true || c.show === false) this.character.show = c.show;
      if (typeof c.id === "string" && PORTAL_CHARACTER_IDS.has(c.id)) {
        this.character.id = c.id;
      }
      if (typeof c.height === "number" && this.characterHeights.includes(c.height)) {
        this.character.height = c.height;
      }
      const ax = Number(c.anchorX);
      if (Number.isFinite(ax)) {
        this.character.anchorX = Math.max(0, Math.min(63, Math.round(ax)));
      }
      const ay = Number(c.anchorY);
      if (Number.isFinite(ay)) {
        this.character.anchorY = Math.max(0, Math.min(63, Math.round(ay)));
      }
    }
  },
  onReady() {
    if (this.$refs.toastRef) {
      this.toast.setToastInstance(this.$refs.toastRef);
    }
    this.initPreviewCanvas();
  },
  async onShow() {
    if (this.previewCanvasReady) {
      this.startPreviewPlayback();
    }
    await this.syncConfigFromDeviceStatus();
  },
  onHide() {
    this.cleanupPreviewTimers();
  },
  onUnload() {
    this.cleanupPreviewTimers();
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
    beginSendUi() {
      this.captureSendingPreview();
      deviceSendUxMixin.methods.beginSendUi.call(this);
    },
    endSendUi() {
      deviceSendUxMixin.methods.endSendUi.call(this);
    },
    handleBack() {
      uni.navigateBack();
    },
    persistLocalState() {
      uni.setStorageSync(PORTAL_PAGE_STORAGE_KEY, {
        config: {
          preset: this.config.preset,
          size: this.config.size,
          portalX: this.config.portalX,
          portalY: this.config.portalY,
        },
        clockConfig: {
          font: this.clockConfig.font,
          showSeconds: this.clockConfig.showSeconds,
          time: {
            show: this.clockConfig.time.show,
            fontSize: this.clockConfig.time.fontSize,
            x: this.clockConfig.time.x,
            y: this.clockConfig.time.y,
            color: this.clockConfig.time.color,
            align: this.clockConfig.time.align,
          },
        },
        character: {
          show: this.character.show,
          id: this.character.id,
          height: this.character.height,
          anchorX: this.character.anchorX,
          anchorY: this.character.anchorY,
        },
      });
    },
    getPortalTimeText() {
      return getCurrentTimeText(this.clockConfig.showSeconds, 24);
    },
    getPortalTimeMetrics(text = this.getPortalTimeText()) {
      const fontSize = Math.max(
        1,
        Math.min(3, Number(this.clockConfig.time.fontSize) || 1),
      );
      return {
        fontSize,
        width: getClockTextWidth(text, this.clockConfig.font, fontSize),
        height: getClockTextHeight(this.clockConfig.font, fontSize),
      };
    },
    resolveAnchorTimeXFromBoardX(boardX, text = this.getPortalTimeText()) {
      const { width } = this.getPortalTimeMetrics(text);
      let anchorX = Number(boardX);
      if (!Number.isFinite(anchorX)) {
        return this.clockConfig.time.x;
      }
      if (this.clockConfig.time.align === "center") {
        anchorX += Math.floor(width / 2);
      } else if (this.clockConfig.time.align === "right") {
        anchorX += width;
      }
      if (anchorX < 0) {
        return 0;
      }
      if (anchorX > 63) {
        return 63;
      }
      return Math.round(anchorX);
    },
    rgbToHex(color) {
      if (!color || typeof color !== "object") {
        return "#ffffff";
      }
      const channels = ["r", "g", "b"].map((key) => {
        const value = Number(color[key]);
        const clamped = Number.isFinite(value)
          ? Math.max(0, Math.min(255, Math.round(value)))
          : 255;
        return clamped.toString(16).padStart(2, "0");
      });
      return `#${channels.join("")}`;
    },
    applyPortalStatus(status) {
      if (!status || typeof status !== "object") {
        return;
      }
      const {
        businessMode,
        preset,
        size,
        portalX: rawPortalX,
        portalY: rawPortalY,
        font,
        showSeconds,
        time,
      } = status;
      if (businessMode !== "rick_morty_portal") {
        return;
      }
      if (typeof preset !== "string" || typeof size !== "string") {
        return;
      }
      if (!time || typeof time !== "object") {
        return;
      }
      if (!time.color || typeof time.color !== "object") {
        return;
      }

      if (PORTAL_PRESET_IDS.has(preset)) {
        this.config.preset = preset;
      }
      if (PORTAL_SIZE_IDS.has(size)) {
        this.config.size = size;
      }
      const portalX = Number(rawPortalX);
      if (Number.isFinite(portalX)) {
        this.config.portalX = Math.max(0, Math.min(63, Math.round(portalX)));
      }
      const portalY = Number(rawPortalY);
      if (Number.isFinite(portalY)) {
        this.config.portalY = Math.max(0, Math.min(63, Math.round(portalY)));
      }

      if (PORTAL_TIME_FONT_IDS.has(font)) {
        this.clockConfig.font = font;
      }
      if (showSeconds === true || showSeconds === false) {
        this.clockConfig.showSeconds = showSeconds;
      }

      if (time.show === true || time.show === false) {
        this.clockConfig.time.show = time.show;
      }
      const fontSize = Number(time.fontSize);
      if (Number.isFinite(fontSize)) {
        this.clockConfig.time.fontSize = Math.max(
          1,
          Math.min(3, Math.round(fontSize)),
        );
      }
      const boardX = Number(time.x);
      if (Number.isFinite(boardX)) {
        this.clockConfig.time.x = this.resolveAnchorTimeXFromBoardX(
          boardX,
          this.getPortalTimeText(),
        );
      }
      const y = Number(time.y);
      if (Number.isFinite(y)) {
        this.clockConfig.time.y = Math.max(0, Math.min(63, Math.round(y)));
      }
      this.clockConfig.time.color = this.rgbToHex(time.color);

      if (this.previewCanvasReady) {
        this.schedulePreviewRefresh(this.getCurrentPreviewProgress());
      }
    },
    async syncConfigFromDeviceStatus() {
      if (!this.deviceStore || !this.deviceStore.connected) {
        return;
      }
      const status = await this.deviceStore.syncDeviceStatus();
      this.applyPortalStatus(status);
    },
    async handleSend() {
      if (!this.guardBeforeSend(this.isDeviceConnected)) {
        return;
      }

      const previousMode = this.deviceStore.deviceMode;
      this.beginSendUi();
      try {
        const ws = this.deviceStore.getWebSocket();
        await ws.setRickMortyPortal(this.buildPortalSendPayload());
        await this.syncConfigFromDeviceStatus();
        this.showSendSuccess();
      } catch (error) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode: "rick_morty_portal",
        });
        console.error("发送传送门失败:", error);
        this.showSendFailure(error);
      } finally {
        this.endSendUi();
      }
    },
    initPreviewCanvas() {
      const systemInfo = uni.getSystemInfoSync();
      const statusBarHeight = systemInfo.statusBarHeight || 0;

      this.$nextTick(() => {
        setTimeout(() => {
          const query = uni.createSelectorQuery().in(this);
          query.select(".canvas-section").boundingClientRect((sectionRect) => {
            if (!sectionRect || !sectionRect.height) {
              return;
            }
            const nextHeight =
              systemInfo.windowHeight -
              statusBarHeight -
              88 -
              sectionRect.height;
            this.contentHeight = `${Math.max(120, nextHeight - 76)}px`;
          });
          query
            .select(".preview-canvas-container")
            .boundingClientRect((data) => {
              if (!data || !data.width) {
                this.previewCanvasReady = true;
                this.startPreviewPlayback();
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
              this.startPreviewPlayback();
            })
            .exec();
        }, 80);
      });
    },
    renderPreviewFrame(progress) {
      const characterOverlay = this.character && this.character.show
        ? {
            show: true,
            character: this.character.id,
            height: this.character.height,
            anchorX: this.character.anchorX,
            anchorY: this.character.anchorY,
          }
        : null;
      const frameMap = buildPortalPreviewFrame(this.config, progress, characterOverlay);
      if (frameMap && this.clockConfig.time.show) {
        const text = this.getPortalTimeText();
        const placement = this.resolveBoardTimePlacement(text);
        drawClockTextToPixels(
          text,
          placement.x,
          placement.y,
          this.clockConfig.time.color,
          frameMap,
          this.clockConfig.font,
          placement.fontSize,
          "left",
        );
      }
      if (frameMap) {
        this.previewDisplayPixels = frameMap;
        this.previewRefreshTick += 1;
      }
    },
    resolveBoardTimePlacement(text) {
      const { fontSize, width, height } = this.getPortalTimeMetrics(text);
      const maxX = Math.max(0, 64 - width);
      const maxY = Math.max(0, 64 - height);
      let x = Number(this.clockConfig.time.x);
      let y = Number(this.clockConfig.time.y);

      if (this.clockConfig.time.align === "center") {
        x -= Math.floor(width / 2);
      } else if (this.clockConfig.time.align === "right") {
        x -= width;
      }

      if (x < 0) {
        x = 0;
      }
      if (x > maxX) {
        x = maxX;
      }
      if (y < 0) {
        y = 0;
      }
      if (y > maxY) {
        y = maxY;
      }

      return {
        x,
        y,
        fontSize,
      };
    },
    getCurrentPreviewProgress() {
      if (!this.previewPlaybackStartedAt) {
        return 0;
      }
      const elapsed = Date.now() - this.previewPlaybackStartedAt;
      return (elapsed % PORTAL_CYCLE_DURATION_MS) / PORTAL_CYCLE_DURATION_MS;
    },
    refreshOverlayPreview() {
      if (!this.previewCanvasReady) {
        return;
      }
      this.renderPreviewFrame(this.getCurrentPreviewProgress());
    },
    schedulePreviewRefresh(preservedProgress = null) {
      if (this.previewRefreshTimer) {
        clearTimeout(this.previewRefreshTimer);
      }
      const nextProgress =
        typeof preservedProgress === "number"
          ? preservedProgress
          : this.getCurrentPreviewProgress();
      this.previewRefreshTimer = setTimeout(() => {
        this.previewRefreshTimer = null;
        this.startPreviewPlayback(nextProgress);
      }, 40);
    },
    handleColorSelect(presetId) {
      if (!PORTAL_PRESET_IDS.has(presetId)) {
        return;
      }
      if (this.config.preset === presetId) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.preset = presetId;
      this.schedulePreviewRefresh(progress);
    },
    handleSizeSelect(sizeId) {
      if (!PORTAL_SIZE_IDS.has(sizeId)) {
        return;
      }
      if (sizeId === this.config.size) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.size = sizeId;
      this.schedulePreviewRefresh(progress);
    },
    handlePortalXChange(event) {
      const nextValue = Number(event && event.detail && event.detail.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }
      const portalX = Math.max(0, Math.min(63, Math.round(nextValue)));
      if (portalX === this.config.portalX) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.portalX = portalX;
      this.schedulePreviewRefresh(progress);
    },
    handlePortalYChange(event) {
      const nextValue = Number(event && event.detail && event.detail.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }
      const portalY = Math.max(0, Math.min(63, Math.round(nextValue)));
      if (portalY === this.config.portalY) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.portalY = portalY;
      this.schedulePreviewRefresh(progress);
    },
    handlePortalCenter() {
      if (this.config.portalX === 32 && this.config.portalY === 32) {
        return;
      }
      const progress = this.getCurrentPreviewProgress();
      this.config.portalX = 32;
      this.config.portalY = 32;
      this.schedulePreviewRefresh(progress);
    },
    toggleCharacterShow() {
      this.character.show = !this.character.show;
    },
    handleCharacterSelect(id) {
      if (!PORTAL_CHARACTER_IDS.has(id)) {
        return;
      }
      if (this.character.id === id) {
        return;
      }
      this.character.id = id;
    },
    handleCharacterHeightStepperChange(event) {
      const idx = Number(event && event.detail && event.detail.value);
      if (!Number.isFinite(idx)) {
        return;
      }
      const clamped = Math.max(0, Math.min(this.characterHeights.length - 1, Math.round(idx)));
      const next = this.characterHeights[clamped];
      if (typeof next === "number" && next !== this.character.height) {
        this.character.height = next;
      }
    },
    handleCharacterAnchorXChange(event) {
      const value = Number(event && event.detail && event.detail.value);
      if (!Number.isFinite(value)) {
        return;
      }
      const next = Math.max(0, Math.min(63, Math.round(value)));
      if (next !== this.character.anchorX) {
        this.character.anchorX = next;
      }
    },
    handleCharacterAnchorYChange(event) {
      const value = Number(event && event.detail && event.detail.value);
      if (!Number.isFinite(value)) {
        return;
      }
      const next = Math.max(0, Math.min(63, Math.round(value)));
      if (next !== this.character.anchorY) {
        this.character.anchorY = next;
      }
    },
    toggleTimeShow() {
      this.clockConfig.time.show = !this.clockConfig.time.show;
      this.refreshOverlayPreview();
    },
    handleTimeAdjust(key, delta, min, max) {
      if (this.clockConfig.time[key] === undefined) {
        return;
      }
      const safeMax = (key === "x" || key === "y") && max === 64 ? 63 : max;
      const currentValue = this.clockConfig.time[key];
      const nextValue = Math.max(min, Math.min(safeMax, currentValue + delta));
      if (nextValue === currentValue) {
        return;
      }
      this.clockConfig.time[key] = nextValue;
      this.refreshOverlayPreview();
    },
    handleTimeColor(color) {
      if (typeof color !== "string" || color.length === 0) {
        return;
      }
      this.clockConfig.time.color = color;
      this.refreshOverlayPreview();
    },
    handleTimeAlign(align) {
      if (align !== "left" && align !== "center" && align !== "right") {
        return;
      }
      this.clockConfig.time.align = align;
      if (align === "left") {
        this.clockConfig.time.x = 0;
      } else if (align === "center") {
        this.clockConfig.time.x = 32;
      } else {
        this.clockConfig.time.x = 63;
      }
      this.refreshOverlayPreview();
    },
    handleTimeFontChange(fontId) {
      if (!PORTAL_TIME_FONT_IDS.has(fontId)) {
        return;
      }
      this.clockConfig.font = fontId;
      this.refreshOverlayPreview();
    },
    toggleTimeSeconds() {
      this.clockConfig.showSeconds = !this.clockConfig.showSeconds;
      this.refreshOverlayPreview();
    },
    hexToRgb(hex) {
      if (typeof hex !== "string") {
        throw new Error("invalid portal time color");
      }
      const normalized = hex.trim().replace(/^#/, "");
      if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
        throw new Error("invalid portal time color");
      }
      return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
      };
    },
    buildPortalSendPayload() {
      if (!PORTAL_TIME_FONT_IDS.has(this.clockConfig.font)) {
        throw new Error("invalid portal time font");
      }
      const timeText = this.getPortalTimeText();
      const timePlacement = this.resolveBoardTimePlacement(timeText);
      return {
        preset: this.config.preset,
        size: this.config.size,
        portalX: this.config.portalX,
        portalY: this.config.portalY,
        font: this.clockConfig.font,
        showSeconds: this.clockConfig.showSeconds,
        time: {
          show: this.clockConfig.time.show,
          fontSize: timePlacement.fontSize,
          x: timePlacement.x,
          y: timePlacement.y,
          color: this.hexToRgb(this.clockConfig.time.color),
        },
      };
    },
    startPreviewPlayback(preservedProgress = 0) {
      this.stopPreviewPlayback();
      if (!this.previewCanvasReady) {
        return;
      }

      this.previewPlaybackStartedAt =
        Date.now() - preservedProgress * PORTAL_CYCLE_DURATION_MS;

      const tick = () => {
        const progress = this.getCurrentPreviewProgress();
        this.renderPreviewFrame(progress);
        const frameInterval = PORTAL_CYCLE_DURATION_MS / PORTAL_PREVIEW_FRAME_COUNT;
        this.previewTimer = setTimeout(tick, Math.max(60, frameInterval));
      };
      tick();
    },
    stopPreviewPlayback() {
      if (this.previewTimer) {
        clearTimeout(this.previewTimer);
        this.previewTimer = null;
      }
    },
    cleanupPreviewTimers() {
      this.stopPreviewPlayback();
      if (this.previewRefreshTimer) {
        clearTimeout(this.previewRefreshTimer);
        this.previewRefreshTimer = null;
      }
    },
  },
};
</script>

<style scoped>
.portal-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  overflow: hidden;
}

.status-bar {
  background-color: #1a1a1a;
}

.content {
  flex: 1;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: var(--bg-tertiary);
  padding: 16rpx 20rpx 0;
}

.preview-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.card {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.tab-panel {
  padding-top: 0;
}

.option-stack {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 12rpx;
}

.option-row {
  display: grid;
  gap: 12rpx;
}

.option-row-triple {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.option-row-quad {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.option-btn.glx-feature-option {
  min-height: 88rpx;
  padding: 10rpx 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: var(--nb-surface) !important;
  border: 2rpx solid var(--nb-ink) !important;
  box-shadow: var(--nb-shadow-soft) !important;
}

.option-btn.glx-feature-option.active {
  background: var(--nb-yellow) !important;
  border-color: var(--nb-ink) !important;
  box-shadow: var(--nb-shadow-soft) !important;
}

.option-btn.glx-feature-option .glx-feature-option__label {
  font-size: 24rpx;
  line-height: 1.2;
  font-weight: 800;
  color: var(--text-secondary) !important;
}

.option-btn.glx-feature-option.active .glx-feature-option__label {
  color: var(--nb-ink) !important;
  font-weight: 900 !important;
}

.glx-secondary-action {
  background: var(--nb-surface) !important;
  border-color: var(--nb-ink) !important;
}

.bottom-action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
  margin: 12rpx 0;
}

.bottom-action-row--single {
  grid-template-columns: minmax(0, 1fr);
}

.bottom-action-row .action-btn-sm {
  width: 100% !important;
  min-width: 0 !important;
  height: 72rpx !important;
  padding: 0 12rpx !important;
}

.bottom-action-row .action-btn-sm text {
  font-size: 22rpx !important;
}

.bottom-tabs {
  display: flex;
  flex-shrink: 0;
  padding: 2rpx 10rpx 0;
  padding-bottom: var(--layout-bottom-offset);
  background-color: var(--bg-elevated);
  border-top: 2rpx solid var(--nb-ink);
  gap: 2rpx;
}

.bottom-tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  min-height: 68rpx;
  padding: 2rpx 0;
  background-color: transparent;
}

.bottom-tab-item:active {
  background-color: transparent;
}

.bottom-tab-item.active {
  background-color: transparent;
}

.bottom-tab-item.active .bottom-tab-text {
  color: #000000;
  font-weight: 900;
  font-size: 22rpx;
}

.bottom-tab-text {
  font-size: 20rpx;
  color: var(--text-secondary);
}

.form-row:last-child {
  margin-bottom: 0;
}
</style>
