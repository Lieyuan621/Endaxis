import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Brutal Pincerbeast',
  gameId: 'eny_0099_slimeml2',
  avatar: '/Icon_Enemy/eny_0099_slimeml2.webp',
  category: '野外生物',
  tier: 'normal',
  levelHp: {
    1: 277,
    20: 1987,
    40: 12574,
    60: 49501,
    80: 119071,
    90: 183433,
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
