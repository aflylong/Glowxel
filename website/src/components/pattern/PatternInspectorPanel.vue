<template>
  <div class="inspector-panel">
    <div class="panel-head">
      <h2>褰撳墠闂</h2>
      <span>{{ issueLabel }}</span>
    </div>

    <div v-if="selectedIssue" class="issue-detail">
      <strong>{{ selectedIssue.title }}</strong>
      <p>{{ selectedIssue.meta }}</p>
      <div class="detail-grid">
        <div class="detail-card">
          <span>鍧愭爣</span>
          <strong>{{ positionText }}</strong>
        </div>
        <div class="detail-card">
          <span>浼樺厛绾?</span>
          <strong>{{ selectedIssue.severity }}</strong>
        </div>
      </div>

      <div v-if="pixelContext" class="pixel-context">
        <div class="context-row">
          <span>褰撳墠棰滆壊</span>
          <strong>{{ pixelContext.currentCode }}</strong>
        </div>
        <div class="context-row">
          <span>鍙傝€冮鑹?</span>
          <strong>{{ pixelContext.referenceCode }}</strong>
        </div>
      </div>

      <div class="suggestion-box">
        {{ suggestionText }}
      </div>
    </div>

    <div v-else class="empty-state">
      閫変腑鍙充晶闂椤瑰悗锛岃繖閲屼細鏄剧ず闂璇︽儏銆佸潗鏍囧拰淇寤鸿銆?    </div>

    <div class="panel-head actions-head">
      <h2>淇鍔ㄤ綔</h2>
      <span>{{ actionStateText }}</span>
    </div>

    <div class="action-grid">
      <button
        class="action-btn primary"
        type="button"
        :disabled="!selectedIssue"
        @click="$emit('issue-action', 'suggestion')"
      >
        搴旂敤寤鸿
      </button>
      <button
        class="action-btn"
        type="button"
        :disabled="!selectedIssue"
        @click="$emit('issue-action', 'reference')"
      >
        鏀规垚鍙傝€?      </button>
      <button
        class="action-btn"
        type="button"
        :disabled="!selectedIssue"
        @click="$emit('issue-action', 'neighbor')"
      >
        鍚堝苟閭诲煙鑹?      </button>
      <button
        class="action-btn"
        type="button"
        :disabled="!selectedIssue"
        @click="$emit('issue-action', 'remove')"
      >
        鍒犻櫎褰撳墠鐐?      </button>
      <button
        class="action-btn"
        type="button"
        :disabled="!selectedIssue"
        @click="$emit('issue-action', 'ignore')"
      >
        蹇界暐姝ら」
      </button>
    </div>

    <div class="panel-head actions-head">
      <h2>鎵归噺澶勭悊</h2>
      <span>{{ filteredIssueCount }} 椤?</span>
    </div>

    <div class="action-grid">
      <button
        class="action-btn primary"
        type="button"
        :disabled="!filteredIssueCount"
        @click="$emit('batch-action', 'suggestion')"
      >
        褰撳墠绛涢€夊簲鐢ㄥ缓璁?      </button>
      <button
        class="action-btn"
        type="button"
        :disabled="!filteredIssueCount"
        @click="$emit('batch-action', 'reference')"
      >
        褰撳墠绛涢€夋寜鍙傝€?      </button>
      <button
        class="action-btn"
        type="button"
        :disabled="!filteredIssueCount"
        @click="$emit('batch-action', 'ignore')"
      >
        褰撳墠绛涢€夊拷鐣?      </button>
      <button
        class="action-btn"
        type="button"
        :disabled="!ignoredIssueCount"
        @click="$emit('clear-ignored')"
      >
        娓呯┖蹇界暐
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  selectedIssue: {
    type: Object,
    default: null,
  },
  pixelContext: {
    type: Object,
    default: null,
  },
  filteredIssueCount: {
    type: Number,
    default: 0,
  },
  ignoredIssueCount: {
    type: Number,
    default: 0,
  },
});

