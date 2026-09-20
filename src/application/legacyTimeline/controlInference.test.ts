import { describe, expect, it } from 'vitest';
import type {
  ControlSwitchDocument,
  ScenarioDocument,
  SkillCastDocument,
} from '../../core/project/schema';
import {
  isLegacyControlledInputCast,
  legacyInferredControlSwitchId,
  synchronizeLegacyInferredControlSwitches,
} from './controlInference';

function cast(id: string, skillGroupKey: string, startFrame: number): SkillCastDocument {
  return {
    id,
    source: {
      kind: 'operatorSkill',
      skillGroupKey,
      skillKey: id,
    },
    placement: { startFrame },
  } as SkillCastDocument;
}

function scenario(
  tracks: readonly (readonly SkillCastDocument[])[],
  controlSwitches: readonly ControlSwitchDocument[] = [],
): ScenarioDocument {
  return {
    battle: { controlSwitches: [...controlSwitches] },
    tracks: tracks.map(skillCasts => ({ skillCasts: [...skillCasts] })),
  } as unknown as ScenarioDocument;
}

describe('旧轴主控推断', () => {
  it('只让普攻、强化普攻、下落攻击和处决切换主控', () => {
    expect(isLegacyControlledInputCast(cast('basic', 'basicAttack', 1))).toBe(true);
    expect(isLegacyControlledInputCast(cast('enhanced', 'enhancedBasicAttack', 1))).toBe(true);
    expect(isLegacyControlledInputCast(cast('plunge', 'plungingAttack', 1))).toBe(true);
    expect(isLegacyControlledInputCast(cast('finisher', 'finisher', 1))).toBe(true);
    expect(isLegacyControlledInputCast(cast('battle', 'battleSkill', 1))).toBe(false);
    expect(isLegacyControlledInputCast(cast('combo', 'comboSkill', 1))).toBe(false);
    expect(isLegacyControlledInputCast(cast('ultimate', 'ultimate', 1))).toBe(false);
  });

  it('以第 1 轨道为初始主控，并只在主控变化时补标记', () => {
    const scenarioDocument = scenario([
      [cast('track-0-basic', 'basicAttack', 10), cast('track-0-plunge', 'plungingAttack', 30)],
      [
        cast('track-1-skill', 'battleSkill', 15),
        cast('track-1-basic', 'basicAttack', 20),
        cast('track-1-finisher', 'finisher', 25),
      ],
    ]);

    const inferred = synchronizeLegacyInferredControlSwitches(scenarioDocument, [
      { castId: 'track-0-basic', trackIndex: 0, order: 0 },
      { castId: 'track-1-skill', trackIndex: 1, order: 1 },
      { castId: 'track-1-basic', trackIndex: 1, order: 2 },
      { castId: 'track-1-finisher', trackIndex: 1, order: 3 },
      { castId: 'track-0-plunge', trackIndex: 0, order: 4 },
    ]);

    expect(inferred).toEqual([
      { id: legacyInferredControlSwitchId('track-1-basic'), frame: 20, trackIndex: 1 },
      { id: legacyInferredControlSwitchId('track-0-plunge'), frame: 30, trackIndex: 0 },
    ]);
    expect(scenarioDocument.battle.controlSwitches).toEqual(inferred);
  });

  it('保留旧轴显式切换，并可重复重建而不产生重复标记', () => {
    const explicit = { id: 'legacy-explicit', frame: 18, trackIndex: 1 } as const;
    const scenarioDocument = scenario(
      [[cast('track-0-basic', 'basicAttack', 30)], [cast('track-1-basic', 'basicAttack', 20)]],
      [explicit],
    );
    const ordered = [
      { castId: 'track-1-basic', trackIndex: 1, order: 0 },
      { castId: 'track-0-basic', trackIndex: 0, order: 1 },
    ];

    synchronizeLegacyInferredControlSwitches(scenarioDocument, ordered);
    synchronizeLegacyInferredControlSwitches(scenarioDocument, ordered);

    expect(scenarioDocument.battle.controlSwitches).toEqual([
      explicit,
      { id: legacyInferredControlSwitchId('track-0-basic'), frame: 30, trackIndex: 0 },
    ]);
  });
});
