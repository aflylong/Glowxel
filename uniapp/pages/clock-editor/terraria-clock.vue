<template>
  <view class="clock-editor-page glx-page-shell">
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>

    <view class="navbar glx-topbar glx-page-shell__fixed">
      <view class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </view>
      <text class="nav-title glx-topbar__title">{{ pageHeaderTitle }}</text>
      <view class="nav-right"></view>
    </view>

    <view class="canvas-section">
      <view class="preview-canvas-container" :style="previewCanvasBoxStyle">
        <PixelPreviewBoard
          v-if="previewCanvasReady && !shouldShowSendingSnapshot"
          :width="64"
          :height="64"
          :pixels="previewPixels"
          :refresh-token="previewTick"
          :zoom="previewZoom"
          :offset-x="previewOffset.x"
          :offset-y="previewOffset.y"
          :grid-visible="true"
          :is-dark-mode="true"
        />
        <PixelPreviewBoard
          v-else-if="previewCanvasReady && shouldShowSendingSnapshot && sendingPreviewPixels.size > 0"
          :width="64"
          :height="64"
          :pixels="sendingPreviewPixels"
          :refresh-token="sendingPreviewTick"
          :zoom="previewZoom"
          :offset-x="previewOffset.x"
          :offset-y="previewOffset.y"
          :grid-visible="true"
          :is-dark-mode="true"
        />
        <view v-else-if="previewCanvasReady" class="canvas-placeholder"></view>
      </view>
      <view class="preview-caption glx-preview-panel">
        <view class="preview-caption-info glx-preview-panel__info">
          <text class="preview-caption-title">{{ previewPanelTitle }}</text>
        </view>
        <view class="preview-actions">
          <view
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending }"
            @click="sendToDevice"
          >
            <Icon name="link" :size="36" color="#000000" />
            <text>发送</text>
          </view>
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="content glx-scroll-region glx-page-shell__content"
      :style="{ height: contentHeight }"
    >
      <view class="content-wrapper glx-scroll-stack">

        <!-- Tab 1: 时间设置 -->
        <ClockTextSettingsCard
          v-show="currentTab === 1"
          icon-name="time"
          title="时间显示"
          :section="config.time"
          :preset-colors="presetColors"
          :show-font-size="true"
          :show-seconds-control="true"
          :show-seconds="config.showSeconds"
          :min-font-size="1"
          :max-font-size="3"
          @toggle="toggleTimeShow"
          @toggle-seconds="toggleShowSeconds"
          @adjust="handleTimeAdjust"
          @update-color="handleTimeColor"
          @set-align="handleTimeAlign"
        />

        <!-- Tab 2: 字体设置 -->
        <ClockFontPanel
          v-show="currentTab === 2"
          :font-options="fontOptions"
          :selected-font="config.font"
          :show-seconds="config.showSeconds"
          :hour-format="config.hourFormat"
          @select-font="selectFont"
          @set-hour-format="setHourFormat"
        />

        <!-- Tab 3: 角色配置 -->
        <view v-show="currentTab === 3" class="settings-card">

          <!-- 4 职业 -->
          <view class="card-title-section">
            <Icon name="game" :size="32" />
            <text class="card-title">职业 / 套装</text>
          </view>
          <view class="character-grid">
            <view
              v-for="ch in characterList"
              :key="ch.id"
              class="character-btn"
              :class="{ active: config.terraria.characterId === ch.id }"
              @click="selectCharacter(ch.id)"
            >
              <text class="character-name">{{ ch.name }}</text>
              <text class="character-set">{{ ch.armorSet }}盔甲</text>
            </view>
          </view>

          <!-- 武器 -->
          <view class="card-title-section">
            <Icon name="cup" :size="32" />
            <text class="card-title">武器</text>
          </view>
          <view class="weapon-grid">
            <view
              v-for="w in allWeapons"
              :key="w.id"
              class="weapon-btn"
              :class="{ active: config.terraria.weaponId === w.id }"
              @click="selectWeapon(w.id)"
            >
              <text>{{ w.name }}</text>
            </view>
          </view>

          <!-- Boss 面具 -->
          <view class="card-title-section">
            <Icon name="game" :size="32" />
            <text class="card-title">面具 (可选)</text>
          </view>
          <view class="weapon-grid">
            <view
              class="weapon-btn"
              :class="{ active: !config.terraria.maskId }"
              @click="selectMask(0)"
            >
              <text>套装头甲</text>
            </view>
            <view
              v-for="m in maskList"
              :key="m.id"
              class="weapon-btn"
              :class="{ active: config.terraria.maskId === m.id }"
              @click="selectMask(m.id)"
            >
              <text>{{ m.name }}</text>
            </view>
          </view>

          <!-- 翅膀 -->
          <view class="card-title-section">
            <Icon name="palette" :size="32" />
            <text class="card-title">翅膀</text>
          </view>
          <view class="weapon-grid">
            <view
              v-for="wing in wingList"
              :key="wing.id"
              class="weapon-btn"
              :class="{ active: config.terraria.wingId === wing.id }"
              @click="selectWing(wing.id)"
            >
              <text>{{ wing.name }}</text>
            </view>
          </view>

          <!-- 守卫(召唤师专属) -->
          <view v-if="hasGuardian">
            <view class="card-title-section">
              <Icon name="ai" :size="32" />
              <text class="card-title">守卫</text>
            </view>
            <!-- 守卫/星尘龙/飞剑 调整已隐藏 (数据保留) -->
          </view>

          <!-- 武器位置微调 -->
          <view class="card-title-section">
            <Icon name="palette" :size="32" />
            <text class="card-title">武器位置</text>
          </view>
          <view class="setting-item-row">
            <text class="setting-label">武器 X</text>
            <view class="setting-control-buttons">
              <view class="control-btn" @click="adjustTerraria('weaponOfsX', -1)"><text class="control-icon">-</text></view>
              <text class="setting-value-large">{{ config.terraria.weaponOfsX }}</text>
              <view class="control-btn" @click="adjustTerraria('weaponOfsX', 1)"><text class="control-icon">+</text></view>
            </view>
          </view>
          <view class="setting-item-row">
            <text class="setting-label">武器 Y</text>
            <view class="setting-control-buttons">
              <view class="control-btn" @click="adjustTerraria('weaponOfsY', -1)"><text class="control-icon">-</text></view>
              <text class="setting-value-large">{{ config.terraria.weaponOfsY }}</text>
              <view class="control-btn" @click="adjustTerraria('weaponOfsY', 1)"><text class="control-icon">+</text></view>
            </view>
          </view>
          <view class="setting-item-row">
            <text class="setting-label">旋转°</text>
            <view class="setting-control-buttons">
              <view class="control-btn" @click="adjustTerraria('weaponRotate', -15)"><text class="control-icon">-</text></view>
              <text class="setting-value-large">{{ config.terraria.weaponRotate }}°</text>
              <view class="control-btn" @click="adjustTerraria('weaponRotate', 15)"><text class="control-icon">+</text></view>
            </view>
          </view>

        </view>

        <!-- Tab 4: 地形 + Boss -->
        <view v-show="currentTab === 4" class="settings-card">

          <!-- 地形 -->
          <view class="card-title-section">
            <Icon name="palette" :size="32" />
            <text class="card-title">地形</text>
          </view>
          <view class="biome-grid">
            <view
              v-for="b in biomeList"
              :key="b.id"
              class="biome-btn"
              :class="{ active: config.terraria.biome === b.id }"
              @click="selectBiome(b.id)"
            >
              <text>{{ b.name }}</text>
            </view>
          </view>

          <!-- Boss (默认展示, 不可关闭) -->
          <view class="card-title-section">
            <Icon name="ai" :size="32" />
            <text class="card-title">Boss</text>
          </view>

          <view>
            <!-- Boss 选择 (按当前地形过滤) -->
            <view class="boss-grid">
              <view
                v-for="bs in availableBosses"
                :key="bs.slug"
                class="boss-btn"
                :class="{ active: config.terraria.bossId === bs.slug }"
                @click="selectBoss(bs.slug)"
              >
                <text>{{ bs.nameZh }}</text>
                <text class="boss-size">{{ bs.w }}×{{ bs.h }}</text>
              </view>
            </view>

            <!-- Boss 位置 + 缩放 -->
            <view class="setting-item-row">
              <text class="setting-label">Boss X</text>
              <view class="setting-control-buttons">
                <view class="control-btn" @click="adjustTerraria('bossX', -1)"><text class="control-icon">-</text></view>
                <text class="setting-value-large">{{ config.terraria.bossX }}</text>
                <view class="control-btn" @click="adjustTerraria('bossX', 1)"><text class="control-icon">+</text></view>
              </view>
            </view>
            <view class="setting-item-row">
              <text class="setting-label">Boss Y</text>
              <view class="setting-control-buttons">
                <view class="control-btn" @click="adjustTerraria('bossY', -1)"><text class="control-icon">-</text></view>
                <text class="setting-value-large">{{ config.terraria.bossY }}</text>
                <view class="control-btn" @click="adjustTerraria('bossY', 1)"><text class="control-icon">+</text></view>
              </view>
            </view>
            <view class="setting-item-row">
              <text class="setting-label">Boss 缩放%</text>
              <view class="setting-control-buttons">
                <view class="control-btn" @click="adjustTerraria('bossScale', -1)"><text class="control-icon">-</text></view>
                <text class="setting-value-large">{{ config.terraria.bossScale }}</text>
                <view class="control-btn" @click="adjustTerraria('bossScale', 1)"><text class="control-icon">+</text></view>
              </view>
            </view>
          </view>

        </view>

      </view>
    </scroll-view>

    <!-- 底部 Tab 切换 -->
    <view class="bottom-tabs">
      <view
        v-for="tab in tabDefinitions"
        :key="tab.index"
        class="bottom-tab-item"
        :class="{ active: currentTab === tab.index }"
        @click="currentTab = tab.index"
      >
        <Icon
          :name="tab.icon"
          :size="36"
          :color="currentTab === tab.index ? '#000000' : '#666666'"
        />
        <text class="bottom-tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <view v-if="isSending" class="glx-device-sending-overlay" @touchmove.stop.prevent>
      <view class="glx-device-sending-card">
        <GlxInlineLoader class="glx-device-sending-spinner" variant="chase" size="lg" />
        <text class="glx-device-sending-title">{{ sendOverlayTitle }}</text>
        <text class="glx-device-sending-tip">{{ sendOverlayTip }}</text>
      </view>
    </view>

    <canvas
      id="imageProcessCanvas"
      type="2d"
      style="position: fixed; left: -9999px; top: -9999px; width: 64px; height: 64px;"
    ></canvas>

    <Toast ref="toastRef" @show="handleToastShow" @hide="handleToastHide" />
  </view>
