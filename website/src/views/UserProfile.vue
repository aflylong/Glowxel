<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">User Profile</span>
      <h1 class="glx-page-shell__title">{{ user.name || "鐢ㄦ埛涓婚〉" }}</h1>
      <p class="glx-page-shell__desc"">{{ user.bio || "杩欎釜鐢ㄦ埛杩樻病鏈夌暀涓嬬畝浠嬨€?"" }}</p">"
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">浣滃搧</span>
          <strong class="glx-hero-metric__value">{{ user.works_count || 0 }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">绮変笣</span>
          <strong class="glx-hero-metric__value">{{ user.followers_count || 0 }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鍏虫敞</span>
          <strong class="glx-hero-metric__value">{{ user.following_count || 0 }}</strong>
        </article>
      </div>
      <div class="glx-inline-actions">
        <button
          v-if="showFollowButton"
          type="button"
          class="glx-button glx-button--ghost"
          @click="toggleFollowUser"
        >
          {{ isFollowing ? "鍙栨秷鍏虫敞" : "鍏虫敞 TA" }}
        </button>
        <router-link :to="`/user/${route.params.id}/followers`" class="glx-button glx-button--ghost">鐪嬬矇涓?/router-link>
        <router-link :to="`/user/${route.params.id}/following`" class="glx-button glx-button--ghost">鐪嬪叧娉?/router-link>
      </div>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-section-head">
        <h2 class="glx-section-title">TA 鐨勪綔鍝?</h2>
        <span class="glx-section-meta">{{ artworks.length }} 浠?</span>
      </div>
      <div v-if="artworks.length === 0" class="glx-empty-card">
        <strong class="glx-section-title">杩樻病鏈夊叕寮€浣滃搧</strong>
        <p class="glx-page-shell__desc">绛夎繖涓敤鎴峰彂甯冧綔鍝佸悗锛岃繖閲屼細鑷姩灞曠ず瀵瑰簲鍒楄〃銆?</p>
      </div>
      <div v-else class="glx-grid glx-grid--three">
        <article v-for="item in artworks" :key="item.id" class="glx-section-card glx-section-card--stack">
          <img
            v-if="typeof item.cover_url === 'string' && item.cover_url.length > 0"
            :src="item.cover_url"
            alt="artwork"
            class="artwork-cover"
          />
          <div v-else class="glx-empty-card">
            <strong class="glx-section-title">鏆傛棤灏侀潰</strong>
            <p class="glx-page-shell__desc">褰撳墠浣滃搧娌℃湁灏侀潰鍥俱€?</p>
          </div>
          <strong class="glx-section-title"">{{ item.title || "鏈懡鍚嶄綔鍝?"" }}</strong">"
          <p class="glx-page-shell__desc"">{{ typeof item.likes === "number" ? `${item.likes"} 璧瀈 : "0 璧?"" }}</p">"
          <div class="glx-inline-actions">
            <router-link :to="`/artwork/${item.id}`" class="glx-button glx-button--ghost">鏌ョ湅浣滃搧</router-link>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { followAPI, userAPI, artworkAPI } from '@/api/index.js'
import { useFeedback } from '@/composables/useFeedback.js'
import { useUserStore } from '@/stores/user.js'

const route = useRoute()
const feedback = useFeedback()
const userStore = useUserStore()
const user = ref({})
const artworks = ref([])
const isFollowing = ref(false)

const showFollowButton = computed(() => {
  if (userStore.userId == null) {
    return true
  }
  return String(route.params.id) !== String(userStore.userId)
})

async function loadProfile() {
  const id = route.params.id
  user.value = {}
  artworks.value = []
  try {
    const [uRes, aRes] = await Promise.all([
      userAPI.getUserDetail(id),
      artworkAPI.getUserArtworks(id, { page: 1, limit: 20 }),
    ])

    if (uRes.success) {
      user.value = uRes.data?.user || {}
      if (typeof user.value.isFollowing === 'boolean') {
        isFollowing.value = user.value.isFollowing
      }
    }
    if (aRes.success) artworks.value = aRes.data?.list || []
  } catch (e) {
    user.value = {}
    artworks.value = []
  }
}

async function toggleFollowUser() {
  if (!userStore.isLoggedIn) {
    feedback.warning('闇€瑕佺櫥褰?, '鐧诲綍鍚庢墠鑳藉叧娉ㄧ敤鎴枫€?)
    return
  }

  const response = await followAPI.toggle(route.params.id)
  if (!response.success) {
    feedback.error('鎿嶄綔澶辫触', '鍏虫敞鐘舵€佹病鏈夋垚鍔熸洿鏂般€?)
    return
  }

  if (response.data != null && typeof response.data.followed === 'boolean') {
    isFollowing.value = response.data.followed
  } else {
    isFollowing.value = !isFollowing.value
  }

  if (typeof user.value.followers_count === 'number') {
    if (isFollowing.value) {
      user.value.followers_count += 1
    } else {
      user.value.followers_count = Math.max(0, user.value.followers_count - 1)
    }
  }
}

onMounted(loadProfile)
watch(() => route.params.id, loadProfile)
</script>

<style scoped>
.artwork-cover {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 2px solid #111111;
}
</style>
