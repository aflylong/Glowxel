<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">海绵宝宝时钟</span>
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
        <div v-if="isLoading" class="preview-loading">正在加载海绵宝宝像素数据...</div>
      </div>

      <div class="preview-caption glx-preview-panel">
        <div class="preview-caption-info glx-preview-panel__info">
          <span class="preview-caption-title">{{ selectedProgramName }}</span>
          <span class="preview-caption-sub">{{ statusText }}</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isLoading }"
            @click="sendToDevice"
          >
            <Icon name="link" :size="36" color="#000000" />
            <span>发送</span>
          </div>
        </div>
      </div>
    </div>

    <div
      data-scroll-view
      scroll-y
      class="content glx-scroll-region glx-page-shell__content"
      :style="{ height: contentHeight }"
    >
      <div class="content-wrapper glx-scroll-stack">
        <div v-show="currentTab === 1" class="settings-card">
          <div class="card-title-section">
            <span class="card-title">主题流程</span>
            <span class="card-meta">双角色同步编排</span>
          </div>
          <div class="program-grid">
            <div
              v-for="program in programOptions"
              :key="program.id"
              class="program-btn"
              :class="{ active: config.programId === program.id }"
              @click="selectProgram(program.id)"
            >
              <span>{{ program.name }}</span>
            </div>
          </div>
          <ControlRange
            label="播放速度"
            :value="config.frameInterval"
            suffix="ms/帧"
            :min="80"
            :max="500"
            :step="10"
            @input="setConfigValue('frameInterval', $event)"
          />
          <p class="desc-text">
            当前只使用海绵宝宝和派大星。一个角色动作没跑完时，另一个角色按自己的动作循环补齐，保持类似拳皇的双人场面节奏。
          </p>
        </div>

        <div v-show="currentTab === 2" class="settings-card">
          <div class="card-title-section">
            <span class="card-title">角色位置</span>
            <span class="card-meta">统一脚底线和缩放</span>
          </div>
          <div class="role-section">
            <span class="role-title">共同基准</span>
            <ControlRange label="脚底 Y" :value="config.spongebobY" suffix="" :min="0" :max="72" :step="1" @input="setConfigValue('spongebobY', $event)" />
            <ControlRange label="缩放" :value="config.spongebobScale" suffix="x" :min="0.25" :max="1.5" :step="0.05" @input="setConfigValue('spongebobScale', $event)" />
          </div>
          <div class="role-section">
            <span class="role-title">海绵宝宝</span>
            <ControlRange label="X" :value="config.spongebobX" suffix="" :min="-16" :max="80" :step="1" @input="setConfigValue('spongebobX', $event)" />
          </div>
          <div class="role-section">
            <span class="role-title">派大星</span>
            <ControlRange label="X" :value="config.patrickX" suffix="" :min="-16" :max="80" :step="1" @input="setConfigValue('patrickX', $event)" />
          </div>
          <div class="role-section">
            <span class="role-title">背景底图 BG1</span>
            <ControlRange label="左上 X" :value="config.bg1X" suffix="" :min="-64" :max="64" :step="1" @input="setConfigValue('bg1X', $event)" />
            <ControlRange label="左上 Y" :value="config.bg1Y" suffix="" :min="-32" :max="64" :step="1" @input="setConfigValue('bg1Y', $event)" />
            <ControlRange label="缩放" :value="config.bg1Scale" suffix="x" :min="0.1" :max="2" :step="0.01" @input="setConfigValue('bg1Scale', $event)" />
            <p class="desc-text">bg1.png 作为底部背景图层参与渲染，当前这三个参数按左上角定位。</p>
          </div>
        </div>

        <div v-show="currentTab === 3" class="settings-card">
          <div class="card-title-section">
            <span class="card-title">时间字体</span>
            <span class="card-meta">泰拉瑞亚式三层描边</span>
          </div>
          <div class="font-tabs">
            <div class="font-tab" :class="{ active: timeFontTab === 1 }" @click="timeFontTab = 1">位置</div>
            <div class="font-tab" :class="{ active: timeFontTab === 2 }" @click="timeFontTab = 2">尺寸</div>
            <div class="font-tab" :class="{ active: timeFontTab === 3 }" @click="timeFontTab = 3">状态</div>
          </div>
          <div v-show="timeFontTab === 1">
            <ToggleRow label="显示时间" :active="config.showTime" @click="toggleConfigValue('showTime')" />
            <ControlRange label="时间 X" :value="config.timeX" suffix="" :min="0" :max="63" :step="1" @input="setConfigValue('timeX', $event)" />
            <ControlRange label="时间 Y" :value="config.timeY" suffix="" :min="0" :max="56" :step="1" @input="setConfigValue('timeY', $event)" />
          </div>
          <div v-show="timeFontTab === 2">
            <ControlRange label="字体倍率" :value="config.timeFontScale" suffix="x" :min="1" :max="2" :step="1" @input="setConfigValue('timeFontScale', $event)" />
          </div>
          <div v-show="timeFontTab === 3">
            <div class="palette-row">
              <span class="palette-chip palette-chip--dark"></span>
              <span>外圈深蓝</span>
            </div>
            <div class="palette-row">
              <span class="palette-chip palette-chip--light"></span>
              <span>内圈浅蓝</span>
            </div>
            <div class="palette-row">
              <span class="palette-chip palette-chip--yellow"></span>
              <span>字芯黄色</span>
            </div>
            <p class="desc-text">这里直接使用泰拉瑞亚的 lcd_6x8 时间字模，只把颜色改成海绵宝宝主题的黄芯、浅蓝内圈、深蓝外圈。</p>
          </div>
        </div>

        <div v-show="currentTab === 4" class="settings-card">
          <div class="card-title-section">
            <span class="card-title">状态</span>
            <span class="card-meta">当前帧信息</span>
          </div>
          <div class="status-list">
            <span>流程：{{ selectedProgramName }}</span>
            <span>段落：{{ statusDetail.segment }}</span>
            <span>左侧：{{ statusDetail.left }}</span>
            <span>右侧：{{ statusDetail.right }}</span>
            <span>发送：当前走现有 gif_player 动画通道，发送的是当前主题序列。</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-tabs">
      <div
        v-for="tab in tabDefinitions"
        :key="tab.index"
        class="bottom-tab-item"
        :class="{ active: currentTab === tab.index }"
        @click="currentTab = tab.index"
      >
        <Icon :name="tab.icon" :size="36" :color="currentTab === tab.index ? '#000000' : '#666666'" />
        <span class="bottom-tab-text">{{ tab.label }}</span>
      </div>
    </div>

    <Toast ref="toastRef" @show="handleToastShow" @hide="handleToastHide" />
  </div>
