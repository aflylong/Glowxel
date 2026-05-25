<template>
  <div class="migrating-page">
    <div class="migrating-card">
      <div class="migrating-icon">🚧</div>
      <h2 class="migrating-title">该功能正在升级</h2>
      <p class="migrating-desc">
        本页面正在按移动端体验全量重构，稍后回来。
      </p>
      <p class="migrating-route">{{ route.path }}</p>
      <router-link to="/" class="back-home">回首页</router-link>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
const route = useRoute();
</script>

<style scoped>
.migrating-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.migrating-card {
  width: 100%;
  max-width: 420px;
  background: var(--nb-surface, #fffaf2);
  border: 2px solid var(--nb-ink, #1a1a1a);
  border-radius: 16px;
  box-shadow: 4px 4px 0 var(--nb-ink, #1a1a1a);
  padding: 32px 20px;
  text-align: center;
}

.migrating-icon {
  font-size: 48px;
  line-height: 1;
  margin-bottom: 12px;
}

.migrating-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--nb-ink, #1a1a1a);
}

.migrating-desc {
  font-size: 14px;
  color: var(--nb-ink-soft, #444);
  margin: 0 0 16px;
  line-height: 1.6;
}

.migrating-route {
  font-family: monospace;
  font-size: 12px;
  color: #999;
  margin: 0 0 24px;
}

.back-home {
  display: inline-block;
  padding: 10px 20px;
  background: var(--nb-ink, #1a1a1a);
  color: var(--nb-paper, #fffaf2);
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}

.back-home:hover {
  opacity: 0.85;
}
</style>
