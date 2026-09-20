import { expect, it } from 'vitest';
import { CombatAttributeSet } from '../attributes/combatAttributes';
import { CombatBuffContainer } from './combatBuffs';
import { executePoiseDamage } from '../damage/poiseDamage';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { BuffDefinitionOperationTarget } from './buffDefinitionOperationTarget';
import { CombatClock } from '../time/combatClock';
import { CombatVitals } from '../resources/combatVitals';
import { CombatVitalsRuntime } from '../resources/combatVitalsRuntime';
import { POISE_BREAK_BUFF_ID, PoiseBreakBuffRuntime } from './poiseBreakBuffRuntime';

it('恢复清理列表只解析当前容器的实例，不结束旧分支或同 ID 的其他实例', () => {
  const createTarget = () =>
    new BuffDefinitionOperationTarget(
      new CombatBuffContainer<string>('enemy', new CombatAttributeSet<string>()),
      {
        get: () => undefined,
        compile: () => ({ id: POISE_BREAK_BUFF_ID, stackingType: 'unlimited' }),
      },
    );
  const definition = { stackingType: 'unlimited' as const };
  const oldTarget = createTarget();
  const oldRuntime = new PoiseBreakBuffRuntime(oldTarget);
  oldRuntime.begin('source', definition);
  const oldBuff = oldTarget.container.buffs[0]!;
  const saved = structuredClone(oldRuntime.runtimeState);
  const target = createTarget();
  const restoredBuff = target.applyScoped({
    buffId: POISE_BREAK_BUFF_ID,
    definition,
    sourceId: 'source',
    blackboardValues: {},
  })!;
  const independent = target.applyScoped({
    buffId: POISE_BREAK_BUFF_ID,
    definition,
    sourceId: 'other',
    blackboardValues: {},
  })!;
  expect(restoredBuff.instanceId).toBe(oldBuff.instanceId);
  const restored = new PoiseBreakBuffRuntime(target, saved);
  restored.recover();
  expect(restoredBuff.isFinished).toBe(true);
  expect(oldBuff.isFinished).toBe(false);
  expect(independent.isFinished).toBe(false);
  expect(oldRuntime.runtimeState.size).toBe(1);
  expect(restored.runtimeState.size).toBe(0);
});

it('事件前施加，恢复事件前只清理登记实例，延迟标签不延长 Buff；重复周期不泄漏', () => {
  const container = new CombatBuffContainer<string>('enemy', new CombatAttributeSet<string>());
  const definition = { stackingType: 'unlimited' as const };
  const target = new BuffDefinitionOperationTarget(container, {
    get: () => undefined,
    compile: () => ({ id: POISE_BREAK_BUFF_ID, stackingType: 'unlimited' }),
  });
  const lifecycle = new PoiseBreakBuffRuntime(target);
  const independent = target.applyScoped({
    buffId: POISE_BREAK_BUFF_ID,
    definition,
    sourceId: 'independent',
    blackboardValues: {},
  })!;
  const vitals = new CombatVitals({
    health: 100,
    maxHealth: 100,
    poise: 100,
    maxPoise: 100,
    poiseRecoveryTime: 1,
    poiseRecoveryTimeMultiplier: 1,
    poiseBrokenEndTime: 2,
    poiseImmune: false,
  });
  const clock = new CombatClock();
  const receipt = new CombatReceiptCollector();
  const events: string[] = [];
  const runtime = new CombatVitalsRuntime({
    ownerId: 'enemy',
    clock,
    receipt,
    vitals,
    beforePoiseRecovered: () => lifecycle.recover(),
    emitOwnerEvent: () => {
      expect(target.getCountByIds([POISE_BREAK_BUFF_ID])).toBe(1);
      expect(vitals.hasPoiseBrokenTag).toBe(true);
      expect(independent.isFinished).toBe(false);
      events.push('recovered');
    },
  });
  for (const sourceId of ['first', 'second']) {
    executePoiseDamage({
      sourceId,
      targetId: 'enemy',
      target: vitals,
      calculationValue: 100,
      outputMultiplier: 1,
      takenMultiplier: 1,
      clock,
      receipt,
      emitSourceEvent: () => {},
      beforePoiseZero: modifier => lifecycle.begin(modifier.sourceId, definition),
      emitTargetEvent: event => {
        if (event !== 'poiseZero') return;
        expect(target.getCountByIds([POISE_BREAK_BUFF_ID])).toBe(2);
        expect(container.findFirst(buff => buff.sourceId === sourceId)).toBeDefined();
        events.push('zero');
      },
    });
    if (sourceId === 'second') container.findFirst(buff => buff.sourceId === sourceId)!.finish();
    runtime.advance(1);
    runtime.advance(2);
  }
  expect(events).toEqual(['zero', 'recovered', 'zero', 'recovered']);
  lifecycle.recover();
  expect(independent.isFinished).toBe(false);
});
