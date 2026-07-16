<template>
  <div class="pattern-workbench">
    <section class="workbench-header">
      <div>
        <p class="eyebrow">鍥剧墖涓庡浘绾哥敓鎴?</p>
        <h1 class="title">鍏堥€変竴绉嶅鍏ユ柟寮?</h1>
        <p class="desc">
          鍏堣蛋浣犲綋鍓嶉渶瑕佺殑娴佺▼锛岀敓鎴愬畬鎴愬悗鍐嶈繘鍏ョ紪杈戝拰妫€鏌ワ紝涓嶆妸澶嶆潅鎿嶄綔涓€寮€濮嬪叏鍫嗗嚭鏉ャ€?        </p>
      </div>
      <div v-if="!showStarterHub" class="header-actions">
        <button class="secondary-btn" type="button" @click="triggerFilePick('numbered-sheet-image')">
          涓婁紶鎷艰眴鍥剧焊
        </button>
        <button class="secondary-btn" type="button" @click="$router.push('/editor')">
          鎵撳紑鍩虹缂栬緫鍣?        </button>
        <button class="primary-btn" type="button" @click="openCreateWizard('image')">
          鍥剧墖鐢熸垚
        </button>
      </div>
    </section>

    <section v-if="showStarterHub" class="starter-hub">
      <article class="starter-card">
        <span class="starter-tag">绌虹櫧寮€濮?</span>
        <h2>绌虹櫧鐢绘澘</h2>
        <p>閫傚悎浠庨浂寮€濮嬬粯鍒讹紝鐩存帴杩涘叆鐢绘澘鍒涗綔銆?</p>
        <button class="primary-btn" type="button" @click="openCreateWizard('blank')">
          寮€濮嬫柊寤?        </button>
      </article>

      <article class="starter-card">
        <span class="starter-tag">蹇€熺敓鎴?</span>
        <h2>鍥剧墖鐢熸垚</h2>
        <p>涓婁紶鍥剧墖鍚庢寜姝ラ澶勭悊锛氳鍓€佸昂瀵搞€侀瑙堛€佺‘璁ゃ€?</p>
        <button class="primary-btn" type="button" @click="openCreateWizard('image')">
          閫夋嫨鍥剧墖
        </button>
      </article>

      <article class="starter-card">
        <span class="starter-tag">鍥剧焊澶勭悊</span>
        <h2>鎷艰眴鍥剧焊鐢熸垚</h2>
        <p>閫傚悎甯︾紪鍙风殑鎷艰眴鍥剧焊锛屾寜鍥剧焊姝ラ璇嗗埆骞剁‘璁ら鑹层€?</p>
        <button class="primary-btn" type="button" @click="triggerFilePick('numbered-sheet-image')">
          涓婁紶鍥剧焊
        </button>
      </article>
    </section>

    <template v-else>
    <section class="overview-strip">
      <article
        v-for="item in overviewCards"
        :key="item.label"
        class="overview-card"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <p>{{ item.note }}</p>
      </article>
    </section>

    <section class="workbench-layout">
      <aside class="panel left-panel">
        <div class="panel-block">
          <PatternSourcePanel
            :document="document"
            :reference-document="referenceDocument"
            :capture-review-document="captureReviewDocument"
            :import-report="lastImportReport"
            @trigger-import="triggerFilePick"
            @clear-reference="workbenchStore.clearReferenceDocument"
            @clear-capture-review="workbenchStore.clearCaptureReviewDocument"
            @export-json="downloadCurrentJson"
          />
        </div>

        <div class="panel-block">
          <div class="panel-head">
            <h2>淇濈湡閲嶇偣</h2>
            <span>鍙繚鐣欏叧閿」</span>
          </div>
          <ul class="todo-list">
            <li>浼樺厛淇濊瘉涓讳綋杞粨銆侀鑹插潡鍜屽叧閿粏鑺備笉瑕佽窇鍋?/li>
            <li>濡傛灉瀹炵墿棰滆壊鏈夊亸宸紝鍐嶄笂浼犲疄鎷嶅浘鍋氫繚鐪熸牎姝?/li>
            <li>鏍囧噯鍖栨浛鎹㈠彧璐熻矗鎶婃槑鏄惧亸鑹叉敹鍥炲埌鏇寸ǔ瀹氱殑鑹插彿</li>
          </ul>
        </div>

        <div class="panel-block">
          <div class="panel-head">
            <h2>褰撳墠缁熻</h2>
            <span>{{ usedColors.length }} 绉嶉鑹?</span>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <span>闂鏁?</span>
              <strong>{{ issues.length }}</strong>
            </div>
            <div class="stat-card">
              <span>缂哄け鐐?</span>
              <strong>{{ diffResult.missing.length }}</strong>
            </div>
            <div class="stat-card">
              <span>澶氫綑鐐?</span>
              <strong>{{ diffResult.extra.length }}</strong>
            </div>
            <div class="stat-card">
              <span>棰滆壊鍋忓樊</span>
              <strong>{{ diffResult.changed.length }}</strong>
            </div>
          </div>
          <div v-if="usedColors.length" class="color-stats">
            <div
              v-for="item in usedColors.slice(0, 8)"
              :key="item.code"
              class="color-row"
            >
              <span class="color-dot" :style="{ backgroundColor: item.hex }"></span>
              <span>{{ item.code }}</span>
              <strong>{{ item.count }}</strong>
            </div>
          </div>
        </div>
      </aside>

      <main class="panel center-panel">
          <div class="canvas-toolbar">
            <div class="view-tabs">
              <button
              v-for="item in viewOptions"
              :key="item.value"
              class="view-tab"
              :class="{ active: activeView === item.value }"
              type="button"
              @click="workbenchStore.setActiveView(item.value)"
            >
              {{ item.label }}
            </button>
            </div>
            <div class="canvas-actions">
              <button class="toolbar-btn" type="button" @click="adjustStagePixelSize(-2)">缂╁皬</button>
              <button class="toolbar-btn" type="button" @click="adjustStagePixelSize(2)">鏀惧ぇ</button>
              <button class="toolbar-btn" type="button" @click="toggleMagnifier">
                {{ showMagnifier ? '鍏抽棴鏀惧ぇ' : '鎵撳紑鏀惧ぇ' }}
              </button>
            </div>
          </div>

        <div class="canvas-stage">
          <div class="stage-card current">
            <span class="stage-label">{{ stageTitle }}</span>
            <div
              class="stage-grid real-grid"
              :style="stageGridStyle"
            >
              <span
                v-for="cell in stageCells"
                :key="cell.key"
                class="stage-pixel real"
                :class="["
                  cell.variant,
                  {
                    selected: cell.key === selectedPositionKey,
                    'region-selected': selectionKeySet.has(cell.key),
                    'draw-preview': drawStrokeKeys.includes(cell.key),
                  },
                ]""
                :style="{ background: cell.color }"
                @mousedown.prevent="beginSelection(cell)"
                @mouseenter="handleStageCellHover(cell)"
                @mouseleave="clearStageCellHover"
              ></span>
            </div>
            <div class="stage-focus">
              <div class="focus-row">
                <span>褰撳墠鐒︾偣</span>
                <strong>{{ selectedPositionText }}</strong>
              </div>
              <div class="focus-row">
                <span>褰撳墠棰滆壊</span>
                <strong>{{ selectedPixelContext.currentCode }}</strong>
              </div>
              <div class="focus-row">
                <span>鍙傝€冮鑹?</span>
                <strong>{{ selectedPixelContext.referenceCode }}</strong>
              </div>
              <div class="focus-row">
                <span>鍖哄煙妗嗛€?</span>
                <strong>{{ selectedRegionCount }} 鐐?</strong>
              </div>
            </div>
          </div>

          <div class="stage-sidecars">
            <div class="stage-card ghost">
              <span class="stage-label">杞崲璇存槑</span>
              <div class="placeholder-text">
                杩欓噷鍏堢湅鍥剧墖杞儚绱犲悗鐨勭粨鏋滐紝淇濈湡鏍℃鍙湪浣犱笂浼犲疄鎷嶅浘鍚庢墠浼氫粙鍏ワ紝涓嶄細榛樿濉炲緢澶氬鏉傚伐鍏枫€?              </div>
              <ul class="diff-list">
                <li>鍥剧焊灏哄锛歿{ document.width }} 脳 {{ document.height }}</li>
                <li>棰滆壊鏁帮細{{ usedColors.length }}</li>
                <li>闂椤癸細{{ issues.length }}</li>
                <li>瀹炴媿涓€鑷寸巼锛歿{ captureReviewSummary ? `${Math.round(captureReviewSummary.matchRatio * 100)}%` : '鏈牎楠? }}</li>
              </ul>
            </div>

            <div class="stage-card ghost">
              <span class="stage-label">瀹炴媿瑙勬暣鍥?</span>
              <div
                v-if="captureReviewDocument"
                class="stage-grid side-grid"
                :style="{ gridTemplateColumns: `repeat(${captureReviewDocument.width}, minmax(0, 1fr))` }"
              >
                <span
                  v-for="cell in captureReviewCells"
                  :key="cell.key"
                  class="stage-pixel mini real"
                  :style="{ background: cell.color }"
                ></span>
              </div>
              <div v-else class="placeholder-text">
                涓婁紶鎷艰眴瀹炴媿鍥惧悗锛岃繖閲屼細鏄剧ず绠楁硶瑙勬暣鍚庣殑鏍囧噯鍥剧焊缁撴灉銆?              </div>
            </div>

            <div v-if="showMagnifier" class="stage-card ghost">
              <span class="stage-label">灞€閮ㄦ斁澶?</span>
              <div class="focus-row magnifier-meta">
                <span>瑙傚療鐐?</span>
                <strong>{{ focusPositionText }}</strong>
              </div>
              <div
                class="stage-grid magnifier-grid"
                :style="{ gridTemplateColumns: `repeat(${magnifierSize}, 20px)` }"
              >
                <span
                  v-for="cell in magnifierCells"
                  :key="cell.key"
                  class="stage-pixel magnifier-pixel"
                  :class="{ selected: cell.key === focusPositionKey }"
                  :style="{ background: cell.color }"
                ></span>
              </div>
            </div>

            <div v-if="compareDiffCellsBundle" class="stage-card ghost">
              <span class="stage-label">鐗堟湰宸紓棰勮</span>
              <div class="focus-row magnifier-meta">
                <span>瀵规瘮瀵硅薄</span>
                <strong>{{ compareSnapshot.label }}</strong>
              </div>
              <div
                class="stage-grid side-grid"
                :style="{ gridTemplateColumns: `repeat(${compareDiffCellsBundle.width}, minmax(0, 1fr))` }"
              >
                <span
                  v-for="cell in compareDiffCellsBundle.cells"
                  :key="cell.key"
                  class="stage-pixel mini real"
                  :style="{ background: cell.color }"
                ></span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <aside class="panel right-panel">
        <div class="right-panel-shell">
          <div class="right-tabs">
            <button
              v-for="item in rightPanelTabs"
              :key="item.value"
              class="right-tab"
              :class="{ active: rightPanelTab === item.value }"
              type="button"
              @click="rightPanelTab = item.value"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.badge }}</strong>
            </button>
          </div>

          <div v-if="rightPanelTab === 'confirm'" class="panel-stack">
            <div class="panel-block">
              <PatternColorConfirmPanel
                :groups="colorConfirmGroups"
                :report="lastImportReport"
                :focus-color-code="getDocumentCode(document, focusPosition.x, focusPosition.y)"
                @replace-group-color="handleColorGroupReplacement"
              />
            </div>
          </div>

          <div v-else-if="rightPanelTab === 'edit'" class="panel-stack">
            <div class="panel-block">
              <PatternEditPanel
                :tool-mode="toolMode"
                :selected-color-code="selectedColorCode"
                :selected-color-hex="selectedColorHex"
                :used-colors="usedColors"
                :all-colors="ARTKAL_COLORS_FULL"
                :selection-count="selectedRegionCount"
                :focus-color-code="getDocumentCode(document, focusPosition.x, focusPosition.y)"
                @change-tool="toolMode = $event"
                @select-color="selectedColorCode = $event"
                @selection-action="handleSelectionFill"
                @replace-focus-color="handleReplaceFocusColor"
              />
            </div>
            <div class="panel-block">
              <PatternSelectionPanel
                :selection-count="selectedRegionCount"
                :selection-bounds="selectionBounds"
                :has-reference="!!referenceDocument"
                @region-action="handleRegionAction"
                @clear-selection="clearSelection"
              />
            </div>
          </div>

          <div v-else class="panel-stack">
            <div class="panel-block">
              <div class="panel-head">
                <h2>瀹炴媿鏍￠獙</h2>
                <span>{{ captureReviewSummary ? `${Math.round(captureReviewSummary.matchRatio * 100)}% 涓€鑷碻 : '鏈紑濮? }}</span>
              </div>
              <div v-if="captureReviewSummary" class="compare-summary">
                <div class="compare-row">
                  <span>瀹炴媿鍥?</span>
                  <strong>{{ captureReviewDocument.name }}</strong>
                </div>
                <div class="compare-row">
                  <span>涓€鑷寸偣</span>
                  <strong>{{ captureReviewSummary.matchedCount }}</strong>
                </div>
                <div class="compare-row">
                  <span>涓嶄竴鑷寸偣</span>
                  <strong>{{ captureReviewSummary.mismatchCount }}</strong>
                </div>
                <div class="compare-row">
                  <span>缂哄け</span>
                  <strong>{{ captureReviewDiffResult.missing.length }}</strong>
                </div>
                <div class="compare-row">
                  <span>澶氫綑</span>
                  <strong>{{ captureReviewDiffResult.extra.length }}</strong>
                </div>
                <div class="compare-row">
                  <span>棰滆壊鍙樺寲</span>
                  <strong>{{ captureReviewDiffResult.changed.length }}</strong>
                </div>
              </div>
              <div v-else class="empty-side-note">
                涓婁紶瀹炴媿鍥惧悗锛岀郴缁熶細鑷姩瑙勬暣骞剁粰鍑轰竴鑷寸巼锛岀敤鎴峰彲浠ョ洿鎺ュ垽鏂垚鍝佹槸鍚﹀拰鍥剧焊涓€鑷淬€?              </div>
            </div>
            <div class="panel-block">
              <PatternStandardizePanel
                :groups="captureReviewChangeGroups"
                @apply-group-replacement="handleCaptureGroupReplacement"
              />
            </div>
          </div>
        </div>
      </aside>
    </section>
    </template>

    <input
      ref="numberedSheetImageInputRef"
      type="file"
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      class="hidden-input"
      @change="handleFileChange($event, 'numbered-sheet-image')"
    >
    <input
      ref="currentCsvInputRef"
      type="file"
      accept=".csv,text/csv"
      class="hidden-input"
      @change="handleFileChange($event, 'current-csv')"
    >
    <input
      ref="currentJsonInputRef"
      type="file"
      accept=".json,application/json"
      class="hidden-input"
      @change="handleFileChange($event, 'current-json')"
    >
    <input
      ref="referenceImageInputRef"
      type="file"
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      class="hidden-input"
      @change="handleFileChange($event, 'reference-image')"
    >
    <input
      ref="referenceCsvInputRef"
      type="file"
      accept=".csv,text/csv"
      class="hidden-input"
      @change="handleFileChange($event, 'reference-csv')"
    >
    <input
      ref="referenceJsonInputRef"
      type="file"
      accept=".json,application/json"
      class="hidden-input"
      @change="handleFileChange($event, 'reference-json')"
    >
    <input
      ref="captureReviewImageInputRef"
      type="file"
      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
      class="hidden-input"
      @change="handleFileChange($event, 'capture-review-image')"
    >

    <div v-if="loading || error" class="floating-status" :class="{ error: !!error }">
      {{ error || "姝ｅ湪瀵煎叆涓庡垎鏋?.." }}
    </div>

    <PatternSheetImportDialog
      :visible="showNumberedSheetImportDialog"
      :image-url="pendingNumberedSheetUrl"
      :initial-mode="pendingImportMode"
      :preview-document="previewGeneratedDocument"
      :preview-report="previewGeneratedReport"
      :preview-loading="previewGenerating"
      @cancel="closeNumberedSheetImportDialog"
      @preview="handleImportPreview"
      @confirm="handleNumberedSheetImportConfirm"
      @replace-cell-color="handlePreviewCellReplace"
    />

    <PatternCreateWizard
      :visible="showCreateWizard"
      :mode="createWizardMode"
      :preview-document="previewGeneratedDocument"
      :preview-report="previewGeneratedReport"
      :preview-loading="previewGenerating"
      @cancel="closeCreateWizard"
      @preview="handleCreateWizardPreview"
      @confirm="handleCreateWizardConfirm"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ARTKAL_COLORS_FULL, getColorByCode } from '@/data/artkal-colors.js'
import PatternColorConfirmPanel from '@/components/pattern/PatternColorConfirmPanel.vue'
import PatternCreateWizard from '@/components/pattern/PatternCreateWizard.vue'
import PatternEditPanel from '@/components/pattern/PatternEditPanel.vue'
import PatternSelectionPanel from '@/components/pattern/PatternSelectionPanel.vue'
import PatternSheetImportDialog from '@/components/pattern/PatternSheetImportDialog.vue'
import PatternSourcePanel from '@/components/pattern/PatternSourcePanel.vue'
import PatternStandardizePanel from '@/components/pattern/PatternStandardizePanel.vue'
import { importPatternFromImage } from '@/modules/pattern-workbench/core/importers/patternImportImage.js'
import { importPatternFromNumberedSheet } from '@/modules/pattern-workbench/core/importers/patternImportNumberedSheet.js'
import { usePatternWorkbenchStore } from '@/stores/patternWorkbench.js'
import { createPatternDocument, deserializePatternDocument } from '@/modules/pattern-workbench/core/model/patternDocument.js'
import { diffPatternDocuments } from '@/modules/pattern-workbench/core/diff/patternDiff.js'

const viewOptions = [
  { value: 'current', label: '褰撳墠鍥剧焊' },
  { value: 'diff', label: '宸紓鍥? },
  { value: 'overlay', label: '鍙犲姞棰勮' },
]

const workbenchStore = usePatternWorkbenchStore()
const {
  activeView,
  captureReviewDiffResult,
  captureReviewDocument,
  captureReviewSummary,
  currentDocumentExport,
  document,
  referenceDocument,
  diffResult,
  issues,
  lastImportReport,
  selectedIssueId,
  selectedIssue,
  snapshots,
  loading,
  error,
} = storeToRefs(workbenchStore)

const stagePixelSize = ref(8)
const showMagnifier = ref(true)
const hoverPosition = ref(null)
const magnifierSize = 7
const selectionStart = ref(null)
const selectionCurrent = ref(null)
const isSelecting = ref(false)
const toolMode = ref('inspect')
const selectedColorCode = ref('P13')
const drawStrokeKeys = ref([])
const isDrawing = ref(false)
const rightPanelTab = ref('confirm')
const issueFilterType = ref('all')
const compareSnapshotId = ref('')
const blinkUseReference = ref(false)

let blinkTimer = null

const numberedSheetImageInputRef = ref(null)
const currentCsvInputRef = ref(null)
const currentJsonInputRef = ref(null)
const referenceImageInputRef = ref(null)
const referenceCsvInputRef = ref(null)
const referenceJsonInputRef = ref(null)
const captureReviewImageInputRef = ref(null)
const showNumberedSheetImportDialog = ref(false)
const pendingNumberedSheetFile = ref(null)
const pendingNumberedSheetUrl = ref('')
const pendingImportMode = ref('image')
const previewGeneratedDocument = ref(null)
const previewGeneratedReport = ref(null)
const previewGenerating = ref(false)
const showCreateWizard = ref(false)
const createWizardMode = ref('blank')

const codeToHexMap = new Map(
  ARTKAL_COLORS_FULL.map((item) => [item.code, item.hex]),
)

function colorForCode(code) {
  if (!code) {
    return '#152131'
  }
  return codeToHexMap.get(code) || getColorByCode(code)?.hex || '#59a8ff'
}

function getColorDistance(leftCode, rightCode) {
  const left = getColorByCode(leftCode)
  const right = getColorByCode(rightCode)

  if (!left || !right) {
    return Number.POSITIVE_INFINITY
  }

  return Math.sqrt(
    (left.r - right.r) ** 2 +
    (left.g - right.g) ** 2 +
    (left.b - right.b) ** 2,
  )
}

function getDocumentCode(patternDocument, x, y) {
  if (!patternDocument) {
    return ''
  }
  return patternDocument.pixels.get(`${x},${y}`) || ''
}

function buildDocumentCells(patternDocument) {
  const cells = []
  for (let y = 0; y < patternDocument.height; y++) {
    for (let x = 0; x < patternDocument.width; x++) {
      const code = getDocumentCode(patternDocument, x, y)
      cells.push({
        key: `${x},${y}`,
        x,
        y,
        color: code ? colorForCode(code) : '#152131',
        variant: code ? 'filled' : 'empty',
      })
    }
  }
  return cells
}

function buildDiffCells() {
  const targetDocument = captureReviewDocument.value || referenceDocument.value
  const width = Math.max(document.value.width, targetDocument?.width || 0)
  const height = Math.max(document.value.height, targetDocument?.height || 0)
  const changedMap = new Map()

  const targetDiff = captureReviewDocument.value ? captureReviewDiffResult.value : diffResult.value

  targetDiff.missing.forEach((item) => {
    changedMap.set(`${item.x},${item.y}`, '#ffd166')
  })
  targetDiff.extra.forEach((item) => {
    changedMap.set(`${item.x},${item.y}`, '#ff6b6b')
  })
  targetDiff.changed.forEach((item) => {
    changedMap.set(`${item.x},${item.y}`, '#6ea8ff')
  })

  const cells = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`
      cells.push({
        key,
        x,
        y,
        color: changedMap.get(key) || '#152131',
        variant: changedMap.has(key) ? 'filled' : 'empty',
      })
    }
  }

  return {
    width: width || 1,
    cells,
  }
}

