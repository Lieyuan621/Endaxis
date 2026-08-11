import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 5,
  type: 'polearm',
  icon: '/weapons/polearm/wpn_polearm_0013.webp',
  baseAtk: [42, 120, 203, 286, 369, 411],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [16, 28, 41, 54, 67, 80, 92, 105, 124],
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
          4.4444446, 8, 11.5555555, 15.111111, 18.666667, 22.222222, 25.777778, 29.333332,
          34.666666,
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
        value: [8, 9.6, 11.2, 12.8, 14.4, 16, 17.6, 19.2, 22.4],
        condition: { kind: 'enemyStatus', status: ['cryoInfliction', 'solidification'] },
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusConsumed',
          status: 'solidification',
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
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
