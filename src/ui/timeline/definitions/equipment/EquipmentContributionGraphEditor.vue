<script setup lang="ts">
import type { SkillStructureNode as StructureNodeContract } from '../skillStructureMindMapModel';
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import { useDefinitionGraphEditing } from '../useDefinitionGraphEditing';
import DefinitionPropertyScope from '../DefinitionPropertyScope.vue';
import InspectorFields from '../inspector/InspectorFields.vue';
import { modifierInspectorFields } from '../inspector/modifierInspectorSchema';
import {
  contributionBlackboardFields,
  handlerInspectorFields,
} from '../inspector/contributionInspectorSchema';
import {
  useDefinitionDraftHistory,
  type DefinitionDraftHistory,
} from '../useDefinitionDraftHistory';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import type {
  EquipmentContributionDefinition,
  EquipmentEventHandlerDefinition,
  EquipmentModifierDefinition,
} from '../../../../core/game-data/equipmentDefinition';
import {
  type CombatCondition,
  type CombatStepDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  buildEquipmentContributionMindMap,
  findSkillStructureNodeForPath,
} from '../skillStructureMindMapModel';
import {
  appendCombatStepInStructure,
  cloneStructureValue,
  deleteStructureValueAtPath,
  insertStructureArrayItem,
  moveStructureArrayItem,
  removeStructureArrayItem,
  replaceStructureValueAtPath,
  resolveStructureValue,
} from '../skillStructureEditorCommands';
import {
  createSkillEditorStep,
  duplicateSkillEditorDetachedStep,
  type EditableCombatStepKind,
} from '../skills/skillDefinitionEditorViewModel';
import SkillStructureMindMap from '../SkillStructureMindMap.vue';
import CombatEventTriggerEditor from '../actions/CombatEventTriggerEditor.vue';
import CombatStepEditor from '../actions/CombatStepEditor.vue';
import StepTypePicker from '../actions/StepTypePicker.vue';
import EquipmentContributionTypePicker from './EquipmentContributionTypePicker.vue';
import CombatConditionEditor from '../actions/CombatConditionEditor.vue';
import CombatConditionTypePicker from '../actions/CombatConditionTypePicker.vue';
import EquipmentBuffDefinitionsDialog from './EquipmentBuffDefinitionsDialog.vue';

type ContributionPayloadKind = NonNullable<StructureNodeContract['payloadKind']>;
interface ContributionOperationNode {
  readonly id: string;
  readonly sourcePath: string;
  readonly payloadKind?: ContributionPayloadKind;
  readonly acceptsChildKind?: ContributionPayloadKind;
}

const props = defineProps<{
  contribution: EquipmentContributionDefinition;
  label: string;
  level: number;
  /** The host reserves a bounded workspace; only canvas and Inspector scroll. */
  fillAvailable?: boolean;
  sharedHistory?: DefinitionDraftHistory<EquipmentContributionDefinition>;
}>();
const emit = defineEmits<{ update: [contribution: EquipmentContributionDefinition] }>();
const selectedPath = ref('');
const selectedId = ref('equipment:contribution');
const selectedPayloadKind = ref<ContributionPayloadKind>();
const pendingAdd = ref<{
  readonly kind: 'step' | 'modifier' | 'handler' | 'condition';
  readonly targetPath: string;
  readonly anchor: { readonly x: number; readonly y: number };
} | null>(null);
const pickerKey = ref(0);
const editorRoot = ref<HTMLElement | null>(null);
const map = ref<{ revealNode(id: string): Promise<void> } | null>(null);
const history =
  props.sharedHistory ??
  useDefinitionDraftHistory(
    () => props.contribution,
    value => emit('update', value),
  );
useEditorHistoryShortcuts(editorRoot, history.restore, () => props.sharedHistory === undefined);
const showBuffDefinitions = ref(false);
watch(
  () => history.restoredLocation?.value,
  location => {
    if (location) showBuffDefinitions.value = location.page?.startsWith('buff:') === true;
  },
  { immediate: true, flush: 'sync' },
);
const clipboard = shallowRef<
  | { readonly kind: 'equipmentModifier'; readonly value: EquipmentModifierDefinition }
  | { readonly kind: 'equipmentHandler'; readonly value: EquipmentEventHandlerDefinition }
  | { readonly kind: 'combatStep'; readonly value: CombatStepDefinition }
  | { readonly kind: 'combatCondition'; readonly value: CombatCondition }
