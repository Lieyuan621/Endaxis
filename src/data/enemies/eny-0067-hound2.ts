import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Elite Ripptusk',
  gameId: 'eny_0067_hound2',
  avatar: '/Icon_Enemy/eny_0067_hound2.webp',
  category: '裂地者',
  tier: 'normal',
  levelHp: {
    1: 228,
    20: 1639,
    40: 10373,
    60: 40838,
    80: 98234,
    90: 151332,
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
  maxStagger: 90,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
