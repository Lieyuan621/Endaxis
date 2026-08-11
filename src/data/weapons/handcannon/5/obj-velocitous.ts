import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 5,
  type: 'handcannon',
  icon: '/weapons/handcannon/wpn_handcannon_0012.webp',
  baseAtk: [42, 120, 203, 286, 369, 411],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: [16, 28, 41, 54, 67, 80, 92, 105, 124],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: [
          4.761905, 8.571429, 12.3809524, 16.190477, 20, 23.809524, 27.61905, 31.428573, 37.142858,
        ],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'atkPercent' },
        target: 'self',
        value: [5, 6, 7, 8, 9, 10, 11, 12, 14],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusConsumed',
          status: ['cryoInfliction', 'electricInfliction', 'natureInfliction', 'heatInfliction'],
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'dmgBonus', elements: 'nature' },
            target: 'self',
            scaling: {
              additive: [
                {
                  key: 'cryoInfliction',
                  target: 'enemy',
                  coefficient: [5, 6, 7, 8, 9, 10, 11, 12, 14],
                },
                {
                  key: 'electricInfliction',
                  target: 'enemy',
                  coefficient: [5, 6, 7, 8, 9, 10, 11, 12, 14],
                },
                {
                  key: 'natureInfliction',
                  target: 'enemy',
                  coefficient: [5, 6, 7, 8, 9, 10, 11, 12, 14],
                },
                {
                  key: 'heatInfliction',
                  target: 'enemy',
                  coefficient: [5, 6, 7, 8, 9, 10, 11, 12, 14],
                },
              ],
            },
            duration: 20,
          },
        ],
      },
    ],
  },
};

export default sheet;
