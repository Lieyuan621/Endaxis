import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Mordvolt Resistant Vest',
  icon: '/equipment/will01/item_equip_t2_suit_will01_body_01.webp',
  slotType: 'armor',
  levelRequirement: 36,
  defense: 28.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'will' },
        target: 'self',
        value: 44,
      },
    ],
  },
  skill2: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'agility' },
        target: 'self',
        value: 29,
      },
    ],
  },
  skill3: {
    effects: [{ kind: 'status', stat: { modifier: 'hpPercent' }, target: 'self', value: 10.5 }],
  },
  setSlug: 'mordvolt-resistant',
};

export default sheet;
