<script setup lang="ts">
import { ElIcon } from 'element-plus';
import { EaButton } from '../../../../design-system/index';
import type { CombatStepForKind } from '../../../../../packages/game-data-contract/src/actions';
import type { SkillStructureNode as StructureNodeContract } from '../skillStructureMindMapModel';
import InspectorFields from '../inspector/InspectorFields.vue';
import LevelValuesEditor from '../LevelValuesEditor.vue';
import SkillInputWindowInspector from './SkillInputWindowInspector.vue';
import SkillSwitchToBuffInspector from './SkillSwitchToBuffInspector.vue';
import {
  skillRuntimeIdentityFields,
  skillRuntimeTimingFields,
} from '../inspector/skillRootInspectorFields';
/**
 * 技能逻辑编辑工作区，编辑单个技能块的完整 SkillDefinition 草稿。
 *
 * 本组件只负责草稿渲染与用户输入收集：它把模板和（可选的）自定义定义投影为
 * 可编辑字段与只读结构摘要。独立入口修改隔离草稿；嵌入根定义时读写共享草稿与历史。
 * 独立入口保存时把完整草稿交给
 * 统一命令入口严格校验，取消或恢复模板则直接丢弃草稿 / 删除整个 customDefinition。
 * 组件不解析编译产物，也不把天赋潜能等构筑效果写进自定义技能。
 */
import { computed, nextTick, reactive, ref, shallowRef, watch } from 'vue';
import { cloneEditorDefinition } from '../../../cloneEditorDefinition';
import type { DefinitionDraftHistory } from '../useDefinitionDraftHistory';
import { useEditorHistoryShortcuts } from '../../../keyboard/useEditorHistoryShortcuts';
import { useDefinitionStructureNavigation } from '../definitionStructureNavigation';
import { useI18n } from 'vue-i18n';
import { ArrowDown, ArrowUp, CopyDocument, Delete } from '@element-plus/icons-vue';
import {
  SKILL_TYPES,
  SKILL_LEVEL_SOURCES,
  type AbilityEntityChildSkillDefinition,
  type CombatCondition,
  type CombatEventResponseDefinition,
  type CombatEventHandlerDefinition,
  type CombatResource,
  type LevelValues,
  type CombatStepDefinition,
  type ScheduledSequenceDefinition,
  type SkillDefinition,
  type SkillBuffDefinition,
  type SkillGlobalBuffChildDefinition,
  type SkillGlobalBuffDefinition,
} from '../../../../core/game-data/operatorDefinition';
import { validateSkillDefinition } from '../../../../core/game-data/validateSkillDefinition';
import type { ValidationIssue } from '../../../../core/project/validation';
import {
  applySkillEditorField,
  appendSkillEditorSequence,
  applySkillEditorEnhancementStateBuffId,
  createSkillEditorDraft,
  createSkillEditorStep,
  createCombatEventResponseDraft,
  createSkillEventHandlerDraft,
  duplicateSkillEditorDetachedStep,
  duplicateSkillEditorSequence,
  moveSkillEditorSequence,
  projectSkillEditor,
  removeSkillEditorSequence,
  type EditableCombatStepKind,
  type SkillEditorViewModel,
} from './skillDefinitionEditorViewModel';
import {
  buildSkillStructureMindMap,
  findSkillStructureNodeForPath,
  indexSkillStructureNodes,
  locateStructureProperty,
} from '../skillStructureMindMapModel';
import {
  appendCombatStepAtSequencePath,
  cloneStructureValue,
  deleteStructureValueAtPath,
  duplicateCombatStepAtPath,
  insertStructureArrayItem,
  moveStructureArrayItem,
  moveCombatStepAtPath,
  removeStructureArrayItem,
  removeCombatStepAtPath,
  replaceCombatStepAtPath,
  replaceStructureValueAtPath,
  resolveSkillStructureValue,
  resolveStructureValue,
  structurePathSegments,
} from '../skillStructureEditorCommands';
import { createDefinitionEditContext } from '../definitionEditContext';
import DefinitionPropertyScope from '../DefinitionPropertyScope.vue';
import { stepInspectorFields } from '../inspector/stepInspectorSchema';
import CombatStepEditor from '../actions/CombatStepEditor.vue';
import BuffStepEditor from '../buffs/BuffStepEditor.vue';
import type { InspectorPropertyPath } from '../inspector/inspectorProperty';
import { useInspectorPropertyReveal } from '../inspector/useInspectorPropertyReveal';
import CombatConditionEditor from '../actions/CombatConditionEditor.vue';
import CombatConditionTypePicker from '../actions/CombatConditionTypePicker.vue';
import CombatEventResponseInspector from '../actions/CombatEventResponseInspector.vue';
import GlobalBuffChildInspector from '../buffs/GlobalBuffChildInspector.vue';
import GlobalBuffDefinitionInspector from '../buffs/GlobalBuffDefinitionInspector.vue';
import InlineAbilityEntityChildSkillInspector from '../operators/InlineAbilityEntityChildSkillInspector.vue';
import EditorFieldLabel from '../inspector/EditorFieldLabel.vue';
import SkillBlackboardEditor from './SkillBlackboardEditor.vue';
import SkillStructureMindMap from '../SkillStructureMindMap.vue';
import StepTypePicker from '../actions/StepTypePicker.vue';
import BuffDetailNodeInspector from '../buffs/BuffDetailNodeInspector.vue';
import { isBuffDetailNode, appendBuffGraphChild } from '../buffs/buffDamageModifierGraph';
import {
  isBuffGraphPayload,
  isBuffGraphClipboard,
  pasteBuffGraphNode,
  moveBuffGraphNode,
  type BuffGraphClipboard,
} from '../buffs/buffGraphOperations';

type EditorSection = 'overview' | 'blackboard' | 'availability' | number;
type StructureOperationNode = {
  readonly id: string;
  readonly sourcePath: string;
  readonly payloadKind?: StructureNodeContract['payloadKind'];
  readonly acceptsChildKind?: StructureNodeContract['acceptsChildKind'];
};

const props = defineProps<{
  template: SkillDefinition;
  customDefinition: SkillDefinition | undefined;
  skillLevel: number;
  labels: {
    section: string;
    customized: string;
    timelineBlockFrames: string;
    cooldownFrames: string;
    levelArrayValue: string;
    costFrame: string;
    costs: string;
    costResource: string;
    costValue: string;
    scheduledSequences: string;
    startFrame: string;
    endFrame: string;
    stepKinds: string;
    save: string;
    cancel: string;
    reset: string;
    overview: string;
    structure: string;
    sequence: string;
  };
  showReferencePins?: boolean;
  allowInvalidSave?: boolean;
  buffIds?: readonly string[];
  backLabel?: string;
  sharedHistory?: DefinitionDraftHistory<SkillDefinition>;
  viewStateKey?: string;
  navigationRequest?: { readonly propertyPath: InspectorPropertyPath };
}>();

const emit = defineEmits<{
  save: [draft: SkillDefinition];
  cancel: [];
  reset: [];
  reference: [reference: { readonly kind: 'buff' | 'entity'; readonly id: string }];
}>();
const { t } = useI18n({ useScope: 'global' });
const editorRoot = ref<HTMLElement | null>(null);
useEditorHistoryShortcuts(editorRoot, restoreStructureHistory);
const revealProperty = useInspectorPropertyReveal(editorRoot);

const localDraft = reactive<{ value: SkillDefinition }>({
  value: createSkillEditorDraft(
    cloneEditorDefinition(props.template),
    props.customDefinition === undefined
      ? undefined
      : cloneEditorDefinition(props.customDefinition),
  ),
});
// 嵌入定义工作区时读取根的最新对象；独立技能覆盖入口仍保留自身草稿。
const draft = {
  get value(): SkillDefinition {
    return props.sharedHistory ? props.template : localDraft.value;
  },
  set value(value: SkillDefinition) {
    localDraft.value = value;
  },
};
const selectedSection = ref<EditorSection>('overview');
const selectedStructureNodeId = ref('skill');
const selectedStructureSourcePath = ref('');
const structureMap = ref<{
  revealNode: (id: string) => Promise<void>;
  transferCollapsedState: (fromId: string, toId: string) => void;
} | null>(null);
const pendingStepTargetPath = ref('');
const pendingConditionTargetPath = ref('');
const stepPickerKey = ref(0);
const insertAnchor = ref({ x: 0, y: 0 });
const structureClipboard = shallowRef<
  | BuffGraphClipboard
  | { readonly kind: 'combatStep'; readonly value: CombatStepDefinition }
  | { readonly kind: 'scheduledSequence'; readonly value: ScheduledSequenceDefinition }
  | { readonly kind: 'combatCondition'; readonly value: CombatCondition }
  | { readonly kind: 'eventResponse'; readonly value: CombatEventResponseDefinition }
  | { readonly kind: 'skillEventHandler'; readonly value: CombatEventHandlerDefinition }
  | { readonly kind: 'globalBuffChild'; readonly value: SkillGlobalBuffChildDefinition }
