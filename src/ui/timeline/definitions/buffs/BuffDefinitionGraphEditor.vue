<script setup lang="ts">
import { ElIcon } from 'element-plus';
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import {
  isBuffGraphPayload,
  isBuffGraphClipboard,
  pasteBuffGraphNode,
  moveBuffGraphNode,
  type BuffGraphClipboard,
} from './buffGraphOperations';
import type { SkillStructureNode as StructureNodeContract } from '../skillStructureMindMapModel';
import { useInteractionSession } from '../../../interaction/interactionSessionContext';
import { usePopoverInteractionBoundary } from '../../../interaction/usePopoverInteractionBoundary';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
  type CSSProperties,
} from 'vue';
import { ArrowDown, ArrowUp, CopyDocument, Delete } from '@element-plus/icons-vue';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import type {
  CombatCondition,
  CombatEventResponseDefinition,
  CombatStepDefinition,
  ScheduledSequenceDefinition,
  SkillBuffAbilityEventResponse,
  SkillBuffDefinition,
  SkillBuffIgniteEventResponse,
  SkillDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  createCombatEventResponseDraft,
  createSkillEditorStep,
  createBuffAbilityEventResponseDraft,
  createBuffIgniteEventResponseDraft,
  duplicateSkillEditorDetachedStep,
  type EditableCombatStepKind,
} from '../skills/skillDefinitionEditorViewModel';
import {
  buildBuffStructureMindMap,
  findSkillStructureNodeForPath,
  indexSkillStructureNodes,
} from '../skillStructureMindMapModel';
import {
  appendCombatStepInStructure,
  cloneStructureValue,
  deleteStructureValueAtPath,
  duplicateCombatStepInStructure,
  insertStructureArrayItem,
  moveStructureArrayItem,
  moveCombatStepInStructure,
  removeCombatStepInStructure,
  removeStructureArrayItem,
  replaceStructureValueAtPath,
  resolveStructureValue,
} from '../skillStructureEditorCommands';
import BuffStepEditor from './BuffStepEditor.vue';
import BuffDetailNodeInspector from './BuffDetailNodeInspector.vue';
import { isBuffDetailNode, appendBuffGraphChild } from './buffDamageModifierGraph';
import BuffEventResponseInspector from './BuffEventResponseInspector.vue';
import CombatConditionEditor from '../actions/CombatConditionEditor.vue';
import CombatConditionTypePicker from '../actions/CombatConditionTypePicker.vue';
import CombatEventResponseInspector from '../actions/CombatEventResponseInspector.vue';
import CombatStepEditor from '../actions/CombatStepEditor.vue';
import DefinitionPropertyScope from '../DefinitionPropertyScope.vue';
import { useDefinitionGraphEditing } from '../useDefinitionGraphEditing';
import SkillStructureMindMap from '../SkillStructureMindMap.vue';
import StepTypePicker from '../actions/StepTypePicker.vue';
import {
  useDefinitionDraftHistory,
  type DefinitionDraftHistory,
} from '../useDefinitionDraftHistory';

const LIFECYCLE_KEYS = [
  'start',
  'enable',
  'disable',
  'beforeEnhance',
  'enhanceChanged',
  'afterEnhance',
  'trigger',
  'finish',
] as const;
type StructureOperationNode = {
  readonly id: string;
  readonly sourcePath: string;
  readonly payloadKind?: StructureNodeContract['payloadKind'];
  readonly acceptsChildKind?: StructureNodeContract['acceptsChildKind'];
};

const props = defineProps<{
  buffId: string;
  definition: SkillBuffDefinition;
  skillLevel: number;
  fillAvailable?: boolean;
  sharedHistory?: DefinitionDraftHistory<SkillBuffDefinition>;
}>();
const emit = defineEmits<{ update: [definition: SkillBuffDefinition] }>();
const editorRoot = ref<HTMLElement | null>(null);
const selectedId = ref('buff');
const selectedPath = ref('');
const pendingMode = ref<'step' | 'lifecycle' | ''>('');
usePopoverInteractionBoundary(
  useInteractionSession(),
  () => pendingMode.value === 'lifecycle',
  () => {
    pendingMode.value = '';
  },
);
const pendingConditionTargetPath = ref('');
const pickerKey = ref(0);
const insertAnchor = ref({ x: 0, y: 0 });
const structureClipboard = shallowRef<
  | BuffGraphClipboard
  | { readonly kind: 'combatStep'; readonly value: CombatStepDefinition }
  | { readonly kind: 'scheduledSequence'; readonly value: ScheduledSequenceDefinition }
  | { readonly kind: 'combatCondition'; readonly value: CombatCondition }
  | { readonly kind: 'eventResponse'; readonly value: CombatEventResponseDefinition }
  | { readonly kind: 'buffAbilityResponse'; readonly value: SkillBuffAbilityEventResponse }
  | { readonly kind: 'buffIgniteResponse'; readonly value: SkillBuffIgniteEventResponse }
