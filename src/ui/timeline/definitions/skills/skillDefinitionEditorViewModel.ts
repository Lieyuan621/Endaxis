/**
 * 技能逻辑编辑面板的纯函数视图模型。
 *
 * 本模块把“当前模板 + 已存在的自定义定义”投影为属性面板可渲染的只读摘要，
 * 并提供草稿编辑的纯函数。它不持有 Vue 状态、不翻译文本、也不直接写入场景；
 * 草稿只有交给 `setSkillCastCustomDefinition` 严格校验后才会形成一次项目变更，
 * 取消编辑或恢复模板则直接丢弃草稿或删除整个 `customDefinition`。
 */
import type {
  ActionValueOperand,
  CombatStepDefinition,
  CombatStepKind,
  CombatEventResponseDefinition,
  CombatEventHandlerDefinition,
  LevelValues,
  ScheduledSequenceDefinition,
  SkillBuffAbilityEventResponse,
  SkillBuffIgniteEventResponse,
  SkillDefinition,
} from '../../../../core/game-data/operatorDefinition';
import { diffSkillDefinition } from '../../../../core/game-data/diffSkillDefinition';

export function createCombatEventResponseDraft(
  existingKeys: readonly string[] = [],
): CombatEventResponseDefinition {
  let index = existingKeys.length + 1;
  let key = `event-response-${index}`;
  while (existingKeys.includes(key)) key = `event-response-${++index}`;
  return {
    key,
    event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
    sequence: { steps: [] },
  };
}

export function createSkillEventHandlerDraft(
  existingKeys: readonly string[] = [],
): CombatEventHandlerDefinition {
  let index = existingKeys.length + 1;
  let key = `skill-event-handler-${index}`;
  while (existingKeys.includes(key)) key = `skill-event-handler-${++index}`;
  return {
    key,
    event: { kind: 'damageTagHit', tag: 'normalSkill', scope: 'operator' },
    scheduledSequences: [{ startFrame: 0, sequence: { steps: [] } }],
  };
}

export function createBuffAbilityEventResponseDraft(): SkillBuffAbilityEventResponse {
  return { event: 'outputDamage', priority: 0, sequence: { steps: [] } };
}

export function createBuffIgniteEventResponseDraft(): SkillBuffIgniteEventResponse {
  return { igniteType: 'custom-ignite', finishAfterIgnited: false, sequence: { steps: [] } };
}

/** 读取当前技能等级对应的数值；单值定义对所有等级生效。 */
export function resolveLevelValueForEditor(value: LevelValues, level: number): number | undefined {
  if (typeof value === 'number') return value;
  return value[level - 1];
}

/** 编辑当前等级的值，同时保留逐等级定义中的其他等级。 */
export function replaceLevelValueForEditor(
  value: LevelValues,
  level: number,
  replacement: number,
): LevelValues {
  if (typeof value === 'number') return replacement;
  if (!Number.isInteger(level) || level < 1 || level > value.length) return value;
  const values = [...value];
  values[level - 1] = replacement;
  return values;
}

/** 只读投影一个动作黑板操作数，供编辑表单决定显示哪种控件。 */
export function projectActionValueOperandForEditor(value: ActionValueOperand): {
  readonly kind: 'blackboard' | 'constant';
  readonly key: string | undefined;
  readonly constant: number | undefined;
} {
  if (value.kind === 'blackboard')
    return { kind: 'blackboard', key: value.key, constant: undefined };
  return { kind: 'constant', key: undefined, constant: value.value };
}

/** 将编辑后的操作数写回；只接受合法的黑板键或有限常量。 */
export function replaceActionValueOperandForEditor(
  value: ActionValueOperand,
  update: {
    readonly kind?: 'blackboard' | 'constant';
    readonly key?: string;
    readonly constant?: number;
  },
): ActionValueOperand {
  const kind = update.kind ?? value.kind;
  if (kind === 'blackboard') {
    if (typeof update.key !== 'string') return value;
    return {
      kind: 'blackboard',
      key: update.key,
      ...(value.kind === 'blackboard' && value.fallback !== undefined
        ? { fallback: value.fallback }
        : {}),
    };
  }
  if (typeof update.constant !== 'number' || !Number.isFinite(update.constant)) return value;
  return { kind: 'constant', value: update.constant };
}

/** 切换操作数的表达形式：从常量变为黑板引用（key 缺省保留），或反之。 */
export function switchActionValueOperandKind(
  value: ActionValueOperand,
  targetKind: 'blackboard' | 'constant',
): ActionValueOperand {
  if (value.kind === targetKind) return value;
  if (targetKind === 'blackboard') return { kind: 'blackboard', key: '' };
  return { kind: 'constant', value: 0 };
}

/** 单值字段的投影结果；数组由具体表单按当前技能等级读取和修改。 */
export interface SkillEditorScalarField {
  readonly value: number | undefined;
  /** 源值是否为逐等级数组；概览表单仍据此避免把数组误写成单值。 */
  readonly isLevelArray: boolean;
  readonly changed: boolean;
}

