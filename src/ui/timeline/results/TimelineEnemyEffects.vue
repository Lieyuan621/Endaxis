<script setup lang="ts">
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
 * 敌人效果面板（对齐旧版 ResourceMonitor 的敌人状态区样式）：
 * 可见 Buff = 原生图标框 + 层数角标 + 45 度条纹时长条；爆发/反应消费 = 图标标记。
 * 坐标与资源曲线同一体系（准备区偏移 + 每帧像素 + 轨道头宽度，跟随时间轴滚动）。
 */
import { computed, onMounted, onBeforeUnmount, ref, useId } from 'vue';
import { elementalAttachments } from '../../../data/buffs/elementalAttachments';
import { useDurationBarColor } from './durationBarColorContext';
import { resolveDurationBarColor } from './durationBarColor';
import { useI18n } from 'vue-i18n';
import type { EnemyEffectViz } from '../../../core/projection/enemyEffectViz';
import type { PositionedDisplayBuffTimelineSegment } from '../../../core/projection/buffTimelineViz';
import type { EnemyCombatHudSnapshot as EnemyCombatHudSnapshotModel } from '../../../core/projection/combatHudSnapshot';
import EnemyCombatHudSnapshot from './EnemyCombatHudSnapshot.vue';
import { resolveBuffDisplayName } from './buffDisplayName';
import { commonBuffPresentationNameKeys } from '../../../data/buffs/generated/commonBuffPresentationNames.generated';
import { resolveBuffEffectSummary, showBuffLayerBadge } from './buffDisplayName';
import type { BuffDetailTarget } from './buffDetail';
import {
  DEFAULT_GAME_ICON_PATH,
  getElementalReactionIconPath,
  getIconAssetPath,
  getSpellBurstIconPath,
} from '../../gameAssetPaths';
import { frameToCondensedTimelinePx } from '../timelineGeometry';
import TimelineMonitorGrid from './TimelineMonitorGrid.vue';
import { summarizeLastHitBuffs } from './lastHitBuffSummary';
import { layoutEnemyStatusRows } from './enemyStatusRows';
import { layoutEnemyDamageHits } from './enemyDamageHitLayout';
import { findBuffDamageSegment } from './enemyBuffDamageHits';
import { isPhysicalStatusRowBuff } from './physicalStatusDisplay';
import {
  enemyStatusRowSize,
  MONITOR_SECTION_TOPBAR_HEIGHT as SECTION_TOPBAR_HEIGHT,
} from './monitorSectionMinimums';
import { projectAttachmentConversionLinks } from '../../../core/projection/attachmentContinuations';
import TimelineConnectorStroke from '../components/TimelineConnectorStroke.vue';

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
    reaction: string;
    reactionConsumed: string;
  };
  snapshotFrame: number | null;
  hudSnapshot: EnemyCombatHudSnapshotModel;
  enemyName: string;
  enemyLevel: number;
  poiseKnotThresholds: readonly number[];
  hudLabels: {
    status: string;
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
    height.value - SECTION_TOPBAR_HEIGHT,
    Math.max(statusRows.value.rowCount, ...entitySegments.value.map(segment => segment.lane + 1)),
  ),
);
const rowPitch = computed(() => iconSize.value + 4);
const durationBarColor = useDurationBarColor();
const ICON_TOP = 0;

const REACTION_BUFF_IDS: Readonly<Record<string, keyof typeof commonBuffPresentationNameKeys>> = {
  electrification: 'buff_common_pulse_pulse_conduct_triggered_do',
  corrosion: 'buff_common_natural_natural_corrupt_do',
};

function configuredNameKey(
  buffId: keyof typeof commonBuffPresentationNameKeys | undefined,
): string | undefined {
  return buffId === undefined ? undefined : commonBuffPresentationNameKeys[buffId];
}

function effectName(nameKey: string | undefined, fallback: string): string {
  const key = nameKey === undefined ? '' : `effects.name.${nameKey}`;
  return key !== '' && te(key) ? t(key) : fallback;
}