>();
const localHistory = useDefinitionDraftHistory(
  () => props.definition,
  value => emit('update', value),
);
const history = props.sharedHistory ?? localHistory;
useEditorHistoryShortcuts(editorRoot, history.restore, () => props.sharedHistory === undefined);
const lifecyclePicker = ref<HTMLElement>();
const map = ref<{
  revealNode: (id: string) => Promise<void>;
  transferCollapsedState: (fromId: string, toId: string) => void;
} | null>(null);
const root = computed(() => buildBuffStructureMindMap(props.buffId, props.definition));
const nodeIndex = computed(() => indexSkillStructureNodes(root.value));
const editing = useDefinitionGraphEditing({
  read: () => props.definition,
  history,
  root,
  selectedPath,
  element: editorRoot,
  selectPath,
});
const selectedNode = computed(() => nodeIndex.value.get(selectedId.value));
const selectedStep = computed(() =>
  selectedNode.value?.kind === '战斗步骤'
    ? (resolveStructureValue(props.definition, selectedPath.value) as CombatStepDefinition)
    : undefined,
);
const selectedCombatCondition = computed(() =>
  selectedNode.value?.payloadKind === 'combatCondition'
    ? (resolveStructureValue(props.definition, selectedPath.value) as CombatCondition)
    : undefined,
);
const selectedEventResponse = computed(() =>
  selectedNode.value?.payloadKind === 'eventResponse'
    ? (resolveStructureValue(props.definition, selectedPath.value) as CombatEventResponseDefinition)
    : undefined,
);
const selectedSequenceIndex = computed(() => {
  const match = /^scheduledSequences\[(\d+)\]$/.exec(selectedPath.value);
  return match === null ? undefined : Number(match[1]);
});
const selectedSequence = computed(() =>
  selectedSequenceIndex.value === undefined
    ? undefined
    : props.definition.scheduledSequences?.[selectedSequenceIndex.value],
);
const selectedAbilityResponse = computed(() =>
  selectedNode.value?.payloadKind === 'buffAbilityResponse'
    ? (resolveStructureValue(props.definition, selectedPath.value) as SkillBuffAbilityEventResponse)
    : undefined,
);
const selectedIgniteResponse = computed(() =>
  selectedNode.value?.payloadKind === 'buffIgniteResponse'
    ? (resolveStructureValue(props.definition, selectedPath.value) as SkillBuffIgniteEventResponse)
    : undefined,
);
const editingStep = computed<CombatStepForKind<'applyBuff'>>(() => ({
  kind: 'applyBuff',
  parameters: {
    buffId: props.buffId,
    target: 'caster',
    definition: props.definition,
  },
}));
const missingLifecycleKeys = computed(() =>
  LIFECYCLE_KEYS.filter(key => props.definition.lifecycleSequences?.[key] === undefined),
);
const lifecyclePickerStyle = computed<CSSProperties>(() => {
  const viewportWidth = typeof window === 'undefined' ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 720 : window.innerHeight;
  const width = Math.min(260, viewportWidth - 24);
  const estimatedHeight = Math.min(360, 48 + missingLifecycleKeys.value.length * 35);
  const left = Math.max(12, Math.min(insertAnchor.value.x, viewportWidth - width - 12));
  const openBelow =
    viewportHeight - insertAnchor.value.y >= estimatedHeight + 18 ||
    viewportHeight - insertAnchor.value.y >= insertAnchor.value.y;
  return {
    left: `${left}px`,
    width: `${width}px`,
    top: openBelow ? `${insertAnchor.value.y + 6}px` : undefined,
    bottom: openBelow ? undefined : `${viewportHeight - insertAnchor.value.y + 6}px`,
    maxHeight: `${Math.max(120, viewportHeight - 24)}px`,
  };
});

watch(
  () => props.buffId,
  () => {
    selectedId.value = 'buff';
    selectedPath.value = '';
    pendingMode.value = '';
    pendingConditionTargetPath.value = '';
  },
);

