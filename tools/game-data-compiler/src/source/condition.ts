import {
  nativeActionName,
  requireArray,
  requireBoolean,
  requireExactFields,
  requireInteger,
  requireNonEmptyString,
  requireNonNegativeInteger,
  requireNumber,
  requireRecord,
  requireString,
} from './primitives.ts';
import { projectNativeDamageElement } from './damageElement.ts';
import { parseBuffFindSettingsSource, readBuffStackNumType } from './buffFindSettings.ts';
import { readTargetSource } from './targetEnums.ts';
import {
  readAtbObtainMethod,
  readAtbObtainType,
  readCompareType,
  readDamageDecorateMaskCheckType,
  readSkillType,
} from './nativeEnums.ts';
import {
  parseScalarSource,
  parseStringScalarSource,
  type BlackboardLevelValues,
  type ScalarSource,
  type StringScalarSource,
} from './scalar.ts';
import { parseCharacterTeamSelection, type CharacterTeamSelectionSource } from './selectorFacts.ts';
import {
  parseTagIdsSource,
  parseTagQuerySource,
  projectNativeTagQueryType,
  type TagQueryType,
} from './tagQuery.ts';
import { parseTargetReferenceSource, type TargetReferenceSource } from './target.ts';
import type {
  DamageElement,
  OperatorRole,
  PhysicalInflictionType,
} from '../../../../packages/game-data-contract/src/primitives.ts';
import {
  parseCheckCustomAbilityEventSource,
  type CheckCustomAbilityEventSource,
} from './customAbilityEventActions.ts';

interface ConditionIdentity {
  readonly sourceType: string;
}

export type AttackTypeMaskSource = string | number;

function parseAttackTypeMaskSource(value: unknown, path: string): AttackTypeMaskSource {
  return typeof value === 'number'
    ? requireInteger(value, path)
    : requireNonEmptyString(value, path);
}

