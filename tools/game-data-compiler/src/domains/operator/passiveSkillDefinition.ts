import type {
  LevelValues,
  OperatorPassiveSkillDefinition,
  OperatorEntityBlackboardInitializerDefinition,
  SkillLevelSource,
  UpgradeModifierDefinition,
} from '../../../../../packages/game-data-contract/src/index.ts';
import type { CompiledPassiveSkillDefinitionSource } from '../../compiler/skills/passiveSkillBatch.ts';
import type { PassiveSkillCompileRequestSource } from '../../compiler/skills/passiveSkillRequest.ts';
import {
  materializePassiveBuffInstallation,
  resolvePassiveSkillDefinitionBlackboard,
} from '../../compiler/skills/passiveSkillInstallation.ts';
import { isPresentationOnlyActionSequence } from '../../compiler/skills/skillPresentationTargets.ts';
import { compileCombatActionSequenceSource } from '../../compiler/buffs/buffRuntimeProjection.ts';
import { collectNativeActionNodes } from '../../source/controlFlow.ts';
import { projectAbilityEvent } from '../../compiler/abilities/abilityEventProjection.ts';
import { isOperatorPassiveAbilityEvent } from '../../../../../packages/game-data-contract/src/operators.ts';
import type { CompiledBuffSequenceSource } from '../../compiler/actions/combatActionProjectionTypes.ts';
import { collectCompiledBuffIds } from '../../compiler/references/compiledReferences.ts';
import type { GameplayTagRegistry } from '../../source/nativeGameplayTags.ts';
import {
  nativeActionName,
  requireArray,
  requireNonEmptyString,
  requireNumber,
  requireRecord,
} from '../../source/primitives.ts';

interface PlannedPassiveSkill {
  readonly abilityEventResponses: NonNullable<
    OperatorPassiveSkillDefinition['abilityEventResponses']
  >;
  readonly key: string;
  readonly levelSource?: SkillLevelSource;
  readonly blackboard: Readonly<Record<string, LevelValues>>;
  readonly buffs: readonly {
    readonly buffId: string;
    readonly assignments: Readonly<Record<string, LevelValues>>;
  }[];
  /** 构筑加载后只需执行一次的原生被动响应；战斗中构筑快照不再变化。 */
  readonly initializationSequences: readonly CompiledBuffSequenceSource[];
  readonly reactionProjection?: CollectedBuffReactionProjection;
}

export interface CompiledOperatorUpgradePassiveSkillsSource {
  readonly definitions: readonly OperatorPassiveSkillDefinition[];
  readonly modifiers: readonly UpgradeModifierDefinition[];
  readonly semanticPassiveKeys: readonly string[];
  readonly reactionPassiveInputs: ReadonlyMap<
    string,
    { readonly durationKey: string; readonly effectivenessKey: string }
  >;
  readonly buffIds: readonly string[];
  readonly handledSourcePaths: readonly string[];
  readonly entityBlackboardInitializers: readonly OperatorEntityBlackboardInitializerDefinition[];
}

/**
 * 把同一天赋/潜能各等级的 AddPassiveSkill 请求合并成一个等级化安装定义。
 * 接受 AddBuff 形态及已审计的被动事件；不接受有效时间轴、Toggle 或卡面修正。
 * 已准入事件统一输出 abilityEventResponses，不再在启用程序中安装第二套监听。
 */
