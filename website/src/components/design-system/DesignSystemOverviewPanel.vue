<template>
  <section class="ds-section">
    <div v-if="showPalette" class="ds-section__head">
      <div>
        <h2 class="ds-section__title">姝ｅ紡鑹叉澘</h2>
        <p class="ds-section__meta">缁勪欢搴撹壊鍊肩洿鎺ヨ窡褰撳墠椤圭洰 token 瀵归綈銆?</p>
      </div>
    </div>

    <div v-if="showPalette" class="ds-grid ds-grid--three">
      <article v-for="tone in tones" :key="tone.name" class="ds-card">
        <div class="ds-tone">
          <span class="ds-tone__swatch" :style="{ background: tone.color }"></span>
          <div>
            <span class="ds-tone__name">{{ tone.name }}</span>
            <span class="ds-tone__value">{{ tone.color }}</span>
            <span class="ds-code-tag">{{ tone.token }}</span>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showSurfaces" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">闈㈡澘涓庨槾褰?</h3>
        <p class="ds-section__meta">鍏堟妸鍩虹澹冲眰鍜岄槾褰?modifier 鎽嗗畬鏁淬€?</p>
      </div>
    </div>

    <div v-if="showSurfaces" class="ds-grid ds-grid--two">
      <article class="ds-card">
        <span class="ds-card__label">鍗＄墖闃村奖</span>
        <div class="ds-demo-stack">
          <div v-for="item in surfaceLevels" :key="item.label" class="ds-demo-row">
            <div class="ds-surface-demo" :class="item.className">
              <strong>{{ item.label }}</strong>
            </div>
            <span class="ds-code-tag">{{ item.className }}</span>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">闈㈡澘鑳屾櫙</span>
        <div class="ds-demo-stack">
          <div v-for="item in surfaceTones" :key="item.label" class="ds-demo-row">
            <div class="ds-surface-demo ds-shadow--sm" :class="item.className">
              <strong>{{ item.label }}</strong>
            </div>
            <span class="ds-code-tag">{{ item.className }}</span>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showIcons" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">鍥炬爣璇箟</h3>
        <p class="ds-section__meta">鍥炬爣搴曟澘鍜岀姸鎬佽壊涔熺洿鎺ヨ窡姝ｅ紡 token 璧般€?</p>
      </div>
    </div>

    <div v-if="showIcons" class="ds-icon-grid">
      <article v-for="icon in icons" :key="icon.label" class="ds-card ds-icon-card">
        <span class="ds-icon-shell" :class="icon.toneClass">
          <DesignSystemGlyph :name="icon.name" />
        </span>
        <strong class="ds-card__title ds-card__title--compact">{{ icon.label }}</strong>
        <span class="ds-code-tag">{{ icon.toneClass || "default" }}</span>
      </article>
    </div>

    <div v-if="showIcons" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">杩愯鎬佸浘鏍囧簱</h3>
        <p class="ds-section__meta">鏉ユ簮鍥哄畾涓?`uniapp/components/Icon.vue + static/iconfont/*`锛岃繖閲岀洿鎺ュ睍绀洪珮棰戣涔夋槧灏勩€?</p>
      </div>
    </div>

    <div v-if="showIcons" class="ds-grid ds-grid--two">
      <article class="ds-card">
        <span class="ds-card__label">楂橀璇箟鏄犲皠</span>
        <div class="ds-icon-audit">
          <div v-for="item in iconMappings" :key="item.semantic" class="ds-icon-audit__row">
            <div class="ds-icon-audit__main">
              <span class="ds-icon-shell" :class="item.toneClass">
                <DesignSystemGlyph :name="item.previewIcon" />
              </span>
              <div class="ds-icon-audit__copy">
                <strong>{{ item.semantic }}</strong>
                <span>{{ item.note }}</span>
              </div>
            </div>
            <span class="ds-code-tag">{{ item.fontToken }}</span>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">鍥炬爣璧勬簮鍐荤粨瑙勫垯</span>
        <div class="ds-demo-stack">
          <div v-for="item in iconRules" :key="item.title" class="ds-demo-row ds-demo-row--stack">
            <strong class="ds-card__title ds-card__title--compact">{{ item.title }}</strong>
            <span class="ds-card__copy">{{ item.copy }}</span>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showCoverage" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">瑕嗙洊鐩樼偣</h3>
        <p class="ds-section__meta">缁勪欢搴撳厛鍋氭垚鍞竴鍩虹嚎锛屽悗闈㈢綉绔欏拰 uniapp 閮芥寜杩欓噷鏇挎崲銆?</p>
      </div>
    </div>

    <div v-if="showCoverage" class="ds-grid ds-grid--three">
      <article v-for="group in coverageGroups" :key="group.title" class="ds-card">
        <span class="ds-card__label">{{ group.label }}</span>
        <span class="ds-card__title">{{ group.title }}</span>
        <ul class="ds-list ds-list--tight">
          <li v-for="item in group.items" :key="item">{{ item }}</li>
        </ul>
      </article>
    </div>

    <div v-if="showCoverage" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">鏉ユ簮缁勪欢瑕嗙洊鍙拌处</h3>
        <p class="ds-section__meta">鎶婂凡缁忓仛杩囬鏍兼敼鍔ㄧ殑鏉ユ簮缁勪欢鎸傝繘缁勪欢搴撳彴璐︼紝鍚庣画椤甸潰鍙兘鐓ц繖閲屾槧灏勩€?</p>
      </div>
    </div>

    <div v-if="showCoverage" class="ds-grid ds-grid--two">
      <article v-for="item in sourceAudits" :key="item.title" class="ds-card">
        <span class="ds-card__label">{{ item.label }}</span>
        <span class="ds-card__title">{{ item.title }}</span>
        <div class="ds-source-audit">
          <div v-for="entry in item.items" :key="entry.name" class="ds-source-audit__row">
            <div class="ds-source-audit__copy">
              <strong>{{ entry.name }}</strong>
              <span>{{ entry.preview }}</span>
            </div>
            <span class="ds-code-tag">宸插睍绀?</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import DesignSystemGlyph from "./DesignSystemGlyph.vue";

