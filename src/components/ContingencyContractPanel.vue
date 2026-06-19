<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  getContingencyContractSeasons,
  getContractTagDisabledReason,
  getDefaultContingencyContractSeason,
  getSelectedContractScore,
  type ContingencyContractTag,
} from '@/data/contingencyContracts'
import { useTimelineStore } from '@/stores/timelineStore'

const { t } = useI18n({ useScope: 'global' })
const store = useTimelineStore()

const seasons = getContingencyContractSeasons()
const defaultSeason = getDefaultContingencyContractSeason()
const activeSeasonId = ref(defaultSeason?.id ?? seasons[0]?.id ?? '')
// Backed by the timeline store (persisted per-scenario, fed into the damage simulation).
const selectedTagIds = computed<Set<number>>({
  get: () => new Set(store.contingencyContractTags),
  set: (val) => store.setContingencyContractTags(Array.from(val)),
})

const CONTRACT_COLUMN_WIDTH = 76
const CONTRACT_COLUMN_GAP = 12
const CONTRACT_ROW_HEIGHT = 52
const CONTRACT_ROW_GAP = 22
const CONTRACT_TAG_WIDTH = 58
const CONTRACT_TAG_HEIGHT = 52
const CONTRACT_MAX_SCORE_ROW = 3

const activeSeason = computed(() =>
  seasons.find(season => season.id === activeSeasonId.value) ?? defaultSeason ?? seasons[0] ?? null,
)

const activeTagMap = computed(() => {
  const season = activeSeason.value
  return new Map((season?.groups ?? []).flatMap(group => group.tags).map(tag => [tag.id, tag]))
})

const selectedScore = computed(() => {
  const season = activeSeason.value
  return season ? getSelectedContractScore(season, selectedTagIds.value) : 0
})

const selectedTags = computed(() => {
  const season = activeSeason.value
  if (!season) return []
  return season.groups.flatMap(group => group.tags).filter(tag => selectedTagIds.value.has(tag.id))
})

const tagCells = computed(() => {
  const season = activeSeason.value
  if (!season) return []

  return season.groups.flatMap((group, columnIndex) => group.tags.map(tag => {
    const rowIndex = Math.max(0, Math.min(CONTRACT_MAX_SCORE_ROW - 1, Math.round(Number(tag.score) || 1) - 1))
    const columnLeft = columnIndex * (CONTRACT_COLUMN_WIDTH + CONTRACT_COLUMN_GAP)
    return {
      tag,
      columnIndex,
      rowIndex,
      left: columnLeft + Math.round((CONTRACT_COLUMN_WIDTH - CONTRACT_TAG_WIDTH) / 2),
      top: rowIndex * (CONTRACT_ROW_HEIGHT + CONTRACT_ROW_GAP),
    }
  }))
})

const contractGridWidth = computed(() => {
  const columnCount = activeSeason.value?.groups.length ?? 0
  return columnCount > 0
    ? columnCount * CONTRACT_COLUMN_WIDTH + (columnCount - 1) * CONTRACT_COLUMN_GAP
    : 0
})

const contractGridHeight = computed(
  () => CONTRACT_MAX_SCORE_ROW * CONTRACT_ROW_HEIGHT + (CONTRACT_MAX_SCORE_ROW - 1) * CONTRACT_ROW_GAP,
)

