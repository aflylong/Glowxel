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
      <span class="nav-title glx-topbar__title">璁惧鐑у綍</span>
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
              <span class="section-title glx-section-title">寮€濮嬬儳褰?</span>
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
                    杩炴帴 USB 骞跺紑濮嬬儳褰?                  </button>
                  <div slot="unsupported" class="tip-card tip-card--soft">
                    褰撳墠娴忚鍣ㄤ笉鏀寔 Web Serial锛岃浣跨敤 Chrome 鎴?Edge 妗岄潰鐗堛€?                  </div>
                  <div slot="not-allowed" class="tip-card tip-card--soft">
                    褰撳墠椤甸潰涓嶆槸瀹夊叏涓婁笅鏂囷紝璇蜂娇鐢?HTTPS 鎴?localhost銆?                  </div>
                </esp-web-install-button>
              </div>

              <div class="tip-card tip-card--soft">
                濡傛灉娌℃湁寮瑰嚭涓插彛閫夋嫨绐楀彛锛屽厛妫€鏌?USB
                鏁版嵁绾裤€佷覆鍙ｉ┍鍔ㄥ拰椤甸潰瀹夊叏鐜銆?              </div>
            </div>
          </section>

          <section class="section-block">
            <div class="section-header glx-section-head">
              <span class="section-title glx-section-title">鐑у綍鍓嶇‘璁?</span>
              <span class="section-meta">鍑忓皯澶辫触鐜?</span>
            </div>

            <div class="panel-card checklist-panel">
              <div class="check-card">
                浣跨敤鍙互浼犺緭鏁版嵁鐨?USB 绾匡紝涓嶈浣跨敤鍙兘鍏呯數鐨勭嚎銆?              </div>
              <div class="check-card">
                纭绯荤粺宸茬粡瀹夎 CH340 / CP2102 绛夊搴斾覆鍙ｉ┍鍔ㄣ€?              </div>
              <div class="check-card">
                鍏抽棴涓插彛鐩戣鍣ㄣ€丳latformIO 涓婁紶绐楀彛绛変細鍗犵敤绔彛鐨勭▼搴忋€?              </div>
              <div class="check-card">
                濡傛灉杩炴帴澶辫触锛屽彲浠ユ寜浣?BOOT 鍚庡啀鐐瑰嚮杩炴帴锛屽紑濮嬪啓鍏ュ悗鏉惧紑銆?              </div>
            </div>
          </section>
        </div>

        <div class="device-flash-column">
          <section class="section-block">
            <div class="section-header glx-section-head">
              <span class="section-title glx-section-title">鐜瑕佹眰</span>
              <span class="section-meta">娴忚鍣ㄤ笌绯荤粺</span>
            </div>

            <div class="panel-card notes-panel">
              <div class="note-card">
                <span class="note-label">妗岄潰娴忚鍣?</span>
                <span class="note-desc">
                  PC 绔帹鑽愪娇鐢ㄦ渶鏂扮増 Chrome 鎴?Edge锛屼綋楠屾洿绋冲畾銆?                </span>
              </div>
              <div class="note-card">
                <span class="note-label">椤甸潰瀹夊叏</span>
                <span class="note-desc">
                  蹇呴』鍦?HTTPS 鎴?localhost 鐜涓嬶紝娴忚鍣ㄦ墠浼氬紑鏀句覆鍙ｆ帴鍙ｃ€?                </span>
              </div>
              <div class="note-card">
                <span class="note-label">杩炴帴鍏崇郴</span>
                <span class="note-desc">
                  鐑у綍鏃朵笉渚濊禆璁惧鍏堣仈缃戯紝涔熶笉闇€瑕佸厛杩炴帴璁惧鎺у埗椤甸潰銆?                </span>
              </div>
            </div>
          </section>

          <section class="section-block">
            <div class="section-header glx-section-head">
              <span class="section-title glx-section-title">瀹屾垚鍚?</span>
              <span class="section-meta">閲嶆柊杩炴帴璁惧</span>
            </div>

            <div class="panel-card finish-panel">
              <div class="tip-card">
                鐑у綍瀹屾垚鍚庤澶囦細閲嶅惎銆傜瓑灞忓箷鎭㈠鏄剧ず鎴栬澶囬噸鏂拌仈缃戝悗锛屽啀鍥炲埌璁惧鎺у埗椤甸潰閲嶆柊杩炴帴璁惧銆?              </div>

              <div class="action-grid">
                <button
                  type="button"
                  class="flash-primary-btn"
                  @click="goDeviceControl"
                >
                  鍥炲埌璁惧鎺у埗
                </button>
                <button
                  type="button"
                  class="flash-secondary-btn"
                  @click="goBleConfig"
                >
                  闇€瑕佹椂閲嶆柊閰嶇綉
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
import { navigateTo, navigateBack } from '@/utils/browser-platform.js'
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
      navigateBack();
    },
    goDeviceControl() {
      navigateTo({ url: "/device-control" });
    },
    goBleConfig() {
      navigateTo({ url: "/ble-config" });
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
