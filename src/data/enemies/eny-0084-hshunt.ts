import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Grove Archer',
  gameId: 'eny_0084_hshunt',
  avatar: '/Icon_Enemy/eny_0084_hshunt.webp',
  category: '沧贼',
  tier: 'normal',
  levelHp: {
    1: 180,
    20: 1292,
    40: 8173,
    60: 32175,
    80: 77396,
    90: 119231,
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
