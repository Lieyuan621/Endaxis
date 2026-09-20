import { describe, expect, it } from 'vitest';
import type { CombatReceiptEntry } from '../combat/receipt/combatReceipt';
import {
  projectCastTimeDilationSegments,
  projectSkillCastActualDurationFrames,
  projectSkillCastActualStartFrames,
  projectSkillCastInterruptionFrames,
  projectTimelineTimeDilationBands,
} from './timelineDisplayTime';

function receipt(
  sequence: number,
  frame: number,
  event: string,
  data?: CombatReceiptEntry['data'],
): CombatReceiptEntry {
  return { sequence, frame, time: frame / 30, event, ...(data === undefined ? {} : { data }) };
}

describe('timeline display time', () => {
  it('keeps one input frame for a boundary reached at cast start', () => {
    expect([
      ...projectSkillCastActualDurationFrames([
        receipt(0, 10, 'SkillStarted', { castId: 'instant' }),
        receipt(1, 10, 'SkillOperableBoundaryReached', { castId: 'instant', durationFrames: 0 }),
      ]),
    ]).toEqual([['instant', 1]]);
  });
  it('separates confirmed interruption from natural end and local display boundary', () => {
    const entries = [
      receipt(0, -10, 'SkillStarted', { castId: 'a' }),
      receipt(1, -10, 'SkillInterrupted', { castId: 'a' }),
      receipt(2, 0, 'SkillStarted', { castId: 'b' }),
      receipt(3, 5, 'SkillEnded', { castId: 'b' }),
      receipt(4, 20, 'SkillOperableBoundaryReached', { castId: 'a' }),
      receipt(5, 30, 'SkillOperableBoundaryReached', { castId: 'b' }),
    ];
    expect([...projectSkillCastInterruptionFrames(entries)]).toEqual([['a', -10]]);
    expect([...projectSkillCastActualDurationFrames(entries)]).toEqual([
      ['a', 31],
      ['b', 31],
    ]);
  });
  it('takes each cast start from the first matching SkillStarted receipt', () => {
    const starts = projectSkillCastActualStartFrames([
      receipt(0, 12, 'SkillStarted', { castId: 'cast:1' }),
      receipt(1, 14, 'SkillEnded', { castId: 'cast:1' }),
      receipt(2, 20, 'SkillStarted', { castId: 'cast:2' }),
      receipt(3, 21, 'SkillStarted', { castId: 'cast:2' }),
    ]);
    expect([...starts]).toEqual([
      ['cast:1', 12],
      ['cast:2', 20],
    ]);
  });

  it('projects block width from the cast instance local boundary in actual frames', () => {
    const durations = projectSkillCastActualDurationFrames([
      receipt(0, 10, 'SkillStarted', { castId: 'cast:normal' }),
      receipt(1, 40, 'SkillOperableBoundaryReached', {
        castId: 'cast:normal',
        durationFrames: 30,
      }),
      receipt(2, 50, 'SkillStarted', { castId: 'cast:slowed' }),
      receipt(3, 110, 'SkillOperableBoundaryReached', {
        castId: 'cast:slowed',
        durationFrames: 30,
      }),
    ]);

    expect([...durations]).toEqual([
      ['cast:normal', 31],
      ['cast:slowed', 61],
    ]);
  });

  it('projects global time dilation and omits entity-only instances from timeline effects', () => {
    const entries: CombatReceiptEntry[] = [
      {
        ...receipt(0, 10, 'TimeDilationStarted', {
          instanceId: 1,
          kind: 'global',
          sourceCastId: 'cast:ultimate',
        }),
      },
      {
        ...receipt(1, 12, 'TimeDilationStarted', { instanceId: 2, kind: 'entity' }),
        targetId: 'track:1',
      },
      receipt(2, 14, 'TimeDilationStarted', {
        instanceId: 3,
        kind: 'global',
        sourceCastId: 'cast:global',
      }),
      receipt(3, 20, 'TimeDilationEnded', { instanceId: 1, kind: 'global' }),
    ];
    expect(projectTimelineTimeDilationBands(entries, 30)).toEqual([
      {
        instanceId: 1,
        kind: 'global',
        startFrame: 10,
        endFrame: 20,
        sourceCastId: 'cast:ultimate',
      },
      {
        instanceId: 3,
        kind: 'global',
        startFrame: 14,
        endFrame: 30,
        sourceCastId: 'cast:global',
      },
    ]);
  });

  it('keeps actual source intervals separate and clips them to the skill block', () => {
    expect(
      projectCastTimeDilationSegments(
        [
          {
            instanceId: 1,
            kind: 'global',
            startFrame: 8,
            endFrame: 14,
            sourceCastId: 'cast:ultimate',
          },
          {
            instanceId: 2,
            kind: 'entity',
            startFrame: 18,
            endFrame: 24,
            sourceCastId: 'cast:ultimate',
          },
          {
            instanceId: 3,
            kind: 'global',
            startFrame: 12,
            endFrame: 20,
            sourceCastId: 'cast:other',
          },
        ],
        'cast:ultimate',
        10,
        12,
      ),
    ).toEqual([{ offsetFrames: 0, durationFrames: 4 }]);
  });

  it('rejects an end receipt without its matching start', () => {
    expect(() =>
      projectTimelineTimeDilationBands(
        [receipt(0, 4, 'TimeDilationEnded', { instanceId: 3, kind: 'global' })],
        10,
      ),
    ).toThrow('ended without a start receipt');
  });
});
