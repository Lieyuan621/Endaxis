import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Miner Comm',
  icon: '/equipment/tundra01/item_equip_t2_parts_tundra01_edc_04.webp',
  slotType: 'kit',
  levelRequirement: 36,
  defense: 10.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 22,
      },
    ],
  },
  skill2: {
    effects: [{ kind: 'status', stat: { modifier: 'hpPercent' }, target: 'self', value: 22.8 }],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
