import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Hill Smasher',
  gameId: 'eny_0054_hsmino',
  avatar: '/Icon_Enemy/eny_0054_hsmino.webp',
  category: '沧贼',
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
