import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Redeemer Tag T1',
  icon: '/equipment/wuling01/item_equip_t4_parts_wuling01_edc_02.webp',
  slotType: 'kit',
  levelRequirement: 70,
  defense: 21,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: [43, 47, 51, 55],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'comboSkill' },
        target: 'self',
        value: [43.2, 47.52, 51.84, 56.16],
      },
    ],
  },
  setSlug: 'no-set-bonuses',
};

export default sheet;
