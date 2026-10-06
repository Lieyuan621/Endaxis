<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  shallowRef,
  toRaw,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { EaButton } from '@/design-system';
import SkillGraphEditorDialog from './SkillGraphEditorDialog.vue';
import ResourceGraphPanels from './ResourceGraphPanels.vue';
import { useResourceGraphEditor } from './useResourceGraphEditor';
import { createResourceEditorView } from '../editor/resourceEditorView';
import { createGraphCanvasView } from './graphCanvasView';
import {
  indexExecutionTrace,
  directTraceReceipts,
  type ExecutionTraceCall,
} from '../../application/simulation/executionTraceNavigation';
import type { SkillDefinition } from '../../../packages/game-data-contract/src/skills';
import type { ActionGraphResourceDefinition } from '../../../packages/game-data-contract/src/actionGraph';
import type { SkillGraphPresentation } from '../../core/project/graphPresentation';
import type { ReferenceChoices } from '../definition-editor/fieldInputConfig';
import { actionNodeTitle } from './nodePresentation';
import { getCompiledGraphLocation } from '../../core/compiler/compileActionGraph';
import type {
  ActionExecutionTrace,
  ExecutionTraceRecord,
} from '../../core/combat/actions/actionExecutionTrace';
import type { StandardPlayerDamageScenarioResult } from '../../application/simulation/runStandardPlayerDamageScenarioSimulation';

