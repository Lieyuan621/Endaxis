import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Spotted Rakerbeast',
  gameId: 'eny_0083_hstiger',
  avatar: '/Icon_Enemy/eny_0083_hstiger.webp',
  category: '野外生物',
  tier: 'elite',
  levelHp: {
    1: 1108,
    20: 7948,
    40: 50295,
    60: 198003,
    80: 476285,
    90: 733731,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 20,
    electric: 0,
    nature: 20,
  },
  superArmor: 30,
  maxStagger: 320,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