>();
interface StructureHistoryEntry {
  readonly definition: SkillDefinition;
  readonly selectedPath: string;
  readonly propertyPath?: InspectorPropertyPath;
}
const structureUndoStack = shallowRef<StructureHistoryEntry[]>([]);
const structureRedoStack = shallowRef<StructureHistoryEntry[]>([]);
const canUndoStructure = computed(
  () => props.sharedHistory?.canUndo.value ?? structureUndoStack.value.length > 0,
);
const canRedoStructure = computed(
  () => props.sharedHistory?.canRedo.value ?? structureRedoStack.value.length > 0,
);

const customized = computed(() => props.customDefinition !== undefined);

const view = computed<SkillEditorViewModel>(() =>
  projectSkillEditor(props.template, draft.value, customized.value),
);
const validationIssues = computed(() => validateSkillDefinition(draft.value));
const structureRoot = computed(() =>
  buildSkillStructureMindMap(draft.value, {
    blackboard: t('timeline.skillEditing.initialBlackboard'),
    availability: t('timeline.skillEditing.availability'),
    sequence: props.labels.sequence,
  }),
);
const structureNodeIndex = computed(() => indexSkillStructureNodes(structureRoot.value));
useDefinitionStructureNavigation(structureRoot, () => draft.value, selectStructurePath);
const editContext = createDefinitionEditContext({
  read: () => draft.value,
  commit(next, focus) {
    const location = locateStructureProperty(structureRoot.value, focus);
    commitStructureDraft(next, location.propertyPath, location.path);
  },
});
const selectedProperty = computed(() =>
  editContext.at(structurePathSegments(selectedStructureSourcePath.value)),
);
const selectedStructureNode = computed(() =>
  structureNodeIndex.value.get(selectedStructureNodeId.value),
);
const selectedScheduledSequenceIndex = computed(() => {
  const match = /scheduledSequences\[(\d+)\]$/.exec(selectedStructureSourcePath.value);
  return match === null ? undefined : Number(match[1]);
});
const selectedScheduledSequence = computed(() =>
  selectedStructureNode.value?.payloadKind === 'scheduledSequence'
    ? (resolveStructureValue(
        draft.value,
        selectedStructureSourcePath.value,
      ) as ScheduledSequenceDefinition)
    : undefined,
);
const selectedRootSequence = computed(() => /^sequence:\d+$/.test(selectedStructureNodeId.value));
const selectedCombatStep = computed(() =>
  selectedStructureNode.value?.kind === '战斗步骤'
    ? (resolveSkillStructureValue(
        draft.value,
        selectedStructureSourcePath.value,
      ) as CombatStepDefinition)
    : undefined,
);
const selectedCombatCondition = computed(() =>
  selectedStructureNode.value?.payloadKind === 'combatCondition'
    ? (resolveStructureValue(draft.value, selectedStructureSourcePath.value) as CombatCondition)
    : undefined,
);
const selectedInlineBuff = computed<CombatStepForKind<'applyBuff'> | undefined>(() =>
  selectedStructureNode.value?.kind === '内联 Buff 定义'
    ? {
        kind: 'applyBuff',
        parameters: {
          buffId: String(selectedStructureNode.value.details.BuffID ?? ''),
          target: 'caster',
          definition: resolveStructureValue(
            draft.value,
            selectedStructureSourcePath.value,
          ) as SkillBuffDefinition,
        },
      }
    : undefined,
);
function updateInlineBuff(step: CombatStepDefinition): void {
  if (step.kind === 'applyBuff' && step.parameters.definition !== undefined)
    selectedProperty.value.update(() => step.parameters.definition);
}
const selectedEventResponse = computed(() =>
  selectedStructureNode.value?.payloadKind === 'eventResponse'
    ? (resolveStructureValue(
        draft.value,
        selectedStructureSourcePath.value,
      ) as CombatEventResponseDefinition)
    : undefined,
);
const selectedSkillEventHandler = computed(() =>
  selectedStructureNode.value?.payloadKind === 'skillEventHandler'
    ? (resolveStructureValue(
        draft.value,
        selectedStructureSourcePath.value,
      ) as CombatEventHandlerDefinition)
    : undefined,
);
const selectedGlobalBuffDefinition = computed(() =>
  selectedStructureNode.value?.payloadKind === 'globalBuffDefinition'
    ? (resolveStructureValue(
        draft.value,
        selectedStructureSourcePath.value,
      ) as SkillGlobalBuffDefinition)
    : undefined,
);
const selectedGlobalBuffChild = computed(() =>
  selectedStructureNode.value?.payloadKind === 'globalBuffChild'
    ? (resolveStructureValue(
        draft.value,
        selectedStructureSourcePath.value,
      ) as SkillGlobalBuffChildDefinition)
    : undefined,
);
const selectedInlineAbilityEntityChildSkill = computed(() =>
  selectedStructureNode.value?.payloadKind === 'childSkill'
    ? (resolveStructureValue(
        draft.value,
        selectedStructureSourcePath.value.replace(/\.scheduledSequences$/, ''),
      ) as AbilityEntityChildSkillDefinition)
    : undefined,
);

function createNestedStep(kind: EditableCombatStepKind) {
  return createSkillEditorStep(draft.value, kind);
}

function duplicateNestedStep(step: Parameters<typeof duplicateSkillEditorDetachedStep>[1]) {
  return duplicateSkillEditorDetachedStep(draft.value, step);
}

function commitStructureDraft(
  next: SkillDefinition,
  propertyPath?: InspectorPropertyPath,
  selectedPath = selectedStructureSourcePath.value,
): void {
  if (next === draft.value) return;
  if (props.sharedHistory) {
    props.sharedHistory.commit(next, { path: selectedPath, propertyPath });
    return;
  }
  structureUndoStack.value = [
    ...structureUndoStack.value,
    { ...captureStructureHistory(), selectedPath, propertyPath: propertyPath && [...propertyPath] },
  ];
  structureRedoStack.value = [];
  draft.value = next;
}

function captureStructureHistory(): StructureHistoryEntry {
  return {
    definition: cloneStructureValue(draft.value),
    selectedPath: selectedStructureSourcePath.value,
  };
}

let restoreRevision = 0;
async function restoreStructureHistory(action: 'undo' | 'redo'): Promise<void> {
  if (props.sharedHistory) {
    props.sharedHistory.restore(action);
    return;
  }
  const revision = ++restoreRevision;
  void revealProperty();
  const source = action === 'undo' ? structureUndoStack : structureRedoStack;
  const target = action === 'undo' ? structureRedoStack : structureUndoStack;
  const snapshot = source.value.at(-1);
  if (snapshot === undefined) return;
  source.value = source.value.slice(0, -1);
  target.value = [
    ...target.value,
    {
      definition: cloneStructureValue(draft.value),
      selectedPath: snapshot.selectedPath,
      propertyPath: snapshot.propertyPath,
    },
  ];
  draft.value = cloneStructureValue(snapshot.definition);
  await selectStructurePath(snapshot.selectedPath);
  if (revision === restoreRevision && snapshot.propertyPath) {
    const bound =
      selectedInlineBuff.value ||
      selectedCombatCondition.value ||
      selectedEventResponse.value ||
      selectedSkillEventHandler.value ||
      (selectedCombatStep.value &&
        (selectedCombatStep.value.kind === 'applyBuff' ||
          stepInspectorFields(selectedCombatStep.value.kind)));
    await revealProperty(
      bound
        ? [...structurePathSegments(snapshot.selectedPath), ...snapshot.propertyPath]
        : snapshot.propertyPath,
    );
  }
}

function setBlackboard(blackboard: NonNullable<SkillDefinition['blackboard']>): void {
  const next = { ...draft.value };
  if (Object.keys(blackboard).length === 0) delete next.blackboard;
  else next.blackboard = blackboard;
  commitStructureDraft(next);
}

watch(
  () => [props.template, props.customDefinition],
  () => {
    if (props.sharedHistory) return;
    draft.value = createSkillEditorDraft(
      cloneEditorDefinition(props.template),
      props.customDefinition === undefined
        ? undefined
        : cloneEditorDefinition(props.customDefinition),
    );
    selectedSection.value = 'overview';
    selectedStructureNodeId.value = 'skill';
    selectedStructureSourcePath.value = '';
    structureUndoStack.value = [];
    structureRedoStack.value = [];
  },
);

