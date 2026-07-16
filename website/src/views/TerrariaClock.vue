<template>
  <div class="terraria-page glx-page-shell game-mode-page">
    <header class="glx-section-card terraria-topbar">
      <button
        type="button"
        class="terraria-topbar__back"
        @click="handleBack"
        aria-label="杩斿洖"
      >
        <Icon name="direction-left" :size="40" color="#000000" />
      </button>
      <h1 class="terraria-topbar__title">{{ pageHeaderTitle }}</h1>
      <div class="terraria-topbar__spacer"></div>
    </header>

    <section class="terraria-layout game-mode-layout">
      <article
        class="glx-section-card glx-section-card--stack terraria-preview-card game-preview-card"
      >
        <div class="terraria-preview-card__head">
          <div>
            <p class="terraria-preview-card__eyebrow">Device Mode</p>
            <h2 class="terraria-preview-card__title">
              {{ previewPanelTitle }}
            </h2>
          </div>
        </div>

        <div class="terraria-preview-toolbar">
          <button
            type="button"
            class="glx-button glx-button--primary terraria-send-button"
            :disabled="isSending"
            @click="sendToDevice"
          >
            {{ isSending ? "鍙戦€佷腑..." : "鍙戦€佸埌璁惧" }}
          </button>
          <span
            class="glx-chip"
            :class="
              config.terraria.autoRotate.enabled
                ? 'glx-chip--green'
                : 'glx-chip--yellow'
            ""
          >
            {{
              config.terraria.autoRotate.enabled ? "杞挱宸插紑鍚? : "杞挱宸插叧闂?
            }}
          </span>
        </div>

        <div class="terraria-preview-stage game-preview-stage canvas-section">
          <div
            class="preview-canvas-container terraria-preview-board"
            :style="previewCanvasBoxStyle"
          >
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
              v-else-if=""
                previewCanvasReady &&
                shouldShowSendingSnapshot &&
                sendingPreviewPixels.size > 0
              ""
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
            <div
              v-else-if="previewCanvasReady"
              class="terraria-preview-placeholder"
            ></div>

            <DeviceSendingOverlay
              :visible="isSending"
              :title="sendOverlayTitle"
              :description="sendOverlayTip"
            >
              <div class="terraria-preview-sending">
                <PixelPreviewBoard
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
              </div>
            </DeviceSendingOverlay>
          </div>
        </div>

        <div class="terraria-summary-grid">
          <article class="terraria-summary-card">
            <span class="terraria-summary-card__label">瑙掕壊</span>
            <strong class="terraria-summary-card__value">{{
              selectedCharacterName
            }}</strong>
            <span class="terraria-summary-card__meta">{{
              selectedWeaponName
            }}</span>
          </article>
          <article class="terraria-summary-card">
            <span class="terraria-summary-card__label">鍦烘櫙</span>
            <strong class="terraria-summary-card__value">{{
              selectedBiomeName
            }}</strong>
            <span class="terraria-summary-card__meta">{{
              selectedBossName
            }}</span>
          </article>
          <article class="terraria-summary-card">
            <span class="terraria-summary-card__label">杞挱</span>
            <strong class="terraria-summary-card__value">
              {{
                config.terraria.autoRotate.mode === "combo"
                  ? "缁勫悎杞挱"
                  : "鍏冪礌杞挱"
              }}
            </strong>
            <span class="terraria-summary-card__meta">{{
              autoRotateIntervalLabel
            }}</span>
          </article>
        </div>
      </article>

      <div class="terraria-config-stack game-mode-stack">
        <article class="glx-section-card glx-section-card--stack">
          <div class="glx-section-head">
            <h2 class="glx-section-title">妯″紡閰嶇疆</h2>
            <span class="glx-section-meta"
              >瑙掕壊 / 鍦板舰 / 杞挱 / 鏃堕棿 / 瀛椾綋</span
            >
          </div>
          <DeviceModeTabs v-model="currentTab" :items="tabDefinitions" />
        </article>

        <article
          v-if="currentTab === 3"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">瑙掕壊鎼厤</h2>
            <span class="glx-section-meta">濂楄 / 姝﹀櫒 / 闈㈠叿 / 缈呰唨</span>
          </div>

          <div class="terraria-subtabs">
            <button
              v-for="tab in equipTabItems"
              :key="tab.value"
              type="button"
              class="terraria-subtabs__item"
              :class="{ 'is-active': equipTab === tab.value }"
              @click="onEquipTab(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div
            v-if="equipTab === 0"
            class="terraria-option-grid terraria-option-grid--wide"
          >
            <button
              v-for="ch in characterList"
              :key="ch.id"
              type="button"
              class="terraria-option-card"
              :class="{ 'is-active': config.terraria.characterId === ch.id }"
              @click="selectCharacter(ch.id)"
            >
              <strong>{{ ch.armorSet }}</strong>
            </button>
          </div>

          <div v-else-if="equipTab === 1" class="terraria-option-grid">
            <button
              v-for="weapon in allWeapons"
              :key="weapon.id"
              type="button"
              class="terraria-option-card"
              :class="{ 'is-active': config.terraria.weaponId === weapon.id }"
              @click="selectWeapon(weapon.id)"
            >
              <strong>{{ weapon.name }}</strong>
            </button>
          </div>

          <div v-else-if="equipTab === 2" class="terraria-option-grid">
            <button
              type="button"
              class="terraria-option-card"
              :class="{ 'is-active': !config.terraria.maskId }"
              @click="selectMask(0)"
            >
              <strong>榛樿</strong>
            </button>
            <button
              v-for="mask in maskList"
              :key="mask.id"
              type="button"
              class="terraria-option-card"
              :class="{ 'is-active': config.terraria.maskId === mask.id }"
              @click="selectMask(mask.id)"
            >
              <strong>{{ mask.name }}</strong>
            </button>
          </div>

          <div v-else class="terraria-option-grid">
            <button
              v-for="wing in wingList"
              :key="wing.id"
              type="button"
              class="terraria-option-card"
              :class="{ 'is-active': config.terraria.wingId === wing.id }"
              @click="selectWing(wing.id)"
            >
              <strong>{{ wing.name }}</strong>
            </button>
          </div>
        </article>

        <article
          v-else-if="currentTab === 4"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">鍦烘櫙涓?Boss</h2>
            <span class="glx-section-meta">鍦板舰涓?Boss 鑱斿姩閫夋嫨</span>
          </div>

          <div class="terraria-subtabs">
            <button
              v-for="tab in terrainTabItems"
              :key="tab.value"
              type="button"
              class="terraria-subtabs__item"
              :class="{ 'is-active': terrainTab === tab.value }"
              @click="onTerrainTab(tab.value)"
            >
              {{ tab.label }}
            </button>
          </div>

          <div
            v-if="terrainTab === 0"
            class="terraria-option-grid terraria-option-grid--wide"
          >
            <button
              v-for="biome in biomeList"
              :key="biome.id"
              type="button"
              class="terraria-option-card"
              :class="{ 'is-active': config.terraria.biome === biome.id }"
              @click="selectBiome(biome.id)"
            >
              <strong>{{ biome.name }}</strong>
            </button>
          </div>

          <div v-else class="terraria-option-grid terraria-option-grid--wide">
            <button
              v-for="boss in availableBosses"
              :key="boss.slug"
              type="button"
              class="terraria-option-card"
              :class="{ 'is-active': config.terraria.bossId === boss.slug }"
              @click="selectBoss(boss.slug)"
            >
              <strong>{{ boss.nameZh }}</strong>
            </button>
          </div>
        </article>

        <article
          v-else-if="currentTab === 5"
          class="glx-section-card glx-section-card--stack"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">杞挱璁剧疆</h2>
            <span class="glx-section-meta">鍏冪礌杞挱 / 缁勫悎杞挱</span>
          </div>

          <div class="terraria-setting-row">
            <span class="terraria-setting-row__label">鑷姩杞挱</span>
            <button
              type="button"
              class="glx-button"
              :class="
                config.terraria.autoRotate.enabled
                  ? 'glx-button--primary'
                  : 'glx-button--ghost'
              ""
              @click="toggleAutoRotate"
            >
              {{ config.terraria.autoRotate.enabled ? "宸插紑鍚? : "宸插叧闂? }}
            </button>
          </div>

          <div class="terraria-block">
            <span class="terraria-block__label">杞挱妯″紡</span>
            <DeviceModeTabs
              v-model="config.terraria.autoRotate.mode"
              :items="rotateModeItems"
            />
          </div>

          <div
            v-if="config.terraria.autoRotate.mode === 'element'"
            class="terraria-list-block"
          >
            <div
              v-for="item in rotateElements"
              :key="item.key"
              class="terraria-setting-row"
            >
              <span class="terraria-setting-row__label">{{ item.label }}</span>
              <DeviceModeTabs
                :model-value="config.terraria.autoRotate.strategies[item.key]"
                :items="strategyItems"
                @update:model-value="setStrategy(item.key, $event)"
              />
            </div>
            <p class="terraria-inline-copy">
              瑙掕壊杞翠細鑷姩鑱斿姩瀵瑰簲姝﹀櫒涓庣繀鑶€锛孊oss
              杞翠細鑱斿姩瀵瑰簲鍦板舰锛屼繚鎸佽澶囩缁勫悎璇箟涓€鑷淬€?
            </p>
          </div>

          <div v-else class="terraria-list-block">
            <div class="terraria-setting-row">
              <span class="terraria-setting-row__label">鍒囨崲鏂瑰紡</span>
              <DeviceModeTabs
                :model-value="config.terraria.autoRotate.comboStrategy"
                :items="strategyItems"
                @update:model-value="setComboStrategy"
              />
            </div>

            <div class="terraria-combo-list">
              <article
                v-for="(combo, idx) in config.terraria.autoRotate.combos"
                :key="`${combo.characterId}-${combo.weaponId}-${idx}`"
                class="terraria-combo-card"
              >
                <div>
                  <strong>{{ combo.name }}</strong>
                  <p>{{ combo.biome }} / {{ combo.bossId }}</p>
                </div>
                <button
                  type="button"
                  class="glx-button glx-button--ghost"
                  @click="removeCombo(idx)"
                >
                  鍒犻櫎
                </button>
              </article>
            </div>

            <button
              v-if="config.terraria.autoRotate.combos.length < 20"
              type="button"
              class="glx-button glx-button--primary terraria-add-combo"
              @click="addCurrentAsCombo"
            >
              鏀惰棌褰撳墠閰嶇疆
            </button>
          </div>

          <div class="terraria-block">
            <span class="terraria-block__label">鍒囨崲闂撮殧</span>
            <div class="terraria-interval-grid">
              <button
                v-for="option in intervalOptions"
                :key="option.value"
                type="button"
                class="terraria-interval-grid__item"
                :class="{
                  'is-active':
                    config.terraria.autoRotate.interval === option.value,
                }""
                @click="setRotateInterval(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </article>

        <article
          v-else-if="currentTab === 1"
          class="glx-section-card glx-section-card--stack"
        >
          <ClockTextSettingsSection
            title="鏃堕棿鏄剧ず"
            description="鐩存帴娌跨敤璁惧绔椂闂存枃瀛楅厤缃紝璋冭妭瀛楀彿銆佷綅缃€侀鑹蹭笌鏄剧ず鐘舵€併€?"
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
        </article>

        <article
          v-else
          class="glx-section-card glx-section-card--stack terraria-font-panel"
        >
          <div class="glx-section-head">
            <h2 class="glx-section-title">瀛椾綋鏍峰紡</h2>
            <span class="glx-section-meta">鎸?mobile 鐨勫瓧浣撻瑙堥€昏緫灞呬腑鏄剧ず</span>
          </div>

          <div class="terraria-font-panel__section">
            <span class="terraria-font-panel__label">缁熶竴瀛椾綋</span>
            <div class="terraria-font-grid">
              <button
                v-for="font in fontOptions"
                :key="font.id"
                type="button"
                class="terraria-font-card"
                :class="{ 'is-active': config.font === font.id }"
                @click="selectFont(font.id)"
              >
                <div
                  class="terraria-font-card__preview"
                  :style="{ backgroundColor: font.previewBg }"
                >
                  <div class="terraria-font-preview-viewport">
                    <div
                      class="terraria-font-preview-wrap"
                      :style="getFontPreviewWrapStyle(font.id)"
                    >
                      <div
                        class="terraria-font-preview-grid"
                        :style="getFontPreviewGridStyle(font.id)"
                      >
                        <div
                          v-for="cell in getFontPreviewCells(font.id)"
                          :key="cell.key"
                          class="terraria-font-preview-pixel"
                          :style="{
                            backgroundColor: cell.active
                              ? font.previewColor
                              : 'transparent',
                          }""
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <span class="terraria-font-card__name">{{ font.name }}</span>
              </button>
            </div>
          </div>

          <div class="terraria-font-panel__section">
            <span class="terraria-font-panel__label">绉掗挓</span>
            <DeviceModeTabs
              :model-value="config.showSeconds"
              :items="fontSecondItems"
              @update:model-value="toggleShowSecondsFromValue"
            />
          </div>

          <div class="terraria-font-panel__section">
            <span class="terraria-font-panel__label">灏忔椂鍒跺紡</span>
            <DeviceModeTabs
              :model-value="config.hourFormat"
              :items="hourFormatItems"
              @update:model-value="setHourFormat"
            />
          </div>
        </article>
      </div>
    </section>

    <canvas
      id="imageProcessCanvas"
      type="2d"
      style=""
        position: fixed;
        left: -9999px;
        top: -9999px;
        width: 64px;
        height: 64px;
      ""
    ></canvas>

    <Toast ref="toastRef" @show="handleToastShow" @hide="handleToastHide" />
  </div>
