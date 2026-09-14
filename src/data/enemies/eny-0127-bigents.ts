import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: "Gloomwald's Rage",
  gameId: 'eny_0127_bigents',
  avatar: '/Icon_Enemy/eny_0127_bigents.webp',
  category: '巫术造物',
  tier: 'boss',
  levelHp: {
    1: 3210,
    20: 15897,
    40: 100590,
    60: 396006,
    80: 952571,
    90: 1467462,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 20,
    electric: 20,
    nature: 20,
  },
  superArmor: 30,
  maxStagger: 400,
  staggerNodeCount: 1,
  staggerNodeDuration: 2,
  staggerBreakDuration: 8,
  finisherRecovery: 50,
  finisherMultiplier: 1.5,
};

export default sheet;