export type NativeConditionSource =
  | (ConditionIdentity & { readonly kind: 'constant'; readonly value: boolean })
  | (ConditionIdentity & {
      readonly kind: 'perfectDodgeDirection';
      readonly direction: 'Forward' | 'Backward';
    })
  | (ConditionIdentity & {
      readonly kind: 'damageIgnoreImmuneLevel';
      readonly comparison: string;
      readonly level: number;
    })
  | (ConditionIdentity & {
      readonly kind: 'projectilePerfectDodgeCooldown';
      readonly isInCooldown: boolean;
    })
  | (ConditionIdentity & {
      readonly kind: 'projectileIgnoreImmuneLevel';
      readonly comparison: string;
      readonly level: number;
    })
  | (ConditionIdentity & CheckCustomAbilityEventSource)
  | (ConditionIdentity & { readonly kind: 'squadInFight'; readonly inverted: boolean })
  | (ConditionIdentity & {
      readonly kind: 'dungeonCategory';
      readonly needDetailedConfig: boolean;
      readonly dungeonCategories: readonly string[];
      readonly returnTrueWhenInList: boolean;
    })
  | (ConditionIdentity & {
      /** 只表示玩家当前是否有移动输入；来源动作无额外字段或写黑板副作用。 */
      readonly kind: 'moveInput';
    })
  | (ConditionIdentity & {
      /** 仅选择连携镜头跟随强度；不属于战斗条件。 */
      readonly kind: 'comboCameraAlphaSetting';
      readonly desiredSetting: string;
    })
  | (ConditionIdentity & {
      /** 查询指定技能镜头是否空闲；来源字段只标识编辑器预制体和镜头动画。 */
      readonly kind: 'skillCameraMotionFree';
      readonly editPrefabName: string;
      readonly cameraAnimationKey: string;
    })
  | (ConditionIdentity & {
      /** AbilitySystem 被动条件；这里只保留比较结构，不在来源层读取或计算生命比例。 */
      readonly kind: 'currentHpRatio';
      readonly comparison: string;
      readonly value: ScalarSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'floatCompare';
      readonly comparison: string;
      readonly left: ScalarSource;
      readonly right: ScalarSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'stringCompare';
      readonly left: StringScalarSource;
      readonly right: StringScalarSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'mainOperator';
      readonly targetSource: string;
      readonly targetGroupKey: string;
    })
  | (ConditionIdentity & {
      readonly kind: 'profession';
      readonly target: TargetReferenceSource;
      readonly roles: readonly OperatorRole[];
    })
  | (ConditionIdentity & {
      readonly kind: 'distance';
      readonly source: TargetReferenceSource;
      readonly target: TargetReferenceSource;
      readonly distance: number;
      readonly lessThan: boolean;
      readonly includeTargetRadius: boolean;
      readonly containsHittableObject: boolean;
    })
  | (ConditionIdentity & {
      readonly kind: 'entityCount';
      readonly target?: TargetReferenceSource;
      readonly targetSource: string;
      readonly targetGroupKey: string;
      readonly minimumCount: number;
      readonly comparison: string;
      readonly containsHittableTarget: boolean;
      readonly excludeDeadEntity: boolean;
      readonly storeKey: string;
    })
  | (ConditionIdentity & BuffStackConditionSource)
  | (ConditionIdentity & {
      readonly kind: 'entityTag';
      readonly targetSource: string;
      readonly targetGroupKey: string;
      readonly tagQueryType: TagQueryType;
      readonly tagIds: readonly number[];
    })
  | (ConditionIdentity & {
      readonly kind: 'damageGameplayTag';
      readonly queryType: TagQueryType;
      readonly tagIds: readonly number[];
    })
  | (ConditionIdentity & {
      readonly kind: 'timedMarker';
      readonly targetSource: string;
      readonly targetGroupKey: string;
      readonly markerId: string;
      readonly blackboardKey: string;
      readonly useBlackboardKey: boolean;
      readonly returnTrueIfNotExists: boolean;
    })
  | (ConditionIdentity & {
      readonly kind: 'health';
      readonly targetSource: string;
      readonly targetGroupKey: string;
      readonly comparison: string;
      readonly isRatio: boolean;
      readonly value: ScalarSource;
      readonly characterTeamSelection: CharacterTeamSelectionSource | null;
    })
  | (ConditionIdentity & { readonly kind: 'probability'; readonly value: ScalarSource })
  | (ConditionIdentity & {
      readonly kind: 'skillType';
      readonly checkTargetCurrentSkill?: boolean;
      readonly skillOwner?: TargetReferenceSource;
      readonly mustBeforeExclusiveTime?: boolean;
      readonly skillTypes: readonly string[];
      readonly attackTypeMask?: AttackTypeMaskSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'skillId';
      readonly skillIds: readonly StringScalarSource[];
    })
  | (ConditionIdentity & {
      readonly kind: 'skillInterruptReason';
      readonly reasons: readonly string[];
    })
  | (ConditionIdentity & {
      /** 当前事件载荷携带的来源技能类型；普通攻击还受原生三位攻击类型掩码约束。 */
      readonly kind: 'originSkillType';
      readonly skillTypes: readonly string[];
      readonly attackTypeMask: AttackTypeMaskSource;
    })
  | (ConditionIdentity & {
      /** OnObtainAtb 事件携带的原始获取类型与方式筛选。 */
      readonly kind: 'obtainAtbType';
      readonly checkObtainType: boolean;
      readonly obtainTypes: readonly string[];
      readonly checkObtainMethod: boolean;
      readonly obtainMethods: readonly string[];
    })
  | (ConditionIdentity & {
      readonly kind: 'targetIdentity';
      readonly first: TargetReferenceSource;
      readonly second: TargetReferenceSource;
    })
  | (ConditionIdentity & {
      /** parent 目标集合是否包含 child 集合中的全部目标。 */
      readonly kind: 'targetContains';
      readonly parent: TargetReferenceSource;
      readonly child: TargetReferenceSource;
    })
  | (ConditionIdentity & {
      /** 只查询客户端相机视口；没有黑板写回或其他业务载荷。 */
      readonly kind: 'targetInScreen';
      readonly target: TargetReferenceSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'objectTypeMatch';
      readonly target: TargetReferenceSource;
      readonly objectTypeMask: string | number;
    })
  | (ConditionIdentity & { readonly kind: 'damageType'; readonly damageType: DamageElement })
  | (ConditionIdentity & {
      readonly kind: 'damageTypeMask';
      readonly damageTypes: readonly string[];
    })
  | (ConditionIdentity & {
      readonly kind: 'inflictionType';
      readonly elements: readonly string[];
      readonly savedKey: string;
    })
  | (ConditionIdentity & {
      /** 物理异常事件上下文的 0..3 类型位集；非空 savedKey 尚未进入运行投影。 */
      readonly kind: 'physicalInflictionType';
      readonly types: readonly PhysicalInflictionType[];
      readonly savedKey: string;
    })
  | (ConditionIdentity & {
      readonly kind: 'deckAttributeCompare';
      readonly targetSource: string;
      readonly targetGroupKey: string;
      readonly leftAttribute: string;
      readonly leftValue: ScalarSource;
      readonly comparison: string;
      readonly rightAttribute: string;
      readonly rightValue: ScalarSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'abilityEntityDuration';
      readonly target: TargetReferenceSource;
      readonly comparison: string;
      readonly value: ScalarSource;
      readonly saveCurrentDuration: boolean;
      readonly outputKey: string;
    })
  | (ConditionIdentity & {
      readonly kind: 'damageDecorateMask';
      readonly checkType: string;
      readonly mask: number;
    })
  | (ConditionIdentity & {
      readonly kind: 'healTag';
      readonly queryType: TagQueryType;
      readonly tagIds: readonly number[];
    })
  | (ConditionIdentity & {
      readonly kind: 'overHeal';
      readonly overHealKey: string;
      readonly finalHealKey: string;
      readonly realHealKey: string;
    })
  | (ConditionIdentity & {
      readonly kind: 'contextBuff';
      readonly matcher:
        | {
            readonly kind: 'id';
            readonly buffIds: readonly (
              | { readonly kind: 'constant'; readonly value: string }
              | { readonly kind: 'blackboard'; readonly key: string }
            )[];
          }
        | {
            readonly kind: 'tag';
            readonly queryType: TagQueryType;
            readonly buffTagIds: readonly number[];
          };
      readonly buffIdOutputKey?: string;
    })
  | (ConditionIdentity & {
      /** OnConsumeBuff 事件保存的消费层数；命中后可写入动作黑板。 */
      readonly kind: 'consumeBuffLayer';
      readonly comparison: string;
      readonly value: ScalarSource;
      readonly outputKey: string;
    })
  | (ConditionIdentity & {
      readonly kind: 'globalCooldown';
      readonly targetSource: string;
      readonly targetGroupKey: string;
      readonly buffId: string;
    })
  | (ConditionIdentity & { readonly kind: 'skillHasHit' })
  | (ConditionIdentity & {
      readonly kind: 'comboSkillPending';
      readonly owner: TargetReferenceSource;
    })
  | (ConditionIdentity & { readonly kind: 'skillCastId' })
  | (ConditionIdentity & {
      readonly kind: 'enemyRank';
      readonly target: TargetReferenceSource;
      readonly rankMask: number;
    })
  | (ConditionIdentity & {
      readonly kind: 'superArmor';
      readonly target: TargetReferenceSource;
      readonly comparison: string;
      readonly value: ScalarSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'twoDirectionAngle';
      readonly dir1Source: TargetReferenceSource;
      readonly dir1Target: TargetReferenceSource;
      readonly dir1DirectionType: string;
      readonly dir2Source: TargetReferenceSource;
      readonly dir2Target: TargetReferenceSource;
      readonly dir2DirectionType: string;
      readonly comparison: string;
      readonly value: ScalarSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'targetAngle';
      readonly origin: TargetReferenceSource;
      readonly target: TargetReferenceSource;
      readonly angleType: string;
      readonly angle: ScalarSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'poise';
      readonly target: TargetReferenceSource;
      readonly returnValueIfMissing: boolean;
      readonly comparison: string;
      readonly value: ScalarSource;
    })
  | (ConditionIdentity & {
      readonly kind: 'any';
      readonly groups: readonly ConditionAnyGroupSource[];
    });

export interface ConditionAnyGroupSource {
  readonly conditions: readonly NativeConditionSource[];
  readonly negated: readonly boolean[];
}

export interface BuffStackConditionSource {
  readonly kind: 'buffStack';
  readonly targetSource: string;
  readonly targetGroupKey: string;
  readonly buffCheckType: string;
  readonly buffIds: readonly string[];
  readonly tagQueryType: TagQueryType;
  readonly buffTagIds: readonly number[];
  readonly countType: string;
  readonly comparison: string;
  readonly value: ScalarSource;
  readonly limitSkillCastId: boolean;
}