watch(
  () => props.sharedHistory?.restoredLocation?.value,
  async location => {
    if (
      !location ||
      (location.section && location.section !== 'skills') ||
      (location.objectId && location.objectId !== props.template.key)
    )
      return;
    const revision = ++restoreRevision;
    await selectStructurePath(location.path);
    if (revision === restoreRevision && location.propertyPath) {
      const bound =
        selectedInlineBuff.value ||
        selectedCombatCondition.value ||
        selectedEventResponse.value ||
        selectedSkillEventHandler.value ||
        (selectedCombatStep.value &&
          (selectedCombatStep.value.kind === 'applyBuff' ||
            stepInspectorFields(selectedCombatStep.value.kind)));
      await revealProperty(
        bound
          ? [...structurePathSegments(location.path), ...location.propertyPath]
          : location.propertyPath,
      );
    }
  },
  { immediate: true, flush: 'post' },
);

watch(
  () => props.navigationRequest,
  async request => {
    if (!request) return;
    const location = locateStructureProperty(structureRoot.value, request.propertyPath);
    await selectStructurePath(location.path);
  },
  { immediate: true, flush: 'post' },
);

function setField(
  field: 'timelineBlockFrames' | 'cooldownFrames' | 'costFrame',
  event: Event,
): void {
  const raw = (event.target as HTMLInputElement).value;
  const value = raw === '' ? undefined : Number(raw);
  if (value !== undefined && !Number.isFinite(value)) return;
  commitStructureDraft(
    applySkillEditorField(draft.value, {
      field,
      value: value === undefined ? undefined : Math.round(value),
    }),
  );
}

function setEnhancementStateBuffId(event: Event): void {
  commitStructureDraft(
    applySkillEditorEnhancementStateBuffId(draft.value, (event.target as HTMLInputElement).value),
  );
}

const costFields = ['sp', 'ultimateEnergy'] as const;
function resourceCost(resource: CombatResource): LevelValues {
  const cost = draft.value.costs?.find(cost => cost.resource === resource);
  return cost?.value ?? 0;
}
function setResourceCost(resource: CombatResource, value: LevelValues | undefined): void {
  if (value === undefined) return;
  const costs = [...(draft.value.costs ?? [])];
  const index = costs.findIndex(cost => cost.resource === resource);
  if (index < 0) costs.push({ resource, value });
  else
    costs[index] = {
      ...costs[index]!,
      value,
    };
  commitStructureDraft(
    { ...draft.value, costs },
    ['costs', index < 0 ? costs.length - 1 : index, 'value'],
    '',
  );
}

function selectStructureNode(node: { readonly id: string }): void {
  void revealProperty();
  const target = structureNodeIndex.value.get(node.id);
  if (target === undefined) return;
  selectedStructureNodeId.value = target.id;
  selectedStructureSourcePath.value = target.sourcePath;
  selectedSection.value = target.editorSection;
  pendingStepTargetPath.value = '';
  pendingConditionTargetPath.value = '';
}

async function selectStructurePath(path: string): Promise<void> {
  await nextTick();
  const target = findSkillStructureNodeForPath(structureRoot.value, path);
  selectStructureNode(target);
  await nextTick();
  await structureMap.value?.revealNode(target.id);
}

function beginAddChild(
  node: {
    readonly id: string;
    readonly sourcePath: string;
    readonly canAddChild?: StructureNodeContract['canAddChild'];
  },
  anchor: { readonly x: number; readonly y: number },
): void {
  selectStructureNode(node);
  if (node.canAddChild === 'buffMember') {
    const result = appendBuffGraphChild(draft.value, node.sourcePath);
    commitStructureDraft(result.root, undefined, node.sourcePath);
    void selectStructurePath(result.itemPath);
    return;
  }
  if (node.sourcePath === 'switchToBuffCast' && !draft.value.switchToBuffCast) {
    commitStructureDraft(
      { ...draft.value, switchToBuffCast: { sequence: { steps: [] } } },
      undefined,
      'switchToBuffCast',
    );
    return;
  }
  if (node.sourcePath === 'inputWindows' && !draft.value.inputWindows) {
    commitStructureDraft({ ...draft.value, inputWindows: {} }, undefined, 'inputWindows');
    return;
  }
  if (
    node.sourcePath === 'inputWindows.commandMappings' ||
    node.sourcePath === 'inputWindows.allowedNextSkills'
  ) {
    const mapping = node.sourcePath.endsWith('commandMappings');
    const next = insertStructureArrayItem(
      draft.value,
      node.sourcePath,
      mapping
        ? { startFrame: 0, endFrame: 0, input: 'basicAttack', targetSkillId: null }
        : { startFrame: 0, endFrame: 0, skillIds: [] },
    );
    commitStructureDraft(next.root, undefined, next.itemPath);
    void nextTick().then(() => selectStructurePath(next.itemPath));
    return;
  }
  if (node.canAddChild === 'sequence') {
    void appendSequence(node.sourcePath);
    return;
  }
  if (node.canAddChild === 'combatCondition') {
    pendingConditionTargetPath.value = node.sourcePath;
    insertAnchor.value = { ...anchor };
    stepPickerKey.value += 1;
    return;
  }
  if (node.canAddChild === 'eventResponse') {
    void appendEventResponse(node.sourcePath);
    return;
  }
  if (node.canAddChild === 'skillEventHandler') {
    void appendSkillEventHandler();
    return;
  }
  if (node.canAddChild === 'globalBuffChild') {
    void appendGlobalBuffChild(node.sourcePath);
    return;
  }
  if (node.canAddChild !== 'step') return;
  pendingStepTargetPath.value =
    structureNodeIndex.value.get(node.id)?.payloadKind === 'scheduledSequence'
      ? `${node.sourcePath}.sequence`
      : node.sourcePath;
  insertAnchor.value = { ...anchor };
  stepPickerKey.value += 1;
}

async function appendGlobalBuffChild(definitionPath: string): Promise<void> {
  const result = insertStructureArrayItem(draft.value, `${definitionPath}.children`, {
    buffId: 'custom-buff',
    blackboardAssignments: {},
  } satisfies SkillGlobalBuffChildDefinition);
  commitStructureDraft(result.root);
  await selectStructurePath(result.itemPath);
}

async function appendSkillEventHandler(): Promise<void> {
  const handlers = draft.value.eventHandlers ?? [];
  const result = insertStructureArrayItem(
    draft.value,
    'eventHandlers',
    createSkillEventHandlerDraft(handlers.map(handler => handler.key)),
  );
  commitStructureDraft(result.root);
  await selectStructurePath(result.itemPath);
}

async function appendEventResponse(stepPath: string): Promise<void> {
  const responsesPath = `${stepPath}.parameters.responses`;
  const responses = resolveStructureValue(
    draft.value,
    responsesPath,
  ) as readonly CombatEventResponseDefinition[];
  const result = insertStructureArrayItem(
    draft.value,
    responsesPath,
    createCombatEventResponseDraft(responses.map(response => response.key)),
  );
  commitStructureDraft(result.root);
  await selectStructurePath(result.itemPath);
}

async function appendConditionToPendingTarget(condition: CombatCondition): Promise<void> {
  const targetPath = pendingConditionTargetPath.value;
  if (targetPath === '') return;
  const target = resolveStructureValue(draft.value, targetPath) as
    CombatCondition | CombatEventResponseDefinition | CombatEventHandlerDefinition | undefined;
  if (
    target !== undefined &&
    'kind' in target &&
    (target.kind === 'all' || target.kind === 'any')
  ) {
    const result = insertStructureArrayItem(draft.value, `${targetPath}.conditions`, condition);
    pendingConditionTargetPath.value = '';
    commitStructureDraft(result.root);
    await selectStructurePath(result.itemPath);
    return;
  }
  if (target !== undefined && 'event' in target) {
    const conditionPath = `${targetPath}.condition`;
    pendingConditionTargetPath.value = '';
    commitStructureDraft(replaceStructureValueAtPath(draft.value, conditionPath, condition));
    await selectStructurePath(conditionPath);
    return;
  }
  pendingConditionTargetPath.value = '';
  commitStructureDraft(replaceStructureValueAtPath(draft.value, targetPath, condition));
  await selectStructurePath(targetPath);
}

async function appendStepToPendingSequence(kind: EditableCombatStepKind): Promise<void> {
  if (pendingStepTargetPath.value === '') return;
  const result = appendCombatStepAtSequencePath(
    draft.value,
    pendingStepTargetPath.value,
    createNestedStep(kind),
  );
  commitStructureDraft(result.skill, undefined, pendingStepTargetPath.value);
  pendingStepTargetPath.value = '';
  await selectStructurePath(result.stepPath);
}

