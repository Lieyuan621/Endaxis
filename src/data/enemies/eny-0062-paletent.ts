import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Marble Appendage',
  gameId: 'eny_0062_paletent',
  avatar: '/Icon_Enemy/eny_0062_paletent.webp',
  category: '天使',
  tier: 'leader',
  levelHp: {
    1: 235,
    20: 1689,
    40: 10688,
    60: 42076,
    80: 101211,
    90: 155918,
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
  maxStagger: 0,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 100,
};

export default sheet;