/** 调度序列的只读结构摘要：step kind 顺序是编辑器展示的最小单位。 */
export interface SkillSequenceSummary {
  readonly index: number;
  readonly startFrame: number;
  readonly endFrame: number | undefined;
  readonly stepKinds: readonly string[];
  readonly steps: readonly {
    readonly kind: string;
    readonly key: string | undefined;
    readonly parameterNames: readonly string[];
  }[];
  readonly startFrameChanged: boolean;
  readonly endFrameChanged: boolean;
}

/** 一次技能释放的完整编辑投影，供属性面板只读展示与编辑。 */
export interface SkillEditorViewModel {
  /** 该技能块是否已存在完整自定义覆盖（编辑状态不随内容相同而消失）。 */
  readonly customized: boolean;
  /** 草稿相对当前模板的差异项数量；未自定义时为 0。 */
  readonly diffCount: number;
  readonly timelineBlockFrames: number;
  readonly timelineBlockFramesChanged: boolean;
  readonly enhancementStateBuffId: string | undefined;
  readonly enhancementStateBuffIdChanged: boolean;
  readonly cooldownFrames: SkillEditorScalarField;
  readonly costFrame: number | undefined;
  readonly costFrameChanged: boolean;
  readonly costs: readonly {
    readonly resource: string;
    readonly value: SkillEditorScalarField;
    readonly resourceChanged: boolean;
  }[];
  readonly sequences: readonly SkillSequenceSummary[];
}

/** 顶层单值字段编辑；负数与非整数不会写入草稿。 */
export interface SkillEditorFieldUpdate {
  readonly field: keyof Pick<
    SkillDefinition,
    'timelineBlockFrames' | 'cooldownFrames' | 'costFrame'
  >;
  readonly value: number | undefined;
}

function sameLevelValues(left: LevelValues | undefined, right: LevelValues | undefined): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) return left === right;
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function projectScalarField(
  value: LevelValues | undefined,
  templateValue: LevelValues | undefined,
): SkillEditorScalarField {
  const changed = !sameLevelValues(value, templateValue);
  if (value === undefined) return { value: undefined, isLevelArray: false, changed };
  if (Array.isArray(value)) return { value: undefined, isLevelArray: true, changed };
  return { value: value as number, isLevelArray: false, changed };
}

/**
 * 建立独立草稿。已有自定义覆盖时以其为基底，否则以模板为基底。
 * 调用方对草稿的一切修改不影响游戏数据和场景存档，直到提交。
 */
export function createSkillEditorDraft(
  template: SkillDefinition,
  customDefinition: SkillDefinition | undefined,
): SkillDefinition {
  return structuredClone(customDefinition ?? template);
}

/**
 * 投影草稿与模板差异，生成只读编辑视图。
 * `customized` 表示技能块已脱离模板；草稿恰好与模板相同时该状态也不会自动消失。
 */
export function projectSkillEditor(
  template: SkillDefinition,
  draft: SkillDefinition,
  customized: boolean,
): SkillEditorViewModel {
  return {
    customized,
    // Persisted override identity and current draft differences are independent.
    diffCount: diffSkillDefinition(template, draft).length,
    timelineBlockFrames: draft.timelineBlockFrames,
    timelineBlockFramesChanged: draft.timelineBlockFrames !== template.timelineBlockFrames,
    enhancementStateBuffId: draft.enhancementStateBuffId,
    enhancementStateBuffIdChanged: draft.enhancementStateBuffId !== template.enhancementStateBuffId,
    cooldownFrames: projectScalarField(draft.cooldownFrames, template.cooldownFrames),
    costFrame: draft.costFrame,
    costFrameChanged: draft.costFrame !== template.costFrame,
    costs: (draft.costs ?? []).map((cost, index) => ({
      resource: cost.resource,
      resourceChanged: cost.resource !== template.costs?.[index]?.resource,
      value: projectScalarField(cost.value, template.costs?.[index]?.value),
    })),
    sequences: draft.scheduledSequences.map((sequence, index) =>
      projectSequence(sequence, template.scheduledSequences[index], index),
    ),
  };
}

/** 空值明确表示该技能没有强化状态绑定；非空值保持稳定 Buff ID，不做名称推断。 */
export function applySkillEditorEnhancementStateBuffId(
  draft: SkillDefinition,
  value: string,
): SkillDefinition {
  const enhancementStateBuffId = value.trim();
  if (enhancementStateBuffId === '') {
    if (draft.enhancementStateBuffId === undefined) return draft;
    const next = { ...draft };
    delete next.enhancementStateBuffId;
    return next;
  }
  return draft.enhancementStateBuffId === enhancementStateBuffId
    ? draft
    : { ...draft, enhancementStateBuffId };
}

function projectSequence(
  sequence: ScheduledSequenceDefinition,
  templateSequence: ScheduledSequenceDefinition | undefined,
  index: number,
): SkillSequenceSummary {
  return {
    index,
    startFrame: sequence.startFrame,
    endFrame: sequence.endFrame,
    stepKinds: sequence.sequence.steps.map(step => step.kind),
    steps: sequence.sequence.steps.map(step => ({
      kind: step.kind,
      key: step.key,
      parameterNames: Object.keys(step.parameters),
    })),
    startFrameChanged: sequence.startFrame !== templateSequence?.startFrame,
    endFrameChanged: sequence.endFrame !== templateSequence?.endFrame,
  };
}