async function revealValidationIssue(issue: ValidationIssue): Promise<void> {
  const target = findSkillStructureNodeForPath(structureRoot.value, issue.path);
  selectStructureNode(target);
  await nextTick();
  await structureMap.value?.revealNode(target.id);
}

function replaceSelectedSequence(
  sequence: NonNullable<SkillDefinition['scheduledSequences'][number]>,
): void {
  if (selectedScheduledSequence.value === undefined) return;
  commitStructureDraft(
    replaceStructureValueAtPath(draft.value, selectedStructureSourcePath.value, sequence),
  );
}

function setSelectedSequenceFrame(field: 'startFrame' | 'endFrame', event: Event): void {
  const sequence = selectedScheduledSequence.value;
  if (sequence === undefined) return;
  const raw = (event.target as HTMLInputElement).value;
  const next: ScheduledSequenceDefinition = { ...sequence };
  if (field === 'endFrame' && raw === '') delete next.endFrame;
  else {
    const value = Math.round(Number(raw));
    if (!Number.isFinite(value) || value < 0) return;
    next[field] = value;
  }
  replaceSelectedSequence(next);
}

function replaceSelectedCombatStep(
  step: CombatStepDefinition,
  propertyPath?: InspectorPropertyPath,
): void {
  if (selectedCombatStep.value === undefined) return;
  commitStructureDraft(
    replaceCombatStepAtPath(draft.value, selectedStructureSourcePath.value, step),
    propertyPath,
  );
}

function replaceSelectedGlobalBuffDefinition(definition: SkillGlobalBuffDefinition): void {
  if (selectedGlobalBuffDefinition.value === undefined) return;
  commitStructureDraft(
    replaceStructureValueAtPath(draft.value, selectedStructureSourcePath.value, definition),
  );
}

function replaceSelectedGlobalBuffChild(child: SkillGlobalBuffChildDefinition): void {
  if (selectedGlobalBuffChild.value === undefined) return;
  commitStructureDraft(
    replaceStructureValueAtPath(draft.value, selectedStructureSourcePath.value, child),
  );
}

function replaceSelectedInlineAbilityEntityChildSkill(
  childSkill: AbilityEntityChildSkillDefinition,
): void {
  if (selectedInlineAbilityEntityChildSkill.value === undefined) return;
  commitStructureDraft(
    replaceStructureValueAtPath(
      draft.value,
      selectedStructureSourcePath.value.replace(/\.scheduledSequences$/, ''),
      childSkill,
    ),
  );
}

async function moveSelectedCombatStep(offset: -1 | 1): Promise<void> {
  if (selectedCombatStep.value === undefined) return;
  const result = moveCombatStepAtPath(draft.value, selectedStructureSourcePath.value, offset);
  commitStructureDraft(result.skill);
  await selectStructurePath(result.stepPath);
}

async function duplicateSelectedCombatStep(): Promise<void> {
  if (selectedCombatStep.value === undefined) return;
  const result = duplicateCombatStepAtPath(
    draft.value,
    selectedStructureSourcePath.value,
    duplicateNestedStep,
  );
  commitStructureDraft(result.skill);
  await selectStructurePath(result.stepPath);
}

async function removeSelectedCombatStep(): Promise<void> {
  if (selectedCombatStep.value === undefined) return;
  const parentPath = selectedStructureSourcePath.value.replace(/\.steps\[\d+\]$/, '');
  commitStructureDraft(removeCombatStepAtPath(draft.value, selectedStructureSourcePath.value));
  await selectStructurePath(parentPath);
}

function childArrayPath(
  node: StructureOperationNode,
  kind:
    | 'combatStep'
    | 'scheduledSequence'
    | 'combatCondition'
    | 'eventResponse'
    | 'skillEventHandler'
    | 'globalBuffChild',
): string | undefined {
  if (kind === 'scheduledSequence') {
    return node.acceptsChildKind === kind
      ? node.sourcePath === ''
        ? 'scheduledSequences'
        : node.sourcePath
      : undefined;
  }
  if (kind === 'combatCondition') {
    return node.acceptsChildKind === kind ? `${node.sourcePath}.conditions` : undefined;
  }
  if (kind === 'eventResponse') {
    return node.acceptsChildKind === kind ? `${node.sourcePath}.parameters.responses` : undefined;
  }
  if (kind === 'skillEventHandler') {
    return node.acceptsChildKind === kind ? 'eventHandlers' : undefined;
  }
  if (kind === 'globalBuffChild') {
    return node.acceptsChildKind === kind ? `${node.sourcePath}.children` : undefined;
  }
  if (node.acceptsChildKind !== kind) return undefined;
  return node.payloadKind === 'scheduledSequence'
    ? `${node.sourcePath}.sequence.steps`
    : `${node.sourcePath}.steps`;
}

function insertionTarget(
  target: StructureOperationNode,
  kind:
    | 'combatStep'
    | 'scheduledSequence'
    | 'combatCondition'
    | 'eventResponse'
    | 'skillEventHandler'
    | 'globalBuffChild',
  placement: 'inside' | 'before' | 'after',
): { readonly arrayPath: string; readonly index?: number } | undefined {
  if (placement === 'inside') {
    const arrayPath = childArrayPath(target, kind);
    return arrayPath === undefined ? undefined : { arrayPath };
  }
  const match = /^(.*)\[(\d+)\]$/.exec(target.sourcePath);
  if (match === null || target.payloadKind !== kind) return undefined;
  return {
    arrayPath: match[1]!,
    index: Number(match[2]) + (placement === 'after' ? 1 : 0),
  };
}

async function moveStructureNode(operation: {
  readonly source: StructureOperationNode;
  readonly target: StructureOperationNode;
  readonly placement: 'inside' | 'before' | 'after';
}): Promise<void> {
  const kind = operation.source.payloadKind;
  if (isBuffGraphPayload(kind)) {
    const source = structureNodeIndex.value.get(operation.source.id);
    const target = structureNodeIndex.value.get(operation.target.id);
    if (!source || !target) return;
    const result = moveBuffGraphNode(draft.value, source, target, operation.placement);
    if (!result) return;
    commitStructureDraft(result.root);
    await nextTick();
    const moved = findSkillStructureNodeForPath(structureRoot.value, result.itemPath);
    structureMap.value?.transferCollapsedState(source.id, moved.id);
    await selectStructurePath(result.itemPath);
    return;
  }
  if (
    kind !== 'combatStep' &&
    kind !== 'scheduledSequence' &&
    kind !== 'combatCondition' &&
    kind !== 'eventResponse' &&
    kind !== 'skillEventHandler' &&
    kind !== 'globalBuffChild'
  )
    return;
  if (kind === 'combatCondition') {
    const source = /^(.*\.conditions)\[(\d+)\]$/.exec(operation.source.sourcePath);
    if (source === null) return;
    const siblings = resolveStructureValue(draft.value, source[1]!) as readonly unknown[];
    if (siblings.length <= 1) return;
  }
  if (kind === 'eventResponse') {
    const source = /^(.*\.responses)\[(\d+)\]$/.exec(operation.source.sourcePath);
    if (source === null) return;
    const siblings = resolveStructureValue(draft.value, source[1]!) as readonly unknown[];
    if (siblings.length <= 1) return;
  }
  if (kind === 'globalBuffChild') {
    const source = /^(.*\.children)\[(\d+)\]$/.exec(operation.source.sourcePath);
    if (source === null) return;
    const siblings = resolveStructureValue(draft.value, source[1]!) as readonly unknown[];
    if (siblings.length <= 1) return;
  }
  const target = insertionTarget(operation.target, kind, operation.placement);
  if (target === undefined) return;
  const result = moveStructureArrayItem(
    draft.value,
    operation.source.sourcePath,
    target.arrayPath,
    target.index,
  );
  commitStructureDraft(result.root);
  await nextTick();
  const movedNode = findSkillStructureNodeForPath(structureRoot.value, result.itemPath);
  structureMap.value?.transferCollapsedState(operation.source.id, movedNode.id);
  await selectStructurePath(result.itemPath);
}

