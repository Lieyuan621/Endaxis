import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'arts-unit',
  icon: '/weapons/arts-unit/wpn_artsunit_0018.webp',
  baseAtk: [50, 144, 243, 342, 441, 490],
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
        stat: { modifier: 'dmgBonus', elements: 'nature' },
        target: 'self',
        value: [7, 8.4, 9.8, 11.2, 12.6, 14, 15.4, 16.8, 19.6],
      },
    ],
    triggers: [
      {
        trigger: {
          kind: 'onStatusApplied',
          status: [
            { modifier: 'susceptibility' },
            'cryoInfliction',
            'electricInfliction',
            'natureInfliction',
            'heatInfliction',
          ],
          target: 'enemy',
        },
        effects: [
          {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'self',
            value: [6, 7.2, 8.4, 9.6, 10.8, 12, 13.2, 14.4, 16.8],
            maxStacks: 2,
            stackStrategy: 'INDEPENDENT',
            duration: 20,
          },
          {
            kind: 'status',
            stat: { modifier: 'atkPercent' },
            target: 'teamExcludeSelf',
            value: [1.5, 1.8, 2.1, 2.4, 2.7, 3.0, 3.3, 3.6, 4.2],
            maxStacks: 2,
            stackStrategy: 'INDEPENDENT',
            duration: 20,
          },
        ],
      },
    ],
  },
};

export default sheet;
