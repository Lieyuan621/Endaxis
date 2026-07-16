import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Wgabyss',
  gameId: 'eny_0090_wgabyss',
  avatar: '/Icon_Enemy/eny_0090_wgabyss.webp',
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
    physical: 0,
    heat: 0,
    cryo: 20,
    electric: 20,
    nature: 0,
  },
  superArmor: 30,

  maxStagger: 640,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 13,
  finisherRecovery: 50,
};

export default sheet;
