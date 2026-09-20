import { describe, expect, it } from 'vitest';
import { compileOperatorDefinitionSkills } from '../../core/compiler/compileScenarioTimeline';
import type { OperatorInstanceDocument } from '../../core/project/schema';
import { camille as camilleGeneratedOperator } from './camille.generated';

describe('camille generated operator', () => {
  it('routes the transformed battle slot through combo skill 2 with wrapper cost and cooldown', () => {
    const battle = camilleGeneratedOperator.skillGroups.find(group => group.key === 'battleSkill');
    const routed = battle?.routedReplacementSkills?.[0];
    const henshin =
      camilleGeneratedOperator.buffDefinitions?.buff_chr_0033_camille_ult_henshin_state;

    expect(routed).toMatchObject({
      skillType: 'comboSkill',
      levelSource: 'comboSkill',
      executionSkillGroupKey: 'comboSkill',
      executionSkillKey: 'chr_0033_camille_combo_skill_2',
      skill: {
        key: 'chr_0033_camille_normal_skill_2',
        timelineBlockFrames: 87,
        costs: [{ resource: 'sp', value: 40 }],
        costFrame: 0,
        cooldownFrames: 90,
      },
    });
    expect(henshin?.skillSlotReplacements).toEqual([
      {
        skillGroupKey: 'battleSkill',
        targetSkillKey: 'chr_0033_camille_normal_skill_2',
        revertedSkillKey: 'chr_0033_camille_normal_skill',
        inheritOriginSkillCooldownProgress: false,
      },
    ]);
  });

  it('compiles the routed body at combo level instead of battle-skill level', () => {
    const build: OperatorInstanceDocument = {
      operatorSlug: camilleGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential: 0,
      trustLevel: 4,
      skillLevels: { basicAttack: 1, battleSkill: 3, comboSkill: 7, ultimate: 1 },
      talentStates: {},
    };

    const program = compileOperatorDefinitionSkills(
      'camille',
      build,
      camilleGeneratedOperator,
    ).find(skill => skill.skillId === 'chr_0033_camille_normal_skill_2');

    expect(program).toMatchObject({
      skillGroupKey: 'battleSkill',
      skillType: 'comboSkill',
      skillLevel: 7,
      skillId: 'chr_0033_camille_normal_skill_2',
      executionSkillId: 'chr_0033_camille_combo_skill_2',
      cooldownFrames: 90,
      costs: [{ resource: 'sp', value: 40 }],
      initialBlackboard: { atk_scale_2_4: 2.28 },
    });
  });

  it('applies combo-skill behavior upgrades to the routed execution body', () => {
    const build: OperatorInstanceDocument = {
      operatorSlug: camilleGeneratedOperator.slug,
      level: 90,
      promoted: true,
      potential: 3,
      trustLevel: 4,
      skillLevels: { basicAttack: 1, battleSkill: 3, comboSkill: 7, ultimate: 1 },
      talentStates: {},
    };

    const program = compileOperatorDefinitionSkills(
      'camille',
      build,
      camilleGeneratedOperator,
    ).find(skill => skill.skillId === 'chr_0033_camille_normal_skill_2')!;

    expect(program.initialBlackboard.atk_scale_2_4).toBeCloseTo(2.28 * 1.3);
    expect(program.initialBlackboard.atb).toBeCloseTo(18 * 1.15);
    expect(program.costs).toEqual([{ resource: 'sp', value: 40 }]);
    expect(program.cooldownFrames).toBe(90);
  });
});