</template>

<script>
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import statusBarMixin from "@/mixins/statusBar.js";
import deviceSendUxMixin from "@/mixins/deviceSendUxMixin.js";
import { h } from "vue";
import { useDeviceStore } from "@/stores/device.js";
import { useToast } from "@/composables/useToast.js";
import Icon from "@/components/uni/Icon.vue";
import Toast from "@/components/uni/Toast.vue";
import PixelPreviewBoard from "@/components/uni/PixelPreviewBoard.vue";
import { applyCompactAnimation } from "@/utils/animationUploader.js";
import {
  SPONGEBOB_PROGRAMS,
  createInitialSpongeBobState,
  getSpongeBobStatus,
  loadSpongeBobAssets,
  renderSpongeBobScene,
  tickSpongeBobScene,
} from "@/utils/spongebobRenderer.js";

const EMPTY_STATUS = Object.freeze({
  segment: "等待加载",
  left: "-",
  right: "-",
});

const PANEL_W = 64;
const PANEL_H = 64;
const SPONGEBOB_SEND_FRAME_COUNT = 72;
const SPONGEBOB_SLEEP_HOLD_FRAMES = 8;
const SPONGEBOB_ANIMATION_MODE = "gif_player";

function parseHexColor(colorText) {
  if (typeof colorText !== "string") {
    throw new Error("Invalid pixel color");
  }
  const match = /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorText);
  if (!match) {
    throw new Error(`Invalid pixel color: ${colorText}`);
  }
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

function buildDenseRgbFrame(pixelMap) {
  if (!(pixelMap instanceof Map)) {
    throw new Error("Invalid SpongeBob pixel frame");
  }

  const rgbMap = new Map();
  const pixels = [];
  for (let y = 0; y < PANEL_H; y += 1) {
    for (let x = 0; x < PANEL_W; x += 1) {
      const key = `${x},${y}`;
      const colorText = pixelMap.get(key);
      if (colorText === undefined) {
        throw new Error(`Missing pixel: ${key}`);
      }
      const rgb = parseHexColor(colorText);
      rgbMap.set(key, rgb);
      pixels.push([x, y, rgb.r, rgb.g, rgb.b]);
    }
  }
  return { rgbMap, pixels };
}

