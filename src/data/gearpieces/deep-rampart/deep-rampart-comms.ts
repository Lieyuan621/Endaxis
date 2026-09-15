import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Deep Rampart Comms',
  icon: '/equipment/spellburst/item_equip_t4_suit_spellburst_edc_01.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: [32, 35, 38, 41],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: [21, 23, 25, 27],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [41.4, 45.54, 49.68, 53.82],
      },
    ],
  },
  setSlug: 'deep-rampart',
};

export default sheet;
