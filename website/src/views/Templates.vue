<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Templates</span>
      <h1 class="glx-page-shell__title">杈规绱犳潗</h1>
      <p class="glx-page-shell__desc">
        杩欓噷淇濈暀鐨勬槸杈规寮忔嫾璞嗗弬鑰冿紝涓嶆槸鏁村紶鎴愬搧妯℃澘銆備腑闂翠富浣撶敱浣犺嚜宸卞喅瀹氾紝鍛ㄨ竟鍋氳姳杈规垨瑁呴グ銆?      </p>
    </section>

    <section class="glx-grid glx-grid--three">
      <article v-for="item in list" :key="item.id" class="glx-section-card glx-section-card--stack">
        <img
          v-if="typeof item.image_url === 'string' && item.image_url.length > 0"
          :src="item.image_url"
          alt="template"
          class="template-cover"
        />
        <div v-else class="glx-empty-card">
          <strong class="glx-section-title">鏆傛棤灏侀潰</strong>
          <p class="glx-page-shell__desc">褰撳墠杈规绱犳潗娌℃湁鍙睍绀虹殑灏侀潰鍥俱€?</p>
        </div>
        <div class="glx-section-head">
          <strong class="glx-section-title"">{{ typeof item.name === "string" && item.name.length" > 0 ? item.name" : "鏈懡鍚嶈竟妗?"" }}</strong">"
          <span class="glx-chip glx-chip--blue">{{ typeof item.category === "string" && item.category.length > 0 ? item.category : "杈规" }}</span>
        </div>
        <p class="glx-page-shell__desc">褰撳墠缃戠珯鍙繚鐣欒竟妗嗙礌鏉愭祻瑙堜笌濂楃敤鍏ュ彛锛屼笉鍐嶆媶鎴愬彟涓€濂楁棫妯℃澘澹炽€?</p>
        <div class="glx-inline-actions">
          <button type="button" class="glx-button glx-button--primary" @click="handleUse(item)">濂楃敤杈规</button>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { templateAPI } from '@/api/index.js'

const router = useRouter()
const list = ref([])

async function handleUse(item) {
  const res = await templateAPI.use(item.id)
  if (res.success) {
    router.push(`/editor?templateId=${item.id}`)
  }
}

onMounted(async () => {
  try {
    const res = await templateAPI.getList({ page: 1, limit: 20 })
    if (res.success) list.value = res.data?.list || []
  } catch (e) {
    list.value = []
  }
})
</script>

<style scoped>
.template-cover {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border: 2px solid #111111;
}
</style>
