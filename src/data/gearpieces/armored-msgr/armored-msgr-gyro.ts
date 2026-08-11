import type { GearPieceSheet } from '../../types';

const sheet: GearPieceSheet = {
  name: 'Armored MSGR Gyro',
  icon: '/equipment/str01/item_equip_t2_suit_str01_edc_01.webp',
  slotType: 'kit',
  levelRequirement: 36,
  defense: 10.8,
  skill1: {
    effects: [
      {
        kind: 'status',
        stat: { modifier: 'attributeFlat', attribute: 'strength' },
        target: 'self',
        value: 21,
      },
    ],
  },
  skill2: {
    effects: [{ kind: 'status', stat: { modifier: 'atkPercent' }, target: 'self', value: 10.5 }],
  },
  setSlug: 'armored-msgr',
};

export default sheet;
