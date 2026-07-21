import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Blitzcrash Blightshade',
  gameId: 'eny_0120_klbear',
  avatar: '/Icon_Enemy/eny_0120_klbear.webp',
  category: '蚀影',
  tier: 'boss',
  levelHp: {
    1: 1523,
    20: 10929,
    40: 69155,
    60: 272254,
    80: 654892,
    90: 1008880,
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
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
