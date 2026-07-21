import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Marble Aggelomoirai',
  gameId: 'eny_0052_palesent',
  avatar: '/Icon_Enemy/eny_0052_palesent.webp',
  category: '天使',
  tier: 'leader',
  levelHp: {
    1: 4430,
    20: 31794,
    40: 201179,
    60: 792012,
    80: 1905141,
    90: 2934923,
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
  maxStagger: 320,
  staggerNodeCount: 2,
  staggerNodeDuration: 2,
  staggerBreakDuration: 11,
  finisherRecovery: 100,
};

export default sheet;
