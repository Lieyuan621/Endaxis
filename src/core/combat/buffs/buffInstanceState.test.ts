/** Buff 黑板随实例复制，同时保留与目标实体板的共享引用。 */
import { describe, expect, it } from 'vitest';
import {
  assignDynamicBlackboard,
  readActionBlackboard,
} from '../actions/actionBlackboardExecution';
import { StateStepper } from '../runtime/stateStepper';
import { createActionBlackboardState } from '../state/foundationState';
import { createBuffInstanceState } from '../state/instanceState';

describe('buff instance blackboard', () => {
  it('restores shared entity writes and isolates local values across siblings', () => {
    const entity = createActionBlackboardState({ EntityBB_value: 1 });
    const first = createBuffInstanceState(
      { ownerId: 'owner', instanceId: 1, definitionId: 'buff', sourceId: 'source' },
      createActionBlackboardState({ local: 2 }, entity),
    );
    const second = createBuffInstanceState(
      { ownerId: 'owner', instanceId: 2, definitionId: 'buff', sourceId: 'source' },
      createActionBlackboardState({ local: 3 }, entity),
    );
    const session = new StateStepper({ entity, first, second }, (step, value: number) => {
      assignDynamicBlackboard(step.state.first.blackboard, 'EntityBB_value', value);
      assignDynamicBlackboard(step.state.first.blackboard, 'local', value);
      return readActionBlackboard(step.state.second.blackboard, 'EntityBB_value');
    });
    const root = session.save();
    expect(session.step(7)).toBe(7);
    const branch = session.save();
    session.restore(root);
    expect(session.step(9)).toBe(9);
    session.restore(branch);
    const restored = session.read();
    expect(restored.first.blackboard.entity).toBe(restored.entity);
    expect(restored.second.blackboard.entity).toBe(restored.entity);
    expect(readActionBlackboard(restored.first.blackboard, 'local')).toBe(7);
    expect(readActionBlackboard(restored.second.blackboard, 'local')).toBe(3);
    expect(readActionBlackboard(restored.entity, 'EntityBB_value')).toBe(7);
    expect(readActionBlackboard(entity, 'EntityBB_value')).toBe(1);
  });
});
