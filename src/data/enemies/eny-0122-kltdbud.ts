import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'YSTF Elite Blightshade',
  gameId: 'eny_0122_kltdbud',
  avatar: '/Icon_Enemy/eny_0122_kltdbud.webp',
  category: '蚀影',
  tier: 'normal',
  levelHp: {
    1: 138,
    20: 994,
    40: 6287,
    60: 24750,
    80: 59536,
    90: 91716,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 0,
    cryo: 0,
    electric: 35,
    nature: 0,
  },
  superArmor: 0,
  maxStagger: 80,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
