import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Sweeping Wind',
  gameId: 'eny_0103_hshunt2',
  avatar: '/Icon_Enemy/eny_0103_hshunt2.webp',
  category: '沧贼',
  tier: 'normal',
  levelHp: {
    1: 166,
    20: 1192,
    40: 7544,
    60: 29700,
    80: 71443,
    90: 110060,
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
