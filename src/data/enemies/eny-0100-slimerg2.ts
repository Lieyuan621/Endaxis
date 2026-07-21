import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Acid Originium Slug α',
  gameId: 'eny_0100_slimerg2',
  avatar: '/Icon_Enemy/eny_0100_slimerg2.webp',
  category: '野外生物',
  tier: 'normal',
  levelHp: {
    1: 249,
    20: 1788,
    40: 11316,
    60: 44551,
    80: 107164,
    90: 165089,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 0,
    nature: 0,
  },
  superArmor: 5,
  maxStagger: 60,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
