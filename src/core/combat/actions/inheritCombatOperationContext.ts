import type { CombatOperationContext } from '../skills/skillRuntime';

/** 派生调用保留宿主的实时施法读取；显式来源覆盖（例如点燃）仍是独立快照。 */
export function inheritCombatOperationContext(
  parent: CombatOperationContext,
  overrides: Partial<CombatOperationContext>,
): CombatOperationContext {
  const derived = { ...parent, ...overrides };
  for (const key of ['skillCastInfo', 'partTransferInfo'] as const) {
    if (Object.hasOwn(overrides, key)) continue;
    Object.defineProperty(derived, key, {
      enumerable: true,
      configurable: true,
      get: () => parent[key],
    });
  }
  return derived;
}
