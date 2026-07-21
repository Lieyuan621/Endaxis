import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Highway Reaver',
  gameId: 'eny_0096_hsmob2',
  avatar: '/Icon_Enemy/eny_0096_hsmob2.webp',
  category: '沧贼',
  tier: 'normal',
  levelHp: {
    1: 291,
    20: 2086,
    40: 13202,
    60: 51976,
    80: 125025,
    90: 192604,
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
