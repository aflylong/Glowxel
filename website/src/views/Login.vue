<template>
  <div class="glx-page-shell login-page">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Login</span>
      <h1 class="glx-page-shell__title">鐧诲綍鍏夋牸鍍忕礌宸ュ潑</h1>
      <p class="glx-page-shell__desc">
        缃戠珯鐨勭櫥褰曞叆鍙ｉ渶瑕佷繚鐣欙紝鐧诲綍鍚庢墠鑳借繘鍏ヤ綔鍝佺鐞嗐€佸彂甯冨拰涓汉涓績銆傚綋鍓嶉〉闈㈢户缁壙鎺ヤ粨搴撻噷宸茬粡瀛樺湪鐨勮处鍙峰瘑鐮侀摼璺€?      </p>
    </section>

    <section class="glx-section-card glx-section-card--stack login-card">
      <div class="glx-form-grid">
        <label class="glx-field">
          <span class="glx-field__label">鐢ㄦ埛鍚?</span>
          <input
            v-model="form.username"
            class="glx-input"
            type="text"
            autocomplete="username"
            placeholder="璇疯緭鍏ョ敤鎴峰悕"
          />
        </label>

        <label class="glx-field">
          <span class="glx-field__label">瀵嗙爜</span>
          <input
            v-model="form.password"
            class="glx-input"
            type="password"
            autocomplete="current-password"
            placeholder="璇疯緭鍏ュ瘑鐮?"
          />
        </label>
      </div>

      <div class="glx-inline-actions">
        <button
          type="button"
          class="glx-button glx-button--primary"
          :disabled="userStore.loading"
          @click="handleLogin"
        >
          {{ userStore.loading ? "鐧诲綍涓?.." : "鐧诲綍" }}
        </button>
      </div>

      <p v-if="errorMessage.length > 0" class="login-error">{{ errorMessage }}</p>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.js";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const form = reactive({
  username: "",
  password: "",
});
const errorMessage = ref("");

async function handleLogin() {
  errorMessage.value = "";

  if (form.username.trim().length === 0 || form.password.trim().length === 0) {
    errorMessage.value = "璇疯緭鍏ョ敤鎴峰悕鍜屽瘑鐮?";"
    return;
  }

  const response = await userStore.loginWithAdmin({
    username: form.username.trim(),
    password: form.password,
  });

  if (response.success) {
    if (typeof route.query.redirect === "string" && route.query.redirect.length > 0) {
      router.push(route.query.redirect);
      return;
    }
    router.push("/profile");
    return;
  }

  if (typeof response.message === "string" && response.message.length > 0) {
    errorMessage.value = response.message;
    return;
  }

  errorMessage.value = "鐧诲綍澶辫触";
}
</script>

<style scoped>
.login-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 48px 24px 80px;
}

.login-card {
  max-width: 420px;
}

.login-error {
  color: var(--nb-coral);
  font-size: 13px;
  font-weight: 800;
}
</style>