async function runStructureNodeAction(
  action: 'delete' | 'copy' | 'paste',
  node: StructureOperationNode,
): Promise<void> {
  const damageNode = structureNodeIndex.value.get(node.id);
  if (action === 'copy' && isBuffGraphPayload(damageNode?.payloadKind)) {
    structureClipboard.value = {
      kind: damageNode.payloadKind,
      value: cloneStructureValue(resolveStructureValue(draft.value, node.sourcePath)),
    };
    return;
  }
  if (action === 'delete' && damageNode?.canDelete && isBuffDetailNode(damageNode)) {
    commitStructureDraft(
      /\[\d+\]$/.test(node.sourcePath)
        ? removeStructureArrayItem(draft.value, node.sourcePath)
        : deleteStructureValueAtPath(draft.value, node.sourcePath),
    );
    await selectStructurePath(node.sourcePath.replace(/(?:\[\d+\]|\.[^.]+)$/, ''));
    return;
  }
  if (action === 'delete' && node.sourcePath === 'switchToBuffCast') {
    commitStructureDraft(
      { ...draft.value, switchToBuffCast: undefined },
      undefined,
      'switchToBuffCast',
    );
    return;
  }
  if (action === 'delete' && node.sourcePath.startsWith('inputWindows')) {
    const next =
      node.sourcePath === 'inputWindows'
        ? { ...draft.value, inputWindows: undefined }
        : removeStructureArrayItem(draft.value, node.sourcePath);
    commitStructureDraft(next, undefined, 'inputWindows');
    await nextTick();
    await selectStructurePath('inputWindows');
    return;
  }
  if (action === 'copy') {
    if (node.payloadKind === 'combatStep') {
      structureClipboard.value = {
        kind: 'combatStep',
        value: cloneStructureValue(
          resolveSkillStructureValue(draft.value, node.sourcePath) as CombatStepDefinition,
        ),
      };
    } else if (node.payloadKind === 'scheduledSequence') {
      structureClipboard.value = {
        kind: 'scheduledSequence',
        value: cloneStructureValue(
          resolveSkillStructureValue(draft.value, node.sourcePath) as ScheduledSequenceDefinition,
        ),
      };
    } else if (node.payloadKind === 'combatCondition') {
      structureClipboard.value = {
        kind: 'combatCondition',
        value: cloneStructureValue(
          resolveStructureValue(draft.value, node.sourcePath) as CombatCondition,
        ),
      };
    } else if (node.payloadKind === 'eventResponse') {
      structureClipboard.value = {
        kind: 'eventResponse',
        value: cloneStructureValue(
          resolveStructureValue(draft.value, node.sourcePath) as CombatEventResponseDefinition,
        ),
      };
    } else if (node.payloadKind === 'skillEventHandler') {
      structureClipboard.value = {
        kind: 'skillEventHandler',
        value: cloneStructureValue(
          resolveStructureValue(draft.value, node.sourcePath) as CombatEventHandlerDefinition,
        ),
      };
    } else if (node.payloadKind === 'globalBuffChild') {
      structureClipboard.value = {
        kind: 'globalBuffChild',
        value: cloneStructureValue(
          resolveStructureValue(draft.value, node.sourcePath) as SkillGlobalBuffChildDefinition,
        ),
      };
    }
    return;
  }
  if (action === 'delete' && node.payloadKind !== undefined) {
    if (node.payloadKind === 'combatCondition') {
      const child = /^(.*\.conditions)\[\d+\]$/.exec(node.sourcePath);
      if (child !== null) {
        const siblings = resolveStructureValue(draft.value, child[1]!) as readonly unknown[];
        if (siblings.length <= 1) return;
        commitStructureDraft(removeStructureArrayItem(draft.value, node.sourcePath));
        await selectStructurePath(child[1]!.replace(/\.conditions$/, ''));
        return;
      }
      if (
        node.sourcePath !== 'availability' &&
        !/\.parameters\.responses\[\d+\]\.condition$/.test(node.sourcePath) &&
        !/^eventHandlers\[\d+\]\.condition$/.test(node.sourcePath)
      )
        return;
      commitStructureDraft(deleteStructureValueAtPath(draft.value, node.sourcePath));
      await selectStructurePath(node.sourcePath.replace(/\.condition$/, ''));
      return;
    }
    if (node.payloadKind === 'eventResponse') {
      const responses = /^(.*\.responses)\[\d+\]$/.exec(node.sourcePath);
      if (responses === null) return;
      const siblings = resolveStructureValue(draft.value, responses[1]!) as readonly unknown[];
      if (siblings.length <= 1) return;
      commitStructureDraft(removeStructureArrayItem(draft.value, node.sourcePath));
      await selectStructurePath(responses[1]!.replace(/\.parameters\.responses$/, ''));
      return;
    }
    if (node.payloadKind === 'skillEventHandler') {
      commitStructureDraft(removeStructureArrayItem(draft.value, node.sourcePath));
      await selectStructurePath('eventHandlers');
      return;
    }
    if (node.payloadKind === 'globalBuffChild') {
      const children = /^(.*\.children)\[\d+\]$/.exec(node.sourcePath);
      if (children === null) return;
      const siblings = resolveStructureValue(draft.value, children[1]!) as readonly unknown[];
      if (siblings.length <= 1) return;
      commitStructureDraft(removeStructureArrayItem(draft.value, node.sourcePath));
      await selectStructurePath(children[1]!.replace(/\.children$/, ''));
      return;
    }
    const parentPath = node.sourcePath.replace(
      /\.steps\[\d+\]$|(?:^|\.)scheduledSequences\[\d+\]$/,
      '',
    );
    commitStructureDraft(removeStructureArrayItem(draft.value, node.sourcePath));
    await selectStructurePath(parentPath);
    return;
  }
  const clipboard = structureClipboard.value;
  if (isBuffGraphClipboard(clipboard)) {
    if (action !== 'paste') return;
    const target = structureNodeIndex.value.get(node.id);
    const result = target && pasteBuffGraphNode(draft.value, target, clipboard);
    if (result) {
      commitStructureDraft(result.root);
      await selectStructurePath(result.itemPath);
    }
    return;
  }
  if (action !== 'paste' || clipboard === undefined) return;
  const arrayPath = childArrayPath(node, clipboard.kind);
  if (arrayPath === undefined) return;
  const value =
    clipboard.kind === 'combatStep'
      ? duplicateNestedStep(clipboard.value)
      : clipboard.kind === 'scheduledSequence'
        ? {
            ...clipboard.value,
            sequence: { steps: clipboard.value.sequence.steps.map(duplicateNestedStep) },
          }
        : clipboard.kind === 'eventResponse'
          ? {
              ...cloneStructureValue(clipboard.value),
              key: createCombatEventResponseDraft(
                (
                  resolveStructureValue(
                    draft.value,
                    arrayPath,
                  ) as readonly CombatEventResponseDefinition[]
                ).map(response => response.key),
              ).key,
              sequence: {
                steps: clipboard.value.sequence.steps.map(duplicateNestedStep),
              },
            }
          : clipboard.kind === 'skillEventHandler'
            ? {
                ...cloneStructureValue(clipboard.value),
                key: createSkillEventHandlerDraft(
                  (draft.value.eventHandlers ?? []).map(handler => handler.key),
                ).key,
                scheduledSequences: clipboard.value.scheduledSequences.map(sequence => ({
                  ...sequence,
                  sequence: { steps: sequence.sequence.steps.map(duplicateNestedStep) },
                })),
              }
            : cloneStructureValue(clipboard.value);
  const result = insertStructureArrayItem(draft.value, arrayPath, value);
  commitStructureDraft(result.root);
  await selectStructurePath(result.itemPath);
}

async function appendSequence(targetPath = ''): Promise<void> {
  if (targetPath === '') {
    const next = appendSkillEditorSequence(draft.value);
    const index = next.scheduledSequences.length - 1;
    commitStructureDraft(next);
    await selectStructurePath(`scheduledSequences[${index}]`);
    return;
  }
  const result = insertStructureArrayItem(draft.value, targetPath, {
    startFrame: 0,
    sequence: { steps: [] },
  } satisfies ScheduledSequenceDefinition);
  commitStructureDraft(result.root);
  await selectStructurePath(result.itemPath);
}

function moveSequence(offset: -1 | 1): void {
  if (typeof selectedSection.value !== 'number') return;
  const target = selectedSection.value + offset;
  if (target < 0 || target >= draft.value.scheduledSequences.length) return;
  commitStructureDraft(moveSkillEditorSequence(draft.value, selectedSection.value, offset));
  selectedSection.value = target;
  selectedStructureNodeId.value = `sequence:${target}`;
  selectedStructureSourcePath.value = `scheduledSequences[${target}]`;
}

function duplicateSequence(): void {
  if (typeof selectedSection.value !== 'number') return;
  commitStructureDraft(duplicateSkillEditorSequence(draft.value, selectedSection.value));
  selectedSection.value += 1;
  selectedStructureNodeId.value = `sequence:${selectedSection.value}`;
  selectedStructureSourcePath.value = `scheduledSequences[${selectedSection.value}]`;
}

