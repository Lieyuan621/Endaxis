import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Tidewalker',
  gameId: 'eny_0091_wgshoal',
  avatar: '/Icon_Enemy/eny_0091_wgshoal.webp',
  category: '天使',
  tier: 'elite',
  levelHp: {
    1: 1246,
    20: 8942,
    40: 56582,
    60: 222753,
    80: 535821,
    90: 825447,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 20,
    electric: 20,
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