/**
 * 解析一个原生条件叶子。该函数不产生 `supported` 判断，也不执行单敌人场景折叠。
 * 尚未迁移的条件会携带原生类型和字段路径明确失败。
 */
export function parseConditionLeafSource(
  value: unknown,
  path: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeConditionSource {
  const condition = requireRecord(value, path);
  const sourceType = typeof condition.$type === 'string' ? nativeActionName(condition.$type) : '';

  switch (sourceType) {
    case 'CheckProjectileInPerfectDodgeCd':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'isInCd',
        ]),
        path,
      );
      return {
        kind: 'projectilePerfectDodgeCooldown',
        sourceType,
        isInCooldown: requireBoolean(condition.isInCd, `${path}.isInCd`),
      };
    case 'CheckProjectileIgnoreImmuneLevel':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'checkType',
          'ignoreImmuneLevel',
        ]),
        path,
      );
      return {
        kind: 'projectileIgnoreImmuneLevel',
        sourceType,
        comparison: requireNonEmptyString(condition.checkType, `${path}.checkType`),
        level: parseProjectileIgnoreImmuneLevel(
          condition.ignoreImmuneLevel,
          `${path}.ignoreImmuneLevel`,
        ),
      };
    case 'CheckPerfectDodgeDirection': {
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'dirType',
        ]),
        path,
      );
      const direction = requireNonEmptyString(condition.dirType, `${path}.dirType`);
      if (direction !== 'Forward' && direction !== 'Backward')
        throw new Error(`${path}.dirType: unsupported perfect-dodge direction ${direction}`);
      return { kind: 'perfectDodgeDirection', sourceType, direction };
    }
    case 'CheckDamageIgnoreImmuneLevel':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'checkType',
          'ignoreImmuneLevel',
        ]),
        path,
      );
      return {
        kind: 'damageIgnoreImmuneLevel',
        sourceType,
        comparison: requireNonEmptyString(condition.checkType, `${path}.checkType`),
        level: requireInteger(condition.ignoreImmuneLevel, `${path}.ignoreImmuneLevel`),
      };
    case 'ReturnFalseAction':
      requireExactFields(
        condition,
        new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
        path,
      );
      return { kind: 'constant', sourceType, value: false };
    case 'CheckCustomAbilityEvent':
      return { sourceType, ...parseCheckCustomAbilityEventSource(value, path) };
    case 'CheckHasMoveInput':
      requireExactFields(
        condition,
        new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
        path,
      );
      return { kind: 'moveInput', sourceType };
    case 'CheckSkillCameraMotionFree':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'editPrefabName',
          'cameraAnimKey',
        ]),
        path,
      );
      return {
        kind: 'skillCameraMotionFree',
        sourceType,
        editPrefabName: requireString(condition.editPrefabName, `${path}.editPrefabName`),
        cameraAnimationKey: requireNonEmptyString(condition.cameraAnimKey, `${path}.cameraAnimKey`),
      };
    case 'CheckComboSkillCameraAlphaSetting':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'desiredAlphaSetting',
        ]),
        path,
      );
      return {
        kind: 'comboCameraAlphaSetting',
        sourceType,
        desiredSetting: requireNonEmptyString(
          condition.desiredAlphaSetting,
          `${path}.desiredAlphaSetting`,
        ),
      };
    case 'CheckSquadInFight':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'invertCondition',
        ]),
        path,
      );
      return {
        kind: 'squadInFight',
        sourceType,
        inverted: requireBoolean(condition.invertCondition, `${path}.invertCondition`),
      };
    case 'CheckDungeonCategory':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'needDetailedConfig',
          'dungeonCategoryList',
          'returnTrueWhenInList',
        ]),
        path,
      );
      return {
        kind: 'dungeonCategory',
        sourceType,
        needDetailedConfig: requireBoolean(
          condition.needDetailedConfig,
          `${path}.needDetailedConfig`,
        ),
        dungeonCategories: requireArray(
          condition.dungeonCategoryList,
          `${path}.dungeonCategoryList`,
        ).map((value, index) =>
          requireNonEmptyString(value, `${path}.dungeonCategoryList[${index}]`),
        ),
        returnTrueWhenInList: requireBoolean(
          condition.returnTrueWhenInList,
          `${path}.returnTrueWhenInList`,
        ),
      };
    case 'CheckCurHpRatio':
      requireExactFields(condition, new Set(['$type', 'compareType', 'value']), path);
      return {
        kind: 'currentHpRatio',
        sourceType,
        comparison: readCompareType(condition.compareType, `${path}.compareType`),
        value: parseScalarSource(condition.value, `${path}.value`, inheritedBlackboard),
      };
    case 'OrConditionAction':
      return parseAnyCondition(condition, path, sourceType, inheritedBlackboard);
    case 'CompareFloat':
      return {
        kind: 'floatCompare',
        sourceType,
        comparison: readCompareType(condition.compare, `${path}.compare`),
        left: parseScalarSource(condition.valueA, `${path}.valueA`, inheritedBlackboard),
        right: parseScalarSource(condition.valueB, `${path}.valueB`, inheritedBlackboard),
      };
    case 'CompareString':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'valueA',
          'valueB',
        ]),
        path,
      );
      return {
        kind: 'stringCompare',
        sourceType,
        left: parseStringScalarSource(condition.valueA, `${path}.valueA`),
        right: parseStringScalarSource(condition.valueB, `${path}.valueB`),
      };
    case 'CheckMainCharacterCondition':
      return parseMainOperator(condition, path, sourceType);
    case 'CheckProfession': {
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'checkTarget',
          'professionCategories',
        ]),
        path,
      );
      const roles = requireNonEmptyString(
        condition.professionCategories,
        `${path}.professionCategories`,
      )
        .split(',')
        .map(value => projectProfessionRole(value.trim(), `${path}.professionCategories`));
      if (new Set(roles).size !== roles.length) {
        throw new Error(`${path}.professionCategories: duplicate profession category`);
      }
      return {
        kind: 'profession',
        sourceType,
        target: parseTargetReferenceSource(condition.checkTarget, `${path}.checkTarget`),
        roles,
      };
    }
    case 'CheckDistanceCondition':
      return {
        kind: 'distance',
        sourceType,
        source: parseTargetReferenceSource(condition.source, `${path}.source`),
        target: parseTargetReferenceSource(condition.target, `${path}.target`),
        distance: requireNumber(condition.distance, `${path}.distance`),
        lessThan: requireBoolean(condition.lessThan, `${path}.lessThan`),
        includeTargetRadius: requireBoolean(
          condition.includeTargetRadius,
          `${path}.includeTargetRadius`,
        ),
        containsHittableObject: requireBoolean(
          condition.containsHittableObj,
          `${path}.containsHittableObj`,
        ),
      };
    case 'CheckEntityNum':
      return parseEntityCount(condition, path, sourceType);
    case 'CheckBuffStackNum':
      return parseSimpleBuffStack(condition, path, sourceType, inheritedBlackboard);
    case 'CheckBuffStackNumAdvanced':
      return parseAdvancedBuffStack(condition, path, sourceType, inheritedBlackboard);
    case 'CheckBuffStackNumByTag':
      return parseTagBuffStack(condition, path, sourceType, inheritedBlackboard);
    case 'CheckTagMatch':
      return parseEntityTag(condition, path, sourceType);
    case 'CheckTimedMarkerCondition':
      return parseTimedMarker(condition, path, sourceType);
    case 'CheckHp':
      return parseHealth(condition, path, sourceType, inheritedBlackboard);
    case 'Probablity':
      return {
        kind: 'probability',
        sourceType,
        value: parseScalarSource(condition.prob, `${path}.prob`, inheritedBlackboard),
      };
    case 'CheckSkillType':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'checkTargetCurSkill',
          'skillOwner',
          'mustBeforeExclusiveTime',
          'skillTypeList',
          'attackTypeMask',
        ]),
        path,
      );
      return {
        kind: 'skillType',
        sourceType,
        checkTargetCurrentSkill: requireBoolean(
          condition.checkTargetCurSkill,
          `${path}.checkTargetCurSkill`,
        ),
        skillOwner: parseTargetReferenceSource(condition.skillOwner, `${path}.skillOwner`),
        mustBeforeExclusiveTime: requireBoolean(
          condition.mustBeforeExclusiveTime,
          `${path}.mustBeforeExclusiveTime`,
        ),
        skillTypes: requireArray(condition.skillTypeList, `${path}.skillTypeList`).map(
          (item, index) => readSkillType(item, `${path}.skillTypeList[${index}]`),
        ),
        attackTypeMask: parseAttackTypeMaskSource(
          condition.attackTypeMask,
          `${path}.attackTypeMask`,
        ),
      };
    case 'CheckSkillId':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'skillIdList',
        ]),
        path,
      );
      return {
        sourceType,
        kind: 'skillId',
        skillIds: requireArray(condition.skillIdList, `${path}.skillIdList`).map((item, index) =>
          parseStringScalarSource(item, `${path}.skillIdList[${index}]`),
        ),
      };
    case 'CheckSkillInterruptReason':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'reasonList',
        ]),
        path,
      );
      return {
        sourceType,
        kind: 'skillInterruptReason',
        reasons: requireArray(condition.reasonList, `${path}.reasonList`).map((item, index) =>
          requireNonEmptyString(item, `${path}.reasonList[${index}]`),
        ),
      };
    case 'CheckOriginSkillType':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'skillTypeList',
          'attackTypeMask',
        ]),
        path,
      );
      return {
        kind: 'originSkillType',
        sourceType,
        skillTypes: requireArray(condition.skillTypeList, `${path}.skillTypeList`).map(
          (item, index) => readSkillType(item, `${path}.skillTypeList[${index}]`),
        ),
        attackTypeMask: parseAttackTypeMaskSource(
          condition.attackTypeMask,
          `${path}.attackTypeMask`,
        ),
      };
    case 'CheckObtainAtbType':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'checkObtainType',
          'obtainTypeList',
          'checkObtainMethod',
          'obtainMethodList',
        ]),
        path,
      );
      return {
        kind: 'obtainAtbType',
        sourceType,
        checkObtainType: requireBoolean(condition.checkObtainType, `${path}.checkObtainType`),
        obtainTypes: requireArray(condition.obtainTypeList, `${path}.obtainTypeList`).map(
          (item, index) => readAtbObtainType(item, `${path}.obtainTypeList[${index}]`),
        ),
        checkObtainMethod: requireBoolean(condition.checkObtainMethod, `${path}.checkObtainMethod`),
        obtainMethods: requireArray(condition.obtainMethodList, `${path}.obtainMethodList`).map(
          (item, index) => readAtbObtainMethod(item, `${path}.obtainMethodList[${index}]`),
        ),
      };
    case 'CheckTargetsEqual':
      return {
        kind: 'targetIdentity',
        sourceType,
        first: parseTargetReferenceSource(
          condition.firstTargetSettings,
          `${path}.firstTargetSettings`,
        ),
        second: parseTargetReferenceSource(
          condition.secondTargetSettings,
          `${path}.secondTargetSettings`,
        ),
      };
    case 'CheckTargetContains':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'parentTargetSettings',
          'childTargetSettings',
        ]),
        path,
      );
      return {
        kind: 'targetContains',
        sourceType,
        parent: parseTargetReferenceSource(
          condition.parentTargetSettings,
          `${path}.parentTargetSettings`,
        ),
        child: parseTargetReferenceSource(
          condition.childTargetSettings,
          `${path}.childTargetSettings`,
        ),
      };
    case 'CheckTargetInScreen':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'targetSettings',
        ]),
        path,
      );
      return {
        kind: 'targetInScreen',
        sourceType,
        target: parseTargetReferenceSource(condition.targetSettings, `${path}.targetSettings`),
      };
    case 'CheckObjectTypeMatch': {
      const mask = condition.objectTypeMask;
      if ((typeof mask !== 'string' && typeof mask !== 'number') || typeof mask === 'boolean') {
        throw new Error(`${path}.objectTypeMask: expected flags`);
      }
      return {
        kind: 'objectTypeMatch',
        sourceType,
        target: parseTargetReferenceSource(condition.target, `${path}.target`),
        objectTypeMask: mask,
      };
    }
    case 'CheckDamageType':
      return parseDamageType(condition, path, sourceType);
    case 'CheckDamageTypeMask': {
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'damageTypeMask',
        ]),
        path,
      );
      const damageTypes = requireNonEmptyString(condition.damageTypeMask, `${path}.damageTypeMask`)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
      if (damageTypes.length === 0) throw new Error(`${path}.damageTypeMask: empty mask`);
      return { kind: 'damageTypeMask', sourceType, damageTypes };
    }
    case 'CheckSpellInflictionType':
      return parseInflictionType(condition, path, sourceType);
    case 'CheckPhysicalInflictionType':
      return {
        kind: 'physicalInflictionType',
        sourceType,
        types: parsePhysicalInflictionMask(condition.mask, `${path}.mask`),
        savedKey: requireString(condition.savedKey, `${path}.savedKey`),
      };
    case 'CompareDeckAttr':
      return parseDeckAttribute(condition, path, sourceType, inheritedBlackboard);
    case 'CheckAbilityEntityCurDuration':
      return {
        kind: 'abilityEntityDuration',
        sourceType,
        target: parseTargetReferenceSource(condition.abilityEntity, `${path}.abilityEntity`),
        comparison: requireNonEmptyString(condition.compareType, `${path}.compareType`),
        value: parseScalarSource(condition.value, `${path}.value`, inheritedBlackboard),
        saveCurrentDuration: requireBoolean(condition.saveCurDuration, `${path}.saveCurDuration`),
        outputKey: requireString(condition.bbKey, `${path}.bbKey`),
      };
    case 'CheckDamageDecorateMask':
      return {
        kind: 'damageDecorateMask',
        sourceType,
        checkType: readDamageDecorateMaskCheckType(condition.checkType, `${path}.checkType`),
        mask: requireNonNegativeInteger(condition.mask, `${path}.mask`),
      };
    case 'CheckDamageTag':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'queryType',
          'tags',
        ]),
        path,
      );
      return {
        kind: 'damageGameplayTag',
        sourceType,
        queryType: projectNativeTagQueryType(condition.queryType, `${path}.queryType`),
        tagIds: parseTagIdsSource(condition.tags, `${path}.tags`),
      };
    case 'CheckHealTag': {
      const query = parseTagQuerySource(condition.query, `${path}.query`);
      return { kind: 'healTag', sourceType, queryType: query.queryType, tagIds: query.tagIds };
    }
    case 'CheckOverHeal':
      return {
        kind: 'overHeal',
        sourceType,
        overHealKey: requireString(condition.overHealKey, `${path}.overHealKey`),
        finalHealKey: requireString(condition.finalHealKey, `${path}.finalHealKey`),
        realHealKey: requireString(condition.realHealKey, `${path}.realHealKey`),
      };
    case 'CheckBuffIdInContext':
      return parseContextBuff(condition, path, sourceType);
    case 'CheckBuffIdInContextAdvanced':
      return parseAdvancedContextBuff(condition, path, sourceType);
    case 'CheckConsumeBuffLayer':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'num',
          'compareType',
          'storeKey',
        ]),
        path,
      );
      return {
        kind: 'consumeBuffLayer',
        sourceType,
        comparison: requireNonEmptyString(condition.compareType, `${path}.compareType`),
        value: parseScalarSource(condition.num, `${path}.num`, inheritedBlackboard),
        outputKey: requireString(condition.storeKey, `${path}.storeKey`),
      };
    case 'CheckGlobalCDTimerAction': {
      const target = requireRecord(condition.target, `${path}.target`);
      return {
        kind: 'globalCooldown',
        sourceType,
        targetSource: readTargetSource(target.targetSource, `${path}.target.targetSource`),
        targetGroupKey: requireString(target.targetGroupKey, `${path}.target.targetGroupKey`),
        buffId: requireNonEmptyString(condition.buffId, `${path}.buffId`),
      };
    }
    case 'CheckSkillHasHit':
      return { kind: 'skillHasHit', sourceType };
    case 'CheckComboSkillPending':
      requireExactFields(
        condition,
        new Set([
          '$type',
          'isEnable',
          'priorityLevel',
          'priorityOffset',
          'serverActionIndex',
          'owner',
        ]),
        path,
      );
      return {
        kind: 'comboSkillPending',
        sourceType,
        owner: parseTargetReferenceSource(condition.owner, `${path}.owner`),
      };
    case 'CheckSkillCastId':
      requireExactFields(
        condition,
        new Set(['$type', 'isEnable', 'priorityLevel', 'priorityOffset', 'serverActionIndex']),
        path,
      );
      return { kind: 'skillCastId', sourceType };
    case 'CheckEnemyRank':
      return {
        kind: 'enemyRank',
        sourceType,
        target: parseTargetReferenceSource(condition.target, `${path}.target`),
        rankMask: parseEnemyRankMask(condition.enemyRankSet, `${path}.enemyRankSet`),
      };
    case 'CheckSuperArmor':
      return parseScalarTargetCondition(
        'superArmor',
        sourceType,
        condition,
        path,
        'checkTarget',
        'compareType',
        inheritedBlackboard,
      );
    case 'CheckTwoDirectionAngle':
      return parseTwoDirectionAngle(condition, path, sourceType, inheritedBlackboard);
    case 'CheckTargetAngle':
      return {
        kind: 'targetAngle',
        sourceType,
        origin: parseTargetReferenceSource(condition.origin, `${path}.origin`),
        target: parseTargetReferenceSource(condition.target, `${path}.target`),
        angleType: requireNonEmptyString(condition.angleType, `${path}.angleType`),
        angle: parseScalarSource(condition.angle, `${path}.angle`, inheritedBlackboard),
      };
    case 'CheckPoiseValue':
      return {
        kind: 'poise',
        sourceType,
        target: parseTargetReferenceSource(condition.poiseOwner, `${path}.poiseOwner`),
        returnValueIfMissing: requireBoolean(
          condition.returnValueIfDontHavePoise,
          `${path}.returnValueIfDontHavePoise`,
        ),
        comparison: requireNonEmptyString(condition.compare, `${path}.compare`),
        value: parseScalarSource(condition.value, `${path}.value`, inheritedBlackboard),
      };
    default:
      throw new Error(`${path}: condition parser has not migrated ${JSON.stringify(sourceType)}`);
  }
}