function context(): SkillDefinition {
  const runtimeSequences = [
    ...(props.definition.scheduledSequences ?? []),
    ...Object.values(props.definition.lifecycleSequences ?? {}).flatMap(sequence =>
      sequence === undefined ? [] : [{ startFrame: 0, sequence }],
    ),
    ...(props.definition.abilityEventResponses ?? []).map(response => ({
      startFrame: 0,
      sequence: response.sequence,
    })),
    ...(props.definition.igniteEventResponses ?? []).map(response => ({
      startFrame: 0,
      sequence: response.sequence,
    })),
  ];
  return {
    key: `buff:${props.buffId}`,
    timelineBlockFrames: 0,
    scheduledSequences: runtimeSequences,
  };
}
function createStep(kind: EditableCombatStepKind): CombatStepDefinition {
  return createSkillEditorStep(context(), kind);
}
function duplicateStep(step: CombatStepDefinition): CombatStepDefinition {
  return duplicateSkillEditorDetachedStep(context(), step);
}
function emitStructureUpdate(definition: SkillBuffDefinition): void {
  history.commit(definition, { path: selectedPath.value });
}
async function restoreStructureHistory(action: 'undo' | 'redo'): Promise<void> {
  history.restore(action);
}

function selectNode(node: { readonly id: string }): void {
  editing.cancelReveal();
  const target = nodeIndex.value.get(node.id);
  if (target === undefined) return;
  selectedId.value = target.id;
  selectedPath.value = target.sourcePath;
  pendingMode.value = '';
  pendingConditionTargetPath.value = '';
}
async function selectPath(path: string): Promise<void> {
  await nextTick();
  const target = findSkillStructureNodeForPath(root.value, path);
  selectNode(target);
  await nextTick();
  await map.value?.revealNode(target.id);
}
async function beginAdd(
  node: {
    readonly id: string;
    readonly sourcePath: string;
    readonly canAddChild?: string;
  },
  anchor: { readonly x: number; readonly y: number },
): Promise<void> {
  selectNode(node);
  insertAnchor.value = { ...anchor };
  if (node.canAddChild === 'buffMember') {
    const result = appendBuffGraphChild(props.definition, node.sourcePath);
    emitStructureUpdate(result.root);
    await selectPath(result.itemPath);
    return;
  }
  if (node.canAddChild === 'lifecycle') {
    pendingMode.value = 'lifecycle';
    await nextTick();
    lifecyclePicker.value?.querySelector<HTMLButtonElement>('button')?.focus();
  } else if (node.canAddChild === 'step') {
    pendingMode.value = 'step';
    pickerKey.value += 1;
  } else if (node.canAddChild === 'sequence') {
    await appendSequence();
  } else if (node.canAddChild === 'buffAbilityResponse') {
    await appendResponse('buffAbilityResponse');
  } else if (node.canAddChild === 'buffIgniteResponse') {
    await appendResponse('buffIgniteResponse');
  } else if (node.canAddChild === 'combatCondition') {
    pendingConditionTargetPath.value = node.sourcePath;
    insertAnchor.value = { ...anchor };
  } else if (node.canAddChild === 'eventResponse') {
    await appendEventResponse(node.sourcePath);
  }
}
async function appendEventResponse(stepPath: string): Promise<void> {
  const responsesPath = `${stepPath}.parameters.responses`;
  const responses = resolveStructureValue(
    props.definition,
    responsesPath,
  ) as readonly CombatEventResponseDefinition[];
  const result = insertStructureArrayItem(
    props.definition,
    responsesPath,
    createCombatEventResponseDraft(responses.map(response => response.key)),
  );
  emitStructureUpdate(result.root);
  await selectPath(result.itemPath);
}
async function appendCondition(condition: CombatCondition): Promise<void> {
  const targetPath = pendingConditionTargetPath.value;
  if (targetPath === '') return;
  const target = resolveStructureValue(props.definition, targetPath) as
    CombatCondition | CombatEventResponseDefinition | undefined;
  pendingConditionTargetPath.value = '';
  if (
    target !== undefined &&
    'kind' in target &&
    (target.kind === 'all' || target.kind === 'any')
  ) {
    const result = insertStructureArrayItem(
      props.definition,
      `${targetPath}.conditions`,
      condition,
    );
    emitStructureUpdate(result.root);
    await selectPath(result.itemPath);
    return;
  }
  const conditionPath =
    target !== undefined && 'event' in target ? `${targetPath}.condition` : targetPath;
  emitStructureUpdate(replaceStructureValueAtPath(props.definition, conditionPath, condition));
  await selectPath(conditionPath);
}
async function appendSequence(): Promise<void> {
  const result = insertStructureArrayItem(props.definition, 'scheduledSequences', {
    startFrame: 0,
    sequence: { steps: [] },
  });
  emitStructureUpdate(result.root);
  await selectPath(result.itemPath);
}
function closeLifecycleFromOutside(event: PointerEvent): void {
  if (pendingMode.value === 'lifecycle' && !lifecyclePicker.value?.contains(event.target as Node)) {
    pendingMode.value = '';
  }
}
onMounted(() => document.addEventListener('pointerdown', closeLifecycleFromOutside));
onBeforeUnmount(() => document.removeEventListener('pointerdown', closeLifecycleFromOutside));
async function appendStep(kind: EditableCombatStepKind): Promise<void> {
  const sequencePath =
    selectedSequence.value === undefined ? selectedPath.value : `${selectedPath.value}.sequence`;
  const result = appendCombatStepInStructure(props.definition, sequencePath, createStep(kind));
  emitStructureUpdate(result.root);
  pendingMode.value = '';
  await selectPath(result.stepPath);
}
function updateSequenceFrame(field: 'startFrame' | 'endFrame', event: Event): void {
  if (selectedSequence.value === undefined) return;
  const raw = (event.target as HTMLInputElement).value;
  const next: ScheduledSequenceDefinition = { ...selectedSequence.value };
  if (field === 'endFrame' && raw === '') delete next.endFrame;
  else {
    const value = Math.round(Number(raw));
    if (!Number.isFinite(value) || value < 0) return;
    next[field] = value;
  }
  emitStructureUpdate(replaceStructureValueAtPath(props.definition, selectedPath.value, next));
}
async function addLifecycle(key: (typeof LIFECYCLE_KEYS)[number]): Promise<void> {
  emitStructureUpdate(
    replaceStructureValueAtPath(props.definition, `lifecycleSequences.${key}`, { steps: [] }),
  );
  pendingMode.value = '';
  await selectPath(`lifecycleSequences.${key}`);
}
async function appendResponse(kind: 'buffAbilityResponse' | 'buffIgniteResponse'): Promise<void> {
  const arrayPath =
    kind === 'buffAbilityResponse' ? 'abilityEventResponses' : 'igniteEventResponses';
  const response =
    kind === 'buffAbilityResponse'
      ? createBuffAbilityEventResponseDraft()
      : createBuffIgniteEventResponseDraft();
  const result = insertStructureArrayItem(props.definition, arrayPath, response);
  emitStructureUpdate(result.root);
  await selectPath(result.itemPath);
}
function updateRootStep(step: CombatStepDefinition): void {
  if (step.kind === 'applyBuff' && step.parameters.definition !== undefined) {
    emitStructureUpdate(step.parameters.definition);
  }
}
function updateStep(step: CombatStepDefinition): void {
  emitStructureUpdate(replaceStructureValueAtPath(props.definition, selectedPath.value, step));
}
function updateResponse(
  response: SkillBuffAbilityEventResponse | SkillBuffIgniteEventResponse,
): void {
  emitStructureUpdate(replaceStructureValueAtPath(props.definition, selectedPath.value, response));
}
async function moveStep(offset: -1 | 1): Promise<void> {
  const result = moveCombatStepInStructure(props.definition, selectedPath.value, offset);
  emitStructureUpdate(result.root);
  await selectPath(result.stepPath);
}
async function copyStep(): Promise<void> {
  const result = duplicateCombatStepInStructure(
    props.definition,
    selectedPath.value,
    duplicateStep,
  );
  emitStructureUpdate(result.root);
  await selectPath(result.stepPath);
}
async function moveSequence(offset: -1 | 1): Promise<void> {
  const index = selectedSequenceIndex.value;
  const sequences = props.definition.scheduledSequences ?? [];
  if (index === undefined) return;
  const target = index + offset;
  if (target < 0 || target >= sequences.length) return;
  const next = [...sequences];
  [next[index], next[target]] = [next[target]!, next[index]!];
  emitStructureUpdate(replaceStructureValueAtPath(props.definition, 'scheduledSequences', next));
  await selectPath(`scheduledSequences[${target}]`);
}
async function copySequence(): Promise<void> {
  const index = selectedSequenceIndex.value;
  const sequence = selectedSequence.value;
  if (index === undefined || sequence === undefined) return;
  const result = insertStructureArrayItem(
    props.definition,
    'scheduledSequences',
    {
      ...sequence,
      sequence: { steps: sequence.sequence.steps.map(duplicateStep) },
    },
    index + 1,
  );
  emitStructureUpdate(result.root);
  await selectPath(result.itemPath);
}
function childArrayPath(
  node: StructureOperationNode,
  kind:
    | 'combatStep'
    | 'scheduledSequence'
    | 'combatCondition'
    | 'eventResponse'
    | 'buffAbilityResponse'
    | 'buffIgniteResponse',
): string | undefined {
  if (node.acceptsChildKind !== kind) return undefined;
  if (kind === 'combatCondition') return `${node.sourcePath}.conditions`;
  if (kind === 'eventResponse') return `${node.sourcePath}.parameters.responses`;
  if (kind !== 'combatStep') return node.sourcePath;
  return node.payloadKind === 'scheduledSequence'
    ? `${node.sourcePath}.sequence.steps`
    : `${node.sourcePath}.steps`;
}
async function moveStructureNode(operation: {
  readonly source: StructureOperationNode;
  readonly target: StructureOperationNode;
  readonly placement: 'inside' | 'before' | 'after';
}): Promise<void> {
  const kind = operation.source.payloadKind;
  if (isBuffGraphPayload(kind)) {
    const source = nodeIndex.value.get(operation.source.id);
    const target = nodeIndex.value.get(operation.target.id);
    if (!source || !target) return;
    const result = moveBuffGraphNode(props.definition, source, target, operation.placement);
    if (!result) return;
    emitStructureUpdate(result.root);
    await nextTick();
    const moved = findSkillStructureNodeForPath(root.value, result.itemPath);
    map.value?.transferCollapsedState(source.id, moved.id);
    await selectPath(result.itemPath);
    return;
  }
  if (
    kind !== 'combatStep' &&
    kind !== 'scheduledSequence' &&
    kind !== 'combatCondition' &&
    kind !== 'eventResponse' &&
    kind !== 'buffAbilityResponse' &&
    kind !== 'buffIgniteResponse'
  ) {
    return;
  }
  if (kind === 'combatCondition') {
    const source = /^(.*\.conditions)\[(\d+)\]$/.exec(operation.source.sourcePath);
    if (source === null) return;
    const siblings = resolveStructureValue(props.definition, source[1]!) as readonly unknown[];
    if (siblings.length <= 1) return;
  }
  if (kind === 'eventResponse') {
    const source = /^(.*\.responses)\[(\d+)\]$/.exec(operation.source.sourcePath);
    if (source === null) return;
    const siblings = resolveStructureValue(props.definition, source[1]!) as readonly unknown[];
    if (siblings.length <= 1) return;
  }
  let arrayPath: string;
  let index: number | undefined;
  if (operation.placement === 'inside') {
    const path = childArrayPath(operation.target, kind);
    if (path === undefined) return;
    arrayPath = path;
  } else {
    const match = /^(.*)\[(\d+)\]$/.exec(operation.target.sourcePath);
    if (match === null || operation.target.payloadKind !== kind) return;
    arrayPath = match[1]!;
    index = Number(match[2]) + (operation.placement === 'after' ? 1 : 0);
  }
  const result = moveStructureArrayItem(
    props.definition,
    operation.source.sourcePath,
    arrayPath,
    index,
  );
  emitStructureUpdate(result.root);
  await nextTick();
  const movedNode = findSkillStructureNodeForPath(root.value, result.itemPath);
  map.value?.transferCollapsedState(operation.source.id, movedNode.id);
  await selectPath(result.itemPath);
}
async function runStructureNodeAction(
  action: 'delete' | 'copy' | 'paste',
  node: StructureOperationNode,
): Promise<void> {
  const damageNode = nodeIndex.value.get(node.id);
  if (action === 'copy' && isBuffGraphPayload(damageNode?.payloadKind)) {
    structureClipboard.value = {
      kind: damageNode.payloadKind,
      value: cloneStructureValue(resolveStructureValue(props.definition, node.sourcePath)),
    };
    return;
  }
  if (action === 'delete' && damageNode?.canDelete && isBuffDetailNode(damageNode)) {
    emitStructureUpdate(
      /\[\d+\]$/.test(node.sourcePath)
        ? removeStructureArrayItem(props.definition, node.sourcePath)
        : deleteStructureValueAtPath(props.definition, node.sourcePath),
    );
    await selectPath(node.sourcePath.replace(/(?:\[\d+\]|\.[^.]+)$/, ''));
    return;
  }
  if (
    action === 'copy' &&
    (node.payloadKind === 'combatStep' ||
      node.payloadKind === 'scheduledSequence' ||
      node.payloadKind === 'combatCondition' ||
      node.payloadKind === 'eventResponse' ||
      node.payloadKind === 'buffAbilityResponse' ||
      node.payloadKind === 'buffIgniteResponse')
  ) {
    structureClipboard.value = {
      kind: node.payloadKind,
      value: cloneStructureValue(resolveStructureValue(props.definition, node.sourcePath)),
    } as typeof structureClipboard.value;
    return;
  }
  if (action === 'delete' && node.payloadKind === 'combatStep') {
    const parentPath = node.sourcePath.replace(/\.steps\[\d+\]$/, '');
    emitStructureUpdate(removeCombatStepInStructure(props.definition, node.sourcePath));
    await selectPath(parentPath);
    return;
  }
  if (
    action === 'delete' &&
    (node.payloadKind === 'buffAbilityResponse' || node.payloadKind === 'buffIgniteResponse')
  ) {
    emitStructureUpdate(removeStructureArrayItem(props.definition, node.sourcePath));
    await selectPath(
      node.payloadKind === 'buffAbilityResponse' ? 'abilityEventResponses' : 'igniteEventResponses',
    );
    return;
  }
  if (action === 'delete' && node.payloadKind === 'scheduledSequence') {
    emitStructureUpdate(removeStructureArrayItem(props.definition, node.sourcePath));
    await selectPath('scheduledSequences');
    return;
  }
  if (action === 'delete' && node.payloadKind === 'combatCondition') {
    const child = /^(.*\.conditions)\[\d+\]$/.exec(node.sourcePath);
    if (child !== null) {
      const siblings = resolveStructureValue(props.definition, child[1]!) as readonly unknown[];
      if (siblings.length <= 1) return;
      emitStructureUpdate(removeStructureArrayItem(props.definition, node.sourcePath));
      await selectPath(child[1]!.replace(/\.conditions$/, ''));
      return;
    }
    const responseCondition = /\.parameters\.responses\[\d+\]\.condition$/.test(node.sourcePath);
    const stepPath = node.sourcePath.replace(/\.parameters\.condition$/, '');
    const owner = resolveStructureValue(props.definition, stepPath) as
      CombatStepDefinition | undefined;
    if (!responseCondition && owner?.kind !== 'jumpTimeline') return;
    emitStructureUpdate(deleteStructureValueAtPath(props.definition, node.sourcePath));
    await selectPath(node.sourcePath.replace(/\.condition$/, ''));
    return;
  }
  if (action === 'delete' && node.payloadKind === 'eventResponse') {
    const responses = /^(.*\.responses)\[\d+\]$/.exec(node.sourcePath);
    if (responses === null) return;
    const siblings = resolveStructureValue(props.definition, responses[1]!) as readonly unknown[];
    if (siblings.length <= 1) return;
    emitStructureUpdate(removeStructureArrayItem(props.definition, node.sourcePath));
    await selectPath(responses[1]!.replace(/\.parameters\.responses$/, ''));
    return;
  }
  if (
    action !== 'paste' ||
    structureClipboard.value === undefined ||
    node.acceptsChildKind !== structureClipboard.value.kind
  ) {
    return;
  }
  const clipboard = structureClipboard.value;
  if (isBuffGraphClipboard(clipboard)) {
    if (action !== 'paste') return;
    const target = nodeIndex.value.get(node.id);
    const result = target && pasteBuffGraphNode(props.definition, target, clipboard);
    if (result) {
      emitStructureUpdate(result.root);
      await selectPath(result.itemPath);
    }
    return;
  }
  const targetArrayPath = childArrayPath(node, clipboard.kind);
  if (targetArrayPath === undefined) return;
  const value =
    clipboard.kind === 'combatStep'
      ? duplicateStep(clipboard.value)
      : clipboard.kind === 'scheduledSequence'
        ? {
            ...cloneStructureValue(clipboard.value),
            sequence: { steps: clipboard.value.sequence.steps.map(duplicateStep) },
          }
        : clipboard.kind === 'eventResponse'
          ? {
              ...cloneStructureValue(clipboard.value),
              key: createCombatEventResponseDraft(
                (
                  resolveStructureValue(
                    props.definition,
                    targetArrayPath,
                  ) as readonly CombatEventResponseDefinition[]
                ).map(response => response.key),
              ).key,
              sequence: { steps: clipboard.value.sequence.steps.map(duplicateStep) },
            }
          : clipboard.kind === 'combatCondition'
            ? cloneStructureValue(clipboard.value)
            : {
                ...cloneStructureValue(clipboard.value),
                sequence: { steps: clipboard.value.sequence.steps.map(duplicateStep) },
              };
  const result = insertStructureArrayItem(props.definition, targetArrayPath, value);
  emitStructureUpdate(result.root);
  await selectPath(result.itemPath);
}
async function deleteCurrent(): Promise<void> {
  if (
    selectedNode.value !== undefined &&
    (selectedNode.value.payloadKind === 'combatCondition' ||
      selectedNode.value.payloadKind === 'eventResponse')
  ) {
    await runStructureNodeAction('delete', selectedNode.value);
    return;
  }
  if (selectedStep.value !== undefined) {
    const parentPath = selectedPath.value.replace(/\.steps\[\d+\]$/, '');
    emitStructureUpdate(removeCombatStepInStructure(props.definition, selectedPath.value));
    await selectPath(parentPath);
    return;
  }
  if (
    selectedNode.value?.payloadKind === 'buffAbilityResponse' ||
    selectedNode.value?.payloadKind === 'buffIgniteResponse'
  ) {
    const parentPath =
      selectedNode.value.payloadKind === 'buffAbilityResponse'
        ? 'abilityEventResponses'
        : 'igniteEventResponses';
    emitStructureUpdate(removeStructureArrayItem(props.definition, selectedPath.value));
    await selectPath(parentPath);
    return;
  }
  if (selectedSequence.value !== undefined) {
    emitStructureUpdate(removeStructureArrayItem(props.definition, selectedPath.value));
    await selectPath('scheduledSequences');
    return;
  }
  const lifecycle = /^lifecycleSequences\.([^.]+)$/.exec(selectedPath.value);
  if (lifecycle === null) return;
  const next: SkillBuffDefinition = {
    ...props.definition,
    lifecycleSequences: { ...props.definition.lifecycleSequences },
  };
  delete (next.lifecycleSequences as Record<string, unknown>)[lifecycle[1]!];
  if (Object.keys(next.lifecycleSequences!).length === 0) delete next.lifecycleSequences;
  emitStructureUpdate(next);
  await selectPath('');
}
</script>

