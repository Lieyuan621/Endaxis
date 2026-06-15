import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Miner Turbine T1',
  icon: '/equipment/tundra01/item_equip_t3_parts_tundra01_edc_01.webp',
  slotType: 'kit',
  levelRequirement: 50,
  defense: 15,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 31,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'protection' },
        target: 'self',
        value: 13.5,
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
