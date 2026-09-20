<script setup lang="ts">
import { EaButton, EaDialog } from '../../../design-system/index';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BuffDetailInstance, BuffDetailTarget } from './buffDetail';
import CombatObjectOriginGraph from './CombatObjectOriginGraph.vue';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';

const { t } = useI18n({ useScope: 'global' });

const props = defineProps<{
  visible: boolean;
  target: BuffDetailTarget | null;
  fps: number;
  receiptEntries?: readonly CombatReceiptEntry[];
  operatorLabel?: (operatorId: string) => string;
  objectIcon?: import('./combatObjectIcons').CombatObjectIconResolver;
  actionPresentation?: (
    ownerId: string,
    actionId: string,
  ) => { name: string; kind: string } | undefined;
  labels: {
    title: string;
    source: string;
    effect: string;
    layers: string;
    start: string;
    startReason: string;
    end: string;
    endReason: string;
    duration: string;
    frames: (value: number) => string;
    buffId: string;
  };
}>();

const emit = defineEmits<{
  'update:visible': [visible: boolean];
}>();

const instanceIndex = ref(0);
watch(
  () => props.target,
  () => {
    instanceIndex.value = 0;
  },
);
const activeInstance = computed<BuffDetailInstance | null>(() => {
  if (props.target === null) return null;
  return (
    props.target.instances?.[instanceIndex.value] ?? {
      ...(props.target.sourceName === undefined ? {} : { sourceName: props.target.sourceName }),
      startFrame: props.target.startFrame,
      endFrame: props.target.endFrame,
      layers: props.target.layers,
      ...(props.target.startReason === undefined ? {} : { startReason: props.target.startReason }),
      ...(props.target.endReason === undefined ? {} : { endReason: props.target.endReason }),
      ...(props.target.stackingType === undefined
        ? {}
        : { stackingType: props.target.stackingType }),
      ...(props.target.parentBuffId === undefined
        ? {}
        : { parentBuffId: props.target.parentBuffId }),
      icon: props.target.icon,
      ...(props.target.modifierSummary === undefined
        ? {}
        : { modifierSummary: props.target.modifierSummary }),
    }
  );
});
const durationFrames = computed(() =>
  activeInstance.value === null
    ? 0
    : Math.max(0, activeInstance.value.endFrame - activeInstance.value.startFrame),
);
const origins = computed(() => new CombatObjectOrigins(props.receiptEntries ?? []));
const originRoot = computed(() =>
  activeInstance.value?.instanceId === undefined || !props.target
    ? undefined
    : {
        kind: 'buff' as const,
        ownerId: props.target.targetId,
        instanceId: activeInstance.value.instanceId,
      },
);
// 精确截到所选窗口形成时；缺少序号不能退回整次模拟结束，以免泄漏未来状态。
const originSequence = computed(() => activeInstance.value?.startSequence);

function seconds(frames: number): string {
  if (!Number.isFinite(props.fps) || props.fps <= 0) return '—';
  return `${(frames / props.fps).toFixed(2).replace(/\.00$/, '')}s`;
}

function startReasonText(instance: BuffDetailInstance): string {
  if (instance.startReason === 'presentationStarted') {
    return instance.parentBuffId === undefined
      ? t('timeline.buffDetail.startReasons.presentationStarted')
      : t('timeline.buffDetail.startReasons.presentationStartedWithParent', {
          parentBuffId: instance.parentBuffId,
        });
  }
  if (instance.startReason !== 'reapplied') {
    return t('timeline.buffDetail.startReasons.applied');
  }
  switch (instance.stackingType) {
    case 'enhance':
    case 'enhanceAndRefresh':
    case 'enhanceAndOverwriteDuration':
    case 'timedGrowingEnhance':
      return t('timeline.buffDetail.startReasons.enhanced');
    case 'refresh':
      return t('timeline.buffDetail.startReasons.refreshed');
    case 'extend':
      return t('timeline.buffDetail.startReasons.extended');
    case 'overwriteDuration':
      return t('timeline.buffDetail.startReasons.durationOverwritten');
    case 'modify':
      return t('timeline.buffDetail.startReasons.modified');
    default:
      return t('timeline.buffDetail.startReasons.reapplied');
  }
}

function endReasonText(instance: BuffDetailInstance): string {
  return t(`timeline.buffDetail.endReasons.${instance.endReason ?? 'unknown'}`);
}
</script>