/**
 * 应用一个顶层单值字段更新。数组与非法值在提交时由严格校验兜底，
 * 这里只拒绝非有限数、负数与非整数，避免把明显错误写进草稿。
 */
export function applySkillEditorField(
  draft: SkillDefinition,
  update: SkillEditorFieldUpdate,
): SkillDefinition {
  const value = update.value;
  if (value === undefined) {
    if (update.field === 'timelineBlockFrames' || draft[update.field] === undefined) return draft;
    const next = { ...draft };
    delete next[update.field];
    return next;
  }
  if (!Number.isInteger(value) || value < 0) return draft;
  return { ...draft, [update.field]: value };
}

/**
 * 编辑首个技能费用的单值数值。费用值若为逐等级数组则保持原样（只读展示），
 * 只有单值才允许直接编辑；返回 `undefined` 表示没有可编辑的单值费用。
 */
export function applySkillEditorCost(
  draft: SkillDefinition,
  index: number,
  update: { readonly resource?: 'sp' | 'ultimateEnergy'; readonly value?: number },
): SkillDefinition {
  const cost = draft.costs?.[index];
  if (cost === undefined) return draft;
  if (update.value !== undefined) {
    if (Array.isArray(cost.value)) return draft;
    if (!Number.isInteger(update.value) || update.value < 0) return draft;
  }
  const replacement = { ...cost, ...update };
  if (replacement.resource === cost.resource && replacement.value === cost.value) return draft;
  const costs = [...(draft.costs ?? [])];
  costs[index] = replacement;
  return {
    ...draft,
    costs,
  };
}

/** 在费用列表末尾增加一项默认技力费用。 */
export function appendSkillEditorCost(draft: SkillDefinition): SkillDefinition {
  return {
    ...draft,
    costs: [...(draft.costs ?? []), { resource: 'sp', value: 0 }],
  };
}

/** 删除指定费用；列表为空时移除整个可选字段。 */
export function removeSkillEditorCost(draft: SkillDefinition, index: number): SkillDefinition {
  if (draft.costs?.[index] === undefined) return draft;
  const costs = draft.costs.filter((_, current) => current !== index);
  if (costs.length > 0) return { ...draft, costs };
  const next = { ...draft };
  delete next.costs;
  return next;
}

/**
 * 应用草稿的调度序列帧编辑。`endFrame` 为 `undefined` 表示删除区间结束帧；
 * 只接受合法的非负整数或明确删除，否则保持原样。
 */
export function applySkillEditorSequenceFrames(
  draft: SkillDefinition,
  sequenceIndex: number,
  frameField: 'startFrame' | 'endFrame',
  value: number | undefined,
): SkillDefinition {
  let changed = false;
  const sequences: ScheduledSequenceDefinition[] = draft.scheduledSequences.map(
    (sequence, index) => {
      if (index !== sequenceIndex) return sequence;
      if (frameField === 'startFrame') {
        if (!Number.isInteger(value) || (value ?? 0) < 0) return sequence;
        if (sequence.startFrame === value) return sequence;
        changed = true;
        return { ...sequence, startFrame: value as number };
      }
      if (value === undefined) {
        if (sequence.endFrame === undefined) return sequence;
        changed = true;
        const { endFrame: _removed, ...rest } = sequence;
        return { ...rest, startFrame: sequence.startFrame };
      }
      if (!Number.isInteger(value) || value < 0) return sequence;
      if (sequence.endFrame === value) return sequence;
      changed = true;
      return { ...sequence, endFrame: value };
    },
  );
  if (!changed) return draft;
  return { ...draft, scheduledSequences: sequences };
}

/** 调整调度序列顺序；同帧序列的数组顺序同样参与实际执行顺序。 */
export function moveSkillEditorSequence(
  draft: SkillDefinition,
  sequenceIndex: number,
  offset: -1 | 1,
): SkillDefinition {
  const target = sequenceIndex + offset;
  if (
    sequenceIndex < 0 ||
    sequenceIndex >= draft.scheduledSequences.length ||
    target < 0 ||
    target >= draft.scheduledSequences.length
  ) {
    return draft;
  }
  const scheduledSequences = [...draft.scheduledSequences];
  [scheduledSequences[sequenceIndex], scheduledSequences[target]] = [
    scheduledSequences[target]!,
    scheduledSequences[sequenceIndex]!,
  ];
  return { ...draft, scheduledSequences };
}

/** 删除调度序列，但保留至少一个序列，避免技能失去全部执行结构。 */
export function removeSkillEditorSequence(
  draft: SkillDefinition,
  sequenceIndex: number,
): SkillDefinition {
  if (
    draft.scheduledSequences.length <= 1 ||
    draft.scheduledSequences[sequenceIndex] === undefined
  ) {
    return draft;
  }
  return {
    ...draft,
    scheduledSequences: draft.scheduledSequences.filter((_, index) => index !== sequenceIndex),
  };
}

