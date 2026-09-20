<script setup lang="ts">
/** 循环线、切入标记与模拟区间端点的实例级 Inspector。 */
import { useI18n } from 'vue-i18n';
import {
  EaButton,
  EaNumberInput,
  EaSelect,
  type EaSelectValue,
} from '../../../design-system/index';
import type { TrackIndex } from '../../../core/project/schema';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import CombatObjectOriginGraph from '../results/CombatObjectOriginGraph.vue';

export type TimelineDocumentMarkerKind =
  'cycleBoundary' | 'controlSwitch' | 'dodge' | 'simulationStart' | 'simulationEnd';

const props = defineProps<{
  kind: TimelineDocumentMarkerKind;
  id: string;
  frame: number;
  minimumFrame: number;
  maximumFrame: number;
  readOnly?: boolean;
  /** 历史 Dash 已冻结时，仍可编辑尚未发生的成功声明。 */
  successReadOnly?: boolean;
  minimumSuccessDelayFrames?: number;
  trackIndex?: TrackIndex;
  direction?: 'forward' | 'backward';
  dodgeMode?: 'dodge' | 'perfectDodge';
  successDelayFrames?: number;
  /** 已发布模拟中与当前闪避标记对应的实际执行事实；纯文本可直接选择复制。 */
  dodgeDiagnostics?: readonly string[];
  dodgeEffects?: readonly CombatReceiptEntry[];
  receiptEntries?: readonly CombatReceiptEntry[];
  operatorLabel?: (operatorId: string) => string;
  objectIcon?: import('../results/combatObjectIcons').CombatObjectIconResolver;
  actionPresentation?: (
    ownerId: string,
    actionId: string,
  ) => { name: string; kind: string } | undefined;
  buffLabel?: (buffId: string) => string;
  skillCastLabel?: (castId: string) => string | undefined;
  trackOptions: readonly { trackIndex: TrackIndex; label: string }[];
}>();

const emit = defineEmits<{
  setFrame: [frame: number];
  setTrackIndex: [trackIndex: TrackIndex];
  setDirection: [direction: 'forward' | 'backward'];
  setDodgeMode: [mode: 'dodge' | 'perfectDodge'];
  setSuccessDelayFrames: [frames: number];
  remove: [];
}>();

const { t } = useI18n({ useScope: 'global' });

function commitFrame(value: number | undefined): void {
  const frame = Number(value);
  if (Number.isInteger(frame) && frame >= props.minimumFrame && frame <= props.maximumFrame) {
    emit('setFrame', frame);
  }
}

function commitTrackIndex(value: EaSelectValue | EaSelectValue[]): void {
  const trackIndex = Number(value);
  if (
    Number.isInteger(trackIndex) &&
    props.trackOptions.some(option => option.trackIndex === trackIndex)
  ) {
    emit('setTrackIndex', trackIndex as TrackIndex);
  }
}

function commitDirection(value: EaSelectValue | EaSelectValue[]): void {
  if (value === 'forward' || value === 'backward') emit('setDirection', value);
}

function commitDodgeMode(value: EaSelectValue | EaSelectValue[]): void {
  if (value === 'dodge' || value === 'perfectDodge') emit('setDodgeMode', value);
}

function commitSuccessDelay(value: number | undefined): void {
  const frames = Number(value);
  if (Number.isInteger(frames) && frames >= (props.minimumSuccessDelayFrames ?? 0))
    emit('setSuccessDelayFrames', frames);
}

function effectDetail(entry: CombatReceiptEntry): string {
  const data = entry.data;
  if (entry.event === 'BuffApplied' || entry.event === 'BuffStackChanged') {
    return typeof data?.buffId === 'string' ? (props.buffLabel?.(data.buffId) ?? data.buffId) : '';
  }
  if (entry.event === 'SpChanged' || entry.event === 'UltimateEnergyChanged') {
    return typeof data?.actualValue === 'number'
      ? `${data.actualValue >= 0 ? '+' : ''}${data.actualValue}`
      : '';
  }
  if (entry.event === 'TimeDilationStarted') {
    return typeof data?.durationSeconds === 'number' ? `${data.durationSeconds}s` : '';
  }
  if (entry.event === 'SkillStarted') {
    return typeof data?.castId === 'string' ? (props.skillCastLabel?.(data.castId) ?? '') : '';
  }
  return '';
}
</script>

