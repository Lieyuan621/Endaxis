import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'sword',
  icon: '/weapons/sword/wpn_sword_0010.webp',
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
        stat: { modifier: 'dmgBonus', elements: 'heat' },
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
          status: ['combustion', 'corrosion'],
          target: 'enemy',
          triggerScope: 'global',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['heat', 'nature'] },
            target: 'owner',
            value: [8, 9.6, 11.2, 12.8, 14.4, 16, 17.6, 19.2, 22.4],
            stackStrategy: 'INDEPENDENT',
            maxStacks: 2,
            duration: 20,
            icd: 0.1,
          },
        ],
      },
    ],
  },
};

export default sheet;
