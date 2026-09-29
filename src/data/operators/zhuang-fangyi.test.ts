import { describe, expect, it } from 'vitest';
import type {
  ActionGraphResourceDefinition,
  ActionGraphStep,
} from '../../../packages/game-data-contract/src/actionGraph';
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

describe('next Zhuang Fangyi definition', () => {
  it('keeps enhanced battle and combo inputs in their distinct skill groups', () => {
    expect(
      zhuangFangyi.skillGroups.find(group => group.key === 'enhancedBattleSkill'),
    ).toMatchObject({
      operationType: 'battleSkill',
      skills: { key: 'chr_0030_zhuangfy_normal_skill_ult' },
    });
    expect(
      zhuangFangyi.skillGroups.find(group => group.key === 'enhancedComboSkill'),
    ).toMatchObject({
      operationType: 'comboSkill',
      skills: { key: 'chr_0030_zhuangfy_combo_skill_ult' },
    });
  });

  it('switches both enhanced skill slots for the lifetime of the ultimate Buff', () => {
    const ultimateBuff = zhuangFangyi.buffDefinitions?.buff_chr_0030_zhuangfy_ult_base;
    expect(ultimateBuff?.skillSlotReplacements).toEqual([
      {
        skillSlotKey: 'battleSkill',
        targetSkillKey: 'chr_0030_zhuangfy_normal_skill_ult',
        revertedSkillKey: 'chr_0030_zhuangfy_normal_skill',
        inheritOriginSkillCooldownProgress: false,
      },
      {
        skillSlotKey: 'comboSkill',
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
});