export function compileOperatorUpgradePassiveSkills(
  effectIds: readonly string[],
  requests: readonly PassiveSkillCompileRequestSource[],
  definitions: readonly CompiledPassiveSkillDefinitionSource[],
  gameplayTagRegistry?: GameplayTagRegistry,
  loadBuff?: (id: string) => unknown,
): CompiledOperatorUpgradePassiveSkillsSource {
  const definitionById = new Map(definitions.map(item => [item.skillId, item]));
  const levelPlans = effectIds.map(effectId =>
    requests
      .filter(request => request.originId === effectId)
      .map(request => planPassiveSkill(request, definitionById, gameplayTagRegistry, loadBuff)),
  );
  const identities = levelPlans.map(plan =>
    JSON.stringify(
      plan.map(passive => [
        passive.key,
        passive.levelSource,
        Object.keys(passive.blackboard).sort(),
        passive.buffs.map(buff => [buff.buffId, Object.keys(buff.assignments).sort()]),
        passive.initializationSequences,
        passive.reactionProjection,
        passive.abilityEventResponses,
      ]),
    ),
  );
  if (identities.some(identity => identity !== identities[0])) {
    throw new Error('operator passive SkillData installation structure changes between levels');
  }
  const definitionsOutput = (levelPlans[0] ?? []).flatMap((passive, passiveIndex) => {
    if (passive.reactionProjection !== undefined) return [];
    const blackboard: Record<string, number | readonly number[]> = {};
    const usedKeys = new Set<string>();
    for (const key of Object.keys(passive.blackboard).sort()) {
      const values = levelPlans.map(level => level[passiveIndex]!.blackboard[key]!);
      blackboard[key] = mergePassiveLevelValues(values, `${passive.key}.blackboard.${key}`);
      usedKeys.add(key);
    }
    const steps: OperatorPassiveSkillDefinition['enableSequence']['steps'][number][] =
      passive.buffs.map((buff, buffIndex) => {
        const blackboardAssignments: Record<string, { kind: 'blackboard'; key: string }> = {};
        for (const targetKey of Object.keys(buff.assignments).sort()) {
          const values = levelPlans.map(
            level => level[passiveIndex]!.buffs[buffIndex]!.assignments[targetKey]!,
          );
          const levelValue = mergePassiveLevelValues(
            values,
            `${passive.key}.buffs[${buffIndex}].assignments.${targetKey}`,
          );
          if (usedKeys.has(targetKey)) {
            if (JSON.stringify(blackboard[targetKey]) !== JSON.stringify(levelValue)) {
              throw new Error(
                `${passive.key}: passive Buff assignment collides with blackboard key ${JSON.stringify(targetKey)}`,
              );
            }
          } else {
            usedKeys.add(targetKey);
            blackboard[targetKey] = levelValue;
          }
          blackboardAssignments[targetKey] = { kind: 'blackboard', key: targetKey };
        }
        return {
          kind: 'applyBuff' as const,
          parameters: {
            buffId: buff.buffId,
            target: 'caster' as const,
            inheritSourceSkillCastInfo: false,
            ...(Object.keys(blackboardAssignments).length === 0 ? {} : { blackboardAssignments }),
          },
        };
      });
    for (const sequence of passive.initializationSequences) {
      if (projectEntityBlackboardInitializer(sequence) === null) steps.push(...sequence.steps);
    }
    return [
      {
        key: passive.key,
        ...(passive.levelSource === undefined ? {} : { levelSource: passive.levelSource }),
        ...(Object.keys(blackboard).length === 0 ? {} : { blackboard }),
        enableSequence: { steps },
        ...(passive.abilityEventResponses.length === 0
          ? {}
          : { abilityEventResponses: passive.abilityEventResponses }),
      } satisfies OperatorPassiveSkillDefinition,
    ];
  });
  const semanticPlans = (levelPlans[0] ?? []).flatMap((passive, passiveIndex) => {
    const projection = passive.reactionProjection;
    if (projection === undefined) return [];
    const values = levelPlans.map(level => level[passiveIndex]!.blackboard);
    return [
      {
        key: passive.key,
        projection,
        duration: mergePassiveLevelValues(
          values.map(value =>
            requireNumericLevelValue(
              value[projection.durationInputKey],
              `${passive.key}.${projection.durationInputKey}`,
            ),
          ),
          `${passive.key}.${projection.durationInputKey}`,
        ),
        effectiveness: mergePassiveLevelValues(
          values.map(value =>
            requireNumericLevelValue(
              value[projection.effectivenessInputKey],
              `${passive.key}.${projection.effectivenessInputKey}`,
            ),
          ),
          `${passive.key}.${projection.effectivenessInputKey}`,
        ),
      },
    ];
  });
  return {
    definitions: definitionsOutput,
    modifiers: semanticPlans.flatMap(plan => [
      {
        kind: 'addReactionDuration' as const,
        reaction: plan.projection.reaction,
        seconds: plan.duration,
      },
      {
        kind: 'addReactionEffectiveness' as const,
        reaction: plan.projection.reaction,
        value: plan.effectiveness,
      },
    ]),
    semanticPassiveKeys: semanticPlans.map(plan => plan.key),
    reactionPassiveInputs: new Map(
      semanticPlans.map(plan => [
        plan.key,
        {
          durationKey: plan.projection.durationInputKey,
          effectivenessKey: plan.projection.effectivenessInputKey,
        },
      ]),
    ),
    entityBlackboardInitializers: (levelPlans[0] ?? []).flatMap(passive =>
      passive.initializationSequences.flatMap(sequence => {
        const initializer = projectEntityBlackboardInitializer(sequence);
        return initializer === null ? [] : [initializer];
      }),
    ),
    buffIds: [
      ...new Set([
        ...levelPlans.flatMap(level =>
          level.flatMap(item =>
            item.reactionProjection === undefined ? item.buffs.map(b => b.buffId) : [],
          ),
        ),
        ...collectCompiledBuffIds(definitionsOutput),
      ]),
    ],
    handledSourcePaths: requests
      .filter(request => effectIds.includes(request.originId))
      .map(request => request.sourcePath),
  };
}

