import { describe, expect, it } from 'vitest';
import type { CombatReceiptSink } from '../receipt/combatReceipt';
import { CombatClock } from '../time/combatClock';
import { CombatVitals } from '../resources/combatVitals';
import type { PlayerActiveDamageResult } from './playerActiveDamage';
import { executeHealthDamage } from './healthDamage';
import type { DamageTag } from '../../game-data/operatorDefinition';
import { CombatReceiptCollector } from '../receipt/combatReceipt';
import { groupEnemyBurstDamageHits } from '../../../ui/timeline/results/enemyBurstDamageGroups';

function createDamageResult(value: number): PlayerActiveDamageResult {
  return {
    value,
    isCritical: true,
    criticalMultiplier: 1.5,
    defenseMultiplier: 0.8,
    resistanceMultiplier: 0.9,
    weaknessShelterMultiplier: 1,
    runtimeExtensionMultiplier: 1,
    igniteMultiplier: 1,
    physicalInflictionMultiplier: 1,
  };
}

describe('executeHealthDamage', () => {
  it.each([
    [['fireBurst'], 'Fire'],
    [['electricBurst'], 'Pulse'],
    [['cryoBurst'], 'Cryst'],
    [['natureBurst'], 'Natural'],
    [['cryoBurst', 'cryoBurst', 'comboSkill'], 'Cryst'],
    [['comboSkill', 'cryoAbnormal'], undefined],
    [['fireBurst', 'electricBurst'], undefined],
    [[], undefined],
  ] as const)('伤害标签 %j 决定爆发回执分类，不依赖伤害元素或技能类型', (tags, expected) => {
    const receipt = new CombatReceiptCollector();
    const target = new CombatVitals({
      health: 100,
      maxHealth: 100,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    executeHealthDamage({
      sourceId: 'operator',
      targetId: 'enemy',
      damageType: 'electric',
      tags: tags as readonly DamageTag[],
      result: createDamageResult(1),
      target,
      clock: new CombatClock(),
      receipt,
      detail: { skillType: 'comboSkill' },
      emitSourceEvent: () => undefined,
      emitTargetEvent: () => undefined,
    });
    expect(receipt.entries).toHaveLength(1);
    expect(receipt.entries[0]!.data?.spellBurstType).toBe(expected);
    expect(groupEnemyBurstDamageHits(receipt.entries)).toHaveLength(expected === undefined ? 0 : 1);
    expect(target.health).toBe(99);
  });
  it.each([
    undefined,
    null,
    {
      skillCastId: 7,
      originSkillId: 'combo',
      originSkillType: 'comboSkill' as const,
      nonReturnedSpCost: 0,
    },
  ])('preserves source identity %j without adding it to target contexts', skillCastInfo => {
    const output: unknown[] = [];
    const target = new CombatVitals({
      health: 100,
      maxHealth: 100,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    executeHealthDamage({
      sourceId: 'operator',
      targetId: 'enemy',
      damageType: 'electric',
      tags: [],
      skillCastInfo,
      result: createDamageResult(1),
      target,
      clock: new CombatClock(),
      receipt: { record: () => undefined },
      emitSourceEvent: (_event, payload) => output.push(payload.skillCastInfo),
      emitTargetEvent: (_event, payload) => expect(payload).not.toHaveProperty('skillCastInfo'),
    });
    expect(output).toEqual([skillCastInfo, skillCastInfo]);
  });

  it('records mutation between the recovered before and after events', () => {
    const order: string[] = [];
    const receipt: CombatReceiptSink = {
      record: entry => order.push(`receipt:${entry.event}`),
    };
    const target = new CombatVitals({
      health: 100,
      maxHealth: 100,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });

    const result = executeHealthDamage({
      sourceId: 'operator',
      targetId: 'enemy',
      damageType: 'electric',
      tags: ['comboSkill'],
      result: createDamageResult(120),
      target,
      clock: new CombatClock(),
      receipt,
      emitSourceEvent: event => order.push(`source:${event}`),
      emitTargetEvent: event => order.push(`target:${event}`),
    });

    expect(result).toEqual({
      requestedDamage: 120,
      actualDamage: 100,
      previousHealth: 100,
      currentHealth: 0,
    });
    expect(order).toEqual([
      'target:beforeTakeDamage',
      'source:beforeOutputDamage',
      'source:beforeKillEntity',
      'source:afterKillEntity',
      'receipt:DamageApplied',
      'target:takeDamage',
      'source:outputDamage',
    ]);
  });

  it('does not emit kill events for non-lethal damage or an already defeated target', () => {
    const sourceEvents: string[] = [];
    const target = new CombatVitals({
      health: 100,
      maxHealth: 100,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });
    const execute = (value: number) =>
      executeHealthDamage({
        sourceId: 'operator',
        targetId: 'enemy',
        damageType: 'electric',
        tags: ['normalSkill'],
        result: createDamageResult(value),
        target,
        clock: new CombatClock(),
        receipt: { record: () => undefined },
        emitSourceEvent: event => sourceEvents.push(event),
        emitTargetEvent: () => undefined,
      });

    execute(40);
    execute(60);
    execute(10);

    expect(sourceEvents.filter(event => event.includes('KillEntity'))).toEqual([
      'beforeKillEntity',
      'afterKillEntity',
    ]);
  });

  it('runs shield absorption after before events and exposes the reduced value afterwards', () => {
    const values: number[] = [];
    const target = new CombatVitals({
      health: 100,
      maxHealth: 100,
      maxPoise: 0,
      poise: 0,
      poiseRecoveryTime: 0,
      poiseRecoveryTimeMultiplier: 1,
      poiseBrokenEndTime: 0,
      poiseImmune: false,
    });

    executeHealthDamage({
      sourceId: 'operator',
      targetId: 'enemy',
      damageType: 'heat',
      tags: [],
      result: createDamageResult(80),
      target,
      clock: new CombatClock(),
      receipt: { record: entry => values.push(Number(entry.data?.value)) },
      emitSourceEvent: (event, payload) => {
        if (event === 'beforeOutputDamage' || event === 'outputDamage') {
          values.push(payload.result.value);
        }
      },
      emitTargetEvent: () => undefined,
      absorbDamage: (_damageType, value) => value - 50,
    });

    expect(values).toEqual([80, 30, 30]);
    expect(target.health).toBe(70);
  });
});
