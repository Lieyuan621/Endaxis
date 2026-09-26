import { describe, expect, it } from 'vitest';
import { ABILITY_EVENT_ACTION_CONTEXT_BINDINGS } from '../../../packages/game-data-contract/src/abilityEvents';
import { pogranichnik as pogranichnikGeneratedOperator } from './pogranichnik.generated';

describe('pogranichnik generated operator', () => {
  it('keeps physical infliction, soldier variants, and both talent programs executable', () => {
    const battle = pogranichnikGeneratedOperator.skillGroups.find(
      group => group.key === 'battleSkill',
    );
    const ultimate = pogranichnikGeneratedOperator.skillGroups.find(
      group => group.key === 'ultimate',
    );
    const talent1 = pogranichnikGeneratedOperator.talents[0];
    const talent2 = pogranichnikGeneratedOperator.talents[1];
    const serializedBattle = JSON.stringify(battle);
    const serializedUltimate = JSON.stringify(ultimate);
    const physicalResponses = pogranichnikGeneratedOperator.buffDefinitions?.[
      'buff_chr_0029_pograni_ultimate_skill_abilityentity_inaura'
    ]?.abilityEventResponses?.filter(response => response.event === 'beforeTakePhysicalInfliction');
    const serializedTalent1 = JSON.stringify(talent1);

    expect(pogranichnikGeneratedOperator.conversionSupport).toEqual({
      completeness: 'complete',
      missingCapabilities: [],
    });
    expect(serializedBattle).toContain('applyPhysicalInfliction');
    expect(serializedUltimate).toContain('abilityentity_chr_0029_pograni_ultimate_skill');
    expect(serializedUltimate).toContain('chr_0029_pograni_ultimate_skill_abilityentity');
    expect(physicalResponses).toHaveLength(2);
    // 图迁移后响应不再内嵌 target：beforeTakePhysicalInfliction 的输入目标身份
    // 由共享动作环境绑定表给出，等价于旧表示的 target: 'eventSource'。
    expect(ABILITY_EVENT_ACTION_CONTEXT_BINDINGS.beforeTakePhysicalInfliction.inputTarget).toBe(
      'eventSource',
    );
    const auraBuff =
      pogranichnikGeneratedOperator.buffDefinitions?.[
        'buff_chr_0029_pograni_ultimate_skill_abilityentity_inaura'
      ];
    if (auraBuff?.actionGraph === undefined) throw new Error('missing aura Buff graph');
    for (const response of physicalResponses ?? []) {
      expect(
        auraBuff.actionGraph.main.nodes[(response.sequence as { $sequence: string }).$sequence],
      ).toBeDefined();
    }
    expect(
      Object.keys(
        pogranichnikGeneratedOperator.abilityEntityDefinitions?.[
          'abilityentity_chr_0029_pograni_ultimate_skill'
        ]?.childSkills ?? {},
      ),
    ).toContain('chr_0029_pograni_ultimate_skill_abilityentity_finish4');
    expect(serializedTalent1).toContain('skillSpGained');
    expect(serializedTalent1).toContain('storeEventSpGainAmount');
    expect(JSON.stringify(talent2?.attachedBuffs)).toContain('"duration":[5,10]');
  });
});
