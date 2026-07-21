import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Triaggelos',
  gameId: 'eny_0045_agtrinit',
  avatar: '/Icon_Enemy/eny_0045_agtrinit.webp',
  category: '天使',
  tier: 'leader',
  levelHp: {
    1: 1385,
    20: 9936,
    40: 62869,
    60: 247504,
    80: 595357,
    90: 917164,
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
  maxStagger: 280,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 11,
  finisherRecovery: 100,
};

export default sheet;
