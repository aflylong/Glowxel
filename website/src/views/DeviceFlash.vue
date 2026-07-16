<template>
  <div class="glx-page-shell device-flash-page">
    <section class="glx-page-shell__hero">
      <h1 class="glx-page-shell__title">璁惧鐑у綍</h1>
      <p class="glx-page-shell__desc">
        閫氳繃娴忚鍣ㄨ繛鎺?Glowxel PixelBoard 鐨?USB 涓插彛骞跺啓鍏ュ浐浠躲€傝繖閲岃蛋鐨勬槸 USB
        鏁版嵁绾匡紝
      </p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">杩炴帴鏂瑰紡</span>
          <strong class="glx-hero-metric__value">USB 涓插彛</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鎺ㄨ崘娴忚鍣?</span>
          <strong class="glx-hero-metric__value">Chrome / Edge</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">椤甸潰鐜</span>
          <strong class="glx-hero-metric__value">HTTPS / localhost</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">璁惧鎺у埗杩炴帴</span>
          <strong class="glx-hero-metric__value">涓嶉渶瑕?WS</strong>
        </article>
      </div>
      <div class="glx-inline-actions">
        <router-link to="/device-control" class="glx-button glx-button--ghost"
          >杩斿洖璁惧鎺у埗</router-link
        >
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <DeviceParamsSection
        title="寮€濮嬬儳褰?"
        meta="USB Web Serial"
        description="杩炴帴璁惧 USB 鏁版嵁绾垮悗鐐瑰嚮鎸夐挳锛屾祻瑙堝櫒浼氬脊鍑轰覆鍙ｉ€夋嫨绐楀彛銆?"
      >
        <div class="device-flash-page__install-box">
          <esp-web-install-button :manifest="manifestPath">
            <button
              slot="activate"
              class="glx-button glx-button--primary device-flash-page__install-button"
              type="button"
            >
              杩炴帴 USB 骞跺紑濮嬬儳褰?            </button>
            <div slot="unsupported" class="device-flash-page__tip-box">
              褰撳墠娴忚鍣ㄤ笉鏀寔 Web Serial锛岃鎹㈢敤 Chrome 鎴?Edge 妗岄潰鐗堛€?            </div>
            <div slot="not-allowed" class="device-flash-page__tip-box">
              褰撳墠椤甸潰涓嶆槸瀹夊叏涓婁笅鏂囷紝璇蜂娇鐢?HTTPS 鎴?localhost銆?            </div>
          </esp-web-install-button>
        </div>
        <div class="device-flash-page__tip-box">
          濡傛灉娴忚鍣ㄦ病鏈夊脊鍑轰覆鍙ｉ€夋嫨绐楀彛锛屽厛妫€鏌?USB
          鏁版嵁绾裤€佷覆鍙ｉ┍鍔ㄥ拰椤甸潰瀹夊叏鐜銆?        </div>
      </DeviceParamsSection>

      <DeviceParamsSection
        title="鐑у綍鍓嶇‘璁?"
        meta="鍑忓皯澶辫触鐜?"
        description="杩欎簺妫€鏌ュ彧閽堝 USB 涓插彛鐑у綍锛屼笉娑夊強璁惧 WiFi 鎴?WebSocket銆?"
      >
        <ul class="device-flash-page__checklist">
          <li>浣跨敤鍙互浼犺緭鏁版嵁鐨?USB 绾匡紝涓嶈浣跨敤鍙兘鍏呯數鐨勭嚎銆?/li>
          <li>纭绯荤粺宸茬粡瀹夎 CH340 / CP2102 绛夊搴斾覆鍙ｉ┍鍔ㄣ€?/li>
          <li>鍏抽棴涓插彛鐩戣鍣ㄣ€丳latformIO 涓婁紶绐楀彛绛夊崰鐢ㄧ鍙ｇ殑绋嬪簭銆?/li>
          <li>濡傛灉杩炴帴澶辫触锛屽彲浠ユ寜浣?BOOT 鍚庡啀鐐瑰嚮杩炴帴锛屽紑濮嬪啓鍏ュ悗鏉惧紑銆?/li>
        </ul>
      </DeviceParamsSection>
    </section>

    <section class="glx-grid glx-grid--two">
      <DeviceParamsSection
        title="寮圭獥鑻辨枃瀵圭収"
        meta="绗笁鏂规帶浠?"
        description="ESP Web Tools 鐨勭郴缁熷脊绐楁殏鏃朵笉鑳藉畬鍏ㄦ敼鎴愪腑鏂囷紝椤甸潰鍏堟彁渚涙搷浣滃鐓с€?"
      >
        <div class="device-flash-page__guide-grid">
          <span>Connect / Select Port</span>
          <strong>閫夋嫨璁惧涓插彛</strong>
          <span>Install / Next</span>
          <strong>缁х画涓嬩竴姝?</strong>
          <span>Installing</span>
          <strong>姝ｅ湪鍐欏叆绋嬪簭锛屼笉瑕佹嫈绾?</strong>
          <span>Done / Finish</span>
          <strong>鐑у綍瀹屾垚锛岀瓑寰呰澶囬噸鍚?</strong>
        </div>
      </DeviceParamsSection>

      <DeviceParamsSection
        title="瀹屾垚鍚?"
        meta="閲嶆柊杩炴帴璁惧"
        description="鐑у綍瀹屾垚鍚庤澶囦細閲嶅惎銆傜瓑灞忓箷鎭㈠鏄剧ず鎴栬澶囬噸鏂拌仈缃戝悗锛屽啀鍥炲埌璁惧鎺у埗椤佃繛鎺ヨ澶囥€?"
      >
        <div class="device-flash-page__action-row">
          <router-link
            to="/device-control"
            class="glx-button glx-button--primary"
            >鍥炲埌璁惧鎺у埗</router-link
          >
          <router-link to="/ble-config" class="glx-button glx-button--ghost"
            >闇€瑕佹椂閲嶆柊閰嶇綉</router-link
          >
        </div>
      </DeviceParamsSection>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import DeviceParamsSection from "@/components/device/params/DeviceParamsSection.vue";