>();
const structure = computed(() =>
  buildEquipmentContributionMindMap(props.contribution, props.label),
);
const editing = useDefinitionGraphEditing({
  read: () => props.contribution,
  history,
  root: structure,
  selectedPath,
  element: editorRoot,
  selectPath,
});
const selectedValue = computed(() => resolveStructureValue(props.contribution, selectedPath.value));
const selectedModifier = computed(() =>
  /^modifiers\[\d+\]$/.test(selectedPath.value)
    ? (selectedValue.value as EquipmentModifierDefinition)
    : null,
);
const selectedHandler = computed(() =>
  /^eventHandlers\[\d+\]$/.test(selectedPath.value)
    ? (selectedValue.value as EquipmentEventHandlerDefinition)
    : null,
);
const selectedStep = computed(() =>
  /\.steps\[\d+\]$/.test(selectedPath.value) ? (selectedValue.value as CombatStepDefinition) : null,
);
const selectedCondition = computed(() =>
  selectedPayloadKind.value === 'combatCondition' ? (selectedValue.value as CombatCondition) : null,
);

// The host keys this editor by the active editing context. A display label is mutable
// and is not an identity: renaming must not discard this context's history.

function selectNode(node: {
  id: string;
  sourcePath: string;
  payloadKind?: ContributionPayloadKind;
}): void {
  editing.cancelReveal();
  selectedId.value = node.id;
  selectedPath.value = node.sourcePath;
  selectedPayloadKind.value = node.payloadKind;
}

function beginAdd(
  node: ContributionOperationNode & {
    readonly canAddChild?: StructureNodeContract['canAddChild'];
  },
  anchor: { readonly x: number; readonly y: number },
): void {
  const kind =
    node.canAddChild === 'step'
      ? 'step'
      : node.canAddChild === 'equipmentModifier'
        ? 'modifier'
        : node.canAddChild === 'equipmentHandler'
          ? 'handler'
          : node.canAddChild === 'combatCondition'
            ? 'condition'
            : null;
  if (kind === null) return;
  selectNode(node);
  pendingAdd.value = { kind, targetPath: node.sourcePath, anchor };
  pickerKey.value += 1;
}

function commit(next: EquipmentContributionDefinition): void {
  history.commit(next, { path: selectedPath.value });
}

function replaceSelected(value: unknown): void {
  if (selectedPath.value === '') return;
  commit(replaceStructureValueAtPath(props.contribution, selectedPath.value, value));
}

async function restoreHistory(action: 'undo' | 'redo'): Promise<void> {
  history.restore(action);
}

function childArrayPath(
  node: ContributionOperationNode,
  kind: ContributionPayloadKind,
): string | undefined {
  if (node.acceptsChildKind !== kind) return undefined;
  if (kind === 'combatStep') return `${node.sourcePath}.steps`;
  if (kind === 'combatCondition') return `${node.sourcePath}.conditions`;
  return node.sourcePath;
}

function insertionTarget(
  node: ContributionOperationNode,
  kind: ContributionPayloadKind,
  placement: 'inside' | 'before' | 'after',
): { readonly arrayPath: string; readonly index?: number } | undefined {
  if (placement === 'inside') {
    const arrayPath = childArrayPath(node, kind);
    return arrayPath === undefined ? undefined : { arrayPath };
  }
  const match = /^(.*)\[(\d+)\]$/.exec(node.sourcePath);
  if (match === null || node.payloadKind !== kind) return undefined;
  return { arrayPath: match[1]!, index: Number(match[2]) + (placement === 'after' ? 1 : 0) };
}

async function selectPath(path: string): Promise<void> {
  await nextTick();
  const node = findSkillStructureNodeForPath(structure.value, path);
  selectedPath.value = node.sourcePath;
  selectedId.value = node.id;
  selectedPayloadKind.value = node.payloadKind;
  await nextTick();
  await map.value?.revealNode(node.id);
}

async function moveNode(operation: {
  readonly source: ContributionOperationNode;
  readonly target: ContributionOperationNode;
  readonly placement: 'inside' | 'before' | 'after';
}): Promise<void> {
  const kind = operation.source.payloadKind;
  if (kind === undefined || kind === 'scheduledSequence' || kind === 'childSkill') return;
  if (kind === 'combatCondition') {
    const source = /^(.*\.conditions)\[(\d+)\]$/.exec(operation.source.sourcePath);
    if (source === null) return;
    const siblings = resolveStructureValue(props.contribution, source[1]!) as readonly unknown[];
    if (siblings.length <= 1) return;
  }
  const target = insertionTarget(operation.target, kind, operation.placement);
  if (target === undefined) return;
  const result = moveStructureArrayItem(
    props.contribution,
    operation.source.sourcePath,
    target.arrayPath,
    target.index,
  );
  commit(result.root);
  await selectPath(result.itemPath);
}

