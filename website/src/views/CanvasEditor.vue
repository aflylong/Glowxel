<template>
  <div class="canvas-editor-page glx-page-shell game-mode-page">
    <PcModeTopbar title="鐢绘澘妯″紡" />

    <section class="canvas-editor-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack canvas-editor-preview-card game-preview-card"
      >
        <div class="canvas-editor-preview-card__head">
          <div>
            <p class="canvas-editor-preview-card__eyebrow">Device Mode</p>
            <h2 class="canvas-editor-preview-card__title">64x64 鐢绘澘棰勮</h2>
            <p class="canvas-editor-preview-card__desc">
              宸︿晶缁熶竴淇濈暀棰勮銆佸彂閫佸拰鎽樿淇℃伅锛屽師鏉ョ殑鐢诲竷缂栬緫銆佺缉鏀俱€佹嫋鍔ㄥ拰鍙戦€侀€昏緫涓嶅彉銆?            </p>
          </div>
          <span class="glx-chip glx-chip--blue">64 x 64</span>
        </div>

        <div class="canvas-editor-preview-toolbar">
          <div class="canvas-editor-preview-actions">
            <button
              type="button"
              class="glx-button glx-button--primary canvas-editor-send-button"
              :disabled="isSending"
              @click="publishCanvas"
            >
              {{ isSending ? "鍙戦€佷腑..." : "鍙戦€佸埌璁惧" }}
            </button>
            <button
              type="button"
              class="glx-button glx-button--ghost"
              @click="handleFit"
            >
              閫傞厤
            </button>
          </div>

          <div class="canvas-editor-preview-chips">
            <span
              class="glx-chip"
              :class="deviceStore.connected ? 'glx-chip--green' : 'glx-chip--yellow'"
            >
              {{ deviceStore.connected ? "已连接" : "未连接" }}
            </span>
            <span class="glx-chip glx-chip--blue">{{ currentToolLabel }}</span>
          </div>
        </div>

        <div class="canvas-editor-preview-stage game-preview-stage">
          <div ref="stageRef" class="canvas-editor-stage">
            <canvas
              ref="canvasRef"
              class="canvas-editor-stage__canvas"
              :class="{
                'canvas-editor-stage__canvas--drag': currentTool === 'move',
              }""
              @pointerdown="handlePointerDown"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerUp"
              @pointerleave="handlePointerUp"
              @pointercancel="handlePointerUp"
              @wheel.prevent="handleWheel"
            ></canvas>
            <DeviceSendingOverlay
              :visible="isSending"
              title="正在发送画板像素"
              description="发送期间锁定当前 64x64 快照，等待设备完成画板模式切换和稀疏像素写入。"
            >
              <DevicePixelBoard :pixels="sendingPixels" :grid-visible="true" />
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="canvas-editor-summary-grid">
          <article class="canvas-editor-summary-card">
            <span class="canvas-editor-summary-card__label">宸蹭笂鑹插儚绱?</span>
            <strong class="canvas-editor-summary-card__value">{{ coloredPixelCount }}</strong>
            <span class="canvas-editor-summary-card__meta">褰撳墠鐢诲竷闈炵┖鍍忕礌鏁伴噺</span>
          </article>
          <article class="canvas-editor-summary-card">
            <span class="canvas-editor-summary-card__label">褰撳墠缂╂斁</span>
            <strong class="canvas-editor-summary-card__value">{{ zoom }}x</strong>
            <span class="canvas-editor-summary-card__meta">婊氳疆鍜屽揩鎹锋寜閽悓姝ョ敓鏁?</span>
          </article>
          <article class="canvas-editor-summary-card">
            <span class="canvas-editor-summary-card__label">鎷栧姩鍋忕Щ</span>
            <strong class="canvas-editor-summary-card__value">{{ panText }}</strong>
            <span class="canvas-editor-summary-card__meta">鎷栧姩鐢诲竷鏃舵洿鏂板綋鍓嶈鍙?</span>
          </article>
          <article class="canvas-editor-summary-card">
            <span class="canvas-editor-summary-card__label">涓氬姟妯″紡</span>
            <strong class="canvas-editor-summary-card__value">{{ businessModeText }}</strong>
            <span class="canvas-editor-summary-card__meta">{{ storageKey }}</span>
          </article>
        </div>
      </article>

      <div class="canvas-editor-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">妯″紡閰嶇疆</h2>
            <span class="glx-section-meta">鎿嶄綔 / 缁樺埗 / 鐘舵€?</span>
          </div>
          <DeviceModeTabs v-model="currentPanel" :items="panelItems" />
        </article>

        <template v-if="currentPanel === 'actions'">
          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">蹇嵎鎿嶄綔</h2>
              <span class="glx-section-meta">鎾ら攢 / 閲嶅仛 / 瑙嗗浘 / 娓呯┖</span>
            </div>

            <div class="canvas-editor-action-grid">
              <button
                type="button"
                class="canvas-editor-action-btn"
                :disabled="historyIndex <= 0"
                @click="handleUndo"
              >
                鎾ら攢
              </button>
              <button
                type="button"
                class="canvas-editor-action-btn"
                :disabled="historyIndex >= history.length - 1"
                @click="handleRedo"
              >
                閲嶅仛
              </button>
              <button type="button" class="canvas-editor-action-btn" @click="handleZoom(-1)">
                缂╁皬
              </button>
              <button type="button" class="canvas-editor-action-btn" @click="handleZoom(1)">
                鏀惧ぇ
              </button>
              <button type="button" class="canvas-editor-action-btn" @click="handleFit">
                閫傞厤
              </button>
              <button
                type="button"
                class="canvas-editor-action-btn canvas-editor-action-btn--danger"
                @click="clearCanvas"
              >
                娓呯┖
              </button>
            </div>
          </article>

          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">鎿嶄綔璇存槑</h2>
              <span class="glx-section-meta">淇濈暀鍘熸湁鐢诲竷浜や簰</span>
            </div>

            <div class="canvas-editor-note-grid">
              <div class="canvas-editor-note-card">
                <strong>鎷栧姩妯″紡</strong>
                <p>鍒囧埌鎷栧姩宸ュ叿鍚庡彲绉诲姩瑙嗗彛锛屾柟渚挎鏌ヨ竟缂樼粯鍒跺尯鍩熴€?</p>
              </div>
              <div class="canvas-editor-note-card">
                <strong>鍙戦€侀€昏緫</strong>
                <p>鍙戦€佹椂浠嶄娇鐢ㄥ綋鍓?64脳64 绋€鐤忓儚绱犲揩鐓э紝涓嶆敼涓氬姟閾捐矾銆?</p>
              </div>
            </div>
          </article>
        </template>

        <template v-else-if="currentPanel === 'draw'">
          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">缁樺埗宸ュ叿</h2>
              <span class="glx-section-meta">鎷栧姩 / 缁樼敾 / 鎿﹂櫎</span>
            </div>

            <DeviceModeTabs v-model="currentTool" :items="toolItems" />
          </article>

          <article
            v-if="currentTool !== 'move'"
            class="glx-section-card glx-section-card--stack"
          >
            <div class="glx-section-head">
              <h2 class="glx-section-title">绗旇Е澶у皬</h2>
              <span class="glx-section-meta">涓庣Щ鍔ㄧ淇濇寔鍚屼竴瑙勬牸</span>
            </div>

            <DeviceModeTabs v-model="brushSize" :items="brushSizeItems" />
          </article>

          <article
            v-if="currentTool !== 'move'"
            class="glx-section-card glx-section-card--stack"
          >
            <div class="glx-section-head">
              <h2 class="glx-section-title">鐢荤瑪棰滆壊</h2>
              <span class="glx-section-meta">鏈湴缂撳瓨鐢诲竷鏁版嵁</span>
            </div>

            <div class="canvas-editor-color-row">
              <label class="canvas-editor-color-picker">
                <span class="canvas-editor-color-picker__label">褰撳墠棰滆壊</span>
                <input
                  type="color"
                  :value="selectedColor"
                  class="canvas-editor-color-picker__input"
                  @input="handleNativeColorInput($event.target.value)"
                />
              </label>

              <div class="canvas-editor-color-code">
                <span class="canvas-editor-color-code__label">棰滆壊鍊?</span>
                <strong class="canvas-editor-color-code__value">{{ selectedColor }}</strong>
              </div>
            </div>

            <DeviceColorSwatches v-model="selectedColor" :items="presetColors" />
          </article>
        </template>

        <template v-else>
          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">褰撳墠鐘舵€?</h2>
              <span class="glx-section-meta">鏈湴缂撳瓨宸插惎鐢?</span>
            </div>

            <div class="glx-kv-grid">
              <div class="glx-kv-card">
                <span class="glx-kv-card__label">鏈湴缂撳瓨閿?</span>
                <strong class="glx-kv-card__value">{{ storageKey }}</strong>
              </div>
              <div class="glx-kv-card">
                <span class="glx-kv-card__label">鐢诲竷灏哄</span>
                <strong class="glx-kv-card__value">64 脳 64</strong>
              </div>
              <div class="glx-kv-card">
                <span class="glx-kv-card__label">鎷栧姩鍋忕Щ</span>
                <strong class="glx-kv-card__value">{{ panText }}</strong>
              </div>
              <div class="glx-kv-card">
                <span class="glx-kv-card__label">褰撳墠宸ュ叿</span>
                <strong class="glx-kv-card__value">{{ currentToolLabel }}</strong>
              </div>
            </div>
          </article>

          <article class="glx-section-card glx-section-card--stack">
            <div class="glx-section-head">
              <h2 class="glx-section-title">鍙戦€佺姸鎬?</h2>
              <span class="glx-section-meta">璁惧杩炴帴涓庢ā寮忓悓姝?</span>
            </div>

            <div class="canvas-editor-note-grid">
              <div class="canvas-editor-note-card">
                <strong>杩炴帴鐘舵€?</strong>
                <p>{{ deviceStore.connected ? "设备已连接，可以直接发送画板。" : "当前未连接，发送前需要先连接设备。" }}</p>
              </div>
              <div class="canvas-editor-note-card">
                <strong>涓氬姟妯″紡</strong>
                <p>{{ businessModeText }}</p>
              </div>
            </div>
          </article>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import DeviceSendingOverlay from "@/components/device/DeviceSendingOverlay.vue";
