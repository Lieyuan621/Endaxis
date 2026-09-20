import { describe, expect, it } from 'vitest';
import type {
  CombatReceiptEntry,
  CombatReceiptValue,
} from '../../../core/combat/receipt/combatReceipt';
import { summarizeTimelineBattleLogEntry } from './timelineBattleLogEntrySummary';

function receipt(event: string, data?: Record<string, CombatReceiptValue>): CombatReceiptEntry {
  return { sequence: 1, frame: 30, time: 1, event, ...(data === undefined ? {} : { data }) };
}

const options = {
  damageTypeLabel: (type: string) => ({ heat: '灼热', electric: '电磁' })[type] ?? type,
  formatValue: (value: CombatReceiptValue) => String(value),
  overhealingLabel: (value: string) => `过量 ${value}`,
  semanticLabel: (_group: string, value: string) =>
    ({ poiseBreak: '失衡', cancelled: '取消', notConsumed: '未消费', attachmentOnly: '仅附着' })[
      value
    ] ?? value,
};

describe('summarizeTimelineBattleLogEntry', () => {
  it('summarizes damage, healing, poise and resources from frozen receipt values', () => {
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('DamageApplied', { damageType: 'heat', value: 123 }),
        options,
      ),
    ).toBe('灼热 · 123');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('HealingApplied', { actualHealing: 40, overhealing: 10 }),
        options,
      ),
    ).toBe('+40 · 过量 10');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('PoiseApplied', { previousPoise: 50, currentPoise: 0, brokePoise: true }),
        options,
      ),
    ).toBe('50 → 0 · 失衡');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('SpChanged', { previousValue: 100, currentValue: 125, actualValue: 25 }),
        options,
      ),
    ).toBe('100 → 125 · +25');
  });

  it('summarizes Buff, elemental and status lifecycles without guessing display names', () => {
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('BuffApplied', { buffId: 'buff:x', layers: 2 }),
        options,
      ),
    ).toBe('buff:x · ×2');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('ElementalInflictionApplied', {
          requestedElement: 'electric',
          currentElement: 'electric',
          currentLayers: 3,
          outcomeKind: 'attachmentOnly',
        }),
        options,
      ),
    ).toBe('电磁 · 电磁 ×3 · 仅附着');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('StatusChanged', {
          statusKey: 'conductive',
          previousStacks: 1,
          currentStacks: 2,
          reason: 'applied',
        }),
        options,
      ),
    ).toBe('conductive · 1 → 2 · applied');
  });

  it('summarizes ability entities and skill bookkeeping while preserving a generic audit fallback', () => {
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('AbilityEntitySpawned', {
          abilityEntityId: 'entity:mine',
          childSkillId: 'pulse',
          remainingDurationSeconds: 5,
        }),
        options,
      ),
    ).toBe('entity:mine · pulse · 5s');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('SkillCostApplied', { nonReturnedSpCost: 80, remainingUltimateEnergy: 50 }),
        options,
      ),
    ).toBe('SP -80 · ULT 50');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('SkillCooldownAdjusted', { skillId: 'combo', remainingFrames: 45 }),
        options,
      ),
    ).toBe('combo · 45f');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('UnknownFact', { alpha: 1, beta: 'two', gamma: 3 }),
        options,
      ),
    ).toBe('alpha=1 · beta=two');
  });
});
