import { expect, it } from 'vitest';
import { CombatClock } from '../time/combatClock';
import { OperatorControlRuntime } from './operatorControlRuntime';

it('切人通知中的条件查询始终看到完整的新主控身份', () => {
  const clock = new CombatClock();
  const seen: { owner: string; controlled: string[] }[] = [];
  const runtime = new OperatorControlRuntime(
    ['a', 'b'],
    clock,
    (id, frame) => id === (frame === 0 ? 'a' : 'b'),
    owner => {
      seen.push({
        owner,
        controlled: [...runtime.runtimeState]
          .filter(([, controlled]) => controlled)
          .map(([id]) => id),
      });
    },
  );
  clock.advanceFrame();
  runtime.advanceFrame();
  expect(seen).toEqual([
    { owner: 'a', controlled: ['b'] },
    { owner: 'b', controlled: ['b'] },
  ]);
});
