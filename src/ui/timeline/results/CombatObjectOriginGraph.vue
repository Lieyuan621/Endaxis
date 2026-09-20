<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton, EaDialog } from '../../../design-system/index';
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

const props = defineProps<{
  origins?: CombatObjectOrigins;
  /** 未提供现成索引时，首次打开图再为这份固定结果建立索引。 */
  receiptEntries?: readonly CombatReceiptEntry[];
  sequence: number;
  root?: import('../../../core/combat/receipt/combatReceipt').CombatObjectRef;
  operatorLabel?: (operatorId: string) => string;
  objectIcon?: import('./combatObjectIcons').CombatObjectIconResolver;
  actionPresentation?: (
    ownerId: string,
    actionId: string,
  ) => { name: string; kind: string } | undefined;
}>();
const { t, te } = useI18n();
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
const canvas = ref<SVGSVGElement>();
const zoom = ref(1);
const offset = ref({ x: 20, y: 20 });
const markerId = useId();
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
  zoom.value = 0.8;
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
  <EaButton size="sm" class="open-origin-graph" @click="open = true"
    >{{ t('objectOrigins.title') }} ↗</EaButton
  >
  <InputRegionBoundary label="CombatObjectOriginGraph" :active="open" modal>
    <EaDialog
      v-model="open"
      :title="t('objectOrigins.title')"
      width="min(1320px, 96vw)"
      top="3vh"
      append-to-body
      destroy-on-close
      @opened="focusRoot"
    >
      <div class="graph-toolbar">
        <label
          >{{ t('objectOrigins.relation') }}
          <select v-model="filter">
            <option value="buffChanges">{{ t('objectOrigins.buffChanges') }}</option>
            <option value="all">{{ t('objectOrigins.all') }}</option>
            <option v-for="relation in relations" :key="relation" :value="relation">
              {{ t(`objectOrigins.${relation}`) }}
            </option>
          </select>
        </label>
        <div class="zoom-controls">
          <EaButton size="sm" :aria-label="t('objectOrigins.zoomOut')" @click="scaleBy(1 / 1.25)"
            >−</EaButton
          >
          <span>{{ Math.round(zoom * 100) }}%</span>
          <EaButton size="sm" :aria-label="t('objectOrigins.zoomIn')" @click="scaleBy(1.25)"
            >+</EaButton
          >
          <EaButton size="sm" @click="fit">{{ t('objectOrigins.fit') }}</EaButton>
        </div>
      </div>
      <p class="graph-hint">{{ t('objectOrigins.controls') }}</p>
      <div class="graph-workspace">
        <svg
          ref="canvas"
          class="graph-canvas"
          :aria-label="t('objectOrigins.title')"
          @pointerdown="startPan"
          @pointermove="pan"
          @pointerup="stopPan"
          @pointercancel="stopPan"
          @lostpointercapture="stopPan"
          @wheel.prevent="wheel"
        >
          <defs>
            <marker
              :id="markerId"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
            </marker>
          </defs>
          <g :transform="`translate(${offset.x},${offset.y}) scale(${zoom})`">
            <g
              v-for="(edge, index) in graph?.edges"
              :key="index"
              class="graph-edge"
              :class="{
                highlighted: edge.from === selection || edge.to === selection,
                muted: edge.from !== selection && edge.to !== selection,
              }"
              :data-relation="edge.relation"
            >
              <title>{{ t(`objectOrigins.${edge.relation}`) }}</title>
              <path :d="graph!.routes[index]!.path" fill="none" :marker-end="`url(#${markerId})`" />
              <text
                v-if="edge.from === selection || edge.to === selection"
                :x="graph!.routes[index]!.x"
                :y="graph!.routes[index]!.y"
                text-anchor="middle"
              >
                {{ t(`objectOrigins.${edge.relation}`) }}
              </text>
            </g>
            <foreignObject
              v-for="(node, index) in graph?.nodes"
              :key="index"
              :x="node.x"
              :y="node.y"
              width="240"
              height="88"
            >
              <button
                type="button"
                data-node
                class="graph-node"
                :class="{ selected: selection === index }"
                :style="icon(node.object) ? { paddingLeft: '54px' } : undefined"
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
            </foreignObject>
          </g>
        </svg>
        <aside class="node-details" v-if="chosen">
          <img
            v-if="icon(chosen)"
            class="detail-icon"
            :src="icon(chosen)"
            alt=""
            draggable="false"
            @error="failIcon(chosen)"
          />
          <h3>{{ nodeKind(chosen) }}</h3>
          <p v-if="changeSummary(chosen)">{{ changeSummary(chosen) }}</p>
          <p>{{ description(chosen) }}</p>
          <ul v-if="chosenModifiers.length">
            <li v-for="item in chosenModifiers" :key="combatObjectKey(item.node.ref)">
              {{ modifierSummary(item) }}
            </li>
          </ul>
          <p v-if="chosenContribution !== undefined">
            {{
              t('objectOrigins.directContribution', {
                value: chosenContribution.toLocaleString(undefined, { maximumFractionDigits: 2 }),
              })
            }}
          </p>
          <code>{{ combatObjectKey(chosen.ref) }}</code>
          <p v-if="chosenFact">
            #{{ chosenFact.sequence }} · {{ chosenFact.frame }}f · {{ chosenFact.event }}
          </p>
          <p
            v-else-if="['buff', 'globalBuff', 'abilityEntity', 'receipt'].includes(chosen.ref.kind)"
          >
            {{ t('objectOrigins.missing') }}
          </p>
          <p class="graph-hint">{{ t('objectOrigins.hint') }}</p>
        </aside>
      </div>
      <p v-if="graph?.limited" class="graph-hint">{{ t('objectOrigins.limit') }}</p>
    </EaDialog>
  </InputRegionBoundary>