defineEmits(["issue-action", "batch-action", "clear-ignored"]);

const issueLabel = computed(() => {
  if (!props.selectedIssue) {
    return "鏈€変腑";
  }
  return props.selectedIssue.type;
});

const positionText = computed(() => {
  if (!props.selectedIssue) {
    return "--";
  }
  if (!props.selectedIssue.position) {
    return "--";
  }
  return `(${props.selectedIssue.position.x}, ${props.selectedIssue.position.y})`;
});

const suggestionText = computed(() => {
  if (!props.selectedIssue) {
    return "";
  }
  if (props.selectedIssue.type === "瀛ょ珛鐐?) {"
    return "寤鸿鍏堟鏌ュ懆鍥?8 閭诲煙棰滆壊锛屼紭鍏堝悎骞跺埌閭诲煙涓昏壊锛屽噺灏戠鐐广€?";"
  }
  if (props.selectedIssue.type === "缂哄け鐐?) {"
    return "褰撳墠鍥剧焊缂哄皯鍙傝€冨儚绱狅紝鍚庣画鍙互鐩存帴琛ョ偣鎴栨壒閲忔寜鍙傝€冨浘淇銆?";"
  }
  if (props.selectedIssue.type === "澶氫綑鐐?) {"
    return "褰撳墠浣嶇疆鍦ㄥ綋鍓嶅浘绾稿瓨鍦ㄩ澶栧儚绱狅紝寤鸿缁撳悎鏁翠綋杞粨鍒ゆ柇鏄惁鍒犻櫎銆?";"
  }
  if (props.selectedIssue.type === "棰滆壊鍋忓樊") {
    return "褰撳墠浣嶇疆棰滆壊涓庡弬鑰冨浘涓嶄竴鑷达紝浼樺厛妫€鏌ユ槸鍚﹂渶瑕佹浛鎹负鍙傝€冭壊鍙枫€?";"
  }
  return "杩欎釜闂宸茬粡瀹氫綅鍑烘潵浜嗭紝涓嬩竴姝ュ彲浠ユ帴鎵归噺淇鍜屽眬閮ㄧ紪杈戝姩浣溿€?";"
});

const actionStateText = computed(() => {
  if (!props.selectedIssue) {
    return "璇烽€夋嫨闂";
  }
  return "宸叉帴鍏ョ湡瀹炰慨鏀?";"
});
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

.actions-head {
  margin-top: 18px;
}

.issue-detail {
  padding: 16px;
  border-radius: 18px;
  background: #f7fbff;
  border: 1px solid #dbe4f2;
}

.issue-detail strong {
  display: block;
  color: #18304f;
  line-height: 1.6;
}

.issue-detail p,
.empty-state {
  margin-top: 8px;
  color: #6d7c92;
  line-height: 1.7;
  font-size: 14px;
}

.empty-state {
  padding: 16px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px dashed #cfdceb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}

.detail-card {
  padding: 12px;
  border-radius: 14px;
  background: #eef5ff;
  border: 1px solid #dbe4f2;
}

.detail-card span {
  display: block;
  font-size: 12px;
  color: #6d7c92;
}

.detail-card strong {
  display: block;
  margin-top: 6px;
  color: #18304f;
  font-size: 14px;
}

.pixel-context {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid #dbe4f2;
}

.context-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #617089;
  font-size: 13px;
}

.context-row + .context-row {
  margin-top: 8px;
}

.context-row strong {
  color: #18304f;
}

.suggestion-box {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #f0f7ff;
  border: 1px solid #dbe4f2;
  color: #375374;
  font-size: 13px;
  line-height: 1.7;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.action-btn {
  height: 40px;
  padding: 0 14px;
  border: 1px solid #dbe4f2;
  border-radius: 12px;
  background: #eff4fb;
  color: #27405f;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.action-btn.primary {
  background: linear-gradient(135deg, #2f6dff, #55c4ff);
  color: var(--nb-ink);
  border-color: transparent;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
