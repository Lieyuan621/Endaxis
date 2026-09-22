<script setup lang="ts">
import { EaPopover } from '@/design-system';
/** 时间轴顶部方案栏。DOM 分区与视觉契约以旧版 TimelineEditor 为准。 */
import {
  EaButton,
  EaDeleteIcon,
  EaDiceIcon,
  EaInput,
  EaNumberInput,
  EaPlusIcon,
} from '@/design-system';
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TimelineDurationBarColorControls from '../results/TimelineDurationBarColorControls.vue';
import { resolveScenarioTabsScrollMask } from '../scenarioTabsScrollMask';
import type { TimelineViewLayerId, TimelineViewLayers } from '../results/timelineViewLayers';
import type { OperationKeycapMode } from '../timelineOperationMarkers';
import { useInteractionSession } from '../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../interaction/usePopoverInteractionBoundary';

const props = defineProps<{
  scenarioName: string;
  scenarios: readonly { readonly id: string; readonly name: string }[];
  activeScenarioId: string;
  maxScenarios: number;
  cursorGuideEnabled: boolean;
  boxSelectEnabled: boolean;
  connectionToolEnabled: boolean;
  buffLayoutMode: 'compact' | 'loose';
  keycapMode: OperationKeycapMode;
  viewLayers: TimelineViewLayers;
  viewLayerIds: readonly TimelineViewLayerId[];
  operatorEffects: readonly {
    readonly trackIndex: number;
    readonly name: string;
    readonly color: string;
    readonly visible: boolean;
  }[];
  locale: string;
  appearance: 'light' | 'dark';
  randomMode: 'expected' | 'sampled';
  configurationReadOnly?: boolean;
  globalRandomSeed: number;
  labels: {
    rename: string;
    duplicate: string;
    delete: string;
    add: string;
    analysis: string;
    open: string;
    export: string;
    more: string;
    reset: string;
    view: string;
    viewLayers: Record<TimelineViewLayerId, string>;
    viewOperators: string;
    viewOperatorsEmpty: string;
    shortcuts: string;
    preferences: string;
    keycapMode: string;
    keyboardKeycaps: string;
    gamepadKeycaps: string;
    appearance: string;
    appearanceLight: string;
    appearanceDark: string;
    locales: { zhCN: string; en: string };
  };
}>();

const emit = defineEmits<{
  toggleCursorGuide: [];
  toggleBoxSelect: [];
  toggleConnectionTool: [];
  setBuffLayout: [mode: 'compact' | 'loose'];
  setKeycapMode: [mode: OperationKeycapMode];
  reset: [];
  open: [];
  receive: [];
  export: [];
  rename: [name: string];
  duplicate: [];
  delete: [];
  add: [];
  select: [scenarioId: string];
  analysis: [];
  shortcuts: [];
  toggleViewLayer: [layerId: TimelineViewLayerId];
  toggleOperatorEffects: [trackIndex: number];
  setLocale: [locale: 'zh-CN' | 'en'];
  setAppearance: [appearance: 'light' | 'dark'];
  setRandomMode: [mode: 'expected' | 'sampled'];
  setGlobalRandomSeed: [seed: number];
  rollGlobalRandomSeed: [];
  clearSelection: [];
}>();

const renaming = ref(false);
const { t } = useI18n({ useScope: 'global' });
const renameDraft = ref('');
const renameInput = ref<{ focus: () => void; select: () => void } | null>(null);
const moreMenuOpen = ref(false);
const displayMenuOpen = ref(false);
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => moreMenuOpen.value || displayMenuOpen.value,
  () => {
    moreMenuOpen.value = false;
    displayMenuOpen.value = false;
  },
);
watch(displayMenuOpen, open => {
  if (open) moreMenuOpen.value = false;
});
watch(moreMenuOpen, open => {
  if (open) displayMenuOpen.value = false;
});
const scenarioTabs = ref<HTMLElement | null>(null);
const scenarioTabsMaskStyle = ref({ maskImage: 'none', WebkitMaskImage: 'none' });
let scenarioTabsResizeObserver: ResizeObserver | null = null;

function updateScenarioTabsScrollMask(): void {
  const element = scenarioTabs.value;
  if (element === null) return;
  scenarioTabsMaskStyle.value = resolveScenarioTabsScrollMask(element);
}

