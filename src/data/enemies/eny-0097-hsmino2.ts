import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Cloud Obliterator',
  gameId: 'eny_0097_hsmino2',
  avatar: '/Icon_Enemy/eny_0097_hsmino2.webp',
  category: '沧贼',
  tier: 'elite',
  levelHp: {
    1: 1661,
    20: 11923,
    40: 75442,
    60: 297005,
    80: 714428,
    90: 1100596,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 20,
    cryo: 20,
    electric: 20,
    nature: 20,
  },
  superArmor: 30,
  maxStagger: 320,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
