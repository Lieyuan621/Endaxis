<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog, EaSelect, type EaSelectValue } from '../../../design-system/index';
import InputRegionBoundary from '../../keyboard/InputRegionBoundary.vue';
import { CombatObjectOrigins } from '../../../core/projection/combatObjectOrigins';
import type {
  CombatObjectNode,
  CombatObjectRelation,
} from '../../../core/projection/combatObjectOrigins';
import type { CombatReceiptEntry } from '../../../core/combat/receipt/combatReceipt';
import { combatObjectKey } from '../../../core/combat/receipt/combatObjectIdentity';
import { layoutCombatOriginGraph, type OriginRelationFilter } from './combatOriginGraphLayout';
import { projectHitDamageContribution } from '../../../core/projection/damageContribution';
import { runtimeTargetFromEntityId } from '../../../core/game-data/logicalAbilityEntity';
import TimelineConnectorStroke from '../components/TimelineConnectorStroke.vue';

const props = defineProps<{
  kind?: 'damage' | 'status';
  origins?: CombatObjectOrigins;
  /** 未提供现成索引时，首次打开图再为这份固定结果建立索引。 */
  receiptEntries?: readonly CombatReceiptEntry[];
  sequence: number;
  root?: import('../../../core/combat/receipt/combatReceipt').CombatObjectRef;
  operatorLabel?: (operatorId: string) => string;
  objectName?: import('./combatObjectNames').CombatObjectOwnName;
  objectIcon?: import('./combatObjectIcons').CombatObjectIconResolver;
  actionPresentation?: (
    ownerId: string,
    actionId: string,
  ) => { name: string; kind: string } | undefined;
}>();
const { t, te } = useI18n();
const title = computed(() =>
  t(props.kind === 'damage' ? 'objectOrigins.damageTitle' : 'objectOrigins.statusTitle'),
);
const open = ref(false);
const origins = computed(
  () =>
    props.origins ??
    (open.value && props.receiptEntries ? new CombatObjectOrigins(props.receiptEntries) : null),
);
const filter = ref<OriginRelationFilter>('buffChanges');
const selection = ref(0);
const failedIcons = ref(new Set<string>());
function icon(node: CombatObjectNode): string | undefined {
  const path = props.objectIcon?.(node, props.sequence);
  return path && !failedIcons.value.has(path) ? path : undefined;
}
function failIcon(node: CombatObjectNode) {
  const path = props.objectIcon?.(node, props.sequence);
  if (path) failedIcons.value = new Set([...failedIcons.value, path]);
}
watch(
  () => props.objectIcon,
  () => {
    failedIcons.value = new Set();
  },
);
const canvas = ref<HTMLDivElement>();
const zoom = ref(1);
const offset = ref({ x: 20, y: 20 });
const markerId = useId();
const edgeColors = {
  default: 'var(--origin-edge-default)',
  producedBy: 'var(--origin-edge-produced)',
  ownedBy: 'var(--origin-edge-owned)',
} as const;
function edgeStyle(relation: CombatObjectRelation): keyof typeof edgeColors {
  return relation === 'producedBy' || relation === 'ownedBy' ? relation : 'default';
}
const relations: readonly CombatObjectRelation[] = [
  'producedBy',
  'stackedBy',
  'previousState',
  'convertedBy',
  'runtimeSource',
  'ownedBy',
  'originCast',
  'modifiedBy',
  'providedBy',
];
const relationOptions = computed(() => [
  { value: 'buffChanges', label: t('objectOrigins.buffChanges') },
  { value: 'all', label: t('objectOrigins.all') },
  ...relations.map(relation => ({ value: relation, label: t(`objectOrigins.${relation}`) })),
]);
function selectRelation(value: EaSelectValue | EaSelectValue[]) {
  if (typeof value === 'string') filter.value = value as OriginRelationFilter;
}
const graph = computed(() =>
  open.value && origins.value
    ? layoutCombatOriginGraph(origins.value, props.sequence, filter.value, 128, props.root)
    : null,
);
const chosen = computed(() => graph.value?.nodes[selection.value]?.object);
const contribution = computed(() => {
  if (!open.value || !origins.value) return undefined;
  if (props.root && props.root.kind !== 'receipt') return undefined;
  const hit = origins.value.get({ kind: 'receipt', sequence: props.sequence });
  const source = hit.fact?.sourceId;
  if (source === undefined) return undefined;
  const operator = origins.value.providerOperator(
    origins.value.get(runtimeTargetFromEntityId(source)),
    props.sequence,
  );
  return operator === undefined
    ? undefined
    : projectHitDamageContribution(origins.value, hit, operator);
});
const chosenContribution = computed(() => {
  const keys = new Set(chosenModifiers.value.map(item => combatObjectKey(item.node.ref)));
  const items = contribution.value?.external.filter(item =>
    keys.has(combatObjectKey(item.modifier)),
  );
  return items?.length ? items.reduce((sum, item) => sum + item.value, 0) : undefined;
});
const chosenModifiers = computed(() => graph.value?.nodes[selection.value]?.modifiers ?? []);
function modifierSummary(item: (typeof chosenModifiers.value)[number]): string {
  const modifier = item.modifier;
  if (modifier.kind === 'damageScale')
    return `${t(`hitDetail.damageZones.${modifier.zone}`)} · ${t(`objectOrigins.${modifier.side}`)} · ${modifier.addition >= 0 ? '+' : ''}${(modifier.addition * 100).toFixed(1)}%`;
  if (modifier.kind === 'multiplyValue') return `×${modifier.multiplier}`;
  return `${modifier.attribute} · ${modifier.slot} · ${modifier.value}`;
}
const chosenFact = computed(() =>
  chosen.value?.fact && chosen.value.fact.sequence <= props.sequence
    ? chosen.value.fact
    : undefined,
);
watch([origins, () => props.sequence, () => props.root, filter], async () => {
  selection.value = 0;
  await nextTick();
  focusRoot();
});
function focusRoot() {
  const bounds = canvas.value?.getBoundingClientRect();
  const root = graph.value?.nodes[0];
  if (!bounds || !root) return;
  zoom.value = 1;
  offset.value = { x: 32 - root.x * zoom.value, y: bounds.height / 2 - (root.y + 44) * zoom.value };
}
function fit() {
  const bounds = canvas.value?.getBoundingClientRect();
  const current = graph.value;
  if (!bounds || !current) return;
  zoom.value = Math.max(
    0.08,
    Math.min(1, (bounds.width - 48) / current.width, (bounds.height - 48) / current.height),
  );
  offset.value = {
    x: (bounds.width - current.width * zoom.value) / 2,
    y: (bounds.height - current.height * zoom.value) / 2,
  };
}
function scaleBy(factor: number, x?: number, y?: number) {
  const bounds = canvas.value?.getBoundingClientRect();
  if (!bounds) return;
  const cx = x ?? bounds.width / 2;
  const cy = y ?? bounds.height / 2;
  const next = Math.max(0.08, Math.min(2.5, zoom.value * factor));
  const ratio = next / zoom.value;
  offset.value = { x: cx - (cx - offset.value.x) * ratio, y: cy - (cy - offset.value.y) * ratio };
  zoom.value = next;
}
let drag: { id: number; x: number; y: number } | undefined;
function startPan(event: PointerEvent) {
  if (event.button !== 0 || (event.target as Element).closest('[data-node]')) return;
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  canvas.value?.setPointerCapture(event.pointerId);
}
function pan(event: PointerEvent) {
  if (!drag || drag.id !== event.pointerId) return;
  offset.value = {
    x: offset.value.x + event.clientX - drag.x,
    y: offset.value.y + event.clientY - drag.y,
  };
  drag.x = event.clientX;
  drag.y = event.clientY;
}
function stopPan() {
  drag = undefined;
}
function wheel(event: WheelEvent) {
  const bounds = canvas.value!.getBoundingClientRect();
  scaleBy(
    Math.exp(-event.deltaY * 0.0015),
    event.clientX - bounds.left,
    event.clientY - bounds.top,
  );
}
function description(node: CombatObjectNode): string {
  // 能力实体名称不能替代定义身份；节点正文及右侧详情保留完整定义 ID。
  if (node.ref.kind === 'abilityEntity' && typeof node.fact?.data?.abilityEntityId === 'string')
    return node.fact.data.abilityEntityId;
  // 来源图的每个节点只标自己的名称，不继承祖先名称来冒充本节点。
  const own = props.objectName?.(node);
  if (own) return own;
  if (node.ref.kind === 'action') {
    const presentation = props.actionPresentation?.(node.ref.ownerId, node.ref.actionId);
    if (presentation) return presentation.name;
  }
  if (node.ref.kind === 'modifier')
    return (
      node.fact?.appliedDamageModifiers?.[node.ref.index]?.buffId ??
      `#${node.ref.sequence} / ${node.ref.index + 1}`
    );
  const data = node.fact && node.fact.sequence <= props.sequence ? node.fact.data : undefined;
  const name = data?.buffId ?? data?.skillId ?? data?.abilityEntityId ?? data?.definitionId;
  if (typeof name === 'string') return name;
  const object = node.ref;
  switch (object.kind) {
    case 'action':
      return object.actionId;
    case 'operator':
      return props.operatorLabel?.(object.operatorId) ?? object.operatorId;
    case 'buff':
      return `${object.ownerId} / #${object.instanceId}`;
    case 'abilityEntity':
    case 'globalBuff':
      return `#${object.instanceId}`;
    case 'receipt':
      return `#${object.sequence}`;
    case 'spatialPoint':
      return String(object.pointId);
    case 'enemy':
      return '—';
  }
}