const props = defineProps({
  sectionKey: {
    type: String,
    required: true,
  },
});

const showPalette = computed(() => props.sectionKey === "overview" || props.sectionKey === "colors");
const showSurfaces = computed(() => props.sectionKey === "overview" || props.sectionKey === "colors");
const showIcons = computed(() => props.sectionKey === "overview" || props.sectionKey === "icons");
const showCoverage = computed(() => props.sectionKey === "overview");

const tones = [
  { name: "涓绘搷浣滈粍", color: "#FFCB45", token: "--nb-yellow" },
  { name: "缂栬緫钃?", color: "#5EA8FF"", token: "--nb-blue"" },"
  { name: "Info", color: "#909399", token: "--ds-info" },
  { name: "Success", color: "#67C23A", token: "--ds-success" },
  { name: "Warning", color: "#FFCB45", token: "--ds-warning" },
  { name: "Danger", color: "#F56C6C", token: "--ds-danger" },
];

const surfaceLevels = [
  { label: "鏃犻槾褰?", className: "ds-shadow--none"" },"
  { label: "杞婚槾褰?", className: "ds-shadow--sm"" },"
  { label: "鏍囧噯闃村奖", className: "ds-shadow--md" },
  { label: "寮鸿皟闃村奖", className: "ds-shadow--lg" },
];

const surfaceTones = [
  { label: "榛樿鐧藉簳", className: "ds-surface--default" },
  { label: "杞婚粍闈㈡澘", className: "ds-surface--yellow" },
  { label: "杞昏摑闈㈡澘", className: "ds-surface--blue" },
  { label: "娴呯伆闈㈡澘", className: "ds-surface--muted" },
];

const icons = [
  { name: "home", label: "榛樿鍏ュ彛", toneClass: "" },
  { name: "picture"", label: "涓诲己璋?", toneClass: "ds-icon-shell--primary"" },"
  { name: "edit", label: "缂栬緫璇箟", toneClass: "ds-icon-shell--blue" },
  { name: "sync", label: "Info", toneClass: "ds-icon-shell--info" },
  { name: "check", label: "Success", toneClass: "ds-icon-shell--success" },
  { name: "warning", label: "Warning", toneClass: "ds-icon-shell--warning" },
  { name: "trash", label: "Danger", toneClass: "ds-icon-shell--danger" },
];

const iconMappings = [
  { semantic: "picture"", previewIcon: "picture"", fontToken: "picture"", toneClass: "ds-icon-shell--primary"", note: "浣滃搧銆佺缉鐣ュ浘銆佺┖鐘舵€?" },"
  { semantic: "palette"", previewIcon: "palette"", fontToken: "adjust"", toneClass: "ds-icon-shell--warning"", note: "璋冭壊鏉裤€侀鑹查€夋嫨鍣?" },"
  { semantic: "check"", previewIcon: "check"", fontToken: "check-item"", toneClass: "ds-icon-shell--success"", note: "纭銆佸閫夈€佹垚鍔熸€?" },"
  { semantic: "trash"", previewIcon: "trash"", fontToken: "ashbin"", toneClass: "ds-icon-shell--danger"", note: "鍒犻櫎銆佹竻鐞嗐€佸嵄闄╁姩浣?" },"
  { semantic: "favorite"", previewIcon: "favorite"", fontToken: "favorite"", toneClass: "ds-icon-shell--info"", note: "鏀惰棌銆佺偣璧炪€佷綔鍝佺姸鎬?" },"
  { semantic: "link"", previewIcon: "link"", fontToken: "link"", toneClass: """, note: "璁惧杩炴帴銆佺綉缁滅姸鎬?" },"
  { semantic: "notification"", previewIcon: "notification"", fontToken: "notification"", toneClass: """, note: "娑堟伅銆佹彁閱掋€佹洿鏂?" },"
  { semantic: "work", previewIcon: "work", fontToken: "work", toneClass: "", note: "鎴愬氨銆佷换鍔°€佸伐浣滃彴鍏ュ彛" },
];

const iconRules = [
  {
    title: "璇箟鍏堟槧灏勶紝鍐嶈繘椤甸潰",
    copy: "椤甸潰瑕佺敤鏂板浘鏍囨椂锛屽厛琛ョ粍浠跺簱鍜?Icon 璇箟鏄犲皠锛屼笉鍐嶅湪涓氬姟椤甸噷鐩存帴涓存椂鎹竴涓浘銆?,"
  },
  {
    title: "鍥炬爣搴撳崟鐙睍绀?,"
    copy: "缁勪欢搴撳繀椤昏兘鐪嬭褰撳墠姝ｅ紡鍥炬爣鏃忓拰璇箟鏄犲皠锛屼笉鍏佽鍙湪椤甸潰閲岄浂鏁ｅ嚭鐜板嚑涓浘鏍囥€?,"
  },
  {
    title: "瀹氭澘鍚庣姝㈣嚜鐢卞彂鎸?,"
    copy: "涓€鏃﹁涔夈€侀鑹插拰搴曟澘鍦ㄧ粍浠跺簱閲屽畾涓嬫潵锛屽悗缁?uniapp 椤甸潰鍙兘鎸夎繖濂楁槧灏勪娇鐢ㄣ€?,"
  },
];

const coverageGroups = [
  {
    label: "鏉ユ簮鑼冨洿",
    title: "鏈疆鍐荤粨鐨勮瑙夎祫浜ф潵婧?,"
    items: [
      "uniapp/components",
      "uniapp/pages/*",
      "uniapp-rebuild/components",
      "uniapp/static/iconfont/*",
    ],
  },
  {
    label: "姝ｅ紡瑕嗙洊",
    title: "缁勪欢搴撳凡缁忛攣瀹氱殑灞曠ず鍩?,"
    items: [
      "鑹叉澘銆侀槾褰便€佺姸鎬佽壊銆佸浘鏍囧簳鏉?,"
      "瀹樼綉瀵艰埅銆丩egacyTabBar銆佸搧鐗?Logo",
      "杈撳叆銆佸紑鍏炽€佹粦鍧椼€佹杩涘櫒銆佽皟鑹叉澘銆佽壊褰╂嬀鍙栧櫒",
      "Project / Artwork / Template / Challenge 鍗＄墖瀹舵棌",
      "PixelPreviewBoard銆丳ixelCanvas銆両mageCropper銆佽澶囨帶鍒堕潰鏉?,"
      "Toast銆丮odal銆丆onnectModal銆丣sonImportModal銆丩oadingOverlay",
      "涔濆鏍?loader 涓庡姩浣滆交閬僵",
    ],
  },
  {
    label: "鍐荤粨瑙勫垯",
    title: "缁勪欢搴撴垚涓哄敮涓€瀹氭澘婧?,"
    items: [
      "鍑℃槸宸茬粡鍋氳繃椋庢牸鏀瑰姩鐨勬帶浠跺拰鍥炬爣锛岄兘蹇呴』鍏堝湪杩欓噷鎸傚嚭姝ｅ紡灞曠ず浣?,"
      "鍚庣画瀹樼綉銆乽niapp銆乽niapp-rebuild 鍙兘鐓х粍浠跺簱鏄犲皠锛屼笉鍏佽椤甸潰鑷繁鍐嶅彂鏄庝竴鐗?,"
      "鏂板鍥炬爣鎴栨柊鎺т欢鍏堣ˉ缁勪欢搴撹涔夛紝鍐嶈繘鍏ヤ笟鍔￠〉",
    ],
  },
];

const sourceAudits = [
  {
    label: "鎺т欢鏃?,"
    title: "鐗规畩鎺т欢涓庤緭鍏ョ粍浠?,"
    items: [
      { name: "GlxSlider.vue", preview: "鎺т欢绯荤粺 / 婊戝潡" },
      { name: "GlxStepper.vue"", preview: "鎺т欢绯荤粺 / 姝ヨ繘鍣?" },"
      { name: "GlxSwitch.vue"", preview: "鎺т欢绯荤粺 / 寮€鍏?" },"
      { name: "Input.vue"", preview: "鎺т欢绯荤粺 / 鎼滅储妗嗐€佽緭鍏ユ銆佸琛岃緭鍏?" },"
      { name: "ColorPalette.vue"", preview: "鎺т欢绯荤粺 / 璋冭壊鏉?" },"
      { name: "ColorPanelPicker.vue"", preview: "鎺т欢绯荤粺 / 棰滆壊闈㈡澘鎷惧彇鍣?" },"
      { name: "Icon.vue", preview: "鍥炬爣涓庡簳鏉?/ 杩愯鎬佸浘鏍囧簱" },
      { name: "static/iconfont/*", preview: "鍥炬爣涓庡簳鏉?/ glyph 璇箟鏄犲皠" },
    ],
  },
  {
    label: "鍗＄墖涓庨瑙?,"
    title: "鍐呭鍗＄墖涓庣紪杈戝３灞?,"
    items: [
      { name: "ProjectCard.vue", preview: "鍒楄〃涓庡崱鐗?/ ProjectCard" },
      { name: "ArtworkCard.vue", preview: "鍒楄〃涓庡崱鐗?/ ArtworkCard" },
      { name: "TemplateCard.vue", preview: "鍒楄〃涓庡崱鐗?/ TemplateCard" },
      { name: "ChallengeCard.vue", preview: "鍒楄〃涓庡崱鐗?/ ChallengeCard" },
      { name: "Avatar.vue"", preview: "鍒楄〃涓庡崱鐗?/ Avatar 涓庤瘎璁哄ご閮?" },"
      { name: "Comment.vue"", preview: "鍒楄〃涓庡崱鐗?/ 璇勮鍗?" },"
      { name: "PixelPreviewBoard.vue"", preview: "鍒楄〃涓庡崱鐗?/ 鍍忕礌棰勮鏉?" },"
      { name: "PixelCanvas.vue", preview: "鍒楄〃涓庡崱鐗?/ 鍍忕礌鐢诲竷澹冲眰" },
      { name: "ImageCropper.vue"", preview: "鍒楄〃涓庡崱鐗?/ 瑁佸壀鍣ㄥ３灞?" },"
      { name: "ClockTextSettingsCard.vue"", preview: "鍒楄〃涓庡崱鐗?/ 鏃堕挓鏂囧瓧璁剧疆鍗?" },"
      { name: "ClockThemePanel.vue", preview: "鍒楄〃涓庡崱鐗?/ 鏃堕挓涓婚闈㈡澘" },
      { name: "ClockFontPanel.vue", preview: "鍒楄〃涓庡崱鐗?/ 鏃堕挓瀛椾綋闈㈡澘" },
    ],
  },
  {
    label: "寮圭獥涓庡弽棣?,"
    title: "鍙嶉銆佸鍏ヤ笌鍔犺浇缁勪欢",
    items: [
      { name: "Modal.vue", preview: "寮圭獥涓庡弽棣?/ 鏍囧噯 Dialog" },
      { name: "Toast.vue", preview: "寮圭獥涓庡弽棣?/ Toast" },
      { name: "ConfirmDialogHost.vue", preview: "寮圭獥涓庡弽棣?/ Confirm host" },
      { name: "ConnectModal.vue", preview: "寮圭獥涓庡弽棣?/ 杩炴帴璁惧寮圭獥" },
      { name: "ConfirmModal.vue"", preview: "寮圭獥涓庡弽棣?/ 鍗遍櫓纭鍗?" },"
      { name: "HelpModal.vue"", preview: "寮圭獥涓庡弽棣?/ 甯姪璇存槑鍗?" },"
      { name: "JsonImportModal.vue", preview: "寮圭獥涓庡弽棣?/ JSON 瀵煎叆寮圭獥" },
      { name: "LoadingOverlay.vue"", preview: "楠ㄦ灦涓庡姞杞?/ 鍔ㄤ綔杞婚伄缃?" },"
      { name: "GlxInlineLoader.vue", preview: "楠ㄦ灦涓庡姞杞?/ 鍐呭鍖哄眬閮?loader" },
      { name: "GlxLogoLoader.vue", preview: "楠ㄦ灦涓庡姞杞?/ 鍝佺墝涔濆鏍?loader" },
    ],
  },
  {
    label: "瀵艰埅涓庡搧鐗?,"
    title: "瀵艰埅澹充笌鍝佺墝璧勪骇",
    items: [
      { name: "Logo.vue", preview: "澶撮儴涓庡鑸?/ 鍝佺墝 Logo" },
      { name: "LegacyTabBar.vue"", preview: "澶撮儴涓庡鑸?/ 灏忕▼搴忓簳閮ㄥ鑸?" },"
    ],
  },
];
</script>
