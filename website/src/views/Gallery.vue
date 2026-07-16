<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Gallery</span>
      <h1 class="glx-page-shell__title">{{ pageTitle }}</h1>
      <p class="glx-page-shell__desc">
        杩欓噷缁熶竴鎵挎帴浣滃搧銆佹ā鏉垮拰鎸戞垬闆嗗悎椤碉紝Web 绔笉鍐嶆妸鍚屼竴绫诲垪琛ㄦ媶鎴愬濂楀３瀛愩€?      </p>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-tabs">
        <button
          v-for="item in typeTabs"
          :key="item.value"
          class="glx-tab"
          :class="{ 'is-active': pageType === item.value }"
          type="button"
          @click="switchType(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="glx-form-grid glx-form-grid--two">
        <label class="glx-field">
          <span class="glx-field__label">鎼滅储</span>
          <input v-model="searchTerm" class="glx-input" placeholder="杈撳叆鏍囬鎴栦綔鑰?" /">"
        </label>
        <label class="glx-field">
          <span class="glx-field__label">姣忛〉鏁伴噺</span>
          <select v-model.number="limit" class="glx-select">
            <option :value="12">12</option>
            <option :value="20">20</option>
            <option :value="40">40</option>
          </select>
        </label>
      </div>
    </section>

    <div v-if="loading" class="glx-grid glx-grid--three">
      <GlxSkeletonCard />
      <GlxSkeletonCard />
      <GlxSkeletonCard />
    </div>

    <section v-else class="glx-grid glx-grid--three">
      <article
        v-for="item in filteredItems"
        :key="item.id"
        class="glx-section-card glx-section-card--stack"
      >
        <img
          v-if="resolveCover(item).length > 0"
          :src="resolveCover(item)"
          alt="cover"
          style="display:block;width:100%;aspect-ratio:1;border:2px solid #111111;object-fit:cover;"
        />
        <div v-else class="glx-empty-card">
          <strong class="glx-section-title">鏆傛棤灏侀潰</strong>
          <p class="glx-page-shell__desc">褰撳墠鏉＄洰娌℃湁鍙睍绀虹殑灏侀潰鍥俱€?</p>
        </div>
        <strong class="glx-section-title" style="font-size:18px;">{{ resolveTitle(item) }}</strong>
        <p class="glx-page-shell__desc">{{ resolveMeta(item) }}</p>
        <div class="glx-inline-actions">
          <router-link
            v-if="pageType === 'artworks'"
            :to="`/artwork/${item.id}`"
            class="glx-button glx-button--ghost"
          >
            鏌ョ湅璇︽儏
          </router-link>
          <router-link
            v-if="pageType === 'templates'"
            to="/create"
            class="glx-button glx-button--ghost"
          >
            浣跨敤妯℃澘
          </router-link>
          <router-link
            v-if="pageType === 'challenges'"
            :to="`/challenge/${item.id}`"
            class="glx-button glx-button--ghost"
          >
            鏌ョ湅鎸戞垬
          </router-link>
        </div>
      </article>
    </section>

    <section class="glx-inline-actions">
      <button type="button" class="glx-button glx-button--ghost" @click="loadMore">鍔犺浇鏇村</button>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { artworkAPI, challengeAPI, templateAPI } from "@/api/index.js";
import GlxSkeletonCard from "@/components/glx/GlxSkeletonCard.vue";

const route = useRoute();
const router = useRouter();

const pageType = ref("artworks");
const items = ref([]);
const searchTerm = ref("");
const page = ref(1);
const limit = ref(12);
const loading = ref(false);

const typeTabs = [
  { label: "浣滃搧", value: "artworks" },
  { label: "妯℃澘", value: "templates" },
  { label: "鎸戞垬", value: "challenges" },
];

const pageTitle = computed(() => {
  if (pageType.value === "templates") {
    return "妯℃澘搴?";"
  }
  if (pageType.value === "challenges") {
    return "鎸戞垬搴?";"
  }
  return "浣滃搧搴?";"
});

const filteredItems = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (term.length === 0) {
    return items.value;
  }
  return items.value.filter((item) => {
    const title = resolveTitle(item).toLowerCase();
    const meta = resolveMeta(item).toLowerCase();
    return title.includes(term) || meta.includes(term);
  });
});

function syncTypeFromRoute() {
  if (route.query.type === "templates") {
    pageType.value = "templates";
    return;
  }
  if (route.query.type === "challenges") {
    pageType.value = "challenges";
    return;
  }
  pageType.value = "artworks";
}

function switchType(nextType) {
  router.push({
    path: "/gallery",
    query: { type: nextType },
  });
}

function resolveTitle(item) {
  if (typeof item.title === "string" && item.title.length > 0) {
    return item.title;
  }
  if (typeof item.name === "string" && item.name.length > 0) {
    return item.name;
  }
  return "鏈懡鍚?";"
}

function resolveMeta(item) {
  if (pageType.value === "templates") {
    if (typeof item.category === "string" && item.category.length > 0) {
      return item.category;
    }
    return "妯℃澘";
  }
  if (pageType.value === "challenges") {
    if (typeof item.description === "string" && item.description.length > 0) {
      return item.description;
    }
    return "鎸戞垬";
  }
  if (typeof item.author_name === "string" && item.author_name.length > 0) {
    return item.author_name;
  }
  return "绀惧尯浣滃搧";
}

function resolveCover(item) {
  if (typeof item.cover_url === "string" && item.cover_url.length > 0) {
    return item.cover_url;
  }
  if (typeof item.image_url === "string" && item.image_url.length > 0) {
    return item.image_url;
  }
  if (typeof item.banner_url === "string" && item.banner_url.length > 0) {
    return item.banner_url;
  }
  return "";
}

async function loadItems(reset) {
  if (reset) {
    page.value = 1;
  }
  loading.value = true;
  try {
    let response;
    if (pageType.value === "templates") {
      response = await templateAPI.getList({ page: page.value, limit: limit.value });
    } else if (pageType.value === "challenges") {
      response = await challengeAPI.getList({ page: page.value, limit: limit.value });
    } else {
      response = await artworkAPI.getList({ page: page.value, limit: limit.value });
    }

    if (response.success) {
      let list = [];
      if (response.data != null && Array.isArray(response.data.list)) {
        list = response.data.list;
      }
      if (reset) {
        items.value = list;
      } else {
        items.value = items.value.concat(list);
      }
    }
  } finally {
    loading.value = false;
  }
}

function loadMore() {
  page.value += 1;
  loadItems(false);
}

onMounted(() => {
  syncTypeFromRoute();
  loadItems(true);
});

watch(
  () => [route.query.type, limit.value],
  () => {
    syncTypeFromRoute();
    loadItems(true);
  },
);
</script>