import DevicePixelBoard from "@/components/device/modes/DevicePixelBoard.vue";
import DeviceColorSwatches from "@/components/device/modes/DeviceColorSwatches.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import { useFeedback } from "@/composables/useFeedback.js";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { hexToRgb, normalizeHexColor, readStorageJson, writeStorageJson } from "@/utils/device-mode-core.js";

const PANEL_SIZE = 64;
const HISTORY_LIMIT = 50;
const MIN_ZOOM = 2;
const MAX_ZOOM = 20;
const CANVAS_PIXELS_KEY = "canvas_mode_pixels";

const toolItems = Object.freeze([
  { value: "move", label: "鎷栧姩" },
  { value: "pencil", label: "缁樼敾" },
  { value: "eraser", label: "鎿﹂櫎" },
]);

const brushSizeItems = Object.freeze([
  { value: 1, label: "1x1" },
  { value: 2, label: "2x2" },
  { value: 3, label: "3x3" },
  { value: 4, label: "4x4" },
]);

const panelItems = Object.freeze([
  { value: "actions", label: "鎿嶄綔" },
  { value: "draw", label: "缁樺埗" },
  { value: "status", label: "状态" },
]);

const presetColors = Object.freeze([
  { label: "鍐拌摑", value: "#64c8ff" },
  { label: "浜粍", value: "#ffd23f" },
  { label: "姗樼孩", value: "#ff8454" },
  { label: "钖勮嵎", value: "#67d7a5" },
  { label: "绱矇", value: "#d57cff" },
  { label: "鐧借壊", value: "#ffffff" },
  { label: "娣辫摑", value: "#356dff" },
  { label: "鏆栫孩", value: "#ff5f6d" },
]);

