<template>
  <div class="clock-mode-page glx-page-shell game-mode-page">
    <PcModeTopbar :title="title" />

    <section class="clock-mode-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack clock-preview-card game-preview-card"
      >
        <div class="clock-preview-card__head">
          <div>
            <p class="clock-preview-card__eyebrow">{{ eyebrow }}</p>
            <h2 class="clock-preview-card__title">{{ previewTitle }}</h2>
          </div>
        </div>

        <div class="clock-preview-toolbar">
          <div class="clock-preview-toolbar__actions">
            <button
              type="button"
              class="glx-button glx-button--primary clock-send-button"
              :disabled="isSending"
              @click="sendToDevice"
            >
              {{ isSending ? "鍙戦€佷腑..." : "鍙戦€佸埌璁惧" }}
            </button>
            <button
              type="button"
              class="glx-button glx-button--ghost"
              @click="resetConfig"
            >
              鎭㈠榛樿
            </button>
          </div>
          <span
            class="glx-chip"
            :class="deviceStore.connected ? 'glx-chip--green' : 'glx-chip--yellow'"
          >
            {{ deviceStore.connected ? "宸茶繛鎺? : "鏈繛鎺? }}
          </span>
        </div>

        <div class="clock-preview-stage game-preview-stage">
          <div class="clock-preview-board">
            <ClockPixelCanvas :frame="previewFrame" rounded />
            <DeviceSendingOverlay
              :visible="isSending"
              title="姝ｅ湪鍙戦€佹椂閽熼厤缃?"
              description="鍙戦€佹湡闂撮攣瀹氬綋鍓嶉瑙堝揩鐓э紝绛夊緟璁惧瀹屾垚妯″紡鍒囨崲鍜屼簨鍔℃彁浜ゃ€?"
            >
              <div class="clock-preview-sending">
                <ClockPixelCanvas :frame="sendingFrame" rounded />
              </div>
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="clock-summary-grid">
          <article class="clock-summary-card">
            <span class="clock-summary-card__label">妯″紡</span>
            <strong class="clock-summary-card__value">{{ modeLabel }}</strong>
            <span class="clock-summary-card__meta">{{ imageSendCapabilityText }}</span>
          </article>
          <article class="clock-summary-card">
            <span class="clock-summary-card__label">瀛椾綋</span>
            <strong class="clock-summary-card__value">{{ selectedFontName }}</strong>
            <span class="clock-summary-card__meta">
              {{ config.hourFormat === 24 ? "24 灏忔椂" : "12 灏忔椂" }}
            </span>
          </article>
          <article class="clock-summary-card">
            <span class="clock-summary-card__label">绉掗挓</span>
            <strong class="clock-summary-card__value">
              {{ config.showSeconds ? "鏄剧ず" : "闅愯棌" }}
            </strong>
            <span class="clock-summary-card__meta">{{ sendHint }}</span>
          </article>
        </div>
      </article>

      <div class="clock-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">妯″紡閰嶇疆</h2>
            <span class="glx-section-meta">鏃堕棿 / 瀛椾綋 / 鍥剧墖 / 鏃ユ湡 / 鏄熸湡</span>
          </div>
          <div class="glx-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              type="button"
              class="glx-tab"
              :class="{ 'is-active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </article>

        <article class="glx-section-card glx-section-card--stack">
          <ClockTextSettingsSection
            v-if="activeTab === 'time'"
            title="鏃堕棿鏄剧ず"
            description="澶嶅埢 uniapp 闈欐€?鍔ㄦ€佹椂閽熼〉鐨勬椂闂村潡璋冭妭鏂瑰紡銆?"
            :section="config.time"
            :preset-colors="presetColors"
            :show-font-size="true"
            :show-seconds-control="true"
            :show-seconds="config.showSeconds"
            @toggle="toggleSection('time')"
            @toggle-seconds="setShowSeconds(!config.showSeconds)"
            @adjust="(...args) => adjustSection('time', ...args)"
            @set-align="setSectionAlign('time', $event)"
            @update-color="updateSectionColor('time', $event)"
          />

          <ClockFontSelector
            v-else-if="activeTab === 'font'"
            :font-options="fontOptions"
            :selected-font="config.font"
            :show-seconds="config.showSeconds"
            :hour-format="config.hourFormat"
            @select-font="config.font = $event"
            @set-show-seconds="setShowSeconds"
            @set-hour-format="config.hourFormat = $event"
          />

          <ClockImageSettingsSection
            v-else-if="activeTab === 'image'"
            :title="imageSectionTitle"
            :description="imageSectionDescription"
            :image-config="config.image"
            :image-source="imageSource"
            :allow-gif="mode === 'animation'"
            :gif-frame-count="gifRenderedFrames.length"
            :gif-is-playing="gifIsPlaying"
            :gif-play-speed="gifPlaySpeed"
            :empty-description="imageEmptyDescription"
            @select-file="handleSelectFile"
            @clear-image="clearImage"
            @toggle-show="config.image.show = !config.image.show"
            @adjust-image="adjustImage"
            @set-square="setSquareImage"
            @toggle-gif-play="toggleGifPreviewPlayback"
            @adjust-gif-speed="adjustGifSpeed"
          />

          <ClockTextSettingsSection
            v-else-if="activeTab === 'date'"
            title="鏃ユ湡鏄剧ず"
            description="鍜?uniapp 鏃ユ湡椤典竴鑷达紝淇濈暀瀛楀彿銆佷綅缃€佸榻愬拰棰滆壊鎺у埗銆?"
            :section="config.date"
            :preset-colors="presetColors"
            :show-font-size="true"
            :min-font-size="1"
            :max-font-size="2"
            @toggle="toggleSection('date')"
            @adjust="(...args) => adjustSection('date', ...args)"
            @set-align="setSectionAlign('date', $event)"
            @update-color="updateSectionColor('date', $event)"
          />

          <ClockTextSettingsSection
            v-else
            title="鏄熸湡鏄剧ず"
            description="鏄熸湡娌跨敤鍚屼竴濂楀瓧妯★紝鍙繚鐣欐樉绀哄紑鍏炽€佷綅缃€佸榻愬拰棰滆壊銆?"
            :section="config.week"
            :preset-colors="presetColors"
            :show-font-size="false"
            @toggle="toggleSection('week')"
            @adjust="(...args) => adjustSection('week', ...args)"
            @set-align="setSectionAlign('week', $event)"
            @update-color="updateSectionColor('week', $event)"
          />
        </article>

        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">椤甸潰璇存槑</h2>
            <span class="glx-section-meta">澶嶅埢杈圭晫</span>
          </div>
          <div class="clock-note-list">
            <p>棰勮鍖轰繚鐣?uniapp 椤甸潰鐨勪富鍏ュ彛璇箟锛屼絾鏀规垚鏇撮€傚悎妗岄潰鐨勫弻鏍忓竷灞€銆?</p>
            <p>鏃堕棿銆佸瓧浣撱€佸浘鐗囥€佹棩鏈熴€佹槦鏈熶簲涓垎鍖洪『搴忎笌 uniapp 淇濇寔涓€鑷淬€?</p>
            <p>鍙戦€侀摼缁х画娌跨敤鐜版湁浜嬪姟鍗忚锛歚set_mode / set_clock_config / tx_commit`锛岄潤鎬佸浘鍜?GIF 閮藉鐢ㄥ凡瀛樺湪鐨勪簩杩涘埗灏佸寘鑳藉姏銆?</p>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { GIFParser } from "../../../../../uniapp/utils/gifParser.js";
import { useFeedback } from "@/composables/useFeedback.js";
import { useDeviceStore } from "@/stores/device.js";
import DeviceSendingOverlay from "@/components/device/DeviceSendingOverlay.vue";
import PcModeTopbar from "@/components/device/modes/PcModeTopbar.vue";
import ClockFontSelector from "./ClockFontSelector.vue";
import ClockImageSettingsSection from "./ClockImageSettingsSection.vue";
import ClockPixelCanvas from "./ClockPixelCanvas.vue";
import ClockTextSettingsSection from "./ClockTextSettingsSection.vue";
import {
  DEVICE_CLOCK_COLOR_PRESETS,
  cloneClockConfig,
  createDefaultClockConfig,
  getDeviceClockFontOptions,
  getDeviceClockStorageKey,
  loadDeviceClockImageFile,
  rasterizeDeviceClockImage,
  renderDeviceClockFrame,
  setClockSectionAlignment,
} from "@/utils/device-clock-core.js";
import {
  DEVICE_CLOCK_BINARY_KINDS,
  sendDeviceClockMode,
} from "@/utils/device-clock-protocol.js";

const props = defineProps({
  mode: {
    type: String,
    required: true,
  },
  eyebrow: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  previewTitle: {
    type: String,
    required: true,
  },
});

const deviceStore = useDeviceStore();
const feedback = useFeedback();
const fontOptions = getDeviceClockFontOptions();
const presetColors = DEVICE_CLOCK_COLOR_PRESETS;
const tabs = [
  { key: "time", label: "鏃堕棿" },
  { key: "font", label: "瀛椾綋" },
  { key: "image", label: "鍥剧墖" },
  { key: "date", label: "鏃ユ湡" },
  { key: "week", label: "鏄熸湡" },
];

const activeTab = ref("time");
const config = ref(createDefaultClockConfig());
const imageSource = ref(null);
const imageLayer = ref(null);
const gifParser = ref(null);
const gifRenderedFrames = ref([]);
const gifFrameDelays = ref([]);
const gifFrameIndex = ref(0);
const gifIsPlaying = ref(false);
const gifPlaySpeed = ref(1);
const previewNow = ref(new Date());
const isSending = ref(false);
const sendingFrame = ref(renderDeviceClockFrame());
let previewTimer = null;
let gifTimer = null;

const previewFrame = computed(() => {
  return renderDeviceClockFrame({
    config: config.value,
    now: previewNow.value,
    imageLayer: imageLayer.value,
  });
});

const selectedFontName = computed(() => {
  const matched = fontOptions.find((font) => font.id === config.value.font);
  return matched ? matched.name : config.value.font;
});

const imageSectionTitle = computed(() => {
  if (props.mode === "animation") {
    return "鍔ㄥ浘绱犳潗";
  }
  return "鑳屾櫙鍥剧墖";
});

const imageSectionDescription = computed(() => {
  if (props.mode === "animation") {
    return "鍔ㄦ€佹椂閽熷榻?uniapp 鍔ㄥ浘閾捐矾锛屾敮鎸?GIF 鏈湴鎾斁棰勮銆佸昂瀵镐綅缃皟鑺傚拰浜嬪姟鍙戦€併€?";"
  }
  return "闈欐€佹椂閽熶繚鐣欏浘鐗囪儗鏅紪杈戦摼璺紝鏀寔鏈湴棰勮銆佸昂瀵镐綅缃皟鑺傚拰浜嬪姟鍙戦€併€?";"
});

const imageEmptyDescription = computed(() => {
  if (props.mode === "animation") {
    return "缃戠珯绔敮鎸佹湰鍦伴瑙堥潤鎬佸浘鍜?GIF 鍔ㄥ浘锛屽苟鎸?uniapp 璇箟鍙戦€佸埌璁惧銆?";"
  }
  return "缃戠珯绔敮鎸佹湰鍦伴瑙堥潤鎬佸浘鐗囷紝骞舵寜闈欐€佹椂閽熻涔夊彂閫佸埌璁惧銆?";"
});

const modeLabel = computed(() => {
  if (props.mode === "animation") {
    return "鍔ㄦ€佹椂閽?";"
  }
  return "闈欐€佹椂閽?";"
});

const imageSendCapabilityText = computed(() => {
  if (imageSource.value === null) {
    return "宸叉帴鍏?";"
  }
  if (imageSource.value.isGif === true && props.mode === "animation") {
    return "GIF 宸叉帴鍏?";"
  }
  if (imageSource.value.isGif === true) {
    return "GIF 浠呭姩鎬佹椂閽?";"
  }
  return "宸叉帴鍏?";"
});

const sendHint = computed(() => {
  if (props.mode === "animation") {
    return "鍔ㄦ€佹椂閽熼〉宸茬粡鎺ヤ笂浜嬪姟鍙戦€侀摼锛岀函鏂囧瓧銆侀潤鎬佸浘鐗囧拰 GIF 鍔ㄥ浘閮戒細鎸夋ā寮忎簨鍔′竴璧峰彂閫併€?";"
  }
  return "闈欐€佹椂閽熼〉宸茬粡鎺ヤ笂浜嬪姟鍙戦€侀摼锛岀函鏂囧瓧涓庨潤鎬佸浘鐗囧浘灞備細鎸夋ā寮忎簨鍔′竴璧峰彂閫併€?";"
});

watch(
  config,
  () => {
    persistState();
  },
  { deep: true },
);

watch(
  imageSource,
  () => {
    persistState();
  },
  { deep: true },
);

watch(gifPlaySpeed, () => {
  persistState();
  if (gifIsPlaying.value) {
    startGifPreview();
  }
});

watch(
  () => [config.value.image.width, config.value.image.height],
  async () => {
    if (imageSource.value === null) {
      clearGifState();
      imageLayer.value = null;
      return;
    }
    await rebuildImageLayer();
  },
);

async function restoreConfig() {
  const raw = localStorage.getItem(getDeviceClockStorageKey(props.mode));
  if (!raw) {
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.config) {
      config.value = {
        ...createDefaultClockConfig(),
        ...parsed.config,
        time: { ...createDefaultClockConfig().time, ...parsed.config.time },
        date: { ...createDefaultClockConfig().date, ...parsed.config.date },
        week: { ...createDefaultClockConfig().week, ...parsed.config.week },
        image: { ...createDefaultClockConfig().image, ...parsed.config.image },
      };
    }

    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.imageSource &&
      typeof parsed.imageSource === "object" &&
      typeof parsed.imageSource.sourceUrl === "string"
    ) {
      if (props.mode !== "animation" && parsed.imageSource.isGif === true) {
        imageSource.value = null;
        imageLayer.value = null;
        clearGifState();
        return;
      }

      imageSource.value = {
        name: parsed.imageSource.name,
        type: parsed.imageSource.type,
        sourceUrl: parsed.imageSource.sourceUrl,
        width: parsed.imageSource.width,
        height: parsed.imageSource.height,
        isGif: parsed.imageSource.isGif === true,
      };

      if (
        typeof parsed.gifPlaySpeed === "number" &&
        Number.isFinite(parsed.gifPlaySpeed) &&
        parsed.gifPlaySpeed >= 0.5 &&
        parsed.gifPlaySpeed <= 4
      ) {
        gifPlaySpeed.value = parsed.gifPlaySpeed;
      }

      await rebuildImageLayer();
    }
  } catch {
    imageSource.value = null;
    imageLayer.value = null;
    clearGifState();
  }
}

function persistState() {
  const payload = {
    config: config.value,
    imageSource: imageSource.value,
    gifPlaySpeed: gifPlaySpeed.value,
  };

  try {
    localStorage.setItem(getDeviceClockStorageKey(props.mode), JSON.stringify(payload));
  } catch {
    // ignore storage quota errors
  }
}

function toggleSection(sectionKey) {
  config.value = {
    ...cloneClockConfig(config.value),
    [sectionKey]: {
      ...config.value[sectionKey],
      show: !config.value[sectionKey].show,
    },
  };
}

function setShowSeconds(nextValue) {
  config.value = {
    ...cloneClockConfig(config.value),
    showSeconds: nextValue,
  };
}

function adjustSection(sectionKey, fieldKey, delta, min, max) {
  const nextValue = Math.max(min, Math.min(max, config.value[sectionKey][fieldKey] + delta));
  config.value = {
    ...cloneClockConfig(config.value),
    [sectionKey]: {
      ...config.value[sectionKey],
      [fieldKey]: nextValue,
    },
  };
}

function setSectionAlign(sectionKey, align) {
  config.value = setClockSectionAlignment(config.value, sectionKey, align);
}

function updateSectionColor(sectionKey, color) {
  config.value = {
    ...cloneClockConfig(config.value),
    [sectionKey]: {
      ...config.value[sectionKey],
      color,
    },
  };
}

async function handleSelectFile(file) {
  try {
    const asset = await loadDeviceClockImageFile(file);
    if (asset.isGif === true && props.mode !== "animation") {
      feedback.warning("闈欐€佹椂閽熶笉鏀寔 GIF"", "闈欐€佹椂閽熼〉鍙帴鍙楅潤鎬佸浘鐗囪儗鏅紝璇锋敼鐢ㄥ姩鎬佹椂閽熼〉鍙戦€?GIF銆?")";"
      return;
    }

    imageSource.value = asset;
    config.value = {
      ...cloneClockConfig(config.value),
      image: {
        ...config.value.image,
        show: true,
      },
    };
    await rebuildImageLayer();
  } catch (error) {
    const message = error instanceof Error ? error.message : "鍥剧墖璇诲彇澶辫触";
    feedback.error("鍥剧墖璇诲彇澶辫触", message);
  }
}

function clearImage() {
  stopGifPreview();
  clearGifState();
  imageSource.value = null;
  imageLayer.value = null;
  config.value = {
    ...cloneClockConfig(config.value),
    image: {
      ...config.value.image,
      show: false,
    },
  };
}

function adjustImage(fieldKey, delta) {
  const bounds = fieldKey === "x" || fieldKey === "y" ? { min: 0, max: 64 } : { min: 1, max: 64 };
  config.value = {
    ...cloneClockConfig(config.value),
    image: {
      ...config.value.image,
      [fieldKey]: Math.max(bounds.min, Math.min(bounds.max, config.value.image[fieldKey] + delta)),
    },
  };
}

function setSquareImage() {
  config.value = {
    ...cloneClockConfig(config.value),
    image: {
      ...config.value.image,
      height: config.value.image.width,
    },
  };
}

function resetConfig() {
  stopGifPreview();
  clearGifState();
  config.value = createDefaultClockConfig();
  imageSource.value = null;
  imageLayer.value = null;
}

async function sendToDevice() {
  if (isSending.value) {
    return;
  }

  if (!deviceStore.connected) {
    feedback.warning("璁惧鏈繛鎺?, "鍏堝幓璁惧鎺у埗椤靛缓绔?WebSocket锛屽啀浠庤繖閲屽彂閫佹椂閽熼厤缃€?);
    return;
  }

  if (imageSource.value !== null && imageSource.value.isGif === true && props.mode !== "animation") {
    feedback.error("鍙戦€佸け璐?, "闈欐€佹椂閽熼〉涓嶆敮鎸?GIF 鍔ㄥ浘锛岃鏀圭敤鍔ㄦ€佹椂閽熼〉銆?);
    return;
  }

  isSending.value = true;
  sendingFrame.value = previewFrame.value;
  feedback.showBlocking("鍙戦€侀厤缃?, "姝ｅ湪鍒囨崲妯″紡骞跺彂閫佹椂閽熷弬鏁般€?);
  try {
    const ws = deviceStore.getWebSocket();
    const sendRequest = {
      mode: props.mode,
      config: config.value,
      now: previewNow.value,
      binaryKind: DEVICE_CLOCK_BINARY_KINDS.NONE,
    };

    if (
      props.mode === "animation" &&
      imageSource.value !== null &&
      imageSource.value.isGif === true &&
      gifParser.value !== null &&
      gifRenderedFrames.value.length > 0
    ) {
      sendRequest.binaryKind = DEVICE_CLOCK_BINARY_KINDS.GIF_ANIMATION;
      sendRequest.gifParser = gifParser.value;
      sendRequest.gifRenderedFrames = gifRenderedFrames.value;
      sendRequest.gifPlaySpeed = gifPlaySpeed.value;
    } else if (config.value.image.show && imageLayer.value !== null) {
      sendRequest.binaryKind = DEVICE_CLOCK_BINARY_KINDS.STATIC_IMAGE;
      sendRequest.imagePixelMap = imageLayer.value.pixels;
    }

    await sendDeviceClockMode(ws, sendRequest);
    feedback.success("鍙戦€佹垚鍔?, `${modeLabel.value"} 閰嶇疆宸茬粡鍙戦€佸埌璁惧銆俙")";"
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("鍙戦€佸け璐?", error.message")";"
    } else {
      feedback.error("鍙戦€佸け璐?, "鏃堕挓閰嶇疆鍙戦€佸け璐ャ€?);
    }
  } finally {
    isSending.value = false;
    feedback.hideBlocking();
  }
}

