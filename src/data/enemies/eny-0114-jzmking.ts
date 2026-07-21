import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Craghowler',
  gameId: 'eny_0114_jzmking',
  avatar: '/Icon_Enemy/eny_0114_jzmking.webp',
  category: '野外生物',
  tier: 'boss',
  levelHp: {
    1: 2008,
    20: 14407,
    40: 91159,
    60: 358880,
    80: 863267,
    90: 1329887,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 20,
    cryo: 20,
    electric: 20,
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
