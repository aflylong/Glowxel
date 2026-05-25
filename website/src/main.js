// uni-shim 必须最先加载, 让后续 import 的 uniapp 代码能用 uni.* API
import './utils/uni-shim.js'
import { uni } from './utils/uni-shim.js'
import { isMobileDevice } from './utils/device-detect.js'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/main.css'
import './assets/styles/glx-app.css'
import './assets/styles/editor.css'
import './assets/styles/mobile-shell.css'

// 把 router 实例注入 uni-shim, 让 uni.navigateTo 等映射到 vue-router
uni._setRouter(router)

// 移动设备标记 — 配合 mobile-shell.css 切手机壳样式
if (typeof document !== 'undefined') {
  document.body.classList.toggle('is-mobile-device', isMobileDevice())
}

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
