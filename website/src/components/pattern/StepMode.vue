<template>
  <div class="step-mode">
    <h2 class="step-title">閫夋嫨鍒涗綔妯″紡</h2>
    <div class="mode-options">
      <div 
        class="mode-card"
        :class="{ active: modelValue === 'blank' }"
        @click="$emit('update:modelValue', 'blank')"
      >
        <div class="mode-icon">鐢诲竷</div>
        <h3>绌虹櫧鐢诲竷</h3>
        <p>浠庨浂寮€濮嬪垱浣滄偍鐨勫儚绱犺壓鏈?</p>
      </div>
      
      <div 
        class="mode-card"
        :class="{ active: modelValue === 'image' }"
        @click="$emit('update:modelValue', 'image')"
      >
        <div class="mode-icon">鍥剧墖</div>
        <h3>瀵煎叆鍥剧墖</h3>
        <p>涓婁紶鍥剧墖骞惰浆鎹负鍍忕礌鑹烘湳</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.step-mode {
  padding: 40px 0;
}

.step-title {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 48px;
  text-align: center;
}

.mode-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.mode-card {
  padding: 48px 36px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 3px solid rgba(255, 107, 107, 0.15);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  box-shadow: 0 4px 20px rgba(255, 107, 107, 0.1);
}

.mode-card:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(255, 107, 107, 0.3);
  transform: translateY(-6px);
  box-shadow: 0 8px 32px rgba(255, 107, 107, 0.2);
}

.mode-card.active {
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%);
  border-color: #ff6b6b;
  box-shadow: 0 8px 32px rgba(255, 107, 107, 0.3);
  transform: translateY(-6px);
}

.mode-icon {
  width: 90px;
  height: 90px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--nb-ink);
  font-weight: 700;
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.3);
}

.mode-card h3 {
  font-size: 24px;
  color: #2d3748;
  margin-bottom: 12px;
  font-weight: 700;
}

.mode-card p {
  font-size: 15px;
  color: #718096;
  line-height: 1.6;
}
</style>

@media (max-width: 768px) {
  .step-mode {
    padding: 24px 0;
  }
  
  .step-title {
    font-size: 28px;
    margin-bottom: 32px;
  }
  
  .mode-options {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .mode-card {
    padding: 36px 28px;
  }
  
  .mode-icon {
    width: 70px;
    height: 70px;
    font-size: 16px;
  }
  
  .mode-card h3 {
    font-size: 20px;
  }
}
