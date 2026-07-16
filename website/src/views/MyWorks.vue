<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">My Works</span>
      <h1 class="glx-page-shell__title">鎴戠殑浣滃搧</h1>
      <p class="glx-page-shell__desc">
        杩欓噷鎭㈠鐨勬槸鈥滃凡鍙戝竷浣滃搧绠＄悊鈥濓紝涓嶆槸浜戠椤圭洰鑽夌銆傞」鐩崏绋跨户缁湪宸ヤ綔鍙板拰鎬昏椤电鐞嗐€?      </p>
      <div class="glx-inline-actions">
        <router-link to="/workspace" class="glx-button glx-button--ghost">鍥炲伐浣滃彴</router-link>
        <router-link to="/profile" class="glx-button glx-button--ghost">鍥炰釜浜轰腑蹇?/router-link>
      </div>
    </section>

    <section v-if="loading" class="glx-grid glx-grid--three">
      <article v-for="index in 3" :key="index" class="glx-skeleton-card">
        <div class="glx-skeleton my-works-skeleton my-works-skeleton--cover"></div>
        <div class="glx-skeleton my-works-skeleton"></div>
        <div class="glx-skeleton my-works-skeleton"></div>
      </article>
    </section>

    <section v-else-if="works.length === 0" class="glx-empty-card">
      <strong class="glx-section-title">杩樻病鏈夊凡鍙戝竷浣滃搧</strong>
      <p class="glx-page-shell__desc">鍏堝幓缂栬緫鍣ㄥ彂甯冧綔鍝侊紝杩欓噷灏变細鍑虹幇浣犵殑浣滃搧绠＄悊鍒楄〃銆?</p>
    </section>

    <section v-else class="glx-grid glx-grid--three">
      <article v-for="item in works" :key="item.id" class="glx-section-card glx-section-card--stack">
        <img
          v-if="coverUrl(item.cover_url).length > 0"
          :src="coverUrl(item.cover_url)"
          alt="cover"
          class="work-cover"
        />
        <div v-else class="glx-empty-card">
          <strong class="glx-section-title">鏆傛棤灏侀潰</strong>
          <p class="glx-page-shell__desc">褰撳墠浣滃搧娌℃湁灏侀潰鍥俱€?</p>
        </div>
        <strong class="glx-section-title">{{ resolveTitle(item) }}</strong>
        <p class="glx-page-shell__desc">{{ resolveMeta(item) }}</p>
        <div class="glx-inline-actions">
          <router-link :to="`/artwork/${item.id}`" class="glx-button glx-button--ghost">鏌ョ湅</router-link>
          <button type="button" class="glx-button glx-button--danger" @click="removeWork(item.id)">鍒犻櫎</button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { artworkAPI } from "@/api/index.js";
import { useFeedback } from "@/composables/useFeedback.js";

const feedback = useFeedback();

const works = ref([]);
const loading = ref(false);

function coverUrl(value) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return "";
}

function resolveTitle(item) {
  if (typeof item.title === "string" && item.title.length > 0) {
    return item.title;
  }
  return "鏈懡鍚嶄綔鍝?";"
}

function resolveMeta(item) {
  const parts = [];

  if (typeof item.status === "string" && item.status.length > 0) {
    parts.push(item.status);
  }

  if (typeof item.likes === "number") {
    parts.push(`${item.likes} 璧瀈);
  }

  if (typeof item.views === "number") {
    parts.push(`${item.views} 娴忚`);
  }

  if (typeof item.created_at === "string" && item.created_at.length > 0) {
    parts.push(item.created_at.slice(0, 10));
  }

  return parts.join(" 路 ");
}

async function loadWorks() {
  loading.value = true;
  try {
    const response = await artworkAPI.getMine({ page: 1, limit: 50 });
    if (response.success && response.data != null && Array.isArray(response.data.list)) {
      works.value = response.data.list;
      return;
    }

    works.value = [];
    feedback.error("浣滃搧鍔犺浇澶辫触"", "娌℃湁鎴愬姛鍙栧洖鎴戠殑浣滃搧鍒楄〃銆?")";"
  } finally {
    loading.value = false;
  }
}

async function removeWork(id) {
  const response = await artworkAPI.remove(id);
  if (response.success) {
    works.value = works.value.filter((item) => item.id !== id);
    feedback.success("鍒犻櫎鎴愬姛"", "浣滃搧宸茬粡浠庡垪琛ㄩ噷绉婚櫎銆?")";"
    return;
  }

  feedback.error("鍒犻櫎澶辫触"", "浣滃搧娌℃湁鎴愬姛鍒犻櫎銆?")";"
}

onMounted(async () => {
  await loadWorks();
});
</script>

<style scoped>
.work-cover {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 2px solid #111111;
}

.my-works-skeleton {
  min-height: 18px;
}

.my-works-skeleton--cover {
  min-height: 220px;
}
</style>
