import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Breaking Gust',
  gameId: 'eny_0104_hsrogue2',
  avatar: '/Icon_Enemy/eny_0104_hsrogue2.webp',
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
    physical: 60,
    heat: 0,
    cryo: 20,
    electric: 0,
    nature: 20,
  },
  superArmor: 20,
  maxStagger: 110,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 7,
  finisherRecovery: 35,
};

export default sheet;