const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();

const stageRef = ref(null);
const canvasRef = ref(null);
const pixels = ref(new Map());
const history = ref([]);
const historyIndex = ref(-1);
const currentPanel = ref("actions");
const currentTool = ref("pencil");
const brushSize = ref(1);
const selectedColor = ref("#64c8ff");
const zoom = ref(4);
const pan = reactive({ x: 0, y: 0 });
const viewport = reactive({ width: 0, height: 0 });
const isSending = ref(false);
const sendingPixels = ref(new Map());

const moveState = reactive({
  active: false,
  startClientX: 0,
  startClientY: 0,
  startPanX: 0,
  startPanY: 0,
});

const drawState = reactive({
  active: false,
  dirty: false,
});

let strokePixels = null;
let resizeObserver = null;

const storageKey = CANVAS_PIXELS_KEY;

const coloredPixelCount = computed(() => {
  return pixels.value.size;
});

const businessModeText = computed(() => {
  if (typeof deviceStore.businessMode === "string" && deviceStore.businessMode.length > 0) {
    return deviceStore.businessMode;
  }
  return "--";
});

const panText = computed(() => {
  return `${Math.round(pan.x)}, ${Math.round(pan.y)}`;
});

const currentToolLabel = computed(() => {
  const matched = toolItems.find((item) => item.value === currentTool.value);
  if (matched) {
    return matched.label;
  }
  return "--";
});

