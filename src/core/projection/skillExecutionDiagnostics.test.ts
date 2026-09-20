import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectSkillExecutionDiagnostics } from './skillExecutionDiagnostics';

function receipt(
  sequence: number,
  event: string,
  overrides: Partial<CombatReceiptEntry> = {},
): CombatReceiptEntry {
  return {
    sequence,
    frame: 18,
    time: 0.6,
    event,
    sourceId: 'perlica',
    data: { skillId: 'battleSkill' },
    ...overrides,
  };
}

describe('projectSkillExecutionDiagnostics', () => {
  it('将扣费帧的支付失败投影为独立执行期原因', () => {
    expect(
      projectSkillExecutionDiagnostics([
        receipt(0, 'SkillCostUnavailableAtStart', { frame: 12 }),
        receipt(1, 'SkillStarted', { frame: 12 }),
        receipt(2, 'SkillCostRejected'),
      ]),
    ).toEqual([
      {
        frame: 18,
        sourceId: 'perlica',
        skillId: 'battleSkill',
        reasons: ['costPaymentRejected'],
        receiptSequences: [2],
      },
    ]);
  });

  it('按帧、来源和技能分别定位，并保持首个事实顺序', () => {
    expect(
      projectSkillExecutionDiagnostics([
        receipt(3, 'SkillCostRejected', {
          frame: 30,
          sourceId: 'arcane',
          data: { skillId: 'ultimate' },
        }),
        receipt(4, 'SkillCostRejected'),
      ]),
    ).toEqual([
      {
        frame: 30,
        sourceId: 'arcane',
        skillId: 'ultimate',
        reasons: ['costPaymentRejected'],
        receiptSequences: [3],
      },
      {
        frame: 18,
        sourceId: 'perlica',
        skillId: 'battleSkill',
        reasons: ['costPaymentRejected'],
        receiptSequences: [4],
      },
    ]);
  });

  it('合并同一执行位置的重复事实并保留全部回执序号', () => {
    expect(
      projectSkillExecutionDiagnostics([
        receipt(5, 'SkillCostRejected'),
        receipt(6, 'SkillCostRejected'),
      ]),
    ).toEqual([
      {
        frame: 18,
        sourceId: 'perlica',
        skillId: 'battleSkill',
        reasons: ['costPaymentRejected'],
        receiptSequences: [5, 6],
      },
    ]);
  });

  it('拒绝无法定位到动作的执行期事实', () => {
    expect(() =>
      projectSkillExecutionDiagnostics([receipt(7, 'SkillCostRejected', { sourceId: undefined })]),
    ).toThrow("receipt 7 'SkillCostRejected' has no sourceId");

    expect(() =>
      projectSkillExecutionDiagnostics([receipt(8, 'SkillCostRejected', { data: undefined })]),
    ).toThrow("receipt 8 'SkillCostRejected' has no skillId");
  });

  it('忽略开始时诊断和成功扣费等其他回执', () => {
    expect(
      projectSkillExecutionDiagnostics([
        receipt(9, 'SkillCostUnavailableAtStart'),
        receipt(10, 'SkillCooldownUnavailableAtStart'),
        receipt(11, 'SkillCostApplied'),
      ]),
    ).toEqual([]);
  });
});
