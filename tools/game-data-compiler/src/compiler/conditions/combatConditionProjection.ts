import { projectGameplayTags } from '../combatProjectionCommon.ts';
import { projectSpGainKind, projectSpGainSource } from '../../source/spGainEnums.ts';
import { projectGlobalCooldownTarget } from '../actions/globalCooldownProjection.ts';
import { NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY } from '../../../../../packages/game-data-contract/src/conditions.ts';
import type { NativeActionNodeSource } from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { NativeConditionSource } from '../../source/condition.ts';
import { projectObjectTypeSelection } from '../../source/objectType.ts';
import type { CompiledBuffConditionSource } from '../actions/combatActionProjectionTypes.ts';
import {
  type ProjectedTargetGroup,
  type CombatActionProjectionContextSource,
  requireActionOwnerProjection,
  actionValueOperand,
  DAMAGE_TYPES,
  COMPARISON_OPERATORS,
} from '../combatProjectionCommon.ts';
import { compileTargetReferenceAbilityEntityQuerySource } from '../abilities/abilityEntityQuery.ts';

/** 原生条件到公共条件子集的投影，并明确条件写黑板的副作用。
 * 不编排分支或执行动作；未知宿主和条件仍在原来的边界阻断。 */

export function compileEventCondition(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  context: CombatActionProjectionContextSource,
  targetGroups: ReadonlyMap<string, ProjectedTargetGroup>,
): CompiledBuffConditionSource | null {
  // 原生 IfElse 的返回值为 alwaysNext || 分支结果。空分支且条件无副作用时，
  // 它即使位于另一层 conditionAction 中也是恒真；不等于把内部空间条件判成恒真。
  if (isPureEmptyContinuingBranch(node)) return { kind: 'constant', value: true };
  if (node.body.kind !== 'leaf' || node.body.value.family !== 'condition') return null;
  return compileConditionLeaf(node.body.value.action, node.sourcePath, context, targetGroups);
}

/** 只证明条件求值没有可见副作用，不要求其空间/相机输入已经具备 Next 运行模型。 */
export function canOmitUnusedNativeCondition(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): boolean {
  if (isPureEmptyContinuingBranch(node)) return true;
  if (node.body.kind !== 'leaf' || node.body.value.family !== 'condition') return false;
  const condition = node.body.value.action;
  if (condition.kind === 'entityCount') return condition.storeKey === '';
  return [
    'mainOperator',
    'twoDirectionAngle',
    'targetAngle',
    'distance',
    'floatCompare',
    'comboCameraAlphaSetting',
    'skillCameraMotionFree',
    'moveInput',
    'targetContains',
    'targetInScreen',
    'perfectDodgeDirection',
  ].includes(condition.kind);
}

/** 只处理源树已无有效分支动作的窄结构，不执行跨组件活性优化。 */
function isPureEmptyContinuingBranch(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
): boolean {
  const body = node.body;
  return (
    body.kind === 'ifElse' &&
    body.alwaysNext &&
    body.whenTrue.actions.every(child => !child.metadata.enabled) &&
    body.whenFalse.actions.every(child => !child.metadata.enabled) &&
    body.condition.actions.every(
      child => !child.metadata.enabled || canOmitUnusedNativeCondition(child),
    )
  );
}

/** 条件也可能写黑板；即便没有后继步骤，写入及其前置守卫也不能消去。 */
export function canOmitUnusedCompiledCondition(condition: CompiledBuffConditionSource): boolean {
  if (condition.kind === 'probability') return false; // 抽样会推进随机流。
  if (condition.kind === 'all' || condition.kind === 'any')
    return condition.conditions.every(canOmitUnusedCompiledCondition);
  if (condition.kind === 'not') return canOmitUnusedCompiledCondition(condition.condition);
  return !conditionWritesBlackboard(condition);
}

export function conditionWritesBlackboard(condition: CompiledBuffConditionSource): boolean {
  if (condition.kind === 'all' || condition.kind === 'any')
    return condition.conditions.some(conditionWritesBlackboard);
  if (condition.kind === 'not') return conditionWritesBlackboard(condition.condition);
  return (
    ('outputKey' in condition && condition.outputKey !== undefined) ||
    ('buffIdOutputKey' in condition && condition.buffIdOutputKey !== undefined) ||
    (condition.kind === 'eventOverheal' &&
      [condition.overHealKey, condition.finalHealKey, condition.realHealKey].some(
        key => key !== undefined,
      ))
  );
}

