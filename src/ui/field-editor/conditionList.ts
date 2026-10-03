import type { CombatCondition } from '../../../packages/game-data-contract/src/conditions';

/** Structural edits retain each surviving expression and reference, including duplicates. */
export function appendCondition(
  conditions: readonly CombatCondition[],
  value: boolean,
): readonly CombatCondition[] {
  if (typeof value !== 'boolean') throw new Error('Choose an explicit boolean condition');
  return [...conditions, { kind: 'constant', value }];
}

function requireIndex(conditions: readonly CombatCondition[], index: number) {
  if (!Number.isInteger(index) || index < 0 || index >= conditions.length)
    throw new Error('Condition index does not exist');
}

export function removeCondition(
  conditions: readonly CombatCondition[],
  index: number,
): readonly CombatCondition[] {
  requireIndex(conditions, index);
  return conditions.filter((_, item) => item !== index);
}

export function moveCondition(
  conditions: readonly CombatCondition[],
  from: number,
  to: number,
): readonly CombatCondition[] {
  requireIndex(conditions, from);
  requireIndex(conditions, to);
  if (from === to) return conditions;
  const next = [...conditions];
  const [condition] = next.splice(from, 1);
  next.splice(to, 0, condition!);
  return next;
}
