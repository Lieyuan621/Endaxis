<script setup lang="ts">
/** 展示时间轴上某一段干员专属战斗界面状态；数据直接来自已经完成的模拟投影。 */
import { EaDialog } from '@/design-system';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PositionedOperatorPassiveUiTimelineSegment } from '../../../core/projection/operatorPassiveUiTimelineViz';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import OperatorPassiveUiWidget from './OperatorPassiveUiWidget.vue';
import CombatObjectOriginGraph from './CombatObjectOriginGraph.vue';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

const props = defineProps<{
  visible: boolean;
  segment: PositionedOperatorPassiveUiTimelineSegment | null;
  title: string;
  fps: number;
  receiptEntries?: readonly CombatReceiptEntry[];
  operatorLabel?: (operatorId: string) => string;
  objectIcon?: import('./combatObjectIcons').CombatObjectIconResolver;
  actionPresentation?: (
    ownerId: string,
    actionId: string,
  ) => { name: string; kind: string } | undefined;
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
}>();

const { t } = useI18n({ useScope: 'global' });
const durationFrames = computed(() =>
  props.segment === null ? 0 : Math.max(0, props.segment.endFrame - props.segment.startFrame),
);

const numericValueLabel = computed(() => {
  if (props.segment?.kind !== 'numeric') return '';
  return t(`timeline.passiveUi.values.${props.segment.appearance}`);
});

const description = computed(() => {
  if (props.segment === null || props.segment.kind === 'abilityEntityCount') return '';
  return t(`timeline.passiveUi.descriptions.${props.segment.appearance}`);
});
const sourceSequence = computed(() => {
  let sequence = 0;
  for (const entry of props.receiptEntries ?? []) {
    if (entry.frame > (props.segment?.startFrame ?? 0)) break;
    sequence = entry.sequence;
  }
  return sequence;
});
const entityIcon: import('./combatObjectIcons').CombatObjectIconResolver = (node, sequence) => {
  const segment = props.segment;
  const ref = node.ref;
  if (
    segment?.kind === 'abilityEntityCount' &&
    ref.kind === 'abilityEntity' &&
    segment.entities.some(entity => entity.instanceId === ref.instanceId)
  )
    return segment.icon;
  return props.objectIcon?.(node, sequence);
};

function seconds(frames: number): string {
  if (!Number.isFinite(props.fps) || props.fps <= 0) return '—';
  return `${(frames / props.fps).toFixed(2).replace(/\.00$/, '')}s`;
}
</script>

<template>
  <InputRegionBoundary label="TimelineOperatorPassiveUiDetailDialog" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      :title="t('timeline.passiveUi.detailTitle')"
      width="440px"
      class="timeline-passive-ui-detail-dialog"
      :close-on-click-modal="true"
      @update:model-value="emit('update:visible', $event)"
    >
      <template v-if="segment !== null">
        <header class="passive-detail__header">
          <span class="passive-detail__preview">
            <img
              v-if="segment.kind === 'abilityEntityCount'"
              :src="segment.icon"
              alt=""
              width="44"
              height="44"
            />
            <OperatorPassiveUiWidget
              v-else
              :appearance="segment.appearance"
              :active="segment.kind === 'numeric' && segment.active"
              :mode="segment.kind === 'buffProgress' ? segment.mode : undefined"
              :value="
                segment.kind === 'buffCounters'
                  ? segment.battleArrows
                  : segment.kind === 'numeric'
                    ? segment.value
                    : undefined
              "
              :maximum="
                segment.kind === 'buffCounters'
                  ? segment.maximumArrows
                  : segment.kind === 'numeric'
                    ? segment.maximum
                    : undefined
              "
              :points="segment.kind === 'buffCounters' ? segment.points : undefined"
              :height="44"
              :max-width="96"
            />
          </span>
          <strong>{{ title }}</strong>
        </header>

        <p v-if="description" class="passive-detail__description">{{ description }}</p>

        <dl class="passive-detail__facts">
          <template v-if="segment.kind === 'abilityEntityCount'">
            <dt>{{ t(segment.nameKey) }}</dt>
            <dd>× {{ segment.entities.length }}</dd>
          </template>
          <template v-else-if="segment.kind === 'numeric'">
            <dt>{{ numericValueLabel }}</dt>
            <dd>{{ segment.value }} / {{ segment.maximum }}</dd>
          </template>
          <template v-else-if="segment.kind === 'buffProgress'">
            <dt>{{ t('timeline.passiveUi.mode') }}</dt>
            <dd>{{ t(`timeline.passiveUi.modes.${segment.mode}`) }}</dd>
          </template>
          <template v-else>
            <dt>{{ t('timeline.passiveUi.battleArrows') }}</dt>
            <dd>{{ segment.battleArrows }} / {{ segment.maximumArrows }}</dd>
            <dt>{{ t('timeline.passiveUi.points') }}</dt>
            <dd>{{ segment.points }} / {{ segment.maximumPoints }}</dd>
          </template>
          <dt>{{ t('timeline.buffDetail.start') }}</dt>
          <dd>
            {{ seconds(segment.startFrame) }} ·
            {{ t('timeline.buffDetail.frames', { value: segment.startFrame }) }}
          </dd>
          <dt>{{ t('timeline.buffDetail.end') }}</dt>
          <dd>
            {{ seconds(segment.endFrame) }} ·
            {{ t('timeline.buffDetail.frames', { value: segment.endFrame }) }}
          </dd>
          <dt>{{ t('timeline.buffDetail.duration') }}</dt>
          <dd>
            {{ seconds(durationFrames) }} ·
            {{ t('timeline.buffDetail.frames', { value: durationFrames }) }}
          </dd>
        </dl>
        <template v-if="segment.kind === 'abilityEntityCount'">
          <div v-for="entity in segment.entities" :key="entity.instanceId">
            <span>{{ t(segment.nameKey) }} #{{ entity.instanceId }}</span>
            <CombatObjectOriginGraph
              :root="entity"
              :sequence="sourceSequence"
              :receipt-entries="receiptEntries"
              :operator-label="operatorLabel"
              :object-icon="entityIcon"
              :action-presentation="actionPresentation"
            />
          </div>
        </template>
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.passive-detail__header {
  display: flex;
  min-height: 58px;
  align-items: center;
  gap: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--ea-border-subtle, rgb(255 255 255 / 12%));
}

.passive-detail__preview {
  width: 100px;
  min-height: 48px;
  display: grid;
  place-items: center;
}

.passive-detail__header strong {
  color: var(--ea-text-primary, #f1f1f1);
  font-size: 15px;
}

.passive-detail__description {
  margin: 14px 0 0;
  color: var(--ea-text-secondary, #c8c8c8);
  font-size: 13px;
  line-height: 1.6;
}

.passive-detail__facts {
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr);
  gap: 10px 16px;
  margin: 16px 0 0;
  font-size: 13px;
}

.passive-detail__facts dt {
  color: var(--ea-text-muted, #999);
}

.passive-detail__facts dd {
  min-width: 0;
  margin: 0;
  color: var(--ea-text-primary, #eee);
  overflow-wrap: anywhere;
}
</style>