</template>

<script>
import { useDeviceStore } from "../../store/device.js";
import { useToast } from "../../composables/useToast.js";
import statusBarMixin from "../../mixins/statusBar.js";
import clockPreviewMixin from "./mixins/clockPreviewMixin.js";
import deviceSyncMixin from "./mixins/deviceSyncMixin.js";
import deviceSendUxMixin from "../../mixins/deviceSendUxMixin.js";
import Icon from "../../components/Icon.vue";
import Toast from "../../components/Toast.vue";
import GlxInlineLoader from "../../components/GlxInlineLoader.vue";
import PixelPreviewBoard from "../../components/PixelPreviewBoard.vue";
import ClockFontPanel from "../../components/clock-editor/ClockFontPanel.vue";
import ClockTextSettingsCard from "../../components/clock-editor/ClockTextSettingsCard.vue";
import { getClockFontOptions, drawClockTextToPixels } from "../../utils/clockCanvas.js";
import { renderTerrariaScene, CHARACTERS, getWeaponOfs } from "../../utils/terrariaRenderer.js";
import { WING_LIST } from "../../utils/terrariaWings.js";
import { preloadAll as preloadTerrariaSprites } from "../../utils/terrariaSprites.js";
import { applyTerrariaClockBorder } from "../../utils/clockTerrariaBorder.js";
import { BIOME_LIST } from "../../utils/terrariaBiome.js";
import { getBossesForBiome } from "../../utils/terrariaBosses.js";