function removeSequence(): void {
  if (typeof selectedSection.value !== 'number') return;
  const current = selectedSection.value;
  commitStructureDraft(removeSkillEditorSequence(draft.value, current));
  selectedSection.value = Math.max(0, Math.min(current, draft.value.scheduledSequences.length - 1));
  selectedStructureNodeId.value =
    draft.value.scheduledSequences.length === 0 ? 'skill' : `sequence:${selectedSection.value}`;
  selectedStructureSourcePath.value =
    draft.value.scheduledSequences.length === 0
      ? ''
      : `scheduledSequences[${selectedSection.value}]`;
}

function save(): void {
  emit('save', cloneEditorDefinition(draft.value));
}

function cancel(): void {
  draft.value = createSkillEditorDraft(
    cloneEditorDefinition(props.template),
    props.customDefinition === undefined
      ? undefined
      : cloneEditorDefinition(props.customDefinition),
  );
  emit('cancel');
}

function reset(): void {
  emit('reset');
}
</script>

<template>
  <section ref="editorRoot" class="skill-editor">
    <header class="skill-editor__header">
      <div>
        <strong>{{ labels.section }}</strong>
        <span>{{ labels.structure }}</span>
      </div>
      <div class="skill-editor__status">
        <span v-if="customized">{{ labels.customized }}</span>
        <span>{{ t('timeline.skillEditing.diffCount', { count: view.diffCount }) }}</span>
        <EaButton
          v-if="backLabel"
          type="button"
          class="definition-focused-back"
          size="sm"
          @click="cancel"
        >
          ← {{ backLabel }}
        </EaButton>
      </div>
    </header>

    <div class="skill-editor__workspace">
      <SkillStructureMindMap
        ref="structureMap"
        class="skill-editor__map"
        :root="structureRoot"
        :view-state-key="viewStateKey"
        :selected-id="selectedStructureNodeId"
        :show-reference-pins="showReferencePins"
        :clipboard-kind="structureClipboard?.kind"
        :can-undo="canUndoStructure"
        :can-redo="canRedoStructure"
        @select="selectStructureNode"
        @reference="emit('reference', $event)"
        @add-child="beginAddChild"
        @move-node="moveStructureNode"
        @node-action="runStructureNodeAction"
        @history-action="restoreStructureHistory"
      />

      <main class="skill-editor__detail">
        <StepTypePicker
          v-if="pendingStepTargetPath"
          :key="stepPickerKey"
          class="floating-step-picker"
          :anchor="insertAnchor"
          hide-trigger
          open-on-mount
          @select="appendStepToPendingSequence"
          @close="pendingStepTargetPath = ''"
        />
        <CombatConditionTypePicker
          v-if="pendingConditionTargetPath"
          :key="`condition:${stepPickerKey}`"
          :anchor="insertAnchor"
          @select="appendConditionToPendingTarget"
          @close="pendingConditionTargetPath = ''"
        />
        <SkillInputWindowInspector
          v-if="selectedStructureSourcePath.startsWith('inputWindows')"
          :path="selectedStructureSourcePath"
          :value="resolveStructureValue(draft.value, selectedStructureSourcePath)"
          @update="
            commitStructureDraft(
              replaceStructureValueAtPath(draft.value, selectedStructureSourcePath, $event),
            )
          "
        />
        <SkillSwitchToBuffInspector
          v-else-if="selectedStructureSourcePath === 'switchToBuffCast'"
          :value="draft.value.switchToBuffCast"
          @update="commitStructureDraft({ ...draft.value, switchToBuffCast: $event })"
        />
        <BuffDetailNodeInspector
          v-else-if="selectedStructureNode && isBuffDetailNode(selectedStructureNode)"
          :node="selectedStructureNode"
          :property="selectedProperty"
        />
        <template v-else-if="selectedSection === 'overview'">
          <section class="editor-section">
            <h4>技能身份与等级</h4>
            <label class="skill-editor__row"
              >技能标识<input
                :value="draft.value.key"
                @change="
                  commitStructureDraft({
                    ...draft.value,
                    key: ($event.target as HTMLInputElement).value,
                  })
                "
            /></label>
            <label class="skill-editor__row"
              >技能分类<select
                :value="draft.value.skillType ?? ''"
                @change="
                  commitStructureDraft({
                    ...draft.value,
                    skillType: (($event.target as HTMLSelectElement).value ||
                      undefined) as SkillDefinition['skillType'],
                  })
                "
              >
                <option value="">未指定</option>
                <option v-for="kind in SKILL_TYPES" :key="kind" :value="kind">
                  {{
                    {
                      basicAttack: '普攻',
                      battleSkill: '战技',
                      comboSkill: '连携',
                      ultimate: '终结技',
                      finisher: '处决',
                      plungingAttack: '下落攻击',
                      dodge: '极限闪避',
                    }[kind]
                  }}
                </option>
              </select></label
            >
            <label class="skill-editor__row"
              >等级来源<select
                :value="draft.value.levelSource ?? ''"
                @change="
                  commitStructureDraft({
                    ...draft.value,
                    levelSource: (($event.target as HTMLSelectElement).value ||
                      undefined) as SkillDefinition['levelSource'],
                  })
                "
              >
                <option value="">未指定</option>
                <option v-for="source in SKILL_LEVEL_SOURCES" :key="source" :value="source">
                  {{
                    {
                      basicAttack: '普攻',
                      battleSkill: '战技',
                      comboSkill: '连携',
                      ultimate: '终结技',
                    }[source]
                  }}
                </option>
              </select></label
            >
          </section>
          <section class="editor-section">
            <h4>原生身份与目标</h4>
            <InspectorFields
              :value="draft.value"
              :binding="editContext.root"
              :fields="skillRuntimeIdentityFields"
            />
          </section>
          <section class="editor-section">
            <h4>运行时时序</h4>
            <InspectorFields
              :value="draft.value"
              :binding="editContext.root"
              :fields="skillRuntimeTimingFields"
            />
          </section>
          <section class="editor-section">
            <h4>{{ labels.overview }}</h4>
            <div class="editor-grid">
              <label class="skill-editor__row">
                <span class="skill-editor__label">
                  <EditorFieldLabel
                    :label="labels.timelineBlockFrames"
                    :help="t('timeline.skillEditing.fieldHelp.timelineBlockFrames')"
                  />
                  <b v-if="view.timelineBlockFramesChanged">*</b>
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  class="skill-editor__input"
                  :value="view.timelineBlockFrames"
                  @input="setField('timelineBlockFrames', $event)"
                />
              </label>

              <label class="skill-editor__row">
                <span class="skill-editor__label">
                  <EditorFieldLabel
                    :label="labels.costFrame"
                    :help="t('timeline.skillEditing.fieldHelp.costFrame')"
                  />
                  <b v-if="view.costFrameChanged">*</b>
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  class="skill-editor__input"
                  :value="view.costFrame ?? ''"
                  @input="setField('costFrame', $event)"
                />
              </label>

              <label class="skill-editor__row skill-editor__row--wide">
                <span class="skill-editor__label">
                  <EditorFieldLabel
                    :label="t('timeline.skillEditing.enhancementStateBuffId')"
                    :help="t('timeline.skillEditing.fieldHelp.enhancementStateBuffId')"
                  />
                  <b v-if="view.enhancementStateBuffIdChanged">*</b>
                </span>
                <input
                  type="text"
                  class="skill-editor__input"
                  list="skill-enhancement-state-buff-ids"
                  :placeholder="t('timeline.skillEditing.none')"
                  :value="view.enhancementStateBuffId ?? ''"
                  @change="setEnhancementStateBuffId"
                />
                <datalist id="skill-enhancement-state-buff-ids">
                  <option v-for="buffId in buffIds ?? []" :key="buffId" :value="buffId" />
                </datalist>
              </label>
            </div>
          </section>

          <section class="editor-section">
            <h4>{{ labels.costs }}</h4>
            <div
              v-for="resource in costFields"
              :key="resource"
              class="skill-editor__row"
              :data-property-path="
                JSON.stringify([
                  'costs',
                  draft.value.costs?.findIndex(cost => cost.resource === resource) ?? -1,
                  'value',
                ])
              "
            >
              <span>{{
                t(
                  `timeline.skillEditing.${resource === 'sp' ? 'spConsumption' : 'ultimateEnergyConsumption'}`,
                )
              }}</span>
              <LevelValuesEditor
                :value="resourceCost(resource)"
                :current-level="skillLevel"
                @update="setResourceCost(resource, $event)"
              />
            </div>
          </section>
        </template>

        <SkillBlackboardEditor
          v-else-if="selectedSection === 'blackboard'"
          :blackboard="draft.value.blackboard ?? {}"
          :skill-level="skillLevel"
          @update="setBlackboard"
        />

        <DefinitionPropertyScope v-else-if="selectedCombatCondition" :property="selectedProperty">
          <CombatConditionEditor :condition="selectedCombatCondition" layer-only />
        </DefinitionPropertyScope>

        <CombatEventResponseInspector
          v-else-if="selectedEventResponse"
          :response="selectedEventResponse"
          :binding="selectedProperty"
        />

        <CombatEventResponseInspector
          v-else-if="selectedSkillEventHandler"
          :response="selectedSkillEventHandler"
          :binding="selectedProperty"
          scheduled
        />

        <BuffStepEditor
          v-else-if="selectedInlineBuff"
          :key="selectedStructureSourcePath"
          :step="selectedInlineBuff"
          :definition-binding="selectedProperty"
          :skill-level="skillLevel"
          :create-step="createNestedStep"
          :duplicate-step="duplicateNestedStep"
          definition-only
          modifier-collections-in-graph
          inspector-only
          @update="updateInlineBuff"
        />
        <GlobalBuffDefinitionInspector
          v-else-if="selectedGlobalBuffDefinition"
          :definition="selectedGlobalBuffDefinition"
          @update="replaceSelectedGlobalBuffDefinition"
        />

        <GlobalBuffChildInspector
          v-else-if="selectedGlobalBuffChild"
          :child="selectedGlobalBuffChild"
          @update="replaceSelectedGlobalBuffChild"
        />

        <InlineAbilityEntityChildSkillInspector
          v-else-if="selectedInlineAbilityEntityChildSkill"
          :child-skill="selectedInlineAbilityEntityChildSkill"
          :skill-level="skillLevel"
          @update="replaceSelectedInlineAbilityEntityChildSkill"
        />

        <section
          v-else-if="selectedSection === 'availability'"
          class="editor-section node-inspector"
        >
          <header class="node-inspector__header">
            <div>
              <span>技能设置</span>
              <strong>{{ t('timeline.skillEditing.availability') }}</strong>
            </div>
          </header>
          <p class="node-inspector__hint">当前未设置条件；从左侧节点的加号选择条件类型。</p>
        </section>

        <section v-else-if="selectedScheduledSequence" class="editor-section node-inspector">
          <header class="node-inspector__header">
            <div>
              <span>动作序列</span>
              <strong>{{ `${labels.sequence} ${selectedScheduledSequenceIndex! + 1}` }}</strong>
            </div>
            <div v-if="selectedRootSequence" class="node-inspector__toolbar">
              <button
                type="button"
                class="icon-button"
                :disabled="selectedScheduledSequenceIndex === 0"
                :title="t('timeline.skillEditing.moveSequenceUp')"
                @click="moveSequence(-1)"
              >
                <el-icon><ArrowUp /></el-icon>
              </button>
              <button
                type="button"
                class="icon-button"
                :disabled="selectedScheduledSequenceIndex === view.sequences.length - 1"
                :title="t('timeline.skillEditing.moveSequenceDown')"
                @click="moveSequence(1)"
              >
                <el-icon><ArrowDown /></el-icon>
              </button>
              <button
                type="button"
                class="icon-button"
                :title="t('timeline.skillEditing.duplicateSequence')"
                @click="duplicateSequence"
              >
                <el-icon><CopyDocument /></el-icon>
              </button>
              <button
                type="button"
                class="icon-button icon-button--danger"
                :disabled="view.sequences.length <= 1"
                :title="t('timeline.skillEditing.deleteSequence')"
                @click="removeSequence"
              >
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </header>
          <div class="editor-grid">
            <label class="skill-editor__row">
              <EditorFieldLabel
                :label="labels.startFrame"
                :help="t('timeline.skillEditing.fieldHelp.sequenceStartFrame')"
              />
              <input
                type="number"
                min="0"
                step="1"
                class="skill-editor__input"
                :value="selectedScheduledSequence.startFrame"
                @input="setSelectedSequenceFrame('startFrame', $event)"
              />
            </label>
            <label class="skill-editor__row">
              <EditorFieldLabel
                :label="labels.endFrame"
                :help="t('timeline.skillEditing.fieldHelp.sequenceEndFrame')"
              />
              <input
                type="number"
                min="0"
                step="1"
                class="skill-editor__input"
                :value="selectedScheduledSequence.endFrame ?? ''"
                @input="setSelectedSequenceFrame('endFrame', $event)"
              />
            </label>
          </div>
          <p class="node-inspector__hint">子步骤在左侧导图中添加和选择。</p>
        </section>

        <section v-else-if="selectedCombatStep" class="editor-section node-inspector">
          <header class="node-inspector__header">
            <div>
              <span>战斗步骤</span>
              <strong>{{ t(`timeline.skillEditing.stepKinds.${selectedCombatStep.kind}`) }}</strong>
            </div>
            <div class="node-inspector__toolbar">
              <button class="icon-button" @click="moveSelectedCombatStep(-1)">
                <el-icon><ArrowUp /></el-icon>
              </button>
              <button class="icon-button" @click="moveSelectedCombatStep(1)">
                <el-icon><ArrowDown /></el-icon>
              </button>
              <button class="icon-button" @click="duplicateSelectedCombatStep">
                <el-icon><CopyDocument /></el-icon>
              </button>
              <button class="icon-button icon-button--danger" @click="removeSelectedCombatStep">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </header>
          <DefinitionPropertyScope :property="selectedProperty">
            <CombatStepEditor
              inline-buff-in-graph
              :step="selectedCombatStep"
              :skill-level="skillLevel"
              :create-step="createNestedStep"
              :duplicate-step="duplicateNestedStep"
              :show-header="false"
              inspector-only
              @update="replaceSelectedCombatStep"
            />
          </DefinitionPropertyScope>
          <p v-if="selectedStructureNode?.children.length" class="node-inspector__hint">
            分支和子步骤在左侧导图中编辑。
          </p>
        </section>

        <section
          v-else-if="selectedStructureNode?.canAddChild === 'step'"
          class="editor-section node-inspector"
        >
          <header class="node-inspector__header">
            <div>
              <span>{{ selectedStructureNode.kind }}</span>
              <strong>{{ selectedStructureNode.label }}</strong>
            </div>
          </header>
          <p class="node-inspector__hint">此节点只承载有序子步骤，请使用导图节点上的＋添加。</p>
        </section>

        <section v-else-if="selectedStructureNode" class="editor-section node-inspector">
          <header class="node-inspector__header">
            <div>
              <span>{{ selectedStructureNode.kind }}</span>
              <strong>{{ selectedStructureNode.label }}</strong>
            </div>
          </header>
          <dl class="node-inspector__details">
            <template v-for="(value, key) in selectedStructureNode.details" :key="key">
              <dt>{{ key }}</dt>
              <dd>{{ value }}</dd>
            </template>
          </dl>
          <p class="node-inspector__hint">此处只显示本层字段；子结构在左侧导图中展开和选择。</p>
        </section>
      </main>
    </div>

    <footer v-if="!sharedHistory" class="skill-editor__footer">
      <div class="skill-editor__footer-status">
        <span v-if="customized">{{
          t('timeline.skillEditing.diffCount', { count: view.diffCount })
        }}</span>
        <details v-if="validationIssues.length > 0" class="validation-issues">
          <summary>
            {{
              t('timeline.skillEditing.validationIssueCount', {
                count: validationIssues.length,
              })
            }}
          </summary>
          <ul>
            <li v-for="issue in validationIssues" :key="`${issue.path}:${issue.message}`">
              <button type="button" @click="revealValidationIssue(issue)">
                <code>{{ issue.path }}</code>
                <span>{{ issue.message }}</span>
              </button>
            </li>
          </ul>
        </details>
      </div>
      <div class="skill-editor__actions">
        <button
          v-if="customized"
          type="button"
          class="skill-editor__button skill-editor__button--danger"
          @click="reset"
        >
          {{ labels.reset }}
        </button>
        <button type="button" class="skill-editor__button" @click="cancel">
          {{ labels.cancel }}
        </button>
        <button
          type="button"
          class="skill-editor__button skill-editor__button--primary"
          :disabled="!allowInvalidSave && validationIssues.length > 0"
          @click="save"
        >
          {{ labels.save }}
        </button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.skill-editor {
  height: min(760px, calc(100vh - 150px));
  min-height: 520px;
  display: flex;
  flex-direction: column;
  background: var(--ea-workbench-panel);
  color: var(--ea-fg);
  font-size: 12px;
}