const conflictConnectors = computed(() => {
  const byConflict = new Map<string, typeof tagCells.value>()
  for (const cell of tagCells.value) {
    if (!cell.tag.conflictId) continue
    const list = byConflict.get(cell.tag.conflictId) ?? []
    list.push(cell)
    byConflict.set(cell.tag.conflictId, list)
  }

  const connectors: Array<{
    key: string
    kind: 'horizontal' | 'vertical'
    left: number
    top: number
    width?: number
    height?: number
  }> = []

  for (const [conflictId, cells] of byConflict) {
    const byRow = new Map<number, typeof cells>()
    const byColumn = new Map<number, typeof cells>()

    for (const cell of cells) {
      const rowCells = byRow.get(cell.rowIndex) ?? []
      rowCells.push(cell)
      byRow.set(cell.rowIndex, rowCells)

      const columnCells = byColumn.get(cell.columnIndex) ?? []
      columnCells.push(cell)
      byColumn.set(cell.columnIndex, columnCells)
    }

    for (const [rowIndex, rowCells] of byRow) {
      rowCells.sort((a, b) => a.columnIndex - b.columnIndex)
      for (let index = 0; index < rowCells.length - 1; index += 1) {
        const current = rowCells[index]
        const next = rowCells[index + 1]
        if (!current || !next || current.columnIndex === next.columnIndex) continue
        const left = current.left + CONTRACT_TAG_WIDTH
        const width = next.left - left
        if (width <= 0) continue
        connectors.push({
          key: `${conflictId}-h-${rowIndex}-${current.columnIndex}-${next.columnIndex}`,
          kind: 'horizontal',
          left,
          top: current.top + Math.round(CONTRACT_TAG_HEIGHT / 2) - 7,
          width,
        })
      }
    }

    for (const [columnIndex, columnCells] of byColumn) {
      columnCells.sort((a, b) => a.rowIndex - b.rowIndex)
      for (let index = 0; index < columnCells.length - 1; index += 1) {
        const current = columnCells[index]
        const next = columnCells[index + 1]
        if (!current || !next || current.rowIndex === next.rowIndex) continue
        const top = current.top + CONTRACT_TAG_HEIGHT
        const height = next.top - top
        if (height <= 0) continue
        connectors.push({
          key: `${conflictId}-v-${columnIndex}-${current.rowIndex}-${next.rowIndex}`,
          kind: 'vertical',
          left: current.left + Math.round(CONTRACT_TAG_WIDTH / 2) - 7,
          top,
          height,
        })
      }
    }
  }

  return connectors
})

watch(activeSeasonId, () => {
  selectedTagIds.value = new Set()
})

type ContractDescriptionPart = {
  text: string
  highlighted: boolean
}

function getTagBlackboardValue(tag: ContingencyContractTag, key: string): number | null {
  for (const term of tag.terms) {
    const entry = term.blackboard.find(item => item.key === key)
    if (entry) return Number(entry.value)
  }
  return null
}

function evaluateContractExpression(expression: string, tag: ContingencyContractTag): number | null {
  const tokens = expression.match(/[+-]?[^+-]+/g) ?? []
  if (tokens.length === 0) return null

  let total = 0
  for (const rawToken of tokens) {
    const sign = rawToken.startsWith('-') ? -1 : 1
    const token = rawToken.replace(/^[+-]/, '').trim()
    if (!token) continue

    const numeric = Number(token)
    if (Number.isFinite(numeric)) {
      total += sign * numeric
      continue
    }

    const value = getTagBlackboardValue(tag, token)
    if (value == null || !Number.isFinite(value)) return null
    total += sign * value
  }

  return total
}

function formatContractValue(value: number, format: string): string {
  if (format === '0%') return `${Math.round(value * 100)}%`
  if (format === '0') return `${Math.round(value)}`
  return `${value}`
}

function resolveContractPlaceholder(content: string, currentTag: ContingencyContractTag): string {
  let targetTag = currentTag
  let expressionWithFormat = content

  const referenceMatch = content.match(/^@(\d+)@(.+)$/)
  if (referenceMatch?.[1] && referenceMatch[2]) {
    targetTag = activeTagMap.value.get(Number(referenceMatch[1])) ?? currentTag
    expressionWithFormat = referenceMatch[2]
  }

  const separatorIndex = expressionWithFormat.lastIndexOf(':')
  if (separatorIndex < 0) return ''

  const expression = expressionWithFormat.slice(0, separatorIndex)
  const format = expressionWithFormat.slice(separatorIndex + 1)
  const value = evaluateContractExpression(expression, targetTag)
  return value == null ? '' : formatContractValue(value, format)
}

function renderDescriptionText(text: string, tag: ContingencyContractTag): string {
  return text
    .replace(/\{([^}]+)\}/g, (_, content: string) => resolveContractPlaceholder(content, tag))
    .replace(/<[^>]+>/g, '')
}

