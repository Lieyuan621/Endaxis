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
  formatDamage: (value: number) => String(value),
  overhealingLabel: (value: string) => `过量 ${value}`,
  semanticLabel: (_group: string, value: string) =>
    ({
      poiseBreak: '失衡',
      cancelled: '取消',
      notConsumed: '未消费',
      attachmentOnly: '仅附着',
      applied: '施加',
      passed: '条件满足',
      failed: '条件未满足',
    })[value] ?? value,
  identityLabel: (_kind: string, id: string) =>
    ({
      'buff:x': '灼热增益',
      'entity:mine': '地雷',
      pulse: '脉冲',
      combo: '连携',
      conductive: '导电',
    })[id] ?? null,
};

describe('summarizeTimelineBattleLogEntry', () => {
  it('summarizes healing, poise and resources from frozen receipt values', () => {
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

  it('formats both sides of a resource transition through the display formatter', () => {
    const formatted = {
      ...options,
      formatValue: (value: CombatReceiptValue) =>
        typeof value === 'number' ? value.toFixed(2) : String(value),
      formatDamage: (value: number) => String(Math.round(value)),
    };
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('SpChanged', {
          previousValue: 247.1297090018131,
          currentValue: 247.3963756684798,
          actualValue: 0.2666666666667,
        }),
        formatted,
      ),
    ).toBe('247.13 → 247.40 · +0.27');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('SpellBurstApplied', { value: 5853.211249999999 }),
        formatted,
      ),
    ).toBe('5853');
  });

  it('summarizes Buff, elemental and status lifecycles using known display names', () => {
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('BuffApplied', { buffId: 'buff:x', layers: 2 }),
        options,
      ),
    ).toBe('灼热增益 · ×2');
    expect(
      summarizeTimelineBattleLogEntry(receipt('BuffCreated', { buffId: 'buff:x' }), options),
    ).toBe('灼热增益');
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
    ).toBe('导电 · 1 → 2 · 施加');
  });

  it('summarizes named skills while keeping unknown IDs out of the ordinary view', () => {
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('AbilityEntitySpawned', {
          abilityEntityId: 'entity:mine',
          childSkillId: 'pulse',
          remainingDurationSeconds: 5,
        }),
        options,
      ),
    ).toBe('脉冲 · 5s');
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
    ).toBe('连携 · 45f');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('UnknownFact', { alpha: 1, beta: 'two', gamma: 3 }),
        options,
      ),
    ).toBe('');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('CombatConditionEvaluated', { kind: 'internalCheck', passed: false }),
        options,
      ),
    ).toBe('条件未满足');
    expect(
      summarizeTimelineBattleLogEntry(
        receipt('SkillCooldownAdjusted', { skillId: 'unknown', remainingFrames: 45 }),
        options,
      ),
    ).toBe('45f');
  });
});
