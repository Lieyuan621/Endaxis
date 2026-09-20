import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import { projectSkillCooldownTimelineViz } from './skillCooldownTimelineViz';

function receipt(
  sequence: number,
  frame: number,
  event: string,
  data: Readonly<Record<string, string | number>>,
): CombatReceiptEntry {
  return { sequence, frame, time: frame / 30, event, sourceId: 'operator', data };
}

describe('skill cooldown timeline projection', () => {
  it('projects a reserved cooldown onto the cast that started it', () => {
    expect(
      projectSkillCooldownTimelineViz(
        [
          receipt(0, 30, 'SkillCooldownReserved', {
            skillId: 'combo',
            castId: 'cast:1',
            remainingFrames: 300,
          }),
          receipt(1, 180, 'SkillCooldownReady', { skillId: 'combo', castId: 'cast:other' }),
        ],
        600,
      ),
    ).toEqual([
      {
        operatorId: 'operator',
        skillId: 'combo',
        castId: 'cast:1',
        startFrame: 30,
        endFrame: 180,
        completed: true,
      },
    ]);
  });

  it('ends refunded cooldowns at the actual refund frame', () => {
    expect(
      projectSkillCooldownTimelineViz(
        [
          receipt(0, 10, 'SkillCooldownReserved', {
            skillId: 'ultimate',
            castId: 'cast:u',
          }),
          receipt(1, 12, 'SkillCooldownRefunded', {
            skillId: 'ultimate',
            castId: 'cast:u',
          }),
        ],
        60,
      )[0],
    ).toMatchObject({ startFrame: 10, endFrame: 12, completed: true });
  });

  it('clips an unfinished cooldown to the simulated frame without predicting its future', () => {
    expect(
      projectSkillCooldownTimelineViz(
        [receipt(0, 20, 'SkillCooldownReserved', { skillId: 'combo', castId: 'cast:1' })],
        90,
      )[0],
    ).toMatchObject({ startFrame: 20, endFrame: 90, completed: false });
  });

  it('ignores unavailable attempts because they do not restart the shared ledger', () => {
    expect(
      projectSkillCooldownTimelineViz(
        [receipt(0, 20, 'SkillCooldownUnavailableAtStart', { skillId: 'combo', castId: 'cast:2' })],
        90,
      ),
    ).toEqual([]);
  });

  it('closes at a runtime adjustment that makes the shared cooldown ready', () => {
    expect(
      projectSkillCooldownTimelineViz(
        [
          receipt(0, 20, 'SkillCooldownReserved', { skillId: 'combo', castId: 'cast:1' }),
          {
            ...receipt(1, 35, 'SkillCooldownAdjusted', {
              skillId: 'combo',
              remainingFrames: 0,
            }),
            data: { skillId: 'combo', remainingFrames: 0, ready: true },
          },
        ],
        90,
      )[0],
    ).toMatchObject({ startFrame: 20, endFrame: 35, completed: true });
  });
});