/** 提供专用表单的高频步骤；其余步骤仍可查看和调整顺序。 */
export const EDITABLE_COMBAT_STEP_KINDS = [
  'mergeContextTargets',
  'findCharacterTeamTargets',
  'findOwnerSpawnedAbilityEntities',
  'pickContextTarget',
  'forEachContextTarget',
  'readAbilityEntityRemainingDuration',
  'setAbilityEntityRemainingDuration',
  'finishCurrentAbilityEntity',
  'finishActionOwnerAbilityEntity',
  'finishCurrentAbilityEntityWhenSourceDies',
  'startCurrentAbilityEntityChildSkillById',
  'startCurrentAbilityEntityChildSkill',
  'createSpatialPointTargets',
  'jumpTimeline',
  'finishTimeline',
  'withActionBlackboardScope',
  'repeatByActionValue',
  'scheduleProjectileFinishCallback',
  'startTimeDilation',
  'startUltimateTimeDilation',
  'setIgnoreGlobalTimeScale',
  'dealDamage',
  'dealFixedDamage',
  'dealStagger',
  'heal',
  'applyElementalInfliction',
  'applyPhysicalInfliction',
  'applyKnockDown',
  'triggerSpellBurst',
  'triggerCustomAbilityEvent',
  'castSkillDuringAction',
  'applyElementalReaction',
  'consumeElementalReaction',
  'outputAirborne',
  'outputKnockDown',
  'spawnAbilityEntity',
  'applyBuff',
  'readBuffBlackboard',
  'readBuffStackCount',
  'readEventBuffBlackboard',
  'readCurrentBuffRemainingDuration',
  'readBuffRemainingDuration',
  'setCurrentBuffRemainingDuration',
  'refreshCurrentBuffAttributeModifiers',
  'skillAffix',
  'finishCurrentBuff',
  'setCurrentBuffTimePaused',
  'createGlobalBuff',
  'finishParentGlobalBuff',
  'finishGlobalBuffsById',
  'finishBuffsByTag',
  'finishBuffsById',
  'holdBuffsById',
  'igniteBuffs',
  'inheritBuffById',
  'restrictUltimateEnergyRecovery',
  'adjustSkillCooldown',
  'modifyActionValue',
  'calculateActionValue',
  'readSkillSettingData',
  'storeSourceAttributeValue',
  'storeEntityPropertyValue',
  'setHealthFloor',
  'storeCurrentTimelineFrame',
  'storeEventSpGainAmount',
  'storeEventHealValues',
  'storeShieldValue',
  'changeResource',
  'changeResourceByActionValue',
  'gainSquadUltimateEnergyFromSkillCost',
  'gainFinisherSp',
  'applyStatus',
  'consumeStatus',
  'createTimedMarker',
  'setGlobalCooldown',
  'createAbilityEntityTimedMarker',
  'setContextFlag',
  'setCharacterPassiveUiValue',
  'inheritSkillCastInfoForBasicAttack',
  'openComboWindow',
  'changeSkillSlot',
  'overrideBasicAttackMapping',
  'changePlayerActionMode',
  'changeNativeSkillType',
  'listenForCombatEvents',
  'conditional',
  'switch',
  'once',
  'repeatEachTick',
] as const satisfies readonly CombatStepKind[];
export type EditableCombatStepKind = (typeof EDITABLE_COMBAT_STEP_KINDS)[number];

function updateSequenceSteps(
  draft: SkillDefinition,
  sequenceIndex: number,
  update: (steps: readonly CombatStepDefinition[]) => readonly CombatStepDefinition[],
): SkillDefinition {
  const sequence = draft.scheduledSequences[sequenceIndex];
  if (sequence === undefined) return draft;
  const steps = update(sequence.sequence.steps);
  if (steps === sequence.sequence.steps) return draft;
  const scheduledSequences = [...draft.scheduledSequences];
  scheduledSequences[sequenceIndex] = {
    ...sequence,
    sequence: { ...sequence.sequence, steps },
  };
  return { ...draft, scheduledSequences };
}

/** 替换一个完整步骤；专用编辑器用它一次提交一组互相约束的参数。 */
export function replaceSkillEditorStep(
  draft: SkillDefinition,
  sequenceIndex: number,
  stepIndex: number,
  step: CombatStepDefinition,
): SkillDefinition {
  return updateSequenceSteps(draft, sequenceIndex, steps => {
    if (steps[stepIndex] === undefined || steps[stepIndex] === step) return steps;
    const next = [...steps];
    next[stepIndex] = step;
    return next;
  });
}

/** 调整同一序列内的执行顺序；数组顺序就是同帧步骤的实际执行顺序。 */
export function moveSkillEditorStep(
  draft: SkillDefinition,
  sequenceIndex: number,
  stepIndex: number,
  offset: -1 | 1,
): SkillDefinition {
  return updateSequenceSteps(draft, sequenceIndex, steps => {
    const target = stepIndex + offset;
    if (stepIndex < 0 || stepIndex >= steps.length || target < 0 || target >= steps.length) {
      return steps;
    }
    const next = [...steps];
    [next[stepIndex], next[target]] = [next[target]!, next[stepIndex]!];
    return next;
  });
}

