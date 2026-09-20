/** 护盾与 Buff 一起恢复，耗尽回调只能看到已经扣除的余额和次数。 */
import { expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { createBuffInstanceState } from '../state/instanceState';
import { absorbShieldDamage } from './buffShieldExecution';

it('restores shield consumption and finishing across branches', () => {
  const buff = createBuffInstanceState({
    ownerId: 'owner',
    instanceId: 1,
    definitionId: 'buff',
    sourceId: 'source',
  });
  buff.shields.push({
    maxValue: 100,
    maxAbsorbCount: 2,
    remainingValue: 100,
    remainingAbsorbCount: 2,
    consumed: false,
    absorptions: new Map(),
  });
  const program = {
    infinityValue: false,
    absorbAllDamageWhenConsumed: false,
    removeBuffWhenConsumed: true,
  };
  const session = new StateStepper(buff, (step, damage: number) =>
    absorbShieldDamage(step.state.shields[0]!, program, 'physical', damage, () => {
      expect(step.state.shields[0]!.consumed).toBe(true);
      step.state.lifecycle.finished = true;
    }),
  );
  expect(session.step(30)).toBe(0);
  const checkpoint = session.save();
  expect(session.step(100)).toBe(30);
  expect(session.read().lifecycle.finished).toBe(true);
  session.restore(checkpoint);
  expect(session.read().lifecycle.finished).toBe(false);
  expect(session.read().shields[0]!.remainingValue).toBe(70);
  expect(session.step(10)).toBe(0);
  expect(session.read().shields[0]!.remainingValue).toBe(60);
  expect(session.read().lifecycle.finished).toBe(true);
});