async function rebuildImageLayer() {
  if (imageSource.value === null) {
    stopGifPreview();
    clearGifState();
    imageLayer.value = null;
    return;
  }

  if (imageSource.value.isGif === true) {
    await prepareGifFrames(imageSource.value);
    return;
  }

  stopGifPreview();
  clearGifState();
  imageLayer.value = await rasterizeDeviceClockImage(
    imageSource.value,
    config.value.image.width,
    config.value.image.height,
  );
}

async function prepareGifFrames(asset) {
  stopGifPreview();
  clearGifState();

  const response = await fetch(asset.sourceUrl);
  const buffer = await response.arrayBuffer();
  const parser = new GIFParser();
  parser.parse(buffer);

  const renderedFrames = parser.renderFrames(
    config.value.image.width,
    config.value.image.height,
  );

  gifParser.value = parser;
  gifRenderedFrames.value = renderedFrames;
  gifFrameDelays.value = renderedFrames.map((frame) => {
    if (typeof frame.delay === "number" && frame.delay > 0) {
      return frame.delay;
    }
    return 100;
  });
  gifFrameIndex.value = 0;

  if (renderedFrames.length === 0) {
    imageLayer.value = null;
    return;
  }

  applyGifFrame(0);
  if (renderedFrames.length > 1) {
    startGifPreview();
  }
}

