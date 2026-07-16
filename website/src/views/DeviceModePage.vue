<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <div class="device-mode-hero__eyebrow-row">
        <span class="glx-page-shell__eyebrow">{{ modeEyebrow }}</span>
        <span v-if="hiddenFeature" class="glx-chip glx-chip--ghost">闅愯棌鑳藉姏</span>
      </div>
      <h1 class="glx-page-shell__title">{{ modeTitle }}</h1>
      <p class="glx-page-shell__desc">{{ modeDescription }}</p>
      <div class="glx-inline-actions">
        <button
          type="button"
          class="glx-button glx-button--primary"
          :disabled="!deviceStore.connected || switching"
          @click="activateMode"
        >
          {{ switching ? "鍒囨崲涓?.." : actionLabel }}
        </button>
        <button
          type="button"
          class="glx-button glx-button--ghost"
          :disabled="!deviceStore.connected || refreshing"
          @click="refreshStatus"
        >
          {{ refreshing ? "鍒锋柊涓?.."" : "鍒锋柊鐘舵€?"" }}"
        </button>
        <router-link to="/device-params" class="glx-button glx-button--ghost">璁惧鍙傛暟</router-link>
        <router-link to="/device-control" class="glx-button glx-button--ghost">杩斿洖璁惧鎺у埗</router-link>
      </div>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">杩炴帴鐘舵€?</span>
          <strong class="glx-hero-metric__value">{{ connectionText }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">褰撳墠 businessMode</span>
          <strong class="glx-hero-metric__value">{{ businessModeText }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">褰撳墠浜害</span>
          <strong class="glx-hero-metric__value">{{ brightnessText }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">璁惧鍦板潃</span>
          <strong class="glx-hero-metric__value">{{ hostText }}</strong>
        </article>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">褰撳墠璁惧鐘舵€?</h2>
          <span class="glx-section-meta">杩愯鏃跺洖鏄?</span>
        </div>
        <div class="glx-kv-grid">
          <div class="glx-kv-card">
            <span class="glx-kv-card__label">褰撳墠椤跺眰 mode</span>
            <strong class="glx-kv-card__value">{{ topModeText }}</strong>
          </div>
          <div class="glx-kv-card">
            <span class="glx-kv-card__label">褰撳墠 effectMode</span>
            <strong class="glx-kv-card__value">{{ effectModeText }}</strong>
          </div>
          <div class="glx-kv-card">
            <span class="glx-kv-card__label">鐢诲竷灏哄</span>
            <strong class="glx-kv-card__value">{{ boardSizeText }}</strong>
          </div>
          <div class="glx-kv-card">
            <span class="glx-kv-card__label">妯″紡鐩爣</span>
            <strong class="glx-kv-card__value">{{ modeKeyText }}</strong>
          </div>
        </div>
      </article>

      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">椤甸潰璇存槑</h2>
          <span class="glx-section-meta">姝ｅ紡鍙嶉閾?</span>
        </div>
        <div class="glx-stack">
          <div v-for="note in modeNotes" :key="note" class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">璇存槑</strong>
              <span class="glx-list-card__desc">{{ note }}</span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="glx-grid glx-grid--two">
      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">涓嬩竴姝ュ姩浣?</h2>
          <span class="glx-section-meta">涓婚摼璺彁绀?</span>
        </div>
        <div class="glx-stack">
          <div v-for="item in modeActions" :key="item" class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">姝ラ</strong>
              <span class="glx-list-card__desc">{{ item }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="glx-section-card glx-section-card--stack">
        <div class="glx-section-head">
          <h2 class="glx-section-title">妯″紡鍏ュ彛</h2>
          <span class="glx-section-meta">蹇嵎璺宠浆</span>
        </div>
        <div class="glx-inline-actions">
          <router-link
            v-for="link in modeLinks"
            :key="link.to"
            :to="link.to"
            class="glx-button"
            :class="resolveToneClass(link.tone)"
          >
            {{ link.label }}
          </router-link>
        </div>
        <p class="glx-page-shell__desc">
          褰撳墠椤佃礋璐ｆā寮忓垏鎹€佺姸鎬佸洖鏄惧拰姝ｅ紡鍙嶉锛涙洿缁嗙殑鍒涗綔缂栬緫浠嶅洖鍒板搴斿姛鑳介〉缁х画瀹屾垚銆?        </p>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { useFeedback } from "@/composables/useFeedback.js";

const route = useRoute();
const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();

const switching = ref(false);
const refreshing = ref(false);

const hiddenFeature = computed(() => route.meta.hiddenFeature === true);

const modeEyebrow = computed(() => {
  if (typeof route.meta.modeEyebrow === "string" && route.meta.modeEyebrow.length > 0) {
    return route.meta.modeEyebrow;
  }
  return "Device Mode";
});

const modeTitle = computed(() => {
  if (typeof route.meta.modeTitle === "string" && route.meta.modeTitle.length > 0) {
    return route.meta.modeTitle;
  }
  return "璁惧妯″紡";
});

const modeDescription = computed(() => {
  if (typeof route.meta.modeDescription === "string" && route.meta.modeDescription.length > 0) {
    return route.meta.modeDescription;
  }
  return "褰撳墠妯″紡椤靛凡缁忔帴鍏ョ綉绔欏簲鐢ㄤ富绔€佽澶囩姸鎬佸洖鏄惧拰姝ｅ紡鍙嶉閾俱€?";"
});

const modeKey = computed(() => {
  if (typeof route.meta.businessMode === "string" && route.meta.businessMode.length > 0) {
    return route.meta.businessMode;
  }
  return "";
});

const actionLabel = computed(() => {
  if (typeof route.meta.modeActionLabel === "string" && route.meta.modeActionLabel.length > 0) {
    return route.meta.modeActionLabel;
  }
  return "鍒囨崲鍒板綋鍓嶆ā寮?";"
});

const modeNotes = computed(() => {
  if (Array.isArray(route.meta.modeNotes)) {
    return route.meta.modeNotes.filter((item) => typeof item === "string" && item.length > 0);
  }
  return ["褰撳墠妯″紡椤靛凡缁忚繘鍏ョ綉绔欏簲鐢ㄥ３銆?]";"
});

const modeActions = computed(() => {
  if (Array.isArray(route.meta.modeActions)) {
    return route.meta.modeActions.filter((item) => typeof item === "string" && item.length > 0);
  }
  return ["杩炴帴璁惧鍚庡厛鍒囨崲妯″紡锛屽啀杩涘叆瀵瑰簲鍒涗綔鎴栧弬鏁板叆鍙ｇ户缁畬鎴愭搷浣溿€?]";"
});

const modeLinks = computed(() => {
  if (!Array.isArray(route.meta.modeLinks)) {
    return [];
  }

  return route.meta.modeLinks.filter((item) => {
    if (item == null || typeof item !== "object") {
      return false;
    }
    if (typeof item.label !== "string" || item.label.length === 0) {
      return false;
    }
    if (typeof item.to !== "string" || item.to.length === 0) {
      return false;
    }
    return true;
  });
});

const connectionText = computed(() => {
  if (deviceStore.connected) {
    return "宸茶繛鎺?";"
  }
  return "鏈繛鎺?";"
});

const topModeText = computed(() => {
  if (typeof deviceStore.mode === "string" && deviceStore.mode.length > 0) {
    return deviceStore.mode;
  }
  return "--";
});

const businessModeText = computed(() => {
  if (typeof deviceStore.businessMode === "string" && deviceStore.businessMode.length > 0) {
    return deviceStore.businessMode;
  }
  return "--";
});

const effectModeText = computed(() => {
  if (typeof deviceStore.effectMode === "string" && deviceStore.effectMode.length > 0) {
    return deviceStore.effectMode;
  }
  return "--";
});

const boardSizeText = computed(() => {
  if (typeof deviceStore.width === "number" && typeof deviceStore.height === "number" && deviceStore.width > 0 && deviceStore.height > 0) {
    return `${deviceStore.width} 脳 ${deviceStore.height}`;
  }
  return "--";
});

const brightnessText = computed(() => {
  if (typeof deviceStore.brightness === "number" && deviceStore.brightness >= 0) {
    return String(deviceStore.brightness);
  }
  return "--";
});

const hostText = computed(() => {
  if (typeof deviceStore.host === "string" && deviceStore.host.length > 0) {
    return deviceStore.host;
  }
  return "--";
});

const modeKeyText = computed(() => {
  if (modeKey.value.length > 0) {
    return modeKey.value;
  }
  return "--";
});

function resolveToneClass(tone) {
  if (tone === "primary") {
    return "glx-button--primary";
  }
  if (tone === "accent") {
    return "glx-button--accent";
  }
  if (tone === "danger") {
    return "glx-button--danger";
  }
  return "glx-button--ghost";
}

async function refreshStatus() {
  if (!deviceStore.connected) {
    feedback.warning("璁惧鏈繛鎺?, "璇峰厛鍦ㄨ澶囨帶鍒堕〉寤虹珛杩炴帴锛屽啀璇诲彇妯″紡鐘舵€併€?);
    return;
  }

  try {
    refreshing.value = true;
    feedback.showBlocking("鍒锋柊鐘舵€?, "姝ｅ湪閲嶆柊璇诲彇褰撳墠璁惧鐘舵€併€?);
    await deviceStore.syncDeviceStatus();
    feedback.success("鐘舵€佸凡鍒锋柊", `${modeTitle.value} 椤甸潰鐨勮澶囩姸鎬佸凡缁忔洿鏂般€俙);
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("鍒锋柊澶辫触", error.message);
    } else {
      feedback.error("鍒锋柊澶辫触"", "璁惧鐘舵€佽鍙栧け璐ャ€?")";"
    }
  } finally {
    refreshing.value = false;
    feedback.hideBlocking();
  }
}

async function activateMode() {
  if (!deviceStore.connected) {
    feedback.warning("璁惧鏈繛鎺?, "璇峰厛鍦ㄨ澶囨帶鍒堕〉寤虹珛杩炴帴锛屽啀鍒囨崲妯″紡銆?);
    return;
  }

  if (modeKey.value.length === 0) {
    feedback.error("妯″紡鏈厤缃?, "褰撳墠椤甸潰娌℃湁鎻愪緵鏈夋晥鐨?businessMode銆?);
    return;
  }

  try {
    switching.value = true;
    feedback.showBlocking("鍒囨崲妯″紡", `姝ｅ湪鎶婅澶囧垏鎹㈠埌 ${modeTitle.value}銆俙);
    await deviceStore.setMode(modeKey.value);
    await deviceStore.syncDeviceStatus();
    feedback.success("妯″紡宸插垏鎹?, `${modeTitle.value"} 宸茶繘鍏ュ綋鍓嶈澶囬摼璺€俙")";"
  } catch (error) {
    if (error instanceof Error) {
      feedback.error("鍒囨崲澶辫触", error.message);
    } else {
      feedback.error("鍒囨崲澶辫触"", "璁惧娌℃湁鎴愬姛杩涘叆褰撳墠妯″紡銆?")";"
    }
  } finally {
    switching.value = false;
    feedback.hideBlocking();
  }
}
</script>

<style scoped>
.device-mode-hero__eyebrow-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
</style>