function duplicateStep(step: CombatStepDefinition): CombatStepDefinition {
  return duplicateSkillEditorDetachedStep(editorSkillDraft(), step);
}

function editorSkillDraft() {
  return {
    key: 'equipment-contribution',
    timelineBlockFrames: 0,
    scheduledSequences: (props.contribution.eventHandlers ?? []).map(handler => ({
      startFrame: 0,
      sequence: handler.sequence,
    })),
  };
}

async function appendModifier(modifier: EquipmentModifierDefinition): Promise<void> {
  const pending = pendingAdd.value;
  if (pending?.kind !== 'modifier') return;
  const result = insertStructureArrayItem(props.contribution, pending.targetPath, modifier);
  pendingAdd.value = null;
  commit(result.root);
  await selectPath(result.itemPath);
}

async function appendHandler(handler: EquipmentEventHandlerDefinition): Promise<void> {
  const pending = pendingAdd.value;
  if (pending?.kind !== 'handler') return;
  const result = insertStructureArrayItem(props.contribution, pending.targetPath, handler);
  pendingAdd.value = null;
  commit(result.root);
  await selectPath(result.itemPath);
}

async function appendStep(kind: EditableCombatStepKind): Promise<void> {
  const pending = pendingAdd.value;
  if (pending?.kind !== 'step') return;
  const result = appendCombatStepInStructure(
    props.contribution,
    pending.targetPath,
    createSkillEditorStep(editorSkillDraft(), kind),
  );
  pendingAdd.value = null;
  commit(result.root);
  await selectPath(result.stepPath);
}

async function appendCondition(condition: CombatCondition): Promise<void> {
  const pending = pendingAdd.value;
  if (pending?.kind !== 'condition') return;
  const target = resolveStructureValue(props.contribution, pending.targetPath) as
    EquipmentEventHandlerDefinition | CombatCondition;
  if ('kind' in target && (target.kind === 'all' || target.kind === 'any')) {
    const result = insertStructureArrayItem(
      props.contribution,
      `${pending.targetPath}.conditions`,
      condition,
    );
    pendingAdd.value = null;
    commit(result.root);
    await selectPath(result.itemPath);
    return;
  }
  const conditionPath = `${pending.targetPath}.condition`;
  pendingAdd.value = null;
  commit(replaceStructureValueAtPath(props.contribution, conditionPath, condition));
  await selectPath(conditionPath);
}

async function nodeAction(
  action: 'delete' | 'copy' | 'paste',
  node: ContributionOperationNode,
): Promise<void> {
  const kind = node.payloadKind;
  if (action === 'copy') {
    if (
      kind !== 'equipmentModifier' &&
      kind !== 'equipmentHandler' &&
      kind !== 'combatStep' &&
      kind !== 'combatCondition'
    )
      return;
    clipboard.value = {
      kind,
      value: cloneStructureValue(resolveStructureValue(props.contribution, node.sourcePath)),
    } as typeof clipboard.value;
    return;
  }
  if (action === 'delete' && kind !== undefined) {
    if (kind === 'combatCondition') {
      const child = /^(.*\.conditions)\[\d+\]$/.exec(node.sourcePath);
      if (child !== null) {
        const siblings = resolveStructureValue(props.contribution, child[1]!) as readonly unknown[];
        if (siblings.length <= 1) return;
        commit(removeStructureArrayItem(props.contribution, node.sourcePath));
        await selectPath(child[1]!.replace(/\.conditions$/, ''));
        return;
      }
      if (!/^eventHandlers\[\d+\]\.condition$/.test(node.sourcePath)) return;
      commit(deleteStructureValueAtPath(props.contribution, node.sourcePath));
      await selectPath(node.sourcePath.replace(/\.condition$/, ''));
      return;
    }
    commit(removeStructureArrayItem(props.contribution, node.sourcePath));
    await selectPath(node.sourcePath.replace(/\[[0-9]+\]$/, ''));
    return;
  }
  const copied = clipboard.value;
  if (action !== 'paste' || copied === undefined) return;
  const arrayPath = childArrayPath(node, copied.kind);
  if (arrayPath === undefined) return;
  const value =
    copied.kind === 'combatStep' ? duplicateStep(copied.value) : cloneStructureValue(copied.value);
  const result = insertStructureArrayItem(props.contribution, arrayPath, value);
  commit(result.root);
  await selectPath(result.itemPath);
}

