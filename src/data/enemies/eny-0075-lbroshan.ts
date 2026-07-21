import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Bonekrusher Siegeknuckles',
  gameId: 'eny_0075_lbroshan',
  avatar: '/Icon_Enemy/eny_0075_lbroshan.webp',
  category: '裂地者',
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
    heat: 0,
    cryo: 20,
    electric: 20,
    nature: 20,
  },
  superArmor: 30,
  maxStagger: 320,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 50,
};

export default sheet;
