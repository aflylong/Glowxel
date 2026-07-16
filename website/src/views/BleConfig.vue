<template>
  <div class="glx-page-shell ble-config-page">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">WiFi Setup</span>
      <h1 class="glx-page-shell__title">鐑偣閰嶇綉</h1>
      <p class="glx-page-shell__desc">
        缃戠珯绔繖閲屽鍒诲皬绋嬪簭鐑偣閰嶇綉椤电殑姝ｅ紡寮曞锛屼笉寮曞叆鏂扮殑娴忚鍣?BLE 渚濊禆銆傝澶囬娆¤仈缃戝拰閲嶇疆缃戠粶鍚庣殑鍥炶繛锛岄兘璧拌澶囩儹鐐瑰姞鏈湴闂ㄦ埛杩欐潯涓婚摼銆?      </p>
      <div class="glx-inline-actions">
        <a
          href="http://192.168.4.1"
          target="_blank"
          rel="noreferrer"
          class="glx-button glx-button--primary"
        >
          鎵撳紑 192.168.4.1
        </a>
        <router-link to="/device-control" class="glx-button glx-button--ghost">鍥炲埌璁惧鎺у埗</router-link>
      </div>
    </section>

    <section class="glx-grid glx-grid--three">
      <DeviceSetupStep
        step="1"
        title="杩炴帴璁惧鐑偣"
        description="鍦ㄧ郴缁?WiFi 鍒楄〃閲岄€夋嫨 Glowxel PixelBoard-璁惧搴忓垪鍙凤紝鍏堟妸褰撳墠缃戠粶鍒囧埌璁惧鐑偣銆?"
      />
      <DeviceSetupStep
        step="2"
        title="鎵撳紑 192.168.4.1"
        description="杩涘叆閰嶇綉椤靛悗鍙换閫変竴绉嶅啓娉曪紝鎶婂搴?2.4GHz WiFi 淇℃伅浜ょ粰璁惧銆?"
        :options="portalOptions"
      />
      <DeviceSetupStep
        step="3"
        title="杈撳叆瀵嗙爜骞朵繚瀛?"
        description="鍙敮鎸?2.4GHz锛屼繚瀛樺悗璁惧浼氳嚜鍔ㄩ噸鍚€?"
        note="鎴愬姛鍚庣湅灞忓箷涓婄殑鏂?IP锛涘け璐ヤ細鍥炲埌鐑偣妯″紡銆?"
      />
    </section>

    <section class="glx-grid glx-grid--two">
      <DeviceParamsSection
        title="閰嶇綉鍓嶆鏌?"
        meta="杩涘叆闂ㄦ埛鍓?"
        description="鍏堢‘璁ら摼璺珯鍦ㄦ纭綅缃紝鍐嶆墦寮€鏈湴闂ㄦ埛銆傝繖鏍疯兘閬垮厤鎶婃祻瑙堝櫒閿欒椤佃璁ゆ垚璁惧闂ㄦ埛銆?"
      >
        <div class="glx-stack">
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鍏堣繛璁惧鐑偣</strong>
              <span class="glx-list-card__desc">涓嶈璺宠繃鐑偣杩炴帴鐩存帴鐚滄祴闂ㄦ埛鍦板潃锛屼富璺緞鍥哄畾浠庤澶囩儹鐐瑰紑濮嬨€?</span>
            </div>
          </div>
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鍥哄畾闂ㄦ埛鍦板潃</strong>
              <span class="glx-list-card__desc">闂ㄦ埛鍦板潃鍥哄畾涓?<code>192.168.4.1</code>锛屽綋鍓嶉〉闈笉棰濆鎺ュ叆 BLE銆?</span>
            </div>
          </div>
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鍙敮鎸?2.4GHz</strong>
              <span class="glx-list-card__desc">濡傛灉瀹堕噷璺敱鍣ㄥ綋鍓嶆槸 5GHz-only锛岃澶囦笉浼氬湪杩欎竴姝ュ畬鎴愯仈缃戙€?</span>
            </div>
          </div>
        </div>
      </DeviceParamsSection>

      <DeviceParamsSection
        title="閰嶇綉鍚庡垽鏂?"
        meta="淇濆瓨骞堕噸鍚悗"
        description="淇濆瓨鍚庝笉瑕佸仠鍦ㄦ棫鐑偣椤甸潰锛屾寜灞忓箷缁撴灉鍒ゆ柇璁惧鏄惁鐪熺殑鍥炲埌灞€鍩熺綉銆?"
      >
        <div class="glx-stack">
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鎴愬姛鏍囧織</strong>
              <span class="glx-list-card__desc">鐪嬪睆骞曚笂鐨勬柊 IP锛岃鏄庤澶囧凡缁忓洖鍒板眬鍩熺綉锛屽彲浠ュ洖璁惧鎺у埗椤甸噸鏂拌繛鎺ャ€?</span>
            </div>
          </div>
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">澶辫触鏍囧織</strong>
              <span class="glx-list-card__desc">濡傛灉鑱旂綉澶辫触锛岃澶囦細鍥炲埌鐑偣妯″紡锛岃繖鏃剁户缁繛鐑偣骞堕噸鏂版墦寮€闂ㄦ埛鍗冲彲銆?</span>
            </div>
          </div>
          <div class="glx-list-card">
            <div class="glx-list-card__copy">
              <strong class="glx-list-card__title">鍚庣画鍔ㄤ綔</strong>
              <span class="glx-list-card__desc">鍥炲埌璁惧鎺у埗椤靛苟鍒锋柊鐘舵€侊紝纭璁惧鍦板潃鍜屾ā寮忓洖鏄惧凡缁忔仮澶嶃€?</span>
            </div>
          </div>
        </div>
      </DeviceParamsSection>
    </section>

    <DeviceParamsSection
      title="姝ｅ紡涓婚摼"
      meta="鍥哄畾姝ラ"
      description="杩欓〉鍙礋璐ｆ妸灏忕▼搴忔寮忛厤缃戞枃妗堝拰鑺傚鎼埌缃戠珯绔紝涓嶅崟鐙€犲彟涓€濂楁祻瑙堝櫒閰嶇綉娴佺▼銆?"
    >
      <div class="ble-config-page__chain">
        <div class="ble-config-page__chain-item">
          <span class="ble-config-page__chain-index">A</span>
          <div class="ble-config-page__chain-copy">
            <strong>绯荤粺鍏堝垏鍒拌澶囩儹鐐?</strong>
            <span>褰撳墠鐢佃剳鎴栨墜鏈哄鏋滄病杩炰笂璁惧鐑偣锛?code>192.168.4.1</code> 涓嶄細鎵撳紑姝ｇ‘闂ㄦ埛銆?</span>
          </div>
        </div>
        <div class="ble-config-page__chain-item">
          <span class="ble-config-page__chain-index">B</span>
          <div class="ble-config-page__chain-copy">
            <strong>闂ㄦ埛閲屽啓鍏ュ搴?WiFi</strong>
            <span>鍙互鎵弿鍚庣洿鎺ラ€夋嫨锛屼篃鍙互鎵嬪姩杈撳叆 WiFi 鍚嶇О锛屾渶缁堥兘瑕佽緭鍏ュ瘑鐮佸苟淇濆瓨銆?</span>
          </div>
        </div>
        <div class="ble-config-page__chain-item">
          <span class="ble-config-page__chain-index">C</span>
          <div class="ble-config-page__chain-copy">
            <strong>閲嶅惎鍚庡洖璁惧鎺у埗椤?</strong>
            <span>璁惧鎷垮埌鏂?IP 鍚庯紝鍐嶅洖缃戠珯绔澶囨帶鍒堕〉閲嶆柊杩炴帴锛屼笉鍦ㄨ繖椤靛仛棰濆鐘舵€佺寽娴嬨€?</span>
          </div>
        </div>
      </div>
    </DeviceParamsSection>
  </div>
