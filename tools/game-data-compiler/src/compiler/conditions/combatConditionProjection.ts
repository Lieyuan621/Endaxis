import { projectSelectorBuffValidators } from './selectorBuffProjection.ts';
import { projectNativeTagQueryType } from '../../source/tagQuery.ts';
import type { SkillInterruptReason } from '../../../../../packages/game-data-contract/src/conditions.ts';
import type { SkillType } from '../../../../../packages/game-data-contract/src/primitives.ts';
import { projectWeaponType } from '../build/weaponType.ts';
import { COMBO_CAMERA_ALPHA_SETTINGS } from '../intermediateDefinitions.ts';

import type { TargetReferenceSource } from '../../source/target.ts';
import type {
  ActionEntitySelection,
  ActionTargetQuery,
} from '../../../../../packages/game-data-contract/src/conditions.ts';
import {
  isPartyInstantSearch,
  isPartyExceptOwnerInstantSearch,
  isUniqueEnemyHitBoxInstantSearch,
  projectGameplayTags,
} from '../combatProjectionCommon.ts';
import { projectSpGainKind, projectSpGainSource } from '../../source/spGainEnums.ts';
import type { NativeActionNodeSource } from '../../source/controlFlow.ts';
import type { KnownNativeActionLeafSource } from '../../source/actionLeaf.ts';
import type { NativeConditionSource } from '../../source/condition.ts';
import { projectObjectTypeSelection } from '../../source/objectType.ts';
import type { CompiledBuffConditionSource } from '../actions/combatActionProjectionTypes.ts';
import {
  type CombatActionProjectionContextSource,
  actionValueOperand,
  DAMAGE_TYPES,
  COMPARISON_OPERATORS,
} from '../combatProjectionCommon.ts';
import { compileTargetReferenceAbilityEntityQuerySource } from '../abilities/abilityEntityQuery.ts';
import { isPureEmptyContinuingBranch } from '../optimization/nativeConditionUsage.ts';

/** 技能块不提供移动轴输入；静止输入下的原生检查返回 false。 */
export function evaluateFixedScenarioCondition(
  condition: NativeConditionSource,
): boolean | undefined {
  if (condition.kind === 'constant') return condition.value;
  if (condition.kind === 'moveInput') return false;
  return undefined;
}

/** 原生条件到公共条件子集的投影，并明确条件写黑板的副作用。
 * 不编排分支或执行动作；未知宿主和条件仍在原来的边界阻断。 */

export function compileEventCondition(
  node: NativeActionNodeSource<KnownNativeActionLeafSource>,
  context: CombatActionProjectionContextSource,
): CompiledBuffConditionSource | null {
  // 两支均为空且 alwaysNext 时，原生返回恒真；保留返回值供取反和短路使用。
  if (isPureEmptyContinuingBranch(node)) return { kind: 'constant', value: true };
  if (node.body.kind !== 'leaf' || node.body.value.family !== 'condition') return null;
  return compileConditionLeaf(node.body.value.action, node.sourcePath, context);
}

