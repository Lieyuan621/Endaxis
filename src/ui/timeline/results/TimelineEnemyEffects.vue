<script setup lang="ts">
import TimelineDamageHit from './TimelineDamageHit.vue';
import TimelineStatusIcon from './TimelineStatusIcon.vue';
import TimelineEnemyEffectMarkers from './TimelineEnemyEffectMarkers.vue';
import TimelineStatusDuration from './TimelineStatusDuration.vue';
import { roundHitDamage } from './hitDamageDisplay';
import { resolveImage } from '../../imageResources';
import type { BuffDisplayName } from './buffDisplayName';
import {
  type OperatorPassiveUiTimelineSegment,
  type PositionedOperatorPassiveUiTimelineSegment,
} from '../../../core/projection/operatorPassiveUiTimelineViz';
type EntityHit = {
  castId: string;
  hitId: string;
  frame: number;
  entityInstanceId: number;
  title: string;
};
/**
 * 敌人效果面板：
 * 可见 Buff = 原生图标框 + 层数角标 + 45 度条纹时长条；爆发/反应消费 = 图标标记。
 * 坐标与资源曲线同一体系（准备区偏移 + 每帧像素 + 轨道头宽度，跟随时间轴滚动）。
 */
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useDurationBarColor } from './durationBarColorContext';
import { resolveDurationBarColor } from './durationBarColor';
import { useI18n } from 'vue-i18n';
import type { EnemyEffectViz } from '../../../core/projection/enemyEffectViz';
import type { PositionedDisplayBuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import type { EnemyCombatHudSnapshot as EnemyCombatHudSnapshotModel } from '../../../core/projection/combatHudSnapshot';
import EnemyCombatHudSnapshot from './EnemyCombatHudSnapshot.vue';
import { resolveBuffDisplayName } from './buffDisplayName';
import { resolveBuffEffectSummary, showBuffLayerBadge } from './buffDisplayName';
import type { BuffDetailTarget } from './buffDetail';
import { DEFAULT_GAME_ICON_PATH } from '../../gameAssetPaths';
import { frameToCondensedTimelinePx } from '../timelineGeometry';
import TimelineMonitorGrid from './TimelineMonitorGrid.vue';
import { summarizeLastHitBuffs } from './lastHitBuffSummary';
import { layoutEnemyStatusRows } from './enemyStatusRows';
import { layoutEnemyDamageHits } from './enemyDamageHitLayout';
import { findBuffDamageSegment } from './enemyBuffDamageHits';
import { isPhysicalStatusRowBuff } from './physicalStatusDisplay';
import { ENEMY_STATUS_CONTENT_TOP, enemyStatusRowSize } from './monitorSectionMinimums';
import { projectBuffTimelineColors } from './buffTimelineColors';
import TimelineAttachmentContinuation from './TimelineAttachmentContinuation.vue';

const { t, te } = useI18n();

const props = defineProps<{
  viz: EnemyEffectViz;
  entitySegments?: readonly OperatorPassiveUiTimelineSegment[];
  entityHits?: readonly EntityHit[];
  buffs: readonly PositionedDisplayBuffTimelineSegment[];
  attachmentBuffIds?: ReadonlySet<string>;
  timelineWidth: number;
  durationFrames: number;
  prepFrames: number;
  pxPerFrame: number;
  trackHeaderWidth: number;
  scrollLeft: number;
  prepEndFrame?: number;

  prepExpanded: boolean;
  labels: {
    burst: string;
  };
  snapshotFrame: number | null;
  hudSnapshot: EnemyCombatHudSnapshotModel;
  enemyName: string;
  targetName: (targetId: string) => string;
  enemyLevel: number;
  compact?: boolean;
  poiseKnotThresholds: readonly number[];
  hudLabels: {
    status: string;
    compactStatus: string;
    hp: string;
    poise: string;
    recovering: string;
    brokenEndWindow: string;
  };
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
const emit = defineEmits<{
  'open-damage-detail': [sequence: number];
  'open-entity-detail': [segment: PositionedOperatorPassiveUiTimelineSegment, title: string];
  'open-entity-hit': [hit: EntityHit];
  'open-buff-detail': [target: BuffDetailTarget];
}>();

const root = ref<HTMLElement | null>(null);
const height = ref(0);
let resizeObserver: ResizeObserver | undefined;
onMounted(() => {
  if (root.value === null) return;
  height.value = root.value.clientHeight;
  resizeObserver = new ResizeObserver(() => {
    height.value = root.value?.clientHeight ?? 0;
  });
  resizeObserver.observe(root.value);
});
onBeforeUnmount(() => resizeObserver?.disconnect());
const iconSize = computed(() =>
  enemyStatusRowSize(
    height.value - ICON_TOP,
    Math.max(
      statusRows.value.rowCount,
      ...entitySegments.value.map(segment => segment.lane + 1),
      ...damageHitPositions.value.map(position => position.row + 1),
    ),
  ),
);
const rowPitch = computed(() => iconSize.value + 4);
const durationBarColor = useDurationBarColor();
const ICON_TOP = ENEMY_STATUS_CONTENT_TOP;

function pointX(frame: number): number {
  return (
    frameToCondensedTimelinePx(
      frame,
      props.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    ) - props.scrollLeft
  );
}

const width = computed(() => Math.max(1, props.trackHeaderWidth + props.timelineWidth));

/** 爆发/反应标记：小图标框，hover 显示说明。 */
const statusRows = computed(() =>
  layoutEnemyStatusRows(
    props.buffs,
    props.viz.markers,
    props.attachmentBuffIds ?? new Set(),
    props.entitySegments,
  ),
);
// 独立的能力实体仍保留实体身份，仅借用敌人状态区的布局与缩放。
const entitySegments = computed(() =>
  (props.entitySegments ?? [])
    .filter(segment => segment.kind === 'abilityEntityCount')
    .map(segment => ({ ...segment, lane: statusRows.value.entityLanes.get(segment)! })),
);
const entityDamageHits = computed(() => {
  const counts = new Map<string, number>();
  return (props.entityHits ?? []).flatMap(hit => {
    const segment = entitySegments.value.find(
      segment =>
        segment.startFrame <= hit.frame &&
        segment.endFrame >= hit.frame &&
        segment.entities.some(entity => entity.instanceId === hit.entityInstanceId),
    );
    if (!segment) return [];
    const key = `${segment.lane}:${hit.frame}`;
    const index = counts.get(key) ?? 0;
    counts.set(key, index + 1);
    return [
      {
        ...hit,
        top: ICON_TOP + segment.lane * rowPitch.value + iconSize.value - 3 + index * 7,
      },
    ];
  });
});
function entityTop(lane: number) {
  return ICON_TOP + lane * rowPitch.value;
}
const damageHitPositions = computed(() =>
  layoutEnemyDamageHits(
    props.viz.damageHits ?? [],
    props.buffs,
    props.viz.markers,
    props.attachmentBuffIds ?? new Set(),
    props.viz.damageBuffs,
    props.viz.damageDisplayOwners,
    props.entitySegments,
  ),
);
const damageHits = computed(() =>
  damageHitPositions.value.map(({ group, row, standalone }) => {
    const entry = group[0]!;
    const buff = findBuffDamageSegment(entry, props.viz.damageBuffs ?? []);
    return {
      sequence: entry.sequence,
      standaloneIcon: standalone
        ? ((buff && props.icon?.(buff)) ?? resolveImage(buff?.icon) ?? DEFAULT_GAME_ICON_PATH)
        : undefined,
      x: pointX(entry.frame),
      top:
        ICON_TOP +
        // 与附着行共用布局；伤害不参与图标横向错位。
        row * rowPitch.value +
        iconSize.value -
        3,
      title:
        (standalone && typeof entry.data?.buffId === 'string'
          ? `${resolveBuffDisplayName(entry.data.buffId, { t, te })}: `
          : '') +
        group
          .map(
            hit =>
              `${hit.targetId === undefined ? '' : props.targetName(hit.targetId) + ': '}${roundHitDamage(Number(hit.data?.expectedDamage ?? hit.data?.value ?? 0))}`,
          )
          .join('\n'),
    };
  }),
);

const buffColors = computed(() =>
  projectBuffTimelineColors(
    props.buffs,
    props.viz.attachmentConversions ?? [],
    durationBarColor.value,
    'enemy',
  ),
);
const buffs = computed(() =>
  props.buffs.map(buff => {
    const start = pointX(buff.startFrame);
    const right = pointX(buff.durationEndFrame ?? buff.endFrame);
    const hideIcon = statusRows.value.hiddenIcons.has(buff);
    const sourceName = props.sourceName?.(buff);
    const modifierSummary = resolveBuffEffectSummary(buff, { t, te });
    const baseTitle =
      props.displayName?.(buff) ??
      resolveBuffDisplayName(
        buff.buffId,
        { t, te },
        undefined,
        sourceName,
        props.operatorBuffNameKeys,
      );
    const title = buff.windows.some(member => member.buffId !== buff.buffId)
      ? [
          ...new Set(buff.windows.map(member => resolveBuffDisplayName(member.buffId, { t, te }))),
        ].join(' / ')
      : baseTitle;
    const icon =
      (isPhysicalStatusRowBuff(buff) ? resolveImage(buff.icon) : props.icon?.(buff)) ??
      resolveImage(buff.icon) ??
      resolveImage(buff.icon);
    return {
      ...buff,
      isAttachment: props.attachmentBuffIds?.has(buff.buffId) ?? false,
      ...buffColors.value.get(buff)!,
      key: `${buff.buffId}:${buff.instanceId}:${buff.startFrame}:${buff.startSequence ?? ''}`,
      icon,
      hideIcon,
      left: start + (hideIcon ? iconSize.value : 0),
      iconOffset: (statusRows.value.iconSlots.get(buff) ?? 0) * (iconSize.value + 2),
      top: ICON_TOP + (statusRows.value.lanes.get(buff) ?? 0) * rowPitch.value,
      barWidthPx: Math.max(0, right - start - iconSize.value - 2),
      title,
      tooltip: modifierSummary ? `${title}\n${modifierSummary}` : title,
      detail: {
        title,
        buffId: buff.buffId,
        targetId: buff.targetId,
        instanceId: buff.instanceId,
        startSequence: buff.startSequence,
        ...(sourceName === undefined ? {} : { sourceName }),
        startFrame: buff.startFrame,
        endFrame: buff.endFrame,
        enabled: buff.enabled,
        enhanceCount: buff.enhanceCount,
        displayCount: buff.displayCount,
        layers: buff.layers,
        ...(buff.startReason === undefined ? {} : { startReason: buff.startReason }),
        ...(buff.endReason === undefined ? {} : { endReason: buff.endReason }),
        ...(buff.stackingType === undefined ? {} : { stackingType: buff.stackingType }),
        ...(buff.parentBuffId === undefined ? {} : { parentBuffId: buff.parentBuffId }),
        icon,
        ...(modifierSummary === undefined ? {} : { modifierSummary }),
        instances: buff.windows.map(member => {
          const memberSourceName = props.sourceName?.(member);
          const memberModifierSummary = resolveBuffEffectSummary(member, { t, te });
          return {
            buffId: member.buffId,
            title:
              props.displayName?.(member) ??
              resolveBuffDisplayName(
                member.buffId,
                { t, te },
                undefined,
                memberSourceName,
                props.operatorBuffNameKeys,
              ),
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
            icon:
              (isPhysicalStatusRowBuff(member)
                ? resolveImage(member.icon)
                : props.icon?.(member)) ??
              resolveImage(member.icon) ??
              resolveImage(member.icon),
            ...(memberModifierSummary === undefined
              ? {}
              : { modifierSummary: memberModifierSummary }),
          };
        }),
      } satisfies BuffDetailTarget,
    };
  }),
);

const lastHitSummary = computed(() => summarizeLastHitBuffs(buffs.value, props.snapshotFrame));
const visibleLastHitBuffs = computed(() => lastHitSummary.value.buffs);
const lastHitBuffOverflow = computed(() => lastHitSummary.value.overflow);
const contentHeight = computed(() =>
  Math.max(
    ICON_TOP + statusRows.value.rowCount * rowPitch.value,
    ...entitySegments.value.map(segment => ICON_TOP + (segment.lane + 1) * rowPitch.value),
    ...damageHits.value.map(hit => hit.top + 12),
    ...entityDamageHits.value.map(hit => hit.top + 12),
  ),
);
function scrollEffects(event: WheelEvent) {
  const viewport = event.currentTarget;
  if (!(viewport instanceof HTMLElement)) return;
  if (
    !event.ctrlKey &&
    !event.metaKey &&
    Math.abs(event.deltaY) > Math.abs(event.deltaX) &&
    viewport.scrollHeight > viewport.clientHeight
  )
    event.stopPropagation();
}
</script>

<template>
  <div ref="root" class="enemy-effects" :style="{ '--aff-icon-size': `${iconSize}px` }">
    <TimelineMonitorGrid
      :width="width"
      :duration-frames="durationFrames"
      :prep-frames="prepFrames"
      :prep-end-frame="prepEndFrame"
      :prep-expanded="prepExpanded"
      :px-per-frame="pxPerFrame"
      :track-header-width="trackHeaderWidth"
      :scroll-left="scrollLeft"
    />
    <EnemyCombatHudSnapshot
      class="enemy-hud"
      :snapshot="hudSnapshot"
      :name="enemyName"
      :level="enemyLevel"
      :compact="compact"
      :show-poise="false"
      :poise-knot-thresholds="poiseKnotThresholds"
      :labels="hudLabels"
    >
      <span v-if="visibleLastHitBuffs.length > 0" class="last-hit-buffs">
        <TimelineStatusIcon
          as="button"
          :size="18"
          v-for="buff in visibleLastHitBuffs"
          :key="buff.buffId"
          :src="buff.icon"
          fallback="+"
          :count="showBuffLayerBadge(buff) ? Math.max(1, buff.layers) : undefined"
          type="button"
          class="anomaly-icon-box last-hit-buff"
          :title="buff.tooltip"
          @click.stop="emit('open-buff-detail', buff.detail)"
        >
        </TimelineStatusIcon>
        <strong v-if="lastHitBuffOverflow > 0" class="last-hit-buff-more">
          +{{ lastHitBuffOverflow }}
        </strong>
      </span>
    </EnemyCombatHudSnapshot>
    <div
      class="enemy-effects-viewport"
      :style="{ left: trackHeaderWidth + 'px' }"
      @wheel="scrollEffects"
    >
      <div class="enemy-timed-effects" :style="{ height: contentHeight + 'px' }">
        <TimelineDamageHit
          v-for="hit in damageHits"
          :key="`damage:${hit.sequence}`"
          :x="hit.x"
          :y="hit.top"
          :title="hit.title"
          :icon="hit.standaloneIcon"
          @activate="emit('open-damage-detail', hit.sequence)"
        />
        <TimelineEnemyEffectMarkers
          :markers="viz.markers"
          :positions="statusRows.markerPositions"
          :icon-size="iconSize"
          :top="ICON_TOP"
          :frame-px="pointX"
          :burst-label="labels.burst"
        />
        <div
          v-for="segment in entitySegments"
          :key="`${segment.operatorId}:${segment.abilityEntityId}:${segment.startFrame}:${segment.entities.map(entity => entity.instanceId).join(',')}`"
          class="attachment-item"
          :style="{ left: `${pointX(segment.startFrame)}px`, top: `${entityTop(segment.lane)}px` }"
          :title="t(segment.nameKey)"
        >
          <TimelineStatusIcon
            :size="iconSize"
            class="anomaly-icon-box is-clickable"
            :count="segment.entities.length > 1 ? segment.entities.length : undefined"
            :src="resolveImage(segment.icon)"
            role="button"
            tabindex="0"
            @click.stop="emit('open-entity-detail', segment, t(segment.nameKey))"
            @keydown.enter.stop.prevent="emit('open-entity-detail', segment, t(segment.nameKey))"
            @keydown.space.stop.prevent="emit('open-entity-detail', segment, t(segment.nameKey))"
          ></TimelineStatusIcon>
          <TimelineStatusDuration
            class="anomaly-duration-bar generic-buff-bar"
            :style="{
              backgroundColor: resolveDurationBarColor(durationBarColor, 'enemy', {
                buffId: segment.abilityEntityId,
              }),
              width: `${Math.max(0, pointX(segment.endFrame) - pointX(segment.startFrame) - iconSize - 2)}px`,
            }"
          ></TimelineStatusDuration>
        </div>
        <TimelineDamageHit
          v-for="hit in entityDamageHits"
          :key="`${hit.castId}:${hit.hitId}:${hit.frame}`"
          :x="pointX(hit.frame)"
          :y="hit.top"
          :title="hit.title"
          @activate="emit('open-entity-hit', hit)"
        />
        <div
          v-for="buff in buffs"
          :key="buff.key"
          class="attachment-item"
          :style="{ left: `${buff.left}px`, top: `${buff.top}px` }"
          :title="buff.tooltip"
        >
          <TimelineStatusIcon
            :size="iconSize"
            v-if="!buff.hideIcon"
            :src="buff.icon"
            fallback="+"
            :count="showBuffLayerBadge(buff) ? buff.layers : undefined"
            class="anomaly-icon-box is-clickable"
            :style="{ transform: `translateX(${buff.iconOffset}px)` }"
            role="button"
            tabindex="0"
            @click.stop="emit('open-buff-detail', buff.detail)"
            @keydown.enter.stop.prevent="emit('open-buff-detail', buff.detail)"
            @keydown.space.stop.prevent="emit('open-buff-detail', buff.detail)"
          ></TimelineStatusIcon>
          <TimelineAttachmentContinuation
            v-if="buff.isAttachment && buff.barWidthPx > 0"
            :width="buff.barWidthPx + 2"
            :height="iconSize"
            :color="buff.color"
            :end-color="buff.endColor"
          />
          <TimelineStatusDuration
            v-else-if="buff.barWidthPx > 0"
            class="anomaly-duration-bar generic-buff-bar"
            :style="{
              width: `${buff.barWidthPx}px`,
              ...(buff.color === undefined ? {} : { backgroundColor: buff.color }),
            }"
          >
          </TimelineStatusDuration>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.enemy-effects-viewport {
  position: absolute;
  inset: 0 0 0 auto;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
}
.enemy-timed-effects {
  position: relative;
  min-height: 100%;
}
</style>

<style scoped>
.enemy-effects {
  position: relative;
  width: 100%;
  min-width: 1px;
  height: 100%;
  overflow: clip;
  color: var(--ea-fg);
  background: var(--ea-workbench-main, #18181c);
}

.enemy-hud {
  position: absolute;
  z-index: 30;
  inset: 0 auto auto 0;
}

.last-hit-buffs {
  margin-top: 2px;
  min-height: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.anomaly-icon-box.last-hit-buff {
  appearance: none;
  flex: 0 0 18px;
  padding: 0;
}

.last-hit-buff-more {
  color: var(--ea-fg-muted, rgb(255 255 255 / 55%));
  font:
    700 10px/1 'Roboto Mono',
    monospace;
}

.attachment-item {
  position: absolute;
  display: flex;
  align-items: center;
}
</style>
