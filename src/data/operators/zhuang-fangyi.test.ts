import { describe, expect, it } from 'vitest';
import { compileOperatorDefinitionSkills } from '../../core/compiler/compileScenarioTimeline';
import { ActionGraphDefinitionRepository } from '../../core/compiler/actionGraphDefinitionRepository';
import type {
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
import type { OperatorInstanceDocument } from '../../core/project/schema';
import definition from './zhuang-fangyi.generated';
import { zhuangFangyi } from './zhuang-fangyi.generated';

function graphActionsFrom(
  resource: ActionGraphResourceDefinition,
  entry: { readonly $sequence: string | null },
): readonly ActionGraphStep[] {
  const actions: ActionGraphStep[] = [];
  let nodeId = entry.$sequence;
  while (nodeId) {
    const node = resource.main.nodes[nodeId];
    if (!node) break;
    actions.push(node.action);
    nodeId = node.next;
  }
  return actions;
}

function buildAtLevel(skillLevel: number): OperatorInstanceDocument {
  return {
    operatorSlug: zhuangFangyi.slug,
    level: 90,
    promoted: true,
    potential: 0,
    trustLevel: 4,
    skillLevels: {
      basicAttack: skillLevel,
      battleSkill: skillLevel,
      comboSkill: skillLevel,
      ultimate: skillLevel,
    },
    talentStates: {},
  };
}

describe('next Zhuang Fangyi definition', () => {
  it('uses the complete generated definition through the stable operator entry', () => {
    expect(zhuangFangyi).toBe(definition);
    expect(zhuangFangyi.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
  });

  it('keeps all fifteen player skills plus the runtime-only ultimate exit', () => {
    expect(zhuangFangyi.skillGroups.map(group => group.key)).toEqual([
      'basicAttack',
      'finisher',
      'plungingAttack',
      'battleSkill',
      'comboSkill',
      'ultimate',
      'enhancedBasicAttack',
    ]);
    const battle = zhuangFangyi.skillGroups.find(group => group.key === 'battleSkill');
    const combo = zhuangFangyi.skillGroups.find(group => group.key === 'comboSkill');
    expect(battle?.replacementSkills?.map(skill => skill.key)).toEqual([
      'chr_0030_zhuangfy_normal_skill_ult',
    ]);
    expect(combo?.replacementSkills?.map(skill => skill.key)).toEqual([
      'chr_0030_zhuangfy_combo_skill_ult',
    ]);

    const skills = zhuangFangyi.skillGroups.flatMap(group => [
      ...(Array.isArray(group.skills) ? group.skills : [group.skills]),
      ...(group.replacementSkills ?? []),
    ]);
    expect(skills).toHaveLength(16);
    expect(new Set(skills.map(skill => skill.key)).size).toBe(16);
    expect(skills.every(skill => skill.scheduledSequences.length > 0)).toBe(true);
  });

  it('preserves both talent slots and all five potential slots', () => {
    expect(zhuangFangyi.talents).toHaveLength(2);
    expect(zhuangFangyi.talents.every(talent => (talent.passiveSkills?.length ?? 0) > 0)).toBe(
      true,
    );
    expect(zhuangFangyi.potentials).toHaveLength(5);
  });

  it('switches both enhanced skill slots for the lifetime of the ultimate Buff', () => {
    const ultimateBuff = zhuangFangyi.buffDefinitions?.buff_chr_0030_zhuangfy_ult_base;
    expect(ultimateBuff?.skillSlotReplacements).toEqual([
      {
        skillGroupKey: 'battleSkill',
        targetSkillKey: 'chr_0030_zhuangfy_normal_skill_ult',
        revertedSkillKey: 'chr_0030_zhuangfy_normal_skill',
        inheritOriginSkillCooldownProgress: false,
      },
      {
        skillGroupKey: 'comboSkill',
        targetSkillKey: 'chr_0030_zhuangfy_combo_skill_ult',
        revertedSkillKey: 'chr_0030_zhuangfy_combo_skill',
        inheritOriginSkillCooldownProgress: true,
      },
    ]);
    const enable = ultimateBuff?.lifecycleSequences?.enable;
    const actionGraph = ultimateBuff?.actionGraph;
    expect(enable).toBeDefined();
    expect(actionGraph).toBeDefined();
    if (actionGraph === undefined || enable === undefined)
      throw new Error('missing ultimate buff action graph');
    expect(graphActionsFrom(actionGraph, enable).map(action => action.kind)).toEqual([
      'changePlayerActionMode',
      'overrideMultiDashLimit',
      'restrictUltimateEnergyRecovery',
    ]);
    expect(graphActionsFrom(actionGraph, enable)[1]).toEqual({
      kind: 'overrideMultiDashLimit',
      parameters: { dashCount: { kind: 'constant', value: -1 } },
    });
  });

  it.each(Array.from({ length: 12 }, (_, index) => index + 1))(
    'compiles every skill at level %i',
    skillLevel => {
      expect(() =>
        compileOperatorDefinitionSkills(
          'zhuang-fangyi-instance',
          buildAtLevel(skillLevel),
          zhuangFangyi,
          {},
          undefined,
          new ActionGraphDefinitionRepository(),
        ),
      ).not.toThrow();
    },
  );
});
