import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'Tuskbeast Blightshade',
  gameId: 'eny_0117_klhound',
  avatar: '/Icon_Enemy/eny_0117_klhound.webp',
  category: '蚀影',
  tier: 'normal',
  levelHp: {
    1: 125,
    20: 894,
    40: 5658,
    60: 22275,
    80: 53582,
    90: 82545,
  },
  def: 100,
  resistance: {
    physical: 20,
    heat: 0,
    cryo: 0,
    electric: 35,
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
