<template>
  <div class="glx-page-shell settings-page">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Settings</span>
      <h1 class="glx-page-shell__title">璁剧疆</h1>
      <p class="glx-page-shell__desc">
        璁剧疆椤甸渶瑕佷繚鐣欙紝瀹冪户缁壙鎺ヨ祫鏂欑紪杈戙€佷釜浜轰腑蹇冨洖璺冲拰閫€鍑虹櫥褰曘€?      </p>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <router-link to="/settings/profile" class="glx-list-card settings-link">
        <div class="glx-list-card__copy">
          <strong class="glx-list-card__title">缂栬緫璧勬枡</strong>
          <span class="glx-list-card__desc">淇敼鏄电О鍜屼釜浜虹畝浠嬨€?</span>
        </div>
      </router-link>
      <router-link to="/profile" class="glx-list-card settings-link">
        <div class="glx-list-card__copy">
          <strong class="glx-list-card__title">鎴戠殑涓婚〉</strong>
          <span class="glx-list-card__desc">杩斿洖涓汉涓績缁х画绠＄悊浣滃搧鍜屾敹钘忋€?</span>
        </div>
      </router-link>
      <router-link to="/cloud-sync" class="glx-list-card settings-link">
        <div class="glx-list-card__copy">
          <strong class="glx-list-card__title">浜戠鍚屾</strong>
          <span class="glx-list-card__desc">鏌ョ湅椤圭洰鍚屾鐘舵€佸拰鏈€杩戝悓姝ユ椂闂淬€?</span>
        </div>
      </router-link>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-section-head">
        <h2 class="glx-section-title">璐︽埛鎿嶄綔</h2>
        <span class="glx-section-meta">褰撳墠浼氳瘽</span>
      </div>
      <div class="glx-inline-actions">
        <button type="button" class="glx-button glx-button--danger" @click="handleLogout">
          閫€鍑虹櫥褰?        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.js";

const router = useRouter();
const userStore = useUserStore();

function handleLogout() {
  userStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.settings-page {
  max-width: 900px;
}

.settings-link {
  text-decoration: none;
  color: inherit;
}
</style>
