<template>
  <div class="home">
    <section class="hero"  style="display: none;">
      <div class="container">
        <h1 class="hero-title">鍏夋牸鍍忕礌宸ュ潑</h1>
        <p class="hero-subtitle">鍍忕礌鍐呭鍒涗綔涓庤澶囪繛鎺ュ钩鍙?</p>
        <p class="hero-desc">
          鎻愪緵鍍忕礌鍐呭缂栬緫銆佸浘鐗囩敓鎴愩€佺ぞ鍖哄睍绀轰笌璁惧杩炴帴鑳藉姏锛岀敤鎴峰畬鎴愯繛鎺ュ悗鍗冲彲鐩存帴浣跨敤璁惧鍔熻兘
        </p>
        <div class="hero-actions">
          <router-link to="/create" class="btn btn-primary"
            >寮€濮嬪垱浣?/router-link
          >
          <router-link to="/community" class="btn btn-outline"
            >娴忚绀惧尯</router-link
          >
        </div>
      </div>
    </section>

    <section class="features"  style="display: none;">
      <div class="container">
        <h2 class="section-title">鏍稿績鍔熻兘</h2>
        <div class="feature-grid">
          <div class="feature-card" v-for="f in features" :key="f.title">
            <div class="feature-icon" v-html="f.icon"></div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="showcase" v-if="artworks.length" style="display: none;">
      <div class="container">
        <h2 class="section-title">绮鹃€変綔鍝?</h2>
        <div class="artwork-grid">
          <div class="artwork-card" v-for="item in artworks" :key="item.id" @click="$router.push(`/artwork/${item.id}`)">
            <div
              class="artwork-img"
              :style="item.cover_url"
                ? `background-image:url(${item.cover_url});background-size:cover;background-position:center;background-color:#f5f5f5`
                : 'background:#f5f5f5'""
            ></div>
            <div class="artwork-info">
              <span class="artwork-title">{{
                item.title || "鏈懡鍚嶄綔鍝?"
              }}</span>
              <span class="artwork-author">{{ item.author_name || "鍖垮悕" }}</span>
            </div>
          </div>
        </div>
        <div class="center">
          <router-link to="/community" class="btn btn-outline"
            >鏌ョ湅鏇村</router-link
          >
        </div>
      </div>
    </section>

    <section class="hardware">
      <div class="container">
        <h2 class="section-title">璁惧杩炴帴涓庝娇鐢?</h2>
        <p class="section-desc">
          璁惧鐢辨垜浠畬鎴愭暣鏈鸿璁′笌璋冭瘯锛岀敤鎴峰彧闇€瑕佽繛鎺ヨ澶囥€侀€夋嫨鍐呭骞跺悓姝ユ樉绀?        </p>
        <div class="hardware-grid">
          <div
            class="hardware-card"
            v-for="spec in hardwareSpecs"
            :key="spec.label"
          >
            <div class="spec-icon" v-html="spec.icon"></div>
            <div class="spec-label">{{ spec.label }}</div>
            <div class="spec-value">{{ spec.value }}</div>
          </div>
        </div>
        <div class="hardware-steps">
          <div class="step" v-for="(step, i) in setupSteps" :key="i">
            <div class="step-num">{{ i + 1 }}</div>
            <div class="step-text">{{ step }}</div>
          </div>
        </div>
        <div class="center">
          <router-link to="/device-control" class="btn btn-primary"
            >杩炴帴璁惧</router-link
          >
          <router-link to="/pattern-workbench" class="btn btn-outline"  style="display: none;"
            >鎷艰眴宸ヤ綔鍙?/router-link
          >
        </div>
      </div>
    </section>

    <section class="about">
      <div class="container">
        <h2 class="section-title">鍏充簬鍏夋牸鍍忕礌宸ュ潑</h2>
        <p class="about-text">
          鍏夋牸鍍忕礌宸ュ潑闈㈠悜鐢ㄦ埛鎻愪緵鍐呭缂栬緫銆佸浘鐗囩敓鎴愩€佺ぞ鍖烘祻瑙堛€佽澶囪繛鎺ヤ笌甯哥敤鎺у埗鑳藉姏銆?          璁惧鏈韩鐢辨垜浠畬鎴愭暣鏈烘柟妗堣璁′笌瀹炵幇锛岀敤鎴锋棤闇€浜嗚В缁勮杩囩▼锛岃繛鎺ュ悗鍗冲彲鐩存帴浣跨敤銆?        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { artworkAPI } from "@/api/index.js";