function compileConditionLeaf(
  condition: NativeConditionSource,
  sourcePath: string,
  context: CombatActionProjectionContextSource,
  targetGroups: ReadonlyMap<string, ProjectedTargetGroup> = new Map(),
): CompiledBuffConditionSource {
  if (condition.kind === 'constant') return { kind: 'constant', value: condition.value };
  if (condition.kind === 'damageIgnoreImmuneLevel') {
    // 当前模拟器唯一的玩家受击入口是用户声明的外部命中，免疫忽略等级固定为原生 Default(0)。
    // 只接受公共闪避监听器的“0 <= 0”形状；其他比较必须等载荷显式携带该字段后再投影。
    if (condition.comparison !== 'LE' || condition.level !== 0)
      throw new Error(`${sourcePath}: unsupported damage ignore-immune-level comparison`);
    return { kind: 'constant', value: true };
  }
  if (condition.kind === 'projectilePerfectDodgeCooldown') {
    if (context.nativeAbilityEvent !== 'OnBeforeHitByProjectile') {
      throw new Error(`${sourcePath}: projectile cooldown check requires OnBeforeHitByProjectile`);
    }
    return {
      kind: 'eventProjectilePerfectDodgeCooldownEquals',
      value: condition.isInCooldown,
    };
  }
  if (condition.kind === 'projectileIgnoreImmuneLevel') {
    if (context.nativeAbilityEvent !== 'OnBeforeHitByProjectile') {
      throw new Error(
        `${sourcePath}: projectile ignore-immune-level check requires OnBeforeHitByProjectile`,
      );
    }
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) {
      throw new Error(`${sourcePath}: unsupported projectile ignore-immune-level comparison`);
    }
    return {
      kind: 'eventProjectileIgnoreImmuneLevelCompare',
      operator,
      value: condition.level,
    };
  }
  if (condition.kind === 'moveInput') {
    // Endaxis 的技能块没有移动轴输入；未提供输入表示静止。原生条件在零轴时返回 false，
    // 后续 SaveMoveAxisAngle/方向 JumpTo 因 Sequence 短路不可达。若战斗程序仍消费角度，
    // presentationCalculationIsolation 会继续拒绝，而不是伪造一个方向。
    return { kind: 'constant', value: false };
  }
  if (condition.kind === 'skillInterruptReason') {
    if (context.nativeAbilityEvent !== 'OnSkillInterrupted') {
      throw new Error(`${sourcePath}: CheckSkillInterruptReason requires OnSkillInterrupted`);
    }
    const known = new Set(['CastNextSkill']);
    if (condition.reasons.some(reason => !known.has(reason))) {
      throw new Error(`${sourcePath}: unsupported skill interrupt reason`);
    }
    // Next 目前唯一会主动产生的技能中断就是形态/连段转场 CastNextSkill。
    return { kind: 'constant', value: condition.reasons.includes('CastNextSkill') };
  }
  // 主动动作/命中回调没有 Buff 事件环境；只有已验收的条件可使用显式木桩 Target。
  if (
    context.actionTargetTarget === 'enemy' &&
    !(
      context.damageModifierContext &&
      ['damageType', 'damageTypeMask', 'skillCastId'].includes(condition.kind)
    ) &&
    ![
      'floatCompare',
      'buffStack',
      'mainOperator',
      'poise',
      'any',
      'entityCount',
      'squadInFight',
      'probability',
      'distance',
      'health',
      'timedMarker',
      'customAbilityEvent',
      'superArmor',
      // CheckEnemyRank 自身仍须明确读取 plain Target；唯一木桩 Target 足以证明其敌人宿主。
      'enemyRank',
      'entityTag',
      'targetIdentity',
      'targetContains',
      'objectTypeMatch',
      // 条件自身仍严格解析 Owner/Source；动作的敌人 Target 不会改变其宿主。
      'globalCooldown',
      // 只在下方确认属于主动技能时间轴后，读取本次技能实例的命中状态。
      'skillHasHit',
      // OnOutputDamage 的装饰标签来自事件伤害包，不会把固定 enemy Target 当作普通动作输入。
      'damageDecorateMask',
      'damageGameplayTag',
      'originSkillType',
      'profession',
    ].includes(condition.kind)
  )
    throw new Error(`${sourcePath}: unaudited single-enemy action condition ${condition.kind}`);
  if (
    context.actionTargetTarget === 'currentAbilityEntity' &&
    ![
      'floatCompare',
      'buffStack',
      'distance',
      'entityCount',
      'any',
      'entityTag',
      'abilityEntityDuration',
      'health',
    ].includes(condition.kind)
  )
    throw new Error(`${sourcePath}: unaudited AbilityEntity condition ${condition.kind}`);
  if (condition.kind === 'probability') {
    return { kind: 'probability', probability: actionValueOperand(condition.value) };
  }
  if (condition.kind === 'abilityEntityDuration') {
    const targetsCurrentEntity =
      condition.target.targetSource === 'Target' &&
      condition.target.targetGroupKey === '' &&
      context.actionTargetTarget === 'currentAbilityEntity';
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (!targetsCurrentEntity || operator === undefined) {
      throw new Error(`${sourcePath}: unsupported AbilityEntity duration target or comparison`);
    }
    if (condition.saveCurrentDuration !== condition.outputKey.length > 0) {
      throw new Error(`${sourcePath}: inconsistent AbilityEntity duration output configuration`);
    }
    return {
      kind: 'abilityEntityRemainingDurationCompare',
      operator,
      value: actionValueOperand(condition.value),
      ...(condition.saveCurrentDuration ? { outputKey: condition.outputKey } : {}),
    };
  }
  if (condition.kind === 'superArmor') {
    const targetsEnemy =
      (condition.target.targetSource === 'Target' &&
        condition.target.targetGroupKey === '' &&
        (context.actionTargetTarget === 'enemy' ||
          (context.actionTargetTarget === 'buffOwner' &&
            context.fixedBuffOwnerTarget === 'enemy'))) ||
      (condition.target.targetSource === 'Context' &&
        condition.target.targetGroupKey !== '' &&
        context.staticEnemyTargetGroupKeys?.has(condition.target.targetGroupKey) === true) ||
      (condition.target.targetSource === 'Owner' &&
        condition.target.targetGroupKey === '' &&
        context.fixedBuffOwnerTarget === 'enemy');
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (!targetsEnemy || operator === undefined)
      throw new Error(`${sourcePath}: unsupported super-armor target or comparison`);
    return {
      kind: 'enemySuperArmorCompare',
      operator,
      value: actionValueOperand(condition.value),
    };
  }
  if (condition.kind === 'distance') {
    if (
      !condition.lessThan &&
      condition.distance >= 0 &&
      !condition.includeTargetRadius &&
      !condition.containsHittableObject
    ) {
      // 项目模型把任意已解析实体间距离统一为 0；原生目标缺失时条件同样失败。
      // 因而 `distance > 非负阈值` 无论命名 Context 是否为空都恒假，不需要伪造其身份。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 0 },
        operator: 'greater',
        right: { kind: 'constant', value: condition.distance },
      };
    }
    const sourceIsSpatialPoint =
      condition.source.targetSource === 'Context' &&
      targetGroups.get(condition.source.targetGroupKey ?? '') === 'spatialPoint';
    const targetIsSpatialPoint =
      condition.target.targetSource === 'Context' &&
      targetGroups.get(condition.target.targetGroupKey ?? '') === 'spatialPoint';
    const sourceIsCaster =
      condition.source.targetSource === 'Owner' && context.actionOwnerTarget === 'caster';
    const targetIsCaster =
      condition.target.targetSource === 'Owner' && context.actionOwnerTarget === 'caster';
    const sourceIsKnownOwner =
      condition.source.targetSource === 'Owner' && condition.source.targetGroupKey === '';
    const sourceIsMainCharacter =
      condition.source.targetSource === 'MainCharacter' && condition.source.targetGroupKey === '';
    const sourceIsKnownCaster =
      ((condition.source.targetSource === 'Owner' && context.actionOwnerTarget === 'caster') ||
        (condition.source.targetSource === 'Source' && context.actionSourceTarget === 'caster')) &&
      condition.source.targetGroupKey === '';
    const sourceIsFixedCasterBuffSource =
      condition.source.targetSource === 'Source' &&
      condition.source.targetGroupKey === '' &&
      context.fixedBuffSourceTarget === 'caster';
    const targetIsStaticEnemyContext =
      condition.target.targetSource === 'Context' &&
      condition.target.targetGroupKey !== '' &&
      context.staticEnemyTargetGroupKeys?.has(condition.target.targetGroupKey) === true;
    const targetIsAbilityEntityContext =
      condition.target.targetSource === 'Context' &&
      condition.target.targetGroupKey !== '' &&
      targetGroups.get(condition.target.targetGroupKey) === 'abilityEntity';
    if (
      (sourceIsKnownOwner ||
        sourceIsKnownCaster ||
        sourceIsFixedCasterBuffSource ||
        sourceIsMainCharacter) &&
      targetIsStaticEnemyContext &&
      !condition.containsHittableObject
    ) {
      // 主动技能入口已把 smart_target 一类 Context 证明为唯一木桩；项目模型规定任意实例间
      // 距离为零。includeTargetRadius 只会在这个零距离上纳入非负目标半径，不改变正阈值
      // less-or-equal 的投影方式，仍不得借此放开未知 Context 或可破坏物查询。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 0 },
        operator: condition.lessThan ? 'lessOrEqual' : 'greater',
        right: { kind: 'constant', value: condition.distance },
      };
    }
    if (
      ((sourceIsSpatialPoint && targetIsCaster) || (targetIsSpatialPoint && sourceIsCaster)) &&
      !condition.includeTargetRadius &&
      !condition.containsHittableObject
    ) {
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 0 },
        operator: condition.lessThan ? 'lessOrEqual' : 'greater',
        right: { kind: 'constant', value: condition.distance },
      };
    }
    if (
      condition.source.targetSource === 'MainCharacter' &&
      condition.source.targetGroupKey === '' &&
      targetIsAbilityEntityContext &&
      !condition.includeTargetRadius &&
      !condition.containsHittableObject
    ) {
      const contextKey = condition.target.targetGroupKey!;
      return {
        // GetFirstTarget 缺少 Context 成员时原生条件失败；零距离归约不能把空组变成 true。
        kind: 'all',
        conditions: [
          {
            kind: 'contextTargetCountCompare',
            contextKey,
            operator: 'greater',
            value: 0,
          },
          {
            kind: 'actionValueCompare',
            left: { kind: 'constant', value: 0 },
            operator: condition.lessThan ? 'lessOrEqual' : 'greater',
            right: { kind: 'constant', value: condition.distance },
          },
        ],
      };
    }
    if (
      context.actionTargetTarget === 'enemy' &&
      condition.source.targetSource === 'Owner' &&
      condition.target.targetSource === 'Target'
    ) {
      // Owner 可以是施术干员、Buff 宿主、投射物或能力实体；这里不借用其身份。
      // 动作已在具体宿主和唯一木桩上执行，项目模型又规定任意实例间距离为零，因此只折叠距离值。
      // includeTargetRadius 只会在零距离上纳入非负目标半径，不改变正阈值 less-or-equal 的结果。
      // containsHittableObject 只扩展原生目标位置的回退来源；这里已有具体 Target 敌人，
      // 且 Endaxis 明确把所有实例间距离统一为 0，因此不再让该空间选项阻塞数值分支。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 0 },
        operator: condition.lessThan ? 'lessOrEqual' : 'greater',
        right: { kind: 'constant', value: condition.distance },
      };
    }
    if (
      context.actionTargetTarget === 'eventSource' &&
      condition.source.targetSource === 'Owner' &&
      condition.source.targetGroupKey === '' &&
      condition.target.targetSource === 'Target' &&
      condition.target.targetGroupKey === '' &&
      !condition.includeTargetRadius &&
      !condition.containsHittableObject
    ) {
      // Added/Output Buff 响应只会在带实际来源身份的同步事件中执行；Target 是该事件来源。
      // 不推断来源阵营或角色，只按项目统一的实例间零距离折叠数值。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 0 },
        operator: condition.lessThan ? 'lessOrEqual' : 'greater',
        right: { kind: 'constant', value: condition.distance },
      };
    }
    if (
      condition.source.targetSource === 'Owner' &&
      condition.source.targetGroupKey === '' &&
      context.actionOwnerTarget === 'buffOwner' &&
      context.fixedBuffOwnerTarget === 'enemy' &&
      condition.target.targetSource === 'InstantSearch' &&
      condition.target.finderType === 'OwnerSpawnedEntityFinder' &&
      !condition.includeTargetRadius &&
      !condition.containsHittableObject &&
      context.abilityEntityQueries !== undefined
    ) {
      const query = compileTargetReferenceAbilityEntityQuerySource(
        condition.target,
        context.abilityEntityQueries.catalog,
        context.abilityEntityQueries.gameplayTagRegistry,
        `${sourcePath}.target`,
      );
      if (
        query.objectFilter !== 'abilityEntity' ||
        query.owner.kind !== 'actionSource' ||
        query.center.kind !== 'actionSource' ||
        query.postProcessors.length !== 0 ||
        query.validators.some(
          validator => validator.kind !== 'tag' && validator.kind !== 'sameSkillCast',
        )
      ) {
        throw new Error(`${sourcePath}: unsupported zero-distance AbilityEntity endpoint query`);
      }
      return {
        kind: 'all',
        conditions: [
          {
            kind: 'ownerSpawnedAbilityEntityPresent',
            abilityEntityIds: query.candidateTemplateIds,
            ...(query.validators.some(validator => validator.kind === 'sameSkillCast')
              ? { sameSourceSkillCast: true }
              : {}),
          },
          {
            kind: 'actionValueCompare',
            left: { kind: 'constant', value: 0 },
            operator: condition.lessThan ? 'lessOrEqual' : 'greater',
            right: { kind: 'constant', value: condition.distance },
          },
        ],
      };
    }
    if (
      (condition.source.targetSource === 'Owner' ||
        condition.source.targetSource === 'MainCharacter') &&
      condition.target.targetSource === 'Context' &&
      condition.target.targetGroupKey !== '' &&
      context.singleEnemyTargetGroupKeys?.has(condition.target.targetGroupKey) === true &&
      (context.actionOwnerTarget === 'caster' ||
        context.actionOwnerTarget === 'currentAbilityEntity' ||
        context.fixedBuffOwnerTarget === 'caster') &&
      !condition.containsHittableObject
    ) {
      // 跨时间段的动态单敌查询可以为空。原生 Context 距离检查在空组上失败；
      // 非空时项目零距离模型再折叠数值。includeTargetRadius 只会继续减小
      // 有效距离，不改变这个零距离结果。
      return {
        kind: 'all',
        conditions: [
          {
            kind: 'contextTargetCountCompare',
            contextKey: condition.target.targetGroupKey,
            operator: 'greater',
            value: 0,
          },
          {
            kind: 'actionValueCompare',
            left: { kind: 'constant', value: 0 },
            operator: condition.lessThan ? 'lessOrEqual' : 'greater',
            right: { kind: 'constant', value: condition.distance },
          },
        ],
      };
    }
    const targetIsKnownInstance =
      (condition.target.targetSource === 'Target' &&
        ['currentAbilityEntity', 'enemy', 'caster'].includes(context.actionTargetTarget)) ||
      (condition.target.targetSource === 'Context' &&
        condition.target.targetGroupKey !== '' &&
        targetGroups.get(condition.target.targetGroupKey) === 'abilityEntity');
    if (
      (context.actionOwnerTarget !== 'caster' && context.fixedBuffOwnerTarget !== 'caster') ||
      condition.source.targetSource !== 'Owner' ||
      !targetIsKnownInstance ||
      condition.includeTargetRadius ||
      condition.containsHittableObject
    )
      throw new Error(
        `${sourcePath}: unsupported zero-distance condition endpoints/options ` +
          JSON.stringify({
            source: condition.source.targetSource,
            target: condition.target.targetSource,
            targetGroup: condition.target.targetGroupKey,
            targetKind: targetGroups.get(condition.target.targetGroupKey),
            owner: context.actionOwnerTarget,
            inputTarget: context.actionTargetTarget,
            includeTargetRadius: condition.includeTargetRadius,
            containsHittableObject: condition.containsHittableObject,
          }),
      );
    // 固定技能目标或 ForEach 已保证实例存在；不能把空目标组当成距离为零。
    // 原生 lessThan=true 的比较是 <=，不是 <。
    return {
      kind: 'actionValueCompare',
      left: { kind: 'constant', value: 0 },
      operator: condition.lessThan ? 'lessOrEqual' : 'greater',
      right: { kind: 'constant', value: condition.distance },
    };
  }
  if (condition.kind === 'squadInFight') {
    // 正式时间轴只在已绑定 Battle 的模拟中执行；未绑定环境会在运行入口先失败。
    return { kind: 'constant', value: !condition.inverted };
  }
  if (condition.kind === 'dungeonCategory' && !condition.needDetailedConfig) {
    // CheckDungeonCategory 原生在配置服务可用且不要求详细配置时
    // 直接返回 true，不读取 category list。Endaxis 的正式模拟入口已经绑定 Battle，
    // 因而对应配置环境可用；列表和 returnTrueWhenInList 都只是序列化残留。
    return { kind: 'constant', value: true };
  }
  if (
    context.restrictEventSourceTargetProjection === true &&
    ![
      'contextBuff',
      'buffStack',
      'targetIdentity',
      // 接收事件不会改变固定 Buff Owner 的身份。极限闪避监听器检查 Owner 是否为
      // 当前主控，仍由场景控制时间线在执行帧求值，不能在生成阶段折叠。
      'mainOperator',
      'floatCompare',
      'originSkillType',
      'skillCastId',
      'timedMarker',
      'damageDecorateMask',
      // 受击响应读取本次伤害元素；Owner 标签仍由下方固定 Buff 宿主解析，
      // 概率只推进本响应自己的随机流，三者都不借用事件来源身份。
      'damageType',
      'entityTag',
      'probability',
    ].includes(condition.kind)
  )
    throw new Error(`${sourcePath}: unaudited receiving Buff event condition ${condition.kind}`);
  if (condition.kind === 'mainOperator') {
    if (condition.targetSource === 'Context' && condition.targetGroupKey !== '') {
      return {
        kind: 'contextTargetIdentityMatch',
        contextKey: condition.targetGroupKey,
        other: 'controlledOperator',
        operator: 'equal',
      };
    }
    if (
      condition.targetSource === 'Owner' &&
      context.actionOwnerTarget === 'currentAbilityEntity'
    ) {
      // 投射物/能力实体自己的 AbilitySystem 不可能是玩家主控角色。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 0 },
        operator: 'equal',
        right: { kind: 'constant', value: 1 },
      };
    }
    if (
      condition.targetSource === 'Target' &&
      condition.targetGroupKey === '' &&
      context.actionTargetTarget === 'enemy'
    ) {
      // 静态敌方木桩不可能是玩家主控；用显式假条件保留 alwaysNext/fail 分支结构。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 0 },
        operator: 'equal',
        right: { kind: 'constant', value: 1 },
      };
    }
    if (
      condition.targetSource === 'Target' &&
      condition.targetGroupKey === '' &&
      context.actionTargetTarget === 'buffOwner' &&
      (context.fixedBuffOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'enemy')
    ) {
      return context.fixedBuffOwnerTarget === 'caster'
        ? { kind: 'casterControlled' }
        : {
            kind: 'actionValueCompare',
            left: { kind: 'constant', value: 0 },
            operator: 'equal',
            right: { kind: 'constant', value: 1 },
          };
    }
    if (
      condition.targetSource === 'Target' &&
      condition.targetGroupKey === '' &&
      (context.actionTargetTarget === 'eventSource' || context.actionTargetTarget === 'eventTarget')
    ) {
      return {
        kind: 'actionInputTargetIdentityMatch',
        other: 'controlledOperator',
        operator: 'equal',
      };
    }
    const projectsCaster =
      (condition.targetSource === 'Owner' &&
        (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')) ||
      (condition.targetSource === 'Source' && context.actionSourceTarget === 'caster');
    // 固定 Owner/Source 不读取 targetGroupKey；部分原始技能保留了上一个 Context 目标组名。
    if (!projectsCaster) {
      throw new Error(`${sourcePath}: unsupported main-character condition target`);
    }
    return { kind: 'casterControlled' };
  }
  if (condition.kind === 'profession') {
    if (condition.target.targetGroupKey !== '') {
      throw new Error(`${sourcePath}: named profession targets are unsupported`);
    }
    let target: 'caster' | 'buffOwner' | 'eventTarget' | undefined;
    if (condition.target.targetSource === 'Owner') {
      const owner = requireActionOwnerProjection(context, sourcePath);
      if (owner === 'caster' || owner === 'buffOwner') target = owner;
    } else if (condition.target.targetSource === 'Target') {
      const actionTarget = context.actionTargetTarget;
      if (
        actionTarget === 'caster' ||
        actionTarget === 'buffOwner' ||
        actionTarget === 'eventTarget'
      ) {
        target = actionTarget;
      }
    }
    if (target === undefined) {
      throw new Error(`${sourcePath}: profession target is not a proven operator identity`);
    }
    return { kind: 'operatorRoleIn', target, roles: condition.roles };
  }
  if (condition.kind === 'deckAttributeCompare') {
    const attributes = {
      Str: 'strength',
      Agi: 'agility',
      Wisd: 'intellect',
      Will: 'will',
    } as const;
    const left = attributes[condition.leftAttribute as keyof typeof attributes];
    const right = attributes[condition.rightAttribute as keyof typeof attributes];
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (
      condition.targetSource !== 'Owner' ||
      condition.targetGroupKey !== '' ||
      condition.leftValue.blackboardKey !== null ||
      condition.leftValue.value !== 0 ||
      condition.rightValue.blackboardKey !== null ||
      condition.rightValue.value !== 0 ||
      left === undefined ||
      right === undefined ||
      operator === undefined
    ) {
      throw new Error(`${sourcePath}: unsupported Deck attribute comparison`);
    }
    return { kind: 'deckAttributeCompare', left, operator, right };
  }
  if (condition.kind === 'floatCompare') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) throw new Error(`${sourcePath}: unsupported float comparison`);
    return {
      kind: 'actionValueCompare',
      // 当前原生 CompareFloat 两侧都通过 GetValueOrDefault(..., 0) 求值；
      // 不能把这个缺省策略扩散到其他 BlackboardDouble 调用点。
      left: actionValueOperand(condition.left, 0),
      operator,
      right: actionValueOperand(condition.right, 0),
    };
  }
  if (condition.kind === 'health') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    const target =
      condition.targetSource === 'InstantSearch' &&
      condition.characterTeamSelection?.kind === 'controlledOperator'
        ? ('controlledOperator' as const)
        : condition.targetSource === 'Target' && context.actionTargetTarget === 'enemy'
          ? ('enemy' as const)
          : condition.targetSource === 'Target' && context.actionTargetTarget === 'currentOperator'
            ? ('currentTarget' as const)
            : condition.targetSource === 'Owner' &&
                condition.targetGroupKey === '' &&
                context.fixedBuffOwnerTarget === 'caster'
              ? ('caster' as const)
              : condition.targetSource === 'Source' &&
                  condition.targetGroupKey === '' &&
                  context.fixedBuffSourceTarget === 'caster'
                ? ('caster' as const)
                : condition.targetSource === 'Source' &&
                    condition.targetGroupKey === '' &&
                    context.fixedBuffSourceTarget === 'enemy'
                  ? ('enemy' as const)
                  : condition.targetSource === 'Context' &&
                      (targetGroups.get(condition.targetGroupKey) === 'enemy' ||
                        context.staticEnemyTargetGroupKeys?.has(condition.targetGroupKey) === true)
                    ? ('enemy' as const)
                    : condition.targetSource === 'Context' && condition.targetGroupKey !== ''
                      ? ('contextTarget' as const)
                      : null;
    if (target === null || operator === undefined) {
      throw new Error(`${sourcePath}: unsupported health condition target`);
    }
    return {
      kind: 'healthCompare',
      target,
      ...(target === 'contextTarget' ? { contextKey: condition.targetGroupKey } : {}),
      valueType: condition.isRatio ? 'ratio' : 'current',
      operator,
      value: actionValueOperand(condition.value),
    };
  }
  if (condition.kind === 'obtainAtbType') {
    return {
      kind: 'eventSpGainMatch',
      ...(condition.checkObtainType
        ? {
            sources: condition.obtainTypes.map((value, index) =>
              projectSpGainSource(value, `${sourcePath}.obtainTypes[${index}]`),
            ),
          }
        : {}),
      ...(condition.checkObtainMethod
        ? {
            gainKinds: condition.obtainMethods.map((value, index) =>
              projectSpGainKind(value, `${sourcePath}.obtainMethods[${index}]`),
            ),
          }
        : {}),
    };
  }
  if (condition.kind === 'skillType') {
    const skillTypes = mapNativeSkillTypes(condition.skillTypes, condition.attackTypeMask);
    if (condition.checkTargetCurrentSkill) {
      const skillOwner = condition.skillOwner;
      const target =
        skillOwner?.targetSource === 'Owner'
          ? ('buffOwner' as const)
          : skillOwner?.targetSource === 'Source' && context.actionSourceTarget === 'caster'
            ? ('caster' as const)
            : null;
      if (
        skillOwner === undefined ||
        target === null ||
        skillOwner.targetGroupKey !== '' ||
        condition.mustBeforeExclusiveTime
      ) {
        throw new Error(`${sourcePath}: unsupported current skill type condition`);
      }
      return { kind: 'currentSkillTypeIn', target, skillTypes };
    }
    return {
      kind: 'eventSkillTypeIn',
      skillTypes,
    };
  }
  if (condition.kind === 'customAbilityEvent') {
    if (condition.eventName.blackboardKey !== null || condition.eventName.value.length === 0) {
      throw new Error(`${sourcePath}: unsupported dynamic custom ability event check`);
    }
    return {
      kind: 'eventCustomAbilityNameMatch',
      eventName: condition.eventName.value,
      ...(condition.savedParamKey === '' ? {} : { outputKey: condition.savedParamKey }),
    };
  }
  if (condition.kind === 'skillId') {
    return {
      kind: 'eventSkillIdIn',
      skillIds: condition.skillIds.map((skillId, index) => {
        if (skillId.blackboardKey !== null) {
          throw new Error(`${sourcePath}.skillIdList[${index}]: dynamic skill ID is unsupported`);
        }
        return skillId.value;
      }),
    };
  }
  if (condition.kind === 'originSkillType') {
    return {
      kind: 'originSkillTypeIn',
      skillTypes: mapNativeSkillTypes(condition.skillTypes, condition.attackTypeMask),
    };
  }
  if (condition.kind === 'skillCastId') {
    return { kind: 'eventSkillCastMatchesBuffSource' };
  }
  if (condition.kind === 'inflictionType') {
    return {
      kind: 'eventInflictionElementIn',
      elements: condition.elements as readonly ('heat' | 'electric' | 'cryo' | 'nature')[],
      ...(condition.savedKey === '' ? {} : { outputKey: condition.savedKey }),
    };
  }
  if (condition.kind === 'entityCount') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    const projectedGroup = targetGroups.get(condition.targetGroupKey);
    const knownStaticEnemy = context.staticEnemyTargetGroupKeys?.has(condition.targetGroupKey);
    if (
      condition.targetSource === 'Context' &&
      projectedGroup === 'empty' &&
      !condition.containsHittableTarget &&
      !condition.excludeDeadEntity &&
      condition.storeKey === '' &&
      operator !== undefined
    ) {
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 0 },
        operator,
        right: { kind: 'constant', value: condition.minimumCount },
      };
    }
    if (
      condition.targetSource === 'InstantSearch' &&
      condition.target?.finderType === 'MainTargetFinder' &&
      condition.target.validatorTypes.length === 0 &&
      condition.target.postProcessorTypes.length === 0 &&
      !condition.containsHittableTarget &&
      !condition.excludeDeadEntity &&
      condition.storeKey === '' &&
      operator !== undefined &&
      context.actionTargetTarget === 'enemy'
    ) {
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 1 },
        operator,
        right: { kind: 'constant', value: condition.minimumCount },
      };
    }
    if (
      condition.targetSource === 'Context' &&
      context.guaranteedSingletonZeroSpaceTargetGroupKeys?.has(condition.targetGroupKey) === true &&
      !condition.containsHittableTarget &&
      !condition.excludeDeadEntity &&
      condition.storeKey === '' &&
      operator !== undefined
    ) {
      // 该事实来自同一技能按原生时间线及 IfElse 汇合传播后的入口状态；它只证明
      // 当前集合恰有一个成员，不把 FixedPoint 冒充为敌人，也不外推到其他时间线。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 1 },
        operator,
        right: { kind: 'constant', value: condition.minimumCount },
      };
    }
    if (
      condition.targetSource === 'Context' &&
      (projectedGroup === 'controlledOperator' || knownStaticEnemy) &&
      !condition.containsHittableTarget &&
      (!condition.excludeDeadEntity || knownStaticEnemy) &&
      condition.storeKey === '' &&
      operator !== undefined
    ) {
      // staticEnemyTargetGroupKeys 已证明该 Context 只含标准唯一木桩；木桩 HP 归零不会安装
      // 原生 markDie，故 excludeDeadEntity 与直接 Target 分支一样仍保留这一实体。普通动态
      // Context 和 controlledOperator 不借用此结论。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 1 },
        operator,
        right: { kind: 'constant', value: condition.minimumCount },
      };
    }
    if (
      condition.targetSource === 'Target' &&
      (!condition.excludeDeadEntity || context.actionTargetTarget === 'enemy') &&
      condition.storeKey === '' &&
      (!condition.containsHittableTarget || context.fixedHittableTargetCount !== undefined) &&
      operator !== undefined &&
      ['enemy', 'currentAbilityEntity', 'eventTarget', 'eventSource'].includes(
        context.actionTargetTarget,
      )
    ) {
      // GetTargetsView 的 Target 分支直接读取输入目标；序列化残留 group key 不参与解析。
      // 已绑定单一 ActionTarget 的回调不会以空集合调用；保留为显式常量比较，
      // 不把一般 Context 集合查询错误简化为唯一木桩。
      // 标准唯一木桩不安装原生死亡标记，HP 归零也不是 markDie；因此敌人输入经过
      // excludeDeadEntity 仍为同一目标。能力实体/事件来源则不能借用这条证明。
      return {
        kind: 'actionValueCompare',
        left: {
          kind: 'constant',
          value: 1 + (condition.containsHittableTarget ? context.fixedHittableTargetCount! : 0),
        },
        operator,
        right: { kind: 'constant', value: condition.minimumCount },
      };
    }
    if (
      condition.targetSource !== 'Context' ||
      condition.targetGroupKey === '' ||
      condition.containsHittableTarget ||
      condition.excludeDeadEntity ||
      operator === undefined
    ) {
      throw new Error(`${sourcePath}: unsupported Context target count condition`);
    }
    return {
      kind: 'contextTargetCountCompare',
      contextKey: condition.targetGroupKey,
      operator,
      value: condition.minimumCount,
      ...(condition.storeKey === '' ? {} : { outputKey: condition.storeKey }),
    };
  }
  if (condition.kind === 'targetContains') {
    if (
      condition.parent.targetSource === 'Target' &&
      condition.child.targetSource === 'Context' &&
      condition.child.targetGroupKey !== '' &&
      context.actionTargetTarget === 'enemy' &&
      (targetGroups.get(condition.child.targetGroupKey) === 'enemy' ||
        context.staticEnemyTargetGroupKeys?.has(condition.child.targetGroupKey) === true)
    ) {
      // parent Target 是 Channeling 当前迭代的唯一木桩；child Context 由同一 tick 的
      // MainTargetFinder 写回同一唯一木桩。直接 Target 分支不读取残留 group key。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 1 },
        operator: 'equal',
        right: { kind: 'constant', value: 1 },
      };
    }
    if (
      condition.parent.targetSource !== 'Context' ||
      condition.parent.targetGroupKey === '' ||
      condition.child.targetSource !== 'Target' ||
      condition.child.targetGroupKey !== ''
    ) {
      throw new Error(`${sourcePath}: unsupported target containment sources`);
    }
    if (
      context.actionTargetTarget === 'enemy' &&
      (targetGroups.get(condition.parent.targetGroupKey) === 'enemy' ||
        context.staticEnemyTargetGroupKeys?.has(condition.parent.targetGroupKey) === true)
    ) {
      // 父 Context 已由完整 finder + TargetContainsValidator 数据流证明为当前唯一木桩，
      // child Target 又是同一主动技能输入，因此 contains 在固定模型下恒真。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 1 },
        operator: 'equal',
        right: { kind: 'constant', value: 1 },
      };
    }
    return {
      kind: 'contextTargetContains',
      parentContextKey: condition.parent.targetGroupKey,
      child: 'eventTarget',
    };
  }
  if (condition.kind === 'damageTypeMask') {
    return {
      kind: 'eventDamageTypeIn',
      damageTypes: condition.damageTypes.map(damageType => {
        const mapped = DAMAGE_TYPES[damageType];
        if (mapped === undefined) {
          throw new Error(
            `${sourcePath}: unsupported native damage type ${JSON.stringify(damageType)}`,
          );
        }
        return mapped;
      }),
    };
  }
  if (condition.kind === 'damageType') {
    return { kind: 'eventDamageTypeIn', damageTypes: [condition.damageType] };
  }
  if (condition.kind === 'damageDecorateMask') {
    const match = {
      HasAny: 'hasAny',
      HasAll: 'hasAll',
      ExceptAny: 'exceptAny',
      ExceptAll: 'exceptAll',
    }[condition.checkType] as 'hasAny' | 'hasAll' | 'exceptAny' | 'exceptAll' | undefined;
    const has = (bit: number) => Math.floor(condition.mask / bit) % 2 === 1;
    const tags = [
      ...(has(4) ? (['powerAttack'] as const) : []),
      ...(has(128) ? (['normalAttack'] as const) : []),
      ...(has(256) ? (['normalSkill'] as const) : []),
      ...(has(512) ? (['ultimateSkill'] as const) : []),
      ...(has(1024) ? (['plungingAttack'] as const) : []),
      ...(has(8192) ? (['comboSkill'] as const) : []),
      ...(has(131072) ? (['dashAttack'] as const) : []),
      ...(has(2097152) ? (['normalAttackLastCombo'] as const) : []),
      ...(has(4194304) ? (['fireBurst'] as const) : []),
      ...(has(8388608) ? (['cryoBurst'] as const) : []),
      ...(has(16777216) ? (['electricBurst'] as const) : []),
      ...(has(33554432) ? (['natureBurst'] as const) : []),
    ];
    const features = [
      ...(has(4096) ? (['canBreakWeakness'] as const) : []),
      ...(has(16384) ? (['crush'] as const) : []),
      ...(has(32768) ? (['airborne'] as const) : []),
      ...(has(65536) ? (['knockDown'] as const) : []),
      ...(has(134217728) ? (['shatter'] as const) : []),
      ...(has(268435456) ? (['dot'] as const) : []),
      ...(has(536870912) ? (['remainArea'] as const) : []),
      ...(has(1073741824) ? (['physicalInfliction'] as const) : []),
      ...(has(2147483648) ? (['talentDamage'] as const) : []),
    ];
    const knownBits = [
      4, 128, 256, 512, 1024, 4096, 8192, 16384, 32768, 65536, 131072, 2097152, 4194304, 8388608,
      16777216, 33554432, 134217728, 268435456, 536870912, 1073741824, 2147483648,
    ];
    if (
      match === undefined ||
      tags.length + features.length === 0 ||
      !Number.isSafeInteger(condition.mask) ||
      condition.mask < 0 ||
      condition.mask - knownBits.reduce((sum, bit) => sum + (has(bit) ? bit : 0), 0) !== 0
    ) {
      throw new Error(`${sourcePath}: unsupported damage decorate mask ${condition.mask}`);
    }
    const projected = [
      ...(tags.length === 0 ? [] : [{ kind: 'eventDamageTagsMatch' as const, match, tags }]),
      ...(features.length === 0
        ? []
        : [{ kind: 'eventDamageFeaturesMatch' as const, match, features }]),
    ];
    if (projected.length === 1) return projected[0]!;
    // 位掩码跨 Tag/Feature 两个公共域时还原同一个原生位判断：HasAny/ExceptAll
    // 是域间“或”，HasAll/ExceptAny 是域间“且”。
    return {
      kind: condition.checkType === 'HasAny' || condition.checkType === 'ExceptAll' ? 'any' : 'all',
      conditions: projected,
    };
  }
  if (condition.kind === 'damageGameplayTag') {
    return {
      kind: 'eventDamageGameplayTagsMatch',
      match: condition.queryType,
      tags: projectGameplayTags(condition.tagIds, context, sourcePath),
    };
  }
  if (condition.kind === 'healTag') {
    return {
      kind: 'eventHealTagsMatch',
      match: condition.queryType,
      tags: projectGameplayTags(condition.tagIds, context, sourcePath),
    };
  }
  if (condition.kind === 'consumeBuffLayer') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) {
      throw new Error(`${sourcePath}: unsupported consumed Buff layer comparison`);
    }
    return {
      kind: 'eventConsumedBuffLayerCompare',
      operator,
      value: actionValueOperand(condition.value),
      ...(condition.outputKey === '' ? {} : { outputKey: condition.outputKey }),
    };
  }
  if (condition.kind === 'physicalInflictionType') {
    return {
      kind: 'eventPhysicalInflictionTypeIn',
      types: condition.types,
      ...(condition.savedKey === '' ? {} : { outputKey: condition.savedKey }),
    };
  }
  if (condition.kind === 'overHeal') {
    return {
      kind: 'eventOverheal',
      ...(condition.overHealKey === '' ? {} : { overHealKey: condition.overHealKey }),
      ...(condition.finalHealKey === '' ? {} : { finalHealKey: condition.finalHealKey }),
      ...(condition.realHealKey === '' ? {} : { realHealKey: condition.realHealKey }),
    };
  }
  if (condition.kind === 'contextBuff') {
    if (condition.matcher.kind === 'id') {
      const buffIds = condition.matcher.buffIds.map(buffId => {
        if (buffId.kind !== 'constant') {
          throw new Error(`${sourcePath}: dynamic event Buff ID conditions are unsupported`);
        }
        return buffId.value;
      });
      return {
        kind: 'eventBuffIdMatch',
        buffIds,
        ...(condition.buffIdOutputKey === undefined
          ? {}
          : { buffIdOutputKey: condition.buffIdOutputKey }),
      };
    }
    return {
      kind: 'eventBuffTagsMatch',
      match: condition.matcher.queryType,
      buffTags: projectGameplayTags(condition.matcher.buffTagIds, context, sourcePath),
      ...(condition.buffIdOutputKey === undefined
        ? {}
        : { buffIdOutputKey: condition.buffIdOutputKey }),
    };
  }
  if (condition.kind === 'objectTypeMatch') {
    if (
      context.fixedBuffOwnerTarget === 'caster' &&
      condition.target.targetSource === 'Owner' &&
      condition.target.targetGroupKey === ''
    ) {
      const types = projectObjectTypeSelection(
        condition.objectTypeMask,
        `${sourcePath}.objectTypeMask`,
      );
      return { kind: 'constant', value: types === 'all' || types.includes('character') };
    }
    if (
      (context.actionTargetTarget === 'eventSource' ||
        context.actionTargetTarget === 'eventTarget') &&
      condition.target.targetSource === 'Target'
    ) {
      return {
        kind: 'actionInputTargetObjectTypeMatch',
        objectTypes: projectObjectTypeSelection(
          condition.objectTypeMask,
          `${sourcePath}.objectTypeMask`,
        ),
      };
    }
    if (
      (context.actionTargetTarget === 'currentOperator' ||
        (context.actionTargetTarget === 'actionInputTarget' && context.actionInputIsOperator)) &&
      condition.target.targetSource === 'Target'
    ) {
      const types = projectObjectTypeSelection(
        condition.objectTypeMask,
        `${sourcePath}.objectTypeMask`,
      );
      return { kind: 'constant', value: types === 'all' || types.includes('character') };
    }
    if (context.actionTargetTarget === 'enemy' && condition.target.targetSource === 'Target') {
      const types = projectObjectTypeSelection(
        condition.objectTypeMask,
        `${sourcePath}.objectTypeMask`,
      );
      // 唯一木桩是 enemy，enemyPart 不反向包含 enemy。
      return { kind: 'constant', value: types === 'all' || types.includes('enemy') };
    }
    if (condition.target.targetSource !== 'Context' || condition.target.targetGroupKey === '') {
      throw new Error(
        `${sourcePath}: unsupported object type target; expected named Context group`,
      );
    }
    return {
      kind: 'contextTargetObjectTypeMatch',
      contextKey: condition.target.targetGroupKey,
      objectTypes: projectObjectTypeSelection(
        condition.objectTypeMask,
        `${sourcePath}.objectTypeMask`,
      ),
    };
  }
  if (condition.kind === 'targetIdentity') {
    const first = condition.first;
    const second = condition.second;
    const isPlainReference = (target: typeof first) =>
      target.finderType === null &&
      target.validatorTypes.length === 0 &&
      target.postProcessorTypes.length === 0 &&
      target.priorityFilters.length === 0 &&
      target.shuffleTargets.length === 0 &&
      target.distanceValidators.length === 0;
    const isStaticEnemyReference = (target: typeof first) =>
      (target.targetSource === 'Target' &&
        context.actionTargetTarget === 'enemy' &&
        isPlainReference(target)) ||
      (target.targetSource === 'MainTarget' && isPlainReference(target)) ||
      (target.targetSource === 'Context' &&
        target.targetGroupKey !== '' &&
        (context.staticEnemyTargetGroupKeys?.has(target.targetGroupKey) === true ||
          targetGroups.get(target.targetGroupKey) === 'enemy') &&
        isPlainReference(target)) ||
      (target.targetSource === 'InstantSearch' &&
        target.finderType === 'MainTargetFinder' &&
        target.validatorTypes.length === 0 &&
        target.postProcessorTypes.length === 0 &&
        target.priorityFilters.length === 0 &&
        target.shuffleTargets.length === 0 &&
        target.distanceValidators.length === 0);
    if (isStaticEnemyReference(first) && isStaticEnemyReference(second)) {
      // 固定唯一木桩模型下，当前 Target、MainTarget 与已证明的敌人 Context 是同一身份。
      // Target/MainTarget 分支不读取序列化残留的 group key；Context 仍严格要求命名组证明。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 1 },
        operator: 'equal',
        right: { kind: 'constant', value: 1 },
      };
    }
    const targetMatchesStaticMainTarget = (target: typeof first, mainTarget: typeof first) =>
      context.actionTargetTarget === 'enemy' &&
      target.targetSource === 'Target' &&
      ((mainTarget.targetSource === 'MainTarget' &&
        mainTarget.targetGroupKey === '' &&
        mainTarget.finderType === null) ||
        (mainTarget.targetSource === 'InstantSearch' &&
          mainTarget.finderType === 'MainTargetFinder')) &&
      mainTarget.validatorTypes.length === 0 &&
      mainTarget.postProcessorTypes.length === 0 &&
      mainTarget.priorityFilters.length === 0 &&
      mainTarget.shuffleTargets.length === 0 &&
      mainTarget.distanceValidators.length === 0;
    if (
      targetMatchesStaticMainTarget(first, second) ||
      targetMatchesStaticMainTarget(second, first)
    ) {
      // Target 是当前动作输入，MainTarget / MainTargetFinder 是全局主目标；固定唯一敌人模型已把二者
      // 证明为同一个木桩。保留显式真条件，避免把来源枚举相等误当成原生比较规则。
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 1 },
        operator: 'equal',
        right: { kind: 'constant', value: 1 },
      };
    }
    const matchesBuffSourceAndOwner =
      first.targetGroupKey === '' &&
      second.targetGroupKey === '' &&
      ((first.targetSource === 'Source' && second.targetSource === 'Owner') ||
        (first.targetSource === 'Owner' && second.targetSource === 'Source'));
    if (matchesBuffSourceAndOwner && context.actionOwnerTarget === 'buffOwner') {
      return { kind: 'buffSourceMatchesOwner' };
    }
    const matchesOwnerAndControlledOperator =
      first.targetGroupKey === '' &&
      second.targetGroupKey === '' &&
      isPlainReference(first) &&
      isPlainReference(second) &&
      ((first.targetSource === 'Owner' && second.targetSource === 'MainCharacter') ||
        (first.targetSource === 'MainCharacter' && second.targetSource === 'Owner'));
    if (
      matchesOwnerAndControlledOperator &&
      (context.actionOwnerTarget === 'caster' || context.fixedBuffOwnerTarget === 'caster')
    ) {
      return {
        kind: 'actionValueCompare',
        left: { kind: 'constant', value: 1 },
        operator: 'equal',
        right: { kind: 'constant', value: 1 },
      };
    }
    const isEventInputReference = (target: typeof first) =>
      target.targetSource === 'Target' && isPlainReference(target);
    const contextIdentityOther = (
      target: typeof first,
      other: typeof first,
    ): 'actionSource' | 'actionOwner' | 'controlledOperator' | null => {
      if (
        target.targetSource !== 'Context' ||
        target.targetGroupKey === '' ||
        !isPlainReference(target) ||
        !isPlainReference(other)
      )
        return null;
      if (other.targetSource === 'Source') return 'actionSource';
      if (other.targetSource === 'Owner') return 'actionOwner';
      if (other.targetSource === 'MainCharacter') return 'controlledOperator';
      return null;
    };
    const contextOther = contextIdentityOther(first, second) ?? contextIdentityOther(second, first);
    if (contextOther !== null) {
      const contextTarget = first.targetSource === 'Context' ? first : second;
      return {
        kind: 'contextTargetIdentityMatch',
        contextKey: contextTarget.targetGroupKey,
        other: contextOther,
        operator: 'equal',
      };
    }
    const eventInputIdentityOther = (
      target: typeof first,
      other: typeof first,
    ): 'actionSource' | 'actionOwner' | 'controlledOperator' | null => {
      if (!isEventInputReference(target) || !isPlainReference(other)) return null;
      if (other.targetSource === 'Source') return 'actionSource';
      if (other.targetSource === 'Owner') return 'actionOwner';
      if (other.targetSource === 'MainCharacter') return 'controlledOperator';
      return null;
    };
    if (
      context.actionTargetTarget === 'eventSource' ||
      context.actionTargetTarget === 'eventTarget'
    ) {
      const other =
        eventInputIdentityOther(first, second) ?? eventInputIdentityOther(second, first);
      if (other !== null) {
        return { kind: 'actionInputTargetIdentityMatch', other, operator: 'equal' };
      }
    }
    const isControlledOperatorSearch = (target: typeof first) =>
      target.targetSource === 'InstantSearch' &&
      target.targetGroupKey === '' &&
      target.finderType === 'CharacterTeamFinder' &&
      target.validatorTypes.length === 1 &&
      target.validatorTypes[0] === 'MainCharacterValidator' &&
      target.postProcessorTypes.length === 0 &&
      target.priorityFilters.length === 0 &&
      target.shuffleTargets.length === 0 &&
      target.distanceValidators.length === 0;
    const contextControlledSearch =
      first.targetSource === 'Context' && isControlledOperatorSearch(second)
        ? first
        : second.targetSource === 'Context' && isControlledOperatorSearch(first)
          ? second
          : undefined;
    if (
      contextControlledSearch &&
      contextControlledSearch.targetGroupKey === 'trigger' &&
      context.contextTargetGroupTargets?.has('trigger') === true &&
      isPlainReference(contextControlledSearch)
    ) {
      // CharacterTeamFinder + MainCharacterValidator 在当前队伍模型中选择主控角色。
      // 这里只接已经绑定的单目标事件 trigger；任意/空 Context 列表的原生全组合语义不能
      // 降成首目标比较。仍读取实际 trigger，不从事件命名猜来源角色。
      return {
        kind: 'contextTargetIdentityMatch',
        contextKey: contextControlledSearch.targetGroupKey,
        other: 'controlledOperator',
        operator: 'equal',
      };
    }
    if (
      (isEventInputReference(first) && isControlledOperatorSearch(second)) ||
      (isEventInputReference(second) && isControlledOperatorSearch(first))
    ) {
      // TargetSource.Target 读取本次事件 input；非 Context 来源不消费序列化残留 group key。
      // 对已审计承伤事件，input 是伤害来源，即 CombatAbilityDamageEvent.sourceId。
      return { kind: 'eventSourceControlled' };
    }
    const matchesEventSourceAndTarget =
      first.targetGroupKey === '' &&
      second.targetGroupKey === '' &&
      ((first.targetSource === 'Target' && second.targetSource === 'Source') ||
        (first.targetSource === 'Source' && second.targetSource === 'Target'));
    const isSourceFinderOfActionSource = (target: typeof first) =>
      target.targetSource === 'InstantSearch' &&
      target.finderType === 'SourceFinder' &&
      target.selectorOwner === 'ActionSource' &&
      target.validatorTypes.length === 0 &&
      target.postProcessorTypes.length === 0 &&
      target.priorityFilters.length === 0 &&
      target.shuffleTargets.length === 0 &&
      target.distanceValidators.length === 0;
    const matchesResolvedBuffSourceAndEventSource =
      ((isSourceFinderOfActionSource(first) && second.targetSource === 'Target') ||
        (isSourceFinderOfActionSource(second) && first.targetSource === 'Target')) &&
      first.targetGroupKey === '' &&
      second.targetGroupKey === '';
    if (context.actionTargetTarget === 'eventSource') {
      const matchesEventSourceAndControlledOperator =
        first.targetGroupKey === '' &&
        second.targetGroupKey === '' &&
        ((first.targetSource === 'Target' && second.targetSource === 'MainCharacter') ||
          (first.targetSource === 'MainCharacter' && second.targetSource === 'Target'));
      if (matchesEventSourceAndControlledOperator) return { kind: 'eventSourceControlled' };
      if (
        (matchesEventSourceAndTarget || matchesResolvedBuffSourceAndEventSource) &&
        context.actionSourceTarget === 'buffSource'
      )
        return { kind: 'eventSourceMatchesBuffSource' };
      throw new Error(`${sourcePath}: unsupported receiving Buff event target identity sources`);
    }
    if (!matchesEventSourceAndTarget) {
      const matchesOwnerAndEventTarget =
        first.targetGroupKey === '' &&
        second.targetGroupKey === '' &&
        ((first.targetSource === 'Owner' && second.targetSource === 'Target') ||
          (first.targetSource === 'Target' && second.targetSource === 'Owner'));
      if (matchesOwnerAndEventTarget) {
        return { kind: 'eventActionOwnerTargetMatch', operator: 'equal' };
      }
      throw new Error(`${sourcePath}: unsupported target identity sources`);
    }
    return { kind: 'eventSourceTargetMatch', operator: 'equal' };
  }
  if (condition.kind === 'buffStack') {
    // Environment 不走目标解析，精确读取正在执行的 Buff，而非同 ID 总层数。
    if (condition.buffCheckType === 'Environment') {
      const operator = COMPARISON_OPERATORS[condition.comparison];
      if (
        condition.sourceType !== 'CheckBuffStackNumAdvanced' ||
        context.actionOwnerTarget !== 'buffOwner' ||
        condition.countType !== 'BuffCount' ||
        condition.limitSkillCastId ||
        condition.buffIds.length !== 0 ||
        condition.buffTagIds.length !== 0 ||
        operator === undefined
      ) {
        throw new Error(`${sourcePath}: unsupported Environment Buff stack condition`);
      }
      return {
        kind: 'currentBuffStackCompare',
        operator,
        value: actionValueOperand(condition.value),
      };
    }
    if (
      condition.targetSource === 'Context' &&
      condition.targetGroupKey !== '' &&
      context.staticEnemyTargetGroupKeys?.has(condition.targetGroupKey) === true &&
      condition.buffCheckType === 'Tag' &&
      condition.countType === 'BuffCount' &&
      !condition.limitSkillCastId
    ) {
      const operator = COMPARISON_OPERATORS[condition.comparison];
      if (operator === undefined)
        throw new Error(`${sourcePath}: unsupported Buff stack comparison`);
      const buffTags = projectGameplayTags(condition.buffTagIds, context, sourcePath);
      const value = actionValueOperand(condition.value);
      // NoGuard（破防）仍是 Buff 标签计数，不能替换成失衡槽耗尽的状态判断。
      return {
        // 主动技能入口已证明该 Context 恒为唯一木桩，不能再把它当作动态事件目标。
        kind: 'buffStackCompare',
        target: 'enemy',
        tagQueryType: condition.tagQueryType,
        buffTags,
        operator,
        value,
      };
    }
    if (
      condition.targetSource === 'Context' &&
      condition.targetGroupKey !== '' &&
      condition.sourceType === 'CheckBuffStackNumAdvanced' &&
      condition.buffCheckType === 'Tag' &&
      condition.countType === 'BuffCount' &&
      !condition.limitSkillCastId
    ) {
      const operator = COMPARISON_OPERATORS[condition.comparison];
      if (operator === undefined)
        throw new Error(`${sourcePath}: unsupported Buff stack comparison`);
      return {
        kind: 'contextTargetBuffStackCompare',
        contextKey: condition.targetGroupKey,
        tagQueryType: condition.tagQueryType,
        buffTags: projectGameplayTags(condition.buffTagIds, context, sourcePath),
        operator,
        value: actionValueOperand(condition.value),
      };
    }
    if (
      condition.targetSource === 'Context' &&
      condition.targetGroupKey !== '' &&
      (condition.sourceType === 'CheckBuffStackNum' ||
        condition.sourceType === 'CheckBuffStackNumAdvanced') &&
      condition.buffCheckType === 'Id' &&
      condition.buffIds.length > 0 &&
      condition.countType === 'BuffCount' &&
      !condition.limitSkillCastId
    ) {
      const operator = COMPARISON_OPERATORS[condition.comparison];
      if (operator === undefined)
        throw new Error(`${sourcePath}: unsupported Buff stack comparison`);
      return {
        kind: 'contextTargetBuffIdStackCompare',
        contextKey: condition.targetGroupKey,
        buffIds: condition.buffIds,
        operator,
        value: actionValueOperand(condition.value),
      };
    }
    // ByTag 无目标返回 false；不能沿用 Advanced 的零层路径或实例计数。
    if (
      condition.targetSource === 'Context' &&
      condition.targetGroupKey !== '' &&
      condition.sourceType === 'CheckBuffStackNumByTag' &&
      condition.buffCheckType === 'Tag' &&
      condition.countType === 'BuffCount' &&
      !condition.limitSkillCastId
    ) {
      const operator = COMPARISON_OPERATORS[condition.comparison];
      if (operator === undefined)
        throw new Error(`${sourcePath}: unsupported Buff stack comparison`);
      return {
        kind: 'contextTargetBuffStackCompare',
        contextKey: condition.targetGroupKey,
        tagQueryType: condition.tagQueryType,
        buffTags: projectGameplayTags(condition.buffTagIds, context, sourcePath),
        operator,
        value: actionValueOperand(condition.value),
      };
    }
    if (
      (condition.targetSource !== 'Target' &&
        condition.targetSource !== 'Owner' &&
        condition.targetSource !== 'Source' &&
        condition.targetSource !== 'MainCharacter') ||
      (condition.countType !== 'BuffCount' && condition.countType !== 'BuffIdCount') ||
      (condition.limitSkillCastId && context.actionEnvironmentSkillCastInfoIsSourceCast !== true)
    ) {
      throw new Error(`${sourcePath}: unsupported event target Buff count condition`);
    }
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) {
      throw new Error(`${sourcePath}: unsupported event target Buff count comparison`);
    }
    if (
      condition.countType === 'BuffIdCount' &&
      condition.buffCheckType === 'Tag' &&
      !condition.limitSkillCastId
    ) {
      return {
        kind: 'buffTagIdCountCompare',
        target:
          condition.targetSource === 'Owner'
            ? buffConditionOwner(context, sourcePath)
            : condition.targetSource === 'Source'
              ? context.actionSourceTarget
              : condition.targetSource === 'MainCharacter'
                ? 'controlledOperator'
                : singleBuffConditionTarget(context, sourcePath),
        tagQueryType: condition.tagQueryType,
        buffTags: projectGameplayTags(condition.buffTagIds, context, sourcePath),
        operator,
        value: actionValueOperand(condition.value),
      };
    }
    if (condition.countType === 'BuffCount' && condition.buffCheckType === 'Tag') {
      const target =
        condition.targetSource === 'Owner'
          ? buffConditionOwner(context, sourcePath)
          : condition.targetSource === 'Source'
            ? context.actionSourceTarget
            : condition.targetSource === 'MainCharacter'
              ? 'controlledOperator'
              : singleBuffConditionTarget(context, sourcePath);
      const buffTags = projectGameplayTags(condition.buffTagIds, context, sourcePath);
      const value = actionValueOperand(condition.value);
      return {
        // 原生 BuffCount 累加增强层数；Source/Owner 不能冒充物理事件目标。
        kind: 'buffStackCompare',
        target,
        tagQueryType: condition.tagQueryType,
        buffTags,
        operator,
        value,
        ...(condition.limitSkillCastId ? { sameSourceSkillCast: true } : {}),
      };
    }
    if (
      condition.countType === 'BuffCount' &&
      condition.buffCheckType === 'Id' &&
      condition.buffIds.every(id => id.length > 0)
    ) {
      // 公共目标解析器只在
      // targetSource=Context 时读取 targetGroupKey。Liino 的监听响应保留了 Owner+"tar"
      // 这一陈旧组名，仍必须读取 ActionOwner，不能据此改读 Context 或拒绝来源数据。
      return {
        kind: 'buffIdStackCompare',
        target:
          condition.targetSource === 'Owner'
            ? buffConditionOwner(context, sourcePath)
            : condition.targetSource === 'Source'
              ? context.actionSourceTarget
              : condition.targetSource === 'MainCharacter'
                ? 'controlledOperator'
                : singleBuffConditionTarget(context, sourcePath),
        buffIds: condition.buffIds,
        operator,
        value: actionValueOperand(condition.value),
        ...(condition.limitSkillCastId ? { sameSourceSkillCast: true } : {}),
      };
    }
    throw new Error(`${sourcePath}: unsupported event target Buff identity condition`);
  }
  if (condition.kind === 'poise') {
    if (context.damageModifierContext && context.actionTargetTarget !== 'enemy') {
      throw new Error(`${sourcePath}: damage modifier poise target is not the enemy`);
    }
    if (condition.target.targetSource !== 'Target' || condition.target.targetGroupKey !== '')
      throw new Error(`${sourcePath}: unsupported poise condition target`);
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) throw new Error(`${sourcePath}: unsupported poise comparison`);
    return {
      kind: 'poiseCompare',
      target: 'enemy',
      returnValueIfMissing: condition.returnValueIfMissing,
      operator,
      value: actionValueOperand(condition.value),
    };
  }
  if (condition.kind === 'entityTag') {
    if (
      condition.targetSource === 'Context' &&
      condition.targetGroupKey !== '' &&
      (targetGroups.get(condition.targetGroupKey) === 'enemy' ||
        context.staticEnemyTargetGroupKeys?.has(condition.targetGroupKey) === true)
    ) {
      return {
        kind: 'entityTagMatch',
        target: 'enemy',
        tagQueryType: condition.tagQueryType,
        tags: projectGameplayTags(condition.tagIds, context, sourcePath),
      };
    }
    if (condition.targetSource === 'Context' && condition.targetGroupKey !== '') {
      return {
        kind: 'contextTargetEntityTagMatch',
        contextKey: condition.targetGroupKey,
        tagQueryType: condition.tagQueryType,
        tags: projectGameplayTags(condition.tagIds, context, sourcePath),
      };
    }
    const target =
      condition.targetSource === 'Owner'
        ? buffConditionOwner(context, sourcePath)
        : condition.targetSource === 'Source'
          ? context.actionSourceTarget
          : condition.targetSource === 'Target'
            ? singleBuffConditionTarget(context, sourcePath)
            : condition.targetSource === 'Context' &&
                (targetGroups.get(condition.targetGroupKey) === 'enemy' ||
                  context.staticEnemyTargetGroupKeys?.has(condition.targetGroupKey) === true)
              ? ('enemy' as const)
              : null;
    if (target === null) throw new Error(`${sourcePath}: unsupported entity tag target`);
    return {
      kind: 'entityTagMatch',
      target,
      tagQueryType: condition.tagQueryType,
      tags: projectGameplayTags(condition.tagIds, context, sourcePath),
    };
  }
  if (condition.kind === 'any') {
    const groups = condition.groups.map(group => {
      const conditions = group.conditions.map((child, index) => {
        const compiled = compileConditionLeaf(child, sourcePath, context);
        return group.negated[index] ? ({ kind: 'not', condition: compiled } as const) : compiled;
      });
      return conditions.length === 1 ? conditions[0]! : ({ kind: 'all', conditions } as const);
    });
    return groups.length === 1 ? groups[0]! : { kind: 'any', conditions: groups };
  }
  if (condition.kind === 'globalCooldown') {
    const target = projectGlobalCooldownTarget(condition, context, sourcePath);
    if (condition.buffId.length === 0) {
      throw new Error(`${sourcePath}: unsupported global cooldown condition target`);
    }
    return {
      kind: 'not',
      condition: { kind: 'globalCooldownPresent', target, markerId: condition.buffId },
    };
  }
  if (condition.kind === 'comboSkillPending') {
    const owner = condition.owner;
    const target =
      owner.targetSource === 'Owner'
        ? requireActionOwnerProjection(context, sourcePath)
        : owner.targetSource === 'Source'
          ? context.actionSourceTarget
          : undefined;
    if (
      target !== 'caster' ||
      owner.targetGroupKey !== '' ||
      owner.finderType !== null ||
      owner.validatorTypes.length > 0 ||
      owner.postProcessorTypes.length > 0
    )
      throw new Error(
        `${sourcePath}: CheckComboSkillPending requires a proven plain caster target`,
      );
    return { kind: 'casterComboPending' };
  }
  if (condition.kind === 'skillHasHit') {
    if (context.timelineRange === undefined) {
      throw new Error(`${sourcePath}: CheckSkillHasHit requires an active skill timeline context`);
    }
    return {
      kind: 'actionValueCompare',
      left: { kind: 'blackboard', key: NATIVE_SKILL_HAS_HIT_BLACKBOARD_KEY },
      operator: 'greater',
      right: { kind: 'constant', value: 0 },
    };
  }
  if (condition.kind === 'enemyRank') {
    const target = condition.target;
    const targetsActiveSkillEnemy =
      target.targetSource === 'Target' &&
      target.targetGroupKey === '' &&
      context.actionTargetTarget === 'enemy';
    const targetsEnemyBuffOwner =
      target.targetSource === 'Owner' &&
      target.targetGroupKey === '' &&
      context.actionOwnerTarget === 'buffOwner' &&
      context.fixedBuffOwnerTarget === 'enemy';
    const targetsProvenEnemyContext =
      target.targetSource === 'Context' &&
      target.targetGroupKey.length > 0 &&
      context.staticEnemyTargetGroupKeys?.has(target.targetGroupKey) === true;
    if (!targetsActiveSkillEnemy && !targetsEnemyBuffOwner && !targetsProvenEnemyContext) {
      throw new Error(`${sourcePath}: enemy rank condition requires a proven enemy target`);
    }
    const ranks = [
      ...(condition.rankMask & 1 ? (['mob'] as const) : []),
      ...(condition.rankMask & 2 ? (['elite'] as const) : []),
      ...(condition.rankMask & 4 ? (['boss'] as const) : []),
    ];
    return { kind: 'enemyRankIn', ranks };
  }
  if (condition.kind === 'timedMarker') {
    if (context.restrictEventSourceTargetProjection === true && condition.targetSource === 'Target')
      throw new Error(`${sourcePath}: unaudited receiving Buff event marker target`);
    if (
      condition.targetSource === 'Context' &&
      condition.targetGroupKey.length > 0 &&
      targetGroups.get(condition.targetGroupKey) === 'abilityEntity'
    ) {
      if (
        condition.useBlackboardKey
          ? condition.blackboardKey.length === 0
          : condition.markerId.length === 0
      )
        throw new Error(`${sourcePath}: timed marker condition has no marker id`);
      const present = {
        kind: 'abilityEntityTimedMarkerPresent' as const,
        contextKey: condition.targetGroupKey,
        markerId: condition.useBlackboardKey
          ? { blackboardKey: condition.blackboardKey }
          : condition.markerId,
      };
      return condition.returnTrueIfNotExists ? { kind: 'not', condition: present } : present;
    }
    if (
      condition.targetSource === 'Owner' &&
      condition.targetGroupKey === '' &&
      context.actionOwnerTarget === 'currentAbilityEntity'
    ) {
      if (
        condition.useBlackboardKey
          ? condition.blackboardKey.length === 0
          : condition.markerId.length === 0
      )
        throw new Error(`${sourcePath}: timed marker condition has no marker id`);
      const present = {
        kind: 'abilityEntityTimedMarkerPresent' as const,
        markerId: condition.useBlackboardKey
          ? { blackboardKey: condition.blackboardKey }
          : condition.markerId,
      };
      return condition.returnTrueIfNotExists ? { kind: 'not', condition: present } : present;
    }
    const target =
      condition.targetSource === 'Target'
        ? context.actionTargetTarget === 'enemy'
          ? ('enemy' as const)
          : ('eventTarget' as const)
        : condition.targetSource === 'Owner'
          ? requireActionOwnerProjection(context, sourcePath)
          : condition.targetSource === 'Source'
            ? context.actionSourceTarget
            : null;
    if (
      (target !== 'caster' &&
        target !== 'enemy' &&
        target !== 'eventTarget' &&
        target !== 'buffOwner' &&
        target !== 'buffSource') ||
      (condition.targetSource !== 'Target' && condition.targetGroupKey !== '') ||
      (condition.useBlackboardKey
        ? condition.blackboardKey.length === 0
        : condition.markerId.length === 0)
    ) {
      throw new Error(
        `${sourcePath}: unsupported timed marker condition ` +
          JSON.stringify({
            target,
            actionTargetTarget: context.actionTargetTarget,
            targetSource: condition.targetSource,
            targetGroupKey: condition.targetGroupKey,
            useBlackboardKey: condition.useBlackboardKey,
            blackboardKey: condition.blackboardKey,
            markerId: condition.markerId,
          }),
      );
    }
    const present = {
      kind: 'timedMarkerPresent' as const,
      target,
      markerId: condition.useBlackboardKey
        ? { blackboardKey: condition.blackboardKey }
        : condition.markerId,
    };
    return condition.returnTrueIfNotExists ? { kind: 'not', condition: present } : present;
  }
  throw new Error(`${sourcePath}: unsupported Buff runtime condition ${condition.kind}`);
}

