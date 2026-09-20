/**
 * 干员定义与核心类型之间的声明式辅助层。这里只消除机械重复，
 * 调用方仍须显式表达伤害类型、倍率、标签和时序，不能在辅助函数中隐藏角色特例。
 */
import type { CombatStepForKind } from '../../../packages/game-data-contract/src/actions';
import type {
  ActionSequenceDefinition,
  ActionValueOperand,
  CombatCondition,
  CombatStepDefinition,
  CombatStepKind,
  CombatStepParameters,
  CombatTarget,
  DamageType,
  DealDamageParameters,
  ElementalReaction,
  LevelValues,
  ScheduledSequenceDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';

/** 只有基础字段已满足完整契约的节点才能由 step() 构造。 */
type ParameterOnlyStepKind = {
  [K in CombatStepKind]: {
    kind: K;
    parameters: CombatStepParameters[K];
    key?: string;
  } extends CombatStepForKind<K>
    ? K
    : never;
}[CombatStepKind];

/** 创建一个立即执行的操作，同时保留其可辨识联合类型。 */
export function step<K extends ParameterOnlyStepKind>(
  kind: K,
  parameters: CombatStepParameters[K],
  key?: string,
): CombatStepForKind<K>;
export function step(
  kind: ParameterOnlyStepKind,
  parameters: CombatStepParameters[ParameterOnlyStepKind],
  key?: string,
): CombatStepDefinition {
  return { kind, parameters, ...(key ? { key } : {}) } as CombatStepDefinition;
}

export function sequence(
  ...items: readonly (CombatStepDefinition | ActionSequenceDefinition)[]
): ActionSequenceDefinition {
  return {
    steps: items.flatMap(item => ('steps' in item ? item.steps : [item])),
  };
}

const GENERATED_IDENTITY_PLACEHOLDER_PREFIX = '\u0000endaxis-generated-identity:';

/**
 * 生成器把仅稳定来源 key 不同的大型不可变序列提升成模板；这里按位置恢复每个实例
 * 的真实 key。它只做结构复制和字符串替换，不解释动作语义，也不合并运行时身份。
 */
export function instantiateActionSequence(
  template: ActionSequenceDefinition,
  identities: readonly string[],
): ActionSequenceDefinition {
  const instantiate = (value: unknown): unknown => {
    if (typeof value === 'string' && value.startsWith(GENERATED_IDENTITY_PLACEHOLDER_PREFIX)) {
      const index = Number(value.slice(GENERATED_IDENTITY_PLACEHOLDER_PREFIX.length));
      const identity = identities[index];
      if (!Number.isInteger(index) || index < 0 || identity === undefined) {
        throw new Error(`invalid generated identity placeholder ${JSON.stringify(value)}`);
      }
      return identity;
    }
    if (Array.isArray(value)) return value.map(instantiate);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(
      Object.entries(value as Readonly<Record<string, unknown>>).map(([key, child]) => [
        key,
        instantiate(child),
      ]),
    );
  };
  return instantiate(template) as ActionSequenceDefinition;
}

export function not(condition: CombatCondition): CombatCondition {
  return { kind: 'not', condition };
}

export function all(...conditions: CombatCondition[]): CombatCondition {
  return { kind: 'all', conditions };
}

export function statusActive(
  statusKey: string,
  target: CombatTarget = 'caster',
  minimumStacks?: number,
): CombatCondition {
  return {
    kind: 'statusActive',
    statusKey,
    target,
    ...(minimumStacks === undefined ? {} : { minimumStacks }),
  };
}

export function statusStacksExactly(
  statusKey: string,
  stacks: number,
  target: CombatTarget = 'caster',
): CombatCondition {
  return all(
    statusActive(statusKey, target, stacks),
    not(statusActive(statusKey, target, stacks + 1)),
  );
}

export function reactionActive(
  reaction: ElementalReaction,
  minimumLevel?: number,
): CombatCondition {
  return {
    kind: 'elementalReactionActive',
    reaction,
    ...(minimumLevel === undefined ? {} : { minimumLevel }),
  };
}

export function branch(
  condition: CombatCondition,
  whenTrue: ActionSequenceDefinition,
  whenFalse?: ActionSequenceDefinition,
  options?: { readonly alwaysNext?: boolean },
): CombatStepForKind<'conditional'> {
  return {
    kind: 'conditional',
    parameters: {
      condition,
      ...(options?.alwaysNext === true ? { alwaysNext: true } : {}),
    },
    whenTrue,
    ...(whenFalse ? { whenFalse } : {}),
  };
}

/** 创建一个在单次技能释放内最多执行一次的动作序列。 */
export function once(scopeKey: string, body: ActionSequenceDefinition): CombatStepForKind<'once'> {
  return { kind: 'once', parameters: { scopeKey }, body };
}

/** 保留投射物等子 SkillData 的独立动作黑板生命周期。 */
export function withActionBlackboardScope(
  scopeKey: string,
  initialValues: Readonly<Record<string, LevelValues>>,
  inheritParent: boolean,
  body: ActionSequenceDefinition,
  entityInitialValues?: Readonly<Record<string, LevelValues>>,
  options?: {
    readonly lifetime?: 'parent' | 'execution';
    readonly alwaysNext?: boolean;
    readonly entityAssignments?: Readonly<Record<string, ActionValueOperand>>;
  },
): CombatStepForKind<'withActionBlackboardScope'> {
  return {
    kind: 'withActionBlackboardScope',
    parameters: {
      scopeKey,
      initialValues,
      inheritParent,
      ...(entityInitialValues === undefined || Object.keys(entityInitialValues).length === 0
        ? {}
        : { entityInitialValues }),
      ...(options?.lifetime === undefined ? {} : { lifetime: options.lifetime }),
      ...(options?.alwaysNext === true ? { alwaysNext: true } : {}),
      ...(options?.entityAssignments === undefined
        ? {}
        : { entityAssignments: options.entityAssignments }),
    },
    body,
  };
}

/** 在调度区间内按宿主技能的每次 Tick 重复执行同一个同步序列。 */
export function repeatEachTick(
  body: ActionSequenceDefinition,
  parameters: Readonly<CombatStepParameters['repeatEachTick']> = {},
): CombatStepForKind<'repeatEachTick'> {
  return { kind: 'repeatEachTick', parameters, body };
}

/** 按当前动作黑板中的整数次数同步重复，常用于多目标点投射物。 */
export function repeatByActionValue(
  count: ActionValueOperand,
  body: ActionSequenceDefinition,
): CombatStepForKind<'repeatByActionValue'> {
  return { kind: 'repeatByActionValue', parameters: { count }, body };
}

/** 对施法上下文中的稳定目标句柄逐一同步执行。 */
export function forEachContextTarget(
  contextKey: string,
  body: ActionSequenceDefinition,
): CombatStepForKind<'forEachContextTarget'> {
  return { kind: 'forEachContextTarget', parameters: { contextKey }, body };
}

/** 对已经静态证明的唯一目标执行一次，并保留原生 ForEach 的结果隔离。 */
export function forEachTarget(
  target: 'enemy' | 'caster',
  body: ActionSequenceDefinition,
): CombatStepForKind<'forEachContextTarget'> {
  return { kind: 'forEachContextTarget', parameters: { target }, body };
}

interface ConditionalCase {
  condition: CombatCondition;
  sequence: ActionSequenceDefinition;
}

/** 构造有序的 if/else-if 条件链，只执行首个匹配分支。 */
export function firstMatching(
  cases: readonly ConditionalCase[],
  fallback?: ActionSequenceDefinition,
): CombatStepDefinition {
  const [current, ...remaining] = cases;
  if (!current) {
    throw new Error('firstMatching requires at least one case');
  }

  const whenFalse = remaining.length ? sequence(firstMatching(remaining, fallback)) : fallback;
  return branch(current.condition, current.sequence, whenFalse);
}

export function scheduled(
  frame: number,
  actionSequence: ActionSequenceDefinition,
  endFrame?: number,
): ScheduledSequenceDefinition {
  return {
    startFrame: frame,
    sequence: actionSequence,
    ...(endFrame === undefined ? {} : { endFrame }),
  };
}

/** 为技能定义附加按等级解析的初始动作黑板，不改变原技能对象。 */
export function withSkillBlackboard(
  skill: SkillDefinition,
  blackboard: NonNullable<SkillDefinition['blackboard']>,
): SkillDefinition {
  return { ...skill, blackboard };
}

type DamageOptions = Omit<DealDamageParameters, 'damageType' | 'attackScale' | 'tags'>;

export interface BasicAttackOptions extends DamageOptions {
  availability?: CombatCondition;
  final?: boolean;
  spRecovery?: LevelValues;
}

/** 绑定干员的伤害类型，同时要求每次命中显式配置倍率与标签。 */
export function damageOfType(damageType: DamageType) {
  return (
    attackScale: DealDamageParameters['attackScale'],
    tags: DealDamageParameters['tags'],
    options: DamageOptions = {},
  ): DealDamageParameters => ({ damageType, attackScale, tags, ...options });
}

/** 创建普通攻击链的一段，并显式指定伤害类型。 */
export function basicAttackOfType(damageType: DamageType) {
  return (
    key: string,
    timelineBlockFrames: number,
    hitFrames: number | readonly number[],
    attackScale: LevelValues,
    options: BasicAttackOptions = {},
  ): SkillDefinition => {
    const { availability, final = false, spRecovery, ...damageOptions } = options;
    const frames = typeof hitFrames === 'number' ? [hitFrames] : hitFrames;
    const tags = final
      ? (['normalAttack', 'normalAttackLastCombo'] as const)
      : (['normalAttack'] as const);

    return {
      key,
      timelineBlockFrames,
      ...(availability ? { availability } : {}),
      scheduledSequences: frames.map((frame, index) => {
        const last = index === frames.length - 1;
        return scheduled(
          frame,
          sequence(
            step(
              'dealDamage',
              { damageType, attackScale, tags, ...damageOptions },
              `${key}.hit.${index + 1}`,
            ),
            ...(last && spRecovery !== undefined
              ? [
                  step('changeResource', {
                    resource: 'sp',
                    amount: spRecovery,
                    recipient: 'team',
                    spGainSource: 'normalAttack',
                  }),
                ]
              : []),
          ),
        );
      }),
    };
  };
}

/** 常用普攻构造器集中定义，干员配置与生成代码不再重复绑定伤害类型。 */
export const physicalBasicAttack = basicAttackOfType('physical');
export const heatBasicAttack = basicAttackOfType('heat');
export const cryoBasicAttack = basicAttackOfType('cryo');
export const electricBasicAttack = basicAttackOfType('electric');
export const natureBasicAttack = basicAttackOfType('nature');

export function multiplyLevelValues(values: number, multiplier: number): number;
export function multiplyLevelValues(values: readonly number[], multiplier: number): number[];
export function multiplyLevelValues(values: LevelValues, multiplier: number): LevelValues;
export function multiplyLevelValues(values: LevelValues, multiplier: number): LevelValues {
  return typeof values === 'number' ? values * multiplier : values.map(value => value * multiplier);
}

export function scaleDamageByStatusStacks(
  damage: DealDamageParameters,
  statusKey: string,
  coefficient: LevelValues,
  target: CombatTarget = 'caster',
): DealDamageParameters {
  return {
    ...damage,
    attackScalePerStatusStack: { statusKey, target, coefficient },
  };
}

/** 为来源中的每个命中帧创建一段仅造成伤害的调度序列。 */
export function damageHits(
  frames: readonly number[],
  parameters: DealDamageParameters,
  keyPrefix?: string,
): ScheduledSequenceDefinition[] {
  return frames.map((frame, index) =>
    scheduled(
      frame,
      sequence(
        step(
          'dealDamage',
          parameters,
          keyPrefix === undefined ? undefined : `${keyPrefix}.hit.${index + 1}`,
        ),
      ),
    ),
  );
}

/** 将来源表中的百分数转换为战斗计算使用的小数倍率。 */
export function percentage(value: number): number {
  return value / 100;
}

/** 将来源表中的逐等级百分数转换为战斗计算使用的小数倍率。 */
export function percentages(values: readonly number[]): number[] {
  return values.map(percentage);
}

export function secondsToFrames(value: number): number;
export function secondsToFrames(values: readonly number[]): number[];
export function secondsToFrames(values: LevelValues): LevelValues {
  return typeof values === 'number' ? values * 30 : values.map(value => value * 30);
}
