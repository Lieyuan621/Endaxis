import { expect, it } from 'vitest';
import { allocateAbilityEntityInstanceId } from './abilityEntityInstanceIdAllocator';

it('实体编号耗尽时不再修改分配器', () => {
  const state = { next: Number.MAX_SAFE_INTEGER };
  expect(allocateAbilityEntityInstanceId(state)).toBe(Number.MAX_SAFE_INTEGER);
  const exhausted = state.next;
  expect(() => allocateAbilityEntityInstanceId(state)).toThrow('exhausted');
  expect(state.next).toBe(exhausted);
});
