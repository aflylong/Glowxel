<template>
  <div class="color-palette-container">
    <!-- 棰滆壊缃戞牸 -->
    <div class="color-grid-wrapper">
      <!-- 椤堕儴淇℃伅鏍?-->
      <div class="palette-header">
        <span class="palette-info">璋冭壊鏉?({{ colors.length }}鑹?</span>
        <span v-if="selectedColorInfo" class="selected-code">褰撳墠閫変腑:{{ selectedColorInfo.code }}</span>
      </div>
      
      <!-- 棰滆壊缃戞牸 -->
      <div data-scroll-view 
        scroll-y 
        class="color-grid-scroll"
        :scroll-into-view="scrollIntoView"
        @scroll="handleScroll"
      >
        <div 
          v-for="group in colorGroups" 
          :key="group.letter" 
          class="color-group"
        >
          <!-- 鍒嗙粍鏍囬 -->
          <div 
            :id="`letter-${group.letter}`"
            class="group-header"
          >
            <span class="group-letter">{{ group.letter }}</span>
            <span class="group-count">({{ group.colors.length }})</span>
          </div>
          
          <!-- 璇ュ瓧姣嶄笅鐨勯鑹?-->
          <div class="color-grid">
            <div
              v-for="color in group.colors"
              :key="color.code"
              class="color-item"
              :class="{ 'active': selectedColor === color.hex }"
              @click="handleColorClick(color.hex)"
            >
              <!-- 棰滆壊鍦嗗湀 -->
              <div 
                class="color-swatch" 
                :style="{ backgroundColor: color.hex }"
              ></div>
              
              <!-- 鑹插彿 -->
              <span class="color-code">{{ color.code }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 鍙充晶瀛楁瘝绱㈠紩鏉?-->
    <div 
      class="index-bar"
      @touchstart="handleIndexTouchStart"
      @touchmove="handleIndexTouchMove"
      @touchend="handleIndexTouchEnd"
    >
      <div class="index-letters">
        <div
          v-for="(letter, index) in availableLetters"
          :key="letter"
          :data-letter="letter"
          :data-index="index"
          class="index-letter"
          :class="{ 'active': currentVisibleLetter === letter }"
          @click="scrollToLetter(letter)"
        >
          <span class="letter-text">{{ letter }}</span>
        </div>
      </div>
    </div>
    
    <!-- 瀛楁瘝鎻愮ず姘旀场 -->
    <div 
      v-if="showLetterBubble && currentTouchLetter"
      class="letter-bubble"
      :style="{ 
        left: bubblePosition.x + 'px', 
        top: bubblePosition.y + 'px'
      }""
    >
      <span class="bubble-letter">{{ currentTouchLetter }}</span>
    </div>
  </div>
</template>

<script>
import { createDomQuery } from '@/utils/browser-platform.js'
export default {
  props: {
    colors: {
      type: Array,
      required: true
    },
    selectedColor: {
      type: String,
      default: ''
    }
  },
  
  data() {
    return {
      currentVisibleLetter: '',
      showLetterBubble: false,
      currentTouchLetter: '',
      bubblePosition: { x: 0, y: 0 },
      scrollIntoView: '',
      isIndexTouching: false
    }
  },
  
  computed: {
    // 鎸夎壊鍙烽瀛楁瘝鍒嗙粍骞舵帓搴?    colorGroups() {
      const groups = new Map()
      
      // 鎸夎壊鍙锋帓搴?      const sortedColors = [...this.colors].sort((a, b) => a.code.localeCompare(b.code))
      
      // 鎸夐瀛楁瘝鍒嗙粍
      sortedColors.forEach(color => {
        const letter = color.code.charAt(0).toUpperCase()
        if (!groups.has(letter)) {
          groups.set(letter, [])
        }
        groups.get(letter).push(color)
      })
      
      // 杞崲涓烘暟缁勫苟鎺掑簭
      return Array.from(groups.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([letter, colors]) => ({ letter, colors }))
    },
    
    // 鍙敤鐨勫瓧姣嶅垪琛?    availableLetters() {
      return this.colorGroups.map(g => g.letter)
    },
    
    // 褰撳墠閫変腑棰滆壊鐨勪俊鎭?    selectedColorInfo() {
      return this.colors.find(c => c.hex === this.selectedColor)
    }
  },
  
  methods: {
    // 婊氬姩鍒版寚瀹氬瓧姣?    scrollToLetter(letter) {
      this.scrollIntoView = `letter-${letter}`
      this.currentVisibleLetter = letter
    },
    
    // 澶勭悊婊氬姩浜嬩欢
    handleScroll(e) {
      // uni-app 涓粴鍔ㄤ簨浠跺鐞嗚緝绠€鍗曪紝杩欓噷绠€鍖栧鐞?      // 瀹為檯搴旂敤涓彲浠ユ牴鎹?scrollTop 璁＄畻褰撳墠鍙瀛楁瘝
    },
    
    // 瑙︽懜寮€濮?    handleIndexTouchStart(e) {
      this.isIndexTouching = true
      this.showLetterBubble = true
      
      const touch = e.touches[0]
      const letter = this.getLetterFromTouch(touch.pageY)
      
      if (letter) {
        this.currentTouchLetter = letter
        this.bubblePosition = { x: touch.pageX - 80, y: touch.pageY }
        this.scrollToLetter(letter)
      }
    },
    
    // 瑙︽懜绉诲姩
    handleIndexTouchMove(e) {
      if (!this.isIndexTouching) return
      
      const touch = e.touches[0]
      const letter = this.getLetterFromTouch(touch.pageY)
      
      if (letter && letter !== this.currentTouchLetter) {
        this.currentTouchLetter = letter
        this.bubblePosition = { x: touch.pageX - 80, y: touch.pageY }
        this.scrollToLetter(letter)
      } else if (letter) {
        this.bubblePosition = { x: touch.pageX - 80, y: touch.pageY }
      }
    },
    
    // 瑙︽懜缁撴潫
    handleIndexTouchEnd() {
      this.isIndexTouching = false
      this.showLetterBubble = false
    },
    
    // 鏍规嵁瑙︽懜浣嶇疆鑾峰彇瀛楁瘝
    getLetterFromTouch(pageY) {
      // 绠€鍖栧疄鐜帮細鏍规嵁瑙︽懜浣嶇疆璁＄畻瀵瑰簲鐨勫瓧姣嶇储寮?      const query = createDomQuery().in(this)
      query.select('.index-bar').boundingClientRect()
      query.selectAll('.index-letter').boundingClientRect()
      query.exec((res) => {
        if (!res || !res[0] || !res[1]) return null
        
        const barRect = res[0]
        const letterRects = res[1]
        
        // 鎵惧埌鏈€鎺ヨ繎鐨勫瓧姣?        let closestIndex = 0
        let minDistance = Infinity
        
        letterRects.forEach((rect, index) => {
          const letterCenterY = rect.top + rect.height / 2
          const distance = Math.abs(pageY - letterCenterY)
          
          if (distance < minDistance) {
            minDistance = distance
            closestIndex = index
          }
        })
        
        return this.availableLetters[closestIndex]
      })
      
      // 涓存椂杩斿洖绗竴涓瓧姣嶏紙瀹為檯搴旇寮傛澶勭悊锛?      return this.availableLetters[0]
    },
    
    // 澶勭悊棰滆壊鐐瑰嚮
    handleColorClick(hex) {
      if (this.selectedColor === hex) {
        this.$emit('select-color', '')
      } else {
        this.$emit('select-color', hex)
      }
    }
  }
}
</script>

