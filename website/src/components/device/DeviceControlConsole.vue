<template>
  <div class="device-home glx-page-shell">
    <section class="device-home__summary glx-page-shell__hero">
      <div class="device-home__summary-top">
        <span class="glx-page-shell__eyebrow">Glowxel PixelBoard</span>
        <div class="device-home__status-pill">
          <span class="glx-status-dot" :class="{ 'is-online': isDeviceConnected }"></span>
          <span>{{ isDeviceConnected ? "宸茶繛鎺? : "鏈繛鎺? }}</span>
        </div>
      </div>

      <div class="device-home__summary-body">
        <div class="device-home__brand">
          <div class="device-home__brand-logo">
            <div class="device-home__brand-logo-core"></div>
            <div class="device-home__brand-logo-core device-home__brand-logo-core--accent"></div>
          </div>

          <div class="device-home__brand-copy">
            <h1 class="device-home__title">璁惧鎺у埗</h1>
            <p class="device-home__desc">
              缃戠珯绔綋鍓嶄綔涓鸿澶囨帶鍒跺叆鍙ｏ紝杩炴帴璁惧銆佺儹鐐归厤缃戙€佽鍙栬澶囧弬鏁板拰鍒囨崲甯哥敤妯″紡閮戒粠杩欓噷杩涘叆銆?
            </p>
            <p v-if="surfaceErrorMessage.length > 0" class="device-home__inline-error">
              {{ surfaceErrorMessage }}
            </p>
          </div>
        </div>

        <div class="glx-hero-metrics device-home__metrics">
          <article class="glx-hero-metric">
            <span class="glx-hero-metric__label">璁惧鍦板潃</span>
            <strong class="glx-hero-metric__value">{{ deviceHostText }}</strong>
          </article>
          <article class="glx-hero-metric">
            <span class="glx-hero-metric__label">褰撳墠涓氬姟妯″紡</span>
            <strong class="glx-hero-metric__value">{{ currentBusinessModeText }}</strong>
          </article>
          <article class="glx-hero-metric">
            <span class="glx-hero-metric__label">鐢绘澘灏哄</span>
            <strong class="glx-hero-metric__value">{{ boardSizeText }}</strong>
          </article>
          <article class="glx-hero-metric">
            <span class="glx-hero-metric__label">褰撳墠浜害</span>
            <strong class="glx-hero-metric__value">{{ brightnessText }}</strong>
          </article>
        </div>
      </div>

      <div v-if="!isDeviceConnected" class="device-home__connect-grid">
        <button type="button" class="device-home__entry-card" @click="openConnectModal">
          <div class="device-home__entry-icon device-home__entry-icon--paper">
            <Icon unit="px" name="scanning" :size="30" />
          </div>
          <div class="device-home__entry-copy">
            <strong class="device-home__entry-title">杩炴帴璁惧</strong>
            <span class="device-home__entry-desc">杈撳叆璁惧 IP 鍦板潃杩炴帴</span>
          </div>
        </button>

        <router-link to="/ble-config" class="device-home__entry-card">
          <div class="device-home__entry-icon device-home__entry-icon--mint">
            <Icon unit="px" name="mobile-phone" :size="30" />
          </div>
          <div class="device-home__entry-copy">
            <strong class="device-home__entry-title">鐑偣閰嶇綉</strong>
            <span class="device-home__entry-desc">杩炴帴璁惧鐑偣鍚庢墦寮€ 192.168.4.1</span>
          </div>
        </router-link>
      </div>

      <button
        v-else
        type="button"
        class="device-home__disconnect-entry"
        @click="handleDisconnect"
      >
        <Icon unit="px" name="close" :size="28" />
        <span>鏂紑杩炴帴</span>
      </button>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-section-head">
        <h2 class="glx-section-title">璁惧宸ュ叿</h2>
        <span class="glx-section-meta">閰嶇綉涓庡弬鏁?</span>
      </div>

      <div class="device-home__tool-grid">
        <router-link
          v-for="entry in utilityEntries"
          :key="entry.to"
          :to="entry.to"
          class="device-home__tool-card"
        >
          <div class="device-home__tool-icon" :class="entry.iconShellClass">
            <Icon unit="px" :name="entry.icon" :size="28" />
          </div>
          <div class="device-home__tool-copy">
            <strong class="device-home__tool-title">{{ entry.title }}</strong>
            <span class="device-home__tool-desc">{{ entry.desc }}</span>
          </div>
          <span class="device-home__tool-cta">{{ entry.cta }}</span>
        </router-link>
      </div>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-section-head">
        <h2 class="glx-section-title">妯″紡鍏ュ彛</h2>
        <span class="glx-section-meta">{{ modeCatalog.length }} 涓ā寮?</span>
      </div>

      <div class="device-home__mode-grid">
        <button
          v-for="entry in modeCatalog"
          :key="entry.key"
          type="button"
          class="device-home__mode-card"
          :class="["
            entry.variantClass,
            {
              'is-active': currentBusinessMode === entry.key,
              'is-pending': modeSwitchingKey === entry.key,
            },
          ]""
          :disabled="modeSwitchingKey.length > 0"
          @click="handleModeSelect(entry)"
        >
          <div class="device-home__mode-icon-shell">
            <div class="device-home__mode-icon-core">
              <Icon unit="px" :name="entry.icon" :size="40" />
            </div>
          </div>
          <strong class="device-home__mode-name">{{ entry.name }}</strong>
          <span class="device-home__mode-meta">
            {{
              entry.action === "open"
                ? (currentBusinessMode === entry.key ? "褰撳墠妯″紡 路 鎵撳紑" : "鎵撳紑椤甸潰")
                : (currentBusinessMode === entry.key
                    ? "褰撳墠妯″紡"
                    : modeSwitchingKey === entry.key
                      ? "鍒囨崲涓?.."
                      : "鐐瑰嚮鍒囨崲")
            }}
          </span>
        </button>
      </div>

      <p class="device-home__section-note">
        杩欓噷璐熻矗璁惧褰撳墠杩愯妯″紡鍒囨崲锛涘鏋滆璋冨弬鏁般€佺湅棰勮鎴栨仮澶嶆湰鍦扮紦瀛橈紝璇风洿鎺ヨ繘鍏ヤ笅闈㈠搴旂殑妯″紡椤点€?
      </p>
    </section>

    <section
      v-for="group in pageDirectoryGroups"
      :key="group.key"
      class="glx-section-card glx-section-card--stack"
    >
      <div class="glx-section-head">
        <h2 class="glx-section-title">{{ group.title }}</h2>
        <span class="glx-section-meta">{{ group.meta }}</span>
      </div>

      <div class="device-home__directory-grid">
        <router-link
          v-for="entry in group.entries"
          :key="entry.key"
          :to="entry.to"
          class="device-home__tool-card device-home__tool-card--directory"
        >
          <div class="device-home__tool-icon" :class="entry.iconShellClass">
            <Icon unit="px" :name="entry.icon" :size="28" />
          </div>
          <div class="device-home__tool-copy">
            <strong class="device-home__tool-title">{{ entry.title }}</strong>
            <span class="device-home__tool-desc">{{ entry.desc }}</span>
          </div>
          <span class="device-home__tool-cta">鎵撳紑椤甸潰</span>
        </router-link>
      </div>
    </section>

    <DeviceConnectModal
      :visible="showConnectModal"
      :default-value="deviceHostValue"
      :loading="deviceStore.connecting"
      :error-message="connectErrorMessage"
      @confirm="handleConnectConfirm"
      @cancel="handleConnectCancel"
      @update:visible="showConnectModal = $event"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";