function compileConditionLeaf(
  condition: NativeConditionSource,
  sourcePath: string,
  context: CombatActionProjectionContextSource,
): CompiledBuffConditionSource {
  if (condition.kind === 'globalBuffCount') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (!operator) throw new Error(`${sourcePath}: unsupported global Buff comparison`);
    return {
      kind: 'globalBuffCountCompare',
      globalBuffId: condition.globalBuffId,
      operator,
      value: actionValueOperand(condition.value),
    };
  }
  if (condition.kind === 'damageTransferredSource') {
    return {
      kind: 'eventTransferredPartTagsMatch',
      tagQueryType: condition.tagQuery.queryType,
      tags: projectGameplayTags(condition.tagQuery.tagIds, context, sourcePath),
      ...(condition.contextKey === '' ? {} : { saveToContextKey: condition.contextKey }),
    };
  }
  if (condition.kind === 'comboCameraAlphaSetting') {
    const setting = COMBO_CAMERA_ALPHA_SETTINGS.find(value => value === condition.desiredSetting);
    if (setting === undefined)
      throw new Error(
        `${sourcePath}: unsupported combo camera setting ${condition.desiredSetting}`,
      );
    return { kind: 'comboCameraAlphaSetting', setting };
  }
  if (condition.kind === 'stringCompare') {
    return {
      kind: 'stringEquals',
      left:
        condition.left.blackboardKey === null
          ? condition.left.value
          : { blackboardKey: condition.left.blackboardKey },
      right:
        condition.right.blackboardKey === null
          ? condition.right.value
          : { blackboardKey: condition.right.blackboardKey },
    };
  }
  if (condition.kind === 'targetAngle') {
    if (!['TargetForward', 'TargetBackward'].includes(condition.angleType))
      throw new Error(`${sourcePath}: unsupported target-angle direction`);
    return {
      kind: 'targetFacingAngle',
      origin: projectActionTargetQuery(condition.origin, context, `${sourcePath}.origin`),
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.target`),
      angleType: condition.angleType === 'TargetForward' ? 'forward' : 'backward',
      angle: actionValueOperand(condition.angle),
    };
  }
  if (condition.kind === 'twoDirectionAngle') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) throw new Error(`${sourcePath}: unsupported angle comparison`);
    return {
      kind: 'twoDirectionAngleCompare',
      direction1Source: projectActionTargetQuery(
        condition.dir1Source,
        context,
        `${sourcePath}.dir1Source`,
      ),
      direction1Target: projectActionTargetQuery(
        condition.dir1Target,
        context,
        `${sourcePath}.dir1Target`,
      ),
      direction1Type: condition.dir1DirectionType,
      direction2Source: projectActionTargetQuery(
        condition.dir2Source,
        context,
        `${sourcePath}.dir2Source`,
      ),
      direction2Target: projectActionTargetQuery(
        condition.dir2Target,
        context,
        `${sourcePath}.dir2Target`,
      ),
      direction2Type: condition.dir2DirectionType,
      operator,
      value: actionValueOperand(condition.value),
    };
  }
  const fixedResult = evaluateFixedScenarioCondition(condition);
  if (fixedResult !== undefined) return { kind: 'constant', value: fixedResult };
  if (condition.kind === 'damageIgnoreImmuneLevel') {
    // 当前模拟器唯一的玩家受击入口是用户声明的外部命中，免疫忽略等级固定为原生 Default(0)。
    // 只接受公共闪避监听器的“0 <= 0”形状；其他比较必须等载荷显式携带该字段后再投影。
    if (condition.comparison !== 'LE' || condition.level !== 0)
      throw new Error(`${sourcePath}: unsupported damage ignore-immune-level comparison`);
    return { kind: 'constant', value: true };
  }
  if (condition.kind === 'buffFinishReason')
    return { kind: 'eventBuffFinishReasonIn', reasons: condition.reasons };
  if (condition.kind === 'abilityEntityFinishReason') {
    return { kind: 'eventAbilityEntityFinishReasonIn', reasons: condition.reasons };
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
  if (condition.kind === 'skillInterruptReason') {
    if (context.nativeAbilityEvent !== 'OnSkillInterrupted') {
      throw new Error(`${sourcePath}: CheckSkillInterruptReason requires OnSkillInterrupted`);
    }
    const nativeReasons: Readonly<Record<string, SkillInterruptReason>> = {
      Default: 'default',
      EnterFreeState: 'enterFreeState',
      AIManual: 'aiManual',
      Mud: 'mud',
      DetachSkill: 'detachSkill',
      InterruptAction: 'interruptAction',
      Dash: 'dash',
      CastNextSkill: 'castNextSkill',
    };
    return {
      kind: 'skillInterruptReasonIn',
      reasons: condition.reasons.map(reason => {
        const value = nativeReasons[reason];
        if (value === undefined)
          throw new Error(`${sourcePath}: unsupported skill interrupt reason ${reason}`);
        return value;
      }),
    };
  }
  // 主动动作/命中回调没有 Buff 事件环境；只有已验收的条件可使用显式木桩 Target。
  if (
    context.actionTargetTarget === 'enemy' &&
    !(condition.kind === 'skillType' && condition.checkTargetCurrentSkill) &&
    !(
      context.modifierContext === 'damage' &&
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
      'damageSkillCastRecorded',
      'damageGameplayTag',
      'originSkillType',
      'profession',
      'weaponType',
    ].includes(condition.kind)
  )
    throw new Error(`${sourcePath}: unaudited single-enemy action condition ${condition.kind}`);
  if (
    context.actionTargetTarget === 'currentAbilityEntity' &&
    !(condition.kind === 'skillType' && condition.checkTargetCurrentSkill) &&
    ![
      'floatCompare',
      'buffStack',
      'distance',
      'entityCount',
      'any',
      'entityTag',
      'abilityEntityDuration',
      'weaponType',
      'health',
    ].includes(condition.kind)
  )
    throw new Error(`${sourcePath}: unaudited AbilityEntity condition ${condition.kind}`);
  if (condition.kind === 'probability') {
    return { kind: 'probability', probability: actionValueOperand(condition.value) };
  }
  if (condition.kind === 'abilityEntityDuration') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) {
      throw new Error(`${sourcePath}: unsupported AbilityEntity duration target or comparison`);
    }
    return {
      kind: 'abilityEntityRemainingDurationCompare',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.abilityEntity`),
      ...(condition.saveCurrentDuration ? { outputKey: condition.outputKey } : {}),
      operator,
      value: actionValueOperand(condition.value),
    };
  }
  if (condition.kind === 'superArmor') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined)
      throw new Error(`${sourcePath}: unsupported super-armor target or comparison`);
    return {
      kind: 'enemySuperArmorCompare',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.checkTarget`),
      operator,
      value: actionValueOperand(condition.value),
    };
  }
  if (condition.kind === 'distance') {
    return {
      kind: 'targetDistance',
      source: projectActionTargetQuery(condition.source, context, `${sourcePath}.source`),
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.target`),
      distance: condition.distance,
      lessThan: condition.lessThan,
      includeTargetRadius: condition.includeTargetRadius,
      containsHittableObject: condition.containsHittableObject,
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
      // 受击事件的 Target 已绑定伤害来源；仍由公共输入目标类型条件动态判断。
      'objectTypeMatch',
      // 接收事件不会改变固定 Buff Owner 的身份。极限闪避监听器检查 Owner 是否为
      // 当前主控，仍由场景控制时间线在执行帧求值，不能在生成阶段折叠。
      'mainOperator',
      'floatCompare',
      'originSkillType',
      'weaponType',
      'skillCastId',
      'timedMarker',
      'damageDecorateMask',
      'damageSkillCastRecorded',
      // 受击响应读取本次伤害元素；Owner 标签仍由下方固定 Buff 宿主解析，
      // 概率只推进本响应自己的随机流，三者都不借用事件来源身份。
      'damageType',
      'entityTag',
      'probability',
    ].includes(condition.kind)
  )
    throw new Error(`${sourcePath}: unaudited receiving Buff event condition ${condition.kind}`);
  if (condition.kind === 'mainOperator') {
    return {
      kind: 'checkMainCharacter',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.checkTarget`),
    };
  }
  if (condition.kind === 'weaponType') {
    return {
      kind: 'operatorWeaponTypeIn',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.checkTarget`),
      // Endaxis 的干员契约没有 None/Gun；不把它们误映射为手铳或施术单元。
      // 所有能进入模拟的干员必有这五类之一，过滤后仍保留空掩码不匹配的结果。
      weaponTypes: condition.weaponTypes
        .filter(type => type !== 'None' && type !== 'Gun')
        .map(type => projectWeaponType(type, `${sourcePath}.weaponTypes`)),
    };
  }
  if (condition.kind === 'profession') {
    return {
      kind: 'operatorRoleIn',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.checkTarget`),
      roles: condition.roles,
    };
  }
  if (condition.kind === 'deckAttributeCompare') {
    const attributes = {
      Str: 'strength',
      Agi: 'agility',
      Wisd: 'intellect',
      Will: 'will',
    } as const;
    const left =
      condition.leftAttribute === 'Blackboard'
        ? actionValueOperand(condition.leftValue)
        : attributes[condition.leftAttribute as keyof typeof attributes];
    const right =
      condition.rightAttribute === 'Blackboard'
        ? actionValueOperand(condition.rightValue)
        : attributes[condition.rightAttribute as keyof typeof attributes];
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (left === undefined || right === undefined || operator === undefined) {
      throw new Error(`${sourcePath}: unsupported Deck attribute comparison`);
    }
    return {
      kind: 'deckAttributeCompare',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.target`),
      left,
      operator,
      right,
    };
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
    if (operator === undefined) throw new Error(`${sourcePath}: unsupported health comparison`);
    return {
      kind: 'healthCompare',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.hpOwner`),
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
  if (condition.kind === 'skillDamageType') {
    return { kind: 'skillDamageTypeIn', damageTypes: condition.damageTypes };
  }
  if (condition.kind === 'skillType') {
    const subtype = condition.normalSkillSubTypeFilter;
    const subtypeFilter =
      subtype === undefined || subtype === 'Any'
        ? {}
        : {
            normalSkillSubType:
              subtype === 'Normal' ? ('normal' as const) : ('additionalNormalSkill' as const),
          };
    const skillTypes = mapNativeSkillTypes(condition.skillTypes, condition.attackTypeMask);
    if (condition.checkTargetCurrentSkill) {
      const skillOwner = condition.skillOwner;
      if (skillOwner === undefined || condition.mustBeforeExclusiveTime) {
        throw new Error(`${sourcePath}: unsupported current skill type condition`);
      }
      return {
        kind: 'currentSkillTypeIn',
        target: projectActionTargetQuery(skillOwner, context, `${sourcePath}.skillOwner`),
        skillTypes,
        ...subtypeFilter,
      };
    }
    return {
      kind: 'eventSkillTypeIn',
      skillTypes,
      ...subtypeFilter,
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
    if (!condition.target || operator === undefined)
      throw new Error(`${sourcePath}: incomplete native entity count condition`);
    return {
      kind: 'entityCountCompare',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.checkTarget`),
      containsHittableTarget: condition.containsHittableTarget,
      excludeDeadEntity: condition.excludeDeadEntity,
      operator,
      value: condition.minimumCount,
      ...(condition.storeKey === '' ? {} : { outputKey: condition.storeKey }),
    };
  }
  if (condition.kind === 'targetContains') {
    return {
      kind: 'targetContains',
      parent: projectActionTargetQuery(
        condition.parent,
        context,
        `${sourcePath}.parentTargetSettings`,
      ),
      child: projectActionTargetQuery(
        condition.child,
        context,
        `${sourcePath}.childTargetSettings`,
      ),
    };
  }
  if (condition.kind === 'damageSkillCastRecorded') return { kind: 'eventDamageSkillCastRecorded' };
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
  if (condition.kind === 'consumeBuffLayer' || condition.kind === 'buffEnhanceLayer') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) {
      throw new Error(`${sourcePath}: unsupported consumed Buff layer comparison`);
    }
    return {
      kind:
        condition.kind === 'buffEnhanceLayer'
          ? 'eventBuffEnhanceLayerCompare'
          : 'eventConsumedBuffLayerCompare',
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
    return {
      kind: 'targetObjectTypeMatch',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.target`),
      objectTypes: projectObjectTypeSelection(
        condition.objectTypeMask,
        `${sourcePath}.objectTypeMask`,
      ),
    };
  }
  if (condition.kind === 'targetIdentity') {
    return {
      kind: 'targetsEqual',
      first: projectActionTargetQuery(condition.first, context, `${sourcePath}.first`),
      second: projectActionTargetQuery(condition.second, context, `${sourcePath}.second`),
    };
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
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) throw new Error(`${sourcePath}: unsupported Buff stack comparison`);
    if (condition.limitSkillCastId && context.actionEnvironmentSkillCastInfoIsSourceCast !== true)
      throw new Error(`${sourcePath}: Buff count requires source skill cast identity`);
    const common = {
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.checkTarget`),
      compareZeroWhenTargetMissing: condition.sourceType === 'CheckBuffStackNumAdvanced',
      operator,
      value: actionValueOperand(condition.value),
    };
    if (condition.buffCheckType === 'Tag') {
      const tags = {
        tagQueryType: condition.tagQueryType,
        buffTags: projectGameplayTags(condition.buffTagIds, context, sourcePath),
      };
      if (condition.countType === 'BuffIdCount' && !condition.limitSkillCastId)
        return { kind: 'buffTagIdCountCompare', ...common, ...tags };
      if (condition.countType === 'BuffCount')
        return {
          kind: 'buffStackCompare',
          ...common,
          ...tags,
          ...(condition.limitSkillCastId ? { sameSourceSkillCast: true } : {}),
        };
    }
    if (
      condition.buffCheckType === 'Id' &&
      condition.countType === 'BuffCount' &&
      condition.buffIds.every(id => id.length > 0)
    )
      return {
        kind: 'buffIdStackCompare',
        ...common,
        buffIds: condition.buffIds,
        ...(condition.limitSkillCastId ? { sameSourceSkillCast: true } : {}),
      };
    throw new Error(`${sourcePath}: unsupported Buff count mode`);
  }
  if (condition.kind === 'poise') {
    const operator = COMPARISON_OPERATORS[condition.comparison];
    if (operator === undefined) throw new Error(`${sourcePath}: unsupported poise comparison`);
    return {
      kind: 'poiseCompare',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.poiseOwner`),
      returnValueIfMissing: condition.returnValueIfMissing,
      operator,
      value: actionValueOperand(condition.value),
    };
  }
  if (condition.kind === 'entityTag') {
    return {
      kind: 'entityTagMatch',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.checkTarget`),
      tagQueryType: condition.tagQueryType,
      tags: projectGameplayTags(condition.tagIds, context, sourcePath),
    };
  }
  if (condition.kind === 'globalCooldown') {
    if (condition.buffId.length === 0) {
      throw new Error(`${sourcePath}: unsupported global cooldown condition target`);
    }
    return {
      kind: 'globalCooldownPresent',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.target`),
      returnTrueIfNotExists: true,
      markerId: condition.buffId,
    };
  }
  if (condition.kind === 'comboSkillPending') {
    return {
      kind: 'comboSkillPending',
      target: projectActionTargetQuery(condition.owner, context, `${sourcePath}.owner`),
    };
  }
  if (condition.kind === 'skillHasHit') return { kind: 'skillHasHit' };
  if (condition.kind === 'enemyRank') {
    const ranks = [
      ...(condition.rankMask & 1 ? (['mob'] as const) : []),
      ...(condition.rankMask & 2 ? (['elite'] as const) : []),
      ...(condition.rankMask & 4 ? (['boss'] as const) : []),
    ];
    return {
      kind: 'enemyRankIn',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.checkTarget`),
      ranks,
    };
  }
  if (condition.kind === 'timedMarker') {
    return {
      kind: 'timedMarkerPresent',
      target: projectActionTargetQuery(condition.target, context, `${sourcePath}.checkTarget`),
      returnTrueIfNotExists: condition.returnTrueIfNotExists,
      markerId: condition.useBlackboardKey
        ? { blackboardKey: condition.blackboardKey }
        : condition.markerId,
    };
  }
  throw new Error(`${sourcePath}: unsupported Buff runtime condition ${condition.kind}`);
}

