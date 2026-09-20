/** 容器回退必须一起恢复编号、标签引用次数和添加冷却。 */
import { expect, it } from 'vitest';
import { StateStepper } from '../runtime/stateStepper';
import {
  createBuffContainerState,
  createBuffInstanceState,
  createBuffStackingState,
} from '../state/instanceState';
import {
  addBuffEntityTags,
  advanceBuffAddingCooldowns,
  removeBuffEntityTags,
} from './buffContainerExecution';

it('restores tag counts, cooldown lists and allocation order', () => {
  const state = createBuffContainerState();
  addBuffEntityTags(state, ['active', 'active']);
  state.addingCooldowns.set('buff', [1, 3]);
  const session = new StateStepper(state, (step, delta: number) => {
    advanceBuffAddingCooldowns(step.state, delta);
    removeBuffEntityTags(step.state, ['active']);
    return step.state.nextInstanceId++;
  });
  const root = session.save();
  expect(session.step(2)).toBe(1);
  expect(session.read().addingCooldowns.get('buff')).toEqual([1]);
  expect(session.read().entityTagCounts.get('active')).toBe(1);
  expect(session.step(2)).toBe(2);
  expect(session.read().addingCooldowns.size).toBe(0);
  expect(session.read().entityTagCounts.size).toBe(0);
  session.restore(root);
  expect(session.step(-1)).toBe(1);
  expect(session.read().addingCooldowns.get('buff')).toEqual([1, 3]);
  expect(session.read().entityTagCounts.get('active')).toBe(1);
  expect(state.nextInstanceId).toBe(1);
});

it('restores instance data and stacking membership after recycling a branch', () => {
  const state = createBuffContainerState();
  const instance = createBuffInstanceState({
    ownerId: 'owner',
    instanceId: 1,
    definitionId: 'buff',
    sourceId: 'source',
  });
  const group = createBuffStackingState();
  state.instances.set(1, instance);
  state.memberIds.push(1);
  group.members.push(1);
  state.stackingGroups.set('group', group);
  const session = new StateStepper(state, (step, recycle: boolean) => {
    const buff = step.state.instances.get(1)!;
    buff.lifecycle.finished = true;
    if (recycle) {
      step.state.instances.delete(1);
      step.state.memberIds.splice(0, 1);
      step.state.stackingGroups.get('group')!.members.splice(0, 1);
    }
  });
  const root = session.save();
  session.step(true);
  expect(session.read().instances.size).toBe(0);
  session.restore(root);
  const restored = session.read();
  expect(restored.memberIds).toEqual([1]);
  expect(restored.stackingGroups.get('group')!.members).toEqual([1]);
  expect(restored.instances.get(1)!.lifecycle.finished).toBe(false);
  session.step(false);
  expect(instance.lifecycle.finished).toBe(false);
});
