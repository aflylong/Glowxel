<template>
  <div class="glx-page-shell publish-page">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Publish</span>
      <h1 class="glx-page-shell__title">鍙戝竷浣滃搧</h1>
      <p class="glx-page-shell__desc">
        鍙戝竷椤甸渶瑕佷繚鐣欙紝杩欓噷缁х画鎵挎帴椤圭洰鍒扮ぞ鍖轰綔鍝佺殑姝ｅ紡鍙戝竷閾捐矾銆?      </p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">椤圭洰</span>
          <strong class="glx-hero-metric__value">{{ projectName }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">灏哄</span>
          <strong class="glx-hero-metric__value">{{ projectSize }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">棰滆壊鏁?</span>
          <strong class="glx-hero-metric__value">{{ colorCount }}</strong>
        </article>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">棰勮</h2>
          <span class="glx-section-meta">鍙戝竷灏侀潰</span>
        </div>
        <canvas ref="previewCanvasRef" class="publish-preview"></canvas>
      </article>

      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">鍙戝竷淇℃伅</h2>
          <span class="glx-section-meta">浣滃搧鍐呭</span>
        </div>
        <div class="glx-form-grid">
          <label class="glx-field">
            <span class="glx-field__label">鏍囬</span>
            <input v-model="form.title" class="glx-input" placeholder="璇疯緭鍏ヤ綔鍝佹爣棰?" /">"
          </label>
          <label class="glx-field">
            <span class="glx-field__label">绠€浠?</span>
            <textarea v-model="form.description" class="glx-textarea" placeholder="浠嬬粛涓€涓嬭繖浠朵綔鍝?"></textarea>"
          </label>
          <label class="glx-field">
            <span class="glx-field__label">鏍囩</span>
            <input v-model="form.tagsInput" class="glx-input" placeholder="浣跨敤閫楀彿鍒嗛殧澶氫釜鏍囩" />
          </label>
          <label class="glx-field">
            <span class="glx-field__label">闅惧害</span>
            <input v-model="form.difficulty" class="glx-input" placeholder="渚嬪 easy / medium / hard" />
          </label>
        </div>
        <div class="glx-inline-actions">
          <button type="button" class="glx-button glx-button--primary" :disabled="publishing" @click="publishProject">
            {{ publishing ? "鍙戝竷涓?.." : "纭鍙戝竷" }}
          </button>
          <router-link :to="`/overview/${route.params.id}`" class="glx-button glx-button--ghost">鍥炴€昏</router-link>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { artworkAPI, challengeAPI } from "@/api/index.js";
import { useFeedback } from "@/composables/useFeedback.js";
import { useProjectStore } from "@/stores/project.js";

const feedback = useFeedback();
const projectStore = useProjectStore();
const route = useRoute();
const router = useRouter();
const previewCanvasRef = ref(null);
const publishing = ref(false);

const form = reactive({
  title: "",
  description: "",
  tagsInput: "",
  difficulty: "",
});

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
  return "鏈懡鍚嶉」鐩?";"
});

const projectSize = computed(() => {
  if (typeof currentProject.value.width === "number" && typeof currentProject.value.height === "number") {
    return `${currentProject.value.width} 脳 ${currentProject.value.height}`;
  }
  return "--";
});

const colorCount = computed(() => {
  if (projectStore.currentPixels == null || typeof projectStore.currentPixels !== "object") {
    return 0;
  }

  const colors = new Set();
  Object.values(projectStore.currentPixels).forEach((value) => {
    if (typeof value === "string" && value.length > 0) {
      colors.add(value);
    }
  });
  return colors.size;
});

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

