import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Bonekrusher Ballista',
  gameId: 'eny_0048_hvybow',
  avatar: '/Icon_Enemy/eny_0048_hvybow.webp',
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
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 0,
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
