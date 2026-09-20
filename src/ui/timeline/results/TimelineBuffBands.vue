<script setup lang="ts">
import type { BuffDisplayName } from './buffDisplayName';
/** 旧版 TimelineBuffLayer 的 Next 只读版本：18px 图标、层数角标和条纹持续条。 */
import { computed } from 'vue';
import { useDurationBarColor } from './durationBarColorContext';
import { resolveDurationBarColor } from './durationBarColor';
import { useI18n } from 'vue-i18n';
import type { PositionedDisplayBuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import { resolveBuffDisplayName } from './buffDisplayName';
import { resolveSimpleBuffModifierDisplayName } from './buffDisplayName';
import type { BuffDetailTarget } from './buffDetail';
import TimelineStatusSegment from './TimelineStatusSegment.vue';
import { getIconAssetPath } from '../../gameAssetPaths';
import { frameToTimelinePx } from '../timelineGeometry';
import { timelineLowerBuffTop, timelineUpperBuffTop } from './timelineTrackEffectLayout';

const props = defineProps<{
  segments: readonly PositionedDisplayBuffTimelineSegment[];
  prepFrames: number;
  pxPerFrame: number;
  prepEndFrame?: number;

  prepExpanded: boolean;
  placement?: 'upper' | 'lower';
  actionTop?: number;
  sourceName?: (source: {
    readonly sourceId?: string;
    readonly sourceActionId?: string;
  }) => string | undefined;
  displayName?: (source: {
    readonly sourceId?: string;
    readonly sourceActionId?: string;
  }) => string | undefined;
  operatorBuffNameKeys?: ReadonlyMap<string, BuffDisplayName>;
  icon?: (source: {
    readonly sourceId?: string;
    readonly sourceActionId?: string;
  }) => string | undefined;
}>();
const { t, te } = useI18n({ useScope: 'global' });
const emit = defineEmits<{
  'open-detail': [target: BuffDetailTarget];
}>();

const ICON_SIZE = 18;
const durationBarColor = useDurationBarColor();
const BAR_GAP = 2;
const ACTION_TOP_FALLBACK = 55;

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
      segment.durationEndFrame ?? segment.endFrame,
      props.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    );
    const sourceName = props.sourceName?.(segment);
    const modifierSummary = resolveSimpleBuffModifierDisplayName(
      {
        attribute: segment.simpleModifierAttribute,
        slot: segment.simpleModifierSlot,
        value: segment.simpleModifierValue,
      },
      { t, te },
    );
    const title =
      props.displayName?.(segment) ??
      resolveBuffDisplayName(
        segment.buffId,
        { t, te },
        {
          attribute: segment.simpleModifierAttribute,
          slot: segment.simpleModifierSlot,
          value: segment.simpleModifierValue,
        },
        sourceName,
        props.operatorBuffNameKeys,
      );
    const icon = props.icon?.(segment) ?? segment.iconPath ?? getIconAssetPath(segment.iconId);
    return {
      ...segment,
      title,
      color: resolveDurationBarColor(durationBarColor.value, 'track', segment),
      key: `${segment.targetId}:${segment.buffId}:${segment.instanceId}:${segment.startFrame}`,
      left,
      top:
        props.placement === 'upper'
          ? timelineUpperBuffTop(segment.lane)
          : timelineLowerBuffTop(props.actionTop ?? ACTION_TOP_FALLBACK, segment.lane),
      width: Math.max(0, right - left - ICON_SIZE - BAR_GAP * 2),
      icon,
      detail: {
        title,
        buffId: segment.buffId,
        targetId: segment.targetId,
        ...(sourceName === undefined ? {} : { sourceName }),
        startFrame: segment.startFrame,
        endFrame: segment.endFrame,
        layers: segment.layers,
        ...(segment.startReason === undefined ? {} : { startReason: segment.startReason }),
        ...(segment.endReason === undefined ? {} : { endReason: segment.endReason }),
        ...(segment.stackingType === undefined ? {} : { stackingType: segment.stackingType }),
        ...(segment.parentBuffId === undefined ? {} : { parentBuffId: segment.parentBuffId }),
        icon,
        ...(modifierSummary === undefined ? {} : { modifierSummary }),
        instances: segment.windows.map(member => {
          const memberSourceName = props.sourceName?.(member);
          const memberModifierSummary = resolveSimpleBuffModifierDisplayName(
            {
              attribute: member.simpleModifierAttribute,
              slot: member.simpleModifierSlot,
              value: member.simpleModifierValue,
            },
            { t, te },
          );
          return {
            ...(memberSourceName === undefined ? {} : { sourceName: memberSourceName }),
            startFrame: member.startFrame,
            instanceId: member.instanceId,
            startSequence: member.startSequence,
            endFrame: member.endFrame,
            layers: member.layers,
            ...(member.startReason === undefined ? {} : { startReason: member.startReason }),
            ...(member.endReason === undefined ? {} : { endReason: member.endReason }),
            ...(member.stackingType === undefined ? {} : { stackingType: member.stackingType }),
            ...(member.parentBuffId === undefined ? {} : { parentBuffId: member.parentBuffId }),
            icon: props.icon?.(member) ?? member.iconPath ?? getIconAssetPath(member.iconId),
            ...(memberModifierSummary === undefined
              ? {}
              : { modifierSummary: memberModifierSummary }),
          };
        }),
      } satisfies BuffDetailTarget,
    };
  }),
);
</script>

<template>
  <div
    v-if="items.length > 0"
    class="timeline-buff-bands"
    :class="`is-${placement ?? 'lower'}`"
    :style="{ '--buff-action-top': `${actionTop ?? ACTION_TOP_FALLBACK}px` }"
    aria-label="Buff timeline"
  >
    <TimelineStatusSegment
      v-for="item in items"
      :key="item.key"
      :left="item.left"
      :top="item.top"
      :width="item.width"
      :title="item.title"
      :duration-color="item.color"
      :count="item.layers"
      interactive
      @activate="emit('open-detail', item.detail)"
    >
      <template #content>
        <img v-if="item.icon" :src="item.icon" class="timeline-buff-icon" alt="" />
        <span v-else class="timeline-buff-fallback">+</span>
      </template>
    </TimelineStatusSegment>
  </div>
</template>

<style scoped>
.timeline-buff-bands {
  position: absolute;
  inset: 0;
  z-index: 8;
  overflow: hidden;
  pointer-events: none;
}

.timeline-buff-bands.is-upper {
  clip-path: inset(2px 0 calc(100% - var(--buff-action-top)) 0);
}

.timeline-buff-bands.is-lower {
  clip-path: inset(calc(var(--buff-action-top) + 50px) 0 2px 0);
}

.timeline-buff-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.timeline-buff-fallback {
  color: #eef6ff;
  font-size: 10px;
  font-weight: 700;
}
</style>
