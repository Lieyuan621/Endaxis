<script setup lang="ts">
import { ElIcon } from 'element-plus';
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import {
  isBuffGraphPayload,
  isBuffGraphClipboard,
  pasteBuffGraphNode,
  moveBuffGraphNode,
  type BuffGraphClipboard,
} from '../buffs/buffGraphOperations';
import type { SkillStructureNode as StructureNodeContract } from '../skillStructureMindMapModel';
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import { ArrowDown, ArrowUp, CopyDocument, Delete } from '@element-plus/icons-vue';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import type {
  AbilityEntityDefinition,
  AbilityEntityChildSkillDefinition,
  AbilityEntityDefinitionNumber,
  CombatCondition,
  CombatEventResponseDefinition,
  CombatStepDefinition,
  ScheduledSequenceDefinition,
  SkillDefinition,
  SkillBuffDefinition,
} from '../../../../core/game-data/operatorDefinition';
import {
  createCombatEventResponseDraft,
  createSkillEditorStep,
  duplicateSkillEditorDetachedStep,
  type EditableCombatStepKind,
} from '../skills/skillDefinitionEditorViewModel';
import {
  buildAbilityEntityStructureMindMap,
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
  structureRecordEntryPath,
} from '../skillStructureEditorCommands';
import CombatStepEditor from '../actions/CombatStepEditor.vue';
import DefinitionPropertyScope from '../DefinitionPropertyScope.vue';
import { useDefinitionGraphEditing } from '../useDefinitionGraphEditing';
import CombatConditionEditor from '../actions/CombatConditionEditor.vue';
import CombatConditionTypePicker from '../actions/CombatConditionTypePicker.vue';
import CombatEventResponseInspector from '../actions/CombatEventResponseInspector.vue';
import BuffDetailNodeInspector from '../buffs/BuffDetailNodeInspector.vue';
import BuffStepEditor from '../buffs/BuffStepEditor.vue';
import { appendBuffGraphChild, isBuffDetailNode } from '../buffs/buffDamageModifierGraph';
import SkillBlackboardEditor from '../skills/SkillBlackboardEditor.vue';
import SkillStructureMindMap from '../SkillStructureMindMap.vue';
import StepTypePicker from '../actions/StepTypePicker.vue';
import AbilityEntityDefinitionNumberEditor from './AbilityEntityDefinitionNumberEditor.vue';
import GameplayTagsEditor from '../inspector/GameplayTagsEditor.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';
import type { GameplayTag } from '../../../../../packages/game-data-contract/src/gameplayTags';
import {
  useDefinitionDraftHistory,
  type DefinitionDraftHistory,
} from '../useDefinitionDraftHistory';

type StructureOperationNode = {
  readonly id: string;
  readonly sourcePath: string;
  readonly payloadKind?: StructureNodeContract['payloadKind'];
  readonly acceptsChildKind?: StructureNodeContract['acceptsChildKind'];
};

const props = defineProps<{
  abilityEntityId: string;
  definition: AbilityEntityDefinition;
  skillLevel: number;
  fillAvailable?: boolean;
  sharedHistory?: DefinitionDraftHistory<AbilityEntityDefinition>;
}>();
const emit = defineEmits<{ update: [definition: AbilityEntityDefinition] }>();
const editorRoot = ref<HTMLElement | null>(null);
const selectedId = ref('entity');
const selectedPath = ref('');
const childSkillRenameError = ref('');
const pendingStep = ref(false);
const pendingConditionTargetPath = ref('');
const pickerKey = ref(0);
const insertAnchor = ref({ x: 0, y: 0 });
const structureClipboard = shallowRef<
  | BuffGraphClipboard
  | { readonly kind: 'combatStep'; readonly value: CombatStepDefinition }
  | { readonly kind: 'scheduledSequence'; readonly value: ScheduledSequenceDefinition }
  | { readonly kind: 'combatCondition'; readonly value: CombatCondition }
  | { readonly kind: 'eventResponse'; readonly value: CombatEventResponseDefinition }
