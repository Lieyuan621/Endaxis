import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Axe Armorbeast',
  gameId: 'eny_0071_sandb',
  avatar: '/Icon_Enemy/eny_0071_sandb.webp',
  category: '野外生物',
  tier: 'elite',
  levelHp: {
    1: 1385,
    20: 9936,
    40: 62869,
    60: 247504,
    80: 595357,
    90: 917164,
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
  maxStagger: 280,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