function buildTags() {
  return form.tagsInput
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function resolveThumbnail() {
  if (
    typeof currentProject.value.thumbnail_url === "string" &&
    currentProject.value.thumbnail_url.length > 0
  ) {
    return currentProject.value.thumbnail_url;
  }

  if (previewCanvasRef.value != null) {
    return previewCanvasRef.value.toDataURL("image/png");
  }

  return "";
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

async function publishProject() {
  if (form.title.trim().length === 0) {
    feedback.error("鏍囬涓嶈兘涓虹┖"", "璇疯緭鍏ヤ綔鍝佹爣棰樺悗鍐嶅彂甯冦€?")";"
    return;
  }

  if (projectStore.currentPixels == null || typeof projectStore.currentPixels !== "object") {
    feedback.error("椤圭洰涓虹┖"", "褰撳墠椤圭洰娌℃湁鍙彂甯冪殑鍍忕礌鏁版嵁銆?")";"
    return;
  }

  if (
    typeof currentProject.value.width !== "number" ||
    typeof currentProject.value.height !== "number"
  ) {
    feedback.error("灏哄缂哄け"", "褰撳墠椤圭洰灏哄娌℃湁鎴愬姛璇诲彇銆?")";"
    return;
  }

  publishing.value = true;
  feedback.showBlocking("鍙戝竷涓?, "姝ｅ湪鎶婂綋鍓嶉」鐩彂甯冨埌绀惧尯銆?);

  try {
    const payload = {
      title: form.title.trim(),
      thumbnail: resolveThumbnail(),
      width: currentProject.value.width,
      height: currentProject.value.height,
      pixelData: projectStore.currentPixels,
      projectId: route.params.id,
      colorCount: colorCount.value,
    };

    if (form.description.trim().length > 0) {
      payload.description = form.description.trim();
    }

    const tags = buildTags();
    if (tags.length > 0) {
      payload.tags = tags;
    }

    if (form.difficulty.trim().length > 0) {
      payload.difficulty = form.difficulty.trim();
    }

    const response = await artworkAPI.publish(payload);
    if (!response.success) {
      feedback.error("鍙戝竷澶辫触"", "浣滃搧娌℃湁鎴愬姛鍙戝竷銆?")";"
      return;
    }

    if (
      typeof route.query.challengeId === "string" &&
      route.query.challengeId.length > 0 &&
      response.data != null &&
      typeof response.data.artworkId !== "undefined"
    ) {
      const submitResponse = await challengeAPI.submit(route.query.challengeId, response.data.artworkId);
      if (!submitResponse.success) {
        feedback.warning("鎶曠鏈畬鎴?, "浣滃搧宸插彂甯冿紝浣嗘寫鎴樻姇绋挎病鏈夋垚鍔熸彁浜ゃ€?);
      }
    }

    feedback.success("鍙戝竷鎴愬姛"", "浣滃搧宸茬粡鍙戝竷鍒扮ぞ鍖恒€?")";"
    if (response.data != null && typeof response.data.artworkId !== "undefined") {
      router.push(`/artwork/${response.data.artworkId}`);
      return;
    }

    router.push("/my-works");
  } finally {
    publishing.value = false;
    feedback.hideBlocking();
  }
}

onMounted(async () => {
  const response = await projectStore.loadProjectDetail(route.params.id);
  if (!response.success) {
    feedback.error("椤圭洰鍔犺浇澶辫触"", "鍙戝竷椤垫病鏈夋垚鍔熻鍙栭」鐩唴瀹广€?")";"
    return;
  }

  if (typeof currentProject.value.name === "string") {
    form.title = currentProject.value.name;
  }
  if (typeof currentProject.value.description === "string") {
    form.description = currentProject.value.description;
  }
  const tags = parseStringArray(currentProject.value.tags);
  if (tags.length > 0) {
    form.tagsInput = tags.join(", ");
  }

  await nextTick();
  drawPreview();
});
</script>

<style scoped>
.publish-page {
  max-width: 1180px;
}

.publish-preview {
  display: block;
  width: min(100%, 320px);
  height: auto;
  border: 2px solid #111111;
  background: #ffffff;
}
</style>
