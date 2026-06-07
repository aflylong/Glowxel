<template>
  <header class="glx-section-card pc-mode-topbar">
    <button
      type="button"
      class="pc-mode-topbar__back"
      :aria-label="backLabel"
      @click="handleBack"
    >
      <Icon name="direction-left" :size="40" color="#000000" />
    </button>
    <h1 class="pc-mode-topbar__title">{{ title }}</h1>
    <div class="pc-mode-topbar__spacer"></div>
  </header>
</template>

<script setup>
import { useRouter } from "vue-router";
import Icon from "@/components/uni/Icon.vue";

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  backLabel: {
    type: String,
    default: "返回",
  },
});

const router = useRouter();

function handleBack() {
  router.back();
}
</script>

<style scoped>
.pc-mode-topbar {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 72px;
  align-items: center;
  gap: 16px;
  min-height: 76px;
}

.pc-mode-topbar__back {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000000;
  background: #facc15;
  cursor: pointer;
}

.pc-mode-topbar__title {
  margin: 0;
  text-align: center;
  font-size: clamp(28px, 3vw, 34px);
  line-height: 1.2;
  font-weight: 900;
  color: #000000;
}

.pc-mode-topbar__spacer {
  width: 52px;
  height: 52px;
}

@media (max-width: 640px) {
  .pc-mode-topbar {
    grid-template-columns: 56px minmax(0, 1fr) 56px;
    min-height: 64px;
  }

  .pc-mode-topbar__back,
  .pc-mode-topbar__spacer {
    width: 42px;
    height: 42px;
  }

  .pc-mode-topbar__title {
    font-size: 22px;
  }
}
</style>