function clearGifState() {
  gifParser.value = null;
  gifRenderedFrames.value = [];
  gifFrameDelays.value = [];
  gifFrameIndex.value = 0;
  gifIsPlaying.value = false;
}

function applyGifFrame(index) {
  const frame = gifRenderedFrames.value[index];
  if (!frame || !(frame.rgba instanceof Uint8Array)) {
    imageLayer.value = null;
    return;
  }

  const pixels = new Map();
  const targetWidth = config.value.image.width;
  const targetHeight = config.value.image.height;

  for (let y = 0; y < targetHeight; y += 1) {
    for (let x = 0; x < targetWidth; x += 1) {
      const pixelIndex = (y * targetWidth + x) * 4;
      const alpha = frame.rgba[pixelIndex + 3];
      if (alpha < 24) {
        continue;
      }

      const r = frame.rgba[pixelIndex];
      const g = frame.rgba[pixelIndex + 1];
      const b = frame.rgba[pixelIndex + 2];
      const color = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
      pixels.set(`${x},${y}`, color);
    }
  }

  imageLayer.value = {
    width: targetWidth,
    height: targetHeight,
    pixels,
  };
}

function startGifPreview() {
  stopGifPreview();
  if (gifRenderedFrames.value.length <= 1) {
    gifIsPlaying.value = false;
    return;
  }
  gifIsPlaying.value = true;
  scheduleGifFrameAdvance();
}

