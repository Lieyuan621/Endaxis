import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Pulser Labs Calibrator',
  icon: '/equipment/pulse_cryst01/item_equip_t4_suit_pulse_cryst01_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [41, 45, 49, 53],
      },
    ],
  },
  skill2: {
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