</template>

<script>
import MobileTerrariaClock from "@/views/mobile/TerrariaClock.vue";
import DeviceSendingOverlay from "@/components/device/DeviceSendingOverlay.vue";
import ClockTextSettingsSection from "@/components/device/clock/ClockTextSettingsSection.vue";
import DeviceModeStepper from "@/components/device/modes/DeviceModeStepper.vue";
import DeviceModeTabs from "@/components/device/modes/DeviceModeTabs.vue";
import {
  drawClockTextToPixels,
  getClockTextHeight,
  getClockTextWidth,
} from "@/utils/clockCanvas.js";

const FONT_PREVIEW_PIXEL_SIZE = 5;
const FONT_PREVIEW_PIXEL_GAP = 1;
const FONT_PREVIEW_VIEWPORT_WIDTH = 148;
const FONT_PREVIEW_VIEWPORT_HEIGHT = 52;

export default {
  name: "TerrariaClock",
  extends: MobileTerrariaClock,
  components: {
    ...MobileTerrariaClock.components,
    DeviceSendingOverlay,
    ClockTextSettingsSection,
    DeviceModeStepper,
    DeviceModeTabs,
  },
  computed: {
    tabDefinitions() {
      return [
        { value: 3, label: "瑙掕壊" },
        { value: 4, label: "鍦板舰" },
        { value: 5, label: "杞挱" },
        { value: 1, label: "鏃堕棿" },
        { value: 2, label: "瀛椾綋" },
      ];
    },
    equipTabItems() {
      return [
        { value: 0, label: "濂楄" },
        { value: 1, label: "姝﹀櫒" },
        { value: 2, label: "闈㈠叿" },
        { value: 3, label: "缈呰唨" },
      ];
    },
    terrainTabItems() {
      return [
        { value: 0, label: "鍦板舰" },
        { value: 1, label: "Boss" },
      ];
    },
    rotateModeItems() {
      return [
        { value: "element", label: "鍏冪礌杞挱" },
        { value: "combo", label: "缁勫悎杞挱" },
      ];
    },
    strategyItems() {
      return [
        { value: "random", label: "闅忔満" },
        { value: "sequential", label: "椤哄簭" },
      ];
    },
    fontSecondItems() {
      return [
        { value: false, label: "鍏抽棴" },
        { value: true, label: "鏄剧ず" },
      ];
    },
    hourFormatItems() {
      return [
        { value: 24, label: "24 灏忔椂" },
        { value: 12, label: "12 灏忔椂" },
      ];
    },
    selectedCharacterName() {
      const current = this.characterList.find(
        (item) => item.id === this.config.terraria.characterId,
      );
      return current ? current.armorSet : "--";
    },
    selectedWeaponName() {
      const current = this.allWeapons.find(
        (item) => item.id === this.config.terraria.weaponId,
      );
      return current ? current.name : "--";
    },
    selectedBiomeName() {
      const current = this.biomeList.find(
        (item) => item.id === this.config.terraria.biome,
      );
      return current ? current.name : "--";
    },
    selectedBossName() {
      const current = this.availableBosses.find(
        (item) => item.slug === this.config.terraria.bossId,
      );
      return current ? current.nameZh : "--";
    },
    autoRotateIntervalLabel() {
      const current = this.intervalOptions.find(
        (item) => item.value === this.config.terraria.autoRotate.interval,
      );
      return current ? current.label : "--";
    },
  },
  methods: {
    handleBack() {
      this.$router.back();
    },
    getFontPreviewText() {
      return this.config.showSeconds ? "12:34:56" : "12:34";
    },
    getFontPreviewPixelData(fontId) {
      const pixels = new Map();
      drawClockTextToPixels(
        this.getFontPreviewText(),
        0,
        0,
        "#ffffff",
        pixels,
        fontId,
        1,
        "left",
      );

      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      pixels.forEach((value, key) => {
        const [xText, yText] = key.split(",");
        const x = Number(xText);
        const y = Number(yText);
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });

      return {
        pixels,
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      };
    },
    getFontPreviewMetrics(fontId) {
      const pixelData = this.getFontPreviewPixelData(fontId);
      const gridWidth =
        pixelData.width * FONT_PREVIEW_PIXEL_SIZE +
        (pixelData.width - 1) * FONT_PREVIEW_PIXEL_GAP;
      const gridHeight =
        pixelData.height * FONT_PREVIEW_PIXEL_SIZE +
        (pixelData.height - 1) * FONT_PREVIEW_PIXEL_GAP;
      const widthScale = FONT_PREVIEW_VIEWPORT_WIDTH / gridWidth;
      const heightScale = FONT_PREVIEW_VIEWPORT_HEIGHT / gridHeight;
      const scale = Math.min(1, widthScale, heightScale);
      const scaledPixelSize = FONT_PREVIEW_PIXEL_SIZE * scale;
      const scaledGap = FONT_PREVIEW_PIXEL_GAP * scale;
      const scaledWidth =
        pixelData.width * scaledPixelSize + (pixelData.width - 1) * scaledGap;
      const scaledHeight =
        pixelData.height * scaledPixelSize +
        (pixelData.height - 1) * scaledGap;

      return {
        width: pixelData.width,
        height: pixelData.height,
        minX: pixelData.minX,
        minY: pixelData.minY,
        gridWidth,
        gridHeight,
        scale,
        scaledPixelSize,
        scaledGap,
        scaledWidth,
        scaledHeight,
        pixels: pixelData.pixels,
      };
    },
    getFontPreviewWrapStyle(fontId) {
      const metrics = this.getFontPreviewMetrics(fontId);
      return {
        width: `${metrics.scaledWidth}px`,
        height: `${metrics.scaledHeight}px`,
      };
    },
    getFontPreviewGridStyle(fontId) {
      const metrics = this.getFontPreviewMetrics(fontId);
      return {
        gridTemplateColumns: `repeat(${metrics.width}, ${metrics.scaledPixelSize}px)`,
        gridTemplateRows: `repeat(${metrics.height}, ${metrics.scaledPixelSize}px)`,
        gap: `${metrics.scaledGap}px`,
        width: `${metrics.scaledWidth}px`,
        height: `${metrics.scaledHeight}px`,
      };
    },
    getFontPreviewCells(fontId) {
      const metrics = this.getFontPreviewMetrics(fontId);
      const cells = [];
      for (let y = 0; y < metrics.height; y++) {
        for (let x = 0; x < metrics.width; x++) {
          cells.push({
            key: `${fontId}-${x}-${y}`,
            active: metrics.pixels.has(
              `${x + metrics.minX},${y + metrics.minY}`,
            ),
          });
        }
      }
      return cells;
    },
    toggleShowSecondsFromValue(value) {
      this.config.showSeconds = value;
      this.scheduleRender();
    },
  },
};
</script>