function renderContractDescriptionParts(tag: ContingencyContractTag): ContractDescriptionPart[] {
  const raw = tag.rawDescription || tag.description || t('contingencyContract.noDescription')
  const parts: ContractDescriptionPart[] = []
  const colorPattern = /<color=[^>]+>(.*?)<\/color>/g
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = colorPattern.exec(raw)) != null) {
    if (match.index > cursor) {
      const text = renderDescriptionText(raw.slice(cursor, match.index), tag)
      if (text) parts.push({ text, highlighted: false })
    }

    const text = renderDescriptionText(match[1] ?? '', tag)
    if (text) parts.push({ text, highlighted: true })
    cursor = match.index + match[0].length
  }

  if (cursor < raw.length) {
    const text = renderDescriptionText(raw.slice(cursor), tag)
    if (text) parts.push({ text, highlighted: false })
  }

  return parts.length > 0
    ? parts
    : [{ text: tag.description || t('contingencyContract.noDescription'), highlighted: false }]
}

function getDisabledReason(tag: ContingencyContractTag): string {
  const season = activeSeason.value
  return season ? getContractTagDisabledReason(season, tag, selectedTagIds.value) : ''
}

function isSelected(tagId: number): boolean {
  return selectedTagIds.value.has(tagId)
}

function canSelect(tag: ContingencyContractTag): boolean {
  const reason = getDisabledReason(tag)
  return !reason || reason.startsWith('Conflict:')
}

function isConflictMuted(tag: ContingencyContractTag): boolean {
  if (isSelected(tag.id)) return false
  return getDisabledReason(tag).startsWith('Conflict:')
}

function toggleTag(tag: ContingencyContractTag) {
  const next = new Set(selectedTagIds.value)
  if (next.has(tag.id)) {
    next.delete(tag.id)
    selectedTagIds.value = next
    return
  }
  if (!canSelect(tag)) return

  if (tag.conflictId) {
    for (const selectedId of Array.from(next)) {
      const selectedTag = activeTagMap.value.get(selectedId)
      if (selectedTag?.conflictId === tag.conflictId) next.delete(selectedId)
    }
  }

  next.add(tag.id)
  selectedTagIds.value = next
}

function removeTag(tagId: number) {
  const next = new Set(selectedTagIds.value)
  next.delete(tagId)
  selectedTagIds.value = next
}

function clearSelection() {
  selectedTagIds.value = new Set()
}

function hideBrokenImage(event: Event) {
  const target = event.target
  if (target instanceof HTMLImageElement) target.style.display = 'none'
}
</script>

