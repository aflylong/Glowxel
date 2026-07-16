<template>
  <section class="ds-section">
    <div class="ds-section__head">
      <div>
        <h2 class="ds-section__title">楠ㄦ灦銆丩oading 涓庡弽棣?</h2>
        <p class="ds-section__meta">椤甸潰鍐呭鐢ㄩ鏋舵垨灞€閮?loader锛屽姩浣滈樆濉炲啀涓婅交閬僵锛涘弽棣堢粍浠朵篃缁х画娌跨敤涓婁竴鐗堢‖杈瑰潡闈?</p>
      </div>
    </div>

    <div v-if="showLoading" class="ds-skeleton-grid">
      <article v-for="item in skeletons" :key="item.title" class="ds-skeleton-card">
        <div class="ds-skeleton-card__head">
          <span class="ds-icon-shell" :class="item.tone">
            <DesignSystemGlyph :name="item.icon" />
          </span>
          <strong>{{ item.title }}</strong>
        </div>
        <div class="ds-skeleton-card__body">
          <div class="ds-skeleton-block" :class="{ 'ds-skeleton-block--poster': item.poster }"></div>
          <div class="ds-skeleton-bar"></div>
          <div class="ds-skeleton-block"></div>
          <div class="ds-skeleton-bar ds-skeleton-bar--short"></div>
        </div>
      </article>
    </div>

    <div v-if="showLoading" class="ds-grid ds-grid--two ds-grid--spaced">
      <article class="ds-example">
        <span class="ds-card__label">姝ｅ紡 Loader</span>
        <div class="ds-loader-stack">
          <div v-for="item in officialLoaders" :key="item.title" class="ds-loader-box">
            <div class="ds-loader-grid" :class="item.className" aria-hidden="true">
              <span v-for="index in 9" :key="item.key + index"></span>
            </div>
            <div>
              <strong class="ds-card__title ds-card__title--tight">{{ item.title }}</strong>
              <p class="ds-card__copy">{{ item.copy }}</p>
            </div>
          </div>
        </div>
      </article>

      <article class="ds-example">
        <span class="ds-card__label">鍔ㄤ綔杞婚伄缃?</span>
        <div class="ds-showcase">
          <div class="ds-loader-box ds-loader-box--emphasis">
            <div class="ds-loader-grid ds-loader-grid--chase" aria-hidden="true">
              <span v-for="index in 9" :key="'mask-' + index"></span>
            </div>
            <div>
              <strong class="ds-card__title ds-card__title--tight">鍙戦€佷腑鈥?</strong>
              <p class="ds-card__copy">浼犺緭娴佺▼鍥哄畾浣跨敤 5 鍙凤紙Chase锛夛紝骞朵笖鍙攣褰撳墠鍐呭鍖猴紝涓嶅仛鍘氶噸鍏ㄥ睆妯℃€佸眰銆?</p>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showLoading" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">涔濆鏍?Loading 瀹舵棌</h3>
        <p class="ds-section__meta">鐜板瓨鏉ユ簮鏂规 10 娆撅紝褰撳墠姝ｅ紡閲囩敤 3 娆俱€?</p>
      </div>
    </div>

    <article v-if="showLoading" class="ds-card">
      <span class="ds-card__label">鏉ユ簮: logo-loading-showcase.html</span>
      <div class="ds-loader-family">
        <div v-for="item in loaderFamily" :key="item.key" class="ds-loader-family__item">
          <div class="ds-loader-grid" :class="item.className" aria-hidden="true">
            <span v-for="index in 9" :key="item.key + '-family-' + index"></span>
          </div>
          <div class="ds-loader-family__meta">
            <strong>{{ item.title }}</strong>
            <span class="ds-loader-chip" :class="'ds-loader-chip--' + item.statusTone">{{ item.statusLabel }}</span>
          </div>
        </div>
      </div>
    </article>

    <div v-if="showLoading" class="ds-grid ds-grid--two ds-grid--spaced">
      <article class="ds-card">
        <span class="ds-card__label">GlxLogoLoader.vue</span>
        <div class="ds-logo-loader-showcase">
          <div v-for="item in officialLoaders" :key="'logo-' + item.key" class="ds-logo-loader-showcase__item">
            <div class="ds-logo-loader-showcase__stage">
              <div class="ds-loader-grid" :class="item.className" aria-hidden="true">
                <span v-for="index in 9" :key="'logo-grid-' + item.key + index"></span>
              </div>
            </div>
            <strong>{{ item.title }}</strong>
            <span>{{ item.copy }}</span>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">GlxInlineLoader.vue / LoadingOverlay.vue</span>
        <div class="ds-inline-loader-preview">
          <div class="ds-loader-box">
            <div class="ds-loader-grid ds-loader-grid--flip" aria-hidden="true">
              <span v-for="index in 9" :key="'inline-' + index"></span>
            </div>
            <div>
              <strong class="ds-card__title ds-card__title--tight">鍐呭鍔犺浇涓?</strong>
              <p class="ds-card__copy">鍒楄〃灏鹃儴銆佸眬閮ㄥ埛鏂板拰闈㈡澘鍐呭缁х画璧板唴瀹瑰尯 loader銆?</p>
            </div>
          </div>
          <div class="ds-light-mask-preview">
            <div class="ds-light-mask-preview__body">
              <span class="ds-light-mask-preview__bar"></span>
              <span class="ds-light-mask-preview__bar ds-light-mask-preview__bar--short"></span>
              <span class="ds-light-mask-preview__panel"></span>
            </div>
            <div class="ds-light-mask-preview__card">
              <div class="ds-loader-grid ds-loader-grid--chase" aria-hidden="true">
                <span v-for="index in 9" :key="'light-mask-' + index"></span>
              </div>
              <span>鍙戦€佷腑鈥?</span>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showFeedback" class="ds-grid ds-grid--two ds-grid--spaced">
      <article class="ds-example">
        <span class="ds-card__label">Toast.vue</span>
        <div class="ds-toast-stack">
          <div class="ds-toast ds-toast--info">
            <span class="ds-icon-shell ds-icon-shell--info">
              <DesignSystemGlyph name="sync" />
            </span>
            <span class="ds-card__copy">姝ｅ湪閲嶆柊璇诲彇璁惧鍙傛暟锛岃淇濇寔缃戠粶绋冲畾銆?</span>
          </div>
          <div class="ds-toast ds-toast--success">
            <span class="ds-icon-shell ds-icon-shell--success">
              <DesignSystemGlyph name="check" />
            </span>
            <span class="ds-card__copy">鍚屾鎴愬姛锛屾渶鏂伴」鐩凡缁忓啓鍏ヤ簯绔€?</span>
          </div>
          <div class="ds-toast ds-toast--warning">
            <span class="ds-icon-shell ds-icon-shell--warning">
              <DesignSystemGlyph name="warning" />
            </span>
            <span class="ds-card__copy">褰撳墠鎿嶄綔闇€瑕佺‘璁ゅ悗缁х画鎵ц銆?</span>
          </div>
          <div class="ds-toast ds-toast--danger">
            <span class="ds-icon-shell ds-icon-shell--danger">
              <DesignSystemGlyph name="trash" />
            </span>
            <span class="ds-card__copy">鍒犻櫎澶辫触锛岃绋嶅悗鍐嶈瘯銆?</span>
          </div>
        </div>
      </article>

      <article class="ds-example">
        <span class="ds-card__label">Modal.vue / ConfirmDialogHost.vue</span>
        <div class="ds-dialog">
          <div class="ds-dialog__head">
            <span class="ds-icon-shell ds-icon-shell--danger">
              <DesignSystemGlyph name="trash" />
            </span>
            <div class="ds-title-stack">
              <span class="ds-title-stack__title ds-title-stack__title--dialog">鍒犻櫎浣滃搧</span>
              <span class="ds-title-stack__desc">Danger 鍥哄畾璧版洿鎺ヨ繎 Element 鐨勬爣鍑嗙孩鑹层€?</span>
            </div>
          </div>
          <div class="ds-dialog__body">
            鍗遍櫓纭涓嶅啀鐢ㄥ亸绮夌殑鏃х孩鑹诧紝涔熶笉鍐嶅崟鐙仛涓€濂楁煍鍜屼笓棰橀〉鏍囬璇█銆傚畠鍙槸瀹樼綉浣撶郴閲岀殑涓€涓爣鍑嗗弽棣堢粍浠躲€?          </div>
          <div class="ds-dialog__foot">
            <button type="button" class="ds-btn">鍐嶆兂鎯?</button>
            <button type="button" class="ds-btn ds-btn--danger">
              <DesignSystemGlyph name="trash" />
              <span>纭鍒犻櫎</span>
            </button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showFeedback" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">鏉ユ簮寮圭獥澹冲眰</h3>
        <p class="ds-section__meta">ConnectModal / HelpModal / ConfirmModal 杩欑被 uniapp 寮圭獥涔熻鍥炴敹鍒扮粍浠跺簱锛屼笉鍐嶅彧闈犻€氱敤瀵硅瘽妗嗕唬鏇裤€?</p>
      </div>
    </div>

    <div v-if="showFeedback" class="ds-grid ds-grid--three">
      <article class="ds-card">
        <span class="ds-card__label">ConnectModal.vue</span>
        <div class="ds-connect-modal">
          <div class="ds-connect-modal__head">
            <strong>杩炴帴璁惧</strong>
            <button type="button" class="ds-connect-modal__close">
              <DesignSystemGlyph name="close" />
            </button>
          </div>
          <div class="ds-connect-modal__body">
            <p class="ds-card__copy">璇疯緭鍏?Glowxel PixelBoard 鐨?IP 鍦板潃銆?</p>
            <div class="ds-connect-modal__input">
              <input value="192.168.31.84" class="ds-input ds-input--bare" readonly />
            </div>
            <div class="ds-connect-modal__status ds-connect-modal__status--connecting">
              <div class="ds-loader-grid ds-loader-grid--flip" aria-hidden="true">
                <span v-for="index in 9" :key="'connecting-' + index"></span>
              </div>
              <span>杩炴帴涓?..</span>
            </div>
            <div class="ds-connect-modal__status ds-connect-modal__status--error">
              <span class="ds-icon-shell ds-icon-shell--danger">
                <DesignSystemGlyph name="close" />
              </span>
              <span>杩炴帴瓒呮椂锛岃閲嶈瘯</span>
            </div>
          </div>
          <div class="ds-connect-modal__foot">
            <button type="button" class="ds-btn">鍙栨秷</button>
            <button type="button" class="ds-btn ds-btn--primary">杩炴帴</button>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">Help / Confirm 瀹舵棌</span>
        <div class="ds-help-stack">
          <div class="ds-help-card">
            <span class="ds-icon-shell ds-icon-shell--warning">
              <DesignSystemGlyph name="help" />
            </span>
            <div class="ds-help-card__copy">
              <strong>HelpModal.vue</strong>
              <span>璇存槑鍗＄墖銆佸浘鏍囧簳鏉垮拰姝ｆ枃鍧楃户缁部鐢ㄧ洿瑙掔‖杈硅娉曘€?</span>
            </div>
          </div>
          <div class="ds-help-card">
            <span class="ds-icon-shell ds-icon-shell--danger">
              <DesignSystemGlyph name="trash" />
            </span>
            <div class="ds-help-card__copy">
              <strong>ConfirmModal.vue</strong>
              <span>鍗遍櫓纭缁х画璧?Element 椋庢牸 danger 绾紝涓嶅啀鍙﹂€犱竴濂楃矇绾㈢‘璁ゆ寜閽€?</span>
            </div>
          </div>
        </div>
      </article>

      <article class="ds-card">
        <span class="ds-card__label">JsonImportModal.vue</span>
        <div class="ds-json-modal">
          <div class="ds-json-modal__head">
            <strong>瀵煎叆閰嶇疆</strong>
            <button type="button" class="ds-connect-modal__close">
              <DesignSystemGlyph name="close" />
            </button>
          </div>
          <div class="ds-json-modal__body">
            <p class="ds-card__copy">JSON 瀵煎叆寮圭獥缁х画娌跨敤鐩磋杈规銆佷唬鐮佽緭鍏ユ鍜屽簳閮ㄥ弻鎸夐挳缁撴瀯銆?</p>
            <div class="ds-json-modal__textarea">
              <span>{</span>
              <span>&nbsp;&nbsp;"brightness": 72,</span>
              <span>&nbsp;&nbsp;"mode": "clock_theme"</span>
              <span>}</span>
            </div>
          </div>
          <div class="ds-json-modal__foot">
            <button type="button" class="ds-btn">鍙栨秷</button>
            <button type="button" class="ds-btn ds-btn--primary">纭畾</button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showFeedback" class="ds-grid ds-grid--three ds-grid--spaced">
      <article v-for="rule in rules" :key="rule.title" class="ds-card">
        <span class="ds-card__label">{{ rule.label }}</span>
        <span class="ds-card__title">{{ rule.title }}</span>
        <p class="ds-card__copy">{{ rule.copy }}</p>
      </article>
    </div>

    <div v-if="showRules" class="ds-section__head ds-section__head--spaced">
      <div>
        <h3 class="ds-section__title ds-section__title--sub">Uniapp 鍔犺浇涓庡弽棣堢害鏉?</h3>
        <p class="ds-section__meta">鎶婂凡缁忛攣瀹氱殑 loading 涓庡弽棣堣涔夌洿鎺ユ敹鎴愯鑼冨潡锛屽悗闈㈢户缁墿椤垫椂涓嶅啀鐚溿€?</p>
      </div>
    </div>

    <div v-if="showRules" class="ds-grid ds-grid--three">
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
import DesignSystemGlyph from "./DesignSystemGlyph.vue";

