<template>
  <div class="design-system-page">
    <div class="container">
      <div class="ds-shell">
        <section class="ds-page-head">
          <div class="ds-page-head__brand">
            <BrandLogo variant="page" />
            <div class="ds-page-head__copy">
              <span class="ds-page-head__eyebrow">鍏夋牸鍍忕礌宸ュ潑缁勪欢瑙勮寖绔?</span>
              <h1 class="ds-page-head__title">瀹樼綉鍐呮寮忕粍浠堕〉</h1>
              <p class="ds-page-head__desc">鍙繚鐣欐寮忕粍浠惰鐩栥€佺姸鎬佸拰瑙勫垯锛屼笉鍐嶅爢澶氫綑瑙ｉ噴鍧椼€?</p>
            </div>
          </div>

          <div class="ds-page-head__meta">
            <span class="ds-page-head__meta-label">褰撳墠鍩虹嚎</span>
            <strong class="ds-page-head__meta-title">涓婁竴鐗堢湡瀹炵粨鏋?+ 鏇磋交闃村奖</strong>
            <p class="ds-page-head__meta-copy">宸︿晶鍒囩粍锛屽彸渚х洿鎺ョ湅姝ｅ紡缁勪欢涓?uniapp 绾︽潫銆?</p>
          </div>
        </section>

        <div class="ds-workspace">
          <aside class="ds-sidebar">
            <div class="ds-sidebar__head">
              <span class="ds-sidebar__eyebrow">鍒嗙粍瀵艰埅</span>
              <h2 class="ds-sidebar__title">缁勪欢鐩綍</h2>
              <p class="ds-sidebar__desc">浼樺厛琛ヨ鐩栵紝涓嶈绌鸿瘽銆?</p>
            </div>

            <DesignSystemTabs v-model="activeTab" :tabs="tabs" />
          </aside>

          <div class="ds-content">
            <section class="ds-content__intro">
              <span class="ds-content__eyebrow">褰撳墠鍒嗙粍</span>
              <h2 class="ds-content__title">{{ currentTab.label }}</h2>
              <p class="ds-content__desc">{{ currentTab.description }}</p>
            </section>

            <DesignSystemOverviewPanel v-if="isOverviewPanel" :section-key="activeTab" />
            <DesignSystemLayoutPanel v-else-if="isLayoutPanel" :section-key="activeTab" />
            <DesignSystemControlsPanel v-else-if="isControlsPanel" :section-key="activeTab" />
            <DesignSystemFeedbackPanel v-else :section-key="activeTab" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import BrandLogo from "@/components/BrandLogo.vue";
import DesignSystemTabs from "@/components/design-system/DesignSystemTabs.vue";
import DesignSystemOverviewPanel from "@/components/design-system/DesignSystemOverviewPanel.vue";
import DesignSystemLayoutPanel from "@/components/design-system/DesignSystemLayoutPanel.vue";
import DesignSystemControlsPanel from "@/components/design-system/DesignSystemControlsPanel.vue";
import DesignSystemFeedbackPanel from "@/components/design-system/DesignSystemFeedbackPanel.vue";
import "@/assets/styles/design-system.css";

const tabs = [
  { key: "overview"", label: "鎬昏"", description: "鍏堢湅姝ｅ紡鑹层€佸浘鏍囧拰澹冲眰璇硶銆?" },"
  { key: "colors", label: "鑹插僵涓庨鏍?, description: "涓绘搷浣滈粍銆佺紪杈戣摑鍜屽洓绫荤姸鎬佽壊缁熶竴鏀跺彛銆? },
  { key: "icons", label: "鍥炬爣涓庡簳鏉?, description: "鍥炬爣銆佸簳鏉垮拰鍝佺墝璇硶鍦ㄨ繖閲岄泦涓湅銆? },
  { key: "headers", label: "澶撮儴涓庡鑸?, description: "瀹樼綉瀵艰埅銆侀《閮?tabs銆侀〉澶村拰鍒楄〃鍏ュ彛閮藉湪杩欎竴缁勩€? },
  { key: "buttons"", label: "鎸夐挳绯荤粺"", description: "鎸夐挳灏哄銆侀槾褰卞拰璇箟 modifier 鍏ㄩ儴鍙鐢ㄣ€?" },"
  { key: "controls"", label: "鎺т欢绯荤粺"", description: "杈撳叆銆侀€夋嫨銆佸紑鍏炽€佹粦鍧椼€佹杩涘拰鍕鹃€夌粍鐩存帴鍙搷浣溿€?" },"
  { key: "lists", label: "鍒楄〃涓庡崱鐗?, description: "鍏ュ彛鍗°€佸垪琛ㄨ鍜岀┖鐘舵€佺户缁部鐢ㄦ棫缁撴瀯銆? },
  { key: "skeletons", label: "楠ㄦ灦涓庡姞杞?, description: "楠ㄦ灦銆佸僵鑹?loader 鍜屽姩浣滆交閬僵缁熶竴鐪嬨€? },
  { key: "feedback", label: "寮圭獥涓庡弽棣?, description: "Toast銆丏ialog 鍜岀姸鎬佸弽棣堝叏閮ㄥ洖鍒版爣鍑嗚涔夈€? },
  { key: "rules"", label: "缁熶竴瑙勫垯"", description: "闆嗕腑鐪?uniapp 宸查攣瀹氱殑鏍峰紡纭害鏉熴€?" },"
];

const activeTab = ref("overview");
const overviewTabKeys = ["overview", "colors", "icons"];
const layoutTabKeys = ["headers", "lists"];
const controlsTabKeys = ["buttons", "controls"];

const isOverviewPanel = computed(() => overviewTabKeys.includes(activeTab.value));
const isLayoutPanel = computed(() => layoutTabKeys.includes(activeTab.value));
const isControlsPanel = computed(() => controlsTabKeys.includes(activeTab.value));
const currentTab = computed(() => {
  const matchedTab = tabs.find((item) => item.key === activeTab.value);
  if (matchedTab) {
    return matchedTab;
  }
  return tabs[0];
});
</script>

<style scoped>
.design-system-page {
  padding: 24px 0 48px;
}
</style>
