import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'arts-unit',
  icon: '/weapons/arts-unit/wpn_artsunit_0009.webp',
  baseAtk: [50, 145, 245, 345, 445, 495],
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
        stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
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
        value: [5, 6, 7, 8, 9, 10, 11, 12, 14],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onActionStart',
          skillTypes: 'ultimate',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
            target: 'self',
            value: [24, 28.8, 33.6, 38.4, 43.2, 48, 52.8, 57.6, 67.2],
            duration: 15,
          },
        ],
      },
      {
        trigger: {
          kind: 'onActionStart',
          skillTypes: 'comboSkill',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
            target: 'self',
            value: [12, 14.4, 16.8, 19.2, 21.6, 24, 26.4, 28.8, 33.6],
            duration: 15,
          },
        ],
      },
    ],
  },
};

export default sheet;
