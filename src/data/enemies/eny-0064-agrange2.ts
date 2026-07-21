import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Sting α',
  gameId: 'eny_0064_agrange2',
  avatar: '/Icon_Enemy/eny_0064_agrange2.webp',
  category: '天使',
  tier: 'normal',
  levelHp: {
    1: 208,
    20: 1490,
    40: 9430,
    60: 37126,
    80: 89303,
    90: 137575,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 0,
    nature: 0,
  },
  superArmor: 0,
  maxStagger: 90,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
