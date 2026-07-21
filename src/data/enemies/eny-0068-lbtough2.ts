import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Elite Executioner',
  gameId: 'eny_0068_lbtough2',
  avatar: '/Icon_Enemy/eny_0068_lbtough2.webp',
  category: '裂地者',
  tier: 'elite',
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
  maxStagger: 340,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