<style scoped>
.color-palette-container {
  display: flex;
  gap: 16rpx;
  position: relative;
}

.color-grid-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.palette-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8rpx;
}

.palette-info {
  font-size: 20rpx;
  color: #000000;
  font-weight: 900;
}

.selected-code {
  font-size: 20rpx;
  color: #4a4a4a;
  font-family: monospace;
  font-weight: bold;
}

.color-grid-scroll {
  max-height: 384rpx;
  padding: 8rpx;
}

.color-group {
  margin-bottom: 24rpx;
}

.group-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  background-color: #ffffff;
  min-height: 52rpx;
  padding: 8rpx 0;
  margin-bottom: 16rpx;
  border-left: 4rpx solid #ffd23f;
  z-index: 10;
}

.group-letter {
  font-size: 26rpx;
  font-family: monospace;
  font-weight: bold;
  color: #000000;
  margin-left: 12rpx;
  line-height: 1;
}

.group-count {
  font-size: 20rpx;
  color: #777777;
  margin-left: 14rpx;
  line-height: 1;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16rpx;
}

.color-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 16rpx;
  border-radius: 0;
  border: 4rpx solid var(--border-color);
  position: relative;
  transition: all 0.2s;
}

.color-item.active {
  border-color: #000000;
  background-color: #fff8d6;
  box-shadow: 0 0 0 4rpx #ffd23f;
  z-index: 10;
}

.color-item.active .color-code {
  color: #000000;
}

.color-swatch {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.color-code {
  font-size: 16rpx;
  font-family: monospace;
  color: #000000;
  font-weight: bold;
  line-height: 1;
}

.index-bar {
  width: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16rpx 0;
}

.index-letters {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.index-letter {
  width: 32rpx;
  height: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  transition: all 0.2s;
}

.index-letter.active {
  transform: scale(1.25);
}

.letter-text {
  font-size: 16rpx;
  font-family: monospace;
  font-weight: bold;
  color: #777777;
}

.index-letter.active .letter-text {
  color: #000000;
}

.letter-bubble {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -50%);
}

.bubble-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 128rpx;
  height: 128rpx;
  background-color: #ffd23f;
  color: #000000;
  font-family: monospace;
  font-weight: bold;
  font-size: 48rpx;
  border-radius: 0;
  border: 3rpx solid #000000;
  box-shadow: 2rpx 2rpx 0 #000000;
}
</style>
