import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'arts-unit',
  icon: '/weapons/arts-unit/wpn_artsunit_0006.webp',
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
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'nature' },
        target: 'self',
        value: [5.6, 10, 14.4, 18.9, 23.3, 27.8, 32.2, 36.7, 43.3],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'atkPercent' },
        target: 'self',
        value: [7, 8.4, 9.8, 11.2, 12.6, 14, 15.4, 16.8, 19.6],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: 'natureInfliction',
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
            target: 'teamExcludeSelf',
            value: [5, 6, 7, 8, 9, 10, 11, 12, 14].map((x, i) => {
              const bonus = [2, 2.4, 2.8, 3.2, 3.6, 4, 4.4, 4.8, 5.6];
              return x + (bonus[i] ?? 0);
            }),
            duration: 15,
          },
        ],
      },
    ],
  },
};

export default sheet;
