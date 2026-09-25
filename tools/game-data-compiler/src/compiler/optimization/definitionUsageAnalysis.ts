/**
 * 分析已生成动作和条件对当前黑板的读写，以及不能随结果一起删除的行为。
 * 只按公共类型的字段解释用途；尚未覆盖的动作保留为分析障碍，不靠字符串搜索猜测无用值。
 */
import type {
  ActionSequenceDefinition,
  CombatStepDefinition,
  CombatStepForKind,
  CombatStepParameters,
} from '../../../../../packages/game-data-contract/src/actions.ts';
import type {
  ActionValueOperand,
  BuffConditionTarget,
  CombatCondition,
} from '../../../../../packages/game-data-contract/src/conditions.ts';
import type { LevelValues } from '../../../../../packages/game-data-contract/src/primitives.ts';

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
      /** 原动作用于读取 owner 身份的目标组；省略时使用运行时施法者。 */
      readonly ownerContextKey?: CombatStepParameters['findOwnerSpawnedAbilityEntities']['ownerContextKey'];
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
  return {
    ...EMPTY,
    reads: new Set([operand.key]),
    mayThrow: operand.fallback === undefined,
  };
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
export function analyzeConditionUsage(condition: CombatCondition): DefinitionValueUsage {
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
    case 'constant':
      return EMPTY;
    case 'not':
      return analyzeConditionUsage(condition.condition);
    case 'all':
    case 'any':
      return mergeDefinitionValueUsage(condition.conditions.map(analyzeConditionUsage));
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
    case 'contextTargetCountCompare':
    case 'abilityEntityRemainingDurationCompare':
    case 'eventConsumedBuffLayerCompare':
      return value(condition.value, condition.outputKey === undefined ? [] : [condition.outputKey]);
    case 'enemySuperArmorCompare':
    case 'cameraToTargetAngleCompare':
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
      return typeof condition.markerId === 'string'
        ? outputs()
        : {
            ...outputs(),
            reads: new Set([condition.markerId.blackboardKey]),
          };
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
    case 'eventBuffIdMatch':
    case 'eventBuffTagsMatch':
      // Buff ID 是字符串，运行时 assign 直接覆盖，不经过数值 epsilon 检查。
      return { ...outputs(condition.buffIdOutputKey), reads: new Set() };
    case 'eventOverheal':
      return outputs(
        condition.overHealKey || undefined,
        condition.finalHealKey || undefined,
        condition.realHealKey || undefined,
      );
    case 'combatActive':
    case 'singleEnemyPresent':
    case 'casterControlled':
    case 'characterTypeIn':
    case 'operatorRoleIn':
    case 'enemyRankIn':
    case 'skillBranchEnabled':
    case 'targetStaggered':
    case 'contextFlagEquals':
    case 'contextTargetObjectTypeMatch':
    case 'actionInputTargetObjectTypeMatch':
    case 'actionInputTargetIdentityMatch':
    case 'contextTargetIdentityMatch':
    case 'contextTargetEntityTagMatch':
    case 'statusActive':
    case 'entityTagMatch':
    case 'globalCooldownPresent':
    case 'casterComboPending':
    case 'eventComboRingQteSucceeded':
    case 'eventDamageTagsMatch':
    case 'eventDamageGameplayTagsMatch':
    case 'eventDamageFeaturesMatch':
    case 'eventDamageTypeIn':
    case 'eventSkillTypeIn':
    case 'currentSkillTypeIn':
    case 'originSkillTypeIn':
    case 'contextTargetContains':
    case 'eventSkillIdIn':
    case 'eventSkillCastMatchesBuffSource':
    case 'eventBuffEndedEarly':
    case 'eventHealTagsMatch':
    case 'eventSpGainMatch':
    case 'eventSourceTargetMatch':
    case 'eventActionOwnerTargetMatch':
    case 'eventSourceMatchesBuffSource':
    case 'eventSourceMatchesBuffSourceEntitySource':
    case 'eventSourceControlled':
    case 'buffSourceMatchesOwner':
    case 'ownerSpawnedAbilityEntityPresent':
    case 'elementalInflictionPresent':
    case 'elementalReactionActive':
    case 'deckAttributeCompare':
    case 'eventProjectilePerfectDodgeCooldownEquals':
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
    case 'conditional':
      return mergeDefinitionValueUsage([
        analyzeConditionUsage(step.parameters.condition),
        analyzeSequenceUsage(step.whenTrue, context),
        ...(step.whenFalse === undefined ? [] : [analyzeSequenceUsage(step.whenFalse, context)]),
      ]);
    case 'switch':
      return mergeDefinitionValueUsage([
        actionValueUsage(step.parameters.choice),
        ...step.options.flatMap(option => [
          actionValueUsage(option.value),
          analyzeSequenceUsage(option.sequence, context),
        ]),
      ]);
    case 'once':
    case 'repeatEachTick':
    case 'forEachContextTarget':
      return { ...analyzeSequenceUsage(step.body, context), observable: true };
    case 'repeatByActionValue':
      return {
        ...mergeDefinitionValueUsage([
          actionValueUsage(step.parameters.count),
          analyzeSequenceUsage(step.body, context),
        ]),
        observable: true,
      };
    case 'withActionBlackboardScope':
      // 这里只保守汇总父板可能被读取的键，不据此裁剪子板。父快照会覆盖子 initialValues，
      // 同一 scopeKey 还可能复用其他入口先创建的板，因此不能扣除子初值或 inheritParent=false
      // 入口中的同名键。子程序仍有未知访问或整板逃逸时，继续阻止父板裁剪。
      return {
        ...mergeDefinitionValueUsage([
          analyzeSequenceUsage(step.body, context),
          ...Object.values(step.parameters.entityAssignments ?? {}).map(actionValueUsage),
        ]),
        mayThrow: true,
        observable: true,
      };
    case 'listenForCombatEvents':
      return {
        ...mergeDefinitionValueUsage(
          step.parameters.responses.flatMap(response => [
            analyzeSequenceUsage(response.sequence, context),
            ...(response.condition === undefined
              ? []
              : [analyzeConditionUsage(response.condition)]),
          ]),
        ),
        observable: true,
      };
    case 'dealDamage':
      return effect([
        step.parameters.attackScale,
        step.parameters.calculationAddition,
        step.parameters.stagger,
        step.parameters.staggerMultiplier,
        ...(step.parameters.instantAttributeModifiers?.map(modifier => modifier.value) ?? []),
        ...(step.parameters.instantDamageScaleModifiers?.map(modifier => modifier.addition) ?? []),
      ]);
    case 'dealFixedDamage':
      return effect([
        step.parameters.value,
        step.parameters.stagger,
        step.parameters.staggerMultiplier,
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
      const usage = effect([], [step.parameters.saveCountToBlackboardKey]);
      const indexKey = step.parameters.circularOrder?.indexBlackboardKey;
      if (indexKey === undefined) return usage;
      const { abilityEntityIds, ownerContextKey, sameSourceSkillCast } = step.parameters;
      return {
        ...usage,
        externalReads: [
          {
            kind: 'abilityEntity',
            ...(abilityEntityIds === undefined ? {} : { abilityEntityIds }),
            ...(ownerContextKey === undefined ? {} : { ownerContextKey }),
            ...(sameSourceSkillCast === undefined ? {} : { sameSourceSkillCast }),
            key: indexKey,
          },
        ],
      };
    }
    case 'setAbilityEntityRemainingDuration':
    case 'setCurrentBuffRemainingDuration':
    case 'setHealthFloor':
    case 'setCharacterPassiveUiValue':
    case 'adjustSkillCooldown':
      return effect([step.parameters.value]);
    case 'applyKnockDown':
      return effect([step.parameters.duration]);
    case 'applyPhysicalInfliction':
      return effect(
        step.parameters.type === 'airborne'
          ? [step.parameters.duration, step.parameters.height]
          : step.parameters.type === 'crush'
            ? [step.parameters.damageMultiplier]
            : [],
      );
    case 'applyElementalReaction':
      return effect([step.parameters.durationSeconds]);
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
    case 'readCurrentBuffRemainingDuration':
    case 'readBuffRemainingDuration':
    case 'readBuffStackCount':
    case 'readAbilityEntityRemainingDuration':
    case 'storeCurrentTimelineFrame':
    case 'storeShieldValue':
      return effect([], [step.parameters.outputKey]);
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
    case 'finishBuffsByTag':
    case 'finishBuffsById':
      return effect([step.parameters.count]);
    case 'setGlobalCooldown':
      return effect([step.parameters.durationSeconds]);
    case 'createTimedMarker':
    case 'createAbilityEntityTimedMarker': {
      const usage = effect([step.parameters.durationSeconds]);
      return typeof step.parameters.markerId === 'string'
        ? usage
        : {
            ...usage,
            reads: new Set([...usage.reads, step.parameters.markerId.blackboardKey]),
          };
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
    case 'changeResourceByActionValue':
      return effect([step.parameters.amount, step.parameters.coefficient]);
    case 'showComboRingQte':
      return effect([step.parameters.earlyDurationSeconds, step.parameters.activeDurationSeconds]);
    case 'applyBuff': {
      const usage = effect([
        step.parameters.count,
        ...Object.values(step.parameters.blackboardAssignments ?? {}),
        ...(step.parameters.keywordEnhancements?.map(enhancement => enhancement.value) ?? []),
        ...(step.parameters.onActionEndBuffs?.flatMap(buff =>
          Object.values(buff.blackboardAssignments ?? {}),
        ) ?? []),
      ]);
      const reads = new Set([
        ...usage.reads,
        ...Object.values(step.parameters.copiedBlackboardAssignments ?? {}),
      ]);
      if (typeof step.parameters.buffId !== 'string') {
        reads.add(step.parameters.buffId.blackboardKey);
      }
      return { ...usage, reads };
    }
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
      return step.parameters.condition === undefined
        ? effect()
        : {
            ...analyzeConditionUsage(step.parameters.condition),
            observable: true,
          };
    case 'mergeContextTargets':
    case 'findCharacterTeamTargets':
    case 'finishCurrentAbilityEntity':
    case 'finishActionOwnerAbilityEntity':
    case 'finishCurrentAbilityEntityWhenSourceDies':
    case 'startCurrentAbilityEntityChildSkill':
    case 'startCurrentAbilityEntityChildSkillById':
    case 'applyElementalInfliction':
    case 'triggerSpellBurst':
    case 'triggerCustomAbilityEvent':
    case 'consumeElementalReaction':
    case 'outputAirborne':
    case 'outputKnockDown':
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
    case 'changeResource':
    case 'gainSquadUltimateEnergyFromSkillCost':
    case 'gainFinisherSp':
    case 'applyStatus':
    case 'consumeStatus':
    case 'finishTimeline':
    case 'markCurrentSkillCanInterrupt':
    case 'setContextFlag':
    case 'openComboWindow':
    case 'changeSkillSlot':
    case 'overrideBasicAttackMapping':
    case 'changePlayerActionMode':
    case 'changeNativeSkillType':
    case 'inheritSkillCastInfoForBasicAttack':
      return effect();
    case 'castSkillDuringAction':
      return typeof step.parameters.skillId === 'string'
        ? effect()
        : {
            ...effect(),
            reads: new Set([step.parameters.skillId.blackboardKey]),
          };
    case 'launchProjectile':
      // 回调保存父 direct 快照，并用它覆盖自身初值。汇总全部延时入口的读写，不能因回调
      // 声明了同名默认值就减键；嵌套的实体传值或其他未知访问会继续向父板上传。
      return mergeDefinitionValueUsage([
        effect(),
        ...step.callbacks
          .flatMap(callback => callback.skill.scheduledSequences)
          .map(item => analyzeSequenceUsage(item.sequence, context)),
      ]);
    default:
      // 外部未经检查的对象或新增类型都不能静默变成“没有读取”。
      return { ...EMPTY, unknownAccess: true, mayThrow: true, observable: true };
  }
}

export function analyzeSequenceUsage(
  sequence: ActionSequenceDefinition,
  context?: DefinitionUsageContext,
): DefinitionValueUsage {
  return mergeDefinitionValueUsage(sequence.steps.map(step => analyzeStepUsage(step, context)));
}

/**
 * 不可达分支仍在 Reset 时准备；只允许移除已经确认准备阶段无行为的节点。
 * 未列出的节点保留，例如伤害、治疗、附着、击倒和隐藏 UI 都有专门的 prepare 路径。
 */
export function canDiscardUnexecutedSequence(sequence: ActionSequenceDefinition): boolean {
  return sequence.steps.every(step => {
    if (step.key !== undefined) return false;
    switch (step.kind) {
      case 'modifyActionValue':
      case 'calculateActionValue':
        return true;
      case 'conditional':
        return (
          canDiscardUnexecutedSequence(step.whenTrue) &&
          (step.whenFalse === undefined || canDiscardUnexecutedSequence(step.whenFalse))
        );
      case 'switch':
        return step.options.every(option => canDiscardUnexecutedSequence(option.sequence));
      default:
        return false;
    }
  });
}