function nodeKind(node: CombatObjectNode): string {
  if (node.ref.kind === 'abilityEntity') {
    const name = props.objectName?.(node);
    return [t('objectOrigins.kinds.abilityEntity'), name].filter(Boolean).join(' · ');
  }
  if (
    node.fact &&
    ['BuffApplied', 'BuffStackChanged'].includes(node.fact.event) &&
    typeof node.fact.data?.layers === 'number'
  )
    return t('objectOrigins.buffState', { layers: node.fact.data.layers });
  if (node.ref.kind === 'action') {
    const presentation = props.actionPresentation?.(node.ref.ownerId, node.ref.actionId);
    if (presentation) return presentation.kind;
  }
  const key = `objectOrigins.events.${node.fact?.event}`;
  return node.ref.kind === 'receipt' && te(key)
    ? t(key)
    : t(`objectOrigins.kinds.${node.ref.kind}`);
}
function changeSummary(node: CombatObjectNode): string | undefined {
  const fact = node.fact;
  if (node.ref.kind !== 'receipt' || !fact || fact.sequence > props.sequence) return;
  const data = fact.data;
  if (fact.event === 'BuffStackChanged')
    return t('objectOrigins.layerChange', { before: data?.previousLayers, after: data?.layers });
  if (fact.event === 'ElementalAttachmentConverted')
    return t('objectOrigins.affectedLayers', { count: data?.consumedLayers });
  if (fact.event === 'BuffEnhanceAttempted')
    return t('objectOrigins.stackAttempt', { count: data?.attemptedLayers, layers: data?.layers });
  if (fact.event === 'BuffConsumed' || fact.event === 'BuffAbsorbed')
    return t('objectOrigins.affectedLayers', { count: data?.layers });
  if (fact.event === 'BuffApplied')
    return t('objectOrigins.currentLayers', { count: data?.layers });
}
</script>

