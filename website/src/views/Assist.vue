<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Assist</span>
      <h1 class="glx-page-shell__title">杈呭姪澶勭悊</h1>
      <p class="glx-page-shell__desc">
        杩欓〉缁х画鎵挎帴鍒嗚杈呭姪鍜岄鑹茶緟鍔╋紝涓嶅啀鐩存帴鎶婃暣鏉″垱浣滆緟鍔╅摼鍒犳帀銆?      </p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">褰撳墠妯″紡</span>
          <strong class="glx-hero-metric__value">{{ modeLabel }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">宸蹭笂鑹插儚绱?</span>
          <strong class="glx-hero-metric__value">{{ coloredPixelCount }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">棰滆壊鏁?</span>
          <strong class="glx-hero-metric__value">{{ usedColors.length }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">琛屾暟</span>
          <strong class="glx-hero-metric__value">{{ rowSummaries.length }}</strong>
        </article>
      </div>
      <div class="glx-inline-actions">
        <router-link :to="`/overview/${route.params.id}`" class="glx-button glx-button--ghost">鍥炴€昏</router-link>
        <router-link :to="`/editor/${route.params.id}`" class="glx-button glx-button--ghost">缁х画缂栬緫</router-link>
        <router-link :to="`/publish-project/${route.params.id}`" class="glx-button glx-button--primary">鍘诲彂甯?/router-link>
      </div>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-tabs">
        <button type="button" class="glx-tab" :class="{ 'is-active': mode === 'color' }" @click="setMode('color')">
          棰滆壊杈呭姪
        </button>
        <button type="button" class="glx-tab" :class="{ 'is-active': mode === 'row' }" @click="setMode('row')">
          鍒嗚杈呭姪
        </button>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">杈呭姪棰勮</h2>
          <span class="glx-section-meta">{{ highlightLabel }}</span>
        </div>
        <canvas ref="previewCanvasRef" class="assist-preview"></canvas>
      </article>

      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title"">{{ mode === "color" ? "棰滆壊鍒楄〃"" : "琛屽垪琛?"" }}</h2">"
          <span class="glx-section-meta">{{ mode === "color" ? `${usedColors.length} 椤筦 : `${rowSummaries.length} 琛宍 }}</span>
        </div>

        <div v-if="mode === 'color'" class="glx-stack">
          <button
            v-for="item in usedColors"
            :key="item.color"
            type="button"
            class="glx-list-card assist-list-button"
            :class="{ 'is-active': selectedColor === item.color }"
            @click="selectedColor = item.color"
          >
            <span class="assist-color-chip" :style="{ background: item.color }"></span>
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">{{ item.color }}</strong>
              <span class="glx-list-card__desc">{{ item.count }} 涓儚绱?</span>
            </div>
          </button>
        </div>

        <div v-else class="glx-stack">
          <button
            v-for="row in rowSummaries"
            :key="row.y"
            type="button"
            class="glx-list-card assist-list-button"
            :class="{ 'is-active': selectedRow === row.y }"
            @click="selectedRow = row.y"
          >
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">绗?{{ row.y + 1 }} 琛?</strong>
              <span class="glx-list-card__desc">{{ row.description }}</span>
            </div>
          </button>
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

const mode = ref("color");
const selectedColor = ref("");
const selectedRow = ref(0);

const currentProject = computed(() => {
  if (projectStore.currentProject != null) {
    return projectStore.currentProject;
  }
  return {};
});

const pixelEntries = computed(() => {
  const list = [];
  if (projectStore.currentPixels != null && typeof projectStore.currentPixels === "object") {
    Object.entries(projectStore.currentPixels).forEach(([key, color]) => {
      if (!(typeof color === "string" && color.length > 0)) {
        return;
      }
      const [xText, yText] = key.split(",");
      const x = Number(xText);
      const y = Number(yText);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        return;
      }
      list.push({ x, y, color });
    });
  }
  return list;
});

const usedColors = computed(() => {
  const map = new Map();
  pixelEntries.value.forEach((item) => {
    const count = map.get(item.color);
    if (typeof count === "number") {
      map.set(item.color, count + 1);
      return;
    }
    map.set(item.color, 1);
  });

  return Array.from(map.entries())
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count);
});

const rowSummaries = computed(() => {
  const rowMap = new Map();

  pixelEntries.value.forEach((item) => {
    if (!rowMap.has(item.y)) {
      rowMap.set(item.y, new Map());
    }
    const colorMap = rowMap.get(item.y);
    const count = colorMap.get(item.color);
    if (typeof count === "number") {
      colorMap.set(item.color, count + 1);
      return;
    }
    colorMap.set(item.color, 1);
  });

  const result = [];
  if (typeof currentProject.value.height !== "number") {
    return result;
  }

  for (let y = 0; y < currentProject.value.height; y += 1) {
    const colorMap = rowMap.get(y) || new Map();
    const descriptionParts = [];
    let coloredCount = 0;

    Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([color, count]) => {
        coloredCount += count;
        descriptionParts.push(`${color} 脳 ${count}`);
      });

    result.push({
      y,
      coloredCount,
      description: descriptionParts.length > 0 ? descriptionParts.join(" / ") : "褰撳墠琛屾病鏈夊儚绱?,"
    });
  }

  return result;
});

