import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Sentinel',
  gameId: 'eny_0039_agcanno',
  avatar: '/Icon_Enemy/eny_0039_agcanno.webp',
  category: '天使',
  tier: 'elite',
  levelHp: {
    1: 415,
    20: 2981,
    40: 18861,
    60: 74251,
    80: 178607,
    90: 275149,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 20,
    cryo: 0,
    electric: 0,
    nature: 20,
  },
  superArmor: 30,
  maxStagger: 200,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