watch(
  pixels,
  () => {
    renderCanvas();
  },
  { deep: true },
);

watch(
  () => zoom.value,
  () => {
    renderCanvas();
  },
);

watch(
  () => [pan.x, pan.y],
  () => {
    renderCanvas();
  },
);

watch(
  selectedColor,
  (value) => {
    selectedColor.value = normalizeHexColor(value);
  },
);

onMounted(async () => {
  loadPixels();
  deviceStore.init();

  try {
    await deviceStore.restoreConnection();
  } catch (error) {
    // 淇濇寔绂荤嚎缂栬緫锛屼笉闃绘柇椤甸潰鎵撳紑
  }

  if (deviceStore.connected) {
    try {
      await deviceStore.syncDeviceStatus();
    } catch (error) {
      // Keep current local state.
    }
  }

  await nextTick();
  setupResizeObserver();
  renderCanvas();
});

onBeforeUnmount(() => {
  teardownResizeObserver();
});

function loadPixels() {
  const savedPixels = readStorageJson(CANVAS_PIXELS_KEY);
  if (Array.isArray(savedPixels)) {
    pixels.value = new Map(savedPixels);
  } else {
    pixels.value = new Map();
  }
  history.value = [new Map(pixels.value)];
  historyIndex.value = 0;
}

function persistPixels() {
  writeStorageJson(CANVAS_PIXELS_KEY, Array.from(pixels.value.entries()));
}

function pushHistory(nextPixels) {
  const nextHistory = history.value.slice(0, historyIndex.value + 1);
  nextHistory.push(new Map(nextPixels));
  if (nextHistory.length > HISTORY_LIMIT) {
    nextHistory.shift();
  }
  history.value = nextHistory;
  historyIndex.value = nextHistory.length - 1;
}

function setupResizeObserver() {
  const target = stageRef.value;
  if (target === null) {
    return;
  }

  if (typeof ResizeObserver === "undefined") {
    measureViewport();
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    measureViewport();
  });
  resizeObserver.observe(target);
  measureViewport();
}

function teardownResizeObserver() {
  if (resizeObserver !== null) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
}

function measureViewport() {
  const target = stageRef.value;
  if (target === null) {
    return;
  }

  const nextWidth = Math.max(240, Math.floor(target.clientWidth));
  const nextHeight = Math.max(240, Math.floor(target.clientHeight));
  viewport.width = nextWidth;
  viewport.height = nextHeight;
  handleFit();
}

