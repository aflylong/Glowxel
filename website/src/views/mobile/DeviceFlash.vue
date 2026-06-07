<template>
  <div
    class="device-flash-page glx-device-shell glx-device-shell--desktop-stack"
  >
    <div
      class="status-bar glx-device-shell__status-bar"
      :style="{ height: statusBarHeight + 'px' }"
    ></div>

    <div class="navbar glx-topbar glx-device-shell__topbar">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">设备烧录</span>
      <div class="nav-right"></div>
    </div>

    <div
      data-scroll-view
      scroll-y
      class="content glx-device-shell__content glx-scroll-region"
    >
      <div class="device-flash-layout glx-device-shell__section">
        <div class="device-flash-column">
          <section class="section-block">
            <div class="section-header glx-section-head">
              <span class="section-title glx-section-title">开始烧录</span>
              <span class="section-meta">USB Web Serial</span>
            </div>

            <div class="panel-card flash-panel">
              <div class="install-shell">
                <esp-web-install-button :manifest="manifestPath">
                  <button
                    slot="activate"
                    type="button"
                    class="flash-primary-btn"
                  >
                    连接 USB 并开始烧录
                  </button>
                  <div slot="unsupported" class="tip-card tip-card--soft">
                    当前浏览器不支持 Web Serial，请使用 Chrome 或 Edge 桌面版。
                  </div>
                  <div slot="not-allowed" class="tip-card tip-card--soft">
                    当前页面不是安全上下文，请使用 HTTPS 或 localhost。
                  </div>
                </esp-web-install-button>
              </div>

              <div class="tip-card tip-card--soft">
                如果没有弹出串口选择窗口，先检查 USB
                数据线、串口驱动和页面安全环境。
              </div>
            </div>
          </section>

          <section class="section-block">
            <div class="section-header glx-section-head">
              <span class="section-title glx-section-title">烧录前确认</span>
              <span class="section-meta">减少失败率</span>
            </div>

            <div class="panel-card checklist-panel">
              <div class="check-card">
                使用可以传输数据的 USB 线，不要使用只能充电的线。
              </div>
              <div class="check-card">
                确认系统已经安装 CH340 / CP2102 等对应串口驱动。
              </div>
              <div class="check-card">
                关闭串口监视器、PlatformIO 上传窗口等会占用端口的程序。
              </div>
              <div class="check-card">
                如果连接失败，可以按住 BOOT 后再点击连接，开始写入后松开。
              </div>
            </div>
          </section>
        </div>

        <div class="device-flash-column">
          <section class="section-block">
            <div class="section-header glx-section-head">
              <span class="section-title glx-section-title">环境要求</span>
              <span class="section-meta">浏览器与系统</span>
            </div>

            <div class="panel-card notes-panel">
              <div class="note-card">
                <span class="note-label">桌面浏览器</span>
                <span class="note-desc">
                  PC 端推荐使用最新版 Chrome 或 Edge，体验更稳定。
                </span>
              </div>
              <div class="note-card">
                <span class="note-label">页面安全</span>
                <span class="note-desc">
                  必须在 HTTPS 或 localhost 环境下，浏览器才会开放串口接口。
                </span>
              </div>
              <div class="note-card">
                <span class="note-label">连接关系</span>
                <span class="note-desc">
                  烧录时不依赖设备先联网，也不需要先连接设备控制页面。
                </span>
              </div>
            </div>
          </section>

          <section class="section-block">
            <div class="section-header glx-section-head">
              <span class="section-title glx-section-title">完成后</span>
              <span class="section-meta">重新连接设备</span>
            </div>

            <div class="panel-card finish-panel">
              <div class="tip-card">
                烧录完成后设备会重启。等屏幕恢复显示或设备重新联网后，再回到设备控制页面重新连接设备。
              </div>

              <div class="action-grid">
                <button
                  type="button"
                  class="flash-primary-btn"
                  @click="goDeviceControl"
                >
                  回到设备控制
                </button>
                <button
                  type="button"
                  class="flash-secondary-btn"
                  @click="goBleConfig"
                >
                  需要时重新配网
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="glx-device-shell__spacer"></div>
    </div>
  </div>
</template>

<script>
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import statusBarMixin from "@/mixins/statusBar.js";
import Icon from "@/components/uni/Icon.vue";

const manifestPath = "/firmware/esp32/manifest.json";
const espWebToolsScript =
  "https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module";

export default {
  mixins: [uniLifecycleAdapter, statusBarMixin],
  components: {
    Icon,
  },
  data() {
    return {
      manifestPath,
    };
  },
  mounted() {
    this.ensureEspWebTools();
  },
  methods: {
    ensureEspWebTools() {
      if (
        typeof window === "undefined" ||
        customElements.get("esp-web-install-button")
      ) {
        return;
      }

      const script = document.createElement("script");
      script.type = "module";
      script.src = espWebToolsScript;
      document.head.appendChild(script);
    },
    handleBack() {
      uni.navigateBack();
    },
    goDeviceControl() {
      uni.navigateTo({ url: "/device-control" });
    },
    goBleConfig() {
      uni.navigateTo({ url: "/ble-config" });
    },
  },
};
</script>

<style scoped>
.device-flash-page {
  min-height: 100vh;
  background: var(--nb-paper);
}

.navbar {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32rpx;
  background: var(--nb-surface);
  border-bottom: 2rpx solid var(--nb-ink);
  position: relative;
}

.nav-left,
.nav-right {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 80rpx;
  min-width: 80rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-left {
  left: 32rpx;
  justify-content: flex-start;
}

.nav-right {
  right: 32rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--nb-ink);
}