function singleBuffConditionTarget(
  context: CombatActionProjectionContextSource,
  sourcePath: string,
):
  | 'enemy'
  | 'buffOwner'
  | 'currentAbilityEntity'
  | 'eventTarget'
  | 'actionInputTarget'
  | 'currentTarget' {
  if (context.actionTargetTarget === 'currentOperator') return 'currentTarget';
  if (context.actionTargetTarget === 'actionInputTarget') return 'actionInputTarget';
  if (context.actionTargetTarget === 'eventSource' || context.actionTargetTarget === 'eventTarget')
    return 'actionInputTarget';
  if (
    context.actionTargetTarget === 'enemy' ||
    context.actionTargetTarget === 'buffOwner' ||
    context.actionTargetTarget === 'currentAbilityEntity'
  ) {
    return context.actionTargetTarget;
  }
  throw new Error(`${sourcePath}: unsupported single Buff condition target`);
}

function buffConditionOwner(context: CombatActionProjectionContextSource, sourcePath: string) {
  return context.actionOwnerTarget === 'currentAbilityEntity'
    ? ('currentAbilityEntity' as const)
    : requireActionOwnerProjection(context, sourcePath);
}

const SKILL_TYPES: Readonly<Record<string, 'battleSkill' | 'comboSkill' | 'ultimate'>> = {
  NormalSkill: 'battleSkill',
  ComboSkill: 'comboSkill',
  UltimateSkill: 'ultimate',
};