const props = defineProps<{
  label: string;
  definition: SkillDefinition;
  presentation?: SkillGraphPresentation;
  referenceChoices?: ReferenceChoices;
  run: () => {
    trace: ActionExecutionTrace;
    result?: StandardPlayerDamageScenarioResult;
    error?: string;
  };
}>();
const emit = defineEmits<{ close: [] }>();
const { t, te } = useI18n();
const data = shallowRef<ReturnType<typeof props.run>>();
const error = ref('');
const busy = ref(true);
const selected = ref(0);
const showLifecycle = ref(false);
const skillGraph = ref<InstanceType<typeof SkillGraphEditorDialog>>();
const navigation = computed(() =>
  indexExecutionTrace(data.value?.trace.records ?? [], belongsToSkill),
);
const activeCallId = ref(0);
const activeCall = computed(
  () => navigation.value.calls[activeCallId.value] ?? navigation.value.root,
);
const stack = computed(() => {
  const result: ExecutionTraceCall[] = [];
  for (let call: ExecutionTraceCall | undefined = activeCall.value; call; call = call.parent)
    result.unshift(call);
  return result;
});
const resource = shallowRef<ActionGraphResourceDefinition>();
const resourceView = reactive(createResourceEditorView());
const resourceEditor = reactive(
  useResourceGraphEditor({
    view: () => resourceView,
    owner: () => ({ actionGraph: resource.value ?? props.definition.actionGraph }),
    readonly: () => true,
    presentation: () => undefined,
    identity: () => `execution-resource:${activeCall.value.id}`,
    label: () => t('executionTrace.resource'),
    change: () => {},
  }),
);
const cameras = new Map<object, ReturnType<typeof createGraphCanvasView>>();
const resourceCamera = computed(() => {
  const graph =
    resource.value &&
    (resourceEditor.address.kind === 'main'
      ? resource.value.main
      : resource.value.macros[resourceEditor.address.macroId]?.graph);
  if (!graph) return undefined;
  if (!cameras.has(graph)) cameras.set(graph, reactive(createGraphCanvasView()));
  return cameras.get(graph);
});
const records = computed(
  () =>
    activeCall.value.records.filter(
      r => showLifecycle.value || r.phase === 'execute' || r.phase === 'tick',
    ) ?? [],
);
const current = computed(() => records.value[selected.value]);
// 回放只补充本次真实调用的入口，不从孤立节点猜测其他宿主入口。
const executionEntries = computed(() => {
  const first = activeCall.value.records.find(record => record.phase === 'execute');
  const source = first && getCompiledGraphLocation(first.program, first.nodeId);
  if (!source || !resource.value || source.resource !== toRaw(resource.value)) return undefined;
  const graph =
    resourceEditor.address.kind === 'main'
      ? resource.value.main
      : resource.value.macros[resourceEditor.address.macroId]?.graph;
  if (toRaw(graph) !== toRaw(source.graph)) return undefined;
  return [
    {
      id: 'execution-call',
      label: t('executionTrace.callEntry'),
      entries: [
        {
          id: 'execution-call',
          label: first!.response?.name ?? t('executionTrace.callEntry'),
          targetId: source.nodeId,
        },
      ],
    },
  ];
});
const executionReturn = computed(() => {
  if (!executionEntries.value) return undefined;
  const outcome = activeCall.value.records.find(record => record.callOutcome)?.callOutcome;
  if (outcome?.purpose === 'comboCandidate')
    return t(
      outcome.result
        ? 'executionTrace.comboCandidatePassed'
        : 'executionTrace.comboCandidateRejected',
    );
  // 未接入的调用方不借用节点返回值冒充完整入口结果。
  return t('executionTrace.callReturnUnknown');
});
const playing = ref(false);
const stepsPerSecond = ref(2);
let playbackTimer: ReturnType<typeof setTimeout> | undefined;
function pause() {
  playing.value = false;
  clearTimeout(playbackTimer);
  playbackTimer = undefined;
}
function schedulePlayback() {
  clearTimeout(playbackTimer);
  if (!playing.value) return;
  playbackTimer = setTimeout(() => {
    if (selected.value < records.value.length - 1) selected.value++;
    if (selected.value >= records.value.length - 1) pause();
    else schedulePlayback();
  }, 1000 / stepsPerSecond.value);
}
function togglePlayback() {
  if (playing.value) return pause();
  if (busy.value || records.value.length < 2) return;
  if (selected.value >= records.value.length - 1) selected.value = 0;
  playing.value = true;
  schedulePlayback();
}
watch(stepsPerSecond, schedulePlayback);
watch(showLifecycle, pause, { flush: 'sync' });
let disposed = false;
onUnmounted(() => {
  disposed = true;
  pause();
});
const location = computed(
  () => current.value && getCompiledGraphLocation(current.value.program, current.value.nodeId),
);
function belongsToSkill(record: ExecutionTraceRecord) {
  const graph = getCompiledGraphLocation(record.program, record.nodeId)?.graph;
  const root = props.definition.actionGraph;
  return (
    graph !== undefined &&
    (toRaw(graph) === toRaw(root.main) ||
      Object.values(root.macros).some(macro => toRaw(macro.graph) === toRaw(graph)))
  );
}
const external = computed(() => current.value !== undefined && !belongsToSkill(current.value));
const page = computed(() => Math.max(0, Math.floor(selected.value / 100)));
const rows = computed(() => records.value.slice(page.value * 100, (page.value + 1) * 100));
const receipts = computed(() => {
  const record = current.value;
  return record
    ? directTraceReceipts(
        record,
        data.value?.trace.records ?? [],
        data.value?.result?.receiptEntries ?? [],
      )
    : [];
});
const effects = computed(() => receipts.value.filter(entry => entry.event !== 'CombatStepReached'));
const reads = computed(
  () => current.value?.observations.filter(value => value.kind === 'blackboard') ?? [],
);
const evaluations = computed(
  () => current.value?.observations.filter(value => value.kind !== 'blackboard') ?? [],
);
function displayValue(value: unknown): string {
  if (value === undefined) return t('executionTrace.missing');
  if (value === null) return 'null';
  if (typeof value === 'boolean') return t(`executionTrace.${value ? 'true' : 'false'}`);
  if (typeof value === 'number') return String(Number(value.toPrecision(12)));
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}
function evaluationLabel(input: unknown) {
  const kind = input && typeof input === 'object' && 'kind' in input ? String(input.kind) : '';
  const key = `actionGraphEditor.nodes.${kind}.name`;
  return te(key) ? t(key) : t('executionTrace.value');
}
function receiptLabel(event: string) {
  const key = `battleLog.receiptTypes.${event}`;
  return te(key) ? t(key) : event;
}
function receiptValue(key: string, value: unknown) {
  const label = `actionGraphEditor.options.${String(value)}`;
  if (key === 'damageType' && te(label)) return t(label);
  return displayValue(value);
}
function receiptFields(value: object | undefined) {
  return Object.entries(value ?? {}).filter(
    ([key, item]) =>
      !/(Id|Key)$/.test(key) &&
      item !== undefined &&
      item !== null &&
      typeof item !== 'object' &&
      te(`battleLog.receiptFields.${key}`),
  );
}
const childCalls = computed(() => (current.value ? visibleCalls(current.value) : []));
function visibleCalls(record: ExecutionTraceRecord) {
  return (navigation.value.children.get(record.sequence) ?? []).filter(call =>
    call.records.some(visibleRecord),
  );
}
function visibleRecord(record: ExecutionTraceRecord) {
  return showLifecycle.value || record.phase === 'execute' || record.phase === 'tick';
}
function title(record: ExecutionTraceRecord) {
  const source = getCompiledGraphLocation(record.program, record.nodeId);
  const action = source?.graph.nodes[source.nodeId]?.action;
  return action ? actionNodeTitle(action.kind) : record.nodeId;
}
function nodeLabel(record: ExecutionTraceRecord) {
  return getCompiledGraphLocation(record.program, record.nodeId)?.nodeId ?? record.nodeId;
}
function callLabel(call: ExecutionTraceCall) {
  const first = call.records.find(visibleRecord) ?? call.records[0]!;
  return [first.buffId, first.response?.name, nodeLabel(first)].filter(Boolean).join(' · ');
}
async function enter(call: ExecutionTraceCall, at = 0) {
  pause();
  activeCallId.value = call.id;
  selected.value = at;
  await nextTick();
  const target = current.value ?? records.value.at(-1);
  const source = target && getCompiledGraphLocation(target.program, target.nodeId);
  resource.value = target && !belongsToSkill(target) ? source?.resource : undefined;
  if (resource.value && source?.resource) {
    resourceEditor.changeGraph(
      source.macroId === null ? { kind: 'main' } : { kind: 'macro', macroId: source.macroId },
    );
    resourceEditor.selectNode(source.nodeId);
  } else if (source) {
    await skillGraph.value?.showGraphNode(source.graph, source.nodeId);
  }
}
function leave() {
  const call = activeCall.value;
  if (!call.parent || !call.caller) return;
  const visible = call.parent.records.filter(
    r => showLifecycle.value || r.phase === 'execute' || r.phase === 'tick',
  );
  const caller = visible.findIndex(r => r.sequence === call.caller!.sequence);
  void enter(call.parent, caller + 1);
}
function selectStack(call: ExecutionTraceCall) {
  const child = stack.value.find(entry => entry.parent === call);
  const rows = call.records.filter(visibleRecord);
  const index = rows.findIndex(record => record.sequence === child?.caller?.sequence);
  void enter(call, Math.max(0, index));
}
function select(index: number) {
  pause();
  selected.value = Math.max(0, Math.min(index, records.value.length - 1));
}
watch(
  location,
  source => {
    if (resource.value) {
      const graph =
        resourceEditor.address.kind === 'main'
          ? resource.value.main
          : resource.value.macros[resourceEditor.address.macroId]?.graph;
      if (source && toRaw(source.graph) === toRaw(graph)) resourceEditor.selectNode(source.nodeId);
      else resourceView.selection = null;
    } else skillGraph.value?.highlightGraphNode(source?.graph, source?.nodeId);
  },
  { flush: 'post' },
);
async function locate() {
  if (external.value) {
    const source = location.value;
    if (!source?.resource) return;
    resource.value = source.resource;
    resourceEditor.changeGraph(
      source.macroId === null ? { kind: 'main' } : { kind: 'macro', macroId: source.macroId },
    );
    resourceEditor.selectNode(source.nodeId);
    await nextTick();
    resourceEditor.canvas?.focusNode(source.nodeId);
    return;
  }
  if (location.value)
    await skillGraph.value?.locateGraphNode(location.value.graph, location.value.nodeId);
}
onMounted(async () => {
  // 先呈现诊断窗口；本地完整重跑与普通预览结果相互独立。
  await new Promise(resolve => setTimeout(resolve, 30));
  if (disposed) return;
  try {
    data.value = props.run();
    error.value = data.value.error ?? '';
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : String(cause);
  } finally {
    busy.value = false;
  }
});
</script>

