<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Social</span>
      <h1 class="glx-page-shell__title">{{ pageTitle }}</h1>
      <p class="glx-page-shell__desc">
        鍏崇郴閾鹃〉缁х画鎵挎帴绮変笣鍜屽叧娉ㄥ垪琛紝鍏虫敞鍔ㄤ綔涔熶竴璧锋仮澶嶅洖鏉ャ€?      </p>
      <div class="glx-inline-actions">
        <button type="button" class="glx-button glx-button--ghost" @click="switchTab('followers')">鐪嬬矇涓?</button>
        <button type="button" class="glx-button glx-button--ghost" @click="switchTab('following')">鐪嬪叧娉?</button>
      </div>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-tabs">
        <button type="button" class="glx-tab" :class="{ 'is-active': tab === 'followers' }" @click="switchTab('followers')">
          绮変笣
        </button>
        <button type="button" class="glx-tab" :class="{ 'is-active': tab === 'following' }" @click="switchTab('following')">
          鍏虫敞
        </button>
      </div>
    </section>

    <div v-if="loading" class="glx-grid glx-grid--two">
      <GlxSkeletonCard />
      <GlxSkeletonCard />
    </div>

    <section v-else-if="list.length === 0" class="glx-empty-card">
      <strong class="glx-section-title">褰撳墠鍒楄〃涓虹┖</strong>
      <p class="glx-page-shell__desc">绛夊叧绯婚摼寤虹珛鍚庯紝杩欓噷浼氳嚜鍔ㄦ樉绀哄搴旂敤鎴峰垪琛ㄣ€?</p>
    </section>

    <section v-else class="glx-stack">
      <article v-for="user in list" :key="user.id" class="glx-list-card follow-row">
        <div class="follow-row__avatar">{{ resolveAvatarText(user.name) }}</div>
        <div class="glx-list-card__copy">
          <strong class="glx-list-card__title">{{ resolveUserName(user) }}</strong>
          <span class="glx-list-card__desc">{{ resolveUserBio(user) }}</span>
        </div>
        <div class="glx-inline-actions">
          <router-link :to="`/user/${user.id}`" class="glx-button glx-button--ghost">鏌ョ湅涓婚〉</router-link>
          <button
            v-if="showToggleButton(user)"
            type="button"
            class="glx-button glx-button--ghost"
            @click="handleToggle(user)"
          >
            {{ user.is_following ? "宸插叧娉?" : "鍏虫敞""" }}"
          </button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { followAPI } from "@/api/index.js";
import { useFeedback } from "@/composables/useFeedback.js";
import GlxSkeletonCard from "@/components/glx/GlxSkeletonCard.vue";
import { useUserStore } from "@/stores/user.js";

const route = useRoute();
const router = useRouter();
const feedback = useFeedback();
const userStore = useUserStore();

const tab = ref("followers");
const list = ref([]);
const loading = ref(false);

const pageTitle = computed(() => {
  if (profileUserId.value.length > 0) {
    return tab.value === "following" ? "TA 鐨勫叧娉? : "TA 鐨勭矇涓?;
  }
  return tab.value === "following" ? "鎴戠殑鍏虫敞" : "鎴戠殑绮変笣";
});

const profileUserId = computed(() => {
  if (typeof route.params.id === "string" && route.params.id.length > 0) {
    return route.params.id;
  }
  return "";
});

const targetUserId = computed(() => {
  if (profileUserId.value.length > 0) {
    return profileUserId.value;
  }
  if (userStore.userId != null) {
    return String(userStore.userId);
  }
  return "";
});

function syncTabFromRoute() {
  if (route.path.includes("/following")) {
    tab.value = "following";
    return;
  }
  tab.value = "followers";
}

function resolveUserName(user) {
  if (typeof user.name === "string" && user.name.length > 0) {
    return user.name;
  }
  return "鏈懡鍚嶇敤鎴?";"
}

function resolveUserBio(user) {
  if (typeof user.bio === "string" && user.bio.length > 0) {
    return user.bio;
  }
  return "鏆傛棤绠€浠?";"
}

function resolveAvatarText(name) {
  if (typeof name === "string" && name.length > 0) {
    return name.slice(0, 1).toUpperCase();
  }
  return "?";
}

async function load(currentTab) {
  if (targetUserId.value.length === 0) {
    list.value = [];
    return;
  }

  loading.value = true;
  try {
    const response = currentTab === "followers"
      ? await followAPI.getFollowers(targetUserId.value, { page: 1, limit: 50 })
      : await followAPI.getFollowing(targetUserId.value, { page: 1, limit: 50 });

    if (response.success && response.data != null && Array.isArray(response.data.list)) {
      list.value = response.data.list;
      return;
    }

    list.value = [];
    feedback.error("鍒楄〃鍔犺浇澶辫触"", response.message || "鍏崇郴閾惧垪琛ㄦ病鏈夋垚鍔熻繑鍥炪€?")";"
  } catch (error) {
    list.value = [];
    if (error instanceof Error) {
      feedback.error("鍒楄〃鍔犺浇澶辫触", error.message);
    } else {
      feedback.error("鍒楄〃鍔犺浇澶辫触"", "鍏崇郴閾惧垪琛ㄨ鍙栧け璐ャ€?")";"
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
  if (profileUserId.value.length > 0) {
    router.push(`/user/${profileUserId.value}/${nextTab}`);
    return;
  }
  router.push(`/${nextTab}`);
}

function showToggleButton(user) {
  if (userStore.userId == null) {
    return true;
  }
  return String(user.id) !== String(userStore.userId);
}

async function handleToggle(user) {
  if (!userStore.isLoggedIn) {
    router.push({
      name: "Login",
      query: {
        redirect: route.fullPath,
      },
    });
    return;
  }

  const response = await followAPI.toggle(user.id);
  if (!response.success) {
    feedback.error("鎿嶄綔澶辫触"", "鍏虫敞鐘舵€佹病鏈夋垚鍔熸洿鏂般€?")";"
    return;
  }

  if (response.data != null && typeof response.data.followed === "boolean") {
    user.is_following = response.data.followed;
    return;
  }

  user.is_following = !user.is_following;
}

onMounted(async () => {
  syncTabFromRoute();
  await load(tab.value);
});

watch(
  () => route.fullPath,
  async () => {
    syncTabFromRoute();
    await load(tab.value);
  },
);
</script>

<style scoped>
.follow-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.follow-row__avatar {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #111111;
  background: var(--tone-blue-soft);
  font-size: 18px;
  font-weight: 900;
  color: var(--nb-ink);
  flex-shrink: 0;
}
</style>
