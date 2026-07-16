<template>
  <section class="ds-section">
    <div class="ds-section__head">
      <div>
        <h2 class="ds-section__title">瀵艰埅涓庡竷灞€</h2>
        <p class="ds-section__meta">鍏堟妸瀹樼綉瀵艰埅銆佺粍浠跺簱椤堕儴 tabs銆侀〉澶村拰鍒楄〃鍏ュ彛鍏ㄩ儴鎽嗘垚姝ｅ紡璇硶銆?</p>
      </div>
    </div>

    <article v-if="showHeaders" class="ds-card">
      <span class="ds-card__label">瀹樼綉椤跺眰瀵艰埅</span>
      <div class="ds-nav-preview">
        <span
          v-for="item in navItems"
          :key="item.label"
          class="ds-nav-preview__item"
          :class="{ 'is-active': item.active }"
        >
          {{ item.label }}
        </span>
      </div>
      <p class="ds-card__copy ds-card__copy--top-spaced">
        瀹樼綉鏈€椤跺眰瀵艰埅宸茬粡鍜岀粍浠跺簱椤堕儴 tabs 缁熶竴鎴愬悓涓€濂楅粍搴曟寜閽€変腑鎬併€?      </p>
    </article>

    <article v-if="showHeaders" class="ds-card ds-card--top-spaced">
      <span class="ds-card__label">缁勪欢搴撻《閮?Tabs</span>
      <div class="ds-top-tabs">
        <button
          v-for="item in topTabs"
          :key="item.label"
          type="button"
          class="ds-top-tab"
          :class="{ 'is-active': item.active }"
        >
          {{ item.label }}
        </button>
      </div>
      <p class="ds-card__copy ds-card__copy--top-spaced">
        缁勪欢搴撳唴閮?tabs 缁х画淇濈暀榛勫簳鎸夐挳鎬侊紝瀹樼綉鏈€椤跺眰瀵艰埅涔熻窡杩欏璇硶瀵归綈銆?      </p>
    </article>

    <div v-if="showHeaders" class="ds-grid ds-grid--two">
      <article class="ds-example">
        <div class="ds-card ds-card--plain">
          <span class="ds-card__label">涓€绾ч〉澶撮儴</span>
          <div class="ds-header-preview">
            <div class="ds-header-preview__main">
              <span class="ds-icon-shell ds-icon-shell--primary">
                <DesignSystemGlyph name="home" />
              </span>
              <div class="ds-title-stack">
                <span class="ds-title-stack__title">鎺т欢搴?/ 缁勪欢瑙勮寖</span>
                <span class="ds-title-stack__desc">杩欐槸瀹樼綉閲岀殑姝ｅ紡椤甸潰锛屼絾瑙嗚缁х画鎸変笂涓€鐗堢‖鏈楄鑼冪珯鏀跺彛</span>
              </div>
            </div>
            <span class="ds-inline-note">瀹樼綉鍐呮寮忛〉澶?</span>
          </div>
          <div class="ds-toolbar">
            <span class="ds-inline-note">鎼滅储鍜岀瓫閫夌户缁暀鍦ㄥ伐鍏峰眰</span>
            <span class="ds-inline-note">涓嶅啀棰濆鍫嗘爣绛炬璇存槑鑷繁鏄粈涔堥〉</span>
          </div>
        </div>
      </article>

      <article class="ds-example">
        <div class="ds-card ds-card--plain">
          <span class="ds-card__label">浜岀骇椤靛ご閮?</span>
          <div class="ds-header-preview">
            <div class="ds-header-preview__main">
              <span class="ds-icon-shell">
                <DesignSystemGlyph name="arrow-left" />
              </span>
              <div class="ds-title-stack">
                <span class="ds-title-stack__title">璁惧鍙傛暟</span>
                <span class="ds-title-stack__desc">宸﹁繑鍥?/ 涓爣棰?/ 鍙充晶灏介噺淇濇寔骞插噣</span>
              </div>
            </div>
            <span class="ds-inline-note">浜岀骇椤靛ご閮?</span>
          </div>
          <div class="ds-inline-list">
            <span>鍩虹鍙傛暟</span>
            <span>浜害涓庢椂闂?</span>
            <span>缃戠粶</span>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showHeaders" class="ds-grid ds-grid--two ds-grid--spaced">
      <article class="ds-card">
        <span class="ds-card__label">Logo.vue / BrandLogo</span>
        <div class="ds-brand-showcase">
          <BrandLogo variant="page" />
          <div class="ds-brand-showcase__meta">
            <span class="ds-inline-note">涓枃涓绘爣 + 榛勫簳鑻辨枃鏍囩缁х画淇濈暀</span>
            <span class="ds-inline-note">瀹樼綉涓?uniapp 鐨勫搧鐗屽３缁熶竴鐓ц繖涓€鐗堣蛋</span>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">LegacyTabBar.vue</span>
        <div class="ds-legacy-tabbar">
          <div
            v-for="item in legacyTabItems"
            :key="item.label"
            class="ds-legacy-tabbar__item"
          >
            <span class="ds-legacy-tabbar__icon" :class="{ 'is-active': item.active }">
              <DesignSystemGlyph :name="item.icon" />
            </span>
            <span class="ds-legacy-tabbar__label" :class="{ 'is-active': item.active }">
              {{ item.label }}
            </span>
          </div>
        </div>
        <p class="ds-card__copy ds-card__copy--top-spaced">
          灏忕▼搴忓簳閮?tab 鍏堝榻愭棫鍘熺敓瑙傛劅锛屽彧鍒囧浘鏍囧拰瀛楄壊锛屼笉鍋氶粍搴曟暣鍧楅€変腑銆?        </p>
      </article>
    </div>

    <div v-if="showLists" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">鍒楄〃涓庡崱鐗囪娉?</h3>
        <p class="ds-section__meta">鐧藉簳榛戣竟銆佺粺涓€纭槾褰便€佹竻妤氬垎鍖猴紝涓嶅啀鍥炲埌鏌斿拰鍦嗚涓撻椤佃娉?</p>
      </div>
    </div>

    <div v-if="showLists" class="ds-grid ds-grid--two">
      <div class="ds-showcase">
        <div class="ds-list-card">
          <div class="ds-list-card__main">
            <span class="ds-icon-shell ds-icon-shell--blue">
              <DesignSystemGlyph name="setting" />
            </span>
            <div class="ds-list-card__copy">
              <span class="ds-list-card__title">璁惧鍙傛暟</span>
              <span class="ds-list-card__desc">璇存槑鏂囧瓧鏀惰繘鍓爣棰橈紝涓嶅湪鏍囬鍖哄爢婊￠澶栨爣绛俱€?</span>
            </div>
          </div>
          <div class="ds-list-card__meta">
            <span>鏌ョ湅</span>
            <DesignSystemGlyph name="arrow-right" />
          </div>
        </div>

        <div class="ds-list-card ds-list-card--spaced">
          <div class="ds-list-card__main">
            <span class="ds-icon-shell ds-icon-shell--info">
              <DesignSystemGlyph name="profile" />
            </span>
            <div class="ds-list-card__copy">
              <span class="ds-list-card__title">鐢ㄦ埛涓績鍏ュ彛</span>
              <span class="ds-list-card__desc">鍥炬爣澹充粛鐒舵竻妤氾紝浣嗗ぇ灏忋€侀槾褰便€佽竟妗嗗叏閮ㄨ窡鍚岀粍缁熶竴銆?</span>
            </div>
          </div>
          <div class="ds-list-card__meta">
            <span>杩涘叆</span>
            <DesignSystemGlyph name="arrow-right" />
          </div>
        </div>
      </div>

      <div class="ds-showcase">
        <div class="ds-empty">
          <span class="ds-icon-shell ds-icon-shell--primary">
            <DesignSystemGlyph name="picture" />
          </span>
          <strong class="ds-card__title ds-card__title--compact">杩樻病鏈夊唴瀹?</strong>
          <span class="ds-card__copy">绌虹姸鎬佺户缁窡闅忛粦杈圭‖澹宠娉曪紝涓嶅仛榛樿鐏板ぇ澹筹紝涔熶笉鍫嗗ぇ娈佃鏄庛€?</span>
        </div>
      </div>
    </div>

    <div v-if="showLists" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">涓氬姟鍗＄墖瀹舵棌</h3>
        <p class="ds-section__meta">杩欎簺鏄?uniapp 閲屽凡缁忔敼杩囬鏍肩殑瀹為檯澹冲眰锛屽繀椤诲湪缁勪欢搴撻噷瀹氭澘鍚庡啀鏄犲皠鍥為〉闈€?</p>
      </div>
    </div>

    <div v-if="showLists" class="ds-grid ds-grid--three">
      <article class="ds-card">
        <span class="ds-card__label">ProjectCard.vue</span>
        <div class="ds-project-card">
          <div class="ds-project-card__media">
            <div class="ds-project-card__grid"></div>
            <div class="ds-project-card__thumb">
              <div class="ds-project-card__pixels">
                <span v-for="cell in projectPixels" :key="cell" :style="{ backgroundColor: cell }"></span>
              </div>
            </div>
            <span class="ds-project-card__badge ds-project-card__badge--published">宸插彂甯?</span>
            <span class="ds-project-card__progress"><span></span></span>
          </div>
          <div class="ds-project-card__body">
            <strong class="ds-project-card__title">鍍忕礌鎷艰眴鍥剧焊</strong>
            <div class="ds-project-card__meta">
              <span>64脳64</span>
              <span>4/18</span>
            </div>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">ArtworkCard.vue</span>
        <div class="ds-artwork-card">
          <div class="ds-artwork-card__media">
            <div class="ds-artwork-card__art"></div>
            <span class="ds-artwork-card__pill">绀惧尯浣滃搧</span>
          </div>
          <div class="ds-artwork-card__body">
            <strong class="ds-card__title ds-card__title--compact">闇撹櫣鍍忕礌琛楀尯</strong>
            <div class="ds-artwork-card__author">
              <span class="ds-avatar-shell ds-avatar-shell--sm">GX</span>
              <span>鍏夋牸鍍忕礌宸ュ潑鐢ㄦ埛</span>
            </div>
            <div class="ds-artwork-card__stats">
              <span>1.2k 鍠滄</span>
              <span>84 璇勮</span>
              <span>4.6k 娴忚</span>
            </div>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">TemplateCard.vue</span>
        <div class="ds-template-card">
          <div class="ds-template-card__media">
            <div class="ds-template-card__preview"></div>
            <span class="ds-status-pill ds-status-pill--warning">涓瓑</span>
          </div>
          <div class="ds-template-card__body">
            <strong class="ds-card__title ds-card__title--compact">闇撹櫣澶╂皵妯℃澘</strong>
            <div class="ds-template-card__facts">
              <span>64脳64</span>
              <span>12 鑹?</span>
              <span>2.3k 浣跨敤</span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showLists" class="ds-grid ds-grid--two ds-grid--spaced">
      <article class="ds-card">
        <span class="ds-card__label">ChallengeCard.vue</span>
        <div class="ds-challenge-card">
          <div class="ds-challenge-card__banner">
            <div class="ds-challenge-card__overlay"></div>
            <span class="ds-challenge-card__status">杩涜涓?</span>
            <span class="ds-icon-shell ds-icon-shell--warning ds-challenge-card__icon">
              <DesignSystemGlyph name="work" />
            </span>
          </div>
          <div class="ds-challenge-card__body">
            <strong class="ds-card__title ds-card__title--compact">鍍忕礌鏄ユ棩鎸戞垬</strong>
            <p class="ds-card__copy">妯箙銆佺姸鎬佽鏍囥€佽鏄庡拰 CTA 缁х画鎸夌‖杈圭粨鏋勬敹鍙ｃ€?</p>
            <div class="ds-challenge-card__meta">
              <span>3.2k 浜哄弬涓?</span>
              <span>杩樺墿 6 澶?</span>
              <span>濂栧姳妯℃澘鍖?</span>
            </div>
          </div>
          <div class="ds-challenge-card__foot">
            <button type="button" class="ds-btn ds-btn--primary ds-btn--sm ds-shadow--sm">绔嬪嵆鍙備笌</button>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">Avatar / Comment.vue</span>
        <div class="ds-comment-card">
          <span class="ds-avatar-shell">GX</span>
          <div class="ds-comment-card__body">
            <div class="ds-comment-card__head">
              <strong>鍏夋牸鍍忕礌宸ュ潑鐢ㄦ埛</strong>
              <span>鍒氬垰</span>
            </div>
            <p class="ds-card__copy">澶村儚鍏佽淇濈暀鍦嗗舰锛屼絾澶栧洿淇℃伅鍧椼€佽瘎璁哄潡鍜屾搷浣滆缁х画鎸夌櫧搴曢粦杈圭洿瑙掍綋绯绘敹鍙ｃ€?</p>
            <div class="ds-comment-card__actions">
              <span class="ds-inline-note">鐐硅禐</span>
              <span class="ds-inline-note">鍥炲</span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showLists" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">棰勮涓庣紪杈戝３灞?</h3>
        <p class="ds-section__meta">PixelPreviewBoard銆両mageCropper銆佹椂閽熻缃崱杩欎簺鐗规畩澹冲眰涔熻鍏堝湪缁勪欢搴撻噷瀹氭澘銆?</p>
      </div>
    </div>

    <div v-if="showLists" class="ds-grid ds-grid--two">
      <article class="ds-card">
        <span class="ds-card__label">PixelPreviewBoard / PixelCanvas</span>
        <div class="ds-preview-shell">
          <div class="ds-preview-shell__screen">
            <div class="ds-preview-shell__pixels">
              <span v-for="cell in previewPixels" :key="cell.id" :style="{ backgroundColor: cell.color }"></span>
            </div>
          </div>
          <div class="ds-preview-shell__meta">
            <strong>64 脳 64 棰勮鏉?</strong>
            <span>榛戝簳棰勮銆佺粺涓€鐣欒竟銆佸儚绱犲眳涓€?</span>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">ImageCropper / Clock Settings</span>
        <div class="ds-editor-stack">
          <div class="ds-cropper-shell">
            <div class="ds-cropper-shell__image"></div>
            <div class="ds-cropper-shell__frame"></div>
          </div>
          <div class="ds-setting-card">
            <strong>ClockTextSettingsCard.vue</strong>
            <span>瀛楀彿銆佷綅缃€侀厤鑹插拰鏂囨湰瀛楁浠嶇劧鎸夌粺涓€璁剧疆鍗¤娉曟敹鍙ｃ€?</span>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">ClockThemePanel.vue</span>
        <div class="ds-theme-panel">
          <div class="ds-theme-panel__head">
            <strong>涓婚搴?</strong>
            <span>3 涓富棰?</span>
          </div>
          <div class="ds-theme-panel__grid">
            <div
              v-for="item in themeCards"
              :key="item.name"
              class="ds-theme-card"
              :class="{ 'is-active': item.active }"
            >
              <div class="ds-theme-card__preview" :class="item.previewClass"></div>
              <span class="ds-theme-card__name">{{ item.name }}</span>
              <span v-if="item.badge" class="ds-theme-card__badge">{{ item.badge }}</span>
            </div>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">ClockFontPanel.vue</span>
        <div class="ds-font-panel">
          <div class="ds-font-panel__list">
            <div
              v-for="item in fontCards"
              :key="item.name"
              class="ds-font-card"
              :class="{ 'is-active': item.active }"
            >
              <div class="ds-font-card__preview" :class="item.previewClass">{{ item.sample }}</div>
              <span class="ds-font-card__name">{{ item.name }}</span>
            </div>
          </div>
          <div class="ds-font-panel__settings">
            <div class="ds-font-panel__row">
              <span>鏄剧ず绉掗挓</span>
              <span class="ds-font-panel__toggle is-active">寮€鍚?</span>
            </div>
            <div class="ds-choice-row">
              <button type="button" class="ds-choice-chip is-active">24 灏忔椂</button>
              <button type="button" class="ds-choice-chip">12 灏忔椂</button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showHeaders" class="ds-grid ds-grid--three ds-grid--spaced">
      <article v-for="item in rules" :key="item.title" class="ds-card">
        <span class="ds-card__label">{{ item.label }}</span>
        <span class="ds-card__title">{{ item.title }}</span>
        <p class="ds-card__copy">{{ item.copy }}</p>
      </article>
    </div>

    <div v-if="showHeaders" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">Uniapp 椋庢牸纭害鏉?</h3>
        <p class="ds-section__meta">缃戦〉缁勪欢搴撶洿鎺ユ壙鎺ュ皬绋嬪簭鐨勬寮忚鍒欙紝涓嶅彟璧蜂竴濂楄В閲婂彛寰勩€?</p>
      </div>
    </div>

    <div v-if="showHeaders" class="ds-grid ds-grid--three">
      <article v-for="item in guardrails" :key="item.title" class="ds-card">
        <span class="ds-card__label">{{ item.label }}</span>
        <span class="ds-card__title">{{ item.title }}</span>
        <p class="ds-card__copy">{{ item.copy }}</p>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import BrandLogo from "@/components/BrandLogo.vue";