<style scoped>
.terraria-page {
  background: linear-gradient(180deg, #eef3ff 0%, #f7f4eb 100%);
}

.terraria-topbar {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 72px;
  align-items: center;
  gap: 16px;
  min-height: 76px;
}

.terraria-topbar__back {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000000;
  background: #facc15;
  cursor: pointer;
}

.terraria-topbar__title {
  margin: 0;
  text-align: center;
  font-size: clamp(28px, 3vw, 34px);
  line-height: 1.2;
  font-weight: 900;
  color: #000000;
}

.terraria-topbar__spacer {
  width: 52px;
  height: 52px;
}

.terraria-layout {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.terraria-preview-card {
  gap: 16px;
}

.terraria-preview-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.terraria-preview-card__eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--glx-text-muted);
}

.terraria-preview-card__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
}

.terraria-preview-stage {
  padding: 18px;
}

.terraria-preview-board {
  position: relative;
  width: min(100%, 560px);
  margin: 0 auto;
  border: 2px solid #000000;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.08), transparent 52%),
    #000000;
}

.terraria-preview-placeholder,
.terraria-preview-sending {
  width: 100%;
  height: 100%;
  background: #000000;
}

.terraria-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.terraria-send-button {
  min-width: 188px;
  min-height: 48px;
}

