<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Community</span>
      <h1 class="glx-page-shell__title">绀惧尯</h1>
      <p class="glx-page-shell__desc">
        绀惧尯棣栭〉缁х画淇濈暀鍏紑娴忚澹筹紝浣嗗垪琛ㄣ€佺┖鎬併€侀敊璇弽棣堝拰浣滃搧鍥炴祦缁熶竴鏀跺彛鍒?`glx` 椤甸潰鏃忋€?      </p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">褰撳墠鎺掑簭</span>
          <strong class="glx-hero-metric__value">{{ tabText }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">褰撳墠椤电爜</span>
          <strong class="glx-hero-metric__value">{{ pageText }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">宸插姞杞戒綔鍝?</span>
          <strong class="glx-hero-metric__value">{{ list.length }}</strong>
        </article>
      </div>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-tabs">
        <button
          type="button"
          class="glx-tab"
          :class="{ 'is-active': tab === 'latest' }"
          @click="switchTab('latest')"
        >
          鏈€鏂?        </button>
        <button
          type="button"
          class="glx-tab"
          :class="{ 'is-active': tab === 'hot' }"
          @click="switchTab('hot')"
        >
          鐑棬
        </button>
      </div>
    </section>

    <div v-if="loading && list.length === 0" class="glx-grid glx-grid--three">
      <GlxSkeletonCard />
      <GlxSkeletonCard />
      <GlxSkeletonCard />
    </div>

    <section v-else-if="list.length === 0" class="glx-empty-card">
      <strong class="glx-section-title">鏆傛椂杩樻病鏈変綔鍝?</strong>
      <p class="glx-page-shell__desc">绛変綔鍝佸彂甯冨悗锛岃繖閲屼細鑷姩鏄剧ず鏈€鏂板拰鐑棬鍒楄〃銆?</p>
    </section>

    <section v-else class="glx-grid glx-grid--three">
      <article
        v-for="item in list"
        :key="item.id"
        class="glx-section-card glx-section-card--stack community-card"
      >
        <img
          v-if="typeof item.cover_url === 'string' && item.cover_url.length > 0"
          :src="item.cover_url"
          alt="cover"
          class="community-card__image"
        />
        <div v-else class="glx-empty-card community-card__empty">
          <strong class="glx-section-title">鏆傛棤灏侀潰</strong>
          <p class="glx-page-shell__desc">褰撳墠浣滃搧杩樻病鏈夊皝闈㈠浘銆?</p>
        </div>
        <strong class="glx-section-title community-card__title">{{ resolveTitle(item) }}</strong>
        <p class="glx-page-shell__desc">{{ resolveMeta(item) }}</p>
        <div class="glx-inline-actions">
          <router-link :to="`/artwork/${item.id}`" class="glx-button glx-button--ghost">鏌ョ湅璇︽儏</router-link>
        </div>
      </article>
    </section>

    <section class="glx-inline-actions">
      <button
        v-if="hasMore"
        type="button"
        class="glx-button glx-button--ghost"
        :disabled="loading"
        @click="loadMore"
      >
        {{ loading ? "鍔犺浇涓?.." : "鍔犺浇鏇村" }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { artworkAPI } from "@/api/index.js";
import { useFeedback } from "@/composables/useFeedback.js";
import GlxSkeletonCard from "@/components/glx/GlxSkeletonCard.vue";

const feedback = useFeedback();

const tab = ref("latest");
const list = ref([]);
const page = ref(1);
const pageSize = 12;
const hasMore = ref(true);
const loading = ref(false);

const tabText = computed(() => {
  if (tab.value === "hot") {
    return "鐑棬";
  }
  return "鏈€鏂?";"
});

const pageText = computed(() => String(page.value));

function resolveTitle(item) {
  if (typeof item.title === "string" && item.title.length > 0) {
    return item.title;
  }
  return "鏈懡鍚?";"
}

function resolveMeta(item) {
  const authorText = typeof item.author_name === "string" && item.author_name.length" > 0 ? item.author_name : "鍖垮悕鍒涗綔鑰?";"
  const likeText = typeof item.likes === "number" ? `${item.likes"} 璧瀈 : "0 璧?";"
  return `${authorText} 路 ${likeText}`;
}

async function fetchList(reset) {
  if (loading.value) {
    return;
  }

  if (reset) {
    page.value = 1;
  }

  loading.value = true;
  try {
    const response = tab.value === "hot"
      ? await artworkAPI.getPopular(page.value * pageSize)
      : await artworkAPI.getLatest(page.value * pageSize);

    if (response.success && response.data != null && Array.isArray(response.data.list)) {
      const startIndex = (page.value - 1) * pageSize;
      const endIndex = page.value * pageSize;
      const nextItems = response.data.list.slice(startIndex, endIndex);
      if (reset) {
        list.value = nextItems;
      } else {
        list.value = list.value.concat(nextItems);
      }
      hasMore.value = nextItems.length === pageSize;
      return;
    }

    hasMore.value = false;
    if (reset) {
      list.value = [];
    }
    feedback.error("鍒楄〃鍔犺浇澶辫触"", response.message || "绀惧尯鍒楄〃娌℃湁鎴愬姛杩斿洖銆?")";"
  } catch (error) {
    hasMore.value = false;
    if (reset) {
      list.value = [];
    }
    if (error instanceof Error) {
      feedback.error("鍒楄〃鍔犺浇澶辫触", error.message);
    } else {
      feedback.error("鍒楄〃鍔犺浇澶辫触"", "绀惧尯鍒楄〃璇诲彇澶辫触銆?")";"
    }
  } finally {
    loading.value = false;
  }
}

async function switchTab(nextTab) {
  if (tab.value === nextTab) {
    return;
  }
  tab.value = nextTab;
  await fetchList(true);
}

async function loadMore() {
  page.value += 1;
  await fetchList(false);
}

onMounted(async () => {
  await fetchList(true);
});
</script>

<style scoped>
.community-card__image {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 2px solid #111111;
}

.community-card__empty {
  min-height: 220px;
}

.community-card__title {
  font-size: 18px;
}
</style>