function createInitializationSequence(
  field: 'enableSequence' | 'initializationSequence' = 'initializationSequence',
): void {
  if (props.contribution[field] !== undefined) return;
  commit({ ...props.contribution, [field]: { steps: [] } });
}

async function removeInitializationSequence(
  field: 'enableSequence' | 'initializationSequence' = 'initializationSequence',
): Promise<void> {
  if (props.contribution[field] === undefined) return;
  commit(deleteStructureValueAtPath(props.contribution, field));
  await selectPath('');
}
</script>

<template>
  <div
    v-if="!showBuffDefinitions"
    ref="editorRoot"
    class="contribution-editor"
    :class="{ 'fill-available': fillAvailable }"
  >
    <SkillStructureMindMap
      class="contribution-map"
      ref="map"
      :root="structure"
      :selected-id="selectedId"
      :show-reference-pins="false"
      :clipboard-kind="clipboard?.kind"
      :can-undo="history.canUndo.value"
      :can-redo="history.canRedo.value"
      @select="selectNode"
      @add-child="beginAdd"
      @move-node="moveNode"
      @node-action="nodeAction"
      @history-action="restoreHistory"
    />
    <StepTypePicker
      v-if="pendingAdd?.kind === 'step'"
      :key="`step:${pickerKey}`"
      hide-trigger
      open-on-mount
      :anchor="pendingAdd.anchor"
      @select="appendStep"
      @close="pendingAdd = null"
    />
    <EquipmentContributionTypePicker
      v-if="pendingAdd?.kind === 'modifier' || pendingAdd?.kind === 'handler'"
      :key="`equipment:${pickerKey}`"
      :mode="pendingAdd.kind"
      :anchor="pendingAdd.anchor"
      :level-count="level"
      :handler-keys="(contribution.eventHandlers ?? []).map(handler => handler.key)"
      @modifier="appendModifier"
      @handler="appendHandler"
      @close="pendingAdd = null"
    />
    <CombatConditionTypePicker
      v-if="pendingAdd?.kind === 'condition'"
      :key="`condition:${pickerKey}`"
      :anchor="pendingAdd.anchor"
      @select="appendCondition"
      @close="pendingAdd = null"
    />
    <aside class="contribution-inspector">
      <template v-if="selectedModifier">
        <header>
          <strong>属性修正</strong><span>{{ selectedModifier.kind }}</span>
        </header>
        <InspectorFields
          :value="selectedModifier"
          :binding="editing.property.value"
          :fields="modifierInspectorFields(selectedModifier)"
          :current-level="level"
        />
      </template>
      <DefinitionPropertyScope v-else-if="selectedCondition" :property="editing.property.value">
        <CombatConditionEditor :condition="selectedCondition" layer-only />
      </DefinitionPropertyScope>
      <template v-else-if="selectedHandler">
        <header>
          <strong>事件响应</strong><span>{{ selectedHandler.key }}</span>
        </header>
        <InspectorFields
          :value="selectedHandler"
          :binding="editing.property.value"
          :fields="handlerInspectorFields(selectedHandler)"
          :current-level="level"
        />
        <CombatEventTriggerEditor
          v-if="selectedHandler.abilityEvent === undefined"
          :event="selectedHandler.event"
          :binding="editing.property.value.child('event')"
        />
        <p class="hint">响应条件与动作序列作为子节点显示在画布中；右侧只编辑当前层。</p>
      </template>
      <DefinitionPropertyScope v-else-if="selectedStep" :property="editing.property.value">
        <CombatStepEditor
          :step="selectedStep"
          :skill-level="level"
          :show-header="false"
          inspector-only
          @update="replaceSelected"
        />
      </DefinitionPropertyScope>
      <template v-else>
        <header>
          <strong>{{ label }}</strong
          ><span>当前层</span>
        </header>
        <p class="hint">在画布中选择属性修正、事件响应或响应序列里的步骤进行编辑。</p>
        <section class="root-section">
          <header>
            <strong>附属 Buff 定义</strong
            ><span>{{ Object.keys(contribution.buffDefinitions ?? {}).length }} 项</span>
          </header>
          <p class="hint">属于当前武器词条、装备词条或套装贡献；事件和初始化步骤按 ID 引用。</p>
          <button class="section-action" @click="showBuffDefinitions = true">
            打开 Buff 工作区
          </button>
        </section>
        <section class="root-section">
          <header><strong>能力初始黑板</strong><span>按词条等级解析</span></header>
          <p class="hint">初始化和所有事件响应共用这份能力黑板，不属于主动技能的初始黑板。</p>
          <InspectorFields
            :value="contribution"
            :binding="editing.context.root"
            :fields="contributionBlackboardFields"
            :current-level="level"
          />
        </section>
        <section class="root-section">
          <header><strong>启用前安装</strong><span>每场战斗一次</span></header>
          <p class="hint">安装普通启动 Buff；此阶段自身事件监听尚未启用，黑板与后续响应共享。</p>
          <button
            v-if="contribution.enableSequence === undefined"
            class="section-action"
            @click="createInitializationSequence('enableSequence')"
          >
            ＋ 创建启用前序列
          </button>
          <button
            v-else
            class="section-action danger"
            @click="removeInitializationSequence('enableSequence')"
          >
            删除启用前序列
          </button>
        </section>
        <section class="root-section">
          <header><strong>启用后初始化</strong><span>每场战斗一次</span></header>
          <p class="hint">自身监听已启用后执行，例如 Toggle 初次安装和固定构筑属性刷新。</p>
          <button
            v-if="contribution.initializationSequence === undefined"
            class="section-action"
            @click="createInitializationSequence()"
          >
            ＋ 创建初始化序列
          </button>
          <button v-else class="section-action danger" @click="removeInitializationSequence()">
            删除初始化序列
          </button>
        </section>
      </template>
    </aside>
  </div>
  <EquipmentBuffDefinitionsDialog
    v-else
    :visible="true"
    :contribution="contribution"
    :shared-history="history"
    :manage-keyboard="sharedHistory === undefined"
    :reference-root="contribution"
    :level="level"
    @update:visible="showBuffDefinitions = $event"
  />
