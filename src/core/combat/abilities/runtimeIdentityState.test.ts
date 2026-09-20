/** 验证实体和施放编号随切面一起恢复，各分支分配互不影响。 */
import { expect, it } from 'vitest';
import {
  AbilityEntityInstanceIdAllocator,
  allocateAbilityEntityInstanceId,
} from './abilityEntityInstanceIdAllocator';
import { SkillCastIdAllocator, allocateSkillCastId } from '../skills/skillCastInfo';
import { StateStepper } from '../runtime/stateStepper';

it('恢复后重跑分配相同身份，两类编号各自连续', () => {
  const entities = new AbilityEntityInstanceIdAllocator();
  const casts = new SkillCastIdAllocator();
  entities.allocate();
  const session = new StateStepper(
    { entities: entities.runtimeState, casts: casts.runtimeState },
    (step, _: undefined) => ({
      entity: allocateAbilityEntityInstanceId(step.state.entities),
      cast: allocateSkillCastId(step.state.casts),
    }),
  );
  const saved = session.save();
  expect(session.step(undefined)).toEqual({ entity: 2, cast: 1 });
  expect(session.step(undefined)).toEqual({ entity: 3, cast: 2 });
  session.restore(saved);
  expect(session.step(undefined)).toEqual({ entity: 2, cast: 1 });
  expect(entities.allocate()).toBe(2);
  expect(casts.allocate()).toBe(1);
});

it('实体编号耗尽时不再修改分配器', () => {
  const state = { next: Number.MAX_SAFE_INTEGER };
  expect(allocateAbilityEntityInstanceId(state)).toBe(Number.MAX_SAFE_INTEGER);
  const exhausted = state.next;
  expect(() => allocateAbilityEntityInstanceId(state)).toThrow('exhausted');
  expect(state.next).toBe(exhausted);
});

it('分配器可直接绑定恢复后的编号状态', () => {
  const entityState = { next: 41 };
  const castState = { nextId: 73 };
  const entities = new AbilityEntityInstanceIdAllocator(entityState);
  const casts = new SkillCastIdAllocator(castState);

  expect(entities.runtimeState).toBe(entityState);
  expect(casts.runtimeState).toBe(castState);
  expect(entities.allocate()).toBe(41);
  expect(casts.allocate()).toBe(73);
});
