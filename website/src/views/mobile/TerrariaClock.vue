<!-- AUTO-CONVERTED FROM uniapp/pages/clock-editor/terraria-clock.vue -->
<template>
  <div class="clock-editor-page glx-page-shell">
    <div class="status-bar" :style="{ height: statusBarHeight + 'px' }"></div>

    <div class="navbar glx-topbar glx-page-shell__fixed">
      <div class="nav-left" @click="handleBack">
        <Icon name="direction-left" :size="32" color="var(--nb-ink)" />
      </div>
      <span class="nav-title glx-topbar__title">{{ pageHeaderTitle }}</span>
      <div class="nav-right"></div>
    </div>

    <div class="canvas-section">
      <div class="preview-canvas-container" :style="previewCanvasBoxStyle">
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
        <div v-else-if="previewCanvasReady" class="canvas-placeholder"></div>
      </div>
      <div class="preview-caption glx-preview-panel">
        <div class="preview-caption-info glx-preview-panel__info">
          <span class="preview-caption-title">{{ previewPanelTitle }}</span>
          <span
            class="auto-rotate-badge"
            :class="config.terraria.autoRotate.enabled ? 'auto-rotate-badge--on' : 'auto-rotate-badge--off'"
          >{{ config.terraria.autoRotate.enabled ? '杞挱宸插紑鍚? : '杞挱宸插叧闂? }}</span>
        </div>
        <div class="preview-actions">
          <div
            class="action-btn-sm primary glx-primary-action"
            :class="{ disabled: isSending }"
            @click="sendToDevice"
          >
            <Icon name="link" :size="36" color="#000000" />
            <span>鍙戦€?</span>
          </div>
        </div>
      </div>
    </div>

    <div data-scroll-view
      scroll-y
      class="content glx-scroll-region glx-page-shell__content"
      :style="{ height: contentHeight }"
    >
      <div class="content-wrapper glx-scroll-stack">

        <!-- Tab 1: 鏃堕棿璁剧疆 -->
        <ClockTextSettingsCard
          v-show="currentTab === 1"
          icon-name="time"
          title="鏃堕棿鏄剧ず"
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

        <!-- Tab 2: 瀛椾綋璁剧疆 -->
        <ClockFontPanel
          v-show="currentTab === 2"
          :font-options="fontOptions"
          :selected-font="config.font"
          :show-seconds="config.showSeconds"
          :hour-format="config.hourFormat"
          @select-font="selectFont"
          @set-hour-format="setHourFormat"
        />

        <!-- Tab 3: 瑙掕壊閰嶇疆 -->
        <div v-show="currentTab === 3" class="settings-card">

          <!-- 瀛?tabs: 濂楄 / 姝﹀櫒 / 闈㈠叿 / 缈呰唨 -->
          <div class="equip-tabs">
            <div class="equip-tab" :class="{ active: equipTab === 0 }" @click="onEquipTab(0)"><span>濂楄</span></div>
            <div class="equip-tab" :class="{ active: equipTab === 1 }" @click="onEquipTab(1)"><span>姝﹀櫒</span></div>
            <div class="equip-tab" :class="{ active: equipTab === 2 }" @click="onEquipTab(2)"><span>闈㈠叿</span></div>
            <div class="equip-tab" :class="{ active: equipTab === 3 }" @click="onEquipTab(3)"><span>缈呰唨</span></div>
          </div>

          <!-- 濂楄鍒楄〃 -->
          <div v-if="equipTab === 0" class="weapon-grid">
            <div
              v-for="ch in characterList"
              :key="ch.id"
              class="weapon-btn"
              :class="{ active: config.terraria.characterId === ch.id }"
              @click="selectCharacter(ch.id)"
            >
              <span>{{ ch.armorSet }}</span>
            </div>
          </div>

          <!-- 姝﹀櫒鍒楄〃 -->
          <div v-if="equipTab === 1" class="weapon-grid">
            <div
              v-for="w in allWeapons"
              :key="w.id"
              class="weapon-btn"
              :class="{ active: config.terraria.weaponId === w.id }"
              @click="selectWeapon(w.id)"
            >
              <span>{{ w.name }}</span>
            </div>
          </div>

          <!-- 闈㈠叿鍒楄〃 -->
          <div v-if="equipTab === 2" class="weapon-grid">
            <div
              class="weapon-btn"
              :class="{ active: !config.terraria.maskId }"
              @click="selectMask(0)"
            >
              <span>榛樿</span>
            </div>
            <div
              v-for="m in maskList"
              :key="m.id"
              class="weapon-btn"
              :class="{ active: config.terraria.maskId === m.id }"
              @click="selectMask(m.id)"
            >
              <span>{{ m.name }}</span>
            </div>
          </div>

          <!-- 缈呰唨鍒楄〃 -->
          <div v-if="equipTab === 3" class="weapon-grid">
            <div
              v-for="wing in wingList"
              :key="wing.id"
              class="weapon-btn"
              :class="{ active: config.terraria.wingId === wing.id }"
              @click="selectWing(wing.id)"
            >
              <span>{{ wing.name }}</span>
            </div>
          </div>

        </div>

        <!-- Tab 4: 鍦板舰 + Boss -->
        <div v-show="currentTab === 4" class="settings-card">

          <!-- 瀛?tabs: 鍦板舰 / Boss -->
          <div class="equip-tabs">
            <div class="equip-tab" :class="{ active: terrainTab === 0 }" @click="onTerrainTab(0)"><span>鍦板舰</span></div>
            <div class="equip-tab" :class="{ active: terrainTab === 1 }" @click="onTerrainTab(1)"><span>Boss</span></div>
          </div>

          <!-- 鍦板舰鍒楄〃 -->
          <div v-if="terrainTab === 0" class="weapon-grid">
            <div
              v-for="b in biomeList"
              :key="b.id"
              class="weapon-btn"
              :class="{ active: config.terraria.biome === b.id }"
              @click="selectBiome(b.id)"
            >
              <span>{{ b.name }}</span>
            </div>
          </div>

          <!-- Boss 鍒楄〃 -->
          <div v-if="terrainTab === 1" class="weapon-grid">
            <div
              v-for="bs in availableBosses"
              :key="bs.slug"
              class="weapon-btn"
              :class="{ active: config.terraria.bossId === bs.slug }"
              @click="selectBoss(bs.slug)"
            >
              <span>{{ bs.nameZh }}</span>
            </div>
          </div>

            <!-- Boss 浣嶇疆 + 缂╂斁 宸查殣钘?(鏁版嵁淇濈暀) -->

        </div>

        <!-- Tab 5: 杞挱璁剧疆 -->
        <div v-show="currentTab === 5" class="settings-card">

          <!-- 鎬诲紑鍏?-->
          <div class="setting-item-row">
            <span class="setting-label">鑷姩杞挱</span>
            <div class="setting-control-buttons">
              <div class="weapon-btn" :class="{ active: config.terraria.autoRotate.enabled }" style="padding:8rpx 24rpx" @click="toggleAutoRotate">
                <span>{{ config.terraria.autoRotate.enabled ? '寮€鍚? : '鍏抽棴' }}</span>
              </div>
            </div>
          </div>

          <!-- 妯″紡鍒囨崲 -->
          <div class="equip-tabs">
            <div class="equip-tab" :class="{ active: config.terraria.autoRotate.mode === 'element' }" @click="setRotateMode('element')"><span>鍏冪礌闅忔満</span></div>
            <div class="equip-tab" :class="{ active: config.terraria.autoRotate.mode === 'combo' }" @click="setRotateMode('combo')"><span>缁勫悎杞挱</span></div>
          </div>

          <!-- 鍏冪礌闅忔満妯″紡: 鍙?2 涓酱 (瑙掕壊 / Boss) -->
          <div v-if="config.terraria.autoRotate.mode === 'element'">
            <div v-for="item in rotateElements" :key="item.key" class="setting-item-row">
              <span class="setting-label">{{ item.label }}</span>
              <div class="setting-control-buttons" style="gap:8rpx">
                <div class="weapon-btn" :class="{ active: config.terraria.autoRotate.strategies[item.key] === 'random' }" style="padding:6rpx 16rpx" @click="setStrategy(item.key, 'random')"><span>闅忔満</span></div>
                <div class="weapon-btn" :class="{ active: config.terraria.autoRotate.strategies[item.key] === 'sequential' }" style="padding:6rpx 16rpx" @click="setStrategy(item.key, 'sequential')"><span>椤哄簭</span></div>
              </div>
            </div>
            <div class="setting-item-row" style="display:block;padding:8rpx 0 0">
              <span style="font-size:24rpx;color:#888;line-height:1.4;display:block">
                瑙掕壊鍙?鈫?姝﹀櫒鍜岀繀鑶€鑷姩鐢ㄨ瑙掕壊鐨勫浐瀹氭惌閰嶃€侭oss 鍙?鈫?鍦板舰鑷姩璺熼殢璇?Boss 鍑虹幇鐨勫満鏅€?
              </span>
            </div>
          </div>

          <!-- 缁勫悎杞挱妯″紡 -->
          <div v-if="config.terraria.autoRotate.mode === 'combo'">
            <div class="setting-item-row">
              <span class="setting-label">鍒囨崲鏂瑰紡</span>
              <div class="setting-control-buttons" style="gap:8rpx">
                <div class="weapon-btn" :class="{ active: config.terraria.autoRotate.comboStrategy === 'random' }" style="padding:6rpx 16rpx" @click="setComboStrategy('random')"><span>闅忔満</span></div>
                <div class="weapon-btn" :class="{ active: config.terraria.autoRotate.comboStrategy === 'sequential' }" style="padding:6rpx 16rpx" @click="setComboStrategy('sequential')"><span>椤哄簭</span></div>
              </div>
            </div>
            <!-- 鏀惰棌鍒楄〃 -->
            <div v-for="(combo, idx) in config.terraria.autoRotate.combos" :key="idx" class="setting-item-row">
              <span class="setting-label">{{ combo.name }}</span>
              <div class="setting-control-buttons">
                <div class="weapon-btn" style="padding:6rpx 16rpx;background:#ff4444" @click="removeCombo(idx)"><span style="color:#fff">鍒犻櫎</span></div>
              </div>
            </div>
            <div class="setting-item-row" v-if="config.terraria.autoRotate.combos.length < 20">
              <div class="weapon-btn" style="padding:12rpx 24rpx;width:100%;text-align:center" @click="addCurrentAsCombo"><span>+ 鏀惰棌褰撳墠閰嶇疆</span></div>
            </div>
          </div>

          <!-- 鍒囨崲闂撮殧 -->
          <div style="margin-top:16rpx">
            <span class="setting-label" style="margin-bottom:8rpx;display:block">鍒囨崲闂撮殧</span>
            <div class="weapon-grid">
              <div v-for="iv in intervalOptions" :key="iv.value" class="weapon-btn" :class="{ active: config.terraria.autoRotate.interval === iv.value }" @click="setRotateInterval(iv.value)">
                <span>{{ iv.label }}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- 搴曢儴 Tab 鍒囨崲 -->
    <div class="bottom-tabs">
      <div
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
        <span class="bottom-tab-text">{{ tab.label }}</span>
      </div>
    </div>

    <div v-if="isSending" class="glx-device-sending-overlay" @touchmove.stop.prevent>
      <div class="glx-device-sending-card">
        <GlxInlineLoader class="glx-device-sending-spinner" variant="chase" size="lg" />
        <span class="glx-device-sending-title">{{ sendOverlayTitle }}</span>
        <span class="glx-device-sending-tip">{{ sendOverlayTip }}</span>
      </div>
    </div>

    <canvas
      id="imageProcessCanvas"
      type="2d"
      style="position: fixed; left: -9999px; top: -9999px; width: 64px; height: 64px;"
    ></canvas>

    <Toast ref="toastRef" @show="handleToastShow" @hide="handleToastHide" />
  </div>
</template>

<script>
import { getStorage, setStorage, getSystemInfo, createDomQuery, navigateBack } from '@/utils/browser-platform.js'
import uniLifecycleAdapter from "@/mixins/uniLifecycleAdapter.js";
import { useDeviceStore } from "@/stores/device.js";
import { useToast } from "@/composables/useToast.js";
import statusBarMixin from "@/mixins/statusBar.js";
import clockPreviewMixin from "@/mixins/clock-editor/clockPreviewMixin.js";
import deviceSyncMixin from "@/mixins/clock-editor/deviceSyncMixin.js";
import deviceSendUxMixin from "@/mixins/deviceSendUxMixin.js";
import Icon from "@/components/uni/Icon.vue";
import Toast from "@/components/uni/Toast.vue";
import GlxInlineLoader from "@/components/uni/GlxInlineLoader.vue";
import PixelPreviewBoard from "@/components/uni/PixelPreviewBoard.vue";
import ClockFontPanel from "@/components/uni/clock-editor/ClockFontPanel.vue";
import ClockTextSettingsCard from "@/components/uni/clock-editor/ClockTextSettingsCard.vue";
import { getClockFontOptions, drawClockTextToPixels } from "@/utils/clockCanvas.js";
import { renderTerrariaScene, CHARACTERS, getWeaponOfs } from "@/utils/terrariaRenderer.js";
import { WING_LIST } from "@/utils/terrariaWings.js";
import { preloadAll as preloadTerrariaSprites } from "@/utils/terrariaSprites.js";
import { applyTerrariaClockBorder } from "@/utils/clockTerrariaBorder.js";
import { BIOME_LIST } from "@/utils/terrariaBiome.js";
import { getBossesForBiome } from "@/utils/terrariaBosses.js";

// 鍚勫瓧娈佃皟鑺傝寖鍥?(鏈夊彉鍖栨墠鏀捐繖, 鍒殑瀛楁涓嶉檺鍒?
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
  mixins: [uniLifecycleAdapter, 
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
      equipTab: 0,
      terrainTab: 0,

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

      currentTab: 3,
      tabDefinitions: [
        { index: 3, label: "瑙掕壊", icon: "user" },
        { index: 4, label: "鍦板舰", icon: "map" },
        { index: 5, label: "杞挱", icon: "refresh" },
        // { index: 1, label: "鏃堕棿", icon: "time" },
        // { index: 2, label: "瀛椾綋", icon: "text" },
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
          color: "#d9cd82",
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
          maskId: 0,  // 0 = 浣跨敤濂楄澶寸敳, >0 = boss 闈㈠叿 ID
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
          // 鍦板舰 + Boss
          biome: "forest",
          bossEnabled: true,
          bossId: "king_slime",
          bossX: 53,
          bossY: 41,
          bossScale: 27,
          // 姣忎釜 boss 鐙珛淇濆瓨鑷繁鐨?X/Y/scale (slug -> {x, y, scale})
          // 鍒?boss 鏃朵粠杩欓噷鍔犺浇, 璋冩暣 X/Y/scale 鏃跺啓鍥炶繖閲?
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
            solar_pillar:      { x: 32, y: 13, scale: 17 },  // 25
            nebula_pillar:     { x: 32, y: 13, scale: 17 },  // 26
            stardust_pillar:   { x: 32, y: 13, scale: 17 },  // 27
            vortex_pillar:     { x: 32, y: 13, scale: 17 },  // 28
            flying_dutchman:   { x: 53, y: 7,  scale: 19 },  // 29
            mothron:           { x: 51, y: 32, scale: 28 },  // 30
            betsy:             { x: 54, y: 27, scale: 30 },  // 31
            dark_mage:         { x: 48, y: 35, scale: 25 },  // 32
            ogre:              { x: 54, y: 35, scale: 25 },  // 33
          },
          // 鏃堕挓杈规鑹?
          clockBgInner: "#63971f",
          clockBgOuter: "#8FD71D",
          // 杞挱閰嶇疆
          autoRotate: {
            // 鎬诲紑鍏?+ 妯″紡
            enabled: false,
            mode: 'element',
            interval: 60,
            // 鍏冪礌杞挱鍙?2 涓酱: 瑙掕壊(闅忔満/椤哄簭), Boss(闅忔満/椤哄簭)
            // 姝﹀櫒/缈呰唨璺熼殢瑙掕壊鍥哄畾鎼厤, 鍦板舰璺熼殢 Boss 鍏宠仈鍦烘櫙
            strategies: {
              character: 'random',
              boss: 'random',
            },
            combos: [],
            comboStrategy: 'random',
          },
        },
      },

      biomeList: BIOME_LIST,

      presetColors: [
        { name: "楹﹁壊", hex: "#d9cd82" },
        { name: "闈掕壊", hex: "#64c8ff" },
        { name: "缁胯壊", hex: "#00ff9d" },
        { name: "榛勮壊", hex: "#ffdc00" },
        { name: "鐧借壊", hex: "#ffffff" },
      ],
    };
  },

  computed: {
    pageHeaderTitle() { return "娉版媺鐟炰簹鏃堕挓"; },
    previewPanelTitle() { return "妯℃嫙棰勮"; },
    previewCanvasBoxStyle() {
      const size = this.previewContainerSize?.height || 320;
      return { height: `${size}px` };
    },
    currentWeapons() {
      const ch = CHARACTERS[this.config.terraria.characterId];
      return ch ? ch.weapons : [];
    },
    allWeapons() {
      // 鎵€鏈?20 鎶婃鍣?鐢ㄦ埛鍙嚜鐢遍€?
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
        { id: 164, name: '鍙茶幈濮嗙帇' },
        { id: 154, name: '鍏嬭嫃椴佷箣鐪? },
        { id: 153, name: '涓栫晫鍚炲櫖鑰? },
        { id: 146, name: '鍏嬭嫃椴佷箣鑴? },
        { id: 150, name: '铚傜帇' },
        { id: 98,  name: '楠烽珔鐜? },
        { id: 276, name: '宸ㄩ箍' },
        { id: 147, name: '琛€鑲夊' },
        { id: 260, name: '鍙茶幈濮嗗コ鐨? },
        { id: 148, name: '鍙屽瓙榄旂溂' },
        { id: 155, name: '姣佺伃鑰? },
        { id: 149, name: '鏈烘楠烽珔鐜? },
        { id: 151, name: '涓栫邯涔嬭姳' },
        { id: 152, name: '鐭冲法浜? },
        { id: 168, name: '宸ㄩ奔鍏埖' },
        { id: 251, name: '鍏変箣濂崇殗' },
        { id: 186, name: '閭暀寰? },
        { id: 174, name: '鐏槦鐢熺墿' },
        { id: 187, name: '鏈堜寒棰嗕富' },
        { id: 137, name: '鍗楃摐鐜? },
        { id: 141, name: '鏍戦潰鍏? },
      ];
    },
    hasGuardian() {
      const ch = CHARACTERS[this.config.terraria.characterId];
      return !!(ch && ch.hasGuardian);
    },
    availableBosses() {
      return getBossesForBiome(this.config.terraria.biome) || [];
    },
    rotateElements() {
      // 鍏冪礌杞挱鍙?2 涓酱: 瑙掕壊鍜?Boss
      // 姝﹀櫒/缈呰唨鐢辫鑹插喅瀹? 鍦板舰鐢?Boss 鍐冲畾 (鍥哄畾鍏宠仈)
      return [
        { key: 'character', label: '瑙掕壊' },
        { key: 'boss', label: 'Boss' },
      ];
    },
    intervalOptions() {
      return [
        { value: 30, label: '30绉? },
        { value: 60, label: '1鍒嗛挓' },
        { value: 300, label: '5鍒嗛挓' },
        { value: 600, label: '10鍒嗛挓' },
        { value: 1800, label: '30鍒嗛挓' },
        { value: 3600, label: '1灏忔椂' },
      ];
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
      console.log('[terraria] 棰勫姞杞?sprite 瀹屾垚', loaded);
    } catch (e) {
      console.error('[terraria] 棰勫姞杞?sprite 寮傚父', e);
    }

    this.deviceStore = useDeviceStore();
    this.deviceStore.init();
    this.toast = useToast();

    const systemInfo = getSystemInfo();
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

  watch: {
    // 浠讳綍閰嶇疆鍙樺寲閮借嚜鍔ㄦ寔涔呭寲锛坉ebounce 200ms 閬垮厤棰戠箒鍐欏叆锛?
    config: {
      handler() {
        if (this._configSaveTimer) {
          clearTimeout(this._configSaveTimer);
        }
        this._configSaveTimer = setTimeout(() => {
          this._configSaveTimer = null;
          this._saveTerrariaConfig();
        }, 200);
      },
      deep: true,
    },
  },

  methods: {
    switchEquipTab(idx) {
      this.equipTab = idx;
    },
    onEquipTab(idx) {
      this.equipTab = idx;
    },
    onTerrainTab(idx) {
      this.terrainTab = idx;
    },
    toggleAutoRotate() {
      this.config.terraria.autoRotate.enabled = !this.config.terraria.autoRotate.enabled;
    },
    setRotateMode(mode) {
      this.config.terraria.autoRotate.mode = mode;
    },
    setStrategy(key, strategy) {
      this.config.terraria.autoRotate.strategies[key] = strategy;
    },
    setComboStrategy(strategy) {
      this.config.terraria.autoRotate.comboStrategy = strategy;
    },
    setRotateInterval(val) {
      this.config.terraria.autoRotate.interval = val;
    },
    addCurrentAsCombo() {
      const t = this.config.terraria;
      const ch = CHARACTERS[t.characterId];
      if (!ch) return;
      if (t.autoRotate.combos.length >= 20) return;
      t.autoRotate.combos.push({
        name: ch.armorSet + ' + ' + (ch.weapons.find(w => w.id === t.weaponId)?.name || ''),
        characterId: t.characterId,
        weaponId: t.weaponId,
        wingId: t.wingId,
        biome: t.biome,
        bossId: t.bossId,
      });
    },
    removeCombo(idx) {
      this.config.terraria.autoRotate.combos.splice(idx, 1);
    },
    selectCharacter(charId) {
      const ch = CHARACTERS[charId];
      if (!ch) return;
      this._disableAutoRotateOnEdit();
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
      this._disableAutoRotateOnEdit();
      this.config.terraria.weaponId = weaponId;
      const ofs = getWeaponOfs(weaponId);
      this.config.terraria.weaponOfsX = ofs.x;
      this.config.terraria.weaponOfsY = ofs.y;
      this.config.terraria.weaponRotate = ofs.rotate;
      this.scheduleRender();
    },
    selectWing(wingId) {
      this._disableAutoRotateOnEdit();
      this.config.terraria.wingId = wingId;
      this.scheduleRender();
    },
    selectMask(maskId) {
      this._disableAutoRotateOnEdit();
      this.config.terraria.maskId = maskId || 0;
      this.scheduleRender();
    },
    // 鐢ㄦ埛鎵嬪姩鏀逛簡瑙掕壊/姝﹀櫒/缈呰唨/闈㈠叿/Boss/鍦板舰 鈥?绔嬪嵆鍏抽棴杞挱,
    //   棰勮鍗′笂鐨?杞挱宸插紑鍚?鍏抽棴"寰芥爣浼氱珛鍒诲悓姝ュ弽鏄?鎵€瑙佸嵆鎵€寰椼€?"
    _disableAutoRotateOnEdit() {
      const ar = this.config.terraria.autoRotate;
      if (ar && ar.enabled) {
        ar.enabled = false;
      }
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
        // boss 瀛楁 (bossX/Y/Scale) 鍚屾鍐欏洖 bossOverrides[bossId]
        if (key === 'bossX' || key === 'bossY' || key === 'bossScale') {
          this._saveBossOverride();
        }
        this.scheduleRender();
      }
    },
    // 鎶婂綋鍓?bossX/Y/Scale 瀛樺埌 bossOverrides[bossId]
    _saveBossOverride() {
      const t = this.config.terraria;
      if (!t.bossId) return;
      if (!t.bossOverrides) t.bossOverrides = {};
      t.bossOverrides[t.bossId] = {
        x: t.bossX, y: t.bossY, scale: t.bossScale,
      };
    },
    _saveTerrariaConfig() {
      setStorage('terraria_clock_config', {
        font: this.config.font,
        hourFormat: this.config.hourFormat,
        showSeconds: this.config.showSeconds,
        time: this.config.time,
        terraria: this.config.terraria,
      });
    },
    _loadTerrariaConfig() {
      const saved = getStorage('terraria_clock_config');
      if (saved && typeof saved === 'object') {
        if (saved.font) this.config.font = saved.font;
        if (saved.hourFormat) this.config.hourFormat = saved.hourFormat;
        if (saved.showSeconds !== undefined) this.config.showSeconds = saved.showSeconds;
        if (saved.time) Object.assign(this.config.time, saved.time);
        if (saved.terraria) {
          Object.assign(this.config.terraria, saved.terraria);
          // 4 鏌遍粯璁?y 宸蹭粠 23 璋冨埌 13(寰€涓婄Щ 10), 寮哄埗鍒锋帀鑰佺紦瀛橀噷鐨勬棫鍊?
          const t = this.config.terraria;
          if (t.bossOverrides) {
            for (const slug of ['solar_pillar', 'nebula_pillar', 'stardust_pillar', 'vortex_pillar']) {
              if (t.bossOverrides[slug]) t.bossOverrides[slug].y = 13;
            }
          }
          // 鏃?autoRotate.strategies 瀛楁宸插簾寮?(armor/weapon/wing/biome/boss + 'fixed' 閫夐」)
          // 涓€寰嬮噸缃负鏂扮粨鏋?(character/boss + 鍙殢鏈?椤哄簭), 閬垮厤鏃ф暟鎹薄鏌?
          const ar = this.config.terraria.autoRotate;
          if (ar) {
            const newStrategies = { character: 'random', boss: 'random' };
            const oldChar = ar.strategies && ar.strategies.character;
            const oldBoss = ar.strategies && ar.strategies.boss;
            if (oldChar === 'random' || oldChar === 'sequential') {
              newStrategies.character = oldChar;
            }
            if (oldBoss === 'random' || oldBoss === 'sequential') {
              newStrategies.boss = oldBoss;
            }
            ar.strategies = newStrategies;
            // 鏃?comboStrategy 'fixed' 涓嶅啀鏀寔
            if (ar.comboStrategy !== 'random' && ar.comboStrategy !== 'sequential') {
              ar.comboStrategy = 'random';
            }
          }
        }
      }
    },
    // 浠?bossOverrides[slug] 鍔犺浇鍒?bossX/Y/Scale, 濡傛灉娌℃湁灏辩敤榛樿 48/32/25
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
      // 璺?BIOME_LIST 椤哄簭瀵归綈, 鏉胯浇 sprites_tiles.h getBiomeTile 鐢ㄥ悓鏍风殑 index
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
      this._disableAutoRotateOnEdit();
      this.config.terraria.biome = biomeId;
      // 鍒囧湴褰㈡椂 boss 鍒楄〃浼氬彉, 鑷姩閫夌涓€涓?
      const list = getBossesForBiome(biomeId);
      if (list.length > 0) {
        this.config.terraria.bossId = list[0].slug;
        this._loadBossOverride(list[0].slug);
      }
      this.scheduleRender();
    },
    selectBoss(slug) {
      this._disableAutoRotateOnEdit();
      this.config.terraria.bossId = slug;
      this._loadBossOverride(slug);
      this.scheduleRender();
    },
    toggleBoss() {
      this._disableAutoRotateOnEdit();
      this.config.terraria.bossEnabled = !this.config.terraria.bossEnabled;
      this.scheduleRender();
    },

    // ===== 鐩存帴瑕嗙洊 mixin 鐨?sendToDevice (terraria 璧扮嫭绔?ws.startTerrariaClock) =====
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
          // 杞挱閰嶇疆: 鏃犺寮€/鍏抽兘鍙戝畬鏁村璞?鍏抽棴鏃舵澘杞戒篃鑳界珛鍒诲仠姝㈣疆鎾?
          // (涔嬪墠 enabled=false 鏃跺彂 undefined 鈫?鏉胯浇 if (containsKey "autoRotate")
          //  璺宠繃 鈫?鏃ц疆鎾姸鎬佹畫鐣欑户缁浆)
          autoRotate: {
            enabled: !!t.autoRotate.enabled,
            mode: t.autoRotate.mode === 'combo' ? 1 : 0,
            interval: t.autoRotate.interval,
            // 鏉胯浇 RotateStrategy: random=0, sequential=1 (鍥哄畾閫夐」宸插幓鎺?
            strategies: {
              character: t.autoRotate.strategies.character === 'sequential' ? 1 : 0,
              boss: t.autoRotate.strategies.boss === 'sequential' ? 1 : 0,
            },
            combos: t.autoRotate.combos.map(c => ({
              char: Object.keys(CHARACTERS).indexOf(c.characterId),
              weapon: c.weaponId,
              wing: c.wingId,
              biome: this._biomeToIndex(c.biome),
              boss: this._bossSlugToIndex(c.bossId),
            })),
            comboStrategy: t.autoRotate.comboStrategy === 'sequential' ? 1 : 0,
          },
        });
        this.showSendSuccess("宸插簲鐢?")";"
        this._saveTerrariaConfig();
      } catch (err) {
        await this.deviceStore.rollbackBusinessMode(previousMode, {
          expectedMode: "terraria_clock",
        });
        console.error("鍙戦€佹嘲鎷夌憺浜氭椂閽熷け璐?", err);
        this.showSendFailure(err);
      } finally {
        this.endSendUi();
      }
    },

    captureSendingPreview() {
      // 蹇収鍙鍒跺綋鍓?previewPixels, 涓嶉噸鏂版覆鏌?(閬垮厤鍙戦€佺灛闂村崱椤?
      // 濡傛灉杩樻病鏈夋湁鏁堝儚绱犲氨鐢ㄧ┖ Map (loading 鍗犱綅浼氱洊浣?
      const frozen = this.previewPixels instanceof Map ? this.previewPixels : new Map();
      this.sendingPreviewPixels = new Map(frozen);
      this.sendingPreviewTick += 1;
    },
    clearSendingPreview() {
      this.sendingPreviewPixels = new Map();
      this.sendingPreviewTick += 1;
    },
    beginSendUi() {
      this.captureSendingPreview();
      // 鍙戦€佹湡闂存殏鍋滃姩鐢诲惊鐜? 閬垮厤 await 鍗￠】鏈熼棿 setTimeout 浠诲姟鍫嗙Н
      // 绛変簨鍔¤繑鍥炲悗涓€娆℃€цˉ璺戝鑷村姩鐢?浜屽€嶉€熻烦璺?
      this.stopAnimLoop();
      deviceSendUxMixin.methods.beginSendUi.call(this);
    },
    endSendUi() {
      deviceSendUxMixin.methods.endSendUi.call(this);
      // 鎭㈠鍔ㄧ敾寰幆 鈥?閲嶇疆 animStartTs 閬垮厤鏃堕棿鎴宠烦璺冮€犳垚浜屽€嶉€熸劅
      if (this.previewCanvasReady && !this.animLoopHandle) {
        this.animStartTs = Date.now();
        this.animTimeSec = 0;
        this.startAnimLoop();
      }
    },

    buildPreviewPixels() {
      let scenePixels;
      try {
        scenePixels = renderTerrariaScene(this.config.terraria, this.animTimeSec);
      } catch (e) {
        console.error('[terraria] renderTerrariaScene 寮傚父', e);
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
      // 200ms 涓€甯?(5fps) 鈥?灏忕▼搴?Map 澶ч噺 set 鎬ц兘宸? 涓嶉渶瑕?60fps
      const FRAME_INTERVAL_MS = 200;
      const tick = () => {
        if (!this.previewCanvasReady) {
          this.animLoopHandle = setTimeout(tick, FRAME_INTERVAL_MS);
          return;
        }
        this.animTimeSec = (Date.now() - this.animStartTs) / 1000;
        this.drawCanvas();
        this.animLoopHandle = setTimeout(tick, FRAME_INTERVAL_MS);
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
      const systemInfo = getSystemInfo();
      const statusBarHeight = systemInfo.statusBarHeight || 0;
      this.$nextTick(() => {
        setTimeout(() => {
          const query = createDomQuery().in(this);
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
    handleBack() { navigateBack(); },
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
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.auto-rotate-badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  height: 32rpx;
  padding: 0 12rpx;
  font-size: 20rpx;
  font-weight: 800;
  line-height: 1;
  border: 2rpx solid var(--nb-ink);
  box-sizing: border-box;
}

.auto-rotate-badge--on {
  background: var(--nb-green, #5fd068);
  color: var(--nb-ink);
}

.auto-rotate-badge--off {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
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

/* 澶嶇敤鍚岀粍椤?settings-card 椋庢牸 */
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

/* 4 鑱屼笟鎸夐挳缃戞牸 */
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

/* 姝﹀櫒 */
.weapon-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
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

/* 妯悜 tabs (濂楄/姝﹀櫒/闈㈠叿/缈呰唨) */
.equip-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16rpx;
  border-bottom: 2rpx solid var(--nb-ink);
}
.equip-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-bottom: 4rpx solid transparent;
}
.equip-tab.active {
  border-bottom-color: var(--nb-yellow);
}
.equip-tab text {
  font-size: 26rpx;
  color: var(--text-secondary);
}
.equip-tab.active text {
  color: var(--text-primary);
  font-weight: 700;
}
.htabs-scroll {
  white-space: nowrap;
  margin-bottom: 16rpx;
}
.htabs-row {
  display: inline-flex;
  gap: 12rpx;
  padding: 4rpx 0;
}
.htab-item {
  display: inline-flex;
  align-items: center;
  padding: 14rpx 24rpx;
  background: var(--bg-tertiary);
  border: 2rpx solid var(--nb-ink);
  border-radius: 8rpx;
  white-space: nowrap;
}
.htab-item.active {
  background: var(--nb-yellow);
}
.htab-item text {
  font-size: 24rpx;
  color: var(--text-primary);
}
.htab-item.active text { color: #000; font-weight: 700; }

/* 鍦板舰缃戞牸 (Tab 4) */
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

/* Boss 缃戞牸 */
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

/* Boss 寮€鍏?*/
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

/* 澶嶇敤 setting-item-row 鏍峰紡 (鍚岀粍鍏朵粬椤靛叕鍏卞潡) */
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

/* 搴曢儴 Tab 鏍?*/
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
