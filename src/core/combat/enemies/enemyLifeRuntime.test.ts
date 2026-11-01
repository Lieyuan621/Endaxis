import { expect, it, vi } from 'vitest';
import { EnemyLifeRuntime } from './enemyLifeRuntime';
import { EnemyLifecycle } from './enemyLifecycle';
import { CombatVitals } from '../resources/combatVitals';

it.each([false, true])(
  '自动死亡=%s：归零与死亡事件分别观察存活和死亡状态，且只触发一次',
  automatic => {
    const lifecycle = new EnemyLifecycle(
      { spawnFrame: 0, presenceChanges: [], deathFrame: 10 },
      automatic,
    );
    const vitals = new CombatVitals({
      health: 100,
      maxHealth: 100,
      poise: 0,
      maxPoise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    let frame = 0;
    const events: unknown[] = [];
    const died = vi.fn();
    const runtime = new EnemyLifeRuntime(lifecycle, vitals, {
      spawn: () => {},
      transition: () => {},
      died,
      emit: event => events.push([event, vitals.health, lifecycle.alive]),
    });
    vitals.bindHealthChangeObserver(() => runtime.healthChanged(frame));
    runtime.advanceFrame(0);
    frame = 5;
    vitals.takeDamage(100);
    expect(lifecycle.alive).toBe(!automatic);
    if (!automatic) expect(events).toEqual([]);
    frame = 10;
    runtime.advanceFrame(frame);
    expect(events).toEqual([
      ['ownerHpZero', 0, true],
      ['ownerDead', 0, false],
    ]);
    expect(died).toHaveBeenCalledOnce();
    runtime.healthChanged(11);
    runtime.advanceFrame(12);
    expect(died).toHaveBeenCalledOnce();
    expect(lifecycle.runtimeState.deathFrame).toBe(automatic ? 5 : 10);
  },
);

it('生命下限挡住自动死亡，但人为死亡直接归零且不伪造伤害', () => {
  const vitals = new CombatVitals({
    health: 100,
    maxHealth: 100,
    poise: 0,
    maxPoise: 0,
    poiseRecoveryTime: 0,
    poiseRecoveryTimeMultiplier: 1,
    poiseBrokenEndTime: 0,
    poiseImmune: false,
  });
  vitals.registerHealthFloor(1);
  const events: string[] = [];
  const lifecycle = new EnemyLifecycle(
    { spawnFrame: 0, presenceChanges: [], deathFrame: 2 },
    false,
  );
  const runtime = new EnemyLifeRuntime(lifecycle, vitals, {
    spawn: () => {},
    transition: () => {},
    died: () => {},
    emit: event => events.push(event),
  });
  runtime.advanceFrame(0);
  vitals.takeDamage(200);
  expect(vitals.health).toBe(1);
  runtime.advanceFrame(2);
  expect(vitals.health).toBe(0);
  expect(events).toEqual(['ownerHpZero', 'ownerDead']);
});
