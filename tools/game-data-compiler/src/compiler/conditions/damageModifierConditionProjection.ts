import type {
  ActionGraphDefinition,
  ActionGraphReference,
} from '../../../../../packages/game-data-contract/src/actionGraph.ts';
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
  graph: ActionGraphDefinition,
  sequence: ActionGraphReference,
  path: string,
): DamageModifierCondition | undefined {
  const result = reduceSequence(graph, sequence, path, new Set());
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

function reduceSequence(
  graph: ActionGraphDefinition,
  sequence: ActionGraphReference,
  path: string,
  ancestors: ReadonlySet<string>,
): Result {
  const results: Result[] = [];
  const visited = new Set(ancestors);
  let cursor = sequence.$sequence;
  while (cursor !== null) {
    if (visited.has(cursor)) throw new Error(`${path}: cyclic condition graph at ${cursor}`);
    visited.add(cursor);
    const node = graph.nodes[cursor];
    if (!node) throw new Error(`${path}: missing condition node ${cursor}`);
    const step = node.action;
    const stepPath = `${path}.${cursor}`;
    if (step.kind !== 'conditional') {
      throw new Error(
        `${stepPath}: damage modifier condition requires an action-sequence runtime (${step.kind}); cannot discard side effects`,
      );
    }
    // 即使 alwaysNext=true，仍先验证两支均无副作用，不能把条件运算当成无操作。
    const condition = reduceCondition(step.parameters.condition, `${stepPath}.condition`);
    const whenTrue = reduceSequence(graph, step.whenTrue, `${stepPath}.whenTrue`, visited);
    const whenFalse =
      step.whenFalse === undefined
        ? false
        : reduceSequence(graph, step.whenFalse, `${stepPath}.whenFalse`, visited);
    results.push(
      step.parameters.alwaysNext
        ? true
        : combine('any', [
            combine('all', [condition, whenTrue]),
            combine('all', [negate(condition), whenFalse]),
          ]),
    );
    cursor = node.next;
  }
  return combine('all', results);
}

function number(value: number | ActionValueOperand): DamageModifierNumber {
  if (typeof value === 'number') return value;
  if (value.kind === 'valueNode')
    throw new Error('data nodes must be bound before condition lowering');
  if (value.kind === 'parameter')
    throw new Error('damage modifier parameters must be bound before condition lowering');
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
