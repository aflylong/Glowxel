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
import './assets/styles/mobile-neubrutalism.css'

// 把 router 实例注入 uni-shim, 让 uni.navigateTo 等映射到 vue-router
uni._setRouter(router)

// 移动设备标记 — 配合 mobile-shell.css 切手机壳样式
if (typeof document !== 'undefined') {
  document.body.classList.toggle('is-mobile-device', isMobileDevice())
}

const app = createApp(App)

// uniapp 页面钩子合并策略: 同名 onLoad/onShow/onHide/onUnload/onReady 全部保留 (数组)
// 默认 vue mixin 行为是 child 覆盖 parent, 这导致 statusBar mixin 的 onLoad 被页面自己的 onLoad 吃掉.
// uniapp 内部就是用 mergeHook 把它们合成数组依次调用.
const UNI_HOOKS = ['onLoad', 'onShow', 'onReady', 'onHide', 'onUnload', 'onPullDownRefresh', 'onReachBottom']
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
for (const name of UNI_HOOKS) {
  app.config.optionMergeStrategies[name] = mergeHook
}

app.use(createPinia())
app.use(router)
app.mount('#app')
