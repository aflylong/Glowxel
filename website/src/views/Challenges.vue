<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Challenges</span>
      <h1 class="glx-page-shell__title">鍒涗綔鎸戞垬</h1>
      <p class="glx-page-shell__desc">
        缃戠珯褰撳墠淇濈暀鎸戞垬娴忚鍜屼綔鍝佸睍绀猴紝涓嶅啀鍦ㄨ处鍙蜂綋绯绘湭鍐荤粨鍓嶇户缁繚鐣欏弬涓庝笌鎶曠鐨勫崐鎴愬搧鍔ㄤ綔銆?      </p>
    </section>

    <section class="glx-stack">
      <article
        v-for="item in list"
        :key="item.id"
        class="glx-section-card glx-section-card--stack"
      >
        <div class="glx-section-head">
          <div class="glx-stack challenge-copy">
            <span class="glx-chip" :class="statusChipClass(item.status)">{{ statusText(item.status) }}</span>
            <strong class="glx-section-title"">{{ item.title || "鏈懡鍚嶆寫鎴?"" }}</strong">"
          </div>
          <span class="glx-section-meta">{{ item.end_date ? item.end_date.slice(0, 10) : "--" }}</span>
        </div>
        <p class="glx-page-shell__desc">{{ item.description || "鏆傛棤鎻忚堪" }}</p>
        <div class="glx-kv-grid">
          <div class="glx-kv-card">
            <span class="glx-kv-card__label">鍙備笌浜烘暟</span>
            <strong class="glx-kv-card__value">{{ item.participants || 0 }}</strong>
          </div>
          <div class="glx-kv-card">
            <span class="glx-kv-card__label">褰撳墠鐘舵€?</span>
            <strong class="glx-kv-card__value">{{ statusText(item.status) }}</strong>
          </div>
        </div>
        <div class="glx-inline-actions">
          <router-link :to="`/challenge/${item.id}`" class="glx-button glx-button--ghost">鏌ョ湅璇︽儏</router-link>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { challengeAPI } from '@/api/index.js'

const list = ref([])

function statusText(s) {
  return { active: '杩涜涓?, ended: '宸茬粨鏉?, upcoming: '鍗冲皢寮€濮? }[s] || '鏈煡'
}

function statusChipClass(status) {
  if (status === 'active') return 'glx-chip--green'
  if (status === 'upcoming') return 'glx-chip--yellow'
  return ''
}

onMounted(async () => {
  try {
    const res = await challengeAPI.getList({ page: 1, limit: 10 })
    if (res.success) list.value = res.data?.list || []
  } catch (e) {
    list.value = []
  }
})
</script>

<style scoped>
.challenge-copy {
  gap: 10px;
}
</style>