<template>
  <div
    ref="editorRoot"
    class="definition-graph-editor"
    :class="{ 'fill-available': fillAvailable }"
  >
    <SkillStructureMindMap
      ref="map"
      :root="root"
      :view-state-key="`buff:${buffId}`"
      :selected-id="selectedId"
      :show-reference-pins="false"
      :clipboard-kind="structureClipboard?.kind"
      :can-undo="history.canUndo.value"
      :can-redo="history.canRedo.value"
      @select="selectNode"
      @add-child="beginAdd"
      @move-node="moveStructureNode"
      @node-action="runStructureNodeAction"
      @history-action="restoreStructureHistory"
    />
    <main class="definition-inspector">
      <StepTypePicker
        v-if="pendingMode === 'step'"
        :key="pickerKey"
        class="floating-picker"
        :anchor="insertAnchor"
        hide-trigger
        open-on-mount
        @select="appendStep"
      />
      <CombatConditionTypePicker
        v-if="pendingConditionTargetPath !== ''"
        :anchor="insertAnchor"
        @select="appendCondition"
        @close="pendingConditionTargetPath = ''"
      />
      <Teleport to="body">
        <div
          v-if="pendingMode === 'lifecycle'"
          ref="lifecyclePicker"
          class="lifecycle-picker"
          :style="lifecyclePickerStyle"
          @pointerdown.stop
        >
          <strong>添加生命周期</strong>
          <button v-for="key in missingLifecycleKeys" :key="key" @click="addLifecycle(key)">
            {{ key }}
          </button>
        </div>
      </Teleport>

      <BuffDetailNodeInspector
        v-if="selectedNode && isBuffDetailNode(selectedNode)"
        :node="selectedNode"
        :property="editing.property.value"
      />
      <BuffStepEditor
        v-else-if="selectedId === 'buff'"
        :step="editingStep"
        :definition-binding="editing.property.value"
        :skill-level="skillLevel"
        :create-step="createStep"
        :duplicate-step="duplicateStep"
        definition-only
        modifier-collections-in-graph
        inspector-only
        @update="updateRootStep"
      />

      <section v-else-if="selectedCombatCondition" class="node-card">
        <header>
          <div>
            <small>战斗条件</small><strong>{{ selectedCombatCondition.kind }}</strong>
          </div>
          <button v-if="selectedNode?.canDelete !== false" @click="deleteCurrent">
            <el-icon><Delete /></el-icon>
          </button>
        </header>
        <DefinitionPropertyScope :property="editing.property.value">
          <CombatConditionEditor
            :condition="selectedCombatCondition"
            :skill-level="skillLevel"
            layer-only
          />
        </DefinitionPropertyScope>
      </section>

      <section v-else-if="selectedEventResponse" class="node-card response-card">
        <header>
          <div>
            <small>事件响应</small><strong>{{ selectedEventResponse.key }}</strong>
          </div>
          <button v-if="selectedNode?.canDelete !== false" @click="deleteCurrent">
            <el-icon><Delete /></el-icon>
          </button>
        </header>
        <CombatEventResponseInspector
          :response="selectedEventResponse"
          :binding="editing.property.value"
        />
      </section>

      <section v-else-if="selectedStep" class="node-card">
        <header>
          <div>
            <small>战斗步骤</small><strong>{{ selectedStep.kind }}</strong>
          </div>
          <div class="node-actions">
            <button @click="moveStep(-1)">
              <el-icon><ArrowUp /></el-icon>
            </button>
            <button @click="moveStep(1)">
              <el-icon><ArrowDown /></el-icon>
            </button>
            <button @click="copyStep">
              <el-icon><CopyDocument /></el-icon>
            </button>
            <button @click="deleteCurrent">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </header>
        <DefinitionPropertyScope :property="editing.property.value">
          <CombatStepEditor
            :step="selectedStep"
            :skill-level="skillLevel"
            :create-step="createStep"
            :duplicate-step="duplicateStep"
            :show-header="false"
            inspector-only
            @update="updateStep"
          />
        </DefinitionPropertyScope>
      </section>

      <section v-else-if="selectedSequence" class="node-card">
        <header>
          <div>
            <small>Buff 调度序列</small><strong>序列 {{ selectedSequenceIndex! + 1 }}</strong>
          </div>
          <div class="node-actions">
            <button :disabled="selectedSequenceIndex === 0" @click="moveSequence(-1)">
              <el-icon><ArrowUp /></el-icon>
            </button>
            <button
              :disabled="selectedSequenceIndex === (definition.scheduledSequences?.length ?? 0) - 1"
              @click="moveSequence(1)"
            >
              <el-icon><ArrowDown /></el-icon>
            </button>
            <button @click="copySequence">
              <el-icon><CopyDocument /></el-icon>
            </button>
            <button @click="deleteCurrent">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </header>
        <label class="field-row">
          <span>开始帧</span>
          <input
            type="number"
            min="0"
            step="1"
            :value="selectedSequence.startFrame"
            @input="updateSequenceFrame('startFrame', $event)"
          />
        </label>
        <label class="field-row">
          <span>结束帧</span>
          <input
            type="number"
            min="0"
            step="1"
            :value="selectedSequence.endFrame ?? ''"
            @input="updateSequenceFrame('endFrame', $event)"
          />
        </label>
        <p>子步骤从导图节点的＋添加。</p>
      </section>

      <section
        v-else-if="selectedAbilityResponse || selectedIgniteResponse"
        class="node-card response-card"
      >
        <header>
          <div>
            <small>{{ selectedNode?.kind }}</small
            ><strong>{{ selectedNode?.label }}</strong>
          </div>
          <button @click="deleteCurrent">
            <el-icon><Delete /></el-icon>
          </button>
        </header>
        <BuffEventResponseInspector
          :binding="editing.property.value"
          v-if="selectedAbilityResponse"
          kind="ability"
          :response="selectedAbilityResponse"
          @update="updateResponse"
        />
        <BuffEventResponseInspector
          :binding="editing.property.value"
          v-else-if="selectedIgniteResponse"
          kind="ignite"
          :response="selectedIgniteResponse"
          @update="updateResponse"
        />
      </section>

      <section v-else class="node-card">
        <header>
          <div>
            <small>{{ selectedNode?.kind }}</small
            ><strong>{{ selectedNode?.label }}</strong>
          </div>
          <button v-if="selectedPath.startsWith('lifecycleSequences.')" @click="deleteCurrent">
            <el-icon><Delete /></el-icon>
          </button>
        </header>
        <p>此节点只承载有序子步骤，请在导图节点上添加和选择下一层。</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.definition-graph-editor {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(360px, 1.2fr) minmax(300px, 0.8fr);
  height: 560px;
  border: 1px solid var(--ea-border-soft);
}
.definition-inspector {
  position: relative;
  min-width: 0;
  padding: 14px;
  overflow: auto;
  container-type: inline-size;
  border-left: 1px solid var(--ea-border-soft);
  background: var(--ea-workbench-panel);
}
.node-card header,
.node-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.floating-picker {
  position: absolute;
  width: 0;
  height: 0;
}
.node-card {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  border: 1px solid var(--ea-border-soft);
}
.node-card header {
  min-height: 44px;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid var(--ea-border-soft);
}
.node-card header > div:first-child {
  min-width: 0;
  display: grid;
}
.node-card strong {
  min-width: 0;
  overflow-wrap: anywhere;
}
.node-actions {
  min-width: 0;
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.node-card small,
.node-card p {
  color: var(--ea-fg-muted);
}
.node-card p {
  padding: 12px;
}
button {
  min-width: 28px;
  min-height: 28px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
@container (max-width: 420px) {
  .node-card header {
    align-items: flex-start;
    flex-direction: column;
    padding-block: 8px;
  }
}
@media (max-width: 980px) {
  .definition-graph-editor {
    grid-template-columns: 1fr;
    height: auto;
  }
  .definition-graph-editor > :first-child {
    height: 420px;
  }
}
</style>
<style scoped src="../definitionGraphViewport.css"></style>

<style>
.lifecycle-picker {
  position: fixed;
  z-index: 4000;
  width: 260px;
  display: grid;
  gap: 5px;
  padding: 10px;
  overflow-y: auto;
  border: 1px solid var(--ea-gold);
  background: var(--ea-workbench-panel);
  box-shadow: 0 12px 32px rgb(0 0 0 / 45%);
}
.lifecycle-picker button {
  min-height: 30px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
  text-align: left;
}
</style>
