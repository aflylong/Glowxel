<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">My Favorites</span>
      <h1 class="glx-page-shell__title">鎴戠殑鏀惰棌</h1>
      <p class="glx-page-shell__desc">
        鏀惰棌閾捐矾闇€瑕佷繚鐣欙紝褰撳墠椤甸潰缁х画鎵挎帴宸叉敹钘忎綔鍝佺殑鏌ョ湅鍜屽彇娑堟敹钘忋€?      </p>
    </section>

    <section v-if="loading" class="glx-grid glx-grid--three">
      <article v-for="index in 3" :key="index" class="glx-skeleton-card">
        <div class="glx-skeleton favorites-skeleton favorites-skeleton--cover"></div>
        <div class="glx-skeleton favorites-skeleton"></div>
        <div class="glx-skeleton favorites-skeleton"></div>
      </article>
    </section>

    <section v-else-if="favorites.length === 0" class="glx-empty-card">
      <strong class="glx-section-title">杩樻病鏈夋敹钘忎綔鍝?</strong>
      <p class="glx-page-shell__desc">鍘荤ぞ鍖洪€涗竴閫涳紝鍠滄鐨勪綔鍝佸彲浠ョ户缁敹钘忓埌杩欓噷銆?</p>
    </section>

    <section v-else class="glx-grid glx-grid--three">
      <article v-for="item in favorites" :key="item.id" class="glx-section-card glx-section-card--stack">
        <img
          v-if="coverUrl(item.cover_url).length > 0"
          :src="coverUrl(item.cover_url)"
          alt="favorite cover"
          class="favorite-cover"
        />
        <div v-else class="glx-empty-card">
          <strong class="glx-section-title">鏆傛棤灏侀潰</strong>
          <p class="glx-page-shell__desc">褰撳墠浣滃搧娌℃湁灏侀潰鍥俱€?</p>
        </div>
        <strong class="glx-section-title">{{ resolveTitle(item) }}</strong>
        <p class="glx-page-shell__desc">{{ resolveMeta(item) }}</p>
        <div class="glx-inline-actions">
          <router-link :to="`/artwork/${item.id}`" class="glx-button glx-button--ghost">鏌ョ湅</router-link>
          <button type="button" class="glx-button glx-button--danger" @click="removeFavorite(item.id)">鍙栨秷鏀惰棌</button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { collectAPI } from "@/api/index.js";
import { useFeedback } from "@/composables/useFeedback.js";

const feedback = useFeedback();

const favorites = ref([]);
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

  if (typeof item.author_name === "string" && item.author_name.length > 0) {
    parts.push(item.author_name);
  }

  if (typeof item.likes === "number") {
    parts.push(`${item.likes} 璧瀈);
  }

  if (typeof item.views === "number") {
    parts.push(`${item.views} 娴忚`);
  }

  return parts.join(" 路 ");
}

async function loadFavorites() {
  loading.value = true;
  try {
    const response = await collectAPI.getMyCollections({ page: 1, limit: 50 });
    if (response.success && response.data != null && Array.isArray(response.data.list)) {
      favorites.value = response.data.list;
      return;
    }

    favorites.value = [];
    feedback.error("鏀惰棌鍔犺浇澶辫触"", "娌℃湁鎴愬姛鍙栧洖鏀惰棌鍒楄〃銆?")";"
  } finally {
    loading.value = false;
  }
}

async function removeFavorite(artworkId) {
  const response = await collectAPI.uncollect(artworkId);
  if (response.success) {
    favorites.value = favorites.value.filter((item) => item.id !== artworkId);
    feedback.success("鍙栨秷鎴愬姛"", "浣滃搧宸茬粡浠庢敹钘忓垪琛ㄤ腑绉婚櫎銆?")";"
    return;
  }

  feedback.error("鍙栨秷澶辫触"", "褰撳墠浣滃搧娌℃湁鎴愬姛鍙栨秷鏀惰棌銆?")";"
}

onMounted(async () => {
  await loadFavorites();
});
</script>

<style scoped>
.favorite-cover {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 2px solid #111111;
}

.favorites-skeleton {
  min-height: 18px;
}

.favorites-skeleton--cover {
  min-height: 220px;
}
</style>
