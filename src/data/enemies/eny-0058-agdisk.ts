import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Effigy',
  gameId: 'eny_0058_agdisk',
  avatar: '/Icon_Enemy/eny_0058_agdisk.webp',
  category: '天使',
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
    heat: 20,
    cryo: 0,
    electric: 0,
    nature: 20,
  },
  superArmor: 30,
  maxStagger: 340,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
