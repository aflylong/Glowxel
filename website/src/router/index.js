import { createRouter, createWebHistory } from 'vue-router'
import { getStoredAuthToken } from '@/utils/session.js'
import { isMobileDevice } from '@/utils/device-detect.js'

const Migrating = () => import('@/views/DeviceMigrating.vue')

// 设备页双版本: PC 版 = views/X.vue, 移动版 = views/mobile/X.vue
// 路由根据 UA 选择加载哪个 (vue-router 4 component 函数返回的 Promise)
function deviceDual(name) {
  return () => isMobileDevice()
    ? import(`@/views/mobile/${name}.vue`).catch(() => import(`@/views/${name}.vue`))
    : import(`@/views/${name}.vue`).catch(() => import(`@/views/mobile/${name}.vue`))
}

const routes = [
  // ===== 公共/社区类 (不动) =====
  { path: '/', name: 'Home', component: () => import('@/views/Home.vue'), meta: { shell: 'public' } },
  { path: '/community', name: 'Community', component: () => import('@/views/Community.vue'), meta: { shell: 'public' } },
  { path: '/templates', name: 'Templates', component: () => import('@/views/Templates.vue'), meta: { shell: 'public' } },
  { path: '/challenges', name: 'Challenges', component: () => import('@/views/Challenges.vue'), meta: { shell: 'public' } },
  { path: '/challenge/:id', name: 'ChallengeDetail', component: () => import('@/views/ChallengeDetail.vue'), meta: { shell: 'public' } },
  { path: '/artwork/:id', name: 'ArtworkDetail', component: () => import('@/views/ArtworkDetail.vue'), meta: { shell: 'public' } },
  { path: '/user/:id', name: 'UserProfile', component: () => import('@/views/UserProfile.vue'), meta: { shell: 'public' } },
  { path: '/user/:id/followers', name: 'UserFollowers', component: () => import('@/views/FollowList.vue'), meta: { shell: 'public' } },
  { path: '/user/:id/following', name: 'UserFollowing', component: () => import('@/views/FollowList.vue'), meta: { shell: 'public' } },
  { path: '/design-system', name: 'DesignSystem', component: () => import('@/views/DesignSystem.vue'), meta: { shell: 'public' } },
  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue'), meta: { shell: 'public' } },

  // ===== App 框架 (不动) =====
  { path: '/workspace', name: 'Workspace', component: () => import('@/views/Workspace.vue'), meta: { shell: 'app' } },
  { path: '/create', name: 'Create', component: () => import('@/views/Create.vue'), meta: { shell: 'app' } },
  { path: '/pattern-workbench', name: 'PatternWorkbench', component: () => import('@/views/PatternWorkbench.vue'), meta: { shell: 'app' } },
  { path: '/editor/:id?', name: 'Editor', component: () => import('@/views/Editor.vue'), meta: { shell: 'app' } },
  { path: '/gallery', name: 'Gallery', component: () => import('@/views/Gallery.vue'), meta: { shell: 'public' } },
  { path: '/overview/:id', name: 'Overview', component: () => import('@/views/Overview.vue'), meta: { shell: 'app', auth: true } },
  { path: '/assist/:id', name: 'Assist', component: () => import('@/views/Assist.vue'), meta: { shell: 'app', auth: true } },
  { path: '/publish-project/:id', name: 'PublishProject', component: () => import('@/views/PublishProject.vue'), meta: { shell: 'app', auth: true } },
  { path: '/profile', name: 'MyProfile', component: () => import('@/views/MyProfile.vue'), meta: { shell: 'app', auth: true } },
  { path: '/my-works', name: 'MyWorks', component: () => import('@/views/MyWorks.vue'), meta: { shell: 'app', auth: true } },
  { path: '/my-favorites', name: 'MyFavorites', component: () => import('@/views/MyFavorites.vue'), meta: { shell: 'app', auth: true } },
  { path: '/achievements', name: 'Achievements', component: () => import('@/views/Achievements.vue'), meta: { shell: 'app', auth: true } },
  { path: '/cloud-sync', name: 'CloudSync', component: () => import('@/views/CloudSync.vue'), meta: { shell: 'app', auth: true } },
  { path: '/settings', name: 'Settings', component: () => import('@/views/Settings.vue'), meta: { shell: 'app', auth: true } },
  { path: '/settings/profile', name: 'EditProfile', component: () => import('@/views/EditProfile.vue'), meta: { shell: 'app', auth: true } },
  { path: '/followers', name: 'MyFollowers', component: () => import('@/views/FollowList.vue'), meta: { shell: 'app', auth: true } },
  { path: '/following', name: 'MyFollowing', component: () => import('@/views/FollowList.vue'), meta: { shell: 'app', auth: true } },
  { path: '/design-compare', name: 'DesignCompare', component: () => import('@/views/DesignCompare.vue'), meta: { shell: 'app' } },

  // ===== 设备控制类 (双端: PC = views/X.vue, mobile = views/mobile/X.vue) =====
  { path: '/device-control', name: 'DeviceControl', component: deviceDual('DeviceControl'), meta: { shell: 'app' } },
  { path: '/ble-config', name: 'BleConfig', component: deviceDual('BleConfig'), meta: { shell: 'app' } },
  { path: '/device-params', name: 'DeviceParams', component: deviceDual('DeviceParams'), meta: { shell: 'app' } },
  { path: '/canvas-editor', name: 'CanvasEditor', component: deviceDual('CanvasEditor'), meta: { shell: 'app' } },
  { path: '/gif-player', name: 'GifPlayer', component: deviceDual('GifPlayer'), meta: { shell: 'app' } },
  { path: '/led-matrix', name: 'LedMatrix', component: deviceDual('LedMatrix'), meta: { shell: 'app' } },
  { path: '/maze-mode', name: 'MazeMode', component: deviceDual('MazeMode'), meta: { shell: 'app' } },
  { path: '/snake-mode', name: 'SnakeMode', component: deviceDual('SnakeMode'), meta: { shell: 'app' } },
  { path: '/tetris-settings', name: 'TetrisSettings', component: deviceDual('TetrisSettings'), meta: { shell: 'app' } },
  { path: '/tetris-clock-settings', name: 'TetrisClockSettings', component: deviceDual('TetrisClockSettings'), meta: { shell: 'app' } },
  { path: '/planet-screensaver', name: 'PlanetScreensaver', component: deviceDual('PlanetScreensaver'), meta: { shell: 'app' } },
  { path: '/water-world', name: 'WaterWorld', component: deviceDual('WaterWorld'), meta: { shell: 'app' } },
  { path: '/spirit-screen', name: 'SpiritScreen', component: deviceDual('SpiritScreen'), meta: { shell: 'app' } },

  // 仅移动端有 (PC 版未实现)
  { path: '/ambient-editor', name: 'AmbientEditor', component: () => import('@/views/mobile/AmbientEditor.vue'), meta: { shell: 'app' } },
  { path: '/rick-morty-portal', name: 'RickMortyPortal', component: () => import('@/views/mobile/RickMortyPortal.vue'), meta: { shell: 'app' } },
  { path: '/terraria-clock', name: 'TerrariaClock', component: () => import('@/views/mobile/TerrariaClock.vue'), meta: { shell: 'app' } },
  { path: '/minecraft-clock', name: 'MinecraftClock', component: () => import('@/views/mobile/MinecraftClock.vue'), meta: { shell: 'app' } },

  // 仅 PC 端有 (移动端未实现)
  { path: '/clock', name: 'Clock', component: () => import('@/views/Clock.vue'), meta: { shell: 'app' } },
  { path: '/animation-clock', name: 'AnimationClock', component: () => import('@/views/AnimationClock.vue'), meta: { shell: 'app' } },
  { path: '/theme-clock', name: 'ThemeClock', component: () => import('@/views/ThemeClock.vue'), meta: { shell: 'app' } },
  { path: '/device-mode', name: 'DeviceModePage', component: () => import('@/views/DeviceModePage.vue'), meta: { shell: 'app' } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

router.beforeEach((to) => {
  if (to.meta.auth && getStoredAuthToken().length === 0) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
})

// 设备页给 body 加 .is-device-page (用于沉浸式样式 + 移动端 mobile-shell)
router.afterEach((to) => {
  const isDevicePage = to.meta.shell === 'app' && (
    to.path.startsWith('/device-') ||
    to.path.startsWith('/maze-') ||
    to.path.startsWith('/snake-') ||
    to.path.startsWith('/tetris-') ||
    to.path.startsWith('/planet-') ||
    to.path.startsWith('/water-') ||
    to.path.startsWith('/spirit-') ||
    to.path.startsWith('/canvas-') ||
    to.path.startsWith('/gif-') ||
    to.path.startsWith('/led-') ||
    to.path.startsWith('/ble-') ||
    to.path.startsWith('/ambient-') ||
    to.path.startsWith('/rick-morty-') ||
    to.path.startsWith('/terraria-') ||
    to.path.startsWith('/minecraft-') ||
    to.path === '/clock' || to.path === '/animation-clock' || to.path === '/theme-clock'
  )
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('is-device-page', isDevicePage)
  }
})

export default router
