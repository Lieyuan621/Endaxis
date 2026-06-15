import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Mordvolt Resistant Battery',
  icon: '/equipment/will01/item_equip_t2_suit_will01_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 36,
  defense: 10,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 21,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'heal' },
        target: 'self',
        value: 10.5,
      },
    ],
  },
  setSlug: 'mordvolt-resistant',
};

export default sheet;
