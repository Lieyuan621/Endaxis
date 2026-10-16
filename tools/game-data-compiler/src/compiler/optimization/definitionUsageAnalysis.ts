/**
 * 分析已生成动作和条件对当前黑板的读写，以及不能随结果一起删除的行为。
 * 只按公共类型的字段解释用途；尚未覆盖的动作保留为分析障碍，不靠字符串搜索猜测无用值。
 */
import type {
  ActionTargetQuery,
  ActionGraphReference,
  CombatStepDefinition,
  CombatStepForKind,
  CombatStepParameters,
} from '../intermediateDefinitions.ts';
import type {
  ActionValueOperand,
  BuffConditionTarget,
  CombatCondition,
} from '../intermediateDefinitions.ts';
import type { ActionStringOperand, LevelValues } from '../intermediateDefinitions.ts';

/** 这些查询只读取已有目标身份，不创建位置或修改目标组。 */
export function isReadOnlyTargetQuery(query: ActionTargetQuery): boolean {
  if (query.kind === 'mainTarget') return isReadOnlyTargetQuery(query.owner);
  return [
    'owner',
    'source',
    'inputTarget',
    'context',
    'mainCharacter',
    'characterTeam',
    'fixed',
    'battleMainTarget',
    'godEntity',
  ].includes(query.kind);
}

/**
 * 经对象查询读取的黑板键。记录原有目标选择条件，不把同名键并入当前技能的 direct 板。
 * Buff 查询可能找到当前实例；以后裁剪 Buff 或实体板时，仍须解析查询结果与当前板的关系。
 */
export type DefinitionExternalValueRead =
  | {
      /** 读取 owner children 查询得到的每个能力实体。 */
      readonly kind: 'abilityEntity';
      /** 原动作的实体 ID 筛选；省略时不按 ID 限制。 */
      readonly abilityEntityIds?: CombatStepParameters['findOwnerSpawnedAbilityEntities']['abilityEntityIds'];
      /** 原生查询所有者。 */
      readonly owner: CombatStepParameters['findOwnerSpawnedAbilityEntities']['owner'];
      /** 原动作是否只查询同次施放创建的实体。 */
      readonly sameSourceSkillCast?: CombatStepParameters['findOwnerSpawnedAbilityEntities']['sameSourceSkillCast'];
      /** 在每个查询结果的实体板中读取的键。 */
      readonly key: string;
    }
  | {
      /** 从指定目标身上按 ID 或标签找到 Buff。 */
      readonly kind: 'buff';
      /** 被查询 Buff 的宿主选择器，沿用原动作或条件。 */
      readonly target: BuffConditionTarget;
      /** 原有 ID 或标签筛选。 */
      readonly query: CombatStepParameters['readBuffBlackboard']['query'];
      /** 从查询到的 Buff 实例黑板读取的键。 */
      readonly key: string;
    }
  | {
      /** 读取当前事件直接携带的 Buff 实例。 */
      readonly kind: 'eventBuff';
      /** 从事件 Buff 的黑板读取的键。 */
      readonly key: string;
    };

/** 一项表达式或动作在当前黑板上的用途；外部对象的黑板不与当前板合并。 */
export interface DefinitionValueUsage {
  readonly reads: ReadonlySet<string>;
  readonly writes: ReadonlySet<string>;
  /** 对象读取保留目标与筛选，供后续分析跨实例依赖。 */
  readonly externalReads: readonly DefinitionExternalValueRead[];
  /** 有尚未明确的访问时，不能证明这块黑板中的任何键没有用途。 */
  readonly unknownAccess: boolean;
  /** 求值是否可能缺少黑板值或所需运行环境。 */
  readonly mayThrow: boolean;
  /** 随机流、事件、属性刷新等不由输出键是否有人读取来决定的影响。 */
  readonly observable: boolean;
}

/** 只有确认了实体板的全部接收者，调用方才提供继承用途；没有证明时继续整板保留。 */
export interface DefinitionUsageContext {
  readonly inheritedAbilityEntityUsage: (
    step: CombatStepForKind<'spawnAbilityEntity'>,
  ) => DefinitionValueUsage | undefined;
}

const EMPTY: DefinitionValueUsage = {
  reads: new Set(),
  writes: new Set(),
  externalReads: [],
  unknownAccess: false,
  mayThrow: false,
  observable: false,
};