</template>

<style scoped>
.open-origin-graph {
  margin-top: 16px;
}
.graph-toolbar,
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.graph-toolbar {
  justify-content: space-between;
}
.graph-toolbar label {
  display: flex;
  align-items: center;
  gap: 8px;
}
select {
  padding: 6px 10px;
  border: 1px solid var(--ea-border-strong);
  border-radius: 4px;
  background: var(--ea-panel-elevated);
  color: inherit;
}
.graph-hint {
  font-size: 12px;
  opacity: 0.7;
  line-height: 1.6;
}
.graph-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 230px;
  height: min(64vh, 700px);
  min-height: 300px;
  border: 1px solid var(--ea-border);
  border-radius: 8px;
  overflow: hidden;
}
.graph-canvas {
  width: 100%;
  height: 100%;
  min-width: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
  background-color: var(--ea-panel);
  background-image: radial-gradient(#929aa633 1px, transparent 1px);
  background-size: 18px 18px;
}
.graph-canvas:active {
  cursor: grabbing;
}
.graph-edge {
  stroke: #8292a5;
  stroke-width: 1.6;
}
.graph-edge[data-relation='producedBy'] {
  stroke: #5884bb;
}
.graph-edge[data-relation='ownedBy'] {
  stroke: #508c76;
  stroke-dasharray: 5 3;
}
.graph-edge.highlighted {
  stroke-width: 2.7;
}
.graph-edge.muted {
  opacity: 0.22;
}
.graph-edge text {
  stroke: var(--ea-panel);
  stroke-width: 5px;
  stroke-linejoin: round;
  fill: var(--ea-fg-secondary);
  font-size: 11px;
  paint-order: stroke;
}
.graph-node {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  padding: 11px 13px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border-strong);
  border-left: 4px solid #7f8ea3;
  border-radius: 8px;
  background: var(--ea-panel-elevated);
  color: var(--ea-fg);
  cursor: pointer;
}
.graph-node[data-kind='buff'],
.graph-node[data-kind='globalBuff'] {
  border-left-color: #c99b38;
}
.graph-node[data-kind='abilityEntity'] {
  border-left-color: #8970c4;
}
.graph-node[data-kind='operator'] {
  border-left-color: #479475;
}
.graph-node.selected {
  border-color: #528ad0;
  box-shadow: inset 0 0 0 1px #528ad0;
}
.node-kind {
  font-size: 12px;
  font-weight: 700;
}
.node-icon {
  position: absolute;
  left: 11px;
  top: 24px;
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.detail-icon {
  width: 56px;
  height: 56px;
  object-fit: contain;
  margin-bottom: 10px;
}
.node-name {
  font-size: 12px;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
small {
  font-size: 10px;
  opacity: 0.65;
}
.node-details {
  padding: 16px;
  overflow: auto;
  border-left: 1px solid var(--ea-border);
  overflow-wrap: anywhere;
  font-size: 12px;
}
.node-details h3 {
  margin-top: 0;
}
.node-details code {
  font-size: 11px;
  opacity: 0.7;
}
@media (max-width: 720px) {
  .graph-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(240px, 1fr) 130px;
    height: 70vh;
  }
  .node-details {
    border-left: 0;
    border-top: 1px solid var(--ea-border);
  }
}
</style>
