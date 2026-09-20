import type { GameplayTag } from '../../../packages/game-data-contract/src/gameplayTags';
import type { ActionBlackboardValue } from '../../../packages/game-data-contract/src/primitives';

/** 编译后生成步骤携带的自包含蓝图；运行时只依赖子技能身份。 */
export interface LogicalAbilityEntityDefinition {
  readonly bornTags?: readonly GameplayTag[];
  readonly blackboard?: Readonly<Record<string, ActionBlackboardValue>>;
  readonly lifetime:
    { readonly kind: 'limited'; readonly durationSeconds: number } | { readonly kind: 'infinite' };
  readonly deathReleaseDelaySeconds?: number;
  readonly maxStackingCount?: number;
  readonly childSkill?: { readonly skillId: string };
}

/** 零空间模型中仍需保持身份的运行时目标；空间点只有临时身份，没有坐标。 */
export type RuntimeTargetRef =
  | { readonly kind: 'operator'; readonly operatorId: string }
  | { readonly kind: 'enemy' }
  | AbilityEntityTargetRef
  | { readonly kind: 'spatialPoint'; readonly pointId: number };

/** 普通能力实体与投射物技能宿主共用的实例句柄。 */
export interface AbilityEntityTargetRef {
  readonly kind: 'abilityEntity';
  readonly instanceId: number;
}

/** Context 目标组只保存稳定句柄；距离与形状不会进入组身份。 */
export type RuntimeTargetGroup = readonly RuntimeTargetRef[];

/** 逻辑能力实体参与通用实体运行时时使用的稳定身份。 */
export function logicalAbilityEntityRuntimeId(instanceId: number): string {
  if (!Number.isInteger(instanceId) || instanceId <= 0) {
    throw new RangeError('AbilityEntity instance id must be a positive integer');
  }
  return `ability-entity:${instanceId}`;
}

/** 解码既有实体身份；不查询活动目录或推断创建关系。 */
export function runtimeTargetFromEntityId(entityId: string): RuntimeTargetRef {
  if (entityId === 'enemy') return { kind: 'enemy' };
  const match = /^ability-entity:([1-9]\d*)$/.exec(entityId);
  if (match !== null) {
    const instanceId = Number(match[1]);
    if (!Number.isSafeInteger(instanceId)) throw new RangeError('invalid ability entity identity');
    return { kind: 'abilityEntity', instanceId };
  }
  return { kind: 'operator', operatorId: entityId };
}

/** OwnerSpawnedEntityFinder 经生成期解析后仍需保留的非空间筛选。 */
export interface OwnerSpawnedAbilityEntityQuery {
  readonly ownerId: string;
  readonly abilityEntityIds?: readonly string[];
  /** 原生 SkillCastIdValidator：只保留同一来源施法生成的实例。 */
  readonly sourceSkillCastId?: number;
}