const props = defineProps({
  sectionKey: {
    type: String,
    required: true,
  },
});

const showLoading = computed(() => props.sectionKey === "skeletons");
const showFeedback = computed(() => props.sectionKey === "feedback");
const showRules = computed(() => props.sectionKey === "rules");

const skeletons = [
  { title: "棣栭〉楠ㄦ灦", icon: "home", tone: "ds-icon-shell--primary", poster: true },
  { title: "绀惧尯楠ㄦ灦", icon: "community", tone: "ds-icon-shell--blue" },
  { title: "璁惧楠ㄦ灦", icon: "device", tone: "ds-icon-shell--success" },
  { title: "鎴戠殑楠ㄦ灦", icon: "profile", tone: "ds-icon-shell--info" },
];

const rules = [
  {
    label: "鍐呭鍔犺浇",
    title: "浼樺厛楠ㄦ灦鎴栧眬閮?loader",
    copy: "椤甸潰棣栧睆銆佸垪琛ㄥ拰涓婚鍐呭浼樺厛鏄剧ず楠ㄦ灦锛屼笉鍐嶆妸 showLoading 褰撴暣椤甸粯璁ゅ叆鍙ｃ€?,"
  },
  {
    label: "鍔ㄤ綔闃诲",
    title: "鍔ㄤ綔閬僵鍙攣褰撳墠鍐呭鍖?,"
    copy: "淇濆瓨銆佸彂閫併€佸悓姝ャ€佸垹闄ゅ彲浠ラ攣鍔ㄤ綔锛屼絾瑙嗚鍋滅暀鍦ㄥ唴瀹瑰尯锛屼笉鐩栧畼缃戝鑸€?,"
  },
  {
    label: "鍙嶉璇箟",
    title: "Toast / Dialog 鍏ㄩ儴鍥炲埌鍥涚被鐘舵€佽壊",
    copy: "Info銆丼uccess銆乄arning銆丏anger 鍦ㄥ畼缃戝拰 uniapp 閲岄兘鐢ㄥ悓涓€濂楀畾涔夛紝涓嶅啀涓€椤典竴涓彛寰勩€?,"
  },
];

