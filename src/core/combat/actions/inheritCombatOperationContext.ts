import type { CombatOperationContext } from '../skills/skillRuntime';

/** 派生调用保留宿主的实时施法读取；显式来源覆盖（例如点燃）仍是独立快照。 */
export function inheritCombatOperationContext(
  parent: CombatOperationContext,
  overrides: Partial<CombatOperationContext>,
): CombatOperationContext {
  const derived = { ...parent, ...overrides };
  if (!Object.hasOwn(overrides, 'skillCastInfo'))
    Object.defineProperty(derived, 'skillCastInfo', {
      enumerable: true,
      configurable: true,
      get: () => parent.skillCastInfo,
    });
  return derived;
}
