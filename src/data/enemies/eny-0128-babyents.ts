import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Woodcraft Wanderer',
  gameId: 'eny_0128_babyents',
  avatar: '/Icon_Enemy/eny_0128_babyents.webp',
  category: '巫术造物',
  tier: 'elite',
  levelHp: {
    1: 831,
    20: 5961,
    40: 37721,
    60: 148502,
    80: 357214,
    90: 550298,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 20,
    electric: 20,
    nature: 20,
  },
  superArmor: 20,
  maxStagger: 170,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 7,
  finisherRecovery: 35,
  finisherMultiplier: 1.25,
};

export default sheet;
