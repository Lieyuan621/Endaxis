import type { OperatorDefinition } from '../../../packages/game-data-contract/src/operators.ts';

export const operatorTimelineInteractions: Readonly<
  Record<string, NonNullable<OperatorDefinition['timelineInteractions']>>
> = {
  kay: {
    kayComboDrop: {
      kind: 'pickup',
      nameKey: 'effects.name.kayComboDrop',
      icon: 'endaxis:operators/kay/combo_01',
      entityIds: [
        'abilityentity_chr_0040_sweetpie_weapon_leave',
        'abilityentity_chr_0040_sweetpie_weapon_2_leave',
        'abilityentity_chr_0040_sweetpie_weapon_3_leave',
      ],
      auraNode: 'aura_8',
    },
    kayUltimateDrop: {
      kind: 'pickup',
      nameKey: 'effects.name.kayUltimateDrop',
      icon: 'endaxis:operators/kay/ultimate_01',
      entityIds: [
        'abilityentity_chr_0040_sweetpie_ult_weapon_leave',
        'abilityentity_chr_0040_sweetpie_ult_weapon_2_leave',
        'abilityentity_chr_0040_sweetpie_ult_weapon_3_leave',
      ],
      auraNode: 'aura_5',
    },
  },
};