</template>

<script setup>
import DeviceParamsSection from "@/components/device/params/DeviceParamsSection.vue";
import DeviceSetupStep from "@/components/device/params/DeviceSetupStep.vue";

const portalOptions = [
  "鎵弿鍚庣洿鎺ラ€夋嫨 WiFi",
  "鎵嬪姩杈撳叆 WiFi 鍚嶇О",
];
</script>

<style scoped>
.ble-config-page {
  gap: 20px;
}

.ble-config-page code {
  padding: 2px 6px;
  border: var(--glx-shell-border);
  background: #ffffff;
  color: var(--nb-ink);
  font-size: 0.92em;
  font-weight: 800;
}

.ble-config-page__chain {
  display: grid;
  gap: 12px;
}

.ble-config-page__chain-item {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 14px;
  align-items: flex-start;
  padding: 16px;
  border: var(--glx-shell-border);
  background: #ffffff;
}

.ble-config-page__chain-index {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: var(--glx-shell-border);
  background: var(--nb-yellow);
  color: var(--nb-ink);
  font-size: 18px;
  font-weight: 900;
}

.ble-config-page__chain-copy {
  display: grid;
  gap: 4px;
}

.ble-config-page__chain-copy strong {
  color: var(--nb-ink);
  font-size: 15px;
  font-weight: 900;
}

.ble-config-page__chain-copy span {
  color: var(--nb-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 1080px) {
  .ble-config-page :deep(.glx-grid--three) {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 920px) {
  .ble-config-page :deep(.glx-grid--two) {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
