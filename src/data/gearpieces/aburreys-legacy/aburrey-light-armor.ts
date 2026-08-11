import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Aburrey Light Armor',
  icon: '/equipment/atk01/item_equip_t3_suit_atk01_body_03.webp',
  slotType: 'armor',
  levelRequirement: 50,
  defense: 40,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: 61,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 41,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'ultimateGainEfficiency' },
        target: 'self',
        value: 8.75,
      },
    ],
  },
  setSlug: 'aburreys-legacy',
};

export default sheet;
