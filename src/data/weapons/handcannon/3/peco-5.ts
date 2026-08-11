import type { WeaponSheet } from '../../../types';

const sheet: WeaponSheet = {
  rarity: 3,
  type: 'handcannon',
  icon: '/weapons/handcannon/wpn_handcannon_0001.webp',
  baseAtk: [29, 83, 140, 197, 254, 283],
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [10, 18, 26, 34, 42, 51, 59, 67, 79],
      },
    ],
  },
  skill2: {},
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'atkFlat' },
        target: 'self',
        value: [12, 14.4, 16.8, 19.2, 21.6, 24, 26.4, 28.8, 33.6],
      },
    ],
  },
};

export default sheet;