function projectEntityBlackboardInitializer(
  sequence: CompiledBuffSequenceSource,
): OperatorEntityBlackboardInitializerDefinition | null {
  if (sequence.steps.length !== 1) return null;
  const branch = sequence.steps[0];
  if (branch?.kind !== 'conditional' || branch.parameters.condition.kind !== 'deckAttributeCompare')
    return null;
  const assigned = (body: CompiledBuffSequenceSource | undefined) => {
    const step = body?.steps[0];
    return body?.steps.length === 1 &&
      step?.kind === 'modifyActionValue' &&
      step.parameters.operation === 'assign' &&
      step.parameters.key.startsWith('EntityBB_') &&
      step.parameters.value.kind === 'constant'
      ? { key: step.parameters.key, value: step.parameters.value.value }
      : null;
  };
  const whenTrue = assigned(branch.whenTrue);
  const whenFalse = assigned(branch.whenFalse);
  if (whenTrue === null || whenFalse === null || whenTrue.key !== whenFalse.key) return null;
  return {
    key: whenTrue.key as `EntityBB_${string}`,
    condition: branch.parameters.condition,
    trueValue: whenTrue.value,
    falseValue: whenFalse.value,
  };
}

function requireNumericLevelValue(value: LevelValues | undefined, sourcePath: string): LevelValues {
  if (value === undefined) throw new Error(`${sourcePath}: missing collected Buff reaction input`);
  return value;
}

function mergePassiveLevelValues(values: readonly LevelValues[], sourcePath: string): LevelValues {
  if (values.length === 1) return values[0]!;
  if (values.some(Array.isArray)) {
    throw new Error(`${sourcePath}: nested passive level columns are unsupported`);
  }
  return values as readonly number[];
}

