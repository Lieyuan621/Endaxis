import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Acid Originium Slug',
  gameId: 'eny_0073_slimerg',
  avatar: '/Icon_Enemy/eny_0073_slimerg.webp',
  category: '野外生物',
  tier: 'normal',
  levelHp: {
    1: 152,
    20: 1093,
    40: 6916,
    60: 27225,
    80: 65489,
    90: 100888,
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
  maxStagger: 60,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
