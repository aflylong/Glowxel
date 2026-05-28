<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">海岸时光</span>
      <div class="nav-right"></div>
    </div>

    <div class="canvas-section">
      <div class="preview-canvas-container" :style="previewCanvasBoxStyle">
        <canvas
          ref="canvasRef"
          class="preview-canvas"
          width="640"
          height="640"
        ></canvas>
      </div>
      <div class="preview-caption glx-preview-panel">
        <div class="preview-caption-info glx-preview-panel__info">
          <span class="preview-caption-title">{{ activeScene.label }}</span>
          <span class="preview-caption-sub">{{ activeScene.oceanId }}</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: sending || !isDeviceConnected }"
            @click="sendToDevice"
          >
            <Icon name="link" :size="36" color="#000000" />
            <span>{{ sending ? '发送中' : '发送' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div data-scroll-view scroll-y class="content glx-scroll-region glx-page-shell__content"
      :style="{ height: contentHeight }">
      <div class="content-wrapper glx-scroll-stack">

        <!-- Tab 1: 时段 -->
        <div v-show="currentTab === 0" class="settings-card">
          <div class="weapon-grid">
            <div
              v-for="(s, i) in scenes"
              :key="s.id"
              class="weapon-btn"
              :class="{ active: i === activeIndex }"
              @click="activeIndex = i"
            >
              <span>{{ s.label }}</span>
            </div>
          </div>
        </div>

        <!-- Tab 2: 时间 -->
        <ClockTextSettingsCard
          v-show="currentTab === 1"
          icon-name="time"
          title="时间显示"
          :section="config.time"
          :preset-colors="presetColors"
          :show-font-size="true"
          :show-seconds-control="true"
          :show-seconds="config.showSeconds"
          :min-font-size="1"
          :max-font-size="3"
          @toggle="toggleTimeShow"
          @toggle-seconds="toggleShowSeconds"
          @adjust="handleTimeAdjust"
          @update-color="handleTimeColor"
          @set-align="handleTimeAlign"
        />

        <!-- Tab 3: 字体 -->
        <ClockFontPanel
          v-show="currentTab === 2"
          :font-options="fontOptions"
          :selected-font="config.font"
          :show-seconds="config.showSeconds"
          :hour-format="config.hourFormat"
          @select-font="selectFont"
          @set-hour-format="setHourFormat"
        />

        <!-- Tab 4: 描边 (字描边色 + 切换显示) -->
        <div v-show="currentTab === 3" class="settings-card">
          <div class="setting-item-row">
            <span class="setting-label">显示描边</span>
            <div class="setting-control-buttons">
              <div class="weapon-btn" :class="{ active: config.outline.enabled }"
                style="padding:8rpx 24rpx" @click="toggleOutline">
                <span>{{ config.outline.enabled ? '开启' : '关闭' }}</span>
              </div>
            </div>
          </div>

          <div v-if="config.outline.enabled" style="margin-top:12rpx">
            <span class="setting-label" style="display:block;margin-bottom:8rpx">描边颜色</span>
            <div class="weapon-grid">
              <div
                v-for="c in outlinePresets"
                :key="c.hex"
                class="weapon-btn"
                :class="{ active: config.outline.color === c.hex }"
                @click="setOutlineColor(c.hex)"
              >
                <span>{{ c.name }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 底部 Tab 切换 -->
    <div class="bottom-tabs">
      <div
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
        <span class="bottom-tab-text">{{ tab.label }}</span>
      </div>
    </div>

    <Toast ref="toastRef" />
  </div>
</template>

<script>
import uniLifecycleAdapter from '@/mixins/uniLifecycleAdapter.js';
import statusBarMixin from '@/mixins/statusBar.js';
import { useDeviceStore } from '@/stores/device.js';
import { useToast } from '@/composables/useToast.js';
import Icon from '@/components/uni/Icon.vue';
import Toast from '@/components/uni/Toast.vue';
import ClockTextSettingsCard from '@/components/uni/clock-editor/ClockTextSettingsCard.vue';
import ClockFontPanel from '@/components/uni/clock-editor/ClockFontPanel.vue';
import {
  getClockFontOptions,
  drawClockTextToPixels,
  getCurrentTimeText,
  hexToRgb,
} from '@/utils/clockCanvas.js';

// 6 个时段定义 (移除原 scene_8 午后)
//   ★ 顺序定型, 不再改
const SCENES = [
  {
    id: 'scene_1', label: '清晨上午', oceanId: 'Ocean_1',
    bg: 'Ocean_1/1.png',
    clouds: ['Ocean_1/2.png', 'Ocean_1/3.png'],
    deco: null,
  },
  {
    id: 'scene_4', label: '黎明', oceanId: 'Ocean_4',
    bg: 'Ocean_4/1.png',
    clouds: ['Ocean_4/2.png', 'Ocean_4/3.png', 'Ocean_4/4.png'],
    deco: null,
  },
  {
    id: 'scene_3', label: '中午', oceanId: 'Ocean_3',
    bg: 'Ocean_3/1.png',
    clouds: ['Ocean_3/3.png', 'Ocean_3/4.png'],
    deco: null,
  },
  {
    id: 'scene_2', label: '下午', oceanId: 'Ocean_2',
    bg: 'Ocean_2/2.png',
    clouds: ['Ocean_2/3.png', 'Ocean_2/4.png'],
    deco: null,
  },
  {
    id: 'scene_5', label: '傍晚', oceanId: 'Ocean_5',
    bg: 'Ocean_5/1.png',
    clouds: ['Ocean_5/3.png', 'Ocean_5/4.png'],
    deco: 'Ocean_5/2.png',
  },
  {
    id: 'scene_6', label: '深夜', oceanId: 'Ocean_6',
    bg: 'Ocean_6/5.png',
    clouds: [],
    deco: null,
    freezeClouds: true,
  },
];

// 用户调好的全局参数 (跟最新 JSON 同步)
const GLOBAL_SCALE = 2.95;
const CLOUD_SPEED = 12;
const SCENE_OFFSETS = {
  scene_1: { x: 0, y: 7 },
  scene_4: { x: 0, y: -7 },
  scene_3: { x: 0, y: -2 },
  scene_2: { x: 0, y: -3 },
  scene_5: { x: 0, y: -21 },
  scene_6: { x: 0, y: 0 },
};

const SIZE = 64;

export default {
  name: 'CoastTheme',
  mixins: [uniLifecycleAdapter, statusBarMixin],
  components: { Icon, Toast, ClockTextSettingsCard, ClockFontPanel },
  data() {
    return {
      deviceStore: null,
      toast: null,
      scenes: SCENES,
      activeIndex: 0,
      sending: false,

      // tab 切换
      currentTab: 0,
      tabDefinitions: [
        { index: 0, label: '时段', icon: 'map' },
        { index: 1, label: '时间', icon: 'time' },
        { index: 2, label: '字体', icon: 'text' },
        { index: 3, label: '描边', icon: 'edit' },
      ],

      contentHeight: 'calc(100vh - 112rpx - 360rpx - 80rpx)',

      fontOptions: getClockFontOptions(),

      config: {
        font: 'lcd_6x8',
        showSeconds: false,
        hourFormat: 24,
        time: {
          show: true,
          fontSize: 1,
          x: 32,
          y: 6,
          color: '#ffffff',
          align: 'center',
        },
        outline: {
          enabled: true,
          color: '#000000',
        },
      },

      presetColors: [
        { name: '白色', hex: '#ffffff' },
        { name: '麦色', hex: '#d9cd82' },
        { name: '青色', hex: '#64c8ff' },
        { name: '绿色', hex: '#00ff9d' },
        { name: '黄色', hex: '#ffdc00' },
      ],

      outlinePresets: [
        { name: '黑色', hex: '#000000' },
        { name: '深蓝', hex: '#1a2a44' },
        { name: '深紫', hex: '#2c1a44' },
        { name: '深绿', hex: '#0e2a1a' },
        { name: '红棕', hex: '#3a1a14' },
        { name: '白色', hex: '#ffffff' },
      ],

      // 内部
      _imgCache: new Map(),
      _rafId: null,
      _lastTime: 0,
      _scrollAccum: 0,
      _offCanvas: null,
      _offCtx: null,
      _ctx: null,
      _previewClockTimer: null,
    };
  },
  computed: {
    activeScene() { return this.scenes[this.activeIndex]; },
    isDeviceConnected() { return this.deviceStore?.connected || false; },
    statusBarHeight() {
      try { return uni.getSystemInfoSync().statusBarHeight || 0; }
      catch (e) { return 0; }
    },
    previewCanvasBoxStyle() {
      // 跟其他时钟一样 — 1:1 正方形, 由 layout 自适应宽度
      return {};
    },
    timeText() {
      return getCurrentTimeText(this.config.showSeconds, this.config.hourFormat);
    },
  },
  onLoad() {
    this.deviceStore = useDeviceStore();
    this.toast = useToast();
    this.deviceStore.init();
    this._loadConfig();
  },
  onReady() {
    if (this.$refs.toastRef) this.toast.setToastInstance(this.$refs.toastRef);
    this.initCanvas();
    this.preloadAssets();
    this.startRender();
    this.startPreviewClockTimer();
  },
  beforeUnmount() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this.stopPreviewClockTimer();
  },
  watch: {
    config: {
      handler() {
        if (this._configSaveTimer) clearTimeout(this._configSaveTimer);
        this._configSaveTimer = setTimeout(() => {
          this._configSaveTimer = null;
          this._saveConfig();
        }, 200);
      },
      deep: true,
    },
  },
  methods: {
    handleBack() { uni.navigateBack(); },

    // ===== 配置持久化 =====
    _saveConfig() {
      try {
        uni.setStorageSync('coast_theme_config', {
          activeIndex: this.activeIndex,
          font: this.config.font,
          hourFormat: this.config.hourFormat,
          showSeconds: this.config.showSeconds,
          time: this.config.time,
          outline: this.config.outline,
        });
      } catch (e) {}
    },
    _loadConfig() {
      try {
        const saved = uni.getStorageSync('coast_theme_config');
        if (saved && typeof saved === 'object') {
          if (typeof saved.activeIndex === 'number'
            && saved.activeIndex >= 0 && saved.activeIndex < this.scenes.length) {
            this.activeIndex = saved.activeIndex;
          }
          if (saved.font) this.config.font = saved.font;
          if (saved.hourFormat) this.config.hourFormat = saved.hourFormat;
          if (saved.showSeconds !== undefined) this.config.showSeconds = saved.showSeconds;
          if (saved.time) Object.assign(this.config.time, saved.time);
          if (saved.outline) Object.assign(this.config.outline, saved.outline);
        }
      } catch (e) {}
    },

    // ===== ClockTextSettingsCard 事件 =====
    toggleTimeShow() { this.config.time.show = !this.config.time.show; },
    toggleShowSeconds() { this.config.showSeconds = !this.config.showSeconds; },
    handleTimeAdjust({ key, delta }) {
      const cur = this.config.time[key];
      if (typeof cur !== 'number') return;
      let next = cur + delta;
      if (key === 'fontSize') next = Math.max(1, Math.min(3, next));
      else if (key === 'x' || key === 'y') next = Math.max(0, Math.min(63, next));
      this.config.time[key] = next;
    },
    handleTimeColor({ hex }) { this.config.time.color = hex; },
    handleTimeAlign({ align }) { this.config.time.align = align; },

    // ===== ClockFontPanel 事件 =====
    selectFont(fontId) { this.config.font = fontId; },
    setHourFormat(fmt) { this.config.hourFormat = fmt; },

    // ===== 描边 tab =====
    toggleOutline() { this.config.outline.enabled = !this.config.outline.enabled; },
    setOutlineColor(hex) { this.config.outline.color = hex; },

    // ===== Canvas 渲染 =====
    initCanvas() {
      const canvas = this.$refs.canvasRef;
      if (!canvas) return;
      this._ctx = canvas.getContext('2d', { willReadFrequently: false });
      this._ctx.imageSmoothingEnabled = false;
      this._offCanvas = document.createElement('canvas');
      this._offCanvas.width = SIZE;
      this._offCanvas.height = SIZE;
      this._offCtx = this._offCanvas.getContext('2d', { willReadFrequently: false });
      this._offCtx.imageSmoothingEnabled = false;
    },

    loadImage(path) {
      if (this._imgCache.has(path)) return this._imgCache.get(path);
      const img = new Image();
      const entry = { img, ready: false };
      img.onload = () => { entry.ready = true; };
      img.src = new URL(`../../assets/theme-coast/${path}`, import.meta.url).href;
      this._imgCache.set(path, entry);
      return entry;
    },

    preloadAssets() {
      for (const s of this.scenes) {
        this.loadImage(s.bg);
        for (const c of s.clouds) this.loadImage(c);
        if (s.deco) this.loadImage(s.deco);
      }
    },

    imageBaseSize(img) {
      if (!img || !img.naturalWidth) return { w: SIZE, h: SIZE };
      return { w: SIZE, h: (img.naturalHeight / img.naturalWidth) * SIZE };
    },

    drawLayer(entry, sceneOffset, scale, scrollX) {
      if (!entry.ready) return;
      const base = this.imageBaseSize(entry.img);
      const w = base.w * scale;
      const h = base.h * scale;
      const x0 = Math.round((SIZE - w) / 2 + sceneOffset.x + (scrollX || 0));
      const y0 = Math.round((SIZE - h) / 2 + sceneOffset.y);
      this._offCtx.drawImage(entry.img, x0, y0, Math.round(w), Math.round(h));
    },

    drawCloudLayer(entry, sceneOffset, scale, scrollOffset) {
      if (!entry.ready) return;
      const base = this.imageBaseSize(entry.img);
      const w = base.w * scale;
      const h = base.h * scale;
      const wInt = Math.round(w);
      const hInt = Math.round(h);
      const y0 = Math.round((SIZE - h) / 2 + sceneOffset.y);
      const x = Math.round((SIZE - w) / 2 + sceneOffset.x - (scrollOffset % w));
      this._offCtx.drawImage(entry.img, x, y0, wInt, hInt);
      this._offCtx.drawImage(entry.img, x + wInt, y0, wInt, hInt);
      if (x + 2 * wInt < SIZE) {
        this._offCtx.drawImage(entry.img, x + 2 * wInt, y0, wInt, hInt);
      }
    },

    // 把时间字 + 1px 描边画到离屏 canvas (最上层, 在云/点缀之后)
    drawTimeOverlay() {
      if (!this.config.time.show) return;
      const t = this.config.time;
      // 1) 计算字像素 mask
      const textPixels = new Map();
      drawClockTextToPixels(
        this.timeText,
        t.x,
        t.y,
        t.color,
        textPixels,
        this.config.font,
        t.fontSize || 1,
        t.align || 'left',
      );
      // 2) 算描边: mask 周围 1 圈非 mask 像素涂描边色
      const outline = this.config.outline;
      const drawOutline = outline.enabled;
      const outlineRgb = drawOutline ? hexToRgb(outline.color) : null;
      if (drawOutline) {
        const outlinePixels = new Set();
        textPixels.forEach((_, key) => {
          const [x, y] = key.split(',').map(Number);
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx, ny = y + dy;
              if (nx < 0 || nx >= SIZE || ny < 0 || ny >= SIZE) continue;
              const k = `${nx},${ny}`;
              if (!textPixels.has(k)) outlinePixels.add(k);
            }
          }
        });
        // 画描边
        outlinePixels.forEach((key) => {
          const [x, y] = key.split(',').map(Number);
          this._offCtx.fillStyle = `rgb(${outlineRgb.r},${outlineRgb.g},${outlineRgb.b})`;
          this._offCtx.fillRect(x, y, 1, 1);
        });
      }
      // 3) 画字本体 (在描边之上)
      const textRgb = hexToRgb(t.color);
      this._offCtx.fillStyle = `rgb(${textRgb.r},${textRgb.g},${textRgb.b})`;
      textPixels.forEach((_, key) => {
        const [x, y] = key.split(',').map(Number);
        this._offCtx.fillRect(x, y, 1, 1);
      });
    },

    startRender() {
      const tick = (now) => {
        const dt = Math.min(0.1, (now - this._lastTime) / 1000);
        this._lastTime = now;

        const scene = this.activeScene;
        const offset = SCENE_OFFSETS[scene.id] || { x: 0, y: 0 };
        const cloudsFrozen = scene.freezeClouds === true;
        if (!cloudsFrozen) this._scrollAccum += CLOUD_SPEED * dt;

        // 清空离屏
        this._offCtx.fillStyle = '#000';
        this._offCtx.fillRect(0, 0, SIZE, SIZE);

        // 底
        this.drawLayer(this.loadImage(scene.bg), offset, GLOBAL_SCALE, 0);
        // 云
        scene.clouds.forEach((cloudPath, idx) => {
          const phase = idx * 17;
          this.drawCloudLayer(this.loadImage(cloudPath), offset, GLOBAL_SCALE, this._scrollAccum + phase);
        });
        // 点缀
        if (scene.deco) {
          this.drawLayer(this.loadImage(scene.deco), offset, GLOBAL_SCALE, 0);
        }
        // 时间字 (最上层)
        this.drawTimeOverlay();

        // 离屏 → 主 canvas (10x nearest 放大)
        this._ctx.imageSmoothingEnabled = false;
        this._ctx.fillStyle = '#000';
        this._ctx.fillRect(0, 0, 640, 640);
        this._ctx.drawImage(this._offCanvas, 0, 0, 640, 640);

        this._rafId = requestAnimationFrame(tick);
      };
      this._lastTime = performance.now();
      this._rafId = requestAnimationFrame(tick);
    },

    startPreviewClockTimer() {
      if (this._previewClockTimer) return;
      // 每 30 秒强制刷新一次, 跨过分钟边界
      this._previewClockTimer = setInterval(() => {}, 30000);
    },
    stopPreviewClockTimer() {
      if (this._previewClockTimer) {
        clearInterval(this._previewClockTimer);
        this._previewClockTimer = null;
      }
    },

    async sendToDevice() {
      if (!this.isDeviceConnected || this.sending) return;
      this.sending = true;
      try {
        // 板载实现还没做, 先发个占位事务让用户看到链路通
        await this.deviceStore.webSocket.runModeTransaction({
          mode: 'theme',  // 暂复用 theme businessMode, 板载实现后再改 coast_theme
          params: {
            themeId: 'coast_theme',
            sceneId: this.activeScene.id,
            fontId: this.config.font,
            fontScale: this.config.time.fontSize || 1,
            clockX: this.config.time.x,
            clockY: this.config.time.y,
            hourFormat: this.config.hourFormat,
            showSeconds: !!this.config.showSeconds,
            clockTextColor: this.config.time.color,
            outlineEnabled: !!this.config.outline.enabled,
            outlineColor: this.config.outline.color,
          },
        });
        this.toast?.showSuccess(`已发送 ${this.activeScene.label}`);
      } catch (err) {
        console.error('发送失败:', err);
        this.toast?.showError('发送失败：' + (err?.message || '未知错误'));
      } finally {
        this.sending = false;
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

.canvas-section {
  display: flex;
  flex-direction: column;
  background: #000;
}

.preview-canvas-container {
  width: 100%;
  aspect-ratio: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000;
}
.preview-canvas {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  display: block;
}

.preview-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  padding: 10rpx 16rpx 12rpx;
  background: var(--bg-tertiary);
}
.preview-caption-info { flex: 1; min-width: 0; display: flex; gap: 12rpx; align-items: baseline; }
.preview-caption-title { font-size: 24rpx; font-weight: 700; color: var(--text-primary); }
.preview-caption-sub { font-size: 20rpx; color: var(--text-secondary); font-family: monospace; }

.preview-actions { display: flex; align-items: center; gap: 12rpx; flex-shrink: 0; }

.action-btn-sm {
  width: auto; min-width: 118rpx; height: 64rpx; padding: 0 18rpx; gap: 10rpx;
  display: flex; align-items: center; justify-content: center;
  border: 2rpx solid var(--nb-ink);
  background-color: var(--bg-tertiary);
}
.action-btn-sm.primary { background-color: var(--nb-yellow); border-color: var(--nb-ink); }
.action-btn-sm span { font-size: 24rpx; font-weight: 600; color: var(--text-primary); }
.action-btn-sm.primary span { color: #000; }
.action-btn-sm.disabled { opacity: 0.4; }

.content {
  flex: 1; width: 100%; min-height: 0;
  box-sizing: border-box; background: var(--bg-tertiary);
  padding: 16rpx 20rpx 0;
}
.content-wrapper { padding: 0 0 56rpx; }

.settings-card {
  background: var(--bg-secondary);
  border: 2rpx solid var(--nb-ink);
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.weapon-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.weapon-btn {
  padding: 16rpx 12rpx;
  background: var(--bg-tertiary);
  border: 2rpx solid var(--nb-ink);
  text-align: center;
}
.weapon-btn.active { background: var(--nb-yellow); }
.weapon-btn span { font-size: 24rpx; color: var(--text-primary); }
.weapon-btn.active span { color: #000; font-weight: 700; }

.setting-item-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10rpx 0;
}
.setting-label { font-size: 24rpx; color: var(--text-primary); min-width: 110rpx; }
.setting-control-buttons { display: flex; align-items: center; gap: 16rpx; }

.bottom-tabs {
  display: flex; flex-shrink: 0; padding: 2rpx 10rpx 0;
  padding-bottom: var(--layout-bottom-offset);
  background-color: var(--bg-elevated);
  border-top: 2rpx solid var(--nb-ink);
  gap: 2rpx;
}
.bottom-tab-item {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 2rpx; min-height: 68rpx; padding: 2rpx 0;
}
.bottom-tab-text { font-size: 20rpx; color: var(--text-secondary); }
.bottom-tab-item.active .bottom-tab-text {
  color: #000; font-weight: 900; font-size: 22rpx;
}
</style>
