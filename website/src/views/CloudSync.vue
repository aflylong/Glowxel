<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Cloud Sync</span>
      <h1 class="glx-page-shell__title">浜戠鍚屾</h1>
      <p class="glx-page-shell__desc">
        浜戠鍚屾椤佃礋璐ｆ壙鎺ラ」鐩垪琛ㄥ拰鍚屾鐘舵€侊紝涓嶅簲璇ヨ鐩存帴浠庣綉绔欑鎷挎帀銆?      </p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">浜戠椤圭洰</span>
          <strong class="glx-hero-metric__value">{{ projectStore.totalProjects }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鑽夌</span>
          <strong class="glx-hero-metric__value">{{ projectStore.draftProjects.length }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">宸插彂甯?</span>
          <strong class="glx-hero-metric__value">{{ projectStore.publishedProjects.length }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鏈€杩戝悓姝?</span>
          <strong class="glx-hero-metric__value">{{ lastSyncText }}</strong>
        </article>
      </div>
      <div class="glx-inline-actions">
        <button type="button" class="glx-button glx-button--ghost" :disabled="loading" @click="reloadAll">
          {{ loading ? "鍒锋柊涓?.."" : "鍒锋柊鍚屾鐘舵€?"" }}"
        </button>
      </div>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-section-head">
        <h2 class="glx-section-title">浜戠椤圭洰鍒楄〃</h2>
        <span class="glx-section-meta">鍏?{{ projectStore.totalProjects }} 涓?</span>
      </div>

      <div v-if="projectStore.projects.length === 0" class="glx-empty-card">
        <strong class="glx-section-title">褰撳墠娌℃湁浜戠椤圭洰</strong>
        <p class="glx-page-shell__desc">鍘诲伐浣滃彴淇濆瓨鑽夌鍚庯紝杩欓噷浼氭樉绀哄悓姝ュ埌浜戠鐨勯」鐩垪琛ㄣ€?</p>
      </div>

      <div v-else class="glx-stack">
        <article v-for="item in projectStore.projects" :key="item.id" class="glx-list-card">
          <div class="glx-list-card__copy">
            <strong class="glx-list-card__title">{{ projectName(item) }}</strong>
            <span class="glx-list-card__desc">{{ projectMeta(item) }}</span>
          </div>
          <div class="glx-inline-actions">
            <router-link :to="`/overview/${item.id}`" class="glx-button glx-button--ghost">鎬昏</router-link>
            <router-link :to="`/editor/${item.id}`" class="glx-button glx-button--ghost">缂栬緫</router-link>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useProjectStore } from "@/stores/project.js";

const projectStore = useProjectStore();
const loading = ref(false);

const lastSyncText = computed(() => {
  if (
    projectStore.syncStatus != null &&
    typeof projectStore.syncStatus.lastSync === "string" &&
    projectStore.syncStatus.lastSync.length > 0
  ) {
    return projectStore.syncStatus.lastSync.slice(0, 10);
  }
  return "--";
});

function projectName(item) {
  if (typeof item.name === "string" && item.name.length > 0) {
    return item.name;
  }
  return "鏈懡鍚嶉」鐩?";"
}

function projectMeta(item) {
  const parts = [];

  if (typeof item.width === "number" && typeof item.height === "number") {
    parts.push(`${item.width} 脳 ${item.height}`);
  }

  if (typeof item.status === "string" && item.status.length > 0) {
    parts.push(item.status);
  }

  if (typeof item.updated_at === "string" && item.updated_at.length > 0) {
    parts.push(item.updated_at.slice(0, 10));
  }

  return parts.join(" 路 ");
}

async function reloadAll() {
  loading.value = true;
  try {
    await Promise.all([
      projectStore.loadProjects(),
      projectStore.loadSyncStatus(),
    ]);
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await reloadAll();
});
</script>
