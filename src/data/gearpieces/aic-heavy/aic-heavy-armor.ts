import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Heavy Armor',
  icon: '/equipment/stragi01/item_equip_t1_suit_stragi01_body_01.webp',
  slotType: 'armor',
  levelRequirement: 28,
  defense: 22.4,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 30,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 30,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'protection' },
        target: 'self',
        value: 3.892359443,
      },
    ],
  },
  setSlug: 'aic-heavy',
};

export default sheet;
