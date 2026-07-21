import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Tidewalker δ',
  gameId: 'eny_0107_wgshoal2',
  avatar: '/Icon_Enemy/eny_0107_wgshoal2.webp',
  category: '天使',
  tier: 'elite',
  levelHp: {
    1: 1869,
    20: 13413,
    40: 84872,
    60: 334130,
    80: 803731,
    90: 1238171,
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
