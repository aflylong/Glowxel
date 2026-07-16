<template>
  <div class="standardize-panel">
    <div class="panel-head">
      <h2>鏍囧噯鍖栨浛鎹?</h2>
      <span>{{ groups.length }} 缁勯鑹插亸宸?</span>
    </div>

    <div v-if="groups.length" class="group-list">
      <div v-for="group in groups" :key="group.id" class="group-card">
        <div class="group-top">
          <div class="color-pair">
            <span class="color-badge" :style="{ backgroundColor: group.sourceHex }">{{ group.sourceCode }}</span>
            <span class="arrow">鈫?</span>
            <span class="color-badge" :style="{ backgroundColor: group.targetHex }">{{ group.targetCode }}</span>
          </div>
          <strong>{{ group.count }} 澶?</strong>
        </div>

        <p class="group-meta">
          瀹炴媿鏍￠獙閲岃繖缁勯鑹叉渶甯歌锛屼紭鍏堣€冭檻鏇挎崲鎴愯瀵熻壊锛屾垨鑰呴€変竴涓洿鏍囧噯鐨勭浉杩戣壊銆?        </p>

        <div class="group-stats">
          <span>灞€閮ㄥ彲鍑忓皯 {{ group.estimatedFixCount }} 澶勫亸宸?</span>
          <span>褰撳墠鍥剧焊鍏?{{ group.globalSourceCount }} 澶?{{ group.sourceCode }}</span>
        </div>

        <div class="action-row">
          <button
            class="action-btn primary"
            type="button"
            @click="$emit('apply-group-replacement', group, group.targetCode, 'group')"
          >
            浠呮浛鎹㈣繖 {{ group.count }} 澶?          </button>
          <button
            class="action-btn"
            type="button"
            @click="$emit('apply-group-replacement', group, group.targetCode, 'global')"
          >
            鍏ㄥ浘鏇挎崲 {{ group.sourceCode }}
          </button>
        </div>

        <div v-if="group.similarOptions.length" class="similar-box">
          <span class="similar-label">鐩歌繎澶囬€?</span>
          <div class="similar-grid">
            <button
              v-for="option in group.similarOptions"
              :key="`${group.id}-${option.code}`"
              class="similar-btn"
              type="button"
              @click="$emit('apply-group-replacement', group, option.code, 'group')"
            >
              <i :style="{ backgroundColor: option.hex }"></i>
              <span>{{ option.code }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      杩樻病鏈夊彲鑱氬悎鐨勯鑹插亸宸€傚鍏ュ疄鎷嶅浘鍚庯紝杩欓噷浼氭妸鏈€甯歌鐨勯鑹茶宸敹鏁涙垚鍙浛鎹㈠缓璁€?    </div>
  </div>
</template>

<script setup>
defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["apply-group-replacement"]);
</script>

<style scoped>
.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-head h2 {
  font-size: 18px;
  color: #18304f;
}

.panel-head span {
  font-size: 12px;
  color: #7b889f;
}

.group-list {
  display: grid;
  gap: 12px;
}

.group-card {
  padding: 14px;
  border-radius: 18px;
  background: #f7fbff;
  border: 1px solid #dbe4f2;
}

.group-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.group-top strong {
  color: #18304f;
  font-size: 13px;
}

.color-pair {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-badge {
  min-width: 54px;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(9, 19, 33, 0.12);
  color: #18304f;
  font-size: 12px;
  font-weight: 700;
}

.arrow {
  color: #6d7c92;
  font-size: 12px;
  font-weight: 700;
}

.group-meta {
  margin-top: 10px;
  color: #6d7c92;
  font-size: 13px;
  line-height: 1.7;
}

.group-stats {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  color: #617089;
  font-size: 12px;
  font-weight: 700;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.action-btn {
  height: 38px;
  padding: 0 10px;
  border: 1px solid #dbe4f2;
  border-radius: 12px;
  background: #fff;
  color: #27405f;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.action-btn.primary {
  background: linear-gradient(135deg, #2f6dff, #55c4ff);
  border-color: transparent;
  color: var(--nb-ink);
}

.similar-box {
  margin-top: 12px;
}

.similar-label {
  display: block;
  margin-bottom: 8px;
  color: #617089;
  font-size: 12px;
  font-weight: 700;
}

.similar-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.similar-btn {
  display: grid;
  grid-template-columns: 14px 1fr;
  gap: 8px;
  align-items: center;
  height: 34px;
  padding: 0 10px;
  border: 1px solid #dbe4f2;
  border-radius: 10px;
  background: #fff;
  color: #27405f;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  text-align: left;
}

.similar-btn i {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(9, 19, 33, 0.15);
}

.empty-state {
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px dashed #cfdceb;
  color: #6d7c92;
  font-size: 13px;
  line-height: 1.7;
}
</style>