function spellBurstTitle(burstType: string | undefined): string {
  if (burstType === undefined) return props.labels.burst;
  const key = `timeline.skillEditing.spellBurstTypes.${burstType}`;
  return te(key) ? t(key) : `${props.labels.burst} ${burstType}`;
}

function pointX(frame: number): number {
  return (
    props.trackHeaderWidth +
    frameToCondensedTimelinePx(
      frame,
      props.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    ) -
    props.scrollLeft
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
        top: SECTION_TOPBAR_HEIGHT + segment.lane * rowPitch.value + iconSize.value - 3 + index * 7,
      },
    ];
  });
});
function entityTop(lane: number) {
  return SECTION_TOPBAR_HEIGHT + lane * rowPitch.value;
}
const markers = computed(() =>
  props.viz.markers.map((marker, index) => {
    const attachment =
      marker.kind === 'attachmentTrigger'
        ? elementalAttachments.buffs.find(
            buff =>
              buff.role?.kind === 'elementalAttachment' && buff.role.element === marker.element,
          )
        : undefined;
    const icon =
      marker.kind === 'attachmentTrigger'
        ? (attachment?.presentation?.iconPath ??
          getIconAssetPath(attachment?.presentation?.iconId) ??
          DEFAULT_GAME_ICON_PATH)
        : marker.kind === 'burst'
          ? (getSpellBurstIconPath(marker.burstType) ?? DEFAULT_GAME_ICON_PATH)
          : (getElementalReactionIconPath(marker.reaction) ?? DEFAULT_GAME_ICON_PATH);
    const title =
      marker.kind === 'attachmentTrigger'
        ? resolveBuffDisplayName(attachment?.id ?? marker.element ?? '', { t, te })
        : marker.kind === 'burst'
          ? spellBurstTitle(marker.burstType)
          : `${props.labels.reactionConsumed} ${effectName(configuredNameKey(REACTION_BUFF_IDS[marker.reaction ?? '']), marker.reaction ?? '')}`;
    return {
      key: `${index}:${marker.kind}:${marker.frame}:${marker.reaction ?? marker.burstType ?? ''}`,
      icon,
      // Legacy markers also carry a badge. For an instantaneous input/burst this
      // denotes one occurrence, not a newly created persistent attachment layer.
      badge: marker.kind === 'reactionConsumed' ? marker.level : 1,
      x:
        pointX(marker.frame) +
        (statusRows.value.markerPositions[index]?.slot ?? 0) * (iconSize.value + 2),
      top:
        SECTION_TOPBAR_HEIGHT +
        ICON_TOP +
        (statusRows.value.markerPositions[index]?.row ?? 0) * rowPitch.value,
      title,
    };
  }),
);

const damageHits = computed(() =>
  layoutEnemyDamageHits(
    props.viz.damageHits ?? [],
    props.buffs,
    props.viz.markers,
    props.attachmentBuffIds ?? new Set(),
    props.viz.damageBuffs,
    props.viz.damageDisplayOwners,
    props.entitySegments,
  ).map(({ group, row, standalone }) => {
    const entry = group[0]!;
    const buff = findBuffDamageSegment(entry, props.viz.damageBuffs ?? []);
    return {
      sequence: entry.sequence,
      standaloneIcon: standalone
        ? ((buff && props.icon?.(buff)) ??
          buff?.iconPath ??
          getIconAssetPath(buff?.iconId) ??
          DEFAULT_GAME_ICON_PATH)
        : undefined,
      x: pointX(entry.frame),
      top:
        SECTION_TOPBAR_HEIGHT +
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
          .map(hit => String(Math.floor(Number(hit.data?.expectedDamage ?? hit.data?.value ?? 0))))
          .join(' / '),
    };
  }),
);