/** 原生 ProjectileIgnoreImmuneLevel 的三个顺序枚举值。 */
function parseProjectileIgnoreImmuneLevel(value: unknown, path: string): number {
  if (typeof value === 'number') return requireInteger(value, path);
  const name = requireNonEmptyString(value, path);
  const level = {
    Default: 0,
    IgnorePerfectDodgeListener: 1,
    IgnoreDashImmune: 2,
  }[name];
  if (level === undefined) throw new Error(`${path}: unsupported projectile immune level ${name}`);
  return level;
}

function projectProfessionRole(value: string, path: string): OperatorRole {
  const roles: Readonly<Record<string, OperatorRole>> = {
    Guard: 'guard',
    Caster: 'caster',
    Defender: 'defender',
    Vanguard: 'vanguard',
    Supporter: 'supporter',
    Assault: 'striker',
  };
  const role = roles[value];
  if (role === undefined) throw new Error(`${path}: unknown ProfessionCategory '${value}'`);
  return role;
}

function parsePhysicalInflictionMask(
  value: unknown,
  path: string,
): readonly PhysicalInflictionType[] {
  const names = requireNonEmptyString(value, path)
    .split(',')
    .map(item => item.trim());
  const mapping = {
    Airborne: 'airborne',
    KnockDown: 'knockDown',
    Fracture: 'fracture',
    Crush: 'crush',
  } as const satisfies Readonly<Record<string, PhysicalInflictionType>>;
  return names.map(name => {
    const type = mapping[name as keyof typeof mapping];
    if (type === undefined) throw new Error(`${path}: unknown physical infliction flag '${name}'`);
    return type;
  });
}