>();
const localHistory = useDefinitionDraftHistory(
  () => props.definition,
  value => emit('update', value),
);
const history = props.sharedHistory ?? localHistory;
useEditorHistoryShortcuts(editorRoot, history.restore, () => props.sharedHistory === undefined);
const map = ref<{
  revealNode: (id: string) => Promise<void>;
  transferCollapsedState: (fromId: string, toId: string) => void;
} | null>(null);
const root = computed(() =>
  buildAbilityEntityStructureMindMap(props.abilityEntityId, props.definition),
);
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
const inlineBuff = computed<CombatStepForKind<'applyBuff'> | undefined>(() =>
  selectedNode.value?.kind === '内联 Buff 定义'
    ? {
        kind: 'applyBuff',
        parameters: {
          buffId: String(selectedNode.value.details.BuffID ?? ''),
          target: 'caster',
          definition: resolveStructureValue(
            props.definition,
            selectedPath.value,
          ) as SkillBuffDefinition,
        },
      }
    : undefined,
);
function updateInlineBuff(step: CombatStepDefinition): void {
  if (step.kind === 'applyBuff' && step.parameters.definition !== undefined)
    editing.property.value.update(() => step.parameters.definition);
}
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
const selectedChildSkillNode = computed(
  () =>
    [...nodeIndex.value.values()]
      .filter(
        node =>
          node.payloadKind === 'childSkill' &&
          (selectedPath.value === node.sourcePath ||
            selectedPath.value.startsWith(`${node.sourcePath}.`) ||
            selectedPath.value.startsWith(`${node.sourcePath}[`)),
      )
      .sort((left, right) => right.sourcePath.length - left.sourcePath.length)[0],
);
const selectedChildSkillPath = computed(() => selectedChildSkillNode.value?.sourcePath);
const selectedChildSkill = computed(() => {
  const path = selectedChildSkillPath.value;
  return path === undefined
    ? undefined
    : (resolveStructureValue(props.definition, path) as AbilityEntityChildSkillDefinition);
});
const selectedSequenceIndex = computed(() => {
  if (selectedNode.value?.payloadKind !== 'scheduledSequence') return undefined;
  const match = /\.scheduledSequences\[(\d+)\]$/.exec(selectedPath.value);
  return match === null ? undefined : Number(match[1]);
});
const selectedSequence = computed(() =>
  selectedSequenceIndex.value === undefined
    ? undefined
    : (resolveStructureValue(props.definition, selectedPath.value) as ScheduledSequenceDefinition),
);
watch(
  () => props.abilityEntityId,
  () => {
    selectedId.value = 'entity';
    selectedPath.value = '';
    pendingStep.value = false;
    pendingConditionTargetPath.value = '';
  },
);

function context(): SkillDefinition {
  return {
    key: `ability-entity:${props.abilityEntityId}`,
    timelineBlockFrames: 0,
    scheduledSequences: selectedChildSkill.value?.scheduledSequences ?? [],
  };
}
function createStep(kind: EditableCombatStepKind): CombatStepDefinition {
  return createSkillEditorStep(context(), kind);
}
function duplicateStep(step: CombatStepDefinition): CombatStepDefinition {
  return duplicateSkillEditorDetachedStep(context(), step);
}
function emitStructureUpdate(definition: AbilityEntityDefinition): void {
  history.commit(definition, { path: selectedPath.value });
}
async function restoreStructureHistory(action: 'undo' | 'redo'): Promise<void> {
  history.restore(action);
}