function mapNativeSkillTypes(
  nativeSkillTypes: readonly string[],
  attackTypeMask: string | number | undefined,
): readonly ('basicAttack' | 'plungingAttack' | 'battleSkill' | 'comboSkill' | 'ultimate')[] {
  const output = new Set<
    'basicAttack' | 'plungingAttack' | 'battleSkill' | 'comboSkill' | 'ultimate'
  >();
  for (const skillType of nativeSkillTypes) {
    // Next 不把原生 ExtraActiveSkill 猜成处决技；没有该原生类型的运行时实例可命中。
    if (skillType === 'ExtraActiveSkill') continue;
    if (skillType === 'Attack') {
      const bits = decodeAttackTypeMask(attackTypeMask);
      if ((bits & 1) !== 0) output.add('basicAttack');
      // 时间轴上的下落攻击技能是原生 PlungingAttackEnd；Start 只负责起跳且不单独落轴。
      if ((bits & 4) !== 0) output.add('plungingAttack');
      continue;
    }
    const mapped = SKILL_TYPES[skillType];
    if (mapped === undefined)
      throw new Error(`unsupported native skill type ${JSON.stringify(skillType)}`);
    output.add(mapped);
  }
  return [...output];
}

function decodeAttackTypeMask(value: string | number | undefined): number {
  if (value === undefined || value === 'All') return 7;
  if (typeof value === 'number') return value & 7;
  let result = 0;
  for (const item of value.split(',').map(part => part.trim())) {
    if (item === 'None' || item === '') continue;
    if (item === 'NormalAttack') result |= 1;
    else if (item === 'PlungingAttackStart') result |= 2;
    else if (item === 'PlungingAttackEnd') result |= 4;
    else throw new Error(`unsupported native attack type mask ${JSON.stringify(value)}`);
  }
  return result;
}
