<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Artwork Detail</span>
      <h1 class="glx-page-shell__title">{{ detail.title || "浣滃搧璇︽儏" }}</h1>
      <p class="glx-page-shell__desc"">{{ detail.description || "褰撳墠浣滃搧鏆傛棤鎻忚堪銆?"" }}</p">"
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">浣滆€?</span>
          <strong class="glx-hero-metric__value">{{ detail.author_name || "--" }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鐐硅禐</span>
          <strong class="glx-hero-metric__value">{{ detail.likes || 0 }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">璇勮</span>
          <strong class="glx-hero-metric__value">{{ comments.length }}</strong>
        </article>
      </div>
      <div class="glx-inline-actions">
        <button type="button" class="glx-button glx-button--ghost" @click="handleLike">
          {{ isLiked ? "鍙栨秷鐐硅禐" : "鐐硅禐" }}
        </button>
        <button type="button" class="glx-button glx-button--ghost" @click="handleCollect">
          {{ isCollected ? "鍙栨秷鏀惰棌" : "鏀惰棌" }}
        </button>
        <button
          v-if="showFollowAction"
          type="button"
          class="glx-button glx-button--ghost"
          @click="handleFollow"
        >
          {{ isFollowing ? "鍙栨秷鍏虫敞"" : "鍏虫敞浣滆€?"" }}"
        </button>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <article class="glx-section-card glx-section-card--stack">
        <img
          v-if="typeof detail.cover_url === 'string' && detail.cover_url.length > 0"
          :src="detail.cover_url"
          alt="artwork"
          class="artwork-cover"
        />
        <div v-else class="glx-empty-card">
          <strong class="glx-section-title">鏆傛棤灏侀潰</strong>
          <p class="glx-page-shell__desc">褰撳墠浣滃搧娌℃湁灏侀潰鍥俱€?</p>
        </div>
      </article>

      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">浣滃搧淇℃伅</h2>
          <span class="glx-section-meta">鍏紑娴忚</span>
        </div>
        <div class="glx-stack">
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">浣滆€呬富椤?</strong>
              <span class="glx-list-card__desc">鍏紑涓婚〉鍜屽叧娉ㄩ摼璺兘缁х画淇濈暀銆?</span>
            </div>
            <router-link v-if="detail.author_id" :to="`/user/${detail.author_id}`" class="glx-button glx-button--ghost">鏌ョ湅</router-link>
          </div>
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">浜掑姩鍔ㄤ綔</strong>
              <span class="glx-list-card__desc">鐐硅禐銆佹敹钘忋€佽瘎璁哄拰鍏虫敞鍔ㄤ綔宸茬粡鎭㈠鍒颁綔鍝佽鎯呴〉銆?</span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-section-head">
        <h2 class="glx-section-title">璇勮鍒楄〃</h2>
        <span class="glx-section-meta">{{ comments.length }} 鏉?</span>
      </div>
      <div class="glx-inline-actions">
        <input v-model="commentText" class="glx-input artwork-comment-input" placeholder="鍐欎笅浣犵殑璇勮..." />
        <button type="button" class="glx-button glx-button--primary" @click="submitComment">鍙戦€?</button>
      </div>
      <div v-if="comments.length === 0" class="glx-empty-card">
        <strong class="glx-section-title">鏆傛棤璇勮</strong>
        <p class="glx-page-shell__desc">褰撳墠浣滃搧杩樻病鏈夊叕寮€璇勮銆?</p>
      </div>
      <div v-else class="glx-stack">
        <div v-for="comment in comments" :key="comment.id" class="glx-list-card">
          <div class="glx-list-card__copy">
            <strong class="glx-list-card__title">{{ comment.user_name || "鍖垮悕鐢ㄦ埛" }}</strong>
            <span class="glx-list-card__desc">{{ comment.content || "" }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { artworkAPI, collectAPI, commentAPI, followAPI, likeAPI } from '@/api/index.js'
import { useFeedback } from '@/composables/useFeedback.js'
import { useUserStore } from '@/stores/user.js'

const route = useRoute()
const router = useRouter()
const feedback = useFeedback()
const userStore = useUserStore()
const detail = ref({})
const comments = ref([])
const commentText = ref('')
const isLiked = ref(false)
const isCollected = ref(false)
const isFollowing = ref(false)

const showFollowAction = computed(() => {
  if (!(typeof detail.value.author_id !== 'undefined' && detail.value.author_id !== null)) {
    return false
  }
  if (userStore.userId == null) {
    return true
  }
  return String(detail.value.author_id) !== String(userStore.userId)
})

async function loadArtwork() {
  const id = route.params.id
  detail.value = {}
  comments.value = []
  commentText.value = ''
  isLiked.value = false
  isCollected.value = false
  isFollowing.value = false
  const [res, cRes] = await Promise.allSettled([
    artworkAPI.getDetail(id),
    commentAPI.getList(id, { page: 1, limit: 20 }),
  ])

  if (res.status === 'fulfilled' && res.value?.success) {
    detail.value = res.value.data?.artwork || res.value.data || {}
    if (typeof detail.value.isLiked === 'boolean') {
      isLiked.value = detail.value.isLiked
    }
    if (typeof detail.value.isCollected === 'boolean') {
      isCollected.value = detail.value.isCollected
    }
    if (typeof detail.value.isFollowing === 'boolean') {
      isFollowing.value = detail.value.isFollowing
    }
  }
  if (cRes.status === 'fulfilled' && cRes.value?.success) {
    comments.value = cRes.value.data?.list || []
  }
}

function goToLogin() {
  router.push({
    name: 'Login',
    query: {
      redirect: route.fullPath,
    },
  })
}

async function handleLike() {
  if (!userStore.isLoggedIn) {
    goToLogin()
    return
  }

  let response
  if (isLiked.value) {
    response = await likeAPI.unlike(route.params.id)
  } else {
    response = await likeAPI.like(route.params.id)
  }

  if (!response.success) {
    feedback.error('鎿嶄綔澶辫触', '鐐硅禐鐘舵€佹病鏈夋垚鍔熸洿鏂般€?)
    return
  }

  isLiked.value = !isLiked.value
  if (typeof detail.value.likes === 'number') {
    if (isLiked.value) {
      detail.value.likes += 1
    } else {
      detail.value.likes = Math.max(0, detail.value.likes - 1)
    }
  }
}

async function handleCollect() {
  if (!userStore.isLoggedIn) {
    goToLogin()
    return
  }

  let response
  if (isCollected.value) {
    response = await collectAPI.uncollect(route.params.id)
  } else {
    response = await collectAPI.collect(route.params.id)
  }

  if (!response.success) {
    feedback.error('鎿嶄綔澶辫触', '鏀惰棌鐘舵€佹病鏈夋垚鍔熸洿鏂般€?)
    return
  }

  isCollected.value = !isCollected.value
}

async function handleFollow() {
  if (!userStore.isLoggedIn) {
    goToLogin()
    return
  }

  if (!(typeof detail.value.author_id !== 'undefined' && detail.value.author_id !== null)) {
    return
  }

  const response = await followAPI.toggle(detail.value.author_id)
  if (!response.success) {
    feedback.error('鎿嶄綔澶辫触', '鍏虫敞鐘舵€佹病鏈夋垚鍔熸洿鏂般€?)
    return
  }

  if (response.data != null && typeof response.data.followed === 'boolean') {
    isFollowing.value = response.data.followed
    return
  }

  isFollowing.value = !isFollowing.value
}

async function submitComment() {
  if (!userStore.isLoggedIn) {
    goToLogin()
    return
  }

  if (commentText.value.trim().length === 0) {
    return
  }

  const response = await commentAPI.add(route.params.id, commentText.value.trim())
  if (!response.success) {
    feedback.error('鍙戦€佸け璐?, '璇勮娌℃湁鎴愬姛鍙戦€併€?)
    return
  }

  if (response.data != null && response.data.comment != null) {
    comments.value.unshift(response.data.comment)
  }
  commentText.value = ''
}

onMounted(loadArtwork)
watch(() => route.params.id, loadArtwork)
</script>

<style scoped>
.artwork-cover {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border: 2px solid #111111;
  background: #f0f0f0;
}

.artwork-comment-input {
  flex: 1;
}
</style>