const officialLoaders = [
  {
    key: "chase",
    title: "Chase",
    copy: "鐢ㄤ簬鍙戦€?浼犺緭娴佺▼锛屽浐瀹氫负 5 鍙锋寮忓姩鏁堛€?,"
    className: "ds-loader-grid--chase",
  },
  {
    key: "flip",
    title: "Flip",
    copy: "鐢ㄤ簬鍒囨崲鍐呭鍖恒€佸崱鐗囧潡鍜屽皬鑼冨洿鍒锋柊銆?,"
    className: "ds-loader-grid--flip",
  },
  {
    key: "stamp",
    title: "Stamp",
    copy: "鐢ㄤ簬甯歌绛夊緟鎬侊紝涓?Flip 涓€璧峰弬涓庨殢鏈烘睜銆?,"
    className: "ds-loader-grid--stamp",
  },
];

const loaderFamily = [
  { key: "wave", title: "Wave", className: "ds-loader-grid--wave", statusLabel: "淇濈暀", statusTone: "info" },
  { key: "column", title: "Column", className: "ds-loader-grid--column", statusLabel: "淇濈暀", statusTone: "info" },
  { key: "glitch", title: "Glitch", className: "ds-loader-grid--glitch", statusLabel: "淇濈暀", statusTone: "info" },
  { key: "collapse", title: "Collapse", className: "ds-loader-grid--collapse", statusLabel: "淇濈暀", statusTone: "info" },
  { key: "chase", title: "Chase", className: "ds-loader-grid--chase", statusLabel: "姝ｅ紡", statusTone: "success" },
  { key: "flip", title: "Flip", className: "ds-loader-grid--flip", statusLabel: "姝ｅ紡", statusTone: "success" },
  { key: "slide", title: "Slide", className: "ds-loader-grid--slide", statusLabel: "淇濈暀", statusTone: "info" },
  { key: "liquid", title: "Liquid", className: "ds-loader-grid--liquid", statusLabel: "淇濈暀", statusTone: "info" },
  { key: "stamp", title: "Stamp", className: "ds-loader-grid--stamp", statusLabel: "姝ｅ紡", statusTone: "success" },
  { key: "link", title: "Link", className: "ds-loader-grid--link", statusLabel: "淇濈暀", statusTone: "info" },
];

