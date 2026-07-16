<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Profile</span>
      <h1 class="glx-page-shell__title">{{ profileName }}</h1>
      <p class="glx-page-shell__desc">{{ profileBio }}</p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">浣滃搧</span>
          <strong class="glx-hero-metric__value">{{ profileWorksCount }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">绮変笣</span>
          <strong class="glx-hero-metric__value">{{ profileFollowersCount }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鍏虫敞</span>
          <strong class="glx-hero-metric__value">{{ profileFollowingCount }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鎬荤偣璧?</span>
          <strong class="glx-hero-metric__value">{{ profileTotalLikes }}</strong>
        </article>
      </div>
      <div class="glx-inline-actions">
        <router-link to="/my-works" class="glx-button glx-button--primary">鎴戠殑浣滃搧</router-link>
        <router-link to="/my-favorites" class="glx-button glx-button--ghost">鎴戠殑鏀惰棌</router-link>
        <router-link to="/settings/profile" class="glx-button glx-button--ghost">缂栬緫璧勬枡</router-link>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">涓汉涓績鍏ュ彛</h2>
          <span class="glx-section-meta">姝ｅ紡閾捐矾</span>
        </div>
        <div class="glx-stack">
          <router-link to="/my-works" class="glx-list-card profile-link">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鎴戠殑浣滃搧</strong>
              <span class="glx-list-card__desc">鏌ョ湅銆佽繘鍏ュ拰鍒犻櫎宸插彂甯冧綔鍝併€?</span>
            </div>
          </router-link>
          <router-link to="/my-favorites" class="glx-list-card profile-link">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鎴戠殑鏀惰棌</strong>
              <span class="glx-list-card__desc">缁х画绠＄悊鏀惰棌杩囩殑鍏紑浣滃搧銆?</span>
            </div>
          </router-link>
          <router-link to="/achievements" class="glx-list-card profile-link">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鎴愬氨涓績</strong>
              <span class="glx-list-card__desc">鎭㈠涓汉鎴愬氨灞曠ず椤碉紝涓嶅啀鐩存帴鍒犳帀鍏ュ彛銆?</span>
            </div>
          </router-link>
          <router-link to="/cloud-sync" class="glx-list-card profile-link">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">浜戠鍚屾</strong>
              <span class="glx-list-card__desc">鏌ョ湅椤圭洰鍚屾鐘舵€佸拰浜戠鑽夌鏁伴噺銆?</span>
            </div>
          </router-link>
        </div>
      </article>

      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">鏈€杩戜綔鍝?</h2>
          <span class="glx-section-meta">{{ artworks.length }} 浠?</span>
        </div>
        <div v-if="artworks.length === 0" class="glx-empty-card">
          <strong class="glx-section-title">杩樻病鏈夊凡鍙戝竷浣滃搧</strong>
          <p class="glx-page-shell__desc">鍏堝幓鍒涗綔鎴栧彂甯冮」鐩紝杩欓噷灏变細鍑虹幇浣犵殑浣滃搧鍒楄〃銆?</p>
        </div>
        <div v-else class="glx-stack">
          <article v-for="item in artworks" :key="item.id" class="glx-list-card">
            <img
              v-if="coverUrl(item.cover_url).length > 0"
              :src="coverUrl(item.cover_url)"
              alt="cover"
              class="profile-cover"
            />
            <div v-else class="profile-cover profile-cover--empty">鏃?</div>
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">{{ artworkTitle(item) }}</strong>
              <span class="glx-list-card__desc">{{ artworkMeta(item) }}</span>
            </div>
            <router-link :to="`/artwork/${item.id}`" class="glx-button glx-button--ghost">鏌ョ湅</router-link>
          </article>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { artworkAPI, userAPI } from "@/api/index.js";
import { useFeedback } from "@/composables/useFeedback.js";
import { useUserStore } from "@/stores/user.js";

const feedback = useFeedback();
const userStore = useUserStore();

const artworks = ref([]);

const profileName = computed(() => {
  if (userStore.currentUser != null && typeof userStore.currentUser.name === "string" && userStore.currentUser.name.length > 0) {
    return userStore.currentUser.name;
  }
  return "涓汉涓績";
});

const profileBio = computed(() => {
  if (userStore.currentUser != null && typeof userStore.currentUser.bio === "string" && userStore.currentUser.bio.length > 0) {
    return userStore.currentUser.bio;
  }
  return "杩欓噷浼氬睍绀轰綘鐨勪綔鍝併€佹敹钘忋€佹垚灏卞拰鍚屾鐘舵€併€?";"
});

const profileWorksCount = computed(() => {
  if (userStore.currentUser != null && typeof userStore.currentUser.works_count === "number") {
    return userStore.currentUser.works_count;
  }
  return 0;
});

const profileFollowersCount = computed(() => {
  if (userStore.currentUser != null && typeof userStore.currentUser.followers_count === "number") {
    return userStore.currentUser.followers_count;
  }
  return 0;
});

const profileFollowingCount = computed(() => {
  if (userStore.currentUser != null && typeof userStore.currentUser.following_count === "number") {
    return userStore.currentUser.following_count;
  }
  return 0;
});

const profileTotalLikes = computed(() => {
  if (userStore.currentUser != null && typeof userStore.currentUser.total_likes === "number") {
    return userStore.currentUser.total_likes;
  }
  return 0;
});

function artworkTitle(item) {
  if (typeof item.title === "string" && item.title.length > 0) {
    return item.title;
  }
  return "鏈懡鍚嶄綔鍝?";"
}

function artworkMeta(item) {
  const parts = [];

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

function coverUrl(value) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return "";
}

async function loadProfile() {
  const profileResponse = await userAPI.getProfile();
  if (profileResponse.success) {
    if (profileResponse.data != null && profileResponse.data.user != null) {
      userStore.currentUser = profileResponse.data.user;
    } else if (profileResponse.data != null) {
      userStore.currentUser = profileResponse.data;
    }
  }

  const artworkResponse = await artworkAPI.getMine({ page: 1, limit: 6 });
  if (artworkResponse.success && artworkResponse.data != null && Array.isArray(artworkResponse.data.list)) {
    artworks.value = artworkResponse.data.list;
    return;
  }

  artworks.value = [];
  feedback.error("浣滃搧鍔犺浇澶辫触"", "涓汉涓績娌℃湁鎴愬姛鍙栧洖鎴戠殑浣滃搧鍒楄〃銆?")";"
}

onMounted(async () => {
  await loadProfile();
});
</script>

<style scoped>
.profile-link {
  text-decoration: none;
  color: inherit;
}

.profile-cover {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border: 2px solid #111111;
  flex-shrink: 0;
}

.profile-cover--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f2f2f2;
  font-size: 14px;
  font-weight: 900;
}
</style>