.terraria-preview-overlay {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  pointer-events: none;
}

.terraria-preview-overlay > * {
  pointer-events: auto;
}

.terraria-send-button--overlay {
  box-shadow: 4px 4px 0 #000000;
}

.terraria-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.terraria-summary-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.terraria-summary-card__label {
  font-size: 12px;
  font-weight: 800;
  color: var(--glx-text-muted);
}

.terraria-summary-card__value {
  font-size: 16px;
  font-weight: 900;
  color: #000000;
}

.terraria-summary-card__meta {
  font-size: 12px;
  color: var(--glx-text-muted);
  line-height: 1.5;
}

.terraria-config-stack {
  min-width: 0;
}

.terraria-subtabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.terraria-subtabs__item {
  min-width: 96px;
  min-height: 42px;
  padding: 0 16px;
  border: 2px solid #000000;
  background: #ffffff;
  color: #000000;
  font-weight: 800;
  cursor: pointer;
}

.terraria-subtabs__item.is-active {
  background: #ffd23f;
}

.terraria-option-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.terraria-option-grid--wide {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.terraria-option-card {
  min-height: 54px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #000000;
  background: #ffffff;
  text-align: center;
  cursor: pointer;
}

.terraria-option-card.is-active {
  background: #ffd23f;
}

.terraria-option-card strong {
  font-size: 15px;
  line-height: 1.15;
  font-weight: 900;
  color: #000000;
}

.terraria-setting-row {
  display: grid;
  grid-template-columns: minmax(120px, auto) minmax(0, 1fr);
  gap: 16px;
  align-items: center;
}

.terraria-setting-row__label {
  font-size: 14px;
  font-weight: 800;
  color: #000000;
}

.terraria-block,
.terraria-list-block {
  display: grid;
  gap: 14px;
}

.terraria-block__label {
  font-size: 14px;
  font-weight: 800;
}

.terraria-inline-copy {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--glx-text-muted);
}

