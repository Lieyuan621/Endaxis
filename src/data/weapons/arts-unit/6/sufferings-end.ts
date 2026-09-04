import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'arts-unit',
  icon: '',
  baseAtk: [50, 144, 243, 342, 441, 490],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
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
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [15, 18, 21, 24, 27, 30, 33, 36, 42],
        duration: 15,
      },
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'nature' },
        target: 'self',
        value: [6, 7.2, 8.4, 9.6, 10.8, 12, 13.2, 14.4, 16.8],
        condition: {
          kind: 'operatorStatus',
          status: 'sufferings-end-skill3-dmgBonus',
          stacks: { compare: 'atLeast', count: 4 },
        },
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: ['cryoBurst', 'electricBurst', 'natureBurst', 'heatBurst'],
          target: 'enemy',
        },
        effects: [
          {
            id: 'sufferings-end-skill3-dmgBonus',
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: 'nature' },
            target: 'self',
            value: [2, 2.4, 2.8, 3.2, 3.6, 4, 4.4, 4.8, 5.6],
            stacks: 1,
            maxStacks: 4,
            stackStrategy: 'INDEPENDENT',
            duration: 25,
            icd: 0.1,
          },
        ],
      },
    ],
  },
};

export default sheet;