function handleFit() {
  if (viewport.width <= 0 || viewport.height <= 0) {
    return;
  }

  const fitZoomWidth = Math.floor((viewport.width * 0.96) / PANEL_SIZE);
  const fitZoomHeight = Math.floor((viewport.height * 0.96) / PANEL_SIZE);
  const fitZoom = Math.min(fitZoomWidth, fitZoomHeight, MAX_ZOOM);
  zoom.value = Math.max(MIN_ZOOM, fitZoom);
  pan.x = Math.round((viewport.width - PANEL_SIZE * zoom.value) / 2);
  pan.y = Math.round((viewport.height - PANEL_SIZE * zoom.value) / 2);
  renderCanvas();
}

function handleZoom(delta) {
  const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.value + delta));
  if (nextZoom === zoom.value) {
    return;
  }

  const centerX = viewport.width / 2;
  const centerY = viewport.height / 2;
  const scale = nextZoom / zoom.value;
  pan.x = centerX - (centerX - pan.x) * scale;
  pan.y = centerY - (centerY - pan.y) * scale;
  zoom.value = nextZoom;
  renderCanvas();
}

function renderCanvas() {
  const canvas = canvasRef.value;
  if (canvas === null || viewport.width <= 0 || viewport.height <= 0) {
    return;
  }

  const dpr = globalThis.devicePixelRatio || 1;
  const width = viewport.width;
  const height = viewport.height;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext("2d");
  if (context === null) {
    return;
  }

  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);

  context.save();
  context.beginPath();
  context.rect(0, 0, width, height);
  context.clip();

  const cellSize = zoom.value;
  const boardWidth = PANEL_SIZE * cellSize;
  const boardHeight = PANEL_SIZE * cellSize;
  const startX = pan.x;
  const startY = pan.y;

  context.fillStyle = "#000000";
  context.fillRect(startX, startY, boardWidth, boardHeight);

  pixels.value.forEach((color, key) => {
    if (typeof color !== "string" || typeof key !== "string") {
      return;
    }
    const parts = key.split(",");
    if (parts.length !== 2) {
      return;
    }
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      return;
    }

    context.fillStyle = color;
    context.fillRect(
      Math.round(startX + x * cellSize),
      Math.round(startY + y * cellSize),
      Math.ceil(cellSize),
      Math.ceil(cellSize),
    );
  });

  context.strokeStyle = "rgba(255,255,255,0.08)";
  context.lineWidth = 1;
  for (let index = 0; index <= PANEL_SIZE; index += 1) {
    const offsetX = Math.round(startX + index * cellSize) + 0.5;
    context.beginPath();
    context.moveTo(offsetX, startY);
    context.lineTo(offsetX, startY + boardHeight);
    context.stroke();

    const offsetY = Math.round(startY + index * cellSize) + 0.5;
    context.beginPath();
    context.moveTo(startX, offsetY);
    context.lineTo(startX + boardWidth, offsetY);
    context.stroke();
  }

  context.strokeStyle = "#ffffff";
  context.strokeRect(
    Math.round(startX) + 0.5,
    Math.round(startY) + 0.5,
    Math.round(boardWidth),
    Math.round(boardHeight),
  );
  context.restore();
}

function resolveBoardCell(event) {
  const canvas = canvasRef.value;
  if (canvas === null) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const boardX = Math.floor((localX - pan.x) / zoom.value);
  const boardY = Math.floor((localY - pan.y) / zoom.value);

  if (
    !Number.isInteger(boardX) ||
    !Number.isInteger(boardY) ||
    boardX < 0 ||
    boardX >= PANEL_SIZE ||
    boardY < 0 ||
    boardY >= PANEL_SIZE
  ) {
    return null;
  }

  return { x: boardX, y: boardY };
}

function handlePointerDown(event) {
  if (event.button !== 0) {
    return;
  }

  if (canvasRef.value !== null) {
    canvasRef.value.setPointerCapture(event.pointerId);
  }

  if (currentTool.value === "move") {
    moveState.active = true;
    moveState.startClientX = event.clientX;
    moveState.startClientY = event.clientY;
    moveState.startPanX = pan.x;
    moveState.startPanY = pan.y;
    return;
  }

  drawState.active = true;
  drawState.dirty = false;
  strokePixels = new Map(pixels.value);
  applyBrushFromEvent(event);
}

