import { describe, expect, it } from 'vitest';
import { EnemyEffectHandler } from './EnemyEffectHandler';
import { EnemyState } from '../state/EnemyState';

function createContext() {
  const queued: any[] = [];
  const logs: any[] = [];
  const ctx = {
    state: {
      enemy: new EnemyState(
        {
          level: 80,
          defense: 100,
          resistance: {},
          maxHp: 100000,
          maxStagger: 100,
          staggerNodeCount: 0,
          staggerNodeDuration: 0,
          staggerBreakDuration: 0,
        } as any,
        {
          getShiftedTime: (time: number, duration: number) => time + duration,
        } as any,
      ),
    },
    queue: {
      enqueue: (event: any) => queued.push(event),
      cancel: (predicate: (event: any) => boolean) => {
        for (let index = queued.length - 1; index >= 0; index -= 1) {
          if (predicate(queued[index])) queued.splice(index, 1);
        }
      },
    },
    enemyLog: (event: any) => logs.push(event),
    getShiftedTime: (time: number, duration: number) => time + duration,
  };

  return { ctx: ctx as any, queued, logs };
}

describe('EnemyEffectHandler stack strategies', () => {
  it('replaces same-element infliction stacks when stack strategy is replace', () => {
    const handler = new EnemyEffectHandler();
    const { ctx } = createContext();

    handler.handle({
      type: 'ENEMY_EFFECT_APPLY',
      kind: 'infliction',
      time: 1,
      element: 'electric',
      stacks: 3,
      effectiveDuration: 10,
      sourceId: 'alpha',
    } as any, ctx);
    handler.handle({
      type: 'ENEMY_EFFECT_APPLY',
      kind: 'infliction',
      time: 2,
      element: 'electric',
      stacks: 1,
      effectiveDuration: 10,
      sourceId: 'beta',
      stackStrategy: 'REPLACE',
    } as any, ctx);

    expect(ctx.state.enemy.infliction?.stacks).toBe(1);
    expect(ctx.state.enemy.infliction?.sourceQueue).toEqual([{ sourceId: 'beta', count: 1 }]);
  });

  it('replaces vulnerability stacks when physical status stack strategy is replace', () => {
    const handler = new EnemyEffectHandler();
    const { ctx } = createContext();

    handler.handle({
      type: 'ENEMY_EFFECT_APPLY',
      kind: 'physicalStatus',
      time: 1,
      physicalType: 'vulnerability',
      effectiveDuration: 10,
      sourceId: 'alpha',
    } as any, ctx);
    handler.handle({
      type: 'ENEMY_EFFECT_APPLY',
      kind: 'physicalStatus',
      time: 2,
      physicalType: 'vulnerability',
      effectiveDuration: 10,
      sourceId: 'beta',
      stackStrategy: 'REPLACE',
    } as any, ctx);

    expect(ctx.state.enemy.vulnerability?.stacks).toBe(1);
    expect(ctx.state.enemy.vulnerability?.sourceQueue).toEqual([{ sourceId: 'beta', count: 1 }]);
  });
});