function selectNode(node: { readonly id: string }): void {
  childSkillRenameError.value = '';
  editing.cancelReveal();
  const target = nodeIndex.value.get(node.id);
  if (target === undefined) return;
  selectedId.value = target.id;
  selectedPath.value = target.sourcePath;
  pendingStep.value = false;
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
  } else if (node.canAddChild === 'childSkill') {
    const childSkills = { ...(props.definition.childSkills ?? {}) };
    let index = Object.keys(childSkills).length + 1;
    let skillId = `custom-ability-entity-child-${index}`;
    while (skillId in childSkills) {
      index += 1;
      skillId = `custom-ability-entity-child-${index}`;
    }
    childSkills[skillId] = { skillId, scheduledSequences: [] };
    emitStructureUpdate(replaceStructureValueAtPath(props.definition, 'childSkills', childSkills));
    await selectPath(structureRecordEntryPath('childSkills', skillId));
  } else if (node.canAddChild === 'sequence') {
    appendSequence(node.sourcePath);
  } else if (node.canAddChild === 'step') {
    pendingStep.value = true;
    pickerKey.value += 1;
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
async function appendSequence(childSkillPath = selectedChildSkillPath.value): Promise<void> {
  if (childSkillPath === undefined) return;
  const childSkill = resolveStructureValue(props.definition, childSkillPath) as
    AbilityEntityChildSkillDefinition | undefined;
  if (childSkill === undefined) return;
  const index = childSkill.scheduledSequences.length;
  emitStructureUpdate(
    replaceStructureValueAtPath(props.definition, `${childSkillPath}.scheduledSequences`, [
      ...childSkill.scheduledSequences,
      { startFrame: 0, sequence: { steps: [] } },
    ]),
  );
  await selectPath(`${childSkillPath}.scheduledSequences[${index}]`);
}
async function appendStep(kind: EditableCombatStepKind): Promise<void> {
  const sequencePath =
    selectedSequenceIndex.value === undefined
      ? selectedPath.value
      : `${selectedPath.value}.sequence`;
  const result = appendCombatStepInStructure(props.definition, sequencePath, createStep(kind));
  emitStructureUpdate(result.root);
  pendingStep.value = false;
  await selectPath(result.stepPath);
}
function setLifetimeKind(event: Event): void {
  const kind = (event.target as HTMLSelectElement).value;
  emitStructureUpdate(
    replaceStructureValueAtPath(
      props.definition,
      'lifetime',
      kind === 'limited'
        ? {
            kind: 'limited',
            durationSeconds:
              props.definition.lifetime.kind === 'limited'
                ? props.definition.lifetime.durationSeconds
                : 1,
          }
        : { kind: 'infinite' },
    ),
  );
}
function setLifetimeDurationValue(durationSeconds: AbilityEntityDefinitionNumber): void {
  if (props.definition.lifetime.kind !== 'limited') return;
  emitStructureUpdate({
    ...props.definition,
    lifetime: { kind: 'limited', durationSeconds },
  });
}
function setBornTags(bornTags: readonly GameplayTag[]): void {
  const next = { ...props.definition };
  if (bornTags.length === 0) delete next.bornTags;
  else next.bornTags = bornTags;
  emitStructureUpdate(next);
}
function setOptionalDefinitionNumber(
  field: 'maxStackingCount',
  value: AbilityEntityDefinitionNumber | undefined,
): void {
  const next = { ...props.definition };
  if (value === undefined) delete next[field];
  else next[field] = value;
  emitStructureUpdate(next);
}
function setDeathReleaseDelay(event: Event): void {
  const raw = (event.target as HTMLInputElement).value;
  const next = { ...props.definition };
  if (raw === '') delete next.deathReleaseDelaySeconds;
  else {
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0 || value >= 300) return;
    next.deathReleaseDelaySeconds = value;
  }
  emitStructureUpdate(next);
}
async function updateChildSkillId(event: Event): Promise<void> {
  const childSkill = selectedChildSkill.value;
  const childSkillPath = selectedChildSkillPath.value;
  if (childSkill === undefined || childSkillPath === undefined) return;
  const input = event.target as HTMLInputElement;
  const skillId = input.value;
  childSkillRenameError.value = '';
  if (childSkillPath === 'childSkill') {
    emitStructureUpdate(
      replaceStructureValueAtPath(props.definition, childSkillPath, { ...childSkill, skillId }),
    );
    return;
  }
  const oldEntry = Object.entries(props.definition.childSkills ?? {}).find(
    ([key]) => structureRecordEntryPath('childSkills', key) === childSkillPath,
  );
  if (oldEntry === undefined) return;
  const [oldKey] = oldEntry;
  if (skillId !== oldKey && Object.hasOwn(props.definition.childSkills ?? {}, skillId)) {
    input.value = childSkill.skillId;
    childSkillRenameError.value = `子技能「${skillId}」已存在，未改名或覆盖原定义。`;
    return;
  }
  const childSkills = Object.fromEntries(
    Object.entries(props.definition.childSkills ?? {}).map(([key, value]) =>
      key === oldKey ? [skillId, { ...value, skillId }] : [key, value],
    ),
  );
  emitStructureUpdate(replaceStructureValueAtPath(props.definition, 'childSkills', childSkills));
  await selectPath(structureRecordEntryPath('childSkills', skillId));
}
function updateChildBlackboard(blackboard: NonNullable<SkillDefinition['blackboard']>): void {
  const childSkill = selectedChildSkill.value;
  const childSkillPath = selectedChildSkillPath.value;
  if (childSkill === undefined || childSkillPath === undefined) return;
  const next = { ...childSkill };
  if (Object.keys(blackboard).length === 0) delete next.blackboard;
  else next.blackboard = blackboard;
  emitStructureUpdate(replaceStructureValueAtPath(props.definition, childSkillPath, next));
}
function updateSequenceFrame(field: 'startFrame' | 'endFrame', event: Event): void {
  if (selectedSequence.value === undefined || selectedSequenceIndex.value === undefined) return;
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
function updateStep(step: CombatStepDefinition): void {
  emitStructureUpdate(replaceStructureValueAtPath(props.definition, selectedPath.value, step));
}
async function moveSequence(offset: -1 | 1): Promise<void> {
  const childSkill = selectedChildSkill.value;
  const childSkillPath = selectedChildSkillPath.value;
  const index = selectedSequenceIndex.value;
  if (childSkill === undefined || childSkillPath === undefined || index === undefined) return;
  const target = index + offset;
  if (target < 0 || target >= childSkill.scheduledSequences.length) return;
  const sequences = [...childSkill.scheduledSequences];
  [sequences[index], sequences[target]] = [sequences[target]!, sequences[index]!];
  emitStructureUpdate(
    replaceStructureValueAtPath(
      props.definition,
      `${childSkillPath}.scheduledSequences`,
      sequences,
    ),
  );
  await selectPath(`${childSkillPath}.scheduledSequences[${target}]`);
}
async function copySequence(): Promise<void> {
  const childSkill = selectedChildSkill.value;
  const childSkillPath = selectedChildSkillPath.value;
  const index = selectedSequenceIndex.value;
  const sequence = index === undefined ? undefined : childSkill?.scheduledSequences[index];
  if (
    childSkill === undefined ||
    childSkillPath === undefined ||
    index === undefined ||
    sequence === undefined
  )
    return;
  const copy: ScheduledSequenceDefinition = {
    ...sequence,
    sequence: { steps: sequence.sequence.steps.map(duplicateStep) },
  };
  const sequences = [...childSkill.scheduledSequences];
  sequences.splice(index + 1, 0, copy);
  emitStructureUpdate(
    replaceStructureValueAtPath(
      props.definition,
      `${childSkillPath}.scheduledSequences`,
      sequences,
    ),
  );
  await selectPath(`${childSkillPath}.scheduledSequences[${index + 1}]`);
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
function childArrayPath(
  node: StructureOperationNode,
  kind: 'combatStep' | 'scheduledSequence' | 'combatCondition' | 'eventResponse',
): string | undefined {
  if (kind === 'scheduledSequence') {
    return node.acceptsChildKind === kind ? `${node.sourcePath}.scheduledSequences` : undefined;
  }
  if (kind === 'combatCondition') {
    return node.acceptsChildKind === kind ? `${node.sourcePath}.conditions` : undefined;
  }
  if (kind === 'eventResponse') {
    return node.acceptsChildKind === kind ? `${node.sourcePath}.parameters.responses` : undefined;
  }
  if (node.acceptsChildKind !== kind) return undefined;
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
    kind !== 'eventResponse'
  )
    return;
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
  if (action === 'copy') {
    if (node.payloadKind === 'combatStep') {
      structureClipboard.value = {
        kind: 'combatStep',
        value: cloneStructureValue(
          resolveStructureValue(props.definition, node.sourcePath) as CombatStepDefinition,
        ),
      };
    } else if (node.payloadKind === 'scheduledSequence') {
      structureClipboard.value = {
        kind: 'scheduledSequence',
        value: cloneStructureValue(
          resolveStructureValue(props.definition, node.sourcePath) as ScheduledSequenceDefinition,
        ),
      };
    } else if (node.payloadKind === 'combatCondition') {
      structureClipboard.value = {
        kind: 'combatCondition',
        value: cloneStructureValue(
          resolveStructureValue(props.definition, node.sourcePath) as CombatCondition,
        ),
      };
    } else if (node.payloadKind === 'eventResponse') {
      structureClipboard.value = {
        kind: 'eventResponse',
        value: cloneStructureValue(
          resolveStructureValue(props.definition, node.sourcePath) as CombatEventResponseDefinition,
        ),
      };
    }
    return;
  }
  if (
    action === 'delete' &&
    (node.payloadKind === 'combatStep' || node.payloadKind === 'scheduledSequence')
  ) {
    const parentPath = node.sourcePath.replace(/\.steps\[\d+\]$|\.scheduledSequences\[\d+\]$/, '');
    emitStructureUpdate(removeStructureArrayItem(props.definition, node.sourcePath));
    await selectPath(parentPath);
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
  if (action === 'delete' && node.payloadKind === 'childSkill') {
    if (node.sourcePath === 'childSkill') {
      const next = { ...props.definition };
      delete next.childSkill;
      emitStructureUpdate(next);
    } else {
      const entry = Object.keys(props.definition.childSkills ?? {}).find(
        key => structureRecordEntryPath('childSkills', key) === node.sourcePath,
      );
      if (entry === undefined) return;
      const childSkills = { ...(props.definition.childSkills ?? {}) };
      delete childSkills[entry];
      const next = { ...props.definition };
      if (Object.keys(childSkills).length === 0) delete next.childSkills;
      else next.childSkills = childSkills;
      emitStructureUpdate(next);
    }
    await selectPath('');
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
  if (action !== 'paste' || clipboard === undefined) return;
  const arrayPath = childArrayPath(node, clipboard.kind);
  if (arrayPath === undefined) return;
  const value =
    clipboard.kind === 'combatStep'
      ? duplicateStep(clipboard.value)
      : clipboard.kind === 'scheduledSequence'
        ? {
            ...clipboard.value,
            sequence: { steps: clipboard.value.sequence.steps.map(duplicateStep) },
          }
        : clipboard.kind === 'eventResponse'
          ? {
              ...cloneStructureValue(clipboard.value),
              key: createCombatEventResponseDraft(
                (
                  resolveStructureValue(
                    props.definition,
                    arrayPath,
                  ) as readonly CombatEventResponseDefinition[]
                ).map(response => response.key),
              ).key,
              sequence: { steps: clipboard.value.sequence.steps.map(duplicateStep) },
            }
          : cloneStructureValue(clipboard.value);
  const result = insertStructureArrayItem(props.definition, arrayPath, value);
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
  if (selectedSequenceIndex.value !== undefined && selectedChildSkill.value !== undefined) {
    const childSkillPath = selectedChildSkillPath.value;
    if (childSkillPath === undefined) return;
    const sequences = selectedChildSkill.value.scheduledSequences.filter(
      (_, index) => index !== selectedSequenceIndex.value,
    );
    emitStructureUpdate(
      replaceStructureValueAtPath(
        props.definition,
        `${childSkillPath}.scheduledSequences`,
        sequences,
      ),
    );
    await selectPath(childSkillPath);
  } else if (selectedNode.value?.payloadKind === 'childSkill') {
    await runStructureNodeAction('delete', selectedNode.value);
  }
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
      :view-state-key="`entity:${abilityEntityId}`"
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
        v-if="pendingStep"
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
      <BuffDetailNodeInspector
        v-if="selectedNode && isBuffDetailNode(selectedNode)"
        :node="selectedNode"
        :property="editing.property.value"
      />
      <BuffStepEditor
        v-else-if="inlineBuff"
        :key="selectedPath"
        :step="inlineBuff"
        :definition-binding="editing.property.value"
        :skill-level="skillLevel"
        :create-step="createStep"
        :duplicate-step="duplicateStep"
        definition-only
        modifier-collections-in-graph
        inspector-only
        @update="updateInlineBuff"
      />
      <section v-else-if="selectedId === 'entity'" class="node-card">
        <header>
          <div><small>能力实体</small><strong>基本设置</strong></div>
        </header>
        <p>{{ selectedNode?.summary }}</p>
        <section class="field-group" aria-label="出生标签">
          <EditorFieldLabel
            label="出生标签"
            help="实体创建时立即写入自身 AbilitySystem；实体查询和条件可依赖这些稳定标签。"
          />
          <GameplayTagsEditor
            :tags="definition.bornTags ?? []"
            :minimum="0"
            @update="setBornTags"
          />
        </section>
        <label class="field-row">
          <span>死亡回收延迟（秒）</span>
          <input
            type="number"
            min="0"
            max="299.99"
            step="0.01"
            :value="definition.deathReleaseDelaySeconds ?? ''"
            placeholder="未设置"
            @input="setDeathReleaseDelay"
          />
        </label>
        <label class="field-row field-row--optional">
          <span
            ><input
              type="checkbox"
              :checked="definition.maxStackingCount !== undefined"
              @change="
                setOptionalDefinitionNumber(
                  'maxStackingCount',
                  ($event.target as HTMLInputElement).checked ? 1 : undefined,
                )
              "
            />最大同模板实例数</span
          >
          <AbilityEntityDefinitionNumberEditor
            v-if="definition.maxStackingCount !== undefined"
            :value="definition.maxStackingCount"
            @update="setOptionalDefinitionNumber('maxStackingCount', $event)"
          />
        </label>
        <p>
          生命周期与子技能分别作为导图子节点编辑；具名子技能映射中的每个原生技能 ID 都是独立成员。
        </p>
      </section>
      <section v-else-if="selectedId === 'entity:lifetime'" class="node-card">
        <header>
          <div><small>实体设置</small><strong>生命周期</strong></div>
        </header>
        <label class="field-row">
          <span>类型</span>
          <select :value="definition.lifetime.kind" @change="setLifetimeKind">
            <option value="limited">有限</option>
            <option value="infinite">无限</option>
          </select>
        </label>
        <label v-if="definition.lifetime.kind === 'limited'" class="field-row">
          <span>持续秒数</span>
          <AbilityEntityDefinitionNumberEditor
            :value="definition.lifetime.durationSeconds"
            @update="setLifetimeDurationValue"
          />
        </label>
      </section>
      <section v-else-if="selectedNode?.payloadKind === 'childSkill'" class="node-card">
        <header>
          <div><small>实体子技能</small><strong>子技能设置</strong></div>
          <button title="删除子技能" aria-label="删除子技能" @click="deleteCurrent">
            <el-icon><Delete /></el-icon>
          </button>
        </header>
        <label class="field-row">
          <EditorFieldLabel
            label="子技能 ID"
            help="生成能力实体时可通过此 ID 选择子技能。改名不会自动改写其他位置的引用。"
          />
          <input
            :value="selectedChildSkill?.skillId"
            :aria-invalid="!!childSkillRenameError"
            @change="updateChildSkillId"
          />
        </label>
        <p v-if="childSkillRenameError" class="field-error" role="alert">
          {{ childSkillRenameError }}
        </p>
        <div class="field-group">
          <SkillBlackboardEditor
            title="子技能初始黑板"
            description="当前子技能使用的初始数值；不是角色共享黑板。执行步骤在图中编辑。"
            :blackboard="selectedChildSkill?.blackboard ?? {}"
            :skill-level="skillLevel"
            @update="updateChildBlackboard"
          />
        </div>
        <p>调度序列从导图节点的＋添加。</p>
      </section>
      <section v-else-if="selectedSequence" class="node-card">
        <header>
          <div>
            <small>子技能调度序列</small><strong>序列 {{ selectedSequenceIndex! + 1 }}</strong>
          </div>
          <div class="node-actions">
            <button
              title="前移序列"
              aria-label="前移序列"
              :disabled="selectedSequenceIndex === 0"
              @click="moveSequence(-1)"
            >
              <el-icon><ArrowUp /></el-icon>
            </button>
            <button
              title="后移序列"
              aria-label="后移序列"
              :disabled="
                selectedSequenceIndex === selectedChildSkill!.scheduledSequences.length - 1
              "
              @click="moveSequence(1)"
            >
              <el-icon><ArrowDown /></el-icon>
            </button>
            <button title="复制序列" aria-label="复制序列" @click="copySequence">
              <el-icon><CopyDocument /></el-icon>
            </button>
            <button title="删除序列" aria-label="删除序列" @click="deleteCurrent">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </header>
        <label class="field-row">
          <EditorFieldLabel
            label="开始帧"
            help="按当前能力实体的局部时钟调度，不是主时间轴上的放置时刻。"
          />
          <input
            type="number"
            :value="selectedSequence.startFrame"
            @input="updateSequenceFrame('startFrame', $event)"
          />
        </label>
        <label class="field-row">
          <EditorFieldLabel
            label="结束帧（可选）"
            help="到达该帧时，调用已开始序列的结束生命周期；并非删掉序列产生的所有后续影响。"
          />
          <input
            type="number"
            :value="selectedSequence.endFrame ?? ''"
            placeholder="未设置结束帧"
            @input="updateSequenceFrame('endFrame', $event)"
          />
        </label>
        <p>子步骤从导图节点的＋添加。</p>
      </section>
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
            inline-buff-in-graph
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
      <section v-else class="node-card">
        <header>
          <div>
            <small>{{ selectedNode?.kind }}</small
            ><strong>{{ selectedNode?.label }}</strong>
          </div>
        </header>
        <p>此节点只承载子节点，请在导图中添加和选择下一层。</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.definition-graph-editor {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(360px, 1.2fr) minmax(300px, 0.8fr);
  height: 650px;
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
.floating-picker {
  position: absolute;
  width: 0;
  height: 0;
}
.node-card > header,
.node-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.node-card {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}
.field-group {
  display: grid;
  min-width: 0;
  gap: 8px;
  padding: 10px 12px;
}
.node-card > header {
  min-height: 44px;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid var(--ea-border-soft);
}
.node-card > header > div:first-child {
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
.node-card p,
.field-row span {
  color: var(--ea-fg-muted);
}
.node-card p {
  padding: 12px;
}
.node-card .field-error {
  color: var(--ea-danger, #ff7777);
  overflow-wrap: anywhere;
  margin: 0;
}
.field-row {
  display: grid;
  grid-template-columns: minmax(88px, 120px) minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}
input:not([type='checkbox']),
select {
  min-width: 0;
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
  height: 30px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
.field-row--optional > span {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 6px;
}
.field-row--optional > :not(span) {
  grid-column: 1 / -1;
  min-width: 0;
}
.field-row--optional input[type='checkbox'] {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  margin: 0;
}
button {
  min-width: 28px;
  min-height: 28px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-input);
  color: var(--ea-fg);
}
@container (max-width: 420px) {
  .field-row {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .node-card > header {
    flex-wrap: wrap;
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
