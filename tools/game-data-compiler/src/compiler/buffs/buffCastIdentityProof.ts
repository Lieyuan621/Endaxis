import type { BuffRuntimeSource } from '../../source/buffRuntime.ts';

/**
 * A fresh Buff starts with affix ID zero. SkillAffix writes only its own Buff;
 * tracking output Buffs does not copy the affix ID. Without a writer anywhere
 * in this parsed definition, limited counts therefore use ordinary cast info.
 *
 * Inspect the complete IR, including leaf-owned callbacks and modifier programs,
 * not just scheduled sequences. Disabled/unreachable writers conservatively
 * invalidate this proof too. This is not proof that SkillAffix is disposable.
 */
export function buffHasNoAffixIdentityWriter(source: BuffRuntimeSource): boolean {
  const visited = new Set<object>();
  const containsWriter = (value: unknown): boolean => {
    if (value === null || typeof value !== 'object' || visited.has(value)) return false;
    visited.add(value);
    if ('family' in value && value.family === 'skillAffix') return true;
    return Object.values(value).some(containsWriter);
  };
  return !containsWriter(source);
}