/** 删除步骤；空序列是合法的调度占位，可随后添加新的步骤。 */
export function removeSkillEditorStep(
  draft: SkillDefinition,
  sequenceIndex: number,
  stepIndex: number,
): SkillDefinition {
  return updateSequenceSteps(draft, sequenceIndex, steps => {
    if (steps[stepIndex] === undefined) return steps;
    return steps.filter((_, index) => index !== stepIndex);
  });
}

function collectStepKeys(value: unknown, result: Set<string>): void {
  if (Array.isArray(value)) {
    value.forEach(item => collectStepKeys(item, result));
    return;
  }
  if (value === null || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if (typeof record.key === 'string' && record.key.length > 0) result.add(record.key);
  Object.values(record).forEach(item => collectStepKeys(item, result));
}

function createUniqueStepKey(draft: SkillDefinition, base: string): string {
  const existing = new Set<string>();
  collectStepKeys(draft.scheduledSequences, existing);
  if (!existing.has(base)) return base;
  for (let suffix = 2; ; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!existing.has(candidate)) return candidate;
  }
}

/** 创建能立即通过基础结构校验的步骤；伤害步骤的稳定键由编辑器生成。 */
export function createSkillEditorStep(
  draft: SkillDefinition,
  kind: EditableCombatStepKind,
): CombatStepDefinition {
  switch (kind) {
    case 'mergeContextTargets':
      return { kind, parameters: { saveToContextKey: 'targets', sources: [] } };
    case 'findCharacterTeamTargets':
      return {
        kind,
        parameters: { saveToContextKey: 'team', selection: { kind: 'controlledOperator' } },
      };
    case 'findOwnerSpawnedAbilityEntities':
      return { kind, parameters: { saveToContextKey: 'entities' } };
    case 'pickContextTarget':
      return {
        kind,
        parameters: {
          sourceContextKey: 'targets',
          saveToContextKey: 'target',
          index: { kind: 'constant', value: 0 },
        },
      };
    case 'forEachContextTarget':
      return { kind, parameters: { contextKey: 'targets' }, body: { steps: [] } };
    case 'readAbilityEntityRemainingDuration':
      return { kind, parameters: { outputKey: 'remaining-seconds' } };
    case 'setAbilityEntityRemainingDuration':
      return { kind, parameters: { value: { kind: 'constant', value: 0 } } };
    case 'finishCurrentAbilityEntity':
    case 'finishActionOwnerAbilityEntity':
    case 'finishCurrentAbilityEntityWhenSourceDies':
      return { kind, parameters: {} };
    case 'startCurrentAbilityEntityChildSkillById':
      return { kind, parameters: { childSkillId: 'custom-child-skill' } };
    case 'startCurrentAbilityEntityChildSkill':
      return {
        kind,
        parameters: {
          childSkill: { skillId: 'custom-child-skill', scheduledSequences: [] },
        },
      };
    case 'createSpatialPointTargets':
      return {
        kind,
        parameters: {
          saveToContextKey: 'spatial-points',
          count: { kind: 'constant', value: 1 },
        },
      };
    case 'jumpTimeline':
      return { kind, parameters: { destinationFrame: 0 } };
    case 'finishTimeline':
      return { kind, parameters: {} };
    case 'withActionBlackboardScope':
      return {
        kind,
        parameters: {
          scopeKey: 'custom-scope',
          initialValues: {},
          inheritParent: true,
        },
        body: { steps: [] },
      };
    case 'repeatByActionValue':
      return {
        kind,
        parameters: { count: { kind: 'constant', value: 1 } },
        body: { steps: [] },
      };
    case 'scheduleProjectileFinishCallback':
      return {
        kind,
        parameters: { delaySeconds: 1, recycleDelaySeconds: 0 },
        callback: {
          skillId: 'callback',
          nativeSkillType: 'normalSkill',
          naturalDurationFrames: 1,
          castResource: {
            costFrame: 0,
            cooldownSeconds: 0,
            maxChargeTime: 1,
            cost: { resource: 'ultimateEnergy', value: 0, availabilityThreshold: 0 },
          },
          blackboard: {},
          scheduledSequences: [{ startFrame: 0, endFrame: 1, sequence: { steps: [] } }],
        },
      };
    case 'startTimeDilation':
      return {
        kind,
        parameters: {
          scope: 'global',
          durationSeconds: { kind: 'constant', value: 1 },
          slot: 'unassigned',
          priority: 0,
          curve: { kind: 'named', key: 'RESETto1' },
          finishByAction: false,
          ignoredTargets: ['caster'],
        },
      };
    case 'startUltimateTimeDilation':
      return {
        kind,
        parameters: {
          priority: 0,
          targetScale: { kind: 'constant', value: 0 },
          ignoredTargets: [],
        },
      };
    case 'setIgnoreGlobalTimeScale':
      return {
        kind,
        parameters: {
          abilityEntityTargets: [{ kind: 'ownerSpawned' }],
          ignore: true,
          revertOnEnd: true,
        },
      };
    case 'dealDamage':
      return {
        key: createUniqueStepKey(draft, 'custom-damage'),
        kind,
        parameters: { damageType: 'physical', attackScale: 1, tags: ['normalAttack'] },
      };
    case 'dealFixedDamage':
      return {
        key: createUniqueStepKey(draft, 'custom-fixed-damage'),
        kind,
        parameters: { damageType: 'physical', value: 0, tags: ['normalAttack'] },
      };
    case 'dealStagger':
      return { kind, parameters: { value: 0 } };
    case 'heal':
      return {
        kind,
        parameters: {
          target: 'caster',
          attribute: 'will',
          multiplier: 1,
          addition: 0,
          tags: [],
        },
      };
    case 'applyElementalInfliction':
      return { kind, parameters: { element: 'heat', isExtra: false } };
    case 'applyPhysicalInfliction':
      return {
        kind,
        parameters: {
          type: 'fracture',
          target: 'enemy',
          isExtra: false,
          noGuardBuffId: 'custom-no-guard',
          noGuardDefinition: { stackingType: 'refresh', durationSeconds: 10 },
          fractureBuffId: 'custom-fracture',
          fractureDefinition: { stackingType: 'refresh', durationSeconds: 10 },
        },
      };
    case 'applyKnockDown':
      return {
        kind,
        parameters: {
          target: 'enemy',
          duration: { kind: 'constant', value: 0 },
          force: false,
          isExtra: false,
          targetFilter: 'aliveOnly',
          returnWhen: 'always',
        },
      };
    case 'triggerSpellBurst':
      return { kind, parameters: { burstType: 'Cryst' } };
    case 'triggerCustomAbilityEvent':
      return {
        kind,
        parameters: { eventName: 'custom-event', eventParam: 0, target: 'caster' },
      };
    case 'castSkillDuringAction':
      return {
        kind,
        parameters: {
          skillId: 'custom-native-skill-id',
          target: 'enemy',
          skipApplyCost: true,
          inheritSourceSkillCastInfo: true,
        },
      };
    case 'applyElementalReaction':
      return {
        kind,
        parameters: {
          reaction: 'electrification',
          target: 'enemy',
          durationSeconds: 0,
          effectiveness: 1,
        },
      };
    case 'consumeElementalReaction':
      return { kind, parameters: { reaction: 'electrification', target: 'enemy' } };
    case 'outputAirborne':
    case 'outputKnockDown':
      return { kind, parameters: { target: 'enemy' } };
    case 'spawnAbilityEntity':
      return {
        kind,
        parameters: {
          abilityEntityId: 'custom-ability-entity',
          dieWhenSourceDies: false,
        },
      };
    case 'applyBuff':
      return {
        kind,
        parameters: {
          buffId: 'custom-buff',
          definition: { stackingType: 'refresh', durationSeconds: 10 },
          target: 'caster',
        },
      };
    case 'readBuffBlackboard':
      return {
        kind,
        parameters: {
          target: 'caster',
          query: { kind: 'id', buffIds: ['custom-buff'] },
          desiredKey: 'value',
          outputKey: 'custom-value',
        },
      };
    case 'readBuffStackCount':
      return {
        kind,
        parameters: {
          target: 'caster',
          query: { kind: 'id', buffIds: ['custom-buff'] },
          outputKey: 'custom-count',
        },
      };
    case 'readEventBuffBlackboard':
      return {
        kind,
        parameters: { desiredKey: 'value', outputKey: 'custom-value' },
      };
    case 'readCurrentBuffRemainingDuration':
      return { kind, parameters: { outputKey: 'custom-remaining-seconds' } };
    case 'readBuffRemainingDuration':
      return {
        kind,
        parameters: {
          target: 'caster',
          buffIds: ['custom-buff'],
          outputKey: 'custom-remaining-seconds',
        },
      };
    case 'setCurrentBuffRemainingDuration':
      return {
        kind,
        parameters: { operation: 'assign', value: { kind: 'constant', value: 0 } },
      };
    case 'refreshCurrentBuffAttributeModifiers':
    case 'skillAffix':
      return { kind, parameters: {} };
    case 'finishCurrentBuff':
      return { kind, parameters: { reason: 'early', finishSource: 'actionSource' } };
    case 'setCurrentBuffTimePaused':
      return { kind, parameters: { paused: true } };
    case 'createGlobalBuff':
      return {
        kind,
        parameters: {
          globalBuffId: 'custom-global-buff',
          definition: {
            stackingType: 'unlimited',
            blackboard: {},
            children: [{ buffId: 'custom-buff', blackboardAssignments: {} }],
          },
          finishByAction: false,
        },
      };
    case 'finishParentGlobalBuff':
      return { kind, parameters: { reason: 'early' } };
    case 'finishGlobalBuffsById':
      return {
        kind,
        parameters: { globalBuffIds: ['custom-global-buff'], reason: 'early' },
      };
    case 'finishBuffsByTag':
      return {
        kind,
        parameters: {
          target: 'caster',
          tagQueryType: 'hasAny',
          buffTags: ['Custom/Tag'],
          reason: 'early',
        },
      };
    case 'finishBuffsById':
      return {
        kind,
        parameters: { target: 'caster', buffIds: ['custom-buff'], reason: 'early' },
      };
    case 'holdBuffsById':
      return { kind, parameters: { target: 'caster', buffIds: ['custom-buff'] } };
    case 'igniteBuffs':
      return {
        kind,
        parameters: { target: 'caster', source: 'caster', igniteType: 'custom-ignite' },
      };
    case 'inheritBuffById':
      return {
        kind,
        parameters: {
          target: 'caster',
          buffId: 'custom-buff',
          inheritToNextSkillIds: ['custom-native-skill-id'],
          finishByAction: true,
          finishWithNextSkillIfNotInherited: true,
        },
      };
    case 'restrictUltimateEnergyRecovery':
      return {
        kind,
        parameters: {
          target: 'caster',
          allowedRecoveryTags: ['Custom/UltimateRecovery'],
          clearUltimateEnergyOnEnd: false,
        },
      };
    case 'adjustSkillCooldown':
      return {
        kind,
        parameters: {
          target: 'caster',
          skill: { kind: 'type', skillType: 'comboSkill' },
          operation: 'reduce',
          basis: 'baseDurationRatio',
          value: { kind: 'constant', value: 0 },
        },
      };
    case 'modifyActionValue':
      return {
        kind,
        parameters: {
          key: 'custom',
          operation: 'assign',
          value: { kind: 'constant', value: 0 },
        },
      };
    case 'calculateActionValue':
      return {
        kind,
        parameters: {
          key: 'custom',
          operation: 'add',
          left: { kind: 'constant', value: 0 },
          right: { kind: 'constant', value: 0 },
        },
      };
    case 'readSkillSettingData':
      return {
        kind,
        parameters: {
          items: [
            {
              values: [0, 0, 0, 0],
              column: { kind: 'constant', value: 0 },
              storeKey: 'custom-setting-value',
            },
          ],
        },
      };
    case 'storeSourceAttributeValue':
      return {
        kind,
        parameters: {
          attribute: { kind: 'specific', key: 'strength' },
          stage: 'finalNonConverted',
          useFloor: false,
          divisor: { kind: 'constant', value: 1 },
          multiplier: { kind: 'constant', value: 1 },
          base: { kind: 'constant', value: 0 },
          targetKey: 'custom-attribute-value',
        },
      };
    case 'storeEntityPropertyValue':
      return {
        kind,
        parameters: {
          target: 'actionOwner',
          property: 'currentHealth',
          useFloor: false,
          divisor: { kind: 'constant', value: 1 },
          multiplier: { kind: 'constant', value: 1 },
          base: { kind: 'constant', value: 0 },
          targetKey: 'custom-entity-property-value',
        },
      };
    case 'setHealthFloor':
      return {
        kind,
        parameters: {
          target: 'actionOwner',
          mode: 'absolute',
          value: { kind: 'constant', value: 0 },
        },
      };
    case 'storeCurrentTimelineFrame':
      return { kind, parameters: { outputKey: 'custom-timeline-frame' } };
    case 'storeEventSpGainAmount':
      return { kind, parameters: { outputKey: 'custom-sp-gain-value' } };
    case 'storeEventHealValues':
      return { kind, parameters: { realHealOutputKey: 'custom-real-heal-value' } };
    case 'storeShieldValue':
      return {
        kind,
        parameters: { target: 'actionOwner', value: 'gained', outputKey: 'custom-shield-value' },
      };
    case 'changeResource':
      return { kind, parameters: { resource: 'sp', amount: 0, recipient: 'caster' } };
    case 'changeResourceByActionValue':
      return {
        kind,
        parameters: {
          resource: 'sp',
          amount: { kind: 'constant', value: 0 },
          recipient: 'caster',
        },
      };
    case 'gainSquadUltimateEnergyFromSkillCost':
      return { kind, parameters: { coefficient: 1 } };
    case 'gainFinisherSp':
      return { kind, parameters: { factor: 1, recipient: 'team' } };
    case 'applyStatus':
      return { kind, parameters: { statusKey: 'custom-status', target: 'caster' } };
    case 'consumeStatus':
      return { kind, parameters: { statusKey: 'custom-status', target: 'enemy' } };
    case 'setGlobalCooldown':
      return {
        kind,
        parameters: {
          target: 'caster',
          markerId: 'custom-cooldown',
          durationSeconds: { kind: 'constant', value: 1 },
        },
      };
    case 'createTimedMarker':
      return {
        kind,
        parameters: {
          target: 'caster',
          markerId: 'custom-marker',
          durationSeconds: { kind: 'constant', value: 0 },
          autoFinishByAction: false,
        },
      };
    case 'createAbilityEntityTimedMarker':
      return {
        kind,
        parameters: {
          markerId: 'custom-ability-marker',
          durationSeconds: { kind: 'constant', value: 0 },
          autoFinishByAction: false,
          timeDomain: 'self',
        },
      };
    case 'setContextFlag':
      return {
        kind,
        parameters: { flag: 'custom-flag', value: false, target: 'caster' },
      };
    case 'setCharacterPassiveUiValue':
      return {
        kind,
        parameters: { target: 'caster', value: { kind: 'constant', value: 0 } },
      };
    case 'inheritSkillCastInfoForBasicAttack':
      return { kind, parameters: {} };
    case 'openComboWindow':
      return { kind, parameters: { nextSkillKey: 'comboSkillStage2' } };
    case 'changeSkillSlot':
      return {
        kind,
        parameters: {
          skillGroupKey: 'custom-skill-group',
          targetSkillKey: 'custom-skill',
          inheritOriginSkillCooldownProgress: true,
          lifetime: 'finishByAction',
          revertedSkillKey: 'custom-origin-skill',
        },
      };
    case 'overrideBasicAttackMapping':
      return { kind, parameters: { skillId: 'custom-native-skill' } };
    case 'changePlayerActionMode':
      return { kind, parameters: { modeId: 'custom-mode', lifetime: 'finishByAction' } };
    case 'changeNativeSkillType':
      return {
        kind,
        parameters: { targetSkillKey: 'custom-skill', nativeSkillType: 'normalSkill' },
      };
    case 'listenForCombatEvents':
      return {
        kind,
        parameters: { responses: [createCombatEventResponseDraft()] },
      };
    case 'switch':
      return {
        kind,
        parameters: { choice: { kind: 'constant', value: 0 }, alwaysNext: true },
        options: [{ value: { kind: 'constant', value: 0 }, sequence: { steps: [] } }],
      };
    case 'conditional':
      return {
        kind,
        parameters: { condition: { kind: 'combatActive' } },
        whenTrue: { steps: [] },
      };
    case 'once':
      return {
        kind,
        parameters: { scopeKey: 'custom-once' },
        body: { steps: [] },
      };
    case 'repeatEachTick':
      return { kind, parameters: {}, body: { steps: [] } };
  }
}

