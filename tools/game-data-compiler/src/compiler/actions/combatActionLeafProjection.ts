import type {
  BuffApplicationSource,
  BuffApplicationTarget,
} from '../../../../../packages/game-data-contract/src/primitives.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { BlackboardAssignmentSource } from '../../source/assignments.ts';
import type { BuffApplicationActionSource } from '../../source/buffActions.ts';
import type { NativeActionNodeSource } from '../../source/controlFlow.ts';
import type { SkillTypeMutationActionSource } from '../../source/presentationActions.ts';
import type { TargetReferenceSource } from '../../source/target.ts';
import { projectBuffIgniteAction } from '../buffs/buffIgniteProjection.ts';
import {
  COMPILED_BUFF_CAPTURED_TARGET_GROUPS,
  COMPILED_BUFF_TARGET_KINDS,
} from '../buffs/compiledBuffMetadata.ts';
import { projectKeywordBuffAction } from '../buffs/keywordBuffProjection.ts';
import { projectCombatRuntimeAttributeKey } from '../build/attributeModifier.ts';
import {
  actionValueOperand,
  type CombatActionProjectionContextSource,
  type CombatActionProjectionExtensionsSource,
  isControlledOperatorInstantSearch,
  isPartyExceptOwnerInstantSearch,
  isPartyInstantSearch,
  isUniqueEnemyHitBoxInstantSearch,
  isUniqueEnemyMainTargetInstantSearch,
  type ProjectedTargetGroup,
  projectGameplayTags,
  requireActionOwnerProjection,
} from '../combatProjectionCommon.ts';
import { projectActionTargetQuery } from '../conditions/combatConditionProjection.ts';
import { standardStumpBuffAbilityEventOmissionReason } from '../scenario/standardStumpScenarioPolicy.ts';
import { isPresentationOnlyActionSequence } from '../skills/skillPresentationTargets.ts';
import type {
  CompiledActionValueOperandSource,
  CompiledBuffStepSource,
} from './combatActionProjectionTypes.ts';
import { projectElementalInflictionAction } from './elementalInflictionProjection.ts';
import { projectGlobalCooldownTarget } from './globalCooldownProjection.ts';
import { projectKnockDownAction } from './knockDownProjection.ts';
import { projectPhysicalInflictionAction } from './physicalInflictionProjection.ts';
import {
  compileEventTargetSimpleDamageOperationSource,
  compileEventTargetSimplePoiseOperationSource,
} from './simpleDamageOperation.ts';

/** 不改变命名目标组状态的普通动作叶子投影。
 * 保留各动作的来源/目标和场景约束；不递归调用序列编排器。 */

/** 动作赋值的数值部分；直接字符串由 projectStringBuffAssignments 独立输出。 */
export function projectBuffAssignments(
  assignments: readonly BlackboardAssignmentSource[],
  sourcePath: string,
): Readonly<Record<string, CompiledActionValueOperandSource>> {
  const entries: Array<readonly [string, CompiledActionValueOperandSource]> = [];
  assignments.forEach((item, index) => {
    if (!item.useDirectValue) {
      entries.push([item.targetKey, { kind: 'blackboard', key: item.inputValueKey }]);
      return;
    }
    if (item.valueType === 'String') return;
    if (item.valueType !== 'Numeric') {
      throw new Error(
        `${sourcePath}.assignItems[${index}]: unsupported direct Buff assignment type ${item.valueType}`,
      );
    }
    entries.push([item.targetKey, { kind: 'constant', value: item.numericValue }]);
  });
  return Object.fromEntries(entries);
}

/** 原生直接字符串黑板赋值；不把字符串伪装成数值 ActionValueOperand。 */
export function projectStringBuffAssignments(
  assignments: readonly BlackboardAssignmentSource[],
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    assignments.flatMap(item =>
      item.useDirectValue && item.valueType === 'String'
        ? [[item.targetKey, item.stringValue] as const]
        : [],
    ),
  );
}

/** 原生非直接赋值不声明值类型；运行时必须按来源黑板中的实际类型复制。 */
function projectCopiedBuffAssignments(
  assignments: readonly BlackboardAssignmentSource[],
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    assignments.flatMap(item =>
      item.useDirectValue ? [] : [[item.targetKey, item.inputValueKey] as const],
    ),
  );
}

/** CreateBuff 的直接数值赋值；非直接项由 projectCopiedBuffAssignments 保留原类型。 */
function projectDirectNumericBuffAssignments(
  assignments: readonly BlackboardAssignmentSource[],
  sourcePath: string,
): Readonly<Record<string, CompiledActionValueOperandSource>> {
  return projectBuffAssignments(
    assignments.filter(item => item.useDirectValue),
    sourcePath,
  );
}

