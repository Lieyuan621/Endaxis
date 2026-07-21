import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Rockhowler',
  gameId: 'eny_0112_jzmonk',
  avatar: '/Icon_Enemy/eny_0112_jzmonk.webp',
  category: '野外生物',
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
    heat: 20,
    cryo: 20,
    electric: 20,
    nature: 0,
  },
  superArmor: 0,
  maxStagger: 60,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
