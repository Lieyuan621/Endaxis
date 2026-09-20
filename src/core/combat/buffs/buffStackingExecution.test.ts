/** 叠层组成员和 Buff 状态一起恢复；同步回收不破坏本次优先级遍历。 */
import { describe, expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import { createBuffLifecycleState, createBuffStackingState } from '../state/instanceState';
import { decreaseBuffEnhancements, enhanceBuffLifecycle } from './buffLifecycleExecution';
import {
  applyTimedBuffEnhancement,
  countBuffStackingEnhancements,
  countBuffStackingInstances,
  refreshBuffStackingPriority,
  type BuffStackingHost,
} from './buffStackingExecution';

function createSession() {
  return new StateStepper(
    {
      group: { ...createBuffStackingState(), members: [1, 2] },
      buffs: new Map([
        [1, { finished: false, enabled: false }],
        [2, { finished: false, enabled: false }],
      ]),
    },
    (step, remove: boolean) => {
      const state = step.state;
      const host: BuffStackingHost = {
        compare: (left, right) => left - right,
        isFinished: id => state.buffs.get(id)!.finished,
        enhanceCount: () => 1,
        resolve: id => {
          const buff = state.buffs.get(id)!;
          return {
            isFinished: () => buff.finished,
            enable: () => {
              buff.enabled = true;
              if (remove && id === 1) {
                state.buffs.get(2)!.finished = true;
                state.buffs.delete(2);
                state.group.members.splice(1, 1);
              }
            },
            disable: () => {
              buff.enabled = false;
            },
          };
        },
      };
      refreshBuffStackingPriority(state.group, 1, host);
      state.group.currentStackCount = countBuffStackingInstances(state.group, host);
    },
  );
}

describe('Buff stacking data', () => {
  it('checks the limit after BeforeEnhance changes the group synchronously', () => {
    const state = { ...createBuffStackingState(), currentStackCount: 1, maxStackCount: 2 };
    const events: string[] = [];
    applyTimedBuffEnhancement(state, {
      before: () => {
        state.currentStackCount = 2;
      },
      enhance: () => {
        throw new Error('must not exceed limit');
      },
      resetPeriod: () => {
        events.push('resetPeriod');
      },
      after: () => {
        events.push('after');
      },
    });
    expect(events).toEqual(['resetPeriod', 'after']);
    expect(state.currentStackCount).toBe(2);
  });

  it('restores group and instance enhancement counts across increase and decrease branches', () => {
    const session = new StateStepper(
      {
        group: {
          ...createBuffStackingState(),
          members: [1],
          currentStackCount: 1,
          maxStackCount: 2,
        },
        buff: createBuffLifecycleState(),
        events: [] as string[],
      },
      (step, input: 'increase' | 'decrease') => {
        const state = step.state;
        const attributes = {
          changed: () => {
            state.events.push(`changed:${state.buff.enhanceCount}`);
          },
          refreshAttributes: () => {
            state.events.push('attributes');
          },
        };
        if (input === 'increase')
          applyTimedBuffEnhancement(state.group, {
            before: () => {
              state.events.push('before');
            },
            enhance: () => enhanceBuffLifecycle(state.buff, attributes),
            resetPeriod: () => {
              state.events.push('resetPeriod');
            },
            after: () => {
              state.events.push('after');
            },
          });
        else
          decreaseBuffEnhancements(state.buff, 1, {
            ...attributes,
            finish: () => {
              throw new Error('unexpected finish');
            },
            refreshStacking: () => {
              state.group.currentStackCount = countBuffStackingEnhancements(state.group, {
                compare: () => 0,
                isFinished: () => state.buff.finished,
                enhanceCount: () => state.buff.enhanceCount,
                resolve: () => {
                  throw new Error('unexpected lifecycle');
                },
              });
            },
            notify: () => {
              state.events.push('notify');
            },
          });
      },
    );
    session.step('increase');
    expect(session.read().events).toEqual([
      'before',
      'changed:2',
      'attributes',
      'resetPeriod',
      'after',
    ]);
    const full = session.save();
    session.step('decrease');
    expect(session.read().group.currentStackCount).toBe(1);
    const reduced = session.save();
    session.step('increase');
    const expected = session.read();
    session.restore(full);
    session.step('increase');
    expect(session.read().buff.enhanceCount).toBe(2);
    expect(session.read().events.slice(-2)).toEqual(['before', 'after']);
    session.restore(reduced);
    session.step('increase');
    expect(session.read()).toEqual(expected);
  });

  it('restores membership after synchronous recycling in another branch', () => {
    const session = createSession();
    const root = session.save();
    session.step(false);
    const normal = session.read();
    session.restore(root);
    session.step(true);
    expect(session.read().group.members).toEqual([1]);
    expect(session.read().group.currentStackCount).toBe(1);
    const removed = session.save();
    session.restore(root);
    session.step(false);
    expect(session.read()).toEqual(normal);
    session.restore(removed);
    expect(session.read().buffs.has(2)).toBe(false);
  });
});
