import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 5,
  type: 'polearm',
  icon: '/weapons/polearm/wpn_polearm_0006.webp',
  baseAtk: [42, 120, 203, 286, 369, 411],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [16, 28, 41, 54, 67, 80, 92, 105, 124],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'electric' },
        target: 'self',
        value: [
          4.4444446, 8, 11.5555555, 15.111111, 18.666667, 22.222222, 25.777778, 29.333332,
          34.666666,
        ],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'comboSkill' },
        target: 'self',
        value: [10, 12, 14, 16, 18, 20, 22, 24, 28],
      },
    ],
    triggers: [
      {
        trigger: { kind: 'onActionStart', skillTypes: 'comboSkill' },
        effects: [
          {
            kind: 'oneTime',
            stat: { modifier: 'dmgBonus', elements: 'electric' },
            skillTypes: 'battleSkill',
            target: 'self',
            value: [10, 12, 14, 16, 18, 20, 22, 24, 28],
            stackStrategy: 'INDEPENDENT',
            maxStacks: 3,
            duration: 30,
          },
        ],
      },
    ],
  },
};

export default sheet;
