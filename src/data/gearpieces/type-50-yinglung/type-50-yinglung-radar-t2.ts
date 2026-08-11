import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Type 50 Yinglung Radar T2',
  icon: '/equipment/atk02/item_equip_t4_suit_atk02_edc_03.webp',
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
        stat: { modifier: 'attributeFlat', attribute: 'intellect' },
        target: 'self',
        value: [21, 23, 25, 27],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', skillTypes: 'comboSkill' },
        target: 'self',
        value: [41.4, 45.54, 49.68, 53.82],
      },
    ],
  },
  setSlug: 'type-50-yinglung',
};

export default sheet;
