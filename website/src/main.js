import { setRouter } from './utils/browser-platform.js'
import { isMobileDevice } from './utils/device-detect.js'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/styles/main.css'
import './assets/styles/glx-app.css'
import './assets/styles/device-mode-desktop.css'
import './assets/styles/editor.css'
import './assets/styles/mobile-shell.css'
import './assets/styles/mobile-neubrutalism.css'
import './assets/styles/device-page-responsive.css'

setRouter(router)

if (typeof document !== 'undefined') {
  document.body.classList.toggle('is-mobile-device', isMobileDevice())
}

const app = createApp(App)

const PAGE_HOOKS = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload', 'onPullDownRefresh', 'onReachBottom']
const mergeHook = (parent, child) => {
  if (!child) return parent
  if (!parent) return Array.isArray(child) ? child : [child]
  const arr = Array.isArray(parent) ? parent.slice() : [parent]
  if (Array.isArray(child)) {
    for (const c of child) if (!arr.includes(c)) arr.push(c)
  } else if (!arr.includes(child)) {
    arr.push(child)
  }
  return arr
}
for (const name of PAGE_HOOKS) {
  app.config.optionMergeStrategies[name] = mergeHook
}

app.use(createPinia())
app.use(router)
app.mount('#app')