const manifestPath = "/firmware/esp32/manifest.json";
const espWebToolsScript =
  "https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module";

onMounted(() => {
  if (
    typeof window === "undefined" ||
    customElements.get("esp-web-install-button")
  ) {
    return;
  }
  const script = document.createElement("script");
  script.type = "module";
  script.src = espWebToolsScript;
  document.head.appendChild(script);
});
</script>

<style scoped>
.device-flash-page {
  gap: 18px;
}

.device-flash-page__install-box {
  min-height: 132px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border: var(--glx-shell-border);
  background: #ffffff;
}

.device-flash-page__install-button {
  min-height: 48px;
}

.device-flash-page__tip-box {
  padding: 14px 16px;
  border: var(--glx-shell-border);
  background: #fff6d1;
  color: var(--nb-ink);
  font-size: 13px;
  line-height: 1.7;
  font-weight: 700;
}

.device-flash-page__checklist {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.device-flash-page__checklist li {
  padding: 13px 14px;
  border: var(--glx-shell-border);
  background: #ffffff;
  color: var(--nb-ink);
  font-size: 13px;
  line-height: 1.7;
  font-weight: 700;
}

.device-flash-page__guide-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr);
  gap: 10px;
}

.device-flash-page__guide-grid span,
.device-flash-page__guide-grid strong {
  padding: 12px;
  border: var(--glx-shell-border);
  background: #ffffff;
  font-size: 13px;
  line-height: 1.5;
}

.device-flash-page__guide-grid span {
  color: var(--nb-text-secondary);
  font-weight: 800;
}

.device-flash-page__guide-grid strong {
  color: var(--nb-ink);
  font-weight: 900;
}

.device-flash-page__action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

esp-web-install-button {
  --esp-tools-button-color: var(--nb-yellow);
  --esp-tools-button-text-color: var(--nb-ink);
}

@media (max-width: 980px) {
  .device-flash-page :deep(.glx-grid--two) {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 620px) {
  .device-flash-page__guide-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