/** 合并可能执行的各路径，不用某一条样本实际走过的路径代替完整分析。 */
export function mergeDefinitionValueUsage(
  usages: readonly DefinitionValueUsage[],
): DefinitionValueUsage {
  return {
    reads: new Set(usages.flatMap(usage => [...usage.reads])),
    writes: new Set(usages.flatMap(usage => [...usage.writes])),
    externalReads: usages.flatMap(usage => usage.externalReads),
    unknownAccess: usages.some(usage => usage.unknownAccess),
    mayThrow: usages.some(usage => usage.mayThrow),
    observable: usages.some(usage => usage.observable),
  };
}

export function actionValueUsage(
  operand: ActionValueOperand | LevelValues | undefined,
): DefinitionValueUsage {
  if (
    operand === undefined ||
    typeof operand !== 'object' ||
    !('kind' in operand) ||
    operand.kind === 'constant'
  )
    return EMPTY;
  if (operand.kind === 'parameter') return { ...EMPTY, unknownAccess: true, mayThrow: true };
  // 数据节点在使用点求值，未绑定或节点内部失败都会抛错；读取集合由节点自身图决定，不能静态归并。
  if (operand.kind === 'valueNode') return { ...EMPTY, unknownAccess: true, mayThrow: true };
  return {
    ...EMPTY,
    reads: new Set([operand.key]),
    mayThrow: operand.fallback === undefined,
  };
}

/** Unbound graph expressions cannot prove a key unused; resolution belongs to their graph. */
function actionStringUsage(operand: ActionStringOperand): DefinitionValueUsage {
  if (typeof operand === 'string') return EMPTY;
  if ('kind' in operand) return { ...EMPTY, unknownAccess: true, mayThrow: true };
  return { ...EMPTY, reads: new Set([operand.blackboardKey]), mayThrow: true };
}

/**
 * assignDynamic 会读取目的键的旧数值，决定是否跳过 epsilon 范围内的写入。
 * 旧值缺失时可以直接写入，因此这类读取本身不产生严格缺键错误。
 */
function numericOutputUsage(keys: readonly (string | undefined)[]): DefinitionValueUsage {
  const present = keys.filter((key): key is string => key !== undefined);
  return {
    ...EMPTY,
    reads: new Set(present),
    writes: new Set(present),
    observable: present.length > 0,
  };
}

