import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 4,
  type: 'arts-unit',
  icon: '/weapons/arts-unit/wpn_artsunit_0001.webp',
  baseAtk: [34, 100, 169, 238, 307, 341],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [12, 21, 31, 40, 50, 60, 69, 79, 93],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
        target: 'self',
        value: [3.3333335, 6, 8.6666666, 11.333334, 14, 16.666667, 19.333333, 22, 26],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'atkPercent' },
        target: 'self',
        value: [15, 18, 21, 24, 27, 30, 33, 36, 42],
        condition: { kind: 'operatorHp', compare: 'above', percent: 80 },
      },
    ],
  },
};

export default sheet;