function handlePointerMove(event) {
  if (moveState.active) {
    const deltaX = event.clientX - moveState.startClientX;
    const deltaY = event.clientY - moveState.startClientY;
    pan.x = moveState.startPanX + deltaX;
    pan.y = moveState.startPanY + deltaY;
    renderCanvas();
    return;
  }

  if (drawState.active) {
    applyBrushFromEvent(event);
  }
}

function handlePointerUp(event) {
  if (canvasRef.value !== null && canvasRef.value.hasPointerCapture(event.pointerId)) {
    canvasRef.value.releasePointerCapture(event.pointerId);
  }

  if (moveState.active) {
    moveState.active = false;
  }

  if (!drawState.active) {
    return;
  }

  drawState.active = false;
  if (drawState.dirty) {
    pushHistory(pixels.value);
    persistPixels();
  }
  drawState.dirty = false;
  strokePixels = null;
}

function applyBrushFromEvent(event) {
  const cell = resolveBoardCell(event);
  if (cell === null || strokePixels === null) {
    return;
  }

  const changed = applyBrushToMap(strokePixels, cell.x, cell.y);
  if (!changed) {
    return;
  }

  drawState.dirty = true;
  pixels.value = new Map(strokePixels);
  renderCanvas();
}

function applyBrushToMap(targetMap, x, y) {
  const startX = x - Math.floor((brushSize.value - 1) / 2);
  const startY = y - Math.floor((brushSize.value - 1) / 2);
  let changed = false;

  for (let offsetX = 0; offsetX < brushSize.value; offsetX += 1) {
    for (let offsetY = 0; offsetY < brushSize.value; offsetY += 1) {
      const pixelX = startX + offsetX;
      const pixelY = startY + offsetY;

      if (pixelX < 0 || pixelX >= PANEL_SIZE || pixelY < 0 || pixelY >= PANEL_SIZE) {
        continue;
      }

      const key = `${pixelX},${pixelY}`;
      if (currentTool.value === "eraser") {
        if (targetMap.has(key)) {
          targetMap.delete(key);
          changed = true;
        }
        continue;
      }

      if (targetMap.get(key) === selectedColor.value) {
        continue;
      }
      targetMap.set(key, selectedColor.value);
      changed = true;
    }
  }

  return changed;
}

function handleWheel(event) {
  const direction = event.deltaY > 0 ? -1 : 1;
  handleZoom(direction);
}

function handleUndo() {
  if (historyIndex.value <= 0) {
    return;
  }
  historyIndex.value -= 1;
  pixels.value = new Map(history.value[historyIndex.value]);
  persistPixels();
  renderCanvas();
}

function handleRedo() {
  if (historyIndex.value >= history.value.length - 1) {
    return;
  }
  historyIndex.value += 1;
  pixels.value = new Map(history.value[historyIndex.value]);
  persistPixels();
  renderCanvas();
}

function clearCanvas() {
  if (pixels.value.size === 0) {
    feedback.info("画板已为空", "当前本地画板没有需要清除的像素。");
    return;
  }

  pixels.value = new Map();
  pushHistory(pixels.value);
  persistPixels();
  renderCanvas();
  feedback.info("画板已清空", "本地 64x64 画板已经清空。");
}

function handleNativeColorInput(value) {
  selectedColor.value = normalizeHexColor(value);
}

async function publishCanvas() {
  persistPixels();

  if (!deviceStore.connected) {
    feedback.warning("设备未连接", "已保存到本地，请先返回设备控制页建立连接。");
    return;
  }

  isSending.value = true;
  sendingPixels.value = new Map(pixels.value);
  feedback.showBlocking("发送画板", "正在切换到画板模式并发送当前稀疏像素。");

  try {
    await deviceStore.ensureCanvasMode();
    await deviceStore.sendSparseImage(buildSparsePixels(), PANEL_SIZE, PANEL_SIZE);
    await deviceStore.syncDeviceStatus();
    feedback.success("发送成功", "画板像素已经发送到设备。");
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("发送失败", error.message);
    } else {
      feedback.error("发送失败", "画板像素发送失败。");
    }
  } finally {
    isSending.value = false;
    feedback.hideBlocking();
  }
}

