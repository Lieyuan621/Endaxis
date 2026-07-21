import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Bonekrusher Arsonist',
  gameId: 'eny_0047_firebat',
  avatar: '/Icon_Enemy/eny_0047_firebat.webp',
  category: '裂地者',
  tier: 'advanced',
  levelHp: {
    1: 831,
    20: 5961,
    40: 37721,
    60: 148502,
    80: 357214,
    90: 550298,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 50,
    cryo: 0,
    electric: 0,
    nature: 0,
  },
  superArmor: 20,
  maxStagger: 170,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 7,
  finisherRecovery: 35,
};

export default sheet;
