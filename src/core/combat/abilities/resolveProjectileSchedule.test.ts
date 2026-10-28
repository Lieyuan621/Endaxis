import { expect, it } from 'vitest';
import { resolveProjectileSchedule } from './resolveProjectileSchedule';

it('每次发射分别求值，后续变量变动不修改已发射的时间表', () => {
  const definition = {
    endFrame: 'end',
    callbacks: [{ event: 'hit' as const, triggerFrames: ['first', 'second'] }],
  };
  const values: Record<string, number> = { first: 3, second: 6, end: 6 };
  const first = resolveProjectileSchedule(definition, key => values[key]!);
  values.first = 4;
  const second = resolveProjectileSchedule(definition, key => values[key]!);
  expect(first.callbacks[0]!.triggerFrames).toEqual([3, 6]);
  expect(second.callbacks[0]!.triggerFrames).toEqual([4, 6]);
  expect(structuredClone(first)).toEqual(first);
});

it('非法时间表不会被静默取整、排序或截断', () => {
  for (const frames of [[-1], [0.5], [NaN], [Infinity], [2, 1], [1, 1], [4]]) {
    expect(() =>
      resolveProjectileSchedule(
        { endFrame: 3, callbacks: [{ event: 'hit', triggerFrames: frames }] },
        value => value,
      ),
    ).toThrow();
  }
});