<template>
  <section class="cc-panel">
    <div v-if="activeSeason" class="cc-body">
      <div class="cc-groups">
        <div class="cc-grid" :style="{ width: `${contractGridWidth}px`, height: `${contractGridHeight}px` }">
          <div
            v-for="connector in conflictConnectors"
            :key="connector.key"
            class="cc-conflict-link"
            :class="`is-${connector.kind}`"
            :style="{
              left: `${connector.left}px`,
              top: `${connector.top}px`,
              width: connector.width ? `${connector.width}px` : undefined,
              height: connector.height ? `${connector.height}px` : undefined,
            }"
            aria-hidden="true"
          >
            <svg
              v-if="connector.kind === 'horizontal'"
              class="cc-conflict-link-svg"
              :width="connector.width"
              height="14"
              :viewBox="`0 0 ${connector.width ?? 0} 14`"
              preserveAspectRatio="none"
            >
              <line x1="0.5" y1="2" x2="0.5" y2="5" />
              <line x1="0.5" y1="9" x2="0.5" y2="12" />
              <line :x1="(connector.width ?? 0) - 0.5" y1="2" :x2="(connector.width ?? 0) - 0.5" y2="5" />
              <line :x1="(connector.width ?? 0) - 0.5" y1="9" :x2="(connector.width ?? 0) - 0.5" y2="12" />
              <line x1="0.5" y1="7" :x2="(connector.width ?? 0) - 0.5" y2="7" />
            </svg>
            <svg
              v-else
              class="cc-conflict-link-svg"
              width="14"
              :height="connector.height"
              :viewBox="`0 0 14 ${connector.height ?? 0}`"
              preserveAspectRatio="none"
            >
              <line x1="2" y1="0.5" x2="5" y2="0.5" />
              <line x1="9" y1="0.5" x2="12" y2="0.5" />
              <line x1="2" :y1="(connector.height ?? 0) - 0.5" x2="5" :y2="(connector.height ?? 0) - 0.5" />
              <line x1="9" :y1="(connector.height ?? 0) - 0.5" x2="12" :y2="(connector.height ?? 0) - 0.5" />
              <line x1="7" y1="0.5" x2="7" :y2="(connector.height ?? 0) - 0.5" />
            </svg>
          </div>

          <div
            v-for="cell in tagCells"
            :key="cell.tag.id"
            class="cc-tag-slot"
            :style="{ left: `${cell.left}px`, top: `${cell.top}px` }"
          >
            <el-tooltip
              placement="right"
              effect="dark"
              popper-class="cc-tag-tooltip-popper"
              :show-after="120"
            >
              <template #content>
                <div class="cc-tag-tooltip">
                  <div class="cc-tag-tooltip-title">{{ cell.tag.name }}</div>
                  <div class="cc-tag-tooltip-desc">
                    <span
                      v-for="(part, index) in renderContractDescriptionParts(cell.tag)"
                      :key="`${cell.tag.id}-tooltip-desc-${index}`"
                      :class="{ 'is-highlight': part.highlighted }"
                    >{{ part.text }}</span>
                  </div>
                </div>
              </template>
              <button
                type="button"
                class="cc-tag"
                :class="{
                  'is-selected': isSelected(cell.tag.id),
                  'is-locked': !canSelect(cell.tag),
                  'is-conflict-muted': isConflictMuted(cell.tag),
                }"
                @click="toggleTag(cell.tag)"
              >
                <span class="cc-tag-check">&#10003;</span>
                <img v-if="cell.tag.iconPath" :src="cell.tag.iconPath" alt="" aria-hidden="true" @error="hideBrokenImage" />
                <span v-else class="cc-tag-icon-fallback">{{ cell.tag.score }}</span>
                <span v-if="cell.tag.roman" class="cc-tag-roman">{{ cell.tag.roman }}</span>
                <span class="cc-tag-score">+{{ cell.tag.score }}</span>
              </button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <aside class="cc-detail">
        <div class="cc-detail-toolbar">
          <div class="cc-total-score" :title="t('contingencyContract.score')">
            <img src="/contingency_contract/deco_contract_027.webp" alt="" aria-hidden="true" />
            <strong>{{ selectedScore }}</strong>
          </div>
          <button
            type="button"
            class="ea-btn ea-btn--sm ea-btn--lift ea-btn--outline-muted cc-clear-btn"
            :disabled="selectedTags.length === 0"
            @click="clearSelection"
          >
            {{ t('common.reset') }}
          </button>
        </div>
        <div v-if="selectedTags.length" class="cc-selected-list">
          <div v-for="tag in selectedTags" :key="tag.id" class="cc-selected-row">
            <img v-if="tag.iconPath" :src="tag.iconPath" alt="" aria-hidden="true" @error="hideBrokenImage" />
            <div class="cc-selected-content">
              <div class="cc-selected-title">
                <span>{{ tag.name }}</span>
                <b>+{{ tag.score }}</b>
              </div>
              <div class="cc-selected-desc">
                <span
                  v-for="(part, index) in renderContractDescriptionParts(tag)"
                  :key="`${tag.id}-selected-desc-${index}`"
                  :class="{ 'is-highlight': part.highlighted }"
                >{{ part.text }}</span>
              </div>
            </div>
            <button
              type="button"
              class="ea-btn ea-btn--icon ea-btn--icon-28 ea-btn--glass-rect ea-btn--accent-red ea-btn--glass-rect-danger cc-selected-remove"
              :title="t('common.delete')"
              @click="removeTag(tag.id)"
            >
              ×
            </button>
          </div>
        </div>
        <template v-else>
          <div class="cc-detail-empty">{{ t('contingencyContract.pickHint') }}</div>
        </template>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cc-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #252526;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.86);
  overflow: hidden;
}

.cc-clear-btn {
  height: 22px;
  --ea-btn-py: 0;
  --ea-btn-px: 9px;
  font-size: 10px;
}

.cc-body {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
}

.cc-groups {
  min-height: 0;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 10px 12px 18px;
  scrollbar-width: thin;
  scrollbar-color: rgba(188, 40, 36, 0.7) rgba(255, 255, 255, 0.08);
  background: #232326;
}

.cc-groups::-webkit-scrollbar {
  height: 9px;
}

.cc-groups::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
}

.cc-groups::-webkit-scrollbar-thumb {
  background: rgba(188, 40, 36, 0.72);
  border: 2px solid rgba(24, 24, 28, 0.95);
}

.cc-grid {
  position: relative;
  min-width: max-content;
}

.cc-tag-slot {
  position: absolute;
  width: 58px;
  height: 52px;
  z-index: 2;
}

