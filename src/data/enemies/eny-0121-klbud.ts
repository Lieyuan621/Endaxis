import type { EnemySheet } from '../types';

const sheet: EnemySheet = {
  name: 'YSTF Vanguard Blightshade',
  gameId: 'eny_0121_klbud',
  avatar: '/Icon_Enemy/eny_0121_klbud.webp',
  category: '蚀影',
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
    physical: 20,
    heat: 0,
    cryo: 0,
    electric: 0,
    nature: 0,
  },
  superArmor: 0,
  maxStagger: 80,
  staggerNodeCount: 0,
  staggerNodeDuration: 2,
  staggerBreakDuration: 6,
  finisherRecovery: 25,
};

export default sheet;
