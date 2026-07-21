import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'polearm',
  icon: '/weapons/polearm/wpn_polearm_0016.webp',
  baseAtk: [49, 142, 240, 338, 436, 485],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [20, 36, 52, 68, 84, 100, 116, 132, 156],
      },
    ],
  },
  skill2: {},
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'electric' },
        target: 'self',
        value: [6, 7.2, 8.4, 9.6, 10.8, 12, 13.2, 14.4, 16.8],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: [{ modifier: 'heal' }],
          skillTypes: 'comboSkill',
          target: 'self',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus' },
            target: 'team',
            value: [5, 6, 7, 8, 9, 10, 11, 12, 14],
            duration: 20,
          },
        ],
      },
    ],
  },
};

export default sheet;
