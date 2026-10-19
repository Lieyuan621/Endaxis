<script setup lang="ts">
import { resolveImage } from '../../imageResources';
import { EaTooltip } from '@/design-system';
import { EaButton, EaDeleteIcon, EaNumberInput, EaPopover } from '@/design-system';
import type { MechanicSelectionDocument } from '../../../core/project/schema';
import {
  contractInitialVariables,
  contractDisplayBlackboard,
} from '../../../data/contingencyContract/definitions';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { GameRichTextRenderer } from '../../presentation';
import { contingencyContractTagText } from '../contingencyContractBuffPresentation';
import {
  contingencyContractTags as allContingencyContractTags,
  isContingencyContractTagLocked,
  toggleContingencyContractTag,
  type ContingencyContractTagPresentation,
} from '../../../data/contingencyContract/contingencyContractCatalog';

const props = defineProps<{
  selectedTagIds: readonly number[];
  locale: string;
  readOnly?: boolean;
  season: number;
  selections: readonly MechanicSelectionDocument[];
}>();
const emit = defineEmits<{
  setSelectedTagIds: [tagIds: readonly number[]];
  setInitialVariable: [tagId: number, key: string, value: number];
  clearInitialVariables: [tagId: number];
}>();
function hasOverrides(tagId: number): boolean {
  const selection = props.selections.find(
    entry => entry.mechanicId === `contingency-contract:tag:${tagId}`,
  );
  return contractInitialVariables(tagId).some(
    field =>
      typeof selection?.parameters[field.key] === 'number' &&
      selection.parameters[field.key] !== field.defaultValue,
  );
}
const { t } = useI18n({ useScope: 'global' });
// 父组件按期数重建面板；选择结果保留其他期数的指标。
const contingencyContractTags = allContingencyContractTags.filter(
  tag => tag.season === props.season,
);

const COLUMN_WIDTH = 76;
const COLUMN_GAP = 12;
const ROW_HEIGHT = 58;
const ROW_GAP = 22;
const TAG_SIZE = 58;
const MAX_SCORE_ROW = 3;

const selected = computed(() => new Set(props.selectedTagIds));
const columnIds = [...new Set(contingencyContractTags.map(tag => tag.columnId))];
function effectiveTag(tag: ContingencyContractTagPresentation): ContingencyContractTagPresentation {
  const selection = props.selections.find(
    entry => entry.mechanicId === `contingency-contract:tag:${tag.tagId}`,
  );
  const values = Object.fromEntries(
    contractInitialVariables(tag.tagId).map(field => {
      const value = selection?.parameters[field.key];
      return [field.key, typeof value === 'number' ? value : field.defaultValue];
    }),
  );
  return { ...tag, blackboard: contractDisplayBlackboard(tag.tagId, tag.blackboard, values) };
}
const selectedTags = computed(() =>
  contingencyContractTags.filter(tag => selected.value.has(tag.tagId)).map(effectiveTag),
);
function updateVariable(tagId: number, key: string, value: number | undefined): void {
  if (props.readOnly || value === undefined || !Number.isFinite(value)) return;
  emit('setInitialVariable', tagId, key, value);
}
const selectedScore = computed(() => selectedTags.value.reduce((sum, tag) => sum + tag.score, 0));
const tagMap = new Map(contingencyContractTags.map(tag => [tag.tagId, tag]));
const tagCells = contingencyContractTags.map(tag => {
  const columnIndex = columnIds.indexOf(tag.columnId);
  const rowIndex = Math.max(0, Math.min(MAX_SCORE_ROW - 1, Math.round(tag.score) - 1));
  return {
    tag,
    columnIndex,
    rowIndex,
    left: columnIndex * (COLUMN_WIDTH + COLUMN_GAP) + Math.round((COLUMN_WIDTH - TAG_SIZE) / 2),
    top: rowIndex * (ROW_HEIGHT + ROW_GAP),
  };
});
const gridWidth = columnIds.length * COLUMN_WIDTH + Math.max(0, columnIds.length - 1) * COLUMN_GAP;
const gridHeight = MAX_SCORE_ROW * ROW_HEIGHT + (MAX_SCORE_ROW - 1) * ROW_GAP;
const conflictConnectors = (() => {
  const byConflict = new Map<string, typeof tagCells>();
  for (const cell of tagCells) {
    if (cell.tag.conflictId !== '')
      byConflict.set(cell.tag.conflictId, [...(byConflict.get(cell.tag.conflictId) ?? []), cell]);
  }
  const result: Array<{
    key: string;
    kind: 'horizontal' | 'vertical';
    left: number;
    top: number;
    width?: number;
    height?: number;
  }> = [];
  for (const [conflictId, cells] of byConflict) {
    const byRow = new Map<number, typeof cells>();
    const byColumn = new Map<number, typeof cells>();
    for (const cell of cells) {
      byRow.set(cell.rowIndex, [...(byRow.get(cell.rowIndex) ?? []), cell]);
      byColumn.set(cell.columnIndex, [...(byColumn.get(cell.columnIndex) ?? []), cell]);
    }
    for (const [row, entries] of byRow) {
      entries.sort((a, b) => a.columnIndex - b.columnIndex);
      for (let index = 0; index < entries.length - 1; index += 1) {
        const current = entries[index]!;
        const next = entries[index + 1]!;
        const left = current.left + TAG_SIZE;
        if (next.left > left)
          result.push({
            key: `${conflictId}-h-${row}-${index}`,
            kind: 'horizontal',
            left,
            top: current.top + TAG_SIZE / 2 - 7,
            width: next.left - left,
          });
      }
    }
    for (const [column, entries] of byColumn) {
      entries.sort((a, b) => a.rowIndex - b.rowIndex);
      for (let index = 0; index < entries.length - 1; index += 1) {
        const current = entries[index]!;
        const next = entries[index + 1]!;
        const top = current.top + TAG_SIZE;
        if (next.top > top)
          result.push({
            key: `${conflictId}-v-${column}-${index}`,
            kind: 'vertical',
            left: current.left + TAG_SIZE / 2 - 7,
            top,
            height: next.top - top,
          });
      }
    }
  }
  return result;
})();

