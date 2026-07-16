<template>
  <div class="glx-page-shell device-params-page">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Device Params</span>
      <h1 class="glx-page-shell__title">璁惧鍙傛暟</h1>
      <p class="glx-page-shell__desc">
        杩欓噷閫氳繃缁熶竴璁惧閫氫俊搴曞骇璇诲彇鍜屽啓鍥炶澶囧弬鏁般€傚瓧娈靛垎缁勩€佽竟鐣屽€煎拰淇濆瓨閾捐矾璺熷皬绋嬪簭璁惧鍙傛暟椤典繚鎸佸悓涓€鏉′富绾匡紝浜害涓婇檺鍥哄畾涓?178銆?
      </p>
      <div class="glx-hero-metrics">
        <div class="glx-hero-metric">
          <span class="glx-hero-metric__label">褰撳墠璁惧鍦板潃</span>
          <strong class="glx-hero-metric__value device-params-page__metric">{{ deviceHostText }}</strong>
        </div>
        <div class="glx-hero-metric">
          <span class="glx-hero-metric__label">褰撳墠 WiFi</span>
          <strong class="glx-hero-metric__value device-params-page__metric">{{ wifiSsidText }}</strong>
        </div>
        <div class="glx-hero-metric">
          <span class="glx-hero-metric__label">鍥轰欢鐗堟湰</span>
          <strong class="glx-hero-metric__value device-params-page__metric">{{ firmwareVersionText }}</strong>
        </div>
        <div class="glx-hero-metric">
          <span class="glx-hero-metric__label">杩愯鏃堕暱</span>
          <strong class="glx-hero-metric__value device-params-page__metric">{{ uptimeText }}</strong>
        </div>
      </div>
      <div class="glx-inline-actions">
        <router-link to="/device-control" class="glx-button glx-button--ghost">杩斿洖璁惧鎺у埗</router-link>
        <button
          type="button"
          class="glx-button glx-button--primary"
          :disabled="loadingParams || saving"
          @click="reloadParams"
        >
          {{ loadingParams ? "璇诲彇涓?.." : "閲嶆柊璇诲彇" }}
        </button>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <DeviceParamsSection
        title="鐗规畩LED"
        meta="鏃嬭浆銆佽壊褰┿€佸弽杞浉浣?"
        description="鐢婚潰渚х潃銆侀鑹蹭笉瀵广€佹畫褰卞垎瑁傛垨宸﹀彸閿欎綅鏃讹紝浼樺厛妫€鏌ヨ繖涓€缁勩€?"
      >
        <DeviceParamsField label="鏃嬭浆" description="鐢婚潰渚х潃鏃跺湪杩欓噷鍒囨崲銆?">"
          <select v-model.number="params.displayRotation" class="glx-select">
            <option
              v-for="option in rotationOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </DeviceParamsField>
        <DeviceParamsField label="鑹插僵" description="棰滆壊涓嶅鏃跺湪杩欓噷鍒囨崲銆?">"
          <select v-model="colorOrderValue" class="glx-select">
            <option
              v-for="option in colorOrderOptions"
              :key="option.label"
              :value="option.label"
            >
              {{ option.label }}
            </option>
          </select>
        </DeviceParamsField>
        <DeviceParamsField label="鍙嶈浆鐩镐綅" description="娈嬪奖銆佸垎瑁傘€佸乏鍙抽敊浣嶆椂鍒囨崲銆?">"
          <select v-model="clkPhaseValue" class="glx-select">
            <option value="0">鍏抽棴</option>
            <option value="1">寮€鍚?/option>
          </select>
        </DeviceParamsField>
      </DeviceParamsSection>

      <DeviceParamsSection
        title="璁惧淇℃伅"
        meta="鍙"
        description="鍙睍绀鸿澶囧綋鍓嶅洖璇诲€硷紝涓嶅湪杩欓噷鍋氭湰鍦扮寽娴嬫垨缂撳瓨鏀瑰啓銆?"
      >
        <DeviceParamsField label="褰撳墠璁惧鍦板潃" description="褰撳墠宸茶繛鎺ヨ澶囦富鏈哄湴鍧€銆?">"
          <span class="device-params-page__value-box">{{ deviceHostText }}</span>
        </DeviceParamsField>
        <DeviceParamsField label="鍥轰欢鐗堟湰" description="褰撳墠鍥轰欢鐗堟湰鍥炴樉銆?">"
          <span class="device-params-page__value-box">{{ firmwareVersionText }}</span>
        </DeviceParamsField>
        <DeviceParamsField label="杩愯鏃堕暱" description="璁惧宸茶繍琛屾椂闀裤€?">"
          <span class="device-params-page__value-box">{{ uptimeText }}</span>
        </DeviceParamsField>
        <DeviceParamsField label="褰撳墠 WiFi" description="璁惧褰撳墠宸茶繛鎺?WiFi銆?">"
          <span class="device-params-page__value-box">{{ wifiSsidText }}</span>
        </DeviceParamsField>
      </DeviceParamsSection>
    </section>

    <section class="glx-grid glx-grid--two">
      <DeviceParamsSection
        title="鏃ュ浜害"
        meta="0 - 178"
        description="璁惧甯歌浜害銆佹棩闂翠寒搴︺€佸闂翠寒搴﹂兘鎸?0 鍒?178 涓嬪彂銆?"
      >
        <DeviceBrightnessField
          v-model="params.displayBright"
          label="褰撳墠浜害"
          description="璁惧甯歌鏄剧ず浜害锛岃寖鍥?0-178銆?"
          :max="UI_BRIGHTNESS_MAX"
        />
        <DeviceBrightnessField
          v-model="params.brightnessDay"
          label="鏃ラ棿浜害"
          description="鐧藉ぉ鑷姩浜害锛岃寖鍥?0-178銆?"
          :max="UI_BRIGHTNESS_MAX"
        />
        <DeviceBrightnessField
          v-model="params.brightnessNight"
          label="澶滈棿浜害"
          description="澶滈棿鑷姩浜害锛岃寖鍥?0-178銆?"
          :max="UI_BRIGHTNESS_MAX"
        />
        <DeviceParamsField label="澶滈棿寮€濮嬫椂闂? description="澶滈棿寮€濮嬫椂闂淬€?>
          <input v-model="params.nightStart" class="glx-input" type="time" />
        </DeviceParamsField>
        <DeviceParamsField label="澶滈棿缁撴潫鏃堕棿" description="澶滈棿缁撴潫鏃堕棿銆?">"
          <input v-model="params.nightEnd" class="glx-input" type="time" />
        </DeviceParamsField>
        <div class="device-params-page__tip-box">
          鍙湁褰撴棩闂翠寒搴﹀拰澶滈棿浜害璁剧疆鎴愪笉鍚屾暟鍊兼椂锛岃澶囨墠浼氭寜鏃堕棿鑷姩鍒囨崲銆?
        </div>
      </DeviceParamsSection>

      <DeviceParamsSection
        title="椹卞姩鍙傛暟"
        meta="闈㈡澘椹卞姩鐩稿叧閰嶇疆"
        description="杩欑粍鍊兼寜鍥轰欢鍚堝悓閫愰」鍥炲啓锛岄€傚悎鍋氶┍鍔ㄨ姱鐗囥€両2S 閫熷害鍜?E 寮曡剼鏍″噯銆?"
      >
        <DeviceParamsField label="椹卞姩鑺墖" description="鎸夎澶囧綋鍓?driver 鍙傛暟鍥炴樉銆?">"
          <select v-model.number="params.driver" class="glx-select">
            <option
              v-for="option in driverOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </DeviceParamsField>
        <DeviceParamsField label="I2S 閫熷害" description="鎸夎澶囧綋鍓?i2cSpeed 鍙傛暟鍥炴樉銆?">"
          <select v-model.number="params.i2cSpeed" class="glx-select">
            <option
              v-for="option in speedOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </DeviceParamsField>
        <DeviceParamsField label="E 寮曡剼" description="鎸夎澶囧綋鍓?E_pin 鍙傛暟鍥炴樉銆?">"
          <input
            v-model.number="params.E_pin"
            class="glx-input"
            type="number"
            min="0"
            max="32"
            step="1"
          />
        </DeviceParamsField>
      </DeviceParamsSection>
    </section>

    <section class="glx-grid glx-grid--two">
      <DeviceParamsSection
        title="缃戠粶鍙傛暟"
        meta="鍥藉唴浼樺厛 NTP"
        description="榛樿浼樺厛鍥藉唴鍙敤鏃堕棿鏈嶅姟鍣紱濡傛灉榛樿鍦板潃鎱㈡垨涓嶅彲鐢紝鍙互鎵嬪姩濉啓銆?"
      >
        <DeviceParamsField label="鏃堕棿鏈嶅姟鍣ㄩ璁? description="榛樿浼樺厛鍥藉唴鍙敤鍦板潃銆?>
          <select v-model="ntpPresetValue" class="glx-select">
            <option
              v-for="option in ntpPresetOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </DeviceParamsField>
        <DeviceParamsField
          label="鑷畾涔夋椂闂存湇鍔″櫒"
          description="濡傛灉榛樿鍦板潃鎱㈡垨涓嶅彲鐢紝鍙互鎵嬪姩濉啓銆?"
          :stack="true"
        >
          <input
            v-model.trim="params.ntpServer"
            class="glx-input"
            type="text"
            maxlength="63"
            placeholder="渚嬪 ntp2.aliyun.com"
          />
        </DeviceParamsField>
      </DeviceParamsSection>

      <DeviceParamsSection
        title="搴旂敤鎿嶄綔"
        meta="閫愰」涓嬪彂鍒拌澶?"
        description="淇濆瓨鏃朵細鎸夊弬鏁板彉鏇撮€愰」璋冪敤缁熶竴鍙傛暟鍐欏叆閾捐矾锛屽啓瀹屽悗閲嶆柊鍥炶涓€閬嶇‘璁よ澶囧疄闄呭€笺€?"
      >
        <div class="device-params-page__action-stack">
          <DeviceActionCard
            mark="AP"
            title="淇濆瓨骞跺簲鐢?"
            description="鎶婂綋鍓嶅弬鏁板啓鍏ヨ澶囧苟绔嬪嵆鐢熸晥銆?"
            tone="primary"
            :disabled="saving || loadingParams"
            @trigger="saveParams"
          />
          <DeviceActionCard
            mark="RD"
            title="閲嶆柊璇诲彇"
            description="浠庤澶囨媺鍙栧綋鍓嶅疄闄呭弬鏁般€?"
            tone="accent"
            :disabled="saving || loadingParams"
            @trigger="reloadParams"
          />
        </div>
      </DeviceParamsSection>
    </section>

    <DeviceParamsSection
      title="楂樼骇"
      meta="鍗遍櫓鎿嶄綔璇疯皑鎱?"
      description="娓呴櫎 WiFi 閰嶇疆鍚庤澶囦細鑷姩閲嶅惎锛岄殢鍚庨渶瑕佸洖鍒扮儹鐐归厤缃戦〉閲嶆柊閰嶇綉銆?"
    >
      <div class="device-params-page__action-stack">
        <DeviceActionCard
          mark="RST"
          title="閲嶇疆缃戠粶"
          description="娓呴櫎 WiFi 閰嶇疆骞惰嚜鍔ㄩ噸鍚澶囥€?"
          tone="danger"
          :disabled="saving || loadingParams"
          @trigger="openResetConfirm"
        />
      </div>
      <div v-if="showResetConfirm" class="device-params-page__confirm-box">
        <div class="device-params-page__confirm-copy">
          <strong class="device-params-page__confirm-title">纭瑕侀噸缃綉缁滃悧锛?</strong>
          <p class="device-params-page__confirm-desc">
            璁惧浼氭竻闄ゅ綋鍓?WiFi 閰嶇疆骞惰嚜鍔ㄩ噸鍚€傞噸鍚悗鐑偣浼氶噸鏂板嚭鐜帮紝浣犻渶瑕佸洖鍒扮儹鐐归厤缃戦〉閲嶆柊閰嶇綉銆?
          </p>
        </div>
        <div class="glx-inline-actions">
          <button
            type="button"
            class="glx-button glx-button--ghost"
            :disabled="saving || loadingParams"
            @click="cancelResetConfirm"
          >
            鍏堜笉閲嶇疆
          </button>
          <button
            type="button"
            class="glx-button glx-button--danger"
            :disabled="saving || loadingParams"
            @click="resetWifi"
          >
            纭閲嶇疆
          </button>
        </div>
      </div>
    </DeviceParamsSection>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import DeviceActionCard from "@/components/device/params/DeviceActionCard.vue";