const features = [
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`,
    title: "鍍忕礌缂栬緫鍣?,"
    desc: "64脳64 鐢诲竷锛屾敮鎸佺敾绗斻€佹鐨摝銆佸～鍏呫€佸浘鐗囧鍏?,"
  },
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    title: "鎷艰眴鍥剧焊",
    desc: "妗岄潰绔紭鍏堜繚鐣欏浘绾歌瘑鍒€佹嫾璞嗘暣鐞嗗拰鍙戦€佸墠妫€鏌ヨ兘鍔?,"
  },
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    title: "鍥剧墖澶勭悊",
    desc: "瀵煎叆浠绘剰鍥剧墖锛屾櫤鑳借浆鎹负鍍忕礌鍥炬",
  },
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    title: "绀惧尯鍒嗕韩",
    desc: "鍙戝竷浣滃搧銆佺偣璧炶瘎璁恒€佸叧娉ㄥ垱浣滆€?,"
  },
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    title: "璁惧杩炴帴",
    desc: "杩炴帴璁惧鍚庡嵆鍙笅鍙戝唴瀹瑰苟杩涜甯哥敤鎺у埗",
  },
  {
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
    title: "杈规鐜╂硶",
    desc: "娴忚杈规鏍峰紡鍜岀ぞ鍖轰綔鍝侊紝涓棿涓讳綋鍐呭鐢变綘鑷繁鍐冲畾",
  },
];

const artworks = ref([]);

const hardwareSpecs = [
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="2"/><path d="M8 12h8M12 8v8"/></svg>`,
    label: "鏄剧ず瑙勬牸",
    value: "64 脳 64 鍍忕礌",
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`,
    label: "鏄剧ず褰㈠紡",
    value: "RGB 鍍忕礌鏄剧ず",
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`,
    label: "杩炴帴鏂瑰紡",
    value: "鐑偣閰嶇綉 + 灞€鍩熺綉杩炴帴",
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>`,
    label: "浣跨敤鏂瑰紡",
    value: "杩炴帴鍚庣洿鎺ユ帶鍒?,"
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    label: "鍐呭鍚屾",
    value: "缃戦〉 / 灏忕▼搴?,"
  },
  {
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`,
    label: "搴旂敤鍦烘櫙",
    value: "鍒涗綔灞曠ず / 鏃ュ父浜掑姩",
  },
];

const setupSteps = [
  "棣栨浣跨敤鍏堣繛鎺ヨ澶囩儹鐐瑰苟鎵撳紑 192.168.4.1 瀹屾垚閰嶇綉",
  "閫夋嫨鍥剧墖銆佹嫾璞嗗浘绾告垨鐢绘澘鍐呭杩涘叆妗岄潰鍒涗綔閾?,"
  "杩炴帴璁惧鍚庡彂閫佸埌鐢绘澘妯″紡骞剁珛鍗崇‘璁ゆ晥鏋?,"
  "澶嶆潅璁惧妯″紡缁х画淇濈暀缁?uniapp 璐熻矗",
];

onMounted(async () => {
  try {
    const res = await artworkAPI.getList({ page: 1, limit: 4 });
    if (res.success) artworks.value = res.data?.list || [];
  } catch (e) {
    /* ignore */
  }
});
</script>

<style scoped>
.container {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 0 24px;
}

.center {
  text-align: center;
  margin-top: 28px;
}

.home {
  padding: 24px 0 48px;
}

.hero {
  padding: 0 0 32px;
}

