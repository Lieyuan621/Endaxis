import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Armored MSGR Flashlight T1',
  icon: '/equipment/str01/item_equip_t3_suit_str01_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 50,
  defense: 15,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 23,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 15,
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'critRate' },
        target: 'self',
        value: 7.35,
      },
    ],
  },
  setSlug: 'armored-msgr',
};

export default sheet;
