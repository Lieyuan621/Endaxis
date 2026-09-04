import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'arts-unit',
  icon: '',
  baseAtk: [51, 148, 250, 352, 454, 505],
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
        stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
        target: 'self',
        value: [16, 19.2, 22.4, 25.6, 28.8, 32, 35.2, 38.4, 44.8],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onActionStart',
          skillTypes: 'battleSkill',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'artsIntensity' },
            target: 'self',
            value: [35, 42, 49, 56, 63, 70, 77, 84, 98],
            duration: 15,
          },
          {
            id: 'windform',
            name: 'windform',
            kind: 'status',
            target: 'self',
            stacks: 4,
            maxStacks: 4,
            duration: 15,
          },
        ],
      },
      {
        trigger: {
          kind: 'onStatusApplied',
          status: ['cryoBurst', 'electricBurst', 'natureBurst', 'heatBurst'],
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
            target: 'self',
            value: [4, 4.8, 5.6, 6.4, 7.2, 8, 8.8, 9.6, 11.2],
            stacks: 1,
            maxStacks: 4,
            stackStrategy: 'INDEPENDENT',
            duration: 30,
            condition: { kind: 'operatorStatus', status: 'windform', consume: 1 },
            icd: 0.1,
          },
        ],
      },
    ],
  },
};

export default sheet;
