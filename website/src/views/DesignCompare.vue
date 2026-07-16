<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">QA</span>
      <h1 class="glx-page-shell__title">Design Compare</h1>
      <p class="glx-page-shell__desc">
        杩欐槸闅愯棌鐨勬瘮瀵归〉锛岀敤鏉ヨ褰曠綉绔欐寮忛〉闈㈠拰 `uniapp` 瀵圭収鍏崇郴锛屼笉杩涘叆涓诲鑸€?      </p>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-stack">
        <article v-for="item in compareRows" :key="item.webRoute" class="glx-list-card compare-row">
          <div class="glx-list-card__copy">
            <strong class="glx-list-card__title">{{ item.title }}</strong>
            <span class="glx-list-card__desc">缃戠珯锛歿{ item.webRoute }} 锝?UniApp锛歿{ item.uniappPage }}</span>
          </div>
          <span class="glx-chip" :class="statusClass(item.status)">{{ item.status }}</span>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
const compareRows = [
  { title: "宸ヤ綔鍙?", webRoute: "/workspace"", uniappPage: "pages/workspace/workspace"", status: "active"" },"
  { title: "椤圭洰鎬昏", webRoute: "/overview/:id", uniappPage: "pages/overview/overview", status: "active" },
  { title: "杈呭姪澶勭悊", webRoute: "/assist/:id", uniappPage: "pages/assist/assist", status: "active" },
  { title: "鍙戝竷浣滃搧", webRoute: "/publish-project/:id", uniappPage: "pages/publish-project/publish-project", status: "active" },
  { title: "涓汉涓績", webRoute: "/profile", uniappPage: "pages/profile/profile", status: "active" },
  { title: "浜戠鍚屾", webRoute: "/cloud-sync", uniappPage: "pages/cloud-sync/cloud-sync", status: "active" },
  { title: "璁惧鎺у埗", webRoute: "/device-control", uniappPage: "pages/control/control", status: "active" },
];

function statusClass(status) {
  if (status === "active") {
    return "glx-chip--green";
  }
  return "glx-chip--yellow";
}
</script>

<style scoped>
.compare-row {
  justify-content: space-between;
}
</style>