export function appendSkillEditorStep(
  draft: SkillDefinition,
  sequenceIndex: number,
  kind: EditableCombatStepKind,
): SkillDefinition {
  const step = createSkillEditorStep(draft, kind);
  return updateSequenceSteps(draft, sequenceIndex, steps => [...steps, step]);
}

function renewDamageStepKeys(value: unknown, draft: SkillDefinition): void {
  if (Array.isArray(value)) {
    value.forEach(item => renewDamageStepKeys(item, draft));
    return;
  }
  if (value === null || typeof value !== 'object') return;
  const record = value as Record<string, unknown>;
  if (record.kind === 'dealDamage' || record.kind === 'dealFixedDamage') {
    const base =
      typeof record.key === 'string' && record.key.length > 0 ? record.key : 'custom-damage';
    record.key = createUniqueStepKey(draft, `${base}-copy`);
  }
  Object.values(record).forEach(item => renewDamageStepKeys(item, draft));
}

/** 复制不绑定具体序列位置的步骤，并重建其中全部伤害步骤键。 */
export function duplicateSkillEditorDetachedStep(
  draft: SkillDefinition,
  step: CombatStepDefinition,
): CombatStepDefinition {
  const copy = structuredClone(step);
  renewDamageStepKeys(copy, draft);
  return copy;
}

