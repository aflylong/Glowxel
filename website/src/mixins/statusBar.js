import { getSystemInfo } from '@/utils/browser-platform.js'
// Status bar mixin for handling status bar height across different platforms
export default {
  data() {
    return {
      statusBarHeight: 0
    }
  },

  onLoad() {
    this.initStatusBar()
  },

  onShow() {
    // tabBar 页面切换时不触发 onLoad，需�?onShow 里补充初始化
    if (!this.statusBarHeight) {
      this.initStatusBar()
    }
  },

  methods: {
    initStatusBar() {
      const systemInfo = getSystemInfo()
      this.statusBarHeight = systemInfo.statusBarHeight || 0
    }
  }
}
