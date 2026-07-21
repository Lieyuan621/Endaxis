import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Firemist Originium Slug',
  gameId: 'eny_0092_slbomb',
  avatar: '/Icon_Enemy/eny_0092_slbomb.webp',
  category: '野外生物',
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
    physical: 20,
    heat: 20,
    cryo: 0,
    electric: 0,
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