function beginRename(): void {
  renameDraft.value = props.scenarioName;
  renaming.value = true;
  void nextTick(() => {
    renameInput.value?.focus();
    renameInput.value?.select();
  });
}

function finishRename(): void {
  if (!renaming.value) return;
  renaming.value = false;
  const name = renameDraft.value.trim();
  if (name.length > 0 && name !== props.scenarioName) emit('rename', name);
}

function cancelRename(): void {
  renaming.value = false;
  renameDraft.value = props.scenarioName;
}

function runProjectAction(action: 'open' | 'receive' | 'reset'): void {
  moreMenuOpen.value = false;
  if (action === 'open') emit('open');
  else if (action === 'receive') emit('receive');
  else emit('reset');
}

const localeIds = ['zh-CN', 'en'] as const;
function localeLabel(id: (typeof localeIds)[number]): string {
  if (id === 'zh-CN') return props.labels.locales.zhCN;
  return props.labels.locales[id];
}

function commitGlobalRandomSeed(value: number | undefined): void {
  if (value !== undefined && Number.isInteger(value) && value >= 0 && value <= 0xffffffff) {
    emit('setGlobalRandomSeed', value);
  }
}

watch(
  () => props.scenarios.length,
  async () => {
    await nextTick();
    updateScenarioTabsScrollMask();
  },
);

onMounted(() => {
  void nextTick(updateScenarioTabsScrollMask);
  if (typeof ResizeObserver === 'undefined' || scenarioTabs.value === null) return;
  scenarioTabsResizeObserver = new ResizeObserver(updateScenarioTabsScrollMask);
  scenarioTabsResizeObserver.observe(scenarioTabs.value);
});

onBeforeUnmount(() => {
  scenarioTabsResizeObserver?.disconnect();
  scenarioTabsResizeObserver = null;
});
</script>

