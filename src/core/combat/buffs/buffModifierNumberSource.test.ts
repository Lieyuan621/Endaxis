/** 修正器必须读取当前分支黑板，并保留实体板回退与缺失值报错。 */
import { expect, it } from 'vitest';
import { assignDynamicBlackboard } from '../actions/actionBlackboardExecution';
import { StateStepper } from '../runtime/stateStepper';
import { createActionBlackboardState } from '../state/foundationState';
import { resolveBuffModifierNumber } from './buffModifierNumberSource';

it('uses the restored shared blackboard for all modifier kinds', () => {
  const entity = createActionBlackboardState({ EntityBB_rate: 1 });
  const source = { buffId: 'buff', blackboard: createActionBlackboardState({}, entity) };
  const session = new StateStepper({ entity, source }, (step, value: number) => {
    assignDynamicBlackboard(step.state.source.blackboard, 'EntityBB_rate', value);
    return (['damage', 'heal', 'poise'] as const).map(kind =>
      resolveBuffModifierNumber(step.state.source, { blackboardKey: 'EntityBB_rate' }, kind),
    );
  });
  const root = session.save();
  expect(session.step(2)).toEqual([2, 2, 2]);
  session.restore(root);
  expect(session.step(3)).toEqual([3, 3, 3]);
  expect(entity.values.get('EntityBB_rate')).toBe(1);
  expect(() => resolveBuffModifierNumber(source, { blackboardKey: 'missing' }, 'heal')).toThrow(
    "buff 'buff' heal modifier blackboard value 'missing' is missing",
  );
});
