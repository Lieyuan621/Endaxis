import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Bonekrusher Pyromancer',
  gameId: 'eny_0046_lbshamman',
  avatar: '/Icon_Enemy/eny_0046_lbshamman.webp',
  category: '裂地者',
  tier: 'advanced',
  levelHp: {
    1: 761,
    20: 5465,
    40: 34578,
    60: 136127,
    80: 327446,
    90: 504440,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 50,
    cryo: 0,
    electric: 0,
    nature: 0,
  },
  superArmor: 20,
  maxStagger: 160,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 7,
  finisherRecovery: 35,
};

export default sheet;
