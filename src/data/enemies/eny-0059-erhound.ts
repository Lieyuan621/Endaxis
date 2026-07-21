import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Hazefyre Tuskbeast',
  gameId: 'eny_0059_erhound',
  avatar: '/Icon_Enemy/eny_0059_erhound.webp',
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
    physical: 20,
    heat: 20,
    cryo: 20,
    electric: 20,
    nature: 20,
  },
  superArmor: 0,
  maxStagger: 80,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