const conversionGradientPrefix = useId();
const attachmentConversions = computed(() =>
  projectAttachmentConversionLinks(props.buffs, props.viz.attachmentConversions ?? []),
);
const buffs = computed(() =>
  props.buffs.map((buff, index) => {
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
      (isPhysicalStatusRowBuff(buff) ? buff.iconPath : props.icon?.(buff)) ??
      buff.iconPath ??
      getIconAssetPath(buff.iconId);
    return {
      ...buff,
      isAttachment: props.attachmentBuffIds?.has(buff.buffId) ?? false,
      gradientId: `${conversionGradientPrefix}-${index}`,
      endColor: resolveDurationBarColor(
        durationBarColor.value,
        'enemy',
        attachmentConversions.value.get(buff) ?? buff,
      ),
      key: `${buff.buffId}:${buff.instanceId}:${buff.startFrame}:${buff.startSequence ?? ''}`,
      icon,
      hideIcon,
      left: start + (hideIcon ? iconSize.value : 0),
      iconOffset: (statusRows.value.iconSlots.get(buff) ?? 0) * (iconSize.value + 2),
      top:
        SECTION_TOPBAR_HEIGHT + ICON_TOP + (statusRows.value.lanes.get(buff) ?? 0) * rowPitch.value,
      barWidthPx: Math.max(0, right - start - iconSize.value - 2),
      color: resolveDurationBarColor(durationBarColor.value, 'enemy', buff),
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
              (isPhysicalStatusRowBuff(member) ? member.iconPath : props.icon?.(member)) ??
              member.iconPath ??
              getIconAssetPath(member.iconId),
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
      :show-poise="false"
      :poise-knot-thresholds="poiseKnotThresholds"
      :labels="hudLabels"
    >
      <span v-if="visibleLastHitBuffs.length > 0" class="last-hit-buffs">
        <button
          v-for="buff in visibleLastHitBuffs"
          :key="buff.buffId"
          type="button"
          class="anomaly-icon-box last-hit-buff"
          :title="buff.tooltip"
          @click.stop="emit('open-buff-detail', buff.detail)"
        >
          <img v-if="buff.icon" :src="buff.icon" class="anomaly-icon" alt="" />
          <span v-else class="buff-fallback">+</span>
          <span v-if="showBuffLayerBadge(buff)" class="anomaly-stacks">{{
            Math.max(1, buff.layers)
          }}</span>
        </button>
        <strong v-if="lastHitBuffOverflow > 0" class="last-hit-buff-more">
          +{{ lastHitBuffOverflow }}
        </strong>
      </span>
    </EnemyCombatHudSnapshot>
    <div class="enemy-timed-effects">
      <button
        type="button"
        v-for="hit in damageHits"
        :key="`damage:${hit.sequence}`"
        class="enemy-damage-hit"
        :style="{ left: `${hit.x}px`, top: `${hit.top}px` }"
        :title="hit.title"
        :aria-label="`${hit.title}`"
        @mousedown.stop="emit('open-damage-detail', hit.sequence)"
        @keydown.enter.stop.prevent="emit('open-damage-detail', hit.sequence)"
        @keydown.space.stop.prevent="emit('open-damage-detail', hit.sequence)"
      >
        <img
          v-if="hit.standaloneIcon"
          :src="hit.standaloneIcon"
          class="standalone-damage-icon"
          alt=""
        />
        <span class="enemy-damage-diamond"></span>
      </button>
      <span
        v-for="marker in markers"
        :key="marker.key"
        class="anomaly-icon-box effect-marker"
        :style="{ left: `${marker.x}px`, top: `${marker.top}px` }"
        :title="marker.title"
      >
        <img :src="marker.icon" class="anomaly-icon" alt="" />
        <span v-if="marker.badge !== undefined" class="anomaly-stacks">{{ marker.badge }}</span>
      </span>
      <div
        v-for="segment in entitySegments"
        :key="`${segment.operatorId}:${segment.abilityEntityId}:${segment.startFrame}:${segment.entities.map(entity => entity.instanceId).join(',')}`"
        class="attachment-item"
        :style="{ left: `${pointX(segment.startFrame)}px`, top: `${entityTop(segment.lane)}px` }"
        :title="t(segment.nameKey)"
      >
        <span
          class="anomaly-icon-box is-clickable"
          role="button"
          tabindex="0"
          @click.stop="emit('open-entity-detail', segment, t(segment.nameKey))"
          @keydown.enter.stop.prevent="emit('open-entity-detail', segment, t(segment.nameKey))"
          @keydown.space.stop.prevent="emit('open-entity-detail', segment, t(segment.nameKey))"
        >
          <img :src="segment.icon" class="anomaly-icon" alt="" />
          <span v-if="segment.entities.length > 1" class="anomaly-stacks">{{
            segment.entities.length
          }}</span>
        </span>
        <span
          class="anomaly-duration-bar generic-buff-bar"
          :style="{
            backgroundColor: resolveDurationBarColor(durationBarColor, 'enemy', {
              buffId: segment.abilityEntityId,
            }),
            width: `${Math.max(0, pointX(segment.endFrame) - pointX(segment.startFrame) - iconSize - 2)}px`,
          }"
          ><span class="striped-bg"
        /></span>
      </div>
      <button
        v-for="hit in entityDamageHits"
        :key="`${hit.castId}:${hit.hitId}:${hit.frame}`"
        class="enemy-damage-hit"
        :style="{ left: `${pointX(hit.frame)}px`, top: `${hit.top}px` }"
        :title="hit.title"
        @click.stop="emit('open-entity-hit', hit)"
      >
        <span class="enemy-damage-diamond" />
      </button>
      <div
        v-for="buff in buffs"
        :key="buff.key"
        class="attachment-item"
        :style="{ left: `${buff.left}px`, top: `${buff.top}px` }"
        :title="buff.tooltip"
      >
        <span
          v-if="!buff.hideIcon"
          class="anomaly-icon-box is-clickable"
          :style="{ transform: `translateX(${buff.iconOffset}px)` }"
          role="button"
          tabindex="0"
          @click.stop="emit('open-buff-detail', buff.detail)"
          @keydown.enter.stop.prevent="emit('open-buff-detail', buff.detail)"
          @keydown.space.stop.prevent="emit('open-buff-detail', buff.detail)"
        >
          <img v-if="buff.icon" :src="buff.icon" class="anomaly-icon" alt="" />
          <span v-else class="buff-fallback">+</span>
          <span v-if="showBuffLayerBadge(buff)" class="anomaly-stacks">{{ buff.layers }}</span>
        </span>
        <svg
          v-if="buff.isAttachment && buff.barWidthPx > 0"
          class="attachment-continuation"
          :width="buff.barWidthPx + 2"
          :height="iconSize"
          :style="{ color: buff.color ?? 'var(--ea-fg-muted)' }"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              :id="buff.gradientId"
              gradientUnits="userSpaceOnUse"
              x1="0"
              :y1="iconSize / 2"
              :x2="buff.barWidthPx + 2"
              :y2="iconSize / 2"
            >
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.8" />
              <stop
                offset="100%"
                :stop-color="buff.endColor ?? buff.color ?? 'currentColor'"
                stop-opacity="1"
              />
            </linearGradient>
          </defs>
          <TimelineConnectorStroke
            :path="`M 0 ${iconSize / 2} H ${buff.barWidthPx + 2}`"
            :stroke="`url(#${buff.gradientId})`"
            :start-color="buff.color"
            :end-color="buff.endColor"
            particle
          />
        </svg>
        <span
          v-else-if="buff.barWidthPx > 0"
          class="anomaly-duration-bar generic-buff-bar"
          :style="{
            width: `${buff.barWidthPx}px`,
            ...(buff.color === undefined ? {} : { backgroundColor: buff.color }),
          }"
        >
          <span class="striped-bg"></span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.enemy-timed-effects {
  position: absolute;
  inset: 0;
}

.enemy-damage-hit {
  appearance: none;
  position: absolute;
  z-index: 15;
  width: 12px;
  height: 12px;
  padding: 3px;
  margin: -3px;
  border: 0;
  background: transparent;
  cursor: pointer;
}
.enemy-damage-diamond {
  display: block;
  width: 6px;
  height: 6px;
  background: #fff;
  border: 1px solid #666;
  box-sizing: border-box;
  transform: rotate(45deg);
  pointer-events: none;
  transition:
    background-color 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    border-color 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    box-shadow 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.standalone-damage-icon {
  position: absolute;
  width: var(--aff-icon-size, 20px);
  height: var(--aff-icon-size, 20px);
  left: 3px;
  bottom: 6px;
  object-fit: contain;
  background: var(--ea-workbench-panel);
  border: 1px solid var(--ea-border, #666);
}
.enemy-damage-hit:focus-visible {
  outline: none;
}
.enemy-damage-hit:focus-visible .enemy-damage-diamond {
  box-shadow: var(--ea-focus-ring);
}
@media (hover: hover) and (pointer: fine) {
  .enemy-damage-hit:hover .enemy-damage-diamond {
    background: var(--ea-gold);
    border-color: #fff;
    box-shadow: 0 0 4px color-mix(in srgb, var(--ea-gold) 80%, transparent);
    transform: rotate(45deg) scale(1.3);
  }
}
</style>

<style scoped>
.attachment-continuation {
  position: relative;
  z-index: 1;
  overflow: visible;
  pointer-events: none;
  flex-shrink: 0;
}
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
  width: 18px;
  height: 18px;
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

.anomaly-icon-box {
  position: relative;
  z-index: 10;
  width: var(--aff-icon-size, 20px);
  height: var(--aff-icon-size, 20px);
  flex-shrink: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--ea-keycap-skill-bg, #333);
  border: 1px solid var(--ea-keycap-skill-border, #999);
  cursor: default;
  transition:
    filter 0.12s ease,
    border-color 0.12s ease,
    box-shadow 0.12s ease;
}

.anomaly-icon-box.is-clickable {
  cursor: pointer;
}
.anomaly-icon-box:focus-visible {
  outline: none;
  box-shadow: var(--ea-focus-ring);
}

.anomaly-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: filter 0.12s ease;
}

.buff-fallback {
  color: #eef6ff;
  font-size: 10px;
  font-weight: 700;
}

.anomaly-stacks {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: rgb(0 0 0 / 80%);
  color: var(--ea-gold);
  font-size: 8px;
  line-height: 1;
  padding: 0 2px;
  border-radius: 2px;
}

.anomaly-duration-bar {
  position: relative;
  z-index: 1;
  height: 16px;
  margin-left: 2px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  overflow: visible;
  border: none;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgb(0 0 0 / 50%);
  pointer-events: auto;
  transition:
    filter 0.12s ease,
    box-shadow 0.12s ease;
}

.generic-buff-bar {
  background: color-mix(in srgb, var(--ea-fg) 30%, var(--ea-workbench-main));
}
@media (hover: hover) and (pointer: fine) {
  .anomaly-icon-box:hover {
    filter: brightness(1.18);
    border-color: rgb(255 255 255 / 95%);
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 22%),
      0 4px 12px rgb(0 0 0 / 46%);
  }
  .anomaly-icon-box:hover .anomaly-icon {
    filter: brightness(1.12) saturate(1.08);
  }
  .anomaly-duration-bar:hover {
    filter: brightness(1.16) saturate(1.08);
    box-shadow:
      0 0 0 1px rgb(255 255 255 / 18%),
      0 2px 8px rgb(0 0 0 / 50%);
  }
}

.striped-bg {
  position: absolute;
  inset: 0;
  border-radius: 2px;
  background: repeating-linear-gradient(
    45deg,
    rgb(255 255 255 / 20%),
    rgb(255 255 255 / 20%) 2px,
    transparent 2px,
    transparent 6px
  );
}

.effect-marker {
  position: absolute;
  z-index: 10;
}
</style>
