import type { AbilityEntityDefinition } from '../../../packages/game-data-contract/src/skills.ts';

const waterspoutPresentation = {
  icon: 'endaxis:operators/tangtang/talent_2',
  nameKey: 'effects.name.waterspouts',
  placement: 'enemy',
} as const satisfies NonNullable<AbilityEntityDefinition['presentation']>;

/** 能力实体的产品展示配置，不改变技能执行或来源关系。 */
export const abilityEntityPresentations: Readonly<
  Record<string, NonNullable<AbilityEntityDefinition['presentation']>>
> = {
  abilityentity_chr_0012_avywen_combo_skill_lance: {
    icon: 'endaxis:operators/avywenna/combo_01',
    nameKey: 'effects.name.thunderlance',
    placement: 'operator',
  },
  abilityentity_chr_0012_avywen_ultimate_skill_lance: {
    icon: 'endaxis:operators/avywenna/ultimate_01',
    nameKey: 'effects.name.thunderlanceEx',
    placement: 'operator',
  },
  abilityentity_chr_0027_tangtang_normal_skill: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_02: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_02_02: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_03: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_03_02: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_03_03: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_ultskill: {
    icon: 'endaxis:operators/tangtang/ultimate_01',
    nameKey: 'effects.name.oldenStare',
    placement: 'enemy',
    damageDisplayBuffId: 'buff_chr_0027_tangtang_ultskill_debuff',
  },
  abilityentity_chr_0034_typhoea_combo_presistdamage: {
    icon: 'endaxis:operators/typhoeus/combo_01',
    nameKey: 'effects.name.barrageArray',
    placement: 'enemy',
  },
};