<template>
  <div class="timeline-header-content" @click.self="$emit('clearSelection')">
    <div class="tech-scenario-bar" @click.self="$emit('clearSelection')">
      <div class="ts-header-group" @click.self="$emit('clearSelection')">
        <EaButton
          variant="ghost"
          size="sm"
          icon-only
          type="button"
          class="toolbar-no-shrink"
          :title="labels.rename"
          :aria-label="labels.rename"
          @click="beginRename"
        >
          <svg class="ts-rename-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
            />
          </svg>
        </EaButton>
        <EaButton
          variant="ghost"
          size="sm"
          icon-only
          type="button"
          class="toolbar-no-shrink"
          :title="labels.duplicate"
          :aria-label="labels.duplicate"
          @click="$emit('duplicate')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </EaButton>

        <EaButton
          v-if="scenarios.length > 1"
          variant="danger"
          size="sm"
          icon-only
          type="button"
          class="toolbar-no-shrink"
          :title="labels.delete"
          :aria-label="labels.delete"
          @click="$emit('delete')"
        >
          <EaDeleteIcon />
        </EaButton>

        <div class="ts-title-wrapper" :title="scenarioName">
          <span class="ts-deco-bracket">[</span>
          <EaInput
            v-if="renaming"
            ref="renameInput"
            v-model="renameDraft"
            class="ts-title-input"
            variant="inline"
            size="sm"
            @blur="finishRename"
            @keydown.enter.prevent="finishRename"
            @keydown.esc.prevent="cancelRename"
          />
          <strong v-else class="ts-title-text" @dblclick="beginRename">{{ scenarioName }}</strong>
          <span class="ts-deco-bracket">]</span>
        </div>
      </div>
      <div
        ref="scenarioTabs"
        class="ts-tabs-group"
        :style="scenarioTabsMaskStyle"
        @scroll="updateScenarioTabsScrollMask"
      >
        <EaButton
          v-for="(scenario, index) in scenarios"
          :key="scenario.id"
          type="button"
          class="ts-tab-item"
          variant="ghost"
          size="sm"
          :pressed="scenario.id === activeScenarioId"
          :title="scenario.name"
          :aria-label="scenario.name"
          :aria-current="scenario.id === activeScenarioId ? 'page' : undefined"
          @click="$emit('select', scenario.id)"
        >
          {{ String(index + 1).padStart(2, '0') }}
        </EaButton>
        <EaButton
          v-if="scenarios.length < maxScenarios"
          size="sm"
          icon-only
          type="button"
          class="toolbar-no-shrink ts-add-btn"
          :title="labels.add"
          :aria-label="labels.add"
          @click="$emit('add')"
        >
          <EaPlusIcon />
        </EaButton>
      </div>
    </div>

    <div class="header-controls" @click.self="$emit('clearSelection')">
      <EaButton size="sm" type="button" class="command-button--analysis" @click="$emit('analysis')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-9-9v9z" />
          <path d="M12 3a9 9 0 0 1 9 9h-9z" />
        </svg>
        {{ labels.analysis }}
      </EaButton>
      <EaButton size="sm" type="button" class="command-button--export" @click="$emit('export')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 3h7v7" />
          <path d="M10 14L21 3" />
          <path d="M21 14v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h7" />
        </svg>
        {{ labels.export }}
      </EaButton>
      <EaPopover
        v-model:visible="displayMenuOpen"
        placement="bottom-end"
        trigger="click"
        :width="280"
        :show-arrow="true"
        popper-class="header-more-popper"
      >
        <template #reference>
          <EaButton
            size="sm"
            type="button"
            :title="t('display.title')"
            :aria-label="t('display.title')"
            :aria-expanded="displayMenuOpen"
            :data-keyboard-shortcut-scope="displayMenuOpen ? 'overlay' : undefined"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            {{ t('display.title') }}
          </EaButton>
        </template>
        <div class="timeline-display-menu" data-keyboard-shortcut-scope="overlay">
          <EaButton
            type="button"
            class="timeline-display-guide"
            @click="$emit('toggleCursorGuide')"
            :pressed="cursorGuideEnabled"
          >
            <svg
              class="timeline-display-guide__icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v18M3 12h18" />
              <path d="M7 6H5v2M17 6h2v2M7 18H5v-2M17 18h2v-2" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
            <span class="timeline-display-guide__content"
              ><strong>{{ t('display.cursorGuide') }}</strong
              ><small>Ctrl + G</small></span
            >
            <svg
              class="timeline-display-guide__check"
              viewBox="0 0 16 16"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              aria-hidden="true"
            >
              <rect x="1" y="1" width="14" height="14" rx="2" />
              <polyline v-if="cursorGuideEnabled" points="3,8 6.5,11.5 13,4.5" />
            </svg>
          </EaButton>
          <div class="timeline-display-scroll">
            <section class="timeline-display-section">
              <h4 class="timeline-display-section__title">
                {{ t('timeline.header.sectionViewBehavior') }}
              </h4>
              <div class="header-more-mode-row">
                <span>{{ t('display.buffLayout') }}</span>
                <div class="header-more-segment" role="group" :aria-label="t('display.buffLayout')">
                  <EaButton
                    v-for="mode in ['compact', 'loose'] as const"
                    :key="mode"
                    type="button"
                    @click="$emit('setBuffLayout', mode)"
                    :pressed="buffLayoutMode === mode"
                  >
                    {{
                      t(
                        mode === 'compact'
                          ? 'timelineGrid.toolbar.buffLayoutCompact'
                          : 'timelineGrid.toolbar.buffLayoutLoose',
                      )
                    }}
                  </EaButton>
                </div>
              </div>
            </section>
            <section class="timeline-display-section">
              <h4 class="timeline-display-section__title">{{ labels.view }}</h4>
              <div class="header-more-checklist header-more-checklist--grid">
                <EaButton
                  v-for="layerId in viewLayerIds"
                  :key="layerId"
                  type="button"
                  class="header-more-check-row header-more-check-row--compact"
                  :aria-pressed="viewLayers[layerId]"
                  @click="$emit('toggleViewLayer', layerId)"
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    fill="none"
                    stroke="color-mix(in srgb, var(--ea-gold) 85%, transparent)"
                    stroke-width="1.5"
                    aria-hidden="true"
                  >
                    <rect x="1" y="1" width="14" height="14" rx="2" />
                    <polyline v-if="viewLayers[layerId]" points="3,8 6.5,11.5 13,4.5" />
                  </svg>
                  <span>{{ labels.viewLayers[layerId] }}</span>
                </EaButton>
              </div>
            </section>
            <section class="timeline-display-section timeline-display-section--follow">
              <h4 class="timeline-display-section__title">{{ labels.viewOperators }}</h4>
              <div
                v-if="operatorEffects.length > 0"
                class="header-more-checklist header-more-checklist--grid"
              >
                <EaButton
                  v-for="operator in operatorEffects"
                  :key="operator.trackIndex"
                  type="button"
                  class="header-more-check-row header-more-check-row--compact"
                  :aria-pressed="operator.visible"
                  @click="$emit('toggleOperatorEffects', operator.trackIndex)"
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="12"
                    height="12"
                    fill="none"
                    :stroke="operator.color"
                    stroke-width="1.5"
                    aria-hidden="true"
                  >
                    <rect x="1" y="1" width="14" height="14" rx="2" />
                    <polyline v-if="operator.visible" points="3,8 6.5,11.5 13,4.5" />
                  </svg>
                  <span>{{ operator.name }}</span>
                </EaButton>
              </div>
              <p v-else class="timeline-display-empty">{{ labels.viewOperatorsEmpty }}</p>
            </section>
            <TimelineDurationBarColorControls />
          </div>
        </div>
      </EaPopover>
      <EaPopover
        v-model:visible="moreMenuOpen"
        placement="bottom-end"
        trigger="click"
        :width="280"
        :show-arrow="true"
        popper-class="header-more-popper"
      >
        <template #reference>
          <EaButton
            size="sm"
            type="button"
            :title="t('timeline.header.moreTooltip')"
            :aria-label="labels.more"
            :aria-expanded="moreMenuOpen"
            :data-keyboard-shortcut-scope="moreMenuOpen ? 'overlay' : undefined"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="5" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="12" cy="19" r="1.6" />
            </svg>
            {{ labels.more }}
          </EaButton>
        </template>
        <div class="header-more-panel" data-keyboard-shortcut-scope="overlay">
          <section class="header-more-section">
            <h4 class="header-more-section__title">
              {{ t('timeline.header.sectionEditTools') }}
            </h4>
            <div class="header-more-checklist header-more-checklist--grid">
              <EaButton
                type="button"
                class="header-more-check-row header-more-tool-row"
                @click="$emit('toggleBoxSelect')"
                :pressed="boxSelectEnabled"
              >
                <svg
                  class="header-more-tool-row__icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />
                  <rect x="7.5" y="7.5" width="9" height="9" stroke-dasharray="2 2" />
                </svg>
                <span class="header-more-tool-row__label">{{
                  t('timeline.header.editTools.boxSelect')
                }}</span>
                <svg
                  class="header-more-tool-row__check"
                  viewBox="0 0 16 16"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                >
                  <rect x="1" y="1" width="14" height="14" rx="2" />
                  <polyline v-if="boxSelectEnabled" points="3,8 6.5,11.5 13,4.5" />
                </svg>
              </EaButton>
              <EaButton
                type="button"
                class="header-more-check-row header-more-tool-row"
                @click="$emit('toggleConnectionTool')"
                :pressed="connectionToolEnabled"
              >
                <svg
                  class="header-more-tool-row__icon"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="5" cy="7" r="2.5" />
                  <circle cx="19" cy="17" r="2.5" />
                  <path d="M7.5 7c5.5 0 3.5 10 9 10" />
                </svg>
                <span class="header-more-tool-row__label">{{
                  t('timeline.header.editTools.connection')
                }}</span>
                <svg
                  class="header-more-tool-row__check"
                  viewBox="0 0 16 16"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  aria-hidden="true"
                >
                  <rect x="1" y="1" width="14" height="14" rx="2" />
                  <polyline v-if="connectionToolEnabled" points="3,8 6.5,11.5 13,4.5" />
                </svg>
              </EaButton>
            </div>
          </section>
          <section class="header-more-section">
            <h4 class="header-more-section__title">{{ t('timeline.header.sectionProject') }}</h4>
            <div class="header-more-actions">
              <EaButton
                size="sm"
                type="button"
                class="header-more-action"
                :title="t('timeline.header.loadTooltip')"
                @click="runProjectAction('open')"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{{ labels.open }}</span>
              </EaButton>
              <EaButton
                size="sm"
                type="button"
                class="header-more-action"
                :title="t('timeline.header.receiveTooltip')"
                @click="runProjectAction('receive')"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <span>{{ t('common.receive') }}</span>
              </EaButton>
              <EaButton
                variant="danger"
                size="sm"
                type="button"
                class="header-more-action"
                :title="t('timeline.header.resetTooltip')"
                @click="runProjectAction('reset')"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <polyline points="3 6 5 6 21 6" />
                  <path
                    d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  />
                </svg>
                <span>{{ labels.reset }}</span>
              </EaButton>
            </div>
          </section>
          <section class="header-more-section">
            <h4 class="header-more-section__title">{{ labels.preferences }}</h4>
            <div class="header-more-mode-row">
              <span>{{ labels.keycapMode }}</span>
              <div class="header-more-segment" role="group" :aria-label="labels.keycapMode">
                <EaButton
                  v-for="mode in ['keyboard', 'gamepad'] as const"
                  :key="mode"
                  type="button"
                  @click="$emit('setKeycapMode', mode)"
                  :pressed="keycapMode === mode"
                >
                  {{ mode === 'keyboard' ? labels.keyboardKeycaps : labels.gamepadKeycaps }}
                </EaButton>
              </div>
            </div>
            <div class="header-more-mode-row">
              <span>{{ t('timeline.random.mode') }}</span>
              <div class="header-more-segment" role="group" :aria-label="t('timeline.random.mode')">
                <EaButton
                  v-for="mode in ['expected', 'sampled'] as const"
                  :key="mode"
                  type="button"
                  @click="$emit('setRandomMode', mode)"
                  :disabled="configurationReadOnly"
                  :pressed="randomMode === mode"
                >
                  {{ t(`timeline.random.${mode}`) }}
                </EaButton>
              </div>
            </div>
            <div v-if="randomMode === 'sampled'" class="header-more-pref-row">
              <span>{{ t('timeline.random.globalSeed') }}</span>
              <EaNumberInput
                class="header-more-seed-input"
                :min="0"
                :max="0xffffffff"
                :step="1"
                size="sm"
                controls-position="right"
                :model-value="globalRandomSeed"
                @change="commitGlobalRandomSeed"
                :disabled="configurationReadOnly"
              />
              <EaButton
                size="sm"
                icon-only
                type="button"
                :title="t('timeline.random.roll')"
                :aria-label="t('timeline.random.roll')"
                @click="$emit('rollGlobalRandomSeed')"
                :disabled="configurationReadOnly"
              >
                <EaDiceIcon />
              </EaButton>
            </div>
            <div class="header-more-pref-row">
              <div class="header-more-locale" :title="t('timeline.header.languageTooltip')">
                <EaButton
                  size="sm"
                  v-for="localeId in localeIds"
                  :key="localeId"
                  type="button"
                  class="header-more-locale__btn"
                  :title="t(`locale.${localeId === 'zh-CN' ? 'zhCN' : localeId}`)"
                  @click="$emit('setLocale', localeId)"
                  :pressed="locale === localeId"
                >
                  {{ localeLabel(localeId) }}
                </EaButton>
              </div>
              <EaButton
                size="sm"
                icon-only
                class="header-more-action header-more-action--icon"
                type="button"
                :title="t('timeline.header.shortcutsTooltip')"
                :aria-label="labels.shortcuts"
                @click="$emit('shortcuts')"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  aria-hidden="true"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8h2m2 0h2m2 0h2m2 0h1M6 12h2m2 0h2m2 0h2M7 16h10" />
                </svg>
              </EaButton>
            </div>
            <div class="header-more-pref-row header-more-pref-row--appearance">
              <span class="header-more-appearance__label">{{ labels.appearance }}</span>
              <div class="header-more-appearance">
                <EaButton
                  size="sm"
                  icon-only
                  type="button"
                  class="header-more-appearance__btn"
                  :title="labels.appearanceLight"
                  :aria-label="labels.appearanceLight"
                  @click="$emit('setAppearance', 'light')"
                  :pressed="appearance === 'light'"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path
                      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                    />
                  </svg>
                </EaButton>
                <EaButton
                  size="sm"
                  icon-only
                  type="button"
                  class="header-more-appearance__btn"
                  :title="labels.appearanceDark"
                  :aria-label="labels.appearanceDark"
                  @click="$emit('setAppearance', 'dark')"
                  :pressed="appearance === 'dark'"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </EaButton>
              </div>
            </div>
          </section>
        </div>
      </EaPopover>
    </div>
  </div>