<template>
  <section class="marker-inspector">
    <header class="panel-header">
      <div class="header-icon-bar"></div>
      <h3>{{ t('timeline.documentMarkerInspector.title') }}</h3>
    </header>

    <div class="scrollable-content">
      <section class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.inspector.sections.basic') }}</div>
        <div class="attribute-grid">
          <div class="form-group attribute-grid__wide">
            <span>{{ t('timeline.documentMarkerInspector.kind') }}</span>
            <div class="readonly-field">
              {{ t(`timeline.markerLabels.${kind}`) }}
            </div>
          </div>
          <label class="form-group">
            <span>{{ t('timeline.inspector.labels.startFrame') }}</span>
            <EaNumberInput
              size="sm"
              controls-position="right"
              :min="minimumFrame"
              :max="maximumFrame"
              :step="1"
              :model-value="frame"
              @change="commitFrame"
              :disabled="readOnly"
            />
          </label>
          <div
            v-if="kind === 'cycleBoundary' || kind === 'controlSwitch' || kind === 'dodge'"
            class="form-group"
          >
            <span>{{ t('timeline.documentMarkerInspector.markerId') }}</span>
            <div class="readonly-field">{{ id }}</div>
          </div>
          <label
            v-if="kind === 'controlSwitch' || kind === 'dodge'"
            class="form-group attribute-grid__wide"
          >
            <span>{{ t('timeline.documentMarkerInspector.targetTrack') }}</span>
            <EaSelect
              size="sm"
              :model-value="trackIndex"
              :options="
                trackOptions.map(option => ({ label: option.label, value: option.trackIndex }))
              "
              @change="commitTrackIndex"
              :disabled="readOnly"
            />
          </label>
          <label v-if="kind === 'dodge'" class="form-group">
            <span>{{ t('timeline.documentMarkerInspector.direction') }}</span>
            <EaSelect
              size="sm"
              :model-value="direction"
              :options="[
                { label: t('timeline.documentMarkerInspector.forward'), value: 'forward' },
                { label: t('timeline.documentMarkerInspector.backward'), value: 'backward' },
              ]"
              @change="commitDirection"
              :disabled="readOnly"
            />
          </label>
          <label v-if="kind === 'dodge'" class="form-group">
            <span>{{ t('timeline.documentMarkerInspector.dodgeResult') }}</span>
            <EaSelect
              size="sm"
              :model-value="dodgeMode"
              :options="[
                { label: t('timeline.markerLabels.dodge'), value: 'dodge' },
                { label: t('timeline.markerLabels.perfectDodge'), value: 'perfectDodge' },
              ]"
              @change="commitDodgeMode"
              :disabled="successReadOnly ?? readOnly"
            />
          </label>
          <label
            v-if="kind === 'dodge' && dodgeMode === 'perfectDodge'"
            class="form-group attribute-grid__wide"
          >
            <span>{{ t('timeline.documentMarkerInspector.successDelayFrames') }}</span>
            <EaNumberInput
              size="sm"
              controls-position="right"
              :min="minimumSuccessDelayFrames ?? 0"
              :step="1"
              :model-value="successDelayFrames ?? 0"
              @change="commitSuccessDelay"
              :disabled="successReadOnly ?? readOnly"
            />
          </label>
        </div>
        <small class="field-help">
          {{ t(`timeline.documentMarkerInspector.hints.${kind}`) }}
        </small>
      </section>

      <section v-if="kind === 'dodge'" class="section-container">
        <div class="panel-tag-mini">
          {{ t('timeline.documentMarkerInspector.simulationResult') }}
        </div>
        <div v-if="dodgeDiagnostics?.length" class="dodge-diagnostics">
          <div v-for="(diagnostic, index) in dodgeDiagnostics" :key="index" class="readonly-field">
            {{ diagnostic }}
          </div>
        </div>
        <div v-else class="readonly-field">
          {{ t('timeline.documentMarkerInspector.results.noPublishedResult') }}
        </div>
      </section>

      <section v-if="kind === 'dodge' && dodgeEffects?.length" class="section-container">
        <div class="panel-tag-mini">{{ t('timeline.documentMarkerInspector.effects') }}</div>
        <div class="dodge-effects">
          <div v-for="effect in dodgeEffects" :key="effect.sequence" class="dodge-effect">
            <div class="dodge-effect__fact">
              {{ t('timeline.documentMarkerInspector.effectFrame', { frame: effect.frame }) }} ·
              {{ t(`timeline.documentMarkerInspector.effectEvents.${effect.event}`) }}
              <span v-if="effectDetail(effect)">{{ effectDetail(effect) }}</span>
            </div>
            <CombatObjectOriginGraph
              v-if="receiptEntries?.length"
              :sequence="effect.sequence"
              :receipt-entries="receiptEntries"
              :operator-label="operatorLabel"
              :object-icon="objectIcon"
              :action-presentation="actionPresentation"
            />
          </div>
        </div>
      </section>

      <section class="section-container danger-section">
        <EaButton
          variant="danger"
          size="sm"
          type="button"
          class="delete-button"
          @click="$emit('remove')"
          :disabled="readOnly"
        >
          {{ t('timeline.markerContext.deleteMarker') }}
        </EaButton>
      </section>
    </div>
  </section>
</template>

<style scoped>
.marker-inspector {
  height: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--ea-panel-bg, #17191c);
  color: var(--ea-text, #e8e8e8);
}

.panel-header {
  position: relative;
  min-height: 44px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--ea-border, #353a40);
}

.header-icon-bar {
  width: 4px;
  align-self: stretch;
  background: #cfb73a;
}

.panel-header h3 {
  min-width: 0;
  margin: 0;
  padding: 0 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.scrollable-content {
  min-height: 0;
  overflow: auto;
  padding-bottom: 12px;
}

.section-container {
  min-width: 0;
  padding: 12px;
  border-bottom: 1px solid var(--ea-border, #353a40);
}

.panel-tag-mini {
  margin-bottom: 10px;
  color: var(--ea-text-secondary, #aeb4bb);
  font-size: 12px;
  font-weight: 700;
}

.attribute-grid {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.attribute-grid__wide {
  grid-column: 1 / -1;
}

.form-group {
  min-width: 0;
  display: grid;
  gap: 5px;
  color: var(--ea-text-secondary, #aeb4bb);
  font-size: 12px;
}

.readonly-field {
  min-width: 0;
  overflow-wrap: anywhere;
  border-radius: 3px;
  padding: 7px 8px;
  background: rgb(255 255 255 / 4%);
  color: var(--ea-text, #e8e8e8);
}

.field-help {
  display: block;
  margin-top: 9px;
  color: var(--ea-text-muted, #7f8790);
  line-height: 1.45;
}

.dodge-diagnostics {
  display: grid;
  gap: 6px;
  user-select: text;
}

.dodge-effects {
  display: grid;
  gap: 6px;
}

.dodge-effect {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  background: rgb(255 255 255 / 4%);
}

.dodge-effect__fact {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 12px;
  user-select: text;
}

.danger-section {
  border-bottom: 0;
}

.delete-button {
  width: 100%;
}
</style>