function buildDiffPixels(previousRgbMap, currentRgbMap) {
  const pixels = [];
  for (let y = 0; y < PANEL_H; y += 1) {
    for (let x = 0; x < PANEL_W; x += 1) {
      const key = `${x},${y}`;
      const previous = previousRgbMap.get(key);
      const current = currentRgbMap.get(key);
      if (previous === undefined || current === undefined) {
        throw new Error(`Missing diff pixel: ${key}`);
      }
      if (
        previous.r !== current.r ||
        previous.g !== current.g ||
        previous.b !== current.b
      ) {
        pixels.push([x, y, current.r, current.g, current.b]);
      }
    }
  }
  return pixels;
}

function mapToCompactFrame(type, delay, pixels) {
  return [type, delay, pixels.length, pixels];
}

function isSleepHoldState(state) {
  return (
    state.programId === "sleep" &&
    state.segmentIndex === 2 &&
    state.left.completedPasses >= state.left.passesNeeded &&
    state.right.completedPasses >= state.right.passesNeeded
  );
}

function buildTimeText() {
  const now = new Date();
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

const ControlRange = {
  props: {
    label: { type: String, required: true },
    value: { type: Number, required: true },
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    step: { type: Number, required: true },
    suffix: { type: String, required: true },
  },
  emits: ["input"],
  computed: {
    valueText() {
      return `${this.value}${this.suffix}`;
    },
  },
  methods: {
    handleInput(event) {
      this.$emit("input", Number(event.target.value));
    },
  },
  render() {
    return h("label", { class: "control-range" }, [
      h("span", { class: "control-range__head" }, [
        h("span", this.label),
        h("strong", this.valueText),
      ]),
      h("input", {
        class: "control-range__input",
        type: "range",
        min: this.min,
        max: this.max,
        step: this.step,
        value: this.value,
        onInput: this.handleInput,
      }),
    ]);
  },
};

const ToggleRow = {
  props: {
    label: { type: String, required: true },
    active: { type: Boolean, required: true },
  },
  emits: ["click"],
  render() {
    return h("div", { class: "toggle-row" }, [
      h("span", this.label),
      h(
        "button",
        {
          class: ["toggle-btn", { active: this.active }],
          type: "button",
          onClick: () => this.$emit("click"),
        },
        this.active ? "开启" : "关闭",
      ),
    ]);
  },
};

export default {
  name: "SpongeBobClock",
  mixins: [uniLifecycleAdapter, statusBarMixin, deviceSendUxMixin],
  components: {
    ControlRange,
    ToggleRow,
    Icon,
    Toast,
    PixelPreviewBoard,
  },
  data() {
    return {
      deviceStore: null,
      toast: null,
      assets: null,
      sceneState: null,
      previewPixels: new Map(),
      previewTick: 0,
      previewZoom: 4,
      previewOffset: { x: 16, y: 16 },
      previewContainerSize: { width: 320, height: 320 },
      previewCanvasReady: false,
      isLoading: true,
      animHandle: null,
      clockHandle: null,
      contentHeight: "calc(100vh - 112rpx - 120rpx - 80rpx)",
      currentTab: 1,
      timeFontTab: 1,
      programOptions: SPONGEBOB_PROGRAMS,
      tabDefinitions: [
        { index: 1, label: "流程", icon: "refresh" },
        { index: 2, label: "角色", icon: "user" },
        { index: 3, label: "时间", icon: "time" },
        { index: 4, label: "状态", icon: "setting" },
      ],
      config: {
        programId: "duo",
        frameInterval: 180,
        spongebobX: 15,
        spongebobY: 60,
        spongebobScale: 0.75,
        patrickX: 51,
        patrickY: 60,
        patrickScale: 0.75,
        bg1X: 0,
        bg1Y: 51,
        bg1Scale: 1,
        showTime: true,
        timeX: 32,
        timeY: 4,
        timeFontId: "lcd_6x8",
        timeFontScale: 1,
        timeAlign: "center",
        timeText: "00:00",
      },
    };
  },
  computed: {
    selectedProgramName() {
      const program = this.programOptions.find((item) => item.id === this.config.programId);
      if (program) {
        return program.name;
      }
      throw new Error(`缺少流程选项: ${this.config.programId}`);
    },
    statusDetail() {
      if (this.assets && this.sceneState) {
        return getSpongeBobStatus(this.assets.characterData, this.sceneState);
      }
      return EMPTY_STATUS;
    },
    statusText() {
      return `${this.statusDetail.segment} · ${this.statusDetail.left} / ${this.statusDetail.right}`;
    },
    previewCanvasBoxStyle() {
      return { height: `${this.previewContainerSize.height}px` };
    },
  },
  watch: {
    "config.programId"() {
      this.sceneState = createInitialSpongeBobState(this.config.programId);
      this.renderPreview();
    },
    "config.frameInterval"() {
      this.startLoop();
    },
    config: {
      deep: true,
      handler() {
        this.renderPreview();
      },
    },
  },
  async mounted() {
    this.deviceStore = useDeviceStore();
      this.deviceStore.init();
      this.toast = useToast();
      this.config.timeText = buildTimeText();
      this.syncSharedCharacterBasis();

      this.$nextTick(async () => {
      if (this.$refs.toastRef) {
        this.toast.setToastInstance(this.$refs.toastRef);
      }
      this.previewCanvasReady = true;
      this.initPreviewCanvas();

      try {
        this.assets = await loadSpongeBobAssets();
        this.sceneState = createInitialSpongeBobState(this.config.programId);
        this.renderPreview();
        this.startLoop();
        this.startClockTimer();
      } catch (error) {
        console.error("[spongebob] load failed", error);
        this.toast.showError(error.message);
      } finally {
        this.isLoading = false;
      }
    });
  },
  beforeUnmount() {
    this.stopLoop();
    this.stopClockTimer();
  },
  beforeDestroy() {
    this.stopLoop();
    this.stopClockTimer();
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
          query.select(".canvas-section").boundingClientRect((sectionRect) => {
            if (sectionRect && sectionRect.height) {
              const nextHeight = systemInfo.windowHeight - this.statusBarHeight - 88 - sectionRect.height;
              this.contentHeight = `${Math.max(120, nextHeight)}px`;
            }
          });
          query
            .select(".preview-canvas-container")
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
    selectProgram(programId) {
      this.config.programId = programId;
    },
    setConfigValue(field, value) {
      this.config[field] = value;
      if (field === "spongebobY") {
        this.config.spongebobY = value;
        this.config.patrickY = value;
      }
      if (field === "spongebobScale") {
        this.config.spongebobScale = value;
        this.config.patrickScale = value;
      }
    },
    syncSharedCharacterBasis() {
      this.config.patrickY = this.config.spongebobY;
      this.config.patrickScale = this.config.spongebobScale;
    },
    toggleConfigValue(field) {
      this.config[field] = !this.config[field];
    },
    renderPreview() {
      if (!this.assets || !this.sceneState) {
        return;
      }
      this.previewPixels = renderSpongeBobScene(
        this.assets,
        this.sceneState,
        this.config,
      );
      this.previewTick += 1;
    },
    startLoop() {
      this.stopLoop();
      const tick = () => {
        if (this.assets && this.sceneState) {
          this.sceneState = tickSpongeBobScene(
            this.assets.characterData,
            this.sceneState,
            this.config.programId,
          );
          this.renderPreview();
        }
        this.animHandle = setTimeout(tick, this.config.frameInterval);
      };
      this.animHandle = setTimeout(tick, this.config.frameInterval);
    },
    stopLoop() {
      if (this.animHandle) {
        clearTimeout(this.animHandle);
        this.animHandle = null;
      }
    },
    startClockTimer() {
      this.stopClockTimer();
      this.clockHandle = setInterval(() => {
        this.config.timeText = buildTimeText();
      }, 30000);
    },
    stopClockTimer() {
      if (this.clockHandle) {
        clearInterval(this.clockHandle);
        this.clockHandle = null;
      }
    },
    buildSendAnimationFrames() {
      if (!this.assets) {
        throw new Error("SpongeBob assets are not loaded");
      }

      const frames = [];
      let state = createInitialSpongeBobState(this.config.programId);
      let previousRgbMap = null;
      const delay = Math.round(this.config.frameInterval);

      for (let index = 0; index < SPONGEBOB_SEND_FRAME_COUNT; index += 1) {
        const pixels = renderSpongeBobScene(
          this.assets,
          state,
          this.config,
        );
        const denseFrame = buildDenseRgbFrame(pixels);

        if (index === 0) {
          frames.push(mapToCompactFrame(1, delay, denseFrame.pixels));
        } else {
          frames.push(
            mapToCompactFrame(
              0,
              delay,
              buildDiffPixels(previousRgbMap, denseFrame.rgbMap),
            ),
          );
        }

        previousRgbMap = denseFrame.rgbMap;
        if (isSleepHoldState(state)) {
          break;
        }
        state = tickSpongeBobScene(
          this.assets.characterData,
          state,
          this.config.programId,
        );
      }

      if (this.config.programId === "sleep" && frames.length > 0) {
        const holdPixels = [];
        for (let index = 0; index < SPONGEBOB_SLEEP_HOLD_FRAMES; index += 1) {
          frames.push(mapToCompactFrame(0, delay, holdPixels));
        }
      }

      return frames;
    },
    async sendToDevice() {
      if (!this.assets || !this.sceneState) {
        return;
      }
      if (!this.guardBeforeSend(this.deviceStore.connected)) {
        return;
      }

      this.beginSendUi();
      const previousMode = this.deviceStore.deviceMode;
      try {
        const ws = this.deviceStore.getWebSocket();
        const frames = this.buildSendAnimationFrames();
        await applyCompactAnimation(ws, frames, SPONGEBOB_ANIMATION_MODE);
        this.showSendSuccess();
      } catch (error) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode: SPONGEBOB_ANIMATION_MODE,
        });
        console.error("[spongebob] send failed", error);
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
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  overflow: hidden;
}

.status-bar {
  width: 100%;
}

.canvas-section {
  display: flex;
  flex-direction: column;
  background: #000000;
}

.preview-canvas-container {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000000;
}

.preview-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f8f8f8;
  font-size: 24rpx;
  background: rgba(0, 0, 0, 0.62);
}

