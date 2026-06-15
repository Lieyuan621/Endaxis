import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'polearm',
  icon: '/weapons/polearm/wpn_polearm_0007.webp',
  baseAtk: [49, 142, 240, 338, 436, 485],
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
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [6, 10.7, 15.5, 20.2, 25, 29.8, 34.5, 39.3, 46.4],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: 'heat' },
        target: 'self',
        value: [7, 8.4, 9.8, 11.2, 12.6, 14, 15.4, 16.8, 19.6],
      },
    ],
    triggers: [
      {
        trigger: { kind: 'onStatusApplied', status: 'heatInfliction', target: 'enemy' },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['physical', 'heat'] },
            target: 'self',
            value: [8, 9.6, 11.2, 12.8, 14.4, 16, 17.6, 19.2, 22.4],
            duration: 20,
          },
        ],
      },
      {
        trigger: {
          kind: 'onStatusApplied',
          status: { modifier: 'susceptibility', elements: 'heat' },
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: ['physical', 'heat'] },
            target: 'team',
            value: [4, 4.8, 5.6, 6.4, 7.2, 8, 8.8, 9.6, 11.2],
            duration: 30,
          },
        ],
      },
    ],
  },
};

export default sheet;