.content {
  padding: 16rpx 20rpx 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.hero-card {
  margin-bottom: 24rpx;
  padding: 24rpx;
  border: 2rpx solid var(--nb-ink);
  background: linear-gradient(135deg, #fff6d1 0%, #ffffff 58%, #e9f4ff 100%);
  display: grid;
  gap: 20rpx;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.hero-tag {
  width: fit-content;
  padding: 6rpx 14rpx;
  border: 2rpx solid var(--nb-ink);
  background: var(--nb-yellow);
  font-size: 20rpx;
  font-weight: 900;
  color: var(--nb-ink);
}

.hero-title {
  margin: 0;
  font-size: 40rpx;
  line-height: 1.1;
  font-weight: 900;
  color: var(--nb-ink);
}

.hero-desc {
  margin: 0;
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--text-tertiary);
}

.hero-metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.hero-metric-card {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 18rpx;
  border: 2rpx solid var(--nb-ink);
  background: rgba(255, 255, 255, 0.92);
}

.hero-metric-label {
  font-size: 20rpx;
  line-height: 1.4;
  color: var(--text-tertiary);
}

.hero-metric-value {
  font-size: 26rpx;
  line-height: 1.3;
  font-weight: 900;
  color: var(--nb-ink);
}

.device-flash-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24rpx;
}

.device-flash-column {
  display: grid;
  gap: 24rpx;
  align-content: start;
}

.section-block {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 4rpx 4rpx 14rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 900;
  color: var(--nb-ink);
}

.section-meta {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.panel-card {
  display: grid;
  gap: 18rpx;
  padding: 24rpx;
  border: 2rpx solid var(--nb-ink);
  background: var(--nb-surface);
}

.install-shell {
  min-height: 148rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--nb-ink);
  background: #fffdf7;
}

.flash-primary-btn,
.flash-secondary-btn {
  min-height: 76rpx;
  padding: 0 24rpx;
  border: 2rpx solid var(--nb-ink);
  font-size: 26rpx;
  font-weight: 900;
  color: var(--nb-ink);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.flash-primary-btn {
  background: var(--nb-yellow);
  box-shadow: var(--nb-shadow-soft);
}

.flash-secondary-btn {
  background: var(--nb-surface);
}

.tip-card,
.check-card,
.note-card {
  padding: 18rpx;
  border: 2rpx solid var(--nb-ink);
  background: var(--nb-surface);
  color: var(--nb-ink);
  font-size: 24rpx;
  line-height: 1.65;
}

.tip-card--soft {
  background: #fff6d1;
}

.checklist-panel,
.notes-panel {
  gap: 14rpx;
}

.note-card {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.note-label {
  font-size: 24rpx;
  line-height: 1.3;
  font-weight: 900;
  color: var(--nb-ink);
}

.note-desc {
  font-size: 22rpx;
  line-height: 1.65;
  color: var(--text-tertiary);
}

.finish-panel {
  gap: 16rpx;
}

.action-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16rpx;
}

esp-web-install-button {
  --esp-tools-button-color: var(--nb-yellow);
  --esp-tools-button-text-color: var(--nb-ink);
}

@media (max-width: 420px) {
  .hero-metric-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (min-width: 769px) {
  .device-flash-page {
    width: min(1180px, calc(100vw - 48px));
    height: calc(100vh - 32px);
    min-height: 720px;
    margin: 16px auto;
    border: 3px solid var(--nb-ink);
    box-shadow: var(--glx-shadow-card);
    overflow: hidden;
    background: var(--nb-paper);
  }

  .device-flash-page > .status-bar {
    display: none;
  }

  .device-flash-page > .navbar {
    min-height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    position: relative !important;
    border-bottom: 3px solid var(--nb-ink);
  }

  .device-flash-page > .navbar .nav-left,
  .device-flash-page > .navbar .nav-right {
    top: 50%;
    width: 64px;
    min-width: 64px;
    height: 64px;
    transform: translateY(-50%);
  }

  .device-flash-page > .navbar .nav-left {
    left: 24px;
    justify-content: center;
    border: 3px solid var(--nb-ink);
    background: var(--nb-surface);
    box-shadow: var(--glx-shadow-soft);
  }

  .device-flash-page > .navbar .nav-right {
    right: 24px;
  }

  .device-flash-page > .navbar .nav-title {
    font-size: 30px;
    font-weight: 900;
  }

  .device-flash-page > .content {
    flex: 1;
    min-height: 0;
    padding: 20px 20px 24px !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }

  .hero-card {
    margin-bottom: 20px;
    padding: 22px;
    gap: 18px;
  }

  .hero-title {
    font-size: 32px;
  }

  .hero-desc {
    max-width: 760px;
    font-size: 13px;
  }

  .hero-metric-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }

  .hero-metric-card {
    min-height: 96px;
    padding: 14px;
  }

  .hero-metric-label {
    font-size: 12px;
  }

  .hero-metric-value {
    font-size: 18px;
  }

  .device-flash-layout {
    grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
    gap: 20px;
  }

  .device-flash-column {
    gap: 20px;
  }

  .section-header {
    padding: 0 2px 12px;
  }

  .section-title {
    font-size: 18px;
  }

  .section-meta {
    font-size: 12px;
  }

  .panel-card {
    padding: 20px;
    gap: 16px;
  }

  .install-shell {
    min-height: 138px;
    padding: 18px;
  }

  .flash-primary-btn,
  .flash-secondary-btn {
    min-height: 52px;
    padding: 0 18px;
    font-size: 15px;
  }

  .tip-card,
  .check-card,
  .note-card {
    padding: 14px;
    font-size: 14px;
  }

  .note-label {
    font-size: 15px;
  }

  .note-desc {
    font-size: 13px;
  }

  .action-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .device-flash-page {
    width: min(960px, calc(100vw - 32px));
  }

  .hero-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .device-flash-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
