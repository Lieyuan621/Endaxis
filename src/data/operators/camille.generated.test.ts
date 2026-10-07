import { describe, expect, it } from 'vitest';
import { compileOperatorDefinitionSkills } from '../../core/compiler/compileScenarioTimeline';
import { ActionGraphDefinitionRepository } from '../../core/compiler/actionGraphDefinitionRepository';
import type { OperatorInstanceDocument } from '../../core/project/schema';
import { camille as camilleGeneratedOperator } from './camille.generated';

describe('camille generated operator', () => {
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
      {},
      undefined,
      new ActionGraphDefinitionRepository(),
    ).find(skill => skill.skillId === 'chr_0033_camille_normal_skill_2');

    expect(program).toMatchObject({
      skillGroupKey: 'replacementBattleSkill',
      skillType: 'comboSkill',
      skillLevel: 7,
      skillId: 'chr_0033_camille_normal_skill_2',
      executionSkillId: 'chr_0033_camille_combo_skill_2',
      costs: [],
      initialBlackboard: { atk_scale_2_4: 2.28 },
    });
    expect(program?.cooldownFrames).toBeUndefined();
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
      {},
      undefined,
      new ActionGraphDefinitionRepository(),
    ).find(skill => skill.skillId === 'chr_0033_camille_normal_skill_2')!;

    expect(program.initialBlackboard.atk_scale_2_4).toBeCloseTo(2.28 * 1.3);
    expect(program.initialBlackboard.atb).toBeCloseTo(18 * 1.15);
  });
});
