import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Elite Ambusher',
  gameId: 'eny_0066_lbhunt2',
  avatar: '/Icon_Enemy/eny_0066_lbhunt2.webp',
  category: '裂地者',
  tier: 'normal',
  levelHp: {
    1: 263,
    20: 1888,
    40: 11945,
    60: 47026,
    80: 113118,
    90: 174261,
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
  maxStagger: 110,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