</template>

<style scoped>
.toolbar-no-shrink {
  flex-shrink: 0;
}

/* The selectors below intentionally mirror the upstream TimelineEditor contract. */
.timeline-header-content {
  width: 100%;
  min-width: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 0;
  box-sizing: border-box;
  cursor: default;
  user-select: none;
}

.tech-scenario-bar {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 10px;
  flex: 1;
  min-width: 0;
  margin-right: 20px;
  background: linear-gradient(90deg, rgb(255 255 255 / 3%) 0%, transparent 100%);
}

.ts-header-group {
  width: 260px;
  flex-shrink: 0;
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
  padding-right: 10px;
  overflow: hidden;
}

.ts-tabs-group {
  min-width: 0;
  flex-grow: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.ts-tabs-group::-webkit-scrollbar {
  display: none;
}

.ts-title-wrapper {
  min-width: 0;
  display: flex;
  align-items: baseline;
  margin-left: 4px;
  overflow: hidden;
  color: var(--ea-fg);
  font:
    700 16px/normal 'Segoe UI',
    sans-serif;
  letter-spacing: 0.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ts-deco-bracket {
  flex-shrink: 0;
  margin: 0 2px;
  color: var(--ea-fg-faint);
  font-weight: 300;
  user-select: none;
}

.ts-title-text {
  min-width: 0;
  overflow: hidden;
  border-bottom: 1px dashed transparent;
  cursor: pointer;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ts-title-text:hover {
  border-bottom-color: var(--ea-fg-muted);
}

.ts-title-input {
  --ea-control-border: var(--ea-gold);

  width: 120px;
  color: var(--ea-gold);
  font-size: 16px;
  font-weight: 700;
}

.ts-tab-item {
  --ea-control-pressed-border-hover: transparent;
  --ea-control-pressed-bg-hover: var(--ea-tab-active-bg);
  --ea-control-pressed-fg-hover: var(--ea-tab-active-fg);

  min-width: 40px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: var(--ea-tab-idle-bg);
  color: var(--ea-tab-idle-fg);
  cursor: pointer;
  font:
    700 12px/1 'Roboto Mono',
    monospace;
  transition:
    background-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
  user-select: none;
}

.ts-tab-item[aria-pressed='true'] {
  border-color: transparent;
  background: var(--ea-tab-active-bg);
  color: var(--ea-tab-active-fg);
  box-shadow: 0 1px 3px rgb(0 0 0 / 30%);
}

.ts-add-btn {
  margin-left: 4px;
}

.header-controls {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-controls .ea-button[aria-expanded='true'] {
  background: var(--ea-active-fill);
  color: var(--ea-fg);
}

.ts-header-group .ea-button svg,
.header-controls .ea-button svg,
.header-more-actions .ea-button svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ts-header-group .ea-button .ts-rename-icon {
  fill: currentColor;
  stroke: none;
}

.header-more-panel,
.timeline-display-menu {
  display: flex;
  flex-direction: column;
  max-height: min(760px, calc(100vh - 96px));
}

.header-more-panel {
  gap: 0;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
}

.header-more-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-more-section + .header-more-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--ea-border);
}

.header-more-section__title {
  margin: 0;
  color: color-mix(in srgb, var(--ea-gold) 90%, transparent);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.header-more-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.header-more-action.ea-button {
  width: auto;
  flex: 0 0 auto;
  justify-content: flex-start;
  --ea-control-bg: var(--ea-fill-soft);
  --ea-control-border: var(--ea-border);
  --ea-control-fg: var(--ea-fg-secondary);
  --ea-control-bg-hover: var(--ea-hover-fill);
  --ea-control-border-hover: var(--ea-border-strong);
  --ea-control-fg-hover: var(--ea-fg);
  backdrop-filter: none;
}

.header-more-pref-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 6px;
}

.header-more-seed-input {
  width: 126px;
}

.header-more-locale {
  display: inline-grid;
  grid-template-columns: repeat(3, 1.75rem);
  gap: 4px;
}

.header-more-pref-row .header-more-action--icon {
  margin-left: auto;
}

.header-more-pref-row--appearance {
  justify-content: space-between;
  margin-top: 2px;
}

.header-more-appearance__label {
  color: var(--ea-fg-muted);
  font-size: 11px;
  font-weight: 600;
}

.header-more-appearance {
  display: inline-grid;
  grid-template-columns: repeat(2, 28px);
  gap: 4px;
}

.header-more-locale__btn.ea-button,
.header-more-appearance__btn.ea-button {
  width: 100%;
  min-width: 0;
  padding: 5px 0;
  font-size: 11px;
  --ea-control-bg: var(--ea-fill-soft);
  --ea-control-border: var(--ea-border);
  --ea-control-fg: var(--ea-fg-secondary);
}

.header-more-appearance__btn.ea-button,
.header-more-action--icon.ea-button {
  width: 28px;
  min-width: 28px;
  height: 28px;
  padding: 0;
  justify-content: center;
}

.header-more-locale__btn.ea-button[aria-pressed='true'],
.header-more-appearance__btn.ea-button[aria-pressed='true'] {
  border-color: color-mix(in srgb, var(--ea-gold) 50%, transparent);
  background: color-mix(in srgb, var(--ea-gold) 10%, transparent);
  color: #ffe38a;
}

.timeline-display-menu {
  gap: 0;
}

.timeline-display-guide {
  --ea-control-pressed-border-hover: var(--ea-border-strong);
  --ea-control-pressed-bg-hover: var(--ea-hover-fill);
  --ea-control-pressed-fg-hover: var(--ea-fg);
  width: calc(100% - 4px);
  min-height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 4px 10px 0;
  padding: 8px 10px;
  border: 1px solid var(--ea-border);
  border-radius: 4px;
  background: var(--ea-fill-soft);
  color: var(--ea-fg-secondary);
  text-align: left;
  cursor: pointer;
}

.timeline-display-guide.ea-button[aria-pressed='true'] {
  border-color: var(--ea-border);
  background: var(--ea-fill-soft);
  color: var(--ea-fg-secondary);
  box-shadow: none;
}

@media (hover: hover) and (pointer: fine) {
  .timeline-display-guide:hover,
  .timeline-display-guide.ea-button[aria-pressed='true']:hover:not(:disabled) {
    border-color: var(--ea-border-strong);
    background: var(--ea-hover-fill);
    color: var(--ea-fg);
    box-shadow: none;
  }

  .timeline-display-guide:hover .timeline-display-guide__icon {
    color: var(--ea-gold);
  }
}

.timeline-display-guide__icon,
.timeline-display-guide__check {
  flex-shrink: 0;
}

.timeline-display-guide__icon {
  color: var(--ea-fg-muted);
}

.timeline-display-guide[aria-pressed='true'] .timeline-display-guide__icon {
  color: var(--ea-gold);
}

.timeline-display-guide__content {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.timeline-display-guide__content strong {
  font-size: 12px;
  font-weight: 700;
}

.timeline-display-guide__content small {
  color: var(--ea-fg-faint);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.timeline-display-guide__check {
  color: color-mix(in srgb, var(--ea-gold) 85%, transparent);
}

.timeline-display-scroll {
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-gutter: stable;
}

.timeline-display-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timeline-display-section + .timeline-display-section {
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--ea-border-soft);
}

.timeline-display-section + .timeline-display-section--follow {
  margin-top: 8px;
  padding-top: 0;
  border-top: 0;
}

.timeline-display-section__title {
  margin: 0;
  color: var(--ea-fg-muted);
  font-size: 11px;
  font-weight: 600;
}

.timeline-display-empty {
  margin: 0;
  padding: 8px;
  color: var(--ea-fg-faint);
  font-size: 12px;
}

@media (max-width: 1080px) {
  .command-button--analysis,
  .ts-header-group {
    display: none;
  }
}
@media (hover: hover) and (pointer: fine) {
  .ts-tab-item.ea-button:hover:not(:disabled):not([aria-pressed='true']) {
    background-color: var(--ea-hover-fill);
    color: var(--ea-fg);
  }
}
</style>

<style>
.header-more-popper {
  padding: 12px;
}
</style>