const SKILL_TYPES: Readonly<Record<string, SkillType>> = {
  NormalSkill: 'battleSkill',
  ComboSkill: 'comboSkill',
  UltimateSkill: 'ultimate',
  BreakingAttack: 'finisher',
  Dodge: 'dodge',
};

function mapNativeSkillTypes(
  nativeSkillTypes: readonly string[],
  attackTypeMask: string | number | undefined,
): readonly SkillType[] {
  const output = new Set<SkillType>();
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

/** 保留动作内部的目标查询，不生成额外的查询动作或临时目标组。 */
export function projectActionTargetQuery(
  target: TargetReferenceSource,
  context: CombatActionProjectionContextSource,
  path: string,
): ActionTargetQuery {
  if (
    target.targetSource === 'InstantSearch' &&
    target.postProcessorTypes.length > 0 &&
    target.postProcessorTypes.every(type => type === 'ExcludeTarget')
  ) {
    const excludedTargets = target.excludeTargets ?? [];
    if (excludedTargets.length !== target.postProcessorTypes.length)
      throw new Error(`${path}: incomplete ExcludeTarget postprocessor sources`);
    let query = projectActionTargetQuery(
      { ...target, postProcessorTypes: [], excludeTargets: [] },
      context,
      path,
    );
    for (const [index, excluded] of excludedTargets.entries()) {
      query = {
        kind: 'exclude',
        targets: query,
        excludeTargets: projectActionTargetQuery(
          excluded,
          context,
          `${path}.excludeTargets[${index}]`,
        ),
      };
    }
    return query;
  }
  if (target.targetSource === 'InstantSearch' && target.validatorTypes.includes('BuffValidator')) {
    const validators = target.buffValidators ?? [];
    if (validators.length !== target.validatorTypes.filter(type => type === 'BuffValidator').length)
      throw new Error(`${path}: incomplete BuffValidator sources`);
    return projectSelectorBuffValidators(
      projectActionTargetQuery(
        {
          ...target,
          validatorTypes: target.validatorTypes.filter(type => type !== 'BuffValidator'),
          buffValidators: [],
        },
        context,
        path,
      ),
      validators,
      context,
      path,
    );
  }
  if (target.targetSource === 'InstantSearch' && target.validatorTypes.includes('TagValidator')) {
    if (
      target.validatorTagQueries.length !==
      target.validatorTypes.filter(type => type === 'TagValidator').length
    )
      throw new Error(`${path}: incomplete TagValidator sources`);
    let query = projectActionTargetQuery(
      {
        ...target,
        validatorTypes: target.validatorTypes.filter(type => type !== 'TagValidator'),
        validatorTagQueries: [],
      },
      context,
      path,
    );
    for (const [queryType, tagIds] of target.validatorTagQueries) {
      query = {
        kind: 'tagFilter',
        targets: query,
        tags: projectGameplayTags(tagIds, context, path),
        tagQueryType: projectNativeTagQueryType(queryType, path),
      };
    }
    return query;
  }
  if (isPartyInstantSearch(target)) return { kind: 'characterTeam', excludeOwner: false };
  if (isPartyExceptOwnerInstantSearch(target)) return { kind: 'characterTeam', excludeOwner: true };
  if (isUniqueEnemyHitBoxInstantSearch(target)) return { kind: 'fixed', target: 'enemy' };
  if (target.targetSource !== 'InstantSearch') {
    switch (target.targetSource) {
      case 'Owner':
        return { kind: 'owner' };
      case 'Source':
        return { kind: 'source' };
      case 'Target':
        return { kind: 'inputTarget' };
      case 'MainCharacter':
        return { kind: 'mainCharacter' };
      case 'MainTarget':
        return { kind: 'battleMainTarget' };
      case 'Context':
        if (target.targetGroupKey) {
          return { kind: 'context', key: target.targetGroupKey };
        }
    }
    throw new Error(`${path}: unsupported action target ${target.targetSource}`);
  }
  const owner = (): ActionEntitySelection => {
    if (target.selectorOwner === 'ActionOwner') return { kind: 'owner' };
    if (target.selectorOwner === 'ActionSource') return { kind: 'source' };
    if (target.selectorOwner === 'ContextTarget' && target.ownerContextKey)
      return { kind: 'context', key: target.ownerContextKey };
    throw new Error(`${path}: unsupported selector owner ${target.selectorOwner}`);
  };
  if (
    target.finderType === 'HitBoxFinder' &&
    target.finderAutoSetTargetFaction === true &&
    (target.finderFactionTarget === 'Ally' || target.finderFactionTarget === 'Anti') &&
    target.finderTargetObjectType === 'Normal' &&
    target.finderCheckAlive !== null &&
    target.finderCheckAlive !== undefined &&
    target.finderContainsUnMarkable !== undefined &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0
  )
    return {
      kind: 'factionHitBox',
      factionTarget: target.finderFactionTarget === 'Ally' ? 'ally' : 'anti',
      owner: owner(),
      checkAlive: target.finderCheckAlive,
      containsUnmarkable: target.finderContainsUnMarkable,
      replacePartsWithMainBodies: false,
    };
  if (target.finderType === 'FixedPointFinder') {
    // 导航采样失败保留原位置，成功只替换坐标；均输出一个位置目标。
    // 零空间模型省略坐标修饰，但过滤器可能改变结果，不能一并忽略。
    if (
      !target.finderFixedPoint ||
      target.enableAdvancedDirection ||
      target.validatorTypes.length > 0 ||
      target.postProcessorTypes.length > 0
    )
      throw new Error(`${path}: unsupported fixed-point query modifiers`);
    const selection = (kind: string, key: string): ActionEntitySelection => {
      if (kind === 'ActionOwner') return { kind: 'owner' };
      if (kind === 'ActionSource') return { kind: 'source' };
      if (kind === 'InputTarget' || kind === 'CurrentTarget') return { kind: 'inputTarget' };
      if (kind === 'ContextTarget' && key) return { kind: 'context', key };
      throw new Error(`${path}: unsupported fixed-point reference ${kind}`);
    };
    return {
      kind: 'fixedPoint',
      owner: owner(),
      directionTarget: selection(target.target, target.targetContextKey),
      center: selection(target.centerType, target.centerContextKey),
    };
  }
  if (
    target.finderType === 'GodEntityFinder' &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0
  )
    return { kind: 'godEntity' };
  if (
    target.finderType === 'SourceFinder' &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0
  )
    return { kind: 'abilitySystemSource', owner: owner() };
  if (
    target.finderType === 'MainTargetFinder' &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0
  )
    return { kind: 'mainTarget', owner: owner() };
  if (
    target.finderType === 'CharacterTeamFinder' &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0
  )
    return { kind: 'characterTeam', excludeOwner: false };
  if (
    target.finderType === 'CharacterTeamFinder' &&
    target.validatorTypes.length === 1 &&
    target.validatorTypes[0] === 'ExcludeOwnerValidator' &&
    target.postProcessorTypes.length === 0
  )
    return { kind: 'characterTeam', excludeOwner: true, owner: owner() };
  if (
    target.finderType === 'CharacterTeamFinder' &&
    target.validatorTypes.length === 1 &&
    target.validatorTypes[0] === 'MainCharacterValidator' &&
    target.postProcessorTypes.length === 0
  )
    return { kind: 'mainCharacter' };
  if (
    target.finderType === 'OwnerSpawnedEntityFinder' &&
    target.finderSpawnedObjectType === 'All' &&
    target.validatorTypes.length === 0 &&
    target.postProcessorTypes.length === 0
  ) {
    return { kind: 'ownerSpawned', owner: owner(), objectType: 'all', sameSourceSkillCast: false };
  }
  if (target.finderType === 'OwnerSpawnedEntityFinder' && context.abilityEntityQueries) {
    const query = compileTargetReferenceAbilityEntityQuerySource(
      target,
      context.abilityEntityQueries.catalog,
      context.abilityEntityQueries.gameplayTagRegistry,
      path,
    );
    if (
      query.objectFilter !== 'abilityEntity' ||
      query.postProcessors.length !== 0 ||
      query.validators.some(v => v.kind !== 'tag' && v.kind !== 'sameSkillCast')
    )
      throw new Error(`${path}: unsupported action entity query`);
    return {
      kind: 'ownerSpawned',
      owner: owner(),
      objectType: 'abilityEntity',
      abilityEntityIds: query.candidateTemplateIds,
      sameSourceSkillCast: query.validators.some(v => v.kind === 'sameSkillCast'),
    };
  }
  throw new Error(`${path}: unsupported action target finder ${target.finderType}`);
}
