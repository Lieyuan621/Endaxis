import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Skydrummer',
  gameId: 'eny_0082_hsbear',
  avatar: '/Icon_Enemy/eny_0082_hsbear.webp',
  category: '野外生物',
  tier: 'boss',
  levelHp: {
    1: 1661,
    20: 11923,
    40: 75442,
    60: 297005,
    80: 714428,
    90: 1100596,
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
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