.preview-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  padding: 10rpx 16rpx 12rpx;
  background: var(--bg-tertiary);
}

.preview-caption-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.preview-caption-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-caption-sub {
  font-size: 20rpx;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.action-btn-sm {
  width: auto;
  min-width: 118rpx;
  height: 64rpx;
  padding: 0 18rpx;
  gap: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--nb-ink);
  background-color: var(--bg-tertiary);
}

.action-btn-sm.primary {
  background-color: var(--nb-yellow);
  border-color: var(--nb-ink);
}

.action-btn-sm text {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.action-btn-sm.primary text {
  color: #000000;
}

.action-btn-sm.disabled {
  opacity: 0.55;
  pointer-events: none;
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
  padding: 0 0 56rpx;
}

.settings-card {
  background: var(--bg-secondary);
  border: 2rpx solid var(--nb-ink);
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.card-title-section {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 12rpx 0 14rpx;
}

.card-title-section:first-child {
  margin-top: 0;
}

.card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.card-meta {
  font-size: 20rpx;
  color: var(--text-secondary);
}

.program-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-bottom: 18rpx;
}

.program-btn {
  padding: 16rpx 8rpx;
  text-align: center;
  border: 2rpx solid var(--nb-ink);
  background: var(--bg-tertiary);
}

.program-btn.active {
  background: var(--nb-yellow);
}

.program-btn span {
  font-size: 24rpx;
  font-weight: 800;
  color: var(--text-primary);
}

.desc-text {
  margin: 14rpx 0 0;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-secondary);
}