function buildSparsePixels() {
  const sparsePixels = [];
  pixels.value.forEach((color, key) => {
    if (typeof key !== "string" || typeof color !== "string") {
      return;
    }

    const parts = key.split(",");
    if (parts.length !== 2) {
      return;
    }

    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      return;
    }

    const rgb = hexToRgb(color);
    sparsePixels.push(x, y, rgb.r, rgb.g, rgb.b);
  });
  return sparsePixels;
}
</script>

<style scoped>
.canvas-editor-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
  gap: 24px;
}

.canvas-editor-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  align-items: start;
}

.canvas-editor-preview-card {
  gap: 16px;
}

.canvas-editor-preview-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.canvas-editor-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.canvas-editor-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.canvas-editor-preview-card__desc {
  margin: 6px 0 0;
  color: var(--glx-text-muted);
  font-size: 13px;
  line-height: 1.7;
}

.canvas-editor-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.canvas-editor-preview-actions,
.canvas-editor-preview-chips {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.canvas-editor-send-button {
  min-width: 188px;
  min-height: 48px;
}

.canvas-editor-preview-stage {
  padding: 18px;
}

.canvas-editor-stage {
  position: relative;
  width: min(100%, 560px);
  aspect-ratio: 1;
  margin: 0 auto;
  border: 2px solid #000000;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 52%),
    #000000;
  overflow: hidden;
  touch-action: none;
}

.canvas-editor-stage__canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.canvas-editor-stage__canvas--drag {
  cursor: grab;
}

.canvas-editor-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.canvas-editor-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.canvas-editor-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.canvas-editor-summary-card__value {
  font-size: 16px;
  line-height: 1.3;
  font-weight: 900;
  color: #000000;
  word-break: break-word;
}

.canvas-editor-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.canvas-editor-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.canvas-editor-action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.canvas-editor-action-btn {
  min-height: 48px;
  padding: 12px 10px;
  border: 2px solid #000000;
  background: #ffffff;
  color: #000000;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.canvas-editor-action-btn[disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}

.canvas-editor-action-btn--danger {
  background: #ffd6d6;
}

.canvas-editor-note-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.canvas-editor-note-card {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.canvas-editor-note-card strong {
  font-size: 14px;
  font-weight: 900;
  color: #000000;
}

.canvas-editor-note-card p {
  margin: 0;
  color: var(--glx-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.canvas-editor-color-row {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.canvas-editor-color-picker,
.canvas-editor-color-code {
  min-height: 82px;
  padding: 14px;
  display: grid;
  gap: 8px;
  border: 2px solid #000000;
  background: #ffffff;
}

.canvas-editor-color-picker__label,
.canvas-editor-color-code__label {
  color: var(--nb-text-secondary);
  font-size: 12px;
  font-weight: 800;
}

.canvas-editor-color-picker__input {
  width: 100%;
  height: 40px;
  border: 2px solid #000000;
  background: #ffffff;
  padding: 0;
}

.canvas-editor-color-code__value {
  color: var(--nb-ink);
  font-size: 20px;
  line-height: 1.1;
  font-weight: 900;
  text-transform: lowercase;
}

@media (max-width: 1180px) {
  .canvas-editor-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 920px) {
  .canvas-editor-layout,
  .canvas-editor-summary-grid,
  .canvas-editor-note-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .canvas-editor-action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .canvas-editor-preview-toolbar {
    align-items: stretch;
  }

  .canvas-editor-preview-actions,
  .canvas-editor-preview-chips {
    width: 100%;
  }

  .canvas-editor-send-button {
    min-width: 0;
    flex: 1 1 auto;
  }

  .canvas-editor-color-row {
    grid-template-columns: 1fr;
  }
}
</style>
