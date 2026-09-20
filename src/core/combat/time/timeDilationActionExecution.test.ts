/** 验证动作清理关系的分支隔离、调用顺序和失败时的保留行为。 */
import { expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { createTimeDilationActionState } from '../state/actionState';
import {
  finishTimeDilationAction,
  revertTimeDilationIgnoreAction,
} from './timeDilationOperationExecutor';

it('同一切面分别结束不同动作，保留另一动作的实例关系', () => {
  const state = createTimeDilationActionState();
  state.instanceIds.set(0, [2, 3]);
  state.instanceIds.set(1, [4]);
  state.ignoredEntityIds.set(0, ['caster', 'summon']);
  const session = new StateStepper(state, (step, slot: number) => {
    const stopped: number[] = [];
    const ignored: [string, boolean][] = [];
    finishTimeDilationAction(step.state, slot, id => stopped.push(id));
    revertTimeDilationIgnoreAction(step.state, slot, true, (id, ignore) =>
      ignored.push([id, ignore]),
    );
    return { stopped, ignored };
  });
  const saved = session.save();
  expect(session.step(0)).toEqual({
    stopped: [2, 3],
    ignored: [
      ['caster', false],
      ['summon', false],
    ],
  });
  expect([...session.read().instanceIds]).toEqual([[1, [4]]]);
  session.restore(saved);
  expect(session.step(1)).toEqual({ stopped: [4], ignored: [] });
  expect([...session.read().instanceIds]).toEqual([[0, [2, 3]]]);
  expect(session.read().ignoredEntityIds.get(0)).toEqual(['caster', 'summon']);
});

it('清理失败时不提前删除动作关系，故障后的战斗由切面恢复', () => {
  const state = createTimeDilationActionState();
  state.instanceIds.set(0, [1, 2]);
  expect(() =>
    finishTimeDilationAction(state, 0, () => {
      throw new Error('stop failed');
    }),
  ).toThrow('stop failed');
  expect(state.instanceIds.get(0)).toEqual([1, 2]);
});
