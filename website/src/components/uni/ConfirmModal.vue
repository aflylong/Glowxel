<template>
  <div v-if="visible" class="modal-overlay" @tap="handleMaskTap">
    <div class="modal-content" @tap.stop>
      <div class="modal-header">
        <span class="modal-title">{{ title }}</span>
      </div>
      
      <div class="modal-body">
        <span class="modal-text">{{ content }}</span>
      </div>
      
      <div class="modal-footer" :class="{ 'modal-footer--single': !showCancel }">
        <div v-if="showCancel" class="modal-btn cancel-btn" @tap="handleCancel">
          <span class="btn-text">{{ cancelText }}</span>
        </div>
        <div class="modal-btn confirm-btn" :class="{ 'danger': danger }" @tap="handleConfirm">
          <span class="btn-text">{{ confirmText }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '提示'
    },
    content: {
      type: String,
      default: ''
    },
    confirmText: {
      type: String,
      default: '确定'
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    showCancel: {
      type: Boolean,
      default: true
    },
    maskClosable: {
      type: Boolean,
      default: true
    },
    danger: {
      type: Boolean,
      default: false
    }
  },
  
  methods: {
    handleMaskTap() {
      if (!this.maskClosable) {
        return
      }

      this.handleCancel()
    },

    handleConfirm() {
      this.$emit('confirm')
      this.$emit('update:visible', false)
    },
    
    handleCancel() {
      this.$emit('cancel')
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.modal-content {
  width: 100%;
  max-width: 620rpx;
  max-height: calc(100vh - 120rpx);
  background-color: var(--nb-surface);
  border-radius: 0;
  border: var(--nb-border-width-panel) solid var(--nb-ink);
  box-shadow: var(--nb-shadow-strong);
  overflow: hidden;
  animation: scaleIn 0.18s ease-out;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
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
  padding: 24rpx 24rpx 20rpx;
  border-bottom: var(--nb-border-width-panel) solid var(--nb-ink);
}

.modal-title {
  font-size: 32rpx;
  font-weight: 900;
  color: var(--nb-ink);
  text-align: center;
  display: block;
}

.modal-body {
  padding: 24rpx;
  flex: 1;
  overflow-y: auto;
}

.modal-text {
  font-size: 26rpx;
  color: #4a4a4a;
  line-height: 1.6;
  text-align: center;
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
}

.modal-footer {
  display: flex;
  gap: 12rpx;
  padding: 18rpx 24rpx 24rpx;
  border-top: var(--nb-border-width-panel) solid var(--nb-ink);
}

.modal-footer--single {
  gap: 0;
}

.modal-btn {
  flex: 1;
  min-height: 84rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--nb-surface);
  box-sizing: border-box;
  border: var(--nb-border-width-control) solid var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
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

.confirm-btn.danger {
  background: var(--nb-coral);
}

.confirm-btn.danger .btn-text {
  color: #ffffff;
}
</style>