function parseMainOperator(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
): NativeConditionSource {
  const target = requireRecord(condition.checkTarget, `${path}.checkTarget`);
  return {
    kind: 'mainOperator',
    sourceType,
    targetSource: readTargetSource(target.targetSource, `${path}.checkTarget.targetSource`),
    targetGroupKey: requireString(target.targetGroupKey, `${path}.checkTarget.targetGroupKey`),
  };
}

function parseEntityCount(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
): NativeConditionSource {
  const target = requireRecord(condition.checkTarget, `${path}.checkTarget`);
  const parsedTarget =
    'selectorOwner' in target
      ? parseTargetReferenceSource(condition.checkTarget, `${path}.checkTarget`)
      : undefined;
  return {
    kind: 'entityCount',
    sourceType,
    ...(parsedTarget === undefined ? {} : { target: parsedTarget }),
    targetSource: readTargetSource(target.targetSource, `${path}.checkTarget.targetSource`),
    targetGroupKey: requireString(target.targetGroupKey, `${path}.checkTarget.targetGroupKey`),
    minimumCount: requireInteger(condition.minNum, `${path}.minNum`),
    comparison: readCompareType(condition.compareType, `${path}.compareType`),
    containsHittableTarget: requireBoolean(
      condition.containsHittableTarget,
      `${path}.containsHittableTarget`,
    ),
    excludeDeadEntity: requireBoolean(condition.excludeDeadEntity, `${path}.excludeDeadEntity`),
    storeKey: requireString(condition.storeKey, `${path}.storeKey`),
  };
}

