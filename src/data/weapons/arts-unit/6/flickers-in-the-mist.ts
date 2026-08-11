import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'arts-unit',
  icon: '/weapons/arts-unit/wpn_artsunit_0017.webp',
  baseAtk: [50, 144, 243, 342, 441, 490],
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
        stat: { modifier: 'atkPercent' },
        target: 'self',
        value: [7, 8.4, 9.8, 11.2, 12.6, 14, 15.4, 16.8, 19.6],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: { modifier: 'ampBonus', elements: 'electric' },
          target: 'self',
          triggerScope: 'global',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: 'electric' },
            target: 'owner',
            value: [5.5, 6.6, 7.7, 8.8, 9.9, 11, 12.1, 13.2, 15.4],
            stackStrategy: 'INDEPENDENT',
            maxStacks: 3,
            duration: 30,
            icd: 0.1,
          },
        ],
      },
    ],
  },
};

export default sheet;
