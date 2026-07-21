import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'arts-unit',
  icon: '/weapons/arts-unit/wpn_artsunit_0015.webp',
  baseAtk: [52, 149, 252, 355, 458, 510],
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
        stat: { modifier: 'atkPercent' },
        target: 'self',
        value: [5, 9, 13, 17, 21, 25, 29, 33, 39],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'electric' },
        target: 'self',
        value: [16, 19.2, 22.4, 25.6, 28.8, 32, 35.2, 38.4, 44.8],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusConsumed',
          status: ['solidification', 'electrification', 'corrosion', 'combustion'],
          target: 'enemy',
          skillTypes: 'battleSkill',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['electric'], skillTypes: 'battleSkill' },
            target: 'self',
            stackStrategy: 'INDEPENDENT',
            maxStacks: 2,
            value: [20, 24, 28, 32, 36, 40, 44, 48, 56],
            duration: 20,
            icd: 0.1,
          },
        ],
      },
      {
        trigger: {
          kind: 'onActionStart',
          skillTypes: 'ultimate',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['electric'], skillTypes: 'battleSkill' },
            target: 'self',
            value: [40, 48, 56, 64, 72, 80, 88, 96, 112],
            duration: 25,
          },
        ],
      },
    ],
  },
};

export default sheet;
