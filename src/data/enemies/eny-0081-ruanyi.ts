import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Ruan Yi',
  gameId: 'eny_0081_ruanyi',
  avatar: '/Icon_Enemy/eny_0081_ruanyi.webp',
  category: '沧贼',
  tier: 'leader',
  levelHp: {
    1: 3323,
    20: 23845,
    40: 150884,
    60: 594009,
    80: 1428856,
    90: 2201192,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 20,
    nature: 20,
  },
  superArmor: 30,
  maxStagger: 300,
  staggerNodeCount: 3,
  staggerNodeDuration: 2,
  staggerBreakDuration: 15,
  finisherRecovery: 100,
};

export default sheet;
