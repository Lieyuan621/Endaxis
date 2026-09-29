<script setup lang="ts">
/**
 * 把已保存的连线画到时间轴上。
 *
 * 只负责技能块连线的投影和交互事件，文档修改由编辑器统一提交。
 * 位置采用技能块实际开始帧和显示时长，与块边缘保持对齐。
 */
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  ConnectionDocument,
  ConnectionEndpoint,
  ScenarioDocument,
} from '../../../core/project/schema';
import type { TimelineConnectionPort } from './timelineConnections';
import type { TimelineTrackViewModel } from '../timelineEditorViewModel';
import { frameToTimelinePx } from '../timelineGeometry';
import type { TimelineTrackEffectLayout } from '../results/timelineTrackEffectLayout';
import TimelineConnectorStroke from '../components/TimelineConnectorStroke.vue';

interface Point {
  readonly x: number;
  readonly y: number;
}

interface ResolvedEndpoint {
  readonly point: Point;
  readonly port: TimelineConnectionPort;
}

interface ConnectionPreview {
  readonly skillCastId: string;
  readonly port: TimelineConnectionPort;
  readonly pointer: Point;
}

const props = withDefaults(
  defineProps<{
    scenario: ScenarioDocument;
    /** 已投影的时间轴轨道视图模型，提供技能块宽度与颜色。 */
    tracks: readonly TimelineTrackViewModel[];
    pxPerFrame: number;
    trackHeaderWidth: number;
    castActualStartFrames: ReadonlyMap<string, number>;
    castActualDurationFrames: ReadonlyMap<string, number>;
    selectedConnectionId?: string | null;
    hoveredSkillCastId?: string | null;
    draggingConnection?: boolean;
    /** 隐藏某干员效果时，其连接线也不参与投影。 */
    visibleTrackIndices?: readonly number[];
    rulerHeight: number;
    trackLayouts: readonly TimelineTrackEffectLayout[];
    actionHeight?: number;
    preview?: ConnectionPreview | null;
    prepEndFrame?: number;

    prepExpanded: boolean;
  }>(),
  {
    actionHeight: 50,
    preview: null,
    visibleTrackIndices: () => [0, 1, 2, 3],
  },
);

const emit = defineEmits<{
  select: [connectionId: string];
  contextmenu: [event: MouseEvent, connectionId: string];
  retarget: [event: PointerEvent, connectionId: string];
}>();
const { t } = useI18n({ useScope: 'global' });

const skillColors: Record<string, string> = {
  basicAttack: '#a5a5a8',
  battleSkill: '#ff5a5f',
  comboSkill: '#facc15',
  ultimate: '#22c55e',
};

function skillColor(skillCastId: string): string {
  const found = findSkillCast(skillCastId);
  if (found === null) return '#ccc';
  return found.skillCast.color ?? skillColors[found.skillCast.operationType ?? ''] ?? '#ccc';
}

const ports: Record<TimelineConnectionPort, { x: number; y: number }> = {
  top: { x: 0.5, y: 0 },
  right: { x: 1, y: 0.5 },
  bottom: { x: 0.5, y: 1 },
  left: { x: 0, y: 0.5 },
  'top-left': { x: 0, y: 0 },
  'top-right': { x: 1, y: 0 },
  'bottom-left': { x: 0, y: 1 },
  'bottom-right': { x: 1, y: 1 },
};

const directions: Record<TimelineConnectionPort, Point> = {
  top: { x: 0, y: -1 },
  right: { x: 1, y: 0 },
  bottom: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  'top-left': { x: -1, y: -1 },
  'top-right': { x: 1, y: -1 },
  'bottom-left': { x: -1, y: 1 },
  'bottom-right': { x: 1, y: 1 },
};

function actionTop(trackIndex: number): number {
  return (
    props.rulerHeight +
    props.trackLayouts.slice(0, trackIndex).reduce((sum, layout) => sum + layout.height, 0) +
    props.trackLayouts[trackIndex]!.actionTop
  );
}

/** 在视图模型中按技能块 id 定位轨道与技能块；找不到返回 null。 */
function findSkillCast(skillCastId: string) {
  for (const [trackIndex, trackModel] of props.tracks.entries()) {
    if (!props.visibleTrackIndices.includes(trackIndex)) continue;
    const skillCast = trackModel.skillCasts.find(candidate => candidate.id === skillCastId);
    if (skillCast !== undefined) return { skillCast, trackIndex };
  }
  return null;
}

function resolveEndpoint(
  endpoint: ConnectionEndpoint,
  fallbackPort: TimelineConnectionPort,
): ResolvedEndpoint | null {
  const found = findSkillCast(endpoint.skillCastId);
  if (found === null) return null;
  const port =
    endpoint.port !== undefined && endpoint.port in ports
      ? (endpoint.port as TimelineConnectionPort)
      : fallbackPort;
  const left =
    props.trackHeaderWidth +
    frameToTimelinePx(
      resolveCastActualStartFrame(found.skillCast.id, found.skillCast.startFrame),
      props.scenario.battle.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    );
  const startFrame = resolveCastActualStartFrame(found.skillCast.id, found.skillCast.startFrame);
  const endFrame =
    startFrame +
    (props.castActualDurationFrames.get(found.skillCast.id) ?? found.skillCast.durationFrames);
  const width =
    frameToTimelinePx(
      endFrame,
      props.scenario.battle.prepFrames,
      props.pxPerFrame,
      props.prepExpanded,
      props.prepEndFrame,
    ) -
    (left - props.trackHeaderWidth);
  const top = actionTop(found.trackIndex);
  const ratio = ports[port];
  return {
    point: { x: left + width * ratio.x, y: top + props.actionHeight * ratio.y },
    port,
  };
}

