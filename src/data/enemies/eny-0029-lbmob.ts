import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Bonekrusher Raider',
  gameId: 'eny_0029_lbmob',
  avatar: '/Icon_Enemy/eny_0029_lbmob.webp',
  category: '裂地者',
  tier: 'normal',
  levelHp: {
    1: 194,
    20: 1391,
    40: 8802,
    60: 34651,
    80: 83350,
    90: 128403,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 0,
    nature: 0,
  },
  superArmor: 0,
  maxStagger: 80,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
