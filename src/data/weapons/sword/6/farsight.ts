import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 6,
  type: 'sword',
  icon: '/weapons/sword/wpn_sword_0026.webp',
  baseAtk: [51, 146, 247, 348, 449, 500],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [17, 30, 44, 57, 71, 85, 98, 112, 132],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [10, 18, 26, 34, 42, 50, 58, 66, 78],
      },
    ],
  },
  skill3: {
    triggers: [
      {
        trigger: {
          kind: 'onBattleStart',
        },
        effects: [
          {
            name: 'dreamStriving',
            kind: 'status',
            stat: { modifier: 'dmgBonus' },
            target: 'team',
            value: [5, 6, 7, 8, 9, 10, 11, 12, 14],
            duration: 20,
          },
          {
            kind: 'status',
            stat: { modifier: 'artsIntensity' },
            target: 'team',
            value: [10, 12, 14, 16, 18, 20, 22, 24, 28],
            duration: 20,
            hide: true,
          },
          {
            kind: 'status',
            stat: { modifier: 'defPercent' },
            target: 'team',
            value: [3, 3.6, 4.2, 4.8, 5.4, 6, 6.6, 7.2, 8.4],
            duration: 20,
            hide: true,
          },
        ],
      },
    ],
  },
};

export default sheet;