/** 复制完整调度序列，并为嵌套伤害节点重新分配稳定键。 */
export function duplicateSkillEditorSequence(
  draft: SkillDefinition,
  sequenceIndex: number,
): SkillDefinition {
  const source = draft.scheduledSequences[sequenceIndex];
  if (source === undefined) return draft;
  const copy = structuredClone(source);
  renewDamageStepKeys(copy, draft);
  return {
    ...draft,
    scheduledSequences: [
      ...draft.scheduledSequences.slice(0, sequenceIndex + 1),
      copy,
      ...draft.scheduledSequences.slice(sequenceIndex + 1),
    ],
  };
}

/** 在末尾加入空序列；空步骤列表合法，随后可按需要添加具体步骤。 */
export function appendSkillEditorSequence(draft: SkillDefinition): SkillDefinition {
  const previous = draft.scheduledSequences.at(-1);
  return {
    ...draft,
    scheduledSequences: [
      ...draft.scheduledSequences,
      {
        startFrame: previous?.startFrame ?? 0,
        sequence: { steps: [] },
      },
    ],
  };
}

/** 复制完整步骤，并为其中所有伤害节点重新分配稳定键。 */
export function duplicateSkillEditorStep(
  draft: SkillDefinition,
  sequenceIndex: number,
  stepIndex: number,
): SkillDefinition {
  const source = draft.scheduledSequences[sequenceIndex]?.sequence.steps[stepIndex];
  if (source === undefined) return draft;
  const copy = duplicateSkillEditorDetachedStep(draft, source);
  return updateSequenceSteps(draft, sequenceIndex, steps => [
    ...steps.slice(0, stepIndex + 1),
    copy,
    ...steps.slice(stepIndex + 1),
  ]);
}