/** 条件即使只返回真假，也可能写值、抽样或要求特定事件环境。 */
export function analyzeConditionUsage(
  condition: CombatCondition,
  sequenceUsage?: (reference: ActionGraphReference) => DefinitionValueUsage,
): DefinitionValueUsage {
  const value = (operand: ActionValueOperand | number, writes: readonly string[] = []) => ({
    ...mergeDefinitionValueUsage([actionValueUsage(operand), numericOutputUsage(writes)]),
    // 除字面量比较之外的查询需要运行环境；优化器不能把环境错误一起抹掉。
    mayThrow: true,
    observable: writes.length > 0,
  });
  const outputs = (...keys: readonly (string | undefined)[]): DefinitionValueUsage => ({
    ...numericOutputUsage(keys),
    mayThrow: true,
  });
  switch (condition.kind) {
    case 'checkActionResult':
      return sequenceUsage
        ? sequenceUsage(condition.action)
        : { ...EMPTY, unknownAccess: true, mayThrow: true, observable: true };
    case 'constant':
      return EMPTY;
    case 'conditionNode':
      // 数据节点按当前作用域求值，结果取决于节点自身图；不能静态归并，也不能静默删除。
      return { ...EMPTY, unknownAccess: true, mayThrow: true };
    case 'not':
      return analyzeConditionUsage(condition.condition, sequenceUsage);
    case 'all':
    case 'any':
      return mergeDefinitionValueUsage(
        condition.conditions.map(child => analyzeConditionUsage(child, sequenceUsage)),
      );
    case 'stringEquals':
      return mergeDefinitionValueUsage([
        actionStringUsage(condition.left),
        actionStringUsage(condition.right),
      ]);
    case 'actionValueCompare':
      return mergeDefinitionValueUsage([
        actionValueUsage(condition.left),
        actionValueUsage(condition.right),
      ]);
    case 'probability':
      return { ...value(condition.probability), observable: true };
    case 'buffBlackboardValueCompare':
      return {
        ...value(condition.value, [condition.outputKey]),
        externalReads: [
          {
            kind: 'buff',
            target: condition.target,
            query: condition.query,
            key: condition.desiredKey,
          },
        ],
      };
    case 'entityCountCompare':
      return {
        ...value(condition.value, condition.outputKey === undefined ? [] : [condition.outputKey]),
        reads: new Set(condition.outputKey === undefined ? [] : [condition.outputKey]),
        observable: !isReadOnlyTargetQuery(condition.target),
        mayThrow: true,
      };
    case 'abilityEntityRemainingDurationCompare':
      return {
        ...value(condition.value, condition.outputKey === undefined ? [] : [condition.outputKey]),
        observable:
          condition.outputKey !== undefined ||
          (condition.target !== undefined && !isReadOnlyTargetQuery(condition.target)),
      };
    case 'eventConsumedBuffLayerCompare':
    case 'eventBuffEnhanceLayerCompare':
      return value(condition.value, condition.outputKey === undefined ? [] : [condition.outputKey]);
    case 'targetContains':
      return {
        ...EMPTY,
        mayThrow: true,
        observable: [condition.parent, condition.child].some(
          query => !isReadOnlyTargetQuery(query),
        ),
      };
    case 'targetDistance':
      return {
        ...EMPTY,
        mayThrow: true,
        observable: [condition.source, condition.target].some(
          query => !isReadOnlyTargetQuery(query),
        ),
      };
    case 'targetFacingAngle':
      return actionValueUsage(condition.angle);
    case 'twoDirectionAngleCompare':
      return {
        ...value(condition.value),
        observable: [
          condition.direction1Source,
          condition.direction1Target,
          condition.direction2Source,
          condition.direction2Target,
        ].some(query => !isReadOnlyTargetQuery(query)),
      };
    case 'enemySuperArmorCompare':
    case 'healthCompare':
    case 'poiseCompare':
    case 'contextTargetBuffStackCompare':
    case 'contextTargetBuffIdStackCompare':
    case 'currentBuffStackCompare':
    case 'buffStackCompare':
    case 'buffTagIdCountCompare':
    case 'buffIdStackCompare':
    case 'eventTargetBuffCountCompare':
      return value(condition.value);
    case 'timedMarkerPresent':
    case 'abilityEntityTimedMarkerPresent':
      return mergeDefinitionValueUsage([outputs(), actionStringUsage(condition.markerId)]);
    case 'eventInflictionElementIn':
    case 'eventPhysicalInflictionTypeIn': {
      // 两类原生检查先严格读取旧值，再比较 float32 epsilon；Spell 的空键不启用保存。
      const key =
        condition.kind === 'eventInflictionElementIn' && condition.outputKey === ''
          ? undefined
          : condition.outputKey;
      return {
        ...outputs(key),
        reads: new Set(key === undefined ? [] : [key]),
      };
    }
    case 'eventCustomAbilityNameMatch':
      return outputs(condition.outputKey === '' ? undefined : condition.outputKey);
    case 'eventTransferredPartTagsMatch':
      // 目标组写入不是黑板写入，但同样不允许随未使用的比较结果一起裁剪。
      return { ...EMPTY, mayThrow: true, observable: condition.saveToContextKey !== undefined };
    case 'eventBuffIdMatch':
    case 'eventBuffTagsMatch':
      // Buff ID 是字符串，运行时 assign 直接覆盖，不经过数值 epsilon 检查。
      return { ...outputs(condition.buffIdOutputKey), reads: new Set() };
    case 'eventOverheal':
      // 原生直接 AssignDynamic，不读取旧值做 epsilon 去重。
      return {
        ...outputs(
          condition.overHealKey || undefined,
          condition.finalHealKey || undefined,
          condition.realHealKey || undefined,
        ),
        reads: new Set(),
      };
    case 'skillHasHit':
    case 'combatActive':
    case 'singleEnemyPresent':
    case 'comboCameraAlphaSetting':
    case 'casterControlled':
    case 'characterTypeIn':
    case 'operatorRoleIn':
    case 'enemyRankIn':
    case 'targetStaggered':
    case 'contextTargetObjectTypeMatch':
    case 'actionInputTargetObjectTypeMatch':
    case 'actionInputTargetIdentityMatch':
    case 'contextTargetIdentityMatch':
    case 'contextTargetEntityTagMatch':
    case 'entityTagMatch':
    case 'globalCooldownPresent':
    case 'casterComboPending':
    case 'eventDamageTagsMatch':
    case 'eventDamageGameplayTagsMatch':
    case 'eventDamageFeaturesMatch':
    case 'eventDamageTypeIn':
    case 'skillDamageTypeIn':
    case 'eventSkillTypeIn':
    case 'currentSkillTypeIn':
    case 'originSkillTypeIn':
    case 'skillInterruptReasonIn':
    case 'eventSkillIdIn':
    case 'eventSkillCastMatchesBuffSource':
    case 'eventBuffEndedEarly':
    case 'eventHealTagsMatch':
    case 'eventSpGainMatch':
    case 'eventSourceMatchesBuffSource':
    case 'eventSourceMatchesBuffSourceEntitySource':
    case 'buffSourceMatchesOwner':
    case 'ownerSpawnedAbilityEntityPresent':
    case 'deckAttributeCompare':
    case 'eventProjectilePerfectDodgeCooldownEquals':
    case 'eventAbilityEntityFinishReasonIn':
    case 'eventProjectileIgnoreImmuneLevelCompare':
      return outputs();
    default: {
      // 新条件必须明确登记；外部未校验输入也不能默认成纯读取。
      const unhandled: never = condition;
      void unhandled;
      return { ...EMPTY, unknownAccess: true, mayThrow: true, observable: true };
    }
  }
}

