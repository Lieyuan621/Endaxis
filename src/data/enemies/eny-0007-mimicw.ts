import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Tunneling Nidwyrm',
  gameId: 'eny_0007_mimicw',
  avatar: '/Icon_Enemy/eny_0007_mimicw.webp',
  category: '野外生物',
  tier: 'advanced',
  levelHp: {
    1: 692,
    20: 4968,
    40: 31434,
    60: 123752,
    80: 297678,
    90: 458582,
  },
  def: 100,
  resistance: {
    physical: 0,
    heat: 0,
    cryo: 0,
    electric: 0,
    nature: 30,
  },
  superArmor: 20,
  maxStagger: 160,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 7,
  finisherRecovery: 35,
};

export default sheet;