.skill-editor__header {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 16px;
  border-bottom: 1px solid var(--ea-border-soft);
  flex-wrap: wrap;
}

.skill-editor__header > div:first-child {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.skill-editor__header strong {
  font-size: 16px;
}

.skill-editor__header span,
.skill-editor__status {
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.skill-editor__status {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.skill-editor__status span:first-child {
  color: var(--ea-gold);
}

.skill-editor__workspace {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    var(--definition-inspector-width, clamp(320px, 25vw, 420px));
}

.skill-editor__map {
  min-width: 0;
  min-height: 0;
  border-right: 1px solid var(--ea-border-soft);
}

.map-add-sequence {
  height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 9px;
  border: 1px solid var(--ea-border);
  background: var(--ea-fill-soft);
  color: var(--ea-fg);
  cursor: pointer;
}

.skill-editor__tree {
  min-height: 0;
  padding: 12px 8px;
  border-right: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
  overflow-y: auto;
}

.skill-editor__tree button {
  width: 100%;
  min-height: 38px;
  display: grid;
  grid-template-columns: 24px 1fr auto;
  align-items: center;
  gap: 7px;
  margin-bottom: 3px;
  padding: 0 9px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ea-fg-muted);
  text-align: left;
  cursor: pointer;
}

.skill-editor__tree button:hover,
.skill-editor__tree button.is-active {
  border-color: var(--ea-border);
  background: var(--ea-active-fill);
  color: var(--ea-fg);
}

.skill-editor__tree .tree-add {
  display: flex;
  justify-content: center;
  border-style: dashed;
}

.skill-editor__tree button.is-active {
  border-left: 3px solid var(--ea-gold);
}

.tree-index,
.tree-icon {
  color: var(--ea-gold);
  text-align: center;
}

.skill-editor__tree small {
  color: var(--ea-fg-muted);
}

.tree-group-label {
  margin: 16px 9px 6px;
  color: var(--ea-fg-muted);
  font-size: 10px;
  font-weight: 700;
}

.skill-editor__detail {
  position: relative;
  min-width: 0;
  padding: 18px 20px;
  overflow: auto;
  container-type: inline-size;
}
.floating-step-picker {
  position: absolute;
  width: 0;
  height: 0;
  overflow: visible;
}
.node-inspector__header {
  min-height: 46px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 10px 0 12px;
  border-bottom: 1px solid var(--ea-border-soft);
}
.node-inspector__header > div:first-child {
  min-width: 0;
  display: grid;
  gap: 2px;
}
.node-inspector__header strong {
  min-width: 0;
  overflow-wrap: anywhere;
}
.node-inspector__header span {
  color: var(--ea-fg-muted);
  font-size: 9px;
  text-transform: uppercase;
}
.node-inspector__toolbar {
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}
.node-inspector__details {
  display: grid;
  grid-template-columns: minmax(96px, 0.45fr) minmax(0, 1fr);
  margin: 0;
  padding: 10px 12px;
}
.node-inspector__details dt,
.node-inspector__details dd {
  min-width: 0;
  margin: 0;
  padding: 6px 8px;
  border-bottom: 1px solid var(--ea-border-soft);
  overflow-wrap: anywhere;
}
.node-inspector__details dt {
  color: var(--ea-fg-muted);
}
.node-inspector__hint {
  margin: 0;
  padding: 10px 12px;
  border-top: 1px solid var(--ea-border-soft);
  color: var(--ea-fg-muted);
  font-size: 11px;
}
.node-inspector :deep(.step-editor) {
  border: 0;
}

.editor-section {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  margin-bottom: 16px;
  border: 1px solid var(--ea-border-soft);
  background: var(--ea-fill-soft);
}

.editor-section h4 {
  margin: 0;
  padding: 9px 12px;
  border-bottom: 1px solid var(--ea-border-soft);
  color: var(--ea-fg);
  font-size: 12px;
}

.sequence-heading {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 10px;
  border-bottom: 1px solid var(--ea-border-soft);
}

.section-heading {
  min-height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 10px;
  border-bottom: 1px solid var(--ea-border-soft);
}

.section-heading h4 {
  flex: 1;
  border-bottom: none;
}

.sequence-heading h4 {
  flex: 1;
  border-bottom: none;
}

.sequence-heading > div {
  display: flex;
  gap: 4px;
}

.editor-grid,
.sequence-frame-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  padding: 14px;
}

.cost-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 14px;
}

