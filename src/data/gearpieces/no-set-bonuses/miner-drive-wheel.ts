import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Miner Drive Wheel',
  icon: '/equipment/tundra01/item_equip_t2_parts_tundra01_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 36,
  defense: 10.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 22,
      },
    ],
  },
  skill2: {
    effects: [{ kind: 'status', stat: { modifier: 'critRate' }, target: 'self', value: 5.7 }],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