/**
 * 局部动作的黑板用途。Buff 上的算术写入会刷新属性，故不在这里标成可直接删除的纯动作。
 * 未细分的动作仍完整保留；后续按执行器证据逐项补充，不让类型新增静默扩大裁剪范围。
 */
export function analyzeStepUsage(
  step: CombatStepDefinition,
  context?: DefinitionUsageContext,
): DefinitionValueUsage {
  const effect = (
    inputs: readonly (ActionValueOperand | LevelValues | undefined)[] = [],
    outputs: readonly (string | undefined)[] = [],
  ): DefinitionValueUsage => ({
    ...mergeDefinitionValueUsage([...inputs.map(actionValueUsage), numericOutputUsage(outputs)]),
    // 此分析描述读写，不代表这些行为可以删除。
    mayThrow: true,
    observable: true,
  });
  switch (step.kind) {
    case 'invertNextResult':
      // 改变下一动作返回值的解释，不读写变量；控制效果仍不可当作空动作删除。
      return { ...EMPTY, observable: true };
    case 'checkCondition':
      return { ...analyzeConditionUsage(step.parameters.condition), observable: true };
    case 'modifyActionValue':
      return {
        ...actionValueUsage(step.parameters.value),
        // assignDynamic 的 epsilon 判断也会读取目的键，assign 也不能当成无条件覆盖。
        reads: new Set([...actionValueUsage(step.parameters.value).reads, step.parameters.key]),
        writes: new Set([step.parameters.key]),
        observable: true,
      };
    case 'calculateActionValue':
      return {
        ...mergeDefinitionValueUsage([
          actionValueUsage(step.parameters.left),
          actionValueUsage(step.parameters.right),
          { ...EMPTY, reads: new Set([step.parameters.key]) },
        ]),
        writes: new Set([step.parameters.key]),
        observable: true,
      };
    case 'dealDamage':
      return effect([
        step.parameters.attackScale,
        step.parameters.calculationAddition,
        step.parameters.calculationValue,
        step.parameters.calculationValueScale,
        step.parameters.stagger,
        step.parameters.staggerMultiplier,
        ...(step.parameters.instantAttributeModifiers?.map(modifier => modifier.value) ?? []),
        ...(step.parameters.instantDamageScaleModifiers?.map(modifier => modifier.addition) ?? []),
      ]);
    case 'dealStagger':
      return effect([step.parameters.value, step.parameters.valueMultiplier]);
    case 'heal':
      return effect([step.parameters.amount, step.parameters.multiplier, step.parameters.addition]);
    case 'createSpatialPointTargets':
      return effect([step.parameters.count]);
    case 'pickContextTarget':
      return effect([step.parameters.index]);
    case 'findOwnerSpawnedAbilityEntities': {
      const usage = effect([]);
      const indexKey = step.parameters.circularOrder?.indexBlackboardKey;
      if (indexKey === undefined) return usage;
      const { abilityEntityIds, owner, sameSourceSkillCast } = step.parameters;
      return {
        ...usage,
        externalReads: [
          {
            kind: 'abilityEntity',
            ...(abilityEntityIds === undefined ? {} : { abilityEntityIds }),
            owner,
            ...(sameSourceSkillCast === undefined ? {} : { sameSourceSkillCast }),
            key: indexKey,
          },
        ],
      };
    }
    case 'setAbilityEntityRemainingDuration':
      return {
        ...effect([step.parameters.value]),
        ...(!isReadOnlyTargetQuery(step.parameters.target) ? { unknownAccess: true } : {}),
      };
    case 'setCurrentBuffRemainingDuration':
    case 'setBuffRemainingDuration':
    case 'setHealthFloor':
    case 'setCharacterPassiveUiValue':
    case 'adjustSkillCooldown':
      return effect([step.parameters.value]);
    case 'applyPhysicalInfliction':
      return effect(
        step.parameters.type === 'airborne'
          ? [step.parameters.duration, step.parameters.height]
          : step.parameters.type === 'knockDown'
            ? [step.parameters.duration]
            : step.parameters.type === 'crush'
              ? [step.parameters.damageMultiplier]
              : [],
      );
    case 'forceSpellStatus':
      return effect([step.parameters.consumedLayers, step.parameters.count]);
    case 'readSkillSettingData':
      return effect(
        step.parameters.items.map(item => item.column),
        step.parameters.items.map(item => item.storeKey),
      );
    case 'readBuffBlackboard':
      return {
        ...effect([], [step.parameters.outputKey]),
        externalReads: [
          {
            kind: 'buff',
            target: step.parameters.target,
            query: step.parameters.query,
            key: step.parameters.desiredKey,
          },
        ],
      };
    case 'readEventBuffBlackboard':
      return {
        ...effect([], [step.parameters.outputKey]),
        externalReads: [{ kind: 'eventBuff', key: step.parameters.desiredKey }],
      };
    case 'saveTwoDirectionAngle':
    case 'readBuffRemainingDuration':
      return {
        ...effect([], [step.parameters.outputKey]),
        reads: new Set([step.parameters.outputKey]),
      };
    case 'readBuffStackCount':
    case 'storeCharacterTypeId':
    case 'storeCurrentTimelineFrame':
    case 'storeShieldValue':
    case 'storeEventDamageValue':
      return effect([], [step.parameters.outputKey]);
    case 'storeCharacterTypeBySquadSlot':
      return effect([step.parameters.slotIndex], [step.parameters.outputKey]);
    case 'findCharacterBySquadSlot':
      return effect([step.parameters.slotIndex], []);
    case 'storeEventSpGainAmount':
      return effect([], [step.parameters.outputKey, step.parameters.realDeltaOutputKey]);
    case 'storeEventHealValues':
      return effect([], [step.parameters.finalHealOutputKey, step.parameters.realHealOutputKey]);
    case 'storeSourceAttributeValue':
    case 'storeEntityPropertyValue':
      return effect(
        [
          step.parameters.base,
          step.parameters.multiplier,
          ...(step.parameters.useFloor ? [step.parameters.divisor] : []),
        ],
        [step.parameters.targetKey],
      );
    case 'dispelBuffs': {
      const usage = effect([]);
      return isReadOnlyTargetQuery(step.parameters.targets) &&
        isReadOnlyTargetQuery(step.parameters.source)
        ? usage
        : { ...usage, unknownAccess: true };
    }
    case 'finishBuffsByTag':
    case 'finishBuffsById': {
      const usage = effect([step.parameters.count]);
      return isReadOnlyTargetQuery(step.parameters.targets) &&
        (step.parameters.reason === 'other' || isReadOnlyTargetQuery(step.parameters.finishSource))
        ? usage
        : { ...usage, unknownAccess: true };
    }
    case 'setGlobalCooldown':
      return effect([step.parameters.durationSeconds]);
    case 'createTimedMarker': {
      const usage = effect([step.parameters.durationSeconds]);
      const result = mergeDefinitionValueUsage([
        usage,
        actionStringUsage(step.parameters.markerId),
      ]);
      return isReadOnlyTargetQuery(step.parameters.targets)
        ? result
        : { ...result, unknownAccess: true };
    }
    case 'startTimeDilation':
      return effect([
        step.parameters.durationSeconds,
        ...(step.parameters.scope === 'global'
          ? [step.parameters.influenceSkillCooldownSeconds]
          : []),
      ]);
    case 'startUltimateTimeDilation':
      return effect([step.parameters.targetScale]);
    case 'recoverDashEnergy':
      return effect([step.parameters.amount]);
    case 'changeResource':
      return effect([step.parameters.amount, step.parameters.coefficient]);
    case 'playAnimation':
      return effect([]);
    case 'showComboRingQte':
      return effect([step.parameters.earlyDurationSeconds, step.parameters.activeDurationSeconds]);
    case 'applyCharacterInfliction':
      return effect([step.parameters.count]);
    case 'aura':
    case 'applyBuff':
      return mergeDefinitionValueUsage([
        effect([step.kind === 'applyBuff' ? step.parameters.count : undefined]),
        ...(!isReadOnlyTargetQuery(step.parameters.targets) ||
        (step.parameters.source !== undefined && !isReadOnlyTargetQuery(step.parameters.source))
          ? [{ ...EMPTY, unknownAccess: true }]
          : []),
        ...step.parameters.buffs.map(entry => {
          const usage = effect([
            ...Object.values(entry.blackboardAssignments ?? {}),
            ...(entry.keywordEnhancements?.map(enhancement => enhancement.value) ?? []),
          ]);
          return mergeDefinitionValueUsage([
            {
              ...usage,
              reads: new Set([
                ...usage.reads,
                ...Object.values(entry.copiedBlackboardAssignments ?? {}),
              ]),
            },
            actionStringUsage(entry.buffId),
          ]);
        }),
      ]);
    case 'createGlobalBuff':
      return effect([
        step.parameters.count,
        ...Object.values(step.parameters.blackboardAssignments ?? {}),
      ]);
    case 'spawnAbilityEntity': {
      const direct = effect([
        step.parameters.overrideDurationSeconds,
        ...Object.values(step.parameters.blackboardAssignments ?? {}),
      ]);
      if (step.parameters.inheritActionBlackboard !== true) return direct;
      const inherited = context?.inheritedAbilityEntityUsage(step);
      if (inherited === undefined) return { ...direct, unknownAccess: true };
      // 不扣除显式覆盖键：首版只闭合接收方用途，保持赋值、缺键与旧值比较的保守语义。
      return mergeDefinitionValueUsage([direct, inherited]);
    }
    case 'jumpTimeline':
      // 跳转本身不访问变量；条件子序列由图遍历汇总，回跳由活性分析保留观察边界。
      return effect();
    case 'overrideMultiDashLimit':
      return effect([step.parameters.dashCount]);
    case 'changeSkillSlot':
      return effect(
        step.parameters.durationSeconds === undefined ? [] : [step.parameters.durationSeconds],
      );
    case 'copyContextTargets':
    case 'saveTransferredSource':
    case 'findTargets':
    case 'interruptCurrentSkill':
    case 'mergeContextTargets':
    case 'findCharacterTeamTargets':
    case 'finishOwner':
    case 'startCurrentAbilityEntityChildSkillById':
    case 'applyElementalInfliction':
    case 'triggerSpellBurst':
    case 'triggerCustomAbilityEvent':
    case 'triggerCharacterInflictionEvent':
    case 'recordPerfectDodge':
    case 'finishParentGlobalBuff':
    case 'finishGlobalBuffsById':
    case 'refreshCurrentBuffAttributeModifiers':
    case 'skillAffix':
    case 'finishCurrentBuff':
    case 'setCurrentBuffTimePaused':
    case 'igniteBuffs':
    case 'holdBuffsById':
    case 'inheritBuffById':
    case 'restrictUltimateEnergyRecovery':
    case 'hideUi':
    case 'setIgnoreGlobalTimeScale':
    case 'gainSquadUltimateEnergyFromSkillCost':
    case 'gainFinisherSp':
    case 'markCurrentSkillCanInterrupt':
    case 'reachSkillOperableBoundary':
    case 'markCurrentSkillCanDash':
    case 'openComboWindow':
    case 'overrideBasicAttackMapping':
    case 'changePlayerActionMode':
    case 'changeNativeSkillType':
    case 'inheritSkillCastInfoForBasicAttack':
      return effect();
    case 'castSkillDuringAction':
      return mergeDefinitionValueUsage([effect(), actionStringUsage(step.parameters.skillId)]);
    default:
      // 外部未经检查的对象或新增类型都不能静默变成“没有读取”。
      return { ...EMPTY, unknownAccess: true, mayThrow: true, observable: true };
  }
}