<template>
  <EaButton size="sm" class="open-origin-graph" @click="open = true">{{ title }} ↗</EaButton>
  <InputRegionBoundary label="CombatObjectOriginGraph" :active="open" modal>
    <EaDialog
      v-model="open"
      :title="title"
      width="min(1320px, 96vw)"
      top="3vh"
      append-to-body
      destroy-on-close
      @opened="focusRoot"
    >
      <div class="graph-toolbar">
        <label class="graph-filter">
          <span>{{ t('objectOrigins.relation') }}</span>
          <EaSelect
            size="sm"
            :aria-label="t('objectOrigins.relation')"
            :model-value="filter"
            :options="relationOptions"
            @change="selectRelation"
          />
        </label>
        <div class="zoom-controls">
          <EaButton
            size="sm"
            icon-only
            :aria-label="t('objectOrigins.zoomOut')"
            @click="scaleBy(1 / 1.25)"
            >−</EaButton
          >
          <span>{{ Math.round(zoom * 100) }}%</span>
          <EaButton
            size="sm"
            icon-only
            :aria-label="t('objectOrigins.zoomIn')"
            @click="scaleBy(1.25)"
            >+</EaButton
          >
          <EaButton size="sm" @click="fit">{{ t('objectOrigins.fit') }}</EaButton>
        </div>
      </div>
      <p class="graph-hint">{{ t('objectOrigins.controls') }}</p>
      <div class="graph-workspace">
        <div
          ref="canvas"
          class="graph-canvas"
          :aria-label="title"
          @pointerdown="startPan"
          @pointermove="pan"
          @pointerup="stopPan"
          @pointercancel="stopPan"
          @lostpointercapture="stopPan"
          @wheel.prevent="wheel"
        >
          <!-- HTML 节点与 SVG 连线共用同一 CSS 坐标系，避免 WebKit foreignObject 的定位层脱离 SVG 变换。 -->
          <div
            class="graph-scene"
            :style="{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }"
          >
            <svg class="graph-edges">
              <defs>
                <marker
                  v-for="(color, style) in edgeColors"
                  :id="`${markerId}-${style}`"
                  :key="style"
                  viewBox="0 0 19 8"
                  refX="16"
                  refY="4"
                  markerWidth="19"
                  markerHeight="8"
                  markerUnits="userSpaceOnUse"
                  orient="auto-start-reverse"
                >
                  <!-- 固定尺寸的小实心箭头，指向结果并与节点边缘留出可见间距。 -->
                  <path d="M 2 1.25 L 9 4 L 2 6.75 Z" :fill="color" />
                </marker>
              </defs>
              <g
                v-for="(edge, index) in graph?.edges"
                :key="index"
                class="graph-edge"
                :class="{
                  highlighted: edge.from === selection || edge.to === selection,
                  muted: edge.from !== selection && edge.to !== selection,
                }"
                :data-relation="edge.relation"
                :stroke="edgeColors[edgeStyle(edge.relation)]"
              >
                <title>{{ t(`objectOrigins.${edge.relation}`) }}</title>
                <TimelineConnectorStroke
                  :path="graph!.routes[index]!.path"
                  :stroke="edgeColors[edgeStyle(edge.relation)]"
                  :marker-start="`url(#${markerId}-${edgeStyle(edge.relation)})`"
                  :dash="edge.relation === 'ownedBy' ? '14 3' : '14 5'"
                  :animated="false"
                  :shadow="false"
                />
                <text
                  v-if="edge.from === selection || edge.to === selection"
                  :x="graph!.routes[index]!.x"
                  :y="graph!.routes[index]!.y"
                  text-anchor="middle"
                >
                  {{ t(`objectOrigins.${edge.relation}`) }}
                </text>
              </g>
            </svg>
            <button
              v-for="(node, index) in graph?.nodes"
              :key="index"
              type="button"
              data-node
              class="graph-node"
              :class="{ selected: selection === index }"
              :style="{
                left: `${node.x}px`,
                top: `${node.y}px`,
                paddingLeft: icon(node.object) ? '54px' : undefined,
              }"
              :data-kind="node.object.ref.kind"
              :aria-pressed="selection === index"
              @click="selection = index"
            >
              <img
                v-if="icon(node.object)"
                class="node-icon"
                :src="icon(node.object)"
                alt=""
                draggable="false"
                @error="failIcon(node.object)"
              />
              <span class="node-kind"
                >{{ nodeKind(node.object) }}
                <span v-if="changeSummary(node.object)"
                  >· {{ changeSummary(node.object) }}</span
                ></span
              >
              <span class="node-name" :title="description(node.object)">{{
                description(node.object)
              }}</span>
              <small v-if="node.object.fact && node.object.fact.sequence <= sequence"
                >#{{ node.object.fact.sequence }} · {{ node.object.fact.frame }}f</small
              >
            </button>
          </div>
        </div>
        <aside v-if="chosen" class="node-details" :aria-label="t('objectOrigins.details')">
          <div class="node-details-header">
            <img
              v-if="icon(chosen)"
              class="detail-icon"
              :src="icon(chosen)"
              alt=""
              draggable="false"
              @error="failIcon(chosen)"
            />
            <div class="node-details-heading">
              <h3>{{ nodeKind(chosen) }}</h3>
              <p :title="description(chosen)">{{ description(chosen) }}</p>
            </div>
          </div>
          <p v-if="changeSummary(chosen)" class="node-details-change">
            {{ changeSummary(chosen) }}
          </p>
          <div v-if="chosenModifiers.length" class="node-details-section">
            <h4>{{ t('objectOrigins.directModifiers') }}</h4>
            <ul>
              <li v-for="item in chosenModifiers" :key="combatObjectKey(item.node.ref)">
                {{ modifierSummary(item) }}
              </li>
            </ul>
          </div>
          <p v-if="chosenContribution !== undefined" class="node-details-contribution">
            {{
              t('objectOrigins.directContribution', {
                value: chosenContribution.toLocaleString(undefined, { maximumFractionDigits: 2 }),
              })
            }}
          </p>
          <dl class="node-details-meta">
            <div>
              <dt>{{ t('objectOrigins.objectId') }}</dt>
              <dd>
                <code>{{ combatObjectKey(chosen.ref) }}</code>
              </dd>
            </div>
            <div v-if="chosenFact">
              <dt>{{ t('objectOrigins.record') }}</dt>
              <dd>#{{ chosenFact.sequence }} · {{ chosenFact.frame }}f</dd>
            </div>
            <div v-if="chosenFact">
              <dt>{{ t('objectOrigins.event') }}</dt>
              <dd>
                {{
                  te(`objectOrigins.events.${chosenFact.event}`)
                    ? t(`objectOrigins.events.${chosenFact.event}`)
                    : chosenFact.event
                }}
              </dd>
            </div>
          </dl>
          <p
            v-if="
              !chosenFact &&
              ['buff', 'globalBuff', 'abilityEntity', 'receipt'].includes(chosen.ref.kind)
            "
            class="node-details-missing"
          >
            {{ t('objectOrigins.missing') }}
          </p>
          <p class="node-details-hint">{{ t('objectOrigins.hint') }}</p>
        </aside>
      </div>
      <p v-if="graph?.limited" class="graph-hint">{{ t('objectOrigins.limit') }}</p>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.open-origin-graph {
  margin-top: var(--ea-space-4);
}
.graph-toolbar,
.zoom-controls {
  display: flex;
  align-items: center;
  gap: var(--ea-space-2);
}
.graph-toolbar {
  justify-content: space-between;
  gap: var(--ea-space-3);
}
.graph-filter {
  display: flex;
  align-items: center;
  gap: var(--ea-space-2);
  min-width: 0;
}
.graph-filter > span {
  flex: none;
  white-space: nowrap;
}
.graph-filter :deep(.ea-select) {
  width: 240px;
  min-width: 0;
  max-width: 100%;
}
.zoom-controls {
  flex: none;
}
.zoom-controls > span {
  min-width: 42px;
  color: var(--ea-fg-secondary);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: center;
}
.graph-hint {
  margin: var(--ea-space-3) 0;
  color: var(--ea-fg-muted);
  font-size: 12px;
  line-height: 1.5;
}
.graph-workspace {
  --origin-edge-default: #92a2b5;
  --origin-edge-produced: #6c9ccf;
  --origin-edge-owned: #69ad8a;
  --origin-grid-dot: rgba(255, 255, 255, 0.13);
  --origin-node-default: #8999ad;
  --origin-node-buff: var(--ea-gold);
  --origin-node-ability: #a78bfa;
  --origin-node-operator: #69ad8a;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  height: min(64vh, 700px);
  min-height: 300px;
  border: 1px solid var(--ea-border);
  border-radius: var(--ea-control-radius);
  overflow: hidden;
}
:global(html[data-theme='light'] .graph-workspace) {
  --origin-edge-default: #68798c;
  --origin-edge-produced: #356b9d;
  --origin-edge-owned: #367859;
  --origin-grid-dot: rgba(26, 27, 30, 0.14);
  --origin-node-default: #68798c;
  --origin-node-ability: #7954b6;
  --origin-node-operator: #367859;
}
.graph-canvas {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-width: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
  background-color: var(--ea-panel);
  background-image: radial-gradient(circle, var(--origin-grid-dot) 1px, transparent 1px);
  background-size: 18px 18px;
}
.graph-canvas:active {
  cursor: grabbing;
}
.graph-scene {
  position: absolute;
  left: 0;
  top: 0;
  width: 0;
  height: 0;
  transform-origin: 0 0;
}
.graph-edges {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 1px;
  overflow: visible;
}
.graph-edge.muted {
  opacity: 0.22;
}
.graph-edge text {
  stroke: var(--ea-panel);
  stroke-width: 5px;
  stroke-linejoin: round;
  fill: var(--ea-fg);
  font-size: 12px;
  font-weight: 600;
  paint-order: stroke;
}
.graph-node {
  position: absolute;
  width: 240px;
  height: 88px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  padding: 10px 12px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border-strong);
  border-left: 4px solid var(--origin-node-default);
  border-radius: var(--ea-control-radius);
  background: var(--ea-panel-elevated);
  color: var(--ea-fg);
  cursor: pointer;
  box-shadow: 0 2px 8px var(--ea-shadow);
}
.graph-node[data-kind='buff'],
.graph-node[data-kind='globalBuff'] {
  border-left-color: var(--origin-node-buff);
}
.graph-node[data-kind='abilityEntity'] {
  border-left-color: var(--origin-node-ability);
}
.graph-node[data-kind='operator'] {
  border-left-color: var(--origin-node-operator);
}
.graph-node.selected {
  box-shadow:
    0 0 0 2px var(--ea-gold),
    0 4px 12px var(--ea-shadow);
  z-index: 1;
}
.graph-node:focus-visible {
  outline: 2px solid var(--ea-gold);
  outline-offset: 3px;
  z-index: 2;
}
@media (hover: hover) and (pointer: fine) {
  .graph-node:hover {
    background: color-mix(in srgb, var(--ea-gold) 5%, var(--ea-panel-elevated));
    box-shadow:
      0 0 0 1px var(--ea-border-strong),
      0 4px 12px var(--ea-shadow);
  }
  .graph-node.selected:hover {
    box-shadow:
      0 0 0 2px var(--ea-gold-hover),
      0 4px 12px var(--ea-shadow);
  }
}
.node-kind {
  font-size: 13px;
  font-weight: 700;
}
.node-icon {
  position: absolute;
  left: 11px;
  top: 27px;
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.detail-icon {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  object-fit: contain;
}
.node-name {
  font-size: 13px;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.graph-node small {
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.node-details {
  padding: var(--ea-space-4);
  overflow: auto;
  border-left: 1px solid var(--ea-border);
  background: var(--ea-panel-elevated);
  overflow-wrap: anywhere;
  font-size: 13px;
  line-height: 1.5;
}
.node-details-header {
  display: flex;
  align-items: flex-start;
  gap: var(--ea-space-3);
  padding-bottom: var(--ea-space-4);
  border-bottom: 1px solid var(--ea-border);
}
.node-details-heading {
  min-width: 0;
}
.node-details h3 {
  margin: 0;
  color: var(--ea-fg);
  font-size: 15px;
  line-height: 1.4;
}
.node-details-heading p {
  margin: var(--ea-space-1) 0 0;
  color: var(--ea-fg-secondary);
}
.node-details-change,
.node-details-contribution {
  margin: var(--ea-space-3) 0 0;
  color: var(--ea-fg-secondary);
}
.node-details-contribution {
  padding: var(--ea-space-2);
  border-left: 2px solid var(--ea-gold);
  background: var(--ea-fill-soft);
  color: var(--ea-fg);
}
.node-details-section {
  margin-top: var(--ea-space-4);
}
.node-details-section h4 {
  margin: 0 0 var(--ea-space-2);
  color: var(--ea-fg-muted);
  font-size: 12px;
  font-weight: 600;
}
.node-details-section ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.node-details-section li {
  padding: var(--ea-space-2) 0;
  border-top: 1px solid var(--ea-border-soft);
}
.node-details-meta {
  margin: var(--ea-space-4) 0 0;
  border-top: 1px solid var(--ea-border);
}
.node-details-meta > div {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: var(--ea-space-2);
  padding: var(--ea-space-2) 0;
  border-bottom: 1px solid var(--ea-border-soft);
}
.node-details-meta dt {
  color: var(--ea-fg-muted);
}
.node-details-meta dd {
  min-width: 0;
  margin: 0;
  color: var(--ea-fg-secondary);
}
.node-details code {
  color: var(--ea-fg-muted);
  font-size: 11px;
  word-break: break-all;
}
.node-details-missing,
.node-details-hint {
  margin: var(--ea-space-3) 0 0;
  color: var(--ea-fg-muted);
  font-size: 12px;
  line-height: 1.5;
}
.node-details-hint {
  padding-top: var(--ea-space-3);
  border-top: 1px solid var(--ea-border);
}
@media (max-width: 720px) {
  .graph-toolbar {
    flex-wrap: wrap;
  }
  .graph-filter {
    width: 100%;
  }
  .graph-filter :deep(.ea-select) {
    width: min(100%, 320px);
  }
  .zoom-controls {
    margin-left: auto;
  }
  .graph-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(240px, 1fr) 210px;
    height: 70vh;
  }
  .node-details {
    border-left: 0;
    border-top: 1px solid var(--ea-border);
  }
}
</style>
