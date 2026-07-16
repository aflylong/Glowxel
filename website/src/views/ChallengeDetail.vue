<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Challenge Detail</span>
      <h1 class="glx-page-shell__title">{{ challenge.title || "鎸戞垬璇︽儏" }}</h1>
      <p class="glx-page-shell__desc"">{{ challenge.description || "褰撳墠鎸戞垬鏆傛棤鎻忚堪銆?"" }}</p">"
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鐘舵€?</span>
          <strong class="glx-hero-metric__value">{{ statusText(challenge.status) }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鎴鏃堕棿</span>
          <strong class="glx-hero-metric__value">{{ challenge.end_date ? challenge.end_date.slice(0, 10) : "--" }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鍙備笌浜烘暟</span>
          <strong class="glx-hero-metric__value">{{ challenge.participants || 0 }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">浣滃搧鏁伴噺</span>
          <strong class="glx-hero-metric__value">{{ submissions.length }}</strong>
        </article>
      </div>
      <div class="glx-inline-actions" v-if="challenge.status === 'active'">
        <button type="button" class="glx-button glx-button--primary" @click="handleJoin">
          {{ joined ? "缁х画鍒涗綔" : "鍙備笌鎸戞垬" }}
        </button>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <article class="glx-section-card glx-section-card--stack">
        <img
          v-if="typeof challenge.banner_url === 'string' && challenge.banner_url.length > 0"
          :src="challenge.banner_url"
          alt="banner"
          class="challenge-banner"
        />
        <div v-else class="glx-empty-card">
          <strong class="glx-section-title">鏆傛棤灏侀潰</strong>
          <p class="glx-page-shell__desc">褰撳墠鎸戞垬杩樻病鏈夋í骞呭浘銆?</p>
        </div>
      </article>

      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">鎸戞垬鍔ㄤ綔</h2>
          <span class="glx-section-meta">鎭㈠鍏ュ彛</span>
        </div>
        <div class="glx-stack">
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鎸戞垬娴忚</strong>
              <span class="glx-list-card__desc">缃戠珯褰撳墠缁х画淇濈暀鎸戞垬淇℃伅鍜屽弬璧涗綔鍝佸睍绀恒€?</span>
            </div>
          </div>
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鍙備笌涓庢姇绋?</strong>
              <span class="glx-list-card__desc">鍙備笌鎸戞垬鍚庝細鐩存帴鍥炲埌缂栬緫鍣紝鍙戝竷椤典細缁х画鎵挎帴鎶曠鍔ㄤ綔銆?</span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-section-head">
        <h2 class="glx-section-title">鍙傝禌浣滃搧</h2>
        <span class="glx-section-meta">{{ submissions.length }} 浠?</span>
      </div>

      <div v-if="submissions.length === 0" class="glx-empty-card">
        <strong class="glx-section-title">鏆傛棤鍙傝禌浣滃搧</strong>
        <p class="glx-page-shell__desc">鍚庣画鏈変綔鍝佹彁浜ゅ悗锛岃繖閲屼細鑷姩灞曠ず瀵瑰簲鍒楄〃銆?</p>
      </div>

      <div v-else class="glx-grid glx-grid--three">
        <article v-for="item in submissions" :key="item.id" class="glx-section-card glx-section-card--stack">
          <img
            v-if="typeof item.cover_url === 'string' && item.cover_url.length > 0"
            :src="item.cover_url"
            alt="submission"
            class="challenge-banner"
          />
          <div v-else class="glx-empty-card">
            <strong class="glx-section-title">鏆傛棤灏侀潰</strong>
            <p class="glx-page-shell__desc">褰撳墠浣滃搧娌℃湁灏侀潰鍥俱€?</p>
          </div>
          <strong class="glx-section-title"">{{ item.title || "鏈懡鍚嶄綔鍝?"" }}</strong">"
          <p class="glx-page-shell__desc"">{{ item.author_name || "鍖垮悕鍒涗綔鑰?"" }}</p">"
          <div class="glx-inline-actions">
            <router-link :to="`/artwork/${item.id}`" class="glx-button glx-button--ghost">鏌ョ湅浣滃搧</router-link>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { challengeAPI } from '@/api/index.js'
import { useUserStore } from '@/stores/user.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const challenge = ref({})
const submissions = ref([])
const joined = ref(false)

function statusText(s) {
  return { active: '杩涜涓?, ended: '宸茬粨鏉?, upcoming: '鍗冲皢寮€濮? }[s] || '--'
}

async function loadChallenge() {
  const id = route.params.id
  challenge.value = {}
  submissions.value = []
  joined.value = false
  const [res, subRes] = await Promise.allSettled([
    challengeAPI.getDetail(id),
    challengeAPI.getSubmissions(id, { page: 1, limit: 20 })
  ])
  if (res.status === 'fulfilled' && res.value?.success) {
    challenge.value = res.value.data?.challenge || res.value.data || {}
    if (typeof challenge.value.joined === 'boolean') {
      joined.value = challenge.value.joined
    }
  }
  if (subRes.status === 'fulfilled' && subRes.value?.success) {
    submissions.value = subRes.value.data?.list || []
  }
}

async function handleJoin() {
  if (!userStore.isLoggedIn) {
    router.push({
      name: 'Login',
      query: {
        redirect: route.fullPath,
      },
    })
    return
  }

  if (joined.value) {
    router.push(`/editor?challengeId=${challenge.value.id}`)
    return
  }

  const response = await challengeAPI.join(challenge.value.id)
  if (!response.success) {
    return
  }

  joined.value = true
  if (response.data != null && response.data.changed === true && typeof challenge.value.participants === 'number') {
    challenge.value.participants += 1
  }
  router.push(`/editor?challengeId=${challenge.value.id}`)
}

onMounted(loadChallenge)
watch(() => route.params.id, loadChallenge)
</script>

<style scoped>
.challenge-banner {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border: 2px solid #111111;
}
</style>
