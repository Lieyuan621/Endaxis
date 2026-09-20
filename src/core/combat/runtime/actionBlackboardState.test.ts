/** 验证整图复制保留实体板共享关系，同时隔离兄弟分支和独立子作用域。 */
import { describe, expect, it } from 'vitest';
import { ActionBlackboard } from '../actions/actionBlackboard';
import {
  assignDynamicBlackboard,
  createLocalBlackboardState,
  readActionBlackboard,
} from '../actions/actionBlackboardExecution';
import { createActionBlackboardState } from '../state/foundationState';
import { StateStepper } from './stateStepper';

describe('blackboard data graph', () => {
  it('keeps local entity assignments on the existing number read interface', () => {
    const reads: string[] = [];
    class ObservedBlackboard extends ActionBlackboard {
      override getNumber(key: string): number | undefined {
        reads.push(key);
        return super.getNumber(key);
      }
    }
    const parent = new ObservedBlackboard({ value: 7 });
    const child = parent.createLocalScope(
      {},
      false,
      {},
      {
        EntityBB_value: { kind: 'blackboard', key: 'value' },
      },
    );
    expect(reads).toEqual(['value']);
    expect(child.getNumber('EntityBB_value')).toBe(7);
  });

  it('restores shared entity writes without leaking across sibling branches', () => {
    const entity = createActionBlackboardState({ EntityBB_value: 1 });
    const left = createActionBlackboardState({ local: 2 }, entity);
    const right = createActionBlackboardState({}, entity);
    const session = new StateStepper({ entity, left, right }, (step, value: number) => {
      assignDynamicBlackboard(step.state.left, 'EntityBB_value', value);
      return readActionBlackboard(step.state.right, 'EntityBB_value');
    });
    const root = session.save();
    expect(session.step(5)).toBe(5);
    const a = session.save();
    session.restore(root);
    expect(session.step(9)).toBe(9);
    const b = session.save();
    session.restore(a);
    const restored = session.read();
    expect(restored.left.entity).toBe(restored.entity);
    expect(restored.right.entity).toBe(restored.entity);
    expect(readActionBlackboard(restored.right, 'EntityBB_value')).toBe(5);
    expect(session.step(6)).toBe(6);
    session.restore(b);
    expect(readActionBlackboard(session.read().right, 'EntityBB_value')).toBe(9);
    expect(entity.values.get('EntityBB_value')).toBe(1);
  });

  it('keeps inherited direct values separate and respects explicit entity scopes', () => {
    const entity = createActionBlackboardState({ EntityBB_value: 3 });
    const parent = createActionBlackboardState({ local: 7, EntityBB_value: 10 }, entity);
    const shared = createLocalBlackboardState(parent, { local: 1 }, true);
    const independent = createLocalBlackboardState(
      parent,
      {},
      false,
      {},
      {
        EntityBB_value: { kind: 'blackboard', key: 'EntityBB_value' },
      },
    );
    expect(readActionBlackboard(shared, 'local')).toBe(7);
    expect(readActionBlackboard(independent, 'EntityBB_value')).toBe(10);
    assignDynamicBlackboard(shared, 'local', 8);
    expect(readActionBlackboard(parent, 'local')).toBe(7);
    assignDynamicBlackboard(shared, 'EntityBB_value', 4);
    expect(entity.values.get('EntityBB_value')).toBe(4);
    expect(readActionBlackboard(shared, 'EntityBB_value')).toBe(10);
    expect(readActionBlackboard(independent, 'EntityBB_value')).toBe(10);
    const grandchild = createActionBlackboardState({}, createActionBlackboardState({}, entity));
    expect(readActionBlackboard(grandchild, 'EntityBB_value')).toBeUndefined();
  });
});
