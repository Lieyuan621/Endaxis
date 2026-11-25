import { describe, expect, it } from 'vitest';
import { compileEnemyLifecycle } from '../../compiler/compileEnemyLifecycle';
import { EnemyLifecycle, type EnemyLifecycleTransition } from './enemyLifecycle';

describe('敌人时间线状态', () => {
  it('离场重入保留身份；同帧死亡胜过重入，恢复不重放已发生的转换', () => {
    const program = compileEnemyLifecycle(
      {
        spawnFrame: -10,
        presenceChanges: [
          { id: 'leave', frame: 0, present: false },
          { id: 'enter', frame: 5, present: true },
          { id: 'leave-again', frame: 10, present: false },
          { id: 'enter-at-death', frame: 20, present: true },
        ],
        deathFrame: 20,
      },
      -30,
    );
    const events: EnemyLifecycleTransition[] = [];
    const publish = (event: EnemyLifecycleTransition) => events.push(event);
    let lifecycle = new EnemyLifecycle(program, false);
    const die = (frame: number) => {
      lifecycle.die(frame, publish);
    };
    lifecycle.advance(-30, publish, die);
    expect(lifecycle.alive).toBe(false);
    expect(lifecycle.usesDummyHealthChecks).toBe(false);
    lifecycle.advance(0, publish, die);
    expect(lifecycle.alive).toBe(true);
    expect(lifecycle.present).toBe(false);
    expect(lifecycle.usesDummyHealthChecks).toBe(true);
    const saved = structuredClone(lifecycle.runtimeState);
    lifecycle.advance(10, publish, die);
    expect(events.map(event => event.kind)).toEqual(['spawn', 'leave', 'enter', 'leave']);
    lifecycle = new EnemyLifecycle(program, false, saved);
    events.length = 0;
    lifecycle.advance(0, publish, die);
    expect(events).toEqual([]);
    lifecycle.advance(20, publish, die);
    expect(events.map(event => [event.frame, event.kind])).toEqual([
      [5, 'enter'],
      [10, 'leave'],
      [20, 'death'],
    ]);
    expect(lifecycle.usesDummyHealthChecks).toBe(false);
    expect(lifecycle.die(21, publish)).toBe(false);
    lifecycle.advance(30, publish, die);
    expect(events).toHaveLength(3);
  });

  it('自动死亡开启时仍执行手动死亡，离场中确认死亡也只发生一次', () => {
    const program = compileEnemyLifecycle(
      {
        spawnFrame: 0,
        presenceChanges: [{ id: 'leave', frame: 3, present: false }],
        deathFrame: 5,
      },
      0,
    );
    const lifecycle = new EnemyLifecycle(program, true);
    const events: EnemyLifecycleTransition[] = [];
    const publish = (event: EnemyLifecycleTransition) => events.push(event);
    lifecycle.advance(6, publish, frame => {
      lifecycle.die(frame, publish);
    });
    expect(lifecycle.alive).toBe(false);
    expect(lifecycle.usesDummyHealthChecks).toBe(false);
    expect(lifecycle.die(6, publish)).toBe(false);
    expect(lifecycle.runtimeState.deathFrame).toBe(5);
    expect(events.map(event => event.kind)).toEqual(['spawn', 'leave', 'death']);
    expect(program.deathFrame).toBe(5);
  });

  it('拒绝含糊的同帧切入切出及出生前死亡，旧方案准备阶段保持在场', () => {
    expect(() =>
      compileEnemyLifecycle({ spawnFrame: 10, deathFrame: 9, presenceChanges: [] }, 0),
    ).toThrow('deathFrame');
    expect(() =>
      compileEnemyLifecycle(
        {
          spawnFrame: 0,
          presenceChanges: [
            { id: 'leave', frame: 2, present: false },
            { id: 'enter', frame: 2, present: true },
          ],
        },
        0,
      ),
    ).toThrow('presenceChanges[1].frame');
    const legacy = new EnemyLifecycle(compileEnemyLifecycle(undefined, -60), false);
    legacy.advance(
      -60,
      () => {},
      () => {},
    );
    expect(legacy.present).toBe(true);
  });
});