.cc-conflict-link {
  position: absolute;
  pointer-events: none;
  z-index: 1;
}

.cc-conflict-link.is-horizontal {
  height: 14px;
}

.cc-conflict-link.is-vertical {
  width: 14px;
}

.cc-conflict-link-svg {
  display: block;
  overflow: visible;
  stroke: rgba(255, 255, 255, 0.42);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.cc-tag {
  width: 58px;
  height: 52px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(196, 66, 60, 0.28);
  background: #2a2a2c;
  cursor: pointer;
  z-index: 1;
}

.cc-tag:hover {
  border-color: rgba(255, 111, 101, 0.86);
  background: #303033;
  box-shadow: 0 0 10px rgba(188, 40, 36, 0.14);
}

.cc-tag.is-selected {
  border-color: #ffdbd8;
  background: #a91512;
}

.cc-tag.is-locked {
  opacity: 0.38;
}

.cc-tag.is-conflict-muted {
  opacity: 0.42;
  filter: grayscale(0.55);
}

.cc-tag.is-conflict-muted:hover {
  opacity: 0.72;
  filter: grayscale(0.18);
}

.cc-tag img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  pointer-events: none;
}

.cc-tag-icon-fallback {
  color: rgba(255, 255, 255, 0.74);
  font-weight: 900;
}

.cc-tag-check {
  position: absolute;
  top: 2px;
  right: 3px;
  color: #fff;
  font-size: 11px;
  font-weight: 900;
  opacity: 0;
}

.cc-tag.is-selected .cc-tag-check { opacity: 1; }

.cc-tag-roman {
  position: absolute;
  left: 3px;
  bottom: 2px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 9px;
  font-weight: 800;
}

.cc-tag-score {
  position: absolute;
  right: 3px;
  bottom: 2px;
  color: #ffb3ab;
  font-family: 'Roboto Mono', monospace;
  font-size: 9px;
  font-weight: 900;
}

.cc-detail {
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 12px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  background: #252526;
  scrollbar-width: none;
}

.cc-detail::-webkit-scrollbar { display: none; }

.cc-detail-toolbar {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cc-total-score {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cc-total-score img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  flex-shrink: 0;
}

.cc-total-score strong {
  color: #ffdbd8;
  font-family: 'Roboto Mono', monospace;
  font-size: 22px;
  line-height: 1;
}

.cc-selected-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cc-selected-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 30px;
  align-items: stretch;
  gap: 8px;
  min-height: 54px;
  padding: 6px;
  background: rgba(0, 0, 0, 0.28);
  border-left: 3px solid #b71915;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.4);
}

.cc-selected-row > img {
  width: 34px;
  height: 34px;
  align-self: center;
  object-fit: contain;
}

.cc-selected-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.cc-selected-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.cc-selected-title span {
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cc-selected-title b {
  flex-shrink: 0;
  color: #ffdbd8;
  font-family: 'Roboto Mono', monospace;
  font-size: 11px;
}

.cc-selected-desc {
  color: rgba(255, 255, 255, 0.56);
  font-size: 11px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cc-selected-desc .is-highlight {
  color: #ffdb64;
  font-weight: 900;
}

.cc-selected-remove {
  align-self: center;
}


.cc-detail-empty {
  height: 100%;
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.34);
  font-size: 11px;
}

:global(.cc-tag-tooltip-popper) {
  max-width: 320px;
}

:global(.cc-tag-tooltip-popper.el-popper.is-dark) {
  background: rgba(37, 37, 38, 0.98);
  border: 1px solid rgba(196, 66, 60, 0.45);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.42);
}

:global(.cc-tag-tooltip-popper.el-popper.is-dark .el-popper__arrow::before) {
  background: rgba(37, 37, 38, 0.98);
  border-color: rgba(196, 66, 60, 0.45);
}

:global(.cc-tag-tooltip) {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: rgba(255, 255, 255, 0.78);
}

:global(.cc-tag-tooltip-title) {
  color: #fff;
  font-size: 12px;
  font-weight: 900;
}

:global(.cc-tag-tooltip-desc) {
  color: rgba(255, 255, 255, 0.68);
  font-size: 11px;
  line-height: 1.4;
}

:global(.cc-tag-tooltip-desc .is-highlight) {
  color: #ffdb64;
  font-weight: 900;
}
</style>
