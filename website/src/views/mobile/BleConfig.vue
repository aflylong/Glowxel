<!-- AUTO-CONVERTED FROM uniapp/pages/ble-config/ble-config.vue -->
<template>
  <div
    class="wifi-config-page glx-device-shell glx-device-shell--desktop-stack glx-page-shell"
  >
    

    <div class="navbar glx-topbar glx-device-shell__topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">鐑偣閰嶇綉</span>
    </div>

    <div data-scroll-view
      scroll-y
      class="content glx-device-shell__content glx-scroll-region"
    >
      <div class="steps-card glx-panel-card glx-device-shell__section">
        <div class="step-card">
          <div class="step-badge">1</div>
          <div class="step-body">
            <span class="step-title">杩炴帴璁惧鐑偣</span>
            <span class="step-desc">
              鍦ㄧ郴缁?WiFi 鍒楄〃閲岄€夋嫨
              <span class="inline-strong">Glowxel PixelBoard-璁惧搴忓垪鍙?</span>銆?            </span>
          </div>
        </div>

        <div class="step-card">
          <div class="step-badge">2</div>
          <div class="step-body">
            <span class="step-title">鎵撳紑 192.168.4.1</span>
            <span class="step-desc">杩涘叆閰嶇綉椤靛悗鍙换閫変竴绉嶏細</span>
            <div class="step-options">
              <span class="step-option">鎵弿鍚庣洿鎺ラ€夋嫨 WiFi</span>
              <span class="step-option">鎵嬪姩杈撳叆 WiFi 鍚嶇О</span>
            </div>
          </div>
        </div>

        <div class="step-card">
          <div class="step-badge">3</div>
          <div class="step-body">
            <span class="step-title">杈撳叆瀵嗙爜骞朵繚瀛?</span>
            <span class="step-desc">鍙敮鎸?2.4GHz锛屼繚瀛樺悗璁惧浼氳嚜鍔ㄩ噸鍚€?</span>
            <span class="step-result">
              鎴愬姛鍚庣湅灞忓箷涓婄殑鏂?IP锛涘け璐ヤ細鍥炲埌鐑偣妯″紡銆?            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { navigateBack } from '@/utils/browser-platform.js'
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import statusBarMixin from "@/mixins/statusBar.js";
import Icon from "@/components/uni/Icon.vue";

export default {
  mixins: [uniLifecycleAdapter, statusBarMixin],
  components: { Icon },
  methods: {
    handleBack() {
      navigateBack();
    },
  },
};
</script>

<style scoped>
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

.nav-left {
  position: absolute;
  left: 32rpx;
  width: 80rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--nb-ink);
}

.content {
  padding: 32rpx 30rpx 44rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.steps-card {
  background: var(--nb-surface);
  padding: 0;
}

.step-card {
  display: flex;
  gap: 18rpx;
  align-items: flex-start;
  padding: 20rpx 24rpx;
  border-bottom: 2rpx solid rgba(0, 0, 0, 0.12);
}

.step-card:last-child {
  border-bottom: 0;
}

.step-badge {
  width: 52rpx;
  height: 52rpx;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--nb-ink);
  background: #74b9ff;
  color: var(--nb-ink);
  font-size: 28rpx;
  font-weight: 700;
}

.step-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding-top: 2rpx;
}

.step-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--nb-ink);
}

.step-desc {
  font-size: 22rpx;
  line-height: 1.5;
  color: #444444;
}

.step-options {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.step-option {
  display: flex;
  align-items: center;
  min-height: 52rpx;
  padding: 0 16rpx;
  border: 2rpx solid var(--nb-ink);
  background: #ffffff;
  font-size: 21rpx;
  font-weight: 600;
  color: var(--nb-ink);
}

.step-result {
  font-size: 22rpx;
  line-height: 1.5;
  color: #444444;
}

.inline-strong {
  font-weight: 700;
  color: var(--nb-ink);
}

@media (min-width: 769px) {
  .wifi-config-page .content {
    padding: 0;
  }

  .wifi-config-page .steps-card {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .wifi-config-page .step-card {
    min-height: 100%;
    padding: 20px;
    border-bottom: 0;
    border-right: 2px solid rgba(0, 0, 0, 0.12);
  }

  .wifi-config-page .step-card:last-child {
    border-right: 0;
  }
}

@media (min-width: 769px) and (max-width: 980px) {
  .wifi-config-page .steps-card {
    grid-template-columns: 1fr;
  }

  .wifi-config-page .step-card {
    border-right: 0;
    border-bottom: 2px solid rgba(0, 0, 0, 0.12);
  }

  .wifi-config-page .step-card:last-child {
    border-bottom: 0;
  }
}
</style>
