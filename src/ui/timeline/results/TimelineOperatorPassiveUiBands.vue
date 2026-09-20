<script setup lang="ts">
/** 干员专属 UI 的时间轴生命周期：几何与 Buff 条一致，但保留独立语义。 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { PositionedOperatorPassiveUiTimelineSegment } from '../../../core/projection/operatorPassiveUiTimelineViz';
import OperatorPassiveUiWidget from './OperatorPassiveUiWidget.vue';
import TimelineStatusSegment from './TimelineStatusSegment.vue';
import { passiveUiSkins } from '../../operators/passive-ui/registry';
import { frameToTimelinePx } from '../timelineGeometry';
import { timelineUpperBuffTop } from './timelineTrackEffectLayout';

const props = defineProps<{
  segments: readonly PositionedOperatorPassiveUiTimelineSegment[];
  prepFrames: number;
  pxPerFrame: number;
  actionTop: number;
  prepEndFrame?: number;

  prepExpanded: boolean;
  operatorName: string;
}>();
const { t } = useI18n({ useScope: 'global' });

const emit = defineEmits<{
  'open-detail': [segment: PositionedOperatorPassiveUiTimelineSegment, title: string];
}>();

const ICON_HEIGHT = 16;
const BAR_GAP = 2;

function iconWidth(segment: PositionedOperatorPassiveUiTimelineSegment): number {
  if (segment.kind === 'abilityEntityCount') return 18;
  const skin = passiveUiSkins[segment.appearance];
  return Math.min(30, Math.max(18, (skin.width / skin.height) * ICON_HEIGHT + 2));
}

function segmentTitle(segment: PositionedOperatorPassiveUiTimelineSegment): string {
  if (segment.kind === 'abilityEntityCount')
    return `${props.operatorName} · ${t(segment.nameKey)} × ${segment.entities.length}`;
  const label = t(`timeline.passiveUi.appearances.${segment.appearance}`);
  const state =
    segment.kind === 'numeric'
      ? t('timeline.passiveUi.numericState', {
          value: segment.value,
          maximum: segment.maximum,
        })
      : segment.kind === 'buffProgress'
        ? t(`timeline.passiveUi.modes.${segment.mode}`)
        : t('timeline.passiveUi.counterState', {
            battle: segment.battleArrows,
            maximumArrows: segment.maximumArrows,
            points: segment.points,
            maximumPoints: segment.maximumPoints,
          });
  return `${props.operatorName} · ${label}：${state}`;
}

function segmentName(segment: PositionedOperatorPassiveUiTimelineSegment): string {
  if (segment.kind === 'abilityEntityCount') return `${props.operatorName} · ${t(segment.nameKey)}`;
  return `${props.operatorName} · ${t(`timeline.passiveUi.appearances.${segment.appearance}`)}`;
}

const items = computed(() =>
  props.segments.map(segment => {
    const left = frameToTimelinePx(
      segment.startFrame,
      props.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    );
    const right = frameToTimelinePx(
      segment.endFrame,
      props.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    );
    const title = segmentTitle(segment);
    const renderedIconWidth = iconWidth(segment);
    return {
      ...segment,
      key:
        segment.kind === 'numeric'
          ? `${segment.operatorId}:numeric:${segment.startFrame}:${segment.value}`
          : segment.kind === 'buffProgress'
            ? `${segment.operatorId}:${segment.buffId}:${segment.instanceId}:${segment.startFrame}`
            : `${segment.operatorId}:${segment.kind}:${segment.startFrame}`,
      title,
      name: segmentName(segment),
      left,
      top: timelineUpperBuffTop(segment.lane),
      iconWidth: renderedIconWidth,
      width: Math.max(0, right - left - renderedIconWidth - BAR_GAP * 2),
    };
  }),
);
</script>

<template>
  <div
    v-if="items.length > 0"
    class="timeline-operator-passive-ui-bands"
    :style="{ '--buff-action-top': `${actionTop}px` }"
    aria-label="Operator passive UI timeline"
  >
    <TimelineStatusSegment
      v-for="item in items"
      :key="item.key"
      :left="item.left"
      :top="item.top"
      :width="item.width"
      :title="item.title"
      :count="
        item.kind === 'abilityEntityCount'
          ? item.entities.length
          : item.kind === 'numeric'
            ? item.value
            : null
      "
      :active="item.kind === 'numeric' && item.active"
      :icon-width="item.iconWidth"
      interactive
      @activate="emit('open-detail', item, item.name)"
    >
      <template #content>
        <img
          v-if="item.kind === 'abilityEntityCount'"
          :src="item.icon"
          alt=""
          draggable="false"
          :style="{ width: `${ICON_HEIGHT}px`, height: `${ICON_HEIGHT}px`, objectFit: 'contain' }"
        />
        <OperatorPassiveUiWidget
          v-else
          :appearance="item.appearance"
          :active="item.kind === 'numeric' && item.active"
          :mode="item.kind === 'buffProgress' ? item.mode : undefined"
          :value="
            item.kind === 'buffCounters'
              ? item.battleArrows
              : item.kind === 'numeric'
                ? item.value
                : undefined
          "
          :maximum="
            item.kind === 'buffCounters'
              ? item.maximumArrows
              : item.kind === 'numeric'
                ? item.maximum
                : undefined
          "
          :points="item.kind === 'buffCounters' ? item.points : undefined"
          :height="ICON_HEIGHT"
          :max-width="item.iconWidth - 2"
        />
      </template>
    </TimelineStatusSegment>
  </div>
</template>

<style scoped>
.timeline-operator-passive-ui-bands {
  position: absolute;
  inset: 0;
  z-index: 8;
  overflow: hidden;
  pointer-events: none;
  clip-path: inset(2px 0 calc(100% - var(--buff-action-top)) 0);
}
</style>