export function compileActionNode(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  visualOnlyIds: ReadonlySet<string>,
  partyTargetGroups: ReadonlyMap<string, ProjectedTargetGroup> = new Map(),
  context: CombatActionProjectionContextSource,
  extensions: CombatActionProjectionExtensionsSource = {},
): CompiledBuffStepSource[] {
  if (node.body.kind !== 'leaf') {
    throw new Error(`${node.sourcePath}: unsupported Buff runtime action`);
  }
  if (node.body.value.family === 'skillAffix') {
    return [{ kind: 'skillAffix', parameters: {} }];
  }
  if (node.body.value.family === 'characterIdentity') {
    const action = node.body.value.action;
    if (action.kind === 'findCharacterBySquadSlot')
      return [
        {
          kind: action.kind,
          parameters: {
            slotIndex: actionValueOperand({ ...action.slotIndex, levelValues: null }),
            saveToContextKey: action.saveToContextKey,
          },
        },
      ];
    if (action.kind === 'storeCharacterTypeBySquadSlot')
      return [
        {
          kind: action.kind,
          parameters: {
            slotIndex: actionValueOperand({ ...action.slotIndex, levelValues: null }),
            defaultValue: action.defaultValue,
            outputKey: action.outputKey,
          },
        },
      ];
    if (!isPlainTargetReference(action.target, action.target.targetSource, ''))
      throw new Error(`${node.sourcePath}: unsupported character type target selector`);
    const target =
      action.target.targetSource === 'Owner'
        ? context.actionOwnerTarget
        : action.target.targetSource === 'Source'
          ? context.actionSourceTarget
          : action.target.targetSource === 'Target'
            ? context.actionTargetTarget
            : undefined;
    if (
      target !== 'caster' &&
      target !== 'buffOwner' &&
      target !== 'buffSource' &&
      target !== 'currentOperator' &&
      target !== 'enemy'
    )
      throw new Error(`${node.sourcePath}: unsupported character type target ${target}`);
    return [
      {
        kind: 'storeCharacterTypeId',
        parameters: {
          target: target === 'currentOperator' ? 'currentTarget' : target,
          outputKey: action.outputKey,
        },
      },
    ];
  }
  if (node.body.value.family === 'uiVisibility') {
    return [
      { kind: 'hideUi', parameters: { onlyBlockInput: node.body.value.action.onlyBlockInput } },
    ];
  }
  if (node.body.value.family === 'physicalInfliction') {
    return [
      node.body.value.action.kind === 'knockDown'
        ? projectKnockDownAction(node.body.value.action, node.sourcePath, context)
        : projectPhysicalInflictionAction(node.body.value.action, node.sourcePath, context),
    ];
  }
  if (
    context.actionTargetTarget === 'currentAbilityEntity' &&
    ![
      // Context 伤害可以命中另一个目标；伤害投影器单独验证施术者和实际目标组。
      'damage',
      'buffApplication',
      'blackboardMutation',
      'blackboardCalculation',
      'eventPayload',
      'timedMarker',
      'skillCast',
      // 纯表现动作不依赖目标类型；有战斗语义的表现动作仍由下方处理器验证接收者。
      'presentation',
    ].includes(node.body.value.family)
  )
    throw new Error(`${node.sourcePath}: unaudited AbilityEntity action ${node.body.value.family}`);
  if (
    context.actionTargetTarget === 'enemy' &&
    ![
      'damage',
      'heal',
      'buffApplication',
      'buffInheritance',
      'buffBlackboardRead',
      'buffLifeTimeRead',
      'buffQuery',
      'buffFinish',
      'buffHold',
      'dispel',
      'normalSkillUltimateEnergy',
      'blackboardMutation',
      'blackboardCalculation',
      'eventPayload',
      'timelineRead',
      'randomBlackboard',
      'attributeSnapshot',
      'entityPropertySnapshot',
      'healthFloor',
      'resource',
      'finisherSpGain',
      'presentation',
      'presentationCalculation',
      'directionAngle',
      'spatial',
      'spatialMeasurement',
      'selfDefense',
      'projectileControl',
      'animationTiming',
      'animationEventListener',
      'inputControl',
      'castingControl',
      'timeDilation',
      'timedMarker',
      // 动作自身仍严格要求 Owner/Source 解析为 caster；敌人 Target 只是技能命中上下文。
      'globalCooldown',
      'modeAndResourcePolicy',
      'skillCooldownMutation',
      'skillSlotReplacement',
      'typhoeaArcherySelection',
      'eventListener',
      'environment',
      'elementalInfliction',
      'characterSpellInfliction',
      'buffIgnite',
      'forcedElementalStatus',
      'spellBurstEvent',
      'customAbilityEvent',
      'skillCast',
      // Pending 自身仍在下方严格校验固定候选角色、敌人目标、trigger 与空赋值。
      'comboPending',
      'aiMarker',
      'levelEvent',
      'aura',
      'keywordBuff',
      'rayCastTargetGroup',
    ].includes(node.body.value.family)
  )
    throw new Error(`${node.sourcePath}: unaudited single-enemy action ${node.body.value.family}`);
  if (
    context.restrictEventSourceTargetProjection === true &&
    ![
      'buffApplication',
      'buffFinish',
      'buffBlackboardRead',
      'blackboardCalculation',
      'blackboardMutation',
      'eventPayload',
      // 接收侧回调可读取自身动态生命/失衡值与 MaxHp 等属性；各分支仍严格校验 Owner。
      'entityPropertySnapshot',
      'attributeSnapshot',
      'healthFloor',
      'presentation',
      'timedMarker',
      'modeAndResourcePolicy',
      'skillCooldownMutation',
      // OnBeforeTakeDamage may refund the listening Buff source's resources.
      // The resource branch below still requires the source to be the proven fixed caster.
      'resource',
      // 受击侧 Buff 可以基于本次伤害再结算一段反击伤害；下方 damage 投影仍校验
      // 事件来源、固定 Buff owner 与 DamageAction 目标，不能把普通受击回调一概放行。
      'damage',
      // 受击侧 Buff 可以治疗自身；heal 分支仍严格校验 healer、目标和计算式。
      'heal',
      // 极限闪避监听器在受击前从自身黑板读取隐藏 Dodge 技能；具体施法者、目标和 ID
      // 仍由 skillCast 投影逐字段校验，不能据此放宽其他动作族。
      'skillCast',
      // 这两个动作不读取事件来源或目标：前者恢复 PlayerController 的共享闪避能量，
      // 后者只记录一次已成功的极限闪避。动作分支仍严格校验原生字段。
      'dashEnergyRecovery',
      'battleDetailRecord',
      // 标记的身份由 Owner/Source 解析，与受击事件的对端对象无关。
      'globalCooldown',
    ].includes(node.body.value.family)
  )
    throw new Error(
      `${node.sourcePath}: unaudited receiving Buff event action ${node.body.value.family}`,
    );
  if (node.body.value.family === 'buffApplication') {
    return compileBuffApplication(
      node.body.value.action,
      visualOnlyIds,
      node.sourcePath,
      partyTargetGroups,
      context,
    );
  }
  if (node.body.value.family === 'timelineRead') {
    const action = node.body.value.action;
    const target = action.target;
    if (
      action.kind !== 'storeCurrentSkillExecuteFrame' ||
      target.targetSource !== 'Owner' ||
      target.targetGroupKey !== '' ||
      !(
        context.actionOwnerTarget === 'caster' ||
        (context.actionOwnerTarget === 'buffOwner' && context.fixedBuffOwnerTarget === 'caster')
      ) ||
      target.finderType !== null ||
      target.validatorTypes.length !== 0 ||
      target.postProcessorTypes.length !== 0 ||
      target.priorityFilters.length !== 0 ||
      target.shuffleTargets.length !== 0 ||
      target.distanceValidators.length !== 0 ||
      target.finderSpawnedObjectType !== null ||
      target.validatorTagQueries.length !== 0
    ) {
      throw new Error(`${node.sourcePath}: unsupported current skill timeline frame target`);
    }
    return [{ kind: 'storeCurrentTimelineFrame', parameters: { outputKey: action.outputKey } }];
  }
  if (node.body.value.family === 'eventPayload') {
    const action = node.body.value.action;
    if (action.kind === 'saveDamageContext') {
      const values = {
        FinalValue: 'final',
        RealValue: 'real',
        OverflowingValue: 'overflow',
      } as const;
      return [
        {
          kind: 'storeEventDamageValue',
          parameters: {
            value: values[action.valueType],
            outputKey: action.saveTo,
          },
        },
      ];
    }
    if (action.kind === 'saveHealValue') {
      if (action.finalHealKey.length === 0 && action.realHealKey.length === 0) {
        throw new Error(`${node.sourcePath}: SaveHealValue has no output key`);
      }
      return [
        {
          kind: 'storeEventHealValues',
          parameters: {
            ...(action.finalHealKey.length === 0
              ? {}
              : { finalHealOutputKey: action.finalHealKey }),
            ...(action.realHealKey.length === 0 ? {} : { realHealOutputKey: action.realHealKey }),
          },
        },
      ];
    }
    if (action.kind === 'saveShieldValue') {
      const target = action.target;
      if (
        action.outputKey.length === 0 ||
        target.targetSource !== 'Owner' ||
        target.targetGroupKey !== '' ||
        target.finderType !== null ||
        target.validatorTypes.length !== 0 ||
        target.postProcessorTypes.length !== 0 ||
        target.priorityFilters.length !== 0 ||
        target.shuffleTargets.length !== 0 ||
        target.distanceValidators.length !== 0 ||
        target.finderSpawnedObjectType !== null ||
        target.validatorTagQueries.length !== 0
      ) {
        throw new Error(`${node.sourcePath}: unsupported SaveShieldValueToBB target or output key`);
      }
      return [
        {
          kind: 'storeShieldValue',
          parameters: {
            target: 'actionOwner',
            value: action.valueType === 'GainedValue' ? 'gained' : 'current',
            outputKey: action.outputKey,
          },
        },
      ];
    }
    if (action.valueKey.length === 0 && action.realDeltaKey.length === 0) {
      throw new Error(`${node.sourcePath}: SaveAtbObtainValue has no output key`);
    }
    return [
      {
        kind: 'storeEventSpGainAmount',
        parameters: {
          ...(action.valueKey.length === 0 ? {} : { outputKey: action.valueKey }),
          ...(action.realDeltaKey.length === 0 ? {} : { realDeltaOutputKey: action.realDeltaKey }),
        },
      },
    ];
  }
  if (node.body.value.family === 'levelEvent') {
    if (
      node.body.value.action.kind === 'physicalNoGuardStartedEvent' &&
      context.actionOwnerTarget !== 'buffOwner'
    ) {
      throw new Error(`${node.sourcePath}: OnPhysicalNoGuardStart requires a Buff environment`);
    }
    // 该动作只发布 GameLevelEvent/BattleRecorder 事实；被动木桩没有其消费者，
    // 状态本身由承载 Buff 生命周期表示，故不重复建立另一套状态。
    return [];
  }
  if (node.body.value.family === 'buffIgnite') {
    return [projectBuffIgniteAction(node.body.value.action, node.sourcePath, context)];
  }
  if (node.body.value.family === 'spellBurstEvent') {
    return [
      {
        kind: 'triggerSpellBurst',
        parameters: { burstType: node.body.value.action.element },
      },
    ];
  }
  if (node.body.value.family === 'customAbilityEvent') {
    const action = node.body.value.action;
    const sourceIsCaster =
      (action.eventSource.targetSource === 'Source' &&
        action.eventSource.targetGroupKey === '' &&
        context.actionSourceTarget === 'caster') ||
      (action.eventSource.targetSource === 'Owner' &&
        action.eventSource.targetGroupKey === '' &&
        context.actionOwnerTarget === 'buffOwner' &&
        context.fixedBuffOwnerTarget === 'caster');
    const sourceIsActionOwnerAbilityEntity =
      action.eventSource.targetSource === 'Owner' &&
      action.eventSource.targetGroupKey === '' &&
      (context.actionOwnerTarget === 'currentAbilityEntity' ||
        (context.actionOwnerTarget === 'buffOwner' &&
          context.fixedBuffOwnerTarget === 'currentAbilityEntity'));
    const targetIsCaster =
      (action.targets.targetSource === 'Source' &&
        action.targets.targetGroupKey === '' &&
        context.actionSourceTarget === 'caster') ||
      (action.targets.targetSource === 'Owner' &&
        action.targets.targetGroupKey === '' &&
        context.actionOwnerTarget === 'buffOwner' &&
        context.fixedBuffOwnerTarget === 'caster');
    if (
      action.eventName.blackboardKey !== null ||
      action.eventName.value.length === 0 ||
      action.eventParam.blackboardKey !== null
    ) {
      throw new Error(`${node.sourcePath}: unsupported custom ability event source/target/value`);
    }
    return [
      {
        kind: 'triggerCustomAbilityEvent',
        parameters: {
          eventName: action.eventName.value,
          eventParam: action.eventParam.value,
          target: targetIsCaster
            ? 'caster'
            : projectActionTargetQuery(action.targets, context, `${node.sourcePath}.targets`),
          source: sourceIsActionOwnerAbilityEntity
            ? 'currentAbilityEntity'
            : sourceIsCaster
              ? 'caster'
              : projectActionTargetQuery(
                  action.eventSource,
                  context,
                  `${node.sourcePath}.eventSource`,
                ),
        },
      },
    ];
  }
  if (node.body.value.family === 'skillCast') {
    const action = node.body.value.action;
    const abilityEntityCaster =
      action.caster.targetSource === 'Target' &&
      action.caster.targetGroupKey === '' &&
      context.actionTargetTarget === 'currentAbilityEntity';
    const abilityEntityTargetIsFixedEnemy =
      action.target.targetSource === 'Owner' &&
      action.target.targetGroupKey === '' &&
      context.actionOwnerTarget === 'buffOwner' &&
      context.fixedBuffOwnerTarget === 'enemy';
    const casterIsContext =
      action.caster.targetSource === 'Context' && action.caster.targetGroupKey.length > 0;
    const casterIsFixedCaster =
      (action.caster.targetSource === 'Source' || action.caster.targetSource === 'Owner') &&
      action.caster.targetGroupKey === '' &&
      (action.caster.targetSource === 'Owner'
        ? context.fixedBuffOwnerTarget === 'caster' || context.actionOwnerTarget === 'caster'
        : context.actionSourceTarget === 'caster' || context.fixedBuffSourceTarget === 'caster');
    const targetIsStaticEnemy =
      abilityEntityTargetIsFixedEnemy ||
      (action.target.targetSource === 'Context' &&
        action.target.targetGroupKey !== '' &&
        context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true) ||
      // TargetSource.Target reads the action input target handle; targetGroupKey and embedded
      // selector fields are not consulted by this branch. Active skill projection binds that
      // input handle to the unique enemy.
      (action.target.targetSource === 'Target' && context.actionTargetTarget === 'enemy') ||
      // AbilityActionUtils.GetTargetsView 的 MainTarget 分支直接读取 BattleManager 主目标，
      // 不消费 TargetSettings 中残留的命名组或 selector。固定唯一木桩模型下其身份就是 enemy。
      action.target.targetSource === 'MainTarget' ||
      isUniqueEnemyMainTargetInstantSearch(action.target);
    const targetIsFixedCaster =
      (action.target.targetSource === 'Owner' &&
        (context.fixedBuffOwnerTarget === 'caster' || context.actionOwnerTarget === 'caster')) ||
      (action.target.targetSource === 'Source' &&
        (context.actionSourceTarget === 'caster' || context.fixedBuffSourceTarget === 'caster'));
    const targetIsActionInput =
      action.target.targetSource === 'Target' &&
      (context.actionTargetTarget === 'eventSource' ||
        context.actionTargetTarget === 'eventTarget' ||
        context.actionTargetTarget === 'actionInputTarget');
    const targetIsContext =
      action.target.targetSource === 'Context' &&
      action.target.targetGroupKey.length > 0 &&
      action.target.validatorTypes.length === 0 &&
      action.target.postProcessorTypes.length === 0;
    if (
      (!casterIsFixedCaster && !casterIsContext && !abilityEntityCaster) ||
      (action.skillId.blackboardKey === null && action.skillId.value.length === 0) ||
      (action.skillId.blackboardKey !== null && action.skillId.blackboardKey.length === 0)
    ) {
      throw new Error(`${node.sourcePath}: unsupported deferred skill cast source/target/id`);
    }
    return [
      {
        kind: 'castSkillDuringAction',
        parameters: {
          ...(casterIsContext
            ? { caster: { kind: 'context' as const, key: action.caster.targetGroupKey } }
            : abilityEntityCaster
              ? { caster: { kind: 'inputTarget' as const } }
              : {}),
          skillId:
            action.skillId.blackboardKey === null
              ? action.skillId.value
              : { blackboardKey: action.skillId.blackboardKey },
          ...(targetIsContext && !targetIsStaticEnemy
            ? { targetContextKey: action.target.targetGroupKey }
            : {}),
          target:
            targetIsContext && !targetIsStaticEnemy
              ? 'context'
              : targetIsActionInput
                ? 'actionInputTarget'
                : targetIsFixedCaster
                  ? 'caster'
                  : targetIsStaticEnemy
                    ? 'enemy'
                    : projectActionTargetQuery(action.target, context, `${node.sourcePath}.target`),
          skipApplyCost: action.skipApplyCost,
          inheritSourceSkillCastInfo: action.inheritSourceSkillCastId,
          ...(action.interruptCurrentSkillOnlyWhenTargetCastable
            ? { interruptCurrentSkillOnlyWhenTargetCastable: true }
            : {}),
        },
      },
    ];
  }
  if (node.body.value.family === 'aiMarker') {
    const action = node.body.value.action;
    if (
      action.owner.targetSource !== 'Source' ||
      action.owner.targetGroupKey !== '' ||
      context.actionSourceTarget !== 'caster'
    ) {
      throw new Error(`${node.sourcePath}: unsupported AI marker owner`);
    }
    // AI 标记的消费者位于敌方主动 AI 行为。Endaxis 的被动单木桩
    // 不执行该系统；来源字段仍被完整解析，不能伪装为 GameplayTag 或 TimedMarker。
    return [];
  }
  if (node.body.value.family === 'buffInheritance') {
    const action = node.body.value.action;
    if (visualOnlyIds.has(action.targetBuffId)) return [];
    const targetsCaster =
      action.owner.targetGroupKey === '' &&
      ((action.owner.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
        (action.owner.targetSource === 'Owner' && context.actionOwnerTarget === 'caster'));
    if (!targetsCaster) {
      throw new Error(`${node.sourcePath}: unsupported inherited Buff owner`);
    }
    return [
      {
        kind: 'inheritBuffById',
        parameters: {
          target: 'caster',
          buffId: action.targetBuffId,
          inheritToNextSkillIds: action.inheritSkillIds,
          finishByAction: action.finishByAction,
          finishWithNextSkillIfNotInherited: action.finishWithNextSkillIfNotInherited,
        },
      },
    ];
  }
  if (node.body.value.family === 'modeAndResourcePolicy') {
    const action = node.body.value.action;
    if (action.kind === 'switchMode') {
      if (
        !action.resetOnEnd ||
        action.interruptCurrentSkillWhenStart ||
        action.interruptCurrentSkillWhenEnd
      ) {
        throw new Error(`${node.sourcePath}: unsupported SwitchMode lifecycle options`);
      }
      return [
        {
          kind: 'changePlayerActionMode',
          parameters: { modeId: action.modeId, lifetime: 'finishByAction' },
        },
      ];
    }
    if (
      (action.target.targetSource !== 'Source' && action.target.targetSource !== 'Owner') ||
      action.target.targetGroupKey !== '' ||
      (action.target.targetSource === 'Source'
        ? context.actionSourceTarget !== 'caster' && context.fixedBuffSourceTarget !== 'caster'
        : context.actionOwnerTarget !== 'caster' && context.fixedBuffOwnerTarget !== 'caster')
    ) {
      throw new Error(`${node.sourcePath}: unsupported ultimate-energy restriction target`);
    }
    return [
      {
        kind: 'restrictUltimateEnergyRecovery',
        parameters: {
          target: 'caster',
          allowedRecoveryTags: projectGameplayTags(
            action.allowedRecoveryTagIds,
            context,
            node.sourcePath,
          ),
          clearUltimateEnergyOnEnd: action.clearUltimateEnergyOnEnd,
        },
      },
    ];
  }
  if (node.body.value.family === 'skillCooldownMutation') {
    const action = node.body.value.action;
    const targetsCaster =
      (action.target.targetSource === 'Owner' &&
        (context.actionOwnerTarget === 'caster' ||
          (context.actionOwnerTarget === 'buffOwner' &&
            context.fixedBuffOwnerTarget === 'caster'))) ||
      (action.target.targetSource === 'Source' &&
        (context.actionSourceTarget === 'caster' || context.fixedBuffSourceTarget === 'caster'));
    const contextKey = action.target.targetSource === 'Context' ? action.target.targetGroupKey : '';
    if (!targetsCaster && contextKey === '') {
      throw new Error(`${node.sourcePath}: unsupported skill cooldown target`);
    }
    return [
      {
        kind: 'adjustSkillCooldown',
        parameters: {
          target: contextKey === '' ? 'caster' : { kind: 'context', key: contextKey },
          skill: action.skill,
          operation: action.operation,
          basis: action.basis,
          value: actionValueOperand(action.value),
        },
      },
    ];
  }
  if (node.body.value.family === 'buffModifierRefresh') {
    return [{ kind: 'refreshCurrentBuffAttributeModifiers', parameters: {} }];
  }
  if (node.body.value.family === 'eventListener') {
    if (
      node.body.value.action.events.every(
        event => standardStumpBuffAbilityEventOmissionReason(event.abilityEvent) !== null,
      )
    ) {
      // 技能临时监听器与 Buff 监听器共享同一场景边界：固定时间轴不会在结束前离战。
      // 响应动作只保留在来源 IR，不能被提升为无条件清理或跳转。
      return [];
    }
    if (
      node.body.value.action.events.every(event => event.abilityEvent === 'OnBeforeOutputAirborne')
    ) {
      // 1.4.4 AirborneAction 反编译路径只发布通用物理异常事件，
      // 明确不合成旧的 OnBeforeOutputAirborne/OnAfterOutputAirborne 事件。
      return [];
    }
    if (
      context.actionOwnerTarget === 'caster' &&
      node.body.value.action.events.every(event => event.abilityEvent === 'OnBeforeTakeDamage')
    ) {
      // EventListenerAction 在 ActionOwner 注册；木桩不攻击，干员不会收到伤害包。
      // 只省略干员受伤前监听，不能删除敌人受伤或干员输出伤害的监听。
      return [];
    }
    if (node.body.value.action.events.every(event => event.abilityEvent === 'OnAfterKillEntity')) {
      // 固定木桩死亡后不再继续累计有效伤害；击杀后的延迟资源返还不进入模拟可见结果。
      return [];
    }
    throw new Error(`${node.sourcePath}: unsupported combat-visible EventListenerAction`);
  }
  if (node.body.value.family === 'buffFinish') {
    const action = node.body.value.action;
    if (action.kind === 'finishCurrentBuff') {
      if (context.actionOwnerTarget !== 'buffOwner')
        throw new Error(`${node.sourcePath}: FinishCurBuff requires a Buff environment`);
      return [{ kind: 'finishCurrentBuff', parameters: { reason: 'other', finishSource: 'none' } }];
    }
    if (action.limitSource) {
      throw new Error(`${node.sourcePath}: limited-source Buff finish is not supported`);
    }
    const targets = projectActionTargetQuery(action.owner, context, `${node.sourcePath}.buffOwner`);
    const finishSource = projectActionTargetQuery(
      action.finishSource,
      context,
      `${node.sourcePath}.finishSource`,
    );
    if (
      action.kind === 'buffFinishByQuery' &&
      action.settings.checkType === 'Tag' &&
      action.settings.tagQuery.tagIds.length > 0
    ) {
      return [
        {
          kind: 'finishBuffsByTag',
          parameters: {
            targets,
            finishSource,
            tagQueryType: action.settings.tagQuery.queryType,
            buffTags: projectGameplayTags(
              action.settings.tagQuery.tagIds,
              context,
              node.sourcePath,
            ),
            reason: action.isFinishedEarly ? 'early' : action.isAbsorbed ? 'absorbed' : 'other',
            ...(action.finishAll ? {} : { count: actionValueOperand(action.finishLayerCount) }),
          },
        },
      ];
    }
    if (
      action.kind === 'buffFinishByQuery' &&
      action.settings.checkType === 'Id' &&
      action.settings.buffIds.length === 0
    ) {
      // 原生 Id 分支逐项遍历 buffIdList；空列表不会调用 BuffContainer，且不会退化为“全部”。
      return [];
    }
    if (
      action.kind === 'buffFinishByQuery' &&
      action.settings.checkType === 'Environment' &&
      action.owner.targetSource === 'Owner' &&
      context.actionOwnerTarget === 'buffOwner' &&
      action.finishAll &&
      (action.finishSource.targetSource === 'Owner' ||
        action.finishSource.targetSource === 'Source') &&
      action.finishSource.targetGroupKey === ''
    ) {
      // Environment 精确指向当前 Buff；Id/Tag 分支的残留配置不参与此查询。
      return [
        {
          kind: 'finishCurrentBuff',
          parameters: {
            reason: action.isFinishedEarly ? 'early' : action.isAbsorbed ? 'absorbed' : 'other',
            finishSource:
              action.finishSource.targetSource === 'Owner' ? 'actionOwner' : 'actionSource',
          },
        },
      ];
    }
    const buffIds =
      action.kind === 'buffFinishById'
        ? action.buffIds
        : action.settings.checkType === 'Id' &&
            action.settings.buffIds.length > 0 &&
            action.settings.tagQuery.tagIds.length === 0
          ? action.settings.buffIds
          : null;
    if (buffIds === null || buffIds.length === 0 || buffIds.some(id => id.length === 0)) {
      throw new Error(`${node.sourcePath}: unsupported Buff finish query`);
    }
    return [
      {
        kind: 'finishBuffsById',
        parameters: {
          // TargetSettings：Buff 环境 Owner 是 Buff 接收者，
          // Source 是 Buff 来源。这里保持二者身份，不因多数样本使用 Owner 而合并。
          targets,
          finishSource,
          buffIds,
          reason: action.isFinishedEarly
            ? 'early'
            : action.kind === 'buffFinishByQuery' && action.isAbsorbed
              ? 'absorbed'
              : 'other',
          ...(action.finishAll ? {} : { count: actionValueOperand(action.finishLayerCount) }),
        },
      },
    ];
  }
  if (node.body.value.family === 'buffHold') {
    const action = node.body.value.action;
    const targetsCaster =
      action.owner.targetGroupKey === '' &&
      ((action.owner.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
        (action.owner.targetSource === 'Owner' &&
          (context.actionOwnerTarget === 'caster' ||
            (context.actionOwnerTarget === 'buffOwner' &&
              context.fixedBuffOwnerTarget === 'caster'))));
    if (!targetsCaster) {
      throw new Error(`${node.sourcePath}: unsupported ExtendBuffAction owner`);
    }
    const buffIds =
      action.settings.checkType === 'Id' &&
      action.settings.buffIds.length > 0 &&
      action.settings.buffIds.every(id => id.length > 0) &&
      action.settings.tagQuery.tagIds.length === 0
        ? action.settings.buffIds
        : null;
    if (buffIds === null) {
      throw new Error(`${node.sourcePath}: unsupported ExtendBuffAction query`);
    }
    return [
      {
        kind: 'holdBuffsById',
        parameters: { target: 'caster', buffIds },
      },
    ];
  }
  if (node.body.value.family === 'dispel') {
    const action = node.body.value.action;
    return [
      {
        kind: 'dispelBuffs',
        parameters: {
          source: projectActionTargetQuery(
            action.dispelSource,
            context,
            `${node.sourcePath}.dispelSource`,
          ),
          targets: projectActionTargetQuery(
            action.dispelTargets,
            context,
            `${node.sourcePath}.dispelTargets`,
          ),
          level: action.dispelLevel,
          ...(action.checkTag
            ? {
                query: {
                  buffTags: projectGameplayTags(action.tagQuery.tagIds, context, node.sourcePath),
                  tagQueryType: action.tagQuery.queryType,
                },
              }
            : {}),
        },
      },
    ];
  }
  if (node.body.value.family === 'normalSkillUltimateEnergy') {
    const action = node.body.value.action;
    const sourceIsCaster =
      action.source.targetGroupKey === '' &&
      ((action.source.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
        (action.source.targetSource === 'Owner' &&
          (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')));
    const coefficient =
      action.coefficient.blackboardKey === null
        ? action.coefficient.value
        : typeof action.coefficient.levelValues === 'number'
          ? action.coefficient.levelValues
          : null;
    if (!sourceIsCaster || coefficient === null)
      throw new Error(`${node.sourcePath}: unsupported ObtainUspInNormalSkill projection`);
    return [
      {
        kind: 'gainSquadUltimateEnergyFromSkillCost',
        parameters: { coefficient },
      },
    ];
  }
  if (node.body.value.family === 'damage') {
    const damageAction = node.body.value.action;
    if (
      damageAction.target.targetSource === 'Context' &&
      partyTargetGroups.get(damageAction.target.targetGroupKey) === 'empty'
    ) {
      // No target receives damage; only an explicitly always-next action can be elided.
      if (!damageAction.alwaysNext)
        throw new Error(`${node.sourcePath}: empty-target damage short-circuit is unsupported`);
      return [];
    }
    if (damageAction.units.length === 0 && damageAction.hitEnvironment && damageAction.alwaysNext) {
      // 来源层已确认 hitEnvData 只描述环境命中特效。没有 DamageUnit 且始终继续的动作
      // 不会修改唯一木桩的数值或控制后续流程，Next 无场景交互后端时可安全省略。
      return [];
    }
    const targetsProjectedEnemyContext =
      damageAction.target.targetSource === 'Context' &&
      damageAction.target.targetGroupKey !== '' &&
      (partyTargetGroups.get(damageAction.target.targetGroupKey) === 'enemy' ||
        context.staticEnemyTargetGroupKeys?.has(damageAction.target.targetGroupKey) === true);
    const targetsRuntimeContext =
      damageAction.target.targetSource === 'Context' &&
      partyTargetGroups.get(damageAction.target.targetGroupKey) === 'runtimeTargets';
    const targetsUniqueEnemyFromCasterBuff =
      context.actionOwnerTarget === 'buffOwner' &&
      context.fixedBuffOwnerTarget === 'caster' &&
      context.fixedBuffSourceTarget === 'caster' &&
      damageAction.target.targetSource === 'Target' &&
      damageAction.target.finderType === 'MainTargetFinder' &&
      damageAction.target.validatorTypes.length === 0 &&
      damageAction.target.postProcessorTypes.length === 0;
    if (
      (context.actionSourceTarget !== 'caster' && context.fixedBuffSourceTarget !== 'caster') ||
      (context.actionOwnerTarget === 'currentAbilityEntity' &&
        damageAction.attacker === 'ActionOwner') ||
      (!['enemy', 'eventTarget'].includes(context.actionTargetTarget) &&
        !(
          context.actionTargetTarget === 'actionInputTarget' &&
          damageAction.target.targetSource === 'Target'
        ) &&
        !(context.actionTargetTarget === 'buffOwner' && context.fixedBuffOwnerTarget === 'enemy') &&
        !(
          damageAction.target.targetSource === 'Owner' &&
          damageAction.target.targetGroupKey === '' &&
          context.actionOwnerTarget === 'buffOwner' &&
          context.fixedBuffOwnerTarget === 'enemy'
        ) &&
        !targetsProjectedEnemyContext &&
        !targetsRuntimeContext &&
        !targetsUniqueEnemyFromCasterBuff)
    )
      throw new Error(`${node.sourcePath}: unsupported damage source or target binding`);
    const damageContext = {
      ...context,
      runtimeTargetGroupKeys: new Set(
        [...partyTargetGroups]
          .filter(([, target]) => target === 'runtimeTargets')
          .map(([key]) => key),
      ),
      // AbilityEntity child skills can attribute damage to their proven caster through
      // ActionSource. Their entity Owner remains unavailable as an attacker; effectSource
      // is presentation-only and is validated independently by the simple damage compiler.
      actionOwnerTarget:
        context.actionOwnerTarget === 'currentAbilityEntity'
          ? ('unavailable' as const)
          : context.actionOwnerTarget,
      actionSourceTarget: 'caster' as const,
    } as const;
    return [
      damageAction.units.length === 1 && damageAction.units[0]?.attributeType === 'Poise'
        ? compileEventTargetSimplePoiseOperationSource(damageAction, node.sourcePath, damageContext)
        : compileEventTargetSimpleDamageOperationSource(
            damageAction,
            node.sourcePath,
            damageContext,
          ),
    ];
  }
  if (node.body.value.family === 'elementalInfliction') {
    return [projectElementalInflictionAction(node.body.value.action, node.sourcePath, context)];
  }
  if (node.body.value.family === 'characterInflictionEvent') {
    const action = node.body.value.action;
    if (
      action.source.targetGroupKey !== '' ||
      action.source.finderType !== null ||
      action.source.validatorTypes.length > 0 ||
      action.source.postProcessorTypes.length > 0
    )
      throw new Error(`${node.sourcePath}: unsupported character infliction event source`);
    const eventSource =
      action.source.targetSource === 'Source'
        ? context.actionSourceTarget
        : action.source.targetSource === 'Owner'
          ? requireActionOwnerProjection(context, node.sourcePath)
          : null;
    if (eventSource === null)
      throw new Error(`${node.sourcePath}: unsupported character infliction event source`);
    return [
      {
        kind: 'triggerCharacterInflictionEvent',
        parameters: { event: action.event, element: action.element, eventSource },
      },
    ];
  }
  if (node.body.value.family === 'characterSpellInfliction') {
    const action = node.body.value.action;
    const sourceIsGod =
      action.source.targetSource === 'InstantSearch' &&
      action.source.finderType === 'GodEntityFinder';
    for (const [label, target] of [
      ['source', action.source],
      ['target', action.target],
    ] as const) {
      if (
        target.targetGroupKey !== '' ||
        target.validatorTypes.length !== 0 ||
        target.postProcessorTypes.length !== 0 ||
        (target.finderType !== null && !(label === 'source' && sourceIsGod))
      )
        throw new Error(
          `${node.sourcePath}.${label}: unsupported character infliction target modifiers`,
        );
    }
    const source: BuffApplicationSource | 'battle' =
      action.source.targetSource === 'Owner'
        ? requireActionOwnerProjection(context, node.sourcePath)
        : action.source.targetSource === 'Source'
          ? context.actionSourceTarget
          : sourceIsGod
            ? 'battle'
            : (() => {
                throw new Error(`${node.sourcePath}: unsupported character infliction source`);
              })();
    const target: BuffApplicationTarget =
      action.target.targetSource === 'MainCharacter'
        ? 'controlledOperator'
        : action.target.targetSource === 'Owner'
          ? requireActionOwnerProjection(context, node.sourcePath)
          : action.target.targetSource === 'Source'
            ? context.actionSourceTarget
            : action.target.targetSource === 'Target' &&
                context.actionTargetTarget !== 'currentOperator'
              ? context.actionTargetTarget
              : (() => {
                  throw new Error(`${node.sourcePath}: unsupported character infliction target`);
                })();
    if (action.source.targetGroupKey !== '' || action.target.targetGroupKey !== '')
      throw new Error(`${node.sourcePath}: character infliction Context target is not supported`);
    return [
      {
        kind: 'applyCharacterInfliction',
        parameters: {
          element: ({ Fire: 'heat', Pulse: 'electric', Cryst: 'cryo', Natural: 'nature' } as const)[
            action.element
          ],
          source,
          target,
          count: action.useCountBlackboardKey
            ? { kind: 'blackboard', key: action.countBlackboardKey }
            : { kind: 'constant', value: action.count },
          directToTriggered: action.directToTriggered,
          ignoreWeakImmune: action.ignoreImmuneLevel === 'IgnoreWeakImmune',
          ignoreAddingCooldown: action.ignoreAddingCooldown,
        },
      },
    ];
  }
  if (node.body.value.family === 'forcedElementalStatus') {
    const action = node.body.value.action;
    const targetsEnemy =
      (action.target.targetSource === 'Target' && context.actionTargetTarget === 'enemy') ||
      (action.target.targetSource === 'Context' &&
        action.target.targetGroupKey !== '' &&
        (partyTargetGroups.get(action.target.targetGroupKey) === 'enemy' ||
          context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true));
    if (
      action.source.targetSource !== 'Source' ||
      action.source.targetGroupKey !== '' ||
      context.actionSourceTarget !== 'caster' ||
      !targetsEnemy
    ) {
      throw new Error(`${node.sourcePath}: unsupported forced elemental status targets`);
    }
    if (
      action.consumedElement.blackboardKey !== null ||
      action.consumedElement.levelValues !== null ||
      !Number.isInteger(action.consumedElement.value)
    ) {
      throw new Error(`${node.sourcePath}.consumedType: dynamic element is unsupported`);
    }
    const elements = ['Fire', 'Pulse', 'Cryst', 'Natural'] as const;
    const consumedElement = elements[action.consumedElement.value];
    if (consumedElement === undefined) {
      throw new Error(`${node.sourcePath}.consumedType: unknown element index`);
    }
    const elementsByNative = {
      Fire: 'heat',
      Pulse: 'electric',
      Cryst: 'cryo',
      Natural: 'nature',
    } as const;
    return [
      {
        kind: 'forceSpellStatus',
        parameters: {
          target: 'enemy',
          element: elementsByNative[action.statusElement],
          consumedElement: elementsByNative[consumedElement],
          consumedLayers: actionValueOperand(action.consumedLayers),
          count: actionValueOperand(action.statusCount),
          isExtra: action.isExtra,
        },
      },
    ];
  }
  if (node.body.value.family === 'keywordBuff') {
    return [
      projectKeywordBuffAction(node.body.value.action, node.sourcePath, context, partyTargetGroups),
    ];
  }
  if (node.body.value.family === 'heal') {
    const action = node.body.value.action;
    const target =
      action.target.targetSource === 'Owner' &&
      action.target.targetGroupKey === '' &&
      isInFightEnemyInstantSearch(action.target)
        ? ('enemy' as const)
        : action.target.targetSource === 'Source' &&
            action.target.targetGroupKey === '' &&
            context.actionSourceTarget === 'caster'
          ? ('caster' as const)
          : isControlledOperatorInstantSearch(action.target)
            ? ('controlledOperator' as const)
            : action.target.targetSource === 'Owner' &&
                (context.actionOwnerTarget === 'caster' ||
                  context.actionOwnerTarget === 'buffOwner')
              ? context.actionOwnerTarget
              : action.target.targetSource === 'Target'
                ? ('actionInputTarget' as const)
                : action.target.targetSource === 'MainCharacter' &&
                    action.target.finderType === null &&
                    action.target.validatorTypes.length === 0 &&
                    action.target.postProcessorTypes.length === 0
                  ? ('controlledOperator' as const)
                  : action.target.targetSource === 'Context' &&
                      action.target.targetGroupKey !== '' &&
                      partyTargetGroups.get(action.target.targetGroupKey) === 'contextOperator'
                    ? ('contextTarget' as const)
                    : null;
    const attributeNames = {
      Str: 'strength',
      Agi: 'agility',
      Wisd: 'intellect',
      Will: 'will',
      MaxHp: 'maxHealth',
    } as const;
    const attribute =
      action.calculation.kind === 'attribute'
        ? attributeNames[action.calculation.attributeType as keyof typeof attributeNames]
        : undefined;
    if (
      action.healType !== 'Normal' ||
      (action.healer !== 'ActionSource' && action.healer !== 'ActionOwner') ||
      (action.healer === 'ActionOwner' && context.actionOwnerTarget !== 'buffOwner') ||
      target === null ||
      (action.calculation.kind === 'definite' && action.calculation.applyScale) ||
      (action.calculation.kind !== 'definite' &&
        (action.calculation.kind !== 'attribute' ||
          (action.calculation.valueSource !== 'AttackerOrHealer' &&
            action.calculation.valueSource !== 'Target') ||
          attribute === undefined))
    ) {
      throw new Error(`${node.sourcePath}: unsupported Buff runtime heal`);
    }
    const calculation =
      action.calculation.kind === 'definite'
        ? { amount: actionValueOperand(action.calculation.value) }
        : {
            attribute: attribute!,
            multiplier: actionValueOperand(action.calculation.multiplier),
            addition: actionValueOperand(action.calculation.addition),
          };
    const targetParameters =
      target === 'contextTarget'
        ? { target, contextKey: action.target.targetGroupKey! }
        : { target };
    return [
      {
        kind: 'heal',
        parameters: {
          ...targetParameters,
          ...(action.healer === 'ActionOwner' ? { source: 'buffOwner' as const } : {}),
          ...(action.alwaysNext ? { alwaysNext: true } : {}),
          tags: projectGameplayTags(
            action.useHealTags ? action.healTagIds : [],
            context,
            node.sourcePath,
          ),
          ...calculation,
          ...(action.calculation.kind === 'attribute' && action.calculation.valueSource === 'Target'
            ? { attributeSource: 'target' as const }
            : {}),
        },
      },
    ];
  }
  if (node.body.value.family === 'buffQuery') {
    const action = node.body.value.action;
    const targetsStaticEnemy =
      (action.target.targetSource === 'Target' || action.target.targetSource === 'Context') &&
      action.target.targetGroupKey !== '' &&
      context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true;
    const directTarget =
      action.target.targetSource === 'Target' &&
      (context.actionTargetTarget === 'enemy' ||
        context.actionTargetTarget === 'currentAbilityEntity' ||
        context.actionTargetTarget === 'eventTarget' ||
        context.actionTargetTarget === 'buffOwner')
        ? context.actionTargetTarget
        : null;
    const namedContextTarget =
      action.target.targetSource === 'Context' && action.target.targetGroupKey !== ''
        ? (context.contextTargetGroupTargets?.get(action.target.targetGroupKey) ?? null)
        : null;
    if (
      (!targetsStaticEnemy &&
        directTarget === null &&
        namedContextTarget === null &&
        action.target.targetSource !== 'Target' &&
        action.target.targetSource !== 'Owner' &&
        action.target.targetSource !== 'Source') ||
      (!targetsStaticEnemy &&
        directTarget === null &&
        namedContextTarget === null &&
        action.target.targetGroupKey !== '') ||
      action.countType !== 'BuffCount' ||
      action.limitSkillCastId
    ) {
      throw new Error(`${node.sourcePath}: unsupported Buff stack read`);
    }
    const query =
      action.checkType === 'Environment' &&
      action.buffIds.length === 0 &&
      action.buffTagIds.length === 0
        ? { kind: 'environment' as const }
        : action.checkType === 'Id' && action.buffIds.length > 0 && action.buffTagIds.length === 0
          ? { kind: 'id' as const, buffIds: action.buffIds }
          : action.checkType === 'Tag' && action.buffIds.length === 0
            ? {
                kind: 'tag' as const,
                tagQueryType: action.tagQueryType,
                buffTags: projectGameplayTags(action.buffTagIds, context, node.sourcePath),
              }
            : null;
    if (query === null) throw new Error(`${node.sourcePath}: unsupported BuffCount query`);
    return [
      {
        kind: 'readBuffStackCount',
        parameters: {
          target:
            query.kind === 'environment'
              ? 'caster'
              : targetsStaticEnemy
                ? 'enemy'
                : namedContextTarget !== null
                  ? namedContextTarget
                  : directTarget !== null
                    ? directTarget
                    : action.target.targetSource === 'Owner'
                      ? requireActionOwnerProjection(context, node.sourcePath)
                      : action.target.targetSource === 'Source'
                        ? context.actionSourceTarget
                        : 'eventTarget',
          outputKey: action.outputKey,
          query,
        },
      },
    ];
  }
  if (node.body.value.family === 'buffBlackboardRead') {
    const action = node.body.value.action;
    const query =
      action.settings.checkType === 'Id' &&
      action.settings.buffIds.length > 0 &&
      action.settings.buffIds.every(id => id.length > 0) &&
      action.settings.tagQuery.tagIds.length === 0
        ? { kind: 'id' as const, buffIds: action.settings.buffIds }
        : action.settings.checkType === 'Tag' &&
            action.settings.buffIds.length === 0 &&
            action.settings.tagQuery.tagIds.length > 0
          ? {
              kind: 'tag' as const,
              tagQueryType: action.settings.tagQuery.queryType,
              buffTags: projectGameplayTags(
                action.settings.tagQuery.tagIds,
                context,
                node.sourcePath,
              ),
            }
          : null;
    if (
      (action.target.targetSource === 'Owner' || action.target.targetSource === 'Source') &&
      action.target.targetGroupKey === '' &&
      query !== null
    ) {
      return [
        {
          kind: 'readBuffBlackboard',
          parameters: {
            target:
              action.target.targetSource === 'Owner'
                ? requireActionOwnerProjection(context, node.sourcePath)
                : context.actionSourceTarget,
            query,
            desiredKey: action.desiredKey,
            outputKey: action.outputKey,
          },
        },
      ];
    }
    if (
      action.target.targetSource === 'Target' &&
      action.target.targetGroupKey === '' &&
      query !== null &&
      context.actionTargetTarget !== 'partyExceptCaster' &&
      context.actionTargetTarget !== 'partyExceptCasterAndSameCharacterType' &&
      context.actionTargetTarget !== 'currentOperator'
    ) {
      return [
        {
          kind: 'readBuffBlackboard',
          parameters: {
            target: context.actionTargetTarget,
            query,
            desiredKey: action.desiredKey,
            outputKey: action.outputKey,
          },
        },
      ];
    }
    if (
      action.target.targetSource === 'Context' &&
      action.target.targetGroupKey !== '' &&
      (partyTargetGroups.get(action.target.targetGroupKey) === 'enemy' ||
        context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true) &&
      query !== null
    ) {
      return [
        {
          kind: 'readBuffBlackboard',
          parameters: {
            target: 'enemy',
            query,
            desiredKey: action.desiredKey,
            outputKey: action.outputKey,
          },
        },
      ];
    }
    if (
      action.target.targetSource !== 'Target' ||
      action.target.targetGroupKey !== '' ||
      action.settings.checkType !== 'Context' ||
      action.settings.buffIds.length !== 1 ||
      action.settings.buffIds[0] !== '' ||
      action.settings.tagQuery.tagIds.length !== 0
    ) {
      throw new Error(`${node.sourcePath}: unsupported event Buff blackboard read`);
    }
    return [
      {
        kind: 'readEventBuffBlackboard',
        parameters: { desiredKey: action.desiredKey, outputKey: action.outputKey },
      },
    ];
  }
  if (node.body.value.family === 'buffLifeTimeRead') {
    const action = node.body.value.action;
    const settings = action.settings;
    if (settings.checkType === 'Context')
      throw new Error(`${node.sourcePath}: unsupported Context Buff lifetime query`);
    return [
      {
        kind: 'readBuffRemainingDuration',
        parameters: {
          target: projectActionTargetQuery(action.owner, context, `${node.sourcePath}.buffOwner`),
          query:
            settings.checkType === 'Id'
              ? { kind: 'id', buffIds: settings.buffIds }
              : settings.checkType === 'Tag'
                ? {
                    kind: 'tag',
                    buffTags: projectGameplayTags(
                      settings.tagQuery.tagIds,
                      context,
                      node.sourcePath,
                    ),
                    tagQueryType: settings.tagQuery.queryType,
                  }
                : { kind: 'environment' },
          outputKey: action.outputKey,
        },
      },
    ];
  }
  if (node.body.value.family === 'buffDurationMutation') {
    const action = node.body.value.action;
    const operation = ACTION_VALUE_OPERATIONS[action.operation];
    const target =
      action.target.targetSource === 'Target' &&
      (context.actionTargetTarget === 'eventSource' || context.actionTargetTarget === 'eventTarget')
        ? context.actionTargetTarget
        : undefined;
    if (action.settings.checkType === 'Id' || action.settings.checkType === 'Tag') {
      const queriedTarget =
        action.target.targetSource === 'Owner'
          ? requireActionOwnerProjection(context, node.sourcePath)
          : action.target.targetSource === 'Source'
            ? context.actionSourceTarget
            : action.target.targetSource === 'Target' &&
                context.actionTargetTarget !== 'currentOperator'
              ? context.actionTargetTarget
              : null;
      if (
        queriedTarget === null ||
        queriedTarget === 'partyExceptCaster' ||
        queriedTarget === 'partyExceptCasterAndSameCharacterType' ||
        action.target.targetGroupKey !== '' ||
        action.target.finderType !== null ||
        action.target.validatorTypes.length > 0 ||
        action.target.postProcessorTypes.length > 0 ||
        action.isFinishedEarly ||
        (operation !== 'assign' && operation !== 'add' && operation !== 'multiply')
      )
        throw new Error(`${node.sourcePath}: unsupported Buff duration query`);
      return [
        {
          kind: 'setBuffRemainingDuration',
          parameters: {
            target: queriedTarget,
            query:
              action.settings.checkType === 'Id'
                ? { kind: 'id', buffIds: action.settings.buffIds.filter(Boolean) }
                : {
                    kind: 'tag',
                    tagQueryType: action.settings.tagQuery.queryType,
                    buffTags: projectGameplayTags(
                      action.settings.tagQuery.tagIds,
                      context,
                      node.sourcePath,
                    ),
                  },
            operation,
            value: actionValueOperand(action.value),
          },
        },
      ];
    }
    if (
      (action.target.targetSource !== 'Owner' && target === undefined) ||
      action.target.targetGroupKey !== '' ||
      action.settings.checkType !== 'Environment' ||
      action.isFinishedEarly ||
      (operation !== 'assign' && operation !== 'add' && operation !== 'multiply')
    ) {
      throw new Error(`${node.sourcePath}: unsupported Buff duration mutation`);
    }
    return [
      {
        kind: 'setCurrentBuffRemainingDuration',
        parameters: {
          operation,
          value: actionValueOperand(action.value),
          ...(target === undefined ? {} : { target }),
        },
      },
    ];
  }
  if (node.body.value.family === 'buffTimePause') {
    // PauseBuffTime.ExecuteInternal 读取当前 Buff 实例；主动技能或 AbilityEntity 动作图没有
    // 这个隐式宿主，不能仅因运行时契约存在同名步骤就放宽接受范围。
    if (context.actionOwnerTarget !== 'buffOwner') {
      throw new Error(`${node.sourcePath}: PauseBuffTime requires a current Buff action owner`);
    }
    return [
      {
        kind: 'setCurrentBuffTimePaused',
        parameters: { paused: node.body.value.action.paused },
      },
    ];
  }
  if (node.body.value.family === 'blackboardMutation') {
    const action = node.body.value.action;
    if (context.unconsumedSkillLocalKeys?.has(action.key)) return [];
    if (context.combatInvisiblePresentationBlackboardKeys?.has(action.key)) return [];
    if (!action.directValue)
      throw new Error(`${node.sourcePath}: indirect blackboard mutation is unsupported`);
    const operation = ACTION_VALUE_OPERATIONS[action.operation];
    if (operation === undefined)
      throw new Error(`${node.sourcePath}: unsupported blackboard operation ${action.operation}`);
    return [
      {
        kind: 'modifyActionValue',
        parameters: {
          key: action.key,
          operation,
          value: actionValueOperand(action.value),
        },
      },
    ];
  }
  if (node.body.value.family === 'spatialMeasurement') {
    const action = node.body.value.action;
    if (
      !isProvenSpatialMeasurementEndpoint(action.source, partyTargetGroups, context) ||
      !isProvenSpatialMeasurementEndpoint(action.target, partyTargetGroups, context)
    ) {
      throw new Error(`${node.sourcePath}: unresolved target-distance endpoint`);
    }
    return [
      {
        kind: 'modifyActionValue',
        parameters: {
          key: action.outputKey,
          operation: 'assign',
          value: { kind: 'constant', value: 0 },
        },
      },
    ];
  }
  if (node.body.value.family === 'attributeSnapshot') {
    const action = node.body.value.action;
    const supportedSpecificAttributes = new Set([
      'Str',
      'Agi',
      'Wisd',
      'Will',
      'MaxHp',
      'MaxUltimateSp',
      'FireAbnormalDamageIncrease',
      'PulseAbnormalDamageIncrease',
      'CrystAbnormalDamageIncrease',
      'NaturalAbnormalDamageIncrease',
    ]);
    const target =
      action.target.targetSource === 'Owner'
        ? requireActionOwnerProjection(context, node.sourcePath)
        : action.target.targetSource === 'Source'
          ? (context.fixedBuffSourceTarget ?? context.actionSourceTarget)
          : null;
    const contextGroup =
      action.target.targetSource === 'Context'
        ? partyTargetGroups.get(action.target.targetGroupKey)
        : undefined;
    if (
      (target === 'enemy' ||
        (target === 'buffOwner' && context.fixedBuffOwnerTarget === 'enemy') ||
        contextGroup === 'enemy' ||
        contextGroup === 'dynamicEnemy') &&
      action.primaryAttributeType === 'Specific' &&
      action.attributeType === 'MaxHp'
    ) {
      return [
        {
          kind: 'storeEntityPropertyValue',
          parameters: {
            target:
              contextGroup === undefined
                ? 'actionOwner'
                : { kind: 'context', key: action.target.targetGroupKey },
            property: 'maxHealth',
            useFloor: action.useFloor,
            divisor: actionValueOperand(action.divisor),
            multiplier: actionValueOperand(action.multiplier),
            base: actionValueOperand(action.baseValue),
            targetKey: action.outputKey,
          },
        },
      ];
    }
    const fixedTarget = target === 'buffOwner' ? context.fixedBuffOwnerTarget : target;
    if (
      fixedTarget !== 'caster' ||
      (action.primaryAttributeType !== 'Sub' &&
        (action.primaryAttributeType !== 'Specific' ||
          !supportedSpecificAttributes.has(action.attributeType)))
    ) {
      throw new Error(`${node.sourcePath}: unsupported attribute snapshot target or selector`);
    }
    return [
      {
        kind: 'storeSourceAttributeValue',
        parameters: {
          // StoreAttributeValue：Sub 由目标副属性决定，attributeType 此时不参与选择。
          // 保留动态属性读取，不能把生成时面板或 SkillPatch 等级值固化为快照。
          attribute:
            action.primaryAttributeType === 'Sub'
              ? { kind: 'secondary' }
              : {
                  kind: 'specific',
                  key:
                    action.attributeType === 'MaxHp'
                      ? 'maxHealth'
                      : action.attributeType === 'MaxUltimateSp'
                        ? 'maxUltimateEnergy'
                        : projectCombatRuntimeAttributeKey(action.attributeType),
                },
          stage:
            action.storeAttributeType === 'BaseNonConverted'
              ? 'armedNonConverted'
              : 'finalNonConverted',
          useFloor: action.useFloor,
          divisor: actionValueOperand(action.divisor),
          multiplier: actionValueOperand(action.multiplier),
          base: actionValueOperand(action.baseValue),
          targetKey: action.outputKey,
        },
      },
    ];
  }
  if (node.body.value.family === 'entityPropertySnapshot') {
    const action = node.body.value.action;
    if (action.target.targetSource !== 'Owner') {
      throw new Error(`${node.sourcePath}: unsupported entity-property snapshot target`);
    }
    requireActionOwnerProjection(context, node.sourcePath);
    return [
      {
        kind: 'storeEntityPropertyValue',
        parameters: {
          target: 'actionOwner',
          property: action.property === 'CurHp' ? 'currentHealth' : 'currentPoise',
          useFloor: action.useFloor,
          divisor: actionValueOperand(action.divisor),
          multiplier: actionValueOperand(action.multiplier),
          base: actionValueOperand(action.baseValue),
          targetKey: action.outputKey,
        },
      },
    ];
  }
  if (node.body.value.family === 'healthFloor') {
    const action = node.body.value.action;
    if (
      action.actionAfterSet.actions.length !== 0 ||
      action.actionAfterSet.onlyExecuteWhenSourceIsMainCharacter ||
      action.actionAfterSet.onlyExecuteWhenSourceIsGuard
    ) {
      throw new Error(`${node.sourcePath}: non-empty SetHpFloor actionAfterSet is unsupported`);
    }
    requireActionOwnerProjection(context, node.sourcePath);
    return [
      {
        kind: 'setHealthFloor',
        parameters: {
          target: 'actionOwner',
          mode: action.useRatio ? 'maxHealthRatio' : 'absolute',
          value: actionValueOperand(action.useRatio ? action.floorRatio : action.floorValue),
        },
      },
    ];
  }
  if (node.body.value.family === 'blackboardCalculation') {
    const action = node.body.value.action;
    if (context.combatInvisiblePresentationBlackboardKeys?.has(action.key)) return [];
    const operation = ACTION_VALUE_OPERATIONS[action.operation];
    if (
      (operation !== 'add' && operation !== 'multiply' && operation !== 'divide') ||
      action.addend !== null
    ) {
      throw new Error(`${node.sourcePath}: unsupported blackboard calculation`);
    }
    return [
      {
        kind: 'calculateActionValue',
        parameters: {
          key: action.key,
          operation,
          left: actionValueOperand(action.left),
          right: actionValueOperand(action.right),
        },
      },
    ];
  }
  if (node.body.value.family === 'resource') {
    const action = node.body.value.action;
    const operation: CompiledBuffStepSource = {
      kind: 'changeResource',
      parameters: {
        resource: action.resource,
        amount: actionValueOperand(action.amount),
        coefficient: actionValueOperand(action.coefficient),
        source: projectActionTargetQuery(action.source, context, `${node.sourcePath}.source`),
        targets: projectActionTargetQuery(action.target, context, `${node.sourcePath}.target`),
        ...(action.onlyMainOperator ? { onlyMainOperator: true } : {}),
        ...(action.spGainKind === null ? {} : { spGainKind: action.spGainKind }),
        ...(action.spGainSource === null ? {} : { spGainSource: action.spGainSource }),
        ...(action.isPercentValue ? { isPercentValue: true } : {}),
        ...(action.useUltimateRecoveryTag
          ? {
              ultimateRecoveryTag: projectGameplayTags(
                [action.ultimateRecoveryTagId],
                context,
                node.sourcePath,
              )[0]!,
            }
          : {}),
        ...(action.ignoreUltimateGainScalar ? { ignoreUltimateEnergyGainMultiplier: true } : {}),
      },
    };
    return [operation];
  }
  if (node.body.value.family === 'dashEnergyRecovery') {
    if ((node.body.value.action.recoverTagId ?? 0) !== 0) {
      throw new Error(
        `${node.sourcePath}: tagged dash recovery requires recovery-limit tag projection`,
      );
    }
    return [
      {
        kind: 'recoverDashEnergy',
        parameters: {
          amount: actionValueOperand(node.body.value.action.amount),
          canRecoverWhenOverdraft: node.body.value.action.canRecoverWhenOverdraft,
        },
      },
    ];
  }
  if (node.body.value.family === 'battleDetailRecord') {
    return [{ kind: 'recordPerfectDodge', parameters: {} }];
  }
  if (node.body.value.family === 'finisherSpGain') {
    const action = node.body.value.action;
    const targetIsProvenEnemy =
      (action.target.targetSource === 'Target' && context.actionTargetTarget === 'enemy') ||
      (action.target.targetSource === 'Context' &&
        action.target.targetGroupKey.length > 0 &&
        context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true);
    if (
      action.source.targetSource !== 'Source' ||
      action.source.targetGroupKey !== '' ||
      context.actionSourceTarget !== 'caster' ||
      !targetIsProvenEnemy
    ) {
      throw new Error(`${node.sourcePath}: unsupported breaking-attack ATB source/target`);
    }
    if (action.factor.blackboardKey !== null || action.factor.levelValues !== null) {
      throw new Error(
        `${node.sourcePath}.factor: dynamic breaking-attack ATB factor is unsupported`,
      );
    }
    return [
      {
        kind: 'gainFinisherSp',
        parameters: { factor: action.factor.value, recipient: 'team' },
      },
    ];
  }
  if (node.body.value.family === 'globalCooldown') {
    const action = node.body.value.action;
    const target = projectGlobalCooldownTarget(action.target, context, node.sourcePath);
    if (action.buffId.length === 0) {
      throw new Error(`${node.sourcePath}: unsupported global cooldown application target`);
    }
    return [
      {
        kind: 'setGlobalCooldown',
        parameters: {
          target,
          markerId: action.buffId,
          durationSeconds: actionValueOperand(action.duration),
        },
      },
    ];
  }
  if (node.body.value.family === 'timedMarker') {
    const action = node.body.value.action;
    if (
      context.restrictEventSourceTargetProjection === true &&
      action.target.targetSource === 'Target'
    )
      throw new Error(`${node.sourcePath}: unaudited receiving Buff event marker target`);
    if (action.marker.blackboardKey === null && action.marker.value.length === 0)
      throw new Error(`${node.sourcePath}: empty timed marker ID`);
    return [
      {
        kind: 'createTimedMarker',
        parameters: {
          targets: projectActionTargetQuery(action.target, context, node.sourcePath),
          markerId:
            action.marker.blackboardKey === null
              ? action.marker.value
              : { blackboardKey: action.marker.blackboardKey },
          durationSeconds: actionValueOperand(action.duration),
          autoFinishByAction: action.autoFinishByAction,
          timeDomain: action.useTimeDilationDeltaTime ? 'self' : 'globalScaled',
        },
      },
    ];
  }
  if (node.body.value.family === 'presentation') {
    const action = node.body.value.action;
    if (action.kind === 'passiveUiValue') {
      if (
        action.target === undefined ||
        action.value === undefined ||
        !(
          (action.target.targetSource === 'Owner' || action.target.targetSource === 'Source') &&
          action.target.targetGroupKey === '' &&
          action.target.finderType === null &&
          action.target.validatorTypes.length === 0 &&
          action.target.postProcessorTypes.length === 0
        )
      ) {
        throw new Error(`${node.sourcePath}: unsupported character passive UI target`);
      }
      // 原生 Source 与 Owner 是两个独立身份；实体子技能可通知来源干员的 HUD。
      const targetBinding =
        action.target.targetSource === 'Source'
          ? context.actionSourceTarget
          : requireActionOwnerProjection(context, node.sourcePath);
      const target =
        targetBinding === 'caster' ||
        (targetBinding === 'buffOwner' && context.fixedBuffOwnerTarget === 'caster')
          ? ('caster' as const)
          : null;
      if (target === null) {
        throw new Error(`${node.sourcePath}: character passive UI target is not a proven operator`);
      }
      return [
        {
          kind: 'setCharacterPassiveUiValue',
          parameters: { target, value: actionValueOperand(action.value) },
        },
      ];
    }
    if (action.kind === 'skillTypeMutation') {
      const compile = extensions.compileSkillTypeMutation;
      if (compile === undefined) throw new Error(`${node.sourcePath}: missing SkillType compiler`);
      return [...compile(action as SkillTypeMutationActionSource, node.sourcePath, context)];
    }
    return [];
  }
  if (node.body.value.family === 'presentationCalculation') return [];
  if (node.body.value.family === 'directionAngle') {
    const action = node.body.value.action;
    return [
      {
        kind: 'saveTwoDirectionAngle',
        parameters: {
          ...(action.clampToXZ === undefined ? {} : { clampToXZ: action.clampToXZ }),
          direction1Source: projectActionTargetQuery(
            action.direction1Source,
            context,
            `${node.sourcePath}.dir1Source`,
          ),
          direction1Target: projectActionTargetQuery(
            action.direction1Target,
            context,
            `${node.sourcePath}.dir1Target`,
          ),
          direction1Type: action.direction1Type,
          direction2Source: projectActionTargetQuery(
            action.direction2Source,
            context,
            `${node.sourcePath}.dir2Source`,
          ),
          direction2Target: projectActionTargetQuery(
            action.direction2Target,
            context,
            `${node.sourcePath}.dir2Target`,
          ),
          direction2Type: action.direction2Type,
          outputKey: action.outputKey,
        },
      },
    ];
  }
  if (node.body.value.family === 'randomBlackboard') {
    if (context.combatInvisibleRandomBlackboardKeys?.has(node.body.value.action.targetKey))
      return [];
    const action = node.body.value.action;
    if (action.randomType === 'Int')
      return [
        {
          kind: 'storeRandomInteger',
          parameters: {
            key: action.targetKey,
            minimum: actionValueOperand(action.minimum),
            maximum: actionValueOperand(action.maximum),
          },
        },
      ];
    throw new Error(`${node.sourcePath}: unsupported combat-visible RandomAction`);
  }
  if (node.body.value.family === 'environment') return [];
  if (
    node.body.value.family === 'spatial' &&
    node.body.value.action.kind === 'additionalBattleShape'
  ) {
    const action = node.body.value.action;
    if (
      !(
        (action.target.targetSource === 'Source' && context.actionSourceTarget === 'caster') ||
        (action.target.targetSource === 'Owner' &&
          context.actionOwnerTarget === 'buffOwner' &&
          (context.fixedBuffOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'enemy'))
      ) ||
      action.target.targetGroupKey !== '' ||
      action.target.finderType !== null ||
      action.target.validatorTypes.length !== 0 ||
      action.target.postProcessorTypes.length !== 0 ||
      !action.releaseByAction ||
      action.durationSeconds !== 0 ||
      !action.followTargetPosition
    ) {
      throw new Error(`${node.sourcePath}: unsupported additional battle shape projection`);
    }
    // 原生只注册额外战斗碰撞形状；固定模型中范围恒覆盖、木桩唯一且敌人不主动攻击，
    // 因而该形状不改变伤害、资源、Buff 或技能时钟。动态形状键仍由来源层完整保留。
    return [];
  }
  if (node.body.value.family === 'spatial' && node.body.value.action.kind === 'boneAttach') {
    const action = node.body.value.action;
    const targetIsProvenEnemy =
      isPlainTargetReference(action.target, 'Target', action.target.targetGroupKey) &&
      ((action.target.targetGroupKey === '' && context.actionTargetTarget === 'enemy') ||
        (action.target.targetGroupKey !== '' &&
          context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true));
    if (!targetIsProvenEnemy)
      throw new Error(`${node.sourcePath}: unsupported BoneAttach target projection`);
    // BoneAttach 只接管目标移动/旋转，临时添加 BeCaught、Undeadable
    // 与地图传送限制，并在结束时恢复。固定敌人是不会死亡或主动移动的唯一木桩，
    // 所有距离又归零；这些状态不会改变对敌伤害、Buff、资源或技能时间轴。
    return [];
  }
  // Endaxis 的固定木桩空间模型中朝向不改变目标集合或数值；来源层仍完整保留动作载荷。
  if (node.body.value.family === 'spatial') return [];
  // 木桩不会主动攻击玩家；霸体只影响受击控制，暂不进入可见伤害/资源账本。
  if (node.body.value.family === 'selfDefense') return [];
  if (node.body.value.family === 'projectileControl') {
    const action = node.body.value.action;
    if (
      !isPlainTargetReference(action.clearSource, 'Owner', '') ||
      action.playFinishEffect ||
      action.finishAction !== 'NotCastSkill'
    ) {
      throw new Error(`${node.sourcePath}: unsupported clear projectile projection`);
    }
    // 固定木桩投影只接受能同步完成回调的零距离投射物，不保留跨帧飞行实例；因此清理由
    // 当前施法者拥有、且不会在结束时施放技能的投射物，不会再改变伤害、Buff 或资源账本。
    // 范围和 ID 筛选仍由来源层完整保留；出现结束回调时必须显式建模，不能走此省略路径。
    return [];
  }
  if (node.body.value.family === 'animationTiming') {
    const action = node.body.value.action;
    if (
      action.kind === 'targetAnimationTimeScale' &&
      !isPlainTargetReference(action.target, 'Owner', '')
    ) {
      throw new Error(
        `${node.sourcePath}: animation component scale requires a plain Owner target`,
      );
    }

    if (context.enabledAnimationEventListenerPresent !== false) {
      throw new Error(
        `${node.sourcePath}: animation time scale may affect enabled animation-event combat callbacks`,
      );
    }
    // 两种动画倍率动作只维护动画组件句柄。完整宿主图已证明
    // 没有动画事件驱动的战斗回调后，按现有非渲染后端省略；不能据此暂停技能或 Buff 时钟。
    return [];
  }
  if (node.body.value.family === 'animationEventListener') {
    if (!isPresentationOnlyActionSequence(node.body.value.action.actionOnEvent)) {
      throw new Error(`${node.sourcePath}: unsupported combat animation-event listener`);
    }
    // 动画事件只触发严格证明为纯表现的回调时，不进入木桩战斗时间线。
    return [];
  }
  if (node.body.value.family === 'inputControl') {
    const action = node.body.value.action;
    if (action.kind === 'markCanDash') {
      return [{ kind: 'markCurrentSkillCanDash', parameters: {} }];
    }
    if (action.kind === 'markCanInterrupt') {
      return [{ kind: 'markCurrentSkillCanInterrupt', parameters: {} }];
    }
    if (action.kind === 'overrideMultiDashLimit') {
      if (
        !isPlainTargetReference(action.target, 'Owner', '') ||
        context.fixedBuffOwnerTarget !== 'caster'
      ) {
        throw new Error(`${node.sourcePath}: multi-dash limit requires an operator Buff owner`);
      }
      return [
        {
          kind: 'overrideMultiDashLimit',
          parameters: { dashCount: actionValueOperand(action.dashCount) },
        },
      ];
    }
    // AllowNextSkillAction 的条件分支必须进入运行时，才能让实际走到的有序下一段
    // 窗口决定技能块边界。没有有序下一段身份的技能会忽略这条轻量事实。
    if (action.kind === 'allowNextSkill' && context.preserveSkillOperableBoundary === true) {
      return [
        {
          kind: 'reachSkillOperableBoundary',
          parameters: { skillIds: action.skillIds },
        },
      ];
    }
    // Buff 映射必须随动作注册，不能静默丢弃。
    if (action.kind !== 'comboCache' || context.actionOwnerTarget !== 'buffOwner') return [];
    const mappings = action.mappings.filter(mapping => mapping.commandType === 'Attack');
    if (mappings.length === 0) return [];
    if (context.fixedBuffOwnerTarget !== 'caster') {
      throw new Error(`${node.sourcePath}: Buff command mapping requires an operator owner`);
    }
    if (mappings.some(mapping => !mapping.cacheEndByAction || mapping.skillId.length === 0)) {
      throw new Error(
        `${node.sourcePath}: unsupported Buff command mapping lifetime or empty target`,
      );
    }
    return [
      {
        kind: 'overrideBasicAttackMapping',
        parameters: { skillIds: mappings.map(mapping => mapping.skillId) },
      },
    ];
  }
  if (node.body.value.family === 'comboPending') {
    const action = node.body.value.action;
    const ownerIsFixedCaster =
      (isPlainTargetReference(action.owner, 'Owner', '') &&
        (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')) ||
      (isPlainTargetReference(action.owner, 'Source', '') &&
        context.fixedBuffSourceTarget === 'caster');
    const targetIsFixedEnemy =
      isMainEnemySearch(action.target) ||
      (isPlainTargetReference(action.target, 'Owner', '') &&
        context.fixedBuffOwnerTarget === 'enemy') ||
      (action.target.targetSource === 'Context' &&
        action.target.targetGroupKey !== '' &&
        context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey) === true);
    if (
      action.needTrigger ||
      action.assignmentCount !== 0 ||
      (!isPlainTargetReference(action.owner, 'Context', 'seraph') && !ownerIsFixedCaster) ||
      !targetIsFixedEnemy
    ) {
      throw new Error(`${node.sourcePath}: unsupported combo Pending projection`);
    }
    // needTrigger=false 时原生传空触发句柄，不读取序列化 trigger。
    // 该动作只开启候选，不代替玩家施法；实际技能身份在执行时读取 owner 当前连携槽。
    return [
      {
        kind: 'openComboWindow',
        parameters: {
          nextSkillKeyFromSlot: 'comboSkill',
          ...(action.owner.targetSource === 'Context'
            ? { ownerContextKey: action.owner.targetGroupKey }
            : {}),
        },
      },
    ];
  }
  // 技能内施法限制由现实时间轴的技能占用区间覆盖；原生载荷仍在来源层严格解析。
  if (node.body.value.family === 'castingControl') return [];
  // 单技能编译不知道原生 skillId 对应哪个产品技能组；整名生成器必须提供稳定身份映射。
  // Buff 顶层换槽仍由 Buff 定义装配器单独处理，故无扩展时保持来源审计但不重复执行。
  if (node.body.value.family === 'skillSlotReplacement') return [];
  if (node.body.value.family === 'skillCastInheritance') {
    return [{ kind: 'inheritSkillCastInfoForBasicAttack', parameters: {} }];
  }
  if (node.body.value.family === 'typhoeaArcherySelection') {
    const action = node.body.value.action;
    if (
      action.targetCount.blackboardKey !== null ||
      action.targetCount.value < 1 ||
      action.markBuffId.length === 0
    ) {
      throw new Error(`${node.sourcePath}: unsupported Typhoea target selection count or mark`);
    }
    // 原生动作把屏幕区域、距离和优先级选择注册到 BattleManager，并用 markBuff 维护
    // 被选中的敌人列表。这个标记只是目标选择的实现细节；固定单敌人模型中没有第二个
    // 候选目标，也没有空间筛选，因此它既不改变战斗结果，也不应伪装成可见战斗 Buff。
    return [];
  }
  if (node.body.value.family === 'incomingDamageDefense') {
    const action = node.body.value.action;
    if (
      action.kind !== 'damageTagImmunity' ||
      action.target.targetSource !== 'Owner' ||
      action.target.targetGroupKey !== '' ||
      context.actionOwnerTarget !== 'buffOwner' ||
      context.fixedBuffOwnerTarget !== 'caster'
    ) {
      throw new Error(
        `${node.sourcePath}: incoming-damage immunity target is not a caster Buff owner`,
      );
    }
    // Endaxis 的固定木桩不会主动攻击干员；该规则只过滤宿主收到的伤害，不能改变宿主
    // 对木桩输出的 DamagePack。仍严格解析目标和查询，防止敌方免疫被误删。
    return [];
  }
  throw new Error(`${node.sourcePath}: unsupported Buff runtime action`);
}

function isInFightEnemyInstantSearch(target: TargetReferenceSource): boolean {
  return (
    target.finderType === 'InFightEnemyFinder' &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

function isPlainTargetReference(
  target: TargetReferenceSource,
  targetSource: string,
  targetGroupKey: string,
): boolean {
  return (
    target.targetSource === targetSource &&
    target.targetGroupKey === targetGroupKey &&
    target.selectorOwner === 'ActionOwner' &&
    target.ownerContextKey === '' &&
    target.centerType === 'ActionSource' &&
    target.centerContextKey === '' &&
    !target.centerToGround &&
    target.target === 'ActionSource' &&
    target.targetContextKey === '' &&
    !target.enableAdvancedDirection &&
    target.selectorDirection === 'SourceForward' &&
    target.finderType === null &&
    target.finderShape === null &&
    target.finderOwnerPartsQuery === null &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0 &&
    target.priorityFilters.length === 0 &&
    target.shuffleTargets.length === 0 &&
    target.distanceValidators.length === 0 &&
    target.finderSpawnedObjectType === null &&
    target.validatorTagQueries.length === 0
  );
}

function isMainEnemySearch(target: TargetReferenceSource): boolean {
  return isUniqueEnemyMainTargetInstantSearch(target);
}

function isProvenSpatialMeasurementEndpoint(
  target: TargetReferenceSource,
  targetGroups: ReadonlyMap<string, ProjectedTargetGroup>,
  context: CombatActionProjectionContextSource,
): boolean {
  if (target.targetSource === 'Owner' && target.targetGroupKey === '')
    return context.actionOwnerTarget !== 'unavailable';
  if (target.targetSource === 'Source' && target.targetGroupKey === '') return true;
  // 主控始终取当前队伍的主控实体；固定模型中它与其余实体共处零空间。
  // 直接身份分支不读取残留的 Context 键。
  if (target.targetSource === 'MainCharacter') return true;
  // GetTargetsView 的 Target 分支直接读取输入目标；序列化残留 group key 不参与寻址。
  if (target.targetSource === 'Target') return true;
  if (target.targetSource === 'InstantSearch' && target.finderType !== null) {
    // 项目模型把所有已解析范围查找视为能找到其场景实例，并把任意两端距离统一为 0。
    // 这里只承认载荷内联携带的真实 finder；命名 Context 仍必须由前序写入证明。
    return true;
  }
  if (target.targetSource === 'Context' && target.targetGroupKey !== '')
    // 零空间模型把实体间、实体到点及点到点距离统一投影为 0；但 Context 身份仍须
    // 由先前目标组写入证明，不能凭非空字符串臆造端点。
    return (
      targetGroups.has(target.targetGroupKey) ||
      context.guaranteedSingletonZeroSpaceTargetGroupKeys?.has(target.targetGroupKey) === true ||
      context.staticEnemyTargetGroupKeys?.has(target.targetGroupKey) === true ||
      context.staticZeroSpaceTargetGroupKeys?.has(target.targetGroupKey) === true
    );
  return false;
}

/** 命名组到施加目标的显式归属；新增组必须决定是否可直接作为 Buff 接收者。 */
function projectBuffApplicationTargetGroup(
  group: ProjectedTargetGroup,
): BuffApplicationTarget | null {
  switch (group) {
    case 'party':
    case 'partyExceptCaster':
    case 'controlledOperator':
    case 'casterAndControlledOperator':
    case 'casterAndLowestHealthRatioOperatorExceptCaster':
    case 'enemy':
      return group;
    case 'abilityEntity':
      return 'currentAbilityEntity';
    case 'sourceFinderResult':
    case 'runtimeTargets':
      return 'currentTarget';
    case 'dynamicEnemy':
      // 仅用于 Buff 闭包推断宿主种类，不代表集合非空，也不替代运行时 Context 查询。
      return 'enemy';
    case 'contextOperator':
    case 'lowestHealthRatioOperatorExceptCaster':
    case 'empty':
    case 'spatialPoint':
    case 'godEntity':
      return null;
    default: {
      const exhaustive: never = group;
      throw new Error(`unclassified Buff target group ${exhaustive}`);
    }
  }
}

function compileBuffApplication(
  action: BuffApplicationActionSource,
  visualOnlyIds: ReadonlySet<string>,
  sourcePath: string,
  partyTargetGroups: ReadonlyMap<string, ProjectedTargetGroup> = new Map(),
  context: CombatActionProjectionContextSource,
): CompiledBuffStepSource[] {
  const contextTargetGroupKey = action.target.targetGroupKey ?? '';
  const contextTargetGroup = partyTargetGroups.get(contextTargetGroupKey);
  const projectedContextTarget =
    contextTargetGroup === undefined ? null : projectBuffApplicationTargetGroup(contextTargetGroup);
  const targetsQueriedSource =
    action.target.targetSource === 'Context' && contextTargetGroup === 'sourceFinderResult';
  for (const entry of action.buffs) {
    if (entry.readIdFromBlackboard ? entry.buffIdKey.length === 0 : entry.buffId.length === 0)
      throw new Error(`${sourcePath}: Buff identity or blackboard key is empty`);
  }
  // 纯表现子 Buff 的动作生命周期只持有并清理表现资源；来源已完整解析后可从无渲染后端省略。
  const isPresentationOnlyEntry = (entry: (typeof action.buffs)[number]) =>
    entry.readIdFromBlackboard
      ? context.combatInvisibleDynamicBuffBlackboardKeys?.has(entry.buffIdKey) === true
      : visualOnlyIds.has(entry.buffId);
  if (action.buffs.every(isPresentationOnlyEntry)) return [];
  if (
    context.restrictEventSourceTargetProjection === true &&
    !['Source', 'Owner', 'Target'].includes(action.target.targetSource) &&
    !(
      action.target.targetSource === 'Context' &&
      partyTargetGroups.get(action.target.targetGroupKey ?? '') === 'abilityEntity'
    )
  )
    throw new Error(`${sourcePath}: unaudited receiving Buff event target`);
  if (
    action.overrideBuffIconDuration &&
    !(
      context.actionOwnerTarget === 'currentAbilityEntity' &&
      action.buffIconDuration.durationSourceType === 'AbilityEntity' &&
      action.buffIconDuration.timedMarkerId === ''
    )
  ) {
    throw new Error(`${sourcePath}: unsupported CreateBuff icon duration source`);
  }
  // AbilityEntity 来源只覆盖 Buff 图标的倒计时显示，不改变 Buff 自身时钟或数值生命周期，
  // 因而战斗 DSL 仍保留真实 Buff。时间轴目前按实例寿命绘制，尚不能单独显示这层图标倒计时；
  // 其余来源继续拒绝，避免把 TimedMarker 或独立宿主的显示时长误当成无效果字段。
  if (
    action.inheritSkillIds.length > 0 &&
    (!action.autoFinishByAction || !action.finishWithNextSkillIfNotInherited)
  ) {
    throw new Error(`${sourcePath}: unsupported CreateBuff inheritance policy`);
  }
  // CreateBuffAction 的 inheritSourceSkillCastId 不被原生 ExecuteInternal 读取；
  // 实际施放信息继承只由 inheritSourceSkillCastInfo 控制。
  const target: BuffApplicationTarget | null = targetsQueriedSource
    ? 'currentTarget'
    : isControlledOperatorInstantSearch(action.target)
      ? 'controlledOperator'
      : action.target.targetSource === 'Owner'
        ? requireActionOwnerProjection(context, sourcePath)
        : action.target.targetSource === 'Source'
          ? context.fixedBuffSourceTarget !== undefined
            ? 'buffSource'
            : context.actionSourceTarget === 'buffSource'
              ? 'buffSource'
              : 'caster'
          : action.target.targetSource === 'Target'
            ? context.actionTargetTarget === 'currentOperator'
              ? ('currentTarget' as const)
              : context.actionTargetTarget
            : action.target.targetSource === 'Context' && projectedContextTarget !== null
              ? projectedContextTarget
              : action.target.targetSource === 'Context' &&
                  context.staticEnemyTargetGroupKeys?.has(action.target.targetGroupKey ?? '') ===
                    true
                ? ('enemy' as const)
                : action.target.targetSource === 'Context' &&
                    contextTargetGroupKey !== '' &&
                    contextTargetGroup === undefined
                  ? ('currentTarget' as const)
                  : action.target.targetSource === 'MainCharacter' &&
                      action.target.finderType === null &&
                      action.target.validatorTypes.length === 0 &&
                      action.target.postProcessorTypes.length === 0
                    ? ('controlledOperator' as const)
                    : isUniqueEnemyMainTargetInstantSearch(action.target)
                      ? ('enemy' as const)
                      : isUniqueEnemyHitBoxInstantSearch(action.target)
                        ? ('enemy' as const)
                        : isPartyExceptOwnerInstantSearch(action.target)
                          ? ('partyExceptCaster' as const)
                          : isPartyInstantSearch(action.target)
                            ? ('party' as const)
                            : null;
  // 此值只供 Buff 闭包推断宿主种类；unknown 不能变成默认干员来源。
  // 实际来源始终由下面的 ActionTargetQuery 在执行时解析。
  const source: BuffApplicationSource | 'unknown' | undefined | null =
    action.buffSource === 'ActionOwner'
      ? context.actionOwnerTarget === 'unavailable'
        ? null
        : context.actionOwnerTarget === 'currentAbilityEntity'
          ? 'currentAbilityEntity'
          : context.actionOwnerTarget === 'buffOwner' ||
              context.actionSourceTarget === 'buffSource' ||
              context.actionTargetTarget === 'buffOwner'
            ? 'buffOwner'
            : undefined
      : action.buffSource === 'ActionSource'
        ? context.fixedBuffSourceTarget !== undefined
          ? 'buffSource'
          : context.actionSourceTarget === 'buffSource'
            ? 'buffSource'
            : undefined
        : action.buffSource === 'ContextTarget' &&
            context.staticEnemyTargetGroupKeys?.has(action.contextKey) === true
          ? 'enemy'
          : action.buffSource === 'ContextTarget' &&
              partyTargetGroups.get(action.contextKey) === 'abilityEntity'
            ? 'currentAbilityEntity'
            : action.buffSource === 'ContextTarget' &&
                partyTargetGroups.get(action.contextKey) === 'dynamicEnemy'
              ? 'enemy'
              : action.buffSource === 'ContextTarget' &&
                  action.contextKey !== '' &&
                  partyTargetGroups.get(action.contextKey) === 'sourceFinderResult'
                ? undefined
                : action.buffSource === 'ContextTarget' && action.contextKey !== ''
                  ? 'unknown'
                  : action.buffSource === 'InputTarget'
                    ? context.actionTargetTarget === 'enemy'
                      ? 'enemy'
                      : 'unknown'
                    : null;
  if (target === null || source === null)
    throw new Error(
      `${sourcePath}: unsupported Buff target/source ${JSON.stringify({
        target: action.target.targetSource,
        targetGroup: contextTargetGroupKey,
        targetKind: contextTargetGroup,
        source: action.buffSource,
        sourceGroup: action.contextKey,
        sourceKind: partyTargetGroups.get(action.contextKey),
      })}`,
    );
  const buffs = action.buffs.flatMap((entry, index) => {
    if (isPresentationOnlyEntry(entry)) return [];
    const assignments = entry.assignBlackboard
      ? projectDirectNumericBuffAssignments(entry.assignments, `${sourcePath}.buffs[${index}]`)
      : {};
    const stringAssignments = entry.assignBlackboard
      ? projectStringBuffAssignments(entry.assignments)
      : {};
    const copiedAssignments = entry.assignBlackboard
      ? projectCopiedBuffAssignments(entry.assignments)
      : {};
    return [
      {
        buffId: entry.readIdFromBlackboard ? { blackboardKey: entry.buffIdKey } : entry.buffId,
        ...(Object.keys(assignments).length === 0 ? {} : { blackboardAssignments: assignments }),
        ...(Object.keys(stringAssignments).length === 0
          ? {}
          : { stringBlackboardAssignments: stringAssignments }),
        ...(Object.keys(copiedAssignments).length === 0
          ? {}
          : { copiedBlackboardAssignments: copiedAssignments }),
      },
    ];
  });
  if (buffs.length === 0) return [];
  const steps: CompiledBuffStepSource[] = [
    {
      kind: 'applyBuff',
      parameters: {
        buffs,
        targets: projectActionTargetQuery(action.target, context, `${sourcePath}.target`),
        source:
          action.buffSource === 'ActionOwner'
            ? { kind: 'owner' }
            : action.buffSource === 'ActionSource'
              ? { kind: 'source' }
              : action.buffSource === 'ContextTarget'
                ? context.staticEnemyTargetGroupKeys?.has(action.contextKey)
                  ? { kind: 'fixed', target: 'enemy' }
                  : { kind: 'context', key: action.contextKey }
                : context.actionTargetTarget === 'enemy' || context.actionTargetTarget === 'caster'
                  ? { kind: 'fixed', target: context.actionTargetTarget }
                  : { kind: 'inputTarget' },
        [COMPILED_BUFF_TARGET_KINDS]: { target, source },
        ...(action.count.blackboardKey === null && action.count.value === 1
          ? {}
          : { count: actionValueOperand(action.count) }),
        ...(action.inheritSourceSkillCastInfo ? { inheritSourceSkillCastInfo: true } : {}),
        ...(action.isExtra ? { isExtra: true } : {}),
        ...(action.overrideBuffIconDuration
          ? { iconDurationSource: { kind: 'actionOwnerAbilityEntity' as const } }
          : {}),
        ...(action.autoFinishByAction ? { finishByAction: true } : {}),
        ...(action.inheritSkillIds.length === 0
          ? {}
          : { inheritToNextSkillIds: action.inheritSkillIds }),
        ...(action.asChildBuff ? { asChildBuff: true } : {}),
        ...(action.passTargetGroupsToBuff
          ? {
              [COMPILED_BUFF_CAPTURED_TARGET_GROUPS]: {
                enemyKeys: [...(context.staticEnemyTargetGroupKeys ?? [])].sort(),
                zeroSpaceKeys: [...(context.staticZeroSpaceTargetGroupKeys ?? [])]
                  .filter(key => context.staticEnemyTargetGroupKeys?.has(key) !== true)
                  .sort(),
              },
            }
          : {}),
        ...(action.lifetimeOwner === 'currentCastSkill'
          ? { lifetimeOwner: action.lifetimeOwner }
          : {}),
      },
    },
  ];
  return steps;
}

const ACTION_VALUE_OPERATIONS: Readonly<
  Record<string, 'assign' | 'add' | 'multiply' | 'divide' | 'floor' | 'ceil' | 'roundToInt'>
> = {
  Assign: 'assign',
  Add: 'add',
  Multiply: 'multiply',
  Divide: 'divide',
  Floor: 'floor',
  Ceil: 'ceil',
  RoundToInt: 'roundToInt',
};
/** 光环参数与原生回调分开投影；回调由序列编译器保留为入口。 */
export function projectAuraParameters(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  visualOnlyIds: ReadonlySet<string>,
  context: CombatActionProjectionContextSource,
): Extract<CompiledBuffStepSource, { kind: 'aura' }>['parameters'] {
  if (node.body.kind !== 'leaf' || node.body.value.family !== 'aura')
    throw new Error('expected Aura');
  const aura = node.body.value.action;
  if (aura.kind !== 'globalPartyAura') {
    throw new Error(`${node.sourcePath}: Aura reference slice cannot enter runtime projection`);
  }
  // 原生排除当前动作 Owner；能力实体不是队员，不能沿 Source 排除其来源干员。
  const ownerTarget =
    context.actionOwnerTarget === 'buffOwner'
      ? (context.fixedBuffOwnerTarget ?? 'buffOwner')
      : context.actionOwnerTarget;
  const sourceKind = aura.buffSource === 'ActionOwner' ? 'owner' : 'source';
  const sourceTarget = sourceKind === 'owner' ? ownerTarget : context.actionSourceTarget;
  const iconDurationSource =
    aura.iconDurationOverride === undefined
      ? undefined
      : context.actionOwnerTarget !== 'currentAbilityEntity'
        ? (() => {
            throw new Error(
              `${node.sourcePath}: Aura icon duration source requires an AbilityEntity action owner`,
            );
          })()
        : aura.iconDurationOverride.durationSourceType === 'AbilityEntity'
          ? ({ kind: 'actionOwnerAbilityEntity' } as const)
          : ({
              kind: 'actionOwnerTimedMarker',
              markerId: aura.iconDurationOverride.timedMarkerId,
            } as const);

  return {
    targets:
      aura.target === 'enemy'
        ? { kind: 'fixed', target: 'enemy' }
        : { kind: 'characterTeam', excludeOwner: aura.target === 'partyExceptOwner' },
    source: { kind: sourceKind },
    [COMPILED_BUFF_TARGET_KINDS]: {
      target: aura.target === 'enemy' ? 'enemy' : 'caster',
      source: sourceTarget === 'caster' ? undefined : sourceTarget,
    },
    ...(iconDurationSource === undefined ? {} : { iconDurationSource }),
    inheritSourceSkillCastInfo: aura.inheritSourceSkillCastInfo,
    buffs: aura.buffs
      .filter(entry => !visualOnlyIds.has(entry.buffId))
      .map((entry, index) => ({
        buffId: entry.buffId,
        ...(entry.assignBlackboard
          ? {
              blackboardAssignments: projectBuffAssignments(
                entry.assignments,
                `${node.sourcePath}.buffInput[${index}]`,
              ),
              stringBlackboardAssignments: projectStringBuffAssignments(entry.assignments),
            }
          : {}),
      })),
  };
}
