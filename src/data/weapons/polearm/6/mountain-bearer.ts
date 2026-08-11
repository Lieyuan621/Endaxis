import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'polearm',
  icon: '/weapons/polearm/wpn_polearm_0012.webp',
  baseAtk: [51, 146, 247, 348, 449, 500],
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
        stat: { modifier: 'dmgBonus', elements: 'physical' },
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
        stat: {
          modifier: 'dmgBonus',
          elements: ['physical', 'heat', 'cryo', 'electric', 'nature'],
        },
        target: 'self',
        value: [20, 24, 28, 32, 36, 40, 44, 48, 56],
        condition: { kind: 'enemyStatus', status: 'vulnerability' },
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: 'vulnerability',
          target: 'enemy',
          skillTypes: 'battleSkill',
        },
        effects: [
          {
            id: 'mountain-bearer-attr-on-vulnerability',
            kind: 'status',
            stat: {
              modifier: 'attributePercent',
              attribute: ['strength', 'agility', 'intellect', 'will'],
            },
            target: 'self',
            value: [8, 9.6, 11.2, 12.8, 14.4, 16, 17.6, 19.2, 22.4],
            duration: 15,
            maxStacks: 1,
          },
        ],
      },
      {
        trigger: {
          kind: 'onStatusApplied',
          status: { modifier: 'susceptibility', elements: 'physical' },
          target: 'enemy',
          skillTypes: 'battleSkill',
        },
        effects: [
          {
            id: 'mountain-bearer-attr-on-phys-susceptibility',
            kind: 'status',
            stat: {
              modifier: 'attributePercent',
              attribute: ['strength', 'agility', 'intellect', 'will'],
            },
            target: 'self',
            value: [8, 9.6, 11.2, 12.8, 14.4, 16, 17.6, 19.2, 22.4],
            duration: 15,
            maxStacks: 1,
          },
        ],
      },
    ],
  },
};

export default sheet;
