import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Bonekrusher Executioner',
  gameId: 'eny_0018_lbtough',
  avatar: '/Icon_Enemy/eny_0018_lbtough.webp',
  category: '裂地者',
  tier: 'elite',
  levelHp: {
    1: 1108,
    20: 7948,
    40: 50295,
    60: 198003,
    80: 476285,
    90: 733731,
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