import DeviceBrightnessField from "@/components/device/params/DeviceBrightnessField.vue";
import DeviceParamsField from "@/components/device/params/DeviceParamsField.vue";
import DeviceParamsSection from "@/components/device/params/DeviceParamsSection.vue";
import { useFeedback } from "@/composables/useFeedback.js";
import { useDeviceLegacyStore } from "@/stores/deviceLegacy.js";

const UI_BRIGHTNESS_MAX = 178;

const driverOptions = [
  { label: "SHIFTREG", value: 0 },
  { label: "FM6124", value: 1 },
  { label: "FM6126A", value: 2 },
  { label: "ICN2038S", value: 3 },
  { label: "MBI5124", value: 4 },
  { label: "DP3246", value: 5 },
];

const speedOptions = [
  { label: "HZ_8M", value: 8000000 },
  { label: "HZ_16M", value: 16000000 },
  { label: "HZ_20M", value: 20000000 },
];

const rotationOptions = [
  { label: "0掳", value: 0 },
  { label: "90掳", value: 1 },
  { label: "180掳", value: 2 },
  { label: "270掳", value: 3 },
];

const colorOrderOptions = [
  { label: "RGB", swapBlueGreen: false, swapBlueRed: false },
  { label: "RBG", swapBlueGreen: true, swapBlueRed: false },
  { label: "GBR", swapBlueGreen: false, swapBlueRed: true },
];

