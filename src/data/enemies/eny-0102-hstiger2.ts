import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Glaring Rakerbeast',
  gameId: 'eny_0102_hstiger2',
  avatar: '/Icon_Enemy/eny_0102_hstiger2.webp',
  category: '野外生物',
  tier: 'elite',
  levelHp: {
    1: 1869,
    20: 13413,
    40: 84872,
    60: 334130,
    80: 803731,
    90: 1238171,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 20,
    electric: 0,
    nature: 20,
  },
  superArmor: 30,
  maxStagger: 320,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 9,
  finisherRecovery: 50,
};

export default sheet;
