import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Nefarith, "Bonekrusher"',
  gameId: 'eny_0078_nefarp1',
  avatar: '/Icon_Enemy/eny_0078_nefarp1.webp',
  category: '裂地者',
  tier: 'leader',
  levelHp: {
    1: 2354,
    20: 16890,
    40: 106876,
    60: 420756,
    80: 1012106,
    90: 1559178,
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
  staggerBreakDuration: 11,
  finisherRecovery: 100,
};

export default sheet;
