import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Ereignis',
  gameId: 'eny_0080_reaper',
  avatar: '/Icon_Enemy/eny_0080_reaper.webp',
  category: '裂地者',
  tier: 'leader',
  levelHp: {
    1: 886,
    20: 6359,
    40: 40236,
    60: 158402,
    80: 381028,
    90: 586985,
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
  maxStagger: 280,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 20,
  finisherRecovery: 100,
};

export default sheet;
