<template>
  <div class="glx-page-shell device-flash-page">
    <section class="device-flash-page__hero">
      <div class="device-flash-page__hero-main">
        <div class="device-flash-page__hero-copy">
          <span class="device-flash-page__eyebrow">USB Web Serial</span>
          <h1 class="device-flash-page__title">设备烧录</h1>
          <p class="device-flash-page__desc">
            这里通过浏览器连接 Glowxel PixelBoard 的 USB 串口写入程序。烧录走的是 USB 线，
            不是 WiFi 连接，也不是设备控制里的 WebSocket。
          </p>
        </div>
        <router-link to="/device-control" class="glx-button glx-button--ghost device-flash-page__back">
          返回设备控制
        </router-link>
      </div>
      <div class="device-flash-page__metrics">
        <div class="device-flash-page__metric-card">
          <span class="device-flash-page__metric-label">连接方式</span>
          <strong class="device-flash-page__metric-value">USB 串口</strong>
        </div>
        <div class="device-flash-page__metric-card">
          <span class="device-flash-page__metric-label">推荐浏览器</span>
          <strong class="device-flash-page__metric-value">Chrome / Edge</strong>
        </div>
        <div class="device-flash-page__metric-card">
          <span class="device-flash-page__metric-label">页面环境</span>
          <strong class="device-flash-page__metric-value">HTTPS / localhost</strong>
        </div>
        <div class="device-flash-page__metric-card">
          <span class="device-flash-page__metric-label">设备控制连接</span>
          <strong class="device-flash-page__metric-value">不需要 WS</strong>
        </div>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <DeviceParamsSection
        title="开始烧录"
        meta="USB Web Serial"
        description="连接设备 USB 线后点击按钮，浏览器会弹出串口选择窗口。"
      >
        <div class="device-flash-page__install-box">
          <esp-web-install-button :manifest="manifestPath">
            <button slot="activate" class="glx-button glx-button--primary device-flash-page__install-button" type="button">
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
          如果浏览器没有弹出串口选择窗口，先检查数据线、驱动和页面安全环境。
        </div>
      </DeviceParamsSection>

      <DeviceParamsSection
        title="烧录前确认"
        meta="减少失败率"
        description="这些检查项不涉及设备 WiFi 或 WebSocket，只针对 USB 串口烧录。"
      >
        <ul class="device-flash-page__checklist">
          <li>使用可以传输数据的 USB 线，不要使用只能充电的线。</li>
          <li>确认系统已经安装 CH340 / CP2102 等对应串口驱动。</li>
          <li>关闭串口监视器、PlatformIO 上传窗口等占用端口的程序。</li>
          <li>如果连接失败，可以按住 BOOT 后再点击连接，开始写入后松开。</li>
        </ul>
      </DeviceParamsSection>
    </section>

    <DeviceParamsSection
      title="完成后"
      meta="重新连接设备"
      description="烧录完成后设备会重启。等屏幕恢复显示或设备重新联网后，再回到设备控制页连接设备。"
    >
      <div class="device-flash-page__action-row">
        <router-link to="/device-control" class="glx-button glx-button--primary">回到设备控制</router-link>
        <router-link to="/ble-config" class="glx-button glx-button--ghost">需要时重新配网</router-link>
      </div>
    </DeviceParamsSection>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import DeviceParamsSection from "@/components/device/params/DeviceParamsSection.vue";

const manifestPath = "/firmware/esp32/manifest.json";
const espWebToolsScript =
  "https://unpkg.com/esp-web-tools@10/dist/web/install-button.js?module";

onMounted(() => {
  if (typeof window === "undefined" || customElements.get("esp-web-install-button")) {
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
  gap: 20px;
}

.device-flash-page__hero {
  display: grid;
  gap: 16px;
  padding: 20px 24px;
  border: var(--glx-shell-border-strong);
  background: #ffffff;
  box-shadow: var(--glx-shadow-card);
}

.device-flash-page__hero-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.device-flash-page__hero-copy {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.device-flash-page__eyebrow {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 28px;
  padding: 0 10px;
  border: var(--glx-shell-border);
  background: #ffffff;
  box-shadow: var(--glx-shadow-soft);
  color: var(--nb-ink);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.device-flash-page__title {
  margin: 0;
  color: var(--nb-ink);
  font-size: clamp(26px, 4vw, 34px);
  line-height: 1.08;
  font-weight: 900;
}

.device-flash-page__desc {
  max-width: 760px;
  margin: 0;
  color: var(--nb-text-secondary);
  font-size: 14px;
  line-height: 1.75;
  font-weight: 700;
}

.device-flash-page__back {
  flex: 0 0 auto;
}

.device-flash-page__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.device-flash-page__metric-card {
  display: grid;
  gap: 6px;
  min-height: 78px;
  padding: 12px;
  border: var(--glx-shell-border);
  background: #fff6d1;
}

.device-flash-page__metric-label {
  color: var(--nb-text-secondary);
  font-size: 11px;
  font-weight: 900;
}

.device-flash-page__metric-value {
  color: var(--nb-ink);
  font-size: clamp(16px, 2.4vw, 22px);
  line-height: 1.2;
  font-weight: 900;
  word-break: break-word;
}

.device-flash-page__install-box {
  min-height: 128px;
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

  .device-flash-page__hero {
    padding: 16px;
  }

  .device-flash-page__hero-main {
    display: grid;
  }

  .device-flash-page__back {
    width: 100%;
    justify-content: center;
  }

  .device-flash-page__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .device-flash-page__metrics {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
