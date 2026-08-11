import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'AIC Fieldwork Armor',
  icon: '/equipment/wuling00/item_equip_t4_parts_wuling00_body_01.webp',
  slotType: 'armor',
  levelRequirement: 60,
  defense: 48,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'main' },
        target: 'self',
        value: [74, 81, 88, 96],
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'sub' },
        target: 'self',
        value: [49, 53, 58, 63],
      },
    ],
  },
  skill3: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'dmgBonus', elements: ['heat', 'cryo', 'electric', 'nature'] },
        target: 'self',
        value: [9.315789474, 10.247368421, 11.178947368, 12.110526316],
      },
    ],
  },
  setSlug: 'aic-fieldwork',
};

export default sheet;
