<script setup lang="ts">
import { resolveImage } from '../../imageResources';
import type { BuffDisplayName } from './buffDisplayName';
/** 已定位的 Buff 展示段；不决定面板的状态筛选和行分配。 */
import { computed, type ComputedRef } from 'vue';
import { useDurationBarColor } from './durationBarColorContext';
import type { DurationColorSurface } from './durationBarColor';
import type { AttachmentConversion } from '../../../core/projection/enemyEffectViz';
import { projectBuffTimelineColors } from './buffTimelineColors';
import { useI18n } from 'vue-i18n';
import type { PositionedDisplayBuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import { resolveBuffDisplayName } from './buffDisplayName';
import { resolveBuffEffectSummary, showBuffLayerBadge } from './buffDisplayName';
import type { BuffDetailTarget } from './buffDetail';
import TimelineStatusSegment from './TimelineStatusSegment.vue';
import { frameToTimelinePx } from '../timelineGeometry';
import { timelineLowerBuffTop, timelineUpperBuffTop } from './timelineTrackEffectLayout';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';

const props = defineProps<{
  rowSize?: number;
  colorSurface?: DurationColorSurface;
  attachmentConversions?: readonly AttachmentConversion[];
  segments: readonly PositionedDisplayBuffTimelineSegment[];
  visibleLeftPx?: number;
  visibleRightPx?: number;
  hiddenIcons?: ReadonlySet<PositionedDisplayBuffTimelineSegment>;
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
const { t, te, locale } = useI18n({ useScope: 'global' });
const emit = defineEmits<{
  'open-detail': [target: BuffDetailTarget];
}>();

const iconSize = computed(() => props.rowSize ?? 18);
const durationBarColor = useDurationBarColor();
const colors = computed(() =>
  projectBuffTimelineColors(
    props.segments,
    props.attachmentConversions ?? [],
    durationBarColor.value,
    props.colorSurface ?? 'track',
  ),
);
const BAR_GAP = 2;
const ACTION_TOP_FALLBACK = 55;
const attachmentBuffIds = new Set([
  ...elementalAttachments.buffs
    .filter(buff => buff.role?.kind === 'elementalAttachment')
    .map(buff => buff.id),
  'buff_common_enemy_spell_fire_attached',
  'buff_common_enemy_spell_pulse_attached',
  'buff_common_enemy_spell_cryst_attached',
  'buff_common_enemy_spell_natural_attached',
]);

interface BuffPresentation {
  readonly title: string;
  readonly tooltip: string;
  readonly icon: string | undefined;
  readonly detail: BuffDetailTarget;
}

function buildPresentation(segment: PositionedDisplayBuffTimelineSegment): BuffPresentation {
  // 文字解析在语言切换时必须重新执行；来源名称等回调也由当前响应式上下文追踪。
  void locale.value;
  const sourceName = props.sourceName?.(segment);
  const modifierSummary = resolveBuffEffectSummary(segment, { t, te });
  const title =
    props.displayName?.(segment) ??
    resolveBuffDisplayName(
      segment.buffId,
      { t, te },
      undefined,
      sourceName,
      props.operatorBuffNameKeys,
    );
  const icon = props.icon?.(segment) ?? resolveImage(segment.icon);
  return {
    title,
    tooltip: modifierSummary ? `${title}\n${modifierSummary}` : title,
    icon,
    detail: {
      title,
      buffId: segment.buffId,
      targetId: segment.targetId,
      instanceId: segment.instanceId,
      startSequence: segment.startSequence,
      ...(sourceName === undefined ? {} : { sourceName }),
      startFrame: segment.startFrame,
      endFrame: segment.endFrame,
      enabled: segment.enabled,
      enhanceCount: segment.enhanceCount,
      displayCount: segment.displayCount,
      layers: segment.layers,
      ...(segment.startReason === undefined ? {} : { startReason: segment.startReason }),
      ...(segment.endReason === undefined ? {} : { endReason: segment.endReason }),
      ...(segment.stackingType === undefined ? {} : { stackingType: segment.stackingType }),
      ...(segment.parentBuffId === undefined ? {} : { parentBuffId: segment.parentBuffId }),
      icon,
      ...(modifierSummary === undefined ? {} : { modifierSummary }),
      instances: segment.windows.map(member => {
        const memberSourceName = props.sourceName?.(member);
        const memberModifierSummary = resolveBuffEffectSummary(member, { t, te });
        return {
          ...(memberSourceName === undefined ? {} : { sourceName: memberSourceName }),
          startFrame: member.startFrame,
          instanceId: member.instanceId,
          startSequence: member.startSequence,
          endFrame: member.endFrame,
          enabled: member.enabled,
          enhanceCount: member.enhanceCount,
          displayCount: member.displayCount,
          layers: member.layers,
          ...(member.startReason === undefined ? {} : { startReason: member.startReason }),
          ...(member.endReason === undefined ? {} : { endReason: member.endReason }),
          ...(member.stackingType === undefined ? {} : { stackingType: member.stackingType }),
          ...(member.parentBuffId === undefined ? {} : { parentBuffId: member.parentBuffId }),
          icon: props.icon?.(member) ?? resolveImage(member.icon),
          ...(memberModifierSummary === undefined
            ? {}
            : { modifierSummary: memberModifierSummary }),
        };
      }),
    } satisfies BuffDetailTarget,
  };
}

// 按段懒加载展示内容；滚动窗口变化时复用，项目数据换代时释放旧缓存。
const presentationCache = computed(() => ({
  segments: props.segments,
  entries: new WeakMap<PositionedDisplayBuffTimelineSegment, ComputedRef<BuffPresentation>>(),
}));

function presentationFor(segment: PositionedDisplayBuffTimelineSegment): BuffPresentation {
  const cache = presentationCache.value.entries;
  let presentation = cache.get(segment);
  if (presentation === undefined) {
    presentation = computed(() => buildPresentation(segment));
    cache.set(segment, presentation);
  }
  return presentation.value;
}

const visibleSegments = computed(() => {
  const visibleLeftPx = props.visibleLeftPx;
  const visibleRightPx = props.visibleRightPx;
  if (visibleLeftPx === undefined || visibleRightPx === undefined) return props.segments;
  return props.segments.filter(segment => {
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
    return right >= visibleLeftPx && left <= visibleRightPx;
  });
});

const items = computed(() =>
  visibleSegments.value.map(segment => {
    const presentation = presentationFor(segment);
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
    return {
      ...segment,
      ...presentation,
      ...colors.value.get(segment)!,
      key: `${segment.targetId}:${segment.buffId}:${segment.instanceId}:${segment.startFrame}:${segment.startSequence ?? ''}`,
      left: left + (props.hiddenIcons?.has(segment) ? iconSize.value : 0),
      hideIcon: props.hiddenIcons?.has(segment) ?? false,
      top:
        props.rowSize !== undefined
          ? 2 + segment.lane * (props.rowSize + 4)
          : props.placement === 'upper'
            ? timelineUpperBuffTop(segment.lane)
            : timelineLowerBuffTop(props.actionTop ?? ACTION_TOP_FALLBACK, segment.lane),
      width: Math.max(0, right - left - iconSize.value - BAR_GAP * 2),
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
      :icon-width="iconSize"
      :icon-height="iconSize"
      v-for="item in items"
      :key="item.key"
      :left="item.left"
      :top="item.top"
      :width="item.width"
      :title="item.tooltip"
      :icon="item.icon"
      fallback="+"
      :hide-icon="item.hideIcon"
      :duration-color="item.color"
      :end-color="item.endColor"
      :attachment="attachmentBuffIds.has(item.buffId)"
      :count="showBuffLayerBadge(item) ? item.layers : undefined"
      interactive
      @activate="emit('open-detail', item.detail)"
    >
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
</style>
