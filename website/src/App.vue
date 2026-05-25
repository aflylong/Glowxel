<template>
  <div id="app">
    <PublicShell v-if="shellName === 'public'">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </PublicShell>

    <AppShell v-else-if="shellName === 'app'">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </AppShell>

    <main v-else class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <GlxBlockingLayer />
    <GlxToastViewport />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PublicShell from '@/components/layout/PublicShell.vue'
import AppShell from '@/components/layout/AppShell.vue'
import GlxBlockingLayer from '@/components/glx/GlxBlockingLayer.vue'
import GlxToastViewport from '@/components/glx/GlxToastViewport.vue'
import { useUserStore } from '@/stores/user.js'

const route = useRoute()
const userStore = useUserStore()

const shellName = computed(() => {
  // 设备控制类页面 (uniapp 复刻) 走沉浸式无壳模式 — 不显示顶部 NavBar / 底部 Footer
  // 跟 uniapp 完全一致 (满屏 + 自带 navbar + tabs)
  if (route.meta?.shell === 'app' && isDevicePath(route.path)) {
    return 'none'
  }
  // 其他页面 (首页/社区/作品/拼豆 等) 保留 PublicShell (含 NavBar + Footer + 备案信息)
  return 'public'
})

function isDevicePath(p) {
  if (!p) return false
  return p.startsWith('/device-') ||
    p.startsWith('/maze-') ||
    p.startsWith('/snake-') ||
    p.startsWith('/tetris-') ||
    p.startsWith('/planet-') ||
    p.startsWith('/water-') ||
    p.startsWith('/spirit-') ||
    p.startsWith('/canvas-') ||
    p.startsWith('/gif-') ||
    p.startsWith('/led-') ||
    p.startsWith('/ble-') ||
    p.startsWith('/ambient-') ||
    p.startsWith('/rick-morty-') ||
    p.startsWith('/terraria-') ||
    p.startsWith('/minecraft-') ||
    p === '/clock' || p === '/animation-clock' || p === '/theme-clock'
}

onMounted(async () => {
  await userStore.init()
})
</script>

<style>
#app {
  min-height: 100vh;
}

.main-content {
  position: relative;
  z-index: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
