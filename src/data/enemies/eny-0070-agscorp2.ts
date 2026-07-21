import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Heavy Sting α',
  gameId: 'eny_0070_agscorp2',
  avatar: '/Icon_Enemy/eny_0070_agscorp2.webp',
  category: '天使',
  tier: 'advanced',
  levelHp: {
    1: 1094,
    20: 7849,
    40: 49666,
    60: 195528,
    80: 470332,
    90: 724559,
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
  maxStagger: 180,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 7.5,
  finisherRecovery: 35,
};

export default sheet;
