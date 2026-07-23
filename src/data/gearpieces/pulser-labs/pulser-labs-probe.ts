import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Pulser Labs Probe',
  icon: '/equipment/pulse_cryst01/item_equip_t4_suit_pulse_cryst01_edc_01.webp',
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
        stat: { modifier: 'artsIntensity' },
        target: 'self',
        value: [41.4, 45.54, 49.68, 53.82],
      },
    ],
  },
  setSlug: 'pulser-labs',
};

export default sheet;
