/** 验证恢复后按新分支数据结束子实例，并保留原有实时遍历和异常行为。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { createBuffChildrenState } from '../state/instanceState';
import { attachBuffChild, finishBuffChildren } from './buffLifecycleExecution';

describe('buff child references', () => {
  it('restores ordered children across targets and visits children attached during finish', () => {
    const children = createBuffChildrenState();
    attachBuffChild(children, { ownerId: 'a', instanceId: 1 });
    attachBuffChild(children, { ownerId: 'a', instanceId: 1 });
    attachBuffChild(children, { ownerId: 'b', instanceId: 1 });
    const session = new StateStepper(
      { children, finished: [] as string[] },
      (step, append: boolean) => {
        finishBuffChildren(step.state.children, reference => {
          step.state.finished.push(reference.ownerId);
          if (append && reference.ownerId === 'a') {
            attachBuffChild(step.state.children, { ownerId: 'c', instanceId: 1 });
          }
        });
        return step.state.finished;
      },
    );
    const root = session.save();
    expect(session.step(true)).toEqual(['a', 'b', 'c']);
    expect(session.read().children.members.size).toBe(0);
    session.restore(root);
    expect(session.step(false)).toEqual(['a', 'b']);
    expect(children.members.size).toBe(2);
  });

  it('does not clear membership after a throwing child and can recover the full branch', () => {
    const children = createBuffChildrenState();
    attachBuffChild(children, { ownerId: 'a', instanceId: 1 });
    const session = new StateStepper({ children, count: 0 }, (step, fail: boolean) => {
      finishBuffChildren(step.state.children, () => {
        step.state.count += 1;
        if (fail) throw new Error('child failed');
      });
      return step.state.count;
    });
    const root = session.save();
    expect(() => session.step(true)).toThrow('child failed');
    session.restore(root);
    expect(session.step(false)).toBe(1);
  });
});
