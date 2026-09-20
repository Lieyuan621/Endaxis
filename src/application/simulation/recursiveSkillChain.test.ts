import { expect, it, vi } from 'vitest';
import { createEmptyScenario } from '../../core/project/createProject';
import type { CombatReceiptEntry } from '../../core/combat/receipt/combatReceipt';
import { planRecursiveSkillChain } from './recursiveSkillChain';

function fixture() {
  const scenario = createEmptyScenario('recursive', 'recursive');
  scenario.battle.durationFrames = 500;
  scenario.tracks[0] = {
    id: 'track',
    operator: null,
    weapon: null,
    gears: { armor: null, gloves: null, accessory1: null, accessory2: null },
    initialState: { ultimateEnergy: 0 },
    skillCasts: [
      {
        id: 'seed',
        source: {
          kind: 'operatorSkill',
          skillGroupKey: 'basicAttack',
          skillKey: 'loop',
          action: 'basicAttack',
        },
        placement: { startFrame: 1 },
      },
    ],
  };
  const run = vi.fn((candidate: typeof scenario, frame: number) => ({
    receiptEntries: candidate.tracks[0]!.skillCasts.flatMap((cast, index): CombatReceiptEntry[] => [
      {
        sequence: index * 2,
        frame: cast.placement.startFrame!,
        time: 0,
        event: 'SkillInputProcessed',
        data: { castId: cast.id, accepted: true },
      },
      {
        sequence: index * 2 + 1,
        frame: cast.placement.startFrame! + 1,
        time: 0,
        event: 'SkillOperableBoundaryReached',
        data: { castId: cast.id },
      },
    ]).filter(entry => entry.frame <= frame),
  }));
  return {
    scenario,
    seedCastId: 'seed',
    endFrame: 500,
    run,
    checkCancelled: () => {},
    extension: {
      allowedSkillKeys: ['loop', 'heavy'],
      terminalSkillKey: 'heavy',
      reservedCastIds: Array.from({ length: 23 }, (_, i) => `next:${i}`),
    },
  };
}

it('零帧接续边界仍把后续输入放在下一实际帧', () => {
  const input = fixture();
  const originalRun = input.run;
  const result = planRecursiveSkillChain({
    ...input,
    run: (scenario, frame) => ({
      receiptEntries: originalRun(scenario, frame + 1)
        .receiptEntries.map(entry =>
          entry.event === 'SkillOperableBoundaryReached'
            ? { ...entry, frame: entry.frame - 1 }
            : entry,
        )
        .filter(entry => entry.frame <= frame),
    }),
  });
  expect(result.skillCastIds).toHaveLength(24);
  expect(result.scenario.tracks[0]!.skillCasts.map(cast => cast.placement.startFrame)).toEqual(
    Array.from({ length: 24 }, (_, index) => index + 1),
  );
});

it.each([8, 24])('路由永远循环也遵守配置的%d段身份预算，临时探针不会留在文档中', limit => {
  const input = fixture();
  input.extension.reservedCastIds = input.extension.reservedCastIds.slice(0, limit - 1);
  const result = planRecursiveSkillChain(input);
  expect(result.complete).toBe(false);
  expect(result.skillCastIds).toHaveLength(limit);
  expect(result.scenario.tracks[0]!.skillCasts).toHaveLength(limit);
  expect(new Set(result.skillCastIds).size).toBe(limit);
  expect(input.scenario.tracks[0]!.skillCasts).toHaveLength(1);
});

it.each(['timeline', 'existing'] as const)('%s边界前停止，不覆盖已有放置', mode => {
  const input = fixture();
  if (mode === 'timeline') input.endFrame = 4;
  else
    input.scenario.tracks[0]!.skillCasts.push({
      id: 'existing',
      source: { kind: 'operatorSkill', skillGroupKey: 'basicAttack', skillKey: 'other' },
      placement: { startFrame: 5 },
    });
  const result = planRecursiveSkillChain(input);
  expect(result.complete).toBe(false);
  expect(result.skillCastIds).toEqual(['seed', 'next:0']);
  expect(
    result.scenario.tracks[0]!.skillCasts.filter(cast => result.skillCastIds.includes(cast.id)).map(
      cast => cast.placement.startFrame,
    ),
  ).toEqual([1, 3]);
  if (mode === 'existing')
    expect(result.scenario.tracks[0]!.skillCasts.find(cast => cast.id === 'existing')).toEqual(
      input.scenario.tracks[0]!.skillCasts[1],
    );
});

it('取消在下一次规划前生效，原场景保持不变', () => {
  const input = fixture();
  expect(() =>
    planRecursiveSkillChain({
      ...input,
      checkCancelled: () => {
        throw new Error('cancelled');
      },
    }),
  ).toThrow('cancelled');
  expect(input.run).not.toHaveBeenCalled();
  expect(input.scenario.tracks[0]!.skillCasts).toHaveLength(1);
});
