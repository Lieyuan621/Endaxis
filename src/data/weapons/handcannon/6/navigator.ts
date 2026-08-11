import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'handcannon',
  icon: '/weapons/handcannon/wpn_handcannon_0005.webp',
  baseAtk: [50, 144, 243, 342, 441, 490],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [20, 36, 52, 68, 84, 100, 116, 132, 156],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'cryo' },
        target: 'self',
        value: [
          5.5555556, 10, 14.444445, 18.888889, 23.333333, 27.77778, 32.222223, 36.666667, 43.333334,
        ],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'critRate' },
        target: 'self',
        value: [3.5, 4.2, 4.9, 5.6, 6.3, 7, 7.7, 8.4, 9.8],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: ['solidification', 'corrosion'],
          target: 'enemy',
          triggerScope: 'global',
        },
        effects: [
          {
            name: 'loneAndDistantSail',
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['cryo', 'nature'] },
            target: 'owner',
            value: [3.5, 4.2, 4.9, 5.6, 6.3, 7, 7.7, 8.4, 9.8],
            duration: 15,
          },
          {
            name: 'loneAndDistantSail',
            kind: 'status',
            stat: { modifier: 'critRate' },
            target: 'owner',
            value: [2, 2.4, 2.8, 3.2, 3.6, 4, 4.4, 4.8, 5.6],
            duration: 15,
          },
        ],
      },
      {
        trigger: {
          kind: 'onStatusApplied',
          status: ['solidification', 'corrosion'],
          target: 'enemy',
        },
        effects: [
          {
            name: 'loneAndDistantSail',
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['cryo', 'nature'] },
            target: 'owner',
            value: [3.5, 4.2, 4.9, 5.6, 6.3, 7, 7.7, 8.4, 9.8],
            duration: 15,
          },
          {
            name: 'loneAndDistantSail',
            kind: 'status',
            stat: { modifier: 'critRate' },
            target: 'owner',
            value: [2, 2.4, 2.8, 3.2, 3.6, 4, 4.4, 4.8, 5.6],
            duration: 15,
          },
        ],
      },
    ],
  },
};

export default sheet;
