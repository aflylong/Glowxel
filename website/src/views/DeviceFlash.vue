<template>
  <div class="glx-page-shell device-flash-page">
    <section class="glx-page-shell__hero">
      <h1 class="glx-page-shell__title">设备烧录</h1>
      <p class="glx-page-shell__desc">
        通过浏览器连接 Glowxel PixelBoard 的 USB 串口并写入固件。这里走的是 USB
        数据线，
      </p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">连接方式</span>
          <strong class="glx-hero-metric__value">USB 串口</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">推荐浏览器</span>
          <strong class="glx-hero-metric__value">Chrome / Edge</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">页面环境</span>
          <strong class="glx-hero-metric__value">HTTPS / localhost</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">设备控制连接</span>
          <strong class="glx-hero-metric__value">不需要 WS</strong>
        </article>
      </div>
      <div class="glx-inline-actions">
        <router-link to="/device-control" class="glx-button glx-button--ghost"
          >返回设备控制</router-link
        >
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <DeviceParamsSection
        title="开始烧录"
        meta="USB Web Serial"
        description="连接设备 USB 数据线后点击按钮，浏览器会弹出串口选择窗口。"
      >
        <div class="device-flash-page__install-box">
          <esp-web-install-button :manifest="manifestPath">
            <button
              slot="activate"
              class="glx-button glx-button--primary device-flash-page__install-button"
              type="button"
            >
              连接 USB 并开始烧录
            </button>
            <div slot="unsupported" class="device-flash-page__tip-box">
              当前浏览器不支持 Web Serial，请换用 Chrome 或 Edge 桌面版。
            </div>
            <div slot="not-allowed" class="device-flash-page__tip-box">
              当前页面不是安全上下文，请使用 HTTPS 或 localhost。
            </div>
          </esp-web-install-button>
        </div>
        <div class="device-flash-page__tip-box">
          如果浏览器没有弹出串口选择窗口，先检查 USB
          数据线、串口驱动和页面安全环境。
        </div>
      </DeviceParamsSection>

      <DeviceParamsSection
        title="烧录前确认"
        meta="减少失败率"
        description="这些检查只针对 USB 串口烧录，不涉及设备 WiFi 或 WebSocket。"
      >
        <ul class="device-flash-page__checklist">
          <li>使用可以传输数据的 USB 线，不要使用只能充电的线。</li>
          <li>确认系统已经安装 CH340 / CP2102 等对应串口驱动。</li>
          <li>关闭串口监视器、PlatformIO 上传窗口等占用端口的程序。</li>
          <li>如果连接失败，可以按住 BOOT 后再点击连接，开始写入后松开。</li>
        </ul>
      </DeviceParamsSection>
    </section>

    <section class="glx-grid glx-grid--two">
      <DeviceParamsSection
        title="弹窗英文对照"
        meta="第三方控件"
        description="ESP Web Tools 的系统弹窗暂时不能完全改成中文，页面先提供操作对照。"
      >
        <div class="device-flash-page__guide-grid">
          <span>Connect / Select Port</span>
          <strong>选择设备串口</strong>
          <span>Install / Next</span>
          <strong>继续下一步</strong>
          <span>Installing</span>
          <strong>正在写入程序，不要拔线</strong>
          <span>Done / Finish</span>
          <strong>烧录完成，等待设备重启</strong>
        </div>
      </DeviceParamsSection>

      <DeviceParamsSection
        title="完成后"
        meta="重新连接设备"
        description="烧录完成后设备会重启。等屏幕恢复显示或设备重新联网后，再回到设备控制页连接设备。"
      >
        <div class="device-flash-page__action-row">
          <router-link
            to="/device-control"
            class="glx-button glx-button--primary"
            >回到设备控制</router-link
          >
          <router-link to="/ble-config" class="glx-button glx-button--ghost"
            >需要时重新配网</router-link
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