function toggle(tag: ContingencyContractTagPresentation): void {
  emit('setSelectedTagIds', toggleContingencyContractTag(props.selectedTagIds, tag.tagId));
}
function remove(tagId: number): void {
  emit(
    'setSelectedTagIds',
    props.selectedTagIds.filter(id => id !== tagId),
  );
}
function statusLabel(tag: ContingencyContractTagPresentation): string {
  return tag.support === 'supported' ? '' : t(`contingencyContract.support.${tag.support}.label`);
}
function noEffectDescription(tag: ContingencyContractTagPresentation): string {
  if (tag.support === 'supported') return '';
  return t(`contingencyContract.support.${tag.support}.description`);
}
function isConflictMuted(tag: ContingencyContractTagPresentation): boolean {
  return (
    !selected.value.has(tag.tagId) &&
    tag.conflictId !== '' &&
    contingencyContractTags.some(
      candidate => candidate.conflictId === tag.conflictId && selected.value.has(candidate.tagId),
    )
  );
}
function isLocked(tag: ContingencyContractTagPresentation): boolean {
  return isContingencyContractTagLocked(props.selectedTagIds, tag.tagId);
}
function blackboardValue(tag: ContingencyContractTagPresentation, key: string): number | null {
  return tag.blackboard[key] ?? null;
}
function evaluate(expression: string, tag: ContingencyContractTagPresentation): number | null {
  let total = 0;
  const tokens = expression.match(/[+-]?[^+-]+/g) ?? [];
  if (tokens.length === 0) return null;
  for (const raw of tokens) {
    const sign = raw.startsWith('-') ? -1 : 1;
    const token = raw.replace(/^[+-]/, '').trim();
    const numeric = Number(token);
    const value = Number.isFinite(numeric) ? numeric : blackboardValue(tag, token);
    if (value === null) return null;
    total += sign * value;
  }
  return total;
}
function description(tag: ContingencyContractTagPresentation): string {
  tag = effectiveTag(tag);
  return contingencyContractTagText(tag, props.locale).description.replace(
    /\{([^}]+)\}/g,
    (_match, content: string) => {
      let target = tag;
      let expression = content;
      const reference = content.match(/^@(\d+)@(.+)$/);
      if (reference?.[1] !== undefined && reference[2] !== undefined) {
        target = effectiveTag(tagMap.get(Number(reference[1])) ?? tag);
        expression = reference[2];
      }
      const separator = expression.lastIndexOf(':');
      if (separator < 0) return '';
      const value = evaluate(expression.slice(0, separator), target);
      if (value === null) return '';
      return expression.slice(separator + 1) === '0%'
        ? `${Math.round(value * 100)}%`
        : `${Math.round(value)}`;
    },
  );
}
</script>

