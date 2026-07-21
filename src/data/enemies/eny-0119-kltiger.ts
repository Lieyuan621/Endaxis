import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Rakerbeast Blightshade',
  gameId: 'eny_0119_kltiger',
  avatar: '/Icon_Enemy/eny_0119_kltiger.webp',
  category: '蚀影',
  tier: 'elite',
  levelHp: {
    1: 1246,
    20: 8942,
    40: 56582,
    60: 222753,
    80: 535821,
    90: 825447,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 0,
    cryo: 0,
    electric: 35,
    nature: 0,
  },
  superArmor: 30,
  maxStagger: 320,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
