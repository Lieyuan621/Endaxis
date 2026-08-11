import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 5,
  type: 'handcannon',
  icon: '/weapons/handcannon/wpn_handcannon_0004.webp',
  baseAtk: [42, 120, 203, 286, 369, 411],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [16, 28, 41, 54, 67, 80, 92, 105, 124],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'heat' },
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
        stat: { modifier: 'dmgBonus', skillTypes: 'battleSkill' },
        target: 'self',
        value: [10, 12, 14, 16, 18, 20, 22, 24, 28],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: ['cryoBurst', 'electricBurst', 'natureBurst', 'heatBurst', 'combustion'],
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'self',
            value: [16, 19.2, 22.4, 25.6, 28.8, 32, 35.2, 38.4, 44.8],
            duration: 15,
          },
        ],
      },
    ],
  },
};

export default sheet;
