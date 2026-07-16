<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Achievements</span>
      <h1 class="glx-page-shell__title">鎴愬氨涓績</h1>
      <p class="glx-page-shell__desc">
        鎴愬氨椤典笉璇ヨ鐩存帴鍒犳帀锛屾墍浠ユ垜鎶婅繖鏉℃寮忓叆鍙ｆ仮澶嶅洖鏉ワ紝缁х画鎵挎帴涓汉鎴愰暱灞曠ず銆?      </p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">宸茶В閿?</span>
          <strong class="glx-hero-metric__value">{{ unlockedCount }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鎬绘垚灏?</span>
          <strong class="glx-hero-metric__value">{{ achievements.length }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">绉垎</span>
          <strong class="glx-hero-metric__value">{{ totalPoints }}</strong>
        </article>
      </div>
    </section>

    <section class="glx-grid glx-grid--three">
      <article v-for="achievement in achievements" :key="achievement.id" class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <strong class="glx-section-title">{{ achievement.name }}</strong>
          <span class="glx-chip" :class="rarityClass(achievement.rarity)">{{ achievement.rarity }}</span>
        </div>
        <p class="glx-page-shell__desc">{{ achievement.description }}</p>
        <div class="glx-kv-grid">
          <div class="glx-kv-card">
            <span class="glx-kv-card__label">杩涘害</span>
            <strong class="glx-kv-card__value">{{ achievement.progress }}/{{ achievement.target }}</strong>
          </div>
          <div class="glx-kv-card">
            <span class="glx-kv-card__label">绉垎</span>
            <strong class="glx-kv-card__value">{{ achievement.points }}</strong>
          </div>
        </div>
        <span class="achievement-state" :class="{ 'is-unlocked': achievement.unlocked }">
          {{ achievement.unlocked ? "宸茶В閿? : "鏈В閿? }}
        </span>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";

const achievements = [
  { id: 1, name: "鍒濆嚭鑼呭簮"", description: "瀹屾垚绗竴涓綔鍝?", progress: 1, target: 1, points: 10, rarity: "common"", unlocked: true" },"
  { id: 2, name: "鍒涗綔杈句汉"", description: "瀹屾垚 10 涓綔鍝?", progress: 6, target: 10, points: 50, rarity: "rare"", unlocked: false" },"
  { id: 3, name: "浜烘皵鏂版槦"", description: "鑾峰緱 100 涓偣璧?", progress: 89, target: 100, points: 30, rarity: "rare"", unlocked: true" },"
  { id: 4, name: "鏀惰棌瀹?, description: "鏀惰棌 20 涓綔鍝?, progress: 5, target: 20, points: 20, rarity: "common", unlocked: false },
  { id: 5, name: "绀句氦杈句汉"", description: "鍏虫敞 50 涓敤鎴?", progress: 45, target: 50, points: 25, rarity: "common"", unlocked: false" },"
  { id: 6, name: "鍍忕礌澶у笀"", description: "瀹屾垚 100 涓綔鍝?", progress: 6, target: 100, points: 200, rarity: "legendary"", unlocked: false" },"
  { id: 7, name: "杩炵画鍒涗綔鑰?, description: "杩炵画 7 澶╁垱浣?, progress: 7, target: 7, points: 40, rarity: "rare", unlocked: true },
  { id: 8, name: "鑹插僵涓撳"", description: "浣跨敤瓒呰繃 50 绉嶉鑹?", progress: 32, target: 50, points: 75, rarity: "epic"", unlocked: false" },"
];

const unlockedCount = computed(() => {
  return achievements.filter((item) => item.unlocked).length;
});

const totalPoints = computed(() => {
  return achievements.reduce((sum, item) => {
    if (item.unlocked) {
      return sum + item.points;
    }
    return sum;
  }, 0);
});

function rarityClass(rarity) {
  if (rarity === "legendary") {
    return "glx-chip--danger";
  }
  if (rarity === "epic") {
    return "glx-chip--blue";
  }
  if (rarity === "rare") {
    return "glx-chip--green";
  }
  return "glx-chip--yellow";
}
</script>

<style scoped>
.achievement-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 6px 12px;
  border: 2px solid #111111;
  font-size: 12px;
  font-weight: 900;
  color: var(--nb-text-secondary);
}

.achievement-state.is-unlocked {
  background: var(--nb-green);
  color: var(--nb-ink);
}
</style>