<template>
  <InputRegionBoundary label="TimelineBuffDetailDialog" :active="visible" modal>
    <EaDialog
      :model-value="visible"
      :title="labels.title"
      width="440px"
      class="timeline-buff-detail-dialog"
      :close-on-click-modal="true"
      @update:model-value="emit('update:visible', $event)"
    >
      <template v-if="target !== null && activeInstance !== null">
        <header class="buff-detail__header">
          <span class="buff-detail__icon">
            <img v-if="activeInstance.icon" :src="activeInstance.icon" alt="" />
            <span v-else>+</span>
            <span class="buff-detail__count">{{ activeInstance.layers }}</span>
          </span>
          <strong>{{ activeInstance.title ?? target.title }}</strong>
          <span v-if="(target.instances?.length ?? 0) > 1" class="buff-detail__pager">
            <EaButton size="sm" icon-only :disabled="instanceIndex === 0" @click="instanceIndex--">
              ‹
            </EaButton>
            <span>{{ instanceIndex + 1 }} / {{ target.instances!.length }}</span>
            <EaButton
              size="sm"
              icon-only
              :disabled="instanceIndex >= target.instances!.length - 1"
              @click="instanceIndex++"
            >
              ›
            </EaButton>
          </span>
        </header>

        <dl class="buff-detail__facts">
          <template v-if="activeInstance.sourceName">
            <dt>{{ labels.source }}</dt>
            <dd>{{ activeInstance.sourceName }}</dd>
          </template>
          <template v-if="activeInstance.modifierSummary">
            <dt>{{ labels.effect }}</dt>
            <dd>{{ activeInstance.modifierSummary }}</dd>
          </template>
          <dt>{{ labels.layers }}</dt>
          <dd>{{ activeInstance.layers }}</dd>
          <dt>{{ labels.start }}</dt>
          <dd>
            {{ seconds(activeInstance.startFrame) }} ·
            {{ labels.frames(activeInstance.startFrame) }}
          </dd>
          <dt>{{ labels.startReason }}</dt>
          <dd>{{ startReasonText(activeInstance) }}</dd>
          <dt>{{ labels.end }}</dt>
          <dd>
            {{ seconds(activeInstance.endFrame) }} · {{ labels.frames(activeInstance.endFrame) }}
          </dd>
          <dt>{{ labels.endReason }}</dt>
          <dd>{{ endReasonText(activeInstance) }}</dd>
          <dt>{{ labels.duration }}</dt>
          <dd>{{ seconds(durationFrames) }} · {{ labels.frames(durationFrames) }}</dd>
          <dt>{{ labels.buffId }}</dt>
          <dd>
            <code>{{ activeInstance.buffId ?? target.buffId }}</code>
          </dd>
        </dl>
        <CombatObjectOriginGraph
          v-if="originRoot && originSequence !== undefined && receiptEntries?.length"
          :key="`${originRoot.ownerId}:${originRoot.instanceId}:${originSequence}`"
          :origins="origins"
          :root="originRoot"
          :sequence="originSequence"
          :operator-label="operatorLabel"
          :object-icon="objectIcon"
          :action-presentation="actionPresentation"
        />
      </template>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.buff-detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  margin-bottom: 18px;
  font-size: 16px;
}

.buff-detail__pager {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--ea-fg-muted);
  font-size: 12px;
}

.buff-detail__icon {
  position: relative;
  display: grid;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  place-items: center;
  box-sizing: border-box;
  border: 1px solid var(--ea-keycap-skill-border, #999);
  border-radius: 3px;
  background: var(--ea-keycap-skill-bg, #333);
  color: #eef6ff;
  font-weight: 700;
}

.buff-detail__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.buff-detail__count {
  position: absolute;
  right: -4px;
  bottom: -4px;
  min-width: 13px;
  padding: 0 3px;
  border-radius: 2px;
  background: rgb(19 20 22 / 94%);
  color: var(--ea-gold);
  font:
    700 10px/13px 'Roboto Mono',
    Consolas,
    monospace;
  text-align: center;
}

.buff-detail__facts {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 10px 14px;
  margin: 0;
  padding: 14px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-soft);
}

.buff-detail__facts dt {
  color: var(--ea-fg-muted);
}

.buff-detail__facts dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
}

.buff-detail__facts code {
  color: var(--ea-fg);
  font-size: 12px;
}
</style>