function planPassiveSkill(
  request: PassiveSkillCompileRequestSource,
  definitions: ReadonlyMap<string, CompiledPassiveSkillDefinitionSource>,
  gameplayTagRegistry?: GameplayTagRegistry,
  loadBuff?: (id: string) => unknown,
): PlannedPassiveSkill {
  if (request.activeConditionIds?.length) {
    throw new Error(`${request.sourcePath}: conditioned operator passive SkillData is unsupported`);
  }
  const compiled = definitions.get(request.skillId);
  if (!compiled)
    throw new Error(`${request.sourcePath}: missing passive SkillData ${request.skillId}`);
  const skill = compiled.definition.skill;
  if (
    skill.passiveType !== 'AddBuff' ||
    skill.toggleBuffs.length > 0 ||
    compiled.definition.hasCardAttributeModifiers ||
    skill.actionGraph.actionGroup.timelineActions.some(
      timeline => !isPresentationOnlyActionSequence(timeline.sequence),
    )
  ) {
    throw new Error(`${request.sourcePath}: unsupported operator passive SkillData program`);
  }
  const blackboard = resolvePassiveSkillDefinitionBlackboard(request, compiled);
  const reactionProjection = projectCollectedBuffReactionPassive(
    skill,
    gameplayTagRegistry,
    loadBuff,
  );
  const passiveEventContext = {
    gameplayTagRegistry,
    actionOwnerTarget: 'caster' as const,
    actionSourceTarget: 'caster' as const,
    actionTargetTarget: 'eventTarget' as const,
    fixedBuffOwnerTarget: 'caster' as const,
  };
  const initializationSequences = skill.actionGraph.actionGroup.passiveEvents
    .filter(event => event.abilityEvent === 'OnCharDeckAttrChanged')
    .flatMap(event =>
      event.actions.map(sequence =>
        compileCombatActionSequenceSource(sequence, passiveEventContext),
      ),
    );
  const abilityEventResponses: NonNullable<
    OperatorPassiveSkillDefinition['abilityEventResponses']
  >[number][] = [];
  skill.actionGraph.actionGroup.passiveEvents.forEach(event => {
    if (
      event.abilityEvent === 'OnAbilityEntityFinished' ||
      event.abilityEvent === 'OnAbilityEntitySpawned' ||
      event.abilityEvent === 'OnAddedBuff' ||
      event.abilityEvent === 'OnObtainAtb' ||
      event.abilityEvent === 'OnReceiveHeal'
    ) {
      const projected = projectAbilityEvent(event.abilityEvent, request.sourcePath);
      if (!isOperatorPassiveAbilityEvent(projected))
        throw new Error(`${request.sourcePath}: unsupported passive ability event mapping`);
      for (const sequence of event.actions) {
        for (const node of collectNativeActionNodes(sequence)) {
          if (
            node.metadata.enabled &&
            (node.metadata.priorityLevel !== 'Default' || node.metadata.priorityOffset !== 0)
          )
            throw new Error(`${node.sourcePath}: unsupported operator passive event priority`);
        }
        abilityEventResponses.push({
          event: projected,
          priority: 0,
          sequence: compileCombatActionSequenceSource(sequence, {
            ...passiveEventContext,
            actionTargetTarget: projected === 'addedBuff' ? 'eventSource' : 'eventTarget',
          }),
        });
      }
      return [];
    }
    // 固定战斗模拟不会退出战斗；该清理只重置角色累计黑板，对本场结果没有可见影响。
    if (event.abilityEvent === 'OnTrulyExitFight') return [];
    // 构筑属性在场景编译前已冻结；原生通知只负责刷新派生角色黑板，因此上方把该响应
    // 放入 enableSequence 执行一次，不创建战斗中永远不会发生的伪事件。
    if (event.abilityEvent === 'OnCharDeckAttrChanged') return [];
    // 固定战斗不会遣返队伍；该分支只清理被动生成实体，不影响本场继续计算。
    if (event.abilityEvent === 'OnSquadRepatriate') return [];
    // Endaxis 的唯一敌人是无主动行为木桩，当前管线也不制造干员受击事件。
    // 庄方宜这类受击前免伤/治疗被动因此在模型内完整无触发机会；保留技能与等级黑板，
    // 但不伪造一个受击入口。若外部事件系统以后支持受击标记，应重新开启该事件并审计载荷。
    if (event.abilityEvent === 'OnBeforeTakeDamage') return [];
    throw new Error(
      `${request.sourcePath}: unsupported operator passive event ${JSON.stringify(event.abilityEvent)}`,
    );
  });
  return {
    key: request.skillId,
    ...(request.levelSource.kind === 'operatorSkillGroup'
      ? { levelSource: request.levelSource.levelSource }
      : {}),
    blackboard,
    ...(reactionProjection === undefined ? {} : { reactionProjection }),
    initializationSequences,
    buffs: skill.startupBuffs.map(buff => {
      const materialized = materializePassiveBuffInstallation(buff, blackboard);
      const assignments: Record<string, LevelValues> = {};
      for (const [key, value] of Object.entries(materialized.blackboardAssignments)) {
        if (!(
          (typeof value === 'number' && Number.isFinite(value)) ||
          (Array.isArray(value) &&
            value.length > 0 &&
            value.every(item => typeof item === 'number' && Number.isFinite(item)))
        )) {
          throw new Error(`${request.sourcePath}: unresolved passive Buff assignment ${key}`);
        }
        assignments[key] = value as LevelValues;
      }
      return { buffId: materialized.buffId, assignments };
    }),
    abilityEventResponses,
  };
}

