<template>
  <div class="settings-card glx-panel-card">
    <div class="card-title-section glx-panel-head">
      <Icon :name="iconName" :size="32" />
      <span class="card-title glx-panel-title">{{ title }}</span>
      <GlxSwitch
        v-if="showToggle"
        class="glx-row-switch"
        :checked="section.show"
        @change="$emit('toggle')"
      />
    </div>

    <div v-if="section.show" class="setting-group">
      <div v-if="showFontSize" class="setting-item-row">
        <span class="setting-label">{{ fontSizeLabel }}</span>
        <div class="setting-control-buttons">
          <div
            class="control-btn"
            @click="$emit('adjust', 'fontSize', -1, minFontSize, maxFontSize)"
          >
            <span class="control-icon">-</span>
          </div>
          <span class="setting-value-large">{{ section.fontSize }}</span>
          <div
            class="control-btn"
            @click="$emit('adjust', 'fontSize', 1, minFontSize, maxFontSize)"
          >
            <span class="control-icon">+</span>
          </div>
        </div>
      </div>

      <div v-if="showSecondsControl" class="setting-item-row">
        <span class="setting-label">显示秒钟</span>
        <GlxSwitch
          class="glx-row-switch"
          :checked="showSeconds"
          @change="$emit('toggle-seconds')"
        />
      </div>

      <div class="setting-item-row">
        <span class="setting-label">{{ xLabel }}</span>
        <div class="setting-control-buttons">
          <div class="control-btn" @click="$emit('adjust', 'x', -1, 0, 64)">
            <span class="control-icon">-</span>
          </div>
          <span class="setting-value-large">{{ section.x }}</span>
          <div class="control-btn" @click="$emit('adjust', 'x', 1, 0, 64)">
            <span class="control-icon">+</span>
          </div>
        </div>
      </div>

      <div class="setting-item-row">
        <span class="setting-label">{{ yLabel }}</span>
        <div class="setting-control-buttons">
          <div class="control-btn" @click="$emit('adjust', 'y', -1, 0, 64)">
            <span class="control-icon">-</span>
          </div>
          <span class="setting-value-large">{{ section.y }}</span>
          <div class="control-btn" @click="$emit('adjust', 'y', 1, 0, 64)">
            <span class="control-icon">+</span>
          </div>
        </div>
      </div>

      <div v-if="showAlign" class="settings-block">
        <span class="setting-label">对齐方式</span>
        <div class="align-buttons">
          <div
            class="align-btn glx-feature-option"
            :class="{ active: section.align === 'left' }"
            @click="$emit('set-align', 'left')"
          >
            <span class="glx-feature-option__label">左对齐</span>
          </div>
          <div
            class="align-btn glx-feature-option"
            :class="{ active: section.align === 'center' }"
            @click="$emit('set-align', 'center')"
          >
            <span class="glx-feature-option__label">居中</span>
          </div>
          <div
            class="align-btn glx-feature-option"
            :class="{ active: section.align === 'right' }"
            @click="$emit('set-align', 'right')"
          >
            <span class="glx-feature-option__label">右对齐</span>
          </div>
        </div>
      </div>

      <div class="settings-block">
        <span class="setting-label">颜色</span>
        <ColorPanelPicker
          :value="section.color"
          :label="`${title}颜色`"
          :preset-colors="presetColors"
          @input="$emit('update-color', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Icon from "@/components/uni/Icon.vue";
import ColorPanelPicker from "@/components/uni/ColorPanelPicker.vue";
import GlxSwitch from "@/components/uni/GlxSwitch.vue";

export default {
  components: {
    Icon,
    ColorPanelPicker,
    GlxSwitch,
  },
  props: {
    iconName: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    section: {
      type: Object,
      required: true,
    },
    presetColors: {
      type: Array,
      required: true,
    },
    showFontSize: {
      type: Boolean,
      default: true,
    },
    minFontSize: {
      type: Number,
      default: 1,
    },
    maxFontSize: {
      type: Number,
      default: 3,
    },
    showAlign: {
      type: Boolean,
      default: true,
    },
    fontSizeLabel: {
      type: String,
      default: "字体大小",
    },
    xLabel: {
      type: String,
      default: "X 位置",
    },
    yLabel: {
      type: String,
      default: "Y 位置",
    },
    showToggle: {
      type: Boolean,
      default: true,
    },
    showSecondsControl: {
      type: Boolean,
      default: false,
    },
    showSeconds: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["toggle", "adjust", "update-color", "set-align", "toggle-seconds"],
};
</script>

<style scoped>
.settings-card {
  background-color: transparent;
  border: 0;
  padding: 8rpx 12rpx 14rpx;
  margin-bottom: 16rpx;
  box-shadow: none;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.settings-block {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 0 2rpx;
}

.setting-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 0 2rpx;
}

.setting-label {
  font-size: 20rpx;
  color: var(--text-secondary);
}

.setting-control-buttons {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.control-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-secondary);
  border: 2rpx solid var(--nb-ink);
  border-radius: 0;
  transition: var(--transition-base);
}

.control-icon {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-primary);
}

.setting-value-large {
  font-size: 32rpx;
  font-family: monospace;
  font-weight: bold;
  color: var(--nb-yellow);
  min-width: 64rpx;
  text-align: center;
}

.align-buttons {
  display: flex;
  gap: 12rpx;
  margin-top: 12rpx;
}

.align-btn {
  flex: 1;
  padding: 20rpx 16rpx;
  text-align: center;
  transition: var(--transition-base);
}
</style>
