import { beforeEach, describe, expect, it } from 'vitest';
import { EffectManager } from './EffectManager';
import { Effect } from '../effects/types';

describe('EffectManager', () => {
  let manager: EffectManager;

  beforeEach(() => {
    manager = new EffectManager();
  });

  it('adds effects and tracks tags', () => {
    const effect = new Effect({
      id: 'test_buff',
      name: 'Test Buff',
      tags: ['ELEMENT_HEAT'],
    });

    manager.add(effect);

    expect(manager.getAll().length).toBe(1);
    expect(manager.hasTag('ELEMENT_HEAT')).toBe(true);
  });

  it('stacks effects with the same id', () => {
    const effect1 = new Effect({
      id: 'stacking_buff',
      name: 'Stacking Buff',
      tags: ['ELEMENT_HEAT'],
      currentStacks: 2,
      maxStacks: 4,
    });

    const effect2 = new Effect({
      id: 'stacking_buff',
      name: 'Stacking Buff',
      tags: ['ELEMENT_HEAT'],
      currentStacks: 3,
      maxStacks: 4,
    });

    manager.add(effect1);
    expect(manager.getAll()[0]?.effect.currentStacks).toBe(2);

    manager.add(effect2);
    expect(manager.getAll()).toHaveLength(1);
    expect(manager.getAll()[0]?.effect.currentStacks).toBe(4);
  });

  it('removes effects and clears tags', () => {
    const effect = new Effect({
      id: 'temp_buff',
      name: 'Temp Buff',
      tags: ['ELEMENT_HEAT'],
    });

    const inst = manager.add(effect);
    expect(manager.hasTag('ELEMENT_HEAT')).toBe(true);

    manager.remove(inst.id);
    expect(manager.getAll().length).toBe(0);
    expect(manager.hasTag('ELEMENT_HEAT')).toBe(false);
  });

  it('stores apply context on the instance', () => {
    const effect = new Effect({
      id: 'context_buff',
      name: 'Context Buff',
      tags: [],
    });

    const instance = manager.add(effect, {
      targetId: 'boss',
      actorId: 'alpha',
      actionId: 'alpha_skill_inst',
    });

    expect(instance).toMatchObject({
      targetId: 'boss',
      actorId: 'alpha',
      actionId: 'alpha_skill_inst',
    });
  });

  it('returns full instance context on remove', () => {
    const effect = new Effect({
      id: 'remove_context_buff',
      name: 'Remove Context Buff',
      tags: [],
    });

    const instance = manager.add(effect, {
      targetId: 'alpha',
      actorId: 'alpha',
      actionId: 'alpha_attack_inst',
    });

    expect(manager.remove(instance.id)).toMatchObject({
      id: instance.id,
      targetId: 'alpha',
      actorId: 'alpha',
      actionId: 'alpha_attack_inst',
    });
  });

  it('updates refresh-duration stack context to the latest apply source', () => {
    const initial = new Effect({
      id: 'refresh_buff',
      name: 'Refresh Buff',
      tags: [],
      currentStacks: 1,
      maxStacks: 3,
      startTime: 1,
      stackStrategy: 'REFRESH_DURATION',
    });
    const refreshed = new Effect({
      id: 'refresh_buff',
      name: 'Refresh Buff',
      tags: [],
      currentStacks: 1,
      maxStacks: 3,
      startTime: 5,
      stackStrategy: 'REFRESH_DURATION',
    });

    manager.add(initial, {
      targetId: 'boss',
      actorId: 'alpha',
      actionId: 'alpha_attack_inst',
    });
    const stacked = manager.add(refreshed, {
      targetId: 'boss',
      actorId: 'beta',
      actionId: 'beta_skill_inst',
    });

    expect(stacked.effect.startTime).toBe(5);
    expect(stacked.effect.currentStacks).toBe(2);
    expect(stacked).toMatchObject({
      targetId: 'boss',
      actorId: 'beta',
      actionId: 'beta_skill_inst',
    });
  });

  it('keeps independent stacks as separate instances', () => {
    manager.add(
      new Effect({
        id: 'independent_buff',
        name: 'Independent Buff',
        tags: [],
        currentStacks: 1,
        maxStacks: 4,
        stackStrategy: 'INDEPENDENT',
      }),
    );
    manager.add(
      new Effect({
        id: 'independent_buff',
        name: 'Independent Buff',
        tags: [],
        currentStacks: 2,
        maxStacks: 4,
        stackStrategy: 'INDEPENDENT',
      }),
    );

    const instances = manager
      .getAll()
      .filter(instance => instance.effect.id === 'independent_buff');
    expect(instances).toHaveLength(2);
    expect(instances.map(instance => instance.effect.currentStacks)).toEqual([1, 2]);
  });

  it('replaces same-id effects when stack strategy is replace', () => {
    manager.add(
      new Effect({
        id: 'replace_buff',
        name: 'Replace Buff',
        tags: [],
        currentStacks: 1,
        maxStacks: 1,
      }),
    );

    manager.add(
      new Effect({
        id: 'replace_buff',
        name: 'Replace Buff',
        tags: [],
        currentStacks: 1,
        maxStacks: 1,
        stackStrategy: 'REPLACE',
        startTime: 12,
      }),
    );

    const instances = manager.getAll().filter(instance => instance.effect.id === 'replace_buff');
    expect(instances).toHaveLength(1);
    expect(instances[0]?.effect.startTime).toBe(12);
  });
});