function buildOverlayCells() {
  const targetDocument = captureReviewDocument.value || referenceDocument.value
  const width = Math.max(document.value.width, targetDocument?.width || 0)
  const height = Math.max(document.value.height, targetDocument?.height || 0)
  const cells = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const key = `${x},${y}`
      const currentCode = getDocumentCode(document.value, x, y)
      const referenceCode = getDocumentCode(targetDocument, x, y)

      if (currentCode && referenceCode && currentCode !== referenceCode) {
        cells.push({
          key,
          x,
          y,
          color: `linear-gradient(135deg, ${colorForCode(currentCode)} 0 50%, ${colorForCode(referenceCode)} 50% 100%)`,
          variant: 'filled',
        })
        continue
      }

      if (!currentCode && referenceCode) {
        cells.push({
          key,
          x,
          y,
          color: colorForCode(referenceCode),
          variant: 'filled',
        })
        continue
      }

      cells.push({
        key,
        x,
        y,
        color: currentCode ? colorForCode(currentCode) : '#152131',
        variant: currentCode ? 'filled' : 'empty',
      })
    }
  }

  return {
    width: width || 1,
    cells,
  }
}

const currentCells = computed(() => buildDocumentCells(document.value))
const captureReviewCells = computed(() =>
  captureReviewDocument.value ? buildDocumentCells(captureReviewDocument.value) : [],
)
const diffCellsBundle = computed(() => buildDiffCells())
const overlayCellsBundle = computed(() => buildOverlayCells())
const filteredIssues = computed(() => issues.value)
const showStarterHub = computed(() => {
  return (
    document.value.id === 'draft-pattern' &&
    document.value.pixels.size === 0 &&
    !lastImportReport.value &&
    snapshots.value.length <= 1
  )
})