const coloredPixelCount = computed(() => pixelEntries.value.length);

const modeLabel = computed(() => {
  return mode.value === "color" ? "棰滆壊杈呭姪" : "鍒嗚杈呭姪";
});

const highlightLabel = computed(() => {
  if (mode.value === "color") {
    if (selectedColor.value.length > 0) {
      return `褰撳墠楂樹寒 ${selectedColor.value}`;
    }
    return "鏈€夋嫨棰滆壊";
  }

  return `褰撳墠楂樹寒绗?${selectedRow.value + 1} 琛宍;
});

function setMode(nextMode) {
  mode.value = nextMode;
}

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

  const scale = Math.max(6, Math.floor(320 / Math.max(currentProject.value.width, currentProject.value.height)));
  const width = currentProject.value.width * scale;
  const height = currentProject.value.height * scale;

  canvas.width = width;
  canvas.height = height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  pixelEntries.value.forEach((item) => {
    let fillColor = item.color;

    if (mode.value === "color") {
      if (selectedColor.value.length > 0 && item.color !== selectedColor.value) {
        fillColor = "#e7e7e7";
      }
    } else if (item.y !== selectedRow.value) {
      fillColor = "#e7e7e7";
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(item.x * scale, item.y * scale, scale, scale);
  });

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
    feedback.error("椤圭洰鍔犺浇澶辫触"", "杈呭姪澶勭悊椤垫病鏈夋垚鍔熻鍙栭」鐩暟鎹€?")";"
    return;
  }

  if (usedColors.value.length > 0) {
    selectedColor.value = usedColors.value[0].color;
  }
  if (rowSummaries.value.length > 0) {
    selectedRow.value = rowSummaries.value[0].y;
  }

  await nextTick();
  drawPreview();
}

onMounted(async () => {
  await loadProject();
});

watch([mode, selectedColor, selectedRow], async () => {
  await nextTick();
  drawPreview();
});

watch(
  () => route.params.id,
  async () => {
    await loadProject();
  },
);
</script>

<style scoped>
.assist-preview {
  display: block;
  width: min(100%, 320px);
  height: auto;
  border: 2px solid #111111;
  background: #ffffff;
}

.assist-list-button {
  width: 100%;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
}

.assist-list-button.is-active {
  background: #fff2b8;
}

.assist-color-chip {
  width: 28px;
  height: 28px;
  display: inline-flex;
  border: 2px solid #111111;
  flex-shrink: 0;
}
</style>