<template>
  <SkillGraphEditorDialog
    ref="skillGraph"
    :definition="definition"
    :presentation="presentation"
    :reference-choices="referenceChoices"
    :label="label"
    :custom="Boolean(presentation)"
    :read-only="true"
    :allow-customize="false"
    :save-definition="() => {}"
    :alternate-graph="Boolean(resource)"
    execution-view
    @close="
      pause();
      emit('close');
    "
  >
    <template #alternate-graph>
      <ResourceGraphPanels
        area="canvas"
        :resource-graph-editor="resourceEditor"
        readonly
        :resource-key="String(activeCall.id)"
        :label="t('executionTrace.resource')"
        :canvas-view="resourceCamera"
        :execution-node-id="location?.nodeId"
        :execution-entries="executionEntries"
      >
        <template #world-overlay="{ nodes }">
          <aside
            v-if="executionReturn && nodes.length"
            class="call-return"
            :style="{
              left: `${Math.max(...nodes.map(node => node.x + node.width)) + 32}px`,
              top: `${Math.min(...nodes.map(node => node.y))}px`,
            }"
            @pointerdown.stop
          >
            <strong>{{ t('executionTrace.callReturn') }}</strong>
            <p>{{ executionReturn }}</p>
            <small>{{ t('executionTrace.callReturnScope') }}</small>
          </aside>
        </template>
      </ResourceGraphPanels>
    </template>
    <template #alternate-inspector>
      <ResourceGraphPanels
        area="inspector"
        :resource-graph-editor="resourceEditor"
        readonly
        :resource-key="String(activeCall.id)"
        :label="t('executionTrace.resource')"
        :reference-choices="referenceChoices"
      />
    </template>
    <template #toolbar>
      <div class="trace-toolbar">
        <EaButton
          size="sm"
          :disabled="busy || records.length < 2"
          :aria-pressed="playing"
          @click="togglePlayback"
        >
          {{ playing ? 'Ⅱ' : '▶' }}
          {{ t(playing ? 'executionTrace.pause' : 'executionTrace.play') }}
        </EaButton>
        <select
          v-model.number="stepsPerSecond"
          class="playback-speed"
          :aria-label="t('executionTrace.playbackSpeed')"
        >
          <option v-for="speed in [1, 2, 4, 8]" :key="speed" :value="speed">
            {{ t('executionTrace.stepsPerSecond', { count: speed }) }}
          </option>
        </select>
        <EaButton size="sm" :disabled="busy || selected <= 0" @click="select(selected - 1)"
          >← {{ t('executionTrace.previous') }}</EaButton
        >
        <EaButton
          size="sm"
          :disabled="busy || selected >= records.length - 1"
          @click="select(selected + 1)"
          >→ {{ t('executionTrace.stepOver') }}</EaButton
        >
        <details class="call-menu">
          <summary :class="{ unavailable: !childCalls.length }">
            ↳ {{ t('executionTrace.stepInto') }}
            <span v-if="childCalls.length">({{ childCalls.length }})</span>
          </summary>
          <div v-if="childCalls.length" class="call-options">
            <button
              v-for="call in childCalls"
              :key="call.id"
              @click="
                enter(call);
                ($event.currentTarget as HTMLElement).closest('details')?.removeAttribute('open');
              "
            >
              {{ callLabel(call) }} · {{ call.records[0]!.frame }}f
            </button>
          </div>
        </details>
        <EaButton size="sm" :disabled="!activeCall.parent" @click="leave"
          >↰ {{ t('executionTrace.stepOut') }}</EaButton
        >
        <EaButton size="sm" :disabled="!location" @click="locate">{{
          t('executionTrace.locate')
        }}</EaButton>
        <span class="trace-position"
          >{{ current ? `${current.frame}f` : '' }} · {{ Math.min(records.length, selected + 1) }} /
          {{ records.length }}</span
        >
      </div>
      <p v-if="busy || error || data?.trace.truncated" class="trace-status" role="status">
        {{ error || (busy ? t('executionTrace.loading') : t('executionTrace.truncated')) }}
      </p>
    </template>
    <template #navigation>
      <section class="trace-dock">
        <template v-if="!busy">
          <nav class="trace-controls" :aria-label="t('executionTrace.callStack')">
            <strong>{{ t('executionTrace.callStack') }}</strong>
            <EaButton
              v-for="call in stack"
              :key="call.id"
              :disabled="call === activeCall"
              @click="selectStack(call)"
            >
              {{
                call.caller ? `${nodeLabel(call.caller)} → ${nodeLabel(call.records[0]!)}` : label
              }}
            </EaButton>
            <EaButton
              v-if="activeCall.id !== 0 && !activeCall.parent"
              @click="enter(navigation.root)"
              >{{ label }}</EaButton
            >
          </nav>
          <details v-if="navigation.associated.length">
            <summary>{{ t('executionTrace.associated') }}</summary>
            <EaButton v-for="call in navigation.associated" :key="call.id" @click="enter(call)"
              >{{ callLabel(call) }} · {{ call.records[0]!.frame }}f</EaButton
            >
          </details>
          <div class="history-heading">
            <strong>{{ t('executionTrace.history') }}</strong>
            <span v-if="records.length && !current">{{ t('executionTrace.finished') }}</span>
            <label
              ><input v-model="showLifecycle" type="checkbox" @change="selected = 0" />
              {{ t('executionTrace.lifecycle') }}</label
            >
          </div>
          <p v-if="!records.length">{{ t('executionTrace.empty') }}</p>
          <div v-else>
            <aside class="trace-list">
              <div class="history-paging" v-if="records.length > 100">
                <EaButton :disabled="page === 0" @click="select((page - 1) * 100)">←</EaButton>
                <EaButton
                  :disabled="(page + 1) * 100 >= records.length"
                  @click="select((page + 1) * 100)"
                  >→</EaButton
                >
              </div>
              <button
                v-for="(row, index) in rows"
                :key="row.sequence"
                class="trace-row"
                :class="{ active: row === current }"
                @click="select(page * 100 + index)"
              >
                <small
                  >#{{ row.sequence + 1 }} · {{ row.frame }}f ·
                  {{ t(`executionTrace.${row.phase}`) }}</small
                >
                {{ title(row) }}
                <small v-if="!belongsToSkill(row)">{{ t('executionTrace.related') }}</small>
                <small v-if="visibleCalls(row).length">{{
                  t('executionTrace.callCount', {
                    count: visibleCalls(row).length,
                  })
                }}</small>
              </button>
            </aside>
          </div>
        </template>
      </section>
    </template>
    <template #inspector-before>
      <aside v-if="current" class="trace-details">
        <header class="execution-heading">
          <small>{{ t('executionTrace.current') }}</small>
          <h3>{{ title(current) }}</h3>
          <div class="execution-meta">
            <span>{{ current.frame }}f</span><span>#{{ current.sequence + 1 }}</span
            ><span>{{ t(`executionTrace.${current.phase}`) }}</span>
          </div>
          <code class="node-identity" :title="nodeLabel(current)">{{ nodeLabel(current) }}</code>
        </header>
        <section class="inspection-section">
          <h4>{{ t('executionTrace.outcome') }}</h4>
          <p v-if="current.failed" class="execution-error">{{ t('executionTrace.failed') }}</p>
          <dl v-else-if="current.result !== undefined" class="inspection-values">
            <dt>{{ t('executionTrace.result') }}</dt>
            <dd>{{ displayValue(current.result) }}</dd>
          </dl>
          <p v-else class="muted">{{ t('executionTrace.noReturn') }}</p>
          <button
            v-if="activeCall.caller"
            class="inspection-link"
            @click="selectStack(activeCall.parent!)"
          >
            {{ t('executionTrace.calledFrom', { node: nodeLabel(activeCall.caller) }) }} ↗
          </button>
          <div v-if="childCalls.length" class="inspection-calls">
            <small>{{ t('executionTrace.callCount', { count: childCalls.length }) }}</small>
            <button
              v-for="call in childCalls"
              :key="call.id"
              class="inspection-link"
              @click="enter(call)"
            >
              {{ callLabel(call) }} ↗
            </button>
          </div>
        </section>
        <section class="inspection-section">
          <h4>{{ t('executionTrace.evaluations') }}</h4>
          <p v-if="!current.observations.length" class="muted">
            {{ t('executionTrace.noValues') }}
          </p>
          <div v-for="(observation, index) in evaluations" :key="index" class="evaluation-row">
            <div class="evaluation-result">
              <span>{{ evaluationLabel(observation.input) }}</span
              ><strong>{{ displayValue(observation.result) }}</strong>
            </div>
            <details>
              <summary>{{ t('executionTrace.expression') }}</summary>
              <pre>{{ JSON.stringify(observation.input, null, 2) }}</pre>
            </details>
          </div>
          <template v-if="reads.length">
            <h5>{{ t('executionTrace.reads') }}</h5>
            <p class="muted compact">{{ t('executionTrace.readOrder') }}</p>
            <dl class="inspection-values read-values">
              <template v-for="(observation, index) in reads" :key="index"
                ><dt>
                  <code :title="String(observation.input)">{{ observation.input }}</code>
                </dt>
                <dd>{{ displayValue(observation.result) }}</dd></template
              >
            </dl>
          </template>
        </section>
        <section class="inspection-section">
          <h4>
            {{ t('executionTrace.directEffects') }} <span class="count">{{ effects.length }}</span>
          </h4>
          <p v-if="!effects.length" class="muted">{{ t('executionTrace.noEffects') }}</p>
          <article v-for="receipt in effects" :key="receipt.sequence" class="effect-card">
            <header>
              <strong>{{ receiptLabel(receipt.event) }}</strong
              ><small>#{{ receipt.sequence }}</small>
            </header>
            <dl v-if="receiptFields(receipt.data).length" class="inspection-values">
              <template v-for="[key, value] in receiptFields(receipt.data)" :key="key"
                ><dt>{{ t(`battleLog.receiptFields.${key}`) }}</dt>
                <dd>{{ receiptValue(key, value) }}</dd></template
              >
            </dl>
            <details>
              <summary>{{ t('battleLog.ui.rawReceipt') }}</summary>
              <pre>{{ JSON.stringify(receipt.data, null, 2) }}</pre>
            </details>
          </article>
        </section>
        <details class="inspection-section technical-details">
          <summary>{{ t('executionTrace.identity') }}</summary>
          <dl class="inspection-values">
            <dt>{{ t('executionTrace.invocation') }}</dt>
            <dd>
              <code>{{ current.invocation }}</code>
            </dd>
          </dl>
          <pre>{{ JSON.stringify(current.producer, null, 2) }}</pre>
          <details
            v-for="receipt in receipts.filter(entry => entry.event === 'CombatStepReached')"
            :key="receipt.sequence"
          >
            <summary>{{ receipt.event }} · #{{ receipt.sequence }}</summary>
            <pre>{{ JSON.stringify(receipt.data, null, 2) }}</pre>
          </details>
        </details>
      </aside>
    </template>
  </SkillGraphEditorDialog>
