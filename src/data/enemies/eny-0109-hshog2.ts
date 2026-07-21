import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Imbued Quillbeast',
  gameId: 'eny_0109_hshog2',
  avatar: '/Icon_Enemy/eny_0109_hshog2.webp',
  category: '野外生物',
  tier: 'advanced',
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
    physical: 0,
    heat: 20,
    cryo: 0,
    electric: 20,
    nature: 0,
  },
  superArmor: 30,
  maxStagger: 200,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 7,
  finisherRecovery: 35,
};

export default sheet;
