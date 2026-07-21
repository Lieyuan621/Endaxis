import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Cloud Stalker',
  gameId: 'eny_0055_hscrane',
  avatar: '/Icon_Enemy/eny_0055_hscrane.webp',
  category: '沧贼',
  tier: 'advanced',
  levelHp: {
    1: 761,
    20: 5465,
    40: 34578,
    60: 136127,
    80: 327446,
    90: 504440,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 20,
    cryo: 20,
    electric: 20,
    nature: 20,
  },
  superArmor: 20,
  maxStagger: 110,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 7,
  finisherRecovery: 35,
};

export default sheet;