// 各字段调节范围 (有变化才放这, 别的字段不限制)
const TERRARIA_RANGE = {
  playerX:        { min: 0,    max: 63  },
  playerY:        { min: 0,    max: 63  },
  playerScale:    { min: 20,   max: 200 },
  guardianX:      { min: -64,  max: 64  },
  guardianY:      { min: -64,  max: 64  },
  guardianScale:  { min: 20,   max: 200 },
  wingSpeedPct:   { min: 0,    max: 200 },
  dragonX:        { min: -32,  max: 32  },
  dragonY:        { min: -32,  max: 32  },
  dragonAngle:    { min: -180, max: 180 },
  bladeX:         { min: -32,  max: 32  },
  bladeY:         { min: -32,  max: 32  },
  bladeAngle:     { min: -180, max: 180 },
  weaponOfsX:     { min: -20,  max: 20  },
  weaponOfsY:     { min: -20,  max: 20  },
  weaponRotate:   { min: -180, max: 180 },
  bossX:          { min: 0,    max: 63  },
  bossY:          { min: 0,    max: 63  },
  bossScale:      { min: 5,    max: 200 },
};

export default {
  mixins: [
    statusBarMixin,
    clockPreviewMixin,
    deviceSyncMixin,
    deviceSendUxMixin,
  ],
  components: {
    Icon,
    Toast,
    GlxInlineLoader,
    PixelPreviewBoard,
    ClockFontPanel,
    ClockTextSettingsCard,
  },
  data() {
    return {
      deviceStore: null,
      toast: null,
      isReady: false,
      clockMode: "terraria_clock",

      contentHeight: "calc(100vh - 112rpx - 120rpx - 80rpx)",

      imagePixels: null,
      showPreview: true,
      previewPixels: new Map(),
      sendingPreviewPixels: new Map(),

      previewZoom: 4,
      previewOffset: { x: 16, y: 16 },
      previewContainerSize: { width: 320, height: 320 },
      previewCanvasReady: false,
      previewTick: 0,
      sendingPreviewTick: 0,
      previewRefreshTimer: null,
      previewClockTimer: null,
      animLoopHandle: null,
      animStartTs: 0,
      animTimeSec: 0,

      loadingTimer: null,
      loadingActive: false,

      fontOptions: getClockFontOptions(),

      currentTab: 1,
      tabDefinitions: [
        { index: 1, label: "时间", icon: "time" },
        { index: 2, label: "字体", icon: "text" },
        { index: 3, label: "角色", icon: "game" },
        { index: 4, label: "地形", icon: "palette" },
      ],

      characterList: Object.keys(CHARACTERS).map(id => ({
        id,
        name: CHARACTERS[id].name,
        armorSet: CHARACTERS[id].armorSet,
      })),

      wingList: WING_LIST,

      config: {
        font: "lcd_6x8",
        showSeconds: false,
        hourFormat: 24,
        time: {
          show: true,
          fontSize: 1,
          x: 32,
          y: 6,
          color: "#5a4a3a",
          align: "center",
        },
        date: {
          show: false, fontSize: 1, x: 32, y: 29, color: "#787878", align: "center",
        },
        week: {
          show: false, x: 32, y: 38, color: "#646464", align: "center",
        },
        image: {
          show: false, x: 0, y: 0, width: 64, height: 64, data: null,
        },
        terraria: {
          characterId: "warrior",
          weaponId: 4956,
          maskId: 0,  // 0 = 使用套装头甲, >0 = boss 面具 ID
          playerX: 14,
          playerY: 51,
          playerScale: 27,
          guardianX: -10,
          guardianY: -18,
          guardianScale: 27,
          dragonX: -12,
          dragonY: -3,
          dragonAngle: 75,
          bladeX: -8,
          bladeY: 1,
          bladeAngle: 105,
          weaponOfsX: 0,
          weaponOfsY: 0,
          weaponRotate: 0,
          wingSpeedPct: 50,
          wingId: 29,
          // 地形 + Boss
          biome: "forest",
          bossEnabled: true,
          bossId: "king_slime",
          bossX: 53,
          bossY: 41,
          bossScale: 27,
          // 每个 boss 独立保存自己的 X/Y/scale (slug -> {x, y, scale})
          // 切 boss 时从这里加载, 调整 X/Y/scale 时写回这里
          bossOverrides: {
            king_slime:        { x: 53, y: 41, scale: 27 },  // 1
            eye_of_cthulhu:    { x: 53, y: 22, scale: 27 },  // 2
            eater_of_worlds:   { x: 48, y: 49, scale: 27 },  // 3
            brain_of_cthulhu:  { x: 32, y: 27, scale: 27 },  // 4
            queen_bee:         { x: 52, y: 32, scale: 25 },  // 5
            skeletron:         { x: 32, y: 48, scale: 38 },  // 6
            deerclops:         { x: 53, y: 31, scale: 25 },  // 7
            wall_of_flesh:     { x: 63, y: 33, scale: 36 },  // 8
            queen_slime:       { x: 32, y: 35, scale: 25 },  // 9
            the_twins:         { x: 53, y: 32, scale: 25 },  // 10
            destroyer:         { x: 48, y: 49, scale: 27 },  // 11
            skeletron_prime:   { x: 32, y: 36, scale: 50 },  // 12
            plantera:          { x: 32, y: 48, scale: 27 },  // 13
            golem:             { x: 32, y: 32, scale: 30 },  // 14
            duke_fishron:      { x: 60, y: 34, scale: 28 },  // 15
            empress_of_light:  { x: 32, y: 35, scale: 25 },  // 16
            lunatic_cultist:   { x: 49, y: 50, scale: 28 },  // 17
            martian_saucer:    { x: 32, y: 23, scale: 27 },  // 18
            moon_lord:         { x: 32, y: 26, scale: 21 },  // 19
            pumpking:          { x: 32, y: 41, scale: 30 },  // 20
            mourning_wood:     { x: 32, y: 31, scale: 30 },  // 21
            ice_queen:         { x: 32, y: 28, scale: 27 },  // 22
            santa_nk1:         { x: 55, y: 35, scale: 30 },  // 23
            everscream:        { x: 32, y: 30, scale: 30 },  // 24
            solar_pillar:      { x: 32, y: 23, scale: 17 },  // 25
            nebula_pillar:     { x: 32, y: 23, scale: 17 },  // 26
            stardust_pillar:   { x: 32, y: 23, scale: 17 },  // 27
            vortex_pillar:     { x: 32, y: 23, scale: 17 },  // 28
            flying_dutchman:   { x: 53, y: 7,  scale: 19 },  // 29
            mothron:           { x: 51, y: 32, scale: 28 },  // 30
            betsy:             { x: 54, y: 27, scale: 30 },  // 31
            dark_mage:         { x: 48, y: 35, scale: 25 },  // 32
            ogre:              { x: 54, y: 35, scale: 25 },  // 33
          },
          // 时钟边框色
          clockBgInner: "#63971f",
          clockBgOuter: "#8FD71D",
        },
      },

      biomeList: BIOME_LIST,

      presetColors: [
        { name: "土色", hex: "#5a4a3a" },
        { name: "青色", hex: "#64c8ff" },
        { name: "绿色", hex: "#00ff9d" },
        { name: "黄色", hex: "#ffdc00" },
        { name: "白色", hex: "#ffffff" },
      ],
    };
  },

  computed: {
    pageHeaderTitle() { return "泰拉瑞亚时钟"; },
    previewPanelTitle() { return "模拟预览"; },
    previewCanvasBoxStyle() {
      const size = this.previewContainerSize?.height || 320;
      return { height: `${size}px` };
    },
    currentWeapons() {
      const ch = CHARACTERS[this.config.terraria.characterId];
      return ch ? ch.weapons : [];
    },
    allWeapons() {
      // 所有 20 把武器(用户可自由选)
      const all = [];
      for (const ch of Object.values(CHARACTERS)) {
        for (const w of ch.weapons) {
          if (!all.find(a => a.id === w.id)) all.push(w);
        }
      }
      return all;
    },
    maskList() {
      return [
        { id: 164, name: '史莱姆王' },
        { id: 154, name: '克苏鲁之眼' },
        { id: 153, name: '世界吞噬者' },
        { id: 146, name: '克苏鲁之脑' },
        { id: 150, name: '蜂王' },
        { id: 98,  name: '骷髅王' },
        { id: 276, name: '巨鹿' },
        { id: 147, name: '血肉墙' },
        { id: 260, name: '史莱姆女皇' },
        { id: 148, name: '双子魔眼' },
        { id: 155, name: '毁灭者' },
        { id: 149, name: '机械骷髅王' },
        { id: 151, name: '世纪之花' },
        { id: 152, name: '石巨人' },
        { id: 168, name: '巨鱼公爵' },
        { id: 251, name: '光之女皇' },
        { id: 186, name: '邪教徒' },
        { id: 174, name: '火星生物' },
        { id: 187, name: '月亮领主' },
        { id: 137, name: '南瓜王' },
        { id: 141, name: '树面具' },
      ];
    },
    hasGuardian() {
      const ch = CHARACTERS[this.config.terraria.characterId];
      return !!(ch && ch.hasGuardian);
    },
    availableBosses() {
      return getBossesForBiome(this.config.terraria.biome) || [];
    },
  },

  onUnload() { this.cleanupTransientState(); },
  onHide() { this.cleanupTransientState(); },

  onLoad() {
    this.clockMode = "terraria_clock";
    this._loadTerrariaConfig();
    this.ensureValidCurrentTab();

    try {
      const loaded = preloadTerrariaSprites();
      console.log('[terraria] 预加载 sprite 完成', loaded);
    } catch (e) {
      console.error('[terraria] 预加载 sprite 异常', e);
    }

    this.deviceStore = useDeviceStore();
    this.deviceStore.init();
    this.toast = useToast();

    const systemInfo = uni.getSystemInfoSync();
    const statusBarHeight = systemInfo.statusBarHeight || 0;
    const headerHeight = 56;
    this.contentHeight = `${systemInfo.windowHeight - statusBarHeight - headerHeight - 360}px`;
  },

  onReady() {
    this.$nextTick(() => {
      if (this.$refs.toastRef) {
        this.toast.setToastInstance(this.$refs.toastRef);
      }
      this.initPreviewCanvas();
    });
  },

  onShow() {
    if (this.previewCanvasReady) {
      this.startAnimLoop();
      this.startPreviewClockTimer();
    }
  },

  methods: {
    selectCharacter(charId) {
      const ch = CHARACTERS[charId];
      if (!ch) return;
      this.config.terraria.characterId = charId;
      this.config.terraria.weaponId = ch.weapons[0].id;
      const ofs = getWeaponOfs(ch.weapons[0].id);
      this.config.terraria.weaponOfsX = ofs.x;
      this.config.terraria.weaponOfsY = ofs.y;
      this.config.terraria.weaponRotate = ofs.rotate;
      this.config.terraria.wingId = ch.wings;
      this.scheduleRender();
    },
    selectWeapon(weaponId) {
      this.config.terraria.weaponId = weaponId;
      const ofs = getWeaponOfs(weaponId);
      this.config.terraria.weaponOfsX = ofs.x;
      this.config.terraria.weaponOfsY = ofs.y;
      this.config.terraria.weaponRotate = ofs.rotate;
      this.scheduleRender();
    },
    selectWing(wingId) {
      this.config.terraria.wingId = wingId;
      this.scheduleRender();
    },
    selectMask(maskId) {
      this.config.terraria.maskId = maskId || 0;
      this.scheduleRender();
    },
    adjustTerraria(key, delta) {
      const r = TERRARIA_RANGE[key];
      const cur = this.config.terraria[key];
      let next = cur + delta;
      if (r) {
        next = Math.max(r.min, Math.min(r.max, next));
      }
      if (next !== cur) {
        this.config.terraria[key] = next;
        // boss 字段 (bossX/Y/Scale) 同步写回 bossOverrides[bossId]
        if (key === 'bossX' || key === 'bossY' || key === 'bossScale') {
          this._saveBossOverride();
        }
        this.scheduleRender();
      }
    },
    // 把当前 bossX/Y/Scale 存到 bossOverrides[bossId]
    _saveBossOverride() {
      const t = this.config.terraria;
      if (!t.bossId) return;
      if (!t.bossOverrides) t.bossOverrides = {};
      t.bossOverrides[t.bossId] = {
        x: t.bossX, y: t.bossY, scale: t.bossScale,
      };
    },
    _saveTerrariaConfig() {
      uni.setStorageSync('terraria_clock_config', {
        font: this.config.font,
        hourFormat: this.config.hourFormat,
        showSeconds: this.config.showSeconds,
        time: this.config.time,
        terraria: this.config.terraria,
      });
    },
    _loadTerrariaConfig() {
      const saved = uni.getStorageSync('terraria_clock_config');
      if (saved && typeof saved === 'object') {
        if (saved.font) this.config.font = saved.font;
        if (saved.hourFormat) this.config.hourFormat = saved.hourFormat;
        if (saved.showSeconds !== undefined) this.config.showSeconds = saved.showSeconds;
        if (saved.time) Object.assign(this.config.time, saved.time);
        if (saved.terraria) Object.assign(this.config.terraria, saved.terraria);
      }
    },
    // 从 bossOverrides[slug] 加载到 bossX/Y/Scale, 如果没有就用默认 48/32/25
    _loadBossOverride(slug) {
      const t = this.config.terraria;
      const o = t.bossOverrides && t.bossOverrides[slug];
      if (o) {
        t.bossX = o.x;
        t.bossY = o.y;
        t.bossScale = o.scale;
      } else {
        t.bossX = 48;
        t.bossY = 32;
        t.bossScale = 25;
      }
    },
    _biomeToIndex(biome) {
      // 跟 BIOME_LIST 顺序对齐, 板载 sprites_tiles.h getBiomeTile 用同样的 index
      const map = {
        forest: 0, corruption: 1, crimson: 2, jungle: 3, snow: 4,
        dungeon: 5, underworld: 6, hallow: 7, ocean: 8, temple: 9,
      };
      return map[biome] !== undefined ? map[biome] : 0;
    },
    _bossSlugToIndex(slug) {
      const list = ['king_slime','eye_of_cthulhu','eater_of_worlds','brain_of_cthulhu','queen_bee','skeletron','deerclops','wall_of_flesh','queen_slime','the_twins','destroyer','skeletron_prime','plantera','golem','duke_fishron','empress_of_light','lunatic_cultist','martian_saucer','moon_lord','pumpking','mourning_wood','ice_queen','santa_nk1','everscream','solar_pillar','nebula_pillar','stardust_pillar','vortex_pillar','flying_dutchman','mothron','betsy','dark_mage','ogre'];
      const idx = list.indexOf(slug);
      return idx >= 0 ? idx : 0;
    },
    selectBiome(biomeId) {
      if (this.config.terraria.biome === biomeId) return;
      this.config.terraria.biome = biomeId;
      // 切地形时 boss 列表会变, 自动选第一个
      const list = getBossesForBiome(biomeId);
      if (list.length > 0) {
        this.config.terraria.bossId = list[0].slug;
        this._loadBossOverride(list[0].slug);
      }
      this.scheduleRender();
    },
    selectBoss(slug) {
      this.config.terraria.bossId = slug;
      this._loadBossOverride(slug);
      this.scheduleRender();
    },
    toggleBoss() {
      this.config.terraria.bossEnabled = !this.config.terraria.bossEnabled;
      this.scheduleRender();
    },

    // ===== 直接覆盖 mixin 的 sendToDevice (terraria 走独立 ws.startTerrariaClock) =====
    async sendToDevice() {
      if (!this.guardBeforeSend(this.deviceStore.connected)) return;

      this.beginSendUi();
      const previousMode = this.deviceStore.deviceMode;
      try {
        const ws = this.deviceStore.getWebSocket();
        const t = this.config.terraria;
        await ws.startTerrariaClock({
          character: t.characterId,
          weaponId: t.weaponId,
          playerX: t.playerX,
          playerY: t.playerY,
          playerScale: t.playerScale,
          guardianX: t.guardianX,
          guardianY: t.guardianY,
          guardianScale: t.guardianScale,
          wingId: t.wingId,
          wingSpeed: t.wingSpeedPct,
          maskId: t.maskId || 0,
          dragonX: t.dragonX || -12,
          dragonY: t.dragonY || -3,
          dragonAngle: t.dragonAngle || 75,
          bladeX: t.bladeX || -8,
          bladeY: t.bladeY || 1,
          bladeAngle: t.bladeAngle || 105,
          biome: this._biomeToIndex(t.biome),
          bossEnabled: !!t.bossEnabled,
          bossId: this._bossSlugToIndex(t.bossId),
          bossX: t.bossX,
          bossY: t.bossY,
          bossScale: t.bossScale,
          fontId: this.config.font,
          fontScale: this.config.time.fontSize || 1,
          clockX: this.config.time.x,
          clockY: this.config.time.y,
          hourFormat: this.config.hourFormat,
          showSeconds: !!this.config.showSeconds,
          clockTextColor: this.config.time.color,
          clockBgInner: t.clockBgInner,
          clockBgOuter: t.clockBgOuter,
        });
        this.showSendSuccess("已应用");
        this._saveTerrariaConfig();
      } catch (err) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode: "terraria_clock",
        });
        console.error("发送泰拉瑞亚时钟失败:", err);
        this.showSendFailure(err);
      } finally {
        this.endSendUi();
      }
    },

    captureSendingPreview() {
      let frozen = this.previewPixels;
      if (!(frozen instanceof Map) || frozen.size === 0) {
        const rebuilt = this.buildPreviewPixels();
        if (rebuilt instanceof Map) frozen = rebuilt;
      }
      this.sendingPreviewPixels = new Map(frozen);
      this.sendingPreviewTick += 1;
    },
    clearSendingPreview() {
      this.sendingPreviewPixels = new Map();
      this.sendingPreviewTick += 1;
    },
    beginSendUi() {
      this.captureSendingPreview();
      deviceSendUxMixin.methods.beginSendUi.call(this);
    },
    endSendUi() {
      deviceSendUxMixin.methods.endSendUi.call(this);
    },

    buildPreviewPixels() {
      let scenePixels;
      try {
        scenePixels = renderTerrariaScene(this.config.terraria, this.animTimeSec);
      } catch (e) {
        console.error('[terraria] renderTerrariaScene 异常', e);
        scenePixels = new Map();
      }

      if (!this.config.time.show) return scenePixels;

      const text = this.getTimeText();
      const tmpClock = new Map();
      drawClockTextToPixels(
        text,
        this.config.time.x,
        this.config.time.y,
        this.config.time.color,
        tmpClock,
        this.config.font,
        this.config.time.fontSize || 1,
        this.config.time.align || "center",
      );
      const mask = new Set(tmpClock.keys());
      const borderedClock = applyTerrariaClockBorder(
        mask,
        this.config.time.color,
        this.config.terraria.clockBgInner,
        this.config.terraria.clockBgOuter,
      );
      borderedClock.forEach((color, key) => scenePixels.set(key, color));
      return scenePixels;
    },

    drawCanvas() {
      const pixels = this.buildPreviewPixels();
      if (!pixels) return;
      this.previewPixels = pixels;
      this.previewTick += 1;
    },
    drawGIFFrame() { this.drawCanvas(); },

    scheduleRender() { this.schedulePreviewRefresh(); },
    schedulePreviewRefresh() {
      if (!this.previewCanvasReady) return;
      if (this.previewRefreshTimer) {
        clearTimeout(this.previewRefreshTimer);
        this.previewRefreshTimer = null;
      }
      this.previewRefreshTimer = setTimeout(() => {
        this.drawCanvas();
      }, 16);
    },

    startAnimLoop() {
      if (this.animLoopHandle) return;
      this.animStartTs = Date.now();
      const tick = () => {
        if (!this.previewCanvasReady) {
          this.animLoopHandle = setTimeout(tick, 100);
          return;
        }
        this.animTimeSec = (Date.now() - this.animStartTs) / 1000;
        this.drawCanvas();
        this.animLoopHandle = setTimeout(tick, 100);
      };
      tick();
    },
    stopAnimLoop() {
      if (this.animLoopHandle) {
        clearTimeout(this.animLoopHandle);
        this.animLoopHandle = null;
      }
    },

    startPreviewClockTimer() {
      if (this.previewClockTimer) return;
      this.previewClockTimer = setInterval(() => {
        this.scheduleRender();
      }, 30000);
    },
    stopPreviewClockTimer() {
      if (this.previewClockTimer) {
        clearInterval(this.previewClockTimer);
        this.previewClockTimer = null;
      }
    },

    initPreviewCanvas() {
      const systemInfo = uni.getSystemInfoSync();
      const statusBarHeight = systemInfo.statusBarHeight || 0;
      this.$nextTick(() => {
        setTimeout(() => {
          const query = uni.createSelectorQuery().in(this);
          query.select(".canvas-section").boundingClientRect((sectionRect) => {
            if (!sectionRect || !sectionRect.height) return;
            const nextHeight = systemInfo.windowHeight - statusBarHeight - 88 - sectionRect.height;
            this.contentHeight = `${Math.max(120, nextHeight)}px`;
          });
          query.select(".preview-canvas-container").boundingClientRect((data) => {
            if (data && data.width > 0) {
              this.previewContainerSize = { width: data.width, height: data.width };
              const fitZoom = Math.max(2, Math.floor((data.width * 0.96) / 64));
              this.previewZoom = fitZoom;
              this.previewOffset = {
                x: (data.width - 64 * fitZoom) / 2,
                y: (data.width - 64 * fitZoom) / 2,
              };
            } else {
              this.previewZoom = 4;
              this.previewOffset = { x: 16, y: 16 };
            }
            this.previewCanvasReady = true;
            this.isReady = true;
            this.startAnimLoop();
            this.startPreviewClockTimer();
          }).exec();
        }, 80);
      });
    },

    ensureValidCurrentTab() {
      const validTabs = this.tabDefinitions.map(t => t.index);
      if (!validTabs.includes(this.currentTab) && validTabs.length > 0) {
        this.currentTab = validTabs[0];
      }
    },
    cleanupTransientState() {
      this.stopPreviewClockTimer();
      this.stopAnimLoop();
      this.stopLoading();
      if (this.previewRefreshTimer) {
        clearTimeout(this.previewRefreshTimer);
        this.previewRefreshTimer = null;
      }
    },
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 255, g: 255, b: 255 };
    },
    handleBack() { uni.navigateBack(); },
  },
};
</script>

