import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Waterlamp',
  gameId: 'eny_0094_hsfly',
  avatar: '/Icon_Enemy/eny_0094_hsfly.webp',
  category: '野外生物',
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
    cryo: 0,
    electric: 20,
    nature: 20,
  },
  superArmor: 0,
  maxStagger: 80,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
