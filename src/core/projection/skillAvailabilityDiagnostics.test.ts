import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectSkillAvailabilityDiagnostics } from './skillAvailabilityDiagnostics';

function receipt(
  sequence: number,
  event: string,
  overrides: Partial<CombatReceiptEntry> = {},
): CombatReceiptEntry {
  return {
    sequence,
    frame: 12,
    time: 0.4,
    event,
    sourceId: 'perlica',
    data: { skillId: 'battleSkill' },
    ...overrides,
  };
}

describe('projectSkillAvailabilityDiagnostics', () => {
  it('实际执行的技能仍显示闪避窗口未开放的原因', () => {
    expect(
      projectSkillAvailabilityDiagnostics([
        receipt(0, 'SkillInputBlockedByDashWindow'),
        receipt(1, 'SkillStarted'),
      ])[0]?.reasons,
    ).toEqual(['attackDuringDashWindow']);
  });
  it('projects common tag blockers alongside other availability diagnostics', () => {
    expect(
      projectSkillAvailabilityDiagnostics([
        receipt(0, 'SkillInputBlockedByCommonTag'),
        receipt(1, 'SkillCostUnavailableAtStart'),
        receipt(2, 'SkillStarted'),
      ])[0]?.reasons,
    ).toEqual(['skillCommonTagUnavailable', 'resourceUnavailable']);
    expect(
      projectSkillAvailabilityDiagnostics([receipt(0, 'SkillInputBlockedByTypeTag')])[0]?.reasons,
    ).toEqual(['skillTypeTagUnavailable']);
  });

  it('projects presentation input diagnostics without mistaking the presentation itself for a failure', () => {
    expect(
      projectSkillAvailabilityDiagnostics([
        receipt(0, 'UltimatePresentationChanged'),
        receipt(1, 'UltimateInputBlockedByPresentation'),
        receipt(2, 'SkillStarted'),
      ]),
    ).toEqual([
      {
        frame: 12,
        sourceId: 'perlica',
        skillId: 'battleSkill',
        reasons: ['ultimateInputDuringPresentation'],
        receiptSequences: [1],
      },
    ]);
  });

  it('归约同一技能开始位置上的资源与冷却事实', () => {
    const diagnostics = projectSkillAvailabilityDiagnostics([
      receipt(0, 'SkillCooldownUnavailableAtStart'),
      receipt(1, 'SkillCostUnavailableAtStart'),
      receipt(2, 'SkillStarted'),
    ]);

    expect(diagnostics).toEqual([
      {
        frame: 12,
        sourceId: 'perlica',
        skillId: 'battleSkill',
        reasons: ['cooldownUnavailable', 'resourceUnavailable'],
        receiptSequences: [0, 1],
      },
    ]);
  });

  it('按帧、来源与技能分别定位，并保持首个事实顺序', () => {
    const diagnostics = projectSkillAvailabilityDiagnostics([
      receipt(4, 'SkillCostUnavailableAtStart', {
        frame: 20,
        sourceId: 'arcane',
        data: { skillId: 'ultimate' },
      }),
      receipt(5, 'SkillCooldownUnavailableAtStart'),
      receipt(6, 'SkillCostUnavailableAtStart'),
    ]);

    expect(diagnostics).toEqual([
      {
        frame: 20,
        sourceId: 'arcane',
        skillId: 'ultimate',
        reasons: ['resourceUnavailable'],
        receiptSequences: [4],
      },
      {
        frame: 12,
        sourceId: 'perlica',
        skillId: 'battleSkill',
        reasons: ['cooldownUnavailable', 'resourceUnavailable'],
        receiptSequences: [5, 6],
      },
    ]);
  });

  it('重复事实只产生一个原因，同时保留全部回执序号', () => {
    const diagnostics = projectSkillAvailabilityDiagnostics([
      receipt(7, 'SkillCostUnavailableAtStart'),
      receipt(8, 'SkillCostUnavailableAtStart'),
    ]);

    expect(diagnostics[0]).toMatchObject({
      reasons: ['resourceUnavailable'],
      receiptSequences: [7, 8],
    });
  });

  it('把玩家操作解析成其他技能记为当前技能块不可用', () => {
    expect(
      projectSkillAvailabilityDiagnostics([
        receipt(9, 'SkillInputResolvedToDifferentSkill', {
          data: { skillId: 'battleSkill', actualSkillId: 'battleSkillDuringUltimate' },
        }),
      ]),
    ).toEqual([
      {
        frame: 12,
        sourceId: 'perlica',
        skillId: 'battleSkill',
        reasons: ['skillInputMismatch'],
        receiptSequences: [9],
        actualSkillId: 'battleSkillDuringUltimate',
      },
    ]);
  });

  it('保留操作路由与中断证据的具体解释', () => {
    expect(
      projectSkillAvailabilityDiagnostics([
        receipt(10, 'SkillInputResolutionUnknown', {
          data: { skillId: 'battleSkill', reason: 'conditional input route' },
        }),
        receipt(11, 'SkillInputCannotInterruptCurrentSkill', {
          data: {
            skillId: 'battleSkill',
            currentSkillId: 'basicAttack2',
            currentCastId: 'cast-a3',
          },
        }),
        receipt(12, 'SkillInputInterruptionUnknown', {
          data: { skillId: 'battleSkill', reason: 'missing interrupt boundary' },
        }),
      ]),
    ).toEqual([
      {
        frame: 12,
        sourceId: 'perlica',
        skillId: 'battleSkill',
        reasons: ['skillInputUnknown', 'skillInterruptUnavailable', 'skillInterruptUnknown'],
        receiptSequences: [10, 11, 12],
        inputResolutionDetail: 'conditional input route',
        currentSkillId: 'basicAttack2',
        currentCastId: 'cast-a3',
        interruptionDetail: 'missing interrupt boundary',
      },
    ]);
  });

  it('拒绝无法定位到动作的可用性事实', () => {
    expect(() =>
      projectSkillAvailabilityDiagnostics([
        receipt(10, 'SkillCostUnavailableAtStart', { sourceId: undefined }),
      ]),
    ).toThrow("receipt 10 'SkillCostUnavailableAtStart' has no sourceId");

    expect(() =>
      projectSkillAvailabilityDiagnostics([
        receipt(11, 'SkillCooldownUnavailableAtStart', { data: undefined }),
      ]),
    ).toThrow("receipt 11 'SkillCooldownUnavailableAtStart' has no skillId");
  });

  it('忽略与技能开始可用性无关的回执', () => {
    expect(
      projectSkillAvailabilityDiagnostics([
        receipt(11, 'SkillStarted'),
        receipt(12, 'SkillCostRejected'),
        receipt(13, 'SkillCooldownReady'),
      ]),
    ).toEqual([]);
  });
});
