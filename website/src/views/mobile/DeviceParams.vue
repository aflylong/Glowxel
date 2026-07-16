<!-- AUTO-CONVERTED FROM uniapp/pages/device-params/device-params.vue -->
<template>
  <div
    class="device-params-page glx-device-shell glx-device-shell--desktop-stack glx-page-shell"
  >
    

    <div class="navbar glx-topbar glx-device-shell__topbar glx-page-shell__fixed">
      <div class="nav-left" @click="goBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">璁惧鍙傛暟</span>
    </div>

    <div data-scroll-view
      scroll-y
      class="content glx-device-shell__content glx-scroll-region"
    >
      <div class="section-block glx-device-shell__section">
        <div class="section-header glx-section-head">
          <span class="section-title glx-section-title">鐗规畩LED</span>
          <span class="section-meta">鏃嬭浆銆佽壊褰┿€佸弽杞浉浣?</span>
        </div>
        <div class="panel-card glx-panel-card">
          <div class="param-card">
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">鏃嬭浆</span>
                <span class="param-desc">鐢婚潰渚х潃鏃跺湪杩欓噷鍒囨崲</span>
              </div>
              <select
                class="param-picker-field"
                :value="String(params.displayRotation)"
                @change="handleRotationChange"
              >
                <option value="0">0掳</option>
                <option value="1">90掳</option>
                <option value="2">180掳</option>
                <option value="3">270掳</option>
              </select>
            </div>
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">鑹插僵</span>
                <span class="param-desc">棰滆壊涓嶅鏃跺湪杩欓噷鍒囨崲</span>
              </div>
              <select
                class="param-picker-field"
                :value="colorOrderValue"
                @change="handleColorOrderChange"
              >
                <option value="RGB">RGB</option>
                <option value="RBG">RBG</option>
                <option value="GBR">GBR</option>
              </select>
            </div>
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">鍙嶈浆鐩镐綅</span>
                <span class="param-desc">娈嬪奖銆佸垎瑁傘€佸乏鍙抽敊浣嶆椂鍒囨崲</span>
              </div>
              <select
                class="param-picker-field"
                :value="params.clkphase ? '寮€鍚? : '鍏抽棴'"
                @change="handleClkphaseChange"
              >
                <option value="鍏抽棴">鍏抽棴</option>
                <option value="寮€鍚?">寮€鍚?/option>"
              </select>
            </div>
          </div>
        </div>
      </div>

      <div class="section-block glx-device-shell__section">
        <div class="section-header glx-section-head">
          <span class="section-title glx-section-title">鏃ュ浜害</span>
          <span class="section-meta">鎸夎澶囧綋鍓嶅€煎洖鏄?</span>
        </div>
        <div class="panel-card glx-panel-card">
          <div class="param-card">
            <div class="param-stack compact-gap">
              <span class="param-label">褰撳墠浜害</span>
              <span class="param-desc">璁惧甯歌鏄剧ず浜害锛岃寖鍥?0-178</span>
              <input
                class="number-input"
                type="number"
                :value="brightness"
                @input="handleBrightnessChange"
              />
            </div>
            <div class="param-stack">
              <span class="param-label">鏃ラ棿浜害</span>
              <span class="param-desc">鐧藉ぉ鑷姩浜害锛岃寖鍥?0-178</span>
              <input
                class="number-input"
                type="number"
                :value="brightnessDay"
                @input="handleBrightnessDayChange"
              />  
            </div>
            <div class="param-stack">
              <span class="param-label">澶滈棿浜害</span>
              <span class="param-desc">澶滈棿鑷姩浜害锛岃寖鍥?0-178</span>
              <input
                class="number-input"
                type="number"
                :value="brightnessNight"
                @input="handleBrightnessNightChange"
              />
            </div>
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">澶滈棿寮€濮嬫椂闂?</span>
                <span class="param-desc">澶滈棿寮€濮嬫椂闂?</span>
              </div>
              <input
                type="time"
                :value="params.nightStart"
                @input="handleNightStartInput"
              />
            </div>
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">澶滈棿缁撴潫鏃堕棿</span>
                <span class="param-desc">澶滈棿缁撴潫鏃堕棿</span>
              </div>
              <input
                type="time"
                :value="params.nightEnd"
                @input="handleNightEndInput"
              />
            </div>
            <div class="param-tip-box">
              <span class="param-tip-text"
                >鍙湁褰撴棩闂翠寒搴﹀拰澶滈棿浜害璁剧疆鎴愪笉鍚屾暟鍊兼椂锛岃澶囨墠浼氭寜鏃堕棿鑷姩鍒囨崲銆?</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-block glx-device-shell__section">
        <div class="section-header glx-section-head">
          <span class="section-title glx-section-title">椹卞姩鍙傛暟</span>
          <span class="section-meta">闈㈡澘椹卞姩鐩稿叧閰嶇疆</span>
        </div>
        <div class="panel-card glx-panel-card">
          <div class="param-card">
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">椹卞姩鑺墖</span>
                <span class="param-desc">鎸夎澶囧綋鍓?driver 鍙傛暟鍥炴樉</span>
              </div>
              <picker
                class="param-picker param-picker-wide"
                mode="selector"
                :range="driverLabels"
                :value="driverIndex"
                @change="handleDriverChange"
              >
                <div class="param-picker-text">{{
                  driverLabels[driverIndex]
                }}</div>
              </picker>
            </div>
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">I2S 閫熷害</span>
                <span class="param-desc">鎸夎澶囧綋鍓?i2cSpeed 鍙傛暟鍥炴樉</span>
              </div>
              <picker
                class="param-picker param-picker-wide"
                mode="selector"
                :range="speedLabels"
                :value="speedIndex"
                @change="handleSpeedChange"
              >
                <div class="param-picker-text">{{
                  speedLabels[speedIndex]
                }}</div>
              </picker>
            </div>
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">E 寮曡剼</span>
                <span class="param-desc">鎸夎澶囧綋鍓?E_pin 鍙傛暟鍥炴樉</span>
              </div>
              <input
                class="number-input"
                type="number"
                :value="String(params.E_pin)"
                @input="handleEPinInput"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="section-block glx-device-shell__section">
        <div class="section-header glx-section-head">
          <span class="section-title glx-section-title">缃戠粶鍙傛暟</span>
          <span class="section-meta">鍥藉唴浼樺厛 NTP</span>
        </div>
        <div class="panel-card glx-panel-card">
          <div class="param-card">
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">鏃堕棿鏈嶅姟鍣ㄩ璁?</span>
                <span class="param-desc">榛樿浼樺厛鍥藉唴鍙敤鍦板潃</span>
              </div>
              <picker
                class="param-picker param-picker-wide"
                mode="selector"
                :range="ntpPresetLabels"
                :value="ntpPresetIndex"
                @change="handleNtpPresetChange"
              >
                <div class="param-picker-text">{{
                  ntpPresetLabels[ntpPresetIndex]
                }}</div>
              </picker>
            </div>
            <div class="param-stack">
              <span class="param-label">鑷畾涔夋椂闂存湇鍔″櫒</span>
              <span class="param-desc"
                >濡傛灉榛樿鍦板潃鎱㈡垨涓嶅彲鐢紝鍙互鎵嬪姩濉啓</span>
              <input
                class="text-input"
                type="text"
                :value="params.ntpServer"
                @input="handleNtpServerInput"
                maxlength="63"
                placeholder="渚嬪 ntp2.aliyun.com"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="section-block glx-device-shell__section">
        <div class="section-header glx-section-head">
          <span class="section-title glx-section-title">璁惧淇℃伅</span>
          <span class="section-meta">鍙</span>
        </div>
        <div class="panel-card glx-panel-card">
          <div class="param-card">
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">鍥轰欢鐗堟湰</span>
                <span class="param-desc">褰撳墠鍥轰欢鐗堟湰</span>
              </div>
              <span class="readonly-value value-box">{{
                info.firmwareVersion.length > 0 ? info.firmwareVersion : "--"
              }}</span>
            </div>
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">杩愯鏃堕暱</span>
                <span class="param-desc">璁惧宸茶繍琛屾椂闀?</span>
              </div>
              <span class="readonly-value value-box">{{
                formattedUptime
              }}</span>
            </div>
            <div class="param-row">
              <div class="param-copy">
                <span class="param-label">褰撳墠 WiFi</span>
                <span class="param-desc">褰撳墠宸茶繛鎺?WiFi</span>
              </div>
              <span class="readonly-value value-box">{{
                info.wifiSsid.length > 0 ? info.wifiSsid : "鏈繛鎺?"
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-block glx-device-shell__section">
        <div class="section-header glx-section-head">
          <span class="section-title glx-section-title">搴旂敤鎿嶄綔</span>
          <span class="section-meta">閫愰」涓嬪彂鍒拌澶?</span>
        </div>
        <div class="panel-card glx-panel-card">
          <div class="panel-action" @click="saveDeviceParams">
            <div class="panel-action-icon blue">
              <Icon name="success" :size="32" color="var(--nb-ink)" />
            </div>
            <div class="panel-action-text">
              <span class="panel-action-label">淇濆瓨骞跺簲鐢?</span>
              <span class="panel-action-desc"
                >鎶婂綋鍓嶅弬鏁板啓鍏ヨ澶囧苟绔嬪嵆鐢熸晥</span>
            </div>
            <Icon name="direction-right" :size="28" color="var(--nb-ink)" />
          </div>
          <div class="panel-divider"></div>
          <div class="panel-action" @click="handleReloadParams">
            <div class="panel-action-icon">
              <Icon name="refresh" :size="32" color="var(--nb-ink)" />
            </div>
            <div class="panel-action-text">
              <span class="panel-action-label">閲嶆柊璇诲彇</span>
              <span class="panel-action-desc">浠庤澶囨媺鍙栧綋鍓嶅疄闄呭弬鏁?</span>
            </div>
            <Icon name="direction-right" :size="28" color="var(--nb-ink)" />
          </div>
        </div>
      </div>

      <div class="section-block glx-device-shell__section">
        <div class="section-header glx-section-head">
          <span class="section-title glx-section-title">楂樼骇</span>
          <span class="section-meta">鍗遍櫓鎿嶄綔璇疯皑鎱?</span>
        </div>
        <div class="panel-card glx-panel-card">
          <div class="panel-action danger" @click="handleResetWifi">
            <div class="panel-action-icon danger">
              <Icon name="close" :size="32" color="var(--nb-ink)" />
            </div>
            <div class="panel-action-text">
              <span class="panel-action-label danger-text">閲嶇疆缃戠粶</span>
              <span class="panel-action-desc"
                >娓呴櫎 WiFi 閰嶇疆骞惰嚜鍔ㄩ噸鍚澶?</span>
            </div>
            <Icon name="direction-right" :size="28" color="var(--nb-ink)" />
          </div>
        </div>
      </div>

      <div class="glx-device-shell__spacer"></div>
    </div>

    <ConfirmDialogHost />
    <LoadingOverlay />
    <Toast ref="toastRef" />
  </div>
</template>

<script>
import { getStorage, navigateBack, httpRequest } from '@/utils/browser-platform.js'
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import { useDeviceStore } from "@/stores/device.js";
import { useToast } from "@/composables/useToast.js";
import { useDialog } from "@/composables/useDialog.js";
import statusBarMixin from "@/mixins/statusBar.js";
import ConfirmDialogHost from "@/components/uni/ConfirmDialogHost.vue";
import Icon from "@/components/uni/Icon.vue";
import LoadingOverlay from "@/components/uni/LoadingOverlay.vue";
import Toast from "@/components/uni/Toast.vue";
import GlxSwitch from "@/components/uni/GlxSwitch.vue";
import GlxSlider from "@/components/uni/GlxSlider.vue";

const DRIVER_OPTIONS = [
  { label: "SHIFTREG", value: 0 },
  { label: "FM6124", value: 1 },
  { label: "FM6126A", value: 2 },
  { label: "ICN2038S", value: 3 },
  { label: "MBI5124", value: 4 },
  { label: "DP3246", value: 5 },
];

const SPEED_OPTIONS = [
  { label: "HZ_8M", value: 8000000 },
  { label: "HZ_16M", value: 16000000 },
  { label: "HZ_20M", value: 20000000 },
];

const ROTATION_OPTIONS = [
  { label: "0掳", value: 0 },
  { label: "90掳", value: 1 },
  { label: "180掳", value: 2 },
  { label: "270掳", value: 3 },
];

const COLOR_ORDER_OPTIONS = [
  { label: "RGB", swapBlueGreen: false, swapBlueRed: false },
  { label: "RBG", swapBlueGreen: true, swapBlueRed: false },
  { label: "GBR", swapBlueGreen: false, swapBlueRed: true },
];

const NTP_PRESET_OPTIONS = [
  { label: "闃块噷浜?2", value: "ntp2.aliyun.com" },
  { label: "闃块噷浜?", value: "ntp.aliyun.com"" },"
  { label: "鑵捐浜?", value: "ntp.tencent.com"" },"
  { label: "鍥藉鎺堟椂涓績", value: "ntp.ntsc.ac.cn" },
  { label: "鑷畾涔?", value: "__custom__"" },"
];

const UI_BRIGHTNESS_MAX = 178;

export default {
  mixins: [uniLifecycleAdapter, statusBarMixin],
  components: {
    ConfirmDialogHost,
    Icon,
    LoadingOverlay,
    Toast,
    GlxSwitch,
    GlxSlider,
  },
  data() {
    return {
      deviceStore: null,
      toast: null,
      dialog: null,
      deviceIp: "",
      brightness: 50,
      brightnessDay: 50,
      brightnessNight: 50,
      params: {
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
      },
      info: {
        firmwareVersion: "",
        uptime: 0,
        wifiSsid: "",
      },
      snapshot: {
        displayBright: 89,
        brightnessDay: 89,
        brightnessNight: 89,
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
      },
      saving: false,
      loadingParams: false,
      waitingForSaveSettle: false,
      saveSettled: false,
      saveFinalizeTimer: null,
      saveNavigateTimer: null,
      leavingForDisconnect: false,
    };
  },
  computed: {
    isDeviceConnected() {
      if (this.deviceStore == null) {
        return false;
      }
      return this.deviceStore.connected;
    },
    driverLabels() {
      return DRIVER_OPTIONS.map((item) => item.label);
    },
    driverIndex() {
      return DRIVER_OPTIONS.findIndex(
        (item) => item.value === this.params.driver,
      );
    },
    speedLabels() {
      return SPEED_OPTIONS.map((item) => item.label);
    },
    speedIndex() {
      return SPEED_OPTIONS.findIndex(
        (item) => item.value === this.params.i2cSpeed,
      );
    },
    rotationLabels() {
      return ROTATION_OPTIONS.map((item) => item.label);
    },
    rotationIndex() {
      return ROTATION_OPTIONS.findIndex(
        (item) => item.value === this.params.displayRotation,
      );
    },
    colorOrderLabels() {
      return COLOR_ORDER_OPTIONS.map((item) => item.label);
    },
    colorOrderIndex() {
      return COLOR_ORDER_OPTIONS.findIndex((item) => {
        return (
          item.swapBlueGreen === this.params.swapBlueGreen &&
          item.swapBlueRed === this.params.swapBlueRed
        );
      });
    },
    colorOrderValue() {
      if (this.colorOrderIndex < 0) {
        return "";
      }
      return COLOR_ORDER_OPTIONS[this.colorOrderIndex].label;
    },
    ntpPresetLabels() {
      return NTP_PRESET_OPTIONS.map((item) => item.label);
    },
    ntpPresetIndex() {
      const index = NTP_PRESET_OPTIONS.findIndex(
        (item) => item.value === this.params.ntpServer,
      );
      if (index >= 0) {
        return index;
      }
      return NTP_PRESET_OPTIONS.length - 1;
    },
    formattedUptime() {
      const totalSeconds = Number(this.info.uptime);
      if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
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
    },
  },
  watch: {
    isDeviceConnected(nextValue, previousValue) {
      if (nextValue !== false) {
        return;
      }
      if (previousValue === true && this.saving && this.waitingForSaveSettle) {
        this.finishSaveAndLeave();
        return;
      }
      this.leaveWhenDisconnected();
    },
  },
  onLoad() {
    this.deviceStore = useDeviceStore();
    this.toast = useToast();
    this.dialog = useDialog();
    this.deviceStore.init();

    const savedIp = getStorage("device_ip");
    if (typeof savedIp === "string") {
      this.deviceIp = savedIp;
    }
  },
  onReady() {
    if (this.$refs.toastRef) {
      this.toast.setToastInstance(this.$refs.toastRef);
    }
  },
  onHide() {
    this.clearSaveTimers();
  },
  onUnload() {
    this.clearSaveTimers();
  },
  onShow() {
    if (
      this.deviceStore &&
      typeof this.deviceStore.deviceIp === "string" &&
      this.deviceStore.deviceIp.length > 0
    ) {
      this.deviceIp = this.deviceStore.deviceIp;
    }
    if (!this.ensureConnectedOrLeave()) {
      return;
    }
    this.loadDeviceParams(true);
  },
  methods: {
    goBack() {
      navigateBack();
    },
    ensureConnectedOrLeave() {
      if (this.isDeviceConnected) {
        return true;
      }
      this.leaveWhenDisconnected();
      return false;
    },
    leaveWhenDisconnected() {
      if (this.leavingForDisconnect) {
        return;
      }
      this.leavingForDisconnect = true;
      this.clearSaveTimers();
      this.saving = false;
      this.waitingForSaveSettle = false;
      this.toast.hideLoading();
    },
    clearSaveTimers() {
      if (this.saveFinalizeTimer != null) {
        clearTimeout(this.saveFinalizeTimer);
        this.saveFinalizeTimer = null;
      }
      if (this.saveNavigateTimer != null) {
        clearTimeout(this.saveNavigateTimer);
        this.saveNavigateTimer = null;
      }
    },
    finishSaveAndLeave() {
      if (this.saveSettled) {
        return;
      }
      this.saveSettled = true;
      this.waitingForSaveSettle = false;
      this.clearSaveTimers();
      this.saving = false;
      this.toast.hideLoading();
      this.toast.showSuccess("璁惧鍙傛暟宸插簲鐢?")";"
      this.saveNavigateTimer = setTimeout(() => {
        this.saveNavigateTimer = null;
        navigateBack();
      }, 260);
    },
    scheduleSaveFallback() {
      this.clearSaveTimers();
      this.saveFinalizeTimer = setTimeout(() => {
        this.saveFinalizeTimer = null;
        this.finishSaveAndLeave();
      }, 1200);
    },
    getBaseUrl() {
      if (this.deviceIp.length === 0) {
        throw new Error("璇峰厛杩炴帴璁惧");
      }
      return `http://${this.deviceIp}`;
    },
    requestDevice(options) {
      return new Promise((resolve, reject) => {
        httpRequest({
          ...options,
          success: (res) => {
            if (
              typeof res.statusCode === "number" &&
              res.statusCode >= 200 &&
              res.statusCode < 300
            ) {
              resolve(res);
              return;
            }
            reject(new Error("璁惧璇锋眰澶辫触"));
          },
          fail: (err) => {
            reject(err);
          },
        });
      });
    },
    parseJsonData(data) {
      if (typeof data === "string") {
        return JSON.parse(data);
      }
      return data;
    },
    clampBrightnessValue(rawValue) {
      const numericValue = Number(rawValue);
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
    },
    async loadDeviceParams(showLoading = false) {
      if (this.deviceIp.length === 0) {
        return;
      }
      if (this.loadingParams) {
        return;
      }

      try {
        this.loadingParams = true;
        if (showLoading) {
          this.toast.showLoading("璇诲彇璁惧鍙傛暟...");
        }
        const baseUrl = this.getBaseUrl();
        const response = await this.requestDevice({
          url: `${baseUrl}/get`,
          method: "GET",
        });
        const data = this.parseJsonData(response.data);
        const displayBright = Number(data.displayBright);
        const brightnessDay = Number(data.brightnessDay);
        const brightnessNight = Number(data.brightnessNight);

        this.snapshot = {
          displayBright,
          brightnessDay,
          brightnessNight,
          displayRotation: Number(data.displayRotation),
          swapBlueGreen: data.swapBlueGreen === true,
          swapBlueRed: data.swapBlueRed === true,
          clkphase: data.clkphase === true,
          driver: Number(data.driver),
          i2cSpeed: Number(data.i2cSpeed),
          E_pin: Number(data.E_pin),
          ntpServer: String(data.ntpServer),
          nightStart: String(data.nightStart),
          nightEnd: String(data.nightEnd),
        };

        this.brightness = this.clampBrightnessValue(displayBright);
        this.brightnessDay = this.clampBrightnessValue(brightnessDay);
        this.brightnessNight = this.clampBrightnessValue(brightnessNight);
        this.params = {
          displayRotation: this.snapshot.displayRotation,
          swapBlueGreen: this.snapshot.swapBlueGreen,
          swapBlueRed: this.snapshot.swapBlueRed,
          clkphase: this.snapshot.clkphase,
          driver: this.snapshot.driver,
          i2cSpeed: this.snapshot.i2cSpeed,
          E_pin: this.snapshot.E_pin,
          ntpServer: this.snapshot.ntpServer,
          nightStart: this.snapshot.nightStart,
          nightEnd: this.snapshot.nightEnd,
        };
        let firmwareVersion = "";
        if (typeof data.firmwareVersion === "string") {
          firmwareVersion = data.firmwareVersion;
        }
        let uptime = 0;
        if (typeof data.uptime === "number") {
          uptime = data.uptime;
        }
        let wifiSsid = "";
        if (typeof data.wifiSsid === "string") {
          wifiSsid = data.wifiSsid;
        }
        this.info = {
          firmwareVersion,
          uptime,
          wifiSsid,
        };
      } catch (err) {
        console.error("鍔犺浇璁惧鍙傛暟澶辫触:", err);
        if (showLoading) {
          this.toast.showError("璇诲彇璁惧鍙傛暟澶辫触");
        }
      } finally {
        this.loadingParams = false;
        if (showLoading) {
          this.toast.hideLoading();
        }
      }
    },
    handleBrightnessChange(e) {
      this.brightness = this.clampBrightnessValue(e.target.value);
    },
    handleBrightnessDayChange(e) {
      this.brightnessDay = this.clampBrightnessValue(e.target.value);
    },
    handleBrightnessNightChange(e) {
      this.brightnessNight = this.clampBrightnessValue(e.target.value);
    },
    handleRotationChange(event) {
      this.params.displayRotation = Number(event.target.value);
    },
    handleColorOrderChange(event) {
      const option = COLOR_ORDER_OPTIONS.find(
        (item) => item.label === event.target.value,
      );
      if (!option) {
        return;
      }
      this.params.swapBlueGreen = option.swapBlueGreen;
      this.params.swapBlueRed = option.swapBlueRed;
    },
    handleClkphaseChange(event) {
      this.params.clkphase = event.target.value === "寮€鍚?";"
    },
    handleDriverChange(e) {
      const index = Number(e.detail.value);
      this.params.driver = DRIVER_OPTIONS[index].value;
    },
    handleSpeedChange(e) {
      const index = Number(e.detail.value);
      this.params.i2cSpeed = SPEED_OPTIONS[index].value;
    },
    handleSwitchChange(key, event) {
      this.params[key] = event.detail.value === true;
    },
    handleEPinInput(event) {
      const rawValue = String(event.detail.value);
      if (rawValue.length === 0) {
        this.params.E_pin = 0;
        return;
      }
      this.params.E_pin = Number(rawValue);
    },
    handleNightStartChange(event) {
      this.params.nightStart = String(event.detail.value);
    },
    handleNightEndChange(event) {
      this.params.nightEnd = String(event.detail.value);
    },
    handleNightStartInput(event) {
      this.params.nightStart = String(event.target.value);
    },
    handleNightEndInput(event) {
      this.params.nightEnd = String(event.target.value);
    },
    handleNtpPresetChange(e) {
      const index = Number(e.detail.value);
      const option = NTP_PRESET_OPTIONS[index];
      if (option.value !== "__custom__") {
        this.params.ntpServer = option.value;
      }
    },
    handleNtpServerInput(event) {
      this.params.ntpServer = String(event.detail.value).trim();
    },
    handleReloadParams() {
      this.loadDeviceParams(true);
    },
    async updateDeviceParam(key, value) {
      const baseUrl = this.getBaseUrl();
      await this.requestDevice({
        url: `${baseUrl}/set?${key}=${encodeURIComponent(String(value))}`,
        method: "POST",
      });
    },
    async updateBrightness(rawValue) {
      const baseUrl = this.getBaseUrl();
      await this.requestDevice({
        url: `${baseUrl}/brightness`,
        method: "POST",
        data: `value=${rawValue}`,
        header: {
          "content-type": "application/x-www-form-urlencoded",
        },
      });
    },
    async saveDeviceParams() {
      if (this.saving) {
        return;
      }

      if (
        !Number.isInteger(this.params.E_pin) ||
        this.params.E_pin < 0 ||
        this.params.E_pin > 32
      ) {
        this.toast.showError("E_pin 蹇呴』鏄?0 鍒?32 涔嬮棿鐨勬暣鏁?")";"
        return;
      }
      if (this.params.ntpServer.length === 0) {
        this.toast.showError("ntpServer 涓嶈兘涓虹┖");
        return;
      }

      try {
        this.saving = true;
        this.saveSettled = false;
        this.waitingForSaveSettle = false;
        this.clearSaveTimers();
        const nextDisplayBright = this.clampBrightnessValue(this.brightness);
        const nextBrightnessDay = this.clampBrightnessValue(this.brightnessDay);
        const nextBrightnessNight = this.clampBrightnessValue(this.brightnessNight);
        const updates = [];

        if (this.snapshot.displayBright !== nextDisplayBright) {
          updates.push(() => this.updateBrightness(nextDisplayBright));
        }
        if (this.snapshot.brightnessDay !== nextBrightnessDay) {
          updates.push(() =>
            this.updateDeviceParam("brightnessDay", nextBrightnessDay),
          );
        }
        if (this.snapshot.brightnessNight !== nextBrightnessNight) {
          updates.push(() =>
            this.updateDeviceParam("brightnessNight", nextBrightnessNight),
          );
        }
        if (this.snapshot.displayRotation !== this.params.displayRotation) {
          updates.push(() =>
            this.updateDeviceParam(
              "displayRotation",
              this.params.displayRotation,
            ),
          );
        }
        if (this.snapshot.swapBlueGreen !== this.params.swapBlueGreen) {
          updates.push(() =>
            this.updateDeviceParam(
              "swapBlueGreen",
              this.params.swapBlueGreen ? 1 : 0,
            ),
          );
        }
        if (this.snapshot.swapBlueRed !== this.params.swapBlueRed) {
          updates.push(() =>
            this.updateDeviceParam(
              "swapBlueRed",
              this.params.swapBlueRed ? 1 : 0,
            ),
          );
        }
        if (this.snapshot.clkphase !== this.params.clkphase) {
          updates.push(() =>
            this.updateDeviceParam("clkphase", this.params.clkphase ? 1 : 0),
          );
        }
        if (this.snapshot.driver !== this.params.driver) {
          updates.push(() =>
            this.updateDeviceParam("driver", this.params.driver),
          );
        }
        if (this.snapshot.i2cSpeed !== this.params.i2cSpeed) {
          updates.push(() =>
            this.updateDeviceParam("i2cSpeed", this.params.i2cSpeed),
          );
        }
        if (this.snapshot.E_pin !== this.params.E_pin) {
          updates.push(() =>
            this.updateDeviceParam("E_pin", this.params.E_pin),
          );
        }
        if (this.snapshot.nightStart !== this.params.nightStart) {
          updates.push(() =>
            this.updateDeviceParam("nightStart", this.params.nightStart),
          );
        }
        if (this.snapshot.nightEnd !== this.params.nightEnd) {
          updates.push(() =>
            this.updateDeviceParam("nightEnd", this.params.nightEnd),
          );
        }
        if (this.snapshot.ntpServer !== this.params.ntpServer) {
          updates.push(() =>
            this.updateDeviceParam("ntpServer", this.params.ntpServer),
          );
        }

        if (updates.length === 0) {
          this.toast.showInfo("鍙傛暟娌℃湁鍙樺寲");
          this.saving = false;
          return;
        }

        this.toast.showLoading("搴旂敤涓?..");
        for (let i = 0; i < updates.length; i += 1) {
          await updates[i]();
        }
        this.waitingForSaveSettle = true;
        this.scheduleSaveFallback();
        await this.loadDeviceParams(false);
        this.finishSaveAndLeave();
      } catch (err) {
        if (this.saveSettled) {
          return;
        }
        if (this.waitingForSaveSettle) {
          this.finishSaveAndLeave();
          return;
        }
        console.error("淇濆瓨璁惧鍙傛暟澶辫触:", err);
        this.toast.showError("淇濆瓨澶辫触锛岃妫€鏌ヨ澶囪繛鎺?")";"
      } finally {
        if (!this.saveSettled) {
          this.saving = false;
          this.waitingForSaveSettle = false;
          this.clearSaveTimers();
          this.toast.hideLoading();
        }
      }
    },
    async handleResetWifi() {
      if (this.deviceIp.length === 0) {
        this.toast.showError("璇峰厛杩炴帴璁惧");
        return;
      }

      const confirmed = await this.dialog.confirm({
        title: "閲嶇疆缃戠粶",
        content: "灏嗘竻闄ゅ綋鍓?WiFi 閰嶇疆骞堕噸鍚澶囷紝鏄惁缁х画锛?,"
        danger: true,
      });

      if (!confirmed) {
        return;
      }

      try {
        const baseUrl = this.getBaseUrl();
        await this.requestDevice({
          url: `${baseUrl}/clear-wifi`,
          method: "GET",
        });
        this.toast.showSuccess("璁惧宸插紑濮嬮噸缃綉缁?")";"
      } catch (err) {
        console.error("閲嶇疆缃戠粶澶辫触:", err);
        this.toast.showError("閲嶇疆缃戠粶澶辫触");
      }
    },
  },
};
</script>

<style scoped>
.navbar {
  background: var(--nb-surface);
  border-bottom: 2rpx solid var(--nb-ink);
}

.content {
  padding: 16rpx 20rpx 0;
  overflow-y: scroll;
}

.section-block {
  margin-bottom: 24rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 4rpx 4rpx 14rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--nb-ink);
}

.section-meta,
.panel-action-desc,
.param-desc {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.panel-card {
  background: transparent;
  border: none !important;
  box-shadow: none;
  border-radius: 0;
  overflow: hidden;
}

.panel-action {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 24rpx;
  border: 2rpx solid var(--nb-ink);
  background: var(--nb-surface);
}

.panel-action.danger {
  background: var(--nb-surface);
}

.panel-action-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 0;
  background: var(--nb-surface);
  border: 2rpx solid var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.panel-action-icon.warm {
  background: var(--nb-yellow);
}

.panel-action-icon.blue {
  background: var(--nb-blue);
}

.panel-action-icon.danger {
  background: var(--nb-coral);
}

.panel-action-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.panel-action-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}

.danger-text {
  color: var(--nb-coral);
}

.panel-divider {
  height: 2rpx;
  background: rgba(0, 0, 0, 0.12);
  margin: 0 24rpx;
}

.param-card {
  border: 2rpx solid var(--nb-ink);
  background: var(--nb-surface);
  padding: 0 24rpx;
}

.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  padding: 24rpx 0;
}

.param-row + .param-row {
  border-top: 2rpx solid rgba(0, 0, 0, 0.12);
}

.param-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.param-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}

.param-stack {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 24rpx 0;
  border-top: 2rpx solid rgba(0, 0, 0, 0.12);
}

.param-stack.compact-gap {
  gap: 12rpx;
  border-top: 0;
}

.param-tip-box {
  border-top: 2rpx solid rgba(0, 0, 0, 0.12);
  padding: 24rpx 0;
}

.param-tip-text {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--text-tertiary);
}

.param-picker {
  width: 196rpx;
  min-width: 196rpx;
  min-height: 72rpx;
  padding: 0 20rpx;
  border: 2rpx solid var(--nb-ink);
  border-radius: 0;
  background: var(--nb-surface);
  box-shadow: var(--nb-shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
}

.param-picker-wide {
  width: 232rpx;
  min-width: 232rpx;
}

.param-picker-text {
  width: 100%;
  text-align: center;
  font-size: 26rpx;
  font-weight: 600;
  color: #111827;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.param-picker-field {
  width: 196rpx;
  min-width: 196rpx;
  min-height: 72rpx;
  padding: 0 20rpx;
  border: 2rpx solid var(--nb-ink);
  border-radius: 0;
  background: var(--nb-surface);
  box-shadow: var(--nb-shadow-soft);
  box-sizing: border-box;
  flex-shrink: 0;
  font-size: 26rpx;
  font-weight: 600;
  color: #111827;
  text-align: center;
  appearance: none;
}

.number-input {
  width: 136rpx;
  height: 82rpx;
  padding: 0 18rpx;
  border: 2rpx solid var(--nb-ink);
  border-radius: 0;
  background: var(--nb-surface);
  box-shadow: var(--nb-shadow-soft);
  box-sizing: border-box;
  text-align: center;
  font-size: 28rpx;
  font-weight: 600;
  color: #111827;
}

.text-input {
  min-height: 88rpx;
  padding: 0 22rpx;
  border: 2rpx solid var(--nb-ink);
  border-radius: 0;
  background: var(--nb-surface);
  box-shadow: var(--nb-shadow-soft);
  box-sizing: border-box;
  font-size: 26rpx;
  font-weight: 600;
  color: #111827;
}

.slider-inline-head {
  display: flex;
  justify-content: flex-end;
}

.slider-inline-value,
.readonly-value {
  font-size: 24rpx;
  font-weight: 600;
  color: #111827;
}

.value-box {
  min-width: 188rpx;
  min-height: 82rpx;
  padding: 0 20rpx;
  border: 2rpx solid #000000;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  text-align: center;
}

@media (min-width: 769px) {
  .device-params-page .param-card {
    padding: 0 20px;
  }

  .device-params-page .param-row {
    gap: 16px;
    padding: 20px 0;
  }

  .device-params-page .param-stack,
  .device-params-page .param-tip-box {
    padding: 20px 0;
  }

  .device-params-page .panel-card {
    border-radius: 0;
  }

  .device-params-page .param-picker,
  .device-params-page .param-picker-wide {
    width: 180px;
    min-width: 180px;
    min-height: 48px;
    padding: 0 14px;
  }

  .device-params-page .param-picker-field {
    width: 180px;
    min-width: 180px;
    min-height: 48px;
    padding: 0 14px;
  }

  .device-params-page .param-picker-wide {
    width: 210px;
    min-width: 210px;
  }

  .device-params-page .number-input,
  .device-params-page .value-box {
    min-height: 48px;
    height: 48px;
  }

  .device-params-page .number-input {
    width: 104px;
    padding: 0 12px;
  }

  .device-params-page .text-input {
    min-height: 52px;
    padding: 0 14px;
  }

  .device-params-page .panel-action {
    min-height: 108px;
    padding: 20px;
  }
}

@media (min-width: 769px) and (max-width: 980px) {
  .device-params-page .param-row {
    flex-direction: column;
    align-items: stretch;
  }

  .device-params-page .param-picker,
  .device-params-page .param-picker-wide,
  .device-params-page .param-picker-field,
  .device-params-page .number-input,
  .device-params-page .value-box {
    width: 100%;
    min-width: 0;
  }
}
</style>