.hero .container {
  padding: 64px 40px;
  text-align: center;
  border: 4px solid var(--nb-ink);
  background: linear-gradient(90deg, rgba(255, 246, 214, 0.72), rgba(255, 255, 255, 0.98) 52%, rgba(237, 244, 255, 0.8));
  box-shadow: var(--nb-shadow-strong);
}

.hero-title {
  font-size: 64px;
  font-weight: 800;
  color: var(--nb-ink);
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.hero-subtitle {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 800;
  color: #333333;
}

.hero-desc {
  font-size: 16px;
  color: var(--nb-text-secondary);
  margin-top: 18px;
  max-width: 680px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 32px;
  flex-wrap: wrap;
}

.features {
  padding: 52px 0;
}

.section-title {
  text-align: center;
  font-size: 34px;
  font-weight: 800;
  color: var(--nb-ink);
  margin-bottom: 40px;
  letter-spacing: -0.02em;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 22px;
}

.feature-card {
  background: #ffffff;
  border: 3px solid var(--nb-ink);
  border-radius: 0;
  padding: 28px 24px;
  box-shadow: var(--nb-shadow-card);
}

.feature-icon {
  width: 56px;
  height: 56px;
  background: var(--nb-yellow);
  border: 3px solid var(--nb-ink);
  border-radius: 0;
  box-shadow: var(--nb-shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: var(--nb-ink);
}

.feature-card h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--nb-ink);
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 14px;
  color: var(--nb-text-secondary);
  line-height: 1.6;
}

.showcase {
  padding: 52px 0;
}

.artwork-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.artwork-card {
  background: #ffffff;
  border: 3px solid var(--nb-ink);
  border-radius: 0;
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--nb-shadow-card);
  transition: background-color 0.18s ease;
}

.artwork-card:hover {
  background: #f8f8f8;
}

.artwork-img {
  width: 100%;
  height: 176px;
  border-bottom: 3px solid var(--nb-ink);
}

.artwork-info {
  padding: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.artwork-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--nb-ink);
}

.artwork-author {
  font-size: 12px;
  color: var(--nb-text-secondary);
  flex-shrink: 0;
}

.about {
  padding: 52px 0;
}

.about-text {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  font-size: 15px;
  color: var(--nb-text-secondary);
  line-height: 1.8;
}

.hardware {
  padding: 52px 0;
}

.section-desc {
  text-align: center;
  color: var(--nb-text-secondary);
  margin-bottom: 40px;
  font-size: 16px;
}

.hardware-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 40px;
}

.hardware-card {
  background: #ffffff;
  border: 3px solid var(--nb-ink);
  border-radius: 0;
  padding: 24px;
  text-align: center;
  box-shadow: var(--nb-shadow-card);
}

.spec-icon {
  color: var(--nb-ink);
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
}

.spec-label {
  font-size: 13px;
  color: var(--nb-text-secondary);
  margin-bottom: 6px;
  font-weight: 700;
}

.spec-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--nb-ink);
}

.hardware-steps {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.step {
  flex: 1;
  min-width: 180px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: #ffffff;
  padding: 16px;
  border: 3px solid var(--nb-ink);
  border-radius: 0;
  box-shadow: var(--nb-shadow-soft);
}

.step-num {
  width: 28px;
  height: 28px;
  background: var(--nb-yellow);
  border: 2px solid var(--nb-ink);
  color: var(--nb-ink);
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 0;
}

.step-text {
  font-size: 14px;
  color: var(--nb-text-secondary);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }

  .home {
    padding: 16px 0 48px;
  }

  .hero {
    padding: 12px 0 36px;
  }

  .hero .container {
    padding: 32px 18px;
    box-shadow: var(--nb-shadow-strong);
  }

  .hero-title {
    font-size: 38px;
  }

  .hero-subtitle {
    font-size: 15px;
  }

  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .hero-actions .btn {
    width: 100%;
    max-width: 280px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .artwork-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hardware-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-title {
    font-size: 24px;
    margin-bottom: 24px;
  }

  .feature-card,
  .hardware-card,
  .artwork-card,
  .about .container,
  .step {
    border-radius: 0;
  }
}
</style>