const guardrails = [
  {
    label: "鍐呭鍔犺浇",
    title: "棣栧睆鍜屽垪琛ㄤ紭鍏堥鏋?,"
    copy: "椤甸潰杩涘叆銆乼ab 鍒囨崲鍜岄灞忓唴瀹瑰姞杞戒笉鍐嶉粯璁ゆ暣灞?loading锛屽厛鐪嬮鏋跺拰灞€閮ㄥ僵鑹?loader銆?,"
  },
  {
    label: "鍔ㄤ綔鍙嶉",
    title: "showLoading 鏀剁獎涓哄姩浣滆交閬僵",
    copy: "淇濆瓨銆佸彂閫併€佸悓姝ャ€佸垹闄ゃ€佽鍙栧弬鏁拌繖绫婚樆濉炲姩浣滄墠鍏佽涓婅交閬僵锛涘叾涓彂閫?浼犺緭缁熶竴鍥哄畾 Chase銆?,"
  },
  {
    label: "鍝佺墝璇█",
    title: "鍙敤鍝佺墝涔濆鏍?loader",
    copy: "榛戣壊 spinner銆侀粯璁ょ郴缁?loading 鍜屾棤璇箟灏忓渾鍦堥兘涓嶅啀杩涘叆姝ｅ紡椤甸潰銆?,"
  },
];
</script>