import DesignSystemGlyph from "./DesignSystemGlyph.vue";

const props = defineProps({
  sectionKey: {
    type: String,
    required: true,
  },
});

const showHeaders = computed(() => props.sectionKey === "headers");
const showLists = computed(() => props.sectionKey === "lists");

const rules = [
  {
    label: "瀹樼綉鍩虹嚎",
    title: "鏁寸珯涓庢帶浠跺簱涓€璧峰洖鍒颁笂涓€鐗堝熀绾?,"
    copy: "瑙勮寖绔欒櫧鐒舵寕鍦ㄥ畼缃戦噷锛屼絾鏁寸珯閮界户缁部鐢ㄧ櫧搴曢粦杈圭‖闃村奖锛屼笉鍐嶅垎鎴愪袱绉嶄骇鍝佹皵璐ㄣ€?,"
  },
  {
    label: "闃村奖瑙勫垯",
    title: "闃村奖缁熶竴鍒嗕笁绾?,"
    copy: "瀵艰埅銆乼abs銆佸崱鐗囥€佸脊绐楀垎鍒搴斿浐瀹?shadow token锛屼笉鍐嶅悓灞傜骇蹇藉ぇ蹇藉皬銆?,"
  },
  {
    label: "甯冨眬瑙勫垯",
    title: "缁撴瀯娓呮锛屼絾涓嶅仛鏌斿拰涓撻椤?,"
    copy: "涓嶅啀鍫嗙幓鐠冩劅鑳屾櫙鍜屽ぇ鍦嗚鍗＄墖锛岄噸鐐瑰洖鍒板彲鏌ラ槄銆佸彲鎵╁睍銆佸彲缁存姢鐨勮鑼冪珯缁撴瀯銆?,"
  },
];

