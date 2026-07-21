import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Nefarith, "Conqueror"',
  gameId: 'eny_0079_nefarp2',
  avatar: '/Icon_Enemy/eny_0079_nefarp2.webp',
  category: '裂地者',
  tier: 'leader',
  levelHp: {
    1: 2631,
    20: 18878,
    40: 119450,
    60: 470257,
    80: 1131178,
    90: 1742611,
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
  maxStagger: 480,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 16,
  finisherRecovery: 100,
};

export default sheet;
