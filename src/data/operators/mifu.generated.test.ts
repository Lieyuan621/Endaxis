import { describe, expect, it } from 'vitest';
import { mifu as mifuGeneratedOperator } from './mifu.generated';

describe('mifu generated operator', () => {
  it('keeps the chained battle skills as runtime-only replacements', () => {
    const group = mifuGeneratedOperator.skillGroups.find(
      candidate => candidate.key === 'battleSkill',
    );
    const normalSkill2 = mifuGeneratedOperator.buffDefinitions?.buff_chr_0031_mifu_normalskill_2;

    expect(group === undefined || !('key' in group.skills) ? undefined : group.skills.key).toBe(
      'chr_0031_mifu_normalskill_1',
    );
    expect(group?.replacementSkills?.map(skill => skill.key)).toEqual([
      'chr_0031_mifu_normalskill_2',
      'chr_0031_mifu_normalskill_3',
    ]);
    expect(normalSkill2?.skillSlotReplacements).toEqual([
      {
        skillGroupKey: 'battleSkill',
        targetSkillKey: 'chr_0031_mifu_normalskill_2',
        revertedSkillKey: 'chr_0031_mifu_normalskill_1',
        inheritOriginSkillCooldownProgress: false,
      },
    ]);
  });

  it('compiles the damage-visible native shield and omits self-protection outside the stump model', () => {
    const definition = mifuGeneratedOperator.buffDefinitions?.buff_chr_0031_mifu_shield;

    expect(definition?.shields).toEqual([
      {
        infinityValue: false,
        value: { blackboardKey: 'FinalShield' },
        absorbCount: -1,
        absorbAllDamageWhenConsumed: false,
        removeBuffWhenConsumed: true,
        priority: 'normal',
        replaceHitEffect: true,
        damageAbsorptions: [],
      },
    ]);
    expect(definition?.sustainedProtection).toBeUndefined();
  });
});