</template>

<style scoped>
.call-return {
  position: absolute;
  width: 260px;
  padding: 12px;
  box-sizing: border-box;
  border: 1px dashed var(--graph-muted);
  background: var(--graph-node-bg);
  color: var(--graph-text);
  font-size: 12px;
}
.call-return small {
  color: var(--graph-muted);
}
.trace-details {
  font-size: 12px;
  line-height: 1.5;
}
.execution-heading {
  padding: 6px 4px 12px;
}
.execution-heading h3 {
  margin: 4px 0 8px;
  font-size: 16px;
}
.execution-heading > small,
.muted,
.execution-meta,
.count {
  color: var(--el-text-color-secondary);
}
.execution-meta {
  display: flex;
  gap: 12px;
  font-variant-numeric: tabular-nums;
}
.node-identity {
  display: block;
  margin-top: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}
.inspection-section {
  border-top: 1px solid var(--ea-border);
  padding: 12px 4px;
}
.inspection-section h4 {
  margin: 0 0 10px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
}
.inspection-section h5 {
  margin: 12px 0 4px;
  font-size: 12px;
}
.inspection-values {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  column-gap: 12px;
  row-gap: 6px;
  margin: 8px 0;
}
.inspection-values dt {
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}
.inspection-values dd {
  text-align: right;
  margin: 0;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.read-values {
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 3px;
}
.compact {
  font-size: 11px;
  margin: 0 0 8px;
}
.evaluation-result,
.effect-card > header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: baseline;
}
.evaluation-result strong {
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.evaluation-row + .evaluation-row {
  margin-top: 12px;
}
.trace-details summary {
  cursor: pointer;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  margin-top: 6px;
}
.trace-details pre {
  background: var(--el-fill-color-light);
  padding: 8px;
  border-radius: 3px;
  max-height: 260px;
  overflow: auto;
}
.effect-card {
  padding: 8px;
  border: 1px solid var(--ea-border);
  border-radius: 3px;
  margin-top: 8px;
}
.effect-card > header small {
  color: var(--el-text-color-secondary);
}
.inspection-link {
  display: block;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 4px 0;
  color: var(--el-color-primary);
  cursor: pointer;
  overflow-wrap: anywhere;
  font-size: 12px;
}
.inspection-calls {
  margin-top: 10px;
}
.execution-error {
  color: var(--el-color-danger);
}
.trace-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--ea-border);
  flex-wrap: wrap;
  flex-shrink: 0;
}
.trace-position {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.playback-speed {
  padding: 5px 6px;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  border: 1px solid var(--ea-border);
  font-size: 12px;
}
.trace-status {
  padding: 6px 12px;
  margin: 0;
}
.call-menu {
  position: relative;
  font-size: 12px;
}
.call-menu > summary {
  padding: 6px 8px;
  cursor: pointer;
  list-style: none;
}
.call-menu > summary.unavailable {
  opacity: 0.4;
  pointer-events: none;
}
.call-options {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 20;
  min-width: 280px;
  max-width: 460px;
  max-height: 320px;
  overflow: auto;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--ea-border);
  box-shadow: var(--el-box-shadow-light);
}
.call-options button {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  color: inherit;
  border: 0;
  padding: 10px;
  cursor: pointer;
  overflow-wrap: anywhere;
}
.call-options button:hover {
  background: var(--el-fill-color);
}
.trace-controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-bottom: 1px solid var(--ea-border);
}
.trace-controls :deep(button) {
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: left;
  justify-content: flex-start;
}
.trace-dock {
  min-height: 0;
  overflow: auto;
  border-right: 1px solid var(--ea-border);
}
.history-heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  font-size: 12px;
}
.history-paging {
  display: flex;
  justify-content: space-between;
}
.trace-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.trace-list,
.trace-details {
  overflow: auto;
  padding: 8px;
}
.trace-row {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 8px;
  text-align: left;
  background: transparent;
  color: inherit;
  border: 1px solid transparent;
  cursor: pointer;
  overflow-wrap: anywhere;
  gap: 3px;
}
.trace-row.active {
  border-color: var(--el-color-primary);
  background: var(--el-fill-color);
}
.trace-row small {
  opacity: 0.65;
}
.trace-details pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-size: 12px;
}
</style>
