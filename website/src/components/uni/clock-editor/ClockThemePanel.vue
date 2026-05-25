<template>
  <div class="settings-card">
    <div class="card-title-section">
      <Icon name="picture" :size="32" />
      <span class="card-title">主题库</span>
      <span class="card-count">{{ presets.length }} 个主题</span>
    </div>

    <div class="theme-sections">
      <div class="theme-grid">
        <div
          v-for="preset in presets"
          :key="preset.id"
          class="theme-card glx-feature-card-option"
          :class="{ active: selectedThemeId === preset.id }"
          @click="$emit('apply-theme', preset.id)"
        >
          <div class="theme-preview-shell">
            <img
              :src="preset.previewImage"
              class="theme-preview-image"
              mode="aspectFit"
            />
          </div>
          <div class="theme-meta">
            <span class="theme-name">{{ preset.name }}</span>
          </div>
          <div v-if="currentThemeId === preset.id" class="theme-badge">
            <div class="theme-badge-text">当前</div>
          </div>
          <div
            v-if="preset.requiresImage"
            class="theme-image-badge"
            :class="{ warn: selectedThemeId === preset.id && !hasImage }"
          >
            <div class="theme-image-badge-text">图片</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Icon from "@/components/uni/Icon.vue";

export default {
  components: {
    Icon,
  },
  props: {
    presets: {
      type: Array,
      required: true,
    },
    selectedThemeId: {
      type: String,
      default: "",
    },
    currentThemeId: {
      type: String,
      default: "",
    },
    activePreset: {
      type: Object,
      default: null,
    },
    hasImage: {
      type: Boolean,
      default: false,
    },
    isModified: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["apply-theme", "open-image-settings"],
};
</script>

<style scoped>
.settings-card {
  background-color: var(--bg-tertiary);
  border: 2rpx solid var(--nb-ink);
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: none;
}

.card-title-section {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.card-title {
  font-size: 22rpx;
  font-weight: 500;
  color: var(--text-primary);
}

.card-count {
  margin-left: auto;
  min-height: 40rpx;
  padding: 0 12rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  background: #ffffff;
  border: 2rpx solid #000000;
  font-size: 18rpx;
  font-weight: 700;
  color: #000000;
}

.theme-sections {
  margin-top: 18rpx;
}

.theme-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.theme-card {
  position: relative;
  width: calc((100% - 28rpx) / 3);
  overflow: hidden;
}

.theme-card.active {
  box-shadow: none;
}

.theme-preview-shell {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14rpx;
  box-sizing: border-box;
  background: #000000;
}

.theme-preview-image {
  width: 100%;
  height: 100%;
  display: block;
  background: #000000;
  image-rendering: pixelated;
}

.theme-meta {
  padding: 12rpx;
}

.theme-name {
  display: block;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1.35;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.theme-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38rpx;
  min-width: 58rpx;
  padding: 6rpx 12rpx;
  border-radius: 0;
  background: var(--nb-yellow);
  border: 2rpx solid #000000;
}

.theme-badge-text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: 600;
  line-height: 1;
  color: #000000;
}

.theme-image-badge {
  position: absolute;
  left: 12rpx;
  top: 12rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38rpx;
  min-width: 58rpx;
  padding: 6rpx 10rpx;
  border-radius: 0;
  background: #ffffff;
  border: 2rpx solid #000000;
}

.theme-image-badge.warn {
  background: var(--nb-yellow);
}

.theme-image-badge-text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18rpx;
  font-weight: 600;
  line-height: 1;
  color: #000000;
}
</style>