function resolveCastActualStartFrame(castId: string, placementFrame: number): number {
  return props.castActualStartFrames.get(castId) ?? placementFrame;
}

function pathData(
  start: Point,
  startPort: TimelineConnectionPort,
  end: Point,
  endPort: TimelineConnectionPort,
) {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const tension = Math.min(150, Math.max(40, distance * 0.4));
  const startDirection = directions[startPort];
  const endDirection = directions[endPort];
  const c1 = {
    x: start.x + startDirection.x * tension,
    y: start.y + startDirection.y * tension,
  };
  const c2 = {
    x: end.x + endDirection.x * tension,
    y: end.y + endDirection.y * tension,
  };
  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
}

const projectedConnections = computed(() =>
  props.scenario.connections.flatMap((connection: ConnectionDocument) => {
    const start = resolveEndpoint(connection.from, 'right');
    const end = resolveEndpoint(connection.to, 'left');
    if (start === null || end === null) return [];
    return [
      {
        ...connection,
        path: pathData(start.point, start.port, end.point, end.port),
        startPoint: start.point,
        endPoint: end.point,
        startColor: skillColor(connection.from.skillCastId),
        endColor: skillColor(connection.to.skillCastId),
      },
    ];
  }),
);

const previewPath = computed(() => {
  if (props.preview === null) return null;
  const start = resolveEndpoint(
    { kind: 'skillCast', skillCastId: props.preview.skillCastId, port: props.preview.port },
    'right',
  );
  return start === null ? null : pathData(start.point, start.port, props.preview.pointer, 'left');
});
</script>

<template>
  <svg
    class="timeline-connections"
    aria-hidden="true"
    :style="{ clipPath: prepExpanded ? undefined : `inset(0 0 0 ${trackHeaderWidth + 18}px)` }"
  >
    <g
      v-for="connection in projectedConnections"
      :key="connection.id"
      class="connector-group"
      :class="{
        'is-selected': selectedConnectionId === connection.id,
        'is-highlighted':
          hoveredSkillCastId === connection.from.skillCastId ||
          hoveredSkillCastId === connection.to.skillCastId,
        'is-dimmed':
          hoveredSkillCastId &&
          hoveredSkillCastId !== connection.from.skillCastId &&
          hoveredSkillCastId !== connection.to.skillCastId &&
          selectedConnectionId !== connection.id &&
          !draggingConnection,
        'is-dragging': draggingConnection,
      }"
      @click.stop="emit('select', connection.id)"
      @contextmenu.prevent.stop="emit('contextmenu', $event, connection.id)"
    >
      <defs>
        <linearGradient
          :id="`connection-gradient-${connection.id}`"
          gradientUnits="userSpaceOnUse"
          :x1="connection.startPoint.x"
          :y1="connection.startPoint.y"
          :x2="connection.endPoint.x"
          :y2="connection.endPoint.y"
        >
          <stop offset="0%" :stop-color="connection.startColor" stop-opacity="0.8" />
          <stop offset="100%" :stop-color="connection.endColor" />
        </linearGradient>
      </defs>
      <path class="connection-hit-area" :d="connection.path" :stroke="connection.endColor">
        <title>{{ t('connection.deleteHint') }}</title>
      </path>
      <TimelineConnectorStroke
        :path="connection.path"
        :stroke="
          selectedConnectionId === connection.id
            ? 'var(--ea-fg)'
            : `url(#connection-gradient-${connection.id})`
        "
        :emphasis="
          selectedConnectionId === connection.id
            ? 'selected'
            : hoveredSkillCastId === connection.from.skillCastId ||
                hoveredSkillCastId === connection.to.skillCastId
              ? 'highlighted'
              : 'normal'
        "
        :start-color="connection.startColor"
        :end-color="connection.endColor"
        particle
      />
      <circle
        v-if="selectedConnectionId === connection.id && !draggingConnection"
        class="target-handle"
        :cx="connection.endPoint.x"
        :cy="connection.endPoint.y"
        r="5"
        @pointerdown.stop.prevent="emit('retarget', $event, connection.id)"
      />
    </g>
    <TimelineConnectorStroke
      v-if="previewPath"
      :path="previewPath"
      stroke="var(--ea-gold)"
      :shadow="false"
      preview
    />
  </svg>
</template>

<style scoped>
.timeline-connections {
  position: absolute;
  inset: 0;
  z-index: 5;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.connection-hit-area {
  fill: none;
  stroke-linecap: round;
}

.connector-group {
  cursor: pointer;
  transition:
    opacity 0.2s,
    filter 0.2s;
}

.connector-group.is-dimmed {
  opacity: 0.1;
  filter: grayscale(0.8);
}

.connector-group.is-dragging {
  pointer-events: none;
}

.connection-hit-area {
  stroke-width: 12;
  stroke-opacity: 0;
  pointer-events: stroke;
  transition: stroke-opacity 0.2s;
}

@media (hover: hover) and (pointer: fine) {
  .connector-group:hover .connection-hit-area {
    stroke-opacity: 0.4;
  }
}

.target-handle {
  fill: #fff;
  stroke: #333;
  stroke-width: 1;
  cursor: grab;
  pointer-events: auto;
}

@media (hover: hover) and (pointer: fine) {
  .target-handle:hover {
    r: 7;
    fill: var(--ea-gold);
  }
}
</style>
