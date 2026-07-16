<template>
  <div class="glx-page-shell edit-profile-page">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Edit Profile</span>
      <h1 class="glx-page-shell__title">缂栬緫璧勬枡</h1>
      <p class="glx-page-shell__desc">
        璧勬枡椤典篃鎭㈠鍥炴潵锛岀户缁壙鎺ユ樀绉板拰涓汉绠€浠嬩慨鏀广€?      </p>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-form-grid">
        <label class="glx-field">
          <span class="glx-field__label">鏄电О</span>
          <input v-model="form.name" class="glx-input" maxlength="20" placeholder="璇疯緭鍏ユ樀绉?" /">"
        </label>
        <label class="glx-field">
          <span class="glx-field__label">涓汉绠€浠?</span>
          <textarea
            v-model="form.bio"
            class="glx-textarea"
            maxlength="100"
            placeholder="浠嬬粛涓€涓嬭嚜宸卞惂"
          ></textarea>
        </label>
      </div>
      <div class="glx-inline-actions">
        <button type="button" class="glx-button glx-button--primary" :disabled="saving" @click="handleSave">
          {{ saving ? "淇濆瓨涓?.." : "淇濆瓨" }}
        </button>
        <router-link to="/profile" class="glx-button glx-button--ghost">杩斿洖涓汉涓績</router-link>
      </div>
      <p v-if="message.length > 0" class="edit-profile-message">{{ message }}</p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.js";

const router = useRouter();
const userStore = useUserStore();

const form = reactive({
  name: "",
  bio: "",
});
const saving = ref(false);
const message = ref("");

onMounted(async () => {
  await userStore.fetchProfile();
  if (userStore.currentUser != null) {
    if (typeof userStore.currentUser.name === "string") {
      form.name = userStore.currentUser.name;
    }
    if (typeof userStore.currentUser.bio === "string") {
      form.bio = userStore.currentUser.bio;
    }
  }
});

async function handleSave() {
  if (form.name.trim().length === 0) {
    message.value = "鏄电О涓嶈兘涓虹┖";
    return;
  }

  saving.value = true;
  message.value = "";

  try {
    const response = await userStore.updateProfile({
      name: form.name.trim(),
      bio: form.bio.trim(),
    });

    if (response.success) {
      message.value = "淇濆瓨鎴愬姛";
      window.setTimeout(() => {
        router.push("/profile");
      }, 800);
      return;
    }

    if (typeof response.message === "string" && response.message.length > 0) {
      message.value = response.message;
      return;
    }

    message.value = "淇濆瓨澶辫触";
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.edit-profile-page {
  max-width: 860px;
}

.edit-profile-message {
  color: var(--nb-green);
  font-size: 13px;
  font-weight: 800;
}
</style>
