import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Wgreflec',
  gameId: 'eny_0089_wgreflec',
  avatar: '/Icon_Enemy/eny_0089_wgreflec.webp',
  category: '天使',
  tier: 'normal',

  levelHp: {
    1: 111,
    20: 795,
    40: 5029,
    60: 19800,
    80: 47629,
    90: 73373,
  },

  def: 100,

  resistance: {
    physical: 0,
    heat: 0,
    cryo: 20,
    electric: 20,
    nature: 0,
  },
  superArmor: 0,

  maxStagger: 60,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
