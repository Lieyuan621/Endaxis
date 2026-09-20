import type { ActionSequenceDefinition } from '../../../../../packages/game-data-contract/src/actions.ts';
import type {
  ActionValueOperand,
  CombatCondition,
} from '../../../../../packages/game-data-contract/src/conditions.ts';
import type {
  DamageModifierCondition,
  DamageModifierNumber,
} from '../../../../../packages/game-data-contract/src/modifiers.ts';

/**
 * 伤害修正暂有纯条件运行协议；先走公共 Sequence/Condition 投影，再无损降低到该协议。
 * 这里不解析原生动作、枚举或掩码。带副作用的序列必须等待同步动作宿主接通，不能丢掉写入。
 */
export function projectPureDamageModifierCondition(
  sequence: ActionSequenceDefinition,
  path: string,
): DamageModifierCondition | undefined {
  const result = reduceSequence(sequence, path);
  return result === true ? undefined : materialize(result);
}

type Result = boolean | DamageModifierCondition;

function materialize(result: Result): DamageModifierCondition {
  return typeof result === 'boolean'
    ? { kind: 'buffBlackboardCompare', left: 1, operator: 'equal', right: result ? 1 : 0 }
    : result;
}

function combine(kind: 'all' | 'any', results: readonly Result[]): Result {
  const identity = kind === 'all';
  if (results.some(result => result === !identity)) return !identity;
  const conditions = results.flatMap(result => {
    if (result === identity) return [];
    const condition = materialize(result);
    return condition.kind === kind ? condition.conditions : [condition];
  });
  return conditions.length === 0
    ? identity
    : conditions.length === 1
      ? conditions[0]!
      : { kind, conditions };
}

function negate(result: Result): Result {
  return typeof result === 'boolean' ? !result : { kind: 'not', condition: result };
}

function reduceSequence(sequence: ActionSequenceDefinition, path: string): Result {
  return combine(
    'all',
    sequence.steps.map((step, index): Result => {
      const stepPath = `${path}.steps[${index}]`;
      if (step.kind !== 'conditional') {
        throw new Error(
          `${stepPath}: damage modifier condition requires an action-sequence runtime (${step.kind}); cannot discard side effects`,
        );
      }
      // 即使 alwaysNext=true，仍先验证两支均无副作用，不能把条件运算当成无操作。
      const condition = reduceCondition(step.parameters.condition, `${stepPath}.condition`);
      const whenTrue = reduceSequence(step.whenTrue, `${stepPath}.whenTrue`);
      const whenFalse =
        step.whenFalse === undefined
          ? false
          : reduceSequence(step.whenFalse, `${stepPath}.whenFalse`);
      if (step.parameters.alwaysNext) return true;
      return combine('any', [
        combine('all', [condition, whenTrue]),
        combine('all', [negate(condition), whenFalse]),
      ]);
    }),
  );
}

function number(value: number | ActionValueOperand): DamageModifierNumber {
  if (typeof value === 'number') return value;
  return value.kind === 'constant' ? value.value : { blackboardKey: value.key };
}

function reduceCondition(condition: CombatCondition, path: string): Result {
  switch (condition.kind) {
    case 'constant':
      return condition.value;
    case 'all':
    case 'any':
      return combine(
        condition.kind,
        condition.conditions.map((child, index) => reduceCondition(child, `${path}.${index}`)),
      );
    case 'not':
      return negate(reduceCondition(condition.condition, `${path}.not`));
    case 'casterControlled':
    case 'eventDamageTagsMatch':
    case 'eventDamageFeaturesMatch':
      return condition;
    case 'eventSkillCastMatchesBuffSource':
      return { kind: 'sourceSkillCastMatch' };
    case 'eventDamageTypeIn':
      return { kind: 'eventDamageTypesMatch', damageTypes: condition.damageTypes };
    case 'actionValueCompare':
      return {
        kind: 'buffBlackboardCompare',
        left: number(condition.left),
        operator: condition.operator,
        right: number(condition.right),
      };
    case 'entityTagMatch':
      if (condition.target === 'caster' || condition.target === 'enemy')
        return { ...condition, target: condition.target };
      break;
    case 'buffIdStackCompare':
      if (
        (condition.target === 'caster' || condition.target === 'enemy') &&
        !condition.sameSourceSkillCast
      ) {
        return {
          kind: 'buffIdCountCompare',
          target: condition.target,
          buffIds: condition.buffIds,
          operator: condition.operator,
          value: number(condition.value),
        };
      }
      break;
    case 'healthCompare':
      if (condition.target === 'enemy' && condition.contextKey === undefined)
        return {
          kind: 'targetHealthCompare',
          target: 'enemy',
          valueType: condition.valueType,
          operator: condition.operator,
          value: number(condition.value),
        };
      break;
    case 'poiseCompare':
      if (condition.target === 'enemy')
        return {
          kind: 'targetPoiseCompare',
          target: 'enemy',
          returnValueIfMissing: condition.returnValueIfMissing,
          operator: condition.operator,
          value: number(condition.value),
        };
      break;
  }
  throw new Error(
    `${path}: damage modifier condition requires a shared context runtime (${condition.kind})`,
  );
}