const ntpPresetOptions = [
  { label: "闃块噷浜?2", value: "ntp2.aliyun.com" },
  { label: "闃块噷浜?", value: "ntp.aliyun.com"" },"
  { label: "鑵捐浜?", value: "ntp.tencent.com"" },"
  { label: "鍥藉鎺堟椂涓績", value: "ntp.ntsc.ac.cn" },
  { label: "鑷畾涔?", value: "__custom__"" },"
];

const router = useRouter();
const deviceStore = useDeviceLegacyStore();
const feedback = useFeedback();

const saving = ref(false);
const loadingParams = ref(false);
const showResetConfirm = ref(false);
const snapshot = ref(null);
const deviceHost = ref("");
const info = ref({
  firmwareVersion: "",
  wifiSsid: "",
  uptime: 0,
});

const params = reactive({
  displayBright: 50,
  brightnessDay: 50,
  brightnessNight: 50,
  displayRotation: 0,
  swapBlueGreen: false,
  swapBlueRed: false,
  clkphase: false,
  driver: 0,
  i2cSpeed: 8000000,
  E_pin: 18,
  ntpServer: "ntp2.aliyun.com",
  nightStart: "22:00",
  nightEnd: "07:00",
});

const firmwareVersionText = computed(() => {
  if (typeof info.value.firmwareVersion === "string" && info.value.firmwareVersion.length > 0) {
    return info.value.firmwareVersion;
  }
  return "--";
});

const wifiSsidText = computed(() => {
  if (typeof info.value.wifiSsid === "string" && info.value.wifiSsid.length > 0) {
    return info.value.wifiSsid;
  }
  return "鏈繛鎺?";"
});

const deviceHostText = computed(() => {
  if (typeof deviceHost.value === "string" && deviceHost.value.length > 0) {
    return deviceHost.value;
  }
  return "--";
});

const uptimeText = computed(() => {
  if (typeof info.value.uptime !== "number") {
    return "--";
  }
  const totalSeconds = info.value.uptime;
  if (totalSeconds <= 0) {
    return "--";
  }
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) {
    return `${days}澶?${hours}灏忔椂 ${minutes}鍒哷;
  }
  if (hours > 0) {
    return `${hours}灏忔椂 ${minutes}鍒哷;
  }
  return `${minutes}鍒哷;
});

const colorOrderValue = computed({
  get() {
    for (const option of colorOrderOptions) {
      if (
        option.swapBlueGreen === params.swapBlueGreen &&
        option.swapBlueRed === params.swapBlueRed
      ) {
        return option.label;
      }
    }
    return colorOrderOptions[0].label;
  },
  set(value) {
    for (const option of colorOrderOptions) {
      if (option.label !== value) {
        continue;
      }
      params.swapBlueGreen = option.swapBlueGreen;
      params.swapBlueRed = option.swapBlueRed;
      return;
    }
  },
});

const clkPhaseValue = computed({
  get() {
    if (params.clkphase) {
      return "1";
    }
    return "0";
  },
  set(value) {
    params.clkphase = value === "1";
  },
});

const ntpPresetValue = computed({
  get() {
    for (const option of ntpPresetOptions) {
      if (option.value === "__custom__") {
        continue;
      }
      if (option.value === params.ntpServer) {
        return option.value;
      }
    }
    return "__custom__";
  },
  set(value) {
    if (value === "__custom__") {
      return;
    }
    params.ntpServer = value;
  },
});

function clampBrightness(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }
  if (numericValue < 0) {
    return 0;
  }
  if (numericValue > UI_BRIGHTNESS_MAX) {
    return UI_BRIGHTNESS_MAX;
  }
  return Math.round(numericValue);
}

function applyResponse(data) {
  params.displayBright = clampBrightness(data.displayBright);
  params.brightnessDay = clampBrightness(data.brightnessDay);
  params.brightnessNight = clampBrightness(data.brightnessNight);
  params.displayRotation = Number(data.displayRotation);
  params.swapBlueGreen = data.swapBlueGreen === true;
  params.swapBlueRed = data.swapBlueRed === true;
  params.clkphase = data.clkphase === true;
  params.driver = Number(data.driver);
  params.i2cSpeed = Number(data.i2cSpeed);
  params.E_pin = Number(data.E_pin);
  params.ntpServer = String(data.ntpServer);
  params.nightStart = String(data.nightStart);
  params.nightEnd = String(data.nightEnd);
  info.value = {
    firmwareVersion: typeof data.firmwareVersion === "string" ? data.firmwareVersion : "",
    wifiSsid: typeof data.wifiSsid === "string" ? data.wifiSsid : "",
    uptime: typeof data.uptime === "number" ? data.uptime : 0,
  };
  snapshot.value = JSON.parse(JSON.stringify(params));
}

async function reloadParams() {
  if (loadingParams.value) {
    return;
  }
  showResetConfirm.value = false;
  loadingParams.value = true;
  try {
    feedback.showBlocking("璇诲彇璁惧鍙傛暟"", "姝ｅ湪浠庤澶囨湰鍦版帴鍙ｈ鍙栧綋鍓嶅疄闄呭弬鏁般€?")";"
    const data = await deviceStore.getDeviceParams();
    applyResponse(data);
    feedback.success("璇诲彇瀹屾垚"", "璁惧鍙傛暟宸茬粡鎸夊綋鍓嶅€煎洖鏄俱€?")";"
  } catch (error) {
    feedback.error("璇诲彇澶辫触", error.message);
  } finally {
    loadingParams.value = false;
    feedback.hideBlocking();
  }
}

async function updateDeviceParam(key, value) {
  await deviceStore.setDeviceParam(key, value);
}

function buildUpdates() {
  const updates = [];

  const nextDisplayBright = clampBrightness(params.displayBright);
  const nextBrightnessDay = clampBrightness(params.brightnessDay);
  const nextBrightnessNight = clampBrightness(params.brightnessNight);
  params.displayBright = nextDisplayBright;
  params.brightnessDay = nextBrightnessDay;
  params.brightnessNight = nextBrightnessNight;

  if (snapshot.value.displayBright !== nextDisplayBright) {
    updates.push(["displayBright", nextDisplayBright]);
  }
  if (snapshot.value.brightnessDay !== nextBrightnessDay) {
    updates.push(["brightnessDay", nextBrightnessDay]);
  }
  if (snapshot.value.brightnessNight !== nextBrightnessNight) {
    updates.push(["brightnessNight", nextBrightnessNight]);
  }
  if (snapshot.value.displayRotation !== params.displayRotation) {
    updates.push(["displayRotation", params.displayRotation]);
  }
  if (snapshot.value.swapBlueGreen !== params.swapBlueGreen) {
    updates.push(["swapBlueGreen", params.swapBlueGreen ? 1 : 0]);
  }
  if (snapshot.value.swapBlueRed !== params.swapBlueRed) {
    updates.push(["swapBlueRed", params.swapBlueRed ? 1 : 0]);
  }
  if (snapshot.value.clkphase !== params.clkphase) {
    updates.push(["clkphase", params.clkphase ? 1 : 0]);
  }
  if (snapshot.value.driver !== params.driver) {
    updates.push(["driver", params.driver]);
  }
  if (snapshot.value.i2cSpeed !== params.i2cSpeed) {
    updates.push(["i2cSpeed", params.i2cSpeed]);
  }
  if (snapshot.value.E_pin !== params.E_pin) {
    updates.push(["E_pin", params.E_pin]);
  }
  if (snapshot.value.nightStart !== params.nightStart) {
    updates.push(["nightStart", params.nightStart]);
  }
  if (snapshot.value.nightEnd !== params.nightEnd) {
    updates.push(["nightEnd", params.nightEnd]);
  }
  if (snapshot.value.ntpServer !== params.ntpServer) {
    updates.push(["ntpServer", params.ntpServer]);
  }

  return updates;
}

async function saveParams() {
  if (snapshot.value == null) {
    feedback.warning("杩樻病鏈夊揩鐓?, "璇峰厛閲嶆柊璇诲彇涓€娆¤澶囧弬鏁般€?);
    return;
  }

  if (!Number.isInteger(params.E_pin) || params.E_pin < 0 || params.E_pin > 32) {
    feedback.error("鍙傛暟鏃犳晥"", "E_pin 蹇呴』鏄?0 鍒?32 涔嬮棿鐨勬暣鏁般€?")";"
    return;
  }

  if (params.ntpServer.trim().length === 0) {
    feedback.error("鍙傛暟鏃犳晥"", "ntpServer 涓嶈兘涓虹┖銆?")";"
    return;
  }

  const updates = buildUpdates();
  if (updates.length === 0) {
    feedback.info("鍙傛暟娌℃湁鍙樺寲"", "褰撳墠鍙傛暟娌℃湁鏂扮殑淇敼銆?")";"
    return;
  }

  saving.value = true;
  showResetConfirm.value = false;
  try {
    feedback.showBlocking("淇濆瓨璁惧鍙傛暟"", "姝ｅ湪閫愰」鎶婂弬鏁板啓鍏ヨ澶囧苟绛夊緟鐢熸晥銆?")";"
    for (const entry of updates) {
      await updateDeviceParam(entry[0], entry[1]);
    }
    await reloadParams();
    feedback.success("淇濆瓨鎴愬姛"", "璁惧鍙傛暟宸茬粡鍐欏叆骞堕噸鏂板洖璇汇€?")";"
  } catch (error) {
    feedback.error("淇濆瓨澶辫触", error.message);
  } finally {
    saving.value = false;
    feedback.hideBlocking();
  }
}

function openResetConfirm() {
  showResetConfirm.value = true;
}

function cancelResetConfirm() {
  showResetConfirm.value = false;
}

async function resetWifi() {
  showResetConfirm.value = false;
  try {
    feedback.showBlocking("閲嶇疆缃戠粶"", "璁惧浼氭竻闄?WiFi 閰嶇疆骞惰嚜鍔ㄩ噸鍚€?")";"
    await deviceStore.clearWifiConfig();
    feedback.success("璁惧宸插紑濮嬮噸缃綉缁?, "璁惧鐑偣浼氶噸鏂板嚭鐜帮紝璇峰洖鍒扮儹鐐归厤缃戦〉閲嶆柊閰嶇綉銆?);
  } catch (error) {
    feedback.error("閲嶇疆缃戠粶澶辫触", error.message);
  } finally {
    feedback.hideBlocking();
  }
}

onMounted(async () => {
  deviceStore.init();
  if (!deviceStore.connected) {
    await deviceStore.restoreConnection();
  }

  if (!deviceStore.connected) {
    feedback.warning("璇峰厛杩炴帴璁惧"", "璁惧鍙傛暟椤靛彧鑳藉湪宸茶繛鎺ユ€佽繘鍏ワ紝姝ｅ湪杩斿洖璁惧鎺у埗椤点€?")";"
    router.push("/device-control");
    return;
  }

  if (typeof deviceStore.host === "string" && deviceStore.host.length > 0) {
    deviceHost.value = deviceStore.host;
    await reloadParams();
  }
});

watch(
  () => deviceStore.host,
  (nextHost) => {
    if (typeof nextHost !== "string") {
      return;
    }
    if (nextHost.length === 0) {
      return;
    }
    deviceHost.value = nextHost;
  },
);

watch(
  () => deviceStore.connected,
  (connected) => {
    if (!connected) {
      feedback.warning("璁惧宸叉柇寮€"", "璁惧鍙傛暟椤靛彧鏀寔宸茶繛鎺ョ姸鎬侊紝姝ｅ湪杩斿洖璁惧鎺у埗椤点€?")";"
      router.push("/device-control");
    }
  },
);
</script>

<style scoped>
.device-params-page {
  gap: 20px;
}

.device-params-page__metric {
  font-size: clamp(18px, 2.6vw, 24px);
  line-height: 1.2;
  word-break: break-all;
}

.device-params-page code {
  padding: 2px 6px;
  border: var(--glx-shell-border);
  background: #ffffff;
  color: var(--nb-ink);
  font-size: 0.92em;
  font-weight: 800;
}

.device-params-page__value-box {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  padding: 11px 12px;
  border: var(--glx-shell-border);
  background: #ffffff;
  color: var(--nb-ink);
  font-size: 14px;
  font-weight: 800;
  word-break: break-all;
}

.device-params-page__tip-box {
  padding: 14px 16px;
  border: var(--glx-shell-border);
  background: #fff6d1;
  color: var(--nb-ink);
  font-size: 13px;
  line-height: 1.7;
  font-weight: 700;
}

.device-params-page__action-stack {
  display: grid;
  gap: 12px;
}

.device-params-page__confirm-box {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: var(--glx-shell-border);
  background: #fff1ef;
}

.device-params-page__confirm-copy {
  display: grid;
  gap: 6px;
}

.device-params-page__confirm-title {
  color: var(--nb-ink);
  font-size: 16px;
  font-weight: 900;
}

.device-params-page__confirm-desc {
  color: var(--nb-text-secondary);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .device-params-page :deep(.glx-grid--two) {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