.terraria-combo-list {
  display: grid;
  gap: 12px;
}

.terraria-combo-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 2px solid #000000;
  background: #ffffff;
}

.terraria-combo-card p {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--glx-text-muted);
}

.terraria-add-combo {
  justify-self: start;
}

.terraria-interval-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.terraria-interval-grid__item {
  min-height: 42px;
  border: 2px solid #000000;
  background: #ffffff;
  color: #000000;
  font-weight: 800;
  cursor: pointer;
}

.terraria-interval-grid__item.is-active {
  background: #ffd23f;
}

.terraria-font-panel__section {
  display: grid;
  gap: 12px;
}

.terraria-font-panel__label {
  font-size: 14px;
  font-weight: 800;
  color: #000000;
}

.terraria-font-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.terraria-font-card {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 2px solid #000000;
  background: #ffffff;
  cursor: pointer;
}

.terraria-font-card.is-active {
  background: #ffd23f;
}

.terraria-font-card__preview {
  display: grid;
  place-items: center;
  min-height: 76px;
  padding: 10px 8px;
  overflow: hidden;
}

.terraria-font-preview-viewport {
  width: 148px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.terraria-font-preview-wrap {
  transform-origin: center center;
}

.terraria-font-preview-grid {
  display: grid;
}

.terraria-font-preview-pixel {
  width: 100%;
  height: 100%;
  display: block;
  border-radius: 1px;
}

.terraria-font-card__name {
  font-size: 11px;
  line-height: 1.2;
  font-weight: 800;
  color: #000000;
  text-align: center;
}

@media (max-width: 1280px) {
  .terraria-font-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1040px) {
  .terraria-font-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1180px) {
  .terraria-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .terraria-option-grid,
  .terraria-option-grid--wide {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 920px) {
  .terraria-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .terraria-summary-grid,
  .terraria-interval-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .terraria-option-grid,
  .terraria-option-grid--wide {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .terraria-topbar {
    grid-template-columns: 56px minmax(0, 1fr) 56px;
    min-height: 64px;
  }

  .terraria-topbar__back,
  .terraria-topbar__spacer {
    width: 42px;
    height: 42px;
  }

  .terraria-topbar__title {
    font-size: 22px;
  }

  .terraria-option-grid,
  .terraria-option-grid--wide,
  .terraria-setting-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .terraria-font-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