function parseSimpleBuffStack(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeConditionSource {
  const buff = requireRecord(condition.buffId, `${path}.buffId`);
  return createBuffStack(
    condition,
    path,
    sourceType,
    inheritedBlackboard,
    'Id',
    [requireNonEmptyString(buff.buffId, `${path}.buffId.buffId`)],
    'hasAny',
    [],
    'BuffCount',
    false,
  );
}

function parseAdvancedBuffStack(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeConditionSource {
  const settings = parseBuffFindSettings(condition.buffSettings, `${path}.buffSettings`);
  return createBuffStack(
    condition,
    path,
    sourceType,
    inheritedBlackboard,
    settings.checkType,
    settings.buffIds,
    settings.tagQueryType,
    settings.buffTagIds,
    readBuffStackNumType(condition.buffStackNumType, `${path}.buffStackNumType`),
    requireBoolean(condition.limitSkillCastId, `${path}.limitSkillCastId`),
  );
}

function parseTagBuffStack(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeConditionSource {
  const query = parseTagQuerySource(condition.tagQuery, `${path}.tagQuery`);
  return createBuffStack(
    condition,
    path,
    sourceType,
    inheritedBlackboard,
    'Tag',
    [],
    query.queryType,
    query.tagIds,
    readBuffStackNumType(condition.buffStackNumType, `${path}.buffStackNumType`),
    false,
  );
}

function createBuffStack(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
  inheritedBlackboard: BlackboardLevelValues,
  buffCheckType: string,
  buffIds: readonly string[],
  tagQueryType: TagQueryType,
  buffTagIds: readonly number[],
  countType: string,
  limitSkillCastId: boolean,
): NativeConditionSource {
  const target = requireRecord(condition.checkTarget, `${path}.checkTarget`);
  return {
    kind: 'buffStack',
    sourceType,
    targetSource: readTargetSource(target.targetSource, `${path}.checkTarget.targetSource`),
    targetGroupKey: requireString(target.targetGroupKey, `${path}.checkTarget.targetGroupKey`),
    buffCheckType,
    buffIds,
    tagQueryType,
    buffTagIds,
    countType,
    comparison: readCompareType(condition.compareType, `${path}.compareType`),
    value: parseScalarSource(condition.value, `${path}.value`, inheritedBlackboard),
    limitSkillCastId,
  };
}

function parseEntityTag(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
): NativeConditionSource {
  const target = requireRecord(condition.checkTarget, `${path}.checkTarget`);
  const query = parseTagQuerySource(condition.query, `${path}.query`);
  return {
    kind: 'entityTag',
    sourceType,
    targetSource: readTargetSource(target.targetSource, `${path}.checkTarget.targetSource`),
    targetGroupKey: requireString(target.targetGroupKey, `${path}.checkTarget.targetGroupKey`),
    tagQueryType: query.queryType,
    tagIds: query.tagIds,
  };
}

function parseTimedMarker(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
): NativeConditionSource {
  const target = requireRecord(condition.checkTarget, `${path}.checkTarget`);
  return {
    kind: 'timedMarker',
    sourceType,
    targetSource: readTargetSource(target.targetSource, `${path}.checkTarget.targetSource`),
    targetGroupKey: requireString(target.targetGroupKey, `${path}.checkTarget.targetGroupKey`),
    markerId: requireString(condition.id, `${path}.id`),
    blackboardKey: requireString(condition.blackboardKey, `${path}.blackboardKey`),
    useBlackboardKey: requireBoolean(condition.useBlackboardKey, `${path}.useBlackboardKey`),
    returnTrueIfNotExists: requireBoolean(
      condition.returnTrueIfNotExists,
      `${path}.returnTrueIfNotExists`,
    ),
  };
}

function parseHealth(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeConditionSource {
  const target = requireRecord(condition.hpOwner, `${path}.hpOwner`);
  const targetSource = readTargetSource(target.targetSource, `${path}.hpOwner.targetSource`);
  return {
    kind: 'health',
    sourceType,
    targetSource,
    targetGroupKey: requireString(target.targetGroupKey, `${path}.hpOwner.targetGroupKey`),
    comparison: requireNonEmptyString(condition.compare, `${path}.compare`),
    isRatio: requireBoolean(condition.isRatio, `${path}.isRatio`),
    value: parseScalarSource(condition.value, `${path}.value`, inheritedBlackboard),
    characterTeamSelection:
      targetSource === 'InstantSearch'
        ? parseCharacterTeamSelection(target.selectorData, `${path}.hpOwner.selectorData`)
        : null,
  };
}

function parseAnyCondition(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeConditionSource {
  const groups: ConditionAnyGroupSource[] = [];
  requireArray(condition.conditionList, `${path}.conditionList`).forEach((rawGroup, groupIndex) => {
    const groupPath = `${path}.conditionList[${groupIndex}]`;
    const group = requireRecord(rawGroup, groupPath);
    requireExactFields(
      group,
      new Set(['actionData', 'onlyExecuteWhenSourceIsMainChar', 'onlyExecuteWhenSourceIsGuard']),
      groupPath,
    );
    if (group.onlyExecuteWhenSourceIsMainChar !== false) {
      throw new Error(`${groupPath}: main-character-only OR groups are unsupported`);
    }
    if (group.onlyExecuteWhenSourceIsGuard !== false) {
      throw new Error(`${groupPath}: guard-only OR groups are unsupported`);
    }

    const conditions: NativeConditionSource[] = [];
    const negated: boolean[] = [];
    let negateNext = false;
    requireArray(group.actionData, `${groupPath}.actionData`).forEach((rawItem, index) => {
      const itemPath = `${groupPath}.actionData[${index}]`;
      const item = requireRecord(rawItem, itemPath);
      if (item.isEnable === false) return;
      const itemType = typeof item.$type === 'string' ? nativeActionName(item.$type) : '';
      if (itemType === 'NotNextCheckAction') {
        if (negateNext) {
          throw new Error(`${itemPath}: consecutive NotNextCheckAction is unsupported`);
        }
        negateNext = true;
        return;
      }
      conditions.push(parseConditionLeafSource(item, itemPath, inheritedBlackboard));
      negated.push(negateNext);
      negateNext = false;
    });
    if (negateNext) throw new Error(`${groupPath}: dangling NotNextCheckAction`);
    if (conditions.length > 0) groups.push({ conditions, negated });
  });
  if (groups.length === 0) throw new Error(`${path}: OrConditionAction has no non-empty groups`);
  return { kind: 'any', sourceType, groups };
}

function parseDamageType(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
): NativeConditionSource {
  const nativeType = requireNonEmptyString(condition.damageType, `${path}.damageType`);
  const damageType = projectNativeDamageElement(nativeType, `${path}.damageType`);
  return { kind: 'damageType', sourceType, damageType };
}

function parseInflictionType(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
): NativeConditionSource {
  // 同版本 CheckSpellInflictionEnum 位集；0 合法，All=15。MemoryPack 为数字，JSON 可命名。
  const mask = condition.mask;
  const numeric =
    typeof mask === 'number'
      ? mask
      : typeof mask === 'string' && /^\d+$/.test(mask.trim())
        ? Number(mask)
        : null;
  const names = ['Fire', 'Pulse', 'Cryst', 'Natural'];
  if (numeric !== null && (!Number.isInteger(numeric) || numeric < 0 || numeric > 15))
    throw new Error(`${path}.mask: unsupported value ${JSON.stringify(mask)}`);
  const nativeElements =
    numeric === null
      ? requireNonEmptyString(mask, `${path}.mask`)
          .split(',')
          .map(item => item.trim())
          .flatMap(item => (item === 'All' ? names : [item]))
      : names.filter((_, index) => (numeric & (1 << index)) !== 0);
  const elements = [
    ...new Set(nativeElements.map(item => projectNativeDamageElement(item, `${path}.mask`))),
  ];
  if (elements.includes('physical')) {
    throw new Error(`${path}.mask: unsupported value ${JSON.stringify(condition.mask)}`);
  }
  return {
    kind: 'inflictionType',
    sourceType,
    elements: elements as string[],
    savedKey: requireString(condition.savedKey, `${path}.savedKey`),
  };
}

function parseDeckAttribute(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeConditionSource {
  const target = parseTargetReferenceSource(condition.target, `${path}.target`);
  return {
    kind: 'deckAttributeCompare',
    sourceType,
    targetSource: target.targetSource,
    targetGroupKey: target.targetGroupKey,
    leftAttribute: requireNonEmptyString(condition.lhsType, `${path}.lhsType`),
    leftValue: parseScalarSource(condition.lhsValue, `${path}.lhsValue`, inheritedBlackboard),
    comparison: requireNonEmptyString(condition.compare, `${path}.compare`),
    rightAttribute: requireNonEmptyString(condition.rhsType, `${path}.rhsType`),
    rightValue: parseScalarSource(condition.rhsValue, `${path}.rhsValue`, inheritedBlackboard),
  };
}

function parseContextBuff(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
): NativeConditionSource {
  const checkType = requireNonEmptyString(condition.checkType, `${path}.checkType`);
  const rawBuffIds = requireArray(condition.buffIdList, `${path}.buffIdList`);
  const blackboardKey = requireString(condition.blackboardKey, `${path}.blackboardKey`);
  let matcher: Extract<NativeConditionSource, { readonly kind: 'contextBuff' }>['matcher'];
  if (checkType === 'Id') {
    matcher = {
      kind: 'id',
      buffIds: rawBuffIds.map((rawBuff, index) => {
        const buffPath = `${path}.buffIdList[${index}]`;
        const buff = requireRecord(rawBuff, buffPath);
        return {
          kind: 'constant' as const,
          value: requireNonEmptyString(buff.buffId, `${buffPath}.buffId`),
        };
      }),
    };
  } else if (checkType === 'Tag') {
    // 原生 checkType 是判别字段；Tag 分支忽略 buffIdList 中的序列化残留。
    rawBuffIds.forEach((rawBuff, index) => {
      const buffPath = `${path}.buffIdList[${index}]`;
      const buff = requireRecord(rawBuff, buffPath);
      requireString(buff.buffId, `${buffPath}.buffId`);
    });
    const query = parseTagQuerySource(condition.query, `${path}.query`);
    matcher = { kind: 'tag', queryType: query.queryType, buffTagIds: query.tagIds };
  } else {
    throw new Error(`${path}.checkType: unsupported value ${JSON.stringify(checkType)}`);
  }
  return {
    kind: 'contextBuff',
    sourceType,
    matcher,
    ...(blackboardKey === '' ? {} : { buffIdOutputKey: blackboardKey }),
  };
}

/**
 * Advanced 与基础动作共享同一个判别语义；区别仅在于 ID 项允许从动作黑板取值。
 */
function parseAdvancedContextBuff(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
): NativeConditionSource {
  requireExactFields(
    condition,
    new Set([
      '$type',
      'isEnable',
      'priorityLevel',
      'priorityOffset',
      'serverActionIndex',
      'checkType',
      'buffIdList',
      'query',
      'blackboardKey',
    ]),
    path,
  );
  const checkType = requireNonEmptyString(condition.checkType, `${path}.checkType`);
  const buffIdList = requireArray(condition.buffIdList, `${path}.buffIdList`);
  const parseId = (rawValue: unknown, index: number) => {
    const idPath = `${path}.buffIdList[${index}]`;
    const value = requireRecord(rawValue, idPath);
    requireExactFields(value, new Set(['useBlackboardKey', 'value', 'blackboardKey']), idPath);
    const useBlackboardKey = requireBoolean(value.useBlackboardKey, `${idPath}.useBlackboardKey`);
    const directValue = requireString(value.value, `${idPath}.value`);
    const key = requireString(value.blackboardKey, `${idPath}.blackboardKey`);
    if (useBlackboardKey) {
      return {
        kind: 'blackboard' as const,
        key: requireNonEmptyString(key, `${idPath}.blackboardKey`),
      };
    }
    return { kind: 'constant' as const, value: directValue };
  };
  const blackboardKey = requireString(condition.blackboardKey, `${path}.blackboardKey`);
  let matcher: Extract<NativeConditionSource, { readonly kind: 'contextBuff' }>['matcher'];
  if (checkType === 'Id') {
    matcher = { kind: 'id', buffIds: buffIdList.map(parseId) };
  } else if (checkType === 'Tag') {
    // Tag 分支不读取 BlackboardBuffId，但仍验证其数据外形。
    buffIdList.forEach(parseId);
    const query = parseTagQuerySource(condition.query, `${path}.query`);
    matcher = { kind: 'tag', queryType: query.queryType, buffTagIds: query.tagIds };
  } else {
    throw new Error(`${path}.checkType: unsupported value ${JSON.stringify(checkType)}`);
  }
  return {
    kind: 'contextBuff',
    sourceType,
    matcher,
    ...(blackboardKey === '' ? {} : { buffIdOutputKey: blackboardKey }),
  };
}

function parseEnemyRankMask(value: unknown, path: string): number {
  let result: number;
  if (typeof value === 'number' && Number.isInteger(value)) result = value;
  else if (typeof value === 'string') {
    const bits: Readonly<Record<string, number>> = { Mob: 1, Elite: 2, Boss: 4 };
    const names = value.split(',').map(item => item.trim());
    if (names.length === 0 || names.some(name => !name) || new Set(names).size !== names.length) {
      throw new Error(`${path}: invalid EnemyRankSet names`);
    }
    if (names.some(name => bits[name] === undefined)) {
      throw new Error(`${path}: unknown EnemyRankSet name`);
    }
    result = names.reduce((sum, name) => sum + bits[name]!, 0);
  } else throw new Error(`${path}: expected EnemyRankSet flags`);
  if (result < 0 || (result & ~0b111) !== 0) throw new Error(`${path}: unknown EnemyRankSet bits`);
  return result;
}

function parseScalarTargetCondition(
  kind: 'superArmor',
  sourceType: string,
  condition: Record<string, unknown>,
  path: string,
  targetField: string,
  comparisonField: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeConditionSource {
  return {
    kind,
    sourceType,
    target: parseTargetReferenceSource(condition[targetField], `${path}.${targetField}`),
    comparison: requireNonEmptyString(condition[comparisonField], `${path}.${comparisonField}`),
    value: parseScalarSource(condition.value, `${path}.value`, inheritedBlackboard),
  };
}

function parseTwoDirectionAngle(
  condition: Record<string, unknown>,
  path: string,
  sourceType: string,
  inheritedBlackboard: BlackboardLevelValues,
): NativeConditionSource {
  return {
    kind: 'twoDirectionAngle',
    sourceType,
    dir1Source: parseTargetReferenceSource(condition.dir1Source, `${path}.dir1Source`),
    dir1Target: parseTargetReferenceSource(condition.dir1Target, `${path}.dir1Target`),
    dir1DirectionType: requireNonEmptyString(
      condition.dir1DirectionType,
      `${path}.dir1DirectionType`,
    ),
    dir2Source: parseTargetReferenceSource(condition.dir2Source, `${path}.dir2Source`),
    dir2Target: parseTargetReferenceSource(condition.dir2Target, `${path}.dir2Target`),
    dir2DirectionType: requireNonEmptyString(
      condition.dir2DirectionType,
      `${path}.dir2DirectionType`,
    ),
    comparison: requireNonEmptyString(condition.compareType, `${path}.compareType`),
    value: parseScalarSource(condition.value, `${path}.value`, inheritedBlackboard),
  };
}

export function parseBuffFindSettings(
  value: unknown,
  path: string,
): {
  readonly checkType: string;
  readonly buffIds: readonly string[];
  readonly tagQueryType: TagQueryType;
  readonly buffTagIds: readonly number[];
} {
  const settings = parseBuffFindSettingsSource(value, path);
  return {
    checkType: settings.checkType,
    buffIds: settings.buffIds.filter(Boolean),
    tagQueryType: settings.tagQuery.queryType,
    buffTagIds: settings.tagQuery.tagIds,
  };
}