const navItems = [
  { label: "棣栭〉" },
  { label: "宸ヤ綔鍙?" },"
  { label: "璁惧" },
  { label: "绀惧尯" },
  { label: "鎺т欢搴?", active: true" },"
  { label: "妯℃澘" },
  { label: "鎸戞垬" },
];

const topTabs = [
  { label: "鎬昏" },
  { label: "鎺т欢", active: true },
  { label: "鍙嶉" },
  { label: "瑙勫垯" },
];

const legacyTabItems = [
  { label: "棣栭〉", icon: "home" },
  { label: "绀惧尯", icon: "community" },
  { label: "鍒涗綔", icon: "edit" },
  { label: "璁惧", icon: "device" },
  { label: "鎴戠殑", icon: "profile", active: true },
];

const projectPixels = [
  "#111111",
  "#111111",
  "#ffcb45",
  "#ffcb45",
  "#111111",
  "#111111",
  "#111111",
  "#5ea8ff",
  "#5ea8ff",
  "#111111",
  "#67c23a",
  "#67c23a",
  "#f56c6c",
  "#f56c6c",
  "#111111",
  "#111111",
];

const previewPixels = [
  { id: "p1", color: "#111111" },
  { id: "p2", color: "#ffcb45" },
  { id: "p3", color: "#5ea8ff" },
  { id: "p4", color: "#111111" },
  { id: "p5", color: "#67c23a" },
  { id: "p6", color: "#111111" },
  { id: "p7", color: "#f56c6c" },
  { id: "p8", color: "#111111" },
  { id: "p9", color: "#111111" },
  { id: "p10", color: "#5ea8ff" },
  { id: "p11", color: "#ffcb45" },
  { id: "p12", color: "#111111" },
  { id: "p13", color: "#111111" },
  { id: "p14", color: "#67c23a" },
  { id: "p15", color: "#f56c6c" },
  { id: "p16", color: "#111111" },
];

const themeCards = [
  { name: "缁忓吀", previewClass: "ds-theme-card__preview--classic", active: true, badge: "褰撳墠" },
  { name: "鍥剧焊", previewClass: "ds-theme-card__preview--planet", badge: "鍥剧墖" },
  { name: "闇撹櫣", previewClass: "ds-theme-card__preview--neon" },
];

const fontCards = [
  { name: "鍍忕礌鏂规", sample: "12:34", previewClass: "ds-font-card__preview--mono", active: true },
  { name: "鍦嗙偣灞?", sample: "12:34"", previewClass: "ds-font-card__preview--dot"" },"
  { name: "绐勪綋灞?", sample: "12:34"", previewClass: "ds-font-card__preview--condensed"" },"
];

const guardrails = [
  {
    label: "鐩磋璇硶",
    title: "涓嶅仛鍦嗚鑳跺泭鍜屾紓娴渾澹?,"
    copy: "缃戦〉缁勪欢搴撻噷鐨勬寜閽€乼abs銆佸崱鐗囥€佸垪琛ㄩ」榛樿閮戒繚鎸佺洿瑙掑潡闈紝鍚庣画鏄犲皠鍒?uniapp 涔熶笉鍐嶄复鏃跺渾瑙掑寲銆?,"
  },
  {
    label: "鐐瑰嚮鍙嶉",
    title: "绂佹鎸夊帇浣嶇Щ銆佺缉鏀俱€佹姈鍔?,"
    copy: "鎵€鏈夊叆鍙ｃ€佹寜閽€佽繑鍥為敭銆侀《閮ㄥ鑸拰 tabs 閮藉彧鏀归鑹叉垨瀛楅噸锛屼笉鍐嶉潬 transform 鍒堕€犵偣鍑绘劅銆?,"
  },
  {
    label: "鍒嗙粍璇箟",
    title: "鍔熻兘椤靛簳閮?tabs 涓嶆槸榛勫簳鏁村潡閫変腑",
    copy: "瀹樼綉缁勪欢搴撳繀椤绘槑纭尯鍒嗙粍浠跺簱鍐呴儴 tabs 涓?uniapp 鍔熻兘椤靛簳閮?tabs锛岄伩鍏嶅悗缁縼鍥炲皬绋嬪簭鏃舵妸璇硶娣锋帀銆?,"
  },
];
</script>
