import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Walking Chrysopolis',
  gameId: 'eny_0077_agshield',
  avatar: '/Icon_Enemy/eny_0077_agshield.webp',
  category: '天使',
  tier: 'boss',
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
    cryo: 20,
    electric: 0,
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