<template>
  <section class="cc-panel">
    <p v-if="season === 2" class="cc-preview-note">{{ t('contingencyContract.preview.note') }}</p>
    <div class="cc-body">
      <div class="cc-groups">
        <div class="cc-grid" :style="{ width: `${gridWidth}px`, height: `${gridHeight}px` }">
          <div
            v-for="connector in conflictConnectors"
            :key="connector.key"
            class="cc-conflict-link"
            :class="`is-${connector.kind}`"
            :style="{
              left: `${connector.left}px`,
              top: `${connector.top}px`,
              width: connector.width === undefined ? undefined : `${connector.width}px`,
              height: connector.height === undefined ? undefined : `${connector.height}px`,
            }"
          >
            <svg
              v-if="connector.kind === 'horizontal'"
              class="cc-conflict-link-svg"
              :width="connector.width"
              height="14"
              :viewBox="`0 0 ${connector.width ?? 0} 14`"
              preserveAspectRatio="none"
            >
              <line x1=".5" y1="2" x2=".5" y2="5" />
              <line x1=".5" y1="9" x2=".5" y2="12" />
              <line
                :x1="(connector.width ?? 0) - 0.5"
                y1="2"
                :x2="(connector.width ?? 0) - 0.5"
                y2="5"
              />
              <line
                :x1="(connector.width ?? 0) - 0.5"
                y1="9"
                :x2="(connector.width ?? 0) - 0.5"
                y2="12"
              />
              <line x1=".5" y1="7" :x2="(connector.width ?? 0) - 0.5" y2="7" />
            </svg>
            <svg
              v-else
              class="cc-conflict-link-svg"
              width="14"
              :height="connector.height"
              :viewBox="`0 0 14 ${connector.height ?? 0}`"
              preserveAspectRatio="none"
            >
              <line x1="2" y1=".5" x2="5" y2=".5" />
              <line x1="9" y1=".5" x2="12" y2=".5" />
              <line
                x1="2"
                :y1="(connector.height ?? 0) - 0.5"
                x2="5"
                :y2="(connector.height ?? 0) - 0.5"
              />
              <line
                x1="9"
                :y1="(connector.height ?? 0) - 0.5"
                x2="12"
                :y2="(connector.height ?? 0) - 0.5"
              />
              <line x1="7" y1=".5" x2="7" :y2="(connector.height ?? 0) - 0.5" />
            </svg>
          </div>
          <div
            v-for="cell in tagCells"
            :key="cell.tag.tagId"
            class="cc-tag-slot"
            :style="{ left: `${cell.left}px`, top: `${cell.top}px` }"
          >
            <EaPopover
              trigger="contextmenu"
              placement="right"
              :show-arrow="false"
              :popper-style="{ padding: '6px 0' }"
              :width="340"
            >
              <template #reference>
                <div @contextmenu.prevent.stop>
                  <EaTooltip
                    placement="right"
                    effect="dark"
                    popper-class="cc-tag-tooltip-popper"
                    :show-after="120"
                  >
                    <template #content>
                      <div class="cc-tag-tooltip">
                        <div class="cc-tag-tooltip-title">
                          {{ contingencyContractTagText(cell.tag, locale).name }}
                          {{ cell.tag.romanNumSuffix }}
                        </div>
                        <div class="cc-tag-tooltip-desc">
                          <GameRichTextRenderer :text="description(cell.tag)" :locale="locale" />
                        </div>
                        <div v-if="cell.tag.support === 'blocked'" class="cc-tag-tooltip-state">
                          <strong>{{ statusLabel(cell.tag) }}</strong>
                          <span>{{ noEffectDescription(cell.tag) }}</span>
                          <small v-if="!locale.startsWith('zh') && cell.tag.supportReason">
                            {{ t('contingencyContract.reason') }}: {{ cell.tag.supportReason }}
                          </small>
                        </div>
                        <div
                          v-else-if="cell.tag.support === 'omitted'"
                          class="cc-tag-tooltip-no-effect"
                        >
                          {{ noEffectDescription(cell.tag) }}
                        </div>
                      </div>
                    </template>
                    <EaButton
                      type="button"
                      class="cc-tag"
                      :class="{
                        'is-unmodeled': cell.tag.support === 'blocked',
                        'is-locked': isLocked(cell.tag),
                        'is-conflict-muted': isConflictMuted(cell.tag),
                      }"
                      @click="toggle(cell.tag)"
                      @contextmenu.prevent
                      :disabled="readOnly"
                      :pressed="selected.has(cell.tag.tagId)"
                    >
                      <svg
                        v-if="hasOverrides(cell.tag.tagId)"
                        class="cc-tag-edited"
                        :class="{ 'is-selected': selected.has(cell.tag.tagId) }"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        :aria-label="t('contingencyContract.editInitialVariables')"
                      >
                        <path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z" />
                      </svg>
                      <span class="cc-tag-check">✓</span
                      ><img :src="resolveImage(cell.tag.icon)" alt="" aria-hidden="true" />
                      <span v-if="cell.tag.romanNumSuffix" class="cc-tag-roman">{{
                        cell.tag.romanNumSuffix
                      }}</span>
                      <span class="cc-tag-score">+{{ cell.tag.score }}</span
                      ><span v-if="cell.tag.support === 'blocked'" class="cc-tag-lock">!</span>
                    </EaButton>
                  </EaTooltip>
                </div>
              </template>
              <div class="cc-variables">
                <strong
                  >{{ contingencyContractTagText(cell.tag, locale).name }}
                  {{ cell.tag.romanNumSuffix }}</strong
                >
                <div class="cc-variables-heading">
                  {{ t('contingencyContract.initialVariables') }}
                </div>
                <label
                  v-for="field in contractInitialVariables(cell.tag.tagId)"
                  :key="field.key"
                  class="cc-variable"
                >
                  <span :title="field.key">{{ field.key }}</span>
                  <EaNumberInput
                    size="sm"
                    controls-position="right"
                    :aria-label="field.key"
                    :model-value="effectiveTag(cell.tag).blackboard[field.key]"
                    :disabled="readOnly"
                    :min="field.min"
                    :max="field.max"
                    :step="field.integer ? 1 : 0.01"
                    :precision="field.integer ? 0 : undefined"
                    @update:model-value="updateVariable(cell.tag.tagId, field.key, $event)"
                  />
                </label>
              </div>
              <div class="cc-context-menu">
                <EaButton
                  class="cc-menu-item"
                  size="sm"
                  :disabled="readOnly || !hasOverrides(cell.tag.tagId)"
                  @click="emit('clearInitialVariables', cell.tag.tagId)"
                  >{{ t('contingencyContract.clearInitialVariables') }}</EaButton
                >
              </div>
            </EaPopover>
          </div>
        </div>
      </div>
      <aside class="cc-detail">
        <div class="cc-detail-toolbar">
          <div class="cc-total-score" :title="t('contingencyContract.score')">
            <img src="/contingency_contract/deco_contract_027.webp" alt="" /><strong>{{
              selectedScore
            }}</strong>
          </div>
          <EaButton
            size="sm"
            type="button"
            class="cc-clear-btn"
            :disabled="readOnly || selectedTags.length === 0"
            @click="
              emit(
                'setSelectedTagIds',
                selectedTagIds.filter(id => !contingencyContractTags.some(tag => tag.tagId === id)),
              )
            "
          >
            {{ t('contingencyContract.reset') }}
          </EaButton>
        </div>
        <div v-if="selectedTags.length" class="cc-selected-list">
          <div v-for="tag in selectedTags" :key="tag.tagId" class="cc-selected-row">
            <img :src="resolveImage(tag.icon)" alt="" />
            <div class="cc-selected-content">
              <div class="cc-selected-title">
                <span
                  >{{ contingencyContractTagText(tag, locale).name }} {{ tag.romanNumSuffix }}</span
                ><b>+{{ tag.score }}</b>
              </div>
              <div class="cc-selected-desc">
                <GameRichTextRenderer :text="description(tag)" :locale="locale" />
              </div>
            </div>
            <EaButton
              variant="danger"
              size="sm"
              icon-only
              type="button"
              class="cc-selected-remove"
              :title="t('contingencyContract.remove')"
              :aria-label="t('contingencyContract.remove')"
              @click="remove(tag.tagId)"
              :disabled="readOnly"
            >
              <EaDeleteIcon />
            </EaButton>
          </div>
        </div>
        <div v-else class="cc-detail-empty">{{ t('contingencyContract.pickHint') }}</div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cc-variables {
  font-size: 12px;
  padding: 6px 12px 12px;
}
.cc-variables-heading {
  margin-top: 8px;
  color: var(--ea-fg-muted);
}
.cc-context-menu {
  border-top: 1px solid var(--ea-border-soft);
  padding-top: 4px;
  display: flex;
  flex-direction: column;
  font-size: 13px;
}
.cc-menu-item {
  width: 100%;
  height: 32px;
  justify-content: flex-start;
  padding: 0 12px;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: var(--ea-floating-fg);
  font: inherit;
}
.cc-menu-item:not(:disabled):hover {
  background: #007fd4;
  color: #fff;
}
.cc-menu-item:disabled {
  color: var(--ea-fg-muted);
  background: transparent;
}
.cc-tag-edited {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 11px;
  height: 11px;
  pointer-events: none;
}
.cc-tag-edited.is-selected {
  right: 17px;
}
.cc-variable {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
  max-width: 380px;
}
.cc-variable > span {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}
.cc-variable :deep(.ea-number-input) {
  width: 100px;
  flex-shrink: 0;
}
.cc-preview-note {
  margin: 0;
  padding: 10px 12px;
  color: var(--ea-fg-muted);
  font-size: 12px;
}
.cc-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--ea-workbench-panel, #252526);
  border-top: 1px solid var(--ea-border);
  color: var(--ea-fg);
  overflow: hidden;
}
.cc-body {
  flex: 1 1 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
}
.cc-groups {
  min-width: 0;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 10px 12px 18px;
  scrollbar-color: rgba(188, 40, 36, 0.7) var(--ea-border-soft);
  background: var(--ea-workbench-panel);
}
.cc-grid {
  position: relative;
  min-width: max-content;
}
.cc-tag-slot {
  position: absolute;
  z-index: 2;
  width: 58px;
  height: 58px;
}
.cc-conflict-link {
  position: absolute;
  z-index: 1;
  pointer-events: none;
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
  stroke: var(--ea-mark-strong);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}
