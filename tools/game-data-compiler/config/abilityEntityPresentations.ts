import type { AbilityEntityDefinition } from '../../../packages/game-data-contract/src/skills.ts';

const waterspoutPresentation = {
  icon: '/operators/tangtang/talent 2.webp',
  nameKey: 'effects.name.waterspouts',
  placement: 'enemy',
} as const satisfies NonNullable<AbilityEntityDefinition['presentation']>;

/** 能力实体的产品展示配置，不改变技能执行或来源关系。 */
export const abilityEntityPresentations: Readonly<
  Record<string, NonNullable<AbilityEntityDefinition['presentation']>>
> = {
  abilityentity_chr_0027_tangtang_normal_skill: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_02: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_02_02: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_03: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_03_02: waterspoutPresentation,
  abilityentity_chr_0027_tangtang_normal_skill_03_03: waterspoutPresentation,
  abilityentity_chr_0034_typhoea_combo_presistdamage: {
    icon: '/operators/typhoeus/combo.webp',
    nameKey: 'effects.name.barrageArray',
    placement: 'enemy',
  },
};
