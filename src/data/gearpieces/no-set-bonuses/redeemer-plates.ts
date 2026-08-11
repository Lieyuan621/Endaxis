import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Redeemer Plates',
  icon: '/equipment/wuling01/item_equip_t4_parts_wuling01_body_01.webp',
  slotType: 'armor',
  levelRequirement: 70,
  defense: 56,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: [115, 126, 138, 149],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'basicAttack' },
        target: 'self',
        value: [14.4, 15.84, 17.28, 18.72],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