.cc-tag {
  position: relative;
  z-index: 1;
  width: 58px;
  height: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid rgba(196, 66, 60, 0.28);
  background: var(--ea-keycap-bg);
  cursor: pointer;
  box-sizing: border-box;
}
.cc-tag:hover {
  border-color: rgba(255, 111, 101, 0.86);
  background: var(--ea-fill-strong);
  box-shadow: 0 0 10px rgba(188, 40, 36, 0.14);
}
.cc-tag[aria-pressed='true'] {
  border-color: #ffdbd8;
  background: #a91512;
  color: #fff;
  box-shadow: none;
}
.cc-tag.is-unmodeled:not([aria-pressed='true']) {
  border-style: dashed;
}
.cc-tag.is-locked {
  opacity: 0.38;
  cursor: default;
}
.cc-tag.is-locked:hover {
  border-color: rgba(196, 66, 60, 0.28);
  background: var(--ea-keycap-bg);
  box-shadow: none;
}
.cc-tag.is-conflict-muted {
  opacity: 0.42;
  filter: grayscale(0.55);
}
.cc-tag img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  pointer-events: none;
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
.cc-tag[aria-pressed='true'] .cc-tag-check {
  opacity: 1;
}
.cc-tag-roman {
  position: absolute;
  left: 3px;
  bottom: 2px;
  color: var(--ea-fg-secondary);
  font-size: 9px;
  font-weight: 800;
}
.cc-tag-score {
  position: absolute;
  right: 3px;
  bottom: 2px;
  color: #ffb3ab;
  font:
    900 9px/1 'Roboto Mono',
    monospace;
}
.cc-tag-lock {
  position: absolute;
  top: 2px;
  left: 4px;
  color: #ffd85b;
  font-weight: 900;
}
.cc-detail {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  border-left: 1px solid var(--ea-border);
  background: var(--ea-workbench-panel);
  scrollbar-width: none;
}
.cc-detail-toolbar {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--ea-border);
}
.cc-total-score {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.cc-total-score img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}
.cc-total-score strong {
  color: #ffdbd8;
  font:
    700 22px/1 'Roboto Mono',
    monospace;
}
.cc-clear-btn {
  height: 22px;
  font-size: 10px;
}
.cc-selected-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cc-selected-row {
  min-height: 54px;
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 30px;
  align-items: stretch;
  gap: 8px;
  padding: 6px;
  background: var(--ea-fill-muted);
  border-left: 3px solid #b71915;
  border-top: 1px solid var(--ea-border-soft);
  border-bottom: 1px solid var(--ea-border);
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
  min-width: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.cc-selected-title span {
  overflow: hidden;
  color: var(--ea-fg);
  font-size: 12px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cc-selected-title b {
  color: #ffdbd8;
  font:
    700 11px/1 'Roboto Mono',
    monospace;
}
.cc-selected-desc {
  overflow: hidden;
  color: var(--ea-fg-muted);
  font-size: 11px;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.cc-selected-remove {
  grid-column: 3;
  grid-row: 1;
  align-self: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--ea-border-strong);
  background: var(--ea-fill-muted);
  color: #ff736d;
}
.cc-detail-empty {
  height: 100%;
  min-height: 62px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ea-fg-faint);
  font-size: 11px;
}
:global(.cc-tag-tooltip-popper) {
  max-width: 320px;
}
:global(.cc-tag-tooltip-popper.el-popper.is-dark) {
  --ea-floating-border: rgba(196, 66, 60, 0.45);
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
:global(.cc-tag-tooltip-state) {
  margin-top: 7px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  color: #ffd85b;
  font-size: 11px;
}
:global(.cc-tag-tooltip-state strong) {
  font-weight: 900;
}
:global(.cc-tag-tooltip-state small) {
  color: inherit;
  font-size: 10px;
  opacity: 0.78;
}
:global(.cc-tag-tooltip-no-effect) {
  margin-top: 7px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  line-height: 1.4;
}
:global(html[data-theme='light'] .cc-tag-tooltip-popper.el-popper.is-dark) {
  --ea-floating-border: color-mix(in srgb, #c62828 35%, var(--ea-dialog-border, #d8dbe0));
}
:global(html[data-theme='light'] .cc-tag-tooltip-popper .cc-tag-tooltip-no-effect) {
  color: color-mix(in srgb, var(--ea-fg, #1a1b1e) 55%, transparent);
}
:global(html[data-theme='light'] .cc-tag-tooltip),
:global(html[data-theme='light'] .cc-tag-tooltip-desc) {
  color: var(--ea-dialog-body, #3a3d44);
}
:global(html[data-theme='light'] .cc-tag-tooltip-title) {
  color: var(--ea-dialog-title, #1a1b1e);
}
:global(html[data-theme='light'] .cc-panel .cc-tag) {
  background: var(--ea-chip-fill);
  border-color: rgba(180, 50, 45, 0.32);
}
:global(html[data-theme='light'] .cc-panel .cc-tag img) {
  filter: brightness(0) opacity(0.72);
}
:global(html[data-theme='light'] .cc-panel .cc-tag[aria-pressed='true']) {
  background: #c62828;
  border-color: #8a1c1c;
}
:global(html[data-theme='light'] .cc-panel .cc-tag[aria-pressed='true'] img) {
  filter: brightness(0) invert(1) opacity(0.95);
}
@media (hover: hover) and (pointer: fine) {
  .cc-tag[aria-pressed='true']:hover:not(:disabled) {
    border-color: #ffdbd8;
    background: #a91512;
    color: #fff;
    box-shadow: none;
  }
  :global(html[data-theme='light'] .cc-panel .cc-tag[aria-pressed='true']:hover:not(:disabled)) {
    background: #c62828;
    border-color: #8a1c1c;
  }
}
</style>