.skill-editor__label b {
  margin-left: 2px;
  color: var(--ea-gold);
}

.skill-editor__row {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(90px, 1fr) minmax(100px, 140px);
  align-items: center;
  gap: 12px;
}

.skill-editor__row--wide {
  grid-column: 1 / -1;
  grid-template-columns: minmax(180px, 1fr) minmax(300px, 2fr);
}

.skill-editor__label {
  flex: 0 0 auto;
  color: var(--ea-fg-muted);
  font-size: 10px;
}

.skill-editor__input {
  width: 100%;
  height: 30px;
  box-sizing: border-box;
  border: 1px solid var(--ea-border);
  border-radius: 2px;
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  padding: 0 6px;
  font:
    12px/24px Consolas,
    monospace;
  text-align: center;
}

.skill-editor__readonly {
  color: var(--ea-fg-muted);
  font-size: 11px;
}

.skill-editor__cost {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 12px;
  border: 1px solid var(--ea-border-soft);
}

.cost-heading {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--ea-border-soft);
}

.cost-heading strong {
  color: var(--ea-fg);
  font-size: 11px;
}

.icon-button {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: 1px solid var(--ea-border);
  border-radius: 2px;
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  cursor: pointer;
}

.icon-button:hover:not(:disabled) {
  border-color: var(--ea-gold);
  color: var(--ea-gold);
}

.icon-button--danger:hover:not(:disabled) {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.icon-button:disabled {
  opacity: 0.35;
  cursor: default;
}

.skill-editor__footer {
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-top: 1px solid var(--ea-border-soft);
  color: var(--ea-fg-muted);
  font-size: 11px;
  gap: 10px;
  flex-wrap: wrap;
}

.skill-editor__footer-status {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.validation-issues {
  position: relative;
  color: #ff6b6b;
}

.validation-issues summary {
  cursor: pointer;
}

.validation-issues ul {
  position: absolute;
  bottom: 24px;
  left: 0;
  z-index: 8;
  width: min(560px, 60vw);
  max-height: 240px;
  margin: 0;
  padding: 10px 14px;
  overflow: auto;
  border: 1px solid #7d3034;
  background: var(--ea-workbench-panel);
  box-shadow: 0 5px 18px rgb(0 0 0 / 45%);
  list-style: none;
}

.validation-issues li {
  padding: 0;
}

.validation-issues li button {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(160px, 1fr);
  gap: 10px;
  padding: 5px 4px;
  border: 0;
  background: transparent;
  color: #ff6b6b;
  text-align: left;
  cursor: pointer;
}

.validation-issues li button:hover {
  background: var(--ea-active-fill);
}

.validation-issues code {
  color: var(--ea-fg-muted);
  overflow-wrap: anywhere;
}

.skill-editor__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.skill-editor__button {
  min-width: 88px;
  height: 30px;
  border: 1px solid var(--ea-border);
  border-radius: 2px;
  background: var(--ea-fill-input, #16161a);
  color: var(--ea-fg);
  cursor: pointer;
  font-size: 11px;
}

.skill-editor__button:hover {
  border-color: var(--ea-gold);
}

.skill-editor__button--danger:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.skill-editor__button--primary {
  border-color: var(--ea-gold);
  background: var(--ea-active-fill);
}

.skill-editor__button:disabled {
  opacity: 0.4;
  cursor: default;
}

.editor-empty {
  padding: 20px;
  color: var(--ea-fg-muted);
  text-align: center;
}

@container (max-width: 700px) {
  .editor-grid,
  .sequence-frame-grid {
    grid-template-columns: 1fr;
  }
}

@container (max-width: 430px) {
  .skill-editor__row {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .node-inspector__header {
    align-items: flex-start;
    flex-direction: column;
    padding: 9px 10px;
  }
}

@media (max-width: 820px) {
  .skill-editor__workspace {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .skill-editor__map {
    min-height: 380px;
    border-right: 0;
    border-bottom: 1px solid var(--ea-border-soft);
  }

  .skill-editor__detail {
    overflow: visible;
  }

  .validation-issues ul {
    left: auto;
    right: 0;
    width: min(520px, calc(100vw - 48px));
  }
}
</style>