function stopGifPreview() {
  gifIsPlaying.value = false;
  if (gifTimer !== null) {
    window.clearTimeout(gifTimer);
    gifTimer = null;
  }
}

function toggleGifPreviewPlayback() {
  if (gifRenderedFrames.value.length <= 1) {
    return;
  }

  if (gifIsPlaying.value) {
    stopGifPreview();
    applyGifFrame(gifFrameIndex.value);
    return;
  }

  startGifPreview();
}

function adjustGifSpeed(delta) {
  const nextValue = Math.max(0.5, Math.min(4, Number((gifPlaySpeed.value + delta).toFixed(1))));
  gifPlaySpeed.value = nextValue;
}

function scheduleGifFrameAdvance() {
  if (!gifIsPlaying.value || gifRenderedFrames.value.length <= 1) {
    return;
  }

  const currentDelay = gifFrameDelays.value[gifFrameIndex.value] || 100;
  const scaledDelay = Math.max(40, Math.round(currentDelay / gifPlaySpeed.value));

  gifTimer = window.setTimeout(() => {
    gifFrameIndex.value = (gifFrameIndex.value + 1) % gifRenderedFrames.value.length;
    applyGifFrame(gifFrameIndex.value);
    scheduleGifFrameAdvance();
  }, scaledDelay);
}

onMounted(() => {
  deviceStore.init();
  restoreConfig();
  previewTimer = window.setInterval(() => {
    previewNow.value = new Date();
  }, 1000);
});

onBeforeUnmount(() => {
  stopGifPreview();
  if (previewTimer) {
    window.clearInterval(previewTimer);
    previewTimer = null;
  }
});
</script>

<style scoped>
.game-mode-page {
  gap: 24px;
}

.clock-mode-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.clock-mode-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}

.clock-preview-card {
  gap: 16px;
}

.clock-preview-card__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.clock-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.clock-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  color: #000000;
}

.clock-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.clock-preview-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.clock-send-button {
  min-width: 188px;
  min-height: 48px;
}

.clock-preview-stage {
  padding: 18px;
}

.clock-preview-board {
  position: relative;
  width: min(100%, 560px);
  margin: 0 auto;
}

.clock-preview-sending {
  width: 100%;
  height: 100%;
}

.clock-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.clock-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.clock-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.clock-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.clock-summary-card__meta {
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.clock-config-stack {
  min-width: 0;
}

.clock-note-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.clock-note-list p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

@media (max-width: 1080px) {
  .clock-mode-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .clock-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .clock-preview-toolbar__actions {
    width: 100%;
  }
}
</style>