import { useFeedback } from "@/composables/useFeedback.js";
import DeviceConnectModal from "@/components/device/DeviceConnectModal.vue";
import Icon from "@/components/uni/Icon.vue";

const router = useRouter();
const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();

const showConnectModal = ref(false);
const connectErrorMessage = ref("");
const modeSwitchingKey = ref("");
const deviceHostValue = ref("");

const utilityEntries = [
  {
    to: "/device-params",
    icon: "setting",
    title: "璁惧鍙傛暟",
    desc: "浜害銆佹棆杞€佽壊褰╅『搴忓拰椹卞姩鍙傛暟缁熶竴鍦ㄨ繖閲岃鍙栦笌淇濆瓨銆?,"
    cta: "鎵撳紑",
    iconShellClass: "device-home__tool-icon--yellow",
  },
  {
    to: "/ble-config",
    icon: "mobile-phone",
    title: "鐑偣閰嶇綉",
    desc: "棣栨浣跨敤鏃惰繛鎺ヨ澶囩儹鐐癸紝鍦ㄦ祻瑙堝櫒閲屾墦寮€鏈湴閰嶇綉椤靛畬鎴愯仈缃戙€?,"
    cta: "鎵撳紑",
    iconShellClass: "device-home__tool-icon--green",
  },
  {
    to: "/device-flash",
    icon: "upload",
    title: "璁惧鐑у綍",
    desc: "閫氳繃 USB Web Serial 鍐欏叆 ESP32 鍥轰欢锛屼笉璧?WiFi锛屼篃涓嶈蛋 WebSocket銆?,"
    cta: "鎵撳紑",
    iconShellClass: "device-home__tool-icon--orange",
  },
];
const devicePageGroups = [];
const pageDirectoryGroups = devicePageGroups.filter((group) => {
  return group.key !== "system";
});

