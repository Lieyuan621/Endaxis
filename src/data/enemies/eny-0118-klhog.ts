import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Quillbeast Blightshade',
  gameId: 'eny_0118_klhog',
  avatar: '/Icon_Enemy/eny_0118_klhog.webp',
  category: '蚀影',
  tier: 'advanced',
  levelHp: {
    1: 969,
    20: 6955,
    40: 44008,
    60: 173253,
    80: 416750,
    90: 642014,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 0,
    cryo: 0,
    electric: 35,
    nature: 0,
  },
  superArmor: 20,
  maxStagger: 200,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 7,
  finisherRecovery: 35,
};

export default sheet;
