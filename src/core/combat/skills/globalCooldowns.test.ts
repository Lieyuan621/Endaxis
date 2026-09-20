import { describe, expect, it } from 'vitest';
import { GlobalCooldowns } from './globalCooldowns';
import { TimedMarkerContainer } from '../status/timedMarkers';
import { TimedMarkerOperationExecutor } from '../status/timedMarkerOperationExecutor';
import { ActionBlackboard } from '../actions/actionBlackboard';
import type { ResolvedCombatOperationStep } from '../../compiler/combatProgram';

describe('战斗级全局冷却', () => {
  it('恢复同帧清理位置，不提前删除刚写入的过期项，也不保留另一分支的刷新', () => {
    const clock = { time: 1 };
    const original = new GlobalCooldowns(clock);
    original.set('a', 'x', -1);
    const saved = structuredClone(original.runtimeState);
    clock.time = 2;
    original.set('a', 'x', 100);
    const restoredClock = { time: 1 };
    const restored = new GlobalCooldowns(restoredClock, structuredClone(saved));
    expect(restored.has('a', 'x')).toBe(true);
    restoredClock.time = 2;
    expect(restored.has('a', 'x')).toBe(false);
    expect(original.has('a', 'x')).toBe(true);
    expect(saved.entries.get('a')?.get('x')).toBe(0);
  });

  it('同角色/ID 刷新而非并存；缩短、延长均生效，其他角色和 ID 独立', () => {
    const clock = { time: 0 };
    const cooldowns = new GlobalCooldowns(clock);
    cooldowns.set('a', 'x', 10);
    cooldowns.set('b', 'x', 20);
    cooldowns.set('a', 'y', 20);
    clock.time = 1;
    cooldowns.set('a', 'x', 0.1);
    clock.time = 1.2;
    expect(cooldowns.has('a', 'x')).toBe(false);
    expect(cooldowns.has('b', 'x')).toBe(true);
    expect(cooldowns.has('a', 'y')).toBe(true);
    cooldowns.set('a', 'x', 1);
    clock.time = 2;
    cooldowns.set('a', 'x', 5);
    clock.time = 3;
    expect(cooldowns.has('a', 'x')).toBe(true);
  });

  it('到期 epsilon 与原生证据一致；零时长新项在创建同帧存在', () => {
    const clock = { time: 0 };
    const cooldowns = new GlobalCooldowns(clock);
    cooldowns.set('a', 'x', 0.3);
    clock.time = 0.300005;
    expect(cooldowns.has('a', 'x')).toBe(true);
    clock.time += 0.000006;
    expect(cooldowns.has('a', 'x')).toBe(false);
    cooldowns.set('a', 'zero', 0);
    expect(cooldowns.has('a', 'zero')).toBe(true);
    clock.time += 1 / 30;
    expect(cooldowns.has('a', 'zero')).toBe(false);
    expect(() => cooldowns.set('a', '', 1)).toThrow('IDs');
    expect(() => cooldowns.set('a', 'x', NaN)).toThrow('finite');
  });

  it.each(['buffOwner', 'buffSource', 'caster'] as const)(
    '%s 检查/写入共享身份；不混入普通标记，不随动作结束或角色膨胀改变',
    target => {
      const clock = { time: 0 },
        localClock = { time: 0 };
      const globalCooldowns = new GlobalCooldowns(clock);
      const ordinary = new TimedMarkerContainer('caster', localClock);
      const ids = { caster: 'a', buffOwner: 'b', buffSource: 'c' };
      const context = {
        blackboard: new ActionBlackboard({ cd: 0.1 }),
        buffOwnerId: 'b',
        buffSourceId: 'c',
      };
      const executor = new TimedMarkerOperationExecutor({
        globalCooldowns,
        resolveCooldownCharacter: value => ids[value],
        resolveTarget: () => ordinary,
        delegate: {
          execute: () => {
            throw new Error('unexpected delegation');
          },
          evaluate: () => false,
        },
      });
      ordinary.add('x', 100);
      const condition = { kind: 'globalCooldownPresent' as const, target, markerId: 'x' };
      expect(executor.evaluate(condition, context)).toBe(false);
      const step: ResolvedCombatOperationStep = {
        kind: 'setGlobalCooldown',
        parameters: {
          target,
          markerId: 'x',
          durationSeconds: { kind: 'blackboard', key: 'cd' },
        },
      };
      executor.execute(step, context);
      expect(executor.evaluate(condition, context)).toBe(true);
      for (const id of Object.values(ids).filter(id => id !== ids[target]))
        expect(globalCooldowns.has(id, 'x')).toBe(false);
      executor.end(step, context);
      expect(executor.evaluate(condition, context)).toBe(true);
      clock.time = 4 / 30;
      expect(executor.evaluate(condition, context)).toBe(false);
      expect(ordinary.has('x')).toBe(true);
      globalCooldowns.set(ids[target], 'only-global', 1);
      expect(ordinary.has('only-global')).toBe(false);
      expect(() => executor.execute(step)).toThrow('context');
    },
  );
});
