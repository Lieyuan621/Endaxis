/** Group by descending rarity while preserving directory order within each group. */
export function groupOperatorsByRarity<T extends { rarity?: number }>(operators: readonly T[]) {
  const groups = new Map<number, T[]>();
  for (const operator of operators) {
    const rarity = operator.rarity || 0;
    const list = groups.get(rarity) ?? [];
    list.push(operator);
    groups.set(rarity, list);
  }
  return [...groups]
    .sort(([left], [right]) => right - left)
    .map(([rarity, list]) => ({ rarity, list }));
}

/** The repository owns native-character ID order; unlisted/custom entries retain their relative order. */
export function orderByOperatorDirectory<T>(
  items: readonly T[],
  slug: (item: T) => string,
  directory: readonly { slug: string }[],
): T[] {
  const positions = new Map(directory.map((operator, index) => [operator.slug, index]));
  const position = (item: T) => positions.get(slug(item)) ?? Number.MAX_SAFE_INTEGER;
  return [...items].sort((left, right) => position(left) - position(right));
}