const stageTitle = computed(() => {
  if (activeView.value === 'diff') {
    return '宸紓鍥?
  }
  if (activeView.value === 'overlay') {
    return '鍙犲姞鍥?
  }
  return '褰撳墠鍥剧焊'
})

const stageWidth = computed(() => {
  if (activeView.value === 'diff' || activeView.value === 'overlay') {
    return diffCellsBundle.value.width
  }
  return document.value.width || 1
})

const stageCells = computed(() => {
  if (activeView.value === 'diff') {
    return diffCellsBundle.value.cells
  }
  if (activeView.value === 'overlay') {
    return overlayCellsBundle.value.cells
  }
  return currentCells.value
})

const stageGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${stageWidth.value}, ${stagePixelSize.value}px)`,
}))

const selectionBounds = computed(() => {
  if (!selectionStart.value || !selectionCurrent.value) {
    return null
  }

  const minX = Math.min(selectionStart.value.x, selectionCurrent.value.x)
  const minY = Math.min(selectionStart.value.y, selectionCurrent.value.y)
  const maxX = Math.max(selectionStart.value.x, selectionCurrent.value.x)
  const maxY = Math.max(selectionStart.value.y, selectionCurrent.value.y)

  return {
    minX,
    minY,
    maxX,
    maxY,
  }
})

const selectionKeySet = computed(() => {
  const bounds = selectionBounds.value
  if (!bounds) {
    return new Set()
  }

  const nextKeys = new Set()
  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      nextKeys.add(`${x},${y}`)
    }
  }
  return nextKeys
})

const selectionPositions = computed(() => {
  return Array.from(selectionKeySet.value).map((key) => {
    const [x, y] = key.split(',').map(Number)
    return { x, y }
  })
})

const selectedRegionCount = computed(() => selectionPositions.value.length)

const selectedPositionKey = computed(() => {
  if (!selectedIssue.value) {
    return ''
  }
  if (!selectedIssue.value.position) {
    return ''
  }
  return `${selectedIssue.value.position.x},${selectedIssue.value.position.y}`
})

const selectedPositionText = computed(() => {
  if (!selectedIssue.value) {
    return '鏈€変腑'
  }
  if (!selectedIssue.value.position) {
    return '鏈彁渚?
  }
  return `(${selectedIssue.value.position.x}, ${selectedIssue.value.position.y})`
})

const selectedPixelContext = computed(() => {
  if (!selectedIssue.value) {
    return {
      currentCode: '鏃?,
      referenceCode: '鏃?,
    }
  }

  const position = selectedIssue.value.position
  if (!position) {
    return {
      currentCode: '鏃?,
      referenceCode: '鏃?,
    }
  }

  const currentCode = getDocumentCode(document.value, position.x, position.y)
  const referenceCode = getDocumentCode(referenceDocument.value, position.x, position.y)

  return {
    currentCode: currentCode ? currentCode : '绌?,
    referenceCode: referenceCode ? referenceCode : '绌?,
  }
})

const selectedColorHex = computed(() => colorForCode(selectedColorCode.value))

const focusPosition = computed(() => {
  if (hoverPosition.value) {
    return hoverPosition.value
  }
  if (selectedIssue.value?.position) {
    return selectedIssue.value.position
  }
  return {
    x: Math.floor(document.value.width / 2),
    y: Math.floor(document.value.height / 2),
  }
})

const focusPositionKey = computed(() => `${focusPosition.value.x},${focusPosition.value.y}`)

const focusPositionText = computed(() => `(${focusPosition.value.x}, ${focusPosition.value.y})`)

const magnifierCells = computed(() => {
  const cells = []
  const halfSize = Math.floor(magnifierSize / 2)
  const startX = focusPosition.value.x - halfSize
  const startY = focusPosition.value.y - halfSize

  for (let offsetY = 0; offsetY < magnifierSize; offsetY += 1) {
    for (let offsetX = 0; offsetX < magnifierSize; offsetX += 1) {
      const x = startX + offsetX
      const y = startY + offsetY
      const code = getDocumentCode(document.value, x, y)
      cells.push({
        key: `${x},${y}`,
        color: code ? colorForCode(code) : '#152131',
      })
    }
  }

  return cells
})

const usedColors = computed(() => {
  const counts = new Map()
  document.value.pixels.forEach((code) => {
    counts.set(code, (counts.get(code) || 0) + 1)
  })

  return Array.from(counts.entries())
    .map(([code, count]) => ({
      code,
      count,
      hex: colorForCode(code),
    }))
    .sort((a, b) => b.count - a.count)
})

const colorConfirmGroups = computed(() => {
  return usedColors.value.map((item) => {
    const similarOptions = ARTKAL_COLORS_FULL
      .filter((color) => color.code !== item.code)
      .map((color) => ({
        code: color.code,
        hex: color.hex,
        distance: getColorDistance(item.code, color.code),
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 6)

    return {
      ...item,
      name: getColorByCode(item.code)?.name || '',
      similarOptions,
    }
  })
})

const overviewCards = computed(() => {
  const matchRatioText = captureReviewSummary.value
    ? `${Math.round(captureReviewSummary.value.matchRatio * 100)}%`
    : '鏈牎楠?

  return [
    {
      label: '褰撳墠鍥剧焊',
      value: `${document.value.width} 脳 ${document.value.height}`,
      note: `${usedColors.value.length} 绉嶉鑹叉鍦ㄤ娇鐢╜,
    },
    {
      label: '寰呭鐞嗛棶棰?,
      value: `${issues.value.length}`,
      note: `${filteredIssues.value.length} 椤规鍦ㄦ樉绀篳,
    },
    {
      label: '瀹炴媿涓€鑷寸巼',
      value: matchRatioText,
      note: captureReviewSummary.value
        ? `${captureReviewSummary.value.mismatchCount} 澶勫緟鏍℃`
        : '涓婁紶瀹炴媿鍥惧悗鑷姩璁＄畻',
    },
    {
      label: '鏍囧噯鍖栧缓璁?,
      value: `${captureReviewChangeGroups.value.length}`,
      note: captureReviewChangeGroups.value.length
        ? '鍙洿鎺ュ簲鐢ㄩ鑹叉浛鎹?
        : '鏆傛棤棰滆壊鍋忓樊鑱氬悎',
    },
  ]
})

const rightPanelTabs = computed(() => [
  {
    value: 'confirm',
    label: '棰滆壊纭',
    badge: `${colorConfirmGroups.value.length}`,
  },
  {
    value: 'edit',
    label: '鎵嬪姩璋冩暣',
    badge: toolMode.value === 'paint' ? '鐢荤瑪' : toolMode.value === 'erase' ? '姗＄毊' : toolMode.value === 'select' ? '妗嗛€? : '鏌ョ湅',
  },
  {
    value: 'review',
    label: '瀹炴媿鏍￠獙',
    badge: captureReviewSummary.value ? `${Math.round(captureReviewSummary.value.matchRatio * 100)}%` : '--',
  },
])

const compareSnapshot = computed(() => {
  if (!compareSnapshotId.value) {
    return null
  }
  return snapshots.value.find((item) => item.id === compareSnapshotId.value) || null
})

const compareSummary = computed(() => {
  if (!compareSnapshot.value || !compareSnapshot.value.document) {
    return null
  }

  const targetDocument = deserializePatternDocument(compareSnapshot.value.document)
  const compareDiff = diffPatternDocuments(document.value, targetDocument)

  return {
    missing: compareDiff.missing.length,
    extra: compareDiff.extra.length,
    changed: compareDiff.changed.length,
  }
})

const captureReviewChangeGroups = computed(() => {
  if (!captureReviewDiffResult.value.changed.length) {
    return []
  }

  const groupMap = new Map()
  const documentColorCounts = new Map()

  document.value.pixels.forEach((code) => {
    documentColorCounts.set(code, (documentColorCounts.get(code) || 0) + 1)
  })

  captureReviewDiffResult.value.changed.forEach((item) => {
    const groupKey = `${item.current}->${item.reference}`
    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        id: groupKey,
        sourceCode: item.current,
        targetCode: item.reference,
        count: 0,
        positions: [],
      })
    }

    const targetGroup = groupMap.get(groupKey)
    targetGroup.count += 1
    targetGroup.positions.push({
      x: item.x,
      y: item.y,
    })
  })

  return Array.from(groupMap.values())
    .map((group) => {
      const similarOptions = ARTKAL_COLORS_FULL
        .filter((item) => item.code !== group.targetCode && item.code !== group.sourceCode)
        .map((item) => ({
          code: item.code,
          hex: item.hex,
          distance: getColorDistance(group.targetCode, item.code),
        }))
        .sort((left, right) => left.distance - right.distance)
        .slice(0, 3)

      return {
        ...group,
        estimatedFixCount: group.count,
        globalSourceCount: documentColorCounts.get(group.sourceCode) || group.count,
        sourceHex: colorForCode(group.sourceCode),
        targetHex: colorForCode(group.targetCode),
        similarOptions,
      }
    })
    .sort((left, right) => right.count - left.count)
})

const compareDiffCellsBundle = computed(() => {
  if (!compareSnapshot.value || !compareSnapshot.value.document) {
    return null
  }

  const targetDocument = deserializePatternDocument(compareSnapshot.value.document)
  const compareDiff = diffPatternDocuments(document.value, targetDocument)
  const width = Math.max(document.value.width, targetDocument.width)
  const height = Math.max(document.value.height, targetDocument.height)
  const changedMap = new Map()

  compareDiff.missing.forEach((item) => {
    changedMap.set(`${item.x},${item.y}`, '#ffd166')
  })
  compareDiff.extra.forEach((item) => {
    changedMap.set(`${item.x},${item.y}`, '#ff6b6b')
  })
  compareDiff.changed.forEach((item) => {
    changedMap.set(`${item.x},${item.y}`, '#6ea8ff')
  })

  const cells = []
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const key = `${x},${y}`
      cells.push({
        key,
        color: changedMap.get(key) || '#152131',
      })
    }
  }

  return {
    width: width || 1,
    cells,
  }
})

const inputMap = {
  'numbered-sheet-image': numberedSheetImageInputRef,
  'current-csv': currentCsvInputRef,
  'current-json': currentJsonInputRef,
  'reference-image': referenceImageInputRef,
  'reference-csv': referenceCsvInputRef,
  'reference-json': referenceJsonInputRef,
  'capture-review-image': captureReviewImageInputRef,
}

function triggerFilePick(type) {
  if (type === 'current-image') {
    openCreateWizard('image')
    return
  }
  inputMap[type]?.value?.click()
}

function clearGeneratedPreview() {
  previewGeneratedDocument.value = null
  previewGeneratedReport.value = null
  previewGenerating.value = false
}

function openCreateWizard(mode) {
  createWizardMode.value = mode
  showCreateWizard.value = true
  clearGeneratedPreview()
}

function closeCreateWizard() {
  showCreateWizard.value = false
  clearGeneratedPreview()
}

function releasePendingNumberedSheet() {
  if (pendingNumberedSheetUrl.value) {
    URL.revokeObjectURL(pendingNumberedSheetUrl.value)
  }
  pendingNumberedSheetFile.value = null
  pendingNumberedSheetUrl.value = ''
  clearGeneratedPreview()
}

function closeNumberedSheetImportDialog() {
  showNumberedSheetImportDialog.value = false
  releasePendingNumberedSheet()
}

function openNumberedSheetImportDialog(file, mode = 'image') {
  releasePendingNumberedSheet()
  pendingNumberedSheetFile.value = file
  pendingNumberedSheetUrl.value = URL.createObjectURL(file)
  pendingImportMode.value = mode
  showNumberedSheetImportDialog.value = true
}

function handleIssueFilterChange(value) {
  issueFilterType.value = value
}

function beginSelection(cell) {
  if (toolMode.value === 'paint' || toolMode.value === 'erase') {
    beginDraw(cell)
    return
  }
  if (toolMode.value !== 'select') {
    return
  }
  selectionStart.value = {
    x: cell.x,
    y: cell.y,
  }
  selectionCurrent.value = {
    x: cell.x,
    y: cell.y,
  }
  isSelecting.value = true
}

function adjustStagePixelSize(step) {
  const nextValue = stagePixelSize.value + step
  if (nextValue < 4) {
    stagePixelSize.value = 4
    return
  }
  if (nextValue > 18) {
    stagePixelSize.value = 18
    return
  }
  stagePixelSize.value = nextValue
}

function toggleMagnifier() {
  showMagnifier.value = !showMagnifier.value
}

function handleStageCellHover(cell) {
  hoverPosition.value = {
    x: cell.x,
    y: cell.y,
  }
  if (isDrawing.value) {
    appendDrawCell(cell)
  }
  if (isSelecting.value) {
    selectionCurrent.value = {
      x: cell.x,
      y: cell.y,
    }
  }
}

function clearStageCellHover() {
  hoverPosition.value = null
}

function finishSelection() {
  finishDraw()
  isSelecting.value = false
}

function clearSelection() {
  selectionStart.value = null
  selectionCurrent.value = null
  isSelecting.value = false
}

function handleIssueAction(actionType) {
  if (!selectedIssueId.value) {
    return
  }
  workbenchStore.applyIssueAction(selectedIssueId.value, actionType)
}

function handleBatchAction(actionType) {
  const issueIds = filteredIssues.value.map((item) => item.id)
  workbenchStore.applyIssueActionBatch(issueIds, actionType)
}

function handleRegionAction(actionType) {
  if (!selectionPositions.value.length) {
    return
  }
  const handled = workbenchStore.applyRegionAction(selectionPositions.value, actionType)
  if (handled) {
    clearSelection()
  }
}

function beginDraw(cell) {
  if (toolMode.value !== 'paint' && toolMode.value !== 'erase') {
    return
  }
  drawStrokeKeys.value = [`${cell.x},${cell.y}`]
  isDrawing.value = true
}

function appendDrawCell(cell) {
  const key = `${cell.x},${cell.y}`
  if (drawStrokeKeys.value.includes(key)) {
    return
  }
  drawStrokeKeys.value = [...drawStrokeKeys.value, key]
}

function finishDraw() {
  if (!isDrawing.value || !drawStrokeKeys.value.length) {
    isDrawing.value = false
    drawStrokeKeys.value = []
    return
  }

  const positions = drawStrokeKeys.value.map((key) => {
    const [x, y] = key.split(',').map(Number)
    return { x, y }
  })
  workbenchStore.applyBrushStroke(positions, toolMode.value, selectedColorCode.value)
  isDrawing.value = false
  drawStrokeKeys.value = []
}

function handleSelectionFill() {
  if (!selectionPositions.value.length || !selectedColorCode.value) {
    return
  }
  const handled = workbenchStore.applyRegionFill(selectionPositions.value, selectedColorCode.value)
  if (handled) {
    clearSelection()
  }
}

function handleReplaceFocusColor() {
  const sourceCode = getDocumentCode(document.value, focusPosition.value.x, focusPosition.value.y)
  if (!sourceCode || !selectedColorCode.value) {
    return
  }
  workbenchStore.replaceColor(sourceCode, selectedColorCode.value)
}

function handleColorGroupReplacement(sourceCode, targetCode) {
  if (!sourceCode || !targetCode) {
    return
  }
  workbenchStore.replaceColor(sourceCode, targetCode)
}

function handlePreviewCellReplace(cellKey, targetCode) {
  if (!cellKey || !targetCode || !previewGeneratedDocument.value) {
    return
  }

  const nextDocument = deserializePatternDocument(previewGeneratedDocument.value)
  const currentCode = nextDocument.pixels.get(cellKey) || ''
  if (currentCode === targetCode) {
    return
  }

  nextDocument.pixels.set(cellKey, targetCode)
  previewGeneratedDocument.value = nextDocument

  if (!previewGeneratedReport.value?.reviewCells) {
    return
  }

  previewGeneratedReport.value = {
    ...previewGeneratedReport.value,
    reviewCells: previewGeneratedReport.value.reviewCells.map((item) =>
      item.key === cellKey
        ? {
          ...item,
          code: targetCode,
        }
        : item,
    ),
  }
}

function handleCaptureGroupReplacement(group, targetCode, scope) {
  if (!group || !targetCode) {
    return
  }

  if (scope === 'global') {
    workbenchStore.replaceColor(group.sourceCode, targetCode)
    return
  }

  workbenchStore.replaceColor(group.sourceCode, targetCode, group.positions)
}

function handleRestoreSnapshot(snapshotId) {
  workbenchStore.restoreSnapshot(snapshotId)
}

function toggleCompareSnapshot(snapshotId) {
  if (compareSnapshotId.value === snapshotId) {
    compareSnapshotId.value = ''
    return
  }
  compareSnapshotId.value = snapshotId
}

function downloadCurrentJson() {
  const jsonText = JSON.stringify(currentDocumentExport.value, null, 2)
  const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = globalThis.document.createElement('a')

  let fileName = 'pattern-workbench'
  if (document.value.name) {
    fileName = document.value.name
  }

  link.href = objectUrl
  link.download = `${fileName}.json`
  link.click()
  URL.revokeObjectURL(objectUrl)
}

watch(
  filteredIssues,
  (list) => {
    if (!list.length) {
      if (selectedIssueId.value) {
        workbenchStore.selectIssue('')
      }
      return
    }

    const hasSelectedIssue = list.some((item) => item.id === selectedIssueId.value)
    if (!hasSelectedIssue) {
      workbenchStore.selectIssue(list[0].id)
    }
  },
  { immediate: true },
)

onMounted(() => {
  blinkTimer = globalThis.setInterval(() => {
    blinkUseReference.value = !blinkUseReference.value
  }, 800)
  globalThis.addEventListener('mouseup', finishSelection)
})

onUnmounted(() => {
  if (blinkTimer) {
    globalThis.clearInterval(blinkTimer)
  }
  globalThis.removeEventListener('mouseup', finishSelection)
  releasePendingNumberedSheet()
})

async function handleNumberedSheetImportConfirm(payload) {
  if (!pendingNumberedSheetFile.value) {
    return
  }

  try {
    previewGenerating.value = true
    const result =
      previewGeneratedDocument.value && previewGeneratedReport.value
        ? {
            document: previewGeneratedDocument.value,
            report: previewGeneratedReport.value,
          }
        : payload.mode === 'sheet'
          ? await importPatternFromNumberedSheet(pendingNumberedSheetFile.value, {
              crop: payload.crop,
              cellSample: payload.cellSample,
              removeBackground: payload.removeBackground,
              width: payload.width,
              height: payload.height,
            })
          : await importPatternFromImage(pendingNumberedSheetFile.value, {
              crop: payload.crop,
              width: payload.width,
              height: payload.height,
            })

    workbenchStore.applyGeneratedResult(
      result,
      `${payload.mode === 'sheet' ? '鍥剧焊鐢熸垚' : '鍥剧墖鐢熸垚'} ${result.document.name}`,
      'generated',
    )
    rightPanelTab.value = 'confirm'
    closeNumberedSheetImportDialog()
  } catch (importError) {
    console.error('缂栧彿鍥剧焊璇嗗埆澶辫触:', importError)
  } finally {
    previewGenerating.value = false
  }
}

async function handleCreateWizardPreview(payload) {
  if (!payload || payload.mode !== 'image' || !payload.imageFile) {
    return
  }

  try {
    previewGenerating.value = true
    const result = await importPatternFromImage(payload.imageFile, {
      width: payload.width,
      height: payload.height,
      colorCodes: payload.colorCodes,
      name: payload.name,
    })

    previewGeneratedDocument.value = result.document
    previewGeneratedReport.value = result.report
  } catch (previewError) {
    console.error('鐢熸垚棰勮澶辫触:', previewError)
  } finally {
    previewGenerating.value = false
  }
}

async function handleCreateWizardConfirm(payload) {
  if (!payload) {
    return
  }

  if (payload.mode === 'blank') {
    const nextDocument = createPatternDocument({
      id: `blank-${Date.now()}`,
      name: payload.name,
      width: payload.width,
      height: payload.height,
      pixels: new Map(),
      sourceType: 'blank',
    })

    workbenchStore.lastImportReport = null
    workbenchStore.applyCurrentDocument(nextDocument, `鏂板缓绌虹櫧鐢绘澘 ${payload.name}`, 'created')
    rightPanelTab.value = 'confirm'
    closeCreateWizard()
    return
  }

  if (!payload.imageFile) {
    return
  }

  try {
    previewGenerating.value = true
    const result =
      previewGeneratedDocument.value && previewGeneratedReport.value
        ? {
            document: previewGeneratedDocument.value,
            report: previewGeneratedReport.value,
          }
        : await importPatternFromImage(payload.imageFile, {
            width: payload.width,
            height: payload.height,
            colorCodes: payload.colorCodes,
            name: payload.name,
          })

    workbenchStore.applyGeneratedResult(
      result,
      `鍥剧墖鐢熸垚 ${payload.name}`,
      'generated',
    )
    rightPanelTab.value = 'confirm'
    closeCreateWizard()
  } catch (confirmError) {
    console.error('鍥剧墖鐢熸垚澶辫触:', confirmError)
  } finally {
    previewGenerating.value = false
  }
}

async function handleImportPreview(payload) {
  if (!pendingNumberedSheetFile.value) {
    return
  }

  try {
    previewGenerating.value = true
    const result =
      payload.mode === 'sheet'
        ? await importPatternFromNumberedSheet(pendingNumberedSheetFile.value, {
            crop: payload.crop,
            cellSample: payload.cellSample,
            removeBackground: payload.removeBackground,
            width: payload.width,
            height: payload.height,
          })
        : await importPatternFromImage(pendingNumberedSheetFile.value, {
            crop: payload.crop,
            width: payload.width,
            height: payload.height,
          })

    previewGeneratedDocument.value = result.document
    previewGeneratedReport.value = result.report
  } catch (previewError) {
    console.error('鐢熸垚棰勮澶辫触:', previewError)
  } finally {
    previewGenerating.value = false
  }
}

async function handleFileChange(event, type) {
  const target = event.target
  const file = target.files?.[0]
  if (!file) {
    return
  }

  try {
    if (type === 'numbered-sheet-image') {
      openNumberedSheetImportDialog(file, 'sheet')
    } else if (type === 'reference-image') {
      await workbenchStore.importReferenceImage(file, {
        width: document.value.width,
        height: document.value.height,
      })
    } else if (type === 'capture-review-image') {
      await workbenchStore.importCaptureReviewImage(file, {
        width: document.value.width,
        height: document.value.height,
        denoisePasses: 2,
        contrast: 0.14,
        saturation: 0.1,
      })
    } else {
      const text = await file.text()
      if (type === 'current-csv') {
        workbenchStore.importCurrentCsv(text, { name: file.name })
      } else if (type === 'current-json') {
        workbenchStore.importCurrentJson(text)
      } else if (type === 'reference-csv') {
        workbenchStore.importReferenceCsv(text, { name: file.name })
      } else if (type === 'reference-json') {
        workbenchStore.importReferenceJson(text)
      }
    }
  } catch (importError) {
    console.error('瀵煎叆澶辫触:', importError)
  } finally {
    target.value = ''
  }
}
</script>

<style scoped>
.pattern-workbench {
  max-width: 1520px;
  margin: 0 auto;
  padding: 24px 24px 48px;
}

.workbench-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  padding: 28px 32px;
  border: 3px solid var(--nb-ink);
  border-radius: 0;
  background:
    linear-gradient(90deg, rgba(255, 243, 196, 0.62), rgba(255, 255, 255, 0.98) 56%, rgba(220, 235, 255, 0.62));
  box-shadow: var(--nb-shadow-card);
}

.starter-hub {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 20px;
}

.starter-card {
  padding: 24px;
  border-radius: 0;
  border: 3px solid var(--nb-ink);
  background: var(--tone-paper-soft);
  box-shadow: var(--nb-shadow-card);
}

.starter-tag {
  display: inline-flex;
  padding: 6px 10px;
  border: 2px solid var(--nb-ink);
  border-radius: 0;
  background: var(--tone-blue-soft);
  color: var(--nb-ink);
  font-size: 12px;
  font-weight: 800;
  box-shadow: var(--nb-shadow-soft);
}

.starter-card h2 {
  margin-top: 14px;
  color: #122033;
  font-size: 24px;
}

.starter-card p {
  margin-top: 10px;
  min-height: 66px;
  color: #617089;
  font-size: 14px;
  line-height: 1.7;
}

.starter-card .primary-btn {
  margin-top: 10px;
}

.eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2f6dff;
}

.title {
  margin-top: 10px;
  font-size: 34px;
  line-height: 1.2;
  color: #122033;
}

.desc {
  margin-top: 12px;
  max-width: 760px;
  font-size: 15px;
  line-height: 1.7;
  color: #55657d;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.sheet-dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 27, 43, 0.54);
  backdrop-filter: blur(10px);
}

.blank-dialog {
  width: min(520px, 100%);
  padding: 24px;
  border: 3px solid var(--nb-ink);
  border-radius: 0;
  background: #ffffff;
  box-shadow: var(--nb-shadow-card);
}

.blank-size-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 20px;
}

.size-preset {
  height: 42px;
  border: 2px solid var(--nb-ink);
  border-radius: 0;
  background: var(--tone-paper-soft);
  color: var(--nb-ink);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--nb-shadow-soft);
}

.size-preset.active {
  background: linear-gradient(135deg, #2f6dff, #46b9ff);
  border-color: transparent;
  color: var(--nb-ink);
}

.blank-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.blank-field {
  display: grid;
  gap: 8px;
}

.blank-field span {
  color: #18304f;
  font-size: 13px;
  font-weight: 700;
}

.blank-field input {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 2px solid var(--nb-ink);
  border-radius: 0;
  background: #fff;
  color: var(--nb-ink);
}

.primary-btn,
.secondary-btn,
.toolbar-btn,
.chip,
.view-tab,
.mode-btn {
  border: 0;
  background: none;
  cursor: pointer;
}

.primary-btn,
.secondary-btn {
  height: 44px;
  padding: 0 18px;
  border: 2px solid var(--nb-ink);
  border-radius: 0;
  font-size: 14px;
  font-weight: 800;
  box-shadow: var(--nb-shadow-soft);
}

.primary-btn {
  color: var(--nb-ink);
  background: linear-gradient(135deg, #2f6dff, #46b9ff);
  box-shadow: 0 10px 24px rgba(70, 120, 255, 0.24);
}

.secondary-btn {
  color: var(--nb-ink);
  background: var(--tone-paper-soft);
}

.mode-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 22px;
}

.overview-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.overview-card {
  padding: 18px 18px 16px;
  border-radius: 0;
  border: 3px solid var(--nb-ink);
  background: var(--tone-paper-soft);
  box-shadow: var(--nb-shadow-card);
}

.overview-card span {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: #6c7b90;
}

.overview-card strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  color: #122033;
  line-height: 1.1;
}

.overview-card p {
  margin-top: 10px;
  color: #60708a;
  font-size: 13px;
  line-height: 1.6;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  padding: 18px 18px 16px;
  border-radius: 0;
  border: 3px solid var(--nb-ink);
  background: #fff;
  text-align: left;
  transition: 0.2s ease;
  box-shadow: var(--nb-shadow-soft);
}

.mode-btn.active {
  border-color: var(--nb-ink);
  background: var(--tone-blue-soft);
  box-shadow: var(--nb-shadow-card);
}

.mode-name {
  font-size: 16px;
  font-weight: 700;
  color: #18304f;
}

.mode-note {
  font-size: 13px;
  color: #617089;
}

.workbench-layout {
  display: grid;
  grid-template-columns: 296px minmax(0, 1fr) 316px;
  gap: 18px;
  margin-top: 20px;
}

.panel {
  min-height: 720px;
  border: 3px solid var(--nb-ink);
  border-radius: 0;
  background: #ffffff;
  box-shadow: var(--nb-shadow-card);
}

.left-panel,
.right-panel {
  padding: 20px;
}

.right-panel {
  padding: 16px;
}

.right-panel-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
  position: sticky;
  top: 20px;
}

.right-tabs {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  padding: 8px;
  border-radius: 0;
  background: var(--tone-paper-soft);
  border: 2px solid var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
}

.right-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-height: 58px;
  padding: 10px 12px;
  border: 2px solid var(--nb-ink);
  border-radius: 0;
  background: var(--tone-paper-soft);
  color: #62728a;
  cursor: pointer;
  text-align: left;
  box-shadow: var(--nb-shadow-soft);
}

.right-tab span {
  font-size: 12px;
  font-weight: 700;
}

.right-tab strong {
  font-size: 14px;
  color: #18304f;
}

.right-tab.active {
  background: linear-gradient(135deg, #2f6dff, #58c0ff);
  color: var(--nb-ink);
  box-shadow: 0 10px 22px rgba(49, 109, 255, 0.22);
}

.right-tab.active strong {
  color: var(--nb-ink);
}

.panel-stack {
  display: grid;
  gap: 14px;
}

.center-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-block + .panel-block {
  margin-top: 16px;
}

.panel-stack .panel-block + .panel-block {
  margin-top: 0;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-head h2 {
  font-size: 18px;
  color: #18304f;
}

.panel-head span {
  font-size: 12px;
  color: #7b889f;
}

.source-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  padding: 9px 12px;
  border: 2px solid var(--nb-ink);
  border-radius: 0;
  background: var(--tone-paper-soft);
  color: var(--nb-ink);
  font-size: 13px;
  box-shadow: var(--nb-shadow-soft);
}

.chip.action {
  border: 2px solid var(--nb-ink);
}

.chip.action.danger {
  color: #b64545;
  background: #fff3f3;
}

.chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.source-summary {
  margin-top: 14px;
  padding: 14px;
  border-radius: 0;
  background: var(--tone-paper-soft);
  border: 2px solid var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #617089;
}

.summary-row + .summary-row {
  margin-top: 8px;
}

.summary-row strong {
  color: #18304f;
  text-align: right;
}

.todo-list {
  list-style: none;
  display: grid;
  gap: 10px;
  color: #375374;
  font-size: 14px;
}

.todo-list li {
  position: relative;
  padding-left: 16px;
  line-height: 1.6;
}

.todo-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #57b3ff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.stat-card {
  padding: 12px;
  border-radius: 0;
  background: var(--tone-paper-soft);
  border: 2px solid var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
}

.stat-card span {
  display: block;
  font-size: 12px;
  color: #6d7c92;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 24px;
  color: #18304f;
}

.color-stats {
  margin-top: 14px;
  display: grid;
  gap: 8px;
}

.color-row {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: #375374;
}

.color-row strong {
  color: #18304f;
}

.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 0;
  border: 2px solid var(--nb-ink);
}

.canvas-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.view-tabs,
.canvas-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.view-tab,
.toolbar-btn {
  height: 38px;
  padding: 0 14px;
  border: 2px solid var(--nb-ink);
  border-radius: 0;
  background: var(--tone-paper-soft);
  color: var(--nb-ink);
  font-size: 13px;
  font-weight: 700;
  box-shadow: var(--nb-shadow-soft);
}

.view-tab.active {
  background: #1d68ff;
  color: var(--nb-ink);
}

.canvas-stage {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 16px;
  align-items: start;
}

.stage-sidecars {
  display: grid;
  gap: 16px;
}

.stage-card {
  min-height: 280px;
  padding: 16px;
  border-radius: 0;
  background: #0e1624;
  color: #fff;
  border: 3px solid var(--nb-ink);
  box-shadow: var(--nb-shadow-card);
}

.stage-card.ghost {
  background: linear-gradient(180deg, #132033, #101a2a);
}

.stage-label {
  display: inline-flex;
  margin-bottom: 14px;
  padding: 6px 10px;
  border: 2px solid currentColor;
  border-radius: 0;
  background: rgba(120, 181, 255, 0.16);
  color: #d9ebff;
  font-size: 12px;
}

.stage-grid {
  display: grid;
  gap: 4px;
  width: max-content;
  max-width: 100%;
}

.stage-grid.real-grid {
  gap: 2px;
  overflow: auto;
  padding-bottom: 4px;
}

.stage-grid.side-grid {
  gap: 1px;
}

.stage-pixel {
  aspect-ratio: 1;
  border-radius: 0;
}

.stage-pixel.real.empty {
  background: #152131;
}

.stage-pixel.real.filled {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.stage-pixel.selected {
  box-shadow:
    inset 0 0 0 2px rgba(255, 255, 255, 0.82),
    0 0 0 2px rgba(82, 180, 255, 0.85);
}

.stage-pixel.region-selected {
  box-shadow:
    inset 0 0 0 2px rgba(255, 215, 90, 0.88),
    0 0 0 1px rgba(255, 193, 30, 0.45);
}

.stage-pixel.draw-preview {
  box-shadow:
    inset 0 0 0 2px rgba(120, 255, 200, 0.9),
    0 0 0 1px rgba(76, 205, 149, 0.45);
}

.magnifier-grid {
  gap: 4px;
  margin-top: 14px;
}

.magnifier-pixel {
  width: 20px;
  height: 20px;
  border-radius: 0;
}

.stage-focus {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 0;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(132, 180, 255, 0.5);
}

.focus-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #caddf8;
}

.focus-row + .focus-row {
  margin-top: 8px;
}

.focus-row strong {
  color: #ffffff;
}

.magnifier-meta {
  margin-top: 6px;
}

.placeholder-text {
  color: #a7bad4;
  line-height: 1.7;
  font-size: 14px;
}

.diff-list {
  margin-top: 14px;
  list-style: none;
  display: grid;
  gap: 8px;
  color: #d9ebff;
  font-size: 13px;
}

.version-list {
  display: grid;
  gap: 8px;
}

.compare-summary {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 0;
  background: var(--tone-paper-soft);
  border: 2px solid var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
}

.compare-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #617089;
}

.compare-row + .compare-row {
  margin-top: 8px;
}

.compare-row strong {
  color: #18304f;
}

.empty-side-note {
  padding: 14px;
  border-radius: 0;
  background: #f8fafc;
  border: 2px dashed var(--nb-ink);
  color: #6d7c92;
  font-size: 13px;
  line-height: 1.7;
}

.version-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 0;
  background: var(--tone-paper-soft);
  border: 2px solid var(--nb-ink);
  box-shadow: var(--nb-shadow-soft);
}

.version-copy {
  min-width: 0;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.version-row strong {
  color: #18304f;
  font-size: 13px;
}

.version-row span {
  color: #6d7c92;
  font-size: 12px;
  text-transform: uppercase;
}

.version-btn {
  height: 32px;
  padding: 0 12px;
  border: 2px solid var(--nb-ink);
  border-radius: 0;
  background: #fff;
  color: var(--nb-ink);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--nb-shadow-soft);
}

.hidden-input {
  display: none;
}

.floating-status {
  position: fixed;
  right: 24px;
  bottom: 24px;
  padding: 12px 16px;
  border: 2px solid var(--nb-ink);
  border-radius: 0;
  background: #18304f;
  color: #fff;
  box-shadow: var(--nb-shadow-card);
  z-index: 30;
}

.floating-status.error {
  background: #b64545;
}

@media (max-width: 1200px) {
  .starter-hub {
    grid-template-columns: 1fr;
  }

  .overview-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workbench-layout {
    grid-template-columns: 1fr;
  }

  .panel {
    min-height: auto;
  }

  .right-panel-shell {
    position: static;
  }

  .canvas-stage {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .pattern-workbench {
    padding: 14px 12px 32px;
  }

  .workbench-header {
    flex-direction: column;
    gap: 16px;
    padding: 18px 16px;
  }

  .blank-size-grid,
  .blank-fields {
    grid-template-columns: 1fr;
  }

  .eyebrow {
    font-size: 11px;
    letter-spacing: 0.08em;
  }

  .title {
    margin-top: 8px;
    font-size: 24px;
  }

  .desc {
    margin-top: 10px;
    font-size: 14px;
    line-height: 1.65;
  }

  .starter-hub {
    gap: 12px;
    margin-top: 14px;
  }

  .starter-card {
    padding: 16px;
  }

  .starter-card h2 {
    margin-top: 12px;
    font-size: 20px;
  }

  .starter-card p {
    min-height: auto;
    margin-top: 8px;
    font-size: 13px;
  }

  .mode-strip {
    grid-template-columns: 1fr;
  }

  .overview-strip {
    grid-template-columns: 1fr;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
    gap: 10px;
  }

  .header-actions > button {
    flex: 1 1 calc(50% - 5px);
  }

  .starter-card .primary-btn {
    width: 100%;
  }

  .right-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
