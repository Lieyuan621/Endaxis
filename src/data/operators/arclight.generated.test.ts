import { describe, expect, it } from 'vitest';
import type {
  ScheduledSequenceDefinition,
  SkillDefinition,
} from '../../core/game-data/operatorDefinition';
import { arclight as arclightGeneratedOperator } from './arclight.generated';

function findSkill(key: string): SkillDefinition {
  for (const group of arclightGeneratedOperator.skillGroups) {
    const skills = Array.isArray(group.skills) ? group.skills : [group.skills];
    const skill = skills.find(candidate => candidate.key === key);
    if (skill !== undefined) return skill;
  }
  throw new Error(`missing generated skill '${key}'`);
}

describe('arclight generated operator', () => {
  it('is complete under the wooden-dummy boundary', () => {
    expect(arclightGeneratedOperator.slug).toBe('arclight');
    expect(arclightGeneratedOperator.weaponType).toBe('sword');
    expect(arclightGeneratedOperator.role).toBe('vanguard');
    expect(arclightGeneratedOperator.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
    expect(arclightGeneratedOperator.talents[1]).toMatchObject({
      levels: 2,
    });
  });

  it('compiles battle skill SP cost into squad ultimate energy instead of an inline buff', () => {
    const battleSkill = findSkill('chr_0007_ikut_normal_skill');
    const steps = battleSkill.scheduledSequences.flatMap((sequence: ScheduledSequenceDefinition) =>
      sequence.sequence.steps.map(step => step.kind),
    );
    expect(steps).toContain('gainSquadUltimateEnergyFromSkillCost');
  });

  it('keeps the stack-triggered party electric damage buff as converted runtime behavior', () => {
    const battleSkill = findSkill('chr_0007_ikut_normal_skill');
    const source = JSON.stringify([
      battleSkill,
      arclightGeneratedOperator.buffDefinitions?.buff_chr_0007_ikut_normal_skill_extra_count,
      arclightGeneratedOperator.buffDefinitions?.buff_chr_0007_ikut_atk_buff_talent,
    ]);

    expect(source).toContain('enhanceChanged');
    expect(source).toContain('electricDamageIncrease');
    expect(source).toContain('baseAddition');
    expect(source).not.toContain('buff_common_vfx_char_atk_up');
  });

  it('owns ultimate AbilityEntity damage on the child local timeline only', () => {
    const ultimate = findSkill('chr_0007_ikut_ultimate_skill');
    const spawn = ultimate.scheduledSequences
      .flatMap(sequence => sequence.sequence.steps)
      .find(step => step.kind === 'spawnAbilityEntity');
    expect(spawn?.kind).toBe('spawnAbilityEntity');
    if (spawn?.kind !== 'spawnAbilityEntity') throw new Error('missing AbilityEntity spawn');

    expect(spawn.parameters.inheritActionBlackboard).toBe(true);
    const definition =
      arclightGeneratedOperator.abilityEntityDefinitions?.[spawn.parameters.abilityEntityId];
    expect(
      new Set(definition?.childSkill?.scheduledSequences.map(sequence => sequence.startFrame)),
    ).toEqual(new Set([7, 63]));
    expect(ultimate.scheduledSequences.map(sequence => sequence.startFrame)).not.toEqual(
      expect.arrayContaining([61, 117]),
    );
  });
});