</template>

<style scoped>
.contribution-editor {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    var(--definition-inspector-width, clamp(320px, 25vw, 420px));
  min-height: 520px;
  border: 1px solid var(--ea-border-soft);
}
.contribution-map {
  min-width: 0;
  min-height: 520px;
}
.contribution-inspector {
  min-width: 0;
  padding: 14px;
  overflow: auto;
  border-left: 1px solid var(--ea-border-soft);
  background: var(--ea-workbench-panel);
  container-type: inline-size;
}
.contribution-editor.fill-available {
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
}
.fill-available .contribution-map {
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  container-type: inline-size;
  container-name: equipment-map;
}
@container equipment-map (max-width: 480px) {
  .fill-available :deep(.map-gesture-hint) {
    display: none;
  }
}
.fill-available :deep(.map-toolbar) {
  min-height: 38px;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 10px;
}
.fill-available .contribution-inspector {
  min-height: 0;
  overscroll-behavior: contain;
}
header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}
header span,
.hint,
label span,
label small {
  color: var(--ea-fg-muted);
}
label {
  display: grid;
  gap: 6px;
  margin-top: 14px;
  font-size: 11px;
}
input,
select {
  width: 100%;
  min-width: 0;
  height: 32px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
fieldset {
  margin: 14px 0 0;
  padding: 10px;
  border: 1px solid var(--ea-border-soft);
}
legend {
  padding: 0 5px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.readout {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  gap: 8px;
  margin-top: 10px;
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.readout code {
  min-width: 0;
  color: var(--ea-fg-secondary);
  overflow-wrap: anywhere;
}
.hint {
  line-height: 1.55;
}
.root-section {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--ea-border-soft);
}
.root-section header {
  border-bottom: 0;
  padding-bottom: 5px;
}
.contribution-inspector header {
  flex-wrap: wrap;
  overflow-wrap: anywhere;
}
.section-action {
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg-secondary);
  cursor: pointer;
}
.section-action {
  min-height: 30px;
  margin-top: 8px;
}
.section-action.danger {
  color: #e69a7a;
}
@media (max-width: 820px) {
  .contribution-editor.fill-available {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 38%);
  }
  .fill-available .contribution-inspector {
    border-left: 1px solid var(--ea-border-soft);
    border-top: 0;
  }
  .contribution-editor {
    grid-template-columns: 1fr;
  }
  .contribution-inspector {
    min-height: 260px;
    border-left: 0;
    border-top: 1px solid var(--ea-border-soft);
  }
}
@media (max-width: 560px) {
  .contribution-editor.fill-available {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  }
}
</style>
