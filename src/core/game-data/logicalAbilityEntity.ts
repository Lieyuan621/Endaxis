import type { GameplayTag } from '../../../packages/game-data-contract/src/gameplayTags';
import type {
  ActionBlackboardValue,
  CombatFaction,
} from '../../../packages/game-data-contract/src/primitives';

/** 编译后生成步骤携带的自包含蓝图；运行时只依赖子技能身份。 */
export interface LogicalAbilityEntityDefinition {
  readonly faction?: CombatFaction;
  readonly bornTags?: readonly GameplayTag[];
  readonly blackboard?: Readonly<Record<string, ActionBlackboardValue>>;
  readonly lifetime:
    { readonly kind: 'limited'; readonly durationSeconds: number } | { readonly kind: 'infinite' };
  readonly deathReleaseDelaySeconds?: number;
  readonly maxStackingCount?: number;
  readonly childSkill?: { readonly skillId: string };
}

/** 运行时目标身份；空间点保存生成时的位置，不因此变成可受击实体。 */
export type RuntimeTargetRef =
  | { readonly kind: 'operator'; readonly operatorId: string }
  | {
      readonly kind: 'enemy';
      /** 完整的敌人实例 ID，与关卡实例及运行时目录使用同一身份。 */
      readonly enemyId: string;
    }
  | { readonly kind: 'godEntity' }
  | AbilityEntityTargetRef
  | {
      readonly kind: 'spatialPoint';
      readonly pointId: number;
    };

/** 普通能力实体与投射物技能宿主共用的实例句柄。 */
export interface AbilityEntityTargetRef {
  readonly kind: 'abilityEntity';
  readonly instanceId: number;
}

/** Context 目标组只保存稳定句柄；距离与形状不会进入组身份。 */
export type RuntimeTargetGroup = readonly RuntimeTargetRef[];

/** 原生 firstTarget：跳过位置包装，但不因实体死亡或类型不受支持而改选后项。 */
export function firstRuntimeEntityTarget(targets: RuntimeTargetGroup) {
  return targets.find(target => target.kind !== 'spatialPoint');
}

/** 逻辑能力实体参与通用实体运行时时使用的稳定身份。 */
export function logicalAbilityEntityRuntimeId(instanceId: number): string {
  if (!Number.isInteger(instanceId) || instanceId <= 0) {
    throw new RangeError('AbilityEntity instance id must be a positive integer');
  }
  return `ability-entity:${instanceId}`;
}

/** 解码既有实体身份；不查询活动目录或推断创建关系。 */
export function runtimeTargetFromEntityId(entityId: string): RuntimeTargetRef {
  if (entityId === 'enemy' || entityId.startsWith('enemy:')) {
    if (entityId === 'enemy:') throw new Error('enemy instance identity must not be empty');
    return { kind: 'enemy', enemyId: entityId };
  }
  if (entityId === 'god-entity') return { kind: 'godEntity' };
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
  /** 原生 SkillCastIdValidator：只保留同一来源施法生成的实例。 */
  readonly sourceSkillCastId?: number;
}

/** 位置目标不是实体；其余句柄使用同一稳定实体 ID。 */
export function runtimeTargetEntityId(target: RuntimeTargetRef): string | undefined {
  switch (target.kind) {
    case 'operator':
      return target.operatorId;
    case 'enemy':
      if (!target.enemyId) throw new Error('enemy instance identity must not be empty');
      return target.enemyId;
    case 'godEntity':
      return 'god-entity';
    case 'abilityEntity':
      return logicalAbilityEntityRuntimeId(target.instanceId);
    case 'spatialPoint':
      return undefined;
  }
}

/** 将事件或逐目标调用的单个输入规范成同一种目标集合。 */
export function singleTargetList(
  target: RuntimeTargetRef | null | undefined,
): readonly RuntimeTargetRef[] {
  return target == null ? [] : [target];
}
