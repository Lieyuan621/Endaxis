import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'polearm',
  icon: '/weapons/polearm/wpn_polearm_0015.webp',
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
        stat: { modifier: 'dmgBonus', elements: 'heat' },
        target: 'self',
        value: [5.6, 10, 14.4, 18.9, 23.3, 27.8, 32.2, 36.7, 43.3],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [18, 21.6, 25.2, 28.8, 32.4, 36, 39.6, 43.2, 50.4],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onSpRecovery',
          skillTypes: ['battleSkill', 'comboSkill', 'ultimate'],
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'team',
            value: [6, 7.2, 8.4, 9.6, 10.8, 12, 13.2, 14.4, 16.8],
            duration: 20,
          },
        ],
      },
      {
        trigger: {
          kind: 'onStatusApplied',
          status: 'heatInfliction',
          target: 'enemy',
          skillTypes: ['battleSkill', 'comboSkill', 'ultimate'],
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: 'heat' },
            target: 'team',
            value: [6, 7.2, 8.4, 9.6, 10.8, 12, 13.2, 14.4, 16.8],
            duration: 20,
          },
        ],
      },
    ],
  },
};

export default sheet;
