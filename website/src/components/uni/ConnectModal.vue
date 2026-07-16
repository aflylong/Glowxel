<template>
  <div v-if="visible" class="modal-overlay" @click="handleCancel">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <span class="modal-title">{{ title }}</span>
        <div class="close-btn" @click="handleCancel">
          <Icon name="close" :size="32" />
        </div>
      </div>

      <div class="modal-body">
        <span class="modal-desc">{{ description }}</span>

        <div class="input-wrapper">
          <input
            v-model="inputValue"
            type="text"
            class="custom-input"
            :placeholder="placeholder"
            placeholder-class="input-placeholder"
            :adjust-position="false"
            @confirm="handleConfirm"
          />
        </div>

        <!-- 杩炴帴鐘舵€?-->
        <div v-if="connecting" class="status-box connecting">
          <GlxInlineLoader
            class="status-loader"
            variant="chase"
            size="sm"
          />
          <div class="status-copy">
            <span class="status-text">姝ｅ湪杩炴帴璁惧</span>
            <span class="status-tip">璇风◢鍊欙紝杩炴帴鎴愬姛鍚庝細鑷姩鍏抽棴寮圭獥</span>
          </div>
        </div>

        <div v-if="error" class="status-box error">
          <Icon name="close" :size="32" />
          <span class="status-text">{{ error }}</span>
        </div>
      </div>

      <div class="modal-footer">
        <div class="modal-btn cancel-btn" @click="handleCancel">
          <span class="btn-text">鍙栨秷</span>
        </div>
        <div
          class="modal-btn confirm-btn"
          :class="{ disabled: !inputValue || connecting }"
          @click="handleConfirm"
        >
          <span class="btn-text"">{{ connecting ? "杩炴帴涓?" : "杩炴帴""" }}</span">"
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Icon from "./Icon.vue";
import GlxInlineLoader from "./GlxInlineLoader.vue";
export default {
  components: {
    Icon,
    GlxInlineLoader,
  },

  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: "杩炴帴璁惧",
    },
    description: {
      type: String,
      default: "璇疯緭鍏?Glowxel PixelBoard 鐨?IP 鍦板潃",
    },
    placeholder: {
      type: String,
      default: "192.168.31.84",
    },
    defaultValue: {
      type: String,
      default: "",
    },
  },

  data() {
    return {
      inputValue: "",
      connecting: false,
      error: "",
      timeoutTimer: null,
    };
  },

  watch: {
    visible(val) {
      if (val) {
        this.inputValue = this.defaultValue;
        this.connecting = false;
        this.error = "";
        if (this.timeoutTimer) {
          clearTimeout(this.timeoutTimer);
          this.timeoutTimer = null;
        }
      }
    },

    inputValue() {
      // 娓呴櫎閿欒鎻愮ず
      if (this.error) {
        this.error = "";
      }
    },
  },

  methods: {
    handleConfirm() {
      if (!this.inputValue || this.connecting) return;

      this.connecting = true;
      this.error = "";

      // 棣栬繛鐜板湪浼氱粡杩囪繍琛屾€侀妫€ + 鏈€澶氫袱娆℃彙鎵嬪皾璇曪紝UI 瓒呮椂闇€瑕佽鐩栨暣鏉￠摼璺?      this.timeoutTimer = setTimeout(() => {
        if (this.connecting) {
          this.connecting = false;
          this.error = "杩炴帴瓒呮椂锛岃閲嶈瘯";
          this.$emit("timeout");
        }
      }, 40000);

      this.$emit("confirm", this.inputValue);
    },

    handleCancel() {
      if (this.connecting) return;

      if (this.timeoutTimer) {
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = null;
      }

      this.$emit("cancel");
      this.$emit("update:visible", false);

      // 鐩存帴鍏抽棴寮圭獥
      this.$parent.showConnectModal = false;
    },

    // 澶栭儴璋冪敤锛氳繛鎺ユ垚鍔?    onSuccess() {
      this.connecting = false;
      this.error = "";
      if (this.timeoutTimer) {
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = null;
      }
      this.$emit("update:visible", false);

      // 鐩存帴鍏抽棴寮圭獥
      if (this.$parent && this.$parent.showConnectModal !== undefined) {
        this.$parent.showConnectModal = false;
      }
    },

    // 澶栭儴璋冪敤锛氳繛鎺ュけ璐?    onError(message) {
      this.connecting = false;
      this.error = message || "杩炴帴澶辫触锛岃妫€鏌?IP 鍦板潃";
      if (this.timeoutTimer) {
        clearTimeout(this.timeoutTimer);
        this.timeoutTimer = null;
      }
    },
  },
};
</script>

<style scoped>
.modal-content {
  width: 100%;
  max-width: 620rpx;
  background-color: var(--nb-surface);
  border-radius: 0;
  border: var(--nb-border-width-panel) solid var(--nb-ink);
  box-shadow: var(--nb-shadow-strong);
  overflow: hidden;
  animation: scaleIn 0.18s ease-out;
  box-sizing: border-box;
}

@keyframes scaleIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  padding: 24rpx 24rpx 22rpx;
  border-bottom: var(--nb-border-width-panel) solid var(--nb-ink);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 900;
  color: var(--nb-ink);
}

.close-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--nb-border-width-control) solid var(--nb-ink);
  background: var(--nb-surface);
  box-shadow: var(--nb-shadow-soft);
  border-radius: 0;
  box-sizing: border-box;
}


.modal-body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.modal-desc {
  font-size: 24rpx;
  color: #4a4a4a;
  line-height: 1.6;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
}

.custom-input {
  width: 100%;
  padding: 0 20rpx;
  background-color: #ffffff;
  border: var(--nb-border-width-control) solid var(--nb-ink);
  border-radius: 0;
  font-size: 30rpx;
  color: var(--nb-ink);
  font-family: monospace;
  transition: var(--transition-base);
  box-sizing: border-box;
  line-height: 1.2;
  height: 84rpx;
}

.custom-input:focus {
  border-color: var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
}

.input-placeholder {
  color: var(--text-tertiary);
}

.status-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 18rpx;
  border-radius: 0;
  border: var(--nb-border-width-control) solid var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-box.connecting {
  align-items: flex-start;
  background-color: #e7f0ff;
}

.status-loader {
  flex-shrink: 0;
  margin-top: 2rpx;
}

.status-box.error {
  background-color: #f8dede;
}

.status-copy {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.status-text {
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1.4;
}

.status-tip {
  font-size: 22rpx;
  line-height: 1.5;
  color: #4a4a4a;
}

.status-box.connecting .status-text {
  color: var(--nb-ink);
}

.status-box.connecting .status-tip {
  color: #4a4a4a;
}

.status-box.error .status-text {
  color: #ff6464;
}

.modal-footer {
  display: flex;
  gap: 12rpx;
  padding: 18rpx 24rpx 24rpx;
  border-top: 3rpx solid var(--nb-ink);
}

.modal-btn {
  flex: 1;
  min-height: 84rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border: var(--nb-border-width-control) solid var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
}


.modal-btn.disabled {
  opacity: 0.5;
}

.cancel-btn {
  background: #ffffff;
}

.btn-text {
  font-size: 28rpx;
  font-weight: 900;
}

.cancel-btn .btn-text {
  color: var(--nb-ink);
}

.confirm-btn {
  background: #f2cf4a;
}

.confirm-btn .btn-text {
  color: var(--nb-ink);
}
</style>
