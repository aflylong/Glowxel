<template>
  <div class="glx-page-shell">
    <section class="glx-page-shell__hero">
      <span class="glx-page-shell__eyebrow">Workspace</span>
      <h1 class="glx-page-shell__title">鍒涗綔涓績</h1>
      <p class="glx-page-shell__desc">
        宸ヤ綔鍙伴渶瑕佺户缁壙鎺ュ垱浣滃叆鍙ｃ€佷簯绔」鐩垪琛ㄥ拰椤圭洰绠＄悊锛屼笉搴旇琚敼鎴愬彧鍓╄鏄庢枃妗堢殑鍗犱綅椤点€?      </p>
      <div class="glx-hero-metrics">
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">浜戠椤圭洰</span>
          <strong class="glx-hero-metric__value">{{ userStore.isLoggedIn ? projectStore.totalProjects : 0 }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">鑽夌</span>
          <strong class="glx-hero-metric__value">{{ userStore.isLoggedIn ? projectStore.draftProjects.length : 0 }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">宸插彂甯?</span>
          <strong class="glx-hero-metric__value">{{ userStore.isLoggedIn ? projectStore.publishedProjects.length : 0 }}</strong>
        </article>
        <article class="glx-hero-metric">
          <span class="glx-hero-metric__label">褰撳墠鐘舵€?</span>
          <strong class="glx-hero-metric__value">{{ userStore.isLoggedIn ? "宸茬櫥褰? : "鏈櫥褰? }}</strong>
        </article>
      </div>
    </section>

    <section class="glx-grid glx-grid--two">
      <router-link to="/create?mode=blank" class="workspace-entry">
        <span class="glx-icon-chip glx-icon-chip--yellow workspace-entry__icon">+</span>
        <strong class="workspace-entry__title">鏂板缓鐢诲竷</strong>
        <p class="workspace-entry__desc">浠庣┖鐧界敾甯冨紑濮嬪垱浣滐紝缁х画璧扮綉绔欑姝ｅ紡鍒涗綔閾俱€?</p>
      </router-link>

      <router-link to="/create?mode=image" class="workspace-entry">
        <span class="glx-icon-chip glx-icon-chip--blue workspace-entry__icon">鍥?</span>
        <strong class="workspace-entry__title">瀵煎叆鍥剧墖</strong>
        <p class="workspace-entry__desc">鎶婄幇鏈夊浘鐗囬€佽繘鍍忕礌缂栬緫鍣紝鍐嶇户缁粏淇拰淇濆瓨銆?</p>
      </router-link>

      <router-link to="/pattern-workbench" class="workspace-entry">
        <span class="glx-icon-chip glx-icon-chip--green workspace-entry__icon">鎷?</span>
        <strong class="workspace-entry__title">鎷艰眴宸ヤ綔鍙?</strong>
        <p class="workspace-entry__desc">鎷艰眴鍥剧焊瀵煎叆銆佸樊寮傛牎瀵瑰拰鍒嗘澘鏁寸悊缁х画淇濈暀銆?</p>
      </router-link>

      <router-link to="/device-control" class="workspace-entry">
        <span class="glx-icon-chip glx-icon-chip--paper workspace-entry__icon">璁?</span>
        <strong class="workspace-entry__title">璁惧鍙戦€?</strong>
        <p class="workspace-entry__desc">璁惧杩炴帴銆侀厤缃戙€佸弬鏁板拰鐢绘澘妯″紡鍏ュ彛缁х画鐣欏湪缃戠珯绔€?</p>
      </router-link>
    </section>

    <section class="glx-section-card glx-section-card--stack">
      <div class="glx-section-head">
        <h2 class="glx-section-title">鎴戠殑浜戠椤圭洰</h2>
        <span class="glx-section-meta">{{ userStore.isLoggedIn ? `${projectStore.totalProjects} 涓猔 : "闇€鐧诲綍" }}</span>
      </div>

      <div v-if="!userStore.isLoggedIn" class="glx-empty-card">
        <strong class="glx-section-title">鐧诲綍鍚庡彲绠＄悊椤圭洰</strong>
        <p class="glx-page-shell__desc">宸ヤ綔鍙扮殑椤圭洰鍒楄〃銆佹€昏銆佽緟鍔╁鐞嗗拰鍙戝竷閾捐矾閮介渶瑕佺櫥褰曞悗缁х画浣跨敤銆?</p>
        <div class="glx-inline-actions">
          <router-link to="/login" class="glx-button glx-button--primary">鍘荤櫥褰?/router-link>
        </div>
      </div>

      <div v-else-if="projectStore.loading" class="glx-stack">
        <article v-for="index in 3" :key="index" class="glx-skeleton-card">
          <div class="glx-skeleton workspace-skeleton"></div>
          <div class="glx-skeleton workspace-skeleton"></div>
        </article>
      </div>

      <div v-else-if="projectStore.projects.length === 0" class="glx-empty-card">
        <strong class="glx-section-title">杩樻病鏈変簯绔」鐩?</strong>
        <p class="glx-page-shell__desc">鍏堜繚瀛樿崏绋挎垨浠庢ā鏉垮紑濮嬪垱浣滐紝杩欓噷灏变細鍑虹幇浣犵殑椤圭洰鍒楄〃銆?</p>
      </div>

      <div v-else class="glx-stack">
        <article v-for="item in projectStore.projects" :key="item.id" class="glx-list-card workspace-project-row">
          <img
            v-if="coverUrl(item.thumbnail_url).length > 0"
            :src="coverUrl(item.thumbnail_url)"
            alt="thumbnail"
            class="workspace-project-row__cover"
          />
          <div v-else class="workspace-project-row__cover workspace-project-row__cover--empty">鍥?</div>
          <div class="glx-list-card__copy">
            <strong class="glx-list-card__title">{{ projectName(item) }}</strong>
            <span class="glx-list-card__desc">{{ projectMeta(item) }}</span>
          </div>
          <div class="glx-inline-actions">
            <router-link :to="`/overview/${item.id}`" class="glx-button glx-button--ghost">鎬昏</router-link>
            <router-link :to="`/editor/${item.id}`" class="glx-button glx-button--ghost">缂栬緫</router-link>
            <button type="button" class="glx-button glx-button--danger" @click="removeProject(item.id)">鍒犻櫎</button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useFeedback } from "@/composables/useFeedback.js";
import { useProjectStore } from "@/stores/project.js";
import { useUserStore } from "@/stores/user.js";

const feedback = useFeedback();
const projectStore = useProjectStore();
const userStore = useUserStore();

function coverUrl(value) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return "";
}

function projectName(item) {
  if (typeof item.name === "string" && item.name.length > 0) {
    return item.name;
  }
  return "鏈懡鍚嶉」鐩?";"
}

function projectMeta(item) {
  const parts = [];

  if (typeof item.width === "number" && typeof item.height === "number") {
    parts.push(`${item.width} 脳 ${item.height}`);
  }

  if (typeof item.status === "string" && item.status.length > 0) {
    parts.push(item.status);
  }

  if (typeof item.updated_at === "string" && item.updated_at.length > 0) {
    parts.push(item.updated_at.slice(0, 10));
  }

  return parts.join(" 路 ");
}

async function removeProject(id) {
  const response = await projectStore.removeProject(id);
  if (response.success) {
    feedback.success("鍒犻櫎鎴愬姛"", "椤圭洰宸茬粡浠庝簯绔」鐩垪琛ㄤ腑绉婚櫎銆?")";"
    return;
  }

  feedback.error("鍒犻櫎澶辫触"", "椤圭洰娌℃湁鎴愬姛鍒犻櫎銆?")";"
}

onMounted(async () => {
  await userStore.init();
  if (userStore.isLoggedIn) {
    await projectStore.loadProjects();
  }
});
</script>

<style scoped>
.workspace-entry {
  border: var(--glx-shell-border-strong);
  background: #ffffff;
  box-shadow: var(--glx-shadow-card);
  padding: 22px;
  text-decoration: none;
  color: inherit;
  display: grid;
  gap: 12px;
}

.workspace-entry__icon {
  font-size: 20px;
  font-weight: 900;
}

.workspace-entry__title {
  font-size: 22px;
  font-weight: 900;
  color: var(--nb-ink);
}

.workspace-entry__desc {
  font-size: 14px;
  line-height: 1.8;
  color: var(--nb-text-secondary);
}

.workspace-project-row {
  align-items: center;
}

.workspace-project-row__cover {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border: 2px solid #111111;
  flex-shrink: 0;
}

.workspace-project-row__cover--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  font-size: 20px;
  font-weight: 900;
}

.workspace-skeleton {
  min-height: 18px;
}
</style>
