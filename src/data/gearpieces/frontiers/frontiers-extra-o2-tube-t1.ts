import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Frontiers Extra O2 Tube T1',
  icon: '/equipment/atb01/item_equip_t4_suit_atb01_edc_06.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [32, 35, 38, 41],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: [21, 23, 25, 27],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributePercent', attribute: 'sub' },
        target: 'self',
        value: [20.701783501, 22.771961851, 24.842140201, 26.912318551],
      },
    ],
  },
  setSlug: 'frontiers',
};

export default sheet;
