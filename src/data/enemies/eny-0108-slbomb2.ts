import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Blazemist Originium Slug',
  gameId: 'eny_0108_slbomb2',
  avatar: '/Icon_Enemy/eny_0108_slbomb2.webp',
  category: '野外生物',
  tier: 'normal',
  levelHp: {
    1: 270,
    20: 1937,
    40: 12259,
    60: 48263,
    80: 116095,
    90: 178847,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 20,
    cryo: 0,
    electric: 0,
    nature: 20,
  },
  superArmor: 5,
  maxStagger: 60,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