<style scoped>
.clock-editor-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  overflow: hidden;
}

.canvas-section {
  display: flex;
  flex-direction: column;
  background: #000;
}

.preview-canvas-container {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #000000;
}

.canvas-placeholder {
  width: 100%;
  height: 100%;
  background: #000000;
}

.preview-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  padding: 10rpx 16rpx 12rpx;
  background: var(--bg-tertiary);
}

.preview-caption-info {
  flex: 1;
  min-width: 0;
}

.preview-caption-title {
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.action-btn-sm {
  width: auto;
  min-width: 118rpx;
  height: 64rpx;
  padding: 0 18rpx;
  gap: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--nb-ink);
  background-color: var(--bg-tertiary);
}

.action-btn-sm.primary {
  background-color: var(--nb-yellow);
  border-color: var(--nb-ink);
}

.action-btn-sm text {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.action-btn-sm.primary text {
  color: #000000;
}

.content {
  flex: 1;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: var(--bg-tertiary);
  padding: 16rpx 20rpx 0;
}

.content-wrapper {
  padding: 0 0 56rpx;
}

/* 复用同组页 settings-card 风格 */
.settings-card {
  background: var(--bg-secondary);
  border: 2rpx solid var(--nb-ink);
  padding: 20rpx;
  margin-bottom: 16rpx;
}
.card-title-section {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 12rpx 0 14rpx;
}
.card-title-section:first-child { margin-top: 0; }
.card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-primary);
}

