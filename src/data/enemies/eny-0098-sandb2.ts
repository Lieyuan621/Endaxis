import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Hazefyre Axe Armorbeast',
  gameId: 'eny_0098_sandb2',
  avatar: '/Icon_Enemy/eny_0098_sandb2.webp',
  category: '裂地者',
  tier: 'elite',
  levelHp: {
    1: 1800,
    20: 12916,
    40: 81729,
    60: 321755,
    80: 773964,
    90: 1192313,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 0,
    nature: 0,
  },
  superArmor: 30,
  maxStagger: 320,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
