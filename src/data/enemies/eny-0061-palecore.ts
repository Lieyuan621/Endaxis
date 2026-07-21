import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Marble Aggelomoirai',
  gameId: 'eny_0061_palecore',
  avatar: '/Icon_Enemy/eny_0061_palecore.webp',
  category: '天使',
  tier: 'leader',
  levelHp: {
    1: 2077,
    20: 14903,
    40: 94303,
    60: 371256,
    80: 893035,
    90: 1375745,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 0,
    nature: 0,
  },
  superArmor: 30,
  maxStagger: 200,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 24,
  finisherRecovery: 100,
};

export default sheet;
