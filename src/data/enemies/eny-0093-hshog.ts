import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Quillbeast',
  gameId: 'eny_0093_hshog',
  avatar: '/Icon_Enemy/eny_0093_hshog.webp',
  category: '野外生物',
  tier: 'advanced',
  levelHp: {
    1: 831,
    20: 5961,
    40: 37721,
    60: 148502,
    80: 357214,
    90: 550298,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 20,
    cryo: 0,
    electric: 20,
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
