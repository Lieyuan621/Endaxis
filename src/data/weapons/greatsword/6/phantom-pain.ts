import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'greatsword',
  icon: '/weapons/greatsword/wpn_greatsword_0016.webp',
  baseAtk: [50, 144, 243, 342, 441, 490],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: [20, 36, 52, 68, 84, 100, 116, 132, 156],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [10, 18, 26, 34, 42, 50, 58, 66, 78],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'physical' },
        target: 'self',
        value: [7, 8.4, 9.8, 11.2, 12.6, 14, 15.4, 16.8, 19.6],
      },
    ],
    triggers: [
      {
        trigger: { kind: 'onActionStart', skillTypes: ['battleSkill', 'comboSkill'] },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: 'physical' },
            target: 'self',
            value: [5.5, 6.6, 7.7, 8.8, 9.9, 11, 12.1, 13.2, 15.4],
            stackStrategy: 'INDEPENDENT',
            maxStacks: 3,
            duration: 20,
            icd: 0.1,
          },
        ],
      },
    ],
  },
};

export default sheet;