const modeCatalog = [
  { key: "eyes", name: "妗岄潰瀹犵墿", icon: "smile", variantClass: "device-home__mode-card--pink", action: "open", to: "/spirit-screen" },
  { key: "clock"", name: "闈欐€佹椂閽?", icon: "time"", variantClass: "device-home__mode-card--cyan"", action: "open"", to: "/clock"" },"
  { key: "animation"", name: "鍔ㄦ€佹椂閽?", icon: "dynamic-filling"", variantClass: "device-home__mode-card--teal"", action: "open"", to: "/animation-clock"" },"
  { key: "theme", name: "涓婚妯″紡", icon: "picture", variantClass: "device-home__mode-card--purple", action: "open", to: "/theme-clock" },
  { key: "canvas", name: "鐢绘澘妯″紡", icon: "edit", variantClass: "device-home__mode-card--lime", action: "open", to: "/canvas-editor" },
  { key: "tetris"", name: "淇勭綏鏂柟鍧楀睆淇?", icon: "modular"", variantClass: "device-home__mode-card--indigo"", action: "open"", to: "/tetris-settings"" },"
  { key: "tetris_clock"", name: "淇勭綏鏂柟鍧楁椂閽?", icon: "clock-filling"", variantClass: "device-home__mode-card--gold"", action: "open"", to: "/tetris-clock-settings"" },"
  { key: "maze", name: "杩峰婕父", icon: "map", variantClass: "device-home__mode-card--orange", action: "open", to: "/maze-mode" },
  { key: "snake"", name: "璐悆铔?", icon: "move"", variantClass: "device-home__mode-card--green"", action: "open"", to: "/snake-mode"" },"
  { key: "water_world"", name: "姘翠笘鐣?", icon: "layers"", variantClass: "device-home__mode-card--blue"", action: "open"", to: "/water-world"" },"
  { key: "planet_screensaver", name: "鏄熺悆灞忎繚", icon: "navigation", variantClass: "device-home__mode-card--slate", action: "open", to: "/planet-screensaver" },
  { key: "rick_morty_portal", name: "浼犻€侀棬", icon: "refresh", variantClass: "device-home__mode-card--mint", action: "open", to: "/rick-morty-portal" },
  { key: "terraria_clock", name: "娉版媺鐟炰簹鏃堕挓", icon: "layers", variantClass: "device-home__mode-card--copper", action: "open", to: "/terraria-clock" },
  { key: "adventure_island"", name: "鍐掗櫓宀?", icon: "navigation"", variantClass: "device-home__mode-card--orange"", action: "open"", to: "/adventure-island"" },"
  { key: "kof97", name: "鎷崇殗 97", icon: "modular", variantClass: "device-home__mode-card--copper", action: "open", to: "/kof97" },
  { key: "spongebob_clock", name: "娴风坏瀹濆疂鏃堕挓", icon: "time", variantClass: "device-home__mode-card--gold", action: "open", to: "/spongebob-clock" },
];

const isDeviceConnected = computed(() => deviceStore.connected === true);

const currentBusinessMode = computed(() => {
  if (typeof deviceStore.businessMode === "string") {
    return deviceStore.businessMode;
  }
  return "";
});

const currentBusinessModeText = computed(() => {
  if (currentBusinessMode.value.length > 0) {
    return currentBusinessMode.value;
  }
  return "--";
});

const brightnessText = computed(() => {
  if (typeof deviceStore.brightness === "number" && deviceStore.brightness >= 0) {
    return String(deviceStore.brightness);
  }
  return "--";
});

const boardSizeText = computed(() => {
  if (
    typeof deviceStore.width === "number" &&
    typeof deviceStore.height === "number" &&
    deviceStore.width > 0 &&
    deviceStore.height > 0
  ) {
    return `${deviceStore.width} 脳 ${deviceStore.height}`;
  }
  return "--";
});

const deviceHostText = computed(() => {
  if (typeof deviceStore.deviceIp === "string" && deviceStore.deviceIp.length > 0) {
    return deviceStore.deviceIp;
  }
  if (typeof deviceStore.host === "string" && deviceStore.host.length > 0) {
    return deviceStore.host;
  }
  return "--";
});

const surfaceErrorMessage = computed(() => {
  if (showConnectModal.value && connectErrorMessage.value.length > 0) {
    return "";
  }
  if (typeof deviceStore.error === "string" && deviceStore.error.length > 0) {
    return deviceStore.error;
  }
  return "";
});

watch(
  () => deviceStore.host,
  (value) => {
    if (typeof value === "string") {
      deviceHostValue.value = value;
    }
  },
  { immediate: true },
);

onMounted(async () => {
  deviceStore.init();

  if (!deviceStore.connected) {
    await deviceStore.restoreConnection();
  }

  if (deviceStore.connected) {
    try {
      await deviceStore.syncDeviceStatus();
    } catch (error) {
      // keep current cached state
    }
  }
});

function openConnectModal() {
  connectErrorMessage.value = "";
  if (typeof deviceStore.host === "string" && deviceStore.host.length > 0) {
    deviceHostValue.value = deviceStore.host;
  }
  showConnectModal.value = true;
}

async function handleConnectConfirm(ip) {
  const normalizedIp = String(ip).trim();

  if (normalizedIp.length === 0) {
    connectErrorMessage.value = "璇疯緭鍏ヨ澶?IP 鍦板潃";
    return;
  }

  connectErrorMessage.value = "";

  try {
    feedback.showBlocking("杩炴帴璁惧"", "姝ｅ湪寤虹珛 WebSocket 杩炴帴骞跺悓姝ヨ澶囩姸鎬併€?")";"
    await deviceStore.connect({
      host: normalizedIp,
      port: 80,
      secure: false,
    });
    await deviceStore.syncDeviceStatus();
    deviceHostValue.value = normalizedIp;
    showConnectModal.value = false;
    feedback.success("杩炴帴鎴愬姛"", "宸茬粡杩炴帴鍒?Glowxel PixelBoard銆?")";"
  } catch (error) {
    connectErrorMessage.value = resolveErrorMessage(error);
  } finally {
    feedback.hideBlocking();
  }
}

function handleConnectCancel() {
  connectErrorMessage.value = "";
}

function handleDisconnect() {
  deviceStore.disconnect();
  feedback.info("璁惧宸叉柇寮€"", "褰撳墠 WebSocket 杩炴帴宸茬粡鍏抽棴銆?")";"
}

async function handleModeSelect(entry) {
  // open 绫诲叆鍙? 鐩存帴璺冲埌瀵瑰簲缂栬緫椤?(璺?mobile 绔涔変竴鑷?
  // 缂栬緫椤靛唴閮ㄦ湁"鍙戦€?鍒囨崲"鎸夐挳, 鐪熸鍒囪澶囨ā寮忕敱缂栬緫椤佃礋璐?
  if (entry.action === "open" && typeof entry.to === "string" && entry.to.length > 0) {
    router.push(entry.to);
    return;
  }

  // switch 绫诲叆鍙?(eyes / planet_screensaver 绛夋棤涓撳睘缂栬緫椤?: 鐩存帴鍙?setMode
  if (!isDeviceConnected.value) {
    feedback.info("璇峰厛杩炴帴璁惧"", "杩炴帴鎴愬姛鍚庢墠鑳藉垏鎹㈣澶囨ā寮忋€?")";"
    return;
  }

  if (modeSwitchingKey.value.length > 0) {
    return;
  }

  modeSwitchingKey.value = entry.key;

  try {
    feedback.showBlocking("鍒囨崲妯″紡", `姝ｅ湪鎶婅澶囧垏鎹㈠埌 ${entry.name}銆俙);
    await deviceStore.setMode(entry.key);
    await deviceStore.syncDeviceStatus();
    feedback.success("鍒囨崲鎴愬姛", `宸插垏鎹㈠埌 ${entry.name}銆俙);
  } catch (error) {
    feedback.error("鍒囨崲澶辫触", resolveErrorMessage(error));
  } finally {
    feedback.hideBlocking();
    modeSwitchingKey.value = "";
  }
}

function resolveErrorMessage(error) {
  if (error instanceof Error && typeof error.message === "string" && error.message.length > 0) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const value = error.message;
    if (typeof value === "string" && value.length > 0) {
      return value;
    }
  }

  return "鎿嶄綔澶辫触锛岃绋嶅悗閲嶈瘯";
}
</script>

<style scoped>
.device-home {
  gap: 14px;
}

.device-home__summary {
  gap: 14px;
  padding: 20px;
  background: #ffffff;
}

.device-home__summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.device-home__status-pill {
  min-height: 36px;
  padding: 6px 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border: var(--glx-shell-border);
  background: #ffffff;
  box-shadow: var(--glx-shadow-soft);
  color: var(--nb-ink);
  font-size: 13px;
  font-weight: 900;
}

.device-home__summary-body {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: 16px;
  align-items: start;
}

.device-home__brand {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.device-home__brand-logo {
  width: 84px;
  height: 84px;
  padding: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  border: var(--glx-shell-border);
  background: #ffffff;
  box-shadow: var(--glx-shadow-soft);
}

.device-home__brand-logo-core {
  border: var(--glx-shell-border);
  background: var(--nb-blue);
}

.device-home__brand-logo-core--accent {
  background: var(--nb-yellow);
}

.device-home__brand-copy {
  display: grid;
  gap: 10px;
}

.device-home__title {
  color: var(--nb-ink);
  font-size: clamp(28px, 3vw, 36px);
  line-height: 1;
  font-weight: 900;
}

.device-home__desc {
  color: var(--nb-text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.device-home__inline-error {
  width: fit-content;
  max-width: 100%;
  padding: 8px 10px;
  border: var(--glx-shell-border);
  background: #ffe2e2;
  color: var(--nb-ink);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.6;
}

.device-home__metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.device-home__connect-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.device-home__entry-card,
.device-home__tool-card {
  min-height: 100px;
  padding: 14px 16px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  border: var(--glx-shell-border);
  background: #ffffff;
  box-shadow: var(--glx-shadow-soft);
  color: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.device-home__entry-card {
  width: 100%;
}

.device-home__entry-icon,
.device-home__tool-icon {
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: var(--glx-shell-border);
  box-shadow: var(--glx-shadow-soft);
  color: var(--nb-ink);
}

.device-home__entry-icon--paper {
  background: #ffffff;
}

.device-home__entry-icon--mint,
.device-home__tool-icon--green {
  background: #8fe0bc;
}

.device-home__tool-icon--yellow {
  background: var(--nb-yellow);
}

.device-home__tool-icon--cyan {
  background: #5cdfe8;
}

.device-home__tool-icon--teal {
  background: #52d0b1;
}

.device-home__tool-icon--purple {
  background: #ae91ff;
}

.device-home__tool-icon--pink {
  background: #ff8abd;
}

.device-home__tool-icon--orange {
  background: #ffb06d;
}

.device-home__tool-icon--indigo {
  background: #8ca2ff;
}

.device-home__tool-icon--azure {
  background: #8dc8ff;
}

.device-home__tool-icon--gold {
  background: #ffd36a;
}

.device-home__tool-icon--slate {
  background: #b3bfd6;
}

.device-home__tool-icon--blue {
  background: #74b9ff;
}

.device-home__entry-copy,
.device-home__tool-copy {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.device-home__entry-title,
.device-home__tool-title {
  color: var(--nb-ink);
  font-size: 14px;
  font-weight: 900;
}

.device-home__entry-desc,
.device-home__tool-desc {
  color: var(--nb-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.device-home__disconnect-entry {
  min-height: 48px;
  padding: 10px 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: fit-content;
  border: var(--glx-shell-border);
  background: #ffffff;
  box-shadow: var(--glx-shadow-soft);
  color: var(--nb-ink);
  font-size: 14px;
  font-weight: 900;
}

.device-home__tool-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.device-home__tool-card {
  grid-template-columns: auto minmax(0, 1fr) auto;
}

.device-home__tool-cta {
  color: var(--nb-ink);
  font-size: 11px;
  font-weight: 900;
  white-space: nowrap;
}

.device-home__mode-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.device-home__directory-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.device-home__mode-card {
  min-height: 132px;
  padding: 14px 10px 12px;
  display: grid;
  justify-items: center;
  align-content: start;
  gap: 10px;
  border: var(--glx-shell-border);
  background: #ffffff;
  box-shadow: var(--glx-shadow-soft);
  color: var(--nb-ink);
  text-align: center;
  cursor: pointer;
}

.device-home__mode-card[disabled] {
  cursor: wait;
}

.device-home__mode-icon-shell {
  width: 68px;
  height: 68px;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--glx-shell-border);
  background: #ffffff;
}

.device-home__mode-icon-core {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--glx-shell-border);
  background: var(--device-home-mode-accent);
  color: var(--nb-ink);
}

.device-home__mode-name {
  color: var(--nb-ink);
  font-size: 13px;
  line-height: 1.3;
  font-weight: 900;
}

.device-home__mode-meta {
  color: var(--nb-text-secondary);
  font-size: 11px;
  font-weight: 800;
}

.device-home__section-note {
  color: var(--nb-text-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.device-home__mode-card.is-active {
  background: #fff8d8;
}

.device-home__mode-card.is-pending {
  background: #f4f4f4;
}

.device-home__mode-card--pink {
  --device-home-mode-accent: #ff8abd;
}

.device-home__mode-card--cyan {
  --device-home-mode-accent: #5cdfe8;
}

.device-home__mode-card--teal {
  --device-home-mode-accent: #52d0b1;
}

.device-home__mode-card--purple {
  --device-home-mode-accent: #ae91ff;
}

.device-home__mode-card--indigo {
  --device-home-mode-accent: #8ca2ff;
}

.device-home__mode-card--gold {
  --device-home-mode-accent: #ffd36a;
}

.device-home__mode-card--orange {
  --device-home-mode-accent: #ffb06d;
}

.device-home__mode-card--green {
  --device-home-mode-accent: #8fe0bc;
}

.device-home__mode-card--azure {
  --device-home-mode-accent: #8dc8ff;
}

.device-home__mode-card--slate {
  --device-home-mode-accent: #b3bfd6;
}

.device-home__mode-card--lime {
  --device-home-mode-accent: #c8e36a;
}

.device-home__mode-card--rose {
  --device-home-mode-accent: #ffa3b8;
}

.device-home__mode-card--blue {
  --device-home-mode-accent: #7fb6ff;
}

.device-home__mode-card--mint {
  --device-home-mode-accent: #74e0c2;
}

.device-home__mode-card--copper {
  --device-home-mode-accent: #d99b6a;
}

.device-home__mode-card--moss {
  --device-home-mode-accent: #8fbf76;
}

@media (max-width: 1280px) {
  .device-home__summary-body {
    grid-template-columns: 1fr;
  }

  .device-home__mode-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .device-home__directory-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .device-home__connect-grid,
  .device-home__tool-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .device-home__mode-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .device-home__directory-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .device-home__summary {
    padding: 20px;
  }

  .device-home__brand {
    grid-template-columns: 1fr;
  }

  .device-home__brand-logo {
    width: 84px;
    height: 84px;
  }

  .device-home__metrics {
    grid-template-columns: 1fr;
  }

  .device-home__directory-grid,
  .device-home__mode-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .device-home__mode-card {
    min-height: 158px;
  }

  .device-home__mode-icon-shell {
    width: 80px;
    height: 80px;
  }
}
</style>