/* 4 职业按钮网格 */
.character-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.character-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20rpx 12rpx;
  background: var(--bg-tertiary);
  border: 2rpx solid var(--nb-ink);
  gap: 6rpx;
}
.character-btn.active {
  background: var(--nb-yellow);
}
.character-name {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--text-primary);
}
.character-btn.active .character-name { color: #000; }
.character-set {
  font-size: 20rpx;
  color: var(--text-secondary);
}
.character-btn.active .character-set { color: #000; }

/* 武器 */
.weapon-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.weapon-btn {
  padding: 16rpx 12rpx;
  background: var(--bg-tertiary);
  border: 2rpx solid var(--nb-ink);
  text-align: center;
}
.weapon-btn.active {
  background: var(--nb-yellow);
}
.weapon-btn text {
  font-size: 24rpx;
  color: var(--text-primary);
}
.weapon-btn.active text { color: #000; font-weight: 700; }

/* 地形网格 (Tab 4) */
.biome-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin-bottom: 8rpx;
}
.biome-btn {
  padding: 14rpx 8rpx;
  background: var(--bg-tertiary);
  border: 2rpx solid var(--nb-ink);
  text-align: center;
}
.biome-btn.active { background: var(--nb-yellow); }
.biome-btn text { font-size: 22rpx; color: var(--text-primary); }
.biome-btn.active text { color: #000; font-weight: 700; }

/* Boss 网格 */
.boss-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10rpx;
  margin-bottom: 8rpx;
}
.boss-btn {
  display: flex;
  flex-direction: column;
  padding: 14rpx 8rpx;
  background: var(--bg-tertiary);
  border: 2rpx solid var(--nb-ink);
  text-align: center;
  gap: 4rpx;
}
.boss-btn.active { background: var(--nb-yellow); }
.boss-btn text { font-size: 22rpx; color: var(--text-primary); }
.boss-btn .boss-size { font-size: 18rpx; color: var(--text-secondary); }
.boss-btn.active text { color: #000; font-weight: 700; }
.boss-btn.active .boss-size { color: #333; }

/* Boss 开关 */
.toggle-btn {
  margin-left: auto;
  padding: 6rpx 18rpx;
  background: var(--bg-tertiary);
  border: 2rpx solid var(--nb-ink);
  font-size: 22rpx;
}
.toggle-btn.active { background: var(--nb-yellow); }
.toggle-btn text { font-size: 22rpx; color: var(--text-primary); }
.toggle-btn.active text { color: #000; font-weight: 700; }

/* 复用 setting-item-row 样式 (同组其他页公共块) */
.setting-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0;
}
.setting-label {
  font-size: 24rpx;
  color: var(--text-primary);
  min-width: 110rpx;
}
.setting-control-buttons {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.control-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 2rpx solid var(--nb-ink);
}
.control-icon {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}
.setting-value-large {
  font-size: 28rpx;
  font-weight: 700;
  font-family: monospace;
  color: var(--text-primary);
  min-width: 60rpx;
  text-align: center;
}

/* 底部 Tab 栏 */
.bottom-tabs {
  display: flex;
  flex-shrink: 0;
  padding: 2rpx 10rpx 0;
  padding-bottom: var(--layout-bottom-offset);
  background-color: var(--bg-elevated);
  border-top: 2rpx solid var(--nb-ink);
  gap: 2rpx;
}

.bottom-tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2rpx;
  min-height: 68rpx;
  padding: 2rpx 0;
}

.bottom-tab-text {
  font-size: 20rpx;
  color: var(--text-secondary);
}

.bottom-tab-item.active .bottom-tab-text {
  color: #000000;
  font-weight: 900;
  font-size: 22rpx;
}
</style>
