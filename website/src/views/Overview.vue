<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Overview</span>
      <h1 class="glx-page-shell__title">{{ projectName }}</h1>
      <p class="glx-page-shell__desc">{{ projectDescription }}</p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">灏哄</span>
          <strong class="glx-hero-metric__value">{{ projectSize }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">棰滆壊鏁?</span>
          <strong class="glx-hero-metric__value">{{ paletteCount }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">杩涘害</span>
          <strong class="glx-hero-metric__value">{{ projectProgress }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鐘舵€?</span>
          <strong class="glx-hero-metric__value">{{ projectStatus }}</strong>
        </article>
      </div>
      <div class="glx-inline-actions">
        <router-link :to="`/editor/${route.params.id}`" class="glx-button glx-button--primary">缁х画缂栬緫</router-link>
        <router-link :to="`/assist/${route.params.id}`" class="glx-button glx-button--ghost">杈呭姪澶勭悊</router-link>
        <router-link :to="`/publish-project/${route.params.id}`" class="glx-button glx-button--ghost">鍙戝竷浣滃搧</router-link>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">椤圭洰棰勮</h2>
          <span class="glx-section-meta">褰撳墠鐢诲竷</span>
        </div>
        <canvas ref="previewCanvasRef" class="overview-preview"></canvas>
      </article>

      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">椤圭洰淇℃伅</h2>
          <span class="glx-section-meta">浜戠璇︽儏</span>
        </div>
        <div class="glx-stack">
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鏈€杩戞洿鏂版椂闂?</strong>
              <span class="glx-list-card__desc">{{ updatedAtText }}</span>
            </div>
          </div>
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">琛ラ綈灏哄</strong>
              <span class="glx-list-card__desc">{{ paddedSizeText }}</span>
            </div>
          </div>
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鏍囩</strong>
              <span class="glx-list-card__desc">{{ tagsText }}</span>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useFeedback } from "@/composables/useFeedback.js";
import { useProjectStore } from "@/stores/project.js";

const feedback = useFeedback();
const projectStore = useProjectStore();
const route = useRoute();
const previewCanvasRef = ref(null);

function parseStringArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.length > 0);
  }

  if (!(typeof value === "string" && value.length > 0)) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string" && item.length > 0);
    }
  } catch (error) {
    return [];
  }

  return [];
}

const currentProject = computed(() => {
  if (projectStore.currentProject != null) {
    return projectStore.currentProject;
  }
  return {};
});

const projectName = computed(() => {
  if (typeof currentProject.value.name === "string" && currentProject.value.name.length > 0) {
    return currentProject.value.name;
  }
  return "椤圭洰鎬昏";
});

const projectDescription = computed(() => {
  if (typeof currentProject.value.description === "string" && currentProject.value.description.length > 0) {
    return currentProject.value.description;
  }
  return "杩欓噷缁х画鎵挎帴浜戠椤圭洰鐨勫昂瀵搞€侀厤鑹层€佽繘搴﹀拰鍙戝竷鍏ュ彛銆?";"
});

const projectSize = computed(() => {
  if (typeof currentProject.value.width === "number" && typeof currentProject.value.height === "number") {
    return `${currentProject.value.width} 脳 ${currentProject.value.height}`;
  }
  return "--";
});

const paletteCount = computed(() => {
  return parseStringArray(currentProject.value.palette).length;
});

const projectProgress = computed(() => {
  if (typeof currentProject.value.progress === "number") {
    return `${currentProject.value.progress}%`;
  }
  return "--";
});

const projectStatus = computed(() => {
  if (typeof currentProject.value.status === "string" && currentProject.value.status.length > 0) {
    return currentProject.value.status;
  }
  return "--";
});

const updatedAtText = computed(() => {
  if (typeof currentProject.value.updated_at === "string" && currentProject.value.updated_at.length > 0) {
    return currentProject.value.updated_at.slice(0, 19).replace("T", " ");
  }
  return "--";
});

const paddedSizeText = computed(() => {
  if (
    typeof currentProject.value.padded_width === "number" &&
    typeof currentProject.value.padded_height === "number"
  ) {
    return `${currentProject.value.padded_width} 脳 ${currentProject.value.padded_height}`;
  }
  return "鏈缃?";"
});

const tagsText = computed(() => {
  const tags = parseStringArray(currentProject.value.tags);
  if (tags.length > 0) {
    return tags.join(" / ");
  }
  return "鏃犳爣绛?";"
});

function drawPreview() {
  if (previewCanvasRef.value == null) {
    return;
  }

  const canvas = previewCanvasRef.value;
  const ctx = canvas.getContext("2d");

  if (
    typeof currentProject.value.width !== "number" ||
    typeof currentProject.value.height !== "number"
  ) {
    canvas.width = 320;
    canvas.height = 320;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const pixels = projectStore.currentPixels;
  const scale = Math.max(6, Math.floor(320 / Math.max(currentProject.value.width, currentProject.value.height)));
  const width = currentProject.value.width * scale;
  const height = currentProject.value.height * scale;

  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  if (pixels != null && typeof pixels === "object") {
    Object.entries(pixels).forEach(([key, color]) => {
      if (!(typeof color === "string" && color.length > 0)) {
        return;
      }

      const [xText, yText] = key.split(",");
      const x = Number(xText);
      const y = Number(yText);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  }

  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= currentProject.value.width; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * scale, 0);
    ctx.lineTo(x * scale, height);
    ctx.stroke();
  }
  for (let y = 0; y <= currentProject.value.height; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * scale);
    ctx.lineTo(width, y * scale);
    ctx.stroke();
  }
}

async function loadProject() {
  const response = await projectStore.loadProjectDetail(route.params.id);
  if (!response.success) {
    feedback.error("椤圭洰鍔犺浇澶辫触"", "褰撳墠椤圭洰娌℃湁鎴愬姛璇诲彇銆?")";"
  }
  await nextTick();
  drawPreview();
}

onMounted(async () => {
  await loadProject();
});

watch(
  () => route.params.id,
  async () => {
    await loadProject();
  },
);
</script>

<style scoped>
.overview-preview {
  display: block;
  width: min(100%, 320px);
  height: auto;
  border: 2px solid #111111;
  background: #ffffff;
}
</style>