interface CollectedBuffReactionProjection {
  readonly reaction: 'corrosion';
  readonly durationInputKey: string;
  readonly effectivenessInputKey: string;
}

/**
 * OnCollectOutputBuffBbValue 在腐蚀输出 Buff 创建前修改其 duration 与
 * max_def_decrease。固定模型把这一数据流投影为正式反应修正，不安装一个运行时永远不会收到
 * 该原生收集事件的伪监听器。形状不完全匹配时返回 undefined，后续普通 Buff 编译会严格报错。
 */
function projectCollectedBuffReactionPassive(
  skill: CompiledPassiveSkillDefinitionSource['definition']['skill'],
  gameplayTagRegistry?: GameplayTagRegistry,
  loadBuff?: (id: string) => unknown,
): CollectedBuffReactionProjection | undefined {
  if (skill.passiveType !== 'AddBuff' || skill.startupBuffs.length !== 1 || loadBuff === undefined)
    return undefined;
  const application = skill.startupBuffs[0]!;
  if (!application.assignBlackboard) return undefined;
  const root = requireRecord(loadBuff(application.buffId), `BuffData.${application.buffId}`);
  if (root.lifeType !== 'Infinity') return undefined;
  for (const field of [
    'attributeModifier',
    'damageModifier',
    'healModifier',
    'poiseModifier',
    'globalModifier',
    'shieldConfigs',
    'buffEventAction',
    'igniteEventAction',
    'timelineActions',
  ] as const) {
    const value = root[field];
    if (field === 'attributeModifier') {
      const modifier = requireRecord(value, `BuffData.${application.buffId}.${field}`);
      if (
        requireArray(
          modifier.attributeModifiers,
          `BuffData.${application.buffId}.${field}.attributeModifiers`,
        ).length
      )
        return undefined;
    } else if (requireArray(value, `BuffData.${application.buffId}.${field}`).length)
      return undefined;
  }
  const events = requireArray(
    root.abilityEventAction,
    `BuffData.${application.buffId}.abilityEventAction`,
  );
  if (events.length !== 1) return undefined;
  const event = requireRecord(events[0], `BuffData.${application.buffId}.abilityEventAction[0]`);
  if (event.abilityEvent !== 'OnCollectOutputBuffBbValue') return undefined;
  const sequences = requireArray(
    event.actions,
    `BuffData.${application.buffId}.abilityEventAction[0].actions`,
  );
  if (sequences.length !== 1) return undefined;
  const sequence = requireRecord(
    sequences[0],
    `BuffData.${application.buffId}.abilityEventAction[0].actions[0]`,
  );
  const actions = requireArray(
    sequence.actionData,
    `BuffData.${application.buffId}.abilityEventAction[0].actions[0].actionData`,
  );
  if (actions.length !== 3) return undefined;
  const condition = requireRecord(actions[0], `BuffData.${application.buffId}.condition`);
  if (
    nativeActionName(
      requireNonEmptyString(condition.$type, `BuffData.${application.buffId}.condition.$type`),
    ) !== 'CheckBuffIdInContextAdvanced' ||
    condition.checkType !== 'Tag'
  )
    return undefined;
  const query = requireRecord(condition.query, `BuffData.${application.buffId}.condition.query`);
  const tags = requireArray(query.tags, `BuffData.${application.buffId}.condition.query.tags`);
  if (query.queryType !== 'HasAny' || tags.length !== 1) return undefined;
  const tag = requireRecord(tags[0], `BuffData.${application.buffId}.condition.query.tags[0]`);
  const tagId = requireNumber(
    tag.tagId,
    `BuffData.${application.buffId}.condition.query.tags[0].tagId`,
  );
  if (gameplayTagRegistry?.resolve(tagId).split('/').at(-1) !== 'Corrupt') return undefined;
  const save = requireRecord(actions[1], `BuffData.${application.buffId}.save`);
  if (
    nativeActionName(
      requireNonEmptyString(save.$type, `BuffData.${application.buffId}.save.$type`),
    ) !== 'SaveCollectedBuffBbValue'
  )
    return undefined;
  const durationOutputKey = requireNonEmptyString(
    save.blackboardKey,
    `BuffData.${application.buffId}.save.blackboardKey`,
  );
  const durationStoreKey = requireNonEmptyString(
    save.storeKey,
    `BuffData.${application.buffId}.save.storeKey`,
  );
  if (durationOutputKey !== 'duration') return undefined;
  const branch = requireRecord(actions[2], `BuffData.${application.buffId}.branch`);
  if (
    nativeActionName(
      requireNonEmptyString(branch.$type, `BuffData.${application.buffId}.branch.$type`),
    ) !== 'IfElseAction'
  )
    return undefined;
  const succeed = requireRecord(
    branch.succeedActions,
    `BuffData.${application.buffId}.branch.succeedActions`,
  );
  const succeedActions = requireArray(
    succeed.actionData,
    `BuffData.${application.buffId}.branch.succeedActions.actionData`,
  );
  const fail = requireRecord(
    branch.failActions,
    `BuffData.${application.buffId}.branch.failActions`,
  );
  const failActions = requireArray(
    fail.actionData,
    `BuffData.${application.buffId}.branch.failActions.actionData`,
  );
  if (succeedActions.length !== 3 || failActions.length !== 2) return undefined;
  const durationModify = requireRecord(
    succeedActions[0],
    `BuffData.${application.buffId}.durationModify`,
  );
  const rateCalc = requireRecord(succeedActions[1], `BuffData.${application.buffId}.rateCalc`);
  const effectivenessModify = requireRecord(
    succeedActions[2],
    `BuffData.${application.buffId}.effectivenessModify`,
  );
  const failRateCalc = requireRecord(failActions[0], `BuffData.${application.buffId}.failRateCalc`);
  const failEffectivenessModify = requireRecord(
    failActions[1],
    `BuffData.${application.buffId}.failEffectivenessModify`,
  );
  if (
    nativeActionName(requireNonEmptyString(durationModify.$type, 'durationModify.$type')) !==
      'ModifyCollectedBuffBbValue' ||
    durationModify.blackboardKey !== durationOutputKey ||
    requireRecord(durationModify.addition, 'durationModify.addition').blackboardKey !==
      'duration_add' ||
    nativeActionName(requireNonEmptyString(rateCalc.$type, 'rateCalc.$type')) !==
      'SimpleCalcBBAction' ||
    rateCalc.key !== 'final_corrupt_rate' ||
    requireRecord(rateCalc.value1, 'rateCalc.value1').blackboardKey !== 'corrupt_rate' ||
    nativeActionName(
      requireNonEmptyString(effectivenessModify.$type, 'effectivenessModify.$type'),
    ) !== 'ModifyCollectedBuffBbValue' ||
    effectivenessModify.blackboardKey !== 'max_def_decrease' ||
    requireRecord(effectivenessModify.multiplier, 'effectivenessModify.multiplier')
      .blackboardKey !== 'final_corrupt_rate' ||
    nativeActionName(requireNonEmptyString(failRateCalc.$type, 'failRateCalc.$type')) !==
      'SimpleCalcBBAction' ||
    nativeActionName(
      requireNonEmptyString(failEffectivenessModify.$type, 'failEffectivenessModify.$type'),
    ) !== 'ModifyCollectedBuffBbValue'
  )
    return undefined;
  const assignments = new Map(
    application.assignments.map(item => [item.targetKey, item.inputValueKey]),
  );
  const durationInputKey = assignments.get('duration_add');
  const effectivenessInputKey = assignments.get('corrupt_rate');
  if (!durationInputKey || !effectivenessInputKey || durationStoreKey !== 'duration_dynamic')
    return undefined;
  return { reaction: 'corrosion', durationInputKey, effectivenessInputKey };
}