.role-section {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding: 14rpx 0;
  border-top: 2rpx solid rgba(0, 0, 0, 0.08);
}

.role-section:first-of-type {
  border-top: 0;
}

.role-title {
  font-size: 26rpx;
  font-weight: 900;
  color: var(--text-primary);
}

.control-range {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.control-range__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;
  color: var(--text-primary);
}

.control-range__head strong {
  font-family: monospace;
  font-size: 24rpx;
}

.control-range__input {
  width: 100%;
}

.font-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16rpx;
  border-bottom: 2rpx solid var(--nb-ink);
}

.font-tab {
  flex: 1;
  padding: 16rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: var(--text-secondary);
  border-bottom: 4rpx solid transparent;
}

.font-tab.active {
  color: var(--text-primary);
  font-weight: 900;
  border-bottom-color: var(--nb-yellow);
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0 16rpx;
  font-size: 24rpx;
  color: var(--text-primary);
}

.toggle-btn {
  padding: 8rpx 22rpx;
  border: 2rpx solid var(--nb-ink);
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.toggle-btn.active {
  background: var(--nb-yellow);
  color: #000000;
  font-weight: 900;
}

.palette-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 10rpx 0;
  font-size: 24rpx;
  color: var(--text-primary);
}

.palette-chip {
  width: 34rpx;
  height: 34rpx;
  border: 2rpx solid var(--nb-ink);
}

.palette-chip--dark {
  background: #21428c;
}

.palette-chip--light {
  background: #5a8cbd;
}

.palette-chip--yellow {
  background: #d6de31;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--text-primary);
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

.bottom-tab-text {
  font-size: 20rpx;
  color: var(--text-secondary);
}

.bottom-tab-item.active .bottom-tab-text {
  color: #000000;
  font-size: 22rpx;
  font-weight: 900;
}
</style>
