import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Armored Manglerbeast',
  gameId: 'eny_0113_jzogre',
  avatar: '/Icon_Enemy/eny_0113_jzogre.webp',
  category: '野外生物',
  tier: 'elite',
  levelHp: {
    1: 1177,
    20: 8445,
    40: 53438,
    60: 210378,
    80: 506053,
    90: 779589,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 20,
    cryo: 20,
    electric: 20,
    nature: 0,
  },
  superArmor: 30,
  maxStagger: 280,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 8,
  finisherRecovery: 50,
};

export default sheet;
